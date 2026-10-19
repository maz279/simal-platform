#!/usr/bin/env node
/* freeze-manifest.js — T7.1: production code freeze seal & drift verifier.
 *
 *   node scripts/freeze-manifest.js seal    → hash every first-party source
 *                                             file + schema + DB shape into
 *                                             FREEZE_MANIFEST.json
 *   node scripts/freeze-manifest.js verify  → recompute and diff; exit 1 on
 *                                             ANY drift (CI + CAB evidence)
 *
 * Freeze policy (G4 v2.0): after seal, only SEV-1 fixes approved unanimously
 * by the CAB (PM, TL, OPS) may change these files — each such change must be
 * followed by a re-seal with a new manifest version and an audit note.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(ROOT, 'FREEZE_MANIFEST.json');
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');

/* First-party freeze scope — everything that ships or gates the release. */
const FREEZE_DIRS = [
  'apps/site/src', 'apps/site/package.json', 'apps/site/astro.config.mjs',
  'apps/portal/src', 'apps/portal/test', 'apps/portal/public', 'apps/portal/package.json',
  'packages', 'scripts', '.github/workflows',
  'scripts/migrate.sql', 'scripts/seed.sql',
  'package.json', 'eslint.config.mjs', '.gitleaksignore',
];
const SKIP_NAMES = new Set(['node_modules', 'dist', '.astro', 'coverage', '__pycache__']);
/* inside scripts/ every .json and every *-backup.sql is a GENERATED run
 * artifact (results/checklists/timelines/logs/dumps) — outputs, never freeze
 * scope; a rerun must not constitute drift. Source SQL is pinned by its own
 * explicit FREEZE_DIRS entry above. */
const SKIP_FILE = /(\.json$|-backup\.sql$)/;
/* local security-hook session baselines (the .mimosa/hook-state folders inside
 * apps sources) are tooling state, not product source — they rotate per session
 * and must not create seal drift */
const SKIP_PATH = /[\\/]\.mimosa[\\/]hook-state[\\/]/;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function collect() {
  const files = {};
  function addFile(abs) {
    files[relative(ROOT, abs).replace(/\\/g, '/')] = sha256(readFileSync(abs));
  }
  function walk(abs) {
    if (!existsSync(abs)) return;
    for (const f of readdirSync(abs, { withFileTypes: true })) {
      if (SKIP_NAMES.has(f.name)) continue;
      if (SKIP_FILE.test(f.name)) continue;
      if (SKIP_PATH.test(resolve(abs, f.name).replace(/\\/g, '/'))) continue;
      const p = resolve(abs, f.name);
      if (f.isDirectory()) walk(p);
      else addFile(p);
    }
  }
  for (const entry of FREEZE_DIRS) {
    const abs = resolve(ROOT, entry);
    if (!existsSync(abs)) continue;
    /* entries may be single files (package.json, migrate.sql…) or directories */
    try { readdirSync(abs); walk(abs); } catch { addFile(abs); }
  }
  return files;
}

async function dbShape() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const out = {};
  out.tables = parseInt((await client.query('SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = \'public\'')).rows[0].n, 10);
  out.products = parseInt((await client.query('SELECT count(*) AS n FROM products')).rows[0].n, 10);
  out.product_deep = parseInt((await client.query('SELECT count(*) AS n FROM product_deep')).rows[0].n, 10);
  out.brands = parseInt((await client.query('SELECT count(*) AS n FROM brands')).rows[0].n, 10);
  out.content_blocks = parseInt((await client.query('SELECT count(*) AS n FROM content_blocks')).rows[0].n, 10);
  out.hero_slides = parseInt((await client.query('SELECT count(*) AS n FROM hero_slides')).rows[0].n, 10);
  out.legal_policies = parseInt((await client.query('SELECT count(*) AS n FROM legal_policies')).rows[0].n, 10);
  out.testimonials = parseInt((await client.query('SELECT count(*) AS n FROM testimonials')).rows[0].n, 10);
  out.category_guides = parseInt((await client.query('SELECT count(*) AS n FROM category_guides')).rows[0].n, 10);
  out.settings = parseInt((await client.query('SELECT count(*) AS n FROM settings')).rows[0].n, 10);
  await client.end();
  return out;
}

function treeDigest(files) {
  const keys = Object.keys(files).sort();
  const h = createHash('sha256');
  for (const k of keys) h.update(k + ':' + files[k] + '\n');
  return h.digest('hex');
}

const mode = process.argv[2] || 'verify';

if (mode === 'seal') {
  const files = collect();
  const manifest = {
    version: process.env.FREEZE_VERSION || 'v1.0.0-rc1',
    sealedAt: new Date().toISOString(),
    sealedBy: process.env.FREEZE_BY || 'TL (CAB-authorized)',
    node: process.version,
    fileCount: Object.keys(files).length,
    treeDigest: treeDigest(files),
    schemaMigrateSql: sha256(readFileSync(resolve(ROOT, 'scripts/migrate.sql'))),
    database: await dbShape(),
    policy: 'SEV-1 fixes only, unanimous CAB approval (PM, TL, OPS); every post-seal change requires re-seal + audit note',
    files,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log('SEALED ' + manifest.version + ' — ' + manifest.fileCount + ' files, tree ' + manifest.treeDigest.slice(0, 16) + '…');
  console.log('schema (migrate.sql) ' + manifest.schemaMigrateSql.slice(0, 16) + '… · DB ' + JSON.stringify(manifest.database));
} else if (mode === 'verify') {
  if (!existsSync(MANIFEST_PATH)) { console.error('FAIL no FREEZE_MANIFEST.json — run: node scripts/freeze-manifest.js seal'); process.exit(1); }
  const m = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const now = collect();
  const nowDigest = treeDigest(now);
  const drift = [];
  for (const k of new Set([...Object.keys(m.files), ...Object.keys(now)])) {
    if (m.files[k] === undefined) drift.push('ADDED    ' + k);
    else if (now[k] === undefined) drift.push('REMOVED  ' + k);
    else if (m.files[k] !== now[k]) drift.push('MODIFIED ' + k);
  }
  const dbNow = await dbShape();
  const dbDrift = JSON.stringify(dbNow) !== JSON.stringify(m.database);

  console.log('freeze ' + m.version + ' sealed ' + m.sealedAt);
  console.log('tree digest : sealed ' + m.treeDigest.slice(0, 16) + '… / now ' + nowDigest.slice(0, 16) + '…');
  console.log('source drift: ' + drift.length + ' file(s)');
  for (const d of drift.slice(0, 20)) console.log('  ' + d);
  if (drift.length > 20) console.log('  … +' + (drift.length - 20) + ' more');
  console.log('db shape    : ' + (dbDrift ? 'DRIFT ' + JSON.stringify(dbNow) + ' vs sealed ' + JSON.stringify(m.database) : 'matches sealed snapshot'));
  console.log('NOTE db drift is reported, not blocking (CMS content edits are expected post-freeze); source drift IS blocking.');

  if (drift.length) {
    console.error('\nFREEZE VIOLATION — ' + drift.length + ' sealed file(s) changed without CAB-approved re-seal.');
    process.exit(1);
  }
  console.log('\nFREEZE INTACT — no sealed source file has changed.');
  process.exit(0);
} else {
  console.error('usage: node scripts/freeze-manifest.js [seal|verify]');
  process.exit(2);
}
