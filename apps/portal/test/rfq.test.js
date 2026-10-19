/* rfq.test.js — T3.4 (FRS-R): server-side RFQ engine on the real app.
 * Covers: basket cookie flow (add/merge/cap/validation), submit (ref format,
 * per-item notes, both notification emails, basket cleared), status by
 * reference+email (wrong email 404, same as unknown — no existence oracle), admin list + transitions + guards,
 * contact endpoint (FRS-CT).
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
/* Documents are encrypted at rest and both stores refuse a default key (rm 10.4-1). A clean
 * CI runner has no apps/portal/.env, so every suite that boots the app brings its own key
 * (platform run #12 failed workspace + pg-mode-journey without it). */
if (!process.env.DOC_ENCRYPTION_KEY) process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');

process.env.NODE_KYC_TEST = '1';
process.env.DATABASE_URL = ''; // rm(1.2-3): never touch the live PG from tests (JSON temp store only)
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rfq-'));
process.env.DATA_DIR = TMP;
const ADMIN_EMAIL = 'rfq-admin@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.WATCHLIST_CSV = path.resolve('test/fixtures/watchlist.csv'); // rm(9.1-3): tracked fixture (data/ is git-ignored)
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.LOGIN_RATE_MAX = '200';

/* JSON-mode products mirror: the tracked fixture (rm 9.1-3: data/products.json is
 * git-ignored, so a clean CI checkout booted with an empty catalogue) */
process.env.PRODUCTS_JSON = path.resolve('test/fixtures/products.json');
const { createApp } = await import('../src/server.js');
const app = await createApp({ dataDir: TMP });
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

const SLUG = 'crucial-t705-ssd-2';
const SLUG2 = 'koorui-27-inch-gaming-monitor';

const jar = {};
async function call(method, p, body, who = 'anon') {
  const r = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jar[who] ? { cookie: jar[who] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')].filter(Boolean);
  for (const sc of setCookies) {
    const [pair] = sc.split(';');
    const [k] = pair.split('=');
    if (!jar[who]) jar[who] = '';
    const others = (jar[who] || '').split('; ').filter(c => c && !c.startsWith(k + '='));
    others.push(pair.trim());
    jar[who] = others.join('; ');
  }
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}

test('basket: add, merge, and view via httpOnly cookie', async () => {
  const a = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 5, note: 'urgent' });
  assert.equal(a.status, 200);
  assert.equal(a.json.lines, 1);
  const b = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 2 });
  assert.equal(b.json.basket[0].qty, 7, 'same slug merges');
  const c = await call('POST', '/api/rfq-basket', { slug: SLUG2, qty: 1 });
  assert.equal(c.json.lines, 2);
  const v = await call('GET', '/api/rfq-basket');
  assert.equal(v.json.totalQty, 8);
  assert.equal(v.json.basket[0].note, 'urgent', 'per-item note retained');
});

test('basket: unknown slug 404, bad qty 400, slug injection rejected', async () => {
  assert.equal((await call('POST', '/api/rfq-basket', { slug: 'no-such-product', qty: 1 }, 'b2')).status, 404);
  assert.equal((await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 0 }, 'b2')).status, 400);
  assert.equal((await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 100000 }, 'b2')).status, 400);
  assert.equal((await call('POST', '/api/rfq-basket', { slug: '../../etc/passwd', qty: 1 }, 'b2')).status, 400);
});

test('basket: accepts catalogue slug containing underscore (PUB-6)', async () => {
  const underSlug = 'arktek-rtx3060-led-ga104-150-a1-3584sp-gddr6-12gb-13201777-12gbps_6b2aaad2';
  const res = await call('POST', '/api/rfq-basket', { slug: underSlug, qty: 1 }, 'b_under');
  assert.equal(res.status, 200, 'underscore slug accepted');
  assert.equal(res.json.lines, 1);
  assert.equal(res.json.basket[0].slug, underSlug);
});

test('basket: negative delta decrements, past-zero removes (the UI remove button)', async () => {
  /* regression for the contract bug the interactive sweep found: the island posts
   * qty deltas (decrease → negative) and -(qty)-1 for the remove button; the old
   * 1..99999 validation 400'd both, so remove/decrease NEVER worked in the UI */
  const a = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 7 }, 'b3');
  assert.equal(a.status, 200);
  assert.equal(a.json.basket[0].qty, 7);
  const dec = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: -4 }, 'b3');
  assert.equal(dec.status, 200);
  assert.equal(dec.json.basket[0].qty, 3, 'negative delta decrements');
  const remove = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: -3 - 1 }, 'b3'); /* island remove: -(qty)-1 */
  assert.equal(remove.status, 200);
  assert.equal(remove.json.lines, 0, 'delta past zero removes the line');
  const idem = await call('POST', '/api/rfq-basket', { slug: SLUG, qty: -5 }, 'b3'); /* not in basket */
  assert.equal(idem.status, 200, 'negative delta on absent line is an idempotent no-op');
  assert.equal(idem.json.lines, 0);
});

