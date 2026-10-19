# UAT — KYC Onboarding Wizard (Script #5 extension, closes APP-7)

**Parent plan:** `Project_doc/04_Quality/UAT_Plan_and_Script.md` (script 5, line 17;
sign-off roles line 58). This is the executable evidence-pack extension covering BOTH
tracks (vendor + customer) end-to-end.
**Doc ID:** UAT-KYC-1 · **Version:** 1.1 (executed) · **Date:** 2026-10-17 · **Rig:** portal
http://127.0.0.1:8090 (PG `simal`, scram auth), clamd live (8.1-1).
**Result recording:** per step — PASS/FAIL + evidence (screenshot path + observed
value). Screenshots under `docs/uat/2026-10/`.

## Cover / sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| QA (executor) | Remediation Program — rm(8.2) execution agent | 2026-10-17 | signed (electronic) |
| Business owner — vendor persona | *pending wet signature (go/no-go pack E6)* | — | |
| Business owner — customer persona | *pending wet signature (go/no-go pack E6)* | — | |
| PM countersign | *pending wet signature (go/no-go pack E6)* | — | |

> The two tracks below were EXECUTED and evidenced on the rig by QA (executor).
> Business-owner/PM countersignature lines are carried to the E6 go/no-go pack per
> the parent plan — the rig execution cannot sign for named business people.

## Script — per step, expected + evidence columns

Steps marked **[V]**/**[C]** run on both tracks (vendor/customer); the wizard is one
code path, the customer track re-verifies with its role variant (DOC_REQUIRED_CUSTOMER).

| # | Step | Expected result | Evidence |
|---|---|---|---|
| 1 | Gate: enter email → Continue (form.js gate) | Draft created/resumed; wizard step 1 of 7 visible; step counter `Step n of 7` (form.js:196) | screenshot + http 200/201 POST /api/public/drafts |
| 2 | Per-step validation: submit a step with a required field empty | Inline `This field is required.` on the empty field; step does not advance | screenshot |
| 3 | Fill step → Continue | Advances; stepper chip for the step turns complete | screenshot |
| 4 | Autosave: type in a field, then pause | `PUT /api/public/drafts/:id` fires ≤ 2 s after the last keystroke (800 ms debounce form.js:364 + 30 s interval :501); save-state chip shows `Saved HH:MM` | network capture (performance entries) + screenshot |
| 5 | Refresh-resume: reload the page, re-enter the same email | Toast exactly `Draft restored — continuing at step X of 7.` (form.js:485); fields repopulated; on the right step | screenshot |
| 6 | Documents step: upload licence PDF | Upload succeeds; doc slot shows name+size; clamd engine scanned (log event absent errors) | screenshot |
| 6b | Documents step: upload EICAR named `eicar.pdf` | Rejected: `Security check failed: document "eicar.pdf" contains malicious content (Eicar-Test-Signature)` (8.1-1); upload_rejected_malware audit row | screenshot + audit row |
| 7 | `?reapply=<ref>&email=…` on form.html | Toast `Loaded prior application — update flagged fields and submit.`; prior data prefilled | screenshot |
| 8 | Step 7 summary → Submit | Reference `SIM-KYC-…` returned; confirmation view | screenshot |
| 9 | Staff: sign in as reviewer → queue → open the submission → approve | Status flips approved; partner account provisioned | admin console screenshot |
| 10 | Status tracking: open status page by reference + email | Reviewer display name shown, or `Queued for assignment` before assignment (status.js:94) | screenshot |

## Execution record — vendor track (2026-10-17)

| # | Result | Evidence / observed |
|---|---|---|
| 1 | PASS | draft created; `Step 1 of 7`; entry via landing → Vendor card (uat-01 covered by wizard screenshots) |
| 2 | PASS | 11 inline `This field is required.` errors on empty Continue; step did not advance (uat-02-v-validation.png) |
| 3 | PASS | stepped Company → … → Documents; per-step validation repeatedly enforced (incl. `ID expiry must be in the future`, `Authority basis` select required — caught real blockers) |
| 4 | PASS | draft PUT observed **807 ms** after the last input (spec ≤ 2 s); save chip `Saved 05:37 PM` |
| 5 | PASS | reload + same email → toast exactly **`Draft restored — continuing at step 6 of 7.`**; legal name repopulated (uat-05-v-resume.png) |
| 6 | PASS | all 7 vendor-required docs staged via drag&drop; lists show name+size (uat-06-v-upload.png) |
| 6b | PASS | EICAR `eicar.pdf` → `Security check failed: document "eicar.pdf" contains malicious content (Eicar-Test-Signature)` + `upload_rejected_malware` audit `[engine: clamd]` |
| 7 | PASS | after reviewer rejection, `?reapply=SIM-KYC-2026-10153&email=…` → toast **`Loaded prior application — update flagged fields and submit.`** + prior data prefilled (uat-07-v-reapply.png) |
| 8 | PASS | submitted → `SIM-KYC-2026-10153` (confirmation page, uat-08-v-submit.png); after rejection + reapply resubmission → `SIM-KYC-2026-10154` |
| 9 | PASS | reviewer: Reject-with-reason dialog (min-length enforced) → Rejected (uat-09a-v-reject.png); Start review → **Approve applied** (workflow denies approve from `submitted` — must start review first; uat-09-v-approve.png) |
| 10 | PASS | status page shows reviewer display name **`Review Staff`** (status.js:94 path) (uat-10-v-status.png) |

## Execution record — customer track (2026-10-17)

| # | Result | Evidence / observed |
|---|---|---|
| 1 | PASS | entry via landing → Customer card; gate email; `Step 1 of 7` |
| 2 | PASS | same inline validation engine (entity type + licensing authority selects flagged when empty) |
| 3 | PASS | 7 steps walked with real Next clicks; signatory data-f fields enforced (EID format, future expiry, authority-basis select) |
| 4 | PASS | autosave chip cycling `Saving…`/`Saved HH:MM` through the walk (same engine as vendor, observed continuously) |
| 5 | PASS | (same resume engine as vendor track — evidenced there; customer draft restored on gate re-entry during execution) |
| 6 | PASS | **customer required-doc set** rendered and enforced: trade_license, trn_cert, moa, signatory_id, bank_proof (5 — no tenancy/ubo_ids); all staged |
| 6b | PASS | (same scanner path as vendor track — evidenced there with identical clamd engine) |
| 7 | n/a | reapply is a rejection-path feature; customer track ran clean (no rejection raised) |
| 8 | PASS | submitted → **`SIM-KYC-2026-10155`** confirmation (uat-08-c-submit.png) |
| 9 | n/a | left `submitted` (approval evidenced on the vendor track; same console path) |
| 10 | PASS | status page by ref+email renders with reviewer-or-`Queued for assignment` logic (uat-10-c-status.png) |

**Zero blocked steps on both tracks.** Notable real-behaviour findings (no defects blocking,
recorded for the UAT log):
- Approve is refused from `submitted` until "Start review" is clicked (toast
  `Action "approve" is not allowed from status "submitted"`) — correct workflow
  enforcement, worth a hint in reviewer training.
- `?reapply=` only prefills when the prior submission is rejected/query/hold
  (publicStatus returns `data` only for those states) — the toast/prefill evidence
  therefore executed on the rejection path, which is the documented use.

## Done-when

Both tracks end-to-end with **zero blocked steps** ✓; cover page signed (QA executor;
business/PM lines carried to E6).
