#!/usr/bin/env node
// scripts/reencrypt-documents.mjs — rm(2.4-3) / F-2026-N06 data-loss guard.
// After the DOC_ENCRYPTION_KEY rotation (rm(2.4-1)), any file still encrypted with a
// legacy key would be unreadable. This tool audits and (with --apply) re-encrypts
// every stored document under the CURRENT key. The runtime readFile also self-heals
// legacy documents on read; this tool makes the migration explicit and complete.
//
//   node scripts/reencrypt-documents.mjs            # dry-run audit (default)
//   node scripts/reencrypt-documents.mjs --apply    # rewrite legacy files under the current key
//
// Exit 0 = no legacy/corrupt files remain (or --apply converted them).
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const APPLY = process.argv.includes('--apply');

// Load apps/portal/.env (same tiny parser semantics as config.js — no interpolation).
{
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'portal', '.env');
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq < 1) continue;
    const k = s.slice(0, eq).trim();
    if (!(k in process.env)) process.env[k] = s.slice(eq + 1).trim();
  }
}
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(REPO, 'apps/portal/data/uploads');
const ENC_MAGIC = Buffer.from('SIMALENC1');

const currentSecret = process.env.DOC_ENCRYPTION_KEY || process.env.SESSION_SECRET;
if (!currentSecret && process.env.NODE_ENV === 'production') {
  console.error('DOC_ENCRYPTION_KEY is required — refusing.'); process.exit(1);
}
const legacyCandidates = [
  ...(process.env.SESSION_SECRET ? [process.env.SESSION_SECRET] : []),
  'simal-document-encryption-key-2026',
];
const key = (s) => crypto.scryptSync(s, 'simal-doc-enc-salt-v1', 32);

const tryDecrypt = (secret, buf) => {
  const iv = buf.subarray(ENC_MAGIC.length, ENC_MAGIC.length + 12);
  const tag = buf.subarray(ENC_MAGIC.length + 12, ENC_MAGIC.length + 28);
  const ct = buf.subarray(ENC_MAGIC.length + 28);
  const d = crypto.createDecipheriv('aes-256-gcm', key(secret), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
};
const encryptWith = (secret, buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(secret), iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([ENC_MAGIC, iv, c.getAuthTag(), enc]);
};

const files = (await fs.readdir(UPLOADS, { withFileTypes: true }).catch(() => []))
  .filter(e => e.isFile() && !e.name.startsWith('.'))   /* rm(8.1-3): skip the media/ subdirectory */
  .map(e => e.name);
let okCurrent = 0, legacyConverted = 0, plain = 0, corrupt = 0;
for (const f of files) {
  const p = path.join(UPLOADS, f);
  const raw = await fs.readFile(p);
  if (!(raw.length > ENC_MAGIC.length + 28 && raw.subarray(0, 9).equals(ENC_MAGIC))) {
    plain++; console.log(`  PLAIN   ${f} (no header — leaving as-is)`); continue;
  }
  try { tryDecrypt(currentSecret, raw); okCurrent++; continue; } catch { /* legacy or corrupt */ }
  let recovered = null;
  for (const legacy of legacyCandidates) {
    try { recovered = tryDecrypt(legacy, raw); break; } catch { /* next */ }
  }
  if (!recovered) { corrupt++; console.error(`  CORRUPT ${f} (no key works)`); continue; }
  if (APPLY) {
    const rewritten = encryptWith(currentSecret, recovered);
    tryDecrypt(currentSecret, rewritten); // verify before replacing
    await fs.writeFile(p + '.tmp', rewritten);
    await fs.rename(p + '.tmp', p);
    legacyConverted++; console.log(`  MIGRATED ${f} (legacy -> current key)`);
  } else {
    console.log(`  LEGACY  ${f} (readable under a legacy key — run --apply to migrate)`);
    legacyConverted++;
  }
}
console.log(`\n[reencrypt] files=${files.length} current=${okCurrent} plain=${plain} legacy=${legacyConverted} corrupt=${corrupt} mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
process.exit(corrupt > 0 ? 1 : 0);
