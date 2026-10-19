# Incident Post-Mortem Template

**Doc ID:** F3 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** OPS · Blameless process

- **ID / date / severity / duration** — INC-YYYY-MM-DD-n
- **Summary** (2 sentences, customer impact first)
- **Timeline** (UTC/GST, from first alert to closure — include detection source: E5 alert vs human)
- **Impact** (users, invoices/KYC delayed, data exposure yes/no → if yes, C1 §6 triggered?)
- **Root cause** (technical + contributing factors; "why" ×5)
- **What went well / what didn't**
- **Action items** (owner · due · type: runbook F1 / monitor E5 / code / process) — tracked to closure in G2 or backlog
- **Lessons → docs updated** (list which of these documents changed)

## Audit v2.0 additions (rules attached to this template)
- **Action-item linkage:** every action carries a tracker ID (G2 register or backlog) — postmortems with unowned actions are not closed.
- **Privacy rule:** no personal data in stored postmortems (emails/names redacted to roles) — C1-aligned.
- **Severity reclassification review:** if impact differed from initial severity, note why — feeds D1 §4 calibration quarterly.
- **Doc-update verification:** the "lessons → docs" list is checked at the next weekly review; missing updates reopen the postmortem.

Completed within 5 business days for SEV-1/2; stored in `06_Operations/postmortems/`.
