/* token-exchange.test.js — T2.4: legacy kyc.simalme.com magic-link bridge.
 * Covers: valid partner exchange → session cookie + redirect; staff address → 403
 * (deploy-audit M10); replay → 409; bad
 * signature → 401; expired → 401; unknown account → structured no_account
 * (no session); bridge unconfigured → 503. Tokens are forged locally with
 * the test signing secret — same HMAC scheme the legacy portal used.
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tokx-'));
process.env.DATA_DIR = TMP;
const SECRET = crypto.randomBytes(32).toString('hex');
process.env.LEGACY_TOKEN_SECRET = SECRET;
const ADMIN_EMAIL = 'tokx-admin@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.WATCHLIST_CSV = path.resolve('test/fixtures/watchlist.csv'); // rm(9.1-3): tracked fixture (data/ is git-ignored)
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');

const { createApp } = await import('../src/server.js');
const app = await createApp({ dataDir: TMP });
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

const sign = (payload, secret = SECRET) => {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return p + '.' + crypto.createHmac('sha256', secret).update(p).digest('hex');
};

async function call(method, p, { body, cookie } = {}) {
  const r = await fetch(BASE + p, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j, headers: r.headers };
}

/* the bridge is for partners (deploy-audit M10): register one to carry the legacy links */
const PARTNER_EMAIL = 'tokx-partner@example.com';
{
  const reg = await call('POST', '/api/auth/register', { body: { email: PARTNER_EMAIL, name: 'Legacy Partner', password: crypto.randomBytes(12).toString('base64url') } });
  assert.equal(reg.status, 201, 'partner registered');
}

test('valid legacy token → session cookie + redirect to status', async () => {
  const t = sign({ sub: PARTNER_EMAIL, dest: '/portal/status', exp: Date.now() + 3600_000 });
  const r = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.redirect, '/status.html');
  const cookie = r.headers.get('set-cookie');
  assert.ok(/kyc_sid=/.test(cookie || ''), 'session cookie issued');
  const me = await call('GET', '/api/auth/me', { cookie: cookie.split(';')[0] });
  assert.equal(me.status, 200, 'exchanged session is live');
});

test('staff account → 403, no session (staff sign in with password + MFA)', async () => {
  const t = sign({ sub: ADMIN_EMAIL, dest: '/portal/status', exp: Date.now() + 3600_000 });
  const r = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(r.status, 403);
  assert.ok(!/kyc_sid=/.test(r.headers.get('set-cookie') || ''), 'no session cookie for a staff address');
  const again = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(again.status, 409, 'the refused token is still burned');
});

test('replayed token → 409 (single use, permanently consumed)', async () => {
  const t = sign({ sub: PARTNER_EMAIL, exp: Date.now() + 3600_000 });
  const first = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(first.status, 200);
  const replay = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(replay.status, 409);
});

test('tampered signature → 401', async () => {
  const t = sign({ sub: PARTNER_EMAIL, exp: Date.now() + 3600_000 }, crypto.randomBytes(32).toString('hex'));
  const r = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(r.status, 401);
});

test('expired token → 401', async () => {
  const t = sign({ sub: PARTNER_EMAIL, exp: Date.now() - 1000 });
  const r = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(r.status, 401);
});

test('unknown legacy account → structured no_account, no session', async () => {
  const t = sign({ sub: 'never-existed@example.com', exp: Date.now() + 3600_000 });
  const r = await call('POST', '/api/migration/exchange-token', { body: { token: t } });
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.reason, 'no_account');
  assert.ok(!r.headers.get('set-cookie'));
});

test('garbage shapes → 401 without detail', async () => {
  for (const bad of ['', 'no-dot', 'a.b', '###.' + 'a'.repeat(64)]) {
    const r = await call('POST', '/api/migration/exchange-token', { body: { token: bad } });
    assert.equal(r.status, 401, 'shape: ' + JSON.stringify(bad));
  }
});

after(async () => {
  await new Promise(r => app.server.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
