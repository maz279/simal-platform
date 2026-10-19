# Simal Platform — Implementation Roadmap to a Clean Audit (v1.1)

**Document ID:** SIMAL-RM-CLEAN-1.1 · **Prepared:** 16 October 2026 · **v1.1 (same day):** deeper re-inspection pass — 9 snippet/coverage defects found and fixed (§13 Re-inspection log); tasks 92 → 98, milestones 35 → 36.
**Basis:** `AUDIT_REPORT_2.md` + `FINDINGS_MATRIX.csv` (Independent Forensic Re-Audit, 15–16 Oct 2026, including Iteration-2 live proofs)
**Objective:** close **every** open item — 24 PARTIAL findings, 1 NOT-FIXED finding, 17 new findings (F-2026-N01…N17), and the outstanding P0/P10 acceptance gaps — so the next independent audit returns **zero open Critical/High/Medium** findings.
**Audience:** full-stack engineer (Node 22+/24, Astro 5, PostgreSQL 16, vanilla JS portal). Every task names exact files, ships a code snippet grounded in the current tree, and ends with a **Done-when** verification you must run and capture.

---

## How to use this roadmap

- **10 sequential phases.** Do not start a phase before the previous phase's milestones are green — the ordering is dependency-driven (e.g. the CSRF fix must land before the pen test; the VCS work must land before everything else so history is preserved).
- **Every task ID is `RM-<phase>-<milestone>-<task>`** and states which finding(s) it closes. The coverage matrix in §12 proves nothing is dropped.
- **Golden rules (carried from the remediation plan, still binding):**
  1. Evidence in, evidence out — a task is done only when its **Done-when** command passes and the output is captured in `Codebase/scratch/rm-evidence/`.
  2. One logical change = one commit, message prefix `rm(<task-id>)`.
  3. After every phase: run `node scripts/ci/run-gates.mjs` (all gates must stay green) and `cd apps/portal && node --test test/unit/*.test.js test/integration/api.test.js test/integration/workspace.test.js`.
  4. Update `Codebase/remediation-board.csv` statuses at each phase boundary (see RM-1-3-1).
- **Portals of the rig:** portal API `http://127.0.0.1:8090`, site edge `http://127.0.0.1:8100`, PG `127.0.0.1:5433` db `simal`. Portal dir below = `Codebase/apps/portal`; site dir = `Codebase/apps/site`.
- **Evidence folder:** create `Codebase/scratch/rm-evidence/` now; every Done-when output goes there as `<task-id>.log` or `.png`.

```mermaid
flowchart LR
    P1[P1 Stabilize & VCS] --> P2[P2 Security blockers]
    P2 --> P3[P3 XSS closure]
    P3 --> P4[P4 CMS completion]
    P4 --> P5[P5 Publish & deploy truth]
    P5 --> P6[P6 Site truth & consistency]
    P6 --> P7[P7 Data & runtime posture]
    P7 --> P8[P8 Apps & compliance]
    P8 --> P9[P9 Test/CI/observability]
    P9 --> P10[P10 Clean-audit gate]
```

---

# PHASE 1 — Emergency Stabilization & Version Control *(Days 1–3)*

> Goal: the platform's core promise (CMS → site) works again, and the asset is protected by real VCS. Nothing else matters until this lands. Closes **F-2026-N01 (Critical), F-2026-N03 (High), F-2026-N15 (Low)**.

## Milestone 1.1 — Repair the SSG publish pipeline (closes F-2026-N01, restores SEC-10 acceptance)

### Task 1.1-1 — Replace the `.cmd` spawn with a direct `node` invocation

**File:** `Codebase/apps/portal/src/server.js` (SSG loop, currently lines 147–208).
**Why:** `execFile('npm.cmd', …)` throws `spawn EINVAL` synchronously on Node ≥ 20.12/22/24 on Windows (CVE-2024-27980 fix forbids spawning `.cmd`/`.bat` without a shell). The running portal uses Node v24.21.0 — every build has failed since 14 Oct 02:42 and 13 outbox jobs are jammed `queued`.

Locate this block (≈ line 159–181):

```js
const { execFile } = await import('node:child_process');
const fs = await import('node:fs');
const siteDir = process.env.SITE_DIR || path.resolve(config.root, '../site');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
```

Replace with a shell-free npm resolution (npm workspaces hoist `node_modules` to the repo root, so try the site-local path first, then the monorepo root):

```js
const { execFile } = await import('node:child_process');
const fs = await import('node:fs');
const siteDir = process.env.SITE_DIR || path.resolve(config.root, '../site');
// SEC-10/P8-1 + F-2026-N01: never spawn npm.cmd/.bat (EINVAL on Node>=20.12, CVE-2024-27980).
// Windows: drive npm's CLI entrypoint with the current node executable — no shell at all.
// Unix: plain 'npm' is a symlink to a script, spawnable directly without a shell.
let spawnCmd, spawnArgs;
if (process.platform === 'win32') {
  const npmCli = [
    path.join(siteDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.resolve(siteDir, '..', '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // monorepo root (workspaces)
  ].find(p => fs.existsSync(p));
  if (!npmCli) throw new Error('npm-cli.js not found for SSG build (looked in ' + siteDir + ' and monorepo root)');
  spawnCmd = process.execPath; spawnArgs = [npmCli, 'run', 'build'];
} else {
  spawnCmd = 'npm'; spawnArgs = ['run', 'build'];
}
```

And change the spawn call to `execFile(spawnCmd, spawnArgs, { …same options… }, async (err) => { /* unchanged callback */ });`.

### Task 1.1-2 — Give the build its own read-only DB credential (latent break found in re-inspection)

**Files:** `Codebase/apps/portal/src/server.js` (sanitizedEnv block) + `Codebase/apps/site/src/lib/db.ts:9-12` + `scripts/prod-db-roles.sql`.

**The defect:** the SSG build renders from PostgreSQL, but the worker's sanitized env **strips `DATABASE_URL`** — the build only connects today because `db.ts` falls back to a **hardcoded dev credential** (`postgres://simal:[REDACTED-ROTATED-2026-10]@127.0.0.1:5433/simal`). That fallback (a) ships a credential in site source and (b) breaks the moment Phase 7.1 switches `pg_hba` off `trust` and/or the `simal` password changes.

1. Create a read-only build role (append to `scripts/prod-db-roles.sql` and run it):

```sql
CREATE ROLE simal_build LOGIN NOSUPERUSER PASSWORD :'build_password';
GRANT CONNECT ON DATABASE simal TO simal_build;
GRANT USAGE ON SCHEMA public TO simal_build;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO simal_build;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO simal_build;
```

2. In the portal `.env`: `BUILD_DATABASE_URL=postgres://simal_build:<password>@127.0.0.1:5433/simal`. In the ssgLoop, after the secret-stripping loop, inject exactly this one credential into the child env:

```js
// The SSG build needs DB READ access; give it the dedicated read-only role —
// never the portal's privileged DATABASE_URL.
if (process.env.BUILD_DATABASE_URL) sanitizedEnv.DATABASE_URL = process.env.BUILD_DATABASE_URL;
```

3. Remove the hardcoded fallback in `apps/site/src/lib/db.ts` — fail loudly instead:

```ts
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the SSG build (read-only build role)');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 15, idleTimeoutMillis: 30000 });
```

**Done-when:** with `BUILD_DATABASE_URL` unset the build fails with the explicit error (no silent fallback); with it set, the control-loop probe passes; `git grep "[REDACTED-ROTATED-2026-10]" apps/site` returns nothing; the child env (temporarily log its keys) contains no portal secrets other than the RO role.

### Task 1.1-3 — A spawn failure must mark the job `failed`, never jam the queue

**File:** same block. The `execFile` call can throw **synchronously** (as EINVAL did) — that path currently escapes to the outer `catch`, logs `ssg_loop_failed`, and leaves the job `queued` forever, retrying every 10 s.

Wrap the spawn and mark failure explicitly:

```js
try {
  execFile(process.execPath, [npmCli, 'run', 'build'], { /* options */ }, async (err) => {
    /* existing success/failure callback — keep as-is */
  });
} catch (spawnErr) {
  // Synchronous spawn failure (e.g. EINVAL/ENOENT): count it as a failed build,
  // never leave the job queued (F-2026-N01 queue-jam root cause #2).
  ssgBuilding = false;
  const errorMsg = 'spawn failed: ' + String(spawnErr?.message);
  log.error('ssg_build_failed', { outboxId: job.id, error: errorMsg });
  await repos.client.query(
    "UPDATE outbox SET status = 'failed', meta = $1 WHERE id = $2",
    [JSON.stringify({ error: errorMsg }), job.id]
  );
}
```

### Task 1.1-4 — Drain the jammed queue and prove the loop end-to-end

1. Restart the portal: `cd Codebase && cmd /c scripts\supervisor.cmd` (it restarts portal on 8090).
2. The worker now picks the oldest queued job every 10 s and must process all 13. Watch it: `tail -f apps/portal/server.log | grep -E "ssg_build_(started|completed|failed)"`.
3. Old `failed` jobs (14, from 11–13 Oct): retry them from the CMS (`#/publish-pipeline` → per-row Retry if present) or reset the harmless ones:
   `psql -h 127.0.0.1 -p 5433 -U simal -d simal -c "UPDATE outbox SET status='queued' WHERE to_addr='ssg-builder' AND status='failed' AND created_at < 1791900000000;"` (only the pre-remediation ones).
4. Re-run the audit control-loop probe (archived): `node "Audit/Independent_Forensic_Audit_2026-10-12/audit_report_2/evidence/cms_control_loop_and_spawn_einval.txt"`'s generator script — or minimal version: PUT a marker into announcement 1, `POST /api/cms/publish`, wait ≤ 30 s, `curl -s http://127.0.0.1:8100/ | grep <MARKER>` must match; then restore the text and publish again.

**Done-when (all four):**
- `psql … -c "SELECT status,count(*) FROM outbox WHERE to_addr='ssg-builder' GROUP BY 1;"` → `queued = 0`;
- the control-loop marker appears on `http://127.0.0.1:8100/` within 30 s of publish and is then restored;
- a deliberately broken build (temporarily rename `apps/site/package.json`) marks exactly one job `failed` and the NEXT job still processes (queue not jammed);
- `server.log` shows `ssg_build_completed` entries dated today. Save all outputs to `rm-evidence/1.1-4.*`.

