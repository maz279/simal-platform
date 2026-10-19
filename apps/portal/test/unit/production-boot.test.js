// deploy-audit H4: the production refusals run before any service is built — createScreening()
// used to write a starter watchlist first, which satisfied the "watchlist exists" check.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'prodboot-'));
const MISSING = path.join(TMP, 'no-such-watchlist.csv');
Object.assign(process.env, {
  NODE_ENV: 'production', NODE_KYC_TEST: '1', DATABASE_URL: '', DATA_DIR: TMP,
  ADMIN_EMAIL: 'prod-admin@example.com', ADMIN_PASSWORD: crypto.randomBytes(24).toString('base64url'),
  ADMIN_MFA_REQUIRED: 'true', ADMIN_TOTP_SECRET: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
  CSRF_SECRET: crypto.randomBytes(32).toString('hex'), JWT_SECRET: '', DOC_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  MASTER_API_TOKEN: crypto.randomBytes(32).toString('hex'), SMTP_HOST: 'smtp.example.net', NOTIFY_EMAIL_ENABLED: 'true',
  CLAMAV_HOST: '127.0.0.1', DEPLOY_DIR: path.join(TMP, 'www'), PORTAL_PUBLIC_URL: 'https://kyc.simalme.com', SITE_PUBLIC_URL: 'https://simalme.com', WATCHLIST_CSV: MISSING,
});
const { createApp } = await import('../../src/server.js');

test('production boot without a watchlist is refused, and no starter list is written', async () => {
  await assert.rejects(createApp({ dataDir: TMP }), /WATCHLIST_CSV not found/);
  assert.equal(fs.existsSync(MISSING), false, 'the starter watchlist must not be seeded in production');
});
