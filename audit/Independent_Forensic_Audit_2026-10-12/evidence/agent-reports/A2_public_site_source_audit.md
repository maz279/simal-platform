# Forensic audit: Simal public site (`Codebase/apps/site/src`) vs the claim "100% (25/25) of public website components are fully dynamic, connected to PostgreSQL, and directly editable via the CMS"

## 0. Verdict and method

**Verdict: CONTRADICTED.** Ruling on the 25 rows in `Audit/COMPONENT_CONNECTIVITY_MATRIX.md` (the claim register): **5 Confirmed, 14 Partially true, 6 Contradicted** (table in §1).

The 25-row denominator also leaves out the largest body of content on the site. The global chrome in `BaseLayout.astro` is on 217 of 218 built pages: utility bar, 8 mega menus, newsletter strip, footer, trust badges and legal bar. It is almost entirely hardcoded.

"Dynamic" here means build-time only. Pages are SSG. A CMS edit goes live only after a publish, then a full `npm run build` run by the portal's poll loop (`apps/portal/src/server.js:118-155`), and nothing in the repo deploys `dist/` to the CDN.

**Method (read-only; no files modified, no servers started):**
- Read in full: all 29 files in `src/pages/**` and `src/layouts/`, plus `src/lib/db.ts` and `astro.config.mjs`.
- Corroborated against:
  - the build output `apps/site/dist` (built 2026-10-12 10:35; 218 HTML pages; 189-URL `sitemap.xml`)
  - `scripts/migrate.sql` and `scripts/seed.sql`
  - portal source: `routes.js`, `rfq.service.js`, `cms.service.js`, `server.js`
  - `infra/nginx/portal-staging.conf`
  - `Codebase/site_8100.log`
- Short Python one-liners were used only to parse local files.

**Credit (what genuinely works):**
- Build-time PostgreSQL wiring is real for:
  - the product catalog and PDP basics, brand detail pages, the footer brand strip, the top-11 brand mega menu, and SKU counts
  - hero-slide text, testimonials, the 14 insights, the 7 legal detail pages, the 68 software detail pages and the 12 IT-solution pages
  - AMC tiers, ERP pricing, implementation phases, case studies, offices, and mission/vision/values/leadership
  - `sitemap.xml`
- Queries are parameterised (`db.ts:17-25`).
- No query is wrapped in try/catch, so a DB outage fails the build. Nothing silently ships empty.
- The RFQ page and contact form check `r.ok`, show server errors and use `<label for>`.
- Every `<img>` has alt text. There is no positive tabindex. The carousel honours `prefers-reduced-motion`.

---

## 1. Ruling on the 25 claimed components

| # | Claimed component | Ruling | Decisive evidence |
|---|---|---|---|
| 1 | Hero carousel | **Partial** | Text fields come from `hero_slides` (index.astro:10). Badges, tab labels, accents and callouts ("23 Global Leaders", "24 Years", "14,500 MB/s") are a hardcoded `SLIDE_METADATA` array bound by array position (index.astro:24-60, 62-81). Backgrounds and glows are hardcoded by index (1251-1265); the `hero_slides.bg` column is ignored. The second CTA is hardcoded (1310). Reorder or add a slide in the CMS and the badges attach to the wrong slide. |
| 2 | Catalog | **Partial** | The grid comes from `products` (products/index.astro:10). The CMS can only PUT 9 columns on existing rows (`routes.js:629`, `cms.service.js:221-241`): no create/delete, no `imgs`/`specs`. Stock is saved as `String(patch.stock)` (cms.service.js:233), so "false" is truthy in the site and the page still says "In stock" (products/[slug].astro:85,109,149; products/index.astro:71; brands/[slug].astro:23; compare:21). Buying guides are hardcoded (products/index.astro:24-30); the `category_guides` table is never queried. |
| 3 | PDP deep specs | **Contradicted** (CMS part) | The portal has no write path for `product_deep` (no INSERT/UPDATE anywhere in `apps/portal/src`). The `box` and `docs` columns are never selected (products/[slug].astro:17). The Assurance, Warranty, In-the-box, Docs and Guide sections are hardcoded (44-50, 92-96, 148-150, 196, 216-219). |
| 4 | Featured strip | **Partial** | The query exists (index.astro:104) with fallback `DEFAULT_FEATURED_SLUGS` (90-103). `seed.sql` has no `site/featured-products` block, and the built strip order exactly equals the fallback list. |
| 5 | Brand Showcase "22 brands" | **Contradicted** | The showcase rows are a hardcoded 20-name array (index.astro:113-125) under a hardcoded heading "23" (359). No CMS write path exists for `brands`. The live DB has 22 brands (21 plus 'other'). |
| 6 | IT solution lines (12) | **Partial** | Detail content comes from `content_blocks it_solution` (solutions/[id].astro:11,17). The rails, hero card, delivery model, cross-nav and category chips are hardcoded (36-39, 54-57, 103, 118-131), as is the icon map (solutions/index.astro:12-16). |
| 7 | Flagship 5 practices | **Contradicted** | The template links to `/solutions/${s.targetId}/` (solutions/index.astro:66). The CMS payload (`seed.sql site/solutions5`) has `slug` but no `targetId`. The built dist renders **`/solutions/undefined/` ×5** (all five cards 404). The "remediation" broke the links. |
| 8 | AMC SLAs | **Partial** | The table comes from `site/amc-tiers` (solutions/index.astro:35; [id]:26). The matrix cites `solutions/amc/index.astro`, which **does not exist**. The note and CTA band are hardcoded (119-128), and the whole section silently disappears if the block is missing (104). A second block, `amc/tiers`, is seeded but unused. |
| 9 | Software modules (7) | **Contradicted** (hub) | `software_module` rows are fetched (software/index.astro:13, 20) but never rendered. The hub grid is the hardcoded `erpModules` (24-32, 119-128). The detail pages are DB-driven. |
| 10 | Software services (12) | **Confirmed** | software/index.astro:14, 147-156 and services/[slug]. Headings ("12 practices") are hardcoded (145). |
| 11 | Software industries (9) | **Confirmed** | software/index.astro:15, 136-138. "Nine verticals" is hardcoded (133); "All 9 verticals →" links to `#demo` (139). |
| 12 | Software products (20) | **Partial** | Detail pages come from the DB, but there is **no listing on the hub**. Only `distribution-erp` and `unipos` are linked (BaseLayout:187,190), plus 4 "related" cards. A product added in the CMS is effectively orphaned. |
| 13 | Pricing packages | **Confirmed** | `erp/pricing` is seeded (software/index.astro:16, 45). The "most chosen" badge position (i===1, 196), the §06-22 note (206) and the competitor price table (106-112) are hardcoded. |
| 14 | Implementation phases | **Confirmed** | `site/impl-phases` (software/index.astro:17, 46). The heading "7-phase" is hardcoded (208). |
| 15 | Legal policies | **Partial** | `/legal/[slug]` is DB-driven. The `/legal` hub is fully hardcoded (legal/index.astro:8-16; `db` is imported at line 6 and never used). All **7 hub links 404** (47). |
| 16 | Insights (14) | **Confirmed** (articles) | index.astro:136; insights/index.astro:9; [slug].astro:9,14. However, the digest-subscribe and line-card widgets on `/insights` are fake (§4.2), and the category anchors are broken. |
| 17 | Testimonials & Awards | **Partial** | Testimonials come from the DB (index.astro:128; about:11) with a hardcoded fallback quote (392-396). **Awards are hardcoded** in 3 places and disagree with each other (index.astro:400-401; about:102-104; BaseLayout:254). `testimonials.company` is never read. |
| 18 | Offices & hours | **Partial** | `site/offices` is used only on `/contact` (contact:9-10). Hours, phones, emails and addresses are hardcoded in the chrome and other pages (BaseLayout:102-104, 345-347; ar:46, 141-143; contact:36, 76-82; rfq:83). The report's claim that these are "single-sourced" is contradicted. |
| 19 | Announcement bar | **Partial** | The query works (BaseLayout:17), but `announcements.cta_label` is **not in `migrate.sql`** (lines 128-132) or either backup, so a fresh environment fails the build. `starts_at`/`ends_at` are ignored. Dismissal uses a global cookie, `simal_ann=1`, for 180 days (BaseLayout:412-414), so a *new* announcement stays hidden from anyone who dismissed an old one. |
| 20 | Careers desks (4) | **Contradicted** | The page reads `site/careers-roles` (careers:16), but the seed has `site/career-depts`. The built roles (UAE-001/002/004/007) equal the hardcoded fallback (9-14). The dropdown options are hardcoded (68-74), and the form shows success regardless of the API result (178-188). |
| 21 | Case studies (8) | **Partial** | `site/cases` (resources:21) has a fallback (9-18). The category is assigned by array index (28). "8 case studies" is hardcoded (46, 51). Every "Read case study" link goes to the generic `/contact/` (64). |
| 22 | RFQ engine | **Partial / environment-dependent** | Covered in §4.5:<br>• URLs are relative `/api/*`, and the only nginx vhost is `kyc.simalme.com`.<br>• The home widget shows a fabricated 125-item basket when the API fails or the basket is empty.<br>• `/ar` reads the wrong response key.<br>• The API rejects 3 catalog slugs that contain `_`. |
| 23 | Contact form | **Partial** | The form itself is correct (contact:98-105) but has the same proxy dependency. Other `/api/contact` users fake success (careers, software demo, KYC). The newsletter and line-card widgets on `/insights` never call any API. |
| 24 | Arabic localization | **Contradicted** | `/ar` queries 5 hardcoded English product slugs (ar:6-14). It never queries `content_blocks`, and no `lang` filter appears anywhere in `src`. All Arabic copy is hardcoded (ar:38-153). It is a single standalone page with its own hardcoded header and footer; every link goes to English pages. It reads `p.category_slug` (123), which is not a column in the schema. |
| 25 | SSG publish pipeline | **Partial** | The rebuild loop exists (server.js:118-155) but includes a hardcoded dev path (`'F:/software_project/...apps/site'`, ~line 136). There is no deploy-to-CDN step: nginx says "Site (SSG) assets are served by the CDN layer" (portal-staging.conf:3-4). |

