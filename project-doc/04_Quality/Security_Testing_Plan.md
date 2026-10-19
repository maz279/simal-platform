# Security Testing Plan

**Doc ID:** D5 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** SEC+QA · Base: B6 architecture, OWASP ASVS L2 scope

## 1. Already verified (audit iterations — re-run in CI)

CSP/nosniff/DENY on all responses · inline-script block · login lockout 429@11 · JSON cap abort · traversal 404 · SSRF guard (unit) · scrypt/TOTP flows · partner isolation 403 · masked PII defaults · timing-safe comparisons.

## 2. P4 test scope

| Area | Tests | Tool/approach |
|---|---|---|
| AuthN/Z | credential stuffing (lockout holds), session fixation/expiry, TOTP replay single-use, RBAC matrix per role×endpoint | automated + manual |
| Input | full 422 field coverage (D3 ledger), injection payloads (SQL/NoSQL/log), upload EICAR + mismatched magic bytes | automated |
| Business logic | invoice tamper (client totals), transition bypass attempts, duplicate refs, TRN spoof (non-approved) | automated (extend audit script) |
| Transport | TLS config, HSTS, cookie flags | scanner |
| Dependencies | lockfile audit + SBOM (ADR rule: zero-dep core) | CI |
| Headers/CSP | regression on every route incl. SSG | CI |
| Pen test | external, black+grey box on staging, ASVS L2 checklist | vendor (G5 adjunct) |

## 3. Findings policy

Critical/high: fix before GoLive (blocks E6). Medium: fix ≤ 30 days, risk-accepted by SEC otherwise. Low: backlog. All findings → G2 register if systemic.

## 4. Reporting

Report template: exec summary, methodology, findings (CVSS + reproduction), remediation status; attached to D3 matrix IDs.

## 5. Audit v2.0 additions

1. **Secrets scanning in CI (was missing — policy-critical):** pre-merge scanner (e.g., gitleaks-class) on every PR; zero tolerance for credential literals ([DevSecOps practice](https://apiiro.com), [CI hardening](https://www.crowdstrike.com)); historical repo scan once at P3 start.
2. **DAST named:** OWASP ZAP baseline scan nightly on staging + full scan weekly ([DAST in CI practice](https://www.getastra.com), [tool comparison](https://brightsec.com)); alerts tuned to avoid CI fatigue; new-route coverage auto-registered from the OpenAPI artifact.
3. **ASVS L2 chapter mapping:** V2 authn (reset/verification flows per B6 v2), V4 access control (partner isolation), V5 validation (D3 edge ledger), V8 errors/logging, V9 data protection (PII masking), V11 HTTP (headers regression suite per route).
4. **Pen-test ROE:** staging only, no production, no real personal data; findings handled per §3 with evidence redaction before storage.
5. **CSP regression suite:** per-route header assertion (incl. SSG + AR pages) as a named CI job — extends the shipped header checks to every new route automatically.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — scope aligned to shipped controls |
| 2026-10-05 | **v2.0 audit:** +secrets scanning pre-merge, +ZAP DAST cadence, +ASVS chapter mapping, +pen-test ROE, +per-route CSP job |
