/* Article page: #slug from window.INSIGHTS (13 articles, full bodies).
   Research-informed layout (B2B blog 2026): sticky TOC sidebar, scannable H2s,
   category taxonomy, related posts, prev/next chain, inline CTA per article. */
(function () {
  var root = document.getElementById('art-root');
  var M = window.INSIGHTS || [];
  var current = null;

  function esc(s) { return S.esc(s); }
  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function slugify(h) {
    return 's' + String(h).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  }

  function card(a) {
    return '<a href="insight.html#' + a.slug + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="height:100%;border-top:4px solid var(--blue)">' +
      '<span class="chip" style="font-size:10.5px;font-weight:800;letter-spacing:.08em">' + esc(a.cat) + '</span>' +
      '<b style="display:block;font-size:14.5px;margin-top:8px;line-height:1.4">' + esc(a.t) + '</b>' +
      '<p style="font-size:12.5px;color:var(--slate);margin:7px 0 0;line-height:1.55">' + esc(a.x.slice(0, 100)) + '…</p>' +
      '<span style="font-size:11.5px;color:var(--slate-500);display:block;margin-top:8px">' + fmtDate(a.at) + ' · ' + a.mins + ' min read</span></div></a>';
  }

  function render() {
    var slug = decodeURIComponent(location.hash.replace('#', ''));
    var i = M.findIndex(function (a) { return a.slug === slug; });
    if (i < 0) {
      if (current) return;
      document.title = 'Insight — Simal Technologies';
      root.innerHTML = '<section class="sec"><div class="wrap"><div class="empty">Unknown article. <a href="insights.html">Back to Insights &amp; Newsroom →</a></div></div></section>';
      return;
    }
    current = slug;
    var a = M[i];
    var prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    var sameCat = M.filter(function (x) { return x.cat === a.cat && x.slug !== a.slug; });
    var relList = (a.rel || []).map(function (r) {
      return M.filter(function (x) { return x.slug === r; })[0];
    }).filter(Boolean);
    while (relList.length < 3 && sameCat.length) relList.push(sameCat.shift());
    relList = relList.slice(0, 3);

    document.title = a.t + ' — Simal Technologies';
    root.innerHTML =
      /* ---------- ARTICLE HERO ---------- */
      '<section class="hero" style="padding:0"><div class="wrap" style="padding:44px 28px 38px;grid-template-columns:1fr">' +
      '<div style="max-width:860px">' +
      '<div class="crumbs"><a href="index.html">Home</a> › <a href="insights.html">Insights &amp; Newsroom</a> › <a href="insights.html#cat-' + esc(a.cat) + '">' + esc(a.cat) + '</a> › <b>' + esc(a.t.slice(0, 40)) + '…</b></div>' +
      '<span class="chip" style="font-size:10.5px;font-weight:800;letter-spacing:.1em">' + esc(a.cat) + '</span>' +
      '<h1 style="font-size:31px;margin-top:12px;line-height:1.25">' + esc(a.t) + '</h1>' +
      '<p class="lead" style="color:var(--slate);margin-top:12px;max-width:760px">' + esc(a.x) + '</p>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap">' +
      '<div class="avatar" style="width:34px;height:34px;font-size:13px">' + esc(a.author[0]) + '</div>' +
      '<b style="font-size:13.5px">' + esc(a.author) + '</b>' +
      '<span style="font-size:12.5px;color:var(--slate-500)">' + fmtDate(a.at) + ' · ' + a.mins + ' min read' + (a.tags && a.tags.length ? ' · ' + a.tags.map(esc).join(' · ') : '') + '</span></div></div>' +
      '</div></section>' +

      /* ---------- BODY + STICKY TOC ---------- */
      '<section class="sec" style="padding-top:26px"><div class="wrap">' +
      '<div style="display:grid;grid-template-columns:230px 1fr;gap:36px;align-items:start">' +
      '<aside class="art-toc" style="position:sticky;top:96px">' +
      '<b style="font-size:11.5px;letter-spacing:.1em;color:var(--slate-500)">ON THIS PAGE</b>' +
      '<div style="display:grid;gap:7px;margin-top:10px;border-left:2px solid var(--line);padding-left:12px">' +
      a.body.map(function (sec) {
        return '<a href="#' + slugify(sec[0]) + '" style="font-size:12.5px;color:var(--slate);text-decoration:none;line-height:1.45">' + esc(sec[0]) + '</a>';
      }).join('') + '</div>' +
      '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">' +
      '<a class="btn btn-p btn-sm" style="display:block;text-align:center" href="' + (a.cta ? a.cta[1] : 'contact.html') + '">' + (a.cta ? esc(a.cta[0]) : 'Talk to the desk') + ' →</a></div>' +
      '</aside>' +
      '<article style="max-width:760px" id="art-body">' +
      a.body.map(function (sec) {
        return '<h2 id="' + slugify(sec[0]) + '" style="font-size:21px;margin:30px 0 10px;scroll-margin-top:92px">' + esc(sec[0]) + '</h2>' +
          sec[1].map(function (p) {
            return '<p style="font-size:15px;line-height:1.8;color:var(--slate);margin:0 0 14px">' + esc(p) + '</p>';
          }).join('');
      }).join('') +
      /* inline CTA after body */
      '<div style="background:#F4F7FB;border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-top:28px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
      '<div><b style="font-size:15px">Put this into practice.</b>' +
      '<p style="font-size:13px;color:var(--slate);margin:4px 0 0">The desk behind this article ships the stock, scopes the software and runs the SLAs.</p></div>' +
      '<a class="btn btn-p" href="' + (a.cta ? a.cta[1] : 'contact.html') + '">' + (a.cta ? esc(a.cta[0]) : 'Contact the desk') + ' →</a></div>' +
      '</article></div>' +

      /* ---------- PREV / NEXT ---------- */
      '<div style="display:flex;gap:12px;margin-top:34px;flex-wrap:wrap;justify-content:space-between;align-items:stretch">' +
      '<a class="btn btn-o" style="max-width:31%;text-align:left" href="insight.html#' + prev.slug + '">← ' + esc(prev.t.slice(0, 34)) + '…</a>' +
      '<a class="btn btn-o" href="insights.html">All articles</a>' +
      '<a class="btn btn-o" style="max-width:31%;text-align:right" href="insight.html#' + next.slug + '">' + esc(next.t.slice(0, 34)) + '… →</a></div>' +
      '<p style="font-size:12px;color:var(--slate-500);margin-top:8px;text-align:center">Article ' + (i + 1) + ' of ' + M.length + ' in the library.</p>' +
      '</div></section>' +

      /* ---------- RELATED ---------- */
      '<section class="sec" style="background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap">' +
      '<div class="sec-head"><div><span class="eyebrow">keep reading</span><h2 style="font-size:22px">Related insights</h2></div>' +
      '<a class="btn btn-o btn-sm" href="insights.html">Browse all 14 →</a></div>' +
      '<div class="grid g3">' + relList.map(card).join('') + '</div>' +
      '</div></section>' +

      /* ---------- NEWSLETTER ---------- */
      '<section class="sec"><div class="wrap" style="max-width:720px;text-align:center">' +
      '<h2 style="font-size:22px">Get the next one by email</h2>' +
      '<p style="font-size:14px;color:var(--slate);margin:8px auto 16px">Channel briefs, compliance countdowns and product landings — the desk writes when there is something to say.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<input id="a-mail" type="email" placeholder="work@email.com" style="border:1.5px solid var(--line);border-radius:11px;padding:12px 16px;font:inherit;width:280px;outline:none">' +
      '<button class="btn btn-p" id="a-go">Subscribe</button></div>' +
      '<p style="font-size:11.5px;color:var(--slate-500);margin-top:10px">Double opt-in. Unsubscribe anytime. See the <a href="legal.html#Privacy Policy" style="color:var(--blue)">privacy policy</a>.</p>' +
      '</div></section>';

    var go = document.getElementById('a-go');
    if (go) go.addEventListener('click', function () {
      var m = document.getElementById('a-mail').value.trim();
      if (!S.v.email(m)) return S.toast('Enter a valid work email', 'err');
      var n = S.ls('newsletter', []); n.unshift({ email: m, at: new Date().toISOString() }); S.save('newsletter', n);
      S.toast('Subscribed — double opt-in sent to ' + m);
      document.getElementById('a-mail').value = '';
    });
    window.scrollTo(0, 0);
  }
  render();
  window.addEventListener('hashchange', function () {
    var slug = decodeURIComponent(location.hash.replace('#', ''));
    if (M.some(function (a) { return a.slug === slug; })) render();
  });
})();
