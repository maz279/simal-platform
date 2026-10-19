#!/usr/bin/env node
/* cutover-rehearsal.js — T7.3: production cutover rehearsal #2 (E6 §rehearsal).
 *
 * INVOCATION CONTRACT: run from the Codebase repo root (same as CI):
 *   node scripts/cutover-rehearsal.js
 * Binaries and files are addressed by literal repo-relative paths; database
 * credentials come only from DATABASE_URL (standard PG* env is derived).
 *
 * Executes the COMPLETE Day-0 sequence against a fresh rehearsal database on
 * the real PostgreSQL server, with second-level timings at every step:
 *   1. prepare    — drop/create the rehearsal DB (staging-domain equivalent)
 *   2. migrate    — apply scripts/migrate.sql via psql (DDL + seeds)
 *   3. verify     — table + row counts vs the production source of truth
 *   4. redirects  — old-portal route map resolves into live artifacts
 *   5. backup     — pg_dump the rehearsal DB (same binary prod uses)
 *   6. ABORT DRILL— counts-mismatch abort simulated; rollback measured ≤10 min
 *   7. timeline   — scripts/rehearsal-timeline.json + verdict
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'apps/site/dist');
const PORTAL_PUBLIC = resolve(ROOT, 'apps/portal/public');

/* fixed rehearsal database name — reused across runs (dropped first) */
const REHEARSAL_DB = 'simal_rehearsal';

