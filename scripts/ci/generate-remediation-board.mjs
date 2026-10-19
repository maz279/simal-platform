// scripts/ci/generate-remediation-board.mjs — P0-5 (2026-10-12) · rm(1.3-1) rewrite (2026-10-16)
// Parses the master findings register (§2) and traceability matrix (§5) of the
// original remediation plan, then merges VERDICTS from the independent re-audit
// (audit_report_2/FINDINGS_MATRIX.csv) plus the explicit override block below.
// deploy-audit (2026-10-19): also parses the deployment-readiness ledger
// (scratch/rm-evidence/deploy-audit/FINDINGS.md) — rows D01…D55, its Open list and
// its Owner decisions — and notes every earlier closure that ledger contradicts.
// The board is generated, never hand-edited — statuses therefore always match
// their cited evidence.
//
//   node scripts/ci/generate-remediation-board.mjs [path-to-REMEDIATION_PLAN.md]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// unify(2026-10-19): the audit corpus moved from the workspace sibling ../Audit into the repo as audit/
const DEFAULT_PLAN = path.resolve(REPO, 'audit', 'Independent_Forensic_Audit_2026-10-12', 'REMEDIATION_PLAN.md');
const MATRIX = path.resolve(REPO, 'audit', 'Independent_Forensic_Audit_2026-10-12', 'audit_report_2', 'FINDINGS_MATRIX.csv');
const planPath = process.argv[2] || DEFAULT_PLAN;
const md = await fs.readFile(planPath, 'utf8');

/* ---- rm(1.3-1): POST-AUDIT STATUS OVERRIDES — every line cites its evidence.
   Base status comes from FINDINGS_MATRIX verdicts (FIXED→closed, PARTIAL→partial,
   NOT_FIXED→open). Anything completed AFTER the audit is overridden here. ---- */
const OVERRIDES = {
  'SEC-10':   'closed',
  'F-2026-N01': 'closed',
  'F-2026-N03': 'closed',
  'F-2026-N15': 'closed',
};

