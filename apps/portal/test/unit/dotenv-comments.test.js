// deploy-audit: inline comments in .env (as .env.example writes them) are comments, not values.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadDotEnv } from '../../src/config.js';

test('unquoted " #" starts a comment; quoted values and embedded # are kept', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-')), '.env');
  fs.writeFileSync(f, [
    'ZZ_NODE_ENV=production   # set explicitly per environment',
    'ZZ_WEBHOOK_SECRET=  # HMAC secret for the integration boundary',
    'ZZ_MIN=15   # NIST 800-63B-4',
    'ZZ_PASS=abc#def',
    'ZZ_QUOTED="keep # this"',
    '# ZZ_COMMENTED=1',
  ].join('\n'));
  try {
    loadDotEnv(f);
    assert.equal(process.env.ZZ_NODE_ENV, 'production');
    assert.equal(process.env.ZZ_WEBHOOK_SECRET, '');
    assert.equal(process.env.ZZ_MIN, '15');
    assert.equal(process.env.ZZ_PASS, 'abc#def');
    assert.equal(process.env.ZZ_QUOTED, 'keep # this');
    assert.equal('ZZ_COMMENTED' in process.env, false);
  } finally {
    for (const k of ['ZZ_NODE_ENV', 'ZZ_WEBHOOK_SECRET', 'ZZ_MIN', 'ZZ_PASS', 'ZZ_QUOTED']) delete process.env[k];
  }
});
