import pg from 'pg';

const client = new pg.Client((() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })());
await client.connect();

const ann = await client.query('SELECT * FROM announcements');
const test = await client.query('SELECT * FROM testimonials');
const siteBlocks = await client.query("SELECT entity, entity_id FROM content_blocks WHERE entity = 'site' ORDER BY entity_id");
const allEntities = await client.query("SELECT entity, count(*) as count FROM content_blocks GROUP BY entity ORDER BY entity");
const revs = await client.query('SELECT * FROM cms_revisions ORDER BY id DESC LIMIT 5');
const outbox = await client.query('SELECT * FROM outbox ORDER BY id DESC LIMIT 5');
const outboxCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'outbox'");
const revCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cms_revisions'");

console.log(JSON.stringify({
  announcements: ann.rows,
  testimonials: test.rows,
  siteBlocks: siteBlocks.rows,
  entityCounts: allEntities.rows,
  recentRevisions: revs.rows,
  recentOutbox: outbox.rows,
  outboxCols: outboxCols.rows,
  revCols: revCols.rows
}, null, 2));

await client.end();
