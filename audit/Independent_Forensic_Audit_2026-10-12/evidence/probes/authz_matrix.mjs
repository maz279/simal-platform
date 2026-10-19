// Cookie-session authz matrix against the SANDBOX portal (127.0.0.1:18090 -> scratch DB :55433).
import fs from 'node:fs';
const API = 'http://127.0.0.1:18090';
const envTxt = fs.readFileSync(process.argv[2], 'utf8');
const envVal = (k) => (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const ROLES = {
  super_admin: ['admin@simalme.com', '[REDACTED-ROTATED-2026-10]'],
  reviewer: ['reviewer@simalme.com', 'reviewer123'],
  viewer: ['viewer@simalme.local', envVal('VIEWER_PASSWORD')],
  partner: ['partner@simalme.com', 'partner123'],
};
async function login(email, pw) {
  const r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
  const sc = (r.headers.getSetCookie?.() || []).find(c => c.startsWith('kyc_sid='));
  return sc ? sc.split(';')[0] : null;
}
const PII = ['company.legal_name_en', 'tax.trn', 'banking.iban', 'contacts.primary.email', 'contacts.primary.mobile'];
const routes = [
  ['GET', '/api/admin/submissions?per=50'], ['GET', '/api/admin/submissions/SIM-KYC-2026-10061'], ['GET', '/api/admin/submissions/SIM-KYC-2026-10061?pii=full'],
  ['GET', '/api/admin/documents/doc_74b13e3cacac620a4a2c'], ['GET', '/api/admin/analytics'], ['GET', '/api/admin/audit'], ['GET', '/api/admin/export.csv'],
  ['GET', '/api/admin/invites'], ['GET', '/api/admin/rfqs'], ['GET', '/api/admin/outbox'], ['GET', '/api/admin/users'], ['GET', '/api/admin/sessions'], ['GET', '/api/admin/settings'],
  ['GET', '/api/admin/reports'], ['POST', '/api/admin/reports/build', { fields: PII }], ['POST', '/api/admin/reports/export.csv', { fields: PII }],
  ['GET', '/api/einvoice/admin/queue'], ['GET', '/api/einvoice/admin/inv_3cb9fc4fc1f9776512e9'], ['GET', '/api/einvoice/mine'], ['GET', '/api/einvoice/inv_3cb9fc4fc1f9776512e9'],
  ['GET', '/api/integrations/health'], ['GET', '/api/integrations/email/dns'], ['GET', '/api/integrations/analytics/events'],
  ['POST', '/api/integrations/webhook/test-sign', { payload: { event: 'kyc.approved', ref: 'FORGED' } }],
  ['POST', '/api/integrations/email/send', { to: 'nobody@invalid.test', template: 'kyc.approved', data: {} }],
  ['GET', '/api/cms/blocks'], ['GET', '/api/cms/outbox'], ['GET', '/api/cms/telemetry'], ['PUT', '/api/cms/blocks/site/zz-authz-probe', { payload: { probe: true } }],
];
function summarize(status, ct, text) {
  if (status >= 400) { try { return JSON.parse(text).error?.slice(0, 50) || ''; } catch { return text.slice(0, 50); } }
  if (!ct.includes('json')) return `${ct.split(';')[0]} ${text.length}B`;
  try {
    const d = JSON.parse(text);
    const parts = [];
    for (const [k, v] of Object.entries(d)) if (Array.isArray(v)) parts.push(`${k}[${v.length}]`);
    if (Array.isArray(d)) parts.push(`[${d.length}]`);
    if (/AE\d{21}/.test(text)) parts.push('UNMASKED_IBAN');
    if (d.signature) parts.push('signature=' + String(d.signature).slice(0, 8) + '…');
    return parts.join(' ') || text.slice(0, 60);
  } catch { return text.slice(0, 60); }
}
const cookies = { anonymous: null };
for (const [role, [e, p]] of Object.entries(ROLES)) cookies[role] = await login(e, p);
console.log('logins:', Object.fromEntries(Object.entries(cookies).map(([k, v]) => [k, k === 'anonymous' ? '-' : (v ? 'ok' : 'FAILED')])));
const matrix = {};
for (const [method, path, body] of routes) {
  const row = {};
  for (const role of ['anonymous', 'partner', 'viewer', 'reviewer', 'super_admin']) {
    const headers = {}; if (cookies[role]) headers.cookie = cookies[role]; if (body) headers['content-type'] = 'application/json';
    const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    row[role] = `${r.status} ${summarize(r.status, r.headers.get('content-type') || '', text)}`;
  }
  matrix[`${method} ${path}`] = row;
}
fs.writeFileSync(process.argv[3], JSON.stringify(matrix, null, 1));
const pad = (s, n) => String(s).slice(0, n).padEnd(n);
console.log(pad('ROUTE', 58), pad('anonymous', 14), pad('partner', 34), pad('viewer', 26), pad('reviewer', 26), 'super_admin');
for (const [k, v] of Object.entries(matrix)) console.log(pad(k, 58), pad(v.anonymous, 14), pad(v.partner, 34), pad(v.viewer, 26), pad(v.reviewer, 26), String(v.super_admin).slice(0, 30));
