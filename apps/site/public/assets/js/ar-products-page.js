/* ar-products-page.js — /ar/products/ category buttons and brand chips. rm(3.3) dropped
 * the page's <script> (21fbd73) and kept only Add-to-RFQ, so every filter button was
 * dead (clicking "الشاشات" still showed all products). Restored from 21fbd73^ as plain JS,
 * with aria-pressed state so assistive tech hears which filter is active. */
(function () {
  var prods = Array.prototype.slice.call(document.querySelectorAll('#pgrid .prod'));
  if (!prods.length) return;
  var countVisible = document.getElementById('count-visible');
  var activeCat = '', activeBrand = '';

  function filterGrid() {
    var count = 0;
    prods.forEach(function (el) {
      var show = (!activeCat || el.getAttribute('data-cat') === activeCat) &&
        (!activeBrand || el.getAttribute('data-brand') === activeBrand);
      el.style.display = show ? 'flex' : 'none';
      if (show) count++;
    });
    if (countVisible) countVisible.textContent = String(count);
  }

  var catBtns = Array.prototype.slice.call(document.querySelectorAll('.cat-btn'));
  catBtns.forEach(function (btn) {
    btn.setAttribute('aria-pressed', btn.classList.contains('btn-p') ? 'true' : 'false');
    btn.addEventListener('click', function () {
      catBtns.forEach(function (b) { b.classList.remove('btn-p'); b.classList.add('btn-o'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.remove('btn-o'); btn.classList.add('btn-p'); btn.setAttribute('aria-pressed', 'true');
      activeCat = btn.getAttribute('data-cat') || '';
      filterGrid();
    });
  });

  var brandBtns = Array.prototype.slice.call(document.querySelectorAll('.brand-btn'));
  brandBtns.forEach(function (btn) {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var wasOn = btn.classList.contains('on');
      brandBtns.forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
      if (!wasOn) { btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); }
      activeBrand = wasOn ? '' : (btn.getAttribute('data-brand') || '');
      filterGrid();
    });
  });

  /* deep link: /ar/products/#monitors selects that category */
  var hash = (location.hash || '').replace('#', '');
  var target = catBtns.find(function (b) { return b.getAttribute('data-cat') === hash; });
  if (target) target.click();
})();
