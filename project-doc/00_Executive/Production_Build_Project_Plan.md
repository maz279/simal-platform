# Production Build Project Plan

**Doc ID:** G1 · **Version:** 2.0 (audited & enhanced) · **Date:** 5 Oct 2026 · **Owner:** PM · **Status:** Approved baseline
**Source plan:** `../Production_Build_Documentation_Plan.md` (index of record)
**Audit basis:** research-backed go-live practice — visible buffer between internal go-live and hard regulatory deadline; phase gates SIT→UAT→rehearsal→freeze→cutover→hypercare; formal go/no-go.

## 1. Objective

Convert two working assets — the Simal corporate website prototype (36 pages, 7 hash-driven detail tiers, self-test 54/54) and the KYC + e-invoicing portal (Node backend, 39/39 unit, 16/16 e2e) — into **one deployed, production-grade platform** with **100% feature parity to the prototype** (see §4 parity gate), inside the BRD v1.4 budget envelope (Phase 1 ≈ US$80–185k, mid ~$130k).

## 2. Hard external constraint (drives the whole schedule)

**UAE FTA e-invoicing Phase 1 mandate: 1 January 2027.** The platform must be live and exchanging structured invoices **before** that date. Working backward with a **visible 4-week compliance buffer** (best practice 10–20%):

- **Internal go-live target: Friday 4 December 2026** (T-GOL)
- Compliance buffer: 5 Dec 2026 → 1 Jan 2027 (any slip consumes buffer, never the mandate)
- Code freeze: **27 November 2026** (T-GOL−7d; only SEV-1 fixes after)
- Go/no-go review: **2 December 2026**
- Hypercare: 4 Dec 2026 → 1 Jan 2027 (staffed support, daily standup)

## 3. Date-anchored phase schedule (8 weeks build + verify — compressed but feasible because backend already exists)

| Phase | Calendar window (2026) | Exit criteria (gate) | Owner | Docs |
|---|---|---|---|---|
| P0 Decide | 6–9 Oct (wk 1) | ADRs, TAD, DB schema, API contract signed; **vendor RFP issued same day** (critical path) | TL | B3, B1, B4, B5 |
| P1 Bridge | 9–16 Oct (wk 2) | Conversion Plan accepted; data dictionary frozen; security arch approved; **DPIA signed; ASP shortlist + sandbox started** | TL+SEC | B2 ★, A7, B6, C1 |
| P2 Compliance & procurement | 12–23 Oct (wk 3–4) | DPAs signed (C5); hosting contracted; ASP sandbox round-trip PASS | PM+SEC | C1–C5, G5 |
| P3 Build | 16 Oct – 13 Nov (wk 3–7) | Site + portal on production stack in staging; **parity checklist §4 ≥ 95% green**; traceability ≥ 90% | TL | B2, D1, D3, E1–E3 |
| P4 Verify | 13–24 Nov (wk 7–8) | SIT exit → UAT pass (SUS ≥ 80); perf + security tests; **cutover rehearsal #1** | QA | D2, D4, D5 |
| P5 Freeze & launch | 27 Nov – 4 Dec | Freeze 27 Nov; rehearsal #2 (30 Nov); go/no-go 2 Dec; **GO-LIVE 4 Dec** | PM+OPS | E4–E7 |
| P6 Hypercare & mandate | 4 Dec – 1 Jan | Daily standup; zero SEV-1; **Peppol live exchange verified with ≥ 2 counterparties before 24 Dec**; steady-state handover | OPS | F1, F2 |
| P7 Stabilize | Jan 2027 | SLA handbook live; analytics KPIs flowing; post-launch review | OPS/CM | F3, F4, H3 |

**Critical path (zero float):** vendor/ASP contracting (P2) → staging parity (P3) → UAT (P4) → freeze → go-live. Any P2 slip > 3 days triggers the compressed-launch option (§6).

## 4. 100% porting parity gate (the "no deviation" enforcement)

Definition of done for the conversion, checked as a living checklist in staging (artifact: `parity_checklist.md` under 04_Quality):

1. **Every prototype page** (36 + hash-tier multipliers = 200+ routes) renders on production routes per B2 §2 — checklist item each.
2. **Every prototype self-test assertion (54)** has a corresponding automated production test (D3 module roll-up must show FRS coverage incl. site modules).
3. **Every interactive behavior** verified: hero carousel (rotation/ticks/swipe/pause), RFQ basket→reference, 7-step KYC resume, invoice create/live-totals/submit/validate/deliver/UBL, category filters, TOC anchors, prev/next chains.
4. **Every localStorage feature** mapped to persistence per B2 §3 — none silently dropped (accepted exceptions listed with PM sign-off: recent-products may stay client-side).
5. **Cross-link graph parity:** production internal links ≥ the prototype's validated 1,801-link graph; zero dead ends.
6. **Content parity:** 81 SKUs + deep pages, 23 brands, 12+7+12+36+20+9 software tiers, 12 IT-solution lines, 14 articles — counts must match seed.

Gate: go/no-go (2 Dec) blocks launch if parity < 100% on items 1–4 or any SEV-1/2 open.

## 5. Team & effort

PM (Simal) · TL (Unisoft lead + Simal architect) · 2 engineers (Unisoft) · QA (shared) · SEC/compliance consultant (UAE) · OPS (vendor + Simal IT) · CM (Simal marketing). Effort split per B2 §6. Assumption: portal engine reused as-is (already verified) — the compressed 8-week window depends on it; if P0 invalidates any ADR affecting the engine, escalate to change board same day.

## 6. Contingency options (pre-agreed)

- **Compressed launch:** corporate site + portal live 4 Dec; Peppol delivery via manual ASP submission for top-20 counterparties until P6 completes automation (C2 fallback).
- **Mandate-floor launch:** if parity items 1–5 slip, ship portal + e-invoicing first (compliance-critical), site follows within 2 weeks — decision owner PM+SEC, latest 25 Nov.

## 7. Budget linkage

BRD v1.4 CBA caps; vendor awards (G5) inside envelope; variance > 10% → change board (G3/G4).

## 8. Status log

| Date | Event |
|---|---|
| 2026-10-05 | v1.0 baseline |
| 2026-10-05 | **v2.0 audit:** date-anchored backward from 1 Jan 2027 mandate; visible 4-week buffer; freeze/go-no-go/hypercare added; §4 parity gate added as the 100%-porting enforcement; §6 contingencies added. Fixes: prior version's week-count schedule landed at/after the mandate with zero buffer (critical discrepancy) |
