// rm(7.3-4) rewrite — dual approval on the SERVER-DERIVED dirty set (SEC-11 residue).
// The old tests asserted the removed caller-attested secondApproverEmail path; the
// new model classifies the audit-log dirty set, creates publish_approvals rows and
// returns { pending: true } (HTTP 202) instead of throwing 403.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCmsService, changeKey, isSensitiveChange } from '../../src/services/cms.service.js';
import { HttpError } from '../../src/lib/http.js';

const users = [
  { email: 'editor@simalme.com', role: 'reviewer', active: true },
  { email: 'reviewer@simalme.com', role: 'reviewer', active: true },
  { email: 'admin@simalme.com', role: 'super_admin', active: true },
];

function createMockRepos({ dirty = [], approvals = [] } = {}) {
  const auditLogs = [];
  const outboxRows = [];
  const approvalRows = approvals.slice();

  const client = {
    async query(sql, params = []) {
      if (sql.includes('FROM audit_log')) return { rows: dirty.slice() };            // dirtySet()
      if (sql.includes('INSERT INTO publish_approvals')) {
        const row = { id: params[0], requested_by: params[1], change_set: params[2], status: 'pending', expires_at: params[4], created_at: params[5], decided_by: null, decided_at: null, outbox_id: null };
        approvalRows.push(row);
        return { rows: [] };
      }
      if (sql.includes('FROM publish_approvals WHERE id = $1')) {
        return { rows: approvalRows.filter((r) => r.id === params[0]) };
      }
      if (sql.includes('FROM publish_approvals')) {
        return { rows: approvalRows.slice() };
      }
      if (sql.includes('UPDATE publish_approvals')) {
        const row = approvalRows.find((r) => r.id === params[0]); // id is always $1
        if (row) {
          if (sql.includes("status='approved'")) { row.status = 'approved'; row.decided_by = params[1]; row.decided_at = params[2]; row.outbox_id = params[3]; }
          if (sql.includes("status='rejected'")) { row.status = 'rejected'; row.decided_by = params[2]; row.decided_at = params[3]; }
          if (sql.includes("status='expired'")) { row.status = 'expired'; row.decided_by = params[2]; row.decided_at = params[3]; }
        }
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO outbox')) {
        outboxRows.push({ id: params[0], channel: params[1], to: params[2], subject: params[3], body: params[4], status: params[5] });
        return { rows: [] };
      }
      return { rows: [] };
    },
  };

  const repos = {
    client,
    users: { async all() { return users; } },
    /* notify.send writes through repos.outbox.add (stateless seam) */
    outbox: {
      async add(e) { outboxRows.push({ id: e.id || 'ntf_' + outboxRows.length, channel: e.channel, to: e.to, subject: e.subject, body: e.text, status: e.status }); return e; },
      async markSent() {}, async markSimulated() {},
    },
    async audit(actor, action, target, details) { auditLogs.push({ actor, action, target, details, ts: Date.now() }); },
  };
  return { repos, auditLogs, outboxRows, approvalRows };
}

const session = (email, role) => ({ user: { email }, role });
const ssgRows = (m) => m.outboxRows.filter((o) => o.to === 'ssg-builder');

test('changeKey maps the audit vocabulary onto normalized domains', () => {
  assert.equal(changeKey('cms_block_upserted', 'erp/pricing'), 'erp/pricing');
  assert.equal(changeKey('cms_policy_upserted', 'terms-conditions'), 'legal_policies/terms-conditions');
  assert.equal(changeKey('cms_announcement_upserted', 'announcement-1'), 'announcements/1');
  assert.equal(changeKey('cms_testimonial_upserted', 'testimonial-3'), 'testimonials/3');
  assert.equal(changeKey('cms_slide_upserted', 'slide-2'), 'hero_slides/2');
  assert.equal(changeKey('cms_slide_deleted', 'slide-5'), 'hero_slides/5');
  assert.equal(changeKey('cms_rollback', 'content_blocks/erp:pricing:en'), 'erp/pricing');
  assert.equal(changeKey('cms_rollback', 'hero_slides/2'), 'hero_slides/2');
  assert.equal(changeKey('cms_rollback', 'legal_policies/privacy-policy'), 'legal_policies/privacy-policy');
  assert.equal(changeKey('cms_product_updated', 'some-slug'), 'some-slug');
});

test('isSensitiveChange covers legal/marketing domains plus the legacy rules', () => {
  for (const k of ['legal_policies/privacy-policy', 'announcements/1', 'hero_slides/2', 'testimonials/3',
                   'erp/pricing', 'site/pricing-tiers', 'site/brand-auth', 'site/claims-register', 'compliance/peppol-dates']) {
    assert.equal(isSensitiveChange(k), true, k + ' must be sensitive');
  }
  for (const k of ['site/nav-menus', 'site/footer', 'insight/some-article', 'products/some-sku', 'brands/crucial']) {
    assert.equal(isSensitiveChange(k), false, k + ' must NOT be sensitive');
  }
});

