# 01 Contact Form

> **Page:** Contact Us
> **Form ID:** `contact-form`
> **Handler:** `/api/forms/contact` → HubSpot CRM + email notification
> **Last Updated:** May 2, 2026

---

## Form Fields

| # | Field | Type | Required | Validation |
|---|---|---|---|---|
| 1 | Full Name | text | ✅ | Min 3 chars |
| 2 | Company Name | text | ✅ | Min 2 chars |
| 3 | Email | email | ✅ | RFC 5322 |
| 4 | Phone | tel | ✅ | Intl format, min 7 digits |
| 5 | Country | select | ✅ | Country list |
| 6 | Inquiry Category | select | ✅ | Sales/Support/Partnership/ERP/General/Media |
| 7 | Subject | text | ✅ | Min 5 chars, max 200 |
| 8 | Message | textarea | ✅ | Min 20 chars, max 5000 |
| 9 | How Did You Hear About Us? | select | ❌ | Options list |
| 10 | Consent — Privacy Policy | checkbox | ✅ | Must be checked |

## Anti-Spam

- Honeypot hidden field
- reCAPTCHA v3 (invisible)
- Rate limit: 3 submissions per IP per 10 minutes

## Success Message

"Thank you for contacting Simal Technologies. Your inquiry has been received (Ref: INQ-{ref}). We'll respond within 4-8 business hours."

## CRM Integration

- Creates/updates Contact in HubSpot
- Creates Ticket in HubSpot Service Hub
- Auto-Reply: Template 10 (General Inquiry Auto-Reply)

---

*© 2026 Simal Technologies Middle East LLC. Contact Form Spec v1.0.*
