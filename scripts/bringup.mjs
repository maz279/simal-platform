// scripts/bringup.mjs — P0-2 (remediation plan 2026-10-12)
// One-command bring-up of the whole dev rig in the production topology:
//   1. PostgreSQL (portable install) started if down
//   2. (--fresh) app database recreated from scripts/migrate.sql + scripts/seed.sql
//   3. portal API on :8090 (waits for /api/settings 200)
//   4. public site built (apps/site, SSG from PG) unless dist is present
//   5. dev-edge static host on :8100 WITH the /api reverse proxy (PUB-2 topology)
//
// Usage:
//   node scripts/bringup.mjs            # start everything, keep existing DB
//   node scripts/bringup.mjs --fresh    # DROP+recreate app DB (needs BRINGUP_ALLOW_RESET=1)
//   node scripts/bringup.mjs --build    # force an SSG rebuild even if dist exists
//
// Credentials never appear in this file: the portal reads its own .env, and
// database URLs come from the environment or apps/portal/.env at runtime.
import { spawn, execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTAL_DIR = path.join(REPO, 'apps/portal');
const SITE_DIR = path.join(REPO, 'apps/site');
const PG_BIN_DIR = process.env.PG_BIN_DIR || path.join(REPO, 'tools', 'pgsql', 'bin');
const PG_DATA_DIR = process.env.PG_DATA_DIR || path.join(REPO, 'tools', 'pgdata');
const PG_PORT = Number(process.env.PG_PORT || 5433);
const PORTAL_PORT = Number(process.env.PORTAL_PORT || 8090);
const EDGE_PORT = Number(process.env.PORT || 8100);
const FRESH = process.argv.includes('--fresh');
const FORCE_BUILD = process.argv.includes('--build');
const IS_WIN = process.platform === 'win32';

const log = (step, msg) => console.log(`[bringup ${step}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'ignore', ...opts });
    p.on('error', resolve); p.on('exit', (code) => resolve(code));
  });
}

async function readEnvFile(file) {
  const txt = await fs.readFile(file, 'utf8').catch(() => '');
  const out = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

async function waitHttp(url, timeoutMs, label) {
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* retry */ }
    if (Date.now() - t0 > timeoutMs) return false;
    await sleep(700);
  }
}

/* ---------- 1. PostgreSQL ---------- */
import net from 'node:net';

/** TCP-level readiness probe (what pg_isready does, without needing the exe —
 *  some hosts AV-lock pg_isready while the server itself is fine). */
function pgListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.connect({ port, host, timeout: 1500 });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

async function ensurePostgres() {
  if (await pgListening(PG_PORT)) {
    log('pg', `already accepting connections on :${PG_PORT}`);
    return;
  }
  log('pg', `down — starting portable instance (data ${path.relative(REPO, PG_DATA_DIR)})`);
  const { err, stdout } = await new Promise((resolve) => {
    execFile(
      path.join(PG_BIN_DIR, IS_WIN ? 'pg_ctl.exe' : 'pg_ctl'),
      /* -w -t 20: pg_ctl itself confirms readiness and exits. Killing pg_ctl
         mid-wait (default 60 s) strands the server — observed as the
         "postmaster.pid invalid" self-shutdown a minute after start. */
      ['-D', PG_DATA_DIR, '-o', `-p ${PG_PORT}`, '-l', path.join(PG_DATA_DIR, 'pg.log'), '-w', '-t', '20', 'start'],
      { timeout: 90000 },
      (e, so) => resolve({ err: e, stdout: so })
    );
  });
  let ok = false;
  for (let i = 0; i < 30 && !ok; i++) {
    ok = await pgListening(PG_PORT);
    if (!ok) await sleep(500);
  }
  if (!ok) {
    throw new Error(`PostgreSQL did not become ready — pg_ctl: ${err ? err.message : String(stdout).trim() || 'started but not listening'} (see tools/pgdata/pg.log)`);
  }
  log('pg', `ready on :${PG_PORT}`);
}

/* ---------- 2. fresh database ---------- */
async function freshDatabase() {
  if (!FRESH) return;
  if (process.env.BRINGUP_ALLOW_RESET !== '1') {
    throw new Error('--fresh drops and recreates the app database; set BRINGUP_ALLOW_RESET=1 to confirm');
  }
  const env = { ...process.env };
  if (!env.DATABASE_URL) {
    const portalEnv = await readEnvFile(path.join(PORTAL_DIR, '.env'));
    env.DATABASE_URL = portalEnv.DATABASE_URL;
  }
  if (!env.DATABASE_URL) throw new Error('no DATABASE_URL (env or apps/portal/.env) — cannot reset');
  const url = new URL(env.DATABASE_URL);
  const dbname = url.pathname.replace(/^\//, '');
  /* rm(7.1-3)/DAT-9: the portal runs as NOCREATEDB simal_app — the reset MUST
   * use ADMIN_DATABASE_URL (superuser) when configured, not a DATABASE_URL derivation. */
  const portalEnv2 = await readEnvFile(path.join(PORTAL_DIR, '.env'));
  const adminSource = env.ADMIN_DATABASE_URL || portalEnv2.ADMIN_DATABASE_URL || env.DATABASE_URL;
  const adminUrl = new URL(adminSource);
  adminUrl.pathname = '/postgres';
  const { default: pg } = await import('pg');
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbname]
  );
  await admin.query(`DROP DATABASE IF EXISTS ${JSON.stringify(dbname)}`); // identifier from own URL, quoted
  await admin.query(`CREATE DATABASE ${JSON.stringify(dbname)}`);
  await admin.end();

  const app = new pg.Client({ connectionString: env.DATABASE_URL });
  await app.connect();
  for (const file of ['migrate.sql', 'seed.sql']) {
    const sql = await fs.readFile(path.join(REPO, 'scripts', file), 'utf8');
    await app.query(sql);
    log('fresh', `applied scripts/${file}`);
  }
  await app.end();
  log('fresh', `database "${dbname}" recreated from migrate.sql + seed.sql`);
}

/* ---------- 3. portal ---------- */
async function ensurePortal() {
  const up = await fetch(`http://127.0.0.1:${PORTAL_PORT}/api/settings`).then((r) => r.ok).catch(() => false);
  if (up) { log('portal', `already running on :${PORTAL_PORT}`); return; }
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: PORTAL_DIR, detached: true, stdio: 'ignore',
  });
  child.unref();
  const ok = await waitHttp(`http://127.0.0.1:${PORTAL_PORT}/api/settings`, 30000, 'portal');
  if (!ok) throw new Error(`portal did not come up on :${PORTAL_PORT} (see portal log)`);
  log('portal', `running on :${PORTAL_PORT} (pid ${child.pid})`);
}

