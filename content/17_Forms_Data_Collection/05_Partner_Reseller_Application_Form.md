# 05 Partner / Reseller Application Form

> **Source:** Simal Technologies Business Development — May 2026
> **Owner:** Business Development Director / Web Developer
> **Version:** 1.0

---

## 1. Overview

The Partner Application form allows prospective resellers and channel partners to apply for a Simal Technologies B2B trading account. Applications undergo admin review (trade license verification) with a target 24-hour approval turnaround.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `partner-application-form` |
| **Page(s)** | `/partners-resellers/`, `/b2b-customer-portal/` |
| **Method** | POST (multipart — file upload) |
| **API Endpoint** | `/api/forms/partner-application` |
| **File Upload** | Trade license (PDF/JPG/PNG, max 10 MB) |
| **reCAPTCHA** | v3 (threshold: 0.5) |
| **CRM** | HubSpot — Create Deal (pipeline: "Partnership") |
| **Approval SLA** | 24 business hours |

---

## 2. Field Definitions

### 2.1 Company Information

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 1 | **Company Legal Name** | text | Yes | 2–200 chars; as per trade license |
| 2 | **Trade License Number** | text | Yes | Alphanumeric; per UAE/respective country format |
| 3 | **Trade License Upload** | file | Yes | PDF, JPG, PNG; max 10 MB |
| 4 | **Country of Registration** | select | Yes | 250+ country list |
| 5 | **City** | text | Yes | 2–100 chars |
| 6 | **Company Website** | url | No | Valid URL format |

### 2.2 Business Profile

| # | Field | Type | Required | Options |
|---|-------|------|----------|---------|
| 7 | **Business Type** | select | Yes | System Integrator / IT Reseller / Retailer / Distributor / VAR / MSP / Other |
| 8 | **Years in Business** | select | Yes | <1 / 1–3 / 3–5 / 5–10 / 10+ |
| 9 | **Annual Revenue (USD)** | select | No | <$100K / $100K–$500K / $500K–$1M / $1M–$5M / $5M+ |
| 10 | **Number of Employees** | select | Yes | 1–10 / 11–50 / 51–200 / 201–500 / 500+ |

### 2.3 Brand Interest

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 11 | **Brands of Interest** | checkbox (multi) | Yes (min 1) | All 15 brands listed with checkboxes |
| 12 | **Current Brand Portfolio** | textarea | No | "What brands do you currently distribute/resell?" Max 500 chars |

### 2.4 Territory & Operations

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 13 | **Target Sales Territory** | select (multi) | Yes | GCC countries, African countries, CIS countries |
| 14 | **Expected Annual Order Volume (USD)** | select | Yes | <$50K / $50K–$100K / $100K–$500K / $500K–$1M / $1M+ |

### 2.5 Contact & References

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 15 | **Primary Contact Name** | text | Yes | 2–100 chars |
| 16 | **Primary Contact Email** | email | Yes | Business email |
| 17 | **Primary Contact Phone** | tel | Yes | International format |
| 18 | **Position/Title** | text | Yes | 2–100 chars |
| 19 | **Trade References** | textarea | No | "Names of IT brands you currently work with" Max 500 chars |

### 2.6 Terms

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 20 | **Terms Acceptance** | checkbox | Yes | Link to Reseller Agreement PDF |
| 21 | **Marketing Consent** | checkbox | No | Opt-in for partner marketing communications |

---

## 3. File Upload Specifications

### 3.1 Trade License Upload

```javascript
const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10 MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxFiles: 1,
  
  validate: function(file) {
    if (file.size > this.maxSize) {
      return 'File size must be under 10 MB.';
    }
    if (!this.allowedTypes.includes(file.type)) {
      return 'File must be PDF, JPG, or PNG.';
    }
    return null; // Valid
  }
};
```

### 3.2 Secure Upload

- Files stored in private S3 bucket or local secure directory
- Virus scanned on upload (ClamAV)
- Accessible only to admin review team
- Auto-deleted 90 days after approval/rejection

---

## 4. Admin Review Workflow

```
Application Submitted
    │
    ▼
① Trade License Verified (admin checks validity)
    │
    ├── Valid → Proceed
    └── Invalid → Reject (with reason)
    │
    ▼
② Business Profile Reviewed (category fit, territory overlap)
    │
    ├── Approved → Proceed
    └── Needs Clarification → Email follow-up
    │
    ▼
③ B2B Account Created
    │
    ▼
④ Welcome Email Sent (see 18_Email_Templates/02_B2B_Registration_Approved.md)
```

---

## 5. Success State

```
┌──────────────────────────────────────────────┐
│  ✓  Application Submitted!                    │
│                                                │
│  Thank you, {contactName}. Your partner        │
│  application for {companyName} is under review.│
│                                                │
│  Reference: PART-20260502-0042                 │
│                                                │
│  What happens next:                            │
│  ① Our team reviews your application          │
│  ② Trade license verification (within 24h)    │
│  ③ You'll receive an email with the decision  │
│                                                │
│  Questions? Email partners@simalme.com         │
│  or call +971 4 393 0507.                      │
└──────────────────────────────────────────────┘
```

---

## 6. CRM Integration

### 6.1 HubSpot Deal

| Field | Value |
|-------|-------|
| `dealname` | `Partner Application — {companyName}` |
| `dealstage` | `application_received` |
| `pipeline` | `partnership` |
| `trade_license_number` | {licenseNumber} |
| `business_type` | {businessType} |
| `target_territory` | {territories} |
| `expected_volume` | {volume} |

---

> **Next File:** [06_Job_Application_Form.md](./06_Job_Application_Form.md)

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — Partner Application Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
