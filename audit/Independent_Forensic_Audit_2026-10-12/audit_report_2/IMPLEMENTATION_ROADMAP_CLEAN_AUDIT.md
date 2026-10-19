# Simal Platform — Implementation Roadmap to a Clean Audit (v1.2)

**Document ID:** SIMAL-RM-CLEAN-1.2 · **Prepared:** 16 October 2026 · **Supersedes:** v1.1 (same day; archived at `archive/IMPLEMENTATION_ROADMAP_CLEAN_AUDIT_v1.1.md`).
**v1.2 = forensic verification pass.** Every file path, line reference, "current code" claim, code snippet and Done-when command in v1.1 was re-checked against the live tree (`Codebase/`, HEAD `8011ab0` + 104 uncommitted paths) and the running rig (PG 16.9 :5433, portal :8090, edge :8100) on 16 Oct 2026. **209 defects were found in v1.1 — 48 blockers (the snippet or command would fail, or would not close the finding), 76 factual errors, 61 coverage gaps, 24 minor** — plus **14 live code defects that no audit document had recorded** (e.g. CMS media upload is broken, saving a legal policy overwrites its Arabic twin, encrypted KYC documents are unreachable from the running portal). All are corrected below. §14 summarises them; the row-level ledger with evidence is `ROADMAP_V1.2_VERIFICATION_LEDGER.md` (same folder). Tasks 98 → 104; milestones 36 (unchanged).
**Basis:** `AUDIT_REPORT_2.md` + `FINDINGS_MATRIX.csv` (Independent Forensic Re-Audit, 15–16 Oct 2026, including Iteration-2 live proofs).
**Objective:** close **every** open item — 24 PARTIAL findings, 1 NOT-FIXED finding, 17 new findings (F-2026-N01…N17), the outstanding P0/P10 acceptance gaps, and the v1.2 live defects (§14.2) — so the next independent audit returns **zero open Critical/High/Medium** findings.
**Audience:** full-stack engineer (Node 22+/24, Astro 5, PostgreSQL 16, vanilla-JS portal). Every task names exact files, ships a snippet verified against the current tree, and ends with a **Done-when** you must run and capture.

---

## How to use this roadmap

- **10 phases, dependency-ordered.** Inside a phase, follow the stated execution order. Phases 4–6 may overlap once Phase 3 has landed (see §11); every other phase starts only when the previous phase's exit gate is green.
- **Task IDs are `RM-<phase>.<milestone>-<task>`** (e.g. `RM-1.3-1`), and each one states the finding(s) it closes. The coverage matrix in §12 shows that nothing is dropped. `ROADMAP_TASK_TRACKER.csv` mirrors this document 1:1.
- **Golden rules:**
  1. *Evidence in, evidence out.* A task is done only when its **Done-when** passes and the output is saved in `Codebase/scratch/rm-evidence/<task-id>.log|.png`. That folder is committed; the rest of `scratch/` is ignored (Task 1.2-0).
  2. One logical change = one commit, message prefix `rm(<task-id>)`, pushed on a branch and merged by PR once Task 1.2-2 has protected `main`.
  3. After every phase, run from `Codebase/` (the a11y gate spawns `scripts/dev-edge.mjs` by relative path):
     `node scripts/ci/run-gates.mjs` — then `cd apps/portal; npm test; node --test test/account-services.test.js test/token-exchange.test.js test/peppol-sandbox-roundtrip.test.js test/rfq.test.js`
     (Windows PowerShell 5.1 has no `&&`, so separate commands with `;`. `npm test` = `test/unit/*.test.js` + `test/integration/*.test.js`, the same globs CI runs.)
  4. Update `Codebase/remediation-board.csv` at each phase boundary using the regenerated tooling from Task 1.3-1. Do not hand-edit statuses: the current generator overwrites them.
- **Rig ports:** portal API `http://127.0.0.1:8090` · site edge `http://127.0.0.1:8100` (`scripts/dev-edge.mjs`, serves `apps/site/dist`) · PostgreSQL `127.0.0.1:5433`, db `simal`. The only roles are `simal` (superuser, owns every table) and `simal_app`; **there is no `postgres` role**. psql is `Codebase\tools\pgsql\bin\psql.exe`. In this document, "portal dir" = `Codebase/apps/portal` and "site dir" = `Codebase/apps/site`.
- **Shell:** Done-when commands that use `grep`/`tail`/`ls` need Git Bash. PowerShell equivalents are given where it matters.

```mermaid
flowchart LR
    P1[P1 Stabilize & VCS] --> P2[P2 Security blockers]
    P2 --> P3[P3 XSS & CSP closure]
    P3 --> P4[P4 CMS completion]
    P3 --> P5[P5 Publish & deploy truth]
    P3 --> P6[P6 Site truth & consistency]
    P4 --> P7[P7 Data & runtime posture]
    P5 --> P7
    P6 --> P7
    P7 --> P8[P8 Apps & compliance]
    P8 --> P9[P9 Test/CI/observability]
    P9 --> P10[P10 Clean-audit gate]
```

---

# PHASE 1 — Emergency Stabilization & Version Control *(Days 1–4)*

> Goal: the platform's core promise (CMS → site) works again, and the asset is protected by real VCS **without putting secrets or PII into history**. Closes **F-2026-N01 (Critical), F-2026-N03 (High), F-2026-N15 (Low)**, P0-1 and P0-5 residues, and SEC-10. It also pulls forward the commit-blocking part of F-2026-N14.
>
> **Execution order (v1.2):** `1.2-0 → 1.2-1` (snapshot locally) → `1.1-1 … 1.1-4` (each its own commit) → `1.2-2 → 1.2-3 → 1.2-4` → `1.3-1 → 1.3-2`. The snapshot comes first so the pipeline fix is not swept into the bulk commit. The scrub comes before the snapshot because untracked files hold live credentials (ledger V-19).

## Milestone 1.1 — Repair the SSG publish pipeline (closes F-2026-N01, restores SEC-10 acceptance)

> **Live state re-measured 16 Oct 2026.** In `outbox` (`to_addr='ssg-builder'`) there are 13 `queued` rows (14 Oct 02:42:57 → 15 Oct 23:50:18, UTC+8), 14 `failed` (11 Oct 23:49 → 13 Oct 23:51), 11 `processed` and 1 `sent`. `apps/portal/server.log` still logs `ssg_build_started` → `ssg_loop_failed: spawn EINVAL` every 10 s on job `pub_1791916977941` (last seen 16 Oct 11:32 UTC).
>
> No `processed` row carries the `{durationMs, verified}` meta that the current worker writes; they all carry `{"event":"cms.publish"}`. The hardened worker, with its 60 s timeout, has therefore **never completed a build**, and the timeout is unvalidated.

### Task 1.1-1 — Replace the `.cmd` spawn with a shell-free Astro invocation

**File:** `Codebase/apps/portal/src/server.js`, SSG loop (lines 147–208). Spawn set-up is at lines 159–162; the `execFile` call is at lines 175–201.

**Why:** `execFile('npm.cmd', …)` (line 175) throws `spawn EINVAL` synchronously on Windows for Node ≥ 18.20.2 / 20.12.2 / 21.7.3 and every 22.x/24.x (CVE-2024-27980: `.cmd`/`.bat` cannot be spawned without `shell:true`). The portal runs `Codebase/tools/node` **v24.21.0**.

**Where the binaries really are (verified).** `apps/site/node_modules` is empty, because npm workspaces hoist everything to `Codebase/node_modules`. Astro 5.18.2 is at `Codebase/node_modules/astro/astro.js` (`bin: {"astro":"astro.js"}`). Neither `node_modules` contains an `npm` package. npm exists only beside the Node binary, at `tools/node/node_modules/npm/bin/npm-cli.js`.

Replace lines 159–162. The resolver runs Astro's own CLI with the current Node binary: no shell and no npm layer, so a timeout kills the real build rather than an npm wrapper.

```js
const { execFile } = await import('node:child_process');
const fs = await import('node:fs');
const { createRequire } = await import('node:module');
const siteDir = process.env.SITE_DIR || path.resolve(config.root, '../site');
// SEC-10/P8-3 + F-2026-N01: never spawn a .cmd/.bat (spawn EINVAL since CVE-2024-27980).
// createRequire walks up from apps/site, so the workspace-hoisted Codebase/node_modules/astro is found.
const resolveBuildCommand = () => {
  try {
    const req = createRequire(path.join(siteDir, 'package.json'));
    const astroBin = path.join(path.dirname(req.resolve('astro/package.json')), 'astro.js'); // astro exports ./package.json
    if (fs.existsSync(astroBin)) return { cmd: process.execPath, args: [astroBin, 'build'] };
  } catch { /* fall through to npm */ }
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (fs.existsSync(npmCli)) return { cmd: process.execPath, args: [npmCli, 'run', 'build'] };
  if (process.platform !== 'win32') return { cmd: 'npm', args: ['run', 'build'] }; // Unix npm is a shebang script
  throw new Error('SSG build: neither astro.js nor npm-cli.js could be resolved from ' + siteDir);
};
```

The `execFile` call moves into Task 1.1-3's guarded block. Make the timeout configurable with `SSG_BUILD_TIMEOUT_MS` (default `300000`). The clean-DB gate already allows the same build 420 s (`scripts/ci/clean-db-build.mjs:28`), so a hard 60 s limit is unproven. Record the first real `durationMs` in `ARCHITECTURE_STATE.md`.

### Task 1.1-2 — Give the build its own read-only DB credential and an allowlisted environment

**Files:** `Codebase/apps/portal/src/server.js` (env block, lines 165–172) · `Codebase/apps/site/src/lib/db.ts` (fallback at line 8; pool at lines 7–11) · `Codebase/scripts/prod-db-roles.sql`.

**The defect (verified):**
- The worker deletes `DATABASE_URL` from the child env (line 168). The build reaches PostgreSQL only through the hardcoded fallback in `db.ts:8` (`postgres://simal:[REDACTED-ROTATED-2026-10]@127.0.0.1:5433/simal`), which works only because `pg_hba.conf` is `trust`.
- The secret strip is a *denylist* of 10 names. It leaves `DOC_ENCRYPTION_KEY`, `WEBHOOK_SECRET`, `SMTP_PASS`, `VIEWER_PASSWORD`, `ASP_SHARED_SECRET`, `NOTIFY_SMS_WHATSAPP_TOKEN` and every secret Phase 2 adds in the child env.
- Switch to an **allowlist**. The site reads only `DATABASE_URL`, `SITE_OUT_DIR`, `PORTAL_URL` and `PUBLIC_SITE_URL` (grep of `apps/site/src` and `astro.config.mjs`).

1. **Read-only build role.** Append to `scripts/prod-db-roles.sql`. The block is idempotent and runs as `simal`, the table owner:

```sql
-- psql -h 127.0.0.1 -p 5433 -U simal -d simal -v ON_ERROR_STOP=1 -v app_password=… -v build_password=… -f scripts/prod-db-roles.sql
SELECT 'CREATE ROLE simal_build LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 20'
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'simal_build') \gexec
ALTER ROLE simal_build PASSWORD :'build_password';        -- psql variables never expand inside DO $$…$$
GRANT CONNECT ON DATABASE simal TO simal_build;
GRANT USAGE ON SCHEMA public TO simal_build;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO simal_build;
-- default privileges apply only to objects created by the NAMED role; migrations run as "simal"
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public GRANT SELECT ON TABLES TO simal_build;
```

   Generate URL-safe passwords: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`. The old literal contained `#`, which truncates a connection URL.

2. **Allowlisted child env.** In `apps/portal/.env`, set `BUILD_DATABASE_URL=postgres://simal_build:<password>@127.0.0.1:5433/simal`. Then replace lines 165–172:

```js
// SEC-10/P8-3: the build gets an ALLOWLISTED environment — never the portal's secrets.
const ENV_ALLOW = new Set(['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'ComSpec', 'windir',
  'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'NODE_ENV',
  'SITE_OUT_DIR', 'PORTAL_URL', 'ASTRO_TELEMETRY_DISABLED']);
const sanitizedEnv = Object.fromEntries(Object.entries(process.env)
  .filter(([k]) => ENV_ALLOW.has(k) || k.startsWith('PUBLIC_')));
if (process.env.BUILD_DATABASE_URL) sanitizedEnv.DATABASE_URL = process.env.BUILD_DATABASE_URL; // read-only role
```

3. **Remove the fallback** in `apps/site/src/lib/db.ts` (lines 7–11) so a missing URL fails loudly:

```ts
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the SSG build (read-only build role)');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 15, idleTimeoutMillis: 30000 });
```

   This is safe for every existing caller: `clean-db-build.mjs:28`, `ci.yml:138/174` and `bringup.mjs:164-168` all pass `DATABASE_URL` explicitly. `npm run dev:site` will now need it as well.

4. Task 7.1-2 must add `simal_build` lines to both `pg_hba` files. If it doesn't, the build breaks at the scram switch.

**Done-when:**
- With `BUILD_DATABASE_URL` unset, the build fails with the explicit error.
- With it set, the 1.1-4 probe passes.
- `git grep -n "[REDACTED-ROTATED-2026-10]" -- apps/site` returns nothing.
- A temporary `log.info('ssg_env_keys', { keys: Object.keys(sanitizedEnv) })` shows only allowlisted keys plus `DATABASE_URL`. Remove the line after capture.

### Task 1.1-3 — A resolution or spawn failure marks the job `failed`; one builder at a time; one build drains everything queued before it

**File:** same block.

**Today:** a synchronous throw (EINVAL) escapes to the outer `catch` (lines 203–206). That logs `ssg_loop_failed`, leaves the job `queued`, and retries it every 10 s forever.

**v1.1 flaw:** the v1.1 snippet referenced `npmCli`, a block-scoped variable from 1.1-1, which is a `ReferenceError` here. It also left the "not found" `throw` outside the guarded block, which reproduces the jam.

**Also verified:** the job claim is non-atomic (`SELECT … LIMIT 1` at lines 152–153). A second app instance therefore double-builds into the same `dist`. That happens with any `bootApp()` in the gates, or a second portal.

```js
// at the top of the interval body, before the SELECT: one builder per database, across instances
const lock = await repos.client.query('SELECT pg_try_advisory_lock(727001) AS ok');
if (!lock.rows[0].ok) return;
// … existing SELECT of the oldest queued job; if none: await repos.client.query('SELECT pg_advisory_unlock(727001)'); return;
const t0 = Date.now();
const release = () => repos.client.query('SELECT pg_advisory_unlock(727001)').catch(() => {});
const markFailed = (errorMsg) => repos.client.query(
  "UPDATE outbox SET status = 'failed', meta = $1 WHERE id = $2",
  [JSON.stringify({ error: errorMsg, durationMs: Date.now() - t0 }), job.id]);
try {
  const build = resolveBuildCommand();                       // may throw: nothing to run
  execFile(build.cmd, build.args, {
    cwd: siteDir, env: sanitizedEnv, windowsHide: true, killSignal: 'SIGTERM',
    timeout: Number(process.env.SSG_BUILD_TIMEOUT_MS || 300000),
  }, async (err) => {
    try {
      /* existing callback body (lines 182–200). Success branch change: a build that started at t0
         renders every change committed before t0, so it satisfies every job queued before t0:
         UPDATE outbox SET status='processed', meta=$1
          WHERE to_addr='ssg-builder' AND status='queued' AND created_at <= $2   -- [meta, t0] */
    } finally { ssgBuilding = false; await release(); }
  });
} catch (spawnErr) {                                           // EINVAL / ENOENT / resolution failure
  ssgBuilding = false;
  const errorMsg = 'spawn failed: ' + String(spawnErr?.message);
  log.error('ssg_build_failed', { outboxId: job.id, error: errorMsg });
  await markFailed(errorMsg);
  await release();
}
```

Wrap the callback body in `try/finally` as shown. Any rejection inside an `execFile` callback is an unhandled rejection, which terminates Node 24, and `apps/portal/src` has no process-level handler.

### Task 1.1-4 — Drain the jammed queue and prove the loop end-to-end

1. **Preserve the evidence first.** `scripts\supervisor.cmd` starts the portal with `> server.log`, which truncates the file. The 14 Oct EINVAL history was already lost to a restart on 16 Oct at 06:28 UTC. Copy `apps/portal/server.log` and an outbox snapshot to `rm-evidence/1.1-4-before.*`, then change the supervisor to `>> server.log`.

2. **Restart properly.** `supervisor.cmd` only starts a portal whose `/api/health` fails. It does **not** restart a healthy one, so new code would never load. Stop the listener first, then run it from `Codebase`:

   `powershell -c "Get-NetTCPConnection -LocalPort 8090 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }"`
   `cmd /c scripts\supervisor.cmd`

3. **Watch the worker.**
   - Git Bash: `tail -f apps/portal/server.log | grep -E "ssg_build_(started|completed|failed)"`
   - PowerShell: `Get-Content apps\portal\server.log -Wait | Select-String 'ssg_build_'`

   With the 1.1-3 coalescing, the first green build marks all 13 queued jobs `processed`.

4. **Do not re-queue the 14 historical `failed` jobs.** Each one would be another full rebuild of the same database. Also, v1.1's cutoff `created_at < 1791900000000` (= 13 Oct 22:00 UTC+8) missed the failures between 22:00 and 23:51. Leave them as the honest record; the dashboard KPI (5.1-1) keys off the latest job.

5. **Create the control-loop probe.** No probe script was ever archived: `evidence/cms_control_loop_and_spawn_einval.txt` is a 476-byte output, not a script. Create `Codebase/scripts/ci/control-loop-probe.mjs`; it is reused by 5.2-3, 9.2-1 and 10.1-2.

```js
// scripts/ci/control-loop-probe.mjs — F-2026-N01 / CMS-10: edit → publish → build → served → restore.
import fs from 'node:fs';
import { totpNow } from '../../apps/portal/src/lib/security.js';
const API = process.env.PORTAL_URL || 'http://127.0.0.1:8090';
const ORIGIN = process.env.SITE_ORIGIN || 'http://127.0.0.1:8100';
const LIMIT_MS = Number(process.env.PROBE_TIMEOUT_MS || 180000);
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../../apps/portal/.env', import.meta.url), 'utf8'); } catch {}
const E = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const post = (p, body, h = {}) => fetch(API + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(body) });
let r = await post('/api/auth/login', { email: E('ADMIN_EMAIL'), password: E('ADMIN_PASSWORD') });
let d = await r.json();
if (d.mfaRequired) { r = await post('/api/auth/mfa', { mfaChallengeId: d.mfaChallengeId, code: totpNow(E('ADMIN_TOTP_SECRET')) }); d = await r.json(); }
if (!r.ok) throw new Error('login failed ' + r.status);
const H = { cookie: r.headers.getSetCookie().map(c => c.split(';')[0]).join('; '), 'x-csrf-token': d.csrfToken };
const put = (body) => fetch(API + '/api/cms/announcements/1', { method: 'PUT', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const publish = () => post('/api/cms/publish', { entities: [{ entity: 'announcements', entity_id: '1' }] }, H);
const ann = (await (await fetch(API + '/api/cms/announcements', { headers: H })).json()).announcements.find(a => a.id === 1);
const original = { text: ann.text, cta_href: ann.cta_href, cta_label: ann.cta_label };
const MARKER = 'RMPROBE-' + Date.now().toString(36).toUpperCase();
const t0 = Date.now(); let seenMs = -1;
try {
  console.log('PUT', (await put({ ...original, text: MARKER + ' (roadmap control-loop probe)' })).status);
  const p = await publish(); console.log('PUBLISH', p.status, JSON.stringify(await p.json()).slice(0, 120));
  while (Date.now() - t0 < LIMIT_MS) {
    if ((await (await fetch(ORIGIN + '/?rm=' + Date.now())).text()).includes(MARKER)) { seenMs = Date.now() - t0; break; }
    await new Promise(res => setTimeout(res, 3000));
  }
} finally {
  console.log('RESTORE', (await put(original)).status, (await publish()).status);
}
console.log(seenMs >= 0 ? `PASS marker ${MARKER} served after ${seenMs} ms` : `FAIL marker ${MARKER} not served within ${LIMIT_MS} ms`);
process.exit(seenMs >= 0 ? 0 : 1);
```

   After Phase 7.3 makes announcement edits approval-gated, this probe must also complete the second-approver step using the reviewer account. Task 7.3-4 extends it.

**Done-when (all four):**
- `psql -h 127.0.0.1 -p 5433 -U simal -d simal -c "SELECT status,count(*) FROM outbox WHERE to_addr='ssg-builder' GROUP BY 1;"` shows no `queued` row.
- `node scripts/ci/control-loop-probe.mjs` prints `PASS` and restores the announcement. Record the measured ms; it becomes the SLO for 5.2-3 and 10.1-2.
- **A deliberately broken build marks exactly one job `failed`, and the next job still processes.**
  - Renaming `apps/site/package.json` no longer breaks a direct-Astro build.
  - Instead, create `apps/site/src/pages/rm-deliberate-fail.astro` containing `---` / `throw new Error('rm-1.1-4 deliberate build failure');` / `---`. Astro skips `_`-prefixed pages, so the name must not start with `_`.
  - Publish and observe `failed`. Delete the file, publish again, and observe `processed`.
- `server.log` shows `ssg_build_completed` with today's date and a real `durationMs`.

Save every output to `rm-evidence/1.1-4.*`.

## Milestone 1.2 — Commit the remediation and protect the repository (closes F-2026-N03, P0-1 residue)

### Task 1.2-0 — Pre-commit hygiene: ignore runtime data, scrub credentials, triage gitleaks (v1.2 new)

**Why (all verified 16 Oct 2026):**

| Problem | Evidence | Consequence if 1.2-1 runs first |
|---|---|---|
| 8 full DB dumps in `Codebase/data/backups/dr_drill_*.sql` (8.7 MB: users + scrypt hashes, KYC submissions) | untracked and **not** ignored (`.gitignore` covers only `scripts/*-backup.sql`) | PII and password hashes in permanent history |
| 38 encrypted KYC documents in `Codebase/data/uploads/` | not ignored (`.gitignore:8` covers only `apps/portal/data/uploads/`) | KYC files committed, encrypted under a key that is itself in the source |
| `tools/node/` (107 MB; `node.exe` alone is 93.6 MB) | `.gitignore` has only top-level `tools/*.exe` | the runtime binary is committed |
| `scratch/` (evidence plus `verify_phase8_*.mjs` holding the live admin passphrase) | untracked and not ignored | live credential committed |
| Credential literals in **untracked** files: `scripts/prod-db-roles.sql:22` (`[REDACTED-ROTATED-2026-10]`, the password the script gives `simal_app`, a role that exists in the live DB), `scripts/seed_arabic_content.mjs:6` (`simal:[REDACTED-ROTATED-2026-10]`), `scripts/manual-e2e-audit.mjs:100-125` (live admin and reviewer passwords), `scripts/cleanup-legacy.mjs:5` and `scripts/scratch_check_db.mjs:3` (dev DSNs), `apps/portal/scripts/inspect-db.mjs:3-5` (dev DSN plus a query that dumps `password_hash`/`totp_secret`) | `git log --all -- <file>` is empty for each | the first commit publishes them; 1.2-2 pushes them |
| gitleaks: **9 findings already in committed history**: `FREEZE_MANIFEST.json` ×6 (file-hash false positives), `apps/portal/src/services/auth.service.js` ×1 (historic dev accounts), `apps/portal/test/audit-iterations-1-3.mjs:20-21` ×2 | `tools\gitleaks.exe git . --redact` (v8.28.0) | CI job `secrets-scan` (`ci.yml:32-41`) fails on the first push, and `build` needs it |

