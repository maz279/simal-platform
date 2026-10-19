// test/integration/doc-signed-urls.test.js — rm(9.2-2) / rm(8.1-2) (APP-3 residue, F-2026-N12)
// Signed document URLs as a discoverable node:test: single-use (409 on reuse),
// TTL expiry (401 after the window), token/document mismatch (403) and atomic
// consumption (10 PARALLEL fetches of one fresh token → exactly ONE 200).
// The drills run against an in-process portal (JSON store) always, and again on
// a scratch PostgreSQL database when one is reachable — that path exercises the
// atomic UPDATE ... RETURNING consume (consumeAtomic).
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';

/* sub-60s TTL is refused only in production; tests run with NODE_ENV=test */
process.env.DOC_URL_TTL_MS = '600';
const TTL_MS = 600;

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);

async function runDrills(t, boot) {
  const { base, creds } = boot;
  const app = boot.app;
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: creds.adminEmail, password: creds.adminPassword }) });
  assert.equal(login.status, 200, 'admin login');
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  const me = await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json();
  assert.ok(me.csrfToken, 'csrf token for mutating call');

  /* plant two stored documents and attach them to a submission */
  const PDF = Buffer.from('%PDF-1.4\n% rm(9.2-2) signed-url drill\n');
  const mkDoc = async (name) => app.repos.documents.store({ name, mime: 'application/pdf' }, PDF);
  const d1 = await mkDoc('drill-a.pdf');
  const d2 = await mkDoc('drill-b.pdf');
  const sub = {
    id: 'SIM-DOC-URL-1', role: 'vendor', status: 'submitted',
    company: { legal_name_en: 'Signed URL Drill LLC' },
    contacts: { primary: { email: 'drill@example.com', name: 'Drill' } },
    documents: [
      { docId: d1.docId, path: d1.relPath, name: 'drill-a.pdf', mime: 'application/pdf' },
      { docId: d2.docId, path: d2.relPath, name: 'drill-b.pdf', mime: 'application/pdf' },
    ],
    submittedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(), history: [],
  };
  await app.repos.submissions.add(sub);

  const sign = async (docId) => {
    const r = await fetch(base + '/api/admin/documents/' + docId + '/sign', { method: 'POST',
      headers: { cookie, 'x-csrf-token': me.csrfToken } });
    assert.equal(r.status, 200, 'sign must succeed for ' + docId);
    return (await r.json()).signedUrl;
  };

  await t.test('single use: first fetch 200 with bytes; immediate reuse 409', async () => {
    const url = await sign(d1.docId);
    const first = await fetch(base + url);
    assert.equal(first.status, 200);
    const body = Buffer.from(await first.arrayBuffer());
    assert.equal(body.compare(PDF), 0, 'downloaded bytes match the stored plaintext');
    const second = await fetch(base + url);
    assert.equal(second.status, 409, 'reused token is 409 (Token already used)');
  });

  await t.test('expiry: fetch after the TTL window is 401', async () => {
    const url = await sign(d1.docId);
    await new Promise((r) => setTimeout(r, TTL_MS + 250));
    const late = await fetch(base + url);
    assert.equal(late.status, 401, 'expired token is 401 (Token expired)');
  });

  await t.test('mismatch: a token for another document is 403', async () => {
    const url = await sign(d1.docId);
    const swapped = url.replace(d1.docId, d2.docId);
    const r = await fetch(base + swapped);
    assert.equal(r.status, 403, 'token does not match requested document');
  });

  await t.test('atomicity: 10 PARALLEL fetches of one fresh token → exactly one 200', async () => {
    const url = await sign(d2.docId);
    const results = await Promise.all(Array.from({ length: 10 }, () => fetch(base + url)));
    const codes = results.map((r) => r.status).sort();
    const ok200 = codes.filter((c) => c === 200).length;
    const conflict = codes.filter((c) => c === 409).length;
    assert.equal(ok200, 1, 'EXACTLY one 200 out of 10 parallel fetches (codes: ' + codes.join(',') + ')');
    assert.equal(conflict, 9, 'the other nine are 409 (already used)');
  });
}

test('APP-3 / rm(8.1-2): signed-URL drills — JSON store (sequential consume)', async (t) => {
  const boot = await bootApp({ mode: 'json', mfa: false });
  try { await runDrills(t, boot); } finally { await boot.stop(); }
});

test('APP-3 / rm(8.1-2): signed-URL drills — PostgreSQL (atomic UPDATE ... RETURNING consume)', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'docurl');
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  try { await runDrills(t, boot); } finally {
    await boot.stop();
    if (boot.app?.repos?.client) await boot.app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});
