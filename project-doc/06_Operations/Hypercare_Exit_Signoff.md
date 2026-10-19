# Hypercare Exit & Operational Handover Sign-Off

**Doc ID:** F1-HEX · **Task:** T8.4 · **Outer bound:** 1 January 2027 (mandate date — hypercare MUST have exited by then) · **Authority:** PM + OPS joint signature · **Machine audit:** `node scripts/hypercare-daily.js --exit-audit`

---

> [!IMPORTANT]
> **GOVERNANCE STATUS: UNEXECUTED EXIT TEMPLATE (P9-3 / GOV-3)**
> This document is a pre-cutover operational template. It does NOT represent a past hypercare exit event. Criteria marked 'MET' reflect pre-cutover rehearsal drills only. Formal hypercare exit sign-off will occur post-go-live after the 14-day zero-incident streak is proven in live production.

---

## 1. Exit criteria (F1 §7)

| # | Criterion | Machine-auditable | Status |
|---|---|---|---|
| 1 | 14 consecutive days with zero SEV-1/SEV-2 operational incidents | yes — CLEAN-day streak in `hypercare-log.json` + incident register | **IN PROGRESS** (streak counter live; register empty) |
| 2 | Backup + restore drills executing on schedule | yes — rehearsal evidence (`rehearsal-timeline.json`) | **MET** — 33/33, rollback 0.7 s / 600 s |
| 3 | Monitoring, alerting, log aggregation with zero blind spots | yes — daily rig coverage (6 probes) + E5 dashboards at go-live | **MET** (rig); E5 field dashboards pending go-live |
| 4 | Support staff trained on CMS + KYC console | no — human | **PENDING** |
| 5 | Zero unresolved SEV-1/2 (SLA table F2) | register | **PENDING** (register open, none recorded) |

**Exit rule: all five MET + this page signed by PM and OPS.**

## 2. Handover content (steady-state)

| Receiving team | Scope |
|---|---|
| Simal IT operations | Portal + site ops, daily checklist, backups, first-line incidents |
| Unisoft tier-3 support | Deep defects, ERP-side integrations, Phase-1.1 backlog execution |

Handover package: F1 Operations Runbook · F2 SLA Handbook · F3 post-mortem template · this sign-off · `Codebase/LEARNINGS.md` (24 engineering lessons) · `Codebase/ARCHITECTURE_STATE.md`.

## 3. Sign-off — PENDING (human; only after criteria 1, 4, 5 are MET)

| Role | Name | Signature | Date |
|---|---|---|---|
| Operations Lead | | | |
| Project Manager | | | |
| Simal IT Director (receiving) | | | |

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | Exit-audit rig live: machine criteria 2–3 MET, criterion 1 counter started (streak counts only post-go-live days), 4–5 pending humans |
