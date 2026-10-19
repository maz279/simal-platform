#!/usr/bin/env node
// scripts/ci/test-cms-integrity.mjs — deploy-audit: CMS writes must never destroy or cross-
// contaminate data. Each block reproduces a defect found in the 2026-10-18 deployment audit
// through the real API on a scratch database (migrate.sql + seed.sql) and asserts the fix:
//   D05 product save must not wipe product_deep (hero/feats/use_cases/box) · docs shape
//   D06 saving one language of a legal policy must not overwrite the other; per-lang revisions
//   D07 rollback restores the CHOSEN snapshot; brands/product_deep restore; unknown table = 400
//   D08 brand save keeps counts and overview; plain-text tagline
//   D09 media uploads reach the site's public/assets/img/products
//   D22 category label rename (label-only payload) succeeds
// Scratch DB only (DAT-7): provisioned and dropped here via GATE_ADMIN_URL.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bootApp, login, scratchDatabase, adminUrlFromEnv } from './lib.mjs';

const SITE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-integrity-site-'));
process.env.SITE_DIR = SITE_DIR; // D09: uploads must land in <SITE_DIR>/public/assets/img/products

const scratch = await scratchDatabase((await adminUrlFromEnv()) || 'postgres://simal@127.0.0.1:5433/postgres', 'cmsi');
const { base, creds, stop } = await bootApp({ mode: 'pg', databaseUrl: scratch.url, mfa: false });
let pass = 0;
const ok = (name, cond, extra = '') => { assert.ok(cond, name + (extra ? ' — ' + extra : '')); pass++; console.log('  ✔ ' + name + (extra ? ' — ' + extra : '')); };

