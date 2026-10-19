// On :8100 the /api backend does not exist (python static server -> 404/501, no side effects).
// Question: do the public forms tell the visitor their submission succeeded anyway?
const { chromium } = require('./pw.cjs');
const BASE = 'http://127.0.0.1:8100';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const results = [];
  async function run(name, path, steps) {
    const page = await ctx.newPage();
    const api = [];
    page.on('response', r => { if (r.url().includes('/api/')) api.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
    page.on('dialog', async d => { api.push('DIALOG: ' + d.message().slice(0, 120)); await d.dismiss(); });
    await page.goto(BASE + path, { waitUntil: 'load' });
    let shown = '';
    try { shown = await steps(page); } catch (e) { shown = 'STEP ERROR: ' + e.message.slice(0, 120); }
    await page.screenshot({ path: `shots/fake_${name}.png` });
    results.push({ name, path, apiCalls: api.filter(a => !a.includes('rfq-basket')), visibleResult: String(shown).replace(/\s+/g, ' ').slice(0, 220) });
    await page.close();
  }
  await run('careers', '/careers/', async (p) => {
    await p.fill('#j-name', 'Probe Visitor'); await p.fill('#j-email', 'probe@example.invalid');
    const sel = await p.$('#j-role'); if (sel) { const opts = await p.$$eval('#j-role option', o => o.map(x => x.value).filter(Boolean)); if (opts[0]) await p.selectOption('#j-role', opts[0]); }
    const why = await p.$('#j-why'); if (why) await p.fill('#j-why', 'Testing whether the form reports success when the backend is unreachable.');
    const btn = await p.$('button:has-text("Submit"), button:has-text("Apply"), button:has-text("Send")'); await btn.click();
    await p.waitForTimeout(1500);
    return await p.evaluate(() => [...document.querySelectorAll('[id*="ok"],[class*="success"],[id*="done"],[id*="thanks"],.ok,.done')].filter(e => e.offsetParent).map(e => e.innerText).join(' | ') || document.querySelector('main')?.innerText.slice(0, 300));
  });
  await run('newsletter', '/', async (p) => {
    const inp = await p.$('footer input[type=email], input[placeholder*="email" i]'); await inp.fill('probe@example.invalid');
    const btn = await p.$('button:has-text("Subscribe")'); await btn.click(); await p.waitForTimeout(1500);
    return await p.evaluate(() => [...document.querySelectorAll('[role=status], .toast, [class*="toast"], [id*="toast"]')].map(e => e.innerText).join(' | '));
  });
  await run('insights_digest', '/insights/', async (p) => {
    const inp = await p.$('main input[type=email], main input[placeholder*="mail" i]'); if (!inp) return 'no digest input found';
    await inp.fill('probe@example.invalid');
    const btn = await p.$('main button:has-text("Subscribe"), main button:has-text("Get"), main button:has-text("Send")'); if (btn) await btn.click();
    await p.waitForTimeout(1000);
    return await p.evaluate(() => document.querySelector('main')?.innerText.match(/(Subscribed[^\n]*|Confirmation[^\n]*|sent[^\n]*)/i)?.[0] || '');
  });
  await browser.close();
  for (const r of results) console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
