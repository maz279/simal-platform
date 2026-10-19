// rm(9.1-3 browser sweep): 9 product names carried LITERAL escape text ("\u2013",
// "\u2010", "\u2033") — seed.sql wrote them inside standard SQL strings, where '\u' is not
// an escape — so PDPs, cards, titles and breadcrumbs showed "Dell 15 Laptop \u2013 …".
// Decodes them through the CMS API (revision + audit row per product), then publishes.
// Model numbers use ASCII hyphens (HS-SSD-E100) so search and copy-paste work.
// Reads staff credentials from apps/portal/.env; prints no secrets. Idempotent.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const PORTAL = 'http://127.0.0.1:8090';
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('kyc_sid='));
let fails = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++; };
export const decode = (s) => String(s)
  .replace(/\\u2010/g, '-')
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

let r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
let cookie = cookieOf(r); let d = await r.json();
if (d.mfaChallengeId) {
  r = await fetch(PORTAL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json', cookie: cookie || '' },
    body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) });
  cookie = cookieOf(r) || cookie; d = await r.json();
}
const me = await (await fetch(PORTAL + '/api/auth/me', { headers: { cookie } })).json();
ok('admin session', !!me.csrfToken, me.user?.role || me.role);
const H = { 'content-type': 'application/json', cookie, 'x-csrf-token': me.csrfToken };

const list = await (await fetch(PORTAL + '/api/cms/products', { headers: { cookie } })).json();
const products = list.products || list.items || list;
ok('product list', Array.isArray(products), `${products.length} products`);
const ESC = /\\u[0-9a-fA-F]{4}/;
const bad = products.filter((p) => ESC.test(p.name || '') || ESC.test(p.short || '') || ESC.test(p.sku || ''));
console.log(`products with literal escapes: ${bad.length}`);
const entities = [];
for (const p of bad) {
  const patch = {};
  for (const k of ['name', 'short', 'sku']) if (ESC.test(p[k] || '')) patch[k] = decode(p[k]);
  r = await fetch(`${PORTAL}/api/cms/products/${encodeURIComponent(p.slug)}`, { method: 'PUT', headers: H, body: JSON.stringify(patch) });
  const after = (await r.json()).product || {};
  ok(`PUT ${p.slug}`, r.status === 200 && !ESC.test(after.name ?? patch.name), JSON.stringify(patch).slice(0, 110));
  entities.push({ entity: 'products', entity_id: p.slug });
}
if (entities.length) {
  const t0 = Date.now();
  r = await fetch(PORTAL + '/api/cms/publish', { method: 'POST', headers: H, body: JSON.stringify({ entities }) });
  const pub = await r.json();
  ok('publish accepted', r.status === 200 || r.status === 202, `HTTP ${r.status} outbox=${pub.outboxId}`);
  let status = 'queued';
  for (let i = 0; i < 100 && !['processed', 'failed'].includes(status); i++) {
    await new Promise((res) => setTimeout(res, 3000));
    const { outbox } = await (await fetch(PORTAL + '/api/cms/outbox?limit=20', { headers: { cookie } })).json();
    status = outbox.find((o) => o.id === pub.outboxId)?.status ?? status;
  }
  ok('SSG worker processed the publish', status === 'processed', `${status} in ${Math.round((Date.now() - t0) / 1000)}s`);
}
console.log(fails ? `FIX PRODUCT NAMES: ${fails} FAIL` : 'FIX PRODUCT NAMES: ALL PASS');
process.exit(fails ? 1 : 0);
