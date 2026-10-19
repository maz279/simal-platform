# Phase-1.1 Evolutionary Backlog Manifest

**Doc ID:** G1-P11 · **Task:** T8.5 · **Owner:** TL · **Release window:** Q1 2027 (post-mandate) · **Inputs:** Portal PRD A6 §8, Corporate PRD, FRS gap register (`Codebase/RTM.md` §4)

## 1. Groomed and sized backlog

Story points are the TL's estimates against the proven Phase-1 codebase (velocity reference: Phase 1–8 delivered 35 tasks with the portal/site/service layers in place; estimates assume those foundations).

| # | Feature | Scope summary | Architecture alignment | Points | Priority |
|---|---|---|---|---|---|
| P11-1 | **Credit Notes (type 381) + Debit Notes (383)** | Negative/adjustment invoices referencing an original invoice; lifecycle mirrors invoices with `refunds` linking | Extend `einvoice.service.js` state machine (draft→submitted→validated→delivered) with `credit_note` kind; UBL type code parameterised (already a field); fils math unchanged; new PG table `credit_notes` referencing `invoices.id` | 13 | **P0** — FTA Phase-2 expectation |
| P11-2 | **Inbound e-Invoicing** | Automated reception of supplier invoices via ASP inbox into `received_invoices` | New PG table + ASP webhook ingestion (queue-based, HMAC-verified — same pattern as outbound); duplicate suppression by Peppol message ID; UBL parse → fils normalisation | 13 | P1 |
| P11-3 | **RFQ → Invoice conversion** | One-click quotation from an approved RFQ basket to a draft invoice | RFQ engine (GAP-R1, Phase 7) must land first; mapping layer RFQ items → invoice lines (qty/unitPriceFils reuse); audit-linked | 8 | P1 |
| P11-4 | **Full Arabic portal (`/ar/portal`)** | RTL EN/AR parity for partner + staff consoles | AR strings already in CMS schema (GAP-LN1); directionality per-route; validators locale-aware error messages | 13 | P2 |
| P11-5 | **UniERP bidirectional sync** | Live stock availability + pricing feed into catalog; order push-out | Integration service queue pattern (INT-*); reconcile against `products` table; nightly full + event-driven delta | 20 | P2 |

**Total: 67 points.** Q1-2027 release train: P11-1 + P11-2 in the first increment (mandate-adjacent), P11-3 + P11-4 second, P11-5 third.

## 2. Dependencies and sequencing

- P11-3 depends on the RFQ engine (gap register GAP-R1 — Phase 7 carry-forward, first item of the next build phase).
- P11-5 depends on Unisoft ERP API contract (BRule register) — TL + Unisoft ERP Lead to freeze the interface in the first Q1 sprint.
- P11-1/P11-2 are independent and start immediately after hypercare exit.

## 3. Carry-forward gaps folded in (from RTM §4)

GAP-R1 (RFQ API) and GAP-LN1 (AR/RTL) are Phase-1.1 scope by this manifest; GAP-A1 (self-registration email loop), GAP-RP1 (KPI date filters), GAP-J1 (careers intake) remain Phase-1.0 completion items for the next maintenance window — sized 5, 3, 3 points respectively, tracked on the taskboard.

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | Manifest groomed + sized (T8.5); sequencing fixed; dependencies named |
