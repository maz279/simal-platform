# Migration & Cutover Plan

**Doc ID:** E7 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM · Sources: `Mirror_site/` (old WordPress), live kyc.simalme.com, PRD §9

## 1. Content migration (mirror → new site)

- Content package (261 files) already carries the migrated copy — cutover does NOT scrape the mirror; deltas since packaging (new posts/pages) diff-checked week before launch.
- **301 map:** every mirror URL → new route. Rules: products → `/products/:slug` (slug preserved where possible); category archives → `/products?cat=`; blog posts → `/insights/:slug` (mapping table in H2 artifact); legacy pages flagged in PRD (training-draft, 404s) → 410 Gone, not redirected.
- Sitemap.xml regenerated from new routes; submitted in search console at cutover + 7-day recheck; rankings on top-20 money pages tracked 60 days.

## 2. KYC portal tenant migration (kyc.simalme.com → portal)

1. Export live applications + documents (read-only copy) → import to `submissions`/`documents` with status preserved.
2. **Token-mapped resume links:** legacy magic-links 301 to `/portal/status?token=<one-time exchange>` — exchange endpoint (INT-6) validates old token once, issues new session-limited token. PRD §9 mandate.
3. Accounts: existing portal-email users keep logins; others provisioned per A6 (temp password flow) — never bulk-password.
4. Parallel-run: legacy portal read-only 2 weeks; banner points to new; then DNS 301 permanent.

## 3. Data rules

- No deletion of legacy systems before E4 backup + 60-day archive (C3).
- Scrub demo/synthetic records from production import (dev db.json NEVER touches prod).
- Migration rehearsal on staging at P4 (counts + 20 spot-check records signed by QA).

## 4. Communications

Partners (email + portal banner) at T-7 and Day-0; internal staff briefing T-3; support macros for "where is my application" (reference + email lookup unchanged).

## 5. Audit v2.0 additions

- **Mirror freeze:** legacy WordPress becomes **read-only on 2 Dec 2026** (content deltas after that are manually re-entered, never re-scraped); full export archived to E4 backup before freeze.
- **SEO watch specified (was vague):** owner CM; tool = search-console + rank tracker on the top-20 money pages; weekly report weeks 1–8, then monthly to day 60; any money-page drop > 20% triggers R13 mitigation review.
- **Email continuity note:** MX records untouched by this cutover — mail flow unaffected; only web/KYC DNS changes.
- **Token-exchange verification:** INT-6 success rate ≥ 99% during parallel-run is an explicit E6 go/no-go input ( rehearsed in rehearsal #2).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — mirrors PRD §9 mandates |
| 2026-10-05 | **v2.0 audit:** +mirror freeze date (2 Dec), +SEO watch owner/tool/cadence, +MX continuity note, +token-exchange go/no-go gate |
