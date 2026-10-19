import { Client } from 'pg';
import fs from 'node:fs';

async function main() {
  const c = new Client({ connectionString: (() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })() });
  await c.connect();
  const legacyEmails = ['admin@simalme.com', 'reviewer@simalme.com', 'mfa.demo@simalme.com', 'partner@simalme.com'];
  
  // Find user IDs for legacy emails
  const r = await c.query("SELECT id FROM users WHERE email IN ('admin@simalme.com', 'reviewer@simalme.com', 'mfa.demo@simalme.com', 'partner@simalme.com')");
  const ids = r.rows.map(x => x.id);
  console.log('Found legacy Postgres user IDs:', ids);

  if (ids.length > 0) {
    const sDel = await c.query("DELETE FROM sessions WHERE user_id = ANY($1::text[])", [ids]);
    console.log('Deleted legacy sessions from Postgres:', sDel.rowCount);
    const uDel = await c.query("DELETE FROM users WHERE id = ANY($1::text[])", [ids]);
    console.log('Deleted legacy users from Postgres:', uDel.rowCount);
  }

  await c.end();

  const p = 'portal/data/db.json';
  if (fs.existsSync(p)) {
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const before = d.users.length;
    d.users = d.users.filter(u => !legacyEmails.includes(u.email));
    if (d.sessions) {
      d.sessions = d.sessions.filter(s => !ids.includes(s.userId));
    }
    if (d.mfaChallenges) {
      d.mfaChallenges = d.mfaChallenges.filter(mc => !ids.includes(mc.userId));
    }
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    console.log('Removed from db.json:', before - d.users.length);
  }
}

main().then(() => {
  console.log('Cleanup completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
