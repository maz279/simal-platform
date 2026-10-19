# Business Requirements Document (BRD)

## Simal Digital Platform — Corporate Website, Partner Lifecycle & Software Business Enablement

| Field | Detail |
|---|---|
| **Document Title** | Simal Digital Platform — Business Requirements Document |
| **Version** | 1.4 |
| **Date** | 3 October 2026 |
| **Status** | Draft — for executive review & sign-off |
| **Prepared For** | Simal Technologies Middle East LLC (Dubai, UAE) — Executive Sponsor & Management Board |
| **Business Sponsor** | Simal Technologies — Management |
| **Product Codename** | Simal Digital Platform (SDP) |
| **Companion Document** | *Product Requirements Document (PRD) v1.4*, *User Requirements Document (URD) v1.2* and *Functional Requirements Specification (FRS) v1.2* — same folder. The PRD defines **what will be built**; the URD defines **who the users are and what they must accomplish** (its §13 usability rounds are part of the SG-3 gate); the FRS decomposes the PRD into **225 testable shall-requirements across 19 modules**. This BRD defines **why the business needs it, what business outcomes it must produce, and how success is judged**. Every business requirement herein traces to PRD requirements (Appendix A). |
| **Research Base** | Workspace mirror audit & live-site review (simalme.com, kyc.simalme.com); Unisoft Systems Ltd (uslbd.com); benchmark study (CDW, Redington, Ingram Micro, MITSUMI, ASBIS); market & regulatory research conducted 3 Oct 2026 (Gartner, IDC-derived reporting, UAE FTA e-invoicing program, UAE PDPL, BASIS) — full citations in Appendix B |
| **Change Record** | v1.0 — Initial BRD. Grounded in PRD v1.1; incorporates 2026 market data and the UAE e-invoicing mandate timeline (voluntary phase live; mandatory Phase 1 on 1 Jan 2027).<br>v1.1 — Audit pass 3: FX/currency assumption note added to CBA (§11); Unisoft dependency strengthened — their public case-studies page is empty, so launch case-study material must be supplied directly (RSK-5, §10 Assumption 2); additional sources consulted (Redington contact-page enquiry taxonomy, Unisoft technology-stack page — 44 technologies verified) appended to Appendix B; aligned with PRD v1.2.<br>v1.2 — Audit pass 4: **added BR-33 (IT Solutions & Services demand capture)** — the existing 12-line services business (§2.2 revenue stream 2) previously had no BR anchor and no PRD FR-5 ↔ URD UR chain; added IT-services consultation KPI (≥8/month, BO-2); SUS ≥80 usability KPI row added (per URD §13); companion references synchronized to PRD v1.3 / URD v1.1.<br>v1.3 — Audit pass 5: companion references updated to the full four-document family; subsequently updated to FRS v1.2 (no BRD changes).<br>v1.4 — **Management correction — corporate independence:** Simal is a fully independent company with no TwinMOS/Smart Group association (stated by management 3 Oct 2026). §2.1 Group row corrected; TwinMOS Technologies ME FZE removed from the UAE entities list; brand portfolio corrected to 23 distinct brands; "sister concern" Unisoft reframed as **software delivery partner** (§1 business context). No BR, BO, KPI, or CBA figures change — the correction is factual positioning only. |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Background & Context](#2-business-background--context)
3. [Problem Statement & Business Opportunity](#3-problem-statement--business-opportunity)
4. [Market & Industry Analysis](#4-market--industry-analysis)
5. [Business Objectives & Success Criteria](#5-business-objectives--success-criteria)
6. [Stakeholder Analysis & Governance](#6-stakeholder-analysis--governance)
7. [Business Requirements](#7-business-requirements)
8. [Business Process Requirements (As-Is → To-Be)](#8-business-process-requirements-as-is--to-be)
9. [Business Rules & Policies](#9-business-rules--policies)
10. [Constraints, Assumptions & Dependencies](#10-constraints-assumptions--dependencies)
11. [Cost-Benefit Analysis](#11-cost-benefit-analysis)
12. [Business Risk Register](#12-business-risk-register)
13. [Change Management, Training & Adoption](#13-change-management-training--adoption)
14. [Approval & Sign-Off](#14-approval--sign-off)
15. [Appendices](#15-appendices)

---

## 1. Executive Summary

Simal Technologies Middle East LLC has grown, over 20+ years, into a recognized IT distribution house for the UAE, GCC, MEA and CIS markets — carrying 20+ global brands, operating from Bur Dubai with JAFZA-based warehousing, and serving resellers, system integrators, retailers and e-commerce platforms. Its **digital presence does not match its commercial reality**: a template WordPress catalog with "Call for Price" ordering, a careers page with no roles, inconsistent published information, and a partner-onboarding (KYC) portal that runs as a completely separate silo.

Three business developments make this investment **time-critical rather than optional**:

1. **The UAE e-invoicing mandate is now live.** Under the Federal Tax Authority's Peppol-based program, voluntary adoption began **1 July 2026**, businesses with revenue ≥ AED 50 million must appoint an Accredited Service Provider by **30 October 2026**, and **mandatory Phase 1 compliance starts 1 January 2027**, phasing to all VAT-registered businesses during 2027. Simal's partner KYC data (TRN/Peppol IDs) is the compliance backbone of its trading relationships; it currently sits in a disconnected portal. Consolidating partner data, onboarding, and e-invoicing identifiers into one platform is now a **regulatory-readiness** issue, not a convenience.
2. **The company is launching a software services & solutions business with its software delivery partner Unisoft Systems Ltd** (40+ engineers, ISO 9001/27001, SOC 2, 12 service lines, 20+ packaged products). MENA software spending is forecast at **US$20.4 billion in 2026, growing 13.9% year-on-year** (Gartner) — the fastest-growing layer of regional IT spend. Simal currently has **zero digital storefront** for this business.
3. **B2B buying has moved decisively online.** Gartner projects **80% of B2B sales interactions will occur in digital channels**; **67% of B2B buyers prefer a rep-free experience**; Forrester documents a **~220-day independent-research "blind spot"** before buyers ever contact sales. A distributor whose web presence cannot inform, qualify, and capture demand is invisible during most of its customers' buying journey — while benchmarks (CDW, Redington, Ingram Micro) and regional peers (MITSUMI, ASBIS) industrialize their digital channels.

This BRD defines the business requirements for the **Simal Digital Platform**: a benchmark-class bilingual (EN/AR) corporate website with RFQ-native B2B commerce, a fully integrated partner KYC/onboarding lifecycle (absorbing kyc.simalme.com), and a launch surface for the Simal + Unisoft software business. It specifies the business objectives, requirements (BR-01…BR-32), process changes, rules, cost-benefit logic, risks, and the KPI framework against which the Board should judge the investment — and it establishes the traceability chain **Business Objective → Business Requirement → PRD Feature → KPI** used to control scope through delivery.

**Decision requested:** approve the BRD and authorize proceeding to vendor selection against PRD v1.4 (with URD v1.2 / FRS v1.2 as the user and engineering baselines), with the phased roadmap targeting launch before the 1 January 2027 e-invoicing compliance date where feasible.

---

## 2. Business Background & Context

### 2.1 Company & Group Profile (summary — full detail in PRD §2.1)

| Attribute | Detail |
|---|---|
| Trading history | Since 2002 (20+ years) |
| Group | **Independent company — no group affiliation** (management correction, 3 Oct 2026: TwinMOS/Smart-Group association claims withdrawn) |
| UAE entities | Simal Technologies Middle East LLC (office, Bur Dubai) · StarSeed Technologies ME FZE (warehouse, JAFZA) · Stellent Technologies ME LLC (retail store) |
| Software partner | Unisoft Systems Ltd, Dhaka — software delivery engine for the new business line |
| Markets | UAE, GCC, Middle East & Africa, CIS |
| Customers | Resellers, system integrators, retailers, enterprises, e-commerce platforms (Amazon, Sharaf DG, Microless) |
| Portfolio | 20+ brands (Crucial/Micron, Hikvision, TeamGroup, UGREEN, ADATA, KOORUI, Aiwa, Arktek, Nearity, Dell, HP, Lenovo, Samsung, Kingston, SanDisk, Toshiba, WD, ZOTAC, PNY, MSI, Honeywell, Kaspersky, Hiksemi — 23 distinct; TwinMOS removed per the 3 Oct 2026 no-association correction); 76-SKU live catalog; 12 IT solution/service lines |
| Recognition | Hikvision "Best Distributor Partner"; TeamGroup "Best Partner 2025" |
| Scale signals | "1000+ Customers" and UGREEN exclusivity claims published on current landing pages (pending verification — see §9, BRule-8) |
| Digital assets | simalme.com (WordPress/WooCommerce) · kyc.simalme.com (standalone KYC portal, Peppol-ready) · LinkedIn/Facebook/Instagram/WhatsApp |

### 2.2 Business Model Today

**Revenue streams:**
1. **IT distribution** — margin on wholesale movement of components, storage, memory, monitors, accessories, networking and security products to the channel (primary).
2. **IT solutions & services** — 12 lines (AMC, infrastructure, managed services, security, cabling, telephony, etc.) sold alongside hardware.
3. **Retail** — via Stellent store entity.
4. *(New, 2026)* **Software services & solutions** — to be delivered with Unisoft (ERPs, POS, custom development, AI/ML, cloud, cyber, data/BI).

**Order intake today:** predominantly relationship-driven via phone/WhatsApp/email; the website functions as a static catalog ("Call For Price", "Whatsapp order" buttons); no structured quote pipeline, no partner self-service.

**Partner administration today:** standalone KYC portal (kyc.simalme.com) collecting legal-entity, TRN/Peppol and banking data with a ~2-business-day review SLA — operationally sound but brand-disjointed and data-isolated from the main site.

### 2.3 Current-State Business Pain Points (business view of PRD gaps G1–G14)

| # | Business pain point | Commercial consequence | PRD gap ref |
|---|---|---|---|
| P1 | Website does not reflect market position (template look, placeholder counters "0+", test content live) | Undermines credibility with vendors considering authorization and with enterprise buyers; weakens price justification | G1, G5, G13 |
| P2 | No structured quote capture — all demand funnels into WhatsApp/calls | Leads untracked, unattributable, no pipeline visibility, no SLA, knowledge leaves with staff turnover | G2 |
| P3 | Thin corporate story (no leadership, no group narrative, empty awards) | Fails vendor due-diligence and enterprise procurement checks | G3, G12 |
| P4 | No careers capability | Cannot recruit for growth; no employer brand in a competitive UAE talent market | G4 |
| P5 | KYC portal siloed from brand and CRM | Partner data fragmented; onboarding drop-off; no unified partner record; e-invoicing identifiers not tied to trading systems | G8 |
| P6 | No Arabic presence | Excludes a meaningful share of UAE/GCC buyers and government-adjacent business | G9 |
| P7 | Weak SEO/content engine | Invisible during the 220-day independent research phase (§4.3); cedes organic demand to competitors | G6, G10 |
| P8 | No software-business storefront | New revenue line launches with no demand-capture surface | G7 |
| P9 | Inconsistent published information (support hours contradict between Contact page and KYC portal; unverified claims) | Operational confusion, reputational/legal exposure | G14, BRule-8 |

---

## 3. Problem Statement & Business Opportunity

### 3.1 Problem Statement

> *Simal's commercial strength — 20+ years of channel relationships, 20+ brand authorizations, multi-region coverage and a functioning compliance operation — is invisible, unmeasurable, and partially disconnected online. The company cannot (a) present itself at the standard its vendors and enterprise buyers expect, (b) capture and manage demand digitally, (c) onboard partners without channel-splitting friction, (d) demonstrate readiness for the UAE's 2026–27 e-invoicing mandate through an integrated partner data platform, or (e) launch its new software business with any digital presence at all. Meanwhile, regional IT spending grows at scale and B2B buying has moved decisively into digital channels.*

### 3.2 Business Opportunity

1. **Capture existing digital demand that currently bounces.** A professional catalog + RFQ system converts research-phase buyers (who spend ~83% of their journey independent of suppliers — §4.3) into attributable pipeline.
2. **Monetize the software line from day one.** MENA software spend of US$20.4B (+13.9% YoY, Gartner) with Simal's channel access and Unisoft's 60–70% cost advantage creates a credible regional offer.
3. **Turn a compliance obligation into a moat.** Every UAE trading partner must prepare for Peppol e-invoicing in 2026–27. An integrated onboarding+KYC+Peppol experience makes Simal the *easiest distributor to start trading with* — a genuine switching cost in Simal's favor.
4. **Deepen vendor authorizations.** Brand landing pages, market-coverage presentation, and co-marketing surfaces strengthen Simal's case for expanded/new authorizations (the direct path to distribution margin growth).
5. **Prepare for Phase 2 commerce.** A unified partner account base is the prerequisite for the future B2B ordering portal (live pricing, stock, credit) that regional leaders already operate.

---

## 4. Market & Industry Analysis

*(Research conducted 3 October 2026; citations in Appendix B. Figures are directional planning inputs, not audited market data.)*

### 4.1 IT Spending — Global & Regional

| Metric | Value | Source |
|---|---|---|
| Worldwide IT spending, 2026 | US$6.08T+ (later revised toward ~$6.3–6.4T, +13–14% YoY) | Gartner (Oct 2025 / 2026 updates) |
| Worldwide AI spending, 2026 | US$2.7T (+49.5% YoY) | Gartner (Sep 2026) |
| **MENA IT spending, 2026** | **US$169B** (Gartner forecast); broader ICT estimates including telecom run higher (e.g., ~$230B for 2025) | Gartner via CXO Insight ME; ChannelPost MEA |
| **MENA software spending, 2026** | **US$20.4B, +13.9% YoY** — the fastest-growing layer | Gartner via CXO Insight ME |
| **UAE ICT market** | **~US$23.7B (2026) → ~US$49.0B (2035), ~8.4% CAGR** | MarkWide Research |
| UAE data-center investment | ~AED 4B programmed by 2026 | Research and Markets |

**Implication:** Simal's two business engines sit in growing pools — hardware/components distribution in a rising UAE ICT market, and the new software line in the region's fastest-growing segment (+13.9%).

### 4.2 UAE Regulatory Environment (time-critical)

**E-invoicing (Peppol, 5-corner model, PINT AE specification):**

| Date | Milestone |
|---|---|
| 1 Jul 2026 | Voluntary adoption window open |
| **30 Oct 2026** | Businesses with revenue ≥ AED 50M must appoint an Accredited Service Provider (ASP) |
| **1 Jan 2027** | **Mandatory Phase 1** — businesses ≥ AED 50M revenue |
| Jan–Oct 2027 | Phased extension to all other VAT-registered businesses |

Sources: UAE FTA, Thomson Reuters, Basware, Hawksford, Edicom.

**Implication for Simal:** whether or not Simal itself crosses the AED 50M threshold in Phase 1, **its trading partners are being phased in through 2027**. Every partner's TRN and Peppol ID (`0235:` + 15-digit TRN) must be accurate and machine-accessible. Simal's KYC portal already captures this data — the BRD therefore requires the integrated platform to be the **single source of truth for partner e-invoicing identifiers** before the mandate's mandatory phases, and recommends evaluating acceleration of Peppol document exchange (PRD Phase 2 → potential early Phase 2) against the FTA timeline.

**Personal data (PDPL, Federal Decree-Law No. 45 of 2021):** consent must be free, specific, informed and unambiguous; data subjects hold access/correction/deletion rights; controllers/processors carry defined obligations; cross-border transfers require adequate jurisdictions or safeguards (Art. 22); DPIAs are required for high-risk processing. The platform's KYC document vault is exactly such a high-risk processing activity → DPIA before launch (BR-24).

### 4.3 B2B Buying Behavior (the demand-side case)

| Finding | Source |
|---|---|
| 80% of B2B sales interactions occur in digital channels (2025 projection) | Gartner, *Future of Sales* |
| 67% of B2B buyers prefer a rep-free experience | Gartner buyer survey (n=646) |
| ~220-day independent research "blind spot" before sales contact | Forrester, 2025 Buyers' Journey Survey |
| Buyers spend only ~17% of buying time with suppliers' sales; ~5–6% with any single rep | Gartner |
| 94% of B2B buyers use AI/LLM tools during purchase; 51% of software buyers start research with an AI assistant more often than Google (up from 29% in Apr 2025) | 6sense; Supermarketers (Jun 2026) |

**Implication:** most of Simal's addressable demand is decided *before anyone calls*. The website is not a brochure — it is the primary sales surface for the majority of the buying journey, and content/SEO investment (BR-19) is directly a demand-generation investment. The AI-assistant finding also argues for clean, structured, machine-readable product/solution content (schema) so Simal surfaces inside AI-mediated vendor comparisons.

### 4.4 Competitive Landscape

| Competitor | Type | Digital posture (observed) | Lesson for Simal |
|---|---|---|---|
| **Redington** | Global emerging-markets distributor, strong MEA | "Reducing Technology Friction"; credential strips (US$10B+, 450+ brands, 40 markets); Redington Online B2B portal with credit & tracking; CloudQuarks; persistent "Become a Partner"; 39,500+ partners, 290+ brands, 70+ offices | Partner-first digital journeys and proof-at-scale credentials win vendor and reseller confidence |
| **Ingram Micro** | Global broadline | Xvantage AI-driven platform; 165K customers / 1,500+ vendors; dual "Become a Customer / Vendor" journeys; ESG pillar | Platform narrative + self-service onboarding both sides of the marketplace |
| **CDW** | US solutions integrator | Vertical segmentation (Enterprise, Finance, Government, Retail, SMB); Insights hub; account-centric commerce | Vertical content + resource hub structure converts research traffic |
| **MITSUMI** | Regional (Dubai HQ, est. 1998) IT/telco/enterprise distributor | Regional scale distribution, ~419 staff | Direct regional peer — Simal's digital elevation differentiates against like-for-like scale |
| **ASBIS** | EMEA value-added distributor | Double-digit growth reported 2025; value-added positioning | Services/solutions attach is where distribution margin is heading |

**Positioning gap Simal can own:** no regional distributor of Simal's profile currently combines *(a) authorized hardware distribution, (b) in-house IT solutions/services, and (c) a group software house (Unisoft) building ERPs for exactly the channel Simal serves — presented digitally as one credible group. The BRD's brand requirements (BR-01…BR-06) operationalize this "distribute **and** build" positioning.

### 4.5 Bangladesh Software Industry — the Unisoft Delivery Advantage

- BASIS (the industry association, of which Unisoft is a member) estimates national IT/ITES exports at **~US$1.4–1.5B/yr**, across **800+ registered companies**, with an articulated ambition of US$20B by 2031; the country produces **~20,000+ IT graduates annually** (commonly cited).
- Unisoft-specific: 40+ engineers (BUET/DU/NSU recruitment), 150+ projects, ISO 9001/27001, SOC 2, 24/7 support, rates **60–70% below US/EU benchmarks**, 10+ ERPs and 10+ specialized systems (incl. **Distribution ERP** and **UniPOS** — directly salable into Simal's channel).

**Implication:** the software line is not a speculative venture — it is a channel-arbitrage play: proven products + offshore economics + Simal's Middle East market access and UAE compliance wrapper.

### 4.6 SWOT Analysis

| **Strengths** | **Weaknesses** |
|---|---|
| 20+ yr trading history; 20+ brand authorizations incl. exclusivity claims (UGREEN — pending verification); JAFZA warehousing; group breadth (distribution + services + software); functioning KYC/Peppol data capture; multi-region channel; award recognition (Hikvision, TeamGroup) | Sub-scale digital presence; WhatsApp-dependent demand capture; no partner self-service; fragmented partner data; no Arabic; unverified public claims; small marketing content engine; 11–50 headcount limits execution bandwidth |
| **Opportunities** | **Threats** |
| UAE ICT growth (~8.4% CAGR to 2035); MENA software +13.9%; e-invoicing mandate creates onboarding demand Simal can serve; AI-era content visibility (early movers); Phase 2 B2B portal monetization; software attach to existing channel; CIS/Africa expansion presented credibly | Competitors industrializing digital channels faster; vendor authorization consolidation to larger distributors; e-invoicing compliance penalties if partner data is wrong; Peppol timeline compression; talent acquisition competition in UAE; currency/logistics volatility in CIS/Africa corridors |

---

## 5. Business Objectives & Success Criteria

### 5.1 Business Objectives (BO)

| ID | Business objective | Alignment (PRD) | Horizon |
|---|---|---|---|
| **BO-1** | **Elevate brand to win vendor authorizations and enterprise trust** — present Simal at benchmark distributor standard bilingually | O1 | Launch |
| **BO-2** | **Digitize demand capture** — replace untracked WhatsApp-only intake with attributable RFQ pipeline (target ≥50 RFQs/month by month 6) | O4, O7 | 6 months |
| **BO-3** | **Launch the software business with a credible storefront** — ≥10 qualified software consultations/month by month 6 | O2 | 6 months |
| **BO-4** | **Unify the partner lifecycle** — fully integrate KYC onboarding into the platform (retire the standalone portal) with zero functionality loss and ≥30 new partner submissions/month | O3, O4 | Launch + 6 months |
| **BO-5** | **Achieve e-invoicing readiness ahead of mandate** — single source of truth for partner TRN/Peppol IDs before 1 Jan 2027, with data quality ≥98% | PRD FR-K.28/29 (accelerated) | Q4 2026 |
| **BO-6** | **Comply with UAE PDPL** across all data capture — consent, DSR workflows, DPIA for the KYC vault | PRD NFR-5, FR-K.20 | Launch |
| **BO-7** | **Build employer brand & internal efficiency** — careers capability live; leads auto-routed to CRM reducing manual handling ≥40% | O6, O7 | 6 months |
| **BO-8** | **Grow organic demand** — +100% organic sessions and ≥15 non-brand first-page keywords by month 6 | O1, SEO | 6 months |

### 5.2 Business KPIs & Targets

*(Measurability framework; technical instrumentation per PRD §15. Baselines to be captured in the 4 weeks pre-launch.)*

| KPI | Baseline | Target (6 mo) | Linked BO |
|---|---|---|---|
| Organic sessions / month | Measure pre-launch | +100% | BO-8 |
| Non-brand keywords in top 10 | ~0 (est.) | ≥15 | BO-8 |
| RFQ submissions / month | ~0 via site (all WhatsApp today) | ≥50 | BO-2 |
| RFQ → sales-qualified lead | n/a | ≥20% | BO-2 |
| Partner onboarding submissions / month | Portal baseline (export & measure) | ≥30 | BO-4 |
| Onboarding completion rate (started→submitted) | Measure | ≥60% | BO-4 |
| Review SLA compliance (2 business days) | Current portal record | ≥95% | BO-4 |
| Partner TRN/Peppol data completeness & validity | Measure at migration | ≥98% | BO-5 |
| Software consultations / month | 0 | ≥10 | BO-3 |
| IT-services consultation requests / month | 0 (no services surface today) | ≥8 | BO-2 |
| Software consultation → qualified opportunity | n/a | ≥30% | BO-3 |
| Careers applications / month (when roles listed) | 0 | ≥10 | BO-7 |
| Manual lead-handling time | Measure | −40% | BO-7 |
| Arabic session share | 0% (no AR today) | ≥15% | BO-1 |
| Usability (SG-3 gate) | n/a | SUS ≥80; core-task success ≥90% (per URD §13) | BO-1/BO-2 |
| Bounce rate / session duration | Measure | <45% / >2:00 | BO-1 |

---

## 6. Stakeholder Analysis & Governance

### 6.1 Stakeholder Map

| Stakeholder | Interest | Influence | Engagement approach |
|---|---|---|---|
| **Executive Sponsor (Simal management/board)** | Growth, brand, compliance, ROI | High | Approve BRD/PRD; stage-gate reviews; monthly KPI dashboard |
| **Sales team (inside/outside)** | Lead flow, less admin, commission relevance | High | Co-design RFQ routing; training; adoption incentives |
| **Accounts/Finance team** | KYC integrity, e-invoicing data, review workload | High | Own §9.1/§9.6 processes; UAT owners of review console |
| **Marketing lead (Product Owner)** | Brand, content, SEO, campaigns | High | Day-to-day decisions; content calendar; CMS owner |
| **Unisoft Systems Ltd** | Software business success, regional references | Medium-High | Joint workstream: software content, demo process, delivery SLAs |
| **Vendors/brand principals** (Crucial, Hikvision, TeamGroup, UGREEN…) | Brand representation, co-marketing, authorization case | Medium | Brand-page review; asset permissions; joint campaigns |
| **Channel partners (resellers/SIs)** | Easy onboarding, availability, pricing speed | Medium | Beta group for onboarding UAT; feedback loop |
| **IT/technical owner & delivery vendor** | Build feasibility, security, operations | High | Architecture per PRD §13; cutover command |
| **End customers & software buyers** | Information, quotes, support | Low (indirect) | Usability testing; NPS feedback post-launch |
| **UAE regulators (FTA, data office)** | E-invoicing & PDPL compliance | External | Compliance-by-design; counsel review of legal pages |

### 6.2 Governance & Decision Rights (RACI summary)

| Decision | Sponsor | Product Owner | Tech Owner | Accounts | Unisoft |
|---|---|---|---|---|---|
| Approve BRD/PRD & budget | **A** | R | C | C | I |
| Platform/vendor selection | A | **R** | **R** | I | I |
| Scope/priority changes within budget | I | **A/R** | C | C | C |
| KYC feature parity & migration sign-off | I | C | R | **A** | I |
| Public claims & credentials approval | **A** | R | I | C | I |
| Software offer definition & pricing | A | R | I | C | **R** |
| Go/no-go launch | **A** | R | R | C | I |

**Stage gates:** SG-1 design approved (end P0) · SG-2 content/migration readiness (end P2) · SG-3 QA/UAT pass (end P3) · SG-4 launch (P4) · SG-5 post-launch review (+30 days). *(SG gates are BRD decision points; PRD "G-n" refers to the current-site gap register.)*

---

## 7. Business Requirements

> Convention: `BR-nn` — business requirement (what the business needs and why). Priority: M (Must — launch-blocking), S (Should), C (Could). Each traces to PRD requirements (Appendix A).

### A. Brand, Positioning & Credibility

| ID | Requirement | Rationale (business value) | Pri | PRD trace |
|---|---|---|---|---|
| BR-01 | The platform must present Simal as a leading Middle East IT distributor at visual/informational parity with benchmark competitors (CDW/Redington/Ingram class), in English **and** Arabic (RTL) | Wins vendor authorizations & enterprise trust; Arabic opens UAE/GCC public-sector-adjacent demand | M | FR-1.1, D-1, O1 |
| BR-02 | A group-level narrative must present the full offer: distribution + IT services + software (Unisoft) as one family ("distribute **and** build") | Differentiation no regional peer owns (§4.4) | M | FR-3.1, FR-3.2 |
| BR-03 | Credential proof-points (years, brands, clients, markets, awards) must be displayed with **static fallbacks** and must be management-validated before publication | Credibility; eliminates today's "0+" placeholder embarrassment and claim risk | M | FR-2.2, C-4, BRule-8 |
| BR-04 | Each of the 20+ brands must have a professional landing page capable of supporting authorization discussions and co-marketing | Directly supports authorization retention/expansion (BO-1) | M | FR-4.1, O5 |
| BR-05 | Awards (Hikvision, TeamGroup) and authorized-distributor status must be prominently showcased | Third-party validation at decision moments | M | FR-2.9, FR-3.5 |
| BR-06 | The platform must eliminate public inconsistencies (single reconciled support-hours schedule; removal of test/draft/broken pages) | Operational & reputational hygiene | M | FR-9.1, G13/G14 |

### B. Distribution Commerce & Demand Capture

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-07 | Buyers must be able to request quotes for any product/solution via structured RFQ (multi-item, anonymous or signed-in), with ≤1-business-day response SLA | Converts research-phase demand (§4.3) into attributable pipeline (BO-2) | M | FR-4.4, FR-2.12 |
| BR-08 | WhatsApp remains a first-class channel alongside (not instead of) RFQ, with context pre-filled | Protects current revenue behavior while adding structure (R9) | M | FR-1.5, INT-1 |
| BR-09 | All leads (RFQ, enquiry, software, careers) must route automatically to the CRM with department rules, owner assignment, and SLA alerting | Ends untracked demand; enables KPI measurement (BO-2, BO-7) | M | FR-9.2, INT-2 |
| BR-10 | Catalog must scale to 5,000 SKUs with facets, variants, EOL handling and bilingual content (76 SKUs migrate at launch) | Growth headroom without replatform | M | FR-4.2, FR-4.5, NFR-10 |
| BR-11 | Prices remain quote-based (no public pricing, no online payment in Phase 1) | Protects channel pricing discipline; matches B2B norms | M | §6.3 PRD, BRule-1 |

### C. Software Services Business (with Unisoft)

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-12 | A dedicated Software Services section must launch with the site: 12 services, 15 packaged products, 8 industry pages, engagement models — co-branded "Simal + Unisoft" | The new business needs a demand surface from day one (BO-3); MENA software +13.9% (§4.1) | M | FR-6.1…6.4, FR-6.8 |
| BR-13 | Software demand capture must include consultation requests **and** product demo booking, routed to a distinct CRM pipeline owned jointly by Simal & Unisoft | Different sales motion (solution selling) vs. distribution transactional flow | M | FR-6.7, FR-K.32 |
| BR-14 | The section must present delivery credibility honestly: Unisoft certifications (ISO 9001/27001, SOC 2), 150+ projects, 40+ engineers, 24/7 support — with partner consent | Buyer trust for offshore-anchored delivery; legal safety | M | FR-6.1, A3 |
| BR-15 | Launch case studies must exist (≥2: one distribution, one software/anonymized Unisoft) | Proof at the moment of consideration; both businesses | M | FR-6.6, C-6 |

### D. Partner Lifecycle & KYC (Integrated)

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-16 | All partner onboarding/KYC functionality must be **fully integrated** into simalme.com — one platform, one account, one brand — replacing the standalone kyc.simalme.com experience with **zero functionality loss** (parity checklist) | Stakeholder directive; removes silo, cuts drop-off, unifies partner record | M | FR-K.1…K.5, §9 PRD |
| BR-17 | Existing applications, documents, audit logs and emailed resume/track links must migrate losslessly with a reconciliation report signed by Accounts | Continuity of in-flight business; no dead links in partners' inboxes | M | FR-K.34…K.37 |
| BR-18 | The integrated platform must be the **single source of truth for partner TRN/Peppol e-invoicing identifiers**, complete and validated (≥98%) before 1 Jan 2027 | UAE e-invoicing mandate (§4.2); BO-5 | M | FR-K.28/29, INT-6 |
| BR-19 | Partner review SLA (2 business days) must be preserved and **measured** (≥95% compliance), on a business-day calendar reconciled to official working hours | Service promise partners rely on; operational discipline | M | FR-K.39/40, FR-9.1 |
| BR-20 | Post-approval partner dashboard must surface KYC status, document expiry alerts and (Phase 2) RFQ history/pricing | Retention & re-validation automation; Phase 2 portal foundation | M / S | FR-K.15/16, §6.2 PRD |

### E. Compliance & Data Protection

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-21 | All personal-data capture must implement PDPL consent standards (free, specific, informed, unambiguous) with published privacy notices (AR+EN) | Legal compliance (§4.2) | M | NFR-5/12, FR-9.3 |
| BR-22 | Data-subject rights (access, correction, deletion, restriction) must have workable workflows; KYC document retention follows UAE commercial record-keeping with admin-configurable purge | PDPL obligations vs. legal retention tension resolved by policy | M | FR-K.20/21 |
| BR-23 | Cross-border data handling (e.g., Unisoft/Bangladesh delivery teams touching platform data) must follow Art. 22 safeguards; architecture must allow data residency controls | PDPL Art. 22; group operating model | M | NFR-3/5, §13.2 PRD |
| BR-24 | A DPIA must be completed for the KYC document vault (and any high-risk processing) before launch, with remediations tracked | PDPL expectation; also good security practice | M | FR-K.18…22 |
| BR-25 | Security posture must include encrypted document storage, immutable audit logs (≥5 yrs), MFA for staff, and pre-launch penetration test of auth+KYC flows | Protects the company's most sensitive data (partner legal/banking documents) | M | NFR-3/4, FR-K.18/19/41 |

### F. Content, Communications & Talent

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-26 | An Insights/content engine (blog, case studies, newsroom, downloads) must launch with migrated content and operate on a calendar (2 distribution + 1 software posts/month) | Sustains the 220-day research visibility (§4.3); SEO compounding | M | FR-7.1…7.6, SEO-6 |
| BR-27 | Newsroom must support vendor/partner moments (awards, events like Hikvision MEA ND Summit, product launches) with a press kit | Amplifies vendor relationships; PR readiness | S | FR-7.4 |
| BR-28 | Careers section must present employer brand and accept applications even without live vacancies (never an empty state) | BO-7; fixes G4 | M | FR-8.1…8.3 |

### G. Operations & Analytics

| ID | Requirement | Rationale | Pri | PRD trace |
|---|---|---|---|---|
| BR-29 | Full-funnel analytics (GA4 events per PRD §15) must be live at launch, feeding the KPI dashboard in §5.2 | "What gets measured…" — every BO depends on it | M | §15 PRD |
| BR-30 | Non-staff must not see internal content; staff roles (reviewer/admin/editor) segregated; KYC documents least-privilege | Data integrity; audit cleanliness | M | FR-K.23, NFR-4 |
| BR-31 | Site operations must meet 99.9% uptime with tested backups/restores and a runbook handover | Distribution is a promise-keeping business; downtime = channel damage | M | NFR-2/11/13 |
| BR-32 | SEO migration must preserve existing equity: full 301 map (incl. kyc.simalme.com ≥24 months), sitemaps, canonicals, structured data | Protects hard-won rankings during replatform | M | SEO-7, FR-K.36 |

### H. IT Solutions & Services (added v1.2 — closes the FR-5 chain)

| ID | Requirement | Rationale (business value) | Pri | PRD trace |
|---|---|---|---|---|
| BR-33 | The platform must present Simal's **12 existing IT solution/service lines** (AMC, IT infrastructure, managed services, network & IT security, firewall, cloud security, data recovery & storage, structured cabling, IP telephony, AV & meeting rooms, support & maintenance, software & licensing) with consultation-based demand capture routed to services sales, plus industry propositions linking services + hardware + software | Services are the second existing revenue stream (§2.2) yet had no digital demand surface, no BR anchor, and no URD user requirements — the chain PRD FR-5 ↔ BR-33 ↔ UR-45…47 now closes it; services attach is where distribution margin grows (§4.4 ASBIS lesson) | M | FR-5.1/5.2, UR-45…47 |

---

## 8. Business Process Requirements (As-Is → To-Be)

### 8.1 Partner Onboarding & KYC

| Stage | As-Is (today) | To-Be (platform) |
|---|---|---|
| Discover | Partner finds kyc.simalme.com via email link or footer | "Become a Partner" CTA on every page; contextual entry from RFQ flow |
| Apply | Separate portal, separate look; ~10-min forms, auto-save, fix-flagged-items | Same wizard embedded in simalme.com; single account; identical UX features (parity) |
| Submit documents | Encrypted upload (portal) | Same, inside platform vault; virus-scan; expiry capture |
| Review | Staff portal; ~2 business days; email back-and-forth | Staff console `/admin/kyc` with SLA aging, per-field flags, bulk actions; ≥95% SLA |
| Track | Applicant re-opens portal links | In-site dashboard + notifications; resume links preserved |
| Trade | Manual re-entry into accounting/ops tools | Partner record (incl. TRN/Peppol ID) is the master data feeding e-invoicing readiness |
| Re-validate | Ad-hoc expiry chasing | Automated T-30/T-7/T-0 reminders; expiry report for Accounts |

**Process KPIs:** onboarding completion ≥60%; review SLA ≥95%; data validity ≥98% (BO-4/5).

### 8.2 Quote-to-Order (Distribution)

| Stage | As-Is | To-Be |
|---|---|---|
| Research | Buyer browses static catalog or asks on WhatsApp | Rich bilingual catalog, specs, brand pages, insights; found via search/AI assistants |
| Request quote | "Call For Price" → WhatsApp message (untracked) | Structured RFQ basket (multi-item) or WhatsApp with context — both land in CRM |
| Respond | Sales quotes manually; speed depends on individual | RFQ queue with 1-business-day SLA, templates, auto-acknowledgement |
| Convert | Verbal/WhatsApp order | RFQ → order (manual) now; Phase 2 partner portal (pricing/stock/credit) |
| Learn | No data | Funnel analytics: RFQ volume, conversion, item mix, source attribution |

### 8.3 Software Lead-to-Project (Simal + Unisoft)

New process (no as-is): consultation/demo request → joint qualification (Simal sales + Unisoft pre-sales) → discovery workshop → proposal (fixed/T&M/dedicated) → Agile delivery with 24/7 support backstop → case study. **Owner:** joint workstream; **CRM pipeline:** separate from distribution; **SLA:** first response ≤1 business day, proposal ≤5 business days post-discovery.

### 8.4 Content Publishing

As-is: ad-hoc WordPress posts by agency/staff. To-be: Product-Owner-governed calendar (2 distribution + 1 software/month), CMS workflow (draft→review→publish bilingual), quarterly brand-page refresh, campaign support for launches.

### 8.5 Careers & Applications

As-is: static empty page. To-be: CMS-managed roles + speculative-application CTA; applications routed to HR with CV upload & PDPL consent; JobPosting schema for visibility.

### 8.6 Compliance Operations (PDPL + e-invoicing)

New process: DSR intake (privacy@ alias) → verify identity → execute access/correction/deletion within policy timelines → log; quarterly KYC data-quality audit (TRN/Peppol completeness); annual DPIA review; e-invoicing readiness tracking against FTA phases (§4.2).

---

## 9. Business Rules & Policies

| ID | Rule / Policy |
|---|---|
| BRule-1 | **No public prices, no online payment** in Phase 1. All commerce is quote-based (RFQ) or WhatsApp-assisted. Currency display AED (toggle USD display-only). |
| BRule-2 | **RFQ response SLA:** 1 business day. **KYC review SLA:** 2 business days. Breaches alert the responsible manager (dashboard + email). |
| BRule-3 | **One official working-hours schedule** governs the site, KYC SLA calendar, and all published materials — reconciled by management before launch (resolves Contact-page vs KYC-portal conflict, PRD G14). |
| BRule-4 | **KYC data retention:** trade documents retained per UAE commercial record-keeping requirements; personal data of unsuccessful applicants purged after 12 months unless consented otherwise; audit logs ≥5 years. |
| BRule-5 | **Document access:** least-privilege; every view/download audit-logged; no KYC document leaves the vault via email. |
| BRule-6 | **Lead routing:** RFQ → distribution sales; software consultation/demo → joint Simal+Unisoft pipeline; partnerships (vendors) → management; careers → HR; support → service desk. Auto-acknowledgement on every form. |
| BRule-7 | **Partner record governance:** the platform is the single source of truth for partner legal/banking/TRN/Peppol data; downstream systems consume, never duplicate-edit. |
| BRule-8 | **Public claims register:** every public number/claim (1000+ customers, UGREEN exclusivity, awards, certifications, market reach) is logged with evidence and management sign-off; unverifiable claims are not published. |
| BRule-9 | **Bilingual parity:** Arabic versions of all commercial and compliance content (incl. onboarding wizard) are first-class; EN-only pages must be flagged and scheduled. |
| BRule-10 | **Vendor brand usage:** logos, award marks and certification badges used only with documented permission; brand pages follow each vendor's trademark guidelines. |
| BRule-11 | **Consent:** no marketing contact without opt-in (double opt-in for newsletter); cookie consent with granular categories; consent records timestamped. |
| BRule-12 | **Change control:** scope changes affecting BR/BO or budget require Sponsor approval (RACI §6.2); all other changes via Product Owner decision log. |

---

## 10. Constraints, Assumptions & Dependencies

**Constraints**
1. Launch timeline aspiration compresses around e-invoicing dates and business seasonality ( Ramadan/summer trading patterns).
2. Team of 11–50: internal bandwidth for content production, UAT and post-launch ops is limited — agency dependency acknowledged.
3. Budget envelope to be set by the Board (CBA §11 provides tiered planning ranges); no online payments in Phase 1 constrains monetization design (deliberate).
4. Current WordPress content model and KYC portal data structure bound migration effort.
5. PDPL Art. 22 constrains where personal data may be processed/stored (affects hosting & Unisoft access design).

**Assumptions**
1. Management validates public credentials and the official working-hours schedule (BRule-3/8) during P0.
2. Unisoft consents to co-branding, supplies collateral, and commits pre-sales capacity to the joint pipeline. ⚠ **Verified 3 Oct 2026:** Unisoft's public case-studies page is empty ("0 case studies available") — the ≥2 launch case studies (BR-15) must be **commissioned directly from Unisoft** (anonymized write-ups from their 150+ claimed projects) with Simal management approval; this is a content dependency, not a nice-to-have.
3. The KYC portal's data is fully exportable; Accounts allocates UAT and migration-reconciliation effort.
4. A CRM is selected (HubSpot/Zoho/other) by build start; transactional email service procured.
5. Existing brand authorizations remain valid through launch; permissions for logos/awards obtainable.
6. Baseline metrics (traffic, WhatsApp order volume) are measurable for the 4 weeks pre-launch.

**Dependencies**
1. Vendor/agency selection and contract (against PRD §13.1 recommendation).
2. DNS control of simalme.com and kyc.simalme.com for cutover & redirects.
3. UAE counsel review of privacy/terms/cookie policies (AR+EN).
4. FTA communications: confirm Simal's own Phase (1 vs later) and ASP path; monitor Peppol timeline for acceleration decision.

---

## 11. Cost-Benefit Analysis

> **Planning-grade figures only.** Ranges reflect regional market norms for this scope; vendor quotations govern. Finance to validate before budget approval.

### 11.1 Investment (Phase 1, ~20 weeks)

| Cost line | Range (USD) | Notes |
|---|---|---|
| Discovery, UX/UI design (design system, EN/AR) | 8,000 – 20,000 | Includes RTL design |
| Platform build (site + catalog + RFQ + software section + CMS) | 35,000 – 80,000 | Headless CMS + Next.js per PRD §13.1-A |
| KYC integration (wizard, vault, console, migration) | 20,000 – 45,000 | Custom modules; parity-gated |
| Content production (bilingual copy, 15 software pages, case studies, photography) | 8,000 – 18,000 | Agency + internal |
| Migration & SEO (301 map, KYC reconciliation) | 4,000 – 10,000 | |
| QA, accessibility, security testing & pen-test | 5,000 – 12,000 | KYC/auth focus |
| **Total Phase 1** | **≈ 80,000 – 185,000** | Mid-case ≈ 120,000–140,000 |
| Run-rate (hosting, CDN, licenses, email, monitoring, maintenance) | 12,000 – 30,000 / yr | Excl. internal staff |
| Phase 2 (partner portal, Peppol exchange, automation) | 40,000 – 90,000 | Post-launch business case |

> **Currency note (FX assumption):** planning figures are stated in USD; order-value examples reference AED. Finance should validate at a fixed planning rate (e.g., USD/AED 3.67 peg) and restate the CBA in AED if preferred before budget approval.

### 11.2 Benefit Drivers (qualitative-quantitative)

| Driver | Mechanism | Indicative annual value logic |
|---|---|---|
| RFQ pipeline | ≥50 RFQs/mo × ≥20% SQL × historical order values | Even at conservative AED 5–15k average order and partial conversion, incremental attributable revenue compounds monthly; measurement makes channel mix optimizable for the first time |
| Software revenue line | ≥10 consultations/mo × ≥30% qualified × project values (ERP/POS projects typically US$15k–150k in region; Unisoft cost base supports aggressive but profitable pricing) | One won mid-size ERP/yr can exceed the entire Phase-1 mid-case build cost |
| Authorization economics | Credible brand pages & coverage story → retained/expanded vendor lines | Each authorization = margin stream; hard to quantify, strategically primary |
| Onboarding efficiency | Integrated KYC, automated reminders, ≥95% SLA | Accounts-team hours saved; fewer drop-offs; faster first orders |
| Compliance risk avoided | Correct TRN/Peppol data & PDPL posture | Avoids mandate-era penalties & remediation costs (unquantified but real) |
| Marketing efficiency | Organic growth (+100% sessions target) reduces paid dependency | Compounding; content assets reusable across channels |

### 11.3 ROI Logic & Sensitivity

- **Payback horizon:** mid-case investment (~US$130k) is recovered if the platform contributes roughly **one mid-size software project per year** *or* a sustained uplift of a few percentage points in distribution quote conversion — both below the KPI targets in §5.2. If both businesses hit only **half** their 6-month targets, payback still lands within ~18–24 months.
- **Downside protection:** even at zero incremental revenue, the platform delivers mandatory-compliance readiness (BO-5/6), brand parity for authorization defense, and operational savings — i.e., a substantial floor under the investment.
- **Upside:** Phase 2 partner portal converts the platform into a transactional channel with direct revenue attribution.

**Recommendation:** approve mid-case budget envelope with stage-gated release (SG-1…SG-4); require baseline capture and KPI dashboard from day one so §5.2 can be evaluated honestly at month 6.

---

## 12. Business Risk Register

| ID | Risk | Cat. | L | I | Mitigation | Owner |
|---|---|---|---|---|---|---|
| RSK-1 | KYC migration loses data or breaks in-flight applications | Op | M | H | Reconciliation report; token-mapped links; parallel-run console; parity gate (PRD §9.10) | Accounts + Tech |
| RSK-2 | E-invoicing timeline compresses; partner data incomplete at 1 Jan 2027 | Reg | M | H | BO-5 data-quality program (≥98%); FTA phase confirmation; evaluate accelerating Peppol exchange | Finance |
| RSK-3 | Content/credentials not validated → launch slip or claim exposure | Rep | H | M | P0 owners & claims register (BRule-8); no-empty-sections rule | Product Owner |
| RSK-4 | Dual-business messaging confuses buyers or dilutes distribution brand | Mkt | M | M | IA separation; homepage A/B; message testing in P0 | Marketing |
| RSK-5 | Unisoft capacity/consent misaligns (co-branding, pre-sales response, case-study material — their public case-studies page is empty) | Op | M | M | MOU covering branding, SLAs, collateral **and commissioned case studies**; joint pipeline ownership | Sponsor |
| RSK-6 | SEO equity loss on replatform | Mkt | M | H | Full 301 map incl. kyc subdomain; Search Console monitoring 30 days | Tech + Marketing |
| RSK-7 | Security breach of KYC vault | Sec | L | H | BR-25 controls; pen-test; DPIA; least privilege | Tech |
| RSK-8 | PDPL non-compliance (consent, DSR, cross-border) | Reg | M | H | BR-21…24; counsel review; DSR workflow tested pre-launch | Legal/Tech |
| RSK-9 | Sales team bypasses RFQ (WhatsApp habit persists) → KPIs miss | Org | M | M | RFQ designed as *acceleration not replacement* (BR-08); training; adoption incentives; CRM single-view | Sales lead |
| RSK-10 | Vendor/budget overrun on custom KYC build | Fin | M | M | Parity-scoped fixed packages; stage-gated payments; RSK-10 watch in steering | Sponsor |
| RSK-11 | Arabic quality issues damage credibility | Rep | M | M | Professional translation + native review of commercial/KYC content | Marketing |
| RSK-12 | Competitor digital moves outpace (Redington MEA, Ingram Xvantage, MITSUMI) | Mkt | M | M | Launch discipline (roadmap gates); Phase 2 roadmap pre-approved trigger points | Sponsor |
| RSK-13 | Key-person dependency in an 11–50 person org | Org | M | M | Runbooks, CMS training, cross-training, agency retainer | Product Owner |

---

## 13. Change Management, Training & Adoption

1. **Launch communications:** internal kickoff presentation (why/what/when); partner-facing email announcing the integrated onboarding (and what changes for them — nothing lost, links preserved); public launch announcement/PR.
2. **Training:**
   - Sales: RFQ queue, CRM routing, WhatsApp+RFQ parallel play, KPI dashboard.
   - Accounts: review console, SLA dashboard, expiry reports, migration exceptions.
   - Marketing: CMS bilingual workflows, SEO checklist, analytics.
   - Leadership: KPI dashboard read-outs (monthly).
3. **Adoption incentives:** RFQ response SLA in individual scorecards; KYC SLA in Accounts scorecards; content calendar ownership named.
4. **Support model:** 30-day hypercare post-launch; runbook; issue triage channel; quarterly release train thereafter.
5. **Feedback loops:** partner beta group for onboarding UX; site feedback widget; monthly KPI review vs. §5.2 with corrective actions.

---

## 14. Approval & Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Executive Sponsor / Management | | | |
| Product Owner (Marketing) | | | |
| Technical Owner | | | |
| Accounts / Finance Workstream Lead | | | |
| Software Business Lead (Simal + Unisoft) | | | |

**Approval constitutes:** acceptance of business objectives (§5), requirements (§7), rules (§9), budget approach (§11), and authorization to proceed to vendor selection against PRD v1.4 / URD v1.2 / FRS v1.2.

---

## 15. Appendices

### Appendix A — Traceability Matrix (BR → PRD → BO/KPI)

| BR | PRD trace (summary) | BO | Primary KPI |
|---|---|---|---|
| BR-01 | FR-1.1, D-1 | BO-1 | Bounce <45%; AR share ≥15% |
| BR-02 | FR-3.1/3.2 | BO-1 | Vendor/enterprise engagement (qual.) |
| BR-03 | FR-2.2, C-4 | BO-1 | Claims register complete (gate) |
| BR-04 | FR-4.1 | BO-1 | Brand-page coverage 20+ |
| BR-05 | FR-2.9, FR-3.5 | BO-1 | Award/authorization pages live |
| BR-06 | FR-9.1, G13/14 | BO-1 | Zero public inconsistencies (gate) |
| BR-07 | FR-4.4 | BO-2 | ≥50 RFQ/mo; ≥20% SQL |
| BR-08 | FR-1.5, INT-1 | BO-2 | WhatsApp click tracking |
| BR-09 | FR-9.2, INT-2 | BO-2/7 | CRM routing live; −40% handling |
| BR-10 | FR-4.2/4.5, NFR-10 | BO-2 | Catalog perf at scale |
| BR-11 | PRD §6.3, BRule-1 | BO-2 | (policy) |
| BR-12 | FR-6.1…6.4 | BO-3 | ≥10 consults/mo |
| BR-13 | FR-6.7 | BO-3 | ≥30% qualified |
| BR-14 | FR-6.1, A3 | BO-3 | Credibility assets live |
| BR-15 | FR-6.6, C-6 | BO-3 | ≥2 case studies (gate) |
| BR-16 | FR-K.1…K.5 | BO-4 | Parity checklist pass (gate) |
| BR-17 | FR-K.34…37 | BO-4 | Reconciliation signed (gate) |
| BR-18 | FR-K.28/29 | BO-5 | ≥98% TRN/Peppol validity |
| BR-19 | FR-K.39/40 | BO-4 | ≥95% SLA compliance |
| BR-20 | FR-K.15/16 | BO-4 | Dashboard adoption |
| BR-21 | NFR-5/12 | BO-6 | Consent/notice coverage 100% |
| BR-22 | FR-K.20/21 | BO-6 | DSR workflow tested |
| BR-23 | NFR-3/5, §13.2 | BO-6 | Architecture review pass |
| BR-24 | FR-K.18…22 | BO-6 | DPIA completed (gate) |
| BR-25 | NFR-3/4 | BO-6 | Pen-test clean (gate) |
| BR-26 | FR-7.x, SEO-6 | BO-8 | Content calendar adherence |
| BR-27 | FR-7.4 | BO-1 | Newsroom live |
| BR-28 | FR-8.x | BO-7 | ≥10 applications/mo |
| BR-29 | PRD §15 | All | GA4 events verified |
| BR-30 | FR-K.23, NFR-4 | BO-6 | Access audit pass |
| BR-31 | NFR-2/11/13 | BO-2 | ≥99.9% uptime |
| BR-32 | SEO-7, FR-K.36 | BO-8 | 301 coverage 100% |
| BR-33 | FR-5.1/5.2 | BO-2 | ≥8 IT-services consults/mo |

### Appendix B — Research Sources & Citations (accessed 3 Oct 2026)

**Market data**
- Gartner worldwide IT spending forecasts (US$6.08T 2026, later ~$6.3–6.4T): [Lelezard/Gartner summary](https://www.lelezard.com)
- Gartner worldwide AI spending US$2.7T 2026 (+49.5%): [Gartner](https://www.gartner.com)
- MENA IT spending US$169B 2026; MENA software US$20.4B (+13.9%): Gartner via [CXO Insight ME](https://cxoinsightme.com)
- MENA ICT ~US$230.7B 2025 (broader measure); channel-enablement trends: [ChannelPost MEA](https://channelpostmea.com)
- UAE ICT market ~US$23.7B (2026) → ~US$49.0B (2035), 8.4% CAGR: MarkWide Research via aggregator reporting
- UAE data-center investment (~AED 4B by 2026): Research and Markets

**Regulatory**
- UAE e-invoicing program (Peppol 5-corner, PINT AE; 1 Jul 2026 voluntary; 30 Oct 2026 ASP deadline ≥AED 50M; 1 Jan 2027 Phase 1 mandatory; 2027 phased rollout): [FTA](https://tax.gov.ae), [Thomson Reuters](https://europe.thomsonreuters.com), [Basware](https://www.basware.com), [Hawksford](https://www.hawksford.com), [Edicom](https://edicomgroup.com), [TrustBill](https://trustbill.ae)
- UAE PDPL (Federal Decree-Law No. 45 of 2021): consent standards, data-subject rights, controller/processor obligations, Art. 22 cross-border safeguards, DPIA — legal-guidance summaries (AuditDSS, eLegal, LexLint, GenieAI); counsel review recommended

**B2B buying behavior**
- 80% of B2B sales interactions digital (Gartner Future of Sales); 67% rep-free preference (Gartner, n=646); ~17%/5–6% supplier-time findings: [UpLead statistics roundup](https://uplead.com)
- ~220-day buying blind spot (Forrester 2025 Buyers' Journey Survey): [Forthea](https://forthea.com)
- 94% of B2B buyers use LLMs; 51% of software buyers start with AI assistants: 6sense/Supermarketers via [Forthea](https://forthea.com), [Enrich Labs](https://www.enrichlabs.ai)

**Competitive & industry**
- Redington: [redingtongroup.com](https://www.redingtongroup.com/) (incl. [contact page](https://www.redingtongroup.com/contact-us/) — enquiry-form taxonomy: represent-type, interest area, consent) · Ingram Micro: [ingrammicro.com](https://www.ingrammicro.com/) · CDW: [cdw.com](https://www.cdw.com/)
- ASBIS EMEA growth: [investor.asbis.com](https://investor.asbis.com) · MITSUMI (Dubai regional distributor): company reporting
- Bangladesh IT/ITES exports ~US$1.4–1.5B, 800+ BASIS member companies, US$20B-by-2031 ambition: BASIS via Daily Observer/Daily Star/Daily Asian Age reporting

**Unisoft deep-dive (3 Oct 2026)**
- Technology stack (44 technologies): [uslbd.com/company/technologies](https://uslbd.com/company/technologies) — feeds PRD FR-6.2 tech-stack display
- Case-studies page verified empty: [uslbd.com/case-studies](https://uslbd.com/case-studies) — drives BR-15 sourcing dependency

**Primary sources (workspace & first-party)**
- Simal mirror audit (`Mirror_site/`, 76-SKU catalog, gap register G1–G14) · simalme.com live review · kyc.simalme.com portal review · Simal LinkedIn company page · Unisoft Systems Ltd ([uslbd.com](https://uslbd.com/) services & products pages) · PRD v1.4 (same folder)

### Appendix C — Glossary

**BRD/PRD** Business/Product Requirements Document · **BO** Business Objective · **BR** Business Requirement · **BRule** Business Rule · **RSK** Risk · **RFQ** Request for Quote · **KYC** Know Your Customer · **TRN** Tax Registration Number (UAE) · **Peppol** international e-invoicing network (UAE: 5-corner model, PINT AE) · **ASP** Accredited Service Provider · **PDPL** UAE Federal Decree-Law No. 45 of 2021 · **DPIA** Data Protection Impact Assessment · **DSR** Data Subject Request · **SLA** Service Level Agreement · **SQL** Sales-Qualified Lead · **AMC** Annual Maintenance Contract · **VAD** Value-Added Distributor · **BASIS** Bangladesh Association of Software & Information Services · **JAFZA** Jebel Ali Free Zone Authority · **CRM** Customer Relationship Management · **RTL** Right-to-Left (Arabic UI)

### Appendix D — Current-State Gap Register (business impact view)

*Business pain points P1–P9 (§2.3) map 1:1 to PRD gaps G1–G14; see PRD §2.4 for evidentiary detail. Highest-business-impact items: P2 (untracked demand), P5 (KYC silo amid e-invoicing mandate), P8 (no software storefront), P1 (brand credibility).*

---

*End of BRD v1.3 — companion to PRD v1.4, URD v1.2 and FRS v1.2. Prepared from first-party research (workspace mirror, live sites, KYC portal) and market/regulatory research dated 3 October 2026, audited for cross-document consistency. All financial figures are planning-grade and require Finance validation; all public claims require management sign-off per BRule-8.*
