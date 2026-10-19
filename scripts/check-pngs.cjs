const pg = require('pg');
async function run() {
  const c = new pg.Client((() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })());
  await c.connect();
  const r = await c.query("SELECT slug, name, imgs FROM products WHERE imgs::text LIKE '%.png%'");
  console.log(`Found ${r.rows.length} products with PNG:`);
  for (const row of r.rows) {
    console.log(`- ${row.slug}: ${row.name} (${row.imgs[0]})`);
  }
  await c.end();
}
run();
