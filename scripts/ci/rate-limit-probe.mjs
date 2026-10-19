// scripts/ci/rate-limit-probe.mjs — rm(9.4-2)/rm(9.4-3) / NFR-4: edge-vs-app
// rate-limit transcript. Fires N login attempts with UNIQUE emails against the
// edge origin so the app's per-account limiter (10/5min, keyed on email+IP) never
// fires and the app IP limiter (120/min) stays far away — every rejection past
// the burst therefore comes from the EDGE (Server: nginx), proving the two
// layers separately (roadmap 9.4-2: v1.1's same-email loop mixed app 429s with
// edge responses on the same request #11).
//
// Usage: node scripts/ci/rate-limit-probe.mjs [edge-origin] [app-origin]
//   defaults: http://127.0.0.1:8443 (nginx rig rehearsal) / http://127.0.0.1:8090
// Phase A (edge): expect 11 × 401 then (N-11) × 429 — 11 immediate = rate slot +
//   burst=10 nodelay, then 1 per 30 s. (nginx stamps its own Server header on
//   proxied responses too, so the header alone cannot attribute a response —
//   phase B provides the attribution.)
// Phase B (app, same unique emails): expect N × 401 — the identical loop against
//   the app directly is never limited at this volume (IP limiter is 120/min), so
//   every 429 in phase A is proven to come from the EDGE, not the app.
const ORIGIN = process.argv[2] || process.env.RATE_PROBE_ORIGIN || 'http://127.0.0.1:8443';
const APP_ORIGIN = process.argv[3] || process.env.RATE_PROBE_APP_ORIGIN || 'http://127.0.0.1:8090';
const N = Number(process.env.RATE_PROBE_N || 15);
const RUN = Date.now().toString(36); // unique emails per run — never trip the per-account limiter

async function loop(label, origin, emails) {
  const lines = [];
  for (let i = 0; i < emails.length; i++) {
    const r = await fetch(origin + '/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: emails[i], password: 'wrong-password-x' }),
    });
    lines.push(`#${String(i + 1).padStart(2, '0')} ${r.status} server=${r.headers.get('server') || '-'} retry-after=${r.headers.get('retry-after') || '-'}`);
  }
  console.log(`${label} vs ${origin}:`);
  console.log(lines.map((l) => '  ' + l).join('\n'));
  return lines.map((l) => Number(l.split(' ')[1]));
}

const emails = Array.from({ length: N }, (_, i) => `probe-${RUN}-${i + 1}@rate-probe.invalid`);
const edge = await loop('EDGE', ORIGIN, emails);
const app = await loop('APP ', APP_ORIGIN, emails.map((e, i) => e.replace(`-${i + 1}@`, `-b${i + 1}@`)));

const edgeOk = edge.slice(0, 11).every((c) => c === 401) && edge.slice(11).every((c) => c === 429 || c === 503);
const appOk = app.every((c) => c === 401);
console.log(`edge: ${edge.slice(0, 11).filter((c) => c === 401).length}/11 app-401s then ${edge.slice(11).filter((c) => [429, 503].includes(c)).length}/${N - 11} edge-limited (429/503)`);
console.log(`app : ${app.filter((c) => c === 401).length}/${N} 401s (direct loop never limited)`);
const ok = edgeOk && appOk;
console.log(ok ? 'PASS — nginx login_zone burst=10 nodelay proven: 11 immediate then 1/30s; the app layer never fired, so every 429 is edge-attributed'
               : 'FAIL — transcript does not match 11×401-then-edge-limited, or the direct app loop was limited');
process.exit(ok ? 0 : 1);
