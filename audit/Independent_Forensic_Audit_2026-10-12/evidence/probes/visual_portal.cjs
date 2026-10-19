// SANDBOX portal (:18090) visual drive-through: CMS views + KYC/partner/staff portal pages.
// Navigation and screenshots only; no form submissions except login.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const BASE = 'http://127.0.0.1:18090';
const VIEWS = ['dashboard', 'workspace-editorial', 'slides', 'media-library', 'blocks', 'claims-register', 'it-solutions', 'amc-tiers', 'software-suites',
  'products-catalog', 'policies', 'loc-audit', 'revisions', 'publish-pipeline', 'audit-trail', 'users-management', 'rbac-matrix', 'active-sessions',
  'system-telemetry', 'announcements', 'testimonials'];
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], failed = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 140)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); });
  p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + new URL(r.url()).pathname); });
  // CMS login screen (shows credentials?)
  await p.goto(BASE + '/cms.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/portal_cms_login.png' });
  const loginHint = await p.evaluate(() => document.body.innerText.match(/Super Admin[^\n]*\n?[^\n]*Reviewer[^\n]*/)?.[0] || '');
  await p.fill('#cms-email', 'admin@simalme.com').catch(() => { });
  await p.fill('#cms-pass', '[REDACTED-ROTATED-2026-10]').catch(() => { });
  await p.click('button[type=submit], #cms-login-btn, button:has-text("Sign in")').catch(() => { });
  await p.waitForTimeout(2500);
  const out = { loginHint: loginHint.replace(/admin123|reviewer123/g, '****'), views: [] };
  for (const v of VIEWS) {
    const before = errs.length;
    await p.evaluate((h) => { location.hash = '#/' + h; }, v);
    await p.waitForTimeout(1300);
    const info = await p.evaluate(() => {
      const c = document.querySelector('#content');
      const txt = (c?.innerText || '').replace(/\s+/g, ' ');
      const btns = [...document.querySelectorAll('#cmdbar button, .cmdbar button, [role=toolbar] button')].map(x => x.textContent.trim()).filter(Boolean);
      return { heading: (c?.querySelector('h1,h2')?.textContent || '').trim().slice(0, 60), chars: txt.length, hasUndefined: /undefined|NaN|\[object/.test(txt), sample: txt.slice(0, 140), cmdbar: btns.slice(0, 8) };
    });
    await p.screenshot({ path: `shots/cms_${v}.png` });
    out.views.push({ view: v, ...info, newErrors: errs.slice(before) });
  }
  // KYC / partner / staff portal pages (unauthenticated + authenticated where relevant)
  const pages = ['/login.html', '/form.html', '/status.html', '/invoices.html', '/admin.html', '/invoices-admin.html', '/index.html', '/privacy.html', '/terms.html', '/confirmation.html'];
  out.portalPages = [];
  for (const pg of pages) {
    const before = errs.length;
    const r = await p.goto(BASE + pg, { waitUntil: 'load' }); await p.waitForTimeout(900);
    await p.screenshot({ path: `shots/portal_${pg.replace(/\W+/g, '_')}.png` });
    out.portalPages.push({ page: pg, status: r?.status(), title: await p.title(), url: p.url(), newErrors: errs.slice(before) });
  }
  out.failedRequests = [...new Set(failed)];
  fs.writeFileSync('out/visual_portal.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 9000));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
