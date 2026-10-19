/* Sub-service detail (grandchild tier): #sub-id. Breadcrumb up to the parent service,
   siblings alongside, deliverables + stack + CTA. Re-renders on hashchange. */
(function () {
  var root = document.getElementById('sub-root');
  var M = SOFTWARE.serviceDetail, S12 = SOFTWARE.services;
  var meta = {};
  S12.forEach(function (s) { meta[s.id] = s; });

  var TABS = '<div class="sw-tabs"><div class="wrap">' +
    '<a href="software.html">Software home</a>' +
    '<a href="software-erp.html">UniERP flagship</a>' +
    '<a href="software-products.html">Products (20)</a>' +
    '<a class="on" href="software-services.html">Services (12)</a>' +
    '<a href="software-industries.html">Industries (9)</a></div></div>';

  function find(id) {
    for (var i = 0; i < M.length; i++) {
      for (var j = 0; j < M[i].subs.length; j++) {
        if (M[i].subs[j].id === id) return { svc: M[i], svcIndex: i, sub: M[i].subs[j], sibs: M[i].subs };
      }
    }
    return null;
  }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var hit = find(id);
    if (!hit) {
      document.title = 'Sub-service — Simal Software Services';
      root.innerHTML = TABS + '<section class="sec"><div class="wrap">' +
        '<div class="empty">Unknown sub-service. <a href="software-services.html">Back to the service directory →</a></div>' +
        '</div></section>';
      return;
    }
    var m = meta[hit.svc.id] || {};
    document.title = hit.sub.name + ' — ' + (m.name || hit.svc.id) + ' — Simal';
    root.innerHTML =
      '<section class="hero hero-green"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="software-services.html" style="color:#CFE0F3">Services</a> › <a href="software-service.html#' + hit.svc.id + '" style="color:#CFE0F3">' + S.esc(m.name || hit.svc.id) + '</a> › <b style="color:#fff">' + S.esc(hit.sub.name) + '</b></div>' +
      '<span class="badge" style="background:rgba(255,255,255,.14);color:#fff">' + (m.icon || '🛠') + ' ' + S.esc(m.name || hit.svc.id) + ' · sub-service</span>' +
      '<h1 style="font-size:32px;margin-top:12px">' + S.esc(hit.sub.name) + '</h1>' +
      '<p class="lead" style="color:#CFE8DA;margin-top:12px;max-width:640px">' + S.esc(hit.sub.what) + '</p>' +
      '<div class="cta"><a class="btn btn-lg btn-a" href="contact.html?type=' + encodeURIComponent(hit.sub.name + ' — ' + (m.name || '')) + '">Discuss this scope →</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2A3B4E" href="software-service.html#' + hit.svc.id + '">Parent service ↑</a></div></div>' +
      '<div class="hero-card"><h3>🧭 ' + S.esc(hit.sub.name) + '</h3>' +
      '<div class="row"><span>Part of</span><b>' + S.esc(m.name || hit.svc.id) + '</b></div>' +
      '<div class="row"><span>Delivered by</span><b>Simal + Unisoft</b></div>' +
      '<div class="row"><span>Engagement</span><b>Fixed / dedicated</b></div></div></div></section>' + TABS +
      '<section class="sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-services.html">Services</a> › <a href="software-service.html#' + hit.svc.id + '">' + S.esc(m.name || hit.svc.id) + '</a> › <b>' + S.esc(hit.sub.name) + '</b></div>' +
      '<div class="sec-head"><div><span class="eyebrow">What ships with this engagement</span><h2 style="font-size:24px">What you get</h2></div></div>' +
      '<div class="grid g3">' + hit.sub.gives.map(function (g, gi) {
        var ic = ['📦', '⚙️', '📈'][gi % 3];
        return '<div class="card card-p" style="border-top:4px solid var(--g3)"><div style="font-size:22px">' + ic + '</div>' +
          '<p style="font-size:14px;font-weight:650;color:var(--ink);margin:9px 0 0;line-height:1.5">' + S.esc(g) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="split" style="grid-template-columns:1.15fr .85fr;align-items:start;margin-top:30px">' +
      '<div><h2 style="font-size:22px">How ' + S.esc(m.name || hit.svc.id) + ' runs</h2>' +
      '<div class="timeline" style="margin-top:10px">' + hit.svc.how.map(function (h) {
        return '<div class="tl"><b>' + S.esc(h[0]) + '</b><span>' + S.esc(h[1]) + '</span></div>';
      }).join('') + '</div></div>' +
      '<div class="card card-p" style="border-top:4px solid var(--blue)"><b style="font-size:14px">Typical stack &amp; methods</b>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + hit.sub.stack.map(function (t) {
        return '<span class="chip" style="font-size:12px;padding:5px 12px">' + S.esc(t) + '</span>';
      }).join('') + '</div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:12px">Tooling adapts to your estate — these are the house defaults.</p>' +
      '<a class="btn btn-p btn-sm" style="margin-top:8px" href="contact.html?type=' + encodeURIComponent(hit.sub.name) + '">Request this scope →</a></div></div>' +
      '<h2 style="font-size:22px;margin-top:36px">Keep exploring — no dead ends</h2>' +
      '<div class="grid g3">' + hit.sibs.filter(function (s) { return s.id !== hit.sub.id; }).map(function (s) {
        return '<a href="software-subservice.html#' + s.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)"><b style="font-size:15px">' + S.esc(s.name) + '</b>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:8px 0 0">' + S.esc(s.what.slice(0, 100)) + '…</p>' +
          '<span style="font-size:12px;font-weight:700;color:var(--blue)">Deep detail →</span></div></a>';
      }).join('') +
      '<a href="software-service.html#' + hit.svc.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' + (m.icon || '🛠') + ' <b style="font-size:15px">' + S.esc(m.name || hit.svc.id) + '</b>' +
        '<p style="font-size:12.5px;color:var(--slate);margin:8px 0 0">The parent service — full overview, method and all sub-services.</p>' +
        '<span style="font-size:12px;font-weight:700;color:var(--blue)">Service detail →</span></div></a></div>' +
      ((hit.svc.faq || []).length ? '<h2 style="font-size:22px;margin-top:36px">Common questions</h2>' +
      '<div class="grid g2">' + hit.svc.faq.map(function (f) {
        return '<div class="card card-p"><b style="font-size:14.5px;color:var(--blue)">Q · ' + S.esc(f[0]) + '</b><p style="font-size:13.5px;color:var(--slate);margin:8px 0 0;line-height:1.7">' + S.esc(f[1]) + '</p></div>';
      }).join('') + '</div>' : '') +
      '<div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap;justify-content:space-between">' +
      '<a class="btn btn-o" href="software-service.html#' + hit.svc.id + '">↑ ' + S.esc(m.name || hit.svc.id) + '</a>' +
      '<a class="btn btn-o" href="software-services.html">Service directory</a>' +
      '<a class="btn btn-o" href="contact.html?type=' + encodeURIComponent(hit.sub.name) + '">Start a conversation →</a></div>' +
      '</div></section>' +
      '<section class="sec" style="background:var(--ink);color:#fff"><div class="wrap" style="text-align:center;padding:36px 28px">' +
      '<h2 style="color:#fff;font-size:24px">Put ' + S.esc(hit.sub.name) + ' to work in your business</h2>' +
      '<p style="color:#C6D2E0;max-width:600px;margin:8px auto 16px">' + S.esc(hit.svc.overview.slice(0, 180)) + '…</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn btn-lg btn-gold" href="contact.html?type=' + encodeURIComponent(hit.sub.name) + '">Scope this with the desk</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2C4159" href="software.html#demo">Book a consultation</a></div></div></section>';
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', render);
})();