Other report claims checked:
- **"All template-defined slug arrays … remediated" — Contradicted.** Slug arrays remain at index.astro:84, 90-103, 113-125; ar:6-12; compare:34-39; brands/index:8-13; BaseLayout:137, 161; software/index:24-32; solutions/[id]:121-122.
- **"Single h1, no skipped levels; skip-to-content links" — Contradicted.** See §7.

---

## 2. DB queries (item 1)

**Global facts**
- `db.ts:8` falls back to a hardcoded dev credential, `postgres://simal:[REDACTED-ROTATED-2026-10]@127.0.0.1:5433/simal`, if `DATABASE_URL` is unset. A build can silently use a local dev DB.
- There is no try/catch around any query, so a connection failure fails the build. That is good, but **row-level fallbacks silently mask missing CMS rows**:

| Fallback | Location |
|---|---|
| Featured products | index:90-106 |
| Slide metadata | index:63-69 |
| Testimonial | index:392-396 |
| Insight category/mins | index:147-148 |
| Mega-menu category counts (17/12/4/4/6/35/3) | BaseLayout:149-155 |
| CTA label | BaseLayout:93 |
| Leadership (fallback has **different people** than the DB: Musheer Ahmed, Syed Hassan Musheer, Hassan Musheer, Farooq Ahmed vs DB Mohammad Mazharul Islam, Mohammad Zahirul Islam, S. M. Mohibul Hasan) | about:22-27 |
| Mission/vision/values | about:28-35 |
| Roles | careers:9-18 |
| Cases | resources:9-33 |
| Pricing / phases | software/index:34-46 |
| Solutions5 | solutions/index:18-33 |
| Offices (`[]`, renders an empty directory) | contact:10 |
| AMC tiers (section omitted) | solutions/index:104; [id]:78 |

- `content_blocks` has `lang` and a UNIQUE (entity, entity_id, lang) constraint (migrate.sql:104-110). **No site query filters `lang`.** The CMS accepts a `lang` argument (cms.service.js:41). Adding one `ar` row would duplicate `getStaticPaths` params (a build error) and make `[row]` picks nondeterministic.
- Schema drift:
  - `announcements.cta_label` is used by BaseLayout:17 and cms.service.js:320-333 but is absent from migrate.sql:128-132.
  - `products.category_slug` (ar:123) does not exist (migrate.sql:90-94).
- Unused tables/columns: `category_guides` (seeded with empty `[]`); `product_deep.box`/`docs`; `hero_slides.bg`; `testimonials.company`; `announcements.starts_at`/`ends_at`.
- `brands.counts` is a cached JSON count (brands/index:56-57) that has drifted. Honeywell shows 13 there vs 12 live.
- Join inconsistency:
  - BaseLayout:30 uses `p.brand = b.slug` (exact).
  - brands/[slug]:16-17 uses `LOWER(brand)`.
  - products/[slug]:42 matches `lower(name)` against `p.brand`, which holds the brand slug.
  - Product `1672` has brand `"Crucial"` and cat `"SSD"`. It is excluded from mega-menu counts (they sum to 77, not 78) but counted on `/brands/crucial`, which shows 19 vs 18 in the menu.

**Query inventory** (table → columns → WHERE/ORDER → empty behaviour)

**BaseLayout**
- :14 `brands` slug,name → `slug!='other'` ORDER BY name
- :16 `products` count
- :17 `announcements` text,cta_href,cta_label → `active=true` ORDER BY id DESC LIMIT 1 → bar hidden if none
- :20 `products` cat,count → GROUP BY cat → fallbacks at :149-155
- :27-35 `brands⟕products` slug,name,count → `b.slug!='other'` GROUP BY … ORDER BY count DESC,name LIMIT 11

**index**
- :10 `hero_slides` idx,kick,headline,sub,cta_label,cta_href,photo_slug,motif → `active` ORDER BY idx
- :11 `products` count
- :12 `brands` count (includes 'other')
- :20 `products` slug,imgs → `slug=ANY(photo_slugs)`
- :85 `products` slug,imgs → `slug=ANY(duoSlugs)` (hardcoded at :84)
- :104 `content_blocks` payload → `site/featured-products`
- :108 `products` slug,name,brand,short,imgs → `slug=ANY(...)`; missing slugs silently dropped (:110)
- :128 `testimonials` name,role,quote → `active` ORDER BY id
- :136 `content_blocks` → `insight` ORDER BY `payload->>'at'` DESC LIMIT 3

