/* ==========================================================================
 * db.js — atomic JSON persistence with versioned schema + migrations.
 * Write strategy: serialise in-memory → write temp file → fsync → rename.
 * Swap point for PostgreSQL in Phase 2 (repository interface unchanged).
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { log } from '../lib/log.js';

const SCHEMA_VERSION = 3;

export function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const file = path.join(dataDir, 'db.json');

  let db = null;
  let writing = Promise.resolve();
  let dirty = false;

  function blank() {
    return {
      version: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      nextRefSeq: 10061,
      settings: { simalTin: '', simalPeppol: '' },
      users: [], sessions: [], mfaChallenges: [],
      submissions: [], drafts: [], invites: [],
      invoices: [], nextInvSeq: 5001,
      auditLog: [], outbox: [], screening: {}, tokens: [], rfqs: [], products: [],
    };
  }

  function migrate(d) {
    if (!Array.isArray(d.tokens)) d.tokens = []; /* B8 one-time tokens (T2.2) */
    if (!Array.isArray(d.rfqs)) d.rfqs = []; /* B11 RFQ engine (T3.4) */
    if (!Array.isArray(d.products)) d.products = []; /* read-only catalog mirror for JSON mode (T3.4) */
    if (d.version === 1) {
      if (!Array.isArray(d.invites)) d.invites = [];
      if (!Array.isArray(d.outbox)) d.outbox = [];
      if (!d.screening) d.screening = {};
      d.version = 2;
    }
    if (d.version === 2) {
      if (!Array.isArray(d.invoices)) d.invoices = [];
      if (!Number.isInteger(d.nextInvSeq)) d.nextInvSeq = 5001;
      d.version = 3;
    }
    for (const k of Object.keys(blank())) if (d[k] === undefined) d[k] = blank()[k];
    return d;
  }

  function load() {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      db = migrate(JSON.parse(raw));
    } catch (e) {
      if (e.code !== 'ENOENT') log.warn('db_read_failed', { error: String(e.message), using: 'blank' });
      db = blank();
    }
    return db;
  }

  function flush() {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db), { encoding: 'utf8' });
    const fd = fs.openSync(tmp, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fs.renameSync(tmp, file);
  }

  /** serialised, coalescing persistence — safe under concurrent requests */
  function persist() {
    dirty = true;
    return writing = writing.then(() => {
      if (!dirty) return;
      dirty = false;
      try { flush(); } catch (e) { log.error('db_write_failed', { error: String(e.message) }); dirty = true; }
    });
  }

  async function syncPersist() { dirty = true; await persist(); await writing; }

  load();
  return {
    get data() { return db; },
    persist, syncPersist,
    uploadsDir: path.join(dataDir, 'uploads'),
    reload: load,
  };
}
