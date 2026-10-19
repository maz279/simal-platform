/* Visual site map: generated from catalog + content data */
(function () {
  var cats = ['internal-ssd', 'portable-ssd', 'memory', 'monitors', 'gaming', 'accessories', 'laptops'];
  var catNames = { 'internal-ssd': 'Internal SSDs', 'portable-ssd': 'Portable SSDs', memory: 'Memory (RAM)', monitors: 'Monitors & Displays', gaming: 'Gaming', accessories: 'Accessories & Power', laptops: 'Laptops' };
  var catCount = {};
  CATALOG.forEach(function (p) { catCount[p.cat] = (catCount[p.cat] || 0) + 1; });

  var sections = [
    ['🛍 Products & Catalog', '81 live SKUs ported from the mirror — 7 categories, faceted listing with sort & pagination', [
      ['Catalog home', 'category.html', 'All 81 SKUs · facets · sort'],
      ['Product detail (any SKU)', 'product.html#crucial-t705-ssd-2', 'Gallery · specs · RFQ · 81 via #slug'],
      ['Site search', 'search.html#q=ssd', 'Typo-tolerant, ranked'],
      ['Brand landings', 'brand.html#crucial', '18 brands · live counts']
    ].concat(cats.map(function (c) { return [catNames[c] + ' (' + (catCount[c] || 0) + ')', 'category.html#' + c, 'Category listing']; }))],
    ['🏢 Company', 'About, leadership, values, CSR, careers, contact', [
      ['About / overview & entities', 'about.html', 'Independent since 2002'],
      ['Mission, vision & values', 'about.html#mission', 'Content §02-03'],
      ['Leadership (board)', 'about.html#leadership', '3 board members listed'],
      ['Why choose Simal', 'about.html#why', 'Channel advantages'],
      ['CSR', 'about.html#csr', 'Digital literacy · donations'],
      ['Careers', 'careers.html', '8 departments · Dubai + Dhaka'],
      ['Contact', 'contact.html', '3 entities · routed enquiries'],
      ['العربية (RTL home)', 'ar.html', 'Arabic demonstration']
    ]],
    ['🛠 IT Solutions', '5 flagship practices (content §05) + 12 service lines (mirror) — every line has a detail page', CONTENT.solutions5.map(function (s) {
      return [s.t, 'it-solution.html#' + ({ amc: 'amc', av: 'av', cloud: 'cloud-security', storage: 'data-recovery', firewall: 'firewall' }[s.slug] || s.slug), s.tag + ' · detail page'];
    }).concat([
      ['AMC — SLA tiers', 'it-solution.html#amc', '1h / 4h / NBD response table'],
      ['All 12 service lines', 'solutions.html#lines', 'Directory hub · every card navigates']
    ])],
    ['💻 Software Services — Simal + Unisoft', 'Full portfolio researched from uslbd.com (3 Oct 2026) + content §06 — every menu item has its own page', [
      ['Software home — portfolio map', 'software.html', 'Pricing · ROI · demo · implementation'],
      ['UniERP flagship ERP', 'software-erp.html', 'Odoo 19 CE · TCO table · 7 modules'],
      ['ERP module library (7)', 'software-module.html', 'Tabbed detail page per module'],
      ['Module: Finance & Accounting', 'software-module.html#finance', 'GL · AR/AP · reporting'],
      ['All products & platforms (20)', 'software-products.html', '10 ERPs + 10 specialized · filters'],
      ['Solution deep-dive tier (20)', 'software-solution.html#distribution-erp', 'Capabilities · rollout · cross-navigation'],
      ['UniPOS — multi-sector POS', 'software-products.html#unipos', 'Retail · fashion · food service'],
      ['UniVAT — NBR-approved VAT', 'software-products.html#univat', 'Tax automation · Peppol-ready UAE'],
      ['Engineering services (12)', 'software-services.html', 'Custom dev → data & BI · engagement models'],
      ['Service detail (child tier)', 'software-service.html#aiml', 'AI/ML: overview, how-we-work, 3 subs'],
      ['Sub-service (grandchild tier)', 'software-subservice.html#ml', 'Machine Learning deep page'],
      ['AI & machine learning', 'software-services.html#aiml', 'ML · BI · predictive analytics'],
      ['Industries & sectors (9)', 'software-industries.html', 'Directory of 9 vertical cards'],
      ['Industry detail tier', 'software-industry.html#banking', 'Pains · plays · solutions · FAQ'],
      ['Healthcare & medical', 'software-industry.html#healthcare', 'Hospital ERP · queue management'],
      ['Finance & banking', 'software-industries.html#banking', 'Loan → custodian banking'],
      ['ERP demo request', 'software.html#demo', 'Working form']
    ]],
    ['🤝 Partners & Portal', 'Partner program (content §07) + KYC lifecycle', [
      ['Program & tiers', 'onboarding.html#tiers', 'Authorized · Premier · Elite'],
      ['Become a reseller — KYC wizard', 'onboarding.html', '7 steps · TRN/IBAN validated'],
      ['Sign in / create account', 'login.html', 'Mock auth · MFA noted'],
      ['Partner dashboard', 'account.html', 'KYC status · RFQs · vault'],
      ['RFQ — request a quote', 'rfq.html', 'Basket → SIMAL-RFQ reference']
    ]],
    ['📚 Insights & Resources', 'Blog (10 posts, content §08) · cases · papers · FAQ', [
      ['Blog & newsroom', 'insights.html', 'Real mirror post + desk notes'],
      ['Case studies (8)', 'resources.html#cases', '3× revenue · ERP wins'],
      ['White papers', 'resources.html#papers', 'Gated downloads'],
      ['FAQ', 'resources.html#faq', 'Partner questions'],
      ['Press room & media kit', 'resources.html#press', 'Newsroom links']
    ]],
    ['⚙️ Panels & System', 'Internal consoles + legal center', [
      ['Admin — KYC queue', 'admin-queue.html', 'SLA · donut · live queue'],
      ['Admin — application review', 'admin-review.html', 'Field approve/flag'],
      ['CMS — content studio', 'cms.html', 'AR gaps · claims register'],
      ['CMS — bilingual editor', 'cms-editor.html', 'EN/AR overrides live'],
      ['Legal center (7 policies)', 'legal.html', 'Privacy → Accessibility'],
      ['Self-test (30 assertions)', 'test.html', 'One-click proof'],
      ['README / manifest', 'README.md', 'Versions & QA log']
    ]]
  ];

  document.getElementById('sm').innerHTML = sections.map(function (sec) {
    return '<div class="sm-sec"><h3>' + sec[0] + '</h3><p class="note">' + sec[1] + '</p><div class="sm-grid">' +
      sec[2].map(function (c) {
        return '<div class="sm-card"><b>' + S.esc(c[0]) + '</b><a href="' + c[1] + '">' + c[1].split('#')[0] + (c[1].indexOf('#') > -1 ? '#' + c[1].split('#')[1] : '') + '</a><span class="note">' + S.esc(c[2]) + '</span></div>';
      }).join('') + '</div></div>';
  }).join('');
})();
