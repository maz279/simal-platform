// Verify the "dead command-bar button" claim empirically: click each and see if anything happens.
const { chromium } = require('./pw.cjs'); const fs=require('fs');
const BASE='http://127.0.0.1:18090';
const VIEWS=['workspace-editorial','slides','media-library','blocks','policies','it-solutions','products-catalog','publish-pipeline','audit-trail','users-management','announcements','testimonials'];
(async()=>{
 const b=await chromium.launch({headless:true});
 const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/cms.html',{waitUntil:'load'});
 await p.fill('#cms-email','admin@simalme.com'); await p.fill('#cms-pass','[REDACTED-ROTATED-2026-10]');
 await p.click('button[type=submit], #cms-login-btn, button:has-text("Sign in")').catch(()=>{});
 await p.waitForTimeout(2800);
 const report=[];
 for(const v of VIEWS){
   await p.evaluate(h=>{location.hash='#/'+h;},v); await p.waitForTimeout(1200);
   const btns=await p.$$eval('.d365-cmdbar button, [class*=cmdbar] button, [role=toolbar] button',
     els=>els.map((e,i)=>({i,txt:e.textContent.trim().slice(0,28),id:e.id||'(no id)',hasId:!!e.id})));
   for(const btn of btns){
     if(!btn.txt) continue;
     const before=await p.evaluate(()=>({hash:location.hash,content:(document.querySelector('#content')?.innerText||'').length,toast:document.querySelectorAll('[class*=toast]').length,modalOpen:document.querySelectorAll('.d365-modal-backdrop.open').length}));
     const net=[]; const h=req=>net.push(req.method()+' '+new URL(req.url()).pathname);
     p.on('request',h);
     await p.evaluate(({v,i})=>{const els=document.querySelectorAll('.d365-cmdbar button, [class*=cmdbar] button, [role=toolbar] button'); els[i]&&els[i].click();},{v,i:btn.i});
     await p.waitForTimeout(700); p.off('request',h);
     const after=await p.evaluate(()=>({hash:location.hash,content:(document.querySelector('#content')?.innerText||'').length,toast:document.querySelectorAll('[class*=toast]').length,modalOpen:document.querySelectorAll('.d365-modal-backdrop.open').length}));
     const apiCalls=net.filter(x=>x.includes('/api/'));
     const changed = before.hash!==after.hash || before.content!==after.content || after.modalOpen>before.modalOpen || apiCalls.length>0 || after.toast>before.toast;
     report.push({view:v,button:btn.txt,hasId:btn.hasId,effect:changed?'responds':'NO EFFECT',api:apiCalls.slice(0,2)});
     // close any modal we opened
     await p.keyboard.press('Escape').catch(()=>{}); await p.waitForTimeout(250);
     if(after.hash!==before.hash) { await p.evaluate(h=>{location.hash='#/'+h;},v); await p.waitForTimeout(700); }
   }
 }
 const dead=report.filter(r=>r.effect==='NO EFFECT');
 console.log(`Command-bar buttons clicked: ${report.length}; NO EFFECT: ${dead.length}`);
 console.log('\nDead buttons (view :: label :: has DOM id?):');
 dead.forEach(d=>console.log(`  ${d.view.padEnd(20)} :: ${d.button.padEnd(26)} :: id=${d.hasId}`));
 console.log('\nResponding buttons:');
 report.filter(r=>r.effect==='responds').forEach(d=>console.log(`  ${d.view.padEnd(20)} :: ${d.button.padEnd(26)} :: ${d.api.join(',')||'(ui only)'}`));
 fs.writeFileSync('out/cms_buttons.json',JSON.stringify(report,null,1));
 await b.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
