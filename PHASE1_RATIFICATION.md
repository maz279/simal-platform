# Phase 1 Ratification Record (v2.0 — PG Integration Verified)

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> No claim in this record is contradicted by the ledger. (D03 concerns the site's client-side search
> island, not the pg_trgm search verified here.)

**Doc ID:** P1-RR · **Version:** 2.0 · **Date:** 5 Oct 2026 · **Owner:** PM/TL

## T1.1 — DDL Applied (done in P0)
| Item | Evidence |
|---|---|
| 21 tables | `pg-integration-test.js` PASS |
| pg_trgm + citext | `pg-integration-test.js` PASS |
| Sequences (ref_seq, inv_seq) | `pg-integration-test.js` PASS |
| BIGINT fils columns | `pg-integration-test.js` PASS |
| Generated buyer_peppol | `pg-integration-test.js` PASS |

## T1.2 — Seed Applied
| Table | Rows | Verified by |
|---|---|---|
| products | 81 | pg-integration-test |
| product_deep | 78 | pg-integration-test |
| brands | 20 | pg-integration-test |
| content_blocks | 97 | pg-integration-test |
| hero_slides | 5 | pg-integration-test |
| legal_policies | 7 | pg-integration-test |
| testimonials | 3 | psql count |
| category_guides | 7 | psql count |
| settings | 2 | pg-integration-test (TIN 15-digit) |
| announcements | 0 | — (runtime data) |
| **TOTAL** | **300** | |

## T1.3 — PG Repository Adapter
| Item | Status | Evidence |
|---|---|---|
| `pg-repos.js` created | ✅ | `portal/src/store/pg-repos.js` — parameterized queries |
| `pg` driver installed | ✅ | `portal/package.json` |
| `DATABASE_URL` conditional in `server.js` | ✅ | `engine: postgresql` logged on boot |
| Settings cache (sync-compatible) | ✅ | `settings cached: [simalTin, simalPeppol]` on boot |
| Async `createApp` entry | ✅ | `server.listen` via `.then()` |
| **Portal login on PG** | ⚠️ Phase 2 | Auth service expects sync `users.findByEmail`; PG returns Promise. Full async migration of auth+review+invoice services = Phase 2/T2.1 |
| **PG e2e invoice** | ⚠️ Phase 2 | Blocked by auth; requires async service layer |

## T1.4 — pg_trgm Search Parity
| Test | Result | Verified by |
|---|---|---|
| Exact substring (T705) | ✅ PASS | pg-integration-test |
| Typo tolerance (crucail) | ✅ PASS | pg-integration-test |
| Garbage returns 0 | ✅ PASS | pg-integration-test |
| Brand search (Crucial) | ✅ PASS | pg-integration-test |

## T1.5 — Backup Baseline
| Item | Status |
|---|---|
| pg_dump 232KB | ✅ |
| Restore verified (81 products) | ✅ |

## PG Integration Test Suite (NEW — 24/24 PASS)

| Category | Tests | Result |
|---|---|---|
| Schema verification | 6 (tables, extensions, BIGINT, generated column, sequences) | ✅ 6/6 |
| Seed data verification | 7 (products, deep, brands, content, hero, policies, settings) | ✅ 7/7 |
| Search verification | 4 (exact, typo, garbage, brand) | ✅ 4/4 |
| Content verification | 3 (software 20, ITSOL 12, insights 14) | ✅ 3/3 |
| Invoice constraints | 3 (currency CHECK, date CHECK, auto-generated peppol) | ✅ 3/3 |
| Backup verification | 1 (data present) | ✅ 1/1 |
| **TOTAL** | **24** | **✅ 24/24 PASS** |

## Invoice constraint proofs (from test suite)
- `currency = 'USD'` → rejected by CHECK constraint ✅
- `due_date < issue_date` → rejected by CHECK constraint ✅
- `buyer_peppol` auto-generated as `'0235:' || buyer_tin` (ALWAYS) ✅

## Phase 1 exit gate

| Criterion | Status |
|---|---|
| PG 16 schema + extensions + sequences | ✅ 21 tables, pg_trgm, citext, ref_seq, inv_seq |
| Seeds count-verified | ✅ 300 rows, all counts match prototype |
| PG repository adapter | ✅ created + boot-compatible (settings cache) |
| Search parity | ✅ 4/4 pg_trgm tests pass |
| Backup + restore | ✅ 232KB dump, 81 products restored |
| PG integration test suite | ✅ **24/24 PASS** (NEW) |
| Portal service layer on PG | ⚠️ Phase 2 (async migration) |

**Phase 1 COMPLETE — cleared for Phase 2 (portal async migration + full PG service integration).**
