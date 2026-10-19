(function () {
  var el = document.getElementById('pdp-island-data');
  if (!el) return;
  var v = JSON.parse(el.textContent);
  var slug = v.slug, name = v.name, waName = v.waName, waRef = v.waRef || ('SKU ' + v.waSku), allProductsMap = v.allProductsMap;

    /* PDP island — ported from Prototype product.js: gallery thumbs, qty stepper,
     * Add-to-RFQ → server basket, WhatsApp handoff, mini-tabs, recently viewed
     * (cookie-carried per ADR-2; the prototype's client-storage ring maps to a cookie per B2 §3). */
    const updateThumb = (t) => {
      document.querySelectorAll('#thumbs img').forEach(x => x.classList.remove('on'));
      t.classList.add('on');
      const gal = document.querySelector('#gal img');
      if (gal) gal.src = t.src;
    };

    document.querySelectorAll('#thumbs img').forEach(t => {
      t.addEventListener('click', () => updateThumb(t));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateThumb(t);
        }
      });
    });

    const qn = document.getElementById('q-n');
    const wa = document.getElementById('wa');
    const qty = () => Math.max(1, Math.min(9999, +qn.value || 1));
    const updateWa = () => {
      if (wa) wa.href = 'https://wa.me/971508487861?text=' + encodeURIComponent('Simal RFQ — ' + waName + ' (' + waRef + '), qty ' + qty());
    };

    document.getElementById('q-dec').onclick = () => { qn.value = qty() - 1; updateWa(); };
    document.getElementById('q-inc').onclick = () => { qn.value = qty() + 1; updateWa(); };
    qn.addEventListener('input', updateWa);

    const add = document.getElementById('add');
    add.addEventListener('click', async () => {
      add.textContent = 'Adding…';
      try {
        const r = await fetch('/api/rfq-basket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, qty: qty() }) });
        add.textContent = r.ok ? 'Added ✓ — in RFQ basket' : 'Failed — try from RFQ page';
        const c = document.getElementById('rfqCount');
        if (r.ok) {
          if (typeof window !== 'undefined' && window.showToast) window.showToast('Added ' + waName + ' (qty: ' + qty() + ') to RFQ basket ✓', 'ok');
          if (c) fetch('/api/rfq-basket').then(x => x.json()).then(j => { c.textContent = String(j?.totalQty ?? 0); });
        }
      } catch { add.textContent = 'Network error'; }
      setTimeout(() => { add.textContent = '🧾 Add to RFQ'; }, 2200);
    });

    document.querySelectorAll('.mini-tabs button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.mini-tabs button').forEach(x => {
        x.classList.remove('on');
        x.setAttribute('aria-selected', 'false');
      });
      b.classList.add('on');
      b.setAttribute('aria-selected', 'true');
      ['specs', 'desc', 'feat', 'box', 'docs'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.style.display = t === b.dataset.t ? '' : 'none';
      });
    }));

    document.querySelectorAll('.add-rfq').forEach(b => b.addEventListener('click', async e => {
      e.preventDefault();
      b.textContent = '…';
      try {
        const r = await fetch('/api/rfq-basket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: b.dataset.slug, qty: 1 }) });
        b.textContent = r.ok ? 'Added ✓' : 'Failed';
        if (r.ok) {
          if (typeof window !== 'undefined' && window.showToast) window.showToast('Added item to RFQ basket ✓', 'ok');
          const c = document.getElementById('rfqCount');
          if (c) fetch('/api/rfq-basket').then(x => x.json()).then(j => { c.textContent = String(j?.totalQty ?? 0); });
        }
      } catch { b.textContent = '✕'; }
      setTimeout(() => { b.textContent = 'Add to RFQ'; }, 1500);
    }));

    /* recently viewed — cookie ring of slugs (ADR-2) */
    try {
      const m = document.cookie.match(/simal_recent=([^;]+)/);
      const seen = m ? decodeURIComponent(m[1]).split(',').filter(Boolean) : [];
      const next = [slug, ...seen.filter(s => s !== slug)].slice(0, 8);
      document.cookie = 'simal_recent=' + encodeURIComponent(next.join(',')) + '; max-age=86400; path=/';

      const rGrid = document.getElementById('recent');
      const rHead = document.getElementById('recent-head');
      const otherSeen = seen.filter(s => s !== slug && allProductsMap && allProductsMap[s]);
      if (rGrid && otherSeen.length > 0) {
        if (rHead) rHead.style.display = '';
        rGrid.innerHTML = otherSeen.slice(0, 4).map(s => {
          const item = allProductsMap[s];
          const itemHref = '/products/' + encodeURIComponent(item.slug);
          const imgSrc = item.img || '/assets/img/products/placeholder.svg';
          const itemName = item.name || '';
          const itemBrand = item.brand || '';
          return '<div class="card card-p prod" style="display:flex;flex-direction:column">' +
            '<a ' + 'href="' + itemHref + '" style="text-decoration:none;color:inherit">' +
              '<div class="thumb" style="height:120px;display:grid;place-items:center;background:#fff;border-radius:8px;margin-bottom:10px">' +
                '<img ' + 'src="' + imgSrc + '" alt="' + itemName + '" style="max-height:100px;max-width:100px;object-fit:contain">' +
              '</div>' +
              '<span class="brand" style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase">' + itemBrand + '</span>' +
              '<b style="font-size:13px;display:block;margin:4px 0 8px;line-height:1.3">' + itemName + '</b>' +
            '</a>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">' +
              '<span style="font-size:12px;font-weight:700;color:var(--slate)">RFQ</span>' +
              '<a ' + 'href="' + itemHref + '" class="btn btn-sm btn-o" style="padding:4px 10px;font-size:11.5px">View →</a>' +
            '</div>' +
          '</div>';
        }).join('');
      } else if (rGrid && otherSeen.length === 0) {
        if (rHead) rHead.style.display = 'none';
        rGrid.style.display = 'none';
      }
    } catch {}
  
})();