**Steps:**
1. `.gitignore` additions:

```gitignore
# RM-1.2-0: runtime state, bundled runtime, scratch (evidence folder kept)
/data/
/tools/node/
/scratch/*
!/scratch/rm-evidence/
/apps/site/dist-e2e/
```

2. Scrub before staging. Move these files out of the tree, or fix them now:
   - `prod-db-roles.sql`: create the role in the `DO`/`\gexec` block **without** a password, then `ALTER ROLE simal_app PASSWORD :'app_password';` outside the block (full text in Task 7.1-1).
   - `seed_arabic_content.mjs`: remove the fallback and fail loudly.
   - `manual-e2e-audit.mjs`, `cleanup-legacy.mjs`, `scratch_check_db.mjs` and `inspect-db.mjs`: read credentials from env (fail loudly), and drop the hash/TOTP dump.
   - Rotate the `simal_app` password, which is exposed in the working tree.
3. Triage every gitleaks finding with `tools\gitleaks.exe dir . --redact` and `tools\gitleaks.exe git . --redact`:
   - **Live credential:** rotate it.
   - **Dead credential** (old seed passwords that the audit proved return 401) or **false positive** (`FREEZE_MANIFEST.json` hashes): add the fingerprint with a one-line justification.
   - The current `.gitleaksignore` holds the line `tools/`. That is not a valid fingerprint and excludes nothing. Exclude vendored trees with `.gitleaks.toml` `[allowlist] paths` instead.
4. Delete or relabel the stale `C:\software_project\Simal_Corporate_website\.github\workflows\ci-pipeline.yml`. It sits outside the repo (`cd portal || exit 0`), and leaving it invites creating the remote at the wrong root.

**Done-when:** `git status --porcelain --untracked-files=all` lists no path under `data/`, `tools/node/` or non-evidence `scratch/`. `tools\gitleaks.exe dir . --redact` and `tools\gitleaks.exe git . --redact` both report 0 un-allowlisted findings. Save both reports to `scratch/rm-evidence/1.2-0.*`; this also creates the evidence folder that 1.2-1's last commit adds.

### Task 1.2-1 — Snapshot the working tree in logical commits

Measured state: `git -C Codebase status --porcelain --untracked-files=all` shows **73 modified + 92 untracked files**. `git status -s` collapses the untracked ones into 31 entries, which is where v1.1's "31" came from. v1.1's slices missed 7 modified and 66 untracked paths, so "status empty" was unreachable. Commit locally only; push happens in 1.2-2.

```bash
cd C:/software_project/Simal_Corporate_website/Codebase
git add .gitignore .gitleaks.toml .gitleaksignore && git commit -m "rm(1.2-0): ignore runtime data/bundled node/scratch; gitleaks allowlist"
git add apps/portal/src/lib/ apps/portal/src/config.js && git commit -m "rm(1.2-1a): security/http/config layer + virus scanner"
git add apps/portal/src/services/ apps/portal/src/store/ apps/portal/src/domain/ apps/portal/src/server.js && git commit -m "rm(1.2-1b): portal services, stores, server"
git add apps/portal/public/ && git commit -m "rm(1.2-1c): CMS console + portal UI"
git add apps/portal/test/ apps/portal/tools/ apps/portal/scripts/ && git commit -m "rm(1.2-1d): portal tests + tools"
git add apps/site/ && git commit -m "rm(1.2-1e): public site (links, a11y, /ar tree, SEO, consent)"
git add scripts/ infra/ docs/ .github/ package.json eslint.config.mjs && git commit -m "rm(1.2-1f): gates, nginx, docs, CI"
git add remediation-board.csv LEARNINGS.md Environment_Setup_Guide.md scratch/rm-evidence/ && git commit -m "rm(1.2-1g): board, notes, evidence"
git status -s        # must be empty
```

**Guard:** `git ls-files | grep -iE "\.env$|\.pem$|secrets"` must return nothing. It is a filename check only; content is covered by the gitleaks run in 1.2-0.

### Task 1.2-2 — Create the remote, push, protect `main`

Do **not** run `git init --bare`. Create a private repository on the company Git host (GitHub, GitLab or Azure DevOps). The current branch is already `main`. Then:

```bash
git remote add origin <URL>
git push -u origin main
```

On the host, protect `main`: no direct pushes, PRs required, required status checks = **all 12 CI jobs**, plus new jobs as they are added (`gate-placeholders`, `gate-perf`, `gate-sequences`, `lighthouse`). CI job IDs have no `name:`, so the check names are the IDs: `lint`, `secrets-scan`, `unit`, `integration`, `security`, `parity`, `build`, `gate-clean-db-build`, `gate-authz`, `gate-pg-reporting`, `gate-link-crawl`, `gate-a11y`. The workflow itself is named `CI` (`ci.yml:1`).

- **Approvals:** GitHub forbids self-approval. With one engineer (§11 base case), name a second approver, such as the PM or a reviewer, or `main` cannot be merged.
- **Gitleaks licence:** `gitleaks/gitleaks-action@v2` requires a `GITLEAKS_LICENSE` repository secret for organisation-owned repos.

### Task 1.2-3 — Make `ci.yml` executable (v1.2: it cannot pass as written)

The workflow has never run. When it does, it fails for the following reasons (verified):

| Job | Defect | Fix |
|---|---|---|
| `lint` (L19) | `npx eslint .` reports **493 errors in 36 committable files** (admin.js 224, cms.js 81, form.js 50…), mostly `no-undef`. `eslint.config.mjs` hand-lists 14 globals (no `Buffer`, `UI`, `API`…) and has no `ignores`. On the rig the same run reports 1,881 errors, because it also lints the git-ignored `tools/pgsql` pgAdmin bundle | declare the `globals` package (14.0.0 is already hoisted) as a devDependency; use `globals.browser` for `apps/portal/public/**`, `globals.node` for `apps/portal/src/**` and `scripts/**`, plus `{ UI: 'readonly', API: 'readonly' }`; `ignores: ['tools/**', 'scratch/**', 'data/**', '**/dist/**', 'apps/site/dist-e2e/**']` |
| `unit` (L43-57), `gate-authz` (L228-237), `gate-link-crawl` (L266-282) | no `npm ci`. `api.test.js` imports `server.js`, which imports `pg`, which fails with `ERR_MODULE_NOT_FOUND`. `scripts/ci/lib.mjs:20` loads `pg` at import time | add `- run: npm ci` after `setup-node` |
| `gate-a11y` (L284-302) | `needs: [build]` but never downloads the `site-dist` artifact, so `a11y.mjs:12-14` exits 2 | add `actions/download-artifact@v4` (`name: site-dist`, `path: apps/site/dist`); set `CHROME_PATH` from `which google-chrome` |
| `secrets-scan` (L32-41) | fails on history until 1.2-0's allowlist is committed | done in 1.2-0 |

CI runs on Ubuntu with Node 22 only, so it can never catch the Windows/Node 24 `.cmd` spawn class of regression (F-2026-N01). Add a `windows-latest` + Node 24 smoke job that runs Task 1.1-1's `resolveBuildCommand()` against `apps/site`.

### Task 1.2-4 — Capture the first green platform run (v1.2 new; split from 1.2-3)

`main` is protected, so do not push to it. Create branch `rm/1.2-3-ci` with the 1.2-3 fixes, open a PR, and iterate until all 12 checks are green.

**Done-when:** the green run URL is saved to `rm-evidence/1.2-4.txt`.

## Milestone 1.3 — Honest tracking surface (closes F-2026-N15, P0-5 residue)

### Task 1.3-1 — Make the board generator truthful, then regenerate

`scripts/ci/generate-remediation-board.mjs` **cannot do this today**:
- It overwrites `remediation-board.csv` (line 65) with `esc('open')` for every row (line 61), which wipes all 31 `closed` statuses.
- Its ID regex `^\| ([A-Z][A-Z0-9]{1,4}-\d+)` (lines 34, 47) cannot match `F-2026-N01`.
- Its header says the CSV is "generated, never hand-edited".

