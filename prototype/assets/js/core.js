/* Simal Prototype — core runtime (S): storage, basket, KYC applications,
   RFQ references, validators (TRN 15-digit, Peppol ID, UAE IBAN 23 w/ MOD-97),
   CMS overrides, session, toasts. FRS v1.3 field rules implemented. */
(function () {
  var S = { version: '1.0.0' };
  window.S = S;

  /* ---------- storage ---------- */
  S.ls = function (k, fb) {
    try { var v = localStorage.getItem('simal.' + k); return v ? JSON.parse(v) : fb; }
    catch (e) { return fb; }
  };
  S.save = function (k, v) {
    try { localStorage.setItem('simal.' + k, JSON.stringify(v)); } catch (e) {}
  };

  /* ---------- utils ---------- */
  S.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  S.fmtDate = function (d) {
    d = d ? new Date(d) : new Date();
    return d.toISOString().slice(0, 10);
  };
  S.uid = function (p) { return (p || 'ID') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); };

  /* ---------- RFQ basket (FRS-R) ---------- */
  S.basket = function () { return S.ls('basket', []); };
  S.basketCount = function () { return S.basket().reduce(function (a, i) { return a + (i.qty || 1); }, 0); };
  S.addToBasket = function (slug, qty) {
    var b = S.basket(), hit = null;
    b.forEach(function (i) { if (i.slug === slug) hit = i; });
    if (hit) hit.qty = Math.min(9999, hit.qty + (qty || 1));
    else b.push({ slug: slug, qty: qty || 1 });
    S.save('basket', b); S.syncBadge(); S.toast('Added to RFQ basket');
  };
  S.setQty = function (slug, qty) {
    var b = S.basket().filter(function (i) { return !(i.slug === slug && qty <= 0); });
    b.forEach(function (i) { if (i.slug === slug) i.qty = Math.min(9999, qty); });
    S.save('basket', b); S.syncBadge();
  };
  S.syncBadge = function () {
    var n = S.basketCount();
    var el = document.querySelector('.rfq-pill .cnt');
    if (el) { el.textContent = n; el.style.display = n ? 'grid' : 'grid'; }
  };
  S.rfqRef = function () {
    var c = S.ls('rfqCounter', 1000) + 1; S.save('rfqCounter', c);
    var d = new Date(), ymd = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    return 'SIMAL-RFQ-' + ymd + '-' + c;
  };
  S.rfqs = function () { return S.ls('rfqs', []); };
  S.submitRfq = function (rfq) {
    var all = S.rfqs(); rfq.ref = S.rfqRef(); rfq.at = new Date().toISOString();
    rfq.status = 'Submitted'; all.unshift(rfq); S.save('rfqs', all);
    S.save('basket', []); S.syncBadge();
    return rfq;
  };

  /* ---------- validators (FRS field rules) ---------- */
  S.v = {
    email: function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s || ''); },
    phone: function (s) { return /^\+?[\d\s()-]{7,16}$/.test(s || ''); },
    trn: function (s) { return /^\d{15}$/.test((s || '').replace(/\s/g, '')); },
    iban: function (s) {
      s = (s || '').replace(/\s/g, '').toUpperCase();
      if (!/^AE\d{21}$/.test(s)) return false;
      // MOD-97 (ISO 7064): move first 4 chars to end, A=10..Z=35
      var r = s.slice(4) + s.slice(0, 4), n = '';
      for (var i = 0; i < r.length; i++) n += /[0-9]/.test(r[i]) ? r[i] : (r.charCodeAt(i) - 55);
      var rem = 0;
      for (var j = 0; j < n.length; j++) rem = (rem * 10 + +n[j]) % 97;
      return rem === 1;
    },
    peppol: function (trn) { return '0235:' + (trn || '').replace(/\s/g, ''); },
    pwd: function (s) { return (s || '').length >= 8; }
  };
  S.ibanFix = function () { return 'AE07 0331 2345 6789 0123 456'; }; // display example

  /* ---------- session (mock auth, FRS-A) ---------- */
  S.user = function () { return S.ls('session', null); };
  S.login = function (email, name) {
    var u = { email: email, name: name || email.split('@')[0], at: new Date().toISOString() };
    S.save('session', u); return u;
  };
  S.logout = function () { localStorage.removeItem('simal.session'); location.href = 'login.html'; };

  /* ---------- KYC applications (FRS-K / FRS-RC) ---------- */
  S.apps = function () {
    var a = S.ls('apps', null);
    if (!a) { a = S.seedApps(); S.save('apps', a); }
    return a;
  };
  S.saveApp = function (app) {
    var all = S.apps(), i = all.findIndex(function (x) { return x.ref === app.ref; });
    if (i >= 0) all[i] = app; else all.unshift(app);
    S.save('apps', all);
  };
  S.myApp = function () {
    var email = S.user() && S.user().email, all = S.apps();
    for (var i = 0; i < all.length; i++) if (all[i].email === email) return all[i];
    return null;
  };
  S.seedApps = function () {
    var mk = function (ref, co, email, status, ageDays, trnOk, flagged) {
      return {
        ref: ref, company: co, email: email, status: status,
        at: new Date(Date.now() - ageDays * 864e5).toISOString(),
        sla: ageDays, trn: trnOk ? '100123456700003' : '10012345670000X',
        peppol: '0235:100123456700003',
        docs: { licence: true, passport: true, other: false },
        notes: '', flagged: flagged || []
      };
    };
    return [
      mk('KYC-2026-0141', 'Al Marri Computer Trading LLC', 'buy@almarri.ae', 'In review', 1, true, []),
      mk('KYC-2026-0140', 'Emirates Digital Systems FZE', 'it@eds.ae', 'In review', 3, true, ['trade licence expiry unclear']),
      mk('KYC-2026-0138', 'Grand PCD Trading LLC', 'purchase@grandpcd.ae', 'More info required', 6, false, ['TRN checksum mismatch', 'passport scan blurred']),
      mk('KYC-2026-0132', 'Sharjah Tech Souq', 'sales@techsouq.ae', 'Approved', 12, true, []),
      mk('KYC-2026-0129', 'Gulf Data Systems LLC', 'procurement@gds.ae', 'Approved', 21, true, []),
      mk('KYC-2026-0117', 'Microtrans LLC', 'nadeem@microtrans.ae', 'Approved', 40, true, [])
    ];
  };

  /* ---------- CMS content overrides (FRS-RC-12) ---------- */
  S.cms = function () { return S.ls('cms', {}); };
  S.cmsFor = function (slug) { return (S.cms().products || {})[slug] || null; };
  S.cmsSave = function (slug, patch) {
    var c = S.cms(); c.products = c.products || {}; c.products[slug] = Object.assign({}, c.products[slug], patch);
    S.save('cms', c);
  };

  /* ---------- catalog helpers ---------- */
  S.product = function (slug) {
    for (var i = 0; i < window.CATALOG.length; i++) if (window.CATALOG[i].slug === slug) return window.CATALOG[i];
    return null;
  };
  S.byCat = function (cat) { return window.CATALOG.filter(function (p) { return cat ? p.cat === cat : true; }); };
  S.byBrand = function (b) { return window.CATALOG.filter(function (p) { return p.brand === b; }); };
  S.img = function (p, i) { return (p.img && p.img[i || 0]) || ''; };
  S.card = function (p) {
    var badge = p.new ? '<span class="tag badge b-red">NEW</span>' : '';
    var im = S.img(p) ? '<img src="' + S.img(p) + '" alt="' + S.esc(p.name) + '" loading="lazy">' : '';
    var sku = p.sku || p.slug.slice(0, 12).toUpperCase();
    return '<div class="prod"><a class="go" href="product.html#' + p.slug + '" aria-label="View details — ' + S.esc(p.name) + '"></a>' +
      '<div class="ph' + (im ? ' has-img' : '') + '">' + im +
      '<span class="sk">' + S.esc(sku) + '</span>' + badge + '</div>' +
      '<div class="pb"><span class="cat">' + S.esc(p.brand) + ' · ' + S.esc(p.catLabel || p.cat) + '</span>' +
      '<h4><a href="product.html#' + p.slug + '" style="color:inherit;text-decoration:none">' + S.esc(p.name) + '</a></h4>' +
      '<span class="meta">' + S.esc(p.short || '') + '</span>' +
      '<span class="vd">View details →</span>' +
      '<div class="pr"><span class="price">RFQ · no list price</span>' +
      '<button class="btn btn-sm btn-p add-rfq" data-slug="' + p.slug + '">Add to RFQ</button>' +
      '</div></div></div>';
  };
  S.bindCards = function (root) {
    (root || document).querySelectorAll('.add-rfq').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); S.addToBasket(b.getAttribute('data-slug'), 1);
      });
    });
  };

  /* ---------- category buying guides (content package §03-03…07, condensed) ---------- */
  S.catGuide = {
    'internal-ssd': { intro: 'From next-generation NVMe SSDs to proven SATA drives — the building blocks of modern computing, sourced directly from authorized manufacturers including Crucial, HIKVISION and TEAMGROUP.', points: ['PCIe Gen3 → Gen5 NVMe, up to 12,400 MB/s read', 'Genuine manufacturer stock with local UAE warranty', 'Volume channel pricing via RFQ — tiers for resellers'] },
    'portable-ssd': { intro: 'Rugged, pocket-sized external drives from Samsung, SanDisk, Crucial and Kingston — USB-C speed for creators, field teams and backups.', points: ['Up to 2TB pocket storage, USB 3.2 / Gen2 speeds', 'IP-rated rugged models for site work', 'Bundle options with UGREEN hubs and cables'] },
    'memory': { intro: 'DDR4 and DDR5 UDIMM/SO-DIMM modules from Crucial and Kingston — plug-and-play upgrades tested across Intel and AMD platforms.', points: ['DDR5 up to 5,600+ MT/s · DDR4 up to 3,200 MT/s', 'XMP 2.0/3.0 profiles, non-ECC desktop and laptop', 'Micron manufacturing behind every Crucial module'] },
    'monitors': { intro: 'KOORUI and Aiwa displays covering gaming, professional and everyday productivity — color-accurate panels up to 280 Hz refresh.', points: ['FHD → QHD, 75–280 Hz, FreeSync support', 'VESA-mount ready slim designs', 'Fleet pricing for office rollouts'] },
    'gaming': { intro: 'ARKTEK, MSI and Zotac graphics plus Aiwa gaming monitors — the GPU and display pairing for builders and eSports cafés.', points: ['GT 1030 → RTX-class GPU options', 'Low-profile cards for SFF builds', 'Monitor + GPU bundle quotes on request'] },
    'accessories': { intro: 'UGREEN hubs, docks and cables plus Honeywell surge protection — the everyday carry of every workstation and meeting room.', points: ['USB-C multiports, PD charging, HDMI/Ethernet adapters', 'X3 MOV surge protection with USB charging', 'Bundled pricing for 50+ unit deployments'] },
    'laptops': { intro: 'Dell, HP and Lenovo business notebooks — procured to spec with genuine Windows licensing and Simal deployment support.', points: ['Core i3 → i7 vPro options for fleets', 'Configured to requirement (RAM/SSD upgrades)', 'Invoice, imaging and asset tagging via the Dubai desk'] }
  };

  /* ---------- recently viewed (depth-navigation aid across product pages) ---------- */
  S.recent = function (slug) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem('simal.recent') || '[]'); } catch (e) {}
    if (slug) {
      list = list.filter(function (s) { return s !== slug; });
      list.unshift(slug);
      list = list.slice(0, 8);
      try { localStorage.setItem('simal.recent', JSON.stringify(list)); } catch (e) {}
    }
    return list;
  };

  /* ---------- search (FRS-SR: substring + brand/cat + typo-tolerant token start) ---------- */
  S.search = function (q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return [];
    var score = function (p) {
      var name = (p.name + ' ' + p.sku + ' ' + p.brand + ' ' + (p.catLabel || '') + ' ' + p.short).toLowerCase();
      if (name.indexOf(q) === 0) return 100;
      if (p.name.toLowerCase().indexOf(q) > -1) return 80;
      if (p.sku && p.sku.toLowerCase().indexOf(q) > -1) return 70;
      if (name.indexOf(q) > -1) return 50;
      // typo tolerance: token startsWith
      var toks = q.split(/\s+/);
      var hit = toks.every(function (t) {
        return name.split(/\s+/).some(function (w) { return w.slice(0, t.length) === t || t.slice(0, w.length) === w; });
      });
      return hit ? 25 : 0;
    };
    return window.CATALOG.map(function (p) { return { p: p, s: score(p) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.p; });
  };

  /* ---------- toast ---------- */
  S.toast = function (msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' toast-err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('in'); }, 10);
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  };
})();
