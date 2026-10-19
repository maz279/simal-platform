# Next-Audit Readiness Pack — Simal Corporate Platform

**Document:** SIMAL-READINESS-2026-10-18 · **Revision 2 (2026-10-19)** · **Baseline:** `GOVERNANCE_REQUIREMENTS_BASELINE.md` v3.0
**Prepared:** 2026-10-18 · **Gate:** RM-10.4 (close the register & sign the gate)
**Rule applied (GOV-1):** role-title sign-offs are **not** human sign-offs. Names, wet/e-signatures
and dates are required in §6; this pack is evidence for those signatories, not a substitute.

> **Revision 2** brings this pack in line with the **deployment-readiness audit of 2026-10-18** —
> ledger `Codebase/scratch/rm-evidence/deploy-audit/FINDINGS.md` (rows D01–D09 and D22–D55, 43 rows;
> the ledger has no D10–D21), fix commits `8c37907` `ddc2114` `d32d5ed` `197ad47` `00beef6` `3fba62a`
> `e6feb75` `dc73f1f` `e613c5a`, platform CI run **#18 on `e613c5a`: 21/21 green**. Revision 1 was
> written on `6c1108e`, a tree the platform never ran green (D01). Every revision-1 count or status the
> ledger contradicts is corrected below and cites the ledger ID and its proof file; superseded values
> are kept in *italics* so the change is auditable.

---

## 1. Gate criteria → evidence

| # | Criterion (roadmap 10.4-3 / REMEDIATION_PLAN P10-4) | Result (rev 2) | Evidence |
|---|---|---|---|
| 1 | **No open Critical/High/Medium findings** | **0 open rated findings.** Board: **172 rows — 162 closed · 3 partial · 2 open · 5 owner decisions**. The 43 deploy-audit rows (1 Blocker, 25 High, 12 Medium, 5 Low) are all FIXED per the ledger. The 2 open rows are the ledger's in-progress items (ClamAV binaries review; Arabic pages that hardcode or discard CMS data) — **the ledger gives them no severity**. 44 earlier closures were contradicted by the ledger (the defect persisted or regressed after closing); each now carries the ledger ID in its evidence. *Rev 1: "0 open; 118 closed / 3 partial" on a 121-row board that contained none of the 43.* | `Codebase/remediation-board.csv` (generated; deploy rows parsed from the ledger); ledger `deploy-audit/FINDINGS.md`; `audit_report_2/FINDINGS_MATRIX.csv` |
| 2 | **CI green on the platform** | Platform run **#18 on `e613c5a` (HEAD), 21/21 jobs green** (2026-10-18). *Rev 1 cited platform run #5 and the local mirror on `6c1108e`; the platform run on that tree (#12) was **11/21** — unit + integration failed on a clean runner and build + every dist gate was skipped (ledger D01). The local mirror passed only because the rig's git-ignored `.env` carries `DOC_ENCRYPTION_KEY`; it is not a faithful substitute.* | `http://localhost:3000/simal-ci/simal-platform/actions/runs/18` — **no transcript is archived in the repo** (status reported by the deploy-audit session); D01 fix `8c37907` |
| 3 | **Clean-DB bring-up proven** | Fresh `simal_staging` from `migrate.sql`+`seed.sql`: 234 pages, portal booted as `simal_app` (`can_ddl=false`), gates + a11y green. **Since rev 1:** the production image builds from a clean context and comes up with PostgreSQL + nginx TLS edge and a bootstrap build (D44, D45, D51); the SSG build passes as `simal_build`, which now reads only the 9 content tables (D49). *234-page count not re-measured by the deploy audit.* | `scratch/rm-evidence/10.2-1-staging-rehearsal.log`, `-staging-gates.log`, `-staging-a11y.log`; `deploy-audit/deploy-rehearsal.log` (25/25); `deploy-audit/build-role-check.log` |
| 4 | **Real deploy proven** | **In rehearsal, yes; on a real host, no.** *Rev 1's proof (publish → served 15.3 s) used the `rm -rf` + `cp` DEPLOY_DIR publish, which left an empty or partial docroot during every publish and cannot work on a mounted volume (D46).* Now: in-place temp + rename sync; a CMS edit goes live over https through the edge; the portal survives a DB restart; rig publish loops ALL PASS. Remote rollout (registry, host, DNS/TLS) is an owner item (§4b). | `deploy-audit/deploy-rehearsal.log`; `deploy-audit/b3-publish-loop.log`, `b6-publish-loop.log`; *`10.2-2-deploy-proof.log` (rev 1)* |
| 5 | **Backup / restore (DR) proven** | Measured drill: integrity identical (27 tables / 4,266 rows, md5 checksums), **RTO 2.23 s**, **RPO 0.165 s**. *Not touched by the deploy audit.* | `docs/DR_DRILL_EVIDENCE.md` |
| 6 | **Monitoring + alerting** | 5xx → sink webhook delivers `{requestId,path,status,message}`; uptime probe; UPTIME FAIL drill; `SimalUptime` 5-min. **Correction:** `/api/health` answered `ok` with the database down until `3fba62a` (single `pg.Client`, D39), so an UP probe did not prove the DB was reachable. Health now pings the DB (503 `degraded`); the rehearsal shows `"db":"up"` through the edge. | `scratch/observability.jsonl`; `scratch/uptime.log`; `scratch/rm-evidence/9.3-*.log`; ledger D39; `deploy-audit/deploy-rehearsal.log` |
| 7 | **Scheduled batch work running** | SLA escalation fired **51 times live**; expiry reminders proven by fixture suite and live invocation. *Related, not a batch job:* the SSG job claim was not atomic and an unawaited `finishJob` could kill the process (D40) — fixed `3fba62a`; a claimed job that never starts is now recorded failed (`e613c5a`). | `scratch/rm-evidence/10.4-batch-jobs.log`; `test/integration/batch-jobs.test.js`; `test/integration/ssg-claim.test.js` |
| 8 | **Security independently retested** | 3 isolated black-box testers, **158 cases**, 20 findings → 19 fixed + 1 accepted *at retest*. **Correction:** two fixes did not hold and two were incomplete — PEN-2026-05 staff MFA was enforced only at boot (D31); PEN-2026-21 the UI still sent `body {}`, so every Rollback restored the newest snapshot (D07); PEN-2026-20 accepted uploads never reached the site (D09); PEN-2026-01's super_admin gate locked out super_admin too (D53). All re-fixed. In all the ledger records 1 Blocker and 25 High items, most outside the engagement's scope or findings — e.g. the legacy token exchange issued a session for **any** role, super_admin included, with no password or TOTP — now partner-only (D30). Internal suite 26/26 *(not re-run by the deploy audit)*. | `audit_report_2/PEN_TEST_ENGAGEMENT/PEN_TEST_ENGAGEMENT_REPORT.md` (addendum); ledger D07, D09, D30, D31, D53 |
| 9 | **Requirements traceable** | 25 requirements traced; **RTM rev 2: 14 conform, 6 partial, 4 deviations, 1 gap** (a16 staff MFA now conforms: D31 per-request enforcement + the 10.4-1 enrolment UI). *Rev 1 "13 conform, 6 partial, 5 deviations, 1 gap" did not match the RTM's own table (13 / 7 / 4 / 1).* | `Codebase/RTM.md` (rev 2) |
| 10 | **Sign-off by named individuals with dates** | **PENDING — human signatures** (§6) **and the owner decisions in §4b** | this document |

