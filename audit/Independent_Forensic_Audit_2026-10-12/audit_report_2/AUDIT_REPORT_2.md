# Independent Forensic Re-Audit & Remediation Verification Report (Report 2)

**Audit ID:** IFA-2026-10-12/R2 · **Fieldwork:** 15 October 2026, ~23:00–24:10 (UTC+8) · **Iteration 2 (deeper verification):** 16 October 2026, ~00:30–01:20 (UTC+8) — results in §4A; one measurement corrected, all headline verdicts re-confirmed.
**Prepared by:** Independent AI-assisted forensic review (ZCode/GLM), at the project owner's request. Zero-trust methodology: no claim accepted without re-verification against the live system, the current source, or a freshly executed probe.
**Companion documents:**
- Baseline: `../INDEPENDENT_FORENSIC_AUDIT_AND_VALIDATION.md` (12 Oct 2026)
- Plan under verification: `../REMEDIATION_PLAN.md` (12 Oct 2026 — 77 findings, Phases P0–P10)
- Superseded external pack: `../../FORENSIC_CMS_PUBLIC_SITE_AUDIT_REPORT.md` (retracted, 14 Oct annotations)

**Systems examined (live):** PostgreSQL 16.9 `simal` @127.0.0.1:5433 · Portal/CMS/API Node 24.21.0 @127.0.0.1:8090 (`NODE_ENV=development`) · Astro 5 SSG site `apps/site/dist` (243 pages, built 14 Oct 03:07) served by `scripts/dev-edge.mjs` @127.0.0.1:8100 with `/api` reverse proxy · Repository `Codebase/` (git, 10 commits, 104 uncommitted files at audit time).

---

## 1. Executive summary

### 1.1 Verdict

> **The remediation programme is real, substantial and largely verified — but it is NOT complete, and one new critical regression currently breaks the very capability this project is being certified for: the CMS can no longer rebuild the public website.**
>
> - **51 of 77 findings are fully closed outright, plus 1 (DAT-7) closed against the plan's own acceptance text — 52 of 77 (68%) effectively closed**, re-proven live by this audit (tally as machine-counted in `FINDINGS_MATRIX.csv`: 51 `FIXED` + 1 `FIXED_PER_PLAN` + 24 `PARTIAL` + 1 `NOT_FIXED`).
> - **24 of 77 (31%) are materially progressed** with specific, named residues (each listed in §6).
> - **1 of 77 (PUB-8) remains essentially open** (contradictory brand/award facts still published).
> - **17 NEW findings** were identified by this re-audit (§7), led by one **critical operational regression**: the SSG outbox worker has been unable to spawn a build since **14 Oct 2026 02:42** (`spawn EINVAL` on Node 24 / Windows for `execFile('npm.cmd')` without a shell — an ironic side effect of the SEC-10/P8-3 hardening). Every CMS publish since then is stuck `queued`; the live `dist` is frozen at 14 Oct 03:07.
> - **All of Phases 1–9 exist only as uncommitted working-tree state** (104 files). A single `git checkout .` would silently revert every security fix. There is still **no git remote, no branch protection, and the CI workflow has never executed on a CI platform** — the "CI" story is local gate runs only (all 7 gates were re-run green by this audit, which is itself the strongest evidence available today).

**Is the frontend 100% connected to, and controllable from, the CMS console?** Not today. The architecture is sound and 90%+ of content paths are CMS-controlled at the data layer (§3), but the **publish→rebuild→delivery step is broken at runtime** (F-2026-N01), and the site chrome (navigation menus, footer, newsletter block, SEO/stats/awards) remains hardcoded (CMS-2). The honest answer is: **data-layer yes, delivery-layer no (broken since 14 Oct), chrome-layer partially.**

### 1.2 Headline scorecard (re-measured 15 Oct 2026)

| Dimension | 12 Oct baseline | 15 Oct re-audit | Basis |
|---|---|---|---|
| Security & RBAC | 2/10 | **7.5/10** | SEC-1..5,8,9,12,14 closed live; SEC-6 (TRN), SEC-7 (CSRF token unverified), SEC-11 (dual approval self-attested), SEC-13 (XSS residues) remain |
| Data integrity & provisioning | 3/10 | **8/10** | DAT-1..5,7,8 closed; DAT-6/9 partial; attribution verified live |
| CMS console completeness | 4/10 | **7/10** | CMS-1,5,6 closed; CMS-2/3/4/7/8/9/10 partial with named residues |
| Public site correctness | 5/10 | **8.5/10** | PUB-1..7,9,10 closed; PUB-11/12 partial; **PUB-8 not closed** |
| Apps & workflows (KYC/e-invoice) | 4/10 | **8/10** | APP-1,2,4,5,6 closed; APP-3 (AV dormant, hardcoded key), APP-7 (no UAT evidence) partial |
| Accessibility (WCAG 2.2 AA) | 4/10 | **9/10** | A11Y-1..8 closed; axe gate 0 violations on 7 key pages (fresh run) |
| SEO / localization / consent | 3/10 | **8/10** | SEO-1,3,4,6 closed (243/243 canonical+OG+JSON-LD; real /ar tree); SEO-2 (lastmod), SEO-5 (GA4 not wired) partial |
| Build/CI/deployment | 2/10 | **5/10** | Gates real & green locally; no remote/CI execution; no deploy step; **SSG worker broken** |
| Governance & record honesty | 2/10 | **8.5/10** | GOV-1..5 closed (baseline doc, retractions, honest NO-GO); board stale both directions |
| Test assurance | 3/10 | **7/10** | 48/48 unit, 19/19+12/13 integration, 7/7 gates green (fresh); 1 stale test (ssg-outbox) |

### 1.3 Top findings of this re-audit

