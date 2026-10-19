// scripts/ci/check-no-placeholders.mjs — P3-7 verification gate (guards PUB-7)
// Walks apps/site/dist/**/*.html and asserts 0 placeholder, internal, or content-package strings.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.resolve(REPO, process.env.SITE_DIST || 'apps/site/dist');

const FORBIDDEN_PATTERNS = [
  /publish at launch/i,
  /PRD FR-3\.3/i,
  /Mock auth/i,
  /MFA noted/i,
  /Until formally reconciled/i,
  /Arabic product copy arrives/i,
  /content package §/i,
  /content package §\d+/i,
  /PRD-[A-Z0-9]+/i,
  /FRS-[A-Z0-9]+/i,
  // rm(9.1-1): CMS fact tokens that index.astro substitutes — one reaching dist means a
  // template stopped substituting it
  /\{(?:years|brands|skus)\}/,
];

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

console.log('=== GATE check-no-placeholders (PUB-7) ===');
let htmlFiles = [];
try {
  htmlFiles = walk(DIST);
} catch (err) {
  console.error(`check-no-placeholders: Failed to read dist directory (${DIST}): ${err.message}`);
  process.exit(2);
}

let violations = [];

for (const file of htmlFiles) {
  const relPath = path.relative(DIST, file);
  const content = readFileSync(file, 'utf8');
  for (const re of FORBIDDEN_PATTERNS) {
    const match = content.match(re);
    if (match) {
      violations.push({
        file: relPath,
        pattern: re.toString(),
        match: match[0],
      });
    }
  }
}

/* rm(6.3-1)/F-2026-N011 guard: published test-fixture articles (p4-rollback-article-*)
 * must never ship in dist/insights again — the 6.2/6.3 purge removed 8 of them; this
 * fails the gate at the source instead of waiting for a crawler to notice. */
try {
  const insightsDir = path.join(DIST, 'insights');
  const fixtures = readdirSync(insightsDir).filter((e) => e.startsWith('p4-rollback-'));
  for (const fx of fixtures) {
    violations.push({ file: path.join('insights', fx), pattern: '/^p4-rollback-/', match: fx });
  }
} catch { /* dist/insights absent — nothing to guard */ }

/* rm(9.1-3 browser sweep): escape sequences rendered as text ("Dell 15 Laptop \u2013 …",
 * "HS\u2010SSD\u2010E100") — seed.sql had written them inside standard SQL strings, where
 * '\u' is not an escape. JSON data islands (<script>) legitimately contain \uXXXX, so only
 * the markup outside scripts is checked. */
const LITERAL_ESCAPE = /\\u[0-9a-fA-F]{4}/;
for (const file of htmlFiles) {
  const markup = readFileSync(file, 'utf8').replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  const m = markup.match(LITERAL_ESCAPE);
  if (m) {
    const at = markup.indexOf(m[0]);
    violations.push({ file: path.relative(DIST, file), pattern: LITERAL_ESCAPE.toString(), match: markup.slice(Math.max(0, at - 30), at + 12).replace(/\s+/g, ' ') });
  }
}

if (violations.length > 0) {
  console.error(`FAIL — Found ${violations.length} placeholder string(s) in dist:`);
  violations.forEach((v, i) => {
    console.error(`  ${i + 1}. [${v.file}] matched pattern ${v.pattern}: "${v.match}"`);
  });
  process.exit(1);
}

console.log(`PASS — Scanned ${htmlFiles.length} HTML files in dist. 0 placeholder / internal strings found.`);
process.exit(0);
