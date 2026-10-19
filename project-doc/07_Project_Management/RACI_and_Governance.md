# RACI & Governance

**Doc ID:** G3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM · Parties: Simal (SIM), Unisoft (UNI), vendor/ASP (VEN), compliance consultant (CMP)

R=Responsible A=Accountable C=Consulted I=Informed

| Decision / area | SIM PM | SIM TL | UNI eng | CMP | VEN |
|---|---|---|---|---|---|
| Scope changes (G4) | A | C | I | I | — |
| Architecture & ADRs | C | A | R | — | C |
| Budget / procurement (G5) | A | C | — | — | R |
| DPIA & PDPL sign-off | A | C | I | R | I |
| Peppol/ASP onboarding (C2) | A | R | R | C | R |
| Data schema & money rules (B4/ADR-5) | I | A | R | — | — |
| Release approval (E2 L7) | A | R | I | I | — |
| Go/no-go launch (E6) | A | R | I | C | I |
| Incident command SEV-1 | A | R | R | I | C |
| Content publishing (F4) | A(Rules) | — | — | C | — |
| KYC decisions (reviewers) | — | — | — | — | — |

## Meetings

Weekly build review (P3+) · phase-gate reviews per G1 · monthly risk register (G2) · quarterly DR drill (E4).

## Decision rights

Any single spend > 10% BRD envelope, or scope touching FRS 🔴 modules → change board (PM+TL+business owner). ADR changes follow B3 amendment log. Veto: SEC on compliance items; TL on security-architecture items.

## Audit v2.0 additions

1. **Decision SLAs (compressed 8-week window demands speed):** ADR/architecture decisions ≤ 3 business days · change board ≤ 5 · procurement award ≤ 5 · content/compliance sign-offs ≤ 2 — breaches surface at the weekly review.
2. **Go/no-go authority row (aligns E6 v2.0):** PM decides within 10 min of any abort criterion; **SEC and TL hold veto**; no committee at launch hour.
3. **Change-board quorum:** PM + TL + one business owner; SEC mandatory for compliance-class items; decisions minuted same day (G4).
4. **Meeting calendar anchored:** weekly build review Thursdays from 16 Oct; risk review twice-weekly (top risks) until 4 Dec; phase-gate reviews per G1 v2.0 dates.
5. **Cumulative vendor scoring:** score refreshed after each interaction (RFP response → presentation → references), not once ([scoring practice](https://www.viewpointanalysis.com)); select on production capability, not demo polish ([common trap](https://www.letsaskclaire.com)).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 |
| 2026-10-05 | **v2.0 audit:** +decision SLAs, +go/no-go authority row (matches E6), +CAB quorum, +anchored meeting calendar, +cumulative vendor scoring rule |
