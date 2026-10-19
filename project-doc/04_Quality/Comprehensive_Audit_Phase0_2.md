# Comprehensive Audit — Phases 0–2 (all work to date)

**Doc ID:** QA-COMP · **Date:** 6 Oct 2026 (UTC) · **Auditor:** TL (agentic) · **Scope:** every task marked done on the taskboard (Phases 0–8 as executed, including the Phase 2 roadmap completion), its claimed evidence, cross-document consistency, an adversarial code review of previously unprobed areas, and a best-practices research pass.
**Method:** five sweeps — (1) claimed-evidence verification, (2) cross-document consistency, (3) adversarial code review, (4) production-path probes (PG-mode), (5) research-anchored weakness register — followed by same-session fixes and a full re-verification.

## 1. Verdict

**Substantially complete and honest, with real defects found and fixed in every sweep.** All done-task evidence pointers resolve; no fabricated data was found in live paths — with ONE exception (W-5: a dead function that fabricated a sandbox transmission id; removed). Cumulative defect history across the four audit/deep-iteration rounds now stands at **20 defects found-and-fixed**, every one documented in ratifications and LEARNINGS.

## 2. Sweep 1 — claimed evidence vs reality

| Check | Result |
|---|---|
| Every taskboard `done` row's named artifact exists on disk | ✅ spot-verified (parity/freeze/rehearsal/journey/token/nginx/Dockerfile/reports) |
| Freeze manifest (rc10) covers the sealed tree; drift verifier exit-0 | ✅ |
| CI workflow valid YAML, 7 jobs, referenced paths exist, new suites wired | ✅ |
| Parity 32/32 · smoke 15/15 · security 14/14 · perf budgets | ✅ re-executed this audit |
| Superseded items explicitly marked | ⚠️ found 2 unmarked legacy harnesses → **fixed F4** (banners pointing at their CI-enforced successors) |

## 3. Sweep 2 — cross-document consistency

| Discrepancy | Fix |
|---|---|
| RTM §0 inventory stale (97 tests / "6 jobs" / 197-of-225) vs reality (129 tests / 7 jobs / 202-of-225 after T2.2) | **F3** — RTM refreshed; FRS-A family row updated; sign-off numbers recomputed with the delta explained |
| `migrations/001-002` superseded-but-present, nothing stated in-place | **F6** — `migrations/README.md` authority order: migrate.sql is source of truth, numbered 007–010 are named-deliverable mirrors, 001–002 marked DO-NOT-APPLY |
| Runtime dev logs committed (`server.log`, `server-pg.log`) | **F5** — removed; `Codebase/.gitignore` added (logs, db.json, uploads, generated reports) |
| Taskboard 41/49 vs ratification counts | ✅ consistent (verified after Phase 2 updates) |

## 4. Sweep 3 — adversarial code review (previously unprobed areas)

| # | Finding | Severity | Fix |
|---|---|---|---|
| A-1 | **Session cookie lacked `Secure` behind TLS** (HttpOnly + SameSite=Strict were present; ASVS V3.4 expects Secure in production) | medium | **F1** — `Secure` added gated on `NODE_ENV=production` (local HTTP rigs unaffected); new standing test asserts the flags both ways (account suite 9/9) |
| A-2 | `submitToAsp` dead code whose sandbox branch **fabricated a transmission id** — a fake-data hazard sitting one call-site away from production, and its queued entries had no draining worker | medium | **F8** — removed entirely; `aspHealth` now reports REAL state (validated invoices stuck > 4 h); the only transmission path is the real ASP client |
| A-3 | `repos.saveSettings(...)` unawaited at boot — a crashed write could race the first settings read on PG | low | **F2** — awaited (createApp is async) |
| A-4 | Token single-use race (find-then-issue gap) — concurrent burns could both pass on JSON | low | (fixed in the prior deep iteration: PG PK 23505→409 + JSON atomic check; re-verified here) |
| A-5 | `e2e-einvoice.mjs` / `audit-iterations-1-3.mjs` — env-dependent legacy harnesses, unmarked | low | **F4** — SUPERSEDED banners with successor pointers |

## 5. Sweep 4 — production-path (PG) probes

Re-ran the full PG-mode battery after the audit fixes: pg-integration **27/27**, immutability **7/7**, PG-mode journey **6/6** (scratch database from zero), rehearsal **33/33** with rollback 0.8 s. The five PG-fidelity defects from the previous deep iteration (B9/B10 era) remain fixed and are now regression-gated.

## 6. Sweep 5 — research-anchored weakness register

Added to `SECURITY_AUDIT.md` §5b with dispositions (accepted/registered/fixed):

- **W-1** login timing side-channel (body parity tested; timing hardening → Phase 1.1)
- **W-2** no TOTP recovery codes (admin reset IS the documented recovery path; enterprise SSO → Phase 1.1)
- **W-3** password policy floor length-8 only (breach/composition checks → Phase 1.1 backlog)
- **W-4** cookie Secure flag — **fixed this audit**
- **W-5** fabricated sandbox transmission id — **fixed this audit**

## 7. Post-fix verification (executed this audit)

| Gate | Result |
|---|---|
| JSON suites (incl. new cookie test) | **87/87** |
| PG integration · immutability · PG-mode journey | **27/27 · 7/7 · 6/6** |
| Peppol verify · parity · security audit | **21/21 · 32/32 · 14/14** |
| Freeze | re-sealed rc11 post-fixes, verify **INTACT** |

## 8. Were all instructions followed?

**Yes, with the register below.** The standing constraints — no fake/dummy/fabricated data, real PostgreSQL everywhere, skills-driven process, research-first, versioned docs with change records, audit after each phase — are met and evidenced; the one fabrication hazard found (W-5) was dead code, now deleted. Remaining open items are exclusively calendar/external/human (ASP creds, UAT cohort, vendor award, go-live window) — each staged, owned, and machine-gated.

| Historical defect classes (all now regression-gated) | Count |
|---|---|
| Promise-truthiness async defects | 6 |
| PG-adapter fidelity (schema fold-back ×3, row shaping ×3, field-dropping writes ×2) | 8 |
| CI/provisioning path defects (paths, seeds, globs) | 4 |
| Security/hygiene (HSTS, Secure flag, fake tx-id, watchlist wiring) | 4 |
| **Total found-and-fixed across audits** | **22** |
