// SANDBOX: drive the real KYC wizard (form.html) through its 7 steps.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const BASE = 'http://127.0.0.1:18090';
const V = {
  'gate-email':'probe.vendor@example.invalid',
  trn:'100123456700003', peppol:'0235:100123456700003',
  iban:'AE070331234567890123456', swift:'EBILAEAD',
};
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const api=[], errs=[], log=[];
  p.on('response', r=>{ if(r.url().includes('/api/')) api.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
  p.on('pageerror', e=>errs.push('PAGEERROR '+e.message.slice(0,140)));
  p.on('dialog', async d=>{ errs.push('DIALOG '+d.message().slice(0,100)); await d.accept(); });
  await p.goto(BASE+'/form.html?role=vendor',{waitUntil:'load'}); await p.waitForTimeout(1000);

  await p.fill('#gate-email', V['gate-email']);
  await p.click('#gate-continue'); await p.waitForTimeout(1800);

  const fillVisible = async () => {
    return await p.evaluate((V)=>{
      const vis = e => e.offsetParent !== null && !e.readOnly && !e.disabled;
      const filled=[];
      for (const e of document.querySelectorAll('input,select,textarea')) {
        if(!vis(e)) continue;
        const id=(e.id||e.name||'').toLowerCase();
        if(e.type==='file') continue;
        if(e.type==='checkbox'){ if(!e.checked){e.checked=true; e.dispatchEvent(new Event('change',{bubbles:true}));} filled.push(id+'=checked'); continue; }
        if(e.type==='radio'){ if(!e.checked){e.checked=true; e.dispatchEvent(new Event('change',{bubbles:true}));} filled.push(id+'=radio'); continue; }
        if(e.tagName==='SELECT'){ const o=[...e.options].map(x=>x.value).filter(v=>v!==''); if(o.length&&!e.value){e.value=o[0]; e.dispatchEvent(new Event('change',{bubbles:true}));} filled.push(id+'='+e.value); continue; }
        if(e.value) { continue; }
        let v='Probe';
        if(id.includes('trn')||id.includes('tax'))v=V.trn;
        else if(id.includes('peppol'))v=V.peppol;
        else if(id.includes('iban'))v=V.iban;
        else if(id.includes('swift')||id.includes('bic'))v=V.swift;
        else if(e.type==='email')v='probe.vendor@example.invalid';
        else if(e.type==='date')v=(id.includes('expir')||id.includes('valid'))?'2028-06-30':'2024-01-10';
        else if(e.type==='tel'||id.includes('mobile')||id.includes('phone'))v='+971500000001';
        else if(e.type==='number')v='100';
        else if(id.includes('ar')&&id.includes('name'))v='شركة بروب';
        else if(id.includes('name'))v='Sandbox Probe Trading LLC';
        else if(id.includes('licen'))v='CN-9988776';
        else if(id.includes('author'))v='Dubai DED';
        else if(id.includes('address')||id.includes('street'))v='Office 1, Khalid Bin Al Waleed Rd';
        else if(id.includes('city')||id.includes('emirate'))v='Dubai';
        else if(id.includes('box'))v='49740';
        else if(id.includes('web'))v='https://example.invalid';
        else if(id.includes('design')||id.includes('title'))v='Owner';
        e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));
        filled.push(id+'='+v.slice(0,18));
      }
      return filled;
    }, V);
  };
  const state = async () => await p.evaluate(()=>{
    const vis=e=>e.offsetParent!==null;
    const err=[...document.querySelectorAll('.err,.error,[role=alert],[class*=invalid],[class*=danger]')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean).slice(0,5);
    const btns=[...document.querySelectorAll('button')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const step=(document.querySelector('[class*=progress],[class*=stepper],[class*=crumb]')?.innerText||'').replace(/\s+/g,' ').slice(0,120);
    const h=[...document.querySelectorAll('h1,h2,h3')].filter(vis).map(e=>e.textContent.trim())[0]||'';
    const nInputs=[...document.querySelectorAll('input,select,textarea')].filter(vis).length;
    return {h, step, err, btns, nInputs};
  });

  for (let i=1;i<=10;i++){
    const f = await fillVisible();
    const s0 = await state();
    await p.screenshot({path:`shots/kyc_s${String(i).padStart(2,'0')}.png`});
    const nextSel='button:has-text("Next"),button:has-text("Continue"),button:has-text("Review"),button:has-text("Submit"),button:has-text("Confirm")';
    const nb = await p.$(nextSel);
    const label = nb ? (await nb.textContent()).trim() : '(none)';
    log.push({i, heading:s0.h, progress:s0.step, visibleInputs:s0.nInputs, filled:f.length, errors:s0.err, buttons:s0.btns.slice(0,6), clicking:label});
    console.log(`[${i}] "${s0.h}" | ${s0.step} | inputs=${s0.nInputs} filled=${f.length} | err=${JSON.stringify(s0.err)} | click="${label}"`);
    if(!nb) break;
    await nb.click().catch(()=>{}); await p.waitForTimeout(1600);
    if(p.url().includes('confirmation')) { console.log('--> reached', p.url()); break; }
  }
  await p.screenshot({path:'shots/kyc_final.png'});
  const final = await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,400));
  console.log('\nFINAL URL:',p.url()); console.log('FINAL TEXT:',final);
  console.log('\nAPI:\n'+(api.join('\n')||'(none)'));
  console.log('\nERRORS:\n'+([...new Set(errs)].slice(0,8).join('\n')||'(none)'));
  fs.writeFileSync('out/kyc_drive.json',JSON.stringify({log,api,errs,final,url:p.url()},null,1));
  await b.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
