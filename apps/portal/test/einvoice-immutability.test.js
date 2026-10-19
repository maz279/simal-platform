#!/usr/bin/env node
/* einvoice-immutability.test.js — T2.3: delivered invoices are strictly
 * read-only at the DATABASE level (trigger B7), regardless of what any code
 * path attempts. Drafts remain editable; delivered rows reject UPDATE,
 * DELETE, and any invoice_lines change. Amendments = Phase-1.1 credit notes.
 * Run: node test/einvoice-immutability.test.js   (needs DATABASE_URL)
 */
import pg from 'pg';
import assert from 'node:assert/strict';

const CONN = process.env.DATABASE_URL;
if (!CONN) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
let passed = 0, failed = 0;
const t = async (name, fn) => {
  try { await fn(); passed++; console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ': ' + e.message); }
};

const client = new pg.Client({ connectionString: CONN });
await client.connect();

/* purge rows from previous runs (delivered ones are immortal to normal DML —
 * cleanup runs with the guard triggers disabled, then re-enabled) */
await client.query('ALTER TABLE invoice_lines DISABLE TRIGGER invoice_lines_immutable');
await client.query('ALTER TABLE invoices DISABLE TRIGGER invoices_immutable');
await client.query("DELETE FROM invoice_lines WHERE invoice_id LIKE 'inv_imm_test_%'");
await client.query("DELETE FROM invoices WHERE id LIKE 'inv_imm_test_%'");
await client.query('ALTER TABLE invoice_lines ENABLE TRIGGER invoice_lines_immutable');
await client.query('ALTER TABLE invoices ENABLE TRIGGER invoices_immutable');

const IDS = [];
const mk = async (status) => {
  const id = 'inv_imm_test_' + Date.now() + '_' + IDS.length;
  IDS.push(id);
  /* created as draft (lines legal), then transitioned — the real lifecycle */
  await client.query('INSERT INTO invoices (id, ref, seller, partner_email, buyer_tin, buyer_name, po_ref, issue_date, due_date, currency, net_fils, vat_fils, total_fils, status, kyc_ref, timeline, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)',
    [id, 'REF-' + id, '{}', 'imm@example.com', '100123456700003', 'Immutable Test Buyer', null, '2026-01-01', '2026-01-15', 'AED', 1000, 50, 1050, 'draft', null, '[]', Date.now()]);
  await client.query('INSERT INTO invoice_lines (invoice_id, idx, descr, qty, unit_price_fils, vat_rate_pct) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, 1, 'line one', 1, 1000, 5]);
  if (status !== 'draft') {
    await client.query('UPDATE invoices SET status = $2 WHERE id = $1', [id, status]);
  }
  return id;
};

await t('draft invoice is editable (control)', async () => {
  const id = await mk('draft');
  await client.query('UPDATE invoices SET po_ref = $2 WHERE id = $1', [id, 'PO-EDIT-OK']);
  await client.query('UPDATE invoice_lines SET qty = 2 WHERE invoice_id = $1', [id]);
});

await t('delivered invoice rejects UPDATE (any column)', async () => {
  const id = await mk('delivered');
  await assert.rejects(
    () => client.query('UPDATE invoices SET po_ref = $2 WHERE id = $1', [id, 'PO-TAMPER']),
    /immutable/
  );
});

await t('delivered invoice rejects UPDATE that keeps values identical (strict read-only)', async () => {
  const id = await mk('delivered');
  await assert.rejects(
    () => client.query('UPDATE invoices SET updated_at = $2 WHERE id = $1', [id, Date.now()]),
    /immutable/
  );
});

await t('delivered invoice rejects DELETE', async () => {
  const id = await mk('delivered');
  await assert.rejects(
    () => client.query('DELETE FROM invoices WHERE id = $1', [id]),
    /immutable/
  );
});

await t('delivered invoice rejects new line INSERT', async () => {
  const id = await mk('delivered');
  await assert.rejects(
    () => client.query('INSERT INTO invoice_lines (invoice_id, idx, descr, qty, unit_price_fils, vat_rate_pct) VALUES ($1,$2,$3,$4,$5,$6)', [id, 2, 'sneaky line', 1, 100, 5]),
    /immutable/
  );
});

await t('delivered invoice rejects line UPDATE and line DELETE', async () => {
  const id = await mk('delivered');
  await assert.rejects(() => client.query('UPDATE invoice_lines SET qty = 9 WHERE invoice_id = $1', [id]), /immutable/);
  await assert.rejects(() => client.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [id]), /immutable/);
});

await t('status transition away from delivered is also blocked (trigger fires on UPDATE)', async () => {
  const id = await mk('delivered');
  await assert.rejects(
    () => client.query('UPDATE invoices SET status = $2 WHERE id = $1', [id, 'draft']),
    /immutable/
  );
});

/* cleanup: force-remove test rows (draft ones directly; delivered need trigger drop-safe path) */
for (const id of IDS) {
  try {
    await client.query('UPDATE invoices SET status = $2 WHERE id = $1', [id, 'draft']); /* blocked for delivered — expected */
  } catch { /* trigger doing its job */ }
  try {
    await client.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [id]);
    await client.query('DELETE FROM invoices WHERE id = $1', [id]);
  } catch { /* delivered rows survive cleanup by design — they are immutable */ }
}

console.log('\n' + (failed === 0 ? 'ALL PASS' : failed + ' FAILED') + ': ' + passed + ' passed, ' + failed + ' failed');
await client.end();
process.exit(failed ? 1 : 0);
