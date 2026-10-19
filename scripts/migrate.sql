-- migrate.sql — B4 v2.0 DDL for PostgreSQL 16
-- Run: psql -h 127.0.0.1 -p 5433 -U simal -d simal -f migrate.sql
-- All money columns are BIGINT fils (ADR-5). No floats, ever.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- ==== portal: identity ====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin','reviewer','viewer','partner')),
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);
-- rm(10.3-1 pen MFA-06): RFC 6238 §5.2 — reject reuse of an accepted TOTP step
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_totp_step BIGINT;

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  created_at BIGINT NOT NULL,
  last_seen BIGINT NOT NULL,
  idle_ms INT DEFAULT 1200000,
  expires_at BIGINT NOT NULL
);

-- ==== portal: KYC ====
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  company JSONB, tax JSONB, contacts JSONB, signatories JSONB, ubos JSONB,
  banking JSONB, declarations JSONB,
  reviewer TEXT, rejection_reason TEXT, hold_reason TEXT,
  partner_account JSONB,
  history JSONB DEFAULT '[]'::jsonb,
  submitted_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_submissions_trn_approved ON submissions ((tax->>'trn')) WHERE status = 'approved';
CREATE TABLE IF NOT EXISTS documents (
  doc_id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES submissions(id),
  rel_path TEXT NOT NULL, size INT, mime TEXT
);
CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY, email CITEXT, role TEXT, status TEXT
);

-- ==== portal: e-invoice ====
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,
  seller JSONB NOT NULL,
  partner_email CITEXT NOT NULL,
  buyer_tin CHAR(15) NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_peppol TEXT GENERATED ALWAYS AS ('0235:' || substring(buyer_tin from 1 for 10)) STORED,
  po_ref TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency CHAR(3) DEFAULT 'AED',
  net_fils BIGINT NOT NULL,
  vat_fils BIGINT NOT NULL,
  total_fils BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','validated','delivered','rejected')),
  validation JSONB,
  reject_reason TEXT,
  kyc_ref TEXT,
  ubl JSONB,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  CHECK (due_date >= issue_date),
  CHECK (currency = 'AED')
);
CREATE TABLE IF NOT EXISTS invoice_lines (
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  descr TEXT NOT NULL,
  qty INT NOT NULL CHECK (qty BETWEEN 1 AND 100000),
  unit_price_fils BIGINT NOT NULL CHECK (unit_price_fils > 0),
  vat_rate_pct INT DEFAULT 5,
  PRIMARY KEY (invoice_id, idx)
);

-- ==== site: catalog ====
CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  sku TEXT, name TEXT NOT NULL, brand TEXT, cat TEXT, cat_label TEXT,
  descr TEXT, short TEXT, specs JSONB, imgs JSONB, stock BOOLEAN DEFAULT TRUE, is_new BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS product_deep (
  slug TEXT PRIMARY KEY REFERENCES products(slug),
  hero TEXT, specs JSONB, feats JSONB, use_cases JSONB, box JSONB, docs JSONB
);
CREATE TABLE IF NOT EXISTS brands (
  slug TEXT PRIMARY KEY, name TEXT NOT NULL, counts JSONB
);

-- ==== site: content ====
CREATE TABLE IF NOT EXISTS content_blocks (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL, entity_id TEXT NOT NULL, lang CHAR(2) DEFAULT 'en',
  payload JSONB NOT NULL,
  updated_by TEXT, updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  UNIQUE(entity, entity_id, lang)
);
CREATE TABLE IF NOT EXISTS hero_slides (
  idx INT PRIMARY KEY,
  kick TEXT NOT NULL, headline TEXT NOT NULL, sub TEXT NOT NULL,
  cta_label TEXT NOT NULL, cta_href TEXT NOT NULL,
  photo_slug TEXT, bg TEXT, motif TEXT, active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  quote TEXT NOT NULL, name TEXT NOT NULL, role TEXT, company TEXT, active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS category_guides (
  cat TEXT PRIMARY KEY, points JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS legal_policies (
  slug TEXT, title TEXT NOT NULL, body TEXT NOT NULL,
  lang CHAR(2) DEFAULT 'en', version INT DEFAULT 1,
  PRIMARY KEY (slug, lang)
);
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT 'Learn More',
  cta_href TEXT,
  active BOOLEAN DEFAULT TRUE,
  starts_at BIGINT,
  ends_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active, starts_at, ends_at);

-- ==== site: transactions ====
CREATE TABLE IF NOT EXISTS rfqs (
  ref TEXT PRIMARY KEY,
  email CITEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  submitted_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);
CREATE TABLE IF NOT EXISTS rfq_items (
  rfq_ref TEXT REFERENCES rfqs(ref) ON DELETE CASCADE,
  slug TEXT NOT NULL, qty INT NOT NULL,
  PRIMARY KEY (rfq_ref, slug)
);

-- ==== shared ====
CREATE TABLE IF NOT EXISTS audit_log (
  ts BIGINT NOT NULL,
  actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, details TEXT
);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  channel TEXT, to_addr CITEXT, subject TEXT, body TEXT,
  status TEXT DEFAULT 'queued', meta JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);
