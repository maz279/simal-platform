# Simal Corporate Platform — Comprehensive Remediation Implementation Plan

**Companion to:** `INDEPENDENT_FORENSIC_AUDIT_AND_VALIDATION.md` (this folder) and `REMEDIATION_RESEARCH_NOTES.md` (external standards, verified 2026-10-12).
**Prepared:** 2026-10-12. **Author:** Independent review, AI-assisted (Claude Code).
**Objective:** Close **100%** of the findings, gaps, errors and discrepancies the audit identified — sequentially, phase by phase, each task anchored to the evidence (`file:line` / probe / SQL / standard) and each with a verifiable acceptance test.

> **How to read this plan.** Every task states: the **finding(s)** it closes (IDs from §2), **what to change** (with the exact `file:line` the audit verified), **how** (concrete design, grounded in the standards research), and **done-when** (an acceptance test a reviewer can re-run). Effort is sized **S** (≤1 day), **M** (2–4 days), **L** (1–2 weeks) for one engineer; these are indicative, not commitments. Owners are given by **role**, not name.

---

## 1. Governing principles (apply to every phase)

1. **Evidence in, evidence out.** No task is "done" until its acceptance test passes and the result is captured (log, screenshot, SQL, or a green CI job). Re-run the audit probes in `evidence/probes/` as the regression suite.
2. **Deny by default; test authorization on every request.** (OWASP Authorization Cheat Sheet.) Every new or changed endpoint ships with a role-matrix test.
3. **Fix the root cause, not the symptom.** Where one defect has many surface effects (e.g. SEC/DAT-3 snake_case), fix the single cause and add the test that would have caught it.
4. **One standards baseline.** Target **WCAG 2.2 AA**, **OWASP ASVS 5.0.0 (L2)**, **NIST SP 800-63B-4**, **UAE PDPL (45/2021)**, **PINT AE Billing 1.0.4 / Peppol**. Pin these in `ARCHITECTURE_STATE.md` so later work doesn't drift.
5. **No regression to green.** The CI suite is extended first (Phase 0) so that each subsequent fix is guarded. A fix that cannot be tested gets a documented manual check in the UAT script.
6. **Production ≠ dev rig.** Every "works on my machine" assumption (hardcoded `F:/…` paths, `trust` auth, superuser app role, seeded dev accounts, `NODE_ENV` unset) is treated as a defect, not a convenience.
7. **Nothing is "production certified" until Phase 10's go/no-go gate passes** with no open Critical/High.

---

## 2. Master findings register (what must be closed)

IDs are grouped by area. "F-n" cross-references the headline findings in the audit report. Severity: **C**ritical / **H**igh / **M**edium / **L**ow. Every ID is closed by a task in §4 (traceability matrix in §5).

### Security & RBAC (SEC)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| SEC-1 (F-1) | C | Known-password super-admins seeded every boot, no `NODE_ENV` guard; printed on login/CMS pages | `auth.service.js:40-59`; `login.html:129-135`; `cms.html:56-57` |
| SEC-2 (F-2) | C | MFA bypass `123456` whenever `NODE_ENV≠production`; `.env` sets no `NODE_ENV` | `auth.service.js:86-89`; `config.js:37` |
| SEC-3 (F-3) | C | `adminAuth=[requireAuth]` — no role gate; partner reads all KYC/invoices/analytics/integrations | `routes.js:359,362,373,405,505,674`; `authz_matrix.json` |
| SEC-4 (F-12) | H | Password-reset token readable in `/api/cms/outbox`; account takeover demonstrated | `routes.js:187`; `cms.service.js:306-312`; `probes/workflow_e2e.mjs` |
| SEC-5 | H | KYC document download (`/api/admin/documents/:id`) has no role/PII gate | `routes.js:448` |
| SEC-6 | H | Report builder returns unmasked IBAN/TRN/email, no mask + no role gate (currently also 500 via DAT-3) | `admin.service.js:189-254` (fields 176-178; no mask 247-250) |
| SEC-7 | M | CSRF rests on `SameSite=Strict` alone; `readJsonBody` accepts `text/plain`; 26 MB bodies | `routes.js:755-760`; `http.js:32-49` |
| SEC-8 | M | Login not `limited()`-wrapped; brute-force guard uses a shared mutable `ipOfReq`; `X-Forwarded-For` trusted | `routes.js:18,29-33,143` |
| SEC-9 | M | Integration adapters are stubs presented as real (email marked `sent` with no SMTP; Peppol "delivered" with no transmission) | `notify.service.js:70-77`; `einvoice.service.js:243-257`; `integration.service.js:5-6,39-44` |
| SEC-10 | M | SSG build: shell `exec`, no timeout, hardcoded `F:/…` path, passes full env to child | `server.js:130-157` |
| SEC-11 | M | Reviewer can rewrite public legal/marketing content & publish; `emergencyPublish` dual-approval not routed | `routes.js:543`; `cms.service.js:197-203` |
| SEC-12 | L | Static server has no dotfile deny; raw DB error text returned on 500; `.env` ships dev password & `ADMIN_TOTP_SECRET` == the `mfa.demo` secret; `ADMIN_PASSWORD_MIN=4` | `http.js:86-108`; `server.js:93`; `.env`; `auth.service.js:45` |
| SEC-13 | M | No CSP on the public site; stored `cta_href`/announcement/`it_solution.cats` flow to `innerHTML`/`set:html`; `esc()` omits `'` | site `index.astro:1309`, `solutions/[id].astro:31`; `cms.js esc()` |
| SEC-14 | M | Invoice `reopen` allowed from `delivered` → DB trigger raises a 500 (PG) / silently mutable (JSON) | `einvoice.service.js:114`; migration `007` |

### Data integrity & provisioning (DAT)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| DAT-1 (F-4) | H | Clean `migrate.sql`+`seed.sql`+build FAILS: `announcements.cta_label` missing; `category_slug` drift; announcements/testimonials/featured/careers not seeded | `migrate.sql:128-132`; `build_fresh.log`; `ar/index.astro:123` |
| DAT-2 (F-8) | H | Audit attribution broken: CMS writes actor `system`; KYC review actor `{}`/`[object Promise]`; `{}` shown to the customer | `cms.service.js:46`; `auth.service.js:140`; `review.service.js:146-150`; `flow_status_result.png` |
| DAT-3 (F-11) | H | snake_case leak: `submissions.all()` returns raw rows; SLA age `null`, breach never fires, reports+CSV 500 | `pg-repos.js:282` vs `:118,175`; `review.service.js:24-48`; `snake_bug.mjs` |
| DAT-4 | H | `content_blocks` rollback unscoped (`WHERE entity_id=$4` only) → overwrites 21 shared records | `cms.service.js:151`; DB shared-id query |
| DAT-5 | M | Rollback restores newest-only, saves no undo snapshot, `products` branch is a silent no-op reported as success | `cms.service.js:144-175` |
| DAT-6 | M | Sequence-sync tool interpolates identifiers; drift recurs ("happened 3 times" per LEARNINGS) | `sync-sequences.mjs:21-23` |
| DAT-7 | M | Test-fixture pollution in the "production" DB (future dates, `dup1@`, `journey@`, `{}` actors, `1672`/"Enterprise Hardened" products) | `audit_log` actor `{}`×9; products `1672` |
| DAT-8 | L | Unused schema: `category_guides`, `hero_slides.bg`, `product_deep.box/docs`, `testimonials.company`, `announcements.starts_at/ends_at`; `brands.counts` drifted (Honeywell 13 vs 12) | migrate.sql; `brands/index.astro:56` |
| DAT-9 | M | DB app role `simal` is superuser; `pg_hba.conf` is `trust` (dev rig) | `pg_roles`; `pg_hba.conf` |

### CMS console (CMS)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| CMS-1 (F-13) | M | 35/48 command-bar buttons inert (incl. Trigger Build & Purge, Provision Staff User) | `cms.js:640`; `cms_buttons.json` |
| CMS-2 (F-5) | H | CMS controls ~45% of the site; no editor for header/nav/footer/newsletter/brands/categories/specs/images/`/ar`/SEO/stats/awards | §6 of report; `BaseLayout.astro` |
| CMS-3 | M | AMC view edits `amc/tiers`; the site reads `site/amc-tiers` (decoy block) | `cms.js:1864` vs `solutions/index.astro:35` |
| CMS-4 | M | Product `stock` stored as string `"false"` → site truthiness keeps "In stock" | `cms.service.js:233`; `products/[slug].astro:85` |
| CMS-5 | M | 10 frontend↔backend contract mismatches (announcement history shape; reset password field name; sessions fields + Force Logout 404; policies body not selected; rollback `{}`; products rollback no-op; GET-missing-block null crash; publish purge cosmetic; slide save wipes `bg`) | CMS agent §2 #1-10; `cms.service.js:107`; `admin.service.js:68` |
| CMS-6 | M | `site/*` blocks stored as string/array are rejected by the editor (`payload must be an object`) → un-editable (`mission`, `vision`) | `cms.service.js:43`; `cms_e2e.json` |
| CMS-7 | M | Quick Create writes entity `custom` (never read); "New Article" writes no `body` → SSG build crash | `cms.js:2832`; `insights/[slug].astro:71` |
| CMS-8 | L | Notification bell / settings gear / profile chip / Ctrl+S are dead; `#/loc-audit` hardcodes 100%; RBAC matrix static & wrong | `cms.js:416,455`; `cms.html:115,120`; `cms.js:2509-2524,2666` |
| CMS-9 | M | No media upload/delete (media view is a read-only directory listing) | `cms.service.js:246-303` |
| CMS-10 (F-9) | M | Publish dashboard counters misleading: "Pending" counts `pending` (never written); "all published" after a failed build; CDN "purge" cosmetic; no deploy step | `cms.js:2350`; `server.js:148`; `portal-staging.conf:3-4` |

