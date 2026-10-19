# Product Requirements Document (PRD)

## Simal Technologies — Next-Generation Corporate Website & Integrated Partner Platform

| Field | Detail |
|---|---|
| **Document Title** | Simal Technologies Corporate Website — Product Requirements Document |
| **Version** | 1.5 |
| **Date** | 3 October 2026 |
| **Status** | Draft — for stakeholder review & sign-off |
| **Prepared For** | Simal Technologies Middle East LLC (Dubai, UAE) |
| **Project Codename** | Simal Digital Platform (SDP) |
| **Product Owner** | Simal Technologies — Management / Marketing |
| **Source Research** | Workspace mirror audit (simalme.com), live site review (simalme.com, kyc.simalme.com), Unisoft Systems Ltd (uslbd.com), benchmark study (CDW, Redington, Ingram Micro), public internet research |
| **Companion Documents** | *Business Requirements Document (BRD) v1.3*, *User Requirements Document (URD) v1.2* and *Functional Requirements Specification (FRS) v1.2* — same folder. The BRD defines the business case; the URD defines users, stories, use cases and the usability validation plan (URD §13 rounds R1–R3 and SUS ≥80 are part of gates SG-1/SG-3 and §19.1 below); the FRS decomposes this PRD into 225 testable shall-requirements across 19 modules. |
| **Change Record** | v1.0 — Initial comprehensive PRD. Includes mandatory requirement: **full integration of the currently standalone Simal KYC Partner Onboarding Portal into the new platform**.<br>v1.1 — Full QA/verification pass: corrected cross-reference §9.9→§9.8; fixed GA4 event-name typos; exact catalog counts (76 products) substituted for estimates; Honeywell reclassified to power/protection per mirror evidence; **working-hours discrepancy between Contact page and KYC portal flagged for management reconciliation (FR-9.1)**; UGREEN exclusivity claim and "1000+ Customers" claim sourced (Appendix A); added §2.6 Stakeholders & Governance; added gaps G13 (test/draft content live in production) and G14 (support-hours inconsistency between Contact page and KYC portal).<br>v1.2 — Audit pass 3: brand palette grounded in actual logo assets (#0050A0 / #E01020 / #F0F000, D-2); Phlox Pro theme named as G1 evidence; FR-9.2 enriched with benchmark enquiry taxonomy (Redington contact-page pattern); FR-6.2 substantiated with Unisoft's verified 44-technology stack; FR-6.6 case-study sourcing flagged (Unisoft public case-studies page is empty — seed material must be supplied directly); FR-K.27 extended with TRN/Peppol data-quality report (closes BR-18 KPI traceability); added §19.3 Test Strategy Summary.<br>v1.3 — Audit pass 4: FR-4.4 now specifies the RFQ reference number (SIMAL-RFQ-nnnn) promised by URD UC-01/UR-11; §16 P0 includes URD R1 prototype testing; §19.1 launch gate and §19.3 UAT now bind the URD §13 usability rounds (SUS ≥80, core-task success ≥90% vs ~78% industry average); companion-document references synchronized (BRD v1.2, URD v1.1); FR-5 chain anchored to BR-33/UR-45–47.<br>v1.4 — Audit pass 5: companion row extended to the full four-document family; companion reference subsequently updated to FRS v1.2 (external-interface & assumptions sections added there — no PRD changes).<br>v1.5 — **Management correction — corporate independence:** Simal Technologies Middle East LLC is a **fully independent company with no TwinMOS or Smart Group association** (stated by management 3 Oct 2026). All TwinMOS/Smart-Group group-structure claims removed: §2 company fact table (Group row now records the correction; "TwinMOS Technologies ME FZE" entity removed), brand list corrected to **23 brands** (TwinMOS was never in the site catalog — the attribution came from directory listings), §3.1 content plan (group story → independent company story), §7.2 sitemap (Group Companies → Companies & Partners), FR-3.2 rewritten as "Company & partners page" without group narrative, Appendix A fact sheet and Appendix D brand list corrected, Appendix E sources annotated (directory-based association withdrawn). Unisoft Systems Ltd retained throughout, reframed from "sister software house" to **"software delivery partner."** |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Strategic Context](#2-background--strategic-context)
3. [Research Findings](#3-research-findings)
4. [Vision, Objectives & Success Criteria](#4-vision-objectives--success-criteria)
5. [Target Audiences & Personas](#5-target-audiences--personas)
6. [Scope](#6-scope)
7. [Information Architecture & Sitemap](#7-information-architecture--sitemap)
8. [Functional Requirements — Page by Page](#8-functional-requirements--page-by-page)
9. [KYC Portal Integration — Detailed Requirements](#9-kyc-portal-integration--detailed-requirements)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Design & Brand Requirements](#11-design--brand-requirements)
12. [Content Requirements & Migration](#12-content-requirements--migration)
13. [Technical Architecture & Integrations](#13-technical-architecture--integrations)
14. [SEO Requirements](#14-seo-requirements)
15. [Analytics & KPIs](#15-analytics--kpis)
16. [Phased Roadmap](#16-phased-roadmap)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Assumptions & Dependencies](#18-assumptions--dependencies)
19. [Acceptance Criteria & Definition of Done](#19-acceptance-criteria--definition-of-done)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

Simal Technologies Middle East LLC ("Simal") is a Dubai-headquartered IT distribution group with 20+ years of trading history, serving resellers, system integrators, retailers, and enterprises across the UAE, GCC, Middle East, Africa, and CIS. It distributes 20+ global brands — including Crucial/Micron, Hikvision, TeamGroup, UGREEN, ADATA, KOORUI, Aiwa, Arktek, Nearity, Dell, HP, Lenovo, Samsung and others — and operates an IT solutions & services arm covering 12 service lines from AMC to network security.

Simal now stands at a strategic inflection point with three digital drivers:

1. **Brand elevation.** The current WordPress site does not reflect Simal's true status as a leading Middle East IT distributor. Benchmark distributors (CDW, Redington, Ingram Micro) operate modern, content-rich, conversion-optimized corporate platforms with partner ecosystems, credential strips, segmented solutions navigation, and resource hubs.
2. **New business line.** Simal is launching a **Software Services & Solutions business in collaboration with its sister concern, Unisoft Systems Ltd (Bangladesh)** — a 40+ engineer software house with 12 service lines and 20+ products (10+ ERPs including Distribution ERP, UniVAT, UniPOS; 10+ specialized systems for banking, healthcare, education, hospitality and government). The new website must present and generate demand for this business from day one.
3. **Digital infrastructure consolidation.** Simal already operates a standalone **Partner KYC Onboarding Portal** at `kyc.simalme.com` (Peppol/UAE e-invoicing-ready). **This portal must be completely integrated into the new platform** — unified accounts, embedded onboarding journeys, in-site status tracking, and an internal review console — so that kyc.simalme.com ceases to be a silo and becomes the compliance backbone of the partner lifecycle.

This PRD defines a comprehensive, modern, advanced corporate website and integrated partner platform ("Simal Digital Platform") that: elevates Simal's brand to tier-1 distributor standard; powers both the distribution and the new software businesses; fully absorbs the KYC portal; and is engineered for measurable commercial outcomes — partner registrations, RFQs, software leads, and talent applications.

---

## 2. Background & Strategic Context

### 2.1 Company Profile (as researched)

**Simal Technologies Middle East LLC**

| Attribute | Detail |
|---|---|
| Founded | 2002 (website: "Clients since 2002"; LinkedIn lists 2003) |
| Tagline | "Empowering The Future Through Innovation" |
| Group | **Independent company — no group affiliation.** (Management correction, 3 Oct 2026: earlier secondary-source claims of a "TwinMOS Group / Smart Group" association are withdrawn and must not appear anywhere on the new site.) |
| HQ / Office | Office 201, Dar Al Riffa Building, Khalid Bin Al Waleed Rd, Bur Dubai, PO Box 49740, Dubai, UAE |
| Warehouse | StarSeed Technologies ME FZE, RA08DA07, Jebel Ali Free Zone (JAFZA), UAE |
| Retail Store | Stellent Technologies ME LLC, Bur Dubai, Dubai, UAE |
| Phones | +971 4 393 0507 (store/main site), +971 4 325 1430 (office), +971 50 848 7861 (mobile), Fax +971 4 393 1851 |
| Emails | info@simalme.com, mkt@simalme.com, accounts@simalme.com (KYC support) |
| Size | 11–50 employees (LinkedIn); ~1,800 LinkedIn followers |
| Markets | UAE, GCC, Middle East & Africa (MEA), CIS |
| Customer types | Enterprises, system integrators, resellers, retailers, e-commerce platforms (e.g., Amazon, Sharaf DG, Microless) |
| Awards | Hikvision "Best Distributor Partner"; TeamGroup "Best Partner 2025" |
| Social | LinkedIn, Facebook, Instagram, WhatsApp |
| Digital assets | `simalme.com` (WordPress/WooCommerce), `kyc.simalme.com` (standalone KYC portal) |

### 2.2 Product & Brand Portfolio (current)

**Brands carried (20+; 23 distinct):** Crucial (Micron), Hikvision, Hiksemi, TeamGroup, UGREEN, ADATA, KOORUI, Aiwa, Arktek, Nearity, Dell, HP, Lenovo, MSI, Samsung, SanDisk, Kingston, Toshiba, WD, ZOTAC, PNY, Honeywell, Kaspersky. (TwinMOS removed from this list per the 3 Oct 2026 no-association correction — it was sourced from directory listings, not from the site catalog, which has never listed a TwinMOS product.)

**Product categories (mirror snapshot — shop total 76 SKUs):**
- Storage: internal SSDs — SATA/Gen4/Gen5 NVMe (14 SKUs), portable SSDs (12 SKUs); HDD/flash lines via Toshiba/WD/SanDisk (confirm active SKUs)
- Memory: DDR3/DDR4/DDR5 desktop & laptop RAM (4 SKUs), gaming (T-FORCE) and creator (T-CREATE) memory
- Compute & display: monitors (6 SKUs — KOORUI, Aiwa; office/gaming), laptops (3 SKUs — Dell, HP, Lenovo)
- Components: graphics cards (5 SKUs — Arktek GT610/GT730/GTX1030/RTX2060/RTX3060), docking stations, adapters
- Accessories (30 SKUs): hubs, HDMI cables, chargers, UGREEN connectivity ecosystem
- Power & protection: Honeywell surge protectors, extension boards, travel adapters (12+ SKUs)
- Gaming (9 SKUs, cross-tagged): gaming monitors, GPUs, gaming builds
- Networking & surveillance: switches, routers, Hikvision security (confirm current SKUs)
- Meeting/AV: Nearity conference solutions
- Software: Kaspersky (and licensing support)

**Solutions & services (12 lines, current site):** AMC (Annual Maintenance Contract); AV & Meeting Room Solutions; Cloud Security; Data Recovery & Storage; Firewall Solutions; IT Infrastructure; Managed Services; Network & IT Security; Software & Licensing Support; Structured Cabling; Support & Maintenance; IP Telephony.

### 2.3 The Software Services & Solutions Initiative (with Unisoft Systems Ltd)

Simal's sister concern **Unisoft Systems Ltd** (`uslbd.com`, Dhaka, Bangladesh; founded 2015; ISO 9001, ISO 27001, SOC 2; BASIS member) is the delivery engine for the new software business. Verified capabilities:

**Services (12):** Custom Software Development; Cloud Services & Infrastructure; Cybersecurity Services; Digital Transformation; AI & Machine Learning; IT Consultancy & Advisory; Project Management; DevOps & Infrastructure Management; QA & Testing; UI/UX Design; Mobile App Development; Data Analytics & BI.

**Products:**
- **ERP suite (10+):** Distribution ERP; Retail ERP; Garments ERP; Managed Print Service ERP; **UniVAT** (NBR-approved VAT management); **UniPOS** (multi-sector POS); Education Management ERP; Field Service Automation ERP; Hotel Management ERP; Hospital Management ERP.
- **Specialized systems (10+):** E-commerce Platform; Weather Forecast Production System; Cattle Management; Queue Management; Collection & Recovery Management; Loan Management; Custodian Banking Solution; I-Portal; Asset Management; Merchant Banking Solution.

**Industries:** healthcare, finance & banking, e-commerce & retail, manufacturing, education, government & public sector, logistics & supply chain, real estate.

**Delivery model advantages:** 40+ engineers recruited from BUET/DU/NSU; 150+ projects; 98% client satisfaction; 24/7 support; rates 60–70% below US/EU benchmarks.

**Strategic fit with Simal:** Unisoft's **Distribution ERP and Retail ERP** are directly relevant to Simal's channel (resellers, retailers, distributors in MEA); Simal contributes Middle East market access, vendor relationships, Arabic/English presence, and a UAE legal & compliance framework (including Peppol e-invoicing readiness via its KYC portal). The joint proposition to market: *"Enterprise software, designed and delivered by our group software house, sold and supported by Simal in the Middle East."*

### 2.4 Current Website Assessment (from workspace mirror + live site)

The current site (`simalme.com`) is a WordPress + WooCommerce deployment. Strengths: functional catalog (76 products in the mirror snapshot: Computer Components 35, Computer Accessories 30, Monitors 6, Gaming 9, Laptops 3), 20 brand pages, solutions listing, customer testimonials, KYC portal link, blog seeds ("Top SSDs for Resellers 2025") and SEO landing pages ("Official TeamGroup Distributor in UAE", "Authorized Crucial & Micron Distributor in Dubai UAE", "Ugreen Distributor UAE").

**Material gaps (documented in the mirror audit):**

| # | Gap | Evidence |
|---|---|---|
| G1 | Generic template look (Phlox Pro multipurpose WordPress theme); not benchmark-class | Theme files in mirror; comparison with CDW/Redington/Ingram Micro (§3.3) |
| G2 | No real e-commerce or RFQ system — every product shows "Call For Price" and orders route to WhatsApp | Product pages in mirror |
| G3 | Thin About page (header/footer only in static render); no group story, leadership, milestones | `/about/` page |
| G4 | Empty careers page ("There are no jobs currently listed") — no employer branding | `/career/` page |
| G5 | Stats counters render as "0+" placeholders (JS counters with no static fallback) | Homepage |
| G6 | Blog/insights inconsistent; minimal content marketing engine | `/tech-talk-by-simal/` |
| G7 | No software services business section at all | Site-wide |
| G8 | KYC portal is a **separate standalone site** — brand, navigation, and accounts are disjointed | `kyc.simalme.com` |
| G9 | No Arabic language support despite UAE/GCC/CIS market footprint | Site-wide |
| G10 | Weak SEO structure for a distributor of its scale (missing hub pages, schema, case studies) | Mirror audit |
| G11 | No partner program value proposition or reseller portal | vs. Redington/Ingram benchmarks |
| G12 | Awards & achievements page underpopulated in static HTML (awards exist: Hikvision, TeamGroup) | `/awards-and-achievements/` |
| G13 | QA hygiene: test/draft content live in production; broken/empty pages | `/training-draft/` ships placeholder text ("Helllo People"); `/product-category/personal-storage/` and `/ugreen-authorized-distributor-in-uae/` are empty/404 in mirror |
| G14 | **Internal inconsistency**: published support hours contradict each other | Contact page: Mon–Fri 9:00–20:00, Sat 9:00–15:00, Sun holiday — vs. KYC portal: support Sun–Thu. Must be reconciled to one official schedule (see FR-9.1) |

### 2.5 Regulatory & Market Context

- **UAE e-invoicing (Peppol):** UAE is rolling out Peppol-based e-invoicing; Simal's KYC portal already captures TRN/TIN and Peppol IDs (`0235:` + 15-digit TRN). The integrated platform must preserve and extend this readiness.
- **UAE Personal Data Protection Law (PDPL):** the KYC portal already declares PDPL compliance and audit logging; the new site must uphold the same standard site-wide.
- **Market expectation:** regional distributors are digitizing partner experiences (Redington Online, CloudQuarks; Ingram Micro Xvantage). Simal must close this experience gap.

### 2.6 Stakeholders & Governance

| Role | Held by | Responsibility in this project |
|---|---|---|
| Executive Sponsor | Simal management | Approves budget, positioning, public credentials, launch date |
| Product Owner | Simal marketing lead | Requirements sign-off, content decisions, priority calls |
| Technical Owner | Simal IT / appointed vendor | Architecture (§13), delivery, security, cutover |
| KYC/Accounts Workstream | Accounts team (accounts@simalme.com) | KYC parity (§9.10), migration reconciliation, review-console UAT |
| Software Business Workstream | Simal + Unisoft joint owners | Software section content (§8.6), demo/consultation routing |
| Agency / Delivery Partner | TBD | Design system, build, QA execution |
| Content Team | Simal marketing + copywriters | §12 content inventory & production |

**Cadence:** weekly steering review during build; stage-gate sign-offs at end of P0 (design), P2 (content/migration readiness), P3 (QA/UAT), P4 (launch).

---

## 3. Research Findings

### 3.1 Simal Current-State Audit Summary

- **Platform:** WordPress + WooCommerce; AED currency display; 3-step basket widget; enquiry form; WhatsApp ordering.
- **Content assets available for migration:** 76 product records with descriptions/specs (shop categories: Computer Components 35, Computer Accessories 30, Monitors 6, Gaming 9, Laptops 3); 20 brand pages; 12 solution blurbs; ~6 testimonials with names/roles; company insights (founding 2002, partnerships, expansion to Amazon/Sharaf DG/Microless); 2 documented awards; ≥5 blog/SEO landing pages (incl. TeamGroup, Crucial/Micron and UGREEN distributor pages, Crucial launch pages P510/T705/T710); full corporate directory (3 UAE entities); social channels.
- **Known content to be produced:** leadership team, company story (independent distributor since 2002 — no group narrative), milestones timeline, detailed service descriptions, case studies, software portfolio pages, careers content, partner program terms.

### 3.2 Unisoft Capability Inventory (for the Software section)

See §2.3. Key takeaway for the PRD: the software section must support a **three-level offer structure**: (a) packaged products (UniVAT, UniPOS, Distribution ERP, etc.), (b) service practices (custom development, AI/ML, cloud, cyber, data & BI), and (c) industry solutions (8 verticals) — mirroring the structure Unisoft already uses, re-skinned for Middle East buyers and co-branded "Simal + Unisoft".

### 3.3 Competitive Benchmark Analysis

| Dimension | **CDW** (cdw.com) | **Redington** (redingtongroup.com) | **Ingram Micro** (ingrammicro.com) | **Implication for Simal** |
|---|---|---|---|---|
| Positioning | "Solutions integrator" — *People who get it* | "Reducing Technology Friction" | "The business behind the world's brands" | Simal needs a one-line positioning: *the group that distributes **and** builds technology for the Middle East* |
| Primary nav | Hardware, Software, Solutions, Services, Industries, Partners, Insights, Why CDW | About, Solutions (by Tech/Industry/Business/Product), Services (10), Cloud, Brands, Contact | Products/Brands, Cloud, Services, Solutions, Company, ESG | Adopt a **7–8 item mega menu** with Solutions×Industry cross-cut |
| Credential strip | Implicit (partner logos) | **US$10B+, 450+ brands, 40 markets** + 39,500 partners, 7M sq.ft, 290+ brands, 70+ offices | 165K customers, 1,500+ vendors | Simal equivalents: **20+ years, 20+ brands, 4 group entities, 1000+ B2B clients, 6 regions** (validate numbers) |
| Audience segmentation | Verticals: Enterprise, Finance, Government (CDW-G), Retail, SMB, Education | Regions (India/MEA/Türkiye&CAC/SES Asia microsites) | Customer vs Vendor dual journey | Segment by **buyer type** (Reseller/SI/Enterprise/Vendor) + software buyer |
| Commerce | Full account-centric commerce, cart, notifications | Redington Online B2B portal w/ credit + tracking; CloudQuarks | Xvantage AI-driven platform | Simal Phase 1: **RFQ + partner onboarding**; Phase 2: B2B portal |
| Content engine | Insights hub: articles, whitepapers, case studies, use cases with reading time | Blogs, case studies, partner newsletter, academy | Case-study videos, testimonials, events | Build an **Insights hub** + case studies from existing testimonials |
| Partner CTA | Create account | **"Become a Partner" persistent** | "Become a Customer / Vendor" | Persistent **"Become a Partner"** CTA wired to integrated KYC onboarding |
| ESG/Gov | Governance content | Dedicated ESG, e-waste, code of conduct | Sustainable/ESG pillar | Add a light ESG/trust page (compliance, genuine products, e-waste stance) |
| Localization | — | Regional microsites + region selector | Multi-language | **EN + AR** (RTL) at launch; consider RU for CIS later |
| Observed weaknesses to avoid | — | Mega-menu overload; dead `#` links; ESG buried | — | Keep menus ≤2 levels deep; no placeholder links; ESG in main nav |

### 3.4 Benchmark-Driven Design Principles for the New Simal Site

1. **Credential-first storytelling** — numbers strip above the fold (years, brands, markets, partners).
2. **Dual business presentation** — Distribution + Software Services as two clearly signposted worlds under one brand.
3. **Partner-centric conversion** — "Become a Partner" persistent in header; onboarding begins in-site (KYC-integrated).
4. **RFQ-native commerce** — B2B catalog optimized for quote requests, not checkouts.
5. **Content as an engine** — Insights hub with case studies, blogs, downloadable resources.
6. **Trust & compliance visible** — awards, authorized-distributor badges, PDPL/Peppol readiness, genuine-product guarantee.

---

## 4. Vision, Objectives & Success Criteria

### 4.1 Product Vision Statement

> *"One digital front door for the Simal group: a world-class corporate website that sells hardware distribution at Middle-East scale, launches our software services business with Unisoft, and onboards every partner through a fully integrated KYC journey — secure, bilingual, and measurable."*

### 4.2 Business Objectives

| # | Objective | Description |
|---|---|---|
| O1 | **Elevate brand standing** | Present Simal as a leading Middle East IT distributor of benchmark class (CDW/Redington/Ingram tier) |
| O2 | **Launch software business line** | Establish "Simal Software Services — powered by Unisoft Systems" presence with lead generation |
| O3 | **Integrate the KYC portal completely** | Retire the standalone kyc.simalme.com experience; onboarding, status tracking, and admin review live inside the platform |
| O4 | **Grow partner pipeline** | Increase partner registrations and RFQ submissions via clear journeys and CTAs |
| O5 | **Deepen vendor relationships** | Give each brand a professional home (brand landing pages) to support authorizations and joint marketing |
| O6 | **Attract talent** | Employer-brand careers section feeding applications |
| O7 | **Improve operational efficiency** | Route leads automatically to sales (CRM), reduce WhatsApp-only ordering dependence |

### 4.3 Success Metrics (KPIs — measured at 6 months post-launch)

| Category | KPI | Target |
|---|---|---|
| Traffic | Organic sessions/month | +100% vs. pre-launch baseline |
| SEO | Non-brand keyword first-page rankings (e.g., "IT distributor Dubai", "SSD distributor UAE", "TeamGroup distributor UAE") | ≥15 keywords |
| Partners | New partner onboarding submissions via integrated KYC | ≥30/month |
| Partners | Median onboarding completion time | ≤15 minutes (form), ≤2 business days (review SLA preserved) |
| Sales | RFQ submissions (all forms) | ≥50/month |
| Software | Software services consultation requests | ≥10/month by month 6 |
| Leads | Lead-to-SQL conversion | ≥20% |
| Engagement | Bounce rate | <45% |
| Engagement | Avg. session duration | >2:00 |
| Careers | Job applications/month | ≥10 when vacancies listed |
| Localization | Arabic session share | ≥15% |
| Technical | Lighthouse Performance (mobile) | ≥85 |
| Technical | Uptime | ≥99.9% |

---

## 5. Target Audiences & Personas

### 5.1 Audience Matrix

| # | Audience | Need from the site | Primary journeys |
|---|---|---|---|
| A1 | **IT Resellers & Traders** (UAE/GCC) | Bulk pricing, availability, authorized stock, credit terms | Browse catalog → RFQ / WhatsApp → Become a Partner |
| A2 | **System Integrators** | Project SKUs, solutions (security, networking, storage), technical support | Solutions → case studies → RFQ |
| A3 | **Corporate / Enterprise IT buyers** | End-to-end supply + services (AMC, infra, managed services) | Industries/Solutions → consultation request |
| A4 | **Software buyers (CIO/CTO/IT managers, MEA)** | ERP/POS/custom software/AI; credible delivery partner; local support | Software section → product pages → consultation request |
| A5 | **Vendor / Brand managers** (Crucial, Hikvision, TeamGroup, UGREEN…) | Distributor credibility, reach, marketing professionalism | About → Brands → market coverage → partner contact |
| A6 | **Job seekers** | Vacancies, culture, growth | Careers → apply |
| A7 | **Existing partners** | KYC status, documents, account, orders | Sign in → dashboard (KYC status, RFQ history) |
| A8 | **Media / analysts** | News, facts, leadership | Newsroom → press kit |

### 5.2 Representative Personas

- **"Rashid" — Reseller owner, Dubai Computer Plaza.** Wants same-day stock check on Crucial/TeamGroup memory and a quoted price fast. Success: finds product → submits RFQ in <2 minutes → gets callback same day.
- **"Fatima" — IT Director, Abu Dhabi logistics group (enterprise).** Needs a distributor that can also deliver + maintain: servers, networking, AMC, and increasingly software (warehouse ERP). Success: sees Simal as one partner for hardware + services + software; books a consultation.
- **"Omar" — CIO, Saudi retail chain (software buyer).** Evaluating POS/ERP replacement; wants Arabic support, local references, and a credible development organization. Success: discovers Simal Software Services (powered by Unisoft), reviews UniPOS/Distribution ERP pages + case study, requests a demo.
- **"Elena" — Channel Manager at a global vendor.** Deciding on MEA distribution authorization. Success: credential strip → brand pages → market coverage map → leadership credibility → contacts partnerships@.
- **"Ahmed" — Partner operations manager at an existing reseller.** Completing annual KYC re-validation. Success: signs in on simalme.com, sees pending document expiry, uploads renewed trade licence, tracks review status — all without leaving the main site.

---

## 6. Scope

### 6.1 In Scope — Phase 1 (Launch)

1. Full corporate website (EN + AR/RTL) replacing current WordPress site at `simalme.com`.
2. Complete IA per §7: Home, About (group, leadership, awards, insights), Brands & Products catalog (RFQ model), IT Solutions & Services, **Software Services & Solutions (Simal + Unisoft)**, Partners (program + **integrated KYC onboarding**), Newsroom/Blog, Careers, Contact.
3. **Full KYC portal integration** (§9): unified accounts, embedded onboarding wizard (Vendor & Customer tracks), applicant status dashboard, document vault, staff review console, notifications, migration from `kyc.simalme.com`.
4. RFQ system (per-product, per-solution, per-service, general), WhatsApp Business deep links, lead routing to CRM.
5. Search (site-wide incl. products & brands), SEO migration (301 map from all legacy URLs), analytics.
6. Content migration from current site + new content production per §12.
7. Hosting/deployment (UAE-reachable, CDN, TLS), security hardening, backups.

### 6.2 In Scope — Phase 2 (Post-Launch, ~3–6 months)

1. Partner self-service portal expansion: live price/stock for approved partners, order history, credit status, Peppol e-invoicing documents.
2. Marketing automation (drip nurtures), marketing preferences center.
3. Russian language for CIS (optional evaluation).
4. Careers portal integration (ATS).
5. Customer product reviews (moderated).

### 6.3 Out of Scope (Phase 1)

- Full transactional B2B e-commerce (cart/checkout with online payment) — deliberately deferred; catalog is RFQ-native.
- Integration with internal ERP/accounting systems beyond lead routing (Phase 2 API work).
- Vendor portal (vendor-side reporting) — Phase 3 candidate.
- Redesign of Unisoft's own `uslbd.com` (cross-linking only).

---

## 7. Information Architecture & Sitemap

### 7.1 Navigation Principles

- Header: top utility bar (phone, email, language switcher EN|AR, Sign In, Become a Partner CTA) + primary mega menu (7 items max) + persistent search.
- Two-level maximum menu depth; no placeholder links (benchmark lesson from Redington).
- "Software Services" gets a top-level nav slot — the new business must be unmissable (objective O2).
- "Partners" entry funnels into the integrated KYC onboarding (objective O3).

### 7.2 Proposed Sitemap

```
Home
├── About
│   ├── About Simal (story, independent-company overview)
│   ├── Vision, Mission & Values
│   ├── Leadership Team
│   ├── Companies & Partners (Simal ME LLC · StarSeed ME FZE · Stellent ME LLC · Unisoft Systems Ltd — software delivery partner)
│   ├── Global Presence & Markets (UAE · GCC · MEA · CIS coverage map)
│   ├── Awards & Achievements (Hikvision Best Distributor Partner; TeamGroup Best Partner 2025; …)
│   ├── Company Insights / Milestones (2002 founding → present)
│   ├── Customer Feedback (testimonials)
│   └── Why Choose Simal
├── Products & Brands  (mega menu: Brands | Categories)
│   ├── Brands A–Z (20+ brand landing pages)
│   │   └── e.g., Crucial, Hikvision, TeamGroup, UGREEN, ADATA, KOORUI, Aiwa, Arktek, Nearity,
│   │         Dell, HP, Lenovo, MSI, Samsung, SanDisk, Kingston, Toshiba, WD, ZOTAC, PNY, Honeywell, Kaspersky
│   ├── Categories
│   │   ├── Storage (SSD · Portable SSD · HDD · Memory Cards)
│   │   ├── Memory (DDR4/DDR5 · Gaming · Creator)
│   │   ├── Monitors & Displays
│   │   ├── PCs & Laptops
│   │   ├── Components (Graphics Cards · Docking · Power)
│   │   ├── Accessories & Connectivity
│   │   ├── Networking
│   │   ├── Security & Surveillance
│   │   └── Meeting & AV (Nearity)
│   ├── Product detail page (specs, related, RFQ)
│   └── Request for Quote (RFQ hub + basket-style multi-item RFQ)
├── Solutions & Services (IT)
│   ├── By Need: AMC · IT Infrastructure · Managed Services · Network & Security · Firewall · Cloud Security ·
│   │           Data Recovery & Storage · Structured Cabling · IP Telephony · AV & Meeting Rooms · Support & Maintenance
│   ├── Software & Licensing
│   └── By Industry: Retail · Healthcare · Education · Hospitality · Government · Logistics · SME · Enterprise
├── Software Services  (★ new business — "Powered by Unisoft Systems Ltd")
│   ├── Overview (joint proposition, delivery model, Simal + Unisoft story)
│   ├── Services: Custom Software Development · Web & Mobile Apps · AI & Machine Learning ·
│   │             Cloud Services · Cybersecurity · Data Analytics & BI · UI/UX · QA & Testing ·
│   │             DevOps · IT Consultancy · Digital Transformation · Project Management
│   ├── Products: Distribution ERP · Retail ERP · UniPOS · UniVAT · Hotel ERP · Hospital ERP ·
│   │             Education ERP · Garments ERP · Field Service ERP · Managed Print ERP ·
│   │             (+ specialized: E-commerce · Queue Mgmt · Asset Mgmt · Loan Mgmt · I-Portal …)
│   ├── Industries (8 verticals)
│   ├── Engagement Models (project · dedicated team · T&M · support)
│   ├── Why Simal + Unisoft (40+ engineers, ISO 9001/27001, SOC 2, 24/7, cost advantage)
│   └── Request Consultation / Book a Demo
├── Partners
│   ├── Become a Partner (program benefits, tiers, requirements)
│   ├── Partner Onboarding (KYC) — ★ integrated wizard: Customer track / Vendor track  (replaces kyc.simalme.com)
│   ├── My Account / Dashboard (sign-in: onboarding status, documents, expiry alerts, RFQ history)
│   └── Partner FAQ
├── Insights (hub)
│   ├── Blog / Tech Talk by Simal
│   ├── Case Studies (distribution + software)
│   ├── Newsroom (press releases, events, awards)
│   └── Downloads (product catalogs, line cards, guides)
├── Careers (culture, benefits, open roles, apply)
├── About ESG & Compliance (genuine products, PDPL, e-invoicing readiness, quality)  [footer-level]
└── Contact (HQ · Warehouse · Store; enquiry forms; map; WhatsApp; reconciled support hours — see FR-9.1)
```

### 7.3 URL Strategy

- Keep root domain `simalme.com`. Clean paths: `/about`, `/brands/crucial`, `/products/crucial-t705`, `/solutions/amc`, `/software`, `/software/services/ai-machine-learning`, `/software/products/unipos`, `/partners`, `/partners/onboarding`, `/insights`, `/careers`, `/contact`.
- All legacy WordPress URLs (product, brand, category, blog) receive **301 redirects** to nearest new equivalents (migration map required — see §12.3).
- `kyc.simalme.com` → **301 to `simalme.com/partners/onboarding`** after cutover (deep application-resume links must keep working via migration tokens — see §9.8, FR-K.35/36).

---

## 8. Functional Requirements — Page by Page

> Convention: requirement IDs `FR-x.y` with MoSCoW priority (M = Must, S = Should, C = Could). "RFQ" = Request for Quote.

### 8.1 Global Framework

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Sticky header with logo, mega menu, sitewide search, language switcher (EN/AR with RTL layout), Sign In link, and a visually distinct **"Become a Partner"** button on every page | M |
| FR-1.2 | Utility top bar: phone (+971 4 393 0507), email, social icons (LinkedIn, Facebook, Instagram, WhatsApp), and market selector (default UAE) | M |
| FR-1.3 | Sitewide search: unified index of products, brands, categories, solutions, software services/products, blog, pages; autocomplete suggestions; Arabic-aware | M |
| FR-1.4 | Footer: contact directory (Office / Warehouse / Store), quick links, brand index (SEO), newsletter signup, legal links (Privacy, Terms, Cookie policy), PDPL notice, copyright | M |
| FR-1.5 | WhatsApp floating button pre-filled with page context ("Hello, I'm interested in [product/solution] [URL]") | M |
| FR-1.6 | Cookie consent banner with granular categories (analytics/marketing) | M |
| FR-1.7 | Responsive breakpoints: 1920/1440/1280/1024/768/375; mobile-first components | M |
| FR-1.8 | Global announcement bar (editable) for campaigns/product launches (e.g., "Crucial E100 Gen4 NVMe — now available") | S |
| FR-1.9 | Breadcrumbs on all inner pages (schema.org BreadcrumbList) | M |

### 8.2 Home Page

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Hero carousel (max 4 slides, swipeable, autoplay pausable) pairing distribution campaigns (Crucial, TeamGroup, UGREEN, KOORUI, Hikvision, Aiwa, Nearity) with the software proposition ("Beyond Distribution — Software Services for the Middle East, delivered with Unisoft") | M |
| FR-2.2 | **Credential strip** (counters with static fallback values for SEO/no-JS): "20+ Years (since 2002) · 20+ Global Brands · 1000+ B2B Clients* · 6 Regions Served" (*"1000+ Customers" is already claimed on the current Crucial landing page — retain only after management validation; confirm regions count) | M |
| FR-2.3 | Dual-business split section: "Distribute with us" (products/RFQ) vs "Build with us" (software services) | M |
| FR-2.4 | Shop-by-category grid (9 category tiles per §7.2 taxonomy, linking to catalog) | M |
| FR-2.5 | Featured brands carousel (logos → brand pages) | M |
| FR-2.6 | Solutions & Services teaser (12 IT services + link) | M |
| FR-2.7 | **Software Services spotlight** module: 3 flagship offers (Distribution ERP, UniPOS, Custom Development) with demo CTA | M |
| FR-2.8 | Testimonials carousel (seeded with 6 existing testimonials; role + company + rating) | M |
| FR-2.9 | Awards & trust module (Hikvision Best Distributor Partner; TeamGroup Best Partner 2025; authorized-partner badges) | M |
| FR-2.10 | Latest insights (3 most recent blog/case-study cards) | S |
| FR-2.11 | Partner CTA band → `/partners/onboarding` | M |
| FR-2.12 | Quick RFQ form strip (name, company, phone, product interest) | S |

### 8.3 About Section

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Rich About Simal page: story since 2002, "turnkey IT infrastructure distribution, solutions & services provider" positioning, focus areas (data storage & backup, security & surveillance, networking, IT security) | M |
| FR-3.2 | **Company & partners page**: independent-company story (no group narrative); companies table (Simal ME LLC, StarSeed ME FZE — JAFZA warehouse, Stellent ME LLC, Unisoft Systems Ltd — software delivery partner) each with role + location | M |
| FR-3.3 | Leadership team grid (photo, name, role, LinkedIn); fallback "Leadership — coming soon" must NOT ship; obtain at least 4 profiles pre-launch | M |
| FR-3.4 | Timeline of milestones (2002 founding → brand authorizations → awards → 2026 software launch) | S |
| FR-3.5 | Awards & achievements page with award imagery and context | M |
| FR-3.6 | Global presence page: coverage map (UAE, KSA, GCC, MEA, CIS) + how fulfillment works (Bur Dubai office + JAFZA warehouse) | M |
| FR-3.7 | Customer feedback page: moderated testimonials, industry filter, rating display | M |
| FR-3.8 | Why Choose Simal: authorized partnerships, regional coverage, customer-first, 20+ years reliability (existing messaging upgraded) | M |

### 8.4 Brands & Products (Distribution Catalog)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Brand landing page template: logo, authorized-distributor badge, brand story, product grid, related insights, "Get bulk pricing" CTA; SEO copy per brand (pattern: "Official {Brand} Distributor in UAE"). Feature valid exclusivity claims prominently — e.g., the current site claims Simal is "the one and only exclusive authorized distributor of UGREEN across the UAE" (verify with vendor before republication) | M |
| FR-4.2 | Category & listing pages: facets (brand, category, spec attributes), sort, pagination, SEO copy blocks | M |
| FR-4.3 | Product detail page: gallery, structured specs table, description, downloads (datasheet), related products, "Add to RFQ" + "Enquire via WhatsApp" + "Call for price" badge | M |
| FR-4.4 | **RFQ system**: anonymous users can build a multi-item RFQ basket and submit (company, contact, items, quantity, target date); logged-in partners see pre-filled forms; RFQ lands in CRM + email acknowledgement with SLA (response within 1 business day); every submission issues a **unique reference number** (format `SIMAL-RFQ-nnnn`) shown on the confirmation screen and in the acknowledgement email, quotable in later contact | M |
| FR-4.5 | Product data model supports variants (e.g., with/without heatsink, capacity), multi-brand, EOL status, and "new launch" flags | M |
| FR-4.6 | Spec-driven comparison (select up to 4 products) | C |
| FR-4.7 | Stock/availability indicator for signed-in approved partners (Phase 2 gateway; Phase 1 shows "Check availability" → RFQ) | C |
| FR-4.8 | Currency display AED default; toggle USD/AED (display only) | S |
| FR-4.9 | Product schema.org markup (Product, Offer with "CallForPrice" handling, Brand) | M |

### 8.5 IT Solutions & Services

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | 12 service pages (AMC, AV & Meeting Rooms, Cloud Security, Data Recovery & Storage, Firewall, IT Infrastructure, Managed Services, Network & IT Security, Software & Licensing, Structured Cabling, Support & Maintenance, IP Telephony) — each: outcomes, scope, deliverables, process, "Request a consultation" form | M |
| FR-5.2 | Industry pages (Retail, Healthcare, Education, Hospitality, Government, Logistics, SME, Enterprise) linking relevant products + services + software | S |
| FR-5.3 | Service bundles (e.g., "SMB IT Care: AMC + support + security") | C |
| FR-5.4 | AMC plan tiers presentation (Bronze/Silver/Gold style) | C |

### 8.6 Software Services & Solutions (★ New Business — with Unisoft)

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Software Services landing page: joint value proposition ("Group software house, 40+ engineers, ISO 9001/27001 & SOC 2, 150+ projects, 24/7 support — delivered regionally by Simal"); credibility stats; dual CTA "Book a demo" / "Request consultation" | M |
| FR-6.2 | **12 service pages** (Custom Software Development; Web & Mobile Apps; AI & ML; Cloud Services; Cybersecurity; Data Analytics & BI; UI/UX; QA & Testing; DevOps; IT Consultancy; Digital Transformation; Project Management) with MEA-relevant copy, tech-stack display, engagement models, and lead forms. Tech-stack display is substantiated: Unisoft publishes **44 technologies across 12 categories** (verified 3 Oct 2026 — full list in Appendix B): languages (JS/TypeScript, Python, Java, Go, .NET, PHP, Ruby); front-end (Next.js, Vue, Angular, React, MUI, Tailwind); mobile (React Native, Flutter, Kotlin, Swift, PWA); back-end (Node.js); data (PostgreSQL, MongoDB, Redis, MySQL, Elasticsearch, MSSQL, Oracle); GraphQL; cloud (AWS, GCP, Azure, DigitalOcean, Heroku); platforms (Docker, Kubernetes); IaC/CI-CD (Terraform, Ansible, GitHub Actions, Jenkins); AI/ML (TensorFlow, PyTorch, LangChain, OpenAI) | M |
| FR-6.3 | **Product pages for packaged software** (from Unisoft portfolio): Distribution ERP, Retail ERP, UniPOS, UniVAT, Hotel ERP, Hospital ERP, Education ERP, Garments ERP, Field Service ERP, Managed Print ERP, E-commerce Platform, Queue Management, Asset Management, Loan Management, I-Portal — each with feature list, target industry, demo request | M |
| FR-6.4 | Industry solutions pages (8 verticals) combining software + hardware + services into vertical propositions (e.g., Retail = UniPOS + POS hardware + networking + support) | M |
| FR-6.5 | Engagement models page: Fixed-price project, Time & Materials, Dedicated team, Managed support — with indicative process (Discovery → Proposal → Agile delivery → Support) | S |
| FR-6.6 | Case studies section for software. ⚠ **Sourcing note (verified 3 Oct 2026):** Unisoft's public case-studies page is currently **empty** ("0 case studies available"), so launch seed material (anonymized project write-ups from their 150+ claimed projects) **must be commissioned directly from Unisoft** with management approval — do not assume public reference material exists. Add MEA cases as they land | S |
| FR-6.7 | Lead routing: software leads flagged separately in CRM; consultation/demo booking calendar integration | M |
| FR-6.8 | Co-branding treatment: "Simal Software Services — delivered in partnership with Unisoft Systems Ltd" with link to uslbd.com; partner logos | M |
| FR-6.9 | Arabic versions of all software pages (Phase 1) | S |

### 8.7 Insights, Newsroom & Resources

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Insights hub: Blog (Tech Talk by Simal), Case Studies, News, Downloads; filter by type/topic/brand | M |
| FR-7.2 | Blog CMS: rich editor, categories/tags, author profiles, social share, related posts | M |
| FR-7.3 | Migrate existing posts (e.g., "Top SSDs for Resellers to Stock in 2025") + brand landing content (TeamGroup/Ugreen/Crucial distributor pages) into hub or SEO pages | M |
| FR-7.4 | Newsroom: press releases, event participation (e.g., Hikvision MEA ND Summit), award announcements; press-kit download (logos, boilerplate, leadership bios) | S |
| FR-7.5 | Downloads: line cards, brand catalogs, capability deck (gated: email required) | S |
| FR-7.6 | Newsletter subscription with double opt-in and preferences (topics: distribution, software, events) | M |

### 8.8 Careers

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Careers landing: employer value proposition, culture, benefits, Dubai location story, group opportunities (UAE + Unisoft Dhaka) | M |
| FR-8.2 | Job listings module (CMS-managed; never ship an empty state — seed with "speculative applications open" CTA if no live vacancies) | M |
| FR-8.3 | Application form (CV upload, GDPR/PDPL consent) → HR email/ATS | M |
| FR-8.4 | Structured data (JobPosting schema) for live roles | S |

### 8.9 Contact & Offices

| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Contact page: three-entity directory (Office: Simal Technologies Middle East LLC; Warehouse: StarSeed Technologies ME FZE, JAFZA; Store: Stellent Technologies ME LLC, Bur Dubai) with phones, emails, Google Maps embed, and **a single reconciled schedule of working hours**. ⚠ **Discrepancy to resolve before launch:** the current Contact page publishes Mon–Fri 9:00–20:00 / Sat 9:00–15:00 / Sun closed, while the KYC portal states support runs Sun–Thu. Management must confirm the official schedule; the site and KYC SLA calendar (FR-K.40) must then use the same source of truth | M |
| FR-9.2 | Department-targeted enquiry forms with structured routing fields modeled on the benchmark contact pattern (Redington): a **"who do you represent"** selector (New Partner / Existing Partner / Customer / Vendor-OEM / Media / Job Seeker), **interest area** (e.g., Distribution RFQ, Software Services demo, Specific brand, Support, Partnership), geography, and PDPL consent checkboxes — mapped to routing rules for Sales/RFQ, Software consultation, Partnerships (vendors), Careers, Support | M |
| FR-9.3 | Spam protection (honeypot + rate limit + reCAPTCHA v3) and PDPL consent checkbox on all forms | M |

### 8.10 Accounts & Partner Portal Shell

| ID | Requirement | Priority |
|---|---|---|
| FR-10.1 | Unified account registration (email or business email verification) and sign-in; roles: Applicant, Partner (approved), Staff (admin console) | M |
| FR-10.2 | Account dashboard: onboarding status, document vault, expiry alerts, RFQ history, saved lists | M (status/docs); S (RFQ history) |
| FR-10.3 | Password reset, email verification, session security (see §10) | M |

---

## 9. KYC Portal Integration — Detailed Requirements

> **Context (per stakeholder direction):** Simal's Partner KYC Onboarding Portal currently runs **separately** at `kyc.simalme.com`. The new platform must **completely integrate** this capability — one platform, one account system, one brand experience. The portal's current feature set (verified live): vendor & customer onboarding tracks (~10 minutes each); legal-entity verification (licence + TRN against official records); encrypted document collection; admin review workflow (~2 business days); automatic progress saving; fix-only-flagged-items resubmission; licence/ID expiry reminders; Peppol e-invoicing data capture (TIN + Peppol ID format `0235:` + 15-digit TRN); UAE PDPL data handling with audit-logged access; resume/track application; FAQs; staff sign-in for reviewers; tagline "Onboard once. Trade with confidence."

### 9.1 Integration Principles

| ID | Requirement | Priority |
|---|---|---|
| FR-K.1 | **Single platform**: all KYC/onboarding functionality is served from `simalme.com` (`/partners/onboarding`, `/account`, `/admin/kyc`); `kyc.simalme.com` becomes a 301 redirect target only | M |
| FR-K.2 | **Unified identity**: one Simal account for website, RFQ, partner program, and onboarding; no separate portal credentials; existing portal users migrated with forced password reset on first login | M |
| FR-K.3 | **Contextual entry**: "Become a Partner" CTAs, brand pages, checkout-style RFQ completion, and footer link directly into the onboarding wizard pre-scoped to the correct track (customer/vendor) | M |
| FR-K.4 | **Feature parity**: every capability of the current standalone portal must be present at cutover (checklist in §9.10); no functionality regression | M |
| FR-K.5 | **Data continuity**: all in-flight and completed applications, uploaded documents, audit logs, and status history migrate losslessly | M |

### 9.2 Onboarding Wizard (public journeys)

| ID | Requirement | Priority |
|---|---|---|
| FR-K.6 | Two tracks preserved: **Customer** (receives invoices from Simal) and **Vendor/Supplier** (issues invoices to Simal); track selection page with plain-language guidance (current UX) | M |
| FR-K.7 | Multi-step form (~10 min completion target) with automatic progress saving (draft persistence), section resume, and "fix only flagged items" resubmission — must never force a full redo | M |
| FR-K.8 | Field set (current, to preserve): company details, legal entity documentation (trade licence), TRN/TIN, signatory identity, banking details, Peppol ID (format guidance `0235:` + 15-digit TRN), contact channels | M |
| FR-K.9 | Validation: licence & TRN format checks at entry; staff-side verification against official records retained | M |
| FR-K.10 | Encrypted document upload (see §9.4) replacing email-based collection; accepted formats PDF/JPG/PNG; size limits; virus scan | M |
| FR-K.11 | Expiry reminders for licences/IDs (email notifications at T-30/T-7/T-0) configurable by admin | M |
| FR-K.12 | Status tracking page (authenticated): Submitted → Under review → Additional info required → Approved / Rejected, with timestamps and reviewer notes visible to applicant where appropriate | M |
| FR-K.13 | Arabic version of the wizard (RTL) | S |
| FR-K.14 | Applicant can invite a colleague to complete/verify specific steps (multi-contributor, common for trade documents) | C |

### 9.3 Account & Applicant Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-K.15 | "My Onboarding" dashboard card: current step, pending flags, documents expiring, review SLA countdown (2 business days) | M |
| FR-K.16 | Post-approval, dashboard becomes "Partner Home": KYC status (Active/Expiring/Expired), document vault, RFQ history, account contacts | M (status/vault), S (RFQ history) |
| FR-K.17 | Email notifications at every state transition (submission received, review started, info required, approved/rejected), with in-site notification center | M |

### 9.4 Document Vault & Data Protection

| ID | Requirement | Priority |
|---|---|---|
| FR-K.18 | Documents stored encrypted at rest (AES-256) with per-application access control; access strictly limited to authorized staff roles | M |
| FR-K.19 | **Immutable audit log** of every view/download/action on KYC records (who, what, when) — retained ≥5 years; exportable for compliance | M |
| FR-K.20 | UAE PDPL compliance: consent capture at submission, data-subject export & deletion workflows (deletion subject to legal-retention rules for trade documents), privacy notice link in wizard footer | M |
| FR-K.21 | Retention policy: application documents retained per UAE commercial record-keeping requirements; admin-configurable retention & purge job | M |
| FR-K.22 | Uploads scanned for malware; MIME/extension validation; stored outside webroot / object storage with signed URLs | M |

### 9.5 Staff Review Console (back office)

| ID | Requirement | Priority |
|---|---|---|
| FR-K.23 | Staff console inside the platform admin (`/admin/kyc`), role-gated (Reviewer, Admin): queue of applications by status/age, SLA aging indicators | M |
| FR-K.24 | Reviewer workflow: open application → side-by-side document viewer → per-field approve/flag with notes → request additional info → final approve/reject with reason | M |
| FR-K.25 | Verification checklist tooling: licence validity, TRN/TIN match, Peppol ID format, signatory ID, bank details; optional integration hooks for future registry/Peppol lookup APIs | M (manual), C (API) |
| FR-K.26 | Bulk actions, assignment to reviewers, internal notes (not visible to applicant), full audit trail | S |
| FR-K.27 | Admin dashboards: submissions/week, median review time vs 2-day SLA, approval rate, expiring-document report — **and a TRN/Peppol data-quality report** (completeness & format validity of e-invoicing identifiers across the partner base, trended), which is the measurement instrument for the ≥98% data-validity objective (BRD BO-5/BR-18) | S |

### 9.6 Peppol / E-Invoicing Readiness

| ID | Requirement | Priority |
|---|---|---|
| FR-K.28 | Capture and validate UAE e-invoicing identifiers (TRN/TIN, Peppol ID `0235:{15-digit TRN}`) for both customer and vendor records | M |
| FR-K.29 | Data model ready for Peppol document exchange (participant registry fields); Phase 2: invoice issuance/status via Peppol network when UAE mandates activate | M (fields), C (exchange) |
| FR-K.30 | Public explainer content ("Onboard once. Trade with confidence." — Peppol e-invoicing readiness page) inside Partners section | S |

### 9.7 Integration with Site Journeys

| ID | Requirement | Priority |
|---|---|---|
| FR-K.31 | RFQ flow nudge: anonymous RFQ submitters can start onboarding from the acknowledgement step ("Create your partner account to track quotes & orders") | M |
| FR-K.32 | Software-consultation leads can optionally attach/link their partner account for unified follow-up | S |
| FR-K.33 | Partner tiering hooks: data model supports program tiers (e.g., Registered → Authorized → Preferred) with badges shown to the partner in their dashboard (public tier display out of scope) | C |

### 9.8 Migration & Cutover (from standalone portal)

| ID | Requirement | Priority |
|---|---|---|
| FR-K.34 | Full data export from current portal (applications, documents, logs, statuses) with reconciliation report (record counts, checksums) before cutover | M |
| FR-K.35 | **Resume-link preservation**: any emailed "resume application" / "track status" deep links from the old portal must resolve to the equivalent new-platform step (token mapping or redirect service) — no dead emails in inboxes | M |
| FR-K.36 | `kyc.simalme.com` 301 redirect strategy: root → `/partners/onboarding`; application-specific paths → token-mapped destination or account dashboard; maintained ≥24 months | M |
| FR-K.37 | Cutover plan: freeze window, import, UAT with accounts team, parallel run of review console, go-live; rollback plan documented | M |
| FR-K.38 | Communicate migration to in-flight applicants (email) and staff (training note) | S |

### 9.9 Non-Functional (KYC-specific)

| ID | Requirement | Priority |
|---|---|---|
| FR-K.39 | Review SLA tracking: system measures submission→first-review and submission→decision against the 2-business-day promise; alerts on breach | M |
| FR-K.40 | Business-day calendar (Sun–Thu UAE workweek — or the schedule reconciled per FR-9.1) for SLA computation | M |
| FR-K.41 | KYC endpoints hardened: MFA for staff accounts, rate limiting, IP allow-list option for admin console | M |

### 9.10 Feature-Parity Checklist (cutover gate)

- [ ] Customer track & Vendor track selection
- [ ] ~10-minute guided forms with auto-save
- [ ] Fix-only-flagged-items resubmission
- [ ] Encrypted uploads + virus scan
- [ ] Status tracking + timestamps
- [ ] Resume unfinished submission
- [ ] Expiry reminders (licences/IDs)
- [ ] TRN/TIN + Peppol ID capture & validation
- [ ] Staff review workflow with notes
- [ ] 2-business-day SLA support
- [ ] PDPL notice + consent + audit logging
- [ ] FAQ + support contact (accounts@simalme.com, +971 4 393 0507, Sun–Thu per portal — reconcile with contact-page hours per FR-9.1)
- [ ] Old deep links still resolve

---

## 10. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | LCP ≤ 2.5s on 4G; TTI ≤ 3.5s; Lighthouse mobile Performance ≥ 85; image optimization (WebP/AVIF, lazy-load); CDN for static assets |
| NFR-2 | Availability | ≥ 99.9% monthly uptime; health checks; automated failover where feasible; RPO ≤ 1h, RTO ≤ 4h |
| NFR-3 | Security | TLS 1.2+ everywhere; HSTS; CSP headers; OWASP Top 10 hardening; secrets in env/secret store only (never in repo); dependency scanning; annual penetration test |
| NFR-4 | Auth security | bcrypt/argon2 password hashing; MFA for staff; brute-force lockout; session timeout 30 min idle for admin; JWT/session rotation |
| NFR-5 | Data protection | UAE PDPL alignment; encryption at rest for PII/KYC; audit logs (immutable); DSR (access/erasure) workflow |
| NFR-6 | Accessibility | WCAG 2.1 AA: keyboard navigability, contrast ≥ 4.5:1, alt text, focus states, AR labels |
| NFR-7 | Responsive | Full function 360px–1920px; RTL layout parity for Arabic |
| NFR-8 | Browsers | Latest 2 versions of Chrome, Edge, Firefox, Safari; iOS/Android current −1 |
| NFR-9 | SEO | Server-side rendered or pre-rendered HTML for all public pages (no JS-only content — fixes current "0+" counter issue); XML sitemaps; robots; canonicals; structured data |
| NFR-10 | Scalability | Support 10× current traffic without re-architecture; catalog scale to 5,000 SKUs; 1,000 concurrent wizard sessions |
| NFR-11 | Maintainability | Headless/CMS content ops without deploys; staging environment; IaC or documented provisioning; backups (daily, tested restore) |
| NFR-12 | Compliance | Cookie consent; CAN-SPAM/PDPL-compliant email practices; Peppol data fields per §9.6 |
| NFR-13 | Observability | Uptime monitoring, error tracking (Sentry-class), funnel analytics, alerting to ops channel |

---

## 11. Design & Brand Requirements

| ID | Requirement |
|---|---|
| D-1 | **Modern corporate identity**: clean grid, generous white space, strong typography hierarchy; visual class of CDW/Redington/Ingram Micro tier |
| D-2 | Brand palette grounded in Simal's existing logo assets (extracted from mirror): **dominant royal blue #0050A0** (≈69% of standard logo pixels, with #0040A0 shade), **red accent #E01020**, **yellow accent #F0F000**; white logo variant exists for dark backgrounds. Define design tokens (color, type, spacing, radius, elevation) from this palette, documented for reuse; keep red/yellow as accents only for CTAs/highlights |
| D-3 | Dual-business visual language: distribution pages product-forward (photography, spec density); software pages solution-forward (diagrams, process visuals, personas) — one brand, two registers |
| D-4 | Arabic-first RTL implementation (not a mirrored afterthought); Arabic web font pairing with Latin |
| D-5 | Photorealistic product imagery standards: consistent aspect ratios, white/brand backgrounds; brand-partner compliant logo usage (each vendor's trademark rules) |
| D-6 | Iconography set for categories/services; data-viz style for stats and maps (coverage map) |
| D-7 | Motion: subtle scroll-reveal and counter animations **with static fallback values in HTML** (fixes current "0+" defect) |
| D-8 | Component library (design system) delivered: buttons, forms, cards, tables, tabs, accordion, wizard steps, modals, alerts, breadcrumbs, pagination — documented in Storybook or equivalent |
| D-9 | Trust visual language: authorized-distributor badges, award marks, certification logos (ISO 9001/27001, SOC 2 — with permission), Peppol-readiness badge |
| D-10 | 404/500 pages, loading skeletons, empty states designed (no "There are no jobs listed" dead ends) |

---

## 12. Content Requirements & Migration

### 12.1 Content Inventory (migrate from current site)

| Content | Source | Treatment |
|---|---|---|
| 76 products with descriptions/specs (mirror snapshot) | WooCommerce mirror | Re-model into new PIM/catalog structure; refresh copy, add specs |
| 20 brand pages | `/brand/*` | Rebuild on brand template with SEO copy |
| 12 solutions blurbs | `/solutions/` | Expand to full service pages |
| 6+ testimonials | Why Choose Us / Customer Feedback pages | Verify consent, display with role/company |
| Company insights & milestones | `/company-insights/` | Fold into About timeline + Newsroom |
| 2 awards | Insights/news | Dedicated Awards page |
| Blog posts & SEO landing pages | top-ssds-for-resellers-2025, TeamGroup/Ugreen/Crucial distributor pages | Migrate with 301s, preserve SEO equity |
| Corporate directory | about-it-distributor page | Contact + About pages |
| KYC portal content | kyc.simalme.com | Integrate per §9 (incl. FAQs) |

### 12.2 New Content to Produce (owner: Simal marketing + agency)

| # | Asset | Priority |
|---|---|---|
| C-1 | Positioning statement & messaging house (distribution + software) | M |
| C-2 | Leadership bios + photos (≥4) | M |
| C-3 | Group companies overview (incl. Unisoft relationship narrative) | M |
| C-4 | Credential numbers validation (clients count, SKUs, markets — approved by management) | M |
| C-5 | 12 software service pages (MEA-localized copy) + 15 packaged-product pages | M |
| C-6 | 2–4 case studies at launch (distribution + software/anonymized Unisoft) | M |
| C-7 | Careers EVP content + role descriptions | M |
| C-8 | Photography: office, warehouse (JAFZA), team, events | S |
| C-9 | Downloads: line card, capability decks (distribution & software) | S |
| C-10 | Legal: Privacy Policy (PDPL), Terms, Cookie Policy — AR + EN | M |
| C-11 | Launch announcement + PR | S |

### 12.3 Migration Plan

1. Crawl & inventory all indexed URLs from `simalme.com` and `kyc.simalme.com` (search console + crawler).
2. Build 301 redirect map (URL → URL) — reviewed & signed off; no chains >1 hop.
3. Migrate content (12.1), preserving: titles, metas, H1s where possible; enrich schema.
4. KYC data migration per §9.8 with reconciliation report.
5. Post-launch: monitor 404s, Search Console coverage, redirect hits daily for 30 days.

---

## 13. Technical Architecture & Integrations

### 13.1 Platform Options (decision required at kickoff; recommendation marked)

| Option | Stack | Pros | Cons |
|---|---|---|---|
| **A (recommended)** | Headless CMS (e.g., Strapi/Directus/Payload) + Next.js front end + custom KYC/account modules + PostgreSQL | Full control over UX/perf/RTL; KYC-grade custom workflows; headless content ops; modern SEO (SSR/ISR) | Higher build effort than turnkey |
| B | Enterprise DXP (e.g., Sitecore, Optimizely) | Enterprise features, support | Cost & timeline overkill for an 11–50-employee organization |
| C | WordPress headless (REST/GraphQL) + Next.js | Leverages existing content model & team familiarity | Plugin security surface; custom KYC still bespoke |

> Regardless of CMS, the **KYC/account/console modules are custom-built** (not a CMS plugin) due to audit/security requirements.

### 13.2 Environments & Delivery

- Environments: dev → staging (UAT) → production; CI/CD with automated tests; IaC preferred.
- Hosting: cloud region serving UAE efficiently (e.g., UAE/KSA cloud region or EU with regional CDN edge); managed PostgreSQL; object storage (encrypted) for documents; CDN for static/media.

### 13.3 Integrations

| ID | Integration | Purpose | Phase |
|---|---|---|---|
| INT-1 | WhatsApp Business (deep links Phase 1; Business API Phase 2) | Ordering channel continuity | 1 |
| INT-2 | CRM (HubSpot/Zoho — per Simal choice) | Lead routing (RFQ, software, careers-lite), pipelines, SLA alerts | 1 |
| INT-3 | Email service (transactional: onboarding, notifications) | KYC & form comms | 1 |
| INT-4 | Google Analytics 4 + Search Console + tag manager | Analytics/SEO | 1 |
| INT-5 | KYC document storage + audit log service | §9.4 | 1 |
| INT-6 | Peppol participant lookup / e-invoicing gateway | Future UAE mandate | 2 |
| INT-7 | ATS (careers) | Job sync/applications | 2 |
| INT-8 | Internal ERP/stock APIs | Partner price/stock portal | 2 |
| INT-9 | reCAPTCHA/honeypot; virus-scan service | Form & upload security | 1 |

### 13.4 Data Model (core entities)

`Organization (partner/vendor)`, `Application (KYC)`, `ApplicationStep`, `Document`, `AuditEvent`, `User` (roles: applicant, partner-admin, staff-reviewer, staff-admin, content-editor), `Brand`, `Product` (+variants, specs), `Category`, `RFQ` (+items), `ServiceLine`, `SoftwareProduct`, `Lead`, `Post/CaseStudy`, `JobOpening`.

---

## 14. SEO Requirements

| ID | Requirement |
|---|---|
| SEO-1 | Keyword strategy across three clusters: (a) distribution intent — "IT distributor in Dubai/UAE", "SSD distributor UAE", "Crucial distributor Dubai", "TeamGroup distributor UAE", "UGREEN distributor UAE", "Hikvision distributor"; (b) solutions intent — "AMC services Dubai", "structured cabling UAE", "firewall solutions Dubai"; (c) software intent — "ERP company Dubai", "POS system UAE", "custom software development Middle East", "AI solutions UAE" |
| SEO-2 | SSR/prerendered HTML for all public pages; no JS-dependent content (counters, nav, forms) |
| SEO-3 | Structured data: Organization, WebSite+SearchAction, Product (+Offer), BreadcrumbList, Article, JobPosting, FAQPage (KYC FAQ), LocalBusiness (3 entities) |
| SEO-4 | Local SEO: Google Business Profile links for office/store/warehouse; NAP consistency |
| SEO-5 | Bilingual hreflang (en/ar) implementation; Arabic keyword mapping |
| SEO-6 | Content calendar (post-launch): 2 posts/month distribution-focused + 1/month software-focused; brand-landing refresh each quarter |
| SEO-7 | 301 map (12.3); no orphaned legacy URLs; custom 404 with search |
| SEO-8 | Core Web Vitals monitoring in CI (Lighthouse budgets) |

---

## 15. Analytics & KPIs

- **Instrumentation:** GA4 events — `rfq_submit` (with item count/track), `kyc_started`, `kyc_step_complete`, `kyc_submit` (application), `kyc_status_view`, `software_lead`, `demo_request`, `whatsapp_click` (page context), `become_partner_click`, `job_apply`, `newsletter_signup`, `gated_download`.
- **Dashboards:** Exec KPI dashboard (§4.3 metrics); KYC funnel dashboard (starts→completions→approvals, SLA compliance); content dashboard (organic landing pages, engagement).
- **Review cadence:** weekly during first month, monthly thereafter.

---

## 16. Phased Roadmap

> Indicative 20-week plan to launch (Phase 1), assuming agency/vendor execution with Simal product owner.

| Phase | Weeks | Milestones |
|---|---|---|
| **P0 — Discovery & Design** | 1–4 | Kickoff; platform decision (§13.1); IA sign-off; design system; wireframes; visual design (EN/AR); content plan & credential validation; **URD §13 R1 moderated prototype testing (EN+AR)** |
| **P1 — Core Build** | 5–12 | CMS setup; front-end build (templates §8); catalog import; RFQ system; software section; forms + CRM + WhatsApp + analytics; KYC wizard + document vault + staff console (build & integrate); AR/RTL |
| **P2 — Content & Migration** | 10–14 (parallel) | Content production (12.2); 301 map; KYC data migration dry-run & reconciliation; legal pages |
| **P3 — QA & UAT** | 15–17 | Functional QA; accessibility audit; performance budget checks; security review + pen-test of KYC flows; UAT with sales/accounts teams (incl. KYC review console UAT) |
| **P4 — Launch** | 18 | DNS cutover; kyc.simalme.com redirect switch; monitoring war-room; announcement |
| **P5 — Stabilize** | 19–20 | 404/redirect fixes; SEO monitoring; hotfix window |
| **Phase 2 (post-launch)** | +3–6 months | Partner portal (price/stock, order history); Peppol exchange; marketing automation; ATS; reviews; RU locale evaluation |

---

## 17. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | KYC migration loses applications/documents or breaks resume links | M | H | Reconciliation report + token-mapped redirects (FR-K.34–36) + parallel-run review console before cutover |
| R2 | Content not ready (leadership, credentials, software copy) blocks launch | H | H | Content workstream starts P0 with named owners; page templates degrade gracefully; "no empty sections" rule |
| R3 | Unvalidated marketing numbers damage credibility | M | M | Management sign-off gate on all public figures (C-4) |
| R4 | Brand/partner trademark misuse (vendor logos, award marks, ISO badges) | M | M | Permissions checklist before design sign-off |
| R5 | SEO equity loss in replatform | M | H | Full 301 map, preserve URL patterns where sensible, Search Console monitoring |
| R6 | Dual-business (distribution + software) muddles positioning | M | M | IA separation + homepage dual-module testing; messaging testing in P0 |
| R7 | Arabic quality (machine-translated feel) | M | M | Professional translation + native review for software/KYC content |
| R8 | Security incident on KYC documents | L | H | NFR-3/4, pen-test, encrypted storage, audit logs, least-privilege access |
| R9 | WhatsApp-dependent sales resists RFQ adoption | M | L | Keep WhatsApp everywhere (FR-1.5); RFQ as acceleration not replacement; track mix |
| R10 | Vendor selection slips (custom KYC complexity underestimated) | M | M | KYC module treated as first-class workstream with dedicated developer; parity checklist as gate |

---

## 18. Assumptions & Dependencies

1. Simal management confirms/validates all public statistics (clients, SKUs, markets, employee count) before launch.
2. Simal owns or can procure brand assets, product imagery, award marks, and partner logo usage permissions.
3. Unisoft Systems Ltd consents to co-branding and supplies product collateral, case-study references, and engineering input for software pages.
4. Current KYC portal's data (applications, documents, audit logs) is exportable in full; accounts team allocates UAT time.
5. CRM choice (HubSpot/Zoho/other) is made by P1 build start; WhatsApp Business number remains +971-managed.
6. Domain DNS control available for `simalme.com` and `kyc.simalme.com`.
7. Budget and agency/vendor selection occur outside this document; timeline (§16) assumes dedicated team.

---

## 19. Acceptance Criteria & Definition of Done

### 19.1 Launch Gate (all must pass)

- [ ] All Must-have (M) requirements in §8 and §9 implemented and QA-passed.
- [ ] **KYC parity checklist (§9.10) fully satisfied**; migration reconciliation signed off by accounts team; old deep links resolve.
- [ ] Zero placeholder content on any public page; all credentials management-approved.
- [ ] EN + AR full journeys (including onboarding wizard) working RTL-correct.
- [ ] Lighthouse mobile ≥85; WCAG 2.1 AA spot-audit passed; pen-test of auth + KYC flows clean (criticals/highs fixed).
- [ ] **Usability validation passed per URD §13**: core-task success ≥90% (vs ~78% industry average), SUS ≥80, zero Sev-1 usability defects open.
- [ ] 301 redirect map deployed & verified (incl. kyc.simalme.com); XML sitemaps submitted.
- [ ] GA4 events firing (§15); CRM receiving all lead types with correct routing.
- [ ] Backups + restore tested; monitoring/alerts live; runbook handed over.
- [ ] Content team trained on CMS; 30-day post-launch support plan agreed.

### 19.2 Definition of Done (per feature)

Code reviewed + unit/integration tested + staging UAT + docs updated + analytics events verified + accessibility check + sign-off by product owner.

### 19.3 Test Strategy Summary

| Layer | Scope | Gate |
|---|---|---|
| Unit & integration | Custom modules (KYC wizard state machine, document vault, RFQ basket, lead routing, auth) with automated tests in CI | Merge-blocking |
| Cross-browser/RTL | EN + AR journeys on supported browsers; RTL layout parity checks | Per-release |
| End-to-end | Critical journeys: onboarding submit→review→approve; RFQ submit→CRM receipt; software demo request; careers application; 301 redirects (incl. kyc.simalme.com deep links) | SG-3 (pre-launch) |
| Migration verification | KYC reconciliation report (counts + checksums); token-mapped link resolution tests; SEO redirect coverage scan | SG-2/SG-3 |
| Performance | Lighthouse budgets in CI (mobile ≥85, LCP ≤2.5s) on key templates | Per-release |
| Accessibility | WCAG 2.1 AA audit (keyboard, contrast, alt text, AR screen-reader labels) on key pages | SG-3 |
| Security | SAST/DAST in CI; pre-launch penetration test of auth + KYC flows (incl. document vault access control and audit logging) | SG-3 (launch-blocking) |
| UAT | Sales (RFQ/CRM), Accounts (review console, migration exceptions), Marketing (CMS bilingual), partner beta group (onboarding UX) — **plus URD §13 usability rounds R1–R3 with SUS ≥80 and core-task success ≥90% as pass criteria** | SG-3 |

---

## 20. Appendices

### Appendix A — Simal Fact Sheet (researched, for content team)

- Legal names & roles: Simal Technologies Middle East LLC (HQ/office, Bur Dubai, +971 4 325 1430); StarSeed Technologies ME FZE (warehouse, JAFZA RA08DA07); Stellent Technologies ME LLC (store, Bur Dubai, +971 4 393 0507); Unisoft Systems Ltd (software delivery partner, Dhaka). **Simal is an independent company — no TwinMOS/Smart Group affiliation (management correction, 3 Oct 2026; a previously listed "TwinMOS Technologies ME FZE" group-storage entity is removed from this fact sheet and must not be published).**
- Emails: info@simalme.com · mkt@simalme.com · accounts@simalme.com. Fax: +971 4 393 1851.
- **Working hours (⚠ unreconciled):** Contact page publishes Mon–Fri 9:00–20:00, Sat 9:00–15:00, Sun closed; KYC portal states support Sun–Thu. One official schedule must be confirmed by management before publication (FR-9.1, FR-K.40).
- Founded 2002 (site) / 2003 (LinkedIn) — harmonize to **2002** pending management confirmation.
- Markets: UAE, GCC, Middle East & Africa, CIS. Channel: resellers, SIs, retailers, e-commerce (Amazon, Sharaf DG, Microless).
- Awards: Hikvision Best Distributor Partner; TeamGroup Best Partner 2025.
- **Existing public claims to verify before republication:** "1000+ Customers" (Crucial landing page); "the one and only exclusive authorized distributor of UGREEN across the UAE" (UGREEN landing page); "20+ Years" and "Fastest Delivery" (Crucial landing page).
- Catalog snapshot (mirror, shop listing): 76 products — Computer Components 35 (SSD 14, Portable SSD 12, RAM 4, VGA 5), Computer Accessories 30 (incl. Honeywell surge/power 12+), Monitors 6 (Aiwa 3, KOORUI 3), Gaming 9, Laptops 3 (Dell/HP/Lenovo).
- Social: LinkedIn (Simal Technologies Middle East LLC, ~1.8k followers), Facebook (SimalTechnologiesMiddleEast), Instagram (simaltechnologiesuae), WhatsApp business line.

### Appendix B — Unisoft Capability Matrix (source: uslbd.com)

- Company: Unisoft Systems Ltd ("Top 3 software development company in Bangladesh"), founded 2015, Youth Tower, Begum Rokeya Sarani, Dhaka; info@uslbd.com; +880 1712-345678; 24/7 support (BST).
- Certifications/memberships: ISO 9001, ISO 27001, SOC 2, BASIS member; NBR approval (UniVAT).
- Stats (claimed): 150+ projects, 100+ clients, 40+ engineers, 98% satisfaction, 98% on-time, 95% retention; talent from BUET/DU/NSU; rates 60–70% below US/EU.
- **Technology stack (verified 3 Oct 2026, uslbd.com/company/technologies — 44 technologies):** Languages: JavaScript, TypeScript, Python, Java, Go, .NET, PHP, Ruby · Front-end: Next.js, Vue.js, Angular, React, Material UI, Tailwind CSS · Mobile: React Native, Flutter, Kotlin, Swift, PWA · Back-end: Node.js, GraphQL · Data: PostgreSQL, MongoDB, Redis, MySQL, Elasticsearch, Microsoft SQL Server, Oracle · Cloud: AWS, Google Cloud, Azure, DigitalOcean, Heroku · Platforms: Docker, Kubernetes · IaC/CI-CD: Terraform, Ansible, GitHub Actions, Jenkins · AI/ML: TensorFlow, PyTorch, LangChain, OpenAI.
- ⚠ Public case-studies page verified **empty** ("0 case studies available") as of 3 Oct 2026 — launch case-study seed material must be commissioned directly from Unisoft (see FR-6.6).
- Services (12) and products (10+ ERPs, 10+ specialized systems) — full lists in §2.3/§8.6.
- Industries: healthcare, banking/finance, e-commerce/retail, manufacturing, education, government, logistics, real estate.

### Appendix C — Benchmark Takeaways (full analysis §3.3)

- CDW: solutions-integrator positioning; 8-item nav; vertical segmentation; insights hub with reading-time labels; account-centric commerce.
- Redington: credential strip; Solutions×4 facets; 10 service categories; regional microsites; "Become a Partner" persistent CTA; stats (39.5k partners, 290+ brands, 70+ offices, 7M sq ft); avoid its weaknesses (menu overload, dead links, buried ESG).
- Ingram Micro: Xvantage AI platform narrative; customer/vendor dual CTAs; scale credentials (165k customers, 1.5k vendors); ESG pillar; case-study videos.

### Appendix D — Brand List (launch catalog SEO pages)

Crucial/Micron · Hikvision · Hiksemi · TeamGroup · UGREEN · ADATA · KOORUI · Aiwa · Arktek · Nearity · Dell · HP · Lenovo · MSI · Samsung · SanDisk · Kingston · Toshiba · WD · ZOTAC · PNY · Honeywell · Kaspersky *(23 brands — TwinMOS removed per the 3 Oct 2026 no-association correction; confirm active authorizations with management per brand)*

### Appendix E — Sources & References

- Simal mirror audit (workspace: `Mirror_site/`, `audit_mirror.py`, `mirror_site.py`, `server.py`)
- Simal live site: https://www.simalme.com/ · About: https://www.simalme.com/about-it-distributor-in-uae/ · KYC portal: https://kyc.simalme.com/
- Simal LinkedIn: https://ae.linkedin.com/company/simal-technologies-middle-east-llc · Facebook: https://www.facebook.com/SimalTechnologiesMiddleEast/ · Instagram: https://www.instagram.com/simaltechnologiesuae/
- Unisoft Systems Ltd: https://uslbd.com/ (services: /services/, products: /products/)
- Benchmarks: CDW https://www.cdw.com/ · Redington https://www.redingtongroup.com/ · Ingram Micro https://www.ingrammicro.com/
- Directories previously asserting a Simal/TwinMOS group association (TradeFord, Kadorf, HiDubai, Citysearch listings): association **withdrawn by management 3 Oct 2026** — the new site must not repeat it, and no TwinMOS-branded content may be published

### Appendix F — Glossary

**RFQ** Request for Quote · **KYC** Know Your Customer (partner due-diligence onboarding) · **TRN/TIN** Tax Registration/Identification Number (UAE) · **Peppol** international e-invoicing network adopted for UAE e-invoicing · **PDPL** UAE Federal Personal Data Protection Law · **AMC** Annual Maintenance Contract · **SI** System Integrator · **JAFZA** Jebel Ali Free Zone Authority · **RTL** Right-to-Left (Arabic UI) · **SSR** Server-Side Rendering · **DXP** Digital Experience Platform · **BASIS** Bangladesh Association of Software & Information Services · **NBR** National Board of Revenue (Bangladesh)

---

*End of PRD v1.4 — prepared from primary research of Simal's mirror & live properties, Unisoft's corporate site, and benchmark distributor platforms; verified through five QA passes (cross-references, factual precision, brand-asset grounding, reverse traceability to BRD/URD, family synchronization). All marketing figures marked for management validation prior to publication.*
