# Simal Corporate Platform — Independent Forensic Audit and Validation of the External Audit Pack (12 October 2026)

## Document control

| Item | Detail |
|---|---|
| Date | 12 October 2026 (fieldwork approx. 10:30–12:30, UTC+8) |
| Prepared for | Simal Technologies Middle East: project owner, engineering leads and the external audit party |
| Prepared by | Independent AI-assisted review (Claude, Anthropic), performed at the project owner's request. Every finding is backed by a file:line reference, a read-only SQL result, an HTTP transcript or a browser capture. Four parallel code-review agents were used; their serious claims were re-verified before inclusion, and claims resting on static analysis only are labelled as such. |
| Documents validated | `Audit/FORENSIC_CMS_PUBLIC_SITE_AUDIT_REPORT.md`, `Audit/COMPONENT_CONNECTIVITY_MATRIX.md`, `Audit/ACCESSIBILITY_WCAG_AUDIT.md`, `Audit/E2E_VERIFICATION_EVIDENCE.json` and `Audit/evidence/*`. All are dated 12 Oct 2026 and authored by "Antigravity Forensic Engineering". |
| Systems examined | **Public site:** `Codebase/apps/site` (Astro 5 SSG; 218 pages; `dist` built 12 Oct 10:35).<br>**Portal / CMS / KYC / e-invoicing API:** `F:\software_project\Sofoware_project_04\portal`, reached through the NTFS junction `Codebase\apps\portal`.<br>**Database:** PostgreSQL 16.9 on 127.0.0.1:5433, database `simal`.<br>**Requirements:** `Primary_doc/` (BRD, PRD, FRS, URD, SRS) and `Project_doc/`. |
| Version control | **None.** There is no git repository for the workspace, for `Codebase`, or for the portal. The state audited is the working tree as it stood on 12 Oct 2026. |
| Original audit files | Not modified. This report and its evidence are in `Audit/Independent_Forensic_Audit_2026-10-12/`. |

Evidence tags used throughout:
- **[L]** — live, read-only probe of the running environment
- **[S]** — reproduced in an isolated sandbox (a copy of the DB, portal and site)
- **[C]** — source code (`file:line`)
- **[D]** — read-only SQL against the live database
- **[V]** — browser or visual capture

Credentials and personal data are masked: at most the first 4 characters plus the length are shown.

---

## 1. Executive summary

### Verdict

The external pack's headline is **not supported by the evidence**. That headline reads: *"COMPLETE, FULLY REMEDIATED & PRODUCTION CERTIFIED (100% PASS)"*.
- **None of the 10 scorecard lines holds as stated.**
- Four are contradicted outright: CMS control authority, rollback integrity, portal security/RBAC and WCAG compliance.
- The other six are only partially true.

The platform is **not production-ready**. Because of the authorization and credential findings below, it should **not be exposed to external partners** in its current state.

The platform is nonetheless substantially built, and much of it genuinely works:
- The static site renders reproducibly from PostgreSQL.
- The CMS → publish → rebuild loop works on this host for most content types.
- The RFQ engine works end to end when its API is reachable.
- The core security primitives are sound: password hashing, TOTP, session expiry, parameterised SQL and the portal's security headers.

The defects are concentrated in seven areas:
- authorization
- audit attribution
- deployment wiring
- CMS coverage and governance
- honesty of the public site's UI (false "success" messages and fabricated data)
- accessibility
- build reproducibility

### Readiness by layer

