# Data Dictionary

**Doc ID:** A7 · **Version:** 2.0 (audited & enhanced) · **Date:** 5 Oct 2026 · **Owner:** TL
Living reference ([dictionary practice](https://www.secoda.co)): changes only via G4 with B4 schema PR in the same change. PII: **P**=personal, **S**=sensitive; Sec=validation source file.

## Conventions
Money = **integer fils**. Dates ISO; timestamps epoch ms. Unique column marks production constraints (B4 DDL).

## 1. Corporate site — content entities (COMPLETE after audit: 8 structures previously missing now included)

| Entity (source) | Fields · rules · PII · Unique · Sec |
|---|---|
| product (`data/catalog.js`, 81) | slug **U**, sku, name, brand, cat(7 enum), catLabel, desc, short, specs[[k,v]], img[], stock, new |
| product_deep (`data/product-deep.js`, 81/81) | slug **U**→product, hero, specs, feats, use, box, docs |
| brand (`data/brands.js`, 23) | slug **U**, name, counts |
| testimonial (`data/testimonials.js`, 3 real) | quote, name, role, company — real mirror quotes only (no fabricated personas — PRD rule) |
| insight (`data/insights.js`, 14) | slug **U**, t, cat(8), mins, at, author, tags[], x, body[[h,[p]]], rel[]→insight.slug, cta[2] |
| content blocks (`data/content.js`) | **heroSlides** (5: kick,h,s,cta,href,slug) — production CMS `hero_slides` table for the carousel · **announcements** (dismissed flag per visitor) · **solutions5** (5 flagship slugs→ITSOL map) · **amcTiers** (3×5 SLA matrix — single source with it-solution#amc) · **erpPricing** (3 editions) · **erpModules** (7 → moduleDetail) · **counters** (cred strip) · **brandInfo** · **legalPolicies** (7: privacy, terms, cookie, return, shipping, refund, accessibility) |
| category guides (S.catGuide, 7×3) | cat **U**, points[3], (buying-guide content) — previously missing from v1.0 |
| solution_line ITSOL (`data/solutions.js`, 12) | id **U**, t, d, what, scope[4–5], process[3], faq[2], related[]≥2, cats[]→cat, tiers? |
| software tiers (`data/software.js`) | products×20{id **U**,grp}, moduleDetail×7{id **U**}, serviceDetail×12{id,subs[3×id **U**]}, solutionDetail×20{id,related,modules}, industryDetail×9{id,related} — all cross-ids validated by self-test |
| screening watchlist (`data/watchlist.csv`) | name entries; exact + LLC/FZE/TRADING-normalized matching (unit-tested) |

## 2. Site transactional (prototype localStorage → production)

| Entity | Fields · PII · Unique |
|---|---|
| rfq | ref `SIMAL-RFQ-YYYYMMDD-NNNN` **U**, items[{slug,qty}], email **P**, status, submittedAt — quote validity 7 days (FRS) |
| newsletter | email **P** **U**, confirmed(bool, double opt-in), at |
| session (site mock) | replaced by real sessions §3 |
| recent products | client-side only (accepted exception, G1 §4.5) |
| cms_override | (slug, field, lang) **U**, value, by, at |

## 3. Portal — identity & KYC (as built; validators `domain/validators.js`)

| Entity | Key fields · PII · Unique · Sec |
|---|---|
| user | id **U**, email **P** **U**(CITEXT), name **P**, role enum, passwordHash(scrypt), totpSecret **S**, active |
| session | sid **U**(64-hex), idle 20m/absolute 12h |
| submission | id `SIM-KYC-YYYY-NNNNN` **U**, role, status, company, tax{trn 15d, peppol `0235:trn`}, contacts **P**, signatories(name **P**, eid **S**), ubos **P/S**, banking{iban 23d **S**}, declarations, history[], queries[], screening, partnerAccount |
| document | docId **U**, relPath (magic-byte verified), size, mime |
| invite | code **U**, email **P**, role, status |
| draft | id **U**, **token 48-hex S** (possession secret), email **P**, role, data **P/S**, step |
| audit / outbox | immutable logs; outbox to_addr **P** |

## 4. Portal — e-Invoice (schema v3 as built)

| Field | Type · rules (Sec: einvoice.service.js) |
|---|---|
| id / ref | `inv_<hex>` **U** / `SIM-INV-YYYY-NNNN` **U** sequential server-issued |
| seller | settings-derived {tin, peppol 0235:, name} |
| partnerEmail | **P** — isolation key (403 cross-partner) |
| buyerTin | 15 digits **+ approved-submission index (B4)** |
| buyerPeppol | generated `0235:`+TRN (DB-generated — cannot drift) |
| poRef / issueDate / dueDate | ≤40 chars / due≥issue enforced |
| currency | AED only (Phase 1) |
| lines[] | desc ≤140, qty int 1–100000, unitPriceFils >0, vat 5% half-up per line |
| totals | net/vat/total fils — recomputed at submit + validate |
| status / validation / rejectReason / kyc / ubl / timeline | lifecycle + evidence per A6 §4 |

## 5. Derived enums (authoritative)

cats: internal-ssd, portable-ssd, memory, monitors, gaming, accessories, laptops · insight cats: CHANNEL, GUIDE, SOFTWARE, COMPLIANCE, SECURITY, STORAGE, PRODUCT, COMPANY · invoice & KYC statuses per A6 · roles: super_admin, reviewer, viewer, partner.

## 6. Completeness rule (audit fix)

Every prototype data file must appear above. Current coverage: catalog, brands, solutions, software, product-deep, insights, **testimonials, content(8 sub-structures), catGuide, watchlist** = 100% of `Prototype/data/*` + `portal` entities. Adding any new data file without a row here fails review (G4).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 |
| 2026-10-05 | **v2.0 audit:** +testimonials, heroSlides, amcTiers, erpPricing, erpModules, counters, brandInfo, legalPolicies, announcements, catGuide, watchlist (previously missing — 100%-porting gap); +Unique/Sec columns; +completeness rule; draft token flagged S |