### Public site (PUB)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| PUB-1 (F-6) | H | Forms report success when the backend is unreachable (careers HTTP 501→"received ✓"; digest "Subscribed ✓" with no call); static host has no `/api` | `careers/index.astro:181`; `fake_careers_consented.png`; `insights/index.astro:139-162` |
| PUB-2 (F-6) | H | Site uses relative `/api/*`; only vhost is `kyc.simalme.com`; no `/api` route for `simalme.com` | `astro.config.mjs:13-17`; `portal-staging.conf`; `site_8100.log` |
| PUB-3 (F-7) | H | ~40 broken links: 5× `/solutions/undefined/`; 7× `/legal/*`; sitemap `/solutions/cloud|storage`; compare P3 slugs; careers wrong block | `crawl.json`; `solutions/index.astro:66`; `legal/index.astro:47` |
| PUB-4 | M | Home RFQ widget shows a fabricated 125-item basket on empty/failed basket | `index.astro:1449-1455` |
| PUB-5 | M | `/ar` reads nonexistent column `category_slug`; reads wrong basket key `data.items`; 5 hardcoded English slugs; all-hardcoded Arabic; links to EN pages | `ar/index.astro:123,172,6-12` |
| PUB-6 | M | RFQ slug regex rejects 3 catalogue slugs containing `_` (incl. a home-featured product) | `rfq.service.js:44` |
| PUB-7 (F-10) | M | Internal/placeholder strings published: "publish at launch per PRD FR-3.3…", "Mock auth · MFA noted", "Until formally reconciled…", "Arabic product copy arrives…" | dist greps; `about/index.astro:148`; `sitemap/index.astro:84` |
| PUB-8 | M | Inconsistent published facts: brand count 21/22/23 on one page; 24yr vs 20+; 78 vs 81 SKUs; two WhatsApp numbers on one button; awards disagree ×3; leadership 3 (DB) vs 4 (fallback, different names) | site agent §6 |
| PUB-9 | M | `/onboarding` is a hardcoded mock: posts only a summary to `/api/contact`, client-random `KYC-2026-###` ref, "Confirmation sent" regardless; the real wizard (`form.html`) is never linked | `onboarding/index.astro:355-394` |
| PUB-10 | L | `sessionStorage` holds PII (IBAN/TRN) plaintext (contradicts "zero client storage"); `simal_recent` cookie written, never read ("recently viewed" dead) | `onboarding/index.astro:183,256`; `products/[slug].astro:348` |
| PUB-11 | L | ROI calculator default total ($79,440) ≠ its own breakdown ($94,800); `r-ind`/`r-size` inputs ignored | `software/index.astro:238-305` |
| PUB-12 | M | Catalogue category deep-links (`/products#memory` etc.) and `#cat-*`, `#amc-table`, `#solutions` anchors don't exist / don't filter server-side | `crawl.json` fragments |

### Apps & workflows (APP)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| APP-1 (F-11) | H | Staff SLA engine dead (age null, no breach, no escalation) — the one thing RC-02/R-05 require | `review.service.js:48`; `flow_admin_after_login.png` |
| APP-2 | M | e-invoice UBL non-conformant: `customisationID:'urn:simal:invoice:phase1:ae'` (PINT AE requires `urn:peppol:pint:billing-1@ae-1`); endpoint built from 15-digit TRN not 10-digit TIN | `einvoice.service.js:129,133,157`; research notes |
| APP-3 | M | No virus scan on KYC uploads (magic-byte check only); files stored as plain bytes (no AES-256, no signed URLs ≤15 min) | `kyc.service.js:43-70`; `pg-repos.js:200-218` |
| APP-4 | M | Careers form has no CV upload field (FRS J-04); fakes success | `careers/index.astro`; PUB-1 |
| APP-5 | M | Public signup / single partner account (FRS A-01/08) not built (CRTM GAP-A1) | requirements extract |
| APP-6 | L | Invoice/partner dates render as raw ISO; staff invoice rows show blank buyer/TRN + "nulld" age | `flow_einv_staff.png` (shares DAT-3 root) |
| APP-7 | M | KYC wizard UI not verified end-to-end (autosave re-render defeated automated fill); in-wizard validation messaging unverified | report §3 limitation |

### Accessibility (A11Y) — target WCAG 2.2 AA
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| A11Y-1 | H | Home has 0 server-side `<h1>` (5 injected by JS post-hydration) | `browse_all.json`; dist grep |
| A11Y-2 | H | Closed modals keep focus (`opacity:0;pointer-events:none`, `role=dialog` always on); focus enters hidden modal 41/120 Tab presses; `trapFocus` defective | `d365-cms.css:1194-1211`; `tab_probe.cjs`; `cms.js:477-507` |
| A11Y-3 | M | No skip link on any page (0/218) | dist grep |
| A11Y-4 | M | Heading-level jumps on ~194 pages (h1→h4 catalogue; h3→h5 footer; h2-before-h1 onboarding) | `browse_all.json` |
| A11Y-5 | M | Measured contrast failures on every sampled page (gold labels 3.71–3.95:1, muted 2.56:1, green 3.95–4.36:1) | `contrast_scan.cjs` |
| A11Y-6 | M | 35 tap targets < 24×24 px (WCAG 2.2 SC 2.5.8 AA) | `mobile_nav.cjs` |
| A11Y-7 | M | Duplicate `id="q"` (page search inert); sort chips are non-focusable `<span>`; careers inputs lack `<label for>`; hero/testimonials auto-rotate with no pause (SC 2.2.2) | site agent §7 |
| A11Y-8 | L | CMS: unlabelled inputs, unnamed close buttons, toolbar without arrow-keys, toasts without `aria-live`, counter chips as focusable buttons | CMS agent §7 |

### SEO, localization & consent (SEO)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| SEO-1 | H | 0/218 pages have canonical / Open Graph / hreflang / JSON-LD | dist greps |
| SEO-2 | M | Sitemap missing brands/resources/compare/onboarding/ar/sitemap; `lastmod`=build date for all; no `lang` alternates | `sitemap.xml`; `sitemap.xml.js` |
| SEO-3 | M | Trailing-slash churn (links mix `/x` and `/x/`; 167 redirects in crawl) with no canonical to disambiguate | `crawl.json` |
| SEO-4 | H | `/ar` is one standalone hardcoded page, not a localized twin; 0 Arabic `content_blocks`; language switch is one-way | PUB-5; DB |
| SEO-5 | M | No cookie-consent banner; no consent-gated analytics; GA4 strings present but no `gtag`/`dataLayer`/`analytics/track` wired | dist greps; PDPL research |
| SEO-6 | L | `/search/` not disallowed in robots; home `<h1>` client-only hurts indexing | `robots.txt`; A11Y-1 |

### Non-functional (NFR)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| NFR-1 | M | No performance budget enforcement (PRD: LCP ≤2.5s, Lighthouse ≥85); not measured | PRD NFR-1 |
| NFR-2 | M | No backup/restore drill proven on real infra; RPO/RTO unverified; DR docs are templates | Project_doc |
| NFR-3 | M | Observability: no uptime/error monitoring wired; request-id exists but no sink; 500s leak internals | `server.js:93,89` |
| NFR-4 | M | Rate-limit buckets per-process/in-memory, reset on restart, multiply across replicas; edge zone only in nginx | `security.js:93`; SEC-8 |
| NFR-5 | L | Portal lives in an NTFS junction outside the repo tree (packaging/backup risk) | `apps/portal` junction |
| NFR-6 | M | CI proves nothing about authz, the public site, PG-mode reporting, or a clean-DB build | `.github/workflows/ci.yml` |

