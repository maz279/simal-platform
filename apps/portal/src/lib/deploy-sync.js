/* deploy-sync.js — publish a built site into the hosting docroot (DEPLOY_DIR) without a gap.
 * deploy-audit: the worker did rm -rf DEPLOY_DIR; mkdir; cp -r — the live site was empty or
 * half-copied for the length of every publish, a failed copy left it broken, and when DEPLOY_DIR
 * is a mounted volume (container deployments) removing the mount point fails outright.
 * Now: every file is written to a temp name and renamed over its target (readers see the old or
 * the new file, never a partial one); assets go first and HTML last, so a page never references
 * an asset that is not there yet; files the new build no longer has are removed at the end. */
import fs from 'node:fs';
import path from 'node:path';

function listFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(path.relative(root, p));
    }
  };
  if (fs.existsSync(root)) walk(root);
  return out;
}

/* Windows: a rename over a file another process holds open can fail briefly (EPERM/EBUSY) */
function renameWithRetry(from, to) {
  for (let i = 0; ; i++) {
    try { fs.renameSync(from, to); return; } catch (e) {
      if (i >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      const until = Date.now() + 50 * (i + 1); while (Date.now() < until) { /* short spin; sync API */ }
    }
  }
}

export function syncDocroot(srcDir, destDir) {
  if (!fs.existsSync(path.join(srcDir, 'index.html'))) throw new Error('build has no index.html — nothing deployed');
  fs.mkdirSync(destDir, { recursive: true });
  const files = listFiles(srcDir);
  const isHtml = (f) => f.toLowerCase().endsWith('.html');
  const ordered = [...files.filter((f) => !isHtml(f)), ...files.filter(isHtml)];
  const tag = '.deploy-' + process.pid + '-' + Date.now().toString(36);
  for (const rel of ordered) {
    const to = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    const tmp = to + tag;
    fs.copyFileSync(path.join(srcDir, rel), tmp);
    renameWithRetry(tmp, to);
  }
  const keep = new Set(files.map((f) => path.normalize(f)));
  let removed = 0;
  for (const rel of listFiles(destDir)) {
    if (!keep.has(path.normalize(rel))) { fs.rmSync(path.join(destDir, rel), { force: true }); removed++; }
  }
  /* drop directories the new build no longer has (deepest first) */
  const dirs = [];
  const walkDirs = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) { const p = path.join(dir, e.name); walkDirs(p); dirs.push(p); } };
  walkDirs(destDir);
  for (const d of dirs) { try { if (!fs.readdirSync(d).length) fs.rmdirSync(d); } catch { /* in use / not empty */ } }
  return { copied: ordered.length, removed };
}
