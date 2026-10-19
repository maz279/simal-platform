/* ==========================================================================
 * http.js — zero-dependency router + middleware chain + static server.
 * Routing uses literal segment matching only (no dynamic RegExp construction).
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SECURITY_HEADERS, verifyCsrfToken } from './security.js';
import { config } from '../config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
};

/* ---------- response helpers ---------- */
export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}
export function json(res, status, obj, headers = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
export const ok = (res, obj, h) => json(res, 200, obj, h);
export const created = (res, obj) => json(res, 201, obj);
export const fail = (res, status, message, details) => json(res, status, { error: message, ...(details ? { details } : {}) });

/* ---------- request body (JSON, capped, content-type verified: SEC-7 / P8-1) ---------- */
/* `types`: JSON media types the route accepts (deploy-audit M11 — browsers POST CSP violation
 * reports as application/csp-report, which this reader refused with 415 before any audit). */
export function readJsonBody(req, limitBytes = 2 * 1024 * 1024, { types = ['application/json'] } = {}) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] || 0);
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    const hasBodyDeclared = declared > 0 || Boolean(req.headers['transfer-encoding']);
    const typeOk = types.some((t) => ct.includes(t));

    if (hasBodyDeclared && !typeOk) {
      return reject(new HttpError(415, 'Unsupported Media Type: expected application/json'));
    }
    if (declared > limitBytes) return reject(new HttpError(413, 'Request body too large'));
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > limitBytes) { reject(new HttpError(413, 'Request body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      if (!typeOk) {
        return reject(new HttpError(415, 'Unsupported Media Type: expected application/json'));
      }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'Invalid JSON body')); }
    });
    req.on('error', () => reject(new HttpError(400, 'Body read error')));
  });
}

/* ---------- router: method + ':param' segments, literal matching ---------- */
function matchPattern(patternSegs, pathSegs) {
  if (patternSegs.length !== pathSegs.length) return null;
  const params = {};
  for (let i = 0; i < patternSegs.length; i++) {
    const p = patternSegs[i];
    if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(pathSegs[i]);
    else if (p !== pathSegs[i]) return null;
  }
  return params;
}
export function Router() {
  const routes = [];
  const add = (method, pattern, ...handlers) => {
    routes.push({ method, segs: pattern.split('/').filter(Boolean), handlers });
  };
  return {
    get: (p, ...h) => add('GET', p, ...h),
    post: (p, ...h) => add('POST', p, ...h),
    put: (p, ...h) => add('PUT', p, ...h),
    delete: (p, ...h) => add('DELETE', p, ...h),
    routes,
  };
}
export function matchRoute(router, method, pathname) {
  const pathSegs = pathname.split('/').filter(Boolean);
  for (const r of router.routes) {
    if (r.method !== method) continue;
    const params = matchPattern(r.segs, pathSegs);
    if (params) return { handlers: r.handlers, params };
  }
  return null;
}

/* ---------- static files (fingerprinted assets get immutable cache) ---------- */
export function serveStatic(req, res, urlPath, rootDir) {
  const parts = urlPath.split(/[\\/]/).filter(Boolean);
  if (parts.some(p => p.startsWith('.'))) return false; // dotfile deny (SEC-12 / P8-5)
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  if (rel.includes('\0') || rel.includes('..') || rel.split(/[\\/]/).some(part => part.startsWith('.'))) return false; // null-byte / traversal / dotfile deny
  const root = path.resolve(rootDir);
  const abs = path.resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + path.sep)) return false;    // boundary check
  let stat;
  try { stat = fs.statSync(abs); } catch { return false; }
  if (!stat.isFile()) return false;
  const ext = path.extname(abs).toLowerCase();
  // Only fingerprinted URLs (?v=N) may be cached immutably; a bare asset path must
  // always revalidate so a forgotten bump can never pin a stale build for a year.
  const immutable = /[?]v=[0-9a-z]+/.test(req.url);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') { res.end(); return true; }
  fs.createReadStream(abs).pipe(res);
  return true;
}

/* ---------- server core: dispatch with handler chains ---------- */
export async function dispatch({ req, res, router, staticRoot, onError }) {
  const u = new URL(req.url, 'http://localhost');
  req.query = u.searchParams;
  req.path = u.pathname;
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);

  /* CSRF & Cross-Site protection on state-changing requests (SEC-7 / P8-1) */
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  if (isStateChanging) {
    const secFetchSite = (req.headers['sec-fetch-site'] || '').toLowerCase();
    const origin = req.headers['origin'];
    const csrfToken = req.headers['x-csrf-token'];
    // F-2026-N02 (rm(2.1-1)): a token header is only honored when it VERIFIES against the
    // session id (HMAC synchronizer token). Mere presence must never bypass the checks.
    const sidMatch = /(?:^|;\s*)(?:__Host-)?kyc_sid=([a-f0-9]{64})/.exec(req.headers.cookie || '');
    const csrfOk = Boolean(csrfToken && sidMatch && verifyCsrfToken(String(csrfToken), sidMatch[1]));

    // 1. Cross-site request blocking: Sec-Fetch-Site: cross-site without a VALID token is rejected
    if (secFetchSite === 'cross-site' && !csrfOk) {
      throw new HttpError(403, 'Cross-site request blocked: missing or invalid CSRF token');
    }

    // 2. Origin validation: if an origin header is present, ensure it matches allowed origins or has CSRF token
    if (origin) {
      let isAllowed = false;
      try {
        const uOrigin = new URL(origin);
        const hostHeader = (req.headers.host || '').toLowerCase();
        const originHost = uOrigin.host.toLowerCase();
        const allowedHosts = new Set([
          hostHeader,
          '127.0.0.1:8090', 'localhost:8090',
          '127.0.0.1:8100', 'localhost:8100',
          (() => { try { return new URL(config.siteUrl).host; } catch { return '127.0.0.1:8100'; } })(),
          '127.0.0.1:9090', 'localhost:9090',
          'simalme.com', 'kyc.simalme.com', 'www.simalme.com',
          ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().toLowerCase()) : [])
        ]);
        if (allowedHosts.has(originHost) || allowedHosts.has(uOrigin.hostname.toLowerCase())) {
          isAllowed = true;
        }
      } catch { isAllowed = false; }

      if (!isAllowed && !csrfOk) {
        throw new HttpError(403, 'Cross-origin request blocked: untrusted origin');
      }
    }

    /* rm(10.3-1 pen CSRF-12): policy B — when CSRF_STRICT=true, a cookie-authenticated
     * state-changing request to a privileged API must carry a VERIFIED token. The
     * flag was documented but never consulted, so it had no effect. Default off. */
    if (process.env.CSRF_STRICT === 'true' && sidMatch && !csrfOk &&
        /^\/api\/(admin|cms|einvoice|integrations)\//.test(req.path) &&
        req.path !== '/api/integrations/email/bounce') {
      throw new HttpError(403, 'CSRF token required');
    }
  }

  const m = matchRoute(router, req.method, req.path);
  if (m) {
    req.params = m.params;
    const noop = () => {}; // middleware calls next(); the chain advances via this loop
    for (const h of m.handlers) {
      await h(req, res, noop);
      if (res.writableEnded) return;
    }
    return;
  }
  if ((req.method === 'GET' || req.method === 'HEAD') && serveStatic(req, res, req.path, staticRoot)) return;
  throw new HttpError(404, 'Not found');
}
