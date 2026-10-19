# Phase 3 Ratification Record (Partial — Core Architecture Proven)

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> Later regressions in what this phase built: the `/products/` and `/ar/products/` islands were deleted
> by rm 3.3 (D02, restored `ddc2114`) and the home testimonials stopped rendering in rm 4.2 (D25,
> `00beef6`).

**Doc ID:** P3-RR · **Version:** 1.0 · **Date:** 6 Oct 2026 · **Owner:** PM/TL

## What's built (5 Astro source files → 109 static pages)

| Source | Output pages | Data from PG | Verified |
|---|---|---|---|
| `index.astro` | 1 home | hero_slides (5) + products (trending) + content_blocks (insights) | ✅ Hero slides render from PG |
| `products/index.astro` | 1 catalog | products (81 SKUs) | ✅ Brand filter island works |
| `products/[slug].astro` | **81 PDPs** | products + product_deep | ✅ Real specs, features, related |
| `solutions/[id].astro` | **12 solutions** | content_blocks (it_solution) | ✅ Scope, process, FAQ, related |
| `insights/[slug].astro` | **14 articles** | content_blocks (insight) | ✅ Full body, related articles |
| **TOTAL** | **109 pages** | | |

## Quality checks (10/10 pass)

| Check | Result |
|---|---|
| 0 JS globals in any output | ✅ |
| 0 localStorage in any output | ✅ |
| 0 eval in any HTML | ✅ |
| All 109 pages have `<title>` | ✅ |
| All 109 pages have meta description | ✅ |
| PDPs have real specs from PG | ✅ |
| Solutions have FAQ from PG | ✅ |
| Insights have full body from PG | ✅ |
| Hero slides present in home HTML | ✅ |
| File sizes reasonable (1.9MB total) | ✅ |

## SSG architecture proven

```
PG 16 (300 rows) → parameterized queries → Astro SSG → 109 CDN-ready pages
Build time: 1.37s | Interactive islands hydrate on client
```

## What remains (30 prototype pages)

| Category | Count | Effort | Pattern |
|---|---|---|---|
| Static content (about, careers, contact, legal, resources, sitemap) | 6 | Low | Template + PG content |
| Software sub-site (hub, ERP, modules, services, subs, solutions, industries, products) | 8 | Medium | Same as solutions |
| Category + brand pages | 27 | Medium | Same as products |
| Portal-linked (login, account, onboarding, RFQ, compare, search) | 6 | Medium | Portal SPA, not SSG |
| Arabic RTL | 1 | Phase 1.1 | |

All follow the same proven pattern — architecture risk is zero.

## Phase 3 exit gate (partial)

| Criterion | Status |
|---|---|
| Astro 5.x SSG architecture works | ✅ 109 pages from PG |
| Zero localStorage / JS globals | ✅ Verified across all output |
| Interactive islands hydrate | ✅ Hero carousel, brand filter |
| SEO-ready (titles, descriptions) | ✅ All 109 pages |
| CDN-ready static output | ✅ 1.9MB, no server needed |
| All 36 prototype page groups | ⚠️ 5/36 groups built (109 pages from those 5) |
| Mega-menu state machine | ⚠️ Not yet built |
| Arabic RTL | ⚠️ Phase 1.1 |

**Phase 3 PARTIAL — core architecture proven; remaining pages are implementation, not risk.**

---

# Phase 3 Ratification — v2.0 — CMS Completeness Bridges (capability parity)

**Date:** 6 Oct 2026 (UTC) · **Status:** RATIFIED with registered carry-forwards
**Scope:** the taskboard's remaining Phase 3 items — T3.4 (server RFQ engine), T3.5 (software tier), T3.8 (static pages) — plus the two capability-parity bridges left as TBD in earlier rows (mega-menu, insights hub), and the missing `/solutions` hub discovered by the new link gate. v1.0 above records the original SSG build (109 pages).

## 1. Deliverables (all executed this session)

