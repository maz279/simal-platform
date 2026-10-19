// SANDBOX: RFQ + contact journeys through the real UI, with /api proxied to the sandbox portal.
const { chromium } = require('./pw.cjs');
const BASE = 'http://127.0.0.1:18100';
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const log = [];
  p.on('response', r => { if (r.url().includes('/api/')) log.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
  p.on('pageerror', e => log.push('PAGEERROR ' + e.message.slice(0, 120)));
  // 1) home hero basket widget with an EMPTY basket
  await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const heroBasket = await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /B2B RFQ Basket/.test(e.textContent) && e.children.length < 40 && e.querySelector('*')); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 260) : 'not found'; });
  const headerCount = await p.evaluate(() => document.querySelector('#rfqn, [id*="rfq"] b, .rfq-pill b')?.textContent || '');
  log.push('HOME hero basket text (empty real basket): ' + heroBasket);
  log.push('HOME header RFQ count: ' + headerCount);
  // 2) add a product from a PDP
  await p.goto(BASE + '/products/crucial-p3-plus/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const add = await p.$('button:has-text("Add to RFQ"), button:has-text("RFQ"), [data-add-rfq]');
  if (add) { await add.click(); await p.waitForTimeout(1200); }
  // 3) add a product whose slug contains "_" (featured on home)
  await p.goto(BASE + '/products/arktek-rtx3060-led-ga104-150-a1-3584sp-gddr6-12gb-13201777-12gbps_6b2aaad2/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const add2 = await p.$('button:has-text("Add to RFQ"), button:has-text("RFQ"), [data-add-rfq]');
  if (add2) { await add2.click(); await p.waitForTimeout(1200); }
  const toast2 = await p.evaluate(() => [...document.querySelectorAll('[class*="toast"], [role=status], [id*="toast"]')].map(e => e.innerText).join(' | ').slice(0, 160));
  log.push('Add underscore-slug product feedback: ' + (toast2 || '(none visible)'));
  // 4) RFQ page: basket contents + submit
  await p.goto(BASE + '/rfq/', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const basketTxt = await p.evaluate(() => document.querySelector('main')?.innerText.match(/(Crucial[^\n]*|ARKTEK[^\n]*|Basket is empty[^\n]*)/g)?.slice(0, 4) || []);
  log.push('RFQ page basket lines: ' + JSON.stringify(basketTxt));
  await p.fill('#f-co', 'Sandbox Probe Trading LLC'); await p.fill('#f-name', 'Sandbox Probe');
  await p.fill('#f-email', 'probe@example.invalid'); await p.fill('#f-phone', '+971500000000');
  await p.check('#f-consent');
  await p.click('button:has-text("Submit RFQ")'); await p.waitForTimeout(2500);
  const result = await p.evaluate(() => document.querySelector('main')?.innerText.match(/SIMAL-RFQ-[0-9-]+[^\n]*/)?.[0] || document.querySelector('main')?.innerText.slice(0, 200));
  log.push('RFQ submit visible result: ' + result);
  await p.screenshot({ path: 'shots/sandbox_rfq_result.png' });
  // 5) contact form
  await p.goto(BASE + '/contact/', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const fields = await p.$$eval('form input, form select, form textarea', els => els.map(e => (e.id || e.name) + ':' + e.type));
  log.push('contact form fields: ' + fields.join(', '));
  await b.close();
  console.log(log.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
