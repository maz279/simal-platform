/* Admin queue: live applications from localStorage, SLA aging, data-quality donut */
(function () {
  var apps = S.apps();
  var open = apps.filter(function (a) { return a.status !== 'Approved'; });
  document.getElementById('n-queue').textContent = open.length;
  document.getElementById('k-open').textContent = open.length;
  document.getElementById('k-sla').textContent = open.filter(function (a) { return a.sla >= 3; }).length;
  document.getElementById('k-ok').textContent = apps.filter(function (a) { return a.status === 'Approved'; }).length;
  var badTrn = open.filter(function (a) { return !S.v.trn(a.trn || ''); });
  document.getElementById('k-trn').textContent = badTrn.length;

  var ok = 0, bad = 0, miss = 0;
  apps.forEach(function (a) {
    if (!S.v.trn(a.trn || '')) bad++;
    else if (!a.peppol) miss++;
    else ok++;
  });
  document.getElementById('dq-ok').textContent = ok;
  document.getElementById('dq-bad').textContent = bad;
  document.getElementById('dq-miss').textContent = miss;
  document.getElementById('dq-score').textContent = apps.length ? Math.round(100 * ok / apps.length) + '%' : '—';

  var pill = function (st) {
    return st === 'Approved' ? '<span class="statuspill st-ok">Approved</span>'
      : st === 'More info required' ? '<span class="statuspill st-err">More info</span>'
      : '<span class="statuspill st-info">In review</span>';
  };
  var slaMark = function (a) {
    if (a.status === 'Approved') return '<span class="statuspill st-ok">closed</span>';
    if (a.sla >= 3) return '<span class="statuspill st-err">' + a.sla + 'd — SLA!</span>';
    return '<span class="statuspill st-warn">' + a.sla + 'd</span>';
  };
  document.getElementById('qtbl').innerHTML =
    '<tr><th>Ref</th><th>Company</th><th>Status</th><th>SLA age</th><th>TRN</th><th>Docs</th><th></th></tr>' +
    apps.map(function (a) {
      var docs = (a.docs.licence ? '✓' : '○') + (a.docs.passport ? '✓' : '○') + (a.docs.bank ? '✓' : '○');
      return '<tr style="border-left:4px solid ' + (a.status === 'Approved' ? 'var(--ok)' : a.sla >= 3 ? 'var(--red)' : 'var(--blue)') + '">' +
        '<td style="font-family:Consolas,monospace;font-size:12px">' + a.ref + '</td>' +
        '<td><b>' + S.esc(a.company) + '</b><div class="note">' + S.esc(a.email) + '</div></td>' +
        '<td>' + pill(a.status) + '</td><td>' + slaMark(a) + '</td>' +
        '<td style="font-family:Consolas,monospace;font-size:12px">' + (S.v.trn(a.trn || '') ? '<span style="color:var(--ok)">✓</span> ' + a.trn : '<span style="color:var(--red)">✕ ' + (a.trn || '—') + '</span>') + '</td>' +
        '<td style="letter-spacing:2px">' + docs + '</td>' +
        '<td><a class="btn btn-sm btn-p" href="admin-review.html#' + a.ref + '">Review →</a></td></tr>';
    }).join('');

  document.getElementById('seed-reset').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('simal.apps');
    S.apps(); // reseeds
    S.toast('Demo applications reset');
    setTimeout(function () { location.reload(); }, 500);
  });
})();
