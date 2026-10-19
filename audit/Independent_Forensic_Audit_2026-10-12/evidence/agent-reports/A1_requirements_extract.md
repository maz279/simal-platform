# Simal Digital Platform: Testable Requirements Checklist

**Scope.** I read all 10 assigned docs in full (about 4,100 lines). Read-only; no files were changed.

**Doc keys.** BRD v1.4, PRD v1.5, FRS v1.3, URD v1.3, SRS v1.1 (all in `Primary_doc/`). A6 = `Portal_KYC_eInvoicing_PRD.md`. F4 = `Content_Governance_and_CMS_Guide.md`. B5 = `API_Contract_OpenAPI_Spec.md`. D3 = `Project_doc/04_Quality/Requirements_Traceability_Matrix.md`. CRTM = `Codebase/RTM.md`.

**Conventions.**
- "L###" is the line number in that file.
- (M/S/C) is the doc's Must/Should/Could priority.
- FRS IDs are the primary key. The FRS has 225 rows (I counted them) and calls itself "the contractual build-and-test baseline for SG-3" (L720). PRD, BRD and URD IDs are given as cross-references.
- ⚠aN points to contradiction N in section (a).
- "bd" = business day.

---

## 1. Public website

### 1.1 Routes and pages
Sources: PRD §7.2 sitemap L302-360 and §7.3 URL strategy L364-366.

| Route / page | Source IDs | Required content | How to verify |
|---|---|---|---|
| `/` Home | FRS-HP-01..08, G-14, C-15, IZ-10, R-15; PRD FR-2.1-2.12 (L392-403) | See §1.3 | `curl /` with no JS |
| `/about` plus subpages: About Simal, Vision/Mission/Values, Leadership, Companies & Partners, Global Presence, Awards, Milestones, Customer Feedback, Why Choose | PRD L304-313; FRS-AB-01..08 | See §1.7. Vision/Mission/Values has no FR ID (sitemap only). | Crawl `/about/*` |
| Brands A–Z and `/brands/{slug}` | PRD L315, App D L851 (23 brands); BR-04; FRS-C-09/10 | One page per brand (§1.4) ⚠a2 | Count brand pages against the 23-brand list |
| 9 category pages | FRS-C-13 L201; PRD L318-327 | Storage; Memory; Monitors & Displays; PCs & Laptops; Components; Accessories & Connectivity; Networking; Security & Surveillance; Meeting & AV | Nav and category grid show exactly 9 |
| `/products/{slug}` (PDP) | FRS-C-05..16; PRD FR-4.3 | See §1.4 | `/products/crucial-t705` |
| RFQ hub / basket | PRD L329; FRS-R-* | Multi-item basket (§3) | §3 |
| Compare | FRS-C-08 (C); PRD FR-4.6 (C); SRS SS2-003 | 2–4 products | Select 4; a 5th is blocked |
| Search results | FRS-SR-01..08 | See §1.4 | `?q=crucail`, `t705`, garbage text, Arabic letter variants |
| `/solutions/{line}` ×12, plus 8 IT industry pages | FRS-SO-01/03 | See §1.5 | Count 12 + 8 |
| `/software`; `/software/services/{x}` ×12; `/software/products/{x}` ×15; industries ×8; engagement models; "Why Simal + Unisoft"; consultation/demo | FRS-SW-01..13; PRD L335-346 | See §1.6 ⚠a4 | Count routes |
| `/partners`, `/partners/onboarding?track=customer\|vendor`, `/account`, Partner FAQ, Peppol explainer | PRD FR-K.1 L501, L347-351; FRS-K-01/02/20/25/27 | See §1.8 and §3 | |
| `/insights`: Blog ("Tech Talk"), Case Studies, Newsroom, Downloads | FRS-IZ-01..10; PRD L352-356 | | |
| "Resources" | No requirement route. Requirements call it Insights › Downloads (FR-7.5). CRTM L146 says a `/resources` route was added. | | |
| `/careers` | FRS-J-01..08 | | |
| ESG & Compliance page (footer level) | PRD L358, L184; no FR ID | Genuine products, PDPL, e-invoicing readiness, quality | Footer link resolves |
| `/contact` | FRS-CT-01..08 | | |
| Legal pages: Privacy (PDPL), Terms, Cookie Policy, in AR and EN, plus PDPL notice link | FRS-G-15; PRD FR-1.4, C-10 (M) L667; BR-21 | UAE counsel-reviewed (BRD dependency 3). B5 serves `legal_policies` via the CMS. | Footer links work in `/ar/` too |
| `/admin/kyc` | PRD FR-K.1/K.23; FRS-RC-01/13 | Staff only, behind MFA | Anonymous user gets 401/redirect |
| 404 and 500 pages | FRS-G-11; PRD D-10, SEO-7 | §1.2 | |
| XML sitemaps and robots.txt | PRD NFR-9, SEO-7; FRS-IG-08, IZ-03 | Segmented into pages, products, posts, jobs; includes lastmod | `GET /sitemap*.xml` |
| HTML sitemap page | Not required by any doc | | |
| `/ar/...` twin of every page | FRS-LN-01 | | |
| `kyc.simalme.com/*` | FRS-G-16, K-01; PRD FR-K.35/36; BR-32 | 301 to new platform, kept ≥24 months ⚠a14 | `curl -I` root and token deep links |
| Legacy WordPress URLs | PRD L365, §12.3 L672-676; BR-32 | 301 to nearest page; no chains >1 hop; no orphans. G13 test pages (`/training-draft/` "Helllo People", empty `/product-category/personal-storage/`) must not survive. | Crawl the redirect map |

### 1.2 Site-wide elements (FRS M01 L151-166; PRD FR-1.x L378-386)

| ID | Requirement | How to verify |
|---|---|---|
| G-01 (M) / FR-1.1 | Sticky header on every page, in this order: logo, mega-menu (≤7 items, ≤2 levels) ⚠a6, search trigger, EN\|AR switcher, Sign-In, and a visually distinct "Become a Partner" button | Check DOM order; count menu items and depth |
| G-02 (M) / FR-1.2 | Utility bar at ≥1024px: +971 4 393 0507, info@simalme.com, LinkedIn/Facebook/Instagram/WhatsApp. PRD also asks for a market selector (default UAE). | 1280px viewport |
| G-03 (M) / RTL-2 | Logo top-left in EN, top-right in AR | `/ar/` |
| G-04 (M) / FR-1.5 | Floating WhatsApp button on every page: `wa.me/<n>?text=` "Hello, I'm interested in {page-context} {current-URL}", UTF-8 | Inspect the href on a PDP and a solution page |
| G-05/06 (M) / FR-1.6 | Cookie banner on first visit with Accept-all, Reject-non-essential, and analytics/marketing toggles. Choice stored 12 months. Analytics/marketing tags blocked until consent. | Fresh browser profile: no gtag request before consent |
| G-07 (M) / FR-1.9 | Breadcrumbs "Home › Section › Page" on every page except Home, with BreadcrumbList JSON-LD | Rich Results test |
| G-08 (S) / FR-1.8 | CMS announcement bar: start/end datetime, EN+AR text, optional link; takes zero space when inactive | Schedule one and check layout outside the window |
| G-09 (M) | No horizontal scroll from 360–1920px; hamburger menu below 1024px. PRD FR-1.7 breakpoints: 1920/1440/1280/1024/768/375. | Responsive sweep |
| G-10 (M) | Touch targets ≥44×44px at ≤768px | DevTools |
| G-11 (M) | Custom 404 with site search, the 8 most-visited category links and a WhatsApp fallback; no dead ends. 500 page also designed (D-10). | Bogus URL returns HTTP 404 with these elements |
| G-12 / LN-07 (M) | hreflang en/ar, `x-default` = EN, and canonical on every public page | View source |
| G-13 (M) / NFR-9 / SEO-2 | All visible facts, including counters, are in the server HTML without JS (fixes the current "0+" counters) | `curl` and grep for the values |
| G-14 (M) / FR-2.2 / BR-03 | Credential strip "20+ Years · 20+ Brands · 1000+ Clients* · 6 Regions": static in HTML, count-up animation respects reduced motion, CMS-editable, only shows claims approved in the claims register (BRule-8) | curl; an unapproved claim does not render |
| G-15 (M) / FR-1.4 | Footer: 3-entity directory (Office / JAFZA Warehouse / Store), quick links, brand index linking every brand page, newsletter form, Privacy/Terms/Cookies, PDPL notice, copyright | Footer brand links = number of brand pages |
| G-16 (M) | Old-portal resolver: `kyc.simalme.com` root → `/partners/onboarding`; token deep paths → mapped resume step; unmapped paths → dashboard with a notice; all HTTP 301 | `curl -I` |
| PRD §19.1 / BR-06 | No placeholder content on any public page; one reconciled support-hours schedule everywhere | Content sweep |
| NFR-8 | Latest 2 versions of Chrome, Edge, Firefox, Safari; iOS/Android current and current −1 | Cross-browser run |

