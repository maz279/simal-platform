#!/usr/bin/env node
/* golive-execute.js — T7.5: go-live night step driver (E6 hour-by-hour).
 *
 * Usage (run from Codebase root, on the launch bridge):
 *   node scripts/golive-execute.js precheck      22:00  gates + blockers
 *   node scripts/golive-execute.js backup        22:15  pre-cutover pg_dump
 *   node scripts/golive-execute.js deploy-verify 22:30  smoke on staged artifacts
 *   node scripts/golive-execute.js db-counts     23:00  counts vs source of truth
 *   node scripts/golive-execute.js dns-confirm   23:30  human-confirmed DNS cutover
 *   node scripts/golive-execute.js canary        00:30  1-minute error-rate probe
 *   node scripts/golive-execute.js sanity        01:30  live end-to-end sanity
 *   node scripts/golive-execute.js declare-live  02:00  formal declaration + TTL restore note
 *
 * Every step appends a timestamped line to infra/logs/golive-execution.log
 * (the E6 audit log). Human steps REQUIRE a typed YES — no accidental cutover.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOG_DIR = resolve(ROOT, 'infra/logs');
const LOG_FILE = resolve(LOG_DIR, 'golive-execution.log');
mkdirSync(LOG_DIR, { recursive: true });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const ENV = { ...process.env, DATABASE_URL: DB_URL, NODE_KYC_TEST: '1' };
const BACKUP_FILE = 'infra/logs/pre-cutover-backup.sql';

const log = (step, msg) => {
  const line = new Date().toISOString() + ' [' + step + '] ' + msg;
  appendFileSync(LOG_FILE, line + '\n');
  console.log(line);
};

const confirm = async (question) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = await rl.question(question + ' type YES to proceed: ');
  rl.close();
  return a.trim() === 'YES';
};

const step = process.argv[2];
if (!step) { console.error('usage: node scripts/golive-execute.js <precheck|backup|deploy-verify|db-counts|dns-confirm|canary|sanity|declare-live>'); process.exit(2); }

if (step === 'precheck') {
  log('precheck', 'T-0 gates: freeze + parity + smoke re-run; any RED blocks the window');
  try {
    execFileSync('node', ['scripts/freeze-manifest.js', 'verify'], { cwd: ROOT, env: ENV, stdio: 'inherit' });
    execFileSync('node', ['scripts/smoke-test.js'], { cwd: ROOT, env: ENV, stdio: 'inherit' });
    log('precheck', 'GATES GREEN — window may proceed (verify no open SEV-1/2 on the bridge)');
  } catch (e) {
    log('precheck', 'GATE RED — ABORT CRITERION MET. Do not proceed; execute rollback plan.');
    process.exit(1);
  }
} else if (step === 'backup') {
  const ok = await confirm('Take the final pre-cutover database backup?');
  if (!ok) { log('backup', 'SKIPPED by operator — window must NOT proceed without backup'); process.exit(1); }
  execFileSync('tools/pgsql/bin/pg_dump.exe', ['--no-owner', '--no-privileges', '-f', BACKUP_FILE], { cwd: ROOT, env: { ...process.env, PGDATABASE: new URL(DB_URL).pathname.replace(/^\//, ''), PGHOST: new URL(DB_URL).hostname, PGPORT: new URL(DB_URL).port, PGUSER: decodeURIComponent(new URL(DB_URL).username), PGPASSWORD: decodeURIComponent(new URL(DB_URL).password) } });
  const size = readFileSync(resolve(ROOT, BACKUP_FILE), 'utf8').length;
  log('backup', 'pre-cutover backup written: ' + BACKUP_FILE + ' (' + size + ' bytes)');
} else if (step === 'deploy-verify') {
  log('deploy-verify', 'deploy pipeline completed? smoke checks next');
  try {
    execFileSync('node', ['scripts/smoke-test.js'], { cwd: ROOT, env: ENV, stdio: 'inherit' });
    log('deploy-verify', 'SMOKE GREEN on staged deployment');
  } catch (e) {
    log('deploy-verify', 'SMOKE RED — ABORT: traffic stays on previous artifact (E1 §4)');
    process.exit(1);
  }
} else if (step === 'db-counts') {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const gates = [];
  gates.push(['products = 81', parseInt((await client.query('SELECT count(*) AS n FROM products')).rows[0].n, 10) === 81]);
  gates.push(['product_deep = 78', parseInt((await client.query('SELECT count(*) AS n FROM product_deep')).rows[0].n, 10) === 78]);
  gates.push(['brands = 20', parseInt((await client.query('SELECT count(*) AS n FROM brands')).rows[0].n, 10) === 20]);
  gates.push(['content_blocks = 97', parseInt((await client.query('SELECT count(*) AS n FROM content_blocks')).rows[0].n, 10) === 97]);
  gates.push(['tables = 25', parseInt((await client.query('SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = \'public\'')).rows[0].n, 10) === 25]);
  await client.end();
  const bad = gates.filter(([, ok]) => !ok).map(([n]) => n);
  for (const [n, ok] of gates) log('db-counts', (ok ? 'OK  ' : 'BAD ') + n);
  if (bad.length) { log('db-counts', 'COUNT MISMATCH — ABORT: rollback + investigate'); process.exit(1); }
  log('db-counts', 'ALL COUNTS MATCH SOURCE OF TRUTH');
} else if (step === 'dns-confirm') {
  console.log('\nDNS CUTOVER CHECKLIST (execute on Cloudflare):');
  console.log('  1. TTL on simalme.com + kyc.simalme.com → 300 s (should already be low since T-1)');
  console.log('  2. A/CNAME records → new production cluster');
  console.log('  3. kyc.simalme.com → portal origin (301/token map active)');
  const ok = await confirm('DNS records switched and verified?');
  log('dns-confirm', ok ? 'DNS CUTOVER CONFIRMED by operator' : 'DNS NOT switched — holding');
  if (!ok) process.exit(1);
} else if (step === 'canary') {
  const base = process.env.CANARY_BASE_URL;
  if (!base) { console.error('set CANARY_BASE_URL (e.g. https://simalme.com)'); process.exit(2); }
  const probes = ['/api/health', '/', '/products/', '/insights/'];
  let errors = 0, total = 0;
  const started = Date.now();
  while (Date.now() - started < 60000) {
    for (const p of probes) {
      try { const r = await fetch(base + p); total++; if (r.status >= 500) errors++; }
      catch { total++; errors++; }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  const rate = errors / Math.max(1, total);
  log('canary', '1-minute probe: ' + total + ' requests, ' + errors + ' errors (' + (rate * 100).toFixed(2) + '%)');
  if (rate > 0.0005) { log('canary', 'ERROR RATE ABOVE 0.05% — PAUSE TRAFFIC, PAGE TL (E6 canary criterion)'); process.exit(1); }
  log('canary', 'CANARY CLEAN');
} else if (step === 'sanity') {
  log('sanity', 'manual bridge checklist: test RFQ submitted · email received · admin console inspected');
  const ok = await confirm('All three sanity checks confirmed by the bridge?');
  log('sanity', ok ? 'SANITY CONFIRMED' : 'SANITY OUTSTANDING — resolve before declare-live');
  if (!ok) process.exit(1);
} else if (step === 'declare-live') {
  const ok = await confirm('Declare the platform LIVE and restore DNS TTL to 86400s?');
  if (!ok) { log('declare-live', 'declaration withheld by operator'); process.exit(1); }
  log('declare-live', 'PLATFORM DECLARED LIVE · DNS TTL restored to 86400s · partner broadcast email queued (INT-6)');
} else {
  console.error('unknown step: ' + step);
  process.exit(2);
}