Extend it:
- (a) Overlay statuses from `audit_report_2/FINDINGS_MATRIX.csv` (`FIXED`/`FIXED_PER_PLAN` → `closed`, otherwise `open`; later this roadmap's tracker supplies them).
- (b) Append rows for **F-2026-N01…N17** and **P10-1…P10-4**. The audit noted "no P10 rows on the board"; their definitions are at `REMEDIATION_PLAN.md:355-361`.
- (c) Add an `evidence_ref` column.
- (d) Map severities to the board's `C/H/M/L`.

Expected deltas against the current board (77 rows, 31 closed / 46 open):
- **32 rows flip open → closed:** SEC-1/2/3/4/5/8/9/12/14, DAT-1/2/3/4/7/8, APP-1/2/5/6, A11Y-1…7, SEO-1/3/4/6, NFR-2/5.
- **11 rows flip closed → open:** SEC-11, CMS-2/3/4/7/8/9/10, PUB-8, PUB-11, PUB-12.

**Done-when:** the regenerated board matches the matrix row for row (diff saved), with 77 + 17 + 4 = 98 rows.

### Task 1.3-2 — Correct the governance claims (and the ADR numbering clash)

`Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md` table row **a44** (line 77) says "7 automated CI gates passing cleanly". v1.1's replacement ("7 automated gates green — first platform CI run…") would be a new false claim, because only 5 of the 7 gate scripts are in `ci.yml`. Use instead:
*"7 gate scripts green locally (log: `audit_report_2/evidence/ci_gates_full_run_2026-10-15.log`); 5 of 7 wired into CI — first platform run <URL from 1.2-4>; placeholders + perf wired in RM-9.1-1."*
In the same row, change "241 pages built" to the measured 243.

**ADR (v1.1 premise was false).** ADR-14 is *not* phantom. It exists at `Project_doc/02_Architecture/ADR_Architecture_Decision_Records.md:44` ("ADR-14 — As-built stack ratification…"), and it names `Codebase/docs/adr/ADR-009-AS-BUILT-STACK-RATIFICATION.md` as canonical. The real defect is a number clash: in the master log, ADR-9 is "Hosting" (line 29). Fix it this way:
- Rename the file to `ADR-014-AS-BUILT-STACK-RATIFICATION.md` and update its header ID.
- Cite "ADR-14" in baseline row a1 (line 34, currently "ADR-009 / ADR-14").
- Correct `apps/portal/public/assets/js/cms.js:11`, which says "ADR-13 / ADR-14 static site publish"; publish is ADR-13 only.

Also fix or mark superseded the divergent duplicate `Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md`, which carries the same claim. Name `Codebase/docs/` as the authoritative copy.

**Phase 1 exit gate:**
- the control-loop probe passes;
- `run-gates.mjs` is all green;
- `git status -s` is empty;
- gitleaks is clean on all history;
- the remote is protected;
- the first green platform CI run is archived;
- the board is regenerated and matches the matrix.

---
# PHASE 2 — Security Blockers to Zero *(Days 4–8)*

> Closes **F-2026-N02 (High)**, **F-2026-N04 (Medium)**, **F-2026-N08/N09 (Medium)**, **F-2026-N06/N07/N14 (Medium/Low)** and the SEC-6/SEC-7 partials. After this phase the P1 retest (P10-2 scope) must find nothing.

## Milestone 2.1 — Verify the CSRF synchronizer token for real (closes F-2026-N02 / SEC-7 residue)

> **Policy decision.** Record it in `ARCHITECTURE_STATE.md`.
>
> Today's layer is a *Fetch-Metadata + Origin* defence. The token is consulted only as an override for cross-site or untrusted-origin requests.
>
> v1.1 claimed that verifying the token "breaks the whole CMS". **That is false for the 2.1-1 design.** Same-origin CMS calls carry an allowed `Origin` (`http.js:149-158` allow-lists the request's own `Host`), so they never reach the token check.
>
> There are two compliant end states:
> - **A (minimum, closes F-2026-N02):** Task 2.1-1 only. A token header is honoured only if it verifies.
> - **B (recommended, ASVS-strict):** A, plus a valid token required on **every** cookie-authenticated state-changing request to `/api/admin/*`, `/api/cms/*`, `/api/einvoice/*`, `/api/integrations/*` (except the signed bounce webhook) and `/api/auth/logout`. B needs the client wiring (2.1-3) to be live **before** `CSRF_STRICT=true` is set.

### Task 2.1-1 — Wire `verifyCsrfToken` into the dispatch middleware, with a real CSRF secret

**File:** `Codebase/apps/portal/src/lib/http.js`, `dispatch()` CSRF block (lines 130–166). The presence-only bypasses are at lines 138 and 162. Live-proven: evil origin + `x-csrf-token: bogus` → 200.

Extend the existing import (line 8):

```js
import { SECURITY_HEADERS, verifyCsrfToken } from './security.js';
```

Then, in `dispatch()`:

```js
const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
if (isStateChanging) {
  const secFetchSite = (req.headers['sec-fetch-site'] || '').toLowerCase();
  const origin = req.headers['origin'];
  const csrfToken = req.headers['x-csrf-token'];
  // F-2026-N02: a token header is honoured only when it VERIFIES against the session id
  // (same cookie grammar as auth.service.js:108 sessionFromCookie).
  const sidMatch = /(?:^|;\s*)(?:__Host-)?kyc_sid=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  const csrfOk = Boolean(csrfToken && sidMatch && verifyCsrfToken(String(csrfToken), sidMatch[1]));

  if (secFetchSite === 'cross-site' && !csrfOk) {
    throw new HttpError(403, 'Cross-site request blocked: missing or invalid CSRF token');
  }
  if (origin) {
    // … existing allowed-hosts computation (lines 144–160), unchanged …
    if (!isAllowed && !csrfOk) throw new HttpError(403, 'Cross-origin request blocked: untrusted origin');
  }
  // Policy B — enable with CSRF_STRICT=true only AFTER Task 2.1-3 is deployed:
  if (process.env.CSRF_STRICT === 'true' && sidMatch && !csrfOk &&
      /^\/api\/(admin|cms|einvoice|integrations)\/|^\/api\/auth\/logout$/.test(req.path) &&
      req.path !== '/api/integrations/email/bounce') {
    throw new HttpError(403, 'CSRF token required');
  }
}
```

**Secret (v1.2 gap).** `generateCsrfToken()` keys its HMAC with `CSRF_SECRET || JWT_SECRET || 'simal-csrf-salt-2026'` (`security.js:141`). Neither variable exists in `apps/portal/.env` or in either `.env.example`, so every token today is keyed by the committed literal. To fix:
- Add `CSRF_SECRET` (32 random bytes, hex) to every environment.
- Make `assertBootConfig()` (`config.js:87-93`) fail in `production` without it.
- Delete the literal fallback once every environment has the secret.

### Task 2.1-2 — Regression tests (both directions)

Add to `apps/portal/test/integration/api.test.js`.

**v1.2 correction.** This suite pins `ADMIN_MFA_REQUIRED='true'` (line 28). A bare password login therefore returns `{mfaRequired:true}` with no cookie and no token, so v1.1's test could never pass. Use the suite's own helpers (`api.call`, `cookieOf`, `totpNow`, `ADMIN_TOTP`):

```js
test('CSRF: bogus token cannot bypass cross-origin blocking (F-2026-N02)', async () => {
  const fresh = async () => {                                   // MFA-aware, uncached session
    const r1 = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    const r2 = await api.call('POST', '/api/auth/mfa', { body: { mfaChallengeId: r1.json.mfaChallengeId, code: totpNow(ADMIN_TOTP) } });
    return { cookie: cookieOf(r2), csrf: r2.json.csrfToken };
  };
  const evil = (s, tok) => api.call('POST', '/api/auth/logout',
    { cookie: s.cookie, headers: { origin: 'https://evil.example', ...(tok ? { 'x-csrf-token': tok } : {}) } });
  const s = await fresh();
  assert.equal((await evil(s, null)).status, 403, 'no token → 403');
  assert.equal((await evil(s, 'totally-bogus')).status, 403, 'bogus token → 403');
  assert.equal((await evil(s, (await fresh()).csrf)).status, 403, "another session's token → 403");
  assert.ok((await evil(s, s.csrf)).status < 400, 'own valid token → allowed');
});
```

**Done-when:** the test passes, and `evidence/iteration2_live_proofs.mjs` §1 case **B prints 403**. Case A stays 403. Case C stays 200 under policy A; under policy B it becomes 403 because it sends no token, which is the intended strict outcome. Record which policy is live. Capture to `rm-evidence/2.1-2.log`.

### Task 2.1-3 — Client-side token wiring (prerequisite for policy B; defence-in-depth for A)

`grep -i csrf public/assets/js/*.js` returns 0 matches (verified), so no staff page sends the token today.

`cms.js` sends every call through `api.js` (56 `API.*` call sites). **But `api.js` is not the only funnel.** `admin.js` calls `fetch` directly in three places:
- line 714 — `POST /api/admin/screening/reload`
- line 945 — `POST /api/admin/screening/reload`
- line 1040 — `POST /api/admin/reports/export.csv`

Steps:

1. In `public/assets/js/api.js`, keep the token in the closure. Expose the setter **inside** the `global.API = {…}` literal. (v1.1 assigned `global.API.setCsrf` before `global.API` exists at line 34, which throws a `TypeError`.)

```js
  let CSRF = null;                                                    // top of the IIFE
  async function call(method, path, body, opts = {}) {
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (CSRF && method !== 'GET') headers['x-csrf-token'] = CSRF;      // SEC-7 synchronizer token
    const res = await fetch(path, { method, credentials: 'same-origin', headers,
      body: body ? JSON.stringify(body) : undefined, keepalive: !!opts.keepalive });
    const rotated = res.headers.get('X-CSRF-Token');                   // set by login/mfa/register/me/session
    if (rotated) CSRF = rotated;
    /* …existing json/error handling (lines 17–25) unchanged… */
  }
  // …and inside global.API = { … } add:
  //   setCsrf: (t) => { CSRF = t || null; },
  //   csrf: () => CSRF,
```

2. **No server change is needed for page reloads.** `/api/auth/me` (`routes.js:235-239`) and `/api/auth/session` (`routes.js:240-248`) *already* return `csrfToken` and set the `X-CSRF-Token` header; v1.1's instruction to add it was stale. Every page that boots with `API.me()` or `API.session()` is seeded automatically through `call()`.
3. Patch the three raw `fetch` calls in `admin.js` to send `'x-csrf-token': API.csrf()`, or route them through `API.post`.
4. Bump the cache-busters so browsers pick up the change: `cms.html:871` `api.js?v=4` → `?v=5`, and `admin.html:133` `api.js?v=3` → `?v=4` (plus the `admin.js` tag).
5. Only then set `CSRF_STRICT=true` (policy B), per environment.

**Done-when:** with 2.1-1 live (and B, if chosen), these complete in the browser and DevTools shows `x-csrf-token` on every mutating request:
- the full CMS drive: login → edit announcement → publish → rollback;
- the admin console: user create, force logout, settings save, screening reload, report CSV export.

Save a screenshot to `rm-evidence/2.1-3.png`.

## Milestone 2.2 — Finish PII masking (closes F-2026-N04 / SEC-6 residue)

> **v1.2 scope correction.** SEC-6's acceptance (REMEDIATION_PLAN P1-4, line 194) is "a reviewer's report shows masked IBAN/TRN; only `view_pii` sees full values". P1-4 told engineers to "apply the same masking the CSV export uses" — but that export masks only IBAN. Three staff surfaces return submission PII, and they disagree today:
>
> | Surface | Gate | Unmasked to non-`view_pii` staff today |
> |---|---|---|
> | `POST /api/admin/reports/build` + `/reports/export.csv` (`admin.service.js:264-272`) | `read_audit` (super_admin, reviewer) | TRN, Peppol ID, licence no., contact name/email/mobile |
> | `GET /api/admin/export.csv` (`analytics.service.js:70-109`, route `routes.js:489`) | `read_audit` | TRN, Peppol ID, licence no., primary email |
> | `GET /api/admin/submissions` list (`review.service.js:41-51`, field `tin` at line 47) | `read` (**viewer too**) | full TRN |
>
> - A viewer cannot reach the two report routes (no `read_audit`), so N04's leak there affects reviewers only. The queue list, however, exposes TRN to viewers as well.
> - The report field keys are `company.license_number`, `contacts.primary.*` and `tax.peppol_id`. There are **no** `licences.*` keys, so v1.1's masking branch would never have fired.
> - The existing test `api.test.js:311-322` ("export.csv is PII-safe by default") asserts only that IBAN is masked.

### Task 2.2-1 — One masking policy, applied to every staff surface

Create `Codebase/apps/portal/src/domain/pii.js` and use it from three places:
- `admin.service.js` `buildReport()` — replace the masking branch at lines 268–272;
- `analytics.service.js` `createExport().csv()` — replace line 101;
- `review.service.js` `summarise()` — line 47.

```js
// domain/pii.js — SEC-6: single source of truth for staff-facing PII masking (view_pii sees raw).
const keep = (v, head, tail) => {
  const s = String(v);
  return s.length <= head + tail ? '•'.repeat(s.length) : s.slice(0, head) + '•'.repeat(Math.max(3, s.length - head - tail)) + s.slice(-tail);
};
export const PII_MASKERS = {
  'banking.iban': (v) => keep(v, 7, 4),                                     // AE86026••••…0000
  'tax.trn': (v) => keep(v, 3, 3),                                          // 100•••••••••090
  'tax.peppol_id': (v) => String(v).replace(/(\d{3})\d+(\d{2})$/, '$1•••••$2'),   // 0235:100•••••67
  'company.license_number': (v) => keep(v, 2, 2),
  'contacts.primary.name': (v) => String(v).trim().split(/\s+/).map(w => w[0] + '.').join(' '),
  'contacts.primary.email': (v) => String(v).replace(/^(.).*(@.*)$/, '$1•••$2'),
  'contacts.primary.mobile': (v) => '••••' + String(v).slice(-4),            // same as review.service.js:70
};
export const maskField = (field, v, canViewPii) =>
  (canViewPii || v == null || v === '' || !PII_MASKERS[field]) ? v : PII_MASKERS[field](v);
```

Wire it in at each call site:

- **`buildReport`:** `let v = maskField(f, getVal(s, f), canViewPii);` (keep `canViewPii` as computed at line 266). `reportToCsv()` consumes `report.rows`, so the report CSV inherits the masking.
- **`createExport`:** `v = maskField(c[0], v, includePii);`
- **`summarise`:** thread the caller's `session` into `review.list()` (line 12; route `routes.js:452`) and set `tin: maskField('tax.trn', s.tax?.trn || s.tax?.foreign_tax_id || null, can(session, 'view_pii'))`. Extend the import at `review.service.js:5` to `import { canApplyAction, PENDING_SET, can } from '../domain/rules.js';`.

### Task 2.2-2 — Regression tests

Add to `api.test.js`, using the suite's `loginReviewer`, `loginAdmin` and `fullApplication` helpers. (`reviewerHeaders` does not exist.)

```js
test('SEC-6: reviewer report + KYC export mask TRN/IBAN/email; super admin sees raw (F-2026-N04)', async () => {
  const app = fullApplication('vendor', 'mask-probe@example.com');
  await api.call('POST', '/api/public/applications', { body: { application: app } });
  const rev = await loginReviewer();
  const rep = await api.call('POST', '/api/admin/reports/build', { cookie: rev.cookie,
    body: { fields: ['id', 'banking.iban', 'tax.trn', 'contacts.primary.email', 'contacts.primary.mobile'] } });
  assert.equal(rep.status, 200);
  const body = JSON.stringify(rep.json);
  assert.ok(!body.includes(app.tax.trn), 'no raw TRN in report');
  assert.ok(!body.includes(app.banking.iban), 'no raw IBAN in report');
  assert.ok(!body.includes('mask-probe@example.com'), 'no raw email in report');
  const csv = await api.call('GET', '/api/admin/export.csv', { cookie: rev.cookie, raw: true });
  assert.ok(!csv.text.includes(app.tax.trn), 'no raw TRN in KYC export');
  const admin = await loginAdmin();
  const full = await api.call('POST', '/api/admin/reports/build', { cookie: admin.cookie, body: { fields: ['tax.trn'] } });
  assert.ok(JSON.stringify(full.json).includes(app.tax.trn), 'view_pii sees raw TRN');
});
```

Also extend the leak check in `scripts/ci/authz-matrix.mjs` from IBAN only to `AE\d{21}` **and** 15-digit TRNs.

**Done-when:**
- the test passes;
- a live re-run of `evidence/live_probes.mjs` §G prints `hasAE:false trnLeak:false` — that script reads `ADMIN_*` and `REVIEWER_*` from **process env**, not `.env`, so export them first;
- super_admin still sees raw values.

Save the output to `rm-evidence/2.2-2.log`.

## Milestone 2.3 — Tighten the privileged surface (closes F-2026-N08, F-2026-N09)

### Task 2.3-1 — Authenticate the email-bounce webhook

**File:** `Codebase/apps/portal/src/services/routes.js:921-924` (route) → `integ.handleBounce` (`integration.service.js:46-49`, which writes an `audit_log` row with actor `smtp`, action `email_bounce`).

**v1.2 corrections:**
- (a) Route handlers receive `(req, res, next)`. The body is **not** the third argument; read it from the request.
- (b) The service call is `integ.handleBounce` (`const integ = createIntegrationService(repos)`, line 906). `integration.recordBounce` does not exist.
- (c) An HMAC over `JSON.stringify(parsedBody)` will not match the sender's raw bytes, because key order and whitespace differ. Sign the **raw** body and bind a timestamp to stop replays.
- (d) `WEBHOOK_SECRET` already exists (`config.js:83`), but it signs *outbound* ERP webhooks. Use a separate inbound secret.

```js
// routes.js — inbound bounce webhook: raw-body HMAC + 5-minute replay window (F-2026-N08)
const readRawBody = (req, limit = 64 * 1024) => new Promise((resolve, reject) => {
  const chunks = []; let n = 0;
  req.on('data', c => { n += c.length; if (n > limit) { reject(new HttpError(413, 'Request body too large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', () => reject(new HttpError(400, 'Body read error')));
});
r.post('/api/integrations/email/bounce', limited(publicLimiter), async (req, res) => {
  const secret = config.integration.bounceWebhookSecret;
  if (!secret) throw new HttpError(503, 'Bounce webhook not configured');
  const ts = String(req.headers['x-webhook-timestamp'] || '');
  const sig = String(req.headers['x-webhook-signature'] || '');
  if (!/^\d{13}$/.test(ts) || Math.abs(Date.now() - Number(ts)) > 300000) throw new HttpError(403, 'Stale or missing timestamp');
  const raw = await readRawBody(req);
  if (!timingSafeEqual(sig, hmacSign(secret, ts + '.' + raw.toString('utf8')))) throw new HttpError(403, 'Invalid webhook signature');
  let b; try { b = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON body'); }
  ok(res, await integ.handleBounce({
    email: String(b.email || '').slice(0, 254), reason: String(b.reason || '').slice(0, 300), type: String(b.type || 'bounce').slice(0, 20),
  }));
});
```

Supporting changes:
- In `config.js`, add `bounceWebhookSecret: env('BOUNCE_WEBHOOK_SECRET')` to `integration: { … }`.
- Add `BOUNCE_WEBHOOK_SECRET=` to `apps/portal/.env.example`.
- Sender side: send `X-Webhook-Timestamp: <ms>` and `X-Webhook-Signature: hmacSign(secret, ts + '.' + rawBody)`.

### Task 2.3-2 — Gate the observability and signing endpoints

Same file. These three routes are `...adminAuth` only today, so any staff role (including viewer) can call them:
- `/api/integrations/webhook/test-sign` (line 981)
- `/api/admin/observability/errors` (line 987)
- `/api/admin/observability/test-error` (line 991)

**v1.2 correction.** There is **no `manage_users` permission**. `rules.js` defines only `read, export, decide, query, notes, reopen, view_pii, manage_invites, read_audit`, so `requirePerm('manage_users')` would 403 everyone, super_admin included. The codebase's super-admin-only convention is `requirePerm('view_pii')`, used on all `/api/admin/users*` routes (lines 621–635):

```js
r.post('/api/integrations/webhook/test-sign', ...adminAuth, requirePerm('view_pii'), async (req, res) => { … });
r.get('/api/admin/observability/errors', ...adminAuth, requirePerm('view_pii'), async (req, res) => { … });
r.post('/api/admin/observability/test-error', ...adminAuth, requirePerm('view_pii'), async (req, res) => {
  if (config.env === 'production' && process.env.ALLOW_TEST_ERROR !== 'true') throw new HttpError(404, 'Not found');
  throw new Error('Synthetic test error for observability verification (NFR-3)');
});
```

If you prefer a dedicated permission, add `'manage_platform'` to `PERMISSIONS.super_admin` in `rules.js` and use it instead. In the same commit, update `test/unit/security-rules-store.test.js` and the authz gate's route matrix.

**Done-when:** a new integration test proves all of the following, with negative and positive proof captured:
- viewer **and reviewer** get 403 on all three routes;
- super_admin gets 200 (errors, test-sign) and 500 (test-error) as designed;
- an unsigned bounce gets 403, and a stale timestamp gets 403;
- a correctly signed bounce gets 200 and writes exactly one `email_bounce` audit row.

## Milestone 2.4 — Secrets & environment hygiene (closes F-2026-N06, N07, N14 + `.env` drift)

### Task 2.4-1 — Real document-encryption key, ClamAV config and corrected env templates

> **Two env templates exist:**
> - `Codebase/.env.example` (root): `ADMIN_MFA_REQUIRED=false`, no `ADMIN_PASSWORD_MIN`, and `ASP_KEY`/`ASP_SECRET` although the code reads `ASP_SHARED_SECRET`.
> - `Codebase/apps/portal/.env.example`: `ADMIN_PASSWORD_MIN=8`, `PORT=3000`.
>
> The portal loads only `apps/portal/.env` (`config.js:16`). Make `apps/portal/.env.example` authoritative and reduce the root file to a pointer.

1. **Do not just set a new key.** Task 2.4-3 must run in the same change window, or every existing document becomes unreadable.

2. **Harden the fallback** in `src/store/pg-repos.js:20-23` **and** its JSON twin `src/store/repos.js:11-14`. `SESSION_SECRET` is referenced nowhere else; it is a dead fallback.

```js
const LEGACY_DOC_SECRET = 'simal-document-encryption-key-2026';   // decrypt-only; deleted at the end of 2.4-3
const docKeyFrom = (secret) => crypto.scryptSync(secret, 'simal-doc-enc-salt-v1', 32);
function getDocCipherKey() {
  const s = process.env.DOC_ENCRYPTION_KEY;
  if (!s) throw new Error('DOC_ENCRYPTION_KEY is required (refusing to encrypt with a default key)');
  return docKeyFrom(s);
}
// decryptDocBuffer(): try getDocCipherKey(); on GCM auth failure retry ONCE with docKeyFrom(LEGACY_DOC_SECRET)
// and log 'doc_legacy_key_used' — keeps reads working until 2.4-3 has re-encrypted everything.
```

   The integration suites set `DATA_DIR` to a temp dir. They must now also set `DOC_ENCRYPTION_KEY`: add one line to the boot env of `api.test.js` and `workspace.test.js`.

3. **ClamAV.** The client is already present; `virus-scanner.js:145-147` engages only when `CLAMAV_HOST`/`CLAMAV_PORT` are set. Set both wherever clamd runs (Task 8.1-1), and add both, empty, to the template.

4. **`apps/portal/.env.example`:**
   - Set `ADMIN_PASSWORD_MIN=15` (it says 8). Also fix the stale "default 8" comment at `config.js:56-57`; the code default is 15.
   - Add `NODE_ENV=`, `DATABASE_URL=`, `ADMIN_DATABASE_URL=`, `BUILD_DATABASE_URL=`, `CSRF_SECRET=`, `DOC_ENCRYPTION_KEY=`, `CLAMAV_HOST=`, `CLAMAV_PORT=`, `CLAMAV_REQUIRED=`, `BOUNCE_WEBHOOK_SECRET=`, `ASP_ENDPOINT=`, `ASP_SHARED_SECRET=`, `LEGACY_TOKEN_SECRET=`, `ERP_WEBHOOK_URL=`, `ALLOWED_ORIGINS=`, `TRUSTED_PROXIES=`, `SSG_BUILD_TIMEOUT_MS=`, `DEPLOY_DIR=`, `OBSERVABILITY_WEBHOOK_URL=`, `SLA_ESCALATION_EMAIL=`, `DOC_URL_TTL_MS=`.

5. **Admin address typo.** In `apps/portal/.env`, change `ADMIN_EMAIL=admin@smartme.com` to `admin@simalme.com`. `auth.bootstrap()` runs at **boot** (`server.js:60`), so restart the portal, confirm the new account exists, then deactivate the old `smartme` account from the CMS user manager.

6. **Rotate the dev TOTP secret and enable MFA.**
   - v1.1's generator (`randomBytes(20).toString('base32')`) **throws**: Node has no `base32` encoding.
   - Use the one-liner already in `apps/portal/.env.example`, or from `apps/portal` run `node -e "import('./src/lib/security.js').then(m=>console.log(m.generateTotpSecret()))"`.
   - Set `ADMIN_MFA_REQUIRED=true` (GOV-REQ-BASELINE a16).
   - **Knock-on:** password-only scripts must gain the MFA step (pattern: Task 1.1-4's probe) or use the non-MFA reviewer account. That covers `evidence/live_probes.mjs`, `evidence/iteration2_live_proofs.mjs`, `scripts/ci/test-cms-e2e.mjs` and the authz gate. (`scripts/ci/lib.mjs` `login()` already handles TOTP.)

### Task 2.4-2 — Remove committed credentials (F-2026-N14) and gate them with gitleaks

> The untracked offenders are scrubbed in **Task 1.2-0, before the first commit**. This task finishes the job for what is already in history and in the remaining files.

- **`scripts/prod-db-roles.sql:22`** (v1.1 said 21). The literal sits **inside a `DO $$ … $$` block** (lines 11–36), where psql never expands `:'var'`. v1.1's `PASSWORD :'app_password'` would therefore reach the server verbatim and fail. The ELSE branch (24–33) also never resets the password, so a re-run leaves the exposed one live. Final text is in Task 7.1-1. Rotate the exposed value; `simal_app` exists in the live DB.
- **`scripts/seed_arabic_content.mjs:6`** (v1.1 said 5) and **`scripts/scratch_check_db.mjs:3`** (both untracked — scrubbed in 1.2-0): delete the `simal:[REDACTED-ROTATED-2026-10]` fallback and fail loudly (`if (!process.env.DATABASE_URL) throw …`).
- **v1.2 scope addition: `[REDACTED-ROTATED-2026-10]`.** The dev password `[REDACTED-ROTATED-2026-10]` is hardcoded in 21 *tracked* files at `HEAD` (`git grep -l [REDACTED-ROTATED-2026-10] HEAD`; plus untracked `scripts/cleanup-legacy.mjs:5`, handled in 1.2-0), including:
  - `apps/site/src/lib/db.ts:8`
  - `scripts/ci/test-cms-e2e.mjs:18`
  - `apps/portal/tools/sync-sequences.mjs:4` (no env override at all)
  - `apps/portal/tools/{cleanup-test-pollution.js:10, probe-db.mjs:3, seed_cms_blocks.mjs:6}`
  - `scripts/{update-slides.cjs:4, check-pngs.cjs:3, setup.cmd:8, hypercare-daily.js:31, smoke-test.js:53, cutover-rehearsal.js, freeze-manifest.js, go-nogo-gate.js, golive-execute.js, parity-checklist.js, perf-baseline.js, postlive-review.js}`
  - `apps/portal/test/{einvoice-immutability.test.js:11, pg-integration-test.js:15, pg-mode-journey.test.js:38}`

  Replace each with a required `DATABASE_URL` that fails loudly. The value is already in history, so the `simal` password must be **rotated** when 7.1 introduces password auth.
- **`apps/portal/data/db.json`** is git-**ignored** (`.gitignore:7`), so it is not a committed credential. Still normalise its legacy 15-digit Peppol endpoints (`settings.simalPeppol`, one `buyerPeppol`, three submission `tax.peppol_id` values) with a one-off load-rewrite-save script.
- **Gate.** Do not hand-roll a grep. v1.1's snippet had an unescaped `'` inside a single-quoted string, used an un-imported `exec`, and would have matched itself. Instead:
  - CI already runs `gitleaks/gitleaks-action@v2` (`ci.yml:38`), and `tools/gitleaks.exe` v8.28.0 is vendored.
  - Add a custom rule to `.gitleaks.toml` for DSN credentials: `postgres(ql)?://[^:/\s]+:[^@\s$]+@`.

**Done-when:**
- `git grep -nE "[REDACTED-ROTATED-2026-10]|simal:[REDACTED-ROTATED-2026-10]|simal:[REDACTED-ROTATED-2026-10]"` returns nothing;
- `tools\gitleaks.exe git . --redact` reports 0 un-allowlisted findings;
- the portal boots with `DOC_ENCRYPTION_KEY` set and refuses to boot without it (test by unsetting it);
- the CI `secrets-scan` job is green.

### Task 2.4-3 — Re-encrypt and relocate the stored documents (v1.2 new — data-loss guard for F-2026-N06)

**Evidence:**
- `documents` has 641 rows, but only **38** files exist on disk.
- All 38 are in `Codebase/data/uploads/` (`SIMALENC1` header) and were encrypted with `scrypt('simal-document-encryption-key-2026')`, because neither `DOC_ENCRYPTION_KEY` nor `SESSION_SECRET` is set. Changing the key without migrating makes each of them fail AES-GCM authentication.
- **They are also unreachable today.** `UPLOADS_DIR` is cwd-relative: `pg-repos.js:15-17` uses `path.resolve('data/uploads')`. Both launchers start the portal from `apps/portal` (`supervisor.cmd`, `bringup.mjs:149-150`), so the running portal reads the **empty** `apps/portal/data/uploads/`.
- The remaining 603 rows reference files that no longer exist (test fixtures).

Steps:
1. Anchor the path: `const UPLOADS_DIR = path.join(config.dataDir, 'uploads');` in `pg-repos.js` and `repos.js`. `config.dataDir` is anchored to `apps/portal` (`config.js:44`). Back up `Codebase/data/uploads/` and move its files to `apps/portal/data/uploads/`.
2. Write a one-off `apps/portal/tools/reencrypt-documents.mjs`. For each `documents.rel_path`:
   - if the file is absent, list it as an orphan;
   - otherwise decrypt with the legacy key (legacy plaintext without a `SIMALENC1` header is read as-is) → encrypt with `DOC_ENCRYPTION_KEY` → write to a temp file → atomic rename.
   - Log counts.
3. Verify a sample: 5 documents download through the signed-URL route and byte-compare equal to the backup's decrypted plaintext. Then:
   - delete the legacy-key retry and the literal from `pg-repos.js`/`repos.js`;
   - decide what happens to the 603 orphan rows (delete as fixtures, or mark them) and record the decision.

**Done-when:**
- the script reports `38 re-encrypted, 0 failed, 603 orphan rows listed`;
- `doc_legacy_key_used` no longer appears after a full read sweep;
- `git grep simal-document-encryption-key` returns nothing.


### Task 2.4-3 — Re-encrypt and relocate the stored documents (v1.2 — data-loss guard for F-2026-N06)

**Why:** rm(2.4-1) rotated `DOC_ENCRYPTION_KEY`. Any document encrypted under a pre-rotation key (the committed fallback or SESSION_SECRET) would become **undecryptable** — silent data loss on the next download. Guard both ways:

1. **Self-healing read path** (`pg-repos.js` + `repos.js`): `decryptDocBuffer` tries the current key first, then legacy candidates; `documents.readFile` re-encrypts and rewrites any legacy-key file in place (warn logged) — a missed migration can never lose a document.
2. **Explicit migration tool** `scripts/reencrypt-documents.mjs`: dry-run audit by default (current/plain/legacy/corrupt per file); `--apply` atomically re-encrypts legacy files (write-temp → verify-decrypt → rename). Exit 1 on corrupt files.

**Done-when:** a file forged under the legacy key is (a) reported LEGACY by the dry-run, (b) converted by --apply and verified decryptable under the current key with payload intact, (c) read via `documents.readFile` self-heals even without the tool; re-audit reports 0 legacy / 0 corrupt.

**Phase 2 exit gate:**
- all tests green;
- `run-gates.mjs` green;
- iteration-2 proof §1 case B = 403;
- reviewer report, KYC export and queue list all masked;
- gitleaks clean;
- documents readable under the new key from the running portal.

---
# PHASE 3 — Injection, XSS & CSP Closure *(Days 8–11)*

> Closes the **SEC-13 partial** and **F-2026-N10**. Every stored value that reaches `innerHTML` or an `href`/`src` must be scheme-checked and escaped, and the public CSP must drop `'unsafe-inline'` from `script-src` without breaking a page.
>
> **v1.2:** v1.1 Phase 3 had four problems:
> - It missed half the sinks: the Arabic twins, the recently-viewed grid, the hero image, insight and document links.
> - It reused a bypassable sanitizer.
> - It edited the wrong nginx server block.
> - It removed `'unsafe-inline'` *before* eliminating the inline scripts, which would have broken 243/243 pages.

## Milestone 3.1 — Close the public-site sinks

### Task 3.1-1 — One shared URL guard, applied to every DB-fed `href`/`src` on the site

**The "already sanitized" announcement link is bypassable.** `BaseLayout.astro:51-56` is a *denylist* (`/^(?:javascript|data|vbscript):/i`). With the WHATWG URL parser, each of these resolves to `javascript:alert(1)` and passes the check:
- `"java\tscript:alert(1)"`
- `"java\nscript:alert(1)"`
- `"\u0001javascript:alert(1)"`

v1.1's replacement accepted any value starting with `/`. That lets through protocol-relative `//evil.example/x` and `/\evil.example/x`, both of which resolve to `https://evil.example/x` (an open redirect / phishing link).

Create `Codebase/apps/site/src/lib/safe-href.ts`:

```ts
export function safeHref(raw?: unknown, fallback = '#'): string {
  const v = String(raw ?? '').trim();
  if (!v || /[\u0000-\u001F\u007F]/.test(v)) return fallback;   // URL parser strips these → scheme smuggling
  if (/^\/(?![\/\\])/.test(v)) return v;                        // same-site path; rejects //host and /\host
  if (/^#[\w-]*$/.test(v)) return v;                            // in-page anchor
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  return fallback;
}
```

Use it at every DB-fed link and image sink:

| Sink | Current code | Change |
|---|---|---|
| Announcement CTA | `BaseLayout.astro:51-56` (definition), `:370` (use) | delete the local `safeHref`; `import { safeHref } from '../lib/safe-href'` |
| Hero slide CTA (server) | `index.astro:76` `href: s.cta_href` (heroData, lines 62–82) | `href: safeHref(s.cta_href)` |
| Hero slide CTA (client) | `index.astro:1387` `href="${sl.href}"` | `href="${esc(sl.href)}"` |
| Hero image (client) | `index.astro:1364` `src="${sl.photo}"` (from `products.imgs` via `photoOf`, :20-22) | `src="${esc(sl.photo)}"`; server side `safeHref(photo, '')` |
| Insight CTA | `insights/[slug].astro:148`, `:166` via `normCtaUrl` (:36-51), which returns raw input for unknown values | last line of `normCtaUrl`: `return safeHref(u, '/contact/')` |
| Product documents | `products/[slug].astro:302` `href={doc.url || '/contact/'}` (from `product_deep.docs`) | `href={safeHref(doc.url, '/contact/')}` |

The `esc` helper in `index.astro` already exists at line 1350 (it escapes `'` and `"`), but it is scoped inside `if (stage)`. Hoist it to the top of the `<script>` (line 1319, a processed Astro script, so TS annotations are valid) and reuse it in 3.1-2.

### Task 3.1-2 — Escape the basket and product-grid rows (EN and AR)

All of these interpolate product or basket data with no escaping:

| File:line | Sink |
|---|---|
| `index.astro:1561-1563` (`renderMini`) | `${(i.name \|\| i.slug).slice(0, 44)}`, `× ${i.qty}` |
| `ar/index.astro:114-115` | same mini-cart, AR twin |
| `ar/rfq/index.astro:139`, `:142`, `:145` | `<b>${it.name \|\| it.slug}</b>`, `data-slug="${it.slug}"` |
| `products/[slug].astro:451-466` (recently-viewed grid) | `alt="' + itemName`, `'<b…>' + itemName`, `itemBrand`, `src="' + imgSrc` |

- Add the same `esc` to each script and wrap every interpolation. Use `${esc(Number(i.qty) || 0)}` for the quantity.
- `i.img` never exists, because basket lines carry only `{slug, qty, note, name, brand}` (`rfq.service.js:65`). Delete that dead branch.
- **Defence in depth:** `GET /api/rfq-basket` returns the raw cookie contents (`rfq.service.js:75-77`). Have `viewBasket` re-coerce `qty` to an integer and re-derive `name`/`brand` from the DB.

**Done-when:** build the site, then:
- **Hero CTA probe.** After 3.2-2 the API rejects the value, so seed it directly: `psql … -c "UPDATE hero_slides SET cta_href=E'java\\tscript:alert(1)' WHERE idx=5;"`. Build, grep `dist/index.html` for `java`, and confirm the slide renders `href="#"`. Repeat with `//evil.example`. Restore the original value.
- **Name probe.** Rename a product to `<img src=x onerror=alert(1)>` in the product editor. Add it to the basket *after* renaming (the name is snapshotted into the `simal_rfq` cookie). Confirm it renders as text in the EN mini-cart, the AR mini-cart, `/ar/rfq/` and the recently-viewed grid. Revert the name and clear the cookie.

Capture all of it.

## Milestone 3.2 — CMS-side hardening

### Task 3.2-1 — `esc()` single quote, plus a full sink sweep in `cms.js`

`cms.js:53-59` `esc()` escapes `& < > "` but not `'`.

`ui.js:9-13` already has a complete escaper, exported as `UI.esc` (`ui.js:214`), and `ui.js` loads before `cms.js` (`cms.html:872`, `:874`). Simplest fix:

```js
function esc(s) { return UI.esc(s); }   // F-2026-N10: one escaper (covers ' as &#39;)
```

Then sweep the file:
- **Markup sinks.** Wrap every interpolated value in `esc(...)` in all **50 `innerHTML`** assignments and the **2 `outerHTML`** assignments (`:3042`, `:3236`), plus any `insertAdjacentHTML`. Values that are provably builder-generated markup are exempt.
- **URL sinks.** `esc()` does not neutralise a `javascript:` scheme. Route every `href`/`src` built from data through the 3.1-1 rule (port `safeHref` into `cms.js`). This covers the announcement preview at `:3546` and `opts.href` / `it.href` at `:800` / `:1126`.
- **Cache.** Bump `cms.html:874` from `assets/js/cms.js?v=9` to `?v=10`, or staff browsers keep the vulnerable copy.

Log the sweep list in the evidence file.

### Task 3.2-2 — Validate stored URLs at the API boundary (every write path, including rollback)

**v1.2 correction.** The functions v1.1 named do not exist. The real ones are:

| v1.1 name | Real function | Called from |
|---|---|---|
| `updateAnnouncement` | `upsertAnnouncement` (`cms.service.js:726`) | `routes.js:731` |
| `saveSlide` | `upsertSlide` (`cms.service.js:100`) | `routes.js:720` |
| `updateBlock` | `upsertBlock` (`cms.service.js:60`) | `routes.js:708` |

"Quick Create" is client-only (`cms.js:3389`) and calls the same routes. `HttpError` is already imported (`cms.service.js:6`).

```js
const SAFE_URL = /^(?:\/(?![\/\\])|#[\w-]*$|https?:\/\/|mailto:|tel:)/i;
function assertSafePublicUrl(raw, field) {
  const v = String(raw ?? '').trim();
  if (v && (/[\u0000-\u001F\u007F]/.test(v) || !SAFE_URL.test(v)))
    throw new HttpError(422, `${field} must be a same-site path, #anchor, or http(s)/mailto/tel URL`);
  return v;
}
```

Apply the guard on every write path. (In `upsertSlide`, `cta_href` is a destructured `const`, so call the guard rather than reassign.)

| Path | What to check |
|---|---|
| `upsertAnnouncement` | `cta_href` |
| `upsertSlide` | `cta_href` |
| `upsertProductDeep` (`:458-465`) | `docs[].url` and `datasheet_url` |
| Product `imgs` writers | each image path |
| `upsertBlock` | every key matching `/href\|url\|link/i`, recursively, plus `payload.cta[1]` (insight CTA arrays) |
| **`rollback()`** | hero_slides `:221-228` and announcements `:234-241` restore `cta_href` from revision payloads unchecked; validate there too |

## Milestone 3.3 — Tighten the public CSP (v1.2: tasks re-ordered — inline scripts go first)

### Task 3.3-1 — Eliminate every inline executable script from the build *(was 3.3-2)*

**v1.1's grep was wrong.**
- It scanned `_astro/` (which holds only `.js`/`.css`) plus a single page.
- `grep -v application/json` does not exclude `application/ld+json`, so its single hit was a false positive.
- It missed the real consent script, because that script's body starts on the next line.

A full scan of `dist` finds **357 inline executable script blocks (94 distinct bodies) across 243/243 pages**:

| Source | Pages | Fix |
|---|---|---|
| (a) `BaseLayout.astro:323` `<script is:inline>` (Consent Mode defaults) | all 243 | move to `public/assets/js/consent-default.js`; load with `<script is:inline src="/assets/js/consent-default.js"></script>` (synchronous, before any tag). Keep the cookie parse that sets the defaults in this same file — Task 8.4-1 needs it there |
| (b) `define:vars` scripts (implicitly inline): `products/[slug].astro:364` (~80 pages), `compare/index.astro:103`, `search/index.astro:36`, `rfq/index.astro:90` | ~83 | `<script type="application/json" id="x" set:html={JSON.stringify(data).replace(/</g,'\\u003c')}>` + a processed `<script>` that does `JSON.parse(document.getElementById('x').textContent)` |
| (c) Astro-inlined `type="module"` scripts under `assetsInlineLimit` (brands/*, contact, insights, legal, careers, ar/*) | 33 | `astro.config.mjs`: `vite: { build: { assetsInlineLimit: (f) => f.endsWith('.js') ? false : undefined } }` |

Add the check below to `run-gates.mjs` as gate `csp-inline` (`scripts/ci/check-inline-scripts.mjs`). It exits 1 while any inline executable script remains:

```js
import fs from 'node:fs'; import p from 'node:path';
let n = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = p.join(d, e.name);
  if (e.isDirectory()) walk(f);
  else if (f.endsWith('.html')) for (const m of fs.readFileSync(f, 'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=/.test(m[1]) || /application\/(ld\+)?json/i.test(m[1]) || !m[2].trim()) continue;
    n++; console.log(p.relative('apps/site/dist', f));
  } } })('apps/site/dist');