### Test counts (tree `e613c5a`)

| Suite | Result | Evidence |
|---|---|---|
| Portal unit + integration, JSON store (`ci.yml` unit step 1) — fresh clone, no `.env` | **149 tests: 141 pass · 0 fail · 8 skipped** (7 PostgreSQL-only suites, which run in the `integration` job; 1 rig e2e that needs a portal on :8090). *Rev 1: 147/147 on the rig with `.env` present.* | `deploy-audit/docs-fresh-clone-unit.log` |
| Feature suites (accounts, token bridge, ASP roundtrip, RFQ) | **28 / 28** *(rev 1: 27/27; the token bridge gained "staff account → 403, no session", D30)* | `deploy-audit/docs-fresh-clone-suites.log` |
| PG integration | **44 / 44** | ledger D39 |
| PG-mode journey | **7 / 7** | ledger D01 (fresh clone) |
| CI gates (`run-gates.mjs`) | **16 gates** — 15 PASS + crawl FAIL (8 missing `/products/` anchors) in `b4-run-gates.log`, crawl re-run PASS in `b5-gates-crawl.log`; all 16 run in platform run #18. *Rev 1 said "12 / 12"; its own log `10.4-final-gates.log` shows 15 gates; `cms-integrity` (`197ad47`) is the 16th.* | `deploy-audit/b4-run-gates.log`, `b5-gates-crawl.log` |
| Platform CI (`ci.yml`, required contexts on `main`) | **21 jobs — 21 / 21 on run #18** (7 base jobs + 13 `gate-*` jobs running the 16 gate scripts + `lighthouse`) | run #18 (see criterion 2) |
| Deployment rehearsal (production image + PostgreSQL + nginx TLS edge) | **25 / 25** | `deploy-audit/deploy-rehearsal.log` |
| CMS data integrity (gate `cms-integrity`) | **28 assertions PASS** (fails at "hero kept" on the old code, D05) | `deploy-audit/b4-run-gates.log` |
| Build-role least privilege | **ALL PASS** — 9 content tables readable, `users`/`sessions`/`one_time_tokens`/`submissions`/`documents`/`audit_log`/`settings` denied; astro build passes as `simal_build` (D49) | `deploy-audit/build-role-check.log` |
| Rig publish loop / Arabic CMS round trip | **ALL PASS** / **ALL PASS** | `deploy-audit/b6-publish-loop.log`, `ar-cms-roundtrip.log` |
| Security verification (internal) | **26 / 26 PASS** *(not re-run by the deploy audit)* | `scratch/rm-evidence/10.4-final-security.log` |
| Independent pen engagement | **158 cases** — see criterion 8 for the four fixes the ledger reopened | `PEN_TEST_ENGAGEMENT_REPORT.md` |
| Accessibility: axe (WCAG 2.2 A/AA + CMS) | **0 violations** (gate `a11y` PASS) | `deploy-audit/b4-run-gates.log` |
| Accessibility: AT walkthrough (AX tree + keyboard) | **0 blocking**, 7 pages incl. `/ar/` *(not re-run)* | `10.2-3-at-run3.log` |
| Lighthouse CI (platform) | perf ≥ 0.85, LCP ≤ 2.5 s, CLS ≤ 0.05, TTFB ≤ 200 ms — run #14 caught `/products/` CLS **0.135** (D52), fixed `e6feb75`; green on run #18 | ledger D52 |
| Rate limiting (edge vs app) | 11×401 then 429 / app-direct 15×401. **Correction:** the app limiters and lockout trusted the leftmost `X-Forwarded-For`, so any client could pick its IP past them (D29) — fixed, `client-ip.test.js` 5/5. *The edge/app probe was not re-run.* | `9.4-3.log`; ledger D29 |
| DR drill | RTO 2.23 s / RPO 0.165 s, integrity identical | `docs/DR_DRILL_EVIDENCE.md` |

