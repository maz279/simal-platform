// scripts/ci/a11y.mjs — P0-3(e) gate (guards the WCAG work of Phase 6)
// Serves apps/site/dist via dev-edge, loads each key page in headless
// Chrome, injects axe-core and fails on any wcag2a/wcag2aa/wcag21a/wcag21aa
// violation (rm(9.2-3): plus wcag22a/wcag22aa — axe-core ships the SC 2.5.8
// target-size rule under those tags). Also audits the AUTHENTICATED CMS console
// (rm(9.2-3)/A11Y residue): boots a throwaway portal (JSON store), injects the
// session cookie via CDP and runs the same axe tags over cms.html. Then sweeps
// EN + AR pages at 320/901/1024/1280px for WCAG 1.4.10 Reflow (no sideways
// scroll, nothing clipped). Chrome path: CHROME_PATH env or the conventional
// locations.
import { spawn } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { REPO, bootApp, login, adminUrlFromEnv, pgReachable, scratchDatabase } from './lib.mjs';

const PAGES = (process.env.GATE_A11Y_PAGES || '/,/products/,/brands/,/insights/,/software/,/contact/,/about/').split(',');
// SITE_DIST (relative to the repo root) is honoured by dev-edge, which serves the pages
const SITE_DIST = process.env.SITE_DIST || 'apps/site/dist';
if (!existsSync(path.join(REPO, SITE_DIST, 'index.html'))) {
  console.error(`a11y: ${SITE_DIST} is missing — run \`npm run build\` in apps/site (or bringup --build) first.`);
  process.exit(2);
}
const EDGE_PORT = Number(process.env.GATE_EDGE_PORT || 18110);
const CDP_PORT = Number(process.env.GATE_CDP_PORT || 18111);
const ORIGIN = `http://127.0.0.1:${EDGE_PORT}`;
const AXE_SRC = await fs.readFile(path.join(REPO, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const listening = (port, host = '127.0.0.1') => new Promise((resolve) => {
  const s = net.connect({ port, host, timeout: 1200 });
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('timeout', () => { s.destroy(); resolve(false); });
  s.once('error', () => resolve(false));
});

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

const chromeBin = chromePath();
if (!chromeBin) {
  console.error('a11y: no Chrome/Chromium found — set CHROME_PATH');
  process.exit(2);
}

/* ---- start dev-edge + chrome ---- */
const edge = spawn(process.execPath, ['scripts/dev-edge.mjs'], {
  env: { ...process.env, PORT: String(EDGE_PORT) }, stdio: 'ignore',
});
const chrome = spawn(chromeBin, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,900',
], { stdio: 'ignore' });

let ok = false;
for (let i = 0; i < 30 && !ok; i++) {
  ok = (await listening(EDGE_PORT)) && (await listening(CDP_PORT));
  if (!ok) await sleep(400);
}
if (!ok) { console.error('a11y: dev-edge or chrome did not start'); edge.kill('SIGKILL'); chrome.kill('SIGKILL'); process.exit(2); }

const tab = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 1; const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const id = msgId++; pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');

async function axePage(pagePath) {
  const loadPromise = new Promise(resolve => {
    const handler = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', handler);
          resolve();
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
  });
  await send('Page.navigate', { url: ORIGIN + pagePath });
  await Promise.race([loadPromise, sleep(3500)]);
  await sleep(1000); // hydrate islands before scanning
  return axeEval();
}

/* rm(9.2-3): the CMS console is a staff-facing PAGE too — audit the authenticated
 * cms.html. Boots a throwaway portal with generated credentials. The console's
 * content API is SQL-backed (cms.service), so prefer a scratch PostgreSQL database
 * — on it the console renders its REAL panels (tables, blocks, announcements);
 * JSON mode still works but several panels render their load-failure states.
 * The kyc_sid session cookie is injected via CDP (Network.setCookie). */
async function cmsAxePage() {
  const adminUrl = await adminUrlFromEnv(); /* GATE_ADMIN_URL > ADMIN_DATABASE_URL > portal .env */
  const usePg = await pgReachable(adminUrl);
  const scratch = usePg
    ? await scratchDatabase(adminUrl, 'a11y').catch((e) => { console.warn('a11y: scratch DB provisioning failed — auditing the JSON-store console instead:', e.message); return null; })
    : null;
  const boot = await bootApp(scratch ? { mode: 'pg', databaseUrl: scratch.url, mfa: true } : { mode: 'json' });
  try {
    const cookie = await login(boot.base, boot.creds.adminEmail, boot.creds.adminPassword, boot.creds.adminTotp);
    if (!cookie) return { error: 'cms session login failed' };
    const sid = cookie.replace(/^kyc_sid=/, '');
    await send('Network.enable');
    const setC = await send('Network.setCookie', { name: 'kyc_sid', value: sid, url: boot.base + '/' });
    if (!setC.result?.success) return { error: 'Network.setCookie rejected the session cookie' };
    const loadPromise = new Promise(resolve => {
      const handler = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', handler); resolve(); }
        } catch { /* keep waiting */ }
      };
      ws.addEventListener('message', handler);
    });
    await send('Page.navigate', { url: boot.base + '/cms.html' });
    await Promise.race([loadPromise, sleep(3500)]);
    await sleep(2500); // the console boots its panels via fetch() after load
    const res = await axeEval();
    return { base: boot.base, engine: usePg ? 'pg' : 'json', ...res };
  } finally {
    await boot.stop().catch(() => {});
    if (boot.app?.repos?.client) await boot.app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
}

