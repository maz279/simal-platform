// tools/cleanup-test-pollution.js — one-off: remove TODAY's hung integration-run
// artifacts (ws-*@example.com users, sessions, 'Workspace Test Trading'
// submissions, audit rows by/for those actors) from the live demo PG.
// Other test-named users (perf-, smoke-, sec-, it-, journey-, rbac-…) predate
// this incident and are left untouched. Dry-run by default; "apply" executes.
import pg from 'pg';

const WS_EMAILS = ['ws-admin@example.com', 'ws-reviewer@example.com', 'ws-newbie@example.com', 'ws-partner@example.com', 'ws-cust@example.com'];

const client = new pg.Client({ connectionString: (() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })() });
await client.connect();
const apply = process.argv[2] === 'apply';

const { rows: users } = await client.query('SELECT id, email, role FROM users WHERE email = ANY($1)', [WS_EMAILS]);
console.log('ws-* users:', users.map(u => u.email).join(', ') || 'none');

const { rows: subs } = await client.query(
  `SELECT id FROM submissions WHERE company->>'legal_name_en' LIKE 'Workspace Test%'`
);
console.log('ws test submissions:', subs.length);

const { rows: auditRows } = await client.query(
  `SELECT count(*)::int AS n FROM audit_log WHERE actor = ANY($1) OR target = ANY($1)`, [WS_EMAILS]
);
console.log('ws audit rows:', auditRows[0].n);

if (!apply) { console.log('DRY RUN only — pass "apply" to delete.'); await client.end(); process.exit(0); }

for (const u of users) {
  await client.query('DELETE FROM sessions WHERE user_id = $1', [u.id]);
  await client.query('DELETE FROM users WHERE id = $1', [u.id]);
}
for (const s of subs) await client.query('DELETE FROM submissions WHERE id = $1', [s.id]);
await client.query('DELETE FROM audit_log WHERE actor = ANY($1) OR target = ANY($1)', [WS_EMAILS]);

const { rows: after } = await client.query('SELECT count(*)::int AS n FROM users');
console.log('applied. users now:', after[0].n);
await client.end();
