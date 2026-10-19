// Live re-verification probes — Independent Forensic Re-Audit 2026-10-15
// Read-mostly: creates one RFQ probe submission (clearly labelled) and nothing else.
import fs from 'node:fs';
const { totpNow } = await import(new URL('../../../../Codebase/apps/portal/src/lib/security.js', import.meta.url).href);
const API = 'http://127.0.0.1:8090', EDGE = 'http://127.0.0.1:8100';
/* rm(10.1-2): credentials from process env OR apps/portal/.env (guarded read) —
 * the roadmap notes this probe read process env only (L4, L14). */
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../../../../Codebase/apps/portal/.env', import.meta.url), 'utf8'); } catch {}
const env = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || '';
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t.slice(0, 150); } };
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

// A. SLA engine live (DAT-3 / APP-1 re-test)
const admin = await login(env('ADMIN_EMAIL'), env('ADMIN_PASSWORD'), env('ADMIN_TOTP_SECRET'));
console.log('A0 ADMIN LOGIN', admin.ok, 'role:', admin.role);
let r = await fetch(API + '/api/admin/submissions?per=3', { headers: { cookie: admin.cookie } });
let subs = await j(r);
const list = subs.items || subs.submissions || subs.rows || subs; /* rm(10.1-2): rows since Phase 7 */
console.log('A. SUBMISSIONS', r.status, 'rows:', Array.isArray(list) ? list.length : '?');
if (Array.isArray(list)) for (const s of list.slice(0, 3))
  console.log('   ', s.ref || s.id, 'status:', s.status, 'ageDays:', s.ageDays, 'slaBreached:', s.slaBreached);

// B. RFQ end-to-end through the site origin (PUB-2/PUB-6)
/* rm(10.1-2): the hardcoded Oct-15 slug no longer exists in the catalogue —
 * derive a live slug from the built products page (prefer one with an
 * underscore, which is what PUB-6 protects); underscore handling itself is
 * unit-covered in test/rfq.test.js. */
const catPage = await (await fetch(EDGE + '/products/')).text();
const slugs = [...catPage.matchAll(/href="\/products\/([^"/]+)"/g)].map((m) => m[1]);
const slug = slugs.find((x) => x.includes('_')) || slugs[0];
console.log('B0. live catalogue slug picked:', slug, '(underscore:', slug.includes('_') + ')');
r = await fetch(EDGE + '/api/rfq-basket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, qty: 2 }) });
const basketCookie = (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
console.log('B1. BASKET ADD (underscore slug)', r.status, JSON.stringify(await j(r)).slice(0, 140));
r = await fetch(EDGE + '/api/rfq', { method: 'POST', headers: { 'content-type': 'application/json', cookie: basketCookie }, body: JSON.stringify({ email: 'audit@probe.invalid', company: 'Audit Probe LLC', contactName: 'Audit Probe', phone: '+971500000000', notes: 'rm(10.1-2) re-verification probe — safe to ignore' }) /* rm(10.1-2): flat shape since the RFQ rewrite */ });
const rfq = await j(r);
console.log('B2. RFQ SUBMIT', r.status, 'ref:', rfq.ref || rfq.reference || JSON.stringify(rfq).slice(0, 100));

// C. Contact form truthful success (PUB-1)
r = await fetch(EDGE + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Audit Probe', email: 'audit@probe.invalid', topic: 'newsletter', message: 'forensic re-audit probe 2026-10-15' }) });
console.log('C. CONTACT', r.status, JSON.stringify(await j(r)).slice(0, 100));

// D. RBAC live: viewer must be denied admin routes (SEC-3)
const viewer = await login(env('VIEWER_EMAIL'), env('VIEWER_PASSWORD'));
console.log('D0 VIEWER LOGIN', viewer.ok);
for (const p of ['/api/admin/submissions?per=1', '/api/admin/users', '/api/admin/settings', '/api/einvoice/admin/queue', '/api/integrations/health']) {
  const rr = await fetch(API + p, { headers: { cookie: viewer.cookie } });
  console.log('D. VIEWER', p, '->', rr.status);
}
// reviewer: submissions allowed, users denied
const reviewer = await login(env('REVIEWER_EMAIL'), env('REVIEWER_PASSWORD'));
for (const p of ['/api/admin/submissions?per=1', '/api/admin/users', '/api/einvoice/admin/queue']) {
  const rr = await fetch(API + p, { headers: { cookie: reviewer.cookie } });
  console.log('E. REVIEWER', p, '->', rr.status);
}
// anonymous
for (const p of ['/api/admin/submissions?per=1', '/api/cms/blocks']) {
  const rr = await fetch(API + p);
  console.log('F. ANON', p, '->', rr.status);
}

// G. Report builder masking (SEC-6): reviewer vs admin
const H = { 'content-type': 'application/json', cookie: reviewer.cookie };
r = await fetch(API + '/api/admin/reports/build', { method: 'POST', headers: H, body: JSON.stringify({ fields: ['id', 'company.legal_name_en', 'tax.trn', 'banking.iban', 'contacts.primary.email'], per: 3 }) });
const rep = await j(r);
const body = JSON.stringify(rep);
console.log('G. REVIEWER REPORT', r.status, 'hasAE:', /AE\d{21}/.test(body), 'trnLeak:', /"100\d{11,}"/.test(body));
if (rep.rows || rep.items) { const row = (rep.rows || rep.items)[0]; console.log('   row sample:', JSON.stringify(row).slice(0, 220)); }

// H. Outbox token leak re-test (SEC-4): reviewer cannot see reset bodies
r = await fetch(API + '/api/cms/outbox?per=10', { headers: { cookie: reviewer.cookie } });
const ob = await j(r);
const obStr = JSON.stringify(ob);
console.log('H. REVIEWER OUTBOX', r.status, 'resetTokenLeak:', /reset=/.test(obStr), 'redacted:', obStr.includes('REDACTED'));
