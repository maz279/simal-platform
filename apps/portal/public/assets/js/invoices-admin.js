/* invoices-admin.js — staff e-invoice console: queue with status filters,
   validation panel (7 checks), deliver / reject / reopen actions. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ST = { draft: ['Draft', 'st-draft'], submitted: ['Submitted', 'st-submitted'], validated: ['Validated', 'st-validated'], delivered: ['Delivered', 'st-delivered'], rejected: ['Rejected', 'st-rejected'] };
  var badge = function (st) { var m = ST[st] || [st, 'st-draft']; return '<span class="badge ' + m[1] + '">' + m[0] + '</span>'; };
  var FILTERS = ['all', 'submitted', 'validated', 'delivered', 'rejected', 'draft'];
  var active = 'all';

  var fmtDate = function (d) {
    if (!d) return '—';
    try {
      var dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return String(d); }
  };

  function guard() {
    return API.me().then(function (m) {
      $('#who').textContent = m.user.email + ' · ' + m.user.role;
      if (m.user.role === 'partner') location.href = 'invoices.html';
    }).catch(function () { location.href = 'login.html'; });
  }
  $('#out').addEventListener('click', function (e) { e.preventDefault(); API.logout().then(function () { location.href = 'login.html'; }); });

  function stat(n, l) { return '<div class="stat"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>'; }

  function load() {
    return API.call('GET', '/api/einvoice/admin/queue' + (active === 'all' ? '' : '?status=' + active)).then(function (r) {
      var rows = r.rows || [];
      var all = {};
      /* reuse the same fetch for stats when viewing a filtered list */
      var statsPromise = (active === 'all') ? Promise.resolve(rows) : API.call('GET', '/api/einvoice/admin/queue').then(function (x) { return x.rows || []; });
      statsPromise.then(function (allRows) {
        var c = {};
        allRows.forEach(function (i) { c[i.status] = (c[i.status] || 0) + 1; });
        $('#stats').innerHTML = stat(allRows.length, 'All invoices') + stat(c.submitted || 0, 'Awaiting validation') +
          stat(c.validated || 0, 'Validated') + stat(c.delivered || 0, 'Delivered') + stat(c.rejected || 0, 'Rejected');
      });
      $('#filters').innerHTML = FILTERS.map(function (f) {
        return '<button class="chip' + (f === active ? ' on' : '') + '" data-f="' + f + '">' + (f === 'all' ? 'All' : (ST[f] ? ST[f][0] : f)) + '</button>';
      }).join('');
      document.querySelectorAll('#filters .chip').forEach(function (c) {
        c.addEventListener('click', function () { active = c.getAttribute('data-f'); load(); });
      });
      $('#rows').innerHTML = rows.length ? rows.map(function (i) {
        return '<tr><td class="mono">' + esc(i.ref) + '</td><td>' + esc(i.buyerName || '—') + '</td><td class="mono">' + esc(i.buyerTin || '—') + '</td>' +
          '<td style="font-size:12.5px">' + esc(i.partnerEmail || '—') + '</td><td>' + fmtDate(i.issueDate) + '</td>' +
          '<td style="text-align:right"><b>' + (i.total || '0.00') + '</b></td>' +
          '<td>' + (i.kyc ? '<span class="badge st-delivered">✓</span>' : '<span class="badge st-rejected">✗</span>') + '</td>' +
          '<td>' + badge(i.status) + '</td><td>' + (i.ageDays != null ? i.ageDays + 'd' : '—') + '</td>' +
          '<td><a href="#" data-open="' + esc(i.id) + '" style="color:var(--brand-700);font-weight:700">Open</a></td></tr>';
      }).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--ink-3);padding:26px">No invoices in this state.</td></tr>';
      document.querySelectorAll('[data-open]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); openDetail(a.getAttribute('data-open')); });
      });
    });
  }

  function openDetail(id) {
    API.call('GET', '/api/einvoice/admin/' + id).then(function (i) {
      var panel = $('#detail');
      panel.hidden = false;
      panel.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<h2 style="margin:0;font-size:19px" class="mono">' + esc(i.ref) + '</h2>' + badge(i.status) +
        (i.kyc ? '<span class="badge st-delivered">KYC ✓ ' + esc(i.kyc.reference) + '</span>' : '<span class="badge st-rejected">Buyer not KYC-approved</span>') +
        '<span style="margin-left:auto"></span>' +
        (i.status === 'submitted' ? '<button class="btn btn-p" id="a-validate">Validate (7 checks)</button>' : '') +
        (i.status === 'validated' ? '<button class="btn btn-d" id="a-deliver">Deliver via Peppol</button>' : '') +
        (i.status === 'submitted' || i.status === 'validated' ? '<button class="btn btn-r" id="a-reject">Reject…</button>' : '') +
        (i.status === 'rejected' || i.status === 'delivered' ? '<button class="btn btn-o" id="a-reopen">Reopen as draft</button>' : '') +
        '</div>' +
        (i.rejectReason ? '<div class="err-box" style="background:#FDECEC;border:1px solid #F2B8B5;color:#8C2F2A;border-radius:10px;padding:10px 14px;margin-top:12px">Rejection reason: ' + esc(i.rejectReason) + '</div>' : '') +
        (i.validation ? '<div style="margin-top:12px;border:1px solid var(--line);border-radius:12px;padding:14px 16px"><b style="font-size:13.5px">Validation ' + (i.validation.pass ? '— passed' : '— FAILED') + '</b>' +
          i.validation.checks.map(function (c) { return '<div class="chk"><span class="' + (c.ok ? 'ok' : 'no') + '">' + (c.ok ? '✓' : '✗') + '</span>' + esc(c.check) + '</div>'; }).join('') + '</div>' : '') +
        '<div id="reject-box" hidden style="margin-top:12px"><label style="font-size:12px;font-weight:700">Rejection reason (required, min 5 chars)</label>' +
        '<textarea id="a-reason" placeholder="e.g. Buyer TRN does not match the trade licence on file"></textarea>' +
        '<button class="btn btn-r" id="a-reason-go" style="margin-top:8px">Confirm rejection</button></div>' +
        '<div class="grid2" style="margin-top:16px">' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Parties &amp; terms</h3>' +
        '<table class="tbl"><tr><th>Field</th><th>Value</th></tr>' +
        '<tr><td>Partner</td><td>' + esc(i.buyerName || '—') + ' <span style="color:var(--ink-3)">(' + esc(i.timeline && i.timeline[0] ? i.timeline[0].actor : (i.partnerEmail || '')) + ')</span></td></tr>' +
        '<tr><td>Buyer TRN</td><td class="mono">' + esc(i.buyerTin || '—') + '</td></tr>' +
        '<tr><td>Peppol endpoint</td><td class="mono">' + esc(i.buyerPeppol || ('0235:' + (i.buyerTin ? String(i.buyerTin).slice(0, 10) : ''))) + '</td></tr>' +
        '<tr><td>PO</td><td>' + esc(i.poRef || '—') + '</td></tr>' +
        '<tr><td>Issue / due</td><td>' + fmtDate(i.issueDate) + ' → ' + fmtDate(i.dueDate) + '</td></tr>' +
        '<tr><td><b>Totals</b></td><td><b>Net ' + i.totals.net + ' · VAT ' + i.totals.vat + ' · Total ' + i.totals.total + ' AED</b></td></tr></table></div>' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Lines</h3>' +
        '<table class="tbl"><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th></tr>' +
        i.lines.map(function (l) { return '<tr><td>' + esc(l.desc) + '</td><td style="text-align:right">' + l.qty + '</td><td style="text-align:right">' + l.unitPrice + '</td></tr>'; }).join('') + '</table>' +
        '<h3 style="font-size:14px;margin:14px 0 8px">Timeline</h3><ul class="tl">' +
        i.timeline.map(function (t) { return '<li><b>' + esc(t.label) + '</b> — ' + new Date(t.ts).toLocaleString() + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
        '<div style="margin-top:14px"><button class="btn btn-o" id="a-ubl">View delivered UBL</button><div id="ubl-box" style="margin-top:10px"></div></div>';
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

      function act(action, reason) {
        API.call('POST', '/api/einvoice/admin/' + id + '/actions', { action: action, reason: reason })
          .then(function () { load(); openDetail(id); })
          .catch(function (e) { alert(e.message); });
      }
      var v = document.getElementById('a-validate'); if (v) v.addEventListener('click', function () { act('validate'); });
      var d = document.getElementById('a-deliver'); if (d) d.addEventListener('click', function () { act('deliver'); });
      var rj = document.getElementById('a-reject'); if (rj) rj.addEventListener('click', function () { document.getElementById('reject-box').hidden = false; });
      var rg = document.getElementById('a-reason-go'); if (rg) rg.addEventListener('click', function () {
        var reason = document.getElementById('a-reason').value.trim();
        if (reason.length < 5) return alert('Rejection reason must be at least 5 characters.');
        act('reject', reason);
      });
      var ro = document.getElementById('a-reopen'); if (ro) ro.addEventListener('click', function () { act('reopen'); });
      var ub = document.getElementById('a-ubl'); if (ub) ub.addEventListener('click', function () {
        API.call('GET', '/api/einvoice/admin/' + id + '/ubl').then(function (r2) {
          document.getElementById('ubl-box').innerHTML = '<pre class="ubl">' + esc(JSON.stringify(r2.ubl, null, 2)) + '</pre>';
        });
      });
    });
  }

  guard().then(load);
})();
