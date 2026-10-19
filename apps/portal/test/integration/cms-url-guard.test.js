// test/integration/cms-url-guard.test.js — rm(9.2-2) / F-2026-N10 (roadmap 3.2-2)
// Regression coverage for the API-boundary URL guard: a javascript:/data:/vbscript:
// scheme, a protocol-relative //host and control-char smuggling must be refused
// with 422 on EVERY CMS write path — announcements, hero slides, content blocks
// (recursive, incl. insight CTA arrays), product-deep docs, and ROLLBACK restores.
// Needs PostgreSQL (CMS service is SQL-backed); skips where no server is reachable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);

test('F-2026-N10: stored-URL guard rejects dangerous schemes on every CMS write path (3.2-2)', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'urlguard');
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  let app;
  try {
    app = boot.app;
    const { base, creds } = boot;
    const login = async (email, password) => {
      const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }) });
      assert.equal(r.status, 200, 'staff login');
      return (r.headers.get('set-cookie') || '').split(';')[0];
    };
    const reviewer = await login(creds.reviewerEmail, creds.reviewerPassword);
    const csrf = async () => (await (await fetch(base + '/api/auth/me', { headers: { cookie: reviewer } })).json()).csrfToken;
    const req = async (method, p, body) => {
      const r = await fetch(base + p, { method, headers: { cookie: reviewer, 'content-type': 'application/json', 'x-csrf-token': await csrf() },
        body: body ? JSON.stringify(body) : undefined });
      let j = null; try { j = await r.json(); } catch { /* non-JSON */ }
      return { status: r.status, data: j };
    };

    await t.test('announcements: javascript:, //host and control-char hrefs are 422; relative path is 200', async () => {
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: 'javascript:alert(1)' })).status, 422);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: 'data:text/html,<script>x</script>' })).status, 422);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: '//evil.example/x' })).status, 422);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: '/\\evil.example/x' })).status, 422);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: 'java\tscript:alert(1)' })).status, 422);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: '/products/' })).status, 200);
      assert.equal((await req('PUT', '/api/cms/announcements/1', { text: 'guard probe', cta_href: 'https://simalme.com/catalogue/' })).status, 200);
    });

    await t.test('hero slides: upsert refuses javascript: cta_href (422 before persistence)', async () => {
      assert.equal((await req('PUT', '/api/cms/slides/1', { idx: 1, kick: 'k', headline: 'h', sub: '', cta_label: 'Go', cta_href: 'javascript:alert(1)', active: true })).status, 422);
    });

    await t.test('content blocks: recursive guard over href|url|link keys and insight cta[1]', async () => {
      assert.equal((await req('PUT', '/api/cms/blocks/rmtest/guard', { payload: { note: 'x', link: 'javascript:alert(1)' } })).status, 422);
      assert.equal((await req('PUT', '/api/cms/blocks/rmtest/guard', { payload: { note: 'x', nested: { footer_url: '//evil.example/' } } })).status, 422);
      assert.equal((await req('PUT', '/api/cms/blocks/rmtest/insight', { payload: { title: 't', cta: ['Read more', 'javascript:alert(1)'] } })).status, 422);
      const okBlock = await req('PUT', '/api/cms/blocks/rmtest/guard', { payload: { note: 'x', link: '/about/', cta: ['Read more', '/insights/'] } });
      assert.equal(okBlock.status, 200, 'legit block payload persists');
    });

    await t.test('product deep docs: docs[].url and datasheet_url validated', async () => {
      // seeded slug — product_deep.slug carries an FK to products.slug
      const P = '/api/cms/products/dell-15-laptop-14th-gen-intel-core-3/deep';
      assert.equal((await req('PUT', P, { hero: 'h', docs: [{ name: 'Spec', url: 'javascript:alert(1)' }] })).status, 422);
      assert.equal((await req('PUT', P, { hero: 'h', datasheet_url: 'data:application/pdf,x' })).status, 422);
      assert.equal((await req('PUT', P, { hero: 'h', docs: [{ name: 'Spec', url: '/assets/docs/spec.pdf' }] })).status, 200);
    });

    await t.test('rollback: a revision carrying a hostile cta_href is refused, not restored', async () => {
      const q = (sql, params) => app.repos.client.query(sql, params);
      // plant a hostile revision directly (the API itself can no longer produce one)
      await q(`INSERT INTO cms_revisions (table_name, record_id, payload, actor, created_at)
               VALUES ('hero_slides', '1', $1, 'rm(9.2-2) probe', $2)`,
        [JSON.stringify({ idx: 1, kick: 'k', headline: 'hostile revision', sub: '', cta_label: 'Go', cta_href: 'javascript:alert(1)', active: true }), Date.now()]);
      const rb = await req('POST', '/api/cms/revisions/hero_slides/1/rollback');
      assert.equal(rb.status, 422, 'rollback must not restore an unsafe cta_href');
      const slide = (await q('SELECT cta_href FROM hero_slides WHERE idx = 1')).rows[0];
      assert.ok(!/^javascript:/i.test(String(slide?.cta_href || '')), 'stored slide cta_href unchanged');
      await q(`INSERT INTO cms_revisions (table_name, record_id, payload, actor, created_at)
               VALUES ('announcements', '1', $1, 'rm(9.2-2) probe', $2)`,
        [JSON.stringify({ text: 'hostile', cta_href: '//evil.example/', cta_label: 'x', active: true }), Date.now()]);
      assert.equal((await req('POST', '/api/cms/revisions/announcements/1/rollback')).status, 422, 'announcement rollback guarded too');
    });
  } finally {
    await boot.stop();
    if (app?.repos?.client) await app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});
