#!/usr/bin/env node
/* peppol-verify.js — T8.2: Peppol live-exchange readiness verification (C2 §7).
 *
 * Drives the COMPLETE production invoice journey on a self-contained portal
 * instance (temp store, real service code):
 *
 *   staff approves seller KYC → partner account provisions → partner signs in
 *   → staff approves buyer KYC (fixed valid TRN) → partner creates invoice
 *   → submits → staff validates (7 checks) → delivers → partner fetches UBL
 *
 * Then asserts PEPPOL BIS Billing 3.0 structure on the generated UBL and the
 * delivery-receipt trail, and records everything to
 * scripts/peppol-verify-results.json.
 *
 * Honest scope: this proves the machine side (lifecycle, UBL structure,
 * endpoint IDs, receipts trail). The LIVE ASP transmission to ≥2 real
 * counterparties requires production ASP credentials (T5.2) — recorded as
 * PENDING in the evidence doc, never simulated as done.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_KYC_TEST = '1';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'peppol-'));
process.env.DATA_DIR = TMP;
process.env.ADMIN_EMAIL = 'peppol-staff@example.com';
process.env.ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.REVIEWER_EMAIL = 'peppol-reviewer@example.com';
process.env.REVIEWER_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.WATCHLIST_CSV = process.env.WATCHLIST_CSV || path.resolve('apps/portal/data/watchlist.csv'); /* real screening list (repo-root cwd contract) */

const { createApp } = await import('../apps/portal/src/server.js');
const { V } = await import('../apps/portal/src/domain/validators.js');
const app = await createApp({ dataDir: TMP });
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