/* ---------- 4. site build ---------- */
async function ensureSite() {
  const distIndex = path.join(SITE_DIR, 'dist', 'index.html');
  const have = await fs.stat(distIndex).then(() => true).catch(() => false);
  if (have && !FORCE_BUILD) { log('site', 'dist already built (use --build to rebuild)'); return; }
  const env = { ...process.env };
  if (!env.DATABASE_URL) {
    const portalEnv = await readEnvFile(path.join(PORTAL_DIR, '.env'));
    env.DATABASE_URL = portalEnv.DATABASE_URL;
  }
  if (!env.DATABASE_URL) throw new Error('no DATABASE_URL (env or apps/portal/.env) — cannot build site');
  log('site', `building SSG from PG (${FORCE_BUILD ? 'forced' : 'dist missing'})…`);
  const npmCmd = IS_WIN ? 'npm.cmd' : 'npm';
  /* .cmd launchers need a shell on Windows; args are literals. */
  const code = await new Promise((resolve) => {
    const p = spawn(npmCmd, ['run', 'build'], { cwd: SITE_DIR, env, stdio: 'ignore', shell: IS_WIN });
    p.on('error', () => resolve(1));
    p.on('exit', (c) => resolve(c ?? 1));
  });
  if (code !== 0) throw new Error('astro build failed (this is finding DAT-1 on a --fresh DB — see remediation P2-1)');
  log('site', 'built');
}

/* ---------- 5. dev-edge ---------- */
async function ensureEdge() {
  const up = await fetch(`http://127.0.0.1:${EDGE_PORT}/`).then((r) => r.ok).catch(() => false);
  if (up) { log('edge', `already running on :${EDGE_PORT}`); return; }
  const child = spawn(process.execPath, ['scripts/dev-edge.mjs'], {
    cwd: REPO, detached: true, stdio: 'ignore',
  });
  child.unref();
  const ok = await waitHttp(`http://127.0.0.1:${EDGE_PORT}/`, 15000, 'edge');
  if (!ok) throw new Error(`dev-edge did not come up on :${EDGE_PORT}`);
  log('edge', `static site + /api proxy on :${EDGE_PORT} (pid ${child.pid})`);
}

/* ---------- main ---------- */
try {
  await ensurePostgres();
  await freshDatabase();
  await ensurePortal();
  await ensureSite();
  await ensureEdge();
  console.log('\n[bringup] rig is up:');
  console.log(`  portal API      http://127.0.0.1:${PORTAL_PORT}/cms.html`);
  console.log(`  public site     http://127.0.0.1:${EDGE_PORT}/`);
  console.log(`  site→portal API http://127.0.0.1:${EDGE_PORT}/api/settings  (reverse proxy)`);
} catch (e) {
  console.error(`[bringup] FAILED: ${e.message}`);
  console.error(e.stack || e);
  process.exit(1);
}
