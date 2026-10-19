#!/usr/bin/env node
/* parity-checklist.js — T6.2: 100% Porting Parity Verification.
 * Runs the 6-item parity gate from G1 §4. Exit 0 = pass; exit 1 = fail.
 */
import pg from 'pg';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, sep, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// unify(2026-10-19): prototype moved into the repo, so the prototype-side checks now run everywhere (CI included)
const PROTO = resolve(ROOT, 'prototype');
const DIST = resolve(ROOT, 'apps/site/dist');

let pass = 0, fail = 0;
const t = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

const client = new pg.Client({
  connectionString: (() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })(),
});
await client.connect();

/* ===== PARITY 1: Page group coverage ===== */
console.log('\n=== PARITY 1: Page Group Coverage ===');
/* The prototype lives OUTSIDE this repo (sibling directory) — present in the
 * dev workspace, absent in a CI checkout. Prototype-side checks are skipped
 * (not failed) when it is missing; every SSG/DB-side check always runs. */
const PROTO_PRESENT = existsSync(PROTO);
if (PROTO_PRESENT) {
  const protoPages = readdirSync(PROTO).filter(f => f.endsWith('.html') && f !== 'test.html');
  t('prototype has >30 page groups', protoPages.length >= 30, protoPages.length + ' HTML files');
} else {
  console.log('SKIP prototype page-group check — Prototype/ not present in this checkout (CI mode)');
}

if (existsSync(DIST)) {
  let distCount = 0;
  function walk(dir) { for (const f of readdirSync(dir, { withFileTypes: true })) { if (f.isDirectory()) walk(resolve(dir, f.name)); else if (f.name === 'index.html') distCount++; } }
  walk(DIST);
  t('SSG output >=180 pages', distCount >= 180, distCount + ' pages');

  for (const route of [
    'index.html', 'products/index.html', 'products/crucial-t705-ssd-2/index.html', 'solutions/amc/index.html', 'insights/index.html', 'insights/ai-in-erp-2026/index.html',
    /* T3.5 software tier */
    'software/index.html', 'software/products/unipos/index.html', 'software/modules/finance/index.html', 'software/services/custom-dev/index.html', 'software/solutions/i-portal/index.html', 'software/industries/healthcare/index.html',
    /* T3.8 statics + T3.4 rfq */
    'about/index.html', 'careers/index.html', 'contact/index.html', 'legal/index.html', 'legal/privacy-policy/index.html', 'rfq/index.html',
  ]) {
    t('SSG route /' + route, existsSync(resolve(DIST, route)));
  }
  t('sitemap.xml generated from PG', existsSync(resolve(DIST, 'sitemap.xml')));
} else {
  t('SSG output (dist not built — run: cd apps/site && npx astro build)', false);
}

/* ===== PARITY 2: Self-test assertion mapping (production DB) ===== */
console.log('\n=== PARITY 2: Assertion Mapping ===');
const tableCounts = (await client.query('SELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM product_deep) AS product_deep, (SELECT count(*) FROM brands) AS brands, (SELECT count(*) FROM hero_slides) AS hero_slides, (SELECT count(*) FROM legal_policies) AS legal_policies, (SELECT count(*) FROM content_blocks) AS content_blocks, (SELECT count(*) FROM testimonials) AS testimonials, (SELECT count(*) FROM category_guides) AS category_guides, (SELECT count(*) FROM settings) AS settings, (SELECT count(*) FROM pg_extension WHERE extname = \'pg_trgm\') AS pg_trgm, (SELECT count(*) FROM pg_extension WHERE extname = \'citext\') AS citext, (SELECT count(*) FROM information_schema.tables WHERE table_schema = \'public\') AS tables, (SELECT count(*) FROM settings WHERE k = \'simalTin\') AS simal_tin')).rows[0];
const N = (v) => parseInt(v, 10);

t('products = 78 (81 prototype rows − 3 U+2010 duplicate slugs)', N(tableCounts.products) === 78);
t('product_deep = 78', N(tableCounts.product_deep) === 78);
t('brands = 22 (ratified catalogue incl. zotac/pny)', N(tableCounts.brands) === 22); // rm(1.2-3)
t('hero_slides = 5', N(tableCounts.hero_slides) === 5);
t('legal_policies = 14 (7 EN + 7 AR)', N(tableCounts.legal_policies) === 14); // rm(1.2-3)
t('content_blocks = 125 (113 EN incl. 6 chrome blocks + 12 AR localization blocks)', N(tableCounts.content_blocks) === 125); // rm(6.3-1): updated for 4.1/4.2 chrome blocks + 4.5/6.1 AR set
t('settings simalTin exists', N(tableCounts.simal_tin) === 1);
t('pg_trgm active', N(tableCounts.pg_trgm) === 1);
t('citext active', N(tableCounts.citext) === 1);
t('PG tables >= 22', N(tableCounts.tables) >= 22);

