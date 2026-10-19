/* confirmation receipt — fetches the real submission summary from the server */
(function () {
  'use strict';
  document.querySelector('.big-check').innerHTML = UI.icon('check', 34);
  var ref = new URLSearchParams(location.search).get('ref') || '';
  document.getElementById('ref-pill').textContent = ref || '—';

  function kv(k, v) { return '<div class="kv"><div class="k">' + UI.esc(k) + '</div><div class="v">' + UI.esc(v || '—') + '</div></div>'; }

  /* provisional receipt (works even if the fetch is slow) */
  document.getElementById('summary').innerHTML =
    kv('Reference', ref || '—') +
    kv('Expected review', 'Within 2 business days') +
    kv('Notifications', 'A confirmation email has been sent to your primary contact');

  /* enrich with real submission data when the reference resolves */
  if (ref && window.API && API.settings) {
    API.settings().then(function () {
      /* the public status endpoint needs the email; the confirmation page may not have it.
         Try reading it from the query string, else leave the provisional receipt. */
      var email = new URLSearchParams(location.search).get('email');
      if (!email) return;
      return API.publicStatus(ref, email).then(function (st) {
        document.getElementById('summary').innerHTML =
          kv('Reference', st.reference) +
          kv('Company', st.company) +
          kv('Onboarding type', st.role === 'vendor' ? 'Vendor / Supplier' : 'Customer') +
          kv('Current status', UI.STATUS[st.status] ? UI.STATUS[st.status].label : st.status) +
          kv('Expected review', 'Within 2 business days');
      });
    }).catch(function () { /* provisional receipt stands */ });
  }

  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-status').href = 'status.html?ref=' + encodeURIComponent(ref);
})();