/* shared axe runner for the current tab (axe already parameterised per call site) */
async function axeEval() {
  await send('Runtime.evaluate', { expression: AXE_SRC });
  const r = await send('Runtime.evaluate', {
    awaitPromise: true, returnByValue: true, timeout: 30000,
    expression: `new Promise(resolve => {
      if (!window.axe) { resolve({error: 'axe not injected'}); return; }
      window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'] }, resultTypes: ['violations'] })
        .then(r => resolve({ violations: r.violations.map(v => ({
          id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
          sample: (v.nodes[0]?.target || []).join(' ').slice(0, 80)
        })) }))
        .catch(e => resolve({ error: String(e) }));
    })`,
  });
  if (r.exceptionDetails) return { error: r.exceptionDetails.text };
  return r.result?.result?.value || { error: 'no result' };
}

/* rm(9.1-3 browser sweep): WCAG 2.1 SC 1.4.10 Reflow, which axe-core does not test, plus
 * the desktop-nav breakpoints. At each width a page must not scroll sideways, and no text
 * or control inside <main> may sit outside the viewport (clipped by an overflow:hidden
 * ancestor) unless a horizontally scrollable container holds it (tables, tab strips).
 * English and Arabic (RTL) both: the AR nav overflowed at 901–1100px and the AR hero card
 * was clipped at 320px, while every axe run stayed green. */
