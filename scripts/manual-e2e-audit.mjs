// scripts/manual-e2e-audit.mjs — Comprehensive Manual & E2E Verification Suite for Phase 1
import http from 'node:http';
/* rm(9.1-3)/F-2026-N14: staff credentials come from the environment or the git-ignored
 * apps/portal/.env — never from literals in tracked files (gitleaks secrets-scan). */
import fs from 'node:fs';
let envTxt = ''; try { envTxt = fs.readFileSync(new URL('../apps/portal/.env', import.meta.url), 'utf8'); } catch { /* env only */ }
const pick = (k) => process.env[k] || (envTxt.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();

const BASE = 'http://127.0.0.1:8090';

console.log('================================================================');
console.log('       LIVE MANUAL & E2E PROBING SUITE (PORT 8090 / 8100)       ');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(name, pass, detail = '') {
  totalChecks++;
  if (pass) {
    passedChecks++;
    console.log(`  [PASS] ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function request(method, path, body = null, headers = {}) {
  const url = BASE + path;
  const opts = {
    method,
    headers: { ...headers }
  };
  if (body) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, headers: r.headers, text, json };
}

// -----------------------------------------------------------------------------
// SECTION 1: Static File Server & Dotfile Traversal
// -----------------------------------------------------------------------------
console.log('>>> [SECTION 1] Probing static file server for dotfiles & path traversal...');
const r1 = await request('GET', '/.env');
check('Blocked /.env request', r1.status === 404, `Status ${r1.status}`);

const r2 = await request('GET', '/.git/config');
check('Blocked /.git/config request', r2.status === 404, `Status ${r2.status}`);

const r3 = await request('GET', '/..%2fpackage.json');
check('Blocked path traversal /..%2fpackage.json', r3.status === 404, `Status ${r3.status}`);

// -----------------------------------------------------------------------------
// SECTION 2: Shipped Dev Credentials & MFA Universal Bypass
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 2] Probing shipped dev credentials & MFA universal bypass...');
const devAdmin = await request('POST', '/api/auth/login', { email: 'admin@simalme.com', password: 'admin123' });
check('admin@simalme.com/admin123 rejected', devAdmin.status === 401, `Status ${devAdmin.status}`);

const devReviewer = await request('POST', '/api/auth/login', { email: 'reviewer@simalme.com', password: 'reviewer123' });
check('reviewer@simalme.com/reviewer123 rejected', devReviewer.status === 401, `Status ${devReviewer.status}`);

const devDemo = await request('POST', '/api/auth/login', { email: 'mfa.demo@simalme.com', password: 'demo123' });
check('mfa.demo@simalme.com/demo123 rejected', devDemo.status === 401, `Status ${devDemo.status}`);

const fakeMfa = await request('POST', '/api/auth/mfa', { mfaChallengeId: 'challenge-nonexistent', code: '123456' });
check('MFA code 123456 without valid challenge rejected', fakeMfa.status === 401, `Status ${fakeMfa.status}`);

// -----------------------------------------------------------------------------
// SECTION 3: Anonymous RBAC Deny-by-Default
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 3] Probing anonymous access to all privileged routes...');
const anonRoutes = [
  ['GET', '/api/admin/submissions'],
  ['GET', '/api/admin/analytics'],
  ['GET', '/api/admin/audit'],
  ['GET', '/api/admin/outbox'],
  ['GET', '/api/admin/users'],
  ['GET', '/api/admin/sessions'],
  ['GET', '/api/admin/settings'],
  ['GET', '/api/admin/documents/doc_test123'],
  ['GET', '/api/einvoice/admin/queue'],
  ['GET', '/api/integrations/health'],
  ['GET', '/api/cms/outbox'],
];

for (const [m, p] of anonRoutes) {
  const res = await request(m, p);
  check(`Anonymous denied ${m} ${p}`, res.status === 401 || res.status === 403, `Status ${res.status}`);
}

// -----------------------------------------------------------------------------
// SECTION 4: Live Staff & Partner RBAC Probing
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 4] Probing authenticated Staff & Partner RBAC boundaries...');

// Login with actual environment configured staff credentials
// From portal/.env: ADMIN_EMAIL, ADMIN_PASSWORD
const staffAdminLogin = await request('POST', '/api/auth/login', {
  email: pick('ADMIN_EMAIL'),
  password: pick('ADMIN_PASSWORD')
});

const adminCookie = staffAdminLogin.headers.get('set-cookie')?.split(';')[0];
check('Super Admin login successful', staffAdminLogin.status === 200 && !!adminCookie, `Status ${staffAdminLogin.status}`);

if (adminCookie) {
  // Super admin can access admin endpoints
  const subRes = await request('GET', '/api/admin/submissions', null, { cookie: adminCookie });
  check('Super Admin can access /api/admin/submissions', subRes.status === 200, `Status ${subRes.status}`);

  const userRes = await request('GET', '/api/admin/users', null, { cookie: adminCookie });
  check('Super Admin can access /api/admin/users (has view_pii)', userRes.status === 200, `Status ${userRes.status}`);

  const settRes = await request('GET', '/api/admin/settings', null, { cookie: adminCookie });
  check('Super Admin can access /api/admin/settings (has view_pii)', settRes.status === 200, `Status ${settRes.status}`);
}

// Login with Reviewer credentials
// From portal/.env: REVIEWER_EMAIL, REVIEWER_PASSWORD
const reviewerLogin = await request('POST', '/api/auth/login', {
  email: pick('REVIEWER_EMAIL'),
  password: pick('REVIEWER_PASSWORD')
});
const reviewerCookie = reviewerLogin.headers.get('set-cookie')?.split(';')[0];
check('Reviewer login successful', reviewerLogin.status === 200 && !!reviewerCookie, `Status ${reviewerLogin.status}`);

if (reviewerCookie) {
  // Reviewer CAN access submissions (has decide perm)
  const revSub = await request('GET', '/api/admin/submissions', null, { cookie: reviewerCookie });
  check('Reviewer CAN access /api/admin/submissions', revSub.status === 200, `Status ${revSub.status}`);

  // Reviewer CANNOT access users, sessions, settings, or raw documents (lacks view_pii)
  const revUsers = await request('GET', '/api/admin/users', null, { cookie: reviewerCookie });
  check('Reviewer DENIED /api/admin/users (lacks view_pii)', revUsers.status === 403, `Status ${revUsers.status}`);

  const revSessions = await request('GET', '/api/admin/sessions', null, { cookie: reviewerCookie });
  check('Reviewer DENIED /api/admin/sessions (lacks view_pii)', revSessions.status === 403, `Status ${revSessions.status}`);

  const revSettings = await request('GET', '/api/admin/settings', null, { cookie: reviewerCookie });
  check('Reviewer DENIED /api/admin/settings (lacks view_pii)', revSettings.status === 403, `Status ${revSettings.status}`);

  const revDoc = await request('GET', '/api/admin/documents/doc_raw123', null, { cookie: reviewerCookie });
  check('Reviewer DENIED raw KYC download /api/admin/documents/:id (lacks view_pii)', revDoc.status === 403, `Status ${revDoc.status}`);
}

// -----------------------------------------------------------------------------
// SECTION 5: Password Reset Token Exposure & Outbox Redaction
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 5] Probing password reset outbox token exposure (F-12)...');
const resetReq = await request('POST', '/api/auth/password-reset/request', { email: 'admin@smartme.com' });
check('Password reset request constant response', resetReq.status === 200);

if (reviewerCookie) {
  const cmsOutbox = await request('GET', '/api/cms/outbox', null, { cookie: reviewerCookie });
  const cmsHasToken = (cmsOutbox.json?.outbox || []).some(o => /reset=[a-zA-Z0-9_-]{16,}/.test(o.body || ''));
  check('Reviewer cannot read reset token via /api/cms/outbox', !cmsHasToken, 'No raw tokens in body');

  const adminOutbox = await request('GET', '/api/admin/outbox', null, { cookie: reviewerCookie });
  const adminHasToken = (adminOutbox.json || []).some(o => /reset=[a-zA-Z0-9_-]{16,}/.test(o.text || ''));
  const adminMasked = (adminOutbox.json || []).every(o => o.text === '[REDACTED]');
  check('Reviewer receives only [REDACTED] text from /api/admin/outbox', adminMasked && !adminHasToken, 'Text is [REDACTED]');
}

// -----------------------------------------------------------------------------
// SECTION 6: PII Masking in Dynamic Report Builder
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 6] Probing IBAN masking in dynamic report builder (SEC-6)...');
if (reviewerCookie) {
  const reportRes = await request('POST', '/api/admin/reports/build', { fields: ['id', 'banking.iban'] }, { cookie: reviewerCookie });
  check('Reviewer can build report', reportRes.status === 200, `Status ${reportRes.status}`);
  const rows = reportRes.json?.rows || [];
  const unmaskedIban = rows.some(r => /AE\d{21}/.test(r['banking.iban'] || ''));
  check('Report builder rows do NOT contain raw unmasked IBANs for reviewer', !unmaskedIban, `Checked ${rows.length} rows`);
}

// -----------------------------------------------------------------------------
// SECTION 7: Analytics CSV Export & Audit Report Date Safety
// -----------------------------------------------------------------------------
console.log('\n>>> [SECTION 7] Probing Analytics CSV export & Audit report date formatting...');
if (reviewerCookie) {
  const csvRes = await request('GET', '/api/admin/export.csv', null, { cookie: reviewerCookie });
  check('Reviewer can export CSV without 500 error', csvRes.status === 200, `Status ${csvRes.status}`);
  const hasRawIban = /AE\d{21}/.test(csvRes.text);
  check('Reviewer CSV export masks banking IBAN', !hasRawIban, 'IBAN masked in CSV');
}
if (adminCookie) {
  const auditReportRes = await request('POST', '/api/admin/reports/build', { reportId: 'user-activity' }, { cookie: adminCookie });
  check('Super Admin can build user-activity audit report without 500', auditReportRes.status === 200, `Status ${auditReportRes.status}`);
}


console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('>>> ALL LIVE MANUAL & E2E PROBES PASSED CLEANLY (100% ACCURACY) <<<\n');
  process.exit(0);
}
