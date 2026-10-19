/* ==========================================================================
 * Integration tests: admin workspace — user CRUD, sessions, settings,
 * report builder + CSV export. Credentials generated at runtime (no literals).
 * ========================================================================== */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
/* Documents are encrypted at rest and both stores refuse a default key (rm 10.4-1). A clean
 * CI runner has no apps/portal/.env, so every suite that boots the app brings its own key
 * (platform run #12 failed workspace + pg-mode-journey without it). */
if (!process.env.DOC_ENCRYPTION_KEY) process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');

/* ---- boot environment (before importing config/server) ---- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'kyc-ws-'));
process.env.NODE_KYC_TEST = '1';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATA_DIR = TMP;
process.env.SESSION_IDLE_MINUTES = '20';
const ADMIN_EMAIL = 'ws-admin@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
const ADMIN_TOTP = crypto.randomBytes(20).toString('base64').replace(/=+$/, '').toUpperCase();
const REVIEWER_EMAIL = 'ws-reviewer@example.com';
const REVIEWER_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_TOTP_SECRET = ADMIN_TOTP;
process.env.ADMIN_MFA_REQUIRED = 'true'; // pin: a developer .env with MFA off must not leak into tests
process.env.REVIEWER_EMAIL = REVIEWER_EMAIL;
process.env.REVIEWER_PASSWORD = REVIEWER_PASSWORD;

const { createApp } = await import('../../src/server.js');
const { totpNow } = await import('../../src/lib/security.js');
const { V } = await import('../../src/domain/validators.js');

const app = await createApp({ dataDir: TMP });
const server = app.server;
await new Promise(res => server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + server.address().port;

/* seed one full application so reports/CSV have data to shape */
const pdfBytes = () => Buffer.concat([Buffer.from('%PDF-1.4 ws\n'), crypto.randomBytes(64)]);
function fullApplication(role = 'vendor', email = 'ws-partner@example.com') {
  return {
    role,
    company: {
      legal_name_en: 'Workspace Test Trading LLC', entity_type: 'LLC', country: 'AE',
      license_number: 'CN-WS-1', license_authority: 'DED',
      license_issue: '2024-01-01', license_expiry: '2028-01-01',
      business_activity: 'Wholesale of IT components',
      address: { building: 'B1', street: 'S1', city: 'Dubai', emirate: 'Dubai', country: 'United Arab Emirates' },
    },
    tax: {
      trn: V.makeTIN('100' + String(crypto.randomBytes(8).readBigUInt64BE(0)).replace(/\D/g, '').slice(0, 10).padEnd(10, '7')),
      vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED',
    },
    contacts: { primary: { name: 'Pat Ner', designation: 'Owner', email, mobile: '+971501234567' } },
    signatories: [{ name: 'Pat Ner', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P123456', id_expiry: '2029-01-01', authority_basis: 'MOA (manager)', email }],
    ubos: [{ name: 'Pat Ner', nationality: 'AE', id_type: 'passport', id_number: 'P654321', ownership_pct: '100', country_of_residence: 'UAE' }],
    banking: { bank_name: 'Emirates NBD', iban: V.makeIBAN('026', String(crypto.randomBytes(4).readUInt32BE(0))), account_holder: 'Workspace Test Trading LLC', currency: 'AED' },
    declarations: { accuracy: { checked: true, signed_name: 'Pat Ner' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    documents: (role === 'vendor'
      ? ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof']
      : ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'bank_proof']
    ).map(dt => ({ type: dt, name: dt + '.pdf', mime: 'application/pdf', dataB64: pdfBytes().toString('base64') })),
  };
}

const api = {
  async call(method, p, { body, cookie, headers = {}, raw = false } = {}) {
    const res = await fetch(BASE + p, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    if (raw) return { status: res.status, headers: res.headers, text: await res.text(), setCookie };
    let json = null;
    try { json = await res.json(); } catch { /* csv or empty */ }
    return { status: res.status, json, setCookie };
  },
};
const cookieOf = (r) => (r.setCookie || '').split(';')[0];

let adminCookie;
before(async () => {
  const r1 = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  assert.equal(r1.status, 200);
  const r2 = await api.call('POST', '/api/auth/mfa', { body: { mfaChallengeId: r1.json.mfaChallengeId, code: totpNow(ADMIN_TOTP) } });
  assert.equal(r2.status, 200);
  adminCookie = cookieOf(r2);
});
async function reviewerCookie() {
  const r = await api.call('POST', '/api/auth/login', { body: { email: REVIEWER_EMAIL, password: REVIEWER_PASSWORD } });
  assert.equal(r.status, 200);
  return cookieOf(r);
}

/* ==================== USER MANAGEMENT ==================== */

test('users list: super admin OK, reviewer forbidden (RBAC)', async () => {
  const ok = await api.call('GET', '/api/admin/users', { cookie: adminCookie });
  assert.equal(ok.status, 200);
  assert.ok(Array.isArray(ok.json) && ok.json.length >= 2);
  assert.ok(ok.json.every(u => !('passwordHash' in u) && !('totpSecret' in u)), 'no secrets leak in user list');
  const me = ok.json.find(u => u.email === ADMIN_EMAIL);
  assert.ok(me && me.role === 'super_admin' && me.hasTotp === true);
  assert.ok(typeof me.lastLogin === 'number' || me.lastLogin === null);

  const rev = await api.call('GET', '/api/admin/users', { cookie: await reviewerCookie() });
  assert.equal(rev.status, 403, 'reviewer must not access user management');
});

test('user create: happy path + validation + duplicate email', async () => {
  const email = 'ws-newbie@example.com';
  const pw = crypto.randomBytes(12).toString('base64url');
  const created = await api.call('POST', '/api/admin/users', {
    cookie: adminCookie,
    body: { email, name: 'Ws Newbie', role: 'viewer', password: pw },
  });
  assert.equal(created.status, 201);
  assert.ok(created.json.id);

  /* the new account can actually sign in */
  const login = await api.call('POST', '/api/auth/login', { body: { email, password: pw } });
  assert.equal(login.status, 200);
  assert.ok(!login.json.mfaRequired);

  assert.equal((await api.call('POST', '/api/admin/users', { cookie: adminCookie, body: { email, name: 'Dup', role: 'viewer', password: pw } })).status, 409);
  assert.equal((await api.call('POST', '/api/admin/users', { cookie: adminCookie, body: { email: 'x@y.z', name: 'X', role: 'ceo', password: pw } })).status, 400);
  assert.equal((await api.call('POST', '/api/admin/users', { cookie: adminCookie, body: { email: 'x@y.z', name: 'X', role: 'viewer', password: 'short' } })).status, 400);
  assert.equal((await api.call('POST', '/api/admin/users', { cookie: adminCookie, body: { email: 'not-an-email', name: 'X', role: 'viewer', password: pw } })).status, 400);
});

test('user update: role change OK; bootstrap admin protected', async () => {
  const list = await api.call('GET', '/api/admin/users', { cookie: adminCookie });
  const newbie = list.json.find(u => u.email === 'ws-newbie@example.com');
  const boot = list.json.find(u => u.email === ADMIN_EMAIL);

  const up = await api.call('PUT', '/api/admin/users/' + newbie.id, {
    cookie: adminCookie, body: { name: 'Ws Newbie II', role: 'reviewer' },
  });
  assert.equal(up.status, 200);
  assert.equal(up.json.role, 'reviewer');
  assert.equal(up.json.name, 'Ws Newbie II');

  assert.equal((await api.call('PUT', '/api/admin/users/' + boot.id, { cookie: adminCookie, body: { role: 'viewer' } })).status, 403);
  assert.equal((await api.call('PUT', '/api/admin/users/' + boot.id, { cookie: adminCookie, body: { active: false } })).status, 403);
  assert.equal((await api.call('PUT', '/api/admin/users/does-not-exist', { cookie: adminCookie, body: { name: 'Z' } })).status, 404);
});

test('reset password: issues one-time credential and it works', async () => {
  const list = await api.call('GET', '/api/admin/users', { cookie: adminCookie });
  const newbie = list.json.find(u => u.email === 'ws-newbie@example.com');
  const r = await api.call('POST', '/api/admin/users/' + newbie.id + '/reset-password', { cookie: adminCookie, body: {} });
  assert.equal(r.status, 200);
  assert.ok(r.json.temporaryPassword && r.json.temporaryPassword.length >= 12);
  const login = await api.call('POST', '/api/auth/login', { body: { email: 'ws-newbie@example.com', password: r.json.temporaryPassword } });
  assert.equal(login.status, 200);
});

test('deactivate: self blocked; other OK and login refused', async () => {
  const list = await api.call('GET', '/api/admin/users', { cookie: adminCookie });
  const me = list.json.find(u => u.email === ADMIN_EMAIL);
  const newbie = list.json.find(u => u.email === 'ws-newbie@example.com');

  /* self-deactivation is refused (this also covers the bootstrap account: same guard order) */
  assert.equal((await api.call('POST', '/api/admin/users/' + me.id + '/deactivate', { cookie: adminCookie, body: {} })).status, 400);

  const off = await api.call('POST', '/api/admin/users/' + newbie.id + '/deactivate', { cookie: adminCookie, body: {} });
  assert.equal(off.status, 200);
  assert.equal(off.json.active, false);
  /* deactivated accounts cannot sign in */
  const tempPw = (await api.call('POST', '/api/admin/users/' + newbie.id + '/reset-password', { cookie: adminCookie, body: {} })).json.temporaryPassword;
  const denied = await api.call('POST', '/api/auth/login', { body: { email: 'ws-newbie@example.com', password: tempPw } });
  assert.ok([401, 403].includes(denied.status));
});

test('active sessions + force logout terminates a live session', async () => {
  /* open a second admin session — it becomes the victim */
  const r1 = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const r2 = await api.call('POST', '/api/auth/mfa', { body: { mfaChallengeId: r1.json.mfaChallengeId, code: totpNow(ADMIN_TOTP) } });
  assert.equal(r2.status, 200);
  const victimCookie = cookieOf(r2);

  const sessions = await api.call('GET', '/api/admin/sessions', { cookie: adminCookie });
  assert.equal(sessions.status, 200);
  assert.ok(sessions.json.length >= 2);
  assert.ok(sessions.json.every(s => typeof s.sid === 'string' && s.sid.length <= 9)); /* truncated prefix only */

  /* sessions are insertion-ordered: the victim we just opened is the last entry */
  const prefix = sessions.json[sessions.json.length - 1].sid.replace('…', '');
  const kill = await api.call('POST', '/api/admin/sessions/' + encodeURIComponent(prefix) + '/force-logout', { cookie: adminCookie, body: {} });
  assert.equal(kill.status, 200);
  /* victim session is dead, the suite's own session is untouched */
  assert.equal((await api.call('GET', '/api/admin/users', { cookie: victimCookie })).status, 401);
  assert.equal((await api.call('GET', '/api/admin/users', { cookie: adminCookie })).status, 200);
  assert.equal((await api.call('POST', '/api/admin/sessions/ffffffff/force-logout', { cookie: adminCookie, body: {} })).status, 404);
});

/* ==================== SETTINGS ==================== */

test('settings: read + write round-trip, reviewer forbidden', async () => {
  const revCookie = await reviewerCookie();
  assert.equal((await api.call('GET', '/api/admin/settings', { cookie: revCookie })).status, 403);

  const before = await api.call('GET', '/api/admin/settings', { cookie: adminCookie });
  assert.equal(before.status, 200);

  const tin = V.makeTIN('100' + String(crypto.randomBytes(8).readBigUInt64BE(0)).replace(/\D/g, '').slice(0, 10).padEnd(10, '7'));
  const upd = await api.call('PUT', '/api/admin/settings', { cookie: adminCookie, body: { simalTin: tin } });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.simalTin, tin);

  /* invalid TIN rejected by the domain validator */
  assert.equal((await api.call('PUT', '/api/admin/settings', { cookie: adminCookie, body: { simalTin: '123' } })).status, 400);

  /* restore so later suites see the original value */
  await api.call('PUT', '/api/admin/settings', { cookie: adminCookie, body: { simalTin: before.json.simalTin || '' } });
});

/* ==================== REPORT BUILDER ==================== */

test('seed: one submitted application exists for reports', async () => {
  const r = await api.call('POST', '/api/public/applications', { body: { application: fullApplication('vendor', 'ws-partner@example.com') } });
  assert.equal(r.status, 201);
  assert.ok(r.json.reference);
});

test('report catalog exposes built-ins and field dictionary', async () => {
  const r = await api.call('GET', '/api/admin/reports', { cookie: adminCookie });
  assert.equal(r.status, 200);
  const ids = r.json.builtIn.map(b => b.id);
  for (const want of ['onboarding-summary', 'screening-hits', 'approved-master', 'rejected-analysis', 'user-activity']) {
    assert.ok(ids.includes(want), 'built-in present: ' + want);
  }
  assert.ok(r.json.availableFields.length >= 20);
});

test('custom report: field selection, status filter, sorting', async () => {
  const r = await api.call('POST', '/api/admin/reports/build', {
    cookie: adminCookie,
    body: {
      fields: ['id', 'company.legal_name_en', 'status', 'submittedAtISO'],
      filters: { status: 'all' },
      sortBy: 'submittedAtISO', sortDir: 'desc',
    },
  });
  assert.equal(r.status, 200);
  assert.ok(r.json.rowCount >= 0);
  assert.deepEqual(r.json.columns.map(c => c.key), ['id', 'company.legal_name_en', 'status', 'submittedAtISO']);
  /* unknown fields are dropped, empty selection falls back */
  const fb = await api.call('POST', '/api/admin/reports/build', { cookie: adminCookie, body: { fields: ['nonsense'] } });
  assert.equal(fb.status, 200);
  assert.ok(fb.json.columns.length >= 3);
});

test('built-in reports resolve their advertised defaults', async () => {
  const ob = await api.call('POST', '/api/admin/reports/build', { cookie: adminCookie, body: { builtIn: 'onboarding-summary' } });
  assert.equal(ob.status, 200);
  assert.equal(ob.json.columns.length, 8, 'onboarding-summary advertises 8 fields');
  assert.ok(ob.json.columns.some(c => c.key === 'ageDays'));

  const ua = await api.call('POST', '/api/admin/reports/build', { cookie: adminCookie, body: { builtIn: 'user-activity' } });
  assert.equal(ua.status, 200);
  assert.deepEqual(ua.json.columns.map(c => c.key), ['ts', 'actor', 'action', 'target', 'details']);
  assert.ok(ua.json.rowCount >= 1, 'audit log has entries (this suite generates some)');
  assert.ok(ua.json.rows.some(row => row.action === 'report_generated' || row.action === 'login'));
});

test('CSV export: correct content type, quoted header, CRLF rows', async () => {
  const r = await api.call('POST', '/api/admin/reports/export.csv', {
    cookie: adminCookie, raw: true,
    headers: { 'Content-Type': 'application/json' },
    body: { builtIn: 'onboarding-summary' },
  });
  assert.equal(r.status, 200);
  assert.ok(r.headers.get('content-type').startsWith('text/csv'));
  assert.ok((r.headers.get('content-disposition') || '').includes('attachment'));
  const lines = r.text.split('\r\n').filter(Boolean);
  assert.ok(lines.length >= 2);
  assert.ok(lines[0].startsWith('"Reference"'));
  assert.ok(lines.every(l => l.split(',').length === lines[0].split(',').length), 'rectangular CSV');
});

/* teardown */
after(async () => {
  await new Promise(r => server.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