### 1.3 Home page

| ID | Section | How to verify |
|---|---|---|
| HP-01 (M) / FR-2.1 | Hero carousel of ≤4 CMS slides (image, EN/AR headline, CTA). Swipeable; pauses on hover/focus and after interaction; respects reduced motion; slide 1 is in the server HTML. D3 also requires a pause button. ⚠a5 | Count slides; focusing a slide pauses it |
| G-14 | Credential strip | |
| HP-02 (M) | Dual-business split ("Distribute with us" / "Build with us") as the first block below the hero | DOM order |
| C-15 (M) / FR-2.4/2.5 | Grid of 9 categories, featured-brands carousel (logos link to brand pages), best-sellers carousel | 9 tiles |
| HP-03 (M) | Solutions teaser linking all 12 IT service lines plus the consultation entry | 12 links resolve |
| HP-04 (M) | Software spotlight: Distribution ERP, UniPOS, Custom Development, each with a demo CTA | |
| HP-05 (M) | Testimonials carousel, ≥6 CMS entries (name, role, company, rating) with consent recorded | ≥6 |
| HP-06 (M) | Awards and trust: Hikvision "Best Distributor Partner", TeamGroup "Best Partner 2025", authorized-partner badges from the claims register | |
| IZ-10 (S) | 3 most recent insights | |
| HP-07 (M) | Partner CTA band → `/partners/onboarding?track=…` | href includes the track parameter |
| R-15 (S) / FR-2.12 | Quick RFQ strip (name, company, phone, free text) that creates a lead (not a basket) and sends an acknowledgement email | Submit; check the outbox and CRM |
| HP-08 (S) | "New launch / trending" blocks driven by product flags (e.g., Crucial E100) | Toggle the flag in the CMS |

### 1.4 Catalog, brands, PDP, compare and search (FRS M03 L189-204, M02 L174-181)

| ID | Requirement | How to verify |
|---|---|---|
| C-01 (M) | 76 legacy SKUs at launch, split Components 35 / Accessories 30 / Monitors 6 / Gaming 9 / Laptops 3. Each needs title, description, brand, category, ≥1 image and EN specs, plus a per-SKU Arabic coverage status. ⚠a3 | Count PDPs |
| C-02 (M) | Data model supports ≥5,000 SKUs, key/value specs, variants, multiple categories, EOL flag and new-launch flag | Schema review |
| C-03 (M) | Facets: brand, category and ≤10 curated specs. OR within a facet, AND across facets. Counts update in ≤500 ms p95. | Combine facets and time it |
| C-04 (M) | Sort by Default / Newest / Brand A–Z; 24 items per page; stable page URLs. PRD FR-4.2 adds SEO copy blocks. | `?page=2` |
| C-05 (M) / FR-4.3 | PDP has: zoomable gallery (≥1 image), title, brand link, category breadcrumb, spec table, description, authorization badge, ≤8 related products, "Add to RFQ" and "Enquire via WhatsApp". PRD also asks for datasheet downloads. | Inspect a PDP |
| C-06 (S) | EOL product shows an "End of life — suggested replacement" block | |
| C-07 (M) / FR-4.9 | Product JSON-LD with brand and SKU, no `offers.priceSpecification`, CallForPrice handling | Rich Results test |
| C-11 (M) ⚠a38 | "Check availability & price" adds to RFQ; no stock quantity shown anywhere | Grep HTML for stock values |
| C-12 (C) | Phase-2 price/stock slot for approved partners; nothing visible in Phase 1 | |
| C-14 (M) | WebP/AVIF with JPEG fallback; lazy-load below the fold; alt text in the active locale | Network tab |
| C-16 (M) / BRule-1 / BR-11 | AED by default with a display-only USD toggle (CMS rate). No prices and no online payment in Phase 1. | No price strings or payment gateway |
| C-09 (M) / FR-4.1 / BR-04 | One brand page per brand (≥20; 23 listed): logo used per vendor trademark rules (BRule-10), authorized-distributor badge, ≤300-word "Official {Brand} Distributor in UAE" text, product grid, related insights. PRD adds brand story and a "Get bulk pricing" CTA. UGREEN exclusivity shown only if verified. | Count `/brands/*` |
| C-10 (M) | Claim badges come only from the approved claims register | An unapproved claim is hidden |
| C-08 (C) | Compare 2–4 products in a unified spec matrix with differences highlighted | `/compare` |
| SR-01..08 | Search box in the header and on the 404 page, plus a results page. Indexes products, brands, categories, IT services, software services, software products, industry pages, posts, case studies and static pages ⚠a34. Suggestions after ≥2 characters, ≤8 grouped, ≤300 ms p95. Matches SKU fragments (`t705`, `p310`), brands and common names, case-insensitive. Arabic normalization of ا/أ/إ/آ, ة/ه, ي/ى. Results grouped with counts plus type/brand filters (S). Zero results show fuzzy suggestions and WhatsApp. Queries logged (S). Works in RTL. | Typo, garbage, Arabic-variant and SKU-fragment queries |
| UR-01 | Any product findable in ≤3 interactions | Usability test |

### 1.5 IT Solutions (FRS M05 L235-243; PRD FR-5.x; BR-33; UR-45..47)

- **SO-01 (M):** 12 service pages, each with outcomes, scope, deliverables, process, SLA summary and a consultation form. The 12: AMC, IT Infrastructure, Managed Services, Network & IT Security, Firewall, Cloud Security, Data Recovery & Storage, Structured Cabling, IP Telephony, AV & Meeting Rooms, Support & Maintenance, Software & Licensing.
- **SO-03 (S):** 8 industry pages (Retail, Healthcare, Education, Hospitality, Government, Logistics, SME, Enterprise), each linking products, services and software.
- **SO-04 (C):** AMC tiers (Bronze/Silver/Gold) as CMS blocks, presentational only.
- **SO-05 (S):** ≤8 related products per service.
- **SO-07 (C):** Thank-you page offers a gated line card.
- **SO-09 (C):** Service bundles (e.g., "SMB IT Care").

### 1.6 Software (FRS M06 L251-263; PRD FR-6.x L445-453; BR-12..15)

- **SW-01 (M):** Landing page with the joint Simal + Unisoft proposition. Stats (40+ engineers, 150+ projects, ISO 9001/27001, SOC 2, 24/7) appear only if they are in the claims register. Tech-stack summary. CTAs "Book a Demo" and "Request Consultation".
- **SW-02 (M):** 12 service pages, each with MEA copy, engagement-model links and a lead form: Custom Software Development, Web & Mobile Apps, AI & ML, Cloud Services, Cybersecurity, Data Analytics & BI, UI/UX, QA & Testing, DevOps, IT Consultancy, Digital Transformation, Project Management.
- **SW-03 (M):** 15 product pages, each with features, target industries and a demo CTA ⚠a4: Distribution ERP, Retail ERP, UniPOS, UniVAT, Hotel ERP, Hospital ERP, Education ERP, Garments ERP, Field Service ERP, Managed Print ERP, E-commerce Platform, Queue Management, Asset Management, Loan Management, I-Portal.
- **SW-04 (M):** Tech stack is CMS-managed: 44 technologies in 12 categories (PRD App B L838).
- **SW-08 (M):** 8 industry-solution pages combining software, hardware and services.
- **SW-09 (S):** Engagement models page: Fixed Price, T&M, Dedicated Team, Managed Support; process Discovery → Proposal → Agile Delivery → Support.
- **SW-10 (M):** Case-study type (industry, products used, anonymized flag, outcome metrics, EN/AR). At least 2 at launch (BR-15: one distribution, one software). PRD C-6 says 2–4.
- **SW-11 (M):** "delivered in partnership with Unisoft Systems Ltd" plus a link to uslbd.com on every module page.
- **SW-12 (S):** Arabic versions, or the locale badge where missing.
- **SW-13 (S):** "Link to my partner account" option on software forms.

### 1.7 About (FRS M19 L498-505; PRD FR-3.x L409-416)

