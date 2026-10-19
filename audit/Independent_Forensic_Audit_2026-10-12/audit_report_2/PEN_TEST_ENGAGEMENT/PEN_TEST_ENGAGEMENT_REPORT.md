# Penetration Test — Engagement Report (SIMAL-PEN-2026-10-18)

**Engagement:** SIMAL-PEN-2026-10-18 · **Scope:** `PEN_TEST_COMMISSION_PACK.md` v1
**Date:** 2026-10-18 · **Client:** Simal Corporate Platform
**Testers:** three **independent verification agents** (`auth`, `kyc`, `cms`), each given only the
commission pack, the requirements baseline and the running application; instructed not to read the
implementation, the repository's tests, or the engineering team's own security suite, and not to
modify code. Evidence: `Codebase/scratch/pentest/<area>/` (findings.json, retest.json, raw captures).
**Why not a commercial firm:** contracting, authorising and paying an external security firm are
human/commercial acts outside this environment. This is the maximum independent execution available
here; the commercial retest remains the human step tracked in the pack's §8 checklist.

## 1. Executive result

| Area | Cases | First pass | After fixes | Retest |
|---|---:|---:|---:|---|
| AUTH (session, MFA, CSRF, limits, RBAC) | 76 | 69 PASS / 7 FAIL | 6 fixed + 1 redeploy | **7/7 PASS** |
| KYC (lifecycle, IDOR, signed URLs, uploads, PII, forms) | 46 | 36 PASS / 10 FAIL | 8 fixed, 1 accepted, 2 residuals fixed → re-verified | **9 PASS + 1 ACCEPTED** |
| CMS (RBAC, approval, injection, integrations, hygiene) | 36 | 33 PASS / 3 FAIL | 3 fixed (+2 functional observations fixed) | **3/3 PASS + 2 fixed** |
| **Total** | **158** | **138 / 20** | **19 fixed (6 high, 8 medium, 5 low) · 1 accepted** | **all retests green** |

Every finding (including the live duplicate LIVE-09) is imported into `FINDINGS_MATRIX.csv` as **PEN-2026-01 … PEN-2026-21** and appears on
`Codebase/remediation-board.csv` (generated, not hand-edited) with task, evidence and acceptance.
Regression tests: `apps/portal/test/integration/pen-regressions.test.js` (14 cases, finding IDs in
titles). Tracker tasks: `RM-PEN-01 … RM-PEN-21`.

## 2. Findings

| ID | Tester case | Sev | Finding | Fix | Retest |
|---|---|---|:---:|---|:---:|
| PEN-2026-07 | KYC-02 | **H** | `POST /api/public/drafts` with another party's email returned their draft id, resume token and stored PII | Resume requires the draft token (body or HttpOnly `kyc_draft` cookie); email alone creates a new draft | PASS |
| PEN-2026-08 | KYC-03 | **H** | Harvested token allowed overwriting another party's draft | Owner-token binding | PASS |
| PEN-2026-09 | KYC-04 | **H** | Harvested token allowed staging a document into another party's draft | Owner-token binding | PASS |
| PEN-2026-10 | KYC-26 | **H** | Reviewer without `view_pii` saw the raw TRN in the queue | Shared `domain/pii.js` masks `tin` in `review.list` | PASS |
| PEN-2026-11 | KYC-27 | **H** | Detail exposed raw TRN, tax/contact emails, phones, signatory/UBO emails+mobiles | Detail masks tax (incl. `tax_contact`), licence, every contact/signatory/UBO email+mobile, IBAN, IDs. A first retest still saw `ubos[].mobile` raw; that was fixed and the regression extended (retest residual closed) | PASS (after residual fix) |
| PEN-2026-05 | MFA-08 | **H** | Reviewer/viewer could log in password-only (GOV a16) | **Production boot refuses to start** with any active staff account lacking TOTP (`staffMissingMfa`; `STAFF_MFA_ENFORCED=false` to accept). Residual: no self-service enrollment UI (RTM DEV-05) | PASS (mitigated) |
| PEN-2026-01 | AUTHZ-12 / LIVE-09 / CMS-32 | M | Reviewer read telemetry, integration health and could reload screening | Gated to `view_pii`; CMS nav and router hide super_admin views; reviewer dashboard no longer treats restricted sources as failures; live portal redeployed | PASS |
| PEN-2026-02 | ENUM-02 | M | Login timing oracle (known email ~20× slower) | Dummy scrypt verify for absent accounts (ratio 1.06) | PASS |
| PEN-2026-03 | MFA-02 | M | Wrong TOTP → HTTP 500 (`mfaChallenges.fail` missing) | Controlled 401 + audit | PASS |
| PEN-2026-04 | MFA-06 | M | Used TOTP code replayable on a new challenge | Persisted `users.last_totp_step`; RFC 6238 §5.2 rejection (prod default) | PASS |
| PEN-2026-12 | KYC-37 | M | PG duplicate-TRN detection missed pending duplicates (NULL exclude, approved-only) | Correct query: `($2 IS NULL OR id<>$2)`, non-rejected | PASS |
| PEN-2026-17 | CMS-14 | M | Same-record content drift after an approval request was still published | Approval compares the dirty-set max audit timestamp; drift expires the stale request and returns 409 | PASS |
| PEN-2026-19 | CMS-36 | M | Missing media file crashed the portal (headers sent before the file check → `ERR_HTTP_HEADERS_SENT`) | Stream resolved first (404); catch guarded by `headersSent` | PASS |
| PEN-2026-20 | CMS obs. | M | Console posts `dataBase64`; server read `base64` → every UI media upload 400 | Server accepts both keys | PASS |
| PEN-2026-06 | CSRF-12 | L | `CSRF_STRICT` had no effect | Policy-B token requirement implemented for privileged writes; `;s*` sid regex fixed | PASS |
| PEN-2026-13 | KYC-40 | L | RFQ accepted an empty phone | Valid phone required (form already marked it) | PASS |
| PEN-2026-15 | KYC-43 | L | No honeypot on RFQ | Hidden field + silent simulated success (nothing persisted) | PASS |
| PEN-2026-16 | KYC-46 | L | KYC status lookup was a reference-existence oracle (403 vs 404) | Both cases 404 with identical body | PASS |
| PEN-2026-21 | CMS obs. | L | Per-revision Rollback always restored the newest snapshot | `revisionId` honoured by the API; UI sends the selected id | PASS |
| PEN-2026-14 | KYC-41 | L | RFQ reference format differs from the ratified baseline | **Accepted** — as-built format is tested and referenced by UAT; baseline amendment tracked as RTM DEV-01 | ACCEPTED |

