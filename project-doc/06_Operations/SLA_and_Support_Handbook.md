# SLA & Support Handbook

**Doc ID:** F2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM · Aligns with the public AMC tiers (content §05-02)

## Support tiers (platform — distinct from AMC hardware contracts)

| Severity | Example | First response | Update cadence | Resolution target |
|---|---|---|---|---|
| SEV-1 | portal down / invoice delivery broken / data incident | 1 h (24×7) | hourly | 8 h |
| SEV-2 | KYC review blocked, search down | 4 h (business) | 4 h | 3 business days |
| SEV-3 | cosmetic, single-user workaround exists | 1 business day | weekly | next release |
| SEV-4 | requests/enhancements | 2 business days | backlog | roadmap |

## Channels & hours

Partners: portal Help&FAQ → support email → phone (business Sun–Thu per contact page hours; the hours discrepancy flagged in PRD G14 must be resolved before publishing SLA). Staff: internal channel. SEV-1 hotline 24×7.

## Escalation path

L1 support (Simal desk) → L2 engineering (Unisoft per MSA) → L3 TL/vendor. Named on-call rotation maintained in E5 routing.

## Service targets (monthly report)

Availability ≥ 99.5% (portal) / ≥ 99.9% (static site via CDN) · RFQ response ≤ 1 business day (public promise) · KYC decision ≤ 2 business days · invoice validation ≤ 1 business day. Credits/penalties: per hosting MSA (G5) and Unisoft MSA.

## Audit v2.0 additions

1. **Intake channels defined (were implicit):** partners — portal Help&FAQ form + support email (+ phone SEV-1 hotline 24×7); staff — internal channel; every contact becomes a tracked ticket (no side-channel fixes).
2. **Monthly service report contents (fixed list):** availability vs targets · first-response/resolution stats by severity · SLA breaches with cause · top-5 recurring ticket themes (F1 mining) · KPI trends (KYC ≤2 d, invoice ≤1 d, RFQ ≤1 d) · CWV field summary (D4) — issued by day 5, owned by PM.
3. **Holiday coverage:** UAE public holidays staffed at SEV-1-only response; published calendar in the rota (F1); business-hour channels auto-reply with emergency path.
4. **Escalation matrix skeleton (names filled at go-live):** L1 desk → L2 engineering (Unisoft) → L3 TL → PM/business — each row: name, deputy, contact window.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — mirrors public promises already made on site |
| 2026-10-05 | **v2.0 audit:** +intake channels (all→tickets), +monthly report fixed contents + owner, +holiday coverage rule, +escalation matrix skeleton |
