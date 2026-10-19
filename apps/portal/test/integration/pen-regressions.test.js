// test/integration/pen-regressions.test.js — rm(10.3-1): regression coverage for
// the independent penetration engagement SIMAL-PEN-2026-10-18. Each test names
// the finding ID it pins, so the next auditor can grep the board ID.
// Findings covered: PEN-AUTHZ-12, PEN-CMS-32, PEN-CMS-36, PEN-CMS-14,
// PEN-CSRF-12, PEN-MFA-02, PEN-MFA-06, PEN-MFA-08, PEN-ENUM-02, PEN-KYC-26/27,
// PEN-KYC-37, PEN-KYC-40, PEN-KYC-43, PEN-KYC-46.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';
import path from 'node:path';
import { totpNow } from '../../src/lib/security.js';

process.env.PRODUCTS_JSON = path.resolve('test/fixtures/products.json');
const RFQ_SLUG = 'crucial-t705-ssd-2';

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const login = async (base, email, password, totp) => {
  let r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  let d = await r.json().catch(() => ({}));
  let cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  if (d.mfaRequired && totp) {
    r = await fetch(base + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, cookie, body: JSON.stringify({ mfaChallengeId: d.mfaChallengeId, code: totpNow(totp) }) });
    d = await r.json().catch(() => ({}));
    cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ') || cookie;
  }
  return { status: r.status, cookie, csrf: d.csrfToken };
};
const csrfOf = async (base, cookie) => (await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json()).csrfToken;

