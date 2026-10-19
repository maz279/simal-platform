/* Product detail (hash-driven #slug): gallery, RFQ, and the deep-dive tab set —
   Specifications / Overview / Features & use cases / In the box & accessories /
   Documentation — plus prev/next in category, companions and recently viewed.
   Re-renders on hashchange: clicking related/paired/prev/next while already on
   the page updates it live — no dead clicks (same pattern as category/software-module). */
(function () {
  function render() {
  var slug = decodeURIComponent(location.hash.replace('#', '')) || 'crucial-t705-ssd-2';
  var p = S.product(slug);
  if (!p) {
    document.getElementById('p-name').textContent = 'Product not found';
    document.getElementById('p-desc').textContent = 'This SKU is not in the catalog. Browse all products instead.';
    return;
  }
  var cms = S.cmsFor(slug) || {};
  var deep = (window.PRODUCT_DEEP || {})[slug] || null;
  var guide = (S.catGuide || {})[p.cat] || { intro: '', points: [] };
  var bInfo = (window.CONTENT && CONTENT.brandInfo) ? CONTENT.brandInfo[p.brand] : null;
  document.title = (cms.name_en || p.name) + ' — Simal Technologies';

  document.getElementById('crumb-cat').textContent = p.catLabel || p.cat;
  document.getElementById('crumb-cat').href = 'category.html#' + p.cat;
  document.getElementById('crumb-name').textContent = (cms.name_en || p.name).slice(0, 40);
  document.getElementById('p-name').textContent = cms.name_en || p.name;
  document.getElementById('p-desc').innerHTML =
    (deep ? '<b style="color:var(--ink)">' + S.esc(deep.hero) + '</b><br>' : '') +
    S.esc(cms.desc_en || p.desc || p.short);
  document.getElementById('sku-badge').textContent = 'SKU: ' + (p.sku || '—');
  document.getElementById('stock-badge').textContent = p.stock ? 'In stock' : 'On order';
  document.getElementById('stock-badge').className = 'badge ' + (p.stock ? 'b-ok' : 'b-warn');

  // gallery
  var imgs = p.img.length ? p.img : [''];
  document.getElementById('gal').innerHTML =
    (imgs[0] ? '<img src="' + imgs[0] + '" alt="' + S.esc(p.name) + '">' : '<div style="color:var(--slate);font-size:13px">Photo on request</div>') +
    (p.new ? '<span class="badge b-red" style="position:absolute;top:14px;left:14px">NEW</span>' : '');
  document.getElementById('thumbs').innerHTML = imgs.map(function (src, i) {
    return '<img src="' + src + '" class="' + (i === 0 ? 'on' : '') + '" data-i="' + i + '" alt="view ' + (i + 1) + '">';
  }).join('');
  document.querySelectorAll('#thumbs img').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelector('#gal img').src = imgs[+t.getAttribute('data-i')];
      document.querySelectorAll('#thumbs img').forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
    });
  });

  // qty + add
  var qn = document.getElementById('q-n');

  /* ---------- left column fills (gallery-column dead space, per PDP research) ---------- */
  var glance = document.getElementById('glance');
  if (glance) {
    glance.innerHTML = '<b style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--slate-500)">At a glance</b>' +
      '<div style="margin-top:10px">' +
      (deep ? deep.specs.slice(0, 4).map(function (sp) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:7px 0;border-bottom:1px dashed var(--line-2)"><span style="color:var(--slate-500);font-size:12.5px;font-weight:600">' + S.esc(sp[0]) + '</span><b style="font-size:12.5px;text-align:right;max-width:60%">' + S.esc(sp[1]) + '</b></div>';
      }).join('') : '') +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:7px 0"><span style="color:var(--slate-500);font-size:12.5px;font-weight:600">Availability</span><b style="font-size:12.5px;color:' + (p.stock ? 'var(--ok)' : 'var(--warn)') + '">' + (p.stock ? 'In stock — JAFZA' : 'On order') + '</b></div>' +
      '</div>';
  }
  var asr = document.getElementById('assurance');
  if (asr) {
    asr.innerHTML = '<b style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--slate-500)">The Simal assurance</b>' +
      '<div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">' +
      [['✓', '100% genuine — authorized channel, no gray stock'],
       ['🛡', 'Local UAE warranty — RMA via the Dubai desk'],
       ['🚚', 'JAFZA fulfillment — typical 1–3 day UAE delivery'],
       ['🧾', 'Peppol-ready e-invoicing for B2B buyers'],
       ['💬', 'Volume tiers — quote within 1 business day']].map(function (r) {
        return '<div style="display:flex;gap:10px;align-items:flex-start"><span style="font-size:15px;width:20px;text-align:center">' + r[0] + '</span><span style="font-size:12.5px;color:var(--slate)">' + S.esc(r[1]) + '</span></div>';
      }).join('') + '</div>' +
      '<a class="btn btn-o btn-sm btn-block" style="margin-top:12px" href="contact.html?type=' + encodeURIComponent('Bulk pricing — ' + (cms.name_en || p.name)) + '">Talk to the desk about volume →</a>';
  }

  document.getElementById('q-dec').onclick = function () { qn.value = Math.max(1, (+qn.value || 1) - 1); };
  document.getElementById('q-inc').onclick = function () { qn.value = Math.min(9999, (+qn.value || 1) + 1); };
  document.getElementById('add').onclick = function () {
    S.addToBasket(slug, Math.max(1, +qn.value || 1));
  };
  var waBtn = document.getElementById('wa');
  waBtn.addEventListener('click', function (e) {
    e.preventDefault();
    waBtn.href = 'https://wa.me/971508487861?text=' +
      encodeURIComponent('Simal RFQ — ' + (cms.name_en || p.name) + ' (SKU ' + (p.sku || slug) + '), qty ' + Math.max(1, +qn.value || 1));
    window.open(waBtn.href, '_blank');
  });

  /* ---------- tab 1: specifications (deep record first, then channel facts) ---------- */
  document.getElementById('tab-specs').innerHTML =
    (deep ? deep.specs.map(function (sp) {
      return '<tr class="specrow"><td><b>' + S.esc(sp[0]) + '</b></td><td>' + S.esc(sp[1]) + '</td></tr>';
    }).join('') : '') +
    '<tr class="specrow"><td><b>Brand</b></td><td><a href="brand.html#' + p.brand + '">' + S.esc(p.brand) + '</a></td></tr>' +
    '<tr class="specrow"><td><b>SKU</b></td><td>' + S.esc(p.sku || '—') + '</td></tr>' +
    '<tr class="specrow"><td><b>Category</b></td><td><a href="category.html#' + p.cat + '" style="color:var(--blue)">' + S.esc(p.catLabel || p.cat) + '</a></td></tr>' +
    '<tr class="specrow"><td><b>Warranty</b></td><td>Local UAE warranty via Simal — RMA handled by the Dubai desk</td></tr>' +
    '<tr class="specrow"><td><b>Availability</b></td><td>' + (p.stock ? 'In stock — JAFZA fulfillment' : 'On order — typical 5–10 working days') + '</td></tr>' +
    '<tr class="specrow"><td><b>Pricing</b></td><td>Channel RFQ — volume tiers, quote ≤ 1 business day</td></tr>' +
    (p.specs || []).map(function (sp) { return '<tr class="specrow"><td>Detail</td><td>' + S.esc(sp) + '</td></tr>'; }).join('');

  /* ---------- tab 2: overview ---------- */
  document.getElementById('tab-desc').innerHTML =
    '<p style="margin:0 0 10px">' + S.esc(cms.desc_en || p.desc || p.short) + '</p>' +
    '<p style="margin:0;color:var(--slate-500);font-size:12.5px">Also available: Arabic product copy (below) via the CMS — and a full datasheet in the Documentation tab.</p>';
  document.getElementById('tab-ar').innerHTML =
    (cms.name_ar && cms.desc_ar ? '<b style="font-size:15px">' + S.esc(cms.name_ar) + '</b><br><br>' + S.esc(cms.desc_ar)
      : '<span style="font-size:13.5px;color:var(--slate)">' + S.esc('الوصف العربية لهذا المنتج متاح عبر فريق المحتوى — CMS editor يضيف الاسم والوصف العربي.') + '</span>');

  /* ---------- tab 3: features & use cases (per-product deep + category guide §03 + brand line §04) ---------- */
  document.getElementById('tab-feat').innerHTML =
    (bInfo ? '<div style="border-left:3px solid var(--g3);padding:2px 0 2px 14px;margin-bottom:14px"><b style="color:var(--blue)">' + S.esc(p.brand) + ' line:</b> ' + S.esc(bInfo[0]) + '<br><span style="font-size:12.5px;color:var(--slate-500)">' + S.esc(bInfo[1]) + '</span></div>' : '') +
    (deep ? '<div class="split" style="grid-template-columns:1fr 1fr;gap:20px;align-items:start">' +
      '<div><b style="font-size:14px">Key features</b><ul style="margin:8px 0 0;padding-left:20px">' + deep.feats.map(function (x) {
        return '<li style="font-size:13.5px;color:var(--slate);margin:6px 0">' + S.esc(x) + '</li>';
      }).join('') + '</ul></div>' +
      '<div><b style="font-size:14px">Best for</b><ul style="margin:8px 0 0;padding-left:20px">' + deep.use.map(function (x) {
        return '<li style="font-size:13.5px;color:var(--slate);margin:6px 0">' + S.esc(x) + '</li>';
      }).join('') + '</ul></div></div><div style="border-top:1px dashed var(--line-2);margin:16px 0"></div>' : '') +
    '<p style="font-size:13.5px;color:var(--slate-500);line-height:1.7;margin:0 0 8px"><b style="color:var(--slate)">About the ' + S.esc(p.catLabel || p.cat) + ' line:</b> ' + S.esc(guide.intro) + '</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' + guide.points.map(function (x) {
      return '<span class="chip" style="font-size:12px;padding:5px 12px">✓ ' + S.esc(x) + '</span>';
    }).join('') + '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<a class="btn btn-o btn-sm" href="category.html#' + p.cat + '">Compare with the category →</a>' +
    '<a class="btn btn-o btn-sm" href="brand.html#' + p.brand + '">All ' + S.esc(p.brand) + ' →</a>' +
    '<a class="btn btn-o btn-sm" href="compare.html">Side-by-side tool →</a></div>';

  /* ---------- tab 4: in the box & accessories ---------- */
  var acc = S.byCat('accessories').filter(function (x) { return x.slug !== slug; });
  acc = acc.filter(function (x) { return x.brand === p.brand; }).concat(acc.filter(function (x) { return x.brand !== p.brand; })).slice(0, 4);
  document.getElementById('tab-box').innerHTML =
    '<div class="split" style="grid-template-columns:.9fr 1.1fr;gap:18px;align-items:start">' +
    '<div><b style="font-size:14px">In the box</b><ul style="margin:8px 0 0;padding-left:20px">' +
    ['Genuine ' + S.esc(p.brand) + ' product, factory sealed', 'Simal invoice with local UAE warranty terms', 'RMA instructions for the Dubai service desk'].map(function (x) {
      return '<li style="font-size:13.5px;color:var(--slate);margin:5px 0">' + S.esc(x) + '</li>';
    }).join('') + '</ul></div>' +
    '<div><b style="font-size:14px">Frequently paired</b><div class="grid g2" style="margin-top:8px">' +
    (acc.length ? acc.map(function (x) {
      return '<a href="product.html#' + x.slug + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="padding:12px 14px;height:100%">' +
        '<span style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--slate-500);text-transform:uppercase">' + S.esc(x.brand) + '</span>' +
        '<div style="font-size:13px;font-weight:600;margin-top:3px">' + S.esc(x.name.slice(0, 64)) + '</div>' +
        '<span style="font-size:12px;font-weight:700;color:var(--blue)">View details →</span></div></a>';
    }).join('') : '<p style="font-size:13px;color:var(--slate)">Ask the desk for pairings.</p>') + '</div></div></div>';

  /* ---------- tab 5: documentation ---------- */
  document.getElementById('tab-docs').innerHTML =
    '<div class="grid g2">' +
    '<div class="card card-p"><b style="font-size:14px">📄 Datasheets &amp; spec sheets</b><p style="font-size:13px;color:var(--slate);margin:8px 0 10px">Per-category PDF library — request the sheet for this SKU and we email it the same working day.</p><a class="btn btn-p btn-sm" href="resources.html#datasheets">Open the datasheet library →</a></div>' +
    '<div class="card card-p"><b style="font-size:14px">⚖ Warranty &amp; RMA</b><p style="font-size:13px;color:var(--slate);margin:8px 0 10px">Local UAE warranty terms, genuineness policy and the RMA process through the Dubai desk.</p><a class="btn btn-o btn-sm" href="legal.html#terms">Read the terms →</a></div>' +
    '<div class="card card-p"><b style="font-size:14px">🧾 How channel buying works</b><p style="font-size:13px;color:var(--slate);margin:8px 0 10px">RFQ basket → quote within one business day → PO → JAFZA fulfillment. No account needed to start.</p><a class="btn btn-o btn-sm" href="rfq.html">Build an RFQ →</a></div>' +
    '<div class="card card-p"><b style="font-size:14px">📦 Bulk &amp; project pricing</b><p style="font-size:13px;color:var(--slate);margin:8px 0 10px">50+ unit deployments, imaging and asset tagging — talk to the distribution desk.</p><a class="btn btn-o btn-sm" href="contact.html?type=' + encodeURIComponent('Bulk pricing — ' + (cms.name_en || p.name)) + '">Talk to the desk →</a></div>' +
    '</div>';

  // tabs wiring
  document.querySelectorAll('.mini-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.mini-tabs button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      ['specs', 'desc', 'feat', 'box', 'docs'].forEach(function (t) {
        document.getElementById('tab-' + t).style.display = t === b.getAttribute('data-t') ? '' : 'none';
      });
      document.getElementById('tab-ar').style.display = b.getAttribute('data-t') === 'desc' ? '' : 'none';
    });
  });

  /* ---------- related (same brand, then category) ---------- */
  var rel = S.byBrand(p.brand).filter(function (x) { return x.slug !== slug; }).slice(0, 4);
  if (rel.length < 4) rel = rel.concat(S.byCat(p.cat).filter(function (x) { return x.slug !== slug && rel.indexOf(x) < 0; }).slice(0, 4 - rel.length));
  document.getElementById('related').innerHTML = rel.map(S.card).join('');
  S.bindCards();
  var mb = document.getElementById('more-brand');
  mb.href = 'brand.html#' + p.brand;
  mb.textContent = 'All ' + p.brand + ' products →';

  /* ---------- prev / next within category — never a dead end ---------- */
  var inCat = S.byCat(p.cat);
  var ix = inCat.findIndex(function (x) { return x.slug === slug; });
  if (ix > -1 && inCat.length > 1) {
    var prev = inCat[(ix - 1 + inCat.length) % inCat.length];
    var next = inCat[(ix + 1) % inCat.length];
    document.getElementById('pn-row').innerHTML =
      '<a class="btn btn-o" href="product.html#' + prev.slug + '">← ' + S.esc(prev.name.slice(0, 44)) + '</a>' +
      '<a class="btn btn-o" href="category.html#' + p.cat + '">' + S.esc(p.catLabel || p.cat) + ' listing</a>' +
      '<a class="btn btn-o" href="product.html#' + next.slug + '">' + S.esc(next.name.slice(0, 44)) + ' →</a>';
  }

  /* ---------- accessories section (full cards) ---------- */
  var acc2 = acc.slice(0, 4);
  if (acc2.length) {
    document.getElementById('accessories').innerHTML = acc2.map(S.card).join('');
    S.bindCards(document.getElementById('accessories'));
  } else document.getElementById('acc-head').style.display = 'none';

  /* ---------- recently viewed ---------- */
  var seen = S.recent(slug).filter(function (s) { return s !== slug; });
  var recEl = document.getElementById('recent');
  var recHtml = seen.map(function (s) { var q = S.product(s); return q ? S.card(q) : ''; }).join('');
  if (recHtml) { recEl.innerHTML = recHtml; S.bindCards(recEl); }
  else {
    var rh = recEl.previousElementSibling;
    if (rh) rh.style.display = 'none';
    recEl.style.display = 'none';
  }
  }

  render();
  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
})();
