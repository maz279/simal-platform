# Hypercare Roster — December 2026

**Doc ID:** F1-HR · **Task:** T8.1 · **Period:** 4 Dec 2026 (02:00 GST go-live) – hypercare exit (criteria-based, outer bound 1 Jan 2027) · **Owner:** OPS

---

> [!IMPORTANT]
> **GOVERNANCE STATUS: UNEXECUTED OPERATIONAL ROSTER TEMPLATE (P9-3 / GOV-3)**
> This document is an unexecuted operational shift roster template. Staff assignments are deliberately left unpopulated until Phase 10 verified cutover readiness. It does NOT represent active hypercare operations.

---

## 1. Shift structure

12-hour on-call pairs covering the initial 72-hour window (4–7 Dec), then daily cover until exit criteria are met. The daily machine checklist (`Codebase/scripts/hypercare-daily.js`) runs at 07:00 GST ahead of the 09:00 GST standup — the on-call pair reviews its verdict first.

| Shift | Hours (GST) | Days 1–3 (4–7 Dec) | Steady hypercare |
|---|---|---|---|
| A | 08:00–20:00 | Pair A1 (primary + secondary) | Pair A1 |
| B | 20:00–08:00 | Pair B1 (primary + secondary) | Pair B1 (on-call) |

**Staffing table — HUMAN (names assigned by OPS before 4 Dec; left blank deliberately, never fabricated):**

| Pair | Primary (name/contact) | Secondary (name/contact) | Escalation TL | Escalation PM |
|---|---|---|---|---|
| A1 | *(to assign)* | *(to assign)* | | |
| B1 | *(to assign)* | *(to assign)* | | |

## 2. Incident response SLAs (F2 v2.0)

| Severity | Definition | Response | Resolution |
|---|---|---|---|
| SEV-1 | Critical outage, security breach | ≤ 15 min | ≤ 4 h |
| SEV-2 | Major degradation, e-invoicing failure | ≤ 30 min | ≤ 8 h |
| SEV-3 | Moderate issue, non-critical bug | ≤ 2 h | ≤ 24 h |

Rollback authority: PM decides within 10 minutes of any abort criterion; TL executes (E6). No committee at 2 a.m.

## 3. Daily standup agenda (09:00 GST)

1. `hypercare-daily.js` verdict + any ATTENTION lines (gates · health · outbox · KYC queue · invoice SLA · lockouts)
2. Error dashboard + rate-limit anomalies since yesterday
3. Support tickets vs SLA table
4. Incident register review (open SEV-1/2 = exit-criteria blocker, escalate immediately)

## 4. Machine support (what the rig does for the pair)

| Check | Tool | Cadence |
|---|---|---|
| 6 automated gates re-run | `go-nogo-gate.js` (inside daily) | daily 07:00 |
| Health probe ×3 | inside daily | daily |
| Outbox draining (queued < 1 h) | inside daily | daily |
| KYC queue + invoice SLA ages | inside daily | daily |
| Lockout anomalies (login_failed/24 h) | inside daily | daily |
| Freeze drift | inside daily (gate A1) | daily — **any drift is a SEV-1 candidate** (unauthorised change) |

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | Rig live: first daily run recorded (CLEAN verdict baseline); roster template issued for staffing |
