// SANDBOX ONLY (:18090 -> scratch DB :55433). Full lifecycle tests of the portal apps:
//  A) KYC: draft -> save -> documents -> submit -> public status -> staff review (start/query/respond/approve)
//  B) e-invoicing: partner account -> create -> validate -> submit -> deliver -> UBL -> immutability -> cross-partner access
//  C) auth: password reset request -> token visible in outbox? -> confirm -> login with new password
import fs from 'node:fs';
const API = 'http://127.0.0.1:18090';
const R = [];
const rec = (area, name, pass, detail) => { R.push({ area, name, pass, detail }); console.log(`${pass === true ? 'PASS' : pass === false ? 'FAIL' : 'INFO'}  [${area}] ${name}${detail ? ' :: ' + detail : ''}`); };

function jar() {
  const c = new Map();
  return {
    hdr: () => [...c].map(([k, v]) => `${k}=${v}`).join('; '),
    take: (res) => { for (const sc of res.headers.getSetCookie?.() || []) { const kv = sc.split(';')[0]; const i = kv.indexOf('='); c.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim()); } },
  };
}
async function call(method, path, body, j, extra = {}) {
  const headers = { ...extra };
  if (j) { const h = j.hdr(); if (h) headers.cookie = h; }
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (j) j.take(res);
  const t = await res.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: res.status, d, raw: t };
}
const login = async (email, password) => { const j = jar(); const r = await call('POST', '/api/auth/login', { email, password }, j); return { j, r }; };

// ---------------------------------------------------------------- A) KYC
const EMAIL = `probe.kyc.${Date.now()}@example.invalid`;
let draft = await call('POST', '/api/public/drafts', { email: EMAIL, role: 'vendor' });
rec('KYC', 'create draft', draft.status === 201, `${draft.status} draftId=${draft.d.draftId} tokenLen=${String(draft.d.token || '').length}`);
const did = draft.d.draftId, dtok = draft.d.token;

const application = {
  role: 'vendor',
  company: { legal_name_en: 'Sandbox Probe Trading LLC', legal_name_ar: 'شركة بروب', entity_type: 'LLC', country: 'AE',
    license_number: 'CN-9988776', license_authority: 'Dubai DED', license_issue: '2020-01-10', license_expiry: '2028-06-30',
    business_activity: 'IT hardware distribution',
    address: { building: 'Dar Al Riffa', street: 'Khalid Bin Al Waleed Rd', city: 'Dubai', emirate: 'Dubai', country: 'AE', po_box: '49740' } },
  tax: { trn: '100123456700003', peppol_id: '0235:100123456700003', invoice_currency: 'AED', einv_status: 'in_progress' },
  contacts: { primary: { name: 'Probe Contact', email: EMAIL, mobile: '+971500000001', designation: 'Owner' } },
  signatories: [{ name: 'Probe Signatory', designation: 'Owner', email: EMAIL, mobile: '+971500000001', id_type: 'emirates_id', id_number: '784-1990-1234567-1', id_expiry: '2030-01-01', authority: 'director' }],
  ubos: [{ name: 'Probe Owner', nationality: 'AE', ownership_pct: 100, id_type: 'passport', id_number: 'A1234567' }],
  banking: { bank_name: 'Emirates NBD', iban: 'AE070331234567890123456', swift: 'EBILAEAD', currency: 'AED', account_holder: 'Sandbox Probe Trading LLC' },
  declarations: { accuracy: true, pdpl_consent: true, sanctions: true, consent_ts: Date.now() },
};
const save = await call('PUT', `/api/public/drafts/${did}`, { token: dtok, data: application, step: 6 });
rec('KYC', 'autosave draft (PUT)', save.status === 200, `${save.status}`);
const restore = await call('GET', `/api/public/drafts/${did}?token=${encodeURIComponent(dtok)}`);
rec('KYC', 'resume draft (GET with token)', restore.status === 200 && !!restore.d.data, `${restore.status} step=${restore.d.step}`);
const badTok = await call('GET', `/api/public/drafts/${did}?token=deadbeef`);
rec('KYC', 'draft token is enforced', badTok.status >= 400, `${badTok.status} ${String(badTok.d.error || '').slice(0, 40)}`);

