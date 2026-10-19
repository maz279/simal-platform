const { chromium } = require('./pw.cjs');
const fs=require('fs');
const BASE='http://127.0.0.1:18090';
const REF=process.argv[2], EMAIL=process.argv[3];
(async()=>{
 const b=await chromium.launch({headless:true}); const out={};
 const quickLogin=async(p,label)=>{
   const btn=await p.$(`button:has-text("${label}")`);
   if(btn){ await btn.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(600); }
   const sb=await p.$('button:has-text("Sign In"), button:has-text("Sign in")');
   if(sb){ await sb.click({timeout:4000}).catch(()=>{}); }
   await p.waitForTimeout(2800);
 };
 // status page
 {
  const p=await b.newPage({viewport:{width:1366,height:1100}});
  await p.goto(BASE+'/status.html',{waitUntil:'load'}); await p.waitForTimeout(500);
  await p.fill('#lk-ref',REF); await p.fill('#lk-email',EMAIL);
  const btn=await p.$('button:has-text("View status")'); if(btn) await btn.click({timeout:5000}).catch(()=>{});
  await p.waitForTimeout(2500);
  await p.screenshot({path:'shots/flow_status_result.png',fullPage:true});
  out.statusPage=await p.evaluate(()=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
    showsRef:/SIM-KYC/.test(t), statusWord:(t.match(/\b(approved|under review|query raised|submitted|partner updated)\b/i)||[])[0]||'',
    emptyObjectVisible:/\{\}/.test(t), reviewerLine:(t.match(/Reviewer[^.]{0,40}/i)||[])[0]||'',
    timelineCount:(t.match(/Submission received|Review started|Query raised|Approved/g)||[]).length, excerpt:t.slice(0,500)};});
  await p.close();
 }
 // admin console
 {
  const p=await b.newPage({viewport:{width:1600,height:1050}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,110)));
  await p.goto(BASE+'/admin.html',{waitUntil:'load'}); await p.waitForTimeout(700);
  await quickLogin(p,'👑 Admin');
  await p.screenshot({path:'shots/flow_admin_queue.png'});
  out.admin=await p.evaluate((REF)=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
    signedIn:!/Sign In\b/.test(t.slice(0,400)), rows:document.querySelectorAll('table tbody tr').length,
    hasRef:t.includes(REF), emptyObjectVisible:/\{\}/.test(t),
    cols:[...document.querySelectorAll('table thead th')].map(e=>e.textContent.trim()).slice(0,12), excerpt:t.slice(0,420)};},REF);
  const l=await p.$(`text=${REF}`); if(l){await l.click({timeout:5000}).catch(()=>{}); await p.waitForTimeout(2500);
    await p.screenshot({path:'shots/flow_admin_record.png',fullPage:true});}
  out.adminRecord=await p.evaluate(()=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
    emptyObjectVisible:/\{\}/.test(t), rawIban:/AE\d{15,}/.test(t), maskedIban:/AE\d{2}[\d]{0,8}[•*]{2,}/.test(t),
    buttons:[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()).filter(Boolean).slice(0,16),
    excerpt:t.slice(0,420)};});
  out.adminErrors=[...new Set(errs)].slice(0,5);
  await p.close();
 }
 // e-invoice consoles
 for(const [n,path,label] of [['partner','/invoices.html','🤝 Partner'],['staff','/invoices-admin.html','👑 Admin']]){
  const p=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,110)));
  await p.goto(BASE+path,{waitUntil:'load'}); await p.waitForTimeout(700);
  await quickLogin(p,label);
  if(!p.url().includes(path)){ await p.goto(BASE+path,{waitUntil:'load'}); await p.waitForTimeout(2200); }
  await p.screenshot({path:`shots/flow_einv_${n}.png`});
  out['einv_'+n]=await p.evaluate(()=>{const t=document.body.innerText.replace(/\s+/g,' ');return{
    url:location.pathname, rows:document.querySelectorAll('table tbody tr').length,
    mentionsDelivered:/delivered/i.test(t), mentionsPeppol:/peppol/i.test(t),
    buttons:[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()).filter(Boolean).slice(0,14),
    excerpt:t.slice(0,400)};});
  out['einv_'+n+'_errors']=[...new Set(errs)].slice(0,4);
  await p.close();
 }
 await b.close();
 fs.writeFileSync('out/portal_ui_flows.json',JSON.stringify(out,null,1));
 console.log(JSON.stringify(out,null,1).slice(0,6500));
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