- **AB-01 (M):** Company story since 2002, "turnkey IT infrastructure distribution, solutions & services provider", focus areas; EN and AR.
- **AB-02 (M):** Companies table: Simal ME LLC (Bur Dubai office), StarSeed ME FZE (JAFZA warehouse), Stellent ME LLC (store), Unisoft Systems Ltd (software delivery partner). No TwinMOS, Smart Group or other group-affiliation content anywhere on the site (PRD L69, L860) ⚠a41.
- **AB-03 (M):** Leadership grid (photo, name, role, LinkedIn). Publishing is blocked until ≥4 approved profiles exist; no "coming soon".
- **AB-04 (S):** Milestones timeline from 2002, CMS-editable, runs right-to-left in AR.
- **AB-05 (M):** Awards page with imagery, awarding brand, year and context.
- **AB-06 (M):** Global presence: interactive coverage of UAE, KSA/GCC, MEA and CIS, plus the fulfillment model (office + JAFZA warehouse).
- **AB-07 (M):** Customer feedback page with moderated testimonials, industry filter and ratings. Submissions go to a moderation queue; nothing auto-publishes.
- **AB-08 (M):** "Why choose" page with 4 pillars as CMS blocks.

### 1.8 Insights, Careers, Partners

- **IZ-01 (M):** Insights hub with blog, case studies, news and downloads; filters by type, topic and brand.
- **IZ-02 (M):** Blog type supports rich text, categories, tags, author, bilingual body, related posts (manual plus same-tag fallback), reading time and share links.
- **IZ-03 (M):** Article JSON-LD; posts in the sitemap with lastmod.
- **IZ-04 (M):** Migrate legacy posts and SEO pages (TeamGroup / Crucial / UGREEN distributor pages, "Top SSDs for Resellers 2025") with 301s.
- **IZ-05 (S):** Newsroom in date order with type badges and an awards filter.
- **IZ-07 (S):** Ungated press kit (logos ZIP, EN/AR boilerplate, leadership bios).
- F4 sets the launch library at 14 articles. SRS adds an RSS feed.
- **J-01 (M):** Careers page with employer value proposition, benefits, location story (Dubai; opportunities with Unisoft in Dhaka) and listings.
- **K-20 (M):** Partners section with program page (benefits, tiers, requirements), onboarding entry, FAQ with FAQPage JSON-LD, and the Peppol explainer "Onboard once. Trade with confidence."

Arabic/RTL requirements are in the Localization row of section 4.

---

## 2. CMS: what non-technical editors must be able to manage

URD UR-43 (M) requires editors to publish bilingual content and administer users, roles and dashboards without a developer. PRD NFR-11 requires content changes without deploys, plus a staging environment.

| Capability / content type | Source | How to verify |
|---|---|---|
| Explicit list of editable types: pages, posts, brands, products, jobs, downloads, announcement bar, FAQ, and the hours-schedule object (with holiday list) | FRS-RC-11 (M) L405; K-24 | Log in as `content_editor`, edit each type, confirm no deploy |
| Hero slides (≤4) | HP-01; B5 `hero_slides` | |
| Credential values and the claims register (claim, evidence, approved-by) | G-14, C-10, §26.2, BRule-8 | |
| Testimonials (≥6) and the feedback moderation queue | HP-05, AB-07 | |
| Product merchandising flags (new launch, trending, best-sellers) | HP-08, C-15 | |
| Milestones, why-choose pillars, leadership profiles (publish gate at ≥4) | AB-04/08/03 | |
| AMC tiers, service bundles, tech stack (44 items), case studies | SO-04/09, SW-04/10 | |
| Job openings (title, dept, location, type, EN/AR description, open/close dates, status) | J-02 | |
| Newsroom items, press kit, gated downloads | IZ-05..07 | |
| USD display rate and disposable-email domain list | C-16, A-02 | |
| Legal policies | B5 L47 | |
| Announcement bar (start/end datetime, EN/AR, link) | G-08 | |
| Bilingual field pairs; Arabic RTL preview for any type before publishing; EN-only media flagged in AR preview; AR image alternates; reportable list of "Arabic version in progress" badges | RC-11/12, LN-03/04, US-8.1 | Preview AR before publishing |
| Workflow. FRS: draft/publish and scheduled publishing. F4: Draft → internal review → compliance sign-off (required for pricing claims, Peppol/compliance dates, brand-authorization wording) → scheduled → live. BRD §8.4: draft → review → publish, bilingual. | RC-11; F4 L14; BRD L376 | Schedule a post; verify it goes live on time |
| Versioning and rollback: keep the last 10 revisions; one-click restore then republish (with cache purge); rollback is audited with a reason | F4 L14, L33 | Restore revision n−1 |
| Audit: every publish records who and when; admin changes (publish, role, schedule, claims) record before/after values | F4 L14; RC-14 | Check audit rows |
| Roles. FRS §24: CMS publish/hours/claims = `staff_admin` and `content_editor`. F4: Contributor / Editor / Publisher / Compliance Reviewer, with a `notes` permission for catalog facts. ⚠a36 | | |
| Publish SLAs: standard content 2 bd from draft to live; same-day fast lane with Editor sign-off; emergency path (any Editor plus CM lead or SEC, with retrospective review) | F4 L32 | |
| Bilingual governance: every publish includes the AR version or explicitly defers it; weekly AR-gap report; AR coverage ≥90% of changed pages within 10 bd | F4 L18, L34 | |
| Each publish emits analytics event `content_published` (entity + actor) | F4 L35 | |
| Content calendar: 2 distribution posts + 1 software post per month; brand pages refreshed quarterly ⚠a37 | BRD BR-26, PRD SEO-6 | |
| Newsletter subscriber CSV export (audit-logged); content dashboard | IZ-09, RP-04/06 | |
| New SKU checklist: product + deep record + photos + brand-count check; price and stock never shown | F4 L28 | |
| CMS API: GET/PUT on content blocks, `hero_slides`, `legal_policies`; staff-only; each PUT publishes and purges cache ⚠a35 | B5 L47 | |

**Not specified anywhere (no testable requirement exists):**
- CMS-editable header menus / navigation (FRS-G-01 fixes the header structure but says nothing about editing it).
- Footer content editing.
- Per-page SEO title/meta/OG/robots fields. Only the SRS persona UG-11 mentions "SEO meta tags", and PRD §12.3 only says to preserve migrated titles/metas.
- Redirect manager.
- Media library and form builder (URD persona P8 L141 lists them as needs, but they are not URs).
- Page builder / layout editing.
- Versioning and rollback appear only in F4, not in the PRD or FRS.

---

## 3. Forms and workflows

### RFQ
Sources: PRD FR-4.4 L425; BR-07; FRS-R L212-227; field spec §23.1 L544-557; UR-09..14; UC-01; B5 L45-46.

| ID | Requirement | How to verify |
|---|---|---|
| R-01/02 (M) | Basket for anonymous and signed-in users; ≥50 line items; quantity 1–99,999 per item; optional note per line. Server-side for signed-in users; browser storage ≥14 days for anonymous; merged on login. | Add 50 lines; qty 0 and 100000 are rejected; log in and check the merge |
| R-03 (M) / §23.1 | Fields: name* (≤80 chars, Unicode, ≥2); company* (≤120); email* (≤120, RFC format, disposable domains blocked, read-only when signed in); phone* (≤20, ≥7 digits); WhatsApp (optional); preferred contact (default WhatsApp); items* (≥1); target date (tomorrow to +180 days); notes (≤1000); PDPL consent* (never pre-checked). Errors are bilingual `err.*` keys; entered data and basket are preserved on error. ⚠a32 | Submit invalid data in AR and EN |
| R-04 (M) | On submit: status SUBMITTED; reference `SIMAL-RFQ-nnnn` (sequential, unique) ⚠a7; confirmation screen with the ≤1-bd SLA; acknowledgement email E-05 | Two submissions get consecutive references |
| R-05 (M) | SLA due time uses the business-day calendar (Sun–Thu by default). RFQs not actioned within 1 bd are flagged in the queue and CRM, and E-07 goes to the sales manager. | Time-travel test |
| R-06 (M) | RFQ reaches the CRM within 60 s with lines, contact, source page/UTM, locale and reference | Check CRM timestamp |
| R-07 (M) / R-08 (S) | Pre-filled form for signed-in users; RFQ history (reference, date, item count, status, quoted total) with detail view and re-order | Partner login |
| R-09 (M) | After submitting: "Create your partner account to track quotes & orders", with the RFQ reference pre-linked | |
| R-10 (M) / CT-04 | 5 anonymous submissions per 10 min per IP; honeypot plus reCAPTCHA v3 (threshold default 0.5) on all forms ⚠a21 | 6th submission is blocked with a message |
| R-11 (S) / R-12 (M) | Staff statuses SUBMITTED → IN_PROGRESS → QUOTED → WON / LOST / EXPIRED, with quoted totals. Partners see status and totals but not internal notes. Every status change is logged (actor, time, old/new). ⚠a32 | Admin view and audit log |
| R-13 (S) | Confirmation page offers WhatsApp handoff with the reference and item summary | |
| R-14 (M) | GA4 event `rfq_submit {item_count, locale, is_authenticated}` | GA4 DebugView |
| R-16 (C) | "Email my basket" resume link valid 14 days | |
| B5 | `POST /api/rfq` returns 201 `{ref, validUntil:+7d}`. Errors (422): `rfq_items_empty`, `rfq_qty_range`, `rfq_email_invalid`. Honeypot field `website`. `GET /api/rfq/:ref?email=` | Contract tests |
| USAB-2 / UC-01 | Median ≤3 min on mobile; ≤1 validation error | Usability test |

