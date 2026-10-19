#!/usr/bin/env node
// scripts/ci/facts-consistency.mjs — rm(6.1-3, wired into ci.yml by rm 9.1-1): guards PUB-8,
// one value per published fact, across EVERY page of the built site.
//
// The known reference is the <meta name="simal:*"> set BaseLayout renders from the database:
//   simal:brand-count  live brands without the 'other' catch-all (GOV a44)
//   simal:sku-count    live products (catalogue size)
//   simal:years        site/counters.years      simal:since  site/counters.since
// Every page must carry the same reference, and every brand-count, catalogue-size and
// company-age figure in dist/**/*.html (text and attributes, EN and AR) must equal it.
// The awards lists on / and /about/ must be identical (rm 6.1 Done-when).
//
// Reads apps/site/dist (SITE_DIST overrides, relative to the repo root). Pure fs: no DB.
// A self-test runs first and proves every pattern still detects a planted divergence.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.resolve(REPO, process.env.SITE_DIST || 'apps/site/dist');

// Whitespace, entities and inline tags may sit between a number and its noun
// ("<b>21</b> global vendor partners", "24<b>+</b></span><span>عاماً").
const G = String.raw`(?:\s|&nbsp;|&#160;|<[^>]{0,300}>)*`;
const NUM = String.raw`(?<![\d.,/–-])(\d{1,4})`;

/* Each rule maps a phrasing to the reference fact it must equal. Patterns stay
 * phrase-anchored so per-brand / per-category counts ("4 SKUs") never match. */
const RULES = [
  { fact: 'brand-count', re: new RegExp(NUM + G + String.raw`(?:global${G}(?:IT${G})?(?:technology${G})?(?:hardware${G})?(?:leaders|brands|vendor${G}partners)|authori[sz]ed${G}(?:brands|lines|vendor${G}lines)|vendor${G}lines|brands\b)`, 'gi') },
  { fact: 'brand-count', re: new RegExp(NUM + String.raw`-brand\b`, 'gi') },
  { fact: 'brand-count', re: new RegExp(NUM + G + String.raw`علامة`, 'g') },
  { fact: 'sku-count', re: new RegExp(NUM + String.raw`-SKU\b`, 'g') },
  { fact: 'sku-count', re: new RegExp(String.raw`(?:Search|All)${G}` + NUM + G + String.raw`SKUs\b`, 'g') },
  { fact: 'sku-count', re: new RegExp(NUM + G + String.raw`SKUs${G}(?:live|from|,${G}newest)`, 'g') },
  { fact: 'sku-count', re: new RegExp(String.raw`(?:ابحث${G}في${G})` + NUM + G + String.raw`منتجاً`, 'g') },
  { fact: 'sku-count', re: new RegExp(NUM + G + String.raw`منتجاً${G}(?:أصلياً|مع${G}التحديث)`, 'g') },
  { fact: 'years', re: new RegExp(NUM + G + String.raw`(?:\+${G})?(?:years?\b|عاماً|عامًا)`, 'gi'), skip: /\b(?:warranty|guarantee|refresh|cycles?|laptops|servers|retention|retain|kept|lease|term|contract)\b|ضمان/i },
  { fact: 'since', re: new RegExp(String.raw`(?:\bsince|منذ)${G}` + NUM, 'gi'), skip: /\bnew\s+since\b/i },
];

/** Returns the divergences of `html` against reference `ref` ({brand-count, ...}). */
export function scan(html, ref) {
  const out = [];
  for (const { fact, re, skip } of RULES) {
    re.lastIndex = 0;
    for (const m of html.matchAll(re)) {
      const value = Number(m[1]);
      if (value === ref[fact]) continue;
      // context: ~80 chars before and ~40 after the figure, tags removed (skip rules read it)
      const text = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      const before = text(html.slice(Math.max(0, m.index - 400), m.index)).slice(-80);
      const after = text(html.slice(m.index + m[0].length, m.index + m[0].length + 200)).slice(0, 40);
      if (skip && skip.test(before + text(m[0]) + after)) continue;
      out.push({ fact, value, expected: ref[fact], match: (before + text(m[0])).trim().slice(-120) });
    }
  }
  return out;
}

function referenceOf(html) {
  const get = (k) => {
    const m = html.match(new RegExp(`<meta name="simal:${k}" content="(\\d+)"`));
    return m ? Number(m[1]) : null;
  };
  const ref = { 'brand-count': get('brand-count'), 'sku-count': get('sku-count'), years: get('years'), since: get('since') };
  return Object.values(ref).some(v => v === null) ? null : ref;
}

function awardsOf(html) {
  return [...html.matchAll(/Award (\d{4})<\/span>\s*<p[^>]*>([^<]+)<\/p>/g)].map(m => `${m[1]} ${m[2].trim()}`).sort();
}

