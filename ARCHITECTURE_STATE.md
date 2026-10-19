# ARCHITECTURE_STATE.md — Simal Production Build
<!-- Persistent state for multi-session agentic development. Read this first. -->

```yaml
type: reference
topic: architecture-state
target_audience: developer, devops
updated: 2026-10-06
phase: P3 v2.0 complete (capability parity) — 44/49 done; site 192 pages + RFQ engine + software tier + statics + link-resolution parity gate (47); remaining 5 tasks external/human (ASP creds, vendor, UAT, rehearsal-on-infra, live Peppol)
```

> **Status note (2026-10-19, deploy audit):** the `updated`/`phase` lines above are the P3 snapshot
> of 2026-10-06 and are historical — the counts in them (44/49, 192 pages, 47) are not current.
> Current readiness: `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55; HEAD `e613c5a`, platform run #18 21/21).
> Sections below that the ledger corrected carry a *deploy audit* note.

## Runtime topology
```
Browser ──▶ CDN (SSG pages, immutable assets)
         ──▶ App tier (Node 22+ ×2, ADR-1)
              ├── site/    (SSG + islands, ADR-2)
              ├── portal/  (KYC + e-invoice, real backend)
              ├── cms/     (role-gated back office)
              └── shared   (types, validation, utils)
         ──▶ PostgreSQL 16 (port 5433 dev / managed prod, ADR-3)
         ──▶ Object storage (filesystem dev / cloud bucket prod)
         ──▶ SMTP/provider (notify.service seam, INT-1)
         ──▶ Peppol ASP (INT-5, accredited, C2 critical path)
