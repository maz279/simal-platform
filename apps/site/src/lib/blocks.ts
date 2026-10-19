/* blocks.ts — Arabic page blocks (deploy-audit). site/home, site/about and site/contact exist
 * in content_blocks with lang 'ar' and are editable in the CMS, but no page read them: an edit
 * never reached /ar/. Pages now render these fields, falling back to their built-in copy when a
 * block or a field is absent. Text may carry the {years} / {brands} / {skus} fact tokens (same
 * rule as the EN hero slides), so a site/counters edit stays consistent everywhere. */
import { db } from './db';

export async function arSiteBlock(id: string): Promise<Record<string, any>> {
  const [row] = await db`SELECT payload FROM content_blocks WHERE entity = 'site' AND entity_id = ${id} AND lang = 'ar'`;
  if (!row) return {};
  let p: any = row.payload;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = {}; } }
  return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
}

export function factText(t: unknown, f: { years: number; brandCount: number; skus?: number; since?: number }): string {
  return String(t ?? '')
    .replace(/\{years\}/g, String(f.years))
    .replace(/\{since\}/g, String(f.since ?? ''))
    .replace(/\{brands\}/g, String(f.brandCount))
    .replace(/\{skus\}/g, String(f.skus ?? ''));
}

/** a non-empty string field, else the fallback */
export const field = (p: Record<string, any>, k: string, fallback: string): string =>
  typeof p[k] === 'string' && p[k].trim() ? p[k].trim() : fallback;
