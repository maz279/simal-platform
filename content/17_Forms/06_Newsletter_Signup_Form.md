# 06 Newsletter Signup Form

> **Location:** Footer (global) + dedicated landing page
> **Form ID:** `newsletter-form`
> **Handler:** Mailchimp API + double opt-in
> **Last Updated:** May 2, 2026

---

## Form Fields

| # | Field | Type | Required |
|---|---|---|---|
| 1 | First Name | text | ✅ |
| 2 | Email | email | ✅ |
| 3 | Interest Topics | multi-select (checkbox) | ❌ |

## Interest Topics Options

- IT Hardware & Components
- Surveillance & Security
- UniERP & Business Software
- Industry News & Events
- Special Offers & Promotions

## Double Opt-In Flow

1. Form submitted → "Check your email to confirm" message
2. Confirmation email sent via Mailchimp
3. User clicks confirm → Subscribed
4. Welcome email: Template 08 (Newsletter Welcome)

## Anti-Spam

- reCAPTCHA v3
- Rate limit: 3 signups per IP per hour

---

*© 2026 Simal Technologies Middle East LLC. Newsletter Form Spec v1.0.*
