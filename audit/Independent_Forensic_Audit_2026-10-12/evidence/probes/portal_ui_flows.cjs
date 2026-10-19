// SANDBOX: drive the partner status page, the staff KYC console and the e-invoice consoles in a real browser.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const BASE = 'http://127.0.0.1:18090';
const REF = process.argv[2], EMAIL = process.argv[3];
(async () => {
  const b = await chromium.launch({ headless: true });
  const out = {};

  // ---- 1. Partner status page (unauthenticated, ref + email)
  {
    const p = await b.newPage({ viewport: { width: 1366, height: 1000 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await p.goto(BASE + '/status.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    await p.fill('#lk-ref', REF); await p.fill('#lk-email', EMAIL);
    const btn = await p.$('button:has-text("Track"), button:has-text("Check"), button[type=submit]');
    if (btn) await btn.click({timeout:5000}).catch(()=>{});
    await p.waitForTimeout(2000);
    await p.screenshot({ path: 'shots/flow_status_page.png', fullPage: true });
    out.statusPage = await p.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      return { showsRef: /SIM-KYC/.test(t), showsStatus: (t.match(/approved|under review|query/i) || [])[0] || '',
        showsEmptyObject: /\{\}/.test(t), timelineRows: document.querySelectorAll('[class*=timeline] li,[class*=timeline] tr,[class*=event]').length,
        excerpt: t.slice(0, 420) };
    });
    out.statusErrors = errs;
    await p.close();
  }

  // ---- 2. Staff KYC console (admin.html)
  {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
    const errs = [], api = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 120)));
    p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 120)); });
    p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) api.push(r.status() + ' ' + new URL(r.url()).pathname); });
    await p.goto(BASE + '/admin.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.screenshot({ path: 'shots/flow_admin_login.png' });
    // login
    for (const [sel, val] of [['#email', 'admin@simalme.com'], ['#password', '[REDACTED-ROTATED-2026-10]'], ['#login-email', 'admin@simalme.com'], ['#login-password', '[REDACTED-ROTATED-2026-10]']]) {
      const el = await p.$(sel); if (el) await el.fill(val).catch(() => { });
    }
    const lb = await p.$('button:has-text("Sign in"), button[type=submit]'); if (lb) await lb.click({timeout:5000}).catch(()=>{});
    await p.waitForTimeout(2500);
    await p.screenshot({ path: 'shots/flow_admin_queue.png', fullPage: false });
    out.adminConsole = await p.evaluate((REF) => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      const rows = document.querySelectorAll('table tbody tr, [class*=row][data-ref]');
      return { loggedIn: !/sign in/i.test(t.slice(0, 200)), queueRows: rows.length, hasOurRef: t.includes(REF),
        showsEmptyObject: /\{\}/.test(t), columns: [...document.querySelectorAll('table thead th')].map(e => e.textContent.trim()).slice(0, 10),
        excerpt: t.slice(0, 350) };
    }, REF);
    // open the record
    const link = await p.$(`text=${REF}`);
    if (link) { await link.click({timeout:5000}).catch(() => { }); await p.waitForTimeout(2200); await p.screenshot({ path: 'shots/flow_admin_record.png', fullPage: true }); }
    out.adminRecord = await p.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      return { showsEmptyObject: /\{\}/.test(t), hasIban: /AE\d{10,}/.test(t), maskedIban: /AE\d{2}[\d•*]{2,}[•*]/.test(t),
        actionButtons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.textContent.trim()).filter(Boolean).slice(0, 14), excerpt: t.slice(0, 300) };
    });
    out.adminErrors = [...new Set(errs)].slice(0, 6); out.adminFailedApi = [...new Set(api)];
    await p.close();
  }

  // ---- 3. e-invoice consoles
  for (const [name, path, email, pw] of [['partner', '/invoices.html', 'partner@simalme.com', 'partner123'], ['staff', '/invoices-admin.html', 'admin@simalme.com', '[REDACTED-ROTATED-2026-10]']]) {
    const p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 110)));
    const api = []; p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) api.push(r.status() + ' ' + new URL(r.url()).pathname); });
    await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(800);
    for (const [sel, val] of [['#email', email], ['#password', pw], ['#login-email', email], ['#login-password', pw]]) { const el = await p.$(sel); if (el) await el.fill(val).catch(() => { }); }
    const lb = await p.$('button:has-text("Sign in"), button[type=submit]'); if (lb) await lb.click({timeout:5000}).catch(() => { });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `shots/flow_einv_${name}.png`, fullPage: false });
    out['einv_' + name] = await p.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      return { rows: document.querySelectorAll('table tbody tr').length, hasPeppolWording: /peppol/i.test(t),
        claimsDelivered: /delivered/i.test(t), buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.textContent.trim()).filter(Boolean).slice(0, 12), excerpt: t.slice(0, 320) };
    });
    out['einv_' + name + '_errors'] = [...new Set(errs)].slice(0, 5);
    out['einv_' + name + '_failedApi'] = [...new Set(api)];
    await p.close();
  }
  await b.close();
  fs.writeFileSync('out/portal_ui_flows.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 6000));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
