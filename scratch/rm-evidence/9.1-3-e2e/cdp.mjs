// Minimal Chrome DevTools Protocol driver: real Chrome, real input events.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1366, height = 900 } = {}) {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); } }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (m) => {
    const j = JSON.parse(m.data);
    if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); }
    else for (const l of listeners) l(j);
  };
  const send = (method, params = {}, sessionId) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const browser = {
    async newPage() { return openPage(send, listeners, width, height); },
    async close() { try { ws.close(); } catch { /* closed */ } proc.kill(); await sleep(300); fs.rmSync(profile, { recursive: true, force: true }); },
  };
  return browser;
}

async function openPage(send, listeners, width, height) {
  const { result } = await send('Target.createTarget', { url: 'about:blank' });
  const sid = (await send('Target.attachToTarget', { targetId: result.targetId, flatten: true })).result.sessionId;
  const s = (m, p) => send(m, p, sid);
  const log = { exceptions: [], consoleErrors: [], csp: [], failed: [], docs: [], requests: [] };
  let loadResolve = null;
  let mockBody = null;
  listeners.push((j) => {
    if (j.sessionId !== sid) return;
    const p = j.params || {};
    if (j.method === 'Fetch.requestPaused') {
      s('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200,
        responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: mockBody });
      return;
    }
    if (j.method === 'Runtime.exceptionThrown') log.exceptions.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').split('\n')[0]);
    if (j.method === 'Runtime.consoleAPICalled' && p.type === 'error') log.consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' '));
    if (j.method === 'Log.entryAdded' && p.entry.level === 'error') {
      if (/Content Security Policy|Refused to/i.test(p.entry.text)) log.csp.push(p.entry.text.slice(0, 200));
      else log.consoleErrors.push(p.entry.text.slice(0, 200));
    }
    if (j.method === 'Network.requestWillBeSent') log.requests.push(p.request.url);
    if (j.method === 'Network.loadingFailed' && !p.canceled) log.failed.push(p.errorText + ' ' + (p.blockedReason || ''));
    if (j.method === 'Network.responseReceived' && p.type === 'Document') log.docs.push({ url: p.response.url, status: p.response.status });
    if (j.method === 'Page.loadEventFired' && loadResolve) { loadResolve(); loadResolve = null; }
  });
  for (const d of ['Page.enable', 'Runtime.enable', 'Network.enable', 'Log.enable']) await s(d);
  const page = {
    log,
    resetLog() { for (const k of Object.keys(log)) log[k].length = 0; },
    async viewport(w, h, mobile = false) {
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
      if (mobile) await s('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    },
    async goto(url, settle = 600) {
      const loaded = new Promise((r) => { loadResolve = r; });
      await s('Page.navigate', { url });
      await Promise.race([loaded, sleep(20000)]);
      await sleep(settle);
    },
    async ev(expr) {
      const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
      return r.result?.result?.value;
    },
    async rect(sel) {
      // behavior 'instant': the site sets scroll-behavior: smooth, and coordinates
      // measured mid-animation land on whatever scrolls past.
      const found = await page.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
        e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); return true; })()`);
      if (!found) return null;
      await sleep(80);
      return page.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })()`);
    },
    /** Real mouse click at the element's centre (fails if the element is hidden or covered). */
    async click(sel, { navigate = false, settle = 400 } = {}) {
      const r = await page.rect(sel);
      if (!r || !r.w || !r.h) throw new Error('not clickable: ' + sel);
      await sleep(120);
      const hit = await page.ev(`(() => { const t = document.elementFromPoint(${r.x}, ${r.y}); const e = document.querySelector(${JSON.stringify(sel)});
        if (t && (t === e || e.contains(t))) return 'ok';
        const c = t && (t.closest('[id]') || t); return c ? c.tagName + '#' + (c.id || '') + '.' + String(c.className).slice(0, 40) : 'nothing'; })()`);
      if (hit !== 'ok') throw new Error(`covered by ${hit}: ${sel}`);
      const loaded = navigate ? new Promise((res) => { loadResolve = res; }) : null;
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await s('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
      }
      if (loaded) await Promise.race([loaded, sleep(20000)]);
      await sleep(settle);
    },
    async type(sel, text) {
      await page.click(sel, { settle: 100 });
      await page.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.value = ''; })()`);
      await s('Input.insertText', { text });
    },
    async key(key) {
      for (const type of ['keyDown', 'keyUp']) await s('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: key === 'Enter' ? 13 : 0 });
    },
    async shot(file, { full = false } = {}) {
      let clip;
      if (full) {
        const m = await s('Page.getLayoutMetrics');
        clip = { x: 0, y: 0, width: m.result.cssContentSize.width, height: Math.min(m.result.cssContentSize.height, 6000), scale: 1 };
      }
      const r = await s('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      return file;
    },
    async cookies() { return (await s('Network.getCookies')).result.cookies; },
    async block(urls) { await s('Network.setBlockedURLs', { urls }); },
    /** Answer requests matching urlPattern with a fixed JSON body; mock(null) turns it off. */
    async mock(urlPattern, json) {
      if (!urlPattern) { await s('Fetch.disable'); return; }
      mockBody = Buffer.from(JSON.stringify(json)).toString('base64');
      await s('Fetch.enable', { patterns: [{ urlPattern }] });
    },
  };
  return page;
}
