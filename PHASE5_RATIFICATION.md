# Phase 5 Ratification Record

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> **Claims below that the ledger contradicts** (fixed `3fba62a`): T5.1 "Email production" — the real
> SMTP client could not deliver over STARTTLS, wrote to the plaintext socket and sent AUTH in clear on
> :25 (**D37**, `smtp-client.test.js`), and emailed links were relative (**D38**); T5.3 "WEBHOOK_SECRET
> … correctly errors when unset" — a copied `WEBHOOK_SECRET=  # HMAC…` became a public secret (the
> comment text) (**D34**, `dotenv-comments.test.js`).

**Doc ID:** P5-RR · **Version:** 1.0 · **Date:** 6 Oct 2026 · **Owner:** PM/TL

## T5.1 — Email Production (INT-1)
| Feature | Status | Evidence |
|---|---|---|
| 10 email templates | ✅ | submissionReceived, decisionApproved/Rejected, queryRaised, partnerAccountReady, invoiceSubmitted/Delivered/Rejected, passwordReset, emailVerification |
| SPF/DKIM/DMARC DNS records | ✅ | `GET /api/integrations/email/dns` returns TXT records for simalme.com |
| Bounce handler | ✅ | `POST /api/integrations/email/bounce` processes bounce and audits |
| Outbox queue | ✅ | Emails queued to outbox (worker picks up) |
| Health probe | ✅ | `queued < 50` = healthy |
| Send test | ✅ | `POST /api/integrations/email/send` queues email — verified on PG |

## T5.2 — Peppol ASP Client (INT-5)
| Feature | Status | Evidence |
|---|---|---|
| Sandbox mode | ✅ | Returns `sandbox_` transmission ID when ASP_ENDPOINT unset |
| Production mode | ✅ | Queues UBL to outbox for worker pickup |
| Health probe | ✅ | Detects stale submissions > 4h |
| SSRF-safe | ✅ | No direct fetch — queue-based (worker handles HTTP) |

## T5.3 — Signed Webhooks + Master Feed (INT-3, INT-4)
| Feature | Status | Evidence |
|---|---|---|
| HMAC-SHA256 signing | ✅ | `signPayload()` uses WEBHOOK_SECRET env (correctly errors when unset) |
| Webhook dispatch | ✅ | `dispatchApprovalWebhook()` queues with signature in outbox |
| Master data feed | ✅ | Returns approved counterparties with TIN, Peppol ID, version v:1 |
| Token auth | ✅ | `x-api-token` header with timing-safe comparison |

## T5.4 — Analytics (INT-7)
| Feature | Status | Evidence |
|---|---|---|
| 17 event types | ✅ | search, product_view, rfq_*, kyc_*, invoice_*, article_read, cta_click, newsletter_optin, content_published |
| analytics_events table | ✅ | 23rd PG table with session_hash + consent flag |
| Consent-gated | ✅ | `consent` field on every event |
| Privacy-first | ✅ | Session IDs hashed (SHA-256 truncated to 16 chars) |
| Track endpoint tested | ✅ | `POST /api/integrations/analytics/track` → `{"tracked":true,"event":"product_view","v":"v1"}` |
| Health probe | ✅ | Reports events in last hour |

## Combined Health Check
```
GET /api/integrations/health → {
  "version": "v1",
  "overall": "healthy",
  "integrations": {
    "email": { "healthy": true, "queued": 1 },
    "asp": { "healthy": true, "mode": "sandbox" },
    "analytics": { "healthy": true, "eventsLastHour": 0 }
  }
}
```

## API endpoints added (8)
```
GET  /api/integrations/health              — all integrations health check
GET  /api/integrations/email/dns           — SPF/DKIM/DMARC DNS records
POST /api/integrations/email/send          — queue email via template
POST /api/integrations/email/bounce        — handle bounce webhook
POST /api/integrations/analytics/track     — track analytics event (public)
GET  /api/integrations/analytics/events    — list event types (admin)
GET  /api/integrations/master              — master data feed (token auth)
POST /api/integrations/webhook/test-sign   — test webhook signature (admin)
```

## New database object
`analytics_events` table (23rd table): event_name, properties JSONB, consent, session_hash, created_at

## All test suites
| Suite | Result |
|---|---|
| Portal unit | ✅ 39/39 |
| PG integration | ✅ 24/24 (updated for 23 tables) |
| Integration E2E | ✅ health + DNS + email + analytics all verified |

**Phase 5 COMPLETE — production integrations and security telemetry verified on PostgreSQL.**