function selfTest() {
  const ref = { 'brand-count': 21, 'sku-count': 78, years: 24, since: 2002 };
  const planted = [
    ['Authorized distributor for 23 global IT brands', 'brand-count'],
    ['22 global IT hardware brands in the UAE', 'brand-count'],
    ['🤝 <b>23</b> global vendor partners', 'brand-count'],
    ['an authorized 23-brand distribution house', 'brand-count'],
    ['The portfolio spans 23 authorized brands', 'brand-count'],
    ['78 SKUs from 20 authorized brands', 'brand-count'],
    ['و22 علامة عالمية أصيلة', 'brand-count'],
    ['specified from our 81-SKU authorized portfolio', 'sku-count'],
    ['Browse All 80 SKUs', 'sku-count'],
    ['ابحث في 80 منتجاً، علامة', 'sku-count'],
    ['أكثر من 25 عاماً في توزيع', 'years'],
    ['<span class="n">25<b>+</b></span><span class="l">عاماً', 'years'],
    ['Distribution DNA</span><b>20+ years', 'years'],
    ['across UAE, GCC, MEA and CIS since 2003.', 'since'],
  ];
  const clean = 'for 21 global IT brands · 21-brand · 21 علامة · 78-SKU · Search 78 SKUs · 24+ years · since 2002 · '
    + 'Crucial · 4 SKUs · laptops 3–4 years · 5 years warranty · New since 2026';
  const misses = planted.filter(([s, fact]) => !scan(s, ref).some(v => v.fact === fact));
  const falsePos = scan(clean, ref);
  if (misses.length || falsePos.length) {
    console.error('facts-consistency SELF-TEST FAILED — the gate would not bite:');
    for (const [s] of misses) console.error('  missed planted divergence:', s);
    for (const v of falsePos) console.error('  false positive on clean text:', v.match);
    process.exit(2);
  }
  console.log(`self-test: ${planted.length}/${planted.length} planted divergences detected, clean sample passes`);
}

function walk(dir) {
  const files = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(p));
    else if (e.name.endsWith('.html')) files.push(p);
  }
  return files;
}

console.log('=== GATE facts-consistency (PUB-8, rm 6.1-3) ===');
selfTest();
if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error(`facts-consistency: ${path.relative(REPO, DIST)}/index.html is missing — build the site first`);
  process.exit(2);
}
const homeHtml = readFileSync(path.join(DIST, 'index.html'), 'utf8');
const REF = referenceOf(homeHtml);
if (!REF) {
  console.error('facts-consistency: home page has no complete <meta name="simal:*"> reference (BaseLayout)');
  process.exit(1);
}
console.log(`reference (from BaseLayout meta): brands=${REF['brand-count']} skus=${REF['sku-count']} years=${REF.years} since=${REF.since}`);

const failures = [];
const seen = { 'brand-count': 0, 'sku-count': 0, years: 0, since: 0 };
const files = walk(DIST);
let withMeta = 0;
for (const f of files) {
  const rel = path.relative(DIST, f).split(path.sep).join('/');
  const html = readFileSync(f, 'utf8');
  const ref = referenceOf(html);
  if (ref) {
    withMeta++;
    for (const k of Object.keys(REF)) {
      if (ref[k] !== REF[k]) failures.push(`${rel}: meta simal:${k}=${ref[k]} differs from the home page (${REF[k]})`);
    }
  }
  for (const { re, fact } of RULES) { re.lastIndex = 0; seen[fact] += [...html.matchAll(re)].length; }
  for (const v of scan(html, REF)) failures.push(`${rel}: ${v.fact} ${v.value} != ${v.expected}  «${v.match}»`);
}

const homeAwards = awardsOf(homeHtml);
const aboutFile = path.join(DIST, 'about', 'index.html');
const aboutAwards = existsSync(aboutFile) ? awardsOf(readFileSync(aboutFile, 'utf8')) : [];
if (!homeAwards.length) failures.push('index.html: no awards rendered');
if (JSON.stringify(homeAwards) !== JSON.stringify(aboutAwards)) {
  failures.push(`awards differ: home [${homeAwards.join(' | ')}] vs about [${aboutAwards.join(' | ')}]`);
}

console.log(`scanned ${files.length} pages (${withMeta} with the reference meta); figures checked: `
  + Object.entries(seen).map(([k, n]) => `${k} ${n}`).join(', '));
console.log(`awards: home == about (${homeAwards.length} entries: ${homeAwards.join(' | ')})`);
if (failures.length) {
  console.error(`\nFAIL facts-consistency: ${failures.length} divergence(s)`);
  for (const f of failures.slice(0, 60)) console.error('  ' + f);
  if (failures.length > 60) console.error(`  … and ${failures.length - 60} more`);
  process.exit(1);
}
console.log('\nPASS facts-consistency: every published brand count, catalogue size and company-age figure equals the reference');
