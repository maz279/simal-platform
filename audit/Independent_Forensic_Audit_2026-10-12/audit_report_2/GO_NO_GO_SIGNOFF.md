# Go/No-Go Sign-Off — Simal Corporate Platform (rm 10.4-3)

**Gate:** P10-4 / RM-10.4-3 · **Prepared:** 2026-10-18 · **Revision 2:** 2026-10-19 · **Evidence pack:** `NEXT_AUDIT_READINESS.md` (rev 2)
**Rule (GOV-1):** a role title is not a sign-off — every line needs a name, a decision and a date.

> **Revision 2** aligns this sheet with the deployment-readiness audit of 2026-10-18 (ledger
> `Codebase/scratch/rm-evidence/deploy-audit/FINDINGS.md`, D01–D55; HEAD `e613c5a`; platform run #18
> 21/21). Revision 1 statuses the ledger contradicts are kept in *italics* beside the correction.

## Gate status

**TECHNICAL CRITERIA: evidence refreshed on `e613c5a` (rev 2) — see notes on 1, 2, 4, 6, 8.**
*Rev 1: "GREEN (9/9)" — criterion 2 was not met on that tree (platform run #12, 11/21 — D01).*
**HUMAN SIGN-OFF: PENDING. OWNER DECISIONS: PENDING (below).** "Production ready" may be asserted
only when every line below is complete. No agent or role title may sign on a person's behalf.

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | No open Critical/High/Medium findings | 0 open rated findings. Board 172 rows: 162 closed · 3 partial · 2 open (the ledger's in-progress items, unrated) · 5 owner decisions; the 43 deploy-audit rows are FIXED. *Rev 1: "✅ 0 open; 2 documented partials" on a 121-row board without them.* | `remediation-board.csv`; ledger |
| 2 | CI green (platform + current HEAD) | ✅ platform run **#18 on `e613c5a`, 21/21** (no transcript archived in the repo). *Rev 1: "platform run #5 21/21; local mirror 21/21 on HEAD" — the platform run on that HEAD was 11/21 (D01).* | run #18; ledger D01 |
| 3 | Clean-DB bring-up | ✅ 234 pages, `simal_app`, gates green; production image + PostgreSQL + nginx edge from a clean context (deploy rehearsal 25/25) | `10.2-1-staging-*`; `deploy-audit/deploy-rehearsal.log` |
| 4 | Real deploy | Rehearsed ✅ — CMS edit live over https through the edge; *rev 1's proof used the `rm -rf` + `cp` publish that emptied the docroot mid-publish (D46)*. **Remote rollout to a real host: owner decision.** | `deploy-audit/deploy-rehearsal.log`, `b6-publish-loop.log`; *`10.2-2-deploy-proof.log`* |
| 5 | Backup / restore | ✅ RTO 2.23 s, RPO 0.165 s, integrity identical | `docs/DR_DRILL_EVIDENCE.md` |
| 6 | Monitoring + alerting | ✅ sink + uptime probe + UPTIME FAIL drill; `/api/health` now pings the DB (*it answered ok with the DB down until `3fba62a` — D39*) | `observability.jsonl`, `uptime.log`; ledger D39 |
| 7 | Scheduled batch jobs | ✅ SLA escalation 51 live firings; expiry job executes | `10.4-batch-jobs.log` |
| 8 | Independent security retest | ✅ 158 cases; 19 fixed, 1 accepted at retest — *four fixes reopened by the ledger and re-fixed: PEN-2026-05 (D31), -21 (D07), -20 (D09), -01 (D53)* | `PEN_TEST_ENGAGEMENT_REPORT.md` §5b |
| 9 | Requirements traceability | ✅ 25 rows traced (rev 2: 14 conform · 6 partial · 4 deviations · 1 gap); deviations registered | `Codebase/RTM.md` |

## Accepted risks requiring explicit acceptance

| ID | Item | Severity | Acceptance condition |
|---|---|---|---|
| A1 | Arabic content parity (17 AR vs 217 EN pages; CMS AR coverage 10 %). *Rev 2: ledger Open — Arabic pages hardcode or discard CMS data.* | Medium | Business owners + PM accept the content programme and its target date |
| A2 | Commercial pen-test letter (a contracted firm) not yet obtained | Process | Steering accepts the independent engagement as interim evidence |
| A3 | RFQ reference format vs baseline a7 | Low | Governance board accepts the baseline amendment |
| A4 | SMTP simulated on the rig. *Rev 2: the real client could not deliver over STARTTLS until `3fba62a` (D37).* | Low | DevOps accepts; production SMTP relay at deploy (owner value) |
| A5 | Dev-rig staff may log in password-only | Low | Accepted: production fails closed at boot **and on every staff request** (D31; *rev 1: boot only*); staff self-enrol (staff console) |
| A6 | CSRF token bearer-capability residual | Low | Security accepts with `SameSite=Strict` + strict mode option; production requires `CSRF_SECRET` (D33) |

## Owner decisions (HUMAN) — verbatim from the ledger, not done

- Rotate the rig staff passwords that are in pushed history (unchanged; owner action).
- Re-seal FREEZE_MANIFEST.json for the release that carries these fixes (CAB: PM, TL, OPS) — deploy.yml blocks on drift by design.
- Remote rollout: registry, target host, DNS/TLS (deploy.yml OPS checklist; infra/docker/compose.yml).
- Catalog data: 9 products under brand "other" (HS-SSD-* / HS-ESSD-* look like HIKSEMI, HC000017 like Honeywell, RTX2060/GTX1030 like ARKTEK — confirm before reassigning); 2 duplicate Honeywell listings (`…-ex_24b617a1`, `…-4-uni_a13c0ee0`); slug `1672` is a numeric import slug (a slug change needs a redirect).
- Production values: SIMAL_TIN (FTA certificate), PORTAL_PUBLIC_URL, SMTP relay, a real sanctions/PEP WATCHLIST_CSV (the rig runs the 5-entry fixture), CSRF_SECRET, clamd host.

## Signature block

| Role | Name | Decision | Date | Signature |
|---|---|---|---|---|
| QA lead (executor, electronic) | Remediation execution agent | Gate evidence reviewed; criteria 1–9 met | 2026-10-18 | signed electronically (this sheet + readiness pack) |
| Engineering lead | ______________________________ | ☐ approve  ☐ reject | ____-__-__ | ______________________ |
| Security reviewer | ______________________________ | ☐ approve  ☐ reject | ____-__-__ | ______________________ |
| Compliance / data protection | ______________________________ | ☐ approve  ☐ reject | ____-__-__ | ______________________ |
| Project / product manager | ______________________________ | ☐ approve  ☐ reject (incl. A1–A3) | ____-__-__ | ______________________ |
| Business owner — vendor persona | ______________________________ | ☐ accept A1  ☐ reject | ____-__-__ | ______________________ |
| Business owner — customer persona | ______________________________ | ☐ accept A1  ☐ reject | ____-__-__ | ______________________ |

> **Rev 2 note on the executor row:** given on revision 1 (2026-10-18), before the deploy audit showed
> criterion 2 unmet on that tree (D01). Kept as recorded; it does not cover revision 2.

> **Why the blank lines are not filled:** the signatories are named people in the client
> organisation; naming them or signing on their behalf would fabricate a governance record
> (GOV-1). The gate is *prepared*; the signature act is theirs.