### Contact
Sources: FRS-CT L303-310; §23.2; PRD FR-9.x; BRule-6 L397.

- **CT-01 (M):** Directory of the three entities: Simal Technologies Middle East LLC (office), StarSeed Technologies ME FZE (JAFZA warehouse), Stellent Technologies ME LLC (store). Phones, emails, embedded maps, and one hours schedule from a single CMS object ⚠a42.
- **CT-02 (M):** Fields:
  - represent-type (6 options): New Partner / Existing Partner / Customer / Vendor-OEM / Media / Job Seeker
  - interest area (7 options): distribution RFQ, IT services, software demo, specific brand, support, careers, other
  - message (≤2000)
  - consent
  - PRD also asks for geography.
- **CT-03 (M):** Routing per BRule-6: RFQ → sales; IT services → services sales; software → joint Simal+Unisoft pipeline; vendors → management; careers → HR; support → service desk. Unmatched → info@ plus an internal alert.
- **CT-05:** Inline errors in the active locale.
- **CT-06:** Call / mailto / WhatsApp links for each entity.
- **CT-07:** Each enquiry logged with routing decision, time, locale and spam verdict.
- **CT-08 (S):** "Open now" widget, default GST (UTC+4).
- Every form sends an auto-acknowledgement (BRule-6).
- **Verify:** submit each represent-type and interest combination; check the destination and the fallback alert.

### Consultation and demo requests
Sources: SO-02, SW-05/06/07/13; §23.3; BRD §8.3 L372.

- Fields: name*, company*, email*, phone*, service or product* (pre-filled from context), preferred slot (demo only; business days in the next 30 days), message (≤2000), consent*.
- Lead types: `it_services` → services sales; `software_demo` / `software_consult` → joint pipeline, separate from RFQs.
- GA4: `software_lead {form, service_line}` and `demo_request {product}`.
- Acknowledgement email E-17.
- SLA: first response ≤1 bd; proposal ≤5 bd after discovery.
- PRD FR-6.7 and SRS: calendar integration / calendar invites.

### Newsletter
Sources: IZ-08 (M), EM-05, IZ-09; BRule-11.

- Double opt-in: confirmation token valid 7 days.
- Topic preferences: distribution, software, events.
- Only double-opt-in subscribers are mailed.
- One-click unsubscribe honored within ≤24 h.
- Subscriber CSV export is audit-logged.
- GA4 `newsletter_signup`.
- **Verify:** subscribe; an expired token (8 days) fails; unsubscribe takes effect.

### Gated downloads
IZ-06 (S): email required; GA4 `gated_download {asset}`.

### Careers
Sources: FRS-J L288-295; §23.4.

- Only open roles are listed. With zero roles, show the speculative CTA "Send us your CV — we're always looking" (J-03, M).
- Fields (J-04): role (hidden or speculative), name*, email*, phone, CV* (PDF/DOC/DOCX, ≤5 MB, virus-scanned) ⚠a13, cover note (≤2000), consent*. Routed to HR.
- JobPosting JSON-LD with `validThrough` (S).
- Acknowledgement E-16 and GA4 `job_apply {role}`.
- Admin pipeline (S): New → Reviewed → Shortlisted → Rejected / Hired; CV access audit-logged.
- Speculative applications kept 12 months.
- UC-08: application takes ≤5 min.

### Accounts, login, MFA, password reset
Sources: FRS-A L318-334; PRD FR-10, NFR-4; A6 §5.

- **A-01 (M):** Self-registration → PENDING_VERIFICATION; verification token valid 48 h. ⚠a17: CRTM says public signup is not built.
- **A-02 (S):** Disposable email domains blocked.
- **A-03:** Verified accounts auto sign in; expired tokens offer a re-send.
- **A-04:** Passwords ≥10 characters, ≥3 of 4 character classes; hashed with bcrypt/argon2id; never logged or emailed ⚠a17/a18.
- **A-05:** 5 consecutive failures → 15-minute lock, plus E-04 email ⚠a20. TOTP MFA for every staff sign-in ⚠a16.
- **A-06:** Reset token single-use, valid 60 min, completion notified. A6 adds: sessions invalidated on password change.
- **A-07:** Staff idle timeout 30 min; partner session 12 h; session ID rotated on privilege change ⚠a19.
- **A-08:** One account for RFQ history, onboarding, own document vault and dashboard; no separate portal credentials.
- **A-09:** Migrated KYC users get state RESET_REQUIRED (plus MFA enrolment for staff).
- **A-10:** Roles: anonymous, applicant, partner, partner_admin, staff_reviewer, staff_admin, content_editor, hr_group ⚠a36.
- **A-11 (S):** partner_admin can invite ≤5 colleagues.
- **A-12 (S):** Email change requires re-verification (A6 adds a staff notification).
- **A-13 (M):** Sign-in, registration and reset fully RTL/AR.
- **A-14 (M):** Notification bell showing the last 30 items.
- **A-15/16:** Data-subject requests: export as JSON or anonymize, subject to legal retention locks. Intake via the privacy@ alias (BRD L384).
- **A-17:** Data stays in the primary region; cross-region access (including Unisoft) is role-restricted and purpose-logged.

### KYC onboarding
Sources: FRS-K L344-370; PRD §9 L501-597; field spec §23.5; state machine §22.1; UR-15..23; UC-02/03/06/09.

**Entry and tracks**
- **K-01:** Onboarding lives at `/partners/onboarding`.
- **K-02:** Two tracks ⚠a10: Customer ("receives invoices from Simal") and Vendor/Supplier ("issues invoices to Simal").
- **K-25:** `?track=customer|vendor` pre-selects the track; every CTA passes it.

**Wizard**
- **K-03:** 7 steps ⚠a9, with a progress indicator and per-step save: Company; Licence; Tax & Peppol; Signatory & contacts; Banking; Documents; Review & declaration.
- **K-04:** Autosave ≤2 s after a change; restore in the same browser (anonymous) or on any device (signed in) ⚠a12.
- **K-05 (S):** Drafts kept 90 days, with a reminder at T-14.

**Validation and key fields**
- **K-06/07:** TRN is exactly 15 digits; spaces stripped; leading zeros kept. Example `100123456700003` ⚠a43.
- **K-08:** Peppol ID auto-suggested as `0235:` + TRN; validated as `0235:` + 15 digits.
- §23.5 field rules:
  - Legal name ≤200
  - Licence number ≤30
  - Issuing authority ≤120
  - Issue date ≤ today; expiry > today
  - Address ≤300
  - IBAN: AE format, 23 characters
  - SWIFT ≤11 (optional)
  - Currency AED/USD/EUR
  - Documents: trade licence* and signatory ID* (Emirates ID or passport)

**Submission and review loop**
- **K-09:** On submit: immutable snapshot, E-08 email, enters the queue, 2-bd SLA starts.
- **K-10:** INFO_REQUIRED reopens only the flagged fields; everything else stays locked.
- **K-11:** Status page shows timestamped history, applicant-visible notes and an SLA countdown.

**After approval**
- **K-12:** Approval grants partner roles and a Partner Home dashboard.
- **K-13:** Expiry reminders at T-30 / T-7 / T-0. Status EXPIRING from T-30, EXPIRED from T+1.
- **K-14 (C):** Invite a colleague to one step; invite valid ≤7 days.
- **K-15 (S):** Full Arabic version ⚠a29.

**Consent, data and migration**
- **K-16:** Consent box is never pre-checked; consent timestamp and privacy-notice version are stored.
- **K-18:** Migration import produces a reconciliation report (counts and checksums) that Accounts signs.
- **K-19:** Nightly TRN/Peppol format check.

**Other**
- **K-21 (C):** Partner tiers (Registered / Authorized / Preferred) shown only in the partner's own dashboard.
- **K-22:** GA4 `kyc_started`, `kyc_step_complete {step}`, `kyc_submit`, `kyc_status_view`.
- **K-23 (S):** Staff can generate a resume link valid 7 days.
- **K-24:** Business-day calendar comes from the CMS (Sun–Thu default).
- **K-26:** The 13-item feature-parity checklist (PRD §9.10, L585-597) is a mandatory SG-3 gate. It includes: tracks, about 10-minute autosaving forms, fix-only-flagged resubmission, encrypted upload with virus scan, status with timestamps, resume, expiry reminders, TRN/Peppol capture, review with notes, 2-bd SLA, PDPL notice and consent and audit log, FAQ plus support contact (accounts@simalme.com, +971 4 393 0507), and old deep links still resolving.
- **K-27:** "My Onboarding" dashboard card.

