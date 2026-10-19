# UAT Plan & Scripts

**Doc ID:** D2 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** QA · Personas from URD v1.3 (12 groups; 4 internal)

## Format
Each script: persona → goal → steps → expected. Executed on staging by named business users; result logged PASS/FAIL + SUS survey after the suite.

## Core scripts (25 minimum)

**Reseller (external)**
1. Find T705 by search typo → open PDP → add 3 items to RFQ → submit → receive `SIMAL-RFQ-*` reference by email.
2. Browse category guide → compare 2 SSDs → RFQ from compare.
3. Read Peppol article → click through to UniVAT solution → request demo (contact type pre-filled).
4. Subscribe to newsletter (double opt-in) → unsubscribe one click.

**Vendor/customer onboarding (external)**
5. Start vendor KYC via invite code → complete 7 steps over two sessions (resume) → upload licence (wrong type rejected, correct passes).
6. Receive query from reviewer → respond → status flips partner_updated.
7. Track status by reference + email (no login path).

**Partner (post-approval)**
8. Sign in with temp password → land on invoices portal.
9. Create invoice: buyer = KYC-approved TRN, 3 lines → live totals match hand calc → submit.
10. Attempt buyer TRN not in KYC → submit ok, validation later flags (expect ⚠ hint in UI).
11. Rejected invoice: read reason → staff reopens → partner edits lines → resubmit → delivered; open UBL preview (0235 IDs present).
12. Password change + session behaves (idle expiry).

**Simal reviewer (internal)**
13. Queue filters (status/role/search) → open submission → start review → approve → partner account provisioned (temp password in outbox).
14. Reject with reason (< 5 chars blocked) → partner notified.
15. Raise query on a section → partner_updated on response.
16. Invoice console: filter submitted → validate (7 checks shown, incl. fail case) → deliver → UBL stamped.
17. PII masking: viewer sees masked; super-admin unmask gated.
18. Force-logout a session (admin).

**Simal admin (internal)**
19. Create viewer/reviewer accounts; RBAC enforced on both consoles.
20. Export submissions CSV (masked) + report builder preset.
21. Master feed with integration token (INT-4) returns approved counterparties.

**Content manager (internal)**
22. CMS: edit product EN desc + AR translation → live on site within cache window; audit row written.
23. Publish new insight article → appears in hub + home strip (3 latest).

**Procurement manager (external)**
24. IT solution AMC detail → SLA table accurate → enquiry routed with context.
25. RTL pass: Arabic home journey mirrors EN (numerals Western).

## Acceptance
≥ 90% scripts PASS on first UAT round, 100% before GoLive; SUS ≥ 80; WCAG issues found route to C4.

## Audit v2.0 additions

- **Script 26 (new):** partner password-reset journey — request link (rate-limited), one-time token within 60 min, single-use enforced, session invalidation on change (covers A6 v2 §5; previously absent).
- **Entry criteria:** staging stable (no SEV-1/2 for 3 consecutive days), seed frozen, D3 traceability ≥ 90%.
- **SUS method fixed:** standard 10-item SUS administered after each persona's suite; score = Σ adjusted × 2.5 (0–100); target ≥ 80 per URD; EN and AR cohorts scored separately (R8 evidence).
- **Recording:** each script result logged (pass/fail + screenshot/trace + tester + date) in the UAT artifact `uat_results.xlsx`; failures auto-create tracker items linked to parity item where applicable.
- **Sign-off:** business owner per persona + PM + QA countersign; UAT certificate attached to E6 go/no-go pack.

## Status log
| Date | Event |
|---|---|
| 2026-10-05 | v1.0 — 25 scripts mapped to URD personas |
| 2026-10-05 | **v2.0 audit:** +script 26 password-reset, +entry criteria, +SUS method, +result recording + sign-off roles |