**about**
- :9 `products` count (no `::int`)
- :10 `brands` count (includes 'other')
- :11 `testimonials`
- :14 `content_blocks site/<id>`, called 4× (leadership, mission, vision, values)

**ar**
- :14 `products *` → `slug=ANY(picks)` (hardcoded at :6-12)

**brands/[slug]**
- :6 `brands *` → `getStaticPaths` (includes 'other', which generates `/brands/other/`, "More lines")
- :14-19 `products *` → LOWER match on slug or name

**brands/index**
- :5 `brands *` (used only as a lookup map)
- :6 `products` count

**careers**
- :16 `content_blocks site/careers-roles`

**compare**
- :8-12 `products⟕product_deep` slug,name,brand,cat,cat_label,short,sku,imgs,stock,d.specs → ORDER BY name

**contact**
- :9 `content_blocks site/offices`

**insights**
- index:9 `content_blocks insight` ORDER BY at DESC
- [slug]:9 paths
- [slug]:14 all; redirects to `/insights` if missing (:22)

**legal**
- [slug]:7 `legal_policies` slug,lang (en filtered in JS)
- [slug]:14 → slug + `lang='en'`; redirects to `/legal`
- [slug]:17 TOC
- index: no query

**onboarding** — no query (no db import)

**products/index**
- :10 `products` slug,name,brand,cat,cat_label,short,sku,imgs,stock,is_new → ORDER BY brand,name

**products/[slug]**
- :11 paths
- :16 `products` 12 columns → `slug=$1`; redirects to `/products` if missing
- :17 `product_deep` hero,specs,feats,use_cases
- :28 same brand, LIMIT 4
- :31 same category
- :35 accessories, ORDER BY (brand=$) DESC
- :37 prev/next within category
- :42 `brands` line,note

**resources**
- :21 `site/cases`

**rfq**
- :10 `products` slug,name,brand

**search**
- :10 `products` slug,name,brand,cat,cat_label,short,sku,imgs

**sitemap.xml.js**
- :10-18 `products.slug`
- `content_blocks.entity_id` for it_solution, software_product, software_module, software_service, software_solution, software_industry, insight
- `legal_policies.slug` (en)

**sitemap/index**
- :15 `products` cat,count

**software/index**
- :13 software_module (**unused**)
- :14 software_service
- :15 software_industry
- :16 erp/pricing
- :17 site/impl-phases

**software detail pages**
- products / modules / services: `getStaticPaths` :7, row :12, all :15
- solutions: :7, :12, :18-20 (modules/services/solutions)
- industries: :7, :12, :17-18

**solutions**
- index:10 it_solution ORDER BY entity_id
- index:31 site/solutions5
- index:35 site/amc-tiers
- [id]:11 paths
- [id]:17 all
- [id]:26 amc-tiers

---

## 3. Hardcoded business content (item 2)

### BaseLayout.astro — on 217 of 218 pages

**Constants**
- :13 portal origin `https://kyc.simalme.com`
- :37-59 `BRAND_INFO`: 21 brand taglines (the brand list itself is from the DB)

**Announcement bar**
- :93 fallback CTA text "See the SKU & RFQ channel pricing →" and a different aria-label

**Utility bar**
- :102 phone +971 4 393 0507
- :103 info@simalme.com
- :104 "Sun–Thu 9:00–18:00 GST"
- :107 "KYC Portal — Sign in"
- :108 EN / العربية switch
- :110-112 LinkedIn, Instagram, WhatsApp (wa.me/97143930507)

**Main row**
- :119 logo
- :122 search placeholder (count from DB)
- :126 "▷ Sign in"
- :127 RFQ pill
- :128 "Become a Partner"

**Mega menus**
- Home :135-141 — "Popular right now"; Crucial P510 link (:137); "Quote within 1 business day" (:138); UniERP; reseller; site map
- Products :148-163
  - 7 category labels with hardcoded descriptions ("up to 12,400 MB/s", "up to 280 Hz", …)
  - DB counts with hardcoded fallbacks (:149-155)
  - Compare (:156)
  - P510 promo with image (:157-162)
  - "Every SKU genuine with local warranty" (:163)
