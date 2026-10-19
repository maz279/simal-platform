// scripts/ci/lib.mjs — shared helpers for the P0-3 remediation gates.
// Gates are designed to BITE today (they fail on the known audit defects)
// and be driven green by later phases. No credentials are hardcoded: gate
// apps boot with randomly generated passwords, and database URLs come from
// the environment.
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PORTAL_DIR = path.join(REPO, 'apps', 'portal');
export const SITE_DIR = path.join(REPO, 'apps/site');

const portalRequire = createRequire(path.join(PORTAL_DIR, 'package.json'));
/* rm(9.1-3): pg loads on first use. Gates that only need REPO or the helpers
 * (link-crawl, a11y) used to die with "Cannot find module 'pg'" on a CI runner
 * that had not installed it; `new pg.Client(...)` call sites are unchanged. */
let pgModule;
export const pg = new Proxy({}, { get: (_, key) => (pgModule ??= portalRequire('pg'))[key] });

export const rand = (n = 18) => crypto.randomBytes(n).toString('base64url');

/** rm(7.1-3)/DAT-9: the privileged admin URL for gate/database maintenance.
 *  Since the portal runs as the NOCREATEDB role simal_app, deriving admin URLs
 *  from DATABASE_URL no longer works — everything that CREATEs/DROPs databases
 *  must use ADMIN_DATABASE_URL (apps/portal/.env, gitignored) and only fall
 *  back to the DATABASE_URL derivation when the split is not configured. */
export async function adminUrlFromEnv() {
  if (process.env.GATE_ADMIN_URL) return process.env.GATE_ADMIN_URL;
  if (process.env.ADMIN_DATABASE_URL) return process.env.ADMIN_DATABASE_URL;
  const envTxt = await fs.readFile(path.join(PORTAL_DIR, '.env'), 'utf8').catch(() => '');
  const admin = envTxt.match(/^ADMIN_DATABASE_URL=(.*)$/m);
  if (admin) return admin[1].trim();
  const db = envTxt.match(/^DATABASE_URL=(.*)$/m) || (process.env.DATABASE_URL ? [null, process.env.DATABASE_URL] : null);
  if (db) {
    const u = new URL(db[1].trim());
    u.pathname = '/postgres';
    return u.toString();
  }
  return null;
}

/** TCP probe — true when something accepts connections on host:port. */
export function listening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.connect({ port, host, timeout: 1200 });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

/** rm(9.2-2): true when a PostgreSQL server accepts connections at url (2 s budget).
 *  Used by the test/integration suites that need PostgreSQL: they SKIP (not fail)
 *  where no server is reachable — e.g. the CI `unit` job and portal-less checkouts. */
export async function pgReachable(url) {
  if (!url) return false;
  let c;
  try {
    c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 2000 });
    await c.connect();
    return true;
  } catch {
    return false;
  } finally {
    try { await c?.end(); } catch { /* already gone */ }
  }
}

/** Free-port picker so parallel gates never collide. */
export async function freePort() {
  return new Promise((resolve) => {
    const s = net.connect({ port: 0 });
    s.once('error', () => resolve(0));
  }).then(() => new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
  }));
}

/**
 * Scratch PostgreSQL database for a gate run: created from migrate.sql +
 * seed.sql, dropped again on cleanup. Returns { url, drop() }.
 * `baseUrl` must point at a maintainable database (usually "postgres").
 */
