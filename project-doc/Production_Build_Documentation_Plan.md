# Simal Corporate Website & Portal — Production Build Master Documentation Plan

**Version:** 2.0 (all documents created **and** folder-by-folder audited; waves date-anchored) · **Date:** 5 Oct 2026 · **Owner:** Project Management / Engineering
**Mission:** transform the working prototype (36-page corporate site) + portal (KYC & e-invoicing, real Node backend) into a **100% production build, ready for deployment** — and define every document essential to guide, build, verify, deploy and operate it.

---

## 1. Where we stand (assets already in hand)

| Asset | Location | Status |
|---|---|---|
| PRD v1.5, BRD v1.4, URD v1.3, FRS v1.3 (225 reqs), SRS v1.1.0 | `Primary_doc/` | ✅ complete, cross-traced |
| UX/UI design spec v2.2 (Navy & Gold, WCAG-checked) | `UX_FrontEND/` | ✅ complete |
| Content package — 261 files, 20 sections | `content/` | ✅ complete |
| Working prototype — 36 pages, 7 detail tiers, self-test 54/54 | `Prototype/` | ✅ functional reference build |
| KYC + e-invoicing portal — real backend (auth, RBAC, fils math, Peppol UBL), 39/39 unit + 16/16 e2e | `portal/` | ✅ working software |
| KYC source system + KYC PRD v1.1 | `simal_kyc/` | ✅ proven engine |
| Old site mirror (migration source) | `Mirror_site/` | ✅ reference |

**What is missing is the production-bridge layer:** documents that take working software to *deployable, operable, compliant, maintainable* software. This plan lists them — categorized, named, prioritized — and fixes the folder tree that will hold them.

---

## 2. Essential document inventory (by category)

Status legend: ✅ exists · 🔴 **must-create (essential, blocks deployment)** · 🟡 should-create (essential within 90 days of launch) · ⚪ nice-to-have.

### A. Requirements & Scope (mostly done)
| # | Document (file name) | Status | Purpose |
|---|---|---|---|
| A1 | `Simal_Corporate_Website_PRD.md` | ✅ | Product scope, launch gates |
| A2 | `Simal_Corporate_Website_BRD.md` | ✅ | Business case, KPIs, risks |
| A3 | `Simal_Corporate_Website_URD.md` | ✅ | Users, usability targets |
| A4 | `Simal_Corporate_Website_FRS.md` | ✅ | 225 traced requirements |
| A5 | `Simal_Corporate_Website_SRS.md` | ✅ | System spec |
| A6 | `Portal_KYC_eInvoicing_PRD.md` | 🔴 | Merge simal_kyc PRD v1.1 + new e-invoice module into ONE portal PRD (scope, actors, compliance refs) |
| A7 | `Data_Dictionary.md` | 🔴 | Every entity/field (catalog, CMS, KYC, invoices, UBL) — types, sources, PII flags |

### B. Architecture & Design (the production bridge)
| # | Document | Status | Purpose |
|---|---|---|---|
| B1 | `Technical_Architecture_Document_TAD.md` | 🔴 | Target production architecture: frontend, API, DB, sessions, file storage, email, integrations |
| B2 | `Prototype_to_Production_Conversion_Plan.md` | 🔴 | **The core transformation guide**: page-by-page/system-by-system mapping prototype → real stack, what is kept/rebuilt/dropped |
| B3 | `ADR_Architecture_Decision_Records.md` | 🔴 | Stack choices with rationale (framework, DB, hosting, auth, email, Peppol ASP) |
| B4 | `Database_Design_Schema.md` | 🔴 | ERD + DDL: catalog, RFQ, KYC, invoices (fils integers), audit; migration from JSON store |
| B5 | `API_Contract_OpenAPI_Spec.md/.yaml` | 🔴 | Versioned public+internal API contract (portal endpoints + future site API) |
| B6 | `Security_Architecture.md` | 🔴 | AuthN/Z, secrets, headers, upload handling, rate limits, PII masking (extends portal CSP model) |
| B7 | `Integration_Specification.md` | 🔴 | Email/SMTP, WhatsApp handoff, Peppol ASP/ATA, ERP webhook, analytics — protocols, retries, keys |

