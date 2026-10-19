/* db.ts — PostgreSQL query helper for Astro SSG.
 * Uses pg Pool with parameterized queries for safe concurrent execution.
 * Connection string from DATABASE_URL env var.
 *
 * F-2026-N01 / R-2: production builds (NODE_ENV=production — always set by the portal's
 * SSG worker) MUST NOT fall back to a hardcoded credential. The worker injects the
 * read-only simal_build role via BUILD_DATABASE_URL; manual/CI builds set DATABASE_URL
 * themselves. Only the dev server (NODE_ENV unset or 'development') may use the dev
 * fallback.
 */
import pg from 'pg';

const isProd = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL
  || null; /* rm(security): the non-prod simal_dev fallback is gone — every env passes DATABASE_URL */
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required for SSG builds (NODE_ENV=production): ' +
    'the portal worker injects the read-only build role via BUILD_DATABASE_URL; ' +
    'manual builds must export DATABASE_URL (e.g. the simal_build role).'
  );
}

const pool = new pg.Pool({
  connectionString,
  max: 15,
  idleTimeoutMillis: 30000,
});

/**
 * Tagged template literal for safe parameterized queries.
 * Usage: await db`SELECT * FROM products WHERE slug = ${slug}`
 */
export async function db(strings: TemplateStringsArray, ...values: unknown[]) {
  let sql = '';
  for (let i = 0; i < strings.length; i++) {
    sql += strings[i];
    if (i < values.length) sql += `$${i + 1}`;
  }
  const r = await pool.query(sql, values);
  return r.rows;
}
