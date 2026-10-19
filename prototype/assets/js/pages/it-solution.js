/* IT-solution detail: #id from window.ITSOL (12 solution lines). Research-informed
   structure (ITIL SLM practice): defined scope & dependencies, tiered SLAs with
   response/resolution times, process/obligations, reporting commitments — plus the
   established cross-navigation: related lines, catalog categories, prev/next of 12.
   Re-renders on hashchange; in-page anchors are guarded. */
(function () {
  var root = document.getElementById('itsol-root');
  var M = window.ITSOL || [];
  var FLAG = (window.CONTENT && CONTENT.solutions5) || [];
  /* flagship slug → line id (5 flagship practices map onto their lines) */
  var FLAGMAP = { amc: 'amc', av: 'av', cloud: 'cloud-security', storage: 'data-recovery', firewall: 'firewall' };
  var CAT_LABELS = { 'internal-ssd': 'Internal SSDs', 'portable-ssd': 'Portable SSDs', memory: 'Memory', monitors: 'Monitors', gaming: 'Gaming', accessories: 'Accessories', laptops: 'Laptops' };
  var current = null;

  var TABS = '<div class="sw-tabs" style="background:#F4F7FB;border-color:var(--line)"><div class="wrap">' +
    '<a href="solutions.html" class="on">IT solutions (12)</a>' +
    '<a href="software.html">Software services</a>' +
    '<a href="category.html">Product catalog</a>' +
    '<a href="contact.html">Contact the desk</a></div></div>';

  function esc(s) { return S.esc(s); }

  function tierTable() {
    if (!(window.CONTENT && CONTENT.amcTiers)) return '';
    var T = CONTENT.amcTiers;
    return '<h2 style="font-size:22px;margin-top:36px" id="sla">SLA tiers — in the contract, not the brochure</h2>' +
      '<div style="overflow-x:auto;margin-top:12px;border:1px solid var(--line);border-radius:12px">' +
      '<table class="tbl" style="min-width:640px;width:100%;border-collapse:collapse;background:#fff">' +
      '<tr>' + T.head.map(function (h, i) { return '<th style="padding:11px 14px;text-align:' + (i > 0 ? 'center' : 'left') + ';background:var(--ink);color:#fff;font-size:12.5px">' + esc(h) + '</th>'; }).join('') + '</tr>' +
      T.rows.map(function (r, ri) {
        return '<tr style="border-top:1px solid var(--line)"><td style="padding:10px 14px;font-size:13px;font-weight:600">' + esc(r[0]) + '</td>' + r.slice(1).map(function (c, j) {
          return '<td style="padding:10px 14px;text-align:center;font-size:13px;' + (j === 2 ? 'background:var(--blue-050);font-weight:700;color:var(--blue)' : '') + '">' + esc(c) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</table></div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:8px">Tier assignment is per asset class — critical systems on Premium (1-hour response, 24×7×365), edge devices on Basic. Source: content package §05-02.</p>';
  }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    id = FLAGMAP[id] || id;   // legacy flagship anchors (cloud, storage) map onto line ids
    var i = M.findIndex(function (x) { return x.id === id; });
    if (i < 0) {
      if (current) return;
      document.title = 'IT solution — Simal Technologies';
      root.innerHTML = TABS + '<section class="sec"><div class="wrap">' +
        '<div class="empty">Unknown solution line. <a href="solutions.html">Back to all 12 lines →</a></div>' +
        '</div></section>';
      return;
    }
    current = id;
    var s = M[i];
    var prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    var rel = (s.related || []).map(function (rid) {
      var r = M.filter(function (x) { return x.id === rid; })[0];
      if (!r) return '';
      return '<a href="it-solution.html#' + r.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--g3)">' +
        '<div style="font-size:20px">' + r.icon + '</div><b style="font-size:14.5px;display:block;margin-top:6px">' + esc(r.t.split(' (')[0]) + '</b>' +
        '<p style="font-size:12.5px;color:var(--slate);margin:7px 0 0;line-height:1.55">' + esc(r.d.slice(0, 100)) + '…</p>' +
        '<span style="font-size:12px;font-weight:700;color:var(--blue)">Solution detail →</span></div></a>';
    }).join('');
    var catChips = (s.cats || []).map(function (c) {
      return '<a href="category.html#' + c + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">📦 ' + esc(CAT_LABELS[c] || c) + '</a>';
    }).join('');
    var swChips = '<a href="software-service.html#custom-dev" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">🛠 Custom development</a>' +
      '<a href="software-service.html#cloud" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">☁️ Cloud services</a>' +
      '<a href="software-products.html" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">🗂 Software portfolio (20)</a>';

    document.title = s.t + ' — IT solutions — Simal Technologies';
    root.innerHTML =
      /* ---------- HERO ---------- */
      '<section class="hero hero-green"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="index.html" style="color:#CFE0F3">Home</a> › <a href="solutions.html" style="color:#CFE0F3">IT solutions (12)</a> › <b style="color:#fff">' + esc(s.t.split(' (')[0]) + '</b></div>' +
      '<span class="badge" style="background:rgba(255,255,255,.14);color:#fff">' + s.icon + ' solution line ' + (i + 1) + ' of ' + M.length + '</span>' +
      '<h1 style="font-size:32px;margin-top:12px">' + esc(s.t) + '</h1>' +
      '<p class="lead" style="color:#CFE8DA;margin-top:12px;max-width:660px">' + esc(s.d) + '</p>' +
      '<div class="cta"><a class="btn btn-lg" style="background:#fff;color:var(--blue)" href="contact.html?type=' + encodeURIComponent(s.t) + '">Request this solution →</a>' +
      (s.tiers ? '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2A4A3E" href="#sla">See the SLA tiers ↓</a>' : '') +
      '</div></div>' +
      '<div class="hero-card"><h3>' + s.icon + ' ' + esc(s.t.split(' (')[0]) + '</h3>' +
      '<div class="row"><span>Family</span><b>IT solutions line</b></div>' +
      '<div class="row"><span>Scope areas</span><b>' + s.scope.length + '</b></div>' +
      '<div class="row"><span>Delivery</span><b>Dubai desk · JAFZA logistics</b></div>' +
      (s.tiers ? '<div class="row"><span>SLA tiers</span><b>Basic · Standard · Premium</b></div>' : '') +
      '</div></div></section>' + TABS +

      /* ---------- WHAT + SCOPE ---------- */
      '<section class="sec"><div class="wrap">' +
      '<div class="sec-head"><div><span class="eyebrow">solution overview</span><h2 style="font-size:24px">What this solution is</h2></div></div>' +
      '<p style="font-size:15.5px;line-height:1.8;color:var(--slate);max-width:900px">' + esc(s.what) + '</p>' +
      '<div class="sec-head" style="margin-top:32px"><div><span class="eyebrow">what it covers</span><h2 style="font-size:24px">Scope &amp; deliverables</h2></div>' +
      '<span class="chip on" style="font-size:12px">' + s.scope.length + ' areas</span></div>' +
      '<div class="grid g3">' + s.scope.map(function (c, ci) {
        return '<div class="card card-p" style="height:100%;border-top:4px solid var(--blue)"><b style="font-size:15px">' + ['🎯', '⚙️', '📊', '🔗', '🧭'][ci % 5] + ' ' + esc(c[0]) + '</b>' +
          '<ul style="margin:10px 0 0;padding-left:18px">' + c[1].map(function (b) {
            return '<li style="font-size:13px;color:var(--slate);margin:5px 0;line-height:1.55">' + esc(b) + '</li>';
          }).join('') + '</ul></div>';
      }).join('') + '</div>' +
      (s.tiers ? tierTable() : '') +

      /* ---------- PROCESS + SIDE CARD ---------- */
      '<div class="split" style="grid-template-columns:1.15fr .85fr;align-items:start;margin-top:34px">' +
      '<div><h2 style="font-size:22px">How an engagement runs</h2>' +
      '<div class="timeline" style="margin-top:10px">' + s.process.map(function (h) {
        return '<div class="tl"><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span></div>';
      }).join('') + '</div></div>' +
      '<div><div class="card card-p" style="border-top:4px solid var(--g3)"><b style="font-size:14px">🏗️ Delivery model</b>' +
      '<p style="font-size:13px;color:var(--slate);margin:9px 0 0;line-height:1.65">Specified from the 81-SKU authorized portfolio, staged and fulfilled from JAFZA, supported by the Dubai service desk — with Unisoft engineering behind the software layer when the solution needs it.</p>' +
      '<a class="btn btn-p btn-sm" style="margin-top:10px" href="contact.html?type=' + encodeURIComponent(s.t) + '">Request pricing →</a></div>' +
      (catChips ? '<div class="card card-p" style="border-top:4px solid var(--blue);margin-top:14px"><b style="font-size:14px">📦 Related catalog categories</b>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + catChips + '</div></div>' : '') +
      '</div></div>' +

      /* ---------- CROSS-NAV BAND ---------- */
      '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:22px 24px;margin-top:34px">' +
      '<div class="sec-head" style="margin:0 0 4px"><div><span class="eyebrow">multi-point navigation</span><h2 style="font-size:21px">Explore from every angle — no dead ends</h2></div></div>' +
      '<div class="grid g2" style="margin-top:12px">' +
      '<div class="card card-p"><b style="font-size:13.5px">🛠 Software side of the house</b>' +
      '<p style="font-size:12.5px;color:var(--slate);margin:9px 0 0">Where this line needs software engineering, the Unisoft-backed practice takes it further.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + swChips + '</div></div>' +
      '<div class="card card-p"><b style="font-size:13.5px">🧭 Where this sits</b>' +
      '<p style="font-size:12.5px;color:var(--slate);margin:9px 0 0;line-height:1.7">One of 12 solution lines delivered by the Simal desk. Walk the chain with the arrows below or browse the full directory.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="solutions.html">🗂 All 12 solution lines</a>' +
      '<a class="chip" style="font-size:12px;text-decoration:none" href="category.html">📦 Full product catalog</a></div></div>' +
      '</div>' +
      (rel ? '<h3 style="font-size:16px;margin:22px 0 10px">Pairs well with</h3><div class="grid g3">' + rel + '</div>' : '') +
      '</div>' +

      /* ---------- FAQ ---------- */
      '<h2 style="font-size:22px;margin-top:36px">Common questions</h2>' +
      '<div class="grid g2">' + s.faq.map(function (f) {
        return '<div class="card card-p"><b style="font-size:14.5px;color:var(--blue)">Q · ' + esc(f[0]) + '</b><p style="font-size:13.5px;color:var(--slate);margin:8px 0 0;line-height:1.7">' + esc(f[1]) + '</p></div>';
      }).join('') + '</div>' +

      /* ---------- PREV / NEXT ---------- */
      '<div style="display:flex;gap:12px;margin-top:30px;flex-wrap:wrap;justify-content:space-between;align-items:stretch">' +
      '<a class="btn btn-o" style="max-width:30%;text-align:left" href="it-solution.html#' + prev.id + '">← ' + prev.icon + ' ' + esc(prev.t.split(' (')[0]) + '</a>' +
      '<a class="btn btn-o" href="solutions.html">All 12 lines</a>' +
      '<a class="btn btn-o" style="max-width:30%;text-align:right" href="it-solution.html#' + next.id + '">' + next.icon + ' ' + esc(next.t.split(' (')[0]) + ' →</a></div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:10px;text-align:center">Solution line ' + (i + 1) + ' of ' + M.length + ' — every line links to the next and back.</p>' +
      '</div></section>' +

      /* ---------- CTA ---------- */
      '<section class="sec" style="background:var(--ink);color:#fff"><div class="wrap" style="text-align:center;padding:36px 28px">' +
      '<h2 style="color:#fff;font-size:24px">' + esc(s.t.split(' (')[0]) + ', delivered from Dubai</h2>' +
      '<p style="color:#C6D2E0;max-width:620px;margin:8px auto 16px">' + esc(s.what.slice(0, 180)) + '…</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn btn-lg btn-gold" href="contact.html?type=' + encodeURIComponent(s.t) + '">Talk to the solutions desk</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2C4159" href="solutions.html">Browse all lines</a></div></div></section>';
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    id = FLAGMAP[id] || id;
    if (M.some(function (x) { return x.id === id; })) render();
  });
})();
