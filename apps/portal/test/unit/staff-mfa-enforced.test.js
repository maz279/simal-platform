// deploy-audit: in production every staff request needs an account with TOTP enrolled — the
// boot check alone left accounts created, promoted or with MFA disabled after boot password-only.
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
const { requireStaff, staffMfaEnforced } = await import('../../src/services/auth.service.js');

const reqAs = (role, hasTotp) => ({ session: { role, user: { role, hasTotp } } });
const run = (req) => { let passed = false; requireStaff()(req, {}, () => { passed = true; }); return passed; };

test('production: staff without TOTP are refused on staff routes', () => {
  delete process.env.STAFF_MFA_ENFORCED;
  assert.equal(staffMfaEnforced(), true);
  for (const role of ['super_admin', 'reviewer', 'viewer']) {
    assert.throws(() => run(reqAs(role, false)), (e) => e.status === 403 && /two-factor/i.test(e.message), role);
    assert.equal(run(reqAs(role, true)), true, role + ' with TOTP passes');
  }
});

test('partners never reach staff routes, with or without TOTP', () => {
  assert.throws(() => run(reqAs('partner', true)), (e) => e.status === 403 && /Staff access required/.test(e.message));
});

test('STAFF_MFA_ENFORCED=false is the deliberate opt-out (same switch as the boot check)', () => {
  process.env.STAFF_MFA_ENFORCED = 'false';
  try {
    assert.equal(staffMfaEnforced(), false);
    assert.equal(run(reqAs('reviewer', false)), true);
  } finally { delete process.env.STAFF_MFA_ENFORCED; }
});
