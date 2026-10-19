/* pg-mode-journey.test.js — deep-iteration proof: the account + workflow
 * features built and tested on the JSON store must ALSO work with the
 * PostgreSQL store — the production path. Standalone script (run directly,
 * NOT via node --test — the app's PG client intentionally keeps the loop
 * alive, which would hang the runner):
 *
 *   node test/pg-mode-journey.test.js
 *
 * Boots the real portal against a scratch database (drop → migrate → seed),
 * then drives over HTTP: MFA enrol/confirm · email change + verify ·
 * password reset · review checklist/notes persistence · query raise +
 * partner respond · legacy ETL import WITH documents fidelity.
 * History: users.save/submissions.save on PG silently dropped
 * totpSecret/pendingEmail/documents/queries/review until the deep iteration
 * of 6 Oct 2026 (B9 + full-field adapter writes) — this suite is the proof.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
/* Documents are encrypted at rest and both stores refuse a default key (rm 10.4-1). A clean
 * CI runner has no apps/portal/.env, so every suite that boots the app brings its own key
 * (platform run #12 failed workspace + pg-mode-journey without it). */
if (!process.env.DOC_ENCRYPTION_KEY) process.env.DOC_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/* Codebase root: probe candidate anchors until scripts/migrate.sql is found.
 * Two anchors because apps/portal is a junction to a SIBLING of the repo
 * (real path resolves outside Codebase): the cwd walk works in a normal
 * checkout (CI), the sibling construct works in this dev workspace. */
const CANDIDATES = [];
for (let d = process.cwd(); ; d = path.dirname(d)) { CANDIDATES.push(d); if (d === path.dirname(d)) break; }
const urlDir = path.dirname(fileURLToPath(import.meta.url)); /* real (junction-resolved) path */
CANDIDATES.push(path.resolve(urlDir, '..', '..', 'Simal_Corporate_website', 'Codebase'));
const ROOT = CANDIDATES.find(x => fs.existsSync(path.join(x, 'scripts', 'migrate.sql')));
if (!ROOT) { console.error('Codebase root not found from cwd or module anchors'); process.exit(2); }
const FIXTURES = path.join(ROOT, 'apps', 'portal', 'test', 'fixtures');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pgj-'));

const SOURCE_URL = process.env.DATABASE_URL;
if (!SOURCE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const SCRATCH = 'simal_pgjourney';
const SCRATCH_URL = SOURCE_URL.replace(/\/[^/?]+$/, '/' + SCRATCH);
/* rm(7.1-3)/DAT-9: when the journey runs as the NOCREATEDB app role, DDL
 * (CREATE DATABASE, migrate) must go through ADMIN_DATABASE_URL; deriving the
 * admin URL from DATABASE_URL fails under simal_app. */
const ADMIN_URL = process.env.ADMIN_DATABASE_URL || SOURCE_URL.replace(/\/[^/?]+$/, '/postgres');
const SOURCE_USER = decodeURIComponent(new URL(SOURCE_URL).username);

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('PASS ' + name); }
  catch (e) {
    fail++;
    const st = String(e.stack || e.message).split('\n');
    const at = (st.find(l => l.includes('pg-mode-journey')) || '').trim();
    console.log('FAIL ' + name + ': ' + st[0] + '  [' + at + ']');
  }
};
const assert = (await import('node:assert/strict')).default;

/* ---- scratch database (rehearsal pattern) ---- */
/* migrations run with the ADMIN credentials (DDL); the portal journey itself
 * connects with the SOURCE role — when that is a least-privilege app role, the
 * grant block below gives it exactly the prod-db-roles DML set on the scratch db. */
const uAdmin = new URL(ADMIN_URL);
const admin = new pg.Client({ connectionString: ADMIN_URL });
await admin.connect();
await admin.query('DROP DATABASE IF EXISTS simal_pgjourney');
await admin.query('CREATE DATABASE simal_pgjourney');
if (SOURCE_USER !== uAdmin.username) {
  await admin.query(`GRANT CONNECT ON DATABASE ${SCRATCH} TO ${JSON.stringify(SOURCE_USER)}`);
  await admin.query(`GRANT USAGE ON SCHEMA public TO ${JSON.stringify(SOURCE_USER)}`);
}
await admin.end();
/* rm(9.1-3): migrate/seed/grants go through the pg client, as scripts/ci/lib.mjs does.
 * tools/pgsql/bin/psql.exe exists only on the Windows rig, so the CI platform's
 * integration job died here with spawnSync ENOENT. */
