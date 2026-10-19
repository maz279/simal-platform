// rm(8.1-1)/rm(8.1-2) unit tests — scanner engine order + fail-closed, token TTL guard.
import test from 'node:test';
import assert from 'node:assert/strict';

const EICAR = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'latin1');

test('scanBuffer: signature engine decides when no CLAMAV_HOST (dev/CI default)', async () => {
  const saved = { h: process.env.CLAMAV_HOST, p: process.env.CLAMAV_PORT };
  /* pinned empty, not deleted: importing config.js loads apps/portal/.env for keys that are absent,
   * which on a rig with clamd configured put CLAMAV_HOST back */
  process.env.CLAMAV_HOST = ''; process.env.CLAMAV_PORT = '';
  try {
    const { scanBuffer } = await import('../../src/lib/virus-scanner.js');
    const dirty = await scanBuffer(EICAR, 'eicar.pdf');
    assert.equal(dirty.clean, false);
    assert.equal(dirty.engine, 'signature');
    const clean = await scanBuffer(Buffer.from('%PDF-1.4 x'), 'x.pdf');
    assert.equal(clean.engine, 'signature');
    assert.equal(clean.clean, true);
  } finally {
    if (saved.h) process.env.CLAMAV_HOST = saved.h;
    if (saved.p) process.env.CLAMAV_PORT = saved.p;
  }
});

test('scanBuffer: CLAMAV_REQUIRED + unreachable clamd fails CLOSED with 503', async () => {
  const saved = { h: process.env.CLAMAV_HOST, r: process.env.CLAMAV_REQUIRED };
  process.env.CLAMAV_HOST = '127.0.0.1';
  process.env.CLAMAV_PORT = '1'; // nothing listens on tcp/1 — connection refused
  process.env.CLAMAV_REQUIRED = 'true';
  try {
    const { scanBuffer } = await import('../../src/lib/virus-scanner.js');
    await assert.rejects(
      () => scanBuffer(Buffer.from('%PDF-1.4 innocent'), 'x.pdf'),
      (e) => e.status === 503 && /Virus scanner unavailable/.test(e.message)
    );
  } finally {
    if (saved.h) process.env.CLAMAV_HOST = saved.h; else delete process.env.CLAMAV_HOST;
    if (saved.r) process.env.CLAMAV_REQUIRED = saved.r; else delete process.env.CLAMAV_REQUIRED;
    delete process.env.CLAMAV_PORT;
  }
});

test('token TTL guard: document_download under 60s refused in production', async () => {
  const saved = { env: process.env.NODE_ENV, ttl: process.env.DOC_URL_TTL_MS };
  process.env.NODE_ENV = 'production';
  delete process.env.DOC_URL_TTL_MS;
  try {
    const { createTokenService, TOKEN_KINDS } = await import('../../src/services/token.service.js');
    const svc = createTokenService({
      tokens: {
        issue: async (rec) => rec,
        find: async () => null,
        save: async () => {},
      },
    });
    await assert.rejects(
      () => svc.issue('document_download', 'doc_x', {}, { ttlMs: 59999 }),
      (e) => e.status === 500 && /under 60s/.test(e.message)
    );
    // 60s is fine; the default (no override) is the configured default
    await svc.issue('document_download', 'doc_x', {}, { ttlMs: 60000 });
    assert.ok(TOKEN_KINDS.document_download.ttlMs >= 60000);
  } finally {
    if (saved.env) process.env.NODE_ENV = saved.env; else delete process.env.NODE_ENV;
    if (saved.ttl) process.env.DOC_URL_TTL_MS = saved.ttl;
  }
});
