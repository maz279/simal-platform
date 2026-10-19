/* ==========================================================================
 * webhooks.service.js — signed outbound event push (PRD INT-08) with a
 * strict SSRF guard: https/http only, host resolved and checked against
 * loopback / private / reserved ranges before any connection is made.
 * ========================================================================== */
import dns from 'node:dns/promises';
import net from 'node:net';
import { config } from '../config.js';
import { hmacSign } from '../lib/security.js';
import { log } from '../lib/log.js';

function ipIsBlocked(ip) {
  if (net.isIPv4(ip)) {
    const o = ip.split('.').map(Number);
    if (o[0] === 10 || o[0] === 127) return true;                       // private A, loopback
    if (o[0] === 0 || o[0] >= 240) return true;                         // this-network, reserved
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;          // private B
    if (o[0] === 192 && o[1] === 168) return true;                      // private C
    if (o[0] === 169 && o[1] === 254) return true;                      // link-local
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === '::' || low === '::1') return true;                     // unspecified, loopback
    if (low.startsWith('fc') || low.startsWith('fd')) return true;      // unique local
    if (low.startsWith('fe80')) return true;                            // link-local
    if (low.startsWith('::ffff:')) return ipIsBlocked(low.slice(7));    // mapped v4
    return false;
  }
  return true; // not an IP literal — treated as blocked until DNS resolves
}

/** SSRF-safe URL validation (the only outbound client in the system) */
export async function assertSafeOutboundUrl(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Only http/https protocols are allowed');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const blockedHost = /^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(host);
  if (blockedHost) throw new Error('Host is not allowed');
  if (net.isIP(host)) {
    if (ipIsBlocked(host)) throw new Error('IP literal is in a blocked range');
    return u;
  }
  const addrs = await dns.lookup(host, { all: true });
  for (const { address } of addrs) {
    if (ipIsBlocked(address)) throw new Error('Resolved address is in a blocked range');
  }
  return u;
}

export function createWebhooks(repos) {
  async function push(event, payload) {
    if (!config.integration.webhookUrl || !config.integration.webhookSecret) {
      log.debug('webhook_skipped', { event, reason: 'not configured' });
      return { skipped: true };
    }
    const body = JSON.stringify({ event, ts: Date.now(), payload });
    try {
      const u = await assertSafeOutboundUrl(config.integration.webhookUrl); // SSRF guard
      const sig = hmacSign(config.integration.webhookSecret, body);
      const res = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Simal-Signature': 'sha256=' + sig },
        body,
        signal: AbortSignal.timeout(8000),
      });
      await repos.audit('system', 'webhook_pushed', event, 'HTTP ' + res.status);
      return { ok: res.ok, status: res.status };
    } catch (e) {
      await repos.audit('system', 'webhook_failed', event, String(e.message));
      log.warn('webhook_failed', { event, error: String(e.message) });
      return { ok: false, error: String(e.message) };
    }
  }

  return {
    push,
    /** fired when a submission is approved — counterparty master is ready for ERP/ASP */
    submissionApproved(sub) {
      return push('submission.approved', {
        reference: sub.id,
        role: sub.role,
        company: {
          legal_name: sub.company.legal_name_en,
          tin: sub.tax?.trn || sub.tax?.foreign_tax_id || null,
          peppol_id: sub.tax?.peppol_id || null,
          country: sub.company.country,
          currency: sub.tax?.invoice_currency,
        },
        banking: { iban: sub.banking?.iban, bank: sub.banking?.bank_name },
        screening_clear: sub.screening?.clear !== false,
        approved_at: new Date(sub.updatedAt || Date.now()).toISOString(),
      });
    },
  };
}