### C. Compliance & Legal (UAE-specific, deployment blockers)
| # | Document | Status | Purpose |
|---|---|---|---|
| C1 | `DPIA_UAE_PDPL.md` | 🔴 | Data Protection Impact Assessment (PDPL 45/2021): data map, lawful basis, transfers |
| C2 | `Peppol_EInvoicing_Compliance_Matrix.md` | 🔴 | FTA Phase-1 obligations, 0235/TRN rules, UBL 2.1 fields, ASP onboarding steps |
| C3 | `Records_Retention_and_Deletion_Policy.md` | 🔴 | Retention schedule per data class (feeds DPIA + operations) |
| C4 | `Accessibility_Conformance_Report_WCAG21AA.md` | 🟡 | Audit evidence for the URD's WCAG 2.1 AA target |
| C5 | `Third_Party_DPAs_Register.md` | 🟡 | Processors list (hosting, email, analytics) + agreement status |

### D. Quality & Testing
| # | Document | Status | Purpose |
|---|---|---|---|
| D1 | `Master_Test_Plan.md` | 🔴 | Strategy: unit/integration/e2e/UAT/perf/security; environments; entry/exit criteria |
| D2 | `UAT_Plan_and_Script.md` | 🔴 | Business scenarios per persona (RFQ, KYC approve, invoice deliver) |
| D3 | `Requirements_Traceability_Matrix.md` | 🔴 | FRS 225 reqs + portal reqs → tests → results |
| D4 | `Performance_and_Load_Test_Plan.md` | 🟡 | Targets (LCP/INP per URD), load profiles, tools |
| D5 | `Security_Testing_Plan.md` | 🟡 | OWASP ASVS scope, pen-test pre-reqs, remediation SLAs |

### E. Deployment & DevOps
| # | Document | Status | Purpose |
|---|---|---|---|
| E1 | `Deployment_Guide.md` | 🔴 | Environments, step-by-step release, rollback, secrets setup |
| E2 | `CI_CD_Pipeline_Specification.md` | 🔴 | Build→test→stage→prod pipeline, gates, artifact versioning |
| E3 | `Environments_and_Configuration_Matrix.md` | 🔴 | Dev/stage/prod, env vars, feature flags, DNS/SSL |
| E4 | `Backup_Disaster_Recovery_Plan.md` | 🔴 | RPO/RTO, backup schedule, restore drills |
| E5 | `Monitoring_and_Alerting_Plan.md` | 🔴 | Uptime, logs, error rates, SLA alerts, on-call |
| E6 | `GoLive_Runbook.md` | 🔴 | Hour-by-hour launch sequence + abort criteria |
| E7 | `Migration_and_Cutover_Plan.md` | 🔴 | Mirror-site → new site 301s, KYC portal tenant migration, comms |

### F. Operations & Support
| # | Document | Status | Purpose |
|---|---|---|---|
| F1 | `Operations_Runbook.md` | 🔴 | Daily/weekly tasks, incident escalation, common fixes |
| F2 | `SLA_and_Support_Handbook.md` | 🟡 | Support tiers, response targets (aligns with AMC tiers) |
| F3 | `Incident_PostMortem_Template.md` | ⚪ | Repeatable learning loop |
| F4 | `Content_Governance_and_CMS_Guide.md` | 🟡 | Roles, approval flow, bilingual (EN/AR) publishing rules |

### G. Project & Change Management
| # | Document | Status | Purpose |
|---|---|---|---|
| G1 | `Production_Build_Project_Plan.md` | 🔴 | Phases, milestones, team, budget link to BRD CBA |
| G2 | `Risk_Register_Production.md` | 🔴 | Live top-10 risks + mitigations (extends BRD §risks) |
| G3 | `RACI_and_Governance.md` | 🟡 | Decision rights Simal ↔ Unisoft ↔ vendors |
| G4 | `Change_Management_and_Versioning.md` | 🟡 | Doc/code versioning, change control board |
| G5 | `Vendor_Hosting_Procurement_RFP.md` | 🟡 | Hosting + domain + SSL + ASP shortlist criteria |

