# API Contract — OpenAPI Specification

**Doc ID:** B5 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL
Canonical contract: the shipped `portal/docs/API.md` (KYC + auth + admin + integration) **plus** the e-invoicing endpoints built 5 Oct 2026. Production adds the site content API. Machine-readable YAML is generated from this file during P0 (`openapi.yaml` artifact in CI).

## Conventions (unchanged from shipped system)

- Base `https://<host>` · JSON bodies · errors `{error, details:[{field,message}]}` on 422.
- Session cookie `kyc_sid` (HttpOnly, SameSite=Strict); idle 20 min.
- Rate limits: public 120/min/IP · login 10/5min per account+IP with lockout · status 20/min.
- Security headers on every response (CSP `default-src 'self'…`, nosniff, DENY, request-id).

## e-Invoicing endpoints (as implemented — no deviation)

### Partner (session; role=partner)
| Method | Path | Body → Response |
|---|---|---|
| GET | `/api/einvoice/mine` | → `{invoices:[publicView]}` |
| POST | `/api/einvoice` | `{buyerTin, buyerName, poRef?, issueDate, dueDate, currency:'AED', lines:[{desc,qty,unitPrice}]}` → **201** `{id, ref, status:'draft'}` · 403 non-partner · 422 field details |
| GET | `/api/einvoice/:id` | → publicView (404 unknown; 403 other partner's) |
| PUT | `/api/einvoice/:id` | same body → 200 (drafts only; 409 otherwise) |
| POST | `/api/einvoice/:id/submit` | → `{status:'submitted'}` · 422 if totals drifted (server corrects) |
| GET | `/api/einvoice/:id/ubl` | → `{provisional:boolean, ubl:UBL21}` |

### Staff (session; queue read = any staff role; actions = `decide` perm)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/einvoice/admin/queue?status=` | rows newest-first: id, ref, buyer, TRN, partner, dates, total AED, kyc flag, ageDays |
| GET | `/api/einvoice/admin/:id` | full publicView |
| POST | `/api/einvoice/admin/:id/actions` | `{action:'validate'\|'deliver'\|'reject'\|'reopen', reason?}` → 200 · 400 unknown action · 409 illegal transition · 422 validation failed (check names) / reason < 5 chars |

### Validation checks (stable order — UI depends on it)
`totals_recomputed, trn_format_15_digit, trn_registered_peppol_prefix, buyer_kyc_approved, dates_ordered, lines_nonempty, currency_aed`

### UBL 2.1 envelope (delivered form)
`ublVersion 2.1 · customisationID urn:simal:invoice:phase1:ae · id=ref · invoiceTypeCode 388 · supplier{endpointID 0235:<simalTin>, schemeID 0235, taxScheme ARE} · customer{endpointID 0235:<buyerTin>} · lines[]{id, description, quantity, unitPrice, baseAmount, vatRatePct:5, taxAmount, lineTotal} · totals{net, vat, payable} · kyc{reference}`

## Site content API (audit v2.0 — shapes fixed, not deferred)

| Endpoint | Shape |
|---|---|
| GET `/api/search?q=` | `{results:[{type:'product'\|'insight'\|'solution'\|'page', slug, name, snippet}], count}` — pg_trgm (ADR-11), typo-tolerant, rate-limited 120/min |
| GET `/api/catalog/:slug` | publicView of product + deep + brand counts — cacheable ETag |
| GET `/api/insights/:slug` | article incl. body — cacheable |
| POST `/api/rfq` | `{items:[{slug,qty}], email}` → **201** `{ref:'SIMAL-RFQ-YYYYMMDD-NNNN', validUntil:+7d}` · 422 field details · honeypot field `website` (silent drop) |
| GET `/api/rfq/:ref?email=` | partner lookup (same pattern as KYC status) |
| CMS `/api/cms/*` | staff-gated (`notes` perm): GET/PUT content blocks + hero_slides + legal_policies; every PUT publishes purge event (ADR-13) |

**Error catalog addition (site):** `rfq_items_empty`, `rfq_qty_range`, `rfq_email_invalid`, `search_q_required` — same `{error, details[]}` envelope. **Versioning:** `Accept-Version: 1` header honored (default 1); breaking → v2 paths per G4.

## Compatibility rules

- Breaking changes require a version bump (`/api/v2/...`); the e-invoice contract above is v1 and frozen for Phase 1.
- The existing KYC/auth/admin/integration surface keeps its documented shapes (portal/docs/API.md remains normative).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — mirrors shipped routes 1:1 |
| 2026-10-05 | **v2.0 audit:** site API shapes fixed in-doc (were "P0 TBD" — gap); +search/RFQ/CMS endpoints, error catalog, Accept-Version rule; parity tie: every endpoint maps to a G1 §4 parity item |
