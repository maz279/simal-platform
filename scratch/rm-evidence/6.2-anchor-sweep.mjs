// rm(6.2): unique (target#frag) anchor sweep over the built dist.
// Checks every internal href with a fragment resolves to an existing page with id=/name= match.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'apps/site/dist');
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) files.push(p);
  }
})(dist);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const missing = new Map();
const checked = new Set();

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="([^"#]+#[^"]+|#[^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:)/.test(url)) continue;
    const hashIdx = url.indexOf('#');
    const p = url.slice(0, hashIdx);
    const frag = url.slice(hashIdx + 1).split('?')[0];
    if (!frag) continue;
    let target;
    if (!p) target = f;
    else {
      let clean = p.split('?')[0];
      if (clean.endsWith('/')) clean += 'index.html';
      else if (!clean.endsWith('.html')) clean += '/index.html';
      target = path.join(dist, clean.replace(/^\//, ''));
    }
    const key = (p || '(self)') + '#' + frag;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!fs.existsSync(target)) {
      missing.set(key, 'TARGET PAGE MISSING');
      continue;
    }
    const t = fs.readFileSync(target, 'utf8');
    if (!new RegExp('(id|name)="' + esc(frag) + '"').test(t)) missing.set(key, 'FRAG NOT FOUND');
  }
}

console.log('pages:', files.length, '| unique target#frag links:', checked.size);
if (missing.size) {
  for (const [k, v] of missing) console.log('MISSING:', k, '—', v);
  process.exit(1);
}
console.log('ALL ANCHORS RESOLVE: 0 missing');