### Governance & requirements (GOV)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| GOV-1 | H | Requirement docs contradict each other (brand count, SKU count, RFQ/KYC ref formats, KYC steps/tracks, MFA, sessions, WCAG version, uptime, e-invoicing phase, stack) and the as-built stack | requirements extract §(a) |
| GOV-2 | M | Prior "Antigravity" audit over-claims (100% PASS); PG version wrong; counters misleading — must be superseded, not relied on | audit report §2 |
| GOV-3 | M | Go-live/hypercare/Peppol-exchange documents are future-dated templates with blank signatures; none evidences an actual go-live | requirements extract §(b) |
| GOV-4 | M | "Dynamics 365 / Content Studio" naming implies an integration that does not exist | code grep |
| GOV-5 | L | Peppol timeline in content: ASP by **30 Oct 2026** (extended), go-live **1 Jan 2027** — align any 31 Jul 2026 references | research notes |

---

## 3. Phase overview & sequencing

```
P0  Mobilize & build the safety net ........ prerequisites for everything
P1  Stop the bleeding (security P0) ......... SEC-1,2,3,4,5,6,12  [DEPLOY BLOCKERS]
P2  Provisioning & data integrity ........... DAT-1..9, SEC-14
P3  Public-site correctness ................. PUB-1..12, SEC-13(site), PUB links
P4  CMS completeness & correctness .......... CMS-1..10, DAT-4/5 UI
P5  Apps & workflow completeness ............ APP-1..7, SEC-9/11, e-invoicing PINT AE
P6  Accessibility (WCAG 2.2 AA) ............. A11Y-1..8
P7  SEO, localization, consent/analytics .... SEO-1..6, PDPL consent
P8  Security & NFR hardening ................ SEC-7,8,10; NFR-1..6
P9  Requirements reconciliation & governance  GOV-1..5
P10 Independent re-verification & go/no-go ... all — prove closure
```

**Dependency rules.** P0 precedes all. P1 precedes any external exposure. P2 precedes P3/P4 (a clean DB and correct attribution underpin both). P5 depends on DAT-3 (P2) for the SLA engine. P6/P7 can run in parallel with P4/P5 once P3 lands the shared layout fixes. P10 is the gate. Security (P1) and provisioning (P2) are hard blockers; everything else can be parallelized across two or three engineers after P2.

---

## 4. The plan, phase by phase

### Phase 0 — Mobilize & build the safety net  *(prereq; ~1 week)*

**Goal:** make every later fix testable and reversible, and freeze the standards baseline.

- **P0-1 — Put the code under version control & branch protection.** *(Owner: Eng Lead · S)*
  The portal is an un-versioned NTFS junction (`apps/portal` → `F:\…\portal`, NFR-5) and the audit found no git repo. Initialize git (or confirm the real remote), commit the current tree as the baseline, and require green CI + review to merge. **Done-when:** `git log` shows the baseline commit; a protected `main`; CI runs on PRs.
- **P0-2 — Stand up a reproducible dev/staging environment.** *(Owner: DevOps · M)*
  A one-command bring-up: Postgres (migrate+seed), portal, Astro build, static host **with an `/api` reverse proxy** (the topology PUB-2 needs). Base it on `docker-compose.dev.yml` + a local nginx mirroring `portal-staging.conf`. **Done-when:** a fresh checkout reaches a working site+portal+DB locally and in a staging VM.
- **P0-3 — Extend CI into a real gate (NFR-6).** *(Owner: DevOps · M)* Add jobs:
  (a) **clean-DB build** — `migrate.sql`+`seed.sql` on an empty database, then `astro build`, fail on any missing column (guards DAT-1);
  (b) **authz matrix** — run `evidence/probes/authz_matrix.mjs`-style checks; assert anonymous/partner/viewer get 401/403 on every `/api/admin/*`, `/api/einvoice/admin/*`, `/api/integrations/*` (guards SEC-3);
  (c) **PG-mode reporting** — assert `/api/admin/export.csv` and `/api/admin/reports/build` return 200 and a non-null SLA age (guards DAT-3);
  (d) **link-crawl** — run the crawler against the built `dist`, fail on any internal 404 or `undefined` URL (guards PUB-3);
  (e) **a11y** — `@axe-core/playwright` with tags `wcag2a,wcag2aa,wcag21a,wcag21aa` against key pages, fail on violations (guards P6);
  (f) keep the existing lint/secret-scan/unit/integration/build/parity jobs.
  **Done-when:** all six jobs run on PRs and currently **fail** on the known defects (proving they bite), then are driven green by later phases.
- **P0-4 — Adopt the standards baseline.** *(Owner: Eng Lead · S)* Record in `ARCHITECTURE_STATE.md`: WCAG 2.2 AA, OWASP ASVS 5.0.0 L2, NIST SP 800-63B-4, UAE PDPL 45/2021, PINT AE 1.0.4. **Done-when:** the file names each with a version and the acceptance owner.
- **P0-5 — Triage board.** *(Owner: PM · S)* Load every ID from §2 into the tracker with severity, phase and acceptance test. **Done-when:** 1 ticket per finding, each linked to a task here.

### Phase 1 — Stop the bleeding: security P0  *(deploy blockers; ~1 week)*

> No build may be exposed beyond localhost until Phase 1 is complete and re-verified.

- **P1-1 — Remove shipped credentials & the MFA bypass (SEC-1, SEC-2, SEC-12).** *(Owner: Security Eng · M)*
  Delete the `devAccounts` seeding block (`auth.service.js:40-59`) or gate it behind `SEED_DEV_ACCOUNTS==='true'` **defaulting off** and hard-refused when `NODE_ENV==='production'`. Delete the `123456` bypass (`auth.service.js:86-89`). Remove credential hints from `login.html:129-135` and `cms.html:56-57`. In `.env`/config, set `NODE_ENV` explicitly per environment, raise `ADMIN_PASSWORD_MIN` to **15** (single-factor) or **8** for MFA-backed staff (NIST 800-63B-4), rotate `ADMIN_TOTP_SECRET` so it differs from any seed, and remove the dev DB password from any committed file. **Done-when:** a production-mode boot creates only the env-configured admin; `admin@simalme.com/admin123` and `123456` both fail; no password literal appears in `grep -rIE "admin123|123456|demo123" public/ src/`; the login page shows no credentials.
- **P1-2 — Enforce RBAC on every privileged route (SEC-3).** *(Owner: Security Eng · M)*
  `adminAuth` (`routes.js:359`) must carry a role gate. Introduce a `requireStaff` guard (`super_admin`/`reviewer`/`viewer` as appropriate) and add explicit `requirePerm(...)` to every route that currently relies on `adminAuth` alone: `/api/admin/submissions*`, `/api/admin/analytics`, `/api/admin/reports*`, `/api/admin/documents/:id` (SEC-5 — gate behind `view_pii`), `/api/einvoice/admin/*`, `/api/integrations/*`. Deny by default (OWASP Authorization Cheat Sheet). The `partner` role must reach **none** of these. **Done-when:** the P0-3(b) authz matrix is green — partner/viewer/anonymous get 401/403 on every admin/einvoice-admin/integration route; reviewer gets only what `rules.js` grants.
- **P1-3 — Stop leaking reset tokens; close the takeover chain (SEC-4).** *(Owner: Security Eng · M)*
  Do not store the raw reset/verify token in the outbox body (`routes.js:187,301-307`); store a non-reversible reference or a redacted link, and deliver the real link only via the mail transport. Restrict `/api/cms/outbox` and `/api/admin/outbox` body visibility to `view_pii`, and redact token-bearing bodies (OWASP Logging Cheat Sheet: never log tokens). **Done-when:** `probes/workflow_e2e.mjs` AUTH block can no longer recover a usable token from any API; a reviewer cannot reset another account.
- **P1-4 — Mask/gate PII in the report builder (SEC-6).** *(Owner: Security Eng · S, after DAT-3)*
  Apply the same masking the CSV export uses (IBAN masked unless `view_pii`) in `admin.service.js:189-254`, and gate the route by role. (The current 500 from DAT-3 is fixed in P2; this ensures that when it returns rows, they are masked and authorized.) **Done-when:** a reviewer's report shows masked IBAN/TRN; only `view_pii` sees full values; non-staff get 403.
- **P1-5 — Re-verify Phase 1 independently.** *(Owner: QA · S)* Re-run the authz matrix, the takeover probe, and the credential grep; capture the evidence. **Done-when:** zero open Critical.

### Phase 2 — Provisioning & data integrity  *(~1.5 weeks)*

**Goal:** a clean database builds the audited site, every write is attributable, and operator features compute correctly.

- **P2-1 — Make from-scratch provisioning work (DAT-1).** *(Owner: Backend Eng · M)*
  Add `cta_label TEXT NOT NULL DEFAULT '…'` to the `announcements` DDL (`migrate.sql:128-132`); remove/alias the `category_slug` reference (`ar/index.astro:123`) so the schema and the queries agree; move the out-of-band seeds (`announcements` row, real testimonial quotes, `site/featured-products`, `site/careers-roles`) from `tools/seed_cms_blocks.mjs`/`update-testimonials.js` into `seed.sql` so they are part of the single source of truth. Reconcile the numbered `migrations/*.sql` mirrors with `migrate.sql`. **Done-when:** the P0-3(a) clean-DB build is green — an empty database migrates, seeds, and builds all 218 pages with the announcement bar, testimonials and featured strip populated from seed, not from a tool run.