export async function scratchDatabase(baseUrl, label) {
  const admin = new pg.Client({ connectionString: baseUrl });
  await admin.connect();
  /* rm(6.3-1)/DAT-7 pre-run sweep: a crashed gate used to leak its scratch database
   * forever (two simal_gate_pgr_* orphans were found in the audit). Drop every gate
   * scratch db that currently has zero connections — a live run always holds at least
   * one connection to its own database. */
  try {
    const stale = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'simal\\_gate\\_%' AND datname <> current_database()`
    );
    for (const { datname } of stale.rows) {
      /* rm(10.3-1): names carry a base36 millisecond stamp (`..._<label>_<ts>`).
       * A gate that just created its database has no open connection yet, so the
       * zero-connection test alone let a CONCURRENT gate's sweep drop it mid-run
       * ("database ... does not exist"). Only reclaim databases older than 10 min. */
      const stamp = parseInt(String(datname).split('_').pop(), 36);
      if (Number.isFinite(stamp) && Date.now() - stamp < 10 * 60 * 1000) continue;
      const active = await admin.query(
        'SELECT COUNT(*)::int AS n FROM pg_stat_activity WHERE datname = $1',
        [datname]
      );
      if (active.rows[0].n === 0) {
        await admin.query(`DROP DATABASE IF EXISTS ${JSON.stringify(datname)}`);
        console.log(`[scratch] swept stale gate database ${datname}`);
      }
    }
  } catch { /* sweep is best-effort — never block the gate on it */ }
  const name = `simal_gate_${label}_${Date.now().toString(36)}`;
  await admin.query(`CREATE DATABASE ${JSON.stringify(name)}`);
  const url = new URL(baseUrl);
  url.pathname = '/' + name;
  const app = new pg.Client({ connectionString: url.toString() });
  await app.connect();
  for (const file of ['migrate.sql', 'seed.sql']) {
    const sql = await fs.readFile(path.join(REPO, 'scripts', file), 'utf8');
    await app.query(sql);
  }
  await app.end();
  return {
    url: url.toString(),
    async drop() {
      await admin.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [name]
      );
      await admin.query(`DROP DATABASE IF EXISTS ${JSON.stringify(name)}`);
      await admin.end();
    },
  };
}

/**
 * Boot the portal app in test mode on an ephemeral port with generated
 * credentials. Returns { base, url, creds, stop() }.
 * - mode 'json'  : temp DATA_DIR, no DATABASE_URL (pure JSON store)
 * - mode 'pg'    : DATABASE_URL bound to the given scratch database
 * The returned creds contain the randomly generated staff passwords; a
 * partner account is created via the admin API after boot.
 */
export async function bootApp({ mode, databaseUrl, mfa = true }) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'simal-gate-'));
  process.env.NODE_KYC_TEST = '1';
  process.env.NODE_ENV = 'test';
  process.env.DATA_DIR = dir;
  process.env.SESSION_IDLE_MINUTES = '20';
  /* rm(2.4-3): documents require a key in every store now */
  if (!process.env.DOC_ENCRYPTION_KEY) process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  /* rm(6.3-1)/DAT-7: a booted test portal must never run the SSG worker — its publish
   * jobs would otherwise rebuild the LIVE apps/site/dist from gate/e2e data. */
  process.env.SSG_DISABLED = '1';
  const creds = {
    adminEmail: `gate-admin-${rand(6)}@example.invalid`,
    adminPassword: rand(18),
    adminTotp: crypto.randomBytes(20).toString('base64').replace(/=+$/, '').toUpperCase(),
    reviewerEmail: `gate-rev-${rand(6)}@example.invalid`,
    reviewerPassword: rand(18),
    viewerEmail: `gate-view-${rand(6)}@example.invalid`,
    viewerPassword: rand(18),
  };
  process.env.ADMIN_EMAIL = creds.adminEmail;
  process.env.ADMIN_PASSWORD = creds.adminPassword;
  process.env.ADMIN_NAME = 'Gate Runner';
  process.env.ADMIN_TOTP_SECRET = creds.adminTotp;
  process.env.ADMIN_MFA_REQUIRED = mfa ? 'true' : 'false';
  process.env.REVIEWER_EMAIL = creds.reviewerEmail;
  process.env.REVIEWER_PASSWORD = creds.reviewerPassword;
  process.env.VIEWER_EMAIL = creds.viewerEmail;
  process.env.VIEWER_PASSWORD = creds.viewerPassword;
  if (mode === 'pg') process.env.DATABASE_URL = databaseUrl;
  /* Empty string (not delete): the portal .env loader only fills UNSET keys,
     so '' keeps the JSON store even when apps/portal/.env defines DATABASE_URL. */
  else process.env.DATABASE_URL = '';

  /* rm(9.2-2): config.js caches the environment at FIRST import, so a second
   * bootApp() in the same process (e.g. a JSON drill followed by a PG drill in
   * one node:test file) would bootstrap staff from the FIRST boot's generated
   * credentials and every login with the new ones would 401. Re-align the
   * cached bootstrap block with the env we just set. */
  const { config } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'config.js')).href);
  Object.assign(config.bootstrap, {
    adminEmail: creds.adminEmail,
    adminName: 'Gate Runner',
    adminPassword: creds.adminPassword,
    adminMfaRequired: mfa,
    adminTotpSecret: creds.adminTotp,
    reviewer: { email: creds.reviewerEmail, password: creds.reviewerPassword, name: 'Review Staff' },
    viewer: { email: creds.viewerEmail, password: creds.viewerPassword, name: 'Read-only Staff' },
  });
  if (mode !== 'pg') config.dataDir = dir;

  const { createApp } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'server.js')).href);
  const app = await createApp({ dataDir: dir });
  await new Promise((res) => app.server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${app.server.address().port}`;

  async function stop() {
    /* rm(9.3): idle keep-alive sockets (undici pools them for ~4s after the last
     * request) otherwise block server.close() and hang the test-file process. */
    app.server.closeIdleConnections?.();
    await new Promise((res) => app.server.close(res));
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
  return { base, creds, stop, app, totpNow: async () => {
    const { totpNow } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'lib', 'security.js')).href);
    return totpNow(creds.adminTotp);
  } };
}

