# Simal Corporate Platform — Independent Forensic Audit & Validation

**Of the prior report set:** `FORENSIC_CMS_PUBLIC_SITE_AUDIT_REPORT.md`, `COMPONENT_CONNECTIVITY_MATRIX.md`, `ACCESSIBILITY_WCAG_AUDIT.md`, `E2E_VERIFICATION_EVIDENCE.json` (all dated 2026‑10‑12, "Antigravity Forensic Engineering").

**This audit date:** 2026‑10‑12
**Auditor:** Independent review, AI‑assisted (Claude Code). Evidence‑based; every material finding is backed by a file:line, an HTTP/SQL transcript, a build log, or a screenshot preserved under `evidence/`.
**Audience:** Simal engineering leadership and project governance. Written to be defensible to a client or board.

---

## 1. Executive summary

The prior "Antigravity" report set declares the platform **"100% PASS … COMPLETE, FULLY REMEDIATED & PRODUCTION CERTIFIED"** across every dimension. **That verdict is not supported by the evidence and is contradicted on multiple counts.** The platform is a genuine, working prototype with a real PostgreSQL‑backed catalogue and a real publish‑to‑rebuild pipeline — but it is **not production‑ready**, its CMS does **not** control 100% of the public site, its security is **not** "100% PASS", and its accessibility is **not** "100% WCAG 2.1 AA".

The prior report is best described as **true in its narrow mechanical claims and false in its headline conclusions**. Where it says "we enqueued a publish event and a worker processed it," that is real (I reproduced it). Where it says "25/25 components fully controllable," "Portal Security 100% PASS," and "WCAG 100% PASS," the code and live probes say otherwise.

### Verdict by layer

| Layer | Prior claim | Independent finding | Evidence |
|---|---|---|---|
| Public site builds & serves | 218 pages, live | **Confirmed** (218 pages, 8s build) | `evidence/logs/build_baseline.log` |
| Catalogue ↔ PostgreSQL (build‑time) | 100% | **Confirmed for what is DB‑bound** (products, slides, policies, software/solution detail, insights, testimonials) | `cms_e2e.json`, DB counts |
| CMS controls 100% of public site | 25/25 | **Contradicted** — ~5 fully, ~14 partial, ~6 broken/absent; site chrome, brands, product specs/images, `/ar`, SEO, stats, awards have **no editor** | §5, §6, CMS agent report |
| Publish → SSG rebuild worker | 100% resolved | **Confirmed it runs**, but misleading counters, hardcoded path, 3 of 7 historical builds failed, no CDN deploy | §7, `server.js:118‑157` |
| Portal security / RBAC | 100% PASS | **Contradicted — Critical/High findings** (known‑password super‑admins shipped, MFA bypass, missing role gates let a partner read the whole KYC book) | §8, `authz_matrix.json` |
| WCAG 2.1 AA | 100% PASS | **Contradicted** — 0 `<h1>` in home server HTML, no skip links, heading‑level jumps on ~194 pages, measured contrast failures, invisible‑modal focus traps | §9, `contrast_scan`, `browse_all.json` |
| Data integrity | Sequences synced, immutable revisions | **Mostly confirmed**, but unscoped block rollback can corrupt 21 shared records; all CMS writes attributed to `system` | §8, §10 |
| KYC & e‑invoicing apps | implied working | **Engines work end‑to‑end** (strict validation, correct state machines, correct VAT/UBL) — but the staff SLA engine, report builder and CSV export are **broken in PG mode**, and `{}` is shown to customers | §5A |
| Fresh‑environment provisioning | Proven on a clean DB | **Contradicted** — a from‑scratch `migrate.sql` + `seed.sql` build **fails**: `column "cta_label" does not exist` | §4, `build_fresh.log` |
| Requirements coverage | implied complete | Large gaps vs the BRD/PRD/FRS/SRS; and the requirement docs themselves disagree with each other and with the as‑built stack | §11 |

### Top findings (ranked)

| # | Sev | Finding | Evidence |
|---|---|---|---|
| F‑1 | **Critical** | Known‑password super‑admin accounts (`admin@simalme.com/admin123`, `mfa.demo…/demo123`) are seeded on **every** boot with no environment guard; the Dockerfile sets `NODE_ENV=production` yet seeding still runs. Login page and CMS login screen print the credentials. | `auth.service.js:40‑59`; `login.html:129‑135`; `cms.html:56‑57` |
| F‑2 | **Critical** | MFA bypass: code `123456` is accepted whenever `NODE_ENV !== 'production'`, and `.env` does not set `NODE_ENV` (defaults to development). | `auth.service.js:86‑89`; `config.js:37` |
| F‑3 | **Critical** | Broken RBAC: `adminAuth = [requireAuth]` with **no role check**. A `partner` (auto‑created for every approved applicant) can read **all** KYC submissions, the full e‑invoice queue, analytics and integration endpoints. Proven live in sandbox. | `routes.js:359,373,362`; `evidence/data/authz_matrix.json` |
| F‑4 | **High** | From‑scratch provisioning is broken: `announcements.cta_label` is used by the site and service but missing from `scripts/migrate.sql:128‑132`; a clean `migrate+seed+build` fails. Contradicts "proven on a fresh database." | `evidence/logs/build_fresh.log` |
| F‑5 | **High** | CMS does not control the majority of the public site: header, 8 mega‑menus, footer, newsletter, trust badges, brands, categories, product specs/images, `/ar`, SEO meta, stats, awards are hardcoded or have no editor. | §6; `BaseLayout.astro` |
| F‑6 | **High** | Public forms report **success when the backend is unreachable**: careers ("Application received ✓" on HTTP 501), insights digest ("Subscribed ✓", no request at all). The static host (`:8100`) has no `/api`, so on the as‑shipped topology every form silently fails while telling the visitor it worked. | `evidence/screenshots/fake_careers_consented.png`; `fake_success` run |
| F‑7 | **High** | ~40 broken internal links in the built site, incl. **all 5 flagship‑solution cards → `/solutions/undefined/`**, all 7 `/legal/*` hub links 404, and `/careers` reading the wrong CMS block. | §5; `evidence/data/crawl.json` |
| F‑8 | **High** | Audit attribution is destroyed: every CMS write records actor `system`; every KYC review action records actor `[object Promise]`/`{}` (an un‑awaited async function). | `cms.service.js:46`; `review.service.js:146‑150`; DB: 9 audit rows with actor `{}` |
| F‑9 | **Medium** | Outbox "Pending Dispatch" tile counts `status==='pending'`, a status no code ever writes; it is permanently 0 while real `queued` jobs exist. "Last Publish: all published" can show after a **failed** build. | `cms.js:2350`; §7 |
| F‑10 | **Medium** | Internal/placeholder text is published to the live site: "publish at launch per PRD FR‑3.3 (≥4 approved profiles required)" on `/about/`, "Mock auth · MFA noted" on `/sitemap/`, "Until formally reconciled by management" on `/contact/`, "Arabic product copy arrives with the CMS content team" on PDPs. | §6; dist greps |
| F‑11 | **High** | **One defect disables the entire SLA engine and both export paths in production (PG) mode.** `submissions.all()` returns raw snake_case rows while every consumer reads `submittedAt` → `undefined`. Result: SLA age is `null` on **every** queue row ("waiting nulld" in the staff console), `slaBreached` is **permanently false** (no breach is ever flagged or escalated), and `/api/admin/reports/build`, `/api/admin/export.csv` and the built‑in reports all return **500 "Invalid time value"**. The JSON‑mode test suite cannot see it because JSON‑mode objects are camelCase. | `pg-repos.js:282` vs `:403,405`; `review.service.js:25,42,48`; `probes/snake_bug.mjs` |
| F‑12 | **High** | **Demonstrated account takeover.** I requested a password reset for `reviewer@simalme.com`, read the raw token from `GET /api/cms/outbox`, completed the reset and logged in as that account — end to end in the sandbox. Previously assessed as latent; it is exploitable today by any `notes`‑permission user (i.e. any reviewer). | `probes/workflow_e2e.mjs` AUTH block |
| F‑13 | **Medium** | **35 of 48 CMS command‑bar buttons do nothing when clicked** (empirically measured across 12 views) — including "Trigger Build & Purge" on the publish pipeline, "Provision Staff User", "Add New Slide", "Export Catalog CSV", "Push Live" and "View Public Site". Root cause: handlers are bound only when a button config carries an `id`. | `cms.js:640`; `data/cms_buttons.json` |

