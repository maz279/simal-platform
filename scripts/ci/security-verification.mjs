// scripts/ci/security-verification.mjs — rm(10.3-1): internal adversarial
// verification of the exact surface an external pen test (P10-2) is commissioned
// to attack — auth, KYC (documents, signed URLs, uploads), CMS (RBAC, approval,
// revisions, URL writes) and the integration/observability edges. Every case is a
// REAL attempt against a live portal booted on a scratch database (no production
// data, no destructive writes), and each result is PASS/FAIL with the observed
// status. This is the pre-engagement gate: the external tester receives the same
// matrix in docs/PEN_TEST_COMMISSION_PACK.md and re-runs it independently.
//
// Exit 1 on any FAIL. Findings join the remediation board with ID/evidence/task.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from './lib.mjs';
import { totpNow } from '../../apps/portal/src/lib/security.js';

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);
if (!pgUp) { console.error('security-verification: PostgreSQL is required (scratch DB)'); process.exit(2); }

const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'secver');
const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
const app = boot.app;
const { base, creds } = boot;

const results = [];
async function check(id, title, fn) {
  try { await fn(); results.push({ id, title, pass: true }); console.log(`  PASS ${id} ${title}`); }
  catch (e) { results.push({ id, title, pass: false, detail: String(e.message || e) }); console.log(`  FAIL ${id} ${title} — ${e.message || e}`); }
}

