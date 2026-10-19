const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto('http://127.0.0.1:18090/form.html?role=vendor',{waitUntil:'load'}); await p.waitForTimeout(800);
  // clear any restored draft
  await p.evaluate(()=>{ try{localStorage.clear();sessionStorage.clear();}catch{} });
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(1000);
  const gate = await p.$('#gate-email'); if (gate) { await p.fill('#gate-email','probe2@example.invalid'); await p.click('#gate-continue'); await p.waitForTimeout(1800); }
  // list ALL visible required fields on step 1 and their values
  const pre = await p.evaluate(()=>{
    const vis=e=>e.offsetParent!==null;
    return [...document.querySelectorAll('input,select,textarea')].filter(vis).map(e=>({id:e.id||e.name,type:e.type,req:e.required||/\*/.test((document.querySelector(`label[for="${CSS.escape(e.id||'')}"]`)||{}).textContent||''),val:e.value,valid:e.checkValidity?e.checkValidity():null}));
  });
  console.log('STEP1 fields BEFORE fill:'); pre.forEach(f=>console.log('  ',f.id,f.type,'req='+f.req,'val='+JSON.stringify(String(f.val).slice(0,24))));
  // fill realistically
  const setv = async (id,v)=>{ await p.evaluate(({id,v})=>{const e=document.getElementById(id); if(!e)return; if(e.tagName==='SELECT'){e.value=v;}else{e.value=v;} e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));},{id,v}); };
  for (const f of pre) {
    if (f.type==='checkbox'||f.type==='radio') { await p.evaluate(id=>{const e=document.getElementById(id); if(e&&!e.checked){e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));}}, f.id); continue; }
    const id=(f.id||'').toLowerCase(); let v='';
    if(id.includes('legal')&&id.includes('ar')) v='شركة بروب التجارية';
    else if(id.includes('legal')||id.includes('company')) v='Sandbox Probe Trading LLC';
    else if(id.includes('trade')||id.includes('dba')) v='Probe Trading';
    else if(id.includes('year')) v='2015';
    else if(id.includes('licen')&&id.includes('num')) v='CN-9988776';
    else if(id.includes('activity')) v='IT hardware distribution';
    else if(f.type==='date') v=id.includes('expir')?'2028-06-30':'2020-01-10';
    else if(id.includes('street')||id.includes('addr')) v='Office 201, Dar Al Riffa Bldg';
    else if(id.includes('city')) v='Dubai';
    else if(id.includes('box')||id.includes('po')) v='49740';
    else if(id.includes('web')) v='https://example.invalid';
    else if(f.type==='email') v='probe2@example.invalid';
    else if(f.type==='tel') v='+971500000001';
    else if(f.tagName==='SELECT') continue;
    else v='Probe';
    if(v) await setv(f.id,v);
  }
  // selects: pick first real option
  await p.evaluate(()=>{ for(const s of document.querySelectorAll('select')){ if(s.offsetParent===null)continue; const o=[...s.options].map(x=>x.value).filter(v=>v!==''); if(o.length&&!s.value){s.value=o[0]; s.dispatchEvent(new Event('change',{bubbles:true}));} } });
  await p.waitForTimeout(600);
  // scroll to the bottom and find the real next control
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await p.waitForTimeout(400);
  await p.screenshot({path:'shots/kyc_step1_bottom.png'});
  const ctrls = await p.evaluate(()=>[...document.querySelectorAll('button,a.btn,[role=button]')].filter(e=>e.offsetParent!==null).map(e=>({tag:e.tagName,id:e.id,cls:e.className.slice(0,30),txt:e.textContent.trim().slice(0,30),disabled:e.disabled})));
  console.log('\nVisible controls:',JSON.stringify(ctrls));
  const before = await p.evaluate(()=>document.querySelector('[class*=stepper],.steps')?.innerText.replace(/\s+/g,' ').slice(0,80));
  const btn = await p.$('#btn-next, button:has-text("Continue"), button:has-text("Next")');
  if(btn){ await btn.scrollIntoViewIfNeeded(); await btn.click(); }
  await p.waitForTimeout(1800);
  const after = await p.evaluate(()=>{
    const vis=e=>e.offsetParent!==null;
    return { stepper: document.querySelector('[class*=stepper],.steps')?.innerText.replace(/\s+/g,' ').slice(0,80),
      heading:[...document.querySelectorAll('h2,h3')].filter(vis).map(e=>e.textContent.trim())[0],
      invalids:[...document.querySelectorAll(':invalid')].filter(vis).map(e=>e.id||e.name).slice(0,8),
      errText:[...document.querySelectorAll('.err,.error,[role=alert],[class*=invalid],[aria-invalid=true],.field-error,.hint-err')].filter(vis).map(e=>(e.textContent||'').trim()).filter(Boolean).slice(0,6) };
  });
  console.log('\nBEFORE stepper:',before); console.log('AFTER :',JSON.stringify(after,null,1));
  await p.screenshot({path:'shots/kyc_step1_afterclick.png'});
  await b.close();
})();
