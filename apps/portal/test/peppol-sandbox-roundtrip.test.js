/* peppol-sandbox-roundtrip.test.js — T2.5 (INT-5): full UBL 2.1 round-trip
 * against a local mock ASP implementing the accreditation contract:
 * generate → validate (7 checks) → transmit (HMAC-signed, SSRF-guarded) →
 * ACK carrying a Peppol transmissionId → stored on the invoice UBL in the
 * SAME save that delivers (C3 immutability honoured) → timeline + audit.
 * NACK path: invoice stays `validated` for staff retry.
 *
 * The mock runs on loopback under the explicit ASP_ALLOW_LOOPBACK=1 sandbox
 * escape (production never sets it). Real-ASP certification pending creds.
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
/* Documents are encrypted at rest and both stores refuse a default key (rm 10.4-1). A clean
 * CI runner has no apps/portal/.env, so every suite that boots the app brings its own key
 * (platform run #12 failed workspace + pg-mode-journey without it). */
if (!process.env.DOC_ENCRYPTION_KEY) process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');

process.env.NODE_KYC_TEST = '1';
process.env.DATABASE_URL = ''; // rm(1.2-3): never touch the live PG from tests (JSON temp store only)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'asp-'));
process.env.DATA_DIR = TMP;

/* mock ASP first — we need its port before booting the portal */
const ASP_SECRET = crypto.randomBytes(32).toString('hex');
process.env.ASP_SHARED_SECRET = ASP_SECRET;
process.env.ASP_ALLOW_LOOPBACK = '1';

const received = [];
let mode = 'ack'; /* ack | nack */
const mockAsp = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const sig = req.headers['x-simal-signature'] || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', ASP_SECRET).update(body).digest('hex');
    if (req.method !== 'POST' || sig !== expected) {
      res.writeHead(401, { 'Content-Type': 'application/json' }).end('{"ok":false,"reason":"bad signature"}');
      return;
    }
    const j = JSON.parse(body);
    received.push(j);
    if (mode === 'ack') {
      const transmissionId = 'PEPPOL-TX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, transmissionId }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, reason: 'schema violation: cac:LegalMonetaryTotal mismatch' }));
    }
  });
});
await new Promise(r => mockAsp.listen(0, '127.0.0.1', r));
process.env.ASP_ENDPOINT = 'http://127.0.0.1:' + mockAsp.address().port + '/peppol/submit';

const ADMIN_EMAIL = 'asp-staff@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.WATCHLIST_CSV = path.resolve('test/fixtures/watchlist.csv'); // rm(9.1-3): tracked fixture (data/ is git-ignored)
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.LOGIN_RATE_MAX = '100';

const { createApp } = await import('../src/server.js');
const { V } = await import('../src/domain/validators.js');
const app = await createApp({ dataDir: TMP });
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