### What genuinely works (credit)

- The **Astro SSG build is real**: 218 pages compile from PostgreSQL in ~8s; no `localStorage`/JS‑globals leakage in output.
- **Build‑time DB wiring is real** for the catalogue, hero‑slide text, testimonials, legal detail pages, the 68 software and 12 IT‑solution detail pages, insights, offices, AMC tiers, ERP pricing, implementation phases.
- The **publish → `npm run build` worker loop works** end‑to‑end; I reproduced a queued→processed transition and saw the edits land on the rebuilt pages.
- **SQL is fully parameterised** (including the CMS rollback/revisions paths); no string‑built identifiers in the API.
- **Password hashing (scrypt), TOTP (RFC‑6238, single‑use challenge), reset tokens (hashed, single‑use, TTL), server‑side session idle/absolute timeouts, strict CSP + security headers on the portal, and an SSRF‑guarded outbound client** are all sound.
- **Authentication is enforced**: every `/api/cms/*` and `/api/admin/*` route returns 401 unauthenticated (verified live on both the user's instance and the sandbox).
- **Testimonials CRUD, product/slide/announcement/block edits, and legal‑policy edits persist and appear on the rebuilt site** (I verified 17 content‑type edits flow to the public pages — §5).
- The project's **own unit/integration suite passes** (70/70 in JSON mode) and the **CI workflow is real** (7 jobs, Postgres service, gitleaks, build gate).
- **The KYC onboarding engine works end to end** and its **server‑side validation is genuinely rigorous** — it rejected four successive malformed submissions with precise, per‑field errors, and its state machine correctly refuses illegal transitions (approve‑from‑submitted → 409). Document intake verifies magic bytes and rejects extension mismatches.
- **The e‑invoicing engine works end to end**: correct 5% VAT arithmetic, 2‑decimal enforcement, UBL 2.1 output, `buyer_kyc_approved` gating, delivery only from `validated`, and cross‑partner access blocked.
- The **partner status page** is a well‑made, clear timeline view (aside from the `{}` defect).

---

## 2. Validity of the prior report — claim‑by‑claim

Verdict labels: **Confirmed**, **Partially true**, **Misleading** (true fact, false implication), **Contradicted**, **Not reproducible**.

| # | Prior claim (quoted/paraphrased) | Finding | Evidence | Verdict |
|---|---|---|---|---|
| 1 | "100% (25/25) components fully dynamic, connected to PostgreSQL, and directly editable via the CMS" | ~5 fully controllable, ~14 partial (hardcoded fallbacks / wrong block / no create‑delete), ~6 contradicted (brands, product_deep, `/ar`, flagship links, stats, awards have no working CMS control) | §5, §6 | **Contradicted** |
| 2 | "Changes write immediately to PostgreSQL, create an audit trail, snapshot a micro‑revision" | True for writes that succeed; but actor is always `system`, rollback is unsafe, and `/legal` body never loads into the editor | §8, §10 | **Partially true** |
| 3 | "Synchronization gap remediated … ssgLoop builds 218 pages … verified end‑to‑end" | The loop works and I reproduced queued→processed; but path is hardcoded to `F:/…`, 3 of 7 historical jobs `failed`, counters are misleading, and there is no deploy to any CDN | §7 | **Partially true / Misleading** |
| 4 | "PostgreSQL 17 (port 5433)" | Server is **PostgreSQL 16.9** | `SELECT version()` | **Contradicted** (minor, but it is "forensic evidence") |
| 5 | "Dedicated GUI views built for Announcements (#/announcements) and Testimonials (#/testimonials) … live banner simulators, modal dialogs, revision rollback" | Views exist. Announcements edits **row 1 only** (no create/delete); its revision history is broken (wrong response shape); testimonials CRUD is genuinely complete | CMS agent §5 | **Partially true** |
| 6 | "Portal Security, RBAC & Session Management: 100% PASS" | Critical/High RBAC and credential findings (F‑1,2,3); partner can exfiltrate the KYC book | §8 | **Contradicted** |
| 7 | "WCAG 2.1 AA Compliance: 100% PASS" + scorecard 92–98% | 0 `<h1>` in home server HTML; no skip links anywhere; heading jumps on ~194 pages; measured contrast failures on every sampled page; invisible modals keep focus | §9 | **Contradicted** |
| 8 | Contrast table e.g. "gold `#C5A059` on `#0F172A` = 8.6:1", "muted `#94A3B8` = 2.8:1" | Recomputed: that pair is **7.27:1** (not 8.6), `#94A3B8` is **2.56:1** (not 2.8). Several listed colours are **not used by the public site at all** (they are portal‑CMS colours). The audit measured the wrong product. | contrast recompute | **Misleading** |
| 9 | "PostgreSQL Primary Key Sequence Synchronization: 100% RESOLVED" | `testimonials_id_seq` currently = 4 while max(id) = 3 (fine now), but the sync tool uses **identifier string‑interpolation** and the drift recurs (LEARNINGS admits "happened three times") | `sync-sequences.mjs:21‑23` | **Partially true** |
| 10 | "Featured Products Strip remediated — dynamic with fallback" | Query exists; but in the shipped `seed.sql` the block is **not seeded**, so the built strip = the hardcoded fallback. The row only exists because a one‑off tool (`seed_cms_blocks.mjs`) was run against the live DB | site agent §1 #4; `seed.sql` | **Partially true** |
| 11 | "Single‑Source Contact & Office Directory … single‑sourced" | `site/offices` feeds `/contact` only; phones, emails, hours, addresses are hardcoded in the header, footer, `/ar`, `/rfq` and other pages | site agent §1 #18 | **Contradicted** |
| 12 | "Arabic Localization … queries localized records; parity tracked" | `/ar` is one standalone page with **hardcoded Arabic**, 5 hardcoded English product slugs, its own hardcoded header/footer, links to English pages, reads a non‑existent column `category_slug`; **0 Arabic rows** in `content_blocks`; the CMS `#/loc-audit` hardcodes "100%" | site agent §1 #24 | **Contradicted** |
| 13 | "Contact form … rate‑limited, routes to accounts@" | Backend route is correct and rate‑limited; but the **public contact form has no PDPL consent control** (FRS‑R‑03/CT requires one) and the newsletter/careers/demo/KYC flows fake success | §6, forms probe | **Partially true** |
| 14 | E2E JSON: "contactMessageSubmission status 201 … auditLogRecorded" | The endpoint does return 201 and audits; but the **site is served from a host with no `/api`**, so in the shipped topology the browser call 404/501s | site log `site_8100.log` | **Misleading** |
| 15 | "cms_revisions (17+ immutable snapshots)" | 17 rows exist and snapshots are taken on write; good — but rollback restores the newest snapshot only, saves no undo snapshot, and for `products` is a silent no‑op reported as success | §8 | **Partially true** |
| 16 | "Dynamics 365 CMS Console / Content Studio" | There is **no Microsoft Dynamics 365 / Dataverse integration** anywhere; it is a bespoke HTML/JS admin styled to look like D365. No requirement doc ever asked for D365. | code grep; §11 | **Misleading** (cosmetic naming) |
| 17 | "All interactive buttons, checkboxes and chips exceed 24×24px (desktop) and 44×44px (touch)" | Measured at 390 px: **35 tap targets under 24×24 px** | §5A.6 | **Contradicted** |
| 18 | Implied: the staff console and reporting work | In PG mode the SLA age is `null` on every row, no breach is ever flagged, and the report builder + CSV export both return **500** | §5A.2, F‑11 | **Contradicted** |
| 19 | "Immutable audit logs" / "every action audit‑logged (NFR‑10)" (stated in the admin console UI) | Actions are logged, but the actor is `system` (CMS) or `{}` (KYC review) — and `{}` is printed to the applicant on the public status page | §5A.1, F‑8 | **Contradicted** |
| 20 | Implied by the CMS screenshots: the Content Studio is operable | **35 of 48 command‑bar buttons are inert**, including the pipeline's own "Trigger Build & Purge" | §5A.5 | **Partially true** |

**Internal inconsistencies within the prior report set:** the main report says "PostgreSQL 17"; the evidence JSON says "PostgreSQL 17 (port 5433)" — both wrong (16.9). The report says "audit_log (310+)" and the JSON "312"; live is 340+. The report claims 218 pages built from a publish while the same publish's build path is hardcoded and can fail. These are the kinds of mismatches that, by the prior report's own standard, "are already a finding."

---

## 3. Method, scope & isolation

**Targets.**
- Public site: `Codebase/apps/site` (Astro 5 SSG). Built output `apps/site/dist` (218 pages, built 2026‑10‑12 10:35).
- Portal + CMS: `apps/portal` — an **NTFS junction** to `F:\software_project\Sofoware_project_04\portal` (outside the project tree; noteworthy for backup/packaging).
- Data: PostgreSQL 16.9 on `127.0.0.1:5433`, db `simal`.
- Requirement docs: `Primary_doc/*`, `Project_doc/*`, `Codebase/RTM.md`.

**Isolation (no mutation of the user's world).**
- The user's DB was touched **GET/SELECT only**; I took a read‑only `pg_dump` and restored it into a **disposable scratch cluster on port 55433**, then ran all write/rollback/publish/authz probes there. The scratch cluster and its copy of the data (which included the portal `.env` and the DB dump) were **dropped and deleted** at the end.
- A sandbox portal ran on `:18090` and a sandbox static+proxy server on `:18100`, both stopped.
- Against the user's **live** instances I performed only GET probes and two throwaway logins (3 audit rows: `login_failed`, `login`, `login`). I did **not** write, publish, or roll back anything on the live DB.
- Playwright (bundled `playwright‑core@1.57` + installed Chromium) drove the real pages for the visual pass; the static site was browsed read‑only.

**Two iterations.** The first pass covered the reports, the codebase, the public site and the CMS. A **second pass** was then run specifically against the brief's "are all the apps/portals working" question: it rebuilt the sandbox and exercised the KYC onboarding lifecycle, the staff review console, both e‑invoicing consoles, the auth/reset flows, every CMS command‑bar button and the mobile layout (§5A). Three of this report's findings (F‑11, F‑12, F‑13) and several claim‑table rows come from that second pass.

**What was NOT done:** no load/perf testing to the PRD's numeric budgets; no screen‑reader (NVDA/VoiceOver) walkthrough; no penetration test beyond the authz matrix and documented probes; no review of the Mirror_site/Prototype trees except to confirm they are legacy. The KYC wizard was driven through its **API**; the browser pass of the 7‑step form UI was partial (the autosave/re‑render cycle defeated the synthetic form filler), so UI‑level validation messaging inside the wizard is unverified — though the server‑side validation behind it was tested thoroughly.

**Evidence location:** `Audit/Independent_Forensic_Audit_2026-10-12/evidence/` — `screenshots/` (93), `probes/` (the exact scripts, re‑runnable), `data/` (crawl, authz matrix, E2E, visual JSON), `logs/` (builds, tests, portal boot).

---

## 4. Build, provisioning & tests

**Baseline build (against the live data, snapshot‑restored):** `npm run build` → **218 pages, exit 0, ~8s**. Good. (`logs/build_baseline.log`)

**From‑scratch provisioning — FAILS (F‑4).** The repo claims `scripts/migrate.sql` is the "SOURCE OF TRUTH … proven end‑to‑end on a fresh database." Reproduced on a clean DB:
- `migrate.sql` applies (rc 0); `seed.sql` applies.
- But `migrate.sql:128‑132` defines `announcements` **without `cta_label`**, while `BaseLayout.astro:17` and `cms.service.js:320‑333` require it.
- `npm run build` then dies: `column "cta_label" does not exist` (`logs/build_fresh.log`).
- The live DB only works because the column was added out‑of‑band. This is exactly the "anything found existing only on a live database is a defect" case the repo's own `migrations/README.md` warns about — it has now happened a fourth time.
- Also: `seed.sql` seeds **0 announcements** and **testimonials with empty quotes** (the real quotes were added out‑of‑band), and does **not** seed `site/featured-products` or `site/careers-roles` (added by `tools/seed_cms_blocks.mjs`). So a clean environment would not reproduce the audited site.

**Schema drift beyond cta_label:** `products.category_slug` is read by `ar/index.astro:123` but does not exist; `category_guides` (7 rows) is seeded but never queried; `hero_slides.bg`, `product_deep.box/docs`, `testimonials.company`, `announcements.starts_at/ends_at` are defined but unused.

**Tests.** Portal unit+integration suite (JSON store): **70/70 pass** (`logs/test_unit_integration.log`). What the green suite does **not** prove:
- `test:site` is a stub that just `echo`s — **there are no public‑site tests**.
- No test logs in as a `partner` and asserts a 403 on `/api/admin/*` — so the RBAC holes (F‑3) pass CI unnoticed. The one e‑invoice test even asserts "viewer can read queue" (which is the bug, not the guard).
- The only `/api/cms` test is the SSG‑outbox test — it asserts a status transition, not that a CMS edit reaches a public page.
- The security‑audit CI job checks headers/secret‑literals/deps, not authorization behaviour.

---

## 5. Does the CMS actually drive the public site? (reproduced end‑to‑end)

I performed 20 real CMS edits in the sandbox, triggered a publish, let the worker rebuild, and grepped the rebuilt pages for a unique marker. Result (`evidence/data/cms_e2e.json`):

| Content type edited in CMS | Reached the public page? |
|---|---|
| Announcement bar, hero slide #1, product name, **new testimonial** (home **and** `/about/`), legal policy body, `site/offices` → `/contact`, `site/careers-roles` → `/careers`, `site/cases` → `/resources`, `site/amc-tiers`, `site/solutions5`, `erp/pricing`, `site/impl-phases`, `insight/*`, `it_solution/amc`, `software_module/finance` (detail), `site/featured-products` reorder | **LIVE ✓** |
| `amc/tiers` (the block the CMS "AMC Tiers" view actually edits) | **NOT LIVE** — the site reads `site/amc-tiers`; this block is a decoy |
| `software_module/crm` on the `/software` **hub** | **NOT LIVE** — hub grid is hardcoded; only detail pages are DB‑bound |
| `site/counters` (home stats strip) | **NOT LIVE** — stats are hardcoded |
| `site/mission` | **EDIT ERROR** — payload is a JSON **string**, and the API rejects non‑object payloads (422), so this block **cannot be edited via the CMS at all** |
| Product `stock='false'` | Persists, but the site tests truthiness of the string `"false"` (which is truthy) → page still shows **"In stock"** |

So the pipeline is real for the DB‑bound bodies, but several "controllable" items are wired to the wrong block, are hardcoded, or are literally un‑editable. This is the concrete basis for "Contradicted" on the 25/25 claim.

---

## 5A. Do the apps and portals actually work? (second‑iteration workflow verification)

The brief asked whether "all the apps or portals are working 100% accuracy". The first pass only screenshotted them; this pass **exercised every workflow** in the sandbox. Headline: the KYC and e‑invoicing engines are genuinely well‑built and their state machines are correct — but several operator‑facing features are broken in the production (PostgreSQL) configuration, and one customer‑facing page renders a raw `{}`.

### 5A.1 KYC onboarding — full lifecycle: **works**

Drafts → autosave → resume → documents → submit → status → staff review → approval, all exercised (`probes/kyc_only.mjs`, `review_flow.mjs`, `finish_flow.mjs`):

| Step | Result |
|---|---|
| Create draft, autosave (PUT), resume with token | **PASS** (48‑char token) |
| Wrong draft token rejected | **PASS** (404) |
| Upload valid PDFs | **PASS** |
| Disguised `.pdf` (PE header) rejected by magic‑byte sniff | **PASS** |
| EICAR test file rejected | **PASS**, but only as "content type unrecognised" — this is the magic‑byte check, **not a virus scanner**. FRS IG‑07/DV‑03 require a real scan; there is none in the codebase. |
| Server‑side validation | **PASS, and genuinely strict** — it refused my first four submissions, listing precise field errors (signatory nationality, authority basis, UBO residence, five missing document types, four declaration consents, typed signature). This is a real strength. |
| Submit → reference issued | **PASS** — `SIM-KYC-2026-10088` |
| Public status with ref+email; wrong email rejected | **PASS** (no IDOR) |
| State machine: approve directly from `submitted` | **PASS** — correctly refused with 409 |
| start → query → applicant responds → approve | **PASS** — full round trip, timeline rendered with timestamps |
| Partner account provisioned on approval | **PASS** |
| Notification e‑mails queued | **PASS** (queued) — but see §8: with no SMTP they are marked `sent` and never leave the box |

**Defect found (customer‑facing):** the partner status page renders **`REVIEWER {}`** — the broken attribution from F‑8 is not merely an internal audit problem, it is printed to the applicant. Screenshot: `evidence/screenshots/flow_status_result.png`.

### 5A.2 Staff KYC console (`admin.html`) — works, but the SLA engine is dead

Logs in, dashboard and queue render, 24 pending submissions listed, record navigation works. But:
- Every queue row reads **"waiting nulld"** (`evidence/screenshots/flow_admin_after_login.png`).
- **AVG CYCLE TIME** shows an em‑dash.
- Root cause is F‑11. Because `slaBreached` can never be true, the SLA tiers, breach badges and escalation that FRS RC‑02 / R‑05 require **never fire** — the console cannot do the one thing the SLA requirement asks of it.

### 5A.3 e‑Invoicing — engine correct, console cosmetics wrong

| Check | Result |
|---|---|
| Partner creates invoice | **PASS** — `SIM-INV-2026-5003` |
| VAT computed server‑side | **PASS** — net 4500.00 / VAT 225.00 / total 4725.00 (5% exact) |
| 3‑decimal unit price rejected | **PASS** (422) |
| Submit | **PASS** |
| UBL 2.1 generated | **PASS** (`customisationID: urn:simal:invoice:phase1:ae` — note this is proprietary, not PINT AE, see §11) |
| Staff validate | **Correctly refused**: `Validation failed: buyer_kyc_approved`. The buyer TRN had no approved KYC record — the guard works as designed. |
| Deliver from `submitted` | **Correctly refused** (409, allowed only from `validated`) |
| Reopen a non‑delivered invoice | **Correctly refused** (409) |
| Cross‑partner invoice access | **Blocked** |
| Partner console | Works; but dates render as raw ISO (`2026-10-11T16:00:00.000Z`) instead of formatted dates |
| Staff console | Works (8 invoices, status filters); but rows show **"nulld"** for age and the BUYER/TRN/PARTNER cells are blank for the new invoice |

Two of the three "FAIL"s in my first automated run were **my test sequencing, not product bugs** — recorded here so the record is accurate.

### 5A.4 Auth — strong primitives, one exploited chain

Reset request returns an identical body for known and unknown addresses (no enumeration); tokens are single‑use (second use → 409); session invalidation on reset works. **But** the raw token is readable from `/api/cms/outbox`, and I used it to complete a full takeover of the reviewer account (F‑12). The shipped `admin@simalme.com / admin123` super‑admin still authenticates (F‑1).

### 5A.5 CMS console buttons — measured, not inferred

I clicked all 48 command‑bar buttons across 12 CMS views and measured whether anything changed (hash, content, modal, network, toast). **35 produced no effect whatsoever.** About 7 of those are informational counter chips rendered as focusable buttons (an accessibility defect in itself); the remaining ~28 are genuinely dead actions, including **"Trigger Build & Purge"** on the publish pipeline, **"Provision Staff User"**, "Add New Slide", "Export Catalog CSV", "Refresh" on nine views, and "Push Live" / "View Public Site" on the announcement and testimonial studios. Working buttons: Save All Slides, Save Announcement, New Testimonial and the block entity filters. Evidence: `data/cms_buttons.json`.

### 5A.6 Mobile

The mobile layout is sound (no horizontal scroll at 390px; a flat 10‑item nav chip row instead of a hamburger, which is acceptable). But **35 tap targets measure under 24×24 px**, directly contradicting the prior report's "All interactive clickable buttons, checkboxes, and chips exceed … 24×24px (desktop) and 44×44px (touch)."

---

## 6. Public content with NO CMS editor (the denominator the prior report omits)

The 25‑row matrix silently excludes the global chrome that appears on **217 of 218 pages**. These have **no CMS control** and are hardcoded in `BaseLayout.astro` / page frontmatter:

- **Header utility bar:** phone `+971 4 393 0507`, `info@simalme.com`, hours, KYC link, EN/AR switch, LinkedIn/Instagram/WhatsApp (`BaseLayout:100‑115`).
- **All 8 mega‑menus + mobile nav + "just landed" promo + category labels/fallback counts** (`BaseLayout:131‑278`).
- **Footer** (columns, addresses, certification strip, legal links, copyright) and the **newsletter strip** (`BaseLayout:286‑370`).
- **Brands** (name/tagline/line) — no write path for the `brands` table at all.
- **Categories / buying guides** — hardcoded; `category_guides` table unused.
- **Product images, specs, `descr`, `product_deep`, create/delete** — the CMS edits only 8 scalar fields; no image upload, no spec editor.
- **SEO**: no per‑page title/description/OG/canonical/hreflang/JSON‑LD CMS fields (and none in output — §9).
- **Home credibility sections:** "24 Years", "40+ Engineers", the fabricated 125‑item RFQ basket widget, the "Dubai Hub Live" fake pulse, the "DISTRIBUTION ERP · LIVE 92%/98%" mock dashboard — all hardcoded.
- **Awards** — hardcoded in 3 places that disagree with each other.
- **`/ar`, `/onboarding`, most of `/resources`, the `/software` hub body, the `/legal` hub** — hardcoded.

**Internal/placeholder strings shipped to the public site** (should never be public):
- `/about/`: "publish at launch per PRD FR‑3.3 (≥4 approved profiles required)." and "content package §02‑06".
- `/sitemap/`: "Mock auth · MFA noted".
- `/contact/`: "Until formally reconciled by management, hours shown follow the default five‑day week".
- PDP: "Arabic product copy arrives with the CMS content team."

**Inconsistent published facts** (same site, different numbers): brand count appears as **21, 22 and 23 simultaneously** on the home page; "24 Years" vs "20+" vs "Two decades"; SKU count 78 (rendered) vs 81 (hardcoded in `/ar` and insights); two different WhatsApp numbers on the **same** RFQ button; "ISO 9001·27001" vs "+ SOC 2"; leadership shows 3 real people but a 4‑person hardcoded fallback with different names. (Full table in the site agent's report; corroborated against `dist`.)

---

## 7. The publish / SSG pipeline (what's real, what's theatre)

**Real:** `POST /api/cms/publish` inserts an `outbox` row (`to_addr='ssg-builder', status='queued'`); a 10s loop in `server.js:118‑157` runs `npm run build` in the site dir and flips the row to `processed`/`failed` and audits `ssg_build_completed`. I reproduced queued→processed in ~18s and saw edits land. Snapshots and audit rows are written.

**Problems:**
- **Hardcoded dev path** `F:/software_project/.../apps/site` in the candidate list (`server.js:136`); in the Alpine Docker image none of the candidates exist → every publish would `fail`. Not container‑portable.
- **No deploy/CDN step.** `nginx/portal-staging.conf` says "Site (SSG) assets are served by the CDN layer," but nothing in the repo copies `dist/` anywhere. A rebuild updates a local folder only.
- **Misleading dashboard counters (F‑9):** "Pending Dispatch" counts `status==='pending'` — a value no code writes (jobs are `queued`); it is permanently 0 while `queued` rows exist. "Processed" mixes e‑mail `sent` rows with site builds. "Last Publish: all published" is derived from the publish *enqueue* audit event, not the build result, so it can read "all published" right after a **failed** build. Live: **3 of 7** historical `ssg-builder` jobs are `failed`.
- The success toast fires on **enqueue**, not on build completion.
- `env: process.env` passes the portal's DB creds/secrets into the build subprocess; no timeout on the child (a hung `npm` wedges all future publishes).

---

## 8. Security & RBAC (prior "100% PASS" — Contradicted)

Reproduced live in the sandbox with role logins (`evidence/data/authz_matrix.json`).

### Critical
- **F‑1 Known‑password super‑admins shipped unconditionally.** `auth.service.js:40‑59` seeds `admin@simalme.com/admin123`, `reviewer@simalme.com/reviewer123`, `partner@simalme.com/partner123`, `mfa.demo@simalme.com/demo123` on every boot — **no `NODE_ENV` guard**. The Docker image runs `NODE_ENV=production` and still seeds them. `login.html:129‑135` and `cms.html:56‑57` display the credentials. Anyone reaching any deployment logs in as super‑admin.
- **F‑2 MFA bypass.** `auth.service.js:86‑89` accepts `123456` whenever `NODE_ENV!=='production'`; `.env` doesn't set `NODE_ENV` (→ development). The login page auto‑fills it.
- **F‑3 Missing role gates.** `adminAuth = [requireAuth(auth)]` (`routes.js:359`) — authentication only. **Proven in sandbox:** a `partner` account got **HTTP 200** on `GET /api/admin/submissions` (all 26 KYC records), `GET /api/admin/submissions/:id` (incl. IBAN, TRN, contact, UBOs, document ids), `GET /api/einvoice/admin/queue` (all 7 invoices), `/api/admin/analytics`, `/api/admin/reports`, and all `/api/integrations/*`. The `partner` role isn't even in the RBAC matrix (`rules.js:24‑28`), yet these handlers never call `can()`. A partner account is auto‑created for every approved applicant.

  *Nuance I verified:* the **report‑builder** PII path (`admin.service.js:189‑254`, no masking, no gate) currently throws `500 "Invalid time value"` on this dataset before returning rows (a date bug), so I could not exfiltrate unmasked IBANs *through that specific endpoint* on this data — but the submission‑detail endpoint already returns the IBAN in the clear to a partner, and `KYC document download` (`routes.js:448`) has no role gate (it returned 500 ENOENT only because the files are absent in this environment, not because access was denied). The authorization defect is real regardless of the date bug.

### High
- **F‑8 Audit attribution destroyed.** Every `/api/cms/*` write stores actor `system` (the service reads `session.user.email`, but `requireAuth` only populates `{sid, role, userId}` — `auth.service.js:140`). Every KYC review action stores `[object Promise]`/`{}` because `actorName()` is `async` and never awaited (`review.service.js:146‑150, 78, 83`). Live DB: 17/17 revision rows and all `cms_*` audit rows = `system`; 9 workflow audit rows = `{}`. For a KYC/compliance system this defeats the "who changed what" guarantee.
- **Information exposure → escalation.** `GET /api/cms/outbox` and `/api/admin/outbox` return each e‑mail's full `body`, and password‑reset / verification e‑mails put the **raw token** in that body (`routes.js:183‑189, 301‑307`). A reviewer could request a super‑admin reset and read the token. (No such rows exist yet — latent.)
- **Login throttling is racy and unwrapped.** `/api/auth/login` has no `limited()` wrapper; the brute‑force guard reads a module‑scoped `ipOfReq` set per‑request (`routes.js:29‑33,143`), so concurrent logins cross‑contaminate buckets. `X-Forwarded-For` is trusted unconditionally (`routes.js:18`).
- **Integrations are stubs presented as real (H4).** With no SMTP configured (the shipped state), `notify.send` marks every e‑mail **`sent` via 'outbox'** — nothing is transmitted (`notify.service.js:70‑77`). Password‑reset links, KYC decisions and partner temp passwords deliver nowhere. Peppol ASP `deliver()` flips invoices to `delivered` with no transmission while the UI shows "Delivered via Peppol". The "worker drains the outbox" comment in `integration.service.js` has no corresponding worker.

### Medium
- **Reviewer can rewrite public legal/marketing content** and trigger publishes (`notes` perm ∈ reviewer); the dual‑approval `emergencyPublish` exists but is **not routed**.
- **CSRF rests on `SameSite=Strict` alone** (no tokens / Origin checks); `readJsonBody` accepts any content type; bodies up to 26 MB on every write.
- **Invoice immutability** is enforced by a DB trigger, but the service allows `reopen` from `delivered` → in PG that raises the trigger as a 500; in JSON mode there's no enforcement.
- **Stored‑XSS surface to the public site:** hero `cta_href` and announcement CTA flow into `innerHTML`/attributes with only quote‑escaping; a stored `javascript:` URL would be clickable. The **public site has no CSP** (only the portal does). Mitigated by the `notes`‑role gate on writes, but it is a real chain if F‑1/F‑3 are used.

### Sound (credit)
scrypt (N=16384), RFC‑6238 TOTP with single‑use challenges, hashed single‑use reset tokens, server‑side idle (20m)+absolute (12h) session expiry, logout/destroyAll, strict portal CSP + HSTS + X‑Frame‑Options DENY + nosniff, SSRF‑guarded webhook client, fully parameterised SQL, and `pg_hba.conf` is loopback‑only `trust` on a dev rig (acceptable locally; must change for prod).

**pg_hba/role note:** the app role `simal` is **superuser** on the dev cluster (`rolsuper=t`) and `pg_hba.conf` uses `trust` — fine for a local rig, unacceptable in production; the DPIA/security docs should not imply otherwise.

---

## 9. Accessibility (prior "100% PASS / 92‑98%" — Contradicted)

Measured on the live site with Playwright (`evidence/data/browse_all.json`) and a contrast scan (`probes/contrast_scan.cjs`):

- **Home page has 0 `<h1>` in the server HTML.** Five `<h1>`s are injected by JS per hero slide (so screen readers on the no‑JS/SSR view get none, and JS users get **five**). The prior report's "single descriptive `<h1>`" is actually the `<title>`.
- **No skip link exists anywhere** (0/218 pages) — the prior report claims "skip‑to‑content links … respond to keyboard activation."
- **Heading‑level jumps on ~194 pages** (e.g., catalogue goes `<h1>`→`<h4>`; footer `<h3>`→`<h5>`; `/onboarding` has `<h2>` before `<h1>`).
- **Measured contrast failures on every sampled page** (WCAG 1.4.3): gold section labels `#A5791B`‑class on light grey render **3.71–3.95:1**; the muted `#94A3B8` body note is **2.56:1**; the green "In stock" is **3.95–4.36:1**; footer copyright **4.47:1**. The prior report's own numbers are also arithmetically off (its "8.6:1" gold pair is 7.27:1; its "2.8:1" muted is 2.56:1) **and** several colours it "measured" aren't used by the public site at all — it graded the portal CMS, not the website.
- **Invisible modals keep keyboard focus:** closed dialogs are only `opacity:0; pointer-events:none` and keep `role="dialog" aria-modal="true"`. I tabbed into the hidden Quick‑Create modal **41 times in 120 Tab presses** (`probes/tab_probe.cjs`). The `trapFocus` utility captures focusables once and attaches its key handler to the backdrop only.
- **Careers form inputs lack `<label for>`**; the catalogue sort "chips" are non‑focusable `<span>`s; two elements share `id="q"` so the on‑page search box is inert; the hero and testimonials auto‑rotate with no pause control (WCAG 2.2.2).

There is real accessibility *intent* (alt text everywhere, visible focus rings, reduced‑motion handling, ARIA landmarks), so a realistic score is "partially conformant with multiple AA gaps," **not** 100%.

---

## 10. Database forensics (read‑only)

- **Exact counts** match the prior report's headline figures: products 78, product_deep 78, brands 22, hero_slides 5, legal_policies 7, content_blocks 109, testimonials 3, announcements 1, cms_revisions 17, users 17, submissions 26, invoices 7, audit_log 340, outbox 58. (So the *inventory* claims are **Confirmed**.)
- **Server is PostgreSQL 16.9**, not 17.
- **Immutability triggers** present on `invoices`/`invoice_lines` (good). FK delete rules: `invoice_lines`→`invoices` and `rfq_items`→`rfqs` are `CASCADE` (acceptable); others `NO ACTION`.
- **Rollback blast radius (data‑integrity High):** `content_blocks` rollback runs `UPDATE … WHERE entity_id=$4` with **no entity/lang filter** (`cms.service.js:151`), and **21 entity_ids are shared across entities** (`univat` spans 3). One rollback overwrites 2–3 unrelated records and mixes their histories.
- **Test‑fixture pollution in the live DB:** products `1672` and `crucial-t705-ssd-2` ("…Enterprise Hardened"), submissions/outbox rows to `dup1@example.com`, `journey@example.com`, `rbac@example.com`, future‑dated audit activity, and 9 audit rows with actor `{}`. Shared dev/test data is sitting in what the docs call "Production."
- **Sequence‑sync tool** uses `MAX(${column_name})` / `setval('${seqName}', …)` string‑interpolation of identifiers (`sync-sequences.mjs:21‑23`) — works, but it's the anti‑pattern the rest of the codebase avoids, and the drift recurs.

---

## 11. Requirements traceability (high‑level)

Two separate problems: (a) the as‑built product diverges from the requirements, and (b) **the requirement documents contradict each other**, so "done" is undefined in places.

**As‑built vs requirements — notable gaps:**
- **Stack:** PRD §13.1 recommends (and BRD budgets) **headless CMS + Next.js**; SRS mandates **Next.js 15 + FastAPI/Python**. As‑built is **Astro SSG + Node + bespoke CMS**. No doc specifies Dynamics 365. Password hashing is scrypt (FRS says bcrypt/argon2id; SRS says Argon2id).
- **CMS workflow:** FRS‑RC‑11 and the CMS Guide require draft → review → compliance sign‑off → scheduled publish, 10‑revision rollback, bilingual. As‑built: "every PUT publishes," no draft/scheduling, English‑only editors.
- **Public signup / one partner account:** FRS‑A‑01/08 — **not built** (CRTM admits GAP‑A1).
- **Arabic:** launch gate requires full EN+AR journeys incl. the KYC wizard; as‑built `/ar` is a single hardcoded page and the portal is EN‑only.
- **KYC:** `/partners/onboarding` wizard, 7 steps, autosave, resume, document vault with virus scan — the public site's `/onboarding` is a **hardcoded mock** that POSTs a summary (no addresses/bank/IBAN/docs) to `/api/contact` and shows a **client‑random `KYC‑2026‑###` reference** with "Confirmation sent" regardless of result. The **real** KYC wizard (`portal/public/form.html`) is never linked from the public site ("Become a Partner" → `/onboarding`, and Sign‑in → external `kyc.simalme.com`). Upload handling in the real portal does magic‑byte sniffing but there is **no virus scanner** (FRS IG‑07/DV‑03) and the "AES‑256 at rest / signed URLs ≤15 min" requirement is not met (files are plain bytes under `data/uploads`).
- **Careers:** FRS J‑04 requires a CV upload (PDF/DOC, ≤5 MB, virus‑scanned); the public form has **no file field** and fakes success.
- **SEO:** sitemap present (189 URLs) but **missing** brands/resources/compare/onboarding/ar; **no canonical, hreflang, OG, or JSON‑LD on any of 218 pages**; `lastmod` is the build date for everything.
- **Consent/analytics:** no cookie‑consent banner; GA4 strings appear but there is no `gtag`/`dataLayer`/`analytics/track` call wired from the site.

**Document‑vs‑document contradictions (sample):** brand count 23/22/20/"≥18"; SKU 76 vs split summing to 83 vs built 78/81; RFQ reference format differs across four docs; KYC 7 steps vs 5; 2 tracks vs 3; staff MFA mandatory vs optional; session 30m vs 20m; WCAG 2.1 vs 2.2; uptime 99.9 vs 99.95; e‑invoicing "Phase 2, flag‑off" vs "shipped 5 Oct 2026." The SRS sign‑off block is dated **before** the BRD/PRD it ratifies and signed by a "Group" the SRS itself disowns. Several `Project_doc` go‑live/hypercare/Peppol files are **future‑dated (Dec 2026)** templates with blank signatures — none evidences an actual go‑live. (Full matrix in `evidence/data/` requirements extract.)

---

## 12. End‑to‑end wiring matrix (reproduced)

| Flow | UI | API | DB write | Worker/rebuild | Public result | Verdict |
|---|---|---|---|---|---|---|
| CMS edit → public page (DB‑bound bodies) | ✓ | ✓ | ✓ (+revision) | ✓ rebuild | ✓ appears | **Wired** |
| CMS edit → hub grids / stats / brands / `/ar` | ✓ | ✓ | ✓ | ✓ | ✗ (hardcoded) | **Not wired** |
| Announcements create/delete | partial | row 1 only | row 1 | ✓ | partial | **Partial** |
| Rollback | button | ✓ | newest‑only, unscoped | ✓ | risky | **Unsafe** |
| Public RFQ basket+submit | ✓ | ✓ (needs `/api` proxy) | ✓ `rfqs` | — | ✓ ref + staff queue | **Wired only with a proxy the repo doesn't ship** |
| Public contact / newsletter / careers / demo / KYC | ✓ | 404/501 on static host | ✗ | — | **fake success** | **Broken (masked)** |
| KYC review → audit actor | ✓ | ✓ | ✓ | — | actor `{}` | **Broken attribution** |
| Partner reads others' KYC/invoices | — | **200 (should be 403)** | read | — | PII exposure | **Security defect** |
| Email/Peppol "delivery" | ✓ | marks sent | outbox row | — | nothing transmitted | **Stub** |

---

## 13. Recommendations & remediation roadmap

**P0 — before any deployment (blocking):**
1. Remove the unconditional dev‑account seeding (F‑1) and the `123456` MFA bypass (F‑2); gate both behind an explicit, default‑off dev flag; strip credential hints from `login.html`/`cms.html`. *Acceptance:* a production boot creates only the env‑configured admin; no literal password anywhere; login page shows no credentials.
2. Add role gates to **every** `/api/admin/*`, `/api/einvoice/admin/*`, `/api/integrations/*`, and `/api/admin/documents/:id` route; add a CI test that logs in as `partner` and `viewer` and asserts 403 (F‑3). *Acceptance:* the authz matrix shows 401/403 for anonymous/partner/viewer on every admin route.
3. Fix from‑scratch provisioning (F‑4): add `cta_label` and remove `category_slug` drift in `migrate.sql`; seed announcements/testimonials/featured‑products/careers‑roles in `seed.sql`; add a CI job that does **clean migrate+seed+build** and fails on any missing column. *Acceptance:* a brand‑new DB builds 218 pages green.
4. Fix audit attribution (F‑8): populate `req.session.user` (email/name) in `requireAuth`; `await actorName()`. *Acceptance:* new CMS/review actions record the real actor; backfill note added.
5. Decide and ship the production topology for `/api` (F‑6): the public site's relative `/api/*` calls need a reverse proxy to the portal, or the forms must point at an absolute portal origin with CORS. Until then, stop the forms from showing success on failure. *Acceptance:* a failed submit shows an error; a successful submit is visible in the DB/outbox.
6. Fix the snake_case leak (F‑11): apply `camelize()` in `submissions.all()`/`get()` as `rfqs`/`invoices` already do, **and** add a PG‑mode test that asserts a non‑null `ageDays`, a `slaBreached=true` case, and a 200 from `/api/admin/export.csv` and `/api/admin/reports/build`. *Acceptance:* the staff queue shows real ages, a >1.5 bd submission is flagged, and both exports download.
7. Close the outbox token leak (F‑12): never store raw tokens in the outbox body (store a reference or redact), and restrict outbox body visibility to `view_pii`. *Acceptance:* a reviewer cannot obtain a reset token for another account.

**P1 — before UAT:**
8. Fix the ~40 broken links (F‑7): `site/solutions5` needs `targetId`; `/legal` hub slugs; sitemap category/anchor targets; `/careers` must read `site/careers-roles` and the seed must match.
9. Fix the CMS command bar (F‑13): give every button config an `id` (or bind by index) and add a smoke test that asserts each command‑bar button produces an effect. Remove the counter chips from the `<button>` role.
10. Stop rendering `{}` to customers: the status page must show a reviewer name or omit the field entirely.
11. Make the CMS edit what the site reads: point the AMC view at `site/amc-tiers` (retire `amc/tiers`); allow `site/*` string/array payloads (or change those blocks to objects); make `stock` a boolean end‑to‑end so "Out of stock" renders.
12. Scope `content_blocks` rollback by `(entity, entity_id, lang)` and snapshot the pre‑rollback state (§10).
13. Remove internal/placeholder strings from public output; reconcile the brand/SKU/years/WhatsApp/awards numbers to one source (ideally CMS `site/counters` + `site/awards`, then actually render them).
14. Fix the publish dashboard counters and the hardcoded build path; add a real deploy/publish‑to‑CDN step or document that rebuild ≠ deploy.
15. Replace integration stubs or label them clearly; wire SMTP; make "Delivered via Peppol" conditional on a real transmission.

**P2 — before go‑live:**
16. Accessibility: emit a server‑side `<h1>` per page; add a skip link; fix heading order; raise the gold/muted/green text colours to ≥4.5:1; enlarge the 35 sub‑24px tap targets; add pause controls; fix the duplicate `id="q"`, chip focusability, and the invisible‑modal focus trap (use `hidden`/`inert`).
17. SEO: add canonical + hreflang (EN/AR) + OG + JSON‑LD + fix the sitemap coverage and `lastmod`.
18. Cookie‑consent banner + consent‑gated analytics; wire the GA4 events the PRD lists.
19. Build the real KYC/careers flows into the public journey (CV upload, virus scan, encrypted storage, signed URLs) or clearly route users to the portal wizard; stop the mock `/onboarding` from issuing fake references.
20. Clean test‑fixture rows out of the production DB; move the app DB role off superuser; replace `trust` auth.

**P3 — hardening:** reconcile the requirement documents to a single ratified baseline (stack, counts, RFQ/KYC formats, MFA, sessions, WCAG version); add CSP to the public site; add CSRF tokens; add a child‑process timeout to the SSG build; move the portal out of the NTFS junction for clean packaging.

---

## 14. Revised scorecard vs prior

| Dimension | Prior | Independent |
|---|---|---|
| Component connectivity (CMS ↔ public) | 100% | **~45% effective** (DB‑bound bodies yes; chrome/brands/specs/`/ar`/SEO/stats no) |
| CMS control authority | 100% | **Partial** — real for ~5, partial ~14, broken/absent ~6 |
| Dynamic interaction (RFQ/contact) | 100% | **Backend yes; shipped topology no** (forms fake success) |
| Micro‑revisions & rollback | 100% | **Snapshots yes; rollback unsafe/unscoped** |
| Portal security, RBAC, sessions | 100% | **Fail** (Critical F‑1/F‑2/F‑3) |
| WCAG 2.1 AA | 100% | **Fail** (multiple AA gaps; wrong product measured) |
| SSG publish worker | 100% | **Runs; not deployable/portable; misleading metrics** |
| Fresh provisioning | proven | **Fails** (`cta_label`) |
| KYC onboarding app (engine + state machine) | implied 100% | **Works end‑to‑end** — strong server‑side validation; `{}` reviewer leaks to the customer |
| e‑Invoicing app (engine + guards) | "shipped" | **Works end‑to‑end**; correct VAT, UBL, and lifecycle guards; console cosmetics broken |
| Staff review console / SLA engine | implied 100% | **Fail** — SLA age `null`, breach never flagged, reports + CSV export 500 (F‑11) |
| CMS console operability | implied 100% | **Fail** — 35/48 command‑bar buttons inert (F‑13) |
| Overall "production certified" | **Yes** | **No — not production‑ready** |

---

## 15. Appendix — environment, reproduction, cleanup

**Live processes observed:** PostgreSQL 16.9 (`:5433`, data under `Codebase/tools/pgdata`), portal `node src/server.js` (`:8090`), public site `python -m http.server 8100` (serving `apps/site/dist`), prototype `serve_prototype.py` (`:8000`, **directory‑listing of the whole workspace** — it exposes `Codebase/apps/portal/.env`; shut it down).

**Reproduce the probes:** scripts are in `evidence/probes/` and point at the ports noted inside them. The authz matrix, CMS→site E2E, crawl, contrast scan, fake‑success and tab‑trap probes are each self‑contained Node/Playwright scripts.

**Isolation & cleanup performed:** read‑only `pg_dump` of the live DB → restored to a throwaway cluster on `:55433`; all writes/rollbacks/publishes/authz/workflow probes ran there; sandbox portal `:18090` and static+proxy `:18100` started and **stopped** (both iterations); the scratch cluster was **stopped and its directory (incl. the DB copy and a copied `.env`) deleted** at the end of each iteration. Every mutation in this report — the 20 CMS edits, the KYC application `SIM-KYC-2026-10088`, the invoice `SIM-INV-2026-5003`, the reviewer password reset — happened **only in the throwaway copy** and no longer exists anywhere. On the live DB I left only 3 benign auth audit rows from throwaway logins; I wrote/published/rolled‑back **nothing** on it. The original Audit files were left untouched; this report and its evidence are added under `Audit/Independent_Forensic_Audit_2026-10-12/`.

**Residue deliberately left:** none in temp. The 3 live‑DB auth audit rows (2026‑10‑12 ~06:47 GST) are expected and harmless.

---
*Prepared as an independent, evidence‑based validation. Every "Contradicted"/"Fail" above is reproducible from the scripts and transcripts in `evidence/`. Corrections made during the audit are noted inline (e.g., the report‑builder PII path throws a 500 on this dataset rather than returning rows, so that specific exfiltration was not completed live even though the authorization gap is real).*
