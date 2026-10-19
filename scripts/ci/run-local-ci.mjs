#!/usr/bin/env node
// scripts/ci/run-local-ci.mjs — rm(1.2-3): faithful LOCAL mirror of .github/workflows/ci.yml
// Runs every CI job in sequence against a scratch database on the dev rig's PG
// (mirroring the postgres:16 service container). Use when no CI platform is wired yet;
// the platform run remains the authoritative gate once a host remote exists.
//
//   node scripts/ci/run-local-ci.mjs            # all jobs
//   node scripts/ci/run-local-ci.mjs unit build # subset by keyword
//
// Differences vs the platform workflow (documented, deliberate):
//   - `npm ci` / `npm install` steps are skipped (dependencies already present on the rig)
//   - secrets-scan runs the vendored tools/gitleaks.exe (the platform downloads the same version)
//   - the postgres service is the local portable PG on 5433 with a scratch DB (simal_ci)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminUrlFromEnv } from './lib.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const PG = String(process.env.PGBIN || path.join(REPO, 'tools/pgsql/bin'));
/* rm(7.1-3)/DAT-9: PG runs scram-only now — every admin connection (psql, CI_DB
 * create/migrate, gate scratch databases) must carry the superuser credential
 * from ADMIN_DATABASE_URL (apps/portal/.env, gitignored). */
const ADMIN_URL = (await adminUrlFromEnv()) || 'postgres://simal@127.0.0.1:5433/postgres';
const ADMIN = String(process.env.GATE_ADMIN_URL || ADMIN_URL);
const CI_DB = 'simal_ci';
const adminOf = (db) => { const u = new URL(ADMIN_URL); u.pathname = '/' + db; return u.toString(); };
const CI_URL = adminOf(CI_DB);

const log = (...a) => console.log(...a);
// Always spawn the current node with an explicit argv (no shell, no string parsing).
const run = (name, scriptArgs, opts = {}) => {
  log(`\n>>>>>>>> ${name}: node ${scriptArgs.join(' ')}`);
  const r = spawnSync(process.execPath, scriptArgs,
    { cwd: path.resolve(REPO, opts.cwd || '.'), env: { ...process.env, ...(opts.env || {}) },
      stdio: 'inherit' });
  return r.status === 0;
};

