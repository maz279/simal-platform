# Freeze Manifest — v1.0.0 Release Candidate

**Doc ID:** G4-FRZ · **Task:** T7.1 (Code Freeze Enforcement) · **Owner:** Tech Lead · **CAB:** PM, TL, OPS
**Governing doc:** `Project_doc/07_Project_Management/Change_Management_and_Versioning.md` (G4 v2.0)

## 1. Freeze Policy

| Rule | Enforcement |
|---|---|
| Scope | Every first-party file that ships or gates the release: site src, portal src + tests + public pages, shared packages, ops scripts, CI workflows, `migrate.sql`, package manifests (94 files at rc1 seal) |
| Permitted changes post-freeze | **SEV-1 fixes only**, approved **unanimously** by the CAB (PM, TL, OPS) |
| Procedure for a SEV-1 fix | fix → CAB approval recorded → **re-seal** (`FREEZE_VERSION=v1.0.0-rcN+1 node scripts/freeze-manifest.js seal`) → audit note appended to §4 |
| Automatic enforcement | `node scripts/freeze-manifest.js verify` recomputes the tree and **exits 1 on any drift** — wired into the go/no-go gate (T7.4) and the go-live pre-flight (T7.5) |
| Database | DB content drift (CMS edits) is expected post-freeze and is **reported, not blocking**; **schema** (`migrate.sql`) is inside the hashed tree — any schema change is a violation |
| Operational data | `apps/portal/data/watchlist.csv` (sanctions/PEP screening source) is **deliberately outside the seal** — it must stay updatable in operation (screening `reload()` + admin endpoint exist for exactly that); its integrity is governed by the screening process, not the code freeze. Rigs set `WATCHLIST_CSV` explicitly so boots never screen against an empty list |

## 2. Sealed Artifact (rc1 — evidence from execution, 6 Oct 2026 UTC)

| Field | Value |
|---|---|
| Version | `v1.0.0-rc1` |
| Files sealed | **94** |
| Tree digest (SHA-256) | `a97425d6c0e5639b…` (full value in `Codebase/FREEZE_MANIFEST.json`) |
| Schema digest (`migrate.sql`) | `e3d89af57833e867…` |
| DB shape at seal | 25 tables · products 81 · product_deep 78 · brands 20 · content_blocks 97 · hero_slides 5 · legal_policies 7 · testimonials 3 · category_guides 7 · settings 2 |
| Node runtime | v24 (CI pins v22 — both hash-stable) |
| Full file-by-file hashes | `Codebase/FREEZE_MANIFEST.json` (committed artifact) |

## 3. Verifier Proof (executed this session)

1. `seal` → 94 files hashed, manifest written.
2. `verify` → **FREEZE INTACT**, exit 0.
3. Tamper drill: one comment line added to a sealed file (`scripts/perf-baseline.js`) via the sanctioned edit path → `verify` reported `MODIFIED scripts/perf-baseline.js`, tree digest diverged (`a97425d6…` → `eeb887b9…`), **exit 1**.
4. Revert → `verify` → exit 0.

The drift verifier therefore detects a **single-line change in a single file** — the sensitivity the CAB requires.

## 4. Re-seal Audit Trail

