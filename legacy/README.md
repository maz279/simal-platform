# legacy/ — pre-unification workspace scripts (frozen, kept for the record)

These files lived loose at the workspace root (`Simal_Corporate_website/`) before the
2026-10-19 unification moved every project folder into this repository. They are kept
verbatim so old run-books, session logs and audit trails remain resolvable — only
`serve_prototype.py` was functionally updated (it now serves `../prototype/` at `/`;
the supervisor's prototype health check moved to `http://127.0.0.1:8000/index.html`).

| File | What it was |
|---|---|
| `serve_prototype.py` | Prototype preview server on :8000 — **still live**, now serves `../prototype/` |
| `server.py` | Early static server for the workspace root (superseded by the portal + edge) |
| `mirror_site.py` | Wget-style mirror builder that produced `Mirror_site/` (excluded from repo) |
| `audit_mirror.py` | Post-processing / audit of the mirror output |
| `docker-compose.dev.yml` | Early Docker Compose sketch — unused: the rig runs portable native toolchain (`tools/`), no Docker |
| `deploy-kyc-patch.sh` / `.ps1` | One-shot KYC login-patch deployers (Oct 9 patch window) |
| `setup_wsl.ps1` / `enable_docker_features.bat` | Early WSL2/Docker bring-up experiments — abandoned path |
| `trk63.mjs` | One-off tracker scrape for task trk-63 |
| `github-workflows-ci-pipeline.yml` | Stale root `.github/workflows/ci-pipeline.yml` from before the repo workflow (`.github/workflows/ci.yml` in-repo is authoritative). Renamed so GitHub can never pick it up as a live workflow. |

## Deliberately excluded from the repository

Stay on the dev workstation, outside the repo, **never pushed**:

- `Mirror_site/` — mirrored third-party WordPress site + CDN assets (copyright; not ours to publish)
- `remotes/` — local bare repos; contains a single ~300 MB pack exceeding GitHub's 100 MB limit
- `.mimosa/` — agent tool state (session histories, finding ledgers)
- `migrations/`, `packages/`, `scripts/`, `tools/` at the workspace root — stale duplicates of in-repo paths;
  root `migrations/prod-db-roles.sql` additionally predates credential redaction (the tracked,
  remediated source of truth is `scripts/prod-db-roles.sql` in-repo)
- `test_snap*.png`, `temp_kyc_*.html`, `simal-kyc-login-patch.zip`, `prototype-server.log`,
  `__pycache__/` — session clutter / one-shot artifacts
- `downloads/` — tool installers fetched during unification (gh CLI MSI + zip). The extracted
  portable gh (`downloads/gh-cli/bin/gh.exe`) is the fallback binary for
  `scripts/github-mirror.mjs`; keep it when cleaning the installers

`artifacts_cms_audit/` (underscore) was renamed `artifacts-cms-audit/` (hyphen) on import so
the repo's `artifacts_*/` gitignore pattern (CI gate outputs) cannot shadow it.
