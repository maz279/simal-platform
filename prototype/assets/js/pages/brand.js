/* Brand landing: hash-driven (#brand-slug), real SKUs from catalog */
(function () {
  var slug = decodeURIComponent(location.hash.replace('#', '')) || 'crucial';
  var meta = BRANDS.filter(function (b) { return b.slug === slug; })[0];
  var name = meta ? meta.name : slug.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  var list = S.byBrand(name).concat(meta ? S.byBrand(meta.slug) : []);
  var seen = {};
  list = list.filter(function (p) { return p.brand === name.toLowerCase() || p.brand === (meta ? meta.slug : slug) || !seen[p.slug] && (seen[p.slug] = 1); });
  if (!list.length) list = S.byBrand(slug);

  document.title = name + ' — authorized distributor UAE — Simal';
  var info = CONTENT.brandInfo[slug] || CONTENT.brandInfo[name.toLowerCase()];
  document.getElementById('b-badge').textContent = 'authorized ' + name + ' line · uae · gcc';
  document.getElementById('b-name').textContent = name;
  document.getElementById('b-lead').textContent = info
    ? (info[0] + ' ' + info[1] + ' Simal stocks the range in Dubai — genuine units, local UAE warranty and JAFZA fulfillment for resellers, integrators and retailers across GCC · MEA · CIS.')
    : ('Simal stocks the ' + name + ' range in Dubai — genuine units, local UAE warranty and JAFZA fulfillment for resellers, integrators and retailers across GCC · MEA · CIS.');
  var tagEl = document.getElementById('b-tag');
  if (tagEl && info) tagEl.textContent = info[0];
  document.getElementById('b-glance-title').textContent = name + ' at a glance';
  var cats = {};
  list.forEach(function (p) { cats[p.catLabel || p.cat] = (cats[p.catLabel || p.cat] || 0) + 1; });
  document.getElementById('b-glance').innerHTML =
    '<div class="row"><span>SKUs on simalme.com</span><b>' + list.length + '</b></div>' +
    '<div class="row"><span>Categories</span><b>' + Object.keys(cats).length + '</b></div>' +
    '<div class="row"><span>In stock now</span><b>' + list.filter(function (p) { return p.stock; }).length + '</b></div>' +
    '<div class="row"><span>RFQ response</span><b>≤ 1 business day</b></div>' +
    '<a class="btn btn-block btn-lg" style="background:var(--yellow);color:var(--ink);margin-top:16px" href="rfq.html">Request ' + name + ' pricing</a>';
  document.getElementById('b-range-title').textContent = 'Live ' + name + ' SKUs (' + list.length + ')';

  var grid = document.getElementById('b-grid');
  grid.innerHTML = list.length ? list.map(S.card).join('')
    : '<div class="empty" style="grid-column:1/-1">No live SKUs listed for this brand right now — RFQ any ' + name + ' requirement and we will quote from distribution stock.</div>';
  S.bindCards(grid);
})();

/* switching brand via hash while already on the page re-renders (reload fallback) */
window.addEventListener('hashchange', function () { location.reload(); });