const pdfBytes = (label) => Buffer.concat([
  Buffer.from('%PDF-1.4\n% ' + label + '\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'),
  Buffer.from('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 99 99]>>endobj\n'),
  Buffer.from('trailer<</Root 1 0 R>>\n%%EOF'),
]);
function application(role, email, trn) {
  return {
    role,
    company: { legal_name_en: 'ASP Roundtrip ' + role + ' LLC', entity_type: 'LLC', country: 'AE', license_number: 'CN-AS-' + role.slice(0, 3).toUpperCase(), license_authority: 'DMCC', license_issue: '2024-01-01', license_expiry: '2028-01-01', business_activity: 'IT', address: { building: 'B', street: 'S', city: 'Dubai', emirate: 'Dubai', country: 'UAE' } },
    tax: { trn, vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' },
    contacts: { primary: { name: 'As P Tester', designation: 'Owner', email, mobile: '+971501234567' } },
    signatories: [{ name: 'As P Tester', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P1', id_expiry: '2029-01-01', authority_basis: 'MOA (manager)', email }],
    ubos: [{ name: 'As P Tester', nationality: 'AE', id_type: 'passport', id_number: 'P2', ownership_pct: '100', country_of_residence: 'UAE' }],
    banking: { bank_name: 'ENBD', iban: V.makeIBAN('026', String(crypto.randomBytes(4).readUInt32BE(0))), account_holder: 'ASP RT LLC', currency: 'AED' },
    declarations: { accuracy: { checked: true, signed_name: 'As P Tester' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    documents: ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof'].map(dt => ({ type: dt, name: dt + '.pdf', mime: 'application/pdf', dataB64: pdfBytes(dt).toString('base64') })),
  };
}

const jar = {};
async function call(method, p, body, who = 'staff') {
  const r = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', ...(jar[who] ? { cookie: jar[who] } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}
async function approve(ref) {
  await call('POST', '/api/admin/submissions/' + ref + '/actions', { action: 'start' });
  return call('POST', '/api/admin/submissions/' + ref + '/actions', { action: 'approve' });
}

test('full round-trip: KYC approvals → invoice → validate → ASP transmit → ACK + transmissionId on delivered UBL', async () => {
  await call('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const SELLER_TRN = V.makeTIN('100' + String(crypto.randomBytes(8).readBigUInt64BE(0)).replace(/\D/g, '').slice(0, 10).padEnd(10, '7'));
  const BUYER_TRN = V.makeTIN('100123456700');
  let r = await call('POST', '/api/public/applications', { application: application('vendor', 'seller@asp-rt.test', SELLER_TRN) });
  assert.equal(r.status, 201, 'seller submission accepted');
  await approve(r.json.reference);
  r = await call('POST', '/api/public/applications', { application: application('vendor', 'buyer@asp-rt.test', BUYER_TRN) });
  assert.equal(r.status, 201, 'buyer submission accepted');
  await approve(r.json.reference);

  /* partner session from provisioning email */
  r = await call('GET', '/api/admin/outbox');
  const prov = (r.json || []).find(m => /seller@asp-rt\.test/.test(m.to || '') && /partner account/i.test(m.subject || ''));
  const tempPw = prov.text.match(/Simal-[a-f0-9]{8}/)[0];
  await call('POST', '/api/auth/login', { email: 'seller@asp-rt.test', password: tempPw }, 'partner');

  const today = new Date().toISOString().slice(0, 10);
  r = await call('POST', '/api/einvoice', { buyerTin: BUYER_TRN, buyerName: 'ASP Roundtrip Buyer LLC', poRef: 'PO-RT-1', issueDate: today, dueDate: today, currency: 'AED', lines: [{ desc: 'SSD 1TB', qty: 4, unitPrice: '310.75' }] }, 'partner');
  assert.equal(r.status, 201, 'invoice created');
  const invId = r.json.id, invRef = r.json.ref;

  await call('POST', '/api/einvoice/' + invId + '/submit', {}, 'partner');
  r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'validate' });
  assert.equal(r.json.status, 'validated', '7-check validation passed');

  mode = 'ack';
  r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
  assert.equal(r.status, 200, 'deliver OK');
  assert.equal(r.json.status, 'delivered');

  /* mock ASP saw one properly-signed BIS payload for THIS invoice */
  assert.equal(received.length, 1);
  assert.equal(received[0].ref, invRef);
  assert.ok(received[0].ubl && received[0].ubl.ublVersion === '2.1' && received[0].ubl.invoiceTypeCode === 388, 'BIS 3.0 payload at the ASP');

  /* transmissionId persisted on the delivered invoice */
  r = await call('GET', '/api/einvoice/' + invId, undefined, 'partner');
  const tx = r.json.ubl?.transmissionId;
  assert.ok(/^PEPPOL-TX-/.test(tx || ''), 'transmissionId stored: ' + tx);
  assert.ok((r.json.timeline || []).some(e => /Transmitted via ASP/.test(e.label)), 'timeline carries the transmission event');
});

test('NACK path: invoice stays validated for staff retry', async () => {
  const BUYER_TRN = V.makeTIN('100123456700');
  const today = new Date().toISOString().slice(0, 10);
  let r = await call('POST', '/api/einvoice', { buyerTin: BUYER_TRN, buyerName: 'ASP Roundtrip Buyer LLC', poRef: 'PO-RT-2', issueDate: today, dueDate: today, currency: 'AED', lines: [{ desc: 'SSD 2TB', qty: 1, unitPrice: '520.00' }] }, 'partner');
  const invId = r.json.id;
  await call('POST', '/api/einvoice/' + invId + '/submit', {}, 'partner');
  await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'validate' });

  mode = 'nack';
  r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
  assert.equal(r.status, 502, 'NACK surfaces as 502 to staff');
  r = await call('GET', '/api/einvoice/' + invId, undefined, 'partner');
  assert.equal(r.json.status, 'validated', 'not delivered on NACK');
  assert.ok((r.json.timeline || []).some(e => /ASP transmission FAILED/.test(e.label)), 'failure recorded in timeline');

  /* retry after the ASP recovers → delivers */
  mode = 'ack';
  r = await call('POST', '/api/einvoice/admin/' + invId + '/actions', { action: 'deliver' });
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'delivered');
});

after(async () => {
  await new Promise(r => app.server.close(r));
  await new Promise(r => mockAsp.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