/** Login helper; returns the raw cookie header value or null.
 *  With MFA required the session cookie is only issued AFTER the TOTP step,
 *  so a cookie-less first response is expected on that path. */
export async function login(base, email, password, totpSecret) {
  const cookieOf = (r) => {
    const c = (r.headers.getSetCookie?.() || []).find((x) => x.startsWith('kyc_sid='));
    return c ? c.split(';')[0] : null;
  };
  const r1 = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (r1.status !== 200) return null;
  const j = await r1.json().catch(() => ({}));
  if (j.mfaChallengeId && totpSecret) {
    const { totpNow } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'lib', 'security.js')).href);
    const r2 = await fetch(base + '/api/auth/mfa', {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: cookieOf(r1) || '' },
      body: JSON.stringify({ mfaChallengeId: j.mfaChallengeId, code: totpNow(totpSecret) }),
    });
    if (r2.status !== 200) return null;
    return cookieOf(r2);
  }
  return cookieOf(r1);
}

/** Create a partner account through the admin API (mimics provisioning). */
export async function createPartner(base, adminCookie, email, password) {
  const r = await fetch(base + '/api/admin/users', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie: adminCookie },
    body: JSON.stringify({ name: 'Gate Partner', email, password, role: 'partner', active: true }),
  });
  return r.status;
}

/** Run a command, capture combined output, enforce a timeout.
 *  On Windows, .cmd launchers (npm) cannot be exec'd without a shell — args
 *  here are always literal constants, never user input. */
export function runCapture(cmd, args, { cwd, env, timeoutMs = 240000 } = {}) {
  const needsShell = process.platform === 'win32' && /\.cmd$/i.test(cmd);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, shell: needsShell });
    let out = '', timer;
    const kill = () => { try { child.kill('SIGKILL'); } catch { /* already gone */ } };
    timer = setTimeout(kill, timeoutMs);
    child.stdout?.on('data', (d) => { out += d; if (out.length > 400000) out = out.slice(-400000); });
    child.stderr?.on('data', (d) => { out += d; if (out.length > 400000) out = out.slice(-400000); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: 1, out: out + '\n' + e.message }); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, out }); });
  });
}

export function report(title, failures, details) {
  console.log(`\n=== ${title} ===`);
  if (!failures.length) {
    console.log('PASS — 0 violations');
    return 0;
  }
  console.log(`FAIL — ${failures.length} violation(s):`);
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  if (details) console.log(details);
  return 1;
}
