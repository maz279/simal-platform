# Accessibility Conformance Report — WCAG 2.1 AA

**Doc ID:** C4 · **Version:** 1.0 (plan; report completes at P4) · **Date:** 5 Oct 2026 · **Owner:** QA
Target fixed by URD v1.3 ACC-1…ACC-5. This file becomes the VPAT-style evidence at UAT exit.

## 1. Design-phase conformance (already verified)

- **Contrast:** brand palette ratios computed in URD ACC-3; rule on record: **#F0F000 never used as text on white** (1.22:1 — rejected); body ink on canvas ≥ 4.5:1 maintained in styles.
- **Keyboard:** prototype interactions keyboard-operable (menus Tab/Enter/Esc per v1.0.9 state machine; forms labeled). Portal skip-link present; focus visible.
- **RTL parity:** ar.html demonstrates mirrored layout; numerals Western per UAE convention (URD rule).

## 2. Audit plan (P4, before UAT sign-off)

| Checkpoint | Method | Pass criterion |
|---|---|---|
| Automated scan (axe-core) | CI job on every page/route | 0 critical/serious |
| Keyboard-only walkthrough | D2 script per persona | All tasks completable |
| Screen-reader pass (NVDA + VoiceOver) | KYC wizard, RFQ, invoice create | Labels/announcements correct |
| Contrast spot-check | tool on final palette tokens | ≥ 4.5:1 text (3:1 large/UI) |
| Zoom/reflow | 200% zoom, 320px width | No loss, no 2-D scroll |
| Forms error identification | field-level messages (already shipped pattern) | Programmatic + visible |

## 3. Known constraints to verify in production rebuild

- SSG pages must keep semantic landmarks (header/main/footer) as in prototype.
- Data tables (invoice lines, SLA tiers) need proper `<th>` scope — pattern already used in portal consoles.
- Hero carousel: pause control exists (hover-pause); add explicit pause button for 2.2.2 (production backlog item).
- File-upload messaging (KYC) must not rely on color alone — error text pattern already shipped.

## 5. Audit v2.0 additions

- **Reduced motion (WCAG 2.3.3 / 4.1 respect):** hero Ken Burns + entrances must honor `prefers-reduced-motion` (now scoped in B2 §8 island contract — cross-ref added; D2 adds a check).
- **WCAG 2.2 criteria adopted:** 3.3.8 accessible authentication — login uses no cognitive-function test ✓ (password + optional TOTP only; keep any future CAPTCHA out); 2.4.11 focus-not-obscured — verify sticky header never covers focused inputs.
- **Palette token rules (production build constraint):** navy `#0050A0`-family for text-links/CTAs on white ✓; **yellow `#F0F000` never as text** (1.22:1 — decoration/borders only); gold CTAs carry ≥ 4.5:1 ink; hero overlays keep white text ≥ 4.5:1 on darkest gradient stops (verified shades only).
- **Testing cadence:** axe-core in CI per release + manual suite (§2) at P4 and each subsequent release (not one-off); issues route to C4 §5 exceptions log with remediation SLAs.
- **Contrast regression rule:** design-token changes require ratio re-check in the same PR (ties to G4).

## 6. Statement template (final)

"Simal Technologies ME LLC supports WCAG 2.1 Level AA for the corporate site and partner/staff portals, with the exceptions logged in §5, remediated per SLA."

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 plan + design-phase evidence carried from URD |
| 2026-10-05 | **v2.0 audit:** +reduced-motion requirement, +WCAG 2.2 criteria (3.3.8 ✓, 2.4.11), +palette token contrast rules, +per-release cadence, +contrast regression rule |
