# Content Inventory Master — pointer

**Doc ID:** H1 · **Version:** 1.0 · **Date:** 5 Oct 2026 · **Owner:** CM

The canonical inventory already exists and remains authoritative:

**→ `../../content/Required_Content_Files_Master_Inventory.md`**

Scope: 261 files across 20 sections (home, about, catalog, brands, solutions, software/ERP, partners, resources incl. 10 blog outlines + 5–8 case studies + white papers, careers, contact, legal, portal, utilities, multi-language, SEO metadata, media assets, forms, emails, chatbot, analytics).

Production deltas tracked in `Content_Governance_and_CMS_Guide.md` (F4); this pointer exists so the Project_doc tree is self-contained. No duplicate inventory is maintained here — single source of truth rule (G4).

**Audit v2.0 addition — delta-scan rule:** a weekly automated diff (file names + counts) between `content/` and the production CMS tables runs in CI; any drift (file without CMS row, or row without file) opens a CM ticket — the inventory can never silently diverge from what's live. Counts of record at freeze (27 Nov 2026): 81 products + 81 deep pages, 23 brands, 3 testimonials, 14 articles, 12 IT-solution lines, 20+7+12+36+9 software records, 7 category guides, 7 legal policies, 5 hero slides.
