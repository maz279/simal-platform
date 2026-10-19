/* Contact: enquiry routing table + validation */
(function () {
  // 4 office locations (content §10-04)
  var oc = document.getElementById('office-cards');
  if (oc) oc.innerHTML = CONTENT.offices.map(function (o, i) {
    return '<div class="card card-p" style="' + (i === 0 ? 'border-left:4px solid var(--blue);' : '') + '"><b>' + o[0] + '</b>' +
      '<p class="note" style="margin-top:6px">' + o[1] + '</p>' +
      '<p class="note" style="margin-top:4px">' + o[2] + '</p>' +
      '<p class="hint" style="margin-top:4px">' + o[3] + '</p></div>';
  }).join('');

  // preselect type from solutions.html?type=...
  var pre = new URLSearchParams(location.search).get('type');
  if (pre) {
    var sel = document.getElementById('c-type');
    Array.from(sel.options).forEach(function (o) {
      if (o.text.toLowerCase().indexOf(pre.toLowerCase().split(' ')[0]) > -1) sel.value = o.value || o.text;
    });
  }
  var ROUTE = {
    'Quote / RFQ': ['Sales desk', '4 business hours'],
    'Order support': ['Order support', '1 business day'],
    'Warranty / RMA': ['RMA desk', '2 business days'],
    'Software services': ['Software desk (Simal + Unisoft)', '1 business day'],
    'IT solutions / AMC': ['Services desk', '1 business day'],
    'Partnership': ['Partnerships', '2 business days'],
    'Careers': ['HR', '5 business days']
  };
  document.getElementById('c-go').addEventListener('click', function () {
    var role = document.getElementById('c-role').value;
    var type = document.getElementById('c-type').value;
    var nm = document.getElementById('c-name').value.trim();
    var em = document.getElementById('c-email').value.trim();
    var msg = document.getElementById('c-msg').value.trim();
    var e = document.getElementById('c-err'), done = document.getElementById('c-done');
    e.hidden = true; done.hidden = true;
    var fail = function (m) { e.hidden = false; e.textContent = '⚠ ' + m; S.toast(m, 'err'); };
    if (!role) return fail('Tell us who you are.');
    if (!type) return fail('Pick an enquiry type.');
    if (!nm) return fail('Name is required.');
    if (!S.v.email(em)) return fail('Enter a valid work email.');
    if (msg.length < 10) return fail('Message should be at least 10 characters.');
    if (!document.getElementById('c-ok').checked) return fail('Consent is required.');
    var r = ROUTE[type] || ['Front desk', '1 business day'];
    var enq = S.ls('enquiries', []);
    enq.unshift({ ref: S.uid('ENQ'), role: role, type: type, name: nm, email: em, at: new Date().toISOString() });
    S.save('enquiries', enq);
    done.hidden = false;
    done.innerHTML = '<b>Sent ✓</b> — routed to the <b>' + r[0] + '</b> with a first-response SLA of <b>' + r[1] + '</b>. Confirmation sent to ' + S.esc(em) + '.';
    S.toast('Enquiry routed to ' + r[0]);
    document.getElementById('c-msg').value = '';
  });
})();
