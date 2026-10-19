# Risk Register — Production Build

**Doc ID:** G2 · **Version:** 2.0 (audited & enhanced) · **Date:** 5 Oct 2026 · **Owner:** PM · **Review:** weekly (Thu); risks ≥ 12 reviewed twice-weekly
Extends BRD v1.4 §risks. Scale: P(probability) × I(impact) 1–5. **Residual** = score after mitigation (target ≤ 6). Trend vs last review: ↑ ↓ →

| # | Risk | P | I | Score | Residual | Owner | Mitigation | Trigger to escalate |
|---|---|---|---|---|---|---|---|---|
| R1 | Peppol ASP accreditation/contract not ready before internal go-live (4 Dec) | 3 | 5 | 15 | 8 | PM | ASP shortlist + sandbox start in P1 (not P2 — pulled forward in v2.0 plan); fallback = manual ASP submission for top-20 counterparties (plan §6) | Sandbox round-trip not PASS by 30 Oct |
| R2 | Prototype behaviors regress in conversion (localStorage→DB, routes) | 4 | 4 | 16 | 6 | TL | **Parity gate G1 §4** (6-part checklist, 100% on items 1–4); D3 traceability | Parity < 95% at P3 exit (13 Nov) |
| R3 | Scope creep from marketing during compressed build | 4 | 3 | 12 | 6 | PM | Change control G4; freeze 27 Nov enforced | > 2 accepted change requests/week |
| R4 | PDPL finding blocks production data | 2 | 5 | 10 | 4 | SEC | DPIA signed in P1 (pulled forward); retention C3 automated | Any high-risk DPIA item open at P2 start |
| R5 | Hosting/vendor procurement delay (critical path) | 3 | 4 | 12 | 6 | PM | RFP issued P0 day-1; two-vendor shortlist; UAE-region requirement relaxed to edge-CDN-only if needed (DB stays UAE per C1) | No signed vendor by 23 Oct |
| R6 | e-invoice money-math regression (floats reintroduced) | 2 | 5 | 10 | 3 | TL | BIGINT fils DDL + CI edge-ledger (D3 §edge cases); any float currency column fails review | Any float currency PR |
| R7 | KYC tenant migration breaks live kyc.simalme.com users | 2 | 4 | 8 | 4 | TL | E7 token-mapped links; 2-week parallel-run; rehearsal #1 in P4 | Rehearsal failure |
| R8 | Arabic/RTL parity gaps at UAT | 3 | 3 | 9 | 6 | QA+CM | D2 script 25 (RTL); F4 bilingual rules; deferred-AR weekly gap report | SUS split EN vs AR > 10 |
| R9 | Key-person dependency (single TL) | 3 | 3 | 9 | 6 | PM | This doc set captures decisions; pair review in P3 | Any 2-week TL absence |
| R10 | Content not final at launch | 2 | 4 | 8 | 4 | CM | Content package complete; only deltas via F4; flagged claims stay unpublished (PRD gate) | > 20 placeholder pages at P4 |
| **R11** | **Schedule: internal go-live slips past 4 Dec and consumes compliance buffer toward the 1 Jan 2027 mandate** (new — the v1.0 plan itself landed at/after the mandate) | 3 | 5 | 15 | 6 | PM | Date-anchored plan v2.0; visible 4-week buffer; freeze + go/no-go; pre-agreed compressed-launch & mandate-floor options (plan §6); weekly buffer-burn report | Buffer < 2 weeks remaining at any review |
| **R12** | Compressed 8-week window overloads the 2-engineer team | 3 | 4 | 12 | 6 | PM | Scope floor = parity items 1–4 only; site-tier polish (nice-to-haves) pre-declared droppable; Unisoft surge capacity clause in MSA | Burn-rate flag or > 10% task slip in any week |
| **R13** | Legacy dependencies at cutover (mirror DNS, third-party scripts on old pages) break redirects/SEO | 2 | 3 | 6 | 3 | CM+OPS | H2 redirect map + 410 rules; E7 TTL plan; top-20 page ranking watch 60 days | Any money-page ranking drop > 20% week-1 |
| **R14** | UAT business users unavailable in the Nov window (holiday season) | 3 | 3 | 9 | 6 | PM | Book UAT users at P0; remote-friendly scripts; backup reviewers named | < 3 personas confirmed by 6 Nov |

## Top risks entering the build
R11 (schedule vs mandate) · R2 (parity) · R1 (ASP) · R12 (team load) — reviewed twice-weekly until go-live.

## Escalation & reporting
Score ≥ 12 → PM + TL same day; score ≥ 12 with buffer burn → change board. Weekly register snapshot attached to build review (G3 meetings).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 baseline (10 risks) |
| 2026-10-05 | **v2.0 audit:** +R11 schedule/mandate (root-cause of v1.0 plan flaw), +R12 team load on compressed window, +R13 cutover/SEO, +R14 UAT availability; residual-risk column and twice-weekly cadence for top risks added; R1/R4 mitigations pulled forward per plan v2.0; R5 impact raised (critical path) |
