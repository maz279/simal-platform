// scripts/ci/pg-reporting.mjs — P0-3(c) gate (guards DAT-3 / APP-1)
// Boots the portal in PostgreSQL mode against a freshly migrated+seeded
// scratch database, ages one submission past the SLA breach threshold,
// then asserts the operator features the audit found broken:
//   1. staff queue returns camelCase rows with a non-null ageDays and a
//      boolean slaBreached that actually fires,
//   2. POST /api/admin/reports/build returns 200 (not 500),
//   3. GET  /api/admin/export.csv returns 200 (not 500).
import { scratchDatabase, bootApp, login, pg, report, rand } from './lib.mjs';

const adminUrl = process.env.GATE_ADMIN_URL;
if (!adminUrl) {
  console.error('pg-reporting: set GATE_ADMIN_URL (e.g. postgres://user:pw@host:port/postgres)');
  process.exit(2);
}

const db = await scratchDatabase(adminUrl, 'pgr');
const app = await bootApp({ mode: 'pg', databaseUrl: db.url, mfa: false });
let code = 0;
try {
  /* seed.sql ships no submissions — the gate inserts one aged past the 2
     business-day SLA breach threshold so the operator features have data. */
  const client = new pg.Client({ connectionString: db.url });
  await client.connect();
  await client.query(
    `INSERT INTO submissions (id, role, status, company, tax, contacts, banking, submitted_at, updated_at)
     VALUES ($1, 'vendor', 'submitted', $2, $3, $4, $5,
             (extract(epoch from now())*1000 - 5*86400000)::BIGINT,
             (extract(epoch from now())*1000 - 5*86400000)::BIGINT)
     ON CONFLICT (id) DO NOTHING`,
    [
      'SIM-KYC-GATE-0001',
      JSON.stringify({ legal_name_en: 'Gate Reporting Trading LLC', entity_type: 'LLC', country: 'AE' }),
      JSON.stringify({ trn: '100123456700003', vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' }),
      JSON.stringify({ primary: { name: 'Gate Runner', designation: 'Owner', email: 'gate@example.invalid', mobile: '+971500000000' } }),
      JSON.stringify({ bank_name: 'Gate Bank', iban: 'AE123456789012345678901234', account_holder: 'Gate Reporting LLC', currency: 'AED' }),
    ]
  );
  await client.end();

  const cookie = await login(app.base, app.creds.adminEmail, app.creds.adminPassword);
  if (!cookie) { code = report('GATE pg-reporting (DAT-3)', ['admin login failed']); process.exit(1); }

  const failures = [];
  const q = await fetch(app.base + '/api/admin/submissions?per=5', { headers: { cookie } });
  const qd = await q.json().catch(() => ({}));
  const row = (qd.rows || [])[0];
  if (q.status !== 200) failures.push(`staff queue -> ${q.status} (expected 200)`);
  if (!row) failures.push('staff queue returned no rows (seed must supply one submission)');
  else {
    if (row.submittedAt === undefined && row.submitted_at !== undefined) {
      failures.push('snake_case leak: row carries submitted_at, not submittedAt (pg-repos camelize missing)');
    }
    if (row.ageDays === null || row.ageDays === undefined) {
      failures.push(`ageDays is ${row.ageDays} — SLA age never computed (APP-1)`);
    }
    if (row.slaBreached !== true) {
      failures.push(`slaBreached=${row.slaBreached} for a 5-day-old submission (breach never fires)`);
    }
  }

  const rep = await fetch(app.base + '/api/admin/reports/build', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ fields: ['id', 'company.legal_name_en'] }),
  });
  if (rep.status !== 200) failures.push(`reports/build -> ${rep.status} (expected 200)`);

  const csv = await fetch(app.base + '/api/admin/export.csv', { headers: { cookie } });
  if (csv.status !== 200) failures.push(`export.csv -> ${csv.status} (expected 200)`);

  code = report('GATE pg-reporting (DAT-3)', failures);
} finally {
  await app.stop();
  await db.drop().catch(() => {});
}
process.exit(code);
