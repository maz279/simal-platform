// test/integration/ssg-outbox-sync.test.js — rm(9.2-1) / F-2026-N12
// ADR-13 control loop as a REAL, discoverable test: CMS publish must be picked up
// by the SSG outbox worker and reach status=processed. Replaces the stale
// ssg-outbox-sync.test.mjs script (dead credentials, not a node:test file, never
// picked up by `npm test` / CI globs).
//
// Rig e2e: runs against a live portal (PORTAL_URL, default http://127.0.0.1:8090)
// reading staff credentials from apps/portal/.env (git-ignored — the read is
// guarded so CI, where the file does not exist, SKIPS instead of crashing).
// Since rm(7.3) a sensitive dirty set makes publish return 202 {pending}; the
// test then completes the second-approver step with the reviewer account
// (7.3-4 extension of the control-loop probe).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { totpNow } from '../../src/lib/security.js';

const PORTAL_URL = process.env.PORTAL_URL || 'http://127.0.0.1:8090';
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8'); } catch { /* CI: no .env */ }
const pick = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const cookies = (r) => (r.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');

async function staffLogin(email, password, totpSecret) {
  let r = await fetch(PORTAL_URL + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }) });
  assert.equal(r.status, 200, 'login must succeed for ' + email);
  let cookie = cookies(r); let d = await r.json();
  if (d.mfaRequired) {
    r = await fetch(PORTAL_URL + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(totpSecret) }) });
    assert.equal(r.status, 200, 'MFA step must succeed');
    cookie = cookies(r) || cookie; d = await r.json();
  }
  return { cookie, csrf: d.csrfToken };
}

test('F-2026-N12: CMS publish is processed by the SSG worker (rig e2e)', async (t) => {
  const up = await fetch(PORTAL_URL + '/api/health', { signal: AbortSignal.timeout(2000) }).then(r => r.ok, () => false);
  if (!up || !pick('ADMIN_EMAIL')) return t.skip('portal not reachable at ' + PORTAL_URL);

  const admin = await staffLogin(pick('ADMIN_EMAIL'), pick('ADMIN_PASSWORD'), pick('ADMIN_TOTP_SECRET'));
  const H = { 'content-type': 'application/json', cookie: admin.cookie, ...(admin.csrf ? { 'x-csrf-token': admin.csrf } : {}) };
  const pubRes = await fetch(PORTAL_URL + '/api/cms/publish', { method: 'POST', headers: H,
    body: JSON.stringify({ entities: [{ entity: 'announcements', entity_id: '1' }] }) });
  const pub = await pubRes.json();

  if (pubRes.status === 202 && pub.pending) {
    // rm(7.3-4): sensitive dirty set — a DISTINCT user must approve before anything is built.
    assert.ok(pub.approvalId, '202 carries approvalId');
    assert.ok(pick('REVIEWER_EMAIL'), 'reviewer credentials needed to approve a pending publish');
    const reviewer = await staffLogin(pick('REVIEWER_EMAIL'), pick('REVIEWER_PASSWORD'), null);
    const appr = await fetch(PORTAL_URL + '/api/cms/publish-approvals/' + pub.approvalId + '/approve', { method: 'POST',
      headers: { 'content-type': 'application/json', cookie: reviewer.cookie, ...(reviewer.csrf ? { 'x-csrf-token': reviewer.csrf } : {}) } });
    assert.equal(appr.status, 200, 'reviewer approval of the admin-requested publish must succeed');
    pub.outboxId = (await appr.json()).outboxId ?? pub.outboxId;
  } else {
    assert.equal(pubRes.status, 200, 'non-sensitive publish is enqueued directly');
  }
  assert.ok(pub.outboxId, 'publish response carries outboxId');

  let status = 'queued';
  for (let i = 0; i < 60 && !['processed', 'failed'].includes(status); i++) {
    await new Promise(res => setTimeout(res, 3000));
    const { outbox } = await (await fetch(PORTAL_URL + '/api/cms/outbox?limit=20', { headers: { cookie: admin.cookie } })).json();
    status = outbox.find(o => o.id === pub.outboxId)?.status ?? status;
  }
  assert.equal(status, 'processed', 'SSG worker must process the publish job');
});
