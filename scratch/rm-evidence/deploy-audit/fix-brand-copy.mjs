// deploy-audit D08: brand tagline (line) and overview (note) were stored wrapped in quote marks
// (seed.sql) — normalize the live rows to plain text through the CMS API (revision + audit row
// per brand). Name and counts are left as they are. Reads staff credentials from
// apps/portal/.env; prints no secrets. Idempotent.
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
const unq = (s) => String(s ?? '').trim().replace(/^["“]+|["”]+$/g, '').trim();

const { brands } = await (await fetch(PORTAL + '/api/cms/brands', { headers: { cookie } })).json();
let changed = 0;
for (const b of brands) {
  const line = unq(b.line), note = unq(b.note);
  if (line === (b.line || '') && note === (b.note || '')) continue;
  r = await fetch(`${PORTAL}/api/cms/brands/${encodeURIComponent(b.slug)}`, { method: 'PUT', headers: H, body: JSON.stringify({ slug: b.slug, name: b.name, line, note }) });
  const j = await r.json(); const after = j.brand || j; // PUT answers the brand itself
  ok(`PUT ${b.slug}`, r.status === 200 && after.line === line && after.note === note, `"${line.slice(0, 36)}"`);
  changed++;
}
console.log(`brands normalized: ${changed} of ${brands.length}`);
console.log(fails ? `FIX BRAND COPY: ${fails} FAIL` : 'FIX BRAND COPY: ALL PASS');
process.exit(fails ? 1 : 0);
