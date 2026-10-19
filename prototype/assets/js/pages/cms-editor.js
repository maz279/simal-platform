/* CMS editor: pick any of 81 SKUs, edit EN/AR, save overrides (live on product page),
   revert to mirror original. RTL live preview. */
(function () {
  var slug = decodeURIComponent(location.hash.replace('#', '')) || 'crucial-t705-ssd-2';
  var p = S.product(slug) || CATALOG[0];
  slug = p.slug;

  function fillList(filter) {
    var f = (filter || '').toLowerCase();
    document.getElementById('pick-list').innerHTML = CATALOG.filter(function (x) {
      return !f || (x.name + ' ' + x.sku).toLowerCase().indexOf(f) > -1;
    }).slice(0, 30).map(function (x) {
      return '<a href="#' + x.slug + '" data-s="' + x.slug + '" class="pk' + (x.slug === slug ? ' on' : '') + '" style="display:block;color:' + (x.slug === slug ? 'var(--g2)' : '#8CA2BC') + ';text-decoration:none;padding:5px 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + S.esc(x.name) + '</a>';
    }).join('');
    document.querySelectorAll('.pk').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); location.hash = a.getAttribute('data-s'); });
    });
  }
  fillList();
  document.getElementById('pick').addEventListener('input', function () { fillList(this.value); });

  function load() {
    var o = S.cmsFor(slug) || {};
    document.getElementById('ed-title').textContent = 'Editing: ' + (o.name_en || p.name).slice(0, 46);
    document.getElementById('ed-sub').textContent = slug;
    document.getElementById('f-name-en').value = o.name_en || p.name;
    document.getElementById('f-desc-en').value = o.desc_en || p.desc || p.short;
    document.getElementById('f-sku').value = p.sku || '—';
    document.getElementById('f-name-ar').value = o.name_ar || '';
    document.getElementById('f-desc-ar').value = o.desc_ar || '';
    pv();
    fillList(document.getElementById('pick').value);
  }
  function pv() {
    document.getElementById('pv-name-ar').textContent = document.getElementById('f-name-ar').value || '(الاسم العربي)';
    document.getElementById('pv-desc-ar').textContent = document.getElementById('f-desc-ar').value || 'سيظهر الوصف العربي هنا أثناء الكتابة.';
    document.getElementById('pv-name-en').textContent = document.getElementById('f-name-en').value;
    document.getElementById('pv-sku').textContent = p.sku || '—';
    var im = document.getElementById('pv-img');
    if (p.img.length) { im.src = p.img[0]; im.style.display = ''; } else im.style.display = 'none';
    document.getElementById('pv-open').href = 'product.html#' + slug;
  }
  ['f-name-ar', 'f-desc-ar', 'f-name-en'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', pv);
  });

  document.querySelectorAll('.mini-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.mini-tabs button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var ar = b.getAttribute('data-lang') === 'ar';
      document.getElementById('pane-ar').hidden = !ar;
      document.getElementById('f-name-en').parentElement.hidden = ar;
      document.getElementById('f-desc-en').parentElement.hidden = ar;
      document.getElementById('f-sku').parentElement.hidden = ar;
    });
  });

  document.getElementById('ed-save').addEventListener('click', function () {
    S.cmsSave(slug, {
      name_en: document.getElementById('f-name-en').value.trim() || p.name,
      desc_en: document.getElementById('f-desc-en').value.trim(),
      name_ar: document.getElementById('f-name-ar').value.trim(),
      desc_ar: document.getElementById('f-desc-ar').value.trim(),
      savedAt: new Date().toISOString()
    });
    S.toast('Saved — live on the public product page');
    load();
  });
  document.getElementById('ed-revert').addEventListener('click', function () {
    var c = S.cms(); delete (c.products || {})[slug];
    S.save('cms', c);
    S.toast('Reverted to mirror original');
    load();
  });

  window.addEventListener('hashchange', function () {
    slug = decodeURIComponent(location.hash.replace('#', '')) || slug;
    var np = S.product(slug);
    if (np) { p = np; slug = np.slug; load(); }
  });

  load();
})();
