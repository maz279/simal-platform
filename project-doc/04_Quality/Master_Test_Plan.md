# Master Test Plan

**Doc ID:** D1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** QA

## 1. Existing baseline (carried forward, no regression allowed)

| Suite | Where | Status |
|---|---|---|
| Prototype self-test | `Prototype/test.html` | 54/54 |
| Portal unit (validators, security-rules store v3, SSRF) | `portal/test/unit` | 39/39 |
| Portal e2e journey (KYC→invoice→UBL) | `portal/test/e2e-einvoice.mjs` | 16/16 first-run |
| Audit iterations 1–3 script | `portal/test/audit-iterations-1-3.mjs` | pass |

## 2. Levels & environments

| Level | Env | Gates |
|---|---|---|
| Unit + integration (CI) | containers | every commit; 100% pass |
| Contract (OpenAPI) | CI | spec drift = fail |
| E2E (site + portal) | staging | every merge to main |
| UAT (D2 scripts) | staging, production data shape | P4 exit |
| Performance (D4) | staging w/ prod-like volume | P4 exit |
| Security (D5) | staging | P4 exit |

## 3. Entry / exit criteria

- **Build entry:** green CI + migration scripts reversible.
- **P4 exit (release candidate):** D3 traceability ≥ 90% green (100% of 🔴 FRS modules), 0 open SEV-1/2, UAT SUS ≥ 80, perf targets met, security findings ≤ medium with dates.
- **GoLive (E6):** all prior + E4 restore drill passed once.

## 4. Defect severity model

SEV-1 blocker (money/compliance wrong, data loss) fix < 24h · SEV-2 major feature broken < 72h · SEV-3 minor, next release · SEV-4 cosmetic.

## 5. Test data

Seed from prototype data + portal db (scrubbed); synthetic partners for UAT; **no real personal data below staging** (C1 rule).

## 6. Audit v2.0 additions

1. **Cross-browser/device matrix (was missing):** Chrome, Edge, Firefox, Safari (last 2 majors) + Android Chrome / iOS Safari — priority by expected traffic ([cross-browser practice](https://www.devassure.io), [breakpoints 2026](https://diffy.website)): desktop 1440/1920, tablet 820, mobile 390; RTL pages tested in all four engines.
2. **Visual regression (was missing — critical for 100%-porting parity):** baseline screenshots per route (hero slides ×5 states, PDP tabs, consoles) diffed in CI on layout-affecting PRs ([visual testing rationale](https://www.virtuosoqa.com)); threshold 0.1% pixel diff, hero/carousel exempted-from-animation noise via frozen-frame mode.
3. **Accessibility in CI:** axe-core run is a pipeline layer (not only P4) per C4 v2.0; new a11y checks join the release gate.
4. **Defect workflow:** tracker = project issue board; fields: severity (D1 §4), parity-item link (G1 §4), environment, regression flag; automation files failures as SEV per D1 mapping.
5. **Staging data refresh:** nightly reseed from scrubbed snapshot; UAT window freezes reseed (stable data), unfrozen after sign-off.
6. **Release-criteria anchor:** all gates in §3 now date-bound to the 4 Dec 2026 go-live (freeze 27 Nov; rehearsal #2 30 Nov).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — baseline suites adopted as-is |
| 2026-10-05 | **v2.0 audit:** +browser matrix, +visual regression in CI, +axe in pipeline, +defect workflow, +staging refresh policy, gates date-anchored |
