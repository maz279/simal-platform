/* ==========================================================================
 * pg-repos.js — PostgreSQL-backed repository adapter (T1.3).
 * Implements the same interface as repos.js but uses pg.Client.
 * Swap point: server.js chooses JSON or PG based on DATABASE_URL env.
 * Documents are byte-stored on the filesystem (like the JSON store) with
 * metadata mirrored into the documents table; all other state lives in PG.
 * ========================================================================== */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { id, token, hashPassword } from '../lib/security.js';
import { HttpError } from '../lib/http.js';

const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.resolve('data/uploads');

const ENC_MAGIC = Buffer.from('SIMALENC1'); // 9 bytes header
function docKeyMaterial() {
  /* rm(2.4-3) / F-2026-N06: no fallback of any kind — documents are never encrypted
   * or decrypted under a default key. The rm(2.4-3) migration re-encrypted every
   * stored file, so no legacy-key path is needed. */
  const secret = process.env.DOC_ENCRYPTION_KEY;
  if (!secret) throw new Error('DOC_ENCRYPTION_KEY is required (refusing a default key)');
  return secret;
}
function getDocCipherKey() {
  return crypto.scryptSync(docKeyMaterial(), 'simal-doc-enc-salt-v1', 32);
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
      return { buffer: decryptWith(docKeyMaterial(), storedBuffer), usedLegacyKey: false };
    } catch (_e) {
      throw new Error('Document decrypt failed under the configured DOC_ENCRYPTION_KEY — run scripts/reencrypt-documents.mjs if this file predates the key rotation');
    }
  }
  return { buffer: storedBuffer, usedLegacyKey: false }; // unencrypted / legacy plaintext
}

