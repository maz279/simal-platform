/* RFQ flow: basket table with qty steppers, validated submit, reference issue */
(function () {
  function render() {
    var b = S.basket();
    var el = document.getElementById('basket-tbl');
    if (!b.length) {
      el.innerHTML = '<div class="empty">Your RFQ basket is empty.<br><br><a class="btn btn-p" href="category.html">Browse the catalog</a></div>';
      return;
    }
    el.innerHTML = '<table class="tbl"><tr><th>SKU</th><th>Product</th><th style="text-align:center">Qty</th><th></th></tr>' +
      b.map(function (i) {
        var p = S.product(i.slug) || { name: i.slug, sku: '' };
        return '<tr><td style="font-family:Consolas,monospace;font-size:12px">' + S.esc(p.sku || '—') + '</td>' +
          '<td><a href="product.html#' + i.slug + '" style="color:inherit;font-weight:600">' + S.esc(p.name) + '</a></td>' +
          '<td style="text-align:center"><div class="qty" style="margin:auto"><button data-d="-1" data-s="' + i.slug + '">−</button><input value="' + i.qty + '" data-q="' + i.slug + '" inputmode="numeric"><button data-d="1" data-s="' + i.slug + '">+</button></div></td>' +
          '<td><button class="btn btn-o btn-sm" data-rm="' + i.slug + '" title="Remove">✕</button></td></tr>';
      }).join('') + '</table>';
    el.querySelectorAll('[data-d]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-s'), cur = 0;
        S.basket().forEach(function (i) { if (i.slug === slug) cur = i.qty; });
        S.setQty(slug, cur + (+btn.getAttribute('data-d')));
        render();
      });
    });
    el.querySelectorAll('[data-q]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        S.setQty(inp.getAttribute('data-q'), Math.max(0, +inp.value || 0));
        render();
      });
    });
    el.querySelectorAll('[data-rm]').forEach(function (btn) {
      btn.addEventListener('click', function () { S.setQty(btn.getAttribute('data-rm'), 0); render(); });
    });
  }
  render();

  var err = function (msg) {
    var e = document.getElementById('f-err');
    e.hidden = false; e.textContent = '⚠ ' + msg;
    e.style.color = 'var(--red)';
    S.toast(msg, 'err');
  };

  document.getElementById('f-submit').addEventListener('click', function () {
    if (!S.basket().length) return err('Your basket is empty.');
    var co = document.getElementById('f-co').value.trim();
    var nm = document.getElementById('f-name').value.trim();
    var em = document.getElementById('f-email').value.trim();
    var ph = document.getElementById('f-phone').value.trim();
    var trn = document.getElementById('f-trn').value.trim();
    if (!co) return err('Company name is required.');
    if (!nm) return err('Contact person is required.');
    if (!S.v.email(em)) return err('Enter a valid work email.');
    if (!S.v.phone(ph)) return err('Enter a valid phone number.');
    if (trn && !S.v.trn(trn)) return err('TRN must be exactly 15 digits (UAE format).');
    if (!document.getElementById('f-consent').checked) return err('Consent is required to process the enquiry.');
    var rfq = S.submitRfq({
      company: co, contact: nm, email: em, phone: ph, trn: trn || null,
      city: document.getElementById('f-city').value.trim(),
      notes: document.getElementById('f-notes').value.trim(),
      items: S.basket().map(function (i) {
        var p = S.product(i.slug) || {};
        return { slug: i.slug, name: p.name || i.slug, sku: p.sku, qty: i.qty };
      })
    });
    document.getElementById('rfq-step-1').hidden = true;
    document.getElementById('rfq-step-2').hidden = false;
    document.getElementById('done-ref').textContent = rfq.ref;
    document.getElementById('done-mail').textContent = rfq.email;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('f-wa').addEventListener('click', function (e) {
    e.preventDefault();
    var b = S.basket();
    if (!b.length) return err('Add SKUs before handing off to WhatsApp.');
    var lines = b.map(function (i) {
      var p = S.product(i.slug) || {};
      return '• ' + (p.name || i.slug) + ' (SKU ' + (p.sku || '—') + ') × ' + i.qty;
    });
    this.href = 'https://wa.me/971508487861?text=' + encodeURIComponent('Simal RFQ handoff:\n' + lines.join('\n') + '\n\nCompany: ' + (document.getElementById('f-co').value || '—'));
    window.open(this.href, '_blank');
  });
})();
