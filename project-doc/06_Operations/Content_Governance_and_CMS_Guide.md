# Content Governance & CMS Guide

**Doc ID:** F4 · **Version:** 3.0 · **Date:** 14 Oct 2026 · **Owner:** CM · **Master Policy Reference:** [`docs/CONTENT_GOVERNANCE_POLICY.md`](file:///F:/software_project/Sofoware_project_04/Simal_Corporate_website/Codebase/docs/CONTENT_GOVERNANCE_POLICY.md) (SEC-11 / FRS-RC-11/F4)

---

> [!IMPORTANT]
> **GOVERNANCE MANDATE: DUAL-APPROVAL WORKFLOW (SEC-11 / P9-4)**
> In conformance with the ratified Content Governance Policy, all modifications to **pricing claims (`erp/pricing`), brand authorization claims (`claims-register`, `brand-auth`), and statutory compliance/Peppol dates** require mandatory dual-approval. No sensitive change can transition to live publication without sign-off from a distinct active staff reviewer (`approved_by != author_id`).
> Technical enforcement is implemented in `apps/portal/src/services/cms.service.js` and `routes.js`.

---

## Roles

- **Contributors** (Simal desks: storage, software practice, security desk) draft insights/solution copy.
- **Editor** (CM) reviews tone/legal, schedules.
- **Publisher** (CM lead) pushes live via CMS; staff with `notes` perm for catalog facts.
- **Reviewer (compliance)** sign-off mandatory for: pricing claims, Peppol/compliance dates, brand-authorization wording (`approved_by != author_id`).

## Workflow

Draft → internal review → compliance sign-off (mandatory dual approval for Tier 3 sensitive claims) → scheduled publish → live SSG regeneration. Every publish writes audit trail with dual-approver metadata (`who/when/approved_by`); rollback to previous revision in 1 click (CMS keeps rolling 10 revisions).

## Bilingual rules (URD RTL)

Every publish must include or explicitly defer the AR variant; numerals stay Western; RTL QA via preview mode (ar.html parity standard). Deferred AR auto-listed in the weekly gap report.

## Editorial standards (from content §style guide)

- Claims discipline: the flagged marketing claims ("1000+ customers", "20+ years", UGREEN exclusivity) stay **unpublished** until management verifies (PRD gate). Prices: never public (RFQ model). Compliance dates: only FTA-sourced.
- Solution copy: vendor-neutral for Unisoft positioning ("engineered with Unisoft", never "sister concern").
- Insights: 14-article library is the launch baseline; 2 posts/month cadence after.

## Catalog changes

New SKU → product + deep record + photos (81-photo standard) + brand count check; price/stock never shown.

## Audit v2.0 additions

1. **Publish SLAs:** standard content 2 business days draft→live; time-sensitive (stock drops, product launches) same-day fast lane with Editor sign-off; compliance-critical corrections (e.g., wrong SLA table or compliance date) — **emergency path**: any Editor + one of (CM lead / SEC) may publish immediately, retrospective review logged.
2. **Rollback procedure:** CMS keeps last 10 revisions; restore = select previous revision → republish (triggers ADR-13 purge); rollback also audited with reason.
3. **Bilingual KPI:** AR-gap report weekly (existing); target AR coverage ≥ 90% of changed pages within 10 business days; measured in F2 monthly report.
4. **Analytics tie:** every publish emits `content_published` event (H3) with entity + actor for change-correlation during incidents.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — rules mirror PRD content gates |
| 2026-10-05 | **v2.0 audit:** +publish SLAs + emergency path, +rollback procedure, +AR coverage KPI, +publish analytics tie |
