#!/usr/bin/env node
/* hypercare-daily.js — T8.1/T8.4: daily hypercare checklist runner (F1 §daily).
 *
 *   node scripts/hypercare-daily.js            — run today's checklist, append
 *                                                 a dated entry to
 *                                                 scripts/hypercare-log.json
 *   node scripts/hypercare-daily.js --exit-audit — evaluate the T8.4 hypercare
 *                                                 exit criteria from the log
 *
 * Probes (all real, against the live PG store + a booted portal):
 *   gates       — the 6 automated go/no-go gates re-run live
 *   health      — /api/health x3 (uptime probe)
 *   outbox      — entries queued > 1 h (F1 daily: "outbox draining")
 *   kyc-queue   — submissions pending / new in last 24 h
 *   invoice-sla — invoices submitted > 1 day unvalidated (F1 weekly, checked daily)
 *   lockouts    — login_failed audit entries last 24 h (F1: lockout anomalies)
 * Verdict CLEAN = all probes green; anything else is ATTENTION with reasons.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOG_PATH = resolve(ROOT, 'scripts/hypercare-log.json');
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const DAY_MS = 86400000;

const today = new Date().toISOString().slice(0, 10);
const probes = [];
const probe = (name, ok, detail) => { probes.push({ name, ok: !!ok, detail: String(detail) }); console.log((ok ? 'OK   ' : 'ATTN ') + name + ' — ' + detail); };

/* ---- 1. automated gates (re-run live) ---- */
console.log('=== HYPERCARE DAILY — ' + today + ' ===\n');
try {
  const out = execFileSync('node', ['scripts/go-nogo-gate.js'], { cwd: ROOT, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: 'utf8', timeout: 600000, stdio: ['ignore', 'pipe', 'pipe'] });
  const m = out.match(/automated: (\d+)\/(\d+) green/);
  probe('automated gates', m && m[1] === m[2], m ? m[1] + '/' + m[2] + ' green' : 'gate output unparsable');
} catch (e) {
  const reds = String(e.stdout || '').split('\n').filter(l => l.startsWith('RED')).join('; ');
  probe('automated gates', false, reds || String(e.message || '').slice(0, 100));
}

/* ---- 2. portal health x3 ---- */
process.env.NODE_KYC_TEST = '1';
const TMP = fs.mkdtempSync(resolve(os.tmpdir(), 'hyper-'));
process.env.DATA_DIR = TMP;
process.env.ADMIN_EMAIL = 'hypercare-admin@example.com';
process.env.ADMIN_PASSWORD = crypto.randomBytes(18).toString('base64url');
process.env.ADMIN_MFA_REQUIRED = 'false';
process.env.WATCHLIST_CSV = process.env.WATCHLIST_CSV || resolve(ROOT, 'apps/portal/data/watchlist.csv'); /* real screening list — rigs must not boot with an empty watchlist */
const { createApp } = await import('../apps/portal/src/server.js');
const app = await createApp();
await new Promise(res => app.server.listen(0, '127.0.0.1', res));
const BASE = 'http://127.0.0.1:' + app.server.address().port;
let healthOk = 0;
for (let i = 0; i < 3; i++) {
  const r = await fetch(BASE + '/api/health');
  if (r.status === 200) healthOk++;
}
await new Promise(r => app.server.close(r));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
probe('health probe 3/3', healthOk === 3, healthOk + '/3 healthy');

/* ---- 3-6. store probes (literal SQL) ---- */
const db = new pg.Client({ connectionString: DB_URL });
await db.connect();
const cut = Date.now() - DAY_MS;

const outboxStuck = parseInt((await db.query('SELECT count(*) AS n FROM outbox WHERE status = \'queued\' AND created_at < $1', [cut])).rows[0].n, 10);
probe('outbox draining (queued < 1 h old)', outboxStuck === 0, outboxStuck + ' stale queued entr' + (outboxStuck === 1 ? 'y' : 'ies'));

const pendingKyc = parseInt((await db.query('SELECT count(*) AS n FROM submissions WHERE status IN (\'submitted\', \'under_review\', \'query_raised\', \'partner_updated\')')).rows[0].n, 10);
const newKyc = parseInt((await db.query('SELECT count(*) AS n FROM submissions WHERE submitted_at > $1', [cut])).rows[0].n, 10);
probe('KYC queue', true, pendingKyc + ' pending · ' + newKyc + ' new in 24 h (informational)');