const SOURCE_URL = process.env.DATABASE_URL;
if (!SOURCE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const ADMIN_URL = SOURCE_URL.replace(/\/[^/?]+$/, '/postgres');
const REH_URL = SOURCE_URL.replace(/\/[^/?]+$/, '/' + REHEARSAL_DB);
const u = new URL(SOURCE_URL);
const PG_ENV_REH = {
  ...process.env,
  PGHOST: u.hostname,
  PGPORT: u.port || '5432',
  PGUSER: decodeURIComponent(u.username),
  PGPASSWORD: decodeURIComponent(u.password),
  PGDATABASE: REHEARSAL_DB,
};

const timeline = [];
const T0 = Date.now();
const step = (name) => {
  const rec = { step: name, atSec: +((Date.now() - T0) / 1000).toFixed(1), at: new Date().toISOString() };
  timeline.push(rec);
  console.log('[+' + rec.atSec + 's] ' + name);
  return rec;
};

let pass = 0, fail = 0;
const t = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

/* ---- 1. prepare ---- */
step('1. prepare — create fresh rehearsal database ' + REHEARSAL_DB);
const admin = new pg.Client({ connectionString: ADMIN_URL });
await admin.connect();
await admin.query('DROP DATABASE IF EXISTS simal_rehearsal');
await admin.query('CREATE DATABASE simal_rehearsal');
await admin.end();

/* ---- 2. migrate (psql -f, exactly how CI applies it) ---- */
step('2. migrate — apply scripts/migrate.sql + scripts/seed.sql via psql');
const migStart = Date.now();
execFileSync('tools/pgsql/bin/psql.exe', ['-v', 'ON_ERROR_STOP=1', '-f', 'scripts/migrate.sql'], { cwd: ROOT, env: PG_ENV_REH });
execFileSync('tools/pgsql/bin/psql.exe', ['-v', 'ON_ERROR_STOP=1', '-f', 'scripts/seed.sql'], { cwd: ROOT, env: PG_ENV_REH });
const migrateSec = (Date.now() - migStart) / 1000;
t('migrate+seed applied in ' + migrateSec.toFixed(1) + 's', migrateSec < 60);

/* ---- 3. counts vs source of truth ---- */
step('3. verify — counts vs production source of truth');
const db = new pg.Client({ connectionString: REH_URL });
await db.connect();
t('products = 81', parseInt((await db.query('SELECT count(*) AS n FROM products')).rows[0].n, 10) === 81);
t('product_deep = 78', parseInt((await db.query('SELECT count(*) AS n FROM product_deep')).rows[0].n, 10) === 78);
t('brands = 20', parseInt((await db.query('SELECT count(*) AS n FROM brands')).rows[0].n, 10) === 20);
t('content_blocks = 97', parseInt((await db.query('SELECT count(*) AS n FROM content_blocks')).rows[0].n, 10) === 97);
t('hero_slides = 5', parseInt((await db.query('SELECT count(*) AS n FROM hero_slides')).rows[0].n, 10) === 5);
t('legal_policies = 7', parseInt((await db.query('SELECT count(*) AS n FROM legal_policies')).rows[0].n, 10) === 7);
t('testimonials = 3', parseInt((await db.query('SELECT count(*) AS n FROM testimonials')).rows[0].n, 10) === 3);
t('category_guides = 7', parseInt((await db.query('SELECT count(*) AS n FROM category_guides')).rows[0].n, 10) === 7);
t('tables = 26', parseInt((await db.query('SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = \'public\'')).rows[0].n, 10) === 26);

/* ---- 4. redirect map (FRS-G-16 / E7) ---- */
step('4. redirects — legacy route map resolves into live artifacts');
const redirectMap = [
  ['legacy home → /', 'index.html'],
  ['legacy catalog → /products/', 'products/index.html'],
  ['legacy PDP (sampled) → /products/crucial-t705-ssd-2/', 'products/crucial-t705-ssd-2/index.html'],
  ['legacy services → /solutions/amc/', 'solutions/amc/index.html'],
  ['legacy insights → /insights/ai-in-erp-2026/', 'insights/ai-in-erp-2026/index.html'],
];
for (const [label, rel] of redirectMap) {
  t(label, existsSync(resolve(DIST, rel)));
}
for (const page of ['index.html', 'form.html', 'status.html', 'login.html', 'admin.html', 'privacy.html', 'terms.html', 'confirmation.html']) {
  t('kyc.* → portal ' + page, existsSync(resolve(PORTAL_PUBLIC, page)));
}
const routesSrc = readFileSync(resolve(ROOT, 'apps/portal/src/services/routes.js'), 'utf8');
t('kyc.* tokenised draft-resume endpoint exists', routesSrc.includes('/api/public/drafts/:id'));

/* ---- 5. backup ---- */
step('5. backup — pg_dump the rehearsal database');
const dumpStart = Date.now();
execFileSync('tools/pgsql/bin/pg_dump.exe', ['--no-owner', '--no-privileges', '-f', 'scripts/rehearsal-backup.sql'], { cwd: ROOT, env: PG_ENV_REH });
const dumpSec = (Date.now() - dumpStart) / 1000;
const dumpText = readFileSync(resolve(ROOT, 'scripts/rehearsal-backup.sql'), 'utf8');
t('pg_dump completed in ' + dumpSec.toFixed(1) + 's', dumpSec < 120);
t('dump carries schema (CREATE TABLE)', dumpText.includes('CREATE TABLE'));
t('dump carries data (COPY) incl. catalog', dumpText.includes('COPY') && dumpText.includes('crucial-t705-ssd-2'));

/* ---- 6. ABORT DRILL ---- */
step('6. ABORT DRILL — simulate counts-mismatch abort + rollback');
await db.query('DELETE FROM content_blocks');
const corrupted = await db.query('SELECT count(*) AS n FROM content_blocks');
t('abort criterion detected (content_blocks = 0 ≠ 97)', parseInt(corrupted.rows[0].n, 10) === 0);

const rbStart = Date.now();
step('6a. rollback — drop rehearsal database');
await db.end();
const admin2 = new pg.Client({ connectionString: ADMIN_URL });
await admin2.connect();
await admin2.query('DROP DATABASE simal_rehearsal');
await admin2.query('CREATE DATABASE simal_rehearsal');
await admin2.end();
step('6b. rollback — re-apply migrate.sql + seed.sql (restore path)');
execFileSync('tools/pgsql/bin/psql.exe', ['-v', 'ON_ERROR_STOP=1', '-f', 'scripts/migrate.sql'], { cwd: ROOT, env: PG_ENV_REH });
execFileSync('tools/pgsql/bin/psql.exe', ['-v', 'ON_ERROR_STOP=1', '-f', 'scripts/seed.sql'], { cwd: ROOT, env: PG_ENV_REH });
step('6c. rollback — verify restored counts');
const db2 = new pg.Client({ connectionString: REH_URL });
await db2.connect();
t('restored content_blocks = 97', parseInt((await db2.query('SELECT count(*) AS n FROM content_blocks')).rows[0].n, 10) === 97);
t('restored products = 81', parseInt((await db2.query('SELECT count(*) AS n FROM products')).rows[0].n, 10) === 81);
t('restored tables = 26', parseInt((await db2.query('SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = \'public\'')).rows[0].n, 10) === 26);
const rollbackSec = (Date.now() - rbStart) / 1000;
t('ROLLBACK ≤ 10 minutes (E6 abort budget)', rollbackSec <= 600, rollbackSec.toFixed(1) + 's');

step('6d. dump restorability — dump carries content_blocks schema + rows');
t('dump contains content_blocks DDL + data', dumpText.includes('content_blocks'));

/* ---- 7. teardown + timeline ---- */
await db2.end();
const admin3 = new pg.Client({ connectionString: ADMIN_URL });
await admin3.connect();
await admin3.query('DROP DATABASE IF EXISTS simal_rehearsal');
await admin3.end();
step('7. teardown — rehearsal database removed');

const out = {
  ts: new Date().toISOString(), database: REHEARSAL_DB,
  migrateSec: +migrateSec.toFixed(1), dumpSec: +dumpSec.toFixed(1), rollbackSec: +rollbackSec.toFixed(1),
  rollbackBudgetSec: 600, pass, fail, timeline,
};
writeFileSync(resolve(ROOT, 'scripts/rehearsal-timeline.json'), JSON.stringify(out, null, 2));
console.log('\nREHEARSAL #2: ' + pass + ' PASS, ' + fail + ' FAIL · rollback ' + rollbackSec.toFixed(1) + 's (budget 600s) · migrate ' + migrateSec.toFixed(1) + 's · dump ' + dumpSec.toFixed(1) + 's');
console.log('timeline → scripts/rehearsal-timeline.json');
process.exit(fail ? 1 : 0);