- **P2-2 — Fix the snake_case leak at the root (DAT-3, APP-1, APP-6, SEC-6).** *(Owner: Backend Eng · S)*
  In `pg-repos.js:282-288`, map `submissions.all()`/`.get()` through `camelize()` exactly as `users`/`invites`/`rfqs` already do (`pg-repos.js:118,175,405`). Add the regression test from P0-3(c). **Done-when:** the staff queue shows real ages (no "nulld"); `slaBreached` becomes true for a >1.5-bd pending submission; `/api/admin/reports/build`, `/api/admin/export.csv` and the built-in reports return 200; `probes/snake_bug.mjs` reports non-null `ageDays`.
- **P2-3 — Restore audit attribution end to end (DAT-2).** *(Owner: Backend Eng · M)*
  Populate `req.session.user` (email + name) in `requireAuth` (`auth.service.js:140`) so `cms.service.js` writes the real actor instead of `'system'`. In `review.service.js:146-150`, make `actorName` synchronous or `await` it everywhere (`:78,83,114,119,131,142`) and `await repos.users.get(...)` inside it; the KYC `reviewer` field must store a name string, not a Promise. On the customer status page, render a reviewer name or omit the field — never `{}`. Backfill a note that historical `system`/`{}` rows predate the fix. **Done-when:** a new CMS edit and a new KYC review action both record the acting user's email/name; `probes/review_flow.mjs` shows a real actor; `flow_status_result.png` re-captured shows no `{}`.
- **P2-4 — Scope rollback and make it safe (DAT-4, DAT-5).** *(Owner: Backend Eng · M)*
  `content_blocks` rollback must filter `WHERE entity=$ AND entity_id=$ AND lang=$` (`cms.service.js:151`); key `cms_revisions` lookups by the full `(table, entity, entity_id, lang)` tuple. Before applying a rollback, snapshot the current state (so rollback is itself undoable). Implement the `products` branch (currently a no-op reported as success) or make the UI hide rollback where it isn't supported. **Done-when:** rolling back a shared `entity_id` (e.g. `univat`) changes only the intended row (verify against the 21 shared-id set); a rollback can be rolled back; product rollback either works or is absent.
- **P2-5 — Replace the identifier-interpolating sequence tool (DAT-6).** *(Owner: Backend Eng · S)*
  Rewrite `sync-sequences.mjs:21-23` to use `pg_get_serial_sequence()` and `setval(..., (SELECT max(id) ...))` with the sequence resolved safely (no string-built identifiers), or fold sequence resets into `migrate.sql`. Add it to CI so drift is caught, not discovered in production. **Done-when:** inserting after a manual high-id seed never raises a duplicate-key error; the tool has no string-interpolated identifiers.
- **P2-6 — Purge test-fixture pollution from production data (DAT-7).** *(Owner: DBA · M)*
  Define "production-clean": no `@example.com/.invalid/.ae-test` rows, no future-dated audit activity, no `{}` actors, no placeholder products (`1672`, "Enterprise Hardened"). Provide a reversible cleanup migration for the real production cutover (do **not** run against the audit dataset). **Done-when:** a documented, reviewed cleanup script exists; a dry-run lists exactly what it would remove; production go-live uses a freshly seeded DB, not the dev dataset.
- **P2-7 — Prune or wire dead schema (DAT-8).** *(Owner: Backend Eng · S)*
  Decide per column: use it or drop it — `category_guides` (either query it on the catalogue or remove it and the hardcoded guides in P3), `hero_slides.bg`, `product_deep.box/docs`, `testimonials.company` (render it or drop), `announcements.starts_at/ends_at` (wire scheduling in P4 or drop). Rebuild `brands.counts` from a live query (Honeywell 13→12) or compute counts at build time and drop the cached column. **Done-when:** no column is both present and unused; brand counts match the live catalogue everywhere.
- **P2-8 — Production database posture (DAT-9, feeds P8).** *(Owner: DBA · S)*
  Create a non-superuser application role with least privilege; switch `pg_hba.conf` from `trust` to `scram-sha-256` (PostgreSQL docs); set `password_encryption='scram-sha-256'`. **Done-when:** the app connects as a non-superuser over `scram-sha-256` in staging; `trust` appears nowhere in the production config.
- **P2-9 — Fix invoice-reopen immutability (SEC-14).** *(Owner: Backend Eng · S)*
  Reconcile `einvoice.service.js:114` with migration `007`: either disallow `reopen` from `delivered` (return a clean 409, not a trigger-driven 500) or implement a proper credit-note/correction path. Ensure JSON mode enforces the same immutability. **Done-when:** reopening a delivered invoice returns a documented 409 (not a 500); JSON and PG behave identically.

### Phase 3 — Public-site correctness  *(~1.5 weeks)*

**Goal:** every link resolves, every form tells the truth, and no page ships placeholder or contradictory content.

- **P3-1 — Ship the production `/api` topology (PUB-2, PUB-1).** *(Owner: DevOps + Frontend · M)*
  Decide and implement how the SSG site reaches the portal: a reverse-proxy `location /api/ → portal:8090` on the `simalme.com` vhost (mirrors the dev Vite proxy in `astro.config.mjs:13-17`), or absolute portal-origin URLs + CORS. Update `portal-staging.conf` (currently only `kyc.simalme.com`). **Done-when:** on staging, `GET/POST /api/rfq-basket`, `/api/rfq`, `/api/contact` succeed from the public origin; the basket cookie (`Path=/api`, SameSite) round-trips.
- **P3-2 — Forms must never fake success (PUB-1, PUB-9, APP-4).** *(Owner: Frontend · M)*
  In every public form handler, show success **only** on a 2xx and an error otherwise: careers (`careers/index.astro:181-188`), the newsletter (`BaseLayout.astro:517`), the insights digest + line-card (`insights/index.astro:139-162` — these make no call at all; wire them or remove them), the software demo, and the `/onboarding` mock (`onboarding/index.astro:355-394`). For `/onboarding`, either send the full KYC payload to the real engine or route users to `form.html` and stop issuing client-random references. **Done-when:** with the backend down, every form shows an error; with it up, each submission is visible in the DB/outbox; `probes/fake_success.cjs` shows no success-on-failure.
- **P3-3 — Fix all broken links (PUB-3).** *(Owner: Frontend · M)*
  `site/solutions5` payload needs `targetId` (the site renders `/solutions/${s.targetId}/` → `undefined` ×5; `solutions/index.astro:66`); correct the 7 `/legal/*` hub slugs to the DB slugs (`legal/index.astro:47`); fix the sitemap page's `/solutions/cloud|storage` (→ `cloud-security|data-recovery`) and the compare P3 slugs; point `/careers` at the block the seed actually provides (ties to DAT-1). Add the P0-3(d) crawl gate. **Done-when:** the crawler reports **0** internal 404s and **0** `undefined` URLs across `dist`.
- **P3-4 — Remove fabricated/stubbed UI (PUB-4, PUB-10, PUB-11).** *(Owner: Frontend · S–M)*
  Replace the fabricated 125-item home RFQ basket (`index.astro:1449-1455`) with the real (possibly empty) basket. Stop storing PII in `sessionStorage` (`onboarding/index.astro:183,256`) — keep drafts server-side via the real draft API, matching the "zero client storage" claim. Either wire "recently viewed" (read `simal_recent`, `products/[slug].astro:348`) or remove it. Fix the ROI calculator so its total equals its breakdown and its inputs are honoured (`software/index.astro:238-305`), or remove it. **Done-when:** the home widget reflects the real basket; no IBAN/TRN in client storage; ROI total == sum of lines and reacts to inputs.
- **P3-5 — Fix `/ar` data bugs (PUB-5; full localization is SEO-4/P7).** *(Owner: Frontend · S)*
  Remove the `category_slug` read (`ar/index.astro:123`), read the correct basket key (`j.basket`, not `data.items`, `:172`). This is the minimum correctness fix; the structural localization rebuild is P7. **Done-when:** `/ar` renders without referencing a non-existent column and its basket widget shows real items.
- **P3-6 — Accept all catalogue slugs in RFQ (PUB-6).** *(Owner: Backend · S)*
  Widen the slug regex (`rfq.service.js:44`) to allow `_` (and any character the catalogue actually uses), or normalize slugs at ingest. **Done-when:** "Add to RFQ" succeeds for the 3 underscore slugs (incl. the home-featured ARKTEK product).