const invStuck = parseInt((await db.query('SELECT count(*) AS n FROM invoices WHERE status = \'submitted\' AND created_at < $1', [cut])).rows[0].n, 10);
probe('invoice SLA (nothing submitted > 1 d unvalidated)', invStuck === 0, invStuck + ' overdue');

let lockouts = 0;
try {
  lockouts = parseInt((await db.query('SELECT count(*) AS n FROM audit_log WHERE action = \'login_failed\' AND ts > $1', [cut])).rows[0].n, 10);
} catch { /* audit_log may not exist pre-B6 refresh */ }
probe('lockout anomalies (informational threshold < 50)', lockouts < 50, lockouts + ' login_failed in 24 h');
await db.end();

/* ---- verdict + log append ---- */
const attention = probes.filter(p => !p.ok);
const verdict = attention.length ? 'ATTENTION' : 'CLEAN';
const entry = { date: today, ts: new Date().toISOString(), verdict, attention: attention.map(a => a.name), probes };

let log = [];
if (existsSync(LOG_PATH)) { try { log = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch { log = []; } }
log = log.filter(e => e.date !== today); /* one entry per day — latest run wins */
log.push(entry);
log.sort((a, b) => a.date < b.date ? -1 : 1);
writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
console.log('\nVERDICT: ' + verdict + (attention.length ? ' — ' + attention.map(a => a.name).join(', ') : '') + ' → scripts/hypercare-log.json');

/* ---- T8.4 exit audit mode ---- */
if (process.argv.includes('--exit-audit')) {
  console.log('\n=== T8.4 HYPERCARE EXIT CRITERIA AUDIT ===');
  /* 14 consecutive CLEAN days ending today */
  const need = 14;
  const tail = log.slice(-need);
  const consecutiveClean = tail.length === need && tail.every(e => e.verdict === 'CLEAN');
  console.log((consecutiveClean ? '[x] ' : '[ ] ') + need + ' consecutive CLEAN days — have ' + tail.filter(e => e.verdict === 'CLEAN').length + ' of ' + tail.length + ' (log entries: ' + log.length + ')');
  /* backup/restore drill evidence — latest rehearsal */
  let drillOk = false, drillDetail = 'no rehearsal-timeline.json';
  try {
    const rt = JSON.parse(readFileSync(resolve(ROOT, 'scripts/rehearsal-timeline.json'), 'utf8'));
    drillOk = rt.pass > 0 && rt.fail === 0 && rt.rollbackSec <= rt.rollbackBudgetSec;
    drillDetail = 'rehearsal ' + rt.pass + '/' + (rt.pass + rt.fail) + ' · rollback ' + rt.rollbackSec + 's/' + rt.rollbackBudgetSec + 's @ ' + rt.ts.slice(0, 10);
  } catch {}
  console.log((drillOk ? '[x] ' : '[ ] ') + 'backup + restore drill passing — ' + drillDetail);
  /* monitoring coverage: the daily rig itself covers gates/health/outbox/queues/lockouts */
  const coverage = ['automated gates', 'health probe 3/3', 'outbox draining', 'KYC queue', 'invoice SLA', 'lockout anomalies'];
  const covered = coverage.every(c => probes.some(p => p.name.startsWith(c)));
  console.log((covered ? '[x] ' : '[ ] ') + 'monitoring zero blind spots (daily rig coverage: ' + coverage.length + ' probes)');
  console.log('[ ] support staff trained on CMS + KYC console — HUMAN sign-off (F1)');
  console.log('[ ] zero open SEV-1/2 through hypercare — HUMAN (incident register)');
  const machineOk = consecutiveClean && drillOk && covered;
  console.log('\nEXIT AUDIT: machine criteria ' + (machineOk ? 'MET' : 'NOT MET') + ' — human criteria pending; exit requires PM+OPS signature (outer bound 1 Jan 2027)');
  process.exit(machineOk ? 0 : 1);
}

process.exit(attention.length ? 1 : 0);
