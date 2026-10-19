# 04 RFQ Confirmation — Quote Request Received

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `rfq-confirmation`
> **Trigger:** Form submission on RFQ / Quote Request page
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Quote request received — RFQ-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (AR)** | ?? ?????? ??? ??? ????? — RFQ-{YYYYMMDD}-{NNNN} | ????? ????????? |
| **Subject Line (FR)** | Demande de devis reçue — RFQ-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (RU)** | ?????? ??????????? ??????? — RFQ-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Preheader Text** | We'll prepare your quote and respond within 2–4 business hours. |
| **From Name** | Simal Technologies Sales |
| **From Email** | sales@simalme.com |
| **Reply-To** | sales@simalme.com |

---

## Email Body (English)

```
+------------------------------------------------------------+
¦  [SIMAL TECHNOLOGIES LOGO — Centered]                     ¦
¦                                                            ¦
¦  Quote Request Received — Thank You, {Contact Name}!      ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  We've received your request for quotation and our sales  ¦
¦  team is already working on it.                           ¦
¦                                                            ¦
¦  +------------------------------------------------------+ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  QUOTE REQUEST SUMMARY                               ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  RFQ Reference:  RFQ-{YYYYMMDD}-{NNNN}               ¦ ¦
¦  ¦  Submitted:      {Date & Time} GST                   ¦ ¦
¦  ¦  Company:        {Company Name}                      ¦ ¦
¦  ¦  Contact:        {Full Name}                         ¦ ¦
¦  ¦  Email:          {Email Address}                     ¦ ¦
¦  ¦  Country:        {Country}                           ¦ ¦
¦  ¦                                                      ¦ ¦
¦  +------------------------------------------------------+ ¦
¦                                                            ¦
¦  +------------------------------------------------------+ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  PRODUCTS REQUESTED                                  ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  {#each products}                                    ¦ ¦
¦  ¦  • {Product Name} — Qty: {Quantity}                  ¦ ¦
¦  ¦    {#if custom_requirements}                         ¦ ¦
¦  ¦    Notes: {Requirements}                             ¦ ¦
¦  ¦    {/if}                                             ¦ ¦
¦  ¦  {/each}                                             ¦ ¦
¦  ¦                                                      ¦ ¦
¦  ¦  {#if additional_notes}                              ¦ ¦
¦  ¦  Additional Notes:                                   ¦ ¦
¦  ¦  {Additional Notes from Customer}                    ¦ ¦
¦  ¦  {/if}                                               ¦ ¦
¦  ¦                                                      ¦ ¦
¦  +------------------------------------------------------+ ¦
¦                                                            ¦
¦  ?? What to Expect:                                       ¦
¦  • Response within 2–4 business hours (Mon-Fri, 9AM-8PM; Sat 9AM-3PM)  ¦
¦  • For complex multi-line quotes: up to 24 hours          ¦
¦  • You'll receive an email when your quote is ready       ¦
¦  • Access your quote anytime in the B2B portal            ¦
¦                                                            ¦
¦  Need to modify your request?                             ¦
¦  Reply to this email or call +971 4 393 0507              ¦
¦  Reference RFQ-{YYYYMMDD}-{NNNN} in your communication.   ¦
¦                                                            ¦
¦  ---------------------------------------                  ¦
¦                                                            ¦
¦  Simal Technologies Middle East LLC                        ¦
¦  +971 4 393 0507 | sales@simalme.com | simalme.com        ¦
¦                                                            ¦
¦  RFQ Reference: RFQ-{YYYYMMDD}-{NNNN}                     ¦
+------------------------------------------------------------+
```

---

## Plain Text Version

```
Quote Request Received — Thank You, {Contact Name}!

We've received your request for quotation and our sales team is already working on it.

QUOTE REQUEST SUMMARY:
- RFQ Reference: RFQ-{YYYYMMDD}-{NNNN}
- Submitted: {Date & Time} GST
- Company: {Company Name}
- Contact: {Full Name}
- Country: {Country}

PRODUCTS REQUESTED:
{Product list with quantities}

{Additional Notes if any}

What to Expect:
- Response within 2–4 business hours (Mon-Fri, 9AM-8PM GST; Sat 9AM-3PM GST)
- For complex quotes: up to 24 hours
- Access your quote in the B2B portal: https://b2b.simalme.com/quotes

Need to modify your request? Reply or call +971 4 393 0507. Reference RFQ-{YYYYMMDD}-{NNNN}.

Simal Technologies Middle East LLC
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Successful RFQ form submission |
| **Delay** | Immediate (within 60 seconds) |
| **CC** | BCC: sales@simalme.com for CRM tracking |
| **HubSpot Integration** | Create Deal in HubSpot CRM associated with contact/company |

---

*Simal Technologies — RFQ Confirmation Template v1.0.*