- **P3-7 — Remove internal/placeholder strings from public output (PUB-7).** *(Owner: Frontend + Content · S)*
  Strip "publish at launch per PRD FR-3.3…" (`about/index.astro:148`), "Mock auth · MFA noted" (`sitemap/index.astro:84`), "Until formally reconciled by management" (`contact`), "Arabic product copy arrives with the CMS content team" (PDP), and any other `§xx`/`FRS-`/`PRD-` content-package notes. Add a CI grep that fails the build if such markers appear in `dist`. **Done-when:** the grep finds none of these strings in `dist`.
- **P3-8 — Reconcile contradictory published facts (PUB-8).** *(Owner: Content + Frontend · M)*
  One source of truth per fact: brand count, years-in-business, SKU count, WhatsApp number, awards, leadership. Drive them from DB/CMS (`site/counters`, `brands`, a new `site/awards`, `testimonials`/leadership blocks) and delete the hardcoded duplicates and stale fallbacks (e.g. the 4-person leadership fallback with different names). Fix the second WhatsApp number on the RFQ button. **Done-when:** a single grep for each fact returns one consistent value across `dist`.
- **P3-9 — Honour catalogue deep-links & anchors (PUB-12).** *(Owner: Frontend · S)*
  Make `/products#memory` etc. actually filter server-side (or change them to query params the catalogue reads), and add the missing `#cat-*`, `#amc-table`, `#solutions` anchor targets or repoint the links. **Done-when:** each in-site anchor resolves to an element that exists and the intended filter applies.

### Phase 4 — CMS completeness & correctness  *(~2 weeks)*

**Goal:** the CMS controls what the site actually renders, every control works, and edits attribute correctly (DAT-2 done in P2).

- **P4-1 — Wire every command-bar button, or remove it (CMS-1).** *(Owner: Frontend · M)*
  Give each button config an `id` (or bind by index) so the handler attaches (`cms.js:640`); implement the real action for Trigger Build & Purge, Provision Staff User, Add New Slide, Export Catalog CSV, the per-view Refresh buttons, Push Live and View Public Site. Move the informational counter "chips" out of `<button>` (A11Y-8). Add the P0-3-style smoke test that clicks every command-bar control and asserts an effect (this is `probes/cms_buttons.cjs`). **Done-when:** `cms_buttons.cjs` reports **0** inert action buttons.
- **P4-2 — Make the CMS edit what the site reads (CMS-3, CMS-4, CMS-6).** *(Owner: Full-stack · M)*
  Point the AMC view at `site/amc-tiers` and retire the `amc/tiers` decoy (`cms.js:1864`). Make `stock` a real boolean end to end — store boolean, render "Out of stock" when false (`cms.service.js:233`; `products/[slug].astro:85`). Allow the editor to save the `site/*` blocks whose payload is a string or array (`mission`, `vision`, arrays) — relax the "payload must be an object" check (`cms.service.js:43`) to accept the shapes the site uses, or migrate those blocks to objects. **Done-when:** `probes/cms_e2e.mjs` shows AMC, mission/vision, and stock=false all reaching the public page; "Out of stock" renders.
- **P4-3 — Fix the 10 frontend↔backend contract mismatches (CMS-5).** *(Owner: Full-stack · M)* One PR per cluster:
  announcement history (unwrap `{revisions}` — `cms.js:3033` vs `routes.js:607`); reset-password field name (`temporaryPassword` — `cms.js:2587` vs `admin.service.js:68`); sessions view fields + Force Logout id (`cms.js:2698` vs `admin.service.js:88-102`); policies body (select `body` in `listPolicies` — `cms.service.js:107` — so the editor loads it); GET-missing-block null guard (`cms.js:1610`); slide save must send `bg` so it isn't wiped (`cms.js:1336`); products rollback (DAT-5); publish purge checkbox actually read or removed (`cms.html:628`). **Done-when:** each control round-trips correctly; policy bodies load and save; Force Logout succeeds; a slide save preserves `bg`.
- **P4-4 — Build editors for the content that has none (CMS-2, CMS-9).** *(Owner: Full-stack · L)*
  Prioritized by public impact: **brands** (table CRUD + logo upload), **product media/specs/`product_deep`** (image upload + spec editor + create/delete products), **navigation/menus + footer** (structured blocks the layout reads instead of hardcoding), **SEO metadata** per page (title/description/OG/canonical — consumed in P7), **stats/counters & awards** (`site/counters`, `site/awards`), **header contact/hours** (already in `site/offices` — have the layout read it everywhere, DAT/PUB-8). Add a real **media library** with upload/delete (replace the read-only listing, `cms.service.js:246-303`), storing outside the webroot. **Done-when:** a non-technical editor can change each of these from the CMS and see it on the next publish — verified by extending `cms_e2e.mjs` with one case per new editor.
- **P4-5 — Fix Quick Create & emergency publish (CMS-7, SEC-11).** *(Owner: Full-stack · S)*
  Quick Create must write entities the site actually reads (not `custom`) and must include required fields (a "New Article" needs a `body` or the SSG build crashes — `insights/[slug].astro:71`). Route `emergencyPublish` behind the dual-approval it documents, and fix its `entityId`/`entity_id` mismatch (`cms.service.js:185,192`). Introduce a draft→review→publish state (even minimal) so `notes`-role reviewers can't single-handedly publish legal/pricing/brand-authorization content (SEC-11; FRS-RC-11/F4). **Done-when:** Quick Create output renders on the site; creating an article never breaks the build; publishing sensitive content requires a second approver.
- **P4-6 — Honest publish pipeline & a real deploy step (CMS-10).** *(Owner: DevOps + Full-stack · M)*
  Fix the counters: count `queued` (not the never-written `pending`) for pending dispatch; derive "last publish" from `ssg_build_completed`, not the enqueue event; count slides/policies/products/testimonials/announcements, not just blocks (`cms.js:2350`; `server.js:148`). Make "purge" real or remove the checkbox. Add the missing **deploy**: after a successful build, publish `dist/` to the hosting/CDN target (the nginx note says the CDN serves SSG assets — nothing does that today). **Done-when:** the pipeline tiles reflect real outbox/build state; a publish updates the live site, not just a local folder; a failed build never shows "all published".
- **P4-7 — Replace the dead/fake CMS widgets (CMS-8).** *(Owner: Frontend · S)*
  Implement or remove the notification bell, settings gear, profile chip and Ctrl+S (`cms.js:416,455`; `cms.html:115,120`). Make `#/loc-audit` compute real AR coverage from `content_blocks` (currently hardcoded 100% while 0 Arabic rows exist — `cms.js:2509-2524`). Make the RBAC matrix reflect `rules.js` (currently static and wrong — `cms.js:2666`). **Done-when:** no CMS control is a no-op or shows a fabricated value; loc-audit and the RBAC matrix match reality.

### Phase 5 — Apps & workflow completeness  *(~2 weeks)*

**Goal:** the KYC and e-invoicing apps are complete, conformant and honest; the SLA engine works (root fixed in P2).

- **P5-1 — Verify & harden the KYC wizard UI (APP-7, APP-5).** *(Owner: Full-stack + QA · M)*
  Complete the browser-level pass the audit could not (autosave re-render defeated the automated fill): confirm per-step validation messaging, autosave ≤2 s, resume on the same browser and (signed-in) any device, fix-only-flagged resubmission, and the 7-step progress. Build the public signup / single-account flow (FRS A-01/08, CRTM GAP-A1) or formally defer it with sign-off. **Done-when:** a manual UAT script walks vendor and customer tracks end to end with evidence; autosave/resume verified; the gap is either built or signed off.
