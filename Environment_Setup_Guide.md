# Environment Setup — Simal Production Build (Codebase)

**Version:** 1.0 · **Date:** 5 Oct 2026 · **Source:** `implementation/Implementation_Roadmap.md` (T0.2/T0.3) + ADRs 1–13 (path updated at unification 2026-10-19)
Everything needed to start P0 → P3 development on this machine. Tools live in `Codebase/tools/`; workspace scripts in `Codebase/scripts/`.

## 1. Toolchain matrix (status after setup, 5 Oct 2026)

| Tool | Version | Why (roadmap/ADR) | Status |
|---|---|---|---|
| Node.js | v24.21.0 (≥22 LTS, ADR-1) | runtime for site + portal | ✅ `tools/node/` (portable zip; on user PATH) |
| npm | 11.19.0 | packages (pg driver, SSG) | ✅ preinstalled |
| Git | 2.56.0 | monorepo T0.2 | ✅ preinstalled |
| **PostgreSQL 16.9 (portable)** | 16.9 | DB per ADR-3, B4 DDL | ✅ `tools/pgsql/` |
| **pg_trgm** | ships in 16 contrib | typo-tolerant search ADR-11 | ✅ `tools/pgsql/lib/` |
| **Terraform** | 1.13.4 | IaC per E1 v2.0 | ✅ `tools/terraform.exe` |
| **k6** | v1.5.0 | load tests D4 | ✅ `tools/k6-v1.5.0-windows-amd64/k6.exe` |
| **gitleaks** | 8.28.0 | secrets scan CI L1.5, D5 | ✅ `tools/gitleaks.exe` |
| **SeaweedFS S3** | 4.48 | local S3 object storage | ⚠️ see note — **MinIO archived; SeaweedFS full-server crashes on Windows in sandbox**; use filesystem for dev, cloud bucket for prod |
| OWASP ZAP | latest | DAST D5 | ⏳ Java ≥17 required → see §4 |
| Lighthouse CI / axe-core | via npm | CWV + a11y (D4/C4) | ⏳ `npm i -g @lhci/cli axe-core` on first use |

## 2. One-time environment init (run `scripts/setup.cmd` as Administrator not required — all portable)

```
scripts\setup.cmd      → initializes PG data dir, creates db 'simal', enables pg_trgm
scripts\verify.cmd     → health-checks every component (exits 1 on any failure)
scripts\supervisor.cmd → checks all 3 services (PG 5433, portal 8090, prototype 8000) and restarts any that are down
scripts\stop.cmd       → stops PG
```

**Recurring-downtime fix:** run `scripts\supervisor.cmd` whenever anything seems unresponsive — it detects and restarts all services in one shot.

## 3. Object storage note

The portal stores KYC documents as **filesystem paths** (`uploads/` directory) — no S3 required for development or even initial production. For production hardening (E1), provision a cloud bucket (AWS S3, Azure Blob, or UAE-region equivalent) and swap the `documents.store()` path in `portal/src/store/repos.js` to use the S3 SDK. Both MinIO (community archived, [410 Gone]) and SeaweedFS (full-server crashes on Windows sandbox) proved unreliable as local S3 emulators — documented here so nobody wastes time on them again.

## 4. PostgreSQL (portable) essentials

- Data: `Codebase/tools/pgdata` (created by setup; add to `.gitignore`)
- Start: `pg_ctl -D ..\tools\pgdata start` (from `tools/pgsql/bin`, or use scripts)
- Connect: `psql -h 127.0.0.1 -p 5433 -U simal -d simal` (port 5433 avoids colliding with any system PG; password env `PGPASSWORD` / `SIMAL_PG_PW`)
- First schema: apply `Project_doc/02_Architecture/Database_Design_Schema.md` DDL, then `CREATE EXTENSION pg_trgm;`

## 5. Remaining optional installs (only when the matching tasks start)

- **ZAP (DAST, T6.6):** needs Java 17+ → `winget install EclipseAdoptium.Temurin.17.JDK` then `winget install Zaproxy.ZAP`
- **Lighthouse CI:** `npm i -g @lhci/cli` (T6.5)
- **SSG framework (T3.x):** decided at P0 per ADR-2 — install into the site package then, not globally

## 6. Security constraints honored

No credential literals anywhere: PG password and S3 keys come from environment variables (`SIMAL_PG_PW`, `WEED_S3_ACCESS_KEY`, `WEED_S3_SECRET_KEY`) read by the scripts; `.env` pattern carries into the app per B6.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — toolchain downloaded/verified; MinIO→SeaweedFS substitution documented |
| 2026-10-05 | v1.1 (audit) — +supervisor.cmd for all-3-service health/restart; setup.cmd initdb logic fixed (was: phantom pwfile); leftover LICENSE/README removed from tools/ |
| 2026-10-15 | v1.2 — machine move (F:→C:, Dell OptiPlex 5090, Win11 Pro 26300): supervisor.cmd ROOT now `%~dp0`-relative and PORTAL corrected to `Codebase\apps\portal`; portable Node v24.21.0 installed at `tools\node` + user PATH; UCRT stubs (System32\downlevel) + ucrtbase + x64 vcruntime140 copied into `tools\pgsql\bin` (this Windows build ships none); stale `pgdata\postmaster.pid` removed after move; see LEARNINGS L46. Docker Desktop: VirtualMachinePlatform + WSL enabled, WSL 3.0.3 installed — engine available after next reboot (dev stack does NOT need Docker; portable PG is authoritative) |
