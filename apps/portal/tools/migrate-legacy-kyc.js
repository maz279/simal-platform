/* ==========================================================================
 * migrate-legacy-kyc.js — T2.4: legacy kyc.simalme.com export → portal store.
 *
 * Usage:
 *   node tools/migrate-legacy-kyc.js <legacy-export-filename.json> [--dry-run]
 *
 * The filename (basename only) is looked up inside the ALLOWED directories
 * (apps/portal/data/ or apps/portal/test/fixtures/) via a directory listing —
 * traversal is impossible by construction and no outside path is ever read.
 *
 * Legacy export format (documented contract for the legacy-side dump):
 *   { "exportedAt": "ISO", "applications": [ {
 *       "id": "KYC-2024-0001",            // legacy reference (kept as id)
 *       "company": { "name": "...", "trn": "10012345670...", "country": "AE" },
 *       "contact": { "name": "...", "email": "...", "phone": "..." },
 *       "status": "pending" | "approved" | "rejected",
 *       "reviewer_notes": "...", "submitted_at": "ISO",
 *       "documents": [ { "type": "trade_license", "name": "lic.pdf",
 *                        "mime": "application/pdf", "dataB64": "..." } ]
 *   } ] }
 *
 * Mapping: pending→submitted · approved→approved · rejected→rejected(terminal).
 * Cleansing: TRNs stripped to digits; non-15-digit ids ≥10 chars become
 * foreign tax ids; company names normalised. Parity: every input record is
 * imported or rejected WITH a reason. Documents byte-store via the portal's
 * own upload path. --dry-run validates without writing.
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* allowlist: the only directories a legacy export may be read from */
const ALLOWED_DIRS = [
  path.join(ROOT, 'data'),
  path.join(ROOT, 'test', 'fixtures'),
];

const argName = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!argName) {
  console.error('usage: node tools/migrate-legacy-kyc.js <legacy-export-filename.json> [--dry-run]');
  process.exit(2);
}
const WANT = path.basename(argName); /* basename only — traversal impossible */
if (!WANT.endsWith('.json')) { console.error('input must be a .json file'); process.exit(2); }

let INPUT = null;
for (const dir of ALLOWED_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {           /* trusted directory listing */
    if (f === WANT) { INPUT = path.join(dir, f); break; }
  }
  if (INPUT) break;
}
if (!INPUT) { console.error('"' + WANT + '" not found under: ' + ALLOWED_DIRS.join(' | ')); process.exit(2); }

process.env.NODE_KYC_TEST = '1';
if (!process.env.DATA_DIR && !process.env.DATABASE_URL) {
  /* default: the portal data dir — nothing accidental */
  process.env.DATA_DIR = path.join(ROOT, 'data');
}

const { createStore } = await import('../src/store/db.js');
const { createRepos } = await import('../src/store/repos.js');
const { makeAsync } = await import('../src/store/async-wrapper.js');
const { createPgRepos } = await import('../src/store/pg-repos.js');
const repos = process.env.DATABASE_URL ? createPgRepos(process.env.DATABASE_URL) : makeAsync(createRepos(createStore(process.env.DATA_DIR)));
if (repos.ready) await repos.ready;

const STATUS_MAP = { pending: 'submitted', under_review: 'under_review', approved: 'approved', rejected: 'rejected' };

const cleanseTrn = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 15) return { trn: digits, foreign: null };
  if (String(raw || '').trim().length >= 10) return { trn: null, foreign: String(raw).trim().toUpperCase() };
  return { trn: null, foreign: null };
};
const cleanName = (raw) => String(raw || '').replace(/\s+/g, ' ').trim();

const legacy = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const apps = Array.isArray(legacy.applications) ? legacy.applications : [];
const report = { total: apps.length, imported: 0, rejected: 0, reasons: [], ids: [] };

for (const a of apps) {
  const why = (msg) => { report.rejected++; report.reasons.push({ id: a.id || '(no id)', reason: msg }); };

  const mappedStatus = STATUS_MAP[String(a.status || '').toLowerCase()];
  if (!mappedStatus) { why('unknown legacy status "' + a.status + '"'); continue; }
  const email = String(a.contact?.email || '').toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { why('contact email missing/invalid'); continue; }
  const name = cleanName(a.company?.name);
  if (name.length < 3) { why('company name missing'); continue; }
  const { trn, foreign } = cleanseTrn(a.company?.trn);
  if (!trn && !foreign) { why('TRN unrecognisable (neither 15 digits nor a foreign id)'); continue; }

  /* duplicate guard: same id already present → skip idempotently */
  const existing = await repos.submissions.get(String(a.id));
  if (existing) { report.imported++; report.ids.push(a.id); continue; }

  const docs = [];
  for (const d of a.documents || []) {
    if (!d?.dataB64) { docs.push({ type: d.type, name: d.name, size: 0, mime: d.mime || 'application/octet-stream', uploadedAt: 0 }); continue; }
    const buf = Buffer.from(d.dataB64, 'base64');
    const stored = await repos.documents.store(d, buf);
    docs.push({ type: d.type, name: d.name, size: buf.length, mime: d.mime || 'application/octet-stream', docId: stored.docId, path: stored.relPath, uploadedAt: 0 });
  }

  const submittedAt = Date.parse(a.submitted_at) || Date.now();
  const sub = {
    id: String(a.id), role: 'vendor',
    status: mappedStatus,
    company: { legal_name_en: name, country: a.company?.country || 'AE' },
    tax: trn ? { trn, vat_registered: true, einv_status: mappedStatus === 'approved' ? 'registered' : 'in_progress', invoice_currency: 'AED' } : { foreign_tax_id: foreign, vat_registered: false, einv_status: 'not_applicable', invoice_currency: 'AED' },
    contacts: { primary: { name: cleanName(a.contact?.name) || name, designation: 'Legacy import', email, mobile: String(a.contact?.phone || '') } },
    signatories: [], ubos: [], banking: {},
    documents: docs,
    declarations: { legacy_import: { checked: true } },
    review: { checklist: {}, notes: a.reviewer_notes ? [a.reviewer_notes] : [] },
    queries: [],
    history: [
      { status: 'submitted', label: 'Migrated from legacy portal', ts: submittedAt },
      ...(mappedStatus !== 'submitted' ? [{ status: mappedStatus, label: 'Legacy status carried over', ts: submittedAt + 1 }] : []),
    ],
    reviewer: mappedStatus === 'submitted' ? null : 'legacy-import',
    rejection_reason: mappedStatus === 'rejected' ? (a.reviewer_notes || 'Rejected in legacy portal') : '',
    createdAt: submittedAt, submittedAt, updatedAt: submittedAt,
  };

  if (!dryRun) await repos.submissions.add(sub);
  report.imported++;
  report.ids.push(sub.id);
}

const parity = report.imported + report.rejected === report.total;
console.log('legacy migration ' + (dryRun ? '(DRY RUN) ' : '') + '— source ' + INPUT);
console.log('records: ' + report.total + ' · imported: ' + report.imported + ' · rejected: ' + report.rejected + ' · parity: ' + (parity ? 'EXACT (every record accounted)' : 'BROKEN'));
for (const r of report.reasons) console.log('  REJECT ' + r.id + ' — ' + r.reason);
const outPath = path.resolve(ROOT, 'tools', 'legacy-migration-report.json');
fs.writeFileSync(outPath, JSON.stringify({ ts: new Date().toISOString(), source: INPUT, dryRun, ...report, parity }, null, 2));
console.log('report → ' + outPath);
process.exit(parity ? 0 : 1);
