/* ==========================================================================
 * integration.service.js — T5.1–T5.4: Production integrations.
 * Email templates, ASP submission queuing, signed webhook payloads,
 * analytics events. All outbound HTTP handled via outbox queue (no direct
 * fetch in this module — worker process picks up queued items).
 * ========================================================================== */
import crypto from 'node:crypto';
import { HttpError } from '../lib/http.js';
import { log } from '../lib/log.js';

const V = 'v1';

export function createIntegrationService(repos) {
  const client = repos.client;

  /* =================== T5.1: EMAIL (INT-1) =================== */

  function emailDnsRecords(domain = 'simalme.com') {
    return {
      spf: { type: 'TXT', name: domain, value: `v=spf1 include:_spf.${process.env.SMTP_PROVIDER || 'sendgrid.net'} ~all` },
      dkim: { type: 'TXT', name: `simal._domainkey.${domain}`, value: `v=DKIM1; k=rsa; p=${process.env.SMTP_DKIM_PUBKEY || 'SET_VIA_ENV'}` },
      dmarc: { type: 'TXT', name: `_dmarc.${domain}`, value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100; adkim=s; aspf=s` },
    };
  }

  const templates = {
    submissionReceived: (s) => ({ subject: `Simal KYC — received (${s.id})`, text: `Dear ${s.contacts?.primary?.name || 'Partner'},\n\nWe received your submission (${s.id}). Review within 2 business days.\n\nSimal Technologies ME` }),
    decisionApproved: (s) => ({ subject: `Simal KYC — approved (${s.id})`, text: `Dear ${s.contacts?.primary?.name || 'Partner'},\n\nApproved. Partner account ready.\n\nSimal Technologies ME` }),
    decisionRejected: (s) => ({ subject: `Simal KYC — rejected (${s.id})`, text: `Not approved. Reason: ${s.rejection_reason}.\n\nSimal Technologies ME` }),
    queryRaised: (s, q) => ({ subject: `Simal KYC — query (${s.id})`, text: `Question: ${q.message}\n\nRespond via portal.\n\nSimal Technologies ME` }),
    partnerAccountReady: (email, pw) => ({ subject: 'Your Simal partner account is ready', text: `Temporary password: ${pw}\n\nSimal Technologies ME` }),
    invoiceSubmitted: (i) => ({ subject: `Invoice ${i.ref} submitted`, text: `In validation queue.\n\nSimal Technologies ME` }),
    invoiceDelivered: (i) => ({ subject: `Invoice ${i.ref} delivered`, text: `Delivered via Peppol.\n\nSimal Technologies ME` }),
    invoiceRejected: (i) => ({ subject: `Invoice ${i.ref} rejected`, text: `Reason: ${i.rejectReason}.\n\nSimal Technologies ME` }),
    passwordReset: (e, t) => ({ subject: 'Simal — password reset', text: `Reset (60 min): ${process.env.PORTAL_URL}/reset?token=${t}` }),
    emailVerification: (e, t) => ({ subject: 'Simal — verify email', text: `Verify: ${process.env.PORTAL_URL}/verify?token=${t}` }),
  };

  async function sendEmail(to, template, data) {
    const t = templates[template];
    if (!t) throw new HttpError(422, `Unknown template: ${template}`);
    const { subject, text } = t(data);
    return repos.outbox.add({ channel: 'email', to, subject, text, status: 'queued', meta: { event: `email.${template}`, v: V } });
  }

  async function handleBounce({ email, reason, type }) {
    await repos.audit('smtp', 'email_bounce', email, `${type}: ${reason}`);
    return { processed: true };
  }

  async function emailHealth() {
    const r = await client.query("SELECT count(*) FROM outbox WHERE channel='email' AND status='queued'");
    return { healthy: parseInt(r.rows[0].count) < 50, queued: parseInt(r.rows[0].count) };
  }

  /* =================== T5.2: PEPPOL ASP (INT-5) =================== */

  /* ASP transmission is owned by services/peppol-asp.client.js (T2.5): real
   * signed HTTP to the accredited endpoint, ACK/NACK handling, transmissionId
   * persisted at delivery. The earlier queued-submitToAsp path was removed —
   * it never had a draining worker and its sandbox branch FABRICATED a
   * transmission id, which this project prohibits. */
  async function aspHealth() {
    if (!process.env.ASP_ENDPOINT) return { healthy: true, mode: 'not-configured', note: 'deliver() uses the direct-delivery path until ASP credentials arrive (T5.2)' };
    const r = await client.query("SELECT count(*) FROM invoices WHERE status = 'validated' AND updated_at < $1", [Date.now() - 14400000]);
    return { healthy: parseInt(r.rows[0].count) === 0, mode: 'production', staleUndelivered: parseInt(r.rows[0].count) };
  }

  /* =================== T5.3: WEBHOOK + MASTER FEED (INT-3, INT-4) =================== */

  function signPayload(payload) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) throw new HttpError(500, 'WEBHOOK_SECRET not configured');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }

  async function dispatchApprovalWebhook(submission) {
    const payload = { version: V, event: 'kyc.approved', reference: submission.id, tin: submission.tax?.trn, peppolId: submission.tax?.peppol_id };
    const signature = signPayload(payload);
    const url = process.env.ERP_WEBHOOK_URL;
    if (!url) return { dispatched: false, payload, signature, note: 'ERP_WEBHOOK_URL not set' };
    // Queue webhook — worker process makes the actual HTTP call
    await repos.outbox.add({
      channel: 'webhook', to: url, subject: 'kyc.approved',
      text: JSON.stringify(payload), status: 'queued',
      meta: { event: 'webhook.dispatch', v: V, signature: `sha256=${signature}`, ref: submission.id },
    });
    return { queued: true, payload, signature };
  }

  async function masterFeed() {
    const r = await client.query(
      `SELECT s.id as reference, s.role, s.company->>'legal_name_en' as legal_name, s.tax->>'trn' as tin, s.tax->>'peppol_id' as peppol_id, s.updated_at FROM submissions s WHERE s.status='approved'`
    );
    return { version: V, count: r.rows.length, counterparties: r.rows.map(row => ({ ...row, approved_at: new Date(parseInt(row.updated_at)).toISOString() })) };
  }

  /* =================== T5.4: ANALYTICS (INT-7) =================== */

  const EVENTS = ['search','product_view','rfq_started','rfq_submitted','kyc_started','kyc_submitted','kyc_approved','partner_login','invoice_created','invoice_submitted','invoice_validated','invoice_delivered','ubl_downloaded','article_read','cta_click','newsletter_optin','content_published'];

  async function trackEvent(name, props = {}) {
    if (!EVENTS.includes(name)) throw new HttpError(422, `Unknown event: ${name}`);
    await client.query(
      `INSERT INTO analytics_events (event_name, properties, consent, session_hash, created_at) VALUES ($1,$2,$3,$4,$5)`,
      [name, JSON.stringify(props), props.consent || false,
       crypto.createHash('sha256').update(String(props.sessionId || 'anon')).digest('hex').slice(0, 16), Date.now()]
    );
    return { tracked: true, event: name, v: V };
  }

  async function analyticsHealth() {
    const r = await client.query("SELECT count(*) FROM analytics_events WHERE created_at > $1", [Date.now() - 3600000]);
    return { healthy: true, eventsLastHour: parseInt(r.rows[0].count) };
  }

  async function allHealth() {
    const [email, asp, analytics] = await Promise.all([emailHealth(), aspHealth(), analyticsHealth()]);
    return { version: V, timestamp: new Date().toISOString(), integrations: { email, asp, analytics }, overall: email.healthy && asp.healthy ? 'healthy' : 'degraded' };
  }

  return { emailDnsRecords, templates, sendEmail, handleBounce, emailHealth, aspHealth, signPayload, dispatchApprovalWebhook, masterFeed, EVENTS, trackEvent, analyticsHealth, allHealth };
}
