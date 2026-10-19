# Evidence index — Independent Forensic Audit 2026-10-12

All artifacts referenced by `../INDEPENDENT_FORENSIC_AUDIT_AND_VALIDATION.md`. Read-only against the user's world; writes ran in a disposable scratch cluster (now deleted).

## data/
- `authz_matrix.json` — role × route matrix (anonymous/partner/viewer/reviewer/super_admin) run against the sandbox portal. Shows partner→200 on `/api/admin/submissions`, `/api/einvoice/admin/queue`, etc. (F-3).
- `cms_e2e.json` — 20 CMS edits → publish → rebuild → marker-on-page results (§5). LIVE vs NOT-LIVE vs EDIT-ERROR per content type.
- `crawl.json` — full static-site crawl (links, fragments, externals). Basis for the broken-link list (F-7): `/solutions/undefined/` ×5, 7× `/legal/*`, etc.
- `browse_all.json` — Playwright visit of every page: console/network errors, heading counts, broken images, duplicate ids, contrast-adjacent checks.
- `visual_portal.json` — CMS views + portal pages drive-through (headings, dead command-bar buttons, errors).
- `dist_pages.txt` / `sitemap_urls.txt` / `d.txt` / `s.txt` — built-page vs sitemap-URL diffs.
- `toolu_01HoAE…txt` (if present) — requirements extraction (BRD/PRD/FRS/SRS/URD) with doc-vs-doc contradictions (§11).

## logs/
- `build_baseline.log` — clean 218-page build vs the live-data snapshot (exit 0, ~8s).
- `build_fresh.log` — from-scratch `migrate.sql`+`seed.sql` build FAILS: `column "cta_label" does not exist` (F-4).
- `test_unit_integration.log` — portal unit/integration suite 70/70 pass (JSON store).
- `portal_18090.log` — sandbox portal boot (PostgreSQL engine, server_started).

## probes/  (re-runnable; ports noted inside each)
- `authz_matrix.mjs`, `probe_pii.mjs` — RBAC / PII exposure.
- `cms_e2e.mjs` — CMS→public-site end-to-end.
- `crawl.mjs`, `browse_all.cjs` — link crawl + browser defect sweep.
- `contrast_scan.cjs` — measured WCAG 1.4.3 contrast on rendered pages (§9).
- `fake_success.cjs`, `careers2.cjs` — forms report success with backend unreachable (F-6).
- `tab_probe.cjs` — focus lands in invisible modals 41/120 Tab presses (§9).
- `visual_public.cjs`, `visual_portal.cjs`, `visual_partner.cjs`, `rfq_flow.cjs` — visual drive-throughs.
- `static_proxy.mjs` — sandbox static host + `/api` reverse proxy (the topology the repo never ships).
- `api_sweep.mjs`, `api_detail.mjs`, `api.mjs`, `pw.cjs`, `smoke.cjs` — helpers.

## Second iteration — portal & app workflow verification (§5A)
- `probes/workflow_e2e.mjs` — KYC + e-invoicing + auth lifecycles. Contains the **demonstrated account takeover** (reset token read from `/api/cms/outbox`, reset completed, login succeeded) = F-12.
- `probes/kyc_only.mjs`, `review_flow.mjs`, `finish_flow.mjs` — full KYC lifecycle to approval (`SIM-KYC-2026-10088`), incl. the strict-validation evidence.
- `probes/snake_bug.mjs` — proves F-11: `ageDays:null`, `slaBreached:false` on every row, and 500s from `/api/admin/reports/build`, `/api/admin/export.csv` and the built-in reports.
- `probes/cms_buttons.cjs` + `data/cms_buttons.json` — clicks all 48 CMS command-bar buttons; **35 have no effect** (F-13).
- `probes/portal_ui2.cjs`, `admin_flow.cjs` — status page, KYC admin console, both e-invoice consoles.
- `probes/mobile_nav.cjs` — mobile nav and the 35 sub-24px tap targets.
- `probes/kyc_drive.cjs`, `kyc_step1.cjs`, `kyc_inspect.cjs` — the browser-level wizard pass (partial; see the limitations note in §3).
- Key screenshots: `flow_status_result.png` (**"REVIEWER {}"** shown to the customer), `flow_admin_after_login.png` (**"waiting nulld"** on every queue row), `flow_einv_partner.png`, `flow_einv_staff.png`, `kyc_s01.png` (wizard step 1).

## screenshots/  (123)
- `desktop_*` / `mobile_*` — 22 public pages at 1440px and 390px (incl. `desktop_does_not_exist.png` = bare Python 404, no custom 404).
- `mega_1..8.png` — the 8 mega-menus.
- `cms_*.png` — all 21 CMS Content Studio views.
- `portal_*` / `partner_*` — KYC/auth/invoice portal pages and the login screen showing dev credentials.
- `fake_careers_consented.png` — "Application received ✓" on an HTTP 501.
- `sandbox_rfq_result.png` — a real RFQ reference issued through the proxied sandbox.
