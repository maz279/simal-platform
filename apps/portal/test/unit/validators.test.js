/* Unit tests: validators (TIN/IBAN/EID/Peppol/application) — node:test */
import test from 'node:test';
import assert from 'node:assert/strict';
import { V, validateApplication } from '../../src/domain/validators.js';

test('TIN generator produces checksum-valid 15-digit numbers', () => {
  const tin = V.makeTIN('10047284770');
  assert.match(tin, /^\d{15}$/);
  assert.ok(V.tin(tin));
});
test('tampered TIN still passes — validation is structural only (OQ-9 resolved)', () => {
  // The mod-97 gate was removed 2026-09-27: four real FTA TRNs failed it.
  // A 15-digit TIN is accepted regardless of check digit; reviewers verify
  // against the TRN certificate (FR-A-013 checklist).
  const tin = V.makeTIN('10047284770');
  const bad = tin.slice(0, 14) + ((parseInt(tin[14], 10) + 1) % 10);
  assert.ok(V.tin(bad));
});
test('real FTA TRNs observed in production are accepted', () => {
  for (const t of ['100356812600003', '100218689600003', '100526859200003', '100357398500003']) {
    assert.ok(V.tin(t), t + ' must be accepted');
  }
});
test('10-digit TRN rejected', () => assert.ok(!V.tinFormat('1004728477')));

test('IBAN generator passes mod-97; wrong check digits rejected', () => {
  const iban = V.makeIBAN('026', '123456789012345');
  assert.match(iban, /^AE\d{21}$/);
  assert.ok(V.iban(iban));
  assert.ok(!V.iban('AE99' + iban.slice(4)));
  assert.ok(!V.iban('AE07 0331'));
});
test('Emirates ID structure validated', () => {
  assert.ok(V.eid('784-1985-1234567-9'));
  assert.ok(!V.eid('784-1850-1234567-9'));
  assert.ok(!V.eid('123'));
});
test('Peppol pattern', () => {
  assert.ok(V.peppol('0235:100472847700003'));
  assert.ok(!V.peppol('0235:'));
});

/* ---------- full application validation ---------- */
const baseApp = () => ({
  role: 'vendor',
  company: {
    legal_name_en: 'Test Vendor LLC', entity_type: 'LLC', country: 'AE',
    license_number: 'CN-1', license_authority: 'DMCC',
    license_issue: '2024-01-01', license_expiry: '2027-01-01',
    business_activity: 'Trading',
    address: { building: 'B1', street: 'S1', city: 'Dubai', emirate: 'Dubai', country: 'UAE' },
  },
  tax: { trn: V.makeTIN('10012345678'), vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' },
  contacts: { primary: { name: 'A B', designation: 'Owner', email: 'a@b.ae', mobile: '+971501234567' } },
  signatories: [{ name: 'A B', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P123456', id_expiry: '2028-01-01', authority_basis: 'MOA (manager)', email: 'a@b.ae' }],
  ubos: [{ name: 'A B', nationality: 'AE', id_type: 'passport', id_number: 'P1', ownership_pct: '100', country_of_residence: 'UAE' }],
  banking: { bank_name: 'Emirates NBD', iban: V.makeIBAN('026', '1'), account_holder: 'Test Vendor LLC', currency: 'AED' },
  documents: [
    { type: 'trade_license' }, { type: 'trn_cert' }, { type: 'moa' },
    { type: 'signatory_id' }, { type: 'tenancy' }, { type: 'ubo_ids' }, { type: 'bank_proof' },
  ],
  declarations: {
    accuracy: { checked: true, signed_name: 'A B' },
    ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true },
  },
});

test('complete valid application passes', () => {
  const { valid, errors } = validateApplication(baseApp());
  assert.ok(valid, JSON.stringify(errors));
});

test('bad TRN blocks submission with field error', () => {
  const app = baseApp();
  app.tax.trn = '100472847700'; // 12 digits — structural rejection (checksum no longer gates, OQ-9)
  const { valid, errors } = validateApplication(app);
  assert.ok(!valid);
  assert.ok(errors.some(e => e.field === 'tax.trn'));
});
test('foreign entity swaps TRN for foreign tax id', () => {
  const app = baseApp();
  app.company.country = 'CN';
  delete app.tax.trn;
  const { errors } = validateApplication(app);
  assert.ok(errors.some(e => e.field === 'tax.foreign_tax_id'));
  app.tax.foreign_tax_id = 'VAT123';
  assert.ok(validateApplication(app).valid);
});
test('UAE Peppol must equal 0235:TIN', () => {
  const app = baseApp();
  app.tax.peppol_id = '0235:999999999999999';
  assert.ok(validateApplication(app).errors.some(e => e.field === 'tax.peppol_id'));
});
test('expired licence rejected', () => {
  const app = baseApp();
  app.company.license_expiry = '2020-01-01';
  assert.ok(validateApplication(app).errors.some(e => e.field === 'company.license_expiry'));
});
test('missing required vendor documents rejected', () => {
  const app = baseApp();
  app.documents = app.documents.slice(0, 3);
  const { errors } = validateApplication(app);
  assert.ok(errors.some(e => e.field === 'documents.bank_proof'));
});
test('POA signatory requires POA document', () => {
  const app = baseApp();
  app.signatories[0].authority_basis = 'POA';
  assert.ok(validateApplication(app).errors.some(e => e.field === 'documents.poa'));
});
test('expired signatory ID rejected', () => {
  const app = baseApp();
  app.signatories[0].id_expiry = '2019-01-01';
  assert.ok(validateApplication(app).errors.some(e => /id_expiry/.test(e.field)));
});
test('ownership over 100 rejected', () => {
  const app = baseApp();
  app.ubos.push({ name: 'C D', nationality: 'AE', id_type: 'passport', id_number: 'P2', ownership_pct: '50', country_of_residence: 'UAE' });
  assert.ok(validateApplication(app).errors.some(e => e.field === 'ubos.ownership_pct'));
});
test('unaccepted declarations rejected', () => {
  const app = baseApp();
  app.declarations.pdpl_consent.checked = false;
  assert.ok(validateApplication(app).errors.some(e => e.field === 'declarations.pdpl_consent'));
});
test('invalid IBAN rejected', () => {
  const app = baseApp();
  app.banking.iban = 'AE003310000000123456789';
  assert.ok(validateApplication(app).errors.some(e => e.field === 'banking.iban'));
});
test('customer role requires fewer documents', () => {
  const app = baseApp();
  app.role = 'customer';
  app.documents = [
    { type: 'trade_license' }, { type: 'trn_cert' }, { type: 'moa' },
    { type: 'signatory_id' }, { type: 'bank_proof' },
  ];
  assert.ok(validateApplication(app).valid);
});
