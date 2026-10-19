import pg from 'pg';

async function run() {
  const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
  const pool = new pg.Pool({ connectionString });

  console.log(`Connecting to database to synchronize sequences safely...`);

  // PL/pgSQL block that safely inspects all serial/identity sequences using pg_get_serial_sequence
  // and format('%I', ...) for SQL-injection proof execution.
  const syncSerialSql = `
    DO $$
    DECLARE
        r RECORD;
        v_seq TEXT;
        v_max BIGINT;
    BEGIN
        FOR r IN (
            SELECT c.relname AS tbl, a.attname AS col
            FROM pg_class c
            JOIN pg_attribute a ON a.attrelid = c.oid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND a.attnum > 0
              AND NOT a.attisdropped
              AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
        ) LOOP
            v_seq := pg_get_serial_sequence(quote_ident('public') || '.' || quote_ident(r.tbl), r.col);
            IF v_seq IS NOT NULL THEN
                EXECUTE format('SELECT COALESCE(MAX(%I), 1) FROM %I', r.col, r.tbl) INTO v_max;
                PERFORM setval(v_seq, v_max, true);
                RAISE NOTICE 'Synchronized sequence % on %.% to %', v_seq, r.tbl, r.col, v_max;
            END IF;
        END LOOP;
    END;
    $$;
  `;

  await pool.query(syncSerialSql);
  console.log('Successfully synchronized all table serial sequences.');

  // Standalone sequences synchronization (ref_seq, inv_seq, rfq_seq)
  const syncStandaloneSql = `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ref_seq') THEN
        PERFORM setval('ref_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(id FROM '[0-9]+$')::bigint), 10060) FROM submissions WHERE id ~ '[0-9]+$'), 10060), true);
        RAISE NOTICE 'Synchronized ref_seq';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'inv_seq') THEN
        PERFORM setval('inv_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(ref FROM '[0-9]+$')::bigint), 5000) FROM invoices WHERE ref ~ '[0-9]+$'), 5000), true);
        RAISE NOTICE 'Synchronized inv_seq';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'rfq_seq') THEN
        PERFORM setval('rfq_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(ref FROM '[0-9]+$')::bigint), 1000) FROM rfqs WHERE ref ~ '[0-9]+$'), 1000), true);
        RAISE NOTICE 'Synchronized rfq_seq';
      END IF;
    END;
    $$;
  `;

  await pool.query(syncStandaloneSql);
  console.log('Successfully synchronized standalone business sequences (ref_seq, inv_seq, rfq_seq).');

  const report = await pool.query(`
    SELECT sequencename, last_value 
    FROM pg_sequences 
    WHERE schemaname = 'public'
    ORDER BY sequencename;
  `);
  console.log('Current sequences status:');
  for (const row of report.rows) {
    console.log(` - ${row.sequencename}: ${row.last_value}`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Sequence synchronization failed:', err);
  process.exit(1);
});
