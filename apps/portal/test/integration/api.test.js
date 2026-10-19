/* ==========================================================================
 * Integration tests: full HTTP journeys against a real server instance.
 * Credentials are generated at runtime with crypto (never literals).
 * Boot env: NODE_KYC_TEST=1 prevents the direct-run listener.
 * ========================================================================== */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/* ---- boot environment (before importing config/server) ---- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'kyc-it-'));
process.env.NODE_KYC_TEST = '1';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATA_DIR = TMP;
process.env.SESSION_IDLE_MINUTES = '20';
/* rm(9.1-3): the tracked fixture, not the default ./data/watchlist.csv — apps/portal/data/
 * is git-ignored, so on a clean CI checkout screening silently ran without a watchlist. */
process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64'); // rm(2.4-3)
process.env.WATCHLIST_CSV = fileURLToPath(new URL('../fixtures/watchlist.csv', import.meta.url));
const ADMIN_EMAIL = 'it-admin@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
const ADMIN_TOTP = crypto.randomBytes(20).toString('base64').replace(/=+$/, '').toUpperCase();
const REVIEWER_EMAIL = 'it-reviewer@example.com';
const REVIEWER_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_TOTP_SECRET = ADMIN_TOTP;
process.env.ADMIN_MFA_REQUIRED = 'true'; // pin: a developer .env with MFA off must not leak into tests
process.env.REVIEWER_EMAIL = REVIEWER_EMAIL;
process.env.REVIEWER_PASSWORD = REVIEWER_PASSWORD;
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.WEBHOOK_SECRET = crypto.randomBytes(32).toString('hex'); // rm(2.3-1)

const { createApp } = await import('../../src/server.js');
const { totpNow } = await import('../../src/lib/security.js');
const { V } = await import('../../src/domain/validators.js');

const app = await createApp({ dataDir: TMP });
const server = app.server;
await new Promise(res => server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + server.address().port;

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

/* ---------- helpers ---------- */
const sessionCache = {};
async function loginAdmin({ fresh = false } = {}) {
  if (!fresh && sessionCache.admin) return sessionCache.admin;
  const r1 = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  assert.equal(r1.status, 200);
  assert.ok(r1.json.mfaRequired);
  const r2 = await api.call('POST', '/api/auth/mfa', { body: { mfaChallengeId: r1.json.mfaChallengeId, code: totpNow(ADMIN_TOTP) } });
  assert.equal(r2.status, 200);
  const sess = { cookie: cookieOf(r2), user: r2.json.user };
  if (!fresh) sessionCache.admin = sess; // fresh sessions (logout test) are never cached
  return sess;
}
async function loginReviewer() {
  if (sessionCache.reviewer) return sessionCache.reviewer;
  const r = await api.call('POST', '/api/auth/login', { body: { email: REVIEWER_EMAIL, password: REVIEWER_PASSWORD } });
  assert.equal(r.status, 200);
  assert.ok(!r.json.mfaRequired, 'secondary reviewer account has no TOTP secret configured');
  return sessionCache.reviewer = { cookie: cookieOf(r), user: r.json.user };
}

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const pdfBytes = (n) => Buffer.concat([Buffer.from('%PDF-1.4\n' + n + '\n'), crypto.randomBytes(64)]);

/** stage all required documents (real bytes, magic-byte verified) on a draft */
async function stageRequiredDocs(draftId, token, role) {
  const types = role === 'vendor'
    ? ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof']
    : ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'bank_proof'];
  const docs = types.map(t => ({
    type: t, name: t + '.pdf', mime: 'application/pdf', dataB64: pdfBytes(t).toString('base64'),
  }));
  const r = await api.call('POST', '/api/public/drafts/' + draftId + '/documents', { body: { token, documents: docs } });
  assert.equal(r.status, 200, 'staging required docs');
  return r.json.staged;
}

