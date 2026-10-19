# docs(deploy-audit) pass — 2026-10-19

Closes the ledger's Open item "Docs: readiness pack / RTM / board counts stale (agent report A1–A16)".

**Source of truth:** `FINDINGS.md` in this folder (rows D01–D09 and D22–D55 — 43 rows; the ledger has
no D10–D21) and commits `8c37907` `ddc2114` `d32d5ed` `197ad47` `00beef6` `3fba62a` `e6feb75` `dc73f1f`
`e613c5a` on `main`; platform CI run #18 on `e613c5a`, 21/21.

**Method.** The A1–A16 agent report itself was not available to this pass (not in the repository, the
shared notes folder or a searchable transcript), so every count and status in the documents below was
diffed against the ledger directly. A claim the ledger contradicts is corrected and cites the ledger ID
and its proof file; the superseded value is kept in italics or in a dated note. Historical records
(phase ratifications, milestone evidence) are not rewritten — each gets a dated note naming what the
ledger contradicts. No product code, CI workflow, test, `apps/portal/.env` or secret was touched.

## Counts re-measured for this pass

Fresh `git clone` of `main` @ `e613c5a`, `npm ci`, no `apps/portal/.env`, `DATABASE_URL` /
`ADMIN_DATABASE_URL` unset (the D01 method — nothing reaches the rig database):

| Command (ci.yml `unit` job) | Result | Log |
|---|---|---|
| `NODE_KYC_TEST=1 node --test test/unit/*.test.js test/integration/*.test.js` | 149 tests: 141 pass · 0 fail · 8 skipped (7 PostgreSQL-only suites that run in the `integration` job; 1 rig e2e that needs a portal on :8090) | `docs-fresh-clone-unit.log` |
| `NODE_KYC_TEST=1 node --test test/account-services… token-exchange… peppol-sandbox-roundtrip… rfq…` | 28 / 28 | `docs-fresh-clone-suites.log` |

Everything else is taken from the ledger or its proof files: 16 local gates (`b4-run-gates.log` 15 PASS +
crawl FAIL, `b5-gates-crawl.log` crawl PASS), 21 platform jobs (`ci.yml`), deploy rehearsal 25/25,
cms-integrity 28 assertions, PG integration 44/44 (D39), pg-mode journey 7/7 (D01).

## Board (`remediation-board.csv`)

`scripts/ci/generate-remediation-board.mjs` now parses the ledger (table rows, the Open list and the
Owner decisions) so the board cannot drift from it, maps each D-row to its fix commit (data), and
appends a ledger note to the evidence of every earlier closure the ledger contradicts (data, 44 rows).
Its summary line also counted 114 for a 121-row board (P10/gov rows left out) — corrected.

```
remediation-board.csv: 172 rows (77 original + 17 re-audit + 20 pen + 7 gate/gov + 43 deploy-audit + 3 deploy open-list + 5 owner decisions)
  closed: 162 | partial: 3 | open: 2 | human (owner decision): 5
  closures the deploy-audit ledger contradicts (noted in evidence): 44
```

Open rows DA-OPEN-1 (ClamAV binaries in git) and DA-OPEN-2 (Arabic pages hardcode/discard CMS data)
have no severity in the ledger and are shown as "—". DA-OPEN-3 is this pass (marked DONE in the
ledger). DA-HUMAN-1…5 are the ledger's Owner decisions, status `human` — never `closed`.

## Documents changed

In the repository (committed with this record):

