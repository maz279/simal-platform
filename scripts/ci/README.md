# scripts/ci — remediation gates

The gates turn the Independent Forensic Audit's findings into CI checks. Each one
was written to fail on the defect it guards and was driven green by the roadmap task
that closed it. Since rm 9.1 every gate runs as a job of `.github/workflows/ci.yml`
on the CI platform (`infra/ci-platform/`), and `main` requires all of them.

| Gate (`run-gates.mjs` key) | Script | Guards | ci.yml job |
|---|---|---|---|
| clean-db | `clean-db-build.mjs` | DAT-1 — `migrate.sql`+`seed.sql` on an empty DB must build the site | gate-clean-db-build |
| authz | `authz-matrix.mjs` | SEC-3/SEC-5 — deny-by-default on admin/einvoice/integration routes | gate-authz |
| pg-reporting | `pg-reporting.mjs` | DAT-3/APP-1 — SLA age non-null, breach fires, reports+CSV 200 on PG | gate-pg-reporting |
| sequences | `sequences.mjs` | DAT-6 — sequence drift on a fresh database (check-only) | gate-sequences |
| sitemap | `sitemap-lastmod.mjs` | SEO-2 — sitemap `<lastmod>` from content timestamps | gate-sitemap-lastmod |
| ga4 | `ga4-consent.mjs` | SEO-5 — GA4 loads only behind consent (headless Chrome, network capture) | gate-ga4-consent |
| cms-e2e | `test-cms-e2e.mjs` | CMS-2/3/4/9 — CMS editors and their effect on the built site | gate-cms-e2e |
| chrome-blocks | `test-chrome-blocks-e2e.mjs` | CMS-2 — a nav/footer/newsletter edit reaches the built pages | gate-cms-e2e (2nd step) |
| cms-integrity | `test-cms-integrity.mjs` | CMS writes never destroy or cross-contaminate data: product detail kept on save, EN/AR policies isolated, rollback restores the chosen snapshot, brand counts/overview kept, uploads reach the site, label-only category rename | gate-cms-e2e (3rd step) |
| crawl | `link-crawl.mjs` | PUB-3 — 0 internal 404s / 0 `undefined` URLs in `dist` | gate-link-crawl |
| placeholders | `check-no-placeholders.mjs` | PUB-7 — 0 placeholder / internal strings in `dist` | gate-placeholders |
| csp-inline | `check-inline-scripts.mjs` | SEC-13 — 0 inline executable scripts (`script-src 'self'`) | gate-csp-inline |
| facts-consistency | `facts-consistency.mjs` | PUB-8 — every brand count, catalogue size and company-age figure on every page equals the `<meta name="simal:*">` reference; awards on `/` and `/about/` identical | gate-facts-consistency |
| a11y | `a11y.mjs` | WCAG 2.x A/AA via axe-core on key pages, plus a WCAG 1.4.10 Reflow sweep of EN and AR pages at 320/901/1024/1280px (no sideways scroll, nothing clipped) | gate-a11y |
| page-language | `check-page-language.mjs` | SEO-1 / WCAG 3.1.2 — every English page renders English content blocks; Arabic parts sit in a `lang="ar"` element (axe-core cannot test 3.1.2) | gate-a11y (2nd step) |
| perf | `perf-budget.mjs` | NFR-1 fast proxy — simulated CWV budgets (the real score is the `lighthouse` job, `lighthouserc.json`) | gate-perf |

The dist gates (crawl, placeholders, csp-inline, facts-consistency, a11y, page-language, perf) read
`apps/site/dist`; `SITE_DIST` overrides it. In CI they download the `build` job's
`site-dist` artifact, so every one of them checks the same build.

## Running locally

```bash
node scripts/ci/run-gates.mjs                 # every gate
node scripts/ci/run-gates.mjs authz facts     # subset by keyword
node scripts/ci/run-local-ci.mjs              # every ci.yml job, mirrored on the rig
```

`GATE_ADMIN_URL` (a postgres URL to the `postgres` maintenance database, used to
create/drop scratch databases) comes from `apps/portal/.env` `ADMIN_DATABASE_URL`;
export it yourself to override. Gate apps boot with **randomly generated
credentials**, and the e2e gates write only to scratch databases they drop — no
password literals exist in these scripts and no gate touches the main database.

The a11y and ga4 gates need Chrome/Chromium (`CHROME_PATH` overrides autodetection)
and the `axe-core` devDependency at the repo root.

## In CI

`.github/workflows/ci.yml` runs every gate on every push and PR. The platform run is
the authoritative result; `run-local-ci.mjs` is a pre-check that cannot see
platform-only defects (no `node_modules`, no git-ignored data on a runner). Do not
`continue-on-error` a gate job, and do not merge while one is red unless the board
records an explicit waiver. A job added to `ci.yml` is added to the required checks
(`docs/BRANCH_PROTECTION.md`, `infra/ci-platform/bootstrap.mjs --protect`) in the
same change.
