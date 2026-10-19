const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto('http://127.0.0.1:18090/form.html?role=vendor', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const vis = e => e.offsetParent !== null;
    const steps = [...document.querySelectorAll('[data-step], .step, section[id^=step], fieldset')].map(e => ({ id: e.id, cls: e.className.slice(0,40), vis: vis(e) }));
    const allInputs = [...document.querySelectorAll('input,select,textarea')].map(e => ({ id: e.id||e.name, t: e.type, vis: vis(e), req: e.required }));
    const btns = [...document.querySelectorAll('button')].map(e => ({ id: e.id, txt: e.textContent.trim().slice(0,30), vis: vis(e) }));
    return { stepCount: steps.length, visibleSteps: steps.filter(s=>s.vis).map(s=>s.id||s.cls), totalInputs: allInputs.length, visibleInputs: allInputs.filter(i=>i.vis), visibleBtns: btns.filter(x=>x.vis), progress: (document.querySelector('[class*=prog],[class*=step]')?.innerText||'').replace(/\s+/g,' ').slice(0,200) };
  });
  console.log(JSON.stringify(info, null, 1));
  await p.screenshot({ path: 'shots/kyc_inspect.png' });
  await b.close();
})();
