/* Solutions hub: 5 flagship practices (content §05) + 12 real mirror lines.
   Every card is a directory entry — stretched-overlay whole-card link into
   it-solution.html detail pages (legacy flagship slugs preserved as anchors;
   cloud→cloud-security, storage→data-recovery mapped). NO nested anchors. */
(function () {
  var FLAGMAP = { amc: 'amc', av: 'av', cloud: 'cloud-security', storage: 'data-recovery', firewall: 'firewall' };

  document.getElementById('flag-grid').innerHTML = CONTENT.solutions5.map(function (s, i) {
    var target = 'it-solution.html#' + (FLAGMAP[s.slug] || s.slug);
    return '<div class="card card-p sol-card" id="' + s.slug + '" style="' + (i === 0 ? 'border-top:4px solid var(--blue);' : '') + ';position:relative;scroll-margin-top:96px">' +
      '<a class="go2" href="' + target + '" aria-label="Open the ' + S.esc(s.t) + ' solution page"></a>' +
      '<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--blue-050),#fff);display:grid;place-items:center;font-size:24px;border:1px solid var(--line)">' + s.icon + '</div>' +
      '<h4 style="font-size:16.5px;margin:12px 0 4px">' + S.esc(s.t) + '</h4>' +
      '<p style="font-size:12.5px;font-weight:700;color:var(--blue);margin:0 0 6px">' + S.esc(s.tag) + '</p>' +
      '<p style="font-size:13px;color:var(--slate)">' + S.esc(s.d) + '</p>' +
      '<span class="btn btn-o btn-sm" style="margin-top:12px;pointer-events:none">Solution detail →</span></div>';
  }).join('');

  // AMC tier table (content §05-02) — stays on the hub AND on the AMC detail page
  var at = document.getElementById('amc-tbl');
  if (at) {
    var T = CONTENT.amcTiers;
    at.innerHTML = '<tr>' + T.head.map(function (h, i) { return '<th' + (i > 0 ? ' style="text-align:center"' : '') + '>' + h + '</th>'; }).join('') + '</tr>' +
      T.rows.map(function (r, i) {
        return '<tr><td><b>' + r[0] + '</b></td>' + r.slice(1).map(function (c, j) {
          return '<td style="text-align:center;' + (j === 2 ? 'background:var(--blue-050);font-weight:700;color:var(--blue)' : '') + '">' + c + '</td>';
        }).join('') + '</tr>';
      }).join('');
  }

  var ids = ['infra', 'amc', 'managed', 'network-security', 'firewall', 'cloud-security', 'cabling', 'av', 'telephony', 'data-recovery', 'licensing', 'support'];
  var icons = ['🖧', '📅', '📦', '🔐', '🧱', '☁️', '🪛', '🎥', '☎️', '💾', '🧾', '🔧'];
  var detail = {};
  (window.ITSOL || []).forEach(function (d) { detail[d.id] = d; });
  document.getElementById('lines-grid').innerHTML = SOLUTIONS.map(function (s, i) {
    var id = ids[i] || ('line-' + i);
    var d = detail[id];
    return '<div class="card card-p sol-card" id="' + id + '" style="position:relative;scroll-margin-top:96px">' +
      '<a class="go2" href="it-solution.html#' + id + '" aria-label="Open the ' + S.esc(s.t) + ' solution page"></a>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between">' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="width:44px;height:44px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:20px">' + icons[i % icons.length] + '</div>' +
      '<div><span class="eyebrow" style="margin:0">Line ' + (i + 1) + ' of 12</span>' +
      '<h4 style="font-size:16px;margin:2px 0 5px">' + S.esc(s.t) + '</h4></div></div>' +
      '<span class="btn btn-o btn-sm" style="pointer-events:none">Detail →</span></div>' +
      '<p style="font-size:13px;color:var(--slate)">' + S.esc(s.d) + '</p>' +
      (d ? '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">' + d.scope.slice(0, 3).map(function (c) {
        return '<span class="chip" style="font-size:11.5px;padding:4px 10px">' + S.esc(c[0]) + '</span>';
      }).join('') + '</div>' : '') +
      '</div>';
  }).join('');
})();
