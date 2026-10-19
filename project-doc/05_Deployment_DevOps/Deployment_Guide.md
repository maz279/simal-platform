# Deployment Guide

**Doc ID:** E1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS · Stack per B1/ADR-9

## 1. Prerequisites

- UAE-region VM/container host + managed PostgreSQL 16 + object storage bucket (private) + CDN.
- DNS zone control (apex + `www` + `kyc.`/`portal.` subdomains) + TLS certs (CDN-managed).
- Secrets prepared in the platform secret store (names only — values never in repo): `DATABASE_URL, SMTP_*, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MFA_REQUIRED, ADMIN_TOTP_SECRET, REVIEWER_*, VIEWER_*, MASTER_API_TOKEN, ASP_*, SESSION_*` (mirror of `portal/.env.example`).

## 2. First deployment (fresh machine — acceptance: reproduces working system)

1. Provision host + DB; create schema from B4 DDL via migration tool (`migrate up`).
2. Seed: settings (Simal TIN/Peppol), catalog/content from B2 §4 seeds, demo KYC set **only in non-prod**.
3. Deploy app release artifact (CI output, E2); set secrets; boot with `PORT/HOST` per E3.
4. Smoke: `/api/health` ok · login as bootstrap admin (env creds) · create real staff accounts · rotate bootstrap password immediately.
5. Configure CDN for static/SSG paths (immutable, versioned assets) + no-store for portal HTML (policy carried from dev server).
6. Wire INT-1 email (SPF/DKIM/DMARC) and INT-5 ASP production credentials.

## 3. Routine release

`git tag vX.Y.Z` → CI (E2) runs tests → artifact → staging auto-deploy → manual gate → production deploy with **rolling restart** (stateless app; sessions in DB survive).

## 4. Rollback

Deploy previous artifact tag; DB migrations must be backwards-compatible one step (expand/contract pattern); document any breaking migration in the release notes. Rollback rehearsal required once before GoLive (E6 entry).

## 6. Audit v2.0 additions

1. **IaC policy (was implicit):** all infrastructure defined as code (Terraform/Pulumi-class per [2026 cloud DevOps practice](https://ortemtech.com), [IaC guide](https://techdiges.free.nf)) — versioned, reviewed, applied via pipeline; **no console-only changes** (drift detection weekly; [immutability rationale](https://www.xenonstack.com)).
2. **LB health checks:** `/api/health` (200, 5 s interval, 3-fail eject); readiness distinguishes deploy-draining.
3. **SSG artifacts versioned like app releases** — previous build retained ×3 for one-click content rollback; CMS publish purge events logged.
4. **Post-deploy verification checklist (beyond smoke):** headers per route (CSP job), one SSG page render-diff vs baseline, one portal login, one invoice validate (staging), E5 canary ack.

## 7. Acceptance test for this guide

A second engineer, given only this file + secrets access, brings a fresh host to green smoke in < 2 hours.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — draft; validated at P3 |
| 2026-10-05 | **v2.0 audit:** +IaC policy (no console changes), +LB health checks, +SSG artifact versioning/rollback, +post-deploy verification checklist |
