# 02 Event Tracking Plan

> **Implementation:** Google Tag Manager (GTM) → GA4 + HubSpot + Facebook Pixel + LinkedIn Insight Tag
> **Data Layer:** Standardized `dataLayer.push()` pattern
> **Last Updated:** May 2, 2026

---

## Page View Tracking

| Event | Trigger | Parameters |
|---|---|---|
| `page_view` | Every page load (GA4 automatic) | page_title, page_location, page_referrer, language |
| `virtual_page_view` | SPA route changes | Same as above |

## Click & Interaction Tracking

| Event | Trigger | Category |
|---|---|---|
| `cta_click` | Any CTA button click | cta_text, cta_location, page |
| `nav_click` | Navigation menu click | nav_item, nav_level |
| `search_performed` | Search query submitted | search_term, results_count |
| `filter_applied` | Product filter changed | filter_type, filter_value, category |
| `download_click` | PDF/brochure download | file_name, file_type, page |
| `social_click` | Social media icon click | platform, page |
| `external_link_click` | Click to external site | link_url, link_domain |

## Form Tracking

| Event | Trigger |
|---|---|
| `form_start` | User clicks into first form field |
| `form_field_completed` | Each required field completed |
| `form_error` | Validation error shown |
| `form_submit` | Successful form submission |
| `form_abandon` | User leaves page after starting form |

## B2B Portal Tracking

| Event | Trigger |
|---|---|
| `b2b_login` | Successful login |
| `b2b_logout` | User logs out |
| `order_view` | Order detail viewed |
| `quote_view` | Quote detail viewed |
| `invoice_download` | Invoice PDF downloaded |

---

## Data Layer Example

```javascript
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  event: 'rfq_submit',
  rfq_id: 'RFQ-20260502-0042',
  product_count: 3,
  country: 'AE',
  total_estimated_value: 12500,
  currency: 'AED'
});
```

---

*© 2026 Simal Technologies Middle East LLC. Event Tracking Plan v1.0.*
