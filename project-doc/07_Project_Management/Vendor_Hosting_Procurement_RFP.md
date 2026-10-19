# Vendor / Hosting Procurement RFP

**Doc ID:** G5 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM · Budget envelope: BRD v1.4 CBA Phase 1

## 1. Scope of supply (lots may combine)

**Lot A — UAE hosting:** VM/container (2× app nodes + LB), managed PostgreSQL 16 (WAL + snapshots per E4), private object storage w/ versioning, UAE region **required** (C1), staging env mirror.
**Lot B — CDN + TLS:** global edge, immutable-asset caching, no-store policy support for portal HTML.
**Lot C — Email:** transactional provider, SPF/DKIM/DMARC support, bounce webhooks, UAE/EU processing preferred (C5).
**Lot D — Peppol ASP:** accreditation certificate, sandbox, per-document pricing, UAE support hours (C2 criteria).
**Lot E — external pen-test:** ASVS L2 scope (D5).

## 2. Mandatory requirements

99.9% static / 99.5% portal SLA with credits · 24×7 SEV-1 support · DPA + sub-processor list before go-live (C5) · data export + deletion on exit (C3) · ISO 27001 or SOC 2 attestation · log access for E5 · no access to application secrets.

## 3. Evaluation matrix (100 pts)

UAE region / residency 20 · SLA + support 20 · price TCO 3-year 20 · security attestations 15 · managed-DB capabilities (E4 fit) 15 · exit/portability 10.

## 4. Process & timeline

RFP out P1 wk1 → clarifications wk2 → proposals wk3 → two-vendor shortlist + reference calls wk4 → contract by P3 start (G1 gate). Score sheet archived with procurement record; deviations require change-board approval (G3).

## 5. Exclusions

Development services (Unisoft MSA covers), content production, hardware/AMC (existing Simal lines).

## 6. Audit v2.0 additions

1. **Timeline anchored (was "P1 wk1"):** RFP issued **6 Oct 2026**; clarification window closes 12 Oct; proposals due 16 Oct; scoring + shortlist 17–20 Oct; reference calls 21–22 Oct; **award by 23 Oct** (R5 trigger). Cumulative scoring per interaction ([practice](https://www.viewpointanalysis.com)).
2. **Evaluation committee:** PM (chair), TL, SEC (residency/security), OPS — no vendor-facing member scores a vendor they introduced (conflict declaration).
3. **Bidder submission format:** fixed template per lot (capabilities matrix, pricing table TCO 3-yr, SLA terms, certifications) — free-form prose scores zero on structure.
4. **UAE data-residency certificate** required with proposal (Lot A mandatory; Lot C/D preferred) — self-declarations verified in diligence.
5. **Exit assistance clause (minimum):** 90-day transition support, full data export in documented formats, cooperation with replacement vendor — priced in TCO, not an after-sale change order.
6. **Debrief rule:** all unsuccessful bidders receive a written debrief; score sheets archived with the procurement record.
7. **Rollback-plan question (Lot A):** bidders must describe region/zone failure behavior and restore support — scored within SLA+support ([cloud-selection criteria](https://techenhange.com)).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — ready to issue |
| 2026-10-05 | **v2.0 audit:** +anchored dates (issue 6 Oct → award 23 Oct), +committee + conflict rule, +submission format, +residency certificate, +exit-assistance clause, +debrief rule, +rollback question |
