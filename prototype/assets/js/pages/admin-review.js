/* Admin review: field-level approve/flag, decision rail, persists to applications */
(function () {
  var ref = decodeURIComponent(location.hash.replace('#', ''));
  var apps = S.apps();
  var app = null;
  if (ref) app = apps.filter(function (a) { return a.ref === ref; })[0];
  if (!app) app = apps.filter(function (a) { return a.status !== 'Approved'; })[0] || apps[0];
  if (!app) { document.getElementById('rv-co').textContent = 'No applications'; return; }

  document.getElementById('rv-sub').textContent = app.ref + ' · submitted ' + new Date(app.at).toLocaleDateString();
  document.getElementById('rv-co').textContent = app.company;
  document.getElementById('rv-meta').textContent = app.email + ' · TRN ' + (app.trn || '—') + ' · Peppol ' + (app.peppol || '—');
  document.getElementById('rv-notes').value = app.notes || '';

  var flags = app.flagged || [];
  var FIELDS = [
    ['company', 'Legal name', app.company],
    ['licence', 'Trade licence', (app.draft && app.draft.licence) || 'on file'],
    ['trn', 'TRN (15 digits)', app.trn + (S.v.trn(app.trn || '') ? '' : '  ← checksum/format FAIL')],
    ['peppol', 'Peppol ID', app.peppol || '—'],
    ['iban', 'IBAN (AE·23)', (app.draft && app.draft.iban) || (S.v.iban(app.iban || '') ? app.iban : 'not validated')],
    ['bank', 'Bank', (app.draft && app.draft.bank) || '—']
  ];
  function render() {
    document.getElementById('rv-fields').innerHTML = FIELDS.map(function (f) {
      var flagged = flags.indexOf(f[0]) > -1;
      return '<tr class="frow" data-f="' + f[0] + '" style="cursor:pointer">' +
        '<td style="width:30%;color:var(--slate);font-weight:600">' + f[1] + '</td>' +
        '<td>' + S.esc(f[2]) + '</td>' +
        '<td style="width:90px;text-align:right"><span class="statuspill ' + (flagged ? 'st-err' : 'st-ok') + '">' + (flagged ? '⚑ flagged' : '✓ ok') + '</span></td></tr>';
    }).join('');
    document.querySelectorAll('.frow').forEach(function (r) {
      r.addEventListener('click', function () {
        var f = r.getAttribute('data-f'), i = flags.indexOf(f);
        if (i > -1) flags.splice(i, 1); else flags.push(f);
        render();
      });
    });
  }
  render();

  function decide(status) {
    app.status = status;
    app.flagged = flags;
    app.notes = document.getElementById('rv-notes').value;
    app.decidedAt = new Date().toISOString();
    S.saveApp(app);
    S.toast(app.ref + ' → ' + status + ' · applicant notified');
    setTimeout(function () { location.href = 'admin-queue.html'; }, 700);
  }
  document.getElementById('rv-approve').addEventListener('click', function () { decide('Approved'); });
  document.getElementById('rv-info').addEventListener('click', function () { decide('More info required'); });
  document.getElementById('rv-reject').addEventListener('click', function () { decide('Rejected'); });
})();
