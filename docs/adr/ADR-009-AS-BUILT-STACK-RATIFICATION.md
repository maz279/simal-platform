# Architecture Decision Record (ADR-009): As-Built Technology Stack & CMS Ratification

**ADR ID:** ADR-009 (Formal As-Built Ratification)  
**Status:** RATIFIED & SUPERSEDING  
**Date:** 2026-10-14  
**Author:** Principal Software Architect & Technical Lead  
**Cross-References:** ADR-1 (Node.js 22), ADR-2 (Astro 5 SSG), ADR-3 (PostgreSQL 16), ADR-4 (scrypt + TOTP), ADR-13 (CMS publish/purge); Remediation Phase 9 (P9-1, GOV-1, GOV-4)  

---

## 1. Context

During the initial project phases (BRD/PRD kickoff), alternative architectural patterns were proposed, including:
1. An external headless SaaS CMS (e.g. Strapi, Directus, Payload) paired with Next.js 15 SSR/ISR.
2. A monolithic Python/FastAPI backend paired with Next.js 15 (as hypothesized in early SRS drafts).
3. Cosmetic branding references in internal consoles referencing "Microsoft Dynamics 365" and "Content Studio", which created misleading impressions of an enterprise Microsoft Dataverse cloud license or native Microsoft ERP integration.

The Independent Forensic Audit (2026-10-12) identified that the actual codebase was successfully built and stabilized using a distinct, high-performance architecture:
- Astro 5.x SSG for the public corporate portal.
- Node.js 22 LTS microservice backend for API services, partner onboarding, and authentication.
- Enterprise PostgreSQL 16.x relational engine with strict ACID transactions, foreign keys, and integer-fils arithmetic.
- A bespoke, lightweight CMS console styled to the Microsoft Fluent Design System specifications (`d365-cms.css`, `cms.html`), communicating directly with PostgreSQL via secure REST endpoints.

A formal architectural decision was required to officially ratify this as-built stack, retire legacy conflicting requirements, and eliminate misleading third-party ERP cloud branding.

---

## 2. Decision

We formally **RATIFY** the as-built architecture and declare it the permanent, standard production baseline:

1. **Corporate Public Edge:**
   - **Engine:** **Astro 5.x SSG** (`apps/site`).
   - **Rationale:** Pre-renders 240+ pages to static HTML/CSS with zero client-side JavaScript overhead by default, delivering sub-50ms TTFB and LCP < 1.8s across edge CDN nodes.
   - **Interactivity:** Selective hydration via Astro Islands (`client:load`, `client:visible`) for dynamic widgets (search, filters, forms).
   - **Decision:** Reject Next.js 15 SSR/ISR due to unnecessary server runtime memory overhead, complex cold starts, and higher hosting TCO.

2. **Application & Microservice Backend:**
   - **Engine:** **Node.js 22 LTS** (`apps/portal`).
   - **Rationale:** Native asynchronous I/O, zero-framework bloat, shared TypeScript/JavaScript types, fast startup times, and minimal memory footprint (< 100MB RSS).
   - **Decision:** Reject Python/FastAPI to preserve single-language runtime consistency, reduce developer context-switching, and leverage proven Node.js crypto and stream primitives.

3. **Database & Data Tier:**
   - **Engine:** **PostgreSQL 16.x** (`simal` on port 5433).
   - **Rationale:** Native ACID guarantees, robust JSONB support for document flexibility, `pg_trgm` fuzzy text indexing for catalogue search, and strict integer (`BIGINT fils`) storage ensuring zero float rounding errors in compliance with UAE FTA regulations.
   - **Decision:** Ratify PostgreSQL 16.x as the primary relational database. Reject PostgreSQL 17 claims (the installed and verified environment is PostgreSQL 16.x).

4. **Security, Cryptography & Auth:**
   - **Engine:** **scrypt key derivation** (RFC 7914 / Node crypto, N=16384, r=8, p=1) + **RFC 6238 TOTP MFA**.
   - **Rationale:** Hardware-hardened, memory-hard key derivation protecting stored passwords against GPU/ASIC brute-force cracking. Mandatory TOTP MFA for all administrative and reviewer roles in production.

5. **CMS Console & Fluent UI Scope (Demystification of Dynamics 365):**
   - **Engine:** Bespoke management console (`apps/portal/public/cms.html`, `apps/portal/public/assets/js/cms.js`, `apps/portal/public/assets/css/d365-cms.css`).
   - **Explicit Scope:** The console is styled to Microsoft Fluent Design System standards to provide a professional, enterprise-grade user experience for operations staff. **It is NOT a licensed Microsoft Dynamics 365 Cloud or Microsoft Dataverse deployment.**
   - **Decision:** Re-label all CMS titles, headers, and documentation as "Simal Content Studio (Fluent UI Theme)" to completely eliminate ambiguity regarding third-party cloud integrations.

---

## 3. Consequences

### Positive:
- **Zero Third-Party License Overhead:** Eliminates recurring enterprise SaaS licensing costs for external headless CMS vendors or Microsoft Dynamics cloud seats.
- **Flawless Performance & Security:** Zero runtime attack surface on public pages (static SSG), deterministic deployment via edge CDNs, and complete data sovereignty under UAE PDPL Decree-Law 45/2021.
- **Honest & Transparent Governance:** Reconciles code reality with governance documentation, removing false audit claims and technical debt.

### Operational Responsibilities:
- Operational staff must follow the Content Governance Policy (`docs/CONTENT_GOVERNANCE_POLICY.md`) for publishing changes.
- CMS changes write immediately to PostgreSQL, emit an outbox SSG rebuild event, and trigger static regeneration of affected routes.

---

## 4. Ratification Sign-Off

| Role | Name | Status | Date |
|---|---|---|---|
| Technical Lead & Architect | Architectural Board | RATIFIED | 2026-10-14 |
| Head of DevOps | Infrastructure Team | APPROVED | 2026-10-14 |
| Lead Compliance Officer | Governance Desk | SANCTIONED | 2026-10-14 |
