/* partner status tracking (external file — CSP keeps script-src 'self') */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var qRef = new URLSearchParams(location.search).get('ref');
  var qEmail = new URLSearchParams(location.search).get('email');
  if (qRef) $('#lk-ref').value = qRef;
  if (qEmail) $('#lk-email').value = qEmail;
  if (qRef && qEmail) setTimeout(tryLookup, 50);

  $('#lk-go').addEventListener('click', tryLookup);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !$('#lookup').hidden) tryLookup();
  });

  function tryLookup() {
    var ref = $('#lk-ref').value.trim().toUpperCase();
    var email = $('#lk-email').value.trim().toLowerCase();
    setErr('#lk-ref-err', true);
    setErr('#lk-email-err', true);
    if (!ref) { setErr('#lk-ref-err', false); $('#lk-ref').focus(); return; }
    API.publicStatus(ref, email).then(function (sub) { render(sub, email); })
      .catch(function (e) {
        if (e.status === 404) { setErr('#lk-ref-err', false); $('#lk-ref').focus(); }
        else if (e.status === 403) { setErr('#lk-email-err', false); $('#lk-email').focus(); }
        else { UI.toast(e.message || 'Lookup failed', 'error'); }
      });
  }
  function setErr(sel, ok) {
    var el = $(sel);
    el.hidden = ok;
    var f = el.closest('.field');
    if (f) f.classList.toggle('invalid', !ok);
  }

  function render(sub, email) {
    $('#lookup').hidden = true;
    $('#status-view').hidden = false;
    $('#sv-company').textContent = sub.company;
    $('#sv-ref').textContent = sub.reference;
    $('#sv-role').textContent = ' · ' + (sub.role === 'vendor' ? 'Vendor / Supplier onboarding' : 'Customer onboarding');
    $('#sv-badge').innerHTML = UI.statusBadge(sub.status);

    var currentIdx = sub.timeline.length - 1;
    var html = sub.timeline.map(function (h, i) {
      var cls = i < currentIdx ? 'done' : (i === currentIdx ? 'current' : '');
      return '<li class="' + cls + '"><span class="tl-dot" aria-hidden="true"></span>' +
        '<div class="tl-title">' + UI.esc(h.label) + '</div>' +
        '<div class="tl-sub">' + UI.fmtDateTime(h.ts) + '</div></li>';
    }).join('');
    var upcoming = { submitted: 'Review', under_review: 'Decision', on_hold: 'Decision', query_raised: 'Your response', partner_updated: 'Decision' };
    if (upcoming[sub.status]) {
      html += '<li><span class="tl-dot" aria-hidden="true"></span><div class="tl-title muted">' +
        UI.esc(upcoming[sub.status]) + '</div><div class="tl-sub">pending</div></li>';
    }
    $('#sv-timeline').innerHTML = html;

    var qHtml = '';
    if (sub.queries && sub.queries.length) {
      qHtml += '<h2 style="font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.05em;color:var(--gray-500)">Reviewer queries</h2><div class="stack mt-2">';
      sub.queries.forEach(function (q) {
        qHtml += '<div class="query-card"><div class="qc-bubble">' +
          '<div class="small" style="font-weight:700;color:var(--warn-700)">Query · ' + UI.esc(q.section) + ' · ' + UI.fmtDate(q.raised_at) + '</div>' +
          '<p class="small mt-2 mb-0">' + UI.esc(q.message) + '</p>' +
          (q.response ? '<div class="alert alert-success mt-4" style="padding:8px 12px"><span class="small"><b>Your response:</b> ' + UI.esc(q.response) + '</span></div>' : '') +
          '</div></div>';
      });
      qHtml += '</div>';
    }
    if (sub.canRespond) {
      qHtml += '<div class="card card-pad mt-4"><h2 style="font-size:var(--fs-base)">Respond to query</h2>' +
        '<p class="small muted">Describe the correction you made (or will make). Simal reviewers are notified immediately.</p>' +
        '<textarea class="textarea" id="resp-text" placeholder="e.g. Corrected the TRN to the number on our certificate…"></textarea>' +
        '<button class="btn btn-primary mt-4" id="resp-send">' + UI.icon('send', 16) + ' Send response</button></div>';
    }
    $('#sv-queries').innerHTML = qHtml;

    var rs = $('#resp-send');
    if (rs) rs.addEventListener('click', function () {
      var txt = $('#resp-text').value.trim();
      if (!txt) { UI.toast('Please describe your response first.', 'warn'); return; }
      rs.disabled = true;
      API.respondToQuery(sub.reference, email, txt).then(function () {
        UI.toast('Response sent — Simal has been notified.', 'success');
        setTimeout(function () { location.reload(); }, 600);
      }).catch(function (e) {
        rs.disabled = false;
        UI.toast(e.message || 'Could not send response', 'error');
      });
    });

    function kv(k, v) { return '<div class="kv"><div class="k">' + UI.esc(k) + '</div><div class="v">' + UI.esc(v || '—') + '</div></div>'; }
    var revClean = (sub.reviewer && sub.reviewer !== '{}' && sub.reviewer !== '[object Promise]') ? sub.reviewer : 'Queued for assignment';
    $('#sv-details').innerHTML =
      kv('Reviewer', revClean) +
      kv('Status', UI.STATUS[sub.status] ? UI.STATUS[sub.status].label : sub.status) +
      (sub.rejection_reason ? '<div class="alert alert-danger" style="grid-column:1/-1"><span><b>Rejection reason:</b> ' + UI.esc(sub.rejection_reason) + '</span>' +
        '<div class="mt-3"><a href="form.html?role=' + encodeURIComponent(sub.role || 'customer') + '&email=' + encodeURIComponent(email) + '&reapply=' + encodeURIComponent(sub.reference) + '" class="btn btn-primary btn-sm">Fix flagged details &amp; Reapply</a></div></div>' : '') +
      (sub.hold_reason ? '<div class="alert alert-warn" style="grid-column:1/-1"><span><b>On hold:</b> ' + UI.esc(sub.hold_reason) + '</span></div>' : '');
  }

  var style = document.createElement('style');
  style.textContent = '@media (max-width:760px){#sv-grid{grid-template-columns:1fr !important;}}';
  document.head.appendChild(style);
})();
