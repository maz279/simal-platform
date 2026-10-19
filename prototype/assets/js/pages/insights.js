/* Insights & Newsroom hub: featured article + category filter + 13 overlay cards
   (whole-card link into insight.html article pages) + gated download + newsletter.
   Legacy behavior preserved: #featured / #list anchors still exist. */
(function () {
  var cats = (function () {
    var seen = [], out = [];
    INSIGHTS.forEach(function (a) { if (seen.indexOf(a.cat) < 0) { seen.push(a.cat); out.push([a.cat, 0]); } });
    INSIGHTS.forEach(function (a) { out.forEach(function (c) { if (c[0] === a.cat) c[1]++; }); });
    return out;
  })();
  var active = 'ALL';

  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function render() {
    var f = INSIGHTS[0];
    document.getElementById('featured').innerHTML =
      '<div class="card sol-card" style="overflow:hidden;position:relative;display:grid;grid-template-columns:340px 1fr;align-items:stretch">' +
      '<a class="go2" href="insight.html#' + f.slug + '" aria-label="Read ' + S.esc(f.t) + '"></a>' +
      '<div style="min-height:230px;background:linear-gradient(120deg,var(--blue-050),#fff 80%);display:grid;place-items:center;font-size:12.5px;font-weight:800;color:var(--blue);letter-spacing:.14em;text-align:center;padding:14px">' + f.cat + '<br>' + f.mins + ' MIN READ<br>' + fmtDate(f.at).toUpperCase() + '</div>' +
      '<div class="card-p" style="padding:24px 28px"><h3 style="font-size:23px;margin:0 0 8px;line-height:1.3;max-width:820px">' + S.esc(f.t) + '</h3>' +
      '<p style="color:var(--slate);font-size:14.5px;line-height:1.7;max-width:900px">' + S.esc(f.x) + '</p>' +
      '<p style="color:var(--slate);font-size:13.5px;line-height:1.7;margin-top:10px;max-width:900px">' + S.esc(f.body[0][1][0].slice(0, 220)) + '…</p>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:14px;justify-content:space-between;flex-wrap:wrap">' +
      '<div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="width:30px;height:30px;font-size:12px">' + S.esc(f.author[0]) + '</div><b style="font-size:13px">' + S.esc(f.author) + '</b><span class="note">' + S.esc(f.tags[0]) + '</span></div>' +
      '<span class="btn btn-p btn-sm" style="pointer-events:none">Read the full article →</span></div>' +
      '</div></div>';

    var list = INSIGHTS.slice(1).filter(function (a) { return active === 'ALL' || a.cat === active; });
    var firstOfCat = {};
    document.getElementById('list').innerHTML = list.map(function (a) {
      var anchor = firstOfCat[a.cat] ? '' : ' id="cat-' + S.esc(a.cat) + '"';   // one anchor id per category
      firstOfCat[a.cat] = 1;
      return '<div class="card card-p sol-card"' + anchor + ' style="position:relative;height:100%;scroll-margin-top:120px">' +
        '<a class="go2" href="insight.html#' + a.slug + '" aria-label="Read ' + S.esc(a.t) + '"></a>' +
        '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between">' +
        '<span style="font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--blue)">' + a.cat + '</span>' +
        '<span style="font-size:11px;color:var(--slate-500)">' + a.mins + ' min · ' + fmtDate(a.at) + '</span></div>' +
        '<b style="display:block;font-size:15.5px;line-height:1.35;margin-top:8px">' + S.esc(a.t) + '</b>' +
        '<p style="font-size:12.5px;color:var(--slate);margin:7px 0 0;line-height:1.55">' + S.esc(a.x.slice(0, 130)) + '…</p>' +
        '<span style="display:block;font-size:11.5px;color:var(--slate-500);margin-top:10px">' + S.esc(a.author) + ' · <b style="color:var(--blue)">Read →</b></span></div>';
    }).join('');

    document.getElementById('filters').innerHTML =
      '<span class="chip' + (active === 'ALL' ? ' on' : '') + '" data-c="ALL" style="cursor:pointer;font-size:13px;padding:8px 16px">All (' + INSIGHTS.length + ')</span>' +
      cats.map(function (c) {
        return '<span class="chip' + (active === c[0] ? ' on' : '') + '" data-c="' + c[0] + '" style="cursor:pointer;font-size:13px;padding:8px 16px">' + c[0] + ' (' + c[1] + ')</span>';
      }).join('');
    document.querySelectorAll('#filters .chip').forEach(function (c) {
      c.addEventListener('click', function () { active = c.getAttribute('data-c'); render(); });
    });
  }
  render();

  var sub = function (inputId, btnId) {
    var b = document.getElementById(btnId);
    if (!b) return;
    b.addEventListener('click', function () {
      var m = document.getElementById(inputId).value.trim();
      if (!S.v.email(m)) return S.toast('Enter a valid work email', 'err');
      var n = S.ls('newsletter', []); n.unshift({ email: m, at: new Date().toISOString() }); S.save('newsletter', n);
      S.toast('Subscribed — double opt-in sent to ' + m);
      document.getElementById(inputId).value = '';
    });
  };
  sub('i-mail', 'i-go');
  sub('g-mail', 'g-go');
})();
