#!/usr/bin/env node
// scripts/github-mirror.mjs — one-shot GitHub mirror setup (unify, 2026-10-19).
//
// GitHub cannot receive the full 113-commit history: commits ee69382..3d7f43e carry
// vendored ClamAV payloads (clamav_rust.lib 292MB, four ~111MB .pdb) above GitHub's
// hard 100MB blob limit, and removing them means rewriting history — declined
// because the audit corpus cites commit hashes. Full hash-preserving history stays
// authoritative on `origin` (bare) and `platform` (Gitea). This script instead
// pushes a parentless import commit whose TREE IS IDENTICAL to main's tip.
//
// Prereq (interactive, once):  gh auth login
// Then:                        node scripts/github-mirror.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GH_TARGET = 'maz279/simal-platform';
const GH_URL = `https://github.com/${GH_TARGET}.git`;
const DESC = 'Simal corporate website + KYC/e-invoicing platform — unified repo (apps, audit corpus, governance docs, prototype, UX, content)';
const TOPICS = 'astro,postgresql,kyc,cms,ua-e-invoicing';

const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: REPO, encoding: 'utf8', shell: process.platform === 'win32', ...opts });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};

// Portable gh downloaded during unification (MSI installer was blocked by a stale
// Windows Installer mutex) — prefer PATH, fall back to the known location.
const ghPortable = path.resolve(REPO, '..', 'downloads', 'gh-cli', 'bin', 'gh.exe');
const ghBin = fs.existsSync(ghPortable) ? ghPortable : 'gh';

const die = (msg) => { console.error('ERROR: ' + msg); process.exit(1); };

// 1. auth check — must be done interactively beforehand
const auth = sh(ghBin, ['auth', 'status']);
if (auth.code !== 0) die('not authenticated — run:  gh auth login   (or set GH_TOKEN to a fine-grained PAT with repo scope)');

// 2. credential helper for the https push
sh(ghBin, ['auth', 'setup-git']);

// 3. create the private repo (tolerate "already exists")
let cr = sh(ghBin, ['repo', 'create', GH_TARGET, '--private', `--description=${DESC}`]);
if (cr.code !== 0 && !/already exists/i.test(cr.out)) die('repo create failed: ' + cr.out.trim().slice(0, 200));
console.log(cr.code === 0 ? `created private repo ${GH_TARGET}` : `repo ${GH_TARGET} already exists`);

// 4. snapshot commit: same tree as main tip, no parent, provenance in the message
const tip = sh('git', ['rev-parse', 'main']).out.trim();
if (!/^[0-9a-f]{40}$/.test(tip)) die('cannot resolve main');
const msg =
  'import: simal-platform unified repository (content snapshot)\n\n' +
  `Tree is identical to the authoritative main tip ${tip.substring(0, 12)} on the\n` +
  'origin (bare) and platform (Gitea) remotes. GitHub receives this parentless\n' +
  'snapshot because history commits ee69382..3d7f43e carry vendored ClamAV blobs\n' +
  '(292MB .lib + ~111MB .pdb) above the 100MB hard limit; rewriting history was\n' +
  'declined to preserve the commit hashes cited by the audit corpus. See\n' +
  'docs/BRANCH_PROTECTION.md (UPDATE 2026-10-19) for the full rationale.\n\n' +
  'Fast-forward pushes to this branch are possible from a8e981d onward (the\n' +
  'oversized payloads left the tree there); this import simply starts the branch.';
const snap = sh('git', ['commit-tree', `main^{tree}`, '-m', msg]).out.trim();
if (!/^[0-9a-f]{40}$/.test(snap)) die('commit-tree failed: ' + snap.slice(0, 200));
console.log('snapshot commit ' + snap.substring(0, 12) + ' (tree of ' + tip.substring(0, 12) + ')');

// 5. remote + push
const remotes = sh('git', ['remote']).out.split('\n');
if (!remotes.includes('github')) sh('git', ['remote', 'add', 'github', GH_URL]);
else sh('git', ['remote', 'set-url', 'github', GH_URL]);
const push = sh('git', ['push', 'github', `${snap}:refs/heads/main`]);
if (push.code !== 0) die('push failed: ' + push.out.trim().slice(0, 400));
console.log('pushed snapshot to github/main');

// 6. topics + keep Actions disabled (CI authority stays on the platform runner)
const topicArgs = ['-X', 'PUT', 'repos/' + GH_TARGET + '/topics'];
for (const t of TOPICS.split(',')) topicArgs.push('-f', 'names[]=' + t);
sh(ghBin, ['api', ...topicArgs]); // best-effort; silent
const acts = sh(ghBin, ['api', '-X', 'PUT', `repos/${GH_TARGET}/actions/permissions`, '-F', 'enabled=false', '-F', 'allowed_actions=none']);
console.log(acts.code === 0 ? 'GitHub Actions disabled (CI authority: platform runner)' : 'note: could not disable Actions — run: gh api -X PUT repos/' + GH_TARGET + '/actions/permissions -F enabled=false');

console.log('\nDONE → https://github.com/' + GH_TARGET + '  (private)');