## Milestone 1.2 — Commit the remediation and protect the repository (closes F-2026-N03, P0-1 residue)

### Task 1.2-1 — Snapshot the working tree in logical commits

`git -C Codebase status -s` currently shows 73 modified + 31 untracked files (all of Phases 1–9). Commit them in reviewable slices, e.g.:

```bash
cd C:/software_project/Simal_Corporate_website/Codebase
git add apps/portal/src/services/auth.service.js apps/portal/src/lib/ apps/portal/src/config.js
git commit -m "rm(1.2-1a): P1/P8 security fixes (auth, csrf layer, http hardening, config)"
git add apps/portal/src/services/ apps/portal/src/store/ apps/portal/src/server.js
git commit -m "rm(1.2-1b): P2/P4/P5 services — attribution, rollback, cms, einvoice, ssg loop"
git add apps/portal/public/
git commit -m "rm(1.2-1c): CMS console + portal UI (P4 completeness, a11y, inert modals)"
git add apps/site/
git commit -m "rm(1.2-1d): public site (P3/P6/P7 — links, a11y, /ar tree, SEO, consent)"
git add scripts/ infra/ docs/ .github/ package.json eslint.config.mjs
git commit -m "rm(1.2-1e): gates, nginx topology, governance docs, CI workflow"
git status -s   # must be empty afterwards
```

**Guard before committing:** confirm no secret files are tracked — `git ls-files | grep -iE "\.env$|\.pem$|secrets"` must return nothing (`.env` is already ignored; this verifies).

### Task 1.2-2 — Create the remote, push, protect `main`

```bash
git init --bare is NOT needed — create a private repo on the company Git host (GitHub/GitLab/Azure DevOps), then:
git remote add origin <URL>
git push -u origin main
```

Then on the host UI: protect `main` (no direct pushes, ≥1 approval), require the `ci` workflow to pass on PRs. If GitHub: Settings → Branches → Add rule `main`, tick *Require pull request before merging* + *Require status checks* → select `lint`, `unit`, `integration`, `parity`, `build`.

### Task 1.2-3 — Make CI actually execute

The workflow `.github/workflows/ci.yml` has never run (no remote until now). After 1.2-2, open any PR (or `git commit --allow-empty -m "rm(1.2-3): trigger first CI run" && git push`) and confirm all jobs execute on the platform.
**Done-when:** a green CI run URL exists; save it to `rm-evidence/1.2-3.txt`.

## Milestone 1.3 — Honest tracking surface (closes F-2026-N15)

### Task 1.3-1 — Regenerate the remediation board to match reality

`Codebase/scripts/ci/generate-remediation-board.mjs` exists. Update `Codebase/remediation-board.csv` so every row whose acceptance now passes is `closed`, and **add the 17 new findings** (`F-2026-N01…N17`) as rows mapped to this roadmap's task IDs (severity per Report 2 §7). Keep one row per finding; set `status=open` for anything this roadmap still owes.

### Task 1.3-2 — Correct the governance claim

`Codebase/docs/GOVERNANCE_REQUIREMENTS_BASELINE.md` §a44 says "7 automated CI gates passing cleanly". Replace with: *"7 automated gates green — first platform CI run evidenced at <URL from 1.2-3> (previously local-only)."* Also fix the phantom `ADR-14` reference → `ADR-009`.

**Phase 1 exit gate:** `node scripts/ci/run-gates.mjs` all green · control-loop probe passes · `git status -s` empty · remote protected · board regenerated.

---

# PHASE 2 — Security Blockers to Zero *(Days 3–6)*

> Closes **F-2026-N02 (High), F-2026-N04 (Medium), F-2026-N08/N09 (Medium), F-2026-N06/N07/N14 (Medium/Low)** and the SEC-6/SEC-7 partials. After this phase the P1 retest (P10-2 scope) must find nothing.

## Milestone 2.1 — Verify the CSRF synchronizer token for real (closes F-2026-N02 / SEC-7 residue)

### Task 2.1-1 — Wire `verifyCsrfToken` into the dispatch middleware

**File:** `Codebase/apps/portal/src/lib/http.js`, `dispatch()` CSRF block (≈ lines 130–165). Today both guards end with `&& !csrfToken` — presence alone bypasses them (live-proven: evil origin + `x-csrf-token: bogus` → 200).

The token is `HMAC(secret, sid + ':csrf')` and is issued at login (`routes.js:209-211`, header `X-CSRF-Token`). The middleware just needs the sid from the cookie:

```js
// at top of file, extend the existing import from './security.js'
import { SECURITY_HEADERS, verifyCsrfToken } from './security.js';
```

Inside `dispatch()`, before the state-changing block:

```js
const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
if (isStateChanging) {
  const secFetchSite = (req.headers['sec-fetch-site'] || '').toLowerCase();
  const origin = req.headers['origin'];
  const csrfToken = req.headers['x-csrf-token'];
  // F-2026-N02: a token header is only honored when it VERIFYIES against the session id.
  const sidMatch = /(?:^|;\s*)(?:__Host-)?kyc_sid=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  const csrfOk = Boolean(csrfToken && sidMatch && verifyCsrfToken(String(csrfToken), sidMatch[1]));

  if (secFetchSite === 'cross-site' && !csrfOk) {
    throw new HttpError(403, 'Cross-site request blocked: missing or invalid CSRF token');
  }
  if (origin) {
    // … existing allowed-hosts computation, unchanged …
    if (!isAllowed && !csrfOk) {
      throw new HttpError(403, 'Cross-origin request blocked: untrusted origin');
    }
  }
}
```

Two behavioural notes: (a) anonymous public forms (`/api/contact`, `/api/rfq`, register) never send a token — they are governed by the Origin/Sec-Fetch checks exactly as today; (b) staff UIs must already send the token — verify `cms.js`/`admin.js` attach `x-csrf-token` on every mutating call (grep `"x-csrf-token"`; add a central `API.post/put/del` helper that attaches `state.csrf` if any call site is missing it).

### Task 2.1-2 — Regression tests (both directions)

Add to `apps/portal/test/integration/api.test.js`:

```js
test('CSRF: bogus token cannot bypass cross-origin blocking (F-2026-N02)', async () => {
  const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }) });
  const cookie = (login.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');
  const csrf = (await login.json()).csrfToken;
  const opts = (tok) => ({ method: 'POST', headers: { cookie, origin: 'https://evil.example', ...(tok ? { 'x-csrf-token': tok } : {}) } });
  const noTok = await fetch(BASE + '/api/auth/logout', opts(null));
  const bogus = await fetch(BASE + '/api/auth/logout', opts('totally-bogus'));
  const valid = await fetch(BASE + '/api/auth/logout', opts(csrf)); // re-login first if this consumes the session
  assert.equal(noTok.status, 403);
  assert.equal(bogus.status, 403);
  assert.ok(valid.status < 400);
});
```

**Done-when:** the new test passes and the live proof flips: re-run `evidence/iteration2_live_proofs.mjs` §1 — case **B must now print 403**. Capture to `rm-evidence/2.1-2.log`.

### Task 2.1-3 — Client-side token wiring (re-inspection finding: the staff UI never sends it)

`grep csrf public/assets/js/*.js` returns nothing today — **no CMS/admin mutation attaches the token**, so the moment 2.1-1 enforces verification the whole console 403s. Wire it centrally in `public/assets/js/api.js` (`call()` at lines 9–26 is the single funnel for every page):

```js
  let CSRF = null;
  global.API.setCsrf = (t) => { CSRF = t; };

  async function call(method, path, body, opts = {}) {
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (CSRF && method !== 'GET') headers['x-csrf-token'] = CSRF;   // SEC-7: verified synchronizer token
    const res = await fetch(path, { method, credentials: 'same-origin', headers,
      body: body ? JSON.stringify(body) : undefined, keepalive: !!opts.keepalive });
    const rotated = res.headers.get('X-CSRF-Token');                 // server rotation (login/mfa/register)
    if (rotated) CSRF = rotated;
    /* …existing json/error handling unchanged… */
  }
```

Then: (a) every page bootstrap that logs in calls `API.setCsrf(d.csrfToken)` (`login.js`, `cms.js` bootstrap); (b) add `csrfToken: generateCsrfToken(session.sid)` to the `/api/auth/me` response (`routes.js:235-238`) so a page **reload** (session cookie, no login call) can seed the token: `API.me().then(d => d.csrfToken && API.setCsrf(d.csrfToken))`.

**Done-when:** with 2.1-1 live, the full CMS drive (login → edit announcement → publish → rollback) and the admin console (user create, force logout, settings save) all succeed in the browser; DevTools shows `x-csrf-token` on every mutating request. Screenshot to `rm-evidence/2.1-3.png`.

## Milestone 2.2 — Finish PII masking (closes F-2026-N04 / SEC-6 residue)

### Task 2.2-1 — Mask TRN, email, mobile and licence numbers in the report builder

**File:** `Codebase/apps/portal/src/services/admin.service.js`, `buildReport()` rows mapping (≈ lines 264–272). Current code masks only `banking.iban`. Replace the masking branch:

```js
selected.forEach(f => {
  let v = getVal(s, f);
  if (!canViewPii && v) {
    if (f === 'banking.iban') {
      v = String(v).slice(0, 7) + '••••' + String(v).slice(-4);           // AE86026••••0000
    } else if (f === 'tax.trn') {
      v = String(v).slice(0, 4) + '•••••' + String(v).slice(-3);          // 1001•••••090
    } else if (f === 'contacts.primary.email' || f === 'contacts.primary.mobile') {
      v = String(v).slice(0, 3) + '•••';                                   // buy•••
    } else if (f.startsWith('licences.')) {
      v = String(v).slice(0, 3) + '•••';
    }
  }
  row[f] = String(v ?? '');
});
```

`reportToCsv()` consumes `report.rows`, so CSV inherits the masking automatically — verify with a test.

