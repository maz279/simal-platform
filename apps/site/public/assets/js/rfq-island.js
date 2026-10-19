(function () {
  var el = document.getElementById('rfq-island-data');
  if (!el) return;
  var catalogNames = JSON.parse(el.textContent);
    /* RFQ island — ported from Prototype rfq.js, re-based on the server basket
     * (ADR-2). name/label → slug resolution keeps the picker human-typed friendly. */
    const $ = (id) => document.getElementById(id);
    let basket = [];
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    async function api(method, path, body) {
      const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => null);
      return { ok: r.ok, status: r.status, j };
    }

    function render() {
      const el = $('basket-tbl');
      if (!basket.length) {
        el.innerHTML = '<div class="empty" style="padding:30px 16px">Basket is empty — add SKUs above, or add them from any product page.</div>';
      } else {
        el.innerHTML = '<table class="tbl"><tr><th>Product</th><th style="text-align:center">Qty</th><th>Pricing</th><th></th></tr>' +
          basket.map(b => '<tr><td><b>' + esc(b.name || b.slug) + '</b><br><span style="font-size:11.5px;color:var(--slate-500)">' + esc(b.brand) + ' · ' + esc(b.slug) + '</span></td>' +
            '<td style="text-align:center"><div class="qty" style="margin:0 auto"><button data-dec="' + b.slug + '" aria-label="Decrease quantity">−</button><input value="' + b.qty + '" data-qty="' + b.slug + '" inputmode="numeric" aria-label="Quantity for ' + esc(b.name || b.slug) + '"><button data-inc="' + b.slug + '" aria-label="Increase quantity">+</button></div></td>' +
            '<td><span class="price">RFQ · no list price</span></td>' +
            '<td><button class="btn btn-g btn-sm" data-rm="' + b.slug + '">Remove</button></td></tr>').join('') + '</table>';
        el.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => change(b.dataset.inc, +1));
        el.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => change(b.dataset.dec, -1));
        el.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
          const line = basket.find(x => x.slug === b.dataset.rm);
          if (line) await api('POST', '/api/rfq-basket', { slug: line.slug, qty: -(line.qty) - 1 });
          await refresh();
        });
        el.querySelectorAll('[data-qty]').forEach(inp => inp.addEventListener('change', async () => {
          const line = basket.find(x => x.slug === inp.dataset.qty);
          const want = Math.max(1, +inp.value || 1);
          if (line) await api('POST', '/api/rfq-basket', { slug: line.slug, qty: want - line.qty });
          await refresh();
        }));
      }
    }

    async function refresh() {
      const { j } = await api('GET', '/api/rfq-basket');
      basket = (j && j.basket) || [];
      render();
      const c = document.getElementById('rfqCount');
      if (c) c.textContent = String((j && j.totalQty) || 0);
    }

    async function change(slug, delta) {
      const line = basket.find(x => x.slug === slug);
      if (line) await api('POST', '/api/rfq-basket', { slug, qty: delta });
      await refresh();
    }

    const slugOf = (typed) => {
      const t = typed.trim().toLowerCase();
      const hit = catalogNames.find(x => x.slug === t || x.label === t || x.label.split(' — ')[0] === t);
      return hit ? hit.slug : t;
    };

    $('addForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const { ok, j } = await api('POST', '/api/rfq-basket', { slug: slugOf($('slugInput').value), qty: Math.max(1, +$('qtyInput').value || 1) });
      if (ok) { $('addForm').reset(); $('qtyInput').value = 1; }
      else { $('f-err').hidden = false; $('f-err').textContent = (j && j.error) || 'Add failed'; setTimeout(() => $('f-err').hidden = true, 2500); }
      await refresh();
    });

    $('f-submit').addEventListener('click', async () => {
      const err = $('f-err');
      err.hidden = true;
      const email = $('f-email').value.trim(), co = $('f-co').value.trim(), name = $('f-name').value.trim(), phone = $('f-phone').value.trim();
      if (!basket.length) { err.hidden = false; err.textContent = 'Basket is empty — add at least one SKU.'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.hidden = false; err.textContent = 'A valid work email is required.'; $('f-email').focus(); return; }
      if (co.length < 2) { err.hidden = false; err.textContent = 'Company name is required.'; $('f-co').focus(); return; }
      if (name.length < 2) { err.hidden = false; err.textContent = 'Contact person is required.'; $('f-name').focus(); return; }
      if (phone.length < 6) { err.hidden = false; err.textContent = 'Phone / WhatsApp is required.'; $('f-phone').focus(); return; }
      if (!$('f-consent').checked) { err.hidden = false; err.textContent = 'Please accept the PDPL privacy notice.'; return; }
      const b = $('f-submit'); b.textContent = 'Submitting…'; b.disabled = true;
      const { ok, j } = await api('POST', '/api/rfq', { email, company: co, contactName: name, phone });
      b.disabled = false; b.textContent = 'Submit RFQ →';
      if (ok && j && j.reference) {
        $('done-ref').textContent = j.reference;
        $('done-mail').textContent = email;
        $('rfq-step-1').hidden = true;
        $('rfq-step-2').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await refresh();
      } else { err.hidden = false; err.textContent = (j && j.error) || 'Submit failed — try again shortly.'; }
    });

    $('again').addEventListener('click', () => { $('rfq-step-2').hidden = true; $('rfq-step-1').hidden = false; });

    $('f-wa').addEventListener('click', (e) => {
      const lines = basket.map(b => '• ' + (b.name || b.slug) + ' × ' + b.qty).join('\n');
      const who = ($('f-name').value.trim() || 'RFQ enquiry') + ($('f-co').value.trim() ? ' — ' + $('f-co').value.trim() : '');
      e.target.href = 'https://wa.me/971508487861?text=' + encodeURIComponent('Simal RFQ from ' + who + '\n\n' + (lines || '(basket is empty — tell us what you need)'));
      window.open(e.target.href, '_blank');
    });

    refresh();
  
})();