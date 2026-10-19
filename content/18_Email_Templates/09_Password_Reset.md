# 09 Password Reset

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `password-reset`
> **Trigger:** User clicks "Forgot Password" and submits email on B2B login page
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Reset your Simal Technologies B2B password |
| **Subject Line (AR)** | إعادة تعيين كلمة المرور لحساب سيمال تكنولوجيز |
| **Subject Line (FR)** | Réinitialisez votre mot de passe Simal Technologies |
| **Subject Line (RU)** | Сброс пароля Simal Technologies |
| **Preheader Text** | Password reset link expires in 1 hour. |
| **From Name** | Simal Technologies Security |
| **From Email** | noreply@simalme.com |
| **Reply-To** | support@simalme.com |

---

## Email Body (English)

```
┌────────────────────────────────────────────────────────────┐
│  [SIMAL TECHNOLOGIES LOGO — Centered]                     │
│                                                            │
│  Password Reset Request                                    │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  We received a request to reset the password for your     │
│  Simal Technologies B2B account.                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  Account: {Email Address}                            │ │
│  │  Requested from IP: {IP Address}                     │ │
│  │  Location: {City}, {Country}                         │ │
│  │  Time: {Date & Time} GST                             │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │           [RESET YOUR PASSWORD]                       │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Or copy this link:                                       │
│  https://b2b.simalme.com/reset-password?token={token}    │
│                                                            │
│  ⚠️ This link expires in 1 hour ({Expiry Time} GST).      │
│  If you need a new link, request another password reset.  │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  🔒 Didn't request this?                                  │
│                                                            │
│  If you didn't request a password reset, you can safely   │
│  ignore this email. Your password will not change.        │
│                                                            │
│  For security concerns, contact support immediately:      │
│  📧 support@simalme.com                                   │
│  📞 +971 4 393 0507                                       │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Security Tip: Never share your password or password      │
│  reset links with anyone. Simal Technologies will never   │
│  ask for your password via email or phone.                │
│                                                            │
│  Simal Technologies Middle East LLC                        │
│  simalme.com                                              │
└────────────────────────────────────────────────────────────┘
```

---

## Plain Text Version

```
Password Reset Request

We received a request to reset the password for your Simal Technologies B2B account.

Account: {Email Address}
Requested from IP: {IP Address}
Location: {City}, {Country}
Time: {Date & Time} GST

RESET YOUR PASSWORD:
https://b2b.simalme.com/reset-password?token={token}

⚠️ This link expires in 1 hour ({Expiry Time} GST).

Didn't request this? You can safely ignore this email. Your password will not change.

For security concerns: support@simalme.com | +971 4 393 0507

Security Tip: Never share your password or reset links with anyone.

Simal Technologies Middle East LLC
```

---

## Security Requirements

| Requirement | Implementation |
|---|---|
| **Token Expiry** | 60 minutes from request time |
| **Single Use** | Token invalidated after successful password change |
| **Rate Limiting** | Max 3 reset requests per email per hour |
| **IP Logging** | Request IP and approximate location logged (shown in email for user verification) |
| **No Account Enumeration** | Generic message whether account exists or not ("If an account exists, a reset link has been sent") |
| **HTTPS Only** | Reset link forces HTTPS |
| **Secure Token** | 256-bit cryptographically random token; stored as SHA-256 hash in DB |

---

*Simal Technologies — Password Reset Template v1.0. OWASP-compliant password reset flow.*
