/* ==========================================================================
 * notify.service.js — email (real SMTP when configured, zero-dep client) +
 * WhatsApp (provider API when configured) with a durable outbox fallback.
 * Every partner-facing event flows through here (FR-P-032 etc.).
 * ========================================================================== */
import net from 'node:net';
import tls from 'node:tls';
import { config } from '../config.js';
import { log } from '../lib/log.js';

/* ---------- minimal SMTP client (STARTTLS on 587, AUTH PLAIN, enough for SES/Mailgun/relay) ----------
 * deploy-audit H5: the previous client could not deliver over STARTTLS — after the upgrade it
 * never re-sent EHLO (RFC 3207 §4.2), so the server waited and every send ended in "SMTP
 * timeout"; it also kept writing to the plaintext socket, sent AUTH in clear text on port 25,
 * sent bare-LF bodies and raw UTF-8 subjects. Now: one reader per connection, commands go to
 * whichever socket is live, EHLO again after TLS, AUTH only over TLS, CRLF bodies, RFC 2047
 * subjects. `tlsOptions` (e.g. { ca }) is for a private relay CA and for the tests. */
const CRLF = '\r\n';
const clean = (v) => String(v || '').replace(/[\r\n<>]/g, '').trim();
const oneLine = (v) => String(v || '').replace(/[\r\n]+/g, ' ');
const encodeHeader = (v) => (/^[\x20-\x7e]*$/.test(v) ? v : '=?UTF-8?B?' + Buffer.from(v, 'utf8').toString('base64') + '?=');
export async function smtpSend({ host, port, user, pass, from, tlsOptions = {} }, { to, subject, text }) {
  const fromAddr = clean((String(from).match(/<(.+)>/) || [])[1] || from);
  const toAddr = clean(to);
  if (!/^[^@\s]+@[^@\s]+$/.test(toAddr)) throw new Error('SMTP: invalid recipient');
  if (port === 465) throw new Error('SMTPS(465) not supported by this minimal client — use 587/STARTTLS');
  return new Promise((resolve, reject) => {
    let sock = net.connect({ host, port, timeout: 15000 });
    let buffer = '', tlsUp = false, done = false, waiter = null;
    const finish = (err, val) => { if (done) return; done = true; try { if (err) sock.destroy(); else sock.end(); } catch {} if (err) reject(err); else resolve(val); }; /* end() flushes QUIT */
    const send = (cmd) => sock.write(cmd + CRLF);
    /* the next complete reply: a multi-line reply ends at "NNN " (RFC 5321 §4.2.1) */
    const drain = () => {
      if (!waiter) return;
      const lines = buffer.split(/\r?\n/);
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3}( |$)/.test(lines[i])) {
          buffer = lines.slice(i + 1).join(CRLF);
          const w = waiter; waiter = null;
          w({ code: parseInt(lines[i].slice(0, 3), 10), all: lines.slice(0, i + 1) });
          return;
        }
      }
    };
    const reply = () => new Promise((res) => { waiter = res; drain(); });
    const expect = async (codes, what) => {
      const r = await reply();
      if (!codes.includes(r.code)) throw new Error('SMTP ' + r.code + ' at ' + what);
      return r;
    };
    const onData = (chunk) => { buffer += chunk.toString('utf8'); drain(); };
    sock.on('data', onData);
    sock.on('timeout', () => finish(new Error('SMTP timeout')));
    sock.on('error', finish);
    (async () => {
      await expect([220], 'greeting');
      send('EHLO kyc.local');
      const ehlo = await expect([250], 'EHLO');
      if (port !== 25 || ehlo.all.some((l) => /STARTTLS/i.test(l))) {
        send('STARTTLS');
        await expect([220], 'STARTTLS');
        sock.removeListener('data', onData);
        const raw = sock;
        sock = await new Promise((res, rej) => {
          const t = tls.connect({ socket: raw, servername: net.isIP(host) ? undefined : host, host, rejectUnauthorized: true, ...tlsOptions }, () => res(t));
          t.once('error', rej);
        });
        tlsUp = true; buffer = '';
        sock.on('data', onData);
        sock.on('error', finish);
        send('EHLO kyc.local');
        await expect([250], 'EHLO after STARTTLS');
      }
      if (user) {
        if (!tlsUp) throw new Error('SMTP: refusing to send credentials without TLS');
        send('AUTH PLAIN ' + Buffer.from('\0' + user + '\0' + pass).toString('base64'));
        await expect([235], 'AUTH');
      }
      send('MAIL FROM:<' + fromAddr + '>'); await expect([250], 'MAIL FROM');
      send('RCPT TO:<' + toAddr + '>'); await expect([250, 251], 'RCPT TO');
      send('DATA'); await expect([354], 'DATA');
      const domain = fromAddr.split('@')[1] || 'localhost';
      const body = String(text || '').replace(/\r?\n/g, CRLF).replace(/^\./gm, '..');
      send([
        'From: ' + oneLine(from), 'To: <' + toAddr + '>', 'Subject: ' + encodeHeader(oneLine(subject)),
        'Date: ' + new Date().toUTCString(),
        'Message-ID: <' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2) + '@' + domain + '>',
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '',
        body, '.'].join(CRLF));
      await expect([250], 'message body');
      send('QUIT'); /* the message is already accepted; wait briefly for 221, never longer */
      await Promise.race([reply(), new Promise((r) => setTimeout(r, 2000).unref())]);
      finish(null, { via: 'smtp', tls: tlsUp });
    })().catch(finish);
  });
}

