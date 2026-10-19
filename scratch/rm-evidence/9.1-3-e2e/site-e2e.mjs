// Browser E2E of the served public site (:8100 = SSG deploy target). Real Chrome, real clicks.
// node site-e2e.mjs <iteration> <shotDir>
import { launch } from './cdp.mjs';
const EDGE = 'http://127.0.0.1:8100';
const [iter = '1', SHOTS = '.'] = process.argv.slice(2);
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, x = '') => { console.log(`${c ? '  PASS' : '  FAIL'} ${n}${x ? ' — ' + x : ''}`); if (c) pass++; else { fail++; fails.push(n); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (page, label) => {
  const L = page.log;
  ok(`${label}: 0 JS exceptions`, L.exceptions.length === 0, L.exceptions.slice(0, 2).join(' | '));
  ok(`${label}: 0 CSP violations`, L.csp.length === 0, L.csp.slice(0, 2).join(' | '));
  const errs = L.consoleErrors.filter((e) => !/favicon/i.test(e));
  ok(`${label}: 0 console errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
};
const shot = (p, name, o) => p.shot(`${SHOTS}/9.1-3-it${iter}-${name}.png`, o);
const bannerHidden = (p) => p.ev(`(() => { const b = document.getElementById('cookie-banner'); return getComputedStyle(b).display === 'none' || b.getBoundingClientRect().height === 0; })()`);

const browser = await launch();
const page = await browser.newPage();
try {
  /* ---------- 1. home + hero carousel ---------- */
  console.log('[1] home + hero carousel');
  await page.goto(EDGE + '/', 900);
  ok('home 200', page.log.docs[0]?.status === 200, String(page.log.docs[0]?.status));
  ok('5 hero slides, slide 1 active', await page.ev(`document.querySelectorAll('.h5-slide').length === 5 && document.querySelector('.h5-slide').classList.contains('on')`));
  ok('every slide has a background', await page.ev(`[...document.querySelectorAll('.h5-slide')].every(s => s.style.background.length > 10)`));
  ok('Tajawal stylesheet NOT requested on EN home', !page.log.requests.some((u) => u.includes('family=Tajawal')));
  clean(page, 'home');
  await shot(page, 'home');
  await page.click('.h5-tab[data-i="1"]');
  ok('tab 2 click -> slide 2 active, counter 2 / 5', await page.ev(`document.querySelectorAll('.h5-slide')[1].classList.contains('on') && document.querySelector('.h5-count').textContent.trim() === '2 / 5'`));
  ok('tab 2 aria-selected', await page.ev(`document.querySelectorAll('.h5-tab')[1].getAttribute('aria-selected') === 'true'`));
  await shot(page, 'hero-slide2');
  await page.click('.h5-arrow.r');
  ok('next arrow -> slide 3', await page.ev(`document.querySelectorAll('.h5-slide')[2].classList.contains('on')`));
  await page.click('.h5-arrow.l'); await page.click('.h5-arrow.l'); await page.click('.h5-arrow.l');
  ok('prev arrow wraps 3 -> 2 -> 1 -> 5', await page.ev(`document.querySelectorAll('.h5-slide')[4].classList.contains('on')`));
  await page.click('#h5-pause-btn');
  ok('pause button toggles to Play', (await page.ev(`document.getElementById('h5-pause-btn').getAttribute('aria-label')`)).includes('Play'));
  const cur = await page.ev(`[...document.querySelectorAll('.h5-slide')].findIndex(s => s.classList.contains('on'))`);
  await wait(7000);
  ok('paused: no auto-advance after 7s', cur === await page.ev(`[...document.querySelectorAll('.h5-slide')].findIndex(s => s.classList.contains('on'))`));
  await page.click('#h5-pause-btn');
  ok('play resumes (label back to Pause)', (await page.ev(`document.getElementById('h5-pause-btn').getAttribute('aria-label')`)).includes('Pause'));
  await page.goto(EDGE + '/?slide=3');
  ok('?slide=3 deep link opens slide 4', await page.ev(`document.querySelectorAll('.h5-slide')[3].classList.contains('on')`));
  const cta = await page.ev(`document.querySelector('.h5-slide.on .btn-gold').getAttribute('href')`);
  await page.click('.h5-slide.on .btn-gold', { navigate: true });
  const landed = await page.ev('location.pathname + location.hash');
  ok('hero CTA navigates to its target', page.log.docs.at(-1)?.status === 200 && landed.startsWith(cta.split('#')[0].replace(/\/?$/, '/')), `${cta} -> ${landed}`);

  /* ---------- 2. consent banner ---------- */
  console.log('[2] cookie consent banner');
  page.resetLog();
  await page.goto(EDGE + '/');
  ok('banner visible on first visit', !(await bannerHidden(page)));
  await page.click('#cookie-reject-all');
  ok('reject: banner hidden', await bannerHidden(page));
  const ck = (await page.cookies()).find((c) => c.name === 'simal_consent');
  ok('reject: consent cookie analytics=false', !!ck && JSON.parse(decodeURIComponent(ck.value)).categories?.analytics === false);
  await page.goto(EDGE + '/about/');
  ok('banner stays hidden on the next page', await bannerHidden(page));
  await page.click('#open-cookie-settings');
  ok('footer "cookie settings" opens the preferences dialog', await page.ev(`(() => { const m = document.getElementById('cookie-modal'); return getComputedStyle(m).display !== 'none' && m.getBoundingClientRect().height > 0; })()`));
  ok('dialog reflects the recorded choice (analytics off)', await page.ev(`document.getElementById('consent-analytics').checked === false`));
  await shot(page, 'cookie-modal');
  await page.click('#cookie-modal-close');
  ok('dialog closes', await page.ev(`getComputedStyle(document.getElementById('cookie-modal')).display === 'none'`));
  clean(page, 'consent flow');

  /* ---------- 3. RFQ basket ---------- */
  console.log('[3] add to RFQ -> basket');
  page.resetLog();
  await page.goto(EDGE + '/products/');
  ok('/products/ 200', page.log.docs[0]?.status === 200);
  const slug = await page.ev(`document.querySelector('.add-rfq')?.getAttribute('data-slug')`);
  await page.click(`.add-rfq[data-slug="${slug}"]`, { settle: 900 });
  ok('Add to RFQ acknowledges', /Added/.test(await page.ev(`document.querySelector('.add-rfq[data-slug="${slug}"]').textContent`)), slug);
  await page.goto(EDGE + '/rfq/', 1200);
  ok('basket on /rfq/ lists the product', await page.ev(`document.body.innerHTML.includes(${JSON.stringify(slug)}) || (document.getElementById('basket-tbl')?.querySelectorAll('tr').length || 0) > 1`));
  await shot(page, 'rfq-basket');
  clean(page, 'rfq');

  /* ---------- 4. key pages EN + AR ---------- */
  console.log('[4] key pages');
  for (const p of ['/products/', '/products/crucial-t705-ssd-2/', '/brands/', '/solutions/', '/software/', '/insights/', '/about/', '/careers/', '/contact/', '/legal/privacy-policy/', '/ar/', '/ar/about/', '/ar/solutions/']) {
    page.resetLog();
    await page.goto(EDGE + p, 300);
    const h1 = await page.ev(`(document.querySelector('h1')?.textContent || '').trim().slice(0, 50)`);
    ok(`${p} 200, h1 present, clean`, page.log.docs[0]?.status === 200 && !!h1 && !page.log.exceptions.length && !page.log.csp.length, h1);
    if (p.startsWith('/ar/')) ok(`${p} is RTL and loads Tajawal`, (await page.ev('document.documentElement.dir')) === 'rtl' && page.log.requests.some((u) => u.includes('family=Tajawal')));
  }
  await page.goto(EDGE + '/ar/', 800); await shot(page, 'home-ar');
  await page.goto(EDGE + '/products/crucial-t705-ssd-2/', 600); await shot(page, 'pdp');
  const sm = await (await fetch(EDGE + '/sitemap.xml')).text();
  const dates = new Set([...sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].slice(0, 10)));
  ok('sitemap.xml has multiple real lastmod dates (rm 8.3)', dates.size > 1, `${(sm.match(/<url>/g) || []).length} urls, ${dates.size} dates`);

  /* ---------- 5. search + compare (interactive) ---------- */
  console.log('[5] search + compare');
  page.resetLog();
  await page.goto(EDGE + '/');
  await page.type('#hdr-q', 'crucial');
  await page.key('Enter');
  await wait(1800);
  const sp = await page.ev('location.pathname + location.search + location.hash');
  ok('header search lands on /search/?q=crucial (query intact, no stray slash)', sp === '/search/?q=crucial', sp);
  const nRes = await page.ev(`document.querySelectorAll('#results .add-rfq, #results a[href^="/products/"]').length`);
  ok('search results rendered for "crucial"', nRes > 0, `${nRes} result links; ${await page.ev(`document.getElementById('count-note')?.textContent`)}`);
  await page.type('#q', 'ddr5');
  await wait(800);
  ok('typing a new query re-renders results', (await page.ev(`document.getElementById('results').textContent.toLowerCase()`)).includes('ddr5'));
  clean(page, 'search');
  await shot(page, 'search');
  page.resetLog();
  await page.goto(EDGE + '/compare/', 800);
  const opts = await page.ev(`[...document.querySelectorAll('.cmp-sel')[0].options].map(o => o.value).filter(Boolean).slice(0, 2)`);
  await page.ev(`(() => { const s = document.querySelectorAll('.cmp-sel'); const v = ${JSON.stringify(opts)};
    s[0].value = v[0]; s[0].dispatchEvent(new Event('change')); s[1].value = v[1]; s[1].dispatchEvent(new Event('change')); })()`);
  await wait(400);
  ok('compare renders a 2-product table', (await page.ev(`document.querySelectorAll('#cmp-table th a').length`)) === 2, opts.join(' vs '));
  ok('compare slot note says 2 of 4', /2 of 4/.test(await page.ev(`document.getElementById('cmp-note').textContent`)));
  await page.ev(`document.getElementById('cmp-table').scrollIntoView({ block: 'center', behavior: 'instant' })`);
  await wait(200);
  await shot(page, 'compare');
  await page.click('#clear-cmp');
  ok('clear resets the comparison', (await page.ev(`document.querySelectorAll('#cmp-table th a').length`)) === 0);
  clean(page, 'compare');

  /* ---------- 6. mobile ---------- */
  console.log('[6] mobile 390x844');
  await page.viewport(390, 844, true);
  page.resetLog();
  await page.goto(EDGE + '/', 900);
  ok('mobile: no horizontal overflow', await page.ev('document.documentElement.scrollWidth <= window.innerWidth + 1'), String(await page.ev(`document.documentElement.scrollWidth + ' vs ' + window.innerWidth`)));
  ok('mobile: hero slide visible', await page.ev(`document.querySelector('.h5-slide.on').getBoundingClientRect().height > 200`));
  clean(page, 'mobile home');
  await shot(page, 'home-mobile');
  await page.viewport(1366, 900, false);

  /* ---------- 7/8. bulk sweeps. The header basket count is stubbed here: every page view
   * calls GET /api/rfq-basket, which shares the 30/min RFQ limiter with submissions,
   * and a 300-page sweep would only measure that limiter. ---------- */
  await page.mock('*/api/rfq-basket*', { items: [], totalQty: 0 });
  console.log('[7] home link sweep');
  await page.goto(EDGE + '/');
  const links = await page.ev(`[...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
    .filter(h => h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/api/')).map(h => h.split('#')[0]).filter(Boolean))]`);
  const bad = [];
  for (const href of links) {
    page.resetLog();
    await page.goto(EDGE + href, 150);
    const st = page.log.docs[0]?.status;
    if (st !== 200 || page.log.exceptions.length || page.log.csp.length) bad.push(`${href} ${st} ${page.log.exceptions[0] || page.log.csp[0] || ''}`);
  }
  ok(`all ${links.length} home links: 200, 0 exceptions, 0 CSP`, bad.length === 0, bad.slice(0, 4).join(' ; '));
  console.log('[8] full sitemap sweep');
  const urls = [...new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)), '/search/', '/compare/'];
  const badS = [];
  for (const u of urls) {
    page.resetLog();
    await page.goto(EDGE + u, 120);
    const st = page.log.docs[0]?.status;
    if (st !== 200 || page.log.exceptions.length || page.log.csp.length) badS.push(`${u} ${st} ${page.log.exceptions[0] || page.log.csp[0] || ''}`);
  }
  ok(`all ${urls.length} sitemap + search/compare pages: 200, 0 exceptions, 0 CSP`, badS.length === 0, badS.slice(0, 5).join(' ; '));
  await page.mock(null);
} catch (e) {
  ok('driver completed without crashing', false, e.message);
} finally {
  await browser.close();
}
console.log(`\nSITE E2E iteration ${iter}: ${pass} pass, ${fail} fail${fails.length ? ' -> ' + fails.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
