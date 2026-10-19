# Staging Runbook — clean-DB bring-up (rm(10.2-1), proven on the rig 2026-10-18)

The roadmap's 10.2-1 steps 1–4, corrected by what the rehearsal proved. Every command
below was executed end-to-end; evidence in `Codebase/scratch/rm-evidence/10.2-1-staging-rehearsal.log`.

## 0. Prerequisites
- PostgreSQL reachable; a database owner role (`simal`) that can `DROP/CREATE DATABASE`,
  and the least-privilege roles from `scripts/prod-db-roles.sql` (`simal_app`, `simal_build`).
- `pg_hba.conf` must name **every** database the app/build roles connect to
  (`simal_app` and `simal_build` lines scoped to the staging database), or the connection is
  rejected before authentication.

## 1. Create the empty database and build from it
```bash
cd Codebase
BRINGUP_ALLOW_RESET=1 \
DATABASE_URL=<owner role URL for the STAGING database> \
ADMIN_DATABASE_URL=<owner role URL for postgres> \
SITE_OUT_DIR=dist-staging \
node scripts/bringup.mjs --fresh --build
```
`--fresh` drops and recreates the named database (hence `BRINGUP_ALLOW_RESET=1`);
migrate.sql + seed.sql are applied and the SSG is built from the fresh data.

> **Order matters (found in the 10.2 rehearsal).** `--fresh` recreates the database, which
> **removes its role grants and its per-database default privileges**. Apply the role script
> AFTER the fresh create, never before — otherwise the portal cannot boot
> (`permission denied for table settings`).

## 2. Grant the least-privilege roles on the fresh database
```bash
psql -v ON_ERROR_STOP=1 \
     -v app_password=<existing simal_app password> \
     -v build_password=<existing simal_build password> \
     -f scripts/prod-db-roles.sql \
     <owner role URL for the STAGING database>      # ← the URI must be the LAST argument
```
The script rotates both role passwords on every run, so pass the values the environment
already uses or update the environment in the same window. **Roles are cluster-wide:** running
it against *any* database of a cluster (a scratch or staging database included) rotates the
passwords every other database on that cluster uses — this happened on the rig on 2026-10-18
(deploy-audit ledger, "Incident"). Since `e6feb75` the script grants `simal_build` the 9 content
tables only (ledger D49, `scratch/rm-evidence/deploy-audit/build-role-check.log`).

## 3. Boot the portal as the least-privilege role
```bash
DATABASE_URL=<simal_app URL for the STAGING database> \
BUILD_DATABASE_URL=<simal_build URL> \
SITE_OUT_DIR=dist-staging SSG_DISABLED=1 NODE_ENV=staging PORT=<port> \
node apps/portal/src/server.js
```

## 3b. Enrol staff TOTP before a production boot (rm 10.4-1)
Production refuses to start while any active staff account lacks a TOTP secret. In staging
(NODE_ENV != production) each staff member signs in to the staff console and uses the
"Set up two-factor authentication" panel (banner on the dashboard) to enrol. Verify with:
```sql
SELECT email, role FROM users WHERE active AND role IN ('super_admin','reviewer','viewer')
  AND (totp_secret IS NULL OR totp_secret = '');
```
An empty result means the production boot guard will pass. Since `3fba62a` production also
enforces this **on every staff request** and refuses MFA disable for staff (ledger D31), and a
production boot additionally refuses placeholder or missing values (CSRF secret, document key,
SMTP, clamd, `DEPLOY_DIR`, watchlist, `PORTAL_PUBLIC_URL`, `SITE_PUBLIC_URL`, seller TRN — ledger
D33/D41/D47; the list is in `apps/portal/.env.example`). For a container deployment rehearsal see
`scripts/deploy-rehearsal.mjs` (`scratch/rm-evidence/deploy-audit/deploy-rehearsal.log`).

## 4. Prove it
```sql
-- the connection the portal uses
SELECT current_user, current_database();          -- simal_app | <staging db>
SELECT usename, count(*) FROM pg_stat_activity
 WHERE datname = '<staging db>' GROUP BY usename;  -- simal_app backends present
```
```bash
curl -s http://127.0.0.1:<port>/api/health          # {"status":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:<port>/login.html   # 200
# admin bootstrap ran against the fresh DB at boot; log in with ADMIN_* and confirm:
#   /api/admin/submissions -> total 0 (fresh), /api/settings -> 200
```

## 5. Gates against the staging build
```bash
for g in check-no-placeholders facts-consistency check-inline-scripts check-page-language perf-budget; do
  SITE_DIST=apps/site/dist-staging node scripts/ci/$g.mjs || exit 1
done
SITE_DIST=apps/site/dist-staging GATE_EDGE_PORT=18120 GATE_CDP_PORT=18121 node scripts/ci/a11y.mjs
```

## Result (2026-10-18, rig rehearsal)
- fresh database from migrate.sql + seed.sql: **234 pages** built;
- `current_user = simal_app`, `can_ddl = false`;
- portal healthy, admin login 200 (`super_admin`), `/api/admin/submissions` total **0** on the
  fresh DB, `/api/settings` 200;
- all SITE_DIST gates **green** (placeholders, facts-consistency, inline scripts, page language,
  perf budget 30/30) and the a11y gate **PASS — 0 violations** on the staging build.
