# Performance Baseline — T6.5 Run 1 (Lab)

**Date:** 3 October 2026 · **Executed:** 6 October 2026 (UTC) · **Script:** `scripts/perf-baseline.js` · **Raw:** `scripts/perf-results-latest.json`
**Rig:** local single-user lab. The formal D4 rig (k6 @ 50 rps, Lighthouse CI, RUM field data) runs in CI/staging — this baseline proves the budgets hold with order-of-magnitude headroom before that rig is exercised.

## D4 Budget Compliance

| Budget (D4 v2.0) | Target | Measured (lab) | Verdict |
|---|---|---|---|
| DB query p95 (top-10 queries) | < 50 ms | **1.19 ms worst** | **PASS (42× headroom)** |
| API read p95 | < 200 ms | **1.3 ms worst** | **PASS (150× headroom)** |
| SSG build time | < 10 min | CI build job (109 pages) — historically ~1–2 min class; recorded per CI run | tracked in CI |
| LCP < 1.8 s / CLS = 0 | lab + field | Lighthouse CI + edge measurement — post-staging (needs deployed edge) | staged |
| API p95 @ 50 rps (k6) | < 200 ms | formal load rig — pre-cutover (D4 §2) | staged |

## Top-10 Query Latencies (PostgreSQL 16, 300-row seed)

| Query | p50 | p95 |
|---|---|---|
| home: hero slides | 0.24 ms | 0.44 ms |
| home: testimonials | 0.18 ms | 0.28 ms |
| catalog: products list (81) | 0.54 ms | 0.99 ms |
| catalog: brands (20) | 0.21 ms | 0.29 ms |
| PDP: product by slug | 0.25 ms | 0.34 ms |
| PDP: deep record | 0.20 ms | 0.34 ms |
| search: trgm typo tolerance | 1.07 ms | **1.19 ms** |
| solutions: content blocks (12) | 0.41 ms | 0.93 ms |
| insights: content blocks (14) | 0.49 ms | 0.65 ms |
| legal: policies (7) | 0.16 ms | 0.20 ms |

The pg_trgm similarity search is the most expensive query at 1.19 ms p95 — still 42× inside budget. No index work is warranted at current scale; re-measure at ≥10k products.

## Portal API Read Latencies (PG mode, in-process)

| Endpoint | p50 | p95 |
|---|---|---|
| GET /api/health | 0.5 ms | 1.3 ms |
| GET /api/settings | 0.5 ms | 0.7 ms |
| GET /api/public/invites/:code | 0.5 ms | 1.0 ms |

## Notes

1. **This run surfaced a production bug** — `/api/public/invites/:code` initially returned HTTP 500 in PG mode (`repos.invites` missing from `pg-repos.js`). Root cause: the PG adapter implemented only the repo groups exercised by earlier phases; drafts/invites/documents/screening/auditLog were JSON-only. Fixed in the same session (B5 migration + repos parity, 25 tables) and now measured at sub-millisecond p95.
2. D4's "two consecutive passing days" gate: Run 1 recorded today; Run 2 tomorrow against the same budgets, then the CI rig formalises it.
3. CDN cache-hit ratio (≥ 80%) and field CWV are post-deploy measurements — tracked in the cutover runbook, not measurable in this lab.
