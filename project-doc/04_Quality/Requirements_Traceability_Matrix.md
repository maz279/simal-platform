# Requirements Traceability Matrix

**Doc ID:** D3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** QA · Living document — updated every merge

## Structure
`Requirement → Test ID(s) → Status` for FRS v1.3 (225 reqs, 19 modules) + Portal PRD A6 reqs. Full grid maintained as spreadsheet artifact `RTM.xlsx` (generated at P0); this file records the module-level roll-up + the verification evidence that exists TODAY.

## Module roll-up (FRS 19 modules + portal)

| Module | Reqs (approx) | Verified today by | Production tests to add |
|---|---|---|---|
| FRS-G general site | 20 | Prototype self-test 54/54; link-graph audit 1,801 links 0 broken | route tests per B2 |
| FRS-SR search | 8 | prototype search tests (typo, garbage) | API contract tests |
| FRS-C catalog/PDP | 15 | 81/81 deep-page assertion | SSG snapshot tests |
| FRS-RFQ | 12 | basket/refs tests | server RFQ e2e |
| FRS-SO IT solutions | 10 | ITSOL 12-record assertions | route tests |
| FRS-SW software tier | 18 | software data assertions (20/12/36/7/9) | route tests |
| FRS-IZ industries | 6 | industryDetail assertions | route tests |
| FRS-J CMS | 10 | localStorage CMS flows | CMS e2e (UAT 22) |
| FRS-CT contact/RFQ routing | 8 | prototype forms | server e2e |
| FRS-A account/auth | 12 | portal auth unit+audit I1 | extended (reset flow) |
| FRS-K KYC (41) | 41 | portal suite 39/39 + API.md conformance | keep; add migration tests |
| FRS-DV documents | 6 | magic-byte unit | keep |
| FRS-RC review console | 8 | e2e + audit I3 | keep |
| FRS-EM e-invoicing (new) | 14 | **e2e 16/16 + audit I1–I3** (fils math, 7 checks, lifecycle, UBL, isolation, tamper) | CI parity |
| FRS-IG insights | 6 | 14-article assertions | route tests |
| FRS-RP reports/exports | 5 | report builder (portal) | keep |
| FRS-LN legal | 7 | legal page tabs | content snapshot |
| FRS-HP homepage | 6 | carousel probes (rotation, ticks, swipe) | visual regression |
| FRS-AB about | 4 | content package | content snapshot |

## Edge-case ledger (must stay green in CI)

1-fils VAT = 0 · per-line half-up (2×10f → 2f) · 3-decimal price 422 · qty 0/100001 422 · 14-digit TRN 422 · due<issue 422 · negative price 422 · double-deliver 409 · reject-no-reason 422 · tampered totals 422+corrected · cross-partner read 403 · anon 401 · login lockout 429@11 · traversal 404 · CSP blocks inline.

## Rules
Every new requirement or change (G4) enters this matrix in the same PR. Gaps require explicit waiver (PM+QA) with date.

## Prototype self-test → production test mapping (audit v2.0 — parity item 2 made concrete)

| Prototype self-test group (of 54) | Production test owner |
|---|---|
| catalog integrity (81, unique slugs, brands) | seed test + `/api/catalog` contract test |
| product-deep 81/81 + card overlay + recent cap | route render snapshot + unit |
| catGuide 7×3, search (typo/garbage) | API search tests (pg_trgm parity assertions) |
| software tiers (20/12/36/7/9 + cross-ids + FAQs) | content-table seed tests + route tests |
| ITSOL 12 + industry 9 + insight 14 (fields, rel ids, ctas) | seed validation + route tests |
| RFQ basket/refs, hero carousel probes | RFQ e2e + visual regression (frozen-frame) |

New v2.0 scope rows: **account services** (reset/verification/profile — UAT 26 + API tests), **reduced-motion + pause button** (C4), **immutability control** (C3 v2 — reopen-after-delivery restrictions). Rule additions: waiver cap ≤ 5% of requirements at any gate; CI regenerates this matrix and fails on coverage regression; parity-item links mandatory on every new test.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 roll-up + today's evidence frozen; RTM.xlsx generation queued to P0 |
| 2026-10-05 | **v2.0 audit:** +self-test→production mapping table (54 assertions owned), +v2-scope rows, +waiver cap + CI regeneration rule |
