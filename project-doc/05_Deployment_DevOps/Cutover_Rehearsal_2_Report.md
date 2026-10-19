# Cutover Rehearsal #2 Report — T7.3

**Doc ID:** E6-R2 · **Script:** `Codebase/scripts/cutover-rehearsal.js` · **Raw timeline:** `Codebase/scripts/rehearsal-timeline.json`
**Executed:** 6 Oct 2026 (UTC) · **Result: 33 PASS / 0 FAIL · rollback 0.7 s (budget 600 s)**

## 1. What was rehearsed

The complete Day-0 sequence (E6) against a **fresh `simal_rehearsal` database** on the production PostgreSQL server, using the exact provisioning artifacts CI and the deploy pipeline use (`scripts/migrate.sql` + `scripts/seed.sql` via `psql -f`, `pg_dump.exe` from `tools/pgsql/bin`):

| Step | What ran | Timing | Verdict |
|---|---|---|---|
| 1. prepare | drop/create rehearsal DB | 0.4 s | ✅ |
| 2. migrate | `migrate.sql` + `seed.sql` via psql `ON_ERROR_STOP=1` | **0.5 s** | ✅ |
| 3. verify | 8 row-count gates + table count vs source of truth | 0.4 s | ✅ 81/78/20/97/5/7/3/7 + 25 tables exact |
| 4. redirects | legacy route map → live artifacts (5 SSG routes + 8 portal pages + tokenised draft-resume endpoint) | <0.1 s | ✅ 14/14 resolve |
| 5. backup | `pg_dump --no-owner --no-privileges` | **0.2 s** | ✅ schema + data (COPY) incl. catalog |
| 6. ABORT DRILL | corrupt `content_blocks` (0 ≠ 97) → criterion detected → drop → re-provision → verify | **0.7 s** (budget 600 s) | ✅ restored 97/81/25 exact |
| 7. teardown | rehearsal DB removed | 0.1 s | ✅ |

## 2. Defects the rehearsal found (and fixed same-session)

This is why rehearsals exist — run #1 failed 13 checks and exposed two real provisioning defects:

1. **`migrate.sql` carried no data seeds.** A fresh environment came up with 23 tables and **zero rows** — the dev database's 300 rows had been seeded by `scripts/seed.sql`, which was never part of the documented provisioning path. Fix: rehearsal + all CI/deploy DDL steps now apply `seed.sql` immediately after `migrate.sql`.
2. **`migrate.sql` was missing two tables.** `cms_revisions` and `analytics_events` were created directly on the dev DB during Phase 4 (T4.1/T5.4) and never folded back — fresh environments got 23 tables, not 25. Fix: **B6 section appended** (idempotent `CREATE TABLE IF NOT EXISTS` + indexes), verified re-appliable on the live dev DB without error.

Both defects mean every previously-described "fresh clone + migrate" path (including my own CI jobs from T6.1) would have failed — caught here, before any production window.

## 3. Abort-criteria mapping (E6 Day-0 table)

| E6 abort criterion | Rehearsed as | Detection | Rollback |
|---|---|---|---|
| counts mismatch vs staging | `content_blocks` wiped to 0 | count gate in step 3 shape | drop + re-provision + re-verify — **0.7 s** |
| smoke fail → rollback artifact | dump taken before mutation (step 5) | n/a (drill) | dump restorable (schema + COPY data verified) |
| redirect errors > 1% | route map existence checks | 14/14 resolve | n/a |

## 4. Honest deltas vs the E6 production night

- Timings above are for a 300-row dataset on local PG 16; production will carry legacy-imported KYC data. The mechanism is identical; absolute times will scale but the 600 s budget has ~850× headroom at current scale.
- DNS switch, TLS binding, and legacy-token exchange require the vendor environment (staging-domain bindings per the roadmap) — rehearsed here at the artifact/route level, not the DNS level. T7.5's executor drives those steps with explicit human confirmations.
- The rehearsal DB name is fixed (`simal_rehearsal`) and dropped at entry AND exit — rerunnable any night.

## 5. Sign-off

- [x] Full cutover sequence executed end-to-end on real PG with the real provisioning artifacts
- [x] Counts verification exact (8 gates + 25 tables)
- [x] Redirect map 14/14
- [x] Backup artifact proven (schema + data)
- [x] Abort drill + rollback ≤ 10 minutes — **proven at 0.7 s**
- [x] Timeline recorded with second-level stamps (`rehearsal-timeline.json`)

**REHEARSAL #2: PASS** — abort criteria verified, rollback duration proven under budget.
