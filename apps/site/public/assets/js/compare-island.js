(function () {
  var el = document.getElementById('compare-island-data');
  if (!el) return;
  /* the page emits { catalog } (compare/index.astro); reading the wrapper as the
   * array threw "catalog.map is not a function" on every load since rm(3.3). */
  var catalog = JSON.parse(el.textContent).catalog;

    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const by = Object.fromEntries(catalog.map(p => [p.slug, p]));

    function current() {
      return [...document.querySelectorAll('.cmp-sel')].map(s => s.value).filter(Boolean).map(v => by[v]).filter(Boolean);
    }

    function render() {
      const picks = current();
      const el = document.getElementById('cmp-table');
      const note = document.getElementById('cmp-note');
      if (note) note.textContent = picks.length ? `${picks.length} of 4 slots used` : '';

      if (picks.length < 1) {
        el.innerHTML = '<div class="empty" style="padding:32px;text-align:center;color:var(--slate);border:1px dashed var(--line);border-radius:12px"><b>Pick one to four SKUs above — the comparison renders here.</b></div>';
        return;
      }

      const keys = [...new Set(picks.flatMap(p => (p.specs || []).map(s => s[0])))];
      const col = (html) => '<td style="border-bottom:1px solid var(--line);padding:10px 12px;font-size:13px;text-align:center">' + html + '</td>';
      let h = '<div class="card" style="padding:0;overflow:auto"><table class="tbl"><tr><th style="width:18%"></th>' +
        picks.map(p => '<th style="text-align:center;min-width:190px">' +
          (p.img ? '<img ' + 'src="' + esc(p.img) + '" alt="" style="height:64px;object-fit:contain;display:block;margin:0 auto 6px">' : '') +
          '<a ' + 'href="/products/' + esc(p.slug) + '/" style="color:var(--blue);text-decoration:none;font-weight:700">' + esc(p.name.slice(0, 44)) + '</a>' +
          '<div style="font-size:11px;color:var(--slate-500);font-weight:500;margin-top:3px">' + esc(p.brand) + ' · ' + esc(p.sku || p.slug.slice(0, 10)) + '</div></th>').join('') + '</tr>';
      h += '<tr><td><b>Category</b></td>' + picks.map(p => col(esc(p.catLabel))).join('') + '</tr>';
      h += '<tr><td><b>Stock</b></td>' + picks.map(p => col('<span class="statuspill ' + (p.stock ? 'st-ok' : 'st-warn') + '">' + (p.stock ? 'In stock' : 'On order') + '</span>')).join('') + '</tr>';
      h += '<tr><td><b>Highlights</b></td>' + picks.map(p => col('<span style="color:var(--slate);font-size:12px">' + esc(p.short || '') + '</span>')).join('') + '</tr>';
      for (const k of keys) {
        h += '<tr><td><b>' + esc(k) + '</b></td>' + picks.map(p => {
          const hit = (p.specs || []).find(s => s[0] === k);
          return col(hit ? esc(hit[1]) : '<span style="color:var(--slate-500)">—</span>');
        }).join('') + '</tr>';
      }
      h += '<tr><td><b>Pricing</b></td>' + picks.map(() => col('<span class="price" style="font-weight:700;color:var(--blue)">RFQ · channel pricing</span>')).join('') + '</tr>';
      h += '<tr><td></td>' + picks.map(p => col('<button class="btn btn-sm btn-p add-rfq" data-slug="' + p.slug + '">Add to RFQ</button>')).join('') + '</tr>';
      h += '</table></div>';
      el.innerHTML = h;

      el.querySelectorAll('.add-rfq').forEach(b => b.addEventListener('click', async (e) => {
        e.preventDefault();
        b.textContent = 'Adding…';
        try {
          const r = await fetch('/api/rfq-basket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: b.dataset.slug, qty: 1 }) });
          b.textContent = r.ok ? 'Added ✓' : 'Failed';
          const c = document.getElementById('rfqCount');
          if (r.ok && c) fetch('/api/rfq-basket').then(x => x.json()).then(j => { c.textContent = String(j?.totalQty ?? 0); });
        } catch { b.textContent = '✕'; }
        setTimeout(() => { b.textContent = 'Add to RFQ'; }, 1500);
      }));
    }

    document.querySelectorAll('.cmp-sel').forEach(s => s.addEventListener('change', render));
    document.getElementById('clear-cmp')?.addEventListener('click', () => {
      document.querySelectorAll('.cmp-sel').forEach(s => s.value = '');
      render();
    });
    render();
  
})();