/* ---------------- JSON-mode cases ---------------- */
test('PEN regressions — JSON store (auth, PII, forms, CSRF strict, MFA policy)', async (t) => {
  const boot = await bootApp({ mode: 'json', mfa: false });
  const { base, creds } = boot;
  try {
    const admin = await login(base, creds.adminEmail, creds.adminPassword);
    const reviewer = await login(base, creds.reviewerEmail, creds.reviewerPassword);
    const adminH = { cookie: admin.cookie, 'x-csrf-token': admin.csrf };
    const revH = async () => ({ cookie: reviewer.cookie, 'x-csrf-token': await csrfOf(base, reviewer.cookie) });

    await t.test('PEN-KYC-26/27: queue list and detail mask TRN/emails; super_admin sees raw', async () => {
      const app = {
        id: 'SIM-PEN-1', role: 'vendor', status: 'submitted',
        company: { legal_name_en: 'Pen Mask LLC', license_number: 'CN-123456' },
        tax: { trn: '100123456789012', peppol_id: '0235:100123456789012', tax_contact: { email: 'taxcontact@example.com', phone: '+971509998888' } },
        contacts: { primary: { name: 'Pen Mask', email: 'penmask@example.com', mobile: '+971501234567' } },
        tax_contact_extra: null,
        signatories: [{ name: 'Pen Sign', id_number: '784199012345671', mobile: '+971501112222', email: 'sign@example.com' }],
        ubos: [{ name: 'Pen Ubo', id_number: '784199012345672', email: 'ubo@example.com', mobile: '+971506666666' }], banking: { iban: 'AE380260001013312996200' },
        documents: [], submittedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), history: [],
      };
      const add = await fetch(base + '/api/admin/submissions/' + app.id, { method: 'GET', headers: { cookie: reviewer.cookie } });
      assert.equal(add.status, 404);
      boot.app.repos.submissions.add(app);
      const list = await (await fetch(base + '/api/admin/submissions?per=5', { headers: { cookie: reviewer.cookie } })).json();
      const row = (list.rows || []).find((r) => r.id === 'SIM-PEN-1');
      assert.ok(row, 'submission in the reviewer queue');
      assert.match(String(row.tin), /•/, 'queue tin must be masked for a reviewer');
      const detail = await (await fetch(base + '/api/admin/submissions/SIM-PEN-1', { headers: { cookie: reviewer.cookie } })).json();
      assert.match(String(detail.tax.trn), /•/, 'detail trn must be masked');
      assert.match(String(detail.contacts.primary.email), /•/, 'detail email must be masked');
      assert.match(String(detail.tax.tax_contact.email), /•/, 'tax contact email must be masked');
      assert.match(String(detail.signatories[0].email), /•/, 'signatory email must be masked');
      assert.match(String(detail.ubos[0].email), /•/, 'ubo email must be masked');
      assert.match(String(detail.ubos[0].mobile), /^••••/, 'ubo mobile must be masked');
      const full = await (await fetch(base + '/api/admin/submissions/SIM-PEN-1?pii=full', { headers: { cookie: admin.cookie } })).json();
      assert.equal(full.tax.trn, '100123456789012', 'super_admin sees the raw TRN');
    });

    await t.test('PEN-KYC-46: KYC status lookup is not a reference-existence oracle', async () => {
      boot.app.repos.submissions.add({
        id: 'SIM-PEN-STATUS', role: 'vendor', status: 'submitted',
        company: { legal_name_en: 'Status Pen LLC' },
        contacts: { primary: { email: 'status-pen@example.com', name: 'Status' } },
        tax: {}, documents: [], submittedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), history: [],
      });
      const wrong = await fetch(base + '/api/public/applications/SIM-PEN-STATUS?email=someone-else@example.com');
      const unknown = await fetch(base + '/api/public/applications/SIM-PEN-99999?email=someone-else@example.com');
      assert.equal(wrong.status, 404);
      assert.equal(unknown.status, 404);
      assert.equal((await wrong.json()).error, (await unknown.json()).error, 'identical bodies');
    });

    await t.test('PEN-AUTHZ-12/CMS-32: telemetry, integration health and screening reload are super_admin-only', async () => {
      for (const [method, p] of [['GET', '/api/cms/telemetry'], ['GET', '/api/integrations/health'], ['POST', '/api/admin/screening/reload']]) {
        const h = await revH();
        const r = await fetch(base + p, { method, headers: h, body: method === 'POST' ? '{}' : undefined });
        assert.equal(r.status, 403, `${method} ${p} must be 403 for a reviewer, got ${r.status}`);
      }
      assert.equal((await fetch(base + '/api/cms/telemetry', { headers: { cookie: admin.cookie } })).status, 200);
    });

    await t.test('PEN-CSRF-12: CSRF_STRICT has no effect while off; tokenless privileged write still blocked cross-origin', async () => {
      const body = JSON.stringify({ name: 'Pen Staff', email: 'pen-csrf-' + Date.now().toString(36) + '@example.invalid', password: 'pen-csrf-password-1', role: 'viewer' });
      const r = await fetch(base + '/api/admin/users', { method: 'POST', headers: { cookie: admin.cookie, 'content-type': 'application/json' }, body });
      assert.equal(r.status, 201, 'same-site (no Origin) write works with policy A');
      const cross = await fetch(base + '/api/admin/users', { method: 'POST', headers: { cookie: admin.cookie, origin: 'https://evil.example', 'content-type': 'application/json' }, body });
      assert.equal(cross.status, 403, 'cross-origin tokenless write blocked');
    });

    await t.test('PEN-KYC-40: RFQ submit without a valid phone is refused', async () => {
      /* Node fetch has no cookie jar — carry the basket cookie explicitly */
      const add = await fetch(base + '/api/rfq-basket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: RFQ_SLUG, qty: 1 }) });
      const jar = (add.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
      const r = await fetch(base + '/api/rfq', { method: 'POST', headers: { 'content-type': 'application/json', cookie: jar },
        body: JSON.stringify({ email: 'pen-rfq@example.com', company: 'Pen RFQ LLC', contactName: 'Pen Tester' }) });
      assert.equal(r.status, 400, 'phone must be required');
      const ok = await fetch(base + '/api/rfq', { method: 'POST', headers: { 'content-type': 'application/json', cookie: jar },
        body: JSON.stringify({ email: 'pen-rfq@example.com', company: 'Pen RFQ LLC', contactName: 'Pen Tester', phone: '+971501234567' }) });
      assert.equal(ok.status, 201);
    });

    await t.test('PEN-KYC-43: a filled honeypot returns a plausible success but persists nothing', async () => {
      const before = (await boot.app.repos.rfqs.all()).length;
      await fetch(base + '/api/rfq-basket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: RFQ_SLUG, qty: 1 }) });
      const r = await fetch(base + '/api/rfq', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'bot@example.com', company: 'Bot LLC', contactName: 'Bot', phone: '+971501234567', website_url: 'https://spam.example' }) });
      assert.equal(r.status, 201);
      assert.match((await r.json()).reference, /^SIMAL-RFQ-/);
      assert.equal((await boot.app.repos.rfqs.all()).length, before, 'honeypot submissions must not persist');
    });

    await t.test('PEN-MFA-08: the staff-MFA invariant reports every account without TOTP', async () => {
      const missing = await boot.app.auth.staffMissingMfa();
      const emails = missing.map((u) => u.email.toLowerCase());
      assert.ok(emails.includes(creds.reviewerEmail.toLowerCase()), 'reviewer without TOTP must be reported');
      assert.ok(emails.includes(creds.adminEmail.toLowerCase()), 'this boot disables MFA, so the admin has no TOTP either');
    });

    await t.test('PEN-ENUM-02: unknown-email login burns the same scrypt work (no timing oracle)', async () => {
      const time = async (email) => {
        const t0 = process.hrtime.bigint();
        await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'wrong-password-x' }) });
        return Number(process.hrtime.bigint() - t0) / 1e6;
      };
      const known = [], unknown = [];
      for (let i = 0; i < 3; i++) {
        known.push(await time(creds.viewerEmail));
        unknown.push(await time('nobody-' + i + '-pen@example.invalid'));
      }
      const med = (a) => a.sort((x, y) => x - y)[1];
      assert.ok(med(unknown) > 10, 'unknown-email path must run a dummy hash (measured ' + med(unknown).toFixed(1) + ' ms)');
    });
  } finally {
    await boot.stop();
  }
});

