# Penetration Test — Commission Pack & Scope (P10-2 / rm(10.3-1))

**Document:** SIMAL-PENTEST-SCOPE-v1 · **Date:** 2026-10-18 · **Status:** ready to issue — engagement not yet contracted
**Owner:** Platform Engineering · **Commissioned by:** [steering sign-off block, rm(10.4-3)]
**Companion:** `Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md` (v3.0) · roadmap `IMPLEMENTATION_ROADMAP_CLEAN_AUDIT.md` 10.3-1

> **Status honesty.** The roadmap's 10.3-1 is "commission the pen test". A contract with an
> external tester is a human/commercial action; this pack is the complete, tested scope the
> tester is engaged against. Until the engagement starts, the same matrix is executed
> internally by `scripts/ci/security-verification.mjs` (**26/26 PASS**, evidence
> `Codebase/scratch/rm-evidence/10.3-security-verification.log`) — a pre-engagement gate,
> not a substitute for independent testing.

---

## 1. Objective

Independently verify that the controls delivered in remediation Phases 2, 3 and 7.3 hold under
adversarial testing, and that no new Critical/High/Medium finding exists. **Exit criterion:**
zero open Critical/High/Medium findings; every finding tracked with ID, evidence, task and
acceptance.

## 2. Scope — surfaces, controls, and what "pass" means

Every row maps to a requirement in the ratified baseline (§3) and to the internal case that
pre-verified it.

### 2.1 Authentication & session (Phase 2)
| # | Surface / attack | Expected control | Internal case |
|---|---|---|---|
| A1 | Unauthenticated access to `/api/admin/*`, `/api/cms/*`, `/api/einvoice/admin/*` | 401 everywhere | A1 |
| A2 | Vertical privilege escalation: viewer → super-admin trust ops (users, observability, webhook signing) | 403 | A2 |
| A3 | Reviewer → super-admin trust ops | 403 | A3 |
| A4 | Credential brute force | 5 consecutive failures per account+IP / 10 min → 15-min lockout (GOV a20); HTTP 429 | A4 |
| A5 | Session handling | HttpOnly + SameSite cookie; logout invalidates; no session fixation | A5 |
| A6 | Account enumeration via password reset | identical response for known/unknown | A6 |
| A7 | MFA bypass | wrong TOTP rejected; challenge single-use; no session before MFA | api.test.js "bad MFA code"; **gap note G-1** |
| A8 | Rate-limit evasion (proxy headers) | `X-Forwarded-For` honoured only from trusted proxies; nginx edge zone | 9.4 transcript |

### 2.2 CSRF (Phase 2)
| # | Attack | Expected | Case |
|---|---|---|---|
| B1 | Cross-origin POST, no token | 403 | B1 |
| B2 | Cross-origin POST, forged token | 403 (token is verified, not just present) | B2 |
| B3 | Same-origin/own valid token | accepted | B3 |
| B4 | Missing `sec-fetch-site`/`Origin` (non-browser client) | same-site policy applied; state-changing requests still require a valid session; strict mode (`CSRF_STRICT`) available | B1–B3 |

### 2.3 KYC lifecycle, documents, signed URLs, uploads (Phases 2/7.2/8.1)
| # | Attack | Expected | Case |
|---|---|---|---|
| C1 | IDOR: reviewer without `view_pii` reads an unassigned submission document | 403 | C1 |
| C2 | BOLA: partner reads another party's document | 403 | C2 |
| C3 | Signed URL for document A replayed on document B | 403 | C3 |
| C4 | Signed URL expiry / reuse / parallel race | 401 / 409 / exactly one 200 | doc-signed-urls.test.js (JSON+PG) |
| C5 | Upload with a spoofed extension | magic-byte sniff rejects | D4 |
| C6 | Malware upload | ClamAV engine rejects (EICAR named `.pdf`), audit row | 8.1-1 evidence |
| C7 | Path traversal via doc/media paths | 400/403/404, no file read | D3 |
| C8 | KYC status/queue data exposure | masked TRN/IBAN/email for non-`view_pii` | 2.2-2 |
| C9 | Lifecycle state machine abuse (approve from `submitted`, reject without reason) | 409 / 400 | api.test.js "workflow guards" |

### 2.4 CMS & publish pipeline (Phases 3/4/7.3)
| # | Attack | Expected | Case |
|---|---|---|---|
| D1 | SQL injection in filters/search/paths | parameterised, no 500, no leak | D1 |
| D2 | Stored XSS via CMS text and hrefs | URL writes 422; text rendered escaped (Astro + `esc`) | D2 + 3.1/3.2 tests |
| D3 | CSP bypass / inline script | `script-src 'self'`, 0 inline executable scripts | 3.3 gates |
| D4 | Publish approval bypass (self-approval, second session, drift, emergency override) | 202 pending; 403/403/409/403 | E1–E4 |
| D5 | Mass assignment on CMS entities | validated/dropped unknown fields | unit content-governance |
| D6 | Media upload to the webroot | staged outside docroot, served via controlled route | 4.4 evidence |
| D7 | Rollback restoring hostile URLs | 422 | cms-url-guard.test.js |