function fullApplication(role = 'vendor', email = 'partner@example.com') {
  return {
    role,
    company: {
      legal_name_en: 'Integration Test Trading LLC', entity_type: 'LLC', country: 'AE',
      license_number: 'CN-IT-1', license_authority: 'DMCC',
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
    banking: { bank_name: 'Emirates NBD', iban: V.makeIBAN('026', String(crypto.randomBytes(4).readUInt32BE(0))), account_holder: 'Integration Test Trading LLC', currency: 'AED' },
    declarations: { accuracy: { checked: true, signed_name: 'Pat Ner' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    documents: (role === 'vendor'
      ? ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof']
      : ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'bank_proof']
    ).map(dt => ({ type: dt, name: dt + '.pdf', mime: 'application/pdf', dataB64: pdfBytes(dt).toString('base64') })),
  };
}

/* ================================================================== */
test('health + settings + security headers', async () => {
  const r = await api.call('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'ok');
  const raw = await api.call('GET', '/api/health', { raw: true });
  assert.match(raw.headers.get('x-content-type-options') || '', /nosniff/);
  assert.match(raw.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.ok(raw.headers.get('x-request-id'));
  const s = await api.call('GET', '/api/settings');
  assert.match(s.json.simalPeppol, /^0235:\d{15}$/);
});

test('404 for unknown API + unknown page', async () => {
  assert.equal((await api.call('GET', '/api/nope')).status, 404);
  const raw = await api.call('GET', '/definitely-not-a-page.html', { raw: true });
  assert.equal(raw.status, 404);
});

test('auth: wrong password 401; admin MFA flow; me; logout', async () => {
  const bad = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: crypto.randomBytes(12).toString('base64url') } });
  assert.equal(bad.status, 401);

  const admin = await loginAdmin({ fresh: true }); // fresh: this test destroys the session
  assert.equal(admin.user.role, 'super_admin');
  const me = await api.call('GET', '/api/auth/me', { cookie: admin.cookie });
  assert.equal(me.status, 200);
  assert.equal(me.json.user.email, ADMIN_EMAIL);

  const out = await api.call('POST', '/api/auth/logout', { cookie: admin.cookie });
  assert.equal(out.status, 200);
  const after = await api.call('GET', '/api/auth/me', { cookie: admin.cookie });
  assert.equal(after.status, 401, 'session destroyed after logout');
});

test('auth: bad MFA code rejected', async () => {
  const r1 = await api.call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const wrongCode = totpNow(ADMIN_TOTP) === '000000' ? '111111' : '000000';
  const r2 = await api.call('POST', '/api/auth/mfa', { body: { mfaChallengeId: r1.json.mfaChallengeId, code: wrongCode } });
  assert.equal(r2.status, 401);
});

test('admin endpoints require auth (401 without session)', async () => {
  for (const p of ['/api/admin/submissions', '/api/admin/analytics', '/api/admin/audit', '/api/admin/export.csv']) {
    assert.equal((await api.call('GET', p)).status, 401, p);
  }
});

test('rate limiter: 429 after repeated login failures', async () => {
  let got429 = false;
  for (let i = 0; i < 14; i++) {
    const r = await api.call('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: crypto.randomBytes(9).toString('base64url') } });
    if (r.status === 429) { got429 = true; break; }
    assert.equal(r.status, 401);
  }
  assert.ok(got429, 'login rate limiter eventually blocks');
});

test('full partner journey: draft → submit → status → query → respond → approve', async () => {
  const email = 'journey@example.com';
  const d1 = await api.call('POST', '/api/public/drafts', { body: { email, role: 'vendor' } });
  assert.equal(d1.status, 201);
  const { draftId, token: draftToken } = d1.json;
  const d2 = await api.call('PUT', '/api/public/drafts/' + draftId, { body: { token: draftToken, data: { company: { legal_name_en: 'Draft Co' } }, step: 3 } });
  assert.equal(d2.status, 200);
  const d3 = await api.call('GET', '/api/public/drafts/' + draftId + '?token=' + draftToken);
  assert.equal(d3.json.data.company.legal_name_en, 'Draft Co');
  assert.equal((await api.call('GET', '/api/public/drafts/' + draftId + '?token=bad')).status, 404);

  /* stage a real PNG document (magic-byte verified) + reject a fake one */
  const stage = await api.call('POST', '/api/public/drafts/' + draftId + '/documents', {
    body: { token: draftToken, documents: [{ type: 'trade_license', name: 'licence.png', mime: 'image/png', dataB64: pngBytes.toString('base64') }] },
  });
  assert.equal(stage.status, 200);
  assert.match(stage.json.staged[0].docId, /^doc_/);
  /* stage the remaining required documents with real bytes */
  await stageRequiredDocs(draftId, draftToken, 'vendor');
  const fake = await api.call('POST', '/api/public/drafts/' + draftId + '/documents', {
    body: { token: draftToken, documents: [{ type: 'trn_cert', name: 'fake.pdf', mime: 'application/pdf', dataB64: Buffer.from('plain text pretending').toString('base64') }] },
  });
  assert.equal(fake.status, 400);
  assert.match(fake.json.error, /content/);

  /* submit: valid app + staged doc carries over via draft */
  const appPayload = fullApplication('vendor', email);
  const sub = await api.call('POST', '/api/public/applications', { body: { draftId, draftToken, application: appPayload } });
  assert.equal(sub.status, 201);
  const ref = sub.json.reference;
  assert.match(ref, /SIM-KYC-\d{4}-\d{5}/);

  /* draft consumed after submit */
  assert.equal((await api.call('GET', '/api/public/drafts/' + draftId + '?token=' + draftToken)).status, 404);

  /* invalid submission rejected with 422 + field errors */
  const badApp = fullApplication('vendor', 'bad@example.com');
  badApp.tax.trn = '100472847700'; // 12 digits — format rejection (checksum no longer gates, OQ-9)
  const bad = await api.call('POST', '/api/public/applications', { body: { application: badApp } });
  assert.equal(bad.status, 422);
  assert.ok(bad.json.details.some(e => e.field === 'tax.trn'));

  /* status: wrong email 404 (rm(10.3-1 pen KYC-46): identical to an unknown
   * reference, so the endpoint is not a reference-existence oracle) */
  assert.equal((await api.call('GET', '/api/public/applications/' + ref + '?email=wrong@x.ae')).status, 404);
  const st = await api.call('GET', '/api/public/applications/' + ref + '?email=' + encodeURIComponent(email));
  assert.equal(st.status, 200);
  assert.equal(st.json.status, 'submitted');

  /* reviewer: start → query */
  const rev = await loginReviewer();
  assert.equal((await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'start' } })).status, 200);
  const q = await api.call('POST', '/api/admin/submissions/' + ref + '/query', {
    cookie: rev.cookie, body: { section: 'Tax & E-Invoicing', message: 'Please confirm the TRN exactly as issued.' },
  });
  assert.equal(q.status, 200);
  assert.equal(q.json.status, 'query_raised');

  /* partner responds */
  const resp = await api.call('POST', '/api/public/applications/' + ref + '/respond', {
    body: { email, message: 'TRN re-confirmed from our certificate.' },
  });
  assert.equal(resp.status, 200);
  assert.equal(resp.json.status, 'partner_updated');

  /* approve → outbox + audit */
  const approve = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'approve' } });
  assert.equal(approve.status, 200);
  assert.equal(approve.json.status, 'approved');

  const outbox = await api.call('GET', '/api/admin/outbox', { cookie: rev.cookie });
  assert.equal(outbox.status, 200);
  assert.ok(outbox.json.some(m => m.meta?.ref === ref && m.meta?.event === 'submission.approved'));

  const audit = await api.call('GET', '/api/admin/audit?q=' + encodeURIComponent(ref), { cookie: rev.cookie });
  assert.ok(audit.json.some(a => a.action === 'approve'));

  const st2 = await api.call('GET', '/api/public/applications/' + ref + '?email=' + encodeURIComponent(email));
  assert.equal(st2.json.status, 'approved');
});

