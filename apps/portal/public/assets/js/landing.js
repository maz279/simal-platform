/* ==========================================================================
 * landing.js — landing page (API-backed).
 * ========================================================================== */
(function () {
  'use strict';

  /* settings badges (FR-P-001) */
  API.settings().then(s => {
    document.getElementById('simal-tin').textContent = s.simalTin || '—';
    document.getElementById('simal-peppol').textContent = s.simalPeppol || '—';
  }).catch(() => {
    document.getElementById('simal-tin').textContent = 'unavailable';
    document.getElementById('simal-peppol').textContent = 'unavailable';
  });

  document.querySelectorAll('[data-icon]').forEach(function (el) {
    var size = el.classList.contains('rc-ic') ? 22 : 18;
    el.innerHTML = UI.icon(el.getAttribute('data-icon'), size);
  });
  document.querySelectorAll('.feature-list .f-ic').forEach(function (el) {
    el.innerHTML = UI.icon('check', 14);
  });
  ['card-vendor', 'card-customer'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.querySelector('.rc-check').innerHTML = UI.icon('check', 14);
  });

  /* invite param: pre-select role + show recognition note */
  (function () {
    var inv = new URLSearchParams(location.search).get('invite');
    if (!inv) return;
    API.inviteInfo(inv).then(info => {
      if (!info.found) return;
      var note = document.createElement('div');
      note.className = 'alert alert-success';
      note.style.maxWidth = '520px';
      note.innerHTML = UI.icon('check', 15) + ' <span>Invitation <b>' + UI.esc(info.code) +
        '</b> recognised — welcome, <b>' + UI.esc(info.company) + '</b>. Choose your role to begin.</span>';
      document.querySelector('.hero .container').prepend(note);
      var card = document.getElementById(info.role === 'vendor' ? 'card-vendor' : 'card-customer');
      if (card) card.style.borderColor = 'var(--success-500)';
    }).catch(() => {});
  })();

  /* resume modal — drafts live on the server keyed by contact email + role;
     re-entering the same email on the form continues the existing draft */
  document.getElementById('resume-link').addEventListener('click', function (e) {
    e.preventDefault();
    var body = document.createElement('div');
    body.innerHTML =
      '<p class="muted small">Drafts are saved on our server as you type. To continue one, ' +
      'open the form for your role and enter the <b>same contact email</b> — the wizard jumps ' +
      'straight back to where you left off. To check a submitted application, track it instead.</p>' +
      '<div class="row mt-6" style="justify-content:space-between">' +
      '<span class="row">' +
      '<a class="btn btn-secondary" href="form.html?role=vendor">Continue as Vendor</a>' +
      '<a class="btn btn-secondary" href="form.html?role=customer">Continue as Customer</a></span>' +
      '<a class="btn btn-primary" href="status.html">Track an application</a></div>';
    UI.modal({ title: 'Resume your submission', body, actions: [{ label: 'Close', cls: 'btn-secondary' }] });
  });
})();
