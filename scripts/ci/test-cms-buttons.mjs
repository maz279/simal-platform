// scripts/ci/test-cms-buttons.mjs — Gate for CMS-1 & A11Y-8
// Verifies that across all 13+ Dynamics 365 CMS views:
// 1. Every view sets an active, context-aware command bar.
// 2. All actionable buttons rendered in the command bar have non-empty IDs and real click listeners.
// 3. All informational status badges/counters are rendered as <span class="d365-cmd-chip"> instead of inert <button>s.
// 4. Exact count of inert command-bar buttons is ZERO.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CMS_JS_PATH = path.join(REPO, 'apps', 'portal', 'public', 'assets', 'js', 'cms.js');
const CMS_HTML_PATH = path.join(REPO, 'apps', 'portal', 'public', 'cms.html');

console.log('=== CMS COMMAND BAR BUTTON AUDIT (CMS-1 & A11Y-8) ===');

const cmsJsContent = await fs.readFile(CMS_JS_PATH, 'utf8');

// 1. Static AST / Code Structure Verification
console.log('[1/3] Static analysis of command bar engine in cms.js...');

if (!cmsJsContent.includes('class="d365-cmd-chip"')) {
  console.error('FAIL: cms.js does not render informational status chips as .d365-cmd-chip');
  process.exit(1);
}

const cmdBarImplMatch = cmsJsContent.match(/function setCommandBar\(actions\)[\s\S]*?left\.innerHTML[\s\S]*?right\.innerHTML/);
if (!cmdBarImplMatch) {
  console.error('FAIL: setCommandBar implementation not found in cms.js');
  process.exit(1);
}

const cmdBarCode = cmdBarImplMatch[0];
if (!cmdBarCode.includes('!btn.onClick') || !cmdBarCode.includes('d365-cmd-chip')) {
  console.error('FAIL: setCommandBar does not strictly guard items without onClick to render as chip');
  process.exit(1);
}
console.log('  ✔ Command bar engine strictly converts non-interactive items into accessible status chips.');

// 2. Headless DOM Runtime Evaluation across all CMS Views
console.log('[2/3] Simulating all CMS views in headless runtime...');

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.className = '';
    this.attributes = new Map();
    this.style = {};
    this.listeners = new Map();
    this.childNodes = [];
    this.innerHTMLValue = '';
    this.hidden = false;
    this.value = '';
    this.checked = false;
    this.textContentValue = '';
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === 'id') this.id = String(v);
    if (k === 'class') this.className = String(v);
  }
  getAttribute(k) { return this.attributes.get(k) || null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.listeners.has(event)) return;
    this.listeners.set(event, this.listeners.get(event).filter(f => f !== fn));
  }

  dispatchEvent(event) {
    const list = this.listeners.get(event.type) || [];
    for (const fn of list) fn(event);
  }

  click() {
    this.dispatchEvent({ type: 'click', preventDefault: () => {} });
  }

  get classList() {
    return {
      add: (c) => { const set = new Set(this.className.split(' ').filter(Boolean)); set.add(c); this.className = [...set].join(' '); },
      remove: (c) => { const set = new Set(this.className.split(' ').filter(Boolean)); set.delete(c); this.className = [...set].join(' '); },
      contains: (c) => this.className.split(' ').includes(c)
    };
  }

  set textContent(t) {
    this.textContentValue = String(t);
  }
  get textContent() {
    return this.textContentValue || this.innerHTMLValue;
  }

  set innerHTML(html) {
    this.innerHTMLValue = html;
    this.childNodes = parseHtmlToMock(html);
  }
  get innerHTML() {
    return this.innerHTMLValue;
  }

  querySelector(sel) {
    return querySelectorMock(this, sel);
  }

  querySelectorAll(sel) {
    return querySelectorAllMock(this, sel);
  }

  appendChild(child) {
    this.childNodes.push(child);
    return child;
  }

  remove() {}
  scrollIntoView() {}
}

function parseHtmlToMock(html) {
  const nodes = [];
  const tagRegex = /<([a-z0-9_-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-z0-9_-]+)([^>]*)\/?>/gi;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1] || match[4];
    const attrsStr = match[2] || match[5] || '';
    const inner = match[3] || '';
    const el = new MockElement(tagName);
    const attrRegex = /([a-z0-9_-]+)(?:=["']([^"']*)["'])?/gi;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      el.setAttribute(attrMatch[1], attrMatch[2] || '');
    }
    if (inner) {
      el.innerHTMLValue = inner;
      el.childNodes = parseHtmlToMock(inner);
    }
    nodes.push(el);
  }
  return nodes;
}

