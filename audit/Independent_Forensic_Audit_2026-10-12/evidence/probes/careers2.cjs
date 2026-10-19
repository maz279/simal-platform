const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ headless: true }); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const api = []; p.on('response', r => { if (r.url().includes('/api/contact')) api.push(r.request().method() + ' ' + r.status()); });
  await p.goto('http://127.0.0.1:8100/careers/', { waitUntil: 'load' });
  await p.fill('#j-name', 'Probe Visitor'); await p.fill('#j-email', 'probe@example.invalid'); await p.fill('#j-why', 'Backend-unreachable probe.');
  await p.check('input[type=checkbox]');
  await p.click('button:has-text("Submit application")'); await p.waitForTimeout(2000);
  const box = await p.evaluate(() => { const els = [...document.querySelectorAll('main *')].filter(e => /received|thank|success|submitted|sent/i.test(e.textContent) && e.children.length === 0 && e.offsetParent); return els.map(e => e.textContent.trim()).slice(0, 3); });
  console.log('API:', api, '\nVisible:', box);
  await p.screenshot({ path: 'shots/fake_careers_consented.png', clip: { x: 0, y: 500, width: 1280, height: 400 } });
  await b.close();
})();
