/* rm(3.3): externalized island (was define:vars inline). Vars arrive via
 * <script type="application/json" id="index-island-data">. */
(function () {
  var el = document.getElementById('search-island-data');
  if (!el) return;
  /* the page emits { catalog } (search/index.astro); reading the wrapper as the
   * array threw "catalog.map is not a function" on every load since rm(3.3). */
  var catalog = JSON.parse(el.textContent).catalog;
  (function () {

    /* search island — normalize, per-word match against name/brand/sku/category/slug/
     * summary. Exact (substring) matches win; typo tolerance is a fallback used only when
     * nothing matches exactly, and it compares each query word with whole catalog words
     * (Damerau–Levenshtein, 1 edit for 4–7 letters, 2 from 8). The old fallback accepted
     * any query whose letters appeared in order anywhere in a long name, so "hikvision"
     * and "samsung" returned monitors, surge protectors and docks. */
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const idx = catalog.map(p => {
      const hay = norm([p.name, p.brand, p.sku, p.catLabel, p.slug, p.short].join(' '));
      return { p, hay, words: [...new Set(hay.split(' '))] };
    });
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /* true when the optimal-string-alignment distance between a and b is <= max */
    function near(a, b, max) {
      if (Math.abs(a.length - b.length) > max) return false;
      let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
      for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
          let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
          cur[j] = d;
          if (d < rowMin) rowMin = d;
        }
        if (rowMin > max) return false;
        prev2 = prev; prev = cur;
      }
      return prev[b.length] <= max;
    }
    const budget = (w) => (w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0);
    const fuzzyHit = (w, words) => {
      const max = budget(w);
      return max > 0 && words.some(t => near(w, t, max) || (t.length > w.length && near(w, t.slice(0, w.length), max)));
    };

    function match(q) {
      const qs = norm(q).split(' ').filter(Boolean);
      if (!qs.length) return [];
      const exact = [], fuzzy = [];
      for (const { p, hay, words } of idx) {
        let score = 0, typo = false, ok = true;
        for (const w of qs) {
          if (hay.includes(w)) { score += 10; continue; }
          if (fuzzyHit(w, words)) { score += 3; typo = true; continue; }
          ok = false; break;
        }
        if (!ok) continue;
        (typo ? fuzzy : exact).push({ p, score: score + (hay.startsWith(qs[0]) ? 5 : 0) });
      }
      return (exact.length ? exact : fuzzy).sort((a, b) => b.score - a.score).map(x => x.p);
    }

    function card(p) {
      const im = p.img ? `<img src="${p.img}" alt="${esc(p.name)}" loading="lazy">` : '';
      return '<div class="prod"><a class="go" href="/products/' + p.slug + '" aria-label="' + esc(p.name) + '"></a>' +
        '<div class="ph' + (im ? ' has-img' : '') + '">' + im + '<span class="sk">' + esc(p.sku || p.slug.slice(0, 12).toUpperCase()) + '</span></div>' +
        '<div class="pb"><span class="cat">' + esc(p.brand) + ' · ' + esc(p.catLabel) + '</span>' +
        '<h4><a href="/products/' + p.slug + '" style="color:inherit;text-decoration:none">' + esc(p.name) + '</a></h4>' +
        '<span class="meta">' + esc(String(p.short || '').slice(0, 90)) + '</span><span class="vd">View details →</span>' +
        '<div class="pr"><span class="price">RFQ · no list price</span><button class="btn btn-sm btn-p add-rfq" data-slug="' + p.slug + '">Add to RFQ</button></div></div></div>';
    }

    const qEl = document.getElementById('q');
    const res = document.getElementById('results');
    const note = document.getElementById('count-note');
    function run() {
      const q = qEl.value.trim();
      window.history.replaceState(null, '', '/search/' + (q ? '?q=' + encodeURIComponent(q) : ''));
      if (!q) { res.innerHTML = ''; note.textContent = 'Type to search — or browse the full catalog.'; return; }
      const hits = match(q);
      res.innerHTML = hits.length ? hits.map(card).join('') :
        '<div class="empty" style="grid-column:1/-1"><b>No SKUs match “' + esc(q) + '”.</b><br><br>Tell the desk the spec instead — <a href="/rfq/">build an RFQ</a> and we source it.</div>';
      note.textContent = hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for “' + q + '”';
      bindAdd();
    }
    function bindAdd() {
      res.querySelectorAll('.add-rfq').forEach(b => b.addEventListener('click', async (e) => {
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
    let t = null;
    qEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 160); });
    document.getElementById('go').addEventListener('click', run);
    qEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    /* deep-link hand-off (?q= from the header/hero search boxes) */
    const init = new URLSearchParams(location.search).get('q') || decodeURIComponent((location.hash || '').replace('#q=', '')) || '';
    if (init) { qEl.value = init; run(); }
  
  })();
})();