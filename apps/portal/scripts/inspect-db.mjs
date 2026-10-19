import pg from 'pg';

const c = new pg.Client((() => { if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)'); return process.env.DATABASE_URL; })());
await c.connect();
const res = await c.query("SELECT id, email, password_hash, totp_secret, active FROM users WHERE email IN ('admin@smartme.com', 'admin@simalme.com')");
console.log(res.rows);
await c.end();