const REFLOW_PAGES = (process.env.GATE_REFLOW_PAGES || '/,/products/,/products/dell-15-laptop-14th-gen-intel-core-3/,/solutions/,/about/,/ar/,/ar/products/,/ar/solutions/,/ar/about/').split(',');
const REFLOW_WIDTHS = [320, 901, 1024, 1280];
const REFLOW_PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const inScroller = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
    const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') return true; } return false; };
  const clipped = [];
  for (const e of document.querySelectorAll('main :is(a,button,input,select,textarea,img,h1,h2,h3,p,li,td,th,label)')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || (r.left >= -1 && r.right <= vw + 1)) continue;
    if (e.closest('[aria-hidden="true"],[hidden]') || getComputedStyle(e).visibility === 'hidden' || inScroller(e)) continue;
    clipped.push(e.tagName.toLowerCase() + ' "' + (e.innerText || e.alt || '').trim().slice(0, 40) + '" at ' + Math.round(r.left) + '..' + Math.round(r.right));
  }
  return { overflow: document.documentElement.scrollWidth - vw, clipped };
})()`;

async function reflowPage(pagePath, width) {
  // below 768px emulate a phone (overlay scrollbars, as on real devices); desktop widths keep
  // the classic scrollbar, which is what a narrow desktop window really has
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  const loaded = new Promise((resolve) => {
    const h = (ev) => { try { if (JSON.parse(ev.data).method === 'Page.loadEventFired') { ws.removeEventListener('message', h); resolve(); } } catch { /* ignore */ } };
    ws.addEventListener('message', h);
  });
  await send('Page.navigate', { url: ORIGIN + pagePath });
  await Promise.race([loaded, sleep(3500)]);
  await sleep(700);
  const r = await send('Runtime.evaluate', { expression: REFLOW_PROBE, returnByValue: true });
  const own = r.result?.result?.value || { error: 'no result' };
  /* Wide-font pass: the EN stack is 'Segoe UI', system-ui, so the layout must also hold
   * where that resolves to a wider face (DejaVu Sans on Linux, which the CI runner has).
   * Verdana has near-identical metrics, so a Windows run catches what the runner sees. */
  await send('Runtime.evaluate', { expression: `(() => { const s = document.createElement('style');
    s.textContent = 'html,body,body *{font-family:Verdana,"DejaVu Sans",sans-serif !important}';
    document.head.appendChild(s); })()` });
  await sleep(300);
  const w = await send('Runtime.evaluate', { expression: REFLOW_PROBE, returnByValue: true });
  const wide = w.result?.result?.value || { error: 'no result' };
  return { own, wide };
}

const failures = [];
try {
  for (const p of PAGES) {
    const res = await axePage(p.trim());
    if (res.error) { failures.push(`page ${p}: axe failed — ${res.error}`); continue; }
    const serious = res.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    const all = res.violations;
    console.log(`page ${p}: ${all.length} violation rule(s) [${serious.length} serious/critical]`);
    for (const v of all.slice(0, 8)) {
      failures.push(`page ${p}: [${v.impact}] ${v.id} — ${v.help} ×${v.nodes} (e.g. ${v.sample})`);
    }
  }
  /* rm(9.2-3): the authenticated CMS console, same axe tag set (incl. target-size) */
  if (process.env.GATE_A11Y_SKIP_CMS !== '1') {
    const cms = await cmsAxePage();
    if (cms.error) {
      failures.push(`cms.html (authenticated): axe failed — ${cms.error}`);
    } else {
      const serious = cms.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      console.log(`cms.html (authenticated, ${cms.engine} store): ${cms.violations.length} violation rule(s) [${serious.length} serious/critical]`);
      for (const v of cms.violations.slice(0, 8)) {
        failures.push(`cms.html (authenticated): [${v.impact}] ${v.id} — ${v.help} ×${v.nodes} (e.g. ${v.sample})`);
      }
    }
  }
  for (const p of REFLOW_PAGES) {
    const line = [];
    for (const w of REFLOW_WIDTHS) {
      const { own, wide } = await reflowPage(p.trim(), w);
      const bad = [];
      for (const [tag, res] of [['', own], [' (wide font)', wide]]) {
        if (res.error) { bad.push(`reflow ${p} @${w}px${tag}: probe failed — ${res.error}`); continue; }
        if (res.overflow > 1) bad.push(`reflow ${p} @${w}px${tag}: page scrolls sideways by ${res.overflow}px (WCAG 1.4.10)`);
        for (const c of res.clipped.slice(0, 3)) bad.push(`reflow ${p} @${w}px${tag}: clipped outside the viewport — ${c}`);
      }
      line.push(`${w}:${bad.length ? 'FAIL' : 'ok'}`);
      failures.push(...bad);
    }
    console.log(`reflow ${p}: ${line.join(' ')}`);
  }
  await send('Emulation.clearDeviceMetricsOverride');
  console.log('\n=== GATE a11y (WCAG 2.1/2.2 A/AA + authenticated CMS, Phase 6 + rm(9.2-3)) ===');
  if (!failures.length) { console.log('PASS — 0 violations'); process.exit(0); }
  console.log(`FAIL — ${failures.length} violation finding(s) across ${PAGES.length} pages (expected red until Phase 6):`);
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
} finally {
  ws.close(); edge.kill('SIGKILL'); chrome.kill('SIGKILL');
}
