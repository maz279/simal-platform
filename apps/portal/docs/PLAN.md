# KYC_System — Implementation Plan (v1.0)

Methodical build plan for the production implementation of the Simal KYC Portal, derived from
`../PRD_Simal_KYC_Portal_v1.1.md` (Phase-1 MVP scope, §5.1) and the audited prototype
(`../prototype`, v1.4). This document records the plan, the locked engineering decisions and
the test strategy before code is written.

---

## 1. Workspace research findings (2026-09-26)

| Check | Result | Consequence |
|---|---|---|
| Node | v24.21.0 | Modern built-ins available: `node:test` runner, global `fetch`, `node:crypto` (scrypt, HMAC for TOTP), ESM |
| npm | v11.19.0, registry reachable | Dependencies *possible* — but not required (see decision D1) |
| Ports | 3000 free | Default `PORT=3000` |
| Target folder | `KYC_System/` empty | Clean scaffold |
| Prototype | v1.4, fully audited (42-check suite, 4 audit rounds) | Front-end is ported, not rebuilt — UX work carries over |

## 2. Locked engineering decisions

- **D1 — Zero-dependency Node core.** Server, persistence, auth and tests use only Node 24
  built-ins. Rationale: (a) runs with `node src/server.js` and zero install on any machine
  Simal's IT uses; (b) no supply-chain surface — a defensible property for a KYC system;
  (c) `node:test` + `fetch` give full unit/integration coverage with no frameworks. The PRD's
  NestJS/Laravel + PostgreSQL recommendation is noted; the repository seam (D3) keeps that
  migration mechanical.
- **D2 — HTTP layer:** small purpose-built router on `node:http` (method + path params +
  middleware chain: request-id, logging, security headers, body limits, JSON parsing,
  rate limiting, auth/session, RBAC). Static file server for `public/` with MIME map +
  immutable cache headers for fingerprinted assets.
- **D3 — Persistence:** atomic JSON store (`data/db.json`, write-temp-then-rename, schema
  `version` field, in-place migrations) behind repository modules. Uploaded document bytes go
  to `data/uploads/<uuid>` with metadata in the DB. Phase-2 swap to PostgreSQL is isolated to
  the `src/store/` layer.
- **D4 — AuthN/AuthZ:** email + password (scrypt with per-user salt, timing-safe verify) →
  mandatory TOTP second factor (RFC 6238, HMAC-SHA1, 30s/6-digit, ±1 step drift) → session
  cookie (`HttpOnly`, `SameSite=Strict`, `Path=/`) with **20-minute idle expiry** server-side
  (PRD FR-A-001 / OWASP 15–30 min). RBAC matrix: `super_admin` > `reviewer` > `viewer`
  (PRD FR-A-002). Admin bootstrap **only from environment variables** — no credential
  literals anywhere in source, examples or tests.
- **D5 — Document uploads:** JSON `documents[]` with base64 payload (≤ 10 MB each, ≤ 25 MB
  request). Server-side validation: extension allow-list **+ magic-byte signature check**
  (%PDF / PNG / JPEG SOI / ISO-BMFF `ftyp`) — never trust the client (OWASP). Downloads are
  auth-gated, audited (`document_downloaded`), served with `X-Content-Type-Options: nosniff`
  and correct `Content-Type`.
- **D6 — Public partner access:** draft tokens & status "magic links" are single-purpose,
  64-hex random (`crypto.randomBytes`), expiry-bound. Partner status lookup = reference +
  email match (as in the PRD's simulated magic link), rate-limited.
- **D7 — Front-end:** the audited prototype pages are ported to `public/` with a new
  `api.js` client (fetch, credentials, error toasts). Controllers become async; all
  localStorage usage is removed.

## 3. API surface (contract frozen before build)

**Public**
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/public/drafts` | create draft `{email, role}` → `{draftId, token}` |
| PUT | `/api/public/drafts/:id` | save `{token, data, documents}` |
| GET | `/api/public/drafts/:id` | resume `{?token=}` |
| POST | `/api/public/applications` | submit (validates everything server-side) → `{reference}` |
| GET | `/api/public/applications/:ref` | status view `?email=` (limited fields) |
| POST | `/api/public/applications/:ref/respond` | partner answers a query `{email, message}` |
| GET | `/api/public/invites/:code` | invite lookup for the gate note |

**Auth**
| POST | `/api/auth/login` | password ok → `{mfaChallengeId}` (never a session) |
| POST | `/api/auth/mfa` | TOTP ok → session cookie |
| POST | `/api/auth/logout` | destroy session |
| GET | `/api/auth/me` | session + role introspection |

**Admin** (session + RBAC)
| GET | `/api/admin/submissions` | list `?status&role&q&sort&page` (pending pseudo-filter) |
| GET | `/api/admin/submissions/:id` | full record |
| POST | `/api/admin/submissions/:id/actions` | `start|approve|reject|hold|reopen` (+reason) |
| POST | `/api/admin/submissions/:id/query` | raise field-level query |
| POST | `/api/admin/submissions/:id/checklist` | tick verification item |
| POST | `/api/admin/submissions/:id/notes` | internal note |
| GET | `/api/admin/analytics` | KPIs, funnel, aging, expiries |
| GET | `/api/admin/audit` | audit log `?q&action` |
| GET | `/api/admin/export.csv` | PII-safe CSV (super-admin `?pii=full`) |
| POST | `/api/admin/invites/bulk` | CSV text → validated invites + links |
| GET | `/api/admin/documents/:docId` | audited download |

## 4. Validation domain (ported from the audited prototype)

UAE TIN (15-digit + mod-97 prototype check strategy — isolated for the FTA-algorithm swap,
PRD OQ-9), IBAN (mod-97), Emirates ID structure, Peppol scheme pattern, email/phone/URL,
date windows, per-role required-field matrix (PRD §10), ownership reconciliation, duplicate
TRN detection (warn), invite redemption.

## 5. Test strategy (three layers)

1. **Unit** (`node --test test/unit/`): validators (incl. generators), TOTP vectors,
   scrypt hash/verify, rate limiter, workflow transition matrix, RBAC matrix, store
   atomicity/migration.
2. **Integration** (`test/integration/api.test.js`): boot the real server on an ephemeral
   port with a temp DATA_DIR; drive full journeys over HTTP with `fetch`:
   partner journey (draft → submit → status → query respond), auth journey (login/MFA/logout,
   wrong password 401 + lockout, idle expiry), review journey (start → checklist → note →
   query → partner respond → approve → audit), RBAC denials (viewer cannot act),
   rate limiting, CSV export content, invite bulk → convert closed loop, security headers,
   404/400 handling, upload magic-byte rejection.
3. **Visual**: browser walkthrough of the served system (login, dashboard, review, form,
   status) with screenshots + DOM assertions; results recorded in `docs/TEST_REPORT.md`.

## 6. Build order (dependency-driven)

1. Scaffold + config + lib (log, security, router)
2. Domain (validators, rules) → unit tests green
3. Store (db + repos) → unit tests green
4. Services (auth, kyc, review, invites, analytics, export)
5. Routes + server + static + seed → integration tests green
6. Front-end port → visual verification green
7. Docs (README, API.md, ARCHITECTURE.md, TEST_REPORT.md) + completion audit

## 7. Non-goals (documented, per PRD Phase-2/3)

Real email/SMS delivery, OCR, sanctions screening, ERP/ASP sync, Arabic UI, WhatsApp —
seams exist (services are isolated), implementations deferred exactly as the PRD phases them.
