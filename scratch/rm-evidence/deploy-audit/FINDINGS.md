# Deployment-readiness audit — findings ledger (2026-10-18)

Scope: is the system ready to deploy, is the CMS connected to the public site, is the
production build sound. Sources: in-app browser sweep, fresh-clone CI reproduction,
platform CI, three read-only code reviews (CMS coverage, deployment, claims). Every item
is re-verified in code or in a running system before it is fixed; status says how.

Status: **FIXED** (with proof) · **OPEN** · **HUMAN** (needs a person/decision) · **DOC** (documentation only)

| ID | Sev | Finding | How verified | Status / proof |
|---|---|---|---|---|
| D01 | Blocker | Platform CI red on the "final" HEAD 6c1108e: unit + integration fail (DOC_ENCRYPTION_KEY absent on a clean runner), build + all dist gates skipped (run #12, 11/21). 30 commits had never been pushed, so no platform run existed for them. | run #12 logs; fresh clone reproduction | FIXED 8c37907 — clean clone 118/118, 27/27, pg-journey 7/7 |
| D02 | High | /products/ filters empty, sort/pager/guide/deep links dead; /ar/products/ filter buttons dead; header RFQ badge not refreshed; AR labels turned English (rm 3.3 regression, 21fbd73) | in-app browser + git history | FIXED ddc2114 — browser-verified |
| D03 | Medium | Search typo fallback returned unrelated products ("hikvision" → 0 relevant of 7) | in-app browser + Node harness | FIXED d32d5ed |
| D04 | High | Arabic RFQ always failed (contact_person vs contactName → 400; read res.ref vs reference) | code + in-app browser | FIXED 00beef6 — served site: AR add → "تم الإضافة ✓", badge 1, submit → SIMAL-RFQ-20261018-1031 |
| D05 | High | CMS product save wiped product_deep hero/feats/use_cases/box; docs array discarded; warranty field read by nobody | code + scratch-DB API repro | FIXED 197ad47 — test-cms-integrity (fails at "hero kept" on old code) |
| D06 | High | Saving one language of a legal policy overwrote both EN and AR rows | code + API repro | FIXED 197ad47 — EN save leaves AR untouched; per-lang revisions/rollback |
| D07 | High | Every Rollback restored the newest snapshot; block revisions matched across entities/langs; brands/product_deep rollback a silent no-op | code + API repro | FIXED 197ad47 |
| D08 | High | Brand modal sent note = tagline, JSON-quoted both, reset counts; 5 fields never stored; tagline shown twice | code + browser + LIVE repro (old running code reset counts on the rig; restored from snapshots, 0/22 empty) | FIXED 197ad47 + live copy normalized (fix-brand-copy.log) |
| D09 | Medium | Media uploads copied to a stray Codebase/site/, never shipped | code + API repro | FIXED 197ad47 (stray folder removed) |
| D22 | Medium | Category label rename always 422 | code + API repro | FIXED 197ad47 |
| D23 | Medium | /ar/solutions/ 5 of 12 lines, raw ids as headings | code + browser | FIXED 00beef6 — served: 12 cards |
| D24 | Medium | Sitemap: 198 hreflang alternates to non-existent /ar/ pages; hubs fixed lastmod | code + gate on old generator | FIXED 00beef6 — gate asserts no dead alternates |
| D25 | Medium | Home testimonials never rendered since rm 4.2 (card dropped, unbalanced div) | code + git history + browser | FIXED 00beef6 — served: card + 2 awards |
| D26 | Low | CMS editor defects: block Description not saved, IT-solution quick-create desc key, author column, "New Block" dead, slide idx collision, Edit buttons dead outside blocks view, 7 editors not in sidebar | code | FIXED 197ad47 |
| D27 | Low | AR forms: phone/email inputs rendered RTL ("971500000000+") | in-app browser | FIXED (dir="ltr") |
| D28 | High | H1: env staff credentials overwrote every boot — a password or TOTP changed in the console reverted at restart | code | FIXED — create-only; BOOTSTRAP_RESET_CREDENTIALS=true re-applies (audited) |
| D29 | High | H2: leftmost X-Forwarded-For trusted → any client chose its IP past the login/form limiters and lockout; limiter buckets never evicted | code + unit | FIXED — client-ip.test.js 5/5 (old code fails 2) |
| D30 | High | M10: legacy token exchange issued a session for ANY role (super_admin incl.) without password or TOTP | code + test | FIXED — partner-only, 403 + token burned; token-exchange.test.js (old code fails) |
| D31 | High | Staff MFA enforced only at boot: accounts created/promoted/MFA-disabled after boot used staff routes password-only | code + unit | FIXED — requireStaff + mfa/disable guard in production; staff-mfa-enforced.test.js (old fails 2) |
| D32 | High | B3: KYC upload route read the 2 MB default body — any scan > ~1.5 MB failed with 413 despite the 10 MB promise | code + test | FIXED — 14 MB route cap, one file per request (form.js v6); api.test 9 MB case (fails on 2 MB) |
| D33 | High | H4: production boot accepted .env.example placeholders, no CSRF secret (source literal), no doc key, no SMTP, no clamd, no DEPLOY_DIR, no watchlist | code + unit | FIXED — assertProductionConfig; production-config.test.js |
| D34 | High | .env loader kept inline comments: a copied `NODE_ENV=production # …` was never "production" (all production guards off); `WEBHOOK_SECRET=  # HMAC…` became a public secret | code + unit | FIXED — dotenv rule; .env.example comments on own lines; dotenv-comments.test.js |
| D35 | High | H7: SSG build child got a denylisted env — DOC_ENCRYPTION_KEY, SMTP_PASS, WEBHOOK_SECRET, ASP_*, VIEWER_PASSWORD, ADMIN_DATABASE_URL reached it | code + unit + live | FIXED — allowlist (child-env.js); child-env.test.js; live publish b3-publish-loop.log ALL PASS |
| D36 | Medium | M11: CSP report sink answered 415 to every browser report (application/csp-report) — nothing was ever audited | code + test | FIXED — api.test CSP case (3 media types 204, text/plain 415) |
| D37 | High | H5: SMTP client could not deliver over STARTTLS (no EHLO after TLS → timeout), wrote to the plaintext socket, AUTH in clear on :25, bare-LF bodies, raw UTF-8 subjects | code + scripted relay | FIXED — smtp-client.test.js 3/3 (old client 0/3, hangs to timeout) |
| D38 | Medium | H5: emailed links relative ("/login.html?reset=…"), bulk-invite links built from the client Host header over http; RFQ mail promised tracking at /status.html, which cannot track RFQs | code | FIXED — PORTAL_PUBLIC_URL (required in production); account-services asserts absolute link |
| D39 | High | H6: single pg.Client — a DB restart left the portal failing until restarted; /api/health said ok with the DB down | code + PG suites | FIXED — pg.Pool; health pings DB (503 degraded); 44/44 PG integration |
| D40 | High | H6: SSG job "claim" was SELECT … FOR UPDATE SKIP LOCKED in autocommit (no lock held); finishJob unawaited → unhandled rejection kills the process | code + PG repro | FIXED — atomic UPDATE claim + stale requeue (ssg-claim.test.js); old claim: 8 workers all got job0 |
| D41 | Medium | H8: seller TRN on e-invoices was a seed placeholder with no way to set the real one | code + test | FIXED — SIMAL_TIN; production refuses a seed TRN; seller-tin.test.js |
| D42 | Low | Root `npm run lint` linted .astro without a parser (39 parse errors) while CI lints .js/.mjs (0 errors) | run | FIXED — script aligned with CI |

| D43 | High | Production refusals ran AFTER createScreening(), which seeds a 5-name starter watchlist when the file is missing — the watchlist check could never fail | code + boot test | FIXED — checks first; no starter list in production; production-boot.test.js (old order fails) |
| D44 | High | Dockerfile: listened on 127.0.0.1:3000 while EXPOSE/HEALTHCHECK used 8090 (unreachable, always unhealthy); COPYed git-ignored data/watchlist.csv (clean builds failed); no lockfile; no apps/site, so every CMS publish in a container failed | code + rehearsal | FIXED — repo-root image with site + workspace deps, Dockerfile.dockerignore whitelist; deploy-rehearsal.log |
| D45 | High | nginx: 1 MB body default (KYC/CV/e-invoice uploads refused at the edge), `include proxy_params` (absent from the official image — nginx would not start), public vhost proxied the whole portal API incl. /api/admin and /api/cms, soft 404 (home page with 200), second CSP on the portal blocked the console's site probe, no asset caching | code + rehearsal | FIXED — portal-staging.conf + snippets/simal-proxy.conf |
| D46 | High | DEPLOY_DIR publish was rm -rf + cp: empty/partial docroot during every publish, broken site after a failed copy, and impossible on a mounted volume | code + unit + rehearsal | FIXED — deploy-sync.js (temp + rename, assets before HTML, prune); deploy-sync.test.js |
| D47 | Medium | CMS console "view site" links, preview probe and CSP hardcoded to the rig edge http://127.0.0.1:8100 | code | FIXED — SITE_PUBLIC_URL (telemetry → console; CSP connect-src; origin allowlist), required in production |
| D48 | Low | Site CSP (BaseLayout meta) allowed connect-src http://127.0.0.1:* http://localhost:* in production | code | FIXED — removed (all site calls are relative /api) |
| D49 | High | simal_build (SSG build role) could SELECT every table — users (hashes, TOTP secrets), sessions, tokens, KYC submissions/documents | code + scratch DB | FIXED — grants on the 9 content tables only; CI asserts users is unreadable; build-role-check.log (astro build passes under the role) |
| D50 | High | deploy.yml seeded a throwaway postgres service and built the site from it (a deploy would publish seed content); DATABASE_URL never set | code | FIXED — builds the release image and runs the rehearsal; remote rollout stays an OPS checklist |
| D51 | Medium | A first deployment had an empty docroot — public site down until a staff publish | code + rehearsal | FIXED — portal queues one audited bootstrap build when DEPLOY_DIR has no index.html |
| D52 | High | Regression from D02: /products/ CLS 0.135 > 0.05 (platform run #14 lighthouse) — the island filled empty facets / hid a visible guide card on load | platform run #14 + in-app browser (0.1367 measured) | FIXED — default view server-rendered; in-app browser CLS 0.0000 (mobile + narrow desktop), /ar/products/ 0.0000 |

| D53 | High | CMS console: isSuperAdmin() and both admin-view gates read state.me.user.role, but state.me IS the user — since rm(10.3-1) no account (not even super_admin) loaded users/sessions/telemetry/publish status or could open Telemetry, Users, Sessions | in-app browser (sandbox, generated creds) | FIXED — cms.js v34; test-cms-buttons now asserts each view opens (old code: 3 views bounced to #/dashboard) |
| D54 | Medium | Rig content polluted by an unauthenticated "system" test run (Oct 2026): product 1672 overwritten with Crucial T705 data (brand "Crucial", category "SSD", Honeywell text), crucial-t705-ssd-2 renamed "(Enterprise Hardened)", it_solution/licensing title "- Verified" | audit_log + cms_revisions | FIXED on the rig via CMS rollback/PUT (restore-1672.log, fix-licensing-title.log); seed.sql was correct; marker sweep now 0 |
| D55 | Low | Catalog invented SKUs from slugs for 31 products (cards, brand pages, JSON-LD, WhatsApp text, CMS create stored them) | code | FIXED — real SKU or none |
### Incident (this session)
- 2026-10-18 ~13:58Z: build-role-check.mjs ran prod-db-roles.sql on a scratch database with random passwords. Roles are cluster-wide, so simal_app/simal_build were rotated for the live rig database too. Restored from apps/portal/.env at ~14:05Z (both logins verified); the running portal kept its pooled connections and no build ran in the window. The script now reuses the rig's passwords.

## Open (in progress, in this order)

- Infra: ClamAV binaries tracked in git (tools/clamav) — size/licence review.
- CMS coverage: Arabic pages hardcode or discard CMS data (home, about, contact, software, legal index, onboarding); chrome partially hardcoded.
- Docs: readiness pack / RTM / board counts stale (agent report A1–A16) — DONE 2026-10-19 by the docs(deploy-audit) pass (record: docs-pass.md).

## Owner decisions (HUMAN)

- Rotate the rig staff passwords that are in pushed history (unchanged; owner action).
- Re-seal FREEZE_MANIFEST.json for the release that carries these fixes (CAB: PM, TL, OPS) — deploy.yml blocks on drift by design.
- Remote rollout: registry, target host, DNS/TLS (deploy.yml OPS checklist; infra/docker/compose.yml).
- Catalog data: 9 products under brand "other" (HS-SSD-* / HS-ESSD-* look like HIKSEMI, HC000017 like Honeywell, RTX2060/GTX1030 like ARKTEK — confirm before reassigning); 2 duplicate Honeywell listings (`…-ex_24b617a1`, `…-4-uni_a13c0ee0`); slug `1672` is a numeric import slug (a slug change needs a redirect).
- Production values: SIMAL_TIN (FTA certificate), PORTAL_PUBLIC_URL, SMTP relay, a real sanctions/PEP WATCHLIST_CSV (the rig runs the 5-entry fixture), CSRF_SECRET, clamd host.
