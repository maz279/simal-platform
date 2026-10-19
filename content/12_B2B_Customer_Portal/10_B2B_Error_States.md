# B2B Portal Error & Status States

> **Source:** VENDOR | **Canonical URL:** Various (error pages) | **OG Image:** /assets/images/og/b2b-error-og.jpg
> **Meta Title:** Account Status & Error Information | Simal Technologies B2B Portal
> **Meta Description:** Error and status pages for the Simal Technologies B2B customer portal. Session expired, access denied, account pending, suspended accounts, page not found.
> **Schema:** WebPage (ErrorPage)

---

## B2B Portal Error & Status States

This document defines all non-standard states and error pages that B2B portal users may encounter. Each state includes the visual layout, user message, and recommended user actions.

---

## 1. Session Expired

**URL:** `/b2b/*` (any authenticated B2B page after session timeout)

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         ⏳ Session Expired              │
│                                         │
│  Your session has timed out due to      │
│  inactivity. For security, you have     │
│  been automatically logged out.         │
│                                         │
│        [Log In Again]                   │
│                                         │
│  Your session expired at: {Timestamp}   │
│  Session duration: 2 hours inactivity   │
│                                         │
└─────────────────────────────────────────┘
```

**Trigger:** User's auth token expires or 2-hour inactivity timeout reached.

**User Action:** Click "Log In Again" → redirects to `/b2b/login` with `?redirect={original_url}` param.

**Prevention:** 5-minute warning modal before expiration with "Continue Session" button.

---

## 2. Access Denied (Insufficient Permissions)

**URL:** `/b2b/*` (any B2B page where user lacks required role)

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         🔒 Access Denied               │
│                                         │
│  You do not have permission to access   │
│  this resource.                         │
│                                         │
│  This may be because:                   │
│  • Your account role limits access      │
│  • This feature requires admin approval │
│  • Your account has restrictions        │
│                                         │
│  [Go to Dashboard]  [Contact Support]   │
│                                         │
└─────────────────────────────────────────┘
```

**Trigger:** User attempts to access a page/feature their role doesn't permit (e.g., a secondary contact trying to access billing settings).

**Roles:** Primary Contact (full access), Secondary Contact (may have limited access), Read-Only User (view only).

---

## 3. Account Pending Approval

**URL:** `/b2b/login` → after successful login with "Pending Review" status

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         📋 Account Under Review          │
│                                         │
│  Thank you for registering! Your        │
│  account is currently under review.      │
│                                         │
│  Company: {Company Name}                │
│  Submitted: {Registration Date}         │
│                                         │
│  What's happening:                      │
│  Our team is verifying your trade       │
│  license and business details.          │
│                                         │
│  Typical review time: 1-2 business days │
│                                         │
│  You will receive an email when your    │
│  account is approved.                   │
│                                         │
│  Need it faster? Contact us:            │
│  📧 info@simalme.com                    │
│  📞 +971 4 393 0507                     │
│                                         │
│           [Back to Home]                │
│                                         │
└─────────────────────────────────────────┘
```

**Trigger:** User logs in but account has `status: pending_review`.

**Resolution:** Admin approval in backend → status changes to `active` → user notified via email → can now access dashboard.

---

## 4. Account Suspended

**URL:** `/b2b/login` → after successful login with "Suspended" status

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         ⛔ Account Suspended             │
│                                         │
│  Your B2B account has been suspended.   │
│                                         │
│  Company: {Company Name}                │
│  Status: Suspended                      │
│                                         │
│  Possible reasons:                      │
│  • Payment overdue beyond grace period  │
│  • Account under review                 │
│  • Terms of service violation           │
│                                         │
│  To resolve this, please contact our    │
│  B2B support team:                      │
│  📧 info@simalme.com                    │
│  📞 +971 4 393 0507                     │
│                                         │
│  Reference your company name in all     │
│  communications.                        │
│                                         │
│           [Back to Home]                │
│                                         │
└─────────────────────────────────────────┘
```

**Trigger:** Admin sets account status to `suspended`.

**Common Reasons for Suspension:**

| Reason | Description |
|--------|------------|
| **Payment Overdue** | Invoices past due beyond allowed grace period |
| **License Expired** | Trade license has expired — needs renewal upload |
| **Account Review** | Suspicious activity detected — under investigation |
| **TOS Violation** | Breach of B2B terms and conditions |
| **Customer Request** | Customer explicitly requested account freeze |

---

## 5. Page Not Found (404)

**URL:** Any non-existent B2B page

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│              🔍 404                     │
│         Page Not Found                  │
│                                         │
│  The page you're looking for doesn't    │
│  exist or has been moved.               │
│                                         │
│  [Go to Dashboard]  [Contact Support]   │
│                                         │
│  If you clicked a link within the       │
│  portal and arrived here, please        │
│  report this to our support team.       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Server Error (500)

**URL:** Any B2B page where server error occurs

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│          ⚠️ Something Went Wrong        │
│                                         │
│  We're experiencing a technical issue.  │
│  Our team has been notified.            │
│                                         │
│  Please try again in a few minutes.     │
│                                         │
│  [Try Again]  [Go to Dashboard]         │
│                                         │
│  If the problem persists, contact       │
│  support: info@simalme.com              │
│                                         │
│  Error Reference: {Error ID}            │
│                                         │
└─────────────────────────────────────────┘
```

**Error ID:** Auto-generated unique reference for debugging. Include when contacting support.

---

## 7. Maintenance Mode

**URL:** All B2B pages during scheduled maintenance

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│          🛠️ Under Maintenance           │
│                                         │
│  The B2B Portal is temporarily          │
│  unavailable for scheduled maintenance. │
│                                         │
│  Expected downtime:                     │
│  {Start Time} — {End Time} (GST)        │
│                                         │
│  During this time, you can still:       │
│  • Contact us via email:                │
│    info@simalme.com                     │
│  • Call: +971 4 393 0507                │
│  • WhatsApp: +971 54 308 8655           │
│                                         │
│  We apologize for the inconvenience.    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. Rate Limit Exceeded

**URL:** `/b2b/login` or any form submission endpoint

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│       ⏱️ Too Many Requests              │
│                                         │
│  You have exceeded the allowed number   │
│  of requests. Please wait {X} minutes   │
│  before trying again.                   │
│                                         │
│  This is a security measure to protect  │
│  your account.                          │
│                                         │
│  If you believe this is an error,       │
│  contact support.                       │
│                                         │
└─────────────────────────────────────────┘
```

**Triggers:**
- Login attempts: 5 failures → 30-minute lockout
- Form submissions: 10 per minute per IP
- API requests: as per API rate limits

---

## 9. Browser Not Supported

**URL:** All B2B pages (detected on load)

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│       🌐 Browser Not Supported          │
│                                         │
│  Your browser ({Browser} {Version})     │
│  may not fully support all features     │
│  of the B2B Portal.                     │
│                                         │
│  For the best experience, please use:   │
│  • Google Chrome (latest 2 versions)    │
│  • Mozilla Firefox (latest 2 versions)  │
│  • Microsoft Edge (latest 2 versions)   │
│  • Apple Safari (latest 2 versions)     │
│                                         │
│  [Continue Anyway]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Trigger:** User accesses portal with Internet Explorer or very old browser versions.

---

## Consistency Guidelines

| Guideline | Description |
|-----------|------------|
| **Brand Consistency** | All error pages use Simal Technologies brand colors, logo, and typography |
| **Clear Messaging** | Plain language explaining what happened and why |
| **Actionable** | Every error state provides a path forward — at minimum, a link back to dashboard or home |
| **Support Contact** | Critical errors always display support contact information |
| **No Dead Ends** | No error page should leave the user without an option to proceed |
| **Responsive** | All error pages function on mobile, tablet, and desktop |

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
