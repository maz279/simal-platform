/* Home page logic: mini basket, trending (data-driven), testimonial rotator, insights */
(function () {
  // first visit: seed a demo basket so the hero card shows real product thumbnails
  try {
    if (localStorage.getItem('simal.basket') === null) {
      S.save('basket', [
        { slug: 'crucial-t705-ssd-2', qty: 25 },
        { slug: 'crucial-ddr5-pro-memory', qty: 60 },
        { slug: 'ugreen-5-in-1-usb-c-hub', qty: 40 }
      ]);
    }
  } catch (e) {}

  // hero search
  var hq = document.getElementById('hq');
  var go = function () { if (hq.value.trim()) location.href = 'search.html#q=' + encodeURIComponent(hq.value.trim()); };
  document.getElementById('hqb').addEventListener('click', go);
  hq.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });

  // mini basket (with real product thumbnails)
  function renderMini() {
    var b = S.basket(), box = document.getElementById('mini-basket');
    var n = b.reduce(function (a, i) { return a + i.qty; }, 0);
    document.getElementById('mini-count').textContent = n + (n === 1 ? ' item' : ' items');
    if (!b.length) {
      box.innerHTML = '<div class="row"><span style="color:#9FB1C6">Basket is empty — add SKUs from the catalog</span><b></b></div>';
      return;
    }
    box.innerHTML = b.slice(0, 4).map(function (i) {
      var p = S.product(i.slug) || {};
      var th = p.img && p.img[0] ? '<img src="' + p.img[0] + '" alt="" style="width:42px;height:34px;object-fit:contain;background:rgba(255,255,255,.9);border-radius:8px;padding:2px;flex:none">' : '';
      return '<div class="row">' + th + '<span style="flex:1;padding-left:' + (th ? 10 : 0) + 'px">' + S.esc((p.name || i.slug).slice(0, 44)) + '</span><b>× ' + i.qty + '</b></div>';
    }).join('') + (b.length > 4 ? '<div class="row"><span>+' + (b.length - 4) + ' more…</span><b></b></div>' : '') +
      '<div class="row"><span>Response SLA</span><b>≤ 1 business day</b></div>';
  }
  renderMini();
  window.addEventListener('hashchange', renderMini);

  // dual-business card imagery (real mirror photos)
  var duo = [['duo-img-1', 'crucial-t705-ssd-2'], ['duo-img-2', 'koorui-27-inch-gaming-monitor'], ['duo-img-3', 'ugreen-5-in-1-usb-c-hub']];
  duo.forEach(function (d) {
    var el = document.getElementById(d[0]);
    var p = S.product(d[1]);
    if (el && p && p.img[0]) el.src = p.img[0]; else if (el) el.remove();
  });

  // hero carousel — 5 elegant full-bleed slides (Redington-grade visuals): mesh-gradient
  // or blurred-photo backdrops, Ken Burns drift, geometric motifs, grain, staggered
  // content entrances; numbered tick indicators + bottom progress line.
  var GRAIN = '<div class="h5-grain"></div>';
  var VIGN = '<div class="h5-vignette"></div>';
  var MOTIF = {
    grid: '<div class="h5-motif" style="background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns=&apos;http://www.w3.org/2000/svg&apos; width=&apos;72&apos; height=&apos;72&apos;><path d=&apos;M72 0H0V72&apos; fill=&apos;none&apos; stroke=&apos;rgba(255,255,255,0.10)&apos; stroke-width=&apos;1&apos;/></svg>&quot;)"></div>',
    arcs: '<div class="h5-motif" style="background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns=&apos;http://www.w3.org/2000/svg&apos; width=&apos;420&apos; height=&apos;420&apos;><g fill=&apos;none&apos; stroke=&apos;rgba(255,255,255,0.09)&apos; stroke-width=&apos;1&apos;><circle cx=&apos;210&apos; cy=&apos;210&apos; r=&apos;90&apos;/><circle cx=&apos;210&apos; cy=&apos;210&apos; r=&apos;140&apos;/><circle cx=&apos;210&apos; cy=&apos;210&apos; r=&apos;190&apos;/></g></svg>&quot;);background-size:420px;background-position:82% 120%"></div>',
    rings: '<div class="h5-motif" style="background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns=&apos;http://www.w3.org/2000/svg&apos; width=&apos;520&apos; height=&apos;260&apos;><g fill=&apos;none&apos; stroke=&apos;rgba(255,255,255,0.08)&apos; stroke-width=&apos;1&apos;><circle cx=&apos;130&apos; cy=&apos;130&apos; r=&apos;40&apos;/><circle cx=&apos;130&apos; cy=&apos;130&apos; r=&apos;70&apos;/><circle cx=&apos;130&apos; cy=&apos;130&apos; r=&apos;100&apos;/><circle cx=&apos;390&apos; cy=&apos;130&apos; r=&apos;55&apos;/><circle cx=&apos;390&apos; cy=&apos;130&apos; r=&apos;95&apos;/></g></svg>&quot;);background-size:520px;background-position:78% 82%"></div>',
    dots: '<div class="h5-motif" style="background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns=&apos;http://www.w3.org/2000/svg&apos; width=&apos;46&apos; height=&apos;46&apos;><circle cx=&apos;4&apos; cy=&apos;4&apos; r=&apos;1.6&apos; fill=&apos;rgba(233,216,170,0.22)&apos;/><circle cx=&apos;27&apos; cy=&apos;4&apos; r=&apos;1.6&apos; fill=&apos;rgba(233,216,170,0.13)&apos;/><circle cx=&apos;4&apos; cy=&apos;27&apos; r=&apos;1.6&apos; fill=&apos;rgba(233,216,170,0.13)&apos;/><circle cx=&apos;27&apos; cy=&apos;27&apos; r=&apos;1.6&apos; fill=&apos;rgba(233,216,170,0.22)&apos;/></svg>&quot;);background-size:46px;background-position:80% 30%"></div>'
  };
  var HERO5 = [
    { kick: 'Gen5 storage · in Dubai stock', h: 'The Gen5 era is here.', s: 'Crucial T705 and P510 — flagship and mainstream PCIe Gen5 drives, genuine units fulfilled from JAFZA with channel pricing by RFQ.', cta: 'Shop Gen5 storage', href: 'category.html#internal-ssd', slug: 'crucial-t705-ssd-2',
      bg: 'radial-gradient(90% 120% at 18% 20%,#1E5EA0 0%,rgba(30,94,160,0) 55%),radial-gradient(70% 90% at 85% 80%,#0B2C4E 0%,rgba(11,44,78,0) 60%),linear-gradient(118deg,#050F1D 0%,#081C33 58%,#0C2B4C 100%)', motif: MOTIF.grid, photo: 'right' },
    { kick: 'Authorized distribution · 23 brands', h: 'Genuine stock. Local warranty. Zero gray-market risk.', s: 'Every SKU serialized, every unit under manufacturer warranty with local RMA — the real cost of 12% cheaper gray accessories is a 3× failure tail.', cta: 'Browse the catalog', href: 'category.html', slug: 'koorui-27-inch-gaming-monitor',
      bg: 'radial-gradient(80% 110% at 82% 18%,#155787 0%,rgba(21,87,135,0) 55%),radial-gradient(60% 80% at 12% 85%,#0A2038 0%,rgba(10,32,56,0) 60%),linear-gradient(118deg,#07142A 0%,#0A2238 55%,#0D3352 100%)', motif: '', photo: 'left' },
    { kick: 'New business line · 2026 · with Unisoft', h: 'Enterprise software, $0 per-user licensing.', s: 'UniERP on Odoo 19 Community Edition — 20 products & platforms, 12 engineering services, 9 industry verticals, delivered by Simal + Unisoft Systems.', cta: 'Explore software services', href: 'software.html',
      bg: 'radial-gradient(70% 100% at 84% 12%,rgba(198,146,41,.34) 0%,rgba(198,146,41,0) 55%),radial-gradient(80% 110% at 14% 30%,#54203A 0%,rgba(84,32,58,0) 60%),linear-gradient(118deg,#1B0A16 0%,#351227 52%,#4A1E33 100%)', motif: MOTIF.arcs, photo: 'none' },
    { kick: 'AMC · SLA in the contract', h: '1-hour response. 24×7×365. On your critical assets.', s: 'Three AMC tiers — Basic NBD, Standard 4h, Premium 1h with unlimited on-site visits — JAFZA-held spare pools and SLA performance reported every period.', cta: 'See the SLA tiers', href: 'it-solution.html#amc',
      bg: 'radial-gradient(75% 100% at 80% 16%,rgba(198,146,41,.26) 0%,rgba(198,146,41,0) 55%),radial-gradient(80% 110% at 16% 36%,#0C4A34 0%,rgba(12,74,52,0) 60%),linear-gradient(118deg,#03150F 0%,#062819 55%,#0A3D2A 100%)', motif: MOTIF.rings, photo: 'none' },
    { kick: 'UAE e-invoicing · 1 Jan 2027', h: 'Peppol-ready before the mandate.', s: 'UniVAT — born NBR-approved with direct government integration — carries Peppol-ready tooling so the 2027 switch-on is configuration, not construction.', cta: 'Start your countdown', href: 'software-solution.html#univat',
      bg: 'radial-gradient(85% 110% at 78% 22%,rgba(214,168,68,.38) 0%,rgba(214,168,68,0) 52%),radial-gradient(70% 90% at 14% 78%,#16304F 0%,rgba(22,48,79,0) 60%),linear-gradient(118deg,#070E1B 0%,#0C1D35 55%,#14294A 100%)', motif: MOTIF.dots, photo: 'none' }
  ];
  var stage = document.getElementById('hero5-stage');
  if (stage) {
    var h5i = 0, H5MS = 6500, h5timer = null, h5paused = false;
    function h5photo(s) {
      if (s.photo === 'none' || !s.slug) return '';
      var p = S.product(s.slug);
      if (!p || !p.img[0]) return '';
      var blur = '<img class="h5-bgimg" src="' + p.img[0] + '" alt="" style="filter:blur(30px) brightness(.44) saturate(1.15);transform:scale(1.25)" aria-hidden="true">';
      var sharp = '<div style="position:absolute;top:0;bottom:0;' + (s.photo === 'right' ? 'right:0;width:44%;' : 'left:0;width:40%;') + 'display:grid;place-items:center;padding:36px 52px;z-index:1">' +
        '<img src="' + p.img[0] + '" alt="' + S.esc(p.name) + '" style="max-width:86%;max-height:66%;object-fit:contain;filter:drop-shadow(0 30px 60px rgba(2,8,16,.6))"></div>';
      return blur + sharp;
    }
    stage.innerHTML = HERO5.map(function (s, i) {
      return '<div class="h5-slide' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" style="background:' + s.bg + '">' + h5photo(s) +
        (s.motif || '') + GRAIN + VIGN +
        '<div class="h5-content" style="' + (s.photo === 'left' ? 'margin-left:auto;' : '') + '">' +
        '<div class="h5-rule"></div>' +
        '<span class="h5-kick">' + S.esc(s.kick) + '</span>' +
        '<h1>' + S.esc(s.h) + '</h1>' +
        '<p class="h5-sub">' + S.esc(s.s) + '</p>' +
        '<div class="h5-cta cta" style="margin-top:22px"><a class="btn btn-lg btn-gold" href="' + s.href + '">' + S.esc(s.cta) + ' →</a>' +
        '<a class="btn btn-lg btn-o" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)" href="rfq.html">Request a quote</a></div></div></div>';
    }).join('') +
      '<button class="h5-arrow l" id="h5-prev" aria-label="Previous slide">‹</button>' +
      '<button class="h5-arrow r" id="h5-next" aria-label="Next slide">›</button>' +
      '<div class="h5-bar"><div style="display:flex;gap:20px;align-items:flex-end">' + HERO5.map(function (_, j) {
        var n = ('0' + (j + 1)).slice(-2);
        return '<span class="h5-dot' + (j === 0 ? ' on' : '') + '" data-i="' + j + '"><b>' + n + '</b><span class="fill"></span></span>';
      }).join('') + '</div><span class="h5-count">1 / ' + HERO5.length + '</span></div>' +
      '<div class="h5-prog"><i></i></div>';

    function h5fill(i, animate) {
      var fill = stage.querySelector('.h5-dot.on .fill');
      var prog = stage.querySelector('.h5-prog i');
      [fill, prog].forEach(function (el) {
        if (!el) return;
        el.style.transition = 'none'; el.style.width = '0';
        if (animate !== false) {
          void el.offsetWidth;
          el.style.transition = 'width ' + H5MS + 'ms linear';
          el.style.width = '100%';
        }
      });
    }
    function h5show(i) {
      h5i = (i + HERO5.length) % HERO5.length;
      stage.querySelectorAll('.h5-slide').forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-i') === h5i); });
      stage.querySelectorAll('.h5-dot').forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-i') === h5i); });
      var c = stage.querySelector('.h5-count'); if (c) c.textContent = (h5i + 1) + ' / ' + HERO5.length;
      h5fill(h5i, !h5paused);
    }
    function h5play() { h5stop(); h5fill(h5i, true); h5timer = setInterval(function () { h5show(h5i + 1); }, H5MS); }
    function h5stop() { if (h5timer) clearInterval(h5timer); h5timer = null; }
    stage.querySelector('#h5-prev').addEventListener('click', function () { h5show(h5i - 1); h5play(); });
    stage.querySelector('#h5-next').addEventListener('click', function () { h5show(h5i + 1); h5play(); });
    stage.querySelectorAll('.h5-dot').forEach(function (d) {
      d.addEventListener('click', function () { h5show(+d.getAttribute('data-i')); h5play(); });
    });
    stage.addEventListener('mouseenter', function () { h5paused = true; h5stop(); h5fill(h5i, false); });
    stage.addEventListener('mouseleave', function () { h5paused = false; h5play(); });
    // swipe
    var h5x0 = null;
    stage.addEventListener('pointerdown', function (e) { h5x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (h5x0 === null) return;
      var dx = e.clientX - h5x0; h5x0 = null;
      if (Math.abs(dx) > 44) { h5show(h5i + (dx < 0 ? 1 : -1)); h5play(); }
    });
    h5play();
  }

  // counters (content package: 300+ employees added)
  document.getElementById('cred-strip').innerHTML = CONTENT.counters.map(function (c) {
    var num = c[0].replace('+', '');
    return '<div class="c"><span class="n">' + num + (c[0].indexOf('+') > -1 ? '<b>+</b>' : '') + '</span><span class="l">' + c[1] + '</span></div>';
  }).join('');

  // featured products strip (content §3: 12 named SKUs)
  var strip = document.getElementById('featured-strip');
  strip.innerHTML = CONTENT.featured12.map(function (slug) {
    var p = S.product(slug);
    return p ? '<div style="flex:0 0 258px">' + S.card(p) + '</div>' : '';
  }).join('');
  S.bindCards(strip);

  // brand showcase (content §4: 4 themed rows)
  var slugOf = { Crucial: 'crucial', Hikvision: 'hikvision', Samsung: 'samsung', Kingston: 'kingston', SanDisk: 'sandisk', WD: 'wd', TeamGroup: 'teamgroup', Toshiba: 'toshiba', Arktek: 'arktek', MSI: 'msi', Zotac: 'zotac', PNY: 'pny', Dell: 'dell', HP: 'hp', Lenovo: 'lenovo', UGREEN: 'ugreen', Honeywell: 'honeywell', KOORUI: 'koorui', Aiwa: 'aiwa', Nearity: 'nearity' };
  document.getElementById('brand-rows').innerHTML = CONTENT.brandRows.map(function (row) {
    return '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;flex-wrap:wrap">' +
      '<span style="width:172px;font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--slate)">' + row[0] + '</span>' +
      '<div style="display:flex;gap:9px;flex-wrap:wrap">' + row[1].map(function (b) {
        return '<a href="brand.html#' + (slugOf[b] || b.toLowerCase()) + '" class="chip" style="font-size:13px;padding:8px 16px;background:#fff;border:1px solid var(--line)">' + b + '</a>';
      }).join('') + '</div></div>';
  }).join('') + '<span class="note">+ Inno3D and more lines on request — <a href="contact.html" style="color:var(--blue)">ask the brand desk</a></span>';

  // testimonial rotator (real mirror quotes, initials avatar)
  var ti = 0;
  function showT(i) {
    var t = TESTIMONIALS[i];
    var initials = t.name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('tst-name').textContent = t.name + ' · ' + t.role;
    document.getElementById('tst-quote').textContent = '\u201C' + t.q + '\u201D';
    var av = document.getElementById('tst-av');
    if (av) av.textContent = initials;
    document.getElementById('tst-dots').innerHTML = TESTIMONIALS.map(function (_, j) {
      return '<span style="width:9px;height:9px;border-radius:50%;cursor:pointer;background:' + (j === i ? 'var(--g2)' : '#2C4159') + '" data-i="' + j + '"></span>';
    }).join('');
    document.querySelectorAll('#tst-dots span').forEach(function (d) {
      d.addEventListener('click', function () { ti = +d.getAttribute('data-i'); showT(ti); });
    });
  }
  showT(0);
  setInterval(function () { ti = (ti + 1) % TESTIMONIALS.length; showT(ti); }, 7000);

  // insights preview (real product-photo covers)
  var COVERS = {
    'top-ssds-for-resellers-2025': 'crucial-t705-ssd-2',
    'crucial-p510-launch': 'crucial-p510-nvme-ssd',
    'ugreen-authorized-distributor-in-uae': 'ugreen-5-in-1-usb-c-hub'
  };
  document.getElementById('home-insights').innerHTML = INSIGHTS.slice(0, 3).map(function (a) {
    var cp = S.product(COVERS[a.slug] || '');
    var cover = cp && cp.img[0] ? cp.img[0] : '';
    return '<div class="card" style="overflow:hidden">' +
      (cover ? '<div style="height:120px;background:#fff;display:grid;place-items:center;border-bottom:1px solid var(--line)"><img src="' + cover + '" alt="" style="max-height:104px;max-width:86%;object-fit:contain"></div>' : '') +
      '<div class="card-p" style="padding:14px 16px"><span class="badge b-line">' + a.cat + ' · ' + a.mins + ' MIN</span>' +
      '<h4 style="font-size:15px;margin:9px 0 6px"><a href="insight.html#' + a.slug + '" style="color:inherit;text-decoration:none">' + S.esc(a.t) + '</a></h4>' +
      '<p style="font-size:12.5px;color:var(--slate)">' + S.esc(a.x) + '</p>' +
      '<a href="insight.html#' + a.slug + '" style="font-size:12.5px;font-weight:700;color:var(--blue)">Read the article →</a></div></div>';
  }).join('');
})();
