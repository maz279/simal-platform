# 04 Newsletter Signup Form

> **Source:** Simal Technologies Marketing — May 2026
> **Owner:** Marketing Manager / Web Developer
> **Version:** 1.0

---

## 1. Overview

The Newsletter Signup form captures email subscribers for Simal Technologies' marketing communications. It implements a GDPR-compliant double opt-in flow via Mailchimp and supports 4 language preferences.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `newsletter-form` |
| **Placement** | Website footer (all pages), blog sidebar, dedicated landing page |
| **Method** | POST (AJAX) |
| **API Endpoint** | `/api/forms/newsletter` |
| **ESP** | Mailchimp (via API v3) |
| **Audience** | "Website Subscribers" (audience ID: configurable) |
| **Opt-In** | Double opt-in (required) |
| **reCAPTCHA** | v3 (threshold: 0.5) |

---

## 2. Field Definitions

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 1 | **Email Address** | email | Yes | RFC 5322; MX record check |
| 2 | **First Name** | text | No | 2–50 chars |
| 3 | **Language Preference** | select | Yes | English / Arabic / French / Russian |
| 4 | **Topics of Interest** | checkbox (multi) | No | IT Hardware / UniERP / Industry News / Events / All |
| 5 | **Consent** | checkbox | Yes | Must be explicitly checked; link to Privacy Policy |

---

## 3. Double Opt-In Flow

```
User submits email
    │
    ▼
Mailchimp sends confirmation email ("Confirm your subscription")
    │
    ▼
User clicks "Confirm" link in email
    │
    ▼
Mailchimp marks subscriber as "subscribed"
    │
    ▼
Welcome email sent (see 18_Email_Templates/08_Newsletter_Welcome.md)
```

### 3.1 Mailchimp API Call

```javascript
// POST to Mailchimp Marketing API v3
const mailchimpPayload = {
  email_address: email,
  status: 'pending', // triggers double opt-in
  merge_fields: {
    FNAME: firstName || '',
    LANGUAGE: language,
    TOPICS: topics.join(', ')
  },
  tags: ['website-signup']
};

await fetch(
  `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
  {
    method: 'POST',
    headers: {
      'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mailchimpPayload)
  }
);
```

---

## 4. HTML Implementation (Footer Embed)

```html
<form id="newsletter-form" class="newsletter-inline" action="/api/forms/newsletter" method="POST">
  <h4>Stay Updated</h4>
  <p>Get the latest on new products, ERP insights, and industry news.</p>
  
  <div class="newsletter-fields">
    <div class="form-group">
      <label for="nl-email" class="sr-only">Email Address</label>
      <input type="email" id="nl-email" name="email" required
             placeholder="you@company.com" autocomplete="email">
    </div>
    
    <div class="form-group">
      <label for="nl-name" class="sr-only">First Name</label>
      <input type="text" id="nl-name" name="first_name"
             placeholder="First name (optional)" autocomplete="given-name">
    </div>
    
    <div class="form-group">
      <select name="language" required>
        <option value="">Language</option>
        <option value="en">English</option>
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
        <option value="ru">Русский</option>
      </select>
    </div>
    
    <button type="submit" class="btn btn-primary">Subscribe</button>
  </div>
  
  <div class="newsletter-consent">
    <label>
      <input type="checkbox" name="consent" required>
      I agree to receive marketing emails and accept the 
      <a href="/legal/privacy-policy/" target="_blank">Privacy Policy</a>.
    </label>
  </div>
</form>
```

---

## 5. Success & Error States

### 5.1 Success (Double Opt-In Pending)

```
✓  Almost there! Check your inbox.

We've sent a confirmation email to {email}.
Please click the link to complete your subscription.

Didn't receive it? Check your spam folder or
[Resend confirmation email].
```

### 5.2 Error States

| Error | Message |
|-------|---------|
| Already subscribed | "You're already on our list! [Update preferences]" |
| Invalid email | "Please enter a valid email address." |
| Mailchimp API error | "Something went wrong. Please try again later." |

### 5.3 Unsubscribe (Footer Link)

All newsletter emails include an unsubscribe link:
```
To unsubscribe, click here: [*|UNSUB|*]
Or update your preferences: [*|UPDATE_PROFILE|*]
```

---

## 6. Analytics

| Event | GA4 Event | Parameters |
|-------|----------|------------|
| Form View | `form_view` | `form_name: newsletter` |
| Form Submit | `form_submit` | `form_name: newsletter` |
| Signup Confirmed | `sign_up` | `method: email, source: website_footer` |

---

> **Next File:** [05_Partner_Reseller_Application_Form.md](./05_Partner_Reseller_Application_Form.md)

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — Newsletter Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