const login2 = async (b, email, password, totp) => {
  let r = await fetch(b + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  let d = await r.json().catch(() => ({}));
  let cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  if (d.mfaRequired && totp) {
    r = await fetch(b + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, cookie, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(totp) }) });
    d = await r.json().catch(() => ({}));
    cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') || cookie;
  }
  return { status: r.status, cookie, csrf: d.csrfToken, user: d.user };
};
const login = async (email, password, totp) => {
  let r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  let d = await r.json().catch(() => ({}));
  let cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  if (d.mfaRequired && totp) {
    r = await fetch(base + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, cookie, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(totp) }) });
    d = await r.json().catch(() => ({}));
    cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') || cookie;
  }
  return { status: r.status, cookie, csrf: d.csrfToken, user: d.user };
};
const csrfOf = async (cookie) => (await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json()).csrfToken;
const req = async (method, p, { cookie, body, headers = {}, raw = false } = {}) => {
  const r = await fetch(base + p, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch { /* non-JSON */ }
  return { status: r.status, json, headers: r.headers, text: raw ? await r.text().catch(() => '') : undefined };
};

try {
  const admin = await login(creds.adminEmail, creds.adminPassword, creds.adminTotp);
  const reviewer = await login(creds.reviewerEmail, creds.reviewerPassword);
  const viewer = await login(creds.viewerEmail, creds.viewerPassword);
  assert.ok(admin.cookie && reviewer.cookie && viewer.cookie, 'staff sessions');
  const adminH = { cookie: admin.cookie, 'x-csrf-token': admin.csrf };

  /* ---------- A. authentication & authorization ---------- */
  console.log('\nA. Authentication & authorization');
  await check('A1', 'unauthenticated admin/CMS/einvoice APIs are 401', async () => {
    for (const p of ['/api/admin/submissions', '/api/cms/blocks', '/api/einvoice/admin/queue', '/api/admin/users'])
      assert.equal((await req('GET', p)).status, 401, p + ' must be 401');
  });
  await check('A2', 'viewer denied super-admin-only routes', async () => {
    const users = await req('GET', '/api/admin/users', { cookie: viewer.cookie });
    const obs = await req('GET', '/api/admin/observability/errors', { cookie: viewer.cookie });
    const sign = await req('POST', '/api/integrations/webhook/test-sign', { cookie: viewer.cookie, body: { payload: { t: 1 } } });
    assert.equal(users.status, 403); assert.equal(obs.status, 403); assert.equal(sign.status, 403);
  });
  await check('A3', 'reviewer denied super-admin trust ops', async () => {
    assert.equal((await req('GET', '/api/admin/users', { cookie: reviewer.cookie })).status, 403);
    assert.equal((await req('POST', '/api/integrations/webhook/test-sign', { cookie: reviewer.cookie, body: { payload: {} } })).status, 403);
  });
  await check('A4', 'login lockout: 5 failed attempts then 429 (GOV a20)', async () => {
    const email = 'lockout-' + Date.now().toString(36) + '@secver.invalid';
    let got429 = false, attempts = 0;
    for (let i = 0; i < 8; i++) {
      attempts++;
      const r = await req('POST', '/api/auth/login', { body: { email, password: 'wrong-' + i } });
      if (r.status === 429) { got429 = true; break; }
      assert.equal(r.status, 401, 'attempt ' + attempts + ' must be 401');
    }
    assert.ok(got429, 'no 429 after 8 failed logins');
    assert.ok(attempts <= 7, 'lockout must engage by the 6th attempt, saw ' + attempts);
  });
  await check('A5', 'session cookie is HttpOnly + SameSite; logout invalidates it', async () => {
    const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: creds.reviewerEmail, password: creds.reviewerPassword }) });
    const set = (r.headers.getSetCookie() || []).find((c) => c.startsWith('kyc_sid=')) || '';
    assert.match(set, /HttpOnly/i, 'cookie not HttpOnly');
    assert.match(set, /SameSite=/i, 'cookie without SameSite');
    const cookie = set.split(';')[0];
    const csrf = await csrfOf(cookie);
    assert.equal((await req('GET', '/api/auth/me', { cookie })).status, 200);
    await req('POST', '/api/auth/logout', { cookie, headers: { 'x-csrf-token': csrf } });
    assert.equal((await req('GET', '/api/auth/me', { cookie })).status, 401, 'session survived logout');
  });
  await check('A6', 'password-reset does not enumerate accounts', async () => {
    const known = await req('POST', '/api/auth/password-reset/request', { body: { email: creds.viewerEmail } });
    const unknown = await req('POST', '/api/auth/password-reset/request', { body: { email: 'nobody-' + Date.now().toString(36) + '@secver.invalid' } });
    assert.equal(known.status, 200); assert.equal(unknown.status, 200);
    assert.equal(String((known.json || {}).message), String((unknown.json || {}).message), 'responses differ');
  });

  /* ---------- B. CSRF ---------- */
  console.log('\nB. CSRF (synchronizer token)');
  await check('B1', 'cross-origin POST without a token is blocked', async () => {
    assert.equal((await req('POST', '/api/auth/logout', { cookie: reviewer.cookie, headers: { origin: 'https://evil.example' } })).status, 403);
  });
  await check('B2', 'a BOGUS token cannot bypass cross-origin blocking', async () => {
    assert.equal((await req('POST', '/api/auth/logout', { cookie: reviewer.cookie, headers: { origin: 'https://evil.example', 'x-csrf-token': 'bogus-bogus' } })).status, 403);
  });
  await check('B3', 'a valid own-session token is accepted', async () => {
    /* fresh session — logout consumes the session the later cases reuse */
    const s = await login(creds.reviewerEmail, creds.reviewerPassword);
    const csrf = await csrfOf(s.cookie);
    const r = await req('POST', '/api/auth/logout', { cookie: s.cookie, headers: { origin: 'https://evil.example', 'x-csrf-token': csrf } });
    assert.ok(r.status < 400, 'valid token rejected: ' + r.status);
  });

  /* ---------- C. IDOR / BOLA ---------- */
  console.log('\nC. Object-level authorization (IDOR/BOLA)');
  const PDF = Buffer.from('%PDF-1.4\n% secver probe\n');
  const doc = await app.repos.documents.store({ name: 'secver-a.pdf', mime: 'application/pdf' }, PDF);
  const docB = await app.repos.documents.store({ name: 'secver-b.pdf', mime: 'application/pdf' }, PDF);
  const subId = 'SIM-SECVER-1';
  await app.repos.submissions.add({
    id: subId, role: 'vendor', status: 'submitted', company: { legal_name_en: 'SecVer LLC' },
    contacts: { primary: { email: 'secver@example.invalid', name: 'Sec Ver' } },
    documents: [{ docId: doc.docId, path: doc.relPath, name: 'secver-a.pdf', mime: 'application/pdf' },
                { docId: docB.docId, path: docB.relPath, name: 'secver-b.pdf', mime: 'application/pdf' }],
    submittedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), history: [], reviewer: 'Not Assigned',
  });
  await check('C1', 'reviewer without view_pii cannot read an unassigned submission document', async () => {
    assert.equal((await req('GET', '/api/admin/documents/' + doc.docId, { cookie: reviewer.cookie })).status, 403);
  });
  await check('C2', 'a partner cannot read another party\'s document', async () => {
    const email = 'secver-partner-' + Date.now().toString(36) + '@secver.invalid';
    const reg = await req('POST', '/api/auth/register', { body: { email, name: 'Sec Ver Partner', password: crypto.randomBytes(10).toString('base64url') } });
    assert.equal(reg.status, 201);
    const cookie = ((reg.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; '));
    assert.equal((await req('GET', '/api/admin/documents/' + doc.docId, { cookie })).status, 403);
  });
  await check('C3', 'a signed token for document A is rejected on document B', async () => {
    const sign = await req('POST', '/api/admin/documents/' + doc.docId + '/sign', { cookie: admin.cookie, headers: { 'x-csrf-token': admin.csrf } });
    assert.equal(sign.status, 200);
    const url = String((sign.json || {}).signedUrl || '');
    assert.ok(url.includes('token='), 'no signed token');
    const swapped = url.replace(doc.docId, docB.docId);
    assert.equal((await fetch(base + swapped)).status, 403);
  });

  /* ---------- D. injection & unsafe URLs ---------- */
  console.log('\nD. Injection, XSS and unsafe URL writes');
  await check('D1', 'SQL metacharacters in admin filters are parameterized (no 500, no leak)', async () => {
    for (const p of ["/api/admin/submissions?q=" + encodeURIComponent("' OR 1=1--"), "/api/admin/submissions?status=" + encodeURIComponent("x');DROP TABLE users;--")]) {
      const r = await req('GET', p, { cookie: reviewer.cookie });
      assert.equal(r.status, 200, p + ' -> ' + r.status);
    }
    const bad = await req('GET', "/api/admin/submissions/" + encodeURIComponent("1' OR '1'='1"), { cookie: reviewer.cookie });
    assert.ok(bad.status === 404 || bad.status === 400, 'path injection: ' + bad.status);
  });
  await check('D2', 'javascript:/data://host/control-char URLs are rejected on every CMS write path', async () => {
    const bad = ['javascript:alert(1)', 'data:text/html,<script>x</script>', '//evil.example/x', '/\\evil.example/x', 'java\tscript:alert(1)'];
    for (const cta of bad) {
      const r = await req('PUT', '/api/cms/announcements/1', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: { text: 'secver', cta_href: cta } });
      assert.equal(r.status, 422, cta + ' -> ' + r.status);
    }
    const ok = await req('PUT', '/api/cms/announcements/1', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: { text: 'secver ok', cta_href: '/products/' } });
    assert.equal(ok.status, 200);
  });
  await check('D3', 'path traversal in document/media paths is refused', async () => {
    for (const p of ['/api/admin/documents/doc_%2e%2e%2f%2e%2e%2fetc%2fpasswd', '/api/admin/documents/doc_2e2e2f', '/media/..%2f..%2fserver.js']) {
      const r = await req('GET', p, { cookie: admin.cookie });
      assert.ok([400, 403, 404].includes(r.status), p + ' -> ' + r.status);
    }
  });
  await check('D4', 'upload with a false PDF extension is refused by magic-byte sniffing', async () => {
    const email = 'secver-upload-' + Date.now().toString(36) + '@secver.invalid';
    const draft = await req('POST', '/api/public/drafts', { body: { email, role: 'vendor' } });
    assert.ok([200, 201].includes(draft.status), 'draft: ' + draft.status);
    const d = draft.json || {};
    const payload = { token: d.token, documents: [{ type: 'trade_license', name: 'eicar.pdf', mime: 'application/pdf', dataB64: Buffer.from('this is not a pdf at all').toString('base64') }] };
    const r = await req('POST', '/api/public/drafts/' + d.draftId + '/documents', { body: payload });
    assert.equal(r.status, 400, 'false-extension upload accepted: ' + r.status);
  });

  /* ---------- E. privileged workflow (Phase 7.3 approval) ---------- */
  console.log('\nE. Dual-approval workflow (SEC-11)');
  await app.repos.client.query("INSERT INTO audit_log (ts, actor, action, target, details) VALUES ($1,'system','ssg_build_completed','secver','baseline')", [Date.now()]);
  const ssgCount = async () => (await app.repos.client.query("SELECT COUNT(*)::int AS n FROM outbox WHERE to_addr='ssg-builder'")).rows[0].n;
  let approvalId = null, beforeSsg = 0;
  await check('E1', 'sensitive publish returns 202 pending and enqueues nothing', async () => {
    await req('PUT', '/api/cms/blocks/erp/pricing', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: { payload: { note: 'secver E1' } } });
    beforeSsg = await ssgCount();
    const r = await req('POST', '/api/cms/publish', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: { entities: [{ entity: 'site', entity_id: 'all' }] } });
    assert.equal(r.status, 202); approvalId = r.json.approvalId; assert.ok(approvalId);
    assert.equal(await ssgCount(), beforeSsg, 'pending publish enqueued a build');
  });
  await check('E2', 'the requester (and a second session of the same user) cannot approve', async () => {
    const rev2 = await login(creds.reviewerEmail, creds.reviewerPassword);
    assert.equal((await req('POST', '/api/cms/publish-approvals/' + approvalId + '/approve', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: {} })).status, 403);
    assert.equal((await req('POST', '/api/cms/publish-approvals/' + approvalId + '/approve', { cookie: rev2.cookie, headers: { 'x-csrf-token': await csrfOf(rev2.cookie) }, body: {} })).status, 403);
  });
  await check('E3', 'a distinct super_admin approves and exactly one build is enqueued', async () => {
    assert.equal((await req('POST', '/api/cms/publish-approvals/' + approvalId + '/approve', { cookie: admin.cookie, headers: { 'x-csrf-token': admin.csrf }, body: {} })).status, 200);
    assert.equal(await ssgCount(), beforeSsg + 1);
  });
  await check('E4', 'a reviewer cannot use the emergency override with an attested approver', async () => {
    assert.equal((await req('POST', '/api/cms/emergency-publish', { cookie: reviewer.cookie, headers: { 'x-csrf-token': await csrfOf(reviewer.cookie) }, body: { entity: 'site', entityId: 'x', payload: {}, secondApproverEmail: creds.adminEmail } })).status, 403);
  });

  /* ---------- F. integrations & webhooks ---------- */
  console.log('\nF. Integration boundaries');
  await check('F1', 'the bounce webhook requires a fresh timestamp bound into the HMAC', async () => {
    const body = JSON.stringify({ email: 'bounce@secver.invalid', reason: 'secver', type: 'hard' });
    const post = (h) => fetch(base + '/api/integrations/email/bounce', { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body });
    const ts = String(Date.now());
    const sig = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '').update(ts + '.' + body).digest('hex');
    assert.equal((await post({})).status, 403, 'unsigned accepted');
    assert.equal((await post({ 'x-webhook-signature': 'deadbeef'.repeat(8), 'x-webhook-timestamp': ts })).status, 403, 'invalid signature accepted');
    assert.equal((await post({ 'x-webhook-signature': sig })).status, 403, 'missing timestamp accepted');
    assert.equal((await post({ 'x-webhook-signature': sig, 'x-webhook-timestamp': String(Date.now() - 600000) })).status, 403, 'STALE timestamp accepted (replay)');
    const bodyOnly = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET || '').update(body).digest('hex');
    assert.equal((await post({ 'x-webhook-signature': bodyOnly, 'x-webhook-timestamp': ts })).status, 403, 'body-only signature (unbound) accepted');
    assert.equal((await post({ 'x-webhook-signature': sig, 'x-webhook-timestamp': ts })).status, 200, 'valid fresh signature refused');
  });
  await check('F2', 'the integration master feed rejects a wrong token', async () => {
    assert.equal((await req('GET', '/api/integration/master', { headers: { 'x-api-token': 'wrong-token' } })).status, 401);
  });

  /* ---------- G. response hygiene ---------- */
  console.log('\nG. Response and header hygiene');
  await check('G1', '5xx responses leak no stack, SQL or driver text', async () => {
    const r = await req('POST', '/api/admin/observability/test-error', { cookie: admin.cookie, headers: { 'x-csrf-token': admin.csrf } });
    assert.equal(r.status, 500);
    const s = JSON.stringify(r.json || {});
    assert.ok(!/at \/|SELECT |pg_|stack|trace/i.test(s), 'leaky 500 body: ' + s.slice(0, 140));
    assert.ok((r.json || {}).requestId, 'no requestId in the 500 body');
  });
  await check('G2', 'pages carry nosniff + a frame-ancestors CSP; no X-Powered-By', async () => {
    const r = await fetch(base + '/login.html');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.match(String(r.headers.get('content-security-policy') || ''), /frame-ancestors 'none'/);
    assert.equal(r.headers.get('x-powered-by'), null);
  });
} finally {
  await boot.stop();
  if (app?.repos?.client) await app.repos.client.end().catch(() => {});
  await scratch?.drop().catch(() => {});
}

