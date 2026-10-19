// End-to-end: CMS edit -> publish -> SSG worker rebuild -> marker visible on public page? (SANDBOX ONLY)
import fs from 'node:fs';
const API = 'http://127.0.0.1:18090';
const DIST = process.argv[2];
const RUN = 'AUD' + Date.now().toString(36).toUpperCase();
let cookie;
async function call(m, p, b) {
  const r = await fetch(API + p, { method: m, headers: { cookie, ...(b ? { 'content-type': 'application/json' } : {}) }, body: b ? JSON.stringify(b) : undefined });
  const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  if (r.status >= 400) throw new Error(`${m} ${p} -> ${r.status} ${t.slice(0, 120)}`);
  return d;
}
{
  const r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@simalme.com', password: '[REDACTED-ROTATED-2026-10]' }) });
  cookie = r.headers.getSetCookie().find(c => c.startsWith('kyc_sid=')).split(';')[0];
}
// append a marker to the first human-readable string leaf of a payload
const SKIP = new Set(['id', 'slug', 'href', 'icon', 'targetId', 'img', 'at', 'cat', 'code', 'email', 'tel', 'phone']);
function mark(obj, marker) {
  let done = false;
  const walk = (o) => {
    if (done || o === null) return o;
    if (typeof o === 'string') { done = true; return o + ' ' + marker; }
    if (Array.isArray(o)) return o.map(walk);
    if (typeof o === 'object') { const out = {}; for (const [k, v] of Object.entries(o)) out[k] = (done || SKIP.has(k)) ? v : walk(v); return out; }
    return o;
  };
  return walk(obj);
}
const tests = [];
const T = (name, page, marker, edit, note = '') => tests.push({ name, page, marker, edit, note });
let n = 0;
const M = () => `${RUN}X${++n}`;

T('Announcement bar text', '/index.html', M(), async (mk) => {
  const a = (await call('GET', '/api/cms/announcements')).announcements[0];
  await call('PUT', '/api/cms/announcements/1', { text: a.text + ' ' + mk, cta_href: a.cta_href, cta_label: a.cta_label, active: true });
});
T('Hero slide #1 headline', '/index.html', M(), async (mk) => {
  const s = (await call('GET', '/api/cms/slides')).slides.find(x => x.idx === 1);
  await call('PUT', '/api/cms/slides/1', { idx: 1, kick: s.kick, headline: s.headline + ' ' + mk, sub: s.sub, cta_label: s.cta_label, cta_href: s.cta_href, photo_slug: s.photo_slug, motif: s.motif, active: true });
});
T('Product name + stock=false (crucial-t500)', '/products/crucial-t500/index.html', M(), async (mk) => {
  const p = await call('GET', '/api/cms/products/crucial-t500');
  await call('PUT', '/api/cms/products/crucial-t500', { name: p.name + ' ' + mk, sku: p.sku, brand: p.brand, cat: p.cat, cat_label: p.cat_label, short: p.short, stock: 'false', is_new: p.is_new });
});
T('Testimonial (create)', '/index.html', M(), async (mk) => {
  await call('POST', '/api/cms/testimonials', { quote: 'Audit probe quote ' + mk, name: 'Audit Probe', role: 'QA', active: true });
}, 'also expected on /about/');
T('Legal policy body (privacy-policy)', '/legal/privacy-policy/index.html', M(), async (mk) => {
  const p = await call('GET', '/api/cms/policies/privacy-policy');
  await call('PUT', '/api/cms/policies/privacy-policy', { title: p.title, body: p.body + ' ' + mk });
});
const blockTests = [
  ['site', 'offices', '/contact/index.html'],
  ['site', 'careers-roles', '/careers/index.html'],
  ['site', 'cases', '/resources/index.html'],
  ['amc', 'tiers', '/solutions/index.html', 'the block the CMS "AMC Tiers" view edits'],
  ['site', 'amc-tiers', '/solutions/index.html', 'the block the site reads'],
  ['site', 'solutions5', '/solutions/index.html'],
  ['erp', 'pricing', '/software/index.html'],
  ['site', 'impl-phases', '/software/index.html'],
  ['insight', 'ddr4-vs-ddr5', '/insights/ddr4-vs-ddr5/index.html'],
  ['it_solution', 'amc', '/solutions/amc/index.html'],
  ['software_module', 'finance', '/software/modules/finance/index.html', 'detail page'],
  ['software_module', 'crm', '/software/index.html', 'software hub grid'],
  ['site', 'counters', '/index.html', 'home stats strip'],
  ['site', 'mission', '/about/index.html'],
];
for (const [e, id, page, note] of blockTests) {
  T(`Block ${e}/${id}`, page, M(), async (mk) => {
    const b = await call('GET', `/api/cms/blocks/${e}/${id}`);
    if (!b) throw new Error('block missing (GET returned null)');
    await call('PUT', `/api/cms/blocks/${e}/${id}`, { payload: mark(b.payload, mk) });
  }, note || '');
}
T('Block site/featured-products (reorder)', '/index.html', 'href="/products/crucial-p3-plus"', async () => {
  const b = await call('GET', '/api/cms/blocks/site/featured-products');
  const slugs = ['crucial-p3-plus', ...b.payload.slugs.filter(s => s !== 'crucial-p3-plus')].slice(0, 12);
  await call('PUT', '/api/cms/blocks/site/featured-products', { payload: { slugs } });
}, 'expects a crucial-p3-plus card on home');

for (const t of tests) t.before = fs.existsSync(DIST + t.page) && fs.readFileSync(DIST + t.page, 'utf8').includes(t.marker);
for (const t of tests) { try { await t.edit(t.marker); t.edited = true; } catch (e) { t.edited = false; t.err = e.message; } }

const pub = await call('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }] });
console.log('publish queued:', pub.outboxId, '| actor recorded as:', pub.actor);
let status = 'queued', waited = 0;
while (waited < 150) {
  await new Promise(r => setTimeout(r, 3000)); waited += 3;
  const o = (await call('GET', '/api/cms/outbox?limit=20')).outbox.find(x => x.id === pub.outboxId);
  status = o?.status; if (status !== 'queued') break;
}
console.log('worker final status:', status, 'after ~' + waited + 's');
console.log('\nRESULT   | content type                              | page                                    | before->after');
for (const t of tests) {
  const html = fs.existsSync(DIST + t.page) ? fs.readFileSync(DIST + t.page, 'utf8') : '';
  t.after = html.includes(t.marker);
  const verdict = !t.edited ? 'EDIT-ERR' : t.after ? 'LIVE    ' : 'NOT-LIVE';
  console.log(`${verdict} | ${t.name.padEnd(41)} | ${t.page.padEnd(39)} | ${t.before}->${t.after} ${t.note ? '(' + t.note + ')' : ''}${t.err ? ' [' + t.err + ']' : ''}`);
}
const about = fs.readFileSync(DIST + '/about/index.html', 'utf8');
console.log('\nnew testimonial also on /about/:', about.includes(tests[3].marker));
const t500 = fs.readFileSync(DIST + '/products/crucial-t500/index.html', 'utf8');
console.log('crucial-t500 after stock="false" -> page says "In stock":', /in stock/i.test(t500), '| says "out of stock":', /out of stock/i.test(t500));
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/cms_e2e.json', JSON.stringify({ RUN, pub, status, tests }, null, 1));
