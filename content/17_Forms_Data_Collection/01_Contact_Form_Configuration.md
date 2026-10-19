# 01 Contact Form Configuration

> **Source:** Simal Technologies Web Development — May 2026
> **Owner:** Web Developer / Marketing Team
> **Version:** 1.0

---

## 1. Overview

The Contact Form is the primary inbound lead capture mechanism on the Simal Technologies website. It appears on the `/contact/` page and as a modal accessible from the global header. Every submission creates a HubSpot contact and sends notification emails to the relevant department.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `contact-form-main` |
| **Page(s)** | `/contact/` |
| **Method** | POST (AJAX) |
| **API Endpoint** | `/api/forms/contact` |
| **reCAPTCHA** | v3 (score threshold: 0.5) |
| **Honeypot** | Yes (hidden field: `website_url`) |
| **Rate Limit** | 3 submissions per IP per 5 minutes |
| **CRM** | HubSpot — Create Contact + Deal |

---

## 2. Field Definitions

| # | Field | Type | Required | Validation | Placeholder / Helper |
|---|-------|------|----------|------------|---------------------|
| 1 | **Full Name** | text | Yes | 2–100 chars; letters, spaces, hyphens, apostrophes | "Your full name" |
| 2 | **Company Name** | text | No | 2–150 chars | "Your company (optional)" |
| 3 | **Email Address** | email | Yes | RFC 5322 compliant; MX record check | "you@company.com" |
| 4 | **Phone Number** | tel | Yes | International format; digits, +, spaces, dashes, parentheses | "+971 50 123 4567" |
| 5 | **Country** | select | Yes | From country list (250+ options); default: "United Arab Emirates" | "Select your country" |
| 6 | **Inquiry Category** | select | Yes | Options: General Inquiry / IT Hardware / UniERP Software / Partnership / Support / Other | "What is this about?" |
| 7 | **Subject** | text | Yes | 3–200 chars | "Brief subject of your inquiry" |
| 8 | **Message** | textarea | Yes | 10–2000 chars; no HTML tags | "How can we help you? Please provide details..." |
| 9 | **Preferred Contact Method** | radio | No | Email / Phone / WhatsApp | "How should we reach you?" |
| 10 | **How Did You Hear About Us?** | select | No | Search Engine / Social Media / Trade Show / Referral / Advertisement / Other | "How did you find us?" |

---

## 3. Validation Rules

### 3.1 Client-Side Validation (JavaScript)

```javascript
const contactFormRules = {
  full_name: {
    required: true,
    minlength: 2,
    maxlength: 100,
    pattern: /^[a-zA-Z\s\-\'\.\u0600-\u06FF]+$/, // Latin + Arabic
    messages: {
      required: 'Please enter your full name.',
      minlength: 'Name must be at least 2 characters.',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes.'
    }
  },
  email: {
    required: true,
    email: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      required: 'Please enter your email address.',
      email: 'Please enter a valid email address (e.g., you@company.com).',
      pattern: 'Please enter a valid email address.'
    }
  },
  phone: {
    required: true,
    pattern: /^[\+\d][\d\s\-\(\)]{6,20}$/,
    messages: {
      required: 'Please enter your phone number.',
      pattern: 'Please enter a valid phone number with country code (e.g., +971 50 123 4567).'
    }
  },
  country: {
    required: true,
    messages: {
      required: 'Please select your country.'
    }
  },
  category: {
    required: true,
    messages: {
      required: 'Please select an inquiry category.'
    }
  },
  subject: {
    required: true,
    minlength: 3,
    maxlength: 200,
    messages: {
      required: 'Please enter a subject.',
      minlength: 'Subject must be at least 3 characters.',
      maxlength: 'Subject must not exceed 200 characters.'
    }
  },
  message: {
    required: true,
    minlength: 10,
    maxlength: 2000,
    messages: {
      required: 'Please enter your message.',
      minlength: 'Message must be at least 10 characters.',
      maxlength: 'Message must not exceed 2,000 characters.'
    }
  }
};
```

### 3.2 Server-Side Validation

All client-side validations are repeated server-side. Additionally:

- **Email:** Verify MX record exists for domain
- **Phone:** Validate against libphonenumber-js
- **Message:** Strip all HTML tags; sanitize with DOMPurify
- **reCAPTCHA v3:** Verify token server-side with Google; reject if score < 0.5
- **Honeypot:** If `website_url` field is filled, silently discard (bot)
- **Rate Limit:** Check Redis key `ratelimit:contact:{IP}` ; reject if > 3 in 5 min

---

## 4. CRM Integration (HubSpot)

### 4.1 HubSpot Field Mapping

| Form Field | HubSpot Property |
|------------|-----------------|
| Full Name | `firstname` + `lastname` (split on last space) |
| Company Name | `company` |
| Email Address | `email` |
| Phone Number | `phone` |
| Country | `country` |
| Inquiry Category | `inquiry_category` (custom) |
| Subject | `hs_email_subject` (for email thread) |
| Message | `message` (custom) + create Note |
| Preferred Contact | `preferred_contact_method` (custom) |
| How Did You Hear | `lead_source_detail` |

### 4.2 HubSpot API Call

```javascript
// POST to HubSpot Contacts API v3
const hubspotPayload = {
  properties: {
    firstname: firstName,
    lastname: lastName,
    email: email,
    phone: phone,
    company: companyName,
    country: country,
    inquiry_category: category,
    message: message,
    preferred_contact_method: preferredContact,
    lead_source: 'Website Contact Form',
    lead_source_detail: howDidYouHear,
    lifecyclestage: 'lead'
  }
};

await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(hubspotPayload)
});
```

