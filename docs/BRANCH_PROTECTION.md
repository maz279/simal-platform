# Branch protection & remote setup (P0-1 completion)

The baseline commit `cbdcde5` ("P0-1 baseline: audit state of 2026-10-12")
captures the tree exactly as the Independent Forensic Audit examined it.
Branch protection itself is a hosting feature — run the steps below once the
repository has a remote (GitHub). Until then the local rules stand in.

## 1. Create the remote and push

```bash
cd Codebase
git remote add origin <REPOSITORY_URL>
git push -u origin main
```

## 2. Protect `main` (requires gh CLI, repo admin)

```bash
gh api -X PUT repos/{owner}/{repo}/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=lint \
  -f required_status_checks[contexts][]=secrets-scan \
  -f required_status_checks[contexts][]=unit \
  -f required_status_checks[contexts][]=integration \
  -f required_status_checks[contexts][]=security \
  -f required_status_checks[contexts][]=parity \
  -f required_status_checks[contexts][]=build \
  -f required_status_checks[contexts][]=gate-clean-db-build \
  -f required_status_checks[contexts][]=gate-authz \
  -f required_status_checks[contexts][]=gate-pg-reporting \
  -f required_status_checks[contexts][]=gate-sequences \
  -f required_status_checks[contexts][]=gate-ga4-consent \
  -f required_status_checks[contexts][]=gate-sitemap-lastmod \
  -f required_status_checks[contexts][]=gate-facts-consistency \
  -f required_status_checks[contexts][]=gate-cms-e2e \
  -f required_status_checks[contexts][]=gate-link-crawl \
  -f required_status_checks[contexts][]=gate-placeholders \
  -f required_status_checks[contexts][]=gate-perf \
  -f required_status_checks[contexts][]=gate-csp-inline \
  -f required_status_checks[contexts][]=lighthouse \
  -f required_status_checks[contexts][]=gate-a11y \
  -f enforce_admins=true \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[require_code_owner_reviews]=true \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -F restrictions=null
```

Notes:
- rm(9.1-1): the contexts list above now covers **every** job in `ci.yml`
  (21 jobs), including the gates wired by 8.3/8.4/9.1 and the `lighthouse`
  job (rm 9.1-2). Keep it in lockstep with `ci.yml`: a job added there is
  added here in the same change.
- The P0-3 gates are **red by design** until their phases land. Protection
  with them as *required* blocks all merges until Phase 1/2/3/6 — which is
  exactly the remediation plan's intent (§1 rule 5: "No regression to
  green"). If interim merges are needed, add them as contexts later, not by
  deleting the gate jobs.

## 3. Local standing rules (until the remote exists)

- No direct commits to `main` except the P0 baseline series; all remediation
  work lands on `phase/N-M` branches merged with `--no-ff`.
- Every commit message references the finding IDs it advances
  (e.g. `P1-2: requireStaff on /api/admin/*`).

---

## UPDATE 2026-10-16 — rm(1.2-2): remote + protection IMPLEMENTED (local bare remote)

The repository now has a working remote and enforced protection without waiting for
the company host:

**Implemented state (verified by drill, see `scratch/rm-evidence/1.2-2-*.log`):**
- Remote: `origin -> ../remotes/simal-platform.git` (local bare repository at
  `Simal_Corporate_website/remotes/simal-platform.git`, initial branch `main`).
- `main` pushed and tracked (`git push -u origin main`).
- Server-side `update` hook on the bare remote rejects:
  1. **deletion** of `main`;
  2. **non-fast-forward (force) pushes** to `main`.
- Drill results: force-push → `remote rejected (hook declined)`; `:main` deletion →
  rejected; normal fast-forward push → accepted (`rm(1.2-2)` verification commit).
- What a local remote cannot enforce: PR-required merges and required status checks
  (no PR machinery exists outside a hosting platform). Until the company host lands,
  the stand-in discipline is: changes go through branches + `scripts/ci/run-local-ci.mjs`
  green before merging to `main` (the runner mirrors every ci.yml job).

