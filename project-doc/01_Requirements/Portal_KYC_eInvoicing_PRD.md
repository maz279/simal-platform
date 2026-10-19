# Portal PRD — KYC & e-Invoicing (merged)

**Doc ID:** A6 · **Version:** 2.0 (audited & enhanced) · **Date:** 5 Oct 2026 · **Owner:** PM
Merges `simal_kyc/PRD_Simal_KYC_Portal_v1.1.md` with the e-invoicing module shipped 5 Oct 2026 in `portal/`. Audit basis: PRD best practice — measurable NFRs + testable acceptance criteria per requirement group ([Jama](https://www.jamasoftware.com), [AltexSoft](https://www.altexsoft.com)).

## 1. Product definition

One Simal platform, **two portals on one backend**:
- **Partner portal (customers & vendors):** KYC onboarding, status tracking, e-invoice issuing, profile self-service.
- **Staff portal (Simal):** KYC review console, e-invoice validation & delivery console, outbox, reports.

Positioning rule (management correction 3 Oct 2026): Simal Technologies ME LLC is fully independent; Unisoft Systems Ltd (Dhaka) is the **software delivery partner** — "Simal's software solution services, engineered with Unisoft". Never "sister concern".

## 2. Actors

| Actor | Auth | Capabilities |
|---|---|---|
| Vendor / customer (partner) | email + password (auto-provisioned at KYC approval; temp password via email/outbox) | Submit KYC, answer queries, track status; create/edit/submit invoices; view UBL; **manage own profile (name, password) and request email change** |
| Reviewer (staff) | password (+TOTP optional) | KYC queue, start/approve/reject/hold, queries, notes; invoice validate/deliver/reject/reopen |
| Viewer (staff) | password | Read-only both consoles |
| Super admin | password + TOTP | All + reopen approved, PII unmask, settings, user administration, audit |
| System | — | Screening, webhooks, notifications, partner provisioning, maintenance purges |

## 3. KYC scope (carried from v1.1 — unchanged) — **AC = acceptance criteria (verified by D3 tests)**

Workflow `draft→submitted→under_review→{query_raised⇄partner_updated}|on_hold→approved|rejected` (+super-admin reopen) — AC: illegal transitions 409. Draft tokens (48-hex) with autosave/resume — AC: two-session resume e2e (UAT 5). Document upload magic-byte validation — AC: wrong-type rejected (UAT 5). Watchlist screening exact + normalized — AC: unit suite. RBAC matrix + PII masking — AC: masked by default; unmask gated. Audit on every state change — AC: timeline/audit rows present. Invite codes; master-data integration feed (token, timing-safe).

## 4. e-Invoicing scope (as built in `einvoice.service.js`) — no deviation

| Area | Requirement | AC (evidence today) |
|---|---|---|
| Money | Integer **fils**; VAT 5% per line, half-up; no floats | edge ledger green (1-fils, per-line) |
| Lifecycle | `draft→submitted→validated→delivered\|rejected→reopen` | illegal transitions 409 (tested) |
| Numbering | `SIM-INV-YYYY-NNNN`, **sequential, server-issued, unique** (never client-assigned; gaps only from DB transactions, never reuse) | uniqueness assertion + unique index (B4) |
| Buyer identity | 15-digit TRN; `0235:<TRN>` endpoint; must match approved KYC | check #4 (fails otherwise — tested) |
| Validation | 7 checks (stable order, B5) | e2e validated 7/7 |
| Tamper guard | totals recomputed at submit + validate | 422 + corrected (tested) |
| Export | UBL 2.1 stamped at delivery | e2e UBL IDs |
| Cancellation | Phase 1 semantics: **rejected** (pre-delivery) or **reopen** (post-delivery edit cycle); true cancellation/credit-note = Phase-1.1 `invoiceTypeCode 381` | state machine as built |
| Provisioning | partner login auto-created on approval; temp password emailed | e2e provisioning |
| Isolation | partner sees own invoices only | 403 cross-partner (tested) |

## 5. Account services (gap fix — prototype UI already promises these)

| Requirement | AC |
|---|---|
| Password reset ("forgot password" link exists in prototype + portal login) | emailed one-time token, 60-min expiry, single use; session invalidation on change |
| Email verification on partner account creation | temp-password flow counts as verified channel; explicit verify on later email changes |
| Partner profile self-service | change name/password in-portal; email change = re-verify + staff notification |
| Session security | idle 20 min, absolute 12 h, HttpOnly SameSite=Strict (as built) |

## 6. Non-functional requirements (measurable — NFR audit gap fix)

| NFR | Target | Verified by |
|---|---|---|
| Availability | portal ≥ 99.5% / static ≥ 99.9% monthly | F2 report, E5 probes |
| Performance | API p95 < 200 ms read / < 400 ms invoice-validate @ 50 rps | D4 load runs |
| Security | OWASP ASVS L2 controls pass; CSP/nosniff/DENY on 100% routes | D5 + CI header check |
| Data integrity | zero float currency; totals recompute-verified | CI edge ledger |
| Recoverability | RPO ≤ 24 h (+WAL ≤ 5 min), RTO ≤ 4 h site / 8 h portal | E4 drills |
| Observability | 100% requests carry request-id; SEV alerts routed per E5 | E5 canary |
| Language scope | **Portal Phase 1 = EN only; AR/RTL = Phase-1.1** (site AR per URD) — explicit to prevent scope drift | UAT 25 covers site RTL only |

## 7. Compliance anchors

PDPL 45/2021 (C1); FTA e-invoicing Phase 1 **1 Jan 2027** (C2); AE IBAN 23 chars; TRN 15 digits.

## 8. Non-goals (Phase 1)

Multi-currency, credit notes (reserved 381), direct ASP peering (via accredited ASP), inbound invoice console (Phase-1.1), RFQ→invoice auto-conversion — **linkage note:** production RFQ refs (`SIMAL-RFQ-YYYYMMDD-NNNN`) may be cited in `poRef` manually; automated RFQ→invoice = Phase-1.1 backlog.

## 9. KPIs (measured via H3 events)

KYC decision ≤ 2 business days · invoice validation ≤ 1 business day · zero validation overrides without logged reason · partner login success ≥ 99% of attempts (excluding lockouts).

## 10. Status log

| Date | Event |
|---|---|
| 2026-10-05 | v1.0 merged baseline |
| 2026-10-05 | **v2.0 audit:** +NFR table (measurable), +acceptance criteria per scope group, +account services (password reset/verification/profile — gap: prototype UI promised, PRD omitted), +partner profile self-service, invoice numbering & cancellation semantics, explicit portal language scope, RFQ→invoice linkage note |
