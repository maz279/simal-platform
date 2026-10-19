/* ==========================================================================
 * rfq.service.js — T3.4 (FRS-R): server-side RFQ engine.
 *
 *   Basket  — anonymous, stateless, httpOnly-cookie carried (ADR-2: zero
 *             localStorage); server-validated on every add (slug exists,
 *             qty 1–99,999); capped at 50 lines (FRS-R-01).
 *   Submit  — basket + contact details → RFQ entity: SIMAL-RFQ-YYYYMMDD-NNNN
 *             reference, persisted with per-item notes, confirmation email to
 *             the requester + notification to accounts@ (FRS-R-02/03).
 *   Status  — reference + email pair returns state + timeline (FRS-R-05).
 *   Admin   — list + transitions submitted→quoted→won|lost (FRS-R-06).
 * ========================================================================== */
import { HttpError } from '../lib/http.js';
import { log } from '../lib/log.js';

const MAX_LINES = 50;
const MAX_QTY = 99999;
const BASKET_COOKIE = 'simal_rfq';
const BASKET_MAX_JSON = 3800; /* stays under the 4 KB cookie cap */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseBasket(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function serializeBasket(items) {
  return encodeURIComponent(JSON.stringify(items));
}

export function createRfqService(repos, { notify }) {

  /* ---------------- basket (cookie-carried, server-validated) ---------------- */
  function readBasket(req) {
    const m = String(req.headers.cookie || '').match(/simal_rfq=([^;]+)/);
    return parseBasket(m ? m[1] : null);
  }

  async function addToBasket(req, res, { slug, qty, note }) {
    const qtyN = Number(qty);
    if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9_-]{2,120}$/.test(slug)) throw new HttpError(400, 'Invalid product slug');
    /* qty is a SIGNED DELTA: positive adds, negative decrements (a delta that takes
     * the line to ≤ 0 removes it). The RFQ island posts deltas for qty edits and
     * -(qty)-1 for the remove button — decrement/remove must work through the UI. */
    if (!Number.isInteger(qtyN) || qtyN === 0 || Math.abs(qtyN) > MAX_QTY) throw new HttpError(400, 'Quantity delta must be a nonzero whole number up to ±' + MAX_QTY);
    const noteStr = note === undefined || note === null ? '' : String(note).slice(0, 200);
    const product = await repos.products.bySlug(slug);
    if (!product) throw new HttpError(404, 'Unknown product');

    const basket = readBasket(req);
    const idx = basket.findIndex(b => b.slug === slug);
    if (qtyN < 0) {
      if (idx !== -1) {
        const next = basket[idx].qty + qtyN;
        if (next <= 0) basket.splice(idx, 1); /* decrement past zero = remove */
        else basket[idx].qty = next;
      }
      /* negative delta for a line not in the basket: idempotent no-op */
    } else if (idx !== -1) {
      basket[idx].qty = Math.min(MAX_QTY, basket[idx].qty + qtyN);
      if (noteStr) basket[idx].note = noteStr;
    } else {
      if (basket.length >= MAX_LINES) throw new HttpError(409, 'Basket is limited to ' + MAX_LINES + ' lines — submit an RFQ first');
      basket.push({ slug, qty: qtyN, note: noteStr, name: product.name, brand: product.brand });
    }
    const ser = serializeBasket(basket);
    if (ser.length > BASKET_MAX_JSON) throw new HttpError(413, 'Basket too large — submit an RFQ first');
    res.setHeader('Set-Cookie', BASKET_COOKIE + '=' + ser + '; HttpOnly; SameSite=Strict; Path=/api; Max-Age=604800' + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));
    return { lines: basket.length, totalQty: basket.reduce((s, b) => s + b.qty, 0), basket };
  }

  function viewBasket(req) {
    const basket = readBasket(req);
    return { lines: basket.length, totalQty: basket.reduce((s, b) => s + b.qty, 0), basket };
  }

  /* ---------------- submit ---------------- */
  async function submit(req, res, { email, company, contactName, phone }) {
    const emailN = String(email || '').toLowerCase().trim();
    if (!EMAIL_RE.test(emailN)) throw new HttpError(400, 'A valid email is required');
    if (!company || String(company).trim().length < 2) throw new HttpError(400, 'Company name is required');
    if (!contactName || String(contactName).trim().length < 2) throw new HttpError(400, 'Contact name is required');
    /* rm(10.3-1 pen KYC-40): the form marks phone required; the server accepted empty. */
    if (!phone || !/^\+?[0-9][0-9\s-]{6,17}$/.test(String(phone).trim())) throw new HttpError(400, 'A valid phone number is required');

    const basket = readBasket(req);
    if (!basket.length) throw new HttpError(400, 'Basket is empty');

    /* final server-side integrity check: every slug must still exist */
    for (const b of basket) {
      const p = await repos.products.bySlug(b.slug);
      if (!p) throw new HttpError(409, 'Product "' + b.slug + '" is no longer available — remove it and retry');
    }

    const ref = await repos.rfqs.nextRef();
    const rfq = {
      ref, email: emailN,
      company: String(company).trim().slice(0, 120),
      contactName: String(contactName).trim().slice(0, 80),
      phone: String(phone || '').trim().slice(0, 30),
      status: 'submitted',
      items: basket.map(b => ({ slug: b.slug, qty: b.qty, note: (b.note || '').slice(0, 200) })),
      history: [{ status: 'submitted', label: 'RFQ received', ts: Date.now() }],
      submittedAt: Date.now(),
    };
    await repos.rfqs.create(rfq);

    /* clear the basket cookie (scoped Path=/api so only API touches it) */
    res.setHeader('Set-Cookie', BASKET_COOKIE + '=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0' + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));

    await notify.send({
      channel: 'email', to: emailN,
      subject: 'Simal RFQ received — ' + ref,
      text: 'Thank you for your request for quotation.\n\nReference: ' + ref + '\nLines: ' + rfq.items.length + '\n\nOur sales team will respond with pricing within one business day.\nQuote this reference in any reply or call to the sales desk.',
      meta: { event: 'rfq.received', ref },
    });
    await notify.send({
      channel: 'email', to: 'sales@simalme.com',
      subject: 'New RFQ — ' + ref + ' (' + rfq.company + ')',
      text: rfq.contactName + ' (' + emailN + ', ' + (rfq.phone || 'no phone') + ') submitted ' + rfq.items.length + ' line(s):\n' +
        rfq.items.map(i => '- ' + i.slug + ' × ' + i.qty + (i.note ? ' — ' + i.note : '')).join('\n'),
      meta: { event: 'rfq.internal', ref },
    });
    await repos.audit(emailN, 'rfq_submitted', ref, rfq.items.length + ' lines');
    log.info('rfq_submitted', { ref, lines: rfq.items.length });
    return { reference: ref, lines: rfq.items.length };
  }

  /* ---------------- status ---------------- */
  async function publicStatus(ref, email) {
    const rfq = await repos.rfqs.get(String(ref || '').trim());
    if (!rfq) throw new HttpError(404, 'Reference not found');
    const emailMatch = (rfq.email || '').toLowerCase() === String(email || '').toLowerCase().trim();
    /* rm(10.3-1 pen KYC-46): 403 for an existing ref + wrong email vs 404 for an unknown
     * ref is a reference-existence oracle. Both cases now answer identically. */
    if (!emailMatch) throw new HttpError(404, 'Reference not found');
    return {
      reference: rfq.ref, company: rfq.company, status: rfq.status,
      items: (rfq.items || []).map(i => ({ slug: i.slug, qty: i.qty })),
      timeline: rfq.history || [],
      canEdit: rfq.status === 'submitted',
    };
  }

  /* ---------------- admin ---------------- */
  async function adminList({ status = 'all' } = {}) {
    const all = await repos.rfqs.all();
    return status && status !== 'all' ? all.filter(r => r.status === status) : all;
  }

  const TRANSITIONS = {
    quote: { from: ['submitted'], to: 'quoted', label: 'Quotation sent' },
    won: { from: ['submitted', 'quoted'], to: 'won', label: 'Marked won' },
    lost: { from: ['submitted', 'quoted'], to: 'lost', label: 'Marked lost' },
  };
  async function adminAction(ref, action, { note = '', session }) {
    const rule = TRANSITIONS[action];
    if (!rule) throw new HttpError(400, 'Unknown RFQ action');
    const rfq = await repos.rfqs.get(ref);
    if (!rfq) throw new HttpError(404, 'RFQ not found');
    if (!rule.from.includes(rfq.status)) throw new HttpError(409, 'Cannot ' + action + ' an RFQ in status "' + rfq.status + '"');
    rfq.status = rule.to;
    rfq.history = [...(rfq.history || []), { status: rule.to, label: rule.label + (note ? ' — ' + String(note).slice(0, 120) : ''), ts: Date.now(), actor: session?.user?.email || 'staff' }];
    await repos.rfqs.save(rfq);
    await repos.audit(session?.user?.email || 'staff', 'rfq_' + action, ref, String(note).slice(0, 80));
    return { reference: rfq.ref, status: rfq.status };
  }

  return { addToBasket, viewBasket, submit, publicStatus, adminList, adminAction };
}
