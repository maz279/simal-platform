# Production Smoke Test Report — T7.2

**Doc ID:** E1-SMK · **Script:** `Codebase/scripts/smoke-test.js` · **Raw:** `Codebase/scripts/smoke-results.json`
**Executed:** 6 Oct 2026 (UTC) · **Result: 15 PASS / 0 FAIL**

## Rig

The smoke suite boots the **real production artifacts** on the host and probes them over HTTP:

- **SSG site:** the committed `apps/site/dist` build (109 pages), served statically with edge-equivalent cache headers (hashed `_astro/*` assets → `public, max-age=31536000, immutable`; HTML → `max-age=300`).
- **Portal:** the real `server.js` on the **PostgreSQL store** (not the JSON dev store) with per-run generated bootstrap credentials — nothing reusable is written to source or results.

In production the same probes run against the live URL after DNS lands (deploy workflow, `post-deploy synthetic smoke` step). The local run is the pre-traffic gate; the prod run is the go-live gate (E6 22:30).

## Results (verbatim from execution)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | home `/` → 200 | PASS | 15,042 bytes |
| 2 | home hero/brand markers present | PASS | — |
| 3 | catalog `/products/` → 200 | PASS | 72,755 bytes |
| 4 | PDP `/products/crucial-t705-ssd-2/` → 200 | PASS | — |
| 5 | solution `/solutions/amc/` → 200 | PASS | — |
| 6 | insight `/insights/ai-in-erp-2026/` → 200 | PASS | — |
| 7 | unknown page → 404 | PASS | — |
| 8 | dist carries hashed assets | PASS | 1 asset |
| 9 | asset served `immutable` cache header | PASS | `public, max-age=31536000, immutable` |
| 10 | portal `/api/health` → 200 | PASS | — |
| 11 | `/api/settings` serves DB-backed TIN | PASS | `simalTin: 100548172900015` from PG `settings` |
| 12 | portal login screen renders | PASS | — |
| 13 | invalid credentials → 401 | PASS | — |
| 14 | security headers (nosniff + CSP + HSTS) | PASS | — |
| 15 | brute-force rate limiting → 429 | PASS | within 12 attempts |

## Scope notes (honest)

- Routes tested are the routes production ships today: home, products (81 PDPs sampled), solutions (12), insights (14). `about`/`careers` are task T3.8 (static pages) and join this list the day they build.
- The `deploy-prod-rc1.log` deliverable is produced by the deploy workflow's runner-executed step on deployment day; until the vendor runner is registered, this report plus `smoke-results.json` is the smoke evidence, and the deploy workflow's gate refuses to run without the window confirmation.
