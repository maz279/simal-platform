/* About page: content-package sections (mission/vision/values/leadership) + real testimonial cards */
(function () {
  document.getElementById('mission-txt').textContent = CONTENT.mission;
  document.getElementById('vision-txt').textContent = CONTENT.vision;
  document.getElementById('values-grid').innerHTML = CONTENT.values.map(function (v) {
    return '<div class="card card-p" style="padding:12px 14px"><b style="font-size:13px">' + v[0] + '</b><p class="note" style="margin-top:3px">' + v[1] + '</p></div>';
  }).join('');
  var av = function (name) {
    return name.split(/\s+/).map(function (w) { return w[0]; }).join('').replace(/[^A-Z]/g, '').slice(0, 2);
  };
  document.getElementById('lead-grid').innerHTML = CONTENT.leadership.map(function (l) {
    return '<div class="card card-p" style="display:flex;gap:14px;align-items:center">' +
      '<div class="avatar" style="width:46px;height:46px;border-radius:50%;background:var(--grad-blue-gold);color:#fff;font-weight:800">' + av(l[1]) + '</div>' +
      '<div><b>' + S.esc(l[1]) + '</b><p class="note">' + l[0] + '</p></div></div>';
  }).join('');

  document.getElementById('about-tst').innerHTML = TESTIMONIALS.map(function (t) {
    return '<div class="card card-p" style="margin-bottom:12px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">' +
      '<span style="color:var(--yellow);filter:grayscale(1) brightness(1.6)">★★★★★</span><b style="font-size:13.5px">' + S.esc(t.name) + '</b>' +
      '<span class="note" style="margin-left:auto">' + S.esc(t.role) + '</span></div>' +
      '<p style="font-size:13.5px;color:var(--slate)">\u201C' + S.esc(t.q) + '\u201D</p></div>';
  }).join('');
})();
