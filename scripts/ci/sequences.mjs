// scripts/ci/sequences.mjs — rm(7.2-1) gate (guards DAT-6 sequence drift, check-only).
// The repair tool lives at apps/portal/tools/sync-sequences.mjs (it always setvals and
// can therefore never detect the defect it fixes); this gate runs against a FRESH
// scratch database (migrate + seed) so seed drift fails CI on day one.
//
// Rules (matching the sync tool's own semantics):
//   * serial/identity columns: expected effective value = GREATEST(COALESCE(MAX(col),0), 1)
//     — the sync tool setvals empty tables to 1, so an empty table with an untouched
//     sequence (effective 0) is ALSO drift (the migrate DAT-6 block normalizes it).
//   * standalone business sequences ref_seq/inv_seq/rfq_seq: expected = GREATEST(max
//     numeric suffix, floor) with the same floors as the sync tool (10060/5000/1000).
// Effective value of a sequence = is_called ? last_value : last_value - 1.
import { scratchDatabase, adminUrlFromEnv, pg, report, REPO } from './lib.mjs';

const explicitDb = process.env.SEQUENCES_DATABASE_URL || process.env.E2E_DATABASE_URL || null;
/* rm(security): the simal_dev fallback is gone — fail loudly without an admin URL */
const adminUrl = await adminUrlFromEnv();
if (!adminUrl) throw new Error('GATE_ADMIN_URL/ADMIN_DATABASE_URL is required (the simal_dev fallback was removed)');
const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'seq');
const URL_ = explicitDb || scratch.url;

const failures = [];
let checked = 0;
try {
  const client = new pg.Client({ connectionString: URL_ });
  await client.connect();

  // 1. every serial / identity column
  const cols = (await client.query(`
    SELECT c.relname AS tbl, a.attname AS col
    FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
      AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
    ORDER BY c.relname, a.attname
  `)).rows;

  for (const { tbl, col } of cols) {
    const seq = (await client.query(
      `SELECT pg_get_serial_sequence($1, $2) AS seq`, ['public.' + tbl, col]
    )).rows[0].seq;
    const max = Number((await client.query(
      `SELECT COALESCE(MAX(${client.escapeIdentifier(col)}), 0) AS m FROM ${client.escapeIdentifier('public')}.${client.escapeIdentifier(tbl)}`
    )).rows[0].m);
    const sv = (await client.query(`SELECT last_value, is_called FROM ${seq}`)).rows[0];
    const effective = sv.is_called ? Number(sv.last_value) : Number(sv.last_value) - 1;
    const expected = Math.max(max, 1);
    checked++;
    if (effective !== expected) {
      failures.push(`${seq} effective=${effective} but max(${tbl}.${col})=${max} (expected ${expected})`);
    }
  }

  // 2. standalone business sequences (same SUBSTRING expressions as the sync tool)
  const standalone = [
    ['ref_seq', 'submissions', 'id', 10060],
    ['inv_seq', 'invoices', 'ref', 5000],
    ['rfq_seq', 'rfqs', 'ref', 1000],
  ];
  for (const [seq, tbl, col, floor] of standalone) {
    const exists = (await client.query(
      `SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename=$1`, [seq]
    )).rows.length;
    if (!exists) continue;
    const maxSuffix = Number((await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(${col} FROM '[0-9]+$')::bigint), 0) AS m FROM ${tbl} WHERE ${col} ~ '[0-9]+$'`
    )).rows[0].m);
    const sv = (await client.query(`SELECT last_value, is_called FROM ${seq}`)).rows[0];
    const effective = sv.is_called ? Number(sv.last_value) : Number(sv.last_value) - 1;
    const expected = Math.max(maxSuffix, floor);
    checked++;
    if (effective !== expected) {
      failures.push(`${seq} effective=${effective} but max numeric suffix=${maxSuffix}, floor=${floor} (expected ${expected})`);
    }
  }

  await client.end();
} finally {
  await scratch?.drop().catch((e) => console.error('scratch db drop failed:', e.message));
}

console.log(`sequences gate: checked ${checked} sequences on ${new URL(URL_).pathname.slice(1)}${explicitDb ? ' (pinned)' : ' (fresh scratch: migrate+seed)'}`);
process.exit(report('GATE sequences (DAT-6, check-only)', failures));
