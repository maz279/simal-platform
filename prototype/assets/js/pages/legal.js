/* Legal center: 7 policies (content package §11) with tabs */
(function () {
  var SUM = {
    'Privacy Policy': ['Who we are and what this covers', 'Simal Technologies Middle East LLC (Bur Dubai, PO 49740) is the data controller for this platform.'],
    'Terms & Conditions': ['Using the platform', 'RFQ submissions, account use and content licensing; quotes are valid 7 days unless stated otherwise.'],
    'Cookie Policy': ['Cookies we set', 'Session (sign-in), preference (language, dismissed announcements) and analytics cookies with consent gating.'],
    'Return Policy': ['Returns & RMA', 'Authorized-line products carry manufacturer warranty; RMA handled locally with the Simal desk (see product page).'],
    'Shipping Policy': ['Delivery', 'UAE same/next business day from JAFZA; GCC same week; tracking issued per consignment.'],
    'Refund Policy': ['Refunds', 'Pre-payment refunds processed within 10 business days to the original instrument after RMA acceptance.'],
    'Accessibility Statement': ['Our commitment', 'Target WCAG 2.1 AA: contrast-verified palette, keyboard operability, RTL parity — issues welcome via contact.']
  };
  var tabs = document.getElementById('legal-tabs');
  var body = document.getElementById('legal-body');
  var slugs = ['privacy', 'terms', 'cookies', 'returns', 'shipping', 'refund', 'accessibility'];
  tabs.innerHTML = CONTENT.legal.map(function (t, i) {
    return '<button data-i="' + i + '" class="' + (i === 0 ? 'on' : '') + '">' + t + '</button>';
  }).join('');
  function show(i) {
    var t = CONTENT.legal[i], s = SUM[t] || ['', ''];
    var fromHash = decodeURIComponent(location.hash.replace('#', ''));
    body.innerHTML = '<h2 style="font-size:20px;margin-bottom:6px">' + t + '</h2>' +
      '<p style="font-size:12.5px;color:var(--slate-500)">Summary — full text: content/11_Legal/0' + (i + 1) + '_' + t.replace(/[^A-Za-z]/g, '_') + '.md · v2026-10 · counsel review pending</p>' +
      '<div class="timeline" style="margin-top:14px">' +
      '<div class="tl"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>' +
      '<div class="tl"><b>PDPL alignment</b><span>Processed under UAE Federal Decree-Law 45/2021; data subjects may exercise access, correction and deletion rights via the contact page.</span></div>' +
      '<div class="tl"><b>Updates</b><span>Material changes are announced on-platform 30 days before effect.</span></div></div>';
    tabs.querySelectorAll('button').forEach(function (b, j) { b.classList.toggle('on', j === i); });
  }
  tabs.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () { show(+b.getAttribute('data-i')); });
  });
  var h = decodeURIComponent(location.hash.replace('#', ''));
  var start = Math.max(0, slugs.indexOf(h));
  show(start);
})();

/* switching legal section via hash while already on the page re-renders (reload fallback) */
window.addEventListener('hashchange', function () { location.reload(); });
