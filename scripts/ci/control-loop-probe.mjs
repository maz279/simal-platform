// scripts/ci/control-loop-probe.mjs — F-2026-N01 / CMS-10 control-loop proof,
// created for rm(10.1-2) (the roadmap referenced this probe from 1.1-4/5.2-3/10.1-2
// but only its OUTPUT log had ever been archived). Edit → publish → (dual-approval
// 202 path) → SSG worker processes → marker served at the deploy origin → RESTORE.
// MFA-aware; credentials from process env or apps/portal/.env (guarded read).
// The 1.1-4 reference measurement was 12.098 s (rm-evidence/1.1-4-final-clean-*
// control-loop.log); the limit stays generous (fresh cold builds are slower).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = process.env.PORTAL_URL || 'http://127.0.0.1:8090';
const ORIGIN = process.env.SITE_ORIGIN || 'http://127.0.0.1:8100';
const LIMIT_MS = Number(process.env.PROBE_TIMEOUT_MS || 180000);
const REF_MS = 12098; /* 1.1-4 measured SLO reference */

let envTxt = ''; try { envTxt = fs.readFileSync(path.join(REPO, 'apps/portal/.env'), 'utf8'); } catch { /* CI: no .env */ }
const E = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import('file://' + path.join(REPO, 'apps/portal/src/lib/security.js').replace(/\\/g, '/'));
const post = (p, body, h = {}) => fetch(API + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(body) });
const cookies = (r) => (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');

async function staffLogin(email, password, totpSecret) {
  let r = await post('/api/auth/login', { email, password });
  let d = await r.json(); let cookie = cookies(r);
  if (d.mfaRequired) {
    r = await post('/api/auth/mfa', { mfaChallengeId: d.mfaChallengeId, code: totpNow(totpSecret) });
    d = await r.json(); cookie = cookies(r) || cookie;
  }
  return { cookie, csrf: d.csrfToken };
}

async function publishAndBuild(H, reviewer) {
  let r = await post('/api/cms/publish', { entities: [{ entity: 'announcements', entity_id: '1' }] }, H);
  let d = await r.json();
  if (r.status === 202 && d.pending) {
    // rm(7.3-4): a sensitive dirty set needs a SECOND, distinct approver
    if (!reviewer) throw new Error('publish returned 202 pending but no reviewer credentials for the approval step');
    const a = await post('/api/cms/publish-approvals/' + d.approvalId + '/approve', {}, { cookie: reviewer.cookie, 'x-csrf-token': reviewer.csrf });
    if (!a.ok) throw new Error('reviewer approval failed: ' + a.status);
    d = await a.json();
  }
  if (!r.ok && r.status !== 200) throw new Error('publish failed: ' + r.status);
  const outboxId = d.outboxId;
  if (!outboxId) throw new Error('no outboxId in publish response: ' + JSON.stringify(d).slice(0, 120));
  const t0 = Date.now();
  let status = 'queued';
  while (Date.now() - t0 < LIMIT_MS && !['processed', 'failed'].includes(status)) {
    await new Promise(res => setTimeout(res, 3000));
    const ob = await (await fetch(API + '/api/cms/outbox?limit=20', { headers: { cookie: H.cookie } })).json();
    status = ob.outbox.find(o => o.id === outboxId)?.status ?? status;
  }
  if (status !== 'processed') throw new Error('SSG job ' + outboxId + ' ended as ' + status);
  return Date.now() - t0;
}

if (!E('ADMIN_EMAIL')) { console.error('control-loop-probe: no staff credentials (set ADMIN_*/REVIEWER_* or apps/portal/.env)'); process.exit(2); }
const admin = await staffLogin(E('ADMIN_EMAIL'), E('ADMIN_PASSWORD'), E('ADMIN_TOTP_SECRET'));
const H = { cookie: admin.cookie, 'x-csrf-token': admin.csrf };
const reviewer = E('REVIEWER_EMAIL') ? await staffLogin(E('REVIEWER_EMAIL'), E('REVIEWER_PASSWORD'), null) : null;

const anns = await (await fetch(API + '/api/cms/announcements', { headers: { cookie: admin.cookie } })).json();
const ann = anns.announcements.find(a => a.id === 1);
const original = { text: ann.text, cta_href: ann.cta_href, cta_label: ann.cta_label, active: ann.active };
const MARKER = 'RMPROBE-' + Date.now().toString(36).toUpperCase();
const put = (body) => fetch(API + '/api/cms/announcements/1', { method: 'PUT', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify(body) });

let seenMs = -1, buildMs = -1;
try {
  console.log('1. current announcement text is the pristine original:', JSON.stringify(original.text).slice(0, 60));
  const p1 = await put({ ...original, text: MARKER + ' (roadmap control-loop probe)' });
  console.log('2. PUT marker:', p1.status);
  buildMs = await publishAndBuild(H, reviewer);
  console.log('3-4. SSG worker processed in', (buildMs / 1000).toFixed(1) + 's');
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    if ((await (await fetch(ORIGIN + '/?rm=' + Date.now())).text()).includes(MARKER)) { seenMs = Date.now() - t0; break; }
    await new Promise(res => setTimeout(res, 2000));
  }
  console.log('5. MARKER ON LIVE SITE (' + ORIGIN + '):', seenMs >= 0);
  if (seenMs < 0) throw new Error('marker never served at ' + ORIGIN);
  const total = buildMs + seenMs;
  console.log('6. edit→served total:', (total / 1000).toFixed(1) + 's (1.1-4 reference: ' + (REF_MS / 1000).toFixed(1) + 's; limit ' + (LIMIT_MS / 1000).toFixed(0) + 's)');
} finally {
  const rp = await put(original);
  let restoreOk = rp.status === 200;
  if (restoreOk) {
    try { await publishAndBuild(H, reviewer); } catch (e) { restoreOk = false; console.error('restore publish failed:', e.message); }
  }
  const gone = !(await (await fetch(ORIGIN + '/?rm=' + Date.now())).text()).includes(MARKER);
  console.log('7. restore PUT:', rp.status, '| restore published:', restoreOk, '| marker gone from site:', gone, '| original back:', restoreOk && gone);
  if (!restoreOk || !gone) { console.error('FAIL — site left in probe state'); process.exit(1); }
}
console.log('PASS control-loop: marker served and restored; total', ((buildMs + seenMs) / 1000).toFixed(1) + 's');
process.exit(0);
