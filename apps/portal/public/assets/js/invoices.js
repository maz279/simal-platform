/* invoices.js — partner e-invoice portal: list, create (fils-safe live totals),
   submit, detail with timeline + UBL preview. Money math mirrors the server:
   integer fils only — unitPrice×qty in fils, VAT = round(net*5/100) half-up. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toFils = function (s) { var m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(s).trim()); if (!m) return null; return +m[1] * 100 + +(m[2] || '0').padEnd(2, '0'); };
  var vatOf = function (net) { return Math.floor((net * 5 + 50) / 100); };
  var aed = function (f) { return (f / 100).toFixed(2); };
  var ST = { draft: ['Draft', 'st-draft'], submitted: ['Submitted', 'st-submitted'], validated: ['Validated', 'st-validated'], delivered: ['Delivered', 'st-delivered'], rejected: ['Rejected', 'st-rejected'] };
  var badge = function (st) { var m = ST[st] || [st, 'st-draft']; return '<span class="badge ' + m[1] + '">' + m[0] + '</span>'; };

  var fmtDate = function (d) {
    if (!d) return '—';
    try {
      var dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return String(d); }
  };

  var me = null;
  var editingId = null;   /* when set, "Save draft" PUTs the existing invoice */

  function guard() {
    return API.me().then(function (m) {
      me = m.user;
      $('#who').textContent = me.email;
      if (me.role !== 'partner') location.href = (me.role === 'viewer' || me.role === 'reviewer' || me.role === 'super_admin') ? 'invoices-admin.html' : 'login.html';
    }).catch(function () { location.href = 'login.html'; });
  }
  $('#out').addEventListener('click', function (e) { e.preventDefault(); API.logout().then(function () { location.href = 'login.html'; }); });

  /* ---------- list ---------- */
  function loadList() {
    return API.call('GET', '/api/einvoice/mine').then(function (r) {
      var inv = r.invoices || [];
      var counts = {};
      inv.forEach(function (i) { counts[i.status] = (counts[i.status] || 0) + 1; });
      $('#stats').innerHTML =
        stat(inv.length, 'Total invoices') + stat(counts.draft || 0, 'Drafts') +
        stat((counts.submitted || 0) + (counts.validated || 0), 'In validation') + stat(counts.delivered || 0, 'Delivered via Peppol');
      $('#rows').innerHTML = inv.length ? inv.map(function (i) {
        return '<tr><td class="mono">' + esc(i.ref) + '</td><td>' + esc(i.buyerName || '—') + '</td><td class="mono">' + esc(i.buyerTin || '—') + '</td>' +
          '<td>' + fmtDate(i.issueDate) + '</td><td>' + fmtDate(i.dueDate) + '</td><td style="text-align:right"><b>' + (i.totals ? i.totals.total : '0.00') + '</b></td>' +
          '<td>' + badge(i.status) + (i.kyc ? '' : ' <span title="Buyer TRN not KYC-approved">⚠</span>') + '</td>' +
          '<td><a href="#" data-open="' + esc(i.id) + '" style="color:var(--brand-700);font-weight:700">Open</a></td></tr>';
      }).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--ink-3);padding:26px">No invoices yet — create the first one.</td></tr>';
      document.querySelectorAll('[data-open]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); openDetail(a.getAttribute('data-open')); });
      });
    });
  }
  function stat(n, l) { return '<div class="stat"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>'; }

  /* ---------- create ---------- */
  var lineCount = 0;
  function addLine() {
    lineCount++;
    var d = document.createElement('div');
    d.className = 'line-row'; d.dataset.line = lineCount;
    d.innerHTML = '<div class="f" style="margin:0"><input placeholder="Description (e.g. Crucial T705 2TB — 10 units)" data-l="desc"></div>' +
      '<div class="f" style="margin:0"><input type="number" min="1" step="1" value="1" data-l="qty"></div>' +
      '<div class="f" style="margin:0"><input type="number" min="0" step="0.01" value="0.00" data-l="price"></div>' +
      '<div class="f" style="margin:0"><input value="—" data-l="lt" readonly style="background:var(--gray-50);font-weight:700"></div>' +
      '<button class="btn btn-o" data-del style="padding:9px 10px" title="Remove line">×</button>';
    d.querySelector('[data-del]').addEventListener('click', function () { d.remove(); recompute(); });
    d.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', recompute); });
    $('#lines').appendChild(d);
  }
  function collect() {
    var lines = [];
    document.querySelectorAll('.line-row').forEach(function (row) {
      lines.push({ desc: row.querySelector('[data-l="desc"]').value, qty: +row.querySelector('[data-l="qty"]').value, unitPrice: row.querySelector('[data-l="price"]').value });
    });
    return {
      buyerName: $('#b-name').value, buyerTin: $('#b-trn').value, poRef: $('#b-po').value,
      issueDate: $('#b-issue').value, dueDate: $('#b-due').value, currency: $('#b-cur').value, lines: lines
    };
  }
  function recompute() {
    var net = 0, vat = 0;
    document.querySelectorAll('.line-row').forEach(function (row) {
      var qty = +row.querySelector('[data-l="qty"]').value || 0;
      var fils = toFils(row.querySelector('[data-l="price"]').value);
      var ln = (fils || 0) * qty;
      net += ln; vat += vatOf(ln);
      row.querySelector('[data-l="lt"]').value = aed(ln + vatOf(ln));
    });
    $('#t-net').textContent = aed(net); $('#t-vat').textContent = aed(vat); $('#t-tot').textContent = aed(net + vat);
  }
  function showErr(e) {
    var box = $('#nerr'); box.hidden = false;
    box.textContent = e.message + (e.details ? ' — ' + e.details.map(function (d) { return d.field + ': ' + d.message; }).join('; ') : '');
  }
  function create(submitToo) {
    $('#nerr').hidden = true;
    var done = function (r) {
      editingId = null;
      switchTab('list'); loadList().then(function () { openDetail(r.id); });
    };
    var req;
    if (editingId) {
      req = API.call('PUT', '/api/einvoice/' + editingId, collect()).then(function (r) {
        if (submitToo) return API.call('POST', '/api/einvoice/' + editingId + '/submit');
        return r;
      }).then(function (r) { return { id: editingId }; });
    } else {
      req = API.call('POST', '/api/einvoice', collect()).then(function (r) {
        if (submitToo) return API.call('POST', '/api/einvoice/' + r.id + '/submit');
        return r;
      });
    }
    req.then(done).catch(showErr);
  }
  /* load an existing draft into the form for editing (reopened invoices land here) */
  function editDraft(i) {
    editingId = i.id;
    $('#b-name').value = i.buyerName; $('#b-trn').value = i.buyerTin; $('#b-po').value = i.poRef || '';
    $('#b-issue').value = i.issueDate; $('#b-due').value = i.dueDate; $('#b-cur').value = i.currency || 'AED';
    $('#lines').innerHTML = ''; lineCount = 0;
    i.lines.forEach(function (l) {
      addLine();
      var row = $('#lines').lastChild;
      row.querySelector('[data-l="desc"]').value = l.desc;
      row.querySelector('[data-l="qty"]').value = l.qty;
      row.querySelector('[data-l="price"]').value = l.unitPrice;
    });
    recompute();
    switchTab('new');
    $('#nerr').hidden = true; $('#nerr').textContent = '';
    var note = document.createElement('p');
    note.style.cssText = 'font-size:12.5px;color:#0F4C9C;background:#E3F0FF;border-radius:8px;padding:8px 12px';
    note.textContent = 'Editing ' + i.ref + ' — save updates this draft.';
    $('#view-new').querySelector('.panel').insertBefore(note, $('#view-new .f'));
  }
  $('#add-line').addEventListener('click', addLine);
  $('#save-draft').addEventListener('click', function () { create(false); });
  $('#create-submit').addEventListener('click', function () { create(true); });

  /* ---------- detail ---------- */
  function openDetail(id) {
    API.call('GET', '/api/einvoice/' + id).then(function (i) {
      var panel = $('#detail');
      panel.hidden = false;
      panel.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="margin:0;font-size:19px" class="mono">' + esc(i.ref) + '</h2>' + badge(i.status) +
        (i.kyc ? '<span class="badge st-validated">KYC ✓ ' + esc(i.kyc.reference) + '</span>' : '<span class="badge st-rejected">Buyer not KYC-approved</span>') +
        '<span style="margin-left:auto"></span>' +
        (i.status === 'draft' ? '<button class="btn btn-p" id="d-submit">Submit for validation</button><button class="btn btn-o" id="d-edit">Edit details</button>' : '') +
        (i.status === 'rejected' ? '<button class="btn btn-o" id="d-reopen">Edit (reopen draft)</button>' : '') +
        '</div>' +
        (i.rejectReason ? '<div class="err-box">Rejected: ' + esc(i.rejectReason) + '</div>' : '') +
        (i.validation ? '<div class="' + (i.validation.pass ? 'ok-box' : 'err-box') + '">Validation ' + (i.validation.pass ? 'passed 7/7 checks' : 'failed') + ': ' +
          i.validation.checks.map(function (c) { return '<div class="chk"><span class="' + (c.ok ? 'ok' : 'no') + '">' + (c.ok ? '✓' : '✗') + '</span>' + esc(c.check) + '</div>'; }).join('') + '</div>' : '') +
        '<div class="grid2" style="margin-top:14px">' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Parties &amp; terms</h3>' +
        '<table class="tbl"><tr><th>Field</th><th>Value</th></tr>' +
        '<tr><td>Buyer</td><td>' + esc(i.buyerName || '—') + '</td></tr>' +
        '<tr><td>Buyer TRN</td><td class="mono">' + esc(i.buyerTin || '—') + '</td></tr>' +
        '<tr><td>Peppol endpoint</td><td class="mono">' + esc(i.buyerPeppol || ('0235:' + (i.buyerTin ? String(i.buyerTin).slice(0, 10) : ''))) + '</td></tr>' +
        '<tr><td>PO</td><td>' + esc(i.poRef || '—') + '</td></tr>' +
        '<tr><td>Issue / due</td><td>' + fmtDate(i.issueDate) + ' → ' + fmtDate(i.dueDate) + '</td></tr></table></div>' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Lines</h3>' +
        '<table class="tbl"><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Line total</th></tr>' +
        i.lines.map(function (l) { return '<tr><td>' + esc(l.desc) + '</td><td style="text-align:right">' + l.qty + '</td><td style="text-align:right">' + l.unitPrice + '</td><td style="text-align:right"><b>' + aed(l.qty * toFils(l.unitPrice) + vatOf(l.qty * toFils(l.unitPrice))) + '</b></td></tr>'; }).join('') +
        '<tr><td colspan="3" style="text-align:right"><b>Net / VAT / Total</b></td><td style="text-align:right"><b>' + i.totals.net + ' / ' + i.totals.vat + ' / ' + i.totals.total + '</b></td></tr></table></div>' +
        '</div>' +
        '<div class="grid2" style="margin-top:16px">' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Timeline</h3><ul class="tl">' +
        i.timeline.map(function (t) { return '<li><b>' + esc(t.label) + '</b> — ' + new Date(t.ts).toLocaleString() + ' <span style="color:var(--ink-3)">(' + esc(t.actor) + ')</span></li>'; }).join('') + '</ul></div>' +
        '<div><h3 style="font-size:14px;margin:0 0 8px">Peppol UBL preview ' + (i.ubl && !i.ubl.provisionalNote ? '' : '') + '</h3>' +
        '<button class="btn btn-o" id="d-ubl" style="margin-bottom:10px">Load UBL JSON</button><div id="ubl-box"></div></div>' +
        '</div>';
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var s = document.getElementById('d-submit');
      if (s) s.addEventListener('click', function () {
        API.call('POST', '/api/einvoice/' + id + '/submit').then(function () { loadList(); openDetail(id); }).catch(function (e) { alert(e.message); });
      });
      var ed = document.getElementById('d-edit');
      if (ed) ed.addEventListener('click', function () { editDraft(i); });
      var rp = document.getElementById('d-reopen');
      if (rp) rp.addEventListener('click', function () {
        alert('This invoice was rejected. Ask your Simal contact to reopen it as a draft — then the Edit details button appears here.');
      });
      var ub = document.getElementById('d-ubl');
      if (ub) ub.addEventListener('click', function () {
        API.call('GET', '/api/einvoice/' + id + '/ubl').then(function (r) {
          document.getElementById('ubl-box').innerHTML = '<pre class="ubl">' + esc(JSON.stringify(r.ubl, null, 2)) + '</pre>' +
            (r.provisional ? '<p style="font-size:12px;color:var(--ink-3)">Provisional preview — the signed UBL is stamped at delivery.</p>' : '');
        });
      });
    });
  }

  /* ---------- tabs ---------- */
  function switchTab(which) {
    var list = which === 'list';
    $('#tab-list').classList.toggle('on', list); $('#tab-new').classList.toggle('on', !list);
    $('#view-list').hidden = !list; $('#view-new').hidden = list; $('#detail').hidden = true;
    if (!list && !lineCount) { addLine(); recompute(); }
    if (!list && !$('#b-issue').value) {
      var today = new Date().toISOString().slice(0, 10);
      $('#b-issue').value = today; $('#b-due').value = today;
    }
  }
  $('#tab-list').addEventListener('click', function () { switchTab('list'); });
  $('#tab-new').addEventListener('click', function () { switchTab('new'); });

  guard().then(loadList);
})();
