/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

    /* contact island → portal /api/contact (same-origin through the edge proxy) */
    const form = document.getElementById('contactForm');
    const note = document.getElementById('formNote');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = Object.fromEntries(fd.entries());
      note.hidden = false; note.style.color = 'var(--slate)'; note.textContent = 'Sending…';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) { form.reset(); note.style.color = 'var(--ok)'; note.textContent = 'Message received — we usually reply within one business day.'; }
        else {
          const j = await r.json().catch(() => null);
          note.style.color = 'var(--danger)';
          note.textContent = (j && j.error) ? j.error : 'Something went wrong — please email info@simalme.com instead.';
        }
      } catch { note.style.color = 'var(--danger)'; note.textContent = 'Network error — please email info@simalme.com instead.'; }
    });
  
})();