console.log('inline executable scripts:', n); process.exit(n ? 1 : 0);
```

### Task 3.3-2 — Remove `'unsafe-inline'` from `script-src` in all three CSP sources *(was 3.3-1)*

**v1.2 correction.** `infra/nginx/portal-staging.conf:25` is the **portal** vhost (`kyc.simalme.com`, line 13), and its `script-src` is already `'self'`. The public site has three policies, and all three must change in the same commit:

| Source | Location | Note |
|---|---|---|
| nginx site vhost | `portal-staging.conf:66` (`server_name simalme.com www.simalme.com`, line 54) | authoritative on staging/prod |
| meta CSP | `BaseLayout.astro:315` | the only policy behind a CDN-only layer (file comment, line 3). Also: `frame-ancestors` is ignored in a meta tag, so drop it; and `connect-src http://127.0.0.1:* http://localhost:*` must not ship to production — gate it on the build env |
| dev edge | `scripts/dev-edge.mjs:52` | what the rig at :8100 and the crawl/a11y gates actually serve |

Keep `'unsafe-inline'` only in `style-src`. When Phase 8.4 lands, add the GA4 hosts to all three policies (see Task 8.4-1).

### Task 3.3-3 — Verify no regressions (on the rig — there is no staging host before Task 10.2-1)

**Done-when:**
- `curl -sI http://127.0.0.1:8100/ | grep -i content-security-policy` and `grep -o '<meta http-equiv="Content-Security-Policy"[^>]*' apps/site/dist/index.html` both show `script-src` without `unsafe-inline`.
- `node scripts/ci/check-inline-scripts.mjs` exits 0.
- In the browser, with the console open, there are zero CSP violations on: home, one product page (recently-viewed + WhatsApp), `/compare/`, `/search/`, `/rfq/`, `/contact/`, one `/ar/` page.

Screenshots go to `rm-evidence/3.3-3.png`.

**Phase 3 exit gate:**
- the stored-XSS probes (including the `\t`/control-char and `//host` variants) render inert on EN and AR;
- `csp-inline` gate green;
- three CSPs tightened;
- `run-gates.mjs` green.

---

# PHASE 4 — CMS Console Completion *(Days 11–18)*

> Closes the **CMS-2/3/4/7/8/9 partials**, F-2026-N05, F-2026-N13 and the CMS-5 purge residue. It also fixes three live CMS defects found in v1.2 verification: media upload broken, legal-policy saves overwriting the Arabic twin, and the upload site-copy path. Principle: *if the CMS cannot edit it, the site must not ship hardcoded marketing content for it.*
>
> **Prerequisite (v1.2):** Task 1.1-4 must have drained the queue. Phase-4 e2e cases no longer depend on the rig worker; they build into their own outDir (Task 4.1-2).

## Milestone 4.1 — Site chrome becomes CMS data

### Task 4.1-1 — Introduce `site/nav-menus`, `site/footer`, `site/newsletter` blocks and make `BaseLayout` read them

**What the chrome really is (verified).** `BaseLayout.astro` already imports the tagged-template `db` (line 32; `db.ts:17`) and has `isArabic` (101) and `lang` (102). Today the chrome reads zero content blocks:

| Element | Location in `BaseLayout.astro` | Structure |
|---|---|---|
| 8 mega-menus | `<nav class="h2nav">`, 416–557 (menus at 418, 432, 455, 472, 498, 513, 526, 540) | items via `mi(icon,label,href,desc)` (261); `.mega-promo` blocks (444-449, 488-492); `.mega-foot` rows (450, 493); live counts `productCount` (422, 435), `catCounts[…] \|\| 17` (436-442), `brandRows` (458-466) |
| mobile nav | `.m-nav`, 559–571 | |
| footer | `.f2-main` 590–642; `.f2-cert` badges 648–654; `.f2-legal` links/copyright 656–669 | |
| newsletter markup | 579–588 (`.f2-cta`, `#nlmail`, `#nlbtn`) | lines 887–916 are its *client script* (fetch `/api/contact` at 898) |
| utility strip | 383–386 | |
| announcement default CTA strings | 370–371 | |

**Payload shapes.** Reproducing the chrome pixel-for-pixel needs richer shapes than v1.1's `{heading, links}`:

| Block | Payload |
|---|---|
| `site/nav-menus` | `{ menus: [{ id, label, ariaLabel, heading, items: [{icon,label,href,desc}], promo?: {title,text,ctaLabel,ctaHref}, foot?: [{text,href?}] }], mobile: [{label,href}] }` — counts written as tokens (`{productCount}`, `{cat:internal-ssd}`, `{brandCount}`) and substituted at render; the Brands menu stays DB-driven |
| `site/footer` | `{ columns: [{heading, links:[{text,href}]}], badges:[{icon,text}], cert:[{text}], addresses:[{label, lines[]}], legal: {copyright, links:[{text,href}]} }` |
| `site/newsletter` | `{ heading, blurb, placeholder, buttonLabel, successMsg, errorMsg }` |

**Seed** in `scripts/seed.sql`, copying today's literals so the first build is pixel-identical:
- One row per block for `lang='en'` and one for `lang='ar'`, keyed by the existing `UNIQUE(entity, entity_id, lang)`. Use no `-ar` entity ids.
- Use `ON CONFLICT (entity, entity_id, lang) DO NOTHING`. Do **not** copy the `DO UPDATE SET payload = EXCLUDED.payload` of the neighbouring `site/*` seeds (seed.sql:403-415, 449-452): it clobbers CMS edits on every re-seed.
- Neighbouring seeds do not set `updated_by`; leave it NULL.

**Consume** in the `BaseLayout.astro` frontmatter. v1.1's query had a stray `}` (a PG syntax error that fails every page's build), and it selected only `payload` while matching on `entity_id`, so CMS edits were silently ignored:

```ts
const chromeRows = await db`SELECT entity_id, payload FROM content_blocks
  WHERE entity = 'site' AND entity_id IN ('nav-menus','footer','newsletter') AND lang = ${lang}`;
const chrome = (id: string) => (chromeRows as any[]).find(r => r.entity_id === id)?.payload;
const navMenus = chrome('nav-menus')?.menus ?? DEFAULT_MENUS;      // DEFAULT_* = today's bilingual literals (AR falls back to AR literals, never EN payload)
```

The newsletter's client script is a bundled `<script>` and cannot read frontmatter. Pass `successMsg`/`errorMsg` as `data-` attributes on `#nlbtn`. Do **not** use `define:vars`: it inlines the script and undoes Task 3.3-1.

### Task 4.1-2 — Editors for the new blocks, and an e2e that really checks the built site

- Register `#/navigation`, `#/footer` and `#/newsletter` in the `routes` map (`cms.js:588-624`) **and** the `sitemapMatrix` sidebar (~223-286), each opening `openBlockEditor` (`cms.js:1781`) pre-targeted.
- `#/claims-register` (`cms.js:2656-2686`) is a list that opens the generic JSON editor; it has no structured form or language support. A JSON textarea is acceptable for menus in v1, but each view must have the EN/AR toggle from 4.5-1.
- **The e2e must build.** `scripts/ci/test-cms-e2e.mjs` is API-only: it never builds or reads `dist` (its only dist touch is `typeof telemRes.data.distExists === 'boolean'`, :336-339). After 6.3-1 moves it to a scratch DB, have it:
  1. apply its edits;
  2. run `node <astro.js> build` with `DATABASE_URL=<scratch>` and `SITE_OUT_DIR=./dist-e2e` (the `clean-db-build.mjs:25-29` mechanism);
  3. grep `apps/site/dist-e2e/` for the markers.
- Add `['cms-e2e', 'test-cms-e2e.mjs', 'CMS-2/3/4/9 editor→dist regression']` to the `GATES` array (`run-gates.mjs:31-39`).

**Done-when (milestone):** three e2e cases pass — edit a `site/nav-menus` label, a `site/footer` link and the `site/newsletter` heading, and each marker is present in `dist-e2e`, on both EN and AR pages.

## Milestone 4.2 — SEO, stats and awards editors (closes remaining CMS-2 scope + feeds PUB-8)

### Task 4.2-1 — Re-shape the existing `site/counters` block; seed `site/awards` and `site/seo-defaults`

**`site/counters` already exists.** It is seeded at `seed.sql:413` with `DO UPDATE`, and the live payload is `[["24","Years · since 2002"],["300+","Team members"],["21","Authorized brands"],["78","Live SKUs"],["4","Regions served"]]`. No page reads it.

- **Counters carry only non-derivable facts.** Brands and SKUs are already live DB counts on the home page (`index.astro:11-12`) and must stay derived.
- **New shape:** `{"years": <ratified>, "foundedYear": <ratified>, "team": "300+", "regions": 4}` for EN (and AR labels).
- Replace `seed.sql:413` itself with this shape, and migrate the live row with an explicit `UPDATE content_blocks … WHERE entity='site' AND entity_id='counters' AND lang='en'`.
- The **years value is blocked on ratification** (Task 6.1-1). GOV baseline a42 says founded **2003**, which gives 23 years in 2026, while the site says "24 years · since 2002".
- Seed `site/awards` (`[{year,title,issuer}]`, does not exist yet) and `site/seo-defaults` (`{title, description, ogImage}`), EN and AR, with `DO NOTHING`.

### Task 4.2-2 — Consume them in the site

- `BaseLayout.astro`: when a page passes no title/description (props, lines 19–21), default them from `site/seo-defaults`.
- `index.astro`: the years figure is the only hardcoded number in the stats strip (`<span class="cred-num">24</span>` ~312, and `calloutVal: '24 Years'` :57). Render it from `site/counters`.
- Awards walls (`index.astro:442-459`, `about/index.astro:96+`): render from `site/awards`.
- Brand counts: switch to the `slug <> 'other'` rule BaseLayout already uses (line 36). Full fact reconciliation is Task 6.1-2.

### Task 4.2-3 — CMS views + regression case

- Register `#/seo-defaults`, `#/stats` and `#/awards` (structured forms, EN/AR toggle).
- Extend `test-cms-e2e.mjs`: edit `site/counters.years` and one award, build into `dist-e2e`, grep.

**Done-when (milestone):** the e2e case passes, and a non-technical editor can change the stats strip and the awards list from the CMS and see the change in the built site.

## Milestone 4.3 — Correctness residues (closes CMS-3, CMS-4, CMS-7, CMS-8 residues, F-2026-N13)

### Task 4.3-1 — Migrate `products.stock` to a real boolean (CMS-4)

v1.1's `CASE WHEN stock IN ('true','t','1',true)` fails on a TEXT column (`ERROR: operator does not exist: text = boolean`, reproduced on the rig). Its writer `Boolean(patch.stock)` is also wrong: the editor sends a string from a `<select>` (`cms.js:2405`), and `Boolean('false') === true`, so a product could never be set out of stock.

Verified safe to migrate: the column has no default, no view/rule/index depends on it, and all 78 live rows are `'true'`. Add to `migrate.sql`, idempotently:

```sql
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='products' AND column_name='stock') <> 'boolean' THEN
    ALTER TABLE products ALTER COLUMN stock TYPE BOOLEAN
      USING (lower(trim(coalesce(stock, 'true'))) IN ('true','t','1','yes','in stock'));
  END IF;
END $$;
ALTER TABLE products ALTER COLUMN stock SET DEFAULT true;
ALTER TABLE products ALTER COLUMN stock SET NOT NULL;
```

Also change the fresh-DB DDL (`migrate.sql:93`, `stock TEXT`) to `stock BOOLEAN NOT NULL DEFAULT true`.

**Writers** (`cms.service.js`):

```js
const toBool = (v, d = true) => (v === undefined || v === null || v === '') ? d
  : (v === true || v === 1 || /^(true|t|1|yes|in ?stock)$/i.test(String(v).trim()));
// createProduct (:366): const stockVal = toBool(stock, true);
// updateProduct (:387): const stock = patch.stock !== undefined ? toBool(patch.stock) : existing.stock;
// rollback products branch (:255-257): stock = toBool(p.stock)   — historical revisions hold strings
```

**Client and readers:**
- Send a real boolean from the client: `stock: $('#prod-edit-stock').value === 'true'` (`cms.js:2405`).
- Update every reader to `p.stock === true` / `p.stock === false`:
  - `cms.js:2141`, `:2216`, `:2234`, `:2366`
  - `products/[slug].astro:20`, `products/index.astro:102`, `ar/products/index.astro:99`
- Re-verify `brands/[slug].astro:23` and `compare/index.astro:21`; the migration fixes them implicitly.
- There is no `rowToProduct` in `pg-repos.js` (only `products.bySlug`, :467-470), so drop v1.1's "compat shim" sentence.
- Update `test-cms-e2e.mjs:95/102`, which sends `'false'` and asserts the string `'false'`.

### Task 4.3-2 — Retire the `amc/tiers` decoy (CMS-3)

- Delete `seed.sql:369`.
- Live DB: `DELETE FROM content_blocks WHERE entity='amc' AND entity_id='tiers';`.
- `cms.js`: remove the fallback at `:2051-2052` **and** the hidden default payload at `:2053`, and render an explicit "site/amc-tiers missing" error instead of opening a non-existent block (`:2059`).
- Note: restoring any `dr_drill_*.sql` backup re-introduces the row.

### Task 4.3-3 — Quick Create writes real entities (CMS-7 residue)

- `cms.js:3447` sets `var entity = type === 'it_solution' ? 'it_solution' : 'custom';`, and `cms.html:509` offers "Generic Content Block". The live DB has 0 `custom` rows. Remove the option unless a site consumer exists.
- **v1.2 addition — the IT-solution branch is also broken.** It writes `{t, x, cat, at}` (`cms.js:3447-3448`), while live rows and `solutions/[id].astro:29/33/46` use `{d, t, id, cats, icon, …}`. A quick-created solution therefore publishes with no description and no categories. Write `{ id: id, t: title, d: desc, cats: cat ? [cat] : [], icon: '🛠' }`.

### Task 4.3-4 — Profile chip identity + fallback constants (F-2026-N13 + CMS-8 residue)

- **Chip.** `cms.js:144` sets `state.me = userData.user`, but the chip at `:441` reads `(state.me && state.me.user) || {}`, which is always `{}`. Change it to `var u = state.me || {};`.
- **Policies count.** Replace `'7 Regulatory Policies'` (:1957) with `state.policies.filter(function (p) { return p.lang === 'en'; }).length`. `/api/cms/policies` returns both languages (7 en + 7 ar = 14).
- **Staff count.** Replace `'13 Staff Accounts'` (:3084) with `state.users.length`.
- **Loc-audit fallbacks.** Replace the fallbacks at `:3038-3040` **and** the fourth one at `:3066`, `(audit.products ? audit.products.count : 81)` — 81 contradicts baseline a3 (78). Render "—" with a load-error badge when the query fails.
- **`'100% Shared'`.** There is no measured metric behind it: `getLocAudit` returns only `products.count`, and products have no AR columns. Render "n/a — catalogue is language-neutral".

### Task 4.3-5 — Remove the duplicate emergency-publish route

`routes.js` registers `POST /api/cms/emergency-publish` twice: lines 774–777 and 850–854. The router is first-match-wins (`http.js:84-91`), so the second registration is dead. Delete it. (Its *attested-approver* logic is replaced in Task 7.3-1.)

## Milestone 4.4 — Media library hardening (closes CMS-9 residue, F-2026-N05; fixes the broken upload)

### Task 4.4-1 — Move storage outside the webroot + authorized serving

- **Storage location.** Use `config.dataDir`. Six sibling services already `import { config } from '../config.js'`, and `config.dataDir` is anchored to `apps/portal` (`config.js:44`). A relative `DATA_DIR` would otherwise resolve against cwd.
- **The route must be behind `cmsAuth`.** v1.1's snippet omitted it, which would have made the route public.
- **Do not `pipe` a stream without an error listener.** A missing file emits an asynchronous `'error'` that crashes the portal, and there is no process-level handler. `cms.serveMediaFile` does not exist; write it:

```js
// cms.service.js (add: import { config } from '../config.js';)
function getMediaDir() { const dir = path.join(config.dataDir, 'uploads', 'media'); fs.mkdirSync(dir, { recursive: true }); return dir; }
const MEDIA_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
async function serveMediaFile(filename) {
  const safe = path.basename(String(filename || ''));
  const mime = MEDIA_MIME[path.extname(safe).toLowerCase()];
  if (safe !== filename || !mime) throw new HttpError(400, 'Invalid media filename');
  const abs = path.join(getMediaDir(), safe);
  let st; try { st = fs.statSync(abs); } catch { throw new HttpError(404, 'Media not found'); }
  if (!st.isFile()) throw new HttpError(404, 'Media not found');
  return { abs, size: st.size, mime };
}   // export it in the service's return object (cms.service.js:860-871)
```

```js
// routes.js (add: import fs from 'node:fs';)
r.get('/api/cms/media/file/:filename', ...cmsAuth, async (req, res) => {
  const f = await cms.serveMediaFile(req.params.filename);
  res.writeHead(200, { 'Content-Type': f.mime, 'Content-Length': f.size, 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline' });
  fs.createReadStream(f.abs).on('error', () => res.destroy()).pipe(res);
});
```

**Repoint the previews.** Today they are hardwired to the portal webroot: media cards (`cms.js:1514`), the products-grid thumbnail (`:2233`), the product-editor image (`:2370`), and `listMedia`'s `url: 'assets/img/products/'+f`.
- `listMedia` returns `previewUrl: '/api/cms/media/file/' + f` and keeps `url` as the site-relative path.
- The "Copy" button (`:1521`) keeps copying the site path.

### Task 4.4-2 — Fix, scan, restrict and label uploads

- **Live defect: CMS uploads are broken today.** The client sends `{ filename, dataBase64 }` (`cms.js:1624-1626`), but `uploadMediaFile` destructures `base64` (`cms.service.js:647-660`), so every upload from `#/media-library` returns 400 ("base64 data is required"). The e2e passes only because it sends `base64:` (`test-cms-e2e.mjs:207-211`). Fix with `const b64 = data.base64 ?? data.dataBase64;` and add an e2e case that uses the exact client payload.
- **Live defect: the site-copy path is wrong.** `path.resolve(__dirname, '../../../../site/public/assets/img/products')` (`cms.service.js:663-665`, `689-691`) resolves to `Codebase\site\…`, an empty stray directory. Use `path.resolve(process.env.SITE_DIR || path.resolve(config.root, '../site'), 'public/assets/img/products')`, the same base as `server.js:161`.
- **Size cap.** The label already says 5 MB (`cms.html:805`). The "10 MB" is the JSON body limit (`routes.js:841`), not a file cap; base64 inflates by about 4/3. Keep the body limit at about 7 MB, and after decoding add `if (buf.length > 5 * 1024 * 1024) throw new HttpError(413, 'Image exceeds 5 MB');`. Add a matching client check in `handleMediaUploadSubmit` (`cms.js:1611+`).
- **Scan and sniff.** Call `scanBuffer(buf, safeName)` (`virus-scanner.js:132`) before storing. Add a magic-byte check using `sniffContentType` with an extension match, as `kyc.service.js:61-65` does.
- **Drop `.svg` in all four places:** the upload regex and its error text (`cms.service.js:651-653`), the `listMedia` filter (`:591`), the label (`cms.html:805`) and `accept="…image/svg+xml"` (`cms.html:806`).
- **Fail loudly.** Writes are wrapped in `catch { /* best effort */ }` (`cms.service.js:667-672`), so an upload reports 201 even when nothing was written. Return 500 if the canonical write fails.
- `#media-target-folder` (`cms.html:798-802`) is read by nothing. Wire it or remove it.

