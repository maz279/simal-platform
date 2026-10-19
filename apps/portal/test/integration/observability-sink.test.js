// test/integration/observability-sink.test.js — rm(9.3-1)/rm(9.3-2) / NFR-3
// End-to-end observability drills, as discoverable tests:
//  1. POST /api/admin/observability/test-error as super_admin -> 500, and the
//     outbound sink DELIVERS a payload carrying the request id to a real HTTP
//     webhook receiver (on the rig scripts/observability-sink.mjs plays this
//     role; here an in-test receiver proves the mechanics).
//  2. GET /api/admin/observability/errors lists what the in-memory sink recorded.
//  3. scripts/uptime-probe.mjs exits 0 against a healthy origin and exits 1 +
//     ALERTS the webhook when the origin is down.
// Teardown runs in the test body's finally — the repo's bootApp suites do not
// use top-level after() (its callback never fires under the child test runner).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootApp } from '../../../../scripts/ci/lib.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const PROBE = path.join(REPO, 'scripts', 'uptime-probe.mjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('NFR-3 / rm(9.3-1)+rm(9.3-2): outbound error sink + uptime probe with alerting', async (t) => {
  /* a real webhook receiver: collects JSON bodies with a `text` field */
  const received = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      let body = null; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* raw */ }
      received.push(body);
      res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"received":true}');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  process.env.OBSERVABILITY_WEBHOOK_URL = `http://127.0.0.1:${server.address().port}/hook`; /* read per 5xx */

  const boot = await bootApp({ mode: 'json', mfa: false });
  try {
    const { base, creds } = boot;
    const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: creds.adminEmail, password: creds.adminPassword }) });
    assert.equal(login.status, 200, 'super_admin login');
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const me = await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json();

    await t.test('5xx reaches the outbound sink carrying the request id (PDPL-redacted)', async () => {
      const n0 = received.length;
      const r = await fetch(base + '/api/admin/observability/test-error', { method: 'POST',
        headers: { cookie, 'x-csrf-token': me.csrfToken } });
      assert.equal(r.status, 500, 'synthetic error surfaces as 500');
      const body = await r.json();
      assert.ok(body.requestId, '500 body carries requestId');

      for (let i = 0; i < 40 && received.length === n0; i++) await wait(100); /* fire-and-forget POST */
      assert.equal(received.length, n0 + 1, 'exactly one sink delivery');
      const payload = received[n0];
      assert.match(payload.text, /^\[simal\] 500 POST \/api\/admin\/observability\/test-error req=/);
      assert.equal(payload.requestId, body.requestId, 'sink payload carries the REQUEST ID');
      assert.equal(payload.status, 500);
      assert.equal(payload.path, '/api/admin/observability/test-error');
      assert.match(payload.message, /Synthetic test error for observability verification/);
      assert.ok(!/(?<!\d)\d{6,}(?!\d)/.test(payload.message), 'no long digit run leaks (PDPL)');

      /* the in-memory sink surfaces the same error to the observability API */
      const errs = await (await fetch(base + '/api/admin/observability/errors', { headers: { cookie } })).json();
      assert.ok(errs.errors.some((e) => e.requestId === body.requestId), 'errorSink list carries the entry');
    });

    await t.test('uptime probe: exit 0 healthy / exit 1 + webhook alert down', async () => {
      const run = (env) => new Promise((resolve) => {
        const child = spawn(process.execPath, [PROBE], { env: { ...process.env, ...env } });
        let out = '';
        child.stdout?.on('data', (d) => { out += d; });
        child.stderr?.on('data', (d) => { out += d; });
        child.on('close', (code) => resolve({ code, out }));
      });
      const healthy = await run({ PUBLIC_ORIGIN: base, OBSERVABILITY_WEBHOOK_URL: process.env.OBSERVABILITY_WEBHOOK_URL });
      assert.equal(healthy.code, 0, 'healthy origin -> exit 0 (' + healthy.out.trim() + ')');

      const n0 = received.length;
      const down = await run({ PUBLIC_ORIGIN: 'http://127.0.0.1:9', OBSERVABILITY_WEBHOOK_URL: process.env.OBSERVABILITY_WEBHOOK_URL });
      assert.equal(down.code, 1, 'dead origin -> exit 1 (' + down.out.trim() + ')');
      assert.ok(received.length > n0, 'an UPTIME FAIL alert was delivered');
      assert.match(received[received.length - 1].text, /UPTIME FAIL http:\/\/127\.0\.0\.1:9\/api\/health — /);
    });
  } finally {
    delete process.env.OBSERVABILITY_WEBHOOK_URL;
    await boot.stop();
    server.closeIdleConnections?.(); /* idle keep-alive sockets block close() */
    await new Promise((r) => { server.close(r); setTimeout(r, 8000).unref?.(); });
  }
});
