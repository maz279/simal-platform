# Roadmap v1.1 → v1.2 Forensic Verification Ledger

**Subject:** `IMPLEMENTATION_ROADMAP_CLEAN_AUDIT.md` v1.1 (16 Oct 2026, 98 tasks). The v1.1 copy is archived at `archive/IMPLEMENTATION_ROADMAP_CLEAN_AUDIT_v1.1.md`.

**Method:** read-only verification, 16 Oct 2026, of every file path, line reference, "current code" claim, code snippet and Done-when command in v1.1. Each was checked against:
- the working tree `Codebase/` (HEAD `8011ab0` + 73 modified / 92 untracked files);
- the live rig: PostgreSQL 16.9 at :5433 (SELECT only), portal at :8090 and edge at :8100 (GET only).

Four parallel verifier passes covered Phases 3+6, 4+5, 7+8 and 9+10+VCS. A lead pass covered Phases 1.1 and 2 and spot-checked every agent claim before it was accepted. Behaviour was tested where it could be done safely: SQL syntax on the rig, `fs.cpSync` semantics in a scratch directory, psql variable expansion, gitleaks on the tree and on history, and the SLA loop in a simulation.

**Severity scale:**
- **B (blocker)** — the snippet or command would fail as written, or would not close the finding.
- **E (error)** — wrong fact, path, line, name or claim.
- **G (gap)** — required work missing.
- **M (minor)**.

**Totals: 209 defects — 48 B · 76 E · 61 G · 24 M.** In addition there are **14 live code defects** that no prior audit document recorded (§L). Every row is corrected in v1.2 at the task named in the last column.

| Phase | B | E | G | M | Total |
|---|---|---|---|---|---|
| General / how-to | 0 | 3 | 0 | 2 | 5 |
| 1 Stabilize & VCS | 8 | 10 | 7 | 2 | 27 |
| 2 Security | 9 | 7 | 6 | 0 | 22 |
| 3 XSS & CSP | 3 | 5 | 6 | 1 | 15 |
| 4 CMS | 7 | 12 | 11 | 6 | 36 |
| 5 Publish & deploy | 3 | 5 | 4 | 1 | 13 |
| 6 Site truth | 6 | 6 | 7 | 0 | 19 |
| 7 Data & runtime | 5 | 8 | 10 | 1 | 24 |
| 8 Apps & compliance | 3 | 7 | 5 | 5 | 20 |
| 9 Test/CI/observability | 3 | 9 | 2 | 1 | 15 |
| 10 Clean-audit gate | 1 | 2 | 2 | 2 | 7 |
| §11–13, tracker, evidence | 0 | 2 | 1 | 3 | 6 |
| **Total** | **48** | **76** | **61** | **24** | **209** |

---

## General / "How to use"

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-01 | E | How-to | Says "VCS work must land before everything else", but Milestone 1.1 (edits to `server.js`/`db.ts`) is ordered before the 1.2-1 snapshot, and `server.js` is already modified | Phase 1 execution order |
| V-02 | E | Golden rule 3 | `cd apps/portal && node --test …`: `&&` is invalid in Windows PowerShell 5.1; the command omits the root suites (`account-services`, `token-exchange`, `peppol-sandbox-roundtrip`, `rfq`) and new `integration/*.test.js` files; `npm test` already exists | How-to rule 3 |
| V-03 | E | Golden rule 1 | Evidence goes to `scratch/rm-evidence/`, but `scratch/` is untracked and not ignored, so it breaks "git status empty" | 1.2-0 `.gitignore` |
| V-04 | M | How-to | ID format inconsistent (`RM-1-3-1` vs `RM-1.3-1`); "Portals of the rig" should read "Ports" | How-to |
| V-05 | M | How-to | "Do not start a phase before the previous…" contradicts §11 ("Phases 4–6 tolerate overlap") | How-to + diagram |

