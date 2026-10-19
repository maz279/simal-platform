// Read-only visual drive-through of the public static site (:8100). GET navigation only.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const OUT = 'shots';
const BASE = 'http://127.0.0.1:8100';
const PAGES = ['/', '/products/', '/products/crucial-t705-ssd/', '/brands/', '/brands/pny/', '/solutions/', '/solutions/amc/', '/software/',
  '/about/', '/careers/', '/insights/', '/resources/', '/contact/', '/rfq/', '/legal/', '/legal/privacy-policy/', '/compare/', '/search/?q=ssd',
  '/onboarding/', '/ar/', '/sitemap/', '/does-not-exist/'];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const notes = [];
  for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    for (const p of PAGES) {
      const page = await ctx.newPage();
      const resp = await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }).catch(e => null);
      await page.waitForTimeout(600);
      const name = `${label}_${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}.png`;
      await page.screenshot({ path: `${OUT}/${name}`, fullPage: label === 'desktop' ? false : false });
      const m = await page.evaluate(() => ({
        hOverflow: document.documentElement.scrollWidth - window.innerWidth,
        h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim().slice(0, 60)),
        title: document.title,
      }));
      notes.push({ vp: label, path: p, status: resp ? resp.status() : 'ERR', ...m, shot: name });
      await page.close();
    }
    await ctx.close();
  }
  // Mega menus + category deep links (desktop)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const triggers = await page.$$eval('[role="button"]', els => els.map(e => e.textContent.trim().split('\n')[0].trim()).filter(Boolean).slice(0, 12));
  notes.push({ megaMenuTriggers: triggers });
  const navItems = await page.$$('nav [role="button"], .h2nav [role="button"]');
  let idx = 0;
  for (const it of navItems.slice(0, 8)) {
    idx++;
    await it.hover().catch(() => { });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/mega_${idx}.png`, clip: { x: 0, y: 0, width: 1440, height: 700 } });
  }
  // category deep link: does /products#memory actually filter?
  for (const hash of ['#memory', '#monitors', '#laptops']) {
    await page.goto(BASE + '/products' + hash, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const vis = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-cat], .pcard, .card')];
      const shown = cards.filter(c => c.offsetParent !== null).length;
      return { cards: cards.length, shown, url: location.href };
    });
    notes.push({ deepLink: '/products' + hash, ...vis });
  }
  // search page: header box vs page box duplicate id
  await page.goto(BASE + '/search/?q=crucial', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  notes.push({ searchResultsText: (await page.evaluate(() => document.querySelector('main')?.innerText || '')).slice(0, 200) });
  await page.screenshot({ path: `${OUT}/search_crucial.png` });
  await browser.close();
  fs.writeFileSync('out/visual_public.json', JSON.stringify(notes, null, 1));
  for (const n of notes) console.log(JSON.stringify(n).slice(0, 230));
})().catch(e => { console.error(e); process.exit(1); });