const entityCounts = {};
for (const row of (await client.query('SELECT entity, count(*) AS n FROM content_blocks GROUP BY entity')).rows) {
  entityCounts[row.entity] = N(row.n);
}
t('it_solution blocks = 17', entityCounts['it_solution'] === 17); // rm(1.2-3)
t('insight blocks = 14', entityCounts['insight'] === 14);
t('software_product blocks = 23', entityCounts['software_product'] === 23); // rm(1.2-3)
t('software_module blocks = 7', entityCounts['software_module'] === 7);
t('software_service blocks = 12', entityCounts['software_service'] === 12);
t('software_solution blocks = 20', entityCounts['software_solution'] === 20);
t('software_industry blocks = 9', entityCounts['software_industry'] === 9);

/* ===== PARITY 3: Interactive islands ===== */
console.log('\n=== PARITY 3: Interactive Islands ===');
if (existsSync(DIST)) {
  const homeHtml = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  /* hero contract after the prototype-fidelity port: the stage ships with the DB
   * slide payload; the island (inline OR hoisted module — Astro bundles either way)
   * builds h5-* slides/dots at runtime (Ken Burns, ticks + fill, progress line,
   * arrows, autoplay) exactly like Prototype home.js */
  const homeScriptSrcs = [...homeHtml.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => resolve(DIST, '.' + m[1]));
  const homeJs = homeHtml + homeScriptSrcs.filter(p => existsSync(p)).map(p => readFileSync(p, 'utf8')).join('\n');
  t('hero carousel in home', homeJs.includes('hero5-stage') && homeJs.includes('data-slides'));
  t('hero numbered ticks', homeJs.includes('h5-prog') && homeJs.includes('h5-slide')); // rm(1.2-3): tick markup reworked in P6
  t('hero autoplay script', homeJs.includes('setInterval'));
  const catalogHtml = readFileSync(resolve(DIST, 'products/index.html'), 'utf8');
  /* catalog fidelity contract (category.html port): facet rail + sort chips + server-wired add */
  t('brand filter chips', catalogHtml.includes('data-b') && catalogHtml.includes('data-sort') && catalogHtml.includes('add-rfq'));
}

/* ===== PARITY 4: localStorage elimination ===== */
console.log('\n=== PARITY 4: localStorage Elimination ===');
if (existsSync(DIST)) {
  let htmlFiles = [];
  function collect(dir) { for (const f of readdirSync(dir, { withFileTypes: true })) { if (f.isDirectory()) collect(resolve(dir, f.name)); else if (f.name.endsWith('.html')) htmlFiles.push(resolve(dir, f.name)); } }
  collect(DIST);
  const bad = htmlFiles.filter(f => readFileSync(f, 'utf8').includes('localStorage'));
  t('zero localStorage in output', bad.length === 0, bad.length + '/' + htmlFiles.length + ' files');
  const badGlob = htmlFiles.filter(f => readFileSync(f, 'utf8').includes('window.CATALOG'));
  t('zero window.CATALOG in output', badGlob.length === 0);
}

/* ===== PARITY 5b: reference resolution — hrefs AND asset srcs, absolute AND relative =====
 * Audit lesson (6 Oct 2026): a href-only, leading-slash-only gate hid 161 broken
 * product images for the entire project lifetime. This gate now resolves every
 * internal reference the way a browser would: absolute from dist root,
 * relative from the referencing page's directory. */