test('draft resume: existing draft returned with data/documents/step', async () => {
  const email = 'resume@example.com';
  const d1 = await api.call('POST', '/api/public/drafts', { body: { email, role: 'vendor' } });
  assert.equal(d1.status, 201);
  await api.call('PUT', '/api/public/drafts/' + d1.json.draftId, {
    body: { token: d1.json.token, data: { company: { legal_name_en: 'Resume Co LLC' } }, step: 4 },
  });
  await api.call('POST', '/api/public/drafts/' + d1.json.draftId + '/documents', {
    body: { token: d1.json.token, documents: [{ type: 'trade_license', name: 'lic.png', mime: 'image/png', dataB64: pngBytes.toString('base64') }] },
  });
  /* rm(10.3-1): resume requires the draft token (or the kyc_draft cookie); an
   * email alone returns a NEW draft (pen KYC-02 — no cross-party takeover). */
  const d2 = await api.call('POST', '/api/public/drafts', { body: { email, role: 'vendor', token: d1.json.token } });
  assert.equal(d2.json.resumed, true);
  const stranger = await api.call('POST', '/api/public/drafts', { body: { email, role: 'vendor' } });
  assert.notEqual(stranger.json.draftId, d1.json.draftId, 'email alone must not return the existing draft');
  assert.ok(!JSON.stringify(stranger.json).includes('Resume Co LLC'), 'no data of the other party leaks');
  assert.equal((stranger.json.documents || []).length, 0, 'no documents of the other party leak');
  assert.equal(d2.status, 201);
  assert.equal(d2.json.draftId, d1.json.draftId, 'same draft returned');
  assert.equal(d2.json.token, d1.json.token, 'same token');
  assert.equal(d2.json.step, 4, 'step preserved');
  assert.equal(d2.json.data.company.legal_name_en, 'Resume Co LLC', 'data preserved');
  assert.ok(d2.json.documents.some(x => x.type === 'trade_license' && x.docId), 'staged doc preserved');
  const d3 = await api.call('POST', '/api/public/drafts', { body: { email, role: 'customer' } });
  assert.notEqual(d3.json.draftId, d1.json.draftId, 'different role = separate draft');
});