## 3. Controls the testers confirmed held

- RBAC: anonymous 401; viewer/partner 403 across all admin/CMS collections and writes; reviewer
  denied user/settings/trust ops.
- Signed URLs: single-use (409), expiry (401), cross-document (403), tampering (401), 10 parallel
  fetches → exactly one 200.
- Upload safety: magic-byte sniffing, size caps, extension allowlist, EICAR/clamd path, traversal
  refused.
- Dual approval: 202 pending with no build; requester and same-user second session 403; distinct
  super_admin approving enqueues exactly one build; reject/expiry/item-set drift 409; emergency
  override super_admin-only.
- Injection: 55+ SQLi probes with no 5xx/leak; all `javascript:`/`data:`/`//host`/control variants
  422 on every URL write path; stored HTML escaped.
- Integrations: unsigned/bad-HMAC/body-only/stale/future bounce → 403; fresh bound signature → 200;
  wrong master token 401; observability endpoints staff-gated.
- Hygiene: nosniff, `frame-ancestors 'none'`, `script-src 'self'`, no `X-Powered-By`, generic 500s
  with request ids, 413/415 enforcement.
- Rate tiers: forms 5/10 min, reads 120/min, status 20/min, staff 300/min, login 5→15 min lockout.

## 4. Residual risks (accepted, with owners)

1. **MFA-08 / RTM DEV-05** — production is fail-closed for non-MFA staff, but there is no self-service
   enrollment screen yet, and the dev rig runs password-only. Owner: Platform Eng; acceptance: staff
   enroll via UI, then `STAFF_MFA_ENFORCED` remains default.
2. **KYC-41 / RTM DEV-01** — RFQ reference format: baseline amendment required (as-built is tested).
3. **Excess PII keys** — the submission API accepts extra keys inside signatory/UBO objects (e.g. `mobile`); masking now covers them, but input schemas should whitelist fields at the boundary (product hardening, low).
3. **CSRF token model** — a valid token remains bearer-capable; `SameSite=Strict`, no CORS headers and
   origin checks mitigate theft. Strict mode is available (`CSRF_STRICT=true`).
4. **Media filesystem errors** — only ENOENT classes were exercised; EACCES/racing deletes rely on the
   same pre-header path and the guarded process handler.

## 5. Evidence index

- Auth: `scratch/pentest/auth/{findings.json,retest.json,evidence/*}`
- KYC: `scratch/pentest/kyc/{findings.json,retest.json,evidence/*}`
- CMS: `scratch/pentest/cms/{findings.json,retest.json,evidence/*}`
- Board: `Codebase/remediation-board.csv` (PEN-2026-* rows) · Matrix: `FINDINGS_MATRIX.csv`
- Regression: `apps/portal/test/integration/pen-regressions.test.js`
- Engagement record + brief: this folder (`ENGAGEMENT_RECORD.md`, `TESTER_BRIEF.md`)

## 5b. Post-engagement corrections (deployment-readiness audit, 2026-10-18)

The tester output above is unchanged. The deploy-audit ledger
(`Codebase/scratch/rm-evidence/deploy-audit/FINDINGS.md`) later showed that four of the "fixed"
rows did not fully hold; each is re-fixed and the board rows carry the note:

| Finding | What the ledger found | Re-fix / proof |
|---|---|---|
| PEN-2026-05 (MFA-08) | Enforcement was boot-only: staff accounts created, promoted or with MFA disabled after boot used staff routes password-only (D31). Residual risk 1's "no self-service enrollment screen" was closed in rm 10.4-1. | `3fba62a` — `requireStaff` per request + no staff MFA disable in production; `test/unit/staff-mfa-enforced.test.js` |
| PEN-2026-21 | "UI sends the selected id" did not hold: every Rollback button sent `body {}` and restored the newest snapshot (D07). | `197ad47` — gate `cms-integrity` |
| PEN-2026-20 | Uploads were accepted but copied to a stray `Codebase/site/` and never reached the site (D09). | `197ad47` — `cms-integrity` asserts uploads reach the site |
| PEN-2026-01 | The super_admin-only gate read `state.me.user.role`, so no account — super_admin included — could open Telemetry, Users or Sessions (D53). | `dc73f1f` — `test-cms-buttons` asserts each view opens |

The same audit also found the legacy token exchange (`/api/migration/exchange-token`) issued a
session for any role, super_admin included, with no password or TOTP (D30) — now partner-only.

## 6. Sign-off

Independent testers: 3 isolated agents (IDs recorded in the engagement harness).
Engineering triage + fixes: Platform Engineering, 2026-10-18.
**Human steering sign-off remains pending (roadmap 10.4-3) — this report is tester output plus
engineering triage, not a commercial retest letter.**
