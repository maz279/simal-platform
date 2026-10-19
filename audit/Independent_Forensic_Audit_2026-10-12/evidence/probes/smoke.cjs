const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8100/', { waitUntil: 'load' });
  console.log('title:', await p.title());
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
