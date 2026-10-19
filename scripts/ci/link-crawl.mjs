// scripts/ci/link-crawl.mjs — P0-3(d) gate (guards PUB-3)
// Serves apps/site/dist through the same dev-edge static semantics as the
// audit crawler, walks every internal link/asset once, and fails on:
//   - any internal URL that does not resolve (404/5xx/network error),
//   - any internal URL containing "undefined" or "[object" (broken template),
//   - rm(6.2-2): any #fragment target (same-page, bare #x, or cross-page) that
//     does not resolve to an id on the target page — P3-9 residue, now enforced.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { listening, REPO } from './lib.mjs';

/* The gate is meaningless without a built dist — fail loudly, not oddly. */
if (!existsSync(path.join(REPO, 'apps', 'site', 'dist', 'index.html'))) {
  console.error('link-crawl: apps/site/dist is missing — run `npm run build` in apps/site (or bringup --build) first.');
  process.exit(2);
}

const PORT = Number(process.env.GATE_EDGE_PORT || 18100);
const ORIGIN = `http://127.0.0.1:${PORT}`;

/* ---- start dev-edge on the gate port ---- */
const edge = spawn(process.execPath, ['scripts/dev-edge.mjs'], {
  env: { ...process.env, PORT: String(PORT), EDGE_HOST: '127.0.0.1' },
  stdio: 'ignore',
});
let ready = false;
for (let i = 0; i < 25 && !ready; i++) { ready = await listening(PORT); if (!ready) await new Promise(r => setTimeout(r, 300)); }
if (!ready) { console.error('link-crawl: dev-edge did not start'); edge.kill('SIGKILL'); process.exit(2); }

const seen = new Map();
const refs = new Map();
const missingFrags = [];
let queue = ['/'];

async function head(p) {
  const r = await fetch(ORIGIN + p, { redirect: 'manual' }).catch((e) => ({ status: 'ERR ' + e.cause?.code, headers: new Headers() }));
  const type = r.headers?.get('content-type') || '';
  let body = null;
  if (String(r.status).startsWith('2') && type.includes('text/html')) body = await r.text().catch(() => null);
  else await r.arrayBuffer?.().catch(() => {});
  return { status: r.status, type, body, location: r.headers?.get('location') };
}

try {
  // rm(6.2-2): fragment targets are now ENFORCED (closes the P3-9 residue) — same-page,
  // bare #x, and cross-page fragments all resolve against the target page's id inventory.
  const pageIds = new Map();
  const redirects = new Map();
  const fragLinks = [];
  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    const res = await head(path);
    seen.set(path, res.status);
    if (res.status === 301 || res.status === 302) {
      const next = new URL(res.location, ORIGIN + path).pathname;
      redirects.set(path, next);
      refs.set(next, (refs.get(next) || new Set()).add(path));
      if (!seen.has(next)) queue.push(next);
      continue;
    }
    if (!res.body) continue;
    const cleanHtml = res.body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    const ids = new Set([...cleanHtml.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    pageIds.set(path, ids);
    const urls = [...cleanHtml.matchAll(/\s(?:href|src|action|data-src|poster)="([^"]*)"/g)].map(m => m[1]);
    for (let raw of urls) {
      raw = raw.replace(/&amp;/g, '&');
      if (!raw || raw.startsWith('javascript:') || raw.startsWith('data:')) continue;
      if (/^(mailto|tel|sms):/i.test(raw) || raw.startsWith('https://wa.me') || raw.startsWith('whatsapp:')) continue;
      // bare same-page fragment (#x) — resolve against this page's ids
      if (raw.startsWith('#')) {
        if (raw.length > 1) fragLinks.push({ from: path, to: path, frag: decodeURIComponent(raw.slice(1)) });
        continue;
      }
      const u = new URL(raw, ORIGIN + path);
      if (u.origin !== ORIGIN) continue;              // external — out of scope
      if (u.pathname.startsWith('/api/')) continue;   // backend routes — PUB-2's gate
      if (u.hash && u.hash.length > 1) fragLinks.push({ from: path, to: u.pathname, frag: decodeURIComponent(u.hash.slice(1)) });
      if (!seen.has(u.pathname) && !queue.includes(u.pathname)) queue.push(u.pathname);
      refs.set(u.pathname, (refs.get(u.pathname) || new Set()).add(path));
    }
  }

  const failures = [];
  for (const [p, status] of seen) {
    const s = String(status);
    if (/^2|^3/.test(s)) continue;
    const from = [...(refs.get(p) || [])].slice(0, 3).join(', ');
    failures.push(`${s} ${p}   (linked from: ${from || '—'})`);
  }
  for (const p of seen.keys()) {
    if (/undefined|\[object/i.test(p)) failures.push(`BROKEN TEMPLATE URL: ${p}`);
  }
  // resolve every fragment link against the final (post-redirect) target page's ids
  const resolveFinal = (p) => { let cur = p, guard = 0; while (redirects.has(cur) && guard++ < 10) cur = redirects.get(cur); return cur; };
  const anchorSeen = new Set();
  for (const { from, to, frag } of fragLinks) {
    const target = resolveFinal(to);
    const key = target + '#' + frag;
    if (anchorSeen.has(key)) continue;
    anchorSeen.add(key);
    const status = seen.get(target);
    if (status === undefined) continue;            // target never fetched directly — covered by the URL checks
    if (!/^2|^3/.test(String(status))) continue;   // broken target page already reported above
    const ids = pageIds.get(target) || new Set();
    if (!ids.has(frag)) {
      missingFrags.push(key);
      failures.push(`MISSING ANCHOR: ${key}   (linked from: ${from})`);
    }
  }
  console.log(`crawled ${seen.size} internal URLs; ${[...seen.values()].filter(s => !String(s).startsWith('2') && !String(s).startsWith('3')).length} non-2xx/3xx; ${missingFrags.length} missing anchors (enforced)`);
  if (missingFrags.length) console.log('missing anchors: ' + [...new Set(missingFrags)].join(', '));
  const code = require_report(failures);
  process.exit(code);
} finally {
  edge.kill('SIGKILL');
}

function require_report(failures) {
  console.log('\n=== GATE link-crawl (PUB-3) ===');
  if (!failures.length) { console.log('PASS — 0 broken internal URLs, 0 missing anchors'); return 0; }
  console.log(`FAIL — ${failures.length} broken/unresolvable internal URL(s):`);
  failures.slice(0, 60).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  if (failures.length > 60) console.log(`  … and ${failures.length - 60} more`);
  return 1;
}
