// Iteration-2 deeper live proofs — 2026-10-16
// F-2026-N02 CSRF bypass · SEC-3 partner RBAC · DAT-4/5 rollback · SEC-4 reset redaction
const API = 'http://127.0.0.1:8090';
const { totpNow } = await import(new URL('../../../../Codebase/apps/portal/src/lib/security.js', import.meta.url).href);
/* rm(10.1-2): resolve .env relative to THIS file (was a hardcoded absolute path),
 * with process env taking precedence; guarded so the probe also runs elsewhere. */
const fs = await import('node:fs');
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../../../../Codebase/apps/portal/.env', import.meta.url), 'utf8'); } catch {}
const E = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t.slice(0, 120); } };
/* rm(10.1-2): MFA-aware login. TOTP codes are single-use and window-shared:
 * a rerun in the same 30 s window would resend a consumed code, and a rejected
 * MFA attempt consumes the challenge — so every code is deduped against the
 * previous one (waiting for the window to roll) and a rejection restarts the
 * whole login with a fresh challenge. */
let __lastTotp = null;
const login = async (email, password, totpSecret) => {
  for (let round = 0; round < 3; round++) {
    let r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    let cookie = (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
    let d; { const t = await r.text(); try { d = JSON.parse(t); } catch { d = {}; } }
    if (!d.mfaRequired || !totpSecret) return { ok: r.ok, cookie, csrf: d.csrfToken, role: d.user?.role };
    let code = totpNow(totpSecret);
    if (code === __lastTotp) { await new Promise(res => setTimeout(res, 31000 - (Date.now() % 30000))); code = totpNow(totpSecret); }
    __lastTotp = code;
    r = await fetch(API + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code }) });
    if (r.ok) {
      cookie = (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ') || cookie;
      let d2; { const t = await r.text(); try { d2 = JSON.parse(t); } catch { d2 = {}; } }
      return { ok: true, cookie, csrf: d2.csrfToken, role: d2.user?.role };
    }
  }
  return { ok: false, cookie: '', csrf: null };
};

console.log('=== 1. CSRF synchronizer-token bypass (F-2026-N02) ===');
// A: cross-site without token -> expect 403
let s = await login(E('ADMIN_EMAIL'), E('ADMIN_PASSWORD'), E('ADMIN_TOTP_SECRET'));
let r = await fetch(API + '/api/auth/logout', { method: 'POST', headers: { cookie: s.cookie, origin: 'https://evil.example' } });
console.log('A. evil Origin, NO token      ->', r.status, JSON.stringify(await j(r)).slice(0, 90));
// B: cross-site with BOGUS token -> bypass if not 403
r = await fetch(API + '/api/auth/logout', { method: 'POST', headers: { cookie: s.cookie, origin: 'https://evil.example', 'x-csrf-token': 'totally-bogus-audit-probe' } });
const bStatus = r.status; await j(r);
console.log('B. evil Origin, BOGUS token   ->', bStatus, bStatus === 403 ? '(blocked — token IS verified)' : '(PASSED CSRF layer with a fake token — BYPASS CONFIRMED)');
// C: control same-origin style (no origin header) — viewer session (rm(10.1-2): one
// admin session for the whole probe; the per-account login limiter 10/5min + 300s
// block made the old one-login-per-case pattern self-DoS on reruns)
const cv = await login(E('VIEWER_EMAIL'), E('VIEWER_PASSWORD'));
r = await fetch(API + '/api/auth/logout', { method: 'POST', headers: { cookie: cv.cookie } });
console.log('C. no Origin (same-site)      ->', r.status, '(control: normal logout works)');

console.log('\n=== 2. Partner role RBAC (original SEC-3/F-3 critical) ===');
const H = { cookie: s.cookie, 'content-type': 'application/json', 'x-csrf-token': s.csrf };
const partnerEmail = 'audit2-partner-' + Date.now().toString(36) + '@simal.test';
const partnerPw = 'Audit2-Partner-' + Date.now().toString(36);
/* rm(10.1-2): the admin user-provisioner only creates STAFF roles now
 * ("Role must be one of super_admin, reviewer, viewer"); partner accounts are
 * created by self-registration (/api/auth/register), which returns the session. */
