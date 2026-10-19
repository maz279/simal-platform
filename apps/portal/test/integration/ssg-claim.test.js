// deploy-audit H6: concurrent workers can never claim the same SSG build job, and a claim
// abandoned by a dead worker returns to the queue. Scratch database; skips without PostgreSQL.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';
import { claimNextSsgJob, requeueStaleClaims, STALE_CLAIM_MS } from '../../src/lib/ssg-claim.js';

const adminUrl = await adminUrlFromEnv();
const pgUp = await pgReachable(adminUrl);

test('SSG job claim on PostgreSQL', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = await scratchDatabase(adminUrl, 'claim');
  const pool = new pg.Pool({ connectionString: scratch.url, max: 8 });
  try {
    await pool.query("DELETE FROM outbox WHERE to_addr = 'ssg-builder'");
    const ins = (id, at) => pool.query("INSERT INTO outbox (id, channel, to_addr, subject, body, status, meta, created_at) VALUES ($1, 'cms', 'ssg-builder', 'publish', '{}', 'queued', '{}', $2)", [id, at]);
    for (let i = 0; i < 3; i++) await ins('job' + i, 1000 + i);

    await t.test('8 concurrent workers: each of 3 jobs is claimed exactly once, oldest first', async () => {
      const got = await Promise.all(Array.from({ length: 8 }, () => claimNextSsgJob(pool)));
      const ids = got.filter(Boolean).map((j) => j.id).sort();
      assert.deepEqual(ids, ['job0', 'job1', 'job2']);
      const { rows } = await pool.query("SELECT status, count(*)::int AS n FROM outbox WHERE to_addr = 'ssg-builder' GROUP BY status");
      assert.deepEqual(rows, [{ status: 'processing', n: 3 }]);
    });

    await t.test('a fresh claim stays put; an abandoned one is requeued and claimable again', async () => {
      assert.equal(await requeueStaleClaims(pool), 0, 'live claims are not stolen');
      assert.equal(await requeueStaleClaims(pool, Date.now() + STALE_CLAIM_MS + 1000), 3);
      assert.equal((await claimNextSsgJob(pool)).id, 'job0');
    });
  } finally {
    await pool.end();
    await scratch.drop();
  }
});