**State machine** (⚠a11): DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED, or INFO_REQUIRED → resubmit → SUBMITTED (SLA restarts), or REJECTED (terminal; data kept 12 months). WITHDRAWN is also terminal.

**A6 additions:**
- Illegal state transitions return 409.
- Draft tokens are 48 hex characters.
- Uploads are validated by magic bytes.
- Watchlist screening matches exact and normalized names.
- PII is masked by default; unmasking is gated.
- Every state change is audited.

**Usability targets:**
- About 10 min active time, ≤10 min (USAB-3) ⚠a39.
- Re-orient after resuming in ≤30 s.
- Annual re-validation in ≤5 min (UC-06).
- An old emailed link lands on the saved step (UC-09).

### Document vault
Sources: FRS-DV L378-387.

- **DV-01:** PDF/JPG/PNG only; ≤10 MB per file ⚠a13; ≤15 files per application; MIME and extension must match; double extensions rejected.
- **DV-02:** AES-256 at rest, stored outside the webroot, served via signed URLs valid ≤15 min.
- **DV-03:** Virus scan before a file counts as uploaded; infected files quarantined with an admin alert.
- **DV-04:** Access limited to the owner, the assigned reviewer, staff_admin, and hr_group (CVs only). Everyone else gets 403.
- **DV-05:** Immutable audit of every document action (actor, action, document, time, IP), kept ≥5 years, CSV-exportable.
- **DV-06 (S):** Version history.
- **DV-09:** Documents of unsuccessful applicants purged at 12 months; purges reported monthly ⚠a15.
- **DV-10:** No KYC document is ever sent by email.
- **Verify:** upload EICAR, `.pdf.exe` and an 11 MB file; try another user's document URL (expect 403); wait for a signed URL to expire.

### Staff review console
Sources: FRS-RC L395-408; PRD FR-K.23-27, FR-K.39-41.

- **RC-01:** `/admin/kyc` columns: reference, organization, track, state, submitted, SLA age (business hours), assignee. Default sort: SLA age, descending.
- **RC-02:** SLA tiers: under 1 bd normal, over 1 bd warning, over 1.5 bd breach-imminent. Breach alerts go to the reviewer and manager.
- **RC-03:** Side-by-side view. Per-field Approve or Flag; flags need a note of ≤500 characters, with an applicant-visible toggle.
- **RC-04:** Actions: request more info, approve, reject (reason required), assign.
- **RC-05 (S):** Assignment rules and internal notes.
- **RC-06:** Checklist: licence, TRN format plus registry match (manual), Peppol ID, signatory ID, bank details.
- **RC-07 (S):** Bulk actions allowed: assign, export, mark-checked. Never bulk approve or reject.
- **RC-08 (S):** Metrics: submissions per week, median and p90 review time vs SLA, approval rate, documents expiring in 30/60/90 days.
- **RC-09 (M):** TRN/Peppol data-quality report: coverage %, validity % (target ≥98%), weekly trend.
- **RC-10:** Staff user and role administration.
- **RC-13:** MFA, optional IP allow-list, rate limiting.
- **RC-14:** All admin actions audited with before/after values.
- **FR-K.39:** Measures submission → first review and submission → decision.
- **A6 roles:** Reviewer (start/approve/reject/hold); Viewer (read-only); Super admin (reopen, unmask PII, settings).
- **CRTM edge cases:** approving straight from SUBMITTED returns 409; REJECTED is terminal; IBAN is masked in CSV unless the user has `view_pii`.

### Notifications
Sources: FRS-EM L418-427; App A L681-702.

- Sent within ≤60 s; 3 retries with backoff; admin alert on failure.
- Templates E-01..E-18:
  - Account: `acct.verify` (48 h), `acct.welcome`, `acct.reset` (60 min), `acct.locked`
  - RFQ: `rfq.ack`, `rfq.new`, `rfq.sla`
  - KYC: `kyc.received` (2 bd), `kyc.review`, `kyc.info`, `kyc.approved`, `kyc.rejected`, `kyc.expiry30/7/0`, `kyc.migration` (7 days before cutover)
  - Other: `job.ack`, `sw.ack`
  - Also `kyc.draft` (T-14) and `news.confirm`.
- Sent in the recipient's locale, with an opposite-locale link and the PDPL contact.
- Plain-text alternative plus RTL HTML.
- Mirrored in the in-site notification center.
- Delivery events tracked; hard bounces suppressed.

### E-invoicing portal
Not in FRS or PRD Phase 1 ⚠a27. Sources: A6 §4 L32-41 and §8-9; B5 L13-36.

- Money stored as integer fils; VAT 5% per line, rounded half-up.
- Lifecycle: draft → submitted → validated → delivered or rejected → reopen. Illegal transitions return 409.
- Invoice number `SIM-INV-YYYY-NNNN`, issued by the server.
- Buyer TRN is 15 digits, with Peppol ID `0235:TRN`, and must match an approved KYC record.
- 7 checks in a fixed order: `totals_recomputed`, `trn_format_15_digit`, `trn_registered_peppol_prefix`, `buyer_kyc_approved`, `dates_ordered`, `lines_nonempty`, `currency_aed`.
- Tampered totals return 422 with corrected values.
- UBL 2.1 generated at delivery: invoiceTypeCode 388, customisationID `urn:simal:invoice:phase1:ae` ⚠a28.
- Cross-partner access returns 403.
- Temporary password emailed when KYC is approved ⚠a17.
- Reject reason must be ≥5 characters.
- KPIs: validation within ≤1 bd; partner login success ≥99%.
- Phase 1 non-goals: multi-currency, credit notes (type 381), direct ASP peering, inbound invoices, RFQ-to-invoice conversion.
- D3 edge cases: 1-fils VAT = 0; 3-decimal price → 422; qty 0 or 100001 → 422; 14-digit TRN → 422; due date before issue date → 422; double delivery → 409; anonymous → 401; 11th login attempt → 429; path traversal → 404.

### Reporting and moderation
- **RP-01..07:** KPI, KYC funnel, lead mix, content, routing and data-quality dashboards with date/locale filters. Role-gated; exports audit-logged.
- **RP-08 (M):** Every GA4 event is asserted in staging at SG-3.
- **AB-07:** Testimonial moderation queue.

---

## 4. Non-functional requirements