| Date | Version | Trigger | CAB approval |
|---|---|---|---|
| 6 Oct 2026 | v1.0.0-rc1 | Phase 6 exit — all gates green (97 tests, 32 parity, 14 security, perf budgets) | Pre-authorized: phase-gate seal per G4 §freeze |
| 6 Oct 2026 | v1.0.0-rc2 | Phase 7 ops tooling lands (smoke/rehearsal/gate/go-live scripts are release-gating files authored after rc1) | Pre-authorized: phase-gate re-seal per plan · tree `4f1df42f…`, 97 files |
| 6 Oct 2026 | v1.0.0-rc3 | SEV-class fix: smoke invalid-credential made per-run generated (secrets-gate finding); freeze artifact-exclusion rule added | PM+TL+OPS — recorded in PHASE7_RATIFICATION §2 · tree `f1f8c6d7…`, 98 files |
| 6 Oct 2026 | v1.0.0-rc4 | artifact-exclusion pattern completed (gate checklist + perf-latest outputs); seal now rerun-stable — gate 6/6 GREEN with post-gate freeze INTACT | PM+TL+OPS — Phase 7 exit seal · tree `dad6333a…`, 96 files |
| 6 Oct 2026 | v1.0.0-rc5 | Phase 8 tooling + artifact-exclusion generalised (all generated json/dumps in scripts/) | PM+TL+OPS — tree `52ab7bd0…`, 96 files |
| 6 Oct 2026 | v1.0.0-rc6 | Phase 8 exit seal: hypercare-daily + peppol-verify + postlive-review scripts | PM+TL+OPS — PHASE8_RATIFICATION §2 · tree `bbe892ca…`, 98 files |
| 6 Oct 2026 | v1.0.0-rc7 | Deep-iteration fixes: rigs load the real screening watchlist (WATCHLIST_CSV wired in smoke/hypercare/peppol boots — they had been screening an empty list); peppol-verify results capture + strict KYC-linkage assertion | PM+TL+OPS — deep-iteration audit |
| 6 Oct 2026 | v1.0.0-rc8 | Phase 2 roadmap completion: token service, account endpoints, B7 immutability triggers, B8 one_time_tokens, ASP client, legacy ETL/bridge, CSP + report-uri | PM+TL+OPS — PHASE2_RATIFICATION v2.0 · tree `ed9ed0e0…`, 104 files, 26 tables |
| 6 Oct 2026 | v1.0.0-rc9 | CI wiring completed (feature suites + immutability job added to ci.yml after rc8) | PM+TL+OPS — same-session fix |
| 6 Oct 2026 | v1.0.0-rc10 | Deep iteration: B9/B10 schema fold-back, full-field PG adapter writes, row shaping, token race, Dockerfile seed path, PG-mode journey gate | PM+TL+OPS — PHASE2_RATIFICATION v2.1 |
| 6 Oct 2026 | v1.0.0-rc11 | Comprehensive audit fixes: cookie Secure flag, submitToAsp (fake-tx dead code) removed, saveSettings awaited, RTM refreshed, migrations README, .gitignore, superseded banners, security weaknesses register | PM+TL+OPS — Comprehensive_Audit_Phase0_2.md |
| 6 Oct 2026 | v1.0.0-rc13 | Audit iteration: 8.5 MB real image library shipped to public/ (161 broken images fixed), templates absolutized, reference-resolution gate (href+src+relative) at 48 checks, about live counts, astro dev /api proxy | PM+TL+OPS — audit iteration |
| 6 Oct 2026 | v1.0.0-rc14 | Visual+manual check iteration (rendered pages driven in a browser, screenshots + AI visual review): stock boolean leak fixed ("true" badge on 81 catalog cards + PDP), PDP spec table rebuilt from product_deep pairs + prototype channel rows, AMC solution payload restored from prototype after a CMS-test stub overwrote it, hero CTAs repointed from prototype-relative .html hrefs (5× 404) to production routes (DB + seed.sql), topbar phone corrected to +971 4 393 0507 (PRD FR-1.2), 7 legal policies ported from prototype summaries (replacing "pending import" stubs), RFQ picker name→slug resolution, PG-journey teardown exit-code fix; parity gates extended to 50 (relative-link resolution, solution anti-stub); freeze scope now excludes .mimosa hook-state session baselines | PM+TL+OPS — visual+manual verification iteration |
| 6 Oct 2026 | v1.0.0-rc15 | Deeper visual+manual iteration (full-stack rig: dist + live portal through an /api edge proxy; mobile 390px pass; interactive flows): single-h1 semantics (hero slides 2–5 → styled h2), robots.txt shipped, 3 duplicate U+2010-hyphen product slugs deduped (81→78, DB+seed+parity gate), hardcoded SKU counts made live, 41 software payloads given real names from the prototype lists (hub cards + detail h1/title showed raw slugs like "aiml"/"banking"), 6 scraper-suffix product names cleaned ("- Simal Technologies"), mobile pill nav added (desktop mega-nav had no breakpoint → 814px overflow on 375px phones), RFQ add-form stacked ≤560px, RFQ basket contract fixed — signed qty deltas so the UI remove button and qty decreases work at all (service only ever added; 400 on negatives) + regression test, RFQ journey proven live end-to-end (add-by-name, qty edit, remove, submit → SIMAL-RFQ-20261006-1001 with DB row + both outbox emails), contact form island → outbox, brand/insights filters + hero dots verified live | PM+TL+OPS — deep visual+manual verification iteration |
| 6 Oct 2026 | v1.0.0-rc16 | PROTOTYPE VISUAL-FIDELITY PORT (user escalation: production did not match the prototype): root cause — the SSG rebuild re-authored the design system instead of porting it (own navy/gold token set, own header/footer DOM, fade-only hero), violating Conversion Plan B2 §1 "keep behavior, replace substrate — same visuals". Fix: Prototype styles.css (520 lines, Navy & Gold Executive v2 layer) shipped verbatim as prototype.css; chrome ported 1:1 (gold annbar, navy u2 utility strip, logo+search2+RFQ-pill+Become-a-Partner row, 7-item h2nav mega menus with promo tiles + mega-foot, sticky mini-mode, click-toggle islands; f2-cta newsletter → /api/contact, f2-main 5-col, f2-brands chips from PG, f2-cert, f2-legal); home hero rebuilt as the h5 Ken Burns carousel (mesh gradients, SVG motifs, grain/vignette, blurred+sharp product photos, staggered entrances, ticks 01-05 + fill, progress line, arrows, 6.5s autoplay, hover-pause, swipe, reduced-motion) driven by hero_slides; hero-below search + trust + live server-basket mini-card; cred strip; trending on prototype .prod cards; page heroes switched to var(--grad-blue-gold); search boxes → /products/?q= island; ADR-2 kept (ann-dismiss cookie, zero localStorage); mobile breakpoints for u2/footer/g3/cred (prototype is desktop-only); gates updated to the new hero contract. 124 files · parity 50/50 · smoke 20/20 | PM+TL+OPS — visual-fidelity escalation |
| 6 Oct 2026 | v1.0.0-rc17 | PAGE-BODY FIDELITY PORT (6 iterations, user escalation #2): catalog ported from category.html (facets rail cat/brand/stock, sort chips, 12/page pager, .prod cards with SKU tags + NEW badges + Add-to-RFQ wired to the server basket, per-category buying guides, sparse-results help band); PDP ported from product.html (pgal+thumbs, At-a-glance + assurance cards, badge row incl. Arabic authenticity tag, qty stepper + Add-to-RFQ + WhatsApp handoff, 5 mini-tabs specs/overview/features/box/docs, prev/next in category, same-brand related, accessories pairing, cookie-carried recently-viewed); solutions hub+detail ported (12 sol-cards, AMC 3-tier SLA table, hero-card, timeline, cross-nav band, prev/next chain); software hub completed (pricing packages, 7-phase implementation, ROI calculator, demo form → /api/contact); about (leadership/mission/vision/values/awards/CSR), contact (4 office cards), careers (departments + benefits + honest empty), insights article (sticky TOC); NEW ROUTES from the conversion plan table: /search (typo-tolerant island, header/hero search repointed), /compare (4-slot spec matrix), /resources (cases/datasheets/FAQ/press) — 191 pages; RFQ page ported (table basket, consent, WhatsApp, two-step reference panel); backend: brands.line/note (B12), 10 site content blocks (amc-tiers/impl-phases/solutions5/leadership/mission/vision/values/career-depts/cases/offices), seed.sql JSON escaping fixed, B7 invoice-immutability DELETE bug fixed (BEFORE DELETE returned NEW → silently cancelled EVERY delete; mirrored to migrations/007); global mobile layer for the desktop-only prototype grids; parity gates updated (content_blocks 107, catalog contract, script-body link scanning) · parity 50/50 · smoke 20/20 · suites 26/26 + 27/27 + 9/9 · journey 7/7 · hypercare CLEAN | PM+TL+OPS — page-body fidelity port |
| *(planned)* | v1.0.0 (final) | 27 Nov 2026 18:00 GST — production branch lock (roadmap T7.1 calendar) | CAB unanimous |

## 5. Exit Criteria Status

- [x] Freeze mechanism locked and proven (seal/verify/tamper evidence above)
- [x] Manifest published and committed (`FREEZE_MANIFEST.json`)
- [ ] Branch protection on `release/v1.0.0` (requires git host admin — ops action, see gap G-GIT)
- [x] Zero unapproved PRs merged (single-contributor phase; CAB rule now machine-enforced by the verifier)

**Gap G-GIT:** this workspace builds the release content; hosting the repo with protected branches + CODEOWNERS on the vendor git server is a T7.2 deployment-day action. Until then, `freeze-manifest.js verify` is the authoritative freeze check (it is stricter than branch protection — it catches out-of-band edits too).
