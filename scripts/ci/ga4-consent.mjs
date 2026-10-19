// scripts/ci/ga4-consent.mjs — rm(8.4) gate (guards SEO-5 residue)
// Milestone 8.4: GA4 must load ONLY behind consent.
//   Static: build with PUBLIC_GA4_ID set -> ga4-id meta emitted, loader +
//     consent grants wired, CSP (all three sources) allows GA4 hosts;
//     build without it -> no meta (GA4 fully off). No inline loader script.
//   Browser (real Chrome via CDP, network capture — Task 8.4-3):
//     fresh profile: zero googletagmanager/analytics requests, no #ga4-src;
//     Reject: still zero; Save with analytics on: gtag/js requested once,
//     #ga4-src present, dataLayer config queued; reload (returning visitor):
//     gtag/js auto-loads with no click; withdrawal (settings -> analytics
//     off -> Save): page reloads and afterwards zero GA4 requests, grants
//     denied; Accept-all path re-grants and loads again. Zero CSP violations
//     mentioning GA4 hosts at every stage.
// Env: GATE_ADMIN_URL (required, scratch DB), CHROME_PATH (optional),
//      GA4_EVIDENCE_DIR (optional screenshot output for rm-evidence runs).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fsSync from 'node:fs';
import { promises as fsp } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { scratchDatabase, adminUrlFromEnv, runCapture, report, REPO, SITE_DIR } from './lib.mjs';

const GA_ID = 'G-GATE84TEST';
const OUT_A = 'dist-gate-ga4';
const OUT_B = 'dist-gate-ga4-noid';
const failures = [];
const check = (name, fn) => {
  try { fn(); console.log(`  ok ${name}`); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.log(`  FAIL ${name}: ${e.message}`); }
};
const acheck = async (name, fn) => {
  try { await fn(); console.log(`  ok ${name}`); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.log(`  FAIL ${name}: ${e.message}`); }
};

const adminUrl = process.env.GATE_ADMIN_URL || (await adminUrlFromEnv());
if (!adminUrl) { console.error('ga4-consent: set GATE_ADMIN_URL'); process.exit(2); }

