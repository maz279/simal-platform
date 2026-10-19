/* Industry detail (vertical deep-dive): #industry-id. Fifth tier of the software IA —
   the industries hub lists 9 verticals; each opens this page with sector pains, the
   engagement play, solutions serving the sector, services it leans on, sibling
   industries and a prev/next chain across all 9. Re-renders on hashchange. */
(function () {
  var root = document.getElementById('ind-root');
  var IND = SOFTWARE.industries, D = SOFTWARE.industryDetail;
  var P = SOFTWARE.products, SD = SOFTWARE.solutionDetail, S12 = SOFTWARE.services;
  var dMeta = {}, pMeta = {}, sMeta = {};
  D.forEach(function (d) { dMeta[d.id] = d; });
  P.forEach(function (p) { pMeta[p.id] = p; });
  S12.forEach(function (s) { sMeta[s.id] = s; });

  var TABS = '<div class="sw-tabs"><div class="wrap">' +
    '<a href="software.html">Software home</a>' +
    '<a href="software-erp.html">UniERP flagship</a>' +
    '<a href="software-products.html">Products (20)</a>' +
    '<a href="software-services.html">Services (12)</a>' +
    '<a class="on" href="software-industries.html">Industries (9)</a></div></div>';
  var current = null;

  function esc(s) { return S.esc(s); }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var i = IND.findIndex(function (x) { return x.id === id; });
    if (i < 0) {
      if (current) return;                      // in-page anchor — keep rendered view
      document.title = 'Industry — Simal Software Services';
      root.innerHTML = TABS + '<section class="sec"><div class="wrap">' +
        '<div class="empty">Unknown industry. <a href="software-industries.html">Back to all nine verticals →</a></div>' +
        '</div></section>';
      return;
    }
    current = id;
    var ind = IND[i], d = dMeta[id] || {};
    var prev = IND[(i - 1 + IND.length) % IND.length], next = IND[(i + 1) % IND.length];
    var prods = ind.products.map(function (pid) { return pMeta[pid]; }).filter(Boolean);
    var svcLinks = (d.services || []).map(function (sid) {
      return '<a href="software-service.html#' + sid + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' +
        (sMeta[sid] ? sMeta[sid].icon + ' ' + esc(sMeta[sid].name) : sid) + '</a>';
    }).join('');
    var relLinks = (d.related || []).map(function (rid) {
      var r = IND.filter(function (x) { return x.id === rid; })[0];
      if (!r) return '';
      var rd = dMeta[rid] || {};
      return '<a href="software-industry.html#' + rid + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--g3)">' +
        '<div style="font-size:20px">' + r.icon + '</div><b style="font-size:14.5px;display:block;margin-top:6px">' + esc(r.name) + '</b>' +
        '<p style="font-size:12.5px;color:var(--slate);margin:7px 0 0;line-height:1.55">' + esc((rd.what || r.desc).slice(0, 110)) + '…</p>' +
        '<span style="font-size:12px;font-weight:700;color:var(--blue)">Industry detail →</span></div></a>';
    }).join('');

    document.title = ind.name + ' — industry solution — Simal Software Services';
    root.innerHTML =
      /* ---------- HERO ---------- */
      '<section class="hero hero-rose"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="software.html" style="color:#F3D9C4">Software</a> › <a href="software-industries.html" style="color:#F3D9C4">Industries (9)</a> › <b style="color:#fff">' + esc(ind.name) + '</b></div>' +
      '<span class="badge" style="background:rgba(255,255,255,.14);color:#fff">' + ind.icon + ' industry vertical ' + (i + 1) + ' of ' + IND.length + '</span>' +
      '<h1 style="font-size:32px;margin-top:12px">' + esc(ind.name) + '</h1>' +
      '<p class="lead" style="color:#F3D9C4;margin-top:12px;max-width:660px">' + esc(ind.desc) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' + ind.caps.map(function (c) {
        return '<span class="chip" style="font-size:11.5px;padding:4px 10px;background:rgba(255,255,255,.12);color:#fff">' + esc(c) + '</span>';
      }).join('') + '</div>' +
      '<div class="cta"><a class="btn btn-lg" style="background:#fff;color:var(--blue)" href="#solutions">Solutions for this sector ↓</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#5A4038" href="contact.html?type=' + encodeURIComponent(ind.name + ' solution') + '">Discuss your sector →</a></div></div>' +
      '<div class="hero-card"><h3>' + ind.icon + ' ' + esc(ind.name) + '</h3>' +
      '<div class="row"><span>Purpose-built solutions</span><b>' + prods.length + '</b></div>' +
      '<div class="row"><span>Engineering services</span><b>' + (d.services || []).length + ' practices</b></div>' +
      '<div class="row"><span>Delivery</span><b>Simal Dubai + Unisoft Dhaka</b></div>' +
      '<div class="row"><span>Support</span><b>24/7 · AMC option</b></div></div></div></section>' + TABS +

      /* ---------- OVERVIEW + PAINS ---------- */
      '<section class="sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-industries.html">Industries (9)</a> › <b>' + esc(ind.name) + '</b></div>' +
      '<div class="sec-head"><div><span class="eyebrow">sector overview</span><h2 style="font-size:24px">Software that speaks this sector</h2></div></div>' +
      '<p style="font-size:15.5px;line-height:1.8;color:var(--slate);max-width:900px">' + esc(d.what || ind.desc) + '</p>' +
      '<div class="split" style="grid-template-columns:1fr 1fr;align-items:start;margin-top:28px">' +
      '<div><h3 style="font-size:17px;margin:0 0 10px">🧯 What slows the sector down</h3>' +
      '<div style="display:grid;gap:10px">' + (d.pains || []).map(function (p2) {
        return '<div class="card card-p" style="border-left:4px solid var(--red,#C34)"><p style="font-size:13.5px;color:var(--slate);margin:0;line-height:1.6">' + esc(p2) + '</p></div>';
      }).join('') + '</div></div>' +
      '<div><h3 style="font-size:17px;margin:0 0 10px">🧭 How we engage here</h3>' +
      '<div class="timeline">' + (d.plays || []).map(function (h) {
        return '<div class="tl"><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span></div>';
      }).join('') + '</div></div></div>' +

      /* ---------- SOLUTIONS GRID ---------- */
      '<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">the portfolio in your sector</span><h2 style="font-size:24px" id="solutions">Solutions built for ' + esc(ind.name.split(' & ')[0]) + '</h2></div>' +
      '<span class="chip on" style="font-size:12px">' + prods.length + ' purpose-built</span></div>' +
      '<div class="grid g3">' + prods.map(function (p2) {
        return '<a href="software-solution.html#' + p2.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' +
          '<div style="display:flex;gap:10px;align-items:center"><div style="width:42px;height:42px;border-radius:11px;background:var(--blue-050);display:grid;place-items:center;font-size:19px">' + p2.icon + '</div>' +
          '<b style="font-size:14.5px">' + esc(p2.name.split(' — ')[0]) + '</b></div>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:9px 0 0;line-height:1.55">' + esc(p2.desc.slice(0, 110)) + '…</p>' +
          '<span style="font-size:12px;font-weight:700;color:var(--blue)">Solution detail →</span></div></a>';
      }).join('') + '</div>' +
      '<p style="font-size:13px;color:var(--slate-500);margin-top:12px">Don\'t see your workflow? The <a href="software-service.html#custom-dev" style="color:var(--blue);font-weight:600">custom-development practice</a> scopes a purpose-built system when no package fits.</p>' +

      /* ---------- CROSS-NAV BAND ---------- */
      '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin-top:34px">' +
      '<div class="sec-head" style="margin:0 0 4px"><div><span class="eyebrow">multi-point navigation</span><h2 style="font-size:21px">Explore from every angle — no dead ends</h2></div></div>' +
      '<div class="grid g2" style="margin-top:12px">' +
      (svcLinks ? '<div class="card card-p"><b style="font-size:13.5px">🛠 Services this sector leans on</b>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + svcLinks + '</div></div>' : '') +
      '<div class="card card-p"><b style="font-size:13.5px">🧭 Where this sits</b>' +
      '<p style="font-size:12.5px;color:var(--slate);margin:9px 0 0;line-height:1.7">' + esc(ind.name) + ' is one of nine verticals the portfolio serves. Walk the chain with the arrows below, browse all verticals, or open the 20-solution grid.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="software-industries.html">🗂 All nine verticals</a>' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="software-products.html">📦 Product grid (20)</a></div></div>' +
      '</div>' +
      (relLinks ? '<h3 style="font-size:16px;margin:22px 0 10px">Adjacent sectors</h3><div class="grid g3">' + relLinks + '</div>' : '') +
      '</div>' +

      /* ---------- FAQ ---------- */
      ((d.faq || []).length ? '<h2 style="font-size:22px;margin-top:36px">Common questions</h2>' +
      '<div class="grid g2">' + d.faq.map(function (f) {
        return '<div class="card card-p"><b style="font-size:14.5px;color:var(--blue)">Q · ' + esc(f[0]) + '</b><p style="font-size:13.5px;color:var(--slate);margin:8px 0 0;line-height:1.7">' + esc(f[1]) + '</p></div>';
      }).join('') + '</div>' : '') +

      /* ---------- PREV / NEXT CHAIN ---------- */
      '<div style="display:flex;gap:12px;margin-top:30px;flex-wrap:wrap;justify-content:space-between;align-items:stretch">' +
      '<a class="btn btn-o" style="max-width:30%;text-align:left" href="software-industry.html#' + prev.id + '">← ' + prev.icon + ' ' + esc(prev.name) + '</a>' +
      '<a class="btn btn-o" href="software-industries.html">All 9 industries</a>' +
      '<a class="btn btn-o" style="max-width:30%;text-align:right" href="software-industry.html#' + next.id + '">' + next.icon + ' ' + esc(next.name) + ' →</a></div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:10px;text-align:center">Vertical ' + (i + 1) + ' of ' + IND.length + ' — every industry links to the next and back.</p>' +
      '</div></section>' +

      /* ---------- CTA BAND ---------- */
      '<section class="sec" style="background:var(--ink);color:#fff"><div class="wrap" style="text-align:center;padding:36px 28px">' +
      '<h2 style="color:#fff;font-size:24px">' + esc(ind.name) + ' runs on Simal + Unisoft</h2>' +
      '<p style="color:#C6D2E0;max-width:620px;margin:8px auto 16px">' + esc((d.what || ind.desc).slice(0, 180)) + '…</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn btn-lg btn-gold" href="contact.html?type=' + encodeURIComponent(ind.name + ' solution') + '">Talk to the sector desk</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2C4159" href="software.html#demo">Book a live demo</a></div></div></section>';
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    if (IND.some(function (x) { return x.id === id; })) render();
  });
})();