## 2. Register state (`remediation-board.csv`, generated)

- **172 rows** — 77 original + 17 re-audit + 20 pen-test + 7 P10/gov + **43 deploy-audit (D-rows) +
  3 deploy open-list + 5 owner decisions**. *Rev 1: "114 rows"; the board then had 121 (the
  generator's summary line left the 7 P10/gov rows out of its total — corrected).*
- **162 closed · 3 partial · 2 open · 5 human (owner decision).** *Rev 1: 118 closed · 3 partial · 0 open.*
- The deploy rows are parsed from the ledger at generation time (status FIXED → closed, OPEN → open,
  HUMAN → human), so the board cannot drift from it.
- **44 earlier closures carry a deploy-audit note** naming the ledger ID, the re-fix commit and the
  proof — e.g. DAT-5 / PEN-2026-21 (rollback, D07), SEC-10 (SSG child env, D35), SEC-8 / NFR-4
  (X-Forwarded-For, D29), DAT-9 (`simal_build` read every table, D49), PUB-2 (nginx, D45),
  F-2026-N03 / NFR-6 (platform CI, D01), F-2026-N12 (the stale `ssg-outbox-sync.test.mjs` was only
  deleted in `e6feb75`).
- The 3 partial rows (unchanged): **P10-4** (this sign-off), **DEV-07** (Arabic content, accepted with
  plan), **PEN-2026-14** (RFQ reference format, accepted Low — baseline amendment proposal in §4).
- The 2 open rows: **DA-OPEN-1** ClamAV binaries tracked in git (`tools/clamav`) — size/licence review;
  **DA-OPEN-2** Arabic pages hardcode or discard CMS data (home, about, contact, software, legal index,
  onboarding); chrome partially hardcoded. *`e6feb75` made Arabic home/about/contact/software render
  their CMS blocks (`ar-cms-roundtrip.log`), but the ledger still lists the item as open.*
- DA-OPEN-3 (these documents) is closed by this revision.

## 3. Evidence index

| Area | Evidence |
|---|---|
| **Deploy-readiness audit** | `scratch/rm-evidence/deploy-audit/FINDINGS.md` (ledger) + its proof files in the same folder; `docs-pass.md` (this documentation pass) |
| Gates | `deploy-audit/b4-run-gates.log` + `b5-gates-crawl.log` (16 gates); *rev 1: `10.3-final-gates.log`, `10.2-gates-final.log`* |
| Tests | `deploy-audit/docs-fresh-clone-unit.log` (149: 141 pass / 8 skipped), `docs-fresh-clone-suites.log` (28/28); *rev 1: `10.3-final-npmtest.log` (147/147), `10.2-suites.log` (27/27)* |
| Deployment | `deploy-audit/deploy-rehearsal.log` (25/25), `build-role-check.log`, `b3-` / `b6-publish-loop.log`; `infra/docker/compose.yml`, `apps/portal/Dockerfile` (repo-root build context, D44), `infra/nginx/portal-staging.conf` + `snippets/simal-proxy.conf` (D45) |
| Security engagement | `audit_report_2/PEN_TEST_ENGAGEMENT/`, `scratch/rm-evidence/10.3-pentest/` |
| RTM | `Codebase/RTM.md` rev 2 (+ archived Phase-6 RTM under `docs/archive/`) |
| SSG / deploy (rev 1) | `10.1-control-loop-probe.log`, `10.2-2-deploy-proof.log` |
| Staging | `10.2-1-staging-*.log`, `docs/STAGING_RUNBOOK.md` |
| DR | `docs/DR_DRILL_EVIDENCE.md` |
| Monitoring | `scratch/observability.jsonl`, `scratch/uptime.log`, `9.3-*` |
| Batch jobs | `10.4-batch-jobs.log`, `test/integration/batch-jobs.test.js` |
| A11y / AT | `10.2-3-at-run3.log`, `10.2-1-staging-a11y.log`, `docs/uat/2026-10/at-walkthrough.md` |
| Rate limits | `9.4-3.log`, `test/integration/pen-regressions.test.js` (H1/H2), `test/unit/client-ip.test.js` (D29) |
| CI | platform run #18 (`e613c5a`, 21/21 — no transcript in the repo); `9.1-3.txt` (run #5, 21/21, historical); *`10.4-local-ci-3.log` is a rig mirror, not platform evidence (D01)* |

## 4. Accepted risks & open governance items (signed acceptance required)

| # | Item | Severity | Disposition | Owner |
|---|---|---|---|---|
| A1 | **Arabic content parity** — 17 AR pages vs 217 EN; CMS AR-block coverage 10 % (GOV a29). The AR tree renders correctly (`lang=ar`, RTL, AT-verified). **Rev 2:** the deploy audit found and fixed functional AR defects — every Arabic RFQ failed (D04), `/ar/solutions/` showed 5 of 12 lines (D23), AR form phone/email rendered RTL (D27) — and the ledger keeps "Arabic pages hardcode or discard CMS data" **open** (DA-OPEN-2). *Page counts not re-measured.* | Medium | **Accepted with a dated content programme** (translate remaining templates + blocks; the CMS already tracks coverage). Gate signatories must accept this scope explicitly. | Content lead |
| A2 | **P10-4 / this sign-off** — cannot be closed until the named humans in §6 sign and the §4b owner decisions are settled. | Medium (process) | Pending §6 / §4b. | Steering |
| A3 | RFQ reference format `SIMAL-RFQ-YYYYMMDD-NNNN` vs baseline `RFQ-YYYY-NNNNN` | Low | Accepted; **baseline amendment proposed** (as-built format is tested, used in UAT and status pages). | Governance board |
| A4 | Commercial pen-test letter (a contracted external firm) | Process | Not contracted here; the independent engagement + retests in §1 are the current evidence. | Steering |
| A5 | SMTP is simulated on the rig (`notify` seam; outbox `simulated`). **Rev 2:** the real SMTP client could not deliver over STARTTLS and sent AUTH in clear on :25 (D37); emailed links were relative (D38) — both fixed (`smtp-client.test.js` 3/3, `PORTAL_PUBLIC_URL` required in production). | Low | Accepted for pre-production; the production SMTP relay is an owner value (§4b). | DevOps |
| A6 | Dev/test staff accounts may log in password-only (rig `ADMIN_MFA_REQUIRED=false`) | Low | Accepted for the dev rig. **Production fails closed at boot and now on every staff request** (`requireStaff`; staff may not disable MFA in production — D31, `staff-mfa-enforced.test.js`); staff self-enrol from the staff console. *Rev 1 said boot only.* | Platform Eng |
| A7 | CSRF token remains bearer-capable; `SameSite=Strict` + origin checks + strict mode mitigate. **Rev 2:** without `CSRF_SECRET` the token secret was a source literal and production still booted (D33) — production now refuses to start without it. | Low | Accepted; `CSRF_STRICT=true` available per environment; `CSRF_SECRET` is a production value (§4b). | Security |
| A8 | Baseline text deviations DEV-01/02/03/04/09/10/11/12 (reference formats, step count, roles, TRN checksum, envelope, etc.) | Low | Recorded in `RTM.md`; proposed amendments listed for the governance board. | Governance board |

### 4b. Owner decisions (HUMAN) — verbatim from the ledger, not done

These are listed exactly as in the ledger's "Owner decisions (HUMAN)" section (board rows
DA-HUMAN-1…5, status `human`). No agent may mark them done.

