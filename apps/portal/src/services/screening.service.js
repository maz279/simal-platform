/* ==========================================================================
 * screening.service.js — sanctions / PEP watchlist screening.
 * Loads a CSV watchlist (Type,Name,Aliases,Country) from WATCHLIST_CSV,
 * screens company + signatory + UBO names with exact + fuzzy matching
 * (normalised Levenshtein ratio), stores results on the submission.
 * Ships with a small starter watchlist for evaluation; production drops the
 * real list file in place (no code change).
 * ========================================================================== */
import fs from 'node:fs';
import { config } from '../config.js';
import { log } from '../lib/log.js';

const STARTER_WATCHLIST = `Type,Name,Aliases,Country
SANCTION,DAESH,,SY
SANCTION,AL-QAIDA,AL QAIDA,SD
PEP,MARCO POLO ROSSI,,IT
SANCTION,SHADOW FUTURE TRADING FZE,,AE
PEP,IVAN PETROVICH SVIRIDOV,IVAN SVIRIDOV,RU
`;

function normalise(s) {
  return String(s || '').toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(LLC|L\.L\.C|FZE|FZELLC|FZE LLC|CO|COMPANY|LTD|LIMITED|INC|TRADING|GENERAL|GROUP|HOLDING|INTERNATIONAL|INTL|ME|MIDDLE EAST|ENTERPRISES?|IND|INDUSTRIES|TECHNOLOGIES?|SYSTEMS?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
const ratio = (a, b) => 1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);

export function createScreening(repos) {
  let entries = [];
  function load() {
    try {
      const csv = fs.readFileSync(config.screening.watchlistCsv, 'utf8');
      entries = parseCsv(csv);
      log.info('watchlist_loaded', { path: config.screening.watchlistCsv, entries: entries.length });
    } catch {
      /* production never screens against the 5-name starter list (the boot check refuses a missing file) */
      if (config.env === 'production') { log.error('watchlist_missing', { path: config.screening.watchlistCsv }); return; }
      try {
        fs.mkdirSync(config.dataDir, { recursive: true });
        fs.writeFileSync(config.screening.watchlistCsv, STARTER_WATCHLIST);
        entries = parseCsv(STARTER_WATCHLIST);
        log.info('watchlist_seed_created', { entries: entries.length });
      } catch (e) { log.warn('watchlist_unavailable', { error: String(e.message) }); }
    }
  }
  function parseCsv(csv) {
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
    return rows.filter(r => r.length >= 2).map(r => ({
      type: r[0] || 'SANCTION', name: r[1], aliases: (r[2] || '').split(';').map(s => s.trim()).filter(Boolean), country: r[3] || '',
    }));
  }
  load();

  function matchOne(label, rawName, out) {
    const name = normalise(rawName);
    if (!name) return;
    for (const e of entries) {
      const candidates = [e.name, ...e.aliases];
      for (const cand of candidates) {
        const c = normalise(cand);
        if (!c) continue;
        if (c === name || name.includes(c) || c.includes(name)) {
          out.push({ subject: label, name: rawName, match: e.name, type: e.type, country: e.country, method: 'exact', score: 1 });
          return;
        }
        const sc = ratio(name, c);
        if (sc >= config.screening.fuzzyThreshold) {
          out.push({ subject: label, name: rawName, match: e.name, type: e.type, country: e.country, method: 'fuzzy', score: Math.round(sc * 100) / 100 });
          return;
        }
      }
    }
  }

  return {
    reload: load,
    size: () => entries.length,
    /** screens a submission; returns + persists { ts, hits, clear } */
    async screen(sub) {
      const hits = [];
      matchOne('company', sub.company?.legal_name_en, hits);
      matchOne('company-trade-name', sub.company?.trade_name, hits);
      (sub.signatories || []).forEach((s, i) => matchOne('signatory[' + i + ']', s.name, hits));
      (sub.ubos || []).forEach((u, i) => matchOne('ubo[' + i + ']', u.name, hits));
      const result = { ts: Date.now(), screenedBy: 'watchlist@' + config.screening.watchlistCsv, hits, clear: hits.length === 0 };
      await repos.screening.save(sub.id, result);
      await repos.audit('system', 'screened', sub.id, hits.length ? hits.length + ' hit(s)' : 'clear');
      return result;
    },
    result: (ref) => repos.screening.get(ref),
  };
}
