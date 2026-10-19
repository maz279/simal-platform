/* Shared package — cross-workspace types, validators, and the fils-safe money module.
 * Used by both apps/site (SSG) and apps/portal (backend). */

/** Integer-fils money utilities (ADR-5). Never use floats for currency. */
export const toFils = (aed) => {
  if (aed === null || aed === undefined || aed === '') return null;
  const s = String(aed).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  return parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10);
};

export const vatOfLineFils = (netFils) => Math.floor((netFils * 5 + 50) / 100);

export const aed = (fils) => (fils / 100).toFixed(2);

export const computeTotals = (lines) => {
  let net = 0, vat = 0;
  for (const l of lines) {
    const lineNet = l.qty * l.unitPriceFils;
    net += lineNet;
    vat += vatOfLineFils(lineNet);
  }
  return { netFils: net, vatFils: vat, totalFils: net + vat };
};

/** UAE-specific validators */
export const isValidTRN = (trn) => /^\d{15}$/.test(String(trn || '').trim());
export const isValidIBAN = (iban) => {
  const clean = String(iban || '').replace(/\s/g, '').toUpperCase();
  return clean.length === 23 && clean.startsWith('AE');
};
export const peppolId = (trn) => `0235:${String(trn).trim()}`;

/** Invoice lifecycle states */
export const INVOICE_STATES = ['draft', 'submitted', 'validated', 'delivered', 'rejected'];
export const KYC_STATES = ['draft', 'submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold', 'approved', 'rejected'];