CREATE TABLE IF NOT EXISTS settings (
  k TEXT PRIMARY KEY, v JSONB NOT NULL
);

-- ==== seed: Simal identity (TIN from portal .env, never in source) ====
INSERT INTO settings (k, v) VALUES
  ('simalTin', '"100123456700003"'),
  ('simalPeppol', '"0235:1001234567"')
ON CONFLICT (k) DO NOTHING;

-- ==== B5 (T6.5 audit): portal parity tables — drafts + screening results,
-- invites widened. Forward-only; no destructive changes. ====
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  email CITEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor','customer')),
  step INT NOT NULL DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  documents JSONB NOT NULL DEFAULT '[]',
  started_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS drafts_email_role_idx ON drafts (email, role);

CREATE TABLE IF NOT EXISTS screening_results (
  ref TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  saved_at BIGINT NOT NULL
);

ALTER TABLE invites ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS converted_at BIGINT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS submission_id TEXT;

-- ==== B6 (T7.3 rehearsal finding): cms_revisions + analytics_events were
-- created on the dev DB during Phase 4 but never folded into this file —
-- a fresh environment could not reproduce the full 25-table schema. ====
CREATE TABLE IF NOT EXISTS cms_revisions (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  actor TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);
CREATE INDEX IF NOT EXISTS cms_revisions_lookup_idx ON cms_revisions (table_name, record_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  consent BOOLEAN DEFAULT false,
  session_hash TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(epoch FROM now()) * 1000)::bigint
);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events (event_name);

-- ==== B7 (T2.3): delivered-invoice immutability (C3 v2.0) — mirrors
-- migrations/007_enforce_invoice_immutability.sql ====
-- (fixed: BEFORE DELETE must return OLD — returning NEW (NULL) silently cancelled
--  EVERY delete, delivered or not; found clearing sandbox residue, iter-6)
CREATE OR REPLACE FUNCTION simal_invoice_immutable() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'delivered' THEN
    RAISE EXCEPTION 'invoice % is delivered and immutable (C3): amendments must use credit notes', OLD.id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_immutable ON invoices;
CREATE TRIGGER invoices_immutable
  BEFORE UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION simal_invoice_immutable();

CREATE OR REPLACE FUNCTION simal_invoice_lines_immutable() RETURNS trigger AS $$
DECLARE
  inv_status TEXT;
  inv_id TEXT;
BEGIN
  inv_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END;
  SELECT status INTO inv_status FROM invoices WHERE id = inv_id;
  IF inv_status = 'delivered' THEN
    RAISE EXCEPTION 'lines of delivered invoice % are immutable (C3)', inv_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_lines_immutable ON invoice_lines;
CREATE TRIGGER invoice_lines_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines
  FOR EACH ROW EXECUTE FUNCTION simal_invoice_lines_immutable();

-- ==== B8 (T2.2): one-time tokens — hashed storage, single-use, TTL ====
CREATE TABLE IF NOT EXISTS one_time_tokens (
  kind TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  expires_at BIGINT NOT NULL,
  consumed_at BIGINT,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (kind, token_hash)
);
CREATE INDEX IF NOT EXISTS ott_subject_idx ON one_time_tokens (subject);

-- ==== B9 (deep iteration): workflow/account fidelity columns — the PG
-- adapter dropped users.pending_* and submissions.documents/queries/review/
-- screening/duplicate_of_tin/created_at; add them so both stores round-trip ====
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_totp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email CITEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS queries JSONB DEFAULT '[]'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review JSONB DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS screening JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS duplicate_of_tin JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS created_at BIGINT;

-- ==== B10 (deep iteration): reference sequences folded back — ref_seq/inv_seq
-- existed only on the dev DB; fresh environments could not issue references ====
CREATE SEQUENCE IF NOT EXISTS ref_seq START 10061;
CREATE SEQUENCE IF NOT EXISTS inv_seq START 5001;

-- ==== B11 (T3.4, FRS-R): RFQ engine columns + sequence ====
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE rfq_items ADD COLUMN IF NOT EXISTS note TEXT;
CREATE SEQUENCE IF NOT EXISTS rfq_seq START 1001;

