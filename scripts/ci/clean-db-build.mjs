// scripts/ci/clean-db-build.mjs — P0-3(a) gate (guards DAT-1)
// Provisions a brand-new database from scripts/migrate.sql + scripts/seed.sql
// (the repo's declared source of truth) and builds the Astro site against it.
// Any missing column / missing seed row fails the build — exactly the defect
// the audit reproduced (evidence/logs/build_fresh.log: "column cta_label
// does not exist").
//
// Env: GATE_ADMIN_URL (required) — postgres URL to a maintainable db
//      (e.g. postgres://…/postgres) used to create/drop the scratch db.
import { scratchDatabase, runCapture, report, REPO, SITE_DIR } from './lib.mjs';

const adminUrl = process.env.GATE_ADMIN_URL;
if (!adminUrl) {
  console.error('clean-db-build: set GATE_ADMIN_URL (e.g. postgres://user:pw@host:port/postgres)');
  process.exit(2);
}

const db = await scratchDatabase(adminUrl, 'cdb');
/* Build into a scratch outDir: astro wipes the outDir at build start, and a
   failing DAT-1 build must not destroy the working dist/ for other gates. */
const GATE_OUT = 'dist-gate';
let code = 0;
try {
  console.log('[clean-db-build] scratch db ready — building SSG site into ' + GATE_OUT + '/ …');
  const build = await runCapture(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build'],
    { cwd: SITE_DIR, env: { DATABASE_URL: db.url, SITE_OUT_DIR: './' + GATE_OUT }, timeoutMs: 420000 }
  );
  const tail = build.out.split(/\r?\n/).slice(-25).join('\n');
  console.log(tail);
  if (build.code !== 0) {
    code = report('GATE clean-db-build (DAT-1)', [
      'astro build failed against a freshly migrated+seeded database (expected red until P2-1)',
    ], 'See the build log tail above for the failing page/column.');
  } else {
    const { promises: fsp } = await import('node:fs');
    const pathmod = await import('node:path');
    const pages = await fsp.readdir(pathmod.join(SITE_DIR, GATE_OUT), { recursive: true }).catch(() => []);
    if (pages.length < 100) {
      code = report('GATE clean-db-build (DAT-1)', [
        `build exited 0 but produced only ${pages.length} entries in ${GATE_OUT}/ — expected a full site`,
      ]);
    } else {
      code = report('GATE clean-db-build (DAT-1)', []);
    }
  }
} finally {
  await (await import('node:fs')).promises.rm(
    (await import('node:path')).join(SITE_DIR, GATE_OUT),
    { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }
  ).catch(() => {});
  await db.drop().catch((e) => console.error('scratch db drop failed:', e.message));
}
process.exit(code);
