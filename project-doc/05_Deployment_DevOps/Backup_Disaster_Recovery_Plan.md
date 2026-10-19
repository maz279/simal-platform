# Backup & Disaster Recovery Plan

**Doc ID:** E4 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS · RPO/RTO proposed for sign-off

## Objectives

| Metric | Target | Basis |
|---|---|---|
| RPO (data loss window) | ≤ 24 h (DB snapshots) + ≤ 5 min (WAL streaming) | tax-record class data |
| RTO (service restore) | ≤ 4 h site · ≤ 8 h full portal | BRD tolerance |
| Documents (object storage) | versioned bucket, cross-region copy | KYC originals |

## Schedule

- PostgreSQL: continuous WAL + nightly full snapshot; 35-day rolling + 12 monthly (aligned to C3).
- Object storage: bucket versioning on; daily incremental sync to second region.
- Config/secrets: secret-store snapshot per change; .env templates in repo (values never).
- Restores honor C3 retention (no resurrecting deleted personal data beyond schedule).

## Restore drills (gate: one passed drill before GoLive; quarterly after)

1. Nightly snapshot → new instance → run D3 edge-ledger suite → record time (target < RTO/2).
2. Object-storage restore spot-check: 3 random KYC documents verifiable (magic bytes intact).
3. Full DR day (bi-annual): region loss scenario → DNS switch rehearsal (TTL 300 pre-lowered).

## Responsibilities

OPS runs drills + reports to G2 register; PM informed of any miss; findings feed F1 runbook.

## Audit v2.0 additions

1. **Backup immutability (ransomware posture — was missing):** monthly + weekly snapshots written with **object-lock/WORM** (delete-protected for their retention window); backup credentials separated from app credentials (no single principal can delete both data and backups).
2. **Encryption:** backups encrypted at rest (KMS-managed keys); restore drills verify key access path too.
3. **Content is data:** nightly CMS/content-block + hero_slides + legal_policies export joins the DB backup set (SSG rebuilds from it); SSG artifacts additionally retained ×3 (E1 §6.3).
4. **Isolated restore account:** quarterly drill restores into a separate sandbox account, never over production.
5. **Success evidence:** drill report (duration, row counts, spot-check docs) filed against this doc's status log — not just a green flag.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — targets proposed for P2 sign-off |
| 2026-10-05 | **v2.0 audit:** +WORM immutability + separated credentials, +backup encryption, +CMS content in backup set, +isolated-account drills, +evidence rule |
