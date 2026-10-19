# Performance & Load Test Plan

**Doc ID:** D4 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** QA · Targets from URD (SUS/core-task) + 2026 budgets

## 1. Targets (production budgets)

| Metric | Target | Where measured |
|---|---|---|
| LCP | < 1.8 s (SSG pages, UAE edge) | lab + field |
| INP | < 100 ms | field (RUM) |
| CLS | = 0 (hero dims reserved — prototype already fixes stage height) | lab |
| API p95 (read) | < 200 ms @ 50 rps | load rig |
| API p95 (invoice validate) | < 400 ms | load rig |
| KYC submit (26 MB worst doc set) | < 8 s | load rig |
| Error rate | < 0.1% under 2× expected peak | load rig |

## 2. Load profiles (from BRD demand assumptions)

- Browse: 200 concurrent, 50 rps mixed catalog/insight (CDN absorbs ≥ 80%).
- RFQ burst: campaign days 3× baseline (rate limits must hold, 429 graceful).
- Portal: 50 concurrent staff/partners; invoice submission spike month-end 5× (queue depth stays 0 backlog).
- Soak: 4h at 1× → no session/memory leak (session store bounded by expiry).

## 3. Method

k6 (or equivalent) against staging with production-shaped seed; DB at 2× year-1 volume (invoices ≈ 40k rows synthetic); CDN simulated at origin for worst case. Each run: report p50/p95/p99, errors, infra metrics (E5 stack on).

## 4. Gate

P4 exit requires all targets met on two consecutive runs; any miss routes to TL with the offending query/endpoint listed.

## Audit v2.0 additions

- **Tools fixed (were "or equivalent"):** k6 for load; Lighthouse CI + RUM beacon for field CWV; pg stats for DB budget.
- **New budgets:** DB query p95 < 50 ms (top-10 queries listed in run report); CDN cache-hit ratio ≥ 80% on catalog/insight paths (ties TAD §7); SSG build time < 10 min (release cadence guard).
- **Run hygiene:** fresh reseed between runs (D1 §5); two consecutive passing runs on different days remain the gate; reports archived with release candidate tag.
- **Field verification post-launch:** 30-day CWV watch (LCP/INP/CLS) on top-20 pages feeds F2 monthly report; regression > 10% triggers D4 re-run.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — budgets fixed; rig selection at P3 |
| 2026-10-05 | **v2.0 audit:** tools fixed, +DB/CDN/build budgets, +run hygiene, +post-launch CWV watch |
