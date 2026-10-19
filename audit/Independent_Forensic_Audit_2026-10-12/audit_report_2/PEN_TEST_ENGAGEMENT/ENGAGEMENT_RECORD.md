# Penetration Test — Engagement Record (P10-2 / rm 10.3-1)

**Engagement ID:** SIMAL-PEN-2026-10-18
**Scope document:** `PEN_TEST_COMMISSION_PACK.md` (SIMAL-PENTEST-SCOPE-v1)
**Date:** 2026-10-18
**Client:** Simal Corporate Platform (internal steering)
**Tester:** independent verification team — three isolated test agents (`auth`, `kyc`, `cms`),
each given ONLY the commission pack, the ratified requirements baseline and the running
application. They were instructed not to read the implementation, the repository's tests, or the
engineering team's own security suite, and not to modify any code. Their findings are the
engagement's deliverable.

**Why not a commercial firm:** contracting an external security firm requires procurement,
a signed authorization and payment — human/commercial acts outside this environment. This
engagement is the maximum independent execution available here: isolated testers, black-box
briefs, their own probes, evidence captured per finding. The commercial retest remains a human
action, and `PEN_TEST_COMMISSION_PACK.md` §8 stays as the checklist for it.

**Environment:** dev rig — portal `http://127.0.0.1:8090`, edge `http://127.0.0.1:8100`,
PostgreSQL `127.0.0.1:5433`. Test accounts are the rig's staff/partner accounts; mutation tests
run against scratch databases (rules of engagement §5 of the pack). No production data exists.

**Method:** black-box, pack-driven. Each tester owns its focus area, designs its own probes,
records request/response evidence, and classifies severity (CVSS 3.1 qualitative mapping:
Critical / High / Medium / Low / none). Findings are imported into
`FINDINGS_MATRIX.csv` + the remediation board with ID, evidence, task and acceptance (pack §6).

**Deliverables produced:** tester findings (`scratch/pentest/<area>/findings.json` + evidence),
`PEN_TEST_ENGAGEMENT_REPORT.md`, board rows `PEN-2026-*`, retest of every finding by the
engineering team (triage section of the report).
