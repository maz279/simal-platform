#!/usr/bin/env node
/* go-nogo-gate.js — T7.4: formal go/no-go evidence gate (E6 §6).
 *
 * Re-runs every AUTOMATED gate live, in order, and collects the human-gate
 * items as explicit PENDING entries. Writes scripts/go-nogo-checklist.json
 * and prints the decision table.
 *
 *   exit 0 = every automated gate green (humans still must sign the rest)
 *   exit 1 = at least one automated gate red → default answer is NO-GO
 *
 * Automated gates: freeze verify · parity · PG integration · smoke ·
 * security audit · performance budgets.
 * Human gates (recorded, not executed): UAT+SUS · ZAP/pen-test · Peppol
 * sandbox round-trip · DPIA · hypercare roster · go-live comms.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL is required (the simal_dev fallback was removed — credential rotated 2026-10)');
const ENV = { ...process.env, DATABASE_URL: DB_URL, NODE_KYC_TEST: '1' };

const checklist = [];

function runGate(name, script, { env = ENV } = {}) {
  const t0 = Date.now();
  try {
    const out = execFileSync('node', [script], { cwd: ROOT, env, encoding: 'utf8', timeout: 600000, stdio: ['ignore', 'pipe', 'pipe'] });
    const ms = Date.now() - t0;
    const summary = (out.trim().split('\n').filter(l => /^(ALL|PASS|FREEZE|SMOKE|SECURITY|REHEARSAL|PARITY|DB pass|API pass)/i.test(l)).slice(-3).join(' | ')) || 'exit 0';
    checklist.push({ gate: name, type: 'automated', status: 'GREEN', ms, evidence: summary });
    console.log('GREEN  ' + name + ' (' + (ms / 1000).toFixed(1) + 's) — ' + summary);
    return true;
  } catch (e) {
    const ms = Date.now() - t0;
    const tail = String(e.stdout || e.message || '').trim().split('\n').slice(-3).join(' | ');
    checklist.push({ gate: name, type: 'automated', status: 'RED', ms, evidence: tail });
    console.log('RED    ' + name + ' (' + (ms / 1000).toFixed(1) + 's) — ' + tail);
    return false;
  }
}

console.log('=== GO/NO-GO EVIDENCE GATE — ' + new Date().toISOString() + ' ===\n');

console.log('-- automated gates (re-run live now) --');
runGate('code freeze verifier (T7.1)', 'scripts/freeze-manifest.js');
runGate('parity checklist 32 checks (T6.2)', 'scripts/parity-checklist.js');
runGate('PG integration 27 tests', 'apps/portal/test/pg-integration-test.js');
runGate('production smoke 15 checks (T7.2)', 'scripts/smoke-test.js');
runGate('security audit 14 checks (T6.6)', 'scripts/security-audit.js');
runGate('performance budgets (T6.5)', 'scripts/perf-baseline.js');

console.log('\n-- human gates (recorded as PENDING — sign-off required) --');
const humanGates = [
  ['UAT: 26 scripts + SUS ≥ 80 (EN cohort)', 'T6.4 — scripts staged in Project_doc/04_Quality/UAT_Plan_and_Script.md'],
  ['Security: ZAP baseline + external pen-test (ASVS L2)', 'T6.6 external rig — scheduled pre-cutover'],
  ['Compliance: Peppol sandbox round-trip certified', 'T5.2 — ASP production credentials (20 Nov gate)'],
  ['Compliance: DPIA signed', 'C1 — process gate'],
  ['Operations: 72-hour staffed roster confirmed', 'F1 v2.0 — roster naming per E6'],
  ['Comms: partner migration notice sent (INT-6)', 'E6 T-7 checklist item'],
];
for (const [name, note] of humanGates) {
  checklist.push({ gate: name, type: 'human', status: 'PENDING', evidence: note });
  console.log('PENDING ' + name + ' — ' + note);
}

const automated = checklist.filter(c => c.type === 'automated');
const redCount = automated.filter(c => c.status === 'RED').length;
const out = {
  ts: new Date().toISOString(),
  automated: { total: automated.length, green: automated.length - redCount, red: redCount },
  human: { total: humanGates.length, pending: humanGates.length },
  verdict: redCount === 0 ? 'AUTOMATED GATES GREEN — human sign-offs outstanding (default: NO-GO until signed)' : 'AUTOMATED GATE RED — NO-GO',
  checklist,
};
writeFileSync(resolve(ROOT, 'scripts/go-nogo-checklist.json'), JSON.stringify(out, null, 2));

console.log('\n=== VERDICT ===');
console.log('automated: ' + out.automated.green + '/' + automated.length + ' green · human: ' + humanGates.length + ' pending');
console.log(out.verdict);
console.log('→ scripts/go-nogo-checklist.json');
process.exit(redCount ? 1 : 0);
