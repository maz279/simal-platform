/* ==========================================================================
 * repos.js — repository facade over the JSON store.
 * All mutations funnel through here; audit events are written alongside.
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { id, token } from '../lib/security.js';

const ENC_MAGIC = Buffer.from('SIMALENC1'); // 9 bytes header
function getDocCipherKey() {
  /* rm(2.4-3) / F-2026-N06: no literal, no SESSION_SECRET fallback — both stores
   * fail loudly when the key is absent. */
  const secret = process.env.DOC_ENCRYPTION_KEY;
  if (!secret) throw new Error('DOC_ENCRYPTION_KEY is required (refusing a default key)');
  return crypto.scryptSync(secret, 'simal-doc-enc-salt-v1', 32);
}

function encryptDocBuffer(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getDocCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes
  return Buffer.concat([ENC_MAGIC, iv, tag, encrypted]);
}

function decryptWith(secret, storedBuffer) {
  const iv = storedBuffer.subarray(ENC_MAGIC.length, ENC_MAGIC.length + 12);
  const tag = storedBuffer.subarray(ENC_MAGIC.length + 12, ENC_MAGIC.length + 28);
  const ciphertext = storedBuffer.subarray(ENC_MAGIC.length + 28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.scryptSync(secret, 'simal-doc-enc-salt-v1', 32), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
function decryptDocBuffer(storedBuffer) {
  if (storedBuffer.length > ENC_MAGIC.length + 12 + 16 &&
      storedBuffer.subarray(0, ENC_MAGIC.length).equals(ENC_MAGIC)) {
    try {
      return { buffer: decryptWith(process.env.DOC_ENCRYPTION_KEY, storedBuffer), usedLegacyKey: false };
    } catch (_e) {

      throw new Error('Document decrypt failed under current and legacy keys (F-2026-N06)');
    }
  }
  return { buffer: storedBuffer, usedLegacyKey: false };
}

export function createRepos(store = {}) {
  const uploadsDir = store.uploadsDir || (store.dataDir ? path.join(store.dataDir, 'uploads') : path.join(process.cwd(), 'data', 'uploads'));
  const db = () => store.data || store;
  if (!store.persist) store.persist = () => {};
  if (!store.data && !store.submissions) {
    store.submissions = [];
    store.drafts = [];
    store.invites = [];
    store.invoices = [];
    store.nextInvSeq = 5001;
    store.nextRefSeq = 10061;
    store.users = [];
    store.sessions = [];
    store.mfaChallenges = [];
    store.auditLog = [];
    store.outbox = [];
    store.screening = {};
    store.tokens = [];
    store.rfqs = [];
    store.products = [];
    store.settings = { simalTin: '', simalPeppol: '' };
  }

  const audit = (actor, action, target, details = '') => {
    db().auditLog.unshift({ ts: Date.now(), actor, action, target, details });
    if (db().auditLog.length > 5000) db().auditLog.length = 5000;
  };

  return {
    persist: () => store.persist(),   // exposed for services that mutate entities in place
    audit,
    auditLog: (q = '', action = 'all') => db().auditLog.filter(a =>
      (action === 'all' || a.action === action) &&
      (!q || (a.actor + ' ' + a.action + ' ' + a.target + ' ' + a.details).toLowerCase().includes(q.toLowerCase()))
    ),

    /* ---------- settings ---------- */
    settings: () => db().settings,
    saveSettings: (patch) => { Object.assign(db().settings, patch); return store.persist(); },
    nextRef: () => 'SIM-KYC-' + new Date().getFullYear() + '-' + String(db().nextRefSeq++).padStart(5, '0'),

    /* ---------- users ---------- */
    users: {
      findByEmail: (email) => db().users.find(u => u.email === String(email).toLowerCase().trim()) || null,
      get: (uid) => db().users.find(u => u.id === uid) || null,
      all: () => db().users.slice(),
      create: ({ email, name, role, passwordHash, totpSecret, active = true }) => {
        if (db().users.find(u => u.email === email.toLowerCase().trim())) throw new Error('User exists');
        const u = { id: id('usr'), email: email.toLowerCase().trim(), name, role, passwordHash, totpSecret, active, createdAt: Date.now() };
        db().users.push(u); store.persist(); return u;
      },
      save(u) { store.persist(); return u; },
      remove(idOrEmail) {
        const val = String(idOrEmail).toLowerCase().trim();
        const i = db().users.findIndex(u => u.id === idOrEmail || u.email.toLowerCase().trim() === val);
        if (i >= 0) {
          const uid = db().users[i].id;
          db().users.splice(i, 1);
          db().sessions = db().sessions.filter(s => s.userId !== uid);
          db().mfaChallenges = db().mfaChallenges.filter(c => c.userId !== uid);
          store.persist();
          return true;
        }
        return false;
      },
    },

    /* ---------- sessions / mfa challenges ---------- */
    sessions: {
      create: (userId, { idleMinutes, absoluteHours }) => ({
        sid: token(32), userId, createdAt: Date.now(), lastSeen: Date.now(),
        idleMs: idleMinutes * 60000, expiresAt: Date.now() + absoluteHours * 3600000,
      }),
      // note: create() also inserts — kept explicit below
      insert(session) { db().sessions.push(session); store.persist(); return session; },
      all: () => db().sessions.slice(),
      find: (sid) => db().sessions.find(s => s.sid === sid) || null,
      touch(s) { s.lastSeen = Date.now(); },
      destroy(sid) {
        const i = db().sessions.findIndex(s => s.sid === sid);
        if (i >= 0) { db().sessions.splice(i, 1); store.persist(); }
      },
      destroyAll(userId, exceptSid) {
        const keep = db().sessions.filter(s => !(s.userId === userId && s.sid !== exceptSid));
        if (keep.length !== db().sessions.length) { db().sessions = keep; store.persist(); }
      },
      isLive(s) { return s && Date.now() - s.lastSeen < s.idleMs && Date.now() < s.expiresAt; },
      reap() {
        const before = db().sessions.length;
        db().sessions = db().sessions.filter(s => this.isLive(s));
        if (db().sessions.length !== before) store.persist();
      },
    },
    mfaChallenges: {
      issue(userId) {
        const ch = { id: token(16), userId, expiresAt: Date.now() + 5 * 60000, used: false, attempts: 0 };
        db().mfaChallenges.push(ch);
        db().mfaChallenges = db().mfaChallenges.filter(c => c.expiresAt > Date.now());
        store.persist(); return ch;
      },
      consume(chId) {
        const ch = db().mfaChallenges.find(c => c.id === chId && !c.used && c.expiresAt > Date.now());
        if (ch) { ch.used = true; store.persist(); }
        return ch || null;
      },
      fail(ch) { ch.attempts++; store.persist(); },
    },

    /* ---------- drafts ---------- */
    drafts: {
      find: (did, tok) => db().drafts.find(d => d.id === did && d.token === tok) || null,
      findByEmailRole: (email, role) => db().drafts.find(d =>
        d.email.toLowerCase() === String(email).toLowerCase().trim() && d.role === role) || null,
      create(email, role) {
        const d = { id: id('dft'), token: token(24), email: email.toLowerCase().trim(), role, data: {}, documents: [], step: 1, startedAt: Date.now(), updatedAt: Date.now() };
        db().drafts.push(d); store.persist(); return d;
      },
      save(d, patch) { if (patch) Object.assign(d, patch, { updatedAt: Date.now() }); d.updatedAt = Date.now(); store.persist(); return d; },
      remove(d) { const i = db().drafts.indexOf(d); if (i >= 0) { db().drafts.splice(i, 1); store.persist(); } },
    },

    /* ---------- submissions ---------- */
    submissions: {
      all: () => db().submissions,
      get: (ref) => db().submissions.find(s => s.id === ref) || null,
      add(sub) { db().submissions.push(sub); store.persist(); return sub; },
      save(sub) { sub.updatedAt = Date.now(); store.persist(); },
      findByEmail: (email) => db().submissions.filter(s =>
        (s.contacts?.primary?.email || '').toLowerCase() === String(email).toLowerCase().trim()),
      duplicateTin: (trn, excludeId) => db().submissions.find(s => s.tax?.trn === trn && s.id !== excludeId) || null,
    },

    /* ---------- invites ---------- */
    invites: {
      all: () => db().invites,
      find: (code) => db().invites.find(i => i.code === code) || null,
      add(list) { db().invites.push(...list); store.persist(); return list; },
      save(inv) { store.persist(); return inv; },
    },

    /* ---------- documents ---------- */
    documents: {
      store(draftDoc, buffer) {
        const docId = id('doc');
        const safeName = String(draftDoc.name || 'document').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
        const rel = path.join('uploads', docId + '_' + safeName);
        fs.mkdirSync(uploadsDir, { recursive: true });
        const encBytes = encryptDocBuffer(buffer);
        fs.writeFileSync(path.join(uploadsDir, docId + '_' + safeName), encBytes);
        return { docId, relPath: rel, size: buffer.length, mime: draftDoc.mime || 'application/octet-stream' };
      },
      readFile(relPath) {
        const root = path.resolve(uploadsDir);
        const abs = path.resolve(root, path.basename(relPath));
        if (!abs.startsWith(root + path.sep)) throw new Error('Bad document path');
        const raw = fs.readFileSync(abs);
        const r = decryptDocBuffer(raw);
        if (r.usedLegacyKey) {
          try { fs.writeFileSync(abs, encryptDocBuffer(r.buffer)); console.warn('[documents] self-healed legacy-key document:', path.basename(relPath)); }
          catch (e) { console.error('[documents] legacy self-heal FAILED:', relPath, e.message); }
        }
        return { abs, buffer: r.buffer };
      },
    },

    /* ---------- outbox (notifications) ---------- */
    outbox: {
      all: () => db().outbox,
      add(entry) { entry.id = id('msg'); entry.createdAt = Date.now(); db().outbox.unshift(entry); if (db().outbox.length > 1000) db().outbox.length = 1000; store.persist(); return entry; },
      markSent(entry, channelInfo) { entry.status = 'sent'; entry.sentAt = Date.now(); Object.assign(entry, channelInfo || {}); store.persist(); },
      markSimulated(entry, channelInfo) { entry.status = 'simulated'; entry.simulatedAt = Date.now(); Object.assign(entry, channelInfo || {}); store.persist(); },
    },

    /* ---------- screening results ---------- */
    screening: {
      get: (ref) => db().screening[ref] || null,
      save: (ref, result) => { db().screening[ref] = result; store.persist(); },
    },

    /* ---------- products (read-only mirror; JSON mode loads data/products.json) ---------- */
    products: {
      bySlug(slug) { return db().products.find(p => p.slug === slug) || null; },
    },
    seedProducts(list) { if (!db().products.length) { db().products = list; store.persist(); } return list.length; },

    /* ---------- RFQ engine (B11, T3.4 — FRS-R) ---------- */
    rfqs: {
      create(rec) { db().rfqs.unshift(rec); store.persist(); return rec; },
      get(ref) { return db().rfqs.find(x => x.ref === ref) || null; },
      findByEmail(email) { return db().rfqs.filter(x => x.email === String(email).toLowerCase().trim()); },
      all() { return db().rfqs.slice(); },
      save(rec) { rec.updatedAt = Date.now(); store.persist(); return rec; },
      nextRef() {
        const d = new Date(); const ymd = '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const prefix = 'SIMAL-RFQ-' + ymd + '-';
        const max = db().rfqs.reduce((m, x) => {
          if (!x.ref.startsWith(prefix)) return m;
          const n = parseInt(x.ref.slice(prefix.length), 10);
          return Number.isFinite(n) && n > m ? n : m;
        }, 0);
        return prefix + String(max + 1).padStart(4, '0');
      },
    },

    /* ---------- one-time tokens (B8, T2.2) ---------- */
    tokens: {
      issue(rec) {
        /* atomic duplicate guard — single-process synchronous check+push */
        if (db().tokens.some(x => x.kind === rec.kind && x.tokenHash === rec.tokenHash)) {
          const e = new Error('Token already used'); e.status = 409; throw e;
        }
        db().tokens.push(rec); store.persist(); return rec;
      },
      find(kind, tokenHash) { return db().tokens.find(x => x.kind === kind && x.tokenHash === tokenHash) || null; },
      save(rec) { store.persist(); return rec; },
      purgeExpired() {
        const before = db().tokens.length;
        db().tokens = db().tokens.filter(x => x.consumedAt == null && x.expiresAt > Date.now() - 86400000);
        if (db().tokens.length !== before) store.persist();
      },
    },

    /* ---------- e-invoices (UAE Peppol, schema v3) ---------- */
    nextInvRef: () => 'SIM-INV-' + new Date().getFullYear() + '-' + String(db().nextInvSeq++).padStart(4, '0'),
    invoices: {
      all: () => db().invoices.slice(),
      get: (invId) => db().invoices.find(i => i.id === invId || i.ref === invId) || null,
      findByRef: (ref) => db().invoices.find(i => i.ref === ref) || null,
      add(inv) { db().invoices.push(inv); store.persist(); return inv; },
      save(inv) {
        const existing = db().invoices.find(i => i.id === inv.id);
        if (existing && existing.status === 'delivered' && inv.status !== 'delivered') {
          const err = new Error(`Invoice ${inv.id} is delivered and immutable (C3): amendments must use credit notes`);
          err.status = 409;
          throw err;
        }
        inv.updatedAt = Date.now();
        store.persist();
      },
      byPartner: (email) => db().invoices.filter(i =>
        String(i.partnerEmail).toLowerCase() === String(email).toLowerCase().trim()),
    },
  };
}