try {
  const cookie = await login(base, creds.adminEmail, creds.adminPassword);
  assert.ok(cookie, 'admin login');
  const req = async (method, url, body) => {
    const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
    return { status: r.status, data: j };
  };

  console.log('[D05] product save keeps the PDP detail');
  const slug = 'crucial-t705-ssd';
  const before = (await req('GET', `/api/cms/products/${slug}/deep`)).data;
  ok('seed product has hero + feats + use_cases', before.hero && before.feats.length > 0 && before.use_cases.length > 0,
    `hero ${before.hero.length} chars, ${before.feats.length} feats, ${before.use_cases.length} use cases`);
  // exactly what the CMS product modal sends
  let r = await req('PUT', `/api/cms/products/${slug}/deep`, { warranty_months: '60', datasheet_url: 'https://www.crucial.com/ssd/t705', specs: before.specs });
  ok('modal deep save accepted', r.status === 200, 'HTTP ' + r.status);
  const after = (await req('GET', `/api/cms/products/${slug}/deep`)).data;
  ok('hero kept', after.hero === before.hero);
  ok('feats kept', JSON.stringify(after.feats) === JSON.stringify(before.feats));
  ok('use_cases kept', JSON.stringify(after.use_cases) === JSON.stringify(before.use_cases));
  ok('warranty_months + datasheet stored', after.warranty_months === 60 && after.datasheet_url === 'https://www.crucial.com/ssd/t705');
  r = await req('PUT', `/api/cms/products/${slug}/deep`, { docs: [{ title: 'Datasheet', url: 'https://example.com/a.pdf' }] });
  const withDocs = (await req('GET', `/api/cms/products/${slug}/deep`)).data;
  ok('a docs array is stored as items (was discarded)', Array.isArray(withDocs.docs?.items) && withDocs.docs.items.length === 1, JSON.stringify(withDocs.docs).slice(0, 90));
  r = await req('PUT', `/api/cms/products/${slug}/deep`, { warranty_months: '5 years' });
  ok('non-numeric warranty_months rejected', r.status === 422, 'HTTP ' + r.status);
  r = await req('PUT', `/api/cms/products/${slug}/deep`, { datasheet_url: 'javascript:alert(1)' });
  ok('unsafe datasheet URL rejected', r.status === 422, 'HTTP ' + r.status);

  console.log('[D06] legal policies are per language');
  const enBefore = (await req('GET', '/api/cms/policies/privacy-policy?lang=en')).data;
  const arBefore = (await req('GET', '/api/cms/policies/privacy-policy?lang=ar')).data;
  ok('seed has EN and AR privacy policy', enBefore?.lang === 'en' && arBefore?.lang === 'ar');
  r = await req('PUT', '/api/cms/policies/privacy-policy?lang=en', { title: 'Privacy Policy (EN edit)', body: 'EN body edit', lang: 'en' });
  ok('EN save accepted', r.status === 200, 'HTTP ' + r.status);
  const arAfter = (await req('GET', '/api/cms/policies/privacy-policy?lang=ar')).data;
  ok('AR row untouched by the EN save', arAfter.title === arBefore.title && arAfter.body === arBefore.body, arAfter.title);
  const enRevs = (await req('GET', '/api/cms/revisions/legal_policies/' + encodeURIComponent('privacy-policy:en'))).data.revisions;
  const arRevs = (await req('GET', '/api/cms/revisions/legal_policies/' + encodeURIComponent('privacy-policy:ar'))).data.revisions;
  ok('the EN save produced an EN revision only', enRevs.length >= 1 && arRevs.length === 0, `en ${enRevs.length}, ar ${arRevs.length}`);
  r = await req('POST', '/api/cms/revisions/legal_policies/' + encodeURIComponent('privacy-policy:en') + '/rollback', { revisionId: enRevs[0].id });
  const enRolled = (await req('GET', '/api/cms/policies/privacy-policy?lang=en')).data;
  ok('EN rollback restores the EN text', r.status === 200 && enRolled.title === enBefore.title, enRolled.title);
  ok('AR still untouched after the EN rollback', (await req('GET', '/api/cms/policies/privacy-policy?lang=ar')).data.title === arBefore.title);
  r = await req('PUT', '/api/cms/policies/privacy-policy?lang=fr', { title: 'x', body: 'y', lang: 'fr' });
  ok('unknown lang rejected', r.status === 422, 'HTTP ' + r.status);

  console.log('[D07] rollback restores the chosen snapshot');
  const blockKey = 'site:counters:en';
  const c0 = (await req('GET', '/api/cms/blocks/site/counters')).data;
  const p0 = (c0.block || c0).payload;
  await req('PUT', '/api/cms/blocks/site/counters', { payload: { ...p0, years: 30 } });
  await req('PUT', '/api/cms/blocks/site/counters', { payload: { ...p0, years: 31 } });
  const revs = (await req('GET', '/api/cms/revisions/content_blocks/' + encodeURIComponent(blockKey))).data.revisions;
  const oldest = revs[revs.length - 1];
  ok('two snapshots exist', revs.length >= 2, String(revs.length));
  r = await req('POST', '/api/cms/revisions/content_blocks/' + encodeURIComponent(blockKey) + '/rollback', { revisionId: oldest.id });
  const c1 = (await req('GET', '/api/cms/blocks/site/counters')).data;
  ok('rollback restored the OLDEST snapshot, not the newest', r.status === 200 && (c1.block || c1).payload.years === p0.years, `years ${(c1.block || c1).payload.years}`);
  const brand0 = (await req('GET', '/api/cms/brands/crucial')).data;
  const b0 = brand0.brand || brand0;
  await req('PUT', '/api/cms/brands/crucial', { slug: 'crucial', name: 'Crucial EDITED' });
  const bRevs = (await req('GET', '/api/cms/revisions/brands/crucial')).data.revisions;
  r = await req('POST', '/api/cms/revisions/brands/crucial/rollback', { revisionId: bRevs[0].id });
  const b1 = (await req('GET', '/api/cms/brands/crucial')).data;
  ok('brand rollback really restores (was a no-op reporting success)', r.status === 200 && (b1.brand || b1).name === b0.name, (b1.brand || b1).name);
  const dRevs = (await req('GET', `/api/cms/revisions/product_deep/${slug}`)).data.revisions;
  r = await req('POST', `/api/cms/revisions/product_deep/${slug}/rollback`, { revisionId: dRevs[dRevs.length - 1].id });
  const d1 = (await req('GET', `/api/cms/products/${slug}/deep`)).data;
  ok('product_deep rollback restores the original detail', r.status === 200 && d1.hero === before.hero && !d1.warranty_months, 'HTTP ' + r.status);
  r = await req('POST', '/api/cms/rollback', { table: 'users', id: '1' });
  ok('rollback of an unsupported table fails loudly', r.status === 400 || r.status === 404, 'HTTP ' + r.status);

  console.log('[D08] brand save keeps counts and overview');
  const k0 = ((await req('GET', '/api/cms/brands/kingston')).data);
  const kb = k0.brand || k0;
  r = await req('PUT', '/api/cms/brands/kingston', { slug: 'kingston', name: kb.name, line: 'Memory Made Reliable.', note: kb.note });
  const kb1 = (await req('GET', '/api/cms/brands/kingston')).data;
  const k1 = kb1.brand || kb1;
  ok('counts kept (modal used to send {count:0})', JSON.stringify(k1.counts) === JSON.stringify(kb.counts), JSON.stringify(k1.counts));
  ok('overview kept and tagline plain text', k1.note === kb.note && k1.line === 'Memory Made Reliable.');
  ok('seed brand copy carries no wrapping quote marks', !/^["“]/.test(kb.line || '') && !/^["“]/.test(kb.note || ''), (kb.line || '').slice(0, 30));

  console.log('[D09] media uploads reach the site');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  r = await req('POST', '/api/cms/media/upload', { filename: 'integrity-pixel.png', dataBase64: png.toString('base64') });
  ok('upload accepted', r.status === 200 || r.status === 201, 'HTTP ' + r.status);
  const sitePath = path.join(SITE_DIR, 'public', 'assets', 'img', 'products', 'integrity-pixel.png');
  ok('site copy written under SITE_DIR/public/assets/img/products', fs.existsSync(sitePath), sitePath);

  console.log('[D22] category label rename');
  r = await req('POST', '/api/cms/categories/monitors/rename', { cat_label: 'Monitors & Displays' });
  ok('label-only rename accepted (was 422)', r.status === 200, 'HTTP ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 80));
  const prods = (await req('GET', '/api/cms/products')).data.products.filter((p) => p.cat === 'monitors');
  ok('products keep the slug and get the label', prods.length > 0 && prods.every((p) => p.cat_label === 'Monitors & Displays'), `${prods.length} monitors`);

  console.log(`\nPASS cms-integrity: ${pass} assertions`);
} catch (e) {
  console.error('\nFAIL cms-integrity:', e.message);
  process.exitCode = 1;
} finally {
  await stop();
  await scratch.drop();
  fs.rmSync(SITE_DIR, { recursive: true, force: true });
}