```

*Deploy audit — as built and rehearsed (`scratch/rm-evidence/deploy-audit/deploy-rehearsal.log`,
25/25):* `infra/docker/compose.yml` runs **one** portal container (image built from the **repo root**
with `apps/site` + workspace deps, `apps/portal/Dockerfile` + `Dockerfile.dockerignore` whitelist,
listening 0.0.0.0:8090 — ledger D44), PostgreSQL 16, and an nginx edge (`infra/nginx/portal-staging.conf`
+ `snippets/simal-proxy.conf`, replaced in `e6feb75` — D45) that serves the SSG docroot (`DEPLOY_DIR`,
updated by an in-place temp + rename sync — D46) and proxies only the site's four public API
endpoints; `/api/*` otherwise 404s on the public vhost. The "×2 app tier" and CDN above are the target
design, not what is rehearsed; the remote rollout (registry, host, DNS/TLS) is an owner decision.

## Port map (dev)
| Port | Service | Dir |
|---|---|---|
| 8000 | Prototype static (serve_prototype.py) | `Prototype/` |
| 8090 | Portal dev (node src/server.js) | `portal/` |
| 5433 | PostgreSQL 16.9 portable | `Codebase/tools/pgsql/` |
| 8080 | Legacy mirror (server.py) | `Mirror_site/` |

## Database (B4 DDL → PG)
- DB: `simal` on `127.0.0.1:5433`, user `simal`, password from `SIMAL_PG_PW` env
- Extensions: `pg_trgm` (search, ADR-11) — enabled
- Key tables: users, sessions, submissions, documents, invoices, invoice_lines, products, product_deep, brands, insights, content_blocks, hero_slides, rfqs, audit_log, outbox, settings
- Money: **integer fils (BIGINT)** everywhere — never float (ADR-5)

## API contracts (B5)
- e-Invoice: `/api/einvoice/*` (partner), `/api/einvoice/admin/*` (staff, `decide` perm)
- Site: `/api/search`, `/api/catalog/:slug`, `/api/rfq`, `/api/insights/:slug`, `/api/cms/*`
- Auth: `/api/auth/login|mfa|logout|me`, session cookie `kyc_sid`
- KYC: full surface per `portal/docs/API.md` (normative)

## E-invoice invariants (C2/D3, tested)
- Lifecycle: draft→submitted→validated→delivered|rejected→reopen
- 7 checks (stable order): totals_recomputed, trn_format_15_digit, trn_registered_peppol_prefix, buyer_kyc_approved, dates_ordered, lines_nonempty, currency_aed
- VAT 5% per line: `floor((net_fils * 5 + 50) / 100)` — integer half-up
- Refs: `SIM-INV-YYYY-NNNN` server-issued, sequential, unique

## ADR log (B3 v2.0 — 13 ratified)
ADR-1 Node 22 · ADR-2 SSG+islands · ADR-3 PostgreSQL · ADR-4 portal auth engine · ADR-5 BIGINT fils · ADR-6 ASP integration · ADR-7 email seam · ADR-8 CMS AR/RTL · ADR-9 UAE hosting · ADR-10 structured logs+alerts · ADR-11 pg_trgm search · ADR-12 hash→routes · ADR-13 CMS publish/purge

## Active risks (top 4 from G2 v2.0)
R11 schedule vs 1 Jan 2027 (score 15) · R2 prototype parity (16) · R1 ASP (15) · R12 team load (12)

## Resolved design decisions (post-audit)
- **Rate-limiting enforcement point (NFR-4 residue, rm(9.4-1) — nginx edge + in-process
  defence in depth).** The staging/production edge enforcement point is the nginx
  `login_zone` (`infra/nginx/portal-staging.conf`, applied on `/api/auth/login`):
  the TRUE semantics of `rate=2r/m burst=10 nodelay` are **11 requests immediately,
  then 1 every 30 s per IP** — the old "10 attempts / 5 min" comment was wrong and is
  corrected in the conf; `limit_req_status 429;` was added so the edge speaks the same
  code as the app (503 is a server-error code, not a throttle code). The in-process
  limiters (`loginLimiter` 10/5 min per account+IP with lockout, `loginIpLimiter`
  120/min per IP, `publicLimiter` 120/min) are defence in depth — on the single-instance
  dev rig they are the de-facto enforcement point. Multi-instance staging would need a
  Redis-backed limiter (the current `rateLimiter` is an in-memory `Map` closure with no
  backend seam) — deferred until an actual second app instance exists, recorded here as
  the accepted decision. **Proxy IP:** behind nginx the app honours `X-Forwarded-For`
  only from `127.0.0.1/::1` plus `TRUSTED_PROXIES` (`security.js resolveClientIp`);
  staging MUST set `TRUSTED_PROXIES=<nginx address>` (documented in `.env.example`) or
  every client shares nginx's IP in `loginIpLimiter`/`publicLimiter`. *Deploy audit (ledger D29,
  `3fba62a`): `resolveClientIp` took the **leftmost** `X-Forwarded-For` entry, so any client could
  choose its IP past the login/form limiters and the lockout, and limiter buckets were never evicted;
  it now walks the chain from the right, skipping only trusted hops, and buckets are swept
  (`test/unit/client-ip.test.js`). The per-account lockout is now 5 failures / 10 min → 15 min (RTM
  E2; `routes.js` `LOGIN_FAIL_*` defaults), not the 10 / 5 min stated above.* **Proof (rm
  9.4-2/9.4-3):** `scripts/ci/rate-limit-probe.mjs` — 15 unique-email login POSTs (unique
  emails bypass the per-account limiter; 15 < the 120/min IP limiter) through the vendored
  rig nginx (`tools/nginx`, `infra/nginx/portal-rig.conf`, 127.0.0.1:8443): 11 × 401 then
  4 × 429, while the identical loop directly against the app yields 15 × 401 — the layers
  are proven separately and every 429 is edge-attributed. Transcript:
  `scratch/rm-evidence/9.4-3.log`.
- **hero_slides.bg (F-2026-N16, rm(6.3-2) — Option A: render with strict whitelist).**
  The column stays; `bg` is now actually rendered (server slide markup + client stage
  renderer) but only after `bgOf()`: a relative image path (`/assets/img/x.webp`) becomes
  `url("…") center/cover no-repeat`; a hex color or simple linear/radial gradient passes;
  anything else falls back to the canned BG gradient. `upsertSlide` 422s on values that
  fail the same whitelist, so no CMS value can inject CSS or ship an unusable background.
- **Test-data isolation (F-2026-N011/DAT-7, rm(6.3-1)).** CMS-writing e2e/gates run on
  scratch databases (`scratchDatabase` in scripts/ci/lib.mjs): `E2E_DATABASE_URL` pins one
  explicitly; bare standalone runs provision `simal_gate_*` (migrate+seed) and drop it in a
  `finally`, with a pre-run sweep of connection-less gate databases. `bootApp` sets
  `SSG_DISABLED=1` so a booted test portal can never rebuild the live `apps/site/dist`
  from gate data; `check-no-placeholders` fails if `dist/insights` ever contains
  `p4-rollback-*` fixture pages.

- **Database access model (rm(7.1)/DAT-9 — scram-only, zero trust lines).** Portal
  connects as `simal_app` (NOCREATEDB, DML-only, database-scoped to simal + the CI
  databases simal_ci/simal_pgjourney); the SSG build worker as `simal_build`
  (read-only — *deploy audit D49: it could SELECT every table, `users` hashes and TOTP secrets,
  sessions, tokens and KYC data included; since `e6feb75` it reads the 9 content tables only and CI
  asserts `users` is denied, `deploy-audit/build-role-check.log`*; the build child gets an allowlisted
  environment, `src/lib/child-env.js` — D35); migrations/gates/scratch-database maintenance as `simal` via
  `ADMIN_DATABASE_URL`. Credentials are 48-char hex, stored ONLY in
  `apps/portal/.env` (gitignored) as DATABASE_URL / ADMIN_DATABASE_URL /
  BUILD_DATABASE_URL. Admin URLs come from `adminUrlFromEnv()` (scripts/ci/lib.mjs) —
  never derive them from DATABASE_URL. Versioned auth policies:
  `scripts/pg_hba.conf.dev`, `scripts/pg_hba.conf.production`; role/grant source of
  truth: `scripts/prod-db-roles.sql` (rotates passwords on every run). *Roles are
  cluster-wide: running it against **any** database of a cluster rotates the passwords the live
  database uses (ledger incident 2026-10-18 — restored from `.env`); pass the current passwords.*

### Document-key rotation drill (rm 8.1-3 / F-2026-N06, 2026-10-17)
Second live rotation of DOC_ENCRYPTION_KEY using scripts/reencrypt-documents.mjs:
baseline dry-run (all current) -> sample-download sha256 snapshot -> generate K2 ->
dry-run with K2 current + K1 as legacy candidate (51 LEGACY) -> --apply (51 files
migrated in ~7 s, 0 corrupt) -> dry-run clean under K2 -> .env rotated, portal
restarted, sample download byte-identical. ROLLBACK: set .env DOC_ENCRYPTION_KEY back
to K1 and re-run the tool with the roles reversed (K1 current, K2 as legacy via the
SESSION_SECRET slot) — files decrypt under either key while both candidates are
offered; the runtime readFile also self-heals legacy files on read. Keys live only
in apps/portal/.env (gitignored). The tool now skips non-files (the uploads/media
subdirectory crashed the old flat readdir).

### DB-credential rotation (pre-unification hygiene, 2026-10-19)
Ahead of pushing the unified repository to GitHub (private `maz279/simal-platform`),
`simal_app` and `simal` were re-rotated via `ALTER ROLE` (48-char hex, values only in
`apps/portal/.env`, never committed). Verified at rotation time: new passwords accepted
for both roles; the previous hex values rejected; every credential literal that remains
in git history (`Simal_App#2026!ProdScramAuth`, `simal_dev`, `simal123`) rejected by
live SCRAM auth — history carries only dead credentials; none of the live hex values
appears in any commit (`git log --all -S<prefix>` = 0 for all three roles). Portal
restarted from the new `.env`; health `db:up`, admin login OK, PG-mode journey suite
7 PASS / 0 FAIL (drop→migrate→seed + HTTP journey). `simal_build` was left as-is —
its password never appeared in history (verified same way).

## Standards Baseline (P0-4, ratified 2026-10-12)

One standards set governs all remediation and acceptance work. Later phases
must not drift from these pinned versions; changing any of them requires an
ADR. Source: `Audit/Independent_Forensic_Audit_2026-10-12/REMEDIATION_PLAN.md` §1.

| Standard | Pinned version | Scope | Acceptance owner |
|---|---|---|---|
| WCAG (Web Content Accessibility Guidelines) | **2.2, level AA** | Public site + CMS consoles; axe tags `wcag2a,wcag2aa,wcag21a,wcag21aa` + 2.2 rules (SC 2.5.8) | QA (manual AT pass) + Frontend |
| OWASP ASVS (Application Security Verification Standard) | **5.0.0, level L2** | Portal API, CMS, integrations; RBAC deny-by-default per Authorization Cheat Sheet | Security Eng |
| NIST SP 800-63B | **rev 4** | Authentication: password policy, MFA/TOTP, session management, rate limiting | Security Eng |
| UAE PDPL | **Federal Decree-Law 45 of 2021** | Personal-data handling: consent, minimisation, storage, withdrawal (AR + EN notices) | PM + Legal |
| Peppol PINT AE Billing | **1.0.4** (PINT AE spec set; `urn:peppol:pint:billing-1@ae-1`) | e-invoicing UBL generation, participant endpoints (TIN-based), ASP exchange | Backend Eng |

Enforcement: the P0-3 CI gates (`scripts/ci/`, `.github/workflows/ci.yml`
jobs `gate-*`) are the automated expression of this baseline; the
remediation board (`remediation-board.csv`) tracks per-finding acceptance.

### Workspace unification (2026-10-19)
All project folders moved INTO this repo (audit/, project-doc/, primary-doc/,
implementation/, prototype/, ux/, content/, artifacts-cms-audit/, fixture-backups/,
legacy/, .agents/) — single source of truth, README.md maps the layout. Remotes:
`origin` (bare, full 113-commit history) + `platform` (Gitea, authoritative 21-job
CI; push via `node infra/ci-platform/push.mjs`) + `github` (private mirror,
content-snapshot import — ClamAV blobs >100MB in history commits ee69382..3d7f43e
bar full-history push; rationale + swap-in runbook in docs/BRANCH_PROTECTION.md;
`node scripts/github-mirror.mjs` completes it after `gh auth login`).