### H. Content, SEO & Analytics
| # | Document | Status | Purpose |
|---|---|---|---|
| H1 | `Content_Inventory_Master.md` | ✅ | `content/Required_Content_Files_Master_Inventory.md` |
| H2 | `SEO_Metadata_and_Redirect_Map.md` | 🔴 | Per-page meta (content §15), 301 map from mirror URLs |
| H3 | `Analytics_Measurement_Plan.md` | 🟡 | KPI events tied to BRD (RFQ rate, KYC conversions) |

---

## 3. Target folder tree for `Project_doc/`

```
Project_doc/
├── README.md                                  ← this plan (master index)
├── 00_Executive/
│   ├── Production_Build_Project_Plan.md               (G1)
│   └── Risk_Register_Production.md                    (G2)
├── 01_Requirements/
│   ├── Portal_KYC_eInvoicing_PRD.md                   (A6)
│   └── Data_Dictionary.md                             (A7)
├── 02_Architecture/
│   ├── Technical_Architecture_Document_TAD.md         (B1)
│   ├── Prototype_to_Production_Conversion_Plan.md     (B2) ★ core
│   ├── ADR_Architecture_Decision_Records.md           (B3)
│   ├── Database_Design_Schema.md                      (B4)
│   ├── API_Contract_OpenAPI_Spec.yaml                 (B5)
│   ├── Security_Architecture.md                       (B6)
│   └── Integration_Specification.md                   (B7)
├── 03_Compliance/
│   ├── DPIA_UAE_PDPL.md                               (C1)
│   ├── Peppol_EInvoicing_Compliance_Matrix.md         (C2)
│   ├── Records_Retention_and_Deletion_Policy.md       (C3)
│   ├── Accessibility_Conformance_Report_WCAG21AA.md   (C4)
│   └── Third_Party_DPAs_Register.md                   (C5)
├── 04_Quality/
│   ├── Master_Test_Plan.md                            (D1)
│   ├── UAT_Plan_and_Script.md                         (D2)
│   ├── Requirements_Traceability_Matrix.md            (D3)
│   ├── Performance_and_Load_Test_Plan.md              (D4)
│   └── Security_Testing_Plan.md                       (D5)
├── 05_Deployment_DevOps/
│   ├── Deployment_Guide.md                            (E1)
│   ├── CI_CD_Pipeline_Specification.md                (E2)
│   ├── Environments_and_Configuration_Matrix.md       (E3)
│   ├── Backup_Disaster_Recovery_Plan.md               (E4)
│   ├── Monitoring_and_Alerting_Plan.md                (E5)
│   ├── GoLive_Runbook.md                              (E6)
│   └── Migration_and_Cutover_Plan.md                  (E7)
├── 06_Operations/
│   ├── Operations_Runbook.md                          (F1)
│   ├── SLA_and_Support_Handbook.md                    (F2)
│   ├── Incident_PostMortem_Template.md                (F3)
│   └── Content_Governance_and_CMS_Guide.md            (F4)
├── 07_Project_Management/
│   ├── RACI_and_Governance.md                         (G3)
│   ├── Change_Management_and_Versioning.md            (G4)
│   └── Vendor_Hosting_Procurement_RFP.md              (G5)
└── 08_Content_SEO/
    ├── Content_Inventory_Master.md                    (H1 — link to content/)
    ├── SEO_Metadata_and_Redirect_Map.md               (H2)
    └── Analytics_Measurement_Plan.md                  (H3)
```

Counts: **21 must-create (🔴)**, **9 should-create (🟡)**, **2 optional (⚪)** — on top of the 6 documents that already exist.

> **✅ CREATION COMPLETE — 5 Oct 2026 (4 iterations):** every document listed in §2 and the tree in §3 now exists under `Project_doc/` (38 files, tree-verified). All content is aligned 1:1 with the shipped workspace: PRD/BRD/URD/FRS v1.5/1.4/1.3/1.3, the 36-page prototype (self-test 54/54), the portal (39/39 unit, 16/16 e2e, schema v3, fils math, 7-check validation, Peppol UBL), and the content package. Each file carries Doc ID / version / owner / status-log per the workspace convention. Documents now enter their maintenance phase per §8 (index of record = this file).

