/* Search results (FRS-SR-05): typo-tolerant search + brand/category suggestions */
(function () {
  var q = decodeURIComponent((location.hash.replace('#q=', '') || '').trim());
  var res = S.search(q);
  document.getElementById('s-title').textContent = q ? ('Results for “' + q + '”') : 'Search';
  document.getElementById('s-note').textContent = res.length ? (res.length + ' matching SKU' + (res.length > 1 ? 's' : '') + ' — prices on RFQ.') : (q ? 'No exact match.' : 'Type a query in the search bar above.');
  var grid = document.getElementById('s-grid');
  grid.innerHTML = res.length ? res.slice(0, 12).map(S.card).join('')
    : '<div class="empty" style="grid-column:1/-1">No SKUs matched “' + S.esc(q) + '”.<br>Try a brand (Crucial, UGREEN…), a category (monitor, SSD) or a SKU.</div>';
  S.bindCards(grid);

  // suggestions: brands + solutions touching the query
  var extra = [];
  BRANDS.forEach(function (b) {
    if (q && b.name.toLowerCase().indexOf(q.toLowerCase()) > -1 && b.count > 0)
      extra.push('<a class="btn btn-o btn-sm" href="brand.html#' + b.slug + '">' + b.name + ' (brand page) →</a>');
  });
  SOLUTIONS.forEach(function (s) {
    if (q && s.t.toLowerCase().indexOf(q.toLowerCase()) > -1)
      extra.push('<a class="btn btn-o btn-sm" href="solutions.html">' + s.t + ' (solution) →</a>');
  });
  // software portfolio: products + pages (v1.1.1 — search no longer blind to the software business)
  (window.SOFTWARE ? SOFTWARE.products : []).forEach(function (p) {
    if (q && (p.name + ' ' + p.desc + ' ' + p.target).toLowerCase().indexOf(q.toLowerCase()) > -1)
      extra.push('<a class="btn btn-o btn-sm" href="software-products.html#' + p.id + '">' + S.esc(p.name) + ' (software) →</a>');
  });
  [['software', 'Software services home', 'software.html'], ['erp', 'UniERP — Odoo 19 CE', 'software-erp.html'],
   ['unisoft', 'All 20 software products', 'software-products.html'], ['ai', 'Engineering services (12)', 'software-services.html'],
   ['industry', 'Industry solutions (9)', 'software-industries.html']].forEach(function (pg) {
    if (q && pg[0].indexOf(q.toLowerCase()) > -1)
      extra.push('<a class="btn btn-o btn-sm" href="' + pg[2] + '">' + pg[1] + ' →</a>');
  });
  if (res.length > 12)
    extra.push('<a class="btn btn-o btn-sm" href="category.html">Browse all ' + res.length + ' in the catalog →</a>');
  document.getElementById('s-extra').innerHTML = extra.length ? ('<span class="note" style="display:block;margin-bottom:10px">Also relevant:</span>' + '<div style="display:flex;gap:10px;flex-wrap:wrap">' + extra.join('') + '</div>') : '';
})();

/* re-searching via #q= while already on the page re-runs the search (reload fallback) */
window.addEventListener('hashchange', function () { location.reload(); });