- Brands :170-179 — list from DB; taglines from `BRAND_INFO`; "Brands overview" link
- Software :186-204 — all hardcoded
  - "Odoo 19 CE · $0 licensing · 7 modules"; "(7)", "(20)", "10 industry ERPs + 10 specialized", "(12)", "(9)"
  - "UniVAT — NBR-approved VAT" (NBR is Bangladesh's tax authority)
  - Demo promo "30 minutes"; "7-phase implementation"; "$0 per-user licensing, forever"
- IT Solutions :211-218 — "5 flagship practices"; 5 links; "All 12 service lines — Live from simalme.com"; "1h / 4h / NBD"
- Partners :225-230 — "Authorized · Premier · Elite"; "7 steps, ≈10 min, resumable"
- Insights :237-243 — "10-post calendar" (the DB has 14); "Case studies (8) · 3× revenue"; white papers; datasheets; FAQ; press
- About :250-259 — "Independent since 2002"; "HIKSEMi · TEAMGROUP 2025"; "12 live job codes"; "4 locations · routed desk"; "النسخة العربية — RTL demonstration"

**Strips and mobile nav**
- :263 hot strip "★ Genuine stock · JAFZA-fulfilled · since 2002"
- :267-278 mobile nav (10 links)

**Newsletter strip** :286-295 — heading "Stay ahead of the Middle East IT channel", body copy, placeholder, button

**Footer** :297-349
- :302 entity blurb "…since 2002 … Unisoft Systems Ltd"
- :303-308 socials (X/Twitter appears only in the footer)
- :311-320 product links; "All {n} SKUs" (count from DB)
- :323-332 "IT Solutions — 12 lines", "Software products (20)", "Engineering services (12)", "Industry solutions (9)"
- :335-341 company links
- :345-347 head-office address (Office 201, Dar Al Riffa Bldg, Khalid Bin Al Waleed Rd, PO Box 49740), warehouse "StarSeed ME FZE · JAFZA RA08DA07", hours and phone

**Trust badges** :356-360 — "Bur Dubai office · JAFZA warehouse"; "{n} global vendor partners" (DB); "UAE PDPL aligned"; "Peppol e-invoicing ready 2027"; "ISO 9001 · 27001 — Unisoft Systems"

**Legal bar** :364-368 — "© 2026 Simal Technologies Middle East LLC" plus 5 legal/sitemap links

**Script strings** :527-532 — error toasts that name info@simalme.com

### index.astro (home)
- :24-60 slide badges, tabs, accent colours, callouts ("14.5 GB/s", "6000 MT/s", "2,100 MB/s", "7,400 MB/s", "24 Years", "23 Global Leaders", "Same-Day Dispatch"); :63-69 generic fallback
- :84 duo-card product slugs
- :90-103 12 featured slugs
- :113-125 Brand Showcase: 4 rows / 20 brands and a slug map
- :137-141 insight cover map
- **Hero RFQ-basket widget**
  - :222-245 copy: "B2B RFQ Basket & Rapid Quote", "Tiered wholesale channel pricing with guaranteed SLA", "Guaranteed response ≤ 1 business day", "No upfront payment · Dedicated account manager assigned"
  - :1449-1454 **fabricated default basket**: T705 ×25, DDR5 Pro ×60, UGREEN hub ×40, `totalQty = 125`
  - :1464 "Response SLA ≤ 1 business day"
- **Procurement console** :163-219 — "Dubai Hub Live" pulse badge (:172, a static fake "live" indicator); 5 quick-jump chips (:188-192); 3 pillars (:197-217)
- **Stats strip** :251-301
  - "24 Years / Regional Channel Leadership / Established Dubai, 2002" (:257-261)
  - Brand count from DB (:269), subtitle "Tier-1 Micron, Crucial, UGREEN & more" hardcoded (:273)
  - SKU count from DB (:281), subtitle "JAFZA duty-free warehouse" (:285)
  - **"40+ Engineers"** hardcoded (:293-297)
- **Two engines** :304-334 — copy; mock "DISTRIBUTION ERP · LIVE" dashboard with fabricated "92%" / "98%" (:322-327); "12 engineering services. 40+ engineers, ISO 9001/27001, SOC 2, 24/7 support" (:329); chips
- **Featured cards** :350 "RFQ · channel pricing"
- **Brand Showcase heading** :359 "Authorized distributor for **23** global IT brands"; :371 "+ Inno3D and more lines on request"
- **Software Spotlight** :376-383 — three cards; "NBR-approved VAT … 1 Jan 2027 mandate"
- **Proof** :387 heading; testimonial fallbacks (:392 'JG', :394 "Jasper Guevarra · Technical Support Manager, Mercans", :396 quote); **awards** (:400 "HIKSEMi Best Distribution Partner — MEA National Distributor Summit", :401 "TEAMGROUP — Best Partner 2025")
- **Insights section** :408 section copy
- **Script**
  - :1244-1265 motif, background and glow arrays
  - :1310 "Request Channel Quote"
  - :1336 6,500 ms autoplay
  - :1499 7,000 ms testimonial rotation

### about/index.astro
- :22-35 fallbacks: leadership (4 names), mission, vision, values
- :42-44 hero: "since 2002 · independent · Bur Dubai"; "authorized by 23 global brands"
- :55-72 four entities: Simal Technologies ME LLC; StarSeed Technologies ME FZE (RA08DA07); Stellent Technologies ME LLC; Unisoft Systems Ltd, Dhaka
- :79-83 milestones 2002 / 2010s / 2020s / 2025 / 2026, including "Amazon, Sharaf DG and Microless"
- :91 "20+ Years"; :94 "4 Regions · UAE/GCC/MEA/CIS"
- :102-104 awards: "Hikvision — Best Distributor Partner", "TeamGroup — Best Partner 2025", "Authorized: 23 brands"
- :148-150 **internal placeholder rendered publicly**: "publish at launch per PRD FR-3.3 (≥4 approved profiles required)"
- :158-167 "Why choose Simal": "23 vendor lines", "JAFZA + Dhaka warehouses", "1:8 ratio from Premier tier", "UniERP reseller rights"
- :169-179 CSR, including the internal note "content package §02-06"

### ar/index.astro — the whole page is hardcoded Arabic
- :6-12 five product picks
- :38-40 title and description
- :46 phone, email, hours
- :48, :63 KYC links
- :59 search placeholder "ابحث في 81 منتجاً…" (search 81 products)
- :68-77 nav
- :82-91 hero (:84 "20+ years … 23 global brands")
- :94-98 RFQ card
- :103-106 counters: "20+", "**23**", "**81**", "**6** markets"
- :110 section labels
- :120 "جديد"; :126-129 "عرض سعر · جملة" / "أضف للطلب"
- :140-147 footer: address, warehouse, hours, phone, link groups including "12 مساراً" (12 service lines)
- :151 "© 2026 …"

### brands/index.astro
- :8-13 hardcoded 20-brand grid (omits Hiksemi, which has 1 live SKU). Hikvision, Zotac and PNY show "0 SKUs listed".
- :19 meta "23 global IT hardware brands"; :27 h1 "**23** Global Technology Brands"; :28 lead
- :31 WhatsApp +971 50 848 7861
- :35-40 "Distribution Guarantee": "100% genuine", "Local UAE RMA", "JAFZA dispatch same-week", "**≤ 24 hours turnaround**"
- :55 fallback object; :61-67 labels "Authorized line", "Genuine manufacturer supply."

### brands/[slug].astro
- :25-27 lead template ("…JAFZA fulfillment … GCC · MEA · CIS")
- :51 badge
- :56-57 CTAs (WhatsApp 971508487861)
- :59 "Same-week GCC delivery"
- :64-67 glance labels; "≤ 1 business day"
- :95 "RFQ · no list price"
- :104 empty-state copy

### careers/index.astro
- :9-14 4 fallback roles (codes, titles, departments, experience)
- :21 meta "23 global IT brands"
- :25-27 hero "A 20-year distributor"
- :30 WhatsApp
- :34-38 "Team size 11–50", "23 brands", "UAE · GCC · MEA · CIS", "Software practice"
- :44 "Four desks hiring now"
- :50 "Dubai, UAE"; :54 "Full-time · posted 2026"
- :63 "within 5 business days"
- :68-74 role `<option>`s
- :90-95 "Why people stay"
- :101-108 6 benefits, including "22 calendar days annual leave"

### compare/index.astro
- :25-40 SSD tier table: 4 Crucial models with read/write/NAND/use-case data and SKU links (2 broken; "T700" points to the T705)
- :49-51 copy; :71 "from the content package"

### contact/index.astro
- :16-18 "Four locations, one team"
- :36 hours note containing the internal "Until formally reconciled by management"
- :50-57 6 topics
- :68-73 fast paths (KYC link)
- :76-82 desk emails (info@, accounts@, logistics@, store@), plain text, not `mailto:`
- :99, :103, :105 status strings

### insights/index.astro
- :28-30 hero
- :33-37 "Monthly digest" card
- :98-109 "Simal 2026 line card — all **23** brands, **81** SKUs · PDF · updated monthly"
- :147, :161 fake confirmation strings

### insights/[slug].astro
- :53, :76, :91-94 fallback CTA copy "Talk to the desk", "Put this into practice…", "Contact the desk"

### legal/index.astro
- :8-16 seven policy summaries ("quotes valid 7 days", "UAE same/next business day from JAFZA; GCC same week", "refunds within 10 business days", "Target WCAG 2.1 AA")
- :27 PDPL text; :45 "v2026-10"; :55-62 PDPL and "30 days" update text

### legal/[slug].astro
- :26 "Version" fallback '1.0'

### onboarding/index.astro (no DB at all)
- :4-8 tiers: "$25k annual commitment", "30-day credit", "MDF", "UniERP territory rights"
- :17 "23 brands"
- :35 "≈10 minutes … reviewed within 2 business days"
- :50-58 business types
- :98 Peppol "≥AED 50M turnover from 1 Jan 2027"
- :105 bank examples
- :116-119 document checkboxes
- :142-151 "Why we ask", "Median: same day", "Old portal user?"
- :215-216 step names
- :379-391 success copy

### products/index.astro
- :24-30 buying guides for 5 categories (none for gaming or laptops)
- :36 "live catalog · ported from simalme.com"; :37-38 hero
- :59-64 sort labels
- :190 "content package §03"
- :201-207 sparse-results help copy

### products/[slug].astro
- :44-50 duplicate guides (text differs from products/index)
- :92-96 5 assurance claims ("typical 1–3 day UAE delivery")
- :106-107 badges, including Arabic "تحقق أصلي" with no `lang`
- :119-121 price-box copy
- :130, :300 WhatsApp 97143930507
- :135 trust row
- :148-150 Warranty, Availability ("5–10 working days") and Pricing rows
- :155 internal note "Arabic product copy arrives with the CMS content team"
- :196 "In the box"
- :216-219 Docs tab (no real datasheets)
- :272 recently-viewed placeholder

### resources/index.astro
- :9-18 8 fallback cases
- :35-43 datasheet tiles with **fabricated SKU counts** (14/8/12/9/18/11/6; live counts are 14/12/4/4/34/6/3)
- :46, :51 "8 case studies"
- :74-88 3 white papers (no PDFs)
- :96-105 6 FAQs ("all 23 authorized lines")
- :122 hint
- :129-143 press room

### rfq/index.astro
- :20-22, :37 copy
- :52 WhatsApp 97143930507 vs :185 971508487861
- :61 status page link
- :63 "quote validity 7 days (FRS)"
- :73-79 4-step flow ("UAE 1–3 days")
- :83 hours

### search/index.astro
- :21-23 hero copy
- :80 empty-state text

### sitemap/index.astro (HTML) — the entire link inventory and notes are hardcoded (:5-112)
- :27 "23 authorized lines"
- :41 "3 board members listed"
- :44 "8 departments · Dubai + Dhaka"
- :45 "3 entities"
- :51 "5 flagship practices + 12 service lines"
- :84 **"Mock auth · MFA noted"** (rendered publicly on `/sitemap/`)

### sitemap.xml.js
- :7 static route list

### software/index.astro
- :24-32 module grid ("NBR-approved VAT module", :31)
- :49 meta: "40+ engineers, ISO 27001"
- :53-73 hero and stats: "40+ engineers, ISO 9001/27001, SOC 2, 150+ projects, 24/7"; "44-technology stack"; "20+ years"; 20 / 12 / 9; "150+ · 98%"
- :77-83 sub-tabs with counts
- :86-95 portfolio map
- :99-113 UniERP vs SAP/Oracle/Dynamics table ("$100–500", "$70–200", "4–12 wks", "12M+ users")
- :133 "Nine verticals"; :139 "All 9 verticals" → `#demo`; :145 "12 practices"
- :161-187 demo form options; :182-185 engagement models ("Annual license + support", which contradicts "$0 licensing")
- :206 "§06-22"; :221 "§06-20"; :233 "150+ implementations across 12 industries"
- :238-246 **default ROI figures are wrong**: the shown total is $79,440, but the breakdown lines on :240-242 sum to $94,800; "$238,320 3-year" is also shown. The `r-ind` and `r-size` inputs are ignored by the calculation (:295-305).

### software/*/[slug].astro
- products: :53 "Built for" fallback; :56-57 CTAs go to `/contact`
- other detail pages: section headings only

### solutions/index.astro
- :12-16 icon map; :18-29 fallback 5
- :43-57 "the existing 12-line services business", "Two decades", "AMC renewal rate 90%+ target", "UAE · GCC", "4h metro"
- :48 WhatsApp 971508487861
- :62 "from the Simal comprehensive profile"
- :79 "Live from simalme.com/solutions"
- :87 "Line {i} of **12**"
- :106 "from the content package"
- :119 "SolarWinds-based network monitoring"
- :122-127 CTA band

### solutions/[id].astro
- :30 category labels
- :36-39 "IT solutions (12)", "**Products (78)**"
- :44 crumb "(12)"
- :54-57 hero-card rows ("Dubai desk · JAFZA logistics", "Assess → Stage → Deploy")
- :103 delivery model
- :118-131 cross-nav (custom-dev and cloud links; "One of 12 solution lines")
- :158 "All 12 lines"

---

## 4. Client-side scripts (item 3)

### 4.1 Network calls — all URLs are relative; none absolute

| File:line | Call | Response handling |
|---|---|---|
| BaseLayout:393 | GET `/api/rfq-basket` (every page) | sets the pill count; errors swallowed |
| BaseLayout:517 | POST `/api/contact` (newsletter: name "Newsletter subscriber") | checks `r.ok` |
| index:1440 | GET `/api/rfq-basket` | **any failure or empty basket → fabricated 125-item basket** (1447-1455) |
| ar:166 / ar:188 | GET / POST `/api/rfq-basket` | **reads `data.items`** (172), but the API returns `{lines,totalQty,basket}` (rfq.service.js:72,77), so items never render |
| brands/[slug]:117 | POST basket | checks `r.ok` |
| careers:168 | POST `/api/contact` | **success panel shown on every response, including failure and network error** (178-188) |
| compare:147, 150 | POST / GET basket | checks `r.ok` |
| contact:98 | POST `/api/contact` (FormData) | correct |
| onboarding:363 | POST `/api/contact` | sends only a summary (company/licence/TRN). **The KYC data (addresses, bank, IBAN, owner, documents) is never sent.** Result ignored; catch swallows errors (373); success screen always shown (376-394) with a client-random reference `'KYC-2026-'+random` (355) and the claim "Confirmation sent". **Bug:** `querySelector('.card.card-p')` (376) replaces the first *tier card*, not the wizard. |
| products/index:223, 229 | POST / GET basket | checks `r.ok` |
| products/[slug]:311, 316, 335, 340 | POST / GET basket | checks `r.ok` |
| rfq:117, 123, 139, 151 / 130 / 168 | POST basket / GET basket / POST `/api/rfq` | correct (expects `j.basket`, `j.reference`) |
| search:89, 92 | POST / GET basket | checks `r.ok` |
| software/index:348 | POST `/api/contact` (demo) | shows "Demo slot requested ✓" when `!r.ok` (358) and in the catch (360) |

Navigation-only scripts:
- BaseLayout:398, index:1505 and ar:158 → `location.href='/search/?q=…'`
- search:76 → `history.replaceState`

### 4.2 Widgets with no network call at all (fake)
- insights/index:139-148 — the "Monthly digest" shows "Subscribed ✓ / Confirmation sent" and discards the email.
- insights/index:152-162 — the line card calls `alert("…has been sent to {email}")`; nothing is sent.
- resources:64, 77, 82, 87, 118, 137 — `.gate-trigger` links have no handler. They go to `/contact/?topic=…`, and the contact page never reads `topic`.

### 4.3 Storage and cookies
- No `localStorage` anywhere.
- `sessionStorage` in onboarding:183, 256 (`kycDraft`) and 357-358 (`submittedApp`). Both hold **PII including IBAN/TRN** in plaintext. This contradicts the "ADR-2 zero client storage" comments at BaseLayout:374/411 and rfq:5-6.
- Cookies:
  - `simal_ann=1`, global, 180 days (BaseLayout:412-414)
  - `simal_recent`, written at products/[slug]:348-351 and **never read anywhere**. The "Recently viewed" sections (products/index:96-97 and [slug]:271-272) are dead.
  - Server-side `simal_rfq`: HttpOnly, SameSite=Strict, Path=/api (rfq.service.js:71)

### 4.4 Forms
- Only two `<form>` elements exist: contact:42 and rfq:26. Both have no `action`/`method` and are JS-intercepted, so there is no no-JS fallback.
- Every other "form" (careers, demo, ROI, newsletter, digest, KYC wizard) is divs plus a button plus JS.

### 4.5 Relative `/api` URLs in production — HIGH
- `astro.config.mjs:13-17` sets `vite.server.proxy`, which applies to `astro dev` only.
- The only production config in the repo, `infra/nginx/portal-staging.conf`, serves `server_name kyc.simalme.com` and states that SSG assets are served by a CDN. There is **no `/api` route for `simalme.com`**.
- `Codebase/site_8100.log` (the static `dist` server) shows `GET /api/rfq-basket 404` and `POST /api/rfq-basket 501`. Basket, RFQ submit, contact, newsletter, careers, demo and KYC all fail unless the CDN proxies `/api` to the portal (the basket cookie is `Path=/api` and same-origin).
- The fabricated home basket and the fake-success widgets **mask** this outage.
- The API slug regex `^[a-z0-9-]{2,120}$` (rfq.service.js:43) rejects 3 catalog slugs containing `_`. "Add to RFQ" returns 400 for:
  - `arktek-rtx3060-…_6b2aaad2` (featured on the home page)
  - `honeywell-6-out-…_24b617a1`
  - `honeywell-surge-protector-…-uni_a13c0ee0`

### 4.6 innerHTML injection from CMS/DB fields (Low/Med)
Unescaped DB/CMS values flow into `innerHTML` or `set:html`:
- index:1309 `href="${sl.href}"` and :1287 `${sl.photo}` (CMS slide fields)
- index:1461 and ar:174 basket `i.name` (CMS-editable product name)
- BaseLayout:171-178 brand names via `set:html`

---

## 5. Routes and links (item 4)

**Existing routes** (from `src/pages` plus `getStaticPaths`, corroborated by dist):
- Static: `/`, `/about`, `/ar`, `/brands`, `/careers`, `/compare`, `/contact`, `/insights`, `/legal`, `/onboarding`, `/products`, `/resources`, `/rfq`, `/search`, `/sitemap`, `/software`, `/solutions`, `/sitemap.xml`
- `/brands/[slug]` — 22: aiwa, arktek, crucial, dell, hiksemi, hikvision, honeywell, hp, kingston, koorui, lenovo, msi, nearity, **other**, pny, samsung, sandisk, teamgroup, toshiba, ugreen, wd, zotac
- `/products/[slug]` — 78
- `/insights/[slug]` — 14
- `/legal/[slug]` — 7: accessibility-statement, cookie-policy, privacy-policy, refund-policy, return-policy, shipping-policy, terms-conditions
- `/software/products|solutions/[slug]` — 20 each, with the same slugs
- `/software/modules` — 7: crm, finance, hr, inventory, manufacturing, projects, univat
- `/software/services` — 12: aiml, cloud, consultancy, custom-dev, cybersecurity, data-bi, devops, digital-transform, mobile, pm, qa, uiux
- `/software/industries` — 9
- `/solutions/[id]` — 12: amc, av, cabling, cloud-security, data-recovery, firewall, infra, licensing, managed, network-security, support, telephony

**Routes asked about:** no href to `/partners/`, `/blog/`, `/account/`, `/login` or `/privacy` exists in `src`. Sign-in goes to the external `kyc.simalme.com/login.html`, which exists in `apps/portal/public`.

**Broken links (404)**

| Source | Target | Note |
|---|---|---|
| solutions/index.astro:66 [H] | `/solutions/undefined/` ×5 | CMS payload has no `targetId`; whole-card links (verified in dist) |
| legal/index.astro:47 [H] | `/legal/privacy/`, `/terms/`, `/cookies/`, `/returns/`, `/shipping/`, `/refund/`, `/accessibility/` | 7 × 404 |
| sitemap/index.astro:55 [M] | `/solutions/cloud/` | should be `/solutions/cloud-security/` |
| sitemap/index.astro:56 [M] | `/solutions/storage/` | should be `/solutions/data-recovery/` |
| compare/index.astro:35 [M] | `/products/crucial-p3-ct1000p3ssd8/` | real slug is `crucial-p3` |
| compare/index.astro:36 [M] | `/products/crucial-p3-plus-ct1000p3pssd8/` | real slug is `crucial-p3-plus` |

**Latent breakage**
- brands/index:55, 59 and index:366 build `/brands/${name.toLowerCase()}` for hardcoded names.
- Software detail links use payload `id`, not `entity_id`: products:63, modules:63, services:85, solutions:82/93/113, industries:67/87, software/index:137/148. A CMS payload without `id` produces `/undefined`.

**Dead anchors and no-op parameters**
- sitemap/index:58 `/solutions/#amc-table` — the actual id is `amc-tiers` (solutions/index:106).
- software/solutions/[slug]:34 `/software#solutions` — there is no such id.
- insights/[slug]:48 `/insights/#cat-{CAT}` — no such ids exist; the filters are JS-only.
- index:188 `/products?cat=storage` — there is no "storage" category, so the full catalog shows.
- resources `?topic=` — ignored (§4.2).

**Mislabeled links**
- brands/[slug]:46 crumb "Brands" → `/products`
- products/[slug]:58 "Category" crumb → `/products/`
- products/[slug]:188 "Compare with the category" → `/products/`
- products/[slug]:189, 235 "All {brand}" → `/products/`
- index:359 "Browse by brand" → `/products`
- index:380-381 "See UniPOS/UniVAT detail" → `/software/#products` (no product list there)
- index:139 "All 9 verticals" → `#demo`
- compare:38 "Crucial T700" → the T705 product
- solutions/[id]:31 category chips → unfiltered `/products/`

**Orphans**
- 18 of 20 `/software/products/*` and 19 of 20 `/software/solutions/*` pages are not linked from any hub. They are reachable only via related-card chains and `sitemap.xml`.
- `/brands/other/` ("More lines") is generated but unlinked.

---

## 6. Inconsistent facts (item 5)

| Fact | Values found |
|---|---|
| Brand count | **21** (BaseLayout:170 mega; :357 badge — DB excluding 'other'), **22** (index:12/269 stats; index:315; about:10/92 — DB including 'other'), **23** (index:56, 359; about:44, 104, 162; brands/index:19, 27; careers:21, 36; onboarding:17; resources:99; insights:102; ar:84, 104; sitemap/index:27), **20** brands actually shown (index:113-118; brands/index:8-13). On the built home page, 21, 22 and 23 all appear at once. |
| SKUs | **78** live (rendered); **81** hardcoded (ar:59, 105; insights:102); BaseLayout fallback counts sum to 81; resources datasheets sum to 78 but every per-category number is wrong; "Products (78)" hardcoded (solutions/[id]:38); the mega-menu category counts sum to 77 |
| Brand per-SKU | Crucial 18 (mega/cache) vs 19 (`/brands/crucial`); Honeywell 13 (cache) vs 12 (live) |
| Years | "24 Years" (index:56-58, 257) vs "20+" (about:91; ar:103; software:68) vs "20-year" (careers:27) vs "Two decades" (about:77; solutions:39, 45); "since 2002" means 24 |
| Certifications | "ISO 9001 · 27001" (BaseLayout:360) vs "+ SOC 2" (index:329; software:55, 61) vs "ISO 27001" (software:49) |
| WhatsApp / phone | wa.me/**97143930507** (BaseLayout:112, 306; products/[slug]:130, 300; rfq:52) vs wa.me/**971508487861** (brands:57; brands/index:31; careers:30; solutions:48; **rfq:185 on the same button**) |
| RFQ SLA | "≤ 1 business day" (most pages) vs "≤ 24 hours" (brands/index:39) |
| Delivery | "Same-day UAE" (index:208), "Same-Day Dispatch" (index:56), "1–3 day UAE" (products/[slug]:94; rfq:78), "same/next business day" (legal/index:13), "Same-week GCC" (brands:59), "same-week" (brands/index:38) |
| Regions | "4 regions" (about:94) vs "6 markets" (ar:106) vs "UAE · GCC" (solutions:55) |
| Locations | "4 locations" (BaseLayout:258; contact:18) vs "3 entities" (sitemap/index:45) |
| Jobs | "12 live job codes" (BaseLayout:257) vs "Four desks" (careers:44) vs "8 departments · Dubai + Dhaka" (sitemap:44; seed `career-depts`) |
| Insights | "10-post calendar" (BaseLayout:238) vs 14 live |
| Leadership | DB 3 people (and sitemap "3 board members") vs fallback 4 different people (about:22-27) |
| Awards | "HIKSEMi Best Distribution Partner — MEA Summit" (index:400) vs "Hikvision — Best Distributor Partner" (about:102) vs "HIKSEMi · TEAMGROUP 2025" (BaseLayout:254) |
| Solution URLs | cloud-security / data-recovery (BaseLayout) vs cloud / storage (sitemap) vs undefined (solutions/index) |
| Legal slugs | `privacy-policy`… (BaseLayout, sitemap) vs `privacy`… (legal/index) |
| UniERP implementation time | "4–12 weeks" (software:103, 109) vs 8–10 / 12–16 / 18–24 weeks (pricing) vs "Week 12+" (phases) |
| Licensing | "$0 licensing, forever" vs "Licensed product — Annual license" (software:183) |
| Industries | "9 verticals" vs "12 industries" (software:233) |
| SSD peak speed | "up to 12,400 MB/s" (BaseLayout:149; guides) vs "14,500 MB/s" (hero) |
| VAT approval | "NBR-approved" (a Bangladeshi authority) presented to UAE buyers (BaseLayout:191; index:381; software:31, 102-103) |

---

## 7. Accessibility red flags (item 6)

These **contradict** `ACCESSIBILITY_WCAG_AUDIT.md` (single h1, no skipped levels, skip links, accessible sort chips) and report §6.

**Headings**
- **Home has 0 `<h1>` in the server HTML** (verified in dist). JavaScript injects one `<h1>` per slide, so **5 h1** after hydration (index:1305).
- The audit's claimed h1 ("Simal Technologies ME — …") is actually the `<title>`.

**Skipped heading levels**
- BaseLayout: h3 (:288) → h5 (:311, 323, 335, 344)
- Home: h3 before any h2 (:168, 227)
- h2 → h4 cards: index:348, 419; products/index:80 (the catalog jumps h1 → h4); brands/[slug]:91; ar:124; resources:62; insights/[slug]:119; solutions/index:68, 88; software/index:123, 151; search:66
- onboarding: h2 (:17) before h1 (:34)
- sitemap/index: h1 → h3 (:127)

**Unlabelled inputs**
- careers:65, 66, 67, 76, 78 — `<label>` without `for` or nesting
- ar:59 — no label of its own

**Not keyboard operable**
- BaseLayout:123 `<b id="qb">` search "button"
- ar:60 `<b id="qb-ar">`
- products/index:60-63 sort chips are `<span>` elements with click handlers (:145)

**ARIA misuse**
- The 8 mega-menu triggers are `div role="button"` *containing* links (BaseLayout:133-248). Button children are presentational.
- 8 `role="region"` panels
- Slides use `role="tabpanel"` with no `aria-labelledby`/`aria-controls` (index:1297, 1322); tab `aria-label`s override visible text
- The announcement link's `aria-label` differs from its visible text (BaseLayout:93, label-in-name)
- `pointer-events:none` fake buttons: insights:72; solutions:71, 90

**Duplicate IDs**
- `id="q"` appears in both BaseLayout:122 and search:25. search:71 binds to the **header** input, so the page's own search box is inert. On mobile the header search is hidden (BaseLayout:546).
- solutions/index:65 and :82 both emit `amc`, `av` and `firewall` ids.
- products/index:96 has a duplicate `style` attribute.

**Motion and live regions**
- The hero autoplays every 6.5 s with no pause control (it pauses only on hover/focus).
- Testimonials rotate every 7 s with no pause (index:1499). WCAG 2.2.2.
- An `aria-live` counter announces every slide change (index:1328).

**Status messages, structure and language**
- Status messages are not live regions: contact:63, careers:81-82, rfq:54, onboarding:136, software:179, insights:37. `alert()` is used for feedback (insights:157, 161).
- **No skip link anywhere** (grep: 0 hits).
- `/ar` has no `<main>` or `<nav>` (ar:44-153).
- Four bands sit outside `<footer>` (BaseLayout:286, 351, 355, 363).
- Arabic strings on `lang="en"` pages carry no `lang="ar"`: BaseLayout:108, 259, 341; products/[slug]:107.
- `/ar` renders English product names inside a `lang="ar"` page.

**Positive results**
- All images have alt. No positive tabindex. The RFQ and contact forms are correctly labelled.

---

## 8. SEO (item 7)

**Head tags**
- `<head>` (BaseLayout:77-83) has only title, meta description and favicon.
- **0 of 218 built pages** have canonical, Open Graph, Twitter, hreflang or JSON-LD (grep on dist).
- `<html lang="en">` is fixed (BaseLayout:76) for 217 pages; `/ar` is standalone with `lang="ar" dir="rtl"`.
- No hreflang pairs `/` with `/ar`.

**Titles and descriptions**
- Every page has a title and a description. Home passes no description, so it gets the default "IT Distribution & Software Services, Dubai" (index:155; BaseLayout:8).
- PDP description is `p.short` (can be null); insights use `a.x`; software pages use payload fields.

**`sitemap.xml.js`**
- Prerendered at build to 189 URLs.
- Base comes from `PUBLIC_SITE_URL`, not `astro.config` `site` (:4).
- **Every `lastmod` is the build date** (:5, 35).
- **Missing:** `/brands` and all 22 brand pages, `/resources`, `/onboarding`, `/compare`, `/ar`, `/sitemap`.
- URLs have no trailing slash (`/products`), while output is `/products/index.html` and internal links mix both forms. With no canonical tags, both variants and redirect hops are exposed.
- No `lang` filter (duplicate-URL risk).
- 20 software product/solution slug pairs are near-duplicate URL sets.

**`public/robots.txt`**
- `Allow: /`, `Disallow: /api/`, `Sitemap: https://simalme.com/sitemap.xml`. Valid.
- `/search/` is not disallowed (thin results pages).

**Other**
- The home h1 exists only client-side.
- The 404 links in §5 and the orphaned software pages reduce crawlability.

---

## 9. Summary table: component → source → evidence

**Classification key:**
- **DB** — read from a PostgreSQL table at build time
- **CMS-blk** — `content_blocks` with no hardcoded fallback
- **CMS-blk+FB** — `content_blocks` with a silent hardcoded fallback
- **HARD** — hardcoded

| Component | Source | Evidence |
|---|---|---|
| Announcement bar | DB `announcements` (+ HARD label fallback, global dismiss) | BaseLayout:17, 88-98, 412-414 |
| Utility bar: phone/email/hours/KYC/lang/social | HARD | BaseLayout:100-115 |
| Logo, search, CTA row | HARD (+ DB SKU count) | BaseLayout:117-129 |
| Mega: Home | HARD (+ DB count) | BaseLayout:133-143 |
| Mega: Products | HARD labels/promo; DB counts with HARD fallbacks | BaseLayout:20, 146-165 |
| Mega: Brands | DB top-11 + counts; HARD taglines | BaseLayout:27-59, 168-181 |
| Mega: Software / IT Solutions / Partners / Insights / About | HARD | BaseLayout:184-261 |
| Hot strip, mobile nav | HARD | BaseLayout:263, 267-278 |
| Newsletter strip | HARD copy → POST /api/contact | BaseLayout:286-295, 507-535 |
| Footer columns, addresses, socials | HARD (+ DB count) | BaseLayout:297-349 |
| Footer brand strip | DB `brands` | BaseLayout:14, 351-353 |
| Trust badges | HARD (+ DB count) | BaseLayout:355-361 |
| Legal bar | HARD | BaseLayout:363-370 |
| Hero slide text | DB `hero_slides` | index:10 |
| Hero badges/tabs/callouts/colours | HARD, positional | index:24-69, 1244-1265 |
| Procurement console | HARD | index:163-219 |
| Hero RFQ-basket widget | API + HARD fabricated basket | index:222-245, 1433-1466 |
| Stats strip | DB brands/SKU counts; HARD "24 yrs", "40+ engineers", subtitles | index:11-12, 251-301 |
| Two engines | HARD (+ DB counts; HARD duo slugs) | index:84-87, 304-334 |
| Featured strip | CMS-blk+FB `site/featured-products` (block not seeded) | index:90-110, 337-355 |
| Brand Showcase | HARD (20 names, "23") | index:113-125, 358-373 |
| Software Spotlight | HARD | index:376-383 |
| Testimonials | DB `testimonials` (+ HARD fallback) | index:128, 389-397; about:11 |
| Awards | HARD | index:400-401; about:102-104 |
| Home latest insights | CMS-blk `insight` (+ HARD covers) | index:136-152, 407-426 |
| About hero, entities, milestones, why, CSR, notes | HARD | about:40-87, 148-182 |
| About counters | DB (brands, SKUs) + HARD ("20+", "4") | about:9-10, 90-95 |
| Mission / vision / values / leadership | CMS-blk+FB `site/*` | about:13-35, 119-153 |
| `/ar` page | HARD (+ DB for 5 hardcoded product picks) | ar:6-153 |
| `/brands` index grid | HARD list + DB cached `counts` | brands/index:8-13, 50-74 |
| `/brands/[slug]` | DB `brands` + `products`; HARD copy/SLA | brands/[slug]:6-27, 44-108 |
| Careers roles | CMS-blk+FB `site/careers-roles` (fallback live; options HARD) | careers:9-18, 46-74 |
| Careers hero / benefits | HARD | careers:23-39, 87-115 |
| Compare picker | DB `products` + `product_deep` | compare:8-23 |
| Compare SSD tier table | HARD (2 broken links) | compare:25-40, 71-96 |
| Contact offices | CMS-blk `site/offices` (fallback `[]`) | contact:9-10, 22-33 |
| Contact hours / topics / desks | HARD | contact:14-20, 35-37, 50-83 |
| Insights list and articles | CMS-blk `insight` | insights/index:9; [slug]:9-14 |
| Insights digest and line card | HARD, fake | insights/index:32-38, 97-109, 137-163 |
| Legal hub | HARD (7 broken links) | legal/index:8-66 |
| Legal policy pages | DB `legal_policies` | legal/[slug]:7-17 |
| Onboarding tiers and KYC wizard | HARD; summary only → /api/contact; sessionStorage PII | onboarding:4-151, 183, 256, 355-394 |
| Catalog grid | DB `products` | products/index:10, 66-90 |
| Catalog buying guides | HARD (`category_guides` unused) | products/index:24-30, 255 |
| PDP core (name/desc/specs/images/related) | DB `products`, `product_deep` (not CMS-writable), `brands` | products/[slug]:16-42 |
| PDP assurance/warranty/in-box/docs/guide | HARD | products/[slug]:44-50, 92-96, 148-155, 196, 214-221 |
| Resources case studies | CMS-blk+FB `site/cases` | resources:9-33, 56-68 |
| Resources white papers / FAQ / datasheets / press | HARD | resources:35-43, 70-145 |
| RFQ page | DB product list + API; HARD copy | rfq:10, 20-85, 97-189 |
| Search | DB `products` (duplicate-id bug) | search:10-15, 25, 71 |
| HTML sitemap | HARD inventory (+ DB category counts) | sitemap/index:5-112 |
| `sitemap.xml` | DB (+ HARD static list) | sitemap.xml.js:7-32 |
| Software hub hero/stats/map/comparison/demo/engagement/ROI | HARD | software/index:51-113, 160-188, 219-251 |
| Software hub module grid | HARD (DB rows fetched, unused) | software/index:13, 24-32, 117-129 |
| Software hub industries | CMS-blk `software_industry` | software/index:15, 136-138 |
| Software hub services | CMS-blk `software_service` | software/index:14, 147-156 |
| Software pricing | CMS-blk+FB `erp/pricing` | software/index:16, 34-38, 192-206 |
| Software implementation phases | CMS-blk+FB `site/impl-phases` | software/index:17, 40-46, 208-216 |
| Software detail pages (68) | CMS-blk `software_*` | software/*/[slug].astro:7-20 |
| Solutions hero / glance | HARD | solutions/index:41-58 |
| Flagship 5 | CMS-blk+FB `site/solutions5` (links broken) | solutions/index:18-33, 63-74 |
| 12 service lines | CMS-blk `it_solution` (+ HARD icons, "of 12") | solutions/index:10-16, 78-100 |
| AMC tier table | CMS-blk `site/amc-tiers` | solutions/index:35-36, 104-118; [id]:26, 78-92 |
| Solution detail pages | CMS-blk `it_solution` + HARD rails / hero-card / delivery / cross-nav | solutions/[id]:11-31, 35-160 |

**Bottom line:** content that comes from PostgreSQL is real but limited to:
- the catalog, brand detail pages, insights, the legal and software/IT-solution detail pages, slides text, testimonials, offices, and a few `site/*` blocks — several of which ship hardcoded fallbacks.

The site chrome, home-page credibility sections, the about page body, `/ar`, `/onboarding`, most of `/resources`, the `/software` hub body and the `/legal` hub are hardcoded.

Several "CMS-editable" items cannot be edited from the CMS at all:
- `brands`, `product_deep`, product images/specs, and creating or deleting products.

Others are broken in the current build:
- the flagship links, the careers key, the stock flag, and the `/ar` basket.

So "25/25 fully dynamic and directly editable" does not hold.
