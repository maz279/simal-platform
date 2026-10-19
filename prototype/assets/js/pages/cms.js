/* CMS dashboard: AR-gap table, override count, photo coverage */
(function () {
  var cms = S.cms().products || {};
  var overrides = Object.keys(cms).length;
  var withAr = CATALOG.filter(function (p) { return cms[p.slug] && (cms[p.slug].name_ar || cms[p.slug].desc_ar); }).length;
  document.getElementById('c-ar').textContent = CATALOG.length - withAr;
  document.getElementById('c-over').textContent = overrides;
  document.getElementById('c-img').textContent = CATALOG.filter(function (p) { return p.img.length; }).length;

  document.getElementById('ar-tbl').innerHTML =
    '<tr><th>Product</th><th>EN</th><th>AR</th><th></th></tr>' +
    CATALOG.slice(0, 25).map(function (p) {
      var o = cms[p.slug] || {};
      return '<tr><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + S.esc(p.name) + '</td>' +
        '<td><span class="statuspill st-ok">✓</span></td>' +
        '<td>' + (o.desc_ar ? '<span class="statuspill st-ok">✓</span>' : '<span class="statuspill st-err">gap</span>') + '</td>' +
        '<td><a class="btn btn-sm btn-o" href="cms-editor.html#' + p.slug + '">Edit →</a></td></tr>';
    }).join('') +
    '<tr><td colspan="4" class="note">+' + Math.max(0, CATALOG.length - 25) + ' more — open the editor for any SKU</td></tr>';
})();
