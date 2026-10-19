# Database Design & Schema

**Doc ID:** B4 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL · **DB:** PostgreSQL 16 (ADR-3) · Money = BIGINT fils

## 1. Entity map

```
users ──< sessions          submissions ──< queries
  │                            │  ──< documents (object-storage refs)
  │                            │  ──< screening_results
  │(partner via partnerEmail)  │
  └────────────────────────> invoices ──< invoice_lines
                                 │ └─ validation(JSONB), ubl(JSONB), timeline(JSONB)
catalog/products/brands/cms tables (site)      rfq ──< rfq_items
insights/software-tiers content tables         audit_log, outbox, settings
```

## 2. Core DDL (essential columns; names align to A7 dictionary)

```sql
-- portal: identity
CREATE TABLE users (id TEXT PK, email CITEXT UNIQUE NOT NULL, name TEXT, role TEXT NOT NULL
  CHECK (role IN ('super_admin','reviewer','viewer','partner')), password_hash TEXT NOT NULL,
  totp_secret TEXT, active BOOLEAN DEFAULT TRUE, created_at BIGINT);
CREATE TABLE sessions (sid TEXT PK, user_id TEXT REFERENCES users, created_at BIGINT,
  last_seen BIGINT, idle_ms INT, expires_at BIGINT);

-- KYC
CREATE TABLE submissions (id TEXT PK /*SIM-KYC-YYYY-NNNNN*/, role TEXT, status TEXT NOT NULL,
  company JSONB, tax JSONB, contacts JSONB, signatories JSONB, ubos JSONB, banking JSONB,
  declarations JSONB, reviewer TEXT, rejection_reason TEXT, hold_reason TEXT,
  partner_account JSONB, history JSONB, submitted_at BIGINT, updated_at BIGINT);
CREATE INDEX ON submissions ((tax->>'trn')) WHERE status='approved';  -- invoice TRN match
CREATE TABLE documents (doc_id TEXT PK, submission_id TEXT REFERENCES submissions,
  rel_path TEXT, size INT, mime TEXT);
CREATE TABLE invites (code TEXT PK, email CITEXT, role TEXT, status TEXT);

-- e-invoicing (fils BIGINT everywhere — ADR-5)
CREATE TABLE invoices (id TEXT PK, ref TEXT UNIQUE NOT NULL, seller JSONB,
  partner_email CITEXT NOT NULL, buyer_tin CHAR(15) NOT NULL, buyer_name TEXT NOT NULL,
  buyer_peppol TEXT GENERATED ALWAYS AS ('0235:' || buyer_tin) STORED,
  po_ref TEXT, issue_date DATE, due_date DATE, currency CHAR(3) DEFAULT 'AED',
  net_fils BIGINT NOT NULL, vat_fils BIGINT NOT NULL, total_fils BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','validated','delivered','rejected')),
  validation JSONB, reject_reason TEXT, kyc_ref TEXT, ubl JSONB, timeline JSONB,
  created_at BIGINT, updated_at BIGINT,
  CHECK (due_date >= issue_date), CHECK (currency='AED'));
CREATE TABLE invoice_lines (invoice_id TEXT REFERENCES invoices, idx INT,
  desc TEXT NOT NULL, qty INT CHECK (qty BETWEEN 1 AND 100000),
  unit_price_fils BIGINT CHECK (unit_price_fils > 0), vat_rate_pct INT DEFAULT 5,
  PRIMARY KEY (invoice_id, idx));

-- site content (from prototype seeds)
CREATE TABLE products (slug TEXT PK, sku TEXT, name TEXT, brand TEXT, cat TEXT,
  cat_label TEXT, descr TEXT, short TEXT, specs JSONB, imgs JSONB, stock TEXT, is_new BOOL);
CREATE TABLE product_deep (slug TEXT PK REFERENCES products, hero TEXT, specs JSONB,
  feats JSONB, use JSONB, box JSONB, docs JSONB);
CREATE TABLE brands (slug TEXT PK, name TEXT, counts JSONB);
CREATE TABLE content_blocks (id SERIAL PK, entity TEXT, entity_id TEXT, lang CHAR(2),
  payload JSONB, updated_by TEXT, updated_at BIGINT);  -- ITSOL/software/insights/hero slides
CREATE TABLE rfqs (ref TEXT PK, email CITEXT, status TEXT, submitted_at BIGINT);
CREATE TABLE rfq_items (rfq_ref TEXT REFERENCES rfqs, slug TEXT, qty INT);
CREATE TABLE audit_log (ts BIGINT, actor TEXT, action TEXT, target TEXT, details TEXT);
CREATE TABLE outbox (id TEXT PK, channel TEXT, to_addr CITEXT, subject TEXT, body TEXT,
  status TEXT, meta JSONB, created_at BIGINT);
CREATE TABLE settings (k TEXT PK, v JSONB);  -- simalTin, simalPeppol (from portal .env at seed)
```

```sql
-- audit v2.0: explicit content tables previously folded into content_blocks (align A7 v2.0)
CREATE TABLE hero_slides (idx INT PRIMARY KEY, kick TEXT, headline TEXT, sub TEXT,
  cta_label TEXT, cta_href TEXT, photo_slug TEXT, bg TEXT, motif TEXT, active BOOL DEFAULT TRUE);
CREATE TABLE testimonials (id SERIAL PRIMARY KEY, quote TEXT, name TEXT, role TEXT, company TEXT, active BOOL);
CREATE TABLE category_guides (cat TEXT PRIMARY KEY, points JSONB NOT NULL);  -- 7 × 3 buying-guide points
CREATE TABLE legal_policies (slug TEXT PRIMARY KEY, title TEXT, body TEXT, lang CHAR(2) DEFAULT 'en', version INT);
CREATE TABLE announcements (id SERIAL PRIMARY KEY, text TEXT, cta_href TEXT, active BOOL, starts_at BIGINT, ends_at BIGINT);
-- Phase-1.1 reserved (A6 §8): received_invoices (ASP inbox), credit_notes (typeCode 381)
```

## 3. Migration from current stores

`portal/data/db.json` → SQL via seed script (users, submissions, invoices — demo data scrubbed per environment); `Prototype/data/*.js` → catalog/content tables verbatim (B2 §4). JSON-store atomic-write discipline maps to normal transactions.

## 4. Integrity rules (tested in D3)

- TRN match for invoice validation resolved by the approved-submissions index above.
- Totals recomputed server-side at submit + validate (as built); DB CHECKs are defense-in-depth.
- Generated `buyer_peppol` guarantees the `0235:` prefix can never drift (check #3 of 7).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — DDL aligned to shipped entities (A7) |
| 2026-10-05 | **v2.0 audit:** +hero_slides, testimonials, category_guides, legal_policies, announcements tables (were missing — A7 v2 parity); Phase-1.1 reserved tables noted |