| Area | Requirement and exact numbers | Source | How to verify |
|---|---|---|---|
| Accessibility | WCAG 2.1 AA ⚠a23: keyboard navigation (with RTL focus order), contrast ≥4.5:1 (≥3:1 for large text), alt text, visible focus, errors not shown by color alone, reduced motion, AR screen-reader labels. Assistive-tech walkthroughs in EN and AR at SG-3, plus automated checks in CI. Brand colors: #0050A0 on white is 7.91:1; #E01020 is 4.92:1; #F0F000 must never be text on white (1.22:1). | PRD NFR-6 L610; URD ACC-1..6 L448-453 | axe; NVDA/VoiceOver in AR |
| Performance | LCP ≤2.5 s on 4G; TTI ≤3.5 s; Lighthouse mobile Performance ≥85; Lighthouse budgets in CI. Search suggestions ≤300 ms p95; facets ≤500 ms p95; visible feedback ≤1 s on any action. Portal API p95 <200 ms (reads), <400 ms (invoice validation) at 50 rps. ⚠a24 | PRD NFR-1 L605, §4.3, SEO-8; FRS-SR-02, C-03, ERR-1; A6 L57 | Lighthouse mobile on Home, category, PDP, wizard |
| Scalability | 10× current traffic; 5,000 SKUs; 1,000 concurrent wizard sessions | PRD NFR-10 L614 | Load test |
| Uptime | ≥99.9% monthly ⚠a25 | PRD NFR-2, §4.3; BRD BR-31 | Monitoring |
| Backup / DR | RPO ≤1 h, RTO ≤4 h; daily backups with a tested restore; runbook handover ⚠a26 | PRD NFR-2/11, §19.1 | Restore drill |
| Security | TLS 1.2+ ⚠a22. HSTS. CSP, nosniff and frame DENY on 100% of routes (checked in CI); CSP blocks inline scripts. OWASP Top 10 and ASVS L2. Secrets only in env/secret store. Dependency scanning; SAST/DAST; annual pen test. Pre-launch pen test of auth and KYC with criticals/highs fixed. MFA for staff. AES-256 at rest. Immutable audit logs kept ≥5 years. DPIA before launch. | PRD NFR-3/4/5; A6 L58; B5 L11; D3 L34; FRS-IG-10; BRD BR-23..25 | `curl -I` every route; pen-test report; secret scan |
| Rate limits | Forms: 5 per 10 min per IP. API: public 120/min/IP; login 10 per 5 min per account+IP with lockout; status endpoint 20/min; search 120/min. ⚠a20/a21 | FRS-R-10, CT-04; B5 L10, L42 | Burst scripts |
| Privacy / consent | PDPL consent must be free, specific, informed and unambiguous; never pre-checked; stored with timestamp and notice version. Cookie choice kept 12 months. Newsletter double opt-in. Privacy notices in AR and EN in plain language (about B1 level). | BRD BR-21, BRule-11; FRS-G-05, K-16; URD CNT-7 | |
| Retention | Unsuccessful/withdrawn applicants' PII purged at 12 months. Approved partners' documents kept per UAE commercial law (configurable). Audit logs ≥5 years. Speculative CVs 12 months. ⚠a15 | BRule-4 L395; FRS §26.4 | Purge job logs |
| SEO | Server-rendered HTML for all public pages. XML sitemaps (segmented, with lastmod), robots, canonicals. hreflang en/ar with x-default EN. JSON-LD: Organization, WebSite+SearchAction, Product (no price), BreadcrumbList, Article, JobPosting, FAQPage, LocalBusiness ×3. Google Business Profile links and consistent NAP. Full 301 map (≤1 hop), kyc.simalme.com redirects kept ≥24 months. Search Console verified. 404s and redirects monitored daily for 30 days. Target: ≥15 non-brand page-1 keywords in 6 months. | PRD NFR-9, SEO-1..8 L719-728, §12.3; FRS-G-07/12/13, C-07, IZ-03/04, J-05, K-20, IG-08 | Rich Results test; redirect crawl |
| Localization | EN and AR at launch with an `/ar/` URL prefix. Language switch keeps path, query and anchor. `dir=rtl` with mirrored navigation, breadcrumbs, pagination, progress bars and carousels. Images chosen per locale. EN-only pages show an "Arabic version in progress" badge and are never hidden. Western digits 0–9. Dates as DD MMM YYYY with Arabic month names. Amounts as `AED 1,234`. Bilingual error keys with native-speaker review. Arabic search normalization. Proper Arabic fonts. Transcreation, not machine translation. **Launch gate: full EN and AR journeys, including the onboarding wizard.** ⚠a29 | FRS-LN-01..07, SR-04; URD RTL-1..6 L433-438; BRule-9; PRD D-4, §19.1 L792; F4 L18 | Run every core task in `/ar/` |
| Analytics | GA4 events: `rfq_submit`, `kyc_started`, `kyc_step_complete`, `kyc_submit`, `kyc_status_view`, `software_lead`, `demo_request`, `whatsapp_click` (with page context), `become_partner_click`, `job_apply`, `newsletter_signup`, `gated_download`, plus `content_published`. All consent-gated. GTM and Search Console. Executive, KYC-funnel and content dashboards. | PRD §15 L734, INT-4; FRS-IG-05, RP-08 | GA4 DebugView |
| Usability | Task success ≥90% per task (≥80% overall in round 1, against an industry average of about 78%). SUS ≥80 (floor 68; console ≥75). First-click success ≥70%. Trust rating ≥4/5. Zero Sev-1 issues at launch. Wizard ≤7 steps. Everything works at 360px. | URD USAB-1..12 L416-427, §13 | Usability rounds R1–R3 |
| Observability | Uptime monitoring, Sentry-class error tracking, alerting. 100% of requests carry a request-id. Outbound integration calls logged without PII. | PRD NFR-13; A6 L61; FRS-IG-11 | |
| Errors | Inline errors plus a summary, focus moves to the first error. Bilingual error pages with correlation ID `SDP-<yyyymmdd>-<rand6>`. Idempotent submissions. Never drop silently. ⚠a33 | FRS ERR-1..6 L601-606 | |

**Business KPIs (6 months after launch; BRD §5.2 L211-228, PRD §4.3):**
- Organic sessions +100%; ≥15 non-brand keywords in the top 10.
- ≥50 RFQs/month; RFQ → sales-qualified lead ≥20%.
- ≥30 partner onboarding submissions/month; onboarding completion ≥60%; review SLA compliance ≥95%.
- TRN/Peppol data validity ≥98% before 1 Jan 2027.
- ≥10 software consultations/month; ≥8 IT-services consultations/month; consultation → qualified ≥30%.
- ≥10 careers applications/month; manual lead handling −40%.
- Arabic session share ≥15%; bounce rate <45%; session duration >2:00.

---

## 5. Integrations

| Integration | Phase 1 requirement | Source | How to verify |
|---|---|---|---|
| Email / SMTP | Provider API with server-rendered templates stored in the platform. Sent ≤60 s; 3 retries then alert. Bounce/complaint tracking. SRS names Resend or AWS SES, TLS 1.3, SPF/DKIM/DMARC. | FRS-EM-01, IG-04, EM-10; PRD INT-3; SRS L604 | DNS records; outbox |
| WhatsApp | Deep links only (`wa.me/<number>?text=`, UTF-8) carrying page context or RFQ reference. No messaging API until Phase 2. ⚠a31 (SMS) | FRS-IG-01, G-04; PRD INT-1 | Inspect hrefs |
| CRM | HubSpot, Zoho or other, to be chosen before build. Lead types: `rfq`, `it_services`, `software_demo`, `software_consult`, `career`, `enquiry`, with locale, references and UTM. 3 retries, then alert and queue. CRM is the routing system of record. RFQs arrive within 60 s. | FRS-IG-02/03, R-06; PRD INT-2; BRD BR-09 | Submit each form type and find it in the CRM |
| Analytics | GA4, Google Tag Manager, Search Console; sitemap ping | FRS-IG-05/08 | |
| reCAPTCHA v3 + honeypot | All public forms; threshold default 0.5; a failed score shows a bilingual retry message | FRS-IG-06 | Low-score test |
| Virus scan | Async API with a verdict in ≤60 s p95. SRS names ClamAV on TCP 3310. | FRS-IG-07; SRS §4.3 | Upload EICAR |
| ERP | Not in Phase 1 beyond lead routing. ERP/stock APIs are Phase-2 hooks behind a feature flag that is off by default. ⚠a30 | PRD §6.3 L285, INT-8; FRS-IG-09 L443 | Check the flag default |
| Peppol / ASP | Phase 1: capture and validate TRN and Peppol ID; data model ready; platform is the single source of truth (≥98% valid) before 1 Jan 2027. Participant lookup and document exchange are Phase-2 hooks, off by default. ⚠a27/a28 | PRD FR-K.28/29, INT-6; FRS-IG-09; BRD BR-18 | |
| ATS | Phase 2, behind a feature flag | INT-7 | |
| Brand → SKU JSON feed | Internal feed for the homepage carousels (C). A6 also has a token-protected master-data feed. | FRS-IG-12; A6 L26 | |

---

## (a) Contradictions

