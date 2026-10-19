# 10 General Inquiry Auto-Reply

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `general-inquiry-auto-reply`
> **Trigger:** Form submission on Contact Us / General Inquiry page
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Thank you for contacting Simal Technologies — Ref: INQ-{YYYYMMDD}-{NNNN} |
| **Subject Line (AR)** | ????? ??????? ?? ????? ????????? — ??????: INQ-{YYYYMMDD}-{NNNN} |
| **Subject Line (FR)** | Merci d'avoir contacté Simal Technologies — Réf: INQ-{YYYYMMDD}-{NNNN} |
| **Subject Line (RU)** | ??????? ?? ????????? ? Simal Technologies — ?: INQ-{YYYYMMDD}-{NNNN} |
| **Preheader Text** | We'll respond within 4 business hours. |
| **From Name** | Simal Technologies |
| **From Email** | info@simalme.com |
| **Reply-To** | info@simalme.com |

---

## Email Body (English)

```
+------------------------------------------------------------+
¦  [SIMAL TECHNOLOGIES LOGO — Centered]                     ¦
¦                                                            ¦
¦  Thank You for Contacting Us, {Full Name}!                ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  We've received your inquiry and will get back to you     ¦
¦  as soon as possible.                                     ¦
¦                                                            ¦
¦  +------------------------------------------------------+ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  YOUR INQUIRY REFERENCE                              ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  Reference:  INQ-{YYYYMMDD}-{NNNN}                   ¦ ¦
¦  ¦  Submitted:  {Date & Time} GST                       ¦ ¦
¦  ¦  Category:   {Inquiry Category}                      ¦ ¦
¦  ¦                                                      ¦ ¦
¦  +------------------------------------------------------+ ¦
¦                                                            ¦
¦  +------------------------------------------------------+ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  YOUR MESSAGE PREVIEW                                ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  {First 200 characters of inquiry message}...        ¦ ¦
¦  ¦                                                      ¦ ¦
¦  +------------------------------------------------------+ ¦
¦                                                            ¦
¦  ?? Expected Response Time:                               ¦
¦  • Sales Inquiries: 2–4 business hours                    ¦
¦  • Technical Support: 4 business hours                    ¦
¦  • General Inquiries: 4–8 business hours                  ¦
¦  • Partnership Inquiries: 24 business hours               ¦
¦                                                            ¦
¦  Our business hours:                                      ¦
¦  Monday – Friday, 9:00 AM – 8:00 PM GST (UTC+4); Saturday 9:00 AM – 3:00 PM GST         ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  While You Wait:                                          ¦
¦                                                            ¦
¦  • Browse our FAQ for instant answers                     ¦
¦  • Visit our Knowledge Base for product guides            ¦
¦  • Explore our product catalog                            ¦
¦                                                            ¦
¦  [BROWSE FAQ]  [KNOWLEDGE BASE]  [PRODUCT CATALOG]        ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  Need immediate assistance?                               ¦
¦  ?? Call us: +971 4 393 0507                              ¦
¦  (Mon-Fri, 9:00 AM – 8:00 PM GST; Sat, 9:00 AM – 3:00 PM GST)                         ¦
¦                                                            ¦
¦  Other ways to reach us:                                  ¦
¦  • WhatsApp: +971 XX XXX XXXX                             ¦
¦  • Live Chat: Available on simalme.com (business hours)   ¦
¦                                                            ¦
¦  Please reference INQ-{YYYYMMDD}-{NNNN} in any follow-up. ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  Simal Technologies Middle East LLC                        ¦
¦  Office 201, Dar Al Riffa Building, Bur Dubai, Dubai, UAE ¦
¦  +971 4 393 0507 | info@simalme.com | simalme.com         ¦
¦                                                            ¦
¦  [LinkedIn] [Twitter] [Facebook] [Instagram]              ¦
+------------------------------------------------------------+
```

---

## Plain Text Version

```
Thank You for Contacting Us, {Full Name}!

We've received your inquiry and will get back to you as soon as possible.

YOUR INQUIRY:
- Reference: INQ-{YYYYMMDD}-{NNNN}
- Submitted: {Date & Time} GST
- Category: {Inquiry Category}

YOUR MESSAGE:
{First 200 characters of message}...

Expected Response Time: 4–8 business hours (Mon-Fri, 9AM-8PM GST; Sat 9AM-3PM GST).

While you wait:
- FAQ: https://simalme.com/resources/faq
- Knowledge Base: https://simalme.com/resources/knowledge-base
- Product Catalog: https://simalme.com/products

Need immediate assistance? Call +971 4 393 0507.

Please reference INQ-{YYYYMMDD}-{NNNN} in any follow-up.

Simal Technologies Middle East LLC
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Successful form submission on any Contact/Inquiry page |
| **Delay** | Immediate (within 60 seconds) |
| **CC** | Forward inquiry to relevant department email based on category |

---

## Inquiry Category Routing

| Category | Forward To | Response SLA |
|---|---|---|
| Sales Inquiry | sales@simalme.com | 2–4 business hours |
| Technical Support | support@simalme.com | 4 business hours |
| Partnership | partners@simalme.com | 24 business hours |
| Careers/HR | careers@simalme.com | 48 business hours |
| General | info@simalme.com | 4–8 business hours |
| ERP/UniERP | erp@simalme.com | 2–4 business hours |
| Media/Press | info@simalme.com | 24 business hours |

---

*Simal Technologies — General Inquiry Auto-Reply Template v1.0.*
