/* ==========================================================================
 * peppol-asp.client.js — T2.5 (INT-5): accredited Peppol ASP transmission.
 *
 * Contract (C2 §2 / roadmap T2.5):
 *   - enabled only when ASP_ENDPOINT + ASP_SHARED_SECRET are set (env-only
 *     credentials; sandbox and production differ only by env)
 *   - transmit(): POSTs the stamped BIS 3.0 / UBL 2.1 payload with an
 *     HMAC-SHA256 signature header; ASP endpoint is SSRF-guarded
 *   - ACK  = { ok: true, transmissionId } → returns the Peppol id
 *   - NACK = { ok: false, reason } or HTTP ≥ 400 → throws with the reason
 *   - Called BEFORE the invoice flips to `delivered` — the transmissionId is
 *     written onto the UBL in the same save that delivers (C3 immutability:
 *     delivered rows are never edited afterwards). A failed transmission
 *     leaves the invoice `validated` for a staff retry.
 * ========================================================================== */
import { hmacSign } from '../lib/security.js';
import { assertSafeOutboundUrl } from './webhooks.service.js';

export function createAspClient() {
  const enabled = () => !!(process.env.ASP_ENDPOINT && process.env.ASP_SHARED_SECRET);

  async function transmit(invoice) {
    const endpoint = process.env.ASP_ENDPOINT;
    const secret = process.env.ASP_SHARED_SECRET;
    /* SSRF guard — refuses private/loopback/reserved targets. The explicit
     * ASP_ALLOW_LOOPBACK=1 escape exists ONLY for the sandbox round-trip test
     * (a local mock ASP); production never sets it. */
    let u;
    if (process.env.ASP_ALLOW_LOOPBACK === '1' && /^https?:\/\//i.test(endpoint)) {
      u = new URL(endpoint);
    } else {
      u = await assertSafeOutboundUrl(endpoint);
    }
    const body = JSON.stringify({
      v: 1,
      ref: invoice.ref,
      issueDate: invoice.issueDate,
      currency: invoice.currency,
      totals: invoice.totals,
      ubl: invoice.ubl,
    });
    const sig = hmacSign(secret, body);
    const res = await fetch(u, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Simal-Signature': 'sha256=' + sig },
      body,
      signal: AbortSignal.timeout(8000),
    });
    let j = null;
    try { j = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok || !j || j.ok !== true) {
      throw new Error(j?.reason || ('ASP HTTP ' + res.status));
    }
    if (!j.transmissionId || typeof j.transmissionId !== 'string') {
      throw new Error('ASP ACK missing transmissionId');
    }
    return { transmissionId: j.transmissionId };
  }

  return { enabled, transmit };
}
