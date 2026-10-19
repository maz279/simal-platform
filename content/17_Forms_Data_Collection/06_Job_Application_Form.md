# 06 Job Application Form

> **Source:** Simal Technologies HR Department — May 2026
> **Owner:** HR Manager / Web Developer
> **Version:** 1.0

---

## 1. Overview

The Job Application form allows candidates to apply for open positions at Simal Technologies. Each submission includes a CV upload and is routed to the HR team in HubSpot. The form supports applications for specific job listings (via URL parameter) or general/unsolicited applications.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `job-application-form` |
| **Page(s)** | `/careers/` (per-job listing), `/careers/general-application/` |
| **Method** | POST (multipart — CV upload) |
| **API Endpoint** | `/api/forms/job-application` |
| **File Upload** | CV (PDF, max 5 MB) |
| **reCAPTCHA** | v3 (threshold: 0.5) |
| **CRM** | HubSpot — Create Contact |
| **Notification** | hr@simalme.com |

---

## 2. Field Definitions

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 1 | **Position Applied For** | select / auto | Yes | Populated from job listing URL parameter; or "General Application" |
| 2 | **Full Name** | text | Yes | 2–100 chars |
| 3 | **Email Address** | email | Yes | RFC 5322 |
| 4 | **Phone Number** | tel | Yes | International format |
| 5 | **Nationality** | select | Yes | 250+ country list |
| 6 | **Current Location** | select | Yes | Country + City |
| 7 | **Visa Status (UAE)** | select | Yes (if UAE) | Employment Visa / Visit Visa / Spouse Visa / Student Visa / Not Applicable |
| 8 | **Notice Period** | select | Yes | Immediate / 1 Week / 2 Weeks / 1 Month / 2 Months / 3+ Months |
| 9 | **Current Salary (AED)** | number | No | Monthly salary; integer |
| 10 | **Expected Salary (AED)** | number | Yes | Monthly salary; integer |
| 11 | **Total Years of Experience** | number | Yes | Integer, 0–50 |
| 12 | **Relevant Experience (years)** | number | Yes | Integer, 0–50 |
| 13 | **Education Level** | select | Yes | High School / Diploma / Bachelor's / Master's / PhD |
| 14 | **CV Upload** | file | Yes | PDF only; max 5 MB |
| 15 | **Cover Letter** | textarea | No | Max 2000 chars |
| 16 | **LinkedIn Profile** | url | No | Valid URL |
| 17 | **How Did You Hear?** | select | No | LinkedIn / Indeed / Referral / Company Website / Other |

---

## 3. File Upload — CV

### 3.1 Validation

```javascript
const cvValidation = {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ['application/pdf'],
  maxFiles: 1,
  
  validate(file) {
    if (file.size > this.maxSize) {
      return 'CV file must be under 5 MB. Please compress your PDF.';
    }
    if (!this.allowedTypes.includes(file.type)) {
      return 'CV must be in PDF format only.';
    }
    return null;
  }
};
```

### 3.2 Security

- Virus scan on upload (ClamAV)
- Stored in private HR-only S3 bucket or secure directory
- Auto-deleted 12 months after application (UAE PDPL compliance)

---

## 4. Success State

```
┌──────────────────────────────────────────────┐
│  ✓  Application Submitted!                    │
│                                                │
│  Thank you, {fullName}. Your application for   │
│  {position} has been received.                 │
│                                                │
│  Reference: JOB-20260502-0042                  │
│                                                │
│  What happens next:                            │
│  ① HR reviews your application (1–2 weeks)    │
│  ② Shortlisted candidates contacted for       │
│     interview                                  │
│  ③ Only shortlisted candidates will hear      │
│     from us.                                   │
│                                                │
│  View more openings: /careers/                 │
└──────────────────────────────────────────────┘
```

---

## 5. Email Notifications

### 5.1 Internal (HR Team)

**To:** `hr@simalme.com`
**Subject:** `New Application: {position} — {fullName}`
**Body:** Full application details + CV as attachment or secure download link

### 5.2 Auto-Reply (Applicant)

**To:** `{applicantEmail}`
**Subject:** (per language): EN: "Application Received — {position}" / AR: "تم استلام الطلب"
**Body:** Thank you message with reference number and timeline

---

## 6. CRM Integration (HubSpot)

| HubSpot Property | Form Field |
|-----------------|-----------|
| `firstname` / `lastname` | Full Name |
| `email` | Email |
| `phone` | Phone |
| `position_applied` (custom) | Position |
| `visa_status` (custom) | Visa Status |
| `notice_period` (custom) | Notice Period |
| `expected_salary` (custom) | Expected Salary |
| `total_experience` (custom) | Years of Experience |
| `education_level` | Education |
| `resume_link` (custom) | CV download URL |

---

## 7. Analytics

| Event | GA4 Event |
|-------|----------|
| Form View | `form_view` (form_name: job_application) |
| Form Submit | `form_submit` (form_name: job_application, position) |
| Application Success | `generate_lead` (value: 5) |

---

> **Next File:** [07_Support_Ticket_Form_B2B.md](./07_Support_Ticket_Form_B2B.md)

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — Job Application Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
