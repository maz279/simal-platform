/* ==========================================================================
 * seed.js — sample data seeder. Credentials come ONLY from env (never written
 * to source); test credentials are generated with crypto at runtime.
 * Run: node tools/seed.js [--force]
 * ========================================================================== */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config.js';
import { createStore } from '../src/store/db.js';
import { createRepos } from '../src/store/repos.js';
import { createAuth } from '../src/services/auth.service.js';
import { createScreening } from '../src/services/screening.service.js';
import { V } from '../src/domain/validators.js';
import { hashPassword } from '../src/lib/security.js';
import { log } from '../src/lib/log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function daysAgo(n) { return Date.now() - n * 86400000; }
function isoAhead(n) { return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); }

const VENDORS = [
  ['Crucial Components ME FZE', 'Wholesale of computer peripherals'],
  ['Hikvision Gulf Distribution LLC', 'Wholesale of security equipment'],
  ['Adata Technology MEA FZE', 'Wholesale of data storage devices'],
  ['TeamGroup Middle East Trading LLC', 'Wholesale of computer memory'],
  ['Ugreen Accessories DMCC', 'Wholesale of electronic accessories'],
  ['Arktek Graphics FZE', 'Wholesale of computer components'],
];
const CUSTOMERS = [
  ['Al Ain Computer House LLC', 'Retail of computers & peripherals'],
  ['Desert Byte Technologies LLC', 'IT reseller & system integration'],
  ['Emirates Digital Store LLC', 'Retail of consumer electronics'],
  ['Sharjah IT Traders LLC', 'Wholesale of IT equipment'],
  ['Gulf Gadget Retail LLC', 'Retail of gadgets & accessories'],
  ['RAK PC Hub LLC', 'Retail of computer hardware'],
];
const CONTACTS = ['Ahmed Al Hashimi', 'Priya Nair', 'Mohammed Saber', 'Sara Al Nuaimi', 'John Dsouza', 'Layla Haddad'];
const REVIEWERS = ['Fatima Al Mansoori', 'Rahul Mehta'];

