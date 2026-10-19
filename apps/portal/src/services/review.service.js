/* ==========================================================================
 * review.service.js — admin review workflow, checklist, notes, queries,
 * analytics, export, invites. All transitions validated by domain/rules.
 * ========================================================================== */
import { canApplyAction, PENDING_SET } from '../domain/rules.js';
import { maskField } from '../domain/pii.js';
import { HttpError } from '../lib/http.js';
import { token } from '../lib/security.js';
import { log } from '../lib/log.js';

/* rm(7.2-2)/F-2026-N17 — SLA clock in FRACTIONAL business days, computed in GST.
 * GOV a42: Mon–Fri 09:00–18:00 GST, Saturday 09:00–14:00, Sunday CLOSED — the UAE
 * weekend is Sat/Sun, so only Sunday is excluded by default (SLA_WEEKEND_DAYS=0;
 * the Saturday half-day needs PM confirmation before narrowing it further).
 * GOV a11: the SLA is 2 business days; a raised query PAUSES the timer and a
 * partner resubmission RESTARTS it — both are handled in summarise() below.
 * The v1.1 loop floored to whole 24h steps, so 36–47.9h pending never breached. */
const DAY_MS = 86400000, GST_OFFSET_MS = 4 * 3600000;
export const SLA_WEEKEND_DAYS = new Set(
  String(process.env.SLA_WEEKEND_DAYS ?? '0').split(',').filter(Boolean).map(Number)
);
export const SLA_BREACH_BD = Number(process.env.SLA_BREACH_BD || 2);

export function businessDaysBetween(fromMs, toMs) {
  let t = fromMs, bd = 0;
  while (t < toMs) {
    const local = t + GST_OFFSET_MS;
    const dayStartUtc = Math.floor(local / DAY_MS) * DAY_MS - GST_OFFSET_MS;
    const end = Math.min(dayStartUtc + DAY_MS, toMs);
    if (!SLA_WEEKEND_DAYS.has(new Date(local).getUTCDay())) bd += (end - t) / DAY_MS;
    t = end;
  }
  return bd; // fractional — 1.6 business days is 1.6, not 1
}

/** SLA state for one submission — exported pure so unit tests need no repos. */
export function slaState(s, now = Date.now()) {
  const subAt = Number(s.submittedAt || s.submitted_at) || now;
  // a11: the LATEST partner resubmission restarts the clock; a query pauses it
  const restartAt = [...(s.history || [])].reverse().find((h) => h.status === 'partner_updated')?.ts || subAt;
  const ageBd = businessDaysBetween(Number(restartAt) || subAt, now);
  const queryPaused = s.status === 'query_raised';
  return {
    submittedAt: subAt,
    restartAt: Number(restartAt) || subAt,
    ageDays: Math.max(0, Math.floor((now - subAt) / DAY_MS)),
    ageBusinessDays: Math.round(ageBd * 10) / 10,
    slaBreached: PENDING_SET.includes(s.status) && !queryPaused && ageBd >= SLA_BREACH_BD,
  };
}

