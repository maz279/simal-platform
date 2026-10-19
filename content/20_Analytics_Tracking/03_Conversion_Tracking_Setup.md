# 03 — Conversion Tracking Setup & Goal Definitions

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Complete conversion tracking configuration for the Simal Technologies corporate website. Covers conversion goal definitions, value assignments, GA4 conversion events, Google Ads conversion actions, Meta (Facebook/Instagram) Standard Events & Custom Conversions, LinkedIn Conversion Tracking, server-side conversion validation via Measurement Protocol, multi-touch attribution models, and conversion reporting dashboards.  
> **Platform:** GA4 + Google Ads + Meta Ads + LinkedIn Ads + HubSpot CRM  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Conversion Strategy Overview](#1-conversion-strategy-overview)
2. [Conversion Goal Hierarchy](#2-conversion-goal-hierarchy)
3. [GA4 Conversion Events](#3-ga4-conversion-events)
4. [Google Ads Conversion Tracking](#4-google-ads-conversion-tracking)
5. [Meta (Facebook/Instagram) Conversion Tracking](#5-meta-facebookinstagram-conversion-tracking)
6. [LinkedIn Conversion Tracking](#6-linkedin-conversion-tracking)
7. [Server-Side Conversion Validation](#7-server-side-conversion-validation)
8. [Attribution Models](#8-attribution-models)
9. [Conversion Value Assignment](#9-conversion-value-assignment)
10. [Offline Conversion Import (HubSpot → Ads)](#10-offline-conversion-import-hubspot--ads)
11. [Conversion Reporting Dashboards](#11-conversion-reporting-dashboards)
12. [Conversion Health Monitoring](#12-conversion-health-monitoring)

---

## 1. Conversion Strategy Overview

### 1.1 CONVERSION FUNNEL

```
AWARENESS ─────► CONSIDERATION ─────► CONVERSION ─────► RETENTION
                                                         
Organic Search    Product Page View    RFQ Submit        B2B Repeat Order
Social Media      Catalog Browse       Demo Request      Support Ticket
Paid Ads          ERP Module Explore   Partner Apply     Newsletter Open
Referral          Blog Read            Newsletter Signup Chat Engagement
Direct            Content Download     B2B Registration  Account Login
                  Video Watch          Phone/WhatsApp    KB Article Use
─────────────────────────────────────────────────────────────────────
MICRO-CONVERSIONS                  MACRO-CONVERSIONS
(Leading Indicators)               (Business Outcomes)
```

### 1.2 PLATFORM COVERAGE

| Conversion Event | GA4 | Google Ads | Meta (FB/IG) | LinkedIn | HubSpot |
|-----------------|-----|------------|-------------|----------|---------|
| RFQ Submit | ✅ Primary | ✅ Primary | ✅ Lead | ✅ Lead | ✅ Deal Created |
| Demo Request | ✅ Primary | ✅ Primary | ✅ Lead | ✅ Lead | ✅ Deal Created |
| B2B Registration | ✅ Primary | ✅ — | ✅ CompleteReg | ✅ — | ✅ Contact Created |
| Partner Application | ✅ Primary | ✅ — | ✅ Lead | ✅ Lead | ✅ Contact Created |
| Newsletter Signup | ✅ Secondary | ✅ — | ✅ Subscribe | ✅ — | ✅ Contact Created |
| Support Ticket | ✅ Secondary | — | — | — | ✅ Ticket Created |
| Job Application | ✅ Secondary | — | — | — | ✅ Contact Created |
| Phone Call Click | ✅ Micro | ✅ Micro | — | — | — |
| WhatsApp Click | ✅ Micro | ✅ Micro | — | — | — |
| Content Download | ✅ Micro | — | — | ✅ Lead | ✅ Contact Updated |
| B2B Order Placed | ✅ Primary | ✅ Purchase | ✅ Purchase | — | ✅ Deal Won |

---

## 2. Conversion Goal Hierarchy

### 2.1 PRIMARY CONVERSIONS (Revenue-Driving)

| # | Conversion Name | GA4 Event | Business Value | Target (Monthly) |
|---|----------------|-----------|---------------|-----------------|
| C01 | **RFQ Submitted** | `rfq_submit` | Direct revenue pipeline — each RFQ = potential B2B order | 50+ |
| C02 | **UniERP Demo Requested** | `demo_request` | Software revenue pipeline — demos convert at ~25% to deal | 30+ |
| C03 | **B2B Account Registration** | `b2b_registration` | Long-term customer acquisition | 20+ |
| C04 | **Partner Application** | `partner_application` | Channel expansion | 10+ |
| C05 | **B2B Order Placed** | `b2b_order_placed` | Direct revenue | 40+ |

### 2.2 SECONDARY CONVERSIONS (Engagement / Nurture)

| # | Conversion Name | GA4 Event | Business Value |
|---|----------------|-----------|---------------|
| C06 | **Newsletter Signup** | `newsletter_signup` | Lead nurturing — email marketing pipeline |
| C07 | **Support Ticket Created** | `support_ticket_submit` | Customer retention & satisfaction |
| C08 | **Job Application** | `job_application` | Talent acquisition |

### 2.3 MICRO-CONVERSIONS (Leading Indicators)

| # | Conversion Name | GA4 Event | Significance |
|---|----------------|-----------|-------------|
| C09 | **Phone Call Click** | `phone_call_click` | High-intent direct contact |
| C10 | **WhatsApp Click** | `whatsapp_click` | High-intent messaging contact |
| C11 | **Content Download** | `content_download` | Research/interest signal |
| C12 | **Chat Lead Captured** | `chat_lead_captured` | Chat-based lead generation |

---

## 3. GA4 Conversion Events

### 3.1 CONVERSION EVENT CONFIGURATION

| Event Name | Mark as Conversion | Conversion Value | Counting Method | Attribution Model |
|-----------|-------------------|-----------------|-----------------|-------------------|
| `rfq_submit` | ✅ Yes | AED 500 (estimated pipeline value) | Once per session | Data-Driven |
| `demo_request` | ✅ Yes | AED 1,000 (higher intent) | Once per session | Data-Driven |
| `b2b_registration` | ✅ Yes | AED 300 | Once per session | Data-Driven |
| `partner_application` | ✅ Yes | AED 2,000 (channel value) | Once per session | Data-Driven |
| `b2b_order_placed` | ✅ Yes | Dynamic (actual order value) | Once per event | Data-Driven |
| `newsletter_signup` | ✅ Yes | AED 20 (email subscriber LTV) | Once per session | Data-Driven |
| `support_ticket_submit` | ⬜ No (retention, not acquisition) | AED 0 | — | — |
| `job_application` | ⬜ No | AED 0 | — | — |
| `phone_call_click` | ⬜ No | AED 50 (micro-conversion) | Once per session | — |
| `whatsapp_click` | ⬜ No | AED 50 (micro-conversion) | Once per session | — |
| `content_download` | ⬜ No | AED 25 (engagement value) | Once per session | — |
| `chat_lead_captured` | ⬜ No | AED 75 (chat lead value) | Once per session | — |

### 3.2 CONFIGURATION IN GA4 UI

```text
GA4 Admin → Events → Conversions

1. Click "New conversion event"
2. Enter event name (e.g., "rfq_submit")
3. Save
4. Repeat for all primary + secondary conversion events
```

### 3.3 DUPLICATE CONVERSION PREVENTION

```javascript
// Prevent duplicate conversion counting (client-side)
const CONVERSION_SESSION_KEY = 'simal_conversions_fired';

function shouldFireConversion(eventName) {
  const fired = JSON.parse(sessionStorage.getItem(CONVERSION_SESSION_KEY) || '{}');

  // Allow b2b_order_placed to fire multiple times (each order is unique)
  if (eventName === 'b2b_order_placed') return true;

  if (fired[eventName]) {
    console.warn(`[Conversion] ${eventName} already counted this session. Skipping duplicate.`);
    return false;
  }

  fired[eventName] = true;
  sessionStorage.setItem(CONVERSION_SESSION_KEY, JSON.stringify(fired));
  return true;
}

// Usage:
if (shouldFireConversion('rfq_submit')) {
  dataLayer.push({ event: 'rfq_submit', ...params });
}
```

---

## 4. Google Ads Conversion Tracking

### 4.1 CONVERSION ACTIONS

| Conversion Action | Category | Value | Count | Attribution Window | Tag in GTM |
|-------------------|----------|-------|-------|-------------------|------------|
| **RFQ Submit (Ads)** | Lead | AED 500 | One | 30 days | GA-01 |
| **Demo Request (Ads)** | Lead | AED 1,000 | One | 30 days | GA-02 |
| **B2B Order (Ads)** | Purchase | Dynamic | Every | 30 days | GA-03 (server-side) |
| **Phone Call (Ads)** | Phone Call | AED 50 | One | 30 days | (via GA4 import) |
| **WhatsApp Click (Ads)** | Lead | AED 50 | One | 30 days | (via GA4 import) |

### 4.2 GOOGLE ADS CONVERSION TAG (via GTM)

```html
<!-- GA-01: Google Ads — RFQ Conversion -->
<script>
gtag('event', 'conversion', {
  'send_to': '{{CONST_google_ads_conversion_id}}/SIM_RFQ_CONV_LABEL',
  'value': 500.00,
  'currency': 'AED',
  'transaction_id': 'rfq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
});
</script>
```

### 4.3 GOOGLE ADS CONVERSION IMPORT FROM GA4

```text
Google Ads → Tools → Measurement → Conversions
→ "+ New conversion action"
→ "Import" → "Google Analytics 4 properties"
→ Select the following events:
   ✅ rfq_submit
   ✅ demo_request
   ✅ b2b_registration
   ✅ b2b_order_placed
→ Import and continue
```

---

## 5. Meta (Facebook/Instagram) Conversion Tracking

### 5.1 STANDARD EVENTS vs CUSTOM CONVERSIONS

| Conversion | Meta Standard Event | Custom Conversion Rule |
|-----------|-------------------|----------------------|
| RFQ Submit | `Lead` | Event: `rfq_submit` (URL-based or custom event) |
| Demo Request | `Lead` | Event: `demo_request` |
| B2B Registration | `CompleteRegistration` | Event: `b2b_registration` / URL: `/b2b/register/thank-you` |
| Newsletter Signup | `Subscribe` | Event: `newsletter_signup` |
| Product View | `ViewContent` | Event: `product_view` |
| B2B Order | `Purchase` | Event: `b2b_order_placed` |

### 5.2 META PIXEL EVENT CODE

```html
<!-- MP-04: Meta — Lead (RFQ Submit) -->
<script>
fbq('track', 'Lead', {
  content_name: 'RFQ Submit',
  content_category: 'rfq',
  value: 500.00,
  currency: 'AED',
  page_language: '{{DLV_page_language}}',
}, { eventID: '{{Random Number}}' });
</script>

<!-- MP-06: Meta — CompleteRegistration (B2B) -->
<script>
fbq('track', 'CompleteRegistration', {
  content_name: 'B2B Registration',
  value: 300.00,
  currency: 'AED',
  status: true,
}, { eventID: '{{Random Number}}' });
</script>

<!-- MP-07: Meta — Subscribe (Newsletter) -->
<script>
fbq('track', 'Subscribe', {
  content_name: 'Newsletter Signup',
  value: 20.00,
  currency: 'AED',
}, { eventID: '{{Random Number}}' });
</script>
```

### 5.3 META CONVERSIONS API (Server-Side — Recommended)

```javascript
// Server-side Meta Conversions API call
// Ensures conversion tracking works despite ad blockers
async function sendMetaServerEvent(eventName, eventData, userData) {
  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: `simal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_source_url: eventData.page_url,
      user_data: {
        client_ip_address: userData.ip,
        client_user_agent: userData.user_agent,
        em: userData.email_hashed ? [userData.email_hashed] : [],
        ph: userData.phone_hashed ? [userData.phone_hashed] : [],
        external_id: userData.client_id ? [userData.client_id] : [],
        fbc: userData.fbc || '',
        fbp: userData.fbp || '',
      },
      custom_data: {
        currency: 'AED',
        value: eventData.value || 0,
        content_name: eventData.content_name || '',
        content_category: eventData.content_category || '',
      },
    }],
    // Test event code — remove for production
    test_event_code: process.env.NODE_ENV === 'production' ? undefined : 'TEST_SIMAL',
  };

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return response.json();
}

// Usage: Call after form submission server-side
// await sendMetaServerEvent('Lead', { value: 500, content_name: 'RFQ Submit', page_url: '...' }, { ip, user_agent, email_hashed, client_id });
```

---

## 6. LinkedIn Conversion Tracking

### 6.1 LINKEDIN CONVERSION DEFINITIONS

| Conversion | LinkedIn Event | Conversion Rule |
|-----------|---------------|-----------------|
| RFQ Submit | Lead (Conversion) | Event: `rfq_submit` |
| Demo Request | Lead (Conversion) | Event: `demo_request` |
| Partner Application | Lead (Conversion) | Event: `partner_application` |
| Content Download | Lead | Event: `content_download` |

### 6.2 LINKEDIN EVENT CODE (via GTM)

```html
<!-- LI-03: LinkedIn — RFQ Submit (Conversion) -->
<script>
window.lintrk('track', { conversion_id: SIM_LINKEDIN_RFQ_CONV_ID });
</script>
```

### 6.3 LINKEDIN CONVERSION SETUP — CAMPAIGN MANAGER

```text
LinkedIn Campaign Manager → Analyze → Conversions
→ "Create a conversion"
→ Conversion type: "Website event"
→ Method: "Insight Tag event"
→ Event name: "rfq_submit"
→ Attribution window: 30-day click / 7-day view
→ Conversion value: Fixed AED 500 (RFQ) / AED 1,000 (Demo)
→ Save
```

---

## 7. Server-Side Conversion Validation

### 7.1 WHY SERVER-SIDE VALIDATION?

| Risk | Client-Side Only Issue | Server-Side Fix |
|------|----------------------|-----------------|
| **Ad blockers** | ~25-40% of conversion events blocked | Server-side API calls not blocked |
| **Page navigation** | Conversion fires but page unloads before tag completes | Server-side validates after form processing |
| **Duplicate submissions** | User refreshes thank-you page, double counts | Server-side deduplication via `transaction_id` |
| **Bot/spam submissions** | Honeypot catches on server, but client event may fire | Server only fires conversion after validation |

### 7.2 SERVER-SIDE CONVERSION FLOW

```
Client Form Submit
        │
        ▼
┌───────────────────┐
│ 1. Client-side    │
│    validation      │
│    dataLayer.push  │
│    ('rfq_submit')  │ ← Provisional event (may be blocked by ad blockers)
└────────┬──────────┘
         │ POST /api/forms/rfq
         ▼
┌───────────────────┐
│ 2. Server-side    │
│    validation      │
│    • reCAPTCHA v3 │
│    • Honeypot     │
│    • Rate limit    │
│    • Sanitization  │
└────────┬──────────┘
         │ Valid ✓
         ▼
┌───────────────────┐
│ 3. Process form    │
│    • Create in     │
│      HubSpot       │
│    • Send email    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 4. Server-side     │
│    Conversion Fire │
│    • GA4 MP        │ ← Measurement Protocol
│    • Meta CAPI     │ ← Conversions API
│    • Google Ads    │ ← Offline Conversion Import
│    • LinkedIn      │ ← Conversions API
└───────────────────┘
```

### 7.3 GA4 MEASUREMENT PROTOCOL (Server-Side)

```javascript
// Node.js — Fire GA4 conversion via Measurement Protocol
async function fireGA4ConversionServer(conversionEvent, params, clientId, sessionId) {
  const payload = {
    client_id: clientId,
    events: [{
      name: conversionEvent,
      params: {
        ...params,
        session_id: sessionId,
        engagement_time_msec: 1,
        // Add page_location for attribution
        page_location: params.page_url,
        page_referrer: params.referrer || '',
        // Debug mode for development
        debug_mode: process.env.NODE_ENV !== 'production',
      },
    }],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Validate response
  if (response.status === 204) {
    console.log(`[MP] ${conversionEvent} sent successfully`);
    return true;
  } else {
    console.error(`[MP] ${conversionEvent} failed:`, await response.text());
    return false;
  }
}

// Usage:
// await fireGA4ConversionServer('rfq_submit', {
//   form_id: 'rfq',
//   product_count: 3,
//   page_language: 'en',
//   page_url: 'https://simalme.com/products/request-quote/',
// }, clientId, sessionId);
```

### 7.4 GOOGLE ADS OFFLINE CONVERSION IMPORT

```javascript
// For Google Ads — enhanced conversions via offline conversion import
async function uploadGoogleAdsConversion(conversionData) {
  const payload = {
    conversions: [{
      conversionAction: `customers/${GOOGLE_ADS_ACCOUNT_ID}/conversionActions/${RFQ_CONV_ACTION_ID}`,
      conversionDateTime: new Date().toISOString(),
      conversionValue: conversionData.value || 500.00,
      currencyCode: 'AED',
      orderId: conversionData.transaction_id,
      gclid: conversionData.gclid || '',        // Google Click ID from URL
      gbraid: conversionData.gbraid || '',       // GBraid for iOS
      wbraid: conversionData.wbraid || '',       // WBraid for iOS
      // Enhanced conversions — hashed user data
      userIdentifiers: conversionData.email_hashed ? [{
        hashedEmail: conversionData.email_hashed,
      }] : [],
    }],
  };

  // Use Google Ads API
  const response = await fetch(
    `https://googleads.googleapis.com/v18/customers/${GOOGLE_ADS_ACCOUNT_ID}:uploadOfflineConversions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GOOGLE_ADS_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'developer-token': GOOGLE_ADS_DEV_TOKEN,
      },
      body: JSON.stringify(payload),
    }
  );
  return response.json();
}
```

---

## 8. Attribution Models

### 8.1 GA4 ATTRIBUTION SETTINGS

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Reporting attribution model** | Data-Driven | Google's ML-based attribution recommended for B2B |
| **Conversion window** | 30 days | Typical B2B purchase cycle |
| **View-through conversion window** | 7 days | Display/video ad influence |
| **Lookback window (acquisition)** | 30 days | Standard B2B window |
| **Channels included** | Organic Search, Paid Search, Social (Organic + Paid), Direct, Referral, Email, Display | Full channel coverage |

### 8.2 MULTI-TOUCH ATTRIBUTION COMPARISON

```
Example User Journey:
Day 1: LinkedIn Ad Click → Blog Post
Day 5: Google Organic Search → Product Page (HIKVISION)
Day 10: Meta Ad Click → Product Page (HIKVISION)
Day 12: Direct Visit → RFQ Submit

Attribution Credit:

Model              LinkedIn    Organic    Meta     Direct
──────────────────────────────────────────────────────────
Last Click          0%          0%        0%       100%
First Click         100%        0%        0%         0%
Linear              25%        25%       25%        25%
Position-Based      40%        10%       10%        40%
Time Decay          10%        15%       25%        50%
Data-Driven         (varies)   (varies)  (varies)  (varies)
```

### 8.3 UTM PARAMETER STANDARDS

| Parameter | Example | Description |
|-----------|---------|-------------|
| `utm_source` | `linkedin`, `google`, `facebook`, `instagram`, `newsletter`, `partner_x` | Traffic source |
| `utm_medium` | `cpc`, `organic`, `social`, `email`, `display`, `referral` | Marketing medium |
| `utm_campaign` | `q2_2026_hikvision_launch`, `unierp_awareness_mea` | Campaign name |
| `utm_content` | `banner_a`, `video_ad_v2`, `text_cta` | Ad/content variant |
| `utm_term` | `hikvision+ip+camera`, `erp+dubai` | Keyword (paid search) |
| `utm_id` | `camp_2026_q2_001` | Campaign ID for cross-platform tracking |

---

## 9. Conversion Value Assignment

### 9.1 STATIC CONVERSION VALUES

| Conversion Event | Static Value (AED) | Basis |
|-----------------|-------------------|-------|
| `rfq_submit` | AED 500 | Average B2B order value × lead-to-order rate ÷ number of leads |
| `demo_request` | AED 1,000 | Software deal ACV × demo-to-deal rate |
| `b2b_registration` | AED 300 | Estimated annual revenue per B2B account ÷ 12 |
| `partner_application` | AED 2,000 | Estimated channel revenue per partner ÷ 12 |
| `newsletter_signup` | AED 20 | Email subscriber LTV estimate |
| `phone_call_click` | AED 50 | Call-to-RFQ rate × RFQ value |
| `whatsapp_click` | AED 50 | WhatsApp-to-RFQ rate × RFQ value |
| `content_download` | AED 25 | Content-to-lead conversion rate × lead value |
| `chat_lead_captured` | AED 75 | Chat lead quality adjusted |

### 9.2 DYNAMIC CONVERSION VALUES

```javascript
// Dynamic value based on product count (RFQ)
function calculateRFQValue(productCount, brandsCount) {
  const baseValue = 500;
  const perProductValue = 100;  // Each additional product increases potential order value
  const multiBrandBonus = brandsCount > 1 ? 200 : 0;
  return baseValue + (productCount - 1) * perProductValue + multiBrandBonus;
}

// Dynamic value for B2B orders (actual order value)
function calculateOrderValue(orderItems) {
  return orderItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}
```

---

## 10. Offline Conversion Import (HubSpot → Ads)

### 10.1 HUBSPOT DEAL STAGE → CONVERSION MAPPING

| HubSpot Deal Stage | Conversion | When to Import |
|-------------------|------------|---------------|
| **Demo Scheduled** | Demo Request | Immediately (or wait for Demo Completed) |
| **Demo Completed** | Demo Request (Enhanced) | More qualified — import after demo happens |
| **Negotiation** | RFQ → In Progress | Update conversion value with deal amount |
| **Closed Won** | Full Revenue Conversion | Import final deal amount with order ID |
| **Closed Lost** | — | No import, but useful for ROI analysis |

### 10.2 HUBSPOT → GOOGLE ADS IMPORT SCHEDULE

```yaml
# Automated import via HubSpot Ads integration
schedule: daily
events:
  - hubspot_stage: "Closed Won"
    ads_conversion_action: "B2B Order"
    value_source: "deal_amount"
    lookback_window_days: 90
  
  - hubspot_stage: "Demo Completed"
    ads_conversion_action: "Demo Request"
    value_source: "fixed_1000_aed"
    lookback_window_days: 30
```

### 10.3 HUBSPOT WORKFLOW FOR OFFLINE CONVERSIONS

```text
HubSpot → Automation → Workflows

Workflow: "GA4 Conversion — B2B Order Won"
Trigger: Deal Stage is "Closed Won"
Action:
  1. Webhook POST to conversion endpoint
     URL: https://api.simalme.com/conversions/ga4
     Body: {
       event: "b2b_order_placed",
       deal_id: "{{deal.id}}",
       value: "{{deal.amount}}",
       company_name: "{{company.name}}",
       order_id: "{{deal.hs_object_id}}",
       timestamp: "{{deal.closedate}}"
     }
  2. Create task: "Verify conversion tracking for Deal {{deal.id}}"
```

---

## 11. Conversion Reporting Dashboards

### 11.1 GA4 LOOKER STUDIO DASHBOARD

```text
Dashboard: Simal Technologies — Conversion Overview

Row 1: KPI Cards
  • Total Conversions (last 30 days)
  • Conversion Rate (%)
  • Average Conversion Value
  • Cost per Conversion (linked to Google Ads)

Row 2: Charts
  • Conversions by Event (bar chart)
    - rfq_submit, demo_request, b2b_registration, partner_application, newsletter_signup
  
  • Conversions by Channel (pie chart)
    - Organic Search, Paid Search, Social, Direct, Referral, Email
  
  • Conversion Trend (line chart — daily, last 30 days)

Row 3: Tables
  • Top Converting Pages (landing pages leading to conversions)
  • Conversion by Language (EN vs AR vs FR vs RU)
  • Conversion by Device Category

Row 4: Attribution
  • Assisted Conversions (channels that contributed but weren't last click)
  • Time to Conversion (days from first visit to conversion)
  • Path Length (number of touchpoints before conversion)
```

### 11.2 GOOGLE ADS CONVERSION REPORTING

```text
Key Columns in Google Ads:
  • Campaign
  • Conversions (imported from GA4 events)
  • Cost / Conversion
  • Conversion Value
  • Conversion Value / Cost (ROAS)
  • View-Through Conversions
```

### 11.3 MONTHLY CONVERSION REPORT TEMPLATE

| Metric | Jan | Feb | Mar | Apr | May | Jun | QoQ |
|--------|-----|-----|-----|-----|-----|-----|-----|
| **Total Conversions** | | | | | | | |
| — RFQ Submitted | | | | | | | |
| — Demo Requested | | | | | | | |
| — B2B Registered | | | | | | | |
| — Partner Applied | | | | | | | |
| — Newsletter Signups | | | | | | | |
| **Conversion Rate** | | | | | | | |
| **Total Conversion Value (AED)** | | | | | | | |
| **Cost per Conversion (AED)** | | | | | | | |
| **Top Channel** | | | | | | | |
| **Top Campaign** | | | | | | | |

---

## 12. Conversion Health Monitoring

### 12.1 WEEKLY HEALTH CHECK

| Check | Tool | Expected | Alert If |
|-------|------|----------|----------|
| **GA4 real-time conversions firing** | GA4 → Reports → Realtime | Events appearing with "conversion" flag | No conversions in 24 hours |
| **Google Ads conversion import** | Google Ads → Conversions → Summary | "Recording conversions" status | "No recent conversions" warning |
| **Meta Pixel events matching** | Events Manager → Test Events | Events appearing in real-time | No events in 24 hours |
| **LinkedIn Insight Tag active** | Campaign Manager → Website Demographics | Data populating | "No data" message |
| **GTM container published** | GTM → Versions | Latest version = Live | Stale version > 1 week |
| **Server-side conversion logs** | Server logs | `POST /api/conversions` → 200 | 4xx/5xx errors |
| **Conversion value anomalies** | GA4 → Explore | Consistent values | Value spike > 3x average |

### 12.2 CONVERSION ANOMALY DETECTION

```javascript
// Server-side health check endpoint
// GET /api/conversions/health
async function conversionHealthCheck() {
  const checks = {
    ga4: await checkGA4Conversions(),     // Check if recent conversions in GA4
    googleAds: await checkGoogleAdsLink(), // Check Google Ads-GA4 link status
    meta: await checkMetaPixel(),          // Check Meta Pixel events
    linkedin: await checkLinkedInTag(),    // Check LinkedIn Insight Tag
    gtm: await checkGTMVersion(),          // Check latest GTM version age
  };

  const unhealthy = Object.entries(checks).filter(([k, v]) => !v.healthy);

  if (unhealthy.length > 0) {
    // Send alert to marketing team
    await sendAlert('conversion_health', {
      subject: `⚠️ Conversion Health Alert: ${unhealthy.map(([k]) => k).join(', ')}`,
      details: unhealthy.map(([k, v]) => `${k}: ${v.message}`).join('\n'),
    });
  }

  return checks;
}
```

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| GA4 Event Schema | [01_GA4_Event_Schema.md](./01_GA4_Event_Schema.md) |
| GTM Container Config | [02_GTM_Container_Configuration.md](./02_GTM_Container_Configuration.md) |
| Form Configurations | [../17_Forms_Data_Collection/01_Contact_Form_Configuration.md](../17_Forms_Data_Collection/01_Contact_Form_Configuration.md) |
| WhatsApp Messages | [../19_Chatbot_Live_Chat/03_WhatsApp_Pre_Filled_Messages.md](../19_Chatbot_Live_Chat/03_WhatsApp_Pre_Filled_Messages.md) |

---

*Simal Technologies Middle East LLC — Conversion Tracking Setup — CONFIDENTIAL*