console.log('\n=== PARITY 5b: Reference Resolution (href + src) ===');
if (existsSync(DIST)) {
  const ASSET_RE = /\.(png|jpe?g|webp|svg|gif|ico|css|js|mjs|woff2?|ttf|xml|txt|json|pdf)$/i;
  const SKIP_RE = /^(https?:|mailto:|tel:|otpauth:|data:|#|\/\/)/;
  let htmlFiles2 = [];
  function collect2(dir) { for (const f of readdirSync(dir, { withFileTypes: true })) { if (f.isDirectory()) collect2(resolve(dir, f.name)); else if (f.name.endsWith('.html')) htmlFiles2.push(resolve(dir, f.name)); } }
  collect2(DIST);
  const brokenLinks = new Map();
  const brokenAssets = new Map();
  for (const file of htmlFiles2) {
    const raw = readFileSync(file, 'utf8');
    /* islands build DOM at runtime — hrefs inside <script> bodies are JS template
     * fragments, not static references; scan markup only */
    const txt = raw.replace(/<script[\s\S]*?<\/script>/g, '');
    const dir = dirname(file);
    for (const m of txt.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
      const raw = m[1];
      if (SKIP_RE.test(raw)) continue;
      const from = relative(DIST, file).split(sep).join('/');
      if (ASSET_RE.test(raw)) {
        /* asset reference: browser resolves relative refs against the page dir */
        const abs = raw.startsWith('/') ? resolve(DIST, '.' + raw) : resolve(dir, raw);
        if (!existsSync(abs)) brokenAssets.set(from + ' → ' + raw, true);
      } else {
        /* internal link (page, not asset): root-absolute from dist, relative from page dir.
         * Audit lesson (visual check, Oct 2026): hero CTAs carried prototype-relative
         * "category.html" hrefs that only resolve relative — the leading-slash-only
         * branch let all five through. Relative page links now resolve like a browser. */
        let p = raw;
        if (p.endsWith('/')) p += 'index.html';
        else if (!/\.[a-z0-9]+$/i.test(p)) p += '/index.html';
        const abs = raw.startsWith('/') ? resolve(DIST, '.' + p) : resolve(dir, p);
        if (!existsSync(abs)) brokenLinks.set(from + ' → ' + raw, true);
      }
    }
  }
  const linkList = [...brokenLinks.keys()];
  const assetList = [...brokenAssets.keys()];
  t('zero broken internal links', linkList.length === 0, linkList.slice(0, 8).join(' | ') || 'all internal hrefs resolve');
  t('zero broken asset references (src, relative included)', assetList.length === 0, assetList.slice(0, 8).join(' | ') || 'all asset srcs resolve');
}

/* ===== PARITY 5c: solution pages carry full deep content (anti-stub gate) ===== */
/* A CMS edit or stale seed can drop the what/scope/process/faq payload — pages then
 * render as near-empty stubs (seen once: "AMC v2 via CMS" test residue). Every seeded
 * it_solution record ships scope+process+faq, so each rendered detail page must show
 * all four sections. */
console.log('\n=== PARITY 5c: Solution Deep Content ===');
if (existsSync(DIST)) {
  const solDir = resolve(DIST, 'solutions');
  const stubbed = [];
  let solPages = 0;
  if (existsSync(solDir)) {
    for (const f of readdirSync(solDir, { withFileTypes: true })) {
      if (!f.isDirectory()) continue;
      const htmlPath = resolve(solDir, f.name, 'index.html');
      if (!existsSync(htmlPath)) continue;
      solPages++;
      const txt = readFileSync(htmlPath, 'utf8');
      const missing = [];
      if (!txt.includes('What this solution is')) missing.push('what');
      if (!txt.includes('Scope &amp; deliverables') && !txt.includes('Scope & deliverables')) missing.push('scope');
      if (!txt.includes('How an engagement runs')) missing.push('process');
      if (!txt.includes('Common questions')) missing.push('faq');
      if (missing.length > 0) stubbed.push(f.name + ' missing: ' + missing.join('+'));
    }
  }
  t('solution detail pages rendered', solPages >= 12, solPages + ' pages');
  t('zero stubbed solution pages (what/scope/process/faq all present)', stubbed.length === 0, stubbed.slice(0, 6).join(' | ') || 'all solution pages carry full deep content');
}

/* ===== PARITY 5: Cross-link graph ===== */
console.log('\n=== PARITY 5: Cross-Link Graph ===');
if (existsSync(DIST)) {
  let totalLinks = 0;
  function countLinks(dir) { for (const f of readdirSync(dir, { withFileTypes: true })) { if (f.isDirectory()) countLinks(resolve(dir, f.name)); else if (f.name.endsWith('.html')) { totalLinks += (readFileSync(resolve(dir, f.name), 'utf8').match(/href="/g) || []).length; } } }
  countLinks(DIST);
  t('cross-link graph >= 1000', totalLinks >= 1000, totalLinks + ' links');
}

/* ===== PARITY 6: Content counts ===== */
console.log('\n=== PARITY 6: Content Counts ===');
const totalRows = N(tableCounts.products) + N(tableCounts.product_deep) + N(tableCounts.brands) +
  N(tableCounts.content_blocks) + N(tableCounts.hero_slides) + N(tableCounts.legal_policies) +
  N(tableCounts.testimonials) + N(tableCounts.category_guides) + N(tableCounts.settings);
t('total seeded rows >= 290', totalRows >= 290, totalRows + ' rows');

/* ===== Summary ===== */
console.log('\n' + '='.repeat(60));
console.log('PARITY CHECKLIST: ' + pass + ' PASS, ' + fail + ' FAIL (' + (pass + fail) + ' total)');
console.log(fail === 0 ? 'ALL PARITY CHECKS PASS' : fail + ' items FAILED');
console.log('='.repeat(60));

await client.end();
process.exit(fail ? 1 : 0);
