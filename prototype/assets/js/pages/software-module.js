/* UniERP module library: #id renders that module's detail (tabs: overview /
   capabilities / why), no hash renders the index of all 7. Deep-linkable — no dead ends. */
(function () {
  var root = document.getElementById('mod-root');
  var M = SOFTWARE.moduleDetail;
  var byId = {};
  M.forEach(function (m) { byId[m.id] = m; });

  var TABS = '<div class="sw-tabs"><div class="wrap">' +
    '<a href="software.html">Software home</a>' +
    '<a class="on" href="software-erp.html">UniERP flagship</a>' +
    '<a href="software-products.html">Products (20)</a>' +
    '<a href="software-services.html">Services (12)</a>' +
    '<a href="software-industries.html">Industries (9)</a></div></div>';

  function index() {
    document.title = 'UniERP Module Library (7) — Simal Software Services';
    root.innerHTML =
      '<section class="hero"><div class="wrap" style="padding:54px 28px 50px;grid-template-columns:1fr .8fr">' +
      '<div><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">unierp · built on odoo 19 ce</span>' +
      '<h1 style="font-size:38px">Seven modules.<br><em>Start with one, grow to the suite.</em></h1>' +
      '<p class="lead" style="color:#D9E7F6">Every module runs standalone or together on one shared database — and every module has a full detail page: capabilities, benefits, and how it connects to the rest.</p>' +
      '<div class="cta"><a class="btn btn-lg" style="background:#fff;color:var(--blue)" href="software-erp.html">UniERP overview</a>' +
      '<a class="btn btn-lg btn-a" href="software.html#demo">Book a demo</a></div></div>' +
      '<div class="hero-card"><h3>🧩 Module library</h3>' +
      '<div class="row"><span>Core modules</span><b>7</b></div>' +
      '<div class="row"><span>License cost</span><b>$0 / user</b></div>' +
      '<div class="row"><span>Shared database</span><b>Yes — one truth</b></div>' +
      '<a class="btn btn-block" style="background:var(--yellow);color:var(--ink);margin-top:14px" href="software.html#pricing">See packages →</a></div>' +
      '</div></section>' + TABS +
      '<section class="sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-erp.html">UniERP</a> › <b>Module library</b></div>' +
      '<div class="sec-head"><div><span class="eyebrow">Pick a module</span><h2>All seven, each with full detail</h2></div></div>' +
      '<div class="grid g3">' + M.map(function (m) {
        return '<a href="software-module.html#' + m.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%">' +
          '<div style="display:flex;gap:12px;align-items:center"><div style="width:46px;height:46px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:21px">' + m.icon + '</div>' +
          '<div><h4 style="font-size:16px;margin:0">' + S.esc(m.name) + '</h4></div></div>' +
          '<p style="font-size:13px;color:var(--blue);font-weight:700;margin:10px 0 4px">' + S.esc(m.tag) + '</p>' +
          '<p style="font-size:12.5px;color:var(--slate)">' + S.esc(m.overview.slice(0, 120)) + '…</p>' +
          '<span style="display:block;margin-top:10px;font-size:12.5px;font-weight:700;color:var(--blue)">Module detail →</span></div></a>';
      }).join('') + '</div></div></section>';
  }

  function detail(m, i) {
    document.title = m.name + ' — UniERP Module — Simal Software Services';
    var prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    root.innerHTML =
      '<section class="hero"><div class="wrap" style="padding:50px 28px 46px;grid-template-columns:1fr .75fr">' +
      '<div><div class="crumbs" style="color:#9FB1C6;padding:0 0 12px"><a href="software-module.html" style="color:#CFE0F3">Module library</a> › <b style="color:#fff">' + S.esc(m.name) + '</b></div>' +
      '<div style="display:flex;gap:14px;align-items:center"><div style="width:58px;height:58px;border-radius:14px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:grid;place-items:center;font-size:27px">' + m.icon + '</div>' +
      '<div><span class="badge" style="background:rgba(255,255,255,.14);color:#fff">unierp module ' + (i + 1) + ' of ' + M.length + '</span>' +
      '<h1 style="font-size:34px;margin-top:6px">' + S.esc(m.name) + '</h1></div></div>' +
      '<p class="lead" style="color:#D9E7F6;margin-top:14px">' + S.esc(m.tag) + '</p>' +
      '<div class="cta"><a class="btn btn-lg btn-a" href="software.html#demo">See it in a demo</a>' +
      '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:#2A3B4E" href="software.html#pricing">Pricing</a></div></div>' +
      '<div class="hero-card"><h3>🧩 ' + S.esc(m.name) + '</h3>' +
      '<div class="row"><span>License</span><b>$0 per user</b></div>' +
      '<div class="row"><span>Runs</span><b>Standalone or suite</b></div>' +
      '<div class="row"><span>Pairs with</span><b>' + (m.related.length ? m.related.length + ' modules' : '—') + '</b></div>' +
      '<a class="btn btn-block" style="background:var(--yellow);color:var(--ink);margin-top:14px" href="contact.html?type=' + encodeURIComponent(m.name + ' module') + '">Ask about this module</a></div>' +
      '</div></section>' + TABS +
      '<section class="sec"><div class="wrap">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="software.html">Software services</a> › <a href="software-erp.html">UniERP</a> › <a href="software-module.html">Module library</a> › <b>' + S.esc(m.name) + '</b></div>' +
      '<div class="sw-mtabs" id="mtabs">' +
      '<button class="on" data-t="ov">Overview</button><button data-t="cap">Capabilities</button><button data-t="why">Why this module</button></div>' +
      '<div id="t-ov" class="sw-mpanel"><p style="font-size:15.5px;color:var(--slate);line-height:1.8;max-width:820px">' + S.esc(m.overview) + '</p>' +
      '<p style="font-size:12.5px;color:var(--slate-500);margin:14px 0 8px;font-weight:600">Capability areas — click any to open its detail on the Capabilities tab:</p>' +
      '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:2px">' + m.caps.map(function (c, ci) { return '<span class="chip" data-ci="' + ci + '" style="font-size:12px;padding:5px 12px;cursor:pointer">' + S.esc(c[0]) + '</span>'; }).join('') + '</div></div>' +
      '<div id="t-cap" class="sw-mpanel" hidden><div class="grid g2">' + m.caps.map(function (c, ci) {
        return '<div class="card card-p" id="cap-' + ci + '"><h4 style="font-size:15.5px;margin:0 0 8px">' + S.esc(c[0]) + '</h4><ul style="margin:0;padding-left:18px">' +
          c[1].map(function (x) { return '<li style="font-size:13px;color:var(--slate);margin:4px 0">' + S.esc(x) + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div></div>' +
      '<div id="t-why" class="sw-mpanel" hidden><div class="grid g3">' + m.why.map(function (w) {
        return '<div class="card card-p" style="border-top:4px solid var(--g3)"><h4 style="font-size:15px;margin:0 0 6px">✓ ' + S.esc(w) + '</h4></div>';
      }).join('') + '</div></div>' +
      '</div></section>' +
      '<section class="sec" style="background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap">' +
      '<div class="sec-head"><div><span class="eyebrow">Keep exploring — no dead ends</span><h2>Pairs with</h2></div></div>' +
      '<div class="grid g3">' + (m.related.length ? m.related.map(function (rid) {
        var r = byId[rid];
        return '<a href="software-module.html#' + r.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%">' + r.icon + ' <b>' + S.esc(r.name) + '</b><p style="font-size:12.5px;color:var(--slate);margin-top:6px">' + S.esc(r.tag) + '</p><span style="font-size:12px;font-weight:700;color:var(--blue)">Module detail →</span></div></a>';
      }).join('') : '') +
      '<a href="software-module.html" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--g3)">🧩 <b>All seven modules</b><p style="font-size:12.5px;color:var(--slate);margin-top:6px">Back to the module library.</p><span style="font-size:12px;font-weight:700;color:var(--blue)">Library →</span></div></a></div>' +
      /* reverse cross-navigation: solutions running this module (v1.4.0) */
      (function () {
        var sols = (SOFTWARE.solutionDetail || []).filter(function (sd) {
          return (sd.modules || []).indexOf(m.id) > -1;
        }).map(function (sd) {
          var pm = SOFTWARE.products.filter(function (x) { return x.id === sd.id; })[0] || {};
          return '<a href="software-solution.html#' + sd.id + '" class="chip" style="font-size:12px;padding:5px 12px;text-decoration:none">' +
            (pm.icon || '📦') + ' ' + S.esc(pm.name || sd.id) + '</a>';
        }).join('');
        return sols ? '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-top:26px">' +
          '<b style="font-size:14px">📦 Solutions running this module</b>' +
          '<p style="font-size:12.5px;color:var(--slate);margin:6px 0 0">These portfolio solutions ship with ' + S.esc(m.name) + ' at their core — each opens its own deep-dive.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + sols + '</div></div>' : '';
      })() +
      '<div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap;justify-content:space-between">' +
      '<a class="btn btn-o" href="software-module.html#' + prev.id + '">← ' + S.esc(prev.name) + '</a>' +
      '<a class="btn btn-o" href="software-module.html#' + next.id + '">' + S.esc(next.name) + ' →</a></div>' +
      '</div></section>';
    // tabs
    var showTab = function (t, scrollCap) {
      root.querySelectorAll('#mtabs button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === t); });
      ['ov', 'cap', 'why'].forEach(function (k) { document.getElementById('t-' + k).hidden = (k !== t); });
      if (scrollCap > -1) {
        var card = document.getElementById('cap-' + scrollCap);
        if (card) setTimeout(function () {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.transition = 'box-shadow .4s'; card.style.boxShadow = '0 0 0 3px var(--g3)';
        }, 60);
      }
    };
    root.querySelectorAll('#mtabs button').forEach(function (b) {
      b.addEventListener('click', function () { showTab(b.getAttribute('data-t'), -1); });
    });
    root.querySelectorAll('#t-ov .chip[data-ci]').forEach(function (ch) {
      ch.addEventListener('click', function () { showTab('cap', +ch.getAttribute('data-ci')); });
    });
  }

  function render() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var i = M.findIndex(function (m) { return m.id === id; });
    if (i > -1) detail(M[i], i); else index();
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', render);
})();
