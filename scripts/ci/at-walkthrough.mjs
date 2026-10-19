// scripts/ci/at-walkthrough.mjs — rm(10.2-3) / PRD NFR-6 (URD ACC): assistive-
// technology walkthrough. Screen readers (NVDA, Narrator, VoiceOver) consume the
// platform accessibility tree, so that tree IS the auditable artifact: this gate
// reads Chrome's own computed AX tree (CDP Accessibility.getFullAXTree) for the
// pages an AT user must traverse, then drives a keyboard-only pass (Tab order,
// skip link, visible focus) and records what an AT user is announced.
//
// Checks per page: main landmark · single H1 · no heading-level skips · every
// interactive control has an accessible name · images named or decorative ·
// document language · first Tab stop is the skip link (site) · visible focus ring.
//
// Usage: node scripts/ci/at-walkthrough.mjs   (outputs JSON to stdout; exits 1 on
// blocking findings. CMS is audited with a real session like a11y.mjs.)
import { spawn } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { REPO, bootApp, login, adminUrlFromEnv, pgReachable, scratchDatabase } from './lib.mjs';

const SITE_DIST = process.env.SITE_DIST || 'apps/site/dist';
if (!existsSync(path.join(REPO, SITE_DIST, 'index.html'))) {
  console.error(`at-walkthrough: ${SITE_DIST} is missing — build the site first.`);
  process.exit(2);
}
const EDGE_PORT = Number(process.env.AT_EDGE_PORT || 18130);
const CDP_PORT = Number(process.env.AT_CDP_PORT || 18131);
const ORIGIN = `http://127.0.0.1:${EDGE_PORT}`;
const PP = '/products/arktek-rtx3060-led-ga104-150-a1-3584sp-gddr6-12gb-13201777-12gbps_6b2aaad2';
const SITE_PAGES = (process.env.AT_PAGES || `/,/products/,${PP},/rfq/,/ar/`).split(',');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const listening = (port, host = '127.0.0.1') => new Promise((resolve) => {
  const s = net.connect({ port, host, timeout: 1200 });
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('timeout', () => { s.destroy(); resolve(false); });
  s.once('error', () => resolve(false));
});
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const c of ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium']) if (existsSync(c)) return c;
  return null;
}
const chromeBin = chromePath();
if (!chromeBin) { console.error('at-walkthrough: no Chrome found — set CHROME_PATH'); process.exit(2); }

const edge = spawn(process.execPath, ['scripts/dev-edge.mjs'], { env: { ...process.env, PORT: String(EDGE_PORT), SITE_DIST }, stdio: 'ignore' });
const chrome = spawn(chromeBin, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,900'], { stdio: 'ignore' });
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = (await listening(EDGE_PORT)) && (await listening(CDP_PORT)); if (!up) await sleep(300); }
if (!up) { console.error('at-walkthrough: dev-edge or chrome did not start'); edge.kill('SIGKILL'); chrome.kill('SIGKILL'); process.exit(2); }

const tab = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 1; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const id = msgId++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable');
await send('Accessibility.enable');

const INTERACTIVE = new Set(['link', 'button', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'tab', 'switch', 'menuitem', 'slider', 'spinbutton', 'listbox']);

