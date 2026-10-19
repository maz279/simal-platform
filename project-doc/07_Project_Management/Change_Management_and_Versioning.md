# Change Management & Versioning

**Doc ID:** G4 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** PM

## Versioning scheme (matches existing practice)

- **Docs:** `MAJOR.MINOR` per file with Status-log sections (this workspace's convention). Master plan = index of record; each doc row flips to ✅ with version on creation.
- **Code:** semver tags; portal schema carries explicit `version` (currently 3) with migration tests.
- **API:** v1 frozen (B5); breaking → `/api/v2`.

## Change control

| Change class | Approval | Lead time |
|---|---|---|
| Content (F4 flow) | CM | same-day |
| Bug fix | TL | PR review only |
| Non-functional req change | PM + TL | 1 week |
| FRS/PRD requirement change | change board (G3) | phase-gate |
| DB migration | TL review + E4 backup point | per release |
| Compliance-affecting (C1/C2 items) | PM + CMP (SEC veto) | immediate hold |

## Process

Request (issue, template: what/why/impact/alt) → class → approval → D3 matrix row added in same PR → release notes entry → docs updated per F3 "lessons → docs" rule. Retroactive undocumented changes are treated as audit findings.

## Audit v2.0 additions

1. **Emergency change path (was missing — hypercare will need it):** SEV-1 hotfix = TL approves + applies + notifies; retrospective change-board review within 24 h; every emergency change must reference its incident (F3) and add a regression test (D3).
2. **Change freeze (aligns E6):** from **27 Nov 2026**, only SEV-1/2 fixes enter production; freeze list published in the release notes; violations = audit finding.
3. **Baseline manifest:** the frozen requirement/doc baseline = PRD v1.5, BRD v1.4, URD v1.3, FRS v1.3 + Project_doc v2.0 set; changes to baseline docs cite the change-board minute in their status log.
4. **Doc-code sync rule (enforced):** any PR touching schema/API/behavior must update the corresponding doc row in the same PR — CI checks doc-file mtimes vs code paths (advisory first, blocking after P3).

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — codifies workspace conventions |
| 2026-10-05 | **v2.0 audit:** +emergency change path, +freeze window 27 Nov, +baseline manifest, +doc-code sync enforcement |
