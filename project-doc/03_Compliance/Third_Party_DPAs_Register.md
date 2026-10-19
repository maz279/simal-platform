# Third-Party Processors & DPAs Register

**Doc ID:** C5 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** SEC · PDPL Art. processing-by-processor support

| # | Processor | Purpose | Data touched | DPA status | Region |
|---|---|---|---|---|---|
| 1 | Hosting vendor (G5 RFP) | compute/DB/object storage | all platform data | to sign at P2 | UAE (required) |
| 2 | CDN | static delivery | no PII (logs only) | standard terms | global edge |
| 3 | Email provider | notifications, temp passwords | recipient email + message | to sign at P2 | TBD — prefer UAE/EU |
| 4 | Peppol ASP (C2) | invoice exchange | invoice UBL (corporate + contact) | accreditation contract | UAE |
| 5 | Analytics provider (H3) | usage events | pseudonymous | to sign; consent-gated | TBD |
| 6 | Unisoft Systems (Dhaka) | software engineering | access to code, staging data only | engineering services MSA + confidentiality | BD |
| 7 | Pen-test vendor (G5 Lot E) | security testing | staging environment + findings | statement-of-work + confidentiality | — |
| 8 | DNS/domain registrar | domain management | no PII (WHOIS admin contact **P**) | registrar terms; privacy-proxy on WHOIS | — |

## Rules

1. No processor goes live before its DPA/contract clauses (purpose limitation, security, sub-processor list, breach-notify within 24h, deletion on termination) are signed and logged here.
2. Cross-border transfers (rows 3, 5, 6) require C1 §2 assessment + appropriate safeguards; if unavailable, re-select UAE-region alternative.
3. Sub-processor changes by any vendor → 30-day objection window, PM notified.
4. Register reviewed at each phase gate; audit_log records changes.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — 6 processor rows opened; none signed yet (P2 milestone) |
| 2026-10-05 | **v2.0 audit:** +pen-test vendor + DNS registrar rows (WHOIS contact flagged P); DPA clause checklist consolidated: purpose limitation, security, sub-processor list, 24-h breach notice, deletion on exit, audit rights; processor changes logged to audit_log; quarterly register review aligned to DPIA cadence |
