/* ==========================================================================
 * config.js — environment-driven configuration (12-factor).
 * Credentials are read ONLY from the environment; nothing is hardcoded.
 * A .env file next to the package root is loaded if present (simple parser,
 * no dependencies). TEST overrides come from process env as usual.
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

/* ---- tiny .env loader (no dependency, no interpolation) ---- */
export function loadDotEnv(p = path.join(ROOT, '.env')) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    } else {
      /* deploy-audit: an unquoted " #" starts a comment (dotenv rule). .env.example carries inline
       * comments, so a copied "NODE_ENV=production   # …" read as the whole string — config.env
       * was never 'production' and every production guard stayed off — and "WEBHOOK_SECRET=  # HMAC…"
       * became a publicly known secret. Quote a value that must contain " #". */
      val = val.replace(/(^|\s)#.*$/, '').trim();
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv();

const env = (k, d = '') => (process.env[k] ?? d);
const num = (k, d) => { const n = Number(process.env[k]); return Number.isFinite(n) && n > 0 ? n : d; };

export const config = {
  env: env('NODE_ENV', 'development'),
  root: ROOT,
  /* deploy-audit H5: the public origin of the portal, for links inside emails (a relative
   * "/login.html?reset=…" is not clickable in a mail client). Required in production. */
  publicUrl: env('PORTAL_PUBLIC_URL').replace(/\/+$/, ''),
  /* origin of the public site — CMS console links, preview probe and the CSP connect-src. */
  siteUrl: env('SITE_PUBLIC_URL', 'http://127.0.0.1:8100').replace(/\/+$/, ''),
  http: {
    port: num('PORT', 3000),
    host: env('HOST', '127.0.0.1'),
    corsOrigins: env('CORS_ORIGINS').split(',').map(s => s.trim()).filter(Boolean),
  },
  dataDir: path.resolve(ROOT, env('DATA_DIR', './data')),
  session: {
    idleMinutes: num('SESSION_IDLE_MINUTES', 20),   // PRD FR-A-001 / OWASP
    absoluteHours: num('SESSION_ABSOLUTE_HOURS', 12),
  },
  bootstrap: {
    adminEmail: env('ADMIN_EMAIL'),
    adminName: env('ADMIN_NAME', 'Administrator'),
    adminPassword: env('ADMIN_PASSWORD'),
    // MFA on the bootstrap admin is on by default (SEC-04); operators of a
    // local/dev instance may disable it via ADMIN_MFA_REQUIRED=false.
    adminMfaRequired: env('ADMIN_MFA_REQUIRED', 'true') === 'true',
    // Password policy floor for the bootstrap admin (default 8, same as the UI);
    // a local/dev instance may lower it via ADMIN_PASSWORD_MIN.
    adminPasswordMin: num('ADMIN_PASSWORD_MIN', 15),
    adminTotpSecret: env('ADMIN_TOTP_SECRET'),
    reviewer: env('REVIEWER_EMAIL') ? { email: env('REVIEWER_EMAIL'), password: env('REVIEWER_PASSWORD'), name: 'Review Staff' } : null,
    viewer: env('VIEWER_EMAIL') ? { email: env('VIEWER_EMAIL'), password: env('VIEWER_PASSWORD'), name: 'Read-only Staff' } : null,
  },
  notify: {
    smtp: env('SMTP_HOST') ? {
      host: env('SMTP_HOST'),
      port: num('SMTP_PORT', 587),
      user: env('SMTP_USER'),
      pass: env('SMTP_PASS'),
      from: env('SMTP_FROM', 'Simal KYC Portal <kyc@localhost>'),
    } : null,
    whatsappApi: env('NOTIFY_SMS_WHATSAPP_API'),
    whatsappToken: env('NOTIFY_SMS_WHATSAPP_TOKEN'),
    emailEnabled: env('NOTIFY_EMAIL_ENABLED', 'true') === 'true',
    whatsappEnabled: env('NOTIFY_WHATSAPP_ENABLED', 'true') === 'true',
  },
  screening: {
    watchlistCsv: env('WATCHLIST_CSV', './data/watchlist.csv'),
    fuzzyThreshold: Math.min(1, Math.max(0.5, Number(env('SCREENING_FUZZY_THRESHOLD', '0.82')) || 0.82)),
  },
  integration: {
    masterApiToken: env('MASTER_API_TOKEN'),        // for ERP pull (INT-04)
    webhookUrl: env('WEBHOOK_URL'),                 // signed push (INT-08)
    webhookSecret: env('WEBHOOK_SECRET'),
  },
};

/* deploy-audit H4: a production boot used to accept the .env.example placeholders, a missing
 * CSRF secret (a source-code literal stood in), a missing document key (only discovered at the
 * first upload), no mail transport (partner mail silently went to the local outbox), no virus
 * daemon, no deploy target and no watchlist (screening fell back to a 5-name starter list).
 * Each is now a refusal at boot, listed together. Explicit opt-outs: NOTIFY_EMAIL_ENABLED=false. */
const PLACEHOLDER = /^(set-.*-here|set admin name|base32secretplaceholder|change[-_]?me|changeme|todo|xxx+|<.*>)$|CHANGE_ME/i;
export function assertProductionConfig(throws = true) {
  const problems = [];
  const has = (k) => String(process.env[k] || '').trim() !== '';
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string' && v.trim() && PLACEHOLDER.test(v.trim())) problems.push(`${k} still holds the .env.example placeholder`);
  }
  const csrf = process.env.CSRF_SECRET || process.env.JWT_SECRET || '';
  if (csrf.length < 32) problems.push('CSRF_SECRET must be set (32+ random characters)');
  const docKey = process.env.DOC_ENCRYPTION_KEY || '';
  if (Buffer.from(docKey, 'base64').length < 32) problems.push('DOC_ENCRYPTION_KEY must be 32+ random bytes, base64 (see .env.example)');
  if (has('MASTER_API_TOKEN') && process.env.MASTER_API_TOKEN.length < 32) problems.push('MASTER_API_TOKEN must be 32+ characters');
  if (config.notify.emailEnabled && !config.notify.smtp) problems.push('SMTP_HOST is required (or NOTIFY_EMAIL_ENABLED=false) — partner mail would stay in the local outbox');
  if (!has('CLAMAV_HOST')) problems.push('CLAMAV_HOST is required — uploads must be scanned by clamd');
  if (!/^https:\/\/[^/]+$/.test(config.publicUrl)) problems.push('PORTAL_PUBLIC_URL must be the https origin of the portal (e.g. https://kyc.simalme.com) — email links are built from it');
  if (!/^https:\/\/[^/]+$/.test(config.siteUrl)) problems.push('SITE_PUBLIC_URL must be the https origin of the public site (e.g. https://simalme.com) — CMS links and the console CSP use it');
  if (!has('DEPLOY_DIR')) problems.push('DEPLOY_DIR is required — CMS publishes would never reach the site');
  if (!fs.existsSync(config.screening.watchlistCsv)) /* same resolution as the screening loader */ problems.push(`WATCHLIST_CSV not found (${config.screening.watchlistCsv}) — screening would run on the starter list`);
  if (problems.length && throws) throw new Error('Refusing to start in production:\n  - ' + problems.join('\n  - '));
  return problems;
}

/** absolute portal URL for emails: PORTAL_PUBLIC_URL, else this process's own address (dev) */
export function portalUrl(p = '/') {
  const host = config.http.host === '0.0.0.0' ? '127.0.0.1' : config.http.host;
  return (config.publicUrl || 'http://' + host + ':' + config.http.port) + p;
}

export function assertBootConfig(throws = true) {
  const problems = [];
  if (!config.bootstrap.adminEmail) problems.push('ADMIN_EMAIL is required on first run');
  if (!config.bootstrap.adminPassword || config.bootstrap.adminPassword.length < config.bootstrap.adminPasswordMin) problems.push(`ADMIN_PASSWORD must be at least ${config.bootstrap.adminPasswordMin} characters`);
  if (config.bootstrap.adminMfaRequired && !config.bootstrap.adminTotpSecret) problems.push('ADMIN_TOTP_SECRET is required when ADMIN_MFA_REQUIRED is not "false" (see .env.example)');
  if (problems.length && throws) throw new Error('Boot configuration incomplete:\n  - ' + problems.join('\n  - '));
  return problems;
}
