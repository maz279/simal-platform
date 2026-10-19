# Simal Corporate Platform: Reconciled Requirements Baseline (P9-1 / GOV-1)

**Canonical Master Document:** [`Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md`](file:///F:/software_project/Sofoware_project_04/Simal_Corporate_website/Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md)  
**Engineering Path:** [`Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md`](file:///F:/software_project/Sofoware_project_04/Simal_Corporate_website/Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md)  
**Status:** RATIFIED & AUTHORITATIVE (v3.0)  
**Effective Date:** 2026-10-14  

---

> [!IMPORTANT]
> **GOVERNANCE STATUS: RATIFIED MASTER BASELINE**
> This document confirms that the single unified requirements baseline resolving all 45 contradictions (a1..a45) from the Independent Forensic Audit (2026-10-12) has been formally ratified.
> For the complete exhaustive 45-point matrix, please refer to [`GOVERNANCE_REQUIREMENTS_BASELINE.md`](file:///F:/software_project/Sofoware_project_04/Simal_Corporate_website/Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md).

### Summary of Authoritative Parameters
1. **Tech Stack:** Astro 5 SSG (`apps/site`) + Node.js 22 LTS microservice gateway (`apps/portal`) + PostgreSQL 16.9 relational engine + Bespoke Simal Content Studio (Fluent UI Theme). (Ratified in ADR-009 / ADR-14).
2. **Active Brands:** Exactly 22 authorized commercial brands.
3. **Active SKUs:** Exactly 78 hardware SKUs.
4. **Numbering Formats:** RFQ: `RFQ-YYYY-NNNNN`; KYC: `SIM-KYC-YYYY-NNNNN`.
5. **KYC Workflow:** 3 visual wizard steps; 2 business tracks (`customer` / `vendor`); state machine: `draft` → `submitted` → `under_review` ⇄ `query_raised` (`partner_updated`) → `approved` / `rejected`.
6. **Authentication & Security:** Mandatory RFC 6238 TOTP MFA in production for all staff; scrypt key derivation (RFC 7914); 20 min idle timeout / 12 h absolute session cap; 5 failed attempts → 15-minute lockout.
7. **Accessibility & Quality:** WCAG 2.2 Level AA target; 99.9% uptime SLA; RPO ≤ 1 hour / RTO ≤ 4 hours.
8. **E-Invoicing & Peppol:** Phase 1 UBL 2.1 PINT AE generation & Sandbox validation live; ASP appointment deadline **30 October 2026**; mandatory FTA live exchange **1 January 2027**.
9. **Content Governance:** Dual approval required for pricing claims, statutory compliance dates, and brand authorization wording (`approved_by != author_id`). 10 rolling revisions with 1-click rollback.
