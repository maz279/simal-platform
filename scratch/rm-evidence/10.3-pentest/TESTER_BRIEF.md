# Tester Brief — SIMAL-PEN-2026-10-18

You are an **independent penetration tester** engaged to attack the Simal platform. You are NOT
the implementer: do not read `apps/portal/src/**`, `apps/site/src/**`, any `test/**` file, or
`scripts/ci/security-verification.mjs` (the engineering team's own suite). You may read the
commission pack and the requirements baseline, and you may inspect the running application and
its HTTP behaviour.

## Environment
- Portal API/UI: `http://127.0.0.1:8090` · Public site (edge): `http://127.0.0.1:8100`
- PostgreSQL: `127.0.0.1:5433` (database `simal`). Staff/partner test accounts and connection
  strings are in `Codebase/apps/portal/.env` (ADMIN_*, REVIEWER_*, VIEWER_*, DATABASE_URL).
- The bootstrap admin may or may not require MFA (ADMIN_MFA_REQUIRED). If a login returns
  `{mfaRequired:true}`, complete `/api/auth/mfa` with a TOTP code generated from
  ADMIN_TOTP_SECRET (RFC 6238; you may use `Codebase/apps/portal/src/lib/security.js#totpNow`).
- **Mutation testing must not touch the live rig's data.** Boot your own portal on a scratch
  database:
  ```js
  import { bootApp, login } from 'file:///C:/software_project/Simal_Corporate_website/Codebase/scripts/ci/lib.mjs';
  const boot = await bootApp({ mode: 'pg', mfa: false });   // provisions a scratch DB, generated creds
  // boot.base, boot.creds.{adminEmail,adminPassword,adminTotp,reviewerEmail,...,viewerEmail,...}
  await boot.stop();
  ```
  Each boot is isolated. For rate-limit tests set `process.env.RATE_LIMITS_STRICT = '1'` BEFORE
  bootApp (otherwise the test licence relaxes the strict tiers).
  For the live rig you may perform read-only and authentication checks only.

## Rules of engagement
- No denial-of-service, no load testing. No destructive SQL against the LIVE database.
- Do not modify any file under `apps/`, `scripts/`, or `docs/`.
- Write your probes under `Codebase/scratch/pentest/<your-area>/`. Never commit anything.
- Restore any content you edit on a scratch instance; never publish on the live rig.
- If a probe is destructive or ambiguous, prefer a scratch portal.

## What to test
Use `docs/PEN_TEST_COMMISSION_PACK.md` §2 as the scope. Your assigned focus is in the task
prompt. Treat every "expected control" there as a hypothesis to disprove — try to bypass it,
not merely to observe it. Include negative and positive cases, and test the boundary values
(e.g. 5th vs 6th attempt, expired vs fresh token, role X vs role Y).

## Output (required)
Write `Codebase/scratch/pentest/<your-area>/findings.json`:
```json
{
  "tester": "<area>",
  "startedAt": "<ISO>",
  "environment": "scratch|live",
  "cases": [
    {
      "id": "<AREA>-01",
      "title": "short imperative description of the attack",
      "surface": "endpoint or page",
      "result": "PASS|FAIL",
      "severityIfFail": "critical|high|medium|low|none",
      "expected": "the control as stated in the pack",
      "observed": "status codes / bodies, with request id where present",
      "reproduction": "exact curl/fetch or page steps",
      "evidence": "path to your captured evidence file under scratch/pentest/<area>/"
    }
  ]
}
```
Also return, in your final message: the case count, PASS/FAIL split, and every FAIL with severity
and the one-line observation. Be precise: a FAIL must be reproducible from your `reproduction`.
If you find no defect in an area, say so explicitly with the cases that prove it.