---

## 4. Document briefs — inputs, owner, acceptance criteria (Iteration 2)

Every 🔴 document gets a one-paragraph brief so the author never starts from a blank page. Owner roles: **PM** project management, **TL** tech lead, **SEC** security/compliance, **QA**, **OPS** DevOps, **CM** content marketing.

| Doc | Author | Build from (inputs in workspace) | Acceptance criteria (done when…) |
|---|---|---|---|
| A6 Portal PRD | PM | `simal_kyc/PRD_Simal_KYC_Portal_v1.1.md`, portal README, e-invoice service | Both portals' actors/flows listed; e-invoicing lifecycle table included; compliance refs (FTA/PDPL) cited |
| A7 Data Dictionary | TL | `Prototype/data/*.js`, `portal/src/domain/validators.js`, UBL export | Every field has type, source, validation, PII flag; KYC + invoice entities complete |
| B1 TAD | TL | portal architecture doc, Prototype structure, ADR set | Diagram covers web→API→DB→email→Peppol; scaling + single-points-of-failure named |
| **B2 Conversion Plan ★** | TL+PM | `Prototype/` (36 pages), `portal/`, `UX_FrontEND/` | **Every prototype page mapped** to a production route + build action (keep/rebuild/drop); localStorage features → real persistence table; mock auth → real auth mapping; effort estimate per module |
| B3 ADRs | TL | decisions in BRD/portal docs | ≥8 decisions (stack, DB, hosting, auth, email, ASP, analytics, AR/i18n) each with context/options/consequence |
| B4 DB Schema | TL | `portal/src/store/repos.js`, prototype data | ERD + DDL; JSON-store → SQL migration notes; fils integers preserved; audit tables |
| B5 API Contract | TL | `portal/docs/API.md`, portal routes | OpenAPI 3.1 validates; every /api/einvoice + KYC endpoint documented with error shapes |
| B6 Security Architecture | SEC | portal CSP/RBAC/scrypt model, FRS-K | Threat model (STRIDE-lite); secrets handling; headers matrix; upload + rate-limit policy |
| B7 Integration Spec | TL | notify/webhooks services, FRS external interfaces | Each integration: protocol, auth, retry/backoff, failure modes, test endpoint |
| C1 DPIA | SEC | FRS-A data rules, PDPL refs in BRD | Data-flow map; lawful basis per purpose; risk table with mitigations; sign-off block |
| C2 Peppol Matrix | PM | FTA/BRD e-invoicing refs, UniVAT facts, e2e UBL | Obligation→control mapping; UBL field checklist; ASP onboarding steps + dates |
| C3 Retention Policy | SEC | DPIA + data dictionary | Retention/deletion per class incl. KYC docs, invoices, audit, backups |
| D1 Master Test Plan | QA | portal tests, Prototype self-test, URD targets | Levels, environments, entry/exit criteria, defect severity model |
| D2 UAT | QA | URD personas, e2e journey | ≥25 scripted scenarios covering RFQ→KYC→invoice→delivery; pass criteria |
| D3 Traceability | QA | FRS 225 reqs + portal reqs | Every requirement → ≥1 test ID; gaps explicitly waived |
| E1 Deployment Guide | OPS | portal run + config | Fresh-machine deploy reproduces working system; rollback steps tested once |
| E2 CI/CD Spec | OPS | E1 + test commands | Pipeline stages + gates defined; secret handling stated |
| E3 Environments | OPS | portal `.env.example` | Dev/stage/prod var matrix; DNS/TLS plan; no prod secret in repo |
| E4 Backup/DR | OPS | B4, db store | RPO ≤ 24h / RTO ≤ 4h proposed; restore drill procedure |
| E5 Monitoring | OPS | BRD KPIs | Alert list with thresholds + owners; dashboard mock |
| E6 GoLive Runbook | PM+OPS | E1–E5 | Hour-by-hour plan, abort criteria, comms templates, checklist |
| E7 Migration/Cutover | PM | `Mirror_site/`, PRD §9 | Full 301 map (mirror→new), KYC tenant migration, SEO safeguards |
| G1 Project Plan | PM | BRD CBA, this plan | Phases with milestones/dates/owners; dependency on B2 explicit |
| G2 Risk Register | PM | BRD risks | Top-10 with owner, mitigation, trigger, review cadence |
| H2 SEO/Redirect Map | CM | `content/15_SEO_Metadata`, mirror URLs | Meta per page; 301 table; sitemap.xml plan |