test('RBAC: reviewer cannot reopen; admin can', async () => {
  const email = 'rbac@example.com';
  const sub = await api.call('POST', '/api/public/applications', { body: { application: fullApplication('customer', email) } });
  const ref = sub.json.reference;
  const rev = await loginReviewer();
  await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'start' } });
  await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'approve' } });
  const reopen = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'reopen' } });
  assert.equal(reopen.status, 403, 'reviewer cannot reopen');
  const admin = await loginAdmin();
  const reopen2 = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: admin.cookie, body: { action: 'reopen' } });
  assert.equal(reopen2.status, 200);
});

test('review details mask PII; super admin can unmask', async () => {
  const email = 'pii@example.com';
  const appPayload = fullApplication('vendor', email);
  appPayload.signatories[0].id_number = 'P999999';
  const sub = await api.call('POST', '/api/public/applications', { body: { application: appPayload } });
  const ref = sub.json.reference;
  const rev = await loginReviewer();
  const r = await api.call('GET', '/api/admin/submissions/' + ref, { cookie: rev.cookie });
  assert.equal(r.status, 200);
  assert.match(r.json.signatories[0].id_number, /^•••••/);
  assert.ok(r.json.banking.iban_masked);
  const admin = await loginAdmin();
  const full = await api.call('GET', '/api/admin/submissions/' + ref + '?pii=full', { cookie: admin.cookie });
  assert.ok(full.json.signatories[0].id_number.indexOf('•') < 0, 'super admin sees full PII');
});

test('export.csv is PII-safe by default and full for super admin', async () => {
  const rev = await loginReviewer();
  const r = await api.call('GET', '/api/admin/export.csv', { cookie: rev.cookie, raw: true });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/csv/);
  assert.ok(r.text.indexOf('Reference') >= 0);
  assert.ok(r.text.indexOf('••••') >= 0, 'IBANs masked in default export');
  const admin = await loginAdmin();
  const f = await api.call('GET', '/api/admin/export.csv?pii=full', { cookie: admin.cookie, raw: true });
  assert.ok(f.text.indexOf('Signatory IDs') >= 0);
});