### Task 2.2-2 — Regression test

```js
test('SEC-6: reviewer report masks IBAN, TRN, email, mobile (F-2026-N04)', async () => {
  const r = await fetch(BASE + '/api/admin/reports/build', { method: 'POST', headers: reviewerHeaders,
    body: JSON.stringify({ fields: ['banking.iban', 'tax.trn', 'contacts.primary.email', 'contacts.primary.mobile'] }) });
  const body = JSON.stringify(await r.json());
  assert.ok(!/AE\d{21}/.test(body), 'no raw IBAN');
  assert.ok(!/"tax\.trn":"\d{15}"/.test(body), 'no raw TRN');
  assert.ok(/•••/.test(body), 'masking present');
});
```

**Done-when:** reviewer report shows masked values only (live re-run of `evidence/live_probes.mjs` §G: `hasAE:false`, `trnLeak:false`); `view_pii` still sees full values. Save to `rm-evidence/2.2-2.log`.

## Milestone 2.3 — Tighten the privileged surface (closes F-2026-N08, F-2026-N09)

### Task 2.3-1 — Authenticate the email-bounce webhook

**File:** `Codebase/apps/portal/src/services/routes.js` (≈ line 921, `POST /api/integrations/email/bounce` — currently only rate-limited; anyone can forge audit rows). Require an HMAC signature (the repo already has `hmacSign` in `security.js` and signs webhooks elsewhere):

```js
r.post('/api/integrations/email/bounce', limited(publicLimiter), async (req, res, b) => {
  const sig = req.headers['x-webhook-signature'];
  // NOTE (verified signature): security.js exports hmacSign(secret, payload) — secret comes FIRST.
  const expected = hmacSign(config.webhookSigningSecret, JSON.stringify(b || {}));
  if (!sig || !timingSafeEqual(String(sig), expected)) {
    throw new HttpError(403, 'Invalid webhook signature');
  }
  await integration.recordBounce(b);   // existing behaviour
  ok(res, { recorded: true });
});
```

Document the signing secret in `.env.example` (`WEBHOOK_SIGNING_SECRET=change-me`), load it in `config.js` as `webhookSigningSecret`, and use it here. (Sender side signs with the same secret: `hmacSign(secret, JSON.stringify(payload))`.)

### Task 2.3-2 — Gate the observability and signing endpoints

Same file: `/api/admin/observability/errors` and `/api/admin/observability/test-error` (≈ 987–993) — add `requirePerm('view_pii')`; `/api/integrations/webhook/test-sign` (≈ 981) — restrict to super_admin:

```js
r.get('/api/admin/observability/errors', ...adminAuth, requirePerm('view_pii'), async (req, res) => { … });
r.post('/api/integrations/webhook/test-sign', ...adminAuth, requirePerm('manage_users'), async (req, res) => { … });
```

(`manage_users` is super_admin-only in `rules.js` — pick the permission that matches intent; the principle is: **viewer must get 403 on both**.)

**Done-when:** new integration test: viewer → 403 on all three routes; unsigned bounce POST → 403; signed bounce → 200 + audit row. Negative + positive proof captured.

## Milestone 2.4 — Secrets & environment hygiene (closes F-2026-N06, N07, N14 + `.env` drift)

### Task 2.4-1 — Real document-encryption key + ClamAV config in every environment file

1. Generate and set a real key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` → put in `apps/portal/.env` as `DOC_ENCRYPTION_KEY=<value>` (this removes the hardcoded fallback `'simal-document-encryption-key-2026'` at `src/store/pg-repos.js:21` from active use).
2. Harden the fallback so it can never silently engage in production:

```js
// pg-repos.js (and the JSON twin src/store/repos.js) — replace the fallback chain:
const DOC_KEY = process.env.DOC_ENCRYPTION_KEY
  || (process.env.NODE_ENV === 'production' ? null : process.env.SESSION_SECRET);
if (!DOC_KEY) throw new Error('DOC_ENCRYPTION_KEY is required (refusing to run with a default key)');
```

3. Enable ClamAV (the client already exists, `src/lib/virus-scanner.js:145-147` gates on env): in `.env` set `CLAMAV_HOST=127.0.0.1` / `CLAMAV_PORT=3310` for environments where clamd runs (see Task 8.1-1 for the drill). Add both keys to `.env.example` with empty values.
4. Fix `.env.example` drift: `ADMIN_PASSWORD_MIN=15` (it wrongly says 8), add `NODE_ENV=` with per-env guidance, add `DOC_ENCRYPTION_KEY=`, `CLAMAV_HOST=`, `CLAMAV_PORT=`, `WEBHOOK_SIGNING_SECRET=`.
5. Fix the admin address typo in `apps/portal/.env`: `ADMIN_EMAIL=admin@smartme.com` → `admin@simalme.com` (then log in once and confirm the account is created; the old `smartme` account can be deactivated from the CMS user manager).
6. Rotate the dev TOTP secret: `apps/portal/.env` currently carries the published RFC example secret doubled (`JBSW…`×2) — generate a fresh one (`node -e "console.log(require('crypto').randomBytes(20).toString('base32').replace(/=+$/,'')")`), re-enrol admin MFA, and set `ADMIN_MFA_REQUIRED=true` everywhere except throwaway test rigs (GOV-REQ-BASELINE a16: mandatory staff TOTP in production).

### Task 2.4-2 — Remove committed credentials (F-2026-N14)

- `Codebase/scripts/prod-db-roles.sql:21` — replace the literal `PASSWORD '[REDACTED-ROTATED-2026-10]'` with `PASSWORD :'app_password'` (psql variable) and document invocation `psql -v app_password=… -f prod-db-roles.sql`; rotate the exposed value.
- `Codebase/scripts/seed_arabic_content.mjs:5` — delete the `simal:[REDACTED-ROTATED-2026-10]` fallback connection string; fail loudly if `DATABASE_URL` is absent.
- Purge the legacy 15-digit Peppol endpoints from the JSON dev store `apps/portal/data/db.json` (rows are self-healed on read but never rewritten — one-off script: load, rewrite `simalPeppol`/`buyerPeppol` to 10-digit form, save).
- Grep-guard so this never recurs — add to `scripts/ci/check-no-placeholders.mjs` (or a tiny new gate): fail if any tracked file matches `(PASSWORD|SECRET|TOKEN)\s*[:=]\s*'[^']+%'`-style literals excluding test fixtures. Simple start:

```js
const OFFENDERS = (await exec('git grep -nE "PASSWORD 'Simal|simal:[REDACTED-ROTATED-2026-10]|ADMIN_TOTP_SECRET=[A-Z2-7]{16,}" -- "*.sql" "*.mjs" "*.js" "*.env*"')).stdout;
if (OFFENDERS.trim()) { console.error('secret literals found:\n' + OFFENDERS); process.exit(1); }
```

**Done-when:** `git grep -nE "[REDACTED-ROTATED-2026-10]|simal:[REDACTED-ROTATED-2026-10]"` returns nothing; `.env.example` validates; portal boots with `DOC_ENCRYPTION_KEY` set and refuses to boot without it (test by unsetting); the grep-guard runs in CI.

**Phase 2 exit gate:** all tests green · `run-gates.mjs` green · live iteration-2 proof §1 case B = 403 · reviewer report fully masked · no secret literals in git.

---

# PHASE 3 — Injection & XSS Closure *(Days 6–8)*

> Closes the **SEC-13 partial** and **F-2026-N10**. Every stored → `innerHTML` path must be sanitized or escaped, and the CSP tightened.

## Milestone 3.1 — Close the two public-site sinks

### Task 3.1-1 — Sanitize the hero slide CTA href server-side + escape at render

**File:** `Codebase/apps/site/src/pages/index.astro`. Two changes:

(a) In the frontmatter where `heroData` is built (≈ line 70–80), sanitize exactly like `BaseLayout.astro:51-56` does for the announcement:

```ts
const safeHref = (raw: string) => {
  const clean = String(raw || '').trim();
  if (/^(?:javascript|data|vbscript):/i.test(clean)) return '#';
  return clean.startsWith('/') || /^https?:\/\//i.test(clean) ? clean : '#';
};
// in the map:  href: safeHref(s.cta_href),
```

(b) In the client script that rebuilds the stage (≈ line 1388), escape the attribute:

```ts
<a class="btn btn-gold btn-lg" href="${esc(sl.href)}">${esc(sl.cta)} →</a>
```

### Task 3.1-2 — Escape the RFQ mini-cart rows

**File:** same script block, ≈ line 1564. The hero `esc` is scoped inside `if (stage) {…}` — hoist a shared helper to the top of the `<script>` and use it here:

```ts
// top of the script block (module scope):
const escHtml = (s: any) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
```

Then: `…>${escHtml(String(i.name || i.slug).slice(0, 44))}</span>…` and the same for `i.img` (attribute context).

**Done-when:** build the site (`cd apps/site && npm run build`), then: `node -e` probe that PUTs a slide with `cta_href="javascript:alert(1)"` via the CMS API, publishes, and greps `dist/index.html` — must contain `href="#"` (or the sanitized form) and **no** `javascript:` string; a product named `<img src=x onerror=alert(1)>` (set via product editor, then revert) must render as text in the mini-cart. Capture both.

## Milestone 3.2 — CMS-side hardening

### Task 3.2-1 — `esc()` single quote + audit remaining sinks

**File:** `Codebase/apps/portal/public/assets/js/cms.js` ≈ line 53:

```js
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');   // F-2026-N10: close the single-quote attribute breakout
}
```

Then sweep every `innerHTML =` in `cms.js` (`grep -n "innerHTML" cms.js`) and wrap each interpolated value in `esc(...)` unless it is provably builder-generated markup. Log the sweep list in the evidence file.

### Task 3.2-2 — Validate stored URLs at the API boundary

**File:** `Codebase/apps/portal/src/services/cms.service.js` — wherever `cta_href` / announcement `cta_href` / slide hrefs are persisted, add a shared guard:

```js
function assertSafePublicUrl(raw, field) {
  const v = String(raw || '').trim();
  if (v && !/^(?:\/|https?:\/\/|mailto:|tel:)/i.test(v)) {
    throw new HttpError(422, `${field} must be a relative path or http(s)/mailto/tel URL`);
  }
  return v;
}
```

