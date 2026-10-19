// scripts/dev-edge.mjs — P0-2 (remediation plan 2026-10-12)
// Local edge for the public site: serves apps/site/dist statically and
// reverse-proxies /api/* to the portal, mirroring the production nginx
// topology that infra/nginx/simalme-dev.conf defines (finding PUB-2: the
// site calls relative /api/* but no production route exists).
//
//   node scripts/dev-edge.mjs                # dist on :8100, /api -> 127.0.0.1:8090
//   PORT=8200 PORTAL_URL=http://127.0.0.1:9090 node scripts/dev-edge.mjs
//
// No dependencies; Node >= 22. Dev only — production uses nginx.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(REPO, process.env.SITE_DIST || 'apps/site/dist');
const PORT = Number(process.env.PORT || 8100);
const PORTAL = new URL(process.env.PORTAL_URL || 'http://127.0.0.1:8090');
const HOST = process.env.EDGE_HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

/** Resolve a URL path inside DIST; returns null when the request tries to
 *  escape the root or touch a dotfile (SEC-12 hygiene, even in dev). */
function safeResolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  const full = path.normalize(path.join(DIST, clean));
  if (full !== DIST && !full.startsWith(DIST + path.sep)) return null;
  const rel = path.relative(DIST, full);
  if (rel.split(path.sep).some((seg) => seg.startsWith('.'))) return null;
  return full;
}

async function sendFile(res, filePath, status = 200) {
  const data = await fs.readFile(filePath);
  res.writeHead(status, {
    'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'content-length': data.length,
    'x-dev-edge': 'simal',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'content-security-policy': "default-src 'self'; script-src 'self' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' http://127.0.0.1:* http://localhost:* https://kyc.simalme.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  });
  res.end(data);
}

async function handleStatic(req, res) {
  const url = req.url || '/';
  const filePath = safeResolve(url);
  if (!filePath) { res.writeHead(403); res.end('forbidden'); return; }
  /* rm(9.1-3): the slash goes on the PATH, before any query. Appending to the whole URL
   * turned /search/?q=crucial into /search/?q=crucial/ (every header search, UTM tag
   * and ?slide= deep link got a stray "/"). */
  const qi = url.indexOf('?');
  const pathname = qi < 0 ? url : url.slice(0, qi);
  const withSlash = pathname + '/' + (qi < 0 ? '' : url.slice(qi));

  // Directory URLs: normalize to trailing slash (python-http.server semantics
  // the audit crawler relies on), then serve its index.html.
  let st = await fs.stat(filePath).catch(() => null);
  if (st?.isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: withSlash });
      res.end();
      return;
    }
    return sendFile(res, path.join(filePath, 'index.html'));
  }
  if (st) return sendFile(res, filePath);

  // Extensionless page path without trailing slash → try "<path>/index.html".
  const dirIndex = path.join(filePath, 'index.html');
  if (await fs.stat(dirIndex).catch(() => null)) {
    res.writeHead(301, { location: withSlash });
    res.end();
    return;
  }
  const notFoundPage = path.join(DIST, '404.html');
  if (await fs.stat(notFoundPage).catch(() => null)) {
    return sendFile(res, notFoundPage, 404);
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found (dev-edge)');
}

function proxyApi(req, res) {
  const upstream = {
    protocol: PORTAL.protocol,
    hostname: PORTAL.hostname,
    port: PORTAL.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: PORTAL.host },
  };
  const up = http.request(upstream, (ur) => {
    res.writeHead(ur.statusCode || 502, ur.headers);
    ur.pipe(res);
  });
  up.on('error', (e) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'portal unreachable', detail: e.code || e.message }));
  });
  req.pipe(up);
}

const handler = (req, res) => {
  if ((req.url || '').startsWith('/api/')) return proxyApi(req, res);
  handleStatic(req, res).catch(() => { res.writeHead(500); res.end('dev-edge error'); });
};

/* Dual-stack: browsers resolve `localhost` to ::1 first, so an IPv4-only
   bind reads as "site not accessible" in Chrome/Edge even when 127.0.0.1
   works. One Server cannot listen() twice (the second call rebinds), so
   each loopback gets its own server instance sharing the handler. */
const hosts = HOST === '::1' ? ['::1'] : [...new Set([HOST, '::1'])];
let failures = 0;
for (const h of hosts) {
  const srv = http.createServer(handler);
  srv.on('error', (e) => {
    failures++;
    console.error(`[dev-edge] ${e.code} on ${h}:${PORT} — already running? (${e.message})`);
    if (failures >= hosts.length) process.exit(1);
  });
  srv.listen(PORT, h, () => {
    console.log(`[dev-edge] listening on http://${h === '::1' ? '[::1]' : h}:${PORT} · static ${DIST} · /api/* -> ${PORTAL.origin}`);
  });
}
