# CI/CD Pipeline Specification

**Doc ID:** E2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS

## Pipeline (per commit → production)

```
commit ─▶ L1 lint+syntax (node --check suite; zero-dep core keeps this fast)
      ─▶ L2 unit: portal tests (39) + site route tests            [gate: 100%]
      ─▶ L3 integration: e2e journey + audit scripts on ephemeral DB [gate: 100%]
      ─▶ L4 contract: OpenAPI drift check (B5 vs routes)          [gate: 0 drift]
      ─▶ L5 build: SSG site + app artifact + SBOM                  [artifact vX.Y.Z+sha]
      ─▶ L6 deploy staging (auto) ─▶ smoke (health, login, one invoice)
      ─▶ L7 manual approval (PM or TL) ─▶ production rolling deploy ─▶ smoke + E5 canary 15 min
```

## Rules

- No direct production access outside the pipeline (break-glass logged).
- Migrations run in a dedicated step with backup point (E4) before apply; expand/contract only.
- Secrets injected at deploy time from the secret store — never in build args or logs (log scrubber).
- Every production deploy auto-creates a release note entry (tag, scope, migration flag, rollback pointer).
- Nightly jobs: dependency/SBOM audit (D5), restore-drill reminder (E4), D3 matrix regeneration.

## Audit v2.0 additions (layer alignment with Quality v2.0)

- **L1.5 (new):** secrets scanning pre-merge (gitleaks-class) + historical scan once at P3 start (D5 §5.1).
- **L2.5 (new):** axe-core accessibility + CSP per-route header job (C4/D5).
- **L3.5 (new, layout PRs only):** visual regression vs baselines (D1 §6.2).
- **Branch rules:** trunk-based; main protected (reviews + green pipeline); merge queue; pipeline hard-timeout 45 min; flaky-test quarantine ≤ 7 days with owner.
- **Artifact retention:** app + SSG ×10 releases; SBOM attached each release (L5); deployment map (which env runs which artifact) exported to E5 dashboard.

## Environments

dev (engineer local, seeded demo data) · staging (prod-shape, synthetic data) · production. Feature flags per E3 matrix only.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — 7 layers defined |
| 2026-10-05 | **v2.0 audit:** +L1.5 secrets scan, L2.5 a11y/CSP job, L3.5 visual regression; +branch rules/merge queue/timeouts, +artifact retention ×10 + deployment map |