Apply in `updateAnnouncement`, `saveSlide`, `updateBlock` (for blocks carrying `cta_href`-style keys) and Quick Create.

## Milestone 3.3 — Tighten the public CSP

### Task 3.3-1 — Remove `'unsafe-inline'` from `script-src` on the header path

**File:** `Codebase/infra/nginx/portal-staging.conf:25` — drop `'unsafe-inline'` from `script-src` (keep it only for `style-src` if the build needs it). The meta CSP in `BaseLayout.astro:315` is the floor; the header is authoritative on staging/prod.

### Task 3.3-2 — Eliminate inline-script dependencies in the build

Check the built output: `grep -rE "<script[^>]*>[^<]" apps/site/dist/_astro apps/site/dist/index.html | grep -v "application/json" | grep -v src=` — any island needing inline config must switch to the `<script type="application/json" id="…">` + reader pattern (JSON data is not executable and is CSP-exempt).

### Task 3.3-3 — Verify no regressions

**Done-when:** `curl -sI https://staging…/ | grep -i content-security-policy` shows no `unsafe-inline` in `script-src`; drive home + a product page + RFQ in the browser with the console open — zero CSP violation entries. Screenshots to `rm-evidence/3.3-3.png`.

**Phase 3 exit gate:** both stored-XSS probes render inert · CSP tightened · `run-gates.mjs` green (crawl+placeholders unaffected).

---

# PHASE 4 — CMS Console Completion *(Days 8–14)*

> Closes the **CMS-2/3/4/7/8/9 partials** — the largest block. Principle: *if the CMS cannot edit it, the site must not ship hardcoded marketing content for it.*

## Milestone 4.1 — Site chrome becomes CMS data

### Task 4.1-1 — Introduce `site/chrome` content blocks and make `BaseLayout` read them

**Design:** three new seeded blocks consumed by `BaseLayout.astro` (which today reads zero blocks for chrome — the audit's largest CMS-2 gap):

| Block | Payload shape | Replaces |
|---|---|---|
| `site/nav-menus` | `{ menus: [{ id:'home'|'products'|…, label, columns:[{heading, links:[{text,href}]}], footnote }] }` | hardcoded 8 mega-menus (`BaseLayout.astro:416-557`) |
| `site/footer` | `{ columns:[{heading, links:[…]}], badges:[{icon,text}], addresses:[{label, lines[]}] }` | hardcoded footer (≈ 590-642) |
| `site/newsletter` | `{ heading, blurb, buttonLabel, successMsg, errorMsg }` | static newsletter markup (≈ 888-916 stays wired to `/api/contact`) |

**Seed** (`scripts/seed.sql`, next to the existing `site/*` rows — copy the current hardcoded values verbatim so the first build is pixel-identical):

```sql
INSERT INTO content_blocks (entity, entity_id, lang, payload, updated_by)
VALUES ('site','nav-menus','en', $JSON${...}$JSON$ ... ) ON CONFLICT DO NOTHING;
```

(Use the same literal-JSON style as the neighbouring seeds; keep `updated_by='seed'`.)

**Consume** in `BaseLayout.astro` frontmatter (it already imports `db`):

```ts
const chrome = await db`SELECT payload FROM content_blocks WHERE entity='site' AND entity_id IN ('nav-menus','footer','newsletter') AND lang='en'}`;
const navMenus = chrome.find(r => r.entity_id === 'nav-menus')?.payload?.menus ?? DEFAULT_MENUS;   // keep current literals as DEFAULT_* fallbacks
```

Render from those objects; keep the existing ARIA structure (`role=region`, `aria-label`, EN/AR conditionals — reuse the `isArabic` flag and add `site/nav-menus-ar` seeding later via the same mechanism as the `/ar` tree).

### Task 4.1-2 — Editors for the new blocks

The generic blocks editor already handles object payloads (CMS-6 fixed). Add three friendly views to `cms.js`/`cms.html` following the existing `#/claims-register` pattern (list → JSON/Form Studio edit → save → revisions). Minimum viable: register routes `#/navigation`, `#/footer`, `#/newsletter` that open the block editor pre-targeted at the new ids — then extend each into a structured form (menu tree editor can stay JSON textarea in v1; the acceptance is *editor changes reach the site*).

**Done-when (milestone):** extend `scripts/ci/test-cms-e2e.mjs` with three cases — edit `site/nav-menus` label, `site/footer` column link, `site/newsletter` heading → publish → grep `dist/` for the markers. All three must reach the built site. (This also becomes the recurring CMS-2 regression gate.)

## Milestone 4.2 — SEO, stats and awards editors (closes remaining CMS-2 scope + feeds PUB-8)

### Task 4.2-1 — Seed the three blocks with ratified values

`site/seo-defaults` `{title, description, ogImage}`, `site/counters` `{"brands":22,"skus":78,"years":24}` (GOV-REQ-BASELINE a2/a3), `site/awards` `[{year,title,issuer}]` — seed into `scripts/seed.sql` next to the other `site/*` rows and into the live DB via the same idempotent pattern.

### Task 4.2-2 — Consume them in the site

`BaseLayout.astro`: default `<title>`/description/OG from `site/seo-defaults` when a page provides none; `index.astro` stats strip + `index`/`about` awards walls render `site/counters`/`site/awards` (replacing hardcoded numbers — full fact reconciliation lands in Task 6.1-2, this task builds the consumption path).

### Task 4.2-3 — CMS views + regression case

Register `#/seo-defaults`, `#/stats`, `#/awards` (structured forms following `#/claims-register`); extend `test-cms-e2e.mjs`: edit one counter + one award → publish → grep `dist/`.

**Done-when (milestone):** the e2e case passes; a non-technical editor changes the stats strip and awards from the CMS and sees it live after publish.

## Milestone 4.3 — Correctness residues (closes CMS-3, CMS-4, CMS-7, CMS-8 residues, F-2026-N13)

### Task 4.3-1 — Migrate `products.stock` to a real boolean (CMS-4)

```sql
-- scripts/migrate.sql: change the column DDL for fresh DBs
stock BOOLEAN NOT NULL DEFAULT true,
-- one-off migration for the existing rig (add to migrate.sql idempotent section):
ALTER TABLE products ALTER COLUMN stock TYPE BOOLEAN USING CASE WHEN stock IN ('true','t','1',true) THEN true ELSE false END;
```

Update writers: `cms.service.js` product save (≈ 366, 387) store `Boolean(patch.stock)`; remove the string-compat reads (`products/[slug].astro:20`, `products/index.astro:102`, `cms.js:2234/2366`) to `p.stock === true` / `!p.stock`. Keep a compat shim in `pg-repos.js rowToProduct` for one release if JSON-store fixtures still carry strings.

### Task 4.3-2 — Retire the `amc/tiers` decoy (CMS-3)

Delete the `('amc','tiers',…)` seed row from `scripts/seed.sql:369`; on the live DB: `DELETE FROM content_blocks WHERE entity='amc' AND entity_id='tiers';`. Remove the fallback in `cms.js:2052` so the AMC view resolves **only** `site/amc-tiers` (toast an error if missing).

### Task 4.3-3 — Quick Create 'Generic Content Block' writes a real entity (CMS-7 residue)

`cms.js:3447-3448`: route the `block` type to a chosen `(entity, entity_id)` pair via a small prompt (entity select limited to real, site-read entities: `site/custom-html` rendered by a new dedicated slot, or `insight`). If no consumer exists, **remove the option** from `cms.html:509` — never write `custom` again.

### Task 4.3-4 — Profile chip identity + fallback constants (F-2026-N13 + CMS-8 residue)

`cms.js:144` sets `state.me = userData.user`; the chip at ≈ 440 reads `state.me.user` (always `{}`). Fix: `var u = state.me || {};` and render `u.name/u.email/u.role`. Replace the three loc-audit fallback constants (`cms.js:3038-3040`) and the hardcoded `'7 Regulatory Policies'` (1957) / `'13 Staff Accounts'` (3084) chips with `state.policies.length` / `state.users.length`, and drop the asserted `'100% Shared'` row in favour of the measured AR-coverage query result.

### Task 4.3-5 — Remove the duplicate emergency-publish route

`routes.js` registers `POST /api/cms/emergency-publish` twice (≈ 774-777 and 850-854). Delete the second registration; add a comment pointing at the first.

## Milestone 4.4 — Media library hardening (closes CMS-9 residue, F-2026-N05)

### Task 4.4-1 — Move storage outside the webroot + authorized serving

**File:** `Codebase/apps/portal/src/services/cms.service.js` (getMediaDir ≈ 573-585) + `routes.js` (media routes ≈ 840-848).

```js
// cms.service.js — canonical store is the portal DATA dir (already outside public/).
// NOTE (verified): this module does NOT import config — mirror the existing cwd-based
// resolution style of the current getMediaDir (supervisor runs node from apps/portal):
function getMediaDir() {
  const dir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads', 'media');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
```

```js
// routes.js (behind cmsAuth) — authorized serving so previews never rely on public static:
r.get('/api/cms/media/file/:filename', async (req, res) => {
  const stream = await cms.serveMediaFile(req.params.filename);  // basename-containment inside getMediaDir()
  stream.pipe(res);
});
```

Implement both, and stop writing uploads into `apps/portal/public/`.

### Task 4.4-2 — Scan, restrict and label uploads

Wire `scanBuffer` before store; drop `.svg` from the allowlist; align the cap to **5 MB** on both server and the `cms.html:805` label; wire (or remove) the `#media-target-folder` selector; keep the site-asset copy into `apps/site/public/assets/img/products/` so images ship with the next build.

### Task 4.4-3 — Migrate existing files + verify

Move pre-existing uploads from the portal webroot into the data dir; then verify the Done-when set: `curl http://127.0.0.1:8090/assets/img/products/<new-upload>.jpg` → **404** (nothing new is publicly static); CMS grid previews via the authorized route only; EICAR-named upload rejected; `.svg` → 4xx. Evidence saved.

