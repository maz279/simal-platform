/* Category listing: hash-driven (#cat | #all), brand/stock facets, sort, pagination 12/pg */
(function () {
  var CATS = {
    'internal-ssd': 'Internal SSDs', 'portable-ssd': 'Portable SSDs', 'memory': 'Memory (RAM)',
    'monitors': 'Monitors & Displays', 'gaming': 'Gaming', 'accessories': 'Accessories & Power', 'laptops': 'Laptops'
  };
  var state = { cat: null, brand: null, stock: false, sort: 'featured', page: 1, per: 12 };

  function readHash() {
    var h = decodeURIComponent(location.hash.replace('#', ''));
    state.cat = (h && h !== 'all' && CATS[h]) ? h : null;
    state.page = 1;
  }

  function renderFacets() {
    var catCount = {};
    CATALOG.forEach(function (p) { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });
    document.getElementById('f-cat').innerHTML =
      '<a class="filterlink' + (!state.cat ? ' on' : '') + '" data-cat="">All products <b style="float:right;color:var(--slate)">' + CATALOG.length + '</b></a>' +
      Object.keys(CATS).map(function (k) {
        return '<a class="filterlink' + (state.cat === k ? ' on' : '') + '" data-cat="' + k + '">' + CATS[k] +
          ' <b style="float:right;color:var(--slate)">' + (catCount[k] || 0) + '</b></a>';
      }).join('');
    var bc = {};
    CATALOG.forEach(function (p) { if (p.brand !== 'other') bc[p.brand] = (bc[p.brand] || 0) + 1; });
    document.getElementById('f-brand').innerHTML = Object.keys(bc).sort(function (a, b) { return a.localeCompare(b); }).map(function (b) {
      return '<a class="filterlink' + (state.brand === b ? ' on' : '') + '" data-brand="' + b + '">' + S.esc(b) + ' <b style="float:right;color:var(--slate)">' + bc[b] + '</b></a>';
    }).join('');
    document.querySelectorAll('#f-cat a').forEach(function (a) {
      a.addEventListener('click', function () {
        var c = a.getAttribute('data-cat');
        location.hash = c ? c : 'all';
      });
    });
    document.querySelectorAll('#f-brand a').forEach(function (a) {
      a.addEventListener('click', function () {
        state.brand = state.brand === a.getAttribute('data-brand') ? null : a.getAttribute('data-brand');
        state.page = 1; apply();
      });
    });
  }

  function items() {
    var list = CATALOG.filter(function (p) {
      if (state.cat && p.cat !== state.cat) return false;
      if (state.brand && p.brand !== state.brand) return false;
      if (state.stock && !p.stock) return false;
      return true;
    });
    if (state.sort === 'newest') list = list.slice().sort(function (a, b) { return (b.new ? 1 : 0) - (a.new ? 1 : 0); });
    if (state.sort === 'brand') list = list.slice().sort(function (a, b) { return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name); });
    if (state.sort === 'name') list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    return list;
  }

  function apply() {
    var list = items();
    var pages = Math.max(1, Math.ceil(list.length / state.per));
    if (state.page > pages) state.page = pages;
    var view = list.slice((state.page - 1) * state.per, state.page * state.per);

    document.getElementById('cat-title').textContent = state.cat ? CATS[state.cat] : 'All products';
    document.getElementById('cat-sub').textContent = state.brand ? (state.brand + ' line — genuine, authorized stock.') : 'Every SKU, spec and photo — genuine stock, JAFZA-fulfilled.';
    document.getElementById('crumb').textContent = state.cat ? CATS[state.cat] : 'All';

    // category buying guide (content §03-03…07) — deeper orientation above the grid
    var gEl = document.getElementById('cat-guide');
    var g = state.cat && S.catGuide ? S.catGuide[state.cat] : null;
    if (gEl) {
      if (g) {
        gEl.style.display = '';
        gEl.innerHTML = '<div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><b style="font-size:15px">' + S.esc(CATS[state.cat]) + ' — buying guide</b><span style="font-size:12px;color:var(--slate-500)">content package §03</span></div>' +
          '<p style="font-size:13.5px;color:var(--slate);margin:8px 0 10px;max-width:860px">' + S.esc(g.intro) + '</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' + g.points.map(function (x) {
            return '<span class="chip" style="font-size:12px;padding:5px 12px">✓ ' + S.esc(x) + '</span>';
          }).join('') + '</div>';
      } else gEl.style.display = 'none';
    }

    // recently viewed strip (hidden until there is history)
    var rh = document.getElementById('recent-head'), rc = document.getElementById('recent');
    if (rh && rc) {
      var seen = (S.recent ? S.recent() : []).filter(function (s) { return s; });
      var html = seen.map(function (s) { var q = S.product(s); return q ? S.card(q) : ''; }).join('');
      if (html) { rh.style.display = ''; rc.style.display = ''; rc.innerHTML = html; S.bindCards(rc); }
      else { rh.style.display = 'none'; rc.style.display = 'none'; }
    }

    document.getElementById('count-note').textContent = 'Showing ' + (list.length ? ((state.page - 1) * state.per + 1) + '–' + Math.min(state.page * state.per, list.length) + ' of ' + list.length : '0') + ' SKUs';

    var grid = document.getElementById('grid');
    grid.innerHTML = view.length ? view.map(S.card).join('') : '<div class="empty" style="grid-column:1/-1">No SKUs match these filters.<br><br><button class="btn btn-o" id="clr2">Clear filters</button></div>';
    S.bindCards(grid);
    var clr2 = document.getElementById('clr2');
    if (clr2) clr2.addEventListener('click', function () { state.brand = null; state.stock = false; document.getElementById('f-stock').checked = false; apply(); });

    document.getElementById('pager').innerHTML = pages > 1 ? Array.from({ length: pages }, function (_, i) {
      return '<a href="#page' + (i + 1) + '" class="' + (state.page === i + 1 ? 'on' : '') + '" data-p="' + (i + 1) + '">' + (i + 1) + '</a>';
    }).join('') : '';

    // sparse results (short categories) — close the grid with a help band instead of dead space
    var helpEl = document.getElementById('grid-help');
    if (helpEl) {
      if (list.length > 0 && list.length <= 6) {
        helpEl.style.display = '';
        helpEl.innerHTML = '<div class="split" style="grid-template-columns:1.2fr .8fr;gap:20px;align-items:center">' +
          '<div><b style="font-size:16px">Not exactly what you need?</b>' +
          '<p style="font-size:13.5px;color:var(--slate);margin:6px 0 12px">This line is a focused selection — the full ' + CATALOG.length + '-SKU catalog, other categories and bundle quotes are one message away. Tell us the spec you need and the desk replies within one business day.</p>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-p btn-sm" href="rfq.html">Request a quote →</a>' +
          '<a class="btn btn-o btn-sm" href="category.html#all">Browse all categories</a>' +
          '<a class="btn btn-o btn-sm" href="contact.html?type=' + encodeURIComponent('Product sourcing request') + '">Ask the desk</a></div></div>' +
          '<div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end">' +
          Object.keys(CATS).filter(function (c) { return c !== state.cat; }).slice(0, 6).map(function (c) {
            return '<a class="chip" href="category.html#' + c + '" style="font-size:12.5px;padding:7px 14px;text-decoration:none">' + CATS[c] + '</a>';
          }).join('') + '</div></div>';
      } else helpEl.style.display = 'none';
    }
    document.querySelectorAll('#pager a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); state.page = +a.getAttribute('data-p'); apply(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });

    renderFacets();
    document.querySelectorAll('[data-sort]').forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-sort') === state.sort);
    });
  }

  document.querySelectorAll('[data-sort]').forEach(function (c) {
    c.addEventListener('click', function () { state.sort = c.getAttribute('data-sort'); state.page = 1; apply(); });
  });
  document.getElementById('f-stock').addEventListener('change', function () { state.stock = this.checked; state.page = 1; apply(); });
  document.getElementById('f-clear').addEventListener('click', function () {
    state.brand = null; state.stock = false; document.getElementById('f-stock').checked = false;
    location.hash = 'all';
  });
  window.addEventListener('hashchange', function () { readHash(); apply(); });

  readHash(); apply();
})();
