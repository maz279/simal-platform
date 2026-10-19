# 07 Job Application Form

> **Page:** Careers — Job Detail
> **Form ID:** `job-application-form`
> **Handler:** `/api/forms/job-apply` → HR email + ATS
> **Last Updated:** May 2, 2026

---

## Form Fields

| # | Field | Type | Required |
|---|---|---|---|
| 1 | Full Name | text | ✅ |
| 2 | Email | email | ✅ |
| 3 | Phone | tel | ✅ |
| 4 | Nationality | select | ✅ |
| 5 | Current Location | select (Country + City) | ✅ |
| 6 | UAE Visa Status | select | ✅ |
| 7 | Total Years of Experience | select | ✅ |
| 8 | Current/Last Salary (AED) | number | ❌ |
| 9 | Expected Salary (AED) | number | ❌ |
| 10 | Notice Period | select | ✅ |
| 11 | LinkedIn Profile URL | url | ❌ |
| 12 | Cover Letter | textarea | ❌ |
| 13 | CV/Resume Upload | file (PDF) | ✅ Max 5MB |
| 14 | Portfolio/Certificates | file (PDF) | ❌ Max 10MB |
| 15 | How Did You Hear About This Role? | select | ✅ |
| 16 | Consent — Privacy Policy | checkbox | ✅ |

## File Upload Validation

- CV: PDF only, max 5MB
- Portfolio: PDF only, max 10MB
- Virus scan on upload

---

*© 2026 Simal Technologies Middle East LLC. Job Application Form Spec v1.0.*
