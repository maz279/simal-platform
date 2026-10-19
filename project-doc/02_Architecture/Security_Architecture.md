# Security Architecture

**Doc ID:** B6 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** SEC · Extends the shipped portal security model site-wide.

## 1. Foundation (already proven in `portal/` — carried forward unchanged)

| Control | Implementation (as built) |
|---|---|
| AuthN | scrypt N=16384 per-user salt, timing-safe verify; TOTP RFC 6238 (±1 step, single-use 5-min challenges) |
| Sessions | 64-hex random, server-side, idle 20 min + absolute expiry, HttpOnly SameSite=Strict |
| Brute force | login 10/5min per account+IP with lockout (verified: 429 on 11th attempt) |
| RBAC | super_admin ⊃ reviewer ⊃ viewer; partner role = zero admin perms; matrix in domain rules |
| Input | JSON cap (26 MB), field validators, 15-digit TRN, AE IBAN 23-char MOD-97 |
| Uploads | extension allow-list + ≤10 MB + **magic-byte signature**; random ids; traversal-blocked reads |
| Output | strict CSP (`script-src 'self'` — inline scripts blocked, verified), nosniff, DENY, no-referrer; all HTML escaped |
| Secrets | environment/.env only — no credential literals in source (enforced policy; .env git-ignored) |

## 2. Production additions (site tier)

1. TLS everywhere (HSTS), UAE-region origin (ADR-9).
2. CSP for SSG pages identical to portal policy; no third-party scripts Phase 1 (analytics self-hosted or deferred consent per Cookie Policy).
3. RFQ endpoint rate-limited + email validation + spam honeypot (replaces localStorage trust).
4. CMS writes role-gated + audit-logged (same audit_log).
5. PII masking extended to RFQ/admin exports (default masked; `view_pii` unmask, super admin).

## 3. Threat model (STRIDE-lite, top items)

| Threat | Vector | Control |
|---|---|---|
| Spoofing | password stuffing | lockout + scrypt + TOTP for staff |
| Tampering | invoice totals edited client-side | server recompute at submit **and** validate (verified); DB CHECKs (B4) |
| Repudiation | "never submitted that" | timeline[] + audit_log on every transition |
| Info disclosure | cross-partner invoice read | partner scope guard (403, tested); PII masking |
| DoS | request floods | per-route rate limits; CDN absorption for static |
| Supply chain | dependency risk | zero-dependency core kept; new deps require ADR + lockfile audit |

## 4. Secrets & key management

Env-only (`.env` / deployment secrets): DB URL, SMTP creds, MASTER_API_TOKEN, session pepper if added, ASP credentials (C2). Rotation: quarterly or on staff change; never in repo/logs (log scrubber lists key names).

## 5. Incident hooks

Security events (lockouts, validation tamper 422s, traversal attempts) → structured logs → E5 alerts; breach notification path per PDPL in C1 §6.

## 6. Audit v2.0 additions

1. **Password reset / email verification (A6 §5):** one-time tokens — 64-hex, single-use, 60-min expiry, hashed at rest, emailed not returned; reset invalidates all sessions; verification required on email change. Rate-limit reset requests (5/hour/email).
2. **CSP nuance:** `style-src 'unsafe-inline'` is accepted (prototype design system uses inline styles; scoped and reviewed) — **`script-src 'self'` stays absolute** (inline-script block is a shipped, tested control).
3. **Site endpoint limits:** `/api/rfq` 10/min/IP + honeypot + email validation; `/api/search` 120/min/IP; CMS writes behind `notes` perm + audit.
4. **Rotation schedule:** MASTER_API_TOKEN + ASP creds quarterly; staff offboarding same-day; any suspicion = immediate (E5 alert path).
5. **AR/RTL pages:** identical header/CSP policy; RTL is layout-only (URD numerals rule).

## 7. Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — site-tier additions defined on the proven portal base |
| 2026-10-05 | **v2.0 audit:** +reset/verification token rules, CSP style-exception documented, site rate limits, rotation schedule, RTL note |
