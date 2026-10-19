# Simal Digital Platform — Prototype Site Map (v1.8.1)

Maps every working prototype page to the content-package IA (20 sections, 261 files).
Visual version: `sitemap.html` · Full content inventory: `../content/Required_Content_Files_Master_Inventory.md`
v1.8.x: home hero = 5-slide full-bleed carousel (Gen5 / distribution / software / AMC / Peppol) with
Ken Burns drift, mesh gradients + SVG motifs, grain, staggered entrances, numbered ticks + progress line.
v1.7.1: full-screen layout — .wrap widened 1240→1600 site-wide (styles.css v=136 on all pages);
insights hub rebalanced to full-width featured banner + 3-column article grid.
v1.7.0: insights library — insight.html (14 article pages, sticky TOC, prev/next of 14, related grid);
insights.html hub with category filters; full article bodies from content §08-02 outlines.
v1.6.0: IT-solution deep-dive tier — it-solution.html (12 line pages, hash-driven, AMC carries the real
3-tier SLA table; solutions.html rebuilt as overlay-card directory; flagship slug anchors preserved).
v1.5.1: services + industries hubs rebuilt on valid stretched-overlay cards (whole-card link, chips link
grandchildren/solutions directly); preview server now sends no-store HTML (serve_prototype.py).
v1.5.0: industry deep-dive tier — software-industry.html (9 vertical pages, hash-driven, prev/next chain
of 9, sector pains/plays/FAQ, solution + service cross-links; industries hub now a 9-card directory).
v1.4.0: solution deep-dive tier — software-solution.html (20 solution pages, hash-driven, prev/next chain
of 20, cross-links to modules/services/industries/siblings; reverse links from service + module pages).
v1.3.2: cache-busting — every asset reference on all pages carries `?v=` version strings.
v1.3.0: service drill-down tiers — software-service.html (12 child pages) +
software-subservice.html (36 grandchild pages), all hash-driven with live re-render.
v1.0.8: dropdown repair (viewport-clamped panels, promo-under-title, rich category/brand links) +
hero slide flex layout + `solutions.html#amc-tiers` / `software.html#impl` anchors.
v1.0.9: dropdown open/close state machine — click toggles, hover pure CSS, keyboard Tab/Enter,
Esc / outside-click / focus-away / nav-mouseleave all close (menus never stick open).
v1.1.0: software sub-site — uslbd.com researched (20 products, 12 services, 8 verticals + facts);
new software-erp / software-products / software-services / software-industries detail pages;
Software mega rebuilt (11 links, every item to its own page); footer + sitemap rewired.

```
SIMAL DIGITAL PLATFORM (Prototype v1.1.0 — 29 pages incl. system & self-test)
│
├── HOME · index.html  (7-slide campaign carousel · counters 20+/300+/23/81/6 ·
│   featured 12 SKUs strip · brand showcase 4 rows · precise 2025 awards)
│
├── PRODUCTS & BRANDS · category.html  ── 81 SKUs · 7 categories · facets/sort/pagination
│   ├── category.html#internal-ssd   (17)      ├── product.html#<slug>   (81 detail pages)
│   ├── category.html#portable-ssd   (12)      ├── brand.html#<brand>    (18 brand landings)
│   ├── category.html#memory          (4)      └── search.html#q=…       (typo-tolerant)
│   ├── category.html#monitors        (4)
│   ├── category.html#gaming          (6)
│   ├── category.html#accessories    (35)
│   ├── category.html#laptops         (3)      [content §03 · 83 files]
│   └── compare.html                  (working compare — 4 SKUs + SSD tier preset)
│
├── IT SOLUTIONS · solutions.html  ── 5 flagship practices [content §05] + real AMC tier table + 12 lines [mirror]
│   ├── #amc      Annual Maintenance Contract
│   ├── #av       AV & Meeting Room (Nearity)
│   ├── #cloud    Cloud Security
│   ├── #storage  Data Recovery & Storage
│   ├── #firewall Firewall (Sophos XG)
│   └── #lines    12 service lines
│
├── SOFTWARE SERVICES · software.html  ── UniERP on Odoo 19 CE [content §06 · 22 files]
│   ├── #modules      7 ERP modules (Finance … UniVAT)
│   ├── #industries   8 verticals (Retail → Agriculture)
│   ├── #services     12 engineering practices + custom dev/cloud/AI
│   ├── #pricing      Starter / Professional / Enterprise packages
│   ├── 7-phase implementation methodology timeline
│   ├── #roi          ROI calculator (working)
│   └── #demo         ERP demo request (working form)
│
├── PARTNERS · onboarding.html  ── program tiers [content §07] + 7-step KYC wizard
│   ├── #tiers        Authorized · Premier · Elite
│   ├── login.html    Sign in / create account (mock auth)
│   ├── account.html  Partner dashboard (KYC · RFQs · orders&invoices · docs · notifications)
│   └── rfq.html      RFQ engine → SIMAL-RFQ-YYYYMMDD-NNNN
│
├── INSIGHTS & RESOURCES · insights.html + resources.html  [content §08 · 12 files]
│   ├── Blog & newsroom (10-post calendar, real mirror post featured)
│   ├── #cases   8 case studies      ├── #papers  White papers (gated)
│   ├── #faq     Partner FAQ         └── #press   Press room & media kit
│
├── COMPANY · about.html  [content §02 · 7 files]
│   ├── #mission    Mission · vision · 5 values
│   ├── #leadership Board of directors (3) — full team at launch per FR-3.3
│   ├── #why        Why choose Simal  └── #csr  Corporate social responsibility
│   ├── careers.html  8 departments · Dubai + Dhaka  [content §09]
│   ├── contact.html  3 entities · routed enquiries  [content §10]
│   └── ar.html       العربية (RTL demonstration)
│
├── LEGAL · legal.html  ── 7 policies, tabbed  [content §11]
│   #privacy #terms #cookies #returns #shipping #refund #accessibility
│
├── B2B PORTAL & SYSTEM ·  [content §12-13, §17-20 in build phase]
│   ├── admin-queue.html / admin-review.html   (KYC review console)
│   ├── cms.html / cms-editor.html             (bilingual content studio)
│   └── test.html                              (30-assertion self-test)
│
└── SYSTEM · sitemap.html (this map, visual) · README.md (manifest + QA log)

BUILD-PHASE CONTENT (mapped, not yet prototyped — content §12-20):
B2B portal deep screens (orders, invoices, tickets) · utility pages (404, search-no-results)
· AR site-wide translation sets (§14) · SEO metadata (§15) · media assets (§16)
· 8 form definitions (§17) · 10 email templates (§18) · chatbot content (§19) · analytics config (§20)
```

**Counts:** 26 prototype pages · 81 SKUs · 18 brand landings · 5 solutions + 12 lines ·
7 ERP modules + 8 industries · 3 partner tiers · 10 blog posts · 8 case studies · 7 legal policies.
