/* Compare page: preset SSD tier table (content §03-83) + dynamic 4-SKU comparison */
(function () {
  // preset: real numbers from the content package
  var tiers = {
    head: ['Feature', 'Crucial P3', 'Crucial P3 Plus', 'Crucial T500', 'Crucial T700'],
    rows: [
      ['Interface', 'PCIe Gen3', 'PCIe Gen4', 'PCIe Gen4', 'PCIe Gen5'],
      ['Max read', '3,500 MB/s', '5,000 MB/s', '7,400 MB/s', '12,400 MB/s'],
      ['Max write', '3,000 MB/s', '4,200 MB/s', '7,000 MB/s', '10,000 MB/s'],
      ['NAND type', 'QLC', 'QLC', 'TLC', 'TLC'],
      ['Best for', 'Everyday upgrades', 'Value gaming builds', 'Performance mainstream', 'Enthusiast / pro workloads']
    ],
    links: ['crucial-p3-ct1000p3ssd8', 'crucial-p3-plus-ct1000p3pssd8', 'crucial-t500-ct1000t500ssd8', 'crucial-t700-ssd-ct1000t700ssd5']
  };
  document.getElementById('tier-tbl').innerHTML =
    '<tr>' + tiers.head.map(function (h, i) { return '<th' + (i ? ' style="text-align:center"' : '') + '>' + h + '</th>'; }).join('') + '</tr>' +
    tiers.rows.map(function (r) {
      return '<tr><td><b>' + r[0] + '</b></td>' + r.slice(1).map(function (c, i) {
        return '<td style="text-align:center;' + (i === 3 ? 'background:var(--blue-050);font-weight:700;color:var(--blue)' : '') + '">' + c + '</td>';
      }).join('') + '</tr>';
    }).join('') +
    '<tr><td><b>Open SKU</b></td>' + tiers.links.map(function (slug) {
      return '<td style="text-align:center"><a class="btn btn-o btn-sm" href="product.html#' + slug + '">View →</a></td>';
    }).join('') + '</tr>';

  // dynamic picker: 4 selects
  var pick = document.getElementById('pick-grid');
  pick.innerHTML = [0, 1, 2, 3].map(function (i) {
    return '<select class="in cmp-sel" data-i="' + i + '"><option value="">— Slot ' + (i + 1) + ' —</option>' +
      CATALOG.map(function (p) { return '<option value="' + p.slug + '">' + S.esc(p.name).slice(0, 52) + '</option>'; }).join('') + '</select>';
  }).join('');

  function render() {
    var slugs = [];
    document.querySelectorAll('.cmp-sel').forEach(function (s) { if (s.value) slugs.push(s.value); });
    slugs = Array.from(new Set(slugs)).slice(0, 4);
    var note = document.getElementById('cmp-note');
    var box = document.getElementById('cmp-result');
    if (!slugs.length) {
      note.textContent = '';
      box.innerHTML = '<div class="empty">Pick one to four SKUs above — the comparison renders here.</div>';
      return;
    }
    note.textContent = slugs.length + ' of 4 slots used';
    var ps = slugs.map(function (s) { return S.product(s); }).filter(Boolean);
    var row = function (label, fn) {
      return '<tr><td style="width:16%;color:var(--slate);font-weight:600">' + label + '</td>' + ps.map(fn).join('') + '</tr>';
    };
    box.innerHTML = '<div class="card card-p" style="padding:0;overflow-x:auto"><table class="tbl">' +
      row('', function (p) {
        return '<td style="text-align:center;padding:14px 10px">' + (p.img[0] ? '<img src="' + p.img[0] + '" style="height:86px;object-fit:contain;display:block;margin:0 auto 8px" alt="">' : '') +
          '<b style="font-size:13px;display:block;max-width:210px;margin:0 auto">' + S.esc(p.name) + '</b></td>';
      }) +
      row('Brand', function (p) { return '<td style="text-align:center"><a href="brand.html#' + p.brand + '">' + S.esc(p.brand) + '</a></td>'; }) +
      row('Category', function (p) { return '<td style="text-align:center">' + S.esc(p.catLabel || p.cat) + '</td>'; }) +
      row('SKU', function (p) { return '<td style="text-align:center;font-family:Consolas,monospace;font-size:12px">' + S.esc(p.sku || '—') + '</td>'; }) +
      row('Stock', function (p) { return '<td style="text-align:center"><span class="statuspill ' + (p.stock ? 'st-ok' : 'st-warn') + '">' + (p.stock ? 'In stock' : 'On order') + '</span></td>'; }) +
      row('Highlights', function (p) { return '<td style="font-size:12.5px;color:var(--slate);text-align:center">' + S.esc((p.specs || []).join(' · ') || p.short) + '</td>'; }) +
      row('', function (p) { return '<td style="text-align:center"><button class="btn btn-p btn-sm add-rfq" data-slug="' + p.slug + '">Add to RFQ</button></td>'; }) +
      '</table></div>';
    S.bindCards(box);
  }

  document.querySelectorAll('.cmp-sel').forEach(function (s) { s.addEventListener('change', render); });
  document.getElementById('cmp-go').addEventListener('click', function () {
    render();
    document.getElementById('cmp-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  render();
})();
