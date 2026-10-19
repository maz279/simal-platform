#!/usr/bin/env node
// scripts/ci/test-chrome-blocks-e2e.mjs — rm(4.1) gate: site chrome (nav/footer/newsletter)
// blocks are CMS data — an edit through the CMS API must reach the built site.
// Boots the portal on PG, edits site/nav-menus via the API (what the #/navigation editor
// submits), builds the site against the same DB, asserts the marker, restores.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bootApp, login, scratchDatabase, adminUrlFromEnv } from './lib.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/* rm(6.3-1)/DAT-7: this gate EDITS site/nav-menus. A crash between the edit PUT and
 * the restore PUT used to leave the test label ("CMS-Driven Products 4.1") in whatever
 * database it ran against — that is exactly how the main db was polluted. The local
 * runner pins its prepared DB via E2E_DATABASE_URL (= simal_ci, freshly migrated+seeded);
 * otherwise a scratch database is provisioned and dropped below, so a bare
 * `node test-chrome-blocks-e2e.mjs` can never touch the main db again.
 * rm(9.1-3): DATABASE_URL is deliberately NOT consulted (same rule as test-cms-e2e.mjs).
 * ci.yml exports it workflow-wide at the EMPTY service database, so on the platform
 * the gate booted against an unmigrated schema; the scratch path seeds its own. */
const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = await adminUrlFromEnv();
if (!adminUrl) throw new Error('GATE_ADMIN_URL/ADMIN_DATABASE_URL is required (the simal_dev fallback was removed)');
const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'blk');
const PG_URL = explicitDb || scratch.url;
const OUT = 'dist-gate-41';

const { base, creds, stop } = await bootApp({ mode: 'pg', databaseUrl: PG_URL });
/* execSync (the astro build) freezes this process's event loop for seconds; undici's
 * keep-alive sockets go stale and the first fetch after the freeze can ECONNRESET.
 * Retry once — the product server never died (verified: next request succeeds). */
async function fetchRetry(url, opts) {
  try { return await fetch(url, opts); }
  catch (e) { if (e.cause?.code === 'ECONNRESET') { await new Promise(r => setTimeout(r, 300)); return fetch(url, opts); } throw e; }
}
let failed = 0;
try {
  const admin = await login(base, creds.adminEmail, creds.adminPassword, creds.adminTotp);
  assert.ok(admin, 'admin login');
  const H = { cookie: admin, 'content-type': 'application/json', 'x-csrf-token': (await (await fetch(base + '/api/auth/me', { headers: { cookie: admin } })).json()).csrfToken };

  // 1. read the nav block
  let r = await fetch(base + '/api/cms/blocks/site/nav-menus', { headers: { cookie: admin } });
  assert.equal(r.status, 200, 'nav-menus readable');
  const j = await r.json();
  const block = j.block || j;
  const orig = JSON.parse(JSON.stringify(block.payload));
  assert.ok(Array.isArray(orig.menus) && orig.menus.length >= 8, '8 menu labels present');

  // 2. edit (what the #/navigation editor submits)
  const patched = JSON.parse(JSON.stringify(orig));
  patched.menus[1].label = 'CMS-Driven Products 4.1';
  r = await fetch(base + '/api/cms/blocks/site/nav-menus', { method: 'PUT', headers: H, body: JSON.stringify({ payload: patched }) });
  assert.equal(r.status, 200, 'nav-menus PUT accepted');

  // 3. build against the same DB and assert the marker + the other chrome blocks
  execSync('node ' + JSON.stringify(path.join(REPO, 'node_modules', 'astro', 'astro.js')) + ' build', {
    cwd: path.join(REPO, 'apps', 'site'),
    env: { ...process.env, DATABASE_URL: PG_URL, SITE_OUT_DIR: OUT },
    stdio: 'pipe',
  });
  const html = fs.readFileSync(path.join(REPO, 'apps', 'site', OUT, 'index.html'), 'utf8');
  assert.ok(html.includes('CMS-Driven Products 4.1'), 'edited nav label reaches the built site');
  assert.ok(html.includes('Stay ahead of the Middle East IT channel'), 'newsletter block renders');
  assert.ok(html.includes('Internal SSDs'), 'footer block columns render');
  assert.ok(html.includes('☎ +971 4 393 0507'), 'utility contacts render');

  /* rm(4.2): seo/counters/awards + PUB-8 one-number proof */
  const seo = await (await fetchRetry(base + '/api/cms/blocks/site/seo-defaults', { headers: { cookie: admin } })).json();
  assert.ok((seo.block || seo).payload.title.includes('Simal'), 'seo-defaults block present');
  assert.ok(html.includes('Hikvision — Best Distributor Partner'), 'awards block renders on home');
  const brandRe = /([0-9]+) (?:Global Leaders|global IT leaders|global IT brands|brands)/g;
  const brandNums = [...html.matchAll(brandRe)].map((m) => m[1]);
  assert.ok(brandNums.length > 0, 'brand-count strings found');
  assert.ok(new Set(brandNums).size === 1, 'PUB-8: exactly ONE brand count on home (' + [...new Set(brandNums)] + ')');
  /* rm(6.1-3): one-number across the OTHER key pages too — any future divergence fails CI */
  for (const pg of ['about', 'careers', 'insights', 'onboarding']) {
    const ph = fs.readFileSync(path.join(REPO, 'apps', 'site', OUT, pg, 'index.html'), 'utf8');
    const nums = [...ph.matchAll(brandRe)].map((m) => m[1]);
    if (nums.length) {
      assert.ok(new Set(nums).size === 1 && nums[0] === brandNums[0],
        'PUB-8: /' + pg + ' brand count diverges (' + [...new Set(nums)] + ' vs home ' + brandNums[0] + ')');
    }
  }
  const ah = fs.readFileSync(path.join(REPO, 'apps', 'site', OUT, 'about', 'index.html'), 'utf8');
  assert.ok(html.includes('Hikvision — Best Distributor Partner'), 'PUB-8: awards render on home');
  assert.ok(ah.includes('Hikvision — Best Distributor Partner'), 'PUB-8: awards render on about (consistent)');
  console.log('PASS rm(4.1): chrome blocks are CMS data and reach the site');

  // 4. restore
  r = await fetchRetry(base + '/api/cms/blocks/site/nav-menus', { method: 'PUT', headers: H, body: JSON.stringify({ payload: orig }) });
  assert.equal(r.status, 200, 'nav-menus restored');
} catch (e) {
  failed = 1;
  console.error('FAIL rm(4.1):', e.message);
} finally {
  /* rm(9.1-3): Windows can hold a just-built file for a moment (EPERM/EBUSY); retry,
   * and never let cleanup overturn the verdict — the local mirror reported FAIL after
   * "PASS rm(4.1)" because this rmSync threw. */
  try { fs.rmSync(path.join(REPO, 'apps', 'site', OUT), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
  catch (e) { console.warn(`cleanup: could not remove ${OUT}: ${e.code || e.message}`); }
  await stop();
  await scratch?.drop().catch((e) => console.error('scratch db drop failed:', e.message));
}
process.exit(failed);
