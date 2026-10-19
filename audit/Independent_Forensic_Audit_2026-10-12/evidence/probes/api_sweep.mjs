import { client } from './api.mjs';
const c = client();
const show = (label, r, f = (d) => '') => console.log(`${String(r.status).padEnd(4)} ${String(r.ms).padStart(4)}ms  ${label}  ${f(r.data)}`);
const len = (d) => Array.isArray(d) ? `count=${d.length}` : (d && typeof d === 'object') ? Object.entries(d).map(([k, v]) => Array.isArray(v) ? `${k}[${v.length}]` : '').filter(Boolean).join(' ') || JSON.stringify(d).slice(0, 160) : String(d).slice(0, 120);

// unauthenticated probes
for (const p of ['/api/cms/products', '/api/cms/blocks', '/api/admin/submissions', '/api/admin/users']) show('UNAUTH GET ' + p, await c.call('GET', p), len);
show('GET /api/health', await c.call('GET', '/api/health'), len);
show('GET /api/settings (public)', await c.call('GET', '/api/settings'), len);

// login (dev bootstrap admin from .env)
const login = await c.call('POST', '/api/auth/login', { email: 'admin@simalme.com', password: '[REDACTED-ROTATED-2026-10]' });
show('POST /api/auth/login admin@simalme.com', login, (d) => JSON.stringify(d).slice(0, 200));
console.log('   Set-Cookie:', login.setCookie.join(' || '));
const me = await c.call('GET', '/api/auth/me'); show('GET /api/auth/me', me, (d) => JSON.stringify(d).slice(0, 200));

const eps = ['/api/cms/telemetry', '/api/cms/products', '/api/cms/slides', '/api/cms/policies', '/api/cms/announcements', '/api/cms/testimonials', '/api/cms/blocks', '/api/cms/media', '/api/cms/outbox',
  '/api/cms/blocks/site/featured-products', '/api/cms/blocks/site/offices', '/api/cms/blocks/site/amc-tiers', '/api/cms/products/crucial-t705-ssd-2', '/api/cms/policies/privacy-policy', '/api/cms/revisions/announcements/1',
  '/api/admin/submissions', '/api/admin/analytics', '/api/admin/audit', '/api/admin/rfqs', '/api/admin/outbox', '/api/admin/users', '/api/admin/sessions', '/api/admin/settings', '/api/admin/invites', '/api/admin/reports',
  '/api/einvoice/admin/queue', '/api/integrations/health', '/api/integrations/email/dns', '/api/integrations/analytics/events'];
for (const p of eps) { const r = await c.call('GET', p); show('GET ' + p, r, len); }
