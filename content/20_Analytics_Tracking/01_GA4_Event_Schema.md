# 01 — GA4 Event Schema & Measurement Plan

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Complete Google Analytics 4 (GA4) event schema for the Simal Technologies corporate website. Covers all custom events, recommended events, ecommerce events, event parameters, user properties, and the dataLayer.push() implementation pattern. Includes event categorization by user journey stage, parameter naming conventions, and debugging/validation procedures.  
> **Platform:** Google Analytics 4 (Measurement ID: G-XXXXXXXXX)  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Measurement Strategy Overview](#1-measurement-strategy-overview)
2. [GA4 Property Configuration](#2-ga4-property-configuration)
3. [Event Taxonomy & Naming Convention](#3-event-taxonomy--naming-convention)
4. [Automatically Collected Events (Enhanced Measurement)](#4-automatically-collected-events-enhanced-measurement)
5. [Recommended GA4 Events](#5-recommended-ga4-events)
6. [Custom Events — User Engagement](#6-custom-events--user-engagement)
7. [Custom Events — Product & Catalog](#7-custom-events--product--catalog)
8. [Custom Events — ERP & Solutions](#8-custom-events--erp--solutions)
9. [Custom Events — Forms & Conversions](#9-custom-events--forms--conversions)
10. [Custom Events — Chat & Communication](#10-custom-events--chat--communication)
11. [Custom Events — B2B Portal](#11-custom-events--b2b-portal)
12. [Custom Events — Content & Media](#12-custom-events--content--media)
13. [Ecommerce Events](#13-ecommerce-events)
14. [User Properties & Custom Dimensions](#14-user-properties--custom-dimensions)
15. [dataLayer Implementation Patterns](#15-datalayer-implementation-patterns)
16. [Event Debugging & Validation](#16-event-debugging--validation)

---

## 1. Measurement Strategy Overview

### 1.1 MEASUREMENT FRAMEWORK

```
┌──────────────────────────────────────────────────────┐
│                  USER JOURNEY STAGES                  │
├──────────────┬──────────────┬────────────────────────┤
│  ACQUISITION │  ENGAGEMENT  │     CONVERSION         │
├──────────────┼──────────────┼────────────────────────┤
│ • page_view  │ • scroll     │ • rfq_submit           │
│ • session_   │ • product_   │ • demo_request         │
│   start      │   view       │ • b2b_registration     │
│ • first_visit│ • erp_module_│ • newsletter_signup    │
│ • campaign_  │   view       │ • partner_application  │
│   source     │ • video_     │ • phone_call_click     │
│              │   engage     │ • whatsapp_click       │
│              │ • file_      │ • chat_lead_captured   │
│              │   download   │ • support_ticket_submit│
└──────────────┴──────────────┴────────────────────────┘
```

### 1.2 KEY BUSINESS OBJECTIVES → METRICS

| Business Objective | Primary Metric | Supporting GA4 Events |
|-------------------|----------------|----------------------|
| **Generate B2B RFQ leads** | RFQ submission count | `rfq_submit`, `rfq_form_start`, `rfq_form_progress` |
| **Drive UniERP demo bookings** | Demo request count | `demo_request`, `erp_module_view`, `erp_pricing_view` |
| **Grow B2B partner network** | Partner applications | `partner_application`, `b2b_registration` |
| **Increase newsletter subscribers** | Newsletter signups | `newsletter_signup` |
| **Improve product discovery** | Product page views | `product_view`, `product_compare`, `catalog_filter` |
| **Boost support self-service** | KB article engagement | `kb_article_view`, `kb_search`, `support_ticket_submit` |
| **Increase direct contact** | Phone/WhatsApp clicks | `phone_call_click`, `whatsapp_click` |

---

## 2. GA4 Property Configuration

### 2.1 PROPERTY SETTINGS

| Setting | Value |
|---------|-------|
| **Measurement ID** | `G-SMLXXXXXXX` (placeholder — replace with actual) |
| **Property Name** | Simal Technologies — Corporate Website |
| **Reporting Time Zone** | United Arab Emirates (UTC+4 — GST) |
| **Currency** | AED (UAE Dirham) |
| **Default URL** | `https://simalme.com` |

### 2.2 DATA STREAMS

| Stream | Platform | URL |
|--------|----------|-----|
| **Main Website** | Web | `simalme.com` |
| **B2B Portal** | Web (subdomain) | `b2b.simalme.com` |
| **UniERP Subdomain** | Web (subdomain) | `unierp.simalme.com` |

### 2.3 ENHANCED MEASUREMENT (Enabled)

| Feature | Status | Notes |
|---------|--------|-------|
| Page views | ✅ Enabled | `page_view` |
| Scrolls | ✅ Enabled | `scroll` (90% threshold) |
| Outbound clicks | ✅ Enabled | `click` with `outbound: true` |
| Site search | ✅ Enabled | `view_search_results` — tracks `?q=` and `?search=` |
| Video engagement | ✅ Enabled | `video_start`, `video_progress`, `video_complete` |
| File downloads | ✅ Enabled | `file_download` — PDF, DOCX, XLSX, ZIP, etc. |

---

## 3. Event Taxonomy & Naming Convention

### 3.1 NAMING RULES

| Rule | Example | Notes |
|------|---------|-------|
| **Use snake_case** | `product_view` | Lowercase with underscores |
| **Prefix with entity** | `product_*`, `erp_*`, `chat_*` | Groups related events |
| **Use action suffix** | `*_view`, `*_click`, `*_submit`, `*_download`, `*_start`, `*_complete` | Descriptive action |
| **Max 40 chars** | `product_bulk_add_to_compare` (30 chars ✓) | GA4 event name limit |
| **No special chars** | Only `[a-z0-9_]` | Alphanumeric + underscore |
| **Parameter limit** | ≤ 25 parameters per event | GA4 limit |

### 3.2 EVENT CATEGORIES

| Prefix | Category | Example Events |
|--------|----------|---------------|
| `product_` | Product & Catalog | `product_view`, `product_compare`, `catalog_filter` |
| `erp_` | UniERP & Solutions | `erp_module_view`, `erp_pricing_view`, `erp_demo_video` |
| `form_` | Form interactions | `form_start`, `form_submit`, `form_error`, `form_abandon` |
| `chat_` | Chat & Intercom | `chat_opened`, `chat_message_sent`, `chat_lead_captured` |
| `b2b_` | B2B Portal | `b2b_login`, `b2b_registration`, `b2b_order_placed` |
| `content_` | Content & Media | `content_download`, `video_engage`, `blog_view` |
| `nav_` | Navigation | `nav_click`, `language_switch`, `search_perform` |
| `engagement_` | User Engagement | `scroll_depth`, `time_on_page`, `exit_intent` |

---

## 4. Automatically Collected Events (Enhanced Measurement)

### 4.1 AUTO-EVENTS

| Event Name | Trigger | Parameters |
|-----------|---------|------------|
| `page_view` | Every page load | `page_location`, `page_referrer`, `page_title`, `language` |
| `scroll` | User scrolls to 90% of page | `percent_scrolled` |
| `click` | Outbound link click | `link_classes`, `link_domain`, `link_url`, `outbound: true` |
| `view_search_results` | Site search performed | `search_term` |
| `video_start` | Video starts playing | `video_current_time`, `video_duration`, `video_percent`, `video_provider`, `video_title`, `video_url` |
| `video_progress` | Video reaches 10%, 25%, 50%, 75% | Same as `video_start` |
| `video_complete` | Video finishes playing | Same as `video_start` |
| `file_download` | File download link clicked | `file_extension`, `file_name`, `link_classes`, `link_id`, `link_text`, `link_url` |
| `session_start` | New session begins | `session_id`, `session_number` |
| `first_visit` | First-ever visit to site | `session_id` |
| `user_engagement` | App/site in foreground ≥ 1 second | `engagement_time_msec` |

### 4.2 AUTO-EVENT CUSTOMIZATION

```javascript
// Override default page_view to include custom parameters
gtag('event', 'page_view', {
  page_category: getPageCategory(),     // homepage | product | catalog | erp | about | contact | support | b2b | blog
  page_template: getPageTemplate(),     // landing | listing | detail | form | search_results
  language: getCurrentLanguage(),       // en | ar | fr | ru
  login_status: getLoginStatus(),       // anonymous | b2b_logged_in
  content_group: getPageCategory(),     // Maps to GA4 Content Group
});
```

---

## 5. Recommended GA4 Events

### 5.1 IMPLEMENTED RECOMMENDED EVENTS

| Event Name | Trigger | Custom Parameters Added |
|-----------|---------|------------------------|
| `login` | B2B user signs in | `method: 'email'`, `login_status: 'success' \| 'failed'` |
| `sign_up` | B2B registration form submit | `method: 'email'` |
| `search` | Site search performed | `search_term` (from Enhanced Measurement) |
| `share` | User shares content | `method: 'copy_link' \| 'facebook' \| 'linkedin' \| 'twitter' \| 'whatsapp'`, `content_type` |
| `view_item` | Product detail page view | Enhanced with `item_id`, `item_name`, `item_brand`, `item_category`, `price` |
| `view_item_list` | Product listing/catalog page view | Enhanced with `item_list_id`, `item_list_name` |
| `add_to_cart` | B2B add product to RFQ/order list | `items[]`, `currency: 'AED'` |
| `begin_checkout` | B2B order checkout started | `items[]`, `currency: 'AED'`, `value` |
| `purchase` | B2B order completed | `transaction_id`, `items[]`, `currency: 'AED'`, `value`, `tax`, `shipping` |

---

## 6. Custom Events — User Engagement

### 6.1 ENGAGEMENT EVENTS

```javascript
// EVENT: engagement_scroll_depth
// Tracks scroll depth at 25%, 50%, 75%, 100% thresholds
// Fires once per threshold per page
gtag('event', 'engagement_scroll_depth', {
  scroll_depth_percent: 50,           // 25 | 50 | 75 | 100
  page_category: 'product',
  page_path: '/products/crucial/ct1000t500ssd8/',
  language: 'en',
});

// EVENT: engagement_time_on_page
// Fires on page unload or after 30-second intervals
gtag('event', 'engagement_time_on_page', {
  time_seconds: 45,
  page_category: 'blog',
  page_path: '/blog/hikvision-colorvu-vs-thermal/',
  language: 'en',
});

// EVENT: engagement_exit_intent
// Fires when desktop user moves mouse out of viewport upward
gtag('event', 'engagement_exit_intent', {
  page_category: 'erp',
  page_path: '/erp/pricing/',
  time_on_page_seconds: 35,
  language: 'en',
});

// EVENT: nav_click
// Tracks main navigation clicks
gtag('event', 'nav_click', {
  nav_section: 'main_header',         // main_header | footer | sidebar | breadcrumb
  nav_item: 'Products',               // Label text
  nav_url: '/products/',
  nav_level: 1,                       // 1=top, 2=dropdown, 3=sub-dropdown
  language: 'en',
});

// EVENT: language_switch
// Tracks language switching
gtag('event', 'language_switch', {
  from_language: 'en',
  to_language: 'ar',
  page_path: '/products/',
  switch_method: 'header_selector',   // header_selector | url_change | auto_detect
});
```

---

## 7. Custom Events — Product & Catalog

### 7.1 PRODUCT EVENTS

```javascript
// EVENT: product_view
// Fires on individual product detail page load
gtag('event', 'product_view', {
  product_name: 'Crucial T500 1TB NVMe PCIe Gen4 SSD',
  product_sku: 'CT1000T500SSD8',
  product_brand: 'Crucial',
  product_category: 'Storage',        // Cameras | Storage | Memory | Monitors | Cables | Power | Networking | Accessories
  product_subcategory: 'NVMe SSD',
  product_price_aed: 345.00,          // Retail price or base price
  product_in_stock: true,
  product_condition: 'new',
  page_language: 'en',
  referrer_source: 'catalog',         // catalog | search | homepage_banner | direct | external
});

// EVENT: product_compare
// Fires when user adds product to compare list
gtag('event', 'product_compare', {
  compare_action: 'add',              // add | remove | clear | view
  product_sku: 'CT1000T500SSD8',
  product_brand: 'Crucial',
  compare_list_size: 2,               // How many products currently in compare
  compare_list_items: 'CT1000T500SSD8,WDS100T3X0E', // Comma-separated SKUs
  page_language: 'en',
});

// EVENT: product_quick_view
// Fires when quick-view modal is opened
gtag('event', 'product_quick_view', {
  product_sku: 'CT1000T500SSD8',
  product_brand: 'Crucial',
  source_page: 'catalog',             // catalog | search_results | homepage
  page_language: 'en',
});

// EVENT: product_specs_expand
// Fires when user expands a specification section
gtag('event', 'product_specs_expand', {
  product_sku: 'DS-2CD2143G2-I',
  spec_section: 'camera',             // camera | storage | connectivity | dimensions | general
  page_language: 'en',
});

// EVENT: catalog_filter
// Tracks catalog filtering and sorting
gtag('event', 'catalog_filter', {
  filter_type: 'brand',               // brand | category | price_range | in_stock | sort
  filter_value: 'Crucial',            // The selected value
  filter_combination_count: 3,        // Total active filters
  result_count: 12,                   // Products shown after filtering
  page_language: 'en',
});

// EVENT: catalog_sort
gtag('event', 'catalog_sort', {
  sort_by: 'price_asc',               // price_asc | price_desc | name_asc | name_desc | newest | popularity
  result_count: 24,
  page_language: 'en',
});

// EVENT: search_perform
// Enhanced search tracking (supplements view_search_results)
gtag('event', 'search_perform', {
  search_term: 'NVMe SSD 1TB',
  search_result_count: 8,
  search_category: 'products',        // products | erp | blog | support | all
  search_no_results: false,
  search_language: 'en',
  search_source: 'header_search',     // header_search | catalog_search | mobile_search
});
```

---

## 8. Custom Events — ERP & Solutions

### 8.1 ERP EVENTS

```javascript
// EVENT: erp_module_view
// Fires on UniERP module detail page
gtag('event', 'erp_module_view', {
  erp_module: 'accounting',           // accounting | crm | sales | inventory | hr | purchase | manufacturing | pos | project | website | ecommerce | marketing
  erp_module_category: 'finance',     // finance | sales | operations | hr | marketing | website
  page_language: 'en',
  referrer_source: 'erp_landing',     // erp_landing | industry_page | search | direct
});

// EVENT: erp_pricing_view
// Fires on UniERP pricing page
gtag('event', 'erp_pricing_view', {
  pricing_plan_viewed: 'enterprise',  // starter | professional | enterprise
  page_language: 'en',
  referrer_source: 'erp_module',
});

// EVENT: erp_industry_view
// Fires on industry-specific ERP solution page
gtag('event', 'erp_industry_view', {
  erp_industry: 'healthcare',         // it_distribution | retail | healthcare | education | manufacturing | logistics | hospitality | construction | agriculture | financial_services
  page_language: 'en',
});

// EVENT: erp_roi_calculator
// Fires when user interacts with the ROI calculator
gtag('event', 'erp_roi_calculator', {
  calculator_action: 'complete',      // start | update | complete
  estimated_annual_savings_aed: 45000,
  selected_modules_count: 5,
  company_size_range: '51-200',
  page_language: 'en',
});

// EVENT: erp_demo_video
// Fires when UniERP demo video is played
gtag('event', 'erp_demo_video', {
  video_title: 'UniERP Platform Walkthrough',
  video_action: 'play',               // play | pause | complete | progress_25 | progress_50 | progress_75
  page_language: 'en',
});
```

---

## 9. Custom Events — Forms & Conversions

### 9.1 FORM EVENTS (Universal — all 7 forms)

```javascript
// EVENT: form_start
// Fires when user begins interacting with a form field
gtag('event', 'form_start', {
  form_id: 'rfq',                     // contact | rfq | demo | newsletter | partner | job | support
  form_name: 'RFQ Request Quote',
  page_path: '/products/request-quote/',
  page_language: 'en',
  source_page_category: 'product',
});

// EVENT: form_progress
// Fires when user completes a logical step in multi-step forms
gtag('event', 'form_progress', {
  form_id: 'partner',
  step_number: 2,
  step_name: 'business_details',
  total_steps: 6,
  fields_completed: 8,
  time_elapsed_seconds: 45,
  page_language: 'en',
});

// EVENT: form_validation_error
// Fires when client-side validation blocks form submission
gtag('event', 'form_validation_error', {
  form_id: 'rfq',
  error_count: 3,
  error_codes: 'E-FMT-EMAIL,E-REQUIRED,E-FILE-SIZE',
  page_language: 'en',
});

// EVENT: form_abandon
// Fires when user leaves form page without submitting (after interaction)
gtag('event', 'form_abandon', {
  form_id: 'demo',
  fields_completed: 5,
  total_fields: 14,
  completion_percent: 36,
  time_on_form_seconds: 120,
  last_field_focused: 'preferred_date',
  page_language: 'en',
});

// EVENT: form_submit
// Fires on successful client-side validation, before API call
gtag('event', 'form_submit', {
  form_id: 'rfq',
  form_name: 'RFQ Request Quote',
  page_language: 'en',
});
```

### 9.2 FORM-SPECIFIC CONVERSION EVENTS

```javascript
// EVENT: rfq_submit — Conversion: RFQ submitted successfully (server-side confirmed)
gtag('event', 'rfq_submit', {
  form_id: 'rfq',
  product_count: 5,
  total_quantity: 1000,
  brands_requested: 'Crucial,TEAMGROUP,HIKVISION',
  product_categories: 'Storage,Memory,Cameras',
  buyer_type: 'business',            // business | personal
  has_company: true,
  hubspot_deal_id: '87654321',
  page_language: 'en',
  currency: 'AED',
  value: 0,                          // Value unknown at RFQ stage; update when deal amount assigned
});

// EVENT: demo_request — Conversion: UniERP demo booked
gtag('event', 'demo_request', {
  form_id: 'demo',
  modules_requested: 'accounting,crm,inventory,sales',
  modules_count: 4,
  industry: 'it_distribution',
  company_size: '51-200',
  demo_date: '2026-05-12',
  demo_time: '11:00',
  calendly_event_id: 'CAL_EVENT_ID',
  hubspot_deal_id: '87654322',
  page_language: 'en',
});

// EVENT: newsletter_signup — Conversion: Newsletter subscribed
gtag('event', 'newsletter_signup', {
  form_id: 'newsletter',
  language_preferences: 'en,ar',
  mailchimp_list: 'simal_newsletter_en',
  mailchimp_subscriber_hash: 'md5_hash',
  signup_source: 'footer_form',       // footer_form | inline_cta | blog_sidebar | popup
  page_language: 'en',
});

// EVENT: partner_application — Conversion: Partner application submitted
gtag('event', 'partner_application', {
  form_id: 'partner',
  company_name: 'Tech Solutions ME',
  country: 'AE',
  brands_of_interest: 'HIKVISION,Crucial',
  brands_count: 2,
  territory_coverage: 'UAE',
  existing_distributor: false,
  hubspot_contact_id: '12345678',
  page_language: 'en',
});

// EVENT: job_application — Conversion: Job application submitted
gtag('event', 'job_application', {
  form_id: 'job',
  position: 'Sales Account Manager',
  department: 'sales',
  years_experience: 5,
  uae_resident: true,
  notice_period_days: 30,
  page_language: 'en',
});

// EVENT: support_ticket_submit — Conversion: Support ticket created
gtag('event', 'support_ticket_submit', {
  form_id: 'support',
  ticket_id: 'TKT-20260502-0001',
  severity: 'medium',                 // critical | high | medium | low
  category: 'product_defective',
  product_brand: 'HIKVISION',
  product_sku: 'DS-2CD2143G2-I',
  is_existing_customer: true,
  sla_target_hours: 4,
  page_language: 'en',
});
```

---

## 10. Custom Events — Chat & Communication

### 10.1 CHAT EVENTS

```javascript
// EVENT: chat_shown — Proactive greeting displayed
gtag('event', 'chat_shown', {
  trigger_id: 'trg_homepage_first_visit',
  page_category: 'homepage',
  page_language: 'en',
  business_hours: true,
  visitor_segment: 'first_time_visitor',
});

// EVENT: chat_opened — User opens messenger
gtag('event', 'chat_opened', {
  page_category: 'product',
  page_language: 'en',
  visitor_segment: 'high_intent_b2b',
  open_source: 'proactive_trigger',   // proactive_trigger | launcher_click | page_button
  business_hours: true,
});

// EVENT: chat_message_sent — User sends a message
gtag('event', 'chat_message_sent', {
  page_category: 'erp',
  message_intent: 'INT-ERP',          // INT-PROD | INT-ERP | INT-SUPP | INT-GEN | INT-PART | INT-AGENT
  message_length: 85,
  is_off_hours: false,
  page_language: 'en',
});

// EVENT: chat_lead_captured — Bot captured lead successfully
gtag('event', 'chat_lead_captured', {
  flow_type: 'product_inquiry',       // product_inquiry | erp_demo | support_ticket | partnership
  hubspot_lead_id: '12345678',
  capture_method: 'bot',              // bot | agent | off_hours_form
  flow_steps_completed: 5,
  flow_completion_time_seconds: 95,
  bot_resolution: true,               // true = bot fully captured, false = handed off to agent
  page_language: 'en',
});

// EVENT: chat_dismissed — User dismisses proactive message
gtag('event', 'chat_dismissed', {
  trigger_id: 'trg_product_interest',
  page_category: 'product',
  page_language: 'en',
});

// EVENT: phone_call_click — User clicks phone number
gtag('event', 'phone_call_click', {
  phone_number: '+97143930507',       // Normalized, no spaces
  click_source: 'header',             // header | footer | contact_page | product_page | support_page
  page_category: 'contact',
  page_language: 'en',
});

// EVENT: whatsapp_click — User clicks WhatsApp link
gtag('event', 'whatsapp_click', {
  template: 'product_inquiry',        // product_inquiry | bulk_rfq | erp_demo | support | warranty | partnership | general
  product_sku: 'CT1000T500SSD8',
  product_brand: 'Crucial',
  component: 'floating_button',       // floating_button | inline_cta | header_icon | footer_link
  page_category: 'product',
  page_language: 'en',
});
```

---

## 11. Custom Events — B2B Portal

### 11.1 B2B EVENTS

```javascript
// EVENT: b2b_login — B2B login attempt
gtag('event', 'b2b_login', {
  login_status: 'success',            // success | failed
  login_method: 'email',              // email | sso
  fail_reason: '',                    // invalid_credentials | account_locked | not_approved | '' (on success)
  company_name: 'Tech Solutions LLC',  // Only on success
  company_industry: 'it_distribution',
  page_language: 'en',
});

// EVENT: b2b_registration — B2B account registration submitted
gtag('event', 'b2b_registration', {
  registration_type: 'new_account',   // new_account | upgrade_retail
  company_name: 'Al Fahd Trading',
  company_country: 'AE',
  company_industry: 'retail',
  trade_license_submitted: true,
  brands_interested: 'HIKVISION,UGREEN',
  page_language: 'en',
});

// EVENT: b2b_registration_approved — Server-side: B2B account approved by admin
// (Sent via Measurement Protocol from server)
gtag('event', 'b2b_registration_approved', {
  company_name: 'Al Fahd Trading',
  approved_by: 'admin_email@simalme.com',
  approval_time_hours: 18,
  credit_limit_aed: 50000,
});

// EVENT: b2b_order_placed — B2B order submitted
gtag('event', 'b2b_order_placed', {
  order_id: 'ORD-20260502-0001',
  order_value_aed: 25000.00,
  order_items_count: 15,
  order_brands: 'HIKVISION,Crucial,UGREEN',
  payment_method: 'bank_transfer',    // bank_transfer | credit_card | credit_account
  expected_delivery_days: 3,
  page_language: 'en',
});

// EVENT: b2b_stock_check — B2B user checks stock availability
gtag('event', 'b2b_stock_check', {
  product_sku: 'CT1000T500SSD8',
  stock_status: 'in_stock',           // in_stock | low_stock | out_of_stock | backorder
  available_quantity: 150,
  warehouse_location: 'JAFZA',
  page_language: 'en',
});

// EVENT: b2b_invoice_download — B2B invoice/statement downloaded
gtag('event', 'b2b_invoice_download', {
  invoice_id: 'INV-2026-0042',
  invoice_value_aed: 12000.00,
  invoice_type: 'tax_invoice',        // tax_invoice | proforma | statement | delivery_note
  page_language: 'en',
});
```

---

## 12. Custom Events — Content & Media

### 12.1 CONTENT EVENTS

```javascript
// EVENT: content_download — Whitepaper, brochure, datasheet download
gtag('event', 'content_download', {
  content_type: 'whitepaper',         // whitepaper | brochure | datasheet | case_study | price_list | catalog
  content_title: 'UniERP for Healthcare Whitepaper',
  content_category: 'erp',
  file_format: 'pdf',
  file_size_kb: 2500,
  download_source: 'blog_article',    // resource_library | blog_article | product_page | erp_page | form_thank_you
  gated: true,                        // true = user filled form to download
  page_language: 'en',
});

// EVENT: blog_view
gtag('event', 'blog_view', {
  blog_title: 'Choosing the Right IP Camera for Your Business',
  blog_category: 'surveillance',      // surveillance | storage | networking | erp | industry_insights | company_news
  blog_author: 'Admin',
  blog_publish_date: '2026-04-15',
  blog_read_time_minutes: 5,
  page_language: 'en',
});

// EVENT: blog_share
gtag('event', 'blog_share', {
  blog_title: 'Choosing the Right IP Camera for Your Business',
  share_method: 'linkedin',           // copy_link | facebook | linkedin | twitter | whatsapp | email
  page_language: 'en',
});

// EVENT: case_study_view
gtag('event', 'case_study_view', {
  case_study_title: 'Dubai Retail Chain — UniERP Implementation',
  case_study_industry: 'retail',
  case_study_solution: 'erp',
  page_language: 'en',
});

// EVENT: kb_article_view — Knowledge base article (support)
gtag('event', 'kb_article_view', {
  kb_article_title: 'How to Reset HIKVISION Camera Password',
  kb_article_category: 'troubleshooting', // installation | troubleshooting | maintenance | warranty | faq
  kb_article_product: 'HIKVISION Cameras',
  kb_article_helpful: null,           // Updated on feedback: true | false | null (not yet rated)
  page_language: 'en',
});

// EVENT: kb_search
gtag('event', 'kb_search', {
  search_term: 'camera night vision not working',
  search_result_count: 3,
  search_no_results: false,
  page_language: 'en',
});

// EVENT: kb_feedback — Knowledge base article feedback
gtag('event', 'kb_feedback', {
  kb_article_title: 'How to Reset HIKVISION Camera Password',
  feedback_value: 'helpful',          // helpful | not_helpful
  page_language: 'en',
});
```

---

## 13. Ecommerce Events

### 13.1 STANDARD ECOMMERCE EVENTS (B2B Portal)

```javascript
// EVENT: view_item_list — B2B product catalog
gtag('event', 'view_item_list', {
  item_list_id: 'b2b_catalog',
  item_list_name: 'B2B Product Catalog',
  items: [
    {
      item_id: 'CT1000T500SSD8',
      item_name: 'Crucial T500 1TB NVMe SSD',
      item_brand: 'Crucial',
      item_category: 'Storage',
      item_list_id: 'b2b_catalog',
      index: 0,
      price: 285.00,
      currency: 'AED',
    },
    // ... more items
  ],
  page_language: 'en',
});

// EVENT: add_to_cart — B2B add to order/RFQ list
gtag('event', 'add_to_cart', {
  currency: 'AED',
  value: 285.00,
  items: [
    {
      item_id: 'CT1000T500SSD8',
      item_name: 'Crucial T500 1TB NVMe SSD',
      item_brand: 'Crucial',
      item_category: 'Storage',
      price: 285.00,
      quantity: 50,
      currency: 'AED',
    },
  ],
  page_language: 'en',
});

// EVENT: purchase — B2B order completed (sent server-side)
gtag('event', 'purchase', {
  transaction_id: 'ORD-20260502-0001',
  value: 25000.00,
  tax: 1190.48,                       // 5% UAE VAT
  shipping: 0.00,
  currency: 'AED',
  coupon: '',
  items: [
    {
      item_id: 'CT1000T500SSD8',
      item_name: 'Crucial T500 1TB NVMe SSD',
      item_brand: 'Crucial',
      item_category: 'Storage',
      price: 285.00,
      quantity: 50,
      currency: 'AED',
    },
  ],
  page_language: 'en',
});
```

---

## 14. User Properties & Custom Dimensions

### 14.1 USER PROPERTIES (set once per user)

| Property Name | Scope | Values | Description |
|--------------|-------|--------|-------------|
| `preferred_language` | User | `en`, `ar`, `fr`, `ru` | User's selected language |
| `user_type` | User | `anonymous`, `b2b_customer`, `b2b_prospect`, `partner` | User account type |
| `b2b_company_industry` | User | Industry values | Only for B2B users |
| `b2b_account_approved` | User | `true`, `false` | B2B account status |
| `country_detected` | User | ISO 3166-1 alpha-2 | Geo-detected country |

```javascript
// Set user properties
gtag('set', 'user_properties', {
  preferred_language: 'en',
  user_type: 'b2b_customer',
  b2b_company_industry: 'it_distribution',
  b2b_account_approved: true,
  country_detected: 'AE',
});
```

### 14.2 CUSTOM DIMENSIONS (Event-Scoped)

| Dimension Name | Event Parameter | Description |
|---------------|----------------|-------------|
| Page Category | `page_category` | homepage, product, catalog, erp, about, contact, support, b2b, blog |
| Page Language | `page_language` | en, ar, fr, ru |
| Product Brand | `product_brand` | HIKVISION, Crucial, TEAMGROUP, etc. |
| Product Category | `product_category` | Cameras, Storage, Memory, Monitors, etc. |
| Form ID | `form_id` | contact, rfq, demo, newsletter, partner, job, support |
| ERP Module | `erp_module` | accounting, crm, sales, inventory, hr, etc. |
| Visitor Segment | `visitor_segment` | first_time_visitor, returning_visitor, high_intent_b2b, erp_explorer, existing_customer |
| Chat Intent | `message_intent` | INT-PROD, INT-ERP, INT-SUPP, INT-GEN, INT-PART, INT-AGENT |

---

## 15. dataLayer Implementation Patterns

### 15.1 STANDARD dataLayer.push() PATTERN

```javascript
// Always ensure dataLayer array exists
window.dataLayer = window.dataLayer || [];

// Push event with all parameters
window.dataLayer.push({
  event: 'product_view',
  product_name: 'Crucial T500 1TB NVMe PCIe Gen4 SSD',
  product_sku: 'CT1000T500SSD8',
  product_brand: 'Crucial',
  product_category: 'Storage',
  product_price_aed: 345.00,
  product_in_stock: true,
  page_language: 'en',
});
```

### 15.2 GTM-COMPATIBLE dataLayer STRUCTURE

```javascript
// For Google Tag Manager compatibility, use 'ecommerce' key for ecommerce events
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: 'AED',
    value: 345.00,
    items: [
      {
        item_id: 'CT1000T500SSD8',
        item_name: 'Crucial T500 1TB NVMe SSD',
        item_brand: 'Crucial',
        item_category: 'Storage',
        price: 345.00,
        quantity: 1,
      },
    ],
  },
});
```

### 15.3 GLOBAL dataLayer INITIALIZATION

```html
<!-- Place BEFORE GTM snippet -->
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    page_category: 'product',
    page_template: 'detail',
    language: 'en',
    user_type: 'anonymous',
    country_detected: 'AE',
  });
</script>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-SMLXXXXX');</script>
```

---

## 16. Event Debugging & Validation

### 16.1 DEBUGGING CHECKLIST

| # | Check | Tool |
|---|-------|------|
| 1 | Events appear in GA4 DebugView | GA4 → Admin → DebugView |
| 2 | Parameters are spelled correctly (no typos) | DebugView → click event → view parameters |
| 3 | No duplicate events on single action | DebugView → check event count |
| 4 | `page_language` always populated | DebugView → filter by missing parameter |
| 5 | Ecommerce events have `items` array | DebugView → verify items presence |
| 6 | Conversion events fire only once per submission | DebugView → check for duplicates |
| 7 | `value` and `currency` match on ecommerce events | DebugView → cross-check parameters |
| 8 | User properties visible in User Explorer | GA4 → Explore → User Explorer |

### 16.2 BROWSER CONSOLE DEBUGGING

```javascript
// Monitor all dataLayer pushes in console
(function() {
  const originalPush = window.dataLayer.push;
  window.dataLayer.push = function() {
    console.log('[dataLayer]', arguments[0]);
    return originalPush.apply(this, arguments);
  };
})();

// Test individual events
window.dataLayer.push({
  event: 'test_product_view',
  product_sku: 'TEST-001',
  product_brand: 'TestBrand',
  page_language: 'en',
});
// Check GA4 DebugView for 'test_product_view'
```

### 16.3 GA4 MEASUREMENT PROTOCOL VALIDATION

```bash
# Validate events via Measurement Protocol debug endpoint
curl -X POST "https://www.google-analytics.com/debug/mp/collect?measurement_id=G-SMLXXXXXXX&api_secret=SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test-client-123",
    "events": [{
      "name": "rfq_submit",
      "params": {
        "form_id": "rfq",
        "product_count": 3,
        "page_language": "en"
      }
    }]
  }'
```

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| GTM Container Config | [02_GTM_Container_Configuration.md](./02_GTM_Container_Configuration.md) |
| Conversion Tracking | [03_Conversion_Tracking_Setup.md](./03_Conversion_Tracking_Setup.md) |
| Form Configurations | [../17_Forms_Data_Collection/01_Contact_Form_Configuration.md](../17_Forms_Data_Collection/01_Contact_Form_Configuration.md) |
| Chat Greeting Config | [../19_Chatbot_Live_Chat/01_Intercom_Chat_Greeting.md](../19_Chatbot_Live_Chat/01_Intercom_Chat_Greeting.md) |

---

*Simal Technologies Middle East LLC — GA4 Event Schema & Measurement Plan — CONFIDENTIAL*