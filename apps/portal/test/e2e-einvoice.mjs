/* SUPERSEDED (6 Oct 2026 audit): this harness needs a manually-started seeded
 * dev server on :8090. The same journey is now covered END-TO-END and in CI by
 * test/peppol-sandbox-roundtrip.test.js (with a real ASP round-trip) and
 * test/pg-mode-journey.test.js (on the production PG store). Kept for history.
 * e2e-einvoice.mjs — full KYC→e-invoice journey against a running server.
 * staff approves a KYC → partner account auto-provisions (temp password in outbox)
 * → partner signs in → creates invoice (buyer = another approved partner)
 * → submits → staff validates (7 checks) → delivers → UBL carries Peppol 0235 IDs.
 * Run: node test/e2e-einvoice.mjs [base]   (default http://127.0.0.1:8090) */
const BASE = process.argv[2] || 'http://127.0.0.1:8090';
let failed = 0;
const ok = (name, cond, extra = '') => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' — ' + extra : ''));
  if (!cond) failed++;
};
const jar = {};
async function call(method, path, body, use = 'staff') {
  const headers = { 'Content-Type': 'application/json', ...(jar[use] ? { cookie: jar[use] } : {}) };
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) jar[use] = setCookie.split(';')[0];
  let json = null; try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

/* 1 — staff login */
let r = await call('POST', '/api/auth/login', { email: 'admin@smartme.com', password: 'admin' });
ok('staff login', r.status === 200 && r.json.user.role === 'super_admin');

/* 2 — find a submission we can approve (start → approve) */
r = await call('GET', '/api/admin/submissions?status=submitted&per=5');
const target = (r.json.rows || [])[0] || (await call('GET', '/api/admin/submissions?status=under_review&per=5')).json.rows?.[0];
ok('submissions available', !!target, target ? target.id + ' (' + target.status + ')' : 'none');
if (target && target.status === 'submitted') await call('POST', '/api/admin/submissions/' + target.id + '/actions', { action: 'start' });
r = await call('POST', '/api/admin/submissions/' + target.id + '/actions', { action: 'approve' });
ok('approve KYC', r.status === 200 && r.json.status === 'approved');

/* 3 — partner account provisioned; temp password from the outbox */
r = await call('GET', '/api/admin/submissions/' + target.id);
const partnerEmail = r.json.contacts?.primary?.email;
ok('partner account noted on submission', !!r.json.partnerAccount, partnerEmail || '');
r = await call('GET', '/api/admin/outbox');   /* may 404 if route differs — fall back below */
let temp = null;
if (r.status === 200) {
  const msg = (r.json.messages || r.json || []).find?.((m) => /temporary password/i.test(m.subject + m.text) && m.to === partnerEmail);
  temp = msg ? (/temporary password:\s*(\S+)/i.exec(msg.text)?.[1]) : null;
}
ok('temp password issued', !!temp, temp || 'not found in outbox');

/* 4 — partner signs in */
r = await call('POST', '/api/auth/login', { email: partnerEmail, password: temp }, 'partner');
ok('partner login', r.status === 200 && r.json.user?.role === 'partner');

/* 5 — create invoice: buyer = the OTHER approved seeded partner */
r = await call('GET', '/api/admin/submissions?status=approved&per=10');
const buyer = r.json.rows.find((s) => s.id !== target.id);
ok('second approved buyer found', !!buyer, buyer ? buyer.id + ' TRN ' + buyer.tin : '');
r = await call('POST', '/api/einvoice', {
  buyerTin: buyer.tin, buyerName: buyer.company, poRef: 'PO-E2E-001',
  issueDate: '2026-10-05', dueDate: '2026-11-04', currency: 'AED',
  lines: [
    { desc: 'Crucial T705 2TB NVMe SSD', qty: 10, unitPrice: '1250.50' },
    { desc: 'UGREEN 5-in-1 USB-C hub', qty: 25, unitPrice: '89.99' },
  ],
}, 'partner');
ok('invoice created', r.status === 201 && /^SIM-INV-\d{4}-\d{4}$/.test(r.json.ref), r.json.ref || JSON.stringify(r.json));
const invId = r.json.id;

/* integer math check: 10×1250.50=12505.00, 25×89.99=2249.75 → net 14754.75, VAT 737.74 (half-up), total 15492.49 */
r = await call('GET', '/api/einvoice/' + invId, null, 'partner');
ok('fils-exact totals', r.json.totals.net === '14754.75' && r.json.totals.vat === '737.74' && r.json.totals.total === '15492.49', JSON.stringify(r.json.totals));
ok('kyc linked to buyer', !!r.json.kyc && r.json.kyc.reference === buyer.id);

/* 6 — submit → validate → deliver */
r = await call('POST', '/api/einvoice/' + invId + '/submit', {}, 'partner');
ok('submitted', r.status === 200 && r.json.status === 'submitted');
r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'validate' });
ok('validated 7/7', r.status === 200 && r.json.status === 'validated' && r.json.validation?.pass === true);
r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
ok('delivered', r.status === 200 && r.json.status === 'delivered');
r = await call('GET', '/api/einvoice/' + invId + '/ubl', null, 'partner');
ok('UBL Peppol IDs', r.json.ubl.customer.endpointID === '0235:' + buyer.tin && r.json.ubl.supplier.schemeID === '0235', r.json.ubl.id);

/* 7 — negative paths: partner cannot touch others' invoices; invalid transitions */
r = await call('POST', '/api/einvoice', { buyerTin: '123', buyerName: 'x', issueDate: '2026-10-05', dueDate: '2026-10-01', currency: 'USD', lines: [] }, 'partner');
ok('bad invoice rejected with field details', r.status === 422 && Array.isArray(r.json.details), (r.json.details || []).map(d => d.field).join(','));
r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
ok('double-deliver blocked (409)', r.status === 409);

console.log(failed ? ('FAILED: ' + failed) : 'ALL PASS');
process.exit(failed ? 1 : 0);
