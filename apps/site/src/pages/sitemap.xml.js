// sitemap.xml.js — complete indexable routes with real lastmod and reciprocal hreflang alternates (SEO-2 / SEO-3)
import { db } from '../lib/db';

const base = (import.meta.env.PUBLIC_SITE_URL || 'https://simalme.com').replace(/\/$/, '');
const VERIFIED_BASE_DATE = '2026-10-12';

export const GET = async () => {
  /* rm(8.3): per-entity lastmod from real modification times (B14 updated_at;
   * content_blocks already carried updated_at). Product pages also reflect
   * product_deep edits via GREATEST (NULL-safe: NULL only when both are NULL). */
  const ts = (ms) => (Number(ms) > 0 ? new Date(Number(ms)).toISOString().slice(0, 10) : VERIFIED_BASE_DATE);
  const [prods, brands, sols, swProds, swMods, swSvcs, swSols, swInds, insights, legalEn, legalAr] = await Promise.all([
    db`SELECT p.slug, GREATEST(p.updated_at, d.updated_at) AS updated_at FROM products p LEFT JOIN product_deep d ON d.slug = p.slug ORDER BY p.slug`,
    db`SELECT slug, updated_at FROM brands WHERE slug != 'other' ORDER BY slug`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'it_solution' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'software_product' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'software_module' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'software_service' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'software_solution' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'software_industry' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT entity_id, MAX(updated_at) AS updated_at FROM content_blocks WHERE entity = 'insight' AND lang = 'en' GROUP BY entity_id ORDER BY entity_id`,
    db`SELECT slug, updated_at FROM legal_policies WHERE lang = 'en' ORDER BY slug`,
    db`SELECT slug, updated_at FROM legal_policies WHERE lang = 'ar' ORDER BY slug`,
  ]);

  // Core English top-level routes
  const enStaticRoutes = [
    '/',
    '/products/',
    '/brands/',
    '/solutions/',
    '/software/',
    '/insights/',
    '/resources/',
    '/about/',
    '/careers/',
    '/contact/',
    '/legal/',
    '/rfq/',
    '/onboarding/',
    '/compare/',
    '/sitemap/',
  ];

  // Core Arabic top-level twins
  const arStaticRoutes = [
    '/ar/',
    '/ar/products/',
    '/ar/solutions/',
    '/ar/software/',
    '/ar/about/',
    '/ar/contact/',
    '/ar/rfq/',
    '/ar/onboarding/',
    '/ar/insights/',
    '/ar/legal/',
  ];

  const items = [];
  /* deploy-audit: an hreflang="ar" alternate is emitted only when that Arabic page exists. It
   * was emitted for every URL (addUrl ignored hasArTwin), so each product, brand, solution,
   * software, insight page and /brands/, /careers/, /compare/ … advertised an /ar/ twin that
   * returns 404 — search engines report those as hreflang errors. BaseLayout's <head> already
   * applied hasArTwin; the sitemap now matches it. */
  const arPaths = new Set([...arStaticRoutes, ...legalAr.map((r) => `/ar/legal/${r.slug}/`)]);
  const latest = (...lists) => {
    const ms = lists.flat().map((r) => Number(r.updated_at) || 0);
    return ms.length && Math.max(...ms) > 0 ? ts(Math.max(...ms)) : VERIFIED_BASE_DATE;
  };

  // Helper to add URL with verified lastmod and reciprocal hreflang alternates
  function addUrl(path, lastmod = VERIFIED_BASE_DATE) {
    const isArabic = path.startsWith('/ar/');
    let enPath = isArabic ? path.replace(/^\/ar/, '') || '/' : path;
    if (!enPath.endsWith('/')) enPath += '/';
    let arPath = isArabic ? path : (path === '/' ? '/ar/' : `/ar${path}`);
    if (!arPath.endsWith('/')) arPath += '/';

    const loc = `${base}${path.endsWith('/') ? path : path + '/'}`;
    const enUrl = `${base}${enPath}`;
    const arUrl = `${base}${arPath}`;
    const hasAr = isArabic || arPaths.has(arPath);

    items.push({
      loc,
      lastmod,
      alternates: [
        { rel: 'alternate', hreflang: 'en', href: enUrl },
        ...(hasAr ? [{ rel: 'alternate', hreflang: 'ar', href: arUrl }] : []),
        { rel: 'alternate', hreflang: 'x-default', href: enUrl },
      ],
    });
  }

  /* hub pages change when their content does: lastmod = newest record they list */
  const hubLastmod = {
    '/': latest(prods, brands, sols, swProds, swMods, swSvcs, swSols, swInds, insights),
    '/products/': latest(prods), '/brands/': latest(brands), '/solutions/': latest(sols),
    '/software/': latest(swProds, swMods, swSvcs, swSols, swInds), '/insights/': latest(insights),
    '/legal/': latest(legalEn), '/compare/': latest(prods),
  };
  const hubFor = (p) => hubLastmod[p.replace(/^\/ar\//, '/')] || VERIFIED_BASE_DATE;
  for (const p of enStaticRoutes) addUrl(p, hubFor(p));
  for (const p of arStaticRoutes) addUrl(p, p === '/ar/legal/' ? latest(legalAr) : hubFor(p));

  // Products (78 live SKUs)
  for (const r of prods) {
    addUrl(`/products/${r.slug}/`, ts(r.updated_at));
  }

  // Brands
  for (const r of brands) {
    addUrl(`/brands/${r.slug}/`, ts(r.updated_at));
  }

  // IT Solutions
  for (const r of sols) {
    addUrl(`/solutions/${r.entity_id}/`, ts(r.updated_at));
  }

  // Software practices
  for (const r of swProds) addUrl(`/software/products/${r.entity_id}/`, ts(r.updated_at));
  for (const r of swMods) addUrl(`/software/modules/${r.entity_id}/`, ts(r.updated_at));
  for (const r of swSvcs) addUrl(`/software/services/${r.entity_id}/`, ts(r.updated_at));
  for (const r of swSols) addUrl(`/software/solutions/${r.entity_id}/`, ts(r.updated_at));
  for (const r of swInds) addUrl(`/software/industries/${r.entity_id}/`, ts(r.updated_at));

  // Insights articles
  for (const r of insights) {
    addUrl(`/insights/${r.entity_id}/`, ts(r.updated_at));
  }

  // Legal policies (English & Arabic)
  for (const r of legalEn) {
    addUrl(`/legal/${r.slug}/`, ts(r.updated_at));
  }
  for (const r of legalAr) {
    addUrl(`/ar/legal/${r.slug}/`, ts(r.updated_at));
  }

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const item of items) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${item.loc}</loc>`);
    xmlLines.push(`    <lastmod>${item.lastmod}</lastmod>`);
    for (const alt of item.alternates) {
      xmlLines.push(`    <xhtml:link rel="${alt.rel}" hreflang="${alt.hreflang}" href="${alt.href}" />`);
    }
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');

  return new Response(xmlLines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
