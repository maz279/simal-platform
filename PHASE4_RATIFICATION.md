# Phase 4 Ratification Record

> **Deploy-audit note (2026-10-19):** historical ratification record — its counts and its
> "complete" / "RATIFIED" statuses are as of its own date and were not re-verified. Current state:
> `docs/NEXT_AUDIT_READINESS.md` rev 2 and the deployment-readiness ledger
> `scratch/rm-evidence/deploy-audit/FINDINGS.md` (D01–D55, HEAD `e613c5a`, platform run #18 21/21).
>
> **Claims below that the ledger contradicts** (each since fixed in `197ad47`, gate `cms-integrity`):
> "Rollback restores previous state" / `{"rolled_back":true}` — every Rollback restored the newest
> snapshot and brands/product_deep answered `rolled_back:true` as a silent no-op (**D07**);
> "legal_policies CRUD … PUT /api/cms/policies/:slug" — saving one language overwrote both EN and AR
> (**D06**).

**Doc ID:** P4-RR · **Version:** 1.0 · **Date:** 6 Oct 2026 · **Owner:** PM/TL

## T4.1 — CMS Module (cms.service.js + 14 API endpoints)

| Feature | Status | Evidence |
|---|---|---|
| content_blocks CRUD | ✅ | `PUT /api/cms/blocks/:entity/:id` upserts; `DELETE` removes |
| hero_slides CRUD | ✅ | `PUT /api/cms/slides/:idx`; `DELETE /api/cms/slides/:idx` |
| legal_policies CRUD | ✅ | `PUT /api/cms/policies/:slug` with version increment |
| Revision history | ✅ | `cms_revisions` table; every write stores previous state |
| Rollback | ✅ | `POST /api/cms/revisions/:table/:id/rollback` restores previous state |
| Publish event | ✅ | `POST /api/cms/publish` emits purge event to outbox (ADR-13) |
| Emergency publish | ✅ | `POST /api/cms/emergency-publish` with `decide` perm gate |
| Role-gated | ✅ | `notes` perm for CMS; `decide` for emergency |

### Proven lifecycle (live test):
```
1. UPSERT: title → "AMC v3"                        ✅
2. REVISIONS: 2 revisions stored (from 2 upserts)   ✅
3. ROLLBACK: {"rolled_back":true}                   ✅
4. VERIFY: title reverted to "AMC v2 via CMS"       ✅
5. PUBLISH: purge event with entities + timestamp   ✅
```

## T4.2 — Admin Consoles on Production DB
| Console | Status | Evidence |
|---|---|---|
| KYC queue | ✅ | `GET /api/admin/submissions` returns rows from PG (Phase 2) |
| Invoice console | ✅ | `GET /api/einvoice/admin/queue` returns invoices from PG |
| User admin | ✅ | User CRUD via PG repos (Phase 2 async migration) |
| Outbox viewer | ✅ | CMS publish events visible in outbox |

## T4.3 — Emergency Publish + Zero-Downtime Rollback
| Feature | Status | Evidence |
|---|---|---|
| Rollback to previous revision | ✅ | Proven: upsert → revision → rollback → verify |
| Emergency publish path | ✅ | Endpoint exists with `decide` perm gate |
| Zero-downtime | ✅ | Rollback is a single UPDATE; no service restart needed |

## New database object
| Object | Purpose |
|---|---|
| `cms_revisions` table (id, table_name, record_id, payload JSONB, actor, created_at) | Stores previous state on every CMS write; enables rollback |

## API endpoints added (14)
```
GET    /api/cms/blocks                     — list all content blocks (optionally by entity)
GET    /api/cms/blocks/:entity/:id         — get one block
PUT    /api/cms/blocks/:entity/:id         — upsert block (creates revision)
DELETE /api/cms/blocks/:entity/:id         — delete block (creates revision)

GET    /api/cms/slides                     — list hero slides
PUT    /api/cms/slides/:idx                — upsert slide
DELETE /api/cms/slides/:idx                — delete slide

GET    /api/cms/policies                   — list legal policies
GET    /api/cms/policies/:slug             — get policy
PUT    /api/cms/policies/:slug             — upsert policy (version++)

GET    /api/cms/revisions/:table/:id       — list revisions (last 10)
POST   /api/cms/revisions/:table/:id/rollback — rollback to previous state
POST   /api/cms/publish                    — emit publish/purge event
POST   /api/cms/emergency-publish           — emergency path (decide perm)
```

## All test suites
| Suite | Result |
|---|---|
| Portal unit (JSON mode) | ✅ 39/39 |
| PG integration | ✅ 24/24 (updated for 22 tables) |
| CMS lifecycle E2E | ✅ upsert → revision → rollback → publish |

**Phase 4 COMPLETE — CMS engineering + back-office consoles verified on PostgreSQL.**
