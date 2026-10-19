# 02 B2B Registration — Account Approved

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `b2b-registration-approved`
> **Trigger:** Admin approves B2B account in admin panel
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | 🎉 Your B2B account has been approved — Welcome to Simal Technologies |
| **Subject Line (AR)** | 🎉 تمت الموافقة على حسابك التجاري — مرحباً بك في سيمال تكنولوجيز |
| **Subject Line (FR)** | 🎉 Votre compte B2B a été approuvé — Bienvenue chez Simal Technologies |
| **Subject Line (RU)** | 🎉 Ваш B2B аккаунт одобрен — Добро пожаловать в Simal Technologies |
| **Preheader Text** | Login now to access wholesale pricing, place orders, and request quotes. |
| **From Name** | Simal Technologies Middle East |
| **From Email** | noreply@simalme.com |
| **Reply-To** | {Account Manager Email} |
| **Priority** | High — Contains login credentials |

---

## Email Body (English)

```
┌────────────────────────────────────────────────────────────┐
│  [SIMAL TECHNOLOGIES LOGO — Centered]                     │
│                                                            │
│  🎉 Welcome to Simal Technologies, {Company Name}!       │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Your B2B account has been APPROVED!                      │
│                                                            │
│  You now have access to:                                  │
│  ✅ Wholesale pricing on 22+ global IT brands             │
│  ✅ Online ordering & order tracking                      │
│  ✅ Quote requests with 2-4 hour response                 │
│  ✅ Invoice management & credit account                   │
│  ✅ Priority support & dedicated account manager          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  YOUR ACCOUNT DETAILS                                │ │
│  │                                                      │ │
│  │  Account ID:   ACC-{NNNNN}                           │ │
│  │  Company:      {Company Name}                        │ │
│  │  Login Email:  {Email Address}                       │ │
│  │  Credit Limit: {Credit Limit} AED                     │ │
│  │  Payment Terms: {Net 30 / Net 60 / Advance}          │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  YOUR DEDICATED ACCOUNT MANAGER                      │ │
│  │                                                      │ │
│  │  {Account Manager Name}                              │ │
│  │  {Account Manager Title}                             │ │
│  │  📧 {Account Manager Email}                          │ │
│  │  📞 {Account Manager Phone}                          │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [LOGIN TO YOUR B2B PORTAL]                               │
│                                                            │
│  (Or go to: https://b2b.simalme.com/login)                │
│                                                            │
│  Use the password you set during registration.            │
│  [Forgot your password? →]                                │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Getting Started Guide:                                   │
│                                                            │
│  1. 🏠 Explore Your Dashboard                             │
│     View quick stats, recent activity, and announcements  │
│                                                            │
│  2. 🛒 Browse & Order Products                            │
│     Search 76+ products across 22+ brands with wholesale  │
│     pricing visible after login                           │
│                                                            │
│  3. 📋 Request a Quote                                    │
│     For bulk orders, custom configurations, or project    │
│     pricing — get a response within 2-4 business hours    │
│                                                            │
│  4. 📦 Place Your First Order                             │
│     Add products to cart, select shipping, and checkout   │
│                                                            │
│  5. 💳 Manage Invoices & Payments                         │
│     View statements, download invoices, and track your    │
│     credit account                                        │
│                                                            │
│  Need help getting started?                               │
│  📞 Call your account manager or +971 4 393 0507         │
│  📧 Reply to this email                                  │
│  📚 Visit our B2B Help Center                            │
│                                                            │
│  [VIEW GETTING STARTED GUIDE]                              │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Simal Technologies Middle East LLC                        │
│  Office 201, Dar Al Riffa Building, Bur Dubai, Dubai, UAE │
│  +971 4 393 0507 | info@simalme.com | simalme.com         │
│                                                            │
│  This email contains your account credentials. If you     │
│  didn't register, contact us immediately.                 │
└────────────────────────────────────────────────────────────┘
```

---

## Plain Text Version

```
🎉 Welcome to Simal Technologies, {Company Name}!

Your B2B account has been APPROVED! You now have access to wholesale pricing on 22+ global IT brands, online ordering, quote requests, invoice management, and priority support.

YOUR ACCOUNT DETAILS:
- Account ID: ACC-{NNNNN}
- Company: {Company Name}
- Login Email: {Email Address}
- Credit Limit: {Credit Limit} AED
- Payment Terms: {Payment Terms}

YOUR DEDICATED ACCOUNT MANAGER:
{Account Manager Name}
{Account Manager Title}
📧 {Account Manager Email}
📞 {Account Manager Phone}

LOGIN TO YOUR B2B PORTAL:
https://b2b.simalme.com/login

Use the password you set during registration.
Forgot password? https://b2b.simalme.com/forgot-password

GETTING STARTED:
1. Explore Your Dashboard
2. Browse & Order Products (wholesale pricing visible after login)
3. Request a Quote for bulk orders
4. Place Your First Order
5. Manage Invoices & Payments

Need help? Call your account manager or +971 4 393 0507 or visit our B2B Help Center.

Simal Technologies Middle East LLC
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Admin clicks "Approve" on pending B2B registration in admin panel |
| **Delay** | Immediate upon approval |
| **CC** | Account Manager (for awareness) |

---

## Security Notes

- ⚠️ **Never include plain-text passwords in email.** User sets password during registration. This email only contains login link.
- Login link should be valid for 7 days and expire after first use.
- If user account was created by admin (no password set), include a "Set Your Password" link instead.

---

*Simal Technologies — B2B Account Approved Template v1.0.*
