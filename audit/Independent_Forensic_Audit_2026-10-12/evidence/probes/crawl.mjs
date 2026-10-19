// Full-site crawler for the static public site on :8100 — pages + assets + anchors
import fs from 'node:fs';
const ORIGIN = 'http://127.0.0.1:8100';
const seen = new Map();          // url -> {status, type, size}
const refs = new Map();          // url -> Set(of pages referencing it)
const anchorsMissing = [];       // #fragment targets that don't exist
const external = new Map();      // external url -> Set(pages)
const queue = ['/'];
const pageIds = new Map();       // page path -> Set(ids)
const pageFragRefs = [];         // {from, path, frag}
function norm(u, base) {
  try { const x = new URL(u, ORIGIN + base); return x; } catch { return null; }
}
async function head(path) {
  try {
    const r = await fetch(ORIGIN + path, { redirect: 'manual' });
    const type = r.headers.get('content-type') || '';
    let body = '';
    if (type.includes('text/html')) body = await r.text(); else { const b = await r.arrayBuffer(); body = null; r._size = b.byteLength; }
    return { status: r.status, type, body, location: r.headers.get('location') };
  } catch (e) { await new Promise(r=>setTimeout(r,300)); try { const r2 = await fetch(ORIGIN + path, { redirect: "manual" }); const t2 = r2.headers.get("content-type")||""; const b2 = t2.includes("text/html") ? await r2.text() : (await r2.arrayBuffer(), null); return { status: r2.status, type: t2, body: b2, location: r2.headers.get("location") }; } catch (e2) { return { status: "ERR " + e2.message, type: "", body: "" }; } }
}
const addRef = (u, from) => { if (!refs.has(u)) refs.set(u, new Set()); refs.get(u).add(from); };
while (queue.length) {
  const batch = queue.splice(0, 2);
  await Promise.all(batch.map(async (path) => {
    if (seen.has(path)) return;
    seen.set(path, { status: 'pending' });
    let r = await head(path);
    let finalPath = path;
    if (r.status === 301 || r.status === 302) {        // follow one hop (python adds trailing slash)
      const loc = new URL(r.location, ORIGIN + path); finalPath = loc.pathname;
      seen.set(path, { status: r.status, redirect: finalPath });
      if (!seen.has(finalPath)) queue.push(finalPath);
      return;
    }
    seen.set(path, { status: r.status, type: r.type });
    if (r.status !== 200 || !r.type.includes('text/html') || !r.body) return;
    const html = r.body;
    const markup = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    const ids = new Set([...markup.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    pageIds.set(path, ids);
    const urls = [...markup.matchAll(/\s(?:href|src|action|data-src|poster)="([^"]*)"/g)].map(m => m[1])
      .concat([...markup.matchAll(/srcset="([^"]*)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+/)[0])));
    for (let raw of urls) {
      raw = raw.replace(/&amp;/g, '&');
      if (!raw || raw.startsWith('javascript:') || raw.startsWith('data:')) continue;
      if (/^(mailto|tel|whatsapp|sms):/i.test(raw) || raw.startsWith('https://wa.me')) { addRef('[scheme] ' + raw.split('?')[0], path); continue; }
      const u = norm(raw, path); if (!u) { addRef('[unparsable] ' + raw, path); continue; }
      if (u.origin !== ORIGIN) { if (!external.has(u.href)) external.set(u.href, new Set()); external.get(u.href).add(path); continue; }
      if (u.hash && u.hash.length > 1) pageFragRefs.push({ from: path, path: u.pathname, frag: decodeURIComponent(u.hash.slice(1)) });
      const p = u.pathname + (u.search || '');
      addRef(p, path);
      if (!seen.has(p) && !queue.includes(p)) queue.push(p);
    }
  }));
}
// fragment check
for (const f of pageFragRefs) {
  let target = f.path; const s = seen.get(target); if (s?.redirect) target = s.redirect;
  const ids = pageIds.get(target);
  if (ids && !ids.has(f.frag)) anchorsMissing.push(f);
}
const all = [...seen.entries()];
const pages = all.filter(([, v]) => String(v.type || '').includes('text/html') && v.status === 200);
const broken = all.filter(([, v]) => v.status !== 200 && !v.redirect);
console.log('Total URLs fetched:', all.length, ' HTML pages (200):', pages.length, ' redirects:', all.filter(([, v]) => v.redirect).length);
console.log('\n=== BROKEN (non-200) internal URLs ===');
for (const [u, v] of broken) console.log(v.status, u, ' <- referenced by', refs.get(u) ? [...refs.get(u)].slice(0, 4).join(', ') + (refs.get(u).size > 4 ? ` (+${refs.get(u).size - 4} more)` : '') : '(entry)');
const uniqMissing = new Map(); for (const f of anchorsMissing) { const k = f.path + '#' + f.frag; if (!uniqMissing.has(k)) uniqMissing.set(k, new Set()); uniqMissing.get(k).add(f.from); }
console.log('\n=== Missing #fragment targets ===');
for (const [k, s] of uniqMissing) console.log(k, ' <- ', [...s].slice(0, 3).join(', '), s.size > 3 ? `(+${s.size - 3})` : '');
console.log('\n=== Scheme links (mailto/tel/wa) ===');
for (const [u, s] of refs) if (u.startsWith('[')) console.log(u, ' pages:', s.size);
console.log('\n=== External links ===');
for (const [u, s] of external) console.log(u, ' pages:', s.size);
fs.writeFileSync('out/crawl.json', JSON.stringify({ seen: Object.fromEntries(seen), refs: Object.fromEntries([...refs].map(([k, v]) => [k, [...v]])), external: Object.fromEntries([...external].map(([k, v]) => [k, [...v]])) }, null, 1));
