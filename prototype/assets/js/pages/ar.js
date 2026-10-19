/* Arabic home: trending cards (EN product names per RTL-4 Western-numeral convention) + mini basket */
(function () {
  var go = function () {
    var v = document.getElementById('q-ar').value.trim();
    if (v) location.href = 'search.html#q=' + encodeURIComponent(v);
  };
  document.getElementById('qb-ar').addEventListener('click', go);
  document.getElementById('q-ar').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });

  var picks = ['crucial-t705-ssd-2', 'koorui-27-inch-gaming-monitor', 'samsung-t7-shield-portable-ssd-1tb',
               'ugreen-5-in-1-usb-c-hub', 'kingston-xs1000-1tb-portable-ssd-red'].map(function (s) { return S.product(s); }).filter(Boolean);
  document.getElementById('trending-ar').innerHTML = picks.map(S.card).join('');
  S.bindCards();

  var b = S.basket(), box = document.getElementById('mini-ar');
  box.innerHTML = b.length ? b.slice(0, 4).map(function (i) {
    var p = S.product(i.slug) || {};
    return '<div class="row"><span>' + S.esc((p.name || i.slug).slice(0, 40)) + '</span><b>× ' + i.qty + '</b></div>';
  }).join('') : '<div class="row"><span style="color:#9FB1C6">السلة فارغة — أضف منتجات من الكتالوج</span><b></b></div>';
  S.syncBadge();
})();
