# Security Audit Report — T6.6 (Local Rig)

**Date:** 3 October 2026 · **Executed:** 6 October 2026 (UTC)
**Scope:** OWASP ASVS L2 subset achievable headless. **Script:** `scripts/security-audit.js` (CI job: `secrets-scan` + local run) — **14/14 PASS**.
**Remaining rig (external):** OWASP ZAP baseline scan + third-party penetration test — scheduled pre-cutover (T6.6 gate: findings ≤ medium).

## 1. Result Summary

| Layer | Checks | Result |
|---|---|---|
| Response headers (ASVS V5) | 8 | **PASS** — incl. HSTS added this phase |
| Secrets scan | 1 (33 first-party source files) | **PASS** — no hard-coded credentials |
| Dependencies — runtime | 1 | **PASS** — zero high/critical in shipped deps |
| Dependencies — build toolchain | informational | 3 advisories, exposure assessed §4 |
| Runtime security evidence | 4 | **PASS** — SSRF/RBAC/PII/rate-limit suites green in CI; SQL literal check 49/49; traversal guard verified |

## 2. Response Headers (portal `http.js` + `security.js`)

Verified on live responses: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (added this phase — honoured at the TLS edge in production, ignored over local plain HTTP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, strict CSP (`default-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`). No `X-Powered-By`/server banner; 404s are JSON without stack traces.

**Site (SSG) headers:** served by the edge/hosting layer at cutover — the same header set is specified in the deployment config; verified post-deploy (GAP-G1 rehearsal covers this).

## 3. Secrets

- Scan of 33 first-party source files (JS/TS/Astro/JSON/YML/SQL/MD): zero matches for access-key patterns, private-key blocks, or live credential assignments.
- Bootstrap credentials in tests/benchmarks are generated per-run with `crypto.randomBytes` — no literals.
- `tools/` (vendored pgAdmin distribution) is excluded: its bundled AWS documentation example keys and example PEM fixtures are third-party documentation, not project secrets.
- Production credentials: environment variables only (`DATABASE_URL`, `SMTP_*`, `MASTER_API_TOKEN`) — per policy, never in source.

## 4. Dependency Advisories — build toolchain (accepted-risk register)

| Package | Severity | Advisory | Exposure assessment | Decision |
|---|---|---|---|---|
| astro 5.18.2 | critical | XSS in `define:vars` (incomplete `</script>` sanitisation) | **Build-time directive.** `grep` proves **zero `define:vars` / `is:raw` usages** in `apps/site/src` — the vulnerable code path never executes. Output is static HTML; no server runtime ships Astro. | Accept for Phase 6; migrate to Astro 7 in Phase 8 (task registered). No patched 5.x exists (5.18.2 is the final 5.x). |
| sharp | high | libvips CVE-2026-33327/33328/35590/35591 | Runs only inside the CI SSG build container, processing **first-party image assets** — no untrusted input reaches it; nothing ships to runtime. | Accept; re-evaluate at Astro 7 migration (bundled sharp bump). |
| esbuild | low | arbitrary file read on **dev server on Windows** | CI builds run Linux; no dev server in production. | Accept. |

**Runtime dependency tree (`pg` and portal deps): zero high/critical.**

## 5. Runtime Controls (evidence: test suites, all green this phase)

| Control (ASVS ref) | Evidence |
|---|---|
| SSRF protection (V12.6) | `ssrf-screening.test.js` ×7 — loopback/private/reserved/link-local/metadata IPs refused; scheme allowlist http/https; public URLs allowed |
| SQL injection (V5.3) | `pg-repos.js`: 49/49 `client.query` calls use literal SQL strings + `$n` placeholders — enforced by `security-audit.js` check; parity script likewise literal-only |
| Path traversal (V12.5) | uploads `readFile` resolves under root and asserts `startsWith(root + sep)`; document ids regex-validated at the route |
| AuthN/MFA (V2) | TOTP with ±1-step drift, timing-safe comparisons, challenge consume-once, 5-minute expiry — `auth` integration tests |
| Session management (V3) | idle+absolute expiry enforced per request (`isLive` awaited); logout destroys server-side; force-logout admin flow — tested |
| RBAC (V4) | viewer/reviewer/super_admin capability matrix; bootstrap-admin protections; 401/403 paths asserted |
| Rate limiting (V4.2) | login lockout per account+IP (429) — tested |
| PII protection (V8) | IBAN/ID masking by default; `pii=full` requires `view_pii`; masked CSV export asserted |
| Audit trail (V7) | every mutation writes `audit_log`; admin-visible; 5k cap JSON / PG table |
| Upload validation (V5) | magic-byte sniffing, extension match, 10 MB cap, name sanitisation — unit + integration tests |
| Webhook authenticity (V3.5) | HMAC-SHA256 signature (`v:1` payload), 8 s timeout, SSRF-guarded egress, queue-based (no direct fetch in request path) |

## 5b. Known weaknesses register (comprehensive audit, 6 Oct 2026)

| # | Weakness | Severity | Disposition |
|---|---|---|---|
| W-1 | Login timing side-channel: reset request for a REAL account performs email work (slower) than for an unknown one — body parity alone does not equalise timing | low | **Accepted + documented**: response bodies are identical (tested); the timing delta is bounded by outbox insertion. Hardening candidate for Phase 1.1 |
| W-2 | No TOTP recovery codes — a lost authenticator requires an admin-issued password reset (which also forces MFA re-enrolment) | low | **Accepted**: admin reset IS the documented recovery path; enterprise SSO is a Phase-1.1 item |
| W-3 | Password policy floor is length-8 only (no composition/breach checks) | low | **Registered** as a Phase-1.1 backlog enhancement (P11) |
| W-4 | Session cookie lacked `Secure` behind TLS | medium | **FIXED (this audit)**: `Secure` added, gated on `NODE_ENV=production` so local HTTP rigs still function; asserted by the account-services suite |
| W-5 | `submitToAsp` sandbox branch FABRICATED a transmission id (dead code, but a fake-data hazard) | medium | **FIXED (this audit)**: function removed; ASP transmission is exclusively the real client (`peppol-asp.client.js`); `aspHealth` now reports genuine undelivered-invoice counts |

## 6. Findings & Disposition

| # | Finding | Severity | Disposition |
|---|---|---|---|
| F-1 | HSTS header missing (found by this audit) | medium | **Fixed** — `security.js` SECURITY_HEADERS |
| F-2 | 4 SQL template literals in pg-repos (scanner-flagged pattern) | info | **Fixed** — converted to literal single-quoted strings (49/49 literal) |
| F-3 | Build-toolchain advisories (astro/sharp/esbuild) | accepted-risk | Registered §4; Astro 7 migration task in Phase 8 |
| F-4 | ZAP + external pen-test not yet run | process | Scheduled pre-cutover (T6.6 exit gate) |

**Gate status:** local rig PASS (14/14); ASVS L2 full sign-off pending ZAP + pen-test (external, pre-cutover). No open high/critical runtime findings.
