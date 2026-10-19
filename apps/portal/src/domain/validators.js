/* ==========================================================================
 * validators.js — domain validation (UAE KYC).
 * Ported from the audited prototype and hardened for server-side authority.
 *
 * NOTE (PRD OQ-9 — RESOLVED 2026-09-27): the FTA's official TRN check-digit
 * algorithm is not publicly confirmed. The earlier mod-97 prototype strategy
 * was disproved against real FTA TRNs (four production TRNs all failed it),
 * so UAE TRN validation is STRUCTURAL ONLY (15 digits). Reviewers verify the
 * TRN against the certificate/EmaraTax per checklist item FR-A-013.
 * tinChecksum/mod97 are retained for seed generators only — never gate a
 * submission on them. Single-point swap if the FTA ever publishes the rule.
 * ========================================================================== */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;
const URL_RE = /^https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/\S*)?$/;
const PEPPOL_RE = /^\d{4}:[A-Za-z0-9.\-+]{4,20}$/;

function mod97(digits) {
  let rem = 0;
  for (let i = 0; i < digits.length; i++) rem = (rem * 10 + (digits.charCodeAt(i) - 48)) % 97;
  return rem;
}

export const V = {
  email: v => EMAIL_RE.test(String(v || '').trim()),
  phone: v => !v || PHONE_RE.test(String(v).trim()),
  url: v => !v || URL_RE.test(String(v).trim()),
  required: v => v !== undefined && v !== null && String(v).trim() !== '' && (!Array.isArray(v) || v.length > 0),
  number: v => !v || /^-?\d+(\.\d+)?$/.test(String(v).trim()),
  pct: v => !v || (Number.isFinite(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100),

  tinFormat: v => /^\d{15}$/.test(String(v || '').trim()),
  tinChecksum: v => mod97(String(v)) === 1, // seed-generator helper only — NOT a submission gate (see header)
  tin: v => V.tinFormat(v),

  iban: v => {
    const iban = String(v || '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
    if (iban.startsWith('AE') && iban.length !== 23) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let digits = '';
    for (const c of rearranged) digits += c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c;
    return mod97(digits) === 1;
  },

  eid: v => {
    const d = String(v || '').replace(/[^0-9]/g, '');
    if (!/^784\d{12}$/.test(d)) return false;
    const year = parseInt(d.slice(3, 7), 10);
    return year >= 1920 && year <= 2012;
  },

  peppol: v => !v || PEPPOL_RE.test(String(v).trim()),

  dateNotPast: v => { const d = new Date(v); return !isNaN(d) && d.getTime() > Date.now(); },
  dateNotFuture: v => { const d = new Date(v); return !isNaN(d) && d.getTime() <= Date.now(); },

  makeTIN(prefix) { // deterministic generator for seeds/tests
    let base = String(prefix).replace(/\D/g, '');
    if (base.length < 10 || base.length > 13) throw new Error('makeTIN: 10-13 digit prefix');
    base = (base + '0000000000000').slice(0, 13);
    const cd = (1 + 97 - mod97(base + '00')) % 97;
    return base + String(cd).padStart(2, '0');
  },
  makeIBAN(bankCode, account) {
    const acct = (String(account) + '0000000000000000').slice(0, 16);
    const body = 'AE00' + bankCode + acct;
    const rearranged = body.slice(4) + body.slice(0, 4);
    let digits = '';
    for (const c of rearranged) digits += c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c;
    let cd = (98 - mod97(digits));
    if (cd < 10) cd = '0' + cd;
    return 'AE' + cd + bankCode + acct;
  },
};

/* ---------- full application validation (server is the authority) ---------- */
const DOC_REQUIRED_VENDOR = ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof'];
const DOC_REQUIRED_CUSTOMER = ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'bank_proof'];
const DOC_ALLOWED = [...new Set([...DOC_REQUIRED_VENDOR, ...DOC_REQUIRED_CUSTOMER, 'poa', 'signature', 'other'])];

export function validateApplication(app) {
  const errors = [];
  const err = (field, message) => errors.push({ field, message });
  const c = app.company || {}, t = app.tax || {}, b = app.banking || {},
    contacts = app.contacts || {}, sigs = app.signatories || [], ubos = app.ubos || [],
    docs = app.documents || [];
  const isUAE = (c.country || 'AE') === 'AE';

  if (!V.required(c.legal_name_en)) err('company.legal_name_en', 'Legal company name (English) is required');
  if (!V.required(c.entity_type)) err('company.entity_type', 'Legal entity type is required');
  if (!V.required(c.country)) err('company.country', 'Country of incorporation is required');
  if (!V.required(c.license_number)) err('company.license_number', 'Trade licence number is required');
  if (!V.required(c.license_authority)) err('company.license_authority', 'Licensing authority is required');
  if (!V.required(c.business_activity)) err('company.business_activity', 'Main business activity is required');
  if (!V.required(c.license_issue) || !V.dateNotFuture(c.license_issue)) err('company.license_issue', 'Licence issue date is required and cannot be in the future');
  if (!V.required(c.license_expiry) || !V.dateNotPast(c.license_expiry)) err('company.license_expiry', 'Licence must be valid (expiry in the future)');
  const a = c.address || {};
  for (const k of ['building', 'street', 'city', 'emirate', 'country']) {
    if (!V.required(a[k])) err('company.address.' + k, 'Address field "' + k + '" is required');
  }
  if (c.website && !V.url(c.website)) err('company.website', 'Website URL is invalid');

  if (isUAE) {
    if (!V.tinFormat(t.trn)) err('tax.trn', 'UAE TRN/TIN must be exactly 15 digits — as printed on the TRN certificate');
  } else if (!V.required(t.foreign_tax_id)) {
    err('tax.foreign_tax_id', 'Home-country tax ID is required for non-UAE entities');
  }
  if (t.peppol_id && !V.peppol(t.peppol_id)) err('tax.peppol_id', 'Peppol ID format: scheme:number, e.g. 0235:<TIN>');
  if (t.peppol_id && isUAE && t.trn && t.peppol_id !== '0235:' + t.trn) {
    err('tax.peppol_id', 'For UAE entities the Peppol ID must be 0235: followed by the TRN');
  }
  if (!V.required(t.einv_status)) err('tax.einv_status', 'E-invoicing readiness is required');
  if (!['live', 'in_progress', 'not_started', 'not_aware'].includes(t.einv_status)) err('tax.einv_status', 'Invalid e-invoicing status');
  if (!V.required(t.invoice_currency)) err('tax.invoice_currency', 'Invoice currency is required');
  if (t.tax_contact && t.tax_contact.email && !V.email(t.tax_contact.email)) err('tax.tax_contact.email', 'Tax contact email is invalid');

  const p = contacts.primary || {};
  if (!V.required(p.name)) err('contacts.primary.name', 'Primary contact name is required');
  if (!V.required(p.designation)) err('contacts.primary.designation', 'Primary contact designation is required');
  if (!V.required(p.email) || !V.email(p.email)) err('contacts.primary.email', 'A valid primary contact email is required');
  if (!V.required(p.mobile) || !V.phone(p.mobile)) err('contacts.primary.mobile', 'A valid primary contact mobile is required');
  if (contacts.finance && contacts.finance.email && !V.email(contacts.finance.email)) err('contacts.finance.email', 'Finance contact email is invalid');

  if (!sigs.length) err('signatories', 'At least one authorised signatory is required');
  sigs.forEach((s, i) => {
    const pre = 'signatories[' + i + '].';
    if (!V.required(s.name)) err(pre + 'name', 'Signatory name is required');
    if (!V.required(s.nationality)) err(pre + 'nationality', 'Signatory nationality is required');
    if (!V.required(s.designation)) err(pre + 'designation', 'Signatory designation is required');
    if (s.id_type === 'eid') {
      if (!V.eid(s.id_number)) err(pre + 'id_number', 'Emirates ID must match 784-YYYY-NNNNNNN-C');
    } else if (!V.required(s.id_number)) err(pre + 'id_number', 'ID number is required');
    if (!V.required(s.id_expiry) || !V.dateNotPast(s.id_expiry)) err(pre + 'id_expiry', 'Signatory ID must not be expired');
    if (!['MOA (manager)', 'Board resolution', 'POA'].includes(s.authority_basis)) err(pre + 'authority_basis', 'Authority basis is required');
    if (!V.email(s.email)) err(pre + 'email', 'Signatory email is invalid');
    if (s.authority_basis === 'POA' && !docs.some(d => d.type === 'poa')) {
      err('documents.poa', 'POA document is required when a signatory acts under POA');
    }
  });

  if (isUAE) {
    if (!ubos.length && !app.tax?.nominee_arrangement) err('ubos', 'At least one beneficial owner is required for UAE entities (Cabinet Decision 58/2020)');
  }
  let totalPct = 0;
  ubos.forEach((u, i) => {
    const pre = 'ubos[' + i + '].';
    if (!V.required(u.name)) err(pre + 'name', 'Beneficial owner name is required');
    if (!V.required(u.nationality)) err(pre + 'nationality', 'Beneficial owner nationality is required');
    if (!V.pct(u.ownership_pct) || !V.required(u.ownership_pct)) err(pre + 'ownership_pct', 'Ownership % must be 0–100');
    else totalPct += parseFloat(u.ownership_pct);
    if (!V.required(u.id_number)) err(pre + 'id_number', 'Beneficial owner ID number is required');
    if (!V.required(u.country_of_residence)) err(pre + 'country_of_residence', 'Country of residence is required');
  });
  if (ubos.length && totalPct > 100.01) err('ubos.ownership_pct', 'Total beneficial ownership exceeds 100%');
  if (t.nominee_arrangement === 'yes' && !V.required(t.nominee_detail)) {
    err('tax.nominee_detail', 'Nominee arrangements require identifying the true beneficial owner(s)');
  }

  if (!V.required(b.bank_name)) err('banking.bank_name', 'Bank name is required');
  // PRD §10: IBAN is required for AED accounts; for foreign-currency accounts it is
  // optional (many countries — US, India, Canada… — do not use IBAN) but validated when provided.
  if (String(b.currency || '').toUpperCase() === 'AED') {
    if (!V.required(b.iban) || !V.iban(b.iban)) err('banking.iban', 'A valid UAE IBAN is required for AED accounts (23 characters, AE…)');
  } else if (b.iban && !V.iban(b.iban)) {
    err('banking.iban', 'IBAN format is invalid (leave empty if your country does not use IBAN)');
  }
  if (!V.required(b.account_holder)) err('banking.account_holder', 'Account holder name is required');
  if (!V.required(b.currency)) err('banking.currency', 'Account currency is required');

  const requiredDocs = app.role === 'vendor' ? DOC_REQUIRED_VENDOR : DOC_REQUIRED_CUSTOMER;
  for (const dt of requiredDocs) {
    if (!docs.some(d => d.type === dt)) err('documents.' + dt, 'Required document missing: ' + dt);
  }
  for (const d of docs) {
    if (!DOC_ALLOWED.includes(d.type)) err('documents', 'Unknown document type: ' + d.type);
    if (d.dataB64 && !/^[A-Za-z0-9+/]+={0,2}$/.test(d.dataB64)) err('documents.' + d.type, 'Document payload must be base64');
  }

  if (!app.declarations?.accuracy?.checked) err('declarations.accuracy', 'The accuracy declaration must be accepted');
  if (!app.declarations?.ubo_aml?.checked) err('declarations.ubo_aml', 'The UBO/AML declaration must be accepted');
  if (!app.declarations?.updates?.checked) err('declarations.updates', 'The update undertaking must be accepted');
  if (!app.declarations?.pdpl_consent?.checked) err('declarations.pdpl_consent', 'PDPL consent is required');
  if (!V.required(app.declarations?.accuracy?.signed_name) || String(app.declarations.accuracy.signed_name).trim().length < 3) {
    err('declarations.signed_name', 'Typed signature (full name) is required');
  }

  return { valid: errors.length === 0, errors };
}

export const DOC_TYPES = {
  trade_license: 'Trade Licence', trn_cert: 'TRN Certificate', moa: 'MOA / Articles',
  signatory_id: 'Signatory Emirates ID / Passport', ubo_ids: 'UBO ID Documents',
  tenancy: 'Tenancy / Ejari', bank_proof: 'Bank Letter / Cheque',
  poa: 'POA / Board Resolution', signature: 'Specimen Signature & Stamp', other: 'Other',
};
export { DOC_REQUIRED_VENDOR, DOC_REQUIRED_CUSTOMER, DOC_ALLOWED };
