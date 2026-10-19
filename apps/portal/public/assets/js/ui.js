/* ==========================================================================
 * Simal KYC Portal — ui.js
 * Shared UI helpers: toasts, modals, formatting, tiny SVG icon set.
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- escaping & formatting ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtBytes(b) {
    if (!b && b !== 0) return '';
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
  }
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr); if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  }
  function timeAgo(ts) {
    if (!ts) return '';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  /* ---------- toast ---------- */
  function toastRegion() {
    var r = document.querySelector('.toast-region');
    if (!r) { r = document.createElement('div'); r.className = 'toast-region'; document.body.appendChild(r); }
    return r;
  }
  function toast(msg, kind) {
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    t.addEventListener('click', function () { t.remove(); });
    toastRegion().appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity 250ms'; t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 260);
    }, 3400);
  }

  /* ---------- modal (WCAG dialog pattern: focus in, Tab trap, Esc, focus restore) ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function modal(opts) {
    opts = opts || {};
    var opener = document.activeElement;
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" tabindex="-1">' +
      '<h3 id="m-title">' + esc(opts.title || '') + '</h3>' +
      '<div class="modal-body"></div>' +
      '<div class="row mt-8" style="justify-content:flex-end"></div>' +
      '</div>';
    var body = backdrop.querySelector('.modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    var actions = backdrop.querySelector('.row');

    function focusables() {
      return Array.prototype.filter.call(backdrop.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null;
      });
    }
    function close() {
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      if (opener && opener.focus) { try { opener.focus(); } catch (e) { /* detached */ } }
    }
    function onKey(e) {
      if (e.key === 'Escape' && opts.dismissable !== false) { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (document.activeElement && !backdrop.contains(document.activeElement)) {
          e.preventDefault(); first.focus();
        }
      }
    }

    (opts.actions || [{ label: 'Close' }]).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.cls || 'btn-secondary');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        var keep = a.onClick && a.onClick(backdrop) === false;
        if (!keep && a.close !== false) close();
      });
      actions.appendChild(b);
    });
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop && opts.dismissable !== false) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(backdrop);
    var f = backdrop.querySelector('input, textarea, select, button.btn-primary, button.btn-warn, button.btn-success');
    setTimeout(function () { (f || backdrop.querySelector('.modal')).focus(); }, 40);
    backdrop.close = close; /* exposed for programmatic close */
    return backdrop;
  }

  /* ---------- confirm helper ---------- */
  function confirmModal(title, message, onOk, okLabel, okCls) {
    modal({
      title: title,
      body: '<p class="mb-0">' + message + '</p>',
      actions: [
        { label: 'Cancel', cls: 'btn-secondary' },
        { label: okLabel || 'Confirm', cls: okCls || 'btn-primary', onClick: function () { onOk && onOk(); } }
      ]
    });
  }

  /* ---------- inline SVG icons (stroke, 24px, currentColor) ---------- */
  var P = {
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>',
    chevL: '<polyline points="15 18 9 12 15 6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="8" y2="8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="16" y1="6" x2="16" y2="8"/><line x1="8" y1="11" x2="8" y2="13"/><line x1="12" y1="11" x2="12" y2="13"/><line x1="16" y1="11" x2="16" y2="13"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    bank: '<rect x="2" y="7" width="20" height="12" rx="1"/><circle cx="12" cy="13" r="2.5"/><path d="M6 7V5a6 6 0 0 1 12 0v2"/>',
    id: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8.5" cy="11" r="2.5"/><path d="M14 8h5M14 12h5M5 18c.8-2 2-3 3.5-3s2.7 1 3.5 3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 15"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    alertTri: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    translate: '<path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
    docNew: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    gavel: '<path d="M14 13l-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="M16 16l6-6"/><path d="M8 8l6-6"/><path d="M9 7l8 8"/><path d="M21 11l-8-8"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
  };
  function icon(name, size) {
    var s = size || 18;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || P.info) + '</svg>';
  }

  /* ---------- status metadata ---------- */
  var STATUS = {
    draft:           { label: 'Draft',            cls: 'badge-neutral' },
    submitted:       { label: 'Submitted',        cls: 'badge-info' },
    under_review:    { label: 'Under Review',     cls: 'badge-brand' },
    query_raised:    { label: 'Query Raised',     cls: 'badge-warn' },
    partner_updated: { label: 'Partner Updated',  cls: 'badge-teal' },
    on_hold:         { label: 'On Hold',          cls: 'badge-purple' },
    approved:        { label: 'Approved',         cls: 'badge-success' },
    rejected:        { label: 'Rejected',         cls: 'badge-danger' }
  };
  function statusBadge(st) {
    var m = STATUS[st] || { label: st, cls: 'badge-neutral' };
    return '<span class="badge ' + m.cls + '"><span class="dot"></span>' + esc(m.label) + '</span>';
  }

  global.UI = {
    esc: esc, fmtDate: fmtDate, fmtDateTime: fmtDateTime, fmtBytes: fmtBytes,
    daysUntil: daysUntil, timeAgo: timeAgo, toast: toast, modal: modal,
    confirmModal: confirmModal, icon: icon, STATUS: STATUS, statusBadge: statusBadge
  };
})(window);
