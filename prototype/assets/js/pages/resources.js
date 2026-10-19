/* Resources page: case studies from content package + gated downloads */
(function () {
  document.getElementById('case-grid').innerHTML = CONTENT.cases.map(function (c, i) {
    return '<div class="card card-p"><span class="badge ' + (i < 3 ? 'b-blue' : 'b-line') + '">' + (i < 3 ? 'Distribution' : 'Software / UniERP') + '</span>' +
      '<h4 style="font-size:15.5px;margin:10px 0 4px">' + S.esc(c[0]) + '</h4>' +
      '<p style="color:var(--slate);font-size:13px">' + S.esc(c[1]) + '</p>' +
      '<a class="btn btn-o btn-sm" style="margin-top:10px" href="#" data-gate>Read case study →</a></div>';
  }).join('');

  // datasheet library per category (content §08-05)
  var dsIcons = { 'internal-ssd': '💾', 'portable-ssd': '🔌', memory: '🧠', monitors: '🖥', gaming: '🎮', accessories: '🔌', laptops: '💻' };
  var catCount = {};
  CATALOG.forEach(function (p) { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });
  var ds = document.getElementById('ds-grid');
  if (ds) ds.innerHTML = Object.keys(dsIcons).map(function (c) {
    return '<div class="card card-p"><div style="font-size:22px">' + dsIcons[c] + '</div>' +
      '<b style="display:block;margin-top:8px;font-size:14px">' + c.replace('-', ' ') + '</b>' +
      '<p class="note">' + (catCount[c] || 0) + ' SKUs · specs &amp; compliance</p>' +
      '<a class="btn btn-o btn-sm" style="margin-top:8px" href="#" data-gate>Download PDF →</a></div>';
  }).join('');

  document.querySelectorAll('[data-gate]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var mail = S.ls('gateMail', null);
      if (mail) { S.toast('Sending to ' + mail + ' — check your inbox'); return; }
      var m = prompt('Work email (one-time gate — remembered in this browser):');
      if (m && S.v.email(m)) { S.save('gateMail', m); S.toast('Sending to ' + m + ' — check your inbox'); }
      else if (m) S.toast('Enter a valid work email', 'err');
    });
  });
})();
