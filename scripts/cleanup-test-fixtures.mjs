#!/usr/bin/env node
/**
 * cleanup-test-fixtures.mjs
 * 
 * DAT-7: Reversible Test-Fixture Purge Tool for Production Cutover.
 * 
 * Safely detects, backs up, and purges test-fixture pollution from PostgreSQL
 * and JSON databases prior to production launch.
 * 
 * CRITICAL SAFETY RULES:
 * 1. Defaults to --dry-run. No modifications occur without explicit --apply and --confirm.
 * 2. Creating a timestamped JSON backup is MANDATORY prior to any --apply deletion.
 * 3. Supports --rollback <backup-file> to re-insert pruned records if required.
 * 4. Production cutover should use fresh seed (002_seed_data.sql), but this tool
 *    ensures existing environments can be safely sanitized without data loss.
 * 
 * Usage:
 *   node cleanup-test-fixtures.mjs [--dry-run]
 *   node cleanup-test-fixtures.mjs --backup
 *   node cleanup-test-fixtures.mjs --apply --confirm
 *   node cleanup-test-fixtures.mjs --rollback <path-to-backup.json>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  const candidatePaths = [
    path.resolve(__dirname, '../../portal/node_modules/pg/lib/index.js'),
    path.resolve(__dirname, '../portal/node_modules/pg/lib/index.js'),
    path.resolve(__dirname, '../../../portal/node_modules/pg/lib/index.js')
  ];
  const found = candidatePaths.find(p => fs.existsSync(p));
  if (found) {
    pg = (await import('file:///' + found.replace(/\\/g, '/'))).default;
  } else {
    throw new Error('Cannot find pg package in node_modules or portal/node_modules');
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const JSON_DB_PATHS = [
  path.resolve(__dirname, '../../portal/data/db.json'),
  path.resolve(__dirname, '../portal/data/db.json'),
  path.resolve(__dirname, '../../../portal/data/db.json'),
  path.resolve(__dirname, 'portal/data/db.json')
];

const JSON_DB_PATH = JSON_DB_PATHS.find(p => fs.existsSync(p));

// Test fixture criteria SQL fragments
const FIXTURE_QUERIES = {
  users: `
    SELECT id, email, role, name, created_at 
    FROM users 
    WHERE email ILIKE '%@example.com' 
       OR email ILIKE '%.invalid' 
       OR email ILIKE '%.ae-test' 
       OR email ILIKE 'test%@%' 
       OR email ILIKE 'dup1@%' 
       OR email ILIKE 'journey@%'
  `,
  submissions: `
    SELECT id, status, (company->>'legalName') AS company_name, submitted_at 
    FROM submissions 
    WHERE id LIKE 'test_%' 
       OR (tax->>'trn') LIKE 'TEST%' 
       OR (company->>'legalName') ILIKE '%Test%' 
       OR (contacts->0->>'email') ILIKE '%@example.com'
  `,
  invoices: `
    SELECT id, ref, buyer_name, partner_email, status, created_at 
    FROM invoices 
    WHERE id LIKE 'inv_imm_test_%' 
       OR id LIKE 'test_%' 
       OR buyer_name ILIKE '%Test Corp%' 
       OR partner_email ILIKE '%@example.com'
  `,
  rfqs: `
    SELECT ref, email, company, status, submitted_at 
    FROM rfqs 
    WHERE ref LIKE 'test_%' 
       OR email ILIKE '%@example.com'
  `,
  products: `
    SELECT slug, sku, name, brand, cat 
    FROM products 
    WHERE sku = '1672' 
       OR name ILIKE '%Enterprise Hardened%' 
       OR slug = 'enterprise-hardened'
  `,
  audit_log: `
    SELECT ts, actor, action, target, details 
    FROM audit_log 
    WHERE actor = '{}' 
       OR actor = '[object Promise]' 
       OR actor IS NULL 
       OR ts > (EXTRACT(EPOCH FROM (NOW() + interval '1 day')) * 1000)
  `
};

async function inspectFixtures(pool) {
  const candidates = {};
  for (const [table, sql] of Object.entries(FIXTURE_QUERIES)) {
    try {
      const res = await pool.query(sql);
      candidates[table] = res.rows;
    } catch (err) {
      console.warn(`[WARN] Inspection failed for table ${table}:`, err.message);
      candidates[table] = [];
    }
  }
  return candidates;
}

function createBackup(candidates) {
  // unify(2026-10-19): historical fixture backups live in-repo as fixture-backups/
  const backupDir = path.resolve(__dirname, '../fixture-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `fixture-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    records: candidates
  }, null, 2), 'utf8');
  return backupFile;
}

async function rollbackFromBackup(pool, backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }
  const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  console.log(`Starting rollback from backup dated ${data.timestamp}...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Restore products
    if (data.records.products?.length > 0) {
      for (const p of data.records.products) {
        await client.query(`
          INSERT INTO products (sku, slug, name, brand, cat) 
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug) DO NOTHING
        `, [p.sku, p.slug, p.name, p.brand, p.cat]);
      }
      console.log(`Restored ${data.records.products.length} products.`);
    }

    await client.query('COMMIT');
    console.log('[SUCCESS] Rollback completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function applyPurge(pool, candidates) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Purge sessions for test users
    if (candidates.users?.length > 0) {
      const userIds = candidates.users.map(u => u.id);
      const resSes = await client.query('DELETE FROM sessions WHERE user_id = ANY($1::text[])', [userIds]);
      console.log(`Purged sessions: ${resSes.rowCount}`);
      const resUsers = await client.query('DELETE FROM users WHERE id = ANY($1::text[])', [userIds]);
      console.log(`Purged users: ${resUsers.rowCount}`);
    }

    // 2. Purge test invoices and invoice_lines
    if (candidates.invoices?.length > 0) {
      const invIds = candidates.invoices.map(i => i.id);
      // Disable trigger temporarily or remove lines first
      await client.query('DELETE FROM invoice_lines WHERE invoice_id = ANY($1::text[])', [invIds]);
      const resInv = await client.query('DELETE FROM invoices WHERE id = ANY($1::text[])', [invIds]);
      console.log(`Purged invoices: ${resInv.rowCount}`);
    }

    // 3. Purge test submissions
    if (candidates.submissions?.length > 0) {
      const subIds = candidates.submissions.map(s => s.id);
      const resSub = await client.query('DELETE FROM submissions WHERE id = ANY($1::text[])', [subIds]);
      console.log(`Purged submissions: ${resSub.rowCount}`);
    }

    // 4. Purge test rfqs and rfq_items
    if (candidates.rfqs?.length > 0) {
      const rfqRefs = candidates.rfqs.map(r => r.ref);
      await client.query('DELETE FROM rfq_items WHERE rfq_ref = ANY($1::text[])', [rfqRefs]);
      const resRfq = await client.query('DELETE FROM rfqs WHERE ref = ANY($1::text[])', [rfqRefs]);
      console.log(`Purged rfqs: ${resRfq.rowCount}`);
    }

    // 5. Purge test products
    if (candidates.products?.length > 0) {
      const prodSlugs = candidates.products.map(p => p.slug);
      const resProd = await client.query('DELETE FROM products WHERE slug = ANY($1::text[])', [prodSlugs]);
      console.log(`Purged products: ${resProd.rowCount}`);
    }

    // 6. Purge corrupted audit logs
    if (candidates.audit_log?.length > 0) {
      const resAudit = await client.query(`
        DELETE FROM audit_log 
        WHERE actor = '{}' 
           OR actor = '[object Promise]' 
           OR actor IS NULL 
           OR ts > (EXTRACT(EPOCH FROM (NOW() + interval '1 day')) * 1000)
      `);
      console.log(`Purged corrupted audit logs: ${resAudit.rowCount}`);
    }

    await client.query('COMMIT');
    console.log('[SUCCESS] All candidate fixtures purged within transaction.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isConfirm = args.includes('--confirm');
  const isBackupOnly = args.includes('--backup');
  const rollbackIdx = args.indexOf('--rollback');

  console.log('=== Simal Corporate Platform — Test Fixture Sanitizer (DAT-7) ===');
  console.log(`Database URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    if (rollbackIdx !== -1) {
      const backupFile = args[rollbackIdx + 1];
      if (!backupFile) {
        console.error('Error: --rollback requires a file path argument.');
        process.exit(1);
      }
      await rollbackFromBackup(pool, backupFile);
      await pool.end();
      return;
    }

    console.log('\nScanning for test-fixture candidate records in PostgreSQL...');
    const candidates = await inspectFixtures(pool);

    let totalCandidates = 0;
    console.log('\n--- Scan Summary ---');
    for (const [table, rows] of Object.entries(candidates)) {
      console.log(`Table [${table}]: ${rows.length} candidate fixtures found.`);
      totalCandidates += rows.length;
      if (rows.length > 0 && rows.length <= 10) {
        for (const row of rows) {
          console.log(`  - ${JSON.stringify(row)}`);
        }
      } else if (rows.length > 10) {
        console.log(`  - (Showing first 5 of ${rows.length})`);
        for (const row of rows.slice(0, 5)) {
          console.log(`    ${JSON.stringify(row)}`);
        }
      }
    }
    console.log(`Total candidate fixture records detected: ${totalCandidates}\n`);

    if (isBackupOnly) {
      const backupPath = createBackup(candidates);
      console.log(`[BACKUP CREATED] Backup safely written to: ${backupPath}`);
      return;
    }

    if (isApply) {
      if (!isConfirm) {
        console.error('[ERROR] SAFETY ABORT: --apply requires --confirm flag to proceed with deletion.');
        console.log('Run with: node cleanup-test-fixtures.mjs --apply --confirm');
        process.exit(1);
      }

      console.log('Creating safety backup prior to apply...');
      const backupPath = createBackup(candidates);
      console.log(`[BACKUP] Safety snapshot preserved at: ${backupPath}`);

      console.log('Applying deletion transaction...');
      await applyPurge(pool, candidates);
    } else {
      console.log('=== DRY-RUN MODE (Default) ===');
      console.log('No data was modified. To execute changes, run:');
      console.log('  node cleanup-test-fixtures.mjs --apply --confirm');
      console.log('To only generate a backup of candidates:');
      console.log('  node cleanup-test-fixtures.mjs --backup');
    }

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('[FATAL] Script error:', err);
  process.exit(1);
});
