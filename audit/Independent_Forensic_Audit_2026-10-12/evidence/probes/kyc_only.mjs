// KYC lifecycle only (sandbox), with a valid payload.
import fs from 'node:fs';
const API='http://127.0.0.1:18090'; const R=[];
const rec=(n,p,d)=>{R.push({n,p,d});console.log(`${p===true?'PASS':p===false?'FAIL':'INFO'}  ${n}${d?' :: '+d:''}`);};
function jar(){const c=new Map();return{hdr:()=>[...c].map(([k,v])=>`${k}=${v}`).join('; '),take:r=>{for(const sc of r.headers.getSetCookie?.()||[]){const kv=sc.split(';')[0],i=kv.indexOf('=');c.set(kv.slice(0,i).trim(),kv.slice(i+1).trim());}}};}
async function call(m,p,b,j){const h={};if(j){const x=j.hdr();if(x)h.cookie=x;}if(b!==undefined)h['content-type']='application/json';const r=await fetch(API+p,{method:m,headers:h,body:b===undefined?undefined:JSON.stringify(b)});if(j)j.take(r);const t=await r.text();let d;try{d=JSON.parse(t);}catch{d=t;}return{status:r.status,d,raw:t};}
const login=async(e,p)=>{const j=jar();const r=await call('POST','/api/auth/login',{email:e,password:p},j);return{j,r};};
const EMAIL=`probe.kyc.${Date.now()}@example.invalid`;
const dr=await call('POST','/api/public/drafts',{email:EMAIL,role:'vendor'});
const did=dr.d.draftId,dtok=dr.d.token;
const b64=s=>Buffer.from(s,'binary').toString('base64');
const PDF=b64('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const docs=await call('POST',`/api/public/drafts/${did}/documents`,{token:dtok,documents:[
 {type:'trade_license',name:'trade_license.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'signatory_id',name:'signatory_id.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'bank_proof',name:'bank_letter.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'trn_cert',name:'trn_cert.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'moa',name:'moa.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'tenancy',name:'tenancy.pdf',mime:'application/pdf',dataB64:PDF},
 {type:'ubo_ids',name:'ubo_ids.pdf',mime:'application/pdf',dataB64:PDF}]});
const app={role:'vendor',
 company:{legal_name_en:'Sandbox Probe Trading LLC',legal_name_ar:'شركة بروب',entity_type:'LLC',country:'AE',license_number:'CN-9988776',license_authority:'Dubai DED',license_issue:'2020-01-10',license_expiry:'2028-06-30',business_activity:'IT hardware distribution',address:{building:'Dar Al Riffa',street:'Khalid Bin Al Waleed Rd',city:'Dubai',emirate:'Dubai',country:'AE',po_box:'49740'}},
 tax:{trn:'100123456700003',peppol_id:'0235:100123456700003',invoice_currency:'AED',einv_status:'in_progress'},
 contacts:{primary:{name:'Probe Contact',email:EMAIL,mobile:'+971500000001',designation:'Owner'}},
 signatories:[{name:'Probe Signatory',designation:'Owner',email:EMAIL,mobile:'+971500000001',id_type:'emirates_id',id_number:'784-1990-1234567-1',id_expiry:'2030-01-01',authority:'director',nationality:'AE',authority_basis:'MOA (manager)'}],
 ubos:[{name:'Probe Owner',nationality:'AE',ownership_pct:100,id_type:'passport',id_number:'A1234567',country_of_residence:'AE'}],
 banking:{bank_name:'Emirates NBD',iban:'AE070331234567890123456',swift:'EBILAEAD',currency:'AED',account_holder:'Sandbox Probe Trading LLC'},
 declarations:{accuracy:{checked:true,signed_name:'Probe Signatory',ts:Date.now()},ubo_aml:{checked:true},updates:{checked:true},pdpl_consent:{checked:true,ts:Date.now(),notice_version:'v2026-10'}},
 documents:docs.d.staged||[]};
