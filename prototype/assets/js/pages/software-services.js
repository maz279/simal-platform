/* 12 engineering services directory — every card opens its service detail page and
   every sub-service chip links straight to its grandchild deep page (36 total).
   Credentials from SOFTWARE.creds. */
(function () {
  var detail = {};
  (SOFTWARE.serviceDetail || []).forEach(function (d) { detail[d.id] = d; });
  document.getElementById('svc-grid').innerHTML = SOFTWARE.services.map(function (s, n) {
    var d = detail[s.id];
    var subIds = d ? d.subs.map(function (x) { return x.id; }) : [];
    return '<div class="card card-p svc-card" id="' + s.id + '" style="position:relative;height:100%;border-top:4px solid var(--blue);transition:border-color .18s,box-shadow .18s;scroll-margin-top:96px">' +
      '<a class="go2" href="software-service.html#' + s.id + '" aria-label="Open the ' + S.esc(s.name) + ' service page"></a>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between">' +
      '<div style="display:flex;gap:12px;align-items:center">' +
      '<div style="width:46px;height:46px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:21px;flex:none">' + s.icon + '</div>' +
      '<div><span class="eyebrow" style="margin:0">Practice ' + (n + 1) + ' of 12</span>' +
      '<h4 style="font-size:16px;margin:2px 0 0">' + S.esc(s.name) + '</h4></div></div>' +
      '<span class="btn btn-p btn-sm" style="pointer-events:none">Service detail →</span></div>' +
      '<p style="font-size:13px;color:var(--slate);margin:10px 0 8px">' + S.esc(s.tag) + '</p>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap">' + s.subs.map(function (x, si) {
        var sid = subIds[si];
        var inner = '<span class="chip" style="font-size:11.5px;padding:4px 10px">' + S.esc(x) + ' ↗</span>';
        return sid
          ? '<a class="chipz" href="software-subservice.html#' + sid + '" style="text-decoration:none" title="Open the ' + S.esc(x) + ' deep page">' + inner + '</a>'
          : inner;
      }).join('') + '</div>' +
      '<p style="font-size:11.5px;color:var(--slate-500);margin:9px 0 0">Chips open the sub-service deep pages · anywhere else on the card opens the practice page.</p>' +
      '</div>';
  }).join('');

  document.getElementById('cred-grid').innerHTML = SOFTWARE.creds.map(function (c) {
    return '<div class="card card-p" style="background:#12233A;border-color:#1D2E42"><b style="color:var(--yellow);font-size:15px">' + S.esc(c[0]) + '</b>' +
      '<p style="color:#C6D2E0;font-size:12.5px;margin-top:5px">' + S.esc(c[1]) + '</p></div>';
  }).join('');

  if (location.hash.length > 1) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var card = el.querySelector('.card-p') || el;
      card.style.transition = 'box-shadow .4s'; card.style.boxShadow = '0 0 0 3px var(--g3)';
    }, 300);
  }
})();