test('invite closed loop: bulk import → link redeem → submission converts', async () => {
  const rev = await loginReviewer();
  const imp = await api.call('POST', '/api/admin/invites/bulk', {
    cookie: rev.cookie,
    body: { csv: 'Invitee Company LLC,invitee@example.com,customer\nBad Row,bad-email,customer' },
  });
  assert.equal(imp.status, 200);
  assert.equal(imp.json.imported, 1);
  assert.equal(imp.json.rejected.length, 1);
  const link = imp.json.links[0];

  const look = await api.call('GET', '/api/public/invites/' + link.code);
  assert.equal(look.json.found, true);
  assert.equal(look.json.company, 'Invitee Company LLC');
  assert.equal((await api.call('GET', '/api/public/invites/INV-NOPE')).json.found, false);

  const appPayload = fullApplication('customer', 'invitee@example.com');
  appPayload.company.legal_name_en = 'Invitee Company LLC';
  const sub = await api.call('POST', '/api/public/applications', { body: { application: appPayload, inviteCode: link.code } });
  assert.equal(sub.status, 201);
  const inv = await api.call('GET', '/api/admin/invites', { cookie: rev.cookie });
  const mine = inv.json.find(i => i.code === link.code);
  assert.equal(mine.status, 'converted');
  assert.equal(mine.submissionId, sub.json.reference);
});

test('duplicate TRN detection surfaces on submission + live tin-check', async () => {
  const tin = V.makeTIN('100' + String(crypto.randomBytes(8).readBigUInt64BE(0)).replace(/\D/g, '').slice(0, 10).padEnd(10, '3'));
  const a = fullApplication('vendor', 'dup1@example.com');
  a.tax.trn = tin;
  const r1 = await api.call('POST', '/api/public/applications', { body: { application: a } });
  assert.equal(r1.status, 201);
  assert.equal(r1.json.duplicateTin, false);
  const b = fullApplication('vendor', 'dup2@example.com');
  b.tax.trn = tin;
  const r2 = await api.call('POST', '/api/public/applications', { body: { application: b } });
  assert.equal(r2.status, 201);
  assert.equal(r2.json.duplicateTin, true, 'second submission flagged as duplicate TRN');
  const probe = await api.call('GET', '/api/public/tin-check?trn=' + tin);
  assert.equal(probe.json.exists, true);
});

test('screening: suspicious name flagged, clean name clears', async () => {
  const sus = fullApplication('vendor', 'screen1@example.com');
  sus.company.legal_name_en = 'Shadow Future Trading FZE LLC';
  const r1 = await api.call('POST', '/api/public/applications', { body: { application: sus } });
  assert.equal(r1.status, 201);
  assert.equal(r1.json.screeningClear, false);
  const admin = await loginAdmin();
  const d1 = await api.call('GET', '/api/admin/submissions/' + r1.json.reference, { cookie: admin.cookie });
  assert.ok(d1.json.screening.hits.length >= 1);

  const clean = fullApplication('vendor', 'screen2@example.com');
  clean.company.legal_name_en = 'Sunrise Fresh Vegetables LLC';
  const r2 = await api.call('POST', '/api/public/applications', { body: { application: clean } });
  assert.equal(r2.json.screeningClear, true);
});

test('workflow guards: approve from submitted is 409; reject requires reason', async () => {
  const email = 'guards@example.com';
  const sub = await api.call('POST', '/api/public/applications', { body: { application: fullApplication('vendor', email) } });
  const ref = sub.json.reference;
  const rev = await loginReviewer();
  const ap = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'approve' } });
  assert.equal(ap.status, 409);
  const rj = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'reject' } });
  assert.equal(rj.status, 400);
  const rj2 = await api.call('POST', '/api/admin/submissions/' + ref + '/actions', { cookie: rev.cookie, body: { action: 'reject', reason: 'Licence unreadable.' } });
  assert.equal(rj2.status, 200);
});

