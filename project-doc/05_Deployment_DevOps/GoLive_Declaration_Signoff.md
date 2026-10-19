# Go-Live Declaration & Sign-Off

**Doc ID:** E6-DEC · **Task:** T7.5 · **Window:** Friday 4 Dec 2026, 22:00–02:00 GST · **Executor:** `Codebase/scripts/golive-execute.js` (audit log: `Codebase/infra/logs/golive-execution.log`)

> [!IMPORTANT]
> **GOVERNANCE STATUS: UNEXECUTED PLANNING TEMPLATE / PRE-CUTOVER DRILL ONLY (P9-3 / GOV-3)**
> This document is a pre-cutover operational planning template. It does NOT represent a past or executed production go-live event. The Simal Corporate digital platform has NOT executed production cutover as of October 2026. Production cutover will occur only following formal Independent Re-verification (Phase 10) and executive sign-off.
> Every field below is filled during actual cutover execution; nothing is pre-signed.

## 1. Window execution record (from the audit log)

| Time (GST) | Step | Evidence line (audit log) | Result |
|---|---|---|---|
| 22:00 | precheck — freeze + smoke re-run live | `[precheck] GATES GREEN` | ☐ |
| 22:15 | pre-cutover backup (`infra/logs/pre-cutover-backup.sql`) | `[backup] pre-cutover backup written … bytes` | ☐ |
| 22:30 | deploy + smoke on staged deployment | `[deploy-verify] SMOKE GREEN` | ☐ |
| 23:00 | DB counts vs source of truth | `[db-counts] ALL COUNTS MATCH` | ☐ |
| 23:30 | DNS cutover (TTL 300 s; A/CNAME switched; kyc.* mapped) | `[dns-confirm] DNS CUTOVER CONFIRMED` | ☐ |
| 00:00 | TLS verified; 301/token maps active | bridge note | ☐ |
| 00:30 | canary — error rate, logins, first RFQ/invoice | `[canary] CANARY CLEAN (< 0.05%)` | ☐ |
| 01:30 | sanity — test RFQ, email delivery, admin console | `[sanity] SANITY CONFIRMED` | ☐ |
| 02:00 | **DECLARED LIVE**; TTL restored 86,400 s; partner broadcast sent | `[declare-live] PLATFORM DECLARED LIVE` | ☐ |

## 2. Abort criteria encountered

None / (list any criterion hit + rollback decision + duration)

## 3. Declaration

The Simal digital platform (corporate site + KYC portal + e-invoicing) is **LIVE in production** as of _____ GST on 4 December 2026. All window steps completed per the audit log; canary and sanity thresholds met.

| Role | Name | Signature | Time |
|---|---|---|---|
| DevOps Lead (executed) | | | |
| Project Manager (declared) | | | |
| Tech Lead (verified) | | | |

## 4. Immediate post-live obligations

- Hypercare roster active (72 h; F1 v2.0) · Peppol live exchange with ≥ 2 counterparties by 24 Dec (C2) · mandate compliance date 1 Jan 2027.
- Post-live review at T+72 h → actions to G2/F1 (T8.3).

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | Template created; executor steps implemented and step-tested (`precheck` proven to block on drift and log the abort) |
