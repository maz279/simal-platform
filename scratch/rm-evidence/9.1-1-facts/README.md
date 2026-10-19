# Milestone 9.1 — re-verification and completion (2026-10-17, session 2)

The previous session reported 9.1-1/-2/-3 done (platform runs #5–#7, 21/21). This session
re-checked every 9.1 requirement against the spec, then drove the served site and the
CMS in the Claude desktop app's in-app browser, which the previous session could not use.

## 1. What was actually missing

| Spec item | Reported | Found |
| --- | --- | --- |
| 9.1-1: `gate-facts-consistency` mirrors `gate-link-crawl` (`needs: [build]`, reads `site-dist`) | done | The job ran `test-chrome-blocks-e2e.mjs` on its own scratch build and checked 5 EN pages. The 6.1-3 gate it wires (`scripts/ci/facts-consistency.mjs`, scanning **all** dist pages against a `simal:brand-count` reference) did not exist. |
| 6.1-3 / 4.1-2 / final gate: `facts-consistency` and `cms-e2e` in `run-gates.mjs` | done | Neither was in the `GATES` array. |
| 6.1 "one number everywhere" | done (sweep: 239 matches → one value) | The spec'd gate, run on the served dist, found 22, 20, 23 and 81 still published (AR pages, `/brands/`, products meta, 4 CMS rows) — the earlier sweep's regex missed Arabic, meta tags and "23-brand". |

## 2. Defects found and fixed

| # | Defect | How found | Fix | Proof |
| --- | --- | --- | --- | --- |
| 1 | Divergent brand / catalogue counts (22, 20, 23-brand, 23 authorized brands, 81-SKU) | new facts gate | `lib/facts.ts` single source; pages + seed + live CMS rows corrected (`fix-content.log`) | gate PASS on rig dist, served docroot, seed dist |
| 2 | Years hardcoded (AR "24", "Two decades", "20+ years"; hero slide 5, callout, credibility strips) | facts gate + CMS edit years 24→25 in a scratch sandbox, rebuilt | derived from `site/counters`; hero text supports `{years}/{brands}/{skus}`; seed slide 5 tokenized, hero upserts `DO NOTHING` | sandbox build: reference 25, gate PASS, hero "25 Years in MEA" (`inapp-browser/13-…`) |
| 3 | About menu awards line "HIKSEMi" vs award walls "Hikvision" | in-app browser | derived from `site/awards`, escaped | browser read: "Hikvision · TeamGroup 2025" |
| 4 | EN pages rendered Arabic content-block twins (AMC/firewall/UniPOS pages Arabic, hub 17 lines, `/solutions/amc/#sla` missing) | in-app browser + link-crawl on rig dist | 38 queries in 15 EN pages filter `lang = 'en'` | `01-`/`02-` screenshots; crawl PASS |
| 5 | Unmarked Arabic on English pages (WCAG 3.1.2) | new page-language gate | `lang="ar"` on intentional Arabic parts | 218/218 EN pages failed before, 0 after |
| 6 | AR nav overflow 901–1100px (46px @1024, 169px @901), AR hero card clipped @320, grids/PDP buy box off-screen @901–1024, CTAs @320 | in-app browser at 320/901/1024 | header tiers, `minmax(0,1fr)` hero, `.grid/.split > *{min-width:0}`, wrapping CTAs | reflow sweep: 30 findings before, 36/36 page-widths after |
| 7 | Product names showed literal `\u2013`/`\u2010`/`\u2033` (9 products, 37 pages) | in-app browser (PDP H1/title) | seed decoded; live rows via CMS API (`fix-product-names.log`) | placeholders gate: 37 → 0 |

| 8 | Layouts depended on Segoe UI metrics: on the Linux runner (DejaVu Sans) `/` overflowed 16px @320 and 19px @1280, `/about/` 9px @320, AR pages 32px @901 | platform run #8, `gate-a11y` (`run8-gate-a11y.log`) | `.cred-tile`/`.cred` items shrink and wrap, card headers wrap, `.prod h4` wraps, the nav row wraps instead of scrolling the page; the sweep re-measures with a forced wide font (Verdana ≈ DejaVu metrics) | runner numbers reproduced locally (15/20/24px) → 36/36 page-widths × 2 font passes |
| 9 | `/rfq/` CLS 0.014 on LHCI mobile: the empty `#basket-tbl` was filled ~570ms after load, pushing the next row down 124px | run #8 LHCI report (`run8-lighthouse-scores.log`) + in-app layout-shift observer | EN + AR pages server-render the empty state | CLS 0 at 412px (EN + AR); add / +qty / remove still work (`19-…`) |
| 10 | A transient apt mirror outage failed a required check (run #9, before the gate ran) | platform run #9 log (`run9-gate-a11y.log`) | the three Chrome jobs retry the install once after 30s | run #10 21/21 |

New / extended gates (all in `run-gates.mjs` and `ci.yml`): `facts-consistency` (job
`gate-facts-consistency`), `page-language` (2nd step of `gate-a11y`), reflow sweep (in
`a11y.mjs`), literal-escape + raw-token checks (in `check-no-placeholders.mjs`). Each was
proven to fail on the pre-fix build and pass after (`negative-test.log` for facts).

## 3. Verification — three iterations

| Check | Iteration 1 (implement) | Iteration 2 (browser-sweep fixes) | Iteration 3 (platform) |
| --- | --- | --- | --- |
| `run-gates.mjs` (golden rule 3) | 13/14 (crawl: `/solutions/amc/#sla` → defect 4) `it1-run-gates.log` | **15/15** `it2-run-gates.log` | — |
| facts gate negative test | 5/5 (control passes, 4 planted divergences fail) `negative-test.log` | — | — |
| Portal `npm test` + feature suites | — | **96/96 · 27/27** `it2-portal-tests.log` | — |
| Lint (`eslint . --ext .js,.mjs`) | 0 errors | 0 errors `it2-lint.log` | — |
| Local CI mirror on the **seed-built** dist (what CI builds) | — | **8/8** incl. reflow + page-language `it2-local-ci-seed-dist.log` | — |
| Publish loop (CMS → worker → deploy → :8100) | ALL PASS `it1-publish-loop.log` | ALL PASS `it2-publish-loop.log` | — |
| Site browser E2E (CDP harness) | — | **68/68** `it2-site-e2e.log` | — |
| CMS browser E2E (CDP harness, staff login + 32 views) | — | **13/13** `it2-cms-e2e.log` | — |
| In-app browser (Claude desktop) | home, consent, hero carousel, About/Brands menus, AMC + SLA anchor, brands, AR switch | 320/375/901/1024px EN+AR, PDP, sandbox CMS login (2FA), counters edit, rebuilt site | wide-font repro of the runner failures; nav one row EN/AR; RFQ add / +qty / remove at 412px; CLS observer |
| `run-gates.mjs` after the font-robust fixes | — | — | **15/15** `it3-run-gates.log` |
| CI platform | — | — | run #8 (9bccdab) **20/21**: gate-a11y failed on the runner (defect 8), Lighthouse all assertions pass (`run8-lighthouse-scores.log`: home 0.99 / LCP 2111–2196ms, others 1.00) → fixed in 8974c9a · run #9 (8974c9a) **20/21**: archive.ubuntu.com unreachable during the Chrome install → one retry (32f8f52) · **run #10 (32f8f52) 21/21 GREEN** — reflow 36/36 × 2 font passes and page-language on the Linux runner; LHCI home 0.98–0.99, others 1.00, `/rfq/` CLS 0 (`run10-*.log`, `9.1-3-platform-run10-green.png`) |

## 4. Open items that need a person

- **Publish approval `apr_mvcjddk40qug` (rig).** `tokenize-hero.mjs` saved hero slide 5
  with `{years}`/`{brands}` tokens (renders identically). Hero slides are a dual-approval
  entity (rm 7.3, SEC-11), so the rig's next publish waits for a **second staff approver**
  in CMS → Publish Approvals. Automation must not approve it, and the requester cannot.
- **Staff password rotation** (pre-existing, tracker RM-1.2-0): unchanged by this session.
- **1.2-3 Windows smoke job** (pre-existing, not 9.1 scope): still needs a Windows runner.

## Files

`fix-content.mjs`, `fix-product-names.mjs`, `tokenize-hero.mjs` (live-data fixes through
the CMS API, idempotent, print no secrets) · `negative-test.mjs` · `*.log` · `inapp-browser/`
(15 screenshots, before/after) · `shots/` (CDP harness, iteration 4).
The in-app CMS checks ran against a scratch-database portal with test credentials
generated for that run, never the rig's staff accounts.
