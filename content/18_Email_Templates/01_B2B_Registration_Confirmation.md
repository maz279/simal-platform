# 01 B2B Registration Confirmation — Pending Approval

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `b2b-registration-confirmation`
> **Trigger:** Form submission on B2B Registration page
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Thank you for registering — Your B2B account is under review | Simal Technologies |
| **Subject Line (AR)** | ????? ??????? — ????? ??? ???????? | ????? ????????? |
| **Subject Line (FR)** | Merci pour votre inscription — Votre compte B2B est en cours d'examen | Simal Technologies |
| **Subject Line (RU)** | ??????? ?? ??????????? — ??? B2B ??????? ?? ???????????? | Simal Technologies |
| **Preheader Text** | We'll review your application within 24 business hours. |
| **From Name** | Simal Technologies Middle East |
| **From Email** | noreply@simalme.com |
| **Reply-To** | sales@simalme.com |
| **Template Engine** | Mailchimp / SendGrid dynamic templates |

---

## Email Body (English)

```
+------------------------------------------------------------+
¦  [SIMAL TECHNOLOGIES LOGO — Centered]                     ¦
¦                                                            ¦
¦  Thank You for Registering, {Company Name}!               ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  Your B2B account registration has been received and is   ¦
¦  now under review by our account verification team.       ¦
¦                                                            ¦
¦  +------------------------------------------------------+ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  APPLICATION SUMMARY                                 ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  Company:      {Company Name}                        ¦ ¦
¦  ¦  Trade License: {Trade License No.}                  ¦ ¦
¦  ¦  Contact:      {Full Name}                          ¦ ¦
¦  ¦  Email:        {Email Address}                       ¦ ¦
¦  ¦  Phone:        {Phone Number}                        ¦ ¦
¦  ¦  Country:      {Country}                             ¦ ¦
¦  ¦  Industry:     {Industry Type}                       ¦ ¦
¦  ¦  Reference ID: REG-{YYYYMMDD}-{NNNN}                 ¦ ¦
¦  ¦                                                      ¦ ¦
¦  +------------------------------------------------------+ ¦
¦                                                            ¦
¦  What Happens Next?                                       ¦
¦                                                            ¦
¦  +------+    +------+    +------+    +----------+       ¦
¦  ¦ STEP ¦ ? ¦ STEP ¦ ? ¦ STEP ¦ ? ¦   STEP   ¦       ¦
¦  ¦  1   ¦    ¦  2   ¦    ¦  3   ¦    ¦    4     ¦       ¦
¦  ¦Apply ¦    ¦Review¦    ¦ Verify¦   ¦ Account  ¦       ¦
¦  ¦  ?  ¦    ¦  ?  ¦    ¦  ?  ¦    ¦  Active  ¦       ¦
¦  +------+    +------+    +------+    +----------+       ¦
¦                                                            ¦
¦  1. ? Application Submitted — Complete!                  ¦
¦  2. ? Document Review — Our team reviews your trade      ¦
¦     license and business details (24 business hours)      ¦
¦  3. ? Verification — We may contact you for additional   ¦
¦     information if needed                                 ¦
¦  4. ?? Account Activated — You'll receive a welcome email¦
¦     with login credentials and getting started guide      ¦
¦                                                            ¦
¦  Review Timeline:                                         ¦
¦  • Most applications are reviewed within 24 business hours¦
¦  • Submitted Sunday-Thursday: Review within same/next day ¦
¦  • Submitted Friday-Saturday: Review begins Sunday        ¦
¦                                                            ¦
¦  Need to add information? Reply to this email or contact: ¦
¦  ?? sales@simalme.com                                     ¦
¦  ?? +971 4 393 0507                                       ¦
¦                                                            ¦
¦  While you wait:                                          ¦
¦  • Browse our product catalog                             ¦
¦  • Explore UniERP solutions                               ¦
¦  • Read our B2B buying guide                              ¦
¦                                                            ¦
¦  [BROWSE PRODUCT CATALOG]                                 ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  Simal Technologies Middle East LLC                        ¦
¦  Office 201, Dar Al Riffa Building, Bur Dubai, Dubai, UAE ¦
¦  +971 4 393 0507 | info@simalme.com | simalme.com         ¦
¦                                                            ¦
¦  [LinkedIn] [Twitter] [Facebook] [Instagram] [YouTube]    ¦
¦                                                            ¦
¦  You received this email because you registered for a     ¦
¦  B2B account at simalme.com.                              ¦
¦  [Unsubscribe from B2B notifications]                     ¦
+------------------------------------------------------------+
```

---

## Plain Text Version

```
Thank You for Registering, {Company Name}!

Your B2B account registration has been received and is now under review by our account verification team.

Application Summary:
- Company: {Company Name}
- Trade License: {Trade License No.}
- Contact: {Full Name}
- Email: {Email Address}
- Phone: {Phone Number}
- Country: {Country}
- Reference ID: REG-{YYYYMMDD}-{NNNN}

What Happens Next:
1. Complete! Application submitted
2. Document Review — Our team reviews your trade license and business details (within 24 business hours)
3. Verification — We may contact you for additional information
4. Account Activated — You'll receive a welcome email with login credentials

Most applications are reviewed within 24 business hours. Our business hours are Monday to Friday, 9:00 AM – 8:00 PM GST (UTC+4); Saturday 9:00 AM – 3:00 PM GST.

Need to add information? Reply to this email or contact sales@simalme.com or call +971 4 393 0507.

While you wait, browse our product catalog: https://simalme.com/products

Simal Technologies Middle East LLC
Office 201, Dar Al Riffa Building, Bur Dubai, Dubai, UAE
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Successful form submission on B2B Registration page |
| **Delay** | Immediate (within 60 seconds of submission) |
| **Suppression** | Do not send if email already exists in B2B accounts (active or pending) |
| **CC/BCC** | BCC: sales@simalme.com (for CRM tracking) |

---

## Multi-Language Routing

| Language Selected on Form | Template Variant |
|---|---|
| English | `b2b-registration-confirmation-en` (default) |
| Arabic | `b2b-registration-confirmation-ar` (RTL layout) |
| French | `b2b-registration-confirmation-fr` |
| Russian | `b2b-registration-confirmation-ru` |

---

## Tracking & Analytics

| Event | Description |
|---|---|
| `email_sent` | Email delivered successfully |
| `email_opened` | Recipient opened the email |
| `email_cta_clicked` | Recipient clicked "Browse Product Catalog" |
| `email_bounced` | Email could not be delivered |

---

*Simal Technologies — B2B Registration Confirmation Template v1.0. Stored in Mailchimp Transactional / SendGrid. Tested across Gmail, Outlook, Apple Mail, Yahoo.*
