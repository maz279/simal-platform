const { chromium } = require('./pw.cjs'); const fs=require('fs');
const BASE='http://127.0.0.1:18090'; const REF=process.argv[2];
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1680,height:1050}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
 const bad=[]; p.on('response',r=>{if(r.url().includes('/api/')&&r.status()>=400)bad.push(r.status()+' '+new URL(r.url()).pathname);});
 await p.goto(BASE+'/admin.html',{waitUntil:'load'}); await p.waitForTimeout(800);
 const inputs=await p.$$eval('input',els=>els.map(e=>({id:e.id,name:e.name,type:e.type,vis:e.offsetParent!==null})));
 console.log('login inputs:',JSON.stringify(inputs.filter(i=>i.vis)));
 const eid=inputs.find(i=>i.vis&&i.type==='email')||inputs.find(i=>i.vis&&/mail/i.test(i.id+i.name));
 const pid=inputs.find(i=>i.vis&&i.type==='password');
 if(eid) await p.fill('#'+eid.id,'admin@simalme.com');
 if(pid) await p.fill('#'+pid.id,'[REDACTED-ROTATED-2026-10]');
 const btn=await p.$('button:has-text("Continue"), button[type=submit]');
 if(btn) await btn.click({timeout:6000}).catch(()=>{});
 await p.waitForTimeout(3000);
 await p.screenshot({path:'shots/flow_admin_after_login.png'});
 const st=await p.evaluate(()=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
   signedIn:!/Admin access is restricted/.test(t), rows:document.querySelectorAll('table tbody tr').length,
   cols:[...document.querySelectorAll('table thead th')].map(e=>e.textContent.trim()).slice(0,12),
   emptyObj:/\{\}/.test(t), nullish:/\bnull|undefined|NaN/.test(t), excerpt:t.slice(0,500)};});
 console.log('after login:',JSON.stringify(st,null,1));
 if(st.rows>0){
   const l=await p.$(`text=${REF}`);
   if(l){ await l.click({timeout:6000}).catch(()=>{}); await p.waitForTimeout(2500);
     await p.screenshot({path:'shots/flow_admin_record.png',fullPage:true});
     const rec=await p.evaluate(()=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
       emptyObj:/\{\}/.test(t), rawIban:(t.match(/AE\d{10,}/)||[])[0]||'', masked:(t.match(/AE\d{0,8}[•*]{2,}\d*/)||[])[0]||'',
       buttons:[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()).filter(Boolean).slice(0,18),
       docs:(t.match(/trade_license|signatory_id|moa\.pdf|trn_cert/g)||[]).length, excerpt:t.slice(0,600)};});
     console.log('record view:',JSON.stringify(rec,null,1));
   } else console.log('our ref not clickable in the queue');
 }
 console.log('errors:',[...new Set(errs)].slice(0,5)); console.log('failed api:',[...new Set(bad)]);
 await b.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
