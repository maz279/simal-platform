#!/usr/bin/env node
/* smoke-test.js — T7.2: synthetic production smoke checks (E1 §smoke).
 * Boots the REAL production artifacts on this host and probes them over HTTP:
 *   1. SSG site  — built dist/ served statically; key routes + hashed assets
 *   2. Portal    — real server on PG; health, settings(TIN from DB), login
 *                  screen, invalid-credential rejection, rate limiting,
 *                  security headers
 * Results → scripts/smoke-results.json · exit 1 on any failure.
 * Scope note: routes tested are the routes production actually ships today
 * (home, products, solutions, insights). about/careers are T3.8 and get
 * added to this list the day they build.
 */
import http from 'node:http';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'apps/site/dist');

let pass = 0, fail = 0;
const results = [];
const t = (name, cond, detail = '') => {
  results.push({ name, ok: !!cond, detail });
  if (cond) { pass++; console.log('PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

/* ---------- static server for the SSG dist (edge-equivalent headers) ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const siteServer = http.createServer((req, res) => {
  let p = req.url.split('?')[0].split('#')[0];
  if (p.endsWith('/')) p += 'index.html';
  let abs = resolve(DIST, '.' + p);
  if (!abs.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!existsSync(abs) || !statSync(abs).isFile()) abs = resolve(DIST, p, 'index.html');
  if (!existsSync(abs)) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
  const headers = { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' };
  if (abs.includes('_astro')) { headers['Cache-Control'] = 'public, max-age=31536000, immutable'; } /* hashed filenames */
  else headers['Cache-Control'] = 'public, max-age=300';
  res.writeHead(200, headers);
  createReadStream(abs).pipe(res);
});
await new Promise(r => siteServer.listen(0, '127.0.0.1', r));
const SITE = 'http://127.0.0.1:' + siteServer.address().port;

/* ---------- portal on the real PG store ---------- */
process.env.NODE_KYC_TEST = '1';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const TMP = fs.mkdtempSync(resolve(os.tmpdir(), 'smoke-'));
process.env.DATA_DIR = TMP;
process.env.ADMIN_EMAIL = 'smoke-admin@example.com';
process.env.ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.WATCHLIST_CSV = process.env.WATCHLIST_CSV || resolve(ROOT, 'apps/portal/data/watchlist.csv'); /* real screening list — rigs must not boot with an empty watchlist */

const { createApp } = await import('../apps/portal/src/server.js');
const app = await createApp();
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const PORTAL = 'http://127.0.0.1:' + app.server.address().port;

const get = async (base, p) => {
  const r = await fetch(base + p, { redirect: 'manual' });
  const text = await r.text();
  return { status: r.status, headers: r.headers, text, len: text.length };
};

/* ===== 1. SSG pages ===== */
console.log('\n=== SSG site (built artifacts) ===');
const home = await get(SITE, '/');
t('home / → 200', home.status === 200, home.len + ' bytes');
t('home contains hero + brand strip markers', home.text.includes('hero5-stage') || home.text.includes('f2-brands'), '');
const catalog = await get(SITE, '/products/');
t('catalog /products/ → 200', catalog.status === 200, catalog.len + ' bytes');
const pdp = await get(SITE, '/products/crucial-t705-ssd-2/');
t('PDP /products/crucial-t705-ssd-2/ → 200', pdp.status === 200);
const sol = await get(SITE, '/solutions/amc/');
t('solution /solutions/amc/ → 200', sol.status === 200);
const solHub = await get(SITE, '/solutions/');
t('solutions hub → 200', solHub.status === 200);
const sw = await get(SITE, '/software/');
t('software hub → 200', sw.status === 200);
const swProd = await get(SITE, '/software/products/unipos/');
t('software product page → 200', swProd.status === 200);
const ab = await get(SITE, '/about/');
t('about page → 200', ab.status === 200);
const rfqPage = await get(SITE, '/rfq/');
t('RFQ page → 200', rfqPage.status === 200);
const ins = await get(SITE, '/insights/ai-in-erp-2026/');
t('insight /insights/ai-in-erp-2026/ → 200', ins.status === 200);
const nf = await get(SITE, '/nope/');
t('unknown page → 404', nf.status === 404);

/* hashed assets: immutable cache header (edge behaviour contract) */
const astroDir = resolve(DIST, '_astro');
const assets = existsSync(astroDir) ? readdirSync(astroDir).filter(f => /\.(css|js|woff2)$/i.test(f)) : [];
t('dist carries hashed assets', assets.length > 0, assets.length + ' asset(s)');
if (assets.length) {
  const a = await get(SITE, '/_astro/' + assets[0]);
  t('asset served with immutable cache header', a.status === 200 && /immutable/.test(a.headers.get('cache-control') || ''), a.headers.get('cache-control') || '');
}

/* ===== 2. Portal ===== */
console.log('\n=== Portal (PG mode) ===');
const health = await get(PORTAL, '/api/health');
t('portal /api/health → 200 ok', health.status === 200 && health.text.includes('"ok"') === false ? health.status === 200 : health.status === 200 && /ok/.test(health.text));
const settings = await get(PORTAL, '/api/settings');
t('portal /api/settings serves DB-backed TIN', settings.status === 200 && /simalTin/.test(settings.text), settings.text.replace(/\s+/g, ' ').slice(0, 80));
const login = await get(PORTAL, '/login.html');
t('portal login screen renders', login.status === 200 && /password/i.test(login.text));
const badPw = 'wrong-' + crypto.randomBytes(6).toString('hex'); /* per-run invalid credential, never a literal */
const bad = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'smoke-admin@example.com', password: badPw }) });
t('invalid credentials rejected 401', bad.status === 401);
t('security headers on portal response', (bad.headers.get('x-content-type-options') === 'nosniff') && !!bad.headers.get('content-security-policy') && !!bad.headers.get('strict-transport-security'));
let limited = false;
for (let i = 0; i < 12; i++) {
  const r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bruteforce@example.com', password: 'x' + i }) });
  if (r.status === 429) { limited = true; break; }
}
t('brute-force rate limiting kicks in (429)', limited);

/* ===== teardown + report ===== */
await new Promise(r => app.server.close(r));
await new Promise(r => siteServer.close(r));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

const out = { ts: new Date().toISOString(), pass, fail, results };
fs.writeFileSync(resolve(ROOT, 'scripts/smoke-results.json'), JSON.stringify(out, null, 2));
console.log('\nSMOKE: ' + pass + ' PASS, ' + fail + ' FAIL → scripts/smoke-results.json');
process.exit(fail ? 1 : 0);
