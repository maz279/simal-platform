# 01 Analytics Overview

> **Platform:** Google Analytics 4 (GA4) + Google Tag Manager (GTM)
> **Property:** Simal Technologies Corporate Website + B2B Portal (separate GA4 streams)
> **Last Updated:** May 2, 2026

---

## Analytics Stack

| Component | Tool | Purpose |
|---|---|---|
| **Web Analytics** | Google Analytics 4 | Traffic, user behavior, conversions |
| **Tag Management** | Google Tag Manager | Event tracking, third-party pixels |
| **Heatmaps** | Hotjar / Microsoft Clarity | User session recordings, click maps |
| **Search Console** | Google Search Console | Search performance, indexing |
| **A/B Testing** | Google Optimize (or VWO) | Conversion rate optimization |
| **CRM Analytics** | HubSpot | Lead tracking, deal pipeline |
| **Email Analytics** | Mailchimp | Email opens, clicks, conversions |

---

## Key Metrics (KPIs)

| Category | Metric | Target |
|---|---|---|
| **Traffic** | Monthly Unique Visitors | 50,000+ |
| **Engagement** | Avg. Session Duration | 3:00+ |
| **Engagement** | Pages Per Session | 3.5+ |
| **B2B** | B2B Registrations / Month | 100+ |
| **B2B** | RFQ Submissions / Month | 50+ |
| **ERP** | Demo Requests / Month | 30+ |
| **Conversion** | Newsletter Signups / Month | 200+ |

---

## GA4 Custom Events

| Event Name | Trigger | Parameters |
|---|---|---|
| `product_view` | Product detail page view | product_id, product_name, brand, category |
| `rfq_submit` | RFQ form submission | rfq_id, product_count, country |
| `b2b_registration` | B2B registration submitted | company_name, country, industry |
| `demo_request` | ERP demo form submitted | modules_selected, industry, company_size |
| `quote_accepted` | Quote accepted in B2B portal | quote_id, total_value, currency |
| `order_placed` | Order completed | order_id, total, item_count, payment_method |
| `language_switched` | Language selector used | from_lang, to_lang |

---

*© 2026 Simal Technologies Middle East LLC. Analytics Overview v1.0.*
