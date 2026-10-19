// CMS publish -> SSG worker build -> deploy -> served by :8100 (real rig pipeline).
// Reads staff credentials from apps/portal/.env; prints no secrets.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const PORTAL = 'http://127.0.0.1:8090', EDGE = 'http://127.0.0.1:8100';
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('kyc_sid='));
let fails = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++; };

let r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
ok('admin login step 1', r.status === 200, 'HTTP ' + r.status);
let cookie = cookieOf(r); let d = await r.json();
if (d.mfaChallengeId) {
  r = await fetch(PORTAL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json', cookie: cookie || '' },
    body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) });
  ok('admin TOTP step', r.status === 200, 'HTTP ' + r.status);
  cookie = cookieOf(r) || cookie; d = await r.json();
}
const me = await (await fetch(PORTAL + '/api/auth/me', { headers: { cookie } })).json();
ok('session is super_admin', me.user?.role === 'super_admin' || me.role === 'super_admin', me.user?.role || me.role);
const H = { 'content-type': 'application/json', cookie, 'x-csrf-token': me.csrfToken };

const before = fs.statSync(CB + '/apps/site/deploy-docroot/index.html').mtimeMs;
const t0 = Date.now();
r = await fetch(PORTAL + '/api/cms/publish', { method: 'POST', headers: H,
  body: JSON.stringify({ entities: [{ entity: 'announcements', entity_id: '1' }] }) });
const pub = await r.json();
ok('publish accepted', r.status === 200 || r.status === 202, `HTTP ${r.status} outbox=${pub.outboxId}`);
let status = 'queued', row;
for (let i = 0; i < 100 && !['processed', 'failed'].includes(status); i++) {
  await new Promise((res) => setTimeout(res, 3000));
  const { outbox } = await (await fetch(PORTAL + '/api/cms/outbox?limit=20', { headers: { cookie } })).json();
  row = outbox.find((o) => o.id === pub.outboxId); status = row?.status ?? status;
}
ok('SSG worker processed the job', status === 'processed', `${status} in ${Math.round((Date.now() - t0) / 1000)}s`);
const after = fs.statSync(CB + '/apps/site/deploy-docroot/index.html').mtimeMs;
ok('deploy target rewritten', after > before, new Date(after).toISOString());
const html = await (await fetch(EDGE + '/')).text();
ok('served home has 5 server-rendered hero slides', (html.match(/class="h5-slide/g) || []).length === 5);
ok('served home has server-rendered motifs', (html.match(/class="h5-motif"/g) || []).length >= 1);
ok('EN home does not load the Tajawal stylesheet', !html.includes('family=Tajawal'));
const ar = await (await fetch(EDGE + '/ar/')).text();
ok('AR home loads the Tajawal stylesheet', ar.includes('family=Tajawal'));
const tel = await (await fetch(PORTAL + '/api/cms/telemetry/publish', { headers: { cookie } })).json().catch(() => ({}));
const lb = tel.lastBuild || tel.data?.lastBuild || {};
ok('telemetry lastBuild is this publish, processed', lb.outboxId === pub.outboxId && lb.status === 'processed', JSON.stringify(lb).slice(0, 140));
console.log(fails ? `PUBLISH LOOP: ${fails} FAIL` : 'PUBLISH LOOP: ALL PASS');
process.exit(fails ? 1 : 0);