const psql = (sql, db = 'postgres') => {
  /* rm(7.1-3): connect via the ADMIN URL (scram credential embedded) instead of
   * the old trust-auth `-U simal` flags, which stopped working with the hba switch.
   * psql wants the connection URI as the LAST argument (options first). */
  const r = spawnSync(path.join(PG, 'psql.exe'), ['-v', 'ON_ERROR_STOP=1', '-c', sql, adminOf(db)], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('psql failed: ' + (r.stderr || '').slice(0, 200));
  return r.stdout;
};

async function freshDb() {
  await psql(`DROP DATABASE IF EXISTS ${CI_DB};`);
  await psql(`CREATE DATABASE ${CI_DB};`);
  for (const f of ['scripts/migrate.sql', 'scripts/seed.sql']) {
    const r = spawnSync(path.join(PG, 'psql.exe'), ['-v', 'ON_ERROR_STOP=1', '-f', path.join(REPO, f), adminOf(CI_DB)], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`${f} failed`);
  }
  log(`[ci] ${CI_DB} migrated + seeded`);
}

const results = [];
const job = async (name, fn) => {
  if (args.length && !args.some(a => name.includes(a))) return;
  log(`\n================ JOB ${name} ================`);
  try { results.push([name, await fn()]); }
  catch (e) { log(`[ci] JOB ${name} threw: ${e.message}`); results.push([name, false]); }
};

// Windows spawnSync does not glob — expand test dirs to explicit file lists.
const testFiles = (dir) => fs.readdirSync(path.join(REPO, 'apps/portal', dir))
  .filter(f => f.endsWith('.test.js'))
  .map(f => (dir + '/' + f).replace(/\\/g, '/'));
const astroCli = path.join(REPO, 'node_modules', 'astro', 'astro.js'); // workspaces hoist astro to the root

await job('lint', () => run('eslint', ['node_modules/eslint/bin/eslint.js', '.', '--ext', '.js,.mjs']));

await job('secrets-scan', () => {
  // rm(9.1-3): the real scanner — same gitleaks 8.28.0, config and baseline as the platform
  // job (the old grep stand-in passed while the platform scan had 11 findings).
  const tracked = spawnSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8', shell: true }).stdout.split('\n');
  const badFiles = tracked.filter(f => /(^|\/)\.env$|\.pem$|(^|\/)secrets/i.test(f));
  if (badFiles.length) { log(`FAIL: tracked secret files: ${badFiles}`); return false; }
  log('\n>>>>>>>> secrets-scan: gitleaks git . --redact --config .gitleaks.toml');
  const r = spawnSync(path.join(REPO, 'tools', process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks'),
    ['git', '.', '--redact', '--no-banner', '--config', '.gitleaks.toml'], { cwd: REPO, stdio: 'inherit' });
  return r.status === 0;
});

await job('unit', () =>
  run('unit+json-integration', ['--test', ...testFiles('test/unit'), 'test/integration/api.test.js', 'test/integration/workspace.test.js'],
    { cwd: 'apps/portal', env: { NODE_KYC_TEST: '1', NODE_ENV: 'test' } }) &&
  run('feature-suites', ['--test', 'test/account-services.test.js', 'test/token-exchange.test.js', 'test/peppol-sandbox-roundtrip.test.js', 'test/rfq.test.js'],
    { cwd: 'apps/portal', env: { NODE_KYC_TEST: '1', NODE_ENV: 'test' } }));

await job('integration', async () => {
  await freshDb();
  const superuserPass = run('pg-integration', ['test/pg-integration-test.js'], { cwd: 'apps/portal', env: { DATABASE_URL: CI_URL } }) &&
    run('einvoice-immutability', ['test/einvoice-immutability.test.js'], { cwd: 'apps/portal', env: { DATABASE_URL: CI_URL } }) &&
    run('pg-mode-journey', ['test/pg-mode-journey.test.js'], { cwd: 'apps/portal', env: { DATABASE_URL: CI_URL } }) &&
    /* rm(7.2-2/7.2-3): SLA escalation + expiry reminder batch jobs (own scratch db) */
    run('batch-jobs', ['test/integration/batch-jobs.test.js'], { cwd: 'apps/portal', env: { ADMIN_DATABASE_URL: ADMIN_URL } }) &&
    /* rm(7.3-4): SEC-11 dual-approval matrix on real PG (own scratch db) */
    run('dual-approval', ['test/integration/dual-approval.test.js'], { cwd: 'apps/portal', env: { ADMIN_DATABASE_URL: ADMIN_URL } });

  /* rm(7.1-3)/DAT-9: prove the tests also pass when the app connects as the
   * least-privilege simal_app role (mirrors the ci.yml integration step).
   * The role password comes from the portal's .env DATABASE_URL so the cluster
   * credential stays in sync; prod-db-roles.sql is applied to simal_ci, then
   * pg-integration + pg-mode-journey re-run over the app-role URL. */
  const portalEnv = fs.readFileSync(path.join(REPO, 'apps/portal/.env'), 'utf8');
  const appUrlMain = (portalEnv.match(/^DATABASE_URL=(.*)$/m) || [])[1];
  if (appUrlMain) {
    const au = new URL(appUrlMain.trim());
    const appPw = decodeURIComponent(au.password);
    const buildUrlMain = (portalEnv.match(/^BUILD_DATABASE_URL=(.*)$/m) || [])[1];
    const bu = buildUrlMain ? new URL(buildUrlMain.trim()) : null;
    const roles = spawnSync(path.join(PG, 'psql.exe'), [
      '-v', 'ON_ERROR_STOP=1',
      '-v', `app_password=${appPw}`,
      ...(bu ? ['-v', `build_password=${decodeURIComponent(bu.password)}`] : []),
      '-f', path.join(REPO, 'scripts/prod-db-roles.sql'),
      adminOf(CI_DB),
    ], { encoding: 'utf8' });
    if (roles.status !== 0) throw new Error('prod-db-roles.sql failed on ' + CI_DB + ': ' + (roles.stderr || '').slice(0, 300));
    au.pathname = '/' + CI_DB;
    const appCi = au.toString();
    const adminCi = adminOf(CI_DB);
    log('\n>>>>>>>> app-role integration (simal_app over scram)');
    return superuserPass &&
      run('pg-integration-app-role', ['test/pg-integration-test.js'], { cwd: 'apps/portal', env: { DATABASE_URL: appCi, ADMIN_DATABASE_URL: adminCi } }) &&
      run('pg-mode-journey-app-role', ['test/pg-mode-journey.test.js'], { cwd: 'apps/portal', env: { DATABASE_URL: appCi, ADMIN_DATABASE_URL: adminCi } });
  }
  log('[ci] app-role integration step skipped (no DATABASE_URL in apps/portal/.env)');
  return superuserPass;
});

await job('security', () => run('security-audit', ['scripts/security-audit.js']));

await job('parity', async () => {
  await freshDb();
  return run('ssg-build-for-parity', [astroCli, 'build'], { cwd: 'apps/site', env: { DATABASE_URL: CI_URL, SITE_OUT_DIR: './dist-ci-parity' } }) &&
    run('parity-checklist', ['scripts/parity-checklist.js'], { env: { DATABASE_URL: CI_URL } });
});

await job('build', async () => {
  await freshDb();
  const ok = run('ssg-build', [astroCli, 'build'], { cwd: 'apps/site', env: { DATABASE_URL: CI_URL, SITE_OUT_DIR: './dist-ci-build' } });
  if (!ok) return false;
  const dist = path.join(REPO, 'apps/site/dist-ci-build');
  let n = 0;
  const scan = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) scan(p); else if (e.name === 'index.html') n++; } };
  scan(dist);
  log(`[ci] pages: ${n}`);
  if (n < 100) { log('FAIL: expected >=100 pages'); return false; }
  const hits = [];
  const scanContent = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) scanContent(p); else if (e.name.endsWith('.html') || e.name.endsWith('.js')) { const t = fs.readFileSync(p, 'utf8'); if (/window\.CATALOG|window\.SOFTWARE|localStorage/.test(t)) hits.push(p); } } };
  scanContent(dist);
  if (hits.length) { log('FAIL: JS globals/localStorage in output: ' + hits.slice(0, 5)); return false; }
  log('[ci] build artifact checks: clean'); return true;
});