### Task 4.4-3 — Migrate existing files + verify

- **Existing files.** The 85 files in `apps/portal/public/assets/img/products/` are byte-identical copies of the catalogue images. Index them read-only from `apps/site/public/assets/img/products/` (so the library still shows them), then delete the portal webroot copies.
- **Site exposure.** Only copy an upload into `apps/site/public/…` when a product's `imgs` references it. Otherwise every upload becomes public static content on the next build.

**Done-when:**
- `curl http://127.0.0.1:8090/assets/img/products/<new-upload>.jpg` → 404;
- CMS previews load only via `/api/cms/media/file/…` (401 without a session);
- a file whose **content** is the 68-byte EICAR string (named e.g. `eicar.jpg`) is rejected — accept either the sniff or the scan as the rejection reason;
- `.svg` → 4xx;
- a 6 MB image → 413;
- a browser upload from `#/media-library` succeeds.

Save the evidence.

## Milestone 4.5 — Localization & taxonomy editing (closes the last CMS-2 residues)

### Task 4.5-1 — Language-aware block **and policy** routes + editor switcher

**Blocks (precision).** PUT already honours `lang` through the body spread (`routes.js:708` → `upsertBlock`, default `'en'`, `cms.service.js:60`). GET (`routes.js:702-704`, `getBlock` default `'en'`, `cms.service.js:52`) and DELETE (`routes.js:710-713`, where `deleteBlock` hardcodes `const lang = 'en'`, `cms.service.js:82-83`) cannot address AR rows. The UI never sends `lang`. The `...b` spread also lets the body override the URL's `entity`/`entityId`. Fix the routes:

```js
const lang = String(req.query.get('lang') || b.lang || 'en');
if (!/^(en|ar)$/.test(lang)) throw new HttpError(400, 'lang must be en or ar');
await cms.upsertBlock({ ...b, entity: req.params.entity, entityId: req.params.id, lang }, req.session);  // URL wins
```

Also give `deleteBlock` a `lang` parameter.

**Live defect: policy saves corrupt the Arabic twin.**
- `getPolicy(slug)` runs `SELECT … WHERE slug = $1` (`cms.service.js:136-138`) and returns an arbitrary language row.
- `upsertPolicy` runs `UPDATE legal_policies SET title=$1, body=$2, version=version+1 WHERE slug=$3` (`:147`) on a table whose primary key is `(slug, lang)`.
- The editor sends no `lang` (`cms.js:1998`, `:3414`).
- So one save in `#/policies` would overwrite **both** the EN and the AR row with English text. The policy rollback (`:232`) has the same slug-only UPDATE.
- The defect is latent: all 14 rows were still at `version = 1` on 16 Oct 2026, so nothing has been overwritten yet. **Land this fix before anyone edits a policy.**

Fix: `GET/PUT /api/cms/policies/:slug?lang=`, with `WHERE slug=$1 AND lang=$2` in `getPolicy`, `upsertPolicy` and the policy rollback, and revision key `slug:lang`. Re-check with `SELECT slug, lang, left(title, 30), version FROM legal_policies ORDER BY slug, lang;`.

**UI.** Add an EN/AR toggle to the blocks, claims-register and policies views; badge rows with their language. `viewClaimsRegister` already lists AR rows but opens them as EN (`data-open-block="site||id"`). From `#/loc-audit`, link each under-covered AR row to its editor.

### Task 4.5-2 — Categories taxonomy editor

The taxonomy is spread across four places today:

| Part | Where | Problem |
|---|---|---|
| `products.cat` + per-product `products.cat_label` | `products` table | already inconsistent: `accessories` carries 3 labels; a stray `SSD` cat has 1 product |
| guides | `category_guides` table (cat PK, `points` jsonb, 7 rows), DB-first fallback in `products/index.astro:30` | `products/[slug].astro:52` has its own literal map |
| nav links | `BaseLayout.astro:436-442` (`/products/#internal-ssd`, `catCounts[…] \|\| 17`) | category keys and fallback counts hardcoded |

Build `#/categories` (pattern: `#/brands-catalog`, `cms.js:608`):
- **List** distinct `cat` values with usage counts.
- **Rename/merge** in **one transaction** that updates `products.cat` + `products.cat_label` + `category_guides.cat` + a `site/categories` label block + the `site/nav-menus` payload tokens (4.1-1).
- **Validate** the slug format (`^[a-z0-9-]+$`). Reject a colliding target unless the operation is an explicit merge.
- Record revisions.

### Task 4.5-3 — End-to-end proof

**Done-when (milestone):** `test-cms-e2e.mjs` gains three cases:
- (a) edit an AR block → build into `dist-e2e` → the marker appears in the `/ar/` page and the EN twin is unchanged;
- (b) edit the EN privacy policy → the AR row's body is unchanged;
- (c) rename a category label → the catalogue shows the new label, and the old fragment key (`/products/#old`) still filters via a client-side alias. Categories are URL fragments, so a 301 is impossible on a static site.

Also: `#/loc-audit` shows the edited AR row's new `updated_at`/`updated_by`. (AR coverage > 0 is already true today, so it proves nothing.)

### Task 4.5-4 — Arabic marketing copy from the DB (closes the SEO-4 caveat; v1.2 new)

Report 2 §5 P7-3 notes "AR hero/marketing copy still template-hardcoded" in `ar/index.astro`, `ar/about/`, `ar/solutions/` and others. No v1.1 task covered it.
- Move the AR hero, intro and section copy into `lang='ar'` content blocks, using the same entity ids as their EN twins.
- Render them through the 4.1-1 pattern, editable through 4.5-1.

**Done-when:** an AR hero edit in the CMS appears on `/ar/` after an e2e build.

**Phase 4 exit gate (v1.2: moved after Milestone 4.5):**
- `cms-e2e` is in `run-gates.mjs` and green, covering chrome, stats/awards, stock boolean, AMC single-source, AR block + AR policy, category rename and media upload with the real client payload;
- `run-gates.mjs` green;
- a browser drive of `#/navigation`, `#/policies` (AR toggle) and `#/media-library` is clean.

---
# PHASE 5 — Publish Pipeline & Deployment Truth *(Days 18–21)*

> Closes the **CMS-10 partial** (Last-Publish KPI, purge, deploy step) and the CMS-5 purge residue. "Publish" must mean *the served site changed*.

## Milestone 5.1 — Honest publish telemetry

### Task 5.1-1 — Derive "Last Publish" from real build completion

**v1.2 corrections.**
- `getPublishTelemetry().lastPublishTs` is *not* build completion. It is the `created_at` of the newest cms outbox row with status `processed`/`sent` (`cms.service.js:828`, `:854`) — the enqueue time.
- The worker records no completion time: the outbox has no `updated_at`, and the meta is `{durationMs, verified}`.
- The true completion timestamp is the `ssg_build_completed` audit row (`server.js:199`; `audit_log.ts`).
- `cms.js` is ES5/promise style (0 `await` in 3,832 lines), and `viewDashboard` (`:806`) is synchronous. v1.1's `await` snippet is therefore a SyntaxError, and it set `state.lastPublishTs`, which nothing reads; the KPI uses the local `var lastPublishTs` (`:841`).

**Server:** extend `getPublishTelemetry()`:

```js
const done = await client.query("SELECT max(ts) AS ts FROM audit_log WHERE action = 'ssg_build_completed'");
const latest = await client.query("SELECT id, status, created_at, meta FROM outbox WHERE to_addr = 'ssg-builder' ORDER BY created_at DESC LIMIT 1");
// return { …existing fields, lastBuildCompletedTs: Number(done.rows[0]?.ts) || null, latestJob: latest.rows[0] || null }
```

**Client:**
- Add `API.get('/api/cms/telemetry/publish').catch(function () { state.loadErrors.pubTelemetry = true; return null; })` to the `refreshGlobalData` `Promise.all` (`cms.js:166-180`), and store the result in `state.pubTelemetry`.
- Then, at `:841`:

```js
var pubTel = state.pubTelemetry || {};
var lastPublishTs = pubTel.lastBuildCompletedTs || null;            // real build completion
var latestJobBad = pubTel.latestJob && (pubTel.latestJob.status === 'failed' || pubTel.latestJob.status === 'queued');
```

- Render an amber/red badge ("last build FAILED @ …" / "build queued since …") whenever `latestJobBad` is true; never show "all published".
- Do not derive any of this from `state.auditLogs`: `/api/admin/audit` is `LIMIT 500` (`pg-repos.js:147-151`), and `state.outbox` is the newest 50 rows across *all* channels (14 of the 15 failed cms jobs fall outside it).

### Task 5.1-2 — Make purge real or remove the checkbox

`publish()` (`cms.service.js:274-311`) never reads `options.purgeAll`. The worker also ignores the `purge` array (`:302`) — it always does a full build. The roadmap picks **delete**, because the deploy step (5.2) always replaces the whole tree. Delete:
- the checkbox (`cms.html:618-623`, input at `:620`);
- its reader (`cms.js:2938`) and the `purgeAll` field (`:2942`);
- the `purge` array.

Until `DEPLOY_DIR` is live, change the modal's "Production CDN Edge: https://simalme.com/" line (`cms.html:614-616`) to "not deployed".

## Milestone 5.2 — A real deploy step

### Task 5.2-1 — Implement a guarded, atomic deploy hook

**v1.2 corrections.**
- **Deploy before declaring success.** v1.1 ran the deploy after the job was already marked `processed`, so a failed deploy still read as a successful publish.
- **Catch errors in the callback.** v1.1 ran it unguarded inside the `execFile` callback. Any throw from `rmSync`/`cpSync`/`audit` (EBUSY/EPERM/ENOSPC) became an unhandled rejection, which terminates Node 24.
- **Guard `rmSync`.** If `DEPLOY_DIR` equals the build output, the build is deleted. If it is a parent directory, that parent is deleted recursively.
- **v1.1's R-6 premise is false.** `fs.cpSync(src, existingDest, {recursive:true})` *merges* into dest; it does not nest (tested on Node v24.21.0). `verbatimRoot` is not an `fs.cp` option. The real reason to replace the directory is stale-file removal.

In the success branch (after the build is verified, **before** the outbox row is marked `processed`):

```js
const deployDir = process.env.DEPLOY_DIR ? path.resolve(config.root, process.env.DEPLOY_DIR) : null;
let deployError = null;
if (deployDir) {
  const src = path.resolve(siteDir, 'dist');
  try {
    const depth = deployDir.split(path.sep).filter(Boolean).length;
    if (deployDir === src || src.startsWith(deployDir + path.sep) || path.resolve(siteDir).startsWith(deployDir + path.sep) || depth < 3)
      throw new Error('DEPLOY_DIR rejected by safety guard: ' + deployDir);
    const next = deployDir + '.next', prev = deployDir + '.prev';
    fs.rmSync(next, { recursive: true, force: true });
    fs.cpSync(src, next, { recursive: true });                 // stage
    fs.rmSync(prev, { recursive: true, force: true });
    if (fs.existsSync(deployDir)) fs.renameSync(deployDir, prev);
    fs.renameSync(next, deployDir);                            // swap (on Linux prefer a symlink flip)
    fs.rmSync(prev, { recursive: true, force: true });
    log.info('ssg_deployed', { outboxId: job.id, target: deployDir });
    await repos.audit('system', 'ssg_deployed', job.id, 'dist deployed to ' + deployDir);
  } catch (e) {
    deployError = String(e?.message);
    log.error('ssg_deploy_failed', { outboxId: job.id, error: deployError });
  }
} else if (process.env.NODE_ENV === 'production') {
  deployError = 'DEPLOY_DIR not set';
}
// then: deployError ? mark job 'failed' with meta {deployError} : mark processed (coalesced, Task 1.1-3)
```

On Linux staging, prefer `rsync -a --delete dist/ <target>/` (via `execFile`, no shell) into the staging directory before the swap.

### Task 5.2-2 — Wire the environments

**Topology.** `infra/nginx/portal-staging.conf` proxies to `http://portal:8090` (lines 29/34/39/71) while serving `root /var/www/simalme/dist` (line 77) from the nginx host. A local `DEPLOY_DIR` therefore only works if the portal and nginx share a volume or a host. Otherwise, deploy with `rsync -a --delete dist/ deploy@edge:/var/www/simalme/dist/` using a deploy key. Record the choice in `ARCHITECTURE_STATE.md`. (`infra/nginx/simalme-dev.conf:15` serves a third docroot, `/srv/simal/site/dist`; align it or delete it.)

**Rig.** `SITE_DIST` is not a portal variable. It is read only by `scripts/dev-edge.mjs:17` (default `apps/site/dist`).
- For the local proof, set `DEPLOY_DIR=../../scratch/deploy-root` in `apps/portal/.env` (it resolves from `config.root`).
- Start dev-edge with `SITE_DIST=scratch/deploy-root`.
- Add `DEPLOY_DIR=` to `apps/portal/.env.example`.

### Task 5.2-3 — Prove it end-to-end

**Done-when:**
- publish → build → `ssg_deployed` audit row → the served root's file mtimes change;
- `node scripts/ci/control-loop-probe.mjs` (`SITE_ORIGIN` = the served origin) passes within the SLO measured in 1.1-4;
- a forced deploy failure (e.g. `DEPLOY_DIR` pointed at `apps/site/dist`) marks the job `failed` with `deployError`, and the portal stays up.

Capture the timeline to `rm-evidence/5.2-3.log`.

## Milestone 5.3 — Pipeline console operability

### Task 5.3-1 — Retry route (scoped to SSG jobs, audited)

The outbox also holds email rows. v1.1's unscoped `UPDATE … WHERE id=$1 AND status='failed'` could re-queue an email that no worker consumes.

```js
r.post('/api/cms/outbox/:id/retry', ...cmsAuth, async (req, res) => ok(res, await cms.retryOutboxJob(req.params.id, req.session)));
// cms.service.js
async function retryOutboxJob(id, session) {
  if (!client) throw new HttpError(501, 'Outbox retry requires PostgreSQL mode');
  const r = await client.query(
    "UPDATE outbox SET status='queued', meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('retriedAt',$2::bigint,'retriedBy',$3::text) " +
    "WHERE id=$1 AND status='failed' AND to_addr='ssg-builder' RETURNING id, status, created_at, meta",
    [String(id), Date.now(), getActor(session)]);
  if (!r.rows[0]) {
    const ex = await client.query('SELECT status FROM outbox WHERE id=$1', [String(id)]);
    throw new HttpError(ex.rows[0] ? 409 : 404, ex.rows[0] ? 'Job is ' + ex.rows[0].status + ', not failed' : 'Outbox job not found');
  }
  await repos.audit(getActor(session), 'cms_publish_retried', String(id), '');
  return r.rows[0];
}
```

### Task 5.3-2 — Pipeline UI

- **Data.** `viewPublishPipeline` (`cms.js:2833-2930`) lists `state.outbox`, which email traffic crowds out. Fetch SSG jobs separately: add `GET /api/cms/outbox?channel=cms&to=ssg-builder`.
- **Retry button.** Render it only for `to_addr==='ssg-builder' && status==='failed'`. Wire it by event delegation (no inline handlers, to keep the Phase-3 CSP).
- **Bell.** It has no count today: it is a static dot (`cms.html:100-103`). Its click handler counts `failed` (`cms.js:423`) and a non-existent `'pending'` status (`:422`; the real status is `'queued'`). Add a numeric badge bound to failed + queued SSG jobs, hide it at 0, and replace `'pending'` with `'queued'` at `:422` and `:2835`.

### Task 5.3-3 — Failure/retry drill

Run this after the 1.1-4 drain.
1. Break a build with the `rm-deliberate-fail.astro` page from 1.1-4.
2. Confirm the row shows red and the bell count increments.
3. Delete the page, click Retry, and watch the job reach `processed`.

A retried job keeps its original `created_at`, so it runs ahead of newer queued jobs (`server.js:153` orders by `created_at ASC`).

**Done-when (milestone):** the transcript is saved.

**Phase 5 exit gate:**
- the control-loop probe (edit → publish → build → **deploy** → visible at the served origin) passes twice in a row;
- a failed build and a failed deploy each show as failed on the dashboard;
- retry works.

---

# PHASE 6 — Public-Site Truth & Consistency *(Days 21–25)*

> Closes **PUB-8 (the only NOT-FIXED finding)**, the PUB-11/12 partials, **F-2026-N11**, **F-2026-N16** and the DAT-7 recurrence guard.

## Milestone 6.1 — One source of truth per published fact (closes PUB-8)

### Task 6.1-1 — Ratify the values (Legal/PM) — the baseline itself is inconsistent

| Fact | Baseline (`Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md`) | Catalogue / site reality | Decision needed |
|---|---|---|---|
| Brand count | a2: "Exactly 22 Brands: Acer, AOC, APC, Apple, ASUS, BenQ, Canon, Cisco, Dell, Epson, HP, Huawei, Kingston, Lenovo, Logitech, Microsoft, Panasonic, Samsung, SanDisk, Seagate, TP-Link, Western Digital" | `brands` has 22 rows, but one is the placeholder `other` ("More lines"), so **21 real brands**. Only 7 of the a2 names exist in the DB. 18 brands carry SKUs. `crucial`/`Crucial` are case duplicates. BaseLayout (line 36) and the sitemap (line 10) already exclude `other`. | the counting rule (recommended: `slug <> 'other'`) **and** a corrected a2 list |
| Years | a42: "Founding Year: **2003**" | site: "24 Years · since 2002" (`site/counters`, `index.astro:57`, `:312`, hero slide 5 kick) | 2003 → **23** in 2026; or amend a42 |
| SKUs | a3: 78 | DB: 78 ✓ | — |
| Awards | none | home (`index.astro:458-459`, "HIKSEMi…/TEAMGROUP…") vs about (`about/index.astro:101-102`, "Hikvision…/TeamGroup…"), plus `about/index.astro:81` and `BaseLayout.astro:547` | canonical issuer + title + year list |

Record the decisions in the baseline: a new row, or amend a2/a42. Make `Codebase/docs/` authoritative and mark `Project_doc/01_Requirements/GOVERNANCE_REQUIREMENTS_BASELINE.md` superseded. Then set `site/counters` (4.2-1) and seed `site/awards`.

### Task 6.1-2 — Replace every hardcoded occurrence (complete list, verified)

**Brands.** Render the DB count (`slug <> 'other'`) everywhere, and remove these literals:
- `index.astro:56` badge "21 Global Leaders"
- `index.astro:414` "22 global IT brands" (the count includes `other`)
- `BaseLayout.astro:458` "vendor lines — ${brandRows.length} brands"
- `careers/index.astro:69` (meta description) and `:86`
- `onboarding/index.astro:25`
- `insights/index.astro:103`
- `sitemap/index.astro:27`
- `ar/onboarding/index.astro:41` ("21 علامة")
- `ar/index.astro:19` (fallback `|| 21`)
- `about/index.astro:10` and `ar/about/index.astro:7` (`count(*)` includes `other`)
- `brands/index.astro` (same)

The AR home has no "Global Leaders" badge, so there is no AR twin of that edit.

**Hero slide 5** ("23 global IT leaders", kick "24 Years in MEA"):
- `seed.sql:377` uses `ON CONFLICT (idx) DO UPDATE` (clobbers CMS edits), and the **live row** carries the same text.
- Support tokens `{brands}`/`{years}` in slide text, substituted in `index.astro` heroData.
- Update the live row and change the seed to `DO NOTHING`.

**Awards.** Render `site/awards` in both walls and fix `about/index.astro:81` and `BaseLayout.astro:547`. AR about has no awards section; it is added in 6.2-2.

**Years.** Derive every phrasing from `site/counters`:

| File:line | Current phrasing |
|---|---|
| `index.astro:57`, `:312` | "24" |
| `software/index.astro:68` | "20+ years" |
| `about/index.astro:33`, `:76` | "Two decades" |
| `solutions/index.astro:39`, `:45` | "Two decades" |
| `ar/about/index.astro:20`, `:45` | |
| `ar/index.astro:42`, `:48`, `:67` | |
| `ar/solutions/index.astro:57` | |

### Task 6.1-3 — CI guard against re-divergence (a separate gate with a known reference)

`check-no-placeholders.mjs` has no DB access (it is pure `fs`), so it is the wrong home. v1.1's regex also missed most occurrences ("22 global IT brands", "vendor lines — 21 brands", "21 authorized lines", Arabic) and scanned one page.

Instead:
- `BaseLayout` emits `<meta name="simal:brand-count" content={brandCount}>`.
- A new gate `scripts/ci/facts-consistency.mjs` scans **all** `dist/**/*.html` with `/(\d{1,3})\s*(?:global\s+(?:IT\s+)?(?:leaders|brands|hardware brands)|brands|authorized lines|علامة)/gi`, and fails if any number differs from the meta value.
- The same gate checks that the years figures equal `site/counters.years`.
- Add it to `run-gates.mjs` now. It is wired into CI by Task 9.1-1; it is not in `ci.yml` today.

**Done-when (milestone):**
- the gate passes on a fresh build and fails when a stray "23 brands" is injected into a page;
- the awards lists on home and about are identical.

## Milestone 6.2 — ROI inputs & deep-link anchors (closes PUB-11/12 residues)

### Task 6.2-1 — Honour `r-ind`/`r-size` in the ROI calculator

v1.1's snippet could not work, for two reasons:
- The `<option>`s have **no `value` attributes** (`software/index.astro:225-226`), so `.value` is the display text ("Retail & Distribution", "51–200" with an en dash). Every factor lookup misses, and `Number('51–200')` is `NaN`.
- `indSel`, `sizeSel`, `it` and `ops` don't exist in `calc()` (`:295-319`); `ops = …` throws a ReferenceError in a module script.

Fix:
1. Add values to the options: `retail, manufacturing, healthcare, education, banking, government, logistics, services, other`, and sizes `11-50, 51-200 (selected), 201-500, 501-2000, 2000+`.
2. Change `calc()`:

```ts
const INDUSTRY_FACTOR: Record<string, number> = { retail: 1.0, manufacturing: 1.2, healthcare: 1.25, education: 1.0, banking: 1.15, government: 1.1, logistics: 1.15, services: 1.0, other: 1.0 };
const SIZE_FACTOR: Record<string, number> = { '11-50': 1.0, '51-200': 1.0, '201-500': 1.1, '501-2000': 1.2, '2000+': 1.3 };
const sel = (id: string) => (document.getElementById(id) as HTMLSelectElement | null)?.value ?? '';
const k = (INDUSTRY_FACTOR[sel('r-ind')] ?? 1) * (SIZE_FACTOR[sel('r-size')] ?? 1);
const itSave = itH * 12 * rate * 0.35 * k;
const manSave = manH * 12 * rate * 0.45 * k;     // total stays licSave + itSave + manSave → breakdown still reconciles
```

3. Show `×k` in the `rBreak` labels. The listeners on `r-ind`/`r-size` already exist (`:321-323`).

(If Product prefers to drop the two inputs, remove them; either closes the finding.)

### Task 6.2-2 — Fix the real 19 missing fragment targets — and make the crawl enforce it

**v1.2 correction.** `link-crawl.mjs` prints only the count (`:87`) and never fails on anchors (`:6`). Reproducing its logic gives the real 19:

| Count | Missing anchors | Fix |
|---|---|---|
| 14 | 7 anchors × 2 on **`/ar/products/`**: `#internal-ssd #portable-ssd #memory #monitors #gaming #accessories #laptops`, linked from the BaseLayout mega-menu (436-442) | port the `cat-anchors` block (`products/index.astro:64-68`) into `ar/products/index.astro` |
| 5 | `/ar/about/`: `#leadership #mission #awards #why #csr` | AR about has none of these sections. Add real translated sections with those ids, not empty anchors (awards from `site/awards`) |

`#comparison` is **not** among the 19. It is a bare `href="#comparison"` in `ar/software/index.astro:82`, which the gate skips (`:64`). Neither software page has that id. Port the comparison table (EN `software/index.astro` ~106) with `id="comparison"`, or repoint the link to `#pricing` (`:134`).

**Make the gate enforce it:**
- print `missingFrags` and push them into `failures`;
- also check bare `#x` links and cross-page fragments. Today there are 21 cross-page misses, including `/insights/#cat-CHANNEL|GUIDE|SOFTWARE|COMPLIANCE|SECURITY|COMPANY|STORAGE|PRODUCT` (no static ids) and `/insights/#cat-undefined` (from the p4 fixtures — gone after 6.3-1).

**Done-when:** the crawl gate prints and fails on missing anchors, and reports 0.

## Milestone 6.3 — Dist hygiene & test-data isolation (closes F-2026-N11, DAT-7 recurrence)

### Task 6.3-1 — Purge the published test fixtures and stop the recurrence

1. **Inventory first.** Run a `SELECT`, then delete inside a transaction after review. The gate and probes wrote more than v1.1 listed:

| Rows | Source | Action |
|---|---|---|
| 8 `insight/p4-rollback-article-*` + 24 `cms_revisions` rows | e2e | delete |
| `site/emergency_broadcast`, `site/super_admin_broadcast` | e2e | delete |
| `site/amc-tiers` | **overwritten** by the e2e fixture (`updated_by` `gate-admin-…@example.invalid`; `test-cms-e2e.mjs:62-72`) | restore from `seed.sql` |
| `site/emergency-banner` ("Live Operational Probe Rehearsal…"), `site/pricing-tiers` ("50% off wholesale") | written by `admin@smartme.com` | delete or confirm with PM |

   Select by `updated_by LIKE '%@example.invalid'` as well as by name.

2. **Rebuild** through the worker: `ls dist/insights | grep -c p4-rollback` must be 0, and `dist/sitemap.xml` clean. Today it has 32 references, and home links three of the fixtures — they top "Latest insights" because `index.astro:137` orders by `payload->>'at' DESC`, and fixtures with no `at` (NULL) sort first. Change that to `DESC NULLS LAST`.

3. **Stop the recurrence.** `scripts/ci/test-cms-e2e.mjs:18` is `const PG_URL = process.env.DATABASE_URL || 'postgres://simal:[REDACTED-ROTATED-2026-10]@…/simal'`, which points at the main DB. Use the existing scratch helper (`lib.mjs:50-75` creates, migrates, seeds and drops):

```js
import { bootApp, login, scratchDatabase } from './lib.mjs';
const scratch = process.env.E2E_DATABASE_URL ? null
  : await scratchDatabase(process.env.GATE_ADMIN_URL || process.env.ADMIN_DATABASE_URL, 'e2e');
const PG_URL = process.env.E2E_DATABASE_URL || scratch.url;
// …final cleanup: await stop(); await scratch?.drop();
```

   Keying off `DATABASE_URL` would still pollute the main DB whenever a shell exports it. The e2e builds into `dist-e2e` (4.1-2), never `dist`.

4. **Guard.** The placeholders gate fails if `dist/insights/` contains `p4-rollback-*`.

5. **Clean up** the orphaned gate databases `simal_gate_pgr_mv4vnly1` and `simal_gate_pgr_mv6wr0gg`, and make `lib.mjs` drop scratch databases in a `finally` block, with a pre-run sweep.

### Task 6.3-2 — Resolve `hero_slides.bg` (F-2026-N16)

All 5 live rows have `bg` NULL. `index.astro:1353` uses `const bg = BG[i % BG.length];` (BG at `:1328-1334`).

- **Option A, render it.** v1.1's `sl.bg || …` would open an attribute-injection sink: the value lands unescaped in `style="background:${bg};…"` (`:1375`), and the editor even suggests an "image asset path" (`cms.js:1392`), which is invalid CSS. Validate it:

```ts
const bgOf = (v: string) => { const s = String(v || '').trim();
  if (/^\/[\w\/.-]+\.(?:jpe?g|png|webp|avif)$/i.test(s)) return `url("${s}") center/cover no-repeat`;
  return /^(?:#[0-9a-f]{3,8}|(?:linear|radial)-gradient\([#\w\s.,%()-]+\))$/i.test(s) ? s : ''; };
const bg = esc(bgOf(sl.bg) || BG[i % BG.length]);
```

  Apply the same rule in `upsertSlide` (422 on an invalid value) and in the server-rendered slide markup (`index.astro:162`).
- **Option B, drop it.** Remove `bg` from `index.astro:10` and `:78`, `cms.service.js:101-114` and `:226-227`, `cms.js:1390-1392` and `:1442`, and `migrate.sql:115`; then `ALTER TABLE hero_slides DROP COLUMN IF EXISTS bg`.

Pick one and document it in `ARCHITECTURE_STATE.md`.

**Phase 6 exit gate:**
- the crawl gate fails on anchors and reports 0;
- the facts-consistency gate is green;
- `dist` is free of fixtures;
- the ROI total changes with industry and size;
- the e2e runs on a scratch DB.

---
# PHASE 7 — Data & Runtime Posture *(Days 25–30)*

> Closes **DAT-6/DAT-9 partials, F-2026-N17, SEC-11 partial** and the P10-4 "batch jobs running" criterion.

## Milestone 7.1 — Run the app as a non-superuser over scram-sha-256 (closes DAT-9)

### Task 7.1-1 — Provision the least-privilege roles (and actually rotate the password)

**v1.2 corrections.**
- **Wrong role.** There is no `postgres` role on the rig. `simal` is the initdb superuser (`scripts/setup.cmd:13`).
- **Psql variables don't expand inside `DO $$…$$`.** Verified on the rig: `DO $$ BEGIN RAISE NOTICE '%', :'x'; END $$;` → `syntax error at or near ":"`.
- **The script never rotates the password.** Its ELSE branch (lines 24–33) runs `ALTER ROLE … CONNECTION LIMIT 50` without a password. `simal_app` already exists, so a re-run leaves the exposed password live.
- **Default privileges lack `FOR ROLE`.** Lines 52–53 apply only to tables created by whoever runs the script.

Replace lines 10–36 and 52–53 of `scripts/prod-db-roles.sql`:

```sql
SELECT format('CREATE ROLE simal_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 50')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'simal_app') \gexec
ALTER ROLE simal_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 50
  PASSWORD :'app_password';
-- … grants (lines 38–49) unchanged …
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO simal_app;
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO simal_app;
-- + the simal_build block from Task 1.1-2
```

Run it:

```
tools\pgsql\bin\psql.exe -h 127.0.0.1 -p 5433 -U simal -d simal -v ON_ERROR_STOP=1 -v app_password=<hex> -v build_password=<hex> -f scripts/prod-db-roles.sql
```

Use hex passwords (`randomBytes(24).toString('hex')`). The old literal's `#` breaks connection URLs.

What is already in place on the rig: `simal_app` holds SELECT/INSERT/UPDATE/DELETE (no TRUNCATE) on all 26 tables and USAGE on all 8 sequences, `password_encryption` = scram-sha-256, and `REVOKE CREATE ON SCHEMA public FROM PUBLIC` is in effect.

### Task 7.1-2 — Switch pg_hba to scram (zero `trust` lines) and reload

1. **Set the admin password first.** Under `trust`, no password is checked, and the repo carries two different hardcoded `simal` passwords (`[REDACTED-ROTATED-2026-10]` in 21+ files, `[REDACTED-ROTATED-2026-10]` in 2), so at least one is wrong. Run `\password simal` (or `ALTER ROLE simal PASSWORD :'admin_password'`) and store the value as `ADMIN_DATABASE_URL`.

2. **Replace the rules.** The live rules (`SELECT * FROM pg_hba_file_rules`) are six `trust` lines: `local all` (117), `host all 127.0.0.1/32` (119), `host all ::1/128` (121), and three replication lines (124–126). v1.1 changed only two of them, so its Done-when ("trust appears nowhere except the single admin line") could never pass. Keeping a `trust` admin line would also make "verify `simal`'s password auth" meaningless. Replace the body of `Codebase/tools/pgdata/pg_hba.conf` with:

```
host  all    simal        127.0.0.1/32  scram-sha-256
host  all    simal        ::1/128       scram-sha-256
host  simal  simal_app    127.0.0.1/32  scram-sha-256
host  simal  simal_app    ::1/128       scram-sha-256
host  simal  simal_build  127.0.0.1/32  scram-sha-256
host  simal  simal_build  ::1/128       scram-sha-256
host  all    all          all           reject
```

   The admin line must be database `all`: the gates connect to `postgres` and create `simal_gate_*` databases. `local` lines are inert on this Windows rig.

3. **Validate, then reload.** Check `SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;` returns 0 rows, then run `tools\pgsql\bin\pg_ctl.exe -D tools\pgdata reload` (or `SELECT pg_reload_conf();`).

4. **Version both files.** `tools/pgdata/` is git-ignored, so commit the body as `scripts/pg_hba.conf.dev`. Also add the `simal_build` lines and a documented migration/admin path to `scripts/pg_hba.conf.production`; today it allows only `simal_app` (lines 13–20) and ends `host all all all reject` (26), which locks out migrations and the build.

### Task 7.1-3 — Point the app at the new role and prove least privilege

1. **Split the URLs.** In `apps/portal/.env`, set `DATABASE_URL=postgres://simal_app:<pw>@127.0.0.1:5433/simal` and `ADMIN_DATABASE_URL=postgres://simal:<pw>@127.0.0.1:5433/postgres`.
   - **v1.2 blocker:** `run-gates.mjs:17-25`, `bringup.mjs:114-131` and `dr-drill.mjs:16-130` derive their admin/DDL URL from `DATABASE_URL`. Under `simal_app` (NOCREATEDB), `CREATE DATABASE` fails and clean-db/pg-reporting turn red.
   - Make all three prefer `ADMIN_DATABASE_URL`: `envTxt.match(/^ADMIN_DATABASE_URL=(.*)$/m) || envTxt.match(/^DATABASE_URL=(.*)$/m)`.

2. **Restart properly** (stop the :8090 listener first, as in 1.1-4).

3. **Smoke test.** Check health, one CMS write, and one SSG build over the `simal_build` connection from 1.1-2. The build must survive the auth switch.