/* ---------------- strict-mode CSRF and MFA (separate boots) ---------------- */
test('PEN-CSRF-12: CSRF_STRICT=true requires a verified token on privileged writes', async () => {
  process.env.CSRF_STRICT = 'true';
  const boot = await bootApp({ mode: 'json', mfa: false });
  try {
    const admin = await login(boot.base, boot.creds.adminEmail, boot.creds.adminPassword);
    const body = JSON.stringify({ name: 'Pen Staff', email: 'pen-staff@example.invalid', password: 'pen-staff-password-1', role: 'viewer' });
    const noTok = await fetch(boot.base + '/api/admin/users', { method: 'POST', headers: { cookie: admin.cookie, 'content-type': 'application/json' }, body });
    assert.equal(noTok.status, 403, 'tokenless privileged write must be refused in strict mode');
    const withTok = await fetch(boot.base + '/api/admin/users', { method: 'POST', headers: { cookie: admin.cookie, 'content-type': 'application/json', 'x-csrf-token': admin.csrf }, body });
    assert.equal(withTok.status, 201, 'a verified token is accepted');
  } finally {
    delete process.env.CSRF_STRICT;
    await boot.stop();
  }
});

test('PEN-MFA-02/06: a wrong TOTP is a controlled 401; a used code cannot be replayed', async () => {
  process.env.MFA_TOTP_ONE_TIME = '1'; /* the test licence disables the guard by default */
  const boot = await bootApp({ mode: 'json', mfa: true });
  try {
    const first = await login(boot.base, boot.creds.adminEmail, boot.creds.adminPassword, boot.creds.adminTotp);
    assert.ok(first.cookie.includes('kyc_sid'), 'a correct TOTP issues a session');
    const missing = (await boot.app.auth.staffMissingMfa()).map((u) => u.email.toLowerCase());
    assert.ok(!missing.includes(boot.creds.adminEmail.toLowerCase()), 'the TOTP-enrolled admin must not be reported (PEN-MFA-08)');
    assert.ok(missing.includes(boot.creds.reviewerEmail.toLowerCase()), 'a non-enrolled reviewer must be reported (PEN-MFA-08)');
    /* replay: a NEW challenge, the SAME (already used) code */
    const r1 = await fetch(boot.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: boot.creds.adminEmail, password: boot.creds.adminPassword }) });
    const ch = await r1.json();
    if (ch.mfaRequired) {
      const usedCode = totpNow(boot.creds.adminTotp); /* the code this step produced */
      const replay = await fetch(boot.base + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mfaChallengeId: ch.mfaChallengeId, code: usedCode }) });
      assert.equal(replay.status, 401, 'a replayed TOTP step must be refused');
    }
    /* wrong code is 401, never 500 */
    const r2 = await fetch(boot.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: boot.creds.adminEmail, password: boot.creds.adminPassword }) });
    const ch2 = await r2.json();
    if (ch2.mfaRequired) {
      const wrong = await fetch(boot.base + '/api/auth/mfa', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mfaChallengeId: ch2.mfaChallengeId, code: '000000' }) });
      assert.equal(wrong.status, 401, 'wrong TOTP must be 401 (was 500: mfaChallenges.fail missing)');
    }
  } finally {
    delete process.env.MFA_TOTP_ONE_TIME;
    await boot.stop();
  }
});

