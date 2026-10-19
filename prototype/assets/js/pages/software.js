/* Software page: UniERP modules + industries (content package) + 12 services + demo form */
(function () {
  document.getElementById('mod-grid').innerHTML = CONTENT.erpModules.map(function (m) {
    var id = (window.SOFTWARE && SOFTWARE.moduleDetail ? SOFTWARE.moduleDetail : []).reduce(function (acc, d) { return d.name === m[1] ? d.id : acc; }, '');
    return '<a href="software-module.html#' + (id || 'finance') + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="padding:16px 18px;height:100%"><div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FDECEC,#fff);display:grid;place-items:center;font-size:20px">' + m[0] + '</div>' +
      '<h4 style="font-size:15px;margin:10px 0 5px">' + S.esc(m[1]) + '</h4><p style="font-size:12.5px;color:var(--slate)">' + S.esc(m[2]) + '</p>' +
      '<span style="display:block;margin-top:9px;font-size:12px;font-weight:700;color:var(--blue)">Module detail →</span></div></a>';
  }).join('');
  document.getElementById('ind-chips').innerHTML = (window.SOFTWARE ? SOFTWARE.industries : []).map(function (i) {
    return '<a class="chip" href="software-industries.html#' + i.id + '" style="font-size:13px;padding:8px 16px;text-decoration:none">' + i.icon + ' ' + S.esc(i.name) + '</a>';
  }).join('') + '<a class="chip on" href="software-industries.html" style="font-size:13px;padding:8px 16px;text-decoration:none">All 9 verticals →</a>';

  // pricing packages (content §06-22)
  document.getElementById('price-grid').innerHTML = CONTENT.erpPricing.map(function (p, i) {
    return '<div class="card card-p" style="' + (i === 1 ? 'border-top:4px solid var(--blue);' : '') + '">' +
      '<span class="badge ' + (i === 1 ? 'b-blue' : 'b-line') + '">' + p.t + (i === 1 ? ' — most chosen' : '') + '</span>' +
      '<p style="font-size:13px;color:var(--slate);margin-top:10px"><b>Best for:</b> ' + S.esc(p.best) + '</p>' +
      '<div class="timeline" style="margin-top:8px">' +
      '<div class="tl"><b>Implementation</b><span>' + p.impl + '</span></div>' +
      '<div class="tl"><b>Users</b><span>' + p.users + ' — $0 per user</span></div></div>' +
      '<a class="btn ' + (i === 1 ? 'btn-p' : 'btn-o') + ' btn-sm" style="margin-top:12px" href="#demo">Request ' + p.t + ' proposal →</a></div>';
  }).join('');

  // 7-phase implementation (content §06-21)
  document.getElementById('impl-tl').innerHTML = CONTENT.implPhases.map(function (ph) {
    return '<div class="tl"><b>' + ph[0] + '</b><span>' + ph[1] + '</span></div>';
  }).join('');

  // ROI calculator (content §06-20)
  document.getElementById('r-go').addEventListener('click', function () {
    var users = Math.max(1, +document.getElementById('r-users').value || 1);
    var lic = Math.max(0, +document.getElementById('r-lic').value || 0);
    var itH = Math.max(0, +document.getElementById('r-it').value || 0);
    var manH = Math.max(0, +document.getElementById('r-man').value || 0);
    var rate = 25; // blended $/h (stated assumption)
    var licSave = lic * users * 12;                       // $0/user licensing
    var itSave = itH * 12 * rate * 0.35;                  // 35% admin automation
    var manSave = manH * 12 * rate * 0.45;                // 45% process automation
    var total = Math.round(licSave + itSave + manSave);
    document.getElementById('r-total').textContent = '$' + total.toLocaleString();
    document.getElementById('r-3yr').textContent = '$' + Math.round(total * 3).toLocaleString();
    document.getElementById('r-break').innerHTML =
      '<div class="tl"><b>License elimination</b><span>$' + Math.round(licSave).toLocaleString() + ' / yr</span></div>' +
      '<div class="tl"><b>IT admin automation (35%)</b><span>$' + Math.round(itSave).toLocaleString() + ' / yr</span></div>' +
      '<div class="tl"><b>Process automation (45%)</b><span>$' + Math.round(manSave).toLocaleString() + ' / yr</span></div>';
    S.toast('ROI estimated — ' + document.getElementById('r-ind').value + ', ' + document.getElementById('r-size').value + ' staff');
  });

  // engineering services = the 12 software practices (uslbd.com/services), linked to their detail page
  document.getElementById('svc-grid').innerHTML = (window.SOFTWARE ? SOFTWARE.services : []).map(function (s) {
    return '<a href="software-services.html#' + s.id + '" style="text-decoration:none;color:inherit"><div class="card card-p" style="padding:16px 18px;height:100%">' +
      '<div style="font-size:22px">' + s.icon + '</div>' +
      '<h4 style="font-size:15px;margin:8px 0 5px">' + S.esc(s.name) + '</h4>' +
      '<p style="font-size:12.5px;color:var(--slate)">' + S.esc(s.tag) + '</p>' +
      '<span style="display:block;margin-top:9px;font-size:12px;font-weight:700;color:var(--blue)">Detail →</span></div></a>';
  }).join('');

  document.getElementById('d-go').addEventListener('click', function () {
    var m = document.getElementById('d-mail').value.trim();
    var w = document.getElementById('d-what').value;
    var e = document.getElementById('d-err');
    if (!S.v.email(m)) { e.hidden = false; e.textContent = '⚠ Enter a valid work email.'; return; }
    if (!w) { e.hidden = false; e.textContent = '⚠ Pick what we should demo.'; return; }
    if (!document.getElementById('d-ok').checked) { e.hidden = false; e.textContent = '⚠ Consent is required.'; return; }
    e.hidden = true;
    var leads = S.ls('demoLeads', []);
    leads.unshift({ email: m, what: w, at: new Date().toISOString() });
    S.save('demoLeads', leads);
    S.toast('Demo requested — slot confirmation sent to ' + m);
    document.getElementById('d-mail').value = ''; document.getElementById('d-what').value = '';
  });
})();
