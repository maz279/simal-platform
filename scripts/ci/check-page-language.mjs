#!/usr/bin/env node
// scripts/ci/check-page-language.mjs — rm(9.1-1): guards SEO-1 + WCAG 2.x SC 3.1.2
// (Language of Parts) on the built site. On every <html lang="en"> page of dist, Arabic
// text must sit inside an element that declares lang="ar".
//
// Catches the defect class the rm 9.1 browser sweep found: EN pages that queried
// content_blocks without a lang filter rendered the AR twin rows (/solutions/amc/,
// /solutions/firewall/, /software/products/unipos/ were Arabic; the EN solutions hub
// listed 17 lines instead of 12). It also catches unmarked Arabic phrases, which
// screen readers read with English pronunciation rules. axe-core cannot test 3.1.2.
//
// Reads apps/site/dist (SITE_DIST overrides, relative to the repo root). Pure fs: no DB.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.resolve(REPO, process.env.SITE_DIST || 'apps/site/dist');
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]{2,}/g;
const MARKED = /<([a-z][a-z0-9]*)\b[^>]*\blang="ar(?:-[a-z]+)?"[^>]*>[\s\S]*?<\/\1>/gi;

/** Arabic words on an English page that no lang="ar" element covers. */
export function unmarkedArabic(html) {
  const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0]
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  let s = body, prev;
  do { prev = s; s = s.replace(MARKED, ' '); } while (s !== prev);
  return s.replace(/<[^>]*>/g, ' ').match(ARABIC) || [];
}

function selfTest() {
  const page = (inner) => `<html lang="en"><body><main>${inner}</main></body></html>`;
  const cases = [
    [page('<h1>عقود الصيانة السنوية (AMC)</h1>'), true],
    [page('<a href="/ar/" lang="ar">العربية</a> <span class="tag-ar" lang="ar">تحقق أصلي</span>'), false],
    [page('<div lang="ar-AE"><p>نص</p></div>'), false],
    [page('<script type="application/json">{"t":"نص عربي"}</script><p>English only</p>'), false],
  ];
  const bad = cases.filter(([h, want]) => (unmarkedArabic(h).length > 0) !== want);
  if (bad.length) {
    console.error(`check-page-language SELF-TEST FAILED (${bad.length} case(s)) — the gate would not bite`);
    process.exit(2);
  }
  console.log(`self-test: ${cases.length}/${cases.length} cases behave (unmarked Arabic caught, lang="ar" honoured)`);
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

console.log('=== GATE page-language (SEO-1, WCAG 3.1.2) ===');
selfTest();
if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error(`check-page-language: ${path.relative(REPO, DIST)}/index.html is missing — build the site first`);
  process.exit(2);
}
let en = 0;
const failures = [];
for (const f of walk(DIST)) {
  const html = readFileSync(f, 'utf8');
  if (!/<html[^>]*\blang="en"/i.test(html)) continue;
  en++;
  const words = unmarkedArabic(html);
  if (words.length) failures.push(`${path.relative(DIST, f).split(path.sep).join('/')}: ${words.length} unmarked Arabic word(s) «${words.slice(0, 6).join(' ')}»`);
}
console.log(`scanned ${en} English pages`);
if (failures.length) {
  console.error(`\nFAIL page-language: ${failures.length} English page(s) show Arabic outside a lang="ar" element`);
  for (const l of failures.slice(0, 40)) console.error('  ' + l);
  if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log('\nPASS page-language: every English page renders English content; Arabic parts are marked lang="ar"');
