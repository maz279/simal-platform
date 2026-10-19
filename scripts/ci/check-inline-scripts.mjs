// scripts/ci/check-inline-scripts.mjs — rm(3.3-1) gate `csp-inline`, wired
// platform-wide by rm(9.1-1). Guards SEC-13: the public CSP is
// script-src 'self' (no 'unsafe-inline'), so any inline executable script
// in the SSG output is dead code in production and a regression signal.
// Scans every .html under the dist dir (SITE_DIST env, default
// apps/site/dist), skipping src= tags and JSON data blocks
// (application/json, application/ld+json). HTML comments are stripped
// first so prose mentioning script elements cannot false-positive.
// Exit 1 while any inline executable script remains.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.resolve(REPO, process.env.SITE_DIST || 'apps/site/dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`csp-inline: ${DIST} is missing — run the SSG build first.`);
  process.exit(2);
}
let n = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith('.html')) {
      const html = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/\bsrc=/.test(m[1]) || /application\/(ld\+)?json/i.test(m[1]) || !m[2].trim()) continue;
        n++;
        console.log(path.relative(REPO, f));
      }
    }
  }
})(DIST);
console.log('inline executable scripts:', n);
process.exit(n ? 1 : 0);
