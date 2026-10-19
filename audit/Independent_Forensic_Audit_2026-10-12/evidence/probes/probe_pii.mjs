import { client } from './api.mjs';
const BASE = 'http://127.0.0.1:18090';
async function as(email, pw) {
  const r = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
  return (r.headers.getSetCookie?.() || []).find(c => c.startsWith('kyc_sid=')).split(';')[0];
}
const partner = await as('partner@simalme.com', 'partner123');
const call = async (m, p, b) => { const r = await fetch(BASE + p, { method: m, headers: { cookie: partner, ...(b ? { 'content-type': 'application/json' } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, text: await r.text() }; };
// 1) report builder as PARTNER, filtered to avoid the row with an invalid date
for (const filters of [{ status: 'submitted' }, { status: 'approved' }, { q: 'SIM-KYC-2026-1008' }]) {
  const r = await call('POST', '/api/admin/reports/build', { fields: ['id', 'company.legal_name_en', 'tax.trn', 'banking.iban', 'contacts.primary.email', 'contacts.primary.mobile'], filters });
  let j; try { j = JSON.parse(r.text); } catch { }
  const ibans = (r.text.match(/AE\d{21}/g) || []).length;
  console.log(`PARTNER reports/build filters=${JSON.stringify(filters)} -> ${r.status} rows=${j?.rowCount ?? '-'} unmaskedIBANs=${ibans}`, j?.rows?.[0] ? 'sample: ' + JSON.stringify(Object.fromEntries(Object.entries(j.rows[0]).map(([k, v]) => [k, k === 'banking.iban' ? String(v).slice(0, 4) + '…(' + String(v).length + ' chars)' : k.includes('email') || k.includes('mobile') ? String(v).replace(/^(.{3}).*(.{3})$/, '$1…$2') : v]))) : r.text.slice(0, 120));
}
// 2) submission detail as PARTNER: what is visible?
const d = await call('GET', '/api/admin/submissions/SIM-KYC-2026-10061');
const dj = JSON.parse(d.text);
console.log('\nPARTNER submission detail keys:', Object.keys(dj).join(','));
console.log('  banking:', JSON.stringify(dj.banking).slice(0, 160));
console.log('  contacts.primary:', JSON.stringify(dj.contacts?.primary).replace(/"email":"(.{3})[^"]*"/, '"email":"$1…"').slice(0, 160));
console.log('  documents:', (dj.documents || []).map(x => x.docId + ':' + x.name).slice(0, 3).join(' | '));
// 3) invoice queue as PARTNER
const q = JSON.parse((await call('GET', '/api/einvoice/admin/queue')).text);
console.log('\nPARTNER invoice queue rows:', q.rows.length, 'distinct partner emails:', new Set(q.rows.map(r => r.partnerEmail)).size, 'sample keys:', Object.keys(q.rows[0] || {}).join(','));
// 4) error body leakage
const e = await call('GET', '/api/admin/documents/doc_74b13e3cacac620a4a2c');
console.log('\n500 body (documents):', e.text.slice(0, 220));
const e2 = await call('POST', '/api/admin/reports/build', { fields: ['id'] });
console.log('500 body (report build, no filter):', e2.text.slice(0, 200));
