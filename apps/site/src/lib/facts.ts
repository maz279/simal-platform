/* facts.ts — rm(6.1-2/9.1-1, PUB-8): one source per published fact.
 * brandCount = the live brands table without the generic 'other' catch-all (GOV a44),
 * the same rule BaseLayout and the sitemap use. years/since = the CMS block
 * site/counters (rm 4.2). BaseLayout publishes both as <meta name="simal:*">, and
 * scripts/ci/facts-consistency.mjs fails the build if any page prints another value. */
import { db } from './db';

export const DEFAULT_COUNTERS = { brands: 21, skus: 78, years: 24, since: 2002 };

export async function siteFacts() {
  const [[brands], [countersRow]] = await Promise.all([
    db`SELECT count(*)::int AS n FROM brands WHERE slug <> 'other'`,
    db`SELECT payload FROM content_blocks WHERE entity = 'site' AND entity_id = 'counters' AND lang = 'en'`,
  ]);
  const counters: any = { ...DEFAULT_COUNTERS, ...(countersRow?.payload || {}) };
  return { brandCount: Number(brands.n), years: Number(counters.years), since: Number(counters.since), counters };
}
