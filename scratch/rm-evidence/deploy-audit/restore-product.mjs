// Usage: node restore-product.mjs <slug> <text in the original revision> <expected brand> <expected cat>
// deploy-audit: rig product 1672 (a Honeywell extension cord in seed.sql) was overwritten on
// 2026-10-11 by an unauthenticated "system" update with Crucial T705 data (brand "Crucial",
// category "SSD"; the short text still described the cord) — test pollution of the rig DB.
// Restore it from its revision through the CMS rollback API (revision + audit row). Reads
// staff credentials from apps/portal/.env; prints none.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const PORTAL = 'http://127.0.0.1:8090';
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('kyc_sid='));
let fails = 0; const ok = (n, c, x = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`); if (!c) fails++; };
let r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
let cookie = cookieOf(r); const d = await r.json();
if (d.mfaChallengeId) { r = await fetch(PORTAL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json', cookie: cookie || '' }, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) }); cookie = cookieOf(r) || cookie; }
const me = await (await fetch(PORTAL + '/api/auth/me', { headers: { cookie } })).json();
const H = { 'content-type': 'application/json', cookie, 'x-csrf-token': me.csrfToken };
const [SLUG, MATCH, BRAND, CAT] = process.argv.slice(2).length ? process.argv.slice(2) : ['1672', 'Honeywell HC000018', 'honeywell', 'accessories'];
const revs = await (await fetch(PORTAL + '/api/cms/revisions/products/' + encodeURIComponent(SLUG), { headers: H })).json();
const list = revs.revisions || revs.rows || revs || [];
const orig = (Array.isArray(list) ? list : []).find((v) => (typeof v.payload === 'string' ? v.payload : JSON.stringify(v.payload || v)).includes('"name": "' + MATCH) || JSON.stringify(v.payload || v).includes('"name":"' + MATCH));
ok('original revision of ' + SLUG + ' found', !!orig, orig ? 'revision ' + orig.id : JSON.stringify(revs).slice(0, 160));
if (orig) {
  r = await fetch(PORTAL + '/api/cms/revisions/products/' + encodeURIComponent(SLUG) + '/rollback', { method: 'POST', headers: H, body: JSON.stringify({ revisionId: orig.id }) });
  ok('rollback accepted', r.status === 200, 'HTTP ' + r.status);
  const p = await (await fetch(PORTAL + '/api/cms/products/' + encodeURIComponent(SLUG), { headers: H })).json();
  const prod = p.product || p;
  ok(SLUG + ' restored', String(prod.name).startsWith(MATCH) && prod.brand === BRAND && prod.cat === CAT, `${prod.brand} · ${prod.cat} · ${String(prod.name).slice(0, 40)}`);
}
console.log(fails ? `RESTORE ${SLUG}: ${fails} FAIL` : `RESTORE ${SLUG}: ALL PASS`);
process.exit(fails ? 1 : 0);