/* ---------- public API ---------- */
export function createNotify(repos) {
  async function send({ channel, to, subject, text, deliveryText, meta = {} }) {
    const entry = await repos.outbox.add({ channel, to, subject, text, status: 'queued', meta });
    try {
      if (channel === 'email') {
        if (config.notify.emailEnabled && config.notify.smtp) {
          await smtpSend(config.notify.smtp, { to, subject, text: deliveryText || text });
          entry.status = 'sent';
          await repos.outbox.markSent(entry, { via: 'smtp:' + config.notify.smtp.host });
        } else {
          entry.status = 'simulated';
          entry.meta = { ...(entry.meta || {}), via: 'unconfigured_smtp_simulated' };
          if (repos.outbox.markSimulated) {
            await repos.outbox.markSimulated(entry, { via: 'unconfigured_smtp_simulated' });
          } else {
            await repos.outbox.markSent(entry, { via: 'unconfigured_smtp_simulated' });
          }
        }
      } else if (channel === 'whatsapp') {
        if (config.notify.whatsappEnabled && config.notify.whatsappApi) {
          const res = await fetch(config.notify.whatsappApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.notify.whatsappToken },
            body: JSON.stringify({ to, text }),
          });
          if (!res.ok) throw new Error('WhatsApp provider HTTP ' + res.status);
          entry.status = 'sent';
          await repos.outbox.markSent(entry, { via: 'provider' });
        } else {
          entry.status = 'simulated';
          entry.meta = { ...(entry.meta || {}), via: 'unconfigured_whatsapp_simulated' };
          if (repos.outbox.markSimulated) {
            await repos.outbox.markSimulated(entry, { via: 'unconfigured_whatsapp_simulated' });
          } else {
            await repos.outbox.markSent(entry, { via: 'unconfigured_whatsapp_simulated' });
          }
        }
      }
    } catch (e) {
      entry.status = 'failed'; entry.error = String(e.message);
      log.warn('notify_failed', { channel, to, error: entry.error });
    }
    return entry;
  }

  /* partner-facing templates */
  const t = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

  return {
    send,
    outbox: () => repos.outbox.all(),
    submissionReceived: (sub) => send({
      channel: 'email', to: sub.contacts?.primary?.email || 'unknown@example.com',
      subject: 'Simal KYC — submission received (' + sub.id + ')',
      text: t('Dear {name},\n\nWe received your onboarding submission ({ref}). Our team will review it within 2 business days.\nTrack status with reference {ref} and your contact email at /status.html\n\nSimal Technologies Middle East LLC',
        { name: sub.contacts?.primary?.name || 'Partner', ref: sub.id }),
      meta: { event: 'submission.received', ref: sub.id },
    }),
    queryRaised: (sub, query) => send({
      channel: 'email', to: sub.contacts?.primary?.email || 'unknown@example.com',
      subject: 'Simal KYC — reviewer query (' + sub.id + ')',
      text: 'Our reviewer has a query on section "' + query.section + '":\n\n' + query.message +
        '\n\nOpen your status page and respond: /status.html (reference ' + sub.id + ')',
      meta: { event: 'query.raised', ref: sub.id },
    }),
    decision: (sub, decision) => send({
      channel: 'email', to: sub.contacts?.primary?.email || 'unknown@example.com',
      subject: 'Simal KYC — submission ' + decision + ' (' + sub.id + ')',
      text: decision === 'approved'
        ? 'Good news — your onboarding has been approved. Your verified master data now feeds our ERP and e-invoicing routing.\n\nSimal Technologies Middle East LLC'
        : 'After review we are unable to proceed with this submission.\n\nReason: ' + (sub.rejection_reason || '—') + '\n\nYou may reapply with an updated submission at any time.',
      meta: { event: 'submission.' + decision, ref: sub.id },
    }),
  };
}
