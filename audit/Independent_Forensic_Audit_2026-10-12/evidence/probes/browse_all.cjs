// Visit every reachable page in a real browser; collect runtime defects.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const crawl = require('./out/crawl.json');
const pages = Object.entries(crawl.seen).filter(([k, v]) => v.status === 200 && String(v.type).includes('text/html')).map(([k]) => k);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const results = [];
  for (const path of pages) {
    const page = await ctx.newPage();
    const consoleErrors = [], failed = [], pageErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
    page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.request().method() + ' ' + r.url().replace('http://127.0.0.1:8100', '')); });
    page.on('requestfailed', r => failed.push('FAIL ' + r.url().replace('http://127.0.0.1:8100', '') + ' ' + (r.failure()?.errorText || '')));
    try {
      await page.goto('http://127.0.0.1:8100' + path, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(400);
      const info = await page.evaluate(() => {
        const imgs = [...document.images];
        const brokenImgs = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'));
        const noAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src'));
        const h1 = [...document.querySelectorAll('h1')].map(h => h.textContent.trim().slice(0, 80));
        const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
        let skips = 0; for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips++;
        const unlabeled = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea')].filter(el => {
          const id = el.id; const lab = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
          return !lab && !el.closest('label') && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title');
        }).map(el => el.outerHTML.slice(0, 100));
        const emptyBtns = [...document.querySelectorAll('button,a[href]')].filter(b => !(b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('title') || b.querySelector('img[alt]:not([alt=""])'))).map(b => b.outerHTML.slice(0, 90));
        const dupIds = (() => { const c = {}; document.querySelectorAll('[id]').forEach(e => c[e.id] = (c[e.id] || 0) + 1); return Object.entries(c).filter(([, n]) => n > 1).map(([k, n]) => k + 'x' + n); })();
        const text = document.body.innerText;
        const leaks = (text.match(/\$\{[^}]{1,40}\}|undefined|NaN|\[object Object\]|null\b/g) || []).slice(0, 5);
        return { title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir, metaDesc: !!document.querySelector('meta[name=description]')?.content, canonical: document.querySelector('link[rel=canonical]')?.href || null, h1, skips, brokenImgs, noAlt: noAlt.length, unlabeled, emptyBtns: emptyBtns.length, emptyBtnSample: emptyBtns.slice(0, 3), dupIds, leaks, hscroll: document.documentElement.scrollWidth > window.innerWidth + 2 };
      });
      results.push({ path, ...info, consoleErrors, pageErrors, failed });
    } catch (e) { results.push({ path, error: e.message }); }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync('out/browse_all.json', JSON.stringify(results, null, 1));
  // summary
  const agg = (k) => results.filter(r => r[k] && r[k].length);
  console.log('pages visited:', results.length, ' nav errors:', results.filter(r => r.error).length);
  const failedAgg = {}; results.forEach(r => (r.failed || []).forEach(f => { failedAgg[f] = (failedAgg[f] || 0) + 1; }));
  console.log('\n== Failed network requests (url -> #pages):'); Object.entries(failedAgg).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, n]) => console.log(String(n).padStart(4), k));
  const ceAgg = {}; results.forEach(r => [...(r.consoleErrors || []), ...(r.pageErrors || []).map(x => 'PAGEERROR ' + x)].forEach(f => { ceAgg[f] = (ceAgg[f] || 0) + 1; }));
  console.log('\n== Console/page errors (msg -> #pages):'); Object.entries(ceAgg).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, n]) => console.log(String(n).padStart(4), k));
  console.log('\n== Broken images:'); results.filter(r => r.brokenImgs?.length).forEach(r => console.log(r.path, r.brokenImgs.slice(0, 4)));
  console.log('\n== h1 count != 1:'); results.filter(r => r.h1 && r.h1.length !== 1).forEach(r => console.log(r.path, r.h1.length, JSON.stringify(r.h1).slice(0, 160)));
  console.log('\n== heading-level skips (pages):', results.filter(r => r.skips > 0).length, results.filter(r => r.skips > 0).slice(0, 8).map(r => r.path + ':' + r.skips).join(' '));
  console.log('\n== pages without meta description:', results.filter(r => r.metaDesc === false).map(r => r.path).join(' ') || 'none');
  console.log('== pages with canonical:', results.filter(r => r.canonical).length);
  console.log('\n== duplicate ids:'); const dagg = {}; results.forEach(r => (r.dupIds || []).forEach(d => dagg[d] = (dagg[d] || 0) + 1)); console.log(JSON.stringify(dagg));
  console.log('\n== unlabeled form controls (sample):'); const uagg = {}; results.forEach(r => (r.unlabeled || []).forEach(u => uagg[u] = (uagg[u] || 0) + 1)); Object.entries(uagg).slice(0, 10).forEach(([k, n]) => console.log(String(n).padStart(4), k));
  console.log('\n== links/buttons without accessible name (pages affected):', results.filter(r => r.emptyBtns > 0).length, JSON.stringify(results.find(r => r.emptyBtns > 0)?.emptyBtnSample || []));
  console.log('\n== visible text leaks (undefined/NaN/${}/null):'); results.filter(r => r.leaks?.length).slice(0, 20).forEach(r => console.log(r.path, JSON.stringify(r.leaks)));
  console.log('\n== horizontal overflow @1440:', results.filter(r => r.hscroll).map(r => r.path).join(' ') || 'none');
  const titles = {}; results.forEach(r => { if (r.title) (titles[r.title] = titles[r.title] || []).push(r.path); });
  console.log('\n== duplicate <title>s:'); Object.entries(titles).filter(([, v]) => v.length > 1).forEach(([t, v]) => console.log(v.length, t.slice(0, 70), '->', v.slice(0, 3).join(' ')));
})().catch(e => { console.error(e); process.exit(1); });
