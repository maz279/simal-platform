const API='http://127.0.0.1:18090';
function jar(){const c=new Map();return{hdr:()=>[...c].map(([k,v])=>`${k}=${v}`).join('; '),take:r=>{for(const sc of r.headers.getSetCookie?.()||[]){const kv=sc.split(';')[0],i=kv.indexOf('=');c.set(kv.slice(0,i).trim(),kv.slice(i+1).trim());}}};}
async function call(m,p,b,j){const h={};if(j){const x=j.hdr();if(x)h.cookie=x;}if(b!==undefined)h['content-type']='application/json';const r=await fetch(API+p,{method:m,headers:h,body:b===undefined?undefined:JSON.stringify(b)});if(j)j.take(r);const t=await r.text();let d;try{d=JSON.parse(t);}catch{d=t;}return{status:r.status,d};}
const [ref,EMAIL]=process.argv.slice(2);
const st=await call('GET',`/api/public/applications/${ref}?email=${encodeURIComponent(EMAIL)}`);
console.log('public status ->',st.status,JSON.stringify(st.d).slice(0,320));
const rp=await call('POST',`/api/public/applications/${ref}/respond`,{email:EMAIL,message:'Re-uploaded as requested.'});
console.log('respond ->',rp.status,JSON.stringify(rp.d).slice(0,160));
const j=jar(); await call('POST','/api/auth/login',{email:'reviewer@simalme.com',password:'Sandbox-Probe-Pw-1'},j);
const ap=await call('POST',`/api/admin/submissions/${ref}/actions`,{action:'approve'},j);
console.log('approve ->',ap.status,JSON.stringify(ap.d).slice(0,160));
const det=await call('GET',`/api/admin/submissions/${ref}`,undefined,j);
console.log('record reviewer field =',JSON.stringify(det.d.reviewer),'| status =',det.d.status);
console.log('history entries =',JSON.stringify((det.d.history||[]).map(h=>({by:h.by||h.actor,to:h.to||h.status}))).slice(0,300));
const ja=jar(); await call('POST','/api/auth/login',{email:'admin@simalme.com',password:'[REDACTED-ROTATED-2026-10]'},ja);
const users=(await call('GET','/api/admin/users',undefined,ja)).d;
const arr=Array.isArray(users)?users:(users.users||[]);
console.log('partner account for applicant?',!!arr.find(u=>String(u.email).toLowerCase()===EMAIL.toLowerCase()));
const st2=await call('GET',`/api/public/applications/${ref}?email=${encodeURIComponent(EMAIL)}`);
console.log('final applicant-visible status ->',st2.status,JSON.stringify(st2.d).slice(0,220));