function seedSubmission(i, companyTuple, activity, role, status, ageDays) {
  const company = Array.isArray(companyTuple) ? companyTuple[0] : companyTuple;
  const tin = V.makeTIN('1004728477' + String(i).padStart(2, '0'));
  const contact = CONTACTS[i % CONTACTS.length];
  const specs = {
    submitted: [], under_review: ['Review started'],
    query_raised: ['Review started', 'Query raised'],
    partner_updated: ['Review started', 'Query raised', 'Partner responded'],
    approved: ['Review started', 'Approved'],
    rejected: ['Review started', 'Rejected'],
  };
  const history = [{ status: 'submitted', label: 'Submission received', ts: daysAgo(ageDays) }];
  (specs[status] || []).forEach((label, k) => history.push({ status, label, ts: daysAgo(Math.max(0, ageDays - k - 1)) }));

  const queries = [];
  if (status === 'query_raised') {
    queries.push({
      id: 'Q' + (1000 + i), section: 'Tax & E-Invoicing',
      message: 'The TRN provided does not match the company name on our EmaraTax check. Please re-confirm the 15-digit TRN.',
      raised_by: REVIEWERS[i % 2], raised_at: daysAgo(Math.max(0, ageDays - 1)), response: null, responded_at: null,
    });
  }
  if (status === 'partner_updated') {
    queries.push({
      id: 'Q' + (1000 + i), section: 'Company', message: 'Legal name must match the licence exactly.',
      raised_by: REVIEWERS[i % 2], raised_at: daysAgo(Math.max(0, ageDays - 1)),
      response: 'Updated — name now matches the licence.', responded_at: daysAgo(1),
    });
  }

  return {
    id: 'SIM-KYC-' + new Date().getFullYear() + '-' + String(10061 + i).padStart(5, '0'),
    role, status,
    company: {
      legal_name_en: company, entity_type: role === 'vendor' ? 'FZE' : 'LLC', country: 'AE',
      license_number: 'CN-' + (1000000 + i * 13571), license_authority: ['Dubai DET (DED)', 'DMCC', 'JAFZA', 'RAKEZ'][i % 4],
      license_issue: isoAhead(-700), license_expiry: i === 2 ? isoAhead(21) : isoAhead(150 + i * 30),
      business_activity: activity,
      address: { building: 'Office 30' + i, street: 'Sheikh Zayed Rd', city: 'Dubai', emirate: 'Dubai', country: 'United Arab Emirates', po_box: String(40000 + i * 577) },
    },
    tax: {
      trn: tin, vat_registered: true,
      peppol_id: status === 'approved' && i % 2 === 0 ? '0235:' + tin : '',
      einv_status: ['live', 'in_progress', 'not_started'][i % 3], invoice_currency: 'AED',
    },
    contacts: {
      primary: {
        name: contact, designation: role === 'vendor' ? 'Regional Sales Ops' : 'Procurement Manager',
        email: contact.toLowerCase().replace(/[^a-z]+/g, '.') + '@example-partner' + (i % 5) + '.ae',
        mobile: '+9715' + String(50000000 + i * 1234567).slice(0, 8),
      },
      finance: { name: CONTACTS[(i + 3) % CONTACTS.length], email: 'accounts@partner' + i + '.ae' },
    },
    signatories: [{
      name: CONTACTS[(i + 1) % CONTACTS.length], nationality: 'AE', designation: 'General Manager',
      id_type: 'eid', id_number: '7841985' + String(5000000 + i * 34567).slice(0, 6) + String((i % 9) + 1),
      id_expiry: i === 4 ? isoAhead(12) : isoAhead(300 + i * 40), authority_basis: 'MOA (manager)',
      email: 'sig' + i + '@partner.ae', mobile: '+97150123456' + i,
    }],
    ubos: [{
      name: CONTACTS[(i + 5) % CONTACTS.length], nationality: 'AE', id_type: 'passport',
      id_number: 'P' + (4000000 + i * 91827), ownership_pct: '100', country_of_residence: 'United Arab Emirates',
    }],
    banking: {
      bank_name: ['Emirates NBD', 'Mashreq Bank', 'First Abu Dhabi Bank'][i % 3],
      iban: V.makeIBAN(String(200 + i * 7), String(100000000 + i * 7717)),
      account_holder: company, currency: 'AED',
    },
    documents: [
      { type: 'trade_license', name: 'license.pdf', size: 812000, mime: 'application/pdf', uploadedAt: daysAgo(ageDays) },
      { type: 'trn_cert', name: 'trn.pdf', size: 240000, mime: 'application/pdf', uploadedAt: daysAgo(ageDays) },
      { type: 'moa', name: 'moa.pdf', size: 1420000, mime: 'application/pdf', uploadedAt: daysAgo(ageDays) },
      { type: 'signatory_id', name: 'eid.pdf', size: 640000, mime: 'application/pdf', uploadedAt: daysAgo(ageDays) },
      { type: 'bank_proof', name: 'bank-letter.pdf', size: 380000, mime: 'application/pdf', uploadedAt: daysAgo(ageDays) },
    ],
    declarations: { accuracy: { checked: true }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
    declarationsMeta: { signedAt: daysAgo(ageDays), signedIp: 'seed' },
    review: status === 'approved' ? { checklist: { license: true, trn: true, moa: true, bank: true, ubo: true }, notes: [{ by: REVIEWERS[0], ts: daysAgo(Math.max(0, ageDays - 1)), text: 'Verified against EmaraTax record.' }] } : { checklist: {}, notes: [] },
    queries,
    history,
    reviewer: status === 'submitted' ? null : REVIEWERS[i % 2],
    rejection_reason: status === 'rejected' ? 'Trade licence expired at submission — please renew and reapply.' : '',
    hold_reason: '',
    createdAt: daysAgo(ageDays + 2), submittedAt: daysAgo(ageDays), updatedAt: daysAgo(Math.max(0, ageDays - 1)),
  };
}

const SPECS = [
  [VENDORS[0], VENDORS[0][1], 'vendor', 'approved', 26],
  [VENDORS[1], VENDORS[1][1], 'vendor', 'approved', 21],
  [VENDORS[2], VENDORS[2][1], 'vendor', 'under_review', 2],
  [VENDORS[3], VENDORS[3][1], 'vendor', 'query_raised', 4],
  [VENDORS[4], VENDORS[4][1], 'vendor', 'approved', 33],
  [VENDORS[5], VENDORS[5][1], 'vendor', 'submitted', 1],
  [CUSTOMERS[0], CUSTOMERS[0][1], 'customer', 'approved', 40],
  [CUSTOMERS[1], CUSTOMERS[1][1], 'customer', 'on_hold', 6],
  [CUSTOMERS[2], CUSTOMERS[2][1], 'customer', 'query_raised', 3],
  [CUSTOMERS[3], CUSTOMERS[3][1], 'customer', 'approved', 18],
  [CUSTOMERS[4], CUSTOMERS[4][1], 'customer', 'submitted', 0],
  [CUSTOMERS[5], CUSTOMERS[5][1], 'customer', 'rejected', 15],
];

const force = process.argv.includes('--force');
const dataDir = process.env.SEED_DATA_DIR ? path.resolve(ROOT, process.env.SEED_DATA_DIR) : config.dataDir;
const marker = path.join(dataDir, 'db.json');

if (fs.existsSync(marker) && !force) {
  console.log('Database already exists at ' + marker + ' — use --force to reseed.');
  process.exit(0);
}
fs.mkdirSync(dataDir, { recursive: true });

process.env.NODE_KYC_TEST = '1';
const store = createStore(dataDir);
const repos = createRepos(store);
const auth = createAuth(repos);
createScreening(repos); // ensures the starter watchlist file exists

/* users: ONLY env-provided credentials */
const bootstrapped = auth.bootstrap();
if (!bootstrapped) {
  console.log('NOTE: admin user already exists or env credentials are incomplete — users not reseeded.');
}

/* submissions */
SPECS.forEach((s, i) => {
  const sub = seedSubmission(i, s[0], s[1], s[2], s[3], s[4]);
  repos.submissions.add(sub);
  repos.audit(sub.contacts.primary.email, 'submitted', sub.id, 'seeded sample submission');
});
/* advance the reference sequence past the seeded range (prevents ID collisions) */
store.data.nextRefSeq = 10061 + SPECS.length + 100;

/* drafts for the funnel */
[['kavita.menon', 1], ['sameer.j', 2], ['grace.l', 3], ['hassan.t', 4], ['meera.d', 2]].forEach((d, i) => {
  const email = d[0] + '@partner' + (i + 1) + '.ae';
  repos.drafts.create(email, i % 2 ? 'vendor' : 'customer');
});

/* settings */
const tin = V.makeTIN('10054817290');
repos.saveSettings({ simalTin: tin, simalPeppol: '0235:' + tin });

await store.syncPersist();
log.info('seed_complete', { dataDir, submissions: SPECS.length, drafts: 5 });
console.log('Seed complete: ' + SPECS.length + ' submissions, 5 drafts → ' + dataDir);
process.exit(0);