-- B12 (visual-fidelity port): brand line + note for the PDP "brand line" block (content §04, prototype brandInfo)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS line TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS note TEXT;

-- ==== B13 (RM-7.3-1): dual-approval ledger for sensitive publishes (SEC-11 residue) ====
-- One row per publish request whose SERVER-DERIVED dirty set contains sensitive
-- changes. The requester can never approve their own request (decided_by must be a
-- distinct staff user); approval re-checks the dirty set (409 on drift) and the TTL.
CREATE TABLE IF NOT EXISTS publish_approvals (
  id TEXT PRIMARY KEY,
  requested_by CITEXT NOT NULL,
  change_set JSONB NOT NULL,                       -- the server-derived dirty set at request time {items, maxAuditTs}
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  reason TEXT, decided_by CITEXT, decided_at BIGINT, outbox_id TEXT,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now())*1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS publish_approvals_status_idx ON publish_approvals(status);

-- ==== B14 (RM-8.3-1 / SEO-2 residue): real modification times for sitemap <lastmod> ====
-- Only content_blocks carried updated_at; the sitemap hardcoded VERIFIED_BASE_DATE
-- for every URL (240 x 2026-10-12). Nullable BIGINT epoch-ms, same convention as
-- content_blocks.updated_at. Never-edited rows stay NULL and the sitemap falls
-- back to VERIFIED_BASE_DATE via ts(). Backfill: newest cms_revisions row per
-- record (revisions are written on UPDATE only, so this is the last edit time).
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE legal_policies ADD COLUMN IF NOT EXISTS updated_at BIGINT;
ALTER TABLE product_deep ADD COLUMN IF NOT EXISTS updated_at BIGINT;
UPDATE products p SET updated_at = (SELECT MAX(r.created_at) FROM cms_revisions r WHERE r.record_id = p.slug AND r.table_name IN ('products', 'product_deep')) WHERE p.updated_at IS NULL;
UPDATE product_deep d SET updated_at = (SELECT MAX(r.created_at) FROM cms_revisions r WHERE r.record_id = d.slug AND r.table_name = 'product_deep') WHERE d.updated_at IS NULL;
UPDATE brands b SET updated_at = (SELECT MAX(r.created_at) FROM cms_revisions r WHERE r.record_id = b.slug AND r.table_name = 'brands') WHERE b.updated_at IS NULL;
UPDATE legal_policies lp SET updated_at = (SELECT MAX(r.created_at) FROM cms_revisions r WHERE r.record_id = lp.slug AND r.table_name = 'legal_policies') WHERE lp.updated_at IS NULL;

-- ==== DAT-6: Safe PL/pgSQL synchronization for serial sequences and standalone sequences ====
DO $$
DECLARE
    r RECORD;
    v_seq TEXT;
    v_max BIGINT;
BEGIN
    FOR r IN (
        SELECT c.relname AS tbl, a.attname AS col
        FROM pg_class c
        JOIN pg_attribute a ON a.attrelid = c.oid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND pg_get_serial_sequence(quote_ident(n.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL
    ) LOOP
        v_seq := pg_get_serial_sequence(quote_ident('public') || '.' || quote_ident(r.tbl), r.col);
        IF v_seq IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(%I), 1) FROM %I', r.col, r.tbl) INTO v_max;
            PERFORM setval(v_seq, v_max, true);
        END IF;
    END LOOP;

    -- Standalone sequences
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ref_seq') THEN
      PERFORM setval('ref_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(id FROM '[0-9]+$')::bigint), 10060) FROM submissions WHERE id ~ '[0-9]+$'), 10060), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'inv_seq') THEN
      PERFORM setval('inv_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(ref FROM '[0-9]+$')::bigint), 5000) FROM invoices WHERE ref ~ '[0-9]+$'), 5000), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'rfq_seq') THEN
      PERFORM setval('rfq_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(ref FROM '[0-9]+$')::bigint), 1000) FROM rfqs WHERE ref ~ '[0-9]+$'), 1000), true);
    END IF;
END;
$$;


-- rm(4.3-1)/CMS-4: stock becomes a real BOOLEAN (idempotent on existing DBs)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock' AND data_type='text') THEN
    ALTER TABLE products ALTER COLUMN stock DROP DEFAULT;
    ALTER TABLE products ALTER COLUMN stock TYPE BOOLEAN USING CASE WHEN stock IN ('true','t','1') THEN TRUE ELSE FALSE END;
    ALTER TABLE products ALTER COLUMN stock SET DEFAULT TRUE;
  END IF;
END $$;
