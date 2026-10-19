/* Unit tests: security (scrypt, TOTP, rate limiter, sniffing) + rules (RBAC, workflow) + store */
import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, verifyTotp, totpNow, rateLimiter, sniffContentType, timingSafeEqual, base32Decode } from '../../src/lib/security.js';
import { canApplyAction, can, ACTIONS, TRANSITIONS, PARTNER_EDITABLE } from '../../src/domain/rules.js';
import { createStore } from '../../src/store/db.js';
import { createRepos } from '../../src/store/repos.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/* ---------- password ---------- */
test('scrypt hash verifies round-trip', () => {
  const h = hashPassword('correct horse battery staple');
  assert.ok(h.startsWith('scrypt$'));
  assert.ok(verifyPassword('correct horse battery staple', h));
  assert.ok(!verifyPassword('wrong', h));
});

/* ---------- TOTP ---------- */
const SECRET = base32Decode('JBSWY3DPEHPK3PXP').length === 10 ? 'JBSWY3DPEHPK3PXP' : 'JBSWY3DPEHPK3PXP';
test('TOTP verify accepts current code, rejects others', () => {
  const code = totpNow(SECRET);
  assert.match(code, /^\d{6}$/);
  assert.ok(verifyTotp(SECRET, code));
  const bad = code === '000000' ? '111111' : '000000';
  assert.ok(!verifyTotp(SECRET, bad));
});
test('TOTP accepts previous step (drift ±1), rejects far codes', () => {
  const t = Date.now();
  const prev = totpNow(SECRET, -1, t);
  assert.ok(verifyTotp(SECRET, prev, { t }));
  const far = totpNow(SECRET, -5, t);
  assert.ok(!verifyTotp(SECRET, far, { t }));
});
test('timingSafeEqual basics', () => {
  assert.ok(timingSafeEqual('abc', 'abc'));
  assert.ok(!timingSafeEqual('abc', 'abd'));
  assert.ok(!timingSafeEqual('abc', 'abcd'));
});

/* ---------- rate limiter ---------- */
test('rate limiter blocks after max within window', () => {
  const hit = rateLimiter({ windowMs: 60000, max: 3, blockMs: 30000 });
  assert.ok(hit('ip1').ok);
  assert.ok(hit('ip1').ok);
  assert.ok(hit('ip1').ok);
  const blocked = hit('ip1');
  assert.ok(!blocked.ok);
  assert.ok(blocked.retryAfterMs > 0);
  assert.ok(hit('ip2').ok, 'other keys unaffected');
});

/* ---------- magic-byte sniffing ---------- */
test('content sniffing detects real types and rejects garbage', () => {
  assert.equal(sniffContentType(Buffer.from('%PDF-1.7xxxx')), 'application/pdf');
  assert.equal(sniffContentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d])), 'image/png');
  assert.equal(sniffContentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(sniffContentType(Buffer.from([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70])), 'image/heic');
  assert.equal(sniffContentType(Buffer.from('plain text file')), null);
  assert.equal(sniffContentType(null), null);
});

/* ---------- RBAC matrix ---------- */
test('RBAC: viewer read/export only; reviewer decides; super_admin reopens', () => {
  const viewer = { role: 'viewer' }, reviewer = { role: 'reviewer' }, admin = { role: 'super_admin' };
  assert.ok(can(viewer, 'read') && can(viewer, 'export'));
  assert.ok(!can(viewer, 'decide') && !can(viewer, 'view_pii'));
  assert.ok(can(reviewer, 'decide') && can(reviewer, 'query') && !can(reviewer, 'reopen'));
  assert.ok(can(admin, 'reopen') && can(admin, 'view_pii'));
  assert.ok(!can(null, 'read'));
});

/* ---------- workflow transitions ---------- */
test('workflow: full happy path transitions allowed', () => {
  const s = { status: 'submitted' };
  assert.ok(canApplyAction(s, 'start', { role: 'reviewer' }).ok);
  s.status = 'under_review';
  assert.ok(canApplyAction(s, 'approve', { role: 'reviewer' }).ok);
  s.status = 'approved';
  assert.ok(canApplyAction(s, 'reopen', { role: 'super_admin' }).ok);
  assert.ok(!canApplyAction(s, 'reopen', { role: 'reviewer' }).ok, 'reviewer cannot reopen');
});
test('workflow: approve blocked from submitted; reject requires reason', () => {
  const s = { status: 'submitted' };
  assert.ok(!canApplyAction(s, 'approve', { role: 'reviewer' }).ok);
  const r = canApplyAction(s, 'reject', { role: 'reviewer' });
  assert.ok(r.ok && r.rule.requiresReason);
});
test('workflow: rejected is terminal (reapply = new submission)', () => {
  assert.deepEqual(TRANSITIONS.rejected, []);
  assert.ok(!canApplyAction({ status: 'rejected' }, 'approve', { role: 'super_admin' }).ok);
});
test('partner-editable states exclude review states', () => {
  assert.ok(PARTNER_EDITABLE.includes('query_raised'));
  assert.ok(!PARTNER_EDITABLE.includes('under_review'));
});

/* ---------- store: atomicity, migration, repos ---------- */
test('store: persists and reloads; versioned migration adds missing collections', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kyc-test-'));
  const store = createStore(dir);
  store.data.settings.simalTin = '100X';
  await store.syncPersist();
  // simulate v1 (no invites/outbox/screening)
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'db.json'), 'utf8'));
  delete raw.invites; delete raw.outbox; delete raw.screening; raw.version = 1;
  fs.writeFileSync(path.join(dir, 'db.json'), JSON.stringify(raw));
  const store2 = createStore(dir);
  assert.ok(Array.isArray(store2.data.invites));
  assert.ok(Array.isArray(store2.data.outbox));
  assert.ok(Array.isArray(store2.data.invoices));      // v3: e-invoicing collection
  assert.equal(typeof store2.data.nextInvSeq, 'number');
  assert.equal(store2.data.version, 3);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('repos: users, drafts, submissions, invites lifecycle', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kyc-repo-'));
  const repos = createRepos(createStore(dir));
  const u = repos.users.create({ email: 'T@Example.com', name: 'T', role: 'reviewer', passwordHash: 'x', totpSecret: null });
  assert.equal(repos.users.findByEmail('t@example.com').id, u.id);

  const d = repos.drafts.create('P@Example.com', 'vendor');
  assert.ok(repos.drafts.find(d.id, d.token));
  repos.drafts.save(d, { step: 3 });
  assert.equal(repos.drafts.find(d.id, d.token).step, 3);
  assert.ok(!repos.drafts.find(d.id, 'wrong-token'));

  const sub = { id: 'SIM-KYC-2026-00001', status: 'submitted', company: { legal_name_en: 'X' }, tax: { trn: '100123456789123' }, contacts: { primary: { email: 'p@example.com' } }, submittedAt: Date.now(), history: [] };
  repos.submissions.add(sub);
  assert.equal(repos.submissions.duplicateTin('100123456789123').id, sub.id);
  assert.equal(repos.submissions.duplicateTin('100123456789123', sub.id), null); // excluded
  assert.equal(repos.submissions.findByEmail('P@example.com').length, 1);

  const inv = { code: 'INV-A', company: 'Co', email: 'a@b.ae', role: 'vendor' };
  repos.invites.add([inv]);
  assert.equal(repos.invites.find('INV-A').company, 'Co');
  fs.rmSync(dir, { recursive: true, force: true });
});
