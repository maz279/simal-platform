# SEO Metadata & Redirect Map

**Doc ID:** H2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** CM · Source: `content/15_SEO_Metadata` (per-page meta) + `Mirror_site/` URLs

## 1. Per-page metadata rules (applied at SSG build)

- Title ≤ 60 chars pattern: `<Page> | Simal Technologies UAE` (products: `<Name> — Specs & RFQ | Simal`).
- Meta description from content §15 (already authored); OG image `/assets/og/<section>.jpg` (media package §16).
- Canonical: one URL per page (hash-tiers become real routes per B2 — **no hash-based canonicals in production**).
- hreflang: `en` default + `ar` for translated pages (`<link rel="alternate" hreflang>`), Western numerals in AR.
- JSON-LD: Product (SKU, brand, InStock→RFQ), Article (insights), Organization + BreadcrumbList sitewide.

## 2. 301 redirect map (mirror → new) — rules of record

| Mirror pattern | New route | Notes |
|---|---|---|
| `/product/<slug>` | `/products/<slug>` | slug preserved where present in 81-SKU set |
| `/category/<cat>` | `/products?cat=<cat>` | 7 categories |
| `/brand/<slug>` | `/brands/<slug>` | 23 brands |
| `/blog/<post>` | `/insights/<slug>` | full table in artifact `redirects.csv` (generated at P3 from mirror sitemap diff) |
| `/solutions/*` | `/solutions/<id>` | 12 ITSOL lines |
| `/training-draft/`, personal-storage pages | **410 Gone** | flagged in PRD G13 |
| `kyc.simalme.com/*` | `portal.simalme.com` + token exchange (E7) | |

Rules: exact-match first, then pattern; never chain redirects; log 404s post-launch into CMS gap report.

## 3. Technical SEO checklist (production build)

sitemap.xml (all routes) + robots.txt (portal/API disallowed) · SSG renders meta server-side (no JS-dependent tags) · image alt from catalog data · LCP budget per D4 feeds Core Web Vitals · internal linking preserved: the prototype's cross-link graph (1,801 validated links) is the minimum production baseline.

## 4. Audit v2.0 additions (migration-SEO practice)

1. **Pre-migration crawl baseline (was missing):** full crawl of the mirror before freeze (2 Dec) — export every URL + status + canonical + internal-link graph as the comparison baseline ([migration checklist](https://itgsoftware.com), [12-step guide](https://smartclick.agency)).
2. **Redirect validation as CI gate (was manual):** `redirects.csv` → automated link-checker in the release pipeline — every mapped URL must return exactly one 301 → destination 200 with self-referencing canonical, **zero chains** ([validation practice](https://ecomseo.co)); any 404 on a mapped URL fails the build.
3. **Filtered/parameter views (was missing):** category filters and search results canonicalize to the unfiltered page + `noindex,follow`; pagination uses rel=prev/next-equivalent self-canonical per page.
4. **Custom 404:** branded page with search + top links for any unredirected legacy URL ([404 practice](https://smartclick.agency)); 404s logged → CMS gap report weekly.
5. **Sitemap policy:** split (pages/products/insights/solutions), `lastmod` = content_updated_at (never touch without change), submitted at cutover + 7-day recheck (E7).
6. **Organization schema fields fixed:** legalName, address (Bur Dubai HQ), sameAs (LinkedIn + any verified socials only — no unverified profiles), logo from media package §16.
7. **Ranking-guard tie:** top-20 money-page watch (E7 v2.0) is the SEO gate for hypercare exit; drop > 20% week-1 = R13 review with CM + PM.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — rules + patterns; redirects.csv generation at P3 |
| 2026-10-05 | **v2.0 audit:** +pre-migration crawl baseline, +redirect validation as CI gate (200/no-chain/canonical), +filtered-view canonical & noindex rules, +custom 404 + weekly gap report, +sitemap lastmod policy, +Organization schema fields, +hypercare SEO exit tie |
