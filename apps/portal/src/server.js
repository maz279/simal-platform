/* ==========================================================================
 * server.js — entry point. Boots config, store, services, routes; serves
 * the SPA from public/; access logging; graceful shutdown; maintenance loop.
 * Run:  node src/server.js     (see .env.example for required env on first run)
 * ========================================================================== */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, assertBootConfig, assertProductionConfig } from './config.js';
import { buildChildEnv } from './lib/child-env.js';
import { claimNextSsgJob, requeueStaleClaims } from './lib/ssg-claim.js';
import { syncDocroot } from './lib/deploy-sync.js';
import { createStore } from './store/db.js';
import { createRepos } from './store/repos.js';
import { createPgRepos } from './store/pg-repos.js';
import { makeAsync } from './store/async-wrapper.js';
import { createAuth } from './services/auth.service.js';
import { createNotify } from './services/notify.service.js';
import { createScreening } from './services/screening.service.js';
import { createWebhooks } from './services/webhooks.service.js';
import { createKyc } from './services/kyc.service.js';
import { createEInvoiceService } from './services/einvoice.service.js';
import { createReview } from './services/review.service.js';
import { createAnalytics, createExport, createInvites } from './services/analytics.service.js';
import { createTokenService } from './services/token.service.js';
import { createAspClient } from './services/peppol-asp.client.js';
import { createRfqService } from './services/rfq.service.js';
import { buildRouter } from './services/routes.js';
import { dispatch, HttpError } from './lib/http.js';
import { log, redactObsMessage } from './lib/log.js';
import { V } from './domain/validators.js';