---

## 5. Production-conversion gap register (what "100% real" means)

The single largest deliverable is **B2**. Its backbone — the prototype features that must become real:

| Prototype behavior (today) | Production requirement |
|---|---|
| Data as `window.*` JS globals (catalog, software, insights) | Database + admin-managed content (CMS tables, migrations) |
| RFQ basket + refs in `localStorage` | Server-side RFQ entities, email confirmations, staff view |
| Mock sign-in (any email/8-char) | Real auth (portal scrypt+TOTP engine), roles: partner/staff |
| Admin/CMS panels over `localStorage` | Role-gated back office on the same DB as production data |
| Static pages served by python script | Hardened web server/CDN + CI/CD + TLS |
| Portal JSON file store | Managed SQL database with backups (schema in B4) |
| Outbox emails (simulated) | Real SMTP/provider with templates + bounce handling |
| Peppol delivery simulated (UBL stored) | Certified ASP integration or accredited access point (C2) |
| Self-test 54/54 as QA | CI test suite + UAT sign-off (D1–D3) |

---

## 6. Creation order & dependencies (v2.0 — date-anchored to the 4 Dec 2026 go-live, matching G1 v2.0)

```
Wave 1 (6–9 Oct) — decide & scope
  B3 ADRs ──▶ B1 TAD ──▶ B4 DB schema ──▶ B5 API contract
  A6 Portal PRD ──▶ G1 Project plan ──▶ G2 Risk register · G5 RFP issued 6 Oct
Wave 2 (9–16 Oct) — the bridge
  B2 Conversion Plan ★ (feeds every build task)
  A7 Data dictionary ──▶ B6 Security architecture ──▶ B7 Integrations · C1 DPIA signed
Wave 3 (12–23 Oct) — compliance & procurement
  C5 DPAs signed ──▶ C3 Retention ──▶ C2 Peppol (ASP sandbox PASS by 30 Oct) · hosting awarded by 23 Oct
Wave 4 (16 Oct – 13 Nov, with build)
  D1 Test plan ──▶ D3 Traceability ──▶ D2 UAT scripts
  E1 Deployment ──▶ E2 CI/CD ──▶ E3 Environments · parity checklist ≥ 95% at exit
Wave 5 (13 Nov – 4 Dec, pre-launch)
  D4/D5 verify · E4 Backup/DR ──▶ E5 Monitoring ──▶ E7 Migration/cutover
  Freeze 27 Nov ──▶ rehearsal 30 Nov ──▶ go/no-go 2 Dec ──▶ E6 GoLive 4 Dec
Wave 6 (4 Dec – 1 Jan 2027 and beyond)
  F1 Ops runbook (hypercare, criteria-based exit) ──▶ F2 SLA ──▶ F4 CMS governance
  H2 SEO watch (60 days) ──▶ H3 analytics live · Peppol live exchange by 24 Dec
```

Hard dependencies: nothing in Waves 4–5 starts before B2 exists; GoLive (E6) is blocked by every other 🔴 E-doc; C1 DPIA must precede any production data collection (PDPL gate); freeze (27 Nov) blocks all non-SEV changes (G4 v2.0).

## 7. Traceability — how the new set locks onto the existing set

