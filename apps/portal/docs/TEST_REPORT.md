# Test Report — Simal KYC System v1.1

Date: 26 September 2026 · Environment: Windows (Node v24.21.0), local server, Chromium (in-app browser)

## Summary

| Layer | Checks | Pass | Fail |
|---|---|---|---|
| Unit (`npm run test:unit`) | 38 | 38 | 0 |
| Integration (`npm run test:integration`) | 31 | 31 | 0 |
| Visual (scripted browser walkthrough) | 19 stages | 19 | 0 |
| **Total** | **88** | **88** | **0** |

Commands: `npm run test:unit` · `npm run test:integration` · `npm test` (both).
All credentials in tests are generated at runtime with `crypto` — no literals.

> **v1.1 adds the admin workspace suite** (`test/integration/workspace.test.js`, 12 tests): user CRUD
> with RBAC gates, one-time password reset, self/bootstrap deactivation guards, session listing and
> force-logout, settings round-trip with TIN checksum enforcement, report catalog, custom report
> builder, built-in default resolution (including the audit-backed `user-activity`), and CSV export
> shape (content-type, quoted header, rectangular CRLF rows).

## 1. Unit suite (38)

**Validators (18)** — TIN generator round-trip + tamper detection + 10-digit rejection; IBAN
mod-97 (valid/wrong-check/too-short); EID structure (valid/impossible-year); Peppol pattern;
complete application passes; bad TRN blocks with field error; foreign entity swaps TRN→foreign
tax id; UAE Peppol must equal 0235:TIN; expired licence rejected; missing vendor docs rejected;
POA signatory requires POA document; expired signatory ID rejected; ownership >100 rejected;
unaccepted declarations rejected; invalid IBAN rejected; customer role requires fewer docs.

**Security/Rules/Store (13)** — scrypt hash round-trip + wrong-password rejection; TOTP current
code accepted / wrong rejected / previous step accepted (drift) / far code rejected;
timingSafeEqual basics; rate limiter blocks after max within window, other keys unaffected;
magic-byte sniffing identifies PDF/PNG/JPEG/HEIC and rejects plain text; RBAC matrix (viewer
read+export only, reviewer decides, super_admin reopens); workflow happy path; approve blocked
from submitted; reject requires reason; rejected is terminal; partner-editable states; store
persists+reloads with v1→v2 migration adding missing collections; repository lifecycle
(users case-insensitive email, drafts token-guard, submissions duplicate-TIN with exclusion,
invites add/find).

**SSRF + Screening (7)** — outbound guard refuses loopback/localhost/private A-B-C/link-local/
IPv6-loopback/metadata endpoints, wrong protocols and non-URLs; accepts a real public https
host; watchlist CSV loads; exact match after legal-token normalisation (LLC/FZE/TRADING
stripped); clean name clears; signatory + UBO names screened; results persist per reference.

## 2. Integration suite (19 — full HTTP against a live server)

1. **health + settings + headers** — 200, ok, CSP `default-src 'self'`, nosniff, request-id, Peppol badge format.
2. **404s** — unknown API and unknown page.
3. **auth journey** — wrong password 401; admin password → MFA challenge → correct TOTP → session; `me` introspection; logout destroys session (`me` → 401).
4. **bad MFA code** — 401, challenge consumed.
5. **admin endpoints unauthenticated** — submissions/analytics/audit/export all 401.
6. **rate limiter** — repeated failed logins → 429 with retry window.
7. **full partner journey** — draft create/save/resume (bad token 404); stage real PNG (docId issued); fake .pdf rejected with "content" error; submit → 201 with reference; draft consumed; invalid submission 422 with `tax.trn` detail; status wrong-email 403 / right-email 200; reviewer start → query; partner respond → partner_updated; approve → approved; outbox contains the approval email; audit contains the decision; public timeline ends approved.
8. **draft resume (new)** — save data + step + staged doc; re-`createDraft` with the same email+role returns the SAME draft/token with data, step and staged documents preserved; a different role starts a separate draft.
9. **RBAC** — reviewer cannot reopen (403), admin can (200).
10. **PII masking** — reviewer sees masked signatory ID + masked IBAN; super admin `?pii=full` unmasked.
11. **CSV export** — reviewer export masked (••••), super admin full profile has Signatory IDs column.
12. **invite closed loop** — bulk import (1 valid, 1 rejected with reason); public invite lookup; unknown code `{found:false}`; submission with code converts invite to `converted` + links the reference.
13. **duplicate TRN** — second submission flagged; live `/tin-check` returns the existing record.
14. **screening** — "Shadow Future Trading FZE LLC" flagged (`screeningClear:false`, hits listed in admin view); clean name clears.
15. **workflow guards** — approve from submitted → 409; reject without reason → 400; with reason → 200.
16. **analytics** — stats totals ≥ journeys created; aging + expiries well-formed.
17. **integration master** — no token 401; valid token returns approved counterparties with required fields.
18. **list endpoint** — pending filter correct; pagination (per=3, page=2); search by company.
19. **checklist + notes** — persist and return.

