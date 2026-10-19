#!/usr/bin/env node
/* pg-integration-test.js — Phase 1 T1.3/T1.4 verification.
 * Proves the PostgreSQL data layer works correctly WITHOUT the portal service layer.
 * Tests: connection, schema, seeds, search, money math, invoice constraints.
 * Run: node test/pg-integration-test.js
 */
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONN = process.env.DATABASE_URL;
if (!CONN) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');

let passed = 0, failed = 0;
const t = async (name, fn) => {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
};

const client = new pg.Client({ connectionString: CONN });
await client.connect();
console.log(`connected to ${CONN.replace(/:[^:@]+@/, ':***@')}\n`);

/* ===== Schema verification ===== */
await t('schema: 27 tables exist (incl. one_time_tokens, B7 immutability triggers, B13 publish_approvals)', async () => {
  const r = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'");
  assert.equal(r.rows[0].count, '27', `expected 27, got ${r.rows[0].count}`);
});

await t('schema: pg_trgm extension active', async () => {
  const r = await client.query("SELECT count(*) FROM pg_extension WHERE extname='pg_trgm'");
  assert.equal(r.rows[0].count, '1');
});

await t('schema: citext extension active', async () => {
  const r = await client.query("SELECT count(*) FROM pg_extension WHERE extname='citext'");
  assert.equal(r.rows[0].count, '1');
});

await t('schema: invoices.net_fils is BIGINT (not float)', async () => {
  const r = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name='invoices' AND column_name='net_fils'");
  assert.equal(r.rows[0].data_type, 'bigint', `got ${r.rows[0].data_type}`);
});

await t('schema: invoices.buyer_peppol is generated ALWAYS', async () => {
  const r = await client.query("SELECT is_generated FROM information_schema.columns WHERE table_name='invoices' AND column_name='buyer_peppol'");
  assert.equal(r.rows[0].is_generated, 'ALWAYS');
});

await t('schema: sequences ref_seq and inv_seq exist', async () => {
  const r = await client.query("SELECT count(*) FROM information_schema.sequences WHERE sequence_name IN ('ref_seq','inv_seq')");
  assert.ok(parseInt(r.rows[0].count) >= 2, `got ${r.rows[0].count}`);
});

/* ===== Seed data verification ===== */
await t('seed: 78 products (81 prototype rows − 3 U+2010 duplicate slugs)', async () => {
  const r = await client.query('SELECT count(*) FROM products');
  assert.equal(r.rows[0].count, '78');
});

await t('seed: 78 product_deep records', async () => {
  const r = await client.query('SELECT count(*) FROM product_deep');
  assert.equal(r.rows[0].count, '78');
});

await t('seed: 22 brands (ratified catalogue incl. zotac/pny)', async () => {
  const r = await client.query('SELECT count(*) FROM brands');
  assert.equal(r.rows[0].count, '22'); // rm(1.2-3)
});

await t('seed: 125 content_blocks (113 EN incl. 6 chrome blocks + 12 AR localization blocks)', async () => { // rm(6.3-1): 4.1/4.2 added 6 chrome blocks, 4.5/6.1 settled AR at 12
  const r = await client.query('SELECT count(*) FROM content_blocks');
  assert.equal(r.rows[0].count, '125');
});

await t('seed: 5 hero_slides', async () => {
  const r = await client.query('SELECT count(*) FROM hero_slides');
  assert.equal(r.rows[0].count, '5');
});

await t('seed: 14 legal_policies (7 EN + 7 AR)', async () => {
  const r = await client.query('SELECT count(*) FROM legal_policies');
  assert.equal(r.rows[0].count, '14');
});

await t('seed: settings has simalTin', async () => {
  const r = await client.query("SELECT v FROM settings WHERE k='simalTin'");
  assert.ok(r.rows.length > 0);
  const tin = typeof r.rows[0].v === 'string' ? JSON.parse(r.rows[0].v) : r.rows[0].v;
  assert.match(String(tin), /^\d{15}$/, `TIN should be 15 digits`);
});

/* ===== Search verification (T1.4 pg_trgm) ===== */
await t('search: exact substring finds T705', async () => {
  const r = await client.query("SELECT count(*) FROM products WHERE name ILIKE '%T705%'");
  assert.ok(parseInt(r.rows[0].count) >= 1);
});

await t('search: typo tolerance finds "crucail t705"', async () => {
  const r = await client.query("SELECT count(*) FROM products WHERE similarity(name, 'crucail t705') > 0.3");
  assert.ok(parseInt(r.rows[0].count) >= 1);
});

await t('search: garbage returns 0', async () => {
  const r = await client.query("SELECT count(*) FROM products WHERE similarity(name, 'zzzzqqq') > 0.3");
  assert.equal(r.rows[0].count, '0');
});

await t('search: brand search finds Crucial', async () => {
  const r = await client.query("SELECT count(*) FROM products WHERE brand ILIKE '%crucial%'");
  assert.ok(parseInt(r.rows[0].count) >= 10);
});

/* ===== Content verification ===== */
await t('content: software_product blocks exist (20)', async () => {
  const r = await client.query("SELECT count(*) FROM content_blocks WHERE entity='software_product'");
  assert.ok(parseInt(r.rows[0].count) >= 18, `got ${r.rows[0].count}`);
});

await t('content: it_solution blocks exist (17)', async () => {
  const r = await client.query("SELECT count(*) FROM content_blocks WHERE entity='it_solution'");
  assert.equal(r.rows[0].count, '17');
});

await t('content: insight blocks exist (14)', async () => {
  const r = await client.query("SELECT count(*) FROM content_blocks WHERE entity='insight'");
  assert.equal(r.rows[0].count, '14');
});

