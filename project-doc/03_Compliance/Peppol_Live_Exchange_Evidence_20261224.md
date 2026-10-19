# Peppol Live Exchange Evidence — Target 24 December 2026

**Doc ID:** C2-PLX · **Task:** T8.2 · **Exit criterion:** live structured e-invoice exchange verified with **≥ 2 production counterparties before 24 Dec 2026** (roadmap C2) · **Machine rig:** `Codebase/scripts/peppol-verify.js` → `Codebase/scripts/peppol-verify-results.json`

---

> [!IMPORTANT]
> **GOVERNANCE STATUS: UNEXECUTED PLANNING TEMPLATE / REHEARSAL RECORD ONLY (P9-3 / GOV-3, GOV-5)**
> This document is a forward-dated pre-cutover compliance verification template. It does NOT assert that live exchange has occurred. Live structured e-invoicing exchange with external commercial counterparties remains a future operational milestone dependent upon production Accredited Service Provider (ASP) onboarding.
> 
> **Statutory Regulatory Milestones (Aligned per Ministerial Decision No. 244):**
> - **ASP Appointment Statutory Deadline (Revenue ≥ AED 50M):** **30 October 2026** (extended by UAE Ministry of Finance).
> - **ASP Production Credentials Integration Gate:** **20 November 2026**.
> - **Target Live Counterparty Exchange Rehearsal:** **24 December 2026**.
> - **Mandatory Phase 1 Live Peppol Exchange Mandate:** **1 January 2027**.

---

## 1. What is machine-proven (sandbox, real service code — 21/21 PASS, 6 Oct 2026)

The complete production invoice journey executes end-to-end on the real portal code:

| Stage | Evidence |
|---|---|
| Counterparty onboarding | Seller + buyer KYC submitted → staff-approved → partner account auto-provisioned (temp credential issued via outbox email, `Simal-<8hex>` format) |
| Partner authentication | Partner signs in with the provisioned credential (role `partner`) |
| Invoice create → submit | `SIM-INV-2026-5001`, 2 lines, AED, due-date ≥ issue-date |
| Staff validation (7 checks) | Passed server-side; totals recomputed by the authority |
| Delivery (Peppol path) | Status `delivered`; UBL generated |
| **PEPPOL BIS Billing 3.0 structure** | UBL 2.1 · customisation ID · type code **388** · supplier endpoint `0235:` scheme · **buyer endpoint exact `0235:<TRN>`** (`0235:100123456700090` at run) · currency AED · ISO dates |
| Money integrity | Line-level fils math (`floor((net×5+50)/100)` VAT) exact; totals net 2663.50 + VAT 133.18 = payable 2796.68 — integer fils throughout (ADR-5) |
| Receipt trail | Timeline carries the delivery event with actor + timestamp (the receipt-recording path the ASP MLR will write into) |

## 2. What remains for the 24 Dec gate (external, honest)

| Item | Dependency |
|---|---|
| ASP production credentials | T5.2 — 20 Nov gate (PM) |
| Live transmission via production Access Point | credentials above |
| ≥ 2 real commercial counterparties (pre-selected enterprise resellers on Peppol) | Compliance coordination |
| MLR + transmission receipt IDs recorded in database | after first live sends |

## 3. Procedure on the day (per counterparty)

1. Confirm counterparties' Peppol endpoint IDs (`0235:<partner TRN>`) against their KYC records.
2. Create + approve their KYC (if not already), provision partner accounts.
3. Issue a real commercial invoice → submit → validate → deliver via production ASP.
4. Capture the MLR and transmission receipt ID into the invoice timeline; attach below.

## 4. Live exchange record (fill as transmissions complete)

| # | Date | Counterparty | Endpoint ID | Invoice ref | Transmission ID | MLR | Result |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |

**Gate: row 2 complete with positive MLRs = T8.2 exit.**
