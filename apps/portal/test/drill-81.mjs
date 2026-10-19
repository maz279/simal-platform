// rm(8.1-1) live drills against the RUNNING portal (:8090) with clamd up.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8090';
const ENV = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const g = (k) => (ENV.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();

const EICAR = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', 'latin1');
const DOC_TYPES = ['trade_license', 'trn_cert', 'moa', 'signatory_id', 'tenancy', 'ubo_ids', 'bank_proof'];
const mkPdf = (label) => Buffer.concat([
  Buffer.from('%PDF-1.4\n%rm81-drill:' + label + '\n1 0 obj<</Type/Catalog>>endobj\n'),
  crypto.randomBytes(4096),
  Buffer.from('\n%%EOF\n'),
]);
const suffix = Date.now().toString(36);
const trn = ('100' + String(1000000000000 + (parseInt(suffix, 36) % 900000000000))).slice(0, 15);

let failed = 0;
try {
  const draft = await (await fetch(BASE + '/api/public/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'rm81-a-' + suffix + '@example.invalid', role: 'vendor' }) })).json();
  const stage = await fetch(BASE + '/api/public/drafts/' + draft.draftId + '/documents', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: draft.token, documents: [{ type: 'trade_license', name: 'eicar.pdf', dataB64: EICAR.toString('base64'), size: EICAR.length }] }),
  });
  const stageBody = await stage.json().catch(() => ({}));
  console.log('A wizard EICAR eicar.pdf ->', stage.status, JSON.stringify(stageBody.error || '').slice(0, 110));
  assert.equal(stage.status, 400);
  assert.match(stageBody.error || '', /Security check failed: document "eicar\.pdf" contains malicious content/);

  const login = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: g('ADMIN_EMAIL') || 'admin@simalme.com', password: g('ADMIN_PASSWORD'), totp: g('ADMIN_TOTP_SECRET') || g('TOTP_SECRET') }) });
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  const me = await (await fetch(BASE + '/api/auth/me', { headers: { cookie } })).json();
  const media = await fetch(BASE + '/api/cms/media/upload', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': me.csrfToken },
    body: JSON.stringify({ filename: 'eicar.png', base64: 'data:application/octet-stream;base64,' + EICAR.toString('base64') }),
  });
  console.log('B media EICAR ->', media.status, JSON.stringify((await media.json().catch(() => ({}))).error || '').slice(0, 100));
  assert.ok(media.status >= 400, 'media route rejects EICAR');

  const d2 = await (await fetch(BASE + '/api/public/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'rm81-c-' + suffix + '@example.invalid', role: 'vendor' }) })).json();
  const TARGET_PDF = mkPdf('primary');
  const stagedDocs = [];
  for (const dt of DOC_TYPES) {
    const buf = dt === 'trade_license' ? TARGET_PDF : mkPdf(dt);
    const r = await (await fetch(BASE + '/api/public/drafts/' + d2.draftId + '/documents', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: d2.token, documents: [{ type: dt, name: dt + '.pdf', dataB64: buf.toString('base64'), size: buf.length }] }),
    })).json();
    if (!r.staged || !r.staged[0]) throw new Error('stage failed for ' + dt + ': ' + JSON.stringify(r).slice(0, 120));
    stagedDocs.push({ type: dt, name: dt + '.pdf', docId: r.staged[0].docId, path: r.staged[0].path, size: r.staged[0].size, mime: 'application/pdf' });
  }
  console.log('C1 all 7 documents staged through clamd; primary docId:', stagedDocs[0].docId);

  const sub = await fetch(BASE + '/api/public/applications', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ application: {
      role: 'vendor',
      company: { legal_name_en: 'RM81 Drill LLC ' + suffix, entity_type: 'LLC', country: 'AE', license_number: 'CN-RM81-' + suffix, license_authority: 'DMCC', license_issue: '2024-01-01', license_expiry: '2028-01-01', business_activity: 'IT', address: { building: 'B', street: 'S', city: 'Dubai', emirate: 'Dubai', country: 'UAE' } },
      tax: { trn, vat_registered: true, einv_status: 'in_progress', invoice_currency: 'AED' },
      contacts: { primary: { name: 'RM Drill', designation: 'Owner', email: 'rm81-c-' + suffix + '@example.invalid', mobile: '+971501234567' } },
      signatories: [{ name: 'RM Drill', nationality: 'AE', designation: 'Owner', id_type: 'passport', id_number: 'P1', id_expiry: '2029-01-01', authority_basis: 'MOA (manager)', email: 'rm81-c-' + suffix + '@example.invalid' }],
      ubos: [{ name: 'RM Drill', nationality: 'AE', id_type: 'passport', id_number: 'P2', ownership_pct: '100', country_of_residence: 'UAE' }],
      banking: { bank_name: 'ENBD', iban: 'AE07 0331 2345 6789 0123 456', account_holder: 'RM Drill', currency: 'AED' },
      declarations: { accuracy: { checked: true, signed_name: 'RM Drill' }, ubo_aml: { checked: true }, updates: { checked: true }, pdpl_consent: { checked: true } },
      /* documents come from the DRAFT (server-staged, with path) — the real wizard never echoes them */
    }, draftId: d2.draftId, draftToken: d2.token }),
  });
  const subBody = await sub.json().catch(() => ({}));
  assert.ok(sub.status === 200 || sub.status === 201, 'application submitted: ' + JSON.stringify(subBody).slice(0, 260));
  console.log('C2 submitted:', subBody.reference || subBody.ref || subBody.id);

  const docId = stagedDocs[0].docId;
  const sign = await (await fetch(BASE + '/api/admin/documents/' + docId + '/sign', { method: 'POST', headers: { cookie, 'x-csrf-token': me.csrfToken } })).json();
  assert.ok(sign.signedUrl, 'signed url issued');
  const dl = await fetch(BASE + sign.signedUrl);
  assert.equal(dl.status, 200, 'signed URL fetch 200');
  const bytes = Buffer.from(await dl.arrayBuffer());
  assert.ok(bytes.equals(TARGET_PDF), 'downloaded bytes are BYTE-IDENTICAL to the uploaded PDF');
  console.log('C3 signed-URL round-trip byte-identical (' + bytes.length + ' bytes; TTL ' + sign.ttlMinutes + ' min)');

  console.log('ALL rm(8.1-1) LIVE DRILLS A/B/C PASSED (clamd engine)');
} catch (e) {
  failed = 1;
  console.error('DRILL FAILED:', e.message);
}
process.exit(failed);