export function createReview(repos, { notify, screening, webhooks, einvoice }) {

  async function list({ status = 'all', role = 'all', q = '', page = 1, per = 10, sort = 'submittedAt', dir = 'desc', canViewPii = false }) {
    let list = (await repos.submissions.all()).slice();
    if (status === 'pending') list = list.filter(s => PENDING_SET.includes(s.status));
    else if (status !== 'all') list = list.filter(s => s.status === status);
    if (role !== 'all') list = list.filter(s => s.role === role);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(s => (s.company.legal_name_en + ' ' + s.id + ' ' + (s.tax?.trn || '') + ' ' +
        (s.contacts?.primary?.email || '')).toLowerCase().includes(needle));
    }
    const val = (s) => ({
      id: s.id, company: (s.company.legal_name_en || '').toLowerCase(), status: s.status,
      submittedAt: s.submittedAt, reviewer: s.reviewer || 'zzz',
      age: Math.floor((Date.now() - s.submittedAt) / 86400000),
    });
    list.sort((a, b) => {
      const va = val(a)[sort] ?? '', vb = val(b)[sort] ?? '';
      const d = va < vb ? -1 : va > vb ? 1 : 0;
      return dir === 'asc' ? d : -d;
    });
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / per));
    page = Math.max(1, Math.min(page, pages));
    return {
      total, page, pages,
      // NB: never `.map(summarise)` — map would pass the array INDEX as the `now` arg
      /* rm(10.3-1 pen KYC-26): the queue exposes a TRN per row — mask it for every
     * role without view_pii (the roadmap 2.2-1 requirement), not only in reports. */
      rows: list.slice((page - 1) * per, page * per).map((s) => summarise(s, Date.now(), canViewPii)),
    };
  }

  function summarise(s, now = Date.now(), canViewPii = false) {
    const sla = slaState(s, now);
    return {
      id: s.id, role: s.role, status: s.status,
      company: s.company?.legal_name_en || s.company?.legalNameEn || s.company || 'Unknown',
      tin: maskField('tax.trn', s.tax?.trn || s.tax?.foreign_tax_id || null, canViewPii),
      submittedAt: sla.submittedAt, reviewer: (s.reviewer && typeof s.reviewer === 'string' && s.reviewer !== '{}' && s.reviewer !== '[object Promise]') ? s.reviewer : null,
      ageDays: sla.ageDays, ageBusinessDays: sla.ageBusinessDays, slaBreached: sla.slaBreached,
    };
  }

  async function get(ref, { includePii = false } = {}) {
    const s = await repos.submissions.get(ref);
    if (!s) throw new HttpError(404, 'Submission not found');
    const out = JSON.parse(JSON.stringify(s));
    if (!includePii) {
      (out.signatories || []).forEach(g => {
        if (g.id_number) g.id_number = '•••••' + String(g.id_number).slice(-4);
        if (g.mobile) g.mobile = '••••' + String(g.mobile).slice(-4);
        if (g.phone) g.phone = '••••' + String(g.phone).slice(-4);
        /* rm(10.3-1 pen KYC-27 residual): signatory email/phone were still raw. */
        if (g.email) g.email = maskField('contacts.email', g.email, false);
      });
      (out.ubos || []).forEach(u => {
        if (u.id_number) u.id_number = '•••••' + String(u.id_number).slice(-4);
        if (u.email) u.email = maskField('contacts.email', u.email, false);
        if (u.phone) u.phone = '••••' + String(u.phone).slice(-4);
        if (u.mobile) u.mobile = '••••' + String(u.mobile).slice(-4);
      });
      /* the tax contact sits under tax.tax_contact, outside `contacts` */
      if (out.tax?.tax_contact) {
        const tc = out.tax.tax_contact;
        if (tc.email) tc.email = maskField('contacts.email', tc.email, false);
        if (tc.phone) tc.phone = '••••' + String(tc.phone).slice(-4);
      }
      /* rm(10.3-1 pen KYC-27): the detail view leaked the raw TRN, tax/contact
       * emails and phones (only mobile+IBAN were masked). Apply the shared policy
       * to every PII field a non-view_pii reviewer receives. */
      if (out.tax) {
        out.tax.trn = maskField('tax.trn', out.tax.trn, false);
        out.tax.foreign_tax_id = maskField('tax.foreign_tax_id', out.tax.foreign_tax_id, false);
        out.tax.peppol_id = maskField('tax.peppol_id', out.tax.peppol_id, false);
      }
      if (out.company) out.company.license_number = maskField('company.license_number', out.company.license_number, false);
      for (const c of Object.values(out.contacts || {})) {
        if (!c || typeof c !== 'object') continue;
        if (c.email) c.email = maskField('contacts.email', c.email, false);
        if (c.mobile) c.mobile = maskField('contacts.mobile', c.mobile, false);
      }
      if (out.banking?.iban) {
        out.banking.iban_masked = maskField('banking.iban', out.banking.iban, false);
        delete out.banking.iban;
      }
    }
    out.screening = (await screening.result(ref)) || s.screening || null;
    return out;
  }

  async function applyAction(ref, action, { reason = '', session, note = '' }) {
    const s = await repos.submissions.get(ref);
    if (!s) throw new HttpError(404, 'Submission not found');
    const check = canApplyAction(s, action, session);
    if (!check.ok) throw new HttpError(check.code || 409, check.reason);
    const rule = check.rule;
    if (rule.requiresReason && !String(reason).trim()) throw new HttpError(400, 'A reason is required for "' + action + '"');

    const actor = await actorName(session);
    const labels = {
      start: 'Review started', approve: 'Approved', reject: 'Rejected',
      hold: 'Put on hold', reopen: 'Reopened by ' + actor, query: 'Query raised',
    };
    s.status = rule.to;
    if (action === 'start' || rule.to !== 'under_review' || action === 'reopen') s.reviewer = actor;
    if (action === 'reject') s.rejection_reason = String(reason).trim();
    if (action === 'hold') s.hold_reason = String(reason).trim();
    s.history.push({ status: s.status, label: labels[action] || action, ts: Date.now() });
    await repos.submissions.save(s);
    await repos.audit(actor, action, s.id, String(reason).trim().slice(0, 120));

    if (action === 'approve') {
      await notify.decision(s, 'approved');
      await webhooks.submissionApproved(s);
      /* e-invoicing: provisioning the partner account (KYC + e-invoice portal) */
      if (einvoice) {
        try {
          const acct = einvoice.ensurePartnerAccount(s);
          s.partnerAccount = acct ? { email: acct.email, existing: acct.existing } : null;
          if (acct && !acct.existing) s.partnerTempPasswordIssued = true;   // never store the password itself
          await repos.submissions.save(s);
        } catch (e) { log.warn('partner_account_provision_failed', { ref: s.id, error: String(e.message) }); }
      }
    } else if (action === 'reject') {
      await notify.decision(s, 'rejected');
    } else if (action === 'start') {
      /* no partner notification for internal state changes */
    }
    log.info('review_action', { ref: s.id, action, by: actor });
    return { status: s.status };
  }

  async function raiseQuery(ref, { section, message, session }) {
    const s = await repos.submissions.get(ref);
    if (!s) throw new HttpError(404, 'Submission not found');
    if (!section || !String(message).trim()) throw new HttpError(400, 'Section and message are required');
    const check = canApplyAction(s, 'query', session);
    if (!check.ok) throw new HttpError(409, check.reason);
    const actor = await actorName(session);
    s.queries.push({
      id: 'Q' + token(6), section: String(section), message: String(message).trim(),
      raised_by: actor, raised_at: Date.now(), response: null, responded_at: null,
    });
    s.status = 'query_raised';
    s.history.push({ status: 'query_raised', label: 'Query raised', ts: Date.now() });
    await repos.submissions.save(s);
    await repos.audit(actor, 'query_raised', s.id, section + ': ' + String(message).slice(0, 80));
    await notify.queryRaised(s, s.queries[s.queries.length - 1]);
    return { status: s.status, queries: s.queries.length };
  }

  async function setChecklist(ref, { item, checked, session }) {
    const s = await repos.submissions.get(ref);
    if (!s) throw new HttpError(404, 'Submission not found');
    if (!/^[a-z_]+$/.test(item || '')) throw new HttpError(400, 'Invalid checklist item');
    s.review = s.review || { checklist: {}, notes: [] };
    s.review.checklist[item] = !!checked;
    await repos.submissions.save(s);
    const actor = await actorName(session);
    await repos.audit(actor, 'checklist', s.id, item + ' = ' + !!checked);
    return s.review.checklist;
  }

  async function addNote(ref, { text, session }) {
    const s = await repos.submissions.get(ref);
    if (!s) throw new HttpError(404, 'Submission not found');
    if (!String(text).trim()) throw new HttpError(400, 'Note text is required');
    s.review = s.review || { checklist: {}, notes: [] };
    const actor = await actorName(session);
    s.review.notes.push({ by: actor, ts: Date.now(), text: String(text).trim().slice(0, 2000) });
    await repos.submissions.save(s);
    await repos.audit(actor, 'note_added', s.id, String(text).trim().slice(0, 80));
    return s.review.notes;
  }

  async function actorName(session) {
    if (!session) return 'system';
    if (session.user && typeof session.user === 'object') {
      if (session.user.name && typeof session.user.name === 'string') return session.user.name;
      if (session.user.email && typeof session.user.email === 'string') return session.user.email;
    }
    if (session.name && typeof session.name === 'string') return session.name;
    if (session.email && typeof session.email === 'string') return session.email;
    if (typeof session.user === 'string' && session.user && session.user !== '{}' && session.user !== '[object Promise]') {
      return session.user;
    }
    if (session.userId) {
      const u = await repos.users.get(session.userId);
      if (u?.name && typeof u.name === 'string') return u.name;
      if (u?.email && typeof u.email === 'string') return u.email;
      return 'user-' + session.userId;
    }
    return 'system';
  }

  return { list, get, applyAction, raiseQuery, setChecklist, addNote, summarise };
}
