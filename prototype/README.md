# Simal Digital Platform — Working Prototype (v1.8.1)

> **Related systems:** the **live KYC + e-invoicing portal** (real Node backend, partner & staff consoles) runs at `../apps/portal/` → http://127.0.0.1:8090 — see `apps/portal/README.md`. Production-build documentation lives in `../project-doc/` (39 docs, v2.0 audited); the task-level build plan is `../implementation/Implementation_Roadmap.md` (9 phases, 49 tasks, Dec-4 go-live anchor). *(Sibling links updated at workspace unification, 2026-10-19.)*

A **100% client-side, fully working prototype** of the Simal corporate website and
partner platform, built on the approved V2 "Navy & Gold Executive" UX design
(`../ux`, spec v2.2) and carrying the **complete product portfolio ported
from the site mirror** (`../../Mirror_site` — the mirror stays OUTSIDE the repo at the
workspace root; copyright third-party assets) — nothing left behind: 81 product records
(76 unique SKUs + variants), 85 real product photographs, 18 brand lines, the real
12-line IT solutions list, the real customer testimonials, and the mirror's own
product copy.

> **v1.8.1 — elegant hero pass (4 Oct 2026, user: "similar type visuals, elegant slides — replace the existing"):** visual
> elevation of the 5-slide carousel to Redington grade, zero external assets: **Ken Burns drift** on backdrops (slow 1.02→1.1
> scale), **staggered content entrances** (rule → kicker → headline → sub → CTA, rise+fade at 70–400ms), **layered mesh
> gradients** (3 stops per slide) with **SVG geometric motifs** (fine grid / concentric arcs / rings / gold dot-matrix as inline
> data-URIs), **film grain** overlay (SVG turbulence, 5% overlay blend) + vignette, photo slides now use **blurred backdrop
> (30px) + sharp foreground product**, refined type (gold rule, letterspaced smallcaps kicker, clamp 30–46px headline with
> shadow), and **numbered tick indicators 01–05 with underline fill + full-width 2px progress line**. Engine API unchanged
> (arrows/ticks/swipe/hover-pause/autoplay all re-verified); self-test 54/54; `home.js?v=138`.

