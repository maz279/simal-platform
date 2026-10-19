# Simal Portal — KYC + e-Invoicing (frontend + backend)

Extended from the proven `simal_kyc/KYC_System` (zero-dependency Node 22+, scrypt+TOTP auth,
RBAC, atomic JSON store, strict CSP). This build adds the **e-invoicing module** and the
**two-portal model** on top of the unchanged KYC engine.

## Run

```
cd portal
node src/server.js        # → http://127.0.0.1:8090  (port via .env)
```

**Dev-service supervision note (audit finding):** the dev server has no auto-restart; if it dies or a zombie holds :8090 (symptom: port LISTENs but `/api/health` is empty), kill it and restart: `netstat -ano | grep :8090` → `taskkill //PID <pid> //F` → `node src/server.js`. Production uses supervised deployment per E1/E2 (IaC + pipeline), where this class of failure self-heals.

Credentials live in `.env` (env-only — never in source). Demo staff: `admin@smartme.com` /
value of `ADMIN_PASSWORD`. Partners are **auto-provisioned when their KYC is approved** —
a temporary password is emailed (visible in the admin outbox).

## Portals

| Who | Page | What |
|---|---|---|
| Customer / vendor | `login.html` → `invoices.html` | KYC status (`status.html`), e-invoice list, create with live fils-safe totals, submit, UBL preview |
| Simal staff | `login.html` → `admin.html` (KYC) + `invoices-admin.html` (e-invoices) | KYC review queue; e-invoice validation console (7 checks), deliver via Peppol, reject/reopen |

## What was added to the base system

- **Schema v3**: `invoices` collection + `nextInvSeq` (migrated automatically from v1/v2).
- `src/services/einvoice.service.js` — integer-**fils** money math (VAT 5% per line,
  half-up rounding, zero floats), invoice lifecycle `draft→submitted→validated→delivered|rejected→reopen`,
  7-check validation (incl. **buyer TRN must match an approved KYC submission**),
  UBL 2.1 export with Peppol `0235:` endpoints, partner scope isolation.
- **Partner accounts**: approving a KYC submission auto-provisions a `partner` login
  (RBAC matrix untouched — partner gets zero admin permissions).
- Routes: `/api/einvoice/*` (partner) + `/api/einvoice/admin/*` (staff, `decide` perm).
- Frontend: `login.html`/`invoices.html`/`invoices-admin.html` + JS (CSP-safe external scripts).

## Tests

```
node --test test/unit/*.test.js        # 39/39 (schema test updated for v3)
node test/e2e-einvoice.mjs             # 16 checks: approve→provision→login→create→validate→deliver→UBL (+negative paths)
node test/audit-iterations-1-3.mjs     # auth/RBAC + money-math + workflow audit
```

QA iterations (5/5 completed): RBAC isolation ✓ · fils math & field validation ✓ ·
lifecycle transitions & reason guards ✓ · UI contracts & CSP-safe pages ✓ ·
headers/traversal/rate-limit/body-cap ✓ (strict CSP also blocks injected inline scripts).
