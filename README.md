# Simal Platform — unified repository

Private, single source of truth for the Simal corporate website / KYC + e-invoicing
platform build: application code, the independent forensic-audit corpus, governance
and requirements docs, the approved UX design, content packs, the working prototype,
and the workspace skills that drove remediation — all in one place.

Formed 2026-10-19 by unifying the former workspace siblings (`../Audit`, `../Project_doc`,
`../Primary_doc`, `../Implemenation`, `../Prototype`, `../UX_FrontEND`, `../content`,
`../artifacts_cms_audit`, `../backups`, `../.agents`, loose root scripts) into this repo.
The 90-commit implementation history (milestones P0–P8, remediation rm(1)–rm(10.4),
independent re-audit) is preserved — audit evidence cites these commit hashes.

## Layout

| Path | What it is |
|---|---|
| `apps/portal/` | KYC + e-invoicing portal (Node, PostgreSQL) — staff & partner consoles |
| `apps/site/` | Public corporate site (Astro SSG, content from PG) |
| `scripts/` | CI gates (`scripts/ci/`), ops scripts, bring-up (`bringup.mjs`, `supervisor.cmd`) |
| `infra/` | CI platform, nginx rehearsal, docker definitions |
| `docs/` | Engineering docs, branch protection, ADRs |
| `audit/` | Independent forensic audit 2026-10-12: report, findings matrix, evidence corpus (immutable record) |
| `project-doc/` | Production-build governance docs (v2.0 audited, 39 docs) |
| `primary-doc/` | BRD / FRS / PRD / SRS / URD |
| `implementation/` | Implementation roadmap (9 phases, 49 tasks) |
| `ux/` | Approved V2 "Navy & Gold Executive" UX design (spec v2.2) |
| `content/` | Content packs (20 sections, 261 files) |
| `prototype/` | 100% client-side working prototype v1.8.1 |
| `artifacts-cms-audit/` | CMS audit artifacts |
| `fixture-backups/` | Historical test-fixture backups (`scripts/cleanup-test-fixtures.mjs` writes here) |
| `legacy/` | Pre-unification workspace scripts, kept for the record — see `legacy/README.md` |
| `.agents/` | Workspace skills (enterprise auditor / engineer personas) used during remediation |
| `tools/` | Vendored portable toolchain (pg, node, nginx, clamav, k6, gitleaks) — gitignored |

Deliberately **not** in this repo (stay on the dev workstation, never pushed):
`Mirror_site/` (mirrored third-party WordPress/CDN assets, copyright), `remotes/`
(bare repos incl. a >100 MB pack), `.mimosa/` (agent tool state), stale root
`migrations|packages|scripts|tools` duplicates, screenshot/zip/temp clutter —
full list with reasons in `legacy/README.md`.

## Bring-up (dev rig, Windows)

```
scripts\supervisor.cmd        # PG 5433 · portal 8090 · prototype 8000
node scripts/bringup.mjs      # + public site & API proxy on 8100, observability sink 8095
```

- Portal      → http://127.0.0.1:8090  (`.env` required — see `apps/portal/.env.example`; DB roles: `scripts/prod-db-roles.sql`)
- Public site → http://127.0.0.1:8100
- Prototype   → http://127.0.0.1:8000  (served by `legacy/serve_prototype.py`)

## CI & remotes

Authoritative CI is the Gitea platform runner (21 gate jobs, `.github/workflows/ci.yml`
mirrored to GitHub but Actions disabled there — see `docs/BRANCH_PROTECTION.md`).
Remotes: `origin` (local bare), `platform` (Gitea), `github` (private mirror).

Secrets policy: live credentials exist only in gitignored `.env` files; history carries
only dead, rotated literals (verified + re-rotated 2026-10-19 — `ARCHITECTURE_STATE.md`);
`tools/gitleaks.exe` + `.gitleaks.toml` gate every push (`secrets-scan` job).