test('analytics: stats reflect submissions; aging + expiries shaped', async () => {
  const rev = await loginReviewer();
  const r = await api.call('GET', '/api/admin/analytics', { cookie: rev.cookie });
  assert.equal(r.status, 200);
  assert.ok(r.json.stats.total >= 6);
  assert.ok(Array.isArray(r.json.aging));
  assert.ok(Array.isArray(r.json.expiries));
  assert.ok(r.json.stats.total >= r.json.stats.approved);
});

test('integration master endpoint: token-gated counterparty feed', async () => {
  assert.equal((await api.call('GET', '/api/integration/master')).status, 401);
  const r = await api.call('GET', '/api/integration/master', {
    headers: { 'x-api-token': process.env.MASTER_API_TOKEN },
  });
  assert.equal(r.status, 200);
  assert.ok(r.json.count >= 1);
  for (const c of r.json.counterparties) {
    assert.ok(c.role === 'vendor' || c.role === 'customer');
    assert.ok(c.tin);
  }
});

test('list endpoint: filters, pagination, search', async () => {
  const rev = await loginReviewer();
  const all = await api.call('GET', '/api/admin/submissions', { cookie: rev.cookie });
  assert.ok(all.json.total >= 6);
  const pending = await api.call('GET', '/api/admin/submissions?status=pending', { cookie: rev.cookie });
  for (const row of pending.json.rows) assert.ok(['submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold'].includes(row.status));
  const page = await api.call('GET', '/api/admin/submissions?per=3&page=2', { cookie: rev.cookie });
  assert.ok(page.json.rows.length <= 3);
  assert.ok(page.json.pages >= 2);
  const search = await api.call('GET', '/api/admin/submissions?q=Invitee', { cookie: rev.cookie });
  assert.ok(search.json.rows.some(r2 => r2.company.indexOf('Invitee') >= 0));
});

test('checklist + notes endpoints persist', async () => {
  const email = 'notes@example.com';
  const sub = await api.call('POST', '/api/public/applications', { body: { application: fullApplication('vendor', email) } });
  const ref = sub.json.reference;
  const rev = await loginReviewer();
  const c = await api.call('POST', '/api/admin/submissions/' + ref + '/checklist', { cookie: rev.cookie, body: { item: 'license', checked: true } });
  assert.equal(c.status, 200);
  assert.equal(c.json.license, true);
  const n = await api.call('POST', '/api/admin/submissions/' + ref + '/notes', { cookie: rev.cookie, body: { text: 'Verified licence against registry.' } });
  assert.equal(n.status, 200);
  assert.equal(n.json.length, 1);
});


/* ---- rm(2.1-2) / F-2026-N02: CSRF synchronizer token is VERIFIED, not just present ---- */
test('CSRF: bogus token cannot bypass cross-origin blocking (F-2026-N02)', async () => {
  const sess = await loginAdmin({ fresh: true });           // full login + MFA -> real session + csrfToken
  const r0 = await api.call('GET', '/api/auth/me', { cookie: sess.cookie, raw: false });
  const token = r0.json.csrfToken;                           // issued by the server for THIS session
  assert.ok(token, 'me() returns a csrfToken');
  const opts = (tok) => ({ cookie: sess.cookie, headers: { origin: 'https://evil.example', ...(tok ? { 'x-csrf-token': tok } : {}) } });
  const noTok = await api.call('POST', '/api/auth/logout', opts(null));
  assert.equal(noTok.status, 403, 'no token + evil origin must be blocked');
  const bogus = await api.call('POST', '/api/auth/logout', opts('totally-bogus-audit-probe'));
  assert.equal(bogus.status, 403, 'BOGUS token must NOT bypass (the F-2026-N02 bypass)');
  const sess2 = await loginAdmin({ fresh: true });          // token is single-session; get a fresh pair
  const rMe2 = await api.call('GET', '/api/auth/me', { cookie: cookieOf({ setCookie: '' }) || sess2.cookie });
  const valid = await api.call('POST', '/api/auth/logout',
    { cookie: sess2.cookie, headers: { origin: 'https://evil.example', 'x-csrf-token': rMe2.json.csrfToken } });
  assert.ok(valid.status < 400, 'VALID verified token must pass (' + valid.status + ')');
});


