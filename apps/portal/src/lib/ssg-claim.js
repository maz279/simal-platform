/* ssg-claim.js — claiming SSG build jobs from the outbox (rm 5.1-1, deploy-audit H6).
 * The claim used to be a bare SELECT … FOR UPDATE SKIP LOCKED in autocommit: the row lock ended
 * with the statement, so two workers (duplicate instances, a restart window) could both build
 * the same job. One UPDATE … WHERE id = (SELECT … SKIP LOCKED) RETURNING is atomic: exactly
 * one caller moves a row from 'queued' to 'processing'. */
export const STALE_CLAIM_MS = 10 * 60 * 1000; // builds time out at 2 min; a claim this old lost its worker

/** a claim whose worker died (crash, kill during a build) goes back to the queue */
export async function requeueStaleClaims(client, now = Date.now()) {
  const r = await client.query(
    "UPDATE outbox SET status = 'queued' WHERE to_addr = 'ssg-builder' AND status = 'processing' AND COALESCE((meta->>'claimedAt')::bigint, 0) < $1",
    [now - STALE_CLAIM_MS]
  );
  return r.rowCount || 0;
}

/** the oldest queued build job, now owned by this caller — or null */
export async function claimNextSsgJob(client, now = Date.now()) {
  const r = await client.query(
    "UPDATE outbox SET status = 'processing', meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('claimedAt', $1::bigint) " +
    "WHERE id = (SELECT id FROM outbox WHERE to_addr = 'ssg-builder' AND status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) " +
    'RETURNING id, body',
    [now]
  );
  return r.rows[0] || null;
}
