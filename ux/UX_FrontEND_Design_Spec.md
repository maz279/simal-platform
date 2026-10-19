# UX & Frontend Design Specification + Prototype Manifest

## Simal Digital Platform — Design System, Key Pages, Admin & CMS Panels

| Field | Detail |
|---|---|
| **Document Title** | UX & Frontend Design Specification and Prototype Manifest |
| **Version** | 2.2 |
| **Date** | 3 October 2026 |
| **Status** | Design deliverable — for stakeholder review; basis for build-phase UI |
| **Location** | `F:\software_project\Sofoware_project_04\Simal_Corporate_website\UX_FrontEND\` |
| **Upstream family** | BRD v1.3 · URD v1.2 · PRD v1.4 · FRS v1.2 (in `Primary_doc/`) — every screen herein traces to FRS requirements; traceability notes per page below |
| **Research base** | 2026 enterprise/B2B design-direction research (conversion-focused heroes, self-service portal patterns, clean design systems) and admin/CMS panel best practice (RBAC-aware collapsible sidebars, data tables with sort/filter, scalable component libraries); **V2 redesign benchmarked on direct inspection of the three reference distributors — CDW (3-tier header, mega-menu anatomy, alternating content/product cadence), Redington (utility strip + region switcher, 4-column mega-menus, credential stats band, 3-zone footer with enquiry CTA), Ingram Micro (eyebrow+H2 rhythm, dual customer/vendor conversion cards, certification stripe)**; brand palette from logo extraction (#0050A0 / #E01020 / #F0F000 — verified WCAG ratios per URD ACC-3); all content facts from the workspace mirror audit and document family |
| **Change Record** | v1.0 — Initial design package: design system, 18 page designs (14 public incl. Arabic RTL, 2 Admin, 2 CMS), 18 PNG renders, specification.<br>v1.1 — Audit pass 7: **added the brand landing page** (`public/15-brand.html`, Crucial — FRS-C-09 M-priority template previously missing from the package) and a **prototype index** (`index.html`) linking every page for reviewers; added missing CSS classes `.b-err`/`.hero-trust`; fixed RFQ basket count (3 brands, not 2); fixed admin-review TRN flag narrative (MOD-97 checksum mismatch — displayed value is 15 digits); visual QA completed on 7 of 20 renders (home, product, admin-review, cms-editor, AR home, wizard, plus re-checks). **Not yet designed (documented gap):** search-results page (FRS-SR-05, S-priority) — recommended for the build phase alongside facets refinement.<br>**v2.0 — User-directed premium redesign ("Navy & Gold Executive") after stakeholder review found v1 unsatisfactory:** (1) **Gold-gradient system added to the design system** per direction — four families: white→gold, blue→gold, green→gold, rose→gold (tokens `--grad-white-gold/blue-gold/green-gold/rose-gold` + `--grad-gold-text`, `--grad-gold-btn`, gold ramp `--g1..g5`), applied as: home/about/brand/careers heroes = blue→gold, Software Services hero = rose→gold, IT Solutions hero = green→gold, login brand panel = blue→gold, credential strip & KPIs = navy→gold with gradient-text numerals, buttons gain gold sheen sweep on hover, `.btn-gold` premium CTA added. (2) **Header rebuilt to a professional 3-tier architecture** benchmarked on CDW/Redington: Tier 1 navy utility bar (phone/email/hours · KYC portal link · EN/AR switch · socials), Tier 2 white main bar (logo · 520px search pill with gold focus ring · Sign in · RFQ pill with gold count · gold "Become a Partner"), Tier 3 sticky blue-gradient nav strip with gold underline on active item and hover mega-menus (Products with SKU counts, Brands with 23-line authorization, About) — injected into all 14 chrome pages + AR RTL variant (fully mirrored, verified). (3) **Footer rebuilt to a 5-zone architecture** benchmarked on Redington/CDW: newsletter CTA band (blue→gold, FR-EM-12 pattern), 5-column navy main (brand · products · services · company · contact entities), 23-brand chips strip (13 verified names + "+10 more"), certification row (Bur Dubai/JAFZA presence · 23 vendors · UAE PDPL · Peppol 2027 · ISO 9001/27001 attributed to Unisoft), legal bar (PDPL rights, sitemap). (4) Removed the v1 pre-footer CTA banner from home (redundant with the new newsletter band). (5) Panel polish: sidebar active item gradient, KPI gradient fills, gold tab underline. (6) All 20 PNGs re-rendered and content-cropped; visual QA passed on home header, footer stack, login split, RTL header, footer-logo zoom, plus pixel-probe verification of every gradient family (rose/green/blue/gold endpoints confirmed in-render).<br>**v2.1 — Management correction, corporate independence (3 Oct 2026):** Simal Technologies ME LLC is a **fully independent company with no TwinMOS/Smart Group association** — all such content removed from the prototype: footer brand column rewritten ("Independent IT distribution house"), certification badge swapped from "TwinMOS Group company" to "Bur Dubai office · JAFZA warehouse", TwinMOS removed from the footer brand chips and header Brands mega-menu (**brand count corrected 24 → 23 everywhere** — home credential strip, dual-business card, cert badge, AR "23 علامة عالمية"; note the mirror catalog never listed a TwinMOS product, so the 76-SKU catalog is unchanged), About mega-menu renamed "About Simal Technologies", the About page group section rewritten as "One company, end-to-end capability" with the TwinMOS entity card removed (Simal · StarSeed · Stellent · Unisoft as software delivery partner), software hero "delivered by the group" → "delivered by the team", "sister concern/company" phrasing for Unisoft replaced with "software delivery partner", and the AR footer/mega equivalents fixed. All 20 PNGs re-rendered. Document family synchronized: PRD v1.5 · BRD v1.4 · URD v1.3 · FRS v1.3 · SRS v1.1.0.<br>**v2.2 — Real-content upgrade from the site mirror (`../Mirror_site`, user-directed):** the mirror's WooCommerce JSON-LD was extracted into **`assets/data/simal_catalog_extract.json`** (81 product records — 76 unique SKUs after variants; name/SKU/category/description/local image per record; all listed prices are AED 0.00, confirming the enquiry-only/RFQ model), and **19 real product photographs** were copied to **`assets/img/products/`**. Key pages rebuilt with real data: **Home** — "Trending in the channel" now shows 5 real SKUs with real photos (Crucial T705 NEW, KOORUI 27″ 240Hz BEST SELLER, Samsung T7 Shield, UGREEN 5-in-1 hub, Kingston XS1000) and the testimonial is the real Mercans quote (Jasper Guevarra, Technical Support Manager — from `customer-feedback`; replaces the v1 placeholder persona); **Category** — 9-card storage grid of real SKUs with photos, real counts ("1–9 of 28 storage SKUs"), breadcrumb updated; **Product (T705)** — real photo gallery (main panel + 4 thumbnails, `.pgal`/`.pthumbs` components), description text now the mirror's own copy, related-products cards carry real photos; **Brand (Crucial)** — all 8 range cards carry real photos and the range chips show real counts from the extract. Sweep fixes shipped with this pass: header mega "24 brands"→"23" on every page (missed in v2.1), home eyebrow "One group, two engines"→"One company, two engines" and the ERP card's "by a group that…" → "by a partner that…" (association phrasing), About badge and Insights line-card "24"→"23". All 20 PNGs re-rendered (delete-first after a stale-write bug was caught by mtime checks) and image refs verified resolving (0 missing). CSS additions: `.ph.has-img` real-photo card media, `.pgal` gallery, `.pthumbs`. |

---

## 1. Package Contents (Manifest)

| Path | What it is |
|---|---|
| `UX_FrontEND_Design_Spec.md` | This document |
| `index.html` | **Prototype index** — one-page navigator linking all 20 designs (reviewer entry point) |
| `assets/styles.css` | The design system — tokens, typography, components, RTL rules (single source of styling truth for all pages) |
| `assets/img/products/` | **19 real product photographs** extracted from the site mirror (Crucial/KOORUI/Samsung/UGREEN/Kingston SKUs) |
| `assets/data/simal_catalog_extract.json` | **Full catalog extract** from the mirror's WooCommerce JSON-LD — 81 product records (name, SKU, category, description, local image path, price, stock) for the build phase |
| `public/01-home.html` | Landing page (EN) — hero + RFQ mini-basket, credential strip, dual-business split, best sellers, software spotlight, testimonials/awards, insights, partner CTA |
| `public/02-category.html` | Category listing — facets, sort/pagination, SEO intro, product grid |
| `public/03-product.html` | Product detail — gallery, authorization badge, spec table, Add-to-RFQ/WhatsApp, related |
| `public/04-rfq.html` | RFQ basket + contact form — the conversion page (SIMAL-RFQ reference, SLA, consent) |
| `public/05-software.html` | Software Services landing (Simal + Unisoft) — credibility, 15 products, 12 services, case study, engagement models |
| `public/06-solutions.html` | IT Solutions & Services — 12 lines, industry chips, AMC tiers |
| `public/07-onboarding.html` | **KYC onboarding wizard** — 7-step progress (step 3: TRN/Peppol with format guidance), autosave, fix-only-flagged, trust sidebar |
| `public/08-login.html` | Login / create-account split screen — unified account messaging, MFA notes |
| `public/09-account-dashboard.html` | Partner Home — KYC status, RFQ history, document vault with expiry alerts, notifications |
| `public/10-about.html` | About — independent company story, UAE entities + Unisoft partner, milestones timeline, awards, leadership, coverage |
| `public/11-contact.html` | Contact — 3-entity directory, routed enquiry form (represent-type taxonomy), WhatsApp |
| `public/12-careers.html` | Careers — EVP, open roles, application form, speculative CTA |
| `public/13-insights.html` | Insights hub — featured story, cards, newsletter (double opt-in), gated downloads |
| `public/14-home-ar.html` | **Arabic RTL home** — full right-to-left demonstration of the design system |
| `public/15-brand.html` | **Brand landing page (Crucial)** — authorization badge near CTA, range grid by category, why-buy trust cards, brand insights, partner CTA (FRS-C-09 SEO pattern) |
| `admin_panel/admin-queue.html` | **Admin panel (separate)** — KYC applications queue: SLA aging tiers, KPIs, TRN/Peppol data-quality donut, expiring docs |
| `admin_panel/admin-review.html` | **Admin panel** — application review: field-by-field approve/flag, document side-by-side viewer, decision rail, audit trail |
| `cms_panel/cms-dashboard.html` | **CMS panel (separate)** — content studio: AR-coverage gap, claims register, content calendar, single-source hours |
| `cms_panel/cms-editor.html` | **CMS panel** — bilingual product editor: EN/AR tabs, **RTL live preview**, specs/variants, SEO, media, publish box |
| `screenshots/*.png` | **20 rendered images** of every page above (1440px wide, full content height, V2 design) — the image-format deliverable |

**Totals:** 20 HTML pages (incl. index) · 20 PNG renders · 1 design-system stylesheet · 1 spec.

---

## 2. Design System (assets/styles.css)

### 2.1 Tokens

| Token | Value | Usage |
|---|---|---|
| `--blue` | `#0050A0` | Primary brand — buttons, links, active states (**7.91:1 on white — AAA**) |
| `--blue-700/-600/-100/-050` | darker→lighter ramp | hover, gradients, tints |
| `--red` | `#E01020` | Accent CTAs, awards, alerts (**4.92:1 — AA pass**) — never body text |
| `--yellow` | `#F0F000` | **Accent/highlight backgrounds only** (1.22:1 as text — prohibited per URD ACC-3); used on hero badge, primary-on-dark CTA, brand ribbon |
| `--ink / --slate / --line / --bg` | `#0B1B2B / #47586B / #DCE4EE / #F6F9FC` | text, secondary text, borders, canvas |
| `--ok / --warn / --danger` | green/amber/red semantics | status system |
| Radius scale | 8/12/16/24 | inputs → cards → hero cards |
| Shadow scale | `--sh-1/2/3` | layered elevation, brand-tinted `sh-3` |
| Typography | Segoe UI / Inter / system stack; scale 12→46 | no webfont dependency (works offline in renders) |

### 2.2 Component inventory (all implemented in CSS)

**V2 (Navy & Gold Executive):** 3-tier header (`.u2` utility → `.h2main` main bar → `.h2nav` sticky gradient nav with `.mega` panels and gold active underline) · 5-zone footer (`.f2-cta` newsletter band → `.f2-main` 5-column → `.f2-brands` chip strip → `.f2-cert` certification row → `.f2-legal`) · gradient utilities (`.g-blue-gold`, `.g-white-gold`, `.g-green-gold`, `.g-rose-gold`, `.gt` gradient text, `.gold-line`) · `.btn-gold` premium CTA + sheen-sweep hover on primary buttons · `.search2` wide search pill with gold focus ring · `.rfq-pill` with gold count badge · hero variants `.hero-rose` / `.hero-green` · `.card-g` white-gold card · `.badge.b-gold`.

**V1 (retained, still in use):** hero (gradient, radial brand glows, glass RFQ card) · credential strip · product cards · facet panel · breadcrumb · data tables · badges/chips · buttons (primary/accent/outline/ghost/WhatsApp/lg/sm/block) · forms (field, input states incl. `.err`, bilingual error pattern, consent) · 7-step wizard progress (done/on/todo states) · **panel shell** (dark sidebar + RBAC nav groups + badge counters + topbar + KPI cards) · queue items with SLA left-borders · alerts (info/ok/warn/err) · tabs · timeline · sparkline bars · donut (conic-gradient) · avatar · brand ribbon (blue/red/yellow tri-band) · **RTL overrides** (`[dir="rtl"]`, extended to the V2 header/footer tiers).

### 2.2a Gold-gradient system (V2 — user direction)

| Family | Token / class | Applied to |
|---|---|---|
| Blue → gold | `--grad-blue-gold` · `.g-blue-gold` · `.hero` default | Home/About/Brand/Careers heroes, newsletter CTA band, login brand panel, `.kpi.blue` |
| White → gold | `--grad-white-gold` · `.g-white-gold` · `.card-g` | Section surfaces, premium cards |
| Green → gold | `--grad-green-gold` · `.g-green-gold` · `.hero-green` | IT Solutions hero (services = green family) |
| Rose → gold | `--grad-rose-gold` · `.g-rose-gold` · `.hero-rose` | Software Services hero (red family = software accent) |
| Gold text | `--grad-gold-text` · `.gt` | Hero `em` highlights, credential numerals |
| Gold CTA | `--grad-gold-btn` · `.btn-gold` · `.lg-mark` (footer) | "Become a Partner", Search button, RFQ count, nav active underline |
| Gold ramp | `--g1 #F7DF8E → --g5 #7A5A14` | borders, hovers, focus rings (`--g3` on search focus) |

### 2.3 Accessibility decisions baked in

Contrast-verified palette (above); touch targets ≥44px at ≤768px; focus rings on inputs; `prefers-reduced-motion` respected on counters/carousels; static-first rendering (credentials readable without JS — fixes the live site's "0+" defect, FRS-G-13); escaped pipes / semantic tables; Western numerals in AR (RTL-4 convention).

---

## 3. Page-by-Page Rationale & Traceability

| Page | UX intent (URD) | Key FRS anchors |
|---|---|---|
| Home | First-viewport answers "who is Simal & why trust" (P1/P4); dual-business clarity (BO-1/BO-3); RFQ in ≤3 clicks | FRS-HP-01…08, G-14 |
| Category | Faceted finding for resellers (UR-01/03) | FRS-C-03/04/11 |
| Brand (Crucial) | Vendor-credibility + SEO landing (UR-04, BR-04) | FRS-C-09/10 |
| Product | Spec-completeness + genuineness + quote path (UR-02/03/06) | FRS-C-05/07, R-01 |
| RFQ | The conversion engine — ≤3 min mobile target (USAB-2) | FRS-R-01…14 |
| Software | Credibility-first for CIOs (Omar persona); honest claims | FRS-SW-01…13 |
| Solutions | Existing 12-line services business surface (BR-33 chain) | FRS-SO-01…09 |
| Onboarding wizard | ~10 min, resumable, fix-only-flagged, TRN/Peppol guidance (UR-15…21) | FRS-K-01…27 |
| Login | One-account story, staff-MFA expectation, old-portal link promise | FRS-A-01…16, G-16 |
| Partner dashboard | KYC status + expiry + RFQ history in one place | FRS-K-11/12/27, R-08 |
| About | Vendor due-diligence pass (Elena persona) | FRS-AB-01…08 |
| Contact | Routed enquiry taxonomy + single-source hours (BRule-3/6) | FRS-CT-01…08 |
| Careers | Never-empty careers (G4 fix) | FRS-J-01…08 |
| Insights | 220-day-blind-spot visibility engine | FRS-IZ-01…10 |
| Home (AR) | RTL parity proof — directional mirroring, AR typography | FRS-LN-01…07 |
| Admin queue | SLA-driven work order for reviewers (Sana) | FRS-RC-01/02/08/09 |
| Admin review | Field-level approve/flag + doc viewer + decision rail | FRS-RC-03…06, K-10 |
| CMS dashboard | Editor workload: AR gaps, claims gate, calendar | FRS-RC-11, IZ, BRule-8 |
| CMS editor | Bilingual-first editing with mandatory RTL preview | FRS-RC-12, LN-02/03 |

**Two separate panels — why (explicit user requirement):** the **Admin panel** (dark ink sidebar, KYC/compliance domain, MFA, audit-first) serves UG-9/12 (reviewers, admins) and maps to FRS M13; the **CMS panel** (darker-navy variant with red-marked logo, content domain) serves UG-11 (editors) and maps to FRS-RC-11/12. Separate domains = separate permission surfaces (permission matrix, FRS §24), separate risk profiles (KYC data vs marketing content), and no shared chrome beyond the design tokens — exactly the RBAC-aware separation the 2026 dashboard research recommends.

---

## 4. Prototype Status & Next Steps

**What this package is:** a high-fidelity, static, design-complete prototype — real content (76-SKU catalog facts, 24 brands, 12 services, 15 software products, real SLAs and formats like `SIMAL-RFQ-nnnn` / `0235:`+TRN / 23-char IBAN), real IA, real component library. Every page renders standalone in a browser via `assets/styles.css`.

**Deliberate prototypes-in-miniature (not defects):** SKU "images" are labeled placeholders pending vendor-approved photography (PRD D-5); maps are schematic blocks pending real geodata; charts are CSS-only sparkline/donut stand-ins for the build-phase charting library.

**Build handoff path (per PRD §16 / FRS §25):**
1. SG-1: run URD §13 R1 moderated tests on these renders (EN+AR) — the PNGs are the test stimuli.
2. Componentize `styles.css` tokens into the build stack (PRD §13.1-A: headless CMS + Next.js) as a design-token module.
3. Wire interactions per FRS state machines (§22 FRS: application/RFQ/document/account).
4. Replace placeholders with vendor assets; connect GA4 event names already embedded in the design copy.

**Local viewing:** open any `public/*.html`, `admin_panel/*.html`, `cms_panel/*.html` in a browser — or browse `screenshots/*.png` for the image versions.

---

*End of UX/Frontend Design Spec v1.0 — 18 pages designed, 18 images rendered, one design system. Aligned with BRD v1.3 / URD v1.2 / PRD v1.4 / FRS v1.2.*
