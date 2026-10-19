# DPIA — UAE Personal Data Protection Law (PDPL)

**Doc ID:** C1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** SEC · Legal basis: Federal Decree-Law No. 45 of 2021

## 1. Processing purposes & lawful basis

| Purpose | Data (PII flags per A7) | Lawful basis |
|---|---|---|
| RFQ quotation | email **P**, items | Contract initiation (legitimate: quote request) |
| KYC onboarding & screening | company + signatory/UBO names, EIDs, mobiles **S**, IBAN **S**, documents | Legal obligation (AML/customs/trade) + contract |
| e-Invoicing | buyer TIN (corporate), partner email **P**, amounts | Legal obligation (FTA e-invoicing Phase 1) |
| Account/session | email **P**, hash, TOTP secret **S** | Contract/security (legitimate interest) |
| Newsletter | email **P** | **Consent** — double opt-in, one-click out |
| Analytics | pseudonymous events | Consent-gated (Cookie Policy) |

## 2. Data flows

Collected in browser → UAE-region origin (ADR-9) → PostgreSQL + object storage (documents) → email provider (notifications) → ASP (invoice UBL to counterparty — corporate data, no personal data beyond corporate contact already in invoice) → analytics (hashed email only). **Cross-border transfers:** email provider/ASP may process outside UAE → addressed in C5 DPAs + transfer clauses; documents stay in object storage (UAE region).

## 3. Risk table

| Risk | L | I | Mitigation |
|---|---|---|---|
| Excessive collection | M | M | Data dictionary A7 frozen; forms collect purpose-minimum (validated) |
| Unauthorized access to KYC docs | L | H | Object storage private + magic-byte validation; PII masking by default; `view_pii` super-admin gate |
| Cross-partner leakage | L | H | Partner scope guard (tested 403); sessions strict |
| Retention overreach | M | M | C3 schedule automated |
| Breach notification failure | L | H | §6 path below; E5 alerting; runbook in F1 |
| Webhook data over-exposure | M | M | INT-3 signed + SSRF-guarded; masked IBAN default |

## 4. Data-subject rights support

Access/rectification: partner edits profile + draft KYC; staff corrections audited. Erasure: per C3 (subject to legal-obligation retention for KYC/invoices). Portability: RFQ/KYC export exists (admin CSV). Complaints: privacy contact (legal page).

## 5. Children's data — none processed (B2B only).

## 6. Breach notification path

Detect (E5 alert) → contain (F1 runbook) → assess severity vs PDPL thresholds → notify UAE data office + affected individuals within statutory window → post-incident review (F3 template). Owner: SEC with PM.

## 8. Audit v2.0 additions (researched PDPL practice)

1. **Breach timeline fixed (was vague):** notify the **UAE Data Office within 72 hours** of awareness where feasible; data subjects notified without undue delay where privacy/confidentiality/security is prejudiced ([Multilaw](https://www.multilaw.com/Multilaw/Multilaw/Data_Protection_Laws_Guide/DataProtection_Guide_United_Arab_Emirates.aspx), Arts. 20–21). F1 runbook + E5 alert thresholds set accordingly (detection→SEC ≤ 1 h).
2. **RoPA (Records of Processing Activities):** PDPL requires controllers **and** processors to maintain records — §1 of this DPIA is the seed; formal RoPA artifact maintained by SEC, reviewed each phase gate + annually ([Two Birds comparison](https://www.twobirds.com/en/insights/2021/uae/how-does-the-new-uae-federal-decree-law-on-personal-data-protection-compare-against-the-gdpr)).
3. **DPO:** appoint/confirm a Data Protection Officer contact before production data (SEC role holder named in C5 sign-off).
4. **Legitimate-interest assessments:** logged for request logs (security) and pseudonymous analytics — balancing test filed with RoPA.
5. **DPIA review cadence:** at every phase gate (G1) and annually; any new data flow (e.g., INT-5 inbound invoices Phase-1.1) triggers re-assessment before activation.
6. **Regulatory caveat:** PDPL Executive Regulations remained outstanding at drafting — SEC verifies current UAEDO guidance at P2 sign-off and before go-live; free-zone regimes (DIFC/ADGM) checked if any processor resides there ([DLA Piper](https://www.dlapiperdataprotection.com/countries/uae/general/law.html)).

## 9. Sign-off

| Role | Name | Date |
|---|---|---|
| DPO/compliance | ______ | ____ |
| PM | ______ | ____ |

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 for P2 sign-off (G1 gate: precedes production data) |
| 2026-10-05 | **v2.0 audit:** 72-h breach clock fixed, +RoPA, +DPO, +LIA for logs/analytics, +review cadence, +Executive-Regulations caveat |
