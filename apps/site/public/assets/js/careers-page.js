/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

  /* Role button pre-selection */
  document.querySelectorAll('.apply-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      const sel = document.getElementById('j-role') || null;
      if (sel && role) {
        let opt = Array.from(sel.options).find(o => o.text === role);
        if (!opt) {
          opt = document.createElement('option');
          opt.text = role;
          sel.add(opt);
        }
        sel.value = opt.value || opt.text;
        const nameField = document.getElementById('j-name');
        nameField?.focus();
        nameField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* Application submission */
  const jGo = document.getElementById('j-go');
  if (jGo) {
    jGo.addEventListener('click', async () => {
      const name = (document.getElementById('j-name'))?.value.trim();
      const email = (document.getElementById('j-email'))?.value.trim();
      const role = (document.getElementById('j-role'))?.value || 'General application';
      const link = (document.getElementById('j-link'))?.value.trim();
      const why = (document.getElementById('j-why'))?.value.trim();
      const ok = (document.getElementById('j-ok'))?.checked;
      const err = document.getElementById('j-err');
      const done = document.getElementById('j-done');

      if (err) err.hidden = true;
      if (done) done.hidden = true;

      if (!name) { if (err) { err.hidden = false; err.textContent = '⚠ Full name is required.'; } return; }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { if (err) { err.hidden = false; err.textContent = '⚠ A valid email address is required.'; } return; }
      if (!ok) { if (err) { err.hidden = false; err.textContent = '⚠ Please consent to the PDPL notice.'; } return; }

      jGo.textContent = 'Submitting…';
      try {
        const cvFile = (document.getElementById('j-cv'))?.files?.[0];
        let cvPayload = null;
        if (cvFile) {
          if (cvFile.size > 5 * 1024 * 1024) {
            jGo.textContent = 'Submit application →';
            if (err) { err.hidden = false; err.textContent = '⚠ CV file exceeds 5 MB maximum limit.'; }
            return;
          }
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(cvFile);
          });
          cvPayload = { name: cvFile.name, mime: cvFile.type, data: base64 };
        }

        const res = await fetch('/api/careers/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            role,
            linkedin: link,
            why,
            cv: cvPayload
          })
        });
        const data = await res.json().catch(() => ({}));
        jGo.textContent = 'Submit application →';
        if (res.ok) {
          if (done) {
            done.hidden = false;
            done.innerHTML = `<b>Application received ✓</b> — Reference <code>${data.reference || 'CAR-RCVD'}</code>. HR will review and contact you at <b>${email}</b> within 5 business days.`;
          }
        } else {
          if (err) {
            err.hidden = false;
            err.textContent = `⚠ ${data.message || 'Submission failed. Please email careers@simalme.com directly or try again later.'}`;
          }
        }
      } catch {
        jGo.textContent = 'Submit application →';
        if (err) {
          err.hidden = false;
          err.textContent = '⚠ Network error. Please check your connection or email careers@simalme.com directly.';
        }
      }
    });
  }

})();