/* ---------- H. strict rate-limit tiers (GOV a21) ----------
 * The suite's main portal boots with NODE_KYC_TEST=1 (the repo's test escape
 * hatch), so the strict tiers are proven on a second portal booted with
 * RATE_LIMITS_STRICT=1 — the production configuration. */
console.log('');
console.log('H. Rate-limit tiers (strict mode)');
{
  process.env.RATE_LIMITS_STRICT = '1';
  const strictScratch = explicitDb ? null : await scratchDatabase(adminUrl, 'secverstrict');
  const strict = await bootApp({ mode: 'pg', databaseUrl: explicitDb || strictScratch.url, mfa: false });
  try {
    const sAdmin = await login2(strict.base, strict.creds.adminEmail, strict.creds.adminPassword, strict.creds.adminTotp);
    await check('H1', 'public forms are limited to 5 per 10 min per IP', async () => {
      let limitedAt = 0;
      for (let i = 1; i <= 7; i++) {
        const r = await fetch(strict.base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Sec Ver', email: 'secver' + i + '@secver.invalid', topic: 'general', message: 'rate tier probe ' + i }) });
        if (r.status === 429) { limitedAt = i; break; }
      }
      assert.equal(limitedAt, 6, 'expected the 6th public form request to be 429, saw limit at ' + limitedAt);
    });
    await check('H2', 'authenticated staff APIs are capped at 300 requests/min', async () => {
      let limitedAt = 0;
      for (let i = 1; i <= 305; i++) {
        const r = await fetch(strict.base + '/api/admin/submissions?per=1', { headers: { cookie: sAdmin.cookie } });
        if (r.status === 429) { limitedAt = i; break; }
      }
      assert.ok(limitedAt >= 300 && limitedAt <= 302, 'staff ceiling engaged at ' + limitedAt + ' (expected ~301)');
    });
  } finally {
    delete process.env.RATE_LIMITS_STRICT;
    await strict.stop();
    if (strict.app?.repos?.client) await strict.app.repos.client.end().catch(() => {});
    await strictScratch?.drop().catch(() => {});
  }
}

const fails = results.filter((r) => !r.pass);
console.log('\n=== SECURITY VERIFICATION SUMMARY (internal, pre-engagement) ===');
console.log(`${results.length - fails.length}/${results.length} cases PASS`);
if (fails.length) {
  for (const f of fails) console.log(` - FAIL ${f.id} ${f.title}: ${f.detail}`);
  console.log('FINDINGS must be tracked on the board with ID/evidence/task/acceptance.');
  process.exit(1);
}
console.log('PASS — every adversarial case in the commission pack\'s internal matrix behaved as designed.');
process.exit(0);
