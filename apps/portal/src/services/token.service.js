/* ==========================================================================
 * token.service.js — T2.2: single-use, hashed, TTL-bound one-time tokens.
 *
 * Contract (B6 §3 / roadmap T2.2):
 *   - raw token = 32-byte crypto-random hex, returned ONCE to the caller
 *     (delivery channel = email), never logged, never stored raw
 *   - database holds only sha256(token) + expiry + subject + payload
 *   - consume() is single-use: a consumed or expired token never validates
 *   - TTLs: password reset 60 minutes · email verification 48 hours ·
 *     legacy token exchange 15 minutes (bridge session, T2.4)
 * ========================================================================== */
import { createHash } from 'node:crypto';
import { token as randomToken } from '../lib/security.js';
import { HttpError } from '../lib/http.js';

export const TOKEN_KINDS = {
  password_reset: { ttlMs: 60 * 60 * 1000, label: 'password reset' },
  email_verify: { ttlMs: 48 * 60 * 60 * 1000, label: 'email verification' },
  legacy_exchange: { ttlMs: 15 * 60 * 1000, label: 'legacy token exchange' },
  /* rm(8.1-2): the document-download TTL is configurable (DOC_URL_TTL_MS) — default
   * 15 minutes. In production, values under 60 seconds are refused at issue time. */
  document_download: { ttlMs: Number(process.env.DOC_URL_TTL_MS || 15 * 60 * 1000), label: 'document download' },
};

const sha256 = (v) => createHash('sha256').update(v).digest('hex');

export function createTokenService(repos) {

  /** issue — returns { token (raw, once), expiresAt }; stores the hash only */
  async function issue(kind, subject, payload = {}, { ttlMs } = {}) {
    const def = TOKEN_KINDS[kind];
    if (!def) throw new Error('unknown token kind: ' + kind);
    const effectiveTtl = ttlMs || def.ttlMs;
    if (kind === 'document_download' && process.env.NODE_ENV === 'production' && effectiveTtl < 60000) {
      throw new HttpError(500, 'DOC_URL_TTL_MS under 60s is refused in production (signed URLs must be deliverable)');
    }
    const raw = randomToken(32);
    const rec = {
      kind, subject, payload,
      tokenHash: sha256(raw),
      expiresAt: Date.now() + effectiveTtl,
      consumedAt: null,
      createdAt: Date.now(),
    };
    await repos.tokens.issue(rec);
    return { token: raw, expiresAt: rec.expiresAt };
  }

  /** consume — validates freshness + single-use; returns the record or throws.
   * rm(8.1-2): on PostgreSQL the claim is a single atomic UPDATE (find→check→save
   * let concurrent fetches both succeed); the JSON store keeps the sequential path
   * (single-process) via the same interface. */
  async function consume(kind, rawToken) {
    if (!rawToken || typeof rawToken !== 'string') throw new HttpError(400, 'Token is required');
    if (typeof repos.tokens.consumeAtomic === 'function') {
      const rec = await repos.tokens.consumeAtomic(kind, sha256(rawToken), Date.now());
      if (!rec) {
        /* distinguish 401 (unknown/expired) from 409 (reused) for the drill's contract */
        const prior = await repos.tokens.find(kind, sha256(rawToken));
        if (!prior) throw new HttpError(401, 'Token not recognised');
        if (prior.consumedAt != null) throw new HttpError(409, 'Token already used');
        throw new HttpError(401, 'Token expired');
      }
      return rec;
    }
    const rec = await repos.tokens.find(kind, sha256(rawToken));
    if (!rec) throw new HttpError(401, 'Token not recognised');
    if (rec.consumedAt != null) throw new HttpError(409, 'Token already used');
    if (rec.expiresAt <= Date.now()) throw new HttpError(401, 'Token expired');
    rec.consumedAt = Date.now();
    await repos.tokens.save(rec);
    return rec; /* { subject, payload, … } */
  }

  /** burn — single-use guard for EXTERNALLY-issued tokens (legacy bridge):
   *  first sight records the hash and succeeds; any later sight throws 409. */
  async function burn(kind, rawToken) {
    if (!rawToken || typeof rawToken !== 'string') throw new HttpError(400, 'Token is required');
    const def = TOKEN_KINDS[kind];
    if (!def) throw new Error('unknown token kind: ' + kind);
    const h = sha256(rawToken);
    const existing = await repos.tokens.find(kind, h);
    if (existing) throw new HttpError(409, 'Token already used');
    await repos.tokens.issue({ kind, subject: 'external', payload: {}, tokenHash: h, expiresAt: Date.now() + def.ttlMs, consumedAt: Date.now(), createdAt: Date.now() });
    return true;
  }

  /** housekeeping — callers may invoke opportunistically (never required for correctness) */
  async function purgeExpired() {
    await repos.tokens.purgeExpired();
  }

  return { issue, consume, burn, purgeExpired };
}
