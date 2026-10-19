// deploy-audit: Arabic CMS blocks reach the Arabic pages. Through the real CMS API on the rig:
// edit site/contact (ar) hoursNote → publish → /ar/contact/ shows it → restore → publish.
// Also moves site/home (ar) lead to the {years} token (same change as seed.sql) and checks
// /ar/ renders the counter value. Reads staff credentials from apps/portal/.env; prints none.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const PORTAL = 'http://127.0.0.1:8090', EDGE = 'http://127.0.0.1:8100';
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('kyc_sid='));
let fails = 0;
const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++; return c; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
let cookie = cookieOf(r); let d = await r.json();
if (d.mfaChallengeId) {
  r = await fetch(PORTAL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json', cookie: cookie || '' }, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) });
  cookie = cookieOf(r) || cookie;
}
const me = await (await fetch(PORTAL + '/api/auth/me', { headers: { cookie } })).json();
ok('admin session', !!me.csrfToken);
const H = { 'content-type': 'application/json', cookie, 'x-csrf-token': me.csrfToken };
const api = async (m, p, b) => { const x = await fetch(PORTAL + p, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await x.json(); } catch {} return { status: x.status, j }; };
const payloadOf = (x) => { const p = x.j?.block?.payload ?? x.j?.payload ?? x.j; return typeof p === 'string' ? JSON.parse(p) : (p || {}); };
async function publishAndWait(entityId) {
  const pub = await api('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: entityId }] });
  if (!ok(`publish site/${entityId}`, pub.status === 200 && pub.j?.outboxId, 'HTTP ' + pub.status + (pub.status === 202 ? ' (needs a second approver)' : ''))) return false;
  for (let i = 0; i < 60; i++) {
    const t = await api('GET', '/api/cms/telemetry/publish');
    const lb = t.j?.lastBuild;
    if (lb && lb.outboxId === pub.j.outboxId && lb.status !== 'queued') return ok('build ' + pub.j.outboxId, lb.status === 'processed', lb.status);
    await sleep(2000);
  }
  return ok('build finished', false, 'timeout');
}
const page = async (p) => (await fetch(EDGE + p + '?t=' + Date.now())).text();

/* 1. contact: marker round trip */
const c0 = payloadOf(await api('GET', '/api/cms/blocks/site/contact?lang=ar'));
ok('read site/contact (ar)', typeof c0.hoursNote === 'string', String(c0.hoursNote).slice(0, 40));
const MARK = ' (تم التحقق ' + new Date().toISOString().slice(11, 16) + ')';
let put = await api('PUT', '/api/cms/blocks/site/contact?lang=ar', { payload: { ...c0, hoursNote: c0.hoursNote + MARK } });
ok('CMS edit of the Arabic hours note saved', put.status === 200, 'HTTP ' + put.status);
if (await publishAndWait('contact')) ok('/ar/contact/ shows the CMS edit', (await page('/ar/contact/')).includes(MARK.trim()));
put = await api('PUT', '/api/cms/blocks/site/contact?lang=ar', { payload: c0 });
ok('original hours note restored', put.status === 200);
if (await publishAndWait('contact')) ok('/ar/contact/ back to the original', !(await page('/ar/contact/')).includes(MARK.trim()));

/* 2. home: lead uses the {years} token, rendered from site/counters */
const h0 = payloadOf(await api('GET', '/api/cms/blocks/site/home?lang=ar'));
const counters = payloadOf(await api('GET', '/api/cms/blocks/site/counters'));
if (typeof h0.lead === 'string' && !h0.lead.includes('{years}')) {
  const lead = h0.lead.replace(/أكثر من \d+ عاماً/, 'أكثر من {years} عاماً');
  put = await api('PUT', '/api/cms/blocks/site/home?lang=ar', { payload: { ...h0, lead } });
  ok('Arabic home lead moved to the {years} token', put.status === 200 && lead.includes('{years}'));
}
if (await publishAndWait('home')) {
  const html = await page('/ar/');
  ok('/ar/ lead shows site/counters years (' + counters.years + ')', html.includes(`أكثر من ${counters.years} عاماً`) && !html.includes('{years}'));
}
console.log(fails ? `AR CMS ROUND TRIP: ${fails} FAIL` : 'AR CMS ROUND TRIP: ALL PASS');
process.exit(fails ? 1 : 0);
