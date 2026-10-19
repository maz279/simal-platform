// SANDBOX: unauthenticated partner-facing portal pages (fresh browser context, no session).
const { chromium } = require('./pw.cjs');
const BASE = 'http://127.0.0.1:18090';
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 120))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  const out = {};
  await p.goto(BASE + '/login.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.screenshot({ path: 'shots/partner_login.png' });
  out.loginDevButtons = await p.$$eval('.auth-dev-btn', els => els.map(e => e.dataset.email + ' (' + (e.title || '').slice(0, 30) + ')'));
  out.loginVisibleDevText = (await p.evaluate(() => document.body.innerText.match(/Dev MFA Code[^\n]*/)?.[0] || '')).slice(0, 80);
  await p.goto(BASE + '/form.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
  out.formUrl = p.url().replace(BASE, ''); out.formTitle = await p.title();
  out.formFirstStep = (await p.evaluate(() => document.querySelector('main, body')?.innerText.replace(/\s+/g, ' ').slice(0, 200)));
  await p.screenshot({ path: 'shots/partner_form.png' });
  await p.goto(BASE + '/index.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
  await p.screenshot({ path: 'shots/partner_index.png' });
  out.indexCtas = await p.$$eval('a', as => as.map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href')).filter(s => s.length < 90).slice(0, 15));
  await p.goto(BASE + '/status.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
  await p.screenshot({ path: 'shots/partner_status.png' });
  out.statusInputs = await p.$$eval('input', els => els.map(e => (e.id || e.name) + ':' + e.type));
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
