/* ==========================================================================
 * rules.js — workflow state machine + RBAC matrix (PRD §11, FR-A-002/014).
 * Single source of truth; both services and tests consume it.
 * ========================================================================== */

export const STATUSES = ['draft', 'submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold', 'approved', 'rejected'];
export const PENDING_SET = ['submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold'];
export const TERMINAL = ['approved', 'rejected'];
export const PARTNER_EDITABLE = ['draft', 'query_raised', 'partner_updated'];

/** allowed transitions: from -> [to] */
export const TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['under_review', 'rejected'],
  under_review: ['query_raised', 'on_hold', 'approved', 'rejected'],
  query_raised: ['partner_updated', 'under_review', 'rejected'],
  partner_updated: ['under_review', 'query_raised', 'on_hold', 'approved', 'rejected'],
  on_hold: ['under_review', 'rejected'],
  approved: ['under_review'],   // reopen (super admin only)
  rejected: [],                 // reapply = new submission linked to the old one
};

/** RBAC permission matrix (FR-A-002) */
export const PERMISSIONS = {
  super_admin: ['read', 'export', 'decide', 'query', 'notes', 'reopen', 'view_pii', 'manage_invites', 'manage_users', 'read_audit'], // rm(2.3-2): manage_users = super_admin-only trust ops (webhook signing)
  reviewer: ['read', 'export', 'decide', 'query', 'notes', 'manage_invites', 'read_audit'],
  viewer: ['read', 'export'],
};
export function can(session, perm) {
  if (!session || !session.role) return false;
  return (PERMISSIONS[session.role] || []).includes(perm);
}

/** action -> { to, requiresReason, permission } */
export const ACTIONS = {
  start: { to: 'under_review', from: ['submitted'], requiresReason: false, permission: 'decide' },
  approve: { to: 'approved', from: ['under_review', 'partner_updated'], requiresReason: false, permission: 'decide' },
  reject: { to: 'rejected', from: ['submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold'], requiresReason: true, permission: 'decide' },
  hold: { to: 'on_hold', from: ['under_review', 'partner_updated', 'query_raised'], requiresReason: true, permission: 'decide' },
  reopen: { to: 'under_review', from: ['approved'], requiresReason: false, permission: 'reopen' },
  query: { to: 'query_raised', from: ['submitted', 'under_review', 'partner_updated', 'on_hold'], requiresReason: false, permission: 'query' },
};

export function canApplyAction(submission, action, session) {
  const rule = ACTIONS[action];
  if (!rule) return { ok: false, reason: 'Unknown action', code: 400 };
  if (!can(session, rule.permission)) return { ok: false, reason: 'Insufficient role for "' + action + '"', code: 403 };
  if (!rule.from.includes(submission.status)) {
    return { ok: false, reason: 'Action "' + action + '" is not allowed from status "' + submission.status + '"', code: 409 };
  }
  return { ok: true, rule };
}