**Swap-in runbook (when the company host is available):**
1. `git remote set-url origin <REPOSITORY_URL> && git push -u origin main`
   (or add as `upstream` and keep the bare remote as a mirror).
2. Apply the GitHub protection block above (§2), or the host's equivalent ruleset:
   require 1 approval + the CI contexts, block force-push and deletion, include admins.
3. Delete the local bare remote's `update` hook only if the host now owns enforcement;
   otherwise keep both layers (defense in depth).
4. First platform CI run is then automatic on push — capture the green run URL into
   `scratch/rm-evidence/` and `GOVERNANCE_REQUIREMENTS_BASELINE.md` §a44 (rm(1.3-2)).

**Local CI mirror (rm(1.2-3)):** `node scripts/ci/run-local-ci.mjs` executes every
`ci.yml` job (lint, secrets-scan stand-in, unit, integration, security, parity, build
+ artifact checks, and the 5 gates) against a scratch `simal_ci` database. It is the
pre-merge ritual until the platform runner exists.

---

## UPDATE 2026-10-17 — rm(9.1-3): CI platform + required status checks (rig)

The platform runner now exists: Gitea + `gitea-runner` on the rig
(`infra/ci-platform/`, runbook in its README). Remote `platform` →
`http://localhost:3000/simal-ci/simal-platform.git`; every push runs `ci.yml` unchanged.

`node infra/ci-platform/bootstrap.mjs --protect` adds what the bare remote could not:
merging into `main` requires **every** `ci.yml` job context (`CI / <job> (*)`) to be
green; force-push and deletion are blocked; pushes are limited to the CI account.
The `origin` bare remote and its `update` hook stay as they are (defence in depth).

`scripts/ci/run-local-ci.mjs` remains as a fast pre-push check. Its secrets-scan
now runs the real gitleaks (it used to be a grep stand-in that passed while the
platform scan had 11 findings).

---

## UPDATE 2026-10-19 — unify: remote topology + GitHub mirror

Workspace unified into this repo (audit/, project-doc/, primary-doc/, implementation/,
prototype/, ux/, content/, artifacts-cms-audit/, fixture-backups/, legacy/, .agents/);
remotes now three:

| Remote | URL | Role |
|---|---|---|
| `origin` | `../remotes/simal-platform.git` (bare) | hash-preserving full history, update hook (no force/delete on main) |
| `platform` | `http://localhost:3000/simal-ci/simal-platform.git` (Gitea) | **authoritative CI** — every push runs the 21-job `ci.yml`; branch protection via `infra/ci-platform/bootstrap.mjs --protect` |
| `github` | `https://github.com/maz279/simal-platform.git` (private; auth via the gh credential helper — `gh auth setup-git`) | content mirror — **chained snapshots, not full history** (see below) |

**Why GitHub gets a snapshot, not the 113-commit history:** commits `ee69382`..`3d7f43e`
(rm 8.1 window) carry vendored ClamAV build payloads (`clamav_rust.lib` 292 MB, four
`.pdb` ~111 MB) that exceed GitHub's hard 100 MB blob limit; GitHub rejects the push at
pre-receive no matter what came after. Removing them means rewriting history, which the
project explicitly declined — the audit corpus cites commit hashes (tracker rows, board,
ledger). Decision: full hash-preserving history stays authoritative on `origin` +
`platform`; GitHub receives a parentless import commit whose **tree is identical to the
authoritative `main` tip** and whose message records the exact tip hash. The `.lib`
payload was untracked in-repo (`a8e981d`) so future tips stay under the limit and
incremental fast-forward pushes to GitHub become possible from that point on.

**GitHub Actions stay disabled** on the mirror (`actions/permissions` API) — CI authority
remains the platform runner per rm(9.1-3). Enabling the 21 jobs on GitHub runners is a
documented follow-up (needs `tools/` vendored binaries via LFS or bootstrap download).