## 3. Visual walkthrough (scripted browser, screenshots captured)

| # | Stage | Result |
|---|---|---|
| 1 | Landing: logo, TIN/Peppol badges, 8-brand strip, 2 role cards | ✓ |
| 2 | Admin login: password → MFA card → TOTP → app | ✓ |
| 3 | Dashboard: KPIs animate to live values, aging panel | ✓ |
| 4 | Queue: rows render, filter chips, export/import buttons by role | ✓ |
| 5 | Review: heading, 5 tabs, action bar (start/query/hold/reject/approve/print) | ✓ |
| 6 | Workflow: start → checklist ticks → note → approve → badge Approved | ✓ |
| 7 | Outbox: approval email visible + watchlist-reload button | ✓ |
| 8 | Wizard: gate → 7 steps with server-side drafts | ✓ |
| 9 | Documents: 7 required docs staged through real uploads (magic-byte verified) | ✓ |
| 10 | Submit → confirmation renders reference | ✓ |
| 11 | Status page: badge, timeline, company | ✓ |
| 12 | Admin finds the new submission via search | ✓ |
| 13 | Review documents tab: download links to audited `/api/admin/documents/:id` | ✓ |
| 14 | Heading-hierarchy + strict CSP (no inline scripts) | ✓ |
| 15 | **Race-proof draft save**: fill → advance → navigate away immediately → server retains step+data | ✓ |
| 16 | **Draft resume**: same email returns wizard at the saved step with all fields restored + "Draft restored" toast | ✓ |
| 17 | Server draft intact after resume (no blank-overwrite) | ✓ |
| 18 | Export CSV link follows active filters | ✓ |
| 19 | Pending-count badge in the sidebar updates live | ✓ |

## 4. Defects found & fixed during the test campaign

| # | Defect | Fix |
|---|---|---|
| 1 | TIN generator produced 16 digits | corrected padding math (unit-tested) |
| 2 | Seed timestamps NaN (`spec.ageDays` typo) | renamed to `spec.age` |
| 3 | Review decision timestamps relative to now, not submit | `t + cycle hours` |
| 4 | Export CSV passed the click event as filter → 0 rows | wrapped handler |
| 5 | Inline scripts blocked by strict CSP | externalised status/confirmation/terms/privacy/admin scripts |
| 6 | Frontend wizard dropped doc type (activeElement guess) | docType passed from the slot |
| 7 | Client staged-docs list replaced instead of merged | merge by type |
| 8 | **Server stageDocuments replaced the whole list per call** | merge by type server-side |
| 9 | Seeder left `nextRefSeq` in the seeded range → ID collisions | sequence advanced past seed range |
| 10 | `repos.persist` not exposed to services | exposed on the repository facade |
| 11 | Route dispatch didn't pass `next` to middleware | no-op next through the chain |
| 12 | Login rate limiter keyed by IP only → parallel sessions blocked | account+IP key, applied post-body-parse |
| 13 | Test-isolation: cached session destroyed by the logout test | fresh non-cached session for that test |
| 14 | Weak `Math.random` in test IDs (security scanner) | crypto-derived ids |
| 15 | SHA-1 in TOTP flagged | retained (RFC 6238 requires it) with in-code justification |
| 16 | **Draft resume didn't restore data/step** — createDraft response omitted payload; client started blank and overwrote the saved draft | server returns data/documents/step; client restores state + jumps to saved step with toast |
| 17 | Fast navigation could abort the in-flight draft save | `fetch(..., {keepalive:true})` on pagehide/beforeunload + POST beacon route |
| 18 | Stale browser cache served the pre-fix form.js | cache-buster bumped (v=3) |
| 19 | Export CSV link didn't follow filter changes | href refreshed on every filter change |
| 20 | Pending-count badge never updated | analytics refresh on every route + list refresh |
| 21 | Client validation silently skipped url/number/pct/peppol rules | rules + messages added |
| 22 | start-server.bat still the prototype's (python, port 8123) | rewritten for Node/port 3000 with first-run guidance |
| 23 | No .gitignore; stray test artifacts | .gitignore added (env/data/node_modules); strays removed |

## 5. Sign-off

All 76 automated checks green; complete partner→review→integration journey verified visually
against the running system, including the race-proof draft-resume flow. Known limits documented
in `docs/ARCHITECTURE.md §10`.
