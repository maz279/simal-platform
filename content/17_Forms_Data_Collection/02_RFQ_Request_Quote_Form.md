# 02 RFQ — Request for Quote Form

> **Source:** Simal Technologies Web Development — May 2026
> **Owner:** Web Developer / IT Distribution Sales
> **Version:** 1.0

---

## 1. Overview

The Request for Quote (RFQ) form allows B2B customers and prospects to request bulk pricing on IT hardware products. It supports multi-product line items (up to 20 products per submission) and integrates with HubSpot Deal creation for the sales pipeline.

### 1.1 Form Specifications

| Parameter | Value |
|-----------|-------|
| **Form ID** | `rfq-form` |
| **Page(s)** | Product detail pages (CTA button), `/contact/request-quote/` |
| **Method** | POST (AJAX) |
| **API Endpoint** | `/api/forms/rfq` |
| **reCAPTCHA** | v3 (score threshold: 0.5) |
| **CRM** | HubSpot — Create Deal (pipeline: "Sales") |
| **Response SLA** | 2–4 business hours |

---

## 2. Field Definitions

### 2.1 Company & Contact Section

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 1 | **Company Name** | text | Yes | 2–150 chars |
| 2 | **Contact Person** | text | Yes | 2–100 chars |
| 3 | **Email Address** | email | Yes | RFC 5322 |
| 4 | **Phone Number** | tel | Yes | International format |
| 5 | **Country** | select | Yes | Default: UAE |
| 6 | **Company Type** | select | Yes | System Integrator / Reseller / Retailer / End-User / Government / Other |

### 2.2 Product Selection (Dynamic Rows)

| # | Field | Type | Required | Notes |
|---|-------|------|----------|-------|
| 7 | **Product Search** | autocomplete (×20 rows) | Yes (min 1) | Searchable dropdown of all 76 products; shows brand + name + SKU |
| 8 | **Quantity** | number | Yes (per row) | Min: 1; Max: 10,000; integer only |
| 9 | **Add Product Row** | button | — | Adds another product line; max 20 rows |
| 10 | **Remove Product Row** | button | — | Removes product line (except last remaining row) |

### 2.3 Additional Details

| # | Field | Type | Required | Validation |
|---|-------|------|----------|------------|
| 11 | **Required Delivery Date** | date | No | Must be future date |
| 12 | **Special Requirements** | textarea | No | Max 1000 chars |
| 13 | **How Did You Hear About Us?** | select | No | Standard options |

---

## 3. Product Autocomplete API

### 3.1 API Endpoint

```
GET /api/products/search?q={search_term}

Response:
{
  "results": [
    {
      "id": "CT1000T500SSD8",
      "name": "Crucial T500 1TB NVMe SSD",
      "brand": "Crucial",
      "category": "SSD",
      "sku": "CT1000T500SSD8",
      "min_order_qty": 1,
      "unit": "Piece"
    }
  ]
}
```

### 3.2 Product Row JS Template

```html
<div class="product-row" data-row="1">
  <div class="form-group product-search">
    <label>Product <span class="required">*</span></label>
    <input type="text" class="product-autocomplete" 
           placeholder="Search by brand, name, or SKU..."
           data-product-id="">
    <div class="autocomplete-dropdown" hidden></div>
  </div>
  
  <div class="form-group product-qty">
    <label>Quantity <span class="required">*</span></label>
    <input type="number" min="1" max="10000" step="1" value="1">
  </div>
  
  <button type="button" class="btn-remove-row" aria-label="Remove product">
    <svg class="icon icon-md"><use href="#icon-trash"/></svg>
  </button>
</div>
```

---

## 4. CRM Integration — HubSpot Deal Creation

### 4.1 HubSpot Deal Pipeline

| Stage | Description |
|-------|-------------|
| 1. New RFQ | Triggered on form submission |
| 2. Quoting | Sales team preparing quote |
| 3. Quote Sent | Quote emailed to customer |
| 4. Negotiation | Price/terms discussion |
| 5. Closed Won | Order confirmed |
| 6. Closed Lost | Lost to competition / no response |

### 4.2 HubSpot API Payload

```javascript
{
  properties: {
    dealname: `RFQ — ${companyName} — ${productCount} products`,
    dealstage: 'new_rfq',
    pipeline: 'sales',
    amount: null, // Calculated during quoting
    closedate: new Date(Date.now() + 14 * 86400000).toISOString(),
    company_name_rfq: companyName,
    contact_person: contactPerson,
    email: email,
    phone: phone,
    country: country,
    company_type: companyType,
    products_requested: JSON.stringify(products),
    special_requirements: specialRequirements,
    rfq_source: 'Website RFQ Form'
  }
}
```

---

## 5. Email Notifications

### 5.1 Internal Notification

**To:** `sales-distribution@simalme.com`
**Subject:** `New RFQ: {company_name} — {product_count} products`
**Body:** Full RFQ details in a structured layout with product table

### 5.2 Auto-Reply to Customer

See: [18_Email_Templates/04_RFQ_Confirmation.md](../18_Email_Templates/04_RFQ_Confirmation.md)

---

## 6. Success & Error States

### 6.1 Success Message

```
┌──────────────────────────────────────────────┐
│  ✓  Quote Request Received!                   │
│                                                │
│  Thank you, {contact_person}. We're preparing  │
│  your quote for {product_count} products.      │
│                                                │
│  Reference: RFQ-20260502-0042                  │
│                                                │
│  What happens next:                            │
│  ① We review your request (within 1 hour)     │
│  ② Our sales team prepares your quote         │
│  ③ You receive pricing in 2–4 business hours  │
│                                                │
│  A confirmation email is on its way to         │
│  {email}. For urgent inquiries, call           │
│  +971 4 393 0507.                              │
└──────────────────────────────────────────────┘
```

### 6.2 Validation Errors

- **No product selected:** "Please add at least one product to your quote request."
- **Invalid quantity:** "Quantity must be between 1 and 10,000."
- **Duplicate products:** If same product appears in multiple rows, show warning: "{product_name} appears multiple times. Consolidate quantities?"

---

## 7. Analytics

| Event | GA4 Event | Parameters |
|-------|----------|------------|
| Form Start | `form_start` | `form_name: rfq` |
| Product Added | `rfq_product_add` | `product_id, brand, count` |
| Form Submit | `form_submit` | `form_name: rfq, product_count, total_qty` |
| Form Success | `generate_lead` | `form_name: rfq, value: 50` |

---

> **Next File:** [03_Demo_Request_Form.md](./03_Demo_Request_Form.md) — UniERP demo request form.

> **Parent Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/)

---

*Simal Technologies Middle East LLC — RFQ Form Configuration — CONFIDENTIAL — Version 1.0 — May 2026*