- Rotate the rig staff passwords that are in pushed history (unchanged; owner action).
- Re-seal FREEZE_MANIFEST.json for the release that carries these fixes (CAB: PM, TL, OPS) — deploy.yml blocks on drift by design.
- Remote rollout: registry, target host, DNS/TLS (deploy.yml OPS checklist; infra/docker/compose.yml).
- Catalog data: 9 products under brand "other" (HS-SSD-* / HS-ESSD-* look like HIKSEMI, HC000017 like Honeywell, RTX2060/GTX1030 like ARKTEK — confirm before reassigning); 2 duplicate Honeywell listings (`…-ex_24b617a1`, `…-4-uni_a13c0ee0`); slug `1672` is a numeric import slug (a slug change needs a redirect).
- Production values: SIMAL_TIN (FTA certificate), PORTAL_PUBLIC_URL, SMTP relay, a real sanctions/PEP WATCHLIST_CSV (the rig runs the 5-entry fixture), CSRF_SECRET, clamd host.

## 5. Residual technical notes (no action for the gate)

- Media filesystem errors other than ENOENT rely on the same pre-header path and the guarded
  process handler (tester note).
- The `viewer` role is now bound to the masked queue + masked CSV; a future "auditor" role may
  want read-only analytics (product decision).
- Observability sink on the rig writes to `scratch/observability.jsonl`; staging/production
  point `OBSERVABILITY_WEBHOOK_URL` at the ops channel.
