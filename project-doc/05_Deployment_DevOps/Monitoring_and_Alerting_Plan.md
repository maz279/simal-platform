# Monitoring & Alerting Plan

**Doc ID:** E5 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS · Builds on shipped structured logs + request-id

## 1. Signals

| Signal | Source | Threshold → severity |
|---|---|---|
| HTTP availability | external prober (`/api/health`, login, home) | 2 fails/5 min → SEV-2 |
| Error rate | app logs (5xx per minute) | > 1%/5 min → SEV-2; any 5xx spike on /api/einvoice → SEV-1 |
| Latency p95 | LB/app metrics | > D4 budgets 10 min → SEV-3 |
| Lockouts / auth anomalies | security events (B6) | spike 3× baseline → SEC review |
| Validation-tamper 422s | einvoice service | any repeat offender (>5/h) → SEC |
| Outbox queue depth | notify service | > 50 queued or age > 1 h → SEV-3 |
| ASP delivery failures | INT-5 | any > 4 h → SEV-2 (R1) |
| DB disk/connections | infra metrics | 80% → SEV-3 |
| Backup job result | E4 jobs | any failure → SEV-3; two → SEV-2 |
| Cert expiry | TLS monitor | < 21 days → SEV-3 |

## 2. Routing

Business hours: OPS slack + email. After hours: SEV-1 pages PM+OPS; on-call rotation per F2. Every alert links to the F1 runbook section.

## 3. Dashboards

Release-canary view (15-min post-deploy), KYC funnel (submitted→approved), e-invoice funnel (submitted→validated→delivered) matching H3 KPIs.

## 5. Audit v2.0 additions

- **Synthetic transactions (were missing):** external 15-min probes — home LCP, search query, partner login, RFQ submit (test account), invoice queue load — from UAE + EU vantage points; two consecutive failures → SEV per table.
- **Alert acknowledgment SLAs:** SEV-1 ack ≤ 5 min, SEV-2 ≤ 30 min (on-call rotation per F2); unacked auto-escalates to PM after 10 min.
- **Status page decision:** private status dashboard for staff Phase 1; public status page only after hypercare if support volume justifies (F2 review).
- **Dashboard ownership:** each E5 dashboard has a named owner; panels without owners are removed at quarterly review.

## 6. Log policy

Structured JSON with request-id retained; PII-free (names/emails scrubbed at emit); 90-day hot, 1-year cold.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — thresholds fixed; tooling choice at P3 (ADR-10) |
| 2026-10-05 | **v2.0 audit:** +synthetic transactions (UAE+EU probes), +ack SLAs + auto-escalation, +status-page decision, +dashboard ownership rule |
