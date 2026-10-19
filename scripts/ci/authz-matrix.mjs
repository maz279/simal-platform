// scripts/ci/authz-matrix.mjs — P0-3(b) gate (guards SEC-3 / SEC-5)
// Boots the portal on an ephemeral port (JSON store, generated credentials),
// provisions the four roles, then asserts DENY-BY-DEFAULT on every privileged
// route: anonymous, partner and viewer must receive 401/403 on all (except the
// viewer's two granted surfaces, asserted positively)
// /api/admin/*, /api/einvoice/admin/* and /api/integrations/* routes.
// Reviewer must additionally be denied user/session/settings management.
// A 200 from the wrong role is a violation; so is any response body that
// leaks a raw IBAN (AE + 21 digits) to a non-privileged role.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bootApp, login, report, PORTAL_DIR } from './lib.mjs';

const ROUTES = [
  ['GET', '/api/admin/submissions?per=5'],
  ['GET', '/api/admin/analytics'],
  ['GET', '/api/admin/audit'],
  ['GET', '/api/admin/export.csv'],
  ['GET', '/api/admin/invites'],
  ['GET', '/api/admin/rfqs'],
  ['GET', '/api/admin/outbox'],
  ['GET', '/api/admin/users'],
  ['GET', '/api/admin/sessions'],
  ['GET', '/api/admin/settings'],
  ['GET', '/api/admin/reports'],
  ['POST', '/api/admin/reports/build', { fields: ['id'] }],
  ['GET', '/api/admin/documents/gate-nonexistent-doc'],
  ['GET', '/api/einvoice/admin/queue'],
  ['GET', '/api/einvoice/admin/gate-nonexistent-inv'],
  ['GET', '/api/integrations/health'],
  ['GET', '/api/integrations/email/dns'],
  ['GET', '/api/integrations/analytics/events'],
  ['POST', '/api/integrations/email/send', { to: 'nobody@example.invalid', template: 'kyc.approved', data: {} }],
  ['GET', '/api/cms/outbox'],
  /* rm(7.3-2): dual-approval endpoints are staff-only (cmsAuth) */
  ['GET', '/api/cms/publish-approvals'],
  ['POST', '/api/cms/publish-approvals/gate-nonexistent/approve'],
  ['POST', '/api/cms/publish-approvals/gate-nonexistent/reject'],
];

/* rm(10.4-1 / RTM DEV-13): the viewer role's declared grants (read + export) are
 * bound to exactly two surfaces. Every other admin route must stay 401/403. */
const VIEWER_ALLOWED = new Set(['GET /api/admin/submissions?per=5', 'GET /api/admin/export.csv']);

const REVIEWER_DENIED = [
  ['GET', '/api/admin/users'],
  ['GET', '/api/admin/sessions'],
  ['GET', '/api/admin/settings'],
  ['POST', '/api/admin/users', { name: 'x', email: 'gate-x@example.invalid', password: 'gate-x-pass-9chars', role: 'viewer' }],
];

const app = await bootApp({ mode: 'json' });
let code = 0;
try {
  const admin = await login(app.base, app.creds.adminEmail, app.creds.adminPassword, app.creds.adminTotp);
  const reviewer = await login(app.base, app.creds.reviewerEmail, app.creds.reviewerPassword);
  const viewer = await login(app.base, app.creds.viewerEmail, app.creds.viewerPassword);
  if (!admin || !reviewer || !viewer) {
    code = report('GATE authz-matrix (SEC-3/SEC-5)', ['could not bootstrap staff sessions']);
    process.exit(code);
  }
  /* 'partner' is not a staff role — provision it through the store directly,
     exactly as the partner-onboarding flow would. */
  const partnerEmail = `gate-partner@example.invalid`;
  const partnerPassword = 'gate-partner-' + Math.random().toString(36).slice(2, 10);
  const { hashPassword } = await import(pathToFileURL(path.join(PORTAL_DIR, 'src', 'lib', 'security.js')).href);
  await app.app.repos.users.create({
    email: partnerEmail, name: 'Gate Partner', role: 'partner',
    passwordHash: hashPassword(partnerPassword), totpSecret: null,
  });
  const partner = await login(app.base, partnerEmail, partnerPassword);

  const failures = [];
  const sessions = { anonymous: null, partner, viewer, reviewer };

  async function hit(role, method, path, body) {
    const headers = {};
    if (sessions[role]) headers.cookie = sessions[role];
    if (body) headers['content-type'] = 'application/json';
    const r = await fetch(app.base + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    return { status: r.status, text };
  }

  for (const [method, path, body] of ROUTES) {
    for (const role of ['anonymous', 'partner', 'viewer']) {
      const { status, text } = await hit(role, method, path, body);
      /* rm(10.4-1/DEV-13): the viewer's declared read/export grants are bound to the
       * masked queue and the masked CSV — exactly those two may succeed (and must
       * not leak an IBAN); every other route still has to deny. */
      const viewerGranted = role === 'viewer' && VIEWER_ALLOWED.has(`${method} ${path}`);
      if (viewerGranted) {
        if (status !== 200) failures.push(`viewer grant ${method} ${path} -> ${status} (expected 200)`);
      } else if (status < 400) {
        failures.push(`${role} reached ${method} ${path} -> ${status} (expected 401/403)`);
      }
      if (/AE\d{21}/.test(text)) {
        failures.push(`${role} saw a RAW IBAN in response to ${method} ${path}`);
      }
    }
  }
  /* the viewer must still be denied a decision action and the detail of a record */
  for (const [method, path, body] of [['POST', '/api/admin/submissions/none/actions', { action: 'approve' }], ['GET', '/api/admin/submissions/gate-none/checklist']]) {
    const { status } = await hit('viewer', method, path, body);
    if (status < 400) failures.push(`viewer reached ${method} ${path} -> ${status} (expected 401/403)`);
  }
  for (const [method, path, body] of REVIEWER_DENIED) {
    const { status } = await hit('reviewer', method, path, body);
    if (status < 400) failures.push(`reviewer reached ${method} ${path} -> ${status} (expected 401/403)`);
  }
  if (!partner) failures.push('partner provisioning failed — cannot prove partner denial');

  code = report('GATE authz-matrix (SEC-3/SEC-5)', failures);
} finally {
  await app.stop();
}
process.exit(code);
