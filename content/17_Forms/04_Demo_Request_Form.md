# 04 Demo Request Form

> **Page:** UniERP Demo Request
> **Form ID:** `demo-request-form`
> **Handler:** `/api/forms/demo-request` → HubSpot + Calendly/Teams scheduling
> **Last Updated:** May 2, 2026

---

## Form Fields

| # | Field | Type | Required |
|---|---|---|---|
| 1 | Full Name | text | ✅ |
| 2 | Company Name | text | ✅ |
| 3 | Email | email | ✅ |
| 4 | Phone | tel | ✅ |
| 5 | Country | select | ✅ |
| 6 | Industry | select | ✅ |
| 7 | Company Size | select | ✅ |
| 8 | Modules of Interest | multi-select (checkbox) | ✅ |
| 9 | Current ERP System | text | ❌ |
| 10 | Preferred Date | date picker | ✅ |
| 11 | Preferred Time Slot | select (3 options) | ✅ |
| 12 | Preferred Language | radio (EN/AR/FR/RU) | ✅ |
| 13 | Additional Notes | textarea | ❌ |
| 14 | Consent | checkbox | ✅ |

## Auto-Scheduling

- Integration with Calendly or Microsoft Teams booking
- 45-60 minute slots shown based on ERP consultant availability
- Double-booking prevention
- Auto-Reply: Template 07 (Demo Request Confirmation) with .ics attachment

---

*© 2026 Simal Technologies Middle East LLC. Demo Request Form Spec v1.0.*
