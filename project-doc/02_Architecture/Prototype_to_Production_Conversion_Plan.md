# Prototype → Production Conversion Plan ★

**Doc ID:** B2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL+PM · **The core transformation guide**

## 1. Principle

The prototype is the **functional specification in executable form** (54/54 self-test) and the portal is **already production-shaped software** (39/39 + 16/16). Conversion = keep behavior, replace substrate. No feature is redesigned; every prototype route ships or is explicitly dropped here.

## 2. Page inventory → production route mapping (all 36 pages + tier multipliers)

| Prototype page (hash tiers) | Prod route | Build action |
|---|---|---|
| index.html (5-slide hero) | `/` | **Rebuild** on site stack; slides from CMS `hero_slides` table; same visuals (Ken Burns, ticks) |
| category.html (7 cats) · product.html (81 PDPs) · brand.html · compare · search | `/products`, `/products/:slug`, `/brands/:slug`, `/compare`, `/search` | **Rebuild** from DB tables (catalog, product_deep, brands); SSG + CDN |
| rfq.html · login.html · account.html | `/rfq`, `/signin`, `/account` | **Rebuild** onto portal auth + server RFQ entity; localStorage features die |
| solutions.html · it-solution.html (12) | `/solutions`, `/solutions/:id` | **Rebuild** from `solution_line` table (ITSOL content as seed data) |
| software.html + 8 sub-pages (7 modules / 12 services / 36 subs / 20 solutions / 9 industries) | `/software…` tree | **Rebuild** from software tables; hash tiers become real routes |
| insights.html · insight.html (14 articles) | `/insights`, `/insights/:slug` | **Rebuild** from `insight` table (14 articles as seed); sticky TOC kept |
| onboarding.html (7-step KYC) | `/portal/onboarding` | **Replace** with portal form.html flow (same fields/validators) |
| admin-queue/review · cms/cms-editor | `/portal/admin…` | **Replace** with portal consoles + new CMS module |
| legal · about · careers · contact · resources · sitemap · ar.html | content routes | **Rebuild** from CMS; AR per URD RTL rules |

**Dropped:** test.html (dev-only), python serve_prototype.py (dev server).

## 3. localStorage → persistence mapping

| Prototype localStorage key | Production home |
|---|---|
| simal.basket / RFQ refs | `rfq` table + email confirmation + staff view |
| simal.recent | client-side only (kept, non-essential) |
| simal.session (mock auth) | real sessions (portal engine), roles partner/staff |
| CMS overrides (EN/AR) | `cms_override` table, role-gated |
| KYC autosave/resume | server drafts (already real in portal) |

## 4. Data seeding

`Prototype/data/*.js` + `portal/data/db.json` become **seed scripts** → SQL (B4): 81 products + deep pages, 23 brands, 12 ITSOL lines, 20+12+36+7+9 software records, 14 articles, 12 KYC sample submissions (scrubbed), settings (Simal TIN/Peppol from portal `.env` values, referenced not copied).

## 5. Behavior contracts to preserve (verified by D3)

- Hash-tier navigation → routes with equivalent prev/next + cross-links (no dead ends).
- RFQ reference format `SIMAL-RFQ-YYYYMMDD-NNNN`; quote validity 7 days (FRS).
- KYC: 15-digit TRN structural rule, Peppol `0235:` preview, AE IBAN 23-char MOD-97 (CBUAE example), 7-step wizard resume.
- e-Invoice: fils math, 7 checks, UBL 2.1 fields exactly as in `einvoice.service.js`.
- WCAG 2.1 AA targets + verified brand palette ratios (URD ACC-3).

## 6. Effort estimate (relative units, P3 window)

site rebuild 35% · data seeding + CMS 20% · portal hardening/integrations 15% · tests/traceability 15% · content/SEO 10% · cutover 5%.

## 8. Interactive-island inventory (audit v2.0 — the behaviors SSG pages must hydrate)

| Island | Behavior contract (from prototype, verified by probes) |
|---|---|
| Hero carousel | 5 slides, Ken Burns drift, staggered entrances, numbered ticks 01–05 + fill, bottom progress line, arrows, 6.5 s autoplay, hover-pause, swipe; data from `hero_slides` CMS table (A7); `prefers-reduced-motion` honored (new a11y rule, C4) |
| Mega menu | 8 dropdowns, click-toggle + hover + keyboard state machine, viewport clamping, announcement strip dismissible (localStorage → cookie/profile) |
| Product tier | gallery+thumbs, 5 tabs, RFQ add, prev/next, companions, recently-viewed (client-only, accepted exception G1 §4.5) |
| Compare | 4-SKU selector + tier presets |
| Search | typo-tolerant (pg_trgm per TAD §7), instant results page |
| RFQ basket | multi-item, qty edit, `SIMAL-RFQ-*` submission + email |
| Insights | category filter chips, sticky TOC anchors (no page wipe) |
| Detail-tier chains | prev/next + cross-links ≥ 1,801-link graph (parity item 5) |
| KYC wizard | 7 steps, autosave/resume, validators, doc upload |
| Invoice studio | live fils-safe totals, edit-draft flow, UBL preview |

## 9. Explicitly dropped / deferred (no silent loss)

`test.html` (dev), dev servers (python scripts) — dropped. Reduced-motion + pause-button on carousel (WCAG 2.2.2) — **added scope**, small. RFQ→invoice automation, AR portal, inbound invoices — Phase-1.1 (A6 §8). Recent-products persistence — accepted client-only exception.

## 10. Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — full 36-page mapping, no deviations |
| 2026-10-05 | **v2.0 audit:** +§8 interactive-island inventory (10 islands with behavior contracts), +§9 explicit drop/defer table, cross-ref G1 §4 parity gate + Dec-4 go-live anchor |
