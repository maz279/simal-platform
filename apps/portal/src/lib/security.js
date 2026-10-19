/* ==========================================================================
 * security.js — password hashing (scrypt), TOTP (RFC 6238), tokens,
 * rate limiting, security headers, constant-time compares.
 * Zero dependencies: node:crypto only.
 * ========================================================================== */
import crypto from 'node:crypto';
import { config } from '../config.js'; /* evaluated first: .env is loaded before SITE_ORIGIN is read */

/* ---------- password hashing (scrypt, per-user salt) ---------- */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1, keylen = 64;
  const hash = crypto.scryptSync(String(password), salt, keylen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function verifyPassword(password, stored) {
  try {
    const [scheme, Ns, rs, ps, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(String(password), salt, expected.length,
      { N: Number(Ns), r: Number(rs), p: Number(ps) });
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}
export function timingSafeEqual(a, b) {
  const ba = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
  const bb = Buffer.isBuffer(b) ? b : Buffer.from(String(b));
  if (ba.length !== bb.length) {
    /* still do a comparison to keep timing flat */
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/* ---------- TOTP (RFC 6238, SHA-1, 6 digits, 30s) ---------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Decode(secret) {
  const clean = String(secret).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '', bytes = [];
  for (const ch of clean) {
    const v = B32.indexOf(ch);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, '0');
    while (bits.length >= 8) { bytes.push(parseInt(bits.slice(0, 8), 2)); bits = bits.slice(8); }
  }
  return Buffer.from(bytes);
}
function hotp(secretBuffer, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  /* HMAC-SHA1 is REQUIRED by RFC 6238 for TOTP interoperability with standard
   * authenticator apps (Google/Microsoft Authenticator et al.). SHA-1's collision
   * weakness is irrelevant to HMAC here, and this is the ONLY SHA-1 use in the
   * system — all other MACs/hashes use SHA-256/scrypt. */
  const h = crypto.createHmac('sha1', secretBuffer).update(buf).digest();
  const off = h[h.length - 1] & 0x0f;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 1000000).padStart(6, '0');
}
export function totpNow(secret, stepOffset = 0, t = Date.now()) {
  return hotp(base32Decode(secret), Math.floor(t / 30000) + stepOffset);
}
/** verify with ±1 step drift, replay-protected by caller */
export function verifyTotp(secret, code, { drift = 1, t = Date.now() } = {}) {
  const c = String(code).replace(/\D/g, '');
  if (c.length !== 6) return false;
  for (let off = -drift; off <= drift; off++) {
    if (timingSafeEqual(totpNow(secret, off, t), c)) return true;
  }
  return false;
}

/* ---------- tokens & ids ---------- */
export const token = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/** RFC 6238 base32 secret (160 bits) for MFA enrolment — QR payload built by caller */
export function generateTotpSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % 32];
  return out;
}
export const id = (prefix) => prefix + '_' + crypto.randomBytes(10).toString('hex');
export function hmacSign(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/* ---------- rate limiter (token bucket per key) ---------- */
export function rateLimiter({ windowMs, max, blockMs = 0 } = {}) {
  const buckets = new Map(); // key -> { count, resetAt, blockedUntil }
  /* deploy-audit H2: buckets were never evicted, so every distinct client key (and every
   * forged one) stayed in memory for the life of the process. Expired buckets are swept
   * at most once per window. */
  let nextSweep = Date.now() + windowMs;
  return function hit(key) {
    const now = Date.now();
    if (now >= nextSweep) {
      for (const [k, v] of buckets) if (v.resetAt <= now && v.blockedUntil <= now) buckets.delete(k);
      nextSweep = now + windowMs;
    }
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
      buckets.set(key, b);
    }
    if (b.blockedUntil > now) return { ok: false, retryAfterMs: b.blockedUntil - now };
    b.count += 1;
    if (b.count > max) {
      if (blockMs) b.blockedUntil = now + blockMs; // brute-force lockout (FR-A-001)
      return { ok: false, retryAfterMs: b.resetAt - now };
    }
    return { ok: true };
  };
}

/* ---------- security headers (helmet-style) ---------- */
/* the console probes the public site from the browser (connect-src); SITE_PUBLIC_URL in production */
const SITE_ORIGIN = (() => { try { return new URL(config.siteUrl).origin; } catch { return 'http://127.0.0.1:8100'; } })();
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; font-src 'self'; connect-src 'self' " + SITE_ORIGIN + "; " +
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; " +
    "report-uri /api/csp-report",
};

/* ---------- upload content sniffing (magic bytes; OWASP: never trust names) ---------- */
export function sniffContentType(head) {
  if (!head || head.length < 4) return null;
  const starts = (arr, off = 0) => arr.every((b, i) => head[off + i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46])) return 'application/pdf';                 // %PDF
  if (starts([0x89, 0x50, 0x4e, 0x47])) return 'image/png';                       // PNG
  if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg';                            // JPEG SOI
  if (head.length >= 8 && starts([0x66, 0x74, 0x79, 0x70], 4)) return 'image/heic'; // ISO BMFF ftyp
  return null;
}

/* ---------- CSRF tokens (session-bound synchronizer token, SEC-7 / P8-1) ---------- */
/* deploy-audit H4: the fallback was a literal in this file. Production refuses to boot without
 * CSRF_SECRET (config.assertProductionConfig); elsewhere a per-process random secret stands in
 * (tokens are re-issued by /api/auth/me, so a restart only means reloading an open console). */
const DEV_CSRF_SECRET = crypto.randomBytes(32).toString('hex');
export function generateCsrfToken(sid) {
  if (!sid) return '';
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET || DEV_CSRF_SECRET;
  return crypto.createHmac('sha256', secret).update(String(sid) + ':csrf').digest('hex');
}

export function verifyCsrfToken(csrfToken, sid) {
  if (!csrfToken || !sid) return false;
  const expected = generateCsrfToken(sid);
  return timingSafeEqual(csrfToken, expected);
}

/* ---------- trusted proxy IP resolution (SEC-8, NFR-4 / P8-2) ---------- */
const TRUSTED_PROXIES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/* deploy-audit H2: X-Forwarded-For is read from the RIGHT. nginx's $proxy_add_x_forwarded_for
 * APPENDS the address it saw, so the leftmost entry is whatever the client sent — trusting it
 * let anyone rotate fake IPs past FORM_RATE_MAX, the login IP limiter and the lockout. Walk
 * from the right, skipping our own proxies; the first untrusted hop is the client. */
const norm = (a) => String(a || '').trim().replace(/^::ffff:/, '');
const isTrustedProxy = (addr) => TRUSTED_PROXIES.has(addr) ||
  (process.env.TRUSTED_PROXIES || '').split(',').map((s) => norm(s)).filter(Boolean).includes(addr);
export function resolveClientIp(req) {
  const remoteAddr = norm(req.socket?.remoteAddress);
  if (isTrustedProxy(remoteAddr) && req.headers && req.headers['x-forwarded-for']) {
    const hops = String(req.headers['x-forwarded-for']).split(',').map(norm).filter(Boolean);
    for (let i = hops.length - 1; i >= 0; i--) {
      if (!isTrustedProxy(hops[i])) return hops[i];
    }
    if (hops.length) return hops[0];
  }
  return remoteAddr || '127.0.0.1';
}