| Existing doc | New documents that operationalize it |
|---|---|
| PRD v1.5 (scope, gates SG-1…5) | G1 phases mirror the gates; E6 runbook is the SG-5 instrument |
| BRD v1.4 (CBA, KPIs, risks) | G2 extends risks; H3 analytics plan implements the KPIs; G5 procurement follows CBA budget |
| URD v1.3 (personas, SUS ≥80, WCAG AA) | D2 UAT scripts per persona; C4 accessibility report is the evidence |
| FRS v1.3 (225 reqs, 19 modules) | D3 traceability matrix maps all 225 → tests; B5 API contract realizes FRS external interfaces |
| SRS v1.1.0 (system qualities) | B1 TAD + B6 Security architecture are its engineering expansion |
| UX spec v2.2 | B2 conversion plan carries the design system into production components |
| Portal (KYC+e-invoice code) | B4/B5 document its schema/endpoints; C2 certifies its Peppol layer; A6 owns its scope |

## 8. Maintenance rule

This plan is the **index of record**: when any listed document is created, its row moves to ✅ with a version and date here. The index file is `Project_doc/Production_Build_Documentation_Plan.md` (this file) — no other index.

*End of plan — 3 creation iterations + 9 folder audits + 1 cross-folder audit complete. Next concrete action: Wave-1 kickoff (ADRs + Conversion Plan) on 6 Oct 2026.*

## 9. Cross-folder audit ledger (v2.0 — 5 Oct 2026)

Whole-tree audit performed folder-by-folder (00→08) plus this cross-check. Every content document now carries an "Audit v2.0" section + status-log entry. Ledger of findings fixed:

| Folder | Key findings fixed |
|---|---|
| 00_Executive | schedule landed at/after the 1 Jan 2027 mandate (critical) → date-anchored, 4-wk buffer, freeze/go-no-go/hypercare; parity gate §4 added; +4 risks (R11–R14) |
| 01_Requirements | +NFRs, +acceptance criteria, +account services (reset/verification), +invoice numbering/cancellation semantics, language scope; dictionary +11 missing data structures (hero_slides etc.), completeness rule |
| 02_Architecture | +capacity/search/cache/i18n, strangler sequencing; +interactive-island inventory (10) + drop/defer table; +3 ADRs; +5 content tables; site API shapes fixed; +reset-token rules; +integration health probes |
| 03_Compliance | 72-h breach clock, RoPA, DPO, Exec-Regs caveat; ASP dates re-anchored + BIS 3.0 check; **delivered-invoice immutability control** (reopen restrictions); reduced-motion + WCAG 2.2 + palette rules; +2 processors |
| 04_Quality | browser matrix, visual regression in CI, axe in pipeline, defect workflow; UAT script 26 (reset) + SUS method; **54-assertion mapping table**; perf tools/budgets fixed; secrets scanning + ZAP DAST + ASVS mapping |
| 05_Deployment_DevOps | IaC policy, LB checks, SSG artifact rollback; +3 CI layers, branch rules; dev port map documented; WORM backups + CMS content in backup set; synthetic monitors; GoLive dates/authorities; mirror freeze 2 Dec |
| 06_Operations | criteria-based hypercare exit, daily checklist, on-call mechanics, ticket mining; intake channels + monthly report contents; postmortem linkage/privacy; publish SLAs + emergency path |
| 07_PM | decision SLAs, go/no-go authority row, CAB quorum, meeting calendar; emergency change path + freeze window + baseline manifest; RFP dates anchored + committee + residency cert + exit clause |
| 08_Content_SEO | redirect validation as CI gate (200/no-chain), pre-migration crawl baseline, filtered-view canonicals, 404 policy, sitemap lastmod; analytics filters/consent-labeling/KPI owners; inventory delta-scan rule |

**Consistency rules (verified across the tree):** single date anchor set (freeze 27 Nov · go/no-go 2 Dec · go-live 4 Dec · Peppol live ≤ 24 Dec · mandate 1 Jan 2027 — adopted in 7 documents each for the two anchor dates); doc-ID references (A1–H3) match file names; credentials appear as env-var names only, never literals; Unisoft positioning wording uniform; money = integer fils everywhere.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 plan → v1.1 briefs → v1.2 sequencing (3 creation iterations) → v1.3 all 38 documents created |
| 2026-10-05 | **v2.0 — whole-tree audit:** nine folder audits consolidated, waves date-anchored to match G1 v2.0, cross-folder ledger + consistency rules added; 38/38 content documents carry Audit v2.0 entries (verified by grep) |
