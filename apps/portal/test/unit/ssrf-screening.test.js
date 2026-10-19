/* Unit tests: SSRF guard (webhooks) + screening matching — node:test
 * Relative specifiers are Node ESM module specifiers, not user-input paths. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* ---- SSRF guard: private/loopback/reserved hosts must be refused ---- */
test('SSRF guard refuses loopback, private and reserved targets', async () => {
  const { assertSafeOutboundUrl } = await import('../../src/services/webhooks.service.js');
  for (const bad of [
    'http://127.0.0.1/webhook', 'http://localhost/webhook', 'http://10.0.0.5/wh',
    'http://192.168.1.10/wh', 'http://172.16.2.3/wh', 'http://169.254.169.254/latest/meta-data',
    'http://[::1]/wh', 'ftp://example.com/wh', 'file:///etc/passwd', 'not a url',
  ]) {
    await assert.rejects(() => assertSafeOutboundUrl(bad), { message: /not allowed|Invalid URL|blocked|protocol/i }, bad);
  }
});
test('SSRF guard accepts a public http/https URL', async () => {
  const { assertSafeOutboundUrl } = await import('../../src/services/webhooks.service.js');
  const u = await assertSafeOutboundUrl('https://example.com/hook');
  assert.equal(u.hostname, 'example.com');
});

/* ---- screening: normalisation + fuzzy/exact matching ---- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scr-'));
process.env.WATCHLIST_CSV = path.join(tmp, 'watchlist.csv');
fs.writeFileSync(process.env.WATCHLIST_CSV,
  'Type,Name,Aliases,Country\nSANCTION,SHADOW FUTURE TRADING FZE,,AE\nPEP,MARCO POLO ROSSI,,IT\n');

const { createScreening } = await import('../../src/services/screening.service.js');
const { createStore } = await import('../../src/store/db.js');
const { createRepos } = await import('../../src/store/repos.js');
const repos = createRepos(createStore(fs.mkdtempSync(path.join(os.tmpdir(), 'scrdb-'))));
const screening = createScreening(repos);

test('screening loads the watchlist', () => {
  assert.equal(screening.size(), 2);
});

test('exact match after legal-token normalisation (LLC/FZE/TRADING stripped)', async () => {
  const r = await screening.screen({ id: 'T1', company: { legal_name_en: 'Shadow Future Trading FZE LLC' }, signatories: [], ubos: [] });
  assert.equal(r.clear, false);
  assert.ok(r.hits.some(h => h.subject === 'company' && h.method === 'exact'));
});

test('clean name clears', async () => {
  const r = await screening.screen({ id: 'T2', company: { legal_name_en: 'Sunrise Fresh Vegetables LLC' }, signatories: [], ubos: [] });
  assert.equal(r.clear, true);
});

test('signatory and UBO names are screened too', async () => {
  const r = await screening.screen({
    id: 'T3', company: { legal_name_en: 'Innocent Systems LLC' },
    signatories: [{ name: 'Marco Polo Rossi' }],
    ubos: [{ name: 'Completely Clean Person' }],
  });
  assert.equal(r.clear, false);
  assert.ok(r.hits.some(h => h.subject.startsWith('signatory')));
});

test('results persist per reference', async () => {
  const got = await screening.result('T1');
  assert.ok(got && got.clear === false);
});

fs.rmSync(tmp, { recursive: true, force: true });
