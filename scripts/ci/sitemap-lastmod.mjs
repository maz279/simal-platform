// scripts/ci/sitemap-lastmod.mjs — rm(8.3) gate (guards SEO-2 residue)
// Milestone 8.3: sitemap <lastmod> must come from real content timestamps
// (B14 updated_at on products/brands/legal_policies/product_deep, plus the
// pre-existing content_blocks.updated_at), never one hardcoded constant.
//
// Flow (scratch DB only — DAT-7: never the main database):
//   1. Provision scratch DB from migrate.sql + seed.sql; assert B14 columns
//      exist and seeded rows start unstamped (fallback population).
//   2. Boot the portal against it and edit one entity of every sitemap type
//      through the real CMS API (product, product_deep via a second product,
//      brand, legal policy, insight content_block), plus a products rollback.
//   3. Build the Astro site against the scratch DB and parse sitemap.xml.
//   4. Assert: multiple distinct lastmod dates; edited entities = today (UTC);
//      untouched entities and static routes keep VERIFIED_BASE_DATE; every
//      lastmod is a valid YYYY-MM-DD date; URL inventory is complete.
//
// Env: GATE_ADMIN_URL (required) — postgres URL to a maintainable db.
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { scratchDatabase, bootApp, login, runCapture, report, pg, SITE_DIR } from './lib.mjs';

const VERIFIED_BASE_DATE = '2026-10-12';
const BASE = 'https://simalme.com';
const GATE_OUT = 'dist-gate-sitemap';
const today = new Date().toISOString().slice(0, 10);

const adminUrl = process.env.GATE_ADMIN_URL;
if (!adminUrl) {
  console.error('sitemap-lastmod: set GATE_ADMIN_URL (e.g. postgres://user:pw@host:port/postgres)');
  process.exit(2);
}

const failures = [];
const check = (name, fn) => {
  try { fn(); console.log(`  ok ${name}`); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.log(`  FAIL ${name}: ${e.message}`); }
};