4. **Prove least privilege.** As the app role:
   - `SELECT current_user, rolsuper FROM pg_roles WHERE rolname = current_user;` → `simal_app | f`. (v1.1's `SELECT current_user, rolsuper;` is invalid SQL.)
   - `CREATE TABLE x(i int);` must fail. Verified it will: `has_schema_privilege('simal_app','public','CREATE')` = f.

5. **CI.** Today every job runs as superuser `simal:test` (`ci.yml:15/66/116/152/208/246`). Add a step to the `integration` job that applies `prod-db-roles.sql` (with `-v` vars) in the service container and runs `test/pg-integration-test.js` and `test/pg-mode-journey.test.js` with `DATABASE_URL=postgres://simal_app:…`.

**Done-when (milestone):** the app runs as a non-superuser over scram, with zero `trust` lines; `run-gates.mjs` is green using `ADMIN_DATABASE_URL`. Evidence: psql transcripts and gate output.

## Milestone 7.2 — Sequences gate, SLA precision, escalation and reminders (closes DAT-6, F-2026-N17, P10-4 batch work)

### Task 7.2-1 — Put sequence health in CI (a new check-only script, plus fix the seed drift)

**Path.** The tool is `apps/portal/tools/sync-sequences.mjs`, not `tools/`. It has no `--check` mode, no argv parsing and no exports. It runs on import, always calls `setval` (lines 32, 48–56), and hardcodes `simal:[REDACTED-ROTATED-2026-10]` (line 4).

**Write `scripts/ci/sequences.mjs` (check-only).**
- For each serial column, read `last_value, is_called` from the sequence. The effective value is `is_called ? last_value : last_value - 1`. Compare it with `SELECT COALESCE(MAX(col),0)`, using `client.escapeIdentifier`.
- Also check the three standalone sequences (`ref_seq`, `inv_seq`, `rfq_seq`) against the numeric suffixes, using the same SUBSTRING expressions as `sync-sequences.mjs:48-56`.
- Exit 1 on any drift.

**Fix the drift it will find on day one.**
- `scratchDatabase()` runs `migrate.sql`, whose DAT-6 block (`migrate.sql:307-344`) sets `testimonials_id_seq` to 1 on empty tables.
- `seed.sql` then inserts explicit ids (testimonials 1–3 at `:186-188`/`:418-428`, announcement 1 at `:431`) and never calls `setval`.
- Every fresh environment therefore has `testimonials_id_seq = 1 < max(id) = 3`.
- Append the DAT-6 sync block to the end of `scripts/seed.sql`.

**Register the gate.**
- Add `['sequences', 'sequences.mjs', 'DAT-6 sequence drift (check-only)']` to `GATES` (`run-gates.mjs:31-39`).
- Add a `gate-sequences` job to `ci.yml`, cloned from `gate-pg-reporting` (postgres:16 service + `GATE_ADMIN_URL`).

### Task 7.2-2 — SLA in fractional business days per GOV a11/a42, plus escalation

**v1.2 corrections.**
- **The proposed loop still floors.** v1.1's `ageBusDays` increments only per full 24 h, so `>= 1.5` fires only at 2. Simulated: 36 h, 38.4 h and 47.9 h all give `breached = false`, so N17 stays open.
- **The weekend is wrong.** v1.1 used Fri/Sat. GOV **a42**: "Monday – Friday 09:00–18:00 GST; Saturday 09:00–14:00 GST; Sunday Closed". The UAE federal weekend has been Sat/Sun since 2022, so Fri/Sat is wrong under every reading. Day boundaries must be computed in GST (UTC+4), not UTC.
- **The threshold is 2 business days, not 1.5.** GOV **a11**: "Standard SLA: 2 business days; raising a query pauses SLA timer; partner resubmission restarts". The customer copy agrees (`notify.service.js:121`, `confirmation.js:13`).

Replace `review.service.js` `summarise()` (lines 41–51). Submission history entries are `{status, label, ts}` (`kyc.service.js:145`, `:224`; `review.service.js:94`, `:131`).

```js
const DAY = 86400000, GST = 4 * 3600000;
const WEEKEND = new Set(String(process.env.SLA_WEEKEND_DAYS ?? '0').split(',').filter(Boolean).map(Number)); // a42: Sunday closed (PM to confirm Saturday half-day)
const SLA_BD = Number(process.env.SLA_BREACH_BD || 2);                                                       // a11: 2 bd
export function businessDaysBetween(fromMs, toMs) {
  let t = fromMs, bd = 0;
  while (t < toMs) {
    const local = t + GST, end = Math.min((Math.floor(local / DAY) + 1) * DAY - GST, toMs);
    if (!WEEKEND.has(new Date(local).getUTCDay())) bd += (end - t) / DAY;
    t = end;
  }
  return bd;                                                    // fractional
}
function summarise(s, now = Date.now(), session) {
  const subAt = Number(s.submittedAt || s.submitted_at) || now;
  const restartAt = [...(s.history || [])].reverse().find(h => h.status === 'partner_updated')?.ts || subAt;  // a11: resubmission restarts
  const ageBd = businessDaysBetween(restartAt, now);
  return { /* …existing fields (tin masked per 2.2-1)… */
    ageDays: Math.max(0, Math.floor((now - subAt) / DAY)), ageBusinessDays: Math.round(ageBd * 10) / 10,
    slaBreached: PENDING_SET.includes(s.status) && s.status !== 'query_raised' && ageBd >= SLA_BD };     // a11: query pauses
}
```

**Escalation.** The existing maintenance interval (`server.js:130-145`) runs every 15 min with a *synchronous* callback (it also calls `repos.sessions.reap()` without `await`), and it isn't reachable from tests. `createApp` returns only `{server, repos, store, config, auth}` (line 210). Add a separate async job:

```js
async function escalateSlaBreaches(now = Date.now()) {
  const to = process.env.SLA_ESCALATION_EMAIL; if (!to) return 0;
  const done = new Set((await repos.auditLog('', 'sla_escalated')).map(a => a.target));
  let n = 0;
  for (const s of await repos.submissions.all()) {
    const row = review.summarise(s, now);
    if (!row.slaBreached || done.has(s.id)) continue;
    await notify.send({ channel: 'email', to, subject: `KYC SLA breach — ${s.id}`,
      text: `${s.id} pending ${row.ageBusinessDays} bd, status ${s.status}.`, meta: { event: 'sla.escalated', ref: s.id } });
    await repos.audit('system', 'sla_escalated', s.id, `age=${row.ageBusinessDays}bd`); n++;
  }
  return n;
}
const slaTimer = setInterval(() => escalateSlaBreaches().catch(e => log.warn('sla_escalation_failed', { error: String(e?.message) })), 30 * 60000);
slaTimer.unref();
// return { server, repos, store, config, auth, escalateSlaBreaches, … }   (export summarise from review)
```

**Configuration.** No `review-queue@simalme.com` exists anywhere, so the recipient is config: add `SLA_ESCALATION_EMAIL`. While here, `await` the `reap()` call. `scripts/ci/pg-reporting.mjs:26-29` ages its fixture by 4 *calendar* days; make it 5 days so it stays above 2 bd on any weekday.

**Done-when:** unit tests (`node:test` `mock.timers`, or the injectable `now`) show:
- 1.6 bd → breached;
- 1.4 bd → not breached;
- a span crossing a Sunday counts it as 0;
- `query_raised` → not breached;
- `partner_updated` restarts the clock.

An integration test calls `app.escalateSlaBreaches()` and finds exactly one escalation outbox row plus a `sla_escalated` audit row; a second call adds none.

### Task 7.2-3 — Licence/document expiry reminder job (v1.2 new — P10-4 "batch jobs running")

`REMEDIATION_PLAN.md:361` (P10-4) requires "scheduled batch work (SLA/expiry reminders) running". No expiry job exists: `server.js` has only the maintenance and SSG intervals, and "expiring-docs" is just a report (`admin.service.js:315`).
- Add `remindExpiries(now)` with the same pattern as `escalateSlaBreaches`. For approved partners whose `company.license_expiry` is ≤ 30 days away, send one email per (partner, threshold) and audit it as `expiry_reminded`.
- Run it daily, export it from `createApp`, and test it like 7.2-2.

## Milestone 7.3 — Real dual approval for sensitive changes (closes SEC-11 residue)

> **v1.2 blocker.** Sensitivity today is computed from **caller-declared** `entities` (`cms.service.js:277`; the route passes `b.entities` and the whole body as options, `routes.js:770-773`). The **only** UI publish sends `entities: [{ entity: 'site', entity_id: 'all' }]` (`cms.js:2940-2943`).
>
> Meanwhile, edits are written live at save time, and the build reads live tables. So any publish ships any unapproved edit, and a reviewer can declare `site/all` to skip approval entirely. v1.1's redesign kept that key, and its 7.3-4 (widening `isSensitiveEntity`) would never fire.
>
> **Classification must run on a server-derived set of changes.**

### Task 7.3-1 — Data model + service flow on the server-derived dirty set

**Dirty set.** Everything changed since the last processed build. The audit actions already carry it:
- `cms_policy_upserted` → `legal_policies/<slug>` (`cms.service.js:156`)
- `cms_announcement_upserted` → `announcements/<id>` (`:744`)
- `cms_block_upserted` → `<entity>/<id>`
- `cms_slide_upserted`
- `cms_rollback` → `<table>/<id>`
- and so on.

```sql
SELECT DISTINCT action, target FROM audit_log
 WHERE action LIKE 'cms\_%'
   AND action NOT IN ('cms_published', 'cms_emergency_publish', 'cms_publish_retried')   -- publish events are not content changes
   AND ts > COALESCE((SELECT MAX(ts) FROM audit_log WHERE action = 'ssg_build_completed'), 0);
```

(Live action vocabulary, verified: `cms_block_upserted` 61, `cms_product_created/updated/deleted`, `cms_brand_upserted/deleted`, `cms_rollback` 13, `cms_announcement_upserted` 10, `cms_media_uploaded/deleted`, `cms_product_deep_upserted`, `cms_testimonial_upserted`.)

`publish()` ignores `entities` for classification. It classifies the dirty set (7.3-3); if anything is sensitive and no `approved` approval covers exactly that set, it creates a `pending` row, notifies, enqueues **nothing**, and returns `{ pending: true, approvalId }`.

The route must send 202 explicitly — `ok()` is hard-wired to 200 (`http.js:27`):

```js
const r = await cms.publish(…); return r.pending ? json(res, 202, r) : ok(res, r);   // import json
```

**Remove both caller-attested approver paths:**
- `publish()` lines 280–293;
- `emergencyPublish()` lines 314–333, which still accepts a body-supplied `secondApproverEmail` from reviewers.

The approver role list there includes `compliance_officer`, which is not a valid role (`users.role` CHECK, `migrate.sql:13`).

**Schema.** Add to `migrate.sql` as block `-- ==== B13 (RM-7.3-1) ====` before the DAT-6 block (line 307). The whole file is idempotent; it has no separate "idempotent section".

```sql
CREATE TABLE IF NOT EXISTS publish_approvals (
  id TEXT PRIMARY KEY,
  requested_by CITEXT NOT NULL,
  change_set JSONB NOT NULL,                       -- the server-derived dirty set at request time
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  reason TEXT, decided_by CITEXT, decided_at BIGINT, outbox_id TEXT,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now())*1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS publish_approvals_status_idx ON publish_approvals(status);
```

**Existing tests that will break.** `test/unit/content-governance.test.js` asserts the old behaviour: tests 5–6 (~141-166) cover the attested path, and test 1 (64-72) expects announcements to publish directly. Its mock client returns `{rows:[]}` for unknown SQL (line 42), so it would silently pass `publish_approvals` inserts. Rewrite it in 7.3-4.

### Task 7.3-2 — Approval routes + CMS UI

**Routes.** The router matches literal segments only, with no alternation (`http.js:59-68`), so register two routes:
- `POST /api/cms/publish-approvals/:id/approve`
- `POST /api/cms/publish-approvals/:id/reject`

Plus `GET /api/cms/publish-approvals?status=pending`. All are behind `cmsAuth`, which already limits them to super_admin and reviewer via the `notes` permission (`routes.js:697`, `rules.js:25-26`).

**Rules.**
- The approver must be a **different user**: `session.email.toLowerCase() !== requested_by.toLowerCase()`. A second session of the same user is still 403.
- Approval is refused if the dirty set has changed since the request (409) or `expires_at` has passed (409 `expired`).
- On approve: enqueue through the extracted `enqueuePublish()` (today `cms.service.js:296-310`) and set `decided_by`/`decided_at`/`outbox_id`.

**Emergency override** (super_admin only) stays, but must emit `cms_emergency_override` and notify every super_admin.

**UI.**
- The publish modal's success toast (`cms.js:2945`) branches on 202: "Awaiting second approval".
- Add an approvals panel; the bell today is a toast over outbox counts with no item list.

**Gate.** Add the new routes to the deny-by-default `ROUTES` in `scripts/ci/authz-matrix.mjs:13-34`.

### Task 7.3-3 — Classify legal and marketing changes as sensitive *(was 7.3-4; v1.2 re-ordered)*

On the **dirty set** (not on declared entities), sensitive =
- `legal_policies/*`
- `announcements/*`
- `hero_slides/*`
- `testimonials/*`
- the existing pricing / brand-auth / claims / compliance-dates rules (`isSensitiveEntity`, `cms.service.js:264-271`).

This matches the original SEC-11 wording ("Reviewer can rewrite public legal/marketing content & publish"). Rig rows that are sensitive today: `erp/pricing`, `site/pricing-tiers`.

### Task 7.3-4 — Tests + live demo *(was 7.3-3, which had no body in v1.1)*

Replace `test/unit/content-governance.test.js` and add a PostgreSQL integration case that uses the real `publish_approvals` table. The cases:
1. A reviewer edits a pricing block, then publishes `site/all` → **202** `{approvalId}`, and **0** `ssg-builder` outbox rows. This proves the server-derived dirty set.
2. The same user approves → 403. Another session of the same user → 403.
3. A different reviewer or super_admin approves → 200; exactly one queued `ssg-builder` row; `status='approved'`; `decided_by` set.
4. Reject → no outbox row.
5. A reviewer calls `/api/cms/emergency-publish` with `secondApproverEmail` → 403.
6. A super_admin emergency override → enqueued, plus a `cms_emergency_override` audit row and one notification per super_admin.
7. A legal-policy edit and an announcement edit go through the same matrix.
8. An expired approval → 409.
9. The dirty set changes after the request → 409.

Extend the control-loop probe (1.1-4). If publish returns 202, approve it with the reviewer account (`REVIEWER_EMAIL`/`REVIEWER_PASSWORD`) before polling.

**Done-when (milestone):** all of the above pass. A live demo with two users in two browsers is captured to `rm-evidence/7.3-4.*`.

**Phase 7 exit gate:**
- all gates green under `simal_app`, with `ADMIN_DATABASE_URL` used for DDL;
- the sequences gate is green on a fresh DB;
- the SLA and escalation tests pass, and the expiry reminder is proven firing;
- the dual-approval matrix (including legal and announcements) passes.

---

# PHASE 8 — Apps & Compliance Completion *(Days 30–34)*

> Closes **APP-3/APP-7 partials, SEO-2/SEO-5 partials** and F-2026-N07 (live AV).

## Milestone 8.1 — Live virus scanning, signed-URL and key drills (closes APP-3 residue)

### Task 8.1-1 — Stand up clamd and prove that *clamd* (not the built-in signature) rejects malware

**v1.2 blocker.** `scanBuffer` (`virus-scanner.js:132-160`) runs the in-memory EICAR signature check **first** (lines 137–142) and returns before contacting clamd. EICAR is therefore rejected the same way with clamd down, and v1.1's drill passed without ClamAV.

The scanner also **fails open**:
- daemon offline → `warn` + clean (`:154-156`);
- an unrecognised reply → clean (`:114-116`).

Changes:
1. Return `engine: 'signature' | 'clamd'` in the result.
2. When `CLAMAV_HOST` is set, query clamd first.
3. Add `CLAMAV_REQUIRED=true` (production): a scanner error then rejects the upload with 503 instead of passing it.
4. Write the audit row the old Done-when assumed: `await repos.audit('partner', 'upload_rejected_malware', d.name, scan.virus)` before the throw in `kyc.service.js:57-60`. Today it only logs.

**Install.** The client is TCP-only (`net.createConnection`, line 57).
- **Debian:** `apt install clamav-daemon` → `freshclam` → add `TCPSocket 3310` + `TCPAddr 127.0.0.1` to `/etc/clamav/clamd.conf` (the default is a unix socket only) → `systemctl enable --now clamav-daemon`.
- **Windows:** copy `clamd.conf` from `conf_examples`, delete the `Example` line, set `TCPSocket 3310` / `TCPAddr 127.0.0.1`, run `freshclam`, then `clamd.exe`.

**Done-when:**
- An EICAR file **named `eicar.pdf`** (other extensions are rejected earlier by `kyc.service.js:51`) through the real wizard → 400 `Security check failed: document "eicar.pdf" contains malicious content (…)`, plus `virus_detected_clamav` in the log (**not** `virus_detected_signature`), no `clamav_daemon_offline`, and an `upload_rejected_malware` audit row.
- EICAR via the media route (4.4-2) → 4xx.
- With clamd stopped and `CLAMAV_REQUIRED=true` → 503.
- A clean PDF round-trips through the signed URL, and its file under `apps/portal/data/uploads/` starts with `SIMALENC1` (`head -c 9`) and contains no `%PDF`.

Screenshot and log saved.

### Task 8.1-2 — Signed-URL expiry and single-use drill

The current behaviour (`token.service.js:46-51`):

| Case | Response |
|---|---|
| expired | 401 `Token expired` (line 49) |
| reused | 409 `Token already used` (line 48) |
| unknown | 401 |
| wrong document | 403 (`routes.js:565`) |

v1.1 expected 403/410. The TTL is hardcoded (`routes.js:550` `ttlMs: 15 * 60 * 1000`; `token.service.js:20`), so add `DOC_URL_TTL_MS` and refuse values under 60000 in production.

Single-use is **not atomic** (find → check → save), so concurrent fetches can both succeed. Replace it with:

```sql
UPDATE one_time_tokens SET consumed_at = $1
 WHERE kind = $2 AND token_hash = $3 AND consumed_at IS NULL AND expires_at > $1 RETURNING *;
```

**Done-when:**
- with TTL 60 s, a fetch after 61 s → 401;
- a second fetch → 409;
- 10 parallel fetches of a fresh token → exactly one 200.

Capture it.

### Task 8.1-3 — Document-key rotation drill (v1.2 new — the "key drill" the milestone promised)

On staging, rotate `DOC_ENCRYPTION_KEY` a second time using the 2.4-3 tooling (old key → new key): back up, re-encrypt, and byte-verify a sample download. Record the timing and the rollback steps in `ARCHITECTURE_STATE.md`.

**Done-when:** the transcript shows 0 failures and every sampled download is byte-identical.

## Milestone 8.2 — KYC wizard UAT evidence pack (closes APP-7)

### Task 8.2-1 — Write the script (extend the existing UAT plan)

`Project_doc/04_Quality/UAT_Plan_and_Script.md` already contains KYC script #5 (line 17) and its sign-off roles (line 58). Extend it, or reference it from `Codebase/docs/UAT_KYC_WIZARD.md`.

Cover both tracks (vendor + customer). For each step, record expected results and evidence columns:
- **7-step completion** (`form.js:196`).
- **Per-step validation messaging.**
- **Autosave:** `PUT /api/public/drafts/:id` (`api.js:44`; 800 ms debounce `form.js:364` + 30 s interval `form.js:501`). The draft PUT should fire within 2 s of the last keystroke.
- **Refresh-resume:** the toast reads exactly "Draft restored — continuing at step X of 7." (`form.js:485`).
- **`?reapply=` resubmission:** the toast reads "Loaded prior application — update flagged fields and submit."
- **Document upload and EICAR rejection** (8.1-1).
- **Submit → staff review → approve:** the status page shows the reviewer's display name, or "Queued for assignment" (`status.js:94`).

### Task 8.2-2 — Execute the vendor track with evidence

Run it in the browser against the rig. Save screenshots and log lines per step into `docs/uat/<execution-month>/` (e.g. `2026-11`).

### Task 8.2-3 — Execute the customer track + sign-off

Repeat for the customer track. Sign-off per the existing UAT plan (line 58): **business owner per persona + PM + QA countersign**, as named people with dates.

**Done-when:** both tracks run end-to-end with zero blocked steps, and the cover page is signed.

## Milestone 8.3 — Sitemap lastmod from content timestamps (closes SEO-2 residue)

### Task 8.3-1 — Give every sitemap entity a real modification time

**v1.2 blocker.** Only `content_blocks` has `updated_at` (`migrate.sql:108`). `products`, `brands`, `legal_policies` and `product_deep` do **not** (verified in `information_schema`). v1.1's `SELECT slug, updated_at FROM products` would fail the whole Astro build.

**Fix A (preferred).** Add `migrate.sql` block B14:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE legal_policies ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE product_deep ADD COLUMN IF NOT EXISTS updated_at BIGINT;
-- backfill from the newest cms_revisions row per record (revisions are written on UPDATE only)
```

Then stamp `updated_at = Date.now()` in every write path:
- `createProduct` / `updateProduct` (`cms.service.js:366`, `:387-393`) and the products rollback (`:254-258`);
- `upsertProductDeep`;
- `upsertBrand`;
- `upsertPolicy` (per language, after 4.5-1) and the legal rollback (`:232`).

**Fix B (no DDL).** Derive `lastmod` from `cms_revisions`:

```js
db`SELECT p.slug, MAX(r.created_at) AS updated_at FROM products p
   LEFT JOIN cms_revisions r ON r.record_id = p.slug AND r.table_name IN ('products','product_deep')
   GROUP BY p.slug ORDER BY p.slug`
```

### Task 8.3-2 — Thread per-entity lastmod + regression case

`addUrl(path, lastmod = VERIFIED_BASE_DATE, hasArTwin)` (`sitemap.xml.js:58`) already accepts `lastmod`. In the loops (variable `r`, lines 85–117), pass `ts(r.updated_at)`, using:

```js
const ts = (ms) => (Number(ms) > 0 ? new Date(Number(ms)).toISOString().slice(0, 10) : VERIFIED_BASE_DATE);
```

Static routes keep the constant.

**Done-when (milestone):**
- `curl -s http://127.0.0.1:8100/sitemap.xml | grep -o "<lastmod>[^<]*" | sort | uniq -c` shows multiple dates (today: 240 × `2026-10-12`);
- an e2e case edits a product, builds, and asserts that product's `<lastmod>` equals today.

## Milestone 8.4 — GA4 behind consent (closes SEO-5 residue)

### Task 8.4-1 — Environment + a consent-gated loader that survives the Phase-3 CSP

**v1.2 corrections.**
- **The CSP blocks inline loaders.** v1.1's loader was an inline `define:vars` script. Phase 3 removes `'unsafe-inline'`, so it would be blocked, along with the existing Consent Mode defaults block (moved to an external file in 3.3-1).
- **`GA4_ID` was never defined.**
- **Returning visitors never loaded GA4.** `window.__simalConsentGrants` and the `simal:consent-accepted` event don't exist today. If they were set by the consent island (a deferred module), they would arrive after the parse-time check.
- **`anonymize_ip` is a no-op in GA4.**

Implementation:
1. **ID.** In the frontmatter, `const GA4_ID = import.meta.env.PUBLIC_GA4_ID;`. Set it per environment in `apps/site/.env` (new file) and in the CI/deploy build env. Emit `<meta name="ga4-id" content={GA4_ID}>` only when set.
2. **Defaults file.** In `public/assets/js/consent-default.js` (from 3.3-1), after the Consent Mode defaults, parse the `simal_consent` cookie and set `window.__simalConsentGrants = { analytics_storage: … }` synchronously.
3. **Loader.** Use a processed (bundled) `<script>`:

```ts
const id = document.querySelector('meta[name="ga4-id"]')?.getAttribute('content');
function loadGa4() {
  if (!id || document.getElementById('ga4-src')) return;
  const s = document.createElement('script'); s.id = 'ga4-src'; s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', id);
}
if ((window as any).__simalConsentGrants?.analytics_storage === 'granted') loadGa4();
window.addEventListener('simal:consent-accepted', (e: any) => { if (e.detail?.analytics_storage === 'granted') loadGa4(); });
```

4. **CSP.** Add to **all three** policies (3.3-2): `script-src https://*.googletagmanager.com`; `connect-src https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com`; `img-src https://*.google-analytics.com https://*.googletagmanager.com`. Today only `www.googletagmanager.com` / `www.google-analytics.com` are listed, and GA4 collects via `region1.google-analytics.com`.

### Task 8.4-2 — Wire the banner events

In `setConsent()` (`BaseLayout.astro:929-953`), after the existing `gtag('consent','update', …)`, dispatch `new CustomEvent('simal:consent-accepted', { detail: grants })` on Accept-all (~993) and on Save (~1005).

**On withdrawal:** set `window['ga-disable-' + id] = true`, update consent to denied, and `location.reload()`. Removing the `<script>` node does not stop an already-running gtag.js.

### Task 8.4-3 — Verify with network captures

Use `debug_mode: true` on a test build, or the GA Debugger extension.

**Done-when (milestone), three captures saved:**
- a fresh profile makes no `googletagmanager` request before Accept;
- after Accept, DebugView shows `page_view`, with zero CSP violations;
- after withdrawal and the reload, no collection requests are made.

**Phase 8 exit gate:**
- EICAR rejected *by clamd*, with an audit row;
- the signed-URL drill (including the parallel case) passes;
- the key-rotation drill passes;
- the UAT pack is signed;
- the sitemap shows multiple `lastmod` dates;
- GA4 is consent-gated, with no CSP violations.

---
# PHASE 9 — Test, CI & Observability Hardening *(Days 34–38)*

> Closes **NFR-1/3/4/6 partials, F-2026-N12**, the P0-3 wiring gaps, and the A11Y gate residues.

## Milestone 9.1 — Every gate runs on the CI platform

### Task 9.1-1 — Wire the remaining local-only gates into `ci.yml`

**v1.2 correction.** Only `placeholders` and `perf` are local-only today (`run-gates.mjs:36,38`). `gate-sequences` is created and wired by Task 7.2-1, so confirm it is present rather than adding it again.

Gates added locally by this roadmap that also need CI jobs: `csp-inline` (3.3-1), `facts-consistency` (6.1-3) and `cms-e2e` (4.1-2).

Job skeletons:
- **`gate-placeholders`, `gate-perf`, `gate-csp-inline`, `gate-facts-consistency`** — mirror `gate-link-crawl` (`needs: [build]` + `actions/download-artifact@v4` for `site-dist` + `npm ci`). All of them read `apps/site/dist`; v1.1 thought only perf did.
- **`gate-cms-e2e`** — mirror `gate-pg-reporting` (postgres:16 service + `GATE_ADMIN_URL`).

Add every new job ID to the branch-protection required checks (1.2-2).

### Task 9.1-2 — Real Lighthouse CI

There is no `lighthouse` job, no `lighthouserc.json` and no `@lhci/cli` dependency. Add `Codebase/lighthouserc.json`:

```json
{
  "ci": {
    "collect": { "staticDistDir": "./apps/site/dist", "numberOfRuns": 3,
      "url": ["http://localhost/", "http://localhost/products/", "http://localhost/solutions/", "http://localhost/software/", "http://localhost/rfq/"] },
    "assert": { "assertions": {
      "categories:performance": ["error", { "minScore": 0.85 }],
      "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }] } },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

`temporary-public-storage` (v1.1) publishes the reports to anyone with the link, so it is not appropriate pre-launch. The thresholds match baseline "Lighthouse Mobile Performance ≥ 85/100" (`GOVERNANCE_REQUIREMENTS_BASELINE.md:57`); LHCI's default profile is mobile.

```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/download-artifact@v4
        with: { name: site-dist, path: apps/site/dist }
      - run: npx --yes @lhci/cli@<pinned-version> autorun
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: lhci-reports, path: .lighthouseci }
```

This replaces the *simulated* score with a real one (NFR-1 acceptance). `perf-budget.mjs` stays as the fast local proxy.

### Task 9.1-3 — Green platform run captured

**Done-when (milestone):** one platform CI run in which **all** jobs, including the new ones, are green. Archive its URL to `rm-evidence/9.1-3.txt`.

This depends on Task 1.2-3 having made `ci.yml` executable (npm ci, lint config, a11y artifact, gitleaks licence).

## Milestone 9.2 — Test debt to zero (closes F-2026-N12)

### Task 9.2-1 — Turn the stale SSG script into a real, discoverable test

`apps/portal/test/integration/ssg-outbox-sync.test.mjs` has four problems:
- **Dead login.** It logs in with `admin@simalme.com`/`admin123` (L11). It already fails unless the status is `processed` (L50-52), so the credentials are its real defect.
- **Not a test file.** It is a plain script (`run().catch(…process.exit(1))`), not a `node:test` file.
- **Never run.** Its `.mjs` name means `npm test`, CI `unit` (`test/integration/*.test.js`) and the golden-rule command never pick it up.
- **Unsafe env read.** v1.1's snippet read `apps/portal/.env` at module top. That file is git-ignored, so in CI the read throws before any skip guard runs. The snippet also ignored MFA.

Replace it with `test/integration/ssg-outbox-sync.test.js` and delete the `.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { totpNow } from '../../src/lib/security.js';
const PORTAL_URL = process.env.PORTAL_URL || 'http://127.0.0.1:8090';
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8'); } catch {}
const pick = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const cookies = (r) => (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
test('F-2026-N12: CMS publish is processed by the SSG worker (rig e2e)', async (t) => {
  const up = await fetch(PORTAL_URL + '/api/health', { signal: AbortSignal.timeout(2000) }).then(r => r.ok, () => false);
  if (!up || !pick('ADMIN_EMAIL')) return t.skip('portal not reachable at ' + PORTAL_URL);
  let r = await fetch(PORTAL_URL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
  assert.equal(r.status, 200); let cookie = cookies(r); let d = await r.json();
  if (d.mfaRequired) {
    r = await fetch(PORTAL_URL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) });
    assert.equal(r.status, 200); cookie = cookies(r) || cookie; d = await r.json();
  }
  const H = { 'content-type': 'application/json', cookie, ...(d.csrfToken ? { 'x-csrf-token': d.csrfToken } : {}) };
  const pub = await (await fetch(PORTAL_URL + '/api/cms/publish', { method: 'POST', headers: H,
    body: JSON.stringify({ entities: [{ entity: 'announcements', entity_id: '1' }] }) })).json();
  let status = 'queued';
  for (let i = 0; i < 60 && !['processed', 'failed'].includes(status); i++) {
    await new Promise(res => setTimeout(res, 3000));
    const { outbox } = await (await fetch(PORTAL_URL + '/api/cms/outbox?limit=20', { headers: { cookie } })).json();
    status = outbox.find(o => o.id === pub.outboxId)?.status ?? status;
  }
  assert.equal(status, 'processed', 'SSG worker must process the publish job');
});
```

The test skips in CI (no rig) and runs against the rig. After Phase 7.3, a 202 response needs the second-approver step (see 7.3-4).

### Task 9.2-2 — Regression coverage for every Phase 2–8 fix

Add the tests listed in their tasks: CSRF 2.1-2, masking 2.2-2, bounce/gating 2.3, URL guard 3.2-2, dual approval 7.3-4, SLA/escalation/expiry 7.2-2/7.2-3, signed URLs 8.1-2. Use one file per area in `test/integration/*.test.js` (`.test.js`, so `npm test` and CI pick them up), and put the finding ID in each test title so the next auditor can grep for it.

### Task 9.2-3 — Extend the a11y gate to the CMS, using axe's own target-size rule

**v1.2 correction.** "axe-core has no 2.5.8 rule yet" is false. The installed axe-core 4.14.0 ships `target-size`, tagged `wcag22aa`/`wcag258`. The gate simply does not request it: `a11y.mjs:99` uses `runOnly … ['wcag2a','wcag2aa','wcag21a','wcag21aa']`.

v1.1's bounding-box snippet had three problems:
- It used a puppeteer `page`, but `a11y.mjs` drives Chrome over raw CDP (`send('Runtime.evaluate', …)`, L62-108).
- It called a `fail()` helper that doesn't exist; failures are pushed to `failures[]`.
- Its `width < 24 || height < 24` test ignores SC 2.5.8's exceptions, so it would false-fail inline links and `.sr-only` elements.

Changes to `scripts/ci/a11y.mjs`:
1. Add `'wcag22a','wcag22aa'` to `runOnly.values` (line 99).
2. Cover `cms.html`:
   - reuse `bootApp({ mode: 'json' })` and `login()` from `scripts/ci/lib.mjs` (L85, L132; `login` already handles TOTP);
   - inject the session with `send('Network.setCookie', { name: 'kyc_sid', value, url: portalBase })`;
   - navigate to `portalBase + '/cms.html'`, run axe, and push results onto `failures`.

**Done-when:** the gate reports `target-size` results on the public pages, and axe passes on the authenticated `cms.html`.

## Milestone 9.3 — Observability with a real sink (closes NFR-3)

### Task 9.3-1 — Outbound error sink

**File:** `Codebase/apps/portal/src/server.js`, inside the existing `if (status >= 500) { … errorSink.record(…) }` block (lines 115–126). `status`, `e`, `req.requestId` and `req.path` are in scope, and global `fetch` is available on Node 24.

Slack and Teams webhooks require a `text` (or card) field, and Sentry needs its own envelope format, so do not claim "Sentry-compatible".

```js
const OBS_URL = process.env.OBSERVABILITY_WEBHOOK_URL;
if (OBS_URL) {
  fetch(OBS_URL, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: `[simal] ${status} ${req.method} ${req.path} req=${req.requestId}`,
      requestId: req.requestId, path: req.path, status,
      message: String(e?.message || '').replace(/\b\d{6,}\b/g, '[n]').slice(0, 200), ts: Date.now() }) })
    .catch(() => {});
}
```

The redaction strips long numbers (TRNs, IBANs, phone numbers) from the message before it leaves the box (PDPL). Add `OBSERVABILITY_WEBHOOK_URL=` to `apps/portal/.env.example`; it is a different variable from the existing ERP `WEBHOOK_URL`.

### Task 9.3-2 — Uptime probe with alerting (a new script; `hypercare-daily.js` is not one)

**v1.2 blocker.** `scripts/hypercare-daily.js` boots its own in-process portal on a random port (L48-60), probes *that* instance (L61-65), re-runs `go-nogo-gate.js`, rewrites the tracked `scripts/hypercare-log.json`, and has no webhook code. Stopping the real portal would never make it fail.

Create `Codebase/scripts/uptime-probe.mjs`:

```js
const ORIGIN = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:8100';
const HOOK = process.env.OBSERVABILITY_WEBHOOK_URL;
let ok = false, detail = '';
try { const r = await fetch(ORIGIN + '/api/health', { signal: AbortSignal.timeout(5000) }); ok = r.ok; detail = 'HTTP ' + r.status; }
catch (e) { detail = String(e.cause?.code || e.message); }
if (!ok && HOOK) await fetch(HOOK, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: `[simal] UPTIME FAIL ${ORIGIN}/api/health — ${detail}`, ts: Date.now() }) }).catch(() => {});
process.exit(ok ? 0 : 1);
```

Schedule it every 5 minutes:
- **Rig:** `schtasks /Create /TN SimalUptime /SC MINUTE /MO 5 /TR "cmd.exe /c cd /d <Codebase> && tools\node\node.exe scripts\uptime-probe.mjs >> scratch\uptime.log 2>&1"`. `install-autostart.cmd` uses `/SC ONLOGON`, which is the wrong trigger for a probe.
- **Staging:** cron `*/5 * * * *`.

### Task 9.3-3 — Drills

**Done-when (milestone):**
- `POST /api/admin/observability/test-error` (as super_admin, after 2.3-2) produces a sink payload carrying the request id, and the webhook receives the alert;
- stopping the portal makes the next `uptime-probe` run alert.

Capture both.

## Milestone 9.4 — Rate limiting proven (closes NFR-4 residue)

### Task 9.4-1 — Record the enforcement decision

Record in `ARCHITECTURE_STATE.md`:
- **Enforcement point.** nginx `login_zone` (`infra/nginx/portal-staging.conf:6-8`, applied at line 28) is the edge enforcement point, and the in-process limiter is defence in depth. The true semantics of `rate=2r/m burst=10 nodelay` are: 11 requests immediately, then 1 every 30 s. The line-28 comment "10 attempts / 5 min" is inaccurate.
- **Proxy IP.** Behind nginx, the app trusts `X-Forwarded-For` only from 127.0.0.1/::1 (`security.js:152-157`). Set `TRUSTED_PROXIES=<nginx address>` on staging, or every client shares nginx's IP in `loginIpLimiter`/`publicLimiter`.
- **Alternative.** If staging cannot run nginx in this phase, implement a Redis-backed `rateLimiter`. This is **new work**: the current one is a closure over an in-memory `Map` with no backend interface.

### Task 9.4-2 — Prove it on staging (distinguishing edge from app)

v1.1 expected "503/429 from nginx". But nginx returns **503** unless `limit_req_status` is set (it is not), and the app's per-account `loginLimiter` (10 per 5 min, `routes.js:22`) fires on the same request (#11) as nginx's burst limit. Same-email loops therefore mix app 429s with edge 503s. Use unique emails, which the app limiter keys on:

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code} %header{server}\n" -X POST https://<staging-portal-host>/api/auth/login \
  -H 'content-type: application/json' -d "{\"email\":\"probe$i@x.ae\",\"password\":\"wrong\"}"; done
```

