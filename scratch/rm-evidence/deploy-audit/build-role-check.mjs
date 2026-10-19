// deploy-audit H7: after prod-db-roles.sql, simal_build reads the content tables the site build
// needs (proved by a full astro build under that role) and nothing else. Scratch database.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const { scratchDatabase, adminUrlFromEnv } = await import('file:///' + CB + '/scripts/ci/lib.mjs');
const pg = createRequire(CB + '/apps/portal/package.json')('pg');
let fails = 0; const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const scratch = await scratchDatabase(await adminUrlFromEnv(), 'role');
try {
  /* INCIDENT (2026-10-18 13:58Z): roles are CLUSTER-wide — the first run passed random passwords,
   * so ALTER ROLE rotated simal_app/simal_build for the live rig database too (restored from
   * apps/portal/.env at 14:05Z, both logins verified). The rig's own passwords are passed now,
   * which makes the script's ALTER ROLE a no-op here. */
  const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
  const urlOf = (k) => new URL(((env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1] || '').trim().replace(/^["']|["']$/g, ''));
  const appPw = decodeURIComponent(urlOf('DATABASE_URL').password), buildPw = decodeURIComponent(urlOf('BUILD_DATABASE_URL').password);
  const r = spawnSync(CB + '/tools/pgsql/bin/psql.exe', ['-v', 'ON_ERROR_STOP=1', '-v', 'app_password=' + appPw, '-v', 'build_password=' + buildPw, '-q', '-f', CB + '/scripts/prod-db-roles.sql', scratch.url], { encoding: 'utf8' });
  ok('prod-db-roles.sql applied', r.status === 0, (r.stderr || '').trim().slice(0, 200));
  /* the rig's pg_hba admits simal_build only to the live database; run the session AS the role
   * instead (options=-c role=…): every privilege check then applies to simal_build */
  const u = new URL(scratch.url); u.searchParams.set('options', '-c role=simal_build');
  const c = new pg.Client({ connectionString: u.toString() }); await c.connect();
  for (const t of ['products', 'product_deep', 'brands', 'content_blocks', 'hero_slides', 'testimonials', 'category_guides', 'legal_policies', 'announcements']) {
    const q = await c.query(`SELECT count(*)::int AS n FROM ${t}`).then((x) => x.rows[0].n, (e) => e.message);
    ok('build role reads ' + t, typeof q === 'number', String(q));
  }
  for (const t of ['users', 'sessions', 'one_time_tokens', 'submissions', 'documents', 'audit_log', 'settings']) {
    const q = await c.query(`SELECT 1 FROM ${t} LIMIT 1`).then(() => 'READABLE', (e) => e.code);
    ok('build role cannot read ' + t, q === '42501', q);
  }
  await c.end();
  const out = 'dist-role-check';
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const b = spawnSync(process.execPath, [npmCli, 'run', 'build'], { cwd: CB + '/apps/site', encoding: 'utf8', env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: u.toString(), SITE_OUT_DIR: out } });
  const idx = path.join(CB, 'apps/site', out, 'index.html');
  ok('astro build as simal_build', b.status === 0 && fs.existsSync(idx), b.status === 0 ? fs.readdirSync(path.join(CB, 'apps/site', out)).length + ' entries' : (b.stderr || b.stdout || '').slice(-400));
  fs.rmSync(path.join(CB, 'apps/site', out), { recursive: true, force: true });
} finally { await scratch.drop(); }
console.log(fails ? `BUILD ROLE CHECK: ${fails} FAIL` : 'BUILD ROLE CHECK: ALL PASS');
process.exit(fails ? 1 : 0);