// documents: valid PDF (magic bytes), a disguised .pdf that is not a PDF, and an EICAR test string
const b64 = (s) => Buffer.from(s, 'binary').toString('base64');
const PDF = b64('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const EICAR = b64('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
let docs = await call('POST', `/api/public/drafts/${did}/documents`, { token: dtok, documents: [
  { type: 'trade_license', name: 'trade_license.pdf', mime: 'application/pdf', dataB64: PDF },
  { type: 'signatory_id', name: 'signatory_id.pdf', mime: 'application/pdf', dataB64: PDF }] });
rec('KYC', 'upload valid PDFs', docs.status === 200, `${docs.status} staged=${(docs.d.staged || []).length}`);
const fake = await call('POST', `/api/public/drafts/${did}/documents`, { token: dtok, documents: [{ type: 'other', name: 'evil.pdf', mime: 'application/pdf', dataB64: b64('MZ\x90\x00 this is an exe not a pdf') }] });
rec('KYC', 'rejects content/extension mismatch (magic bytes)', fake.status >= 400, `${fake.status} ${String(fake.d.error || '').slice(0, 60)}`);
const virus = await call('POST', `/api/public/drafts/${did}/documents`, { token: dtok, documents: [{ type: 'other', name: 'eicar.pdf', mime: 'application/pdf', dataB64: EICAR }] });
rec('KYC', 'EICAR virus test file is rejected (FRS IG-07/DV-03)', virus.status >= 400, `${virus.status} ${String(virus.d.error || '').slice(0, 60)} — a 400 here is only the magic-byte check, not a virus scanner`);

const staged = (docs.d.staged || []);
const submit = await call('POST', '/api/public/applications', { draftId: did, draftToken: dtok, application: { ...application, documents: staged } });
rec('KYC', 'submit application', submit.status === 201, `${submit.status} ref=${submit.d.reference || submit.d.id || JSON.stringify(submit.d).slice(0, 80)}`);
const ref = submit.d.reference || submit.d.id;

if (ref) {
  const st = await call('GET', `/api/public/applications/${encodeURIComponent(ref)}?email=${encodeURIComponent(EMAIL)}`);
  rec('KYC', 'public status with ref+email', st.status === 200, `${st.status} status=${st.d.status} history=${(st.d.history || []).length}`);
  const stBad = await call('GET', `/api/public/applications/${encodeURIComponent(ref)}?email=someone.else@example.invalid`);
  rec('KYC', 'status requires the matching email (no IDOR)', stBad.status >= 400, `${stBad.status}`);

  // staff review lifecycle
  const { j: rj, r: rl } = await login('reviewer@simalme.com', 'reviewer123');
  rec('KYC', 'reviewer login', rl.status === 200, `${rl.status}`);
  const approveTooEarly = await call('POST', `/api/admin/submissions/${encodeURIComponent(ref)}/actions`, { action: 'approve' }, rj);
  rec('KYC', 'approve直 from submitted is blocked (409)', approveTooEarly.status === 409, `${approveTooEarly.status} ${String(approveTooEarly.d.error || '').slice(0, 70)}`);
  const start = await call('POST', `/api/admin/submissions/${encodeURIComponent(ref)}/actions`, { action: 'start' }, rj);
  rec('KYC', 'start review (submitted -> under_review)', start.status === 200, `${start.status} -> ${start.d.status}`);
  const query = await call('POST', `/api/admin/submissions/${encodeURIComponent(ref)}/query`, { section: 'banking', message: 'Please re-upload the bank letter.' }, rj);
  rec('KYC', 'raise query to applicant', query.status === 200, `${query.status} -> ${query.d.status}`);
  const respond = await call('POST', `/api/public/applications/${encodeURIComponent(ref)}/respond`, { email: EMAIL, message: 'Re-uploaded as requested.' });
  rec('KYC', 'applicant responds to query', respond.status === 200, `${respond.status} -> ${respond.d.status}`);
  const approve = await call('POST', `/api/admin/submissions/${encodeURIComponent(ref)}/actions`, { action: 'approve' }, rj);
  rec('KYC', 'approve', approve.status === 200, `${approve.status} -> ${approve.d.status}`);
  const detail = await call('GET', `/api/admin/submissions/${encodeURIComponent(ref)}`, undefined, rj);
  rec('KYC', 'reviewer recorded on the record', !!detail.d.reviewer, `reviewer field = ${JSON.stringify(detail.d.reviewer)}`);
  const aud = await call('GET', '/api/admin/audit?action=all', undefined, rj);
  const mine = (Array.isArray(aud.d) ? aud.d : []).filter(a => String(a.target) === String(ref));
  rec('KYC', 'audit actor for review actions', mine.length > 0 && mine.every(a => a.actor && !/object|^\{\}$/.test(String(a.actor))), `actors = ${JSON.stringify([...new Set(mine.map(a => a.actor))])}`);
}

// ---------------------------------------------------------------- B) e-invoicing
const { j: pj, r: pl } = await login('partner@simalme.com', 'partner123');
rec('EINV', 'partner login', pl.status === 200, `${pl.status}`);
const mine0 = await call('GET', '/api/einvoice/mine', undefined, pj);
rec('EINV', 'partner sees own invoices', mine0.status === 200, `${mine0.status} count=${(mine0.d.invoices || []).length}`);
const inv = await call('POST', '/api/einvoice', { buyerTin: '100123456700003', buyerName: 'Sandbox Probe Trading LLC', issueDate: '2026-10-12', dueDate: '2026-10-26', currency: 'AED', lines: [{ desc: 'Crucial T705 1TB', qty: 10, unitPrice: '450.00' }] }, pj);
rec('EINV', 'create invoice', inv.status === 201, `${inv.status} ref=${inv.d.ref} status=${inv.d.status} ${String(inv.d.error || '').slice(0, 60)}`);
if (inv.d && inv.d.id) {
  const id = inv.d.id;
  const view = await call('GET', `/api/einvoice/${id}`, undefined, pj);
  rec('EINV', 'VAT/total computed server-side', view.status === 200, `total=${JSON.stringify(view.d.totals || view.d.total)} lines=${(view.d.lines || []).length}`);
  const tamper = await call('PUT', `/api/einvoice/${id}`, { totals: { grand: 1 }, lines: [{ desc: 'x', qty: 1, unitPrice: '1.000' }] }, pj);
  rec('EINV', '3-decimal price / tampered totals rejected (422)', tamper.status === 422, `${tamper.status} ${String(tamper.d.error || '').slice(0, 70)}`);
  const sub = await call('POST', `/api/einvoice/${id}/submit`, {}, pj);
  rec('EINV', 'submit invoice', sub.status === 200, `${sub.status} -> ${sub.d.status} ${String(sub.d.error || '').slice(0, 60)}`);
  const ubl = await call('GET', `/api/einvoice/${id}/ubl`, undefined, pj);
  rec('EINV', 'UBL 2.1 generated', ubl.status === 200, `${ubl.status} ${String(ubl.raw).slice(0, 90).replace(/\s+/g, ' ')}`);
  // staff side
  const { j: aj } = await login('admin@simalme.com', '[REDACTED-ROTATED-2026-10]');
  const q = await call('GET', '/api/einvoice/admin/queue', undefined, aj);
  rec('EINV', 'staff queue lists it', q.status === 200, `${q.status} rows=${(q.d.rows || []).length}`);
  const act = await call('POST', `/api/einvoice/admin/${id}/actions`, { action: 'validate' }, aj);
  rec('EINV', 'staff validate action', act.status === 200, `${act.status} -> ${act.d.status} ${String(act.d.error || '').slice(0, 70)}`);
  const del = await call('POST', `/api/einvoice/admin/${id}/actions`, { action: 'deliver' }, aj);
  rec('EINV', 'staff deliver (Peppol)', del.status === 200, `${del.status} -> ${del.d.status} ${String(del.d.error || '').slice(0, 70)}`);
  const reopen = await call('POST', `/api/einvoice/admin/${id}/actions`, { action: 'reopen' }, aj);
  rec('EINV', 'reopen a DELIVERED invoice (immutability)', reopen.status >= 400, `${reopen.status} ${String(reopen.d.error || '').slice(0, 110)} — expect a clean 409, a 500 means the DB trigger caught it`);
  // cross-partner access
  const { j: p2 } = await login('journey@example.com', 'partner123');
  const cross = await call('GET', `/api/einvoice/${id}`, undefined, p2);
  rec('EINV', 'cross-partner invoice access blocked', cross.status === 403 || cross.status === 401 || cross.status === 404, `${cross.status} ${String(cross.d.error || '').slice(0, 50)}`);
}

// ---------------------------------------------------------------- C) auth / password reset
const rr = await call('POST', '/api/auth/password-reset/request', { email: 'reviewer@simalme.com' });
rec('AUTH', 'reset request returns a constant response (no enumeration)', rr.status === 200, `${rr.status} ${JSON.stringify(rr.d).slice(0, 70)}`);
const rr2 = await call('POST', '/api/auth/password-reset/request', { email: 'definitely-not-a-user@example.invalid' });
rec('AUTH', 'same response for unknown address', rr.raw === rr2.raw, `known==unknown body: ${rr.raw === rr2.raw}`);
const { j: aj2 } = await login('admin@simalme.com', '[REDACTED-ROTATED-2026-10]');
const ob = await call('GET', '/api/cms/outbox?limit=5', undefined, aj2);
const rows = (ob.d.outbox || []);
const tokenRow = rows.find(r => /reset/i.test(r.subject || '') || /reset=/.test(r.body || ''));
const tok = tokenRow && (String(tokenRow.body).match(/reset=([A-Za-z0-9_-]{16,})/) || [])[1];
rec('AUTH', 'raw reset token readable via /api/cms/outbox (privilege escalation path)', !!tok, tok ? `token prefix ${tok.slice(0, 6)}… (len ${tok.length}) readable by any user with the "notes" permission` : 'no reset row found');
if (tok) {
  const conf = await call('POST', '/api/auth/password-reset/confirm', { token: tok, newPassword: 'Sandbox-Probe-Pw-1' });
  rec('AUTH', 'token from the outbox completes the reset (account takeover)', conf.status === 200, `${conf.status} ${JSON.stringify(conf.d).slice(0, 60)}`);
  const relog = await login('reviewer@simalme.com', 'Sandbox-Probe-Pw-1');
  rec('AUTH', 'login with the password set via the stolen token', relog.r.status === 200, `${relog.r.status} role=${relog.r.d?.user?.role}`);
  const reuse = await call('POST', '/api/auth/password-reset/confirm', { token: tok, newPassword: 'Another-Pw-2' });
  rec('AUTH', 'reset token is single-use', reuse.status >= 400, `${reuse.status} ${String(reuse.d.error || '').slice(0, 50)}`);
}
const dev = await login('admin@simalme.com', '[REDACTED-ROTATED-2026-10]');
rec('AUTH', 'shipped dev super-admin password still works', dev.r.status === 200, `admin@simalme.com/admin123 -> ${dev.r.status}`);

fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/workflow_e2e.json', JSON.stringify(R, null, 1));
const f = R.filter(x => x.pass === false).length, pa = R.filter(x => x.pass === true).length;
console.log(`\nSUMMARY: ${pa} pass, ${f} fail, ${R.length - pa - f} info`);
