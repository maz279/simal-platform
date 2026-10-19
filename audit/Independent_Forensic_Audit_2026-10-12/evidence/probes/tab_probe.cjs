const { chromium } = require('./pw.cjs');
(async () => {
  const b = await chromium.launch({ headless: true }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const cmsUrl = process.env.CMS_URL || 'http://127.0.0.1:8090/cms.html';
  await p.goto(cmsUrl, { waitUntil: 'load' });
  const email = process.env.ADMIN_EMAIL || 'admin@smartme.com';
  const pass = process.env.ADMIN_PASSWORD; // rm(security): hardcoded fallback removed 2026-10
  await p.fill('#cms-email', email); await p.fill('#cms-pass', pass);
  await p.click('button[type=submit], #cms-login-btn, button:has-text("Sign in")'); await p.waitForTimeout(2500);
  let inClosedModal = 0, total = 120; const samples = new Set();
  for (let i = 0; i < total; i++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate(() => { const a = document.activeElement; const m = a && a.closest('.d365-modal-backdrop'); return m && !m.classList.contains('open') ? (m.id + ' > ' + (a.id || a.tagName) + ' ' + (a.textContent || a.placeholder || '').trim().slice(0, 30)) : ''; });
    if (r) { inClosedModal++; samples.add(r); }
  }
  console.log(`Tab presses: ${total}; focus landed inside a CLOSED (invisible) modal: ${inClosedModal} times`);
  console.log([...samples].slice(0, 8).join('\n'));
  await b.close();
})();
