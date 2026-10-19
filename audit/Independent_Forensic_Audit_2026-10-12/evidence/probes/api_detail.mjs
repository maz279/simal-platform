import { client } from './api.mjs';
const c = client();
await c.call('POST', '/api/auth/login', { email: 'admin@simalme.com', password: '[REDACTED-ROTATED-2026-10]' });
for (const p of ['/api/cms/telemetry', '/api/integrations/health', '/api/admin/settings']) {
  const r = await c.call('GET', p); console.log('=== ' + p + '\n' + JSON.stringify(r.data, null, 1).slice(0, 1800));
}
const a = await c.call('GET', '/api/cms/announcements'); console.log('=== announcements\n' + JSON.stringify(a.data, null, 1));
const t = await c.call('GET', '/api/cms/testimonials'); console.log('=== testimonials\n' + JSON.stringify(t.data, null, 1).slice(0, 1500));
const m = await c.call('GET', '/api/cms/media'); console.log('=== media sample\n' + JSON.stringify(m.data.media.slice(0, 3), null, 1));
const r = await c.call('GET', '/api/admin/rfqs'); console.log('=== rfqs\n' + JSON.stringify(r.data, null, 1).slice(0, 2500));
