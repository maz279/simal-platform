# Technical Architecture Document (TAD)

**Doc ID:** B1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL · **Depends on:** B3 ADRs

## 1. Target architecture (production)

```
                    ┌──────────────── CDN / TLS (static assets, images) ────────────────┐
Browser ──────────▶ │  Corporate site (SSR/SSG pages)      Portal SPA (login/KYC/e-inv) │
                    └───────────────┬───────────────────────────────┬───────────────────┘
                                    │ HTTPS (JSON, cookie sessions)  │
                    ┌───────────────▼───────────────────────────────▼───────────────────┐
                    │  Application tier (Node 22+, per ADR-1)                            │
                    │  site module │ kyc module │ einvoice module │ cms/admin module    │
                    │  middleware: request-id · CSP headers · rate limits · sessions     │
                    └──────┬──────────────┬───────────────┬──────────────┬──────────────┘
                           ▼              ▼               ▼              ▼
                    PostgreSQL      Object storage    SMTP/provider   Peppol ASP
                    (B4 schema)     (KYC documents)   (notify)        (C2, delivery)
                           │
                    Audit log + backups (E4)
```

## 2. Module boundaries (mirrors today's code, no deviation)

1. **site** — corporate pages served from the CMS-backed content tables; replaces `window.*` JS globals (see B2 §3). Public, cacheable at CDN.
2. **kyc** — unchanged engine from `simal_kyc/KYC_System` + `portal/`: drafts→applications→review workflow, screening, invites, webhooks, master-data feed.
3. **einvoice** — `einvoice.service` as built: fils math, lifecycle, 7 checks, UBL export, partner provisioning hook on approval.
4. **cms/admin** — role-gated back office over the same DB (replaces localStorage CMS panels in the prototype).

## 3. Cross-cutting decisions (summary; rationale in B3)

| Concern | Decision |
|---|---|
| Runtime | Node 22 LTS, zero-dependency core kept where proven; framework per ADR-2 only at the site tier |
| Auth | One session system (portal's scrypt+TOTP+idle-expiry) for staff **and** partners; HttpOnly SameSite=Strict cookies |
| Sessions | Server-side store (DB table), idle 20 min / absolute per config |
| Money | integer fils columns; computed only in `einvoice` service functions |
| Files | KYC documents to object storage with magic-byte validation retained |
| Email | provider abstraction with durable outbox fallback (as built) |
| i18n | EN primary; AR/RTL per URD rules (Western numerals), CMS-managed |
| Observability | structured JSON logs + request-id (as built) → E5 stack |

## 4. Scaling & failure analysis

- Stateless app tier → horizontal scale behind LB; sessions in DB (no sticky needed).
- Single-points-of-failure: DB (primary/standby per E4), ASP (single accredited provider + manual fallback per C2), email provider (outbox durability absorbs outages).
- Read-heavy catalog pages cacheable; portal endpoints no-store (as today's no-store policy).

## 5. Security posture (summary; full in B6)

Strict CSP (`script-src 'self'`), nosniff, DENY framing, no-referrer; rate limits (public 120/min, login 10/5min+lockout, status 20/min); JSON cap; upload allow-list + magic bytes; PII masking by default (`view_pii` gate); audit on every state change.

## 7. Capacity, search & i18n (audit v2.0 additions)

**Capacity assumptions (drive D4 profiles):** year-1 — 5k products views/day, 200 concurrent browse peak, 50 concurrent portal, ~40k invoices/yr, KYC ~30/week. Sizing: 2× 2-vCPU app nodes + db.t-class medium; revisit at 10×.

**Search:** typo-tolerant site search (prototype: token-start fuzzy) → PostgreSQL `pg_trgm` trigram similarity on name/sku/brand/cat (+ insights/solutions titles) behind the same `/api/search` contract; no external search service Phase 1 (ADR-11).

**CDN/cache strategy:** SSG HTML — tag-based purge on CMS publish (publish → purge affected slugs, per [incremental CMS practice](https://rangle.io)); versioned assets immutable; portal HTML + all `/api/*` no-store (matches shipped policy). Cache-key = path only (no cookies) so partner/public traffic never cross-contaminates.

**i18n:** EN canonical; AR rows via `lang` dimension in content tables; URL strategy `/ar/...` prefix at Phase-1.1 (site), portal stays EN (A6 §6).

**Migration sequencing (strangler-style, [pattern](https://system-design.muthu.co)):** portal module ships first (already real software), site pages route-in incrementally behind the facade during P3 staging; legacy mirror stays authoritative until E7 cutover — no big-bang content switch.

## 8. Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 baseline; module boundaries frozen to shipped code |
| 2026-10-05 | **v2.0 audit:** +capacity assumptions, search architecture (ADR-11), CDN purge/no-store policy, i18n URL strategy, strangler-style migration sequencing |