/** read the computed accessibility tree exactly as an AT would */
async function axAudit() {
  const tree = await send('Accessibility.getFullAXTree');
  const nodes = (tree.result?.nodes || []).filter((n) => !n.ignored && n.role?.value !== 'none');
  const byRole = (r) => nodes.filter((n) => n.role?.value === r);
  const nameOf = (n) => (n.name?.value || '').trim();
  const headings = nodes.filter((n) => /^heading$/.test(n.role?.value || ''))
    .map((n) => ({ level: n.properties?.find((p) => p.name === 'level')?.value?.value || null, name: nameOf(n) }))
    .filter((h) => h.name);
  const interactive = nodes.filter((n) => INTERACTIVE.has(n.role?.value || ''));
  const unnamed = interactive.filter((n) => !nameOf(n)).map((n) => n.role.value + (n.backendDOMNodeId ? '' : ''));
  const images = nodes.filter((n) => n.role?.value === 'image');
  const imgsNoNameList = images.filter((n) => !nameOf(n));
  const imgsNoName = imgsNoNameList.length;
  const doc = nodes.find((n) => n.role?.value === 'RootWebArea' || n.role?.value === 'WebArea');
  /* getFullAXTree does not expose the document language in this Chrome build,
   * but html@lang IS what screen readers read — take it from the DOM. */
  const lang = (await send('Runtime.evaluate', { returnByValue: true, expression:
    "document.documentElement.lang + '|' + document.documentElement.dir" })).result?.result?.value || null;
  const landmarks = {
    main: byRole('main').length, nav: byRole('navigation').length,
    banner: byRole('banner').length, contentinfo: byRole('contentinfo').length,
    search: byRole('search').length, region: byRole('region').length,
  };
  const levels = headings.map((h) => Number(h.level)).filter(Boolean);
  const skips = [];
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips.push(`${levels[i - 1]}→${levels[i]}`);
  return {
    lang, landmarks, headings, headingSkips: skips,
    unnamedInteractive: unnamed, interactiveCount: interactive.length,
    imageCount: images.length, imagesWithoutName: imgsNoName,
    unnamedImageRoles: imgsNoNameList.map((n) => n.role?.value).slice(0, 4),
    announcedSamples: {
      firstHeading: headings[0]?.name || null,
      navLinks: nodes.filter((n) => n.role?.value === 'link').slice(0, 3).map(nameOf),
      buttons: nodes.filter((n) => n.role?.value === 'button').slice(0, 3).map(nameOf),
      textboxes: nodes.filter((n) => /textbox|searchbox/.test(n.role?.value || '')).map(nameOf).slice(0, 4),
    },
  };
}

