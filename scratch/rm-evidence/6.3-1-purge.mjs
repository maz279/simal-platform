// rm(6.3-1): purge e2e/probe fixtures from the MAIN database and restore the
// two blocks the fixtures overwrote (amc-tiers, nav-menus) to their seed.sql
// canonical payloads. Snapshot everything deleted/altered to rm-evidence first.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const evDir = path.join(ROOT, 'scratch', 'rm-evidence');
const seed = fs.readFileSync(path.join(ROOT, 'scripts', 'seed.sql'), 'utf8');

// Pull a content_blocks payload straight out of seed.sql (source of truth) by entity_id.
const seedPayload = (entityId) => {
  const line = seed.split(/\r?\n/).find((l) => l.includes(`'${entityId}'`) && l.startsWith('INSERT INTO content_blocks'));
  if (!line) throw new Error('seed line not found for ' + entityId);
  const start = line.indexOf("'{");
  const end = line.lastIndexOf("}'");
  if (start < 0 || end < 0) throw new Error('payload delimiters not found for ' + entityId);
  return JSON.parse(line.slice(start + 1, end + 1));
};

const c = new pg.Client({ connectionString: 'postgres://simal:[REDACTED-ROTATED-2026-10]@127.0.0.1:5433/simal' });
await c.connect();

const delBlocks = ['emergency_broadcast', 'super_admin_broadcast', 'emergency-banner', 'pricing-tiers'];
const restoreIds = ['amc-tiers', 'nav-menus'];

const snap = {
  ts: new Date().toISOString(),
  reason: 'rm(6.3-1) F-2026-N011/DAT-7 test-data purge: e2e blocks (gate-*@example.invalid), smartme.com probe banners, p4-rollback revision rows; amc-tiers + nav-menus restored to seed canonical (e2e had overwritten nav-menus label to "CMS-Driven Products 4.1")',
  deletedBlocks: [],
  deletedRevisions: [],
  restoredBefore: [],
};
for (const id of delBlocks) {
  const r = await c.query("SELECT * FROM content_blocks WHERE entity='site' AND entity_id=$1", [id]);
  snap.deletedBlocks.push(...r.rows);
}
snap.deletedRevisions = (await c.query("SELECT * FROM cms_revisions WHERE record_id LIKE '%p4-rollback-article-%'")).rows;
for (const id of restoreIds) {
  const r = await c.query("SELECT entity_id, updated_by, updated_at, payload FROM content_blocks WHERE entity='site' AND entity_id=$1", [id]);
  snap.restoredBefore.push(...r.rows);
}
fs.writeFileSync(path.join(evDir, '6.3-1-purge-snapshot.json'), JSON.stringify(snap, null, 2));
console.log('snapshot: blocks=' + snap.deletedBlocks.length + ' revisions=' + snap.deletedRevisions.length + ' restoreBefore=' + snap.restoredBefore.length);

try {
  await c.query('BEGIN');
  const d1 = await c.query("DELETE FROM content_blocks WHERE entity='site' AND entity_id = ANY($1)", [delBlocks]);
  const d2 = await c.query("DELETE FROM cms_revisions WHERE record_id LIKE '%p4-rollback-article-%'");
  const amc = seedPayload('amc-tiers');
  const nav = seedPayload('nav-menus');
  await c.query("UPDATE content_blocks SET payload=$1, updated_by='system', updated_at=$2 WHERE entity='site' AND entity_id='amc-tiers'", [JSON.stringify(amc), Date.now()]);
  await c.query("UPDATE content_blocks SET payload=$1, updated_by='system', updated_at=$2 WHERE entity='site' AND entity_id='nav-menus'", [JSON.stringify(nav), Date.now()]);
  await c.query('COMMIT');
  console.log('deleted blocks:', d1.rowCount, '| deleted revisions:', d2.rowCount);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('TX FAILED:', e.message);
  process.exit(1);
}

// verify
const left = await c.query("SELECT entity_id FROM content_blocks WHERE entity='site' AND entity_id = ANY($1)", [delBlocks]);
const navNow = await c.query("SELECT payload->'menus'->1->>'label' AS products_label, updated_by FROM content_blocks WHERE entity='site' AND entity_id='nav-menus'");
const amcNow = await c.query("SELECT payload->'head'->0 AS h0, updated_by FROM content_blocks WHERE entity='site' AND entity_id='amc-tiers'");
const revs = await c.query("SELECT COUNT(*)::int AS n FROM cms_revisions WHERE record_id LIKE '%p4-rollback-article-%'");
console.log('verify: leftover blocks=', left.rows.length, '| nav products label =', JSON.stringify(navNow.rows[0]), '| amc head =', JSON.stringify(amcNow.rows[0]), '| p4 revisions left =', revs.rows[0].n);
await c.end();
