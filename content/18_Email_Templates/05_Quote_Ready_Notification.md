# 05 Quote Ready Notification

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `quote-ready-notification`
> **Trigger:** Sales team marks quote as "Sent" in admin panel
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Your quote is ready — QTE-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (AR)** | عرض السعر الخاص بك جاهز — QTE-{YYYYMMDD}-{NNNN} | سيمال تكنولوجيز |
| **Subject Line (FR)** | Votre devis est prêt — QTE-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (RU)** | Ваше предложение готово — QTE-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Preheader Text** | Review your quote and accept online. Valid until {Expiry Date}. |
| **From Name** | {Account Manager Name}, Simal Technologies |
| **From Email** | sales@simalme.com |
| **Reply-To** | {Account Manager Email} |
| **Priority** | High — Time-sensitive (quote has expiry) |

---

## Email Body (English)

```
┌────────────────────────────────────────────────────────────┐
│  [SIMAL TECHNOLOGIES LOGO — Centered]                     │
│                                                            │
│  Your Quote is Ready, {Contact Name}!                     │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Quote QTE-{YYYYMMDD}-{NNNN} has been prepared by         │
│  {Account Manager Name} and is ready for your review.     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  QUOTE SUMMARY                                       │ │
│  │                                                      │ │
│  │  Quote Number:  QTE-{YYYYMMDD}-{NNNN}                │ │
│  │  Prepared By:   {Account Manager Name}               │ │
│  │  Valid Until:   {Expiry Date} (14 days from issue)   │ │
│  │  Total Items:   {Number of line items}               │ │
│  │  Subtotal:      {Subtotal} AED                       │ │
│  │  VAT (5%):      {VAT Amount} AED                     │ │
│  │  Quote Total:   {Total Amount} AED                   │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  QUOTE LINE ITEMS                                    │ │
│  │                                                      │ │
│  │  {Product}  |  Qty: {N}  |  Unit: {Price} AED       │ │
│  │  {Product}  |  Qty: {N}  |  Unit: {Price} AED       │ │
│  │  ...                                                 │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌────────────────┐    ┌──────────────────┐               │
│  │ ✅ ACCEPT QUOTE│    │ 📋 REQUEST CHANGE │               │
│  └────────────────┘    └──────────────────┘               │
│                                                            │
│  [VIEW FULL QUOTE IN B2B PORTAL]                           │
│                                                            │
│  ⚠️ This quote expires on {Expiry Date}. Prices and       │
│  availability are subject to change after expiry.          │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Questions about your quote?                               │
│  Reply to this email or contact {Account Manager Name}:   │
│  📧 {Account Manager Email}                               │
│  📞 {Account Manager Phone}                               │
│                                                            │
│  Simal Technologies Middle East LLC                        │
│  +971 4 393 0507 | simalme.com                             │
└────────────────────────────────────────────────────────────┘
```

---

## Plain Text Version

```
Your Quote is Ready, {Contact Name}!

Quote QTE-{YYYYMMDD}-{NNNN} has been prepared by {Account Manager Name}.

QUOTE SUMMARY:
- Quote Number: QTE-{YYYYMMDD}-{NNNN}
- Prepared By: {Account Manager Name}
- Valid Until: {Expiry Date}
- Quote Total: {Total Amount} AED (incl. 5% VAT)

VIEW & ACCEPT YOUR QUOTE:
https://b2b.simalme.com/quotes/{Quote ID}

⚠️ This quote expires on {Expiry Date}. Prices and availability are subject to change after expiry.

Questions? Contact {Account Manager Name} at {Account Manager Email} or {Account Manager Phone}.

Simal Technologies Middle East LLC
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Sales admin marks quote status as "Sent" |
| **Delay** | Immediate |
| **CC** | Account Manager (for awareness) |
| **Expiry Reminder** | Send follow-up reminder 48 hours before quote expiry |
| **Expiry Notice** | Send notification when quote expires |

---

## Quote Lifecycle Emails

| Stage | Email Trigger |
|---|---|
| 1. Quote Requested | RFQ Confirmation (Template 04) |
| 2. Quote Prepared | Quote Ready (this template) |
| 3. Quote Viewed | (Internal notification to Account Manager) |
| 4. Quote Accepted | Order Confirmation (Template 06 — if auto-converted) |
| 5. Quote Declined | (Internal notification + optional follow-up) |
| 6. Quote Expiring | Reminder 48h before expiry |
| 7. Quote Expired | Expiry notification |

---

*Simal Technologies — Quote Ready Notification Template v1.0.*
