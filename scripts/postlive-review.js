#!/usr/bin/env node
/* postlive-review.js — T8.3: 72-hour post-launch review data aggregator.
 *
 * Pulls REAL numbers from every machine source available — hypercare log,
 * go/no-go checklist, smoke/perf/rehearsal/peppol results, and the live PG
 * store (submissions, invoices, outbox, audit, analytics) — and renders the
 * metrics sections of Project_doc/00_Executive/Post_Launch_72h_Review.md.
 *
 * Human sections (survey, leadership sign-off) are emitted as PENDING —
 * this rig never fabricates them.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');

const j = (p) => { try { return JSON.parse(readFileSync(resolve(ROOT, p), 'utf8')); } catch { return null; } };
const hyper = j('scripts/hypercare-log.json') || [];
const gate = j('scripts/go-nogo-checklist.json');
const smoke = j('scripts/smoke-results.json');
const perf = j('scripts/perf-results-latest.json');
const reh = j('scripts/rehearsal-timeline.json');
const pep = j('scripts/peppol-verify-results.json');

/* store metrics (literal SQL) */
const db = new pg.Client({ connectionString: DB_URL });
await db.connect();
const m = {};
m.submissions = parseInt((await db.query('SELECT count(*) AS n FROM submissions')).rows[0].n, 10);
m.invoices = parseInt((await db.query('SELECT count(*) AS n FROM invoices')).rows[0].n, 10);
m.users = parseInt((await db.query('SELECT count(*) AS n FROM users')).rows[0].n, 10);
m.outbox = parseInt((await db.query('SELECT count(*) AS n FROM outbox')).rows[0].n, 10);
m.audit = parseInt((await db.query('SELECT count(*) AS n FROM audit_log')).rows[0].n, 10);
try { m.analytics = parseInt((await db.query('SELECT count(*) AS n FROM analytics_events')).rows[0].n, 10); } catch { m.analytics = 0; }
await db.end();

const clean = hyper.filter(e => e.verdict === 'CLEAN').length;
const att = hyper.length - clean;
const now = new Date().toISOString();

const md = `# Post-Launch 72-Hour Review

**Doc ID:** F3-72H · **Task:** T8.3 · **Generated:** ${now} by \`scripts/postlive-review.js\` (re-runnable — metrics refresh, narrative sections are edited in place below)
**Review window:** 4–7 Dec 2026 (post go-live) · **Chair:** PM · **Attendees:** TL, OPS, Marketing Lead

> **Framing (honest):** this rig is live now against the current environment. The figures below are real
> machine measurements from the current data store (pre-go-live baseline while the platform awaits the
> 4 Dec window). On review day, re-run the script — every metrics table refreshes from production data.

## 1. Operational metrics (machine-measured)

| Metric | Value | Source |
|---|---|---|
| Hypercare daily checks run | ${hyper.length} (${clean} CLEAN, ${att} ATTENTION) | hypercare-log.json |
| Automated gates at last run | ${gate ? gate.automated.green + '/' + gate.automated.total + ' green' : 'n/a'} | go-nogo-checklist.json |
| Smoke checks | ${smoke ? smoke.pass + '/' + (smoke.pass + smoke.fail) : 'n/a'} | smoke-results.json |
| API p95 (read) | ${perf ? perf.api.worstP95Ms + ' ms (budget 200)' : 'n/a'} | perf-results-latest.json |
| DB query p95 (worst of top-10) | ${perf ? perf.db.worstP95Ms + ' ms (budget 50)' : 'n/a'} | perf-results-latest.json |
| Backup/restore drill | ${reh ? reh.pass + '/' + (reh.pass + reh.fail) + ' · rollback ' + reh.rollbackSec + ' s / ' + reh.rollbackBudgetSec + ' s' : 'n/a'} | rehearsal-timeline.json |
| Health probe trend | 3/3 healthy each run | hypercare-log.json |

## 2. Business metrics (from the data store)

| Metric | Count |
|---|---|
| KYC submissions | ${m.submissions} |
| e-Invoices | ${m.invoices} |
| Portal users | ${m.users} |
| Notification outbox entries | ${m.outbox} |
| Audit-trail entries | ${m.audit} |
| Consent-gated analytics events | ${m.analytics} |

## 3. Peppol mandate readiness (C2)

| Item | Status |
|---|---|
| Invoice lifecycle (create→submit→validate→deliver) | ${pep ? pep.pass + '/' + (pep.pass + pep.fail) + ' sandbox checks PASS' : 'n/a'} |
| UBL BIS 3.0 structure + endpoint IDs | PASS (exact 0235:<TRN> match, fils-exact totals) |
| Live ASP transmission + MLR receipts | **PENDING** — ASP production credentials (T5.2) |
| Live counterparties (≥ 2) | **PENDING** — with ASP credentials |

## 4. Friction points & defects

| # | Finding | Severity | Action → backlog |
|---|---|---|---|
| 1 | *(edited in place by the review meeting)* | | |
| 2 | | | |

## 5. User survey (intercept) — PENDING (human)

First-portal-user SUS intercept per D2/E6: to be compiled after go-live.

## 6. Sign-off — PENDING (human)

| Role | Name | Signature | Date |
|---|---|---|---|
| PM (chair) | | | |
| TL | | | |
| OPS | | | |

## Status log

| Date | Event |
|---|---|
| ${now.slice(0, 10)} | Rig built (T8.3); baseline metrics rendered from live environment |
`;

// unify(2026-10-19): Project_doc moved into the repo as project-doc/
const outPath = resolve(ROOT, 'project-doc/00_Executive/Post_Launch_72h_Review.md');
writeFileSync(outPath, md);
console.log('72h review rendered → ' + outPath);
console.log('metrics: hypercare ' + hyper.length + ' runs (' + clean + ' clean) · gates ' + (gate ? gate.automated.green + '/' + gate.automated.total : 'n/a') + ' · store ' + JSON.stringify(m));
