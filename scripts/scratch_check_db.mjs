import pg from 'pg';
const { Client } = pg;
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required (rm(2.4-2): no committed fallback)'); process.exit(1); }
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const res = await c.query("SELECT conname, pg_get_constraintdef(c.oid) as def FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'content_blocks'");
console.log('content_blocks Constraints:', res.rows);
await c.end();