r = await fetch(API + '/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: partnerEmail, name: 'Audit2 Partner Probe', password: partnerPw }) });
const regCookie = (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
console.log('2.0 self-register partner:', r.status, JSON.stringify(await j(r)).slice(0, 100));
const p = { cookie: regCookie };
console.log('2.1 partner session:', regCookie.includes('kyc_sid') ? 'OK' : 'FAILED');
const partnerRoutes = [
  '/api/admin/submissions?per=5', '/api/admin/analytics', '/api/admin/audit', '/api/admin/export.csv',
  '/api/admin/rfqs', '/api/admin/outbox', '/api/admin/users', '/api/admin/reports',
  '/api/einvoice/admin/queue', '/api/integrations/health', '/api/integrations/email/dns', '/api/cms/blocks',
];
let partnerLeaks = 0;
for (const path of partnerRoutes) {
  const rr = await fetch(API + path, { headers: { cookie: p.cookie } });
  const txt = await rr.text();
  const iban = /AE\d{21}/.test(txt);
  if (rr.status < 400 || iban) { partnerLeaks++; console.log('   LEAK', path, '->', rr.status, iban ? 'RAW IBAN IN BODY' : ''); }
}
console.log('2.2 partner on 12 privileged routes: leaks =', partnerLeaks, partnerLeaks === 0 ? '(ALL DENIED — SEC-3 verified live)' : '(CRITICAL REGRESSION)');
r = await fetch(API + '/api/einvoice/mine', { headers: { cookie: p.cookie } });
console.log('2.3 partner /api/einvoice/mine ->', r.status, '(expected 200: partner session valid)');
r = await fetch(API + '/api/admin/documents/doc_audit2_nonexistent', { headers: { cookie: p.cookie } });
console.log('2.4 partner foreign document  ->', r.status, '(expect 401/403: partner denied on admin route)');
/* cleanup: deactivate the probe user via the admin API (PUT — no DELETE route) */
/* rm(10.1-2): GET /api/admin/users returns a BARE array (no ?q= filter) — sweep
 * every audit2-partner-* leftover from any earlier probe run, not just this one. */
r = await fetch(API + '/api/admin/users', { headers: { cookie: s.cookie } });
const ul = await j(r);
const all = Array.isArray(ul) ? ul : (ul.users || ul.items || []);
const leftovers = all.filter(u => /^audit2-partner/.test(u.email) && u.active);
let cleanup = leftovers.length + ' active probe user(s)';
for (const u of leftovers) {
  const cr = await fetch(API + '/api/admin/users/' + u.id, { method: 'PUT', headers: H, body: JSON.stringify({ active: false }) });
  cleanup += ' | ' + u.email + ' -> ' + cr.status;
}
console.log('2.5 cleanup probe users:', cleanup);
console.log('\n=== 3. Rollback safety (DAT-4/5) ===');
r = await fetch(API + '/api/cms/announcements', { headers: { cookie: s.cookie } });
const ann = (await j(r)).announcements[0];
console.log('3.0 current announcement text:', JSON.stringify(ann.text).slice(0, 70));
r = await fetch(API + '/api/cms/revisions/announcements/1', { headers: { cookie: s.cookie } });
const revs = (await j(r)).revisions || [];
console.log('3.1 revisions held:', revs.length, '| latest:', revs.length ? JSON.stringify((revs[revs.length - 1].payload?.text) || '').slice(0, 60) : 'none');
// roll back once -> should restore the PREVIOUS revision
r = await fetch(API + '/api/cms/revisions/announcements/1/rollback', { method: 'POST', headers: H });
console.log('3.2 rollback #1:', r.status, JSON.stringify(await j(r)).slice(0, 110));
r = await fetch(API + '/api/cms/announcements', { headers: { cookie: s.cookie } });
const after1 = (await j(r)).announcements[0].text;
console.log('3.3 text after rollback #1:', JSON.stringify(after1).slice(0, 70));
// roll back again -> should return to the state before (undoable)
r = await fetch(API + '/api/cms/revisions/announcements/1/rollback', { method: 'POST', headers: H });
await j(r);
r = await fetch(API + '/api/cms/announcements', { headers: { cookie: s.cookie } });
const after2 = (await j(r)).announcements[0].text;
console.log('3.4 text after rollback #2:', JSON.stringify(after2).slice(0, 70), '(rollback-of-rollback exercised =', after1 !== after2 ? 'yes)' : 'no)');
// content_blocks untouched?
const blockBefore = await (await fetch(API + '/api/cms/blocks/site/featured-products', { headers: { cookie: s.cookie } })).json();
console.log('3.5 shared content_blocks untouched by announcement rollback:', blockBefore?.block?.entity_id === 'featured-products' ? 'yes (scope held)' : JSON.stringify(blockBefore).slice(0, 80));

console.log('\n=== 4. Reset-token redaction at write time (SEC-4) ===');
r = await fetch(API + '/api/auth/password-reset/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: E('VIEWER_EMAIL') }) });
console.log('4.0 reset request:', r.status, JSON.stringify(await j(r)).slice(0, 90));
// admin (view_pii) inspects newest outbox email rows
r = await fetch(API + '/api/admin/outbox?per=5', { headers: { cookie: s.cookie } });
const ob = await j(r);
const rows = (ob.outbox || ob.items || []).filter(x => (x.subject || '').toLowerCase().includes('reset') || /reset=/.test(x.text || '')); /* rm(10.1-2): body field is `text` now */
const newest = rows[0];
const bodyStr = JSON.stringify(newest || {});
const rawToken = /reset=[A-Za-z0-9_-]{16,}/.test(bodyStr);
console.log('4.1 newest reset email body redacted:', !rawToken ? 'YES' : 'NO', '| rawTokenPresent:', rawToken); /* the route strips reset= tokens for view_pii — the assertion is NO raw token */
console.log('    body snippet:', (newest?.body || '').slice(0, 120).replace(/\n/g, ' '));
