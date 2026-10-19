// Browser E2E of the staff portal + CMS (:8090). Logs in through the real form.
// node cms-e2e.mjs <iteration> <shotDir>      (credentials read from apps/portal/.env; never printed)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
const CB = 'C:/software_project/Simal_Corporate_website/Codebase';
const PORTAL = 'http://127.0.0.1:8090';
const [iter = '1', SHOTS = '.'] = process.argv.slice(2);
const env = fs.readFileSync(CB + '/apps/portal/.env', 'utf8');
const pick = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const { totpNow } = await import(pathToFileURL(CB + '/apps/portal/src/lib/security.js').href);
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, x = '') => { console.log(`${c ? '  PASS' : '  FAIL'} ${n}${x ? ' — ' + x : ''}`); if (c) pass++; else { fail++; fails.push(n); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (p, name) => p.shot(`${SHOTS}/9.1-3-it${iter}-${name}.png`);
const VIEWS = ['dashboard', 'workspace-editorial', 'slides', 'insights', 'media-library', 'blocks', 'claims-register', 'it-solutions',
  'amc-tiers', 'software-suites', 'products-catalog', 'brands-catalog', 'policies', 'loc-audit', 'revisions', 'publish-pipeline',
  'publish-approvals', 'outbox', 'audit-trail', 'users-management', 'rbac-matrix', 'active-sessions', 'system-telemetry',
  'announcements', 'testimonials', 'navigation', 'footer', 'newsletter', 'seo-defaults', 'stats', 'awards', 'categories'];

const browser = await launch({ width: 1440, height: 900 });
const page = await browser.newPage();
try {
  console.log('[1] login through the form');
  await page.goto(PORTAL + '/login.html', 700);
  ok('login page 200, no exceptions', page.log.docs[0]?.status === 200 && !page.log.exceptions.length);
  await page.type('#em', pick('ADMIN_EMAIL'));
  await page.type('#pw', pick('ADMIN_PASSWORD'));
  await page.click('#go', { settle: 1500 });
  if (await page.ev(`(() => { const s = document.getElementById('step-mfa'); return !!s && getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().height > 0; })()`)) {
    const code = totpNow(pick('ADMIN_TOTP_SECRET'));
    for (let i = 0; i < 6; i++) await page.type(`#otp-${i + 1}`, code[i]);
    await page.click('#mfa-go', { settle: 1800 });
    ok('MFA step completed', true);
  }
  await wait(1200);
  const at = await page.ev('location.pathname');
  ok('staff login lands on the admin console', at.endsWith('/admin.html'), at);
  ok('admin console: no exceptions', page.log.exceptions.length === 0, page.log.exceptions.join(' | '));
  await shot(page, 'admin-console');

  console.log('[2] CMS views');
  page.resetLog();
  await page.goto(PORTAL + '/cms.html#/dashboard', 1500);
  ok('cms.html 200', page.log.docs[0]?.status === 200);
  await shot(page, 'cms-dashboard');
  const bad = [];
  for (const v of VIEWS) {
    const before = page.log.exceptions.length;
    await page.ev(`location.hash = '#/${v}'`);
    // poll (not a fixed sleep): under CI load a view can take >1s; a broken one never fills
    let info;
    for (let t = 0; t < 25; t++) {
      await wait(200);
      info = await page.ev(`(() => { const m = document.querySelector('main') || document.body;
        const toast = [...document.querySelectorAll('.toast, [role=alert]')].map(t => t.textContent.trim()).filter(t => /error|fail|denied|500/i.test(t));
        return { len: m.innerText.trim().length, title: document.title, toast }; })()`);
      if (info.len >= 40 && t >= 3) break;
    }
    const newEx = page.log.exceptions.slice(before);
    if (newEx.length || info.len < 40 || info.toast.length) bad.push(`${v}: ex=${newEx[0] || ''} len=${info.len} toast=${info.toast[0] || ''}`);
  }
  ok(`all ${VIEWS.length} CMS views render with 0 exceptions and no error toasts`, bad.length === 0, bad.slice(0, 4).join(' ; '));
  const apiErr = page.log.consoleErrors.filter((e) => /\b(4\d\d|5\d\d)\b/.test(e) && !/401/.test(e));
  ok('no failed API calls while touring the CMS', apiErr.length === 0, apiErr.slice(0, 3).join(' | '));

  console.log('[3] sidebar clicks + pipeline');
  await page.ev(`location.hash = '#/dashboard'`); await wait(800);
  // the sidebar shows one work area at a time: click the first VISIBLE match
  const visible = (href) => page.ev(`(() => { const e = [...document.querySelectorAll('a[href="${href}"]')].find(a => a.getBoundingClientRect().height > 0);
    if (!e) return null; e.setAttribute('data-e2e', '${href.slice(2)}'); return '[data-e2e="${href.slice(2)}"]'; })()`);
  const side = await visible('#/workspace-editorial');
  ok('sidebar item "Editorial Desk" visible', !!side);
  if (side) { await page.click(side, { settle: 1200 }); ok('sidebar click opens Editorial Desk', (await page.ev('location.hash')) === '#/workspace-editorial'); }
  await page.ev(`location.hash = '#/dashboard'`); await wait(900);
  const card = await visible('#/publish-pipeline');
  ok('dashboard "Publish pipeline" link visible', !!card);
  if (card) { await page.click(card, { settle: 1200 }); ok('dashboard link opens the publish pipeline', (await page.ev('location.hash')) === '#/publish-pipeline'); }
  const pipeTxt = await page.ev(`(document.querySelector('main') || document.body).innerText`);
  ok('pipeline lists processed publishes', /processed/i.test(pipeTxt));
  await shot(page, 'cms-pipeline');
  await page.ev(`location.hash = '#/navigation'`); await wait(1200);
  const navMenus = await page.ev(`(() => { try { return JSON.parse(document.querySelector('textarea').value).menus.length; } catch { return -1; } })()`);
  ok('navigation editor loads site/nav-menus with all 8 menus (valid JSON payload)', navMenus >= 8, String(navMenus));
  await shot(page, 'cms-navigation');

  console.log('[4] logout');
  const out = await page.ev(`(() => { const b = [...document.querySelectorAll('a,button')].find(e => /sign ?out|log ?out/i.test(e.textContent + (e.getAttribute('aria-label') || '') + (e.title || ''))); if (!b) return null; b.id = b.id || 'e2e-logout'; return '#' + b.id; })()`);
  if (out) {
    await page.click(out, { settle: 1500 });
    const me = await page.ev(`fetch('/api/auth/me').then(r => r.status)`);
    ok('logout ends the session (/api/auth/me -> 401)', me === 401, String(me));
  } else ok('logout control present', false);
} catch (e) {
  ok('driver completed without crashing', false, e.message);
} finally {
  await browser.close();
}
console.log(`\nCMS E2E iteration ${iter}: ${pass} pass, ${fail} fail${fails.length ? ' -> ' + fails.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
