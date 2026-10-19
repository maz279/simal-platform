// test/integration/batch-jobs.test.js — rm(9.2-2) / rm(7.2-2)/rm(7.2-3) (NFR-6, F-2026-N12)
// SLA escalation + licence expiry reminder batch jobs, exercised against a real
// booted portal on a scratch PostgreSQL database — as a discoverable node:test
// file (it used to live at test/batch-jobs.test.js, outside every npm test glob).
// Skips where no PostgreSQL is reachable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bootApp, scratchDatabase, adminUrlFromEnv, pgReachable } from '../../../../scripts/ci/lib.mjs';

const DAY = 86400000;
// Fixed "now": Monday 2026-10-12 12:00 GST — deterministic relative to fixtures
const NOW = Date.parse('2026-10-12T12:00:00+04:00');

const explicitDb = process.env.E2E_DATABASE_URL || null;
const adminUrl = explicitDb ? null : await adminUrlFromEnv();
const pgUp = await pgReachable(explicitDb || adminUrl);

test('NFR-6 / rm(7.2-2): escalateSlaBreaches emails once, audits once, dedupes; query_raised paused', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'job');
  process.env.SLA_ESCALATION_EMAIL = 'ops-e2e@example.invalid';
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  const app = boot.app; // { server, repos, store, config, auth, escalateSlaBreaches, remindExpiries }
  try {
    const sub = {
      id: 'SIM-JOB-ESCALATE-1',
      role: 'vendor',
      status: 'submitted',                       // pending, no query, no resubmission
      company: { legal_name_en: 'Escalation Fixture LLC', license_expiry: null },
      submittedAt: NOW - 5 * DAY,                // 5 business days — deep past the 2bd SLA
      createdAt: NOW - 5 * DAY,
      updatedAt: NOW - 5 * DAY,
      history: [],
    };
    await app.repos.submissions.add(sub);

    const q = async (sql) => (await app.repos.client.query(sql)).rows;
    const before = (await q("SELECT COUNT(*)::int AS n FROM outbox WHERE to_addr='ops-e2e@example.invalid'"))[0].n;

    const n1 = await app.escalateSlaBreaches(NOW);
    assert.equal(n1, 1, 'exactly one escalation on first call');
    const out1 = await q("SELECT channel, to_addr, subject FROM outbox WHERE to_addr='ops-e2e@example.invalid'");
    assert.equal(out1.length - before, 1, 'exactly one escalation outbox row');
    assert.match(out1[out1.length - 1].subject, /KYC SLA breach — SIM-JOB-ESCALATE-1/);
    const aud1 = await q("SELECT COUNT(*)::int AS n FROM audit_log WHERE action='sla_escalated' AND target='SIM-JOB-ESCALATE-1'");
    assert.equal(aud1[0].n, 1, 'exactly one sla_escalated audit row');

    const n2 = await app.escalateSlaBreaches(NOW);
    assert.equal(n2, 0, 'second call adds nothing (audit dedupe)');
    const out2 = await q("SELECT COUNT(*)::int AS n FROM outbox WHERE to_addr='ops-e2e@example.invalid'");
    assert.equal(out2[0].n - before, 1, 'still exactly one escalation outbox row');

    // a query_raised twin must NOT escalate (a11 pause)
    await app.repos.submissions.add({
      id: 'SIM-JOB-ESCALATE-2', role: 'vendor', status: 'query_raised',
      company: { legal_name_en: 'Paused Fixture LLC' },
      submittedAt: NOW - 5 * DAY, createdAt: NOW - 5 * DAY, updatedAt: NOW - 5 * DAY, history: [],
    });
    const n3 = await app.escalateSlaBreaches(NOW);
    assert.equal(n3, 0, 'query_raised submissions never escalate');
  } finally {
    await boot.stop();
    if (app?.repos?.client) await app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});

test('NFR-6 / rm(7.2-3): remindExpiries — approved-only ladder 30d/14d, deduped per partner+threshold', { skip: pgUp ? false : 'no PostgreSQL reachable (set GATE_ADMIN_URL or ADMIN_DATABASE_URL)' }, async (t) => {
  const scratch = explicitDb ? null : await scratchDatabase(adminUrl, 'job2');
  const boot = await bootApp({ mode: 'pg', databaseUrl: explicitDb || scratch.url, mfa: false });
  const app = boot.app;
  try {
    await app.repos.submissions.add({
      id: 'SIM-JOB-EXPIRY-30', role: 'vendor', status: 'approved',
      company: { legal_name_en: 'Expiry Wide LLC', license_expiry: new Date(NOW + 25 * DAY).toISOString().slice(0, 10) },
      submittedAt: NOW - 40 * DAY, createdAt: NOW - 40 * DAY, updatedAt: NOW - 10 * DAY, history: [],
    });
    await app.repos.submissions.add({
      id: 'SIM-JOB-EXPIRY-14', role: 'vendor', status: 'approved',
      company: { legal_name_en: 'Expiry Near LLC', license_expiry: new Date(NOW + 10 * DAY).toISOString().slice(0, 10) },
      submittedAt: NOW - 40 * DAY, createdAt: NOW - 40 * DAY, updatedAt: NOW - 10 * DAY, history: [],
    });
    await app.repos.submissions.add({
      id: 'SIM-JOB-EXPIRY-PENDING', role: 'vendor', status: 'submitted', // not approved — skipped
      company: { legal_name_en: 'Expiry Pending LLC', license_expiry: new Date(NOW + 10 * DAY).toISOString().slice(0, 10) },
      submittedAt: NOW - 40 * DAY, createdAt: NOW - 40 * DAY, updatedAt: NOW - 40 * DAY, history: [],
    });

    const q = async (sql) => (await app.repos.client.query(sql)).rows;
    const e1 = await app.remindExpiries(NOW);
    assert.equal(e1, 2, 'one reminder per approved expiring partner (30d + 14d buckets)');
    const exOut = await q("SELECT to_addr, subject FROM outbox WHERE subject LIKE 'Licence expiring%' ORDER BY subject");
    assert.equal(exOut.length, 2);
    assert.match(exOut.find((r) => r.subject.includes('30d')).subject, /SIM-JOB-EXPIRY-30/);
    assert.match(exOut.find((r) => r.subject.includes('14d')).subject, /SIM-JOB-EXPIRY-14/);
    const exAud = await q("SELECT target FROM audit_log WHERE action='expiry_reminded' ORDER BY target");
    assert.deepEqual(exAud.map((r) => r.target), ['SIM-JOB-EXPIRY-14:14d', 'SIM-JOB-EXPIRY-30:30d']);

    const e2 = await app.remindExpiries(NOW);
    assert.equal(e2, 0, 'second call adds nothing (per partner+threshold dedupe)');
  } finally {
    await boot.stop();
    if (app?.repos?.client) await app.repos.client.end().catch(() => {});
    await scratch?.drop().catch(() => {});
  }
});
