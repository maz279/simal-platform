/* Service detail (child tier): #id renders the service, no hash = index of all 12.
   Grandchildren (sub-services) live on software-subservice.html. Re-renders on hashchange. */
(function () {
  var root = document.getElementById('svc-root');
  var M = SOFTWARE.serviceDetail, S12 = SOFTWARE.services;
  var meta = {};
  S12.forEach(function (s) { meta[s.id] = s; });
  var byId = {};
  M.forEach(function (s) { byId[s.id] = s; });

  var TABS = '<div class="sw-tabs"><div class="wrap">' +
    '<a href="software.html">Software home</a>' +
    '<a href="software-erp.html">UniERP flagship</a>' +
    '<a href="software-products.html">Products (20)</a>' +
    '<a class="on" href="software-services.html">Services (12)</a>' +
    '<a href="software-industries.html">Industries (9)</a></div></div>';

  function index() {
    document.title = 'Service Directory (12) — Simal Software Services';
    root.innerHTML =
      '<section class="hero hero-green"><div class="wrap" style="padding:54px 28px 50px;grid-template-columns:1fr .8fr">' +
      '<div><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">simal software services · engineered with unisoft systems</span>' +
      '<h1 style="font-size:38px">Twelve practices,<br><em>each with its own detail page.</em></h1>' +
      '<p class="lead" style="color:#CFE8DA">Pick a practice to open its service page — overview, how we work, and every sub-service as its own deep page. No dead ends, at any depth.</p>' +
      '<div class="cta"><a class="btn btn-lg" style="background:#fff;color:var(--blue)" href="#svc-list">Browse the directory</a>' +
      '<a class="btn btn-lg btn-a" href="contact.html?type=Software%20services">Scope a project</a></div></div>' +
      '<div class="hero-card"><h3>🛠 The practice</h3><div class="row"><span>Services</span><b>12</b></div>' +
      '<div class="row"><span>Sub-service pages</span><b>36</b></div><div class="row"><span>Engineers</span><b>40+</b></div>' +
      '<div class="row"><span>Projects</span><b>150+</b></div></div></div></section>' + TABS +
      '<section class="sec" id="svc-list"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-services.html">Services</a> › <b>Directory</b></div>' +
      '<div class="sec-head"><div><span class="eyebrow">Service directory</span><h2>All twelve practices</h2></div></div>' +
      '<div class="grid g3">' + M.map(function (s) {
        var m = meta[s.id] || {};
        return '<a href="software-service.html#' + s.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' +
          '<div style="display:flex;gap:12px;align-items:center"><div style="width:46px;height:46px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:21px">' + (m.icon || '🛠') + '</div>' +
          '<b style="font-size:16px">' + S.esc(m.name || s.id) + '</b></div>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:10px 0 8px">' + S.esc((m.tag || '').slice(0, 110)) + '…</p>' +
          '<span class="chip" style="font-size:11.5px;padding:4px 10px">' + s.subs.length + ' sub-services</span>' +
          '<span style="display:block;margin-top:10px;font-size:12.5px;font-weight:700;color:var(--blue)">Service detail →</span></div></a>';
      }).join('') + '</div></div></section>';
  }

  function detail(d, i) {
    var m = meta[d.id] || {};
    document.title = (m.name || d.id) + ' — Simal Software Services';
    var prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    root.innerHTML =
      '<section class="hero hero-green"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="software-services.html" style="color:#CFE0F3">Services</a> › <b style="color:#fff">' + S.esc(m.name || d.id) + '</b></div>' +
      '<div style="display:flex;gap:14px;align-items:center"><div style="width:58px;height:58px;border-radius:14px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:grid;place-items:center;font-size:27px">' + (m.icon || '🛠') + '</div>' +
      '<div><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">service ' + (i + 1) + ' of ' + M.length + '</span>' +
      '<h1 style="font-size:33px;margin-top:6px">' + S.esc(m.name || d.id) + '</h1></div></div>' +
      '<p class="lead" style="color:#CFE8DA;margin-top:14px">' + S.esc(m.tag || '') + '</p>' +
      '<div class="cta"><a class="btn btn-lg btn-a" href="contact.html?type=' + encodeURIComponent(m.name || d.id) + '">Scope this service</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2A3B4E" href="software.html#demo">Book a consultation</a></div></div>' +
      '<div class="hero-card"><h3>🧭 ' + S.esc(m.name || d.id) + '</h3>' +
      '<div class="row"><span>Sub-service pages</span><b>' + d.subs.length + '</b></div>' +
      '<div class="row"><span>Delivery</span><b>Simal Dubai + Unisoft Dhaka</b></div>' +
      '<div class="row"><span>Support</span><b>24/7 · AMC option</b></div></div></div></section>' + TABS +
      '<section class="sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-services.html">Services</a> › <b>' + S.esc(m.name || d.id) + '</b></div>' +
      '<h2 style="font-size:22px">Overview</h2><p style="font-size:15px;color:var(--slate);line-height:1.8;max-width:860px">' + S.esc(d.overview) + '</p>' +
      '<h2 style="font-size:22px;margin-top:34px">Sub-services — each has its own page</h2>' +
      '<div class="grid g3">' + d.subs.map(function (sub) {
        return '<a href="software-subservice.html#' + sub.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--g3)">' +
          '<b style="font-size:15.5px">' + S.esc(sub.name) + '</b>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:8px 0">' + S.esc(sub.what.slice(0, 120)) + '…</p>' +
          '<span style="font-size:12px;font-weight:700;color:var(--blue)">Deep detail →</span></div></a>';
      }).join('') + '</div>' +
      '<h2 style="font-size:22px;margin-top:36px">How we work</h2>' +
      '<div class="grid g3">' + d.how.map(function (h) {
        return '<div class="card card-p"><b style="color:var(--blue);font-size:14px">' + S.esc(h[0]) + '</b><p style="font-size:13px;color:var(--slate);margin-top:6px">' + S.esc(h[1]) + '</p></div>';
      }).join('') + '</div>' +
      /* reverse cross-navigation: solutions this practice delivers (v1.4.0) */
      (function () {
        var sols = (SOFTWARE.solutionDetail || []).filter(function (sd) {
          return (sd.services || []).indexOf(d.id) > -1;
        }).map(function (sd) {
          var pm = SOFTWARE.products.filter(function (x) { return x.id === sd.id; })[0] || {};
          return '<a href="software-solution.html#' + sd.id + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' +
            (pm.icon || '📦') + ' ' + S.esc(pm.name || sd.id) + '</a>';
        }).join('');
        return sols ? '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-top:30px">' +
          '<b style="font-size:14px">📦 Solutions this practice delivers</b>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:6px 0 0">Each opens its own solution deep-dive — capabilities, rollout, pricing channel.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + sols + '</div></div>' : '';
      })() +
      ((d.faq || []).length ? '<h2 style="font-size:22px;margin-top:36px">Common questions</h2>' +
      '<div class="grid g2">' + d.faq.map(function (f) {
        return '<div class="card card-p"><b style="font-size:14.5px;color:var(--blue)">Q · ' + S.esc(f[0]) + '</b><p style="font-size:13.5px;color:var(--slate);margin:8px 0 0;line-height:1.7">' + S.esc(f[1]) + '</p></div>';
      }).join('') + '</div>' : '') +
      '<div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap;justify-content:space-between">' +
      '<a class="btn btn-o" href="software-service.html#' + prev.id + '">← ' + S.esc(meta[prev.id] ? meta[prev.id].name : prev.id) + '</a>' +
      '<a class="btn btn-o" href="software-services.html">All services</a>' +
      '<a class="btn btn-o" href="software-service.html#' + next.id + '">' + S.esc(meta[next.id] ? meta[next.id].name : next.id) + ' →</a></div>' +
      '</div></section>';
  }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var i = M.findIndex(function (s) { return s.id === id; });
    if (i > -1) detail(M[i], i);
    else if (root.childElementCount) return;   // in-page anchor on a rendered view — keep it
    else index();
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', render);
})();
