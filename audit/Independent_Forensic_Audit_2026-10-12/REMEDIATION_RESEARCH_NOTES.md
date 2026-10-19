# Remediation research notes — external standards (verified 2026-10-12)

These are the authoritative facts the remediation plan is built on. Each was verified against a primary or near-primary source this session. Secondary sources are flagged.

## UAE e-invoicing / Peppol
- **Timeline (verified, multiple incl. Deloitte/BDO/Gulf News):** Ministerial Decision No. 244 of 2025, as amended ~10–11 May 2026, moves the **ASP appointment deadline for businesses with annual revenue > AED 50m from 31 Jul 2026 to 30 Oct 2026**. **Go-live 1 Jan 2027 is unchanged.** Below-threshold businesses: ASP by 31 Mar 2027, go-live 1 Jul 2027. Voluntary/pilot from 1 Jul 2026. → The project's "Peppol ready 2027" wording is directionally right; the 30 Oct 2026 ASP date should replace any 31 Jul 2026 reference.
  - https://www.deloitte.com/middle-east/en/services/tax/perspectives/uae-e-invoicing-asp-appointment-deadline-extended-but-go-live-remains-01012027.html
  - https://gulfnews.com/business/uae-announces-extension-of-einvoicing-provider-deadline-to-october-2026-1.500535895
- **CustomizationID (PINT AE, Peppol business rule `aligned-ibrp-001-ae`, FATAL):** the specification identifier (`cbc:CustomizationID`, ibt-024) **MUST start with `urn:peppol:pint:billing-1@ae-1`** (or `urn:peppol:pint:selfbilling-1@ae-1` for self-billing). → The code's `customisationID: 'urn:simal:invoice:phase1:ae'` (einvoice.service.js:129) is **non-conformant** and would be rejected by any PINT AE validator.
  - https://docs.peppol.eu/poac/ae/pint-ae/trn-invoice/rule/aligned-ibrp-001-ae/
- **ProfileID (`cbc:ProfileID`, ibt-023, rule IBR-076):** MUST be provided (business process). Peppol BIS convention is `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0`; confirm the exact AE value against the current PINT AE example set before coding. Current spec version: **PINT AE Billing 1.0.4**.
  - https://docs.peppol.eu/poac/ae/pint-ae/trn-invoice/
- **Participant/endpoint ID (EAS scheme 0235 = "UAE Tax Identification Number (TIN)", confirmed in the Peppol EAS code list):** the endpoint is **`0235:` + the 10-digit TIN** (the first 10 digits of the 15-digit TRN), **not the full 15-digit TRN**. Using the full TRN is a known routing/validation failure. (Secondary but consistent: Wafeq, ClearTax, Sovos; attributed to MoF.) → The code builds `'0235:' + inv.buyerTin` with a 15-digit TRN (einvoice.service.js:133,157) — **wrong length**. Live DB: all 7 invoices store a 15-digit endpoint.
  - https://docs.peppol.eu/poacc/billing/3.0/codelist/eas/  (0235 = UAE TIN)
  - https://www.wafeq.com/en-ae/tax-and-reporting/how-to-obtain-your-uae-peppol-participant-id