test('submit: reference format, emails both ways, basket cleared', async () => {
  const r = await call('POST', '/api/rfq', { email: 'buyer@rfq.test', company: 'RFQ Buyer LLC', contactName: 'R F Q', phone: '+971501110009' });
  assert.equal(r.status, 201);
  assert.match(r.json.reference, /^SIMAL-RFQ-\d{8}-\d{4}$/);
  const REF = r.json.reference;
  assert.equal(r.json.lines, 2);

  const after = await call('GET', '/api/rfq-basket');
  assert.equal(after.json.lines, 0, 'basket cleared on submit');

  /* emails: buyer confirmation + internal sales */
  const s = await call('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, 'staff');
  assert.equal(s.status, 200);
  const ob = await call('GET', '/api/admin/outbox', undefined, 'staff');
  const toBuyer = (ob.json || []).find(m => m.to === 'buyer@rfq.test' && /RFQ received/.test(m.subject || ''));
  const toSales = (ob.json || []).find(m => m.to === 'sales@simalme.com' && /New RFQ/.test(m.subject || ''));
  assert.ok(toBuyer, 'buyer confirmation email');
  assert.ok(toSales && /urgent/.test(toSales.text || ''), 'sales email carries the per-item note');

  /* status: right email works, wrong email 404 (rm(10.3-1 pen KYC-46)) */
  const st = await call('GET', '/api/rfq/' + REF + '?email=buyer@rfq.test');
  assert.equal(st.status, 200);
  assert.equal(st.json.status, 'submitted');
  assert.equal(st.json.items.length, 2);
  assert.equal((await call('GET', '/api/rfq/' + REF + '?email=other@rfq.test', undefined, 'b3')).status, 404);
});

test('submit: empty basket 400, missing company 400, second RFQ increments ref', async () => {
  assert.equal((await call('POST', '/api/rfq', { email: 'x@rfq.test', company: 'C', contactName: 'N' }, 'b4')).status, 400, 'empty basket');
  await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 1 }, 'b4');
  assert.equal((await call('POST', '/api/rfq', { email: 'x@rfq.test', contactName: 'Ned Q' }, 'b4')).status, 400, 'company required');
  assert.equal((await call('POST', '/api/rfq', { email: 'x@rfq.test', company: 'C Ltd', contactName: 'N' }, 'b4')).status, 400, 'contact name must be 2+ chars');
  const r = await call('POST', '/api/rfq', { email: 'x@rfq.test', company: 'C Ltd', contactName: 'Ned Q', phone: '+971501234567' }, 'b4');
  assert.equal(r.status, 201);
  await call('POST', '/api/rfq-basket', { slug: SLUG, qty: 1 }, 'b5');
  const s2 = await call('POST', '/api/rfq', { email: 'x@rfq.test', company: 'C Ltd', contactName: 'Ned Q', phone: '+971501234567' }, 'b5');
  assert.notEqual(s2.json.reference, r.json.reference, 'references increment');
});

test('admin: list + transitions with guards', async () => {
  const l = await call('GET', '/api/admin/rfqs?status=submitted', undefined, 'staff');
  assert.equal(l.status, 200);
  const rows = l.json.rows || [];
  assert.ok(rows.length >= 2);
  const ref = rows[0].ref;

  /* can't win straight from submitted? won allows submitted — but quote first */
  const q = await call('POST', '/api/admin/rfqs/' + ref + '/actions', { action: 'quote', note: 'pricing sent' }, 'staff');
  assert.equal(q.status, 200);
  assert.equal(q.json.status, 'quoted');
  const won = await call('POST', '/api/admin/rfqs/' + ref + '/actions', { action: 'won' }, 'staff');
  assert.equal(won.json.status, 'won');
  /* terminal: no further transitions from won */
  assert.equal((await call('POST', '/api/admin/rfqs/' + ref + '/actions', { action: 'quote' }, 'staff')).status, 409);
  /* status endpoint reflects timeline */
  const email = rows[0].email;
  const st = await call('GET', '/api/rfq/' + ref + '?email=' + encodeURIComponent(email));
  assert.ok((st.json.timeline || []).some(h => h.status === 'won'));
});

test('contact endpoint (FRS-CT): validation + inbox routing', async () => {
  const bad = await call('POST', '/api/contact', { email: 'nope', name: 'A B', message: 'long enough message here' });
  assert.equal(bad.status, 400);
  const bad2 = await call('POST', '/api/contact', { email: 'a@b.ae', name: 'A B', message: 'short' });
  assert.equal(bad2.status, 400);
  const okr = await call('POST', '/api/contact', { email: 'visitor@example.com', name: 'Site Visitor', message: 'Please quote a firewall for 40 users.', topic: 'IT Solutions' });
  assert.equal(okr.status, 201);
  const ob = await call('GET', '/api/admin/outbox', undefined, 'staff');
  assert.ok((ob.json || []).some(m => m.to === 'accounts@simalme.com' && /Website contact/.test(m.subject || '')));
});

test('unauthenticated admin RFQ endpoints are gated', async () => {
  assert.equal((await call('GET', '/api/admin/rfqs', undefined, 'anon')).status, 401);
});

test('basket views do not spend the RFQ/contact submission budget (rm 9.1-3)', async () => {
  // every public page view fetches the header basket count; 40 views in a minute
  // used to exhaust the shared 30/min bucket and 429 the visitor's submission
  for (let i = 0; i < 40; i++) assert.equal((await call('GET', '/api/rfq-basket', undefined, 'browser')).status, 200, 'view ' + (i + 1));
  const sub = await call('POST', '/api/contact', { email: 'browser@example.com', name: 'Busy Browser', message: 'Quote after browsing the catalogue.' }, 'browser');
  assert.equal(sub.status, 201);
});

after(async () => {
  await new Promise(r => app.server.close(r));
  if (app.repos?.client) await app.repos.client.end().catch(() => {});
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
