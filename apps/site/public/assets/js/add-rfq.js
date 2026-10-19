/* add-rfq.js — rm(3.3): shared 'Add to RFQ' handler (was per-page inline <script>).
 * Works for any element with class add-rfq carrying data-slug.
 * rm(10.x deploy audit): the rm(3.3) version bound buttons once at load, so cards that
 * islands re-render (recently viewed) were dead; it never refreshed the header #rfqCount
 * badge; it wrote English labels on Arabic pages; and the AR home mini basket (#mini-ar)
 * lost its sync. Delegated, language-aware, and it refreshes every basket summary. */
(function () {
  var ar = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('ar') === 0;
  var T = ar
    ? { add: 'أضف للطلب', added: 'تم الإضافة ✓', failed: 'تعذّرت الإضافة — راسل المبيعات', network: 'خطأ في الشبكة', toast: 'تمت إضافة المنتج إلى سلة طلبات الأسعار ✓', empty: 'السلة فارغة — أضف منتجات من الكتالوج' }
    : { add: 'Add to RFQ', added: 'Added ✓', failed: 'Failed — email sales', network: 'Network error', toast: 'Added to RFQ basket ✓', empty: '' };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  function renderSummaries(j) {
    var total = (j && j.totalQty) || 0;
    var hc = document.getElementById('rfqCount');
    if (hc) hc.textContent = String(total);
    var mc = document.getElementById('mini-count');
    if (mc) mc.textContent = total + ' item' + (total === 1 ? '' : 's');
    var box = document.getElementById('mini-ar');
    var items = (j && (j.basket || j.items)) || [];
    if (box) {
      box.innerHTML = items.length
        ? items.slice(0, 4).map(function (i) { return '<div class="row"><span>' + esc(String(i.name || i.slug).slice(0, 40)) + '</span><b>× ' + esc(i.qty) + '</b></div>'; }).join('')
        : '<div class="row"><span style="color:#9FB1C6">' + esc(T.empty) + '</span><b></b></div>';
    }
  }
  function refresh() {
    return fetch('/api/rfq-basket').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) renderSummaries(j); }).catch(function () {});
  }

  document.addEventListener('click', async function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.add-rfq') : null;
    if (!btn) return;
    e.preventDefault();
    var slug = btn.getAttribute('data-slug');
    if (!slug || btn.disabled) return;
    btn.disabled = true;
    try {
      var res = await fetch('/api/rfq-basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug, qty: 1 })
      });
      if (res.ok) {
        btn.textContent = T.added;
        if (window.showToast) window.showToast(T.toast, 'ok');
        await refresh();
      } else {
        btn.textContent = T.failed;
      }
    } catch (err) {
      btn.textContent = T.network;
    }
    setTimeout(function () { btn.textContent = T.add; btn.disabled = false; }, 1800);
  });

  /* the AR home hero card lists the basket; the header badge is set by BaseLayout */
  if (document.getElementById('mini-ar')) refresh();
})();