| # | Topic | Conflict (doc and line) |
|---|---|---|
| a1 | CMS / stack | PRD L686 recommends a headless CMS (e.g., Strapi/Directus/Payload) + Next.js, with the "decision required at kickoff". BRD L441 budgets for headless CMS + Next.js. SRS L191-205 mandates Next.js 15 + FastAPI/Python 3.13 and names no CMS. B5/F4/CRTM describe a custom in-house CMS (`/api/cms/*`, `cms.service.js`, `cms_revisions`). |
| a2 | Brand count | BRD L68, PRD L84 and App D L851 list 23 brands. BR-04 and FRS-C-09 say "20+/≥20". PRD sitemap L315-317 lists 22 (no Hiksemi). SRS L61 names 13. The build seeds 20 brands; the prototype asserted "≥18" (CRTM L39, L82). |
| a3 | SKU count | 76 SKUs per BRD, PRD, FRS-C-01 and SRS. But the category split 35+30+6+9+3 adds to 83 (74 if the 9 Gaming SKUs overlap), not 76 (FRS L189, PRD L118). The build has 81 products and an "81-photo standard"; REC-C1 is still open (CRTM L38, L139; F4 L28; D3 L14). |
| a4 | Software page counts | BR-12, FR-6.3, C-5 and FRS-SW-03 require 15 product pages and 8 industries. The build has 20 products, 9 industries, 7 modules, 20 solutions and 36 sub-services (CRTM L41-50; D3 L17). |
| a5 | Hero slides | Max 4 (FRS-HP-01, FR-2.1); 5 seeded (CRTM L87). |
| a6 | Mega-menu size | ≤7 items (FRS-G-01, PRD §7.1) vs "7–8 items" (PRD L178). |
| a7 | RFQ reference format | `SIMAL-RFQ-nnnn` (PRD L425, FRS-R-04, FRS L616, URD UC-01) vs `RFQ-YYYYMMDD-XXXX` (SRS L624, L659) vs `SIMAL-RFQ-YYYYMMDD-NNNN` (B5 L45, A6 L70). CRTM L55 maps "RFQ reference" to `SIM-KYC-YYYY-NNNNN`. |
| a8 | KYC reference format | `SIMAL-KYC-` + digits (FRS L617) vs `SIM-KYC-YYYY-NNNNN` (CRTM L55) vs `KYC-` (prototype). |
| a9 | Wizard steps | 7 (FRS-K-03; URD UC-02 "step 4/7"; USAB-9) vs 5 (SRS L292, L640, L682). |
| a10 | KYC tracks | 2 (FRS-K-02, FR-K.6) vs 3 (SRS L237: CUSTOMER_CREDIT, CUSTOMER_CASH, VENDOR_SUPPLIER, plus credit-limit fields). |
| a11 | KYC states | FRS §22.1 has INFO_REQUIRED and WITHDRAWN. A6 L26 has query_raised⇄partner_updated, on_hold and reopen. SRS L238 adds EXPIRED and drops WITHDRAWN. After resubmission the SLA "restarts" (FRS L520) vs "resets to 1 bd" (SRS L688). |
| a12 | Autosave | ≤2 s debounced (FRS-K-04) vs localStorage every 5 s and server every 30 s (SRS L785). |
| a13 | Upload size | KYC documents ≤10 MB (FRS-DV-01, CRTM L77) vs ≤15 MB (SRS L328). CVs: PDF/DOC/DOCX ≤5 MB (FRS-J-04) vs PDF/DOCX ≤10 MB (SRS L634). |
| a14 | Legacy redirect target | `/partners/onboarding` (FR-K.36, FRS-K-01) vs `/portal/onboarding/resume?token=` (SRS L126). |
| a15 | Retention vs WORM | 12-month purge of unsuccessful applicants and PDPL erasure (BRule-4, FRS-DV-09) vs SRS L336/L601: every KYC document locked for 5 years under S3 Object Lock compliance mode, which makes it impossible to delete. |
| a16 | Staff MFA | Mandatory for all staff (FRS-A-05, RC-13, NFR-4, BR-25) vs A6 L19-21: TOTP optional for Reviewers, password-only for Viewers. |
| a17 | Account model and temp passwords | FRS-A-04 says passwords are never emailed; A6 L18/L40 emails a temporary password at KYC approval. FRS-A-01/A-08 want self-registration and one account before onboarding; A6 creates the account only on approval. CRTM GAP-A1: signup form not built. |
| a18 | Password hashing | bcrypt/argon2id (FRS-A-04, NFR-4) vs Argon2id with fixed parameters (SRS L810). |
| a19 | Session timeouts | Staff 30 min idle, partner 12 h (FRS-A-07, NFR-4) vs 20 min idle for everyone with a 12 h absolute limit (A6 L50, B5 L9). |
| a20 | Login lockout | 5 failures → 15-min lock (FRS-A-05) vs 10 per 5 min, 429 on the 11th (B5 L10, D3 L34) vs 5 requests/min (SRS L815). |
| a21 | Rate limits | Forms 5 per 10 min (FRS) vs API 120/min (B5) vs 100/min general and 5/min for RFQ (SRS). |
| a22 | TLS | TLS 1.2+ (NFR-3, FRS L81) vs TLS 1.3 mandatory (SRS L811). |
| a23 | WCAG version | 2.1 AA (NFR-6, URD, FRS) vs 2.2 AA, also "AA/AAA" (SRS L123, L788). |
| a24 | Performance | LCP ≤2.5 s / TTI ≤3.5 s / Lighthouse ≥85 (PRD) vs LCP ≤1.2 s, INP ≤50 ms (and "sub-100ms" at L123), CLS ≤0.05, TTFB ≤150 ms (and "sub-100ms" at L196) (SRS). Concurrency: 1,000 wizard sessions (PRD) vs ≥5,000 sessions (SRS) vs 50 rps (A6). |
| a25 | Uptime | 99.9% (BR-31, NFR-2) vs 99.95% (SRS L7, L821) vs portal 99.5% / static 99.9% (A6 L56). |
| a26 | RPO / RTO | ≤1 h / ≤4 h (PRD) vs ≤15 min / ≤60 min (SRS) vs ≤24 h (+WAL ≤5 min) / 4 h site, 8 h portal (A6). |
| a27 | E-invoicing phase | Peppol exchange is Phase 2, feature-flagged off, with "no Phase-1 behavior" (BRD L448, PRD L752, FR-K.29, FRS L80, FRS-IG-09). A6 and B5 say issue/validate/deliver/UBL was "shipped 5 Oct 2026" as Phase 1, and CRTM shows an ASP sandbox. The FRS has no e-invoicing module, yet D3 L25 labels FRS-EM (which is Email) as "e-invoicing". |
| a28 | UBL / PINT AE | BRD L136 says the UAE uses the PINT AE specification. B5 L36 uses a proprietary customisationID `urn:simal:invoice:phase1:ae`. |
| a29 | Arabic scope | BRule-9 includes the onboarding wizard; the PRD §19.1 launch gate requires full EN+AR journeys including the wizard; FRS-A-13 (M). A6 L62 says portal Phase 1 is EN only, with AR in Phase 1.1. CRTM GAP-LN1: AR rendering pending (Phase 8). |
| a30 | ERP | Phase 2 (PRD L285, FRS-IG-09) vs SRS L648/L700: a Phase-1 HMAC webhook to the ERP on KYC approval that provisions a credit limit. |
| a31 | SMS | SRS L636 includes SMS alerts; no other doc mentions SMS. |
| a32 | RFQ payload and states | FRS §23.1 has 10 fields with WhatsApp as default contact. B5 L45 accepts only `{items, email}`. SRS defaults to EMAIL. States: IN_PROGRESS/QUOTED/WON/LOST/EXPIRED (FRS) vs ACKNOWLEDGED/ASSIGNED/QUOTED/ACCEPTED/REVISED/EXPIRED/CLOSED with 14-day quote validity, assignment within 2 h and escalation at 20 h (SRS L653-675) vs `validUntil` +7 days (B5). |
| a33 | API conventions | B5: unversioned `/api/*` with an `Accept-Version` header, `{error, details[]}` errors and a request-id. SRS: `/api/v1/*` paths and RFC 7807 errors. FRS: correlation ID `SDP-…`. B5's honeypot does a "silent drop", while FRS-IG-06/ERR-5 say "never silently drop". |
| a34 | Search scope | FRS-SR-01 indexes 10 entity types. B5 L42 `/api/search` returns only product, insight, solution and page. |
| a35 | CMS scope and workflow | FRS-RC-11 and F4 require 9+ content types, a draft/review/scheduled workflow and 10-revision rollback. The B5 CMS API covers only content blocks, `hero_slides` and `legal_policies`, and "every PUT publishes" (no draft or scheduling). |
| a36 | Roles | FRS (8 roles including partner_admin and hr_group) vs SRS L236 (7 enum roles including SALES_REP, no hr_group) vs A6 (Reviewer/Viewer/Super admin) vs F4 (Contributor/Editor/Publisher/Compliance Reviewer) vs B5/CRTM permissions (`decide`, `notes`, `view_pii`). |
| a37 | Content cadence | 3 posts/month: 2 distribution + 1 software (BR-26, SEO-6) vs 2 posts/month (F4 L24). |
| a38 | PDP CTA | PRD FR-4.3 L424 keeps a "Call for price" badge. FRS-C-11, URD UR-06 and CNT-5 replace it with "Check availability & price". |
| a39 | Onboarding time | ≤15 min (PRD KPI L224) vs about 10 min / ≤10 min (FR-K.7, USAB-3). |
| a40 | Brand palette | Logo colors #0050A0 / #E01020 / #F0F000 (PRD D-2 L626, URD ACC-3) vs a dark slate theme with #2563EB, #06B6D4 and #F59E0B (SRS L741-768). |
| a41 | Corporate independence | Every change record says "group" and "sister concern" wording was removed. It is still present in: PRD L52 and L102 ("sister concern"); PRD L114 and FR-6.1 L445 ("group software house"); PRD L179 ("4 group entities"); PRD L203 ("Simal group"); PRD C-3 L660; BRD L173; URD L282 and L342, UR-38, FRS-J-01 ("group opportunities"); SRS L19 ("Simal Group Corporate Board") and SRS L95 ("joint venture"). |
| a42 | Hours and founding year | Contact page says Mon–Fri 9:00–20:00, Sat 9:00–15:00; KYC portal says Sun–Thu (PRD L137, FR-9.1). Founded 2002 vs 2003 (PRD L67). The docs acknowledge both as open. |
| a43 | TRN rule | 15 digits (FRS-K-07) vs SRS L584/L885: must also start with "100" and is checked automatically against a cached FTA database. FRS-RC-06 says the registry match is manual. |
| a44 | Traceability integrity | SRS RTM L894-928 gives BR-01..33 different meanings from the BRD (e.g., BR-04, BR-14, BR-17, BR-33) and cites wrong PRD IDs, yet claims "100%, 0 orphaned" (L933-937). D3 L10-30 mislabels FRS modules (J, IZ, IG, EM, LN; and K as 41 requirements instead of 27). CRTM per-family counts add to 316, not 225. CRTM gives 197/225 at L95 and 216/225 at L147; parity 32/32 at L25 and 50/50 at L146. CRTM's "141 tests" doesn't match its listed suites (126, or 133 with the RFQ suite); the doc is dated 3 Oct but reports runs from 6 Oct. FRS §28 module counts add to 219 (actual rows: 225); stray row at FRS L205. |
| a45 | Version drift | Header vs footer: BRD v1.4 vs "v1.3" (L602); PRD v1.5 vs v1.4 (L868); URD v1.3 vs v1.2 (L596); FRS v1.3 vs v1.2 (L720); SRS v1.1 vs "v1.0.0" (L51). Cross-references cite stale versions. BRD L50 says "BR-01…BR-32", but 33 exist. |

