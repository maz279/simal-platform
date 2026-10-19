# Rig CI platform (rm 9.1-3)

A self-hosted CI platform that runs `.github/workflows/ci.yml` **unchanged**:
Gitea (git hosting + Actions) and one `gitea-runner`, both in Docker on the rig.
It replaces the local-only stand-in (`scripts/ci/run-local-ci.mjs`) as the place
where "every gate runs on the CI platform". When the company git host exists,
the same workflow runs there; see "Swapping to the company host" below.

| Piece | Where |
| --- | --- |
| Web UI / API | <http://localhost:3000> (bound to 127.0.0.1 only) |
| Repository | `simal-ci/simal-platform` (private), git remote `platform` |
| Runner | `simal-rig-runner`, labels `ubuntu-latest`, `ubuntu-24.04` |
| Job image | `ghcr.io/catthehacker/ubuntu:act-24.04` |
| Credentials | `data/ci-platform/credentials.json`, `runner.env` (git-ignored) |

## Bring-up

```bash
node infra/ci-platform/bootstrap.mjs            # idempotent: gitea, admin, repo, runner, remote
node infra/ci-platform/push.mjs main            # push; the push triggers CI
node infra/ci-platform/bootstrap.mjs --protect  # protect main (see below)
```

Images are pinned by digest in `docker-compose.yml`. Pull from Gitea's registry
(`docker.gitea.com`) and `ghcr.io`, not Docker Hub. `postgres:16` (the `ci.yml`
service image) is tagged locally from the ECR public mirror:

```bash
docker pull public.ecr.aws/docker/library/postgres:16
docker tag public.ecr.aws/docker/library/postgres:16 postgres:16
```

The runner never re-pulls an image that is already present (`force_pull: false`).

## Why the runner is configured this way

- **`container.network: host`.** `ci.yml` targets GitHub-hosted VMs, where a job
  reaches its `postgres` service on `localhost:5432`. Host networking gives the
  job and its services one network namespace, so the workflow runs as written.
- **`capacity: 1`.** With host networking, two concurrent jobs would both bind
  5432. A full run is serial: 21 jobs in about 19 minutes on the rig
  (run #5, 2026-10-17).
- **`GITEA_INSTANCE_URL=http://host.docker.internal:3000`.** Jobs inherit this
  URL for `actions/checkout`. The compose service name `gitea` does not resolve
  from the host network.
- **`tool_cache_mode: shared`** (safe with capacity 1): Node 22 is downloaded once.

## Branch protection

`bootstrap.mjs --protect` sets a rule on `main`:

- force-push and deletion are blocked;
- pushes are limited to the `simal-ci` account;
- merging a pull request requires every `ci.yml` job (`CI / <job> (*)`) to be green.

This adds the required status checks that the bare remote's `update` hook could
not enforce (`docs/BRANCH_PROTECTION.md`). The hook stays as a second layer on `origin`.

## Operating it

- Re-run CI without a new commit: Actions → CI → "Run workflow"
  (the workflow has `workflow_dispatch`).
- Runner logs: `docker compose -f infra/ci-platform/docker-compose.yml --env-file data/ci-platform/runner.env logs -f runner`
- Stop it: `docker compose -f infra/ci-platform/docker-compose.yml --env-file data/ci-platform/runner.env down`.
  The named volumes keep the repository, run history and runner registration.

## Swapping to the company host

`ci.yml` stays portable. It has no Gitea-specific syntax and uses no
`gitleaks-action` licence. Chrome comes from `browser-actions/setup-chrome`, and
`psql` is installed when missing. To move:

1. add the host as a remote and push `main`;
2. apply the protection block in `docs/BRANCH_PROTECTION.md` §2;
3. capture the first green run URL in `scratch/rm-evidence/`.
