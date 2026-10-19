// scripts/dr-drill.mjs — NFR-2 / P8-7 Disaster Recovery & Backup Restore Drill
// rm(10.2-2) rewrite: every previous result was hardcoded or unmeasurable.
//   * URLs come from the ENVIRONMENT first (DATABASE_URL / ADMIN_DATABASE_URL),
//     then apps/portal/.env (guarded read — the file is git-ignored).
//   * The snapshot is taken inside ONE REPEATABLE READ transaction, so the row
//     counts, checksums and data actually describe a single point in time.
//   * RPO is MEASURED: the gap between the restore point (snapshot end) and the
//     simulated disaster instant, from the database clock — not a literal 0.
//   * RTO is MEASURED: disaster → verified restore, and PASS is computed against
//     the targets (RPO ≤ 1 h, RTO ≤ 4 h), never templated text.
//   * Integrity is row counts AND a per-table content checksum over the
//     CANONICAL row JSON (to_jsonb canonicalises key order; row_to_json emits
//     physical column order, which differs between a long-lived ALTERed schema
//     and a fresh migrate.sql — a false mismatch), so equal counts with
//     different values still fail.
//   * Backups are written OUTSIDE the repo (DR_BACKUP_DIR or the OS temp dir) —
//     a PII dump must never land in the tree.
//   * docs/DR_DRILL_EVIDENCE.md is APPENDED to, never overwritten.
//   * The recovery database is dropped in a finally block, even on failure.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/* rm(10.2-2): temporal types come back as RAW TEXT, never JS Date. A 'date'
 * parses to local midnight, so toISOString() in a non-UTC session shifts the
 * day (the rig runs Asia/Kuala_Lumpur: 2026-10-13 became 2026-10-12). Text
 * round-trips exactly, including microsecond timestamps. */
