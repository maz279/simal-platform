# Functional Requirements Specification (FRS)

## Simal Digital Platform — Engineering-Grade Functional Specification

| Field | Detail |
|---|---|
| **Document Title** | Simal Digital Platform — Functional Requirements Specification |
| **Version** | 1.3 |
| **Date** | 3 October 2026 |
| **Status** | Draft — for engineering & QA review, Product Owner sign-off |
| **Prepared For** | Simal Technologies Middle East LLC — Delivery Team, QA, Product Owner |
| **Document Family** | **BRD v1.3** (business why — objectives, KPIs, rules) → **URD v1.2** (user needs — personas, stories, use cases, usability) → **PRD v1.4** (product what — features, IA, NFRs, architecture) → **FRS v1.2** (this document — **precise, testable system behavior**: "shall" requirements, field specifications, state machines, validation rules, permission matrix, notification catalog). |
| **Standards Basis** | ISO/IEC/IEEE 29148:2018 (supersedes IEEE 830-1998): requirements are *necessary, implementation-free, unambiguous, singular, feasible, traceable, verifiable*. "Shall" is reserved exclusively for binding requirements; "should" for goals; "may" for options. Verification methods follow the standard set: **T**est, **A**nalysis, **I**nspection, **D**emonstration. |
| **Change Record** | v1.0 — Initial FRS: 17 modules, 203 requirements, 4 state machines, field-level specifications, role-permission matrix, notification catalog, integration contracts, verification methods with gate mapping.<br>v1.1 — Audit pass 5: **corrected UAE IBAN rule to 23 characters** (CBUAE: AE + 2 check + 3 bank + 16 account — v1.0 erroneously stated 34); **added M18 Homepage (FRS-HP-01…08)** and **M19 About & Company (FRS-AB-01…08)** — PRD FR-2.x homepage composition and FR-3.x about pages previously had no FRS coverage; fixed two E-code cross-references (FRS-R-04 → FRS-EM-03/E-05; FRS-J-06 → E-16); added migration-notice email E-18 (FR-K.38); added FRS-K-25 (contextual track pre-scoping, FR-K.3), FRS-K-26 (parity gate, FR-K.4), FRS-K-27 (applicant dashboard card, FR-K.15), FRS-A-17 (data-residency access controls, BR-23), FRS-SW-13 (lead-account link, FR-K.32), FRS-SO-09 (service bundles, FR-5.3); strengthened trace strings (UR-03/04/07/08/14/23/29, BR-05/07/11/14/27/30, FR-K.22/34/37); scope note added for intentionally excluded NFR-side BRs (BR-24 DPIA and BR-31 uptime verified as process/NFR gates, §1.4/§27).<br>v1.2 — Best-practice completion per the IEEE 830-1998 / ISO/IEC/IEEE 29148 template: added **§1.5 External Interface Requirements** (User / Hardware / Software / Communications breakdown — content previously distributed across §2.1 and M15) and **§1.6 Assumptions & Dependencies** (FRS-local). No changes to the 225 requirements. *Erratum (same-day, audit pass 6): repaired 14 requirement rows whose trace cells had been structurally duplicated by an earlier automated edit — trace content unchanged, table rendering restored; also verified all four family documents at zero table-integrity defects.*<br>v1.3 — **Management correction — corporate independence:** FRS-AB-02 rewritten — "group page" → "company page"; TwinMOS ME FZE removed from the companies table; Unisoft listed as software delivery partner; explicit prohibition on group-affiliation content (3 Oct 2026). Requirement ID, priority (M), verification (I), and trace unchanged. |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Context & Module Inventory](#2-system-context--module-inventory)
3. [M01 — Global Framework (FRS-G)](#3-m01--global-framework-frs-g)
4. [M02 — Site-wide Search (FRS-SR)](#4-m02--site-wide-search-frs-sr)
5. [M03 — Catalog & Brands (FRS-C)](#5-m03--catalog--brands-frs-c)
6. [M04 — RFQ Engine (FRS-R)](#6-m04--rfq-engine-frs-r)
7. [M05 — IT Solutions & Services (FRS-SO)](#7-m05--it-solutions--services-frs-so)
8. [M06 — Software Services (FRS-SW)](#8-m06--software-services-frs-sw)
9. [M07 — Insights & Newsroom (FRS-IZ)](#9-m07--insights--newsroom-frs-iz)
10. [M08 — Careers (FRS-J)](#10-m08--careers-frs-j)
11. [M09 — Contact & Enquiry Routing (FRS-CT)](#11-m09--contact--enquiry-routing-frs-ct)
12. [M10 — Accounts & Identity (FRS-A)](#12-m10--accounts--identity-frs-a)
13. [M11 — KYC Onboarding (FRS-K)](#13-m11--kyc-onboarding-frs-k)
14. [M12 — Document Vault (FRS-DV)](#14-m12--document-vault-frs-dv)
15. [M13 — Review Console & Administration (FRS-RC)](#15-m13--review-console--administration-frs-rc)
16. [M14 — Notifications & Email (FRS-EM)](#16-m14--notifications--email-frs-em)
17. [M15 — Integrations (FRS-IG)](#17-m15--integrations-frs-ig)
18. [M16 — Reporting & Analytics (FRS-RP)](#18-m16--reporting--analytics-frs-rp)
19. [M17 — Localization Behavior (FRS-LN)](#19-m17--localization-behavior-frs-ln)
20. [M18 — Homepage (FRS-HP)](#20-m18--homepage-frs-hp)
21. [M19 — About & Company (FRS-AB)](#21-m19--about--company-frs-ab)
22. [State Machines](#22-state-machines)
23. [Field-Level Specifications](#23-field-level-specifications)
24. [Role–Permission Matrix](#24-rolepermission-matrix)
25. [Error Handling Standards](#25-error-handling-standards)
26. [Data Requirements & Identifier Formats](#26-data-requirements--identifier-formats)
27. [Verification & Gate Mapping](#27-verification--gate-mapping)
28. [Traceability Rollup](#28-traceability-rollup)
29. [Appendices](#29-appendices)

---

## 1. Introduction

### 1.1 Purpose

This FRS translates the PRD v1.4 feature set into **individual, verifiable statements of system behavior** for the engineering and QA teams. Where the PRD says *what features exist* and the URD says *what users must accomplish*, the FRS specifies exactly **what the system shall do** — inputs, processing rules, outputs, validation logic, and error conditions — at a level precise enough to build and test against, per requirement.

### 1.2 Requirement Conventions (per ISO/IEC/IEEE 29148)

1. **Language:** "The system shall…" denotes a binding requirement. "Should" = goal; "may" = option. Each numbered requirement states exactly one capability (no compound "and/or" requirements, no escape clauses such as "etc.").
2. **IDs:** `FRS-<MODULE>-nn` (e.g., `FRS-K-07`). Modules are two-letter codes (§2). IDs are unique and stable; deleted requirements are retired, never renumbered.
3. **Attributes per requirement:** Priority (**M**ust / **S**hould / **C**ould) · Verification (**T**est / **A**nalysis / **I**nspection / **D**emonstration) · Trace (PRD FR · URD UR · BRD BR).
4. **Qualities:** every requirement is stated implementation-free and with measurable qualifiers (thresholds, formats, counts) so that verification is unambiguous.
5. **Business terms** used with fixed meanings defined in §26 (identifier formats) and Appendix D (glossary).

### 1.3 Reference Documents

BRD v1.3 (`Simal_Corporate_Website_BRD.md`) · URD v1.2 (`Simal_Corporate_Website_URD.md`) · PRD v1.4 (`Simal_Corporate_Website_PRD.md`) — all in `Primary_doc/`. Where this FRS restates a rule, the BRD BRule reference is carried inline (e.g., SLAs per BRule-2).

### 1.4 Out of Scope

Non-functional qualities (performance, uptime, security hardening specifics — PRD §10), visual design (PRD §11), infrastructure decisions (PRD §13), and Phase 2 features are out of scope except where a Phase-1 behavior must reserve a hook (marked "Phase-2 hook"). BR-24 (DPIA) and BR-31 (uptime) are process/NFR obligations verified at governance gates (§27), not runtime behaviors, and are intentionally not restated as FRS rows.

### 1.5 External Interface Requirements (per IEEE 830 §3.1 / 29148)

| Interface class | Interfaces & governing requirements |
|---|---|
| **User interfaces** | Public site (EN/AR RTL, responsive 360–1920px — FRS-G-09/10, FRS-LN); authenticated dashboards (applicant/partner — FRS-K-11/12/27); staff review console and CMS admin (FRS-RC-01…12, MFA-gated); all forms per §23 field specifications; WCAG 2.1 AA behaviors per URD §11. |
| **Hardware interfaces** | None directly (server-side web platform). Client devices are consumed via responsive behavior only; no device drivers, peripherals, or IoT interfaces in Phase 1–2. |
| **Software interfaces** | CRM lead API (FRS-IG-02/03); transactional email provider API with in-platform templates (FRS-IG-04, FRS-EM-01); virus-scan service API (FRS-IG-07); reCAPTCHA v3 (FRS-IG-06); GA4 measurement protocol/gtag (FRS-IG-05); encrypted object storage + signed URLs for the vault (FRS-DV-02); search index (FRS-SR); CMS data store (FRS-RC-11). Phase-2 reserved: Peppol participant/e-invoicing gateway, ERP/stock APIs, ATS (FRS-IG-09, feature-flagged off). |
| **Communications interfaces** | HTTPS/TLS 1.2+ for all client and integration traffic (PRD NFR-3); `wa.me` deep-link handoffs (FRS-IG-01); email SMTP/provider API with retry/backoff (FRS-EM-01); webhooks/callbacks only where a listed integration defines them; outbound integration logging per FRS-IG-11. |

### 1.6 Assumptions & Dependencies (FRS-local)

1. The reconciled business-day/working-hours schedule (BRule-3) is confirmed before SG-3; FRS-K-24, FRS-CT-01/08 and SLA computations default to Sun–Thu until then.
2. CRM platform selection (HubSpot/Zoho/other) is made before P1 build start; FRS-IG-02 field mapping is finalized against the chosen API.
3. KYC portal data (applications, documents, audit logs) is fully exportable for FRS-K-18 migration and reconciliation.
4. The approved-claims register (BRule-8) is populated before launch for every credential rendered by FRS-G-14, FRS-HP-06, FRS-SW-01, FRS-C-10.
5. Brand-asset permissions (logos, award marks) are obtainable per BRule-10 before design sign-off.
6. Unisoft supplies software-section collateral, the 44-technology stack confirmation, and commissioned case studies (BR-15) ahead of R2 usability testing.
7. Arabic transcreation reviewer is engaged for all `err.*`/UI string keys and commercial content before publish (FRS-LN-06).
8. virus-scan, email, and storage services are procured with production-grade SLAs consistent with NFR-2/13.

---

## 2. System Context & Module Inventory

### 2.1 System Context

```
                        ┌──────────────────────────────────────────────┐
  Anonymous visitor ───▶│                                              │───▶ CDN pages (EN/AR)
  Partner / Applicant ─▶│           SIMAL DIGITAL PLATFORM             │───▶ Account & KYC UI
  Staff (roles) ───────▶│                                              │───▶ Review console / admin
                        │  Public site · Catalog · RFQ · Software ·    │
                        │  Insights · Careers · Contact · Accounts ·   │
                        │  KYC wizard · Document vault · Console       │
                        └───────┬───────────┬───────────┬──────────────┘
                                │           │           │
                        ┌───────▼──┐ ┌──────▼─────┐ ┌──▼────────────┐
                        │   CRM    │ │ Email/SMTP │ │ WhatsApp (deep│
                        │ (leads)  │ │ (notify)   │ │ links, ctx)   │
                        └──────────┘ └────────────┘ └───────────────┘
                        ┌──────────┐ ┌────────────┐ ┌───────────────┐
                        │   GA4    │ │ reCAPTCHA/ │ │ Virus-scan    │
                        │ analytics│ │ honeypot   │ │ service       │
                        └──────────┘ └────────────┘ └───────────────┘
                        Phase-2 hooks: Peppol gateway · ERP/stock APIs · ATS
```

### 2.2 Module Inventory

| # | Module | ID prefix | Serves | Parent PRD area |
|---|---|---|---|---|
| M01 | Global Framework | FRS-G | All users | FR-1 |
| M02 | Site-wide Search | FRS-SR | All users | FR-1.3 |
| M03 | Catalog & Brands | FRS-C | UG-1/2/3 | FR-4, FR-2 |
| M04 | RFQ Engine | FRS-R | UG-1/2/3, UG-10 | FR-4.4 |
| M05 | IT Solutions & Services | FRS-SO | UG-2/3 | FR-5, BR-33 |
| M06 | Software Services | FRS-SW | UG-4 | FR-6 |
| M07 | Insights & Newsroom | FRS-IZ | UG-8, all | FR-7 |
| M08 | Careers | FRS-J | UG-6 | FR-8 |
| M09 | Contact & Enquiry Routing | FRS-CT | All | FR-9 |
| M10 | Accounts & Identity | FRS-A | UG-7/9/11/12 | FR-10, NFR-4 |
| M11 | KYC Onboarding | FRS-K | UG-7 | FR-K (PRD §9) |
| M12 | Document Vault | FRS-DV | UG-7/9 | FR-K.18–22 |
| M13 | Review Console & Administration | FRS-RC | UG-9/12 | FR-K.23–27 |
| M14 | Notifications & Email | FRS-EM | All | FR-K.17 et al. |
| M15 | Integrations | FRS-IG | System | PRD §13.3 |
| M16 | Reporting & Analytics | FRS-RP | UG-12 | PRD §15 |
| M17 | Localization Behavior | FRS-LN | All | FR-1.1, D-4 |
| M18 | Homepage | FRS-HP | All visitors | FR-2 |
| M19 | About & Company | FRS-AB | UG-3/5/8, all | FR-3 |

---

## 3. M01 — Global Framework (FRS-G)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-G-01 | The system shall render a sticky header on every page containing, in order: logo, primary mega-menu (≤7 items, ≤2 nesting levels), search trigger, language switcher (EN\|AR), Sign-In link, and a "Become a Partner" button visually distinct from all other header elements. | M | T | FR-1.1 · UR-41 · BR-01 |
| FRS-G-02 | The system shall render a utility bar above the header on desktop ≥1024px containing phone (+971 4 393 0507), email (info@simalme.com), and social links (LinkedIn, Facebook, Instagram, WhatsApp). | M | I | FR-1.2 |
| FRS-G-03 | The system shall position the logo top-right in Arabic layout and top-left in English layout. | M | I | RTL-2 · UR-41 |
| FRS-G-04 | The system shall render a floating WhatsApp action on every page that opens `wa.me` with pre-filled text `Hello, I'm interested in {page-context} {current-URL}` where {page-context} is the product name, solution title, or page title. | M | T | FR-1.5 · UR-12 · BR-08 |
| FRS-G-05 | The system shall display a cookie-consent banner on first visit offering Accept-all, Reject-non-essential, and granular toggles (analytics, marketing), storing the choice for 12 months before re-prompting. | M | T | FR-1.6 · BRule-11 |
| FRS-G-06 | The system shall block analytics/marketing tags until corresponding consent is granted. | M | T | FR-1.6 · BR-21 |
| FRS-G-07 | The system shall render breadcrumbs on every page except Home in the form Home › Section › Page, marked up with BreadcrumbList structured data. | M | T | FR-1.9 · SEO-3 |
| FRS-G-08 | The system shall support an editor-managed announcement bar pinned above the header with start/end datetime, EN+AR text, and optional link; when inactive the bar shall not occupy space. | S | T | FR-1.8 |
| FRS-G-09 | The system shall render all pages operationally at viewport widths 360–1920px without horizontal scroll; navigation shall collapse to a hamburger below 1024px. | M | T | FR-1.7 · USAB-10 |
| FRS-G-10 | The system shall render touch targets ≥44×44px for all interactive elements at ≤768px. | M | T | USAB-10 |
| FRS-G-11 | The system shall display a custom 404 page offering site search, the eight most-visited category links, and a WhatsApp fallback; the 404 page shall emit no other navigation dead-ends. | M | T | D-10 · SEO-7 |
| FRS-G-12 | The system shall expose `hreflang` alternates (en/ar) and a canonical URL on every public page. | M | I | SEO-5 |
| FRS-G-13 | The system shall server-render (or pre-render) the full visible content of every public page such that all facts (including credential counters) are present in the HTML response without client-side JavaScript execution. | M | T | NFR-9 · UR-31 |
| FRS-G-14 | The credential strip on Home shall display statically-readable values (20+ Years · 20+ Brands · 1000+ Clients* · 6 Regions) and may animate counting upward on load with `prefers-reduced-motion` respected; values shall be CMS-editable and gated on management approval per BRule-8. | M | I | FR-2.2 · BR-03 |
| FRS-G-15 | The footer shall render the three-entity contact directory (Office / Warehouse JAFZA / Store), quick links, brand index linking all brand pages, newsletter form, legal links (Privacy, Terms, Cookies), and the PDPL data-notice link. | M | I | FR-1.4 · BR-06 |
| FRS-G-16 | The system shall provide an "old-portal link resolver" service that maps any incoming `kyc.simalme.com` request (root or deep path with token) to the equivalent new-platform destination per FRS-K-01, returning HTTP 301. | M | T | FR-K.36 · UR-42 · BR-17 |

---

## 4. M02 — Site-wide Search (FRS-SR)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-SR-01 | The system shall provide a search interface in header and 404 page indexing these entity types: products, brands, categories, IT services, software services, software products, industry pages, posts, case studies, and static pages. | M | T | FR-1.3 · UR-01 |
| FRS-SR-02 | The search shall trigger suggestions after ≥2 characters typed and display ≤8 suggestions grouped by entity type within 300ms p95. | M | T | FR-1.3 |
| FRS-SR-03 | The search shall match SKU fragments (e.g., `t705`, `p310`), brand names, and product common names, case-insensitively. | M | T | UR-01 |
| FRS-SR-04 | The search shall apply Arabic-language normalization across queries and indexed Arabic content, including alef variants (ا/أ/إ/آ), taa marbuta (ة/ه), and yaa (ي/ى). | M | T | FR-1.3 · RTL-6 |
| FRS-SR-05 | The results page shall present results grouped by type with per-type counts, and shall support follow-up filtering by type and brand for product results. | S | T | FR-1.3 |
| FRS-SR-06 | The search shall return zero-result pages with alternative suggestions (fuzzy match on brand/category) and a WhatsApp fallback, never an empty dead-end. | M | T | USAB-6 |
| FRS-SR-07 | Search queries shall be logged (term, result count, locale) for the content team dashboard (FRS-RP-06). | S | I | PRD §15 |
| FRS-SR-08 | The search UI shall be fully operable in RTL with right-to-left suggestion ordering. | M | I | RTL-1 |

---

## 5. M03 — Catalog & Brands (FRS-C)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-C-01 | The system shall import and expose the 76 legacy SKUs (Components 35, Accessories 30, Monitors 6, Gaming 9, Laptops 3) at launch with title, description, brand, category, ≥1 image, and spec attributes in EN; AR titles/descriptions shall follow the content plan with explicit coverage status per SKU. | M | I | PRD §12.1 · BR-10 UR-07 |
| FRS-C-02 | The catalog data model shall support ≥5,000 active SKUs, per-SKU spec attributes (key/value), variants (e.g., heatsink, capacity), multi-category assignment, EOL flag, and "new launch" flag. | M | A | FR-4.5 · NFR-10 UR-08 |
| FRS-C-03 | Category listing pages shall offer facets by brand, category, and ≤10 curated spec attributes, multi-select within facet (OR) and intersecting across facets (AND), with result count updates ≤500ms p95 after facet change. | M | T | FR-4.2 · UR-01 |
| FRS-C-04 | Listing pages shall support sort by Default (merchandised), Newest, Brand A–Z and offer pagination at 24 items/page with stable URLs per page. | M | T | FR-4.2 |
| FRS-C-05 | Product detail pages (PDP) shall display: gallery (≥1 image, zoomable), title, brand link, category breadcrumb, spec table, description, authorization badge, related products (same brand or category, ≤8), and primary actions "Add to RFQ" and "Enquire via WhatsApp". | M | T | FR-4.3 · UR-02/03/06 UR-03 |
| FRS-C-06 | PDPs of EOL products shall display an "End of life — suggested replacement" block when a successor SKU is linked. | S | T | FR-4.5 |
| FRS-C-07 | PDPs shall expose Product structured data with `offers.priceSpecification` absent and availability communicated as `CallForPrice` handling per schema.org; brand and SKU shall be populated. | M | I | FR-4.9 · SEO-3 |
| FRS-C-08 | The system shall render a comparison view for 2–4 selected products showing a unified spec-attribute matrix with differences highlighted. | C | T | FR-4.6 · UR-05 |
| FRS-C-09 | Each of the ≥20 brands shall have a landing page containing logo (used per vendor trademark rules, BRule-10), authorized-distributor badge, ≤300-word SEO paragraph following the pattern "Official {Brand} Distributor in UAE", product grid for that brand, and related insights. | M | I | FR-4.1 · BR-04 UR-04 |
| FRS-C-10 | Brand pages shall support claim-level badges sourced from the approved-claims register (BRule-8); unapproved claims shall not render. | M | I | BR-03 · BRule-8 |
| FRS-C-11 | Availability display in Phase 1 shall be the action "Check availability & price" which adds the item to RFQ context; no stock quantity shall be exposed publicly. | M | T | FR-4.3/4.7 · UR-06 · BRule-1 |
| FRS-C-12 | For signed-in partners with approved status, PDPs shall additionally expose a Phase-2 hook (placeholder area) for price/stock without displaying any placeholder content in Phase 1. | C | I | FR-4.7 |
| FRS-C-13 | Category taxonomy at launch shall be the 9 top-level categories defined in PRD §7.2; re-categorization shall preserve URL redirects per SEO-7. | M | I | PRD §7.2 |
| FRS-C-14 | Image galleries shall serve WebP/AVIF with JPEG fallback, lazy-loaded below the fold, with descriptive alt text in the active locale. | M | I | NFR-1 · ACC-2 |
| FRS-C-15 | The homepage shall render a category grid linking the 9 categories, a featured-brands carousel (logos → brand pages), and a best-sellers carousel sourced from merchandised SKUs. | M | I | FR-2.4/2.5 |
| FRS-C-16 | Currency display shall default to AED with an optional display-only USD toggle using a CMS-set rate; no price value shall be shown while BRule-1 (quote-only) applies. | M | T | FR-4.8 · BRule-1 UR-14 |
FR-4.8 · BRule-1 BR-11 |
---

## 6. M04 — RFQ Engine (FRS-R)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-R-01 | The system shall provide an RFQ basket to anonymous and authenticated users supporting ≥50 line items across products, with per-item editable quantity (1–99,999) and optional note. | M | T | FR-4.4 · UR-09 BR-07 |
| FRS-R-02 | "Add to RFQ" shall persist the basket server-side for signed-in users and in browser storage for anonymous users for ≥14 days, merging the anonymous basket into the account basket at login. | M | T | FR-4.4 · UR-16 (pattern) |
| FRS-R-03 | The RFQ submission form shall validate the fields specified in §23.1 and shall reject submission with field-level bilingual errors when validation fails, preserving all entered data and basket contents. | M | T | UR-10 · USAB-6 |
| FRS-R-04 | Upon successful submission the system shall: (a) persist the RFQ with status `SUBMITTED`, (b) generate reference `SIMAL-RFQ-nnnn` (sequential, zero-padded, unique), (c) display the reference on a confirmation screen with the ≤1-business-day SLA statement, and (d) dispatch acknowledgement email (FRS-EM-03, catalog E-05). | M | T | FR-4.4 · UR-11 BR-07 |
| FRS-R-05 | The system shall compute RFQ response-due timestamps using the business-day calendar (Sun–Thu, or as reconciled per BRule-3) and flag RFQs unactioned after 1 business day in the internal queue and CRM. | M | T | BRule-2 · FR-K.40 (calendar shared) |
| FRS-R-06 | The system shall transmit every submitted RFQ to the CRM within 60 seconds, including line items, contact block, source page/UTM, locale, and reference number, per FRS-IG-02 mapping. | M | T | FR-4.4 · INT-2 |
| FRS-R-07 | Signed-in users shall see pre-filled company/contact fields drawn from their account profile. | M | T | FR-4.4 · UR-13 |
| FRS-R-08 | Authenticated partners shall view an "RFQ history" list (reference, date, item count, status, quoted-total when set by staff) with detail view and re-order action that loads prior items into a new basket. | S | T | FR-10.2 · UR-13 |
| FRS-R-09 | The RFQ flow shall offer a post-submission nudge: "Create your partner account to track quotes & orders" linking to registration with the RFQ reference pre-associated. | M | T | FR-K.31 |
| FRS-R-10 | The system shall rate-limit anonymous RFQ submissions to 5 per 10 minutes per IP and protect all forms with honeypot + reCAPTCHA v3 (threshold configurable; default 0.5). | M | T | FR-9.3 |
| FRS-R-11 | Staff shall be able to set RFQ status (`SUBMITTED → IN_PROGRESS → QUOTED → WON / LOST / EXPIRED`) and record quoted totals; partners see status and totals but not internal notes. | S | T | URD §9.1 · BRule-6 |
| FRS-R-12 | Every RFQ state change shall be logged with actor, timestamp, and old/new status. | M | I | NFR-5 (audit pattern) |
| FRS-R-13 | The confirmation screen shall offer a WhatsApp handoff pre-filled with the RFQ reference and item summary. | S | T | UR-12 |
| FRS-R-14 | The system shall emit GA4 event `rfq_submit` with parameters `{item_count, locale, is_authenticated}` on submission. | M | I | PRD §15 |
| FRS-R-15 | Quick RFQ strip on Home shall accept name, company, phone, and free-text interest, create a lead (not a basket RFQ), and dispatch acknowledgement email. | S | T | FR-2.12 |
| FRS-R-16 | Anonymous baskets shall be transferable by "email my basket" action sending a resume link valid 14 days. | C | T | UR-16 (pattern) |

---

## 7. M05 — IT Solutions & Services (FRS-SO)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-SO-01 | The system shall render one service page per IT service line (12 total: AMC, IT Infrastructure, Managed Services, Network & IT Security, Firewall, Cloud Security, Data Recovery & Storage, Structured Cabling, IP Telephony, AV & Meeting Rooms, Support & Maintenance, Software & Licensing) with sections: outcomes, scope, deliverables, process, SLA summary, and a consultation request form. | M | I | FR-5.1 · UR-45 · BR-33 |
| FRS-SO-02 | Each consultation request shall validate per §23.3, create a lead typed `it_services`, route to services sales per BRule-6, and dispatch acknowledgement with the ≤1-business-day SLA. | M | T | FR-5.1 · UR-47 · BRule-2 |
| FRS-SO-03 | The module shall render industry pages for 8 verticals (Retail, Healthcare, Education, Hospitality, Government, Logistics, SME, Enterprise), each linking relevant products, IT services, and software products. | S | I | FR-5.2 · UR-46 |
| FRS-SO-04 | AMC content shall present tier options (e.g., Bronze/Silver/Gold) as CMS-editable blocks with per-tier scope bullets; tiers shall be presentational in Phase 1 (no online ordering). | C | I | FR-5.4 |
| FRS-SO-05 | Service pages shall cross-link "related products" (≤8 SKUs) curated per service. | S | I | FR-5.1 |
| FRS-SO-06 | The system shall emit GA4 event `software_lead` with `{form: 'it_services', service_line}` for IT-services consultations (event name shared with software module; disambiguated by `form` parameter). | M | I | PRD §15 · FRS-IG-05 |
| FRS-SO-07 | The consultation thank-you page shall offer document-download of the matching service line card (gated per FRS-IZ-06). | C | T | FR-7.5 |
| FRS-SO-08 | IT-services leads shall be reportable separately from distribution RFQs and software leads in CRM routing and FRS-RP-03. | M | I | BR-33 KPI |
| FRS-SO-09 | Service bundles (e.g., "SMB IT Care: AMC + support + security") shall be CMS-composed blocks linking their constituent service lines, presentational in Phase 1. | C | I | FR-5.3 |

---

## 8. M06 — Software Services (FRS-SW)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-SW-01 | The system shall render a Software Services landing page presenting the joint Simal + Unisoft proposition, credibility stats (40+ engineers, 150+ projects, ISO 9001/27001, SOC 2, 24/7 support — rendered only if present in the approved-claims register), technology-stack summary, and dual CTAs "Book a Demo" and "Request Consultation". | M | I | FR-6.1 · UR-24 · BR-12/14 BR-14 |
| FRS-SW-02 | The system shall render 12 service pages (Custom Software Development; Web & Mobile Apps; AI & ML; Cloud Services; Cybersecurity; Data Analytics & BI; UI/UX; QA & Testing; DevOps; IT Consultancy; Digital Transformation; Project Management) each with MEA-relevant copy, engagement-model links, and a lead form. | M | I | FR-6.2 · UR-26 |
| FRS-SW-03 | The system shall render 15 packaged-product pages (Distribution ERP, Retail ERP, UniPOS, UniVAT, Hotel ERP, Hospital ERP, Education ERP, Garments ERP, Field Service ERP, Managed Print ERP, E-commerce Platform, Queue Management, Asset Management, Loan Management, I-Portal) each with feature list, target industries, and demo CTA. | M | I | FR-6.3 · UR-25 |
| FRS-SW-04 | The technology-stack display shall be CMS-managed and seeded with the verified 44-technology stack (PRD Appendix B), grouped into the 12 categories as verified. | M | I | FR-6.2 |
| FRS-SW-05 | "Book a Demo" shall render a booking form with required fields per §23.3 plus a preferred-slot date picker (next 30 days, excluding non-business days per the reconciled calendar) and shall create a lead typed `software_demo`. | M | T | FR-6.7 · UR-28 |
| FRS-SW-06 | The system shall emit GA4 event `demo_request` with `{product}` for demo submissions and `software_lead` with `{form: 'consultation'}` for consultation submissions. | M | I | PRD §15 |
| FRS-SW-07 | Software leads shall route to the joint Simal+Unisoft CRM pipeline distinct from distribution RFQs and IT-services leads. | M | T | FR-6.7 · BRule-6 · BR-13 |
| FRS-SW-08 | The section shall render industry-solution pages (8 verticals) combining software products + hardware categories + IT services as vertical propositions. | M | I | FR-6.4 · UR-27 |
| FRS-SW-09 | The section shall render an engagement-models page describing Fixed Price, T&M, Dedicated Team, and Managed Support with the four-step delivery process (Discovery → Proposal → Agile Delivery → Support). | S | I | FR-6.5 · UR-30 |
| FRS-SW-10 | Case-study content type shall support industry, products-used, anonymized-client flag, outcome metrics, and EN/AR content; launch shall include ≥2 entries per BR-15. | M | I | FR-6.6 · BR-15 UR-29 |
| FRS-SW-11 | Co-branding treatment shall render "delivered in partnership with Unisoft Systems Ltd" with link to uslbd.com on all module pages. | M | I | FR-6.8 |
| FRS-SW-12 | Arabic versions of all module pages shall be first-class content per FRS-LN-02; EN-only pages shall display the locale-coverage badge defined in FRS-LN-04. | S | I | FR-6.9 · BRule-9 |
| FRS-SW-13 | Software consultation and demo forms shall offer signed-in users a one-click "link to my partner account" association so follow-up is unified; anonymous submitters receive the RFQ-style account nudge. | S | T | FR-K.32 · UR-13 |

---

## 9. M07 — Insights & Newsroom (FRS-IZ)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-IZ-01 | The system shall provide an Insights hub aggregating blog posts ("Tech Talk by Simal"), case studies, news items, and downloads, filterable by content type, topic, and brand. | M | T | FR-7.1 · UR-35 |
| FRS-IZ-02 | The blog content type shall support rich text, images, categories, tags, author profile, bilingual body, related posts (manual + same-tag fallback), reading-time estimate, and social share links. | M | I | FR-7.2 · CNT-6 |
| FRS-IZ-03 | Posts shall render Article structured data and be included in XML sitemaps with lastmod dates. | M | I | SEO-3 |
| FRS-IZ-04 | The migration shall import legacy posts and SEO landing pages (TeamGroup / Crucial / UGREEN distributor pages, "Top SSDs for Resellers 2025") with 301-mapped URLs. | M | I | FR-7.3 · SEO-7 · BR-32 |
| FRS-IZ-05 | The newsroom shall list press releases and event participation chronologically with type badges and an awards filter. | S | I | FR-7.4 · UR-34 |
| FRS-IZ-06 | Downloads (line cards, catalogs, capability decks) shall be gated assets requiring an email that emits GA4 `gated_download` with `{asset}`. | S | T | FR-7.5 · PRD §15 |
| FRS-IZ-07 | A press kit (logos ZIP, boilerplate EN/AR, leadership bios) shall be available as an ungated download from the newsroom. | S | I | FR-7.4 · UR-35 BR-27 |
| FRS-IZ-08 | Newsletter subscription shall implement double opt-in: capture → confirmation email with token (valid 7 days) → activation; and shall store topic preferences (distribution, software, events). | M | T | FR-7.6 · BRule-11 |
| FRS-IZ-09 | Newsletter subscribers shall be exportable (CSV) by the Content Editor role with audit logging of each export. | S | T | FR-K.19 pattern · BR-26 |
| FRS-IZ-10 | The hub homepage shall list the 3 most recent items on the site homepage per FR-2.10. | S | I | FR-2.10 |

---

## 10. M08 — Careers (FRS-J)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-J-01 | The careers landing page shall render employer-value-proposition content, benefits, location story (Dubai; group opportunities with Unisoft Dhaka), and the job listings module. | M | I | FR-8.1 · UR-38 |
| FRS-J-02 | Job openings shall be a CMS entity (title, dept, location, type, description EN/AR, opening/closing dates, status) and the listing shall show only open roles. | M | I | FR-8.2 |
| FRS-J-03 | When zero roles are open, the module shall render the speculative-application CTA ("Send us your CV — we're always looking") instead of an empty state. | M | I | FR-8.2 · UR-39 |
| FRS-J-04 | Applications shall validate per §23.4, attach CV (PDF/DOC/DOCX, ≤5MB, virus-scanned per FRS-DV-08), capture PDPL consent, and route to HR per BRule-6. | M | T | FR-8.3 · BR-21 |
| FRS-J-05 | Open roles shall render JobPosting structured data with validThrough dates. | S | I | FR-8.4 |
| FRS-J-06 | The system shall dispatch application acknowledgement email (catalog E-16) and emit GA4 `job_apply` with `{role}`. | M | T | PRD §15 |
| FRS-J-07 | Applications shall be listed in an admin view (role: Staff Admin, HR group) with status (New → Reviewed → Shortlisted → Rejected/Hired) and CV access audit-logged. | S | T | FR-K.19 pattern |
| FRS-J-08 | Speculative applications shall be typed `speculative` and retained 12 months per the retention policy (§26.4). | S | I | BR-22 pattern |

---

## 11. M09 — Contact & Enquiry Routing (FRS-CT)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-CT-01 | The contact page shall render the three-entity directory (Office: Simal Technologies Middle East LLC; Warehouse: StarSeed Technologies ME FZE, JAFZA; Store: Stellent Technologies ME LLC) with phones, emails, embedded maps, and the single reconciled hours schedule per BRule-3 (rendered from one CMS source also consumed by FRS-K-24). | M | I | FR-9.1 · UR-36/37 · BR-06 |
| FRS-CT-02 | The master enquiry form shall include the represent-type selector (New Partner / Existing Partner / Customer / Vendor-OEM / Media / Job Seeker), interest-area selector (distribution RFQ, IT services, software demo, specific brand, support, careers, other), and PDPL consent, validating per §23.3. | M | T | FR-9.2 · UR-36 |
| FRS-CT-03 | The system shall route submissions per BRule-6 mapping: represent-type + interest → destination (Sales RFQ queue / services sales / joint software pipeline / management partnerships / HR / service desk) with a fallback to info@ routing and an internal alert on fallback use. | M | T | FR-9.2 · BRule-6 |
| FRS-CT-04 | All public forms shall be protected by honeypot + reCAPTCHA v3 + per-IP rate limiting (5 submissions / 10 min) per FRS-R-10. | M | T | FR-9.3 |
| FRS-CT-05 | Form errors shall render inline at field level in the active locale, and the submit button shall be disabled no longer than necessary with pending state per USAB-7. | M | T | USAB-6/7 |
| FRS-CT-06 | The page shall offer direct channels per entity: click-to-call, mailto, and WhatsApp deep links with per-entity context. | M | I | UR-36 |
| FRS-CT-07 | The system shall log every enquiry with routing decision, timestamp, locale, and spam verdict for the routing dashboard (FRS-RP-05). | M | I | BR-29 |
| FRS-CT-08 | A "support hours" widget shall render today's open/closed status computed from the reconciled schedule and the visitor's timezone (default Gulf Standard Time, UTC+4). | S | T | UR-37 |

---

## 12. M10 — Accounts & Identity (FRS-A)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-A-01 | The system shall support self-registration with business email, full name, and password; upon submit the account enters `PENDING_VERIFICATION` and a verification email (FRS-EM-02, token valid 48h) is dispatched. | M | T | FR-10.1 · UR-40 |
| FRS-A-02 | The system shall reject registrations from disposable-email domains (maintained list, CMS-updatable) with a bilingual explanatory error. | S | T | FR-10.1 |
| FRS-A-03 | Verification shall activate the account to `ACTIVE` and auto sign-in the user; expired tokens shall offer re-send with the same address. | M | T | FR-10.1 |
| FRS-A-04 | Password rules: ≥10 characters, ≥3 of 4 classes (lower, upper, digit, symbol); passwords shall be hashed with bcrypt/argon2id and never logged or emailed. | M | T | NFR-4 |
| FRS-A-05 | Sign-in shall lock an account for 15 minutes after 5 consecutive failures, notify the account email, and log events; staff accounts shall additionally require MFA (TOTP) at every sign-in. | M | T | NFR-4 · FR-K.41 |
| FRS-A-06 | Password reset shall use single-use tokens valid 60 minutes, invalidate on use, and notify on completion. | M | T | FR-10.3 |
| FRS-A-07 | Sessions for staff/admin roles shall expire after 30 minutes idle; partner/applicant sessions after 12 hours; all sessions shall rotate identifiers after privilege changes. | M | T | NFR-4 |
| FRS-A-08 | The unified account shall gate: RFQ history, onboarding applications, document vault (own), and partner dashboard; no separate portal credentials shall exist. | M | T | FR-10.1/10.2, FR-K.2 · UR-40 · BR-16 |
| FRS-A-09 | Migrated KYC-portal users shall be provisioned with username = archived email and `RESET_REQUIRED` state, forcing password reset (and MFA enrollment for staff) at first sign-in. | M | T | FR-K.2 |
| FRS-A-10 | Roles shall be: `anonymous`, `applicant`, `partner`, `partner_admin`, `staff_reviewer`, `staff_admin`, `content_editor`, `hr_group` with the permission matrix in §24. | M | I | PRD §13.4 · FR-K.23 |
| FRS-A-11 | Partner accounts shall link to an Organization; `partner_admin` may invite ≤5 colleague users to the same Organization. | S | T | FR-K.14 |
| FRS-A-12 | Account settings shall allow email change (re-verification required), password change, locale preference, and marketing-consent management. | S | T | BRule-11 · BR-21 |
| FRS-A-13 | Sign-in, registration, and reset screens shall be fully RTL-capable and localized EN/AR. | M | I | FRS-LN-01 |
| FRS-A-14 | The system shall expose an in-site notification center (bell icon) listing the user's last 30 platform notifications with read/unread state. | M | T | FR-K.17 |
| FRS-A-15 | Data-subject requests (export/erasure) submitted via the privacy channel shall be executable by Staff Admin as account export (JSON) or anonymization, subject to KYC retention locks (§26.4), each action audit-logged. | M | T | BR-22 · FR-K.20 |
| FRS-A-16 | Account deletion/anonymization shall cascade: notifications deleted, marketing consent revoked, applications retained per legal hold with PII minimized. | M | A | BR-22 · FR-K.21 |
| FRS-A-17 | The system shall store and process KYC personal data within the configured primary hosting region; cross-region access (including any Unisoft-side delivery staff) shall be role-restricted, purpose-logged, and configurable by staff_admin per the PDPL Art. 22 safeguards assessment. | M | T | BR-23 · NFR-3 |

---

## 13. M11 — KYC Onboarding (FRS-K)

> Module implements PRD §9 with feature parity to the standalone portal. Field-level rules in §23.5. State machine in §22.1.

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-K-01 | The system shall serve onboarding at `/partners/onboarding` and shall redirect all `kyc.simalme.com` traffic per FRS-G-16: root → onboarding landing; tokenized deep paths → mapped resume destination or account dashboard; unmapped paths → account dashboard with notice. | M | T | FR-K.1/36 · UR-42 · BR-17 |
| FRS-K-02 | The landing shall present track selection — **Customer** ("receives invoices from Simal") and **Vendor/Supplier** ("issues invoices to Simal") — with plain-language guidance in EN/AR, and shall start the wizard scoped to the chosen track. | M | T | FR-K.6 · UR-15 |
| FRS-K-03 | The wizard shall present 7 steps: (1) Company details (2) Trade licence & registration (3) Tax & e-invoicing identifiers (4) Signatory & contacts (5) Banking details (6) Document uploads (7) Review & declaration — with progress indicator and per-step save. | M | T | FR-K.7/8 · URD UC-02 |
| FRS-K-04 | The wizard shall autosave every completed field to the draft application ≤2 seconds after change (debounced), and shall restore the draft on return via any entry point (same browser for anonymous, any device once signed in). | M | T | FR-K.7 · UR-16 |
| FRS-K-05 | Drafts shall be retained 90 days with a T-14-day inactivity reminder email; expiry shall notify and archive the draft. | S | T | FR-K.7 |
| FRS-K-06 | Validation shall be field-level immediate and step-level on Next; failing a step shall block progression and list errors atop the step in the active locale. | M | T | USAB-6 |
| FRS-K-07 | The TRN/TIN field shall accept exactly 15 digits (numeric, spaces/stray characters stripped client-side, leading zeros preserved) with format example `100123456700003`. | M | T | FR-K.8/9 · UR-18 |
| FRS-K-08 | The Peppol ID field shall auto-suggest construction `0235:` + the entered TRN, validate the concatenated format (prefix `0235:` + 15 digits), and allow paste-in values that match the rule; the helper text shall render in EN/AR. | M | T | FR-K.8/28 · UR-18 · BO-5 |
| FRS-K-09 | On submission the system shall: persist the application in `SUBMITTED` with immutable snapshot of all fields, dispatch confirmation (FRS-EM-06), enter the review queue, and start the 2-business-day SLA clock per the reconciled calendar. | M | T | FR-K.9 · BRule-2 · BR-19 |
| FRS-K-10 | Resubmission after `INFO_REQUIRED` shall reopen **only** reviewer-flagged fields plus any new mandatory attachments requested; untouched data shall remain locked and visually confirmed ("no re-entry needed"). | M | T | FR-K.7 · UR-17 |
| FRS-K-11 | Applicant status view shall render current state with timestamped history, reviewer notes where marked applicant-visible, pending flags, and the SLA countdown; states shall match §22.1. | M | T | FR-K.12 · UR-20 |
| FRS-K-12 | Approved organizations shall activate partner status: principals gain `partner`/`partner_admin` roles, the Partner Home dashboard renders KYC status, document vault, expiry alerts, and RFQ history. | M | T | FR-K.16 · BR-20 |
| FRS-K-13 | Expiry tracking shall schedule reminders T-30 / T-7 / T-0 days before licence/ID expiry (email + notification center), mark records `EXPIRING` (T-30) then `EXPIRED` (T+1), and list them in the console report. | M | T | FR-K.11 · UR-21 |
| FRS-K-14 | The applicant may invite a colleague by email to complete specific steps (tokenized, ≤7 days validity, single step scope). | C | T | FR-K.14 |
| FRS-K-15 | Both tracks and all steps shall be fully operable in Arabic (RTL forms, Arabic validation messages) per FRS-LN. | S | I | FR-K.13 · UR-15 |
| FRS-K-16 | Consent capture: the declaration step shall present the PDPL privacy notice (EN/AR) link and a mandatory, unpre-checked consent checkbox; submission shall be impossible without it; consent timestamp and notice version shall be stored with the application. | M | T | FR-K.20 · BR-21 · BRule-11 |
| FRS-K-17 | The system shall store for each application: track, all §23.5 fields, documents (FRS-DV), status history, reviewer identity per action, consent record, and Peppol identifiers as master data per BRule-7. | M | I | FR-K.5 · BRule-7 |
| FRS-K-18 | Migration import shall: create applications for in-flight records preserving state and timestamps, link archived documents to the vault, and produce a reconciliation report (counts by state, checksums of document blobs) to be signed off by Accounts per BR-17. | M | T | FR-K.34 · BR-17 FR-K.37 |
| FRS-K-19 | TRN/Peppol data shall be validated nightly across the partner base; records failing format rules shall be flagged in the data-quality report (FRS-RP-07). | M | T | FR-K.28 · BR-18 · BO-5 |
| FRS-K-20 | The public Partners section shall render the program page (benefits, tiers, requirements), onboarding entry, FAQ (FAQPage schema), and the Peppol-readiness explainer ("Onboard once. Trade with confidence."). | M | I | FR-K.30 · SEO-3 |
| FRS-K-21 | Tier hooks: the data model shall store partner tier (`Registered` default; `Authorized`, `Preferred` staff-settable) displayed only in the partner's own dashboard. | C | I | FR-K.33 |
| FRS-K-22 | The system shall emit GA4 events `kyc_started` (track selected), `kyc_step_complete` `{step}`, `kyc_submit` (application submitted), `kyc_status_view`. | M | I | PRD §15 FR-K.22 |
| FRS-K-23 | The system shall expose a resume-link generator for support staff producing a tokenized URL to the applicant's current step, expiring in 7 days, single-purpose. | S | T | FR-K.35 · UR-42 |
| FRS-K-24 | The business-day calendar shall be single-sourced from the CMS schedule object also feeding FRS-CT-01/08 (Sun–Thu default pending BRule-3 reconciliation), with holiday list support. | M | T | FR-K.40 · BRule-3 |
| FRS-K-25 | Onboarding entry links shall accept a track parameter (`?track=customer` or `?track=vendor`) that pre-selects the track on the selection screen; CTAs site-wide (header button, homepage band, RFQ nudge, footer) shall pass the appropriate scope. | M | T | FR-K.3 · UR-15 |
| FRS-K-26 | The platform shall pass the PRD §9.10 feature-parity checklist as a mandatory SG-3 verification item; each checklist row shall map to at least one FRS-K/DV/RC requirement or carry an explicit justification. | M | I | FR-K.4 · BR-16 |
| FRS-K-27 | The signed-in applicant dashboard shall render a "My Onboarding" card showing current step, pending flags, documents expiring, and the SLA countdown; post-approval it becomes Partner Home per FRS-K-12. | M | T | FR-K.15 · UR-20 |

---

## 14. M12 — Document Vault (FRS-DV)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-DV-01 | Uploads shall accept PDF/JPG/PNG, ≤10MB per file, ≤15 files per application, with MIME + extension validation and double-extension rejection. | M | T | FR-K.10 · UR-19 |
| FRS-DV-02 | Files shall be stored in encrypted object storage (AES-256 at rest) outside the webroot, served only via short-lived (≤15 min) signed URLs to authorized roles. | M | T | FR-K.18/22 · BR-25 |
| FRS-DV-03 | Every upload shall pass a virus scan before entering `UPLOADED` state; infected or scan-failing files shall be quarantined, excluded from applicant view, and raise an admin alert. | M | T | FR-K.10/22 |
| FRS-DV-04 | Access to documents shall be limited to: the owning applicant/partner (own documents only), assigned reviewer, staff_admin, and hr_group (CV documents only); all other roles shall receive 403. | M | T | FR-K.18 · §24 |
| FRS-DV-05 | Every document view, download, upload, replace, and permission change shall append an immutable audit entry (actor, action, document, timestamp, IP) retained ≥5 years and exportable as CSV by staff_admin. | M | T | FR-K.19 · BR-25 UR-23 |
| FRS-DV-06 | Applicants shall be able to replace a document version, retaining prior versions with version history visible to reviewers. | S | T | FR-K.24 support |
| FRS-DV-07 | Documents shall carry expiry dates where applicable (licence/ID) feeding FRS-K-13 expiry tracking. | M | T | FR-K.11 |
| FRS-DV-08 | Careers CV uploads and gated-asset submissions shall reuse the same scan/pipeline with a separate storage namespace. | M | A | FRS-J-04 · FR-9.3 |
| FRS-DV-09 | A purge job shall enforce retention (§26.4): unsuccessful-applicant documents deleted at 12 months, audit logs preserved; purges shall be logged and reported monthly. | M | T | FR-K.21 · BR-22 |
| FRS-DV-10 | No KYC document shall be transmittable by email from the platform; emails may only reference document metadata. | M | I | BRule-5 |

---

## 15. M13 — Review Console & Administration (FRS-RC)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-RC-01 | The console at `/admin/kyc` (roles `staff_reviewer`, `staff_admin`) shall list applications with columns: reference, organization, track, state, submitted-at, SLA age (business hours), assignee — filterable by state/track/age and sortable by SLA age descending by default. | M | T | FR-K.23 · UR-22 · BR-19 |
| FRS-RC-02 | Rows shall visually tier SLA age: normal (<1 business day), warning (>1), breach-imminent (>1.5); breach shall alert the reviewer and manager by email/notification. | M | T | FR-K.39 · BRule-2 |
| FRS-RC-03 | The review screen shall present application fields and documents side-by-side with per-field actions Approve / Flag (with mandatory note ≤500 chars) and applicant-visible toggle on notes. | M | T | FR-K.24 · UR-22 |
| FRS-RC-04 | The console shall offer: Request more info (returns application to `INFO_REQUIRED` reopening only flagged fields per FRS-K-10), Approve, Reject (mandatory reason), and assignment to a reviewer. | M | T | FR-K.24 · §22.1 |
| FRS-RC-05 | Reviewer decisions shall be restricted to applications assigned or unassigned; reassignment shall be logged; internal notes (applicant-invisible) shall be supported. | S | T | FR-K.26 · US-8.4 |
| FRS-RC-06 | The verification checklist panel shall present: licence validity, TRN format + registry-match (manual), Peppol ID format, signatory ID, bank details — each checkable with pass/fail state stored on the application. | M | T | FR-K.25 |
| FRS-RC-07 | Bulk actions shall support: assign, export queue summary (CSV), and mark-checked — never bulk approve/reject. | S | T | FR-K.26 |
| FRS-RC-08 | Admin dashboards shall render: submissions/week, median and p90 review time vs 2-business-day SLA, approval rate, expiring-documents report (30/60/90-day horizon). | S | T | FR-K.27 |
| FRS-RC-09 | The TRN/Peppol data-quality report shall show: partner-base coverage %, format-validity % (target ≥98% per BO-5), failure list with reasons, and weekly trend since migration. | M | T | FR-K.27 · BR-18 |
| FRS-RC-10 | User & role administration (staff_admin): create/disable staff, assign roles, force password reset, view role-change audit. | M | T | FRS-A-10 BR-30 |
| FRS-RC-11 | CMS administration (content_editor): pages, posts, brands, products, jobs, downloads, announcement bar, FAQ, hours schedule object — with draft/publish workflow, scheduled publishing, and bilingual field pairs. | M | T | NFR-11 · UR-43 |
| FRS-RC-12 | CMS preview shall render the Arabic RTL variant for any content type before publish. | M | T | US-8.1 · RTL-3 |
| FRS-RC-13 | The admin console shall require MFA, support optional IP allow-listing, and rate-limit login per FRS-A-05. | M | T | FR-K.41 |
| FRS-RC-14 | All admin state changes (publish, role, schedule, claims register) shall be audit-logged with before/after values. | M | I | NFR-5 |

---

## 16. M14 — Notifications & Email (FRS-EM)

> Catalog of messages in Appendix A. All emails send in the recipient's active locale with the opposite-locale footer link; all contain the PDPL contact.

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-EM-01 | The system shall dispatch transactional email via the configured provider within 60 seconds of trigger, with retry (3 attempts, exponential backoff) and a delivery-failure admin alert. | M | T | INT-3 |
| FRS-EM-02 | Account emails (verification, welcome, reset, lockout notice) shall render per catalog rows E-01…E-04. | M | I | FRS-A |
| FRS-EM-03 | RFQ emails (customer acknowledgement with reference + SLA; internal new-RFQ alert; internal SLA-breach alert) shall render per rows E-05…E-07. | M | I | FRS-R-04/05 |
| FRS-EM-04 | KYC emails (received, under-review, info-required with flagged items, approved, rejected-with-reason, expiry T-30/T-7/T-0, draft inactivity) shall render per rows E-08…E-15, plus the pre-cutover migration notice per E-18 (FR-K.38). | M | I | FRS-K |
| FRS-EM-05 | Marketing emails (newsletter) shall send only to double-opt-in subscribers with one-click unsubscribe honored ≤24h. | M | T | FRS-IZ-08 · BRule-11 |
| FRS-EM-06 | Every transactional email shall include a plain-text alternative and locale-appropriate RTL HTML. | M | I | RTL-6 |
| FRS-EM-07 | The in-site notification center (FRS-A-14) shall mirror KYC state changes and expiry alerts in real time. | M | T | FR-K.17 |
| FRS-EM-08 | Careers and software/demo acknowledgements shall render per rows E-16…E-17. | M | I | FRS-J-06 · FRS-SW-05 |
| FRS-EM-09 | Notification preferences (transactional mandatory, marketing optional) shall be manageable in account settings; transactional messages cannot be disabled. | S | T | BRule-11 |
| FRS-EM-10 | Email events (sent, delivered, bounced, complained) shall be recorded for deliverability monitoring and address suppression on hard bounce. | S | T | INT-3 |

---

## 17. M15 — Integrations (FRS-IG)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-IG-01 | WhatsApp integration in Phase 1 shall be deep links only (`wa.me/<number>?text=`), UTF-8 encoded, with context per FRS-G-04; no messaging API. | M | T | INT-1 · BR-08 |
| FRS-IG-02 | CRM integration shall create/update records for: RFQ (type `rfq`), IT-services consultation (`it_services`), software consultation/demo (`software_demo`/`software_consult`), careers-lite (`career`), general enquiry (`enquiry`) — including source locale, reference numbers, and page/UTM attribution; failures shall retry 3× then alert and queue. | M | T | INT-2 · BRule-6 |
| FRS-IG-03 | CRM shall be the routing system of record; the platform shall mark leads with routing outcome received from CRM or log fallback. | S | T | BR-09 |
| FRS-IG-04 | Transactional email shall integrate via provider API with templates stored in-platform (rendered server-side) so content is version-controlled with the site. | M | I | INT-3 |
| FRS-IG-05 | GA4 shall receive the event set `rfq_submit, kyc_started, kyc_step_complete, kyc_submit, kyc_status_view, software_lead, demo_request, whatsapp_click, become_partner_click, job_apply, newsletter_signup, gated_download` with the parameters specified per module above; `whatsapp_click` shall carry page context. | M | T | PRD §15 · BR-29 |
| FRS-IG-06 | reCAPTCHA v3 shall gate all public forms with configurable threshold; failed scores shall block with a bilingual retry message (never a silent drop). | M | T | FR-9.3 |
| FRS-IG-07 | The virus-scan service shall expose an async scan API with ≤60s p95 verdict; verdicts shall drive FRS-DV-03 states. | M | T | INT-9 |
| FRS-IG-08 | Google Search Console verification and XML sitemap ping shall be configured at launch; sitemaps shall segment public pages, products, posts, jobs. | M | I | SEO-7 |
| FRS-IG-09 | Phase-2 hooks (interface reservations only, no Phase-1 behavior): Peppol participant lookup, Peppol document exchange, ERP/stock APIs, ATS job sync — each behind a feature flag, off by default. | M | I | INT-6/7/8 · FR-K.29 |
| FRS-IG-10 | Secrets (API keys, SMTP, reCAPTCHA, storage credentials) shall be consumed exclusively from environment/secret-store variables; no credential literal shall appear in code, config files, or templates. | M | I | NFR-3 |
| FRS-IG-11 | All outbound integration calls shall be logged (endpoint, latency, status) without payload PII, and included in health dashboards. | S | T | NFR-13 |
| FRS-IG-12 | The platform shall expose an internal JSON feed of brand → SKU counts consumed by the homepage carousels, refreshable on publish. | C | A | FR-2.5 |

---

## 18. M16 — Reporting & Analytics (FRS-RP)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-RP-01 | The platform shall provide a staff KPI dashboard rendering: RFQs/day (with funnel started→submitted), KYC submissions/day and completion rate, software/IT-services leads/day, careers applications, WhatsApp clicks — filterable by date range and locale. | S | T | PRD §15 · BR-29 |
| FRS-RP-02 | The KYC funnel view shall show starts → step-completions (drop-off per step) → submissions → approvals with median durations per stage. | S | T | URD §13 · BO-4 |
| FRS-RP-03 | Lead-type mix (rfq / it_services / software_* / career / enquiry) shall be charted weekly with CRM routing outcomes. | S | T | BRule-6 · BR-33 |
| FRS-RP-04 | Content dashboard shall list top organic landing pages, top search queries with zero-result rate (FRS-SR-07), and gated-asset downloads. | S | T | SEO KPIs · BO-8 |
| FRS-RP-05 | Routing/fallback report shall count enquiries per destination and flag fallback-routed items for correction. | S | T | FRS-CT-07 |
| FRS-RP-06 | Dashboard access shall be role-gated (`staff_admin`, `content_editor` for content dashboard) and each export audit-logged. | M | T | §24 |
| FRS-RP-07 | The TRN/Peppol data-quality report per FRS-RC-09 shall be exportable CSV and retained as weekly snapshots for the BO-5 ≥98% trend. | M | T | BR-18 · BO-5 |
| FRS-RP-08 | GA4 shall be verified at SG-3 by firing every catalogued event in staging with parameter assertions. | M | T | PRD §19.1 |

---

## 19. M17 — Localization Behavior (FRS-LN)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-LN-01 | The language switcher shall toggle EN↔AR on any URL preserving path, query, and scroll anchor; locale shall be URL-encoded (`/ar/...` prefix) and stable per page. | M | T | FR-1.1 · UR-41 |
| FRS-LN-02 | Arabic rendering shall apply `dir="rtl"`, mirrored layout/navigation/breadcrumbs/pagination, mirrored directional icons and progress/carousel progression per RTL-1/2. | M | I | RTL-1/2 |
| FRS-LN-03 | Imagery shall be locale-curated: images containing text or directional cues shall have AR alternates selected by editors; the CMS shall flag EN-only media in AR preview. | M | I | RTL-3 · US-8.1 |
| FRS-LN-04 | Pages lacking AR content shall render the EN content with a visible locale-coverage badge ("Arabic version in progress") instead of hiding the page; the badge list shall be reportable for the content backlog. | M | T | BRule-9 |
| FRS-LN-05 | Numerals shall render as Western digits (0–9) in both locales; date formats shall be DD MMM YYYY (EN) / DD MMM YYYY with Arabic month names (AR); AED amounts as `AED 1,234`. | M | I | RTL-4 · BRule-9 |
| FRS-LN-06 | Form labels, placeholders, helper text, validation and error messages shall exist as bilingual string keys with Arabic reviewed by a native speaker before publish (transcreation gate). | M | I | RTL-5/6 · BRule-9 |
| FRS-LN-07 | hreflang/canonical per FRS-G-12 shall include `x-default` = EN. | M | I | SEO-5 |

---

## 20. M18 — Homepage (FRS-HP)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-HP-01 | The homepage hero shall render a carousel of ≤4 CMS-managed slides (image, headline EN/AR, CTA) that is swipeable, pauses on hover/focus and after user interaction, honors `prefers-reduced-motion`, and whose first-slide content is present in server-rendered HTML. | M | T | FR-2.1 |
| FRS-HP-02 | The homepage shall render the dual-business split section ("Distribute with us" → catalog/RFQ; "Build with us" → software services) as the first content block below the hero. | M | I | FR-2.3 · URD §5.1 |
| FRS-HP-03 | The homepage shall render a solutions & services teaser linking all 12 IT service lines and the consultation entry. | M | I | FR-2.6 · UR-45 |
| FRS-HP-04 | The homepage shall render a software spotlight with 3 flagship offers (Distribution ERP, UniPOS, Custom Development) and demo CTAs. | M | I | FR-2.7 |
| FRS-HP-05 | The homepage shall render a testimonials carousel seeded with ≥6 CMS-managed entries (name, role, company, rating) with consent recorded per BRule-8. | M | I | FR-2.8 |
| FRS-HP-06 | The homepage shall render an awards & trust module (Hikvision Best Distributor Partner; TeamGroup Best Partner 2025) and authorized-partner badges sourced from the claims register. | M | I | FR-2.9 · UR-34 · BR-05 |
| FRS-HP-07 | The homepage shall render a partner CTA band linking `/partners/onboarding` with the track parameter per FRS-K-25. | M | T | FR-2.11 · FR-K.3 |
| FRS-HP-08 | The homepage shall render CMS-merchandisable "new launch / trending" blocks (e.g., Crucial E100) sourced from product flags. | S | I | FR-2.1 · UR-08 |

---

## 21. M19 — About & Company (FRS-AB)

| ID | Requirement | Pri | V | Trace |
|---|---|---|---|---|
| FRS-AB-01 | The About page shall present the company story since 2002 with the "turnkey IT infrastructure distribution, solutions & services provider" positioning and focus areas, in EN/AR. | M | I | FR-3.1 · UR-32 · BR-02 |
| FRS-AB-02 | The company page shall render the companies & partners table (Simal ME LLC · StarSeed ME FZE · Stellent ME LLC · Unisoft Systems Ltd — software delivery partner) with role and location per entity; no group-affiliation content shall be presented (management correction, 3 Oct 2026). | M | I | FR-3.2 · UR-32 |
| FRS-AB-03 | The leadership page shall render a grid of profiles (photo, name, role, LinkedIn link); publishing shall be blocked until ≥4 approved profiles exist (no "coming soon" shipped). | M | I | FR-3.3 |
| FRS-AB-04 | The milestones timeline (2002 → present) shall be CMS-editable with year, event, and optional media, rendered RTL-correctly (progression right-to-left in AR). | S | I | FR-3.4 · RTL-1 |
| FRS-AB-05 | The awards page shall render award entries with imagery, awarding brand, year, and context. | M | I | FR-3.5 · UR-34 · BR-05 |
| FRS-AB-06 | The global-presence page shall render an interactive coverage presentation (UAE, KSA/GCC, MEA, CIS) and the fulfillment model (Bur Dubai office + JAFZA warehouse). | M | I | FR-3.6 · UR-33 |
| FRS-AB-07 | The customer-feedback page shall render moderated testimonials with industry filter and rating; submissions enter a moderation queue with no auto-publish. | M | T | FR-3.7 |
| FRS-AB-08 | The why-choose page shall render the four positioning pillars (authorized partnerships, regional coverage, customer-first, 20+ years) as CMS blocks. | M | I | FR-3.8 |

---

## 22. State Machines

### 22.1 KYC Application

```
DRAFT ──submit──▶ SUBMITTED ──reviewer opens──▶ UNDER_REVIEW ──approve──▶ APPROVED
  ▲                    │                            │                      │
  │                    │                    info required               (partner active;
  └── autosave ◀─  (withdraw by applicant)        │                      expiry tracking on)
                                            INFO_REQUIRED
                                                  │ applicant fixes flagged items
                                                  └─resubmit──▶ SUBMITTED (SLA restarts)
UNDER_REVIEW ──reject(reason)──▶ REJECTED  (terminal; data retained 12 months)
SUBMITTED/UNDER_REVIEW ──applicant withdraw──▶ WITHDRAWN (terminal)
```
Rules: SLA clock runs on business hours from SUBMITTED (FRS-K-09); resubmission reopens only flagged fields (FRS-K-10); APPROVED orgs feed partner activation (FRS-K-12).

### 22.2 Document

`QUARANTINE → UPLOADED → (verified at approval) VERIFIED → EXPIRING (T-30) → EXPIRED (T+1)`; `QUARANTINE → REJECTED (scan fail)`; replace creates new version, prior retained (FRS-DV-06).

### 22.3 RFQ

`SUBMITTED → IN_PROGRESS → QUOTED → WON | LOST | EXPIRED` (no public price; quoted-total set by staff; partner-visible per FRS-R-08).

### 22.4 Account

`PENDING_VERIFICATION → ACTIVE ⇄ LOCKED(temp) ; RESET_REQUIRED (migrated users) → ACTIVE ; ACTIVE → ANONYMIZED (DSR)`.

---

## 23. Field-Level Specifications

> Common rules: trim whitespace; bilingual error keys `err.<field>.<rule>`; `*` = required. Consent fields are never pre-checked.

### 23.1 RFQ Submission (anonymous/partner)

| # | Field | Type | Rules | Error key |
|---|---|---|---|---|
| 1 | Full name* | text ≤80 | letters/spaces (Unicode incl. Arabic) ≥2 chars | err.name |
| 2 | Company* | text ≤120 | ≥2 chars | err.company |
| 3 | Email* | email ≤120 | RFC-format; disposable-domain block (signed-in: pre-filled, read-only) | err.email |
| 4 | Phone* | tel ≤20 | E.164-tolerant digits/+ ; ≥7 digits | err.phone |
| 5 | WhatsApp | tel ≤20 | same as phone; optional | err.phone |
| 6 | Preferred contact | select | Email / Phone / WhatsApp (default WhatsApp) | — |
| 7 | Items* | basket ≥1 | from FRS-R-01; qty 1–99,999/item | err.items |
| 8 | Target date | date | ≥ tomorrow, ≤ 180 days | err.date |
| 9 | Notes | textarea ≤1000 | free | — |
| 10 | Consent* | checkbox | PDPL statement; must be checked | err.consent |

### 23.2 Master Enquiry (Contact) — adds: represent-type* (6 options), interest-area* (7 options), message* ≤2000; rest as 21.1 minus items.

### 23.3 Consultation / Demo (Software & IT services) — fields: name*, company*, email*, phone*, service-line or product* (select, context-prefilled), preferred-slot (demo only; business days next 30), message ≤2000, consent*.

### 23.4 Careers Application — role (hidden/speculative), name*, email*, phone, CV file* (PDF/DOC/DOCX ≤5MB, scanned), cover note ≤2000, consent*.

### 23.5 KYC Wizard (per-step critical fields)

| Step | Fields (type — rules) |
|---|---|
| 1 Company | Legal name* (≤200) · Trade name · Entity type* (select: LLC/FZE/Sole/Other) · Country* (select) · Emirate/State (UAE only) · Website · # Employees (select band) |
| 2 Licence | Trade licence number* (≤30) · Issuing authority* (≤120) · Issue date* (≤ today) · Expiry date* (> today; feeds FRS-DV-07) · Licence file → step 6 |
| 3 Tax & e-invoicing | TRN/TIN* (15 digits — FRS-K-07) · VAT registered* (Y/N) · Peppol ID* (`0235:`+15 digits — FRS-K-08) · e-invoicing phase awareness (info-only) |
| 4 Signatory & contacts | Signatory name* · Role* · Email* · Phone* · Accounts contact (name/email/phone)* · Address* (≤300) |
| 5 Banking | Bank name* · Account name* · IBAN* (AE: AE + 2 check + 3 bank + 16 acct = **23 characters** per CBUAE; format-validated) · SWIFT (≤11, optional) · Currency* (AED/USD/EUR) |
| 6 Documents | Trade licence* · Signatory ID (Emirates ID / passport)* · Bank letter (S) · Other (≤15 files total — FRS-DV-01) |
| 7 Review & declaration | Read-only summary · amend links per step · Consent* (FRS-K-16) · Submit |

---

## 24. Role–Permission Matrix

| Capability | anon | applicant | partner | partner_admin | staff_reviewer | staff_admin | content_editor | hr_group |
|---|---|---|---|---|---|---|---|---|
| Browse catalog / RFQ (anon) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RFQ history (own org) | — | — | ✅ | ✅ | — | — | — | — |
| Start/resume onboarding | ✅(anon draft) | ✅ | ✅ | ✅ | — | — | — | — |
| View own documents | — | ✅ | ✅ | ✅ | — | — | — | — |
| Invite colleague users | — | — | — | ✅ | — | — | — | — |
| Review console / KYC docs | — | — | — | — | ✅ | ✅ | — | — |
| Careers applications + CVs | — | — | — | — | — | ✅ | — | ✅ |
| CMS publish / hours / claims | — | — | — | — | — | ✅ | ✅ | — |
| Users & roles admin | — | — | — | — | — | ✅ | — | — |
| Dashboards / exports | — | — | — | — | (KYC funnel) | ✅ | (content) | — |
| Audit-log export | — | — | — | — | — | ✅ | — | — |

---

## 25. Error Handling Standards

| ID | Standard |
|---|---|
| ERR-1 | Every user action returns visible feedback ≤1s (optimistic pending state allowed); no silent failures (USAB-7, UR-44). |
| ERR-2 | Field errors render inline at first occurrence, on submit attempt summary at top, in active locale; focus moves to first error. |
| ERR-3 | System errors render friendly bilingual pages with a correlation ID (format `SDP-<yyyymmdd>-<rand6>`) quotable to support; raw stacks never exposed. |
| ERR-4 | Network loss during wizard/form use preserves local state and offers retry; submissions are idempotent by client-generated submission token (duplicate suppressed with the original reference shown). |
| ERR-5 | Rate-limit and captcha blocks state the reason and retry path; never silently drop (FRS-IG-06). |
| ERR-6 | Error catalog is string-keyed bilingual (`err.*`) and unit-testable; QA verifies no hardcoded strings (I). |

---

## 26. Data Requirements & Identifier Formats

### 26.1 Identifiers

| Object | Format | Example |
|---|---|---|
| RFQ reference | `SIMAL-RFQ-` + 4+ digits, sequential, unique | SIMAL-RFQ-0042 |
| Application reference | `SIMAL-KYC-` + 4+ digits | SIMAL-KYC-0107 |
| Correlation ID | `SDP-<yyyymmdd>-<6 rand>` | SDP-20261003-A1B2C3 |
| TRN/TIN | 15 numeric digits | 100123456700003 |
| Peppol ID | `0235:` + 15 digits | 0235:100123456700003 |
| IBAN (AE) | **23 chars**: `AE` + 2 check + 3 bank + 16 account (CBUAE fixed length) | AE07 0331 2345 6789 0123 456 |

### 26.2 Core Entities (behavioral fields)

`Organization` (track, tier, KYC state, Peppol refs) · `Application` (steps, flags, consent, SLA timestamps) · `Document` (type, version, state, expiry, scan verdict) · `AuditEvent` (actor, action, object, ts, ip — immutable) · `User` (roles, locale, consent registry) · `RFQ` (+items) · `Lead` (type, routing outcome) · `Brand/Product/Category` (flags, facets) · `ServiceLine/SoftwareProduct` · `Post/CaseStudy/Download` · `JobOpening/Application` · `Notification` · `ClaimsRegister` (claim, evidence, approved-by) · `HoursSchedule` (single source, BRule-3).

### 26.3 Reference Data

Country/emirate lists; entity types; currency list (AED/USD/EUR); disposable-domain list; holiday calendar (feeding FRS-K-24).

### 26.4 Retention (BRule-4 / FR-K.21)

KYC documents of approved partners: per UAE commercial record-keeping (admin-configurable). Unsuccessful/withdrawn applications: PII purge at 12 months, stats retained. Audit logs ≥5 years. Speculative career applications 12 months. GA4/analytics: per consent.

---

## 27. Verification & Gate Mapping

| Method | Meaning | Used for |
|---|---|---|
| **T** | Executed test (automated or scripted manual) | Most behaviors above |
| **I** | Inspection / review of rendered output or records | Structural, content, schema, i18n rendering |
| **A** | Analysis of design/data model without execution | Scalability, retention cascade |
| **D** | Demonstration on staging | Flows validated in UAT walkthroughs |

Gate mapping: SG-1 (design) — FRS-LN-02/03, §21 field specs reviewed · SG-2 (content/migration) — FRS-K-18 reconciliation, FRS-IZ-04 redirects · **SG-3 (QA/UAT, launch-blocking)** — all M-priority T/I requirements, GA4 verification (FRS-RP-08), usability rounds per URD §13 · SG-5 (+30d) — dashboards, search analytics, KPI baselines. Test strategy and pass criteria per PRD §19.3 and URD §13.2 core tasks.

---

## 28. Traceability Rollup

| Module | Reqs (M) | PRD anchor | URD anchor | BRD anchor |
|---|---|---|---|---|
| M01 Global | 16 (14) | FR-1, FR-2.2 | UR-31/36/37/41/44 | BR-01/03/06/08 |
| M02 Search | 8 (6) | FR-1.3 | UR-01 | BR-10 |
| M03 Catalog | 16 (13) | FR-2/4 | UR-01–08 | BR-04/05/10/11 |
| M04 RFQ | 16 (11) | FR-4.4 | UR-09–14 | BR-02/07 |
| M05 IT Solutions | 8 (4) | FR-5, BR-33 | UR-45–47 | BR-33 |
| M06 Software | 12 (10) | FR-6 | UR-24–30 | BR-12–15 |
| M07 Insights | 10 (5) | FR-7 | UR-35 | BR-26/27/32 |
| M08 Careers | 8 (5) | FR-8 | UR-38/39 | BR-28 |
| M09 Contact | 8 (7) | FR-9 | UR-36/37 | BR-06 |
| M10 Accounts | 16 (13) | FR-10, NFR-4 | UR-40 | BR-16/21/22 |
| M11 KYC | 24 (19) | PRD §9 | UR-15–21 | BR-16–20 |
| M12 Vault | 10 (9) | FR-K.18–22 | UR-19/23 | BR-25 |
| M13 Console | 14 (11) | FR-K.23–27 | UR-22/43 | BR-19/26/29 |
| M14 Email | 10 (8) | FR-K.17 et al. | UR-44 | BR-09 |
| M15 Integrations | 12 (9) | PRD §13.3 | — | BR-08/09 |
| M16 Reporting | 8 (3) | PRD §15 | — | BR-18/29/BO-5 |
| M17 Localization | 7 (7) | FR-1.1, D-4 | UR-41, RTL-1–6 | BR-01/BRule-9 |
| M18 Homepage | 8 (7) | FR-2 | UR-08/31/34/45 | BR-05 |
| M19 About & Company | 8 (7) | FR-3 | UR-32/33/34 | BR-02/05 |
| **Total** | **225 (173 M · 43 S · 9 C)** | | | |

*(Counts verified in Appendix B index.)*

---

## 29. Appendices

### Appendix A — Notification & Email Catalog

| # | Code | Trigger | Recipient | Key content | Locale |
|---|---|---|---|---|---|
| E-01 | `acct.verify` | Registration | User | Token link (48h) | EN/AR |
| E-02 | `acct.welcome` | Verification done | User | Sign-in link, next steps | EN/AR |
| E-03 | `acct.reset` | Reset requested | User | Single-use link (60m) | EN/AR |
| E-04 | `acct.locked` | 5 failed logins | User | Unlock time, support | EN/AR |
| E-05 | `rfq.ack` | RFQ submitted | Submitter | Reference, SLA, items | EN/AR |
| E-06 | `rfq.new` | RFQ submitted | Sales queue | Reference, items, contact | EN |
| E-07 | `rfq.sla` | RFQ unactioned 1bd | Sales mgr | Reference, age | EN |
| E-08 | `kyc.received` | Application submitted | Applicant contact | Reference, SLA 2bd | EN/AR |
| E-09 | `kyc.review` | Reviewer opens | Applicant | Status note | EN/AR |
| E-10 | `kyc.info` | INFO_REQUIRED | Applicant | Flagged items list, resume link | EN/AR |
| E-11 | `kyc.approved` | APPROVED | Partner | Activation, dashboard link | EN/AR |
| E-12 | `kyc.rejected` | REJECTED | Applicant | Reason, re-apply path | EN/AR |
| E-13–15 | `kyc.expiry30/7/0` | T-30/T-7/T-0 | Partner | Document, renew CTA | EN/AR |
| E-16 | `job.ack` | Application | Candidate | Role, confirmation | EN/AR |
| E-17 | `sw.ack` | Consultation/demo | Requester | Type, SLA, reference | EN/AR |
| E-18 | `kyc.migration` | Cutover −7 days | In-flight applicants | Migration notice: links keep working; where to continue | EN/AR |

(+ `kyc.draft` inactivity T-14; `news.confirm` double opt-in per FRS-IZ-08.)

### Appendix B — Requirement Index & Counts

Modules M01–M19 with prefixes FRS-G/SR/C/R/SO/SW/IZ/J/CT/A/K/DV/RC/EM/IG/RP/LN/HP/AB; total **225 requirements, all unique** (M=173, S=43, C=9). Verification mix across rows: T=136, I=85, A=4; Demonstration applies additionally at SG-3 gate walkthroughs per §27. *(IDs are unique and stable; retirements recorded in future change records, never renumbered.)*

### Appendix C — Research Sources (accessed 3 Oct 2026)

- ISO/IEC/IEEE 29148:2018 (supersedes IEEE 830-1998) — good-requirement characteristics, shall-statement practice, verification methods: [IEEE SA](https://standards.ieee.org), [ModernRequirements 29148 explainer](https://www.modernrequirements.com), [ReqView templates](https://www.reqview.com), [Jama Software requirement characteristics](https://www.jamasoftware.com)
- FRS/FSD structure practice: [TechTarget functional specification](https://www.techtarget.com), [AltexSoft](https://www.altexsoft.com), [Bridging the Gap](https://www.bridging-the-gap.com)
- Family documents: BRD v1.3, URD v1.2, PRD v1.4 (same folder — factual base: SLAs, identifier formats, claims register, calendars, brand palette, catalog counts); UAE IBAN format per Central Bank of the UAE (23-character fixed length, ISO 13616)

### Appendix D — Glossary

**FRS** Functional Requirements Specification · **PDP** Product Detail Page · **RFQ** Request for Quote · **SLA** Service Level Agreement · **bd** business day (reconciled Sun–Thu default) · **TRN** Tax Registration Number (15 digits) · **Peppol ID** `0235:`+TRN · **IBAN** International Bank Account Number · **KYC** Know Your Customer · **PDPL** UAE Federal Decree-Law 45/2021 · **DSR** Data Subject Request · **CMS** Content Management System · **GA4** Google Analytics 4 · **T/A/I/D** Test / Analysis / Inspection / Demonstration · **SG-n** BRD stage gates · **M/S/C** Must/Should/Could

---

*End of FRS v1.2 — companion to BRD v1.3, URD v1.2 and PRD v1.4 (same folder). Written to ISO/IEC/IEEE 29148 / IEEE 830 characteristics (necessary, unambiguous, singular, verifiable; external-interface and assumptions sections included); every requirement carries priority, verification method, and trace. Field rules, state machines, permissions, notifications, and identifier formats herein are the contractual build-and-test baseline for SG-3.*