---

## (b) Claims that something has already happened (today is 2026-10-12)

**None of the 10 in-scope docs claims that go-live, hypercare or live Peppol exchange has happened.** These are the completion claims they do make:

| Doc and lines | Claim | Date | Flag |
|---|---|---|---|
| SRS L13-19, L939-948 | Sign-off matrix: four "[SIGNED & COMMITTED]" and one "[FINAL SANCTION GRANTED]" by a "Group Managing Director, Simal Group Corporate Board". A quality gate called "Claude Fable 5.1 Standard" has every box checked. | 2026-10-03 | The BRD, PRD, URD and FRS of the same date are all "Draft — for review & sign-off" with blank signature tables (BRD L509-515). The signatories are role titles, not names, and the signing "Group" is one the SRS's own L21 disowns. Treat as unverified. |
| A6 L4, L28, L50; B5 L4, L13, L59 | E-invoicing module "shipped 5 Oct 2026"; "as built — no deviation"; API "mirrors shipped routes 1:1" | 5 Oct 2026 | Date is plausible, but conflicts with Phase-2 scoping (a27) |
| D3 L10-30, L55 | "Verified today": prototype 54/54; 1,801 links with 0 broken; 81/81 pages; portal 39/39; e-invoicing e2e 16/16 | 5 Oct 2026 | Prototype-level evidence |
| CRTM L4-5, L24-25, L133, L146 | 141/141 tests pass; "GAP-R1 CLOSED — full RFQ engine shipped"; ASP sandbox round-trip passed; 216/225 requirements evidenced | Doc dated 3 Oct; runs dated 6 Oct 2026 | Arithmetic and date inconsistencies (a44) |
| BRD L46 | UAE e-invoicing voluntary phase has been live since 1 Jul 2026 | 1 Jul 2026 | Regulatory fact, not a project event |

**Dates after today in the in-scope docs, all stated as future:**
- 30 Oct 2026: deadline for businesses ≥AED 50M to appoint an ASP (BRD L46, L141).
- 20 Nov: gate for ASP production credentials (CRTM L140).
- "Q4 2026": SRS target release (L7) and BO-5 horizon (BRD L202).
- 1 Jan 2027: mandatory Phase 1; Jan–Oct 2027 phased rollout.
- The 30-day hypercare (BRD L502) is a plan.

**Outside the 10 docs** (I only scanned the headlines of these). There are forward-dated go-live, hypercare and Peppol documents in `Project_doc/`:

| Doc | Date | Status per its text |
|---|---|---|
| `05_Deployment_DevOps/GoLive_Declaration_Signoff.md` | Go-live window Fri 4 Dec 2026, 22:00–02:00 GST | "TEMPLATE… nothing is pre-signed". L27 "LIVE in production as of ____ GST" is blank. |
| `05_Deployment_DevOps/GoNoGo_Decision_Record.md` | Wed 2 Dec 2026 | Human gates PENDING (Peppol production credentials, DPIA); "explicitly not a GO" |
| `00_Executive/Post_Launch_72h_Review.md` | Review window 4–7 Dec 2026 "post go-live" | Generated 2026-10-06; numbers are a pre-go-live baseline; sign-off PENDING |
| `06_Operations/Hypercare_Roster_Dec2026.md` | Go-live 4 Dec 2026 02:00 GST; exit by 1 Jan 2027 | Staff names blank |
| `06_Operations/Daily_Hypercare_Log.md` | One baseline row dated 2026-10-06 | Says "rig proven on the live environment", before any go-live |
| `06_Operations/Hypercare_Exit_Signoff.md` | Outer bound 1 Jan 2027 | Exit criteria 2–3 already marked "MET" on 6 Oct 2026, before go-live; sign-off PENDING |
| `03_Compliance/Peppol_Live_Exchange_Evidence_20261224.md` | Filename dated 24 Dec 2026, after today | Content says "Target". Only a sandbox run is proven (21/21 on 6 Oct 2026); no live counterparties. |
| `Production_Smoke_Test_Report.md`, `Cutover_Rehearsal_2_Report.md` | 6 Oct 2026 | 15/15 and 33/33 on a local rig, not the live URL |
| `07_Project_Management/Freeze_Manifest_v1.0.0.md` | Release candidates rc1 to rc11 all sealed 6 Oct 2026 | |

As of 2026-10-12, any of these cited as proof that go-live, hypercare or live Peppol exchange happened would be false.

---

## (c) Tech stack and CMS the requirement docs actually specify

- **No requirement doc mandates a specific CMS product.**
  - Microsoft Dynamics 365, Sanity and Contentful are not mentioned in any of the 10 docs.
  - Strapi, Directus and Payload appear only as "e.g." examples in PRD §13.1 Option A (L686).
- **PRD §13.1 (L682-690)** leaves the platform as a "decision required at kickoff".
  - Option A (recommended): headless CMS + Next.js + custom KYC/account modules + PostgreSQL.
  - Option B: Sitecore or Optimizely DXP.
  - Option C: headless WordPress + Next.js.
  - KYC, account and console modules must be custom-built "regardless of CMS".
  - §13.2: dev → staging → prod; CI/CD; IaC preferred; UAE/KSA cloud region or EU with a regional CDN; managed PostgreSQL; encrypted object storage; CDN.
  - Also: Sentry-class monitoring (NFR-13) and a Storybook-style component library (D-8).
- **BRD L441** budgets for "Headless CMS + Next.js per PRD §13.1-A". The CRM is HubSpot, Zoho or other, to be chosen by build start (BRD L420, PRD INT-2, FRS L86).
- **FRS and URD** are implementation-free. The FRS names only reCAPTCHA v3, GA4, bcrypt/argon2id, TOTP, AES-256 storage and `wa.me`.
- **SRS §2.2 (L191-205)** dictates a full stack but still no CMS:
  - Front end: Next.js 15.2 + React 19, Tailwind 3.4, ag-Grid Enterprise 32.
  - Back end: FastAPI 0.115 on Python 3.13, Node 24.
  - Data and infra: PostgreSQL 16.4 with pg_trgm, Redis 7.4, AWS S3 with KMS and Object Lock, ClamAV 1.4, Docker Compose.
  - Edge and services: Cloudflare Enterprise, Resend/SES, AWS eu-central-1 → me-central-1 failover.
  - Auth: Argon2id + PyJWT.
- **The project docs (A6/B5/F4/D3/CRTM)** describe an in-house build:
  - Node portal (`einvoice.service.js`, `cms.service.js`, session cookie `kyc_sid`).
  - PostgreSQL with pg_trgm.
  - A custom CMS: `/api/cms/*`, `cms_revisions` table, keeps the last 10 revisions.
  - A static-generated site of 109 pages.
- **As-built evidence (outside the 10 docs):**
  - The ADR file (B3) records: ADR-1 Node.js 22 for every tier; ADR-2 Astro 5.x (Next.js 15 was evaluated and rejected; "formalized per forensic audit finding F-06", 5 Oct 2026); ADR-4 scrypt with optional TOTP; ADR-8 translations stored as `cms_override(lang)` rows.
  - `Codebase/apps/site/package.json` declares `astro ^5.0.0` and `pg`, with no CMS package and no Next.js.
- **Net result.** The as-built stack is Astro static generation, Node, and a custom PostgreSQL-backed CMS. That departs from the Next.js + headless CMS that the PRD recommends and the BRD budgets for. It is only acceptable if that kickoff decision was formally ratified. It contradicts the SRS (Next.js 15 + FastAPI/Python) outright, and ADR-4's scrypt matches neither the FRS (bcrypt/argon2id) nor the SRS (Argon2id).
