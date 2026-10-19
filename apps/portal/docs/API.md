# API Reference — Simal KYC System

Base URL: `http://HOST:PORT`. All request/response bodies are JSON unless noted.
Errors: `{ "error": "message", "details": [{ "field": "...", "message": "..." }] }` (details on 422).

## Conventions
- Sessions: `kyc_sid` cookie — `HttpOnly; SameSite=Strict; Path=/`; idle expiry per `SESSION_IDLE_MINUTES`, absolute per `SESSION_ABSOLUTE_HOURS`.
- Rate limits: public 120/min/IP; login 10/5min per account+IP with lockout; status 20/min/IP. 429 body states the retry window.
- Security headers on every response: CSP `default-src 'self'…`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, request id.

---

## Public (partner portal)

### POST /api/public/drafts
`{ "email": "you@co.ae", "role": "vendor" | "customer" }` → **201**
`{ "draftId": "dft_…", "token": "<48-hex>", "step": 1 }`
One active draft per email+role — repeat calls return the existing draft.

### PUT /api/public/drafts/:id
`{ "token": "…", "data": {…wizard state…}, "step": 3 }` → **200** `{ "id", "step", "updatedAt" }`

### GET /api/public/drafts/:id?token=…
→ **200** `{ id, email, role, data, documents, step, updatedAt }` · 404 on bad id/token.

### POST /api/public/drafts/:id/documents
`{ "token": "…", "documents": [{ "type": "trade_license", "name": "licence.png", "mime": "image/png", "dataB64": "<base64>" }] }`
→ **200** `{ "staged": [{ type, name, size, mime, docId }] }`
Validation: extension allow-list (pdf/jpg/jpeg/png/heic), ≤10 MB each, **magic-byte signature must match the extension**; restaging a slot replaces its earlier file.

### POST /api/public/applications
`{ "draftId?", "draftToken?", "application": { role, company, tax, contacts, signatories, ubos, banking, declarations }, "inviteCode?" }`
→ **201** `{ "reference": "SIM-KYC-YYYY-NNNNN", "screeningClear": bool, "duplicateTin": bool }`
The server is the validation authority — 422 with field-level details otherwise. Effects: screening runs, receipt email queued, invite converted, draft consumed, audit written.

### GET /api/public/applications/:ref?email=…
→ **200** `{ reference, company, role, status, reviewer, timeline[], queries[{section,message,raised_at,response,responded_at}], canRespond, rejection_reason, hold_reason }`
404 unknown ref · 403 email mismatch.

### POST /api/public/applications/:ref/respond
`{ "email": "…", "message": "…" }` → **200** `{ "status": "partner_updated" }` (409 if no open query)

### GET /api/public/invites/:code
→ `{ found: true, code, company, email, role, status }` or `{ found: false }`

### GET /api/public/tin-check?trn=…
→ `{ exists: bool, reference?, company?, status? }` (FR-P-015 duplicate probe)

---

## Auth

### POST /api/auth/login
`{ "email", "password" }` → **200**
- `{ "mfaRequired": true, "mfaChallengeId": "<hex>" }` (user has TOTP — challenge expires in 5 min, single-use)
- or (TOTP-less demo users) session cookie + `{ "mfaRequired": false, "user": {id,email,name,role} }`
401 invalid credentials (audited).

### POST /api/auth/mfa
`{ "mfaChallengeId", "code": "123456" }` → **200** session cookie + `{ "user" }` · 401 bad/expired code.

### POST /api/auth/logout → **200** `{ ok: true }` (session destroyed)

### GET /api/auth/me → **200** `{ "user", "sessionIdleMinutes" }` · 401

---

## Admin (session required; RBAC per role)

### GET /api/admin/submissions
Query: `status=all|pending|submitted|under_review|query_raised|partner_updated|on_hold|approved|rejected`, `role`, `q`, `page`, `per≤50`, `sort=id|company|status|submittedAt|reviewer|age`, `dir=asc|desc`
→ `{ total, page, pages, rows: [{ id, role, status, company, tin, submittedAt, reviewer, ageDays, slaBreached }] }`

### GET /api/admin/submissions/:id[?pii=full]
→ full record. PII masking by default (signatory/UBO IDs → `•••••1234`, IBAN masked); `pii=full` requires `view_pii` (super admin). Includes `screening` results.

### POST /api/admin/submissions/:id/actions  *(perm: decide / reopen)*
`{ "action": "start|approve|reject|hold|reopen", "reason?": "…" }` → `{ status }`
Rules: reject/hold require a reason; approve only from under_review/partner_updated; reopen only super_admin from approved. Approve fires the signed webhook + partner email.

### POST /api/admin/submissions/:id/query  *(perm: query)*
`{ "section", "message" }` → `{ status: "query_raised", queries }` — emails the partner.

