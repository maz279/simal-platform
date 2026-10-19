// domain/pii.js — SEC-6 / rm(10.3-1 pen KYC-26/27): single source of truth for
// staff-facing PII masking. `view_pii` (super_admin) sees raw values; every other
// staff role sees the masked form below. The maskers keep a recognisable head/tail
// (enough to spot-check a value against a certificate) without exporting it.
const keep = (v, head, tail) => {
  const s = String(v);
  if (s.length <= head + tail) return '•'.repeat(Math.max(3, s.length));
  return s.slice(0, head) + '•'.repeat(Math.max(3, s.length - head - tail)) + s.slice(-tail);
};

export const PII_MASKERS = {
  'banking.iban': (v) => keep(String(v).replace(/\s+/g, ''), 7, 4),           // AE86026••••0000
  'tax.trn': (v) => keep(v, 3, 3),                                             // 100•••••••••090
  'tax.foreign_tax_id': (v) => keep(v, 2, 2),
  'tax.peppol_id': (v) => String(v).replace(/(\d{3})\d+(\d{2})$/, '$1•••••$2'), // 0235:100•••••67
  'company.license_number': (v) => keep(v, 2, 2),
  'contacts.email': (v) => String(v).replace(/^(.).*(@.*)$/, '$1•••$2'),
  'contacts.mobile': (v) => '••••' + String(v).slice(-4),                       // same as review.service.js
  'identity.id_number': (v) => '•••••' + String(v).slice(-4),
};

export const maskField = (field, v, canViewPii) =>
  (canViewPii || v == null || v === '' || !PII_MASKERS[field]) ? v : PII_MASKERS[field](v);
