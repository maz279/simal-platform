/* ==========================================================================
 * api.js — frontend API client for the KYC_System backend.
 * Frontend API client for the KYC_System backend; helpers keep
 * the page controllers small. All calls are fetch-based with credentials.
 * ========================================================================== */
(function (global) {
  'use strict';

  /* rm(2.1-3) / F-2026-N02: session-bound CSRF synchronizer token store.
   * Captured automatically from any response (X-CSRF-Token header or csrfToken
   * body field — login/mfa/register/me/session all emit it) and attached to
   * every mutating request. Server VERIFIES it (HMAC vs session id). */
  let CSRF = null;

  async function call(method, path, body, opts = {}) {
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (CSRF && method !== 'GET' && method !== 'HEAD') headers['x-csrf-token'] = CSRF;
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      keepalive: !!opts.keepalive,   // survives page unload (draft flush on hide)
    });
    const rotated = res.headers.get('X-CSRF-Token');
    if (rotated) CSRF = rotated;
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON (csv) */ }
    if (json && json.csrfToken) CSRF = json.csrfToken;
    if (!res.ok) {
      const err = new Error((json && json.error) || ('HTTP ' + res.status));
      err.status = res.status;
      err.details = json && json.details;
      throw err;
    }
    return json;
  }
  const qs = (params) => {
    const u = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') u.set(k, v); });
    const s = u.toString();
    return s ? '?' + s : '';
  };

  global.API = {
    /* rm(2.1-3): CSRF synchronizer token store (see call() below) */
    setCsrf: (t) => { if (t) CSRF = t; },
    csrf: () => CSRF,
    /* generic passthrough (used by the e-invoicing pages + CMS studio) */
    call: (method, path, body) => call(method, path, body),
    get: (path) => call('GET', path),
    put: (path, body) => call('PUT', path, body),
    post: (path, body) => call('POST', path, body),
    delete: (path) => call('DELETE', path),
    /* settings + public */
    settings: () => call('GET', '/api/settings'),
    createDraft: (email, role) => call('POST', '/api/public/drafts', { email, role }),
    saveDraft: (id, token, patch, keepalive) => call('PUT', '/api/public/drafts/' + id, { token, ...patch }, { keepalive }),
    getDraft: (id, token) => call('GET', '/api/public/drafts/' + id + qs({ token })),
    stageDocuments: (id, token, documents) => call('POST', '/api/public/drafts/' + id + '/documents', { token, documents }),
    submitApplication: (payload) => call('POST', '/api/public/applications', payload),
    publicStatus: (ref, email) => call('GET', '/api/public/applications/' + encodeURIComponent(ref) + qs({ email })),
    respondToQuery: (ref, email, message) => call('POST', '/api/public/applications/' + encodeURIComponent(ref) + '/respond', { email, message }),
    inviteInfo: (code) => call('GET', '/api/public/invites/' + encodeURIComponent(code)),
    tinCheck: (trn) => call('GET', '/api/public/tin-check' + qs({ trn })),

    /* auth */
    login: (email, password) => call('POST', '/api/auth/login', { email, password }),
    verifyMfa: (challengeId, code) => call('POST', '/api/auth/mfa', { mfaChallengeId: challengeId, code }),
    logout: () => call('POST', '/api/auth/logout'),
    me: () => call('GET', '/api/auth/me'),
    session: () => call('GET', '/api/auth/session').catch(() => ({ authenticated: false })),
    passwordResetRequest: (email) => call('POST', '/api/auth/password-reset/request', { email }),
    passwordResetConfirm: (token, newPassword) => call('POST', '/api/auth/password-reset/confirm', { token, newPassword }),

    /* admin */
    listSubmissions: (params) => call('GET', '/api/admin/submissions' + qs(params)),
    getSubmission: (id, pii) => call('GET', '/api/admin/submissions/' + encodeURIComponent(id) + (pii ? '?pii=full' : '')),
    action: (id, act, reason) => call('POST', '/api/admin/submissions/' + encodeURIComponent(id) + '/actions', { action: act, reason }),
    raiseQuery: (id, section, message) => call('POST', '/api/admin/submissions/' + encodeURIComponent(id) + '/query', { section, message }),
    setChecklist: (id, item, checked) => call('POST', '/api/admin/submissions/' + encodeURIComponent(id) + '/checklist', { item, checked }),
    addNote: (id, text) => call('POST', '/api/admin/submissions/' + encodeURIComponent(id) + '/notes', { text }),
    analytics: () => call('GET', '/api/admin/analytics'),
    audit: (q, action) => call('GET', '/api/admin/audit' + qs({ q, action })),
    outbox: () => call('GET', '/api/admin/outbox'),
    invites: () => call('GET', '/api/admin/invites'),
    bulkImport: (csv) => call('POST', '/api/admin/invites/bulk', { csv }),
    exportCsvUrl: (params) => '/api/admin/export.csv' + qs(params),
    documentUrl: (docId) => '/api/admin/documents/' + encodeURIComponent(docId),

    /* admin workspace */
    users: () => call('GET', '/api/admin/users'),
    createUser: (data) => call('POST', '/api/admin/users', data),
    updateUser: (id, data) => call('PUT', '/api/admin/users/' + encodeURIComponent(id), data),
    resetPassword: (id) => call('POST', '/api/admin/users/' + encodeURIComponent(id) + '/reset-password'),
    deactivateUser: (id) => call('POST', '/api/admin/users/' + encodeURIComponent(id) + '/deactivate'),
    sessions: () => call('GET', '/api/admin/sessions'),
    forceLogout: (sid) => call('POST', '/api/admin/sessions/' + encodeURIComponent(sid) + '/force-logout'),
    getSettings: () => call('GET', '/api/admin/settings'),
    updateSettings: (data) => call('PUT', '/api/admin/settings', data),
    reports: () => call('GET', '/api/admin/reports'),
    buildReport: (data) => call('POST', '/api/admin/reports/build', data),
  };
})(window);
