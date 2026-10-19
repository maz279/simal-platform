// SANDBOX: drive the REAL KYC onboarding wizard (portal/public/form.html) end to end.
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const BASE = 'http://127.0.0.1:18090';
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await ctx.newPage();
  const api = [], errs = [];
  p.on('response', r => { if (r.url().includes('/api/')) api.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 160)); });
  p.on('dialog', async d => { errs.push('DIALOG ' + d.message().slice(0, 120)); await d.accept(); });

  const steps = [];
  const snap = async (tag) => {
    await p.screenshot({ path: `shots/kyc_${tag}.png` });
    const s = await p.evaluate(() => {
      const vis = (el) => el && el.offsetParent !== null;
      const step = document.querySelector('.step.active, [data-step].active, .wizard-step:not([hidden])');
      const fields = [...document.querySelectorAll('input,select,textarea')].filter(vis).map(e => ({ id: e.id || e.name, type: e.type, req: e.required, label: (document.querySelector(`label[for="${CSS.escape(e.id || '')}"]`)?.textContent || '').trim().slice(0, 40) }));
      const btns = [...document.querySelectorAll('button')].filter(vis).map(e => e.textContent.trim()).filter(Boolean);
      const err = [...document.querySelectorAll('.err,.error,[class*="err"],[role=alert]')].filter(vis).map(e => e.textContent.trim()).filter(Boolean).slice(0, 4);
      const h = document.querySelector('h1,h2,h3');
      return { heading: (h?.textContent || '').trim().slice(0, 70), progress: (document.querySelector('[class*="progress"],[class*="stepper"]')?.innerText || '').replace(/\s+/g, ' ').slice(0, 110), fields, btns, err };
    });
    steps.push({ tag, ...s });
    return s;
  };

  await p.goto(BASE + '/form.html?role=vendor', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  let s = await snap('01_entry');
  console.log('ENTRY heading:', s.heading, '| progress:', s.progress);
  console.log('fields:', s.fields.map(f => f.id + ':' + f.type).join(', '));
  console.log('buttons:', s.btns.join(' | '));

  // Walk the wizard: fill whatever is visible, press Next, repeat.
  const VALUES = {
    email: 'probe.vendor@example.invalid', legal_name_en: 'Sandbox Probe Trading LLC', legal_name_ar: 'شركة بروب التجارية',
    license_number: 'CN-9988776', license_authority: 'Dubai DED', license_issue: '2024-01-10', license_expiry: '2027-01-09',
    trn: '100123456700003', peppol_id: '0235:100123456700003',
    name: 'Probe Signatory', designation: 'Owner', mobile: '+971500000001', phone: '+97143930507',
    iban: 'AE070331234567890123456', bank_name: 'Emirates NBD', swift: 'EBILAEAD', account_holder: 'Sandbox Probe Trading LLC',
    address: 'Office 1, Bur Dubai', street: 'Khalid Bin Al Waleed Rd', city: 'Dubai', emirate: 'Dubai', po_box: '49740',
    website: 'https://example.invalid', ownership: '100', nationality: 'AE', id_number: '784-1990-1234567-1', id_expiry: '2030-01-01',
  };
  const guess = (id = '', type = '') => {
    const k = id.toLowerCase();
    for (const [key, v] of Object.entries(VALUES)) if (k.includes(key.replace(/_/g, ''))) return v;
    for (const [key, v] of Object.entries(VALUES)) if (k.includes(key)) return v;
    if (type === 'email') return VALUES.email;
    if (type === 'date') return '2027-01-01';
    if (type === 'tel') return '+971500000001';
    if (type === 'number') return '1';
    if (k.includes('trn') || k.includes('tax')) return VALUES.trn;
    if (k.includes('iban')) return VALUES.iban;
    if (k.includes('name')) return 'Probe Value';
    return 'Probe ' + id;
  };

  for (let i = 1; i <= 12; i++) {
    // fill visible controls
    await p.evaluate(({ VALUES }) => { void VALUES; }, { VALUES });
    const ctrls = await p.$$('input:not([type=hidden]), select, textarea');
    for (const c of ctrls) {
      const box = await c.boundingBox(); if (!box) continue;
      const info = await c.evaluate(e => ({ id: e.id || e.name || '', type: e.type, tag: e.tagName, val: e.value, ro: e.readOnly || e.disabled }));
      if (info.ro) continue;
      try {
        if (info.type === 'checkbox') { await c.check({ timeout: 1500 }); }
        else if (info.type === 'radio') { await c.check({ timeout: 1500 }); }
        else if (info.tag === 'SELECT') { const opts = await c.$$eval('option', o => o.map(x => x.value).filter(v => v !== '')); if (opts.length) await c.selectOption(opts[0], { timeout: 1500 }); }
        else if (info.type === 'file') { /* skip real upload here */ }
        else if (!info.val) { await c.fill(guessFor(info.id, info.type), { timeout: 1500 }); }
      } catch { }
    }
    const before = p.url() + '|' + (await p.evaluate(() => document.body.innerText.slice(0, 80)));
    const next = await p.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Save & continue"), button:has-text("Review"), button:has-text("Submit")');
    if (!next) { steps.push({ tag: 'no_next_' + i }); break; }
    const label = (await next.textContent()).trim();
    await next.click().catch(() => { });
    await p.waitForTimeout(1200);
    const s2 = await snap(String(i + 1).padStart(2, '0') + '_after_' + label.replace(/\W+/g, '_').slice(0, 16));
    console.log(`step ${i}: clicked "${label}" -> heading="${s2.heading}" progress="${s2.progress}" errors=${JSON.stringify(s2.err)}`);
    const after = p.url() + '|' + (await p.evaluate(() => document.body.innerText.slice(0, 80)));
    if (/submit/i.test(label) || p.url().includes('confirmation')) break;
    if (before === after && s2.err.length === 0) { console.log('   (no progress and no error shown — stuck)'); break; }
  }
  function guessFor(id, type) { return guess(id, type); }

  console.log('\nAPI CALLS:'); console.log(api.join('\n') || '(none)');
  console.log('\nERRORS:'); console.log([...new Set(errs)].slice(0, 10).join('\n') || '(none)');
  console.log('\nfinal URL:', p.url());
  fs.writeFileSync('out/kyc_wizard.json', JSON.stringify({ steps, api, errs }, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
