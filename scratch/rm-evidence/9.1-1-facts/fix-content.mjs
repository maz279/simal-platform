// rm(9.1-1/6.1-2, PUB-8): correct the divergent figures the facts-consistency gate found
// in live CMS content, through the CMS API (audited, updated_by = the admin), then publish
// through the real pipeline (CMS -> SSG worker -> deploy -> :8100).
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

const EDITS = [
  ['insight', 'simal-two-decades', 'an authorized 23-brand distribution house', 'an authorized 21-brand distribution house'],
  ['insight', 'authorized-it-distributors-uae', 'authorized distribution across a 23-brand portfolio', 'authorized distribution across a 21-brand portfolio'],
  ['it_solution', 'infra', 'The portfolio spans 23 authorized brands', 'The portfolio spans 21 authorized brands'],
  ['it_solution', 'infra', 'specified from our 81-SKU authorized portfolio', 'specified from our 78-SKU authorized portfolio'],
  ['it_solution', 'data-recovery', 'SSD and memory tiers from the 81-SKU portfolio', 'SSD and memory tiers from the 78-SKU portfolio'],
];

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

const touched = new Map();
for (const [entity, id, from, to] of EDITS) {
  const key = entity + '/' + id;
  if (!touched.has(key)) {
    const j = await (await fetch(`${PORTAL}/api/cms/blocks/${entity}/${id}`, { headers: { cookie } })).json();
    touched.set(key, { entity, id, payload: (j.block || j).payload });
  }
  const t = touched.get(key);
  const txt = JSON.stringify(t.payload);
  if (txt.includes(to)) { ok(`${key}: already corrected`, true, to); continue; }
  ok(`${key}: divergent text present`, txt.includes(from), from);
  t.payload = JSON.parse(txt.split(from).join(to));
  t.dirty = true;
}
const entities = [];
for (const t of touched.values()) {
  if (!t.dirty) continue;
  r = await fetch(`${PORTAL}/api/cms/blocks/${t.entity}/${t.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ payload: t.payload }) });
  ok(`PUT ${t.entity}/${t.id}`, r.status === 200, 'HTTP ' + r.status);
  entities.push({ entity: t.entity, entity_id: t.id });
}
if (entities.length) {
  const t0 = Date.now();
  r = await fetch(PORTAL + '/api/cms/publish', { method: 'POST', headers: H, body: JSON.stringify({ entities }) });
  const pub = await r.json();
  ok('publish accepted', r.status === 200 || r.status === 202, `HTTP ${r.status} outbox=${pub.outboxId} ${pub.status || ''}`);
  let status = 'queued';
  for (let i = 0; i < 100 && !['processed', 'failed'].includes(status); i++) {
    await new Promise((res) => setTimeout(res, 3000));
    const { outbox } = await (await fetch(PORTAL + '/api/cms/outbox?limit=20', { headers: { cookie } })).json();
    status = outbox.find((o) => o.id === pub.outboxId)?.status ?? status;
  }
  ok('SSG worker processed the publish', status === 'processed', `${status} in ${Math.round((Date.now() - t0) / 1000)}s`);
}
console.log(fails ? `FIX CONTENT: ${fails} FAIL` : 'FIX CONTENT: ALL PASS');
process.exit(fails ? 1 : 0);
