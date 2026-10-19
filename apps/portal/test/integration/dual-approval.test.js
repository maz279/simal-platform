// test/integration/dual-approval.test.js — rm(9.2-2) / rm(7.3-4) (SEC-11 residue, F-2026-N12)
// SEC-11 dual-approval matrix on REAL PostgreSQL (publish_approvals table, audit-driven
// dirty set, real outbox) — as a discoverable node:test file so `npm test` and the CI
// globs pick it up (it used to live at test/dual-approval.test.js, outside every glob).
// Provisions its own scratch database; skips where no PostgreSQL is reachable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);

test('SEC-11 / rm(7.3-4): dual-approval matrix on PostgreSQL (server-derived dirty set)', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'apr');
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  const app = boot.app;
  try {
    const { base, creds } = boot;
    const login = async (email, password, totp) => {
      const r = await fetch(base + '/api/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, totp }),
      });
      if (!r.ok) return null;
      return (r.headers.get('set-cookie') || '').split(';')[0];
    };
    const admin = await login(creds.adminEmail, creds.adminPassword, creds.adminTotp);
    const reviewer = await login(creds.reviewerEmail, creds.reviewerPassword);
    const viewer = await login(creds.viewerEmail, creds.viewerPassword);
    const reviewer2 = await login(creds.reviewerEmail, creds.reviewerPassword); // second session, same user
    assert.ok(admin && reviewer && viewer && reviewer2, 'staff sessions');

    const csrf = async (cookie) => (await (await fetch(base + '/api/auth/me', { headers: { cookie } })).json()).csrfToken;

    async function req(method, p, body, cookie) {
      const headers = { cookie, 'content-type': 'application/json' };
      if (cookie && (method === 'POST' || method === 'PUT')) headers['x-csrf-token'] = await csrf(cookie);
      const r = await fetch(base + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
      let j = null; try { j = await r.json(); } catch {}
      return { status: r.status, data: j };
    }
    const q = async (sql, params) => (await app.repos.client.query(sql, params)).rows;
    const ssgCount = async () => (await q("SELECT COUNT(*)::int AS n FROM outbox WHERE to_addr='ssg-builder'"))[0].n;

    /* clean slate for the dirty set: mark everything built */
    await q("INSERT INTO audit_log (ts, actor, action, target, details) VALUES ($1,'system','ssg_build_completed','test','baseline')", [Date.now()]);
    /* node:test gives every subtest a FRESH context — carry case state in a closure */
    const st = {};

    await t.test('1: reviewer pricing edit + site/all publish → 202 + 0 ssg-builder rows', async () => {
      const before1 = await ssgCount();
      const put = await req('PUT', '/api/cms/blocks/erp/pricing', { payload: { note: 'rm(7.3) case-1 marker' } }, reviewer);
      assert.equal(put.status, 200, 'block edit lands (edits are live at save time)');
      const pub1 = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }], purgeAll: true }, reviewer);
      assert.equal(pub1.status, 202, 'sensitive dirty set → 202, not 200');
      assert.ok(pub1.data.pending && pub1.data.approvalId, 'approvalId returned');
      assert.deepEqual(pub1.data.changeSet, ['erp/pricing'], 'server-derived dirty set = the edited pricing block');
      assert.equal(await ssgCount(), before1, 'NOTHING enqueued to ssg-builder');
      st.approvalId = pub1.data.approvalId;
      st.before1 = before1;
    });

    await t.test('2: self-approval and same-user-second-session → 403', async () => {
      const approvalId = st.approvalId;
      assert.equal((await req('POST', `/api/cms/publish-approvals/${approvalId}/approve`, {}, reviewer)).status, 403, 'requester cannot approve');
      assert.equal((await req('POST', `/api/cms/publish-approvals/${approvalId}/approve`, {}, reviewer2)).status, 403, 'second session of same user cannot approve');
    });

    await t.test('4: reject → 200, no outbox row, status=rejected', async () => {
      const { before1 } = st; const approvalId = st.approvalId;
      const pub1b = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }], purgeAll: true }, reviewer);
      assert.equal(pub1b.status, 202);
      assert.equal(pub1b.data.approvalId, approvalId, 'same dirty set reuses the pending approval');
      const rej = await req('POST', `/api/cms/publish-approvals/${approvalId}/reject`, { reason: 'case-4 reject' }, admin);
      assert.equal(rej.status, 200, 'reject by super_admin');
      assert.equal(await ssgCount(), before1, 'reject leaves no outbox row');
      assert.equal((await q(`SELECT status FROM publish_approvals WHERE id='${approvalId}'`))[0].status, 'rejected');
    });

    await t.test('3: fresh request, distinct approver → 200 + exactly one ssg row', async () => {
      const before1 = st.before1;
      const pub2 = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }], purgeAll: true }, reviewer);
      assert.equal(pub2.status, 202, 'new request after reject');
      const id2 = pub2.data.approvalId;
      assert.notEqual(id2, st.approvalId, 'a NEW approval row (previous was rejected)');
      const appr = await req('POST', `/api/cms/publish-approvals/${id2}/approve`, {}, admin);
      assert.equal(appr.status, 200, 'super_admin (distinct user) approves');
      assert.equal(await ssgCount(), before1 + 1, 'exactly one queued ssg-builder row');
      const row3 = (await q(`SELECT status, decided_by FROM publish_approvals WHERE id='${id2}'`))[0];
      assert.equal(row3.status, 'approved');
      assert.equal(String(row3.decided_by).toLowerCase(), creds.adminEmail.toLowerCase(), 'decided_by is the approver (CITEXT)');
      st.before6 = await ssgCount();
    });

    await t.test('5: reviewer emergency-publish WITH attested approver → 403', async () => {
      assert.equal((await req('POST', '/api/cms/emergency-publish', { entity: 'site', entityId: 'x', payload: { reason: 'rm(7.3) case 5' }, secondApproverEmail: creds.adminEmail }, reviewer)).status, 403);
    });

    await t.test('6: super_admin emergency override → enqueued + audited + notified', async () => {
      const before6 = st.before6;
      const em = await req('POST', '/api/cms/emergency-publish', { entity: 'site', entityId: 'gate-emergency-block', payload: { note: 'rm(7.3) case 6' }, reason: 'rm(7.3) integration case 6' }, admin);
      assert.equal(em.status, 200, 'super_admin override');
      assert.equal(await ssgCount(), before6 + 1, 'enqueued');
      assert.ok((await q("SELECT COUNT(*)::int AS n FROM audit_log WHERE action='cms_emergency_override'"))[0].n >= 1, 'override audited');
      assert.ok((await q("SELECT COUNT(*)::int AS n FROM outbox WHERE subject LIKE 'Emergency publish override%'"))[0].n >= 1, 'super_admin notified');
    });

    await t.test('7: legal policy + announcement edits route through the same matrix', async () => {
      const pol = await req('PUT', '/api/cms/policies/gate-7-3-policy', { title: 'rm(7.3) case 7', body: 'legal marker' }, reviewer);
      assert.equal(pol.status, 200, 'policy upsert');
      const ann = await req('PUT', '/api/cms/announcements/1', { text: 'rm(7.3) case 7 announcement' }, reviewer);
      assert.equal(ann.status, 200, 'announcement upsert');
      const pub7 = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }] }, reviewer);
      assert.equal(pub7.status, 202, 'legal+announcement dirty set is sensitive');
      // deploy-audit D06: policies are per language, so the dirty-set key names it (slug:lang)
      assert.ok(pub7.data.changeSet.includes('legal_policies/gate-7-3-policy:en') && pub7.data.changeSet.includes('announcements/1'), 'both mapped domains in the set: ' + pub7.data.changeSet.join(','));
      await req('POST', `/api/cms/publish-approvals/${pub7.data.approvalId}/approve`, {}, admin);
    });

    await t.test('8: expired approval → 409', async () => {
      const put8 = await req('PUT', '/api/cms/blocks/erp/pricing', { payload: { note: 'rm(7.3) case-8 marker' } }, reviewer);
      assert.equal(put8.status, 200, 'fresh sensitive edit');
      const pub8 = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }] }, reviewer);
      assert.equal(pub8.status, 202); // pricing still dirty (no ssg_build_completed in this run)
      await q(`UPDATE publish_approvals SET expires_at = $1 WHERE id = $2`, [Date.now() - 1000, pub8.data.approvalId]);
      const appr8 = await req('POST', `/api/cms/publish-approvals/${pub8.data.approvalId}/approve`, {}, admin);
      assert.equal(appr8.status, 409, 'expired approval refused');
    });

    await t.test('9: dirty set changed after request → 409', async () => {
      const pub9 = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }] }, reviewer);
      assert.equal(pub9.status, 202);
      const putMore = await req('PUT', '/api/cms/blocks/site/footer', { payload: { marker: 'rm(7.3) case 9 extra edit' } }, reviewer);
      assert.equal(putMore.status, 200);
      const appr9 = await req('POST', `/api/cms/publish-approvals/${pub9.data.approvalId}/approve`, {}, admin);
      assert.equal(appr9.status, 409, 'dirty-set drift refused');
      assert.match(appr9.data?.error || '', /changed since/, 'drift message');
    });

    await t.test('10: viewer blocked from the approval endpoints (deny-by-default)', async () => {
      const pub9b = await req('POST', '/api/cms/publish', { entities: [{ entity: 'site', entity_id: 'all' }] }, reviewer);
      for (const p of ['/api/cms/publish-approvals', `/api/cms/publish-approvals/${pub9b.data.approvalId}/approve`]) {
        const r0 = await req(p.startsWith('/api/cms/publish-approvals/') ? 'POST' : 'GET', p, p.endsWith('approve') ? {} : undefined, viewer);
        assert.ok(r0.status === 403 || r0.status === 401, 'viewer blocked from ' + p);
      }
    });
  } finally {
    await boot.stop();
    if (app?.repos?.client) await app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});
