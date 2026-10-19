// deploy-audit H4: a production boot refuses placeholders and missing production services
// instead of discovering them at the first upload, mail or publish.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/* every key the check reads is pinned (an empty string also stops a developer .env leaking in) */
const GOOD = {
  NODE_ENV: 'production',
  CSRF_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_SECRET: '',
  DOC_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  MASTER_API_TOKEN: crypto.randomBytes(32).toString('hex'),
  SMTP_HOST: 'smtp.example.net',
  NOTIFY_EMAIL_ENABLED: 'true',
  CLAMAV_HOST: '127.0.0.1',
  DEPLOY_DIR: '/srv/www/simal',
  PORTAL_PUBLIC_URL: 'https://kyc.simalme.com',
  SITE_PUBLIC_URL: 'https://simalme.com',
  WATCHLIST_CSV: fileURLToPath(new URL('../fixtures/watchlist.csv', import.meta.url)),
};
Object.assign(process.env, GOOD);
const { assertProductionConfig } = await import('../../src/config.js');

const withEnv = (patch, fn) => {
  const prev = {};
  for (const k of Object.keys(patch)) { prev[k] = process.env[k]; process.env[k] = patch[k]; }
  try { return fn(); } finally { for (const k of Object.keys(patch)) process.env[k] = prev[k]; }
};

test('a complete production environment passes', () => {
  assert.deepEqual(assertProductionConfig(false), []);
  assert.doesNotThrow(() => assertProductionConfig());
});

test('.env.example placeholders are refused, by key', () => {
  const problems = withEnv({ ADMIN_PASSWORD: 'set-a-strong-password-here', ADMIN_TOTP_SECRET: 'BASE32SECRETPLACEHOLDER',
    BUILD_DATABASE_URL: 'postgres://simal_build:CHANGE_ME@127.0.0.1:5433/simal' }, () => assertProductionConfig(false));
  for (const k of ['ADMIN_PASSWORD', 'ADMIN_TOTP_SECRET', 'BUILD_DATABASE_URL']) assert.ok(problems.some((p) => p.startsWith(k + ' ')), k);
});

test('missing CSRF secret, document key, clamd, deploy target are each named', () => {
  const problems = withEnv({ CSRF_SECRET: '', DOC_ENCRYPTION_KEY: '', CLAMAV_HOST: '', DEPLOY_DIR: '' }, () => assertProductionConfig(false));
  for (const k of ['CSRF_SECRET', 'DOC_ENCRYPTION_KEY', 'CLAMAV_HOST', 'DEPLOY_DIR']) assert.ok(problems.some((p) => p.startsWith(k)), k);
  assert.throws(() => withEnv({ CSRF_SECRET: '' }, () => assertProductionConfig()), /Refusing to start in production/);
});