**Phase 4 exit gate:** cms-e2e gate now covers the new editors + stock boolean + AMC single-source; `run-gates.mjs` green; browser drive of `#/navigation`, `#/media-library` clean.

## Milestone 4.5 — Localization & taxonomy editing (closes the last CMS-2 residues found in re-inspection)

> Re-inspection proof of the gap: `GET/PUT /api/cms/blocks/:entity/:id` (`routes.js:702-710`) takes **no `lang` parameter**, and `cms.js`'s only `lang` use is *counting* AR blocks (line 835) — so the 12 `lang='ar'` content rows and 7 AR legal policies **cannot be edited from the CMS at all**, and there is no product-category editor anywhere (`grep categor cms.js` → one search placeholder).

### Task 4.5-1 — Lang-aware block routes + editor switcher

Extend the block routes to address the AR twins — `GET/PUT/DELETE /api/cms/blocks/:entity/:id?lang=ar` (default `en`, exact-match `lang` in every WHERE, mirroring the scoped rollback fix); in `cms.js` blocks/claims-register views add an EN/AR toggle that reloads with `?lang=ar` and badges rows with their language. `#/loc-audit` then links each under-covered AR row directly to its editor.

### Task 4.5-2 — Categories taxonomy editor

The catalogue taxonomy (`products.cat` + `cat_label` display map + the hardcoded guides fallback) gets a `#/categories` view: list distinct `cat` values with usage counts (`SELECT cat, count(*) FROM products GROUP BY 1`), rename/merge with a single guarded `UPDATE products SET cat=$1 WHERE cat=$2` (+ `cat_label` map in a `site/categories` block the catalogue reads), and create/retire entries. Follow the existing `#/brands-catalog` CRUD pattern with revisions.

### Task 4.5-3 — End-to-end proof

**Done-when (milestone):** extend `test-cms-e2e.mjs` with two cases — (a) edit an `lang='ar'` block (e.g. `ar` twin of a solutions block) → publish → marker appears in the built `/ar/` page; (b) rename a category label → publish → the catalogue page shows the new label and the old slug 301s or the filter updates. `#/loc-audit` AR coverage > 0 with rows editable. Evidence saved.

---

# PHASE 5 — Publish Pipeline & Deployment Truth *(Days 14–17)*

> Closes the **CMS-10 partial** (Last-Publish KPI, purge, deploy step) — "publish" must mean *the live site changed*.

## Milestone 5.1 — Honest publish telemetry

### Task 5.1-1 — Derive "Last Publish" from `ssg_build_completed`

The backend already exposes the correct value: `cms.service.js getPublishTelemetry().lastPublishTs` (from processed builds) at `GET /api/cms/telemetry/publish` (`routes.js:860-862`) — **but no frontend calls it**. In `cms.js` dashboard loader (≈ 840-841), replace the audit-log-derived KPI:

```js
const pubTel = await API.get('/api/cms/telemetry/publish').catch(() => null);
if (pubTel && pubTel.lastPublishTs) state.lastPublishTs = pubTel.lastPublishTs;   // real build completion
// fallback to audit-derived ONLY when telemetry is unavailable; label it "last publish requested"
```

Render the KPI from that; if the latest outbox job is `failed` or `queued`, show an amber/red badge ("last build FAILED @ …"), never "all published".

### Task 5.1-2 — Make purge real or remove the checkbox

`cms.service.js publish()` ignores `options.purgeAll`. Implement it: when `purgeAll` is true the build job's `purge` array is `['dist/']` (full rebuild invalidation — the worker already rebuilds fully; make the *audit + telemetry* reflect "full purge" vs "incremental entities") and the deploy step (5.2) invalidates the target. If a real distinction can't be delivered this phase, **delete the checkbox** (`cms.html:618-623`) — a control that does nothing is an audit finding.

## Milestone 5.2 — A real deploy step

### Task 5.2-1 — Implement the deploy hook

**File:** `Codebase/apps/portal/src/server.js` — in the ssg worker's success branch (after `ssg_build_completed`, ≈ line 194-200), add:

```js
// P4-6: publish must reach the hosting target, not just the local folder.
// Deterministic replace (rm + cp) — avoids fs.cpSync's "src INTO existing dest" nesting pitfall.
const deployDir = process.env.DEPLOY_DIR;
if (deployDir) {
  const src = path.join(siteDir, 'dist');
  fs.rmSync(deployDir, { recursive: true, force: true });
  fs.cpSync(src, deployDir, { recursive: true });
  log.info('ssg_deployed', { outboxId: job.id, target: deployDir });
  await repos.audit('system', 'ssg_deployed', job.id, 'dist deployed to ' + deployDir);
} else if (process.env.NODE_ENV === 'production') {
  log.error('ssg_deploy_missing', { outboxId: job.id, hint: 'DEPLOY_DIR not set' });
}
```

On Linux staging prefer `execFile('rsync', ['-a', '--delete', src + '/', deployDir + '/'])` when rsync exists; fall back to `cpSync`.

### Task 5.2-2 — Wire the environments

Set `DEPLOY_DIR` in `apps/portal/.env` (dev rig: the docroot `dev-edge` serves, i.e. keep `SITE_DIST=apps/site/dist` and use `DEPLOY_DIR` for the staging path) and in the staging host's env → `/var/www/simalme/dist` (the target `infra/nginx/portal-staging.conf` already serves). Add the key to `.env.example`.

### Task 5.2-3 — Prove it end-to-end

**Done-when:** publish → build → `ssg_deployed` audit row → file mtimes under the served root change → the control-loop marker is visible at the **served origin** within 60 s. Capture the timeline to `rm-evidence/5.2-3.log`.

## Milestone 5.3 — Pipeline console operability

### Task 5.3-1 — Retry route

`POST /api/cms/outbox/:id/retry` (cmsAuth) → `UPDATE outbox SET status='queued' WHERE id=$1 AND status='failed'` returning the row (404 when not in `failed`).

### Task 5.3-2 — Pipeline UI

In `cms.js` publish-pipeline renderer, add a **Retry** button on `failed` rows calling the route and refreshing the list; failed rows also feed the notification bell count.

### Task 5.3-3 — Failure/retry drill

**Done-when (milestone):** fail a build deliberately (temporarily rename `apps/site/package.json`), see the row red in the console, restore the file, click Retry, and watch the job process to `processed`. Transcript saved.

**Phase 5 exit gate:** control-loop end-to-end (edit → publish → build → **deploy** → visible at origin) passes twice consecutively; failed-build dashboard shows failure; retry works.

---

# PHASE 6 — Public-Site Truth & Consistency *(Days 17–20)*

> Closes **PUB-8 (the only NOT-FIXED finding), PUB-11/12 partials, F-2026-N11, F-2026-N16**.

## Milestone 6.1 — One source of truth per published fact (closes PUB-8)

### Task 6.1-1 — Ratify the values and seed the blocks

Legal/PM confirm the canonical awards list (issuer+title per award) and record it in `GOVERNANCE_REQUIREMENTS_BASELINE.md`; seed `site/counters` `{"brands":22,"skus":78,"years":24}` and `site/awards` (consumption path built in 4.2-2).

### Task 6.1-2 — Replace every hardcoded occurrence

Ground truth from the audit: `brands` table = **22** (19 carry SKUs), yet home says **21** (badge `index.astro:56`), **22** (DB line) and **23** (seeded hero slide `seed.sql:377`). Replace:
- `index.astro:56` badge → `{counters.brands} Global Leaders` (and AR twin);
- hero-slide seed copy "…23 global IT leaders…" → counter-driven or corrected text;
- `careers/index.astro:86`, `onboarding/index.astro:25`, `insights/index.astro:103`, `sitemap/index.astro:27` → read the counter;
- awards walls `index.astro:458-459` + `about/index.astro:101-102` → render `site/awards` (one identical list);
- years: derive from `counters.years`; fix the "20+/two decades" phrasings.

### Task 6.1-3 — CI guard against re-divergence

Extend `scripts/ci/check-no-placeholders.mjs`: parse `dist/index.html`; every `(\d{2})\s*(Global|global)\s*(Leaders|IT leaders|brands)` match must be ONE identical number equal to `SELECT count(*) FROM brands`.

**Done-when (milestone):** `grep -oE "[0-9]+ (Global Leaders|global IT leaders|brands)" dist/index.html | sort -u` → exactly `22`; awards identical home vs about; guard green in CI.

## Milestone 6.2 — ROI inputs & deep-link anchors (closes PUB-11/12 residues)

### Task 6.2-1 — Honor `r-ind`/`r-size` in the ROI calculator

`software/index.astro` `calc()` (≈ 295-318) reads `r-lic/r-users/r-it/r-man` only. Add industry/size factors:

```ts
const INDUSTRY_FACTOR: Record<string, number> = { retail: 1.0, logistics: 1.15, healthcare: 1.25, manufacturing: 1.2, default: 1.0 };
const SIZE_FACTOR = (emp: number) => emp > 500 ? 1.2 : emp > 100 ? 1.1 : 1.0;
const ind = INDUSTRY_FACTOR[(indSel.value || 'default') as string] ?? 1.0;
const size = SIZE_FACTOR(Number(sizeSel.value || 50));
// apply to the operational-savings line (document the model in a tooltip so numbers stay explainable)
ops = Math.round(users * 12 * it * 0.35 * ind * size);
```

(If Product would rather drop the two inputs, remove them — either closes the finding; do not leave ignored inputs.)

### Task 6.2-2 — Fix the 19 missing fragment targets

From the crawl gate output (`scripts/ci/link-crawl.mjs` prints them): add the missing `id` anchors — `#awards #csr #leadership #mission #why` to `ar/about/index.astro` (copy the EN ids), `#comparison` to the software page (or repoint the link to the existing section id). Re-run the crawl gate until it prints **0 missing anchors**.

## Milestone 6.3 — Dist hygiene & test-data isolation (closes F-2026-N11)

### Task 6.3-1 — Purge the published test articles and stop the recurrence

