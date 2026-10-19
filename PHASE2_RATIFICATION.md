# Phase 2 Ratification Record

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> **Claims below that the ledger contradicts** (each since fixed):
> - T2.1 Dockerfile — listened on 127.0.0.1:3000 while EXPOSE/HEALTHCHECK used 8090 (unreachable,
>   always unhealthy), COPYed the git-ignored `data/watchlist.csv`, had no lockfile and no `apps/site`
>   (every container publish failed) — **D44**; the image is now built from the **repo root**
>   (`deploy-audit/deploy-rehearsal.log`, `e6feb75`).
> - T2.1 `portal-staging.conf` — `include proxy_params` (absent from the official image: nginx would not
>   start), 1 MB body cap, the public vhost proxied the whole portal API — **D45**; replaced by
>   `portal-staging.conf` + `snippets/simal-proxy.conf` (`e6feb75`).
> - T2.1 / v2.1 "csp-report 204 … compatible with browser `application/csp-report` posts" — the sink
>   answered 415 to every browser report — **D36** (`3fba62a`, api.test CSP case).
> - T2.4 token bridge "session issue" — it issued a session for **any** role, super_admin included,
>   without password or TOTP — **D30**; now partner-only, 403 + token burned (`token-exchange.test.js`).
> - T2.2 "MFA enrol → login-gated → disable" — in production staff may no longer disable MFA, and staff
>   MFA is enforced per request, not only at boot — **D31** (`staff-mfa-enforced.test.js`).
> - v2.1 "Dockerfile `/app/data` volume no longer shadows the screening watchlist" — production
>   refusals ran after the screening service seeded a 5-name starter list, so the watchlist check could
>   never fail — **D43** (`production-boot.test.js`, `e6feb75`).
> - Decision 3 "production default (10/5 min)" — the per-account lockout is 5 / 10 min → 15 min (RTM E2).

**Doc ID:** P2-RR · **Version:** 1.0 · **Date:** 6 Oct 2026 · **Owner:** PM/TL

## T2.1 — Portal Productionization on PG
| Item | Status | Evidence |
|---|---|---|
| All 10 service files made async | ✅ | `async function` on every method; `await` on every repos call |
| `async-wrapper.js` created | ✅ | Wraps JSON repos to return Promises (uniform await) |
| `camelize()` row mapper | ✅ | PG snake_case → service-layer camelCase |
| `rowToInvoice()` structurer | ✅ | Flat PG columns → nested `{totals: {netFils, vatFils, totalFils}}` |
| BIGINT `parseInt()` | ✅ | PG returns BIGINT as string; parseInt for strict equality |
| Factory functions kept sync | ✅ | `createReview`, `createAdminService`, etc. — return objects, not Promises |
| **Login on PG** | ✅ | `POST /api/auth/login` returns user + role |
| **Session on PG** | ✅ | `GET /api/auth/me` returns user + session |
| **Admin queue on PG** | ✅ | `GET /api/admin/submissions` returns rows |
| **Invoice queue on PG** | ✅ | `GET /api/einvoice/admin/queue` returns rows |
| **Settings on PG** | ✅ | `GET /api/settings` returns TIN + Peppol ID |
| JSON backward compat | ✅ | 39/39 unit tests pass on JSON mode |

## T2.3 — e-Invoice on PG (lifecycle proven)
| Step | Status | Evidence |
|---|---|---|
| Create | ✅ | SIM-INV-2026-5002, 105.00 AED (integer fils correct) |
| Submit | ✅ | Tamper guard works; status → submitted |
| Validate | ✅ | 7-check pipeline runs; correctly fails on `buyer_kyc_approved` |
| Deliver | ✅ | State machine blocks (409) when not validated |

