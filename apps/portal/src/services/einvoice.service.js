/* ==========================================================================
 * einvoice.service.js — UAE Peppol e-invoicing (FTA Phase 1, 1 Jan 2027).
 * Money is stored in integer fils (1 AED = 100 fils); all arithmetic is
 * integer arithmetic — floats never touch the totals.
 * Lifecycle: draft → submitted → validated → delivered | rejected → (reopen).
 * Buyer TRN must match an APPROVED KYC submission before validation passes —
 * KYC and e-invoicing are one compliance spine.
 * ==========================================================================
 */
import crypto from 'node:crypto';
import { HttpError } from '../lib/http.js';
import { id, hashPassword } from '../lib/security.js';
import { portalUrl } from '../config.js';

const VAT_RATE_PCT = 5;                       // UAE standard rate
const CURRENCIES = ['AED'];
const TRN_RE = /^\d{15}$/;
const validTrn = (t) => TRN_RE.test(String(t || '').trim());

/* ---------- fils-safe money ---------- */
const toFils = (aedAmount) => {
  if (aedAmount === null || aedAmount === undefined || aedAmount === '') throw new HttpError(422, 'Amount is required');
  const s = String(aedAmount).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new HttpError(422, 'Amount must be a non-negative number with at most 2 decimals: ' + s);
  const [whole, frac = ''] = s.split('.');
  const fils = parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10);
  if (!Number.isSafeInteger(fils)) throw new HttpError(422, 'Amount too large: ' + s);
  return fils;
};
/** VAT per line at 5%, rounded half-up to whole fils, pure integers */
const vatOfLineFils = (lineNetFils) => Math.floor((lineNetFils * VAT_RATE_PCT + 50) / 100);
const aed = (fils) => (fils / 100).toFixed(2);

/* canonical totals — the single source of truth */
function totals(lines) {
  let net = 0, vat = 0;
  for (const l of lines) {
    const lineNet = l.qty * l.unitPriceFils;
    net += lineNet;
    vat += vatOfLineFils(lineNet);
  }
  return { netFils: net, vatFils: vat, totalFils: net + vat };
}
export const recompute = totals;

/* ---------- validation authority (server-side, 422 + field details) ---------- */
export function validateInvoicePayload(p) {
  const details = [];
  const out = {};

  if (validTrn(p.buyerTin)) out.buyerTin = String(p.buyerTin).trim();
  else details.push({ field: 'buyerTin', message: 'Buyer TRN must be exactly 15 digits' });

  out.buyerName = String(p.buyerName || '').trim();
  if (out.buyerName.length < 3) details.push({ field: 'buyerName', message: 'Buyer legal name is required' });

  out.poRef = String(p.poRef || '').trim().slice(0, 40);
  out.issueDate = String(p.issueDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.issueDate)) details.push({ field: 'issueDate', message: 'Issue date must be YYYY-MM-DD' });
  out.dueDate = String(p.dueDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.dueDate)) details.push({ field: 'dueDate', message: 'Due date must be YYYY-MM-DD' });
  else if (/^\d{4}-\d{2}-\d{2}$/.test(out.issueDate) && out.dueDate < out.issueDate) details.push({ field: 'dueDate', message: 'Due date cannot precede the issue date' });

  out.currency = String(p.currency || 'AED').trim().toUpperCase();
  if (!CURRENCIES.includes(out.currency)) details.push({ field: 'currency', message: 'Only AED is supported in Phase 1' });

  if (!Array.isArray(p.lines) || p.lines.length < 1) details.push({ field: 'lines', message: 'At least one line item is required' });
  else {
    out.lines = p.lines.map((l, ix) => {
      const qty = Number(l.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100000) throw new HttpError(422, 'Line ' + (ix + 1) + ': quantity must be a whole number between 1 and 100000');
      const unitPriceFils = toFils(l.unitPrice);
      return { desc: String(l.desc || '').trim().slice(0, 140), qty, unitPriceFils, vatRatePct: VAT_RATE_PCT };
    });
    out.lines.forEach((l, ix) => {
      if (l.desc.length < 3) details.push({ field: 'lines', message: 'Line ' + (ix + 1) + ': description is required' });
      if (l.unitPriceFils <= 0) details.push({ field: 'lines', message: 'Line ' + (ix + 1) + ': unit price must be greater than zero' });
    });
  }

  if (details.length) { const e = new HttpError(422, 'Invoice validation failed'); e.details = details; throw e; }
  return out;
}

