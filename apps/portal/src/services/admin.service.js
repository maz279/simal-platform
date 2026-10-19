/* ==========================================================================
 * admin.service.js — user CRUD, settings management, report builder.
 * Super-admin gated (RBAC); every mutation audit-logged.
 * All repos calls are awaited (JSON store is async-wrapped; PG is native async).
 * ========================================================================== */
import { HttpError } from '../lib/http.js';
import { hashPassword, token } from '../lib/security.js';
import { config } from '../config.js';
import { V } from '../domain/validators.js';
import { can } from '../domain/rules.js';

const ROLES = ['super_admin', 'reviewer', 'viewer'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function createAdminService(repos) {

  /* ================= USER MANAGEMENT ================= */

  async function listUsers() {
    const logins = await repos.auditLog('', 'login');   // newest-first (unshift on write)
    const users = await repos.users.all();
    return users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      active: u.active, hasTotp: !!u.totpSecret,
      createdAt: u.createdAt,
      lastLogin: (logins.find(a => a.actor === u.email) || {}).ts || null,
    }));
  }

  async function createUser({ email, name, role, password, totpSecret }, session) {
    if (!EMAIL_RE.test(email || '')) throw new HttpError(400, 'A valid email address is required');
    if (!name || !name.trim()) throw new HttpError(400, 'Name is required');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Role must be one of: ' + ROLES.join(', '));
    if (!password || password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    if (totpSecret && !/^[A-Z2-7]{16,}$/i.test(totpSecret)) throw new HttpError(400, 'TOTP secret must be valid base32 (A-Z, 2-7, min 16 chars)');
    if (await repos.users.findByEmail(email)) throw new HttpError(409, 'A user with this email already exists');

    const user = await repos.users.create({
      email, name: name.trim(), role,
      passwordHash: hashPassword(password),
      totpSecret: totpSecret ? totpSecret.toUpperCase() : null,
    });
    await repos.audit('user:' + session.userId, 'user_created', user.email, 'role=' + role);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async function updateUser(id, { name, role, active }, session) {
    const user = await repos.users.get(id);
    if (!user) throw new HttpError(404, 'User not found');
    if (user.email === config.bootstrap.adminEmail && (active === false || role !== 'super_admin')) {
      throw new HttpError(403, 'Cannot demote or deactivate the bootstrap admin account');
    }
    const changes = [];
    if (name !== undefined && name.trim()) { user.name = name.trim(); changes.push('name'); }
    if (role !== undefined && ROLES.includes(role)) { user.role = role; changes.push('role=' + role); }
    if (active !== undefined) { user.active = !!active; changes.push(active ? 'activated' : 'deactivated'); }
    await repos.users.save(user);
    await repos.audit('user:' + session.userId, 'user_updated', user.email, changes.join(', '));
    return { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active };
  }

  async function resetPassword(id, session) {
    const user = await repos.users.get(id);
    if (!user) throw new HttpError(404, 'User not found');
    const newPassword = token(12); /* random 24-char hex */
    user.passwordHash = hashPassword(newPassword);
    await repos.users.save(user);
    await repos.audit('user:' + session.userId, 'password_reset', user.email, 'temporary password issued');
    return { temporaryPassword: newPassword }; /* shown once to the admin, never stored in plaintext */
  }

  async function deactivateUser(id, session) {
    const user = await repos.users.get(id);
    if (!user) throw new HttpError(404, 'User not found');
    if (user.id === session.userId) throw new HttpError(400, 'Cannot deactivate your own account');
    if (user.email === config.bootstrap.adminEmail) throw new HttpError(403, 'Cannot deactivate the bootstrap admin');
    user.active = false;
    await repos.users.save(user);
    await repos.audit('user:' + session.userId, 'user_deactivated', user.email, '');
    return { id: user.id, active: false };
  }

  async function activeSessions() {
    const all = await repos.sessions.all();
    const rows = [];
    for (const s of all) {
      if (!(await repos.sessions.isLive(s))) continue;
      const u = await repos.users.get(s.userId);
      rows.push({
        sid: s.sid.slice(0, 8) + '…',
        fullSidPrefix: s.sid.slice(0, 8),
        userId: s.userId,
        user: u ? u.email : 'unknown',
        role: u ? u.role : '?',
        loggedInAt: s.createdAt,
        createdAt: s.createdAt,
        lastSeen: s.lastSeen,
        expiresAt: s.expiresAt,
        ip: s.ip || '—'
      });
    }
    return rows;
  }

  async function forceLogout(sidPrefix, session) {
    const cleanPrefix = String(sidPrefix || '').replace(/[…\s.]+$/, '').trim();
    if (!cleanPrefix) throw new HttpError(400, 'Invalid session prefix');
    const all = await repos.sessions.all();
    const s = all.find(s => s.sid.startsWith(cleanPrefix));
    if (!s) throw new HttpError(404, 'Session not found');
    const u = await repos.users.get(s.userId);
    await repos.sessions.destroy(s.sid);
    await repos.audit('user:' + session.userId, 'force_logout', u ? u.email : cleanPrefix, '');
    return { ok: true };
  }

  /* ================= SETTINGS ================= */

  async function getSettings() {
    const s = await repos.settings();
    return {
      simalTin: s.simalTin || '',
      simalPeppol: s.simalPeppol || '',
      session: {
        idleMinutes: config.session.idleMinutes,
        absoluteHours: config.session.absoluteHours,
      },
      smtp: {
        configured: !!config.notify.smtp,
        host: config.notify.smtp ? config.notify.smtp.host : '',
        from: config.notify.smtp ? config.notify.smtp.from : '',
        emailEnabled: config.notify.emailEnabled,
        whatsappEnabled: config.notify.whatsappEnabled,
      },
      screening: {
        watchlistPath: config.screening.watchlistCsv,
        entries: 0, /* populated by caller with screening.size() */
        fuzzyThreshold: config.screening.fuzzyThreshold,
      },
      integration: {
        masterApiTokenConfigured: !!config.integration.masterApiToken,
        webhookUrlConfigured: !!config.integration.webhookUrl,
      },
    };
  }

  async function updateSettings(patch, session) {
    const s = await repos.settings();
    const changes = [];
    if (patch.simalTin !== undefined) {
      /* same mod-97 rule the partner applications are held to */
      if (patch.simalTin !== '' && !V.tin(patch.simalTin)) throw new HttpError(400, 'Simal TIN must be 15 digits with a valid mod-97 checksum');
      s.simalTin = patch.simalTin;
      changes.push('simalTin');
    }
    if (patch.simalPeppol !== undefined) {
      if (patch.simalPeppol !== '' && !/^0235:\d{15}$/.test(patch.simalPeppol)) throw new HttpError(400, 'Peppol ID must look like 0235:<15-digit TIN>');
      s.simalPeppol = patch.simalPeppol;
      changes.push('simalPeppol');
    }
    await repos.persist();
    await repos.audit('user:' + session.userId, 'settings_updated', 'system', changes.join(', '));
    return getSettings();
  }

  /* ================= REPORT BUILDER ================= */

  const REPORT_FIELDS = {
    id: 'Reference', role: 'Role', status: 'Status',
    'company.legal_name_en': 'Legal Name',
    'company.license_number': 'Licence No',
    'company.license_authority': 'Licence Authority',
    'company.license_expiry': 'Licence Expiry',
    'company.address.emirate': 'Emirate',
    'company.address.country': 'Country',
    'tax.trn': 'TRN',
    'tax.peppol_id': 'Peppol ID',
    'tax.einv_status': 'E-Invoicing Status',
    'tax.invoice_currency': 'Currency',
    'contacts.primary.name': 'Primary Contact',
    'contacts.primary.email': 'Contact Email',
    'contacts.primary.mobile': 'Contact Mobile',
    'banking.bank_name': 'Bank',
    'banking.iban': 'IBAN',
    'banking.currency': 'Account Currency',
    reviewer: 'Reviewer',
    rejection_reason: 'Rejection Reason',
    submittedAtISO: 'Submitted Date',
    approvedAtISO: 'Approved Date',
    ageDays: 'Age (days)',
    docCount: 'Document Count',
    screeningClear: 'Screening Clear',
    inviteCode: 'Invite Code',
  };

  async function buildReport({ builtIn, fields, filters = {}, sortBy = 'submittedAtISO', sortDir = 'desc' }, session) {
    /* resolve a built-in id into its advertised defaults (explicit fields still win) */
    const def = builtIn ? BUILT_IN.find(b => b.id === builtIn) : null;
    if (def && !(fields && fields.length)) {
      fields = def.defaults.fields;
      filters = { ...(def.defaults.filters || {}), ...filters };
    }
    /* the activity log is audit-trail-backed, not submission-backed */
    if (builtIn === 'user-activity') return buildAuditReport(filters, session);
    /* validate requested fields */
    const selected = (fields || []).filter(f => REPORT_FIELDS[f]);
    if (!selected.length) selected.push('id', 'role', 'status', 'company.legal_name_en', 'submittedAtISO');

    let rows = (await repos.submissions.all()).slice();

    /* filters */
    if (filters.role && filters.role !== 'all') rows = rows.filter(s => s.role === filters.role);
    if (filters.status && filters.status !== 'all') rows = rows.filter(s => s.status === filters.status);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      rows = rows.filter(s => (Number(s.submittedAt || s.submitted_at) || 0) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 86400000;
      rows = rows.filter(s => (Number(s.submittedAt || s.submitted_at) || 0) <= to);
    }
    if (filters.q) {
      const needle = filters.q.toLowerCase();
      rows = rows.filter(s =>
        (s.company.legal_name_en + ' ' + s.id + ' ' + (s.tax?.trn || '') + ' ' + (s.contacts?.primary?.email || ''))
          .toLowerCase().includes(needle));
    }
    if (filters.screeningOnly) rows = rows.filter(s => s.screening && !s.screening.clear);

    /* computed fields */
    const enriched = rows.map(s => {
      const subTime = s.submittedAt || s.submitted_at;
      const subDate = subTime ? new Date(subTime) : null;
      const subValid = subDate && !isNaN(subDate.getTime());
      const upTime = s.updatedAt || s.updated_at || subTime;
      const upDate = upTime ? new Date(upTime) : null;
      const upValid = upDate && !isNaN(upDate.getTime());
      return {
        ...s,
        submittedAtISO: subValid ? subDate.toISOString().slice(0, 10) : '',
        approvedAtISO: (s.status === 'approved' && upValid) ? upDate.toISOString().slice(0, 10) : '',
        ageDays: subValid ? Math.floor((Date.now() - subDate.getTime()) / 86400000) : 0,
        docCount: (s.documents || []).length,
        screeningClear: s.screening ? (s.screening.clear ? 'Yes' : 'NO (' + s.screening.hits.length + ' hits)') : '',
      };
    });

    /* sort */
    const getVal = (s, key) => key.split('.').reduce((o, k) => (o == null ? '' : o[k]), s) || '';
    enriched.sort((a, b) => {
      const va = getVal(a, sortBy), vb = getVal(b, sortBy);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    await repos.audit('user:' + session.userId, 'report_generated', selected.length + ' fields × ' + enriched.length + ' rows',
      JSON.stringify(filters));

    return {
      columns: selected.map(f => ({ key: f, label: REPORT_FIELDS[f] })),
      rowCount: enriched.length,
      rows: enriched.map(s => {
        const row = {};
        const canViewPii = session && can(session, 'view_pii');
        selected.forEach(f => {
          let v = getVal(s, f);
          // rm(2.2-1) / SEC-6: mask PII fields for every role without view_pii (IBAN, TRN,
          // contact email/mobile, licence number). reportToCsv() consumes these rows, so
          // CSV exports inherit the masking automatically.
          if (!canViewPii && v !== null && v !== undefined && v !== '') {
            const sv = String(v);
            if (f === 'banking.iban') v = sv.slice(0, 7) + '••••' + sv.slice(-4);
            else if (f === 'tax.trn') v = sv.slice(0, 4) + '•••••' + sv.slice(-3);
            else if (f === 'contacts.primary.email') v = sv.slice(0, 3) + '•••';
            else if (f === 'contacts.primary.mobile') v = sv.slice(0, 4) + '•••' + sv.slice(-2);
            else if (f === 'company.license_number') v = sv.slice(0, 3) + '•••' + sv.slice(-2);
          }
          row[f] = String(v ?? '');
        });
        return row;
      }),
      availableFields: Object.entries(REPORT_FIELDS).map(([key, label]) => ({ key, label })),
    };
  }

  async function reportToCsv(report) {
    const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [report.columns.map(c => esc(c.label)).join(',')];
    for (const row of report.rows) {
      lines.push(report.columns.map(c => esc(row[c.key])).join(','));
    }
    return lines.join('\r\n');
  }

  /* audit-trail report (backs the user-activity built-in) */
  const AUDIT_FIELDS = { ts: 'Timestamp', actor: 'Actor', action: 'Action', target: 'Target', details: 'Details' };
  async function buildAuditReport(filters = {}, session) {
    let rows = await repos.auditLog(filters.q || '',
      filters.action && filters.action !== 'all' ? filters.action : 'all');
    if (filters.dateFrom) rows = rows.filter(a => a.ts >= new Date(filters.dateFrom).getTime());
    if (filters.dateTo) rows = rows.filter(a => a.ts <= new Date(filters.dateTo).getTime() + 86400000);
    await repos.audit('user:' + session.userId, 'report_generated', 'user-activity', rows.length + ' rows');
    return {
      columns: Object.entries(AUDIT_FIELDS).map(([key, label]) => ({ key, label })),
      rowCount: rows.length,
      rows: rows.map(a => {
        const raw = a.ts;
        const d = raw ? new Date(Number(raw) || raw) : new Date();
        const validD = isNaN(d.getTime()) ? new Date() : d;
        return {
          ts: validD.toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          actor: a.actor, action: a.action, target: a.target, details: a.details,
        };
      }),
      availableFields: Object.entries(AUDIT_FIELDS).map(([key, label]) => ({ key, label })),
    };
  }

  /* built-in report definitions */
  const BUILT_IN = [
    { id: 'onboarding-summary', name: 'Onboarding Summary', description: 'All submissions with status, reviewer and cycle metrics', defaults: { fields: ['id', 'role', 'status', 'company.legal_name_en', 'tax.trn', 'reviewer', 'submittedAtISO', 'ageDays'] } },
    { id: 'screening-hits', name: 'Screening Hits', description: 'Submissions with watchlist matches (investigate these)', defaults: { fields: ['id', 'company.legal_name_en', 'screeningClear', 'status', 'reviewer'], filters: { screeningOnly: true } } },
    { id: 'expiring-docs', name: 'Expiring Documents', description: 'Licences and IDs expiring within 90 days', defaults: { fields: ['id', 'company.legal_name_en', 'company.license_expiry', 'status'] } },
    { id: 'approved-master', name: 'Approved Counterparty Master', description: 'The ERP/ASP integration feed — approved records only', defaults: { fields: ['id', 'role', 'company.legal_name_en', 'tax.trn', 'tax.peppol_id', 'company.address.country', 'banking.bank_name', 'banking.iban', 'approvedAtISO'], filters: { status: 'approved' } } },
    { id: 'rejected-analysis', name: 'Rejection Analysis', description: 'Rejected submissions with reasons for pattern review', defaults: { fields: ['id', 'company.legal_name_en', 'rejection_reason', 'reviewer', 'submittedAtISO'], filters: { status: 'rejected' } } },
    { id: 'user-activity', name: 'User Activity Log', description: 'All admin actions from the audit trail', defaults: { fields: ['ts', 'actor', 'action', 'target', 'details'] } },
  ];

  return {
    listUsers, createUser, updateUser, resetPassword, deactivateUser,
    activeSessions, forceLogout,
    getSettings, updateSettings,
    buildReport, reportToCsv,
    builtInReports: BUILT_IN,
    availableFields: Object.entries(REPORT_FIELDS).map(([key, label]) => ({ key, label })),
    ROLES,
  };
}
