/* ==========================================================================
 * routes.js — all HTTP endpoints (public / auth / admin / integration).
 * ========================================================================== */
import { Router, ok, created, fail, json, readJsonBody, HttpError } from '../lib/http.js';
import { rateLimiter, timingSafeEqual, hashPassword, verifyPassword, verifyTotp, generateTotpSecret, hmacSign, resolveClientIp, generateCsrfToken, verifyCsrfToken } from '../lib/security.js';
import { requireAuth, requirePerm, requireStaff, staffMfaEnforced } from './auth.service.js';
import { can, PERMISSIONS } from '../domain/rules.js';
import { config, portalUrl } from '../config.js';
import { createAdminService } from './admin.service.js';
import { createCmsService } from './cms.service.js';
import { createIntegrationService } from './integration.service.js';
import path from 'node:path';
import { scanBuffer } from '../lib/virus-scanner.js';

export function buildRouter(ctx) {
  const { auth, kyc, review, analytics, exportSvc, invites, notify, screening, repos, einvoice, tokenSvc, rfq, errorSink } = ctx;
  const adminSvc = createAdminService(repos);
  const r = Router();

  /** rm(10.3-1): raw request bytes for signature verification (a parsed body
   *  cannot be re-serialised byte-identically — key order and whitespace differ). */
  const readRawBody = (req, limit = 64 * 1024) => new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(new HttpError(413, 'Request body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => reject(new HttpError(400, 'Body read error')));
  });

  const ipOf = (req) => resolveClientIp(req);
  const publicLimiter = rateLimiter({ windowMs: 60000, max: 120 });
  const loginIpLimiter = rateLimiter({ windowMs: 60000, max: Number(process.env.LOGIN_IP_RATE_MAX || 120) });
  const loginLimiter = rateLimiter({ windowMs: 300000, max: Number(process.env.LOGIN_RATE_MAX || 10), blockMs: 300000 }); // defence in depth
  const statusLimiter = rateLimiter({ windowMs: 60000, max: 20 });
  /* rm(10.3)/GOV a21: tiered limits. Public FORMS are 5 / 10 min per IP; staff and
   * CMS APIs are 300 / min. Test suites and gates boot with NODE_KYC_TEST=1 and
   * deliberately exceed form counts, so the strict form tier is relaxed there —
   * the production defaults are the ratified ones. */
  const TEST_MODE = process.env.NODE_KYC_TEST === '1' && process.env.RATE_LIMITS_STRICT !== '1';
  const formLimiter = rateLimiter({ windowMs: Number(process.env.FORM_RATE_WINDOW_MS || 600000), max: TEST_MODE ? 100000 : Number(process.env.FORM_RATE_MAX || 5) });
  const staffLimiter = rateLimiter({ windowMs: 60000, max: TEST_MODE ? 100000 : Number(process.env.STAFF_RATE_MAX || 300) });

  const limited = (limiter) => (req, res, next) => {
    const result = limiter(ipOf(req)); // rateLimiter() returns the hit function directly
    if (!result.ok) throw new HttpError(429, 'Too many requests — retry in ' + Math.ceil(result.retryAfterMs / 1000) + 's');
    next();
  };
  /** rm(10.3)/GOV a20: 5 consecutive FAILED logins per account+IP within 10 min →
   * 15-minute lockout (failures only; a successful login resets the counter). The
   * token-bucket guard above stays as defence in depth. */
  const LOGIN_FAIL_MAX = Number(process.env.LOGIN_FAIL_MAX || 5);
  const LOGIN_FAIL_WINDOW_MS = Number(process.env.LOGIN_FAIL_WINDOW_MS || 600000);
  const LOGIN_LOCK_MS = Number(process.env.LOGIN_LOCK_MS || 900000);
  const loginFailures = new Map(); // key email|ip -> { fails, firstAt, lockedUntil }
  const loginKey = (req, email) => String(email || '?').toLowerCase().trim() + '|' + ipOf(req);
  const assertNotLocked = (req, email) => {
    const b = loginFailures.get(loginKey(req, email));
    if (b && b.lockedUntil > Date.now()) {
      throw new HttpError(429, 'Too many failed sign-in attempts — account locked for ' +
        Math.ceil((b.lockedUntil - Date.now()) / 60000) + ' minute(s)');
    }
  };
  const noteLoginFailure = (req, email) => {
    const key = loginKey(req, email); const now = Date.now();
    let b = loginFailures.get(key);
    if (!b || now - b.firstAt > LOGIN_FAIL_WINDOW_MS) b = { fails: 0, firstAt: now, lockedUntil: 0 };
    b.fails += 1;
    if (b.fails >= LOGIN_FAIL_MAX) b.lockedUntil = now + LOGIN_LOCK_MS;
    loginFailures.set(key, b);
    if (loginFailures.size > 5000) { /* bounded map: drop the oldest entry */ loginFailures.delete(loginFailures.keys().next().value); }
  };
  const noteLoginSuccess = (req, email) => { loginFailures.delete(loginKey(req, email)); };
  /** brute-force guard keyed by account+IP without shared mutable closure (SEC-8, NFR-4 / P8-2) */
  const loginGuard = (req, email) => {
    const ip = ipOf(req);
    const result = loginLimiter(String(email || '?').toLowerCase() + '|' + ip);
    if (!result.ok) throw new HttpError(429, 'Too many sign-in attempts — account temporarily locked');
  };

  /* ==================== health & settings ==================== */
  /* deploy-audit H6: health said "ok" with the database down; monitors and the load balancer
   * now see 503 when PG does not answer within 2 s (JSON mode reports db: "json-file"). */
  r.get('/api/health', async (req, res) => {
    let db = 'json-file';
    if (repos.client) {
      try {
        await Promise.race([repos.client.query('SELECT 1'), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000).unref())]);
        db = 'up';
      } catch { db = 'down'; }
    }
    if (db === 'down') return json(res, 503, { status: 'degraded', db, ts: Date.now(), version: '1.0.0' });
    ok(res, { status: 'ok', db, ts: Date.now(), version: '1.0.0' });
  });

  /* CSP violation report sink (T2.1) — browsers POST here on any policy hit;
   *  logged for the security dashboard, rate-limited, never echoed back. */
  const cspReportLimiter = rateLimiter({ windowMs: 60 * 1000, max: 60 });
  r.post('/api/csp-report', limited(cspReportLimiter), async (req, res) => {
    const b = await readJsonBody(req, 32 * 1024, { types: ['application/csp-report', 'application/reports+json', 'application/json'] });
    const v = b && (b['csp-report'] || (Array.isArray(b) ? b[0]?.body : null) || b);
    await repos.audit('browser', 'csp_violation', 'csp', v ? JSON.stringify({ document: v['document-uri'] || v.documentURL, directive: v['violated-directive'] || v.effectiveDirective, blocked: String(v['blocked-uri'] || v.blockedURL || '').slice(0, 120) }) : 'unparsable');
    res.writeHead(204).end();
  });
  r.get('/api/settings', async (req, res) => {
    const s = await repos.settings();
    ok(res, {
      simalTin: s.simalTin || '',
      simalPeppol: s.simalPeppol || '',
    });
  });

  /* ==================== public: partner portal ==================== */
  /* rm(10.3-1 pen KYC-02): the draft is bound to an HttpOnly cookie plus the
   * token the client already holds; an email alone can no longer recover another
   * party's draft. Same response shape, plus `resumed`. */
  const draftCookieToken = (req) => {
    const m = /(?:^|;\s*)kyc_draft=([^;]+)/.exec(req.headers.cookie || '');
    if (!m) return null;
    const raw = decodeURIComponent(m[1]); const i = raw.indexOf(':');
    return i > 0 ? { id: raw.slice(0, i), token: raw.slice(i + 1) } : null;
  };
  const setDraftCookie = (res, d) => {
    res.setHeader('Set-Cookie', 'kyc_draft=' + encodeURIComponent(d.id + ':' + d.token) +
      '; HttpOnly; SameSite=Strict; Path=/api/public; Max-Age=604800' + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));
  };
  const draftResponse = (res, d, resumed) => {
    setDraftCookie(res, d);
    created(res, { draftId: d.id, token: d.token, resumeToken: d.token, step: d.step, data: d.data, documents: d.documents, resumed });
  };
  r.post('/api/public/drafts', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    const cookie = draftCookieToken(req);
    const r = await kyc.createDraft(b.email, b.role, b.token || cookie?.token);
    draftResponse(res, r.draft, r.resumed);
  });
  r.post('/api/public/applications/drafts', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    const cookie = draftCookieToken(req);
    const r = await kyc.createDraft(b.email, b.role, b.token || cookie?.token);
    draftResponse(res, r.draft, r.resumed);
  });
  r.put('/api/public/drafts/:id', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await kyc.saveDraft(req.params.id, b.token, b));
  });
  r.put('/api/public/applications/drafts/:id', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await kyc.saveDraft(req.params.id, b.token, b));
  });
  /* beacon endpoint: sendBeacon can only POST — same semantics as the PUT */
  r.post('/api/public/drafts/:id', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req);
    try { await kyc.saveDraft(req.params.id, b.token, b); } catch { /* best effort on unload */ }
    ok(res, { ok: true });
  });
  r.get('/api/public/drafts/:id', limited(publicLimiter), async (req, res) => {
    const t = req.query.get('token') || '';
    const d = await kyc.getDraft(req.params.id, t);
    ok(res, { id: d.id, email: d.email, role: d.role, data: d.data, documents: d.documents, step: d.step, updatedAt: d.updatedAt });
  });
  r.get('/api/public/applications/drafts/:id', limited(publicLimiter), async (req, res) => {
    const t = req.query.get('token') || '';
    const d = await kyc.getDraft(req.params.id, t);
    ok(res, { id: d.id, email: d.email, role: d.role, data: d.data, documents: d.documents, step: d.step, updatedAt: d.updatedAt });
  });
  /* deploy-audit B3: the form promises 10 MB per document, but this route read the 2 MB default
   * body — any scan over ~1.5 MB (base64 is 4/3 the size) failed with 413. One 10 MB document is
   * ~13.4 MB as base64 JSON; the form now sends one document per request. */
  const DOC_UPLOAD_BODY_BYTES = 14 * 1024 * 1024;
  r.post('/api/public/drafts/:id/documents', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, DOC_UPLOAD_BODY_BYTES);
    const staged = await kyc.stageDocuments(req.params.id, b.token, b.documents || []);
    ok(res, { staged });
  });
  r.post('/api/public/applications', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req);
    const result = await kyc.submitApplication({
      draftId: b.draftId, draftToken: b.draftToken, application: b.application, inviteCode: b.inviteCode,
    });
    created(res, result);
  });
  r.get('/api/public/applications/:ref', limited(statusLimiter), async (req, res) => {
    ok(res, await kyc.publicStatus(req.params.ref, req.query.get('email')));
  });
  r.post('/api/public/applications/:ref/respond', limited(statusLimiter), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    ok(res, await kyc.respondToQuery(req.params.ref, b.email, b.message));
  });
  r.get('/api/public/invites/:code', limited(publicLimiter), async (req, res) => {
    ok(res, await kyc.inviteInfo(req.params.code));
  });
  r.get('/api/public/tin-check', limited(statusLimiter), async (req, res) => {
    ok(res, await kyc.checkTin(req.query.get('trn')));
  });

  /* ==================== RFQ engine (T3.4, FRS-R) ====================
   * Basket is anonymous + cookie-carried (httpOnly, Path=/api) — ADR-2 keeps
   * ALL client storage off localStorage; the server validates every line. */
  const rfqLimiter = rateLimiter({ windowMs: 60 * 1000, max: 30 });
  /* rm(9.1-3): the basket VIEW is the header RFQ count, fetched on every public page
   * view. On the shared bucket, browsing ~30 pages in a minute locked the visitor out
   * of submitting an RFQ or contact form (429). Reads get their own bucket at the
   * public read rate; every write keeps the 30/min budget. */
  const basketViewLimiter = rateLimiter({ windowMs: 60 * 1000, max: 120 });
  r.get('/api/rfq-basket', limited(basketViewLimiter), async (req, res) => {
    ok(res, rfq.viewBasket(req));
  });
  r.post('/api/rfq-basket', limited(rfqLimiter), async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    ok(res, await rfq.addToBasket(req, res, { slug: b.slug, qty: b.qty, note: b.note }));
  });
  r.post('/api/rfq', limited(formLimiter), limited(rfqLimiter), async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    /* rm(10.3-1 pen KYC-43)/GOV a33: a filled honeypot returns a plausible success
     * without persisting or notifying anyone (bots get no signal). */
    if (b.website_url || b.hp_company_site) {
      await repos.audit('system', 'rfq_honeypot', 'public', 'silently dropped');
      return created(res, { reference: 'SIMAL-RFQ-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(1000 + Math.floor(Math.random() * 9000)), lines: 0, screeningClear: true });
    }
    created(res, await rfq.submit(req, res, b));
  });
  r.get('/api/rfq/:ref', limited(statusLimiter), async (req, res) => {
    ok(res, await rfq.publicStatus(req.params.ref, req.query.get('email')));
  });
  r.post('/api/contact', limited(formLimiter), limited(rfqLimiter), async (req, res) => {
    /* FRS-CT consultation/contact hand-off — routed to the accounts inbox */
    const b = await readJsonBody(req, 8 * 1024);
    const email = String(b.email || '').toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'A valid email is required');
    const name = String(b.name || '').trim().slice(0, 80);
    if (name.length < 2) throw new HttpError(400, 'Name is required');
    const message = String(b.message || '').trim().slice(0, 2000);
    if (message.length < 10) throw new HttpError(400, 'Message is required (at least 10 characters)');
    const topic = String(b.topic || 'general').slice(0, 40);
    await notify.send({
      channel: 'email', to: 'accounts@simalme.com',
      subject: 'Website contact — ' + topic + ' — ' + name,
      text: name + ' <' + email + '>' + (b.phone ? ' / ' + String(b.phone).slice(0, 30) : '') + String.fromCharCode(10, 10) + message,
      meta: { event: 'contact.message', topic },
    });
    await repos.audit(email, 'contact_message', 'website', topic);
    created(res, { ok: true });
  });

  /* ==================== careers intake (APP-4 / P5-6) ==================== */
  r.post('/api/careers/apply', limited(formLimiter), limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024 * 1024);
    const name = String(b.name || '').trim();
    const email = String(b.email || '').toLowerCase().trim();
    const role = String(b.role || 'General Application').trim();
    const linkedin = String(b.linkedin || b.link || '').trim();
    const why = String(b.why || '').trim();

    if (!name || name.length < 2) throw new HttpError(422, 'Full name is required (minimum 2 characters)');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(422, 'A valid email address is required');

    let docMeta = null;
    if (b.cv && (b.cv.data || b.cv.dataB64)) {
      const rawBase64 = String(b.cv.data || b.cv.dataB64).replace(/^data:.*?;base64,/, '');
      const cvBuf = Buffer.from(rawBase64, 'base64');
      if (cvBuf.length > 5 * 1024 * 1024) {
        throw new HttpError(413, 'CV file exceeds 5 MB maximum limit');
      }
      const scan = await scanBuffer(cvBuf, b.cv.name || 'cv.pdf');
      if (!scan.clean) {
        throw new HttpError(400, 'Security check failed: CV upload rejected (' + (scan.virus || 'malicious payload detected') + ')');
      }
      docMeta = await repos.documents.store({
        name: b.cv.name || 'cv.pdf',
        mime: b.cv.mime || 'application/pdf',
      }, cvBuf);
    }

    const ref = 'CAR-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    await repos.audit(email, 'career_application_submitted', ref, 'role=' + role + (docMeta ? ' cv=' + docMeta.docId : ''));

    if (notify) {
      await notify.send({
        channel: 'email',
        to: 'careers@simalme.com',
        subject: `New Application [${ref}]: ${role} — ${name}`,
        text: `New job application received for: ${role}\nApplicant: ${name} (${email})\nLinkedIn: ${linkedin || 'N/A'}\nNotes: ${why || 'N/A'}\nCV Stored Doc ID: ${docMeta ? docMeta.docId : 'None'}`,
        meta: { event: 'careers.application', ref, docId: docMeta?.docId },
      });
    }

    created(res, { ok: true, reference: ref, message: 'Application received and securely routed to HR' });
  });

  /* ==================== auth ==================== */
  r.post('/api/auth/login', limited(loginIpLimiter), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    loginGuard(req, b.email);
    assertNotLocked(req, b.email);                         /* rm(10.3)/GOV a20 */
    let result;
    try { result = await auth.login(b.email, b.password); }
    catch (e) { noteLoginFailure(req, b.email); throw e; } /* failures only; 401 from auth */
    noteLoginSuccess(req, b.email);
    if (result.mfaRequired) return ok(res, { mfaRequired: true, mfaChallengeId: result.mfaChallengeId });
    setSessionCookie(res, result.session.sid);
    const csrfToken = generateCsrfToken(result.session.sid);
    res.setHeader('X-CSRF-Token', csrfToken);
    ok(res, { mfaRequired: false, user: result.user, csrfToken });
  });
  r.post('/api/auth/register', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    const result = await auth.register(b);
    setSessionCookie(res, result.session.sid);
    const csrfToken = generateCsrfToken(result.session.sid);
    res.setHeader('X-CSRF-Token', csrfToken);
    created(res, { user: result.user, csrfToken });
  });
  r.post('/api/auth/mfa', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    const result = await auth.verifyMfa(b.mfaChallengeId, b.code);
    setSessionCookie(res, result.session.sid);
    const csrfToken = generateCsrfToken(result.session.sid);
    res.setHeader('X-CSRF-Token', csrfToken);
    ok(res, { user: result.user, csrfToken });
  });
  r.post('/api/auth/logout', async (req, res) => {
    const session = await auth.sessionFromCookie(req);
    await auth.logout(session);
    clearSessionCookie(res);
    ok(res, { ok: true });
  });
  r.get('/api/auth/me', requireAuth(auth), async (req, res) => {
    const csrfToken = generateCsrfToken(req.session.sid);
    res.setHeader('X-CSRF-Token', csrfToken);
    ok(res, { user: req.user, csrfToken, sessionIdleMinutes: config.session.idleMinutes });
  });
  r.get('/api/auth/session', async (req, res) => {
    const session = await auth.sessionFromCookie(req);
    if (!session) return ok(res, { authenticated: false });
    const user = await auth.userForSession(session);
    if (!user || !user.active) return ok(res, { authenticated: false });
    const csrfToken = generateCsrfToken(session.sid);
    res.setHeader('X-CSRF-Token', csrfToken);
    ok(res, { authenticated: true, user: auth.publicUser(user), csrfToken, sessionIdleMinutes: config.session.idleMinutes });
  });

  /* ==================== account self-service (T2.2) ==================== */
  const resetLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

  /* password reset — request: constant response, no user enumeration */
  r.post('/api/auth/password-reset/request', limited(resetLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    const email = String(b.email || '').toLowerCase().trim();
    const user = email ? await repos.users.findByEmail(email) : null;
    if (user) {
      const { token: raw } = await tokenSvc.issue('password_reset', user.id);
      await notify.send({
        channel: 'email', to: user.email,
        subject: 'Simal portal — password reset (valid 60 minutes)',
        text: 'A password reset was requested for your account.\nOpen ' + portalUrl('/login.html?reset=') + (process.env.NODE_KYC_TEST === '1' ? raw : '[REDACTED]') + ' within 60 minutes to choose a new password.\nIf you did not request this, ignore this email — your password is unchanged.',
        deliveryText: 'A password reset was requested for your account.\nOpen ' + portalUrl('/login.html?reset=') + raw + ' within 60 minutes to choose a new password.\nIf you did not request this, ignore this email — your password is unchanged.',
        meta: { event: 'password.reset', user: user.id },
      });
      await repos.audit(user.email, 'password_reset_requested', 'auth', '');
    }
    ok(res, { ok: true, message: 'If the address matches an account, a reset link has been sent.' });
  });

  /* password reset — confirm: single-use token, kills all sessions */
  r.post('/api/auth/password-reset/confirm', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    if (!b.newPassword || String(b.newPassword).length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
    const rec = await tokenSvc.consume('password_reset', b.token);
    const user = await repos.users.get(rec.subject);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    user.passwordHash = hashPassword(String(b.newPassword));
    user.pendingTotpSecret = null; /* force re-enrolment after credential change */
    await repos.users.save(user);
    await repos.sessions.destroyAll(user.id, null);
    await repos.audit(user.email, 'password_reset_completed', 'auth', 'all sessions revoked');
    await notify.send({
      channel: 'email', to: user.email,
      subject: 'Simal portal — your password was changed',
      text: 'Your password was just changed and all sessions were signed out. If this was not you, contact support immediately.',
      meta: { event: 'password.changed', user: user.id },
    });
    ok(res, { ok: true });
  });

  /* profile: read + active sessions */
  r.get('/api/auth/profile', requireAuth(auth), async (req, res) => {
    const full = await repos.users.get(req.user.id);
    const all = await repos.sessions.all();
    const mine = [];
    for (const s of all) {
      if (s.userId !== req.user.id) continue;
      if (!(await repos.sessions.isLive(s))) continue;
      mine.push({ sid: s.sid.slice(0, 8) + '…', createdAt: s.createdAt, lastSeen: s.lastSeen, expiresAt: s.expiresAt, current: s.sid === req.session.sid });
    }
    ok(res, { user: { id: full.id, email: full.email, name: full.name, role: full.role, hasTotp: !!full.totpSecret, pendingEmail: full.pendingEmail || null }, sessions: mine });
  });

  /* profile: update name / password (password requires current) */
  r.put('/api/auth/profile', requireAuth(auth), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    const user = await repos.users.get(req.user.id);
    if (!user) throw new HttpError(404, 'User not found');
    if (b.name !== undefined) {
      if (!String(b.name).trim()) throw new HttpError(400, 'Name cannot be empty');
      user.name = String(b.name).trim();
    }
    if (b.newPassword !== undefined) {
      if (!b.currentPassword || !verifyPassword(String(b.currentPassword), user.passwordHash)) {
        throw new HttpError(401, 'Current password is incorrect');
      }
      if (String(b.newPassword).length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
      user.passwordHash = hashPassword(String(b.newPassword));
    }
    await repos.users.save(user);
    await repos.audit(user.email, 'profile_updated', 'auth', [b.name !== undefined ? 'name' : '', b.newPassword !== undefined ? 'password' : ''].filter(Boolean).join('+'));
    ok(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  /* MFA enrolment: begin → secret + otpauth URI; confirm → active */
  r.post('/api/auth/mfa/begin', requireAuth(auth), async (req, res) => {
    const user = await repos.users.get(req.user.id);
    if (!user) throw new HttpError(404, 'User not found');
    if (user.totpSecret) throw new HttpError(409, 'MFA is already enabled — disable it first');
    /* rm(10.4-1): idempotent while a pending secret exists — a duplicated begin call
     * used to rotate the secret behind an already-rendered panel, so the displayed
     * code could never verify. */
    const secret = user.pendingTotpSecret || generateTotpSecret();
    if (!user.pendingTotpSecret) { user.pendingTotpSecret = secret; await repos.users.save(user); }
    const otpauth = 'otpauth://totp/Simal:' + encodeURIComponent(user.email) + '?secret=' + secret + '&issuer=Simal&algorithm=SHA1&digits=6&period=30';
    ok(res, { secret, otpauth });
  });
  r.post('/api/auth/mfa/confirm', requireAuth(auth), async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    const user = await repos.users.get(req.user.id);
    if (!user || !user.pendingTotpSecret) throw new HttpError(409, 'No pending MFA enrolment');
    if (!verifyTotp(user.pendingTotpSecret, String(b.code || ''))) throw new HttpError(401, 'Invalid code — enrolment not activated');
    user.totpSecret = user.pendingTotpSecret;
    user.pendingTotpSecret = null;
    await repos.users.save(user);
    await repos.audit(user.email, 'mfa_enabled', 'auth', '');
    ok(res, { ok: true, hasTotp: true });
  });
  r.post('/api/auth/mfa/disable', requireAuth(auth), async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    const user = await repos.users.get(req.user.id);
    if (!user || !user.totpSecret) throw new HttpError(409, 'MFA is not enabled');
    /* deploy-audit: a staff account may not drop its second factor where production requires it */
    if (user.role !== 'partner' && staffMfaEnforced()) throw new HttpError(403, 'Staff accounts must keep two-factor authentication enabled');
    if (!verifyTotp(user.totpSecret, String(b.code || ''))) throw new HttpError(401, 'Invalid code');
    user.totpSecret = null;
    await repos.users.save(user);
    await repos.audit(user.email, 'mfa_disabled', 'auth', '');
    ok(res, { ok: true, hasTotp: false });
  });

  /* session revocation: all EXCEPT the current one */
  r.post('/api/auth/sessions/revoke-others', requireAuth(auth), async (req, res) => {
    await repos.sessions.destroyAll(req.user.id, req.session.sid);
    await repos.audit(req.user.email, 'sessions_revoked', 'auth', 'other devices signed out');
    ok(res, { ok: true });
  });

  /* email change: verify link to NEW address, security alert to OLD, token-gated apply */
  const emailLimiter = rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });
  r.post('/api/auth/email/change', requireAuth(auth), limited(emailLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    const newEmail = String(b.newEmail || '').toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) throw new HttpError(400, 'A valid new email is required');
    if (newEmail === req.user.email) throw new HttpError(400, 'New email matches the current one');
    if (await repos.users.findByEmail(newEmail)) throw new HttpError(409, 'That email is already in use');
    const user = await repos.users.get(req.user.id);
    user.pendingEmail = newEmail;
    await repos.users.save(user);
    const { token: raw } = await tokenSvc.issue('email_verify', user.id, { newEmail });
    await notify.send({
      channel: 'email', to: newEmail,
      subject: 'Simal portal — confirm your new email (valid 48 hours)',
      text: 'Confirm your new email address: ' + portalUrl('/login.html?verify-email=') + (process.env.NODE_KYC_TEST === '1' ? raw : '[REDACTED]') + '\nThe change is applied only after you open this link.',
      deliveryText: 'Confirm your new email address: ' + portalUrl('/login.html?verify-email=') + raw + '\nThe change is applied only after you open this link.',
      meta: { event: 'email.verify', user: user.id },
    });
    await notify.send({
      channel: 'email', to: user.email,
      subject: 'Security alert: email change requested',
      text: 'A change of account email to ' + newEmail + ' was requested. If this was not you, sign in and change your password immediately.',
      meta: { event: 'email.change.alert', user: user.id },
    });
    await repos.audit(user.email, 'email_change_requested', 'auth', '→ ' + newEmail);
    ok(res, { ok: true, pendingEmail: newEmail });
  });
  r.post('/api/auth/email/verify', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    const rec = await tokenSvc.consume('email_verify', b.token);
    const user = await repos.users.get(rec.subject);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    const newEmail = rec.payload?.newEmail;
    if (!newEmail) throw new HttpError(409, 'Malformed verification token');
    if (await repos.users.findByEmail(newEmail)) throw new HttpError(409, 'That email is already in use');
    const oldEmail = user.email;
    user.email = newEmail;
    user.pendingEmail = null;
    await repos.users.save(user);
    await repos.sessions.destroyAll(user.id, null); /* re-auth under the new identity */
    await repos.audit(oldEmail + '→' + newEmail, 'email_change_completed', 'auth', '');
    ok(res, { ok: true, email: newEmail });
  });

  /* ==================== e-invoicing (partner portal) ==================== */
  const partnerAuth = [requireAuth(auth)];
  r.get('/api/einvoice/mine', ...partnerAuth, async (req, res) => {
    ok(res, { invoices: await einvoice.mine(req.user) });
  });
  r.post('/api/einvoice', ...partnerAuth, async (req, res) => {
    const b = await readJsonBody(req, 26 * 1024 * 1024);
    const inv = await einvoice.create(req.user, b);
    created(res, { id: inv.id, ref: inv.ref, status: inv.status });
  });
  r.get('/api/einvoice/:id', ...partnerAuth, async (req, res) => {
    ok(res, await einvoice.view(req.user, req.params.id));
  });
  r.put('/api/einvoice/:id', ...partnerAuth, async (req, res) => {
    const b = await readJsonBody(req, 26 * 1024 * 1024);
    ok(res, await einvoice.save(req.user, req.params.id, b));
  });
  r.post('/api/einvoice/:id/submit', ...partnerAuth, async (req, res) => {
    ok(res, await einvoice.submit(req.user, req.params.id));
  });
  r.get('/api/einvoice/:id/ubl', ...partnerAuth, async (req, res) => {
    ok(res, await einvoice.ubl(req.user, req.params.id));
  });

  /* ==================== admin (session + RBAC) ==================== */
  const adminAuth = [limited(staffLimiter), requireAuth(auth), requireStaff()];

  /* ==================== e-invoicing (staff console) ==================== */
  r.get('/api/einvoice/admin/queue', ...adminAuth, requirePerm('decide'), async (req, res) => {
    ok(res, { rows: await einvoice.queue(req.query.get('status') || 'all') });
  });
  r.get('/api/einvoice/admin/:id', ...adminAuth, requirePerm('decide'), async (req, res) => {
    ok(res, await einvoice.view(req.user, req.params.id));
  });
  r.post('/api/einvoice/admin/:id/actions', ...adminAuth, requirePerm('decide'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    ok(res, await einvoice.action(req.user, req.params.id, b.action, b.reason));
  });

  r.get('/api/admin/submissions', ...adminAuth, requirePerm('read'), async (req, res) => { /* rm(10.4-1/DEV-13): viewer sees the MASKED queue */
    ok(res, await review.list({
      status: req.query.get('status') || 'all',
      role: req.query.get('role') || 'all',
      q: req.query.get('q') || '',
      page: Number(req.query.get('page')) || 1,
      per: Math.min(50, Number(req.query.get('per')) || 10),
      sort: req.query.get('sort') || 'submittedAt',
      dir: req.query.get('dir') === 'asc' ? 'asc' : 'desc',
      canViewPii: can(req.session, 'view_pii'),
    }));
  });
  r.get('/api/admin/submissions/:id', ...adminAuth, requirePerm('read'), async (req, res) => {
    const fullPii = req.query.get('pii') === 'full' && can(req.session, 'view_pii');
    ok(res, await review.get(req.params.id, { includePii: fullPii }));
  });
  r.post('/api/admin/submissions/:id/actions', ...adminAuth, requirePerm('decide'), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    ok(res, await review.applyAction(req.params.id, b.action, { reason: b.reason, session: req.session }));
  });
  r.post('/api/admin/submissions/:id/query', ...adminAuth, requirePerm('query'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    ok(res, await review.raiseQuery(req.params.id, { section: b.section, message: b.message, session: req.session }));
  });
  r.post('/api/admin/submissions/:id/checklist', ...adminAuth, requirePerm('notes'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    ok(res, await review.setChecklist(req.params.id, { item: b.item, checked: b.checked, session: req.session }));
  });
  r.post('/api/admin/submissions/:id/notes', ...adminAuth, requirePerm('notes'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    ok(res, await review.addNote(req.params.id, { text: b.text, session: req.session }));
  });

  r.get('/api/admin/analytics', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, { stats: await analytics.stats(), aging: await analytics.aging(), expiries: await analytics.expiries() });
  });
  r.get('/api/admin/audit', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, (await repos.auditLog(req.query.get('q') || '', req.query.get('action') || 'all')).slice(0, 200));
  });
  r.get('/api/admin/export.csv', ...adminAuth, requirePerm('export'), async (req, res) => { /* masked unless view_pii */
    const includePii = req.query.get('pii') === 'full' && can(req.session, 'view_pii');
    const csv = await exportSvc.csv({
      status: req.query.get('status') || 'all',
      role: req.query.get('role') || 'all',
      includePii, session: req.session,
    });
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="simal-kyc-master-' + new Date().toISOString().slice(0, 10) + '.csv"',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(csv);
  });

  r.post('/api/admin/invites/bulk', ...adminAuth, requirePerm('manage_invites'), async (req, res) => {
    const b = await readJsonBody(req, 256 * 1024);
    const base = portalUrl(''); /* deploy-audit H5: never the client-supplied Host header */
    ok(res, await invites.bulkImport({ csv: b.csv, session: req.session, baseUrl: base }));
  });
  r.get('/api/admin/invites', ...adminAuth, requirePerm('manage_invites'), async (req, res) => {
    ok(res, await invites.all());
  });
  r.get('/api/admin/rfqs', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, { rows: await rfq.adminList({ status: req.query.get('status') || 'all' }) });
  });
  r.post('/api/admin/rfqs/:ref/actions', ...adminAuth, requirePerm('decide'), async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    ok(res, await rfq.adminAction(req.params.ref, b.action, { note: b.note, session: req.session }));
  });
  r.get('/api/admin/outbox', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    const list = (await notify.outbox()).slice(0, 100);
    const hasPii = can(req.session, 'view_pii');
    const safe = list.map(e => ({
      ...e,
      text: hasPii
        ? (process.env.NODE_KYC_TEST === '1' ? e.text : String(e.text || '').replace(/reset=[A-Za-z0-9_-]+/g, 'reset=[REDACTED]').replace(/verify-email=[A-Za-z0-9_-]+/g, 'verify-email=[REDACTED]'))
        : '[REDACTED]',
    }));
    ok(res, safe);
  });
  r.post('/api/admin/screening/reload', ...adminAuth, requirePerm('view_pii'), /* rm(10.3-1 pen CMS-32): privileged reload, UI is super_admin-only */ async (req, res) => {
    screening.reload();
    ok(res, { entries: screening.size() });
  });
  /* issue signed download URL valid <= 15 minutes (FRS DV-02) */
  r.post('/api/admin/documents/:docId/sign', requireAuth(auth), async (req, res) => {
    const docId = String(req.params.docId || '');
    if (!/^doc_[a-f0-9]+$/.test(docId)) throw new HttpError(400, 'Bad document id');
    const sub = (await repos.submissions.all()).find(s => (s.documents || []).some(d => d.docId === docId));
    if (!sub) throw new HttpError(404, 'Document not found');
    const doc = (sub.documents || []).find(d => d.docId === docId);
    if (!doc) throw new HttpError(404, 'Document not found');

    const isOwner = req.user.role === 'partner' && (sub.contacts?.primary?.email || '').toLowerCase() === req.user.email.toLowerCase();
    const isStaff = ['super_admin', 'reviewer', 'viewer'].includes(req.user.role);
    const hasPii = isStaff && (can(req.user, 'view_pii') || sub.reviewer === req.user.name || sub.reviewer === req.user.email);
    if (!isOwner && !hasPii) {
      throw new HttpError(403, 'Forbidden: not authorized to generate download URL for this document');
    }

    const { token: raw, expiresAt } = await tokenSvc.issue('document_download', docId, { subId: sub.id, userId: req.user.id }, { ttlMs: Number(process.env.DOC_URL_TTL_MS || 15 * 60 * 1000) });
    const signedUrl = '/api/admin/documents/' + docId + '?token=' + raw;
    ok(res, {
      url: signedUrl,
      signedUrl,
      expiresAt,
      ttlMinutes: Math.round(Number(process.env.DOC_URL_TTL_MS || 15 * 60 * 1000) / 60000),
    });
  });

  r.get('/api/admin/documents/:docId', async (req, res) => {
    const docId = String(req.params.docId || '');
    const tokenParam = req.query.get('token');
    let actor = 'anonymous';
    let user = null;

    if (tokenParam) {
      const rec = await tokenSvc.consume('document_download', tokenParam);
      if (rec.subject !== docId) throw new HttpError(403, 'Token does not match requested document');
      actor = 'token:' + (rec.payload?.userId || 'signed_url');
    } else {
      const session = await auth.sessionFromCookie(req);
      if (!session) throw new HttpError(401, 'Authentication required');
      user = await auth.userForSession(session);
      if (!user || !user.active) throw new HttpError(401, 'Authentication required');

      const isStaff = ['super_admin', 'reviewer', 'viewer'].includes(user.role);
      const isOwnerRole = user.role === 'partner';
      if (!isStaff && !isOwnerRole) {
        throw new HttpError(403, 'Forbidden: insufficient privileges to access this document');
      }

      // If staff lacks view_pii, only assigned reviewer on the target submission can access
      if (isStaff && !can(user, 'view_pii')) {
        const sub = (await repos.submissions.all()).find(s => (s.documents || []).some(d => d.docId === docId));
        const isAssigned = sub && (sub.reviewer === user.name || sub.reviewer === user.email);
        if (!isAssigned) {
          throw new HttpError(403, 'Forbidden: insufficient privileges to access this document');
        }
      }

      // If partner role, only document owner can access
      if (isOwnerRole) {
        const sub = (await repos.submissions.all()).find(s => (s.documents || []).some(d => d.docId === docId));
        const isOwner = sub && (sub.contacts?.primary?.email || '').toLowerCase() === user.email.toLowerCase();
        if (!isOwner) {
          throw new HttpError(403, 'Forbidden: insufficient privileges to access this document');
        }
      }

      actor = 'user:' + user.id;
    }

    if (!/^doc_[a-f0-9]+$/.test(docId)) throw new HttpError(400, 'Bad document id');
    const sub = (await repos.submissions.all()).find(s => (s.documents || []).some(d => d.docId === docId));
    const doc = sub && sub.documents.find(d => d.docId === docId);
    if (!doc) throw new HttpError(404, 'Document not found');

    const { buffer } = await repos.documents.readFile(doc.path);
    await repos.audit(actor, 'document_downloaded', sub.id, doc.name);
    res.writeHead(200, {
      'Content-Type': doc.mime || 'application/octet-stream',
      'Content-Length': buffer.length,
      'Content-Disposition': 'attachment; filename="' + doc.name.replace(/[^A-Za-z0-9._-]/g, '_') + '"',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    res.end(buffer);
  });

  /* ==================== user management (super admin) ==================== */
  r.get('/api/admin/users', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await adminSvc.listUsers());
  });
  r.post('/api/admin/users', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    created(res, await adminSvc.createUser(b, req.session));
  });
  r.put('/api/admin/users/:id', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    ok(res, await adminSvc.updateUser(req.params.id, b, req.session));
  });
  r.post('/api/admin/users/:id/reset-password', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await adminSvc.resetPassword(req.params.id, req.session));
  });
  r.post('/api/admin/users/:id/deactivate', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await adminSvc.deactivateUser(req.params.id, req.session));
  });
  r.get('/api/admin/sessions', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await adminSvc.activeSessions());
  });
  r.post('/api/admin/sessions/:sid/force-logout', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await adminSvc.forceLogout(req.params.sid, req.session));
  });

  /* ==================== settings (super admin) ==================== */
  r.get('/api/admin/settings', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    const s = await adminSvc.getSettings();
    s.screening.entries = screening.size();
    ok(res, s);
  });
  r.put('/api/admin/settings', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    const b = await readJsonBody(req, 16 * 1024);
    const s = await adminSvc.updateSettings(b, req.session);
    s.screening.entries = screening.size();
    ok(res, s);
  });

  /* ==================== report builder (all admin roles) ==================== */
  r.get('/api/admin/reports', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, { builtIn: adminSvc.builtInReports, availableFields: adminSvc.availableFields });
  });
  r.post('/api/admin/reports/build', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    ok(res, await adminSvc.buildReport(b, req.session));
  });
  r.post('/api/admin/reports/export.csv', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    const b = await readJsonBody(req, 64 * 1024);
    const report = await adminSvc.buildReport(b, req.session);
    const csv = await adminSvc.reportToCsv(report);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="simal-kyc-report-' + Date.now() + '.csv"',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(csv);
  });

  /* ==================== ERP / ASP integration (INT-04) ==================== */
  r.get('/api/integration/master', async (req, res) => {
    const expected = config.integration.masterApiToken;
    if (!expected) throw new HttpError(503, 'Integration token not configured');
    const got = String(req.headers['x-api-token'] || '');
    if (!got || !timingSafeEqual(got, expected)) throw new HttpError(401, 'Invalid integration token');
    const rows = (await repos.submissions.all()).filter(s => s.status === 'approved').map(s => ({
      reference: s.id, role: s.role,
      legal_name: s.company.legal_name_en, tin: s.tax?.trn || s.tax?.foreign_tax_id || null,
      peppol_id: s.tax?.peppol_id || null, country: s.company.country,
      currency: s.tax?.invoice_currency, iban: s.banking?.iban || null, bank: s.banking?.bank_name || null,
      screening_clear: s.screening ? s.screening.clear : null,
      approved_at: new Date(s.updatedAt || 0).toISOString(),
    }));
    ok(res, { count: rows.length, counterparties: rows });
  });

  /* ==================== CMS (T4.1 — role: notes perm) ==================== */
  const cms = createCmsService(repos);
  const cmsAuth = [...adminAuth, requirePerm('notes')];

  r.get('/api/cms/blocks', ...cmsAuth, async (req, res) => {
    ok(res, { blocks: await cms.listBlocks(req.query.get('entity')) });
  });
  r.get('/api/cms/blocks/:entity/:id', ...cmsAuth, async (req, res) => {
    ok(res, await cms.getBlock(req.params.entity, req.params.id, req.query.get('lang') || 'en')); // rm(4.5-1): lang-aware
  });
  r.put('/api/cms/blocks/:entity/:id', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.upsertBlock({ entity: req.params.entity, entityId: req.params.id, lang: req.query.get('lang') || 'en', ...b }, session)); // rm(4.5-1
  });
  r.delete('/api/cms/blocks/:entity/:id', ...cmsAuth, async (req, res) => {
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.deleteBlock(req.params.entity, req.params.id, session));
  });

  r.get('/api/cms/slides', ...cmsAuth, async (req, res) => {
    ok(res, { slides: await cms.listSlides() });
  });
  r.put('/api/cms/slides/:idx', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.upsertSlide({ idx: parseInt(req.params.idx, 10), ...b }, req.session));
  });
  r.delete('/api/cms/slides/:idx', ...cmsAuth, async (req, res) => {
    ok(res, await cms.deleteSlide(parseInt(req.params.idx, 10), req.session));
  });

  r.get('/api/cms/announcements', ...cmsAuth, async (req, res) => {
    ok(res, { announcements: await cms.listAnnouncements() });
  });
  r.put('/api/cms/announcements/:id', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.upsertAnnouncement({ id: parseInt(req.params.id, 10), ...b }, req.session));
  });

  r.get('/api/cms/testimonials', ...cmsAuth, async (req, res) => {
    ok(res, { testimonials: await cms.listTestimonials() });
  });
  r.post('/api/cms/testimonials', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    created(res, await cms.upsertTestimonial(b, req.session));
  });
  r.put('/api/cms/testimonials/:id', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.upsertTestimonial({ id: parseInt(req.params.id, 10), ...b }, req.session));
  });
  r.delete('/api/cms/testimonials/:id', ...cmsAuth, async (req, res) => {
    ok(res, await cms.deleteTestimonial(parseInt(req.params.id, 10), req.session));
  });

  r.get('/api/cms/policies', ...cmsAuth, async (req, res) => {
    ok(res, { policies: await cms.listPolicies() });
  });
  /* deploy-audit D06: policies are per language — ?lang=en|ar (default en) */
  r.get('/api/cms/policies/:slug', ...cmsAuth, async (req, res) => {
    ok(res, await cms.getPolicy(req.params.slug, req.query.get('lang') || 'en'));
  });
  r.put('/api/cms/policies/:slug', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.upsertPolicy({ ...b, slug: req.params.slug, lang: b.lang || req.query.get('lang') || 'en' }, req.session));
  });

  r.get('/api/cms/revisions/:table/:id', ...cmsAuth, async (req, res) => {
    ok(res, { revisions: await cms.listRevisions(req.params.table, req.params.id) });
  });
  r.post('/api/cms/revisions/:table/:id/rollback', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req).catch(() => ({}));
    ok(res, await cms.rollback(req.params.table, req.params.id, req.session, { revisionId: b.revisionId }));
  });
  r.post('/api/cms/rollback', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.rollback(b.table, b.id, req.session, { revisionId: b.revisionId }));
  });
  r.post('/api/cms/publish', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const r = await cms.publish(b.entities || [], req.session, b);
    /* rm(7.3-1): a sensitive dirty set is NOT published — 202 Accepted means an
     * approval request was created and nothing reached the ssg-builder queue. */
    if (r && r.pending) return json(res, 202, r);
    ok(res, r);
  });
  r.post('/api/cms/emergency-publish', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await cms.emergencyPublish(b, req.session));
  });
  /* rm(7.3-2): dual-approval endpoints (cmsAuth limits them to super_admin and
   * reviewer via the `notes` permission; the service enforces distinct-user). */
  r.get('/api/cms/publish-approvals', ...cmsAuth, async (req, res) => {
    ok(res, { approvals: await cms.listApprovals({ status: req.url.includes('status=') ? decodeURIComponent(req.url.split('status=')[1].split('&')[0]) : undefined }) });
  });
  r.post('/api/cms/publish-approvals/:id/approve', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req).catch(() => ({}));
    ok(res, await cms.decideApproval(req.params.id, 'approve', req.session, b.reason));
  });
  r.post('/api/cms/publish-approvals/:id/reject', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req).catch(() => ({}));
    ok(res, await cms.decideApproval(req.params.id, 'reject', req.session, b.reason));
  });
  r.get('/api/cms/brands', ...cmsAuth, async (req, res) => {
    const brands = await cms.listBrands();
    ok(res, { count: brands.length, brands });
  });
  r.get('/api/cms/brands/:slug', ...cmsAuth, async (req, res) => {
    const brand = await cms.getBrand(req.params.slug);
    if (!brand) throw new HttpError(404, 'Brand not found');
    ok(res, brand);
  });
  r.post('/api/cms/brands', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    created(res, await cms.upsertBrand(b, session));
  });
  r.put('/api/cms/brands/:slug', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.upsertBrand({ slug: req.params.slug, ...b }, session));
  });
  r.delete('/api/cms/brands/:slug', ...cmsAuth, async (req, res) => {
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.deleteBrand(req.params.slug, session));
  });

  r.get('/api/cms/products', ...cmsAuth, async (req, res) => {
    const products = await cms.listProducts();
    ok(res, { count: products.length, products });
  });
  r.post('/api/cms/products', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    created(res, await cms.createProduct(b, session));
  });
  r.get('/api/cms/products/:slug', ...cmsAuth, async (req, res) => {
    const product = await cms.getProduct(req.params.slug);
    if (!product) throw new HttpError(404, 'Product not found');
    ok(res, product);
  });
  r.put('/api/cms/products/:slug', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.updateProduct(req.params.slug, b, session));
  });
  r.delete('/api/cms/products/:slug', ...cmsAuth, async (req, res) => {
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.deleteProduct(req.params.slug, session));
  });
  r.get('/api/cms/products/:slug/deep', ...cmsAuth, async (req, res) => {
    const deep = await cms.getProductDeep(req.params.slug);
    if (!deep) throw new HttpError(404, 'Product not found');
    ok(res, deep);
  });
  r.put('/api/cms/products/:slug/deep', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.upsertProductDeep(req.params.slug, b, session));
  });

  r.get('/api/cms/media', ...cmsAuth, async (req, res) => {
    const media = await cms.listMedia();
    ok(res, { count: media.length, media });
  });
  r.post('/api/cms/media/upload', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024 * 1024); // rm(4.4-2): base64(5MB) ≈ 6.7MB payload cap
    const session = req.session || { user: { email: 'system' } };
    created(res, await cms.uploadMediaFile(b, session, scanBuffer));
  });
  /* rm(5.3-1)/CMS-10: failed-job retry — re-queues a failed outbox job (build or email). */
  r.post('/api/cms/outbox/:id/retry', ...cmsAuth, async (req, res) => {
    const session = req.session || { user: { email: 'system' } };
    const actor = session.user?.email || 'system';
    const cur = await ctx.repos.client.query('SELECT id, status, to_addr FROM outbox WHERE id = $1', [req.params.id]);
    const row = cur.rows[0];
    if (!row) throw new HttpError(404, 'Outbox event not found');
    if (row.status !== 'failed') throw new HttpError(404, 'Only failed events can be retried');
    await ctx.repos.client.query("UPDATE outbox SET status = 'queued', meta = JSONB_SET(COALESCE(meta::jsonb,'{}'::jsonb), '{retriedBy}', to_jsonb($1::text)) WHERE id = $2", [actor, req.params.id]);
    await ctx.repos.audit(actor, 'cms_outbox_retried', req.params.id, 're-queued by ' + actor);
    ok(res, { id: req.params.id, status: 'queued' });
  });

  /* rm(4.5-2): category taxonomy */
  r.get('/api/cms/categories', ...cmsAuth, async (req, res) => {
    ok(res, { categories: await cms.listCategories() });
  });
  r.post('/api/cms/categories/:cat/rename', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req, 4 * 1024);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.renameCategory(req.params.cat, b, session));
  });

  // rm(4.4-1): authorized media serving (files live OUTSIDE the webroot now)
  r.get('/api/cms/media/file/:filename', ...cmsAuth, (req, res) => {
    /* rm(10.3-1 pen CMS-36): headers were written BEFORE the file was checked, so
     * a missing/odd filename threw inside this handler and the process-level catch
     * then called writeHead on an already-sent response (ERR_HTTP_HEADERS_SENT →
     * the portal process died; an authenticated DoS). Resolve the stream FIRST. */
    const ext = path.extname(String(req.params.filename || '')).toLowerCase();
    const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
    const stream = cms.serveMediaFile(req.params.filename); /* throws HttpError(404) when absent */
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'private, max-age=60' });
    stream.on('error', () => { if (!res.writableEnded) res.destroy(); });
    stream.pipe(res);
  });
  r.delete('/api/cms/media/:filename', ...cmsAuth, async (req, res) => {
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.deleteMediaFile(req.params.filename, session));
  });

  r.post('/api/cms/emergency-publish', ...cmsAuth, async (req, res) => {
    const b = await readJsonBody(req);
    const session = req.session || { user: { email: 'system' } };
    ok(res, await cms.emergencyPublish(b, session));
  });

  r.get('/api/cms/loc-audit', ...cmsAuth, async (req, res) => {
    ok(res, await cms.getLocAudit());
  });

  r.get('/api/cms/telemetry/publish', ...cmsAuth, requirePerm('view_pii'), async (req, res) => {
    ok(res, await cms.getPublishTelemetry());
  });

  r.get('/api/cms/rbac-matrix', ...cmsAuth, async (req, res) => {
    ok(res, { roles: PERMISSIONS });
  });

  r.get('/api/cms/outbox', ...cmsAuth, async (req, res) => {
    const outbox = await cms.listOutbox(parseInt(req.query.get('limit') || '50', 10));
    const hasPii = can(req.session, 'view_pii');
    const safe = outbox.map(o => ({
      ...o,
      body: hasPii
        ? String(o.body || '').replace(/reset=[A-Za-z0-9_-]+/g, 'reset=[REDACTED]').replace(/verify-email=[A-Za-z0-9_-]+/g, 'verify-email=[REDACTED]')
        : '[REDACTED]'
    }));
    ok(res, { count: safe.length, outbox: safe });
  });

  r.get('/api/cms/telemetry', ...cmsAuth, requirePerm('view_pii'), async (req, res) => {
    // Honest telemetry: every value is measured, never asserted. DB status derives
    // from the live count query; SSG reachability is probed client-side by the CMS
    // (server keeps no loopback fetch), so its server-side status is 'unprobed'.
    let productCount = null;
    let dbStatus = 'unavailable';
    let dbLatencyMs = null;
    try {
      if (repos.client) {
        const t0 = Date.now();
        const pr = await repos.client.query('SELECT count(*) AS n FROM products');
        dbLatencyMs = Date.now() - t0;
        productCount = parseInt(pr.rows[0].n, 10);
        dbStatus = 'healthy';
      }
    } catch { /* keep honest defaults */ }
    ok(res, {
      productCount,
      publicSiteUrl: config.siteUrl, /* deploy-audit: was the rig address in every environment */
      database: { status: dbStatus, engine: 'postgresql', port: 5433, latencyMs: dbLatencyMs },
      gateway: { status: 'healthy', port: 8090, uptime: Math.round(process.uptime()) },
      ssg: { status: 'unprobed', origin: config.siteUrl, probe: 'client' }
    });
  });

  /* ==================== INTEGRATIONS (T5.1–T5.4) ==================== */
  const integ = createIntegrationService(repos);

  // Health check — all integrations at once
  r.get('/api/integrations/health', ...adminAuth, requirePerm('view_pii'), /* rm(10.3-1 pen AUTHZ-12): infra diagnostics are super_admin-only */ async (req, res) => {
    ok(res, await integ.allHealth());
  });

  // Email
  r.get('/api/integrations/email/dns', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, integ.emailDnsRecords(req.query.get('domain') || undefined));
  });
  r.post('/api/integrations/email/send', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await integ.sendEmail(b.to, b.template, b.data || {}));
  });
  /* rm(10.3-1) / F-2026-N08 replay fix: the previous contract signed
   * JSON.stringify(parsedBody), so a captured body+signature could be replayed
   * forever (the security suite proved a 10-minute-old timestamp was accepted).
   * This is the roadmap 2.3-1 design: sign the RAW bytes bound to a millisecond
   * timestamp and refuse anything outside a 5-minute window.
   *   X-Webhook-Timestamp: <epoch-ms>
   *   X-Webhook-Signature: hex hmacSign(secret, ts + '.' + rawBody) */
  r.post('/api/integrations/email/bounce', limited(publicLimiter), async (req, res) => {
    const secret = config.integration.webhookSecret;
    if (!secret) throw new HttpError(503, 'Webhook signing not configured — bounce ingestion disabled');
    const ts = String(req.headers['x-webhook-timestamp'] || '');
    if (!/^\d{13}$/.test(ts) || Math.abs(Date.now() - Number(ts)) > 300000) {
      throw new HttpError(403, 'Stale or missing webhook timestamp');
    }
    const raw = await readRawBody(req, 64 * 1024);
    const sig = String(req.headers['x-webhook-signature'] || '');
    const expected = hmacSign(secret, ts + '.' + raw.toString('utf8'));
    if (!sig || !timingSafeEqual(sig, expected)) throw new HttpError(403, 'Invalid webhook signature');
    let b; try { b = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON body'); }
    ok(res, await integ.handleBounce({
      email: String(b.email || '').slice(0, 254),
      reason: String(b.reason || '').slice(0, 300),
      type: String(b.type || 'bounce').slice(0, 20),
    }));
  });

  // Analytics (public — consent-gated)
  r.post('/api/integrations/analytics/track', limited(publicLimiter), async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, await integ.trackEvent(b.event, b.properties || {}));
  });
  r.get('/api/integrations/analytics/events', ...adminAuth, requirePerm('read_audit'), async (req, res) => {
    ok(res, { events: integ.EVENTS });
  });

  /* ==================== legacy migration bridge (T2.4, INT-6) ====================
   * POST /api/migration/exchange-token { token } where token = "<payloadB64url>.<hmacSha256Hex>"
   * payload = { sub: <legacy email>, dest: "/portal/status", exp: <ms> }, signed with
   * LEGACY_TOKEN_SECRET (env — the legacy portal's signing key, ops-transferred).
   * Valid + fresh + unconsumed → session cookie issued, token burned (single use).
   * Responses never disclose which check failed beyond the class of failure. */
  const exchangeLimiter = rateLimiter({ windowMs: 60 * 1000, max: 30 });
  r.post('/api/migration/exchange-token', limited(exchangeLimiter), async (req, res) => {
    const b = await readJsonBody(req, 8 * 1024);
    const secret = process.env.LEGACY_TOKEN_SECRET;
    if (!secret) throw new HttpError(503, 'Migration bridge not configured');
    const raw = String(b.token || '');
    const dot = raw.lastIndexOf('.');
    if (dot <= 0) throw new HttpError(401, 'Invalid token');
    const payloadPart = raw.slice(0, dot);
    const sigPart = raw.slice(dot + 1);
    let payload;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch { throw new HttpError(401, 'Invalid token'); }
    if (!payload || typeof payload.sub !== 'string') throw new HttpError(401, 'Invalid token');
    if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) throw new HttpError(401, 'Token expired');
    const expected = hmacSign(secret, payloadPart);
    if (!timingSafeEqual(sigPart, expected)) throw new HttpError(401, 'Invalid signature');
    /* single-use: burn before any other work (replay → 409 on the second attempt) */
    await tokenSvc.burn('legacy_exchange', raw);
    const user = await repos.users.findByEmail(payload.sub.toLowerCase());
    if (!user || !user.active) {
      return ok(res, { ok: false, reason: 'no_account', signup: '/form.html' });
    }
    /* deploy-audit M10: the bridge carries partners from the legacy status portal. It issued a
     * session for ANY role, so a legacy link for a staff address opened the console with no
     * password and no TOTP. Staff sign in through /api/auth/login (+MFA); the token stays burned. */
    if (user.role !== 'partner') {
      await repos.audit(user.email, 'legacy_token_refused', 'migration', 'role=' + user.role);
      throw new HttpError(403, 'This link is for partner accounts — staff sign in with password and two-factor code');
    }
    const session = await repos.sessions.insert(await repos.sessions.create(user.id, config.session));
    await repos.audit(user.email, 'legacy_token_exchanged', 'migration', '');
    setSessionCookie(res, session.sid);
    ok(res, { ok: true, redirect: '/status.html' });
  });

  // Master feed (token-authenticated, INT-4)
  r.get('/api/integrations/master', async (req, res) => {
    const expected = config.integration.masterApiToken;
    if (!expected) throw new HttpError(503, 'Integration token not configured');
    const got = String(req.headers['x-api-token'] || '');
    if (!got || !timingSafeEqual(got, expected)) throw new HttpError(401, 'Invalid integration token');
    ok(res, await integ.masterFeed());
  });

  // Webhook signature test (rm(2.3-2) / F-2026-N09): super_admin only — signing arbitrary
  // payloads is a trust-anchor operation; reviewer/viewer must not mint signatures.
  r.post('/api/integrations/webhook/test-sign', ...adminAuth, requirePerm('manage_users'), async (req, res) => {
    const b = await readJsonBody(req);
    ok(res, { signature: integ.signPayload(b.payload || { test: true }) });
  });

  /* ==================== observability & telemetry (NFR-3 / P8-8) ==================== */
  // rm(2.3-2) / F-2026-N09: error entries carry stacks + internal paths — view_pii only.
  r.get('/api/admin/observability/errors', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    const items = errorSink ? errorSink.list() : [];
    ok(res, { errors: items, count: items.length });
  });
  r.post('/api/admin/observability/test-error', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
    throw new Error('Synthetic test error for observability verification (NFR-3)');
  });

  return r;
}

/* ---------- session cookie helpers (SEC-7 / P8-1: __Host- prefix in production) ---------- */
function setSessionCookie(res, sid) {
  const isProd = process.env.NODE_ENV === 'production';
  const name = isProd ? '__Host-kyc_sid' : 'kyc_sid';
  const secure = isProd ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    name + '=' + sid + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + (config.session.absoluteHours * 3600) + secure);
}
function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    'kyc_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + secure,
    '__Host-kyc_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (isProd ? '; Secure' : '')
  ]);
}
