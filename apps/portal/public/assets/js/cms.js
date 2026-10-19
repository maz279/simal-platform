/* ==========================================================================
 * cms.js — Simal Enterprise Content Studio (Microsoft Fluent Design Theme)
 * Pure Fluent Design Controller for Simal Corporate Digital Platform
 * - Multi-area sitemap navigation (Content Studio, Solutions, Governance, Admin)
 * - Omni-navigation Mega Menu with keyboard navigation
 * - Context-aware Fluent Command Bar ribbon
 * - High-density multi-stream workspaces (Editorial Desk, Hero Carousel, Media Library)
 * - 3-Column Entity Form Engine with Process Flow (BPF) stages and live validation
 * - User and Role Management (RBAC matrix, active sessions, force logout)
 * - Revision snapshot diff inspector and 1-click rollback
 * - ADR-13 / ADR-14 static site publish and cache purge triggers
 * ========================================================================== */

(function (window, document) {
  'use strict';

  var $ = function (selector) { return document.querySelector(selector); };
  var $$ = function (selector) { return document.querySelectorAll(selector); };

  var state = {
    me: null,
    currentArea: 'content', // 'content' | 'solutions' | 'governance' | 'admin'
    currentView: 'dashboard',
    currentRecord: null,
    blocks: [],
    slides: [],
    policies: [],
    users: [],
    auditLogs: [],
    sessions: [],
    activeMedia: [],
    products: [],
    brands: [],
    media: [],
    outbox: [],
    announcements: [],
    testimonials: [],
    telemetry: null,
    loadErrors: {},
    lastRefreshed: null,
    ssgProbe: null, /* { reachable: bool, latencyMs } — measured client-side */
    sidebarCollapsed: false,
    dirty: false
  };

  /* Inline SVG icon helper (shared set lives in ui.js; loaded before cms.js). */
  function ic(name, size) {
    if (window.UI && typeof UI.icon === 'function') return UI.icon(name, size || 16);
    return '';
  }

  /* Helper utilities */
  /* deploy-audit: the public site origin comes from the server (SITE_PUBLIC_URL via telemetry);
   * every link here was hardcoded to the rig address http://127.0.0.1:8100 */
  function siteUrl(p) {
    var base = (state && state.telemetry && state.telemetry.publicSiteUrl) || 'http://127.0.0.1:8100';
    return String(base).replace(/\/+$/, '') + (p || '');
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'); // rm(3.2-1)/F-2026-N10: single-quote attribute breakout
  }

  function formatDate(ts) {
    if (!ts) return '—';
    var d = new Date(Number(ts) || ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function toast(message, type) {
    var container = $('#d365-toast-container');
    if (!container) return;
    var t = document.createElement('div');
    var isErr = type === 'error' || type === true;
    var isWarn = type === 'warn';
    t.setAttribute('role', isErr ? 'alert' : 'status');
    var bg = isErr ? '#A80000' : (isWarn ? '#D83B01' : '#0F172A');
    t.style.cssText = 'background:' + bg + ';color:#FFFFFF;padding:12px 18px;border-radius:6px;font-size:13px;font-weight:500;box-shadow:0 10px 25px rgba(0,0,0,0.22);display:flex;align-items:center;gap:10px;pointer-events:auto;min-width:280px;animation:d365SlideDown 150ms ease;';
    var icon = isErr ? '❌' : (isWarn ? '⚠️' : '✅');
    t.innerHTML = '<span>' + icon + '</span><span>' + esc(message) + '</span>';
    container.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity 200ms ease';
      setTimeout(function () { t.remove(); }, 220);
    }, 3200);
  }

  /* ==========================================================================
     1. Authentication Gate & Bootstrapping
     ========================================================================== */
  function initAuth() {
    closeModals();
    API.me().then(function (res) {
      enterApplication(res);
    }).catch(function () {
      $('#auth').hidden = false;
      $('#app').hidden = true;
      setupAuthHandlers();
    });
  }

  function setupAuthHandlers() {
    var emailInput = $('#cms-email');
    var passInput = $('#cms-pass');
    var submitBtn = $('#cms-submit');
    var errEl = $('#cms-auth-err');

    function doSignIn() {
      var email = emailInput.value.trim();
      var pass = passInput.value;
      var eErr = $('#cms-email-err');
      var pErr = $('#cms-pass-err');

      eErr.hidden = pErr.hidden = errEl.hidden = true;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { eErr.hidden = false; return; }
      if (!pass) { pErr.hidden = false; return; }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating with Simal CMS…';

      API.login(email, pass).then(function (res) {
        if (res.mfaRequired) {
          var code = window.prompt('Two-Factor Authentication required. Enter the 6-digit code:');
          if (!code) { submitBtn.disabled = false; submitBtn.textContent = 'Sign in to Simal Content Studio'; return; }
          return API.verifyMfa(res.mfaChallengeId, code);
        }
        return res;
      }).then(function (res) {
        if (!res) { submitBtn.disabled = false; submitBtn.textContent = 'Sign in to Simal Content Studio'; return; }
        return API.me().then(enterApplication);
      }).catch(function (err) {
        errEl.textContent = (err && err.status === 401) ? 'Invalid email or password.' : (err.message || 'Authentication failed');
        errEl.hidden = false;
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in to Simal Content Studio';
      });
    }

    submitBtn.addEventListener('click', doSignIn);
    passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSignIn(); });
  }

  function enterApplication(userData) {
    state.me = userData.user;
    $('#auth').hidden = true;
    $('#app').hidden = false;

    // Populate user profile info in top ribbon
    var name = state.me.name || state.me.email;
    $('#d365-user-name').textContent = name;
    $('#d365-user-role').textContent = (state.me.role === 'super_admin' ? 'Super Administrator' : (state.me.role === 'reviewer' ? 'Content Reviewer' : 'Auditor / Viewer'));
    
    var initials = name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase() || 'SA';
    $('#d365-avatar-initials').textContent = initials;

    // Load initial primary datasets in parallel
    refreshGlobalData().then(function () {
      setupShellEvents();
      route();
    });
  }

  function isSuperAdmin() {
    /* deploy-audit: state.me IS the user (enterApplication stores userData.user); reading
     * state.me.user.role was always undefined, so since rm(10.3-1) no account — not even a
     * super_admin — loaded users, sessions or telemetry, or could open those views */
    return Boolean(state.me && state.me.role === 'super_admin');
  }

  function refreshGlobalData() {
    // Each parallel fetch records its own failure so views can render honest
    // "unavailable" states instead of silently falling back to placeholder numbers.
    return Promise.all([
      API.get('/api/cms/blocks').catch(function () { state.loadErrors.blocks = true; return { blocks: [] }; }),
      API.get('/api/cms/slides').catch(function () { state.loadErrors.slides = true; return { slides: [] }; }),
      API.get('/api/cms/policies').catch(function () { state.loadErrors.policies = true; return { policies: [] }; }),
      /* rm(10.3-1 pen CMS-32): these three are super_admin (view_pii) APIs; for any
       * other role skip the call entirely so a reviewer dashboard does not report
       * them as "failed to load" / "PostgreSQL unreachable". */
      (isSuperAdmin() ? API.users() : Promise.resolve([])).catch(function () { state.loadErrors.users = true; return []; }),
      API.audit('', 'all').catch(function () { state.loadErrors.audit = true; return []; }),
      (isSuperAdmin() ? API.sessions() : Promise.resolve([])).catch(function () { state.loadErrors.sessions = true; return []; }),
      (isSuperAdmin() ? API.get('/api/cms/telemetry') : Promise.resolve(null)).catch(function () { state.loadErrors.telemetry = true; return null; }),
      API.get('/api/cms/products').catch(function () { state.loadErrors.products = true; return { products: [] }; }),
      API.get('/api/cms/media').catch(function () { state.loadErrors.media = true; return { media: [] }; }),
      API.get('/api/cms/outbox').catch(function () { state.loadErrors.outbox = true; return { outbox: [] }; }),
      API.get('/api/cms/announcements').catch(function () { state.loadErrors.announcements = true; return { announcements: [] }; }),
      API.get('/api/cms/testimonials').catch(function () { state.loadErrors.testimonials = true; return { testimonials: [] }; }),
      API.get('/api/cms/brands').catch(function () { state.loadErrors.brands = true; return { brands: [] }; })
    ]).then(function (results) {
      state.blocks = results[0].blocks || [];
      state.slides = results[1].slides || [];
      state.policies = results[2].policies || [];
      state.users = results[3] || [];
      state.auditLogs = results[4] || [];
      state.sessions = results[5] || [];
      if (results[6]) state.telemetry = results[6];
      // rm(5.1-1): publish telemetry (build-derived Last Publish) for the dashboard
      if (isSuperAdmin()) API.get('/api/cms/telemetry/publish').then(function (pt) { state.publishTelemetry = pt; }).catch(function () { state.publishTelemetry = null; });
      state.products = results[7].products || [];
      state.media = results[8].media || [];
      state.outbox = results[9].outbox || [];
      state.announcements = results[10].announcements || [];
      state.testimonials = results[11].testimonials || [];
      state.brands = results[12].brands || [];
      state.lastRefreshed = Date.now();
      renderSitemapNav();
    });
  }

  /* ==========================================================================
     2. Simal CMS (Fluent UI Theme) Shell & Navigation Architecture
     ========================================================================== */
  var sitemapMatrix = {
    content: {
      title: 'Content Studio',
      icon: 'layers',
      groups: [
        {
          name: 'Workspaces',
          items: [
            { id: 'dashboard', label: 'Executive Dashboard', icon: 'dash' },
            { id: 'workspace-editorial', label: 'Editorial Desk', icon: 'edit', badge: function () { return state.blocks.filter(function (b) { return b.entity === 'insight'; }).length || null; } },
            { id: 'slides', label: 'Hero Carousel & Banners', icon: 'image', badge: function () { return state.slides.length || null; } },
            { id: 'media-library', label: 'Media & Photo Assets', icon: 'eye', badge: function () { return state.media.length || null; } }
          ]
        },
        {
          name: 'Core Content Assets',
          items: [
            { id: 'insights', label: 'News & Insights', icon: 'doc', badge: function () { return state.blocks.filter(function (b) { return b.entity === 'insight'; }).length || null; } },
            { id: 'announcements', label: 'Announcement Bar', icon: 'bolt', badge: function () { return state.announcements.some(function (a) { return a.active; }) ? '1 live' : 'off'; } },
            { id: 'testimonials', label: 'Testimonials & Awards', icon: 'star', badge: function () { return state.testimonials.length || null; } },
            { id: 'blocks', label: 'Content Blocks', icon: 'grid', badge: function () { return state.blocks.length || null; } },
            { id: 'claims-register', label: 'Claims & Hours Register', icon: 'gavel' }
          ]
        },
        {
          /* deploy-audit: these editors worked (#/navigation …) but no menu linked to them */
          name: 'Site Chrome & Facts',
          items: [
            { id: 'navigation', label: 'Navigation & Utility Bar', icon: 'grid' },
            { id: 'footer', label: 'Footer Columns', icon: 'grid' },
            { id: 'newsletter', label: 'Newsletter Strip', icon: 'doc' },
            { id: 'seo-defaults', label: 'SEO Defaults', icon: 'eye' },
            { id: 'stats', label: 'Counters (years, since)', icon: 'dash' },
            { id: 'awards', label: 'Awards & Recognition', icon: 'star' },
            { id: 'categories', label: 'Product Categories', icon: 'cart' }
          ]
        }
      ]
    },
    solutions: {
      title: 'Commercial & Solutions',
      icon: 'briefcase',
      groups: [
        {
          name: 'Solutions & Services',
          items: [
            { id: 'it-solutions', label: 'IT Solution Lines', icon: 'bolt', badge: function () { return state.blocks.filter(function (b) { return b.entity === 'it_solution'; }).length || null; } },
            { id: 'amc-tiers', label: 'AMC Maintenance SLAs', icon: 'gear' },
            { id: 'software-suites', label: 'Software: UniERP & UniVAT', icon: 'box' }
          ]
        },
        {
          name: 'Hardware Portfolio',
          items: [
            { id: 'products-catalog', label: 'Hardware SKUs', icon: 'cart', badge: function () { return state.products.length || null; } },
            { id: 'brands-catalog', label: 'Authorized Brands', icon: 'star', badge: function () { return state.brands.length || null; } },
            { id: 'media-library', label: 'Hardware Photo Gallery', icon: 'image', badge: function () { return state.media.length || null; } }
          ]
        }
      ]
    },
    governance: {
      title: 'Governance & Compliance',
      icon: 'shield',
      groups: [
        {
          name: 'Legal & Standards',
          items: [
            { id: 'policies', label: 'Legal Policies', icon: 'doc', badge: function () { return state.policies.length || null; } },
            { id: 'loc-audit', label: 'AR / EN Localization Parity', icon: 'translate' }
          ]
        },
        {
          name: 'Audit & Publishing',
          items: [
            { id: 'revisions', label: 'Revision Snapshots & Diff', icon: 'history' },
            { id: 'publish-pipeline', label: 'SSG Purge & Publish Pipeline', icon: 'rocket', badge: function () { return state.outbox.length || null; } },
            { id: 'publish-approvals', label: 'Publish Approvals', icon: 'shield' },
            { id: 'audit-trail', label: 'Enterprise Audit Log', icon: 'doc', badge: function () { return state.auditLogs.length || null; } }
          ]
        }
      ]
    },
    admin: {
      title: 'Administration & Security',
      icon: 'users',
      groups: [
        {
          name: 'Access Control & Security',
          items: [
            { id: 'users-management', label: 'Staff Users & Directory', icon: 'users', badge: function () { return state.users.length || null; } },
            { id: 'rbac-matrix', label: 'RBAC Permission Matrix', icon: 'lock' },
            { id: 'active-sessions', label: 'Active Security Sessions', icon: 'server', badge: function () { return state.sessions.length || null; } }
          ]
        },
        {
          name: 'System Operations',
          items: [
            { id: 'system-telemetry', label: 'Telemetry & Health', icon: 'chart' }
          ]
        }
      ]
    }
  };

  function setWorkArea(areaKey) {
    if (!sitemapMatrix[areaKey]) areaKey = 'content';
    state.currentArea = areaKey;
    var area = sitemapMatrix[areaKey];

    $('#area-current-icon').innerHTML = ic(area.icon, 15);
    $('#area-current-label').textContent = area.title;
    /* rm(9.2-3): SC 2.5.3 Label in Name — the accessible name must contain the
     * visible label text, which changes with the selected work area. */
    $('#btn-area-switcher')?.setAttribute('aria-label', area.title + ' — select work area');
    $('#sitemap-current-area-title').textContent = area.title;

    // Update active check in Area menu
    $$('.d365-area-option').forEach(function (opt) {
      opt.classList.toggle('current', opt.getAttribute('data-area') === areaKey);
    });

    renderSitemapNav();
    $('#area-menu').classList.remove('open');
  }

  function renderSitemapNav() {
    var area = sitemapMatrix[state.currentArea] || sitemapMatrix.content;
    var navTree = $('#sitemap-nav-tree');
    if (!navTree) return;

    var html = '';
    area.groups.forEach(function (grp) {
      html += '<div class="d365-nav-group">';
      html += '<div class="d365-nav-group-header"><span>' + esc(grp.name) + '</span></div>';
      grp.items.forEach(function (item) {
        /* rm(10.3-1 pen CMS-32): these APIs are super_admin (view_pii) only — do not
         * offer them to reviewers, where they can only 403. */
        var ADMIN_ONLY = { 'system-telemetry': 1, 'users-management': 1, 'active-sessions': 1 };
        var role = (state.me && state.me.role) || '';
        if (ADMIN_ONLY[item.id] && role !== 'super_admin') return;
        var badgeText = '';
        if (typeof item.badge === 'function') badgeText = item.badge();
        else if (item.badge) badgeText = item.badge;

        var isActive = state.currentView === item.id;
        html += '<a href="#/' + item.id + '" class="d365-nav-item ' + (isActive ? 'active' : '') + '" data-view="' + item.id + '">';
        html += '<span class="d365-nav-ic">' + ic(item.icon, 15) + '</span>';
        html += '<span>' + esc(item.label) + '</span>';
        if (badgeText) {
          html += '<span class="d365-nav-badge">' + esc(badgeText) + '</span>';
        }
        html += '</a>';
      });
      html += '</div>';
    });
    navTree.innerHTML = html;
  }

  function setupShellEvents() {
    // Area Switcher button toggle
    $('#btn-area-switcher').addEventListener('click', function (e) {
      e.stopPropagation();
      $('#area-menu').classList.toggle('open');
    });
    document.addEventListener('click', function () {
      $('#area-menu')?.classList.remove('open');
    });

    // Area menu items
    $$('.d365-area-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        var targetArea = opt.getAttribute('data-area');
        setWorkArea(targetArea);
        // Navigate to the first item in the selected area
        var firstItem = sitemapMatrix[targetArea].groups[0].items[0];
        location.hash = '#/' + firstItem.id;
      });
    });

    // Sitemap collapse / expand
    $('#btn-toggle-sitemap').addEventListener('click', function () {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      $('#app-container').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      this.textContent = state.sidebarCollapsed ? '▶' : '◀';
    });

    // Mega menu toggle
    /* Convert megamenu link icons (emoji → SVG) using the same icon map as the
       sitemap rail, so the two navigation surfaces never drift apart. */
    (function megamenuIcons() {
      var iconByView = {};
      Object.keys(sitemapMatrix).forEach(function (ak) {
        sitemapMatrix[ak].groups.forEach(function (g) {
          g.items.forEach(function (it) { iconByView[it.id] = it.icon; });
        });
      });
      iconByView['admin.html'] = 'ext';
      $$('#megamenu-overlay .d365-mega-link-item').forEach(function (link) {
        var href = (link.getAttribute('href') || '').replace('#/', '').split('?')[0];
        var name = iconByView[href] || 'chevR';
        var slot = link.querySelector('.d365-mega-ic');
        if (slot) slot.innerHTML = ic(name, 16);
      });
    })();

    $('#btn-mega-toggle').addEventListener('click', function () {
      $('#megamenu-overlay').classList.add('open');
    });
    $('#btn-mega-close').addEventListener('click', function () {
      $('#megamenu-overlay').classList.remove('open');
    });
    $('#megamenu-overlay').addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });

    // Quick create shortcuts inside mega menu
    $('#mega-quick-article')?.addEventListener('click', function () {
      $('#megamenu-overlay').classList.remove('open');
      openQuickCreate('insight');
    });
    $('#mega-quick-slide')?.addEventListener('click', function () {
      $('#megamenu-overlay').classList.remove('open');
      openQuickCreate('slide');
    });
    $('#mega-quick-user')?.addEventListener('click', function () {
      $('#megamenu-overlay').classList.remove('open');
      openUserModal(null);
    });
    $('#mega-quick-publish')?.addEventListener('click', function () {
      $('#megamenu-overlay').classList.remove('open');
      openPublishModal();
    });

    // Header Quick Create button
    $('#btn-quick-create').addEventListener('click', function () {
      openQuickCreate();
    });

    // Notifications Bell
    $('#btn-notifications')?.addEventListener('click', function () {
      var pending = (state.outbox || []).filter(function (o) { return o.status === 'pending'; }).length;
      var failed = (state.outbox || []).filter(function (o) { return o.status === 'failed'; }).length;
      var msg = 'System Telemetry & Notifications:\n' +
                '• Outbox Queue: ' + (state.outbox ? state.outbox.length : 0) + ' events (' + pending + ' pending, ' + failed + ' failed)\n' +
                '• Active Products: ' + (state.products ? state.products.length : 0) + ' SKUs\n' +
                '• Live Staff Sessions: ' + (state.sessions ? state.sessions.length : 0);
      toast('Alerts: ' + pending + ' pending outbox syncs, ' + (state.sessions ? state.sessions.length : 1) + ' live sessions', 'info');
      if (confirm(msg + '\n\nOpen ADR-13 Publish Pipeline?')) {
        location.hash = '#/publish-pipeline';
      }
    });

    // Settings Gear
    $('#btn-quick-settings')?.addEventListener('click', function () {
      location.hash = '#/system-telemetry';
    });

    // User Profile Chip
    $('#btn-user-profile')?.addEventListener('click', function () {
      var u = state.me || {};
      toast('Signed in as: ' + (u.name || u.email || 'Admin') + ' (' + (u.role || 'super_admin') + ')', 'info');
      location.hash = '#/users-management';
    });

    // Sign out
    $('#btn-logout')?.addEventListener('click', function () {
      API.logout().then(function () {
        location.reload();
      });
    });

    // Global Search (Ctrl+K)
    var searchInput = $('#global-search-input');
    searchInput?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = this.value.trim().toLowerCase();
        if (q) performGlobalSearch(q);
      }
    });

    window.addEventListener('keydown', function (e) {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
      // Alt+M for Mega Menu
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        $('#megamenu-overlay')?.classList.toggle('open');
      }
      // Esc closes overlays
      if (e.key === 'Escape') {
        $('#megamenu-overlay')?.classList.remove('open');
        closeModals();
      }
      // Ctrl+S or Cmd+S triggers Context-Aware Save
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if ($('#modal-product-edit')?.classList.contains('open')) {
          $('#btn-prod-save')?.click();
        } else if ($('#modal-brand-edit')?.classList.contains('open')) {
          $('#btn-brand-save')?.click();
        } else if ($('#modal-user-edit')?.classList.contains('open')) {
          $('#btn-user-save')?.click();
        } else if ($('#modal-testimonial-edit')?.classList.contains('open')) {
          $('#btn-test-save')?.click();
        } else if ($('#modal-quick-create')?.classList.contains('open')) {
          $('#btn-qc-submit')?.click();
        } else if ($('#form-btn-save')) {
          $('#form-btn-save').click();
        } else if ($('#btn-save-announcement')) {
          $('#btn-save-announcement').click();
        } else if ($('#cmd-save-slides')) {
          $('#cmd-save-slides').click();
        } else {
          toast('Save shortcut: Form is active when in an editor workspace', 'info');
        }
      }
    });

    // Close buttons for modals
    $$('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModals();
      });
    });

    // Modal submit listeners
    $('#btn-qc-submit')?.addEventListener('click', handleQuickCreateSubmit);
    $('#btn-user-save')?.addEventListener('click', handleUserSave);
    $('#btn-pub-execute')?.addEventListener('click', handlePublishExecute);
    $('#btn-emergency-pub-execute')?.addEventListener('click', handleEmergencyPublishExecute);
    $('#btn-prod-save')?.addEventListener('click', handleProductSave);
    $('#btn-test-save')?.addEventListener('click', handleTestimonialSave);
    $('#btn-brand-save')?.addEventListener('click', handleBrandSave);
    $('#btn-media-upload-submit')?.addEventListener('click', handleMediaUploadSubmit);
    hookMediaFileInput();
  }

  var lastFocusedElement = null;

  function trapFocus(modalEl) {
    if (!modalEl) return;
    lastFocusedElement = document.activeElement;
    modalEl.removeAttribute('hidden');
    modalEl.removeAttribute('inert');
    modalEl.setAttribute('aria-hidden', 'false');
    modalEl.classList.add('open');
    var focusables = modalEl.querySelectorAll('button:not([disabled]):not([hidden]), [href], input:not([disabled]):not([hidden]):not([type="hidden"]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])');
    if (focusables.length) {
      setTimeout(function () {
        focusables[0].focus();
      }, 30);
    }
    function handleKey(e) {
      if (e.key === 'Tab') {
        var activeFocusables = Array.prototype.slice.call(modalEl.querySelectorAll('button:not([disabled]):not([hidden]), [href], input:not([disabled]):not([hidden]):not([type="hidden"]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])'));
        if (!activeFocusables.length) return;
        var first = activeFocusables[0];
        var last = activeFocusables[activeFocusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !modalEl.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalEl.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModals();
      }
    }
    if (modalEl._keyHandler) {
      modalEl.removeEventListener('keydown', modalEl._keyHandler);
    }
    modalEl._keyHandler = handleKey;
    modalEl.addEventListener('keydown', handleKey);
  }

  function closeModals() {
    $$('.d365-modal-backdrop').forEach(function (m) {
      m.classList.remove('open');
      m.setAttribute('hidden', '');
      m.setAttribute('inert', '');
      m.setAttribute('aria-hidden', 'true');
      if (m._keyHandler) {
        m.removeEventListener('keydown', m._keyHandler);
        m._keyHandler = null;
      }
    });
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      try {
        lastFocusedElement.focus();
      } catch (err) {}
      lastFocusedElement = null;
    }
  }

  /* ==========================================================================
     3. Global Routing & View Registry
     ========================================================================== */
  var routes = {
    'dashboard': viewDashboard,
    'workspace-editorial': viewEditorialWorkspace,
    'slides': viewHeroSlides,
    'insights': viewInsights,
    'media-library': viewMediaLibrary,
    'media': viewMediaLibrary,
    'blocks': viewBlocks,
    'block-editor': viewBlockEditorRoute,
    'claims-register': viewClaimsRegister,
    'claims': viewClaimsRegister,
    'it-solutions': viewItSolutions,
    'solutions': viewItSolutions,
    'amc-tiers': viewAmcTiers,
    'amc': viewAmcTiers,
    'software-suites': viewSoftwareSuites,
    'software': viewSoftwareSuites,
    'products-catalog': viewProductsCatalog,
    'products': viewProductsCatalog,
    'brands-catalog': viewBrandsManagement,
    'brands': viewBrandsManagement,
    'policies': viewPolicies,
    'loc-audit': viewLocAudit,
    'revisions': viewRevisions,
    'publish-pipeline': viewPublishPipeline,
    'publish-approvals': viewPublishApprovals,
    'outbox': viewPublishPipeline,
    'audit-trail': viewAuditTrail,
    'audit': viewAuditTrail,
    'users-management': viewUsersManagement,
    'users': viewUsersManagement,
    'rbac-matrix': viewRbacMatrix,
    'active-sessions': viewActiveSessions,
    'system-telemetry': viewTelemetry,
    'telemetry': viewTelemetry,
    'announcements': viewAnnouncements,
    'testimonials': viewTestimonials,
    /* rm(4.1): site chrome editors */
    'navigation': viewChromeEditor('nav-menus', 'Navigation & Utility Bar'),
    'nav-menus': viewChromeEditor('nav-menus', 'Navigation & Utility Bar'),
    'footer': viewChromeEditor('footer', 'Footer Columns & Addresses'),
    'newsletter': viewChromeEditor('newsletter', 'Newsletter Strip'),
    /* rm(4.2): SEO defaults, stats/counters, awards */
    'seo-defaults': viewChromeEditor('seo-defaults', 'SEO Default Metadata'),
    'seo': viewChromeEditor('seo-defaults', 'SEO Default Metadata'),
    'stats': viewChromeEditor('counters', 'Site Counters & Stats'),
    'counters': viewChromeEditor('counters', 'Site Counters & Stats'),
    'awards': viewChromeEditor('awards', 'Awards & Recognition'),
    /* rm(4.5-2) */
    'categories': viewCategories
  };

  function route() {
    var hash = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
    state.currentView = hash;

    /* rm(10.3-1 pen CMS-32): hiding a nav item is not enough — a bookmarked or typed
     * hash must not render a super_admin view for a reviewer (the API already 403s). */
    var ADMIN_VIEWS = { 'users-management': 1, 'active-sessions': 1, 'system-telemetry': 1 };
    var roleNow = (state.me && state.me.role) || '';
    if (ADMIN_VIEWS[hash] && roleNow !== 'super_admin') { location.hash = '#/dashboard'; return; }

    // Detect work area automatically based on view
    for (var aKey in sitemapMatrix) {
      var grps = sitemapMatrix[aKey].groups;
      for (var i = 0; i < grps.length; i++) {
        var match = grps[i].items.some(function (it) { return it.id === hash; });
        if (match && state.currentArea !== aKey) {
          setWorkArea(aKey);
          break;
        }
      }
    }

    renderSitemapNav();
    var viewLabel = updateBreadcrumb(hash);
    document.title = 'Simal CMS (Fluent Theme) — ' + (viewLabel || 'Executive Dashboard') + ' | Content Studio';
    $('#bpf-container').style.display = 'none'; // hidden by default unless record form

    if (routes[hash]) {
      routes[hash]();
    } else {
      viewDashboard();
    }
  }

  window.addEventListener('hashchange', route);
  /* deploy-audit C10: [data-open-block] buttons appear on the editorial desk, IT solutions,
   * AMC and blocks views, but only the blocks view bound them — elsewhere "Edit Article",
   * "Edit Line" and "Edit SLA Matrix" did nothing. One delegated handler for every view. */
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-open-block]') : null;
    if (!btn) return;
    e.preventDefault();
    var pair = btn.getAttribute('data-open-block').split('||');
    location.hash = '#/block-editor?entity=' + encodeURIComponent(pair[0]) + '&id=' + encodeURIComponent(pair[1]);
  });

  function updateBreadcrumb(viewId, recordLabel) {
    var area = sitemapMatrix[state.currentArea] || sitemapMatrix.content;
    var viewLabel = viewId;
    
    // Find item label
    area.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        if (it.id === viewId) viewLabel = it.label;
      });
    });

    var html = '<a href="#/' + viewId + '">' + esc(area.title) + '</a>';
    html += '<span class="sep">/</span>';
    if (recordLabel) {
      html += '<a href="#/' + viewId + '">' + esc(viewLabel) + '</a>';
      html += '<span class="sep">/</span>';
      html += '<span class="current">' + esc(recordLabel) + '</span>';
    } else {
      html += '<span class="current">' + esc(viewLabel) + '</span>';
    }
    $('#breadcrumb').innerHTML = html;
    return viewLabel;
  }

  var _cmdBtnSeq = 0;
  function setCommandBar(actions) {
    var left = $('#cmd-left-actions');
    var right = $('#cmd-right-actions');
    if (!left || !right) return;

    function renderItem(btn) {
      if (btn.sep) {
        return '<div class="d365-cmd-sep"></div>';
      }
      // If item has no onClick, it is an informational status badge / chip (A11Y-8, CMS-1)
      if (!btn.onClick) {
        return '<span class="d365-cmd-chip"' + (btn.id ? ' id="' + esc(btn.id) + '"' : '') + '>' + (btn.icon ? ic(btn.icon, 13) + ' ' : '') + esc(btn.label) + '</span>';
      }
      if (!btn.id) {
        btn.id = 'cmd-auto-btn-' + (++_cmdBtnSeq);
      }
      var cls = 'd365-cmd-btn ' + (btn.primary ? 'btn-primary-action' : '') + (btn.danger ? 'btn-danger-action' : '');
      return '<button class="' + cls + '" id="' + btn.id + '" type="button">' + (btn.icon ? ic(btn.icon, 13) + ' ' : '') + esc(btn.label) + '</button>';
    }

    left.innerHTML = (actions.left || []).map(renderItem).join('');
    right.innerHTML = (actions.right || []).map(renderItem).join('');

    // Attach callbacks reliably
    (actions.left || []).concat(actions.right || []).forEach(function (btn) {
      if (btn.id && btn.onClick) {
        var el = document.getElementById(btn.id);
        if (el) {
          el.addEventListener('click', function (e) {
            e.preventDefault();
            btn.onClick(e);
          });
        }
      }
    });

    // Toolbar arrow key navigation
    var cmdBarEl = $('#command-bar');
    if (cmdBarEl && !cmdBarEl._arrowNavInit) {
      cmdBarEl._arrowNavInit = true;
      cmdBarEl.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var buttons = Array.prototype.slice.call(cmdBarEl.querySelectorAll('button:not([disabled])'));
          if (!buttons.length) return;
          var idx = buttons.indexOf(document.activeElement);
          if (idx !== -1) {
            e.preventDefault();
            var nextIdx = e.key === 'ArrowRight' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
            buttons[nextIdx].focus();
          }
        }
      });
    }
  }

  /* ==========================================================================
     4. View Implementations (Fluent Design Workspaces)
     ========================================================================== */

  /* View: Dashboard */
  /* ---- dashboard helpers (all values measured, none asserted) ---- */
  function fmtUptime(sec) {
    if (sec == null || isNaN(sec)) return '—';
    var d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }
  function ago(ts) {
    if (!ts) return null;
    var n = Number(ts);
    if (isNaN(n)) return null;
    return (window.UI && UI.timeAgo) ? UI.timeAgo(n) : new Date(n).toISOString();
  }
  /* Client-side reachability probe of the public SSG origin (server never
     fetches loopback; the editor's browser is the more truthful vantage). */
  function probePublicSite(url) {
    var target = url || siteUrl('/');
    var t0 = Date.now();
    return fetch(target, { mode: 'no-cors', cache: 'no-store' })
      .then(function () { state.ssgProbe = { reachable: true, latencyMs: Date.now() - t0 }; })
      .catch(function () { state.ssgProbe = { reachable: false, latencyMs: Date.now() - t0 }; })
      .then(function () { return state.ssgProbe; });
  }
  /* 8-week content-velocity micro-bars from real block updated_at values.
     Title carries the per-week counts so a single concentrated spike (e.g. a
     fresh seed import) still reads as data, not a broken chart. */
  function sparklineWeeks(blocks, weeks) {
    var W = weeks || 8;
    var now = Date.now();
    var buckets = new Array(W).fill(0);
    var max = 1;
    blocks.forEach(function (b) {
      var t = Number(b.updated_at);
      if (!t || isNaN(t)) return;
      var ageDays = (now - t) / 86400000;
      if (ageDays < 0 || ageDays >= W * 7) return;
      var idx = W - 1 - Math.floor(ageDays / 7);
      buckets[idx]++;
    });
    buckets.forEach(function (v) { if (v > max) max = v; });
    var bars = buckets.map(function (v, i) {
      var h = Math.max(3, Math.round((v / max) * 17));
      return '<rect x="' + (i * 8) + '" y="' + (20 - h) + '" width="5" height="' + h + '" rx="1" fill="currentColor" opacity="' + (v ? '0.9' : '0.35') + '"/>';
    }).join('');
    var title = 'Block edits per week, oldest → newest: ' + buckets.join(', ');
    return '<svg width="' + (W * 8) + '" height="20" viewBox="0 0 ' + (W * 8) + ' 20" role="img" aria-label="' + esc(title) + '" class="kpi3-spark"><title>' + esc(title) + '</title>' + bars + '</svg>';
  }
  function kpiCard(opts) {
    var tone = opts.tone ? ' kpi3-' + opts.tone : '';
    return '<div class="kpi3' + tone + '">' +
      '<div class="kpi3-top">' +
        '<span class="kpi3-label">' + ic(opts.icon, 14) + ' ' + esc(opts.label) + '</span>' +
        (opts.pill ? '<span class="kpi3-pill ' + (opts.pillCls || '') + '">' + opts.pill + '</span>' : '') +
      '</div>' +
      '<div class="kpi3-value" id="' + (opts.id || '') + '">' + opts.value + '</div>' +
      '<div class="kpi3-sub">' + opts.sub + '</div>' +
      '<div class="kpi3-foot">' +
        (opts.href ? '<a class="kpi3-link" href="' + opts.href + '">' + esc(opts.linkLabel || 'Open') + ' →</a>' : '<span></span>') +
        (opts.spark || '') +
      '</div>' +
    '</div>';
  }

  function viewDashboard() {
    setCommandBar({
      left: [
        { label: 'Refresh Data', icon: 'refresh', id: 'cmd-refresh', onClick: function () { refreshGlobalData().then(viewDashboard); } },
        { sep: true },
        { label: 'Push Site Build', icon: 'rocket', primary: true, id: 'cmd-publish', onClick: openPublishModal },
        { label: 'Quick Create', icon: 'plus', id: 'cmd-qc', onClick: function () { openQuickCreate(); } },
        { label: 'Audit Trail', icon: 'history', id: 'cmd-audit', onClick: function () { location.hash = '#/audit-trail'; } }
      ],
      right: [
        { label: 'Export CSV', icon: 'download', id: 'cmd-export-csv', onClick: exportBlocksCsv },
        { label: 'View Public Site', icon: 'ext', id: 'cmd-open-site', onClick: function () { window.open(siteUrl('/'), '_blank'); } }
      ]
    });

    /* ---- every metric below is computed from loaded API data; no fallbacks ---- */
    var blocksByEntity = {};
    var totalBlocks = state.blocks.length;
    state.blocks.forEach(function (b) {
      blocksByEntity[b.entity] = (blocksByEntity[b.entity] || 0) + 1;
    });

    var telem = state.telemetry || {};
    /* telemetry is super_admin-gated; other roles count from the products API
     * they ARE allowed to read (rm(10.3-1): reviewers saw a false "db error"). */
    var productCount = (telem && telem.productCount != null) ? telem.productCount
      : (Array.isArray(state.products) ? state.products.length : null);
    var insightCount = blocksByEntity.insight || 0;
    var slideCount = state.slides.length;
    var policyCount = state.policies.length;

    var now = Date.now();
    var arBlocks = state.blocks.filter(function (b) { return b.lang === 'ar'; }).length;
    var arPct = totalBlocks ? Math.round((arBlocks / totalBlocks) * 100) : null;
    var weekAgo = now - 7 * 86400000;
    var updatesThisWeek = state.blocks.filter(function (b) { return Number(b.updated_at) >= weekAgo; }).length;

    /* rm(5.1-1)/CMS-10: Last Publish derives from the LAST SUCCESSFUL BUILD (ssg_build_completed),
     * not the enqueue event. state.publishTelemetry is fetched at dashboard load; audit-derived
     * value is only a fallback when telemetry is unavailable. */
    var pt = state.publishTelemetry;
    var lastPublishTs = (pt && pt.lastPublishTs) ? pt.lastPublishTs
      : (function () { var publishEvents = state.auditLogs.filter(function (a) { return a.action === 'cms_published'; }); return publishEvents.length ? Math.max.apply(null, publishEvents.map(function (a) { return Number(a.ts); })) : null; })();
    var lastBuildFailed = !!(pt && pt.lastBuild && pt.lastBuild.status === 'failed');
    var buildsQueued = (pt && pt.queue) ? (pt.queue.queued || 0) + (pt.queue.pending || 0) : 0;
    var blocksSincePublish = state.blocks.filter(function (b) {
      return lastPublishTs == null ? true : Number(b.updated_at) > lastPublishTs;
    }).length;

    var logins7d = state.auditLogs.filter(function (a) { return a.action === 'login' && Number(a.ts) >= weekAgo; }).length;
    var failedLogins7d = state.auditLogs.filter(function (a) { return a.action === 'login_failed' && Number(a.ts) >= weekAgo; }).length;
    var inquiries7d = state.auditLogs.filter(function (a) {
      return (a.action === 'rfq_submitted' || a.action === 'contact_message') && Number(a.ts) >= weekAgo;
    }).length;
    var loadFailures = Object.keys(state.loadErrors).filter(function (k) { return state.loadErrors[k]; });

    var content = $('#content');
    content.innerHTML =
      '<!-- Compact page header (replaces marketing hero) -->' +
      '<div class="dash-pagehead">' +
        '<div>' +
          '<h1 class="dash-title">Executive Dashboard</h1>' +
          '<p class="dash-subtitle">Content operations · Simal Technologies UAE · <span id="dash-refreshed" title="' + esc(new Date(state.lastRefreshed || now).toISOString()) + '">' + (state.lastRefreshed ? 'updated ' + esc(ago(state.lastRefreshed) || '') : 'loading…') + '</span></p>' +
        '</div>' +
        '<div class="dash-pagehead-actions">' +
          '<button class="d365-cmd-btn" id="dash-btn-refresh" title="Reload all dashboard data">' + ic('refresh', 13) + ' Refresh</button>' +
          '<a class="d365-cmd-btn dash-ext-link" href="' + esc(siteUrl('/')) + '" target="_blank" rel="noopener noreferrer">' + ic('ext', 13) + ' Live Site</a>' +
        '</div>' +
      '</div>' +

      /* Honest data-state banner: any failed source or unpublished work surfaces here. */
      (function () {
        var msgs = [];
        if (loadFailures.length) msgs.push('<b>' + loadFailures.length + ' data source' + (loadFailures.length > 1 ? 's' : '') + ' failed to load</b> (' + esc(loadFailures.join(', ')) + ') — affected figures show as unavailable. Use Refresh to retry.');
        if (lastBuildFailed && !loadFailures.length) msgs.push('<b>The last site build FAILED</b> — the public site does not reflect recent edits. Retry from the Publish Pipeline.');
        else if (buildsQueued > 0 && !loadFailures.length) msgs.push(buildsQueued + ' build job(s) are queued — the public site updates when they complete.');
        else if (blocksSincePublish > 0 && !loadFailures.length) msgs.push('<b>' + blocksSincePublish + ' content edit' + (blocksSincePublish > 1 ? 's are' : ' is') + ' not on the public site</b> — last successful build ' + (lastPublishTs ? esc(ago(lastPublishTs) || '—') : 'never run') + '.');
        if (!msgs.length) return '';
        return '<div class="dash-banner dash-banner-warn" role="status">' + ic('alertTri', 15) + '<div>' + msgs.join('<br>') + '</div>' +
          '<button class="d365-cmd-btn" id="dash-banner-publish">' + ic('rocket', 12) + ' Review &amp; Publish</button></div>';
      })() +

      '<!-- 5 KPI cards — every value computed from live API data -->' +
      '<div class="kpi3-grid" role="region" aria-label="Key Performance Indicators">' +
        kpiCard({
          id: 'kpi-blocks', icon: 'grid', label: 'Content Blocks',
          value: state.loadErrors.blocks ? '<span class="kpi3-na">unavailable</span>' : totalBlocks,
          pill: updatesThisWeek ? '+' + updatesThisWeek + ' upd / 7d' : 'no edits / 7d',
          pillCls: updatesThisWeek ? 'pill-up' : 'pill-neutral',
          sub: state.loadErrors.blocks ? 'Blocks API unreachable' : 'Across ' + Object.keys(blocksByEntity).length + ' entity types · PostgreSQL',
          href: '#/blocks', linkLabel: 'Manage blocks',
          spark: state.loadErrors.blocks ? '' : sparklineWeeks(state.blocks)
        }) +
        kpiCard({
          id: 'kpi-products', icon: 'box', label: 'Hardware SKUs',
          value: productCount == null ? '<span class="kpi3-na">unavailable</span>' : productCount,
          pill: productCount == null ? 'db error' : 'live count',
          pillCls: productCount == null ? 'pill-bad' : 'pill-neutral',
          sub: 'products table · counted at page load',
          href: '#/products-catalog', linkLabel: 'Open catalog'
        }) +
        kpiCard({
          id: 'kpi-ar', icon: 'translate', label: 'AR Block Coverage',
          value: arPct == null ? '<span class="kpi3-na">n/a</span>' : arPct + '%',
          pill: arPct === 100 ? 'complete' : (totalBlocks ? arBlocks + '/' + totalBlocks + ' blocks' : 'no blocks'),
          pillCls: arPct === 100 ? 'pill-up' : 'pill-warn',
          tone: arPct === 100 ? 'ok' : 'warn',
          sub: '/ar/ pages served from SSG-baked translations',
          href: '#/loc-audit', linkLabel: 'Audit localization'
        }) +
        kpiCard({
          id: 'kpi-publish', icon: 'rocket', label: 'Last Publish',
          value: lastPublishTs ? esc(ago(lastPublishTs) || '—') : 'never',
          pill: lastBuildFailed ? 'LAST BUILD FAILED' : (buildsQueued > 0 ? buildsQueued + ' build(s) queued' : (lastPublishTs ? (blocksSincePublish > 0 ? blocksSincePublish + ' unpublished edits' : 'all published') : 'never published')),
          pillCls: lastPublishTs && blocksSincePublish === 0 ? 'pill-up' : 'pill-warn',
          tone: lastPublishTs && blocksSincePublish === 0 ? 'ok' : 'warn',
          sub: 'ADR-13 SSG purge &amp; rebuild · audit-verified timestamp',
          href: '#/publish-pipeline', linkLabel: 'Publish pipeline'
        }) +
        kpiCard({
          id: 'kpi-signin', icon: 'shield', label: 'Sign-ins · 7 days',
          value: logins7d + ' ok',
          pill: failedLogins7d ? failedLogins7d + ' failed' : '0 failed',
          pillCls: failedLogins7d > 5 ? 'pill-bad' : (failedLogins7d ? 'pill-warn' : 'pill-up'),
          tone: failedLogins7d > 5 ? 'bad' : 'neutral',
          sub: failedLogins7d > 5 ? 'Elevated failed attempts — review audit log' : 'From immutable audit ledger (' + state.auditLogs.length + ' events total)',
          href: '#/audit-trail', linkLabel: 'Audit trail'
        }) +
      '</div>' +

      '<!-- Needs Attention + System Health -->' +
      '<div class="dash-duo mb-4">' +
        '<div class="d365-card dash-attn-card">' +
          '<div class="d365-card-header">' +
            '<h2 class="dash-h2">' + ic('bolt', 15) + ' Needs Attention</h2>' +
            '<span class="dash-card-note" id="attn-count"></span>' +
          '</div>' +
          '<div class="d365-card-body dash-attn-body" id="dash-attn-list">' + buildAttentionList() + '</div>' +
        '</div>' +

        '<div class="d365-card dash-health-card">' +
          '<div class="d365-card-header">' +
            '<h2 class="dash-h2">' + ic('server', 15) + ' System Health</h2>' +
            '<span class="dash-card-note">measured at last refresh</span>' +
          '</div>' +
          '<div class="d365-card-body dash-health-body" id="dash-health-list">' + buildHealthList() + '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Public Website Digital Footprint Matrix -->' +
      '<div class="d365-card mb-4">' +
        '<div class="d365-card-header">' +
          '<div>' +
            '<h2 class="dash-h2">' + ic('globe', 15) + ' Public Website Footprint</h2>' +
            '<div class="dash-card-note">Cross-links into the live SSG site for spot verification · reachability shown in System Health</div>' +
          '</div>' +
          '<a href="' + esc(siteUrl('/')) + '" target="_blank" rel="noopener noreferrer" class="dash-ext-link d365-cmd-btn">' + ic('ext', 12) + ' Open Homepage</a>' +
        '</div>' +
        '<div class="d365-card-body">' +
          '<div class="d365-footprint-grid">' +
            '<a href="' + esc(siteUrl('/products/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('cart', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">Hardware Catalog' + (productCount != null ? ' · ' + productCount + ' SKUs' : '') + '</div>' +
                  '<div class="d365-footprint-sub">Crucial, KOORUI, AIWA, Honeywell, UGREEN</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
            '<a href="' + esc(siteUrl('/solutions/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('bolt', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">IT Solutions · ' + (blocksByEntity.it_solution || 0) + ' lines</div>' +
                  '<div class="d365-footprint-sub">Enterprise storage, cloud, security, AMC</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
            '<a href="' + esc(siteUrl('/software/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('box', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">Software Suites · ' + ((blocksByEntity.software_product || 0) + (blocksByEntity.software_solution || 0) + (blocksByEntity.software_service || 0)) + ' blocks</div>' +
                  '<div class="d365-footprint-sub">UniERP, UniVAT, UniPOS, UniSales</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
            '<a href="' + esc(siteUrl('/insights/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('doc', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">Research &amp; Insights · ' + insightCount + ' articles</div>' +
                  '<div class="d365-footprint-sub">AI in ERP, cloud, security briefs</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
            '<a href="' + esc(siteUrl('/legal/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('gavel', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">Legal &amp; Compliance · ' + policyCount + ' policies</div>' +
                  '<div class="d365-footprint-sub">Privacy, terms, PDPL clauses</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
            '<a href="' + esc(siteUrl('/ar/')) + '" target="_blank" rel="noopener noreferrer" class="d365-footprint-item">' +
              '<div class="d365-footprint-left">' + ic('translate', 17) +
                '<div>' +
                  '<div class="d365-footprint-title">Arabic RTL Portal</div>' +
                  '<div class="d365-footprint-sub">SSG-baked mirror · ' + arBlocks + ' AR blocks in CMS</div>' +
                '</div>' +
              '</div>' + ic('ext', 13) +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Multi-Stream Grid: Distribution Architecture & Audit Feed -->' +
      '<div class="d365-stream-grid mb-4">' +
        '<!-- Left Stream: Entity Distribution Architecture -->' +
        '<div class="d365-card">' +
          '<div class="d365-card-header">' +
            '<div>' +
              '<h3 class="dash-h2">' + ic('grid', 15) + ' Entity Distribution</h3>' +
              '<span class="dash-card-note">' + (state.loadErrors.blocks ? 'blocks unavailable' : totalBlocks + ' blocks · bar scaled to largest entity') + '</span>' +
            '</div>' +
            '<input type="text" id="dash-entity-search" placeholder="Filter entities…" aria-label="Filter entity distribution" class="dash-inline-input">' +
          '</div>' +
          '<div class="d365-card-body" id="dash-entity-list" style="display:flex;flex-direction:column;gap:8px">' +
            renderEntityDistribution(blocksByEntity, totalBlocks, '', true) +
          '</div>' +
        '</div>' +

        '<!-- Right Stream: Recent Security & Content Audit Mutations -->' +
        '<div class="d365-card">' +
          '<div class="d365-card-header">' +
            '<div>' +
              '<h3 class="dash-h2">' + ic('history', 15) + ' Recent Activity</h3>' +
              '<span class="dash-card-note">' + (state.loadErrors.audit ? 'audit unavailable' : state.auditLogs.length + ' events · PostgreSQL ledger') + '</span>' +
            '</div>' +
            '<a href="#/audit-trail" class="dash-inline-link">View all →</a>' +
          '</div>' +
          '<div class="d365-card-body" style="padding:0">' +
            '<table class="d365-table">' +
              '<thead>' +
                '<tr><th>Event / Target</th><th style="text-align:right">Actor &amp; Time</th></tr>' +
              '</thead>' +
              '<tbody>' +
                state.auditLogs.slice(0, 8).map(function (a) {
                  var act = (a.action || '').toLowerCase();
                  var badgeCls = 'audit-badge';
                  if (act.indexOf('auth') !== -1 || act.indexOf('login') !== -1) badgeCls += act.indexOf('failed') !== -1 ? ' policy' : ' auth';
                  else if (act.indexOf('block') !== -1 || act.indexOf('update') !== -1 || act.indexOf('edit') !== -1) badgeCls += ' block';
                  else if (act.indexOf('slide') !== -1) badgeCls += ' slide';
                  else if (act.indexOf('publish') !== -1) badgeCls += ' publish';
                  else if (act.indexOf('policy') !== -1) badgeCls += ' policy';

                  return '<tr>' +
                    '<td style="font-size:11.5px;padding:8px 12px">' +
                      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">' +
                        '<span class="' + badgeCls + '">' + esc(a.action) + '</span>' +
                        '<span style="font-weight:600;color:var(--d365-navy)">' + esc(a.target || '') + '</span>' +
                      '</div>' +
                      '<div style="font-size:11px;color:#64748B">' + esc(a.details || '') + '</div>' +
                    '</td>' +
                    '<td style="font-size:11px;color:#64748B;text-align:right;padding:8px 12px;overflow-wrap:anywhere">' +
                      '<div style="font-weight:600;color:#334155">' + esc(a.actor || 'system') + '</div>' +
                      '<div>' + esc(ago(a.ts) || formatDate(a.ts)) + '</div>' +
                    '</td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
              '<tfoot><tr><td colspan="2" style="padding:8px 12px;font-size:11px;color:var(--d365-text-muted);border-top:1px solid var(--d365-border-subtle)">Showing latest 8 of ' + state.auditLogs.length + ' events · <a class="dash-inline-link" href="#/audit-trail">view full ledger →</a></td></tr></tfoot>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Operational Rapid Launchpad -->' +
      '<div class="d365-card mb-4">' +
        '<div class="d365-card-header">' +
          '<h3 class="dash-h2">' + ic('bolt', 15) + ' Quick Actions</h3>' +
          '<span class="dash-card-note">counts update live from the API</span>' +
        '</div>' +
        '<div class="d365-card-body">' +
          '<div class="d365-launchpad-grid">' +
            '<button class="d365-launchpad-btn" id="lp-btn-article">' + ic('docNew', 19) +
              '<div><div>New Research Article</div><small>' + insightCount + ' published</small></div>' +
            '</button>' +
            '<button class="d365-launchpad-btn" id="lp-btn-slide">' + ic('image', 19) +
              '<div><div>New Hero Banner</div><small>' + slideCount + ' slides live</small></div>' +
            '</button>' +
            '<button class="d365-launchpad-btn" id="lp-btn-products">' + ic('cart', 19) +
              '<div><div>Hardware Catalog</div><small>' + (productCount != null ? productCount + ' SKUs' : 'unavailable') + '</small></div>' +
            '</button>' +
            '<button class="d365-launchpad-btn" id="lp-btn-audit">' + ic('history', 19) +
              '<div><div>Audit Trail</div><small>' + state.auditLogs.length + ' events</small></div>' +
            '</button>' +
            '<button class="d365-launchpad-btn" id="lp-btn-users">' + ic('users', 19) +
              '<div><div>Staff &amp; RBAC</div><small>' + state.users.length + ' accounts</small></div>' +
            '</button>' +
            '<button class="d365-launchpad-btn" id="lp-btn-publish" style="border-color:#006CBE;background:#F0F9FF">' + ic('rocket', 19) +
              '<div><div style="color:#006CBE">Trigger Site Build</div><small>' + (lastPublishTs ? 'last publish ' + esc(ago(lastPublishTs) || '—') : 'never published') + '</small></div>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* ---- inner builders (hoisted; read the computed metrics above) ---- */
    function buildAttentionList() {
      var items = [];
      if (loadFailures.length) {
        items.push({ tone: 'bad', icon: 'alertTri', title: loadFailures.length + ' data source' + (loadFailures.length > 1 ? 's' : '') + ' failed to load',
          meta: 'Affected figures show as unavailable. Sources: ' + loadFailures.join(', ') + '.', action: 'Refresh', id: 'attn-refresh' });
      }
      if (arPct !== null && arPct < 100) {
        items.push({ tone: 'warn', icon: 'translate', title: 'Arabic block coverage at ' + arPct + '% (' + arBlocks + ' of ' + totalBlocks + ')',
          meta: 'Public /ar/ pages are served from SSG-baked translations. Authoring AR blocks brings localization under CMS governance.', href: '#/loc-audit', action: 'Audit localization' });
      }
      if (blocksSincePublish > 0) {
        items.push({ tone: 'warn', icon: 'rocket', title: blocksSincePublish + ' content edit' + (blocksSincePublish > 1 ? 's' : '') + ' not yet published',
          meta: 'Last publish ' + (lastPublishTs ? ago(lastPublishTs) : 'has never run') + '. The public site may lag the CMS.', href: '#/publish-pipeline', action: 'Review pipeline' });
      }
      if (failedLogins7d > 5) {
        items.push({ tone: 'bad', icon: 'shield', title: failedLogins7d + ' failed sign-in attempts in 7 days',
          meta: 'Against ' + logins7d + ' successful sign-ins. Verify these attempts in the audit ledger.', href: '#/audit-trail', action: 'Inspect audit trail' });
      }
      if (inquiries7d > 0) {
        items.push({ tone: 'info', icon: 'inbox', title: inquiries7d + ' new partner inquir' + (inquiries7d > 1 ? 'ies' : 'y') + ' (RFQ / contact)',
          meta: 'Received in the last 7 days and awaiting the commercial team.', href: 'admin.html', action: 'Open KYC console' });
      }
      if (!items.length) {
        return '<div class="attn-clear">' + ic('check', 15) + ' All clear — no items need attention right now.</div>';
      }
      return items.map(function (it) {
        var act = it.href
          ? '<a class="attn-act" href="' + it.href + '"' + (it.href.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(it.action) + ' →</a>'
          : '<button class="attn-act" id="' + (it.id || '') + '">' + esc(it.action) + '</button>';
        return '<div class="attn-item attn-' + it.tone + '">' +
          '<span class="attn-ic">' + ic(it.icon, 15) + '</span>' +
          '<div class="attn-body"><div class="attn-title">' + esc(it.title) + '</div><div class="attn-meta">' + esc(it.meta) + '</div></div>' +
          act +
        '</div>';
      }).join('');
    }

    function buildHealthList() {
    if (!isSuperAdmin() && !state.telemetry) {
      return '<div class="small muted" style="padding:8px 0">System health metrics are available to super administrators.</div>';
    }
      var db = telem.database || {};
      var gw = telem.gateway || {};
      var items = [];
      items.push({
        icon: 'db', name: 'PostgreSQL',
        ok: db.status === 'healthy',
        label: db.status === 'healthy' ? 'Operational' : 'Unreachable',
        meta: db.status === 'healthy'
          ? 'engine ' + esc(db.engine || 'postgresql') + ' · count query ' + (db.latencyMs != null ? db.latencyMs + ' ms' : 'n/a') + (productCount != null ? ' · ' + productCount + ' products counted' : '')
          : 'count query failed at last refresh'
      });
      items.push({
        icon: 'server', name: 'API Gateway',
        ok: true, /* this dashboard reached the gateway to render at all */
        label: 'Operational',
        meta: 'uptime ' + fmtUptime(gw.uptime) + (state.lastRefreshed ? ' · page data loaded ' + ago(state.lastRefreshed) : '')
      });
      var ssg = state.ssgProbe;
      items.push({
        icon: 'globe', name: 'Public Site (SSG)',
        ok: ssg ? ssg.reachable : null,
        label: ssg ? (ssg.reachable ? 'Operational' : 'Unreachable') : 'Probing…',
        meta: ssg ? ('browser probe ' + ssg.latencyMs + ' ms · ' + siteUrl('').replace(/^https?:\/\//, '')) : 'reachability test running',
        id: 'health-ssg'
      });
      var nOk = items.filter(function (i) { return i.ok === true; }).length;
      var nBad = items.filter(function (i) { return i.ok === false; }).length;
      return items.map(function (i) {
        var cls = i.ok === true ? 'ok' : (i.ok === false ? 'bad' : 'pending');
        return '<div class="healthv2-item ' + cls + '" id="' + (i.id || '') + '">' +
          '<span class="healthv2-ic">' + ic(i.icon, 15) + '</span>' +
          '<div class="healthv2-body"><span class="healthv2-name">' + esc(i.name) + '</span>' +
          '<span class="healthv2-meta">' + esc(i.meta) + '</span></div>' +
          '<span class="healthv2-state">' + esc(i.label) + '</span>' +
        '</div>';
      }).join('') + '<div class="healthv2-summary" data-ok="' + nOk + '" data-bad="' + nBad + '" id="dash-health-summary"></div>';
    }

    /* ---- wiring ---- */
    $('#dash-btn-publish')?.addEventListener('click', openPublishModal);
    $('#dash-btn-qc')?.addEventListener('click', function () { openQuickCreate(); });
    $('#dash-btn-refresh')?.addEventListener('click', function () {
      refreshGlobalData().then(function () { probePublicSite(telem.publicSiteUrl).then(viewDashboard); });
    });
    $('#dash-banner-publish')?.addEventListener('click', openPublishModal);
    $('#attn-refresh')?.addEventListener('click', function () {
      refreshGlobalData().then(function () { probePublicSite(telem.publicSiteUrl).then(viewDashboard); });
    });

    var attnCount = $('#attn-count');
    if (attnCount) {
      var nAttn = document.querySelectorAll('#dash-attn-list .attn-item').length;
      attnCount.textContent = nAttn ? nAttn + ' item' + (nAttn > 1 ? 's' : '') : 'all clear';
    }

    $('#lp-btn-article')?.addEventListener('click', function () { openQuickCreate('insight'); });
    $('#lp-btn-slide')?.addEventListener('click', function () { openQuickCreate('slide'); });
    $('#lp-btn-products')?.addEventListener('click', function () { location.hash = '#/products-catalog'; });
    $('#lp-btn-audit')?.addEventListener('click', function () { location.hash = '#/audit-trail'; });
    $('#lp-btn-users')?.addEventListener('click', function () { location.hash = '#/users-management'; });
    $('#lp-btn-publish')?.addEventListener('click', openPublishModal);

    var searchInput = $('#dash-entity-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim();
        var list = $('#dash-entity-list');
        if (list) list.innerHTML = renderEntityDistribution(blocksByEntity, totalBlocks, q);
      });
    }

    /* Client-side SSG reachability probe — updates the health list in place. */
    if (!state.ssgProbe || Date.now() - (state.ssgProbe.at || 0) > 60000) {
      probePublicSite(telem.publicSiteUrl).then(function () {
        state.ssgProbe.at = Date.now();
        var ssgEl = document.querySelector('#health-ssg');
        if (ssgEl) {
          var p = state.ssgProbe;
          ssgEl.className = 'healthv2-item ' + (p.reachable ? 'ok' : 'bad');
          ssgEl.querySelector('.healthv2-state').textContent = p.reachable ? 'Operational' : 'Unreachable';
          ssgEl.querySelector('.healthv2-meta').textContent = 'browser probe ' + p.latencyMs + ' ms · ' + siteUrl('').replace(/^https?:\/\//, '');
        }
      });
    }
  }

  function renderEntityDistribution(blocksByEntity, totalBlocks, query, topMode) {
    var keys = Object.keys(blocksByEntity);
    if (!keys.length) {
      /* Never fabricate an entity list: empty means the blocks API failed or DB is empty. */
      return '<div style="padding:16px;text-align:center;color:var(--d365-text-muted);font-size:12px">' +
        'No block data — the blocks API returned an empty list. Use Refresh to retry.</div>';
    }
    keys.sort(function (a, b) { return blocksByEntity[b] - blocksByEntity[a]; });
    if (query) {
      keys = keys.filter(function (k) { return k.toLowerCase().indexOf(query.toLowerCase()) !== -1; });
    }
    if (!keys.length) {
      return '<div style="padding:16px;text-align:center;color:var(--d365-text-muted);font-size:12px">No entities match "' + esc(query) + '"</div>';
    }
    var TOP_N = 7;
    var hidden = 0;
    if (topMode && !query && keys.length > TOP_N) {
      hidden = keys.length - TOP_N;
      keys = keys.slice(0, TOP_N);
    }
    var total = totalBlocks || 1;
    var maxCount = blocksByEntity[keys[0]] || 1;
    var html = keys.map(function (ent) {
      var count = blocksByEntity[ent] || 0;
      var pct = Math.min(100, Math.round((count / total) * 100));
      var barPct = Math.max(3, Math.round((count / maxCount) * 100));
      return '<div class="d365-dist-item">' +
        '<div class="d365-dist-top">' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<span class="entity-tag">' + esc(ent) + '</span>' +
            '<span class="d365-dist-name" style="font-size:11.5px">' + esc(ent.replace(/_/g, ' ').toUpperCase()) + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span class="d365-dist-count">' + count + ' (' + pct + '%)</span>' +
            '<a href="#/blocks?entity=' + encodeURIComponent(ent) + '" class="d365-cmd-btn" style="font-size:10.5px;padding:2px 6px">Open →</a>' +
          '</div>' +
        '</div>' +
        '<div class="d365-dist-bar-track" aria-hidden="true">' +
          '<div class="d365-dist-bar-fill" style="width:' + barPct + '%"></div>' +
        '</div>' +
      '</div>';
    }).join('');
    if (hidden > 0) {
      html += '<a href="#/blocks" class="dash-more-row">+ ' + hidden + ' more entit' + (hidden > 1 ? 'ies' : 'y') + ' — open block explorer →</a>';
    }
    return html;
  }

  /* View: Editorial Desk Workspace */
  function viewEditorialWorkspace() {
    setCommandBar({
      left: [
        { label: 'New Article', icon: '＋', primary: true, onClick: function () { openQuickCreate('insight'); } },
        { label: 'Refresh Desk', icon: '↻', onClick: function () { refreshGlobalData().then(viewEditorialWorkspace); } }
      ],
      right: [
        { label: 'Filter: All Articles', icon: '🔍' }
      ]
    });

    var articles = state.blocks.filter(function (b) { return b.entity === 'insight'; });
    var content = $('#content');

    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:16px 20px;background:#F8FAFC;border-left:4px solid var(--d365-primary)">' +
        '<h2 style="font-size:18px;margin:0 0 6px;color:var(--d365-navy)">Editorial Desk & Research Publishing Queue</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Manage the 14 comprehensive thought leadership articles with sticky TOC sidebars, author attribution, reading time metrics, and public SEO metadata.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead>' +
            '<tr><th>Slug / Id</th><th>Article Title</th><th>Category</th><th>Author</th><th>Date</th><th>Actions</th></tr>' +
          '</thead>' +
          '<tbody>' +
            articles.map(function (b) {
              var p = b.payload || {};
              return '<tr>' +
                '<td style="font-family:monospace;font-weight:600">' + esc(b.entity_id) + '</td>' +
                '<td><b>' + esc(p.t || p.title || 'Untitled') + '</b><br><span style="font-size:11px;color:#64748B">' + esc(String(p.x || '').slice(0, 90)) + '…</span></td>' +
                '<td><span class="entity-tag" style="background:#EFF6FC;color:#006CBE">' + esc(p.cat || 'Insights') + '</span></td>' +
                '<td>' + esc(p.author || p.au || 'Simal Editorial') + '</td>' + // deploy-audit C9: insights store author
                '<td>' + esc(p.at || '2026') + '</td>' +
                '<td><button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-open-block="insight||' + esc(b.entity_id) + '">Edit Article ➔</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

    attachBlockOpenEvents();
  }

  /* View: Hero Carousel & Banners Studio */
  function viewHeroSlides() {
    setCommandBar({
      left: [
        { label: 'Save All Slides', icon: '💾', primary: true, onClick: function () { state.slides.forEach(function (s) { saveSingleSlide(s.idx); }); } },
        { label: 'Add New Slide', icon: '＋', onClick: function () { openQuickCreate('slide'); } },
        { sep: true },
        { label: 'Push Live', icon: '🚀', onClick: openPublishModal }
      ],
      right: [
        { label: 'Preview Simulation 👁️', onClick: function () { $('#slide-simulator-card')?.scrollIntoView({ behavior: 'smooth' }); } }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" id="slide-simulator-card" style="padding:20px;background:#0B1F38;color:#FFFFFF;border-radius:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
          '<span style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:#94A3B8;text-transform:uppercase">Homepage Hero Live Preview Simulation</span>' +
          '<span style="font-size:11px;background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:999px">5 Active Slides Rotating</span>' +
        '</div>' +
        '<div id="hero-sim-screen" style="border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:32px;background:linear-gradient(135deg, #0A192F 0%, #172A45 60%, #1F3A60 100%);min-height:200px;display:flex;flex-direction:column;justify-content:center">' +
          '<div id="sim-kick" style="font-size:12px;font-weight:700;letter-spacing:0.12em;color:#F59E0B;text-transform:uppercase;margin-bottom:6px">PCIe Gen5 SSD Leadership · Dubai Hub</div>' +
          '<div id="sim-headline" style="font-size:24px;font-weight:700;color:#FFFFFF;margin-bottom:8px">The Gen5 Era is Here. Breakthrough 14,500 MB/s.</div>' +
          '<div id="sim-sub" style="font-size:13.5px;color:#CBD5E1;max-width:700px;margin-bottom:16px">Crucial T705 and P510 Gen5 NVMe SSDs engineered with Micron 232-layer 3D TLC NAND.</div>' +
          '<div><button id="sim-cta" class="d365-cmd-btn btn-primary-action" style="background:#F59E0B;color:#0B1F38;border:none;font-weight:700;padding:8px 18px">Explore Gen5 SSDs →</button></div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px" id="slide-cards-grid">' +
        state.slides.map(function (s) {
          return '<div class="d365-card slide-card-item" data-slide-idx="' + s.idx + '" style="padding:18px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #E2E8F0;padding-bottom:8px">' +
              '<b style="color:var(--d365-navy);font-size:14px">Slide #' + s.idx + '</b>' +
              '<label style="font-size:12px;display:flex;align-items:center;gap:6px">' +
                '<input type="checkbox" class="s-active" ' + (s.active !== false ? 'checked' : '') + ' style="width:auto"> Active' +
              '</label>' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Kicker / Smallcaps</label>' +
              '<input type="text" class="s-kick" value="' + esc(s.kick || '') + '">' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Headline <span class="req">*</span></label>' +
              '<input type="text" class="s-headline" value="' + esc(s.headline || '') + '">' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Subtitle Overview</label>' +
              '<textarea class="s-sub" rows="2">' + esc(s.sub || '') + '</textarea>' +
            '</div>' +
            '<div class="d365-field-row">' +
              '<div class="d365-form-field">' +
                '<label>CTA Button Label</label>' +
                '<input type="text" class="s-cta-label" value="' + esc(s.cta_label || '') + '">' +
              '</div>' +
              '<div class="d365-form-field">' +
                '<label>CTA Target URL</label>' +
                '<input type="text" class="s-cta-href" value="' + esc(s.cta_href || '') + '">' +
              '</div>' +
            '</div>' +
            '<div class="d365-field-row">' +
              '<div class="d365-form-field">' +
                '<label>Photo Asset Slug</label>' +
                '<input type="text" class="s-photo" value="' + esc(s.photo_slug || '') + '" placeholder="e.g. crucial-t705-ssd-2">' +
              '</div>' +
              '<div class="d365-form-field">' +
                '<label>SVG Motif Preset</label>' +
                '<select class="s-motif">' +
                  '<option value="grid"' + (s.motif === 'grid' ? ' selected' : '') + '>Geometric Grid</option>' +
                  '<option value="arcs"' + (s.motif === 'arcs' ? ' selected' : '') + '>Concentric Arcs</option>' +
                  '<option value="dots"' + (s.motif === 'dots' ? ' selected' : '') + '>Gold Dot-Matrix</option>' +
                  '<option value="rings"' + (s.motif === 'rings' ? ' selected' : '') + '>Precision Rings</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Background Styling / Gradient / Asset</label>' +
              '<input type="text" class="s-bg" value="' + esc(s.bg || '') + '" placeholder="empty, /assets/img/x.webp, #0B1F38, or linear-gradient(...)">' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid #F1F5F9">' +
              '<button class="d365-cmd-btn btn-primary-action" style="font-size:12px" data-save-slide="' + s.idx + '">Save Slide ' + s.idx + ' 💾</button>' +
              '<button class="d365-cmd-btn" style="font-size:11px" data-sim-slide="' + s.idx + '">Test in Sim 👁️</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    // Hook slide actions
    $$('[data-save-slide]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = btn.getAttribute('data-save-slide');
        saveSingleSlide(idx);
      });
    });

    $$('[data-sim-slide]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = btn.getAttribute('data-sim-slide');
        var card = $('.slide-card-item[data-slide-idx="' + idx + '"]');
        if (!card) return;
        $('#sim-kick').textContent = card.querySelector('.s-kick').value;
        $('#sim-headline').textContent = card.querySelector('.s-headline').value;
        $('#sim-sub').textContent = card.querySelector('.s-sub').value;
        $('#sim-cta').textContent = card.querySelector('.s-cta-label').value + ' →';
        $('#slide-simulator-card').scrollIntoView({ behavior: 'smooth' });
      });
    });

    $('#cmd-save-slides')?.addEventListener('click', function () {
      state.slides.forEach(function (s) { saveSingleSlide(s.idx); });
    });
  }

  function saveSingleSlide(idx) {
    var card = $('.slide-card-item[data-slide-idx="' + idx + '"]');
    if (!card) return;
    var s = (state.slides || []).find(function (it) { return it.idx === parseInt(idx, 10); }) || {};
    var bgVal = (card.querySelector('.s-bg')?.value || '').trim();
    var body = {
      idx: parseInt(idx, 10),
      kick: card.querySelector('.s-kick').value,
      headline: card.querySelector('.s-headline').value,
      sub: card.querySelector('.s-sub').value,
      cta_label: card.querySelector('.s-cta-label').value,
      cta_href: card.querySelector('.s-cta-href').value,
      photo_slug: card.querySelector('.s-photo').value,
      motif: card.querySelector('.s-motif').value,
      bg: bgVal || s.bg || '',
      active: card.querySelector('.s-active').checked
    };

    API.put('/api/cms/slides/' + idx, body).then(function () {
      toast('Slide #' + idx + ' saved with revision snapshot', 'success');
      refreshGlobalData();
    }).catch(function (e) {
      toast('Save failed: ' + (e.message || e), 'error');
    });
  }

  /* View: Media & Photo Asset Library */
  function viewMediaLibrary() {
    var mediaList = state.media && state.media.length ? state.media : [];
    var brands = ['all'];
    mediaList.forEach(function (m) {
      if (m.brand && brands.indexOf(m.brand) === -1) brands.push(m.brand);
    });

    setCommandBar({
      left: [
        { label: 'Upload Asset', icon: 'upload', primary: true, onClick: openMediaUploadModal },
        { label: 'Refresh Gallery', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewMediaLibrary); } }
      ],
      right: [
        { label: mediaList.length + ' Product Photographs · ' + (brands.length - 1) + ' Brands' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Media & Product Photography Asset Studio</h2>' +
            '<p style="font-size:12.5px;color:#64748B;margin:0">Verified product photographs and high-res brand lockups indexed directly from the asset repository.</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
            '<button class="d365-cmd-btn btn-primary-action" id="btn-open-media-modal">＋ Upload Image</button>' +
            '<input type="search" id="media-search" placeholder="Filter by asset name or SKU…" class="dash-inline-input" style="width:230px" aria-label="Filter Media Assets">' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap" id="media-brand-filters">' +
              brands.slice(0, 8).map(function (b) {
                return '<button class="d365-filter-pill ' + (b === 'all' ? 'active' : '') + '" data-filter-brand="' + esc(b) + '">' + (b === 'all' ? 'All Brands (' + mediaList.length + ')' : esc(b)) + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px" id="media-grid"></div>';

    var currentBrand = 'all';
    var currentQuery = '';

    function renderCards() {
      var grid = $('#media-grid');
      if (!grid) return;
      var filtered = mediaList.filter(function (m) {
        var matchBrand = (currentBrand === 'all' || m.brand.toLowerCase() === currentBrand.toLowerCase());
        var matchQuery = (!currentQuery || (m.name && m.name.toLowerCase().indexOf(currentQuery) !== -1) || (m.file && m.file.toLowerCase().indexOf(currentQuery) !== -1));
        return matchBrand && matchQuery;
      });

      if (!filtered.length) {
        grid.innerHTML = '<div class="d365-card" style="grid-column:1/-1;padding:36px;text-align:center;color:#64748B">No media assets match the current filter criteria.</div>';
        return;
      }

      grid.innerHTML = filtered.map(function (m) {
        return '<div class="d365-card" style="padding:14px;display:flex;flex-direction:column;justify-content:space-between">' +
          '<div>' +
            '<div style="height:150px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:10px">' +
              '<img src="' + esc('/api/cms/media/file/' + m.file) + '" alt="' + esc(m.name) + '" style="max-height:130px;max-width:90%;object-fit:contain" onerror="this.onerror=null;this.src=\'assets/img/favicon.png\'">' +
            '</div>' +
            '<span class="entity-tag" style="background:#EFF6FC;color:#006CBE;margin-bottom:6px">' + esc(m.brand || 'Hardware') + ' · ' + esc(m.cat || 'SKU') + '</span>' +
            '<div style="font-size:13px;font-weight:600;color:var(--d365-navy);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(m.name) + '">' + esc(m.name) + '</div>' +
            '<div style="font-size:11px;color:#64748B;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(m.file) + '">' + esc(m.file) + '</div>' +
          '</div>' +
          '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #F1F5F9;display:flex;gap:6px;flex-wrap:wrap">' +
            '<button class="d365-cmd-btn" style="flex:1;font-size:11.5px" data-copy-asset="' + esc(m.url || ('assets/img/products/' + m.file)) + '">Copy 📋</button>' +
            (m.slug ? '<button class="d365-cmd-btn btn-primary-action" style="font-size:11.5px" data-open-product-slug="' + esc(m.slug) + '">Edit ✏️</button>' : '') +
            '<button class="d365-cmd-btn btn-danger-action" style="font-size:11.5px" data-delete-media="' + esc(m.file) + '">Delete 🗑️</button>' +
          '</div>' +
        '</div>';
      }).join('');

      grid.querySelectorAll('[data-copy-asset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var path = btn.getAttribute('data-copy-asset');
          navigator.clipboard.writeText(path).then(function () {
            toast('Copied asset path: ' + path, 'info');
          });
        });
      });

      grid.querySelectorAll('[data-open-product-slug]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-open-product-slug');
          openProductEditModal(slug);
        });
      });

      grid.querySelectorAll('[data-delete-media]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var file = btn.getAttribute('data-delete-media');
          if (!confirm('Are you sure you want to delete media file "' + file + '"? This action cannot be undone.')) return;
          API.delete('/api/cms/media/' + encodeURIComponent(file)).then(function () {
            toast('Media file "' + file + '" deleted successfully', 'success');
            refreshGlobalData().then(viewMediaLibrary);
          }).catch(function (err) {
            toast('Delete failed: ' + (err.message || err), 'error');
          });
        });
      });
    }

    $('#btn-open-media-modal')?.addEventListener('click', openMediaUploadModal);

    renderCards();

    $('#media-search')?.addEventListener('input', function () {
      currentQuery = this.value.trim().toLowerCase();
      renderCards();
    });

    $$('#media-brand-filters [data-filter-brand]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#media-brand-filters [data-filter-brand]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentBrand = btn.getAttribute('data-filter-brand');
        renderCards();
      });
    });
  }

  function openMediaUploadModal() {
    var modal = $('#modal-media-upload');
    if (!modal) return;
    var fileInp = $('#media-file-input');
    if (fileInp) fileInp.value = '';
    var customInp = $('#media-custom-filename');
    if (customInp) customInp.value = '';
    var previewCont = $('#media-preview-container');
    if (previewCont) previewCont.style.display = 'none';
    trapFocus(modal);
  }

  function hookMediaFileInput() {
    var fileInp = $('#media-file-input');
    fileInp?.addEventListener('change', function () {
      var file = fileInp.files && fileInp.files[0];
      if (!file) return;
      var customInp = $('#media-custom-filename');
      if (customInp && !customInp.value) customInp.value = file.name;
      var previewCont = $('#media-preview-container');
      var previewImg = $('#media-upload-preview');
      var previewMeta = $('#media-preview-meta');
      if (file.type && file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
          if (previewMeta) previewMeta.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
          if (previewCont) previewCont.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function handleMediaUploadSubmit() {
    var fileInp = $('#media-file-input');
    var file = fileInp && fileInp.files && fileInp.files[0];
    if (!file) return toast('Please select an image file to upload', 'warn');

    var customName = ($('#media-custom-filename')?.value || '').trim() || file.name;
    var btn = $('#btn-media-upload-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading Asset…'; }

    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      var base64 = dataUrl.split(',')[1];
      API.post('/api/cms/media/upload', {
        filename: customName,
        dataBase64: base64
      }).then(function (res) {
        toast('Media asset "' + res.filename + '" uploaded successfully!', 'success');
        closeModals();
        refreshGlobalData().then(function () {
          if (state.currentView === 'media-library' || state.currentView === 'media') {
            viewMediaLibrary();
          }
        });
      }).catch(function (err) {
        toast('Upload failed: ' + (err.message || err), 'error');
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Upload & Register Asset'; }
      });
    };
    reader.readAsDataURL(file);
  }

  /* View: Dedicated Block Form Studio Route (#/block-editor?entity=...&id=...) */
  /* rm(4.1): site chrome editors — pre-targeted block editor views for nav/footer/newsletter */
  /* rm(4.5-2): category taxonomy editor */
  function viewCategories() {
    setCommandBar({
      left: [
        { label: 'Refresh', icon: '🔄', onClick: function () { viewCategories(); } },
        { label: 'Push Live', icon: '🚀', onClick: openPublishModal }
      ],
      right: [{ label: 'Category Taxonomy' }]
    });
    updateBreadcrumb('categories');
    var c = $('#content');
    c.innerHTML = '<div class="d365-card" style="padding:18px 24px"><h2 style="margin:0 0 6px">Product Category Taxonomy</h2>' +
      '<p style="color:#64748B;font-size:13px;margin:0 0 14px">Renames rewrite every product row (cat + display label) in one guarded transaction. Site reflects changes on the next publish.</p>' +
      '<div id="cat-rows">Loading…</div></div>';
    API.get('/api/cms/categories').then(function (r) {
      var rows = (r.categories || []);
      $('#cat-rows').innerHTML = rows.length ? '<table class="d365-table"><thead><tr><th>Slug</th><th>Label</th><th>Products</th><th></th></tr></thead><tbody>' +
        rows.map(function (x) {
          return '<tr><td><code>' + esc(x.cat) + '</code></td><td>' + esc(x.label) + '</td><td>' + x.count + '</td>' +
            '<td><button class="d365-cmd-btn" data-cat="' + esc(x.cat) + '" data-label="' + esc(x.label) + '">Rename…</button></td></tr>';
        }).join('') + '</tbody></table>' : '<p>No categories.</p>';
      $('#cat-rows').querySelectorAll('button[data-cat]').forEach(function (b) {
        b.addEventListener('click', function () {
          var cat = b.getAttribute('data-cat');
          var nl = window.prompt('New label for "' + cat + '" (slug auto-derives):', b.getAttribute('data-label'));
          if (!nl) return;
          API.post('/api/cms/categories/' + encodeURIComponent(cat) + '/rename', { cat_label: nl }).then(function () {
            toast('Category renamed: ' + cat + ' → ' + nl, 'success');
            viewCategories();
          }).catch(function (e) { toast('Rename failed: ' + (e.message || e), 'error'); });
        });
      });
    }).catch(function (e) { toast('Load failed: ' + (e.message || e), 'error'); });
  }

  /* rm(4.5-1): editor language switch — reloads the SAME block in the twin language */
  function viewBlockEditorLang(lang) {
    var params = new URLSearchParams(location.hash.split('?')[1] || '');
    var entity = params.get('entity') || 'insight';
    var id = params.get('id') || '';
    if (!id) return;
    location.hash = '#/block-editor?entity=' + encodeURIComponent(entity) + '&id=' + encodeURIComponent(id) + '&lang=' + encodeURIComponent(lang);
    setTimeout(function () { openBlockEditor(entity, id, lang); }, 60);
  }

  function viewChromeEditor(target, title) {
    return function () {
      setCommandBar({
        left: [
          { label: 'Back to Blocks', icon: '◀', onClick: function () { location.hash = '#/blocks?entity=site'; } },
          { label: 'Save Changes', icon: '💾', primary: true, onClick: function () { $('#form-btn-save')?.click(); } },
          { label: 'Format Clean JSON', icon: '⚡', onClick: function () { $('#form-btn-format')?.click(); } }
        ],
        right: [
          { label: 'Push Live', icon: '🚀', onClick: openPublishModal },
          { label: 'View Public Site', icon: '🔗', onClick: function () { window.open(siteUrl('/'), '_blank'); } }
        ]
      });
      updateBreadcrumb('blocks', title);
      // delegate straight into the existing block editor for the target block
      location.hash = '#/block-editor?entity=site&id=' + encodeURIComponent(target);
    };
  }

  function viewBlockEditorRoute() {
    var params = new URLSearchParams(location.hash.split('?')[1] || '');
    var entity = params.get('entity') || 'insight';
    var id = params.get('id') || '';
    var lang = params.get('lang') || 'en'; // rm(4.5-1)

    if (!id) {
      location.hash = '#/blocks';
      return;
    }

    setCommandBar({
      left: [
        { label: 'Back to Blocks', icon: '◀', onClick: function () { location.hash = '#/blocks?entity=' + encodeURIComponent(entity); } },
        { label: 'Save Changes', icon: '💾', primary: true, onClick: function () { $('#form-btn-save')?.click(); } },
        { label: 'Format Clean JSON', icon: '⚡', onClick: function () { $('#form-btn-format')?.click(); } },
        { sep: true },
        { label: 'Revisions & Diff', icon: '⏪', onClick: function () { location.hash = '#/revisions?table=content_blocks&id=' + encodeURIComponent(id); } }
      ],
      right: [
        { label: (lang === 'ar' ? '🌍 العربية (AR)' : '🌍 English (EN)'), onClick: function () { viewBlockEditorLang(lang === 'ar' ? 'en' : 'ar'); } },
        { label: 'Record: ' + entity + ' / ' + id }
      ]
    });

    var content = $('#content');
    content.innerHTML = '<div id="block-form-container" role="region" aria-label="Block Form Studio"></div>';
    openBlockEditor(entity, id, lang);
  }

  /* View: Content Blocks Explorer & 3-Column Form Studio */
  function viewBlocks() {
    setCommandBar({
      left: [
        { label: 'New Block', icon: '＋', primary: true, onClick: function () { openQuickCreate('block'); } },
        { label: 'Refresh Blocks', icon: '↻', onClick: function () { refreshGlobalData().then(viewBlocks); } },
        { sep: true },
        { label: 'Export Block Catalog', icon: '📊', onClick: function () { exportBlocksCsv(); } }
      ],
      right: [
        { label: 'Total: ' + state.blocks.length + ' Blocks' }
      ]
    });

    var urlParam = new URLSearchParams(location.hash.split('?')[1] || '').get('entity') || '';
    var entities = [...new Set(state.blocks.map(function (b) { return b.entity; }))].sort();

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-grid-toolbar d365-card mb-3" role="region" aria-label="Block Filtering and Search">' +
        '<div class="d365-grid-search">' +
          '<label for="block-search" class="visually-hidden">Search blocks by entity, ID, or title</label>' +
          '<input type="text" id="block-search" placeholder="Search blocks by entity, ID, or title…">' +
        '</div>' +
        '<div class="d365-filter-pills" id="block-entity-pills" role="toolbar" aria-label="Filter Blocks by Entity">' +
          '<button class="d365-filter-pill ' + (!urlParam ? 'active' : '') + '" data-ent="" aria-pressed="' + (!urlParam ? 'true' : 'false') + '">All Entities (' + state.blocks.length + ')</button>' +
          entities.map(function (e) {
            var count = state.blocks.filter(function (b) { return b.entity === e; }).length;
            var isAct = urlParam === e;
            return '<button class="d365-filter-pill ' + (isAct ? 'active' : '') + '" data-ent="' + esc(e) + '" aria-pressed="' + (isAct ? 'true' : 'false') + '">' + esc(e) + ' (' + count + ')</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table" id="blocks-table" aria-label="Enterprise Content Blocks Catalog">' +
          '<thead>' +
            '<tr><th scope="col">Entity</th><th scope="col">Record ID</th><th scope="col">Display Title / Name</th><th scope="col">Language</th><th scope="col">Actions</th></tr>' +
          '</thead>' +
          '<tbody id="blocks-table-body"></tbody>' +
        '</table>' +
      '</div>' +

      '<!-- Fluent UI 3-Column Form Studio -->' +
      '<div id="block-form-container" class="mt-4" style="display:none" role="region" aria-label="Block Form Studio"></div>';

    var selectedEntity = urlParam;

    function renderTableRows() {
      var q = ($('#block-search')?.value || '').toLowerCase();
      var filtered = state.blocks.filter(function (b) {
        var matchEnt = !selectedEntity || b.entity === selectedEntity;
        var eid = String(b.entity_id || b.entityId || '');
        var p = b.payload || {};
        var nm = String(p.t || p.name || p.title || '');
        var matchQ = !q || (b.entity + ' ' + eid + ' ' + nm).toLowerCase().includes(q);
        return matchEnt && matchQ;
      });

      var tbody = $('#blocks-table-body');
      if (!tbody) return;

      tbody.innerHTML = filtered.slice(0, 150).map(function (b) {
        var eid = b.entity_id || b.entityId || '';
        var p = b.payload || {};
        var title = p.t || p.name || p.title || p.heading || '—';
        return '<tr>' +
          '<td><span class="entity-tag">' + esc(b.entity) + '</span></td>' +
          '<td style="font-family:monospace;font-weight:600">' + esc(eid) + '</td>' +
          '<td><b>' + esc(String(title).slice(0, 80)) + '</b></td>' +
          '<td><span style="font-size:11px;font-weight:600;color:#64748B">EN</span></td>' +
          '<td>' +
            '<button class="d365-cmd-btn btn-primary-action" style="font-size:11px;min-height:30px" aria-label="Open Form Studio for ' + esc(title) + ' (' + esc(eid) + ')' + '" data-open-block="' + esc(b.entity) + '||' + esc(eid) + '">Open Form Studio ➔</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      attachBlockOpenEvents();
    }

    $('#block-search')?.addEventListener('input', renderTableRows);

    $$('#block-entity-pills .d365-filter-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        $$('#block-entity-pills .d365-filter-pill').forEach(function (p) {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        selectedEntity = pill.getAttribute('data-ent');
        renderTableRows();
      });
    });

    renderTableRows();
  }

  function attachBlockOpenEvents() {
  }

  /* 3-Column Entity Form Engine */
  function openBlockEditor(entity, id, lang) {
    lang = lang || 'en'; // rm(4.5-1): AR twins editable (?lang=ar)
    state.blockLang = lang;
    API.get('/api/cms/blocks/' + encodeURIComponent(entity) + '/' + encodeURIComponent(id) + '?lang=' + encodeURIComponent(lang)).then(function (block) {
      if (!block) {
        toast('Content block not found: ' + entity + '/' + id, 'error');
        return;
      }
      state.currentRecord = block;
      updateBreadcrumb(state.currentView, entity + ' / ' + id);

      // Show Business Process Flow Ribbon
      $('#bpf-container').style.display = 'flex';

      var formContainer = $('#block-form-container');
      if (!formContainer) return;
      formContainer.style.display = 'block';

      var p = block.payload || {};
      var title = p.t || p.title || p.name || id;

      formContainer.innerHTML =
        '<div class="d365-card mb-4" style="border-top:3px solid var(--d365-primary);padding:18px 24px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
            '<div>' +
              '<div style="font-size:11px;font-weight:700;color:#64748B;letter-spacing:0.06em;text-transform:uppercase">' + esc(entity) + ' Record</div>' +
              '<h2 style="font-size:22px;color:var(--d365-navy);margin:4px 0">' + esc(title) + '</h2>' +
              '<div style="font-size:12px;color:#64748B">Key: <code>' + esc(id) + '</code> · Last updated: ' + formatDate(block.updated_at) + ' by ' + esc(block.updated_by || 'system') + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px">' +
              '<button class="d365-cmd-btn" id="form-btn-view-revisions">⏪ Revisions & Diff</button>' +
              '<button class="d365-cmd-btn btn-danger-action" id="form-btn-delete">Delete Record</button>' +
              '<button class="d365-cmd-btn btn-primary-action" id="form-btn-save">Save Changes 💾</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="d365-form-layout">' +
          '<!-- Column 1 & 2: Primary Fields & Content Studio -->' +
          '<div>' +
            '<div class="d365-form-section">' +
              '<div class="d365-form-section-title">General Properties</div>' +
              '<div class="d365-field-row">' +
                '<div class="d365-form-field">' +
                  '<label for="field-entity-type">Entity Type</label>' +
                  '<input type="text" id="field-entity-type" value="' + esc(entity) + '" readonly style="background:#F1F5F9">' +
                '</div>' +
                '<div class="d365-form-field">' +
                  '<label for="field-record-id">Record Identifier (Slug / Key)</label>' +
                  '<input type="text" id="field-record-id" value="' + esc(id) + '" readonly style="background:#F1F5F9">' +
                '</div>' +
              '</div>' +
              '<div class="d365-form-field">' +
                '<label for="field-title">Title / Display Heading</label>' +
                '<input type="text" id="field-title" value="' + esc(title) + '">' +
              '</div>' +
              (p.x || p.desc || p.d ?
                '<div class="d365-form-field">' +
                  '<label for="field-desc">Description / Overview Excerpt</label>' +
                  '<textarea id="field-desc" rows="3">' + esc(p.x || p.desc || p.d) + '</textarea>' +
                '</div>' : '') +
            '</div>' +

            '<div class="d365-form-section">' +
              '<div class="d365-form-section-title">' +
                '<span>Structured JSON Payload Editor</span>' +
                '<button class="d365-cmd-btn" id="form-btn-format" style="font-size:11px">Format Clean JSON ⚡</button>' +
              '</div>' +
              '<p id="field-json-hint" style="font-size:12px;color:#64748B;margin-top:0">Every modification is verified with real-time JSON schema validation and written alongside a micro-revision snapshot.</p>' +
              '<label for="field-json" class="visually-hidden">Structured JSON Payload</label>' +
              '<textarea id="field-json" aria-describedby="field-json-hint field-json-err" style="width:100%;min-height:360px;font-family:monospace;font-size:12.5px;padding:14px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:6px" spellcheck="false">' +
                esc(JSON.stringify(p, null, 2)) +
              '</textarea>' +
              '<div id="field-json-err" aria-live="polite" style="color:#A80000;font-size:12px;font-weight:600;margin-top:6px"></div>' +
            '</div>' +
          '</div>' +

          '<!-- Column 3: Summary, Audit & Cross Links -->' +
          '<div>' +
            '<div class="d365-form-section">' +
              '<div class="d365-form-section-title">Record Governance</div>' +
              '<div style="font-size:12.5px;line-height:1.7">' +
                '<div><b>Status:</b> <span class="entity-tag" style="background:#DCFCE7;color:#107C41">Active & Approved</span></div>' +
                '<div><b>AR Parity:</b> <span style="color:#006CBE">Arabic Translation Available</span></div>' +
                '<div><b>Publishing:</b> Included in SSG static distribution</div>' +
                '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #E2E8F0">' +
                  '<button class="d365-cmd-btn" style="width:100%;font-size:12px" id="side-rollback-quick">⏪ View Previous Snapshots</button>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="d365-form-section">' +
              '<div class="d365-form-section-title">Cross-Navigation Links</div>' +
              '<ul style="list-style:none;padding:0;margin:0;font-size:12.5px;line-height:1.8">' +
                '<li>➔ <a href="#/revisions?table=content_blocks&id=' + encodeURIComponent(id) + '">Audit Revisions for this Record</a></li>' +
                '<li>➔ <a href="#/loc-audit">Verify AR/EN Localization Parity</a></li>' +
                '<li>➔ <a href="#/publish-pipeline">Trigger SSG Rebuild & Invalidation</a></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</div>';

      formContainer.scrollIntoView({ behavior: 'smooth' });

      // Wire Form actions
      $('#form-btn-save')?.addEventListener('click', function () {
        var jsonText = $('#field-json').value;
        var errEl = $('#field-json-err');
        errEl.textContent = '';
        var parsed;
        try {
          parsed = JSON.parse(jsonText);
        } catch (e) {
          errEl.textContent = 'JSON Syntax Error: ' + e.message;
          return;
        }

        // Sync title/desc if edited
        var customTitle = $('#field-title')?.value;
        if (customTitle) {
          if (parsed.t !== undefined) parsed.t = customTitle;
          else if (parsed.title !== undefined) parsed.title = customTitle;
          else if (parsed.name !== undefined) parsed.name = customTitle;
        }
        /* deploy-audit C7: the Description field was shown but never saved. Write it to the key
         * the record already uses (insights read x, IT solutions read d); a new key follows
         * the entity's reader. */
        var descEl = $('#field-desc');
        if (descEl && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          var descVal = descEl.value.trim();
          var descKey = parsed.x !== undefined ? 'x' : parsed.d !== undefined ? 'd' : parsed.desc !== undefined ? 'desc'
            : (entity === 'it_solution' ? 'd' : 'x');
          if (descVal && descVal !== parsed[descKey]) parsed[descKey] = descVal;
        }

        API.put('/api/cms/blocks/' + encodeURIComponent(entity) + '/' + encodeURIComponent(id) + '?lang=' + (state.blockLang || 'en'), { payload: parsed })
          .then(function () {
            toast('Block ' + id + ' saved with revision snapshot. Ready for site publish.', 'success');
            refreshGlobalData();
          })
          .catch(function (e) {
            toast('Save failed: ' + (e.message || e), 'error');
          });
      });

      $('#form-btn-format')?.addEventListener('click', function () {
        try {
          var val = JSON.parse($('#field-json').value);
          $('#field-json').value = JSON.stringify(val, null, 2);
          $('#field-json-err').textContent = '';
        } catch (e) {
          $('#field-json-err').textContent = 'Cannot format: ' + e.message;
        }
      });

      /* deploy-audit D07: the full 'entity:id:lang' key — a bare id matched every entity and
       * language sharing that id (LIKE '%:id:%'), so AR/EN twins and same-named records mixed */
      $('#form-btn-view-revisions')?.addEventListener('click', function () {
        openRevisionDiffModal('content_blocks', entity + ':' + id + ':' + lang);
      });
      $('#side-rollback-quick')?.addEventListener('click', function () {
        openRevisionDiffModal('content_blocks', entity + ':' + id + ':' + lang);
      });

      $('#form-btn-delete')?.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete block "' + id + '"? A revision backup will be archived.')) {
          API.delete('/api/cms/blocks/' + encodeURIComponent(entity) + '/' + encodeURIComponent(id))
            .then(function () {
              toast('Block ' + id + ' deleted', 'warn');
              refreshGlobalData().then(viewBlocks);
            })
            .catch(function (e) { toast('Delete failed: ' + (e.message || e), 'error'); });
        }
      });
    });
  }

  /* View: News & Insights */
  function viewInsights() {
    viewEditorialWorkspace();
  }

  /* View: Legal Policies */
  function viewPolicies() {
    setCommandBar({
      left: [
        { label: 'Refresh Policies', icon: '↻', onClick: function () { refreshGlobalData().then(viewPolicies); } },
        { label: 'Push Live', icon: '🚀', onClick: openPublishModal }
      ],
      right: [
        { label: state.policies.length + ' Regulatory Policies', id: 'cmd-pol-count' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Legal & Compliance Regulatory Policies</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Seven mandatory regulatory policies aligned with UAE PDPL, Peppol 2027 E-Invoicing mandates, and consumer protection standards.</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px">' +
        state.policies.map(function (p) {
          /* deploy-audit D06: one card per (slug, lang); the AR card edits only the AR row */
          var lang = p.lang === 'ar' ? 'ar' : 'en';
          var key = p.slug + ':' + lang;
          var rtl = lang === 'ar' ? ' dir="rtl" lang="ar"' : '';
          return '<div class="d365-card" style="padding:18px" data-policy-key="' + esc(key) + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
              '<b style="font-size:14px;color:var(--d365-navy)">' + esc(p.title) + '</b>' +
              '<span class="entity-tag">' + esc(p.slug) + ' · ' + lang.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Document Title</label>' +
              '<input type="text" class="pol-title"' + rtl + ' value="' + esc(p.title) + '">' +
            '</div>' +
            '<div class="d365-form-field">' +
              '<label>Policy Clauses & Paragraphs</label>' +
              '<textarea class="pol-body"' + rtl + ' rows="8" style="font-size:12.5px;line-height:1.6">' + esc(p.body || '') + '</textarea>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #F1F5F9">' +
              '<button class="d365-cmd-btn" data-pol-diff="' + esc(key) + '">⏪ Revisions</button>' +
              '<button class="d365-cmd-btn btn-primary-action" data-pol-save="' + esc(key) + '">Save Policy 💾</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    $$('[data-pol-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pol-save');
        var card = btn.closest('[data-policy-key]');
        if (!card) return;
        var cut = key.lastIndexOf(':');
        var slug = key.slice(0, cut), lang = key.slice(cut + 1);
        var title = card.querySelector('.pol-title').value;
        var body = card.querySelector('.pol-body').value;
        API.put('/api/cms/policies/' + encodeURIComponent(slug) + '?lang=' + lang, { title: title, body: body, lang: lang })
          .then(function () {
            toast('Policy ' + slug + ' (' + lang.toUpperCase() + ') saved with revision snapshot', 'success');
            refreshGlobalData();
          })
          .catch(function (e) { toast('Save failed: ' + (e.message || e), 'error'); });
      });
    });

    $$('[data-pol-diff]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openRevisionDiffModal('legal_policies', btn.getAttribute('data-pol-diff')); // 'slug:lang'
      });
    });
  }

  /* View: IT Solutions */
  function viewItSolutions() {
    setCommandBar({
      left: [
        { label: 'New Solution Line', icon: '＋', primary: true, onClick: function () { openQuickCreate('it_solution'); } },
        { label: 'Refresh Solutions', icon: '↻', onClick: viewItSolutions }
      ]
    });
    var solBlocks = state.blocks.filter(function (b) { return b.entity === 'it_solution'; });
    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">12 Enterprise IT Solution Lines</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Manage the 12 corporate IT solution lines ported from the site mirror.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>Solution ID</th><th>Headline</th><th>Description</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            solBlocks.map(function (b) {
              var p = b.payload || {};
              return '<tr>' +
                '<td style="font-family:monospace;font-weight:600">' + esc(b.entity_id) + '</td>' +
                '<td><b>' + esc(p.t || p.title || '—') + '</b></td>' +
                '<td style="font-size:12px;color:#64748B">' + esc(String(p.d || p.desc || '').slice(0, 100)) + '…</td>' +
                '<td><button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-open-block="it_solution||' + esc(b.entity_id) + '">Edit Line ➔</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
    attachBlockOpenEvents();
  }

  /* View: AMC Tiers */
  function viewAmcTiers() {
    var block = state.blocks.find(function (b) { return b.entity === 'site' && b.entity_id === 'amc-tiers'; }); // rm(4.3-2): decoy retired
    var payload = block ? block.payload : { head: ['Feature', 'Basic', 'Standard', 'Premium'], rows: [] };

    setCommandBar({
      left: [
        { label: 'Edit SLA Matrix in Studio', icon: 'edit', primary: true, onClick: function () {
          /* deploy-audit C10: the AMC view has no form container — open the editor route */
          location.hash = '#/block-editor?entity=' + encodeURIComponent(block ? block.entity : 'site') + '&id=' + encodeURIComponent(block ? block.entity_id : 'amc-tiers');
        } },
        { label: 'Refresh Matrix', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewAmcTiers); } },
        { sep: true },
        { label: 'Push Live', icon: 'rocket', onClick: openPublishModal }
      ],
      right: [
        { label: 'Single-Source Block: site / amc-tiers' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Annual Maintenance Contract (AMC) SLA Tiers</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Tiered response times, resolution guarantees, and on-site visits across UAE sites. Verified single-source block: <code>site/amc-tiers</code>.</p>' +
      '</div>' +
      '<div class="d365-card" style="padding:20px">' +
        '<table class="d365-table" style="border:1px solid #E2E8F0">' +
          '<thead>' +
            '<tr>' + (payload.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' +
          '</thead>' +
          '<tbody>' +
            (payload.rows || []).map(function (r) {
              return '<tr>' + r.map(function (cell, idx) {
                return idx === 0 ? '<td><b>' + esc(cell) + '</b></td>' : '<td>' + esc(cell) + '</td>';
              }).join('') + '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
        '<div style="margin-top:16px">' +
          (block ? '<button class="d365-cmd-btn btn-primary-action" data-open-block="' + esc(block.entity) + '||' + esc(block.entity_id) + '">Edit SLA Matrix in Studio ➔</button>' : '') +
        '</div>' +
      '</div>';
    attachBlockOpenEvents();
  }

  /* View: Software Suites */
  function viewSoftwareSuites() {
    setCommandBar({
      left: [
        { label: 'Refresh Software Suites', icon: 'refresh', id: 'cmd-refresh-soft', onClick: function () { refreshGlobalData().then(viewSoftwareSuites); } },
        { label: 'Push Live', icon: 'rocket', id: 'cmd-push-soft', onClick: openPublishModal }
      ],
      right: [
        { label: 'UniERP & UniVAT Integration Modules' }
      ]
    });
    var softBlocks = state.blocks.filter(function (b) { return b.entity.startsWith('software_'); });
    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Software Solutions: UniERP & UniVAT</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">ERP modules, UAE Peppol 2027 E-Invoicing integrations, and industry verticals.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>Entity</th><th>Record Key</th><th>Title</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            softBlocks.map(function (b) {
              var p = b.payload || {};
              return '<tr>' +
                '<td><span class="entity-tag">' + esc(b.entity) + '</span></td>' +
                '<td style="font-family:monospace;font-weight:600">' + esc(b.entity_id) + '</td>' +
                '<td><b>' + esc(p.t || p.title || p.name || '—') + '</b></td>' +
                '<td><button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-open-block="' + esc(b.entity) + '||' + esc(b.entity_id) + '">Edit ➔</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
    attachBlockOpenEvents();
  }

  /* View: Products Catalog (Hardware Inventory & SKU Workspace) */
  function viewProductsCatalog() {
    var prods = state.products && state.products.length ? state.products : [];
    var brands = ['all'];
    prods.forEach(function (p) {
      if (p.brand && brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });

    var inStockCount = prods.filter(function (p) { return String(p.stock) !== 'false'; }).length;
    var outStockCount = prods.length - inStockCount;
    var newCount = prods.filter(function (p) { return !!p.is_new; }).length;

    setCommandBar({
      left: [
        { label: 'New Product SKU', icon: 'plus', primary: true, onClick: function () { openProductEditModal(null); } },
        { label: 'Refresh Inventory', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewProductsCatalog); } },
        { label: 'Export Catalog CSV', icon: 'download', onClick: exportProductsCsv },
        { sep: true },
        { label: 'View Photo Assets 📷', onClick: function () { location.hash = '#/media-library'; } }
      ],
      right: [
        { label: prods.length + ' Active Products · ' + (brands.length - 1) + ' Brands' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Hardware Product Portfolio & Inventory Management</h2>' +
            '<p style="font-size:12.5px;color:#64748B;margin:0">High-density catalog of ' + prods.length + ' enterprise hardware SKUs synced directly from the PostgreSQL products table.</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
            '<button class="d365-cmd-btn btn-primary-action" id="btn-add-prod-table">＋ Add Hardware SKU</button>' +
            '<span class="kpi3-pill pill-up">' + inStockCount + ' In Stock</span>' +
            '<span class="kpi3-pill pill-warn">' + outStockCount + ' Backorder</span>' +
            '<span class="kpi3-pill pill-neutral">' + newCount + ' New Arrivals</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid #F1F5F9;flex-wrap:wrap;gap:12px">' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<input type="search" id="prod-filter-search" placeholder="Search by name, SKU, or category…" class="dash-inline-input" style="width:260px" aria-label="Search Products">' +
            '<select id="prod-filter-stock" class="dash-inline-input" style="width:140px" aria-label="Filter by Stock">' +
              '<option value="all">All Stock Statuses</option>' +
              '<option value="in">In Stock Only</option>' +
              '<option value="out">Backorder Only</option>' +
            '</select>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap" id="prod-brand-pills">' +
            brands.slice(0, 9).map(function (b) {
              return '<button class="d365-filter-pill ' + (b === 'all' ? 'active' : '') + '" data-filter-pbrand="' + esc(b) + '">' + (b === 'all' ? 'All Brands (' + prods.length + ')' : esc(b)) + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table" id="prod-data-table">' +
          '<thead>' +
            '<tr>' +
              '<th style="width:52px">Asset</th>' +
              '<th>Product Name &amp; Description</th>' +
              '<th>Brand &amp; Category</th>' +
              '<th>MPN / SKU</th>' +
              '<th>Stock Availability</th>' +
              '<th style="text-align:right">Actions</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="prod-table-body"></tbody>' +
        '</table>' +
      '</div>';

    var curBrand = 'all';
    var curStock = 'all';
    var curQuery = '';

    function renderTableRows() {
      var tbody = $('#prod-table-body');
      if (!tbody) return;

      var filtered = prods.filter(function (p) {
        var matchBrand = (curBrand === 'all' || (p.brand && p.brand.toLowerCase() === curBrand.toLowerCase()));
        var matchStock = (curStock === 'all' || (curStock === 'in' && String(p.stock) !== 'false') || (curStock === 'out' && String(p.stock) === 'false'));
        var q = curQuery.toLowerCase();
        var matchQuery = (!q || (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
                                (p.slug && p.slug.toLowerCase().indexOf(q) !== -1) ||
                                (p.sku && p.sku.toLowerCase().indexOf(q) !== -1) ||
                                (p.cat_label && p.cat_label.toLowerCase().indexOf(q) !== -1) ||
                                (p.brand && p.brand.toLowerCase().indexOf(q) !== -1));
        return matchBrand && matchStock && matchQuery;
      });

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:32px;text-align:center;color:#64748B">No products match the selected filters.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(function (p) {
        var firstImg = (Array.isArray(p.imgs) && p.imgs[0]) ? p.imgs[0] : (typeof p.imgs === 'string' ? p.imgs : '');
        var imgSrc = firstImg ? ('assets/img/products/' + firstImg.replace(/^.*[\\\/]/, '')) : 'assets/img/favicon.png';
        var inStock = String(p.stock) !== 'false';
        var stockBadge = inStock ?
          '<span class="badge-stock-in">● In Stock</span>' :
          '<span class="badge-stock-out">○ Backorder</span>';

        return '<tr>' +
          '<td>' +
            '<div style="width:40px;height:40px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden">' +
              '<img src="' + esc(imgSrc) + '" alt="' + esc(p.name) + '" style="max-width:34px;max-height:34px;object-fit:contain" onerror="this.onerror=null;this.src=\'assets/img/favicon.png\'">' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<div style="font-weight:600;color:var(--d365-navy);margin-bottom:2px">' + esc(p.name) + '</div>' +
            '<div style="font-size:11.5px;color:#64748B;line-height:1.4">' + esc(String(p.short || p.descr || '').slice(0, 110)) + (p.short && p.short.length > 110 ? '…' : '') + '</div>' +
            (p.is_new ? '<span class="entity-tag" style="background:#FEF3C7;color:#92400E;margin-top:3px;font-size:10px">★ New Arrival</span>' : '') +
          '</td>' +
          '<td>' +
            '<span class="entity-tag" style="background:#EFF6FC;color:#006CBE">' + esc(p.brand || 'Crucial') + '</span><br>' +
            '<span style="font-size:11.5px;color:#475569">' + esc(p.cat_label || p.cat || 'Hardware') + '</span>' +
          '</td>' +
          '<td>' +
            '<code style="font-size:11.5px;font-weight:600">' + esc(p.sku || p.slug) + '</code>' +
          '</td>' +
          '<td>' + stockBadge + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' +
            '<button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-prod-edit="' + esc(p.slug) + '">Edit SKU ✏️</button> ' +
            '<button class="d365-cmd-btn" style="font-size:11px" data-prod-diff="' + esc(p.slug) + '">Revisions ⏪</button> ' +
            '<button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-prod-delete="' + esc(p.slug) + '">Delete 🗑️</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      tbody.querySelectorAll('[data-prod-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-prod-edit');
          openProductEditModal(slug);
        });
      });

      tbody.querySelectorAll('[data-prod-diff]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-prod-diff');
          openRevisionDiffModal('products', slug);
        });
      });

      tbody.querySelectorAll('[data-prod-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-prod-delete');
          if (!confirm('Are you sure you want to delete hardware SKU "' + slug + '"? This will remove the SKU from the database and snapshot a deletion revision.')) return;
          API.delete('/api/cms/products/' + encodeURIComponent(slug)).then(function () {
            toast('Product SKU "' + slug + '" deleted successfully', 'success');
            refreshGlobalData().then(viewProductsCatalog);
          }).catch(function (e) {
            toast('Delete failed: ' + (e.message || e), 'error');
          });
        });
      });
    }

    $('#btn-add-prod-table')?.addEventListener('click', function () { openProductEditModal(null); });

    renderTableRows();

    $('#prod-filter-search')?.addEventListener('input', function () {
      curQuery = this.value.trim();
      renderTableRows();
    });

    $('#prod-filter-stock')?.addEventListener('change', function () {
      curStock = this.value;
      renderTableRows();
    });

    $$('#prod-brand-pills [data-filter-pbrand]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#prod-brand-pills [data-filter-pbrand]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        curBrand = btn.getAttribute('data-filter-pbrand');
        renderTableRows();
      });
    });
  }

  function openProductEditModal(slug) {
    var modal = $('#modal-product-edit');
    if (!modal) return;
    var isNew = !slug;
    var title = $('#product-modal-title');
    var slugInp = $('#prod-edit-slug');
    var slugDisp = $('#prod-edit-slug-display');
    var brandBadge = $('#prod-edit-brand-badge');

    if (isNew) {
      if (title) title.textContent = '➕ Provision New Product SKU';
      slugInp.value = '';
      slugInp.readOnly = false;
      slugDisp.textContent = 'new-sku-slug';
      brandBadge.textContent = 'New SKU';
      $('#prod-edit-name').value = '';
      $('#prod-edit-sku').value = '';
      $('#prod-edit-brand').value = '';
      $('#prod-edit-cat').value = '';
      $('#prod-edit-cat-label').value = '';
      $('#prod-edit-short').value = '';
      $('#prod-edit-stock').value = 'true';
      $('#prod-edit-is-new').checked = false;
      $('#prod-edit-warranty').value = '';
      $('#prod-edit-datasheet').value = '';
      $('#prod-edit-specs-json').value = '';
      $('#prod-edit-img').src = 'assets/img/favicon.png';
      trapFocus(modal);
      return;
    }

    var p = state.products.find(function (it) { return it.slug === slug; });
    if (!p) {
      toast('Product SKU not found: ' + slug, 'error');
      return;
    }

    if (title) title.textContent = '📦 Product SKU & Inventory Editor (' + p.name + ')';
    slugInp.value = p.slug;
    slugInp.readOnly = true;
    slugDisp.textContent = p.slug;
    brandBadge.textContent = (p.brand || 'Hardware') + (p.cat_label ? ' · ' + p.cat_label : '');
    $('#prod-edit-name').value = p.name || '';
    $('#prod-edit-sku').value = p.sku || '';
    $('#prod-edit-brand').value = p.brand || '';
    $('#prod-edit-cat').value = p.cat || '';
    $('#prod-edit-cat-label').value = p.cat_label || '';
    $('#prod-edit-short').value = p.short || p.descr || '';
    $('#prod-edit-stock').value = (String(p.stock) === 'false') ? 'false' : 'true';
    $('#prod-edit-is-new').checked = !!p.is_new;

    var firstImg = (Array.isArray(p.imgs) && p.imgs[0]) ? p.imgs[0] : (typeof p.imgs === 'string' ? p.imgs : '');
    $('#prod-edit-img').src = firstImg ? ('assets/img/products/' + firstImg.replace(/^.*[\\\/]/, '')) : 'assets/img/favicon.png';

    // Fetch deep specs to populate deep fields
    API.get('/api/cms/products/' + encodeURIComponent(slug) + '/deep').then(function (deep) {
      if (deep) {
        $('#prod-edit-warranty').value = deep.warranty_months != null ? deep.warranty_months : ''; // deploy-audit D05: the service stores warranty_months
        $('#prod-edit-datasheet').value = deep.datasheet_url || '';
        $('#prod-edit-specs-json').value = deep.specs ? JSON.stringify(deep.specs, null, 2) : '';
      }
    }).catch(function () {
      $('#prod-edit-warranty').value = '';
      $('#prod-edit-datasheet').value = '';
      $('#prod-edit-specs-json').value = '';
    });

    trapFocus(modal);
  }

  function handleProductSave() {
    var slug = $('#prod-edit-slug').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!slug) return toast('Product Slug is required', 'warn');
    var btn = $('#btn-prod-save');
    var name = $('#prod-edit-name').value.trim();
    if (!name) return toast('Product Name is required', 'warn');

    var isExisting = state.products.some(function (p) { return p.slug === slug; });

    var patch = {
      slug: slug,
      name: name,
      sku: $('#prod-edit-sku').value.trim(),
      brand: $('#prod-edit-brand').value.trim(),
      cat: $('#prod-edit-cat').value.trim(),
      cat_label: $('#prod-edit-cat-label').value.trim(),
      short: $('#prod-edit-short').value.trim(),
      stock: $('#prod-edit-stock').value,
      is_new: $('#prod-edit-is-new').checked
    };

    var specsStr = ($('#prod-edit-specs-json')?.value || '').trim();
    var specsObj = null;
    if (specsStr) {
      try { specsObj = JSON.parse(specsStr); } catch (e) {
        return toast('Invalid JSON in Technical Specifications: ' + e.message, 'error');
      }
    }

    var deepPayload = {
      warranty_months: ($('#prod-edit-warranty')?.value || '').trim(), // '' clears it; the service validates 0–240
      datasheet_url: ($('#prod-edit-datasheet')?.value || '').trim(),
      specs: specsObj || {}
    };

    btn.disabled = true;
    btn.textContent = 'Saving SKU & Revision…';

    var savePromise = isExisting
      ? API.put('/api/cms/products/' + encodeURIComponent(slug), patch)
      : API.post('/api/cms/products', patch);

    savePromise
      .then(function (res) {
        // Also save deep specs
        return API.put('/api/cms/products/' + encodeURIComponent(slug) + '/deep', deepPayload).catch(function () {}).then(function () { return res; });
      })
      .then(function (res) {
        toast('Product SKU "' + (res.product ? res.product.name : slug) + '" saved with revision snapshot!', 'success');
        closeModals();
        refreshGlobalData().then(function () {
          if (state.currentView === 'products-catalog' || state.currentView === 'products') {
            viewProductsCatalog();
          }
        });
      })
      .catch(function (err) {
        toast('Save failed: ' + (err.message || err), 'error');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Save Product & Snapshot Revision';
      });
  }

  function exportProductsCsv() {
    var headers = ['slug', 'sku', 'name', 'brand', 'cat', 'cat_label', 'stock', 'is_new'];
    var rows = state.products.map(function (p) {
      return [
        p.slug,
        p.sku || '',
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.brand || '',
        p.cat || '',
        '"' + (p.cat_label || '').replace(/"/g, '""') + '"',
        p.stock,
        p.is_new ? 'true' : 'false'
      ].join(',');
    });
    var csv = [headers.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'simal-hardware-catalog-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported ' + state.products.length + ' products to CSV', 'info');
  }

  /* View: Authorized Brands Management */
  function viewBrandsManagement() {
    var brandsList = state.brands && state.brands.length ? state.brands : [];

    setCommandBar({
      left: [
        { label: 'New Brand Partner', icon: 'plus', primary: true, id: 'cmd-new-brand', onClick: function () { openBrandEditModal(null); } },
        { label: 'Refresh Directory', icon: 'refresh', id: 'cmd-refresh-brands', onClick: function () { refreshGlobalData().then(viewBrandsManagement); } },
        { sep: true },
        { label: 'Push Live', icon: 'rocket', id: 'cmd-push-brands', onClick: openPublishModal }
      ],
      right: [
        { label: brandsList.length + ' Authorized Partner Brands' },
        { label: 'View Public Site', icon: 'ext', id: 'cmd-open-brands-site', onClick: function () { window.open(siteUrl('/brands/'), '_blank'); } }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Authorized Brand Distribution Portfolio</h2>' +
            '<p style="font-size:12.5px;color:#64748B;margin:0">Manage authorized vendor relationships, certified lines, and catalog counts displayed on public /brands/ page.</p>' +
          '</div>' +
          '<div style="display:flex;gap:10px;align-items:center">' +
            '<button class="d365-cmd-btn btn-primary-action" id="btn-add-brand-table">＋ Add Partner Brand</button>' +
            '<input type="search" id="brand-filter-search" placeholder="Search brands, lines..." class="dash-inline-input" style="width:240px" aria-label="Search Brands">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table" id="brands-table" aria-label="Authorized Brands Table">' +
          '<thead>' +
            '<tr>' +
              '<th>Brand Name</th>' +
              '<th>Slug / Key</th>' +
              '<th>Tagline / Positioning</th>' +
              '<th>Certified Hardware Lines</th>' +
              '<th>Active SKUs</th>' +
              '<th style="text-align:right">Actions</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="brands-table-body"></tbody>' +
        '</table>' +
      '</div>';

    function renderBrandRows() {
      var q = ($('#brand-filter-search')?.value || '').toLowerCase().trim();
      var filtered = brandsList.filter(function (b) {
        if (!q) return true;
        return (b.name && b.name.toLowerCase().includes(q)) ||
               (b.slug && b.slug.toLowerCase().includes(q)) ||
               (b.line && b.line.toLowerCase().includes(q)) ||
               (b.note && b.note.toLowerCase().includes(q));
      });

      var tbody = $('#brands-table-body');
      if (!tbody) return;

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:28px;text-align:center;color:#64748B">No brand partners match query.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(function (b) {
        var skus = (state.products || []).filter(function (p) {
          return (p.brand || '').toLowerCase() === (b.name || '').toLowerCase() ||
                 (p.brand || '').toLowerCase() === (b.slug || '').toLowerCase();
        }).length;
        var countsObj = typeof b.counts === 'string' ? JSON.parse(b.counts || '{}') : (b.counts || {});
        var displayCount = skus || countsObj.count || 0;

        return '<tr>' +
          '<td><b style="color:var(--d365-navy);font-size:13.5px">' + esc(b.name) + '</b></td>' +
          '<td><code style="font-size:11.5px">' + esc(b.slug) + '</code></td>' +
          '<td style="max-width:280px;font-size:12px;color:#475569">' + esc(String(b.line || '').replace(/^"|"$/g, '')) + '</td>' +
          '<td style="max-width:320px;font-size:11.5px;color:#64748B">' + esc(String(b.note || '').replace(/^"|"$/g, '').slice(0, 90)) + (b.note && b.note.length > 90 ? '…' : '') + '</td>' +
          '<td><span class="entity-tag" style="background:#EFF6FC;color:#006CBE;font-weight:700">' + displayCount + ' SKUs</span></td>' +
          '<td style="text-align:right;white-space:nowrap">' +
            '<button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-brand-edit="' + esc(b.slug) + '">Edit ✏️</button> ' +
            '<button class="d365-cmd-btn" style="font-size:11px" data-brand-diff="' + esc(b.slug) + '">Revisions ⏪</button> ' +
            '<button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-brand-delete="' + esc(b.slug) + '">Delete 🗑️</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      tbody.querySelectorAll('[data-brand-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-brand-edit');
          var brand = brandsList.find(function (it) { return it.slug === slug; });
          if (brand) openBrandEditModal(brand);
        });
      });

      tbody.querySelectorAll('[data-brand-diff]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-brand-diff');
          openRevisionDiffModal('brands', slug);
        });
      });

      tbody.querySelectorAll('[data-brand-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-brand-delete');
          if (!confirm('Are you sure you want to delete brand partner "' + slug + '"? An audit revision will be saved.')) return;
          API.delete('/api/cms/brands/' + encodeURIComponent(slug)).then(function () {
            toast('Brand deleted successfully', 'success');
            refreshGlobalData().then(viewBrandsManagement);
          }).catch(function (err) {
            toast('Delete failed: ' + (err.message || err), 'error');
          });
        });
      });
    }

    renderBrandRows();

    $('#brand-filter-search')?.addEventListener('input', renderBrandRows);
    $('#btn-add-brand-table')?.addEventListener('click', function () { openBrandEditModal(null); });
  }

  function openBrandEditModal(b) {
    var modal = $('#modal-brand-edit');
    if (!modal) return;
    var isNew = !b;
    $('#brand-edit-is-new').value = isNew ? '1' : '0';
    var slugInp = $('#brand-edit-slug');
    if (slugInp) {
      slugInp.value = b ? b.slug : '';
      slugInp.readOnly = !isNew;
    }
    $('#brand-edit-name').value = b ? b.name : '';
    /* deploy-audit D08: tagline (line) and overview (note) are separate plain-text fields */
    var unq = function (s) { return String(s || '').trim().replace(/^["“]+|["”]+$/g, '').trim(); };
    $('#brand-edit-line').value = b ? unq(b.line) : '';
    $('#brand-edit-descr').value = b ? unq(b.note) : '';
    $('#brand-modal-title').textContent = isNew ? '➕ Add Authorized Brand Partner' : ('⭐ Edit Brand Partner (' + b.name + ')');
    trapFocus(modal);
  }

  function handleBrandSave() {
    var slug = ($('#brand-edit-slug')?.value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    var name = ($('#brand-edit-name')?.value || '').trim();
    if (!slug || !name) return toast('Brand Slug and Name are required', 'warn');

    var isNew = $('#brand-edit-is-new')?.value === '1';
    /* deploy-audit D08: plain text, no counts (the service keeps the stored counts) */
    var payload = {
      slug: slug,
      name: name,
      line: ($('#brand-edit-line')?.value || '').trim(),
      note: ($('#brand-edit-descr')?.value || '').trim()
    };

    var btn = $('#btn-brand-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving Brand…'; }

    var req = isNew ? API.post('/api/cms/brands', payload) : API.put('/api/cms/brands/' + encodeURIComponent(slug), payload);
    req.then(function () {
      toast('Brand "' + name + '" saved successfully with revision snapshot!', 'success');
      closeModals();
      refreshGlobalData().then(function () {
        if (state.currentView === 'brands-catalog' || state.currentView === 'brands') {
          viewBrandsManagement();
        }
      });
    }).catch(function (err) {
      toast('Save failed: ' + (err.message || err), 'error');
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Save Brand Partner'; }
    });
  }

  /* View: Claims Register */
  function viewClaimsRegister() {
    setCommandBar({
      left: [
        { label: 'Refresh Claims & Site Blocks', icon: 'refresh', id: 'cmd-refresh-claims', onClick: function () { refreshGlobalData().then(viewClaimsRegister); } },
        { label: 'Push Live', icon: 'rocket', id: 'cmd-push-claims', onClick: openPublishModal }
      ],
      right: [
        { label: 'Corporate Single-Source Claims' }
      ]
    });
    var siteBlocks = state.blocks.filter(function (b) { return b.entity === 'site'; });
    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Claims & Single-Source Hours Register</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Single-source business hours, addresses, contact cards, and warranty claim procedures.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>ID</th><th>Summary</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            siteBlocks.map(function (b) {
              return '<tr>' +
                '<td style="font-family:monospace;font-weight:600">' + esc(b.entity_id) + '</td>' +
                '<td>' + esc(JSON.stringify(b.payload).slice(0, 80)) + '…</td>' +
                '<td><button class="d365-cmd-btn btn-primary-action" style="font-size:11px" data-open-block="site||' + esc(b.entity_id) + '">Edit ➔</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
    attachBlockOpenEvents();
  }

  /* View: Revisions & Rollbacks */
  function viewRevisions() {
    setCommandBar({
      left: [
        { label: 'Load Revisions', icon: 'refresh', id: 'cmd-load-revs', onClick: function () { $('#rev-load-btn')?.click(); } },
        { label: 'Push Live', icon: 'rocket', id: 'cmd-push-revs', onClick: openPublishModal }
      ],
      right: [
        { label: 'PostgreSQL Immutable Snapshots' }
      ]
    });

    var urlParams = new URLSearchParams(location.hash.split('?')[1] || '');
    var initTable = urlParams.get('table') || 'content_blocks';
    var initId = urlParams.get('id') || 'ai-in-erp-2026';

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Micro-Revisions & Rollback Inspector</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Every write creates an immutable audit snapshot in PostgreSQL. Roll back to any prior revision with 1 click.</p>' +
        '<div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">' +
          '<div class="d365-form-field" style="margin:0;min-width:200px">' +
            '<label>Table</label>' +
            '<select id="rev-table-select">' +
              '<option value="content_blocks"' + (initTable === 'content_blocks' ? ' selected' : '') + '>content_blocks</option>' +
              '<option value="hero_slides"' + (initTable === 'hero_slides' ? ' selected' : '') + '>hero_slides</option>' +
              '<option value="legal_policies"' + (initTable === 'legal_policies' ? ' selected' : '') + '>legal_policies</option>' +
              '<option value="announcements"' + (initTable === 'announcements' ? ' selected' : '') + '>announcements</option>' +
              '<option value="testimonials"' + (initTable === 'testimonials' ? ' selected' : '') + '>testimonials</option>' +
              '<option value="products"' + (initTable === 'products' ? ' selected' : '') + '>products</option>' +
            '</select>' +
          '</div>' +
          '<div class="d365-form-field" style="margin:0;flex:1;min-width:220px">' +
            '<label>Record ID / Key</label>' +
            '<input type="text" id="rev-id-input" value="' + esc(initId) + '" placeholder="e.g. tiers, 1, privacy-policy">' +
          '</div>' +
          '<button class="d365-cmd-btn btn-primary-action" id="rev-load-btn" style="align-self:flex-end">Show Revisions 🔍</button>' +
        '</div>' +
      '</div>' +

      '<div class="d365-card" id="rev-results-card" style="padding:0">' +
        '<div style="padding:24px;text-align:center;color:#64748B">Click "Show Revisions" to inspect snapshot history.</div>' +
      '</div>';

    function loadRevs() {
      var t = $('#rev-table-select').value;
      var rid = $('#rev-id-input').value.trim();
      if (!rid) return toast('Record ID is required', 'warn');

      API.get('/api/cms/revisions/' + encodeURIComponent(t) + '/' + encodeURIComponent(rid)).then(function (res) {
        var revs = res.revisions || [];
        var card = $('#rev-results-card');
        if (!revs.length) {
          card.innerHTML = '<div style="padding:24px;text-align:center;color:#64748B">No prior revisions recorded for <code>' + esc(t) + ' / ' + esc(rid) + '</code> yet.</div>';
          return;
        }

        card.innerHTML =
          '<table class="d365-table">' +
            '<thead><tr><th>Timestamp</th><th>Updated By</th><th>Snapshot Payload Preview</th><th>Rollback</th></tr></thead>' +
            '<tbody>' +
              revs.map(function (v, idx) {
                return '<tr>' +
                  '<td>' + formatDate(v.created_at || v.ts) + '</td>' +
                  '<td><b>' + esc(v.actor || v.updated_by || 'system') + '</b></td>' +
                  '<td style="font-family:monospace;font-size:11.5px;max-width:440px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
                    esc(JSON.stringify(v.payload || v.snapshot)) +
                  '</td>' +
                  '<td><button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-rollback-btn="' + idx + '">Rollback ⏪</button></td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>';

        card.querySelectorAll('[data-rollback-btn]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (confirm('Roll back ' + t + '/' + rid + ' to this snapshot?')) {
              API.post('/api/cms/revisions/' + encodeURIComponent(t) + '/' + encodeURIComponent(rid) + '/rollback', { revisionId: revs[Number(btn.dataset.rollbackBtn)].id })
                .then(function () {
                  toast('Successfully rolled back to snapshot! Rebuild site to deploy.', 'success');
                  refreshGlobalData().then(loadRevs);
                })
                .catch(function (e) { toast('Rollback failed: ' + (e.message || e), 'error'); });
            }
          });
        });
      }).catch(function (e) { toast('Failed to load revisions: ' + (e.message || e), 'error'); });
    }

    $('#rev-load-btn')?.addEventListener('click', loadRevs);
    if (initId) loadRevs();
  }

  function openRevisionDiffModal(table, id) {
    var modal = $('#modal-revision-diff');
    var body = $('#diff-modal-body');
    if (!modal || !body) return;

    trapFocus(modal);
    body.innerHTML = '<div style="padding:24px;text-align:center;color:#64748B">Fetching revision history for <code>' + esc(table) + '/' + esc(id) + '</code>…</div>';

    API.get('/api/cms/revisions/' + encodeURIComponent(table) + '/' + encodeURIComponent(id)).then(function (res) {
      var revs = res.revisions || [];
      if (!revs.length) {
        body.innerHTML = '<div style="padding:24px;text-align:center;color:#64748B">No previous revisions exist yet for this record. Every new save will generate an archived snapshot.</div>';
        return;
      }
      body.innerHTML =
        '<div style="margin-bottom:12px;font-size:13px">Showing <b>' + revs.length + '</b> revision snapshot(s) for <code>' + esc(table) + ' / ' + esc(id) + '</code>:</div>' +
        '<table class="d365-table">' +
          '<thead><tr><th>Date</th><th>Author</th><th>Snapshot Data</th><th>Action</th></tr></thead>' +
          '<tbody>' +
            revs.map(function (v) {
              return '<tr>' +
                '<td>' + formatDate(v.created_at || v.ts) + '</td>' +
                '<td>' + esc(v.actor || v.updated_by || 'system') + '</td>' +
                '<td style="font-family:monospace;font-size:11px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(JSON.stringify(v.payload || '')) + '</td>' +
                '<td><button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-diff-rb="' + esc(String(v.id)) + '">Rollback ⏪</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>';

      body.querySelectorAll('[data-diff-rb]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (confirm('Confirm rollback? Current state will be replaced.')) {
            /* deploy-audit D07: restore THIS snapshot — the body was {} so every row restored the newest */
            API.post('/api/cms/revisions/' + encodeURIComponent(table) + '/' + encodeURIComponent(id) + '/rollback', { revisionId: Number(btn.getAttribute('data-diff-rb')) })
              .then(function () {
                modal.classList.remove('open');
                toast('Record rolled back successfully!', 'success');
                refreshGlobalData().then(route);
              })
              .catch(function (e) { toast('Rollback failed: ' + (e.message || e), 'error'); });
          }
        });
      });
    }).catch(function (e) {
      body.innerHTML = '<div style="padding:20px;color:#A80000">Error: ' + esc(e.message || e) + '</div>';
    });
  }

  /* View: Publish Pipeline & Outbox Stream */
  /* rm(7.3-2): publish-approvals panel — the SEC-11 second-approver workstation.
     Lists publish approval requests (pending first), with Approve/Reject actions.
     The SERVER enforces distinct-user, TTL and dirty-set drift; the UI just reports. */
  function viewPublishApprovals() {
    setCommandBar({
      left: [
        { id: 'approvals-refresh', label: '⟳ Refresh', onClick: function () { viewPublishApprovals(); } },
      ],
      right: [
        { label: 'SEC-11 Dual Approval' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Publish Approvals — dual control for sensitive changes</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Publishes whose server-derived change set touches legal, announcements, hero slides, testimonials or pricing content require a SECOND, distinct staff approval before anything reaches the build queue. The requester can never approve their own request.</p>' +
      '</div>' +
      '<div class="d365-card" id="approvals-list" style="padding:0">Loading approval requests…</div>';

    API.get('/api/cms/publish-approvals')
      .then(function (r) { renderApprovals((r && r.approvals) || []); })
      .catch(function (e) {
        $('#approvals-list').innerHTML = '<div style="padding:16px;color:#B91C1C">Failed to load approvals: ' + esc(e.message || e) + '</div>';
      });

    function renderApprovals(rows) {
      var order = { pending: 0, approved: 1, rejected: 2, expired: 3 };
      rows.sort(function (a, b) { return (order[a.status] ?? 9) - (order[b.status] ?? 9); });
      if (!rows.length) {
        $('#approvals-list').innerHTML = '<div style="padding:20px;color:#64748B">No approval requests — publishes with a clean (non-sensitive) change set queue directly.</div>';
        return;
      }
      $('#approvals-list').innerHTML =
        '<table class="d365-table" style="width:100%;font-size:12.5px">' +
        '<thead><tr><th>Request</th><th>Requested by</th><th>Sensitive change set</th><th>Status</th><th>Decided</th><th></th></tr></thead><tbody>' +
        rows.map(function (a) {
          var badge = a.status === 'pending' ? 'b-gold' : a.status === 'approved' ? 'b-green' : 'b-red';
          var actions = a.status === 'pending'
            ? '<button class="d365-cmd-btn btn-primary-action" data-apr="' + a.id + '" data-dec="approve">Approve &amp; publish</button> ' +
              '<button class="d365-cmd-btn" data-apr="' + a.id + '" data-dec="reject">Reject</button>'
            : '';
          return '<tr>' +
            '<td class="nowrap">' + esc(a.id) + '</td>' +
            '<td class="nowrap">' + esc(a.requestedBy) + '</td>' +
            '<td style="max-width:340px"><span class="small muted">' + esc((a.items || []).join(', ')) + '</span></td>' +
            '<td><span class="badge ' + badge + '">' + a.status + '</span>' + (a.outboxId ? '<br><span class="small muted">' + esc(a.outboxId) + '</span>' : '') + '</td>' +
            '<td class="nowrap small">' + (a.decidedBy ? esc(a.decidedBy) : '—') + '</td>' +
            '<td class="nowrap">' + actions + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table>';

      content.querySelectorAll('[data-apr]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-apr');
          var decision = btn.getAttribute('data-dec');
          var reason = decision === 'reject' ? (window.prompt('Rejection reason (optional):') || '') : '';
          btn.disabled = true;
          API.post('/api/cms/publish-approvals/' + encodeURIComponent(id) + '/' + decision, { reason: reason })
            .then(function (res) {
              toast(decision === 'approve'
                ? ('Approved — publish ' + (res && res.outboxId ? res.outboxId : '') + ' queued for build.')
                : 'Rejected — nothing was published.', decision === 'approve' ? 'success' : 'warn');
              viewPublishApprovals();
              refreshGlobalData();
            })
            .catch(function (e) {
              btn.disabled = false;
              toast('Decision failed: ' + (e.message || e), 'error');
            });
        });
      });
    }
  }

  function viewPublishPipeline() {
    var outboxEvents = state.outbox && state.outbox.length ? state.outbox : [];
    var pendingCount = outboxEvents.filter(function (o) { return o.status === 'pending' || o.status === 'queued' || o.status === 'processing'; }).length;
    var processedCount = outboxEvents.filter(function (o) { return o.status === 'processed' || o.status === 'sent'; }).length;
    var failedCount = outboxEvents.filter(function (o) { return o.status === 'failed'; }).length;

    setCommandBar({
      left: [
        { label: 'Trigger Build & Purge', icon: 'rocket', primary: true, onClick: openPublishModal },
        { label: 'Refresh Outbox', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewPublishPipeline); } }
      ],
      right: [
        { label: outboxEvents.length + ' Total Pipeline Events' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px 20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">ADR-13 Static Site Generation & Outbox Pipeline</h2>' +
            '<p style="font-size:12.5px;color:#64748B;margin:0">Transactional Outbox queue streaming site rebuilds, CDN invalidations, and system event dispatches directly from PostgreSQL.</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="d365-cmd-btn btn-primary-action" id="pipe-pub-btn">Trigger Full Site Build Now 🚀</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="d365-kpi-grid mb-4">' +
        '<div class="d365-kpi-card kpi-accent-green">' +
          '<span class="d365-kpi-label">Processed Events</span>' +
          '<span class="d365-kpi-val">' + processedCount + '</span>' +
          '<span class="d365-kpi-sub">Successfully dispatched</span>' +
        '</div>' +
        '<div class="d365-kpi-card kpi-accent-blue">' +
          '<span class="d365-kpi-label">Total Outbox Queue</span>' +
          '<span class="d365-kpi-val">' + outboxEvents.length + '</span>' +
          '<span class="d365-kpi-sub">Retained in PostgreSQL outbox</span>' +
        '</div>' +
        '<div class="d365-kpi-card ' + (pendingCount > 0 ? 'kpi-accent-gold' : '') + '">' +
          '<span class="d365-kpi-label">Pending Dispatch</span>' +
          '<span class="d365-kpi-val">' + pendingCount + '</span>' +
          '<span class="d365-kpi-sub">Awaiting worker cycle</span>' +
        '</div>' +
        '<div class="d365-kpi-card ' + (failedCount > 0 ? 'kpi-accent-red' : '') + '">' +
          '<span class="d365-kpi-label">Failed Events</span>' +
          '<span class="d365-kpi-val">' + failedCount + '</span>' +
          '<span class="d365-kpi-sub">Require manual retry</span>' +
        '</div>' +
      '</div>' +

      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead>' +
            '<tr>' +
              '<th style="width:140px">Timestamp</th>' +
              '<th>Channel / Target</th>' +
              '<th>Event Subject / Type</th>' +
              '<th>Payload Preview</th>' +
              '<th style="text-align:right">Status</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            (!outboxEvents.length ?
              '<tr><td colspan="5" style="padding:28px;text-align:center;color:#64748B">No outbox events recorded yet.</td></tr>' :
              outboxEvents.map(function (o) {
                var statusCls = o.status === 'processed' || o.status === 'sent' ? 'badge-event-processed' : (o.status === 'failed' ? 'badge-event-failed' : 'badge-event-pending');
                var payloadStr = '';
                if (o.meta) payloadStr = typeof o.meta === 'string' ? o.meta : JSON.stringify(o.meta);
                else if (o.body) payloadStr = o.body;

                return '<tr>' +
                  '<td style="font-size:11.5px">' + formatDate(o.created_at) + '</td>' +
                  '<td>' +
                    '<span class="entity-tag" style="background:#EFF6FC;color:#006CBE">' + esc(o.channel || 'ssg') + '</span> ' +
                    '<span style="font-size:12px;font-weight:600">' + esc(o.to_addr || 'edge') + '</span>' +
                  '</td>' +
                  '<td><b>' + esc(o.subject || 'SSG Build & Invalidate') + '</b></td>' +
                  '<td style="font-family:monospace;font-size:11.5px;max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(payloadStr) + '">' +
                    esc(payloadStr) +
                  '</td>' +
                  '<td style="text-align:right">' +
                    '<span class="' + statusCls + '">' + esc(o.status || 'pending').toUpperCase() + '</span>' +
                    (o.status === 'failed' ? ' <button class="d365-cmd-btn" style="font-size:11px;padding:2px 8px" data-retry="' + esc(o.id) + '" title="Re-queue this failed event">Retry</button>' : '') +
                  '</td>' +
                '</tr>';
              }).join('')) +
          '</tbody>' +
        '</table>' +
      '</div>';

    $('#pipe-pub-btn')?.addEventListener('click', openPublishModal);
    // rm(5.3-2): failed-event retry — re-queues via the API, then refreshes
    $('#content').querySelectorAll('button[data-retry]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-retry');
        b.disabled = true; b.textContent = 'Retrying…';
        API.post('/api/cms/outbox/' + encodeURIComponent(id) + '/retry').then(function () {
          toast('Event ' + id + ' re-queued — the worker will process it shortly', 'success');
          refreshGlobalData().then(viewPublishPipeline);
        }).catch(function (e) {
          toast('Retry failed: ' + (e.message || e), 'error');
          b.disabled = false; b.textContent = 'Retry';
        });
      });
    });
  }

  function openPublishModal() {
    var modal = $('#modal-publish-confirm');
    if (!modal) return;
    trapFocus(modal);
  }

  function handlePublishExecute() {
    var btn = $('#btn-pub-execute');
    btn.disabled = true;
    btn.textContent = 'Triggering SSG Build…';
    var purgeAll = $('#pub-purge-all') ? $('#pub-purge-all').checked : true;

    API.post('/api/cms/publish', {
      entities: [{ entity: 'site', entity_id: 'all' }],
      purgeAll: purgeAll
    })
      .then(function (res) {
        $('#modal-publish-confirm').classList.remove('open');
        if (res && res.pending) {
          /* rm(7.3-2): 202 — the dirty set is sensitive; a second approver must sign off */
          toast('Awaiting second approval — request ' + res.approvalId + ' created (' + (res.changeSet || []).join(', ') + '). Nothing is published yet.', 'warn');
        } else {
          toast('Publish event dispatched to outbox! Site rebuild initiated.', 'success');
        }
        refreshGlobalData();
      })
      .catch(function (e) {
        toast('Publish failed: ' + (e.message || e), 'error');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Confirm & Trigger Publish';
      });
  }

  function handleEmergencyPublishExecute() {
    var reason = ($('#em-reason')?.value || '').trim();
    var secondApprover = ($('#em-second-approver')?.value || '').trim();
    if (reason.length < 10) {
      return toast('Business reason must be at least 10 characters', 'warn');
    }
    var btn = $('#btn-emergency-pub-execute');
    if (btn) { btn.disabled = true; btn.textContent = 'Executing Dual Approval…'; }
    API.post('/api/cms/emergency-publish', {
      entity: 'site',
      entityId: 'emergency_broadcast',
      payload: { reason: reason, broadcastAt: new Date().toISOString() },
      secondApproverEmail: secondApprover
    }).then(function () {
      toast('Emergency publish approved & executed!', 'success');
      closeModals();
      refreshGlobalData();
    }).catch(function (e) {
      toast('Emergency publish failed: ' + (e.message || e), 'error');
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Execute Emergency Publish ⚡'; }
    });
  }

  /* View: Audit Trail */
  function viewAuditTrail() {
    setCommandBar({
      left: [
        { label: 'Refresh Audit Stream', icon: '↻', onClick: function () { refreshGlobalData().then(viewAuditTrail); } }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Enterprise Security & Change Audit Trail</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Immutable audit logs recording logins, staff actions, content mutations, and rollbacks.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>' +
          '<tbody>' +
            state.auditLogs.slice(0, 100).map(function (a) {
              return '<tr>' +
                '<td style="font-size:11.5px">' + formatDate(a.ts) + '</td>' +
                '<td><b>' + esc(a.actor) + '</b></td>' +
                '<td><span class="entity-tag">' + esc(a.action) + '</span></td>' +
                '<td style="font-family:monospace;font-size:12px">' + esc(a.target || '—') + '</td>' +
                '<td style="font-size:12px;color:#64748B">' + esc(a.details || '') + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  /* View: Localization Audit */
  function viewLocAudit() {
    setCommandBar({
      left: [
        { label: 'Refresh Parity Audit', icon: 'refresh', id: 'cmd-refresh-loc', onClick: viewLocAudit },
        { label: 'Push Live', icon: 'rocket', id: 'cmd-push-loc', onClick: openPublishModal }
      ],
      right: [
        { label: 'Live PostgreSQL Database Audit' },
        { label: 'View Arabic Public Site', icon: 'ext', id: 'cmd-open-ar-site', onClick: function () { window.open(siteUrl('/ar/'), '_blank'); } }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Arabic / English Parity & Localization Audit</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Live database audit comparing English vs Arabic translations across legal policies, content blocks, and solution lines.</p>' +
      '</div>' +
      '<div id="loc-audit-metrics" style="padding:24px;text-align:center;color:#64748B">Calculating parity across PostgreSQL rows…</div>';

    API.get('/api/cms/loc-audit').then(function (audit) {
      var container = $('#loc-audit-metrics');
      if (!container) return;
      var pol = audit.policies || { en: 7, ar: 7, pct: 100 };
      var cb = audit.contentBlocks || { en: 30, ar: 3, pct: 10 };
      var overall = audit.overallParityPct || 25;

      container.outerHTML =
        '<div class="d365-kpi-grid mb-4">' +
          '<div class="d365-kpi-card kpi-accent-green">' +
            '<span class="d365-kpi-label">Legal Policies AR</span>' +
            '<span class="d365-kpi-val">' + pol.pct + '%</span>' +
            '<span class="d365-kpi-sub">' + pol.ar + ' of ' + pol.en + ' policies translated</span>' +
          '</div>' +
          '<div class="d365-kpi-card ' + (cb.pct < 50 ? 'kpi-accent-gold' : 'kpi-accent-green') + '">' +
            '<span class="d365-kpi-label">Content Blocks AR</span>' +
            '<span class="d365-kpi-val">' + cb.pct + '%</span>' +
            '<span class="d365-kpi-sub">' + cb.ar + ' of ' + cb.en + ' blocks translated</span>' +
          '</div>' +
          '<div class="d365-kpi-card kpi-accent-blue">' +
            '<span class="d365-kpi-label">Overall Parity Score</span>' +
            '<span class="d365-kpi-val">' + overall + '%</span>' +
            '<span class="d365-kpi-sub">Weighted across all entities</span>' +
          '</div>' +
        '</div>' +
        '<div class="d365-table-wrap d365-card">' +
          '<table class="d365-table">' +
            '<thead><tr><th>Content Domain</th><th>English Records</th><th>Arabic Records</th><th>Parity Status</th></tr></thead>' +
            '<tbody>' +
              '<tr><td><b>Legal Policies & Terms</b></td><td>' + pol.en + '</td><td>' + pol.ar + '</td><td><span class="kpi3-pill pill-up">' + pol.pct + '% Complete</span></td></tr>' +
              '<tr><td><b>Corporate Content Blocks</b></td><td>' + cb.en + '</td><td>' + cb.ar + '</td><td><span class="kpi3-pill ' + (cb.pct >= 50 ? 'pill-up' : 'pill-warn') + '">' + cb.pct + '% Translation</span></td></tr>' +
              '<tr><td><b>Hardware Catalog (Products)</b></td><td>' + (audit.products ? audit.products.count : 81) + '</td><td>Bilingual SKUs</td><td><span class="kpi3-pill pill-up">100% Shared</span></td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>';
    }).catch(function (e) {
      var container = $('#loc-audit-metrics');
      if (container) container.innerHTML = '<div style="color:#A80000;padding:20px">Error loading audit: ' + esc(e.message || e) + '</div>';
    });
  }

  /* View: User & Role Management (RBAC) */
  function viewUsersManagement() {
    setCommandBar({
      left: [
        { label: 'Provision Staff User', icon: '＋', primary: true, onClick: function () { openUserModal(null); } },
        { label: 'Refresh Directory', icon: '↻', onClick: function () { refreshGlobalData().then(viewUsersManagement); } }
      ],
      right: [
        { label: state.users.length + ' Staff Accounts', id: 'cmd-user-count' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Staff Directory & Role-Based Access Control</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Manage staff accounts, assign CMS security roles, reset credentials, or deactivate access.</p>' +
      '</div>' +

      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>Name</th><th>Email</th><th>Assigned Role</th><th>MFA State</th><th>Status</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            state.users.map(function (u) {
              var roleBadge = u.role === 'super_admin' ?
                '<span class="entity-tag" style="background:#FEE2E2;color:#991B1B">Super Admin</span>' :
                (u.role === 'reviewer' ?
                  '<span class="entity-tag" style="background:#EFF6FC;color:#006CBE">Reviewer / Author</span>' :
                  '<span class="entity-tag" style="background:#F1F5F9;color:#475569">Viewer / Auditor</span>');
              return '<tr>' +
                '<td><b>' + esc(u.name || 'Staff User') + '</b></td>' +
                '<td>' + esc(u.email) + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + (u.hasTotp ? '🔐 Enabled' : '<span style="color:#64748B">Password Only</span>') + '</td>' +
                '<td>' + (u.active ? '<span style="color:#107C41;font-weight:600">● Active</span>' : '<span style="color:#A80000;font-weight:600">● Inactive</span>') + '</td>' +
                '<td>' +
                  '<button class="d365-cmd-btn" style="font-size:11px" data-user-edit="' + esc(u.id) + '">Edit ✏️</button> ' +
                  '<button class="d365-cmd-btn" style="font-size:11px" data-user-reset="' + esc(u.id) + '">Reset Key 🔑</button> ' +
                  (u.active ? '<button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-user-deact="' + esc(u.id) + '">Deactivate</button>' : '') +
                '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

    $$('[data-user-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = btn.getAttribute('data-user-edit');
        var user = state.users.find(function (u) { return u.id === uid; });
        if (user) openUserModal(user);
      });
    });

    $$('[data-user-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = btn.getAttribute('data-user-reset');
        if (confirm('Generate a temporary password reset token for this user?')) {
          API.resetPassword(uid).then(function (res) {
            alert('Password reset successful!\nTemporary password: ' + (res.temporaryPassword || res.tempPassword || 'Generated (check outbox)'));
            refreshGlobalData();
          }).catch(function (e) { toast('Reset failed: ' + (e.message || e), 'error'); });
        }
      });
    });

    $$('[data-user-deact]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var uid = btn.getAttribute('data-user-deact');
        if (confirm('Deactivate this staff account immediately?')) {
          API.deactivateUser(uid).then(function () {
            toast('Account deactivated', 'warn');
            refreshGlobalData().then(viewUsersManagement);
          }).catch(function (e) { toast('Deactivation failed: ' + (e.message || e), 'error'); });
        }
      });
    });
  }

  function openUserModal(user) {
    var modal = $('#modal-user-edit');
    if (!modal) return;

    $('#user-modal-title').textContent = user ? 'Edit Staff Account' : 'Provision Staff Account';
    $('#user-edit-id').value = user ? user.id : '';
    $('#user-edit-name').value = user ? user.name : '';
    $('#user-edit-email').value = user ? user.email : '';
    $('#user-edit-role').value = user ? user.role : 'reviewer';
    $('#user-edit-active').checked = user ? user.active : true;

    $('#user-password-container').style.display = user ? 'none' : 'block';
    trapFocus(modal);
  }

  function handleUserSave() {
    var id = $('#user-edit-id').value;
    var name = $('#user-edit-name').value.trim();
    var email = $('#user-edit-email').value.trim();
    var role = $('#user-edit-role').value;
    var active = $('#user-edit-active').checked;
    var pass = $('#user-edit-pass').value;

    if (!name || !email) return toast('Name and email are required', 'warn');

    if (id) {
      API.updateUser(id, { name: name, role: role, active: active })
        .then(function () {
          $('#modal-user-edit').classList.remove('open');
          toast('Staff account updated successfully', 'success');
          refreshGlobalData().then(viewUsersManagement);
        })
        .catch(function (e) { toast('Save failed: ' + (e.message || e), 'error'); });
    } else {
      if (!pass || pass.length < 4) return toast('Initial password must be at least 4 characters', 'warn');
      API.createUser({ name: name, email: email, role: role, password: pass })
        .then(function () {
          $('#modal-user-edit').classList.remove('open');
          toast('Staff user provisioned successfully', 'success');
          refreshGlobalData().then(viewUsersManagement);
        })
        .catch(function (e) { toast('Creation failed: ' + (e.message || e), 'error'); });
    }
  }

  /* View: RBAC Matrix */
  function viewRbacMatrix() {
    setCommandBar({
      left: [
        { label: 'Refresh Matrix', icon: 'refresh', id: 'cmd-refresh-rbac', onClick: viewRbacMatrix },
        { label: 'Manage Staff Directory', icon: 'user', id: 'cmd-manage-users', onClick: function () { location.hash = '#/users'; } }
      ],
      right: [
        { label: 'Dynamic Privilege Grid (FR-A-002)' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Role-Based Access Control (RBAC) Privilege Matrix</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Live permissions mapping dynamically sourced from server security policy (FR-A-002).</p>' +
      '</div>' +
      '<div id="rbac-matrix-container" style="padding:24px;text-align:center;color:#64748B">Loading live RBAC matrix from gateway…</div>';

    API.get('/api/cms/rbac-matrix').then(function (res) {
      var roles = res.roles || {};
      var allPerms = [
        { key: 'read', label: 'Read System Data & Catalog' },
        { key: 'notes', label: 'CMS Content Edits & Drafts' },
        { key: 'decide', label: 'Publish to Production & Approval' },
        { key: 'query', label: 'KYC & Partner Invoicing Operations' },
        { key: 'reopen', label: 'Reopen Terminal Submissions' },
        { key: 'manage_invites', label: 'User Provisioning & Staff Administration' },
        { key: 'read_audit', label: 'Audit Trail Inspection' },
        { key: 'view_pii', label: 'Decrypted PII & Data Export' }
      ];

      var container = $('#rbac-matrix-container');
      if (!container) return;

      container.outerHTML =
        '<div class="d365-card" style="padding:0">' +
          '<table class="d365-table">' +
            '<thead>' +
              '<tr><th>Operational Privilege</th><th>Super Admin</th><th>Reviewer / Author</th><th>Viewer / Auditor</th></tr>' +
            '</thead>' +
            '<tbody>' +
              allPerms.map(function (p) {
                var saHas = (roles.super_admin || []).includes(p.key);
                var revHas = (roles.reviewer || []).includes(p.key);
                var viewHas = (roles.viewer || []).includes(p.key);
                return '<tr>' +
                  '<td><b>' + esc(p.label) + '</b> <code style="font-size:11px;color:#64748B">(' + esc(p.key) + ')</code></td>' +
                  '<td>' + (saHas ? '<span class="kpi3-pill pill-up">Allowed</span>' : '<span class="kpi3-pill pill-bad">Denied</span>') + '</td>' +
                  '<td>' + (revHas ? '<span class="kpi3-pill pill-up">Allowed</span>' : '<span class="kpi3-pill pill-bad">Denied</span>') + '</td>' +
                  '<td>' + (viewHas ? '<span class="kpi3-pill pill-up">Allowed</span>' : '<span class="kpi3-pill pill-bad">Denied</span>') + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
    }).catch(function (e) {
      var container = $('#rbac-matrix-container');
      if (container) container.innerHTML = '<div style="padding:20px;color:#A80000">Failed to load live RBAC policy: ' + esc(e.message || e) + '</div>';
    });
  }

  /* View: Active Security Sessions */
  function viewActiveSessions() {
    setCommandBar({
      left: [
        { label: 'Refresh Sessions', icon: 'refresh', id: 'cmd-refresh-sessions', onClick: function () { refreshGlobalData().then(viewActiveSessions); } }
      ],
      right: [
        { label: (state.sessions ? state.sessions.length : 0) + ' Active Security Sessions' }
      ]
    });

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">Active Security Sessions & Devices</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Active staff sessions with 20-minute idle expiration. Administrators can force logout any session.</p>' +
      '</div>' +
      '<div class="d365-table-wrap d365-card">' +
        '<table class="d365-table">' +
          '<thead><tr><th>Staff Account</th><th>Session SID</th><th>Started</th><th>Last Activity</th><th>Expires At</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            state.sessions.map(function (s) {
              var sidPrefix = s.fullSidPrefix || String(s.sid).replace(/[…\s.]+$/, '');
              return '<tr>' +
                '<td><b>' + esc(s.user || s.userId) + '</b> <span class="entity-tag" style="font-size:11px;margin-left:4px">' + esc(s.role || 'staff') + '</span></td>' +
                '<td style="font-family:monospace;font-size:11.5px">' + esc(s.sid) + '</td>' +
                '<td>' + formatDate(s.createdAt) + '</td>' +
                '<td>' + formatDate(s.lastSeen) + '</td>' +
                '<td>' + formatDate(s.expiresAt) + '</td>' +
                '<td><button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-force-sid="' + esc(sidPrefix) + '">Force Logout</button></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

    $$('[data-force-sid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-force-sid');
        if (confirm('Force terminate this session immediately?')) {
          API.forceLogout(sid).then(function () {
            toast('Session terminated', 'warn');
            refreshGlobalData().then(viewActiveSessions);
          }).catch(function (e) { toast('Action failed: ' + (e.message || e), 'error'); });
        }
      });
    });
  }

  /* View: Telemetry & System Health */
  function viewTelemetry() {
    setCommandBar({
      left: [
        { label: 'Refresh', icon: 'refresh', id: 'cmd-refresh', onClick: function () { refreshGlobalData().then(function () { probePublicSite(state.telemetry && state.telemetry.publicSiteUrl).then(viewTelemetry); }); } }
      ],
      right: []
    });
    var t = state.telemetry || {};
    var db = t.database || {}, gw = t.gateway || {}, ssg = t.ssg || {};
    var probe = state.ssgProbe;
    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:18px">' +
        '<h2 style="font-size:18px;margin:0 0 4px;color:var(--d365-navy)">System Telemetry &amp; Platform Diagnostics</h2>' +
        '<p class="dash-card-note" style="margin:0">Every value below is measured at request time — statuses derive from live probes, not asserted constants. Last refresh ' + (state.lastRefreshed ? esc(ago(state.lastRefreshed) || '') : 'unknown') + '.</p>' +
      '</div>' +
      '<div class="kpi3-grid">' +
        kpiCard({
          icon: 'db', label: 'PostgreSQL',
          value: db.status === 'healthy' ? 'Operational' : (db.status === 'unavailable' ? 'Unreachable' : 'Unknown'),
          pill: db.latencyMs != null ? db.latencyMs + ' ms query' : 'no latency',
          pillCls: db.status === 'healthy' ? 'pill-up' : 'pill-bad',
          tone: db.status === 'healthy' ? 'ok' : 'bad',
          sub: 'count probe on products table' + (t.productCount != null ? ' · ' + t.productCount + ' rows counted' : ' · count failed'),
          href: '#/blocks', linkLabel: 'Inspect blocks'
        }) +
        kpiCard({
          icon: 'server', label: 'API Gateway',
          value: 'Operational',
          pill: 'uptime ' + fmtUptime(gw.uptime),
          pillCls: 'pill-up', tone: 'ok',
          sub: 'this page was served by the gateway — reachability proven by rendering',
          href: '#/active-sessions', linkLabel: 'Active sessions'
        }) +
        kpiCard({
          icon: 'globe', label: 'Public Site (SSG)',
          value: probe ? (probe.reachable ? 'Operational' : 'Unreachable') : (ssg.status === 'unprobed' ? 'Probing…' : esc(ssg.status)),
          pill: probe ? probe.latencyMs + ' ms probe' : 'browser probe',
          pillCls: probe ? (probe.reachable ? 'pill-up' : 'pill-bad') : 'pill-neutral',
          tone: probe ? (probe.reachable ? 'ok' : 'bad') : 'neutral',
          sub: 'reachability measured from the editor browser (server-side status: ' + esc(ssg.status || 'unknown') + ')',
          href: (t.publicSiteUrl || siteUrl('/')) + '', linkLabel: 'Open site'
        }) +
        kpiCard({
          icon: 'history', label: 'Audit Ledger',
          value: state.auditLogs.length,
          pill: state.loadErrors.audit ? 'unavailable' : 'live',
          pillCls: state.loadErrors.audit ? 'pill-bad' : 'pill-neutral',
          sub: 'security & change events retained in PostgreSQL',
          href: '#/audit-trail', linkLabel: 'Audit trail'
        }) +
      '</div>' +
      '<div class="d365-card mb-4">' +
        '<div class="d365-card-header"><h3 class="dash-h2">' + ic('chart', 15) + ' Raw Telemetry Payload</h3>' +
        '<span class="dash-card-note">exactly what /api/cms/telemetry returned</span></div>' +
        '<div class="d365-card-body"><pre class="dash-rawjson">' + esc(JSON.stringify(t, null, 2)) + '</pre></div>' +
      '</div>';

    if (!probe) {
      probePublicSite(t.publicSiteUrl).then(function () { if (state.currentView === 'system-telemetry') viewTelemetry(); });
    }
  }

  /* ==========================================================================
     5. Quick Create & Global Search Handlers
     ========================================================================== */
  function openQuickCreate(type) {
    var modal = $('#modal-quick-create');
    if (!modal) return;
    if (type) $('#qc-type').value = type;
    $('#qc-id').value = '';
    $('#qc-title-field').value = '';
    $('#qc-desc').value = '';
    trapFocus(modal);
  }

  function handleQuickCreateSubmit() {
    var type = $('#qc-type').value;
    var id = $('#qc-id').value.trim();
    var cat = $('#qc-cat').value.trim();
    var title = $('#qc-title-field').value.trim();
    var desc = $('#qc-desc').value.trim();

    if (!id || !title) return toast('Identifier and title are required', 'warn');

    if (type === 'slide') {
      /* deploy-audit: max(idx)+1 — length+1 overwrote an existing slide whenever idx had gaps */
      var nextIdx = state.slides.reduce(function (m, sl) { return Math.max(m, Number(sl.idx) || 0); }, 0) + 1;
      API.put('/api/cms/slides/' + nextIdx, {
        idx: nextIdx,
        kick: cat || 'New Campaign',
        headline: title,
        sub: desc || 'Overview',
        cta_label: 'Learn More',
        cta_href: '/products',
        active: true
      }).then(function () {
        closeModals();
        toast('Hero slide created!', 'success');
        refreshGlobalData().then(function () { location.hash = '#/slides'; });
      });
    } else if (type === 'policy') {
      API.put('/api/cms/policies/' + encodeURIComponent(id), { title: title, body: desc || 'Initial clause text.' })
        .then(function () {
          closeModals();
          toast('Policy created!', 'success');
          refreshGlobalData().then(function () { location.hash = '#/policies'; });
        });
    } else if (type === 'insight') {
      var slug = id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      var payload = {
        slug: slug,
        t: title,
        x: desc || ('Overview of ' + title),
        cat: cat ? cat.toUpperCase() : 'GENERAL',
        mins: 5,
        at: new Date().toISOString().slice(0, 10),
        author: 'Simal Editorial Desk',
        tags: [cat ? cat.toLowerCase() : 'general', 'insights'],
        body: [
          ['Executive Summary', [desc || ('Key findings and strategic overview of ' + title + '.')]],
          ['Operational Context', ['Detailed implementation guidelines, technical considerations, and best practices.']]
        ],
        rel: [],
        cta: ['Talk to the desk', '/contact']
      };
      API.put('/api/cms/blocks/insight/' + encodeURIComponent(slug), { payload: payload })
        .then(function () {
          closeModals();
          toast('Insight article draft created safely!', 'success');
          refreshGlobalData().then(function () {
            location.hash = '#/workspace-editorial';
          });
        });
    } else {
      /* deploy-audit: "New Block" passed type 'block', which had no option and no branch, so it
       * always ended in "Unsupported type". A block's entity is the Category field (default site). */
      var blockEntity = /^[a-z][a-z_]{1,40}$/.test(cat) ? cat : 'site';
      var entity = type === 'it_solution' ? 'it_solution' : (type === 'block' ? blockEntity : null);
      if (!entity) { toast('Choose an asset type', 'error'); return; }
      /* deploy-audit C8: IT solution pages read d (description); x left new lines blank */
      var qcPayload = entity === 'it_solution'
        ? { id: id, t: title, d: desc || ('Overview of ' + title), cat: cat || 'General', at: new Date().toISOString().slice(0, 10) }
        : { t: title, x: desc || '' };
      API.put('/api/cms/blocks/' + encodeURIComponent(entity) + '/' + encodeURIComponent(id) + '?lang=' + (state.blockLang || 'en'), { payload: qcPayload })
        .then(function () {
          closeModals();
          toast('Record created successfully!', 'success');
          refreshGlobalData().then(function () {
            location.hash = '#/blocks';
            setTimeout(function () { openBlockEditor(entity, id); }, 200);
          });
        });
    }
  }

  function performGlobalSearch(q) {
    if (!q) return;
    var query = q.toLowerCase();

    // Check if matching hardware products
    var prodMatch = (state.products || []).some(function (p) {
      return (p.name && p.name.toLowerCase().indexOf(query) !== -1) ||
             (p.slug && p.slug.toLowerCase().indexOf(query) !== -1) ||
             (p.sku && p.sku.toLowerCase().indexOf(query) !== -1) ||
             (p.brand && p.brand.toLowerCase().indexOf(query) !== -1) ||
             (p.cat && p.cat.toLowerCase().indexOf(query) !== -1);
    });

    if (prodMatch) {
      location.hash = '#/products-catalog';
      setTimeout(function () {
        var pSearch = $('#prod-filter-search');
        if (pSearch) {
          pSearch.value = q;
          pSearch.dispatchEvent(new Event('input'));
        }
      }, 150);
      return;
    }

    // Check if matching staff user
    var userMatch = (state.users || []).some(function (u) {
      return (u.email && u.email.toLowerCase().indexOf(query) !== -1) ||
             (u.name && u.name.toLowerCase().indexOf(query) !== -1);
    });
    if (userMatch) {
      location.hash = '#/users-management';
      return;
    }

    // Default to content blocks
    location.hash = '#/blocks';
    setTimeout(function () {
      var searchInput = $('#block-search');
      if (searchInput) {
        searchInput.value = q;
        searchInput.dispatchEvent(new Event('input'));
      }
    }, 150);
  }

  /* View: Top Announcement Bar Manager */
  function viewAnnouncements() {
    setCommandBar({
      left: [
        { label: 'Save Announcement', icon: 'save', primary: true, id: 'cmd-save-announcement', onClick: handleAnnouncementSave },
        { label: 'Push Live', icon: 'rocket', onClick: openPublishModal },
        { label: 'Refresh Data', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewAnnouncements); } }
      ],
      right: [
        { label: 'View Public Site', icon: 'ext', onClick: function () { window.open(siteUrl('/'), '_blank'); } }
      ]
    });

    var ann = (state.announcements && state.announcements[0]) || {
      id: 1,
      text: '⚡ Gen5 is here — Crucial P510 now in Dubai stock.',
      cta_href: '/products/crucial-p510-nvme-ssd',
      cta_label: 'See the SKU & RFQ channel pricing →',
      active: true
    };

    var content = $('#content');
    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:16px 20px;background:#F8FAFC;border-left:4px solid var(--d365-primary)">' +
        '<h2 style="font-size:18px;margin:0 0 6px;color:var(--d365-navy)">Top Announcement & Promotional Bar</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Controls the global promo strip displayed at the top of all public pages. Supports dynamic message text, destination link, customizable call-to-action button, live preview simulator, and 1-click rollback.</p>' +
      '</div>' +

      '<!-- Live Simulator Banner -->' +
      '<div class="d365-card mb-4" style="padding:20px;background:#0B1F38;color:#FFFFFF;border-radius:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
          '<span style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:#94A3B8;text-transform:uppercase">Live Top Banner Simulator</span>' +
          '<span id="ann-sim-status" style="font-size:11px;padding:2px 8px;border-radius:999px;' + (ann.active ? 'background:#107C41;color:#fff' : 'background:#64748B;color:#fff') + '">' +
            (ann.active ? '● LIVE ON SITE' : '○ INACTIVE') +
          '</span>' +
        '</div>' +
        '<div id="ann-sim-bar" style="background:linear-gradient(90deg, #F59E0B 0%, #D97706 100%);color:#0F172A;padding:12px 24px;border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">' +
          '<span id="ann-sim-text" style="font-size:13.5px;font-weight:700">' + esc(ann.text || '') + '</span>' +
          '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0">' +
            '<a id="ann-sim-link" href="' + esc(ann.cta_href || '#') + '" target="_blank" style="background:#0F172A;color:#FFFFFF;padding:6px 14px;border-radius:4px;font-size:12px;font-weight:700;text-decoration:none;display:inline-block">' + esc(ann.cta_label || 'See the SKU & RFQ channel pricing →') + '</a>' +
            '<button style="background:transparent;border:none;color:#0F172A;font-weight:700;font-size:14px;cursor:pointer">✕</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Edit Form Card -->' +
      '<div class="d365-card" style="padding:22px;margin-bottom:24px">' +
        '<h3 style="font-size:15px;color:var(--d365-navy);margin:0 0 16px;font-weight:700">Banner Configuration & Dispatch</h3>' +
        '<div class="d365-form-field mb-3">' +
          '<label for="ann-input-text">Announcement Display Text <span class="req">*</span></label>' +
          '<textarea id="ann-input-text" rows="2" placeholder="e.g. ⚡ Gen5 is here — Crucial P510 now in Dubai stock.">' + esc(ann.text || '') + '</textarea>' +
          '<small style="color:#64748B;font-size:11px">Rendered on the left side of the top header bar across all corporate pages.</small>' +
        '</div>' +
        '<div class="d365-field-row">' +
          '<div class="d365-form-field">' +
            '<label for="ann-input-href">Target Destination URL</label>' +
            '<input type="text" id="ann-input-href" value="' + esc(ann.cta_href || '') + '" placeholder="e.g. /products/crucial-p510-nvme-ssd or /contact">' +
          '</div>' +
          '<div class="d365-form-field">' +
            '<label for="ann-input-label">Call-To-Action Button Label</label>' +
            '<input type="text" id="ann-input-label" value="' + esc(ann.cta_label || 'See the SKU & RFQ channel pricing →') + '" placeholder="e.g. See the SKU & RFQ channel pricing →">' +
          '</div>' +
        '</div>' +
        '<div class="d365-field-row" style="margin-top:12px;align-items:center">' +
          '<div class="d365-form-field">' +
            '<label style="display:flex;align-items:center;gap:10px;cursor:pointer">' +
              '<input type="checkbox" id="ann-input-active" ' + (ann.active ? 'checked' : '') + ' style="width:auto;transform:scale(1.2)">' +
              '<span style="font-weight:600">Active (Rendered on Public Website)</span>' +
            '</label>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<button class="d365-cmd-btn btn-primary-action" id="btn-save-announcement" style="padding:8px 20px;font-size:13px">Save Changes & Snapshot Revision 💾</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Revisions Card -->' +
      '<div class="d365-card" style="padding:22px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<h3 style="font-size:15px;color:var(--d365-navy);margin:0;font-weight:700">Audit Snapshots & Version History</h3>' +
          '<span style="font-size:11.5px;color:#64748B">Table: announcements / Record: 1</span>' +
        '</div>' +
        '<div id="ann-revisions-container"><span style="color:#64748B;font-size:12px">Loading revision history…</span></div>' +
      '</div>';

    function updateSimulator() {
      var txt = $('#ann-input-text')?.value || '';
      var href = $('#ann-input-href')?.value || '#';
      var lbl = $('#ann-input-label')?.value || 'See details →';
      var active = $('#ann-input-active')?.checked;

      if ($('#ann-sim-text')) $('#ann-sim-text').textContent = txt;
      if ($('#ann-sim-link')) {
        $('#ann-sim-link').textContent = lbl;
        $('#ann-sim-link').href = href;
      }
      if ($('#ann-sim-status')) {
        $('#ann-sim-status').style.background = active ? '#107C41' : '#64748B';
        $('#ann-sim-status').textContent = active ? '● LIVE ON SITE' : '○ INACTIVE';
      }
    }

    $('#ann-input-text')?.addEventListener('input', updateSimulator);
    $('#ann-input-href')?.addEventListener('input', updateSimulator);
    $('#ann-input-label')?.addEventListener('input', updateSimulator);
    $('#ann-input-active')?.addEventListener('change', updateSimulator);

    $('#btn-save-announcement')?.addEventListener('click', handleAnnouncementSave);

    loadAnnouncementRevisions();
  }

  function handleAnnouncementSave() {
    var text = $('#ann-input-text')?.value.trim();
    if (!text) return toast('Announcement text is required', 'warn');
    var cta_href = $('#ann-input-href')?.value.trim();
    var cta_label = $('#ann-input-label')?.value.trim();
    var active = $('#ann-input-active')?.checked;

    var saveBtn = $('#btn-save-announcement');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    API.put('/api/cms/announcements/1', {
      text: text,
      cta_href: cta_href,
      cta_label: cta_label,
      active: active
    }).then(function (res) {
      toast('Announcement saved with revision snapshot!', 'success');
      state.announcements = [res];
      loadAnnouncementRevisions();
    }).catch(function (err) {
      toast('Save failed: ' + (err.message || err), 'error');
    }).finally(function () {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes & Snapshot Revision 💾'; }
    });
  }

  function loadAnnouncementRevisions() {
    var container = $('#ann-revisions-container');
    if (!container) return;
    API.get('/api/cms/revisions/announcements/1').then(function (res) {
      var revs = (res && (res.revisions || (Array.isArray(res) ? res : []))) || [];
      if (!revs.length) {
        container.innerHTML = '<span style="color:#64748B;font-size:12px">No previous revisions recorded yet. Revisions are created on every write.</span>';
        return;
      }
      var html = '<table class="d365-table" style="font-size:12px">' +
        '<thead><tr><th>Timestamp</th><th>Editor</th><th>Text Snapshot</th><th>Status</th><th>Actions</th></tr></thead>' +
        '<tbody>';
      revs.forEach(function (r) {
        var p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
        html += '<tr>' +
          '<td>' + formatDate(r.created_at) + '</td>' +
          '<td><b>' + esc(r.actor || 'system') + '</b></td>' +
          '<td>' + esc((p.text || '').slice(0, 80)) + (p.text && p.text.length > 80 ? '…' : '') + '</td>' +
          '<td>' + (p.active ? '<span class="entity-tag" style="background:#DFF6DD;color:#107C41">Active</span>' : '<span class="entity-tag" style="background:#F1F5F9;color:#64748B">Inactive</span>') + '</td>' +
          '<td><button class="d365-cmd-btn" style="font-size:11px;padding:2px 8px" data-ann-rollback="' + r.created_at + '">Rollback ⏪</button></td>' +
        '</tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;

      $$('[data-ann-rollback]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Roll back announcement to previous version?')) return;
          API.post('/api/cms/rollback', { table: 'announcements', id: '1' }).then(function () {
            toast('Rolled back announcement to previous revision!', 'success');
            refreshGlobalData().then(viewAnnouncements);
          }).catch(function (e) {
            toast('Rollback failed: ' + (e.message || e), 'error');
          });
        });
      });
    }).catch(function () {
      container.innerHTML = '<span style="color:#64748B;font-size:12px">Unable to load revisions.</span>';
    });
  }

  /* View: Testimonials & Client Awards Manager */
  function viewTestimonials() {
    setCommandBar({
      left: [
        { label: 'New Testimonial', icon: 'plus', primary: true, id: 'cmd-new-testimonial', onClick: function () { openTestimonialModal(null); } },
        { label: 'Push Live', icon: 'rocket', onClick: openPublishModal },
        { label: 'Refresh Data', icon: 'refresh', onClick: function () { refreshGlobalData().then(viewTestimonials); } }
      ],
      right: [
        { label: 'View Public Site', icon: 'ext', onClick: function () { window.open(siteUrl('/#proof'), '_blank'); } }
      ]
    });

    var testimonials = state.testimonials || [];
    var content = $('#content');

    content.innerHTML =
      '<div class="d365-card mb-4" style="padding:16px 20px;background:#F8FAFC;border-left:4px solid var(--d365-primary)">' +
        '<h2 style="font-size:18px;margin:0 0 6px;color:var(--d365-navy)">Testimonials & Client Endorsements</h2>' +
        '<p style="font-size:12.5px;color:#64748B;margin:0">Manage the verified customer quotes displayed on the public Homepage and About page. Add new reviews, edit client credentials, toggle visibility, and maintain audit revisions.</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px" id="testimonials-grid">' +
        (testimonials.length ? testimonials.map(function (t) {
          return '<div class="d365-card testimonial-card-item" data-test-id="' + t.id + '" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;border-top:3px solid ' + (t.active ? 'var(--d365-primary)' : '#94A3B8') + '">' +
            '<div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
                '<span style="font-size:22px;color:#F59E0B">❝</span>' +
                '<span class="entity-tag" style="' + (t.active ? 'background:#DFF6DD;color:#107C41' : 'background:#F1F5F9;color:#64748B') + '">' +
                  (t.active ? 'Active' : 'Inactive') +
                '</span>' +
              '</div>' +
              '<p style="font-size:13.5px;color:var(--d365-navy);line-height:1.6;font-style:italic;margin:0 0 16px">' +
                '“' + esc(t.quote || '') + '”' +
              '</p>' +
            '</div>' +
            '<div style="border-top:1px solid #E2E8F0;padding-top:12px;margin-top:12px">' +
              '<b style="font-size:13.5px;color:var(--d365-navy)">' + esc(t.name || '') + '</b>' +
              '<div style="font-size:12px;color:#64748B;margin-top:2px">' + esc(t.role || '') + '</div>' +
              (t.company ? '<div style="font-size:11.5px;color:#006CBE;margin-top:2px">' + esc(t.company) + '</div>' : '') +
              '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">' +
                '<button class="d365-cmd-btn" style="font-size:11px" data-test-edit="' + t.id + '">Edit ✏️</button>' +
                '<button class="d365-cmd-btn btn-danger-action" style="font-size:11px" data-test-delete="' + t.id + '">Delete 🗑️</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') : '<div class="d365-card" style="padding:24px;text-align:center;color:#64748B">No testimonials found. Click "+ New Testimonial" to add one.</div>') +
      '</div>';

    $$('[data-test-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-test-edit');
        var t = testimonials.find(function (item) { return String(item.id) === String(id); });
        if (t) openTestimonialModal(t);
      });
    });

    $$('[data-test-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-test-delete');
        handleTestimonialDelete(id);
      });
    });
  }

  function openTestimonialModal(t) {
    var modal = $('#modal-testimonial-edit');
    if (!modal) return;
    $('#test-edit-id').value = t ? (t.id || '') : '';
    $('#test-edit-quote').value = t ? (t.quote || '') : '';
    $('#test-edit-name').value = t ? (t.name || '') : '';
    $('#test-edit-role').value = t ? (t.role || '') : '';
    $('#test-edit-company').value = t ? (t.company || '') : '';
    $('#test-edit-active').checked = t ? (t.active !== false) : true;
    trapFocus(modal);
  }

  function handleTestimonialSave() {
    var id = $('#test-edit-id')?.value;
    var quote = $('#test-edit-quote')?.value.trim();
    var name = $('#test-edit-name')?.value.trim();
    var role = $('#test-edit-role')?.value.trim();
    var company = $('#test-edit-company')?.value.trim();
    var active = $('#test-edit-active')?.checked;

    if (!quote) return toast('Quote is required', 'warn');
    if (!name) return toast('Client Name is required', 'warn');

    var btn = $('#btn-test-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    var payload = { quote: quote, name: name, role: role, company: company, active: active };
    var req = id
      ? API.put('/api/cms/testimonials/' + id, payload)
      : API.post('/api/cms/testimonials', payload);

    req.then(function () {
      toast('Testimonial saved with revision snapshot!', 'success');
      closeModals();
      refreshGlobalData().then(function () {
        if (state.currentView === 'testimonials') viewTestimonials();
      });
    }).catch(function (err) {
      toast('Save failed: ' + (err.message || err), 'error');
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Save Testimonial & Snapshot Revision'; }
    });
  }

  function handleTestimonialDelete(id) {
    if (!confirm('Are you sure you want to delete this testimonial? An audit snapshot will be saved.')) return;
    API.delete('/api/cms/testimonials/' + id).then(function () {
      toast('Testimonial deleted', 'info');
      refreshGlobalData().then(function () {
        if (state.currentView === 'testimonials') viewTestimonials();
      });
    }).catch(function (err) {
      toast('Delete failed: ' + (err.message || err), 'error');
    });
  }

  function exportBlocksCsv() {
    var headers = ['entity', 'entity_id', 'title', 'updated_by'];
    var rows = state.blocks.map(function (b) {
      var p = b.payload || {};
      var t = (p.t || p.title || p.name || '').replace(/"/g, '""');
      return [b.entity, b.entity_id, '"' + t + '"', b.updated_by || 'system'].join(',');
    });
    var csv = [headers.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'simal-content-blocks-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported ' + state.blocks.length + ' blocks to CSV', 'info');
  }

  /* Bootstrapping on DOM Ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

})(window, document);
