# Records Retention & Deletion Policy

**Doc ID:** C3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** SEC · Feeds: DPIA C1, portal maintenance loop

## 1. Retention schedule

| Data class | Retain | Then | Rationale |
|---|---|---|---|
| KYC submissions (approved) | 6 years after relationship end | hard delete (docs shredded from object storage; audit keeps metadata only) | AML/trade obligation |
| KYC submissions (rejected/withdrawn) | 1 year | delete | dispute window |
| KYC documents (object storage) | same as parent submission | delete file + index row | follows parent |
| Drafts (unsubmitted KYC) | 12 months idle | auto-purge (already in maintenance loop) | shipped behavior |
| e-Invoices (delivered) | 7 years (FTA tax records horizon) | archive tier → delete | tax law |
| e-Invoices (rejected, superseded) | 2 years | delete | audit window |
| Sessions / MFA challenges | expiry (20 min idle / 5 min) | auto | shipped |
| RFQ records | 3 years | anonymize email → keep stats 1y → delete | commercial |
| Audit log | 7 years | archive | compliance spine |
| Outbox (emails) | 90 days | delete body, keep metadata 1y | deliverability disputes |
| Newsletter list | until unsubscribe | immediate delete on opt-out | consent-based |
| Analytics events | 14 months raw / aggregates indefinite | roll-up | H3 |
| Backups | 35 days rolling + 1 monthly × 12 | cycle out | E4 — restores honor this schedule |

## 2. Deletion mechanics

- Soft-delete flags only where audit requires continuity; hard deletion for documents + personal fields per schedule.
- Monthly job (extends portal's 15-min maintenance loop pattern) reports deletions to audit_log.
- Data-subject erasure request → evaluate legal-hold columns above → execute or document refusal reason (C1 §4).

## 4. Audit v2.0 additions

1. **Delivered-invoice immutability (discrepancy fix):** the shipped system allows `reopen` from `delivered` — acceptable pre-accounting-close only. Production control: reopen-after-delivery requires **super-admin**, writes a versioned audit entry (original UBL retained immutable), and is **blocked once the VAT filing period containing the invoice has closed**; post-close corrections = Phase-1.1 credit notes (typeCode 381). B4 carries `ubl` as append-only JSONB history.
2. **Missing classes added:** web/app request logs 90-day hot → 1-year cold (PII-free at emit, B6); CDN edge logs 30 days; rate-limit/security events 1 year; newsletter confirmations follow list lifecycle; password-reset tokens consumed/expired ≤ 60 min (never retained).
3. **Data-subject request SLA:** access/rectification/erasure/portability answered ≤ **30 days** (PDPL rights support, C1 §4); extension with notice if legal-hold evaluation needed.
4. **Restore-honoring rule made explicit:** any E4 restore re-applies this schedule to resurrected records (no retention reset).

## 5. Legal hold

On regulator/litigation notice: retention freeze on named classes; PM + SEC sign; hold logged.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — aligns shipped auto-purges with production schedule |
| 2026-10-05 | **v2.0 audit:** delivered-invoice immutability control (reopen restrictions), +log/CDN/token classes, 30-day DSR SLA, restore-honoring rule |
