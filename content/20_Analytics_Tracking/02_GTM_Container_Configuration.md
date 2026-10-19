# 02 — GTM Container Configuration (Tags, Triggers, Variables)

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Complete Google Tag Manager (GTM) container configuration for the Simal Technologies corporate website. Covers all tags (GA4, Meta Pixel, LinkedIn Insight Tag, Microsoft Clarity, Intercom, reCAPTCHA), trigger definitions, custom JavaScript and dataLayer variables, built-in variable configuration, folder structure, export/import procedures, and testing protocols.  
> **Platform:** Google Tag Manager (Container ID: GTM-SMLXXXXX)  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Container Overview](#1-container-overview)
2. [GTM Installation Snippet](#2-gtm-installation-snippet)
3. [Folder Structure](#3-folder-structure)
4. [Built-In Variables](#4-built-in-variables)
5. [User-Defined Variables](#5-user-defined-variables)
6. [Tag Inventory](#6-tag-inventory)
7. [Trigger Inventory](#7-trigger-inventory)
8. [Tag-Trigger Mapping Matrix](#8-tag-trigger-mapping-matrix)
9. [Third-Party Tag Configurations](#9-third-party-tag-configurations)
10. [Consent Mode & Cookie Compliance](#10-consent-mode--cookie-compliance)
11. [Container Export/Import & Version Control](#11-container-exportimport--version-control)
12. [Testing & Debugging](#12-testing--debugging)

---

## 1. Container Overview

### 1.1 CONTAINER IDENTITY

| Attribute | Value |
|-----------|-------|
| **Container ID** | `GTM-SMLXXXXX` (placeholder — replace with actual) |
| **Container Name** | Simal Technologies — Corporate Website |
| **Container Type** | Web |
| **Default URL** | `https://simalme.com` |
| **Environments** | Live (default), Staging, Development |
| **Load Method** | Standard (synchronous snippet in `<head>` and `<body>`) |

### 1.2 PLATFORM TAGS MANAGED

| # | Platform | Purpose | Tag Type |
|---|----------|---------|----------|
| 1 | **Google Analytics 4** | Web analytics, conversions, audiences | GA4 Configuration + GA4 Event |
| 2 | **Meta Pixel (Facebook/Instagram)** | Ad conversion tracking, retargeting audiences | Custom HTML |
| 3 | **LinkedIn Insight Tag** | B2B ad conversion tracking, website demographics | Custom HTML |
| 4 | **Microsoft Clarity** | Heatmaps, session recordings, rage clicks | Custom HTML |
| 5 | **Intercom** | Live chat & customer messaging | Custom HTML |
| 6 | **Google reCAPTCHA v3** | Bot protection (loaded via GTM for control) | Custom HTML |
| 7 | **Google Ads Conversion** | Google Ads conversion tracking (B2B leads) | Google Ads Conversion Tracking |
| 8 | **Google Ads Remarketing** | Remarketing audience building | Google Ads Remarketing |

---

## 2. GTM Installation Snippet

### 2.1 PRODUCTION SNIPPET

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-SMLXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) — place immediately after opening <body> -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-SMLXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### 2.2 dataLayer INITIALIZATION (BEFORE GTM SNIPPET)

```html
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    page_category: 'homepage',
    page_template: 'landing',
    language: 'en',
    user_type: 'anonymous',
    country_detected: 'AE',
    consent_default: {
      ad_storage: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
    },
  });
</script>
```

---

## 3. Folder Structure

### 3.1 GTM CONTAINER FOLDER LAYOUT

```
GTM Container: Simal Technologies
│
├── 📁 00_Core
│   ├── 📁 Variables (Core dataLayer & JS variables)
│   ├── 📁 Triggers (Page view, DOM ready, timer, scroll)
│   └── 📁 Consent (Consent mode tags & triggers)
│
├── 📁 01_GA4
│   ├── 📁 Tags (GA4 Config, all GA4 Event tags)
│   ├── 📁 Triggers (Custom Event triggers matching GA4 events)
│   └── 📁 Variables (GA4-specific variables)
│
├── 📁 02_Meta_Pixel
│   ├── 📁 Tags (Meta Pixel Base + Event tags)
│   ├── 📁 Triggers (Meta-specific triggers)
│   └── 📁 Variables (Meta Pixel ID, event mappings)
│
├── 📁 03_LinkedIn
│   ├── 📁 Tags (LinkedIn Insight Tag + Event tags)
│   └── 📁 Triggers (LinkedIn event triggers)
│
├── 📁 04_Microsoft_Clarity
│   ├── 📁 Tags (Clarity base tag)
│   └── 📁 Triggers (All Pages trigger)
│
├── 📁 05_Intercom
│   ├── 📁 Tags (Intercom base + update tags)
│   └── 📁 Triggers (Page-specific Intercom triggers)
│
├── 📁 06_Google_Ads
│   ├── 📁 Tags (Conversion + Remarketing tags)
│   └── 📁 Triggers (Conversion triggers)
│
├── 📁 07_reCAPTCHA
│   ├── 📁 Tags (reCAPTCHA loader)
│   └── 📁 Triggers (Form page triggers)
│
└── 📁 99_Testing
    ├── 📁 Tags (Test/debug tags — paused in Live)
    └── 📁 Triggers (Test triggers)
```

---

## 4. Built-In Variables

### 4.1 ENABLED BUILT-IN VARIABLES

| Variable Category | Variables Enabled |
|------------------|-------------------|
| **Page** | Page Hostname, Page Path, Page URL, Referrer |
| **Utilities** | Event, Container ID, Container Version, Environment Name, HTML ID, Random Number |
| **Errors** | Error Message, Error URL, Error Line, Debug Mode |
| **Clicks** | Click Element, Click Classes, Click ID, Click Target, Click Text, Click URL |
| **Forms** | Form Element, Form Classes, Form ID, Form Target, Form Text, Form URL |
| **Scrolling** | Scroll Depth Threshold, Scroll Depth Units, Scroll Direction |
| **Video** | Video Provider, Video Status, Video URL, Video Title, Video Duration, Video Current Time, Video Percent, Video Visible |
| **Visibility** | Visibility State |

---

## 5. User-Defined Variables

### 5.1 DATALAYER VARIABLES

| Variable Name | Type | dataLayer Key | Default Value | Description |
|--------------|------|---------------|---------------|-------------|
| `DLV_page_category` | Data Layer | `page_category` | `general` | Page category |
| `DLV_page_template` | Data Layer | `page_template` | `general` | Page template type |
| `DLV_language` | Data Layer | `language` | `en` | Current language |
| `DLV_user_type` | Data Layer | `user_type` | `anonymous` | User account type |
| `DLV_country_detected` | Data Layer | `country_detected` | `unknown` | Geo-detected country |
| `DLV_product_sku` | Data Layer | `product_sku` | `` | Product SKU |
| `DLV_product_brand` | Data Layer | `product_brand` | `` | Product brand |
| `DLV_product_category` | Data Layer | `product_category` | `` | Product category |
| `DLV_form_id` | Data Layer | `form_id` | `` | Form identifier |
| `DLV_page_language` | Data Layer | `page_language` | `en` | Page language (event level) |

### 5.2 JAVASCRIPT VARIABLES

| Variable Name | Type | Code | Description |
|--------------|------|------|-------------|
| `JS_page_category` | Custom JS | `function() { /* dynamic page category detection */ }` | Falls back if dataLayer not set |
| `JS_business_hours` | Custom JS | `function() { /* check if within business hours */ }` | Returns `true` or `false` |
| `JS_visitor_segment` | Custom JS | `function() { /* segment visitor based on behavior */ }` | Returns segment key |
| `JS_ga4_client_id` | Custom JS | `function() { return ga.getAll()[0].get('clientId'); }` | GA4 Client ID for server-side |
| `JS_ga4_session_id` | Custom JS | `function() { return ga.getAll()[0].get('sessionId'); }` | GA4 Session ID |

### 5.3 CONSTANT VARIABLES

| Variable Name | Type | Value | Description |
|--------------|------|-------|-------------|
| `CONST_ga4_measurement_id` | Constant | `G-SMLXXXXXXX` | GA4 Measurement ID |
| `CONST_meta_pixel_id` | Constant | `SIM_META_PIXEL_ID` | Meta Pixel ID |
| `CONST_linkedin_partner_id` | Constant | `SIM_LINKEDIN_PID` | LinkedIn Partner ID |
| `CONST_clarity_project_id` | Constant | `SIM_CLARITY_ID` | Microsoft Clarity Project ID |
| `CONST_intercom_app_id` | Constant | `SIM_INTERCOM_APP_ID` | Intercom App ID |
| `CONST_google_ads_conversion_id` | Constant | `AW-SIM_CONV_ID` | Google Ads Conversion ID |
| `CONST_recaptcha_site_key` | Constant | `6Lc...SIM_SITE_KEY` | reCAPTCHA v3 Site Key |

### 5.4 REGEX TABLE VARIABLES

| Variable Name | Type | Pattern | Description |
|--------------|------|---------|-------------|
| `REGEX_product_page` | RegEx Table | `/^\/products\/[^\/]+\/[^\/]+/` | Matches product detail pages |
| `REGEX_erp_page` | RegEx Table | `/^\/erp\//` | Matches ERP section pages |
| `REGEX_b2b_page` | RegEx Table | `/^\/b2b\//` | Matches B2B portal pages |
| `REGEX_blog_page` | RegEx Table | `/^\/blog\//` | Matches blog pages |

---

## 6. Tag Inventory

### 6.1 GA4 TAGS

| # | Tag Name | Tag Type | Firing Trigger | Folder |
|---|----------|----------|---------------|--------|
| GA4-01 | **GA4 — Configuration** | GA4 Configuration | All Pages | 01_GA4/Tags |
| GA4-02 | **GA4 — page_view Enhanced** | GA4 Event | All Pages (after Config) | 01_GA4/Tags |
| GA4-03 | **GA4 — product_view** | GA4 Event | Custom Event: `product_view` | 01_GA4/Tags |
| GA4-04 | **GA4 — product_compare** | GA4 Event | Custom Event: `product_compare` | 01_GA4/Tags |
| GA4-05 | **GA4 — catalog_filter** | GA4 Event | Custom Event: `catalog_filter` | 01_GA4/Tags |
| GA4-06 | **GA4 — search_perform** | GA4 Event | Custom Event: `search_perform` | 01_GA4/Tags |
| GA4-07 | **GA4 — erp_module_view** | GA4 Event | Custom Event: `erp_module_view` | 01_GA4/Tags |
| GA4-08 | **GA4 — erp_pricing_view** | GA4 Event | Custom Event: `erp_pricing_view` | 01_GA4/Tags |
| GA4-09 | **GA4 — erp_industry_view** | GA4 Event | Custom Event: `erp_industry_view` | 01_GA4/Tags |
| GA4-10 | **GA4 — form_start** | GA4 Event | Custom Event: `form_start` | 01_GA4/Tags |
| GA4-11 | **GA4 — form_progress** | GA4 Event | Custom Event: `form_progress` | 01_GA4/Tags |
| GA4-12 | **GA4 — form_validation_error** | GA4 Event | Custom Event: `form_validation_error` | 01_GA4/Tags |
| GA4-13 | **GA4 — form_abandon** | GA4 Event | Custom Event: `form_abandon` | 01_GA4/Tags |
| GA4-14 | **GA4 — rfq_submit** | GA4 Event | Custom Event: `rfq_submit` | 01_GA4/Tags |
| GA4-15 | **GA4 — demo_request** | GA4 Event | Custom Event: `demo_request` | 01_GA4/Tags |
| GA4-16 | **GA4 — newsletter_signup** | GA4 Event | Custom Event: `newsletter_signup` | 01_GA4/Tags |
| GA4-17 | **GA4 — partner_application** | GA4 Event | Custom Event: `partner_application` | 01_GA4/Tags |
| GA4-18 | **GA4 — job_application** | GA4 Event | Custom Event: `job_application` | 01_GA4/Tags |
| GA4-19 | **GA4 — support_ticket_submit** | GA4 Event | Custom Event: `support_ticket_submit` | 01_GA4/Tags |
| GA4-20 | **GA4 — chat_shown** | GA4 Event | Custom Event: `chat_shown` | 01_GA4/Tags |
| GA4-21 | **GA4 — chat_opened** | GA4 Event | Custom Event: `chat_opened` | 01_GA4/Tags |
| GA4-22 | **GA4 — chat_message_sent** | GA4 Event | Custom Event: `chat_message_sent` | 01_GA4/Tags |
| GA4-23 | **GA4 — chat_lead_captured** | GA4 Event | Custom Event: `chat_lead_captured` | 01_GA4/Tags |
| GA4-24 | **GA4 — phone_call_click** | GA4 Event | Custom Event: `phone_call_click` | 01_GA4/Tags |
| GA4-25 | **GA4 — whatsapp_click** | GA4 Event | Custom Event: `whatsapp_click` | 01_GA4/Tags |
| GA4-26 | **GA4 — content_download** | GA4 Event | Custom Event: `content_download` | 01_GA4/Tags |
| GA4-27 | **GA4 — blog_view** | GA4 Event | Custom Event: `blog_view` | 01_GA4/Tags |
| GA4-28 | **GA4 — kb_article_view** | GA4 Event | Custom Event: `kb_article_view` | 01_GA4/Tags |
| GA4-29 | **GA4 — b2b_login** | GA4 Event | Custom Event: `b2b_login` | 01_GA4/Tags |
| GA4-30 | **GA4 — b2b_registration** | GA4 Event | Custom Event: `b2b_registration` | 01_GA4/Tags |
| GA4-31 | **GA4 — b2b_order_placed** | GA4 Event | Custom Event: `b2b_order_placed` | 01_GA4/Tags |
| GA4-32 | **GA4 — engagement_scroll_depth** | GA4 Event | Custom Event: `engagement_scroll_depth` | 01_GA4/Tags |
| GA4-33 | **GA4 — engagement_time_on_page** | GA4 Event | Custom Event: `engagement_time_on_page` | 01_GA4/Tags |
| GA4-34 | **GA4 — language_switch** | GA4 Event | Custom Event: `language_switch` | 01_GA4/Tags |
| GA4-35 | **GA4 — nav_click** | GA4 Event | Custom Event: `nav_click` | 01_GA4/Tags |

### 6.2 META PIXEL TAGS

| # | Tag Name | Tag Type | Firing Trigger | Folder |
|---|----------|----------|---------------|--------|
| MP-01 | **Meta Pixel — Base Code** | Custom HTML | All Pages | 02_Meta_Pixel/Tags |
| MP-02 | **Meta — PageView** | Custom HTML | All Pages (after Base) | 02_Meta_Pixel/Tags |
| MP-03 | **Meta — ViewContent (Product)** | Custom HTML | Custom Event: `product_view` | 02_Meta_Pixel/Tags |
| MP-04 | **Meta — Lead (RFQ Submit)** | Custom HTML | Custom Event: `rfq_submit` | 02_Meta_Pixel/Tags |
| MP-05 | **Meta — Lead (Demo Request)** | Custom HTML | Custom Event: `demo_request` | 02_Meta_Pixel/Tags |
| MP-06 | **Meta — CompleteRegistration (B2B)** | Custom HTML | Custom Event: `b2b_registration` | 02_Meta_Pixel/Tags |
| MP-07 | **Meta — Subscribe (Newsletter)** | Custom HTML | Custom Event: `newsletter_signup` | 02_Meta_Pixel/Tags |

### 6.3 LINKEDIN TAGS

| # | Tag Name | Tag Type | Firing Trigger | Folder |
|---|----------|----------|---------------|--------|
| LI-01 | **LinkedIn — Insight Tag Base** | Custom HTML | All Pages | 03_LinkedIn/Tags |
| LI-02 | **LinkedIn — Event: Product View** | Custom HTML | Custom Event: `product_view` | 03_LinkedIn/Tags |
| LI-03 | **LinkedIn — Event: RFQ Submit (Conversion)** | Custom HTML | Custom Event: `rfq_submit` | 03_LinkedIn/Tags |
| LI-04 | **LinkedIn — Event: Demo Request (Conversion)** | Custom HTML | Custom Event: `demo_request` | 03_LinkedIn/Tags |
| LI-05 | **LinkedIn — Event: Partner Application** | Custom HTML | Custom Event: `partner_application` | 03_LinkedIn/Tags |
| LI-06 | **LinkedIn — Event: Content Download** | Custom HTML | Custom Event: `content_download` | 03_LinkedIn/Tags |

### 6.4 OTHER PLATFORM TAGS

| # | Tag Name | Tag Type | Firing Trigger | Folder |
|---|----------|----------|---------------|--------|
| MC-01 | **Microsoft Clarity** | Custom HTML | All Pages | 04_Microsoft_Clarity |
| IC-01 | **Intercom — Install** | Custom HTML | All Pages | 05_Intercom |
| IC-02 | **Intercom — Update Context** | Custom HTML | DOM Ready | 05_Intercom |
| GA-01 | **Google Ads — RFQ Conversion** | Google Ads Conversion | Custom Event: `rfq_submit` | 06_Google_Ads |
| GA-02 | **Google Ads — Demo Conversion** | Google Ads Conversion | Custom Event: `demo_request` | 06_Google_Ads |
| GA-03 | **Google Ads — Remarketing** | Google Ads Remarketing | All Pages | 06_Google_Ads |
| RC-01 | **reCAPTCHA v3 — Load** | Custom HTML | DOM Ready (form pages only) | 07_reCAPTCHA |

---

## 7. Trigger Inventory

### 7.1 PAGE VIEW TRIGGERS

| # | Trigger Name | Type | Conditions | Use |
|---|-------------|------|------------|-----|
| TRG-01 | **All Pages** | Page View | (none — fires on all pages) | GA4 Config, Meta Base, LinkedIn Base, Clarity, Intercom, Ads Remarketing |
| TRG-02 | **Product Detail Pages** | Page View | `Page Path matches REGEX_product_page` | Product-specific initializations |
| TRG-03 | **ERP Section Pages** | Page View | `Page Path matches REGEX_erp_page` | ERP-specific initializations |
| TRG-04 | **B2B Portal Pages** | Page View | `Page Path matches REGEX_b2b_page` | B2B-specific initializations |
| TRG-05 | **Blog Pages** | Page View | `Page Path matches REGEX_blog_page` | Blog-specific initializations |
| TRG-06 | **Form Pages** | Page View | `Page Path contains /contact/ OR /request-quote/ OR /demo/ OR /newsletter/ OR /partner/ OR /careers/ OR /support/` | reCAPTCHA loader |

### 7.2 CUSTOM EVENT TRIGGERS

| # | Trigger Name | Type | Event Name | Conditions |
|---|-------------|------|------------|------------|
| TRG-CE-01 | **CE — product_view** | Custom Event | `product_view` | (none) |
| TRG-CE-02 | **CE — product_compare** | Custom Event | `product_compare` | (none) |
| TRG-CE-03 | **CE — rfq_submit** | Custom Event | `rfq_submit` | (none) |
| TRG-CE-04 | **CE — demo_request** | Custom Event | `demo_request` | (none) |
| TRG-CE-05 | **CE — newsletter_signup** | Custom Event | `newsletter_signup` | (none) |
| TRG-CE-06 | **CE — partner_application** | Custom Event | `partner_application` | (none) |
| TRG-CE-07 | **CE — b2b_registration** | Custom Event | `b2b_registration` | (none) |
| TRG-CE-08 | **CE — content_download** | Custom Event | `content_download` | (none) |
| TRG-CE-09 | **CE — chat_lead_captured** | Custom Event | `chat_lead_captured` | (none) |
| TRG-CE-10 | **CE — b2b_order_placed** | Custom Event | `b2b_order_placed` | (none) |

### 7.3 DOM READY TRIGGERS

| # | Trigger Name | Type | Conditions |
|---|-------------|------|------------|
| TRG-DOM-01 | **DOM Ready — Intercom Update** | DOM Ready | (all pages) |
| TRG-DOM-02 | **DOM Ready — reCAPTCHA** | DOM Ready | Page Path matches form page patterns |

### 7.4 TIMER TRIGGERS

| # | Trigger Name | Type | Interval | Limit | Conditions |
|---|-------------|------|----------|-------|------------|
| TRG-TMR-01 | **Timer — 30s Engagement** | Timer | 30000 ms | Unlimited | Page Path does not contain `/checkout/` |

---

## 8. Tag-Trigger Mapping Matrix

### 8.1 COMPLETE MAPPING

```
TAG                          TRIGGER
─────────────────────────    ───────────────────────
GA4-01 (Config)           →  TRG-01 (All Pages)
GA4-02 (page_view Enh.)   →  TRG-01 (All Pages)
GA4-03 (product_view)     →  TRG-CE-01 (product_view)
GA4-04 (product_compare)  →  TRG-CE-02 (product_compare)
GA4-05 (catalog_filter)   →  Custom Event: catalog_filter
GA4-06 (search_perform)   →  Custom Event: search_perform
GA4-07 (erp_module_view)  →  Custom Event: erp_module_view
GA4-08 (erp_pricing_view) →  Custom Event: erp_pricing_view
GA4-10 (form_start)       →  Custom Event: form_start
GA4-14 (rfq_submit)       →  TRG-CE-03 (rfq_submit)
GA4-15 (demo_request)     →  TRG-CE-04 (demo_request)
GA4-16 (newsletter_s.)    →  TRG-CE-05 (newsletter_signup)
GA4-17 (partner_app.)     →  TRG-CE-06 (partner_application)
GA4-20 (chat_shown)       →  Custom Event: chat_shown
GA4-21 (chat_opened)      →  Custom Event: chat_opened
GA4-24 (phone_call_click) →  Custom Event: phone_call_click
GA4-25 (whatsapp_click)   →  Custom Event: whatsapp_click
GA4-26 (content_download) →  TRG-CE-08 (content_download)
GA4-29 (b2b_login)        →  Custom Event: b2b_login
GA4-30 (b2b_registration) →  TRG-CE-07 (b2b_registration)
GA4-31 (b2b_order_placed) →  TRG-CE-10 (b2b_order_placed)
GA4-34 (language_switch)  →  Custom Event: language_switch

MP-01 (Meta Base)         →  TRG-01 (All Pages)
MP-02 (Meta PageView)     →  TRG-01 (All Pages)
MP-03 (ViewContent Prod)  →  TRG-CE-01 (product_view)
MP-04 (Lead — RFQ)        →  TRG-CE-03 (rfq_submit)
MP-05 (Lead — Demo)       →  TRG-CE-04 (demo_request)
MP-06 (CompleteReg)       →  TRG-CE-07 (b2b_registration)
MP-07 (Subscribe)         →  TRG-CE-05 (newsletter_signup)

LI-01 (LinkedIn Base)     →  TRG-01 (All Pages)
LI-02 (Product View)      →  TRG-CE-01 (product_view)
LI-03 (RFQ Conversion)    →  TRG-CE-03 (rfq_submit)
LI-04 (Demo Conversion)   →  TRG-CE-04 (demo_request)
LI-05 (Partner App)       →  TRG-CE-06 (partner_application)
LI-06 (Content Download)  →  TRG-CE-08 (content_download)

MC-01 (Clarity)           →  TRG-01 (All Pages)
IC-01 (Intercom Install)  →  TRG-01 (All Pages)
IC-02 (Intercom Update)   →  TRG-DOM-01 (DOM Ready)

GA-01 (Ads — RFQ Conv)    →  TRG-CE-03 (rfq_submit)
GA-02 (Ads — Demo Conv)   →  TRG-CE-04 (demo_request)
GA-03 (Ads Remarketing)   →  TRG-01 (All Pages)

RC-01 (reCAPTCHA Load)    →  TRG-DOM-02 (DOM Ready — Form Pages)
```

---

## 9. Third-Party Tag Configurations

### 9.1 META PIXEL — BASE CODE (MP-01)

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{CONST_meta_pixel_id}}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={{CONST_meta_pixel_id}}&ev=PageView&noscript=1"
/></noscript>
```

### 9.2 META PIXEL — EVENT TAG EXAMPLE (MP-04: Lead — RFQ)

```html
<script>
fbq('track', 'Lead', {
  content_name: 'RFQ Submit',
  content_category: 'rfq',
  page_language: '{{DLV_page_language}}',
  product_count: '{{DLV_product_count}}',
}, { eventID: '{{Random Number}}' });
</script>
```

### 9.3 LINKEDIN INSIGHT TAG — BASE CODE (LI-01)

```html
<script type="text/javascript">
_linkedin_partner_id = "{{CONST_linkedin_partner_id}}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid={{CONST_linkedin_partner_id}}&fmt=gif" />
</noscript>
```

### 9.4 LINKEDIN — EVENT TAG (LI-03: RFQ Conversion)

```html
<script>
window.lintrk('track', { conversion_id: SIM_LI_RFQ_CONV_ID });
</script>
```

### 9.5 MICROSOFT CLARITY (MC-01)

```html
<script type="text/javascript">
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "{{CONST_clarity_project_id}}");
</script>
```

### 9.6 INTERCOM — INSTALL (IC-01)

```html
<script>
window.intercomSettings = {
  app_id: "{{CONST_intercom_app_id}}",
  language_override: "{{DLV_language}}",
  page_category: "{{DLV_page_category}}",
  user_type: "{{DLV_user_type}}",
};
</script>
<script>
(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){
ic('reattach_activator');ic('update',w.intercomSettings);
}else{var d=document;var i=function(){i.c(arguments);};i.q=[];
i.c=function(args){i.q.push(args);};w.Intercom=i;
var l=function(){var s=d.createElement('script');
s.type='text/javascript';s.async=true;
s.src='https://widget.intercom.io/widget/{{CONST_intercom_app_id}}';
var x=d.getElementsByTagName('script')[0];
x.parentNode.insertBefore(s,x);};
if(document.readyState==='complete'){l();}
else if(w.attachEvent){w.attachEvent('onload',l);}
else{w.addEventListener('load',l,false);}}})();
</script>
```

---

## 10. Consent Mode & Cookie Compliance

### 10.1 CONSENT MODE IMPLEMENTATION

```javascript
// Default consent state — set BEFORE GTM loads
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'granted',       // Analytics allowed by default (no PII)
  functionality_storage: 'granted',   // Functional cookies allowed
  personalization_storage: 'denied',  // Personalization denied by default
  security_storage: 'granted',        // Security cookies always allowed
  wait_for_update: 500,               // Wait up to 500ms for consent update
  region: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB'], // MENA region
});

// When user accepts cookies via consent banner:
// gtag('consent', 'update', {
//   ad_storage: 'granted',
//   personalization_storage: 'granted',
// });
```

### 10.2 UAE PDPL COMPLIANCE NOTES

| Requirement | Implementation |
|-------------|---------------|
| **Consent before tracking** | Consent banner displayed on first visit (CookieBot / OneTrust) |
| **Right to withdraw** | Cookie preferences accessible via footer link |
| **Data minimization** | No PII in GA4/analytics events (names, emails, phone numbers excluded) |
| **Data retention** | GA4 data retention set to 14 months (GA4 default maximum for non-360) |
| **IP anonymization** | Enabled by default in GA4 (no additional config needed) |
| **Cross-border transfer** | Google Analytics data stored in EU/US — disclosed in privacy policy |

---

## 11. Container Export/Import & Version Control

### 11.1 VERSION NAMING CONVENTION

```
Format: v{Major}.{Minor} — {Description}
Examples:
  v1.0 — Initial container setup with GA4 + Meta + LinkedIn
  v1.1 — Added Microsoft Clarity and Intercom tags
  v1.2 — Added all GA4 custom event tags
  v2.0 — Consent Mode v2 implementation
```

### 11.2 EXPORT COMMAND (via GTM API)

```bash
# Export container as JSON
curl -X GET "https://www.googleapis.com/tagmanager/v2/accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}/tags" \
  -H "Authorization: Bearer {access_token}" \
  -o gtm_tags_backup.json
```

### 11.3 PRE-PUBLISH CHECKLIST

| # | Check | Status |
|---|-------|--------|
| 1 | All tags have descriptive names | ☐ |
| 2 | All tags are in correct folders | ☐ |
| 3 | No tags firing on incorrect pages (test in Preview mode) | ☐ |
| 4 | GA4 DebugView shows expected events | ☐ |
| 5 | Meta Pixel Helper shows expected events | ☐ |
| 6 | LinkedIn Campaign Manager shows Insight Tag active | ☐ |
| 7 | No duplicate events (e.g., double page_view) | ☐ |
| 8 | Consent defaults correct in all regions | ☐ |
| 9 | Container size acceptable (< 200 KB recommended) | ☐ |
| 10 | Version description written | ☐ |

---

## 12. Testing & Debugging

### 12.1 GTM PREVIEW MODE

```text
1. Click "Preview" in GTM workspace
2. Enter website URL: https://simalme.com
3. Tag Assistant opens in new tab
4. Verify:
   - All expected tags fire on each page type
   - No unexpected tags fire
   - dataLayer contains correct values
   - Consent state is correct
```

### 12.2 BROWSER EXTENSIONS

| Extension | Purpose | Download |
|-----------|---------|----------|
| **Tag Assistant Companion** | GTM/GA4 debugging | Chrome Web Store |
| **GA4 Debugger** (by Analytics Mania) | GA4 event monitoring in console | Chrome Web Store |
| **Meta Pixel Helper** | Verify Meta Pixel events | Chrome Web Store |
| **LinkedIn Pixel Helper** | Verify LinkedIn Insight Tag | Chrome Web Store |
| **dataslayer** | View all dataLayer pushes | Chrome Web Store |

### 12.3 SMOKE TEST SCRIPT

```javascript
// Paste in browser console on each page type to verify
console.log('=== GTM Smoke Test ===');
console.log('dataLayer length:', window.dataLayer.length);
console.log('Last 5 dataLayer pushes:');
window.dataLayer.slice(-5).forEach((push, i) => {
  console.log(`  [${i}]`, push.event || '(no event)', JSON.stringify(push).substring(0, 120));
});
console.log('GTM loaded:', typeof google_tag_manager !== 'undefined');
console.log('GA4 loaded:', typeof gtag !== 'undefined');
console.log('Meta Pixel loaded:', typeof fbq !== 'undefined');
console.log('Intercom loaded:', typeof Intercom !== 'undefined');
```

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| GA4 Event Schema | [01_GA4_Event_Schema.md](./01_GA4_Event_Schema.md) |
| Conversion Tracking | [03_Conversion_Tracking_Setup.md](./03_Conversion_Tracking_Setup.md) |
| Form Configurations | [../17_Forms_Data_Collection/01_Contact_Form_Configuration.md](../17_Forms_Data_Collection/01_Contact_Form_Configuration.md) |
| Chat Greeting Config | [../19_Chatbot_Live_Chat/01_Intercom_Chat_Greeting.md](../19_Chatbot_Live_Chat/01_Intercom_Chat_Greeting.md) |

---

*Simal Technologies Middle East LLC — GTM Container Configuration — CONFIDENTIAL*