| Layer | Score /10 | Rationale |
|---|---|---|
| Public website: rendering and content | 5 | 218 pages build in about 8 s. Against that: 30 broken internal links, 26 orphan pages, contradictory facts (the home page states 21, 22 and 23 brands), published internal notes and fabricated widgets. |
| Public website ↔ backend wiring | 3 | RFQ works only when `/api` is same-origin proxied, and no such route exists in either the audited or the documented production topology. Three public forms report false success. |
| CMS control of the public site | 4 | 15 of 20 content paths tested end to end reach the site. Header, menus, footer, brands, categories, product specs/images, SEO, Arabic, stats and awards have no editor, and several editors are broken. |
| CMS governance (revisions, rollback, audit) | 2 | Every change is attributed to `system`. Rollback is unscoped and one-step only, and product rollback is a silent no-op. There is no draft/review/schedule workflow. |
| KYC / partner / staff portal security | 2 | A partner can read every KYC record, including unmasked IBANs. A super-admin with a literal password is advertised on the public login page. The running instance has an MFA bypass. |
| KYC operations | 4 | The wizard and state machine are sound. The master CSV export and report builder crash in PostgreSQL mode, and no KYC document file exists on disk. |
| Accessibility (WCAG 2.1 AA) | 4 | Alt text and form labels are mostly fine. Heading structure, skip links, contrast and CMS dialog focus fail. |
| SEO | 3 | No page has canonical, hreflang, Open Graph or JSON-LD tags. The sitemap misses 29 pages. There is no custom 404 page. |
| Build / CI / deployment | 2 | There is no version control. A fresh environment built from the repo scripts cannot build the site. CI cannot run (and would fail if it did). There is no deploy step. |
| Test assurance | 3 | 70/70 portal tests pass, but none of them exercises the failing behaviours (RBAC denial, CMS, PostgreSQL-mode exports, the site). |

### Top 10 findings

| # | ID | Severity | Finding | Evidence |
|---|---|---|---|---|
| 1 | SEC-01 | **Critical** | Any authenticated **partner** account can list and open every KYC submission. The record includes the **raw IBAN**, sent alongside a cosmetic `iban_masked` field, plus mobile numbers, signatories and UBOs. The same account can read every partner's invoices. | [S] §5.1; [C] `routes.js:359, 362, 373, 384, 405` |
| 2 | SEC-02 | **Critical** | Four accounts with **literal passwords in source** (two of them super-admins) are created on every boot, in every environment including the production image. The public partner login page offers them as one-click buttons, and the CMS login screen prints them. | [C] `auth.service.js:41-59`, `login.html:129-135`, `cms.html:56-57`; [V] `partner_login.png`, `portal_cms_login.png` |
| 3 | SEC-03 | High | A fixed six-digit **MFA bypass code** is accepted whenever `NODE_ENV ≠ production`, and the running portal has `NODE_ENV` unset. 7 of the 9 active super-admins (several of them test accounts) have no MFA. | [C] `auth.service.js:86-89`; [L] log `env:"development"`; [D] `users` |
| 4 | DATA-01 | High | **The audit trail cannot identify who did what.** Every CMS write, rollback and publish is logged as `system` (17 of 17 revisions). Nine KYC decisions (approve, reject, reopen, …) are logged with actor `{}`. | [D]; [C] `auth.service.js:140` vs `cms.service.js:46…`; `review.service.js:78, 83, 146-150` |
| 5 | WEB-01 | High | The public site's forms call relative `/api/*` URLs. On the audited site (:8100) these return 404/501, and the external auditors' own server log shows this. The documented production topology defines **no** `/api` route for `simalme.com`: nginx fronts only `kyc.simalme.com`, and the site is served from a CDN. | [L] 196 of 202 pages log `404 /api/rfq-basket`; `Codebase/site_8100.log`; `infra/nginx/portal-staging.conf` |
| 6 | WEB-02 | High | **The partner-onboarding funnel is disconnected.** All 218 pages send "Become a Partner" to a client-only wizard. It invents a random reference (`KYC-2026-1500…1999`) and tells the applicant "Submitted … confirmation sent", but no KYC record, document or e-mail is ever created. No page links to the real KYC wizard. | [C] `onboarding/index.astro:354-394`; grep of `dist` |
| 7 | OPS-01 | High | A fresh environment built from the repo's declared source of truth (`scripts/migrate.sql` + `seed.sql`) **cannot build the public site**: `column "cta_label" does not exist`. The "remediation" exists only in the live database. With no version control, CI can never have run. | [S] `evidence/logs/build_fresh.log`; `migrations/README.md` |
| 8 | CMS-01 | High | Editor defects (≈20 visible content areas also have no editor at all):<br>• The AMC view edits a block the site never reads.<br>• Mission/vision cannot be saved (422).<br>• The legal-policy editor shows every body empty.<br>• "Out of stock" never appears on the site.<br>• Announcement history never renders. | [S] §5.3; [V] `cms_policies.png`; [C] |
| 9 | DATA-02 | High | **Rollback is unsafe.**<br>• A block rollback overwrites every block that shares the `entity_id`; 21 ids are shared.<br>• It goes back one step only.<br>• Product rollback silently does nothing yet reports success: the external audit's "State Restored — PASS" left its own test rename live. | [C] `cms.service.js:144-175`; [D] |
| 10 | KYC-01 | High | The KYC master CSV export and the report builder return **HTTP 500 for every role** in PostgreSQL mode. No KYC document file exists on disk, so every document download fails. The intake also accepts document entries that carry no file at all. | [S] §5.1; [C] `pg-repos.js:282`, `analytics.service.js:83`, `kyc.service.js:65-66`; [L] empty `portal/data/uploads` |