export function createEInvoiceService(ctx) {
  const { repos, notify, asp } = ctx;
  const SIMAL = async () => {
    const s = await repos.settings();
    const tin = String(s?.simalTin || '100123456700003');
    const tin10 = tin.slice(0, 10);
    let peppol = String(s?.simalPeppol || '');
    if (peppol && peppol.startsWith('0235:') && peppol.length > 15) {
      peppol = '0235:' + peppol.slice(5, 15);
    } else if (!peppol) {
      peppol = '0235:' + tin10;
    }
    return {
      tin,
      peppol,
      name: 'Simal Technologies Middle East LLC',
    };
  };
  const note = (to, subject, text, meta) => notify && notify.send({ channel: 'email', to, subject, text, meta });
  const timeline = (inv, label, actor) => inv.timeline.push({ ts: Date.now(), label, actor: actor || 'system' });

  const scopePartner = (user, email) => {
    if (user.role === 'partner' && user.email !== String(email).toLowerCase()) {
      throw new HttpError(403, 'Partners may only access their own invoices');
    }
  };

  /** TRN ↔ KYC reconciliation: buyer must be an approved KYC partner */
  const kycMatch = async (trn) => {
    const sub = (await repos.submissions.all()).find(s => s.tax?.trn === trn && s.status === 'approved');
    return sub ? { reference: sub.id, company: sub.company?.legal_name_en || sub.id } : null;
  };

  const TRANSITIONS = {
    submit: { from: ['draft'], to: 'submitted' },
    validate: { from: ['submitted'], to: 'validated' },
    deliver: { from: ['validated'], to: 'delivered' },
    reject: { from: ['submitted', 'validated'], to: 'rejected' },
    reopen: { from: ['rejected'], to: 'draft' },
  };
  function assertTransition(inv, action) {
    const rule = TRANSITIONS[action];
    if (!rule) throw new HttpError(400, 'Unknown invoice action: ' + action);
    if (!rule.from.includes(inv.status)) {
      if (inv.status === 'delivered' && action === 'reopen') {
        throw new HttpError(409, `Invoice ${inv.id} is delivered and immutable (C3): amendments must use credit notes`);
      }
      throw new HttpError(409, 'Cannot ' + action + ' an invoice in status "' + inv.status + '" (allowed from: ' + rule.from.join(', ') + ')');
    }
    return rule.to;
  }

  async function buildUbl(inv) {
    const s = await SIMAL();
    const t = inv.totals;
    const buyerTin10 = String(inv.buyerTin || '').slice(0, 10);
    return {
      ublVersion: '2.1',
      customisationID: 'urn:peppol:pint:billing-1@ae-1',
      profileID: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
      id: inv.ref, issueDate: inv.issueDate, dueDate: inv.dueDate, currencyCode: inv.currency,
      invoiceTypeCode: 388, // commercial invoice
      supplier: { partyName: s.name, endpointID: s.peppol, schemeID: '0235', taxScheme: 'ARE' },
      customer: { partyName: inv.buyerName, endpointID: '0235:' + buyerTin10, schemeID: '0235', taxScheme: 'ARE' },
      lines: inv.lines.map((l, i) => {
        const lineNet = l.qty * l.unitPriceFils;
        const lineVat = vatOfLineFils(lineNet);
        return {
          id: String(i + 1), description: l.desc, quantity: l.qty,
          unitPrice: aed(l.unitPriceFils), baseAmount: aed(lineNet),
          vatRatePct: l.vatRatePct, taxAmount: aed(lineVat), lineTotal: aed(lineNet + lineVat),
        };
      }),
      totals: { net: aed(t.netFils), vat: aed(t.vatFils), payable: aed(t.totalFils), vatRatePct: VAT_RATE_PCT },
      kyc: inv.kyc ? { reference: inv.kyc.reference } : null,
    };
  }

  /* ---------- partner actions ---------- */
  async function create(user, payload) {
    if (user.role !== 'partner') throw new HttpError(403, 'Only partner accounts may issue invoices here');
    const v = validateInvoicePayload(payload);
    const t = totals(v.lines);
    const seller = await SIMAL();
    const buyerTin10 = v.buyerTin.slice(0, 10);
    const inv = {
      id: id('inv'), ref: await repos.nextInvRef(),
      seller, partnerEmail: user.email,
      buyerTin: v.buyerTin, buyerName: v.buyerName, buyerPeppol: '0235:' + buyerTin10,
      poRef: v.poRef, issueDate: v.issueDate, dueDate: v.dueDate, currency: v.currency,
      lines: v.lines, totals: t,
      status: 'draft', validation: null, kyc: await kycMatch(v.buyerTin),
      timeline: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    timeline(inv, 'Draft created', user.email);
    await repos.invoices.add(inv);
    await repos.audit(user.email, 'invoice_created', inv.ref, aed(t.totalFils) + ' AED → ' + v.buyerName);
    return inv;
  }

  async function save(user, invId, payload) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    scopePartner(user, inv.partnerEmail);
    if (inv.status !== 'draft') throw new HttpError(409, 'Only drafts can be edited (current: ' + inv.status + ')');
    const v = validateInvoicePayload(payload);
    const buyerTin10 = v.buyerTin.slice(0, 10);
    Object.assign(inv, {
      buyerTin: v.buyerTin, buyerName: v.buyerName, buyerPeppol: '0235:' + buyerTin10,
      poRef: v.poRef, issueDate: v.issueDate, dueDate: v.dueDate, currency: v.currency,
      lines: v.lines, totals: totals(v.lines), kyc: kycMatch(v.buyerTin),
    });
    timeline(inv, 'Draft updated', user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_updated', inv.ref);
    return inv;
  }

  async function submit(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    scopePartner(user, inv.partnerEmail);
    assertTransition(inv, 'submit');
    const recomputed = totals(inv.lines);
    if (recomputed.totalFils !== inv.totals.totalFils) {
      inv.totals = recomputed;
      await repos.invoices.save(inv);
      throw new HttpError(422, 'Stored totals did not match the lines — totals were corrected server-side, please review and resubmit');
    }
    inv.status = 'submitted';
    timeline(inv, 'Submitted to Simal for validation', user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_submitted', inv.ref);
    note(user.email, 'Invoice ' + inv.ref + ' submitted for validation', 'Your invoice ' + inv.ref + ' is in the validation queue.', { event: 'invoice.submitted', ref: inv.ref });
    return inv;
  }

  /* ---------- staff actions ---------- */
  async function validate(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    assertTransition(inv, 'validate');
    const r = totals(inv.lines);
    const buyerTin10 = String(inv.buyerTin || '').slice(0, 10);
    const checks = [
      { check: 'totals_recomputed', ok: r.netFils === inv.totals.netFils && r.vatFils === inv.totals.vatFils && r.totalFils === inv.totals.totalFils },
      { check: 'trn_format_15_digit', ok: validTrn(inv.buyerTin) },
      { check: 'trn_registered_peppol_prefix', ok: inv.buyerPeppol === '0235:' + buyerTin10 },
      { check: 'buyer_kyc_approved', ok: !!inv.kyc },
      { check: 'dates_ordered', ok: inv.dueDate >= inv.issueDate },
      { check: 'lines_nonempty', ok: Array.isArray(inv.lines) && inv.lines.length > 0 },
      { check: 'currency_aed', ok: inv.currency === 'AED' },
    ];
    inv.validation = { by: user.email, at: Date.now(), checks, pass: checks.every(c => c.ok) };
    if (!inv.validation.pass) {
      await repos.invoices.save(inv);
      throw new HttpError(422, 'Validation failed: ' + checks.filter(c => !c.ok).map(c => c.check).join(', '));
    }
    inv.status = 'validated';
    timeline(inv, 'Validated (7/7 checks)', user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_validated', inv.ref);
    return inv;
  }

  async function deliver(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    assertTransition(inv, 'deliver');
    inv.ubl = await buildUbl(inv);

    /* T2.5 (INT-5): transmit via the accredited ASP BEFORE the delivered flip —
     * the Peppol transmissionId is stored in this same save (C3 immutability
     * forbids touching the row afterwards). Failure leaves the invoice
     * `validated` for a staff retry. Without ASP credentials the legacy
     * direct-delivery path applies (sandbox/parallel-run mode). */
    let transmissionMode = 'simulated';
    if (asp && asp.enabled()) {
      try {
        const tx = await asp.transmit(inv);
        transmissionMode = 'asp';
        inv.ubl.transmissionId = tx.transmissionId;
        timeline(inv, 'Transmitted via ASP · transmission ' + tx.transmissionId, user.email);
      } catch (e) {
        timeline(inv, 'ASP transmission FAILED — ' + String(e.message).slice(0, 120), user.email);
        await repos.invoices.save(inv); /* keep timeline on the validated row */
        throw new HttpError(502, 'ASP transmission failed: ' + String(e.message).slice(0, 160));
      }
    }

    inv.transmissionMode = transmissionMode;
    inv.status = 'delivered';
    const buyerTin10 = String(inv.buyerTin || '').slice(0, 10);
    const deliveryMsg = transmissionMode === 'asp'
      ? 'Delivered via Peppol ASP (0235:' + buyerTin10 + ')'
      : 'Delivered via Peppol (Simulated / Sandbox mode · 0235:' + buyerTin10 + ')';
    timeline(inv, deliveryMsg, user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_delivered', inv.ref, inv.ubl.id + (inv.ubl.transmissionId ? ' · tx ' + inv.ubl.transmissionId : ''));
    note(inv.partnerEmail, 'Invoice ' + inv.ref + ' delivered via Peppol', 'Invoice ' + inv.ref + ' has been delivered.', { event: 'invoice.delivered', ref: inv.ref });
    return inv;
  }

  async function reject(user, invId, reason) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    assertTransition(inv, 'reject');
    if (!reason || String(reason).trim().length < 5) throw new HttpError(422, 'A rejection reason (at least 5 characters) is required');
    inv.status = 'rejected';
    inv.rejectReason = String(reason).trim();
    timeline(inv, 'Rejected: ' + inv.rejectReason, user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_rejected', inv.ref, inv.rejectReason);
    note(inv.partnerEmail, 'Invoice ' + inv.ref + ' rejected', 'Reason: ' + inv.rejectReason, { event: 'invoice.rejected', ref: inv.ref });
    return inv;
  }

  async function reopen(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    assertTransition(inv, 'reopen');
    inv.status = 'draft';
    inv.rejectReason = null;
    timeline(inv, 'Reopened for editing', user.email);
    await repos.invoices.save(inv);
    await repos.audit(user.email, 'invoice_reopened', inv.ref);
    return inv;
  }

  async function action(user, invId, act, reason) {
    switch (act) {
      case 'validate': return validate(user, invId);
      case 'deliver': return deliver(user, invId);
      case 'reject': return reject(user, invId, reason);
      case 'reopen': return reopen(user, invId);
      default: throw new HttpError(400, 'Unknown action: ' + act);
    }
  }

  /* ---------- reads ---------- */
  function publicView(inv) {
    return {
      id: inv.id, ref: inv.ref, status: inv.status, buyerTin: inv.buyerTin, buyerName: inv.buyerName,
      poRef: inv.poRef, issueDate: inv.issueDate, dueDate: inv.dueDate, currency: inv.currency,
      lines: inv.lines.map(l => ({ ...l, unitPrice: aed(l.unitPriceFils) })),
      totals: { net: aed(inv.totals.netFils), vat: aed(inv.totals.vatFils), total: aed(inv.totals.totalFils) },
      kyc: inv.kyc, validation: inv.validation ? { pass: inv.validation.pass, checks: inv.validation.checks, at: inv.validation.at } : null,
      rejectReason: inv.rejectReason || null, timeline: inv.timeline, createdAt: inv.createdAt, updatedAt: inv.updatedAt,
      ubl: inv.ubl || null,
    };
  }
  async function mine(user) {
    const invoices = await repos.invoices.byPartner(user.email);
    if (!invoices || !Array.isArray(invoices)) return [];
    return invoices.map(publicView);
  }
  const queue = async (status = 'all') => (await repos.invoices.all())
    .filter(i => status === 'all' || i.status === status)
    .map(i => ({ id: i.id, ref: i.ref, buyerName: i.buyerName, buyerTin: i.buyerTin, status: i.status, issueDate: i.issueDate, dueDate: i.dueDate, total: aed(i.totals.totalFils), kyc: !!i.kyc, partnerEmail: i.partnerEmail, createdAt: i.createdAt, ageDays: Math.max(0, Math.floor((Date.now() - i.createdAt) / 86400000)) }))
    .sort((a, b) => b.createdAt - a.createdAt);
  async function view(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    scopePartner(user, inv.partnerEmail);
    return publicView(inv);
  }
  async function ubl(user, invId) {
    const inv = await repos.invoices.get(invId);
    if (!inv) throw new HttpError(404, 'Invoice not found');
    scopePartner(user, inv.partnerEmail);
    if (inv.ubl) return { provisional: false, ubl: inv.ubl };
    return { provisional: true, ubl: await buildUbl(inv) };
  }

  /** partner account provisioning: called when a KYC submission is approved */
  async function ensurePartnerAccount(submission) {
    const email = submission.contacts?.primary?.email;
    if (!email) return null;
    const existing = await repos.users.findByEmail(email);
    if (existing) return { email, tempPassword: null, existing: true };
    const temp = 'Simal-' + crypto.randomBytes(4).toString('hex');
    const name = submission.contacts?.primary?.name || submission.company?.legal_name_en || email;
    await repos.users.create({ email, name, role: 'partner', passwordHash: hashPassword(temp), totpSecret: null, active: true });
    await repos.audit('system', 'partner_account_created', email, 'on ' + submission.id);
    note(email, 'Your Simal partner account is ready',
      'Your partner account for KYC and e-invoicing is active. Sign in at ' + portalUrl('/login.html') + ' — temporary password: ' + temp,
      { event: 'partner.account', submission: submission.id });
    return { email, tempPassword: temp, existing: false };
  }

  return { create, save, submit, action, mine, queue, view, ubl, buildUbl, ensurePartnerAccount };
}
