# Analytics Measurement Plan

**Doc ID:** H3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** CM · KPIs from BRD v1.4 · Consent-gated (C1/C5)

## 1. Events (self-hosted or consented SaaS — INT-7)

| Event | Trigger | Dimensions |
|---|---|---|
| search | query submitted | query, results count |
| product_view | PDP open | slug, brand, cat |
| rfq_started | first item added | source (pdp/compare/category) |
| rfq_submitted | RFQ success | items count, ref prefix (no PII) |
| kyc_started / kyc_submitted / kyc_approved | portal lifecycle | role (vendor/customer) |
| partner_login | portal session | role |
| invoice_created / submitted / validated / delivered | e-invoice funnel | lines count, status |
| ubl_downloaded | UBL preview open | ref |
| article_read | insight page ≥ 50% | slug, cat, mins |
| cta_click | hero/solution CTAs | slide/cta label |
| newsletter_optin | double-opt-in confirm | — |

## 2. KPIs (monthly report → BRD)

RFQ conversion (visit→submitted) ≥ target per BRD · KYC approval cycle ≤ 2 business days · invoice validation ≤ 1 day · SUS intercept quarterly (target ≥ 80) · article-assisted RFQs (attribution window 7 days).

## 3. Privacy rules

No raw emails (hashed only) · IP truncated · consent banner gates non-essential analytics (Cookie Policy) · dashboards aggregated; row-level access CM only; retention per C3 (14 months raw).

## 4. Audit v2.0 additions

1. **Internal/bot traffic filtering:** staff + office IPs excluded at collection; bot filtering on; UAT traffic stays in staging property — production numbers are customer-truth.
2. **Consent-bias note (honest reporting):** pre-consent sessions are not measured → dashboards carry a standing caveat; conversion rates are computed over consented sessions only and labeled as such in the monthly report (C1/Cookie-Policy alignment).
3. **KPI owners:** each §2 KPI named to a role (RFQ conversion → CM; KYC/invoice cycle → PM; SUS → QA) — reported in the F2 monthly pack (day 5).
4. **Tracking-outage detection:** INT-7 hourly heartbeat; missing 2 h → SEV-4 alert (data-quality, not customer-facing) — prevents silent measurement loss during hypercare.
5. **Event schema versioning:** events carry `v:1`; breaking telemetry changes bump version + annotate dashboards (avoids false KPI cliffs).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — events map 1:1 to shipped flows |
| 2026-10-05 | **v2.0 audit:** +internal/bot filters, +consent-bias labeling, +KPI owners tied to F2 report, +heartbeat outage alert, +event schema versioning |
