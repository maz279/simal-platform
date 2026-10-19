# Environments & Configuration Matrix

**Doc ID:** E3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS · Source of truth: `portal/.env.example` + ADRs

| Variable | Dev | Staging | Production | Notes |
|---|---|---|---|---|
| PORT / HOST | 8090/127.0.0.1 (current dev) | 3000/0.0.0.0 | 8080 (behind proxy) | dev value matches running portal |
| DATABASE_URL | local pg | staging pg | prod pg (secret store) | B4 |
| SESSION_IDLE_MINUTES | 20 | 20 | 20 | shipped default |
| SESSION_ABSOLUTE_HOURS | 12 | 12 | 12 | |
| ADMIN_* bootstrap | local demo only | synthetic | real + MFA on, rotate after boot | never committed |
| REVIEWER_* / VIEWER_* | demo | synthetic | real via admin UI | |
| MASTER_API_TOKEN | dev token | staging token | prod token (rotate quarterly) | INT-4 |
| SMTP_* / EMAIL_FROM | outbox fallback | test provider | prod provider + SPF/DKIM/DMARC | INT-1 |
| ASP_* | sandbox | sandbox | accredited ASP prod creds | INT-5/C2 |
| CDN_BASE | — | staging CDN | prod CDN | asset URLs |
| ANALYTICS_* | off | consent-test | consent-gated | H3 |
| LOG_LEVEL | debug | info | info | request-id always on |

## DNS/TLS plan

apex + www (site SSG) · `portal.simalme.com` (both portals) · legacy `kyc.simalme.com` → 301 per E7. TLS at CDN, modern ciphers, HSTS after E7 completes.

## Feature flags

`EINVOICE_INBOUND` (off Phase 1) · `ANALYTICS_CONSENT_BANNER` · `MAINTENANCE_MODE` (503 page). Flags live in settings table, change audited.

## Audit v2.0 additions

- **Dev port map (discrepancy fix — real ports were undocumented here):** 8000 = prototype static server (serve_prototype.py), 8090 = portal dev (current .env), 8080 = legacy mirror server; CI ephemeral ports random; only 443/80 exposed in prod.
- **Access control per env:** dev = engineers; staging = team + UAT personas (time-boxed credentials); production = pipeline + break-glass (2-person rule, audited) — no standing human access.
- **DNS TTL plan:** normal 24 h; **lowered to 300 s at T-1 day before cutover** (E6), restored after 72 h stable.
- **Rotation ties:** MASTER_API_TOKEN + ASP creds quarterly (B6 §4); session pepper (if added) same schedule; rotation runbook in F1.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — matrix aligned to shipped .env keys |
| 2026-10-05 | **v2.0 audit:** +dev port map (8000/8090/8080 documented), +env access control (break-glass 2-person), +DNS TTL plan, +rotation ties |