let sub=await call('POST','/api/public/applications',{draftId:did,draftToken:dtok,application:app});
if(sub.status!==201){ console.log('validation details:',JSON.stringify(sub.d.details||sub.d).slice(0,600));
  for(const d of (sub.d.details||[])){ const f=d.field.split('.');
    if(f[0]==='declarations') { const k=f[1]; app.declarations[k]=app.declarations[k]||{}; app.declarations[k].checked=true; }
  }
  sub=await call('POST','/api/public/applications',{draftId:did,draftToken:dtok,application:app});
}
rec('submit application',sub.status===201,`${sub.status} ref=${sub.d.reference||JSON.stringify(sub.d).slice(0,150)}`);
const ref=sub.d.reference;
if(ref){
 const st=await call('GET',`/api/public/applications/${ref}?email=${encodeURIComponent(EMAIL)}`);
 rec('public status (ref+email)',st.status===200,`${st.status} status=${st.d.status} historyEvents=${(st.d.history||[]).length}`);
 rec('status blocked with wrong email',(await call('GET',`/api/public/applications/${ref}?email=x@y.invalid`)).status>=400,'');
 const {j:rj,r:rl}=await login('reviewer@simalme.com','reviewer123');
 rec('reviewer login',rl.status===200,`${rl.status}`);
 const early=await call('POST',`/api/admin/submissions/${ref}/actions`,{action:'approve'},rj);
 rec('approve from submitted blocked (409)',early.status===409,`${early.status} ${String(early.d.error||'').slice(0,60)}`);
 const s1=await call('POST',`/api/admin/submissions/${ref}/actions`,{action:'start'},rj);
 rec('start review',s1.status===200,`${s1.status} -> ${s1.d.status}`);
 const q=await call('POST',`/api/admin/submissions/${ref}/query`,{section:'banking',message:'Please re-upload the bank letter.'},rj);
 rec('raise query',q.status===200,`${q.status} -> ${q.d.status}`);
 const rp=await call('POST',`/api/public/applications/${ref}/respond`,{email:EMAIL,message:'Re-uploaded as requested.'});
 rec('applicant responds',rp.status===200,`${rp.status} -> ${rp.d.status}`);
 const ap=await call('POST',`/api/admin/submissions/${ref}/actions`,{action:'approve'},rj);
 rec('approve',ap.status===200,`${ap.status} -> ${ap.d.status}`);
 const det=await call('GET',`/api/admin/submissions/${ref}`,undefined,rj);
 rec('reviewer name stored on record',det.d.reviewer&&!/object|^\{\}$/.test(JSON.stringify(det.d.reviewer)),`reviewer=${JSON.stringify(det.d.reviewer)}`);
 const aud=await call('GET','/api/admin/audit?action=all',undefined,rj);
 const mine=(Array.isArray(aud.d)?aud.d:[]).filter(a=>String(a.target)===String(ref));
 rec('audit actor is a real identity',mine.length>0&&mine.every(a=>!/object|^\{\}$/.test(String(a.actor))),`actors=${JSON.stringify([...new Set(mine.map(a=>a.actor))])} events=${mine.length}`);
 // partner account provisioning + notification
 const {j:aj}=await login('admin@simalme.com','[REDACTED-ROTATED-2026-10]');
 const ob=await call('GET','/api/admin/outbox',undefined,aj);
 const mails=(Array.isArray(ob.d)?ob.d:[]).filter(o=>String(o.to).includes(EMAIL)||String(o.to_addr||'').includes(EMAIL));
 rec('applicant notifications queued',mails.length>0,`${mails.length} mails: ${mails.map(m=>m.subject).slice(0,4).join(' | ').slice(0,160)}`);
 rec('mails actually transmitted?',null,`all marked "${[...new Set(mails.map(m=>m.status))].join(',')}" — no SMTP configured, so nothing leaves the box`);
}
fs.writeFileSync('out/kyc_lifecycle.json',JSON.stringify(R,null,1));
console.log(`\n${R.filter(x=>x.p===true).length} pass / ${R.filter(x=>x.p===false).length} fail`);