1. `psql … -c "DELETE FROM content_blocks WHERE entity='insight' AND entity_id LIKE 'p4-rollback-article-%';"` (also any `*_broadcast` test rows) — **after** confirming with `SELECT` that they match the test fixtures.
2. Rebuild (`cd apps/site && npm run build`) → `ls dist/insights | grep -c p4-rollback` must be 0 and `dist/sitemap.xml` clean.
3. Stop the recurrence: `scripts/ci/test-cms-e2e.mjs:18` defaults `DATABASE_URL` to the **main** DB. Change the default to a scratch database:

```js
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://simal:[REDACTED-ROTATED-2026-10]@127.0.0.1:5433/simal_ci_scratch';
```

(and have the script ensure/create that DB via the postgres admin URL, as `clean-db-build.mjs` does). Also add a gate assertion: build fails if `dist/insights/*` contains `p4-rollback-*`.

### Task 6.3-2 — Resolve `hero_slides.bg` (F-2026-N16)

Either render it — in the client stage builder use the slide's own bg when present: `const bg = sl.bg || BG[i % BG.length];` (line ≈ 1353) — or drop the column from the editor + DDL. Pick one; document in `ARCHITECTURE_STATE.md`.

**Phase 6 exit gate:** crawl gate 0-broken **and** 0-missing-anchors · one-brand-number check green · dist free of test fixtures · ROI total tracks inputs.

---

# PHASE 7 — Data & Runtime Posture *(Days 20–24)*

> Closes **DAT-6/DAT-9 partials, F-2026-N17, SEC-11 partial**.

## Milestone 7.1 — Run the app as a non-superuser over scram-sha-256 (closes DAT-9)

### Task 7.1-1 — Provision the least-privilege role

`psql -U postgres … -v app_password=<generated> -f scripts/prod-db-roles.sql` (after 2.4-2 there is no literal password in the file) — creates/refreshes `simal_app` NOSUPERUSER with DML-only grants.

### Task 7.1-2 — Switch pg_hba to scram and reload

`Codebase/tools/pgdata/pg_hba.conf`: change the `127.0.0.1/32` + `::1/128` lines from `trust` to `scram-sha-256` (keep one admin line). Reload: `pg_ctl … reload`. Verify `simal_app` can authenticate and `simal`'s password auth still works for admin tooling.

### Task 7.1-3 — Point the app at the new role and prove least privilege

`apps/portal/.env` → `DATABASE_URL=postgres://simal_app:<password>@127.0.0.1:5433/simal` (keep a separate admin URL var for migrate/seed). Restart; smoke health + one CMS write + one SSG build **including the read-only `simal_build` connection from Task 1.1-2 — the build MUST survive the auth-mode change (this is the exact failure the re-inspection predicted)**; then verify: `SELECT current_user, rolsuper;` as the app → `simal_app | f`; `CREATE TABLE x(i int);` as `simal_app` → must fail; full `run-gates.mjs` green under the new role.

**Done-when (milestone):** app runs as non-superuser over scram; `trust` appears nowhere except the single admin line; evidence = psql transcripts + gate output.

## Milestone 7.2 — Sequences gate + SLA precision + escalation (closes DAT-6, F-2026-N17)

### Task 7.2-1 — Put sequence health in CI

Add a tiny gate `scripts/ci/sequences.mjs` that runs the already-safe `tools/sync-sequences.mjs` **dry** (add a `--check` mode: report any sequence whose `last_value < max(id)` without setting) against the scratch DB and fails on drift; wire it into `run-gates.mjs` + `ci.yml`.

### Task 7.2-2 — Fix the SLA threshold + add escalation

`review.service.js` summarise (≈ 43-49):

```js
const ageMs = Date.now() - subAt;
const age = Math.max(0, Math.floor(ageMs / 86400000));
const ageBusDays = (() => { // simple business-day count for the 1.5-bd SLA
  let d = new Date(subAt), n = 0;
  while (Date.now() - d.getTime() >= 86400000) { d = new Date(d.getTime() + 86400000); if (d.getUTCDay() !== 5 && d.getUTCDay() !== 6) n++; } // Fri/Sat weekend (UAE)
  return n;
})();
return { …, ageDays: age, slaBreached: PENDING_SET.includes(s.status) && ageBusDays >= 1.5 };
```

(Keep it cheap — it runs per row; memoize per day if the queue is large. The point: a 1.6-bd-old pending submission MUST flag.)
Escalation job — `server.js` maintenance interval (≈ 131): every 30 min, select `slaBreached` pending submissions not yet escalated (track via `audit_log` event `sla_escalated` or a `escalated_at` column) → enqueue outbox email to `review-queue@simalme.com` + audit row. **Done-when:** unit test ages a fixture 2 bd → `slaBreached:true`; integration test sees the escalation outbox row after the maint tick.

## Milestone 7.3 — Real dual approval for sensitive publishes (closes SEC-11 residue)

### Task 7.3-1 — Data model + service flow

Add the `publish_approvals` DDL (below) to `scripts/migrate.sql` (idempotent section). Rework `cms.service.js publish()` (≈ 274-296): sensitive entity + no valid approval → create a `pending` row + outbox notification, return `202 {approvalId}`, **enqueue nothing**; delete the caller-attested `secondApproverEmail` acceptance path.

```sql
CREATE TABLE IF NOT EXISTS publish_approvals (
  id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL,
  entities JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|approved|rejected|expired
  decided_by TEXT, decided_at BIGINT,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now())*1000)::BIGINT
);
```

### Task 7.3-2 — Approval routes + CMS UI

`POST /api/cms/publish-approvals/:id/approve|reject` (cmsAuth): require `session.email !== requested_by`, role reviewer/super_admin; approve → internal enqueue (the code path after the sensitive check) + `decided_by/at`. Emergency override (super_admin alone) stays but emits an unmissable audit event + notifies all super_admins. Publish modal shows "Awaiting second approval (requested …)"; approvers see bell items with Approve/Reject.

### Task 7.3-3 — Tests + live demo

### Task 7.3-4 — Widen sensitive classification to legal & marketing content (re-inspection finding)

**Verified gap:** `isSensitiveEntity` (`cms.service.js`) matches only pricing/brand-auth/claims/compliance-dates — **`legal_policies` and `announcements` are NOT classified**, so a single reviewer can still single-handedly rewrite and publish legal text, exactly the SEC-11 wording the original audit flagged ("Reviewer can rewrite public legal/marketing content & publish"). Extend:

```js
function isSensitiveEntity(entity, entityId) {
  const ent = String(entity || '').toLowerCase();
  const eid = String(entityId || '').toLowerCase();
  if (ent === 'legal_policies' || ent === 'legal' || ent === 'policies') return true;   // SEC-11: legal = dual approval
  if (ent === 'announcements') return true;                                            // SEC-11: public marketing banner
  /* …existing pricing / brand-auth / compliance-dates rules unchanged… */
}
```

Extend the 7.3-3 test matrix: reviewer single-handedly publishing a **legal policy** → 202-pending (not enqueued); dual-approved legal publish → enqueued.

**Done-when (milestone):** integration tests — reviewer publishes pricing block OR legal policy naming a colleague → 202, nothing enqueued; a *second session* approves → job enqueued → build runs; same-session approve → 403. Live demo captured.

**Phase 7 exit gate:** gates green under `simal_app` · sequences gate green · SLA unit+escalation tests pass · dual-approval tests (incl. legal) pass.

---

# PHASE 8 — Apps & Compliance Completion *(Days 24–28)*

> Closes **APP-3/APP-7 partials, SEO-2/SEO-5 partials**.

## Milestone 8.1 — Live virus scanning & key drills (closes APP-3 residue)

### Task 8.1-1 — Stand up clamd and prove EICAR rejection end-to-end

Dev rig (Windows): install ClamAV (portable or installer), run `clamd.exe` with default `3310`; set `CLAMAV_HOST/PORT` (from 2.4-1). Staging (Linux): `apt install clamav-daemon` + `systemctl enable --now clamav-daemon`.
Then the drill: upload an EICAR test file through the **real** KYC wizard document step (and media route after 4.4) → expect `400 Security check failed … malicious content` (the `kyc.service.js:57-60` path already returns this). A clean PDF must still pass and be stored encrypted (verify ciphertext on disk: `data/uploads/…` is non-greppable binary).
**Done-when:** EICAR through wizard → 400 + audit row; EICAR via media route → 4xx; clean PDF round-trips (download via signed URL works); screenshot + log saved.

### Task 8.1-2 — Signed-URL expiry drill

Request a document sign URL, wait >15 min (or temporarily set ttl 5 s), fetch → must 403/410; fetch with the same token twice → second use fails (single-use). Capture.

## Milestone 8.2 — KYC wizard UAT evidence pack (closes APP-7)

### Task 8.2-1 — Write the script

Author `docs/UAT_KYC_WIZARD.md`: both tracks (vendor + customer), steps × expected results × evidence columns — 7-step completion, per-step validation messaging (step 1 already live-proven), autosave ≤ 2 s (watch the draft POST), refresh-resume ("Draft restored — continuing at step X of 7"), `?reapply=` flagged resubmission, document upload + EICAR rejection (8.1-1), submission → staff review → approve → status page shows the real reviewer name.

### Task 8.2-2 — Execute the vendor track with evidence

Run it in the browser against the rig; capture screenshots/log lines per step into `docs/uat/2026-10/`.

### Task 8.2-3 — Execute the customer track + sign-off

Same for the customer track; PM + QA sign the pack (names/date). **Done-when:** both tracks executed end-to-end with zero blocked steps and a signed cover page.

## Milestone 8.3 — Sitemap lastmod from content timestamps (closes SEO-2 residue)

### Task 8.3-1 — Extend the sitemap queries with timestamps

**File:** `Codebase/apps/site/src/pages/sitemap.xml.js` — products/legal/content_blocks carry `updated_at BIGINT`. Change the `db` queries to select it (`SELECT slug, updated_at FROM products ORDER BY slug`, etc.) and add the helper:

```js
const ts = (ms) => (Number(ms) > 0 ? new Date(Number(ms)).toISOString().slice(0, 10) : VERIFIED_BASE_DATE);
```

### Task 8.3-2 — Thread per-entity lastmod + regression case

