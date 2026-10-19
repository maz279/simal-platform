// deploy-audit: rig block it_solution/licensing (en) carried a test edit — title
// "Software & Licensing Support - Verified" (seed: "Software & Licensing Support"), written by an
// unauthenticated "system" update in Oct 2026. Restore the seed title via the CMS API (revision +
// audit). Reads staff credentials from apps/portal/.env; prints none.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase', PORTAL = 'http://127.0.0.1:8090';
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('kyc_sid='));
let r = await fetch(PORTAL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') }) });
let cookie = cookieOf(r); const d = await r.json();
if (d.mfaChallengeId) { r = await fetch(PORTAL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json', cookie: cookie || '' }, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(pick('ADMIN_TOTP_SECRET')) }) }); cookie = cookieOf(r) || cookie; }
const me = await (await fetch(PORTAL + '/api/auth/me', { headers: { cookie } })).json();
const H = { 'content-type': 'application/json', cookie, 'x-csrf-token': me.csrfToken };
const cur = await (await fetch(PORTAL + '/api/cms/blocks/it_solution/licensing?lang=en', { headers: H })).json();
let payload = cur.block?.payload ?? cur.payload ?? cur; if (typeof payload === 'string') payload = JSON.parse(payload);
const before = payload.t;
const put = await fetch(PORTAL + '/api/cms/blocks/it_solution/licensing?lang=en', { method: 'PUT', headers: H, body: JSON.stringify({ payload: { ...payload, t: 'Software & Licensing Support' } }) });
const pub = await fetch(PORTAL + '/api/cms/publish', { method: 'POST', headers: H, body: JSON.stringify({ entities: [{ entity: 'it_solution', entity_id: 'licensing' }] }) });
const ok = put.status === 200 && pub.status === 200;
console.log(`${ok ? 'PASS' : 'FAIL'} it_solution/licensing title "${before}" → "Software & Licensing Support" (PUT ${put.status}, publish ${pub.status})`);
process.exit(ok ? 0 : 1);
