/* ==========================================================================
 * admin.js — Admin console SPA (API-backed).
 * Views: dashboard, submissions queue, review, analytics, audit, outbox.
 * Auth: password → TOTP → HttpOnly session (server enforces idle expiry).
 * ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var me = null; /* { user, sessionIdleMinutes } */

  /* ================================================================== */
  /* AUTH                                                               */
  /* ================================================================== */
  function initAuthUi() {
    var pwToggle = $('#pw-toggle'), pwInput = $('#lg-pass');
    pwToggle.innerHTML = UI.icon('eye', 17);
    pwToggle.addEventListener('click', function () {
      var showing = pwInput.type === 'text';
      pwInput.type = showing ? 'password' : 'text';
      pwToggle.innerHTML = UI.icon(showing ? 'eye' : 'eyeOff', 17);
      pwInput.focus();
    });
    ['lg-email', 'lg-pass'].forEach(function (id) {
      $('#' + id).addEventListener('input', function () {
        var el = $('#' + id + '-err'); el.hidden = true;
        var f = el.closest('.field'); if (f) f.classList.remove('invalid');
      });
    });
    $('#lg-submit').addEventListener('click', tryContinue);
    $('#lg-email').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryContinue(); });
    $('#lg-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryContinue(); });
    $('#mfa-back').addEventListener('click', function () {
      $('#mfa-card').hidden = true; $('#login-card').hidden = false; $('#lg-pass').focus();
    });
    $('#mfa-submit').addEventListener('click', verifyMfa);
    $('#mfa-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') verifyMfa(); });
    setTimeout(function () { $('#lg-email').focus(); }, 120);
  }
  function authErr(sel, show) {
    var el = $(sel); el.hidden = !show;
    var f = el.closest('.field'); if (f) f.classList.toggle('invalid', show);
  }
  var pendingChallenge = null;
  function tryContinue() {
    var em = $('#lg-email').value.trim(), pw = $('#lg-pass').value;
    var okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em), okPass = pw.length > 0;
    authErr('#lg-email-err', !okEmail); authErr('#lg-pass-err', !okPass);
    if (!okEmail || !okPass) return;
    $('#lg-submit').disabled = true;
    API.login(em, pw).then(function (r) {
      if (r.mfaRequired) {
        pendingChallenge = r.mfaChallengeId;
        $('#login-card').hidden = true; $('#mfa-card').hidden = false;
        $('#mfa-code').value = ''; setTimeout(function () { $('#mfa-setup-code').focus(); }, 60);
      } else {
        enterApp();
      }
    }).catch(function (e) {
      UI.toast(e.message || 'Sign-in failed', 'error');
    }).finally(function () { $('#lg-submit').disabled = false; });
  }
  function verifyMfa() {
    var code = $('#mfa-code').value.trim();
    if (!/^\d{6}$/.test(code)) { $('#mfa-err').hidden = false; return; }
    $('#mfa-err').hidden = true;
    $('#mfa-submit').disabled = true;
    API.verifyMfa(pendingChallenge, code).then(function () {
      pendingChallenge = null; enterApp();
    }).catch(function (e) {
      UI.toast(e.message || 'MFA failed', 'error');
      $('#mfa-code').value = ''; $('#mfa-setup-code').focus();
    }).finally(function () { $('#mfa-submit').disabled = false; });
  }

  function enterApp() {
    return API.me().then(function (r) {
      me = r;
      $('#auth').hidden = true; $('#app').hidden = false;
      var initials = me.user.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
      $('#tb-avatar').textContent = initials;
      $('#tb-user').textContent = me.user.name;
      $('#tb-role').textContent = roleLabel(me.user.role);
      $('#sb-session').textContent = 'Session expires after ' + me.sessionIdleMinutes + ' min idle';
      /* rm(10.3-1): do not advertise pages the role cannot use — the APIs already
       * return 403, but a sidebar entry a viewer can only fail on is a disclosure
       * and a dead end. Users/Settings are super_admin-only trust operations. */
      if (me.user.role !== 'super_admin') {
        document.querySelectorAll('[data-view="users"], [data-view="settings"]').forEach(function (node) {
          var li = node.closest('li'); (li || node).remove();
        });
      }
      /* rm(10.4-1 / RTM DEV-13): a viewer is now bound to exactly its declared
       * grants — the masked queue (read) and the masked CSV (export). Dashboard,
       * reports, audit, notifications, users and settings stay read_audit/super_admin
       * and are hidden; the API enforces the same matrix. */
      if (me.user.role === 'viewer') {
        document.querySelectorAll('[data-view="dashboard"], [data-view="reports"], [data-view="analytics"], [data-view="audit"], [data-view="outbox"], [data-view="users"], [data-view="settings"]').forEach(function (node) {
          var li = node.closest('li'); (li || node).remove();
        });
        if (!location.hash || location.hash === '#/dashboard' || location.hash === '#/') window.history.replaceState(null, '', location.pathname + location.search + '#/submissions');
      }
      /* rm(10.4-1 / PEN-2026-05): staff without a TOTP secret get the enrolment panel */
      if (me.user.hasTotp === false && me.user.role !== 'partner') {
        var banner = $('#mfa-banner');
        if (banner) {
          banner.hidden = false;
          /* rm(10.4-1): enterApp can run more than once per page — wiring the
           * handlers twice made one click fire TWO concurrent begins; the losing
           * secret could be the one displayed, so its code never verified. */
          if (banner.dataset.mfaWired === '1') { route(); return; }
          banner.dataset.mfaWired = '1';
          $('#mfa-setup-btn').addEventListener('click', function () {
            var panel = $('#mfa-setup-panel');
            var btn = $('#mfa-setup-btn');
            if (!panel.hidden) { panel.hidden = true; return; }
            if (btn.disabled) return;
            btn.disabled = true;
            API.post('/api/auth/mfa/begin', {}).then(function (r) {
              $('#mfa-secret').textContent = r.secret;
              panel.hidden = false;
              $('#mfa-setup-code').focus();
            }).catch(function (e) { UI.toast(e.message || 'Could not start enrolment', 'error'); })
              .then(function () { btn.disabled = false; });
          });
          $('#mfa-confirm-btn').addEventListener('click', function () {
            var code = ($('#mfa-setup-code').value || '').replace(/\D/g, '');
            API.post('/api/auth/mfa/confirm', { code: code }).then(function () {
              UI.toast('Two-factor authentication enabled.', 'success');
              banner.hidden = true;
              return API.me();
            }).then(function (r) { me = r; }).catch(function (e) {
              $('#mfa-setup-err').textContent = e.message || 'Invalid code';
            });
          });
        }
      }
      route();
    });
  }
  function roleLabel(r) {
    return r === 'super_admin' ? 'Super Admin' : r === 'reviewer' ? 'Reviewer' : 'Viewer (read-only)';
  }
  function can(perm) {
    var m = { super_admin: ['*'], reviewer: ['read', 'export', 'decide', 'query', 'notes', 'manage_invites', 'read_audit'],
      viewer: ['read', 'export'] }[me ? me.user.role : ''] || [];
    return m.indexOf('*') >= 0 || m.indexOf(perm) >= 0;
  }
  function guard(err) {
    if (err && err.status === 401) {
      me = null;
      $('#app').hidden = true; $('#auth').hidden = false;
      $('#login-card').hidden = false; $('#mfa-card').hidden = true;
      UI.toast('Session expired — please sign in again.', 'warn');
      return true;
    }
    return false;
  }

  $('#btn-logout').addEventListener('click', function () {
    API.logout().finally(function () {
      me = null; $('#app').hidden = true; $('#auth').hidden = false; $('#login-card').hidden = false;
    });
  });
  $('#btn-menu').innerHTML = UI.icon('menu', 18);
  $('#btn-menu').addEventListener('click', function () { $('#app').classList.add('sidebar-open'); });
  document.addEventListener('click', function (e) {
    if ($('#app').classList.contains('sidebar-open') && !e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {
      $('#app').classList.remove('sidebar-open');
    }
  });
  $$('#nav .nav-ic').forEach(function (el) { el.innerHTML = UI.icon(el.dataset.icon, 18); });

  /* ================================================================== */
  /* ROUTER                                                             */
  /* ================================================================== */
  var TITLES = {
    dashboard: ['Dashboard', 'Onboarding pipeline at a glance'],
    submissions: ['Submissions', 'Review queue — search, filter, decide'],
    analytics: ['Analytics', 'Funnel, cycle time & data quality'],
    audit: ['Audit Log', 'Every action, immutably recorded'],
    outbox: ['Notifications', 'Partner-facing message outbox'],
    users: ['User Management', 'Create, edit and manage staff accounts'],
    settings: ['Settings', 'System configuration and integrations'],
    reports: ['Reports', 'Built-in and custom report builder with export'],
  };
  function route() {
    if (!me) return;
    var parts = (location.hash || '#/dashboard').replace(/^#\//, '').split('/');
    var view = TITLES[parts[0]] ? parts[0] : 'dashboard';
    $$('#nav a').forEach(function (a) {
      var active = a.dataset.view === view;
      a.classList.toggle('active', active);
      a.setAttribute('aria-current', active ? 'page' : 'false');
    });
    /* keep the pending badge fresh on every navigation — analytics is a
     * read_audit API, so roles without it must not call it (rm 10.3-1: this
     * produced a 403 toast on every viewer navigation). */
    if (can('read_audit')) API.analytics().then(function (a) {
      var badge = document.getElementById('nav-count');
      if (badge) badge.textContent = String(a.stats.pending);
    }).catch(function () {});
    if (view === 'submissions' && parts[1]) renderReview(decodeURIComponent(parts[1]));
    else if (view === 'dashboard') renderDashboard();
    else if (view === 'submissions') renderSubmissions();
    else if (view === 'analytics') renderAnalytics();
    else if (view === 'audit') renderAudit();
    else if (view === 'outbox') renderOutbox();
    else if (view === 'users') renderUsers();
    else if (view === 'settings') renderSettings();
    else if (view === 'reports') renderReports();
    var t = (view === 'submissions' && parts[1]) ? ['Review submission', 'Verification & decision'] : TITLES[view];
    $('#tb-title').textContent = t[0]; $('#tb-sub').textContent = t[1];
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ================================================================== */
  /* DASHBOARD                                                          */
  /* ================================================================== */
  function renderDashboard() {
    $('#content').innerHTML = '<div class="card card-pad empty-state"><div class="skeleton" style="height:80px"></div></div>';
    API.analytics().then(function (a) {
      var st = a.stats;
      var avgH = st.avgCycleHours;
      $('#content').innerHTML =
        '<div class="grid grid-4 mb-8">' +
        kpi('Pending review', st.pending, 'inbox', 'var(--warn-600)', 'var(--warn-100)', 'needs decision', 'pending') +
        kpi('Approved partners', st.approved, 'check', 'var(--success-600)', 'var(--success-100)', 'of ' + st.total + ' submissions', 'approved') +
        kpi('Avg cycle time', avgH ? (avgH >= 24 ? (avgH / 24).toFixed(1) + ' days' : Math.round(avgH) + ' h') : '—', 'clock', 'var(--brand-600)', 'var(--brand-50)', 'submit → approve', null) +
        kpi('First-pass rate', st.firstPassRate + '%', 'shield', 'var(--teal-600)', 'var(--teal-100)', 'no queries needed', null) +
        '</div>' +
        agingPanel(a.aging) +
        '<div class="card mt-8 card-pad"><h3 style="font-size:var(--fs-base)">Expiring documents & IDs</h3>' +
        '<p class="small muted mt-2 mb-4">Partner-facing renewal reminders are sent automatically; internal escalation below.</p>' +
        expiryList(a.expiries) + '</div>';
      animateKpis();
      $$('.kpi-click').forEach(function (card) {
        card.addEventListener('click', function () { location.hash = '#/submissions'; });
      });
      $$('.reviewnow-row [data-goto-review]').forEach(function (btn) {
        btn.addEventListener('click', function () { location.hash = '#/submissions/' + encodeURIComponent(btn.dataset.gotoReview); });
      });
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }
  function kpi(label, value, ic, color, bg, sub, goto) {
    return '<div class="card kpi' + (goto ? ' kpi-click" data-goto="' + goto : '') + '" tabindex="0">' +
      '<div class="kpi-ic" style="color:' + color + ';background:' + bg + '">' + UI.icon(ic, 20) + '</div>' +
      '<div class="kpi-label">' + label + '</div><div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-delta flat">' + sub + '</div></div>';
  }
  function agingPanel(aging) {
    if (!aging || !aging.length) return '';
    return '<div class="card card-pad mt-8"><div class="row" style="justify-content:space-between">' +
      '<h3 style="font-size:var(--fs-base)">Needs your review</h3>' +
      '<a class="btn btn-ghost btn-sm" href="#/submissions">Open queue →</a></div>' +
      aging.map(function (x) {
        return '<div class="reviewnow-row"><div><span class="rn-company">' + UI.esc(x.company) + '</span>' +
          '<span class="rn-meta"> · ' + UI.esc(x.id) + ' · waiting ' + x.ageDays + 'd</span></div>' +
          '<button class="btn btn-secondary btn-sm" data-goto-review="' + UI.esc(x.id) + '">Review</button></div>';
      }).join('') + '</div>';
  }
  function expiryList(expiries) {
    if (!expiries || !expiries.length) return '<div class="empty-state"><div class="es-icon">' + UI.icon('check', 26) + '</div>Nothing expiring in the next 60 days.</div>';
    return expiries.map(function (x) {
      return '<div class="expiry-row"><div><b>' + UI.esc(x.company) + '</b>' +
        '<div class="small muted">' + UI.esc(x.kind) + ' · expires ' + UI.fmtDate(x.date) + '</div></div>' +
        '<div class="row"><span class="badge ' + (x.days <= 30 ? 'badge-danger' : 'badge-warn') + '">' + x.days + ' days</span>' +
        '<a class="btn btn-secondary btn-sm" href="#/submissions/' + encodeURIComponent(x.ref) + '">Open</a></div></div>';
    }).join('');
  }
  function animateKpis() {
    $$('.kpi-value').forEach(function (el) {
      var m = String(el.textContent).match(/^([\d.,]+)(.*)$/); if (!m) return;
      var target = parseFloat(m[1].replace(/,/g, '')); if (isNaN(target) || target === 0) return;
      var decimals = (m[1].split('.')[1] || '').length, suffix = m[2], final = el.textContent;
      var t0 = null, done = false, dur = 650;
      function finish() { if (!done) { done = true; el.textContent = final; } }
      function tick(ts) {
        if (done) return; if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick); else finish();
      }
      el.textContent = (0).toFixed(decimals) + suffix;
      requestAnimationFrame(tick); setTimeout(finish, 1400);
    });
  }

  /* ================================================================== */
  /* SUBMISSIONS                                                        */
  /* ================================================================== */
  var flt = { q: '', status: 'all', role: 'all', page: 1, sort: 'submittedAt', dir: 'desc' };
  function renderSubmissions() {
    $('#content').innerHTML =
      '<div class="toolbar mb-4">' +
      '<div class="search-box"><span class="sb-ic">' + UI.icon('search', 16) + '</span>' +
      '<input class="input" id="fl-q" placeholder="Search company, TIN, reference or email…" value="' + UI.esc(flt.q) + '"></div>' +
      '<select class="select" id="fl-role" style="width:auto"><option value="all">All roles</option>' +
      '<option value="vendor">Vendors</option><option value="customer">Customers</option></select>' +
      (can('export') ? '<a class="btn btn-secondary" id="btn-export" href="' + API.exportCsvUrl({ status: flt.status, role: flt.role }) + '">' + UI.icon('download', 16) + ' Export CSV</a>' : '') +
      (can('manage_invites') ? '<button class="btn btn-secondary" id="btn-import">' + UI.icon('users', 16) + ' Import partners</button>' : '') +
      '</div>' +
      '<div class="filter-chips mb-4" id="fl-chips"></div><div id="fl-table"></div>';
    $('#fl-role').value = flt.role;
    function chips() {
      var counts = { all: '-', pending: '', submitted: '', under_review: '', query_raised: '', partner_updated: '', on_hold: '', approved: '', rejected: '' };
      var labels = { all: 'All', pending: 'Pending', submitted: 'Submitted', under_review: 'Under Review', query_raised: 'Query Raised', partner_updated: 'Partner Updated', on_hold: 'On Hold', approved: 'Approved', rejected: 'Rejected' };
      $('#fl-chips').innerHTML = Object.keys(labels).map(function (k) {
        return '<button class="chip' + (flt.status === k ? ' active' : '') + '" data-status="' + k + '">' + labels[k] + '</button>';
      }).join('');
      $$('#fl-chips .chip').forEach(function (ch) {
        ch.addEventListener('click', function () {
          flt.status = ch.dataset.status; flt.page = 1; refresh();
        });
      });
    }
    function refreshExportLink() {
      var ex = $('#btn-export');
      if (ex) ex.setAttribute('href', API.exportCsvUrl({ status: flt.status, role: flt.role }));
    }
    function refresh() {
      chips();
      refreshExportLink();
      $('#fl-table').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:60px"></div></div>';
      API.listSubmissions({ q: flt.q, status: flt.status, role: flt.role, page: flt.page, sort: flt.sort, dir: flt.dir }).then(function (r) {
        flt.page = r.page;
        var pending = r.total && flt.status === 'pending' ? r.total : null;
        API.analytics().then(function (a) {
          var badge = document.getElementById('nav-count');
          if (badge) badge.textContent = String(a.stats.pending);
        }).catch(function () {});
        $('#fl-table').innerHTML = (r.rows.length ? table(r) :
          '<div class="empty-state"><div class="es-icon">' + UI.icon('search', 30) + '</div>No submissions match.</div>') +
          (r.pages > 1 ? pager(r) : '');
        $$('#fl-table tbody tr').forEach(function (tr) {
          tr.addEventListener('click', function () { location.hash = '#/submissions/' + encodeURIComponent(tr.dataset.id); });
        });
        $$('#fl-table th.sortable').forEach(function (th) {
          th.addEventListener('click', function () {
            var k = th.dataset.key;
            if (flt.sort === k) flt.dir = flt.dir === 'asc' ? 'desc' : 'asc';
            else { flt.sort = k; flt.dir = (k === 'submittedAt' || k === 'age') ? 'desc' : 'asc'; }
            refresh();
          });
        });
        var prev = $('#pg-prev'), next = $('#pg-next');
        if (prev) prev.addEventListener('click', function () { flt.page--; refresh(); });
        if (next) next.addEventListener('click', function () { flt.page++; refresh(); });
      }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
    }
    function table(r) {
      var th = function (key, label) {
        var cls = 'sortable' + (flt.sort === key ? (flt.dir === 'asc' ? ' sort-asc' : ' sort-desc') : '');
        return '<th class="' + cls + '" data-key="' + key + '">' + label + '</th>';
      };
      var rows = r.rows.map(function (s) {
        return '<tr class="clickable" data-id="' + UI.esc(s.id) + '" tabindex="0">' +
          '<td class="cell-strong mono">' + UI.esc(s.id) + '</td>' +
          '<td><span class="cell-strong">' + UI.esc(s.company) + '</span><br><span class="small muted">' +
          (s.role === 'vendor' ? 'Vendor' : 'Customer') + ' · ' + UI.esc(s.tin || '—') + '</span></td>' +
          '<td>' + UI.statusBadge(s.status) + '</td>' +
          '<td class="small">' + UI.fmtDate(s.submittedAt) + '</td>' +
          /* rm(7.2-2): the SLA unit is FRACTIONAL BUSINESS DAYS (GOV a11/a42) — the breach
             badge shows the business-day age; the calm state keeps the calendar age. */
          '<td class="small nowrap">' + (s.slaBreached ? '<span class="badge badge-danger" title="SLA breached — ' + s.ageBusinessDays + ' business days pending">' + s.ageBusinessDays + ' bd</span>' : s.ageDays + 'd') + '</td></tr>';
      }).join('');
      return '<div class="table-wrap mt-4"><table class="table"><thead><tr>' +
        th('id', 'Reference') + th('company', 'Company') + th('status', 'Status') + th('submittedAt', 'Submitted') + th('age', 'Age') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    function pager(r) {
      return '<div class="pager"><span class="pg-info">Page ' + r.page + ' of ' + r.pages + ' · ' + r.total + ' records</span>' +
        '<span class="pg-btns"><button class="btn btn-secondary btn-sm" id="pg-prev"' + (r.page <= 1 ? ' disabled' : '') + '>← Prev</button>' +
        '<button class="btn btn-secondary btn-sm" id="pg-next"' + (r.page >= r.pages ? ' disabled' : '') + '>Next →</button></span></div>';
    }
    refresh();
    $('#fl-q').addEventListener('input', function (e) { flt.q = e.target.value; flt.page = 1; refresh(); });
    $('#fl-role').addEventListener('change', function (e) { flt.role = e.target.value; flt.page = 1; refresh(); });
    var imp = $('#btn-import');
    if (imp) imp.addEventListener('click', importModal);
  }

  function importModal() {
    var body = document.createElement('div');
    body.innerHTML =
      '<p class="small muted">Paste partners — one per line as <code>Company Name,email,vendor|customer</code>. Each valid row generates a pre-filled invite link (emails also sent via the notification service).</p>' +
      '<div class="field mt-4"><label for="imp-csv">Partner list (CSV)</label>' +
      '<textarea class="textarea mono" id="imp-csv" style="min-height:130px" placeholder="Al Noor Computers LLC,accounts@alnoor.ae,customer"></textarea></div>' +
      '<div id="imp-report" class="mt-4"></div>';
    UI.modal({
      title: 'Import partners & generate invites', body: body,
      actions: [{ label: 'Close', cls: 'btn-secondary' }, {
        label: 'Import & generate links', cls: 'btn-primary', onClick: function () {
          var csv = body.querySelector('#imp-csv').value;
          var report = body.querySelector('#imp-report');
          API.bulkImport(csv).then(function (r) {
            report.innerHTML = '<div class="alert alert-success">Imported <b>' + r.imported + '</b> partner(s)' +
              (r.rejected.length ? ' · rejected ' + r.rejected.length : '') + '.</div>' +
              r.links.map(function (l) {
                return '<div class="expiry-row"><div><b>' + UI.esc(l.company) + '</b>' +
                  '<div class="small muted">' + UI.esc(l.email) + ' · <span class="mono">' + UI.esc(l.code) + '</span></div></div>' +
                  '<button class="btn btn-secondary btn-sm" data-link="' + UI.esc(l.link) + '">Copy link</button></div>';
              }).join('') +
              (r.rejected.length ? '<details class="mt-3"><summary class="small" style="cursor:pointer;color:var(--danger-700)">Show rejected rows</summary><ul class="small mt-2">' +
                r.rejected.map(function (e) { return '<li>' + UI.esc(e) + '</li>'; }).join('') + '</ul></details>' : '');
            Array.prototype.forEach.call(report.querySelectorAll('[data-link]'), function (btn) {
              btn.addEventListener('click', function () {
                if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.link)
                  .then(function () { UI.toast('Invite link copied.', 'success'); }, function () { UI.toast(btn.dataset.link, 'info'); });
                else UI.toast(btn.dataset.link, 'info');
              });
            });
          }).catch(function (e) {
            report.innerHTML = '<div class="alert alert-danger">' + UI.esc(e.message) + '</div>' +
              (e.details ? '<ul class="small mt-2">' + e.details.map(function (d) { return '<li>' + UI.esc(d.message) + '</li>'; }).join('') + '</ul>' : '');
          });
          return false; /* keep open */
        }
      }]
    });
  }

  /* ================================================================== */
  /* REVIEW                                                             */
  /* ================================================================== */
  function renderReview(id) {
    $('#content').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:200px"></div></div>';
    var fullPii = can('view_pii');
    API.getSubmission(id, fullPii).then(function (s) {
      var tab = 'details';
      $('#content').innerHTML =
        '<div class="row mb-4"><a class="btn btn-ghost btn-sm" href="#/submissions">← Back to queue</a></div>' +
        '<div class="card card-pad"><div class="review-head"><div>' +
        '<div class="row mb-2"><span class="ref-pill" style="font-size:var(--fs-xs)">' + UI.esc(s.id) + '</span>' +
        UI.statusBadge(s.status) + '<span class="badge badge-neutral">' + (s.role === 'vendor' ? 'Vendor' : 'Customer') + '</span>' +
        (s.screening && !s.screening.clear ? '<span class="badge badge-danger">screening: ' + s.screening.hits.length + ' hit(s)</span>' : '') + '</div>' +
        '<h2 style="font-size:var(--fs-2xl)">' + UI.esc(s.company.legal_name_en) + '</h2>' +
        '<p class="muted small mb-0">submitted ' + UI.fmtDateTime(s.submittedAt) + ' · reviewer: ' + UI.esc(s.reviewer || 'unassigned') + '</p></div>' +
        '<div class="action-bar" id="rv-actions"></div></div>' +
        '<div class="tabs mt-6" id="rv-tabs">' +
        '<button data-tab="details" class="active">Details</button>' +
        '<button data-tab="documents">Documents (' + (s.documents || []).length + ')</button>' +
        '<button data-tab="review">Checklist &amp; notes</button>' +
        '<button data-tab="queries">Queries (' + (s.queries || []).length + ')</button>' +
        '<button data-tab="audit">History</button></div><div id="rv-body"></div></div>';
      renderActions(s);
      $$('#rv-tabs button').forEach(function (b) {
        b.addEventListener('click', function () {
          $$('#rv-tabs button').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active'); tab = b.dataset.tab; renderTab();
        });
      });
      function renderTab() {
        var el = $('#rv-body');
        if (tab === 'details') el.innerHTML = tabDetails(s);
        else if (tab === 'documents') { el.innerHTML = tabDocuments(s); bindDocDownloads(); }
        else if (tab === 'review') { el.innerHTML = tabReview(s); bindChecklist(s); }
        else if (tab === 'queries') el.innerHTML = tabQueries(s);
        else el.innerHTML = tabHistory(s);
      }
      renderTab();
    }).catch(function (e) {
      if (guard(e)) return;
      $('#content').innerHTML = '<div class="card card-pad empty-state"><h3>' + UI.esc(e.message) + '</h3>' +
        '<a class="btn btn-primary mt-4" href="#/submissions">Back to queue</a></div>';
    });
  }
  function renderActions(s) {
    var html = '';
    var editable = ['submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold'].indexOf(s.status) >= 0;
    if (can('decide') && editable) {
      if (s.status === 'submitted') html += '<button class="btn btn-secondary" data-act="start">Start review</button>';
      html += '<button class="btn btn-warn" data-act="query">Raise query</button>';
      html += '<button class="btn btn-secondary" data-act="hold">Put on hold</button>';
      html += '<button class="btn btn-danger" data-act="reject">Reject</button>';
      html += '<button class="btn btn-success" data-act="approve">Approve</button>';
    }
    if (can('reopen') && (s.status === 'approved' || s.status === 'rejected')) html += '<button class="btn btn-secondary" data-act="reopen">Reopen</button>';
    html += '<button class="btn btn-secondary" data-act="print">Print / PDF</button>';
    if (!html) html = '<span class="small muted">Read-only role — decisions require Reviewer access.</span>';
    $('#rv-actions').innerHTML = html;
    $$('#rv-actions [data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () { doAction(s, btn.dataset.act); });
    });
  }
  function doAction(s, act) {
    if (act === 'print') { window.print(); return; }
    if (act === 'approve') {
      UI.confirmModal('Approve ' + s.company.legal_name_en + '?',
        'The partner is notified, the counterparty master is published to integrations, and the record becomes terminal.',
        function () { run(s.id, 'approve'); }, 'Approve', 'btn-success');
      return;
    }
    if (act === 'reject' || act === 'hold') {
      reasonModal(act === 'reject' ? 'Reject submission' : 'Put on hold',
        act === 'reject' ? 'The partner will be emailed this reason and may reapply.' : 'Use for external verifications.',
        act === 'reject' ? 'Rejection reason' : 'Hold reason', function (reason) { run(s.id, act, reason); });
      return;
    }
    if (act === 'reopen') {
      UI.confirmModal('Reopen ' + s.company.legal_name_en + '?', 'Returns the record to <b>Under Review</b>.', function () { run(s.id, 'reopen'); }, 'Reopen', 'btn-warn');
      return;
    }
    if (act === 'query') { queryModal(s); return; }
    run(s.id, act);
    function run(id, action, reason) {
      API.action(id, action, reason).then(function () {
        UI.toast('Action "' + action + '" applied.', 'success');
        renderReview(id);
      }).catch(function (e) {
        if (guard(e)) return;
        UI.toast(e.message, 'error');
      });
    }
  }
  function reasonModal(title, intro, label, onOk) {
    var body = document.createElement('div');
    body.innerHTML = '<p class="small muted">' + intro + '</p><div class="field mt-4"><label>' + label + ' *</label>' +
      '<textarea class="textarea" id="rm-reason"></textarea><span class="error" id="rm-err">Please provide a reason.</span></div>';
    UI.modal({ title: title, body: body, actions: [
      { label: 'Cancel', cls: 'btn-secondary' },
      { label: 'Confirm', cls: 'btn-primary', onClick: function () {
        var t = body.querySelector('#rm-reason').value.trim();
        if (!t) { var el = body.querySelector('#rm-err'); el.hidden = false; var f = el.closest('.field'); if (f) f.classList.add('invalid'); return false; }
        onOk(t);
      } }
    ] });
  }
  function queryModal(s) {
    var sections = ['Company', 'Tax & E-Invoicing', 'Contacts', 'Signatories & UBO', 'Banking', 'Documents', 'Declarations'];
    var body = document.createElement('div');
    body.innerHTML = '<p class="small muted">The partner receives an email and fixes only what you flag.</p>' +
      '<div class="field mt-4"><label>Section *</label><select class="select" id="qm-section">' +
      sections.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field mt-4"><label>Message to partner *</label><textarea class="textarea" id="qm-msg"></textarea>' +
      '<span class="error" id="qm-err">Please write a message.</span></div>';
    UI.modal({ title: 'Raise a query', body: body, actions: [
      { label: 'Cancel', cls: 'btn-secondary' },
      { label: 'Send query', cls: 'btn-warn', onClick: function () {
        var msg = body.querySelector('#qm-msg').value.trim();
        if (!msg) { var el = body.querySelector('#qm-err'); el.hidden = false; var f = el.closest('.field'); if (f) f.classList.add('invalid'); return false; }
        API.raiseQuery(s.id, body.querySelector('#qm-section').value, msg).then(function () {
          UI.toast('Query sent to partner.', 'success'); renderReview(s.id);
        }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
      } }
    ] });
  }

  var kv = function (k, v, wide) {
    return '<div class="kv' + (wide ? '" style="grid-column:1/-1' : '') + '"><div class="k">' + UI.esc(k) + '</div><div class="v">' + (v === null || v === undefined || v === '' ? '—' : v) + '</div></div>';
  };
  function kvGrid(rows) { return '<div class="kv-grid">' + rows.join('') + '</div>'; }
  function sectionCard(title, inner) {
    return '<div class="card card-pad mb-4"><h3 style="font-size:var(--fs-base);margin-bottom:16px">' + title + '</h3>' + inner + '</div>';
  }
  function tabDetails(s) {
    var c = s.company || {}, t = s.tax || {}, b = s.banking || {};
    var out = '';
    out += sectionCard('Company', kvGrid([
      kv('Legal name (EN)', UI.esc(c.legal_name_en)), kv('Entity type', UI.esc(c.entity_type)),
      kv('Country', UI.esc(c.country)), kv('Licence no.', UI.esc(c.license_number)),
      kv('Authority', UI.esc(c.license_authority)), kv('Licence expiry', UI.esc(c.license_expiry)),
      kv('Activity', UI.esc(c.business_activity)),
      kv('Address', UI.esc([c.address && c.address.building, c.address && c.address.street, c.address && c.address.city, c.address && c.address.emirate, c.address && c.address.country].filter(Boolean).join(', ')), true)
    ]));
    out += sectionCard('Tax & e-invoicing', kvGrid([
      kv('TRN', '<span class="mono">' + UI.esc(t.trn || '') + '</span>'),
      kv('Foreign tax ID', UI.esc(t.foreign_tax_id || '')),
      kv('Peppol ID', '<span class="mono">' + UI.esc(t.peppol_id || '') + '</span>'),
      kv('E-invoicing status', UI.esc(t.einv_status || '')),
      kv('Currency', UI.esc(t.invoice_currency || ''))
    ]));
    var p = (s.contacts && s.contacts.primary) || {};
    out += sectionCard('Contacts', kvGrid([
      kv('Primary', UI.esc(p.name || '') + (p.name ? '<br><span class="small muted">' + UI.esc(p.designation || '') + ' · ' + UI.esc(p.email || '') + '</span>' : ''))
    ]));
    var sigs = (s.signatories || []).map(function (g, i) {
      return '<div class="repeat-block mt-4"><b>Signatory ' + (i + 1) + '</b>' + kvGrid([
        kv('Name', UI.esc(g.name)), kv('Nationality', UI.esc(g.nationality)),
        kv('ID', '<span class="mono">' + UI.esc(g.id_number || '') + '</span>'),
        kv('ID expiry', UI.esc(g.id_expiry)), kv('Authority', UI.esc(g.authority_basis))
      ]) + '</div>';
    }).join('') || '<p class="muted small">None provided.</p>';
    out += sectionCard('Signatories', sigs);
    var ubos = (s.ubos || []).map(function (u, i) {
      return '<div class="repeat-block mt-4"><b>UBO ' + (i + 1) + ' · ' + UI.esc(u.ownership_pct || '?') + '%</b>' + kvGrid([
        kv('Name', UI.esc(u.name)), kv('Nationality', UI.esc(u.nationality)),
        kv('ID', '<span class="mono">' + UI.esc(u.id_number || '') + '</span>'),
        kv('Residence', UI.esc(u.country_of_residence))
      ]) + '</div>';
    }).join('') || '<p class="muted small">No UBOs declared.</p>';
    out += sectionCard('Beneficial owners', ubos + kvGrid([
      kv('Nominee arrangement', t.nominee_arrangement === 'yes' ? 'Yes — ' + UI.esc(t.nominee_detail || 'detail missing') : 'None declared')
    ]));
    out += sectionCard('Banking', kvGrid([
      kv('Bank', UI.esc(b.bank_name || '')),
      kv('IBAN', '<span class="mono">' + UI.esc(b.iban_masked || (b.iban ? b.iban.slice(0, 7) + '••••' + b.iban.slice(-4) : '')) + '</span>'),
      kv('Account holder', UI.esc(b.account_holder || '')), kv('Currency', UI.esc(b.currency || ''))
    ]));
    if (s.screening) {
      out += sectionCard('Screening', (s.screening.clear
        ? '<div class="alert alert-success">Clear — no watchlist matches.</div>'
        : '<div class="alert alert-danger"><b>' + s.screening.hits.length + ' hit(s):</b><ul class="small mt-2 mb-0">' +
          s.screening.hits.map(function (h) {
            return '<li>' + UI.esc(h.subject) + ': "' + UI.esc(h.name) + '" ~ "' + UI.esc(h.match) + '" (' + h.type + ', ' + h.method + ')</li>';
          }).join('') + '</ul></div>'));
    }
    if (s.duplicateOfTin) {
      out += '<div class="alert alert-warn">Duplicate TRN — also on file as <b>' + UI.esc(s.duplicateOfTin.company) + '</b> (' + UI.esc(s.duplicateOfTin.ref) + '). Review before approving.</div>';
    }
    return out;
  }
  function tabDocuments(s) {
    var docs = s.documents || [];
    if (!docs.length) return '<div class="empty-state">No documents.</div>';
    return '<div class="grid grid-2">' + docs.map(function (d) {
      return '<div class="doc-tile"><div class="dt-head"><span class="file-ic">' + UI.icon('doc', 16) + '</span>' +
        '<div style="flex:1"><div class="dt-name">' + UI.esc(d.name) + '</div>' +
        '<div class="dt-sub">' + UI.esc(d.type) + ' · ' + UI.fmtBytes(d.size) + ' · uploaded ' + UI.fmtDateTime(d.uploadedAt) + '</div></div>' +
        (d.docId ? '<a class="btn btn-secondary btn-sm" href="' + API.documentUrl(d.docId) + '" target="_blank" rel="noopener">' + UI.icon('download', 14) + ' Download</a>' : '<span class="badge badge-neutral">declared only</span>') +
        '</div></div>';
    }).join('') + '</div>' +
    '<div class="alert alert-info mt-6">Downloads are audit-logged; ID documents are access-restricted by role.</div>';
  }
  function bindDocDownloads() { /* links are real hrefs; server audits */ }
  function tabReview(s) {
    var items = [
      ['license', 'Trade licence verified against issuing authority'],
      ['trn', 'TRN verified (EmaraTax record matches company name)'],
      ['moa', 'MOA confirms signatory authority'],
      ['bank', 'Bank letter legible & account holder plausible'],
      ['ubo', 'UBO forms complete; totals reconcile'],
      ['screening', 'Screening results reviewed and dispositioned']
    ];
    var cl = (s.review && s.review.checklist) || {};
    var canEdit = can('notes') && ['under_review', 'query_raised', 'partner_updated', 'on_hold'].includes(s.status);
    var html = '<div class="card card-pad"><h3 style="font-size:var(--fs-base)">Verification checklist</h3>' +
      items.map(function (it) {
        return '<div class="checklist-item"><input type="checkbox" id="ck-' + it[0] + '"' + (cl[it[0]] ? ' checked' : '') + (canEdit ? '' : ' disabled') +
          '><label for="ck-' + it[0] + '">' + it[1] + '</label></div>';
      }).join('') + '</div>';
    html += '<div class="card card-pad mt-4"><h3 style="font-size:var(--fs-base)">Internal notes</h3>' +
      (((s.review && s.review.notes) || []).map(function (n) {
        return '<div class="expiry-row"><div><b>' + UI.esc(n.by) + '</b> <span class="small muted">· ' + UI.fmtDateTime(n.ts) + '</span><div class="small">' + UI.esc(n.text) + '</div></div></div>';
      }).join('') || '<p class="muted small mb-0">No notes yet.</p>');
    if (canEdit) html += '<div class="row mt-4"><input class="input" id="note-text" placeholder="Add an internal note…" style="flex:1"><button class="btn btn-secondary" id="note-add">Add note</button></div>';
    return html + '</div>';
  }
  function bindChecklist(s) {
    $$('#rv-body .checklist-item input').forEach(function (b) {
      if (b.disabled) return;
      b.addEventListener('change', function () {
        API.setChecklist(s.id, b.id.replace('ck-', ''), b.checked).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
      });
    });
    var add = $('#note-add');
    if (add) add.addEventListener('click', function () {
      var txt = $('#note-text').value.trim();
      if (!txt) return;
      API.addNote(s.id, txt).then(function () { UI.toast('Note added.', 'success'); renderReview(s.id); })
        .catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
    });
  }
  function tabQueries(s) {
    var qs = s.queries || [];
    if (!qs.length) return '<div class="empty-state">No queries — first-pass submission.</div>';
    return qs.map(function (q) {
      return '<div class="query-card mb-4"><div class="qc-bubble">' +
        '<div class="row" style="justify-content:space-between"><b>' + UI.esc(q.section) + '</b>' +
        '<span class="small muted">' + UI.fmtDateTime(q.raised_at) + ' · ' + UI.esc(q.raised_by) + '</span></div>' +
        '<p class="small mt-2 mb-0">' + UI.esc(q.message) + '</p>' +
        (q.response ? '<div class="alert alert-success mt-4" style="padding:8px 12px"><span class="small"><b>Partner responded</b> (' + UI.fmtDateTime(q.responded_at) + '): ' + UI.esc(q.response) + '</span></div>' :
          '<div class="alert alert-warn mt-4" style="padding:8px 12px"><span class="small"><b>Awaiting partner response</b> — email sent automatically.</span></div>') +
        '</div></div>';
    }).join('');
  }
  function tabHistory(s) {
    return '<div class="card card-pad">' + (s.history || []).slice().reverse().map(function (h) {
      return '<div class="audit-row"><span class="a-ts">' + UI.fmtDateTime(h.ts) + '</span>' +
        '<span class="a-actor">' + UI.esc(h.label) + '</span><span class="small muted">' + UI.esc(h.status) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ================================================================== */
  /* ANALYTICS / AUDIT / OUTBOX                                         */
  /* ================================================================== */
  function renderAnalytics() {
    $('#content').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:120px"></div></div>';
    API.analytics().then(function (a) {
      var st = a.stats;
      var buckets = { pending: st.pending, approved: st.approved, rejected: st.rejected };
      $('#content').innerHTML =
        '<div class="grid grid-4 mb-8">' +
        kpi('Total submissions', st.total, 'inbox', 'var(--brand-600)', 'var(--brand-50)', 'all time') +
        kpi('Query rate', st.queryRate + '%', 'alertTri', 'var(--warn-600)', 'var(--warn-100)', 'submissions with ≥1 query') +
        kpi('First-pass rate', st.firstPassRate + '%', 'check', 'var(--success-600)', 'var(--success-100)', 'no queries needed') +
        kpi('Avg cycle', st.avgCycleHours ? Math.round(st.avgCycleHours) + ' h' : '—', 'clock', 'var(--purple-600)', 'var(--purple-100)', 'submit → approve') +
        '</div>' +
        '<div class="card chart-card mb-8"><div class="chart-title">Status distribution</div>' +
        '<div class="chart-sub">All submissions by current status</div>' + donut(st.byStatus) + '</div>' +
        agingPanel(a.aging) + expiryCard(a.expiries);
      animateKpis();
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }
  function donut(byStatus) {
    var order = ['submitted', 'under_review', 'query_raised', 'partner_updated', 'on_hold', 'approved', 'rejected'];
    var colors = { submitted: '#175CD3', under_review: '#1467C8', query_raised: '#F79009', partner_updated: '#0E9384', on_hold: '#6941C6', approved: '#12B76A', rejected: '#F04438' };
    var entries = order.filter(function (k) { return byStatus[k]; });
    var total = entries.reduce(function (x, k) { return x + byStatus[k]; }, 0) || 1;
    var paths = '', angle = -90;
    entries.forEach(function (k) {
      var sweep = byStatus[k] / total * 360;
      paths += '<path d="' + arc(90, 90, 62, angle, angle + sweep - 0.6) + '" fill="' + colors[k] + '"></path>';
      angle += sweep;
    });
    return '<div class="row" style="gap:24px;flex-wrap:wrap">' +
      '<svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Status donut">' + paths +
      '<text x="90" y="86" text-anchor="middle" font-size="26" font-weight="800" fill="#101828">' + total + '</text>' +
      '<text x="90" y="104" text-anchor="middle" font-size="10" fill="#667085">SUBMISSIONS</text></svg>' +
      '<div class="stack" style="gap:8px">' + entries.map(function (k) {
        return '<span class="legend"><span class="lg"><i style="background:' + colors[k] + '"></i>' + UI.STATUS[k].label + '</span><b>' + byStatus[k] + '</b></span>';
      }).join('') + '</div></div>';
  }
  function arc(cx, cy, r, a1, a2) {
    function pt(a) { var rad = a * Math.PI / 180; return (cx + r * Math.cos(rad)).toFixed(2) + ' ' + (cy + r * Math.sin(rad)).toFixed(2); }
    return 'M ' + pt(a1) + ' A ' + r + ' ' + r + ' 0 ' + ((a2 - a1) > 180 ? 1 : 0) + ' 1 ' + pt(a2);
  }
  function expiryCard(expiries) {
    return '<div class="card mt-8 card-pad"><h3 style="font-size:var(--fs-base)">Expiring documents & IDs</h3>' +
      '<p class="small muted mt-2 mb-4">Renewal reminders are emailed automatically at T-30 and T-7 days.</p>' + expiryList(expiries) + '</div>';
  }

  function renderAudit() {
    if (!can('read_audit')) {
      $('#content').innerHTML = '<div class="card card-pad empty-state"><h3>Insufficient permissions</h3></div>';
      return;
    }
    var q = '';
    $('#content').innerHTML =
      '<div class="toolbar mb-4"><div class="search-box"><span class="sb-ic">' + UI.icon('search', 16) + '</span>' +
      '<input class="input" id="au-q" placeholder="Search actor, reference, details…"></div></div><div id="au-list"></div>';
    function refresh() {
      API.audit(q, 'all').then(function (rows) {
        $('#au-list').innerHTML = '<div class="card card-pad">' + (rows.length ? rows.map(function (a) {
          return '<div class="audit-row"><span class="a-ts">' + UI.fmtDateTime(a.ts) + '</span>' +
            '<span class="a-actor">' + UI.esc(a.actor) + '</span>' +
            '<span><span class="badge badge-neutral">' + UI.esc(a.action) + '</span> <span class="mono small">' + UI.esc(a.target) + '</span>' +
            (a.details ? ' <span class="small muted">— ' + UI.esc(a.details) + '</span>' : '') + '</span></div>';
        }).join('') : '<div class="empty-state">No events match.</div>') + '</div>';
      }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
    }
    refresh();
    $('#au-q').addEventListener('input', function (e) { q = e.target.value; refresh(); });
  }

  function renderOutbox() {
    if (!can('read_audit')) {
      $('#content').innerHTML = '<div class="card card-pad empty-state"><h3>Insufficient permissions</h3></div>';
      return;
    }
    $('#content').innerHTML =
      '<div class="toolbar mb-4" style="justify-content:space-between">' +
      '<span class="small muted">Partner-facing notifications. When SMTP is configured (SMTP_HOST) mail is delivered directly; otherwise messages land here in the durable outbox.</span>' +
      '<button class="btn btn-secondary btn-sm" id="btn-reload-watchlist">' + UI.icon('shield', 14) + ' Reload watchlist</button></div>' +
      '<div class="card card-pad"><div class="skeleton" style="height:100px"></div></div>';
    var rl = $('#btn-reload-watchlist');
    if (rl) rl.addEventListener('click', function () {
      rl.disabled = true;
      fetch('/api/admin/screening/reload', { method: 'POST', credentials: 'same-origin' })
        .then(r => r.json()).then(j => { UI.toast('Watchlist reloaded: ' + j.entries + ' entries.', 'success'); })
        .catch(e => UI.toast(e.message || 'Reload failed', 'error'))
        .finally(() => { rl.disabled = false; });
    });
    API.outbox().then(function (rows) {
      $('#content').innerHTML =
        '<p class="small muted mb-4">Partner-facing notifications. When SMTP is configured (SMTP_HOST) mail is delivered directly; otherwise messages land here in the durable outbox.</p>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>When</th><th>Channel</th><th>To</th><th>Subject</th><th>Status</th></tr></thead><tbody>' +
        (rows.length ? rows.map(function (m) {
          return '<tr><td class="small">' + UI.fmtDateTime(m.createdAt) + '</td>' +
            '<td><span class="badge ' + (m.channel === 'email' ? 'badge-info' : 'badge-teal') + '">' + m.channel + '</span></td>' +
            '<td class="small">' + UI.esc(m.to) + '</td><td class="small">' + UI.esc(m.subject) + '</td>' +
            '<td><span class="badge ' + (m.status === 'sent' ? 'badge-success' : m.status === 'failed' ? 'badge-danger' : 'badge-neutral') + '">' + m.status + (m.via ? ' · ' + m.via : '') + '</span></td></tr>';
        }).join('') : '<tr><td colspan="5" class="empty-state">No notifications yet.</td></tr>') +
        '</tbody></table></div>';
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }

  /* ================================================================== */
  /* USER MANAGEMENT                                                    */
  /* ================================================================== */
  function renderUsers() {
    if (!can('view_pii')) {
      $('#content').innerHTML = '<div class="card card-pad empty-state"><h3>Insufficient permissions</h3><p class="muted small">User management requires Super Admin access.</p></div>';
      return;
    }
    $('#content').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:100px"></div></div>';
    Promise.all([API.users(), API.sessions()]).then(function (results) {
      var users = results[0], sessions = results[1];
      $('#content').innerHTML =
        '<div class="toolbar mb-4" style="justify-content:space-between">' +
        '<span class="small muted">' + users.length + ' account(s) · ' + sessions.length + ' active session(s)</span>' +
        '<button class="btn btn-primary" id="btn-add-user">' + UI.icon('users', 15) + ' Add User</button></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
        '<th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>MFA</th><th>Last Login</th><th>Actions</th>' +
        '</tr></thead><tbody>' + users.map(function (u) {
          return '<tr>' +
            '<td class="cell-strong">' + UI.esc(u.name) + '</td>' +
            '<td class="small">' + UI.esc(u.email) + '</td>' +
            '<td><span class="badge ' + (u.role === 'super_admin' ? 'badge-purple' : u.role === 'reviewer' ? 'badge-brand' : 'badge-neutral') + '">' + u.role.replace('_', ' ') + '</span></td>' +
            '<td>' + (u.active ? '<span class="badge badge-success">active</span>' : '<span class="badge badge-danger">inactive</span>') + '</td>' +
            '<td class="small">' + (u.hasTotp ? 'TOTP' : 'password only') + '</td>' +
            '<td class="small">' + (u.lastLogin ? UI.fmtDateTime(u.lastLogin) : 'never') + '</td>' +
            '<td class="row" style="gap:6px">' +
            '<button class="btn btn-ghost btn-sm" data-edit-user="' + UI.esc(u.id) + '">' + UI.icon('edit', 13) + '</button>' +
            '<button class="btn btn-ghost btn-sm" data-reset-user="' + UI.esc(u.id) + '" title="Reset password">' + UI.icon('lock', 13) + '</button>' +
            (u.active ? '<button class="btn btn-ghost btn-sm" data-deact-user="' + UI.esc(u.id) + '" title="Deactivate">' + UI.icon('x', 13) + '</button>' : '') +
            '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<h3 style="font-size:var(--fs-base);margin-top:32px;margin-bottom:12px">Active Sessions</h3>' +
        (sessions.length ? '<div class="table-wrap"><table class="table"><thead><tr>' +
          '<th>User</th><th>Role</th><th>Logged In</th><th>Last Seen</th><th>Expires</th><th></th></tr></thead><tbody>' +
          sessions.map(function (s) {
            return '<tr><td class="small">' + UI.esc(s.user) + '</td>' +
              '<td class="small">' + UI.esc(s.role) + '</td>' +
              '<td class="small">' + UI.fmtDateTime(s.loggedInAt) + '</td>' +
              '<td class="small">' + UI.timeAgo(s.lastSeen) + '</td>' +
              '<td class="small">' + UI.fmtDateTime(s.expiresAt) + '</td>' +
              '<td><button class="btn btn-danger btn-sm" data-force-logout="' + UI.esc(s.sid) + '">Force Logout</button></td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted small">No active sessions.</p>');

      /* wire actions */
      var add = $('#btn-add-user');
      if (add) add.addEventListener('click', userCreateModal);
      $$('[data-edit-user]').forEach(function (b) {
        b.addEventListener('click', function () {
          var u = users.find(function (x) { return x.id === b.dataset.editUser; });
          if (u) userEditModal(u);
        });
      });
      $$('[data-reset-user]').forEach(function (b) {
        b.addEventListener('click', function () {
          var u = users.find(function (x) { return x.id === b.dataset.resetUser; });
          if (!u) return;
          UI.confirmModal('Reset password for ' + u.name + '?', 'A new temporary password will be generated and shown once. The user should change it at next sign-in.', function () {
            API.resetPassword(u.id).then(function (r) {
              UI.modal({
                title: 'Temporary Password',
                body: '<p class="small muted">Provide this to the user securely (in person or via an encrypted channel). It will not be shown again.</p>' +
                  '<div class="sign-line mt-4" style="text-align:center;font-size:1.2rem">' + UI.esc(r.temporaryPassword) + '</div>',
                actions: [{ label: 'Close', cls: 'btn-secondary' }],
              });
            }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
          }, 'Reset Password', 'btn-warn');
        });
      });
      $$('[data-deact-user]').forEach(function (b) {
        b.addEventListener('click', function () {
          var u = users.find(function (x) { return x.id === b.dataset.deactUser; });
          if (!u) return;
          UI.confirmModal('Deactivate ' + u.name + '?', 'The account will be disabled immediately. Active sessions are not automatically terminated.', function () {
            API.deactivateUser(u.id).then(function () { UI.toast('User deactivated.', 'success'); renderUsers(); })
              .catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
          }, 'Deactivate', 'btn-danger');
        });
      });
      $$('[data-force-logout]').forEach(function (b) {
        b.addEventListener('click', function () {
          API.forceLogout(b.dataset.forceLogout).then(function () { UI.toast('Session terminated.', 'success'); renderUsers(); })
            .catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
        });
      });
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }

  function userCreateModal() {
    var body = document.createElement('div');
    body.innerHTML =
      '<div class="field"><label>Full Name *</label><input class="input" id="nu-name" placeholder="e.g. Jane Smith"></div>' +
      '<div class="field mt-2"><label>Email *</label><input class="input" id="nu-email" type="email" placeholder="jane@simalme.com"></div>' +
      '<div class="field mt-2"><label>Role *</label><select class="select" id="nu-role">' +
      '<option value="reviewer">Reviewer — review queue &amp; decisions</option>' +
      '<option value="viewer">Viewer — read-only + export</option>' +
      '<option value="super_admin">Super Admin — full control</option></select></div>' +
      '<div class="field mt-2"><label>Password * (min 8 chars)</label><input class="input" id="nu-pass" type="password" placeholder="••••••••"></div>' +
      '<div class="field mt-2"><label>TOTP Secret (optional — for MFA)</label><input class="input mono" id="nu-totp" placeholder="Base32 secret (A-Z, 2-7)"></div>';
    UI.modal({
      title: 'Add User', body: body,
      actions: [
        { label: 'Cancel', cls: 'btn-secondary' },
        { label: 'Create User', cls: 'btn-primary', onClick: function (backdrop) {
          var data = {
            name: body.querySelector('#nu-name').value.trim(),
            email: body.querySelector('#nu-email').value.trim(),
            role: body.querySelector('#nu-role').value,
            password: body.querySelector('#nu-pass').value,
            totpSecret: body.querySelector('#nu-totp').value.trim() || undefined,
          };
          if (!data.name || !data.email || !data.password) { UI.toast('Name, email and password are required.', 'warn'); return false; }
          API.createUser(data).then(function () {
            UI.toast('User created: ' + data.email, 'success');
            backdrop.close();
            renderUsers();
          }).catch(function (e) { UI.toast(e.message, 'error'); });
          return false;
        } },
      ],
    });
  }

  function userEditModal(u) {
    var body = document.createElement('div');
    body.innerHTML =
      '<div class="field"><label>Full Name</label><input class="input" id="eu-name" value="' + UI.esc(u.name) + '"></div>' +
      '<div class="field mt-2"><label>Email (read-only)</label><input class="input" value="' + UI.esc(u.email) + '" disabled></div>' +
      '<div class="field mt-2"><label>Role</label><select class="select" id="eu-role">' +
      ['reviewer', 'viewer', 'super_admin'].map(function (r) {
        return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r.replace('_', ' ') + '</option>';
      }).join('') + '</select></div>';
    UI.modal({
      title: 'Edit User', body: body,
      actions: [
        { label: 'Cancel', cls: 'btn-secondary' },
        { label: 'Save', cls: 'btn-primary', onClick: function (backdrop) {
          API.updateUser(u.id, {
            name: body.querySelector('#eu-name').value.trim(),
            role: body.querySelector('#eu-role').value,
          }).then(function () { UI.toast('User updated.', 'success'); backdrop.close(); renderUsers(); })
            .catch(function (e) { UI.toast(e.message, 'error'); });
          return false;
        } },
      ],
    });
  }

  /* ================================================================== */
  /* SETTINGS                                                           */
  /* ================================================================== */
  function renderSettings() {
    if (!can('view_pii')) {
      $('#content').innerHTML = '<div class="card card-pad empty-state"><h3>Insufficient permissions</h3><p class="muted small">Settings requires Super Admin access.</p></div>';
      return;
    }
    $('#content').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:120px"></div></div>';
    API.getSettings().then(function (s) {
      $('#content').innerHTML =
        '<div class="grid grid-2 mb-6" style="gap:24px">' +

        '<div class="card card-pad"><h3 style="font-size:var(--fs-base);margin-bottom:16px">Organization Identity</h3>' +
        '<div class="field"><label>Simal TIN (15 digits)</label><input class="input mono" id="st-tin" value="' + UI.esc(s.simalTin) + '" maxlength="15"></div>' +
        '<div class="field mt-3"><label>Peppol ID (0235:TIN)</label><input class="input mono" id="st-peppol" value="' + UI.esc(s.simalPeppol) + '"></div>' +
        '<button class="btn btn-primary mt-4" id="btn-save-org">Save Identity</button></div>' +

        '<div class="card card-pad"><h3 style="font-size:var(--fs-base);margin-bottom:16px">Session Policy</h3>' +
        kvRow('Idle timeout', s.session.idleMinutes + ' minutes') +
        kvRow('Absolute expiry', s.session.absoluteHours + ' hours') +
        kvRow('Enforcement', 'Server-side (all endpoints)') +
        '<p class="small muted mt-3 mb-0">Configured via SESSION_IDLE_MINUTES / SESSION_ABSOLUTE_HOURS in the environment. Follows OWASP 15–30 min guidance.</p></div>' +

        '<div class="card card-pad"><h3 style="font-size:var(--fs-base);margin-bottom:16px">Notifications</h3>' +
        kvRow('SMTP', s.smtp.configured ? 'Configured (' + UI.esc(s.smtp.host) + ')' : 'Outbox fallback (no SMTP_HOST set)') +
        kvRow('From address', UI.esc(s.smtp.from || '—')) +
        kvRow('Email channel', s.smtp.emailEnabled ? 'Enabled' : 'Disabled') +
        kvRow('WhatsApp channel', s.smtp.whatsappEnabled ? 'Enabled' : 'Disabled') +
        '<p class="small muted mt-3 mb-0">Set SMTP_HOST/PORT/USER/PASS/FROM in the environment for direct email delivery. Without SMTP, all messages land in the durable outbox (Notifications view).</p></div>' +

        '<div class="card card-pad"><h3 style="font-size:var(--fs-base);margin-bottom:16px">Screening</h3>' +
        kvRow('Watchlist file', UI.esc(s.screening.watchlistPath)) +
        kvRow('Entries loaded', String(s.screening.entries)) +
        kvRow('Fuzzy threshold', String(s.screening.fuzzyThreshold)) +
        '<button class="btn btn-secondary mt-3" id="btn-reload-wl">' + UI.icon('shield', 14) + ' Reload Watchlist</button></div>' +

        '<div class="card card-pad"><h3 style="font-size:var(--fs-base);margin-bottom:16px">Integrations</h3>' +
        kvRow('Master API token', s.integration.masterApiTokenConfigured ? 'Configured' : 'Not set') +
        kvRow('Webhook URL', s.integration.webhookUrlConfigured ? 'Configured' : 'Not set') +
        kvRow('Master feed endpoint', '/api/integration/master') +
        '<p class="small muted mt-3 mb-0">Set MASTER_API_TOKEN and WEBHOOK_URL/WEBHOOK_SECRET in the environment. The master feed serves approved counterparties for ERP/ASP pull; webhooks fire on approval (SSRF-guarded).</p></div>' +

        '</div>';

      function kvRow(k, v) {
        return '<div class="expiry-row"><div class="small" style="font-weight:600;color:var(--gray-600)">' + UI.esc(k) + '</div><div class="small">' + UI.esc(v) + '</div></div>';
      }

      var save = $('#btn-save-org');
      if (save) save.addEventListener('click', function () {
        var tin = $('#st-tin').value.trim();
        var peppol = $('#st-peppol').value.trim();
        if (tin && !/^\d{15}$/.test(tin)) { UI.toast('TIN must be exactly 15 digits.', 'error'); return; }
        if (peppol && !/^0235:\d{10}$/.test(peppol)) { UI.toast('Peppol ID must be 0235: followed by the 10-digit TIN.', 'error'); return; }
        save.disabled = true;
        API.updateSettings({ simalTin: tin, simalPeppol: peppol }).then(function () {
          UI.toast('Organization identity saved.', 'success');
        }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); })
          .finally(function () { save.disabled = false; });
      });

      var wl = $('#btn-reload-wl');
      if (wl) wl.addEventListener('click', function () {
        wl.disabled = true;
        fetch('/api/admin/screening/reload', { method: 'POST', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (j) { UI.toast('Watchlist reloaded: ' + j.entries + ' entries.', 'success'); renderSettings(); })
          .catch(function (e) { UI.toast(e.message || 'Reload failed', 'error'); })
          .finally(function () { wl.disabled = false; });
      });
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }

  /* ================================================================== */
  /* REPORTS                                                            */
  /* ================================================================== */
  function renderReports() {
    $('#content').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:120px"></div></div>';
    API.reports().then(function (meta) {
      $('#content').innerHTML =
        '<h3 style="font-size:var(--fs-base);margin-bottom:12px">Built-in Reports</h3>' +
        '<div class="grid grid-3 mb-6">' + meta.builtIn.map(function (r) {
          return '<div class="card card-pad card-hover" style="cursor:pointer" data-run-report="' + r.id + '">' +
            '<div style="font-weight:700;font-size:var(--fs-md);color:var(--brand-700)">' + UI.esc(r.name) + '</div>' +
            '<p class="small muted mt-1 mb-0">' + UI.esc(r.description) + '</p></div>';
        }).join('') + '</div>' +

        '<h3 style="font-size:var(--fs-base);margin-bottom:12px">Custom Report Builder</h3>' +
        '<div class="card card-pad">' +
        '<div class="row mb-4" style="gap:12px;flex-wrap:wrap">' +
        '<select class="select" id="rp-role" style="width:auto"><option value="all">All roles</option><option value="vendor">Vendors</option><option value="customer">Customers</option></select>' +
        '<select class="select" id="rp-status" style="width:auto"><option value="all">All statuses</option>' +
        ['submitted','under_review','query_raised','partner_updated','on_hold','approved','rejected'].map(function (s2) {
          return '<option value="' + s2 + '">' + UI.STATUS[s2].label + '</option>';
        }).join('') + '</select>' +
        '<input class="input" type="date" id="rp-from" title="From date" style="width:auto">' +
        '<input class="input" type="date" id="rp-to" title="To date" style="width:auto">' +
        '<label class="checkline"><input type="checkbox" id="rp-screening"> <span class="small">Screening hits only</span></label>' +
        '</div>' +
        '<div class="field"><label>Fields (Ctrl/Cmd-click for multiple)</label>' +
        '<select class="select" id="rp-fields" multiple size="8" style="height:auto">' +
        meta.availableFields.map(function (f) {
          return '<option value="' + UI.esc(f.key) + '"' +
            (['id','role','status','company.legal_name_en','tax.trn','submittedAtISO'].includes(f.key) ? ' selected' : '') +
            '>' + UI.esc(f.label) + '</option>';
        }).join('') + '</select></div>' +
        '<div class="row mt-4" style="gap:8px">' +
        '<button class="btn btn-primary" id="rp-run">Run Report</button>' +
        '<button class="btn btn-secondary" id="rp-export">Export CSV</button>' +
        '</div></div>' +
        '<div id="rp-results" class="mt-4"></div>';

      $$('[data-run-report]').forEach(function (card) {
        card.addEventListener('click', function () {
          var def = meta.builtIn.find(function (r) { return r.id === card.dataset.runReport; });
          if (!def) return;
          if (def.id === 'user-activity') { runReport(null, null, 'user-activity'); return; }  /* audit-backed — server picks the columns */
          if (def.id === 'expiring-docs') { location.hash = '#/analytics'; return; }  /* analytics owns the 90-day logic */
          runReport(def.defaults.fields, def.defaults.filters || {});
        });
      });

      function collectParams() {
        var fields = Array.from($('#rp-fields').selectedOptions).map(function (o) { return o.value; });
        return {
          fields: fields,
          filters: {
            role: $('#rp-role').value,
            status: $('#rp-status').value,
            dateFrom: $('#rp-from').value || undefined,
            dateTo: $('#rp-to').value || undefined,
            screeningOnly: $('#rp-screening').checked || undefined,
          },
        };
      }

      function runReport(fields, filters, builtIn) {
        var params = builtIn ? { builtIn: builtIn } : (fields ? { fields: fields, filters: filters || {} } : collectParams());
        $('#rp-results').innerHTML = '<div class="card card-pad"><div class="skeleton" style="height:80px"></div></div>';
        API.buildReport(params).then(function (r) {
          window.__lastReport = params; /* for export */
          $('#rp-results').innerHTML =
            '<div class="toolbar mb-2" style="justify-content:space-between">' +
            '<span class="small muted">' + r.rowCount + ' row(s) · ' + r.columns.length + ' column(s)</span>' +
            '</div>' +
            '<div class="table-wrap" style="max-height:500px;overflow:auto"><table class="table"><thead><tr>' +
            r.columns.map(function (c) { return '<th>' + UI.esc(c.label) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + r.rows.slice(0, 100).map(function (row) {
              return '<tr>' + r.columns.map(function (c) {
                return '<td class="small">' + UI.esc(row[c.key] || '—') + '</td>';
              }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>' +
            (r.rowCount > 100 ? '<p class="small muted mt-2">Showing first 100 of ' + r.rowCount + ' rows. Export CSV for the full dataset.</p>' : '');
        }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
      }

      $('#rp-run').addEventListener('click', function () { runReport(); });
      $('#rp-export').addEventListener('click', function () {
        var params = window.__lastReport || collectParams();
        fetch('/api/admin/reports/export.csv', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }).then(function (r) { return r.blob(); })
          .then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'simal-kyc-report-' + Date.now() + '.csv';
            a.click();
            UI.toast('Report exported.', 'success');
          }).catch(function (e) { UI.toast(e.message || 'Export failed', 'error'); });
      });
    }).catch(function (e) { if (!guard(e)) UI.toast(e.message, 'error'); });
  }

  /* ================================================================== */
  /* boot                                                               */
  /* ================================================================== */
  initAuthUi();
  API.me().then(function () { return enterApp(); }).catch(function () {
    /* not signed in — show auth */
  });
})();