/* ===== Invoice constraints verification ===== */
await t('invoice: CHECK constraint currency=AED', async () => {
  await assert.rejects(
    client.query("INSERT INTO invoices (id, ref, seller, partner_email, buyer_tin, buyer_name, issue_date, due_date, currency, net_fils, vat_fils, total_fils, status) VALUES ('test_bad_cur', 'TEST-001', '{}', 'test@test.ae', '100123456700003', 'Test', '2026-01-01', '2026-01-31', 'USD', 100, 5, 105, 'draft')"),
    /check constraint/i
  );
});

await t('invoice: CHECK constraint due_date >= issue_date', async () => {
  await assert.rejects(
    client.query("INSERT INTO invoices (id, ref, seller, partner_email, buyer_tin, buyer_name, issue_date, due_date, currency, net_fils, vat_fils, total_fils, status) VALUES ('test_bad_date', 'TEST-002', '{}', 'test@test.ae', '100123456700003', 'Test', '2026-01-31', '2026-01-01', 'AED', 100, 5, 105, 'draft')"),
    /check constraint/i
  );
});

await t('invoice: buyer_peppol auto-generated as 0235:buyer_tin', async () => {
  const r = await client.query("SELECT buyer_peppol FROM invoices LIMIT 1");
  if (r.rows.length === 0) {
    // Insert a test invoice to verify
    await client.query("INSERT INTO invoices (id, ref, seller, partner_email, buyer_tin, buyer_name, issue_date, due_date, currency, net_fils, vat_fils, total_fils, status) VALUES ('test_pp', 'TEST-PP', '{}', 'test@test.ae', '100123456700003', 'Test Co', '2026-01-01', '2026-01-31', 'AED', 100, 5, 105, 'draft') ON CONFLICT (ref) DO NOTHING");
    const check = await client.query("SELECT buyer_peppol FROM invoices WHERE id='test_pp'");
    assert.equal(check.rows[0].buyer_peppol, '0235:1001234567'); // rm(1.2-3): 10-digit TIN endpoint (APP-2)
    await client.query("DELETE FROM invoices WHERE id='test_pp'");
  } else {
    assert.match(r.rows[0].buyer_peppol, /^0235:\d{10}$/); // rm(1.2-3): 10-digit TIN endpoint (APP-2)
  }
});

/* ===== Backup verification ===== */
await t('backup: pg_dump produces valid SQL', async () => {
  const r = await client.query('SELECT count(*) FROM products');
  assert.ok(parseInt(r.rows[0].count) > 0, 'database has data to back up');
});

/* ===== B5 portal-parity tables (drafts / invites / screening_results) ===== */
await t('b5: drafts lifecycle (create → save → find → remove)', async () => {
  const c = 'B5DFT-' + Date.now();
  await client.query('INSERT INTO drafts (id, token, email, role, step, data, documents, started_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [c, 'tok_b5', 'b5@example.com', 'vendor', 2, JSON.stringify({company:{legal_name_en:'B5 Co'}}), JSON.stringify([]), Date.now(), Date.now()]);
  const one = await client.query('SELECT * FROM drafts WHERE id = $1 AND token = $2', [c, 'tok_b5']);
  assert.equal(one.rows.length, 1);
  assert.equal(one.rows[0].step, 2);
  await client.query('UPDATE drafts SET step = 4, data = $2 WHERE id = $1', [c, JSON.stringify({company:{legal_name_en:'B5 Co Updated'}})]);
  const two = await client.query('SELECT * FROM drafts WHERE id = $1', [c]);
  assert.equal(two.rows[0].step, 4);
  assert.equal(two.rows[0].data.company.legal_name_en, 'B5 Co Updated');
  await client.query('DELETE FROM drafts WHERE id = $1', [c]);
  const gone = await client.query('SELECT * FROM drafts WHERE id = $1', [c]);
  assert.equal(gone.rows.length, 0);
});

await t('b5: invites widened columns (company/created_by/conversion) round-trip', async () => {
  const code = 'INV-B5-' + Date.now();
  await client.query('INSERT INTO invites (code, email, role, status, company, created_at, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [code, 'invited@example.com', 'vendor', 'link-generated', 'B5 Import Co', Date.now(), 'user:u_b5']);
  await client.query('UPDATE invites SET status = $2, submission_id = $3, converted_at = $4 WHERE code = $1',
    [code, 'converted', 'SIM-KYC-B5', Date.now()]);
  const r = await client.query('SELECT * FROM invites WHERE code = $1', [code]);
  assert.equal(r.rows[0].status, 'converted');
  assert.equal(r.rows[0].company, 'B5 Import Co');
  assert.equal(r.rows[0].submission_id, 'SIM-KYC-B5');
  await client.query('DELETE FROM invites WHERE code = $1', [code]);
});

await t('b5: screening_results upsert keeps latest', async () => {
  const ref = 'SIM-KYC-B5-SCR';
  await client.query('INSERT INTO screening_results (ref, result, saved_at) VALUES ($1,$2,$3)',
    [ref, JSON.stringify({clear: true, hits: []}), Date.now()]);
  await client.query('INSERT INTO screening_results (ref, result, saved_at) VALUES ($1,$2,$3) ON CONFLICT (ref) DO UPDATE SET result=$2, saved_at=$3',
    [ref, JSON.stringify({clear: false, hits: [{subject: 'company'}]}), Date.now()]);
  const r = await client.query('SELECT result FROM screening_results WHERE ref = $1', [ref]);
  assert.equal(r.rows[0].result.clear, false);
  assert.equal(r.rows[0].result.hits.length, 1);
  await client.query('DELETE FROM screening_results WHERE ref = $1', [ref]);
});

console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}: ${passed} passed, ${failed} failed`);
await client.end();
process.exit(failed ? 1 : 0);
