# PHASE 6 RATIFICATION — Comprehensive Verification, Testing Pyramids & Audits

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> T6.1's "6 jobs" CI is now 21 required jobs. *Related later finding:* platform CI was red on the
> "final" remediation HEAD `6c1108e` (run #12, 11/21 — D01, fixed `8c37907`).

**Date:** 3 October 2026 · **Status:** RATIFIED with registered carry-forwards
**Scope:** T6.1–T6.6 executed; T6.7 (cutover rehearsal #1) scheduled per runbook; T6.4 UAT staged awaiting human cohort.

## 1. Deliverables Completed

| Task | Deliverable | Evidence |
|---|---|---|
| T6.1 CI pipeline | `.github/workflows/ci.yml` — 6 jobs: lint, secrets-scan, unit, integration, parity, SSG build | file + local execution of every job's payload |
| T6.2 Parity checklist | `scripts/parity-checklist.js` (32 checks, G1 §4 items 1–6) | **32/32 PASS** — 109 SSG pages, 2,988 links, 0 localStorage in 109 files, 300 seeded rows, all 17 DB count assertions exact |
| T6.3 RTM + edge ledger | `RTM.md` — 54-assertion mapping, 19 FRS families traced, 21-entry edge ledger, gap register | 51/54 assertions evidenced + 4 superseded-by-design; 197/225 FRS reqs (87.6%) traced |
| T6.5 Performance run 1 | `scripts/perf-baseline.js` + `PERFORMANCE_BASELINE.md` | DB p95 1.19 ms (budget 50) · API p95 1.3 ms (budget 200) — **PASS** |
| T6.6 Security audit (local) | `scripts/security-audit.js` + `SECURITY_AUDIT.md` | **14/14 PASS**; HSTS added; 3 build-toolchain advisories assessed & accepted; ZAP + pen-test staged pre-cutover |
| T6.4 UAT | 26 scripts + SUS instrument exist in `Project_doc/04_Quality/UAT_Plan_and_Script.md` | staged — requires EN human cohort (registered) |

## 2. Final Verification State (all executed 6 Oct 2026 UTC)

| Suite | Result |
|---|---|
| Unit (validators, security rules, SSRF/screening) | **39/39** |
| Integration — API surface | **19/19** |
| Integration — workspace flows | **12/12** |
| PG integration (schema/seeds/search/constraints/B5/backup) | **27/27** |
| Parity checklist | **32/32** |
| Security audit (local) | **14/14** |
| Performance budgets (DB + API p95) | **PASS** |

## 3. Regressions Found & Fixed During This Phase (the verification paid for itself)

1. **Async-migration incompleteness (6 defects, LEDGER-A1–A6).** `kyc.service.js` and `admin.service.js` had never been async-migrated; wrapped repos return Promises, so truthiness checks were always-true, `.map/.filter` ran on Promises, and records were mutated on Promise objects. Symptoms: 409 on every user create, expired sessions accepted, drafts 500s, review list rows serialised as `{}`, logout not destroying sessions, export.csv hanging 306 s. All fixed; suites went 8/19 → 19/19 and 0/12 → 12/12.
2. **PG adapter parity gap.** `pg-repos.js` lacked drafts/invites/documents/screening/auditLog entirely, and `persist()` being a no-op meant in-place mutations (user updates, draft saves, invite conversions) were silently lost on PG. Fixed via B5 forward migration (25 tables; `drafts`, `screening_results` added; `invites` widened) + full repo groups + explicit `save()` protocol on both stores.
3. **HSTS missing** — found by the new security audit; added to `SECURITY_HEADERS`.
4. **Mimosa gate on tooling** — parity/perf/security scripts rewritten to literal-SQL, no-interpolation patterns; also converted pg-repos' last 4 template literals (49/49 literal now).

## 4. Carry-forwards (registered, none silent)

| Item | Owner / phase |
|---|---|
| T6.4 UAT execution (26 scripts + SUS ≥ 80, EN cohort) | QA — needs humans; scripts ready |
| T6.5 Run 2 + k6 formal rig + Lighthouse CI + CDN ratio | D4 two-consecutive-days gate |
| T6.6 ZAP baseline + external pen-test (ASVS L2 sign-off) | Pre-cutover |
| T6.7 Cutover rehearsal #1 (import + redirect + counts) | Runbook exists; needs staging env |
| Astro 7 migration (astro/sharp advisories) | Phase 8 task |
| GAP register (RFQ API, self-registration email loop, KPI date filters, careers intake, AR/RTL) | Phase 7/8 — see `RTM.md` §4 |

## 5. Ratification

Phase 6's purpose was to prove, with evidence, that the production build is the prototype's equal and the portal's PG path is real. That is proven: **97 automated tests, 32 parity checks, 14 security checks, and both D4 lab budgets — all green**, with two systemic defect classes (async incompleteness, PG adapter gaps) found, fixed, and regression-tested rather than papered over.

**RATIFIED for Phase 7**, subject to the carry-forward table above.
