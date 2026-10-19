/* child-env.js — the environment handed to the SSG build child (SEC-10 / P8-3).
 * deploy-audit H7: this was a denylist of ten names, so every secret added later reached the
 * build: DOC_ENCRYPTION_KEY, SMTP_PASS, WEBHOOK_SECRET, VIEWER_PASSWORD, ADMIN_DATABASE_URL,
 * ASP_KEY/ASP_SECRET, NOTIFY_SMS_WHATSAPP_TOKEN… Now an allowlist: what the OS, node and npm need
 * to run, plus what apps/site reads (PUBLIC_*, PORTAL_URL). The caller adds the build's own
 * DATABASE_URL (the read-only build role), NODE_ENV and SITE_OUT_DIR. */
const ALLOWED = /^(PATH|PATHEXT|SYSTEMROOT|SYSTEMDRIVE|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMW6432|COMMONPROGRAMFILES|COMMONPROGRAMFILES\(X86\)|HOMEDRIVE|HOMEPATH|USERNAME|USER|LOGNAME|SHELL|LANG|LANGUAGE|LC_[A-Z]+|TZ|OS|NUMBER_OF_PROCESSORS|PROCESSOR_[A-Z_]+|NODE_OPTIONS|NODE_EXTRA_CA_CERTS|CI|FORCE_COLOR|NO_COLOR|TERM|PUBLIC_[A-Z0-9_]+|ASTRO_[A-Z0-9_]+|PORTAL_URL|PGSSLMODE|PGSSLROOTCERT|PGCONNECT_TIMEOUT)$/i;

export function buildChildEnv(env = process.env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) if (ALLOWED.test(k)) out[k] = v;
  return out;
}
