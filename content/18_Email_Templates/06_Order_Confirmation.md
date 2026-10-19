# 06 Order Confirmation

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `order-confirmation`
> **Trigger:** Order successfully placed via B2B portal checkout
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Order confirmed — ORD-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (AR)** | تم تأكيد الطلب — ORD-{YYYYMMDD}-{NNNN} | سيمال تكنولوجيز |
| **Subject Line (FR)** | Commande confirmée — ORD-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Subject Line (RU)** | Заказ подтвержден — ORD-{YYYYMMDD}-{NNNN} | Simal Technologies |
| **Preheader Text** | Order summary, estimated delivery, and tracking information. |
| **From Name** | Simal Technologies Orders |
| **From Email** | orders@simalme.com |
| **Reply-To** | sales@simalme.com |

---

## Email Body (English)

```
┌────────────────────────────────────────────────────────────┐
│  [SIMAL TECHNOLOGIES LOGO — Centered]                     │
│                                                            │
│  Order Confirmed — ORD-{YYYYMMDD}-{NNNN}                  │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Thank you for your order, {Company Name}!                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  ORDER SUMMARY                                       │ │
│  │                                                      │ │
│  │  Order Number:   ORD-{YYYYMMDD}-{NNNN}               │ │
│  │  Order Date:     {Date & Time} GST                   │ │
│  │  Payment Method: {Method}                            │ │
│  │  Payment Status: {Status}                            │ │
│  │  Order Total:    {Total} AED                         │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  ORDER ITEMS                                         │ │
│  │                                                      │ │
│  │  {Product} × {Qty}  —  {Line Total} AED              │ │
│  │  {Product} × {Qty}  —  {Line Total} AED              │ │
│  │  ─────────────────────────────                       │ │
│  │  Subtotal:      {Subtotal} AED                       │ │
│  │  VAT (5%):      {VAT} AED                            │ │
│  │  Shipping:      {Shipping} AED                       │ │
│  │  TOTAL:         {Grand Total} AED                    │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  SHIPPING ADDRESS                                    │ │
│  │                                                      │ │
│  │  {Company Name}                                      │ │
│  │  {Address Line 1}                                    │ │
│  │  {Address Line 2}                                    │ │
│  │  {City}, {State/Region}                              │ │
│  │  {Country}                                           │ │
│  │  Contact: {Phone}                                    │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ⏱️ Estimated Delivery:                                   │
│  {Estimated Delivery Date Range}                          │
│  Shipping Method: {Carrier} — {Service Level}             │
│  Tracking Number: {Will be emailed when available}         │
│                                                            │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────────┐       │
│  │ORDER │ → │PROCESS│ → │SHIPPED│ → │DELIVERED │       │
│  │  ✅  │    │  ⏳  │    │  ⏳  │    │    🎉   │       │
│  └──────┘    └──────┘    └──────┘    └──────────┘       │
│                                                            │
│  [VIEW ORDER IN B2B PORTAL]                                │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Need help? Contact your account manager or:              │
│  📧 orders@simalme.com                                    │
│  📞 +971 4 393 0507                                       │
│  Reference: ORD-{YYYYMMDD}-{NNNN}                         │
│                                                            │
│  Simal Technologies Middle East LLC                        │
│  Office 201, Dar Al Riffa Building, Bur Dubai, Dubai, UAE │
│  TRN: {Tax Registration Number}                           │
│  simalme.com                                              │
└────────────────────────────────────────────────────────────┘
```

---

## Plain Text Version

```
Order Confirmed — ORD-{YYYYMMDD}-{NNNN}

Thank you for your order, {Company Name}!

ORDER SUMMARY:
- Order Number: ORD-{YYYYMMDD}-{NNNN}
- Order Date: {Date & Time} GST
- Payment Method: {Method}
- Order Total: {Total} AED

ORDER ITEMS:
{Product} × {Qty} — {Line Total} AED (each line)

Subtotal: {Subtotal} AED
VAT (5%): {VAT} AED
Shipping: {Shipping} AED
TOTAL: {Grand Total} AED

SHIPPING ADDRESS:
{Company Name}
{Address}
{City}, {Country}

Estimated Delivery: {Date Range}
Shipping: {Carrier} — {Service Level}
Tracking: Will be emailed when available.

View your order: https://b2b.simalme.com/orders/{Order ID}

Need help? Contact orders@simalme.com or +971 4 393 0507. Reference ORD-{YYYYMMDD}-{NNNN}.

Simal Technologies Middle East LLC — TRN: {TRN}
simalme.com
```

---

## Order Status Update Emails (Automated)

| Status Change | Email Trigger |
|---|---|
| Order Placed | Order Confirmation (this template) |
| Payment Received | Payment confirmation notification |
| Processing | "Your order is being processed" |
| Shipped | Shipping confirmation with tracking number |
| Out for Delivery | Delivery notification |
| Delivered | Delivery confirmation + feedback request |
| Cancelled | Order cancellation notification |

---

## Legal Requirements (UAE)

- Include TRN (Tax Registration Number) on all order confirmations (UAE VAT compliance)
- Display VAT (5%) as a separate line item
- Order confirmation email serves as tax invoice for B2B customers

---

*Simal Technologies — Order Confirmation Template v1.0.*
