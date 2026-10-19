/* ==========================================================================
 * kyc.service.js — public-facing domain: drafts, submission (validation,
 * document storage, screening, notifications, invites), partner status.
 * All repos calls are awaited (JSON store is async-wrapped; PG is native async).
 * ========================================================================== */
import { validateApplication, DOC_REQUIRED_VENDOR, DOC_REQUIRED_CUSTOMER } from '../domain/validators.js';
import { HttpError } from '../lib/http.js';
import { sniffContentType } from '../lib/security.js';
import { scanBuffer } from '../lib/virus-scanner.js';
import { log } from '../lib/log.js';

const MAX_DOC_BYTES = 10 * 1024 * 1024;
const EXT_BY_SNIFF = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/heic': 'heic' };
const EXT_OK = new Set(['pdf', 'jpg', 'jpeg', 'png', 'heic']);

export function createKyc(repos, { notify, screening, webhooks }) {

  /* ---------------- drafts ---------------- */
  /* rm(10.3-1 pen KYC-02/03/04): resuming by EMAIL ALONE handed any caller the
   * draft id, resume token and stored PII of another party — who could then
   * overwrite the draft and stage documents into it. Resume now requires the
   * draft's own token (from the owner's cookie or an explicit `token`); without
   * it a NEW draft is created, so nothing about the other party leaks. */
  async function createDraft(email, role, presentedToken = null) {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'A valid contact email is required');
    if (!['vendor', 'customer'].includes(role)) throw new HttpError(400, 'Role must be vendor or customer');
    const existing = await repos.drafts.findByEmailRole(email, role);
    if (existing && presentedToken && String(presentedToken) === String(existing.token)) {
      return { draft: existing, resumed: true };
    }
    return { draft: await repos.drafts.create(email, role), resumed: false };
  }

  async function saveDraft(draftId, token, patch) {
    const d = await repos.drafts.find(draftId, token);
    if (!d) throw new HttpError(404, 'Draft not found or token invalid');
    if (patch.data !== undefined) d.data = patch.data;
    if (patch.documents !== undefined) d.documents = patch.documents;
    if (patch.step !== undefined) d.step = Math.max(1, Math.min(7, Number(patch.step) || 1));
    d.updatedAt = Date.now();
    await repos.drafts.save(d);
    return { id: d.id, step: d.step, updatedAt: d.updatedAt };
  }

  async function getDraft(draftId, token) {
    const d = await repos.drafts.find(draftId, token);
    if (!d) throw new HttpError(404, 'Draft not found or token invalid');
    return d;
  }

  /* ---------------- document intake (magic-byte verified) ---------------- */
  async function ingestDocuments(rawDocs = []) {
    const stored = [];
    for (const d of rawDocs) {
      if (!d || typeof d.type !== 'string') throw new HttpError(400, 'Document entry invalid');
      if (!d.name || /[^A-Za-z0-9._ -]/.test(d.name)) throw new HttpError(400, 'Document name has invalid characters');
      const ext = String(d.name.split('.').pop() || '').toLowerCase();
      if (!EXT_OK.has(ext)) throw new HttpError(400, 'Document "' + d.name + '" rejected — allowed: PDF, JPG, PNG, HEIC');
      if (d.size !== undefined && Number(d.size) > MAX_DOC_BYTES) throw new HttpError(400, 'Document "' + d.name + '" exceeds 10 MB');
      if (d.dataB64 !== undefined) {
        let buffer;
        try { buffer = Buffer.from(d.dataB64, 'base64'); } catch { throw new HttpError(400, 'Document payload is not valid base64'); }
        if (buffer.length > MAX_DOC_BYTES) throw new HttpError(400, 'Document "' + d.name + '" exceeds 10 MB');
        const scan = await scanBuffer(buffer, d.name);
        if (!scan.clean) {
          /* rm(8.1-1)/APP-3: the rejection is AUDITED, not just thrown — the old
             Done-when assumed an upload_rejected_malware row that never existed. */
          await repos.audit('partner', 'upload_rejected_malware', d.name, (scan.virus || 'Malware') + ' [engine: ' + (scan.engine || '?') + ']');
          throw new HttpError(400, 'Security check failed: document "' + d.name + '" contains malicious content (' + (scan.virus || 'Malware') + ')');
        }
        const sniff = sniffContentType(buffer.subarray(0, 12));
        if (!sniff) throw new HttpError(400, 'Document "' + d.name + '" rejected — content type unrecognised');
        if (EXT_BY_SNIFF[sniff] && ext !== EXT_BY_SNIFF[sniff] && !(ext === 'jpeg' && EXT_BY_SNIFF[sniff] === 'jpg')) {
          throw new HttpError(400, 'Document "' + d.name + '" rejected — content does not match its extension');
        }
        const storedDoc = await repos.documents.store(d, buffer);
        stored.push({ type: d.type, name: d.name, size: buffer.length, mime: sniff, docId: storedDoc.docId, path: storedDoc.relPath, uploadedAt: Date.now() });
      } else if (d.docId) {
        stored.push(d); // already-staged document (draft flow)
      } else {
        stored.push({ type: d.type, name: d.name, size: d.size || 0, mime: d.mime || 'application/octet-stream', uploadedAt: Date.now() }); // metadata-only (not provided)
      }
    }
    return stored;
  }

  /** stage documents on a draft (returns docs with docId for later submit) */
  async function stageDocuments(draftId, token, rawDocs) {
    const d = await repos.drafts.find(draftId, token);
    if (!d) throw new HttpError(404, 'Draft not found or token invalid');
    const staged = await ingestDocuments(rawDocs);
    /* merge by type: restaging a slot replaces its earlier file */
    const byType = {};
    (d.documents || []).forEach(doc => { byType[doc.type] = doc; });
    staged.forEach(doc => { byType[doc.type] = doc; });
    d.documents = Object.values(byType);
    d.updatedAt = Date.now();
    await repos.drafts.save(d);
    return d.documents.map(s => ({ type: s.type, name: s.name, size: s.size, mime: s.mime, docId: s.docId }));
  }

  /* ---------------- submission ---------------- */
  async function submitApplication({ draftId, draftToken, application, inviteCode }) {
    const app = application || {};
    const role = app.role;
    if (!['vendor', 'customer'].includes(role)) throw new HttpError(400, 'Role must be vendor or customer');

    let documents = [];
    if (draftId && draftToken) {
      const d = await repos.drafts.find(draftId, draftToken);
      if (!d) throw new HttpError(404, 'Draft not found or token invalid');
      documents = d.documents || [];
    }
    if (Array.isArray(app.documents) && app.documents.length) {
      documents = documents.concat(await ingestDocuments(app.documents));
    }

    const candidate = { ...app, documents };
    const { valid, errors } = validateApplication(candidate);
    if (!valid) throw new HttpError(422, 'Application failed validation', errors);

    /* enterprise-strict: required document types must carry actual stored bytes */
    const requiredDocs = role === 'vendor' ? DOC_REQUIRED_VENDOR : DOC_REQUIRED_CUSTOMER;
    for (const dt of requiredDocs) {
      const entry = documents.find(d => d.type === dt);
      if (entry && !entry.docId) {
        throw new HttpError(422, 'Application failed validation',
          [{ field: 'documents.' + dt, message: 'Required document must be uploaded (staged file), not only declared' }]);
      }
    }

    // duplicate TRN guard (FR-P-015 — warn, record, never block)
    const dup = app.company?.country === 'AE' && app.tax?.trn ? await repos.submissions.duplicateTin(app.tax.trn) : null;

    let invite = null;
    if (inviteCode) invite = (await repos.invites.find(inviteCode)) || null;

    const sub = {
      id: await repos.nextRef(),
      role,
      status: 'submitted',
      inviteCode: invite ? invite.code : null,
      company: app.company, tax: app.tax, contacts: app.contacts,
      signatories: app.signatories || [], ubos: app.ubos || [],
      banking: app.banking,
      documents,
      declarations: app.declarations,
      declarationsMeta: {
        signedAt: Date.now(),
        signedIp: 'recorded-at-server',
      },
      duplicateOfTin: dup ? { ref: dup.id, company: dup.company.legal_name_en } : null,
      review: { checklist: {}, notes: [] },
      queries: [],
      history: [{ status: 'submitted', label: 'Submission received', ts: Date.now() }],
      reviewer: null, rejection_reason: '', hold_reason: '',
      createdAt: Date.now(), submittedAt: Date.now(), updatedAt: Date.now(),
    };

    await repos.submissions.add(sub);
    if (draftId && draftToken) {
      const d = await repos.drafts.find(draftId, draftToken);
      if (d) await repos.drafts.remove(d);
    }
    if (invite) {
      invite.status = 'converted';
      invite.submissionId = sub.id;
      invite.convertedAt = Date.now();
      await repos.invites.save(invite);
    }
    await repos.audit(app.contacts?.primary?.email || 'partner', 'submitted', sub.id,
      'signed by ' + (app.declarations?.accuracy?.signed_name || '?') + (dup ? ' · duplicate-TRN of ' + dup.id : ''));

    // automatic screening on submit
    sub.screening = await screening.screen(sub);

    // notifications + webhook fire-and-report
    await notify.submissionReceived(sub);
    if (sub.screening.hits.length) {
      await notify.send({
        channel: 'email', to: 'compliance@simalme.com', subject: 'KYC screening hit — ' + sub.id,
        text: 'Screening matched ' + sub.screening.hits.length + ' name(s):\n' +
          sub.screening.hits.map(h => '- ' + h.subject + ': "' + h.name + '" ~ "' + h.match + '" (' + h.type + ', ' + h.method + ')').join('\n'),
        meta: { event: 'screening.hit', ref: sub.id },
      });
    }
    log.info('submission_received', { ref: sub.id, role, screeningHits: sub.screening.hits.length, duplicateTin: !!dup });
    return { reference: sub.id, screeningClear: sub.screening.clear, duplicateTin: !!dup };
  }

  /* ---------------- partner status ---------------- */
  async function publicStatus(ref, email) {
    const sub = await repos.submissions.get(String(ref || '').toUpperCase());
    if (!sub) throw new HttpError(404, 'Reference not found');
    const emailMatch = (sub.contacts?.primary?.email || '').toLowerCase() === String(email || '').toLowerCase().trim();
    /* rm(10.3-1 pen KYC-46): 403 (existing ref, wrong email) vs 404 (unknown ref) is a
     * reference-existence oracle. Use the same 404 for both. */
    if (!emailMatch) throw new HttpError(404, 'Reference not found');
    const openQueries = (sub.queries || []).filter(q => !q.response);
    return {
      reference: sub.id,
      company: sub.company.legal_name_en,
      role: sub.role,
      status: sub.status,
      reviewer: (sub.status === 'submitted' || !sub.reviewer || sub.reviewer === '{}' || sub.reviewer === '[object Promise]' || typeof sub.reviewer !== 'string') ? null : sub.reviewer,
      timeline: sub.history,
      queries: sub.queries.map(q => ({
        section: q.section, message: q.message, raised_at: q.raised_at,
        response: q.response || null, responded_at: q.responded_at || null,
      })),
      canRespond: ['query_raised', 'partner_updated'].includes(sub.status) && openQueries.length > 0,
      rejection_reason: sub.rejection_reason || null,
      hold_reason: sub.hold_reason || null,
      data: (sub.status === 'rejected' || ['query_raised', 'partner_updated'].includes(sub.status)) ? {
        company: sub.company,
        tax: sub.tax,
        contacts: sub.contacts,
        signatories: sub.signatories,
        ubos: sub.ubos,
        banking: sub.banking,
        declarations: sub.declarations,
      } : null,
      documents: (sub.status === 'rejected' || ['query_raised', 'partner_updated'].includes(sub.status)) ? (sub.documents || []) : null,
    };
  }

  async function respondToQuery(ref, email, message) {
    const sub = await repos.submissions.get(String(ref || '').toUpperCase());
    if (!sub) throw new HttpError(404, 'Reference not found');
    const emailMatch = (sub.contacts?.primary?.email || '').toLowerCase() === String(email || '').toLowerCase().trim();
    /* rm(10.3-1 pen KYC-46): 403 (existing ref, wrong email) vs 404 (unknown ref) is a
     * reference-existence oracle. Use the same 404 for both. */
    if (!emailMatch) throw new HttpError(404, 'Reference not found');
    if (!['query_raised', 'partner_updated'].includes(sub.status)) throw new HttpError(409, 'No open query to respond to');
    if (!message || String(message).trim().length < 3) throw new HttpError(400, 'Response message is required');
    (sub.queries || []).forEach(q => { if (!q.response) { q.response = String(message).trim(); q.responded_at = Date.now(); } });
    sub.status = 'partner_updated';
    sub.history.push({ status: 'partner_updated', label: 'Partner responded', ts: Date.now() });
    await repos.submissions.save(sub);
    await repos.audit(sub.contacts.primary.email, 'partner_responded', sub.id, String(message).trim().slice(0, 80));
    await notify.send({
      channel: 'email', to: 'accounts@simalme.com', subject: 'Partner responded — ' + sub.id,
      text: sub.contacts.primary.name + ' responded to the query:\n\n' + String(message).trim(),
      meta: { event: 'query.responded', ref: sub.id },
    });
    return { status: sub.status };
  }

  async function inviteInfo(code) {
    const inv = await repos.invites.find(String(code || '').toUpperCase());
    if (!inv) return { found: false };
    return { found: true, code: inv.code, company: inv.company, email: inv.email, role: inv.role, status: inv.status };
  }

  /** duplicate-TRN probe for the form's live warning */
  async function checkTin(trn) {
    const hit = await repos.submissions.duplicateTin(String(trn || '').trim());
    return hit ? { exists: true, reference: hit.id, company: hit.company.legal_name_en, status: hit.status } : { exists: false };
  }

  return { createDraft, saveDraft, getDraft, stageDocuments, submitApplication, publicStatus, respondToQuery, inviteInfo, checkTin };
}
