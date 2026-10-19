/* Careers: real job codes (content §09-02) + application form */
(function () {
  var icons = { 'Sales & BD': '📈', 'Product': '🏷️', 'Supply Chain': '🚚', Marketing: '📣', Finance: '💰', 'HR & Admin': '🧑' };
  document.getElementById('role-grid').innerHTML = CONTENT.jobs.map(function (j) {
    return '<div class="card card-p"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<span class="badge b-blue">' + j[2] + '</span><span class="badge b-line">Dubai, UAE</span>' +
      '<span style="margin-left:auto;font-family:Consolas,monospace;font-size:11.5px;color:var(--slate-500)">' + j[0] + '</span></div>' +
      '<h4 style="font-size:16px;margin:10px 0 4px">' + S.esc(j[1]) + '</h4>' +
      '<p style="color:var(--slate);font-size:13px">' + (icons[j[2]] || '💼') + ' Full-time · ' + j[3] + ' experience · posted 2026</p>' +
      '<button class="btn btn-o btn-sm apply" style="margin-top:12px" data-r="' + S.esc(j[1]) + '">Apply for this role →</button></div>';
  }).join('');
  document.querySelectorAll('.apply').forEach(function (b) {
    b.addEventListener('click', function () {
      var sel = document.getElementById('j-role');
      var want = b.getAttribute('data-r');
      var hit = Array.from(sel.options).filter(function (o) { return o.text === want; })[0];
      if (!hit) { hit = document.createElement('option'); hit.text = want; sel.add(hit); }
      sel.value = hit.value || hit.text;
      document.getElementById('j-name').focus();
      window.scrollTo({ top: document.getElementById('j-name').getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
      S.toast('Role preselected: ' + want);
    });
  });

  document.getElementById('j-go').addEventListener('click', function () {
    var nm = document.getElementById('j-name').value.trim();
    var em = document.getElementById('j-email').value.trim();
    var e = document.getElementById('j-err'), d = document.getElementById('j-done');
    e.hidden = true; d.hidden = true;
    if (!nm) { e.hidden = false; e.textContent = '⚠ Name is required.'; return; }
    if (!S.v.email(em)) { e.hidden = false; e.textContent = '⚠ Enter a valid email.'; return; }
    if (!document.getElementById('j-ok').checked) { e.hidden = false; e.textContent = '⚠ Consent is required.'; return; }
    var apps = S.ls('jobApps', []);
    apps.unshift({ ref: S.uid('APP'), name: nm, email: em, role: document.getElementById('j-role').value || 'General', at: new Date().toISOString() });
    S.save('jobApps', apps);
    d.hidden = false;
    d.innerHTML = '<b>Application received ✓</b> — HR responds within 5 business days. Confirmation sent to ' + S.esc(em) + '.';
    S.toast('Application submitted');
    document.getElementById('j-why').value = '';
  });
})();