export function createPgRepos(connectionString) {
  /* deploy-audit H6: one pg.Client served every request — after a database restart or a dropped
   * connection it stayed dead and every request failed until the portal was restarted. A Pool
   * has the same query() API (no code here holds a session or a transaction) and replaces
   * broken connections on its own. */
  const client = new pg.Pool({ connectionString, max: Number(process.env.PG_POOL_MAX) || 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  client.on('error', (err) => {
    console.error('[pg-repos] idle database connection error (the pool replaces it):', err.message);
  });

  /* synchronous settings cache — loaded once on connect, invalidated on saveSettings */
  let _settingsCache = null;

  const ready = Promise.resolve().then(async () => {
    const r = await client.query('SELECT k, v FROM settings');
    _settingsCache = {};
    r.rows.forEach(row => {
      try { _settingsCache[row.k] = typeof row.v === 'string' ? JSON.parse(row.v) : row.v; }
      catch { _settingsCache[row.k] = row.v; }
    });
    console.log('pg-repos: connected, settings cached:', Object.keys(_settingsCache));
    return _settingsCache;
  });

  const now = () => Date.now();

  /* map PG snake_case columns to camelCase expected by service layer */
  function camelize(row) {
    if (!row || typeof row !== 'object') return row;
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[ck] = v;
    }
    return out;
  }

  /* restructure flat PG invoice columns into the nested format the service layer expects */
  function rowToInvoice(row) {
    if (!row) return row;
    const c = camelize(row);
    const formatDate = (val) => {
      if (!val) return '';
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return String(val).slice(0, 10);
    };
    const buyerTin = String(c.buyerTin || '').trim();
    return {
      ...c,
      createdAt: Number(c.createdAt || 0),
      updatedAt: Number(c.updatedAt || 0),
      issueDate: formatDate(c.issueDate),
      dueDate: formatDate(c.dueDate),
      currency: String(c.currency || 'AED').trim(),
      buyerTin,
      buyerName: c.buyerName || '',
      partnerEmail: c.partnerEmail || '',
      buyerPeppol: '0235:' + buyerTin.slice(0, 10),
      kyc: c.kyc || (c.kycRef ? { reference: c.kycRef } : null),
      totals: {
        netFils: parseInt(c.netFils ?? row.net_fils ?? 0, 10),
        vatFils: parseInt(c.vatFils ?? row.vat_fils ?? 0, 10),
        totalFils: parseInt(c.totalFils ?? row.total_fils ?? 0, 10),
      },
      lines: (c.lines || []).map(l => ({
        ...l,
        desc: l.desc || l.descr || '',
        qty: parseInt(l.qty ?? 0, 10),
        unitPriceFils: parseInt(l.unitPriceFils ?? l.unit_price_fils ?? 0, 10),
        vatRatePct: parseInt(l.vatRatePct ?? l.vat_rate_pct ?? 5, 10),
      })),
    };
  }

  /* restructure flat PG submission columns into the camelCase format the service layer expects */
  function rowToSubmission(row) {
    if (!row || typeof row !== 'object') return row;
    const c = camelize(row);
    if (c.submittedAt != null) c.submittedAt = Number(c.submittedAt);
    if (c.createdAt != null) c.createdAt = Number(c.createdAt);
    if (c.updatedAt != null) c.updatedAt = Number(c.updatedAt);
    if (!c.company) c.company = {};
    if (!c.tax) c.tax = {};
    if (!c.contacts) c.contacts = {};
    if (!c.signatories) c.signatories = [];
    if (!c.ubos) c.ubos = [];
    if (!c.banking) c.banking = {};
    if (!c.declarations) c.declarations = {};
    if (!c.documents) c.documents = [];
    if (!c.queries) c.queries = [];
    if (!c.history) c.history = [];
    return c;
  }

  async function audit(actor, action, target, details = '') {
    await client.query(
      'INSERT INTO audit_log (ts, actor, action, target, details) VALUES ($1,$2,$3,$4,$5)',
      [now(), actor, action, target, details]
    );
  }
  async function auditLog(q = '', action = 'all') {
    const r = await client.query(
      'SELECT * FROM audit_log WHERE ($1 = \'all\' OR action = $1) AND (actor ILIKE \'%\' || $2 || \'%\' OR target ILIKE \'%\' || $2 || \'%\' OR details ILIKE \'%\' || $2 || \'%\') ORDER BY ts DESC LIMIT 500',
      [action, q]
    );
    return r.rows.map(camelize);
  }

  return {
    client, ready, persist: async () => {},  // PG auto-persisted via explicit save() calls
    audit, auditLog,

    /* synchronous — returns cached settings (loaded on connect, invalidated on save) */
    settings: () => _settingsCache || {},
    saveSettings: async (patch) => {
      for (const [k, v] of Object.entries(patch)) {
        await client.query(
          'INSERT INTO settings (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = $2',
          [k, JSON.stringify(v)]
        );
        if (_settingsCache) _settingsCache[k] = v;
      }
    },
    /* async — callers MUST await (used in route handlers which are already async) */
    nextRef: async () => {
      const r = await client.query("SELECT 'SIM-KYC-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('ref_seq')::text, 5, '0') AS ref");
      return r.rows[0].ref;
    },
    nextInvRef: async () => {
      const r = await client.query("SELECT 'SIM-INV-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('inv_seq')::text, 4, '0') AS ref");
      return r.rows[0].ref;
    },

    users: {
      findByEmail: async (email) => {
        const r = await client.query('SELECT * FROM users WHERE email = $1 AND active', [String(email).toLowerCase().trim()]);
        return r.rows[0] ? camelize(r.rows[0]) : null;
      },
      get: async (uid) => {
        const r = await client.query('SELECT * FROM users WHERE id = $1', [uid]);
        return r.rows[0] ? camelize(r.rows[0]) : null;
      },
      all: async () => (await client.query('SELECT * FROM users ORDER BY created_at DESC')).rows.map(camelize),
      create: async ({ email, name, role, passwordHash, totpSecret, active = true }) => {
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length) throw new Error('User exists');
        const uid = id('usr');
        await client.query(
          'INSERT INTO users (id, email, name, role, password_hash, totp_secret, active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [uid, email.toLowerCase().trim(), name, role, passwordHash, totpSecret, active, now()]
        );
        return { id: uid, email: email.toLowerCase().trim(), name, role, passwordHash, totpSecret, active };
      },
      save: async (u) => {
        await client.query(
          'UPDATE users SET email=$2, name=$3, role=$4, password_hash=$5, totp_secret=$6, pending_totp_secret=$7, pending_email=$8, active=$9, last_totp_step=$10 WHERE id=$1',
          [u.id, u.email, u.name, u.role, u.passwordHash, u.totpSecret || null, u.pendingTotpSecret || null, u.pendingEmail || null, u.active !== false, u.lastTotpStep ?? null]
        );
        return u;
      },
      remove: async (idOrEmail) => {
        const r = await client.query('SELECT id FROM users WHERE id = $1 OR lower(email) = lower($2)', [idOrEmail, String(idOrEmail).toLowerCase().trim()]);
        for (const row of r.rows) {
          await client.query('DELETE FROM sessions WHERE user_id = $1', [row.id]);
          await client.query('DELETE FROM users WHERE id = $1', [row.id]);
        }
        return true;
      },
    },

    /* ---------- drafts (B5) ---------- */
    drafts: {
      find: async (did, tok) => {
        const r = await client.query('SELECT * FROM drafts WHERE id = $1 AND token = $2', [did, tok]);
        if (!r.rows[0]) return null;
        const d = camelize(r.rows[0]);
        return { ...d, data: d.data || {}, documents: d.documents || [] };
      },
      findByEmailRole: async (email, role) => {
        const r = await client.query('SELECT * FROM drafts WHERE email = $1 AND role = $2 ORDER BY updated_at DESC LIMIT 1',
          [String(email).toLowerCase().trim(), role]);
        if (!r.rows[0]) return null;
        const d = camelize(r.rows[0]);
        return { ...d, data: d.data || {}, documents: d.documents || [] };
      },
      create: async (email, role) => {
        const d = { id: id('dft'), token: token(24), email: email.toLowerCase().trim(), role, data: {}, documents: [], step: 1, startedAt: now(), updatedAt: now() };
        await client.query(
          'INSERT INTO drafts (id, token, email, role, step, data, documents, started_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [d.id, d.token, d.email, d.role, d.step, JSON.stringify(d.data), JSON.stringify(d.documents), d.startedAt, d.updatedAt]
        );
        return d;
      },
      save: async (d) => {
        await client.query(
          'UPDATE drafts SET step=$2, data=$3, documents=$4, updated_at=$5 WHERE id=$1',
          [d.id, Math.max(1, Math.min(7, Number(d.step) || 1)), JSON.stringify(d.data || {}), JSON.stringify(d.documents || []), now()]
        );
        return d;
      },
      remove: async (d) => {
        await client.query('DELETE FROM drafts WHERE id = $1', [d.id]);
      },
    },

    /* ---------- invites (B5-widened) ---------- */
    invites: {
      all: async () => (await client.query('SELECT * FROM invites ORDER BY created_at DESC')).rows.map(camelize),
      find: async (code) => {
        const r = await client.query('SELECT * FROM invites WHERE code = $1', [String(code || '').toUpperCase()]);
        return r.rows[0] ? camelize(r.rows[0]) : null;
      },
      add: async (list) => {
        for (const inv of list) {
          await client.query(
            'INSERT INTO invites (code, email, role, status, company, created_at, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (code) DO NOTHING',
            [inv.code, inv.email, inv.role, inv.status || 'link-generated', inv.company || null, inv.createdAt || now(), inv.createdBy || null]
          );
        }
        return list;
      },
      save: async (inv) => {
        await client.query(
          'UPDATE invites SET status=$2, submission_id=$3, converted_at=$4 WHERE code=$1',
          [inv.code, inv.status, inv.submissionId || null, inv.convertedAt || null]
        );
        return inv;
      },
    },

    /* ---------- documents (bytes on filesystem, metadata in PG) ---------- */
    documents: {
      store: async (draftDoc, buffer) => {
        const docId = id('doc');
        const safeName = String(draftDoc.name || 'document').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const encBytes = encryptDocBuffer(buffer);
        fs.writeFileSync(path.join(UPLOADS_DIR, docId + '_' + safeName), encBytes);
        const rel = path.join('uploads', docId + '_' + safeName);
        const meta = { docId, relPath: rel, size: buffer.length, mime: draftDoc.mime || 'application/octet-stream' };
        await client.query(
          'INSERT INTO documents (doc_id, submission_id, rel_path, size, mime) VALUES ($1,$2,$3,$4,$5)',
          [meta.docId, null, meta.relPath, meta.size, meta.mime]
        );
        return meta;
      },
      readFile: (relPath) => {
        const root = path.resolve(UPLOADS_DIR);
        const abs = path.resolve(root, path.basename(relPath));
        if (!abs.startsWith(root + path.sep)) throw new Error('Bad document path');
        const raw = fs.readFileSync(abs);
        const r = decryptDocBuffer(raw);
        if (r.usedLegacyKey) {
          // Self-heal: rewrite under the current key so the legacy dependency disappears.
          try { fs.writeFileSync(abs, encryptDocBuffer(r.buffer)); console.warn('[documents] self-healed legacy-key document:', path.basename(relPath)); }
          catch (e) { console.error('[documents] legacy self-heal FAILED:', relPath, e.message); }
        }
        return { abs, buffer: r.buffer };
      },
    },

    /* ---------- screening results (B5) ---------- */
    screening: {
      get: async (ref) => {
        const r = await client.query('SELECT result FROM screening_results WHERE ref = $1', [ref]);
        return r.rows[0] ? r.rows[0].result : null;
      },
      save: async (ref, result) => {
        await client.query(
          'INSERT INTO screening_results (ref, result, saved_at) VALUES ($1,$2,$3) ON CONFLICT (ref) DO UPDATE SET result=$2, saved_at=$3',
          [ref, JSON.stringify(result), now()]
        );
      },
    },

    sessions: {
      insert: async (session) => {
        await client.query(
          'INSERT INTO sessions (sid, user_id, created_at, last_seen, idle_ms, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
          [session.sid, session.userId, session.createdAt, session.lastSeen, session.idleMs, session.expiresAt]
        );
        return session;
      },
      all: async () => (await client.query('SELECT * FROM sessions')).rows,
      find: async (sid) => {
        const r = await client.query('SELECT * FROM sessions WHERE sid = $1', [sid]);
        return r.rows[0] ? camelize(r.rows[0]) : null;
      },
      touch: async (s) => {
        await client.query('UPDATE sessions SET last_seen = $1 WHERE sid = $2', [now(), s.sid]);
      },
      destroy: async (sid) => {
        await client.query('DELETE FROM sessions WHERE sid = $1', [sid]);
      },
      destroyAll: async (userId, exceptSid) => {
        await client.query('DELETE FROM sessions WHERE user_id = $1 AND sid != $2', [userId, exceptSid || '']);
      },
      isLive: (s) => s && now() - (s.lastSeen || s.last_seen) < (s.idleMs || s.idle_ms) && now() < (s.expiresAt || s.expires_at),
      reap: async () => {
        await client.query('DELETE FROM sessions WHERE last_seen + idle_ms < $1 OR expires_at < $1', [now()]);
      },
      create: (userId, opts) => ({
        sid: token(32), userId, createdAt: now(), lastSeen: now(),
        idleMs: opts.idleMinutes * 60000, expiresAt: now() + opts.absoluteHours * 3600000,
      }),
    },

    mfaChallenges: {
      issue: async (userId) => {
        const cid = token(16);
        await client.query('INSERT INTO sessions (sid, user_id, created_at, last_seen, idle_ms, expires_at) VALUES ($1,$2,$3,$3,300000,$4)',
          [cid, userId, now(), now() + 300000]);
        return { id: cid, userId };
      },
      consume: async (cid) => {
        const r = await client.query('DELETE FROM sessions WHERE sid = $1 AND user_id IS NOT NULL RETURNING user_id', [cid]);
        /* shape to the JSON-store contract: { id, userId } (raw row is snake_case) */
        return r.rows[0] ? { id: cid, userId: r.rows[0].user_id } : null;
      },
    },

    submissions: {
      all: async () => (await client.query('SELECT * FROM submissions ORDER BY submitted_at DESC')).rows.map(rowToSubmission),
      get: async (ref) => {
        const r = await client.query('SELECT * FROM submissions WHERE id = $1', [ref]);
        return r.rows[0] ? rowToSubmission(r.rows[0]) : null;
      },
      add: async (sub) => {
        await client.query(
          'INSERT INTO submissions (id, role, status, company, tax, contacts, signatories, ubos, banking, declarations, documents, queries, review, screening, duplicate_of_tin, reviewer, rejection_reason, history, created_at, submitted_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)',
          [sub.id, sub.role, sub.status, JSON.stringify(sub.company || {}), JSON.stringify(sub.tax || {}),
           JSON.stringify(sub.contacts || {}), JSON.stringify(sub.signatories || []),
           JSON.stringify(sub.ubos || []), JSON.stringify(sub.banking || {}),
           JSON.stringify(sub.declarations || {}), JSON.stringify(sub.documents || []),
           JSON.stringify(sub.queries || []), JSON.stringify(sub.review || {}),
           sub.screening ? JSON.stringify(sub.screening) : null,
           sub.duplicateOfTin ? JSON.stringify(sub.duplicateOfTin) : null,
           sub.reviewer || null, sub.rejectionReason || sub.rejection_reason || null,
           JSON.stringify(sub.history || []), sub.createdAt || sub.submittedAt || now(),
           sub.submittedAt || now(), sub.updatedAt || now()]
        );
        return sub;
      },
      save: async (sub) => {
        await client.query(
          'UPDATE submissions SET status=$2, reviewer=$3, rejection_reason=$4, hold_reason=$5, partner_account=$6, history=$7, documents=$8, queries=$9, review=$10, screening=$11, updated_at=$12 WHERE id=$1',
          [sub.id, sub.status, sub.reviewer || null, sub.rejectionReason || sub.rejection_reason || null,
           sub.holdReason || sub.hold_reason || null, JSON.stringify(sub.partnerAccount || sub.partner_account || null),
           JSON.stringify(sub.history || []), JSON.stringify(sub.documents || []),
           JSON.stringify(sub.queries || []), JSON.stringify(sub.review || {}),
           sub.screening ? JSON.stringify(sub.screening) : null, now()]
        );
        return sub;
      },
      findByEmail: async (email) => {
        const r = await client.query(
          "SELECT * FROM submissions WHERE contacts->'primary'->>'email' = $1 ORDER BY submitted_at DESC",
          [String(email).toLowerCase().trim()]
        );
        return r.rows.map(rowToSubmission);
      },
      duplicateTin: async (trn, excludeId) => {
        const r = await client.query(
          "SELECT * FROM submissions WHERE tax->>'trn' = $1 AND ($2::text IS NULL OR id <> $2) AND status <> 'rejected'" /* rm(10.3-1 pen KYC-37) */,
          [trn, excludeId || null]
        );
        return r.rows[0] ? rowToSubmission(r.rows[0]) : null;
      },
    },

    invoices: {
      all: async () => (await client.query('SELECT * FROM invoices ORDER BY created_at DESC')).rows.map(rowToInvoice),
      get: async (invId) => {
        const r = await client.query('SELECT * FROM invoices WHERE id = $1 OR ref = $1', [invId]);
        if (!r.rows[0]) return null;
        const actualId = r.rows[0].id;
        const lines = await client.query('SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY idx', [actualId]);
        return rowToInvoice({ ...camelize(r.rows[0]), lines: lines.rows.map(camelize) });
      },
      findByRef: async (ref) => {
        const r = await client.query('SELECT * FROM invoices WHERE ref = $1', [ref]);
        return r.rows[0] ? rowToInvoice(camelize(r.rows[0])) : null;
      },
      add: async (inv) => {
        await client.query(
          'INSERT INTO invoices (id, ref, seller, partner_email, buyer_tin, buyer_name, po_ref, issue_date, due_date, currency, net_fils, vat_fils, total_fils, status, kyc_ref, timeline, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)',
          [inv.id, inv.ref, JSON.stringify(inv.seller), inv.partnerEmail, inv.buyerTin, inv.buyerName,
           inv.poRef || null, inv.issueDate, inv.dueDate, inv.currency,
           inv.totals.netFils, inv.totals.vatFils, inv.totals.totalFils,
           inv.status, inv.kyc ? inv.kyc.reference : null,
           JSON.stringify(inv.timeline || []), now(), now()]
        );
        for (let i = 0; i < inv.lines.length; i++) {
          const l = inv.lines[i];
          await client.query(
            'INSERT INTO invoice_lines (invoice_id, idx, descr, qty, unit_price_fils, vat_rate_pct) VALUES ($1,$2,$3,$4,$5,$6)',
            [inv.id, i + 1, l.desc, l.qty, l.unitPriceFils, l.vatRatePct]
          );
        }
        return inv;
      },
      save: async (inv) => {
        try {
          await client.query(
            'UPDATE invoices SET status=$2, validation=$3, reject_reason=$4, ubl=$5, timeline=$6, updated_at=$7 WHERE id=$1',
            [inv.id, inv.status, JSON.stringify(inv.validation || null), inv.rejectReason || null,
             JSON.stringify(inv.ubl || null), JSON.stringify(inv.timeline || []), now()]
          );
        } catch (err) {
          if (err.message && err.message.includes('is delivered and immutable')) {
            const conflictErr = new Error(err.message);
            conflictErr.status = 409;
            throw conflictErr;
          }
          throw err;
        }
      },
      byPartner: async (email) => {
        const r = await client.query('SELECT * FROM invoices WHERE partner_email = $1 ORDER BY created_at DESC',
          [String(email).toLowerCase().trim()]);
        return r.rows.map(row => rowToInvoice(camelize(row)));
      },
    },

    /* ---------- products (catalog lookup for RFQ integrity) ---------- */
    seedProducts: async () => 0, /* PG reads the live catalog — mirror is JSON-mode only */
    products: {
      bySlug: async (slug) => {
        const r = await client.query('SELECT slug, name, brand, cat FROM products WHERE slug = $1', [slug]);
        return r.rows[0] ? camelize(r.rows[0]) : null;
      },
    },

    /* ---------- RFQ engine (B11, T3.4 — FRS-R) ---------- */
    rfqs: {
      create: async (rec) => {
        await client.query(
          'INSERT INTO rfqs (ref, email, status, company, contact_name, phone, history, submitted_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)',
          [rec.ref, rec.email, rec.status || 'submitted', rec.company || null, rec.contactName || null, rec.phone || null, JSON.stringify(rec.history || []), rec.submittedAt || now()]
        );
        for (const it of rec.items || []) {
          await client.query('INSERT INTO rfq_items (rfq_ref, slug, qty, note) VALUES ($1,$2,$3,$4)', [rec.ref, it.slug, it.qty, it.note || null]);
        }
        return rec;
      },
      get: async (ref) => {
        const r = await client.query('SELECT * FROM rfqs WHERE ref = $1', [ref]);
        if (!r.rows[0]) return null;
        const items = await client.query('SELECT slug, qty, note FROM rfq_items WHERE rfq_ref = $1 ORDER BY slug', [ref]);
        const h = camelize(r.rows[0]);
        return { ...h, history: h.history || [], items: items.rows.map(camelize) };
      },
      findByEmail: async (email) => {
        const r = await client.query('SELECT * FROM rfqs WHERE email = $1 ORDER BY submitted_at DESC', [String(email).toLowerCase().trim()]);
        return r.rows.map(row => ({ ...camelize(row), history: row.history || [] }));
      },
      all: async () => (await client.query('SELECT * FROM rfqs ORDER BY submitted_at DESC LIMIT 500')).rows.map(row => ({ ...camelize(row), history: row.history || [] })),
      save: async (rec) => {
        await client.query('UPDATE rfqs SET status=$2, history=$3, updated_at=$4 WHERE ref=$1',
          [rec.ref, rec.status, JSON.stringify(rec.history || []), now()]);
        return rec;
      },
      nextRef: async () => {
        const r = await client.query("SELECT 'SIMAL-RFQ-' || to_char(now(),'YYYYMMDD') || '-' || LPAD(nextval('rfq_seq')::text, 4, '0') AS ref");
        return r.rows[0].ref;
      },
    },

    tokens: {
      issue: async (rec) => {
        try {
          await client.query('INSERT INTO one_time_tokens (kind, token_hash, subject, payload, expires_at, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
            [rec.kind, rec.tokenHash, rec.subject, JSON.stringify(rec.payload || {}), rec.expiresAt, rec.createdAt || now()]);
        } catch (e) {
          if (String(e.code) === '23505') throw new HttpError(409, 'Token already used'); /* concurrent single-use race */
          throw e;
        }
        return rec;
      },
      find: async (kind, tokenHash) => {
        const r = await client.query('SELECT * FROM one_time_tokens WHERE kind = $1 AND token_hash = $2', [kind, tokenHash]);
        if (!r.rows[0]) return null;
        const t = camelize(r.rows[0]);
        return { ...t, payload: t.payload || {} };
      },
      save: async (rec) => {
        await client.query('UPDATE one_time_tokens SET consumed_at = $3 WHERE kind = $1 AND token_hash = $2',
          [rec.kind, rec.tokenHash, rec.consumedAt || null]);
        return rec;
      },
      /* rm(8.1-2): atomic single-use claim — the old find→check→save let N parallel
       * fetches of one token all succeed. NULLS-check + expiry in the WHERE clause
       * means exactly one caller can ever get a row back. */
      consumeAtomic: async (kind, tokenHash, nowMs) => {
        const r = await client.query(
          'UPDATE one_time_tokens SET consumed_at = $1 WHERE kind = $2 AND token_hash = $3 AND consumed_at IS NULL AND expires_at > $1 RETURNING *',
          [nowMs, kind, tokenHash]);
        if (!r.rows[0]) return null;
        const t = camelize(r.rows[0]);
        return { ...t, payload: t.payload || {} };
      },
      purgeExpired: async () => {
        await client.query('DELETE FROM one_time_tokens WHERE consumed_at IS NOT NULL OR expires_at < $1', [now() - 86400000]);
      },
    },

    outbox: {
      all: async () => (await client.query('SELECT * FROM outbox ORDER BY created_at DESC')).rows.map(r => ({
        id: r.id, channel: r.channel, to: r.to_addr, subject: r.subject, text: r.body,
        status: r.status, meta: r.meta || {}, createdAt: r.created_at,
      })),
      add: async (entry) => {
        const eid = id('msg');
        await client.query(
          'INSERT INTO outbox (id, channel, to_addr, subject, body, status, meta, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [eid, entry.channel, entry.to, entry.subject, entry.text, entry.status || 'queued',
           JSON.stringify(entry.meta || {}), now()]
        );
        return { ...entry, id: eid, createdAt: now() };
      },
      markSent: async (entry, info) => {
        /* no sent_at column on outbox (by design) — delivery facts go into meta */
        await client.query("UPDATE outbox SET status='sent', meta=meta || $2 WHERE id=$1",
          [entry.id, JSON.stringify({ via: info?.via || 'unknown', sentAt: now() })]);
      },
      markSimulated: async (entry, info) => {
        await client.query("UPDATE outbox SET status='simulated', meta=meta || $2 WHERE id=$1",
          [entry.id, JSON.stringify({ via: info?.via || 'unconfigured_smtp_simulated', simulatedAt: now() })]);
      },
    },
  };
}
