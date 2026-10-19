# Integration Specification

**Doc ID:** B7 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** TL
Seven integration seams. The portal already implements #1–#4 (as built); #5–#7 activate in production.

## INT-1 Email (SMTP/provider) — shipped
- **Seam:** `notify.service` → `send({channel,to,subject,text,meta})`; durable outbox fallback (admin-visible), mark-sent on delivery.
- **Templates live:** submission received, decision, query raised, partner-account temp password, invoice submitted/delivered/rejected.
- **Production adds:** bounce handling (webhook → mark + suppress), SPF/DKIM/DMARC on sending domain, double opt-in for newsletter.
- **Failure mode:** provider down → entries stay `queued` in outbox; retry loop every 15 min; no data loss.

## INT-2 WhatsApp handoff — shipped (RFQ side)
- Prototype builds wa.me links at click-time (never baked). Production: same rule; phone number from settings; no API dependency Phase 1.

## INT-3 Signed approval webhook — shipped
- KYC approval → signed POST to configured endpoint; **SSRF-guarded** target validation (unit-tested: loopback/private/reserved refused); retry with backoff; payload = submission summary + partner account flag.

## INT-4 ERP master feed — shipped
- `GET /api/integration/master` with `x-api-token` (timing-safe compare); approved counterparties: reference, role, legal name, TIN, Peppol ID, IBAN (masked by default), screening flag, approved_at. Consumers: UniERP import jobs.

## INT-5 Peppol ASP (production — C2 critical path)
- **Direction out (dominant):** on `deliver`, we hand the stamped UBL 2.1 envelope to the accredited ASP; ASP returns transmission-id; we store it on the invoice (`ubl.transmissionId`) and timeline the event.
- **Direction in:** incoming invoices to Simal's own `0235:<simalTin>` endpoint via ASP inbox → `received_invoices` table → staff console view (Phase-1.1).
- **Auth:** ASP credentials from env; mutually authenticated channel per ASP spec.
- **Failure:** ASP unreachable → invoice stays `validated`; delivery retried (queue), alert after 4h; manual fallback per C2.

## INT-6 KYC portal migration (E7 dependency)
- Token-mapped resume links: legacy kyc.simalme.com magic-links → 301 to new `/portal/status` with one-time token exchange (PRD §9). Parallel-run window 2 weeks.

## INT-7 Analytics — production
- Self-hosted or consent-gated SaaS (ADR pending G5); events defined in H3 (RFQ started/submitted, KYC submitted/approved, invoice submitted/delivered, article read). No PII beyond hashed email.

## Cross-cutting rules
Every integration: env-configured endpoint, timeout ≤ 30s, retry/backoff documented, failure alertable, audit-logged, and a **test/dry-run mode** usable in staging.

## Integration health checks (audit v2.0)

| INT | Health probe | Failure alert |
|---|---|---|
| 1 Email | outbox depth/age metric | > 50 or > 1 h → SEV-3 (E5) |
| 2 WhatsApp | static config (link build test) | n/a |
| 3 Webhook | signed ping endpoint config test | delivery fail ×3 → SEV-3 |
| 4 Master feed | token round-trip daily 06:00 | non-200 → SEV-3 |
| 5 ASP | sandbox round-trip hourly; prod transmission-id lag | > 4 h → SEV-2 (R1) |
| 6 Migration | token-exchange success rate during parallel-run | < 99% → hold cutover (E7) |
| 7 Analytics | event heartbeat (synthetic hourly) | missing 2 h → SEV-4 |

Additional templates (INT-1): password-reset, email-verification, email-change re-verify (A6 §5) — same outbox durability.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — seams frozen; INT-5 owned by C2 onboarding |
| 2026-10-05 | **v2.0 audit:** +per-integration health probes/alert levels, +reset/verification email templates, webhook payload version field `v:1` added to INT-3/INT-5 contracts |