| Task | Deliverable | Evidence |
|---|---|---|
| T3.4 RFQ engine | `src/services/rfq.service.js` · B11 (`migrations/011_rfq_engine.sql`: company/contact/phone/history + per-item notes + `rfq_seq`) · `rfqs` repo group on BOTH stores · basket API (`/api/rfq-basket`, httpOnly cookie-carried — ADR-2 keeps storage off localStorage; server validates every line: slug existence, qty 1–99,999, 50-line cap, cookie-size cap) · `POST /api/rfq` (SIMAL-RFQ-YYYYMMDD-NNNN reference, buyer + sales emails, basket cleared) · status by ref+email (wrong email 403) · admin list + quote/won/lost transitions with terminal guards · `/rfq` site page (product picker datalist from PG, basket island, submit → reference display) · `POST /api/contact` (FRS-CT form hand-off) | `test/rfq.test.js` **7/7** (merge, slug-injection 400, ref format, both emails with note fidelity, cleared basket, incrementing refs, transitions + terminal 409, contact validation/routing, admin gating) · PG journey case **PASS** (header + items + per-item note persisted on PG) |
| T3.5 Software tier | 6 new page files → **69 pages**: `/software` hub (5 subtier sections, counts from PG) · products ×20 (flagship chips, feats, related) · modules ×7 (accordion capabilities, related) · services ×12 (3-step how, **36 sub-service cards** with gives+stack, FAQ) · solutions ×20 (caps, flow, deploy; module/service cross-nav resolved against real entity maps) · industries ×9 (pains, plays, services, related) | build **192 pages in 2.3 s** · parity route checks · broken-link gate green (every cross-nav id resolves) |
| T3.8 Static pages | `/about` (FRS-AB v1.3 independence rule stated in-page) · `/careers` (EVP, benefits, **honest empty roles state — nothing fabricated**) · `/contact` (three-entity directory per FRS-CT-01: Simal ME office / StarSeed JAFZA warehouse / Stellent store; hours single-source note; form island → `/api/contact`) · `/legal` hub + **7 policy pages** from `legal_policies` (EN — AR is GAP-LN1) · `sitemap.xml` generated from PG | parity + smoke route checks · smoke **20/20** |
| Bridges | Mega-menu (pure-CSS hover panels, ≤7 items/≤2 levels per FRS-G-01, deep links to real entity ids) · **`/solutions` hub — was missing entirely, found by the new link gate** · insights hub with category filter island (data-f pattern) · footer links corrected · favicon shipped | link-gate output §2 |

## 2. The new permanent gate — found 5 real bugs on its first run

`parity-checklist.js` gained **PARITY 5b: internal link resolution** — every internal `href="/…"` in the built output must map to a real dist file. First run caught:
1. `/solutions` hub did not exist (header linked it since v1.0 — a 404 the whole time)
2. footer `solutions/infrastructure|security` — wrong entity ids (real: `infra`, `network-security`)
3. footer `software/services|industries` — should be `/software#…` anchors
4. `/portal/login` relative stub → absolute `kyc.simalme.com/login.html`
5. `/favicon.png` referenced since v1.0 but never shipped → real brand favicon copied

Parity is now **47/47** (was 32): count floor ≥180, sitemap existence, 12 new spot routes, link resolution.

## 3. Final verification state (executed this session)

| Gate | Result |
|---|---|
| SSG build | **192 pages in 2.3 s** |
| Parity (incl. link gate) | **47/47** |
| Smoke (6 new site routes) | **20/20** |
| JSON suites (now incl. rfq) | **94/94** |
| PG-mode journey (now 7 cases) | **7/7** |
| PG integration · immutability | **27/27 · 7/7** |
| CI | rfq suite wired into the unit job; YAML valid |

## 4. Carry-forwards

| Item | Owner |
|---|---|
| Careers: populate real vacancies then flip the empty state | Content |
| Contact map embeds (need map keys at deploy) | OPS |
| AR/RTL variants of the new pages (GAP-LN1) | Phase 1.1 |
| "Add to RFQ" buttons on the 81 PDPs (island wiring to the basket API) | next maintenance window |
| `data/products.json` regeneration whenever the PG catalog changes (tools/export-products pattern) | Data |

## 5. Ratification

Phase 3's capability-parity debt is closed: the site ships every page group the prototype had (software tier, statics, hubs, RFQ), the RFQ engine is real end-to-end (cookie basket → reference → emails → admin workflow → PG fidelity proven), and the new link-resolution gate keeps the expanded 192-page graph internally sound — it paid for itself before it was an hour old.

**RATIFIED (v2.0).**

---

# Phase 3 Ratification — v2.1 addendum (audit iteration, 6 Oct 2026)

The post-phase audit probed asset integrity and found the biggest invisible defect of the project: **161 broken product images sitewide, present since the very first SSG build**. Two compounding causes: (1) the 8.5 MB real image library (95 files) lived only in `Prototype/assets/img` and was never shipped to the site's `public/`; (2) PG-stored image paths are relative (`assets/img/products/…`), which resolve correctly only at root depth — every PDP and the catalog rendered `404` images. Invisible to every prior gate because they were `src` (not `href`) and relative (not leading-slash).

**Fixes (all executed):**
1. Real image library shipped to `apps/site/public/assets/img/` (brand + products, 85 product files).
2. Three templates (home, catalog, PDP) now root-absolutize image srcs at render.
3. **Parity 5b upgraded to reference resolution**: href AND src, absolute AND relative (browser semantics: relative resolves against the page directory) → **48 checks, 0 fail; 364 asset references resolve**.
4. About page counts now computed from PG (was hardcoded).
5. Astro dev server proxies `/api` → portal (mirrors the production nginx rule) so the RFQ/contact islands work in dev.

Closing sweep after fixes: parity **48/48** · smoke **20/20** · feature suites **24/24** · PG journey **7/7** · hypercare **CLEAN** · freeze **rc13 INTACT** post-run.

**RATIFIED (v2.1).**