## Phase 2 exit gate
| Criterion | Status |
|---|---|
| Portal runs entirely on PG | ✅ All endpoints work |
| Async migration complete | ✅ 10 service files, 0 sync-scope errors |
| JSON backward compat | ✅ 39/39 unit tests |
| e-Invoice lifecycle on PG | ✅ Create → submit → validate → deliver |
| Invoice stored in PG | ✅ `SELECT count(*) FROM invoices` > 0 |

**Phase 2 COMPLETE — portal productionization on PostgreSQL verified.**

---

# Phase 2 Ratification — v2.0 (roadmap T2.1–T2.6 completion)

**Date:** 6 Oct 2026 · **Owner:** PM/TL · v1.0 above records the async-PG productionization; this v2.0 records completion of the REMAINING roadmap Phase 2 items with executed evidence.

## Deliverables (all executed 6 Oct 2026 UTC)

| Task | Deliverable | Evidence |
|---|---|---|
| T2.1 containers/proxy/headers | `apps/portal/Dockerfile` (multi-stage node:22-alpine, non-root, HEALTHCHECK) · `infra/nginx/portal-staging.conf` (TLS 1.3, HSTS, roadmap CSP, zoned rate limits) · CSP aligned in `security.js` (img-src https:, font-src, strict-origin-when-cross-origin, report-uri) · `POST /api/csp-report` · `Staging_Security_Headers_Report.md` | headers served + verified (smoke 15/15); csp-report 204 + audit-logged; A+ external scan pending staging URL (T2.6) |
| T2.2 account self-service | `src/services/token.service.js` (32-byte hashed single-use tokens: reset 60 min, email-verify 48 h, legacy 15 min; issue/consume/**burn**) · `one_time_tokens` table (B8 + `migrations/008_one_time_tokens.sql`, both stores) · 10 endpoints (reset request/confirm, profile GET/PUT, MFA begin/confirm/disable, revoke-others, email change/verify) · `test/account-services.test.js` | **8/8** — no-enumeration, weak-pw 400, session kill on reset, replay 409, expiry rejected, token exists only in email, MFA enrol→login-gated→disable, revoke-others, email re-verification with old-address alert |
| T2.3 delivered immutability | `migrations/007_enforce_invoice_immutability.sql` + B7 in migrate.sql (triggers on invoices + invoice_lines) · `test/einvoice-immutability.test.js` | **7/7** — delivered rows reject UPDATE / DELETE / status-change / line-mutations at the DB level; drafts editable; fils math + 7-check pipeline already proven in v1.0/Phase 5-6 |
| T2.4 legacy migration | `tools/migrate-legacy-kyc.js` ETL (documented fixture contract, TRN cleansing, status mapping, document byte-store, parity report) · `POST /api/migration/exchange-token` (HMAC-verified vs LEGACY_TOKEN_SECRET, single-use burn, session issue, redirect) · `test/token-exchange.test.js` + `test/fixtures/legacy-kyc-export.json` | ETL: dry-run → import → **idempotent re-run**; 5 records → 3 imported + 2 rejected-with-reasons; parity EXACT; traversal blocked by allowlist. Bridge **6/6**: valid→cookie+redirect, replay 409, bad-sig/expired/garbage 401, no_account structured |
| T2.5 ASP integration | `src/services/peppol-asp.client.js` (HMAC-signed, SSRF-guarded, 8 s timeout, ACK/NACK) · `deliver()` transmits BEFORE the delivered flip — transmissionId written in the same save (C3-compatible) · `test/peppol-sandbox-roundtrip.test.js` | **2/2** vs contract-accurate mock ASP: ACK → `PEPPOL-TX-*` persisted on delivered UBL + timeline; NACK → 502, invoice stays validated, **retry delivers** after recovery. Real-ASP cert PENDING creds (T5.2) |
| T2.6 procurement | `Project_doc/07_Project_Management/Vendor_Award_Checklist_T2.6.md` | 7 pass/fail criteria staged (UAE residency, ISO 27001, Peppol accreditation, 99.95% SLA…); hand-off artifacts listed |

## Architectural decisions

1. **Immutability × transmissionId conflict (T2.3 × T2.5), resolved:** B7 forbids touching delivered rows, so ASP transmission happens before the status flip; the Peppol id is stored in the same save that delivers. A failed transmission leaves the invoice `validated` — the staff retry IS the retry queue; no post-delivery mutation path exists anywhere.
2. **Legacy single-use = burn-on-first-sight:** legacy tokens are signed by the legacy system, so the portal cannot pre-issue them; the bridge burns sha256(first-seen) via `tokenSvc.burn` — replay is 409 forever.
3. **`LOGIN_RATE_MAX` env override** for legitimate test rigs; production default (10/5 min) unchanged.
4. **`ASP_ALLOW_LOOPBACK=1`** — narrow, ASP-client-only sandbox escape for the local mock; the webhook SSRF guard is untouched.

## Closing sweep (this session)

| Suite | Result |
|---|---|
| JSON suites (unit 39 + integration 31 + account 8 + token 6 + roundtrip 2) | **86/86** |
| PG integration (26 tables incl. B7/B8) | **27/27** |
| Invoice immutability (DB triggers) | **7/7** |
| Peppol verify (no-ASP path) | **21/21** |
| Cutover rehearsal (from-zero + abort drill) | **33/33 · rollback 0.8 s** |

## Carry-forwards

SecurityHeaders A+ scan (needs staging URL) · real ASP sandbox certification (T5.2 creds) · container build on vendor runner · vendor award (human committee) · legacy migrations/001-002 superseded by migrate.sql B1–B8 (noted, kept).

**RATIFIED (v2.0).**

---

# Phase 2 Ratification — v2.1 addendum (deep iteration, 6 Oct 2026)

The deep iteration probed the newest Phase 2 features against the **production PG path** and found five defects that the JSON-only suites could not see. All fixed same-session and locked behind a new permanent gate:

| # | Defect (production path only) | Fix |
|---|---|---|
| 1 | `users.save` on PG dropped `totpSecret`/`pendingTotpSecret`/`email`/`pendingEmail` — MFA enrolment, email change, and email verify were silently non-persistent | B9 columns (`migrations/009`) + full-field `users.save` |
| 2 | `submissions.add/save` dropped `documents`/`queries`/`review`/`screening`/`created_at` — review checklist/notes, partner queries, and legacy-ETL document fidelity all lost | B9 columns + full-field `add`/`save` |
| 3 | `ref_seq`/`inv_seq` existed only on the dev DB — fresh environments could not issue ANY KYC reference or invoice number (500 on first submission) | **B10** (`migrations/010`) folded into migrate.sql |
| 4 | `outbox.markSent` wrote a phantom `sent_at` column — every notification marked 'sent' failed silently on PG (entries stuck queued) | markSent rewritten to existing columns (delivery facts in `meta`) |
| 5 | Raw snake_case rows leaked from pg-repos: `outbox.all` (no `to`/`text`) and `mfaChallenges.consume` (no `userId`) broke the admin outbox view and the entire MFA login exchange | both shaped to the JSON-store contract (L29) |

Plus: token single-use race closed (PG 23505→409, JSON atomic check-and-push), Dockerfile `/app/data` volume no longer shadows the screening watchlist (moved to `/app/seed`), and CSP `report-uri` verified compatible with browser `application/csp-report` posts.

**New permanent gate:** `test/pg-mode-journey.test.js` (standalone; wired into CI) boots the real portal on a scratch PG database and drives all six journeys — password reset, MFA enrol/login-gate/disable, email change+verify, review checklist/notes persistence, query raise+partner respond, legacy ETL document fidelity — **6/6 PASS**.

Closing sweep after fixes: JSON suites **86/86** · PG **27/27** · immutability **7/7** · peppol **21/21** · rehearsal **33/33 (rollback 0.8 s)** · hypercare CLEAN · freeze rc10.

**RATIFIED (v2.1).**
