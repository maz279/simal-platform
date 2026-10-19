/* Software products catalog: 20 Unisoft-built products, filterable */
(function () {
  // stats strip
  document.getElementById('stats-strip').innerHTML = SOFTWARE.stats.map(function (s) {
    return '<div class="c"><span class="n">' + s[0] + '</span><span class="l">' + s[1] + '</span></div>';
  }).join('');

  var grid = document.getElementById('product-grid');
  var filterBox = document.getElementById('filters');
  var filters = [['all', 'All 20'], ['erp', 'ERP solutions (10)'], ['spec', 'Specialized systems (10)'], ['star', '★ GCC lead lines']];
  var active = 'all';

  function card(p) {
    // reverse map: which industry verticals use this product (no dead ends, both directions)
    var usedIn = SOFTWARE.industries.filter(function (i) { return i.products.indexOf(p.id) > -1; });
    return '<div class="card card-p" id="' + p.id + '" style="' + (p.star ? 'border-top:4px solid var(--blue);' : '') + '">' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="width:46px;height:46px;border-radius:12px;background:var(--blue-050);display:grid;place-items:center;font-size:21px;flex:none">' + p.icon + '</div>' +
      '<div><h4 style="font-size:16px;margin:2px 0 4px"><a href="software-solution.html#' + p.id + '" style="color:inherit;text-decoration:none">' + S.esc(p.name) + '</a>' + (p.star ? ' <span class="badge b-blue" style="font-size:10px">GCC lead</span>' : '') + '</h4>' +
      '<p style="font-size:11.5px;font-weight:700;color:var(--blue);margin:0 0 5px">' + S.esc(p.target) + '</p></div></div>' +
      '<p style="font-size:13px;color:var(--slate);margin:10px 0 8px">' + S.esc(p.desc) + '</p>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap">' + p.feats.map(function (f) {
        return '<span class="chip" style="font-size:11.5px;padding:4px 10px">' + S.esc(f) + '</span>';
      }).join('') + '</div>' +
      (usedIn.length ? '<div style="margin-top:10px;font-size:12px;color:var(--slate-500)">Used in: ' + usedIn.map(function (i) {
        return '<a href="software-industry.html#' + i.id + '" style="color:var(--blue);font-weight:600;text-decoration:none">' + i.icon + ' ' + S.esc(i.name) + '</a>';
      }).join(' · ') + '</div>' : '') +
      '<div style="display:flex;gap:9px;margin-top:13px;flex-wrap:wrap">' +
      '<a class="btn btn-p btn-sm" href="software-solution.html#' + p.id + '">Solution detail →</a>' +
      '<a class="btn btn-o btn-sm" href="software.html#demo">Enquire / demo</a></div></div>';
  }

  function render() {
    var list = SOFTWARE.products.filter(function (p) {
      return active === 'all' || (active === 'star' ? p.star : p.grp === active);
    });
    grid.innerHTML = list.map(card).join('');
    filterBox.innerHTML = filters.map(function (f) {
      return '<span class="chip' + (f[0] === active ? ' on' : '') + '" data-f="' + f[0] + '" style="cursor:pointer;font-size:13px;padding:8px 16px">' + f[1] + '</span>';
    }).join('');
    filterBox.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () { active = c.getAttribute('data-f'); render(); });
    });
  }
  render();

  // deep link: #unipos etc. scrolls to product
  if (location.hash.length > 1) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.transition = 'box-shadow .4s'; el.style.boxShadow = '0 0 0 3px var(--g3)'; }, 300);
  }
})();
