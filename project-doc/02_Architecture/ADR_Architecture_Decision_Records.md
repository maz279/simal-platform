# Architecture Decision Records (ADR)

**Doc ID:** B3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL · Format: Context / Options / Decision / Consequence

## ADR-1 — Runtime: Node.js 22 LTS, single language
**Context:** portal is proven zero-dependency Node; team (Unisoft) is Node-strong. **Options:** Node · Python/Django · PHP/Laravel · .NET. **Decision:** Node 22 LTS for all tiers. **Consequence:** one language, code reuse from portal; hiring profile fixed; EOL tracked (E3).

## ADR-2 — Corporate site rendering: SSG + hydration (Astro 5.x), not SPA
**Context:** 36 pages are content pages (SEO-critical per content §15); prototype is SPA-ish for detail tiers. **Options:** SSR each request · SSG with ISR · keep SPA · **frameworks evaluated:** Astro 5.x · Eleventy · Next.js 15. **Decision:** **Astro 5.x** — SSG with native islands architecture (`client:load`, `client:visible`), zero-JS by default, content collections map 1:1 to PG `content_blocks`. **Consequence:** CDN-cacheable pages, LCP < 1.8s guaranteed (no React runtime); detail-tier interactions rebuilt as Astro islands per B2 §8; content collections provide type-safe CMS integration. **Amendment (v8.0, 5 Oct 2026):** framework selection formalized per forensic audit finding F-06.

## ADR-3 — Database: PostgreSQL
**Context:** portal JSON store was explicit swap-point (architecture doc D3); relational integrity needed for KYC↔invoice TRN matching. **Options:** PostgreSQL · MySQL · MongoDB. **Decision:** PostgreSQL 16, repository interface preserved. **Consequence:** schema per B4; transactional totals checks; JSON-store becomes seed/migration source.

## ADR-4 — Authentication: extend portal engine (scrypt + optional TOTP + server sessions)
**Context:** proven: scrypt(N=16384), timing-safe verify, idle+absolute sessions, lockout, strict cookies; partners password-only, staff TOTP-capable. **Options:** extend engine · OAuth/OIDC provider · SaaS auth. **Decision:** extend the engine; add password reset + email verification only. **Consequence:** no external dependency; full control per PDPL; FRS-K continues to hold.

## ADR-5 — Money: integer fils columns + service-owned arithmetic
**Context:** e-invoice module verified float-free (edge tests). **Options:** fils ints · numeric(18,2) · floats. **Decision:** `BIGINT fils` columns; arithmetic only in einvoice service (floor((net*5+50)/100)). **Consequence:** D3 rejects any float currency column (risk R6).

## ADR-6 — Peppol access: accredited ASP integration
**Context:** FTA Phase 1 (1 Jan 2027); in-house accreditation unrealistic for Phase 1. **Options:** ASP integration · direct accreditation · manual exchange. **Decision:** integrate one accredited ASP; keep UBL 2.1 generation in-house (as built); manual fallback for top counterparties. **Consequence:** C2 onboarding critical path; delivery remains our UBL stamp (risk R1).

## ADR-7 — Email: provider abstraction with durable outbox (as built)
**Decision:** keep notify.service seam (SMTP/provider) + outbox audit trail. **Consequence:** provider swap is config; bounce handling added in P3.

## ADR-8 — Arabic/RTL: CMS-managed translations, Western numerals
**Context:** URD RTL rules; prototype ar.html proves layout parity. **Decision:** CMS `cms_override(lang)` rows; numerals Western per UAE convention. **Consequence:** F4 governance owns translation QA.

## ADR-9 — Hosting: UAE-region cloud VM(s) + CDN, vendor via RFP (G5)
**Decision:** UAE region primary (latency + data-residency posture for DPIA), CDN global. **Consequence:** E1/E3 config; vendor SLA feeds F2.

## ADR-10 — Observability: structured JSON logs + request-id (kept), plus uptime/error alerting
**Decision:** extend built-in logging; add metrics + alerts per E5. **Consequence:** no APM lock-in initially.

## ADR-11 — Site search: pg_trgm in PostgreSQL (audit addition)
**Context:** prototype ships typo-tolerant token-start matching in JS over ~100 records. **Options:** pg_trgm · external search SaaS · naive SQL LIKE. **Decision:** pg_trgm GIN index (name/sku/brand/cat + content titles), same `/api/search` shape. **Consequence:** zero new services; re-evaluate only if corpus > 50k or faceting needed.

## ADR-12 — Former hash-tier pages become real routes
**Context:** 200+ hash-driven pages (product#slug etc.) can't be SEO-canonical or CDN-cached. **Options:** keep hash routing · real routes with redirects. **Decision:** real routes (`/products/:slug` etc. per B2 §2); hash URLs 301 to routes (H2 map). **Consequence:** SSG-friendly; parity maintained via G1 §4 cross-link graph check.

## ADR-13 — CMS publish = build hooks + tag purge, not runtime rendering
**Context:** SSG pages must reflect CMS edits quickly without rebuilding the world. **Decision:** incremental rebuild of affected slugs + CDN tag purge on publish (per [value-pattern practice](https://rangle.io)); portal stays runtime. **Consequence:** publish latency ≤ 5 min target; rollback = previous build artifact.

## ADR-14 — As-built stack ratification & Fluent Design CMS scoping (Remediation P9-1)
**Context:** Kickoff PRD recommended headless CMS + Next.js; SRS proposed FastAPI/Python; internal CMS was loosely titled "Dynamics 365" creating confusion.
**Decision:** Formally ratify the as-built stack: **Astro 5 SSG** (`apps/site`), **Node.js 22 LTS microservice** (`apps/portal`), **PostgreSQL 16.x** (`simal`), **scrypt(N=16384) + RFC 6238 TOTP**, and **bespoke CMS styled to Microsoft Fluent Design specifications** (not a licensed Microsoft cloud instance). See canonical record `Codebase/docs/adr/ADR-009-AS-BUILT-STACK-RATIFICATION.md`.
**Consequence:** Retires all legacy claims of external headless SaaS CMS, Python, or native Microsoft Dynamics 365 cloud dependency; locks single ratified baseline across all project docs.

## Amendment rule (G4 tie-in)
ADR changes append a dated amendment block — never rewrite history; superseded decisions keep their ID with `Superseded by ADR-n`.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — 10 decisions ratified for P0 sign-off |
| 2026-10-05 | **v2.0 audit:** +ADR-11 search, +ADR-12 routes-vs-hash, +ADR-13 CMS publish/purge; +amendment rule |
| 2026-10-14 | **v3.0 governance:** +ADR-14 as-built stack ratification & Fluent Design CMS scoping (P9-1 / GOV-1 / GOV-4) |
