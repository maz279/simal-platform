# Operations Runbook

**Doc ID:** F1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS

## Daily (automated, review by exception)
Backups green · outbox draining · error dashboard clean · rate-limit/lockout anomalies none.

## Weekly
- KYC queue SLA: nothing `under_review` > 2 business days unactioned (report to PM).
- e-Invoice queue: nothing `submitted` > 1 business day unvalidated.
- E4 metrics + one spot restore-file check · dependency/SBOM audit triage · E5 alert review.

## Common tasks

| Symptom | Diagnosis | Action |
|---|---|---|
| Login 429 wave | lockout storm (see audit actor) | inspect audit_log; if attack, block at edge; notify SEC |
| Invoice validate 422 (totals) | tamper or stale client | invoice auto-corrected server-side; partner resubmits (designed) |
| Validation fails `buyer_kyc_approved` | buyer TRN not approved | partner checks KYC status; staff can approve KYC then re-validate |
| Outbox queued > 1 h | SMTP/provider down | provider status; entries persist, auto-retry; escalate SEV-3 |
| ASP delivery stuck `validated` > 4 h | ASP outage (INT-5) | alert SEV-2; manual fallback per C2 §2.5 |
| Slow catalog pages | CDN miss/origin load | check cache-hit ratio; warm purge; D4 budgets |
| Session stuck users | idle window | sessions expire server-side; force-logout via admin (UAT 18) |

## Incident escalation

SEV definitions in D1 §4. SEV-1: page PM+TL+OPS now; comms lead assigned; status page note within 30 min; post-mortem (F3) within 5 days. PDPL-relevant breach path: C1 §6.

## Maintenance windows

Monthly patch Tuesday 22:00 GST via E2 pipeline; DB migrations expand/contract only; announce T-24 h.

## Audit v2.0 additions

1. **Hypercare daily checklist (4 Dec → exit):** morning: overnight alerts + error review · KYC/invoice queue SLA check · token-exchange success rate (INT-6) · ASP transmission lag · partner feedback triage · 15-min standup notes to PM. **Exit is criteria-based, not calendar** ([practice](https://www.docsie.io)): ≥ 14 consecutive days with no SEV-1/2, all KPIs in F2 range, Peppol live-exchange milestone met (by 24 Dec); hard outer boundary 1 Jan 2027 (mandate) — exit signed by PM+OPS.
2. **On-call mechanics:** weekly rota published Fridays; handover note mandatory; follow-the-sun not available — compensating dual-pager for SEV-1.
3. **Quarterly task block:** DR drill (E4) · credential rotation (B6 §4) · access review (E3) · restore spot-check · runbook page-verify (each section exercised or annotated stale).
4. **Ticket mining:** support-desk themes reviewed monthly → recurring issues become backlog items or F1 task additions ([desk-driven improvement](https://manageditservices.folio3)).
5. **Living-doc rule:** any incident that used a missing/wrong runbook step must add that step in the same week (F3 linkage).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — tasks derived from shipped behaviors |
| 2026-10-05 | **v2.0 audit:** +hypercare daily checklist with criteria-based exit, +on-call mechanics, +quarterly task block, +ticket mining, +living-doc rule |
