#!/usr/bin/env node
// deploy-rehearsal.mjs — deploy the whole system the way production runs it and prove it works:
// the portal image (NODE_ENV=production) + PostgreSQL 16 + the nginx edge over TLS, from
// infra/docker/compose.yml, with freshly generated secrets. Nothing secret is written inside
// the repository or printed. Usage (repo root):
//   node scripts/deploy-rehearsal.mjs            # build, deploy, verify, tear down
//   node scripts/deploy-rehearsal.mjs --keep     # leave the stack running afterwards
// Needs Docker (compose v2) and openssl. Edge ports: 9443 (https) / 9080 (http).
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEEP = process.argv.includes('--keep');
const PROJECT = 'simal-rehearsal';
const HTTPS_PORT = 9443;
const IMAGE = 'simal-portal:rehearsal';
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'simal-rehearsal-'));
let fails = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) fails++; return cond; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hex = (n = 24) => crypto.randomBytes(n).toString('hex');

/* only what compose needs — never the caller's environment (a developer .env must not leak in) */
const dockerEnv = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, USERPROFILE: process.env.USERPROFILE, HOME: process.env.HOME, APPDATA: process.env.APPDATA, LOCALAPPDATA: process.env.LOCALAPPDATA, TEMP: process.env.TEMP, TMP: process.env.TMP, ProgramData: process.env.ProgramData, DOCKER_CONFIG: process.env.DOCKER_CONFIG };
for (const k of Object.keys(dockerEnv)) if (dockerEnv[k] === undefined) delete dockerEnv[k];
const run = (args, opts = {}) => spawnSync(args[0], args.slice(1), { cwd: REPO, encoding: 'utf8', env: dockerEnv, maxBuffer: 64 * 1024 * 1024, ...opts });
const compose = (...args) => run(['docker', 'compose', '-p', PROJECT, '-f', 'infra/docker/compose.yml', '--env-file', path.join(WORK, 'compose.env'), ...args]);

/* RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for the generated admin secret */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function totp(secret, t = Date.now()) {
  let bits = ''; for (const c of secret) bits += B32.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const ctr = Buffer.alloc(8); ctr.writeBigUInt64BE(BigInt(Math.floor(t / 30000)));
  const h = crypto.createHmac('sha1', key).update(ctr).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

/* HTTPS to the edge with the right SNI/Host, trusting only the generated CA */
let CA;
function req(host, method, p, { body, headers = {}, raw = false } = {}) {
  return new Promise((resolve) => {
    const data = body === undefined ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const r = https.request({ host: '127.0.0.1', port: HTTPS_PORT, servername: host, ca: CA, method, path: p,
      headers: { Host: host, ...(data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {}), ...headers } }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8'); let json = null; if (!raw) { try { json = JSON.parse(text); } catch { /* html */ } } resolve({ status: res.statusCode, headers: res.headers, text, json }); });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message, headers: {}, text: '' }));
    r.setTimeout(30000, () => r.destroy(new Error('timeout')));
    if (data) r.write(data);
    r.end();
  });
}
async function until(fn, ms, step = 2000) { const end = Date.now() + ms; let last; while (Date.now() < end) { last = await fn(); if (last.done) return last; await sleep(step); } return last || {}; }

try {
  /* ---- 1. secrets, certificate, env files (temp dir, outside the repository) ---- */
  const certs = path.join(WORK, 'certs'); fs.mkdirSync(certs);
  const cert = run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=simalme.com',
    '-addext', 'subjectAltName=DNS:simalme.com,DNS:www.simalme.com,DNS:kyc.simalme.com',
    '-keyout', path.join(certs, 'privkey.pem'), '-out', path.join(certs, 'fullchain.pem')]);
  if (!ok('rehearsal TLS certificate generated', cert.status === 0, (cert.stderr || '').trim().split('\n').pop())) throw new Error('openssl');
  CA = fs.readFileSync(path.join(certs, 'fullchain.pem'));
  const wl = path.join(WORK, 'watchlist'); fs.mkdirSync(wl);
  fs.copyFileSync(path.join(REPO, 'apps/portal/test/fixtures/watchlist.csv'), path.join(wl, 'watchlist.csv'));
  let totpSecret = ''; for (const b of crypto.randomBytes(32)) totpSecret += B32[b % 32];
  const admin = { email: 'ops-admin@rehearsal.test', password: crypto.randomBytes(18).toString('base64url') };
  fs.writeFileSync(path.join(WORK, 'portal.env'), [
    'ADMIN_EMAIL=' + admin.email, 'ADMIN_NAME=Rehearsal Admin', 'ADMIN_PASSWORD=' + admin.password,
    'ADMIN_MFA_REQUIRED=true', 'ADMIN_TOTP_SECRET=' + totpSecret,
    'CSRF_SECRET=' + hex(32), 'DOC_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('base64'), 'MASTER_API_TOKEN=' + hex(32),
    'PORTAL_PUBLIC_URL=https://kyc.simalme.com', 'SITE_PUBLIC_URL=https://simalme.com', 'SIMAL_TIN=100987654300003',
    'NOTIFY_EMAIL_ENABLED=false', 'NOTIFY_WHATSAPP_ENABLED=false', 'CLAMAV_HOST=clamav', 'CLAMAV_PORT=3310',
    'MFA_TOTP_ONE_TIME=false', '',
  ].join('\n'));
  fs.writeFileSync(path.join(WORK, 'compose.env'), [
    'PG_SUPERUSER_PASSWORD=' + hex(), 'SIMAL_APP_PASSWORD=' + hex(), 'SIMAL_BUILD_PASSWORD=' + hex(),
    'PORTAL_ENV_FILE=' + path.join(WORK, 'portal.env'), 'CERTS_DIR=' + certs, 'WATCHLIST_DIR=' + wl,
    'PORTAL_IMAGE=' + IMAGE, 'EDGE_HTTPS_PORT=' + HTTPS_PORT, 'EDGE_HTTP_PORT=9080', '',
  ].join('\n'));

  /* ---- 2. image from a clean context (repo root, whitelisted by Dockerfile.dockerignore) ---- */
  const t0 = Date.now();
  const build = run(['docker', 'build', '-q', '-t', IMAGE, '-f', 'apps/portal/Dockerfile', '.'], { env: { ...dockerEnv, DOCKER_BUILDKIT: '1' } });
  if (!ok('portal image builds from a clean context', build.status === 0, build.status === 0 ? Math.round((Date.now() - t0) / 1000) + ' s' : (build.stderr || '').slice(-600))) throw new Error('build');
  const leak = run(['docker', 'run', '--rm', '--entrypoint', 'sh', IMAGE, '-c', 'find /app -name ".env" -o -name "*.pem" | head -5; ls /app/apps/portal/data 2>/dev/null | head -3']);
  ok('image holds no .env, keys or host data', leak.status === 0 && !leak.stdout.trim(), leak.stdout.trim());

  /* ---- 3. a production boot refuses an incomplete configuration ---- */
  const refuse = compose('run', '--rm', '--no-deps', '-e', 'CSRF_SECRET=', 'portal');
  ok('production boot refuses a missing CSRF_SECRET', refuse.status !== 0 && /Refusing to start in production[\s\S]*CSRF_SECRET/.test(refuse.stdout + refuse.stderr));

  /* ---- 4. deploy ---- */
  const up = compose('up', '-d', '--wait', '--wait-timeout', '240');
  if (!ok('stack up (db, portal, edge healthy)', up.status === 0, up.status === 0 ? '' : (up.stderr || '').slice(-800))) throw new Error('up');

  /* ---- 5. first deploy publishes the site with no staff action ---- */
  const first = await until(async () => { const r = await req('simalme.com', 'GET', '/'); return { done: r.status === 200, r }; }, 240000, 3000);
  ok('public site live after first deploy (bootstrap build)', first.r?.status === 200, 'HTTP ' + first.r?.status);
  const home = first.r?.text || '';
  const yearsBefore = (home.match(/<meta name="simal:years" content="(\d+)"/) || [])[1];
  ok('home page served from the CMS database', !!yearsBefore && /<title>/.test(home), 'simal:years=' + yearsBefore);

  /* ---- 6. edge behaviour ---- */
  const health = await req('kyc.simalme.com', 'GET', '/api/health');
  ok('portal health through the edge reports the database', health.status === 200 && health.json?.db === 'up', JSON.stringify(health.json));
  const csp = health.headers['content-security-policy'];
  ok('portal responses carry exactly one CSP', typeof csp === 'string' && !Array.isArray(csp) && /connect-src 'self' https:\/\/simalme\.com/.test(csp), String(csp).slice(0, 90));
  for (const p of ['/api/admin/users', '/api/cms/blocks', '/api/auth/me']) {
    const r = await req('simalme.com', 'GET', p);
    ok('public vhost does not expose ' + p, r.status === 404, 'HTTP ' + r.status);
  }
  const nf = await req('simalme.com', 'GET', '/no-such-page/');
  ok('unknown public path is a real 404 with the site 404 page', nf.status === 404 && /<html/i.test(nf.text) && nf.text !== home, 'HTTP ' + nf.status);
  const asset = (home.match(/\/_astro\/[^"']+\.(?:css|js)/) || [])[0];
  if (asset) {
    const a = await req('simalme.com', 'GET', asset, { raw: true });
    ok('hashed assets are cached immutable', a.status === 200 && /immutable/.test(a.headers['cache-control'] || ''), asset + ' ' + a.headers['cache-control']);
  }
  const plain = await new Promise((resolve) => { const r = (http) => http; import('node:http').then((http) => { const q = http.request({ host: '127.0.0.1', port: 9080, path: '/x', headers: { Host: 'simalme.com' } }, (res) => resolve(res)); q.on('error', () => resolve({ statusCode: 0, headers: {} })); q.end(); }); });
  ok('http redirects to https', plain.statusCode === 301 && String(plain.headers.location).startsWith('https://simalme.com/'), plain.statusCode + ' ' + plain.headers.location);

  /* ---- 7. public forms through the site vhost ---- */
  const contact = await req('simalme.com', 'POST', '/api/contact', { headers: { Origin: 'https://simalme.com' },
    body: { name: 'Rehearsal Visitor', email: 'visitor@rehearsal.test', company: 'Rehearsal LLC', message: 'Deployment rehearsal — contact form through the edge.', topic: 'general' } });
  ok('contact form submits through the public vhost', contact.status >= 200 && contact.status < 300, 'HTTP ' + contact.status + ' ' + (contact.json?.error || ''));

  /* ---- 8. KYC: 9 MB document through the edge (nginx body cap + route cap) ---- */
  const draft = await req('kyc.simalme.com', 'POST', '/api/public/drafts', { headers: { Origin: 'https://kyc.simalme.com' }, body: { email: 'kyc-partner@rehearsal.test', role: 'vendor' } });
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7 '), crypto.randomBytes(9 * 1024 * 1024)]);
  const up9 = await req('kyc.simalme.com', 'POST', '/api/public/drafts/' + draft.json?.draftId + '/documents', { headers: { Origin: 'https://kyc.simalme.com' },
    body: { token: draft.json?.token, documents: [{ type: 'trade_license', name: 'licence-scan.pdf', mime: 'application/pdf', dataB64: pdf.toString('base64') }] } });
  ok('9 MB KYC document uploads through the edge', up9.status === 200 && up9.json?.staged?.[0]?.size > 9e6, 'HTTP ' + up9.status + ' ' + (up9.json?.error || ''));

  /* ---- 9. staff sign-in (password + TOTP), CMS edit, publish → public site ---- */
  const H = { Origin: 'https://kyc.simalme.com' };
  const cookieOf = (r) => [].concat(r.headers['set-cookie'] || []).map((c) => c.split(';')[0]).find((c) => /kyc_sid=/.test(c));
  let r = await req('kyc.simalme.com', 'POST', '/api/auth/login', { headers: H, body: admin });
  ok('staff login asks for the second factor', r.status === 200 && r.json?.mfaRequired === true, 'HTTP ' + r.status);
  r = await req('kyc.simalme.com', 'POST', '/api/auth/mfa', { headers: H, body: { mfaChallengeId: r.json?.mfaChallengeId, code: totp(totpSecret) } });
  const cookie = cookieOf(r);
  ok('TOTP completes sign-in with a __Host- session cookie', r.status === 200 && /^__Host-kyc_sid=/.test(cookie || ''), 'HTTP ' + r.status);
  const S = { ...H, cookie, 'x-csrf-token': r.json?.csrfToken };
  const blk = await req('kyc.simalme.com', 'GET', '/api/cms/blocks/site/counters', { headers: S });
  const payload = blk.json?.block?.payload || blk.json?.payload || {};
  const target = String(Number(yearsBefore || 24) + 13);
  const put = await req('kyc.simalme.com', 'PUT', '/api/cms/blocks/site/counters', { headers: S, body: { payload: { ...payload, years: Number(target) } } });
  ok('CMS edit saved (site/counters years → ' + target + ')', put.status === 200, 'HTTP ' + put.status + ' ' + (put.json?.error || ''));
  const pub = await req('kyc.simalme.com', 'POST', '/api/cms/publish', { headers: S, body: { entities: [{ entity: 'site', entity_id: 'counters' }] } });
  ok('publish accepted', pub.status === 200 && !!pub.json?.outboxId, 'HTTP ' + pub.status + ' ' + (pub.json?.outboxId || pub.json?.error || ''));
  const live = await until(async () => { const h = await req('simalme.com', 'GET', '/'); return { done: h.text.includes(`<meta name="simal:years" content="${target}"`), h }; }, 240000, 3000);
  ok('the CMS edit is live on https://simalme.com/ (build → DEPLOY_DIR → nginx)', !!live.done);

  /* ---- 10. the portal survives a database restart (pool reconnects; no portal restart) ---- */
  const started = run(['docker', 'inspect', '-f', '{{.State.StartedAt}}', PROJECT + '-portal-1']).stdout.trim();
  compose('restart', 'db');
  const back = await until(async () => { const h = await req('kyc.simalme.com', 'GET', '/api/health'); return { done: h.status === 200 && h.json?.db === 'up', h }; }, 90000, 2000);
  const after = run(['docker', 'inspect', '-f', '{{.State.StartedAt}}', PROJECT + '-portal-1']).stdout.trim();
  ok('portal recovers from a database restart without restarting', !!back.done && started === after, 'portal started ' + started);
  const me = await req('kyc.simalme.com', 'GET', '/api/auth/me', { headers: S });
  ok('staff session still valid after the database restart', me.status === 200, 'HTTP ' + me.status);

  /* ---- 11. logs carry no secrets ---- */
  const logs = compose('logs', '--no-color', 'portal').stdout;
  const secrets = fs.readFileSync(path.join(WORK, 'portal.env'), 'utf8').split('\n').map((l) => l.split('=').slice(1).join('=')).filter((v) => v.length >= 16);
  ok('portal logs contain none of the generated secrets', !secrets.some((s) => logs.includes(s)), logs.split('\n').length + ' log lines');
} catch (e) {
  ok('rehearsal completed', false, String(e.message || e));
} finally {
  if (KEEP) console.log(`stack left running (project ${PROJECT}); secrets in ${WORK}`);
  else { compose('down', '-v', '--remove-orphans'); fs.rmSync(WORK, { recursive: true, force: true }); }
}
console.log(fails ? `DEPLOY REHEARSAL: ${fails} FAIL` : 'DEPLOY REHEARSAL: ALL PASS');
process.exit(fails ? 1 : 0);
