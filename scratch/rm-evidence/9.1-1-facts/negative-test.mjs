// rm(6.1-3/9.1-1) Done-when: the facts-consistency gate passes on a fresh build and FAILS
// when a stray "23 brands" is injected into a page. Copies three real pages of the built
// dist into a temp tree, plants one divergence per case, and runs the gate on it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const DIST = CB + '/apps/site/dist';
const PAGES = ['index.html', 'about/index.html', 'careers/index.html'];

const CASES = [
  ['clean copy (control)', null, 0],
  ['stray "23 brands" on /careers/', ['careers/index.html', '</h1>', '</h1><p>Join a distributor of 23 brands</p>'], 1],
  ['AR years "أكثر من 25 عاماً" on /careers/', ['careers/index.html', '</h1>', '</h1><p>أكثر من 25 عاماً</p>'], 1],
  ['page meta simal:brand-count=23 on /about/', ['about/index.html', '<meta name="simal:brand-count" content="21">', '<meta name="simal:brand-count" content="23">'], 1],
  ['award title changed on /about/ only', ['about/index.html', 'TeamGroup — Best Partner 2025</p>', 'TeamGroup — Partner of the Year</p>'], 1],
];

let fails = 0;
for (const [name, plant, want] of CASES) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'facts-neg-'));
  for (const p of PAGES) { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.copyFileSync(path.join(DIST, p), path.join(dir, p)); }
  if (plant) {
    const f = path.join(dir, plant[0]); const s = fs.readFileSync(f, 'utf8');
    if (!s.includes(plant[1])) throw new Error('anchor not found for ' + name);
    fs.writeFileSync(f, s.replace(plant[1], plant[2]));
  }
  const r = spawnSync(process.execPath, [CB + '/scripts/ci/facts-consistency.mjs'], { env: { ...process.env, SITE_DIST: dir }, encoding: 'utf8' });
  const got = r.status;
  const line = (r.stderr + r.stdout).split('\n').find((l) => /divergence|differ|!=|PASS facts/.test(l) && !/self-test/.test(l)) || '';
  const pass = want === 0 ? got === 0 : got === 1;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: gate exit ${got} (want ${want})  ${line.trim().slice(0, 150)}`);
  if (!pass) fails++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(fails ? `NEGATIVE TEST: ${fails} FAIL` : 'NEGATIVE TEST: ALL PASS (the gate bites on every planted divergence)');
process.exit(fails ? 1 : 0);
