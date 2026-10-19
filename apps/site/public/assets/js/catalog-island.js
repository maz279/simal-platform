/* catalog-island.js — the /products/ catalog island (facet rail, sort chips, pagination,
 * per-category buying guide, sparse-results help band, ?q= / #category / ?brand= deep
 * links, recently viewed). rm(3.3) removed the page's <script> when it externalized the
 * inline scripts and moved only Add-to-RFQ into add-rfq.js, so from 21fbd73 on the
 * Category and Brand filters rendered empty and sort, paging and deep links did nothing.
 * Restored from 21fbd73^ as plain JS; Add-to-RFQ stays in add-rfq.js (delegated).
 * Facet labels are escaped (brand/category values are CMS data). */
(function () {
  var grid = document.getElementById('grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.prod'));
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var $ = function (s) { return document.querySelector(s); };

  var catLabels = { all: 'All' };
  cards.forEach(function (el) {
    var c = el.dataset.cat;
    if (c && !catLabels[c]) catLabels[c] = el.dataset.catLabel || c.replace(/-/g, ' ');
  });
  var brandCounts = {};
  cards.forEach(function (c) { brandCounts[c.dataset.brand] = (brandCounts[c.dataset.brand] || 0) + 1; });

  var state = { cat: 'all', brand: null, stock: false, sort: 'featured', page: 1, q: '' };
  try { state.q = (new URLSearchParams(location.search).get('q') || '').toLowerCase().trim(); } catch (e) { /* no URL API */ }
  var PER = 12;
  var GUIDE = {};
  try { GUIDE = JSON.parse((document.getElementById('guide-data') || {}).textContent || '{}'); } catch (e) { GUIDE = {}; }
  var cap = function (v) { return v ? v.charAt(0).toUpperCase() + v.slice(1) : v; };

  function renderFacets() {
    var catEl = $('#f-cat'), brandEl = $('#f-brand');
    var present = {};
    cards.forEach(function (c) { present[c.dataset.cat] = (present[c.dataset.cat] || 0) + 1; });
    catEl.innerHTML = Object.keys(catLabels).filter(function (k) { return k === 'all' || present[k]; }).map(function (k) {
      var n = k === 'all' ? cards.length : present[k];
      return '<a href="#' + esc(k) + '" data-c="' + esc(k) + '" class="filterlink' + (state.cat === k ? ' on' : '') + '"' +
        (state.cat === k ? ' aria-current="true"' : '') +
        ' style="color:inherit;text-decoration:none;display:flex;justify-content:space-between"><span>' + esc(cap(catLabels[k])) +
        '</span><span style="font-size:11.5px;color:var(--slate-500)">' + n + '</span></a>';
    }).join('');
    brandEl.innerHTML = Object.keys(brandCounts).sort(function (a, b) { return a.localeCompare(b); }).map(function (b) {
      return '<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-b="' + esc(b) + '"' +
        ' aria-label="Filter by brand ' + esc(b) + '"' + (state.brand === b ? ' checked' : '') + '><span>' + esc(b) + '</span>' +
        '<span style="margin-left:auto;font-size:11.5px;color:var(--slate-500);background:var(--bg);border-radius:6px;padding:1px 7px">' +
        brandCounts[b] + '</span></label>';
    }).join('');
    catEl.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        state.cat = a.dataset.c; state.page = 1;
        window.history.replaceState(null, '', location.pathname + location.search + (state.cat === 'all' ? '' : '#' + state.cat));
        apply();
      });
    });
    brandEl.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('change', function () { state.brand = i.checked ? i.dataset.b : null; state.page = 1; apply(); });
    });
  }

  var chips = Array.prototype.slice.call(document.querySelectorAll('#sortbar .chip'));
  var setSortChip = function (key) {
    chips.forEach(function (x) { var on = x.dataset.sort === key; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  };
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () { state.sort = ch.dataset.sort; state.page = 1; setSortChip(state.sort); apply(); });
  });
  var stockEl = $('#f-stock');
  if (stockEl) stockEl.addEventListener('change', function () { state.stock = stockEl.checked; state.page = 1; apply(); });
  var clearEl = $('#f-clear');
  if (clearEl) clearEl.addEventListener('click', function () {
    state.cat = 'all'; state.brand = null; state.stock = false; state.page = 1; state.sort = 'featured'; state.q = '';
    if (stockEl) stockEl.checked = false;
    setSortChip('featured');
    window.history.replaceState(null, '', '/products/');
    apply();
  });

  function apply() {
    var list = cards.slice();
    if (state.cat !== 'all') list = list.filter(function (c) { return c.dataset.cat === state.cat; });
    if (state.brand) list = list.filter(function (c) { return c.dataset.brand === state.brand; });
    if (state.stock) list = list.filter(function (c) { return c.dataset.stock === '1'; });
    if (state.q) list = list.filter(function (c) { return (c.dataset.name + ' ' + c.dataset.brand + ' ' + c.dataset.slug).toLowerCase().indexOf(state.q) !== -1; });
    if (state.sort === 'brand') list.sort(function (a, b) { return a.dataset.brand.localeCompare(b.dataset.brand) || a.dataset.name.localeCompare(b.dataset.name); });
    if (state.sort === 'name') list.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); });
    if (state.sort === 'newest') list.sort(function (a, b) { return (b.dataset.new === '1' ? 1 : 0) - (a.dataset.new === '1' ? 1 : 0); });

    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > pages) state.page = pages;
    var view = list.slice((state.page - 1) * PER, state.page * PER);
    /* re-append in the sorted order so the visible order follows the chosen sort */
    list.forEach(function (c) { grid.appendChild(c); });
    var inView = new Set(view);
    cards.forEach(function (c) { c.style.display = inView.has(c) ? '' : 'none'; });

    $('#count-note').textContent = list.length + ' SKU' + (list.length === 1 ? '' : 's') +
      (state.q ? ' matching “' + state.q + '”' : '') + ' · page ' + state.page + ' of ' + pages;
    $('#crumb').textContent = state.cat === 'all' ? 'All' : cap(catLabels[state.cat]);
    var title = $('#cat-title');
    if (title) title.textContent = state.cat === 'all' ? 'All products' : cap(catLabels[state.cat]);
    var pager = $('#pager');
    pager.innerHTML = pages > 1 ? Array.from({ length: pages }, function (_, i) {
      return '<a href="#page' + (i + 1) + '" class="' + (state.page === i + 1 ? 'on' : '') + '" data-p="' + (i + 1) + '"' +
        (state.page === i + 1 ? ' aria-current="page"' : '') + ' aria-label="Page ' + (i + 1) + '">' + (i + 1) + '</a>';
    }).join('') : '';
    pager.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); state.page = +a.dataset.p; apply(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });

    var gEl = $('#cat-guide');
    var g = GUIDE[state.cat];
    if (gEl && g && state.cat !== 'all') {
      gEl.style.display = '';
      gEl.innerHTML = '<div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><b style="font-size:15px">' + esc(cap(catLabels[state.cat])) + ' — buying guide</b></div>' +
        '<p style="font-size:13.5px;color:var(--slate);margin:10px 0 6px">' + esc(g.intro) + '</p>' +
        '<ul style="margin:6px 0 0;padding-left:18px">' + (g.points || []).map(function (p2) { return '<li style="font-size:13px;color:var(--slate);margin:3px 0">' + esc(p2) + '</li>'; }).join('') + '</ul>';
    } else if (gEl) gEl.style.display = 'none';

    var helpEl = $('#grid-help');
    if (helpEl) {
      if (list.length > 0 && list.length <= 6) {
        helpEl.style.display = '';
        helpEl.innerHTML = '<div class="split" style="grid-template-columns:1.2fr .8fr;gap:20px;align-items:center">' +
          '<div><b style="font-size:16px">Not exactly what you need?</b>' +
          '<p style="font-size:13.5px;color:var(--slate);margin:6px 0 12px">This line is a focused selection — the full catalog, other categories and bundle quotes are one message away. Tell us the spec you need and the desk replies within one business day.</p>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-p btn-sm" href="/rfq/">Request a quote →</a>' +
          '<a class="btn btn-o btn-sm" href="/products/">Browse all categories</a>' +
          '<a class="btn btn-o btn-sm" href="/contact/">Ask the desk</a></div></div>' +
          '<div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end">' +
          Object.keys(catLabels).filter(function (c) { return c !== 'all' && c !== state.cat; }).slice(0, 6).map(function (c) {
            return '<a class="chip" href="#' + esc(c) + '" data-c="' + esc(c) + '" style="font-size:12.5px;padding:7px 14px;text-decoration:none">' + esc(cap(catLabels[c])) + '</a>';
          }).join('') + '</div></div>';
        helpEl.querySelectorAll('a[data-c]').forEach(function (a) {
          a.addEventListener('click', function (e) { e.preventDefault(); state.cat = a.dataset.c; state.page = 1; apply(); });
        });
      } else helpEl.style.display = 'none';
    }
    renderFacets();
  }

  function syncFromUrl() {
    var hash = (location.hash || '').replace('#', '').trim();
    if (hash.indexOf('cat-') === 0) hash = hash.slice(4);
    if (hash === 'storage') hash = 'internal-ssd';
    var params = new URLSearchParams(location.search);
    var queryCat = params.get('cat') || '';
    if (queryCat.indexOf('cat-') === 0) queryCat = queryCat.slice(4);
    if (queryCat === 'storage') queryCat = 'internal-ssd';
    var queryBrand = params.get('brand') || '';
    if (hash && (catLabels[hash] || brandCounts[hash])) {
      if (catLabels[hash]) { state.cat = hash; state.brand = null; } else { state.brand = hash; state.cat = 'all'; }
    } else if (queryCat && catLabels[queryCat]) {
      state.cat = queryCat;
    } else if (queryBrand && brandCounts[queryBrand]) {
      state.brand = queryBrand;
    }
  }
  syncFromUrl();
  window.addEventListener('hashchange', function () { syncFromUrl(); state.page = 1; apply(); });

  function renderRecent() {
    var rGrid = document.getElementById('recent'), rHead = document.getElementById('recent-head');
    var hide = function () { if (rHead) rHead.style.display = 'none'; if (rGrid) rGrid.style.display = 'none'; };
    try {
      var m = document.cookie.match(/simal_recent=([^;]+)/);
      var seen = m ? decodeURIComponent(m[1]).split(',').filter(Boolean) : [];
      var found = seen.map(function (s) { return cards.find(function (c) { return c.dataset.slug === s; }); }).filter(Boolean);
      if (!rGrid || !found.length) return hide();
      if (rHead) rHead.style.display = '';
      rGrid.style.display = '';
      rGrid.innerHTML = found.slice(0, 4).map(function (c) { var n = c.cloneNode(true); n.style.display = ''; return n.outerHTML; }).join('');
    } catch (e) { hide(); }
  }

  apply();
  renderRecent();
})();