### 2.5 Integrations & observability endpoints (Phase 2)
| # | Attack | Expected | Case |
|---|---|---|---|
| F1 | Forged bounce webhook (unsigned / wrong HMAC / stale timestamp / unbound signature) | 403; raw-body HMAC bound to a 5-min timestamp (replay window) | F1 |
| F2 | Integration master feed with a wrong token | 401 | F2 |
| F3 | Observability read/sign endpoints from viewer/reviewer | 403 | A2/A3 |
| F4 | Webhook SSRF (outbound ERP URL) | allowlist/HTTPS enforcement per `webhooks.service` | unit ssrf-screening |

### 2.6 API & transport hygiene
| # | Check | Expected | Case |
|---|---|---|---|
| G1 | 5xx body leakage | no stack/SQL/driver text; requestId present | G1 |
| G2 | Security headers | nosniff, frame-ancestors CSP, no X-Powered-By; HSTS/TLS at the edge | G2 |
| G3 | Error contract | `{error, requestId, details?}` (as-built; baseline a33 deviation recorded in the RTM) | G1 |
| G4 | Rate tiers | forms 5/10 min; public reads 120/min; status poll 20/min; staff 300/min | H1/H2 + 9.4 |

## 3. Requirements covered
GOV-REQ-BASELINE v3.0 rows: a16 (MFA), a18 (scrypt), a19 (sessions), a20 (lockout),
a21 (rate tiers), a23 (WCAG 2.2 AA), a32 (RFQ), a33 (API conventions), a35 (CMS workflow),
a36 (RBAC), a43 (TRN), plus SEC-6/7/11/13 and F-2026-N02/N04/N08/N09/N10/N12.

## 4. Out of scope
- Denial of service beyond the rate-limit probes (no load testing).
- Social engineering, physical access, supply-chain attacks on npm/postgres binaries.
- Live ASP/Peppol network (sandbox only; production transmission starts 2027-01-01).
- Third-party hosting/cloud configuration (no cloud account exists on the rig).

## 5. Rules of engagement
1. **No production data.** Test against a scratch database seeded from `scripts/migrate.sql` +
   `scripts/seed.sql`; the tester receives two staff accounts (super_admin, reviewer), a viewer
   and a self-registered partner.
2. **Restore after writes.** CMS edits must be restored; publishing is allowed only on the
   scratch instance.
3. **Rate limits are ON** for the form/login tiers; the tester may reset the scratch instance
   between runs (`BRINGUP_ALLOW_RESET=1`).
4. **Evidence per finding:** request/response capture, timestamp, requestId, severity (CVSS 3.1).
5. **No destructive database commands** against the shared rig; the scratch DB only.

## 6. Findings intake (joins this roadmap's discipline)
Every finding becomes a board row:
```
ID:        PEN-2026-<n>            (audit_report_2/FINDINGS_MATRIX.csv + board)
Severity:  Critical | High | Medium | Low (CVSS 3.1 vector)
Surface:   A/B/C/D/F/G row + endpoint
Evidence:  scratch/rm-evidence/pentest/<id>-{request,response}.txt
Task:      RM-PEN-<n> (roadmap task format, snippet + Done-when)
Acceptance: exact HTTP assertions + regression test committed under apps/portal/test/
```
Findings are triaged within 2 business days; Critical/High block the clean-audit gate.

## 7. Deliverables from the tester
1. Report: executive summary, methodology, findings by severity, CVSS vectors, reproduction steps.
2. Retest letter after fixes (zero open Critical/High/Medium).
3. Signed scope/authorization (template below).

## 8. Commissioning checklist (human actions)
- [ ] Named tester/firm selected; NDA + authorization-to-test signed.
- [ ] Test window agreed (recommended: after 10.4-2 readiness pack).
- [ ] Scratch environment URL + accounts delivered (no real PII).
- [ ] Findings imported into the board via §6.
- [ ] Retest scheduled; report attached to `audit_report_2/`.

## 9. Internal pre-engagement result (this session)
```
node scripts/ci/security-verification.mjs
26/26 cases PASS — auth (6), CSRF (3), IDOR/BOLA (3), injection/URLs/uploads (4),
approval workflow (4), integrations (2), response hygiene (2), strict rate tiers (2).
```
This pass **found and fixed one real defect**: the inbound bounce webhook accepted a signature
over the parsed body with no timestamp binding, so a captured request could be replayed
indefinitely. It is now `HMAC(secret, ts + '.' + rawBody)` with a 5-minute window
(`routes.js`), covered by the api suite and case F1.
