// deploy-audit: publishing into DEPLOY_DIR never empties or replaces the docroot itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { syncDocroot } from '../../src/lib/deploy-sync.js';

const tree = (root, files) => { for (const [rel, body] of Object.entries(files)) { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); } };
const list = (root) => { const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out.push(path.relative(root, p).split(path.sep).join('/')); } }; walk(root); return out.sort(); };

test('new build replaces the old in place: same docroot, stale files and dirs removed, no temp files', () => {
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'dsync-'));
  const src = path.join(T, 'dist'), dest = path.join(T, 'www');
  tree(dest, { 'index.html': 'old', '_astro/old.123.js': 'x', 'gone/index.html': 'stale', 'about/index.html': 'old about' });
  tree(src, { 'index.html': 'new', '_astro/new.456.js': 'y', 'about/index.html': 'new about', '404.html': 'nf' });
  const before = fs.statSync(dest).ino;
  const r = syncDocroot(src, dest);
  assert.deepEqual(list(dest), ['404.html', '_astro/new.456.js', 'about/index.html', 'index.html']);
  assert.equal(fs.readFileSync(path.join(dest, 'index.html'), 'utf8'), 'new');
  assert.equal(fs.existsSync(path.join(dest, 'gone')), false, 'empty stale directory removed');
  assert.equal(fs.statSync(dest).ino, before, 'the docroot (a mount point in containers) is never removed');
  assert.deepEqual(r, { copied: 4, removed: 2 });
});

test('a build without index.html deploys nothing and leaves the live site as it was', () => {
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'dsync-'));
  const src = path.join(T, 'dist'), dest = path.join(T, 'www');
  tree(dest, { 'index.html': 'live' });
  tree(src, { 'about/index.html': 'partial' });
  assert.throws(() => syncDocroot(src, dest), /no index\.html/);
  assert.deepEqual(list(dest), ['index.html']);
});
