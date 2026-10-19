/* Simal Prototype — chrome: renders the V2 3-tier header + 5-zone footer into
   #chrome-top / #chrome-bot placeholders. Active nav from <body data-page>. */
(function () {
  function init() {
  // favicon (real Simal mark)
  var fav = document.createElement('link');
  fav.rel = 'icon'; fav.type = 'image/png';
  fav.href = 'assets/img/brand/favicon-32.png';
  document.head.appendChild(fav);

  var page = document.body.getAttribute('data-page') || '';
  var on = function (k) { return k === page ? ' on' : ''; };
  var u = window.S.user();

  var CATS = [
    ['internal-ssd', 'Internal SSDs', 'byCat'],
    ['portable-ssd', 'Portable SSDs', 'byCat'],
    ['memory', 'Memory (RAM)', 'byCat'],
    ['monitors', 'Monitors &amp; Displays', 'byCat'],
    ['gaming', 'Gaming', 'byCat'],
    ['accessories', 'Accessories &amp; Power', 'byCat'],
    ['laptops', 'Laptops', 'byCat']
  ];
  var catCount = {};
  (window.CATALOG || []).forEach(function (p) { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });

  var li = function (icon, label, href, desc) {
    return '<a href="' + href + '"><span class="mi">' + icon + '</span>' + label +
      (desc ? '<span class="md">' + desc + '</span>' : '') + '</a>';
  };
  var catIcon = { 'internal-ssd': '💾', 'portable-ssd': '🔌', memory: '🧠', monitors: '🖥️', gaming: '🎮', accessories: '🧰', laptops: '💻' };
  var catDesc = {
    'internal-ssd': 'Gen3 → Gen5 NVMe, up to 12,400 MB/s',
    'portable-ssd': 'Rugged external drives, USB-C',
    memory: 'DDR4 / DDR5 UDIMM & SO-DIMM',
    monitors: 'Gaming & office, up to 280 Hz',
    gaming: 'GPUs and gaming gear',
    accessories: 'Hubs, docks, chargers, cables',
    laptops: 'Business notebooks, bundling'
  };
  var megaCats = CATS.map(function (c) {
    return li(catIcon[c[0]] || '📦', c[1] + ' · ' + (catCount[c[0]] || 0), 'category.html#' + c[0], catDesc[c[0]] || 'Live SKUs with full specs');
  }).join('');
  var topBrands = (window.BRANDS || []).filter(function (b) { return b.count > 0 && b.slug !== 'other'; }).slice(0, 12);
  var megaBrands = topBrands.slice(0, 11).map(function (b) {
    var info = window.CONTENT && CONTENT.brandInfo ? CONTENT.brandInfo[b.slug] : null;
    return li('<b style="font-size:10.5px;color:var(--blue)">' + S.esc(b.name.charAt(0)) + '</b>', S.esc(b.name) + ' · ' + b.count, 'brand.html#' + b.slug, info ? info[0] : 'Authorized line');
  }).join('');
  var brandChips = (window.BRANDS || []).filter(function (b) { return b.slug !== 'other'; })
    .map(function (b) { return '<span>' + b.name + '</span>'; }).join('');
  var p510 = S.product('crucial-p510-nvme-ssd');

  var nav =
    '<div class="h2nav"><div class="wrap">' +
    '<div class="ni' + on('home') + '" tabindex="0">Home<span class="caret">▾</span>' +
    '<div class="mega"><b>Popular right now</b>' +
    li('⚡', 'New arrivals — live catalog', 'category.html', '81 SKUs, newest flagged') +
    li('🆕', 'Crucial P510 — just landed', 'product.html#crucial-p510-nvme-ssd', 'Mainstream Gen5 NVMe') +
    li('🧾', 'Build an RFQ basket', 'rfq.html', 'Quote within 1 business day') +
    li('🧑‍💻', 'Software services — UniERP', 'software.html', 'ERP · POS · AI with Unisoft') +
    li('🤝', 'Become a reseller partner', 'onboarding.html', 'Tiered program, online KYC') +
    li('🗺', 'Full site map', 'sitemap.html', 'Every page, one screen') +
    '</div></div>' +
    '<div class="ni' + on('catalog') + '" tabindex="0">Products &amp; Brands<span class="caret">▾</span>' +
    '<div class="mega"><b>Shop by category — 81 SKUs live</b>' +
    megaCats +
    li('⚖', 'Compare products', 'compare.html', 'Up to 4 SKUs side by side') +
    '<div class="mega-promo">' + (p510 && p510.img[0] ? '<img src="' + p510.img[0] + '" alt="Crucial P510">' : '') +
    '<b>★ Just landed</b><p>Crucial P510 Gen5 NVMe — now in Dubai stock.</p>' +
    '<a class="btn btn-gold" href="product.html#crucial-p510-nvme-ssd">See the SKU →</a></div>' +
    '<div class="mega-foot"><a href="category.html">All products</a><span>·</span><span>Every SKU genuine with local warranty</span></div>' +
    '</div></div>' +
    '<div class="ni' + on('brands') + '" tabindex="0">Brands<span class="caret">▾</span>' +
    '<div class="mega"><b>Authorized vendor lines — 23 brands</b>' + megaBrands +
    li('🗂', 'Brands overview', 'category.html#all', 'Browse the full A–Z') +
    '</div></div>' +
    '<div class="ni' + (page.indexOf('software') === 0 ? ' on' : '') + '" tabindex="0">Software Services<span class="caret">▾</span>' +
    '<div class="mega"><b>Software services — the Simal + Unisoft practice</b>' +
    li('🧩', 'UniERP flagship ERP', 'software-erp.html', 'Odoo 19 CE · $0 licensing · 7 modules') +
    li('🗂', 'ERP module library (7)', 'software-module.html', 'Finance → UniVAT — full detail pages') +
    li('📦', 'All products &amp; platforms (20)', 'software-products.html', '10 industry ERPs + 10 specialized systems') +
    li('🛒', 'UniPOS — multi-sector POS', 'software-products.html#unipos', 'Retail · fashion · food service') +
    li('🧾', 'UniVAT — NBR-approved VAT', 'software-products.html#univat', 'Tax automation · Peppol-ready UAE tooling') +
    li('🛠', 'Engineering services (12)', 'software-services.html', 'Custom dev · cloud · QA → data &amp; BI') +
    li('🤖', 'AI &amp; machine learning', 'software-service.html#aiml', 'ML · BI · predictive analytics') +
    li('☁️', 'Cloud &amp; DevOps', 'software-service.html#cloud', 'Migration · CI/CD · infrastructure') +
    li('🏭', 'Industries &amp; sectors (9)', 'software-industries.html', 'Healthcare → agriculture') +
    li('🏥', 'Healthcare &amp; medical', 'software-industries.html#healthcare', 'Hospital ERP · queue management') +
    li('🏦', 'Finance &amp; banking', 'software-industries.html#banking', 'Loan → custodian banking') +
    li('🧭', 'Pricing · ROI · demo', 'software.html#pricing', 'Packages, calculator, demo form') +
    '<div class="mega-promo"><b>Book an ERP demo</b><p>30 minutes, live product — no slideware.</p>' +
    '<a class="btn btn-gold" href="software.html#demo">Request demo →</a></div>' +
    '<div class="mega-foot"><a href="software.html">Software home</a><span>·</span><a href="software.html#impl">7-phase implementation</a><span>·</span><span>$0 per-user licensing, forever</span></div>' +
    '</div></div>' +
    '<div class="ni' + on('solutions') + '" tabindex="0">IT Solutions<span class="caret">▾</span>' +
    '<div class="mega"><b>Professional services — 5 flagship practices</b>' +
    CONTENT.solutions5.map(function (s) { return li(s.icon, s.t.split(' (')[0], 'solutions.html#' + s.slug, s.tag); }).join('') +
    li('📋', 'All 12 service lines', 'solutions.html#lines', 'Live from simalme.com') +
    li('🛡', 'AMC SLA tiers', 'solutions.html#amc-tiers', '1h / 4h / NBD response') +
    '</div></div>' +
    '<div class="ni' + on('partners') + '" tabindex="0">Partners<span class="caret">▾</span>' +
    '<div class="mega"><b>Partner program</b>' +
    li('🏅', 'Program &amp; tiers', 'onboarding.html#tiers', 'Authorized · Premier · Elite') +
    li('📝', 'Become a reseller — KYC wizard', 'onboarding.html', '7 steps, ≈10 min, resumable') +
    li('🔐', 'B2B portal — sign in', (u ? 'account.html' : 'login.html'), u ? 'My account' : 'One account for everything') +
    li('📦', 'Orders &amp; invoices', 'account.html', 'Unlocks on KYC approval') +
    li('🧾', 'Request a quote first', 'rfq.html', 'No account needed') +
    '</div></div>' +
    '<div class="ni' + on('insights') + '" tabindex="0">Insights<span class="caret">▾</span>' +
    '<div class="mega"><b>Resources</b>' +
    li('📰', 'Blog &amp; newsroom', 'insights.html', '10-post calendar + desk notes') +
    li('📊', 'Case studies (8)', 'resources.html#cases', '3× revenue · ERP wins') +
    li('📄', 'White papers', 'resources.html#papers', 'Gated PDF downloads') +
    li('📑', 'Product datasheets', 'resources.html#datasheets', 'Per-category PDF library') +
    li('❓', 'FAQ', 'resources.html#faq', 'What partners ask most') +
    li('🎙', 'Press room &amp; media kit', 'resources.html#press', 'Logos · bios · boilerplate') +
    '</div></div>' +
    '<div class="ni' + on('about') + '" tabindex="0">About<span class="caret">▾</span>' +
    '<div class="mega"><b>Company</b>' +
    li('🏢', 'Company overview', 'about.html', 'Independent since 2002') +
    li('👔', 'Leadership team', 'about.html#leadership', 'Board of directors') +
    li('🎯', 'Mission, vision &amp; values', 'about.html#mission', 'Why Simal exists') +
    li('🏆', 'Awards &amp; achievements', 'about.html#awards', 'HIKSEMi · TEAMGROUP 2025') +
    li('🤝', 'Why choose Simal', 'about.html#why', 'Channel advantages') +
    li('🌱', 'CSR', 'about.html#csr', 'Digital literacy · donations') +
    li('💼', 'Careers — open roles', 'careers.html', '12 live job codes') +
    li('📍', 'Contact &amp; offices', 'contact.html', '4 locations · routed desk') +
    li('🌐', 'النسخة العربية', 'ar.html', 'RTL demonstration') +
    '</div></div>' +
    '<span class="hot">★ Genuine stock · JAFZA-fulfilled · since 2002</span>' +
    '</div></div>';

  var header =
    '<header class="v2hdr" id="v2hdr">' +
    (S.ls('annDismissed', 0) ? '' :
    '<div class="annbar"><div class="wrap">' +
    '<span>⚡ Gen5 is here — Crucial P510 now in Dubai stock.</span>' +
    '<a href="product.html#crucial-p510-nvme-ssd">See the SKU &amp; RFQ channel pricing →</a>' +
    '<button class="x" id="annx" title="Dismiss" aria-label="Dismiss announcement">✕</button>' +
    '</div></div>') +
    '<div class="u2"><div class="wrap">' +
    '<div class="l"><span>☎ +971 4 393 0507</span><span>✉ info@simalme.com</span><span>🕘 Sun–Thu 9:00–18:00 GST</span></div>' +
    '<div class="r"><a class="kycl" href="' + (u ? 'account.html' : 'login.html') + '">🛡 ' + (u ? 'My account — ' + S.esc(u.name) : 'KYC Portal — Sign in') + '</a>' +
    '<span class="lng"><b>EN</b><span><a href="ar.html" style="color:inherit;text-decoration:none">العربية</a></span></span>' +
    '<span class="soc"><a href="#" title="LinkedIn">in</a><a href="#" title="Instagram">◉</a><a href="#" title="WhatsApp">✆</a></span></div>' +
    '</div></div>' +
    '<div class="h2main"><div class="wrap">' +
    '<a class="logo" href="index.html" style="gap:0;margin-right:10px"><img src="assets/img/brand/simal-logo-360w.png" alt="Simal Technologies Middle East" style="height:42px;width:auto;display:block"></a>' +
    '<label class="search2" aria-label="Site search">🔍 <input id="q" type="search" placeholder="Search 81 SKUs, brands, solutions…" autocomplete="off"><b id="qb">Search</b></label>' +
    '<div class="sp"></div>' +
    '<a href="' + (u ? 'account.html' : 'login.html') + '" class="btn btn-o btn-sm">▷ ' + (u ? 'Account' : 'Sign in') + '</a>' +
    '<a href="rfq.html" class="rfq-pill">🧾 RFQ <span class="cnt">0</span></a>' +
    '<a href="onboarding.html" class="btn btn-gold">Become a Partner</a>' +
    '</div></div>' +
    nav +
    '</header>';

  var footer =
    '<div class="f2-cta"><div class="wrap">' +
    '<div><h3>Stay ahead of the Middle East IT channel</h3><p>Monthly stock drops, vendor promotions &amp; UAE e-invoicing updates. No spam — unsubscribe anytime.</p></div>' +
    '<div class="nl"><input id="nlmail" type="email" placeholder="Work email address"><button class="btn btn-gold" id="nlbtn">Subscribe</button></div>' +
    '</div></div>' +
    '<footer class="f2-main"><div class="wrap">' +
    '<div>' +
    '<a href="index.html" style="display:inline-block;margin-bottom:16px"><img src="assets/img/brand/simal-logo-white-360w.png" alt="Simal Technologies Middle East" style="height:36px;width:auto;display:block"></a>' +
    '<p class="ent">Independent IT distribution house — authorized &amp; genuine since 2002.<br>Software services delivered with Unisoft Systems Ltd.</p>' +
    '<div class="soc"><a href="#" title="LinkedIn">in</a><a href="#" title="Instagram">◉</a><a href="#" title="WhatsApp">✆</a><a href="#" title="X">✕</a></div></div>' +
    '<div><h5>Products &amp; Brands</h5>' +
    CATS.slice(0, 5).map(function (c) { return '<a href="category.html#' + c[0] + '">' + c[1] + '</a>'; }).join('') +
    '<a href="category.html#all">All 81 SKUs</a></div>' +
    '<div><h5>Services &amp; Solutions</h5>' +
    '<a href="solutions.html">IT Solutions — 12 lines</a><a href="software.html">Software Services home</a>' +
    '<a href="software-erp.html">UniERP — Odoo 19 CE</a><a href="software-products.html">Software products (20)</a>' +
    '<a href="software-services.html">Engineering services (12)</a><a href="software-industries.html">Industry solutions (9)</a>' +
    '<a href="rfq.html">RFQ — request a quote</a><a href="onboarding.html">Become a partner</a>' +
    '<a href="' + (u ? 'account.html' : 'login.html') + '">KYC verification portal</a></div>' +
    '<div><h5>Company</h5>' +
    '<a href="about.html">About &amp; entities</a><a href="careers.html">Careers</a>' +
    '<a href="insights.html">Insights &amp; newsroom</a><a href="contact.html">Contact us</a>' +
    '<a href="ar.html">العربية (RTL)</a></div>' +
    '<div><h5>Contact</h5>' +
    '<p class="ent"><b>Head office</b>Office 201, Dar Al Riffa Bldg<br>Khalid Bin Al Waleed Rd, Bur Dubai<br>PO Box 49740, Dubai, UAE</p>' +
    '<p class="ent"><b>Warehouse</b>StarSeed ME FZE · JAFZA RA08DA07</p>' +
    '<p class="ent"><b>Sun–Thu</b>9:00–18:00 GST · ☎ +971 4 393 0507</p></div>' +
    '</div></footer>' +
    '<div class="f2-brands"><div class="wrap">' + brandChips + '</div></div>' +
    '<div class="f2-cert"><div class="wrap">' +
    '<span class="cb">📍 <b>Bur Dubai</b> office · JAFZA warehouse</span>' +
    '<span class="cb">🤝 <b>23</b> global vendor partners</span>' +
    '<span class="cb">🇦🇪 UAE <b>PDPL</b> aligned</span>' +
    '<span class="cb">🧾 <b>Peppol e-invoicing</b> ready 2027</span>' +
    '<span class="cb">✔ ISO 9001 · 27001 — <b>Unisoft Systems</b></span>' +
    '</div></div>' +
    '<div class="f2-legal"><div class="wrap">' +
    '<span>© 2026 Simal Technologies Middle East LLC · Bur Dubai, Dubai, UAE</span>' +
    '<span><a href="legal.html#privacy">Privacy Notice</a><a href="legal.html#terms">Terms of Use</a><a href="legal.html#cookies">Cookie Notice</a><a href="#">PDPL — Data Subject Rights</a><a href="sitemap.html">Sitemap</a></span>' +
    '</div></div>';

  var top = document.getElementById('chrome-top');
  var bot = document.getElementById('chrome-bot');
  if (top) top.outerHTML = header;
  if (bot) bot.outerHTML = footer;

  // announcement dismiss (remembered)
  var annx = document.getElementById('annx');
  if (annx) annx.addEventListener('click', function () {
    S.save('annDismissed', 1);
    var bar = annx.closest('.annbar');
    if (bar) bar.remove();
    S.toast('Announcement dismissed');
  });

  // sticky condensed mode: on scroll, or forced with #mini (testing/demo)
  var hdr = document.getElementById('v2hdr');
  if (hdr) {
    var setMini = function (onMode) { hdr.classList.toggle('mini', onMode); };
    if (/#mini/.test(location.hash)) setMini(true);
    window.addEventListener('scroll', function () {
      setMini(window.scrollY > 220 || /#mini/.test(location.hash));
    }, { passive: true });
    // QA mode: #megadebug (+ ?m=N) opens menu N persistently for visual inspection
    if (/#megadebug/.test(location.hash)) {
      hdr.classList.add('megadebug');
      var n = parseInt((location.search.match(/[?&]m=(\d+)/) || [0, 1])[1], 10);
      var items = hdr.querySelectorAll('.h2nav .ni');
      if (items[n - 1]) items[n - 1].classList.add('debug-open');
    }
  }

  // viewport-aware mega positioning: clamp each panel fully inside the window,
  // so right-side nav items never push their dropdown off-screen (left or right)
  function alignMegas() {
    var vw = document.documentElement.clientWidth;
    document.querySelectorAll('.h2nav .ni').forEach(function (it) {
      var mg = it.querySelector('.mega');
      if (!mg) return;
      mg.style.left = '';
      var keep = mg.style.display, keepV = mg.style.visibility;
      mg.style.visibility = 'hidden';
      if (getComputedStyle(mg).display === 'none') mg.style.display = 'grid';
      var r = it.getBoundingClientRect();
      var w = mg.offsetWidth || 880;
      mg.style.display = keep; mg.style.visibility = keepV;
      var absLeft = Math.max(10, Math.min(r.left, vw - w - 10));
      mg.style.left = Math.round(absLeft - r.left) + 'px';
    });
  }
  alignMegas();
  window.addEventListener('resize', alignMegas);

  // dropdown open/close state machine — menus must always close:
  // hover in/out is pure CSS (.ni:hover); click toggles (touch + pinning), keyboard Tab opens,
  // and Esc / outside click / focus moving away / leaving the nav strip all close everything.
  (function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('.h2nav .ni'));
    if (!items.length) return;
    var closeAll = function (except) {
      items.forEach(function (it) { if (it !== except) it.classList.remove('open'); });
    };
    var keyNav = false;    // last input from keyboard? (Tab / arrows)
    var pointerDown = false; // a pointer press caused the current focus? then don't focus-open
    document.addEventListener('keydown', function (e) {
      keyNav = (e.key === 'Tab' || e.key.indexOf('Arrow') === 0);
      if (keyNav) pointerDown = false;
      if (e.key === 'Escape') closeAll();
    });
    document.addEventListener('mousedown', function () { keyNav = false; pointerDown = true; }, true);
    items.forEach(function (it) {
      it.addEventListener('click', function (e) {
        if (e.target.closest('.mega')) return; // clicks inside the panel are normal link navigation
        var was = it.classList.contains('open');
        closeAll();
        if (!was) it.classList.add('open');
        e.preventDefault();
      });
      it.addEventListener('mouseenter', function () { closeAll(it); }); // switching items closes the previous one
      it.addEventListener('focusin', function () {
        if (pointerDown) return; // mouse-click focus: the click toggle owns open/close
        if (keyNav || it.matches(':focus-visible')) { closeAll(it); it.classList.add('open'); }
      });
      it.addEventListener('keydown', function (e) { // Enter / Space act like a click on the item label
        if (e.target !== it) return;
        if (e.key === 'Escape' && it.classList.contains('open')) { it.classList.remove('open'); e.stopPropagation(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      });
    });
    document.addEventListener('click', function (e) { // click anywhere outside the header closes
      if (!e.target.closest('.v2hdr')) closeAll();
    });
    document.addEventListener('focusin', function (e) { // focus left an open item (Tabbed past it)
      var t = e.target;
      items.forEach(function (it) { if (it.classList.contains('open') && !it.contains(t)) it.classList.remove('open'); });
    });
    var navBar = document.querySelector('.h2nav');
    if (navBar) {
      // the open panels are DOM descendants of the bar, so moving item -> panel does NOT fire this;
      // it fires only when the pointer truly leaves the whole nav (strip + open panel)
      navBar.addEventListener('mouseleave', function () { closeAll(); });
    }
  })();

  // search binding
  var q = document.getElementById('q'), qb = document.getElementById('qb');
  var go = function () { if (q.value.trim()) location.href = 'search.html#q=' + encodeURIComponent(q.value.trim()); };
  if (qb) qb.addEventListener('click', go);
  if (q) q.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  // keyboard shortcut: '/' focuses search (unless typing elsewhere)
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea|select/i.test((e.target && e.target.tagName) || '')) {
      e.preventDefault();
      if (q) { q.focus(); q.select(); }
    }
  });

  // newsletter
  var nb = document.getElementById('nlbtn');
  if (nb) nb.addEventListener('click', function () {
    var m = document.getElementById('nlmail');
    if (S.v.email(m.value)) { S.toast('Subscribed — confirmation sent to ' + m.value); m.value = ''; }
    else S.toast('Enter a valid work email', 'err');
  });

  S.syncBadge();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
