// Iteration-2 fix-ups: restore original announcement, partner-via-register RBAC, reset redaction (correct shape)
const API = 'http://127.0.0.1:8090';
const fs = await import('node:fs');
const envTxt = fs.readFileSync('C:/software_project/Simal_Corporate_website/Codebase/apps/portal/.env', 'utf8');
const E = (k) => (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return t.slice(0, 120); } };
const login = async (email, password) => {
  const r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const cookie = (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
  const d = await j(r);
  return { ok: r.ok, cookie, csrf: d.csrfToken, role: d.user?.role };
};
const TRUE_ORIGINAL = '⚡ Gen5 is here — Crucial P510 now in Dubai stock.';

// 0. RESTORE the true original announcement text (cleanup of audit markers)
const admin = await login(E('ADMIN_EMAIL'), E('ADMIN_PASSWORD'));
const H = { cookie: admin.cookie, 'content-type': 'application/json', 'x-csrf-token': admin.csrf };
let r = await fetch(API + '/api/cms/announcements', { headers: { cookie: admin.cookie } });
const ann = (await j(r)).announcements[0];
if (ann.text !== TRUE_ORIGINAL) {
  r = await fetch(API + '/api/cms/announcements/1', { method: 'PUT', headers: H, body: JSON.stringify({ ...ann, text: TRUE_ORIGINAL }) });
  console.log('0. RESTORED original announcement text:', r.status, JSON.stringify((await j(r)).text || '').slice(0, 60));
} else {
  console.log('0. announcement already original');
}
r = await fetch(API + '/api/cms/announcements', { headers: { cookie: admin.cookie } });
console.log('0b verified current text:', JSON.stringify((await j(r)).announcements[0].text));

// 1. Partner RBAC via PUBLIC registration (APP-5) — the original F-3 test
const partnerEmail = 'audit2-partner@simal.test';
const partnerPw = 'Audit2-Partner-' + Date.now().toString(36);
r = await fetch(API + '/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: partnerEmail, password: partnerPw, name: 'Audit2 Partner Probe' }) });
console.log('\n1.0 public register partner:', r.status, JSON.stringify(await j(r)).slice(0, 110));
const p = await login(partnerEmail, partnerPw);
console.log('1.1 partner login:', p.ok ? 'OK role=' + p.role : 'FAILED');
if (p.ok) {
  const routes = [
    ['GET', '/api/admin/submissions?per=5'], ['GET', '/api/admin/submissions/SIM-KYC-2026-10140'],
    ['GET', '/api/admin/submissions/SIM-KYC-2026-10140?pii=full'],
    ['GET', '/api/admin/analytics'], ['GET', '/api/admin/audit'], ['GET', '/api/admin/export.csv'],
    ['GET', '/api/admin/rfqs'], ['GET', '/api/admin/outbox'], ['GET', '/api/admin/users'],
    ['GET', '/api/admin/documents/doc_74b13e3cacac620a4a2c'],
    ['GET', '/api/einvoice/admin/queue'], ['GET', '/api/einvoice/admin/inv_nonexistent'],
    ['GET', '/api/integrations/health'], ['GET', '/api/integrations/email/dns'],
    ['GET', '/api/cms/blocks'], ['GET', '/api/cms/outbox'],
  ];
  let denied = 0, leaked = 0;
  for (const [m, path] of routes) {
    const rr = await fetch(API + path, { method: m, headers: { cookie: p.cookie } });
    const txt = await rr.text();
    const iban = /AE\d{21}/.test(txt);
    if (iban) { leaked++; console.log('   RAW IBAN LEAK:', path, rr.status); }
    if (rr.status === 401 || rr.status === 403) denied++;
    else console.log('   NOT-DENIED:', path, '->', rr.status, txt.slice(0, 60));
  }
  console.log(`1.2 partner on ${routes.length} privileged routes: denied=${denied}, ibanLeaks=${leaked}`, (denied === routes.length && leaked === 0) ? '— SEC-3 VERIFIED LIVE (was Critical F-3)' : '— REGRESSION');
  // partner's own surface
  r = await fetch(API + '/api/einvoice/mine', { headers: { cookie: p.cookie } });
  console.log('1.3 partner /api/einvoice/mine ->', r.status, '(own surface reachable)');
}

// 2. Reset-token redaction with the CORRECT admin outbox shape
r = await fetch(API + '/api/auth/password-reset/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: E('VIEWER_EMAIL') }) });
console.log('\n2.0 fresh reset request:', r.status);
r = await fetch(API + '/api/admin/outbox?per=3', { headers: { cookie: admin.cookie } });
const ob = await j(r);
const list = ob.outbox || ob.items || ob.rows || [];
console.log('2.1 admin outbox keys:', Object.keys(ob).join(','), '| rows:', list.length);
const resetRow = list.find(x => /reset|password/i.test(JSON.stringify(x.subject || '') + (x.body || '').slice(0, 200))) || list[0];
if (resetRow) {
  const body = resetRow.body || '';
  console.log('2.2 newest email row subject:', JSON.stringify(resetRow.subject).slice(0, 70));
  console.log('2.3 body contains raw reset token:', /reset=[A-Za-z0-9+\-/=_]{16,}/.test(body));
  console.log('2.4 body redacted marker present:', body.includes('[REDACTED]') || body.includes('REDACTED'));
  console.log('2.5 body snippet:', JSON.stringify(body.slice(0, 160)));
} else {
  console.log('2.x no rows parsed — dump first 300 chars:', JSON.stringify(ob).slice(0, 300));
}