> **v1.8.0 — Redington-style hero: 5 full-bleed slides (4 Oct 2026, user-directed "change the hero to 5 different slides,
> reference redingtongroup.com"):** replaced the in-gradient 7-slide text carousel with a **full-bleed 5-slide hero carousel**
> (reference pattern: full-width photo/gradient backgrounds, headline + CTA per slide, dots + arrows + autoplay). Slides:
> ① Gen5 storage (navy + T705 product photo right, CTA → SSD category) ② Authorized distribution (blue + KOORUI photo left,
> CTA → catalog) ③ Software line launch (rose gradient, CTA → software.html) ④ AMC SLA tiers (green, CTA → it-solution#amc)
> ⑤ Peppol 2027 (navy→gold, CTA → UniVAT solution). Engine: fade transitions, ‹ › arrows, **progress-bar dots** with per-slide
> fill, "N / 5" counter, 6.5s autoplay, hover-pause, pointer swipe; RFQ quick-quote card + search + trust strip moved to a
> grid strip below the stage. Verified: DOM probe shows slides 1→5 rotating in order with counter updates; interaction probe —
> next arrow, dot-4 jump (AMC CTA correct), swipe, hover-pause, CTA navigation to software-solution.html#univat — all pass;
> visual crops of photo-slide and gradient-slide layouts clean; self-test 54/54; `home.js?v=137`.

> **v1.7.1 — full-screen layout (4 Oct 2026, user-reported "insights.html left side is empty — use the whole screen, always"):**
> pixel-measurement diagnosis at 1920px: content spanned x340→1580 with a 1084px dead left region — two causes: (1) `.wrap`
> capped at 1240px centered; (2) the hub's asymmetric split stretched the short featured card to match the tall 13-card rail.
> Fixes: **`.wrap` widened 1240 → 1600px site-wide** (all 36 pages bumped `styles.css?v=136` — hero/section text max-widths
> were already capped inline so line lengths stay readable), and the **insights hub rebalanced**: featured is now a full-width
> banner (gradient tile + text side-by-side) with the 13 articles in a 3-column grid — no empty column at any width. Verified:
> 1920px renders of home/products/solution/category all full-bleed with symmetric ~190px gutters; hub click-probe (filter,
> banner overlay, grid) passes; self-test 54/54.

> **v1.7.0 — Insights library: 14 full articles + article pages (4 Oct 2026, user-reported "insights.html content not enough,
> no navigation pages"):** research first (B2B blog-article practice: sticky TOC sidebar, scannable H2s, category taxonomy,
> related posts, inline CTAs) — then rebuilt. The hub had 3 excerpt-only posts and 2 inline stubs, no article pages, no
> categories. `data/insights.js` rewritten: **14 articles with full bodies** (3–6 sections × substantive paragraphs each) — the
> content package's 10 foundation articles (§08-02 outlines: grey-market risks, enterprise SSD guide, UniERP implementation
> story, PDPL compliance, DDR4/5, AI in ERP, UAE cybersecurity, future-proof infrastructure, Industry 4.0, company story)
> plus the live T705/P510 channel posts, the Peppol 90-day checklist and the gray-market cost math — each with category,
> author, date, reading time, tags, related slugs and a per-article CTA. New `insight.html` (hash-driven, 36th page): article
> hero, **sticky TOC sidebar** (anchor-safe), body with scroll-margin anchors, inline CTA card, prev/next across all 14,
> related-insights grid, newsletter band. Hub upgraded: **category filter chips (8 cats + ALL)**, featured article with
> overlay link, all 14 cards as overlay links with date/author/meta, one anchor id per category (article breadcrumbs land on
> the filtered-relevant card). Home insights section → 3 cards linking article pages. Self-test 52 → **54/54** (14 complete
> articles; rel slugs resolve; ctas valid — and test.html now includes data/insights.js); coordinate-click probe: filter →
> featured → article (TOC works, guard holds) → next re-render; nested anchors 0; `?v=135` on changed assets.

> **v1.6.0 — IT-solution deep-dive tier: all 12 solution lines navigate (4 Oct 2026, user-reported "solutions.html#amc —
> people want to know about AMC, needs a navigational page"):** research first (ITIL v4 SLM practice, SLA-definition and
> tiered-response guidance: purpose/scope/dependencies defined per service, tiered SLAs with response + resolution times,
> reporting commitments, obligations clarity) — then applied. New `it-solution.html` (hash-driven, 35th page): per-line hero +
> at-a-glance card, "What this solution is", **scope & deliverables grid** (4–5 areas × bullets), the **real 3-tier SLA table on
> AMC** (content §05-02: Basic NBD / Standard 4h / Premium 1h + 24×7×365, Premium column highlighted), engagement timeline,
> delivery-model card, cross-navigation band (related catalog categories · software-side links · pairs-well-with cards),
> 2-question FAQ, **prev/next chain across all 12**, dark CTA. New `window.ITSOL` data layer: 12 records × (what + scope + process
> + faq + related + catalog categories), grounded in content §05 + the mirror's 12 lines. Hub rebuilt as a directory: 5 flagship
> cards + 12 line cards on stretched overlays (legacy `#amc/#cloud/#storage…` anchors preserved; flagship slugs map onto line
> ids), scope chips on line cards, hover lift. Self-test 50 → **52/52** (12 complete records; related/cats resolve); coordinate-click
> probe: hub#amc → AMC detail (SLA table verified) → next → Managed Services → related → back; nested anchors 0; `?v=134` on
> changed assets.

> **v1.5.1 — services hub depth + no-store preview server + nested-anchor repair (4 Oct 2026, user-reported
> "software-services.html has the same problem, no navigation to go deeper"):** inspection found the hub's 12 cards already
> opened child pages, but the 36 sub-service chips were inert spans, the 3 engagement-model cards were static, and — root cause
> of "no navigation" reports — the two hub grids had shipped **nested `<a>` elements** (outer card link wrapping product/service
> chip links): invalid HTML that Chrome silently unwraps, leaving the card body outside the link. Rebuilt both hubs on the
> stretched-overlay pattern (`.go2` absolute overlay = whole-card link; chips z-index:2 above it): services cards now carry
> "Practice N of 12" eyebrows, hover lift, **36 chips linking straight to grandchild pages**, and engagement cards link their
> practices (PM / custom-dev / consultancy); industries cards keep anchors + product chips with the same valid structure.
> Replaced the preview server with `serve_prototype.py` — **HTML `Cache-Control: no-store`, `?v=` assets immutable** — ending
> the stale-HTML/JS cache class entirely (5th incident). Verified: click-probe with coordinate clicks (chip → #ml grandchild,
> overlay → #aiml child, industries hub 9 overlays + 23 chips), **nested anchors = 0** on both hubs, geometry probe zero
> overlaps, self-test 50/50; `software-services.js`/`software-industries.js` bumped `?v=134`.

> **v1.5.0 — industry deep-dive tier: every vertical navigates (4 Oct 2026, user-reported "software-industries.html#banking has
> the same problem — inspect visually and manually clicking, then do the same"):** visual + click inspection confirmed the nine
> verticals were thin same-page sections (one paragraph, 3 chips, product links — top chips only scrolled in place). New
> `software-industry.html` (hash-driven, 34th page): per-vertical hero + at-a-glance card, **"What slows the sector down"** (3
> sector pains) beside a **3-step engagement timeline**, the sector's solution grid (→ solution deep-dives), a cross-navigation
> band (services the sector leans on · portfolio position · **adjacent-sector cards**), 2-question FAQ, **prev/next chain across
> all 9** ("Vertical N of 9") and a dark CTA band. New `SOFTWARE.industryDetail` data layer: 9 records × (what + pains[3] +
> plays[3] + faq[2] + services[≥2] + related industries), grounded in uslbd.com/solutions. The industries page became a
> **directory hub** (9 rich cards → industry pages; legacy `#healthcare…#agriculture` anchors still land). Industry links across
> the site repointed to detail pages (solution cross-nav chips, product-grid "Used in", visual sitemap). Self-test 48 → **50/50**
> (9 complete records; cross-nav ids resolve); click-through e2e: hub → banking → next (re-render) → Retail ERP solution →
> industry chip back, all PASS; changed assets bumped `?v=133` (12 pages).

> **v1.4.0 — solution deep-dive tier: every product box navigates (4 Oct 2026, user-directed "all solution boxes must have
> navigation pages — true page flow, multi-point navigation, cross navigation"):** applied the enterprise omni-navigation skill
> (4-tier IA, lateral sibling switching, no dead ends) to the 20-product grid. New `software-solution.html` (hash-driven, 21st→33rd
> page): per-solution hero with at-a-glance card, "What it covers" capability grid (4–5 groups × bullets), rollout timeline +
> platform/licensing card, **UniERP module cross-links**, a cross-navigation band (industries that run it · engineering services
> behind it · portfolio position · sibling-solution cards), 2-question FAQ, and a **prev/next chain across all 20** ("Solution N of 20").
> New `SOFTWARE.solutionDetail` data layer: 20 records × (what + caps + flow + deploy + why + faq + related + services + modules),
> grounded in the uslbd.com portfolio. Entry points wired from five directions: product-grid cards (name + button), industry-page
> product chips, UniERP editions strip, and **reverse cross-links on service pages ("Solutions this practice delivers") and module
> pages ("Solutions running this module")**. Also fixed a white-on-white CTA button (missing `background:transparent`) on the dark
> bands of software-solution/software-subservice/software-erp/software-industries. Anchor-safe hashchange (in-page #anchors no longer
> wipe rendered views on solution/service pages). Self-test 46 → **48/48** (20 complete records; every cross-nav id resolves);
> click-through e2e: grid → detail → next-sibling re-render → module page, all PASS; assets on the 9 software-data pages bumped
> `?v=132`.

> **v1.3.2 — cache-busting on every asset reference (4 Oct 2026, user-reported "#ml still same, one footer visible"):**
> visual inspection of the live page (full-height render + section crops + DOM probes) confirmed v1.3.1 renders correctly —
> all seven sections, single footer at the bottom, header with 80 nav links; the "still same" page was the **browser's cached
> pre-v1.3.1 JS** (third stale-cache incident this build). Permanent fix: **all 31 pages now reference every JS/CSS asset with
> `?v=131`** (42 unique URLs), so any future file change is picked up by every browser without a hard refresh. Verified: all 42
> URLs HTTP 200, #ml re-rendered end-to-end on the fresh URLs (706KB full-height render), self-test **46/46**, no unversioned
> references remain. **Convention going forward: any edit to a shared asset bumps the version string on all 31 pages.**

> **v1.3.1 — grandchild pages enriched (4 Oct 2026, user-reported sub-service page "showing only a little"):**
> diagnosis — the page rendered correctly but was visually thin: short bare bullets, one small card, and long empty
> stretches (pixel-map confirmed sparse y580–1400 band). Rebuilt the sub-service page to match module-page substance:
> "What you get" as three gold-ruled deliverable cards, the parent's 3-step method as a timeline, the stack card with a
> scope CTA, a "Keep exploring" grid (siblings + parent), a **2-question FAQ per service** (new data: 12×2 honest Q&As —
> data readiness, code ownership, pen-test cadence, tool choice…), and a closing dark CTA band with the parent overview —
> page height grew **2087 → 2599px (+25%)**. Child service pages got the same FAQ section. Self-test 45 → **46/46**
> (12/12 FAQ completeness); 0 console errors.

> **v1.3.0 — service drill-down: child + grandchild tiers (4 Oct 2026, user-directed "each grid box must have navigation,
> child page, grandchild page, multi-stage"):** research (hub-and-spoke / pillar-child-grandchild IA; hierarchical drill-down
> with shallow depth) applied to the 12 engineering services, mirroring the product/module pattern — **main** (`software-services.html`)
> grid cards now open **child pages**: new `software-service.html` (hash-driven; no hash = 12-service directory) with overview,
> how-we-work (3 steps), sub-service grid, prev/next across all 12; each of the **3 sub-services per service opens a grandchild
> page**: new `software-subservice.html` with what-it-is, "What you get" deliverables, typical stack/methods chips, the parent's
> how-we-work, sibling sub-services, and a full breadcrumb trail. New `SOFTWARE.serviceDetail` data layer: 12 services ×
> (overview + 3 how-steps + 3 subs × (what + 3 deliverables + 3 stack items)) = **36 grandchild pages** — grounded in
> uslbd.com/services + content §06-16/17/18. Both new pages re-render on hashchange (lesson from v1.2.4). Mega deep links
> (AI/ML, Cloud) repointed to child pages; sitemap updated (32 pages). **Self-test 43 → 45** (12 children complete, 36 unique
> grandchild ids with full records) — 45/45; **click e2e: child 4/4 and an 8-step grandchild chain crossing three different
> parents, 0 failures**; 0 console errors.

> **v1.2.4 — same-page hash navigation fixed: related/paired clicks now live (4 Oct 2026, user-reported "related and
> frequently-paired clicks don't work"):** root cause — the PDP (and brand, legal, search, account pages) read the URL hash
> only at load with **no `hashchange` handler**, so clicking a related/paired/prev/next product while already on
> `product.html` changed the URL but never re-rendered: a dead click. Fix per the standard SPA pattern (already used by
> category and software-module): **`product.js` refactored into `render()` + `hashchange`** — clicking between products now
> swaps the entire page live (gallery, deep tabs, glance/assurance, companions, prev/next, recently-viewed) with scroll-to-top,
> no reload flash; **brand / legal / search / account** got a one-line reload-on-hash fallback. **Manual-click e2e on the
> reported page (`#crucial-ddr5-pro-memory`): all 8 unique cross-product links (related Crucial memory ×3, P3 via prev/next,
> paired Honeywell ×3, ARKTEK GT610) clicked one by one — 8/8 re-rendered to the correct product, 0 failures.**
> QA: 0 console errors ×6 pages, self-test 43/43.

> **v1.2.3 — 81/81 final coverage audit (4 Oct 2026, user-directed "make sure all products covered, nothing left behind"):**
> exhaustive verification, two layers — (1) **data-quality audit** over every deep record: no missing/weak heroes, no empty or
> malformed spec pairs, ≥2 specs + ≥2 features + ≥1 use-case per SKU (two stray empty spec-array elements found in
> E100/Nearity C30R and cleaned; the three "duplicate hero" flags are the intentional Unicode-hyphen mirror aliases);
> (2) **render audit of all 81 product pages** — each loaded headlessly and gated on: product-specific title, "At a glance"
> panel, "Simal assurance" panel, ≥8 spec rows, and zero console errors — **81/81 pass, zero failures**. Self-test 43/43.
> Every SKU is reachable structurally (category pagination covers all; every product has a brand page; search indexes all).

> **v1.2.2 — dead-space fill: PDP gallery column + sparse grids (4 Oct 2026, user-reported white space below the product
> image):** measured the reported page — the gallery column ran empty for ~600px while the right column continued (pixel
> scan y560–1150). Per PDP research (uxdesign.cc "Empty Spaces Are Not Our Friend" case study; standard two-column PDP with
> secondary info panels) the gallery column now carries two panels on **every** product page: **"At a glance"** (the SKU's top 4
> deep spec rows + live stock line) and **"The Simal assurance"** (genuine stock, local UAE warranty/RMA, JAFZA delivery,
> Peppol e-invoicing, quote SLA + a volume-pricing CTA) — the dead band went from ~0% to **84% content coverage** (verified
> by pixel scan + DOM markers). Same-pattern audit: **sparse category grids** (laptops has 3 SKUs, monitors 6) left a hole
> under the grid — categories with ≤6 results now close with a "Not exactly what you need?" help band (RFQ CTA, all-categories
> link, ask-the-desk, cross-category chips); hidden automatically on full categories. QA: 0 console errors, 43/43 self-test.

> **v1.2.1 — 81/81 dedicated product deep pages + visible hover (4 Oct 2026, user-reported "not working, use hover on color"):**
> diagnosis first — an elementFromPoint hit-test proved card clicks DO navigate (image/name/meta all hit the overlay
> anchor); the perceived failure was browser-cached v1.2.0 assets plus too-subtle hover. Fixes — (1) **hover now shows
> color**: blue border, blue-tinted image panel, stronger shadow + lift, and the "View details" affordance became a
> filled chip (a stale V2-era gold rule that overrode the hover was removed); (2) **every one of the 81 SKUs now has a
> dedicated deep record** — new `data/product-deep.js` with a hero marketing line, a 2–6 row key/value spec table,
> 3 key features and best-for use cases per product, hand-curated from content §03 + SKU decoding (e.g. CP2K16G64C38U5B
> = 16GB DDR5-6400 CL38) + §04 brand lines, with the three Unicode-hyphen mirror duplicates aliased — **coverage gate:
> 81/81 verified by node script and by a new self-test assertion (43 total, all passing)**. The PDP renders the deep
> record: hero line under the title, spec table above the channel facts, per-product features and best-for lists in the
> Features tab. QA: 0 console errors, sample PDPs across all categories verified (spec rows 9–12, features, prev/next).

> **v1.2.0 — product grid → PDP depth navigation (4 Oct 2026, user-directed "product grid has no navigation flow, each level deeper"):**
> researched PDP conventions for IT distribution (tabs = the standard: Overview | Specifications | Documentation |
> Accessories, per uxpatterns.dev, Shopify B2B 2025, Rock Techno Labs; Newegg/CDW-style breadcrumbs + docs links) and
> distilled the content package §03 (7 category guides) + §04 brand lines into a runtime depth layer. **Level 1 — grid:** every
> product card is now fully clickable (stretched-link overlay: image, name, body all navigate to the PDP; RFQ button floats
> above) with a "View details →" hover affordance — applies to every grid site-wide via `S.card` (category, search, brand,
> home featured, related). **Level 2 — category page:** a gold-ruled **buying-guide panel** (intro + 3 proof points per
> category, content §03) appears above the filtered grid. **Level 3 — PDP rebuilt as a deep-dive:** five tabs —
> Specifications (enriched table incl. model ref, lead-time, pricing model), Overview (+ Arabic CMS copy preserved),
> **Features & use cases** (brand line from §04 + category guide + compare/brand/category cross-links), **In the box &
> accessories** (box contents + frequently-paired accessory SKUs), **Documentation** (datasheet library, warranty/RMA terms,
> how channel buying works, bulk pricing). Plus **prev/next within category**, "category listing" center link, a
> full accessories companion section, and a **recently-viewed engine** (`S.recent`, localStorage, cap 8) rendered on both
> PDP and category page. **Self-test 39 → 42** (overlay present, recent tracking + cap, all 7 guides) — **42/42**;
> site-wide crawl re-run: 0 console errors on all 30 pages, all internal links resolve.

> **v1.1.3 — no-dead-ends round two (4 Oct 2026):** visual inspection of the module pages (finance) came back
> clean/enterprise-grade; two remaining keyword dead-ends closed — (1) the module Overview panel's capability chips
> (e.g. "Accounts Payable") now **click-jump to the Capabilities tab and highlight the matching card** (click-tested:
> chip → tab switch + scroll + gold highlight verified); a hint line explains the interaction; (2) **reverse cross-links**:
> every product card on the products page now shows "Used in: → industry" links back to the verticals it serves (all 9
> industries reachable from the catalog — both directions of the product↔industry graph now navigate). QA: 39/39
> self-test, 0 console errors, renders refreshed. **Site-wide audit (4 Oct 2026):** all 30 pages dumped and crawled —
> **1,801 internal links validated against rendered DOM**: 0 missing files, 0 broken anchors (remaining flags triaged as the
> established hash-driven patterns — product/brand/category/legal/admin-review/software-module read the hash at load; verified
> live: `#memory` filters the catalog, `#crucial-p510` renders the product page, `#privacy` the legal section, `#hr` the module);
> 0 console errors on all 30 pages; self-test 39/39.

> **v1.1.2 — no-dead-ends: UniERP module library (3 Oct 2026, user-directed "no dead end, every subsection navigates"):**
> research (NN/g popup guidelines, Smashing Magazine modal-vs-page decision tree, SAP Fiori object-page pattern) says deep
> content belongs on **deep-linkable detail pages**, not popups — so the 7 ERP modules (previously title + one line, no
> navigation) now each have a full detail page. New **`software-module.html`** (hash-driven like product.html): no hash = library
> index of all 7; `#finance` etc = detail with breadcrumb, hero, **tabbed panels (Overview / Capabilities / Why this module)**,
> "Pairs with" related-module cards, and **prev/next module navigation** — every exit leads somewhere. Content distilled from
> content package §06-02…07 (Finance 5 capability groups incl. GL/AR/AP/Bank/Reporting; HR incl. WPS payroll + UAE labor law;
> CRM; Inventory; Manufacturing; Projects; UniVAT NBR/Peppol). The module cards on **both** `software-erp.html` and the hub's
> module grid now link into their detail pages ("Module detail →"); Software mega gained "ERP module library (7)"; sitemap
> updated. **Self-test 36 → 39 assertions** (7 detail entries, every erpModules card maps to a page, no dead related-ids) —
> **39/39 pass**; tab switching click-tested (Overview→Capabilities→Why verified in-browser); 41/41 mega targets resolve;
> 0 console errors.

> **v1.1.1 — polish iteration: gap/discrepancy audit + professional navigation (3 Oct 2026, user-directed "no gaps, no discrepancies"):**
> audit found and fixed five real issues — (1) **hub showed the wrong services**: `software.html#services` rendered the 12
> IT/cabling lines (SOLUTIONS) under an "Engineering services" heading; now renders the actual 12 software practices from the
> uslbd research, each linking to its `software-services.html#id` detail; (2) **8-vs-9 vertical discrepancy**: hub heading said
> "Eight verticals" and listed the old 8 chips — now "Nine verticals", chips render the 9 researched verticals and link to
> `software-industries.html#id` (+ "All 9 verticals" link-out); (3) **no sub-site navigation**: added a shared gold-underline
> **tab strip** (Software home · UniERP · Products · Services · Industries) under the hero of all five software pages, active
> state per page (pixel-verified); (4) **home spotlight cards all linked generically** to software.html — now deep-link
> (Distribution ERP → software-erp.html, UniPOS → #unipos, UniVAT → #univat, with sharpened copy); (5) **site search was blind
> to the software business** — search now suggests matching software products ("UniPOS…" → product anchor) and the five section
> pages (query "erp" → 3 page suggestions). Also: `scroll-margin-top` on anchored cards/sections so deep links land clear of the
> sticky header. **Self-test expanded 30 → 36 assertions** (software portfolio integrity: 20 products, 10+10 split, 12 services,
> 9 unique industry ids, unique product ids, flagship anchors) — **36/36 pass**; console sweep clean on 20 pages incl. hash
> deep-link URLs (#unipos, #aiml, #banking).

> **v1.1.0 — software sub-site: every Software Services menu item gets its own page (3 Oct 2026, user-directed):**
> comprehensive uslbd.com research (home, /services, /products, /solutions) captured the full Unisoft portfolio —
> **20 products** (10 industry ERPs: Distribution, Retail, Garments, MPS, UniVAT, UniPOS, Education, Field-Service,
> Hotel, Hospital + 10 specialized: e-commerce, weather production, cattle, queue, collection & recovery, loan,
> custodian banking, i-Portal, asset, merchant banking), **12 engineering services** (with sub-services), **8 solution
> verticals**, and company facts (founded 2015, 40+ engineers, 150+ projects, 98% on-time, 100+ clients, 95% retention,
> ISO 9001/27001, SOC 2, BASIS, 60–70% cost advantage). Per management direction, Unisoft's services are presented as
> **Simal's software solution services** (engineered with Unisoft, delivered regionally by Simal). New pages, each a
> dropdown destination: **`software-erp.html`** (UniERP flagship — TCO table, 7 modules, industry editions, demo CTA),
> **`software-products.html`** (all 20 products, family filters + GCC lead-line filter, deep-linkable #anchors),
> **`software-services.html`** (12 practices + engagement models + credentials), **`software-industries.html`**
> (9 verticals — 8 from uslbd + agriculture from content §15 — each cross-linked to its serving products).
> **`software.html`** reworked as the hub (portfolio-map section, updated stats); **Software mega rebuilt** with 11
> descriptive links, every item landing on a detail page (UniPOS/UniVAT/AI/healthcare/banking deep links); Software
> nav highlights on all software-* pages; footer Services column rewired; sitemap.html/SITEMAP.md updated (29 pages).
> New data layer: `data/software.js` (window.SOFTWARE — products/services/industries/creds).

> **v1.0.9 — dropdown open/close state machine (3 Oct 2026, user-reported "menus not closing"):**
> root cause — every nav item is a `tabindex=0` div and v1.0.7's CSS opened megas on `:focus`/`:focus-within`;
> a plain mouse click gives the item focus, and that focus pinned the panel open forever (hover-away did nothing;
> reproduced: click → mouse away → panel still `display:grid`). Fix — open state now has a single source:
> the `.open` class driven by a state machine in chrome.js. **Removed the `:focus`-open CSS** (bare focus from a mouse
> click never opens or pins a menu); hover in/out stays pure CSS; **click toggles** (open ↔ close, closes siblings —
> real toggle support for touch); **keyboard** Tab/arrows focus opens via a `keyNav` flag + `:focus-visible`, and
> pointer-caused focus is excluded via a capture-phase `mousedown` flag so a mouse click can't double-toggle (the
> focusin-open + click-toggle race that made the first click appear dead); **Enter/Space** on a focused item toggles;
> and everything closes on: **Esc** (document or item), **click outside the header**, **focus moving away**, and
> **mouse leaving the nav strip** (panels are DOM descendants, so moving item → panel does not fire the leave).
> Verified by a 13-scenario scripted interaction e2e run in a real headless browser (click-open, mouseleave-close,
> toggle, switch, outside-click, Esc ×2, Tab-open, focus-away-close, link-in-panel keeps menu open while navigating,
> Enter-toggle) — 13/13 pass — plus visual renders of the click-opened panel and the post-outside-click closed state
> (screenshots/idx-open.png, idx-closed.png). Regression: 0 console errors on 24 pages, self-test 30/30.

> **v1.0.8 — dropdown repair + hero slide fix (3 Oct 2026, user-reported visual defects):**
> user reported broken dropdowns and a broken hero. Root causes found and fixed —
> (1) **right-hand menus clipped off-screen**: Partners/Insights/About dropdowns anchored to nav
> items at x≈720–994 pushed 880px panels past the viewport (Partners started at x=−65; Solutions
> overflowed +41px right). Fix: `alignMegas()` in chrome.js measures each panel (hidden pre-pass)
> and clamps it fully inside the window (10px margins), re-run on resize — all 8 menus now fit at
> any width (verified geometrically: FITS ×8). (2) **promo tiles covered menu titles**: the blue
> tiles used `grid-row:1/span 4`, colliding with the full-width `<b>` titles at row 1 — now
> `grid-row:2/span 5`, verified visually. (3) **Products/Brands menus had mixed link styles**:
> category and brand links were flat (no icon/description) next to rich `li()` links, breaking row
> alignment — megaCats now render with per-category icons + spec descriptions, megaBrands with
> monogram initials + the real brand taglines from the content package (§04). (4) **hero slide
> image floated absolutely** (`right:-8px;bottom:-6px`) and collided with headline/CTAs/dots — the
> slide is now a flex two-column layout with the product photo inside its own translucent rounded
> panel (visually verified: no overlap, balanced). (5) **dead/jumped anchors**: "AMC SLA tiers"
> now targets the real SLA table (`solutions.html#amc-tiers` — anchor added), "Implementation —
> 7 phases" targets `software.html#impl` (anchor added); Home menu enriched to 6 links (adds
> Software Services + Become a Partner). (6) megadebug QA mode now renders the pinned menu exactly
> as hover renders it. **Menu audit: 34/34 dropdown targets resolve** (file + anchor, incl.
> product.html hash-as-slug); QA: 0 console errors on 20 pages, self-test 30/30.

> **v1.0.7 — mega-menu v2 + missing destinations (3 Oct 2026, user-directed menu inspection):**
> all eight header dropdowns rebuilt per 2026 research (descriptive links, sparing promo tiles, keyboard a11y) —
> every link now carries an icon + one-line description, the Products and Software menus gained **blue promo tiles**
> (P510 "just landed" with photo; ERP-demo CTA) and footer hint rows, menus open on keyboard focus (`:focus-within`,
> `tabindex`, focus-visible outlines). **Gaps found vs the content package and filled:** Compare products (§03-83) →
> new working `compare.html` (preset Crucial SSD tier table with real speeds + dynamic 4-SKU comparison); ROI
> calculator (§06-20) → working calculator on `software.html#roi` (license + admin + process savings, 3-yr figure);
> Datasheets (§08-05) → `resources.html#datasheets` per-category library; Awards anchor, Brands overview, AMC SLA
> tiers, Implementation and Orders links added to their menus. **QA tooling:** `#megadebug` + `?m=N` URL mode pins any
> menu open for inspection — all 8 menus screenshot-verified (screenshots/menu-1…8.png). QA: 11/11 gates, 0 console
> errors, self-test 30/30.

> **v1.0.6 — deep content integration (3 Oct 2026, second content pass, user-directed "precise and proper"):**
> full-file reads of the content package replace approximations everywhere — **Home** rebuilt per §01: 7-slide campaign
> carousel (KOORUI / Crucial T500 / DDR5 / HIKSEMi / UGREEN / Aiwa / Nearity — real copy + real product photo per slide,
> auto-rotate 5s, dots), counters now include **300+ team members**, featured-products strip with the 12 exact named SKUs,
> brand showcase in the 4 themed rows, awards renamed to the precise **"HIKSEMi Best Distribution Partner 2025 — MEA
> National Distributor Summit"**; **Solutions** replaces invented AMC tiers with the real Basic/Standard/Premium SLA table
> (1h/4h/NBD response, 24×7×365 premium); **Software** adds Starter/Professional/Enterprise pricing packages and the
> 7-phase implementation timeline; **Careers** lists the 12 real job codes (UAE-001…012 with experience bands);
> **Contact** shows the 4 real locations incl. the Dhaka software center; **Brand pages** carry each brand's real
> tagline + positioning (20 mapped); **Account** gains an Orders & Invoices tab (B2B §12). Reconciliations kept: TwinMOS
> sentence in content §01 excluded (management correction), Sun–Thu hours kept with the discrepancy flag, revenue figure
> omitted (implausible vs profile — flagged), brand count stays at verified 23. QA: 15/15 gates, 0 console errors,
> carousel hero visually verified, self-test 30/30.

> **v1.0.5 — content-package integration + full dropdown nav + site map (3 Oct 2026, user-directed):**
> integrated the `../content` package (20 sections, 261 files) — **every nav item now has a dropdown/mega submenu**
> (Home: popular links; Software: UniERP/modules/industries/demo; Solutions: 5 flagship practices; Partners:
> tiers/reseller/portal; Insights: cases/papers/FAQ/press; About: leadership/mission/why/CSR). New `data/content.js`
> carries the structured content. Page upgrades: **software.html rebuilt as the UniERP landing** (Odoo 19 CE, $0-license
> TCO table vs SAP/Oracle/Dynamics, 7 modules, 8 industries), **solutions.html** gained the 5 flagship practices
> (AMC, AV/Nearity, Cloud Security, Data Recovery, Firewall/Sophos) above the 12 mirror lines, **about.html** gained
> mission/vision/values, board of directors (3 named), why-choose and CSR sections, **onboarding.html** opens with the
> 3-tier partner program (Authorized/Premier/Elite), **careers.html** lists 8 departments (Dubai + Dhaka).
> **New pages:** `resources.html` (8 case studies, white papers, FAQ, press room), `legal.html` (7 policies, tabbed),
> `sitemap.html` (visual map of all 29 pages) + `SITEMAP.md` (full IA incl. build-phase §12-20 mapping). Footer legal
> links now resolve. QA: 14/14 new gates, 0 console errors across 9 changed pages, all 23 screenshots re-rendered,
> self-test 30/30.

> **v1.0.4 — header visual + UX enhancement (3 Oct 2026, after zoomed visual inspection + 2026 research):** new slim
> gold **announcement strip** at the very top (dismissible, remembered — promotes the real P510 launch); search pill
> enlarged to 46px with darker placeholder text and a gold focus glow; Sign-in given real weight; gold "Become a
> Partner" CTA gains a deep-gold border + soft glow; utility-bar items highlight on hover; mega-menu carets rotate
> on hover with a slide-in animation; **sticky condensed mode** — scrolling past 220px (or `#mini`) collapses the
> announcement + utility tiers and compacts the main bar to 62px so logo/search/RFQ/CTA stay persistent (CDW-style,
> per 2026 B2B sticky-CTA practice); `/` keyboard shortcut focuses search. Zero console errors; both normal and mini
> modes visually verified; self-test still 30/30.

> **v1.0.3 — landing-page visual enrichment (3 Oct 2026, user-directed after section-by-section visual inspection):**
> every previously text-only section now carries real imagery or a visual anchor — hero RFQ basket rows show real
> product thumbnails (a 3-item demo basket seeds on first visit), the dual-business cards gained a 3-photo hardware
> strip and a live "Distribution ERP" mini-dashboard panel, software cards got icon tiles, the testimonial gained an
> initials avatar with gold ring, award cards use structured icon tiles, and insight cards use real product-photo
> covers. All visuals are real mirror assets or CSS — no invented vendor logos. Verified: 0 console errors, all
> changed sections visually confirmed, screenshot re-rendered.

> **v1.0.2 — real brand identity (3 Oct 2026):** replaced the placeholder "S" monogram with the **actual Simal logo
> from the mirror** (`wp-content/uploads/2020/10/`): the blue/red wordmark (`#005AA9` / `#E01C24` — matching the
> documented brand palette) plus the site's white variant. Assets were enhanced in `assets/img/brand/` (10 files):
> transparent-padding trimmed, staircase edges smoothed, white variant recolored to pure white, LANCZOS-resized
> 1200/600/360px sets, and a navy favicon tile (32/96) cut from the wordmark. Now used: header (all chrome pages),
> footer, login brand panel, Arabic page, all Admin/CMS sidebars, and favicons on every page. Verified: 0 console
> errors, all 20 screenshots re-rendered, logo presence confirmed by pixel + visual checks on light and dark surfaces.

> **v1.0.1 — audit pass (3 Oct 2026):** console-error sweep across all 21 pages found
> and fixed a missing `data/insights.js` include (the home insights section silently
> died); fixed the product-page WhatsApp link to rebuild with the current quantity on
> click; extended the self-test from 25 to **30 assertions** adding end-to-end RFQ
> (basket → reference → history → cleared) and KYC (submission → queue → reviewer
> decision persists) integration checks; verified the IBAN validator against the
> official CBUAE example (`AE07 0331 2345 6789 0123 456`, MOD-97 confirmed); catalog
> data-quality audit clean (zero encoding artifacts, zero empty fields).

## Run it

No build step, no server required — open `index.html` directly, or serve it:

```bash
cd F:\software_project\Sofoware_project_04\Simal_Corporate_website
python -m http.server 8000
# → http://127.0.0.1:8000/Prototype/index.html
```

Everything persists in the browser (localStorage): RFQ basket, submitted RFQs,
KYC applications and drafts, CMS overrides, demo leads, enquiries, job applications.

## Pages (20 + self-test)

| Page | What works |
|---|---|
| `index.html` | Home — live mini-basket, data-driven trending grid, real testimonial rotator, insights preview, hero + header search |
| `category.html#cat` | Full catalog: category facet (7 real categories + counts), brand facet, in-stock filter, 4 sort modes, 12/page pagination — all 81 SKUs |
| `product.html#slug` | Any of the 81 products: real photo gallery with thumbnail switching, real mirror description, spec table, qty stepper → RFQ, WhatsApp handoff, related by brand, EN/AR tabs (AR reads CMS overrides) |
| `brand.html#brand` | 18 brand landings with real SKU counts, category mix, in-stock stats |
| `search.html#q=` | Site-wide search: ranked, typo-tolerant, brand/solution suggestions (FRS-SR-05) |
| `rfq.html` | The conversion engine: basket table with steppers, full validation, **SIMAL-RFQ-YYYYMMDD-NNNN** reference on submit, WhatsApp handoff |
| `onboarding.html` | 7-step KYC wizard (FRS §21.5): per-step validation, **TRN 15-digit** check with live **Peppol `0235:` preview**, **UAE IBAN 23-char MOD-97** validation, autosave + resume, review & submit → lands in the admin queue |
| `login.html` | Mock auth (any valid email + 8-char password); `…reviewer@…`/`…admin@…` routes to the admin console |
| `account.html` | Partner home: KYC status timeline (reads real applications), RFQ history, document vault, notifications |
| `software.html` | Simal + Unisoft line: 12 practices from data, working demo-request form |
| `solutions.html` | The real 12 service lines from the mirror + AMC tiers, deep-links into contact routing |
| `about.html` / `contact.html` / `careers.html` / `insights.html` | Independent-company story, entities, milestones, awards, real testimonials; routed enquiry form with SLA table; roles + application form; real blog content + gated download |
| `ar.html` | Arabic RTL home — mirrored chrome, Western numerals per convention |
| `admin-queue.html` | **Working admin console**: SLA aging, KPIs, TRN/Peppol data-quality donut, live queue (your wizard submissions appear here), demo-reset |
| `admin-review.html#KYC-ref` | Field-by-field approve/⚑ flag, notes → decision rail persists to the application (applicant sees it in `account.html`) |
| `cms.html` | Content studio: AR-coverage gaps, override count, photo coverage, claims register, hours single-source |
| `cms-editor.html#slug` | Edit any of 81 SKUs EN/AR → **saves become live on `product.html`** (same browser); RTL live preview; revert to mirror original |
| `test.html` | **Self-test suite — 25 assertions** (validators, MOD-97, search, basket, references, seeds). Open it: all green |

## Data & FRS traceability

- `data/catalog.js` — 81 products extracted from the mirror's WooCommerce JSON-LD
  (name, SKU, brand, category, descriptions, spec fragments, image paths, stock).
  Generated by the extractor from the mirror's `product/*` (mirror lives outside the repo — `../../Mirror_site`).
- `data/brands.js` / `solutions.js` / `testimonials.js` / `insights.js` — mirror-sourced.
- `assets/img/products/` — 85 real photographs copied from the mirror.
- Business rules implemented per **FRS v1.3**: TRN = 15 digits (FRS-K), Peppol ID =
  `0235:` + TRN, UAE IBAN = 23 chars with MOD-97 checksum, RFQ reference =
  `SIMAL-RFQ-YYYYMMDD-NNNN`, 2-business-day KYC review SLA, no-list-price RFQ model
  (mirror lists every product at AED 0.00 — enquiry-only confirmed), claims pending
  verification are registered not published, hours discrepancy flagged.

## Verified

- 22/22 page render gates (headless DOM dump proves every page's JS executes).
- 30/30 self-test assertions (see `test.html`).
- Visual QA: 3-tier header, blue→gold hero, credential strip, real-photo grids
  (home/category/product), panels — screenshot-verified (see `screenshots/`).
- Fixed during QA: chrome injection raced the parser (now DOMContentLoaded-guarded).

## Known prototype limits (by design)

- Mock auth (no real backend/MFA), simulated document upload, email notifications
  are toasts, prices are RFQ-only, admin/CMS operate on browser-local data.
- Arabic is a home-page demonstration + CMS-editable product content; full-site AR
  is build-phase scope (FRS-LN).
