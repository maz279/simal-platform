# 02 RFQ / Quote Request Form

> **Page:** Request a Quote (B2B)
> **Form ID:** `rfq-form`
> **Handler:** `/api/forms/rfq` → HubSpot Deal + email
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
| 6 | Product(s) Interested In | multi-select + search | ✅ |
| 7 | Quantity Per Product | number (dynamic) | ✅ |
| 8 | Target Budget (AED/USD) | select range | ❌ |
| 9 | Required Delivery Date | date | ❌ |
| 10 | Shipping Destination | text | ✅ |
| 11 | Additional Requirements | textarea | ❌ |
| 12 | How Did You Hear About Us? | select | ❌ |
| 13 | Consent | checkbox | ✅ |

## Dynamic Product Selection

- Searchable dropdown with autocomplete
- Products added to a list below with quantity fields
- Supports up to 20 product lines per RFQ

## CRM Integration

- Creates Deal in HubSpot (stage: "Quote Requested")
- Associates with existing or new Company/Contact
- Auto-Reply: Template 04 (RFQ Confirmation)
- Internal notification to sales@simalme.com

---

*© 2026 Simal Technologies Middle East LLC. RFQ Form Spec v1.0.*