const db = await scratchDatabase(adminUrl, 'sitemap');
const direct = new pg.Client({ connectionString: db.url });
await direct.connect();
let app = null;
try {
  console.log('[sitemap-lastmod] scratch db ready — verifying B14 schema…');
  const cols = await direct.query(
    `SELECT table_name FROM information_schema.columns
      WHERE column_name = 'updated_at'
        AND table_name IN ('products','brands','legal_policies','product_deep')
      ORDER BY 1`);
  check('B14 updated_at exists on products/brands/legal_policies/product_deep',
    () => assert.equal(cols.rows.length, 4, `found: ${cols.rows.map(r => r.table_name).join(',')}`));

  const seeded = await direct.query(
    `SELECT slug FROM products ORDER BY slug`);
  assert.ok(seeded.rows.length >= 3, 'seed provides >= 3 products');
  const [prodA, prodB, prodC] = seeded.rows.map(r => r.slug);
  const unstamped = await direct.query(
    `SELECT count(*)::int AS n FROM products WHERE updated_at IS NULL`);
  check('seeded products start unstamped (fallback population exists)',
    () => assert.ok(unstamped.rows[0].n >= 1, `unstamped=${unstamped.rows[0].n}`));

  const brandRow = (await direct.query(
    `SELECT slug, name FROM brands WHERE slug <> 'other' ORDER BY slug LIMIT 1`)).rows[0];
  const policyRow = (await direct.query(
    `SELECT slug, title, body FROM legal_policies WHERE lang = 'en' ORDER BY slug LIMIT 1`)).rows[0];
  const insightRow = (await direct.query(
    `SELECT entity_id FROM content_blocks WHERE entity = 'insight' AND lang = 'en' ORDER BY entity_id LIMIT 1`)).rows[0];
  assert.ok(brandRow && policyRow && insightRow, 'seed provides brand/policy/insight fixtures');

  console.log('[sitemap-lastmod] booting portal on scratch db…');
  const booted = await bootApp({ mode: 'pg', databaseUrl: db.url, mfa: false });
  app = booted;
  const cookie = await login(booted.base, booted.creds.adminEmail, booted.creds.adminPassword);
  assert.ok(cookie, 'admin login');
  const req = async (method, endpoint, body = null) => {
    const res = await fetch(booted.base + endpoint, {
      method,
      headers: { 'content-type': 'application/json', cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let data; try { data = JSON.parse(txt); } catch { data = txt; }
    return { status: res.status, data };
  };
  const recent = (v) => Number(v) > Date.now() - 10 * 60 * 1000;

  console.log('[sitemap-lastmod] editing one entity of every sitemap type via CMS API…');
  const beforeA = await req('GET', `/api/cms/products/${encodeURIComponent(prodA)}`);
  assert.equal(beforeA.status, 200);
  const updA = await req('PUT', `/api/cms/products/${encodeURIComponent(prodA)}`,
    { name: `${beforeA.data.name} [8.3 gate]` });
  check('updateProduct stamps updated_at', () => {
    assert.equal(updA.status, 200, `status ${updA.status}`);
    assert.ok(recent(updA.data.updated_at), `updated_at=${updA.data.updated_at}`);
  });

  const deepB = await req('PUT', `/api/cms/products/${encodeURIComponent(prodB)}/deep`,
    { hero: '8.3 gate deep edit' });
  check('upsertProductDeep stamps updated_at', () => {
    assert.equal(deepB.status, 200, `status ${deepB.status}`);
    assert.ok(recent(deepB.data.updated_at), `updated_at=${deepB.data.updated_at}`);
  });

  const brandUpd = await req('PUT', `/api/cms/brands/${encodeURIComponent(brandRow.slug)}`,
    { name: brandRow.name });
  check('upsertBrand stamps updated_at', () => {
    assert.equal(brandUpd.status, 200, `status ${brandUpd.status}`);
    assert.ok(recent(brandUpd.data.updated_at), `updated_at=${brandUpd.data.updated_at}`);
  });

  const polUpd = await req('PUT', `/api/cms/policies/${encodeURIComponent(policyRow.slug)}`,
    { title: policyRow.title, body: policyRow.body, lang: 'en' });
  check('upsertPolicy stamps updated_at', () => {
    assert.equal(polUpd.status, 200, `status ${polUpd.status}`);
    assert.ok(recent(polUpd.data.updated_at), `updated_at=${polUpd.data.updated_at}`);
  });

  const blockGet = await req('GET', `/api/cms/blocks/insight/${encodeURIComponent(insightRow.entity_id)}`);
  assert.equal(blockGet.status, 200);
  const blockUpd = await req('PUT', `/api/cms/blocks/insight/${encodeURIComponent(insightRow.entity_id)}`,
    { payload: blockGet.data.payload });
  check('upsertBlock keeps stamping updated_at', () => {
    assert.equal(blockUpd.status, 200, `status ${blockUpd.status}`);
    assert.ok(recent(blockUpd.data.updated_at), `updated_at=${blockUpd.data.updated_at}`);
  });

  // Rollback is itself a modification: it must re-stamp, and restore content.
  const stampBeforeRollback = Number(updA.data.updated_at);
  const rb = await req('POST', `/api/cms/revisions/products/${encodeURIComponent(prodA)}/rollback`);
  const afterRb = await req('GET', `/api/cms/products/${encodeURIComponent(prodA)}`);
  check('products rollback restores content and re-stamps updated_at', () => {
    assert.equal(rb.status, 200, `status ${rb.status}`);
    assert.equal(afterRb.data.name, beforeA.data.name);
    assert.ok(Number(afterRb.data.updated_at) >= stampBeforeRollback,
      `rollback updated_at=${afterRb.data.updated_at} < edit ${stampBeforeRollback}`);
  });

  console.log('[sitemap-lastmod] building SSG against scratch db…');
  const build = await runCapture(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build'],
    { cwd: SITE_DIR, env: { DATABASE_URL: db.url, SITE_OUT_DIR: './' + GATE_OUT }, timeoutMs: 420000 });
  if (build.code !== 0) {
    failures.push('astro build failed against scratch db:\n' + build.out.split(/\r?\n/).slice(-25).join('\n'));
  } else {
    const xml = await fsp.readFile(path.join(SITE_DIR, GATE_OUT, 'sitemap.xml'), 'utf8');
    const map = new Map();
    for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
      map.set(m[1].replace(BASE, ''), m[2]);
    }
    console.log(`[sitemap-lastmod] parsed ${map.size} urls, dates: ` +
      [...new Set(map.values())].sort().join(', '));
    check('sitemap inventory complete (>= 200 urls)', () => assert.ok(map.size >= 200, `got ${map.size}`));
    check('every lastmod is a valid YYYY-MM-DD date', () => {
      for (const [loc, d] of map) {
        assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `${loc} -> ${d}`);
        assert.ok(!Number.isNaN(Date.parse(d)), `${loc} -> ${d}`);
      }
    });
    /* deploy-audit: every hreflang alternate must be a page the sitemap lists — the generator
     * advertised an /ar/ twin for every product, brand, solution, software and insight URL. */
    check('every hreflang alternate is itself a listed URL (no dead /ar/ twins)', () => {
      const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
      const dead = [...xml.matchAll(/hreflang="(?:en|ar)" href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !locs.has(h));
      assert.equal(dead.length, 0, `${dead.length} dead alternates, e.g. ${[...new Set(dead)].slice(0, 3).join(', ')}`);
    });
    check('multiple distinct lastmod dates (done-when)', () =>
      assert.ok(new Set(map.values()).size >= 2, `dates=${[...new Set(map.values())].join(',')}`));
    /* deploy-audit: hub pages list content, so their lastmod is the newest record they list
     * (a product edit today moves /products/ and /); pages with no tracked content keep
     * VERIFIED_BASE_DATE. Before, every hub carried 2026-10-12 forever. */
    check('static non-hub route keeps VERIFIED_BASE_DATE', () =>
      assert.equal(map.get('/about/'), VERIFIED_BASE_DATE, `/about/ -> ${map.get('/about/')}`));
    check('hub lastmod follows its newest record (/products/, /)', () => {
      assert.equal(map.get('/products/'), today, `/products/ -> ${map.get('/products/')}`);
      assert.equal(map.get('/'), today, `/ -> ${map.get('/')}`);
    });
    check('edited product lastmod = today', () =>
      assert.equal(map.get(`/products/${prodA}/`), today, `${prodA} -> ${map.get(`/products/${prodA}/`)}`));
    check('product_deep edit moves product lastmod = today (GREATEST)', () =>
      assert.equal(map.get(`/products/${prodB}/`), today, `${prodB} -> ${map.get(`/products/${prodB}/`)}`));
    check('untouched product falls back to VERIFIED_BASE_DATE', () =>
      assert.equal(map.get(`/products/${prodC}/`), VERIFIED_BASE_DATE, `${prodC} -> ${map.get(`/products/${prodC}/`)}`));
    check('edited brand lastmod = today', () =>
      assert.equal(map.get(`/brands/${brandRow.slug}/`), today, `${brandRow.slug} -> ${map.get(`/brands/${brandRow.slug}/`)}`));
    check('edited legal policy lastmod = today', () =>
      assert.equal(map.get(`/legal/${policyRow.slug}/`), today, `${policyRow.slug} -> ${map.get(`/legal/${policyRow.slug}/`)}`));
    check('edited insight lastmod = today', () =>
      assert.equal(map.get(`/insights/${insightRow.entity_id}/`), today,
        `${insightRow.entity_id} -> ${map.get(`/insights/${insightRow.entity_id}/`)}`));
  }
} finally {
  if (app) await app.stop().catch(() => {});
  await direct.end().catch(() => {});
  await fsp.rm(path.join(SITE_DIR, GATE_OUT), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
  await db.drop().catch((e) => console.error('scratch db drop failed:', e.message));
}
process.exit(report('GATE sitemap-lastmod (SEO-2 residue, rm 8.3)', failures));
