# 07 Support Ticket Form — B2B Portal

> **Source:** Simal Technologies Technical Support — May 2026
> **Owner:** Support Manager / Web Developer
> **Version:** 1.0

---

## 1. Overview

The B2B Support Ticket form allows registered B2B portal users to submit technical support requests, warranty claims, and order-related inquiries. Tickets are auto-assigned, tracked with unique IDs, and resolved within defined SLAs based on severity.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `support-ticket-form` |
| **Access** | Authenticated B2B users only |
| **Page(s)** | B2B Portal — `/b2b-portal/support/new-ticket/` |
| **Method** | POST (multipart — attachment upload) |
| **API Endpoint** | `/api/b2b/support-tickets` |
| **Ticket System** | Internal ticketing (database) + email notification |
| **Attachment** | Up to 5 files; JPG/PNG/PDF; max 10 MB each |
| **SLA** | Per severity (see below) |

---

## 2. Field Definitions

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 1 | **Subject** | text | Yes | 5–200 chars; ticket summary |
| 2 | **Category** | select | Yes | Order Inquiry / Product Issue / Warranty Claim / Technical Support / Delivery Issue / B2B Portal Issue / Account / Other |
| 3 | **Severity** | select | Yes | Critical — Business Stopped / High — Major Impact / Medium — Partial Impact / Low — Minor/General |
| 4 | **Related Order (Optional)** | select | No | Dropdown of user's recent orders (past 90 days) |
| 5 | **Product/Brand** | select | No | All 15 brands; helps route to brand specialist |
| 6 | **Description** | textarea | Yes | 20–5000 chars; detailed description of issue |
| 7 | **Steps to Reproduce** | textarea | No | Max 3000 chars; for technical issues |
| 8 | **Attachment(s)** | file (multi) | No | Up to 5 files; JPG/PNG/PDF; each max 10 MB |
| 9 | **Preferred Contact** | radio | Yes | Email / Phone / B2B Portal |

---

## 3. Severity SLA Matrix

| Severity | Description | First Response | Resolution Target |
|----------|-------------|---------------|-------------------|
| **Critical** | Business stopped; complete system/order failure | ≤ 1 hour | ≤ 4 hours |
| **High** | Major impact; significant functionality affected | ≤ 2 hours | ≤ 8 hours |
| **Medium** | Partial impact; workaround available | ≤ 4 hours | ≤ 24 hours |
| **Low** | Minor issue; general inquiry | ≤ 8 hours | ≤ 48 hours |

**Business Hours:** Sunday–Thursday, 9:00 AM–6:00 PM GST (UTC+4)

---

## 4. Ticket Auto-ID Format

```
TKT-{YYYYMMDD}-{4-digit sequential}

Example: TKT-20260502-0042
```

Generated server-side upon submission; displayed to user immediately.

---

## 5. Success & Notification

### 5.1 Success State

```
┌──────────────────────────────────────────────┐
│  ✓  Ticket Created                            │
│                                                │
│  Ticket ID: TKT-20260502-0042                  │
│  Category: Product Issue                       │
│  Severity: Medium                              │
│  Expected Response: Within 4 hours             │
│                                                │
│  [View My Tickets]  [Create Another]           │
└──────────────────────────────────────────────┘
```

### 5.2 Email Notification

**To:** User's registered email + `support@simalme.com`
**Subject:** `[TKT-20260502-0042] {subject} — {severity}`

---

## 6. Ticket Lifecycle

```
New (auto) → Assigned (support agent) → In Progress → 
  ├── Waiting on Customer → In Progress
  ├── Resolved → Waiting for Confirmation
  └── Escalated (to senior/specialist)
      → Resolved → Closed (auto after 72h if no response)
```

---

> **Next File:** [08_Form_Validation_Error_Content.md](./08_Form_Validation_Error_Content.md) — Cross-form validation error messages in 4 languages.

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — Support Ticket Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
