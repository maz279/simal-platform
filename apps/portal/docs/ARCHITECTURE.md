# Architecture — Simal KYC System

## 1. Decision record (from docs/PLAN.md)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Zero-dependency Node 22+** | runs with `node src/server.js` on any machine, no install step, no supply-chain surface — a defensible property for a KYC system; `node:test` + `fetch` cover the whole test story |
| D2 | Purpose-built router on `node:http` | literal segment matching, middleware chains, static server with immutable caching; nothing the PRD needs is missing |
| D3 | Atomic JSON store behind repositories | single-file state, write-temp→fsync→rename; **swap point for PostgreSQL** is isolated to `src/store/` |
| D4 | scrypt → TOTP → idle-expiring sessions | PRD FR-A-001/002; OWASP-aligned (20-min idle, brute-force lockout, HttpOnly SameSite=Strict) |
| D5 | Uploads validated by magic bytes | OWASP: never trust names; %PDF/PNG/JPEG/ftyp verified server-side; bytes stored under `data/uploads/` with random ids |
| D6 | Partner access = reference + email, draft tokens 48-hex | the PRD's simulated magic-link model, hardened |
| D7 | Frontend = audited prototype ported to `api.js` | four audit rounds of UX/a11y work carried forward unchanged |

## 2. Runtime topology

```
browser ── public/ (static SPA: landing, form, status, confirmation, admin)
   │            └─ api.js (fetch, credentials, same-origin)
   ▼
http server (src/server.js)
   ├─ dispatch: request-id → security headers → route match → middleware chain
   ├─ routes.js (public / auth / admin / integration) + rate limiters
   ├─ services ── domain (validators, rules/RBAC) ── lib (security, http, log)
   ├─ store (db.js atomic JSON + repos) ── data/ (db.json, uploads/, watchlist.csv)
   ├─ notify ── SMTP (when configured) / outbox fallback / WhatsApp seam
   ├─ screening ── watchlist CSV, exact+fuzzy, runs on submit
   └─ webhooks ── signed approval push (SSRF-guarded) ── integration master feed
```

## 3. Request lifecycle

1. `server.js` catches everything; `dispatch()` stamps request-id + CSP/HSTS-style headers, matches the route.
2. Middleware chain per route: rate limiter → `requireAuth` (session cookie → live session touch) → `requirePerm` (RBAC matrix) → handler.
3. Handlers parse capped JSON bodies, call services, return via `ok/created/fail`.
4. `HttpError` (4xx) renders `{error, details}`; unexpected 500s are logged with stack, no internals leaked.
5. Maintenance loop (15 min): reap idle sessions, purge >12-month drafts (audited).

## 4. Domain model

- **Workflow** (`domain/rules.js`): `draft→submitted→under_review→{query_raised⇄partner_updated}|on_hold→approved|rejected`, `approved→under_review` (reopen, super-admin). ACTIONS table maps action→{to, from[], requiresReason, permission}. One source of truth for services **and** tests.
- **RBAC**: `super_admin ⊃ reviewer ⊃ viewer` permission matrix; `view_pii` gates unmasking, `reopen` is super-admin only.
- **Validation** (`domain/validators.js`): field-level rules + full-application validation (company/tax/contacts/signatories/UBOs/banking/documents/declarations), UAE specifics (15-digit TIN with mod-97 prototype strategy — single swap point for the FTA algorithm, PRD OQ-9; AE IBAN; EID structure; Peppol `0235:`), per-role required-document matrix, POA-triggered document requirement, ownership reconciliation.

## 5. Security model ( defence-in-depth )

- **AuthN**: scrypt(N=16384) per-user salt, timing-safe verify; TOTP RFC 6238 (±1 step, single-use 5-min challenges, failure-audited); sessions 64-hex random, idle+absolute expiry, server-side store.
- **AuthZ**: cookie → session → role → permission per route/action; masking layer for PII in reads and exports.
- **Input**: JSON cap 26 MB; upload allow-list + ≤10 MB + magic bytes; document ids regex-validated; checklist item names `^[a-z_]+$`; static path traversal blocked (resolve + boundary check).
- **Output**: strict CSP (`script-src 'self'`, no inline), nosniff, DENY framing, no-referrer; all dynamic HTML escaped (`UI.esc`); CSV quoted/escaped.
- **Transport-out**: webhook URL must be http/https, DNS-resolved, non-loopback/private/reserved (SSRF).
- **Secrets**: only env; `.env` machine-local; tests generate credentials at runtime; security scanner wired into the write path.
- **Audit**: every decision, login/logout, export, download, screening, webhook, purge.

## 6. Data & migration

`data/db.json` — schema `version: 2`; `createStore` migrates forward (v1→v2 adds invites/outbox/screening), fills missing collections. Writes are serialised, coalesced, fsync'd, atomic-renamed. Uploads live in `data/uploads/` with random ids + sanitised names. **PostgreSQL path**: reimplement `repos.js` only.

## 7. Notification pipeline

`notify.service.js` templates (received / query raised / decision / screening-hit / customs) →
SMTP (minimal zero-dep client, STARTTLS+AUTH PLAIN) when `SMTP_HOST` set, else the durable
outbox (admin-visible, test-assertable); WhatsApp via provider seam. Failure → entry marked
`failed`, never blocks the API response.

## 8. Screening pipeline

On every submit: company + trade name + signatory + UBO names → normalise (token stripping:
LLC/FZE/TRADING/…) → exact containment or Levenshtein ratio ≥ threshold vs watchlist
(Type,Name,Aliases,Country CSV). Hits: stored on the submission, surfaced in review, emailed
to compliance. Watchlist reloadable at runtime.

## 9. Test architecture

- **Unit** (31): validators incl. deterministic generators; scrypt/TOTP/rate-limiter/magic-byte sniffing; RBAC; workflow transitions incl. terminal states; store atomicity + migration + repositories.
- **Integration** (18): real server on an ephemeral port, temp DATA_DIR, runtime-generated credentials; drives complete journeys over fetch and asserts status codes, bodies, side-effects (outbox, audit, webhook seams) and negative paths (401/403/404/409/422/429).
- **Visual**: scripted browser walkthrough of the served system (screenshots in TEST_REPORT.md).

## 10. Known limits (documented honestly)

Single-process (no horizontal scale), JSON store (PostgreSQL swap documented), minimal SMTP client (no SMTPS/465), Arabic UI scaffold not yet translated, real watchlist data to be supplied, webhook retries not yet exponential-backoff. All Phase-2 items per the PRD.