export async function createApp({ dataDir = config.dataDir, skipBootAssert = false } = {}) {
  /* env checks run before any service is built: createScreening() seeds a starter watchlist when
   * the file is missing, which would satisfy the production watchlist check (deploy-audit H4) */
  if (!skipBootAssert) assertBootConfig();
  if (!skipBootAssert && config.env === 'production') assertProductionConfig();
  /* Uniform async repos: PG when DATABASE_URL set; JSON wrapped in async-wrapper otherwise */
  let repos, store = null;
  if (process.env.DATABASE_URL) {
    repos = createPgRepos(process.env.DATABASE_URL);
    log.info('store', { engine: 'postgresql', url: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') });
  } else {
    store = createStore(dataDir);
    repos = makeAsync(createRepos(store));  // wrap sync JSON methods to return Promises
    log.info('store', { engine: 'json-file-async', dataDir });
  }
  const notify = createNotify(repos);
  const screening = createScreening(repos);
  const webhooks = createWebhooks(repos);
  const auth = createAuth(repos);
  const kyc = createKyc(repos, { notify, screening, webhooks });
  const einvoice = createEInvoiceService({ repos, notify, asp: createAspClient() });
  const review = createReview(repos, { notify, screening, webhooks, einvoice });
  const analytics = createAnalytics(repos);
  const exportSvc = createExport(repos);
  const invites = createInvites(repos);
  const tokenSvc = createTokenService(repos);
  const rfq = createRfqService(repos, { notify });


  /* PG mode: wait for connection + settings cache before boot; JSON mode: immediate */
  if (process.env.DATABASE_URL && repos.ready) {
    await repos.ready;
  }
  await auth.bootstrap();

  /* rm(10.3-1 pen MFA-08)/GOV a16: a production deployment must not run with
   * administrative accounts that can log in password-only. Refuse to start unless
   * STAFF_MFA_ENFORCED=false is set deliberately. */
  if (config.env === 'production' && process.env.STAFF_MFA_ENFORCED !== 'false') {
    const missing = await auth.staffMissingMfa();
    if (missing.length) {
      const list = missing.map((u) => `${u.email} (${u.role})`).join(', ');
      log.error('boot_failed', { error: `staff accounts missing TOTP MFA: ${missing.length}`, accounts: list });
      throw new Error(`Refusing to start in production: ${missing.length} active staff account(s) have no TOTP MFA — ${list}. Enrol them before deploying (or set STAFF_MFA_ENFORCED=false to accept the risk).`);
    }
  }

  /* JSON mode: load the read-only catalog mirror for RFQ integrity checks
   * (generated from PG by tools/export-products.js; PG mode reads live). */
  if (!process.env.DATABASE_URL) {
    try {
      const fs = await import('node:fs');
      const pathMod = await import('node:path');
      // PRODUCTS_JSON: tests point at test/fixtures/products.json (data/ is git-ignored)
      const pj = process.env.PRODUCTS_JSON || pathMod.resolve(config.root, 'data', 'products.json');
      if (fs.existsSync(pj)) {
        const raw = JSON.parse(fs.readFileSync(pj, 'utf8'));
        if (Array.isArray(raw) && raw.length && typeof repos.seedProducts === 'function') await repos.seedProducts(raw);
      }
    } catch { /* mirror optional in dev */ }
  }

  /* seed Simal identity once (deterministic, checksum-valid TIN) */
  if (!repos.settings().simalTin) {
    const tin = V.makeTIN('10054817290');
    await repos.saveSettings({ simalTin: tin, simalPeppol: '0235:' + tin });
  }
  /* deploy-audit H8: the seller TRN on every e-invoice was the seed value (this generator or
   * migrate.sql's 100123456700003) and nothing could set the real one. SIMAL_TIN — the 15-digit
   * TRN on the company's FTA certificate — now does; production refuses to start on a seed TRN. */
  const envTin = String(process.env.SIMAL_TIN || '').trim();
  if (envTin) {
    if (!V.tin(envTin)) throw new Error('SIMAL_TIN must be the 15-digit UAE TRN');
    if (repos.settings().simalTin !== envTin) {
      await repos.saveSettings({ simalTin: envTin, simalPeppol: '0235:' + envTin.slice(0, 10) });
      await repos.audit('system', 'seller_tin_set', 'settings', 'from SIMAL_TIN');
    }
  }
  const SEED_TINS = new Set(['100123456700003', V.makeTIN('10054817290')]);
  if (config.env === 'production' && SEED_TINS.has(String(repos.settings().simalTin))) {
    throw new Error('Refusing to start in production: the seller TRN is a seed placeholder — set SIMAL_TIN to the TRN on the FTA certificate');
  }

  /* in-memory error sink (NFR-3 / P8-8) */
  const errorSink = {
    _errors: [],
    record(entry) {
      this._errors.unshift(entry);
      if (this._errors.length > 100) this._errors.pop();
    },
    list() {
      return [...this._errors];
    }
  };

  const router = buildRouter({ auth, kyc, review, analytics, exportSvc, invites, notify, screening, repos, einvoice, tokenSvc, rfq, errorSink });
  const staticRoot = path.resolve(config.root, 'public');

  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    try {
      await dispatch({ req, res, router, staticRoot });
      log.info('http', { id: req.requestId, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      /* rm(10.3-1 pen CMS-36): a route that already sent headers must never reach
       * writeHead here — doing so threw inside the catch and killed the process. */
      if (!res.headersSent && !res.writableEnded) {
        // Return generic 500 error to client without leaking stack or DB text (SEC-12 / P8-5)
        const errMsg = status < 500 ? (e.message || 'Request failed') : 'Internal server error';
        const body = JSON.stringify({
          error: errMsg,
          requestId: req.requestId,
          ...(status < 500 && e.details ? { details: e.details } : {})
        });
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(body);
      }
      if (status >= 500) {
        log.error('http_error', { id: req.requestId, path: req.url, error: String(e?.message), stack: String(e?.stack || '').slice(0, 500) });
        errorSink.record({
          requestId: req.requestId,
          path: req.path || req.url,
          method: req.method,
          status,
          message: String(e?.message || 'Internal server error'),
          stack: String(e?.stack || ''),
          ts: Date.now()
        });
        /* rm(9.3-1)/NFR-3: outbound error sink — POST every 5xx to an ops webhook
         * (Slack/Teams `text` payload; deliberately NOT Sentry-compatible). The
         * message is PDPL-redacted (TRN/IBAN/phone digit runs) before it leaves
         * the box, and the POST is fire-and-forget: a sink outage must never take
         * a request down with it. OBSERVABILITY_WEBHOOK_URL is distinct from the
         * ERP integration WEBHOOK_URL. */
        const OBS_URL = process.env.OBSERVABILITY_WEBHOOK_URL;
        if (OBS_URL) {
          fetch(OBS_URL, { method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              text: `[simal] ${status} ${req.method} ${req.path || req.url} req=${req.requestId}`,
              requestId: req.requestId, path: req.path || req.url, status,
              message: redactObsMessage(e?.message), ts: Date.now() }) })
            .catch(() => { /* sink down must never 500 the handler again */ });
        }
      }
    }
  });

  /* periodic maintenance: reap idle sessions + purge abandoned drafts >12mo (NFR-11)
   * rm(7.2-2): reap() is async — the old sync fire-and-forget swallowed its rejection
   * into an unhandled promise; await it inside the async interval callback instead. */
  const maint = setInterval(async () => {
    try {
      await repos.sessions.reap();
      const cut = Date.now() - 365 * 24 * 3600 * 1000;
      if (store?.data?.drafts) {
        const d = store.data.drafts;
        let purged = 0;
        for (let i = d.length - 1; i >= 0; i--) {
          if ((d[i].updatedAt || d[i].startedAt || 0) < cut) { d.splice(i, 1); purged++; }
        }
        if (purged) { repos.audit('system', 'drafts_purged', 'maintenance', purged + ' abandoned draft(s) removed'); store.persist(); }
      }
    } catch (e) { log.warn('maintenance_failed', { error: String(e?.message) }); }
  }, 15 * 60000);
  maint.unref();

  /* rm(7.2-2)/F-2026-N17 — SLA breach escalation (P10-4 batch work).
   * Dedupes per submission via the sla_escalated audit rows, so each breach emails
   * exactly once no matter how often the timer fires. No SLA_ESCALATION_EMAIL → no-op. */
  async function escalateSlaBreaches(now = Date.now()) {
    const to = process.env.SLA_ESCALATION_EMAIL;
    if (!to) return 0;
    const done = new Set((await repos.auditLog('', 'sla_escalated')).map((a) => a.target));
    let n = 0;
    for (const s of await repos.submissions.all()) {
      const row = review.summarise(s, now);
      if (!row.slaBreached || done.has(s.id)) continue;
      await notify.send({
        channel: 'email', to,
        subject: `KYC SLA breach — ${s.id}`,
        text: `${s.id} pending ${row.ageBusinessDays} bd, status ${s.status}.`,
        meta: { event: 'sla.escalated', ref: s.id },
      });
      await repos.audit('system', 'sla_escalated', s.id, `age=${row.ageBusinessDays}bd`);
      n++;
    }
    return n;
  }
  const slaTimer = setInterval(() => escalateSlaBreaches().catch((e) => log.warn('sla_escalation_failed', { error: String(e?.message) })), 30 * 60000);
  slaTimer.unref();

  /* rm(7.2-3)/P10-4 — licence expiry reminders for approved partners.
   * Ladder of thresholds (days out, env-configurable); one email per (partner,
   * threshold) ever, deduped via expiry_reminded audit rows keyed "<id>:<t>d". */
  async function remindExpiries(now = Date.now()) {
    const to = process.env.SLA_ESCALATION_EMAIL;
    if (!to) return 0;
    const thresholds = String(process.env.SLA_EXPIRY_THRESHOLDS || '30,14,7')
      .split(',').map((x) => Number(x.trim())).filter((x) => x > 0).sort((a, b) => b - a);
    if (!thresholds.length) return 0;
    const done = new Set((await repos.auditLog('', 'expiry_reminded')).map((a) => a.target));
    let n = 0;
    for (const s of await repos.submissions.all()) {
      if (s.status !== 'approved') continue;
      const expRaw = s.company?.license_expiry;
      const expMs = expRaw ? Date.parse(expRaw) : NaN;
      if (!Number.isFinite(expMs)) continue;
      const daysLeft = (expMs - now) / 86400000;
      // the TIGHTEST threshold crossed — a partner 10 days out is in the 14d bucket,
      // not the 30d one (ascending find), so each stage of the ladder mails once.
      const bucket = [...thresholds].sort((a, b) => a - b).find((t) => daysLeft <= t);
      if (!bucket) continue; // farther out than the widest threshold
      const key = `${s.id}:${bucket}d`;
      if (done.has(key)) continue;
      await notify.send({
        channel: 'email', to,
        subject: `Licence expiring in ≤${bucket}d — ${s.id}`,
        text: `${s.company?.legal_name_en || s.id}: trade licence expires ${expRaw} (${Math.floor(daysLeft)}d).`,
        meta: { event: 'expiry.reminded', ref: s.id, threshold: bucket },
      });
      await repos.audit('system', 'expiry_reminded', key, `licence ${expRaw}, ${Math.floor(daysLeft)}d left`);
      n++;
    }
    return n;
  }
  const expiryTimer = setInterval(() => remindExpiries().catch((e) => log.warn('expiry_reminder_failed', { error: String(e?.message) })), 24 * 3600000);
  expiryTimer.unref();

  /* deploy-audit: a first deployment starts with an empty docroot, so the public site was down
   * (nginx 404) until a staff member published something. When DEPLOY_DIR has no index.html and
   * no build is pending, queue one build of the current content; the worker deploys it like any
   * other job (audited). */
  if (repos.client && process.env.DEPLOY_DIR && process.env.SSG_DISABLED !== '1') {
    const fsBoot = await import('node:fs');
    if (!fsBoot.existsSync(path.join(process.env.DEPLOY_DIR, 'index.html'))) {
      const pendingBuild = await repos.client.query("SELECT 1 FROM outbox WHERE to_addr = 'ssg-builder' AND status IN ('queued', 'processing') LIMIT 1");
      if (!pendingBuild.rows.length) {
        const bootId = 'pub_boot_' + Date.now();
        const event = { type: 'cms_publish', entities: [{ entity: 'site', entity_id: 'all' }], actor: 'system', ts: Date.now(), purgeAll: true, purge: ['dist/'], reason: 'bootstrap: empty docroot' };
        await repos.client.query(
          'INSERT INTO outbox (id, channel, to_addr, subject, body, status, meta, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [bootId, 'cms', 'ssg-builder', 'publish', JSON.stringify(event), 'queued', JSON.stringify({ event: 'cms.publish', bootstrap: true }), Date.now()]
        );
        await repos.audit('system', 'ssg_bootstrap_publish', bootId, 'DEPLOY_DIR had no index.html — first build queued');
        log.info('ssg_bootstrap_publish', { outboxId: bootId, target: process.env.DEPLOY_DIR });
      }
    }
  }

  /* automated SSG rebuild loop (ADR-13): builds Astro static site when outbox has queued cms_publish */
  let ssgBuilding = false;
  const ssgLoop = setInterval(async () => {
    /* rm(6.3-1)/DAT-7: test boots (CI gates, e2e) set SSG_DISABLED=1 — a gate's publish
     * job must NEVER rebuild the live apps/site/dist from scratch-database content. */
    if (ssgBuilding || !repos.client || process.env.SSG_DISABLED === '1') return;
    ssgBuilding = true; /* before the first await: a slow claim must not overlap the next tick */
    let claimedId = null, handedOff = false;
    try {
      /* deploy-audit H6: atomic claim (queued → processing); a dead worker's claim is requeued */
      await requeueStaleClaims(repos.client);
      const job = await claimNextSsgJob(repos.client);
      if (!job) ssgBuilding = false;
      if (job) {
        claimedId = job.id;
        log.info('ssg_build_started', { outboxId: job.id });
        const { execFile } = await import('node:child_process');
        const fs = await import('node:fs');
        const siteDir = process.env.SITE_DIR || path.resolve(config.root, '../site');
        const t0 = Date.now();

        // F-2026-N01: spawning npm.cmd/.bat without a shell throws spawn EINVAL on Node >= 20.12
        // (CVE-2024-27980 fix). Windows: drive npm's own CLI entrypoint with the current node
        // executable — no shell at all. Unix: plain 'npm' is a symlinked script, spawnable directly.
        let spawnCmd, spawnArgs;
        if (process.platform === 'win32') {
          const npmCliCandidates = [
            path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), // portable/standard node layout
            path.resolve(config.root, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'),           // monorepo root (workspaces)
          ];
          const npmCli = npmCliCandidates.find(p => fs.existsSync(p));
          if (!npmCli) throw new Error('npm-cli.js not found for SSG build (looked in ' + npmCliCandidates.join(', ') + ')');
          spawnCmd = process.execPath;
          spawnArgs = [npmCli, 'run', 'build'];
        } else {
          spawnCmd = 'npm';
          spawnArgs = ['run', 'build'];
        }

        // Allowlisted environment: no portal secret reaches the build (SEC-10 / P8-3, deploy-audit H7)
        const sanitizedEnv = buildChildEnv(process.env);

        // rm(5.1-2)/CMS-10: purgeAll is honored — a full purge logs a distinct audit event
        // and drives the whole-site purge path (full rebuild), vs entity-scoped purge paths.
        let purgeAll = false;
        try { purgeAll = !!(job.body && JSON.parse(job.body).purgeAll); } catch { /* older events */ }
        if (purgeAll) await repos.audit('system', 'ssg_purge_full', job.id, 'Full static cache purge requested — rebuilding entire site');

        // Hermetic build (rm(2.1-3)): build into a scratch outDir and swap into dist only
        // after success — a stale/corrupt dist can never break or half-replace the live site.
        const scratchDist = path.join(siteDir, 'dist-worker');
        fs.rmSync(scratchDist, { recursive: true, force: true });
        sanitizedEnv.SITE_OUT_DIR = 'dist-worker';

        // F-2026-N01 / R-2: the SSG build needs DB READ access. Give it the dedicated
        // read-only build role — never the portal's privileged DATABASE_URL. NODE_ENV=production
        // makes db.ts refuse to fall back to any hardcoded credential.
        sanitizedEnv.NODE_ENV = 'production';
        sanitizedEnv.DATABASE_URL = process.env.BUILD_DATABASE_URL || '';

        const finishJob = async (ok, errorMsg) => {
          const durationMs = Date.now() - t0;
          const liveDist = path.join(siteDir, 'dist');
          const scratchIndex = path.join(scratchDist, 'index.html');
          let verified = false;
          if (ok && fs.existsSync(scratchIndex)) {
            // Windows: rm(dist) can race with concurrent readers; retry once after a settle
            for (let attempt = 0; attempt < 2 && !verified; attempt++) {
              try {
                fs.rmSync(liveDist, { recursive: true, force: true });
                fs.renameSync(scratchDist, liveDist);
                verified = fs.existsSync(path.join(liveDist, 'index.html'));
              } catch (swapErr) {
                if (attempt === 1) errorMsg = 'dist swap failed: ' + String(swapErr?.message || swapErr);
                else { await new Promise(r2 => setTimeout(r2, 400)); }
              }
            }
          }
          if (!verified) {
            fs.rmSync(scratchDist, { recursive: true, force: true });
            const msg = errorMsg || 'dist/index.html was not generated';
            log.error('ssg_build_failed', { outboxId: job.id, durationMs, error: msg });
            await repos.client.query(
              "UPDATE outbox SET status = 'failed', meta = $1 WHERE id = $2",
              [JSON.stringify({ error: msg, durationMs }), job.id]
            );
          } else {
            log.info('ssg_build_completed', { outboxId: job.id, durationMs });
            await repos.client.query(
              "UPDATE outbox SET status = 'processed', meta = $1 WHERE id = $2",
              [JSON.stringify({ durationMs, verified: true }), job.id]
            );
            await repos.audit('system', 'ssg_build_completed', job.id, `Static site regenerated and verified in ${durationMs}ms`);

            /* rm(5.2-1)/CMS-10: a publish must REACH THE HOSTING TARGET, not just the local
             * folder. DEPLOY_DIR = the docroot the edge (dev-edge / nginx vhost) serves.
             * Deterministic replace (rm + cp) — avoids copy-into-existing nesting. In production
             * a missing DEPLOY_DIR is a deployment error and is logged loudly. */
            const deployDir = process.env.DEPLOY_DIR;
            if (deployDir) {
              try {
                /* deploy-audit: in-place atomic sync (was rm -rf + cp: an empty docroot mid-publish) */
                const synced = syncDocroot(liveDist, deployDir);
                if (!fs.existsSync(path.join(deployDir, 'index.html'))) throw new Error('deployed index.html missing');
                log.info('ssg_deployed', { outboxId: job.id, target: deployDir, files: synced.copied, removed: synced.removed });
                await repos.audit('system', 'ssg_deployed', job.id, 'dist deployed to ' + deployDir);
              } catch (depErr) {
                log.error('ssg_deploy_failed', { outboxId: job.id, target: deployDir, error: String(depErr?.message || depErr) });
                await repos.audit('system', 'ssg_deploy_failed', job.id, 'deploy to ' + deployDir + ' failed: ' + String(depErr?.message || depErr));
              }
            } else if (process.env.NODE_ENV === 'production') {
              log.error('ssg_deploy_missing', { outboxId: job.id, hint: 'DEPLOY_DIR not set — publish never reaches the hosting target' });
            }
          }
        };

        // execFile with a bounded 120s timeout (no shell: SEC-10 / P8-3). The try/catch is
        // load-bearing: execFile can throw SYNCHRONOUSLY (e.g. EINVAL/ENOENT), and a spawn
        // failure must mark the job failed — never leave it queued or the queue jams forever.
        try {
          execFile(spawnCmd, spawnArgs, {
            cwd: siteDir,
            env: sanitizedEnv,
            timeout: 120000,
            killSignal: 'SIGTERM',
            windowsHide: true,
            maxBuffer: 16 * 1024 * 1024,
          }, (err) => {
            handedOff = true;
            /* deploy-audit H6: was unawaited — a DB error while recording the result became an
             * unhandled rejection, which terminates the portal process */
            finishJob(!err, err ? String(err?.message || err) : null)
              .catch((e) => log.error('ssg_finish_failed', { outboxId: job.id, error: String(e?.message || e) }))
              .finally(() => { ssgBuilding = false; });
          });
        } catch (spawnErr) {
          handedOff = true;
          ssgBuilding = false;
          await finishJob(false, 'spawn failed: ' + String(spawnErr?.message || spawnErr));
        }
        handedOff = true; /* execFile owns the job from here (its callback records the result) */
      }
    } catch (e) {
      ssgBuilding = false;
      log.warn('ssg_loop_failed', { error: String(e?.message) });
      /* a job claimed but never handed to the build would sit in 'processing' and be retried every
       * STALE_CLAIM_MS forever — record it as failed so the dashboard shows the failure */
      if (claimedId && !handedOff) {
        await repos.client.query("UPDATE outbox SET status = 'failed', meta = $1 WHERE id = $2",
          [JSON.stringify({ error: 'worker error before the build started: ' + String(e?.message || e) }), claimedId]).catch(() => {});
      }
    }
  }, 10000);
  ssgLoop.unref();

  return { server, repos, store, config, auth, escalateSlaBreaches, remindExpiries };
}

/* ---------- direct-run entry (skipped when imported by tests) ---------- */
const isDirectRun = process.env.NODE_KYC_TEST !== '1' && process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  import.meta.url.toLowerCase().endsWith(process.argv[1].replace(/\\/g, '/').toLowerCase()) ||
  process.argv[1].replace(/\\/g, '/').toLowerCase().endsWith('src/server.js') ||
  process.argv[1].replace(/\\/g, '/').toLowerCase().endsWith('server.js')
);
if (isDirectRun) {
  createApp().then(({ server }) => {
    server.listen(config.http.port, config.http.host, () => {
      log.info('server_started', { host: config.http.host, port: config.http.port, env: config.env, dataDir: config.dataDir });
    });
    const shutdown = () => {
      log.info('server_stopping', {});
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 2000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }).catch(e => { log.error('boot_failed', { error: String(e?.message) }); process.exit(1); });
}