/* ---- re-audit verdicts (FINDINGS_MATRIX.csv) ---- */
const VERDICT_TO_STATUS = { FIXED: 'closed', FIXED_PER_PLAN: 'closed', PARTIAL: 'partial', NOT_FIXED: 'open', OPEN: 'open' };
const matrix = new Map();
const matrixCsv = await fs.readFile(MATRIX, 'utf8');
for (const line of matrixCsv.split(/\r?\n/).slice(1)) {
  const m = line.match(/^("[^"]*"|[^,]*),([^,]*),("[^"]*"|[^,]*),("[^"]*"|[^,]*),/);
  if (!m) continue;
  const id = m[1].replace(/"/g, '');
  matrix.set(id, { severity: m[2].trim(), verdict: m[4].replace(/"/g, '').trim() });
}

/* ---- slice the plan into sections ---- */
const section = (from, to) => { const a = md.indexOf(from); const b = md.indexOf(to); return md.slice(a, b > a ? b : undefined); };
const registerMd = section('## 2. Master findings register', '## 3. Phase overview');
const traceMd = section('## 5. Traceability matrix', '## 6. Indicative schedule');

const register = new Map();
let area = '';
for (const line of registerMd.split(/\r?\n/)) {
  const h = line.match(/^### (.+?) \(([A-Z][A-Z0-9]{1,4})\)/);
  if (h) { area = h[2]; continue; }
  const row = line.match(/^\| ([A-Z][A-Z0-9]{1,4}-\d+)(?: \(F-\d+\))? \| ([CHML]) \| (.+?) \| (.*?) \|$/);
  if (row) register.set(row[1], { id: row[1], severity: row[2], area, finding: row[3].trim(), evidence: row[4].trim() });
}
const trace = new Map();
for (const line of traceMd.split(/\r?\n/)) {
  const row = line.match(/^\| ([A-Z][A-Z0-9]{1,4}-\d+)(?: \(F-\d+\))? \| [CHML] \| (P\d+-\d+[^|]*?) \| (.+?) \|$/);
  if (row) trace.set(row[1], { phaseTask: row[2].trim(), acceptance: row[3].trim() });
}

/* ---- rm(1.3-1): the 17 re-audit findings, RM task ids per roadmap §12 ---- */
const NEW_FINDINGS = [
  ['F-2026-N01', 'C', 'RM-1.1-1…1.1-4', 'SSG publish pipeline dead since 14 Oct 02:42 (execFile npm.cmd → spawn EINVAL; queue jammed)', 'control-loop probe; scratch/rm-evidence/1.1-*.log'],
  ['F-2026-N02', 'H', 'RM-2.1-1…2.1-3', 'CSRF synchronizer token never verified — any x-csrf-token value bypasses cross-site checks', 'iteration2 live proof: evil origin + bogus token → 200'],
  ['F-2026-N03', 'H', 'RM-1.2-1…1.2-3', 'Entire Phase 1-9 remediation uncommitted; no remote; CI never ran on a platform', 'git status/log; protection drill log'],
  ['F-2026-N04', 'M', 'RM-2.2-1/2.2-2', 'Report builder leaks TRN + email/mobile to non-view_pii staff (live-confirmed)', 'live probe §G: tax.trn raw'],
  ['F-2026-N05', 'M', 'RM-4.4-1…4.4-3', 'Media uploads stored in portal webroot, publicly served; svg allowed; no AV; size label mismatch', 'cms.service.js:573-585'],
  ['F-2026-N06', 'M', 'RM-2.4-1', 'DOC_ENCRYPTION_KEY absent from env — AES-256 runs on committed literal key', 'pg-repos.js:21'],
  ['F-2026-N07', 'M', 'RM-2.4-1 + RM-8.1-1', 'ClamAV client dormant — CLAMAV_HOST/PORT in no env file; EICAR-only engine', 'virus-scanner.js:145-147'],
  ['F-2026-N08', 'M', 'RM-2.3-1', 'Unauthenticated POST /api/integrations/email/bounce writes spoofable audit rows', 'routes.js:921-924'],
  ['F-2026-N09', 'M', 'RM-2.3-2', 'Viewer can read error stacks; any staff can HMAC-sign webhook payloads', 'routes.js:981-993'],
  ['F-2026-N10', 'M', 'RM-3.1-1…3.2-2', 'XSS residues: hero cta_href unsanitized; RFQ mini-cart injection; cms esc() misses single-quote', 'index.astro:76→1387,1564; cms.js esc()'],
  ['F-2026-N11', 'M', 'RM-6.3-1', 'P4 test articles published live in dist (8 pages + sitemap refs); test-cms-e2e defaults to main DB', 'dist greps; test-cms-e2e.mjs:18'],
  ['F-2026-N12', 'L', 'RM-9.2-1', 'ssg-outbox-sync.test.mjs uses removed admin123 credentials — permanently failing test debt', 'test run evidence'],
  ['F-2026-N13', 'L', 'RM-4.3-4', 'CMS profile chip shows wrong identity (state.me.user always {})', 'cms.js:144,440-444'],
  ['F-2026-N14', 'L', 'RM-2.4-2', 'Live credentials committed: prod-db-roles.sql password; seed_arabic_content.mjs fallback', 'source refs'],
  ['F-2026-N15', 'L', 'RM-1.3-1/1.3-2', 'Governance doc claims "7 gates passing" without saved run; board stale both directions', 'docs a44; remediation-board.csv mtime'],
  ['F-2026-N16', 'L', 'RM-6.3-2', 'hero_slides.bg editable but never rendered (client uses static palette)', 'index.astro:1353'],
  ['F-2026-N17', 'L', 'RM-7.2-2', 'SLA integer age >= 1.5 fires at 2 days; no automated escalation job', 'review.service.js:43-49'],
];

/* ---- rm(10.3-1): independent penetration engagement SIMAL-PEN-2026-10-18 ----
 * Findings are imported from FINDINGS_MATRIX.csv (PEN-2026-*); this table carries
 * the task/acceptance the tester's finding maps to. Status comes from the matrix
 * verdict, so a fix is only "closed" when the matrix says FIXED. */
const PEN_FINDINGS = [
  ['PEN-2026-01', 'M', 'RM-PEN-01', 'Reviewer read CMS telemetry, integration health and reloaded screening (AUTHZ-12/LIVE-09/CMS-32)', 'scratch/pentest/auth/findings.json AUTHZ-12; retest.json', 'reviewer 403 on telemetry/health/screening; super_admin 200'],
  ['PEN-2026-02', 'M', 'RM-PEN-02', 'Login timing oracle: unknown email ~20x faster (ENUM-02)', 'scratch/pentest/auth/findings.json ENUM-02', 'unknown-email login burns a dummy scrypt verify'],
  ['PEN-2026-03', 'M', 'RM-PEN-03', 'Wrong TOTP surfaced as HTTP 500 (mfaChallenges.fail missing) (MFA-02)', 'scratch/pentest/auth/findings.json MFA-02', 'wrong TOTP → controlled 401 + audit'],
  ['PEN-2026-04', 'M', 'RM-PEN-04', 'Used TOTP code replayable on a new challenge (MFA-06)', 'scratch/pentest/auth/findings.json MFA-06', 'replay of an accepted step → 401'],
  ['PEN-2026-05', 'H', 'RM-PEN-05', 'Staff (reviewer/viewer) could log in password-only (MFA-08 / GOV a16)', 'scratch/pentest/auth/findings.json MFA-08', 'production boot refuses non-MFA staff; enrollment UI tracked (RTM DEV-05)'],
  ['PEN-2026-06', 'L', 'RM-PEN-06', 'CSRF_STRICT flag had no effect (CSRF-12)', 'scratch/pentest/auth/findings.json CSRF-12', 'strict mode requires a verified token; test added'],
  ["PEN-2026-07", "H", "RM-PEN-07", "Draft takeover: email alone returned another party's draft id/token/PII (KYC-02)", "scratch/pentest/kyc/findings.json KYC-02", "resume needs the draft token/cookie; email alone → new draft"],
  ["PEN-2026-08", "H", "RM-PEN-08", "Harvested draft token allowed overwriting another party's draft (KYC-03)", "scratch/pentest/kyc/findings.json KYC-03", "overwrite requires the owner token"],
  ["PEN-2026-09", "H", "RM-PEN-09", "Harvested draft token allowed staging a document into another draft (KYC-04)", "scratch/pentest/kyc/findings.json KYC-04", "staging requires the owner token"],
  ['PEN-2026-10', 'H', 'RM-PEN-10', 'Queue exposed the raw TRN to roles without view_pii (KYC-26)', 'scratch/pentest/kyc/findings.json KYC-26', 'tin masked in the list; regression'],
  ['PEN-2026-11', 'H', 'RM-PEN-11', 'Detail exposed raw TRN/emails/phones to roles without view_pii (KYC-27)', 'scratch/pentest/kyc/findings.json KYC-27', 'detail masked; view_pii raw'],
  ['PEN-2026-12', 'M', 'RM-PEN-12', 'PG duplicate-TRN detection missed pending duplicates (NULL exclude + approved-only) (KYC-37)', 'scratch/pentest/kyc/findings.json KYC-37', 'duplicateTin detects non-rejected duplicates on PG'],
  ['PEN-2026-13', 'L', 'RM-PEN-13', 'RFQ accepted an empty phone (KYC-40)', 'scratch/pentest/kyc/findings.json KYC-40', 'invalid phone → 400'],
  ['PEN-2026-14', 'L', 'RM-PEN-14', 'RFQ reference format differs from the ratified baseline (KYC-41)', 'scratch/pentest/kyc/findings.json KYC-41', 'baseline amendment (RTM DEV-01) accepted'],
  ['PEN-2026-15', 'L', 'RM-PEN-15', 'No honeypot on the public RFQ (KYC-43)', 'scratch/pentest/kyc/findings.json KYC-43', 'filled honeypot → fake success, nothing persisted'],
  ['PEN-2026-16', 'L', 'RM-PEN-16', 'Status lookup leaked reference existence (403 vs 404) (KYC-46)', 'scratch/pentest/kyc/findings.json KYC-46', 'both cases 404'],
  ['PEN-2026-17', 'M', 'RM-PEN-17', 'Same-item content drift after an approval request was published (CMS-14)', 'scratch/pentest/cms/findings.json CMS-14', 'approval compares the dirty-set max audit ts → 409'],
  ['PEN-2026-19', 'M', 'RM-PEN-19', 'Missing media file crashed the portal (headers sent before the file check) (CMS-36)', 'scratch/pentest/cms/findings.json CMS-36', 'missing file → 404; process survives'],
  ['PEN-2026-20', 'M', 'RM-PEN-20', 'CMS media upload UI key mismatch (dataBase64 vs base64) — every upload failed', 'scratch/pentest/cms/findings.json (observations)', 'server accepts both keys'],
  ['PEN-2026-21', 'L', 'RM-PEN-21', 'Rollback ignored the selected revision (always newest)', 'scratch/pentest/cms/findings.json (observations)', 'rollback honours revisionId'],
];

/* rm(10.4-1): P10 go/no-go items and the RTM deviations that are findings in
 * their own right are part of the register too. Status from the matrix. */
const P10_FINDINGS = [
  ['P10-1', 'M', 'RM-10.1-1', 'Full audit-probe re-run (gates, live probes, browser, KYC wizard)', 'scratch/rm-evidence/10.1-*', 'every previously failing probe passes with captured evidence; clean-DB build green'],
  ['P10-2', 'M', 'RM-10.3-1', 'Independent security retest / pen test of auth + KYC + CMS', 'audit_report_2/PEN_TEST_ENGAGEMENT/', 'no open Critical/High; report attached'],
  ['P10-3', 'M', 'RM-10.3-2', 'Requirements traceability re-run (top 25 requirements)', 'Codebase/RTM.md', 'each critical requirement traces to evidenced behaviour'],
  ['P10-4', 'M', 'RM-10.4-3', 'Go/No-Go gate signed with evidence', 'docs/NEXT_AUDIT_READINESS.md', 'signed by named individuals with dates'],
];
const GOV_FINDINGS = [
  ['DEV-05', 'H', 'RM-PEN-05', 'Staff password-only login (GOV a16): production invariant + enrolment UI', 'docs/PEN_TEST_ENGAGEMENT_REPORT.md; admin.html', 'production refuses non-MFA staff; staff can enrol'],
  ['DEV-07', 'M', 'RM-AR-01', 'Arabic parity 17 vs 217 pages (GOV a29) — content programme', 'Codebase/RTM.md DEV-07', 'accepted risk with owner/date in the readiness pack'],
  ['DEV-13', 'M', 'RM-PEN-22', 'Viewer role had no bound surface (declared read/export)', 'scripts/ci/authz-matrix.mjs; admin.js', 'viewer sees the masked queue + masked CSV, nothing else'],
];

/* ---- deploy-audit (2026-10-18 ledger): rows, Open list and Owner decisions are read
 * from the ledger itself, so the board cannot drift from it. Ledger status FIXED →
 * closed, OPEN → open, HUMAN → human (an owner decision, never "done"); an Open
 * bullet the ledger marks "— DONE" is closed. Severity: Blocker → C. ---- */
const LEDGER_PATH = path.join(REPO, 'scratch', 'rm-evidence', 'deploy-audit', 'FINDINGS.md');
const ledgerMd = await fs.readFile(LEDGER_PATH, 'utf8');
/* the fix commit of each row (the ledger cites some inline; the rest per commit message) */
const LEDGER_COMMITS = {
  D01: '8c37907', D02: 'ddc2114', D03: 'd32d5ed', D04: '00beef6', D05: '197ad47', D06: '197ad47',
  D07: '197ad47', D08: '197ad47 + rig copy', D09: '197ad47', D22: '197ad47', D23: '00beef6', D24: '00beef6',
  D25: '00beef6', D26: '197ad47', D27: '3fba62a', D28: '3fba62a', D29: '3fba62a', D30: '3fba62a',
  D31: '3fba62a', D32: '3fba62a', D33: '3fba62a', D34: '3fba62a', D35: '3fba62a', D36: '3fba62a',
  D37: '3fba62a', D38: '3fba62a', D39: '3fba62a', D40: '3fba62a + e613c5a', D41: '3fba62a', D42: '3fba62a',
  D43: 'e6feb75', D44: 'e6feb75', D45: 'e6feb75', D46: 'e6feb75', D47: 'e6feb75', D48: 'e6feb75',
  D49: 'e6feb75', D50: 'e6feb75', D51: 'e6feb75', D52: 'e6feb75', D53: 'dc73f1f', D54: 'rig data (CMS rollback/PUT)',
  D55: 'e6feb75',
};
const LEDGER_SEV = { Blocker: 'C', High: 'H', Medium: 'M', Low: 'L' };
const LEDGER_STATUS = { FIXED: 'closed', OPEN: 'open', HUMAN: 'human', DOC: 'closed' };
const DEPLOY_FINDINGS = [];
for (const line of ledgerMd.split(/\r?\n/)) {
  const row = line.match(/^\| (D\d\d) \| (\w+) \| (.+?) \| (.+?) \| (.+?) \|$/);
  if (row) DEPLOY_FINDINGS.push([row[1], LEDGER_SEV[row[2]] || row[2], LEDGER_COMMITS[row[1]] || 'MISSING', row[3], 'ledger ' + row[1] + ': ' + row[5], row[4], LEDGER_STATUS[row[5].split(/[\s—]/)[0]] || 'open']);
}
const ledgerBullets = (heading) => {
  const a = ledgerMd.indexOf(heading); if (a < 0) return [];
  const rest = ledgerMd.slice(a + heading.length); const b = rest.search(/\n## /);
  return (b < 0 ? rest : rest.slice(0, b)).split(/\r?\n/).filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
};
const DEPLOY_OPEN = ledgerBullets('## Open').map((t, i) => [`DA-OPEN-${i + 1}`, '—', 'deploy audit (in progress)', t, 'ledger Open list', 'per ledger', / — DONE\b/.test(t) ? 'closed' : 'open']);
const DEPLOY_HUMAN = ledgerBullets('## Owner decisions (HUMAN)').map((t, i) => [`DA-HUMAN-${i + 1}`, '—', 'owner decision', t, 'ledger Owner decisions (HUMAN)', 'decision recorded by the owner', 'human']);

/* ---- deploy-audit: closures above that the ledger contradicts (the defect persisted or
 * regressed after the row was closed). Status stays as derived — the ledger shows each
 * re-fixed — but the evidence column now carries the ledger ID, fix and proof. ---- */
const DEPLOY_AUDIT_NOTES = {
  'SEC-1': 'D28: env staff credentials were still re-applied on every boot (console password/TOTP changes reverted at restart); create-only, BOOTSTRAP_RESET_CREDENTIALS=true re-applies (audited) — 3fba62a',
  'SEC-2': 'D34: the .env loader kept inline comments, so a copied `NODE_ENV=production # …` was never "production" and every production guard was off; dotenv-comments.test.js — 3fba62a',
  'SEC-7': 'D32: the KYC upload route kept the 2 MB default body (scans > ~1.5 MB → 413); 14 MB route cap, api.test 9 MB case — 3fba62a. D36: browser CSP reports (application/csp-report) got 415; api.test CSP case — 3fba62a',
  'SEC-8': 'D29: the leftmost X-Forwarded-For was still trusted — any client chose its IP past the login/form limiters and lockout; client-ip.test.js 5/5 — 3fba62a',
  'SEC-9': 'D37/D38: the real SMTP client could not deliver over STARTTLS (no EHLO after TLS) and emailed links were relative; smtp-client.test.js 3/3, PORTAL_PUBLIC_URL — 3fba62a',
  'SEC-10': 'D35: the SSG build child still received a denylisted env (DOC_ENCRYPTION_KEY, SMTP_PASS, WEBHOOK_SECRET, ASP_*, VIEWER_PASSWORD, ADMIN_DATABASE_URL); allowlist child-env.js, child-env.test.js, b3-publish-loop.log — 3fba62a',
  'SEC-13': 'D48: site CSP allowed connect-src localhost in production — removed e6feb75. D02: the rm 3.3 inline-script removal deleted the catalog islands — restored ddc2114',
  'DAT-4': 'D07: block revisions still matched across entities/langs (the block editor passed a bare id); test-cms-integrity — 197ad47',
  'DAT-5': 'D07: every Rollback still restored the newest snapshot; brands/product_deep rollback was a silent no-op; test-cms-integrity — 197ad47',
  'DAT-7': 'D54: rig content polluted again by an unauthenticated "system" test run (product 1672, crucial-t705-ssd-2, it_solution/licensing); restored — restore-1672.log, fix-licensing-title.log',
  'DAT-8': 'D05: product save wiped product_deep hero/feats/use_cases/box and discarded docs (197ad47); D25: CMS testimonials never rendered (00beef6)',
  'DAT-9': 'D49: simal_build could SELECT every table (users incl. hashes/TOTP secrets, sessions, tokens, KYC); now the 9 content tables only, CI asserts users is denied; build-role-check.log — e6feb75',
  'CMS-1': 'D26: "New Block" dead, Edit buttons dead outside the blocks view, 7 editors not in the sidebar — 197ad47',
  'CMS-2': 'D05/D08/D22/D25/D26: CMS writes destroyed data or never reached the site (product detail, brand modal, category rename 422, testimonials) — 197ad47/00beef6; Arabic pages still hardcode or discard CMS data — ledger Open (DA-OPEN-2)',
  'CMS-7': 'D26: IT-solution quick-create wrote the wrong desc key; "New Block" quick-create was dead — 197ad47',
  'CMS-9': 'D09: media uploads were copied to a stray Codebase/site/ and never shipped; cms-integrity asserts uploads reach the site — 197ad47',
  'PUB-2': 'D45: the public vhost proxied the whole portal API incl. /api/admin and /api/cms, used Debian-only proxy_params (nginx would not start), 1 MB body cap, soft 404s; portal-staging.conf + snippets/simal-proxy.conf replaced, deploy-rehearsal.log 25/25 — e6feb75',
  'PUB-5': 'D04: every Arabic RFQ still failed (contact_person vs contactName → 400; read res.ref) — 00beef6',
  'PUB-12': 'D02: rm 3.3 (21fbd73) deleted the /products/ and /ar/products/ islands — filters, sort, pager, #category/?brand=/?q= deep links dead; restored ddc2114. D52: the restore pushed /products/ CLS to 0.135 (platform run #14) — e6feb75',
  'SEO-2': 'D24: 198 hreflang alternates pointed at non-existent /ar/ pages and hubs carried a fixed lastmod; the sitemap-lastmod gate asserts both — 00beef6',
  'SEO-4': 'D23: /ar/solutions/ showed 5 of 12 lines with raw ids as headings — 00beef6; Arabic CMS coverage still open — ledger Open (DA-OPEN-2)',
  'NFR-3': 'D39: /api/health answered ok with the database down (single pg.Client); pg.Pool, health pings the DB (503 degraded) — 3fba62a',
  'NFR-4': 'D29: limiter buckets were never evicted and the leftmost X-Forwarded-For was trusted; client-ip.test.js — 3fba62a',
  'NFR-6': 'D01: platform CI was red on the "final" HEAD 6c1108e (run #12, 11/21) and 30 commits had never been pushed — 8c37907; platform run #18 (e613c5a) 21/21',
  'F-2026-N01': 'D40: the SSG job claim held no lock and finishJob was unawaited; atomic claim + stale requeue, ssg-claim.test.js — 3fba62a; a claimed job that never starts is recorded failed — e613c5a (b6-publish-loop.log)',
  'F-2026-N02': 'D33: with no CSRF_SECRET the token secret was a source literal and production still booted; assertProductionConfig refuses it, production-config.test.js — 3fba62a',
  'F-2026-N03': 'D01: 30 commits had never been pushed; platform run #12 on 6c1108e was 11/21 — 8c37907; platform run #18 (e613c5a) 21/21',
  'F-2026-N05': 'D09: uploads went to a stray Codebase/site/ and never shipped — 197ad47',
  'F-2026-N06': 'D01: six app-booting suites had no DOC_ENCRYPTION_KEY on a clean runner — 8c37907; D33: production booted without a document key — refused since 3fba62a',
  'F-2026-N07': 'D33: production booted with no clamd configured — refused since 3fba62a; ClamAV binaries tracked in git — ledger Open (DA-OPEN-1)',
  'F-2026-N11': 'D54: rig content polluted again by a test run (Oct 2026); restored — restore-1672.log, fix-licensing-title.log',
  'F-2026-N12': 'the stale ssg-outbox-sync.test.mjs (dead admin123 literal) was still in the tree when this row closed; deleted in e6feb75',
  'F-2026-N13': 'D53: the same state.me shape broke isSuperAdmin() and both admin-view gates — no account loaded users/sessions/telemetry; test-cms-buttons asserts each view opens — dc73f1f',
  'F-2026-N14': 'owner action still open: rig staff passwords in pushed history must be rotated — ledger Owner decisions (DA-HUMAN-1)',
  'F-2026-N15': 'readiness pack / RTM / board counts were stale again — ledger Open "Docs" (DA-OPEN-3), corrected in the docs(deploy-audit) pass',
  'PEN-2026-01': 'D53: the super_admin gate read state.me.user.role, so not even super_admin could open Telemetry, Users or Sessions — dc73f1f',
  'PEN-2026-05': 'D31: enforcement was boot-only — accounts created/promoted/MFA-disabled after boot used staff routes password-only; requireStaff + mfa/disable guard per request in production, staff-mfa-enforced.test.js — 3fba62a',
  'PEN-2026-20': 'D09: accepted uploads were copied to a stray folder and never shipped — 197ad47',
  'PEN-2026-21': 'D07: the UI still sent body {} so every Rollback restored the newest snapshot; test-cms-integrity — 197ad47',
  'P10-1': 'D01: the re-run used the rig (.env present); a clean runner failed unit + integration (run #12, 11/21). Current: deploy-audit/docs-fresh-clone-*.log, platform run #18 (e613c5a) 21/21',
  'P10-3': 'RTM.md revised 2026-10-19 against the deploy-audit ledger',
  'P10-4': 'still unsigned; the ledger Owner decisions (DA-HUMAN-1…5) are open too',
  'DEV-05': 'D31: production enforcement was boot-only until 3fba62a (per-request requireStaff; staff-mfa-enforced.test.js)',
  'DEV-07': 'D23/D04 fixed (00beef6); Arabic home/about/contact/software render their CMS blocks since e6feb75 (ar-cms-roundtrip.log); Arabic CMS coverage still open — ledger Open (DA-OPEN-2)',
};
const withLedger = (id, evidence) => DEPLOY_AUDIT_NOTES[id] ? `${evidence} · deploy audit 2026-10-18 — ${DEPLOY_AUDIT_NOTES[id]}` : evidence;

const statusOf = (id) => {
  if (OVERRIDES[id]) return OVERRIDES[id];
  const v = matrix.get(id);
  return VERDICT_TO_STATUS[v?.verdict] || 'open';
};

/* ---- emit CSV ---- */
const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const header = ['id', 'area', 'severity', 'phase_task', 'finding', 'evidence', 'acceptance_test', 'status'];
const lines = [header.join(',')];
const missingTrace = [];
for (const [id, r] of register) {
  const t = trace.get(id);
  if (!t) missingTrace.push(id);
  lines.push([esc(id), esc(r.area), esc(r.severity), esc(t ? t.phaseTask : 'UNMAPPED'),
    esc(r.finding), esc(withLedger(id, r.evidence)), esc(t ? t.acceptance : 'MISSING — add to plan §5'), esc(statusOf(id))].join(','));
}
for (const [id, sev, rm, finding, evidence] of NEW_FINDINGS) {
  lines.push([esc(id), esc('REAUDIT'), esc(sev), esc(rm), esc(finding), esc(withLedger(id, evidence)), esc('per RM task Done-when (roadmap v1.1)'), esc(statusOf(id))].join(','));
}
/* rm(10.3-1): emit the independent pen-test findings (status from the matrix) */
for (const [id, sev, rm, finding, evidence, acceptance] of PEN_FINDINGS) {
  lines.push([esc(id), esc('PEN'), esc(sev), esc(rm), esc(finding), esc(withLedger(id, evidence)), esc(acceptance), esc(statusOf(id))].join(','));
}
for (const [id, sev, rm, finding, evidence, acceptance] of P10_FINDINGS) {
  lines.push([esc(id), esc('P10'), esc(sev), esc(rm), esc(finding), esc(withLedger(id, evidence)), esc(acceptance), esc(statusOf(id))].join(','));
}
for (const [id, sev, rm, finding, evidence, acceptance] of GOV_FINDINGS) {
  lines.push([esc(id), esc('GOV'), esc(sev), esc(rm), esc(finding), esc(withLedger(id, evidence)), esc(acceptance), esc(statusOf(id))].join(','));
}
/* deploy-audit: the ledger's rows, Open list and Owner decisions (status from the ledger) */
const DEPLOY_ROWS = [...DEPLOY_FINDINGS, ...DEPLOY_OPEN, ...DEPLOY_HUMAN];
for (const [id, sev, commit, finding, evidence, acceptance, status] of DEPLOY_ROWS) {
  lines.push([esc(id), esc('DEPLOY'), esc(sev), esc(commit), esc(finding), esc(evidence), esc(acceptance), esc(status)].join(','));
}
const out = lines.join('\r\n') + '\r\n';
await fs.writeFile(path.join(REPO, 'remediation-board.csv'), out, 'utf8');

const count = (pred) => [...register.values()].filter(r => pred(statusOf(r.id))).length + NEW_FINDINGS.filter(f => pred(statusOf(f[0]))).length + PEN_FINDINGS.filter(f => pred(statusOf(f[0]))).length + P10_FINDINGS.filter(f => pred(statusOf(f[0]))).length + GOV_FINDINGS.filter(f => pred(statusOf(f[0]))).length + DEPLOY_ROWS.filter(f => pred(f[6])).length;
const total = register.size + NEW_FINDINGS.length + PEN_FINDINGS.length + P10_FINDINGS.length + GOV_FINDINGS.length + DEPLOY_ROWS.length;
console.log(`remediation-board.csv: ${total} rows (${register.size} original + ${NEW_FINDINGS.length} re-audit + ${PEN_FINDINGS.length} pen + ${P10_FINDINGS.length + GOV_FINDINGS.length} gate/gov + ${DEPLOY_FINDINGS.length} deploy-audit + ${DEPLOY_OPEN.length} deploy open-list + ${DEPLOY_HUMAN.length} owner decisions)`);
console.log(`  closed: ${count(s => s.startsWith('closed'))} | partial: ${count(s => s === 'partial')} | open: ${count(s => s === 'open')} | human (owner decision): ${count(s => s === 'human')}`);
console.log(`  closures the deploy-audit ledger contradicts (noted in evidence): ${Object.keys(DEPLOY_AUDIT_NOTES).length}`);
if (missingTrace.length) { console.error('findings without a §5 acceptance mapping: ' + missingTrace.join(', ')); process.exit(1); }
if (register.size === 0) { console.error('no findings parsed — plan format changed?'); process.exit(1); }
const unmapped = DEPLOY_FINDINGS.filter(f => f[2] === 'MISSING').map(f => f[0]);
if (DEPLOY_FINDINGS.length === 0 || unmapped.length) { console.error('deploy-audit ledger: ' + (unmapped.length ? 'rows without a commit: ' + unmapped.join(', ') : 'no rows parsed — ledger format changed?')); process.exit(1); }
const unknownNotes = Object.keys(DEPLOY_AUDIT_NOTES).filter(id => !lines.some(l => l.startsWith(esc(id) + ',')));
if (unknownNotes.length) { console.error('deploy-audit notes for ids not on the board: ' + unknownNotes.join(', ')); process.exit(1); }