/* ---- rm(2.2-2) / F-2026-N04: report builder masks TRN/email/mobile/licence (SEC-6) ---- */
test('PII masking: reviewer sees masked TRN/email/mobile/licence; admin (view_pii) sees full', async () => {
  const FIELDS = ['id', 'tax.trn', 'contacts.primary.email', 'contacts.primary.mobile', 'company.license_number', 'banking.iban'];
  const rev = await loginReviewer();
  const rr = await api.call('POST', '/api/admin/reports/build', { cookie: rev.cookie, body: { fields: FIELDS, per: 3 } });
  assert.equal(rr.status, 200, 'reviewer can build reports (read_audit)');
  const rbody = JSON.stringify(rr.json);
  if (rr.json.rowCount > 0) assert.ok(rbody.includes('•'), 'masking applied on non-empty values');
  assert.ok(!/"tax.trn":"d{15}"/.test(rbody), 'no raw 15-digit TRN');
  assert.ok(!/"contacts.primary.email":"[^"•]{4,}@/.test(rbody), 'no raw contact email');
  assert.ok(!/"contacts.primary.mobile":"+d{9,}"/.test(rbody), 'no raw mobile');
  assert.ok(!/AEd{21}/.test(rbody), 'no raw IBAN');
  assert.ok(!/"company.license_number":"[A-Z]{2}-[A-Z]{2}-d+"/.test(rbody), 'licence number masked');
  const adm = await loginAdmin();
  const ar = await api.call('POST', '/api/admin/reports/build', { cookie: adm.cookie, body: { fields: FIELDS, per: 2 } });
  assert.equal(ar.status, 200);
  const abody = JSON.stringify(ar.json);
  assert.ok(ar.json.rowCount === 0 || !/"tax.trn":"[^"]*•/.test(abody),
    'view_pii role sees UNMASKED values (no bullets in tax.trn)');
  const csv = await api.call('GET', '/api/admin/export.csv', { cookie: rev.cookie, raw: true });
  assert.equal(csv.status, 200);
  assert.ok(!/,d{15},/.test(csv.text), 'master CSV: no raw TRN for reviewer');
  const anon = await fetch(BASE + '/api/admin/reports/build', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: ['id'] }) });
  assert.equal(anon.status, 401, 'non-staff denied');
});


/* ---- rm(2.3-1) / F-2026-N08: bounce webhook requires a VALID HMAC signature ---- */
test('bounce webhook: unsigned/invalid signatures rejected; valid signature processed (F-2026-N08)', async () => {
  const body = JSON.stringify({ email: 'bounce-test@example.invalid', reason: 'unit probe', type: 'soft' });
  /* rm(10.3-1): the contract is HMAC(secret, ts + '.' + RAW body) with a 5-minute
   * window (replay protection). A body-only signature is no longer accepted. */
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(ts + '.' + body).digest('hex');
  const post = (hdr) => fetch(BASE + '/api/integrations/email/bounce', { method: 'POST', headers: { 'content-type': 'application/json', ...hdr }, body });
  const unsigned = await post({});
  assert.equal(unsigned.status, 403, 'unsigned bounce rejected');
  const invalid = await post({ 'x-webhook-signature': 'deadbeef'.repeat(8), 'x-webhook-timestamp': ts });
  assert.equal(invalid.status, 403, 'wrong signature rejected');
  const bodyOnly = await post({ 'x-webhook-signature': crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(body).digest('hex'), 'x-webhook-timestamp': ts });
  assert.equal(bodyOnly.status, 403, 'body-only signature (no timestamp binding) rejected');
  const stale = await post({ 'x-webhook-signature': sig, 'x-webhook-timestamp': String(Date.now() - 600000) });
  assert.equal(stale.status, 403, 'stale timestamp rejected (replay window)');
  const valid = await post({ 'x-webhook-signature': sig, 'x-webhook-timestamp': ts });
  assert.equal(valid.status, 200, 'valid fresh signature processed');
  assert.equal((await valid.json()).processed, true);
});


