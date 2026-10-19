# 05 Support Request Form

> **Page:** Technical Support
> **Form ID:** `support-form`
> **Handler:** `/api/forms/support` → HubSpot Ticket
> **Last Updated:** May 2, 2026

---

## Form Fields

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Full Name | text | ✅ | |
| 2 | Company Name | text | ✅ | |
| 3 | Email | email | ✅ | |
| 4 | Phone | tel | ✅ | |
| 5 | Support Category | select | ✅ | Hardware/ERP/Warranty/RMA/Other |
| 6 | Product/Brand | select + search | ✅ | |
| 7 | Order/Invoice Number | text | ❌ | If applicable |
| 8 | Issue Severity | select | ✅ | Critical/High/Medium/Low |
| 9 | Subject | text | ✅ | Min 5 chars |
| 10 | Issue Description | textarea | ✅ | Min 20 chars, max 5000 |
| 11 | Attachment | file | ❌ | Max 10MB (JPG, PNG, PDF) |

## Support SLA by Severity

| Severity | Response Time |
|---|---|
| Critical | ≤ 1 hour (business hours) |
| High | ≤ 4 hours |
| Medium | ≤ 8 hours |
| Low | ≤ 24 hours |

---

*© 2026 Simal Technologies Middle East LLC. Support Form Spec v1.0.*