for (const oid of [1082, 1083, 1114, 1184]) pg.types.setTypeParser(oid, (v) => v);

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readPortalEnv() {
  try {
    const txt = fs.readFileSync(path.join(REPO, 'apps/portal/.env'), 'utf8');
    const out = {};
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch { return {}; }
}
const dotenv = readPortalEnv();
const PRIMARY_DB_URL = process.env.DATABASE_URL || dotenv.DATABASE_URL;
if (!PRIMARY_DB_URL) { console.error('dr-drill: no DATABASE_URL (env or apps/portal/.env)'); process.exit(2); }
const ADMIN_SOURCE = process.env.ADMIN_DATABASE_URL || dotenv.ADMIN_DATABASE_URL || PRIMARY_DB_URL;
const parsed = new URL(PRIMARY_DB_URL);
const adminUrl = new URL(ADMIN_SOURCE);
adminUrl.pathname = '/postgres';

const RUN = new Date().toISOString().replace(/[:.]/g, '-');
const RECOVERY_DB_NAME = 'simal_dr_recovery_' + Date.now().toString(36);
const backupDir = process.env.DR_BACKUP_DIR || path.join(os.tmpdir(), 'simal-dr-backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupFile = path.join(backupDir, `dr_drill_${RUN}.sql`);
const RPO_TARGET_SEC = Number(process.env.DR_RPO_TARGET_SEC || 3600);   // 1 h
const RTO_TARGET_SEC = Number(process.env.DR_RTO_TARGET_SEC || 14400);  // 4 h

console.log('=== Disaster Recovery & Backup Restore Drill (NFR-2 / P8-7) ===');
console.log(`Source database: ${parsed.pathname.slice(1)} on ${parsed.host} (${parsed.username})`);
console.log(`Recovery database: ${RECOVERY_DB_NAME} (via ${adminUrl.username}@${adminUrl.host})`);
console.log(`Backup file: ${backupFile} (outside the repo)\n`);

const tStart = Date.now();
let primary, recovery, admin;
let dbCreated = false;
let result;

try {
  /* ---- 1. point-in-time snapshot (one repeatable-read read-only txn) ---- */
  primary = new pg.Client({ connectionString: PRIMARY_DB_URL });
  await primary.connect();
  await primary.query("SET TIME ZONE 'UTC'");
  await primary.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const clockQ = 'SELECT now()::text AS t, (extract(epoch from now())*1000)::double precision AS ms';
  const snapshotStartedAt = (await primary.query(clockQ)).rows[0];

  const TABLES = (await primary.query(`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name
  `)).rows.map((r) => r.table_name);
  if (!TABLES.length) throw new Error('no base tables found — is this the app database?');

  console.log(`1. Snapshot started at ${snapshotStartedAt.t} — ${TABLES.length} tables`);
  const primaryCounts = {}, primaryChecksums = {};
  for (const t of TABLES) {
    primaryCounts[t] = (await primary.query(`SELECT count(*)::int AS n FROM "${t}"`)).rows[0].n;
    primaryChecksums[t] = (await primary.query(
      `SELECT md5(COALESCE(string_agg(x, '|' ORDER BY x), '')) AS h FROM (SELECT to_jsonb(t)::text AS x FROM "${t}" t) s`
    )).rows[0].h;
  }
  console.log(`   rows: ${Object.values(primaryCounts).reduce((a, b) => a + b, 0)} · checksums: ${TABLES.length}/${TABLES.length} captured`);

  const colMeta = (await primary.query(`
    SELECT table_name, column_name, data_type, is_generated
      FROM information_schema.columns WHERE table_schema = 'public'
  `)).rows;
  const jsonColumns = {}, generatedColumns = {};
  for (const c of colMeta) {
    if (['json', 'jsonb'].includes(c.data_type)) (jsonColumns[c.table_name] ||= new Set()).add(c.column_name);
    if (c.is_generated === 'ALWAYS') (generatedColumns[c.table_name] ||= new Set()).add(c.column_name);
  }

  /* ---- 2. serialise the snapshot (still inside the same txn) ---- */
  const tBackupStart = Date.now();
  const migrateSql = fs.readFileSync(path.join(REPO, 'scripts', 'migrate.sql'), 'utf8');
  const snapshotRows = {};
  for (const t of TABLES) snapshotRows[t] = (await primary.query(`SELECT * FROM "${t}"`)).rows;
  const snapshotEndedAt = (await primary.query(clockQ)).rows[0];
  await primary.query('COMMIT');

  const insertStatements = [];
  for (const t of TABLES) for (const row of snapshotRows[t]) {
    const keys = Object.keys(row).filter((k) => !generatedColumns[t]?.has(k));
    const cols = keys.map((c) => `"${c}"`).join(', ');
    const vals = keys.map((c) => {
      const v = row[c];
      if (v === null) return 'NULL';
      if (jsonColumns[t]?.has(c) || (typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)))
        return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      if (typeof v === 'number') return String(v);
      if (v instanceof Date) return `'${v.toISOString()}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(', ');
    insertStatements.push(`INSERT INTO "${t}" (${cols}) VALUES (${vals});`);
  }
  const fullDumpSql = [
    '-- Simal DR snapshot (rm(10.2-2): point-in-time, repeatable read)',
    `-- snapshot window: ${snapshotStartedAt.t} .. ${snapshotEndedAt.t}`,
    migrateSql,
    "SET session_replication_role = 'replica';",
    ...TABLES.map((t) => `TRUNCATE TABLE "${t}" CASCADE;`),
    ...insertStatements,
    "SET session_replication_role = 'origin';",
  ].join('\n');
  fs.writeFileSync(backupFile, fullDumpSql, 'utf8');
  const backupDurationMs = Date.now() - tBackupStart;
  console.log(`2. Snapshot written: ${(Buffer.byteLength(fullDumpSql) / 1024).toFixed(1)} KB, ${insertStatements.length} rows, ${backupDurationMs} ms`);

  /* ---- 3. simulated disaster instant (database clock) ---- */
  const disasterAt = (await primary.query(clockQ)).rows[0];
  const rpoAchievedSec = Math.max(0, (disasterAt.ms - snapshotEndedAt.ms) / 1000);
  console.log(`3. Disaster simulated at ${disasterAt.t} — restore point is ${rpoAchievedSec.toFixed(3)} s old (measured RPO window)`);

  /* ---- 4. provision + restore into an isolated database (admin role) ---- */
  admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${RECOVERY_DB_NAME}"`);
  await admin.query(`CREATE DATABASE "${RECOVERY_DB_NAME}"`);
  dbCreated = true;
  const tRestoreStart = Date.now();
  const recoveryUrl = new URL(adminUrl.toString());
  recoveryUrl.pathname = '/' + RECOVERY_DB_NAME;
  recovery = new pg.Client({ connectionString: recoveryUrl.toString() });
  await recovery.connect();
  await recovery.query("SET TIME ZONE 'UTC'");
  await recovery.query(migrateSql);
  for (const t of TABLES) await recovery.query(`TRUNCATE TABLE "${t}" CASCADE;`);
  await recovery.query("SET session_replication_role = 'replica';");
  for (const t of TABLES) {
    const rows = snapshotRows[t];
    if (!rows.length) continue;
    const keys = Object.keys(rows[0]).filter((k) => !generatedColumns[t]?.has(k));
    const cols = keys.map((c) => `"${c}"`).join(', ');
    const ph = keys.map((_, i) => `$${i + 1}`).join(', ');
    const text = `INSERT INTO "${t}" (${cols}) VALUES (${ph});`;
    for (const row of rows) {
      const vals = keys.map((k) => {
        const v = row[k];
        if (v === null) return null;
        if (jsonColumns[t]?.has(k)) return JSON.stringify(v);
        if (typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)) return JSON.stringify(v);
        return v;
      });
      await recovery.query(text, vals);
    }
  }
  await recovery.query("SET session_replication_role = 'origin';");
  const seqs = (await recovery.query(`
    SELECT table_name, column_name, pg_get_serial_sequence(table_name, column_name) AS seq
      FROM information_schema.columns
     WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
  `)).rows;
  for (const s of seqs) if (s.seq)
    await recovery.query(`SELECT setval('${s.seq}', COALESCE((SELECT MAX("${s.column_name}") FROM "${s.table_name}"), 1))`);
  const restoreDurationMs = Date.now() - tRestoreStart;
  console.log(`4. Restored into ${RECOVERY_DB_NAME} in ${restoreDurationMs} ms`);

  /* ---- 5. verify counts + content checksums ---- */
  console.log('5. Verifying restored integrity (row counts + md5 content checksums)…');
  const recoveryCounts = {}, recoveryChecksums = {};
  const mismatches = [];
  for (const t of TABLES) {
    recoveryCounts[t] = (await recovery.query(`SELECT count(*)::int AS n FROM "${t}"`)).rows[0].n;
    recoveryChecksums[t] = (await recovery.query(
      `SELECT md5(COALESCE(string_agg(x, '|' ORDER BY x), '')) AS h FROM (SELECT to_jsonb(t)::text AS x FROM "${t}" t) s`
    )).rows[0].h;
    if (recoveryCounts[t] !== primaryCounts[t]) mismatches.push(`${t}: rows ${recoveryCounts[t]} != ${primaryCounts[t]}`);
    if (recoveryChecksums[t] !== primaryChecksums[t]) mismatches.push(`${t}: CONTENT CHECKSUM differs`);
  }
  const verifiedAt = (await recovery.query(clockQ)).rows[0];
  const integrityOk = mismatches.length === 0;

  const rtoAchievedSec = (verifiedAt.ms - disasterAt.ms) / 1000;   /* disaster -> verified restore, DB clocks */
  const totalDurationMs = Date.now() - tStart;
  const rpoOk = rpoAchievedSec <= RPO_TARGET_SEC;
  const rtoOk = rtoAchievedSec <= RTO_TARGET_SEC;
  const pass = integrityOk && rpoOk && rtoOk;

  console.log('\n=== DR DRILL RESULTS ===');
  console.log(`Integrity (row counts + content checksums): ${integrityOk ? 'PASS' : 'FAIL'}`);
  if (!integrityOk) mismatches.forEach((m) => console.log('  - ' + m));
  console.log(`Measured RTO: ${rtoAchievedSec.toFixed(2)} s (target ≤ ${RTO_TARGET_SEC} s) → ${rtoOk ? 'PASS' : 'FAIL'}`);
  console.log(`Measured RPO: ${rpoAchievedSec.toFixed(3)} s (target ≤ ${RPO_TARGET_SEC} s) → ${rpoOk ? 'PASS' : 'FAIL'}`);
  console.log(`Overall: ${pass ? 'PASS' : 'FAIL'}`);

  result = {
    runAt: RUN, pass, integrityOk, mismatches, rtoAchievedSec, rpoAchievedSec,
    rtoTargetSec: RTO_TARGET_SEC, rpoTargetSec: RPO_TARGET_SEC,
    snapshotStartedAt: snapshotStartedAt.t, snapshotEndedAt: snapshotEndedAt.t,
    disasterAt: disasterAt.t, verifiedAt: verifiedAt.t,
    backupDurationMs, restoreDurationMs, totalDurationMs, tables: TABLES.length,
    rows: Object.values(primaryCounts).reduce((a, b) => a + b, 0),
    tableCounts: primaryCounts, recoveryCounts, backupFile,
  };

  /* ---- 6. append the evidence doc (never overwrite) ---- */
  const evidence = `
---

## Run ${RUN} — ${pass ? 'PASS' : 'FAIL'}

- **Source:** \`${parsed.pathname.slice(1)}\` on \`${parsed.host}\` as \`${parsed.username}\`
- **Restore target:** \`${RECOVERY_DB_NAME}\` (created and dropped by the \`${adminUrl.username}\` admin role)
- **Snapshot:** repeatable-read transaction ${snapshotStartedAt.t} → ${snapshotEndedAt.t}
- **Backup artifact:** \`${backupFile}\` (outside the repository; PII never committed)
- **Disaster simulated:** ${disasterAt.t} · **Restore verified:** ${verifiedAt.t}

| Metric | Achieved | Target | Result |
|:---|:---:|:---:|:---:|
| RTO (disaster → verified restore) | ${rtoAchievedSec.toFixed(2)} s | ≤ ${RTO_TARGET_SEC} s | ${rtoOk ? 'PASS' : 'FAIL'} |
| RPO (restore point age at disaster, measured) | ${rpoAchievedSec.toFixed(3)} s | ≤ ${RPO_TARGET_SEC} s | ${rpoOk ? 'PASS' : 'FAIL'} |
| Integrity (${TABLES.length} tables, row counts + md5 content checksums) | ${integrityOk ? 'identical' : 'MISMATCH'} | identical | ${integrityOk ? 'PASS' : 'FAIL'} |

| Phase | Duration |
|:---|:---:|
| Snapshot serialisation | ${backupDurationMs} ms |
| Restore execution | ${restoreDurationMs} ms |
| Total drill (incl. verification) | ${totalDurationMs} ms |

${mismatches.length ? '**Mismatches:**\n' + mismatches.map((m) => '- ' + m).join('\n') + '\n' : ''}**Rows restored:** ${result.rows} across ${TABLES.length} tables.
`;
  fs.appendFileSync(path.join(REPO, 'docs/DR_DRILL_EVIDENCE.md'), evidence, 'utf8');
  fs.writeFileSync(path.join(backupDir, `dr_drill_${RUN}.json`), JSON.stringify(result, null, 2));
  console.log(`Evidence appended to docs/DR_DRILL_EVIDENCE.md · summary: ${path.join(backupDir, `dr_drill_${RUN}.json`)}`);

  /* ---- 7. teardown ---- */
  await recovery.end().catch(() => {});
  await admin.query(`DROP DATABASE IF EXISTS "${RECOVERY_DB_NAME}"`).catch((e) => console.error('drop recovery db failed:', e.message));
  dbCreated = false;
  await admin.end().catch(() => {});
  await primary.end().catch(() => {});
  console.log('DR DRILL ' + (pass ? 'COMPLETED SUCCESSFULLY.' : 'FAILED.'));
  process.exit(pass ? 0 : 1);
} catch (err) {
  console.error('DR DRILL ERROR:', err.message);
  process.exit(2);
} finally {
  /* never leak a recovery database, even on an exception */
  if (dbCreated && admin) {
    try { await admin.query(`DROP DATABASE IF EXISTS "${RECOVERY_DB_NAME}"`); } catch { /* best effort */ }
  }
  for (const c of [recovery, admin, primary]) { try { await c?.end(); } catch { /* closed */ } }
}