`addUrl(\`/products/${p.slug}/\`, ts(p.updated_at))` for every entity family (products, brands, solutions/software blocks, insights, legal EN/AR); static routes legitimately keep the verified constant.

**Done-when (milestone):** `curl -s :8100/sitemap.xml | grep -o "<lastmod>[^<]*" | sort | uniq -c | head` shows multiple dates; after a CMS edit + publish, that page's lastmod changes (add this assertion to a small e2e case).

## Milestone 8.4 — GA4 behind consent (closes SEO-5 residue)

### Task 8.4-1 — Environment + consent-gated loader

Set `PUBLIC_GA4_ID` per environment (`apps/site/.env`) and add the loader to `BaseLayout.astro` (consent defaults already `denied` at ≈ 322-352):

```astro
{GA4_ID && (
  <script is:inline define:vars={{ GA4_ID }}>
    function loadGa4() {
      if (document.getElementById('ga4-src')) return;
      const s = document.createElement('script');
      s.id = 'ga4-src'; s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('consent', 'update', window.__simalConsentGrants || {});
      gtag('config', GA4_ID, { anonymize_ip: true });
    }
    if (window.__simalConsentGrants?.analytics_storage === 'granted') loadGa4();
    window.addEventListener('simal:consent-accepted', loadGa4);
  </script>
)}
```

### Task 8.4-2 — Wire the banner events

The consent island (≈ 930-955) must publish `window.__simalConsentGrants` on load, dispatch `simal:consent-accepted` on Accept-all / per-toggle Save, and on **withdrawal** set `analytics_storage: denied` + remove the `ga4-src` node.

### Task 8.4-3 — Verify with network captures

**Done-when (milestone):** fresh profile → no `googletagmanager` request before Accept; after Accept → GA4 DebugView shows `page_view`; after withdrawal → requests stop. Three captures saved.

**Phase 8 exit gate:** EICAR drill logs · UAT pack signed · sitemap multi-date · GA4 consent-gated (before/after network captures).

---

# PHASE 9 — Test, CI & Observability Hardening *(Days 28–32)*

> Closes **NFR-1/3/4/6 partials, F-2026-N12**, and the P0-3 wiring gaps.

## Milestone 9.1 — Every gate runs on the CI platform

### Task 9.1-1 — Wire the three local-only gates into `ci.yml`

Add `gate-placeholders`, `gate-perf` (needs the build artifact) and `gate-sequences` (postgres service) jobs running the existing scripts — mirror the job skeleton of the current `gate-authz` job.

### Task 9.1-2 — Real Lighthouse CI

Repo-root `lighthouserc.json` + the `lighthouse` job:

```json
{
  "ci": { "collect": { "staticDistDir": "./apps/site/dist", "numberOfRuns": 3,
            "url": ["/", "/products/", "/solutions/", "/software/", "/rfq/"] },
          "assert": { "assertions": { "categories:performance": ["error", {"minScore": 0.85}],
                        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}] } },
          "upload": { "target": "temporary-public-storage" } }
}
```

This replaces the *simulated* Lighthouse score with a real one (NFR-1 acceptance); `perf-budget.mjs` stays as the fast local proxy.

### Task 9.1-3 — Green platform run captured

**Done-when (milestone):** one CI run on the platform where **all** jobs including the new ones are green; URL archived to `rm-evidence/9.1-3.txt`.

## Milestone 9.2 — Test debt to zero (closes F-2026-N12)

### Task 9.2-1 — Fix the stale SSG test

`apps/portal/test/integration/ssg-outbox-sync.test.mjs` still logs in with `admin@simalme.com/admin123` (removed). Make it env-driven and assertion-strong:

```js
import fs from 'node:fs';
const env = (k, d) => process.env[k] || d;
const envTxt = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8');
const pick = (k) => (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const email = env('ADMIN_EMAIL', pick('ADMIN_EMAIL'));
const password = env('ADMIN_PASSWORD', pick('ADMIN_PASSWORD'));
// … assert the poll reaches 'processed' within 90 s (true e2e after Phase 1) —
// assert.equal(status, 'processed', 'SSG worker must process the publish job');
```

