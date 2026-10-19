// deploy-audit H7: the SSG build child gets an allowlisted environment — no portal secret.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChildEnv } from '../../src/lib/child-env.js';

const PORTAL_ENV = {
  Path: 'C:\node;C:\Windows', SystemRoot: 'C:\Windows', TEMP: 'C:\t', HOME: '/home/app', LANG: 'en_US.UTF-8',
  PUBLIC_SITE_URL: 'https://simalme.com', PUBLIC_GA4_ID: 'G-1', PORTAL_URL: 'http://127.0.0.1:8090', NODE_OPTIONS: '--max-old-space-size=4096',
  DATABASE_URL: 'postgres://simal_app:pw@db/simal', ADMIN_DATABASE_URL: 'postgres://simal:pw@db/postgres', BUILD_DATABASE_URL: 'postgres://simal_build:pw@db/simal',
  PGPASSWORD: 'pw', DOC_ENCRYPTION_KEY: 'k', CSRF_SECRET: 'c', JWT_SECRET: 'j', SMTP_PASS: 's', WEBHOOK_SECRET: 'w',
  ADMIN_PASSWORD: 'a', ADMIN_TOTP_SECRET: 't', REVIEWER_PASSWORD: 'r', VIEWER_PASSWORD: 'v', MASTER_API_TOKEN: 'm',
  LEGACY_TOKEN_SECRET: 'l', ASP_KEY: 'ak', ASP_SECRET: 'as', NOTIFY_SMS_WHATSAPP_TOKEN: 'wa', SIMAL_PG_PW: 'p',
  npm_config__authToken: 'npm-token',
};

test('what the build needs is passed through', () => {
  const env = buildChildEnv(PORTAL_ENV);
  for (const k of ['Path', 'SystemRoot', 'TEMP', 'HOME', 'LANG', 'PUBLIC_SITE_URL', 'PUBLIC_GA4_ID', 'PORTAL_URL', 'NODE_OPTIONS']) assert.equal(env[k], PORTAL_ENV[k], k);
});

test('no secret, credential or connection string reaches the build child', () => {
  const env = buildChildEnv(PORTAL_ENV);
  const leaked = Object.keys(env).filter((k) => /PASS|SECRET|TOKEN|KEY|DATABASE_URL|PG_PW/i.test(k) || Object.values(env).includes('pw'));
  assert.deepEqual(leaked, []);
  assert.equal(Object.keys(env).length, 9);
});
