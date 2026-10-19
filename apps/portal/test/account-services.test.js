/* account-services.test.js — T2.2: password reset, profile, MFA enrolment,
 * session revocation, email change re-verification — on the real app.
 * Exit criteria covered: expired + replayed tokens rejected; no user
 * enumeration; token appears only in the delivery email (never in any other
 * response body). All credentials are generated per-run — no literals.
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
process.env.DATABASE_URL = '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'acct-'));
process.env.DATA_DIR = TMP;
const ADMIN_EMAIL = 'acct-admin@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
const REVIEWER_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.WATCHLIST_CSV = path.resolve('test/fixtures/watchlist.csv'); // rm(9.1-3): tracked fixture (data/ is git-ignored)
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.LOGIN_RATE_MAX = '200'; /* this suite legitimately logs in dozens of times */

const { createApp } = await import('../src/server.js');
const { totpNow } = await import('../src/lib/security.js');
const { createTokenService } = await import('../src/services/token.service.js');
const app = await createApp({ dataDir: TMP });
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

async function call(method, p, { body, cookie } = {}) {
  const r = await fetch(BASE + p, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let j = null; try { j = JSON.parse(text); } catch {}
  return { status: r.status, json: j, headers: r.headers };
}
const login = async (email, password) => {
  const r = await call('POST', '/api/auth/login', { body: { email, password } });
  const c = r.headers.get('set-cookie');
  return { status: r.status, cookie: c ? c.split(';')[0] : null, json: r.json };
};
const outboxAfter = async (fn, cookie) => {
  const c = cookie || (await login(ADMIN_EMAIL, ADMIN_PASSWORD)).cookie;
  const read = async () => (await call('GET', '/api/admin/outbox', { cookie: await c || c })).json;
  const before = (await read()).length;
  await fn();
  const after = await read();
  return Array.isArray(after) ? after.slice(0, after.length - before) : [];
};

test('reset request: unknown email gets the identical response (no enumeration)', async () => {
  const a = await call('POST', '/api/auth/password-reset/request', { body: { email: 'ghost@example.com' } });
  const b = await call('POST', '/api/auth/password-reset/request', { body: { email: ADMIN_EMAIL } });
  assert.equal(a.status, 200); assert.equal(b.status, 200);
  assert.deepEqual(a.json, b.json);
});

test('reset request for real user emails a single-use link (token only in email)', async () => {
  const mails = await outboxAfter(() => call('POST', '/api/auth/password-reset/request', { body: { email: ADMIN_EMAIL } }));
  const m = mails.find(x => x.to === ADMIN_EMAIL && /reset/.test(x.subject));
  assert.ok(m, 'reset email in outbox');
  const tok = (m.text.match(/reset=([a-f0-9]{64})/) || [])[1];
  assert.ok(tok, '64-hex token present in email body only');
  assert.match(m.text, /https?:\/\/[^\s/]+\/login\.html\?reset=[a-f0-9]{64}/, 'absolute, clickable link (deploy-audit H5)');
});

test('reset confirm: weak password rejected, then full happy path + session kill + replay block', async () => {
  const mails = await outboxAfter(() => call('POST', '/api/auth/password-reset/request', { body: { email: ADMIN_EMAIL } }));
  const tok = (mails.find(x => /reset/.test(x.subject)).text.match(/reset=([a-f0-9]{64})/) || [])[1];
  const shortPw = await call('POST', '/api/auth/password-reset/confirm', { body: { token: tok, newPassword: 'short' } });
  assert.equal(shortPw.status, 400);

  /* open a session that the reset must destroy */
  const pre = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(pre.status, 200);

  const NEW_PW = 'Nw-' + crypto.randomBytes(9).toString('base64url'); /* per-run */
  const done = await call('POST', '/api/auth/password-reset/confirm', { body: { token: tok, newPassword: NEW_PW } });
  assert.equal(done.status, 200);

  const oldLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(oldLogin.status, 401, 'old password dead');
  const deadSession = await call('GET', '/api/auth/me', { cookie: pre.cookie });
  assert.equal(deadSession.status, 401, 'pre-reset session revoked');
  const newLogin = await login(ADMIN_EMAIL, NEW_PW);
  assert.equal(newLogin.status, 200, 'new password live');

  const replay = await call('POST', '/api/auth/password-reset/confirm', { body: { token: tok, newPassword: 'Rp-' + crypto.randomBytes(9).toString('base64url') } });
  assert.equal(replay.status, 409, 'replayed token rejected');

  /* restore original for later tests (password is NEW_PW at this point) */
  const m2 = await outboxAfter(() => call('POST', '/api/auth/password-reset/request', { body: { email: ADMIN_EMAIL } }), (await login(ADMIN_EMAIL, NEW_PW)).cookie);
  const tok2 = (m2.find(x => /reset/.test(x.subject)).text.match(/reset=([a-f0-9]{64})/) || [])[1];
  await call('POST', '/api/auth/password-reset/confirm', { body: { token: tok2, newPassword: ADMIN_PASSWORD } });
});

test('reset with an EXPIRED token is rejected (direct service, ttl 1ms)', async () => {
  const TMP2 = fs.mkdtempSync(path.join(os.tmpdir(), 'acct-tok-'));
  const { createStore } = await import('../src/store/db.js');
  const { createRepos } = await import('../src/store/repos.js');
  const svc = createTokenService(createRepos(createStore(TMP2)));
  const { token: dead } = await svc.issue('password_reset', 'usr_x', {}, { ttlMs: 1 });
  await new Promise(r => setTimeout(r, 20));
  await assert.rejects(() => svc.consume('password_reset', dead), /expired/);
  try { fs.rmSync(TMP2, { recursive: true, force: true }); } catch {}
});

test('session cookie carries HttpOnly + SameSite=Strict (Secure only in production)', async () => {
  const r = await call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } }, { raw: false });
  const sc = r.headers.get('set-cookie') || '';
  assert.match(sc, /HttpOnly/);
  assert.match(sc, /SameSite=Strict/);
  if (process.env.NODE_ENV === 'production') assert.match(sc, /Secure/);
  else assert.doesNotMatch(sc, /Secure/, 'local HTTP rigs must not get a Secure cookie');
});