| File | Change |
|---|---|
| `docs/NEXT_AUDIT_READINESS.md` | Revision 2: criteria 1, 2, 3, 4, 6, 7, 8, 9 corrected; test-count table re-based on `e613c5a`; register state 172 rows; evidence index; A1/A5/A6/A7 notes; §4b Owner decisions verbatim; executor sign-off flagged as rev 1 only |
| `RTM.md` | Revision 2: evidence snapshot (platform #18, 16 gates, 149/28, rehearsal 25/25); a16 → ✅ (D31); notes on a13 (D32/D45), a20/a21 (D29), a24 (D52), a28 (D41), a29 (D04/D06/D23, Open), a32 (D04), a35 (D05–D07), a36 (D30), a38 (D02/D55), a44; DEV-05 closed; E7 fixed, E9–E11 added; status count 14/6/4/1 (rev 1's summary 13/6/5/1 did not match its own table, 13/7/4/1) |
| `remediation-board.csv` + generator | as above |
| `ARCHITECTURE_STATE.md` | historical-snapshot note on the header; as-built deploy topology (D44/D45/D46); X-Forwarded-For (D29) and lockout defaults; `simal_build` scope (D49) and child env (D35); `prod-db-roles.sql` is cluster-wide (incident) |
| `PHASE0`…`PHASE8_RATIFICATION.md` | dated note under each title; PHASE2 lists D44, D45, D36, D30, D31, D43; PHASE4 D07, D06; PHASE5 D37, D38, D34; PHASE7 D50 + freeze re-seal owner decision |
| `docs/GOVERNANCE_REQUIREMENTS_BASELINE.md` a44 | 15 → 16 gate scripts (`197ad47`), run #12 / #18; board counts marked historical |
| `docs/STAGING_RUNBOOK.md` | `prod-db-roles.sql` cluster-wide warning; per-request staff MFA and production-config refusals (D31/D33/D41/D47) |
| `docs/PEN_TEST_ENGAGEMENT_REPORT.md` | §5b post-engagement corrections: PEN-2026-05 (D31), -21 (D07), -20 (D09), -01 (D53); D30 |
| `scratch/rm-evidence/10.4-milestone-evidence.md` | superseded-counts note |
| `taskboard.csv` | notes on T2.4 (D30), T4.3 (D07), T5.1 (D37/D38), T7.1 (re-seal owner decision), T7.2 (D50/D44/D45), T7.5 (no go-live; rollout owner decision) |
| `FINDINGS.md` | Open item "Docs" marked DONE (only ledger edit) |

Outside the repository — `Audit/Independent_Forensic_Audit_2026-10-12/audit_report_2/` is **not under
version control**, so these edits are not in the commit and have no history:

| File | Change |
|---|---|
| `NEXT_AUDIT_READINESS.md` | verbatim copy of the repository revision 2 |
| `PEN_TEST_ENGAGEMENT/PEN_TEST_ENGAGEMENT_REPORT.md` | verbatim copy of the repository version (§5b) |
| `GO_NO_GO_SIGNOFF.md` | revision 2: criteria 1, 2, 3, 4, 6, 8, 9; A1/A4/A5/A6; Owner decisions verbatim; executor-row note |
| `FINDINGS_MATRIX.csv` | 44 rows: ledger note appended to column 5; ids and verdicts unchanged (the board regenerates byte-identical) |
| `ROADMAP_TASK_TRACKER.csv` | 35 rows: ledger note appended to `evidence_ref`; **RM-10.4-1 done → open** (the board is no longer zero-open) |

Reviewed, unchanged: `AUDIT_REPORT_2.md` (the re-audit's own findings, dated), `IMPLEMENTATION_ROADMAP_CLEAN_AUDIT.md`
and `ROADMAP_V1.2_VERIFICATION_LEDGER.md` (plan text and plan verification, no status claims),
`PEN_TEST_COMMISSION_PACK.md` (scope pack), `scripts/ci/README.md` (already lists the 16 gates),
`infra/ci-platform/README.md` (dated run #5 timing).

## Not verified here

- Platform run #18: status as reported by the deploy-audit session; the Gitea API needs a signed-in
  token, which this pass did not use, and no run transcript is archived in the repository.
- Not re-run: security-verification (26/26), AT walkthrough, rate-limit edge probe, DR drill, the
  234-page and 17/217 AR/EN page counts.
- The ledger's Open item "Arabic pages hardcode or discard CMS data (home, about, contact, software, …)"
  was left as the ledger states it, although `e6feb75` made AR home/about/contact/software render their
  CMS blocks (`ar-cms-roundtrip.log`); the documents say both.