test('publish() classifies the server-derived dirty set, never the declared entities', async () => {
  // reviewer edited erp/pricing, but DECLARES site/all — the old attested trick
  const m = createMockRepos({ dirty: [{ action: 'cms_block_upserted', target: 'erp/pricing', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const res = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));
  assert.equal(res.pending, true, 'sensitive dirty set must return pending');
  assert.ok(res.approvalId);
  assert.deepEqual(res.changeSet, ['erp/pricing']);
  assert.equal(ssgRows(m).length, 0, 'nothing may reach the ssg-builder queue');
  assert.equal(m.approvalRows.length, 1);
  assert.equal(m.approvalRows[0].requested_by, 'editor@simalme.com');
});

test('non-sensitive dirty set publishes directly', async () => {
  const m = createMockRepos({ dirty: [{ action: 'cms_block_upserted', target: 'site/nav-menus', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const res = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));
  assert.equal(res.ok, true);
  assert.equal(ssgRows(m).length, 1);
  assert.equal(m.approvalRows.length, 0);
});

test('re-publish while pending returns the SAME approval, still no outbox row', async () => {
  const m = createMockRepos({ dirty: [{ action: 'cms_policy_upserted', target: 'privacy-policy', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const first = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));
  const second = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('admin@simalme.com', 'super_admin'));
  assert.equal(second.pending, true);
  assert.equal(second.approvalId, first.approvalId);
  assert.equal(ssgRows(m).length, 0);
});

test('decideApproval enforces distinct user, TTL and dirty-set drift', async () => {
  const m = createMockRepos({ dirty: [{ action: 'cms_block_upserted', target: 'erp/pricing', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const { approvalId } = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));

  // requester self-approval (same user, second session, different case) → 403
  await assert.rejects(() => cms.decideApproval(approvalId, 'approve', session('EDITOR@SIMALME.COM', 'reviewer')),
    (e) => e instanceof HttpError && e.status === 403);

  // dirty-set drift → 409 (a NEW edit arrived after the request)
  const drifted = createMockRepos({
    dirty: [
      { action: 'cms_block_upserted', target: 'erp/pricing', ts: 1000 },
      { action: 'cms_policy_upserted', target: 'terms-conditions', ts: 2000 },
    ],
    approvals: m.approvalRows,
  });
  m.repos.client.query = drifted.repos.client.query;
  await assert.rejects(() => cms.decideApproval(approvalId, 'approve', session('reviewer@simalme.com', 'reviewer')),
    (e) => e instanceof HttpError && e.status === 409 && /changed since/.test(e.message));

  // expired → 409
  const fresh = createMockRepos({ dirty: [{ action: 'cms_block_upserted', target: 'erp/pricing', ts: 1000 }], approvals: m.approvalRows });
  m.repos.client.query = fresh.repos.client.query;
  m.approvalRows[0].expires_at = Date.now() - 1;
  await assert.rejects(() => cms.decideApproval(approvalId, 'approve', session('reviewer@simalme.com', 'reviewer')),
    (e) => e instanceof HttpError && e.status === 409 && /expired/i.test(e.message));
});

test('approve by a distinct reviewer enqueues exactly one build and records the decision', async () => {
  const m = createMockRepos({ dirty: [{ action: 'cms_announcement_upserted', target: 'announcement-1', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const { approvalId } = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));
  const res = await cms.decideApproval(approvalId, 'approve', session('reviewer@simalme.com', 'reviewer'));
  assert.equal(res.status, 'approved');
  assert.ok(res.outboxId);
  assert.equal(ssgRows(m).length, 1, 'exactly one ssg-builder row');
  assert.equal(m.approvalRows[0].status, 'approved');
  assert.equal(m.approvalRows[0].decided_by, 'reviewer@simalme.com');
  assert.equal(m.approvalRows[0].outbox_id, res.outboxId);
  // a repeat decision is refused
  await assert.rejects(() => cms.decideApproval(approvalId, 'approve', session('admin@simalme.com', 'super_admin')),
    (e) => e instanceof HttpError && e.status === 409);
});

test('reject leaves no outbox row and is audited', async () => {
  const m = createMockRepos({ dirty: [{ action: 'cms_slide_upserted', target: 'slide-1', ts: 1000 }] });
  const cms = createCmsService(m.repos);
  const { approvalId } = await cms.publish([{ entity: 'site', entity_id: 'all' }], session('editor@simalme.com', 'reviewer'));
  const res = await cms.decideApproval(approvalId, 'reject', session('admin@simalme.com', 'super_admin'), 'not compliant');
  assert.equal(res.status, 'rejected');
  assert.equal(ssgRows(m).length, 0);
  assert.ok(m.auditLogs.some((a) => a.action === 'cms_approval_rejected'));
});

test('emergencyPublish is a super_admin override — reviewers are 403 with or without attestation', async () => {
  const m = createMockRepos();
  const cms = createCmsService(m.repos);
  await assert.rejects(
    () => cms.emergencyPublish({ entity: 'site', entityId: 'global', payload: { reason: 'x' }, secondApproverEmail: 'admin@simalme.com' }, session('editor@simalme.com', 'reviewer')),
    (e) => e instanceof HttpError && e.status === 403 && /super_admin override/.test(e.message)
  );
  const res = await cms.emergencyPublish({ entity: 'compliance', entityId: 'statutory-dates', payload: { date: '2027-01-01' }, reason: 'statutory deadline' }, session('admin@simalme.com', 'super_admin'));
  assert.equal(res.emergency, true);
  assert.equal(ssgRows(m).length, 1);
  assert.ok(m.auditLogs.some((a) => a.action === 'cms_emergency_override'));
  assert.ok(m.outboxRows.some((o) => /Emergency publish override/.test(o.subject)), 'every super_admin notified');
});