- **Incident 2026-10-18 (ledger):** `prod-db-roles.sql` run on a scratch database rotated the live
  `simal_app`/`simal_build` passwords, because PostgreSQL roles are cluster-wide; restored from
  `apps/portal/.env` within ~7 min. Never run that script against any database of a shared cluster
  with new passwords.

## 6. Sign-off block (named individuals, dates required — GOV-1)

> Signing below asserts you have reviewed §1–§4b and accept the listed risks. Role titles alone
> are not sign-offs; a name and date are mandatory.

| Role | Name | Decision | Date | Signature |
|---|---|---|---|---|
| QA lead (executor, electronic) | Remediation program execution agent | Gate evidence reviewed; technical criteria 1–9 met | 2026-10-18 | signed electronically (records: this pack + board) |
| Engineering lead | ____________________ | ☐ approve  ☐ reject | ____-__-__ | __________ |
| Security reviewer | ____________________ | ☐ approve  ☐ reject | ____-__-__ | __________ |
| Compliance / data protection | ____________________ | ☐ approve  ☐ reject | ____-__-__ | __________ |
| Product / Project manager | ____________________ | ☐ approve  ☐ reject (incl. §4 A1, A3) | ____-__-__ | __________ |
| Business owner — vendor persona | ____________________ | ☐ accept §4 A1  ☐ reject | ____-__-__ | __________ |
| Business owner — customer persona | ____________________ | ☐ accept §4 A1  ☐ reject | ____-__-__ | __________ |

> **Rev 2 note on the executor row:** that electronic sign-off (2026-10-18) was given on revision 1,
> before the deploy audit showed criterion 2 unmet on that tree (D01) and 44 board closures
> contradicted. It is kept as recorded; it does not cover revision 2.

**Gate status: PREPARED — NOT YET SIGNED.** "Production ready" may be asserted only after every
row above carries a name, a decision and a date **and the §4b owner decisions are settled**. The
technical evidence for criteria 1–9 is refreshed in revision 2 on `e613c5a` (2026-10-19); criterion 10
and §4b are the remaining human acts.

---

*Copies: `Audit/Independent_Forensic_Audit_2026-10-12/audit_report_2/NEXT_AUDIT_READINESS.md`
(authoritative) and `Codebase/docs/NEXT_AUDIT_READINESS.md` (repository copy). Revision 2 was
written in the repository copy and copied verbatim; the `Audit/` folder is not under version control.*
