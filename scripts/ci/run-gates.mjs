// scripts/ci/run-gates.mjs — run the P0-3 remediation gates locally in one go.
//   node scripts/ci/run-gates.mjs              # all gates
//   node scripts/ci/run-gates.mjs authz crawl  # subset by keyword
//
// GATE_ADMIN_URL is derived from apps/portal/.env DATABASE_URL (host/user
// reused, database switched to "postgres") so no credentials live here.
// Exit code is non-zero when ANY selected gate fails — which, until Phases
// 1–6 land, is the expected and desired "gates bite" state.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminUrlFromEnv } from './lib.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);

/* rm(7.1-3)/DAT-9: prefer ADMIN_DATABASE_URL — deriving the admin URL from
 * DATABASE_URL breaks now that the portal runs as the NOCREATEDB role simal_app
 * (CREATE DATABASE in clean-db/pg-reporting gates would fail). */
const adminUrl = await adminUrlFromEnv();
if (adminUrl) process.env.GATE_ADMIN_URL = adminUrl;
if (!process.env.GATE_ADMIN_URL) {
  console.error('run-gates: set GATE_ADMIN_URL (or create apps/portal/.env with ADMIN_DATABASE_URL)');
  process.exit(2);
}

const GATES = [
  ['clean-db', 'clean-db-build.mjs', 'DAT-1 clean-DB SSG build'],
  ['authz', 'authz-matrix.mjs', 'SEC-3/SEC-5 role matrix (deny by default)'],
  ['pg-reporting', 'pg-reporting.mjs', 'DAT-3/APP-1 SLA age + reports on PG'],
  ['sequences', 'sequences.mjs', 'DAT-6 sequence drift (check-only)'],
  ['sitemap', 'sitemap-lastmod.mjs', 'SEO-2 sitemap lastmod from content timestamps (rm 8.3)'],
  ['ga4', 'ga4-consent.mjs', 'SEO-5 GA4 behind consent (rm 8.4)'],
  // rm(9.1-1): the CMS editor -> dist e2es (ci.yml job gate-cms-e2e); scratch DBs only.
  ['cms-e2e', 'test-cms-e2e.mjs', 'CMS-2/3/4/9 editor→dist regression (rm 4.1-2)'],
  ['chrome-blocks', 'test-chrome-blocks-e2e.mjs', 'CMS-2 chrome blocks reach the built site (rm 4.1-2)'],
  ['cms-integrity', 'test-cms-integrity.mjs', 'CMS writes keep data: product detail, EN/AR policies, rollback, brands, media (deploy audit)'],
  ['crawl', 'link-crawl.mjs', 'PUB-3 internal link crawl of dist'],
  ['placeholders', 'check-no-placeholders.mjs', 'PUB-7 placeholder / internal strings scan'],
  ['csp-inline', 'check-inline-scripts.mjs', 'SEC-13 inline executable scripts in dist (rm 3.3-1)'],
  ['facts-consistency', 'facts-consistency.mjs', 'PUB-8 one value per published fact, every page (rm 6.1-3)'],
  ['a11y', 'a11y.mjs', 'WCAG 2.x A/AA via axe-core'],
  ['page-language', 'check-page-language.mjs', 'SEO-1/WCAG 3.1.2 English pages render English; Arabic parts marked lang="ar"'],
  ['perf', 'perf-budget.mjs', 'NFR-1 Lighthouse & CWV performance budgets'],
];

const selected = args.length ? GATES.filter(([k]) => args.some(a => k.includes(a))) : GATES;
if (!selected.length) { console.error('no gate matched', args.join(', ')); process.exit(2); }

console.log(`run-gates: ${selected.map(s => s[0]).join(', ')}  (GATE_ADMIN_URL host: ${new URL(process.env.GATE_ADMIN_URL).host})\n`);
const results = [];
for (const [key, file, label] of selected) {
  console.log(`\n>>>>>>>> ${key} — ${label}`);
  const r = spawnSync(process.execPath, [path.join(REPO, 'scripts', 'ci', file)], {
    env: process.env, stdio: 'inherit', timeout: 10 * 60 * 1000,
  });
  const code = r.status ?? 1;
  results.push([key, code]);
}

console.log('\n================ GATE SUMMARY ================');
for (const [key, code] of results) console.log(`  ${code === 0 ? 'PASS' : 'FAIL'}  ${key}`);
const failed = results.filter(([, c]) => c !== 0).length;
console.log(`==============================================`);
console.log(failed
  ? `${failed}/${results.length} gates RED — expected until Phases 1–6 close the findings (gates must bite).`
  : 'All selected gates GREEN.');
process.exit(failed ? 1 : 0);
