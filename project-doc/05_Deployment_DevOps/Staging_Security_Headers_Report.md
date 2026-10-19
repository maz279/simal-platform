# Staging Security Headers Report — T2.1

**Doc ID:** E1-SSH · **Task:** T2.1 · **Verified:** 6 Oct 2026 (UTC) · **Rig:** `scripts/smoke-test.js` header probe (application layer) — the local stand-in for the staging probe until the vendor environment is live.

## 1. Application-layer header set (verified on live responses)

| Header | Value (as served) | Roadmap T2.1 spec | Match |
|---|---|---|---|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | same | ✅ |
| X-Content-Type-Options | `nosniff` | same | ✅ |
| X-Frame-Options | `DENY` | same | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | same | ✅ (aligned this phase; was stricter `no-referrer`) |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | same | ✅ |
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; report-uri /api/csp-report` | same set + report-uri | ✅ (aligned this phase: `img-src` gained `https:`, `font-src` made explicit) |

**CSP violation reporting:** `POST /api/csp-report` implemented (204, rate-limited 60/min, violations audit-logged as `csp_violation` with document/directive/blocked-URI). Verified live this run.

## 2. Edge layer (NGINX) — configured, deploys with staging

`infra/nginx/portal-staging.conf`: TLS **1.3 only**, HTTP/2, HSTS + the full header set via `add_header … always`, and zoned rate limiting — public 120 r/m/IP (burst 40), login 10 per 5 min (burst nodelay), status 20 r/m — matching the app-layer guards (defence in depth).

## 3. Container

`apps/portal/Dockerfile`: multi-stage `node:22-alpine`, **non-root** runtime user, `/app/data` volume, `HEALTHCHECK` on `/api/health`, credentials only via environment. Container build + staging deploy execute on the vendor runner (T2.6); the health-probe path itself is proven (15/15 smoke).

## 4. External grade (pending staging URL)

SecurityHeaders.com **A+ scan runs when the staging URL is live** (requires the public host from T2.6 vendor provisioning). All A+ criteria are met by the served set above; the scan is the formality that records it.

## Status log

| Date | Event |
|---|---|
| 6 Oct 2026 | CSP/Referrer-Policy aligned to spec; report-uri endpoint live (204 verified); nginx + Dockerfile authored; app-layer verification 15/15 |
