/* Solution detail (product deep-dive): #solution-id. Fourth tier of the software IA —
   grid (20) → this page, with multi-point cross-navigation: UniERP modules it uses,
   industries that run it, engineering services that deliver it, sibling solutions,
   and a prev/next chain across all 20. Re-renders on hashchange. */
(function () {
  var root = document.getElementById('sol-root');
  var P = SOFTWARE.products, D = SOFTWARE.solutionDetail;
  var S12 = SOFTWARE.services, MODS = SOFTWARE.moduleDetail, IND = SOFTWARE.industries;
  var pMeta = {}, dMeta = {}, sMeta = {}, mMeta = {};
  P.forEach(function (p) { pMeta[p.id] = p; });
  D.forEach(function (d) { dMeta[d.id] = d; });
  S12.forEach(function (s) { sMeta[s.id] = s; });
  MODS.forEach(function (m) { mMeta[m.id] = m; });

  var TABS = '<div class="sw-tabs"><div class="wrap">' +
    '<a href="software.html">Software home</a>' +
    '<a href="software-erp.html">UniERP flagship</a>' +
    '<a class="on" href="software-products.html">Products (20)</a>' +
    '<a href="software-services.html">Services (12)</a>' +
    '<a href="software-industries.html">Industries (9)</a></div></div>';
  var current = null;

  function esc(s) { return S.esc(s); }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var p = pMeta[id], d = dMeta[id];
    if (!p) {
      // hash is an in-page anchor (e.g. #capabilities) on an already-rendered solution — keep it
      if (current) return;
      document.title = 'Solution — Simal Software Services';
      root.innerHTML = TABS + '<section class="sec"><div class="wrap">' +
        '<div class="empty">Unknown solution. <a href="software-products.html">Back to all 20 products →</a></div>' +
        '</div></section>';
      return;
    }
    current = id;
    var i = P.indexOf(p);
    var prev = P[(i - 1 + P.length) % P.length];
    var next = P[(i + 1) % P.length];
    var fam = p.grp === 'erp' ? 'ERP solution' : 'Specialized system';
    var famAnchor = p.grp === 'erp' ? 'software-products.html' : 'software-products.html'; // grid filter covers both
    var inds = IND.filter(function (x) { return x.products.indexOf(p.id) > -1; });
    var modLinks = (d.modules || []).map(function (mid) {
      return '<a href="software-module.html#' + mid + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' +
        (mMeta[mid] ? mMeta[mid].icon + ' ' + esc(mMeta[mid].name) : mid) + '</a>';
    }).join('');
    var svcLinks = (d.services || []).map(function (sid) {
      return '<a href="software-service.html#' + sid + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' +
        (sMeta[sid] ? sMeta[sid].icon + ' ' + esc(sMeta[sid].name) : sid) + '</a>';
    }).join('');
    var indLinks = inds.map(function (x) {
      return '<a href="software-industry.html#' + x.id + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' + x.icon + ' ' + esc(x.name) + '</a>';
    }).join('');

    document.title = p.name + ' — solution detail — Simal Software Services';
    root.innerHTML =
      /* ---------- HERO ---------- */
      '<section class="hero"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="software.html" style="color:#CFE0F3">Software</a> › <a href="software-products.html" style="color:#CFE0F3">Products &amp; platforms (20)</a> › <b style="color:#fff">' + esc(p.name) + '</b></div>' +
      '<span class="badge" style="background:rgba(255,255,255,.14);color:#fff">' + p.icon + ' ' + fam + (p.star ? ' · ★ GCC lead line' : '') + '</span>' +
      '<h1 style="font-size:32px;margin-top:12px">' + esc(p.name) + '</h1>' +
      '<p class="lead" style="color:#CFE0F3;margin-top:12px;max-width:660px">' + esc(p.desc) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' + p.feats.map(function (f) {
        return '<span class="chip" style="font-size:11.5px;padding:4px 10px;background:rgba(255,255,255,.12);color:#fff">' + esc(f) + '</span>';
      }).join('') + '</div>' +
      '<div class="cta"><a class="btn btn-lg btn-gold" href="contact.html?type=' + encodeURIComponent('Solution: ' + p.name) + '">Scope this solution →</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2A3B4E" href="#capabilities">Explore the detail ↓</a></div></div>' +
      '<div class="hero-card"><h3>' + p.icon + ' ' + esc(p.name) + '</h3>' +
      '<div class="row"><span>Family</span><b>' + fam + (p.star ? ' · GCC lead' : '') + '</b></div>' +
      '<div class="row"><span>Built for</span><b>' + esc(p.target) + '</b></div>' +
      '<div class="row"><span>Delivered by</span><b>Simal + Unisoft</b></div>' +
      '<div class="row"><span>Licensing</span><b>$0 per-user (Odoo 19 CE)</b></div>' +
      ((d.modules || []).length ? '<div class="row"><span>UniERP modules</span><b>' + (d.modules || []).length + ' core modules</b></div>' : '') +
      '</div></div></section>' + TABS +

      /* ---------- WHAT IT IS ---------- */
      '<section class="sec" id="cap-sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-products.html">Products (20)</a> › <b>' + esc(p.name) + '</b></div>' +
      '<div class="sec-head"><div><span class="eyebrow">solution overview</span><h2 style="font-size:24px">What this solution is</h2></div>' +
      '<span class="chip on" style="font-size:12px">' + esc(fam) + '</span></div>' +
      '<p style="font-size:15.5px;line-height:1.8;color:var(--slate);max-width:900px">' + esc(d.what) + '</p>' +

      /* ---------- CAPABILITIES ---------- */
      '<div class="sec-head" style="margin-top:34px"><div><span class="eyebrow">capability map</span><h2 style="font-size:24px" id="capabilities">What it covers</h2></div></div>' +
      '<div class="grid g3">' + d.caps.map(function (c, ci) {
        return '<div class="card card-p" style="height:100%;border-top:4px solid var(--blue)"><b style="font-size:15px;color:var(--ink)">' + ['🎯', '⚙️', '📊', '🔗', '🧭'][ci % 5] + ' ' + esc(c[0]) + '</b>' +
          '<ul style="margin:10px 0 0;padding-left:18px">' + c[1].map(function (b) {
            return '<li style="font-size:13px;color:var(--slate);margin:5px 0;line-height:1.55">' + esc(b) + '</li>';
          }).join('') + '</ul></div>';
      }).join('') + '</div>' +

      /* ---------- ROLLOUT + PLATFORM SPLIT ---------- */
      '<div class="split" style="grid-template-columns:1.15fr .85fr;align-items:start;margin-top:34px">' +
      '<div><h2 style="font-size:22px">How a rollout runs</h2>' +
      '<div class="timeline" style="margin-top:10px">' + d.flow.map(function (h) {
        return '<div class="tl"><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span></div>';
      }).join('') + '</div>' +
      '<h3 style="font-size:15px;margin:20px 0 6px">Why teams pick it</h3>' +
      '<ul style="margin:0;padding-left:18px">' + d.why.map(function (w) {
        return '<li style="font-size:13.5px;color:var(--slate);margin:6px 0;line-height:1.6">' + esc(w) + '</li>';
      }).join('') + '</ul></div>' +
      '<div><div class="card card-p" style="border-top:4px solid var(--g3)"><b style="font-size:14px">🏗️ Platform &amp; licensing</b>' +
      '<p style="font-size:13px;color:var(--slate);margin:9px 0 0;line-height:1.65">' + esc(d.deploy) + '</p>' +
      '<p style="font-size:11.5px;color:var(--slate-500);margin:10px 0 0">' + esc(SOFTWARE.partnership.split('·')[0].trim()) + ' — with Unisoft Systems (Dhaka): 40+ engineers, Odoo-certified, ISO 9001 / ISO 27001.</p>' +
      '<a class="btn btn-p btn-sm" style="margin-top:10px" href="contact.html?type=' + encodeURIComponent('Solution: ' + p.name) + '">Request pricing &amp; demo →</a></div>' +
      ((d.modules || []).length ? '<div class="card card-p" style="border-top:4px solid var(--blue);margin-top:14px"><b style="font-size:14px">🧩 UniERP modules inside</b>' +
        '<p style="font-size:12.5px;color:var(--slate);margin:8px 0 0">This solution runs on — or integrates with — these UniERP core modules. Each opens its own deep-dive:</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + modLinks + '</div></div>' : '') +
      '</div></div>' +

      /* ---------- CROSS-NAVIGATION BAND ---------- */
      '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin-top:36px">' +
      '<div class="sec-head" style="margin:0 0 4px"><div><span class="eyebrow">multi-point navigation</span><h2 style="font-size:21px">Explore from every angle — no dead ends</h2></div></div>' +
      '<div class="grid g2" style="margin-top:12px">' +
      (indLinks ? '<div class="card card-p"><b style="font-size:13.5px">🏭 Industries that run it</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + indLinks + '</div></div>' : '') +
      (svcLinks ? '<div class="card card-p"><b style="font-size:13.5px">🛠 Engineering services behind it</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + svcLinks + '</div></div>' : '') +
      '<div class="card card-p"><b style="font-size:13.5px">🧭 Where it sits in the portfolio</b>' +
      '<p style="font-size:12.5px;color:var(--slate);margin:9px 0 0;line-height:1.7">' + esc(p.name) + ' is one of 20 products &amp; platforms — ' + (p.grp === 'erp' ? '10 ERP solutions built on the UniERP core' : '10 specialized systems engineered for specific sectors') + '. Browse the full grid, or walk the chain with the prev/next arrows below.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="software-products.html">🗂 Full product grid (20)</a>' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="software-erp.html">🧱 UniERP flagship</a></div></div>' +
      '</div>' +

      /* related solutions */
      '<h3 style="font-size:16px;margin:22px 0 10px">Pairs well with — sibling solutions</h3>' +
      '<div class="grid g3">' + (d.related || []).map(function (rid) {
        var rp = pMeta[rid]; if (!rp) return '';
        return '<a href="software-solution.html#' + rid + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' +
          '<div style="font-size:20px">' + rp.icon + '</div><b style="font-size:14.5px;display:block;margin-top:6px">' + esc(rp.name) + '</b>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:7px 0 0;line-height:1.55">' + esc(rp.desc.slice(0, 110)) + '…</p>' +
          '<span style="font-size:12px;font-weight:700;color:var(--blue)">Solution detail →</span></div></a>';
      }).join('') + '</div></div>' +

      /* ---------- FAQ ---------- */
      '<h2 style="font-size:22px;margin-top:36px">Common questions</h2>' +
      '<div class="grid g2">' + d.faq.map(function (f) {
        return '<div class="card card-p"><b style="font-size:14.5px;color:var(--blue)">Q · ' + esc(f[0]) + '</b><p style="font-size:13.5px;color:var(--slate);margin:8px 0 0;line-height:1.7">' + esc(f[1]) + '</p></div>';
      }).join('') + '</div>' +

      /* ---------- PREV / NEXT CHAIN ---------- */
      '<div style="display:flex;gap:12px;margin-top:30px;flex-wrap:wrap;justify-content:space-between;align-items:stretch">' +
      '<a class="btn btn-o" style="max-width:30%;text-align:left" href="software-solution.html#' + prev.id + '">← ' + prev.icon + ' ' + esc(prev.name) + '</a>' +
      '<a class="btn btn-o" href="software-products.html">All 20 solutions</a>' +
      '<a class="btn btn-o" style="max-width:30%;text-align:right" href="software-solution.html#' + next.id + '">' + next.icon + ' ' + esc(next.name) + ' →</a></div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:10px;text-align:center">Solution ' + (i + 1) + ' of ' + P.length + ' in the chain — every solution links to the next and back.</p>' +
      '</div></section>' +

      /* ---------- CTA BAND ---------- */
      '<section class="sec" style="background:var(--ink);color:#fff"><div class="wrap" style="text-align:center;padding:36px 28px">' +
      '<h2 style="color:#fff;font-size:24px">Put ' + esc(p.name) + ' to work in your business</h2>' +
      '<p style="color:#C6D2E0;max-width:620px;margin:8px auto 16px">' + esc(d.what.slice(0, 180)) + '…</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn btn-lg btn-gold" href="contact.html?type=' + encodeURIComponent('Solution: ' + p.name) + '">Talk to the software desk</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2C4159" href="software.html#demo">Book a live demo</a></div></div></section>';
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    if (pMeta[id]) render();           // real solution switch — re-render + scroll top
    // otherwise it's an in-page anchor (#capabilities) — native scroll, page untouched
  });
})();
