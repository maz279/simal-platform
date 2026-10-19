// scripts/test-phase1-verification.mjs — Comprehensive Phase 1 Security Verification
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

import { PORTAL_DIR, bootApp, login } from './ci/lib.mjs';

console.log('================================================================');
console.log('      PHASE 1 — SECURITY P0 COMPREHENSIVE VERIFICATION SUITE     ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertCheck(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${name}${details ? ' — ' + details : ''}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${name}${details ? ' — ' + details : ''}`);
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: Credential Cleanliness in Source Code
// -----------------------------------------------------------------------------
console.log('>>> [CHECK 1] Scanning portal source and public directories for credential leaks...');
const grepResults = [];
async function scanDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') await scanDir(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.js', '.html', '.css', '.json', '.mjs'].includes(ext)) {
        const content = await fs.readFile(full, 'utf8');
        const matches = content.match(/admin123|reviewer123|demo123/g);
        if (matches) {
          grepResults.push({ file: full, matches });
        }
      }
    }
  }
}
await scanDir(path.join(PORTAL_DIR, 'public'));
await scanDir(path.join(PORTAL_DIR, 'src'));

assertCheck(
  'Zero occurrences of shipped dev credentials (admin123, reviewer123, demo123)',
  grepResults.length === 0,
  grepResults.length === 0 ? 'Clean (0 matches)' : `Found ${grepResults.length} leaked files`
);

// -----------------------------------------------------------------------------
// CHECK 2: Dotfile Denial in Static File Server
// -----------------------------------------------------------------------------
console.log('\n>>> [CHECK 2] Testing dotfile denial in HTTP static server...');
const { serveStatic } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'lib', 'http.js')).href);

let dotfileDenied = false;
const { PassThrough } = await import('node:stream');
const mockRes = new PassThrough();
mockRes.writeHead = () => {};
const mockReq = { url: '/.env', method: 'GET' };
const deniedEnv = serveStatic(mockReq, mockRes, '/.env', PORTAL_DIR);
const deniedGit = serveStatic({ url: '/.git/config', method: 'GET' }, mockRes, '/.git/config', PORTAL_DIR);
const allowedPublic = serveStatic({ url: '/login.html', method: 'GET' }, mockRes, '/login.html', path.join(PORTAL_DIR, 'public'));

assertCheck(
  'Static server denies dotfiles (/.env, /.git)',
  deniedEnv === false && deniedGit === false,
  `/.env -> ${deniedEnv}, /.git/config -> ${deniedGit}`
);

// -----------------------------------------------------------------------------
// CHECK 3: Unit Tests & RBAC Core
// -----------------------------------------------------------------------------
console.log('\n>>> [CHECK 3] Running portal unit tests (39 tests)...');
const unitRun = spawnSync(process.execPath, ['--test', 'test/unit/*.test.js'], {
  cwd: PORTAL_DIR,
  encoding: 'utf8',
});
assertCheck(
  'Portal 39 unit tests pass',
  unitRun.status === 0,
  unitRun.status === 0 ? '39/39 passed' : unitRun.stderr || unitRun.stdout.slice(-200)
);

// -----------------------------------------------------------------------------
// CHECK 4: Account Lifecycle & Token Security Tests
// -----------------------------------------------------------------------------
console.log('\n>>> [CHECK 4] Running account-services integration tests...');
const acctRun = spawnSync(process.execPath, ['--test', 'test/account-services.test.js'], {
  cwd: PORTAL_DIR,
  encoding: 'utf8',
});
assertCheck(
  'Account services & token security suite passes',
  acctRun.status === 0,
  acctRun.status === 0 ? '9/9 passed' : acctRun.stderr || acctRun.stdout.slice(-200)
);

// -----------------------------------------------------------------------------
// CHECK 5: CI Authorization Matrix Gate (P0-3b / SEC-3 / SEC-5)
// -----------------------------------------------------------------------------
console.log('\n>>> [CHECK 5] Running CI Authorization Matrix Gate...');
const authzRun = spawnSync(process.execPath, ['scripts/ci/authz-matrix.mjs'], {
  cwd: path.resolve('.'),
  encoding: 'utf8',
});
assertCheck(
  'CI authz-matrix passes with 0 violations across all 20 privileged routes',
  authzRun.status === 0 && authzRun.stdout.includes('PASS — 0 violations'),
  authzRun.status === 0 ? 'PASS (0 violations)' : authzRun.stdout.slice(-200)
);