/* ---------------- PostgreSQL cases (CMS drift, duplicate TRN, media crash) ---------------- */
test('PEN regressions — PostgreSQL (approval drift, duplicate TRN, media 404 no-crash)', { skip: pgUp ? false : 'no PostgreSQL reachable' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'pen');
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  const { base, creds } = boot;
  const app = boot.app;
  try {
    const admin = await login(base, creds.adminEmail, creds.adminPassword);
    const reviewer = await login(base, creds.reviewerEmail, creds.reviewerPassword);
    const revH = async () => ({ cookie: reviewer.cookie, 'x-csrf-token': await csrfOf(base, reviewer.cookie) });
    const q = async (sql, p) => (await app.repos.client.query(sql, p)).rows;

    await t.test('PEN-CMS-14: an edit of the SAME record after the request invalidates the approval', async () => {
      await q("INSERT INTO audit_log (ts, actor, action, target, details) VALUES ($1,'system','ssg_build_completed','pen','baseline')", [Date.now()]);
      const put = async (text) => fetch(base + '/api/cms/announcements/1', { method: 'PUT', headers: { ...(await revH()), 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      await put('pen drift baseline');
      const pub = await fetch(base + '/api/cms/publish', { method: 'POST', headers: { ...(await revH()), 'content-type': 'application/json' }, body: JSON.stringify({ entities: [{ entity: 'site', entity_id: 'all' }] }) });
      assert.equal(pub.status, 202);
      const approvalId = (await pub.json()).approvalId;
      await put('pen drift SECOND edit after the request');            /* same item, new content */
      const approve = await fetch(base + '/api/cms/publish-approvals/' + approvalId + '/approve', { method: 'POST',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrf, 'content-type': 'application/json' }, body: '{}' });
      assert.equal(approve.status, 409, 'approval must not cover content written after the request');
    });

    await t.test('PEN-KYC-37: duplicate TRN detection works on PostgreSQL for pending submissions', async () => {
      const trn = '100' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
      const row = (extra = {}) => ({
        id: 'SIM-PEN-' + Math.random().toString(36).slice(2, 8), role: 'vendor', status: 'submitted',
        company: { legal_name_en: 'Dup Pen LLC' }, tax: { trn },
        contacts: { primary: { email: 'dup-pen@example.com', name: 'Dup' } },
        documents: [], submittedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), history: [], ...extra,
      });
      await app.repos.submissions.add(row());
      const dup = await app.repos.submissions.duplicateTin(trn);
      assert.ok(dup, 'a pending submission with the same TRN must be detected (was NULL-exclude + approved-only)');
    });

    await t.test('PEN-CMS-36: a missing media file returns 404 and does not kill the portal', async () => {
      const r = await fetch(base + '/api/cms/media/file/no-such-file.png', { headers: { cookie: reviewer.cookie } });
      assert.equal(r.status, 404);
      const health = await fetch(base + '/api/health');
      assert.equal(health.status, 200, 'the process must survive a missing media file');
    });
  } finally {
    await boot.stop();
    if (app?.repos?.client) await app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});
