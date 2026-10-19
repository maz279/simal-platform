/* ==========================================================================
 * analytics.service.js — dashboard KPIs, funnel, aging, expiry tracking.
 * export.service.js  — PII-safe CSV master export.
 * invite.service.js  — bulk import + invite link generation (FR-A-023).
 * ========================================================================== */
import { PENDING_SET } from '../domain/rules.js';
import { HttpError } from '../lib/http.js';
import { V } from '../domain/validators.js';
import { token } from '../lib/security.js';

export function createAnalytics(repos) {
  async function stats() {
    const subs = await repos.submissions.all();
    const byStatus = {};
    for (const s of subs) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    const cycles = subs.filter(s => s.status === 'approved').map(s => {
      const last = s.history && s.history.length ? s.history[s.history.length - 1] : null;
      const subTime = Number(s.submittedAt || s.submitted_at) || s.createdAt || Date.now();
      const endTime = (last && last.ts) ? Number(last.ts) : Number(s.updatedAt || s.updated_at) || Date.now();
      return Math.max(0, (endTime - subTime) / 3600000);
    });
    const withQuery = subs.filter(s => (s.queries || []).length > 0).length;
    return {
      total: subs.length,
      pending: subs.filter(s => PENDING_SET.includes(s.status)).length,
      approved: byStatus.approved || 0,
      rejected: byStatus.rejected || 0,
      byStatus,
      avgCycleHours: cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length * 10) / 10 : 0,
      firstPassRate: subs.length ? Math.round(((subs.length - withQuery) / subs.length) * 100) : 0,
      queryRate: subs.length ? Math.round((withQuery / subs.length) * 100) : 0,
    };
  }

  async function aging(limit = 10) {
    const subs = await repos.submissions.all();
    return subs
      .filter(s => PENDING_SET.includes(s.status))
      .map(s => {
        const subTime = Number(s.submittedAt || s.submitted_at) || s.createdAt || Date.now();
        return {
          id: s.id,
          company: s.company?.legal_name_en || s.company?.name || 'Unknown',
          status: s.status,
          ageDays: Math.max(0, Math.floor((Date.now() - subTime) / 86400000))
        };
      })
      .sort((a, b) => b.ageDays - a.ageDays)
      .slice(0, limit);
  }

  async function expiries(withinDays = 60) {
    const out = [];
    const push = (sub, kind, date) => {
      const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
      if (days >= 0 && days <= withinDays) out.push({ ref: sub.id, company: sub.company.legal_name_en, kind, date, days });
    };
    for (const s of await repos.submissions.all()) {
      if (s.company?.license_expiry) push(s, 'Trade licence', s.company.license_expiry);
      for (const g of s.signatories || []) {
        if (g.id_type === 'eid' && g.id_expiry) push(s, 'Emirates ID — ' + g.name, g.id_expiry);
      }
    }
    return out.sort((a, b) => a.days - b.days);
  }

  return { stats, aging, expiries };
}

export function createExport(repos) {
  const COLUMNS = [
    ['id', 'Reference'], ['role', 'Role'], ['status', 'Status'],
    ['company.legal_name_en', 'Legal name'], ['company.license_number', 'Licence no'],
    ['company.license_expiry', 'Licence expiry'], ['company.address.emirate', 'Emirate'],
    ['tax.trn', 'TRN'], ['tax.peppol_id', 'Peppol ID'], ['tax.einv_status', 'E-invoicing status'],
    ['contacts.primary.email', 'Primary email'], ['banking.bank_name', 'Bank'], ['banking.iban', 'IBAN'],
    ['submittedAtISO', 'Submitted'], ['reviewer', 'Reviewer'], ['screeningClear', 'Screening'],
  ];
  const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? '' : x[k]), o);

  async function csv({ status = 'all', role = 'all', includePii = false, session }) {
    let list = (await repos.submissions.all()).slice();
    if (status === 'pending') list = list.filter(s => PENDING_SET.includes(s.status));
    else if (status !== 'all') list = list.filter(s => s.status === status);
    if (role !== 'all') list = list.filter(s => s.role === role);
    list.sort((a, b) => b.submittedAt - a.submittedAt);

    const cols = COLUMNS.concat(includePii ? [['__ids', 'Signatory IDs']] : []);
    const lines = [cols.map(c => '"' + c[1] + '"').join(',')];
    for (const s of list) {
      lines.push(cols.map(c => {
        let v;
        if (c[0] === 'submittedAtISO') {
          const raw = s.submittedAt ?? s.submitted_at;
          const d = raw ? new Date(Number(raw) || raw) : null;
          v = (d && !isNaN(d.getTime())) ? d.toISOString().slice(0, 10) : '';
        }
        else if (c[0] === 'screeningClear') v = s.screening ? (s.screening.clear ? 'clear' : 'HIT(' + s.screening.hits.length + ')') : '';
        else if (c[0] === '__ids') v = (s.signatories || []).map(g => '••••' + String(g.id_number || '').slice(-4)).join(' | ');
        else v = get(s, c[0]);
        if (!includePii && v) {
          const sv = String(v);
          if (c[0] === 'banking.iban') v = sv.slice(0, 7) + '••••' + sv.slice(-4);
          else if (c[0] === 'tax.trn') v = sv.slice(0, 4) + '•••••' + sv.slice(-3);       // rm(2.2-1) / SEC-6
          else if (c[0] === 'contacts.primary.email') v = sv.slice(0, 3) + '•••';         // rm(2.2-1) / SEC-6
        }
        return '"' + String(v ?? '').replace(/"/g, '""') + '"';
      }).join(','));
    }
    await repos.audit(session ? 'user:' + session.userId : 'system', 'exported', list.length + ' records', includePii ? 'full-PII' : 'PII-safe');
    return lines.join('\r\n');
  }
  return { csv };
}

export function createInvites(repos) {
  async function bulkImport({ csv, session, baseUrl }) {
    if (!csv || !String(csv).trim()) throw new HttpError(400, 'CSV content is required');
    const valid = [], errors = [];
    String(csv).split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const parts = t.split(',').map(p => p.trim());
      if (parts.length < 3) { errors.push('Line ' + (i + 1) + ': expected 3 fields (name,email,role)'); return; }
      const [name, email, role] = parts;
      if (!name) { errors.push('Line ' + (i + 1) + ': missing company name'); return; }
      if (!V.email(email)) { errors.push('Line ' + (i + 1) + ': invalid email "' + email + '"'); return; }
      if (!['vendor', 'customer'].includes(role.toLowerCase())) { errors.push('Line ' + (i + 1) + ': role must be vendor or customer'); return; }
      valid.push({ company: name, email: email.toLowerCase(), role: role.toLowerCase() });
    });
    if (!valid.length) throw new HttpError(422, 'No valid rows', errors);
    const created = valid.map(v => ({
      code: 'INV-' + token(5).toUpperCase().slice(0, 8),
      company: v.company, email: v.email, role: v.role,
      createdAt: Date.now(), createdBy: 'user:' + (session ? session.userId : 'system'),
      status: 'link-generated',
    }));
    await repos.invites.add(created);
    await repos.audit('user:' + (session ? session.userId : 'system'), 'bulk_import',
      created.length + ' invites', errors.length ? errors.length + ' row(s) rejected' : '');
    const links = created.map(c => ({
      code: c.code, company: c.company, email: c.email, role: c.role,
      link: baseUrl + '/form.html?role=' + c.role + '&email=' + encodeURIComponent(c.email) + '&invite=' + c.code,
    }));
    return { imported: created.length, rejected: errors, links };
  }
  return { bulkImport, all: () => repos.invites.all() };
}
