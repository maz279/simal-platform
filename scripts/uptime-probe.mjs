// scripts/uptime-probe.mjs — rm(9.3-2)/NFR-3: uptime probe WITH alerting.
// Not a replacement for hypercare-daily.js (that script boots its own in-process
// portal, so stopping the REAL portal could never make it fail — v1.2 blocker).
// This probe hits the real public origin and exits 0/1; on failure it POSTs one
// alert to the observability webhook. Schedule every 5 minutes:
//   rig:     schtasks /Create /TN SimalUptime /SC MINUTE /MO 5 /TR "cmd.exe /c cd /d <Codebase> && tools\node\node.exe scripts\uptime-probe.mjs >> scratch\uptime.log 2>&1"
//   staging: cron */5 * * * *
import fs from 'node:fs';
const ORIGIN = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:8100';
/* the alert hook comes from the environment; when absent (e.g. a bare scheduled
 * task) fall back to apps/portal/.env — guarded so CI/plain checkouts skip the
 * alert but still exit non-zero on failure. */
let HOOK = process.env.OBSERVABILITY_WEBHOOK_URL;
if (!HOOK) {
  try {
    const envTxt = fs.readFileSync(new URL('../apps/portal/.env', import.meta.url), 'utf8');
    HOOK = (envTxt.match(/^OBSERVABILITY_WEBHOOK_URL=(.*)$/m) || [])[1]?.trim() || null;
  } catch { /* no .env — alerting disabled */ }
}
let ok = false, detail = '';
try {
  const r = await fetch(ORIGIN + '/api/health', { signal: AbortSignal.timeout(5000) });
  ok = r.ok; detail = 'HTTP ' + r.status;
} catch (e) {
  detail = String(e.cause?.code || e.message);
}
if (!ok && HOOK) {
  await fetch(HOOK, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: `[simal] UPTIME FAIL ${ORIGIN}/api/health — ${detail}`, ts: Date.now() }) })
    .catch(() => { /* a sink outage must not mask the non-zero exit */ });
}
console.log(`${ok ? 'UP' : 'DOWN'} ${ORIGIN}/api/health — ${detail}`);
process.exit(ok ? 0 : 1);
