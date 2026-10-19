# Phase 0 Ratification Record (v2.0 — Forensic Audit Remediation)

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> Later findings on this phase's set-up: env staff credentials were re-applied on every boot,
> reverting console password/TOTP changes (D28, now create-only); copied `.env.example` values kept
> their inline comments, so `NODE_ENV=production # …` was never "production" (D34) — both fixed `3fba62a`.

**Doc ID:** P0-RR · **Version:** 2.0 · **Date:** 5 Oct 2026 · **Owner:** PM/TL
Records the formal sign-off of all Phase 0 deliverables (T0.1–T0.6) **plus forensic audit remediations (F-01, F-03, F-06)**.

## T0.1 — ADR Ratification

All 13 Architecture Decision Records ratified + **ADR-2 amended** (Astro 5.x, per F-06):

| ADR | Decision | Status |
|---|---|---|
| ADR-1 | Node.js 22 LTS runtime | ✅ Ratified |
| **ADR-2** | **SSG + islands (Astro 5.x)** | ✅ **Amended v8.0** — framework formally selected |
| ADR-3 | PostgreSQL 16 database | ✅ Ratified |
| ADR-4 | Extend portal auth engine | ✅ Ratified |
| ADR-5 | BIGINT fils money | ✅ Ratified |
| ADR-6 | Accredited ASP Peppol | ✅ Ratified |
| ADR-7 | Email seam + outbox | ✅ Ratified |
| ADR-8 | CMS AR/RTL Western numerals | ✅ Ratified |
| ADR-9 | UAE-region hosting + CDN | ✅ Ratified |
| ADR-10 | Structured logs + request-id | ✅ Ratified |
| ADR-11 | pg_trgm search | ✅ Ratified |
| ADR-12 | Hash→routes | ✅ Ratified |
| ADR-13 | CMS publish/purge | ✅ Ratified |

## T0.2 — Monorepo + CI (v2.0 — includes F-01, F-06 remediation)

| Artifact | Location | Verified |
|---|---|---|
| Monorepo root | `Codebase/` with npm workspaces | ✅ |
| **Portal in monorepo** (F-01) | `Codebase/apps/portal/` → junction to `../../portal/` | ✅ Junction created; `server.js` resolvable |
| **Astro 5.x scaffold** (F-06) | `Codebase/apps/site/` with `astro.config.mjs` + placeholder page | ✅ Created |
| **Shared package** | `Codebase/packages/shared/` with fils-safe money module | ✅ Created |
| CI pipeline | `Codebase/.github/workflows/ci.yml` (4 jobs) | ✅ |
| ESLint config | `Codebase/eslint.config.mjs` | ✅ |
| .gitignore | `Codebase/.gitignore` (incl. .mimosa/) | ✅ |
| package.json workspaces | `apps/site, apps/portal, packages/shared` | ✅ Updated |

## T0.3 — Dev environments

| Item | Status |
|---|---|
| PG 16.9 portable on :5433 | ✅ running, db `simal`, pg_trgm + citext |
| Supervisor script | ✅ `Codebase/scripts/supervisor.cmd` |
| Environment guide | ✅ `Codebase/Environment_Setup_Guide.md` v1.1 |
| .env.example | ✅ all credential fields empty |

## T0.4 — Vendor RFP issued

| Item | Status |
|---|---|
| RFP document | ✅ v2.0 with anchored dates (issue 6 Oct → award 23 Oct) |
| Evaluation committee | ✅ PM (chair), TL, SEC, OPS |

## T0.5 — TAD + DB DDL + OpenAPI

| Artifact | Status | Evidence |
|---|---|---|
| TAD (B1 v2.0) | ✅ approved | With capacity, search, cache, i18n |
| DB DDL | ✅ **applied to PG** | 21 tables, 3 extensions, 2 sequences, settings seeded |
| OpenAPI (B5 v2.0) | ✅ approved | Mirrors shipped routes 1:1 |

## T0.6 — Conversion kickoff

| Artifact | Status |
|---|---|
| Task board | ✅ 49 tasks, 11 done |
| ARCHITECTURE_STATE.md | ✅ persistent state |
| LEARNINGS.md | ✅ 16 lessons |

## Forensic Audit Remediation (F-01, F-03, F-06 from FORENSIC_AUDIT_REPORT.md)

| Finding | Remediation | Status |
|---|---|---|
| **F-01** Portal outside monorepo | Windows junction `Codebase/apps/portal → ../../portal/` | ✅ **Resolved** — portal resolvable from monorepo; full `git mv` in P2 staging |
| **F-03** pg-repos not wired into server.js | `DATABASE_URL` conditional import added to `server.js` | ✅ **Resolved** — portal starts with `engine: postgresql` when `DATABASE_URL` set; JSON fallback preserved |
| **F-06** No SSG framework named | **Astro 5.x** selected in ADR-2 + scaffold created | ✅ **Resolved** — `apps/site/` with `astro.config.mjs`, placeholder page, npm scripts |

## Phase 0 exit gate (v2.0)

| Criterion | Status |
|---|---|
| 13 ADRs signed + ADR-2 amended (Astro) | ✅ |
| Monorepo with portal junctioned inside | ✅ |
| CI skeleton + ESLint + gitleaks | ✅ |
| PG 16 running with 21 tables + extensions | ✅ |
| Astro 5.x scaffold + shared package | ✅ |
| RFP issued with committee + dates | ✅ |
| Task board + ARCHITECTURE_STATE + LEARNINGS | ✅ |
| PG wiring demonstrated (DATABASE_URL conditional) | ✅ |

**Phase 0 COMPLETE (v2.0) — cleared for Phase 1 full PG integration (async repos migration + e2e on PG).**

### Known deferred items (Phase 1/T1.3 scope):
- Full async PG repos (all methods must return Promises; service layer needs `await` throughout)
- PG e2e test variant (`SELECT count(*) FROM invoices > 0` after e2e)
- User bootstrap on PG (auth.service creates admin from env on PG store — requires async compatibility)