let pass = 0, fail = 0;
const t = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
};
const jar = {};
async function call(method, p, body, who = 'staff') {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jar[who] ? { cookie: jar[who] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

/* a minimal but structurally valid PDF (magic bytes + a body) */
const pdfBytes = (label) => Buffer.concat([
  Buffer.from('%PDF-1.4\n% ' + label + '\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'),
  Buffer.from('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 99 99]>>endobj\n'),
  Buffer.from('trailer<</Root 1 0 R>>\n%%EOF'),
]);

function application(role, email, trn) {
  return {
    role,
    company: {
      legal_name_en: 'Peppol Verify ' + role + ' LLC', entity_type: 'LLC', country: 'AE',
      license_number: 'CN-PV-' + role.slice(0, 3).toUpperCase(), license_authority: 'DMCC',
      license_issue: '2024-01-01', license_expiry: '2028-01-01',
      business_activity: 'Wholesale of IT components',
      address: { building: 'B1', street: 'S1', city: 'Dubai', emirate: 'Dubai', country: 'United Arab Emirates' },
    },
    tax: { trn, vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' },
    contacts: { primary: { name: 'Pep Ver', designation: 'Owner', email, mobile: '+971501234567' } },
    signatories: [{ name: 'Pep Ver', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P123456', id_expiry: '2029-01-01', authority_basis: 'MOA (manager)', email }],
    ubos: [{ name: 'Pep Ver', nationality: 'AE', id_type: 'passport', id_number: 'P654321', ownership_pct: '100', country_of_residence: 'UAE' }],
    banking: { bank_name: 'Emirates NBD', iban: V.makeIBAN('026', String(crypto.randomBytes(4).readUInt32BE(0))), account_holder: 'Peppol Verify LLC', currency: 'AED' },
    declarations: { accuracy: { checked: true, signed_name: 'Pep Ver' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    documents: ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof']
      .map(dt => ({ type: dt, name: dt + '.pdf', mime: 'application/pdf', dataB64: pdfBytes(dt).toString('base64') })),
  };
}

async function approveSubmission(ref) {
  let r = await call('GET', '/api/admin/submissions/' + ref);
  if (r.json.status === 'submitted') await call('POST', '/api/admin/submissions/' + ref + '/actions', { action: 'start' });
  return call('POST', '/api/admin/submissions/' + ref + '/actions', { action: 'approve' });
}

/* ---- 1. staff session ---- */
let r = await call('POST', '/api/auth/login', { email: 'peppol-staff@example.com', password: process.env.ADMIN_PASSWORD });
t('staff session', r.status === 200 && r.json.user?.role === 'super_admin');

/* ---- 2. seller partner: submit + approve + provision ---- */
const SELLER_TRN = V.makeTIN('100' + String(crypto.randomBytes(8).readBigUInt64BE(0)).replace(/\D/g, '').slice(0, 10).padEnd(10, '7'));
r = await call('POST', '/api/public/applications', { application: application('vendor', 'seller@peppol-verify.test', SELLER_TRN) });
t('seller KYC submitted', r.status === 201, r.json?.reference || '');
const sellerRef = r.json.reference;
r = await approveSubmission(sellerRef);
t('seller KYC approved → partner account provisioned', r.status === 200 && r.json.status === 'approved', r.json?.partnerAccount?.email || '');

/* temp password from the provisioning email in the outbox */
r = await call('GET', '/api/admin/outbox');
const provMail = (r.json || []).find(m => /seller@peppol-verify\.test/.test(m.to || '') && /temp|password/i.test(m.text || m.subject || ''));
t('partner provisioning email in outbox', !!provMail);
const tempPw = provMail ? (provMail.text.match(/Simal-[a-f0-9]{8}/) || [null])[0] : null; /* provisioning format: Simal-<8hex> */
t('temporary credential extracted', !!tempPw);

/* ---- 3. partner session ---- */
r = await call('POST', '/api/auth/login', { email: 'seller@peppol-verify.test', password: tempPw }, 'partner');
t('partner sign-in with provisioned credential', r.status === 200 && r.json.user?.role === 'partner', r.json?.user?.email || '');

/* ---- 4. buyer counterparty: approved KYC with fixed TRN ---- */
const BUYER_TRN = V.makeTIN('100123456700'); /* fixed 12-digit prefix → deterministic checksum-valid 15-digit TRN */
r = await call('POST', '/api/public/applications', { application: application('vendor', 'buyer@peppol-verify.test', BUYER_TRN) });
const buyerRef = r.json.reference;
r = await approveSubmission(buyerRef);
t('buyer counterparty approved (Peppol-registered partner #1)', r.status === 200 && r.json.status === 'approved', BUYER_TRN);

/* ---- 5. invoice lifecycle ---- */
const today = new Date().toISOString().slice(0, 10);
const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
r = await call('POST', '/api/einvoice', {
  buyerTin: BUYER_TRN, buyerName: 'Peppol Verify Buyer LLC', poRef: 'PO-PV-1',
  issueDate: today, dueDate: due, currency: 'AED',
  lines: [{ desc: 'Crucial T705 2TB SSD', qty: 3, unitPrice: '455.00' }, { desc: 'Koorui 27in monitor', qty: 2, unitPrice: '649.25' }],
}, 'partner');
t('invoice created (draft)', r.status === 201, r.json?.ref || '');
const invId = r.json?.id;
const invRef = r.json?.ref || null;

r = await call('POST', '/api/einvoice/' + invId + '/submit', {}, 'partner');
t('invoice submitted', r.status === 200 && r.json?.status === 'submitted');

r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'validate' });
t('staff validation (7 checks) passed', r.status === 200 && r.json?.status === 'validated');

r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
t('delivered via Peppol path', r.status === 200 && r.json?.status === 'delivered', r.json?.ubl?.id || '');

/* ---- 6. UBL BIS 3.0 structural assertions ---- */
r = await call('GET', '/api/einvoice/' + invId + '/ubl', undefined, 'partner');
const ubl = r.json?.ubl;
t('UBL retrievable by partner', !!ubl);
if (ubl) {
  t('UBL version 2.1 + customisation present', ubl.ublVersion === '2.1' && !!ubl.customisationID);
  t('invoice type code 388 (commercial invoice)', ubl.invoiceTypeCode === 388);
  t('supplier endpoint 0235 scheme', ubl.supplier.endpointID?.startsWith('0235:') && ubl.supplier.schemeID === '0235');
  t('buyer endpoint = 0235:<10-digit-TIN> (PINT AE)', ubl.customer.endpointID === '0235:' + BUYER_TRN.slice(0, 10), ubl.customer.endpointID);
  t('currency AED + dates ISO', ubl.currencyCode === 'AED' && /^\d{4}-\d{2}-\d{2}$/.test(ubl.issueDate) && /^\d{4}-\d{2}-\d{2}$/.test(ubl.dueDate));
  let lineMath = true;
  for (const l of ubl.lines) {
    const net = Math.round(l.quantity * Math.round(l.unitPrice * 100));
    const vat = Math.floor((net * 5 + 50) / 100);
    if (Math.round(l.baseAmount * 100) !== net || Math.round(l.taxAmount * 100) !== vat) lineMath = false;
  }
  t('line-level fils math (net, 5% VAT floor-round)', lineMath, ubl.lines.length + ' line(s)');
  const tot = ubl.totals;
  t('totals: payable = net + VAT', Math.round(tot.payable * 100) === Math.round(tot.net * 100) + Math.round(tot.vat * 100), 'net ' + tot.net + ' + vat ' + tot.vat + ' = ' + tot.payable);
  t('KYC linkage on UBL (buyer match)', ubl.kyc?.reference === buyerRef, ubl.kyc?.reference || 'missing');
}

/* ---- 7. receipt trail ---- */
r = await call('GET', '/api/einvoice/' + invId, undefined, 'partner');
const tl = r.json?.timeline || [];
t('timeline carries delivery event with actor + timestamp', tl.some(e => /deliver/i.test(e.label) && e.ts > 0 && !!e.actor), tl.length + ' events');

await new Promise(res2 => app.server.close(res2));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

const out = {
  ts: new Date().toISOString(), mode: 'sandbox (real service code, temp store)',
  pass, fail,
  invoiceRef: invRef, buyerTrn: BUYER_TRN, sellerTrn: SELLER_TRN, kycBuyerRef: buyerRef, kycSellerRef: sellerRef,
  pendingLiveItems: [
    'ASP production credentials (T5.2, 20 Nov gate)',
    'live transmission to ≥2 real counterparties',
    'MLR + transmission receipt IDs from production ASP',
  ],
};
fs.writeFileSync(path.resolve('scripts/peppol-verify-results.json'), JSON.stringify(out, null, 2));
console.log('\nPEPPOL VERIFY (sandbox): ' + pass + ' PASS, ' + fail + ' FAIL → scripts/peppol-verify-results.json');
console.log('live items pending: ' + out.pendingLiveItems.join(' · '));
process.exit(fail ? 1 : 0);
