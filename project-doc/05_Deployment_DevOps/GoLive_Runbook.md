# GoLive Runbook

**Doc ID:** E6 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM+OPS · Entry: all E-docs green + D1 P4 exit

## T-7 days
- [ ] Freeze code (only fixes) · tag RC · E2 pipeline green twice
- [ ] E4 restore drill passed on RC database
- [ ] C5 processors signed; C1 DPIA signed; C2 ASP production creds tested with one round-trip invoice
- [ ] Comms: partner email announcing portal migration (INT-6), support inbox staffed

## T-1 day
- [ ] Lower DNS TTL to 300 s · full backup point marked · E5 canary dashboards open
- [ ] UAT smoke re-run (D2 core 10 scripts) on staging RC

## Day 0 (launch window 22:00–02:00 GST)
| Time | Step | Abort criterion |
|---|---|---|
| 22:00 | Go/no-go call (PM, TL, OPS, SEC) | any open SEV-1/2 → abort |
| 22:30 | Production deploy via pipeline; smoke green | smoke fail → rollback artifact |
| 23:00 | DB migration final step verified (counts vs staging) | mismatch → rollback + investigate |
| 23:30 | E7 cutover: 301s live (mirror→new), kyc.simalme.com token-mapped redirects | redirect errors > 1% → hold DNS |
| 00:00 | Partner comms send; support channel live | — |
| 00:30 | Canary hour: error rate, login success, first RFQ/invoice watched live | thresholds per E5 → pause traffic, page TL |
| 02:00 | Declare live; TTL restored 24 h | — |

## T+72 h
- [ ] Zero SEV-1; SEV-2 log reviewed; SUS intercept survey on first portal users
- [ ] Post-live review meeting → actions to G2/F1

## Rollback plan (any abort)
1. Traffic to previous artifact (E1 §4) — sessions survive.
2. DNS revert if cutover stage (TTL already low).
3. Comms template "launch postponed" to partners; reschedule window within 7 days.

## Audit v2.0 — calendar dates & authorities (anchors the T-relative schedule)

- **Freeze: Fri 27 Nov 2026** · **Rehearsal #2: Mon 30 Nov** · **Go/no-go: Wed 2 Dec (decision authority: PM; veto: SEC/TL)** · **GO-LIVE: Fri 4 Dec** · **First live Peppol exchange with ≥2 counterparties: by Thu 24 Dec** (C2) · **Hypercare ends / mandate date: Fri 1 Jan 2027**.
- **72-hour staffed roster** (4–7 Dec): named on-call pairs per shift, PM reachable, comms owner assigned (rollback/partner notices pre-written).
- **Rollback decision authority:** PM within 10 minutes of any abort criterion — no committee at 2 a.m.; TL executes.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — hour-by-hour draft |
| 2026-10-05 | **v2.0 audit:** +calendar dates (freeze 27 Nov → mandate 1 Jan), +named authorities (PM rollback ≤10 min, SEC/TL veto), +72 h staffed roster, Peppol-live milestone 24 Dec |