- **Phase scoping (from the project's own requirement docs, not external):** BRD/PRD scope Peppol *exchange* as Phase 2 behind a feature flag; capture+validate TRN/Peppol is the Phase-1 obligation. So the fix is to (a) make the stored data conformant now and (b) keep real ASP transmission behind the flag.

## Passwords / auth (NIST SP 800-63B-4, final, 2025)
- Minimum length: **15 characters** when the password is the **only** authenticator; **8** acceptable only when combined with a second factor (MFA). Verifiers MUST allow **≥64 chars**, accept spaces/Unicode, and check the whole password. No composition rules, no forced rotation. → Replace the current 8-char floor / `.env` 4-char `ADMIN_PASSWORD_MIN` with 15 (single-factor) or 8 (MFA-backed staff). scrypt (as used) is an acceptable memory-hard hash; keep it (ASVS allows scrypt/argon2/bcrypt).
  - https://www.sakimura.org/en/2025/10/7710/  (summary of final SP 800-63B-4)
- **OWASP ASVS 5.0.0** (May 2025) is the current standard; cite requirements as `v5.0.0-<ch>.<sec>.<req>`. ~350 requirements, 17 chapters.
  - https://owasp.org/www-project-application-security-verification-standard/

## CSRF (OWASP CSRF Prevention Cheat Sheet)
- SameSite is **defense-in-depth, not a complete CSRF defense in most deployments**. Add either the **synchronizer token** (stateful — fits the session store here) or a **signed double-submit cookie (HMAC-bound to the session)**.
- **Fetch Metadata** (`Sec-Fetch-Site`) and **Origin/Referer verification** are valid lightweight layers, but must have a fallback; missing headers / `Origin: null` are NOT proof of same-origin.
- APIs should **reject simple content types** (`text/plain`, form types) and/or require a **custom header** (forces a CORS preflight). → readJsonBody currently parses `text/plain` as JSON (bypasses the preflight protection) — tighten it.
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

## Cookies (MDN)
- `__Host-` prefix requires `Secure`, `Path=/`, **no `Domain`**, set from HTTPS → strongest binding for the session cookie in production.
- `SameSite=Strict` blocks the cookie on all cross-site requests incl. top-level navigations; `Lax` allows it on safe top-level navigations only.
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie

## File upload / AV (OWASP File Upload Cheat Sheet + ClamAV)
- Required controls: allowlist extensions, **validate file signature (magic bytes) AND don't trust Content-Type**, **rename to app-generated name**, size limit, **store outside webroot / on a different host**, **run antivirus/sandbox (or CDR)**, and **authorize both upload and download**. The code already does magic-byte + extension-match + rename + 10 MB limit + out-of-webroot storage; it is **missing the AV scan** and the **download authorization** (F-3/H1).
- **ClamAV `INSTREAM`** over `clamd` (socket): `z`-prefixed command, then chunks of `[4-byte big-endian length][data]`, terminated by a zero-length chunk; reply `stream: OK` or `stream: <Sig> FOUND`; bounded by `StreamMaxLength`. A tiny Node client (no dependency) can stream each upload to clamd before it counts as stored.
  - https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
  - https://docs.clamav.net/manual/Usage/ClamdProtocol.html

## Node child process hardening (Node docs)
- Use **`execFile`/`spawn` with an argument array (no shell)**, plus **`timeout`** (ms) + **`killSignal`** and/or an **`AbortSignal`** to bound the SSG build. The current `exec('npm.cmd run build', …)` uses a shell with no timeout (F-9 / server.js:140).
  - https://nodejs.org/api/child_process.html

## Authorization & logging (OWASP)
- **Deny by default; validate permissions on EVERY request** (incl. object-level/IDOR); don't rely on a framework default; add **unit/integration tests for authz**. → directly maps to F-3 (missing `requirePerm`) and the needed CI authz test.
  - https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Logs must record **when/where/who/what**, protect integrity, and **exclude session IDs, passwords, access tokens and sensitive PII** (store a hash if needed). → maps to F-8 (missing "who") and F-12 (raw reset token stored in the outbox body).
  - https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

## PostgreSQL (official docs)
- `scram-sha-256` is "the most secure of the currently provided methods"; migrate off `trust`/`md5`: set `password_encryption='scram-sha-256'`, re-set each role's password, change `pg_hba.conf` to `scram-sha-256`. → replaces the dev-rig `trust` auth and the superuser app role for production.
  - https://www.postgresql.org/docs/current/auth-password.html

## WCAG 2.2 / accessibility
- **SC 2.5.8 Target Size (Minimum) is Level AA** and requires **≥24×24 CSS px** (or sufficient spacing); the 44×44 figure is **2.5.5, Level AAA**. → the prior report conflated the two; the 35 sub-24px targets fail **AA**. Fix to ≥24px (or spacing).
  - https://www.disabilityworld.org/toolkit/standards/wcag/2-5-8-target-size-minimum/
- **`inert`** attribute (Baseline since Apr 2023) removes an element + descendants from focus, clicks and the accessibility tree — the correct primitive for closed modals (replace `opacity:0;pointer-events:none`). Native `<dialog>.showModal()` makes the rest of the page inert automatically.
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert
- **axe-core via `@axe-core/playwright`**: `new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` → `results.violations`. Runs in CI against the built pages.
  - https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md

## SEO (Google + Astro)
- **hreflang:** each version lists **itself and all others** (reciprocal; non-reciprocal tags are ignored), **fully-qualified URLs**, `x-default` for the fallback; language code may be bare (`ar`) or language-region (`ar-AE`) — region code alone is invalid. Three equivalent methods: HTML `<link>`, HTTP header, or sitemap `xhtml:link`.
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- **sitemap:** `<lastmod>` only trusted if verifiably accurate; Google **ignores** `<priority>`/`<changefreq>`; 50k URLs / 50 MB per file; absolute URLs. → the current `lastmod = build date for everything` is the anti-pattern.
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- **`@astrojs/sitemap`** (official) generates the sitemap + hreflang alternates from `site` + `i18n: {defaultLocale, locales}`; `serialize()` sets per-page lastmod. **Astro `i18n`** config: `defaultLocale`, `locales`, `routing.prefixDefaultLocale` (default false → only non-default locales get a prefix, which matches `/ar/`), `fallback`.
  - https://docs.astro.build/en/guides/integrations-guide/sitemap/
  - https://docs.astro.build/en/reference/configuration-reference/  (i18n, trailingSlash, build.format)
- **Product JSON-LD:** requires `name` + one of `offers`/`review`/`aggregateRating`; a no-price catalogue can ship `Product` without `offers` (or with an `Offer` + `availability` and no price) — aligns with the "no price in Phase 1" rule. Set `trailingSlash:'always'` + `build.format:'directory'` so canonical/sitemap/internal links all agree on the trailing-slash form (the current 301 churn in the crawl comes from mixed forms).
  - https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- **Custom 404:** `src/pages/404.astro` → builds to `404.html`; most hosts serve it automatically.
  - https://docs.astro.build/en/basics/astro-pages/
- **Consent Mode v2** (if GA4 is actually wired): `gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})` before any config, then `('consent','update',…)` on banner acceptance; persist the choice.
  - https://developers.google.com/tag-platform/security/guides/consent

## UAE PDPL (Federal Decree-Law 45/2021)
- Consent must be **clear, specific, and evidenced**, and must **state the right to withdraw**; controller bears the **burden of proof** of consent. Executive Regulations' exact status is still contested across secondary sources — treat the Jan 2027 full-compliance date as planning guidance, confirm against the UAE Data Office. → the cookie-consent banner + stored consent timestamp/notice-version + withdrawal path (already required by FRS G-05/K-16) satisfy this; they are currently missing on the public site.
  - (Secondary law-firm summaries; verify against https://u.ae / UAE Data Office before go-live.)
