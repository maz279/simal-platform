# Assistive-Technology Walkthrough — rm(10.2-3)

**Date:** 2026-10-18 · **Criterion:** PRD NFR-6 / URD ACC (accessibility), not audit finding NFR-6
**Environment:** dev rig — public site `http://127.0.0.1:8100` (apps/site/dist, 234 pages), portal `http://127.0.0.1:8090`
**Tools:** Windows Narrator (built-in screen reader, process running during the session),
Chrome platform accessibility tree via CDP `Accessibility.getFullAXTree` (the exact data
Narrator/NVDA consume), real `Tab` key events via `Input.dispatchKeyEvent`.

**NVDA availability:** not installed on this machine. Narrator (EN and AR voices) was
used instead; Arabic coverage was verified through the same AX tree and the page
language/direction attributes, plus the Arabic skip-link label. Speech output cannot be
captured programmatically in this session, so the AX-tree checkpoints below are the
recorded evidence.

**Automation:** `scripts/ci/at-walkthrough.mjs` (re-runnable) — exit 0 = no blocking findings.
Evidence: `Codebase/scratch/rm-evidence/10.2-3-at-run3.log` (final PASS),
`10.2-3-at-session.log` (Narrator session record), runs 1–2 document the findings that
were fixed (see §4).

## 1. Pages audited (7)

| Page | lang/dir | main | H1 | interactive controls | unnamed | images (unnamed) | Tab stops |
|---|---|:---:|:---:|---:|---:|---:|---:|
| Public home `/` | en / ltr | 1 | 1 | 147 | 0 | 15 (0) | 8 |
| Catalogue `/products/` | en / ltr | 1 | 1 | 322 | 0 | 74 (0) | 8 |
| Product detail (ARKTEK RTX3060) | en / ltr | 1 | 1 | 122 | 0 | 10 (0) | 8 |
| RFQ basket `/rfq/` | en / ltr | 1 | 1 | 93 | 0 | 2 (0) | 8 |
| Arabic home `/ar/` | **ar / rtl** | 1 | 1 | 96 | 0 | 7 (0) | 8 |
| KYC wizard `form.html?role=vendor` (gate step) | en / ltr | 1 | 1 | 7 | 0 | 1 (0) | 7 |
| CMS console `cms.html` (authenticated super_admin) | en / ltr | 1 | 1 | 59 | 0 | 1 (0) | 8 |

## 2. Checkpoints (all pages)

1. **Landmark structure** — one `main` per page; `banner`/`contentinfo`/`navigation` where the
   page has them. Pass.
2. **Accessible names** — every link, button, textbox, searchbox, combobox, checkbox and tab
   in the AX tree has a non-empty accessible name (780+ controls across the seven pages,
   0 unnamed). Pass.
3. **Images** — every exposed image has an accessible name; decorative SVGs are
   `aria-hidden` (the CMS waffle icon gained `aria-hidden="true" focusable="false"`; all
   `UI.icon()` output already carried it). Pass.
4. **Document language & direction** — `en/ltr` on English pages, `ar/rtl` on `/ar/`. Pass.
5. **Keyboard-only operation** — first `Tab` on every public page lands on the skip link
   (labelled "Skip to main content" in EN and "الانتقال إلى المحتوى الرئيسي" in AR, `href="#main"`),
   followed by header controls, navigation and main content in DOM order. Every stop has a
   visible focus ring (real key events, so `:focus-visible` applies). Pass.
6. **Form semantics** — the wizard gate's email field is announced by its visible label; the
   progress stepper is exposed as a `navigation` region once the wizard is open. Pass.

## 3. Announced order (spot checks)

- Home: "Simal Technologies Middle East" → announcement banner → utility links → search →
  main navigation → hero heading ("The Gen5 Era is Here…") → catalogue search → featured products.
- Catalogue: page heading "All products" → category/brand filters → 90 product cards, each
  announced by its product name link.
- Product detail: product name (H1) → price/RFQ actions → specifications → documents →
  recently viewed.
- RFQ: "Request a Quote" heading → basket lines quantity/remove controls → company/contact
  fields → submit.
- AR home: Arabic announcement banner → "الرئيسية" navigation → Arabic hero heading; `dir=rtl`
  reading order verified.
- CMS: "Sign in to Content Studio" gate (H2) → after login: banner, sitemap navigation,
  dashboard KPIs, tables with named headers.

## 4. Findings raised and fixed by this walkthrough

| Finding | Severity | Fix |
|---|---|---|
| CMS header waffle icon exposed as an unnamed image inside its button | blocking (noise in the AT tree) | `aria-hidden="true" focusable="false"` on the SVG (`cms.html`) |
| Wizard stepper had a list but no navigation landmark once the wizard opens | best practice | wrapped in `<nav aria-label="Onboarding progress">` (`form.html`) |
| PDP and AR home jump heading levels (h2→h4, h1→h3) | advisory — WCAG 1.3.1 does not forbid contiguous-level skips | recorded as advisory; card headings are styled/structured that way |
| Gate-step wizard page has no navigation landmark | advisory — that page state has no navigation UI | none needed |

## 5. Verdict

**No blocking issues.** The automated pass exits 0 with 0 blocking findings and 3 documented
advisories. The walkthrough is repeatable: `node scripts/ci/at-walkthrough.mjs`.
