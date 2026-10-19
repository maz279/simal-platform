// Read-only WCAG 1.4.3 contrast scan of rendered text on the public site (:8100).
// Background = first opaque ancestor background-color; elements over gradients/images are skipped (unknown).
const { chromium } = require('./pw.cjs');
const PAGES = ['/', '/products/', '/products/crucial-t705-ssd/', '/rfq/', '/contact/', '/careers/', '/software/', '/solutions/', '/about/'];
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const all = [];
  for (const path of PAGES) {
    await p.goto('http://127.0.0.1:8100' + path, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    const res = await p.evaluate(() => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(s => parseFloat(s)); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none') return 'IMG'; const c = parse(cs.backgroundColor); if (c && c.a > 0.95) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
      const out = { checked: 0, unknown: 0, fails: [] };
      const seen = new Set();
      for (const el of document.querySelectorAll('body *')) {
        if (!el.offsetParent || !el.childNodes.length) continue;
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1).map(n => n.textContent.trim()).join(' ');
        if (!own) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) continue;
        const fg = parse(cs.color); if (!fg || fg.a < 0.5) continue;
        const bg = bgOf(el); if (bg === 'IMG') { out.unknown++; continue; }
        out.checked++;
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        const large = size >= 24 || (bold && size >= 18.66);
        const r = ratio(fg, bg), need = large ? 3 : 4.5;
        if (r < need) {
          const key = cs.color + '|' + `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
          if (seen.has(key + own.slice(0, 20))) continue; seen.add(key + own.slice(0, 20));
          out.fails.push({ text: own.slice(0, 40), ratio: +r.toFixed(2), need, fg: cs.color, bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`, px: size });
        }
      }
      return out;
    });
    all.push({ path, ...res });
  }
  await b.close();
  for (const r of all) {
    console.log(`${r.path}  checked=${r.checked} unknown(bg image/gradient)=${r.unknown} FAILS=${r.fails.length}`);
    for (const f of r.fails.slice(0, 5)) console.log(`    ${f.ratio}:1 (<${f.need})  ${f.fg} on ${f.bg}  ${f.px}px  "${f.text}"`);
  }
})().catch(e => { console.error(e); process.exit(1); });
