# User Requirements Document (URD)

## Simal Digital Platform — User Requirements, Personas, Use Cases & Usability Validation

| Field | Detail |
|---|---|
| **Document Title** | Simal Digital Platform — User Requirements Document |
| **Version** | 1.3 |
| **Date** | 3 October 2026 |
| **Status** | Draft — for stakeholder review & sign-off |
| **Prepared For** | Simal Technologies Middle East LLC — Executive Sponsor, Product Owner, Delivery Team |
| **Document Family** | **BRD v1.3** (why the business invests — objectives, market, ROI) → **URD v1.2** (this document — **who the users are and what they need to accomplish**) → **PRD v1.4** (what gets built — features, architecture, NFRs) → **FRS v1.2** (how the system shall behave — 225 testable requirements). Every user requirement herein traces to PRD functional requirements and BRD business requirements (Appendix A). |
| **Method** | Personas and journeys expanded from PRD §5; user-voice evidence from Simal's published testimonials (mirror audit); usability benchmarks from published research (SUS/Sauro-Lewis grading; ISO 9241 effectiveness-efficiency-satisfaction framing); Arabic/RTL UX guidance from MENA-focused design research; B2B behavior data from Gartner/Forrester-cited studies (as sourced in BRD §4.3). Research citations in Appendix C. |
| **Change Record** | v1.0 — Initial URD. 12 user groups (8 external, 4 internal), 44 user requirements, 8 epics with 42 user stories, 9 detailed use cases, 4 journey maps, usability requirements (SUS ≥80 target), accessibility requirements (WCAG 2.1 AA, RTL semantics), usability validation plan, full traceability to PRD / BRD.<br>v1.1 — Audit pass 4: **closed the IT Solutions & Services chain gap** (added group H, UR-45…UR-47, epic E9, core task 9 — PRD FR-5 previously had no UR coverage and no BRD anchor, now BR-33); ACC-3 color rules grounded in computed WCAG ratios (#0050A0 7.91:1, #E01020 4.92:1, #F0F000 1.22:1-on-white prohibition); USAB-1 benchmarked against the ~78% industry average task success (MeasuringU, ~1,100-task database); §2.4 trace wording corrected; RTL-4 UAE numeral convention added; Appendix A coverage note for intentionally unmapped BRs (21–24, 31–32); document-family versions synchronized.<br>v1.2 — Audit pass 5: document-family line updated to the four-document family; subsequently updated to FRS v1.2 (no URD changes).<br>v1.3 — **Management correction — corporate independence:** UR-32 rewritten — Simal is a fully independent company (no TwinMOS/Smart Group family narrative); Unisoft framed as software delivery partner. Requirement ID, priority, and trace unchanged. |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Purpose, Scope & Method](#2-purpose-scope--method)
3. [The User Universe](#3-the-user-universe)
4. [Context of Use](#4-context-of-use)
5. [Personas](#5-personas)
6. [User Requirements (UR-01…UR-47)](#6-user-requirements-ur-01ur-47)
7. [User Stories by Epic](#7-user-stories-by-epic)
8. [Use Cases (Critical Scenarios)](#8-use-cases-critical-scenarios)
9. [User Journeys (Current Pain → Future State)](#9-user-journeys-current-pain--future-state)
10. [Usability Requirements](#10-usability-requirements)
11. [Accessibility Requirements](#11-accessibility-requirements)
12. [Content Requirements from the User Perspective](#12-content-requirements-from-the-user-perspective)
13. [Usability Validation & User Acceptance Plan](#13-usability-validation--user-acceptance-plan)
14. [Assumptions, Constraints & Dependencies](#14-assumptions-constraints--dependencies)
15. [Appendices](#15-appendices)

---

## 1. Executive Summary

The BRD established *why* Simal is investing: buyers now complete most of their journey independently (a ~220-day research blind spot; 67% prefer rep-free experiences; 80% of B2B sales interactions digital), the UAE e-invoicing mandate makes integrated partner onboarding urgent, and the software business needs a launch surface. The PRD defined *what* to build. This URD defines the third leg: **who the users are, what each of them needs to accomplish, and how well the system must serve them for the business outcomes to materialize**.

The platform serves **twelve distinct user groups** — eight external (resellers, system integrators, enterprise buyers, software buyers, vendor/brand managers, job seekers, existing partners interacting with KYC, media) and four internal (KYC reviewers, sales executives, content editors, platform admins). For each, this document specifies user requirements, stories, and acceptance behavior, with particular depth on the four journeys that carry the business case:

1. **Reseller → RFQ** (demand capture, BRD BO-2) — a buyer on a phone, often Arabic-speaking, must go from *search/spec-check* to *multi-item quote request* in under three minutes.
2. **Partner → integrated KYC onboarding** (BO-4/BO-5) — a vendor or customer must complete onboarding in ~10 minutes with confidence, never redoing work, and be able to prove e-invoicing readiness; reviewers must clear applications within 2 business days without leaving one console.
3. **Software buyer → consultation/demo** (BO-3) — a CIO evaluating ERP/POS replacement must find credible, MEA-contextualized proof and book a demo without a phone call.
4. **Vendor manager → credibility check** (BO-1) — a brand principal deciding on authorization must find credentials, coverage, and professionalism in one visit.

Usability is specified measurably: core-task success ≥90%, RFQ submission ≤3 minutes, onboarding resumability with zero re-entry, System Usability Scale target **≥80 ("A" grade; 68 is industry average)**, and full Arabic RTL parity following MENA RTL design practice (directional semantics, curated — not blindly mirrored — visuals). The document closes with a usability validation plan (moderated tests per persona, Arabic-speaking participants mandatory, beta partner group) that feeds the PRD's SG-3 QA/UAT gate, and a complete traceability matrix binding every UR to PRD requirements and BRD business requirements.

---

## 2. Purpose, Scope & Method

### 2.1 Purpose

- Give designers, developers, and QA a single authoritative **user-centered** reference: who the users are, what they try to do, in what context, with what success criteria.
- Provide the **user-acceptance layer** for the BRD/PRD traceability chain: Business Objective (BRD) → Business Requirement (BRD) → **User Requirement (URD)** → Functional Requirement (PRD) → Test (PRD §19.3).
- Define usability and accessibility quality bars and the validation method (§13) so "user-friendly" is an acceptance criterion, not an aspiration.

### 2.2 In Scope / Out of Scope

**In scope:** all public website users (EN/AR), authenticated partner/applicant users, and internal staff console users (KYC reviewers, content editors, admins, sales using RFQ/CRM queues). **Out of scope:** internal CRM UI itself (referenced only as a downstream system), Unisoft's internal delivery tooling, and Phase 2 partner-portal commerce features (noted as future journeys where relevant).

### 2.3 Method & Sources

1. Personas/journeys seeded from PRD §5 and enriched with Simal's published testimonials (user-voice evidence, Appendix B) — e.g., real feedback themes: *"fast reply," "good price," "quick delivery," "easy to approach staff," "occasional stock shortages."*
2. Usability targets grounded in published benchmarks: SUS grading (Sauro & Lewis — 68 average/"C", 80.3+ "A"/excellent); ISO 9241 effectiveness-efficiency-satisfaction framing for task metrics.
3. RTL/Arabic requirements grounded in MENA design research (§10.4).
4. B2B behavior requirements grounded in the Gartner/Forrester-cited studies already sourced in BRD §4.3 (220-day blind spot; rep-free preference; AI-assisted research).
5. Mobile parity grounded in traffic reality (~63% of global web visits are mobile; ~99% GCC internet penetration — Appendix C).

### 2.4 Requirement Conventions

- `UR-nn` — user requirement ("the user needs…"). Priority MoSCoW (M/S/C).
- `US-x.y` — user story (epic x).
- `UC-nn` — use case. `USAB-nn` — usability requirement. `ACC-nn` — accessibility requirement.
- Every UR traces to PRD FR(s) and — where the requirement carries direct business demand — to BRD BR(s); the full matrix is in Appendix A.

---

## 3. The User Universe

### 3.1 External Users

| ID | User group | Snapshot | Primary success (their words) |
|---|---|---|---|
| UG-1 | **Channel reseller / trader** | Shop or trading company in Dubai/Deira Computer Plaza, KSA, Oman; buys components weekly; price- and availability-driven; heavy WhatsApp user; often Arabic-first | "I found the SKU, checked the spec, sent the list, got a quote same day" |
| UG-2 | **System integrator** | Project-based buyer; needs security/networking/storage bundles, project pricing, technical docs | "I can spec a whole project from their catalog and get one quote" |
| UG-3 | **Enterprise IT buyer / IT manager** | Corporate IT in UAE/KSA/GCC; needs supply + AMC + managed services; procurement-grade information | "Their site convinced my procurement team they're a serious supplier" |
| UG-4 | **Software buyer (CIO/CTO/IT lead)** | Evaluating ERP/POS/custom software for retail, hospitality, healthcare, education in MEA; risk-averse; wants proof + local support | "I understood exactly what they build, saw proof, and booked a demo" |
| UG-5 | **Vendor / brand channel manager** | Global or regional brand deciding on/granting distribution authorization | "Ten minutes on their site told me they can represent our brand properly" |
| UG-6 | **Job seeker** | IT sales/logistics/marketing/engineering candidates in UAE and Bangladesh (group careers) | "I saw the culture, found the role, applied with my CV in minutes" |
| UG-7 | **Existing partner (applicant / partner admin)** | Reseller or vendor completing KYC onboarding or annual re-validation; operations/admin staff | "I onboarded once, fixed only what they flagged, and never lost my work" |
| UG-8 | **Media / analyst / researcher** | Trade press, market analysts, event organizers | "I found facts, leadership, and a press kit without emailing anyone" |

### 3.2 Internal Users

| ID | User group | Snapshot | Primary success |
|---|---|---|---|
| UG-9 | **KYC reviewer (Accounts)** | Verifies legal entities, documents, TRN/Peppol IDs; owns the 2-business-day SLA | "I cleared today's queue without switching tools, and flagged exactly what's wrong" |
| UG-10 | **Sales executive** | Works RFQ queue and WhatsApp in parallel; needs speed and context | "Every lead arrived with full context and none slipped" |
| UG-11 | **Content editor (Marketing)** | Publishes bilingual content, campaigns, brand pages without dev help | "I published the Arabic campaign myself, on time, correctly formatted RTL" |
| UG-12 | **Platform admin** | Manages users/roles, monitors SLA & data-quality dashboards, retention policies | "I can prove compliance and see problems before they escalate" |

### 3.3 User-Voice Evidence (from Simal's published testimonials — Appendix B)

Recurring themes the platform must amplify: **responsiveness** ("fast reply", "well-behaved and very responsive"), **pricing competitiveness**, **delivery reliability** ("orders sent on time, even when our own delivery team is busy"), **product quality/genuineness**, and one constructive complaint — **occasional stock shortages** — which motivates the availability-communication requirements (UR-06, UR-08).

---

## 4. Context of Use

| Factor | Context & design consequence |
|---|---|
| **Devices** | Mobile majority (~63% of global web visits; GCC ~99% internet penetration). **Mobile-first task parity is mandatory** — RFQ, onboarding wizard, and dashboards fully usable at 360px |
| **Languages** | English + Arabic (RTL). Many users are bilingual; code-switching is common. Language must be switchable on any page with position preserved |
| **Connectivity** | Mostly good in UAE/GCC; variable in parts of Africa/CIS corridors → progress must never be lost (autosave), pages must be light (PRD NFR-1), and forms must tolerate flaky connections |
| **Working rhythm** | UAE workweek Sun–Thu (to be reconciled per PRD FR-9.1); Ramadan hours; buyers research on evenings/weekends when sales is offline → self-serve completeness matters (the 220-day blind spot) |
| **Channel habit** | WhatsApp is the reflex channel (current product pages say "Whatsapp order") → WhatsApp stays first-class beside every structured flow |
| **AI-mediated research** | Buyers increasingly ask AI assistants to compare vendors (51% of software buyers start with AI more than Google) → content must be structured, factual, machine-readable (PRD SEO-2/3) |
| **Compliance environment** | Partners face UAE Peppol e-invoicing phases (mandatory Phase 1 Jan 2027) → onboarding must *help* them get identifiers right, not just collect them |
| **Assistive & situational limits** | Screen-reader users (EN/AR), keyboard-only users, one-handed mobile use in a shop, glare → WCAG 2.1 AA (§11), large touch targets, contrast |
| **Trust context** | Counterfeit concern in component markets → genuineness/authorization signals must be visible at product level |

---

## 5. Personas

*(Five seeded from PRD §5.2, enriched; five added for internal and adjacent groups.)*

| # | Persona | Group | Goals | Frustrations today | Key platform needs |
|---|---|---|---|---|---|
| P1 | **Rashid** — reseller owner, Bur Dubai computer plaza (UG-1) | Reseller | Same-day stock check on Crucial/TeamGroup memory; bulk price fast; re-order weekly | "Call For Price" dead-end; prices only via WhatsApp; no order history | Fast catalog search, spec tables, multi-item RFQ ≤3 min, WhatsApp shortcut, saved lists |
| P2 | **Fatima** — IT Director, Abu Dhabi logistics group (UG-3) | Enterprise | One partner for hardware + AMC + managed services + eventually warehouse ERP | Site reads like a shop, not a partner; no services depth; no Arabic for her GM | Credibility signals, service pages, industry page, consultation request, AR version |
| P3 | **Omar** — CIO, Saudi retail chain (UG-4) | Software buyer | Replace POS/ERP; needs Arabic UI, local references, credible delivery org, predictable cost | Nothing about software on simalme.com; Unisoft unknown in KSA | Software section, UniPOS/Distribution ERP pages with MEA context, demo booking, proof/case studies, delivery model transparency |
| P4 | **Elena** — Channel Manager, global component vendor (UG-5) | Vendor | Decide on MEA authorization; assess reach & professionalism | No leadership, thin about, no market-coverage story | Credentials strip, coverage map, brand page quality, awards, partnerships contact |
| P5 | **Ahmed** — Partner ops manager, Dubai reseller (UG-7) | Partner | Complete KYC once; re-validate yearly; never lose work | Separate portal login; fears re-doing forms; unclear status | Single account, resumable wizard, fix-only-flagged steps, status tracking, expiry alerts |
| P6 | **Sana** — Accounts reviewer, Simal (UG-9) | Internal | Clear applications within 2 business days; verify TRN/Peppol correctly | Email ping-pong; re-typing into sheets; no audit trail | Review console queue, side-by-side docs, per-field flags, SLA aging, audit log |
| P7 | **Bilal** — Sales executive, Simal (UG-10) | Internal | Respond to every RFQ ≤1 business day; know context before calling | WhatsApp chaos; leads untracked; repeat questions | RFQ queue with full item lists & company data, templates, CRM sync, mobile app-grade UI |
| P8 | **Mariam** — Marketing lead/content editor, Simal (UG-11) | Internal | Publish bilingual campaigns/brand pages without tickets | Dev-dependent changes; EN-only workflow; no preview of RTL | CMS with AR preview, scheduled publishing, media library, form-builder, analytics view |
| P9 | **Priya** — IT graduate job seeker, Dubai (UG-6) | Careers | Understand culture; apply quickly; speculative interest | Empty careers page today | EVP content, role listings, CV upload with consent, confirmation |
| P10 | **Karim** — Trade journalist (UG-8) | Media | Get facts, quotes, logos fast for a distribution-story deadline | No newsroom; no press kit | Newsroom, milestones, leadership bios, press-kit download |

---

## 6. User Requirements (UR-01…UR-47)

> Format: each UR states the need, why (user value), priority, and trace. MoSCoW: **M** must / **S** should / **C** could.

### A. Catalog & Product Finding (UG-1/2/3)

| ID | User requirement | Pri | Trace (PRD / BRD) |
|---|---|---|---|
| UR-01 | Find any product in ≤3 interactions via search or category facets — searching by SKU fragment, brand, or common name ("Crucial 1TB Gen4") | M | FR-1.3, FR-4.2 / BR-10 |
| UR-02 | See complete, trustworthy specifications per product (capacity, interface, speed, warranty) and downloadable datasheets — enough to spec a project without calling | M | FR-4.3 / BR-10 |
| UR-03 | Confirm product genuineness and authorization at product/brand level (badges: "Authorized {Brand} Distributor in UAE") | M | FR-4.1, FR-2.9 / BR-04, BR-05 |
| UR-04 | Browse brand pages that explain the relationship (e.g., UGREEN exclusivity claim once verified) and list that brand's full local range | M | FR-4.1 / BR-04 |
| UR-05 | Compare up to 4 products side-by-side on specs | C | FR-4.6 / — |
| UR-06 | Understand availability honestly: "Check availability & price" instead of dead "Call For Price" | M | FR-4.3, FR-4.7 / BR-07, BRule-1 |
| UR-07 | View the catalog fully in Arabic with equal content depth (not a summary) | M | FR-1.1, D-4 / BR-01, BRule-9 |
| UR-08 | See "new launch" and trending items (e.g., Crucial E100) surfaced on home/category levels | S | FR-2.1, FR-4.5 / BR-26 |

### B. Quoting & Ordering (UG-1/2/3)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-09 | Build a multi-item RFQ basket across brands/categories and submit once with company details — anonymous or signed-in | M | FR-4.4 / BR-07 |
| UR-10 | Complete an RFQ submission in ≤3 minutes on a phone | M | USAB-2 / BR-07 |
| UR-11 | Receive instant acknowledgement with a reference number and a ≤1-business-day response promise | M | FR-4.4, BRule-2/6 / BR-07 |
| UR-12 | Continue via WhatsApp from any product/RFQ context with details pre-filled (bridges today's habit) | M | FR-1.5 / BR-08 |
| UR-13 | Signed-in partners get pre-filled RFQ forms and see their RFQ history | S | FR-4.4, FR-10.2 / BR-20 |
| UR-14 | Prices in AED context; quote-based commerce — users never need a credit card | M | BRule-1 / BR-11 |

### C. Partner Onboarding & KYC (UG-7 external; UG-9 internal)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-15 | Choose the right onboarding track (Customer vs Vendor/Supplier) with plain-language guidance in EN/AR | M | FR-K.6 / BR-16 |
| UR-16 | Complete onboarding in ~10 minutes, with autosave — closing the tab mid-way loses nothing | M | FR-K.7 / BR-16 |
| UR-17 | Fix **only** flagged items when asked for more information — never re-enter correct data | M | FR-K.7 / BR-16 |
| UR-18 | Get help producing correct UAE e-invoicing identifiers: TRN format validation and Peppol ID construction guidance (`0235:` + 15-digit TRN) inline | M | FR-K.8/9, FR-K.28 / BR-18 |
| UR-19 | Upload trade licence/ID documents securely (encrypted, virus-scanned) and see what was received | M | FR-K.10, FR-K.18/22 / BR-25 |
| UR-20 | Track application status (Submitted → Under review → Info required → Approved/Rejected) with timestamps, from the same account as everything else | M | FR-K.12, FR-K.15 / BR-16, BR-20 |
| UR-21 | Receive reminders before licences/IDs expire and re-validate in minutes | M | FR-K.11 / BR-20 |
| UR-22 | (Internal reviewers) Work a queue with SLA aging, side-by-side document viewer, per-field approve/flag with notes — approving or rejecting without leaving the console | M | FR-K.23/24, FR-K.39 / BR-19 |
| UR-23 | (Internal) Trust that every action is audit-logged and documents are access-controlled | M | FR-K.19, FR-K.18, BR-25 / BR-30 |

### D. Software Services (UG-4)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-24 | Understand within one page view what Simal Software Services is, who builds it (Unisoft), and why it's credible (ISO/SOC 2, 150+ projects, 40+ engineers, 24/7) | M | FR-6.1, FR-6.8 / BR-12, BR-14 |
| UR-25 | Explore packaged products (UniPOS, Distribution ERP, UniVAT, Hotel/Hospital/Education ERP…) with features, target industry, and demo CTA | M | FR-6.3 / BR-12 |
| UR-26 | Explore 12 services (custom dev, AI/ML, cloud, cyber, data/BI…) with MEA-relevant scope and the verified technology stack | M | FR-6.2 / BR-12 |
| UR-27 | See industry solutions that combine software + hardware + services (e.g., Retail = UniPOS + POS hardware + networking + AMC) | M | FR-6.4 / BR-12 |
| UR-28 | Book a consultation or product demo without phoning; get a ≤1-business-day response | M | FR-6.7, BRule-2 / BR-13 |
| UR-29 | Read at least two credible case studies (distribution + software) at launch | M | FR-6.6, C-6 / BR-15 |
| UR-30 | Understand engagement models (fixed price / T&M / dedicated team / managed support) before engaging sales | S | FR-6.5 / BR-12 |

### E. Information, Trust & Content (UG-3/5/8, all)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-31 | Grasp Simal's scale instantly on the homepage (years, brands, clients, markets — real numbers, statically visible) | M | FR-2.2 / BR-03 |
| UR-32 | Find the company story: who Simal is (independent distributor since 2002 — no group narrative), the three UAE entities, leadership, and the Unisoft software-partner relationship | M | FR-3.1/3.2/3.3 / BR-02 |
| UR-33 | Verify market coverage (UAE/GCC/MEA/CIS) via a coverage map and fulfillment explanation | M | FR-3.6 / BR-02 |
| UR-34 | Read awards and recognitions with context (Hikvision Best Distributor Partner; TeamGroup Best Partner 2025) | M | FR-3.5, FR-2.9 / BR-05 |
| UR-35 | Access newsroom, blog ("Tech Talk"), case studies, and downloadable line cards/decks — journalists get a press kit | S | FR-7.1/7.4/7.5 / BR-26, BR-27 |
| UR-36 | Contact the right department through one form with a represent-type selector (New/Existing Partner, Customer, Vendor-OEM, Media, Job Seeker) — or see direct phone/email/WhatsApp per office | M | FR-9.1/9.2 / BR-06, BRule-6 |
| UR-37 | See one consistent set of working/support hours everywhere (today's sites contradict each other) | M | FR-9.1, BRule-3 / BR-06 |

### F. Careers (UG-6)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-38 | Learn culture, benefits, growth and group opportunities (UAE + Unisoft Dhaka) | M | FR-8.1 / BR-28 |
| UR-39 | Apply to a listed role or submit a speculative application with CV upload + consent — never an empty page | M | FR-8.2/8.3 / BR-28 |

### G. Account & Global Experience (all authenticated + all)

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-40 | One account for everything (RFQ history, onboarding, documents) — no separate portal credentials | M | FR-10.1, FR-K.2 / BR-16 |
| UR-41 | Switch EN↔AR on any page and stay in place; layouts mirror correctly (§10.4) | M | FR-1.1, D-4 / BR-01 |
| UR-42 | Old links keep working — emailed resume/track links from the previous KYC portal must land on the right step, not a 404 | M | FR-K.35/36 / BR-17 |
| UR-43 | (Internal editors/admins) Publish bilingual content and administer users/roles/dashboards without developer intervention | M | FR-7.2, FR-K.23/27, NFR-11 / BR-26, BR-29 |
| UR-44 | Every user gets clear errors, confirmations, and next steps — no silent failures (form submitted? document received? what happens next?) | M | USAB-6/7 / BR-09 |

### H. IT Solutions & Services (UG-2/3) — *added in v1.1 to close the FR-5 traceability gap*

| ID | User requirement | Pri | Trace |
|---|---|---|---|
| UR-45 | Explore the 12 IT service lines (AMC, IT infrastructure, managed services, network & IT security, firewall, cloud security, data recovery & storage, structured cabling, IP telephony, AV & meeting rooms, support & maintenance, software & licensing) with outcomes, scope, deliverables and SLAs — enough to shortlist Simal in a services tender without a sales call | M | FR-5.1 / BR-33 |
| UR-46 | See industry-specific IT propositions (retail, healthcare, education, hospitality, government, logistics, SME, enterprise) combining hardware supply + services + software in one offer | S | FR-5.2 / BR-33 |
| UR-47 | Request a services consultation (e.g., an AMC proposal) with ≤1-business-day response, routed to services sales — in EN or AR | M | FR-5.1, BRule-2/6 / BR-33 |

---

## 7. User Stories by Epic

> Format: **US-x.y** — *As a ‹role›, I want ‹capability›, so that ‹benefit›.* (Priority in parentheses.)

### Epic E1 — Discover & Evaluate (Catalog)
- US-1.1 As a **reseller**, I want to search by SKU fragment or brand so that I can find the exact part a customer just asked for. (M)
- US-1.2 As a **reseller**, I want spec tables and datasheets on the product page so that I don't have to ask sales basic questions. (M)
- US-1.3 As an **integrator**, I want to filter by category + brand + key specs so that I can build a project BOM quickly. (M)
- US-1.4 As a **buyer worried about fakes**, I want authorization badges on brand and product pages so that I know stock is genuine with local warranty. (M)
- US-1.5 As a **reseller**, I want to compare up to 4 SKUs so that I can pick the right margin/spec mix. (C)
- US-1.6 As a **mobile user**, I want the full catalog experience on my phone so that I can work from the shop floor. (M)

### Epic E2 — Quote (RFQ) & Contact
- US-2.1 As a **reseller**, I want to add multiple items to an RFQ basket across brands so that I request one quote, not ten messages. (M)
- US-2.2 As a **reseller**, I want to submit without creating an account so that nothing slows me down the first time. (M)
- US-2.3 As a **returning partner**, I want my details pre-filled so that re-quoting takes seconds. (S)
- US-2.4 As any **user**, I want a reference number and SLA promise after submitting so that I know it was received and when to expect a reply. (M)
- US-2.5 As a **WhatsApp-native user**, I want a pre-filled WhatsApp handoff from any product so that I can use the channel I trust. (M)
- US-2.6 As a **sales executive**, I want every RFQ in a queue with full context so that I respond within a day without asking the customer to repeat themselves. (M)

### Epic E3 — Partner Onboarding (KYC)
- US-3.1 As a **new partner**, I want plain-language track selection so that I start the right process (customer vs vendor). (M)
- US-3.2 As an **applicant interrupted mid-form**, I want autosave and resume so that a lost connection doesn't cost me my work. (M)
- US-3.3 As an **applicant asked for corrections**, I want only flagged fields reopened so that I fix one thing, not everything. (M)
- US-3.4 As a **partner admin unfamiliar with Peppol**, I want inline TRN/Peppol ID guidance so that I get e-invoicing identifiers right the first time. (M)
- US-3.5 As an **applicant**, I want secure upload with confirmation so that I trust sending our trade licence and banking details. (M)
- US-3.6 As an **applicant**, I want live status with timestamps so that I never phone to ask "where are we?". (M)
- US-3.7 As a **partner**, I want expiry alerts so that re-validation is routine, not an emergency. (M)
- US-3.8 As a **reviewer (Sana)**, I want a prioritized queue with SLA aging so that I keep the 2-day promise. (M)
- US-3.9 As a **reviewer**, I want per-field flags with notes the applicant can act on so that corrections come back right. (M)
- US-3.10 As an **applicant with an old email link**, I want it to land on my saved draft so that nothing breaks after migration. (M)

### Epic E4 — Software Services
- US-4.1 As a **CIO**, I want to understand who actually builds the software so that I can assess delivery risk. (M)
- US-4.2 As a **retail CIO**, I want a UniPOS/Distribution ERP page with retail-specific proof so that I can shortlist without a meeting. (M)
- US-4.3 As a **CFO's technical advisor**, I want the technology stack and engagement models so that I can shape a realistic RFP. (M)
- US-4.4 As a **software buyer**, I want to book a demo with a date picker so that engagement starts on my schedule. (M)
- US-4.5 As a **skeptic**, I want case studies with outcomes so that claims are believable. (M)
- US-4.6 As an **Arabic-first CIO**, I want the whole software story in Arabic so that I can share it internally. (S)

### Epic E5 — Trust & Company
- US-5.1 As a **vendor manager (Elena)**, I want credentials and coverage in one view so that authorization due-diligence is fast. (M)
- US-5.2 As an **enterprise buyer (Fatima)**, I want leadership and group structure so that I know who stands behind the SLA. (M)
- US-5.3 As a **journalist (Karim)**, I want a press kit and recent news so that I can write without an interview loop. (S)
- US-5.4 As any **visitor**, I want real counter values even with JavaScript off so that the site never looks broken. (M)

### Epic E6 — Careers
- US-6.1 As a **candidate (Priya)**, I want culture and benefits content so that I can decide whether to apply. (M)
- US-6.2 As a **candidate**, I want to apply with CV upload and get confirmation so that I know it was received. (M)
- US-6.3 As a **candidate with no matching role**, I want a speculative-application path so that the page is never a dead end. (M)

### Epic E7 — Account & Localization
- US-7.1 As a **partner**, I want one sign-in for RFQs, documents, and onboarding so that I'm not juggling portals. (M)
- US-7.2 As an **Arabic user**, I want to flip to Arabic anywhere and stay on the same content so that nothing feels second-class. (M)
- US-7.3 As a **user on a slow connection**, I want lightweight pages and never to lose form state so that the site works in my conditions. (M)

### Epic E8 — Internal Operations
- US-8.1 As a **content editor (Mariam)**, I want to preview Arabic RTL before publishing so that I don't ship broken layouts. (M)
- US-8.2 As an **admin**, I want SLA and Peppol data-quality dashboards so that I spot problems before partners complain. (M)
- US-8.3 As an **admin**, I want role-based access so that only the right staff see sensitive documents. (M)
- US-8.4 As a **reviewer**, I want internal notes the applicant can't see so that candid review remarks stay internal. (S)

### Epic E9 — IT Solutions & Services
- US-9.1 As an **enterprise IT manager (Fatima)**, I want to understand what an AMC covers and what SLAs Simal commits to so that I can put it into next year's budget. (M)
- US-9.2 As an **integrator**, I want to bundle services with product supply (cabling + networking + support) so that I can subcontract confidently to one partner. (M)
- US-9.3 As a **facility manager**, I want an AV/meeting-room and IP-telephony offer with consultation booking so that I can upgrade our offices with one supplier. (S)

---

## 8. Use Cases (Critical Scenarios)

> Structure: **Actor · Trigger · Main path · Alternate paths · Exception paths · Success criterion · PRD trace.**

### UC-01 — Submit a multi-item RFQ (anonymous, mobile)
- **Actor:** Reseller (Rashid). **Trigger:** Needs pricing on 5 SKUs for a customer order.
- **Main path:** Search "Crucial DDR5" → open product → verify spec + authorization badge → *Add to RFQ* → browse TeamGroup category, add 2 more → open basket → enter name/company/phone/email (+ optional WhatsApp) → submit → confirmation screen with reference SIMAL-RFQ-xxxx and SLA promise → email acknowledgement.
- **Alternate:** Handoff to WhatsApp at any point with basket contents pre-filled. Signed-in partner: details pre-filled.
- **Exceptions:** Missing required field → inline error, fields preserved; session timeout → autosaved draft restorable; duplicate submit → prevented with message.
- **Success:** ≤3 minutes, ≤1 validation error, reference issued. *(FR-4.4, FR-1.5)*

### UC-02 — Vendor-track KYC onboarding (first time)
- **Actor:** Supplier admin. **Trigger:** Received "onboard with Simal" invitation.
- **Main path:** Click "Become a Partner" → choose *Vendor/Supplier* track → company details → trade licence upload (PDF, ≤ size limit) → TRN entry with live format check → Peppol ID built via inline guidance (`0235:`+TRN) → signatory & banking details → consent (PDPL) → submit → status "Under review" with SLA note.
- **Alternate:** Close mid-way (step 4/7) → return next day via emailed link → resume at step 4 with everything intact.
- **Exceptions:** Invalid TRN format → blocked with example; virus-flagged upload → rejected with explanation; reviewer flags licence expiry → applicant fixes only that field → resubmit.
- **Success:** ~10 min active time; zero re-entry; applicant always knows status. *(FR-K.6–K.12)*

### UC-03 — Review an application (internal)
- **Actor:** KYC reviewer (Sana). **Trigger:** Queue shows new submission aged 4 business hours.
- **Main path:** Open console → queue sorted by SLA age → open application → side-by-side document viewer → verify licence/TRN against records → approve fields → final approve with note → applicant auto-notified; partner record (incl. Peppol ID) activated.
- **Alternate:** Flag specific fields → internal note → status "Additional info required" → applicant fixes flagged items only → back in queue.
- **Exceptions:** SLA breach risk (aging >1.5 days) → highlighted + manager alert; rejected application → mandatory reason, applicant notified.
- **Success:** Decision within 2 business days; every action audit-logged. *(FR-K.23/24/39)*

### UC-04 — Software demo booking
- **Actor:** Retail CIO (Omar). **Trigger:** Evaluating POS replacement; found Simal via search/AI assistant.
- **Main path:** Home → *Software Services* → Industries → Retail → UniPOS product page (features, MEA context) → case study → *Book a Demo* → company/contact + preferred slot → submit → confirmation + calendar invite workflow; routed to joint Simal+Unisoft pipeline.
- **Alternate:** Consultation request instead of demo; Arabic version of the whole path.
- **Success:** Path completable without phone; response ≤1 business day. *(FR-6.3/6.4/6.7)*

### UC-05 — Vendor credibility check
- **Actor:** Vendor manager (Elena). **Trigger:** Simal requests authorization for a new line.
- **Main path:** Land on home (credential strip: 20+ years, 20+ brands, 1000+ clients*, 6 regions) → About → Group companies & leadership → Global coverage map → existing brand pages (quality benchmark) → Awards → Partnerships contact → sends enquiry with represent-type *Vendor/OEM*.
- **Success:** All evidence in one visit; enquiry routed to management. *(FR-2.2, FR-3.1–3.6, FR-9.2)*

### UC-06 — Annual re-validation
- **Actor:** Partner admin (Ahmed). **Trigger:** T-30 expiry alert email.
- **Main path:** Sign in → dashboard shows expiring licence → upload renewed document → auto re-enters light review → approved → status "Active", next expiry set.
- **Success:** ≤5 minutes; no full re-onboarding. *(FR-K.11/15/16)*

### UC-07 — Arabic-first product research
- **Actor:** Arabic-speaking reseller. **Trigger:** Browsing on phone, prefers Arabic.
- **Main path:** Arrive via Google on Arabic landing page → toggle confirms AR → RTL layout with correct directional semantics (logo top-right, progress right-to-left) → category → product (full-depth Arabic specs) → RFQ form in Arabic → submit → Arabic acknowledgement + Arabic WhatsApp handoff.
- **Success:** Zero content dead-ends between EN/AR; task parity with English. *(FR-1.1, D-4, BRule-9)*

### UC-08 — Job application
- **Actor:** Candidate (Priya). **Trigger:** Heard about openings from a friend.
- **Main path:** Careers → culture/benefits → open role → apply (CV upload + PDPL consent) → confirmation email → HR pipeline.
- **Alternate:** No matching role → speculative application CTA.
- **Success:** Application received and confirmed in ≤5 minutes. *(FR-8.1–8.3)*

### UC-09 — Old KYC portal email link (post-migration)
- **Actor:** In-flight applicant. **Trigger:** Clicks "resume application" email sent before cutover.
- **Main path:** kyc.simalme.com deep link → 301 + token mapping → sign-in on simalme.com → lands on their saved step with data intact.
- **Success:** No 404, no data loss, no re-entry. *(FR-K.35/36 — launch gate)*

---

## 9. User Journeys (Current Pain → Future State)

### 9.1 Rashid (Reseller) — Weekly re-stock

| Stage | Today | Future platform |
|---|---|---|
| Need | Customer asks for 5 SKUs | Same |
| Research | WhatsApp photos of labels; calls | Catalog search; specs; badges |
| Price | "Call for price" → waits for salesman | 3-min multi-item RFQ; SLA promise; or WhatsApp with context |
| Order | Verbal confirm | RFQ → quote → order (Phase 2 self-service for partners) |
| After | No record | RFQ history, saved lists, availability answers |

### 9.2 Ahmed (Partner admin) — Onboarding & re-validation

| Stage | Today | Future |
|---|---|---|
| Start | Separate portal link via email | "Become a Partner" in-site, one account |
| Fill | Fears losing work; unclear fields | Autosave, resume, TRN/Peppol guidance |
| Correct | Email ping-pong, re-sends | Fix-only-flagged-items |
| Track | Emails "any update?" | Status page + notifications |
| Re-validate | Ad-hoc chase | T-30/T-7/T-0 alerts, 5-min renewal |

### 9.3 Omar (Software buyer) — ERP evaluation

| Stage | Today | Future |
|---|---|---|
| Discover | Simal invisible for software (AI/Google finds competitors) | Software section surfaces for MEA queries |
| Evaluate | Nothing to read | Products, stack, industries, case studies, AR |
| Engage | No path | Demo/consultation booking, joint pipeline |
| Decide | N/A | Credible proposal with clear engagement model |

### 9.4 Sana (Reviewer) — Daily queue

| Stage | Today | Future |
|---|---|---|
| Triage | Email/spreadsheets | SLA-sorted console queue |
| Verify | Opens files locally, retypes data | Side-by-side viewer, per-field checks |
| Decide | Email decision | Approve/flag in-console, applicant auto-notified |
| Prove | Manual audit prep | Immutable audit log + dashboards |

---

## 10. Usability Requirements

*(Framed per ISO 9241: effectiveness — can users complete tasks; efficiency — at what cost; satisfaction — how do they feel. Validated per §13.)*

| ID | Requirement | Target / measure |
|---|---|---|
| USAB-1 | **Core-task effectiveness**: representative users complete the 9 core tasks (§13.2) unaided | ≥90% task success per task, ≥80% across all tasks first test round. *Benchmark context: industry average task success ≈78% (MeasuringU database, ~1,100 tasks); targets are deliberately above average for launch-critical flows* |
| USAB-2 | **RFQ efficiency** (UC-01) | ≤3 minutes median on mobile |
| USAB-3 | **Onboarding efficiency** (UC-02) | ≤10 minutes active time; resumption ≤30s to re-orient |
| USAB-4 | **System Usability Scale** per round and per major module (site / onboarding / console) | **≥80 ("A" grade)**; absolute floor 68 (industry average); console ≥75 |
| USAB-5 | **Findability**: first-click success on key tasks (find a brand, find demo booking, find contact) | ≥70% correct first click |
| USAB-6 | **Error prevention & recovery**: inline validation at field level; destructive actions confirmed; errors state what happened + how to fix; no data loss on back/timeout | Zero unrecoverable data-loss incidents in testing |
| USAB-7 | **Feedback & waiting**: every submit shows result <1s (optimistic UI acceptable with clear pending state); long uploads show progress | No silent submissions |
| USAB-8 | **Consistency**: one design system (PRD D-8); same component = same behavior everywhere incl. RTL | Design-system compliance review pre-release |
| USAB-9 | **Cognitive load**: wizard steps ≤7 with progress indicator; forms one-column on mobile; jargon-free labels (B2B trade terms translated to plain EN/AR) | Heuristic review (Nielsen) at SG-1 & SG-3 |
| USAB-10 | **Mobile parity**: every UR here is achievable at 360px; touch targets ≥44px | QA matrix per release |
| USAB-11 | **Performance feel** (efficiency enabler): LCP ≤2.5s on 4G | Lighthouse mobile ≥85 (PRD NFR-1) |
| USAB-12 | **Trust affordances**: authorization badges, award marks, secure-upload messaging, PDPL notices at point of collection — visible without hunting | Expert review + participant trust-rating question ≥4/5 |

### 10.4 Arabic / RTL Usability (from MENA design research — Appendix C)

| ID | Requirement |
|---|---|
| RTL-1 | True RTL layout mirroring with `dir` semantics — not cosmetic flipping: navigation, breadcrumbs, pagination, and step flows progress right-to-left |
| RTL-2 | Logo placed top-right in Arabic (LTR: top-left); directional icons (back arrows, carousels, progress) mirror correctly; media playback controls and charts remain per convention |
| RTL-3 | Curated visuals per language: imagery containing text or directional cues re-selected, not mirrored; no flipped text-in-image |
| RTL-4 | Professional Arabic typography (proper Arabic web fonts, adequate line-height for diacritics, no Latin fallbacks); numerals follow the UAE business convention — Western digits (0–9) applied consistently, Arabic-Indic digits only as a deliberate brand decision |
| RTL-5 | Arabic content is **transcreated** (same persuasive depth, local examples, correct trade terminology), never machine-literal; native-speaker review gate before publish (BRule-9) |
| RTL-6 | Arabic forms: RTL field order, Arabic error messages, Arabic-aware validation messages (e.g., TRN guidance in Arabic) |

---

## 11. Accessibility Requirements

*(WCAG 2.1 AA is the floor — PRD NFR-6. This section states it in user terms.)*

| ID | Requirement |
|---|---|
| ACC-1 | Keyboard-only users can complete every core task (UC-01…UC-09) with visible, logical focus order (including RTL focus direction in Arabic) |
| ACC-2 | Screen-reader users get equivalent experience: semantic landmarks, labeled controls (EN & AR voiceover/TalkBack tested), alt text for product images, data tables properly marked up |
| ACC-3 | Text contrast ≥4.5:1 (≥3:1 large text) — **computed for the actual brand palette**: #0050A0 on white = **7.91:1** (passes AAA — safe for all text); #E01020 on white = **4.92:1** (passes AA normal text); **#F0F000 must never be used as text on white (1.22:1 — fails everything)** — yellow is permitted only as a graphic/background accent with dark text (17.17:1 on black, 6.47:1 on brand blue); avoid #0050A0 text on black/dark backgrounds (2.66:1) — use white-on-blue (7.91:1) instead |
| ACC-4 | Forms announce errors in text (not color alone), link focus states visible, motion respects `prefers-reduced-motion` |
| ACC-5 | Documents uploaded for accessibility (datasheets, press kit) offered in accessible PDF where feasible |
| ACC-6 | Accessibility validated with assistive-technology walkthroughs (EN + AR) at SG-3, and automated checks in CI |

---

## 12. Content Requirements from the User Perspective

| ID | Requirement |
|---|---|
| CNT-1 | **Answer-first pages**: every page answers the visitor's top question in the first viewport (what is it / is it genuine / what does it cost pathway / what do I do next) |
| CNT-2 | **Spec completeness**: every product carries the fields a reseller needs to sell (capacity, interface, speed, form factor, warranty, brand line) — gap list produced during content migration |
| CNT-3 | **Proof over adjectives**: claims paired with evidence (awards, badges, numbers, cases); the user-voice themes from testimonials (responsiveness, delivery, pricing) reflected in value props |
| CNT-4 | **Plain bilingual trade language**: EN/AR glossary of key terms (distributor/authorized/warranty/AMC/RFQ) applied consistently |
| CNT-5 | **Honest availability**: no fake stock, no dead "call for price" — either availability signal or a one-click ask |
| CNT-6 | **Structured for AI-era research**: FAQs (incl. KYC FAQ), Q&A-format content and schema so AI assistants can surface Simal accurately (51% of software buyers start with AI — BRD §4.3) |
| CNT-7 | **Legal clarity in user language**: privacy notices, consent, cookie choices written plainly in EN/AR at reading level ~B1 |

---

## 13. Usability Validation & User Acceptance Plan

### 13.1 Rounds

| Round | When | Method | Participants | Gate |
|---|---|---|---|---|
| R1 — Concept | P0 (design) | Moderated task walkthroughs on prototypes (EN+AR) | 6–8: resellers ×2, integrator, enterprise, software buyer, Arabic-first user | SG-1 design approval |
| R2 — Build | P1/P2 (staging) | Moderated usability tests, core tasks, SUS survey | 8–10 incl. 1 reviewer, 1 content editor (internal), ≥3 Arabic speakers | SG-2 entry |
| R3 — Pre-launch | P3 (UAT) | Full UAT per PRD §19.3 + unmoderated first-click tests + AT walkthrough | 10–12 + partner beta group (≥5 real partners) | **SG-3 (launch-blocking)** |
| R4 — Post-launch | +30 days | Task-based analytics (funnels), on-site surveys, SUS poll in partner dashboard, session replays (privacy-compliant) | Real users | SG-5 review |

### 13.2 Core Task Set (test scripts derive from §8)

1. Find a specific Crucial SSD and verify it's authorized (UC-01 partial)
2. Build & submit a 4-item RFQ on mobile (UC-01)
3. Complete vendor-track onboarding to submission; then resume after interruption (UC-02)
4. Fix a flagged document and resubmit (UC-02 exception)
5. Review & approve an application in the console (UC-03 — internal)
6. Find the Retail industry software offer and book a demo (UC-04)
7. Locate coverage, leadership, and awards for vendor due-diligence (UC-05)
8. Complete the Arabic product-research path end-to-end (UC-07)
9. Find the AMC / IT-services offer and submit a services consultation request (UR-45/47)

**Pass criteria:** USAB-1 targets met; no severity-1 usability defect open; SUS ≥ target or remediation plan accepted by Product Owner.

### 13.3 Instruments & Data

- SUS questionnaire (10 items) after each module; task success/time/error logs; first-click tests; System Usability + NPS-style trust question; accessibility walkthrough reports (EN/AR).
- Findings triaged: Sev-1 (blocks task/loses data) fix before launch; Sev-2 (slows task) fix or fast-follow; Sev-3 backlog.

---

## 14. Assumptions, Constraints & Dependencies

1. Simal recruits participants for R1–R3 (partners from the beta group; Arabic speakers reachable) — dependency on Sales/Accounts relationships.
2. Test environments mirror production data-shape (dummy KYC documents; no real PII in staging — PDPL).
3. Content in both languages available for testing rounds (R2 onward) — dependency on C-5/C-10 content workstream.
4. The reconciled working-hours schedule (BRule-3) is published before R3 so support-messaging tests are valid.
5. Case studies (BR-15) commissioned from Unisoft in time for R2 software-task testing.
6. Accessibility tooling and AT testers (Arabic) budgeted within QA.
7. **Constraints:** no personally identifiable KYC data in usability sessions; prototypes must use realistic (not lorem) content to avoid false findings.

---

## 15. Appendices

### Appendix A — Traceability Matrix (UR → PRD / BRD / Epic / Use Case / Validation)

| UR | PRD | BRD | Epic / UC | Validation |
|---|---|---|---|---|
| UR-01 | FR-1.3, 4.2 | BR-10 | E1 / — | R2 task 1 |
| UR-02 | FR-4.3 | BR-10 | E1 | R2 task 1 |
| UR-03 | FR-4.1, 2.9 | BR-04/05 | E1 | R2 task 1; expert |
| UR-04 | FR-4.1 | BR-04 | E1 | R2 |
| UR-05 | FR-4.6 | — | E1 | R3 |
| UR-06 | FR-4.3/4.7 | BR-07 | E1 | R2 task 1 |
| UR-07 | FR-1.1, D-4 | BR-01 | E7 | R2 task 8 |
| UR-08 | FR-2.1, 4.5 | BR-26 | E1 | analytics |
| UR-09 | FR-4.4 | BR-07 | E2 / UC-01 | R2 task 2 |
| UR-10 | USAB-2 | BR-07 | E2 / UC-01 | R2 task 2 (≤3 min) |
| UR-11 | FR-4.4 | BR-07, BRule-2 | E2 | R2 task 2 |
| UR-12 | FR-1.5 | BR-08 | E2 / UC-01 alt | R2 |
| UR-13 | FR-4.4, 10.2 | BR-20 | E2 | R3 (partner beta) |
| UR-14 | BRule-1 | BR-11 | E2 | design review |
| UR-15 | FR-K.6 | BR-16 | E3 / UC-02 | R2 task 3 |
| UR-16 | FR-K.7 | BR-16 | E3 / UC-02 | R2 task 3 (resume) |
| UR-17 | FR-K.7 | BR-16 | E3 / UC-02 exc | R2 task 4 |
| UR-18 | FR-K.8/9, K.28 | BR-18 | E3 / UC-02 | R2 task 3 |
| UR-19 | FR-K.10/18/22 | BR-25 | E3 / UC-02 | R2 task 3 |
| UR-20 | FR-K.12/15 | BR-16/20 | E3 / UC-02 | R2 task 3 |
| UR-21 | FR-K.11 | BR-20 | E3 / UC-06 | R3 |
| UR-22 | FR-K.23/24/39 | BR-19 | E3 / UC-03 | R2 task 5 |
| UR-23 | FR-K.18/19 | BR-25/30 | E3 | audit check |
| UR-24 | FR-6.1/6.8 | BR-12/14 | E4 | R2 task 6 |
| UR-25 | FR-6.3 | BR-12 | E4 / UC-04 | R2 task 6 |
| UR-26 | FR-6.2 | BR-12 | E4 | R2 task 6 |
| UR-27 | FR-6.4 | BR-12 | E4 / UC-04 | R2 task 6 |
| UR-28 | FR-6.7 | BR-13 | E4 / UC-04 | R2 task 6 |
| UR-29 | FR-6.6 | BR-15 | E4 | R2 task 6 |
| UR-30 | FR-6.5 | BR-12 | E4 | R3 |
| UR-31 | FR-2.2 | BR-03 | E5 / UC-05 | R2 task 7 |
| UR-32 | FR-3.1/3.2/3.3 | BR-02 | E5 / UC-05 | R2 task 7 |
| UR-33 | FR-3.6 | BR-02 | E5 / UC-05 | R2 task 7 |
| UR-34 | FR-3.5, 2.9 | BR-05 | E5 / UC-05 | R2 task 7 |
| UR-35 | FR-7.x | BR-26/27 | E5 | R3 |
| UR-36 | FR-9.1/9.2 | BR-06 | E2/E5 | R2 |
| UR-37 | FR-9.1, BRule-3 | BR-06 | global | content QA |
| UR-38 | FR-8.1 | BR-28 | E6 / UC-08 | R3 task (careers) |
| UR-39 | FR-8.2/8.3 | BR-28 | E6 / UC-08 | R3 task (careers) |
| UR-40 | FR-10.1, FR-K.2 | BR-16 | E7 | R2/R3 |
| UR-41 | FR-1.1, D-4 | BR-01 | E7 / UC-07 | R2 task 8 |
| UR-42 | FR-K.35/36 | BR-17 | E3 / UC-09 | SG-3 migration tests |
| UR-43 | FR-7.2, K.23/27 | BR-26/29 | E8 | R2 (internal) |
| UR-44 | USAB-6/7 | BR-09 | global | all tasks |
| UR-45 | FR-5.1 | BR-33 | E9 | R2/R3 task 9 |
| UR-46 | FR-5.2 | BR-33 | E9 | R3 |
| UR-47 | FR-5.1, BRule-2/6 | BR-33 | E9 | R2/R3 task 9 |

> **Coverage note:** BR-21–BR-24 (PDPL compliance program) and BR-31/BR-32 (uptime, SEO migration) are system-side obligations without dedicated user requirements; their user-facing aspects are carried by UR-19/UR-44 & CNT-7 (consent and DSR transparency), and UR-42 (redirect continuity) respectively.

### Appendix B — User-Voice Evidence (from Simal's published testimonials, mirror audit)

| Theme | Verbatim (published on current site) | Platform answer |
|---|---|---|
| Responsiveness | "good behave and fast reply" (Muhammad Jaseem); "addressing all my concerns promptly" (Nadeem, Microtrans) | SLA-promised RFQ & notifications (UR-11/20); status tracking |
| Pricing | "your price was good"; "wish they offered more flexible pricing" (Ahmed Faisal) | Quote-based model; transparent quote flow (UR-09–14) |
| Delivery reliability | "efficiently manages deliveries… even when our own delivery team is busy" | Availability honesty + fulfillment story (UR-06; FR-3.6) |
| Product quality | "quality of their products, timely deliveries, and after-sales support are outstanding" (Sarah Thomas, Gulf Data Systems) | Authorization badges, warranty info (UR-03), services depth |
| Stock visibility (pain) | "occasional stock shortages have caused minor delays" (Mohammed Raza) | UR-06/CNT-5 availability communication; Phase 2 stock signal |
| Support approachability | "Quick delivery and easy to approach staff" (Japs Almasol) | WhatsApp continuity + department routing (UR-12/36) |

### Appendix C — Research Sources (accessed 3 Oct 2026)

- **SUS benchmarking:** 68 = average / 80.3+ = A (Sauro & Lewis curved grading): [Userlytics](https://www.userlytics.com), [MeasuringU](https://measuringu.com), [CleverX](https://cleverx.com), PMC/NCBI SUS dimensionality research; ISO 9241 effectiveness/efficiency/satisfaction framework. **Task-success benchmark:** industry average ≈78% (MeasuringU database of ~1,100 usability tasks); NN/g-documented site studies typically 60–80%.
- **Mobile & GCC usage:** ~63% of web visits mobile (JoinGenius, Dec 2024); KSA internet penetration ~99% (TradeArabia); m-commerce growth (IMARC) — directionally cited for mobile-parity requirements.
- **RTL/Arabic UX:** [Muzli — RTL basics](https://medium.muz.li); [Saudisoft RTL checklist](https://localization.saudisoft.com); [MENAbytes — Mirroring](https://www.menabytes.com); [kristi.digital RTL app design](https://kristi.digital); [Santa Media — RTL conversion rules UAE/KSA](https://santa-media.co).
- **B2B behavior** (as first cited in BRD §4.3): Gartner (80% digital interactions; 67% rep-free), Forrester 220-day blind spot, 6sense/Supermarketers AI-research stats — see BRD Appendix B.
- **First-party:** PRD v1.4 & BRD v1.3 (same folder); Simal mirror audit (testimonials, catalog, KYC portal review); Unisoft uslbd.com.

### Appendix D — Glossary

**URD** User Requirements Document · **UR** User Requirement · **US** User Story · **UC** Use Case · **USAB** Usability requirement · **ACC** Accessibility requirement · **RTL** Right-to-Left · **SUS** System Usability Scale · **AT** Assistive Technology · **RFQ** Request for Quote · **KYC** Know Your Customer · **TRN** Tax Registration Number · **Peppol** e-invoicing network (UAE 5-corner, PINT AE) · **PDPL** UAE data protection law · **SLA** Service Level Agreement · **UAT** User Acceptance Testing · **EVP** Employee Value Proposition · **SG-n** BRD stage gates · **P0–P5** PRD roadmap phases

---

*End of URD v1.2 — companion to BRD v1.3, PRD v1.4 and FRS v1.2 (same folder). Personas, stories, and journeys derive from first-party evidence (mirror audit, testimonials, KYC portal) and cited usability research; validation targets (SUS ≥80, task success ≥90% vs ~78% industry average) are contractual acceptance levels for SG-3, not aspirations.*