- **P5-2 — Add virus scanning & secure document handling (APP-3, SEC-5).** *(Owner: Backend + DevOps · M)*
  Add a ClamAV `clamd` scan (INSTREAM over the socket — see research notes) **before a file counts as uploaded**; quarantine + alert on a hit (FRS IG-07/DV-03). Encrypt documents at rest (AES-256) and serve via signed URLs valid ≤15 min (FRS DV-02). Confirm the download route is authorized (done in P1-2/SEC-5). **Done-when:** an EICAR upload is rejected as a virus (not merely "unrecognised type"); documents are encrypted at rest; a download URL expires; only the owner/assigned reviewer/`view_pii` can fetch a document (probe another user's docId → 403).
- **P5-3 — Make e-invoicing PINT AE-conformant (APP-2, SEC-9, GOV-5).** *(Owner: Backend · M)*
  Set `cbc:CustomizationID` to `urn:peppol:pint:billing-1@ae-1` (self-billing: `…selfbilling-1@ae-1`) — Peppol rule `aligned-ibrp-001-ae` is **fatal** against `urn:simal:invoice:phase1:ae` (`einvoice.service.js:129`). Set a valid `cbc:ProfileID` (confirm the exact AE business-process value against the current PINT AE example set). Build the participant endpoint from the **10-digit TIN** (`0235:` + first 10 digits of the TRN), not the full 15-digit TRN (`einvoice.service.js:133,157`); migrate the 7 stored 15-digit endpoints. Keep real ASP transmission behind the Phase-2 feature flag, and make "Delivered via Peppol" conditional on an actual transmission (SEC-9) rather than a status flip. Align content to the extended timeline (ASP by 30 Oct 2026, go-live 1 Jan 2027, GOV-5). **Done-when:** a generated UBL passes a PINT AE validator (or the published Schematron) for CustomizationID/ProfileID/endpoint; stored endpoints are 10-digit; the UI says "delivered" only after a real send (or clearly says "simulated" while the flag is off).
- **P5-4 — Wire the integrations or label them (SEC-9).** *(Owner: Backend · M)*
  Configure SMTP (`notify.service.js:70-77`) so reset links, KYC decisions and partner provisioning actually send; add the outbox-draining worker the comment in `integration.service.js:5-6` promises, or remove the claim. Until a channel is live, the UI must say "queued/simulated", never "sent". **Done-when:** with SMTP configured, a reset email is delivered and the outbox shows `sent via smtp:…`; with it unconfigured, the UI does not claim delivery.
- **P5-5 — Polish the e-invoice & admin consoles (APP-6).** *(Owner: Frontend · S; after P2-2)*
  Format dates (no raw ISO), and confirm the staff invoice rows show buyer/TRN and real ages once DAT-3 lands. **Done-when:** the staff console shows formatted dates, populated buyer/TRN, and real SLA ages.
- **P5-6 — Careers application completeness (APP-4).** *(Owner: Full-stack · S)*
  Add the CV upload (PDF/DOC/DOCX ≤5 MB, virus-scanned via P5-2), route to HR, and (done in P3-2) stop faking success. **Done-when:** a CV uploads, is scanned, and the applicant sees a truthful result.

### Phase 6 — Accessibility: WCAG 2.2 AA  *(~1.5 weeks; parallelizable with P4/P5/P7)*

**Goal:** the public site and the CMS reach WCAG 2.2 AA, verified by axe-core in CI and a manual keyboard/screen-reader pass.

- **P6-1 — Server-render one `<h1>` per page (A11Y-1, SEO-6).** *(Owner: Frontend · S)*
  The home `<h1>`s are injected by JS post-hydration (0 in server HTML). Emit a single descriptive `<h1>` in the SSR output of every page. **Done-when:** `curl` of each page shows exactly one `<h1>`; axe reports no "page must contain a level-one heading" / multiple-h1 issue.
- **P6-2 — Add a skip link (A11Y-3).** *(Owner: Frontend · S)*
  A visible-on-focus "Skip to main content" linking to `#main`, on every page (it exists in the portal; add to the Astro layout). **Done-when:** Tab from the top reveals the skip link and it moves focus to `<main>` on all 218 pages.
- **P6-3 — Fix heading order (A11Y-4).** *(Owner: Frontend · M)*
  Remove level jumps (catalogue h1→h4, footer h3→h5, onboarding h2-before-h1) across the shared layout and page templates. **Done-when:** axe reports no heading-order violations on the sampled pages.
- **P6-4 — Fix contrast to ≥4.5:1 (A11Y-5).** *(Owner: Design + Frontend · M)*
  Raise the gold section labels, muted notes (`#94A3B8` → a token ≥4.5:1) and the green "In stock" text to meet SC 1.4.3; update `tokens.css` so the fix is systemic, not per-page. **Done-when:** `probes/contrast_scan.cjs` reports **0** failures on the sampled pages; the fix is in tokens, not inline overrides.
- **P6-5 — Enlarge tap targets to ≥24×24 px (A11Y-6).** *(Owner: Frontend · S)*
  Bring the 35 sub-24px targets to ≥24×24 CSS px (WCAG 2.2 SC 2.5.8 AA) or give them sufficient spacing. **Done-when:** `probes/mobile_nav.cjs` reports **0** targets under 24×24.
- **P6-6 — Keyboard & control semantics (A11Y-7).** *(Owner: Frontend · M)*
  Resolve the duplicate `id="q"` so the on-page search works; make the catalogue sort "chips" real buttons (focusable, `aria-pressed`); add `<label for>` to the careers inputs; add a pause/stop control to the hero and testimonial auto-rotation (SC 2.2.2). **Done-when:** the page search works via keyboard; chips are operable and announce state; carousels can be paused; axe clean.
- **P6-7 — CMS accessibility, incl. the modal focus trap (A11Y-2, A11Y-8).** *(Owner: Frontend · M)*
  Replace `opacity:0;pointer-events:none` hiding with the native `<dialog>`/`inert` pattern so closed modals leave the tab order and the accessibility tree (MDN: `inert` is Baseline since 2023); fix `trapFocus` to recompute focusables and restore focus on close; label CMS inputs and modal close buttons; add `aria-live` to toasts; move counter chips out of `<button>`. **Done-when:** `probes/tab_probe.cjs` reports focus never enters a closed modal; axe on `cms.html` reports no serious/critical violations.
- **P6-8 — axe in CI + a manual AT pass (P0-3e).** *(Owner: QA · M)*
  Keep the axe gate green; run an NVDA (EN) and a VoiceOver/AR screen-reader walkthrough of the core journeys (home, catalogue, PDP, RFQ, KYC wizard) and log the results (URD ACC / PRD NFR-6 require AT walkthroughs in EN and AR). **Done-when:** axe green in CI; the AT walkthrough log shows no blocking issues.

### Phase 7 — SEO, localization & consent  *(~1.5 weeks; parallelizable)*

**Goal:** the site is indexable, bilingual properly, and consent-compliant.

- **P7-1 — Head metadata on every page (SEO-1).** *(Owner: Frontend · M)*
  Emit canonical, Open Graph, Twitter, and JSON-LD (Organization, WebSite+SearchAction, Product — `name`+`Offer`/availability, no price, per Google's product-snippet rules; BreadcrumbList; Article; JobPosting; FAQPage; LocalBusiness ×3) from CMS-managed SEO fields (P4-4). **Done-when:** every built page has a canonical + OG; Rich Results Test passes for Product, Article, Breadcrumb, FAQ, JobPosting; grep of `dist` shows JSON-LD on the relevant templates.
- **P7-2 — Correct, segmented sitemap with real `lastmod` (SEO-2, SEO-3).** *(Owner: Frontend · M)*
  Adopt `@astrojs/sitemap` with `site` + `i18n` so it emits hreflang `xhtml:link` alternates; set per-page `lastmod` from content timestamps via `serialize()` (not the build date); include brands/resources/compare/onboarding/ar/sitemap; drop `priority`/`changefreq` (Google ignores them). Set `trailingSlash:'always'` + `build.format:'directory'` so canonical, sitemap and internal links all use the same form (kills the 167-redirect churn). **Done-when:** the sitemap lists every indexable page with accurate `lastmod`; no trailing-slash redirect on internal navigation; Search Console accepts it.
- **P7-3 — Real hreflang EN/AR (SEO-4; depends on the `/ar` rebuild).** *(Owner: Frontend · L)*
  Rebuild `/ar` as a genuine localized twin (Astro `i18n`, `routing.prefixDefaultLocale:false` so EN stays at root and AR at `/ar/`), driven by `content_blocks(lang='ar')` rather than hardcoded Arabic; make the language switch keep path+query+anchor and be reciprocal. Add reciprocal hreflang `en`/`ar` + `x-default` (Google: non-reciprocal tags are ignored; fully-qualified URLs). Populate AR blocks via the CMS (P4-4) so `#/loc-audit` reports real coverage. **Done-when:** `/ar/<page>` exists for each core page, served from the DB; each page links to its twin and `x-default`; the switch is lossless; loc-audit shows real AR coverage > 0.
- **P7-4 — Cookie consent + consent-gated analytics (SEO-5; PDPL).** *(Owner: Frontend + Legal · M)*
  Add a first-visit consent banner (Accept all / Reject non-essential / toggles), store the choice 12 months with timestamp + notice version, and block analytics/marketing until consent (UAE PDPL 45/2021: clear, specific, evidenced consent with a withdrawal path). If GA4 is to be used, wire Consent Mode v2 (`gtag('consent','default',{…'denied'})` then `update` on acceptance) and actually fire the GA4 events the PRD lists (none are wired today). **Done-when:** a fresh profile sees the banner and no analytics request before consent; the choice persists and is withdrawable; GA4 DebugView shows events only after consent.
- **P7-5 — robots & crawl hygiene (SEO-6).** *(Owner: Frontend · S)*
  Add a custom `src/pages/404.astro` (Astro builds `404.html`; most hosts serve it) with site search + top categories + WhatsApp (FRS G-11); `Disallow: /search/` thin pages; keep `Disallow: /api/`. **Done-when:** a bogus URL serves the custom 404; robots disallows `/search/`.

### Phase 8 — Security & NFR hardening  *(~1.5 weeks)*

**Goal:** close the remaining Medium security items and the non-functional gaps the audit flagged.

- **P8-1 — CSRF defense in depth (SEC-7).** *(Owner: Security Eng · M)*
  Add the synchronizer-token pattern (session-bound) on state-changing routes, keep `SameSite`, and add an `Origin`/`Sec-Fetch-Site` check with a fallback (OWASP CSRF Cheat Sheet: SameSite alone is not sufficient). Make `readJsonBody` reject non-JSON content types (`http.js:32-49`) so `text/plain` can't dodge the CORS preflight; cap body sizes sensibly (not 26 MB by default). In production, set the session cookie with the `__Host-` prefix (`Secure; Path=/; no Domain`). **Done-when:** a cross-site POST without a token is rejected; `text/plain` bodies are refused; the prod cookie is `__Host-`-prefixed.
- **P8-2 — Rate limiting & proxy trust (SEC-8, NFR-4).** *(Owner: Backend + DevOps · M)*
  Wrap `/api/auth/login` in `limited()`; replace the shared mutable `ipOfReq` with a per-request value (`routes.js:29-33`); trust `X-Forwarded-For` only from known proxies. Move rate-limit state to a shared store (e.g. Redis) so it survives restarts and spans replicas, or document that the edge (nginx) is the enforcement point and make the app limiter defense-in-depth. **Done-when:** the 11th login in 5 min is throttled deterministically under concurrency; limits hold across a restart (or the edge enforcement is documented and tested).
- **P8-3 — Harden the SSG build subprocess (SEC-10).** *(Owner: Backend · S)*
  Replace `exec('npm.cmd run build', …)` with `execFile('npm'/'npm.cmd', ['run','build'], {timeout, killSignal, signal})` (Node docs: no shell, bounded) and pass only the env the build needs, not the portal's full secret-bearing env. Remove the hardcoded `F:/…` candidate; resolve `SITE_DIR` from config. Guard against concurrent/stuck builds. **Done-when:** a hung build is killed by the timeout; the child env excludes DB/admin secrets; no absolute dev path in `server.js`.
- **P8-4 — Public-site CSP & output encoding (SEC-13).** *(Owner: Frontend · M)*
  Add a CSP to the public site (header via the host, or `<meta http-equiv>` as a floor) matching the strict portal CSP; stop inserting stored `cta_href`/announcement/`it_solution.cats` into `innerHTML`/`set:html` without sanitization; validate URLs (reject `javascript:`); fix `esc()` to also escape `'`. **Done-when:** the public site sends a CSP; a stored `javascript:` CTA does not execute; axe/securityheaders-style check passes.
- **P8-5 — Static-file & error hygiene (SEC-12).** *(Owner: Backend · S)*
  Add a dotfile deny in `serveStatic` (`http.js:86-108`); return generic 500 bodies to clients and log details server-side (`server.js:93`); ensure `.env` and secrets are git-ignored and rotated (they were exposed via the :8000 directory-listing server — decommission `serve_prototype.py` for anything but local use). **Done-when:** a dotfile request 404s; a 500 leaks no stack/DB text; no secret is reachable over HTTP.
- **P8-6 — Performance budget in CI (NFR-1).** *(Owner: Frontend + DevOps · M)*
  Add Lighthouse CI against the built pages with the PRD budgets (LCP ≤2.5 s on 4G, Lighthouse Performance ≥85, mobile). **Done-when:** Lighthouse CI runs on PRs and the key pages meet budget (or exceptions are documented and approved).
- **P8-7 — Backup/DR drill on real infra (NFR-2).** *(Owner: DevOps + DBA · M)*
  Execute a real backup→restore drill against staging; measure RPO/RTO against the PRD targets (RPO ≤1 h, RTO ≤4 h); replace the template DR docs with the drill evidence. **Done-when:** a restore from backup is demonstrated end to end with measured RPO/RTO.
- **P8-8 — Observability (NFR-3).** *(Owner: DevOps · M)*
  Wire uptime monitoring and a Sentry-class error sink; propagate the existing request-id into logs and error reports; alerting on 5xx and failed builds/publishes. **Done-when:** a synthetic error appears in the error tracker with a request-id; an uptime alert fires on a simulated outage.
- **P8-9 — Package the portal into the repo (NFR-5).** *(Owner: DevOps · S)*
  Replace the NTFS junction with the portal living inside the versioned tree (or a submodule), so backups/CI/packaging capture it. **Done-when:** a clean checkout contains the portal source; CI builds it without the junction.

### Phase 9 — Requirements reconciliation & governance  *(~1 week; can start at P0)*

**Goal:** a single ratified baseline so "done" is well-defined, and the record is honest.

- **P9-1 — Ratify one requirements baseline (GOV-1, GOV-4).** *(Owner: PM + Architect · M)*
  Resolve each contradiction in the requirements extract §(a): fix the brand count (reconcile 20/21/22/23 to the actual catalogue), SKU count (78), RFQ reference format, KYC reference format, KYC steps/tracks, staff-MFA policy, session timeouts, WCAG version (2.2 AA), uptime target, and the e-invoicing phase. Record the **as-built stack** (Astro SSG + Node + bespoke PostgreSQL CMS; scrypt+TOTP) as a ratified ADR, and drop the "Dynamics 365 / Content Studio" naming that implies a non-existent integration (or state explicitly it is a visual theme only). **Done-when:** a single reconciled requirements set (versioned) exists; each former contradiction has one agreed value; an ADR ratifies the stack.
- **P9-2 — Supersede the prior audit & inflated claims (GOV-2).** *(Owner: PM · S)*
  Mark the "Antigravity" reports as superseded by this independent audit; correct the record (PostgreSQL 16.9 not 17; "100% PASS" withdrawn; counters corrected). **Done-when:** the prior reports carry a superseded notice referencing this plan.
- **P9-3 — Reset the go-live/hypercare/Peppol record (GOV-3, GOV-5).** *(Owner: PM · S)*
  Treat the future-dated go-live/hypercare/Peppol-exchange documents as templates (they are); no document may assert a go-live that has not happened. Align the Peppol content to the verified timeline (ASP by 30 Oct 2026; go-live 1 Jan 2027). **Done-when:** no document claims a past go-live; the Peppol dates match the verified decision.
- **P9-4 — Content governance workflow (SEC-11, FRS-RC-11/F4).** *(Owner: PM + Eng · S)*
  Document and enforce draft→review→compliance-sign-off→scheduled-publish for pricing claims, Peppol/compliance dates and brand-authorization wording, with versioning + rollback (the engine fixed in P2/P4). **Done-when:** a pricing/brand-claim change cannot go live without the recorded second approval.

### Phase 10 — Independent re-verification & go/no-go  *(~1 week)*

**Goal:** prove closure the same way the audit proved the defects.

- **P10-1 — Re-run the full audit probe suite.** *(Owner: QA · M)*
  Re-execute everything in `evidence/probes/` against a freshly provisioned staging build: authz matrix, CMS→site E2E, KYC + e-invoicing + auth lifecycles, the crawl, the browser/contrast/tab-trap/mobile passes, the fake-success forms. **Done-when:** every probe that previously failed now passes, with captured evidence; the clean-DB build is green.
- **P10-2 — Independent security retest.** *(Owner: External/again-independent · M)*
  Re-test the P1/P8 items (credentials, MFA, RBAC matrix, token leak, CSRF, upload AV, CSP) and run a focused pen test of auth + KYC (PRD NFR requirement). **Done-when:** no open Critical/High; the pen-test report is attached.
- **P10-3 — Requirements traceability re-run.** *(Owner: QA · M)*
  Re-trace the top ~25 critical requirements (RFQ, KYC lifecycle, e-invoicing, RBAC, localization, SEO, accessibility) to engine + persisted API + UI, against the reconciled baseline (P9-1). **Done-when:** each critical requirement traces to working, evidenced behaviour.
- **P10-4 — Go/No-Go gate.** *(Owner: Steering) ·* The exit criteria (same as the audit's "production ready" bar): **no open Critical/High** in security, data integrity, segregation of duties, audit trail or data protection; CI green including the new gates; a clean-DB build + real deploy proven; scheduled batch work (SLA/expiry reminders) running; integrations real or clearly flagged; monitoring + a proven backup/restore. **Done-when:** the gate is signed with evidence, and only then is "production ready" asserted.

---

## 5. Traceability matrix — every finding → phase → acceptance

| Finding | Sev | Phase · Task | Acceptance (how closure is proven) |
|---|---|---|---|
| SEC-1 (F-1) | C | P1-1 | prod boot has no seeded accounts; no password literal in source; login shows none |
| SEC-2 (F-2) | C | P1-1 | `123456` rejected in all modes; `NODE_ENV` set per env |
| SEC-3 (F-3) | C | P1-2 | authz matrix green (partner/viewer/anon → 401/403 on all admin/einvoice/integration) |
| SEC-4 (F-12) | H | P1-3 | takeover probe can't recover a token; reviewer can't reset another account |
| SEC-5 | H | P1-2 / P5-2 | foreign docId → 403; download gated by `view_pii` |
| SEC-6 | H | P1-4 (after P2-2) | reviewer report masked; full PII only `view_pii` |
| SEC-7 | M | P8-1 | tokenless cross-site POST rejected; `text/plain` refused; `__Host-` cookie |
| SEC-8 | M | P8-2 | login throttled under concurrency; limits survive restart/replicas |
| SEC-9 | M | P5-3 / P5-4 | "delivered/sent" only after a real send; worker exists or claim removed |
| SEC-10 | M | P8-3 | build killed on timeout; child env scrubbed; no `F:/…` path |
| SEC-11 | M | P4-5 / P9-4 | sensitive publish needs a second approver |
| SEC-12 | L | P1-1 / P8-5 | dotfile 404; no secret over HTTP; 500 leaks nothing |
| SEC-13 | M | P8-4 | public CSP present; stored `javascript:` inert; `esc()` covers `'` |
| SEC-14 | M | P2-9 | reopen-delivered → clean 409; JSON==PG |
| DAT-1 (F-4) | H | P2-1 | clean-DB build green with seeded announcement/testimonials/featured |
| DAT-2 (F-8) | H | P2-3 | real actor on CMS + KYC actions; no `{}` to customer |
| DAT-3 (F-11) | H | P2-2 | SLA age non-null; breach fires; reports+CSV 200 |
| DAT-4 | H | P2-4 | shared-id rollback touches only the intended row |
| DAT-5 | M | P2-4 / P4-3 | rollback undoable; product rollback works or is hidden |
| DAT-6 | M | P2-5 | no dup-key after high-id seed; no interpolated identifiers |
| DAT-7 | M | P2-6 | reviewed cleanup script; prod uses fresh seed |
| DAT-8 | L | P2-7 | no present-but-unused column; brand counts consistent |
| DAT-9 | M | P2-8 | app connects as non-superuser over scram-sha-256; no `trust` in prod |
| CMS-1 (F-13) | M | P4-1 | `cms_buttons.cjs` → 0 inert action buttons |
| CMS-2 (F-5) | H | P4-4 | each new editor's change reaches the site (cms_e2e cases) |
| CMS-3 | M | P4-2 | AMC edit reaches `/solutions/` |
| CMS-4 | M | P4-2 | stock=false → "Out of stock" on site |
| CMS-5 | M | P4-3 | each control round-trips; policy body loads/saves; Force Logout works |
| CMS-6 | M | P4-2 | `site/*` string/array blocks editable |
| CMS-7 | M | P4-5 | Quick Create renders on site; article create never breaks build |
| CMS-8 | L | P4-7 | no dead/fake CMS control; loc-audit + RBAC matrix real |
| CMS-9 | M | P4-4 | media upload/delete works; stored outside webroot |
| CMS-10 (F-9) | M | P4-6 | counters real; publish deploys live; no "all published" after fail |
| PUB-1 (F-6) | H | P3-2 | no success-on-failure; submissions land in DB |
| PUB-2 (F-6) | H | P3-1 | public-origin `/api/*` succeeds on staging |
| PUB-3 (F-7) | H | P3-3 | crawl: 0 internal 404s / 0 `undefined` |
| PUB-4 | M | P3-4 | home widget shows real basket |
| PUB-5 | M | P3-5 / P7-3 | `/ar` reads valid columns + correct basket key |
| PUB-6 | M | P3-6 | underscore slugs add to RFQ |
| PUB-7 (F-10) | M | P3-7 | no internal markers in `dist` (CI grep) |
| PUB-8 | M | P3-8 | one consistent value per fact across `dist` |
| PUB-9 | M | P3-2 | `/onboarding` sends real data or routes to the real wizard; no fake ref |
| PUB-10 | L | P3-4 | no PII in client storage; recently-viewed wired or removed |
| PUB-11 | L | P3-4 | ROI total == breakdown; inputs honoured |
| PUB-12 | M | P3-9 | in-site anchors resolve and filter |
| APP-1 (F-11) | H | P2-2 | staff queue shows real ages; breaches flagged |
| APP-2 | M | P5-3 | UBL passes PINT AE; 10-digit endpoint |
| APP-3 | M | P5-2 | EICAR rejected as virus; AES-256 at rest; signed URLs expire |
| APP-4 | M | P5-6 / P3-2 | CV uploads + scanned; truthful result |
| APP-5 | M | P5-1 | signup/single-account built or signed-off |
| APP-6 | L | P5-5 | formatted dates; populated buyer/TRN; real ages |
| APP-7 | M | P5-1 | UAT walkthrough of both tracks with evidence |
| A11Y-1 | H | P6-1 | one server-side `<h1>` per page |
| A11Y-2 | H | P6-7 | focus never enters a closed modal |
| A11Y-3 | M | P6-2 | skip link on all pages |
| A11Y-4 | M | P6-3 | no heading-order violations (axe) |
| A11Y-5 | M | P6-4 | contrast_scan → 0 failures |
| A11Y-6 | M | P6-5 | mobile_nav → 0 sub-24px targets |
| A11Y-7 | M | P6-6 | page search works; chips operable; carousels pausable |
| A11Y-8 | L | P6-7 / P4-1 | CMS axe clean; chips not buttons |
| SEO-1 | H | P7-1 | canonical+OG+JSON-LD on every/relevant page; Rich Results pass |
| SEO-2 | M | P7-2 | full sitemap; accurate lastmod |
| SEO-3 | M | P7-2 | no trailing-slash redirect churn |
| SEO-4 | H | P7-3 | `/ar` twin from DB; reciprocal hreflang; lossless switch |
| SEO-5 | M | P7-4 | consent banner; no analytics pre-consent; GA4 events post-consent |
| SEO-6 | L | P7-5 / P6-1 | custom 404; robots disallows `/search/` |
| NFR-1 | M | P8-6 | Lighthouse CI meets PRD budgets |
| NFR-2 | M | P8-7 | restore drill with measured RPO/RTO |
| NFR-3 | M | P8-8 | error in tracker w/ request-id; uptime alert fires |
| NFR-4 | M | P8-2 | shared rate-limit store or documented edge enforcement |
| NFR-5 | L | P8-9 | portal in the versioned tree |
| NFR-6 | M | P0-3 | six CI gates run and bite |
| GOV-1 | H | P9-1 | one reconciled baseline + stack ADR |
| GOV-2 | M | P9-2 | prior audit marked superseded; record corrected |
| GOV-3 | M | P9-3 | no doc asserts a past go-live |
| GOV-4 | M | P9-1 | D365 naming removed or scoped as theme-only |
| GOV-5 | L | P5-3 / P9-3 | Peppol dates = 30 Oct 2026 / 1 Jan 2027 |

**Coverage check:** all 14 SEC + 9 DAT + 10 CMS + 12 PUB + 7 APP + 8 A11Y + 6 SEO + 6 NFR + 5 GOV = **77 findings**, each mapped to at least one task with an acceptance test. The 13 headline findings map as: F-1→SEC-1, F-2→SEC-2, F-3→SEC-3, F-4→DAT-1, F-5→CMS-2, F-6→PUB-1/PUB-2, F-7→PUB-3, F-8→DAT-2, F-9→CMS-10, F-10→PUB-7, F-11→DAT-3/APP-1, F-12→SEC-4, F-13→CMS-1 — all closed by the tasks above.

---

## 6. Indicative schedule & resourcing

Phases must respect the dependency rules (§3). With **3 engineers + 1 QA + part-time DevOps/DBA/PM**, a realistic calendar:

| Weeks | Running in parallel |
|---|---|
| 1 | P0 (all) + P9-1 kickoff |
| 2 | **P1 (blockers)** |
| 3–4 | P2 ; P9 continues |
| 5–6 | P3 ; P6 starts ; P7 starts |
| 7–8 | P4 ; P6/P7 continue |
| 9–10 | P5 ; P8 |
| 11 | P8 finishes ; P9 finishes |
| 12 | **P10 (re-verification & go/no-go)** |

≈ **12 weeks** to a defensible go/no-go, security blockers cleared by end of week 2. Compress by adding a second full-stack engineer to P4/P5 (the critical path) or extend if the CMS editors (P4-4) and the `/ar` rebuild (P7-3) are scoped larger than estimated.

---

## 7. What "100% covered" means here

This plan closes **every finding in §2** — which is the full set the audit produced from the reports, the code, the live probes and the two workflow iterations. "100%" is bounded by that evidence base; it does **not** include work the audit explicitly did **not** do (load testing to the numeric budgets beyond P8-6, a full NVDA/VoiceOver AR pass beyond P6-8's sample, or a formal third-party pen test beyond P10-2). Those are scheduled as acceptance activities, not assumed complete. Any new defect found during remediation is added to the register under the same discipline (ID, evidence, task, acceptance) before Phase 10 signs off.

*Standards and sources are listed in `REMEDIATION_RESEARCH_NOTES.md`. Every `file:line` in this plan was re-verified against the current code on 2026-10-12.*