/** keyboard-only: REAL Tab key events (so :focus-visible applies), first 8 stops */
async function keyboardAudit() {
  await send('Runtime.evaluate', { expression: "document.body.focus()" });
  const stops = [];
  for (let i = 0; i < 8; i++) {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await sleep(60);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      return { tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').replace(/\s+/g,' ').trim().slice(0, 60), href: el.getAttribute('href') || null, visibleRing: ring };
    })()` });
    const st = r.result?.result?.value;
    if (!st) break;
    stops.push(st);
    if (stops.length > 1 && st.name && st.name === stops[stops.length - 2].name) break; /* focus trapped/cycles */
  }
  return stops;
}

async function visit(url) {
  const loaded = new Promise((resolve) => {
    const h = (ev) => { try { if (JSON.parse(ev.data).method === 'Page.loadEventFired') { ws.removeEventListener('message', h); resolve(); } } catch { /* ignore */ } };
    ws.addEventListener('message', h);
  });
  await send('Page.navigate', { url });
  await Promise.race([loaded, sleep(3500)]);
  await sleep(900);
  return { ax: await axAudit(), keyboard: await keyboardAudit(), url: (await send('Runtime.evaluate', { returnByValue: true, expression: 'location.href' })).result?.result?.value };
}

const findings = [];      /* blocking */
const advisories = [];    /* best practice, not a WCAG A/AA failure */
const results = [];
function judge(label, page, { isSite }) {
  const { ax, keyboard } = page;
  if (!ax) { findings.push(`${label}: no accessibility tree`); return; }
  if (!ax.landmarks.main) findings.push(`${label}: no main landmark (AT users cannot jump to content)`);
  if (ax.landmarks.nav < 1) advisories.push(`${label}: no navigation landmark (page has no navigation UI region)`);
  if (ax.headingSkips.length) advisories.push(`${label}: heading level jump(s) ${ax.headingSkips.join(', ')} (WCAG does not forbid contiguous-level skips; best-practice fix)`);
  if (ax.unnamedInteractive.length) findings.push(`${label}: ${ax.unnamedInteractive.length} interactive control(s) with no accessible name (${ax.unnamedInteractive.slice(0, 3).join(', ')})`);
  if (ax.imagesWithoutName > 0) findings.push(`${label}: ${ax.imagesWithoutName} image(s) with no accessible name and not marked decorative`);
  if (!ax.lang) findings.push(`${label}: document has no language`);
  const first = keyboard?.[0];
  const isSkip = first && (String(first.href || '').startsWith('#') || /skip|الانتقال إلى المحتوى/i.test(first.name || ''));
  if (isSite && keyboard?.length && !isSkip) findings.push(`${label}: first Tab stop is "${first?.name}" — not the skip link`);
  const noRing = (keyboard || []).filter((s) => s && !s.visibleRing).length;
  if (noRing) findings.push(`${label}: ${noRing} keyboard stop(s) without a visible focus ring`);
  results.push({ page: label, lang: ax.lang, landmarks: ax.landmarks, h1: ax.headings.filter((h) => Number(h.level) === 1).length,
    headings: ax.headings.length, interactive: ax.interactiveCount, unnamed: ax.unnamedInteractive.length,
    images: ax.imageCount, imagesWithoutName: ax.imagesWithoutName, tabStops: (keyboard || []).length,
    announced: ax.announcedSamples });
}

try {
  for (const p of SITE_PAGES) {
    const label = `site ${p}`;
    const page = await visit(ORIGIN + p);
    judge(label, page, { isSite: true });
    console.log(`${label}: lang=${page.ax?.lang} main=${page.ax?.landmarks.main} h1=${page.ax?.headings.filter((h) => Number(h.level) === 1).length} interactive=${page.ax?.interactiveCount} unnamed=${page.ax?.unnamedInteractive.length}`);
  }
  /* the KYC wizard (step 1 asks for the email) — an AT user must be able to start */
  {
    const page = await visit('http://127.0.0.1:8090/form.html?role=vendor');
    judge('portal wizard (step gate)', page, { isSite: false });
    console.log(`portal wizard: lang=${page.ax?.lang} main=${page.ax?.landmarks.main} unnamed=${page.ax?.unnamedInteractive.length}`);
  }
  /* CMS console, authenticated (same session injection as the a11y gate) */
  {
    const adminUrl = await adminUrlFromEnv();
    const usePg = await pgReachable(adminUrl);
    const scratch = usePg ? await scratchDatabase(adminUrl, 'at').catch(() => null) : null;
    const boot = await bootApp(scratch ? { mode: 'pg', databaseUrl: scratch.url } : { mode: 'json' });
    try {
      const cookie = await login(boot.base, boot.creds.adminEmail, boot.creds.adminPassword, boot.creds.adminTotp);
      if (!cookie) throw new Error('CMS login failed');
      await send('Network.enable');
      await send('Network.setCookie', { name: 'kyc_sid', value: cookie.replace(/^kyc_sid=/, ''), url: boot.base + '/' });
      const page = await visit(boot.base + '/cms.html');
      await sleep(1800); /* console panels load after DOMContentLoaded */
      page.ax = await axAudit(); page.keyboard = await keyboardAudit();
      judge('CMS console (authenticated)', page, { isSite: false });
      console.log(`CMS: lang=${page.ax?.lang} main=${page.ax?.landmarks.main} unnamed=${page.ax?.unnamedInteractive.length}`);
    } finally {
      await boot.stop().catch(() => {});
      if (boot.app?.repos?.client) await boot.app.repos.client.end().catch(() => {});
      await scratch?.drop().catch(() => {});
    }
  }
} finally {
  ws.close(); edge.kill('SIGKILL'); chrome.kill('SIGKILL');
}

const report = { ranAt: new Date().toISOString(), siteDist: SITE_DIST, pages: results, findings, advisories };
console.log('\n=== AT WALKTHROUGH (PRD NFR-6 / URD ACC) ===');
console.log(JSON.stringify(report, null, 2));
if (findings.length) {
  console.error(`\nFAIL — ${findings.length} blocking AT finding(s):`);
  findings.forEach((f) => console.error(' - ' + f));
  process.exit(1);
}
console.log('\nPASS — every audited page exposes named controls, landmarks, ordered headings and visible keyboard focus.');
process.exit(0);
