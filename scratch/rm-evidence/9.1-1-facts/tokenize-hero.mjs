// rm(6.1-2/9.1-1, PUB-8): hero slide text is CMS data (hero_slides). Slide 5 hardcoded
// "· 24 Years in MEA", so a site/counters edit could not reach it (found by the UI sandbox
// E2E: years 24 -> 25 left six "24 Years" on the built site). index.astro now substitutes
// {years} / {brands} / {skus}; this rewrites the literal figures in the live rows to tokens
// through the CMS API (revision + audit row), then publishes. Idempotent; prints no secrets.
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

const cj = await (await fetch(PORTAL + '/api/cms/blocks/site/counters', { headers: { cookie } })).json();
const counters = (cj.block || cj).payload || {};
const brands = (await (await fetch(PORTAL + '/api/cms/brands', { headers: { cookie } })).json().catch(() => ({})));
const brandList = brands.brands || brands.items || (Array.isArray(brands) ? brands : []);
const brandCount = brandList.filter((b) => b.slug !== 'other').length;
ok('reference facts', Number(counters.years) > 0 && brandCount > 0, `years=${counters.years} brands=${brandCount}`);

const tokenize = (t) => t == null ? t : String(t)
  .replace(new RegExp(`\\b${counters.years}(\\+?)(\\s+Years?)\\b`, 'g'), '{years}$1$2')
  .replace(new RegExp(`\\b${brandCount}(\\s+(?:global|Global|brands|authorized|vendor))`, 'g'), '{brands}$1');
const { slides } = await (await fetch(PORTAL + '/api/cms/slides', { headers: { cookie } })).json();
let changed = 0;
for (const s of slides) {
  const next = { ...s, kick: tokenize(s.kick), headline: tokenize(s.headline), sub: tokenize(s.sub) };
  if (next.kick === s.kick && next.headline === s.headline && next.sub === s.sub) continue;
  r = await fetch(`${PORTAL}/api/cms/slides/${s.idx}`, { method: 'PUT', headers: H, body: JSON.stringify(next) });
  ok(`PUT slide ${s.idx}`, r.status === 200, `kick "${s.kick}" -> "${next.kick}"`);
  changed++;
}
console.log(`slides tokenized: ${changed}`);
/* No publish here: hero_slides is a dual-approval entity (rm 7.3, SEC-11). The publish
 * request waits for a SECOND staff approver in CMS -> Publish Approvals; automation must
 * not approve it. Report what is pending instead. */
const { approvals } = await (await fetch(PORTAL + '/api/cms/publish-approvals?status=pending', { headers: { cookie } })).json();
for (const a of approvals) console.log(`pending approval ${a.id}: ${a.items.join(', ')} requested by ${a.requestedBy}`);
const html = await (await fetch('http://127.0.0.1:8100/')).text();
ok('served hero has no raw token', !/\{years\}|\{brands\}/.test(html));
console.log(fails ? `TOKENIZE HERO: ${fails} FAIL` : 'TOKENIZE HERO: ALL PASS');
process.exit(fails ? 1 : 0);
