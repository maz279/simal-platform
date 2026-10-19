# B2B Portal Login

> **Source:** VENDOR | **Canonical URL:** /b2b/login | **OG Image:** /assets/images/og/b2b-login-og.jpg
> **Meta Title:** B2B Customer Portal Login — Access Wholesale Pricing | Simal Technologies
> **Meta Description:** Login to the Simal Technologies B2B customer portal. Access wholesale IT hardware pricing, track orders, manage quotes & invoices. Secure login with 2FA. Registered business customers only.
> **Schema:** WebApplication (LoginAction)

---

## B2B Customer Portal Login

Access your business account to view wholesale pricing, track orders, manage quotes, download invoices, and more.

---

## Login Form

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | **Email Address** | Email | Yes | Your registered business email |
| 2 | **Password** | Password | Yes | Your account password |
| 3 | **Remember Me** | Checkbox | No | Keep me signed in for 30 days (do not use on shared devices) |
| 4 | **Login** | Button | — | Authenticate and redirect to B2B Dashboard |

### Additional Links

| Link | Destination |
|------|-----------|
| **Forgot Password?** | `/b2b/forgot-password` — Reset via email link |
| **Need an Account?** | `/b2b/register` — B2B Registration page |
| **Account Pending Approval?** | info@simalme.com — Contact support |

---

## Two-Factor Authentication (2FA)

After entering correct credentials, users with 2FA enabled will be prompted:

| # | Field | Type | Description |
|---|-------|------|------------|
| 1 | **Verification Code** | Text (6 digits) | Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, Microsoft Authenticator) or received via email |
| 2 | **Trust This Device** | Checkbox | Skip 2FA on this device for 30 days |
| 3 | **Verify & Login** | Button | Complete authentication |

### 2FA Recovery

If you lose access to your 2FA device:
- Use one of your backup recovery codes (provided when 2FA was set up)
- Contact support at info@simalme.com for manual 2FA reset (requires identity verification)

---

## Login States

### Successful Login

- Redirect to B2B Dashboard (`/b2b/dashboard`)
- Session token created (JWT or session cookie)
- Last login timestamp updated

### Failed Login — Invalid Credentials

| Attempt | Behavior |
|---------|---------|
| 1-3 | Display: "Invalid email or password. Please try again." |
| 4th | Display: "Too many failed attempts. Please wait 60 seconds before trying again." |
| 5th+ | Display: "Account temporarily locked for 30 minutes due to multiple failed login attempts." |

### Failed Login — Account Not Active

| Status | Message |
|--------|--------|
| **Pending Review** | "Your account is still under review. You will receive an email when approved. Contact info@simalme.com for status updates." |
| **Rejected** | "Your account registration was not approved. Please contact info@simalme.com for more information." |
| **Suspended** | "Your account has been suspended. Please contact info@simalme.com." |
| **Deactivated** | "This account has been deactivated. To reactivate, contact info@simalme.com." |

---

## Forgot Password Flow

```
User clicks "Forgot Password?"
    → Enter registered email address
    → Submit
    → System checks: email exists, account active
    → Always display: "If an account with this email exists, a password reset link has been sent."
    → Email sent with reset link (valid for 60 minutes)
    → User clicks link → Enter new password + confirm
    → Success → Redirected to login with confirmation message
```

### Password Reset Email

**Subject:** Password Reset Request — Simal Technologies B2B Portal

**Body:**
```
Dear {Contact Name},

We received a request to reset your password for the Simal Technologies B2B Portal.

Reset your password: {Reset Link}

This link expires in 60 minutes.

If you did not request a password reset, please ignore this email or contact our support team at info@simalme.com.

Best regards,
Simal Technologies B2B Portal
```

---

## Session Management

| Parameter | Value |
|-----------|-------|
| **Session Duration (without "Remember Me")** | 2 hours of inactivity |
| **Session Duration (with "Remember Me")** | 30 days |
| **Session Timeout Warning** | Displayed 5 minutes before expiry; option to extend |
| **Concurrent Sessions** | Allowed (multiple devices/browsers) |
| **Force Logout** | Available from Account Settings → "Sign out from all devices" |

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **HTTPS Only** | All authentication traffic over TLS 1.3 |
| **Password Hashing** | bcrypt with salt |
| **Brute Force Protection** | Rate limiting; account locking after repeated failures |
| **2FA** | TOTP-based (RFC 6238) |
| **Session Token** | Secure, HttpOnly, SameSite cookies; JWT with short expiry |
| **Login Notification** | Optional email alert when login occurs from new device/location |

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