| # | ID | Sev | Finding | Evidence |
|---|---|---|---|---|
| 1 | **F-2026-N01** | **Critical** | **CMS→site publish pipeline dead since 14 Oct 02:42.** `server.js:175` `execFile('npm.cmd',…)` without `shell:true` throws `spawn EINVAL` on Node ≥20.12 (CVE-2024-27980 fix). Worker retries the oldest job every 10s forever (never marked failed), jamming the queue: **13 jobs queued as of iteration 2 (11 pre-audit + 2 audit-added)**, last processed 13 Oct 23:51, `dist` frozen at 14 Oct 03:07. Live control-loop test: edit→publish OK, marker **never** appeared on site (3 consecutive runs). Portal runs the same Node v24.21.0 as the repro. | `apps/portal/server.log` (`ssg_loop_failed: spawn EINVAL` ×N); `outbox` table; `evidence/cms_control_loop_and_spawn_einval.txt`; repro `execFile('npm.cmd') → SYNC THROW: EINVAL` on v24.21.0 |
| 2 | F-2026-N02 | High | CSRF synchronizer token is decorative: `verifyCsrfToken` imported but never called; `http.js:138,162` treat mere **presence** of any `x-csrf-token` header as a bypass of the cross-site checks. **Live-confirmed in iteration 2**: evil origin + bogus token → 200 (without token → 403). | `routes.js:5`; `src/lib/http.js:131-165`; `evidence/iteration2_live_proofs_output.txt` |
| 3 | F-2026-N03 | High | Entire remediation (Phases 1–9) is uncommitted: 73 modified + 31 untracked files vs `HEAD 8011ab0`. No remote, no branch protection, CI never ran on a platform. | `git status`; `git remote -v` (empty) |
| 4 | F-2026-N04 | Medium | Report builder still leaks **TRN + email/mobile** to reviewer/viewer (IBAN now masked, TRN not) — SEC-6 residue confirmed live: `"tax.trn":"100123456700090"` in reviewer report. | live probe §4-A/G; `admin.service.js:267-269` |
| 5 | F-2026-N05 | Medium | Media library writes uploads **inside the portal webroot** (publicly served, unauthenticated), accepts `.svg` (active content), no virus scan; UI label says 5 MB, server cap 10 MB. | `cms.service.js:573-585,647-702`; `routes.js:840-848` |
| 6 | F-2026-N06 | Medium | Document AES-256 encryption falls back to a **committed hardcoded key** (`'simal-document-encryption-key-2026'`) because `DOC_ENCRYPTION_KEY` is in no env file. | `pg-repos.js:21` |
| 7 | F-2026-N07 | Medium | ClamAV client exists but is **dormant** — requires `CLAMAV_HOST/PORT`, present in no env file; only the in-memory EICAR signature engine runs. | `virus-scanner.js:145-147`; `.env` |
| 8 | F-2026-N08 | Medium | Unauthenticated `POST /api/integrations/email/bounce` writes attacker-chosen rows into the audit trail (`email_bounce`). | `routes.js:921-924`; `integration.service.js:46-49` |
| 9 | F-2026-N09 | Medium | `/api/admin/observability/errors` exposes error stacks to any staff (incl. `viewer`); `/api/integrations/webhook/test-sign` lets any staff HMAC-sign arbitrary payloads. | `routes.js:981-993` |
| 10 | F-2026-N10 | Medium | XSS residues: hero `cta_href` unsanitized into `innerHTML` (`index.astro:76→1387`); RFQ mini-cart injects product names without `esc()` (`index.astro:1564`); CMS `esc()` still does not escape `'`. | source refs |
| 11 | F-2026-N11 | Medium | **P4 test fixtures published live**: 8 `p4-rollback-article-*` insight pages (title "State 2: Updated Draft") in `dist/insights/`, linked from home and sitemap; `scripts/ci/test-cms-e2e.mjs` writes to the main DB by default (re-pollutes after every cleanup — DAT-7 recurrence vector). | dist grep; `test-cms-e2e.mjs:18` |
| 12 | F-2026-N12 | Low | `ssg-outbox-sync.test.mjs` still authenticates with removed `admin@simalme.com/admin123` — permanently failing test debt (failing in the "right" direction). | test run §4 |
| 13 | F-2026-N13 | Low | CMS profile chip shows wrong identity (`state.me.user` always `{}` → always toasts "Admin (super_admin)"). | `cms.js:144,440-444` |
| 14 | F-2026-N14 | Low | Live credentials committed in scripts: `prod-db-roles.sql:21` (`[REDACTED-ROTATED-2026-10]`), `seed_arabic_content.mjs:5` (`simal:[REDACTED-ROTATED-2026-10]`). | source refs |
| 15 | F-2026-N15 | Low | Governance doc claims "7 automated CI gates passing cleanly" with no saved green run at time of writing (this audit's fresh 7/7 run is now the first captured evidence); board CSV (31 closed / 46 open) stale in **both** directions vs code. | `docs/GOVERNANCE_REQUIREMENTS_BASELINE.md a44`; `remediation-board.csv` |
| 16 | F-2026-N16 | Low | `hero_slides.bg` still CMS-editable but never rendered (client uses static palette) — DAT-8 residue. | `index.astro:1353` |
| 17 | F-2026-N17 | Low | SLA `age` is integer-floored so the `>= 1.5` breach condition fires at ≥2 days; no automated escalation job exists (dashboard surfacing only). | `review.service.js:43-49` |

### 1.4 Go/No-Go (P10 gate status)

**NO-GO.** The prior go-nogo checklist already recorded "automated gates green — human sign-offs outstanding (default NO-GO)"; this audit adds a **new blocker** (F-2026-N01) and re-affirms three P1-level residues (CSRF verification, TRN masking, dual-approval enforcement). Recommended unblocking order in §8.

---

## 2. Methodology (zero-trust, evidence-first)

Every verdict below is anchored to at least one of:

1. **Fresh live execution on the running stack** (brought up via `scripts/supervisor.cmd` + `node scripts/dev-edge.mjs`): portal health, login matrix, RBAC route matrix across 5 roles, RFQ end-to-end via the site origin, contact form, report builder PII masking, outbox redaction, CMS edit→publish→rebuild control loop (×3 runs), announcement rollback/restore.
2. **Fresh test-suite execution**: portal unit (`node --test test/unit`) 48/48; integration `api.test.js` 19/19, `workspace.test.js` 12/13 (the 1 fail = stale-credential `ssg-outbox-sync`, F-2026-N12); **all 7 CI gates** via `node scripts/ci/run-gates.mjs` — **7/7 PASS** (`clean-db` [241 pages from empty migrate+seed], `authz`, `pg-reporting`, `crawl` [457 URLs, 0 broken], `placeholders`, `a11y` [axe, 0 serious/critical on 7 pages], `perf` [31/31 budgets, simulated LH 95/100, LCP ≈1.03 s]).
3. **In-app browser drive-through** (visual + DOM): public home (desktop), CMS login → dashboard → products-catalog editor → publish-pipeline console, `/ar/` localized home, custom 404. Screenshots archived in `evidence/`.
4. **Read-only source + DB inspection** by six parallel forensic verification agents (SEC-1..14; DAT-1..9+SEC-14; PUB-1..12; CMS-1..10; APP-1..7 + A11Y-1..8 + SEO-1..6; P0/NFR/GOV/P10), each required to cite current `file:line` and quote code — no comments or documentation claims accepted at face value.
5. **Git forensics**: 10 commits (`cbdcde5` P0-1 baseline → `8011ab0` P4), `git diff --stat HEAD` (73 files +3,453/−1,294), `git status` (31 untracked), `git remote -v` (empty).

Constraints honored: read-mostly probes; the only writes were clearly-labelled audit markers (announcement text — **restored to original in DB**; one labelled RFQ `SIMAL-RFQ-20261015-1020`; one contact/newsletter row `audit@probe.invalid`), all left in the dev rig only.

---

## 3. The core question: is the frontend 100% connected to & controllable from the CMS?

Layer-by-layer verdict (the question the commissioning brief asked):

| Layer | Verdict | Evidence |
|---|---|---|
| **Content data model** (CMS tables ↔ site queries) | ✅ **Connected** | 243 built pages render from PostgreSQL: products/deep specs, slides, announcements, testimonials, legal (EN+AR), software blocks, solutions, brands (live counts), insights, careers roles, cases, offices, `/ar` tree (11 pages, `lang='ar'` blocks: 12 rows; AR legal: 7). |
| **CMS write path** (editors → API → DB, revisions, rollback, attribution) | ✅ **Working** | Live: announcement PUT 200 + revision snapshot; actor now `admin@smartme.com` (was `system`); rollback scoped & undoable (DAT-4/5); products/testimonials/slides/policies/insights editors + brands-catalog + media library + deep product editor all present; 62/62 command-bar buttons wired (0 inert). |
| **Publish → SSG rebuild → delivery** | ❌ **BROKEN (F-2026-N01)** | Worker loop alive (10 s poll) but every spawn dies `EINVAL`; 11 jobs queued since 14 Oct 02:42; live control-loop test ×3: marker never reached the site. Pipeline console itself is honest (Processed 2 / Pending 11 / Failed 1 displayed in CMS). |
| **Dynamic APIs from the site origin** (RFQ, basket, contact, careers, KYC) | ✅ **Connected** | `dev-edge`/nginx `location /api/` topology; live RFQ: basket add (underscore slug) → submit `201 SIMAL-RFQ-20261015-1020` → public status lookup with timeline; contact 201. |
| **Site chrome** (nav/menus, footer, newsletter block, SEO fields, stats/awards) | ⚠️ **Not CMS-controlled** | `BaseLayout.astro` reads **zero** `content_blocks` for chrome; 8 mega-menus, footer columns, newsletter markup hardcoded; no `#/navigation`, `#/seo`, `#/stats`, `#/awards` editors (CMS-2). |

**Bottom line:** the "CMS controls the site" claim was true at the data layer and was demonstrably working end-to-end until 13 Oct 23:51 (11 processed builds). It is **not true today** because of F-2026-N01, and it is **not 100%** even when the worker is fixed, because the chrome layer (nav/footer/newsletter/SEO/stats/awards) has no editors — exactly the CMS-2 gap the remediation plan itself flagged as its largest Phase-4 item.

---

## 4. Test & verification results (fresh, 15 Oct 2026)

| Suite | Result | Notes |
|---|---|---|
| Portal unit tests | **48/48 PASS** | validators, content-governance, security-rules-store, ssrf-screening (remediation-era suites) |
| Integration `api.test.js` | **19/19 PASS** | full HTTP journeys; runtime-generated credentials (SEC-1 pattern in tests) |
| Integration `workspace.test.js` | **12/13 PASS** | reports/build 200, export.csv 200 (DAT-3-era 500s gone) |
| Integration `ssg-outbox-sync.test.mjs` | **FAIL (expected direction)** | stale `admin@simalme.com/admin123` — F-2026-N12; also would hit F-2026-N01 |
| Gate `clean-db` (DAT-1) | **PASS** | empty DB → migrate+seed → 241-page build green |
| Gate `authz` (SEC-3/5) | **PASS** | deny-by-default across 20 routes × 4 roles + IBAN-leak check |
| Gate `pg-reporting` (DAT-3/APP-1) | **PASS** | camelCase rows, `ageDays` non-null, `slaBreached=true` at 4 days, reports+CSV 200 |
| Gate `crawl` (PUB-3) | **PASS** | 457 internal URLs, 0 non-2xx/3xx, 0 `undefined` (19 anchor gaps = PUB-12 residue) |
| Gate `placeholders` (PUB-7) | **PASS** | 0 internal markers in dist |
| Gate `a11y` (P6) | **PASS** | axe-core wcag2/2.1 A+AA: **0 serious/critical** on /, /products/, /brands/, /insights/, /software/, /contact/, /about/ (baseline 12 Oct: 17 violations) |
| Gate `perf` (NFR-1) | **PASS** | 31/31 budgets; TTFB 52 ms; simulated-4G LCP ≈1,025 ms (≤2,500); simulated LH score 95/100 (≥85) |
| Live RBAC matrix | **PASS** | viewer→403 ×5 admin routes; reviewer→200 submissions/einvoice-queue, 403 users; anonymous→401; old seeds (`admin123`/`reviewer123`/`partner123`)→401 |
| Live SLA check | **PASS** | `/api/admin/submissions` rows: `ageDays:1`, `slaBreached:false`, real reviewer names (was `nulld`/`null`) |
| Live RFQ e2e | **PASS** | underscore slug accepted (PUB-6), ref `SIMAL-RFQ-20261015-1020`, status timeline, honest `SIMULATED` email status in outbox |
| Live CMS control loop | **FAIL (F-2026-N01)** | edit→publish OK; SSG job stuck `queued`; marker never on site; ×3 runs |
| Browser drive-through | **PASS (visual)** | home, CMS console (login/dashboard/products/pipeline), `/ar/`, 404 — all render correctly; skip-link, single h1, real RFQ counter observed in DOM |

Full logs: `evidence/ci_gates_full_run_2026-10-15.log`, `evidence/cms_control_loop_and_spawn_einval.txt`, `evidence/live_probes.mjs`.

---

## 4A. Iteration 2 — deeper verification (16 Oct 2026)

A second pass re-verified this report's own claims with zero trust in iteration 1. **Outcome: every headline verdict stands; one measurement was corrected (queue count), one residue of my own probing was found and cleaned (see 4A.6), and four claims were upgraded from static code evidence to live proof.** Raw output: `evidence/iteration2_live_proofs_output.txt` (scripts: `iteration2_live_proofs.mjs`, `iteration2_fixups.mjs`).

**4A.1 CSRF bypass — LIVE-CONFIRMED (F-2026-N02 upgraded from static to live).**
Using `POST /api/auth/logout` as a harmless state-change:
- evil `Origin: https://evil.example`, **no** token → **403** `Cross-origin request blocked: untrusted origin` (the layer exists);
- evil Origin + `x-csrf-token: totally-bogus-audit-probe` → **200** — a fabricated header value fully bypasses the CSRF layer (`http.js:138,162` test only for header presence; `verifyCsrfToken` remains dead code);
- control (no Origin header) → 200, normal flow unaffected.
Severity confirmed **High**; fix unchanged: actually verify the session-bound token.

**4A.2 Partner-role RBAC — the original Critical F-3/SEC-3, now denied live end to end.**
Iteration 1 tested viewer/reviewer/anonymous but had no partner session. Iteration 2: the admin user-provisioning API **refuses to create `partner`** (`400 Role must be one of: super_admin, reviewer, viewer` — a good control in itself); a partner was therefore provisioned through the **public registration endpoint** (`POST /api/auth/register` → 201 — which is also a live proof of APP-5), logged in (role `partner`), and driven across **16 privileged routes** (submissions incl. `pii=full`, per-submission read, a real document id, analytics, audit, export.csv, rfqs, outbox, users, einvoice admin queue + invoice, integrations ×2, cms blocks + outbox): **16/16 denied (401/403), 0 raw-IBAN leaks**; the same session reached its own surface (`/api/einvoice/mine` → 200), proving the denials are RBAC, not a broken session. SEC-3 verdict (✅ FIXED) confirmed with the strongest possible live evidence.

**4A.3 Reset-token redaction — verified at WRITE time (SEC-4).**
A fresh `POST /api/auth/password-reset/request` was triggered; the stored outbox body for the fresh reset email reads `Open /login.html?reset=[REDACTED] within 60 minutes…` — the token is redacted **in the persisted body itself, even for the super_admin (view_pii) reader**. The original F-12 takeover chain (recover token from outbox → reset → login) is closed at the root.

**4A.4 Rollback safety — verified live (DAT-4/5).**
`POST /api/cms/revisions/announcements/1/rollback` twice: returns `{ok, rolled_back:true, to:<rev-id>}`, each rollback restores the prior state, **rollback-of-rollback works** (state A→B→A′ walked back twice), and the shared `site/featured-products` content block was untouched by the announcement rollback (scope held).

**4A.5 Independent DB & dist re-measurements.**
- **PUB-8 sharpened:** `brands` table = **22 rows** (the ratified GOV-1 value is correct at catalogue level); `products` carries **19 distinct brands with SKUs**; the home page still hardcodes "**21** Global Leaders" (×2) and the seeded hero slide still says "**23** global IT leaders" (×2) alongside the DB-driven **22**. Four numbers in circulation; finding stands NOT-FIXED with exact counts.
- **F-2026-N11 reconfirmed:** 8 `p4-rollback-article-*` directories live under `dist/insights/`, 1 inbound link from `dist/index.html`, **32 references in `dist/sitemap.xml`**.
- **hreflang reciprocity verified on dist:** EN home ↔ AR home and EN products hub ↔ AR products hub each list `en` + `ar` + `x-default` fully-qualified and reciprocal; per-SKU pages correctly omit `ar` (no per-SKU twins exist). SEO-4 ✅ confirmed.
- **SEO-2 residue confirmed:** all **240** sitemap `<lastmod>` values are the constant `2026-10-12`. JSON-LD present on **243/243** pages (SEO-1 ✅).
- **Data quality:** `audit_log` bad actors (`{}`/`[object Promise]`) = **0**; invoices with non-10-digit Peppol endpoints = **0**; `content_blocks lang='ar'` = **12**, `legal_policies lang='ar'` = **7**; `simal` role still `rolsuper=t` while `simal_app` (NOSUPERUSER, can login) exists unused — DAT-9 🟡 confirmed exactly.
- **KYC wizard (APP-7) live validation pass:** entry page shows the two tracks (vendor/customer) and Simal's own **10-digit Peppol ID `0235:1001234567`** (APP-2 visible in UI); step-1 email gate rejects empty and malformed input with an inline "Please enter a valid email address." message. APP-7 remains 🟡 only for the missing formal UAT evidence pack.
- **A11Y-2 structural focus proof:** on the live CMS, **8/8 closed modals carry `hidden` + `inert`** containing 68 focusable elements (all spec-removed from tab order), 0 stray visible `[role=dialog]`. (A synthetic Tab-walk could not drive IAB focus — tooling limitation noted; `inert` is browser-enforced, and the fresh axe run is green.)

**4A.6 Corrections to iteration 1 (honesty ledger).**
1. **Queue count:** iteration 1 reported 11 queued SSG jobs; the audit's own three control-loop runs added publish jobs — current count **13 queued** (11 pre-audit + 2 audit-added; the third run's restore re-used one). F-2026-N01 unchanged in substance: nothing has processed since 13 Oct 23:51.
2. **Announcement text residue:** iteration-1's scripted "restore" steps left an audit marker string as the announcement's current DB text (detected in iteration 2's rollback test). **Corrected:** the true original ("⚡ Gen5 is here — Crucial P510 now in Dubai stock.") was PUT back and verified. No site impact occurred — the jammed queue means `dist` never rendered any marker (also independently re-confirmed: marker absent from the served home page).
3. **Tally precision:** "52 closed" = 51 `FIXED` + DAT-7 `FIXED_PER_PLAN` (closed against the plan's own acceptance text, recurrence risk registered as F-2026-N11). §1.1 updated.
4. **Environment fact added:** the portal process runs the same Node **v24.21.0** (`Codebase/tools/node`) used for the `spawn EINVAL` repro — the diagnosis applies to the running server, not just a shell test.


---

## 5. Phase-by-phase verification (P0 → P10)

Legend: ✅ closed by plan's acceptance criteria · 🟡 partial (named residues) · ❌ not closed.

### Phase 0 — Mobilize & safety net
- **P0-1 VCS/branch protection — 🟡.** Repo exists (10 commits, baseline `cbdcde5` = audit state) but **no remote, no protected branch, PR-triggered CI never ran**; 104 files uncommitted (F-2026-N03). Runbook-only (`docs/BRANCH_PROTECTION.md`).
- **P0-2 one-command bring-up — ✅.** `scripts/bringup.mjs` (PG `-w -t 20`, guarded `--fresh` reset, portal, SSG build, dev-edge with `/api` proxy); `supervisor.cmd`; autostart task. Verified live — this audit used it.
- **P0-3 six CI gates — 🟡.** All gate scripts real and biting (Oct-12 log shows all-RED on genuine defects; this audit drove all 7 GREEN). Residues: `placeholders` + `perf` not wired into `.github/workflows/ci.yml`; workflow itself never executed (no remote); `sync-sequences` not gated (DAT-6).
- **P0-4 standards baseline — ✅.** `ARCHITECTURE_STATE.md:58-74` pins WCAG 2.2 AA, ASVS 5.0.0 L2, NIST 800-63B-4, UAE PDPL 45/2021, PINT AE 1.0.4 with owners.
- **P0-5 triage board — 🟡.** `remediation-board.csv` has all 77 rows; **stale both directions** (31 closed/46 open; code contains fixes for rows still "open", and vice versa — F-2026-N15).

### Phase 1 — Security P0 (deploy blockers)
- **P1-1 (SEC-1, SEC-2, SEC-12) — ✅ (with hygiene notes).** devAccounts block **deleted** (plus active purge of legacy emails on boot); `123456` bypass **deleted**, not gated; `NODE_ENV` explicit; `ADMIN_PASSWORD_MIN=15`; login/CMS pages show no credentials (verified live + browser). Notes: `.env.example` still documents MIN=8; `.env` (dev, untracked) uses the published RFC example TOTP secret and `ADMIN_MFA_REQUIRED=false`; `.env:9` typo `admin@smartme.com`.
- **P1-2 (SEC-3, SEC-5) — ✅.** `adminAuth=[requireAuth, requireStaff]` + per-route `requirePerm` (routes.js:437+); partner excluded from all staff routes; documents gated by ownership/`view_pii` + single-use signed URLs. Live matrix green. Residues: F-2026-N09 (observability/webhook-sign staff-wide).
- **P1-3 (SEC-4) — ✅.** Outbox stores redacted text; raw token only in SMTP transport var; `/api/admin/outbox` + `/api/cms/outbox` `view_pii`-gated + regex redaction. Live: reviewer sees `REDACTED`, no `reset=` tokens.
- **P1-4 (SEC-6) — 🟡.** Route gated; IBAN masked live; **TRN/email/mobile still unmasked** (F-2026-N04).
- **P1-5 re-verification — ✅ (superseded by this report).**

### Phase 2 — Provisioning & data integrity
- **P2-1 (DAT-1) — ✅.** `cta_label` in DDL; `category_slug` zero references; seeds consolidated in `seed.sql` (announcements/testimonials/featured/careers); `migrations/` mirrors deleted; clean-DB gate green (241 pages).
- **P2-2 (DAT-3/APP-1/APP-6/SEC-6 root) — ✅.** `rowToSubmission`+camelize; SLA computes; live ages real; reports/CSV 200. Residues: F-2026-N17 (integer age; no escalation job).
- **P2-3 (DAT-2) — ✅.** `session.user` populated; `getActor` real email; `actorName` awaited everywhere; status page renders real names or "Queued for assignment". DB: 0 `{}` actors.
- **P2-4 (DAT-4/5) — ✅.** Rollback scoped `(entity,entity_id,lang)` + ambiguity guard 400; snapshot-before-apply in all 6 branches (undoable); products rollback real.
- **P2-5 (DAT-6) — 🟡.** Tool rewritten with `pg_get_serial_sequence`/`format('%I')`; **not in CI**.
- **P2-6 (DAT-7) — ✅ per plan.** Cleanup script with dry-run (62 candidates listed read-only), backup + rollback; plan explicitly defers execution to prod cutover. **New risk:** `test-cms-e2e.mjs` re-pollutes main DB (F-2026-N11).
- **P2-7 (DAT-8) — ✅.** `category_guides` wired+seeded; `product_deep.box/docs` rendered; `testimonials.company` rendered; announcement scheduling window wired; brands live-count computed (render never uses stale cache). Residue: `hero_slides.bg` (F-2026-N16).
- **P2-8 (DAT-9) — 🟡.** `prod-db-roles.sql` (`simal_app` NOSUPERUSER, exists in DB) + `pg_hba.conf.production` (scram, deny-all) exist; **running app still connects as superuser `simal` over `trust`**.
- **P2-9 (SEC-14) — ✅.** Service-layer 409 before any trigger; identical JSON/PG; immutability CI job exists.

### Phase 3 — Public-site correctness
- **P3-1 (PUB-2) — ✅.** nginx `simalme.com` vhost with `location /api/ → portal:8090` + static root; dev proxies (astro vite + dev-edge). Live via 8100 origin.
- **P3-2 (PUB-1/9, APP-4) — ✅.** All five form families show success only on 2xx with error/catch branches; digest + line-card now really call `/api/contact`; `/onboarding` mock deleted, links the real wizard (`form.html?role=…`).
- **P3-3 (PUB-3) — ✅.** `targetId` on all solutions5 entries (+ legacy slug remap); legal hub slugs match DB; sitemap DB-driven; crawl gate 0 broken / 0 `undefined`.
- **P3-4 (PUB-4/10/11) — ✅ / ✅ / 🟡.** Real basket widget (empty state honest); zero client PII storage; `simal_recent` wired (PDP + catalogue); ROI total==breakdown and reacts to 4 inputs — **but `r-ind`/`r-size` still ignored**.
- **P3-5 (PUB-5) — ✅.** Valid columns only; basket key `data.basket||data.items`; full twin rebuild landed under P7.
- **P3-6 (PUB-6) — ✅.** Regex accepts `_`; live underscore add-to-basket 200; test coverage exists.
- **P3-7 (PUB-7) — ✅.** 0 markers in dist; CI gate green.
- **P3-8 (PUB-8) — ❌.** **Home still says 21 / 22 / 23 brands simultaneously** (hardcoded badge `index.astro:56`, DB counter → "22", seeded hero slide → "23"); hardcoded "21 brands" on 4 more pages; awards naming differs home vs about; no `site/counters`/`site/awards` blocks are read anywhere. Years/SKU/WhatsApp/leadership now consistent.
- **P3-9 (PUB-12) — 🟡.** Deep-link filtering works client-side (`#memory`, `?cat=`, `#cat-*` remap; insights `#cat-*`); `amc-table`/`solutions` anchors exist; **19 fragment targets still missing** (AR about section ids, `#comparison`).

### Phase 4 — CMS completeness
- **P4-1 (CMS-1) — ✅.** 62 action items all wired (programmatically counted; 11 chips are now `<span>`); Trigger Build/Purge, Provision Staff, Export CSV, Push Live, View Public Site all implemented. Residues: 2 hardcoded count chips.
- **P4-2 (CMS-3/4/6) — ✅ CMS-6 · 🟡 CMS-3/4.** AMC view edits `site/amc-tiers` first (decoy still seeded+fallback); stock renders "Out of stock" via explicit comparison at every read site (**storage still TEXT strings, not boolean**); string/array payloads editable (422 gate removed).
- **P4-3 (CMS-5) — ✅ (9/10).** All ten mismatches verified fixed except: `purgeAll` read client-side but ignored server-side (cosmetic checkbox).
- **P4-4 (CMS-2/9) — 🟡.** New editors: brands-catalog CRUD, product deep (specs/warranty/datasheet) + create/delete, media library upload/delete, claims-register site-blocks. **Still missing:** navigation/menus, footer, newsletter, SEO metadata, stats/counters, awards, categories, `/ar` content editor; `BaseLayout` chrome reads no blocks; media stored in webroot without AV (F-2026-N05).
- **P4-5 (CMS-7/SEC-11) — 🟡.** Quick Create article includes body (build-safe, site guards anyway); **"Generic Content Block" still writes entity `custom`**; dual approval only for sensitive-classified entities and **self-attested** (second approver never signs); ordinary legal/marketing still single-hand publishable.
- **P4-6 (CMS-10) — 🟡.** Counters real (queued-based; entity counts; pipeline console honest — verified visually: Processed 2 / Pending 11 / Failed 1); failed build never claims success in pipeline; **dashboard "Last Publish" still enqueue-derived**; **no deploy step to any hosting/CDN target**; purge cosmetic.
- **P4-7 (CMS-8) — 🟡.** Bell/gear/Ctrl+S implemented; loc-audit computed from real SQL counts (EN/AR); RBAC matrix rendered from live `rules.js`. Residues: fallback constants could fabricate; profile chip identity bug (F-2026-N13); "100% Shared" asserted not measured.

### Phase 5 — Apps & workflows
- **P5-1 (APP-7/APP-5) — ✅ APP-5 · 🟡 APP-7.** Public partner registration built (`/api/auth/register` + login.html tab). Wizard: autosave 800 ms-debounce + 30 s interval, draft restore banner, `?reapply=` resubmission, 7 steps verified in code + automated browser test report; **no manual UAT script/evidence pack** (plan's acceptance).
- **P5-2 (APP-3/SEC-5) — 🟡.** ClamAV INSTREAM client implemented and called before store; AES-256-GCM at rest; ≤15-min single-use signed URLs with ownership gates. **But clamd dormant without env (F-2026-N07) and AES runs on a committed fallback key (F-2026-N06).**
- **P5-3 (APP-2/SEC-9/GOV-5) — ✅.** `urn:peppol:pint:billing-1@ae-1` + valid ProfileID; endpoints rebuilt to 10-digit TIN and **all 20 stored PG rows migrated**; "delivered" only on real ASP transmission (`ASP_ENDPOINT`+`ASP_SHARED_SECRET` flag), else honestly `simulated`; content dates aligned (1 Jan 2027); `peppol-verify-results.json` 21/21 sandbox.
- **P5-4 (SEC-9) — ✅.** SMTP honest (`sent` vs `simulated` with `unconfigured_smtp_simulated` — seen live in pipeline console); no email-draining worker, but no false claims either.
- **P5-5 (APP-6) — ✅.** Formatted dates, populated buyer/TRN, real ages (`ageDays`/`—`).
- **P5-6 (APP-4) — ✅.** CV upload (PDF/DOC/DOCX ≤5 MB client + server), virus-scanned, routed to careers@, truthful result.

### Phase 6 — Accessibility (WCAG 2.2 AA)
- **A11Y-1..8 — ✅ all eight.** One server-side `<h1>` on **243/243** dist pages; `hidden inert` modal pattern + recomputing trapFocus + focus restore; skip link all pages; heading order sequential; tokens ≥4.5:1 (gold `#8B6210` 5.45:1, green `#0E5A47` 8.2:1) with **fresh axe run: 0 violations**; explicit 24×24 px blocks; `id="q"` split (`hdr-q`), real `aria-pressed` chips, careers labels, pause buttons on both carousels; CMS labels/`aria-live`/chip-spans. Caveats: axe gate covers public site only (not `cms.html`); SC 2.5.8 not machine-gated; no AT walkthrough log (P6-8 manual half outstanding).

### Phase 7 — SEO, localization, consent
- **P7-1 (SEO-1) — ✅.** canonical+hreflang+OG+Twitter+JSON-LD graph on 243/243 pages.
- **P7-2 (SEO-2/3) — 🟡 SEO-2 · ✅ SEO-3.** Sitemap 240 URLs incl. `/ar` tree + reciprocal `xhtml:link`; `priority/changefreq` dropped; `trailingSlash:'always'` + directory format (crawl: 0 redirects/breaks). **`lastmod` is a hardcoded constant** (`VERIFIED_BASE_DATE='2026-10-12'`), not content-derived.
- **P7-3 (SEO-4) — ✅.** Genuine bilingual tree: 11 `/ar` pages, Astro i18n, DB-driven (`lang='ar'` blocks ×12, AR legal ×7), reciprocal lossless switch, `x-default`. Caveat: AR hero/marketing copy still template-hardcoded (data from DB).
- **P7-4 (SEO-5) — 🟡.** Consent banner with toggles, 12-month persisted choice, withdrawal path, Consent Mode v2 defaults denied — but **GA4 itself is still not loaded** (no gtag script / measurement ID anywhere), so no analytics fires at all.
- **P7-5 (SEO-6) — ✅.** Custom 404 (search + categories + WhatsApp — verified live) + robots `Disallow: /api/ /search/`.

### Phase 8 — Security & NFR hardening
- **P8-1 (SEC-7) — 🟡.** Origin/Sec-Fetch-Site enforcement, `readJsonBody` 415 on non-JSON + 413 size caps, `__Host-` cookie in prod — but the synchronizer token is never verified (F-2026-N02).
- **P8-2 (SEC-8/NFR-4) — ✅ SEC-8 · 🟡 NFR-4.** Login behind limiter (10/5 min) + `email|ip` guard; per-request IP; XFF only from trusted proxies. Shared store: still in-process `Map`; nginx edge limits documented (`login_zone 2 r/m burst=10`) but untested.
- **P8-3 (SEC-10) — 🟡 (regression).** Hardening itself correct (execFile, 60 s timeout, SIGTERM, scrubbed env, no F:/ path) — **and it broke the build** (F-2026-N01): `npm.cmd` cannot be spawned by execFile without shell on Node ≥20.12/24 (CVE-2024-27980).
- **P8-4 (SEC-13) — 🟡.** CSP on site (meta + nginx, stricter); announcement `cta_href` and it_solution cats sanitized; **hero `cta_href` unsanitized, mini-cart innerHTML sink, `esc()` no `'`** (F-2026-N10).
- **P8-5 (SEC-12) — ✅.** Dotfile deny + path containment; generic 500s (stack only to logs); `.env` git-ignored; `serve_prototype.py` dev-only.
- **P8-6 (NFR-1) — 🟡.** perf-budget gate green (31/31, sim-LH 95, LCP 1.03 s 4G) — self-described simulation, not Lighthouse CI.
- **P8-7 (NFR-2) — ✅ (scope caveat).** Real drill executed 13 Oct: 7 dumps, per-table parity (audit_log 1106/1106, documents 641/641), **RTO 3.12 s / RPO 0 s** vs targets 4 h/1 h — on the local rig, app-level dumps.
- **P8-8 (NFR-3) — 🟡.** request-id propagated end-to-end (verified in live error bodies + logs); **no external error sink / uptime monitor / alerting** (hypercare script ×2 entries only).
- **P8-9 (NFR-5) — ✅.** Portal is a real directory in-tree (194 tracked files; junction gone) — uncommitted-changes caveat applies.

### Phase 9 — Governance
- **P9-1 (GOV-1/4) — ✅.** `GOVERNANCE_REQUIREMENTS_BASELINE.md` v3.0 RATIFIED: all 45 contradictions resolved to one value each (22 brands; 78 SKUs; `RFQ-YYYY-NNNNN`/`SIM-KYC-YYYY-NNNNN`; 3 steps/2 tracks; mandatory prod TOTP; 20 min/12 h sessions; WCAG 2.2 AA; 99.9%; RPO 1 h/RTO 4 h; ASP 30 Oct 2026 / exchange 1 Jan 2027); ADR-009 as-built stack; D365 naming removed from UI and scoped as Fluent *theme*. Caveats: cites non-existent ADR-14; role-title (not human) sign-offs; "7 gates passing" claim unsupported at writing (F-2026-N15).
- **P9-2 (GOV-2) — ✅.** Superseded/retraction banners on the Antigravity pack (verified, includes PG-version and stack corrections).
- **P9-3 (GOV-3/5) — ✅.** Go-live record honest: automated gates green + 6 human gates PENDING = NO-GO; execution log ends "GATE RED — ABORT"; hypercare = 2 rehearsal entries; Peppol dates aligned everywhere.
- **P9-4 (SEC-11 governance) — 🟡.** Dual-approval mechanism exists but is self-attested and limited to sensitive entities (see P4-5).

### Phase 10 — Re-verification & go/no-go
- **🟡 Partially discharged — and this report IS the missing P10-1.** Gates re-run green (fresh evidence now exists); smoke 20/20 (13 Oct); peppol-verify 21/21 sandbox (13 Oct); **but** no external pen-test (P10-2), no RTM re-run against the reconciled baseline (P10-3), no P10 rows on the board, and the go/no-go remains **NO-GO** — now with a new critical blocker.

---

## 6. Master findings matrix (all 77, re-verified)

Verdict counts: **✅ 52 closed · 🟡 24 partial · ❌ 1 open.**

| ID | Sev | Verdict | Key evidence / residue |
|---|---|---|---|
| SEC-1 | C | ✅ | devAccounts deleted + purge; live 401s for all old seeds; pages clean |
| SEC-2 | C | ✅ | bypass deleted; NODE_ENV set; MIN=15 (env.example doc drift noted) |
| SEC-3 | C | ✅ | requireStaff+requirePerm everywhere; live matrix green (residues → F-2026-N09) |
| SEC-4 | H | ✅ | redacted outbox verified live (reviewer: REDACTED, no reset=) |
| SEC-5 | H | ✅ | signed single-use URLs + ownership/view_pii gates |
| SEC-6 | H | 🟡 | IBAN masked live; **TRN/email/mobile unmasked** (F-2026-N04) |
| SEC-7 | M | 🟡 | Origin/SecFetch+415+413+__Host- done; **token never verified** (F-2026-N02) |
| SEC-8 | M | ✅ | login limited(); per-request IP; trusted-proxy XFF |
| SEC-9 | M | ✅ | honest simulated/sent; ASP flag gates "delivered" |
| SEC-10 | M | 🟡 | hardening correct but **broke SSG on Node24/Win** (F-2026-N01) |
| SEC-11 | M | 🟡 | dual approval sensitive-only + self-attested; ordinary content single-hand |
| SEC-12 | L | ✅ | dotfile deny; generic 500s; .env ignored |
| SEC-13 | M | 🟡 | CSP + partial sanitization; hero href + mini-cart + esc(') residues |
| SEC-14 | M | ✅ | service-layer 409 both modes |
| DAT-1 | H | ✅ | clean-DB gate green (241 pages); seeds in seed.sql; mirrors deleted |
| DAT-2 | H | ✅ | real actors live (CMS + KYC); 0 `{}` in DB |
| DAT-3 | H | ✅ | camelize; live ageDays=1; reports+CSV 200 |
| DAT-4 | H | ✅ | scoped rollback + ambiguity guard |
| DAT-5 | M | ✅ | snapshot-first all branches; products branch real |
| DAT-6 | M | 🟡 | safe rewrite; not in CI |
| DAT-7 | M | ✅* | cleanup script + dry-run (62 candidates); execution deferred per plan; **e2e re-pollution vector** (F-2026-N11) |
| DAT-8 | L | ✅ | all columns wired or rendered; live brand counts; residue hero bg |
| DAT-9 | M | 🟡 | roles + scram template exist; app still superuser/trust |
| CMS-1 | M | ✅ | 62/62 wired; 0 inert; chips are spans |
| CMS-2 | H | 🟡 | brands/deep-product/media editors exist; **nav/footer/newsletter/SEO/stats/awards/categories/AR still none** |
| CMS-3 | M | 🟡 | primary block fixed; decoy still seeded + fallback |
| CMS-4 | M | 🟡 | render correct; storage still TEXT not boolean |
| CMS-5 | M | ✅ | 9/10 fixed; purge checkbox server-cosmetic |
| CMS-6 | M | ✅ | string/array payloads editable |
| CMS-7 | M | 🟡 | article OK; generic block still writes `custom` |
| CMS-8 | L | 🟡 | widgets real; loc-audit/RBAC real; fallback constants + chip bug |
| CMS-9 | M | 🟡 | upload/delete real; **in-webroot, no AV, svg allowed** (F-2026-N05) |
| CMS-10 | M | 🟡 | counters/pipeline honest; Last-Publish KPI wrong source; **no deploy step** |
| PUB-1 | H | ✅ | 2xx-only success, error branches everywhere |
| PUB-2 | H | ✅ | nginx vhost + /api; live through edge origin |
| PUB-3 | H | ✅ | crawl 0/0; targetId fixed |
| PUB-4 | M | ✅ | real basket, honest empty state (observed in DOM) |
| PUB-5 | M | ✅ | valid columns; correct basket key |
| PUB-6 | M | ✅ | underscore slug live 200 |
| PUB-7 | M | ✅ | 0 markers; gate green |
| PUB-8 | M | ❌ | **21/22/23 brands still on home**; awards inconsistent; no DB-driven counters/awards |
| PUB-9 | M | ✅ | onboarding links real wizard |
| PUB-10 | L | ✅ | zero client PII; recently-viewed wired |
| PUB-11 | L | 🟡 | totals reconcile; r-ind/r-size ignored |
| PUB-12 | M | 🟡 | client-side filtering; 19 anchors missing |
| APP-1 | H | ✅ | live ages/breach; (integer-age + no escalation job noted) |
| APP-2 | M | ✅ | PINT AE ids; 10-digit endpoints; 20 rows migrated |
| APP-3 | M | 🟡 | scan+AES+URLs built; **clamd dormant; hardcoded key** |
| APP-4 | M | ✅ | CV upload + scan + truthful |
| APP-5 | M | ✅ | register flow built |
| APP-6 | L | ✅ | dates/TRN/ages fixed |
| APP-7 | M | 🟡 | features verified; **no manual UAT evidence pack** |
| A11Y-1..8 | H/M/L | ✅ ×8 | 243/243 h1; inert modals; skip link; order; contrast (axe 0); 24px targets; control semantics; CMS labelling |
| SEO-1 | H | ✅ | 243/243 canonical+OG+JSON-LD |
| SEO-2 | M | 🟡 | full coverage + hreflang; **lastmod hardcoded** |
| SEO-3 | M | ✅ | trailing-slash policy; 0 churn |
| SEO-4 | H | ✅ | real /ar tree from DB; reciprocal; x-default |
| SEO-5 | M | 🟡 | consent complete; **GA4 not loaded** |
| SEO-6 | L | ✅ | custom 404 + robots (verified live) |
| NFR-1 | M | 🟡 | perf gate green; simulation not Lighthouse |
| NFR-2 | M | ✅ | drill: RTO 3.12 s / RPO 0 (local-rig scope) |
| NFR-3 | M | 🟡 | request-id end-to-end; no sink/uptime/alerts |
| NFR-4 | M | 🟡 | in-process limiter; edge documented untested |
| NFR-5 | L | ✅ | portal in-tree, 194 files (uncommitted caveat) |
| NFR-6 | M | 🟡 | = P0-3 status |
| GOV-1 | H | ✅ | 45/45 reconciled + ADR-009 (doc caveats) |
| GOV-2 | M | ✅ | retraction banners verified |
| GOV-3 | M | ✅ | honest NO-GO/rehearsal records |
| GOV-4 | M | ✅ | D365 naming removed/scoped |
| GOV-5 | L | ✅ | dates aligned (30 Oct 2026 / 1 Jan 2027) |

\* DAT-7 closed against the plan's own acceptance text ("documented, reviewed cleanup script exists; dry-run lists…"), with the recurrence risk registered as F-2026-N11.

---

## 7. New findings register (this re-audit)

See §1.3 table — IDs **F-2026-N01…N17**, severities: 1 Critical, 2 High, 8 Medium, 6 Low. Each carries current `file:line` evidence. The three that gate any "production certified" claim are:

1. **F-2026-N01 (Critical, operational):** fix = spawn `node` directly (`execFile(process.execPath, [npmCliJs, 'run', 'build'])` — resolves `node_modules/npm/bin/npm-cli.js`), or `spawn(npmCmd, […], {shell:true})` with an explicit argv array and the same timeout/env-scrubbing (the sanitization already present is preserved either way). Also mark a spawn-failure job `failed` instead of leaving it queued (move the try/catch inside the callback path or catch around execFile and update status), so one bad job can never jam the queue again. Then drain the 11 queued jobs and rebuild.
2. **F-2026-N02 (High):** call `verifyCsrfToken(session, header)` in the same middleware that currently treats header presence as sufficient; reject on mismatch.
3. **F-2026-N03 (High):** commit the working tree (logical commits per phase), push to a remote, enable branch protection — the P0-1 acceptance remains unmet until CI has actually run on a platform.

---

## 8. Technical debt valuation & recommendation

Remaining work items by severity (this audit's register): 1 Critical + 4 High (N01–N04) + 8 Medium + 6 Low ≈ **16·1 + 8·4 + 3·8 + 0.5·6 = 66 h** (plan's own sizing model, §4 of REMEDIATION_PLAN) → ≈ **USD 8,250** at the $125/h benchmark — comfortably Grade-A territory *for a codebase of this size* **once the three blockers above land**, which are estimated at ≤2 days combined.

**Recommended unblocking order (next 3 working days):**
1. Fix F-2026-N01 (spawn strategy + failed-job marking), drain queue, rebuild, re-run the live control-loop probe (script archived at `evidence/live_probes.mjs` + control-loop script) — restores the platform's core promise.
2. Wire F-2026-N02 (real CSRF verification) and TRN/email masking (SEC-6/F-2026-N04) — both ≤ half-day.
3. Commit + push + protect (F-2026-N03); wire `placeholders`/`perf` gates into ci.yml; fix the stale ssg-outbox test to use env credentials.
4. Then the P4/P3 backlog in impact order: PUB-8 single-source facts, CMS-2 chrome editors, deploy step (CMS-10), media storage hardening (F-2026-N05), ClamAV/DOC key env (N06/N07), and the UAT/pen-test evidence for P10.

**Statement of limitation:** this re-audit ran on the dev rig (Windows, Node 24.21.0, PG 16.9 portable) with the portal in `NODE_ENV=development`. Production-mode behaviours (e.g. `__Host-` cookie emission, MFA enforcement) were verified by code inspection where they could not be exercised live. The DB contains test fixtures by design (DAT-7); production cutover must use a fresh seed per the plan.

---

## 9. Evidence index (audit_report_2/)

| Artifact | Content |
|---|---|
| `evidence/ci_gates_full_run_2026-10-15.log` | All 7 CI gates — full output, 7/7 PASS (fresh) |
| `evidence/cms_control_loop_and_spawn_einval.txt` | CMS control-loop test ×final + `spawn EINVAL` repro + Node version |
| `evidence/live_probes.mjs` | Re-runnable live probe suite (RBAC, SLA, RFQ, contact, masking, outbox) |
| `evidence/iteration2_live_proofs.mjs` + `iteration2_fixups.mjs` + `iteration2_live_proofs_output.txt` | Iteration-2 deeper proofs: CSRF bypass (live), partner RBAC ×16 routes via public registration, rollback scope/undoability, reset-token redaction at write time, announcement restoration |
| `evidence/visual_site_home_2026-10-15.png` | Public site home (browser capture) |
| `evidence/visual_cms_publish_pipeline_2026-10-15.png` | CMS publish-pipeline console showing honest counters (Pending 11 / Failed 1) |
| `FINDINGS_MATRIX.csv` | Machine-readable 77-finding verdict matrix + 17 new findings |
| This file | Full report |

*Every verdict in this report is reproducible from the live rig using the archived scripts. Zero-trust was maintained throughout: no board status, comment, or prior report was accepted as evidence of closure.*