### 4.3 Routing Rules

| Category | Route To | HubSpot Owner |
|----------|----------|---------------|
| **General Inquiry** | info@simalme.com | Marketing Manager |
| **IT Hardware** | sales-distribution@simalme.com | IT Distribution Sales |
| **UniERP Software** | erp-demo@simalme.com | UniERP Sales Consultant |
| **Partnership** | partners@simalme.com | Business Development Director |
| **Support** | support@simalme.com | Technical Support |

---

## 5. Email Notifications

### 5.1 Internal Notification Email

**To:** Routed based on category (see 4.3)
**Subject:** `New Contact Form Inquiry: {subject} — {category} — {full_name}`
**Body:** Full field data in formatted layout

### 5.2 Auto-Reply to Submitter

See: [18_Email_Templates/10_General_Inquiry_Auto_Reply.md](../18_Email_Templates/10_General_Inquiry_Auto_Reply.md)

---

## 6. Success & Error States

### 6.1 Success Message

```
┌─────────────────────────────────────────────┐
│  ✓  Thank You! Your inquiry has been sent.  │
│                                              │
│  We've received your message and will        │
│  respond within 2–4 business hours.          │
│                                              │
│  Reference: INQ-20260502-0042                │
│                                              │
│  A confirmation has been sent to             │
│  you@company.com.                            │
│                                              │
│  In the meantime:                            │
│  • Browse our product catalog                │
│  • Explore UniERP solutions                  │
│  • Call us: +971 4 393 0507                  │
└─────────────────────────────────────────────┘
```

### 6.2 Error Messages

| Error | Message |
|-------|---------|
| **Generic Error** | "Something went wrong. Please try again or email us at info@simalme.com." |
| **reCAPTCHA Failed** | "Security verification failed. Please refresh and try again." |
| **Rate Limited** | "Too many submissions. Please wait 5 minutes before trying again." |
| **Network Error** | "Unable to connect. Please check your internet and try again." |

---

## 7. Multi-Language Support

| Language | Labels File |
|----------|------------|
| **English** | `/locales/en/contact-form.json` |
| **Arabic** | `/locales/ar/contact-form.json` (RTL: dir="rtl") |
| **French** | `/locales/fr/contact-form.json` |
| **Russian** | `/locales/ru/contact-form.json` |

### 7.1 Arabic (RTL) Considerations

- Form labels right-aligned
- Input text flows RTL
- Phone number field remains LTR (international format)
- Error messages translated; refer to [08_Form_Validation_Error_Content.md](./08_Form_Validation_Error_Content.md)

---

## 8. HTML Implementation

```html
<form id="contact-form-main" action="/api/forms/contact" method="POST" novalidate>
  <!-- Honeypot -->
  <div style="position:absolute;left:-9999px;" aria-hidden="true">
    <label for="website_url">Website</label>
    <input type="text" id="website_url" name="website_url" tabindex="-1" autocomplete="off">
  </div>
  
  <!-- CSRF Token -->
  <input type="hidden" name="csrf_token" value="{{csrf_token}}">
  
  <!-- reCAPTCHA v3 -->
  <input type="hidden" name="g-recaptcha-response" id="recaptcha-token">
  
  <div class="form-row">
    <div class="form-group">
      <label for="full_name">Full Name <span class="required">*</span></label>
      <input type="text" id="full_name" name="full_name" required 
             minlength="2" maxlength="100" autocomplete="name"
             placeholder="Your full name">
      <span class="error-message" role="alert"></span>
    </div>
    
    <div class="form-group">
      <label for="company">Company Name</label>
      <input type="text" id="company" name="company" maxlength="150" 
             autocomplete="organization"
             placeholder="Your company (optional)">
    </div>
  </div>
  
  <!-- ... additional fields ... -->
  
  <div class="form-group">
    <label for="message">Message <span class="required">*</span></label>
    <textarea id="message" name="message" required 
              minlength="10" maxlength="2000" rows="5"
              placeholder="How can we help you? Please provide details..."></textarea>
    <span class="char-count"><span id="message-chars">0</span>/2000</span>
    <span class="error-message" role="alert"></span>
  </div>
  
  <div class="form-consent">
    <label>
      <input type="checkbox" name="consent" required>
      By submitting this form, you agree to our 
      <a href="/legal/privacy-policy/" target="_blank">Privacy Policy</a> 
      and consent to Simal Technologies storing and processing your data.
    </label>
  </div>
  
  <button type="submit" class="btn btn-primary btn-lg" id="contact-submit">
    <span class="btn-text">Send Message</span>
    <span class="btn-loading" hidden>
      <svg class="spinner">...</svg> Sending...
    </span>
  </button>
</form>
```

---

## 9. Analytics Tracking

| Event | GA4 Event Name | Parameters |
|-------|---------------|------------|
| **Form View** | `form_view` | `form_name: contact` |
| **Form Start** | `form_start` | `form_name: contact` |
| **Field Error** | `form_error` | `form_name: contact, field: {name}, error: {type}` |
| **Form Submit** | `form_submit` | `form_name: contact, category: {value}` |
| **Form Success** | `generate_lead` | `form_name: contact, value: 10` |

---

> **Next File:** [02_RFQ_Request_Quote_Form.md](./02_RFQ_Request_Quote_Form.md) — Request for Quote form configuration.

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/) — Form configuration and data collection specifications.

---

*Simal Technologies Middle East LLC — Contact Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