const db = await scratchDatabase(adminUrl, 'ga4');
async function build(outDir, gaId) {
  const env = { DATABASE_URL: db.url, SITE_OUT_DIR: './' + outDir };
  if (gaId) env.PUBLIC_GA4_ID = gaId; else delete env.PUBLIC_GA4_ID;
  const r = await runCapture(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build'], { cwd: SITE_DIR, env, timeoutMs: 420000 });
  if (r.code !== 0) throw new Error(`build ${outDir} failed:\n` + r.out.split(/\r?\n/).slice(-20).join('\n'));
}
let server = null, chrome = null, ws = null;
try {
  console.log('[ga4-consent] building with GA4 ID…');
  await build(OUT_A, GA_ID);
  console.log('[ga4-consent] building without GA4 ID…');
  await build(OUT_B, null);

  const dirA = path.join(SITE_DIR, OUT_A);
  const html = await fsp.readFile(path.join(dirA, 'index.html'), 'utf8');
  const htmlB = await fsp.readFile(path.join(SITE_DIR, OUT_B, 'index.html'), 'utf8');
  const loader = await fsp.readFile(path.join(dirA, 'assets/js/ga4-loader.js'), 'utf8');
  const defaults = await fsp.readFile(path.join(dirA, 'assets/js/consent-defaults.js'), 'utf8');

  console.log('[ga4-consent] static checks…');
  check('ga4-id meta emitted only when ID set', () => {
    assert.ok(html.includes(`<meta name="ga4-id" content="${GA_ID}"`), 'meta missing in ID build');
    assert.ok(!htmlB.includes('name="ga4-id"'), 'meta leaked into no-ID build');
  });
  check('loader is external + ordered after consent-defaults', () => {
    const li = html.indexOf('ga4-loader.js'), di = html.indexOf('consent-defaults.js');
    assert.ok(li > 0 && di > 0 && li > di, `loader@${li} defaults@${di}`);
    assert.ok(loader.includes('googletagmanager.com/gtag/js'), 'loader lacks gtag/js');
    assert.ok(loader.includes('__simalConsentGrants'), 'loader lacks grants check');
    assert.ok(loader.includes('simal:consent-accepted'), 'loader lacks banner listener');
    assert.ok(defaults.includes('__simalConsentGrants'), 'defaults lack grants export');
  });
  check('no inline executable loader script in built HTML', () => {
    const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
    for (const m of noComments.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc=/.test(m[1]) || /application\/(ld\+)?json/i.test(m[1])) continue;
      assert.ok(!m[2].includes('gtag'), 'inline gtag code found');
      assert.ok(!m[2].trim(), 'inline executable script present');
    }
  });
  {
    const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
    const edge = await fsp.readFile(path.join(REPO, 'scripts/dev-edge.mjs'), 'utf8');
    const nginx = await fsp.readFile(path.join(REPO, 'infra/nginx/portal-staging.conf'), 'utf8');
    const siteBlock = nginx.slice(nginx.indexOf('server_name simalme.com'));
    check('meta CSP has GA4 hosts', () => {
      assert.match(meta, /script-src[^;]*\*\.googletagmanager\.com/);
      assert.match(meta, /connect-src[^;]*\*\.google-analytics\.com/);
      assert.match(meta, /connect-src[^;]*\*\.analytics\.google\.com/);
      assert.match(meta, /connect-src[^;]*\*\.googletagmanager\.com/);
    });
    check('dev-edge CSP has GA4 hosts', () => {
      assert.match(edge, /script-src 'self' https:\/\/\*\.googletagmanager\.com/);
      assert.match(edge, /connect-src[^;"]*\*\.analytics\.google\.com/);
    });
    check('nginx site-vhost CSP has GA4 hosts', () => {
      assert.match(siteBlock, /script-src 'self' https:\/\/\*\.googletagmanager\.com/);
      assert.match(siteBlock, /connect-src[^;"]*\*\.analytics\.google\.com/);
    });
  }
  const islandBundle = (await fsp.readdir(path.join(dirA, '_astro')))
    .filter(f => f.endsWith('.js'));
  let island = '';
  for (const f of islandBundle) {
    const c = await fsp.readFile(path.join(dirA, '_astro', f), 'utf8');
    if (c.includes('simal_consent')) island += c;
  }
  check('consent island dispatches event + withdrawal reload', () => {
    assert.ok(island.includes('simal:consent-accepted'), 'no dispatch in island');
    assert.ok(island.includes('ga-disable-'), 'no ga-disable on withdrawal');
    assert.ok(island.includes('location.reload'), 'no reload on withdrawal');
  });

  /* ---------------- browser phase (Task 8.4-3 network captures) -------- */
  console.log('[ga4-consent] browser phase…');
  const chromePath = process.env.CHROME_PATH || [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ].find(p => fsSync.existsSync(p));
  if (!chromePath) throw new Error('no Chrome/Chromium found (set CHROME_PATH)');

  const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
  const webPort = await freePort(), cdpPort = await freePort();
  const MIME = { '.html': 'text/html', '.xml': 'application/xml', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(dirA, p); if (p.endsWith('/')) f = path.join(f, 'index.html');
    fsp.readFile(f).then(buf => { res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(buf); })
      .catch(() => { res.writeHead(404); res.end('nf'); });
  });
  await new Promise(r => server.listen(webPort, '127.0.0.1', r));
  /* --no-sandbox: same flags as a11y.mjs — Chrome refuses to start as root in a
   * container runner, and Ubuntu 24.04 runners block its user-namespace sandbox. */
  chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${path.join(SITE_DIR, OUT_A + '-profile')}`, 'about:blank'], { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 40 && !ver; i++) {
    try { ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json(); } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  if (!ver) throw new Error('chrome CDP did not come up');
  ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const requests = []; const cspViolations = [];
  ws.onmessage = (m) => {
    const j = JSON.parse(m.data);
    if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); return; }
    if (j.method === 'Network.requestWillBeSent') requests.push(j.params.request.url);
    if (j.method === 'Log.entryAdded' && /content security policy|refused to/i.test(j.params.entry.text || '')) cspViolations.push(j.params.entry.text);
  };
  const send = (method, params = {}, sessionId) => new Promise(res => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const sid = (await send('Target.attachToTarget', { targetId: target.result.targetId, flatten: true })).result.sessionId;
  await send('Page.enable', {}, sid); await send('Runtime.enable', {}, sid);
  await send('Network.enable', {}, sid); await send('Log.enable', {}, sid);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid);
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text || 'eval failed');
    return r.result?.result?.value;
  };
  const waitLoad = async () => { for (let i = 0; i < 60; i++) { if (await ev('document.readyState').catch(() => '') === 'complete') return; await new Promise(r => setTimeout(r, 250)); } throw new Error('load timeout'); };
  const goto = async (u) => { await send('Page.navigate', { url: u }, sid); await waitLoad(); await new Promise(r => setTimeout(r, 700)); };
  const shot = async (name) => {
    if (!process.env.GA4_EVIDENCE_DIR) return;
    const r = await send('Page.captureScreenshot', { format: 'png' }, sid);
    await fsp.mkdir(process.env.GA4_EVIDENCE_DIR, { recursive: true });
    await fsp.writeFile(path.join(process.env.GA4_EVIDENCE_DIR, name), Buffer.from(r.result.data, 'base64'));
  };
  const gaReqs = (from = 0) => requests.slice(from).filter(u => /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/.test(u));
  const base = `http://127.0.0.1:${webPort}`;

  await goto(base + '/');
  await acheck('fresh profile: banner visible, zero GA4 requests, no #ga4-src', async () => {
    assert.equal(await ev(`document.getElementById('cookie-banner').style.display`), 'block');
    assert.equal(await ev(`!!document.getElementById('ga4-src')`), false);
    assert.deepEqual(gaReqs(), []);
  });
  await shot('visual_8.4_fresh_no_ga4_2026-10-17.png');

  await ev(`document.getElementById('cookie-reject-all').click()`);
  await new Promise(r => setTimeout(r, 600));
  await acheck('after Reject: still zero GA4 requests', async () => assert.deepEqual(gaReqs(), []));

  await ev(`document.getElementById('open-cookie-settings').click()`);
  await ev(`document.getElementById('consent-analytics').click()`);
  await ev(`document.getElementById('cookie-save-prefs').click()`);
  await new Promise(r => setTimeout(r, 1500));
  await acheck('after Save with analytics on: gtag/js requested, config queued', async () => {
    const rs = gaReqs().filter(u => u.includes('googletagmanager.com/gtag/js'));
    assert.ok(rs.some(u => u.includes('id=' + GA_ID)), 'gtag/js urls: ' + rs.join(','));
    assert.equal(await ev(`!!document.getElementById('ga4-src')`), true);
    const dl = await ev(`JSON.stringify(window.dataLayer || [])`);
    assert.ok(dl.includes('config') && dl.includes(GA_ID), 'dataLayer: ' + dl.slice(0, 200));
  });
  await shot('visual_8.4_after_consent_ga4_2026-10-17.png');

  const mark = requests.length;
  await goto(base + '/');
  await acheck('returning visitor: GA4 auto-loads with no click', async () => {
    assert.ok(gaReqs(mark).some(u => u.includes('googletagmanager.com/gtag/js')), 'no auto gtag/js');
    assert.notEqual(await ev(`document.getElementById('cookie-banner').style.display`), 'block');
  });

  await ev(`document.getElementById('open-cookie-settings').click()`);
  await ev(`document.getElementById('consent-analytics').click()`);
  await ev(`document.getElementById('cookie-save-prefs').click()`);
  await waitLoad(); await new Promise(r => setTimeout(r, 1200));
  /* rm(10.2): the mark is taken AFTER the reload settles. The grant-bearing page
   * may emit one final keepalive page_view hit as it unloads (GA4 batches it and
   * flushes on unload with navigator.sendBeacon) — that hit was collected under a
   * VALID grant, and counting it as a post-withdrawal request mis-attributes it
   * (observed live: _ee=1 page_view, session started on the consenting page).
   * The property under test is about the RELOADED document: zero GA4 requests,
   * no gtag script, grants denied. */
  const mark2 = requests.length;
  await acheck('withdrawal: reloaded (denied) document makes zero GA4 requests', async () => {
    assert.deepEqual(gaReqs(mark2), [], 'post-withdrawal requests from the denied document: ' + gaReqs(mark2).join(','));
    assert.equal(await ev(`window.__simalConsentGrants?.analytics_storage`), 'denied');
    assert.equal(await ev(`!!document.getElementById('ga4-src')`), false);
    assert.ok(!gaReqs(mark2).some(u => u.includes('googletagmanager.com/gtag/js')), 'gtag/js must not load after withdrawal');
  });
  await shot('visual_8.4_after_withdrawal_2026-10-17.png');

  // banner is hidden for known visitors; use settings to re-grant and prove the event path again
  await ev(`document.getElementById('open-cookie-settings').click()`);
  await ev(`document.getElementById('consent-analytics').click()`);
  const mark3 = requests.length;
  await ev(`document.getElementById('cookie-save-prefs').click()`);
  await new Promise(r => setTimeout(r, 1500));
  await acheck('re-grant via Save loads GA4 again (event path repeatable)', async () => {
    assert.ok(gaReqs(mark3).some(u => u.includes('googletagmanager.com/gtag/js')), 'no gtag/js after re-grant');
  });

  await ev(`document.cookie = 'simal_consent=; path=/; max-age=0'`);
  const mark4 = requests.length;
  await goto(base + '/');
  await ev(`document.getElementById('cookie-accept-all').click()`);
  await new Promise(r => setTimeout(r, 1500));
  await acheck('Accept-all button grants and loads GA4 (fresh-visitor path)', async () => {
    assert.notEqual(await ev(`document.getElementById('cookie-banner').style.display`), 'block', 'banner must hide after Accept-all');
    assert.ok(gaReqs(mark4).some(u => u.includes('googletagmanager.com/gtag/js')), 'no gtag/js after Accept-all');
  });

  check('zero CSP violations mentioning GA4 hosts', () => {
    const bad = cspViolations.filter(t => /googletagmanager|google-analytics|analytics\.google/.test(t));
    assert.deepEqual(bad, []);
  });
} finally {
  try { ws?.close(); } catch {}
  try { chrome?.kill(); } catch {}
  try { server?.close(); } catch {}
  await fsp.rm(path.join(SITE_DIR, OUT_A), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
  await fsp.rm(path.join(SITE_DIR, OUT_A + '-profile'), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
  await fsp.rm(path.join(SITE_DIR, OUT_B), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {});
  await db.drop().catch(e => console.error('scratch db drop failed:', e.message));
}
process.exit(report('GATE ga4-consent (SEO-5 residue, rm 8.4)', failures));
