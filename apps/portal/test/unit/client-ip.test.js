// deploy-audit H2 — the client address behind nginx must come from the right of
// X-Forwarded-For (nginx appends what it saw); the leftmost entry is client-controlled.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveClientIp, rateLimiter } from '../../src/lib/security.js';

const reqFrom = (remoteAddress, xff) => ({ socket: { remoteAddress }, headers: xff === undefined ? {} : { 'x-forwarded-for': xff } });

test('untrusted peer: X-Forwarded-For is ignored', () => {
  assert.equal(resolveClientIp(reqFrom('203.0.113.9', '6.6.6.6')), '203.0.113.9');
});

test('trusted proxy: a forged leftmost entry cannot choose the client address', () => {
  // the client sent "X-Forwarded-For: 6.6.6.6"; nginx appended the real address
  assert.equal(resolveClientIp(reqFrom('127.0.0.1', '6.6.6.6, 203.0.113.9')), '203.0.113.9');
  assert.equal(resolveClientIp(reqFrom('::ffff:127.0.0.1', '1.1.1.1, 2.2.2.2, 198.51.100.4')), '198.51.100.4');
});

test('trusted proxy chain from TRUSTED_PROXIES: our own hops are skipped from the right', () => {
  const prev = process.env.TRUSTED_PROXIES;
  process.env.TRUSTED_PROXIES = '10.0.0.5, 10.0.0.6';
  try {
    assert.equal(resolveClientIp(reqFrom('10.0.0.5', '6.6.6.6, 198.51.100.7, 10.0.0.6')), '198.51.100.7');
  } finally {
    if (prev === undefined) delete process.env.TRUSTED_PROXIES; else process.env.TRUSTED_PROXIES = prev;
  }
});

test('trusted proxy without X-Forwarded-For falls back to the socket address', () => {
  assert.equal(resolveClientIp(reqFrom('127.0.0.1')), '127.0.0.1');
});

test('rate limiter: a key is allowed again once its window has passed (expired buckets are swept)', async () => {
  const hit = rateLimiter({ windowMs: 40, max: 1 });
  assert.equal(hit('a').ok, true);
  assert.equal(hit('a').ok, false);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(hit('b').ok, true); // triggers the sweep
  assert.equal(hit('a').ok, true);
});
