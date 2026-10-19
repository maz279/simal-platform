/* rm(3.3): externalized page island (was plain inline <script>). */
(function () {

  /* Category filtering */
  const fchips = document.querySelectorAll('.fchip');
  const cards = document.querySelectorAll('.art-card');
  const featured = document.getElementById('featured');
  function filterBy(cat) {
    fchips.forEach(x => x.classList.toggle('on', x.dataset.f === cat || (cat === 'ALL' && x.dataset.f === 'ALL')));
    cards.forEach(card => {
      card.style.display = (cat === 'ALL' || card.dataset.cat === cat) ? '' : 'none';
    });
    // rm(6.2): the featured banner is arts[0] and is counted by the chips — filter it too,
    // or a category chip shows (N) but renders N-1 items with a stale banner on top.
    if (featured) featured.style.display = (cat === 'ALL' || featured.dataset.cat === cat) ? '' : 'none';
  }
  fchips.forEach(c => c.addEventListener('click', () => {
    const f = c.dataset.f || 'ALL';
    filterBy(f);
  }));

  // Honour hash navigation for category deep links
  const hash = (location.hash || '').replace(/^#/, '');
  if (hash) {
    const cleanHash = hash.replace(/^cat-/, '').toLowerCase();
    const match = [...fchips].find(c => (c.dataset.f || '').toLowerCase() === cleanHash || c.id.toLowerCase() === ('cat-' + cleanHash));
    if (match) filterBy(match.dataset.f || 'ALL');
  }

  /* Newsletter subscription */
  const iGo = document.getElementById('i-go');
  if (iGo) {
    iGo.addEventListener('click', async () => {
      const email = (document.getElementById('i-mail'))?.value.trim();
      const msg = document.getElementById('i-msg');
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        if (msg) { msg.style.display = 'block'; msg.textContent = 'Please enter a valid work email.'; }
        return;
      }
      iGo.textContent = 'Subscribing…';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Insights Subscriber',
            email,
            topic: 'Newsletter',
            message: 'Monthly digest subscription from /insights'
          })
        });
        if (res.ok) {
          iGo.textContent = 'Subscribed ✓';
          if (msg) { msg.style.display = 'block'; msg.textContent = 'Thank you! Confirmation sent.'; }
        } else {
          iGo.textContent = 'Failed';
          if (msg) { msg.style.display = 'block'; msg.textContent = 'Subscription failed. Please email info@simalme.com.'; }
        }
      } catch {
        iGo.textContent = 'Failed';
        if (msg) { msg.style.display = 'block'; msg.textContent = 'Network error. Please try again later.'; }
      }
      setTimeout(() => { iGo.textContent = 'Subscribe free →'; }, 4000);
    });
  }

  /* Line card download */
  const gGo = document.getElementById('g-go');
  if (gGo) {
    gGo.addEventListener('click', async () => {
      const email = (document.getElementById('g-mail'))?.value.trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        alert('Please enter a valid work email.');
        return;
      }
      gGo.textContent = 'Sending…';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Line Card Request',
            email,
            topic: 'Line Card',
            message: '2026 Simal Line Card requested from /insights'
          })
        });
        if (res.ok) {
          gGo.textContent = 'Sent ✓';
          alert(`The 2026 Simal Line Card has been sent to ${email}`);
        } else {
          gGo.textContent = 'Failed';
          alert('Request failed. Please email info@simalme.com directly.');
        }
      } catch {
        gGo.textContent = 'Failed';
        alert('Network error. Please email info@simalme.com directly.');
      }
      setTimeout(() => { gGo.textContent = 'Get the PDF →'; }, 4000);
    });
  }

})();