# Peppol e-Invoicing Compliance Matrix — UAE Phase 1

**Doc ID:** C2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM · Mandate: FTA e-invoicing Phase 1, **1 Jan 2027**

## 1. Obligation → control mapping (system-verified where marked ✔)

| # | Obligation (Phase 1 scope) | Control in our build | Evidence |
|---|---|---|---|
| O1 | Structured e-invoice (not PDF) | UBL 2.1 envelope, invoiceTypeCode 388 | ✔ e2e test: UBL carried on delivery |
| O2 | Party addressing by TRN, Peppol scheme `0235` | `endpointID 0235:<TRN>` both parties; buyer prefix generated server-side | ✔ validation check #3; e2e UBL IDs |
| O3 | Valid buyer identity | 15-digit TRN **must match approved KYC** | ✔ check #4 (fails without approved KYC) |
| O4 | Line-level VAT 5% | Integer fils math, half-up per line | ✔ edge-case tests (1-fils, per-line rounding) |
| O5 | Totals integrity | Server recompute at submit + validate; tamper → 422 | ✔ audit iteration 2 |
| O6 | Auditability | timeline[] + audit_log per transition; refs `SIM-INV-YYYY-NNNN` unique | ✔ |
| O7 | Exchange via accredited channel | ASP integration (INT-5) | 🔶 P3 build — ASP onboarding below |
| O8 | Seller registration | Simal TIN + `0235:` endpoint in settings (seeded from env) | ✔ settings |

## 2. ASP onboarding plan (critical path — risk R1)

1. **P2 week 1:** shortlist accredited ASPs (criteria: UAE support hours, per-document pricing, UBL 2.1 conformity certificate, sandbox access).
2. **P2 week 2–3:** sandbox integration (INT-5 out path), test invoice round-trip to ASP test endpoint.
3. **P3:** production credentials; register Simal endpoint `0235:<simalTin>`; exchange test invoices with 2 friendly counterparties.
4. **P4:** top-20 counterparty Peppol-ID collection campaign (from KYC tax data).
5. **Fallback (if accreditation slips):** deliver compliant UBL via agreed B2B channels + manual ASP submission for top counterparties — decision point 1 Oct 2027-90d.

## 3. UBL field checklist (our envelope)

id (ref) · issueDate · dueDate · currencyCode AED · customisationID `urn:simal:invoice:phase1:ae` · supplier/customer partyName + endpointID + schemeID 0235 + taxScheme ARE · lines: description, quantity, unitPrice, baseAmount, vatRatePct 5, taxAmount, lineTotal · totals net/vat/payable · kyc.reference. (Future: ATCUD code, credit notes via invoiceTypeCode 381 — Phase 1.1, non-goal now.)

## 4. Counterparty readiness

Buyers must themselves be Peppol-registered to receive; our KYC captures peppol_id, and check O3 + master feed (INT-4) expose readiness to the ERP side.

## 5. Audit v2.0 — date-anchored onboarding & conformance

Replaces the vague "1 Oct 2027-90d" decision point (discrepancy: plan v2.0 go-live is 4 Dec 2026):

| Milestone | Date (2026) | Gate |
|---|---|---|
| ASP shortlist + sandbox started | 16 Oct (P1) | R1 trigger if not started |
| Sandbox UBL round-trip PASS | **30 Oct** | hard gate to P2 exit |
| Production creds + endpoint registered | **20 Nov** | blocks go/no-go |
| Live exchange with ≥ 2 counterparties | **24 Dec** | before mandate; consumes buffer if late |
| Manual-fallback decision point | **27 Nov** | plan §6 compressed-launch option |

Additional items: **PKI/signing** — Peppol transmission signing is ASP-managed; we sign nothing ourselves Phase 1 (documented dependency). **Conformance:** validate our UBL subset against **Peppol BIS Billing 3.0** profile during P3 (gap check; add missing optional elements only if ASP requires). **ATCUD/QR:** monitored for Phase-2 FTA scope; not in Phase 1.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — 6/8 obligations system-verified today; O7 on plan |
| 2026-10-05 | **v2.0 audit:** date-anchored ASP milestones (sandbox 30 Oct / creds 20 Nov / live 24 Dec); +PKI signing note, +BIS 3.0 conformance check, +ATCUD/QR Phase-2 watch |