const scratchAdmin = new pg.Client({ connectionString: ADMIN_URL.replace(/\/[^/?]+$/, '/' + SCRATCH) });
await scratchAdmin.connect();
try {
  for (const f of ['migrate.sql', 'seed.sql']) await scratchAdmin.query(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8'));
  if (SOURCE_USER !== uAdmin.username) {
    // apply the prod-db-roles DML grant set so a least-privilege SOURCE role can run the journey
    const role = JSON.stringify(SOURCE_USER);
    await scratchAdmin.query(
      `GRANT USAGE ON SCHEMA public TO ${role};` +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role};` +
      `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${role};`);
  }
} finally { await scratchAdmin.end(); }
console.log('scratch database ' + SCRATCH + ' provisioned (migrate + seed)');

/* ---- boot the portal on the scratch PG ---- */
process.env.NODE_KYC_TEST = '1';
process.env.DATABASE_URL = SCRATCH_URL;
process.env.DATA_DIR = TMP;
const ADMIN_EMAIL = 'pgj-staff@example.com';
const ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
process.env.ADMIN_MFA_REQUIRED = 'false';
const wlFixture = path.join(FIXTURES, 'watchlist.csv');
if (!fs.existsSync(wlFixture)) fs.copyFileSync(path.join(ROOT, 'apps', 'portal', 'data', 'watchlist.csv'), wlFixture);
process.env.WATCHLIST_CSV = wlFixture;
process.env.MASTER_API_TOKEN = crypto.randomBytes(32).toString('hex');
process.env.LOGIN_RATE_MAX = '200';

const { createApp } = await import('../src/server.js');
const { totpNow } = await import('../src/lib/security.js');
const app = await createApp();
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;
console.log('portal booted on PG scratch @ ' + BASE + '\n');

const jar = {};
async function call(method, p, body, who = 'staff') {
  const r = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', ...(jar[who] ? { cookie: jar[who] } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j, headers: r.headers };
}
const login = async (email, pw, who = 'staff') => call('POST', '/api/auth/login', { email, password: pw }, who);

await t('PG: password reset round-trip persists (password_hash write)', async () => {
  await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await call('POST', '/api/auth/password-reset/request', { email: ADMIN_EMAIL });
  const ob = await call('GET', '/api/admin/outbox');
  const m = (ob.json || []).find(x => x.to === ADMIN_EMAIL && /reset/.test(x.subject));
  assert.ok(m, 'reset email landed');
  const tok = m.text.match(/reset=([a-f0-9]{64})/)[1];
  const NEW_PW = 'Pg-' + crypto.randomBytes(9).toString('base64url');
  assert.equal((await call('POST', '/api/auth/password-reset/confirm', { token: tok, newPassword: NEW_PW })).status, 200);
  assert.equal((await login(ADMIN_EMAIL, ADMIN_PASSWORD)).status, 401, 'old pw dead on PG');
  assert.equal((await login(ADMIN_EMAIL, NEW_PW)).status, 200, 'new pw live on PG');
  await call('POST', '/api/auth/password-reset/request', { email: ADMIN_EMAIL });
  const ob2 = await call('GET', '/api/admin/outbox');
  const m2 = (ob2.json || []).find(x => x.to === ADMIN_EMAIL && /reset/.test(x.subject) && x !== m);
  const tok2 = m2.text.match(/reset=([a-f0-9]{64})/)[1];
  const restored = await call('POST', '/api/auth/password-reset/confirm', { token: tok2, newPassword: ADMIN_PASSWORD });
  assert.equal(restored.status, 200, 'restore confirm ok: ' + JSON.stringify(restored.json));
  const back = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(back.status, 200, 'original password restored on PG');
});

await t('PG: MFA enrolment persists (pending_totp_secret + totp_secret writes)', async () => {
  const b = await call('POST', '/api/auth/mfa/begin', {});
  assert.equal(b.status, 200, 'begin works');
  const c = await call('POST', '/api/auth/mfa/confirm', { code: totpNow(b.json.secret) });
  assert.equal(c.status, 200, 'confirm reads the persisted pending secret');
  const pw = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(pw.json.mfaRequired, true, 'login gated on PG');
  const mfa = await call('POST', '/api/auth/mfa', { mfaChallengeId: pw.json.mfaChallengeId, code: totpNow(b.json.secret) });
  assert.equal(mfa.status, 200);
  const off = await call('POST', '/api/auth/mfa/disable', { code: totpNow(b.json.secret) });
  assert.equal(off.status, 200);
});

await t('PG: email change + verify persists (pending_email + email writes)', async () => {
  const NEW = 'pgj-staff-new@example.com';
  await call('POST', '/api/auth/email/change', { newEmail: NEW });
  const ob = await call('GET', '/api/admin/outbox');
  const m = (ob.json || []).find(x => x.to === NEW && /confirm/i.test(x.subject));
  assert.ok(m, 'verification email to new address');
  const tok = m.text.match(/verify-email=([a-f0-9]{64})/)[1];
  assert.equal((await call('POST', '/api/auth/email/verify', { token: tok })).status, 200);
  assert.equal((await login(NEW, ADMIN_PASSWORD)).status, 200, 'sign-in under the NEW email on PG');
  await login(NEW, ADMIN_PASSWORD);
});

await t('PG: review checklist + notes persist across reads (review JSONB)', async () => {
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\npgj'), Buffer.from('\ntrailer<</Root 1 0 R>>%%EOF')]).toString('base64');
  const r = await call('POST', '/api/public/applications', { application: {
    role: 'vendor',
    company: { legal_name_en: 'PG Journey LLC', entity_type: 'LLC', country: 'AE', license_number: 'CN-PGJ', license_authority: 'DMCC', license_issue: '2024-01-01', license_expiry: '2028-01-01', business_activity: 'IT', address: { building: 'B', street: 'S', city: 'Dubai', emirate: 'Dubai', country: 'UAE' } },
    tax: { trn: '100548172900015', vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' },
    contacts: { primary: { name: 'P G Jay', designation: 'Owner', email: 'pgj@partner.test', mobile: '+971501234567' } },
    signatories: [{ name: 'P G Jay', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P1', id_expiry: '2029-01-01', authority_basis: 'MOA (manager)', email: 'pgj@partner.test' }],
    ubos: [{ name: 'P G Jay', nationality: 'AE', id_type: 'passport', id_number: 'P2', ownership_pct: '100', country_of_residence: 'UAE' }],
    banking: { bank_name: 'ENBD', iban: 'AE070331234567890123456', account_holder: 'PG Journey LLC', currency: 'AED' },
    declarations: { accuracy: { checked: true, signed_name: 'P G Jay' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    documents: ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof'].map(dt => ({ type: dt, name: dt + '.pdf', mime: 'application/pdf', dataB64: pdf })),
  } });
  assert.equal(r.status, 201, 'submission accepted');
  const ref = r.json.reference;
  await call('POST', '/api/admin/submissions/' + ref + '/actions', { action: 'start' });
  assert.equal((await call('POST', '/api/admin/submissions/' + ref + '/checklist', { item: 'license', checked: true })).status, 200);
  assert.equal((await call('POST', '/api/admin/submissions/' + ref + '/notes', { text: 'licence verified on PG journey' })).status, 200);
  const again = await call('GET', '/api/admin/submissions/' + ref);
  assert.equal(again.json.review.checklist.license, true, 'checklist persisted to PG');
  assert.equal((again.json.review.notes || []).length, 1, 'note persisted to PG');
});

await t('PG: query raise + partner respond persist (queries JSONB)', async () => {
  const ob = await call('GET', '/api/admin/submissions?per=50');
  const row = (ob.json.rows || []).find(x => x.status === 'under_review' || x.status === 'submitted');
  assert.ok(row, 'a pending submission exists');
  const ref = row.id;
  assert.equal((await call('POST', '/api/admin/submissions/' + ref + '/query', { section: 'tax', message: 'TRN certificate unreadable — please re-upload' })).status, 200);
  const st1 = await call('GET', '/api/public/applications/' + ref + '?email=pgj@partner.test');
  assert.equal((st1.json.queries || []).length, 1, 'query visible to partner (persisted)');
  assert.equal((await call('POST', '/api/public/applications/' + ref + '/respond', { email: 'pgj@partner.test', message: 'Re-uploaded, please check again' })).status, 200);
  const st2 = await call('GET', '/api/public/applications/' + ref + '?email=pgj@partner.test');
  assert.equal(st2.json.queries[0].response, 'Re-uploaded, please check again', 'partner response persisted');
});

await t('PG: RFQ engine persists header + items with notes (B11 fidelity)', async () => {
  const add = await call('POST', '/api/rfq-basket', { slug: 'crucial-t705-ssd-2', qty: 3, note: 'rush' }, 'anon');
  assert.equal(add.status, 200);
  const sub = await call('POST', '/api/rfq', { email: 'pgj@buyer.test', company: 'PGJ Buying LLC', contactName: 'P G Jay', phone: '+971501110010' }, 'anon');
  assert.equal(sub.status, 201);
  assert.match(sub.json.reference, /^SIMAL-RFQ-\d{8}-\d{4}$/);
  const c = new pg.Client({ connectionString: SCRATCH_URL });
  await c.connect();
  const r = await c.query('SELECT email, company, contact_name FROM rfqs WHERE ref = $1', [sub.json.reference]);
  const it = await c.query('SELECT slug, qty, note FROM rfq_items WHERE rfq_ref = $1', [sub.json.reference]);
  await c.end();
  assert.equal(r.rows[0].email, 'pgj@buyer.test');
  assert.equal(r.rows[0].contact_name, 'P G Jay');
  assert.equal(it.rows.length, 1);
  assert.equal(it.rows[0].slug, 'crucial-t705-ssd-2');
  assert.equal(it.rows[0].qty, 3);
  assert.equal(it.rows[0].note, 'rush', 'per-item note persisted on PG');
  /* status by email */
  const st = await call('GET', '/api/rfq/' + sub.json.reference + '?email=pgj@buyer.test', undefined, 'anon');
  assert.equal(st.status, 200);
  assert.equal(st.json.status, 'submitted');
});

await t('PG: legacy ETL import carries documents fidelity', async () => {
  const out = execFileSync('node', ['tools/migrate-legacy-kyc.js', 'legacy-kyc-export.json'], { cwd: path.join(ROOT, 'apps', 'portal'), env: { ...process.env, DATA_DIR: TMP }, encoding: 'utf8' });
  assert.match(out, /imported: 3/);
  const c = new pg.Client({ connectionString: SCRATCH_URL });
  await c.connect();
  const r = await c.query('SELECT id, documents, review FROM submissions WHERE id = $1', ['KYC-2024-0001']);
  await c.end();
  assert.equal(r.rows.length, 1);
  assert.ok(Array.isArray(r.rows[0].documents) && r.rows[0].documents.length === 1 && r.rows[0].documents[0].docId, 'legacy document WITH stored bytes carried to PG');
  assert.ok((r.rows[0].review.notes || []).length === 1, 'legacy reviewer notes carried');
});

/* ---- teardown ---- */
/* the app's PG client has no close() surface; dropping the scratch DB makes it emit
 * 'error' (terminating connection) after our summary. Shield the window between
 * server.close and process.exit so the run exits on the real pass/fail code. */
const swallowed = [];
const swallowErr = (err) => { swallowed.push(String(err && err.message || err)); };
process.on('uncaughtException', swallowErr);
await new Promise(r => app.server.close(r));
try {
  const a2 = new pg.Client({ connectionString: ADMIN_URL });
  await a2.connect();
  await a2.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'simal_pgjourney' AND pid <> pg_backend_pid()");
  await a2.query('DROP DATABASE IF EXISTS simal_pgjourney');
  await a2.end();
} catch { /* best effort */ }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
/* give the severed app client a tick to land in the shield before final exit */
await new Promise(r => setTimeout(r, 250));
process.off('uncaughtException', swallowErr);
if (swallowed.length) console.log('teardown: swallowed ' + swallowed.length + ' expected connection-teardown error(s)');

console.log('\nPG-MODE JOURNEY: ' + pass + ' PASS, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