### What genuinely works (credit)

**Public site and CMS publishing**
- Build-time PostgreSQL rendering is real and reproducible: from a snapshot of the live DB, the site rebuilt 218 pages in about 8 s [S].
- The CMS → publish → SSG rebuild chain works on this Windows host. 15 of 20 content paths updated the public pages within about 18 s of publishing [S].
- Testimonials have full CRUD, and slide, announcement, product, policy and block writes persist with revision snapshots [S].
- Every `<img>` has `alt` text, there is no horizontal overflow at 1440 px, the mobile layout and mega menus render, and `/products#category` deep links filter correctly [V].

**RFQ, KYC and e-invoicing**
- The RFQ engine works whenever `/api` is reachable: basket cookie, server-side validation, the `SIMAL-RFQ-YYYYMMDD-NNNN` reference, persistence and the staff queue. A UI journey returned `201` with reference `SIMAL-RFQ-20261012-1005` [S].
- Invoice immutability is enforced by DB triggers, and a partner cannot open another partner's invoice by id (403) [D][S].
- The KYC state machine prevents approval without review (`rules.js:35-42`) [C].

**Security controls**
- Authentication primitives are sound [C]:
  - scrypt password hashing
  - RFC 6238 TOTP with single-use challenges
  - hashed, single-use reset tokens
  - server-enforced idle (20 min) and absolute (12 h) session expiry
  - an HttpOnly, SameSite=Strict session cookie
- SQL is fully parameterised; no injection path was found. The CMS client escapes DB text before `innerHTML` in nearly every sink. The portal sends a strict CSP, HSTS, `X-Frame-Options: DENY` and `nosniff` [C][L].
- Document downloads resolve only a basename inside the uploads directory, with a containment check (`pg-repos.js:213-217`). Uploads are verified by magic bytes [C].

**Quality and data**
- 70 of 70 portal unit and integration tests pass [S].
- The DB row counts quoted by the external audit are accurate [D].

---

## 2. Validity of the external audit, claim by claim

Verdicts:
- **Confirmed** — the claim holds as stated.
- **Partially true** — part of the claim holds; the rest does not.
- **Not reproducible** — no trace of the claimed result exists.
- **Contradicted** — the evidence shows the opposite.
- **Misleading** — the number is right but the implication is wrong.

### 2.1 Scorecard (`FORENSIC_CMS_PUBLIC_SITE_AUDIT_REPORT.md` §1)

| # | Claim | What we found | Evidence | Verdict |
|---|---|---|---|---|
| 1 | Core component connectivity (Public site ↔ PostgreSQL): 100% PASS | Build-time reads are real for: the catalog, slide text, testimonials, insights, legal pages, software and solution detail pages, and 13 `site/*` blocks.<br>Hardcoded:<br>• the site chrome on 217 of 218 pages (utility bar, 8 mega menus, newsletter, footer, trust badges)<br>• home stats and awards<br>• the About body<br>• the Arabic page<br>• several hub pages | [C] `BaseLayout.astro:100-370`; `index.astro:24-125, 251-301, 400` | Partially true |
| 2 | CMS console control authority: 100% PASS | 15 of 20 content paths tested reach the site and 5 fail. About 20 content areas have no editor at all. | §5.3, §7 (CMS) | **Contradicted** |
| 3 | Dynamic interaction pipeline (RFQ and contact): 100% PASS | On the audited site, the API calls fail; their own `site_8100.log` shows `GET /api/rfq-basket 404` and `POST 501`. The flow works only when proxied (sandbox). Contact "e-mails" are never transmitted because no SMTP is configured.