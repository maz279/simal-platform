const API=process.env.API || 'http://127.0.0.1:8090';
function jar(){const c=new Map();return{hdr:()=>[...c].map(([k,v])=>`${k}=${v}`).join('; '),take:r=>{for(const sc of r.headers.getSetCookie?.()||[]){const kv=sc.split(';')[0],i=kv.indexOf('=');c.set(kv.slice(0,i).trim(),kv.slice(i+1).trim());}}};}
async function call(m,p,b,j){const h={};if(j){const x=j.hdr();if(x)h.cookie=x;}if(b!==undefined)h['content-type']='application/json';const r=await fetch(API+p,{method:m,headers:h,body:b===undefined?undefined:JSON.stringify(b)});if(j)j.take(r);const t=await r.text();let d;try{d=JSON.parse(t);}catch{d=t;}return{status:r.status,d,raw:t};}
const j=jar(); await call('POST','/api/auth/login',{email:'admin@simalme.com',password:'[REDACTED-ROTATED-2026-10]'},j);
const q=await call('GET','/api/admin/submissions?per=5',undefined,j);
const rows=q.d.rows||[];
console.log('1) queue rows: submittedAt/ageDays/slaBreached per row:');
rows.slice(0,5).forEach(r=>console.log(`   ${r.id}  submittedAt=${JSON.stringify(r.submittedAt)}  ageDays=${JSON.stringify(r.ageDays)}  slaBreached=${JSON.stringify(r.slaBreached)}  submitted_at=${JSON.stringify(r.submitted_at)}`));
const anyBreach=rows.some(r=>r.slaBreached===true);
console.log(`   -> SLA breach ever flagged? ${anyBreach}  (FRS RC-02 requires >1bd warning / >1.5bd breach)`);
const rep=await call('POST','/api/admin/reports/build',{fields:['id','company.legal_name_en','submittedAtISO']},j);
console.log(`2) POST /api/admin/reports/build -> ${rep.status} ${JSON.stringify(rep.d).slice(0,100)}`);
const csv=await call('GET','/api/admin/export.csv',undefined,j);
console.log(`3) GET /api/admin/export.csv -> ${csv.status} ${String(csv.raw).slice(0,100)}`);
const an=await call('GET','/api/admin/analytics',undefined,j);
console.log(`4) GET /api/admin/analytics -> ${an.status} stats=${JSON.stringify(an.d.stats).slice(0,160)}`);
const rp=await call('POST','/api/admin/reports/build',{builtIn:'user-activity'},j);
console.log(`5) built-in report (audit-backed) -> ${rp.status} rows=${rp.d.rowCount??JSON.stringify(rp.d).slice(0,60)}`);
