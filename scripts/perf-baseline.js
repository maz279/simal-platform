#!/usr/bin/env node
/* perf-baseline.js — T6.5 run 1 (baseline, single-user lab rig).
 * D4 budgets measured here: DB query p95 < 50 ms (top-10 queries),
 * API read p95 < 200 ms (local, no edge). Build time and LCP are
 * measured in CI/build steps and recorded in the report, not here.
 * Load-shaped runs (50 rps, k6) are the formal D4 rig — see D4 §2.
 */
import pg from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const ITER = 50;      // DB samples per query
const API_N = 200;    // API samples per endpoint

function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p / 100))];
}
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();

/* ---- Part A: top-10 queries (the ones the 109 SSG pages + portal run).
 * Each benchmark carries its own literal SQL — no interpolated values. */
const dbRows = [];
async function benchDb(name, fn) {
  const times = [];
  for (let i = 0; i < ITER; i++) {
    const t0 = process.hrtime.bigint();
    await fn();
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  dbRows.push({ name, p50: +pct(times, 50).toFixed(2), p95: +pct(times, 95).toFixed(2), avgMs: +avg(times).toFixed(2) });
}

await benchDb('home: hero slides', () => client.query('SELECT * FROM hero_slides WHERE active = true ORDER BY idx'));
await benchDb('home: testimonials', () => client.query('SELECT * FROM testimonials WHERE active = true ORDER BY id LIMIT 8'));
await benchDb('catalog: products list', () => client.query('SELECT slug, name, brand, cat, short, imgs FROM products ORDER BY cat, name'));
await benchDb('catalog: brands', () => client.query('SELECT slug, name, counts FROM brands ORDER BY name'));
await benchDb('PDP: product by slug', () => client.query('SELECT * FROM products WHERE slug = $1', ['crucial-t705-ssd-2']));
await benchDb('PDP: deep record', () => client.query('SELECT * FROM product_deep WHERE slug = $1', ['crucial-t705-ssd-2']));
await benchDb('search: trgm typo', () => client.query("SELECT slug, name FROM products WHERE name % 'crucail t705' ORDER BY similarity(name, 'crucail t705') DESC LIMIT 12"));
await benchDb('solutions: blocks', () => client.query("SELECT * FROM content_blocks WHERE entity = 'it_solution' ORDER BY id"));
await benchDb('insights: blocks', () => client.query("SELECT * FROM content_blocks WHERE entity = 'insight' ORDER BY id"));
await benchDb('legal: policies', () => client.query('SELECT slug, title, version FROM legal_policies ORDER BY slug'));
await client.end();

/* ---- Part B: portal API read endpoints (PG mode, in-process server) ---- */
process.env.NODE_KYC_TEST = '1';
process.env.DATABASE_URL = DB_URL;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
process.env.DATA_DIR = TMP;
process.env.ADMIN_EMAIL = 'perf-admin@example.com';
process.env.ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');

const { createApp } = await import('../apps/portal/src/server.js');
const app = await createApp();
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

const apiRows = [];
async function benchApi(name, p) {
  const times = [];
  for (let i = 0; i < API_N; i++) {
    const t0 = process.hrtime.bigint();
    const r = await fetch(BASE + p);
    await r.arrayBuffer();
    times.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  apiRows.push({ name, p50: +pct(times, 50).toFixed(1), p95: +pct(times, 95).toFixed(1), avgMs: +avg(times).toFixed(1) });
}

await benchApi('GET /api/health', '/api/health');
await benchApi('GET /api/settings', '/api/settings');
await benchApi('GET /api/public/invites/NOCODE', '/api/public/invites/NOCODE');

await new Promise(r => app.server.close(r));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

/* ---- Report (fixed filename; the payload carries the timestamp) ---- */
const dbP95max = Math.max(...dbRows.map(r => r.p95));
const apiP95max = Math.max(...apiRows.map(r => r.p95));
const out = {
  ts: new Date().toISOString(), rig: 'local single-user lab (formal k6 rig per D4 §2 pending)',
  db: { budgetP95Ms: 50, worstP95Ms: dbP95max, pass: dbP95max < 50, rows: dbRows },
  api: { budgetP95Ms: 200, worstP95Ms: apiP95max, pass: apiP95max < 200, rows: apiRows },
};
fs.writeFileSync(path.resolve('scripts/perf-results-latest.json'), JSON.stringify(out, null, 2));

console.log('\n=== T6.5 Performance Baseline — Run 1 (lab) ===');
console.log('\nDB queries (budget p95 < 50 ms):');
for (const r of dbRows) console.log(String(r.p95).padStart(7) + ' ms p95  ' + String(r.p50).padStart(7) + ' ms p50  ' + r.name);
console.log('\nAPI reads (budget p95 < 200 ms):');
for (const r of apiRows) console.log(String(r.p95).padStart(7) + ' ms p95  ' + String(r.p50).padStart(7) + ' ms p50  ' + r.name);
console.log('\nDB pass: ' + (out.db.pass ? 'YES (worst p95 ' + dbP95max + ' ms)' : 'NO (worst p95 ' + dbP95max + ' ms)'));
console.log('API pass: ' + (out.api.pass ? 'YES (worst p95 ' + apiP95max + ' ms)' : 'NO (worst p95 ' + apiP95max + ' ms)'));
process.exit(out.db.pass && out.api.pass ? 0 : 1);
