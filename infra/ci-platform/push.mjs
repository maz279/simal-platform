#!/usr/bin/env node
// infra/ci-platform/push.mjs — push a branch to the rig CI platform (rm 9.1-3).
//   node infra/ci-platform/push.mjs [branch=main]
// Authenticates this one command with the token from data/ci-platform/ (never stored
// in .git/config or the remote URL).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { token } = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'ci-platform', 'credentials.json'), 'utf8'));
const branch = process.argv[2] || 'main';
const basic = Buffer.from(`simal-ci:${token}`).toString('base64');
const r = spawnSync('git', ['-c', `http.extraHeader=Authorization: Basic ${basic}`, 'push', 'platform', `${branch}:${branch}`],
  { cwd: REPO, stdio: 'inherit' });
process.exit(r.status ?? 1);
