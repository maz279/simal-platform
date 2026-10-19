/* Account dashboard: session, KYC status (reads applications), RFQ history,
   document vault with expiry, notifications */
(function () {
  var u = S.user();
  if (!u) { location.href = 'login.html'; return; }
  document.getElementById('a-name').textContent = u.name || 'Partner';
  document.getElementById('a-mail').textContent = u.email;
  document.getElementById('a-av').textContent = (u.name || 'S')[0].toUpperCase();
  document.getElementById('a-sub').textContent = 'Signed in ' + new Date(u.at).toLocaleString();

  var myApp = S.myApp();
  var rfqs = S.rfqs();

  document.getElementById('k-rfq').textContent = rfqs.length;
  document.getElementById('k-quotes').textContent = rfqs.filter(function (r) { return r.status === 'Quoted'; }).length;
  var docCount = myApp ? (myApp.docs.licence ? 1 : 0) + (myApp.docs.passport ? 1 : 0) + (myApp.docs.bank ? 1 : 0) : 0;
  document.getElementById('k-docs').textContent = docCount;
  document.getElementById('k-kyc').textContent = myApp ? myApp.status : 'Not started';

  // nav
  document.querySelectorAll('.s-nav a[data-v]').forEach(function (a) {
    a.addEventListener('click', function () {
      document.querySelectorAll('.s-nav a').forEach(function (x) { x.classList.remove('on'); });
      a.classList.add('on');
      ['home', 'kyc', 'rfq', 'orders', 'docs', 'notif'].forEach(function (v) {
        document.getElementById('v-' + v).hidden = v !== a.getAttribute('data-v');
      });
      document.querySelector('.p-top b').textContent = a.textContent.trim().replace(/^[^\s]+\s/, '');
    });
  });

  // orders & invoices (B2B portal §12 — sample rows once KYC approved)
  var ol = document.getElementById('orders-list');
  if (ol) {
    var approved = myApp && myApp.status === 'Approved';
    ol.innerHTML = approved
      ? '<table class="tbl"><tr><th>Order</th><th>Date</th><th>Value</th><th>Status</th><th>Invoice</th></tr>' +
        '<tr><td style="font-family:Consolas,monospace;font-size:12px">SO-2026-0341</td><td>12 Sep 2026</td><td>AED 48,200</td><td><span class="statuspill st-ok">Delivered</span></td><td><a href="#" onclick="S.toast(\'Invoice PDF — build phase\');return false">INV-90122 ↓</a></td></tr>' +
        '<tr><td style="font-family:Consolas,monospace;font-size:12px">SO-2026-0318</td><td>28 Aug 2026</td><td>AED 12,750</td><td><span class="statuspill st-info">In transit</span></td><td>—</td></tr></table>' +
        '<p class="hint" style="margin-top:10px">Order management, invoice payment and support tickets (content §12) activate at build phase.</p>'
      : '<div class="empty">Orders unlock once your KYC application is approved.<br><br><a class="btn btn-p" href="' + (myApp ? 'onboarding.html' : 'onboarding.html') + '">Complete onboarding</a></div>';
  }
  document.getElementById('logout').addEventListener('click', function () { S.logout(); });

  // KYC card
  var kb = document.getElementById('kyc-box');
  if (!myApp) {
    kb.innerHTML = '<div class="empty">No KYC application yet — onboard once to unlock quote-against-PO and Peppol e-invoicing.<br><br><a class="btn btn-p" href="onboarding.html">Start onboarding (≈10 min)</a></div>';
  } else {
    var pill = myApp.status === 'Approved' ? 'st-ok' : (myApp.status === 'More info required' ? 'st-err' : 'st-info');
    kb.innerHTML =
      '<div class="card card-p"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
      '<span class="statuspill ' + pill + '">' + myApp.status + '</span>' +
      '<span style="font-family:Consolas,monospace;font-size:13px;color:var(--slate)">' + myApp.ref + '</span>' +
      '<span class="note">submitted ' + new Date(myApp.at).toLocaleDateString() + '</span></div>' +
      '<div class="timeline" style="margin-top:16px">' +
      '<div class="tl ' + (1 ? 'done' : '') + '"><b>Submitted</b><span>' + new Date(myApp.at).toLocaleString() + '</span></div>' +
      '<div class="tl ' + (myApp.status !== 'In review' ? 'done' : '') + '"><b>Under review</b><span>Reviewer checks TRN, licence, IBAN</span></div>' +
      '<div class="tl ' + (myApp.status === 'Approved' ? 'done' : '') + '"><b>Decision</b><span>' + (myApp.status === 'Approved' ? 'Approved — trading enabled' : 'Pending') + '</span></div>' +
      '</div>' +
      (myApp.status === 'More info required' ? '<div class="alert al-err" style="margin-top:14px"><b>Reviewer flagged:</b> ' + (myApp.flagged.join('; ') || 'see email') + ' — <a href="onboarding.html" style="color:inherit">fix fields</a></div>' : '') +
      (myApp.status === 'In review' ? '<div class="alert al-info" style="margin-top:14px">Median decision time: same business day. You will receive email + notification here.</div>' : '') +
      '</div>';
  }

  // RFQ list
  document.getElementById('rfq-list').innerHTML = rfqs.length ?
    '<table class="tbl"><tr><th>Reference</th><th>Items</th><th>Status</th><th>Date</th></tr>' + rfqs.map(function (r) {
      return '<tr><td style="font-family:Consolas,monospace;font-size:12px">' + r.ref + '</td>' +
        '<td>' + r.items.length + ' SKU' + (r.items.length > 1 ? 's' : '') + ' · ' + S.esc(r.company) + '</td>' +
        '<td><span class="statuspill st-info">' + r.status + '</span></td>' +
        '<td>' + new Date(r.at).toLocaleDateString() + '</td></tr>';
    }).join('') + '</table>'
    : '<div class="empty">No RFQs yet. Your submitted requests and quotations appear here.<br><br><a class="btn btn-p" href="category.html">Build an RFQ</a></div>';

  // docs
  var docs = [];
  if (myApp && myApp.docs.licence) docs.push(['Trade licence', 'Valid to 30 Nov 2027', 'ok']);
  if (myApp && myApp.docs.passport) docs.push(['Owner passport / EID', 'Valid to 12 Mar 2028', 'ok']);
  if (myApp && myApp.docs.bank) docs.push(['Bank letter', 'On file', 'ok']);
  document.getElementById('doc-list').innerHTML = docs.length ?
    docs.map(function (d) { return '<div class="docrow">📄 <b>' + d[0] + '</b><span class="note" style="margin-left:auto">' + d[1] + '</span><span class="statuspill st-ok" style="margin-left:10px">OK</span></div>'; }).join('') +
    '<p class="hint" style="margin-top:12px">Expiry alerts arrive by email 60/30/7 days ahead.</p>'
    : '<div class="empty">No documents on file yet — they are attached during onboarding.<br><br><a class="btn btn-o" href="onboarding.html">Go to onboarding</a></div>';

  // notifications
  var notes = [];
  if (myApp && myApp.status === 'Approved') notes.push(['✅', 'KYC approved — trading enabled', myApp.ref]);
  if (rfqs.length) notes.push(['🧾', 'RFQ ' + rfqs[0].ref + ' received — quote within 1 business day', '']);
  notes.push(['🧾', 'UAE e-invoicing (Peppol) becomes mandatory 1 Jan 2027 — your TRN is on file.', '']);
  document.getElementById('notif-list').innerHTML = notes.map(function (n) {
    return '<div class="docrow">' + n[0] + ' <div><b style="font-size:13.5px">' + n[1] + '</b>' + (n[2] ? '<div class="note">' + n[2] + '</div>' : '') + '</div><span class="note" style="margin-left:auto">today</span></div>';
  }).join('');

  // recent
  document.getElementById('recent').innerHTML =
    (myApp ? '<div class="docrow">🛡 <b>KYC — ' + myApp.status + '</b><span class="note" style="margin-left:auto">' + new Date(myApp.at).toLocaleDateString() + '</span></div>' : '') +
    rfqs.slice(0, 4).map(function (r) { return '<div class="docrow">🧾 <b>' + r.ref + '</b> — ' + r.items.length + ' items<span class="note" style="margin-left:auto">' + new Date(r.at).toLocaleDateString() + '</span></div>'; }).join('') ||
    '<div class="empty" style="padding:30px">Activity will appear here.</div>';
})();

/* switching account tab via hash while already on the page re-renders (reload fallback) */
window.addEventListener('hashchange', function () { location.reload(); });