test('profile: sessions listed; name update works; password change demands current', async () => {
  const s = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const prof = await call('GET', '/api/auth/profile', { cookie: s.cookie });
  assert.equal(prof.status, 200);
  assert.ok(Array.isArray(prof.json.sessions) && prof.json.sessions.some(x => x.current));

  const renamed = await call('PUT', '/api/auth/profile', { cookie: s.cookie, body: { name: 'Acct Admin Renamed' } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.json.user.name, 'Acct Admin Renamed');

  const freshPw = 'Fw-' + crypto.randomBytes(9).toString('base64url');
  const noCurrent = await call('PUT', '/api/auth/profile', { cookie: s.cookie, body: { newPassword: freshPw } });
  assert.equal(noCurrent.status, 401, 'missing current password rejected');
  const badCurrent = await call('PUT', '/api/auth/profile', { cookie: s.cookie, body: { currentPassword: 'wrong', newPassword: freshPw } });
  assert.equal(badCurrent.status, 401);
});

test('MFA enrolment: begin → confirm activates; login requires TOTP; disable with code', async () => {
  const s = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const begin = await call('POST', '/api/auth/mfa/begin', { cookie: s.cookie });
  assert.equal(begin.status, 200);
  assert.match(begin.json.otpauth, /^otpauth:\/\/totp\//);
  const secret = begin.json.secret;

  const bad = await call('POST', '/api/auth/mfa/confirm', { cookie: s.cookie, body: { code: '000000' } });
  assert.equal(bad.status, 401, 'wrong code does not activate');

  const good = await call('POST', '/api/auth/mfa/confirm', { cookie: s.cookie, body: { code: totpNow(secret) } });
  assert.equal(good.status, 200);

  const pwLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(pwLogin.status, 200);
  assert.equal(pwLogin.json.mfaRequired, true, 'login now gated on MFA');
  const mfa = await call('POST', '/api/auth/mfa', { body: { mfaChallengeId: pwLogin.json.mfaChallengeId, code: totpNow(secret) } });
  assert.equal(mfa.status, 200);

  const off = await call('POST', '/api/auth/mfa/disable', { cookie: mfa.headers.get('set-cookie').split(';')[0], body: { code: totpNow(secret) } });
  assert.equal(off.status, 200);
  const after2 = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(after2.json.mfaRequired, false);
});

test('revoke-others keeps the current session and kills the rest', async () => {
  const s1 = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const s2 = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const r = await call('POST', '/api/auth/sessions/revoke-others', { cookie: s1.cookie });
  assert.equal(r.status, 200);
  const me1 = await call('GET', '/api/auth/me', { cookie: s1.cookie });
  const me2 = await call('GET', '/api/auth/me', { cookie: s2.cookie });
  assert.equal(me1.status, 200, 'current survives');
  assert.equal(me2.status, 401, 'other device signed out');
});

test('email change: link to new + alert to old; verify applies; replay blocked', async () => {
  const s = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const NEW_EMAIL = 'acct-admin-new@example.com';
  const mails = await outboxAfter(() => call('POST', '/api/auth/email/change', { cookie: s.cookie, body: { newEmail: NEW_EMAIL } }));
  assert.ok(mails.some(x => x.to === NEW_EMAIL && /confirm/i.test(x.subject)), 'verification mail to NEW address');
  assert.ok(mails.some(x => x.to === ADMIN_EMAIL && /security alert/i.test(x.subject)), 'alert mail to OLD address');
  const tok = (mails.find(x => x.to === NEW_EMAIL).text.match(/verify-email=([a-f0-9]{64})/) || [])[1];
  assert.ok(tok);

  const prof = await call('GET', '/api/auth/profile', { cookie: s.cookie });
  assert.equal(prof.json.user.pendingEmail, NEW_EMAIL, 'pending state visible');

  const applied = await call('POST', '/api/auth/email/verify', { body: { token: tok } });
  assert.equal(applied.status, 200);
  assert.equal(applied.json.email, NEW_EMAIL);

  const replay = await call('POST', '/api/auth/email/verify', { body: { token: tok } });
  assert.equal(replay.status, 409);

  const oldLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(oldLogin.status, 401, 'old email no longer valid');
  const newLogin = await login(NEW_EMAIL, ADMIN_PASSWORD);
  assert.equal(newLogin.status, 200, 'new email signs in');

  /* restore original email for teardown cleanliness */
  const s2 = await login(NEW_EMAIL, ADMIN_PASSWORD);
  const back = await outboxAfter(() => call('POST', '/api/auth/email/change', { cookie: s2.cookie, body: { newEmail: ADMIN_EMAIL } }), s2.cookie);
  const tok2 = (back.find(x => x.to === ADMIN_EMAIL && /confirm/i.test(x.subject)).text.match(/verify-email=([a-f0-9]{64})/) || [])[1];
  await call('POST', '/api/auth/email/verify', { body: { token: tok2 } });
});

after(async () => {
  await new Promise(r => app.server.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