Expect 11 × 401, then 4 × 503 with `Server: nginx`. `%header{}` needs curl ≥ 7.84. Optionally add `limit_req_status 429;` to the location.

### Task 9.4-3 — Archive the transcript

**Done-when (milestone):** the status-code transcript is captured verbatim in `rm-evidence/9.4-3.log`, and the decision is recorded in `ARCHITECTURE_STATE.md`.

**Phase 9 exit gate:**
- a CI platform run includes every gate plus lighthouse, all green;
- the SSG test is green on the rig and skips cleanly in CI;
- axe passes on the CMS with `target-size` enabled;
- webhook alerts are demonstrated;
- the edge-limit transcript is captured.

---

# PHASE 10 — Independent Re-Verification & the Clean-Audit Gate *(Days 38–42)*

> Discharges **P10** in full. Nothing in this phase fixes code; it proves the fixes.

## Milestone 10.1 — Full local re-verification

### Task 10.1-1 — Gates + test suites

From `Codebase/`, run `node scripts/ci/run-gates.mjs`. It must be all green, including the gates this roadmap added: sequences, csp-inline, facts-consistency and cms-e2e.

Then run the full portal suite: `cd apps/portal; npm test` (unit + `integration/*.test.js`, which now includes `ssg-outbox-sync.test.js`), plus `node --test test/account-services.test.js test/token-exchange.test.js test/peppol-sandbox-roundtrip.test.js test/rfq.test.js`.

Save the outputs.

### Task 10.1-2 — Re-run the audit probes

The archived probes need adjustment after Phase 2:
- `live_probes.mjs` reads `ADMIN_*`/`REVIEWER_*`/`VIEWER_*` from **process env** only (L4, L14).
- `iteration2_live_proofs.mjs` hardcodes the `.env` path (L5) and also creates users (L35).
- Neither handles MFA.

Before re-running, add the MFA step (pattern: `control-loop-probe.mjs`) and export the variables:

```bash
node "…/audit_report_2/evidence/live_probes.mjs"            # RBAC/SLA/RFQ/masking/outbox — hasAE:false trnLeak:false
node "…/audit_report_2/evidence/iteration2_live_proofs.mjs" # CSRF case B must be 403
node scripts/ci/control-loop-probe.mjs                       # marker served at the deploy origin within the 1.1-4 SLO, then restored
```

### Task 10.1-3 — Browser sweep

Cover: public home, products, `/ar/`, 404; CMS dashboard and publish-pipeline (expect **0 queued**, and Last-Publish = the real build-completion time); one full KYC wizard run. Save screenshots to `rm-evidence/10.1/`.

## Milestone 10.2 — Staging rehearsal

### Task 10.2-1 — Clean-DB bring-up on staging

`bringup.mjs` is a dev-rig tool (portable `pg_ctl`, dev-edge). `--fresh` throws unless `BRINGUP_ALLOW_RESET=1` (`bringup.mjs:110-112`), and it needs a role that can `DROP/CREATE DATABASE` (L121-131). `simal_app` can't. On staging:

1. `BRINGUP_ALLOW_RESET=1 DATABASE_URL=<migration/owner role URL> node scripts/bringup.mjs --fresh` (migrate + seed + build), or the staging equivalent.
2. Restart the portal with `DATABASE_URL=<simal_app URL>` and `BUILD_DATABASE_URL=<simal_build URL>`.
3. Prove `SELECT current_user` = `simal_app`.
4. Run the gate suite against staging.

### Task 10.2-2 — DR drill + deploy proof on staging (fix the drill first)

`scripts/dr-drill.mjs` cannot produce a *measured* result yet:
- `const rpoAchievedSec = 0;` is hardcoded (L216), and "(PASS)" is templated text (L234-235, L264-265);
- it reads `DATABASE_URL` only from `apps/portal/.env` (L15-16);
- it needs DROP/CREATE DATABASE (L129, L211);
- it writes PII dumps into `data/backups/` inside the repo (L27);
- it overwrites `docs/DR_DRILL_EVIDENCE.md` on every run (L275).

Fix it first:
- source the primary and admin URLs from the environment (`ADMIN_DATABASE_URL`);
- compute RPO as the restore point versus the last committed write or backup interval;
- compute PASS against the targets (RPO ≤ 1 h, RTO ≤ 4 h);
- write backups outside the repo;
- append, rather than overwrite, the evidence file.

Then execute it on staging, and exercise the deploy path (5.2) from a CMS publish.

### Task 10.2-3 — Accessibility AT walkthrough

Run an NVDA (EN) and VoiceOver/Narrator (AR) pass over home, catalogue, PDP, RFQ, KYC wizard and CMS. Log it in `docs/uat/<execution-month>/at-walkthrough.md`; there must be no blocking issues. The criterion is URD ACC / PRD NFR-6 — the PRD's accessibility NFR, not audit finding NFR-6.

## Milestone 10.3 — External verification

### Task 10.3-1 — Commission the pen test (P10-2)

Commission a focused auth + KYC + CMS test that covers every Phase 2/3/7.3 surface. Track its findings through the board. Anything found joins this roadmap's discipline: ID, evidence, task, acceptance.

### Task 10.3-2 — RTM re-run (P10-3)

Trace the top ~25 critical requirements (RFQ, KYC lifecycle, e-invoicing, RBAC, localization, SEO, accessibility) to engine, persisted API and UI against `Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md` v3.0 (as amended in 6.1-1). Update `Codebase/RTM.md` with evidence links.

## Milestone 10.4 — Close the register & sign the gate

### Task 10.4-1 — Zero-open board proof

Regenerate the board with the 1.3-1 tooling (status overlay + `evidence_ref`). **Every row must be closed**, including F-2026-N01…N17, P10-1…P10-4 and the §14.2 live defects, each linked to its evidence file.

### Task 10.4-2 — Readiness pack

Produce `audit_report_2/NEXT_AUDIT_READINESS.md`: one page with the gates output, test counts, evidence index, any accepted risks (e.g. simulated SMTP) and the sign-off block. `audit_report_2/` is outside the Codebase git repo, so also commit a copy to `Codebase/docs/NEXT_AUDIT_READINESS.md`.

### Task 10.4-3 — Steering sign-off

**Done-when (the roadmap's terminal state):**
- no open Critical/High/Medium findings;
- CI green on the platform;
- clean-DB bring-up, deploy and DR proven;
- monitoring alerting;
- batch jobs running — SLA escalation (7.2-2) and expiry reminders (7.2-3), each proven firing;
- sign-off recorded by **named individuals with dates**. GOV-1's caveat: the baseline's role-title sign-offs are not human sign-offs.
- The next independent auditor re-runs Report 2's entire probe set and finds every check green, with no new Critical/High/Medium finding.

**That is the definition of a clean audit.**

---
## 11. Effort summary & sequencing

| Phase | Cal. days | Findings closed |
|---|---|---|
| 1 Stabilize & VCS | 1–4 | N01(C), N03(H), N15, SEC-10, P0-1, P0-5; part of N14; L-10 |
| 2 Security blockers | 4–8 | N02(H), N04, N06, N08, N09, N14, SEC-6/7 residue; N07 config; L-04, L-06, L-07 |
| 3 XSS & CSP closure | 8–11 | N10, SEC-13 residue; L-08, L-09 |
| 4 CMS completion | 11–18 | CMS-2/3/4/5/7/8/9 residues, N05, N13, SEO-4 caveat; L-01, L-02, L-03, L-05 |
| 5 Publish & deploy | 18–21 | CMS-10 residue, CMS-5 purge |
| 6 Site truth | 21–25 | PUB-8, PUB-11/12, N11, N16, DAT-7 guard; L-14 |
| 7 Data & runtime | 25–30 | DAT-6/9, N17, SEC-11, P10-4 batch jobs; L-13 |
| 8 Apps & compliance | 30–34 | APP-3/7, SEO-2/5, N07 (live AV); L-11, L-12 |
| 9 Test/CI/observability | 34–38 | NFR-1/3/4/6, N12, P0-3 wiring, A11Y residues |
| 10 Clean-audit gate | 38–42 | P10 discharge, NFR-2 staging, A11Y AT pass, GOV-1 human sign-off |

- **Single engineer:** about 6 weeks. v1.1 said 5; the v1.2 scope adds the scrub, CI repair, re-encryption, the inline-script elimination, the live-defect fixes and the dual-approval redesign.
- **Two engineers:** about 4 weeks, splitting at the Phase 4 / 5–6 boundary. Phases 4, 5 and 6 can overlap once Phase 3 has landed.
- Phase 1 must start on day one.
- These are planning estimates, not measurements. Re-baseline after Phase 1, once the real build duration (1.1-1) and the CI repair effort (1.2-3) are known.

## 12. Coverage matrix — every open item → task

| Open item (Report 2 / v1.2) | Closed by |
|---|---|
| F-2026-N01 SSG pipeline dead (C) | 1.1-1…1.1-4 |
| F-2026-N02 CSRF bypass (H) | 2.1-1…2.1-3 |
| F-2026-N03 uncommitted work (H) | 1.2-0…1.2-4 |
| F-2026-N04 TRN/email leak | 2.2-1/2.2-2 |
| F-2026-N05 media in webroot | 4.4-1…4.4-3 |
| F-2026-N06 doc-encryption key | 2.4-1 + 2.4-3 (+ 8.1-3 drill) |
| F-2026-N07 ClamAV dormant | 2.4-1 (config) + 8.1-1 (live, clamd-proven) |
| F-2026-N08 bounce spoof | 2.3-1 |
| F-2026-N09 observability/sign gates | 2.3-2 |
| F-2026-N10 XSS residues | 3.1-1/3.1-2/3.2-1/3.2-2 |
| F-2026-N11 test articles published | 6.3-1 |
| F-2026-N12 stale SSG test | 9.2-1 |
| F-2026-N13 profile chip | 4.3-4 |
| F-2026-N14 committed credentials | 1.2-0 (untracked files, before first commit) + 2.4-2 (history, `[REDACTED-ROTATED-2026-10]`) + 7.1-1 (rotation) |
| F-2026-N15 board/claims stale | 1.3-1/1.3-2 |
| F-2026-N16 hero bg unused | 6.3-2 |
| F-2026-N17 SLA rounding/escalation | 7.2-2 |
| SEC-6 partial (TRN) | 2.2-1/2.2-2 |
| SEC-7 partial (token verify + client wiring + secret) | 2.1-1…2.1-3 |
| SEC-10 partial (regression) | 1.1-1…1.1-3 |
| SEC-11 partial (dual approval; server-derived change set; legal/marketing) | 7.3-1…7.3-4 |
| SEC-13 partial (sinks/CSP) | 3.1–3.3 |
| DAT-6 partial (CI wiring) | 7.2-1 |
| DAT-9 partial (role/scram) | 7.1-1…7.1-3 |
| CMS-2 partial (chrome/SEO/stats/awards/AR/categories editors) | 4.1, 4.2, 4.5-1…4.5-4 |
| CMS-3 partial (decoy) | 4.3-2 |
| CMS-4 partial (stock boolean) | 4.3-1 |
| CMS-5 residue (purge ignored server-side) | 5.1-2 |
| CMS-7 partial (`custom` entity; IT-solution payload) | 4.3-3 |
| CMS-8 partial (fallbacks/chip) | 4.3-4 |
| CMS-9 partial (media hardening) | 4.4-1…4.4-3 |
| CMS-10 partial (KPI/purge/deploy) | 5.1–5.3 |
| PUB-8 NOT-FIXED (facts) | 6.1-1…6.1-3 (+ 4.2-1/4.2-2) |
| PUB-11 partial (ROI inputs) | 6.2-1 |
| PUB-12 partial (anchors) | 6.2-2 |
| APP-3 partial (AV/key/URL drills) | 2.4-1, 2.4-3, 8.1-1…8.1-3 |
| APP-7 partial (UAT pack) | 8.2-1…8.2-3 |
| SEO-2 partial (lastmod) | 8.3-1/8.3-2 |
| SEO-4 caveat (AR marketing copy hardcoded) | 4.5-4 |
| SEO-5 partial (GA4) | 8.4-1…8.4-3 |
| NFR-1 partial (Lighthouse) | 9.1-2/9.1-3 |
| NFR-3 partial (sink/uptime) | 9.3-1…9.3-3 |
| NFR-4 partial (edge proof) | 9.4-1…9.4-3 |
| NFR-6 partial (= P0-3 wiring) | 1.2-3, 9.1-1, 9.1-3 |
| P0-1 partial (remote/protect/CI-run) | 1.2-0…1.2-4 |
| P0-3 partial (gates in ci.yml) | 1.2-3, 9.1-1 |
| P0-5 partial (board) | 1.3-1 |
| P10-1 (re-verification) | 10.1-1…10.1-3 |
| P10-2 (pen test) | 10.3-1 |
| P10-3 (RTM re-run) | 10.3-2 |
| P10-4 (go/no-go incl. batch jobs) | 7.2-2, 7.2-3, 10.4-1…10.4-3 |
| DAT-7 recurrence guard | 6.3-1 |
| A11Y residuals (cms.html axe, 2.5.8, AT pass) | 9.2-3, 10.2-3 |
| NFR-2 scope caveat (staging drill) | 10.2-2 |
| GOV-1 caveats (ADR numbering, role-title sign-offs) | 1.3-2, 10.4-3 |
| Live defects L-01…L-14 (§14.2) | 4.4-2, 4.5-1, 4.4-2, 2.4-3, 4.3-3, 2.2-1, 2.1-1, 3.1-1, 3.1-1/3.1-2, 1.1-3, 8.1-2, 8.1-1, 7.2-1, 6.3-1 (in order) |

**Coverage check:** every item below maps to at least one task above, and no open item from `FINDINGS_MATRIX.csv` is unassigned.
- 24 PARTIAL + 1 NOT-FIXED + 17 NEW findings
- 7 programme items: P0-1, P0-3, P0-5, P10-1…P10-4
- 5 FIXED-with-residue caveats: CMS-5, SEO-4, NFR-2, GOV-1, DAT-7
- 9 v1.1 re-inspection defects (§13)
- 14 v1.2 live defects (§14.2)

---

## 13. Re-inspection log (v1.1) — with v1.2 verdicts

v1.1's nine re-inspection fixes were re-verified. Five were themselves defective.

| # | Defect found in v1.0 | v1.1 fix | v1.2 verdict (ledger ref) |
|---|---|---|---|
| R-1 | The Unix spawn branch would run `npm` as a JS script | explicit platform branch | Unix half valid. The Windows half was broken: the npm-cli.js paths don't exist (V-06). Replaced by an Astro-CLI resolver. |
| R-2 | The build reaches PG only via the hardcoded `db.ts` fallback | `simal_build` + `BUILD_DATABASE_URL` | Finding valid, but the line ref was wrong (line 8, V-11), the SQL non-idempotent with no `FOR ROLE` (V-10), and the env still a denylist (V-09). Corrected in 1.1-2. |
| R-3 | "CSRF enforcement would break the whole CMS" | client token store in `api.js` | Rationale false for the 2.1-1 design (V-33). The fix threw a TypeError (V-36) and asked for a `/api/auth/me` change that already existed (V-37). Re-scoped as policy B in 2.1-3. |
| R-4 | `hmacSign` arity | secret-first call | Arity correct, but the handler read the body from the router's `noop` and called a non-existent service (V-42). Rewritten with a raw-body HMAC (2.3-1). |
| R-5 | `config.root` not in scope in `cms.service.js` | cwd-based `getMediaDir` | Premise partly true, but `config.dataDir` is the anchored path (V-92), and the new route omitted `cmsAuth` (V-90). |
| R-6 | `fs.cpSync` nests into an existing dest | `rmSync` + `cpSync` | Premise false: `cpSync` merges (V-112). The fix introduced an unguarded recursive delete (V-111). Replaced by a guarded staging swap (5.2-1). |
| R-7 | Arabic content is un-editable; no category editor | Milestone 4.5 | Mostly valid. PUT already honours `lang` (V-102), and the inspection missed the AR-policy overwrite defect (V-103 / L-02). |
| R-8 | `legal_policies`/`announcements` not sensitive-classified | widen `isSensitiveEntity` | Evidence valid, but the fix was ineffective: classification runs on caller-declared entities, and the UI always sends `site/all` (V-153, V-160). Redesigned in 7.3. |
| R-9 | Dev TOTP secret; JSON-store Peppol endpoints | 2.4-1 item 6, 2.4-2 bullet | Valid. The TOTP command threw (V-46), and `db.json` is git-ignored rather than committed (V-53). |

---

## 14. v1.2 forensic verification — summary

### 14.1 Defects found in v1.1

The full row-level ledger, with evidence, is in **`ROADMAP_V1.2_VERIFICATION_LEDGER.md`** (same folder). Counts:

| Phase | Blocker | Error | Gap | Minor | Total |
|---|---|---|---|---|---|
| General / how-to | 0 | 3 | 0 | 2 | 5 |
| 1 | 8 | 10 | 7 | 2 | 27 |
| 2 | 9 | 7 | 6 | 0 | 22 |
| 3 | 3 | 5 | 6 | 1 | 15 |
| 4 | 7 | 12 | 11 | 6 | 36 |
| 5 | 3 | 5 | 4 | 1 | 13 |
| 6 | 6 | 6 | 7 | 0 | 19 |
| 7 | 5 | 8 | 10 | 1 | 24 |
| 8 | 3 | 7 | 5 | 5 | 20 |
| 9 | 3 | 9 | 2 | 1 | 15 |
| 10 | 1 | 2 | 2 | 2 | 7 |
| §11–13 / tracker / evidence | 0 | 2 | 1 | 3 | 6 |
| **Total** | **48** | **76** | **61** | **24** | **209** |

**The blockers that mattered most** — each would have failed silently or caused harm if executed as written:
1. **Secrets and PII into git history.** 1.2-1 would have committed untracked credential files, 8 PII database dumps and 38 KYC documents, and 1.2-2 would have pushed them, all before Phase 2 scrubbed anything (V-19, V-20).
2. **Unreadable documents.** 2.4-1 would have changed the document key with no re-encryption, making every stored KYC document unreadable (V-45).
3. **The pipeline fix could never run.** 1.1-1 resolved npm from paths that don't exist, and 1.1-3 referenced an out-of-scope variable (V-06, V-12).
4. **Super-admin lockout.** 2.3-2 gated routes on a `manage_users` permission that doesn't exist (V-44).
5. **Dual approval stayed bypassable.** Phase 7.3 classified caller-declared entities, and the UI always sends `site/all` (V-153).
6. **Site-wide breakage.** Phase 3 would have removed `'unsafe-inline'` before eliminating 357 inline scripts (V-66), and 4.1-1's SQL had a syntax error that fails every page build (V-70).
7. **N17 left open.** The 7.2-2 SLA fix still floored, so a 1.6 bd breach would not flag (V-148).
8. **Build failure from missing columns.** The 8.3-1 sitemap query selected columns that don't exist (V-173).
9. **A drill that proves nothing.** The 8.1-1 EICAR drill passes without clamd running (V-162).

### 14.2 Live code defects found during verification (not in any prior audit document)

| ID | Defect | Task |
|---|---|---|
| L-01 | CMS media upload broken today (`dataBase64` vs `base64` → 400) | 4.4-2 |
| L-02 | Saving a legal policy overwrites its Arabic twin (latent; slug-only UPDATE) | 4.5-1 |
| L-03 | Media "site copy" path resolves to `Codebase\site\…` | 4.4-2 |
| L-04 | Encrypted KYC documents unreachable from the running portal (cwd-relative `UPLOADS_DIR`); 603 orphan `documents` rows | 2.4-3 |
| L-05 | Quick-created IT solutions publish with no description or categories | 4.3-3 |
| L-06 | KYC master export and queue list expose TRN (the list to viewers too) | 2.2-1 |
| L-07 | CSRF tokens keyed by a committed literal | 2.1-1 |
| L-08 | "Sanitised" announcement CTA bypassable via control characters | 3.1-1 |
| L-09 | Unescaped DB-fed sinks (AR mini-cart, AR RFQ, recently-viewed, hero image, insight CTA, product docs) | 3.1-1/3.1-2 |
| L-10 | SSG job claim non-atomic; unhandled rejections in the build callback | 1.1-3 |
| L-11 | Signed-URL single-use not atomic | 8.1-2 |
| L-12 | Virus scanner fails open | 8.1-1 |
| L-13 | Fresh migrate+seed leaves `testimonials_id_seq` behind `max(id)` | 7.2-1 |
| L-14 | Gate fixture overwrote live `site/amc-tiers`; probe rows (`emergency-banner`, `pricing-tiers`) live | 6.3-1 |

### 14.3 Structural changes v1.1 → v1.2

- **New tasks (6):**
  - 1.2-0 pre-commit hygiene
  - 1.2-4 first green platform run
  - 2.4-3 document re-encryption and relocation
  - 4.5-4 AR marketing copy from the DB
  - 7.2-3 expiry-reminder job
  - 8.1-3 key-rotation drill
- **Tasks re-ordered** (IDs follow execution order): 3.3-1 ↔ 3.3-2 (eliminate inline scripts *before* tightening the CSP), and 7.3-3 ↔ 7.3-4 (classify before testing; the old 7.3-3 had no body).
- **Phase 1 execution order:** scrub → snapshot → pipeline fix → push.
- **Phase 4 exit gate** moved after Milestone 4.5.
- **Day ranges:** 36 → 42 days.
- **Tasks:** 98 → 104. **Milestones:** 36 (unchanged).
- `ROADMAP_TASK_TRACKER.csv` regenerated 1:1 from this document.

---

*Standards carried from `REMEDIATION_RESEARCH_NOTES.md` (verified 2026-10-12): OWASP ASVS 5.0.0 L2 · NIST SP 800-63B-4 · OWASP CSRF/File-Upload/Authorization cheat sheets · Node child-process guidance (CVE-2024-27980 spawn semantics) · Peppol PINT AE 1.0.4 · WCAG 2.2 AA (axe-core 4.14 `target-size` for SC 2.5.8) · Google sitemap/hreflang/consent-mode/tag-CSP guidance · PostgreSQL 16 scram-sha-256.*

*Every path, line reference and snippet in v1.2 was checked against the working tree and the live rig on 16 Oct 2026. Line numbers will drift as earlier phases land, so locate code by the quoted symbol or text first and treat the line number as a hint.*
