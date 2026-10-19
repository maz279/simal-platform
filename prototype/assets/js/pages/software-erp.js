/* UniERP flagship page: modules from CONTENT.erpModules, editions from SOFTWARE.products */
(function () {
  // 7 core modules — every card navigates to the module's full detail page (tabs, capabilities, pairings)
  document.getElementById('mod-grid').innerHTML = CONTENT.erpModules.map(function (m) {
    var id = (SOFTWARE.moduleDetail || []).length ?
      SOFTWARE.moduleDetail.reduce(function (acc, d, ix) { return d.name === m[1] ? d.id : acc; }, '') : '';
    return '<a href="software-module.html#' + (id || 'finance') + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%">' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="width:46px;height:46px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:21px;flex:none">' + m[0] + '</div>' +
      '<div><h4 style="font-size:16px;margin:2px 0 4px">' + S.esc(m[1]) + '</h4>' +
      '<p style="font-size:13px;color:var(--slate);margin:0">' + S.esc(m[2]) + '</p></div></div>' +
      '<span style="display:block;margin-top:11px;font-size:12.5px;font-weight:700;color:var(--blue)">Module detail →</span></div></a>';
  }).join('');

  // industry ERP editions from the 20-product portfolio
  var editionIds = ['distribution-erp', 'retail-erp', 'garments-erp', 'education-erp', 'hotel-erp', 'hospital-erp', 'field-service-erp', 'mps-erp'];
  var byId = {};
  SOFTWARE.products.forEach(function (p) { byId[p.id] = p; });
  document.getElementById('erp-editions').innerHTML = editionIds.map(function (id) {
    var p = byId[id];
    return '<a href="software-solution.html#' + p.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' +
      '<div style="font-size:22px">' + p.icon + '</div>' +
      '<h4 style="font-size:14.5px;margin:8px 0 4px">' + S.esc(p.name.replace(' — NBR-Approved VAT Management', '')) + '</h4>' +
      '<p style="font-size:11.5px;color:var(--slate-500);font-weight:700">' + S.esc(p.target) + '</p>' +
      '<span style="display:block;margin-top:9px;font-size:12px;font-weight:700;color:var(--blue)">Solution detail →</span></div></a>';
  }).join('');
})();
