/* Industries hub (9 verticals) — directory of rich cards; every card opens its own
   industry deep-dive page (software-industry.html#id). Card ids keep legacy
   #healthcare…#agriculture anchors working from elsewhere on the site. */
(function () {
  var byId = {};
  SOFTWARE.products.forEach(function (p) { byId[p.id] = p; });

  function prodLink(id) {
    var p = byId[id];
    if (!p) return '';
    return '<a class="chip chipz" href="software-solution.html#' + p.id + '" style="font-size:12px;padding:5px 12px;background:#fff;border:1px solid var(--line);text-decoration:none">' +
      p.icon + ' ' + S.esc(p.name.split(' — ')[0]) + '</a>';
  }

  document.getElementById('ind-chips').innerHTML = SOFTWARE.industries.map(function (i) {
    return '<a href="software-industry.html#' + i.id + '" class="chip" style="font-size:13px;padding:8px 16px;cursor:pointer;text-decoration:none">' + i.icon + ' ' + S.esc(i.name) + '</a>';
  }).join('');

  document.getElementById('ind-list').innerHTML = SOFTWARE.industries.map(function (i, n) {
    return '<div class="card card-p" id="' + i.id + '" style="position:relative;border-top:4px solid var(--blue);scroll-margin-top:96px">' +
      '<a class="go2" href="software-industry.html#' + i.id + '" aria-label="Open the ' + S.esc(i.name) + ' industry page"></a>' +
      '<div style="display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">' +
      '<div style="display:flex;gap:14px;align-items:center">' +
      '<div style="width:54px;height:54px;border-radius:14px;background:var(--blue-050);display:grid;place-items:center;font-size:26px">' + i.icon + '</div>' +
      '<div><span class="eyebrow" style="margin:0">Vertical ' + (n + 1) + ' of 9</span>' +
      '<h2 style="font-size:21px;margin:2px 0 0">' + S.esc(i.name) + '</h2></div></div>' +
      '<span class="btn btn-p btn-sm" style="pointer-events:none">Industry detail →</span></div>' +
      '<p style="color:var(--slate);font-size:13.5px;max-width:760px;margin:12px 0 0;line-height:1.65">' + S.esc(i.desc) + '</p>' +
      '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px">' + i.caps.map(function (c) {
        return '<span class="chip on" style="font-size:12px;padding:5px 12px">' + S.esc(c) + '</span>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0">' + i.products.map(prodLink).join('') + '</div>' +
      '<p style="font-size:11.5px;color:var(--slate-500);margin:8px 0 0">Product chips open solution deep-dives · anywhere else on the card opens the industry page.</p>' +
      '</div>';
  }).join('');

  if (location.hash.length > 1) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var card = el.querySelector('.card-p') || el;
      card.style.transition = 'box-shadow .4s'; card.style.boxShadow = '0 0 0 3px var(--g3)';
    }, 300);
  }
})();
