/* ==========================================================================
 * log.js — minimal structured logger (JSON lines to stdout).
 * ========================================================================== */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[process.env.LOG_LEVEL] || LEVELS.info;

function emit(level, event, fields = {}) {
  if (LEVELS[level] < threshold) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line); else console.log(line);
}
export const log = {
  debug: (e, f) => emit('debug', e, f),
  info: (e, f) => emit('info', e, f),
  warn: (e, f) => emit('warn', e, f),
  error: (e, f) => emit('error', e, f),
};

/* rm(9.3-1)/NFR-3: PDPL redaction for anything that leaves the box — long digit
 * runs are TRNs (15), IBANs (AE + 21 digits), phone numbers; they must never reach
 * an outbound observability webhook. Capped so a huge message cannot balloon the
 * alert payload. NOTE: the roadmap v1.2 snippet used \b\d{6,}\b, which never
 * matches an IBAN run glued to its "AE" prefix (E and 8 are both word chars, so
 * there is no boundary there) — caught by the unit test; match maximal digit
 * runs instead. */
export function redactObsMessage(msg, maxLen = 200) {
  return String(msg ?? '').replace(/(?<!\d)\d{6,}(?!\d)/g, '[n]').slice(0, maxLen);
}
