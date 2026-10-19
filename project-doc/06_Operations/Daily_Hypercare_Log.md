# Daily Hypercare Log

**Doc ID:** F1-DHL · **Task:** T8.1 · **Machine source of truth:** `Codebase/scripts/hypercare-log.json` (one entry per calendar day, latest run wins) · **Run:** `node scripts/hypercare-daily.js`

---

> [!IMPORTANT]
> **GOVERNANCE STATUS: UNEXECUTED REHEARSAL DRILL LOG (P9-3 / GOV-3)**
> This log records pre-cutover testing and dry-run baseline verification. It does NOT represent live production hypercare. The baseline entry dated 2026-10-06 is an internal automated rehearsal run.

---

Each standup opens with yesterday's row below (the on-call pair re-runs the script at 07:00 GST; this table is the human-facing rendering). ATTN rows require a standup note and, if recurring, an incident-register entry.

| Date | Verdict | Gates | Health | Outbox | KYC queue | Inv SLA | Lockouts/24h | Standup note |
|---|---|---|---|---|---|---|---|---|
| 2026-10-06 (baseline) | CLEAN | 6/6 | 3/3 | 0 stale | 0 pending / 0 new | 0 overdue | 7 | Pre-go-live baseline run — rig proven on the live environment |

## Incident register (SEV-1/2 open here blocks hypercare exit — T8.4)

| # | Date | Severity | Incident | Response (SLA) | Resolution (SLA) | State |
|---|---|---|---|---|---|---|
| — | | | *(none recorded)* | | | |

## Verdict legend

- **CLEAN** — every probe green.
- **ATTENTION** — probe lines listed by name in the JSON; on-call diagnoses per F1 §common-tasks and notes the resolution here.