function matchSelector(el, sel) {
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel.startsWith('[')) {
    const attrName = sel.replace(/[\[\]]/g, '').split('=')[0];
    return el.hasAttribute(attrName);
  }
  return el.tagName.toLowerCase() === sel.toLowerCase();
}

function querySelectorMock(root, sel) {
  for (const child of root.childNodes) {
    if (matchSelector(child, sel)) return child;
    const found = querySelectorMock(child, sel);
    if (found) return found;
  }
  const fallback = new MockElement('div');
  if (sel.startsWith('#')) fallback.id = sel.slice(1);
  else if (sel.startsWith('.')) fallback.className = sel.slice(1);
  root.childNodes.push(fallback);
  return fallback;
}

function querySelectorAllMock(root, sel) {
  let results = [];
  for (const child of root.childNodes) {
    if (matchSelector(child, sel)) results.push(child);
    results = results.concat(querySelectorAllMock(child, sel));
  }
  return results;
}

const elementsMap = new Map();

function getOrCreateMockElement(id, tag = 'div') {
  const cleanId = id.replace(/^[#.]/, '');
  if (!elementsMap.has(cleanId)) {
    const el = new MockElement(tag);
    el.id = cleanId;
    elementsMap.set(cleanId, el);
  }
  return elementsMap.get(cleanId);
}

// Ensure key elements exist in elementsMap
const leftActions = getOrCreateMockElement('cmd-left-actions');
const rightActions = getOrCreateMockElement('cmd-right-actions');
getOrCreateMockElement('d365-command-bar');
getOrCreateMockElement('breadcrumb');
getOrCreateMockElement('content');
getOrCreateMockElement('d365-toast-container');
getOrCreateMockElement('auth');
getOrCreateMockElement('app');
getOrCreateMockElement('bpf-container');
getOrCreateMockElement('sitemap-nav');
getOrCreateMockElement('d365-user-name');
getOrCreateMockElement('d365-user-role');
getOrCreateMockElement('d365-avatar-initials');

const docListeners = new Map();
const documentMock = {
  addEventListener: (ev, fn) => {
    if (!docListeners.has(ev)) docListeners.set(ev, []);
    docListeners.get(ev).push(fn);
  },
  removeEventListener: (ev, fn) => {
    if (!docListeners.has(ev)) return;
    docListeners.set(ev, docListeners.get(ev).filter(f => f !== fn));
  },
  activeElement: null,
  body: new MockElement('body'),
  querySelector: (sel) => {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      return getOrCreateMockElement(id);
    }
    for (const el of elementsMap.values()) {
      const found = querySelectorMock(el, sel);
      if (found) return found;
    }
    return getOrCreateMockElement(sel);
  },
  querySelectorAll: (sel) => {
    let list = [];
    for (const el of elementsMap.values()) {
      list = list.concat(querySelectorAllMock(el, sel));
    }
    return list;
  },
  getElementById: (id) => getOrCreateMockElement(id),
  createElement: (tag) => new MockElement(tag),
  title: 'Dynamics 365'
};

const windowListeners = new Map();
const windowMock = {
  document: documentMock,
  location: { hash: '#/dashboard', replace: () => {} },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  addEventListener: (ev, fn) => {
    if (!windowListeners.has(ev)) windowListeners.set(ev, []);
    windowListeners.get(ev).push(fn);
  },
  removeEventListener: (ev, fn) => {
    if (!windowListeners.has(ev)) return;
    windowListeners.set(ev, windowListeners.get(ev).filter(f => f !== fn));
  },
  dispatchWindowEvent: (ev) => {
    const list = windowListeners.get(ev) || [];
    for (const fn of list) fn();
  },
  open: () => {},
  confirm: () => true,
  alert: () => {},
  prompt: () => '123456',
  UI: {
    icon: (name) => `<svg class="icon icon-${name}"></svg>`,
    timeAgo: () => 'just now'
  },
  API: {
    me: async () => ({ user: { id: 'u1', name: 'Super Admin', role: 'super_admin', email: 'admin@simalme.com' } }),
    get: async (url) => {
      if (url.includes('blocks')) return { blocks: [
        { entity: 'site', entity_id: 'amc-tiers', payload: { head: ['Feature', 'Basic', 'Standard', 'Premium'], rows: [['Response', '4h', '2h', '1h']] } },
        { entity: 'it_solution', entity_id: 'cyber', payload: { t: 'Cyber Security', d: 'Enterprise SOC' } },
        { entity: 'insight', entity_id: 'ai-in-erp-2026', payload: { t: 'AI in ERP', cat: 'ERP', au: 'Simal', at: '2026-10-12', x: 'Overview' } },
        { entity: 'site', entity_id: 'counters', payload: { projects: 120 } },
        { entity: 'site', entity_id: 'hours', payload: { mon_fri: '8am-6pm' } },
        { entity: 'software_unierp', entity_id: 'core', payload: { t: 'UniERP Core' } }
      ] };
      if (url.includes('slides')) return { slides: [{ idx: 1, headline: 'Slide 1', kick: 'Cloud', sub: 'Desc', active: true }] };
      if (url.includes('policies')) return { policies: [{ slug: 'privacy-policy', title: 'Privacy Policy', body: 'Clauses' }] };
      if (url.includes('products')) return { products: [{ slug: 'crucial-p510', name: 'Crucial P510', brand: 'Crucial', stock: 'true', is_new: true }] };
      if (url.includes('brands')) return { brands: [{ slug: 'crucial', name: 'Crucial', status: 'Authorized Partner' }] };
      if (url.includes('media')) return { media: [{ filename: 'crucial-p510.png', brand: 'Crucial', size: 1024 }] };
      if (url.includes('outbox')) return { outbox: [{ id: 'ob1', status: 'processed', to_addr: 'ssg-builder', subject: 'Build' }] };
      if (url.includes('announcements')) return { announcements: [{ id: 1, text: 'Ann 1', active: true, cta_label: 'Learn', cta_href: '/p' }] };
      if (url.includes('testimonials')) return { testimonials: [{ id: 't1', quote: 'Great!', active: true, name: 'Alice', company: 'Mercans' }] };
      if (url.includes('loc-audit')) return { policies: { en: 7, ar: 7, pct: 100 }, contentBlocks: { en: 30, ar: 15, pct: 50 }, overallParityPct: 80 };
      if (url.includes('rbac-matrix')) return { roles: { super_admin: ['read', 'notes', 'decide', 'manage_invites'], reviewer: ['read', 'notes', 'decide'], viewer: ['read'] } };
      if (url.includes('telemetry')) return { database: { status: 'healthy', latencyMs: 2 }, gateway: { uptime: 3600 }, ssg: { status: 'operational' }, productCount: 81 };
      if (url.includes('revisions')) return { revisions: [{ id: 1, table_name: 'content_blocks', record_id: 'ai-in-erp-2026', actor: 'admin@simalme.com', ts: Date.now(), payload: {} }] };
      return {};
    },
    users: async () => [{ id: 'u1', name: 'Admin', email: 'admin@simalme.com', role: 'super_admin', active: true, hasTotp: true }],
    audit: async () => [{ actor: 'u1', action: 'login', target: 'session', details: 'ok', ts: Date.now() }],
    sessions: async () => [{ sid: 'sess1234567890abcdef', fullSidPrefix: 'sess1234', user: 'admin@simalme.com', role: 'super_admin', createdAt: Date.now(), lastSeen: Date.now(), expiresAt: Date.now() + 1200000 }],
    post: async () => ({ ok: true }),
    put: async () => ({ ok: true }),
    delete: async () => ({ ok: true }),
    resetPassword: async () => ({ temporaryPassword: 'temp-pass-1234' }),
    deactivateUser: async () => ({ ok: true }),
    forceLogout: async () => ({ ok: true }),
    login: async () => ({ ok: true }),
    verifyMfa: async () => ({ ok: true })
  }
};

const sandbox = {
  window: windowMock,
  document: documentMock,
  location: windowMock.location,
  setTimeout: windowMock.setTimeout,
  clearTimeout: windowMock.clearTimeout,
  setInterval: windowMock.setInterval,
  clearInterval: windowMock.clearInterval,
  fetch: windowMock.fetch,
  confirm: windowMock.confirm,
  alert: windowMock.alert,
  prompt: windowMock.prompt,
  API: windowMock.API,
  UI: windowMock.UI,
  console: { log: () => {}, warn: () => {}, error: () => {} },
  Event: class { constructor(type) { this.type = type; } },
  URLSearchParams: URLSearchParams,
  Date: Date,
  JSON: JSON,
  String: String,
  Array: Array,
  Object: Object,
  Boolean: Boolean,
  Number: Number,
  Math: Math,
  RegExp: RegExp
};

vm.createContext(sandbox);

// Execute cms.js in the sandbox
vm.runInContext(cmsJsContent, sandbox);

// Allow async bootstrapping (API.me -> enterApplication -> refreshGlobalData -> route) to complete
await new Promise(r => setTimeout(r, 80));

const REQUIRED_VIEWS = [
  'dashboard',
  'editorial-desk',
  'workspace-hero',
  'workspace-media',
  'blocks',
  'slides',
  'it-solutions',
  'amc-tiers',
  'software-suites',
  'products-catalog',
  'brands-catalog',
  'policies',
  'loc-audit',
  'revisions',
  'publish-pipeline',
  'audit-trail',
  'users-management',
  'rbac-matrix',
  'active-sessions',
  'system-telemetry',
  'announcements',
  'testimonials',
  'claims-register'
];

let totalViewsTested = 0;
let totalButtonsAudited = 0;
let totalChipsAudited = 0;
let totalInertButtons = 0;
const failureReport = [];

for (const viewName of REQUIRED_VIEWS) {
  // Clear command bar before routing to view
  leftActions.innerHTML = '';
  rightActions.innerHTML = '';

  // Trigger route by changing hash and dispatching hashchange
  windowMock.location.hash = `#/${viewName}`;
  windowMock.dispatchWindowEvent('hashchange');

  // Allow microtasks to settle
  await new Promise(r => setTimeout(r, 10));

  totalViewsTested++;

  /* deploy-audit: a role gate that bounces to #/dashboard used to pass here on the dashboard's
   * own command bar — the super_admin mock could not open telemetry/users/sessions at all. */
  if (windowMock.location.hash !== `#/${viewName}`) {
    failureReport.push(`View #${viewName} was not opened for the super_admin session (routed to ${windowMock.location.hash})`);
    continue;
  }

  const leftButtons = leftActions.querySelectorAll('button');
  const rightButtons = rightActions.querySelectorAll('button');
  const allButtons = leftButtons.concat(rightButtons);

  const leftChips = leftActions.querySelectorAll('span');
  const rightChips = rightActions.querySelectorAll('span');
  const allChips = leftChips.concat(rightChips);

  totalButtonsAudited += allButtons.length;
  totalChipsAudited += allChips.length;

  if (allButtons.length === 0 && allChips.length === 0) {
    failureReport.push(`View #${viewName} did NOT set command bar actions (command bar is blank)!`);
    continue;
  }

  for (const btn of allButtons) {
    if (!btn.id) {
      totalInertButtons++;
      failureReport.push(`View #${viewName} has a button without an ID: "${btn.innerHTML}"`);
    }

    const registeredEl = documentMock.getElementById(btn.id);
    const hasListener = registeredEl && registeredEl.listeners && registeredEl.listeners.has('click');
    if (!hasListener) {
      totalInertButtons++;
      failureReport.push(`View #${viewName} has an INERT button (id: "${btn.id}", text: "${btn.innerHTML}") with no registered click handler!`);
    }
  }

  for (const chip of allChips) {
    if (!chip.classList.contains('d365-cmd-chip')) {
      failureReport.push(`View #${viewName} has a status chip missing .d365-cmd-chip class: "${chip.innerHTML}"`);
    }
  }
}

console.log(`[3/3] Verification Results:`);
console.log(`  - Total Views Tested: ${totalViewsTested}`);
console.log(`  - Total Actionable Command Buttons Audited: ${totalButtonsAudited}`);
console.log(`  - Total Accessible Status Chips Audited: ${totalChipsAudited}`);
console.log(`  - Inert Command-Bar Buttons: ${totalInertButtons}`);

if (failureReport.length > 0) {
  console.error('\n❌ CMS BUTTON AUDIT FAILED with the following violations:');
  failureReport.forEach((msg, idx) => console.error(`  ${idx + 1}. ${msg}`));
  process.exit(1);
}

console.log('\n✅ PASS — ZERO inert command-bar buttons detected across all CMS views.');
console.log('Closing findings CMS-1 and A11Y-8.');
process.exit(0);
