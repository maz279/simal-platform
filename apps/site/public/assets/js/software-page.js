/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

  /* ROI Calculator interactive script */
  const rGo = document.getElementById('r-go');
  if (rGo) {
    /* rm(6.2)/PUB-11: r-ind (industry) and r-size (employees) now feed the model.
     * Industry factor scales process/IT savings (regional implementation averages);
     * employees band scales the admin-automation share (bigger orgs automate more). */
    const INDUSTRY_FACTOR = {
      'Retail & Distribution': 1.00, 'Manufacturing (RMG)': 1.15, 'Healthcare': 1.25,
      'Education': 0.95, 'Banking & Finance': 1.30, 'Government': 1.10,
      'Logistics': 1.15, 'Professional Services': 0.90, 'Other': 1.00,
    };
    const SIZE_FACTOR = (band) => {
      if (/2,000\+/.test(band)) return 1.20;
      if (/501/.test(band)) return 1.10;
      if (/201/.test(band)) return 1.05;
      return 1.00; // 11–50, 51–200
    };
    const calc = () => {
      const v = (id) => Math.max(0, +(document.getElementById(id))?.value || 0);
      const txt = (id) => (document.getElementById(id)?.value || '');
      const users = Math.max(1, v('r-users'));
      const lic = v('r-lic');
      const itH = v('r-it');
      const manH = v('r-man');
      const indF = INDUSTRY_FACTOR[txt('r-ind')] ?? 1.00;
      const sizeF = SIZE_FACTOR(txt('r-size'));
      const rate = 25; // blended $/h
      const licSave = lic * users * 12;
      const itSave = itH * 12 * rate * 0.35 * indF * sizeF;
      const manSave = manH * 12 * rate * 0.45 * indF;
      const total = Math.round(licSave + itSave + manSave);

      const rTotal = document.getElementById('r-total');
      const r3yr = document.getElementById('r-3yr');
      const rBreak = document.getElementById('r-break');

      if (rTotal) rTotal.textContent = '$' + total.toLocaleString();
      if (r3yr) r3yr.textContent = '$' + Math.round(total * 3).toLocaleString();
      if (rBreak) {
        const fmtK = (k) => (Math.abs(k - 1) < 1e-9 ? '' : ' · ×' + k.toFixed(2));
        rBreak.innerHTML =
          `<div class="tl" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px"><b>License elimination</b><span>$${Math.round(licSave).toLocaleString()} / yr</span></div>` +
          `<div class="tl" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px"><b>IT admin automation (35%${fmtK(indF * sizeF)})</b><span>$${Math.round(itSave).toLocaleString()} / yr</span></div>` +
          `<div class="tl" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><b>Process automation (45%${fmtK(indF)})</b><span>$${Math.round(manSave).toLocaleString()} / yr</span></div>`;
      }
    };
    rGo.addEventListener('click', calc);
    ['r-lic', 'r-users', 'r-it', 'r-man', 'r-ind', 'r-size'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calc);
      document.getElementById(id)?.addEventListener('change', calc);
    });
  }

  /* Demo form submission — strictly truthful (never fakes success).
   * rm(6.2): was `getElementById('d-go') | null` — bitwise OR coerces to 0, so the
   * handler never bound and the demo button was dead. */
  const dGo = document.getElementById('d-go') || null;
  if (dGo) {
    dGo.addEventListener('click', async () => {
      const err = document.getElementById('d-err');
      const mail = (document.getElementById('d-mail'))?.value.trim();
      const what = (document.getElementById('d-what'))?.value;
      const ok = (document.getElementById('d-ok'))?.checked;
      if (err) err.hidden = true;

      if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
        if (err) { err.hidden = false; err.textContent = '⚠ A valid work email is required.'; }
        return;
      }
      if (!what) {
        if (err) { err.hidden = false; err.textContent = '⚠ Pick what we should demo.'; }
        return;
      }
      if (!ok) {
        if (err) { err.hidden = false; err.textContent = '⚠ Consent under the PDPL notice is required.'; }
        return;
      }

      dGo.disabled = true;
      const originalText = dGo.textContent;
      dGo.textContent = 'Requesting…';
      try {
        const r = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'ERP Demo Lead',
            email: mail,
            topic: 'Software Demo',
            message: `Requested demo for: ${what}`
          })
        });
        if (r.ok) {
          dGo.textContent = 'Requested ✓ — our team will confirm within 24h';
        } else {
          dGo.disabled = false;
          dGo.textContent = originalText;
          if (err) {
            err.hidden = false;
            err.textContent = '⚠ Request could not be sent. Please try again or email software@simalme.com.';
          }
        }
      } catch {
        dGo.disabled = false;
        dGo.textContent = originalText;
        if (err) {
          err.hidden = false;
          err.textContent = '⚠ Network error. Please check your connection and try again.';
        }
      }
    });
  }

})();