# 03 Demo Request Form — UniERP

> **Source:** Simal Technologies Web Development — May 2026
> **Owner:** UniERP Division / Web Developer
> **Version:** 1.0

---

## 1. Overview

The Demo Request form allows prospective UniERP clients to schedule a personalized, consultant-led demonstration of the platform. The form integrates with Calendly for automatic meeting booking and routes qualified leads to the UniERP sales team in HubSpot.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `demo-request-form` |
| **Page(s)** | `/software-erp-solutions/`, `/contact/demo-request/`, UniERP landing page CTA |
| **Method** | POST (AJAX) |
| **API Endpoint** | `/api/forms/demo-request` |
| **reCAPTCHA** | v3 (threshold: 0.5) |
| **Scheduling** | Calendly embed (post-submit) or manual follow-up |
| **CRM** | HubSpot — Create Deal (pipeline: "UniERP Sales") |
| **Meeting Platform** | Microsoft Teams (default) or Zoom |

---

## 2. Field Definitions

### 2.1 Contact Information

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 1 | **Full Name** | text | Yes | 2–100 chars |
| 2 | **Job Title** | text | No | 2–100 chars |
| 3 | **Company Name** | text | Yes | 2–150 chars |
| 4 | **Work Email** | email | Yes | Business email (no Gmail/Yahoo/Hotmail; warning only) |
| 5 | **Phone Number** | tel | Yes | International format |
| 6 | **Country** | select | Yes | Default: UAE |

### 2.2 Business Profile

| # | Field | Type | Required | Options |
|---|-------|------|----------|---------|
| 7 | **Industry** | select | Yes | 60+ industry verticals (see UniERP industry list) |
| 8 | **Company Size** | select | Yes | 1–10 / 11–50 / 51–200 / 201–500 / 500+ |
| 9 | **Current ERP** | select | No | None / Excel / QuickBooks / SAP / Oracle / Microsoft Dynamics / Zoho / Custom / Other |

### 2.3 Module Interest

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 10 | **Modules of Interest** | checkbox (multi) | Yes (min 1) | Finance, Sales/CRM, Inventory, Purchase, HR/Payroll, Manufacturing, Projects, eCommerce, POS, Reporting — check all that apply |

### 2.4 Schedule

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 11 | **Preferred Date** | date | Yes | Min: tomorrow; Max: 30 days out |
| 12 | **Preferred Time** | select | Yes | 9:00 AM / 10:00 AM / 11:00 AM / 2:00 PM / 3:00 PM / 4:00 PM (GST) |
| 13 | **Second Choice Date** | date | No | Alternate date |
| 14 | **Special Focus Areas** | textarea | No | Max 500 chars; "Tell us what you'd like to see in the demo" |

---

## 3. Calendly Integration

### 3.1 Auto-Booking Flow

```javascript
// After form validation passes:
Calendly.initInlineWidget({
  url: 'https://calendly.com/simal-unierp/demo',
  parentElement: document.getElementById('calendly-embed'),
  prefill: {
    name: formData.fullName,
    email: formData.email,
    customAnswers: {
      a1: formData.companyName,
      a2: formData.industry,
      a3: formData.modules.join(', ')
    }
  },
  utm: {
    utmCampaign: 'website-demo-request',
    utmSource: window.location.href,
    utmMedium: 'organic'
  }
});
```

### 3.2 Manual Follow-Up (Fallback)

If Calendly is unavailable:
- UniERP consultant calls/emails within 2 business hours
- Consultant proposes 3 available time slots
- Meeting confirmed via email + .ics calendar invite

---

## 4. CRM Integration — HubSpot

### 4.1 Deal Creation

| HubSpot Field | Form Field |
|---------------|-----------|
| `dealname` | `UniERP Demo — {companyName}` |
| `dealstage` | `demo_requested` |
| `pipeline` | `unierp_sales` |
| `industry_vertical` | `{industry}` |
| `company_size` | `{companySize}` |
| `current_erp` | `{currentERP}` |
| `modules_of_interest` | `{modules}` (semicolon-separated) |
| `demo_date_preferred` | `{preferredDate}` |
| `demo_focus_areas` | `{specialFocus}` |

### 4.2 Deal Stages

| Stage | Trigger |
|-------|---------|
| 1. Demo Requested | Form submission |
| 2. Demo Scheduled | Calendly booking confirmed |
| 3. Demo Completed | Consultant marks as done |
| 4. Proposal Sent | Commercial proposal emailed |
| 5. Negotiation | Pricing/scope discussion |
| 6. Closed Won | Contract signed |
| 7. Closed Lost | Declined / no response |

---

## 5. Email Notifications

### 5.1 Internal Notification

**To:** `erp-demo@simalme.com`
**Subject:** `New Demo Request: {companyName} — {industry} — {fullName}`

### 5.2 Auto-Reply to Requestor

See: [18_Email_Templates/07_Demo_Request_Confirmation.md](../18_Email_Templates/07_Demo_Request_Confirmation.md)

---

## 6. Success State

```
┌──────────────────────────────────────────────┐
│  ✓  Demo Request Received!                    │
│                                                │
│  Thank you, {fullName}. An ERP consultant      │
│  will contact you within 2 business hours to   │
│  confirm your demo session.                    │
│                                                │
│  Reference: DEMO-20260502-0042                 │
│                                                │
│  What to expect:                               │
│  ① A brief discovery call (15 min)             │
│  ② Personalized 45-min demo with your data    │
│  ③ No-obligation proposal with pricing        │
│                                                │
│  Questions? Call +971 4 393 0507               │
│  or WhatsApp us.                               │
└──────────────────────────────────────────────┘
```

---

## 7. Analytics

| Event | GA4 Event | Parameters |
|-------|----------|------------|
| Form Start | `form_start` | `form_name: demo_request` |
| Form Submit | `form_submit` | `form_name: demo_request, industry, modules` |
| Demo Scheduled | `demo_scheduled` | `form_name: demo_request, date, source` |
| Form Success | `generate_lead` | `form_name: demo_request, value: 100` |

---

> **Next File:** [04_Newsletter_Signup_Form.md](./04_Newsletter_Signup_Form.md) — Newsletter signup form configuration.

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — Demo Request Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
