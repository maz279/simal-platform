# Vendor Procurement Award & Production Infrastructure Checklist — T2.6

**Doc ID:** G5-PRC · **Task:** T2.6 (Procurement award + production hosting) · **Owner:** PM · **Collaborators:** OPS, TL, Simal Executive Management
**Inputs:** `Vendor_Hosting_Procurement_RFP.md` (G5 v2.0) · **Target:** hosting awarded by 23 Oct 2026

> **Status: STAGED FOR HUMANS.** Vendor selection and contract award are commercial
> decisions no agent may make. This checklist is the evaluation instrument, ready for
> the committee; nothing below is pre-decided.

## 1. Mandatory technical criteria (pass/fail per bid)

| # | Criterion | Requirement | Bid A | Bid B | Bid C |
|---|---|---|---|---|---|
| 1 | UAE data residency | All production data stored in-country (PDPL, BR-23) | | | |
| 2 | ISO 27001 | Current certification (scope covers the service) | | | |
| 3 | Peppol accreditation | ASP is on the OpenPeppol member list (C2) | | | |
| 4 | Uptime SLA | ≥ 99.95% with credits | | | |
| 5 | TLS 1.3 + HSTS at edge | Confirmed in writing | | | |
| 6 | Backup/restore | Daily snapshots + ≤ 4 h RTO commitment | | | |
| 7 | Log export | Access to raw logs for E5 monitoring | | | |

## 2. Award actions (committee executes)

- [ ] Score all bids against §1 (any FAIL on criteria 1–4 disqualifies)
- [ ] Commercial evaluation (price, term, exit clauses)
- [ ] Award: primary UAE cloud hosting + CDN + accredited Peppol ASP
- [ ] Contracts signed with DPA + security schedule (C4 register updated)
- [ ] Provision production via IaC (Terraform plan reviewed by TL; state in secret store)

## 3. Hand-off artifacts this project already provides the vendor

| Artifact | Path |
|---|---|
| Container definition | `Codebase/apps/portal/Dockerfile` (non-root, health-checked) |
| Edge configuration | `Codebase/infra/nginx/portal-staging.conf` (TLS 1.3, headers, rate zones) |
| Deploy pipeline (gated) | `Codebase/.github/workflows/deploy.yml` |
| Environment matrix | `Project_doc/05_Deployment_DevOps/Environments_and_Configuration_Matrix.md` |
| Provisioning from zero | `Codebase/scripts/migrate.sql` + `seed.sql` (rehearsal-proven) |

## 4. Post-award verification (gates before go-live)

- [ ] Staging URL live → SecurityHeaders.com **A+** scan recorded (E1-SSH §4)
- [ ] Container health probe green through the edge
- [ ] Self-hosted runner registered → `deploy.yml` executes end-to-end
- [ ] DNS delegation rehearsal (T6.7 / rehearsal #2 on prod infra)

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | Checklist staged with all technical criteria from G5 v2.0; hand-off artifacts listed |