(Runs only when the rig is up — guard with a health check and `t.skip()` when `PORTAL_URL` is unreachable so CI's PG-service runner can still exercise it against a booted app.)

### Task 9.2-2 — Regression coverage for every Phase 2/3 fix

Add the tests listed in their tasks (CSRF 2.1-2, masking 2.2-2, bounce/gating 2.3, XSS sanitization 3.1, URL guard 3.2-2, dual approval 7.3, SLA 7.2-2). One file per area in `test/integration/`, naming the finding ID in the test title — the next auditor greps finding IDs and finds the guard.

### Task 9.2-3 — Extend the a11y gate to the CMS + target-size rule

`scripts/ci/a11y.mjs`: boot the portal in test mode, log in programmatically, run axe against `cms.html` (authenticated DOM) with the same tags; add a custom check for WCAG 2.5.8 (tap targets ≥24px) on the public pages — axe-core has no 2.5.8 rule yet, so measure bounding boxes:

```js
const small = await page.evaluate(() => [...document.querySelectorAll('a,button,input,select,textarea')]
  .map(el => ({ el, r: el.getBoundingClientRect() }))
  .filter(x => x.r.width > 0 && (x.r.width < 24 || x.r.height < 24))
  .map(x => x.el.outerHTML.slice(0, 80)));
if (small.length) fail(`SC 2.5.8: ${small.length} targets under 24px`);
```

## Milestone 9.3 — Observability with a real sink (closes NFR-3)

### Task 9.3-1 — Outbound error sink

**File:** `Codebase/apps/portal/src/server.js` — where `errorSink` is fed, add (works with any Sentry-compatible or Teams/Slack webhook):

```js
const OBS_URL = process.env.OBSERVABILITY_WEBHOOK_URL;
if (OBS_URL && status >= 500) {
  fetch(OBS_URL, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'error', requestId: req.requestId, path: req.path,
                           status, message: String(e?.message || '').slice(0, 300), ts: Date.now() })
  }).catch(() => {});
}
```

Add the key to `.env.example`.

### Task 9.3-2 — Uptime probe with alerting

Schedule `scripts/hypercare-daily.js` (Task Scheduler via the `install-autostart.cmd` pattern on the rig; cron on staging) to fetch `/api/health` of the **public origin** and POST failures to the same webhook.

### Task 9.3-3 — Drills

**Done-when (milestone):** `POST /api/admin/observability/test-error` produces (a) a sink payload carrying the request-id and (b) a webhook alert; stopping the portal triggers the uptime alert. Both captured.

## Milestone 9.4 — Rate limiting proven (closes NFR-4 residue)

### Task 9.4-1 — Record the enforcement decision

Decide and record in `ARCHITECTURE_STATE.md`: nginx `login_zone 2 r/m burst=10` (`infra/nginx/portal-staging.conf:6-8,28`) is the rate-limit enforcement point; the in-process limiter is defense-in-depth. (Alternative if staging can't run nginx this phase: implement the pluggable Redis backend for `security.js rateLimiter`.)

### Task 9.4-2 — Prove it on staging

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code} " -X POST https://staging…/api/auth/login \
  -H 'content-type: application/json' -d '{"email":"x@x.ae","password":"wrong"}'; done
```

Expect a run of 401s then **503/429 from nginx** (the edge limiter biting).

### Task 9.4-3 — Archive the transcript

**Done-when (milestone):** the status-code transcript above is captured verbatim in `rm-evidence/9.4-3.log` and the decision is in `ARCHITECTURE_STATE.md`.

**Phase 9 exit gate:** CI platform run includes all gates + lighthouse green · ssg test green · cms axe green · webhook alerts demonstrated · edge-limit transcript captured.

---

# PHASE 10 — Independent Re-Verification & the Clean-Audit Gate *(Days 32–36)*

> Discharges **P10** in full. Nothing here fixes code — it proves the fixes.

## Milestone 10.1 — Full local re-verification

### Task 10.1-1 — Gates + test suites

`node scripts/ci/run-gates.mjs` (all green, now including sequences) and the full portal suite (`unit` + `integration/*.test.js` including the fixed ssg test). Save outputs.

### Task 10.1-2 — Re-run the audit probes

```bash
node "…/audit_report_2/evidence/live_probes.mjs"            # RBAC/SLA/RFQ/masking/outbox
node "…/audit_report_2/evidence/iteration2_live_proofs.mjs" # CSRF case B must be 403 now
```

Plus the CMS control-loop probe from `evidence/cms_control_loop_and_spawn_einval.txt`'s generator — marker live at the served origin ≤ 60 s, then restored.

### Task 10.1-3 — Browser sweep

Public home/products/`/ar`/404 + CMS dashboard/publish-pipeline (expect **0 queued**, Last-Publish = real build time) + one full KYC wizard run. Screenshots into `rm-evidence/10.1/`.

## Milestone 10.2 — Staging rehearsal

### Task 10.2-1 — Clean-DB bring-up on staging

On the staging host: fresh checkout → `node scripts/bringup.mjs --fresh` (migrate+seed+build+serve running as `simal_app`) → run the gate suite against staging.

### Task 10.2-2 — DR drill + deploy prove on staging

Execute `scripts/dr-drill.mjs` **on staging**; document measured RPO/RTO in `docs/DR_DRILL_EVIDENCE.md` (must be within targets 1 h / 4 h). Exercise the deploy path (5.2) from a CMS publish and confirm the served site changes.

### Task 10.2-3 — Accessibility AT walkthrough

NVDA (EN) + VoiceOver/Narrator (AR) pass over home, catalogue, PDP, RFQ, KYC wizard, CMS — log in `docs/uat/2026-10/at-walkthrough.md`; no blocking issues (URD ACC / PRD NFR-6).

## Milestone 10.3 — External verification

### Task 10.3-1 — Commission the pen test (P10-2)

Focused auth + KYC + CMS scope covering every Phase 2/3 surface. Track findings through the board; anything found joins this roadmap's discipline (ID, evidence, task, acceptance).

### Task 10.3-2 — RTM re-run (P10-3)

Trace the top ~25 critical requirements (RFQ, KYC lifecycle, e-invoicing, RBAC, localization, SEO, accessibility) to engine + persisted API + UI against `GOVERNANCE_REQUIREMENTS_BASELINE.md` v3.0 — update `Codebase/RTM.md` with evidence links.

## Milestone 10.4 — Close the register & sign the gate

### Task 10.4-1 — Zero-open board proof

Regenerate the board (RM-1.3-1 tooling) — **every row closed, including F-2026-N01…N17**, each linking its evidence file.

### Task 10.4-2 — Readiness pack

Produce `audit_report_2/NEXT_AUDIT_READINESS.md`: one page — gates output, test counts, evidence index, any accepted risks (e.g. simulated SMTP), and the sign-off block.

### Task 10.4-3 — Steering sign-off

**Done-when (the roadmap's terminal state):** no open Critical/High/Medium; CI green on the platform; clean-DB + deploy + DR proven; monitoring alerting; batch jobs running; sign-off recorded — and the next independent auditor re-running Report 2's entire probe set finds every check green with no new Critical/High/Medium. **That is the definition of a clean audit.**

---

## 11. Effort summary & sequencing

| Phase | Cal. days | Findings closed |
|---|---|---|
| 1 Stabilize & VCS | 1–3 | N01(C), N03(H), N15 |
| 2 Security blockers | 3–6 | N02(H), N04, N08, N09, N06, N07, N14, SEC-6/7 residue |
| 3 XSS closure | 6–8 | N10, SEC-13 residue |
| 4 CMS completion | 8–14 | CMS-2/3/4/7/8/9 residues, N05, N13 |
| 5 Publish & deploy | 14–17 | CMS-10 residue |
| 6 Site truth | 17–20 | PUB-8, PUB-11/12, N11, N16 |
| 7 Data & runtime | 20–24 | DAT-6/9, N17, SEC-11 |
| 8 Apps & compliance | 24–28 | APP-3/7, SEO-2/5 |
| 9 Test/CI/observability | 28–32 | NFR-1/3/4/6, N12, P0-3 wiring |
| 10 Clean-audit gate | 32–36 | P10 discharge |

Single full-stack engineer ≈ 5 weeks; two engineers ≈ 3 weeks (split at Phase 4/6 boundary). Phase 1 must be day-one; Phases 4–6 tolerate overlap once Phase 3 lands.

## 12. Coverage matrix — every open item → task

| Open item (Report 2) | Closed by |
|---|---|
| F-2026-N01 SSG pipeline dead (C) | 1.1-1…1.1-4 |
| F-2026-N02 CSRF bypass (H) | 2.1-1/2.1-2 |
| F-2026-N03 uncommitted work (H) | 1.2-1…1.2-3 |
| F-2026-N04 TRN/email leak | 2.2-1/2.2-2 |
| F-2026-N05 media in webroot | 4.4-1 |
| F-2026-N06 doc-encryption key | 2.4-1 |
| F-2026-N07 ClamAV dormant | 2.4-1 + 8.1-1 |
| F-2026-N08 bounce spoof | 2.3-1 |
| F-2026-N09 observability/sign gates | 2.3-2 |
| F-2026-N10 XSS residues | 3.1-1/3.1-2/3.2-1/3.2-2 |
| F-2026-N11 test articles published | 6.3-1 |
| F-2026-N12 stale SSG test | 9.2-1 |
| F-2026-N13 profile chip | 4.3-4 |
| F-2026-N14 committed credentials | 2.4-2 |
| F-2026-N15 board/claims stale | 1.3-1/1.3-2 |
| F-2026-N16 hero bg unused | 6.3-2 |
| F-2026-N17 SLA rounding/escalation | 7.2-2 |
| SEC-6 partial (TRN) | 2.2 |
| SEC-7 partial (token verify + client wiring) | 2.1-1…2.1-3 |
| SEC-10 partial (regression) | 1.1 |
| SEC-11 partial (dual approval + legal/marketing single-hand) | 7.3-1…7.3-4 |
| SEC-13 partial (sinks/CSP) | 3.1–3.3 |
| DAT-6 partial (CI wiring) | 7.2-1 |
| DAT-9 partial (role/scram) | 7.1-1…7.1-3 |
| CMS-2 partial (chrome/SEO/stats/AR/categories editors) | 4.1, 4.2, 4.5 |
| CMS-3 partial (decoy) | 4.3-2 |
| CMS-4 partial (stock boolean) | 4.3-1 |
| CMS-7 partial (`custom` entity) | 4.3-3 |
| CMS-8 partial (fallbacks/chip) | 4.3-4 |
| CMS-9 partial (media hardening) | 4.4-1 |
| CMS-10 partial (KPI/purge/deploy) | 5.1–5.3 |
| PUB-8 NOT-FIXED (facts) | 6.1-1…6.1-3 |
| PUB-11 partial (ROI inputs) | 6.2-1 |
| PUB-12 partial (anchors) | 6.2-2 |
| APP-3 partial (AV/key drills) | 8.1 |
| APP-7 partial (UAT pack) | 8.2-1…8.2-3 |
| SEO-2 partial (lastmod) | 8.3-1…8.3-2 |
| SEO-5 partial (GA4) | 8.4-1…8.4-3 |
| NFR-1 partial (Lighthouse) | 9.1-1…9.1-2 |
| NFR-3 partial (sink/uptime) | 9.3-1…9.3-3 |
| NFR-4 partial (edge proof) | 9.4-1…9.4-3 |
| NFR-6 partial (= P0-3 wiring) | 9.1-1 |
| P0-1 partial (remote/protect/CI-run) | 1.2 |
| P0-3 partial (gates in ci.yml) | 9.1-1 |
| P0-5 partial (board) | 1.3-1 |
| P10 discharge | 10.1–10.4 |
| DAT-7 recurrence guard | 6.3-1 |
| A11Y residuals (cms.html axe, 2.5.8, AT pass) | 9.2-3, 10.2-3 |

**Coverage check:** 24 PARTIAL + 1 NOT-FIXED + 17 NEW + 5 programme gaps (P0/P10) + 4 re-inspection defects (§13) — every one maps to ≥1 task above. No open item from `FINDINGS_MATRIX.csv` is unassigned.

---

## 13. Re-inspection log (v1.1 — defects found in the deeper pass and how each was fixed)

Each row was verified against the live tree on 16 Oct 2026 before the fix was applied to this document.

| # | Defect in v1.0 | Evidence (current code) | Fix in v1.1 |
|---|---|---|---|
| R-1 | Unix spawn branch broken: `execFile(process.execPath, ['npm', …])` would try to execute `npm` as a JS script on Unix | platform semantics (npm is a symlinked script, not a `.cmd`) | Task 1.1-1: explicit platform branch — Windows `node + npm-cli.js`, Unix direct `execFile('npm', …)` |
| R-2 | **Latent build-break:** the SSG build connects to PG via a **hardcoded dev fallback** (`postgres://simal:[REDACTED-ROTATED-2026-10]@…`) because the worker's sanitized env strips `DATABASE_URL`; the v1.0 spawn fix would only work by silently relying on it, and Phase 7.1's scram switch would break the build outright | `apps/site/src/lib/db.ts:9-12` (fallback verified); `server.js` sanitizedEnv strips `DATABASE_URL` | New Task 1.1-2: read-only `simal_build` role + `BUILD_DATABASE_URL` injection + remove the hardcoded fallback |
| R-3 | **CSRF enforcement would break the whole CMS:** no staff page sends `x-csrf-token` (v1.0 mentioned this only as a parenthetical) | `grep csrf public/assets/js/*.js` → 0 matches; `api.js:9-26` is the single `call()` funnel | New Task 2.1-3: token store + header in `api.js`, `setCsrf` after login, `csrfToken` added to `/api/auth/me` |
| R-4 | `hmacSign` called with wrong arity (payload only) | `src/lib/security.js`: `export function hmacSign(secret, payload)` — secret first | Task 2.3-1 snippet corrected + config-loaded `webhookSigningSecret` |
| R-5 | Media snippet referenced `config.root` — symbol not in scope in `cms.service.js` | `grep import.*config src/services/cms.service.js` → none (module uses `process.cwd()`/`__dirname`) | Task 4.4-1 snippet rewritten to the module's existing cwd-based style |
| R-6 | Deploy snippet could nest (`fs.cpSync` copies src INTO an existing dest; `verbatimRoot` does not prevent it) | Node `fs.cpSync` semantics | Task 5.2-1: deterministic `rmSync(deployDir) + cpSync(src, deployDir)` |
| R-7 | **Coverage gap (CMS-2 residue):** Arabic content is un-editable — block routes take no `lang` parameter (cms.js only *counts* AR rows, line 835); no product-category editor exists | `routes.js:702-710` (no lang); `grep categor cms.js` → one search placeholder | New Milestone 4.5 (Tasks 4.5-1…4.5-3): lang-aware routes + editor switcher + `#/categories` CRUD + e2e proof |
| R-8 | **Coverage gap (SEC-11 residue):** `legal_policies` and `announcements` are not sensitive-classified — a single reviewer can still publish legal/marketing text | `isSensitiveEntity` matches only pricing/brand-auth/claims/compliance-dates | New Task 7.3-4: classification extended + test matrix widened |
| R-9 | Hygiene residues unassigned: dev `.env` uses the published RFC example TOTP secret with `ADMIN_MFA_REQUIRED=false`; JSON store retains 15-digit Peppol endpoints | `.env` inspection; `data/db.json` (self-healed on read, never rewritten) | Task 2.4-1 item 6 (TOTP rotation + MFA flag) and Task 2.4-2 bullet (db.json purge) |

---

*Standards carried from `REMEDIATION_RESEARCH_NOTES.md` (verified 2026-10-12): OWASP ASVS 5.0.0 L2 · NIST SP 800-63B-4 · OWASP CSRF/File-Upload/Authorization cheat sheets · Node child-process guidance (CVE-2024-27980 spawn semantics) · Peppol PINT AE 1.0.4 · WCAG 2.2 AA · Google sitemap/hreflang/consent-mode guidance · PostgreSQL scram-sha-256. Every snippet in this roadmap was written against the working tree as re-inspected on 16 Oct 2026.*