/* rm(9.1-1): platform job gate-facts-consistency reads the build job's dist (rm 6.1-3). */
await job('gate-facts-consistency', () => run('gate-facts-consistency', ['scripts/ci/facts-consistency.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
await job('gate-clean-db-build', () => run('gate-clean-db', ['scripts/ci/clean-db-build.mjs'], { env: { GATE_ADMIN_URL: ADMIN } }));
await job('gate-authz', () => run('gate-authz', ['scripts/ci/authz-matrix.mjs']));
await job('gate-pg-reporting', async () => { await freshDb(); return run('gate-pg-reporting', ['scripts/ci/pg-reporting.mjs'], { env: { GATE_ADMIN_URL: ADMIN } }); });
await job('gate-sequences', () => run('gate-sequences', ['scripts/ci/sequences.mjs'], { env: { GATE_ADMIN_URL: ADMIN } }));
await job('gate-sitemap-lastmod', () => run('gate-sitemap-lastmod', ['scripts/ci/sitemap-lastmod.mjs'], { env: { GATE_ADMIN_URL: ADMIN } }));
await job('gate-ga4-consent', () => run('gate-ga4-consent', ['scripts/ci/ga4-consent.mjs'], { env: { GATE_ADMIN_URL: ADMIN } }));
/* platform job gate-cms-e2e runs both CMS editor -> dist e2es (rm 4.1-2) */
await job('gate-cms-e2e', async () => {
  if (!run('gate-cms-e2e', ['scripts/ci/test-cms-e2e.mjs'], { env: { GATE_ADMIN_URL: ADMIN } })) return false;
  await freshDb();
  if (!run('gate-cms-e2e/chrome-blocks', ['scripts/ci/test-chrome-blocks-e2e.mjs'], { env: { E2E_DATABASE_URL: CI_URL } })) return false;
  return run('gate-cms-e2e/cms-integrity', ['scripts/ci/test-cms-integrity.mjs'], { env: { GATE_ADMIN_URL: ADMIN } });
});
await job('gate-link-crawl', () => run('gate-link-crawl', ['scripts/ci/link-crawl.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
await job('gate-placeholders', () => run('gate-placeholders', ['scripts/ci/check-no-placeholders.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
await job('gate-perf', () => run('gate-perf', ['scripts/ci/perf-budget.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
await job('gate-csp-inline', () => run('gate-csp-inline', ['scripts/ci/check-inline-scripts.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
await job('gate-a11y', () => run('gate-a11y', ['scripts/ci/a11y.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }) &&
  run('gate-a11y/page-language', ['scripts/ci/check-page-language.mjs'], { env: { SITE_DIST: 'apps/site/dist-ci-build' } }));
/* rm(9.1-2): real Lighthouse CI against the live dist (platform job uses
 * the build artifact; locally apps/site/dist is the deployed build). */
await job('lighthouse', () => {
  log('\n>>>>>>>> lighthouse: npx --yes @lhci/cli@0.15.1 autorun');
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', '@lhci/cli@0.15.1', 'autorun'],
    { cwd: REPO, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
});

log('\n================ CI SUMMARY ================');
let fail = 0, ran = 0;
for (const [name, ok] of results) { ran++; if (!ok) fail++; log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); }
log(`${ran - fail}/${ran} jobs green`);
process.exit(fail ? 1 : 0);
