#!/usr/bin/env node
// infra/ci-platform/bootstrap.mjs — rm(9.1-3): bring up the rig CI platform (idempotent).
//
//   node infra/ci-platform/bootstrap.mjs            # gitea + admin + repo + runner + `platform` remote
//   node infra/ci-platform/bootstrap.mjs --protect  # also apply the `main` protection rule
//
// Secrets never enter the repo: the admin password, API token and runner token are
// written to data/ci-platform/ (git-ignored). Pushes authenticate per command with an
// http.extraHeader, so no credential is stored in .git/config.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMPOSE = path.join(REPO, 'infra', 'ci-platform', 'docker-compose.yml');
const STATE = path.join(REPO, 'data', 'ci-platform');
const BASE = 'http://localhost:3000';
const OWNER = 'simal-ci', REPO_NAME = 'simal-platform';

fs.mkdirSync(STATE, { recursive: true });
const stateFile = path.join(STATE, 'credentials.json');
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: REPO, ...opts });
  if (r.status !== 0 && !opts.allowFail) throw new Error(`${cmd} ${args.slice(0, 4).join(' ')} failed: ${(r.stderr || r.stdout).trim().slice(0, 400)}`);
  return r;
};
const compose = (...a) => sh('docker', ['compose', '-f', COMPOSE, '--env-file', path.join(STATE, 'runner.env'), ...a]);
const api = async (method, p, body) => {
  const r = await fetch(BASE + '/api/v1' + p, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json', authorization: 'token ' + state.token },
  });
  const text = await r.text();
  return { status: r.status, json: text ? JSON.parse(text) : null };
};

// 1. gitea (runner.env must exist for compose interpolation, even before the token does)
if (!fs.existsSync(path.join(STATE, 'runner.env'))) fs.writeFileSync(path.join(STATE, 'runner.env'), 'GITEA_RUNNER_REGISTRATION_TOKEN=pending\n');
compose('up', '-d', 'gitea');
for (let i = 0; ; i++) {
  const ok = await fetch(BASE + '/api/healthz').then((r) => r.ok, () => false);
  if (ok) break;
  if (i > 60) throw new Error('gitea did not become healthy on ' + BASE);
  await new Promise((r) => setTimeout(r, 1000));
}
console.log('[ci-platform] gitea healthy at', BASE);

// 2. admin user + API token
if (!state.password) {
  state.password = crypto.randomBytes(24).toString('base64url');
  sh('docker', ['compose', '-f', COMPOSE, '--env-file', path.join(STATE, 'runner.env'), 'exec', '-T', '-u', 'git', 'gitea',
    'gitea', 'admin', 'user', 'create', '--admin', '--username', OWNER, '--password', state.password,
    '--email', 'ci@simal.invalid', '--must-change-password=false']);
  save();
  console.log('[ci-platform] admin user created:', OWNER);
}
if (!state.token) {
  const basic = 'Basic ' + Buffer.from(`${OWNER}:${state.password}`).toString('base64');
  const r = await fetch(`${BASE}/api/v1/users/${OWNER}/tokens`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: basic },
    body: JSON.stringify({ name: 'bootstrap-' + Date.now(), scopes: ['write:repository', 'write:user', 'write:admin'] }),
  });
  if (r.status !== 201) throw new Error('token create failed: HTTP ' + r.status + ' ' + (await r.text()));
  state.token = (await r.json()).sha1;
  save();
}

// 3. private repository
if ((await api('GET', `/repos/${OWNER}/${REPO_NAME}`)).status === 404) {
  const r = await api('POST', '/user/repos', { name: REPO_NAME, private: true, default_branch: 'main', description: 'Simal platform (rig CI mirror of origin)' });
  if (r.status !== 201) throw new Error('repo create failed: HTTP ' + r.status);
  console.log('[ci-platform] repo created:', `${OWNER}/${REPO_NAME}`);
}

// 4. runner (registration token is only needed on first registration)
const regToken = sh('docker', ['compose', '-f', COMPOSE, '--env-file', path.join(STATE, 'runner.env'), 'exec', '-T', '-u', 'git', 'gitea',
  'gitea', 'actions', 'generate-runner-token']).stdout.trim().split(/\s+/).pop();
fs.writeFileSync(path.join(STATE, 'runner.env'), `GITEA_RUNNER_REGISTRATION_TOKEN=${regToken}\n`);
compose('up', '-d', 'runner');
console.log('[ci-platform] runner started');

// 5. `platform` remote (no credentials in the URL)
const url = `${BASE}/${OWNER}/${REPO_NAME}.git`;
const remotes = sh('git', ['remote']).stdout.split(/\s+/);
if (!remotes.includes('platform')) sh('git', ['remote', 'add', 'platform', url]);
else sh('git', ['remote', 'set-url', 'platform', url]);
console.log('[ci-platform] remote `platform` ->', url);

// 6. optional: protect main — no force-push/deletion, PR + green CI required to merge
if (process.argv.includes('--protect')) {
  const wf = fs.readFileSync(path.join(REPO, '.github', 'workflows', 'ci.yml'), 'utf8');
  const jobs = [...wf.slice(wf.search(/^jobs:/m)).matchAll(/^ {2}([a-z0-9-]+):\s*$/gm)].map((m) => m[1]);
  const rule = {
    rule_name: 'main', enable_push: true, enable_push_whitelist: true, push_whitelist_usernames: [OWNER],
    enable_force_push: false, enable_status_check: true,
    status_check_contexts: jobs.map((j) => `CI / ${j} (*)`),
    required_approvals: 0, block_on_outdated_branch: true,
  };
  const existing = await api('GET', `/repos/${OWNER}/${REPO_NAME}/branch_protections/main`);
  const r = existing.status === 200
    ? await api('PATCH', `/repos/${OWNER}/${REPO_NAME}/branch_protections/main`, rule)
    : await api('POST', `/repos/${OWNER}/${REPO_NAME}/branch_protections`, rule);
  if (r.status >= 300) throw new Error('branch protection failed: HTTP ' + r.status + ' ' + JSON.stringify(r.json));
  console.log(`[ci-platform] main protected: ${jobs.length} required CI contexts, force-push blocked`);
}
console.log(`[ci-platform] push with:\n  node infra/ci-platform/push.mjs [branch]`);
