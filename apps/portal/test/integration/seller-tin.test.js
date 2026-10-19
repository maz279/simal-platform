// deploy-audit H8: SIMAL_TIN sets the seller TRN the portal puts on e-invoices (it was stuck on
// a seed value with no way to set the real one).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tin-'));
Object.assign(process.env, {
  NODE_KYC_TEST: '1', NODE_ENV: 'test', DATABASE_URL: '', DATA_DIR: TMP,
  DOC_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  WATCHLIST_CSV: fileURLToPath(new URL('../fixtures/watchlist.csv', import.meta.url)),
  ADMIN_EMAIL: 'tin-admin@example.com', ADMIN_PASSWORD: crypto.randomBytes(18).toString('base64url'), ADMIN_MFA_REQUIRED: 'false',
  SIMAL_TIN: '100987654300003',
});
const { createApp } = await import('../../src/server.js');
const app = await createApp({ dataDir: TMP });
await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + app.server.address().port;

test('SIMAL_TIN becomes the seller TRN and Peppol id', async () => {
  const s = await (await fetch(BASE + '/api/settings')).json();
  assert.equal(s.simalTin, '100987654300003');
  assert.equal(s.simalPeppol, '0235:1009876543');
});

after(async () => {
  await new Promise((r) => app.server.close(r));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
});