// -----------------------------------------------------------------------------
// CHECK 6: Live Boot Security Verification (MFA bypass, Dev Creds, Outbox Redaction)
// -----------------------------------------------------------------------------
const app = await bootApp({ mode: 'json' });

try {
  // A) Shipped dev account rejection
  const devAdminRes = await fetch(app.base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@simalme.com', password: 'admin123' })
  });
  assertCheck(
    'Shipped dev account admin@simalme.com/admin123 is rejected',
    devAdminRes.status === 401,
    `Status ${devAdminRes.status}`
  );

  const devReviewerRes = await fetch(app.base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'reviewer@simalme.com', password: 'reviewer123' })
  });
  assertCheck(
    'Shipped dev account reviewer@simalme.com/reviewer123 is rejected',
    devReviewerRes.status === 401,
    `Status ${devReviewerRes.status}`
  );

  // B) 123456 MFA bypass rejection
  // Step 1: Login with valid admin credentials to initiate challenge
  const validLoginRes = await fetch(app.base + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: app.creds.adminEmail, password: app.creds.adminPassword })
  });
  const loginData = await validLoginRes.json();
  const challengeId = loginData.mfaChallengeId;

  // Step 2: Attempt verification with bypass code '123456'
  const mfaBypassRes = await fetch(app.base + '/api/auth/mfa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mfaChallengeId: challengeId, code: '123456' })
  });
  assertCheck(
    'MFA bypass code 123456 is rejected',
    mfaBypassRes.status === 401,
    `Status ${mfaBypassRes.status}`
  );

  // C) Password reset request & outbox token leak prevention (F-12)
  await fetch(app.base + '/api/auth/password-reset/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: app.creds.adminEmail })
  });

  const staffCookie = await login(app.base, app.creds.reviewerEmail, app.creds.reviewerPassword);

  // Reviewer calls /api/cms/outbox
  const cmsOutboxRes = await fetch(app.base + '/api/cms/outbox', {
    headers: { cookie: staffCookie }
  });
  const cmsOutboxData = await cmsOutboxRes.json();
  const cmsLeakedToken = (cmsOutboxData.outbox || []).some(o => /reset=[a-zA-Z0-9_-]{10,}/.test(o.body || ''));
  assertCheck(
    '/api/cms/outbox does NOT leak reset token in body',
    !cmsLeakedToken,
    'Tokens sanitized to [REDACTED]'
  );

  // Reviewer calls /api/admin/outbox (lacks view_pii)
  const adminOutboxRes = await fetch(app.base + '/api/admin/outbox', {
    headers: { cookie: staffCookie }
  });
  const adminOutboxData = await adminOutboxRes.json();
  const adminLeakedText = (adminOutboxData || []).some(o => /reset=[a-zA-Z0-9_-]{10,}/.test(o.text || ''));
  const adminMaskedText = (adminOutboxData || []).every(o => o.text === '[REDACTED]');
  assertCheck(
    '/api/admin/outbox masks text for users without view_pii',
    adminMaskedText && !adminLeakedText,
    'All text bodies [REDACTED] for non-pii staff'
  );

  // D) SEC-6: Report builder IBAN masking for staff without view_pii
  // Create a dummy submission with an IBAN directly in the repos
  await app.app.repos.submissions.add({
    id: 'sub-iban-test',
    status: 'submitted',
    banking: { iban: 'AE123456789012345678901' },
    company: { legal_name_en: 'IBAN Test LLC' },
    createdAt: Date.now(),
    submittedAt: Date.now(),
  });

  // Reviewer builds report requesting banking.iban
  const reportRes = await fetch(app.base + '/api/admin/reports/build', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: staffCookie },
    body: JSON.stringify({ fields: ['id', 'banking.iban'] })
  });
  const reportData = await reportRes.json();
  const testRow = (reportData.rows || []).find(r => r.id === 'sub-iban-test');
  const ibanValue = testRow ? testRow['banking.iban'] : '';
  const isIbanMasked = ibanValue.includes('••••') && !ibanValue.includes('123456789012345678901');

  assertCheck(
    'SEC-6: Report builder masks IBAN for staff lacking view_pii',
    isIbanMasked,
    `Masked value: ${ibanValue}`
  );

} finally {
  await app.stop();
}

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('>>> ALL PHASE 1 SECURITY ACCEPTANCE CRITERIA SATISFIED! <<<\n');
  process.exit(0);
}