## Phase 1

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-06 | B | 1.1-1 | Both npm-cli.js candidates (`apps/site/node_modules/npm`, `Codebase/node_modules/npm`) do not exist. `apps/site/node_modules` is empty and npm exists only beside `node.exe` (`tools/node/node_modules/npm`). The fix always throws "not found" | 1.1-1 (Astro CLI via `createRequire`) |
| V-07 | M | 1.1-1 | Comment says "SEC-10/P8-1" but SEC-10 is P8-3; the CVE range "Node ≥ 20.12" is imprecise (18.20.2 / 20.12.2 / 21.7.3) | 1.1-1 |
| V-08 | G | 1.1-1 | The 60 s timeout has never been validated: no `processed` row carries the current worker's `{durationMs}` meta, and the clean-DB gate allows 420 s | 1.1-1 (`SSG_BUILD_TIMEOUT_MS`) |
| V-09 | G | 1.1-2 | The env strip is a 10-name denylist; `DOC_ENCRYPTION_KEY`, `WEBHOOK_SECRET`, `SMTP_PASS`, `VIEWER_PASSWORD`, `ASP_SHARED_SECRET`… reach the build, so the Done-when "no portal secrets" would fail | 1.1-2 (allowlist) |
| V-10 | B | 1.1-2 | `simal_build` SQL is not idempotent; `ALTER DEFAULT PRIVILEGES` lacks `FOR ROLE simal`; 7.1-1 never passes `-v build_password` | 1.1-2 |
| V-11 | E | 1.1-2 / R-2 | Cites `db.ts:9-12`; the fallback is line 8 (pool lines 7–11) | 1.1-2 |
| V-12 | B | 1.1-3 | Snippet uses `npmCli`, which is block-scoped inside 1.1-1's `if` (ReferenceError); 1.1-1's "not found" `throw` sits outside the guarded block, which recreates the queue jam | 1.1-3 |
| V-13 | G | 1.1-3 | Job claim is non-atomic (`SELECT … LIMIT 1`), so a second instance double-builds; a rejection in the `execFile` callback is unhandled (Node 24 terminates; no process handler) | 1.1-3 (advisory lock + try/finally) |
| V-14 | E | 1.1-4 | Says `supervisor.cmd` "restarts portal": it only starts a portal whose health check fails, and `> server.log` truncates the log (the EINVAL history was already lost on 16 Oct 06:28 UTC) | 1.1-4 |
| V-15 | E | 1.1-4, 10.1-2 | Refers to a "generator script" for `cms_control_loop_and_spawn_einval.txt`; none exists (the file is a 476-byte output) | 1.1-4 (`control-loop-probe.mjs`) |
| V-16 | E | 1.1-4 | Re-queue cutoff `created_at < 1791900000000` = 13 Oct 22:00 UTC+8, which misses the failures between 22:00 and 23:51; re-queueing 14 jobs means 14 redundant full rebuilds | 1.1-4 (don't re-queue; coalesce) |
| V-17 | E | 1.1-4 | The "broken build" method (rename `package.json`) does not break a direct Astro build | 1.1-4 (failing page, no `_` prefix) |
| V-18 | M | 1.1-4 | `tail -f … \| grep` needs Git Bash on this Windows rig | 1.1-4 (PowerShell equivalent) |
| V-19 | B | 1.2-1 ↔ 2.4-2 | `git add scripts/` commits credential literals that are **untracked today**, then 1.2-2 pushes them, all before 2.4-2 scrubs anything: `prod-db-roles.sql:22` (the password the script gives `simal_app`, a role that exists in the live DB), `seed_arabic_content.mjs:6`, `manual-e2e-audit.mjs:100-125` (live admin + reviewer passwords), `cleanup-legacy.mjs:5`, `scratch_check_db.mjs:3`, `apps/portal/scripts/inspect-db.mjs` | 1.2-0 (scrub first) |
| V-20 | B | 1.2-1 | Not ignored: `data/backups/dr_drill_*.sql` (8 full DB dumps, 8.7 MB, users + hashes + KYC), `data/uploads/` (38 KYC documents) and `tools/node/` (107 MB). Reaching "status empty" commits them | 1.2-0 |
| V-21 | E | 1.2-1 | "73 modified + 31 untracked": the real figure is 92 untracked files (31 is the collapsed count); the slices miss 7 modified and 66 untracked paths, so "status empty" is unreachable | 1.2-1 |
| V-22 | G | 1.2-1 | The guard is a filename check only. gitleaks already finds **9 findings in committed history**, so CI `secrets-scan` fails on the first push and blocks `build` | 1.2-0 (triage) |
| V-23 | B | 1.2-2 | The first line inside the bash fence is prose (parentheses → syntax error; `<URL>` → redirect) | 1.2-2 |
| V-24 | E | 1.2-2 | Required checks list 5 of the 12 jobs (omits `secrets-scan`, `security` and all 5 gates) | 1.2-2 |
| V-25 | G | 1.2-2 | "≥1 approval" is impossible for a single engineer (no self-approval); `GITLEAKS_LICENSE` is needed for org repos; a stale `.github` sits outside the repo | 1.2-2, 1.2-0 |
| V-26 | E | 1.2-3 | Fallback `git commit --allow-empty && git push` pushes directly to the just-protected `main` | 1.2-4 (PR branch) |
| V-27 | B | 1.2-3 | `ci.yml` cannot go green: `lint` has 493 errors in 36 committable files (hand-listed globals miss `Buffer`/`UI`/`API`; no `ignores`; reproduced); `unit`/`gate-authz`/`gate-link-crawl` have no `npm ci` (so `pg` is `ERR_MODULE_NOT_FOUND`); `gate-a11y` never downloads `site-dist` | 1.2-3 |
| V-28 | B | 1.3-1 | `generate-remediation-board.mjs` writes `esc('open')` for every row (line 61), which wipes all 31 `closed` statuses; its ID regex cannot match `F-2026-N01` | 1.3-1 |
| V-29 | G | 1.3-1 | No delta list (32 rows must flip open→closed, 11 closed→open); P10-1…P10-4 rows missing | 1.3-1 |
| V-30 | E | 1.3-2 | "Phantom ADR-14" is false: ADR-14 exists (`Project_doc/02_Architecture/ADR_Architecture_Decision_Records.md:44`). The real defect is the ADR-009 vs ADR-9 ("Hosting") clash, and v1.1's fix makes it worse | 1.3-2 |
| V-31 | E | 1.3-2 | The replacement wording "7 automated gates green — first platform CI run…" is itself false: only 5 of 7 gates are in `ci.yml` | 1.3-2 |
| V-32 | G | 1.3-2 | The divergent duplicate `Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md` carries the same claim; a44 says 241 pages, measured 243 | 1.3-2 |

## Phase 2

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-33 | E | 2.1 / R-3 | "CSRF enforcement would break the whole CMS" is false for the 2.1-1 design: same-origin requests (allowed `Origin`) never reach the token check | Milestone 2.1 policy note |
| V-34 | G | 2.1-1 | Tokens are keyed by the committed literal `'simal-csrf-salt-2026'` (`security.js:141`); `CSRF_SECRET`/`JWT_SECRET` exist in no env file | 2.1-1 |
| V-35 | B | 2.1-2 | The test logs in with a password only, but the suite pins `ADMIN_MFA_REQUIRED='true'` (`api.test.js:28`), so it gets no cookie and no token and can never pass | 2.1-2 |
| V-36 | B | 2.1-3 | `global.API.setCsrf = …` runs before `global.API = {…}` (`api.js:34`) → TypeError | 2.1-3 |
| V-37 | E | 2.1-3 | "Add `csrfToken` to `/api/auth/me`" — already done (`routes.js:235-248`, also `/api/auth/session`) | 2.1-3 |
| V-38 | E | 2.1-3 | "`api.js` is the single funnel": `admin.js:714`, `:945` and `:1040` call `fetch` directly | 2.1-3 |
| V-39 | E | 2.2-1 | Masks `licences.*`, which doesn't exist (the key is `company.license_number`); `tax.peppol_id` and `contacts.primary.name` stay unmasked | 2.2-1 |
| V-40 | G | 2.2 | SEC-6 also leaks via `/api/admin/export.csv` (`analytics.service.js:70-109`: TRN, Peppol ID, licence, email) and the submissions list `tin` (`review.service.js:47`, visible to viewers) | 2.2-1 (shared `pii.js`) |
| V-41 | B | 2.2-2 | `reviewerHeaders` is undefined and no fixture submission is created | 2.2-2 |
| V-42 | B | 2.3-1 / R-4 | The handler takes the body as its 3rd argument, which is the router's `noop`, so `hmacSign(secret, undefined)` throws; `integration.recordBounce` doesn't exist (it is `integ.handleBounce`) | 2.3-1 |
| V-43 | G | 2.3-1 | HMAC is computed over re-serialised JSON (≠ the sender's bytes); no replay window; the outbound `WEBHOOK_SECRET` already exists | 2.3-1 |
| V-44 | B | 2.3-2 | `requirePerm('manage_users')`: that permission does not exist in `rules.js`, so everyone gets 403, super_admin included | 2.3-2 (`view_pii`) |
| V-45 | B | 2.4-1 | Setting `DOC_ENCRYPTION_KEY` without re-encrypting makes the existing documents (encrypted under the literal) fail AES-GCM | 2.4-1 + 2.4-3 |
| V-46 | B | 2.4-1 / R-9 | TOTP command `randomBytes(20).toString('base32')` throws (Node has no base32 encoding) | 2.4-1 |
| V-47 | E | 2.4-1 | "`.env.example`" is ambiguous: two exist; the root one has `ASP_KEY/ASP_SECRET` but the code reads `ASP_SHARED_SECRET`; `config.js:56-57` comment says "default 8" | 2.4-1 |
| V-48 | G | 2.4-1 | `ADMIN_MFA_REQUIRED=true` breaks the password-only probes/scripts (`live_probes`, `iteration2`, `test-cms-e2e`) | 2.4-1 |
| V-49 | E | 2.4-2 | `prod-db-roles.sql:21` is actually line 22; `seed_arabic_content.mjs:5` is actually line 6 | 2.4-2 |
| V-50 | B | 2.4-2 / 7.1-1 | `PASSWORD :'app_password'` sits inside `DO $$…$$`, where psql never expands it (reproduced); the ELSE branch never sets a password, so the exposed one stays live | 7.1-1 |
| V-51 | B | 2.4-2 | Grep-guard snippet: unescaped `'` inside a single-quoted JS string, `exec` not imported, self-matching, placed in a dist-HTML scanner; gitleaks is already in CI | 2.4-2 (gitleaks rule) |
| V-52 | G | 2.4-2 | `[REDACTED-ROTATED-2026-10]` appears in 21 tracked files at HEAD (incl. `sync-sequences.mjs:4`, which has no env override); the Done-when grep misses it | 2.4-2 |
| V-53 | E | 2.4-2 | `db.json` is git-ignored, not "committed"; 3 submission `tax.peppol_id` values are also 15-digit | 2.4-2 |
| V-54 | G | 2.4-2 | `.gitleaksignore` contains `tools/`, which is not a valid fingerprint and excludes nothing | 1.2-0 / 2.4-2 |

## Phase 3

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-55 | B | 3.1-1 | Says "sanitize exactly like `BaseLayout.astro:51-56`", but that denylist is bypassable with `"java\tscript:"`, `"java\nscript:"` or `"\u0001javascript:"` | 3.1-1 (`safe-href.ts`) |
| V-56 | E | 3.1-1, 3.2-2 | Both allowlists accept protocol-relative `//evil.example` and `/\evil.example` | 3.1-1, 3.2-2 |
| V-57 | E | 3.1-1 vs 3.2-2 | The site and API rules disagree on `mailto:`/`tel:`/`#anchor` | one rule set |
| V-58 | G | 3.1 | Unsanitised sinks missed: hero image `src` (`index.astro:1364`), insight CTA (`insights/[slug].astro:148/166`), product docs (`products/[slug].astro:302`) | 3.1-1 |
| V-59 | G | 3.1-2 | Missed: AR mini-cart (`ar/index.astro:114-115`), AR RFQ (`ar/rfq:139/142/145`), the recently-viewed grid (`products/[slug].astro:451-466`); `qty` unescaped; `i.img` dead branch; basket cookie unvalidated | 3.1-2 |
| V-60 | G | 3.2-1 | Sweep covers only `innerHTML`: 2 `outerHTML` sinks and href scheme sinks (`cms.js:3546`, `800`, `1126`) remain; no cache-bust for `cms.js?v=9` | 3.2-1 |
| V-61 | M | 3.2-1 | Adds a duplicate escaper; `UI.esc` (`ui.js:9-13`) already escapes `'` | 3.2-1 |
| V-62 | E | 3.2-2 | `updateAnnouncement`/`saveSlide`/`updateBlock` don't exist; the real functions are `upsertAnnouncement`/`upsertSlide`/`upsertBlock` | 3.2-2 |
| V-63 | G | 3.2-2 | `rollback()` (`:221-241`), `upsertProductDeep` docs, product `imgs` and insight `cta[1]` all bypass the guard | 3.2-2 |
| V-64 | E | 3.3-1 | `portal-staging.conf:25` is the portal vhost (already `script-src 'self'`); the site CSP is at line 66 | 3.3-2 |
| V-65 | G | 3.3-1 | Meta CSP (`BaseLayout.astro:315`) and `dev-edge.mjs:52` also carry `'unsafe-inline'`; localhost `connect-src` ships to prod; `frame-ancestors` is ignored in a meta tag | 3.3-2 |
| V-66 | B | 3.3 order | Removing `'unsafe-inline'` before eliminating the inline scripts breaks 243/243 pages | 3.3 re-ordered |
| V-67 | B | 3.3-2 | The grep scans `_astro/` plus one page; `ld+json` gives a false positive; multi-line scripts are missed | 3.3-1 (node check) |
| V-68 | G | 3.3-2 | Real inventory: 357 inline blocks — consent `is:inline` on all pages, `define:vars` ×4 files, 33 pages of Astro-inlined modules | 3.3-1 |
| V-69 | E | 3.3-3 | Done-when needs a staging host, which doesn't exist until 10.2 | 3.3-3 (rig :8100) |

## Phase 4

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-70 | B | 4.1-1 | Stray `}` in the SQL → PG syntax error on every page build | 4.1-1 |
| V-71 | B | 4.1-1 | Selects only `payload` but matches on `entity_id`, so CMS edits are silently ignored | 4.1-1 |
| V-72 | E | 4.1-1 | `lang='en'` is hardcoded on AR pages; `site/nav-menus-ar` contradicts `UNIQUE(entity,entity_id,lang)` | 4.1-1 |
| V-73 | E | 4.1-1 | Payload `{heading, links}` cannot reproduce the chrome (icons, descriptions, promos, foot rows, live counts) | 4.1-1 |
| V-74 | E | 4.1-1 | Newsletter "≈888-916" is the script; the markup is at 579–588; `define:vars` conflicts with the CSP | 4.1-1 |
| V-75 | G | 4.1-1 | Mobile nav, cert badges, legal links, utility strip and announcement defaults are not covered | 4.1-1 |
| V-76 | M | 4.1-1 | Neighbouring seeds don't set `updated_by`, and their `DO UPDATE` clobbers CMS edits | 4.1-1 |
| V-77 | B | 4.1-2 | `test-cms-e2e.mjs` is API-only (never builds or reads `dist`), and it would race the rig worker | 4.1-2 (`dist-e2e`) |
| V-78 | M | 4.1-2 | `#/claims-register` has no structured form; new routes also need `sitemapMatrix` entries | 4.1-2 |
| V-79 | E | 4.2-1, 6.1-1 | `site/counters` already exists (`seed.sql:413`, `DO UPDATE`) with a different array shape | 4.2-1 |
| V-80 | E | 4.2-2 | Brands/SKUs are already live DB counts on home; only "24 years" is hardcoded | 4.2-2 |
| V-81 | G | 4.2 | No AR variants for seo-defaults/counters/awards | 4.2-1 |
| V-82 | B | 4.3-1 | `stock IN ('true','t','1',true)` → `operator does not exist: text = boolean` (reproduced) | 4.3-1 |
| V-83 | B | 4.3-1 | `Boolean(patch.stock)`: the editor sends `'false'`, and `Boolean('false') === true` | 4.3-1 (`toBool`) |
| V-84 | E | 4.3-1 | "Compat shim in `rowToProduct`": no such function exists | 4.3-1 |
| V-85 | G | 4.3-1 | Read sites missed (`cms.js:2141/2216`, `ar/products:99`, rollback writer); NOT NULL/DEFAULT never applied to the live DB | 4.3-1 |
| V-86 | M | 4.3-2 | Hidden default payload at `cms.js:2053`; a DR restore reintroduces the decoy | 4.3-2 |
| V-87 | G | 4.3-3 | The Quick Create IT-solution payload `{t,x,cat,at}` ≠ the renderer's `{d,cats,…}` (live defect L-05) | 4.3-3 |
| V-88 | E | 4.3-4 | `state.policies.length` would show 14 (EN + AR) | 4.3-4 |
| V-89 | G | 4.3-4 | Fourth fabricating fallback `81` (`cms.js:3066`); "measured AR coverage" for products has no data source | 4.3-4 |
| V-90 | B | 4.4-1 | The media-serving route omits `cmsAuth`, so it would be public | 4.4-1 |
| V-91 | B | 4.4-1 | `stream.pipe(res)` with no headers and no error listener (a missing file crashes the portal); `serveMediaFile` doesn't exist; `routes.js` has no `fs` import | 4.4-1 |
| V-92 | M | 4.4-1 / R-5 | A relative `DATA_DIR` resolves against cwd; use `config.dataDir` (six services already import config) | 4.4-1 |
| V-93 | G | 4.4-1 | CMS previews are hardwired to the webroot (`cms.js:1514/2233/2370`, `listMedia`); the 85 catalogue images are not addressed | 4.4-1, 4.4-3 |
| V-94 | G | 4.4-2 | Did not detect that CMS uploads are **broken today** (`dataBase64` vs `base64`, live defect L-01) | 4.4-2 |
| V-95 | E | 4.4-2 | "Keep the site-asset copy": the copy path resolves to `Codebase\site\…` (live defect L-03) | 4.4-2 |
| V-96 | E | 4.4-2 | The label already says 5 MB; the 10 MB is the JSON body cap, and there is no decoded-size check | 4.4-2 |
| V-97 | G | 4.4-2 | SVG appears in 4 places; no magic-byte check; best-effort writes still return 201 | 4.4-2 |
| V-98 | M | 4.4-2 | `#media-target-folder` is read by nothing | 4.4-2 |
| V-99 | E | 4.4-3 | "EICAR-named upload" — the scan is content-based, so the name is irrelevant | 4.4-3 |
| V-100 | G | 4.4-3 | Uploads copied to `apps/site/public` become public static files | 4.4-3 |
| V-101 | E | Phase 4 | The exit gate sits before Milestone 4.5; `cms-e2e` is not in `run-gates.mjs` | Phase 4 exit gate |
| V-102 | E | 4.5-1 / R-7 | PUT already honours `lang` via the body spread; only GET and DELETE cannot address AR | 4.5-1 |
| V-103 | G | 4.5-1 | Did not detect that policy saves overwrite the AR twin (slug-only UPDATE; live defect L-02) | 4.5-1 |
| V-104 | G | 4.5-2 | `category_guides`, inconsistent `cat_label`, hardcoded nav keys — a rename breaks them | 4.5-2 |
| V-105 | M | 4.5-3 | "Old slug 301s" is impossible (categories are fragments); "AR coverage > 0" is already true | 4.5-3 |

## Phase 5

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-106 | B | 5.1-1 | `await` inside the ES5, synchronous `viewDashboard` → SyntaxError; sets `state.lastPublishTs`, which nothing reads | 5.1-1 |
| V-107 | E | 5.1-1 | `lastPublishTs` "from processed builds" is the enqueue `created_at`, not completion | 5.1-1 (audit `ssg_build_completed`) |
| V-108 | G | 5.1-1 | No data source for the latest job's status (`state.outbox` = 50 rows across all channels) | 5.1-1 |
| V-109 | M | 5.1-2 | Deleting the checkbox must also remove the reader (`cms.js:2938/2942`); the CDN target text is false | 5.1-2 |
| V-110 | B | 5.2-1 | Deploy runs unguarded inside the callback (unhandled rejection), and **after** the job is marked processed | 5.2-1 |
| V-111 | B | 5.2-1 | Unguarded `rmSync(DEPLOY_DIR)`: src===dest deletes the build; a parent directory is wiped | 5.2-1 |
| V-112 | E | 5.2-1 / R-6 | The premise is false: `cpSync` merges into an existing dest (tested on Node 24); `verbatimRoot` is not an option | 5.2-1 |
| V-113 | E | 5.2-2 | `SITE_DIST` is a dev-edge variable, not set anywhere in the portal | 5.2-2 |
| V-114 | G | 5.2-2 | Staging has portal and nginx on different hosts (needs a shared volume or rsync); a third docroot exists in `simalme-dev.conf` | 5.2-2 |
| V-115 | G | 5.2-3 | No local proof path (`DEPLOY_DIR` unset on the rig) | 5.2-2/5.2-3 |
| V-116 | E | 5.3-1 | Retry SQL is unscoped (could re-queue email rows), unaudited, and returns 404 instead of 409 | 5.3-1 |
| V-117 | G | 5.3-2 | Pipeline lists 50 mixed rows; inline handlers conflict with the CSP | 5.3-2 |
| V-118 | E | 5.3-2 | The bell has no count; it counts a non-existent `'pending'` status | 5.3-2 |

## Phase 6

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-119 | E | 6.1 | "22 brands" counts the placeholder `other` (21 real); only 7 of baseline a2's 22 names exist in the catalogue | 6.1-1 |
| V-120 | G | 6.1-1 | Baseline a42 says founded **2003**, so 23 years in 2026; the site and v1.1 say "24 years · since 2002" | 6.1-1 |
| V-121 | G | 6.1-2 | Missed: `BaseLayout:458`, `careers:69`, `ar/onboarding:41`, `ar/index:19`, `about:10`, `ar/about:7`, `brands/index`; 13 years phrasings; awards at `about:81` and `BaseLayout:547` | 6.1-2 |
| V-122 | E | 6.1-2 | "and AR twin" of the badge — the AR home has no badge | 6.1-2 |
| V-123 | G | 6.1-2 | The live `hero_slides` row is unchanged by a seed edit; the seed's `DO UPDATE` clobbers CMS edits | 6.1-2 |
| V-124 | B | 6.1-3 | `check-no-placeholders.mjs` has no DB access ("equal to `count(*) FROM brands`") | 6.1-3 (`facts-consistency`) |
| V-125 | B | 6.1-3 | The regex misses most phrasings and Arabic, and scans one page | 6.1-3 |
| V-126 | E | 6.1-3 | "Guard green in CI" — the gate is not in `ci.yml` until 9.1-1 | 6.1-3 |
| V-127 | B | 6.2-1 | The `<option>`s have no `value`, so factor keys never match and `Number('51–200')` is NaN | 6.2-1 |
| V-128 | B | 6.2-1 | `indSel`, `sizeSel`, `it`, `ops` are not in scope → ReferenceError | 6.2-1 |
| V-129 | E | 6.2-2 | `link-crawl.mjs` prints only the count of missing anchors | 6.2-2 |
| V-130 | B | 6.2-2 | Wrong targets: 14 of the 19 are `/ar/products/` category anchors; following v1.1 leaves 14 missing | 6.2-2 |
| V-131 | E | 6.2-2 | `#comparison` is not among the 19 (it is a bare link in `ar/software:82`); no page has that id | 6.2-2 |
| V-132 | G | 6.2-2 | The crawl skips bare and cross-page fragments (21 cross-page misses) | 6.2-2 |
| V-133 | E | 6.3-1 | The snippet doesn't match `test-cms-e2e.mjs:18`; `simal_ci_scratch` doesn't exist and would need migrate+seed | 6.3-1 (`scratchDatabase`) |
| V-134 | G | 6.3-1 | Cleanup misses the overwritten `amc-tiers`, `emergency-banner`, `pricing-tiers` and 24 revisions; `NULLS LAST`; orphan gate DBs | 6.3-1 |
| V-135 | G | 6.3-1 | Conflicts with the Phase-4 e2e dist checks (needs a scratch outDir) | 4.1-2, 6.3-1 |
| V-136 | B | 6.3-2 | `sl.bg ||` interpolated into `style="…"` creates an attribute-injection sink | 6.3-2 (`bgOf`) |
| V-137 | G | 6.3-2 | The "drop" option needs 7 code sites plus a DDL change | 6.3-2 |

## Phase 7

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-138 | B | 7.1-1 | `psql -U postgres` — no `postgres` role exists (`simal` is the initdb superuser) | 7.1-1 |
| V-139 | G | 7.1-1 | `prod-db-roles.sql:52-53` default privileges lack `FOR ROLE simal` (breaks future tables in prod) | 7.1-1 |
| V-140 | E | 7.1-2 | Changes 2 of the 6 `trust` lines, so the Done-when is impossible; keeping a trust admin line contradicts "verify password auth" | 7.1-2 |
| V-141 | G | 7.1-2 | `simal` password unverified (two hardcoded variants); hba not versioned; `pg_hba.conf.production` rejects `simal_build` and admin | 7.1-2 |
| V-142 | B | 7.1-3 | `run-gates`/`bringup`/`dr-drill` derive their admin URL from `DATABASE_URL` → `CREATE DATABASE` fails as `simal_app` | 7.1-3 (`ADMIN_DATABASE_URL`) |
| V-143 | B | 7.1-3 | `SELECT current_user, rolsuper;` is invalid SQL (reproduced) | 7.1-3 |
| V-144 | G | 7.1-3 | CI runs everything as superuser; least privilege is never exercised | 7.1-3 |
| V-145 | E | 7.2-1 | `tools/sync-sequences.mjs` is actually at `apps/portal/tools/sync-sequences.mjs` | 7.2-1 |
| V-146 | G | 7.2-1 | No `--check` mode exists; the spec ignores `is_called` and the standalone sequences | 7.2-1 (new script) |
| V-147 | G | 7.2-1 | A fresh migrate+seed already drifts (`testimonials_id_seq`), so the gate is red on day one (live defect L-13) | 7.2-1 |
| V-148 | B | 7.2-2 | The `ageBusDays` loop still floors, so 1.6 bd does not flag (simulated) and N17 is not fixed | 7.2-2 |
| V-149 | E | 7.2-2 | Fri/Sat weekend is wrong (a42: Sunday closed; UAE weekend Sat/Sun); boundaries computed in UTC, not GST | 7.2-2 |
| V-150 | E | 7.2-2 | The 1.5 bd threshold has no basis (a11: 2 bd); query-pause and resubmission-restart ignored | 7.2-2 |
| V-151 | E | 7.2-2 | The Done-when (2 bd fixture) passes with the broken loop | 7.2-2 |
| V-152 | E | 7.2-2 | Maintenance interval is 15 min and synchronous, not reachable from tests; `review-queue@simalme.com` exists nowhere | 7.2-2 |
| V-153 | B | 7.3-1 | Sensitivity uses caller-declared entities, and the UI always sends `site/all` → bypassable; SEC-11 stays open | 7.3-1 (server-derived dirty set) |
| V-154 | G | 7.3-1 | The `emergencyPublish()` attested path (`:314-333`) remains; `compliance_officer` is not a valid role | 7.3-1 |
| V-155 | M | 7.3-1 | 202 needs `json()` (`ok()` is hard-wired to 200); `migrate.sql` has no "idempotent section" | 7.3-1 |
| V-156 | G | 7.3-1 | `content-governance.test.js` tests 1 and 5–6 will break; its mock hides SQL | 7.3-1/7.3-4 |
| V-157 | E | 7.3-2 | `approve\|reject` alternation is not supported by the router | 7.3-2 |
| V-158 | G | 7.3-2 | The bell has no item list; the toast doesn't branch on 202; the authz matrix lacks the new routes | 7.3-2 |
| V-159 | G | 7.3-3 | Heading only — no body | 7.3-4 |
| V-160 | G | 7.3-4 | Ineffective on declared entities; `hero_slides`/`testimonials` are also marketing; conflicts with test 1 | 7.3-3 |
| V-161 | E | 7.3 Done-when | "A second session approves" — it must be a different **user** | 7.3-2/7.3-4 |

## Phase 8

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-162 | B | 8.1-1 | The EICAR drill passes without clamd: the in-memory signature check runs first | 8.1-1 (`engine`, `virus_detected_clamav`) |
| V-163 | G | 8.1-1 | The scanner fails open (daemon offline or unrecognised reply → clean; live defect L-12) | 8.1-1 (`CLAMAV_REQUIRED`) |
| V-164 | E | 8.1-1 | Install steps don't yield a TCP listener (unix socket by default; Windows needs a conf file) | 8.1-1 |
| V-165 | E | 8.1-1 | "400 + audit row" — no audit row is written today | 8.1-1 |
| V-166 | M | 8.1-1 | The EICAR file needs an allowed extension; the upload directory is cwd-relative | 8.1-1 |
| V-167 | G | 8.1 | The milestone title promises "key drills", but none exist | 8.1-3 |
| V-168 | E | 8.1-2 | Expected 403/410; the actual codes are 401 (expired) and 409 (reused) | 8.1-2 |
| V-169 | G | 8.1-2 | No TTL knob; single-use consumption is not atomic (live defect L-11) | 8.1-2 |
| V-170 | E | 8.2-1 | Autosave is a PUT, not a POST; the restore message is a toast ending in "." | 8.2-1 |
| V-171 | G | 8.2 | Ignores the existing `UAT_Plan_and_Script.md` and its business-owner sign-off | 8.2-1/8.2-3 |
| V-172 | M | 8.2-2 | `docs/uat/2026-10/` — Phase 8 runs in November | 8.2-2 |
| V-173 | B | 8.3-1 | `updated_at` doesn't exist on products/brands/legal_policies → the build fails | 8.3-1 |
| V-174 | M | 8.3-2 | Loop variable is `r`, not `p`; `curl -s :8100` is not a valid URL | 8.3-2 |
| V-175 | E | 8.4-1 | `GA4_ID` is never defined | 8.4-1 |
| V-176 | B | 8.4-1 | The inline loader is blocked by Phase 3's CSP | 8.4-1 (bundled script) |
| V-177 | G | 8.4-1 | The CSP lacks GA4 collection hosts (`region1.google-analytics.com` etc.) | 8.4-1 |
| V-178 | E | 8.4-1 | Returning-visitor race (`__simalConsentGrants` is set too late and doesn't exist today); the listener loads GA4 on any save | 8.4-1 |
| V-179 | M | 8.4-1 | `anonymize_ip` is a no-op in GA4 | 8.4-1 |
| V-180 | E | 8.4-2 | Removing the `<script>` node doesn't stop a running gtag.js | 8.4-2 |
| V-181 | M | 8.4-3 | DebugView requires debug mode | 8.4-3 |

## Phase 9

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-182 | E | 9.1-1 | "Three local-only gates" — there are two; sequences comes from 7.2-1 | 9.1-1 |
| V-183 | E | 9.1-1 | `gate-authz` has no artifact step to mirror; both new gates read `dist` | 9.1-1 |
| V-184 | G | 9.1-2 | No lighthouse job YAML, no `@lhci/cli` | 9.1-2 |
| V-185 | E | 9.1-2 | `temporary-public-storage` publishes the reports publicly | 9.1-2 |
| V-186 | E | 9.2-1 | `.mjs` is never run by any command; the file is not a `node:test` file | 9.2-1 |
| V-187 | B | 9.2-1 | Top-level read of the git-ignored `.env` throws in CI; MFA is ignored | 9.2-1 |
| V-188 | E | 9.2-3 | "axe-core has no 2.5.8 rule" — 4.14.0 ships `target-size` | 9.2-3 |
| V-189 | B | 9.2-3 | Uses a puppeteer `page` and a `fail()` helper; `a11y.mjs` is raw CDP | 9.2-3 |
| V-190 | E | 9.2-3 | The bounding-box rule ignores SC 2.5.8's exceptions → false failures | 9.2-3 |
| V-191 | E | 9.3-1 | "Any Sentry-compatible or Teams/Slack webhook" — Slack/Teams need `text`; Sentry needs its envelope format | 9.3-1 |
| V-192 | M | 9.3-1 | Duplicate `if`; raw error message off-box (PDPL); ambiguous `.env.example` | 9.3-1 |
| V-193 | B | 9.3-2 | `hypercare-daily.js` probes its own in-process portal, so the uptime drill cannot work | 9.3-2 (`uptime-probe.mjs`) |
| V-194 | E | 9.4-1 | "Pluggable Redis backend" — none exists | 9.4-1 |
| V-195 | G | 9.4-1 | `TRUSTED_PROXIES` is needed behind nginx; the nginx comment misstates `burst` semantics | 9.4-1 |
| V-196 | E | 9.4-2 | nginx returns 503, not 429; the app limiter fires on the same request, so the test cannot tell edge from app | 9.4-2 |

## Phase 10

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-197 | E | 10.1-1 | The SSG test is `.mjs`; there is no sequences gate until 7.2-1 | 10.1-1 |
| V-198 | E | 10.1-2 | Probes read process env or a hardcoded path, have no MFA step, and have side effects | 10.1-2 |
| V-199 | B | 10.2-1 | `--fresh` throws without `BRINGUP_ALLOW_RESET=1`, and cannot run as `simal_app` | 10.2-1 |
| V-200 | G | 10.2-2 | `dr-drill.mjs` hardcodes RPO = 0 and a templated PASS, writes PII dumps into the repo, and overwrites the evidence file | 10.2-2 |
| V-201 | M | 10.2-3 | "PRD NFR-6" collides with audit finding NFR-6 | 10.2-3 |
| V-202 | G | 10.4-3 | "Batch jobs running" is undefined; no expiry-reminder job exists | 7.2-3, 10.4-3 |
| V-203 | M | 10.4-2 | The readiness pack sits outside version control | 10.4-2 |

## §11–§13, tracker, evidence

| ID | Sev | v1.1 location | Defect → verified reality | Fixed in v1.2 |
|---|---|---|---|---|
| V-204 | E | §12 | Coverage check says "5 programme gaps + 4 re-inspection defects": §12 has 4 programme rows and §13 lists 9 defects | §12 |
| V-205 | M | §12 | N05/CMS-9 mapped to 4.4-1 only; no CMS-5 purge row; APP-3 omits 2.4-1 | §12 |
| V-206 | G | §12 | Residues with no task: SEO-4 ("AR marketing copy template-hardcoded") and GOV-1 ("role-title sign-offs") | 4.5-4, 10.4-3 |
| V-207 | M | §11 | "Findings closed" column omits SEC-10, P0-1, P0-5, DAT-7, N07 and the A11Y residues | §11 |
| V-208 | M | Tracker | Malformed phase labels (`P9-Test,-CI`); `closes_findings` missing SEC-10, P0-1, P0-5, R-1 and NFR-1 on 9.1-1 | tracker v1.2 |
| V-209 | E | `evidence/roadmap_v1.1_verification.txt` | Claims "All 9 v1.0 defects fixed and grounded against live code"; the R-3, R-4, R-5 and R-6 fixes were themselves defective (V-33, V-36/37, V-42, V-90/92, V-111/112) | this ledger |

---

## §L — Live code defects not recorded by any prior audit document

| ID | Defect | Evidence | Closed by |
|---|---|---|---|
| L-01 | **CMS media upload is broken**: the client sends `dataBase64`, the server reads `base64` → 400 on every upload from `#/media-library` | `cms.js:1624-1626`, `cms.service.js:647-660` | 4.4-2 |
| L-02 | **Saving a legal policy overwrites its Arabic twin** (slug-only `UPDATE` on a `(slug,lang)` table; rollback has the same flaw). Latent: all 14 rows still at version 1 | `cms.service.js:136-151`, `:232` | 4.5-1 |
| L-03 | The media "site copy" path resolves to `Codebase\site\public\…` (a stray empty directory) | `cms.service.js:663-665`, `689-691` | 4.4-2 |
| L-04 | **Encrypted KYC documents are unreachable**: `UPLOADS_DIR` is cwd-relative; the 38 files are in `Codebase/data/uploads/`, while the portal (started from `apps/portal`) reads the empty `apps/portal/data/uploads/`; 603 of 641 `documents` rows have no file | `pg-repos.js:15-17`, `supervisor.cmd`, `bringup.mjs:149-150` | 2.4-3 |
| L-05 | Quick Create "IT solution" writes `{t,x,cat,at}`; the renderer reads `{d,cats,…}` → published with no description or categories | `cms.js:3447-3448`, `solutions/[id].astro:29/33/46` | 4.3-3 |
| L-06 | SEC-6 surfaces beyond the report builder: the KYC master export and the queue list expose TRN (the queue list to viewers too) | `analytics.service.js:70-109`, `review.service.js:47` | 2.2-1 |
| L-07 | CSRF tokens are keyed by a committed literal (no `CSRF_SECRET`/`JWT_SECRET` in any env) | `security.js:141` | 2.1-1 |
| L-08 | The "sanitised" announcement CTA is bypassable with tab/newline/control characters | `BaseLayout.astro:51-56` | 3.1-1 |
| L-09 | Further unescaped DB-fed sinks: AR mini-cart, AR RFQ list, recently-viewed grid, hero image, insight CTA, product document links | see V-58/V-59 | 3.1-1, 3.1-2 |
| L-10 | The SSG worker job claim is non-atomic; rejections inside the build callback are unhandled (process-terminating on Node 24) | `server.js:152-200` | 1.1-3 |
| L-11 | Signed-URL single-use consumption is not atomic (find → check → save) | `token.service.js:46-51`, `pg-repos.js:521-527` | 8.1-2 |
| L-12 | The virus scanner fails open (daemon offline or unrecognised reply → clean) | `virus-scanner.js:114-116`, `:154-156` | 8.1-1 |
| L-13 | A fresh migrate+seed leaves `testimonials_id_seq` behind `max(id)` (explicit seed ids, no `setval`) → duplicate key on the first insert | `seed.sql:186-188` (0 `setval`), `migrate.sql:307-344` | 7.2-1 |
| L-14 | The gate fixture **overwrote** the live `site/amc-tiers` block (`updated_by gate-admin-…@example.invalid`); probe rows `site/emergency-banner` and `site/pricing-tiers` ("50% off wholesale") are live content | live `content_blocks` | 6.3-1 |

## Programme facts established during verification (used throughout v1.2)

- **Outbox** (`ssg-builder`): 13 queued, 14 failed, 11 processed, 1 sent. The worker still fails with EINVAL every 10 s (16 Oct 11:32 UTC). No processed row was written by the current worker code.
- **PG roles**: `simal` (superuser, owns all tables) and `simal_app` (NOSUPERUSER) only; there is no `postgres` role. `pg_hba` has 6 `trust` lines.
- **Brands**: 22 rows, including `other`, so 21 real; 18 carry SKUs. **Products**: 78. **`legal_policies`**: 7 EN + 7 AR.
- **Governance baseline**: a11 SLA = 2 business days (query pauses, resubmission restarts); a42 founded 2003, hours Mon–Fri plus Saturday half-day, Sunday closed.
- **gitleaks v8.28.0**: 9 findings in committed history. The working tree also flags `data/backups/*` (8 dumps), `manual-e2e-audit.mjs` and `FREEZE_MANIFEST.json`.
- **Site CSPs**: `portal-staging.conf:66`, `BaseLayout.astro:315` and `dev-edge.mjs:52`, all with `'unsafe-inline'` in `script-src`. `dist` contains 357 inline executable script blocks across 243 pages.