/* ---- rm(2.3-2) / F-2026-N09: observability + webhook-sign endpoints permission-gated ---- */
test('observability + test-sign gated: reviewer 403; super_admin only (F-2026-N09)', async () => {
  const rev = await loginReviewer();
  const adm = await loginAdmin();
  const hit = async (sess) => {
    const e = await api.call('GET', '/api/admin/observability/errors', { cookie: sess.cookie });
    const s = await api.call('POST', '/api/integrations/webhook/test-sign', { cookie: sess.cookie, body: { payload: { t: 1 } } });
    return { errors: e.status, sign: s.status };
  };
  const r1 = await hit(rev);
  assert.equal(r1.errors, 403, 'reviewer denied on observability errors');
  assert.equal(r1.sign, 403, 'reviewer denied on webhook test-sign');
  const a = await hit(adm);
  assert.equal(a.errors, 200, 'super_admin reads observability errors');
  assert.equal(a.sign, 200, 'super_admin can test-sign');
});

/* teardown: close server so the test process can exit */
test('document upload cap: a 9 MB scan stages, a 10.2 MB one gets the 10 MB message (deploy-audit B3)', async () => {
  const d = await api.call('POST', '/api/public/drafts', { body: { email: 'bigscan@example.com', role: 'vendor' } });
  assert.equal(d.status, 201);
  const pdf = (mb) => Buffer.concat([Buffer.from('%PDF-1.7 '), crypto.randomBytes(Math.round(mb * 1024 * 1024))]);
  /* before the fix this route read the 2 MB default body: anything over ~1.5 MB was a 413 */
  const big = await api.call('POST', '/api/public/drafts/' + d.json.draftId + '/documents', {
    body: { token: d.json.token, documents: [{ type: 'trade_license', name: 'licence-scan.pdf', mime: 'application/pdf', dataB64: pdf(9).toString('base64') }] },
  });
  assert.equal(big.status, 200, JSON.stringify(big.json));
  assert.ok(big.json.staged[0].size > 9 * 1024 * 1024);
  const tooBig = await api.call('POST', '/api/public/drafts/' + d.json.draftId + '/documents', {
    body: { token: d.json.token, documents: [{ type: 'trade_license', name: 'licence-scan.pdf', mime: 'application/pdf', dataB64: pdf(10.2).toString('base64') }] },
  });
  assert.equal(tooBig.status, 400);
  assert.match(tooBig.json.error, /exceeds 10 MB/);
});

test('CSP report sink accepts the browser media types (deploy-audit M11)', async () => {
  const report = { 'csp-report': { 'document-uri': BASE + '/admin.html', 'violated-directive': 'script-src', 'blocked-uri': 'inline' } };
  for (const type of ['application/csp-report', 'application/json']) {
    const r = await fetch(BASE + '/api/csp-report', { method: 'POST', headers: { 'Content-Type': type }, body: JSON.stringify(report) });
    assert.equal(r.status, 204, type);
  }
  const r2 = await fetch(BASE + '/api/csp-report', { method: 'POST', headers: { 'Content-Type': 'application/reports+json' },
    body: JSON.stringify([{ type: 'csp-violation', body: { documentURL: BASE + '/', effectiveDirective: 'img-src', blockedURL: 'https://x.test/a.png' } }]) });
  assert.equal(r2.status, 204, 'Reporting API shape');
  const plain = await fetch(BASE + '/api/csp-report', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
  assert.equal(plain.status, 415, 'other types still refused');
});

after(async () => {
  await new Promise(r => server.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}, { timeout: 10000 });