### POST /api/admin/submissions/:id/checklist  *(perm: notes)*
`{ "item": "license", "checked": true }` → checklist map

### POST /api/admin/submissions/:id/notes  *(perm: notes)*
`{ "text" }` → notes array (internal only)

### GET /api/admin/analytics → `{ stats, aging[], expiries[] }`
### GET /api/admin/audit?q=&action= → audit entries *(perm: read_audit)*
### GET /api/admin/outbox → notification log *(perm: read_audit)*
### GET /api/admin/documents/:docId → file bytes (audited `document_downloaded`; auth required)
### POST /api/admin/invites/bulk  *(perm: manage_invites)*
`{ "csv": "Name,email,role\n…" }` → `{ imported, rejected[], links[{code,company,email,role,link}] }`
### GET /api/admin/invites → invite list
### GET /api/admin/export.csv[?status=&role=&pii=full]  *(perm: export)*
PII-safe by default (IBAN masked, no ID numbers); `pii=full` super-admin only; every export audited.

---

## Admin Workspace (user management · settings · reports)

All workspace endpoints require an authenticated admin session; user & settings management additionally require **super_admin** (`view_pii`).

### GET /api/admin/users *(super_admin)*
→ `[{ id, email, name, role, active, hasTotp, createdAt, lastLogin }]` — no password hashes or TOTP secrets ever leave the store.

### POST /api/admin/users *(super_admin)*
`{ email, name, role: super_admin|reviewer|viewer, password (min 8), totpSecret? (base32) }` → `201 { id, email, name, role }`
Validation: unique email, role whitelist, password ≥ 8, optional TOTP secret must be valid base32 (`A-Z 2-7`, ≥ 16 chars). Audited as `user_created`.

### PUT /api/admin/users/:id *(super_admin)*
`{ name?, role?, active? }` → updated record. The bootstrap admin account cannot be demoted or deactivated (403). Audited as `user_updated`.

### POST /api/admin/users/:id/reset-password *(super_admin)*
→ `{ temporaryPassword }` — generated with `crypto.randomBytes`, shown once, never stored in plaintext. Audited as `password_reset`.

### POST /api/admin/users/:id/deactivate *(super_admin)*
→ `{ id, active: false }`. Guards: cannot deactivate your own account (400) or the bootstrap admin (403). Audited as `user_deactivated`.

### GET /api/admin/sessions *(super_admin)*
→ `[{ sid (8-char prefix only), user, role, loggedInAt, lastSeen, expiresAt }]` — live sessions only.

### POST /api/admin/sessions/:sidPrefix/force-logout *(super_admin)*
Terminates the session whose sid starts with `:sidPrefix` (the prefix shown in the list). Audited as `force_logout`.

### GET /api/admin/settings *(super_admin)* / PUT /api/admin/settings
`{ simalTin?, simalPeppol? }` — the organisation identity stamped onto partner-facing documents. TIN must pass the same mod-97 checksum rule as partner applications; Peppol ID must match `0235:<15 digits>`. Audited as `settings_updated`.

### GET /api/admin/reports *(any admin role)*
→ `{ builtIn: [{ id, name, description, defaults }], availableFields: [{ key, label }] }`

### POST /api/admin/reports/build *(any admin role)*
Either `{ builtIn: "<id>" }` or `{ fields: [key…], filters: { role, status, dateFrom, dateTo, q, screeningOnly }, sortBy, sortDir }`
→ `{ columns: [{ key, label }], rowCount, rows: [{ field: value }], availableFields }`. Unknown fields are dropped; an empty selection falls back to a sensible default column set. `user-activity` is audit-trail-backed (Timestamp/Actor/Action/Target/Details). Every run audited as `report_generated`.

### POST /api/admin/reports/export.csv *(any admin role)*
Same body as `/build` → `text/csv` attachment (quoted, CRLF, rectangular). PII fields only appear if explicitly selected as columns.

---

## Integration

### GET /api/integration/master
Header: `X-Api-Token: <MASTER_API_TOKEN>` → `{ count, counterparties: [{ reference, role, legal_name, tin, peppol_id, country, currency, iban, bank, screening_clear, approved_at }] }`
(approved records only — the ERP/ASP pull feed, PRD INT-04/06)

### Webhooks (outbound, on approval)
POST `WEBHOOK_URL` with `{ event: "submission.approved", ts, payload }`, header `X-Simal-Signature: sha256=<HMAC-SHA256 of body using WEBHOOK_SECRET>`. **SSRF-guarded**: URL must be http/https, host resolves, loopback/private/reserved IPs refused.

### POST /api/admin/screening/reload *(perm: read_audit)* — reload watchlist CSV
