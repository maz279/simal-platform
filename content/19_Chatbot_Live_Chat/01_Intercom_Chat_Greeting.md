# 01 — Intercom Chat Greeting & Proactive Triggers

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Proactive chat greeting messages, trigger rules, and targeting logic for the Intercom Messenger embedded across all Simal Technologies website pages. Covers 4 languages (EN/AR/FR/RU), business hours logic, audience segmentation (B2B visitors, ERP prospects, returning customers), and page-specific greeting configurations.  
> **Platform:** Intercom (Series — Inbox + Messenger + Product Tours capable)  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Intercom Installation & Setup](#1-intercom-installation--setup)
2. [Business Hours & Routing Logic](#2-business-hours--routing-logic)
3. [Audience Segmentation Rules](#3-audience-segmentation-rules)
4. [Page-Specific Chat Greetings](#4-page-specific-chat-greetings)
5. [Multi-Language Greeting Matrix](#5-multi-language-greeting-matrix)
6. [Chat Launcher (Messenger Button) Customization](#6-chat-launcher-messenger-button-customization)
7. [Custom Attributes & Data Layer](#7-custom-attributes--data-layer)
8. [Proactive Trigger Configuration](#8-proactive-trigger-configuration)
9. [CSS Customization](#9-css-customization)
10. [Analytics & Event Tracking](#10-analytics--event-tracking)
11. [Testing & QA Checklist](#11-testing--qa-checklist)

---

## 1. Intercom Installation & Setup

### 1.1 JAVASCRIPT SNIPPET

```html
<!-- Intercom Messenger — Simal Technologies -->
<script>
  window.intercomSettings = {
    api_base: "https://api-iam.intercom.io",
    app_id: "SIM_APP_ID_PLACEHOLDER",
    // Language detection
    language_override: document.documentElement.lang?.substring(0, 2) || 'en',
    // Custom attributes (pushed via dataLayer)
    company_name: '',
    company_type: '',     // distributor | reseller | end_user | prospect
    user_role: '',        // procurement | it_manager | c_level | other
    page_category: '',    // homepage | product | erp | about | contact | support
    product_viewed: '',
    brand_viewed: '',
    erp_module_viewed: '',
    login_status: 'anonymous',
    b2b_account_approved: false,
  };
</script>
<script>
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/SIM_APP_ID_PLACEHOLDER';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
</script>
```

### 1.2 TEAM & INBOX CONFIGURATION

| Team | Inbox Name | Handles | Business Hours |
|------|-----------|---------|---------------|
| **Sales — Hardware** | Simal Hardware Sales | Product inquiries, RFQs, pricing | Mon-Fri 9AM-8PM GST (UTC+4); Sat 9AM-3PM GST |
| **Sales — UniERP** | Simal UniERP Sales | ERP demos, module inquiries, implementation questions | Mon-Fri 9AM-8PM GST (UTC+4); Sat 9AM-3PM GST |
| **B2B Support** | Simal Technical Support | Existing customer support tickets | Mon-Fri 9AM-8PM GST (UTC+4); Sat 9AM-3PM GST |
| **General** | Simal General Enquiries | All other / overflow | Mon-Fri 9AM-8PM GST (UTC+4); Sat 9AM-3PM GST |
| **Off-Hours Bot** | Simal After Hours | All messages outside business hours | 24/7 automated |

### 1.3 TEAM ASSIGNMENT LOGIC

```
User Message Content
        ¦
        ?
+-------------------+
¦ NLP Intent Router  ¦
+-------------------+
        ¦
   +----+---------------+
   ?    ?     ?          ?
Product ERP  Support   General
Hardware
   ¦    ¦     ¦          ¦
   ?    ?     ?          ?
Sales-HW Sales-ERP Support General
```

---

## 2. Business Hours & Routing Logic

### 2.1 BUSINESS HOURS MATRIX

| Day | Status | Chat Mode | Notes |
|-----|--------|-----------|-------|
| **Sunday** | OPEN | Live chat (Sales + Support) | 9 AM – 6 PM GST |
| **Monday** | OPEN | Live chat (Sales + Support) | 9 AM – 6 PM GST |
| **Tuesday** | OPEN | Live chat (Sales + Support) | 9 AM – 6 PM GST |
| **Wednesday** | OPEN | Live chat (Sales + Support) | 9 AM – 6 PM GST |
| **Thursday** | OPEN | Live chat (Sales + Support) | 9 AM – 6 PM GST |
| **Friday** | CLOSED | Bot-only (off-hours mode) | UAE weekend |
| **Saturday** | CLOSED | Bot-only (off-hours mode) | UAE weekend |
| **Public Holidays** | CLOSED | Bot-only + holiday message | UAE national holidays |

### 2.2 JAVASCRIPT BUSINESS HOURS CHECK

```javascript
function isBusinessHours() {
  const now = new Date();
  // Convert to GST (UTC+4)
  const gstOffset = 4 * 60; // minutes
  const localOffset = now.getTimezoneOffset();
  const gstTime = new Date(now.getTime() + (gstOffset + localOffset) * 60000);

  const day = gstTime.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hours = gstTime.getUTCHours();
  const minutes = gstTime.getUTCMinutes();
  const timeDecimal = hours + minutes / 60;

  // Closed on Friday (5) and Saturday (6)
  if (day === 5 || day === 6) return false;

  // Open Sunday-Thursday 9:00-18:00
  return timeDecimal >= 9.0 && timeDecimal < 18.0;
}
```

### 2.3 OFF-HOURS GREETING

**EN:** "?? Hello! Our team is currently offline (Sunday–Thursday, 9 AM–6 PM Dubai time). Leave us a message and we'll get back to you on the next business day. For urgent matters, call +971 4 393 0507 or WhatsApp us."

**AR:** "?? ??????! ?????? ??? ???? ?????? (?????–??????? 9 ??????–6 ????? ?????? ???). ???? ??? ????? ????? ???? ?? ??? ????? ??????. ?????? ???????? ???? ??? 0507 393 4 971+ ?? ?????? ??? ??????."

**FR:** "?? Bonjour ! Notre équipe est actuellement hors ligne (dimanche–jeudi, 9h–18h, heure de Dubaï). Laissez-nous un message et nous vous répondrons le prochain jour ouvré. Pour les questions urgentes, appelez le +971 4 393 0507."

**RU:** "?? ????????????! ???? ??????? ?????? ?? ? ???? (???????????–???????, 9:00–18:00 ?? ?????????? ???????). ???????? ?????????, ? ?? ??????? ? ????????? ??????? ????. ?? ??????? ???????? ???????: +971 4 393 0507."

---

## 3. Audience Segmentation Rules

### 3.1 VISITOR CATEGORIES

| Segment | Identifier | Priority | Chat Goal |
|---------|-----------|----------|-----------|
| **High-Intent B2B** | Viewed =3 product pages OR visited ERP pricing page | HIGH | Route to sales team immediately |
| **ERP Explorer** | Viewed =2 UniERP module pages | HIGH | Qualify ? Schedule demo |
| **Returning Visitor** | Session count =2 in 30 days | MEDIUM | Personalized greeting |
| **Referral from Partner Site** | `document.referrer` matches known partner domains | MEDIUM | Acknowledge referral |
| **First-Time Visitor** | New session, no cookies | STANDARD | General welcome |
| **Existing Customer** | Logged in B2B account | HIGH | Route to support team |
| **Competitor Research** | Rapid page switching (>10 pages in <2 min) | LOW | Do NOT proactively engage |
| **Bot / Crawler** | User agent matches bot patterns | NONE | Suppress Intercom entirely |

### 3.2 SEGMENT-DRIVEN PRIORITY LOGIC

```javascript
function getVisitorSegment() {
  const pageViews = parseInt(sessionStorage.getItem('simal_page_views') || '0');
  const productPages = parseInt(sessionStorage.getItem('simal_product_views') || '0');
  const erpPages = parseInt(sessionStorage.getItem('simal_erp_views') || '0');
  const sessionCount = parseInt(localStorage.getItem('simal_session_count') || '1');
  const isCustomer = document.cookie.includes('b2b_logged_in=true');

  if (isCustomer) return 'existing_customer';
  if (productPages >= 3 || window.location.pathname.includes('/erp/pricing')) return 'high_intent_b2b';
  if (erpPages >= 2) return 'erp_explorer';
  if (sessionCount >= 2) return 'returning_visitor';
  return 'first_time_visitor';
}
```

---

## 4. Page-Specific Chat Greetings

### 4.1 HOMEPAGE ( `/` )

| Trigger Condition | Timing | Greeting (EN) | Variants |
|------------------|--------|---------------|----------|
| **First visit, 10s dwell** | After 10 seconds on page | "?? Welcome to Simal Technologies! We distribute 15+ leading IT hardware brands across the Middle East and offer UniERP — a complete business management platform. How can we help you today?" | AR/FR/RU versions below |
| **First visit, 30s scroll** | After scrolling past hero (=50% viewport) | "Looking for a specific brand or product? We stock HIKVISION, Crucial, TEAMGROUP, Koorui, UGREEN, WD, Toshiba, and more. Just ask!" | All languages |
| **Returning visitor** | Immediately on load | "?? Welcome back! Ready to pick up where you left off? Let us know how we can help." | All languages |
| **Exit intent (desktop only)** | Mouse leaves viewport upward | "Before you go — need help finding the right IT hardware or ERP solution? We're here to help!" | All languages |

### 4.2 PRODUCT LISTING / CATALOG PAGES ( `/products/` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **Browse =3 product cards, 15s** | After 3 product card views | "Interested in multiple products? We offer competitive bulk pricing for resellers and businesses. Want a custom quote?" |
| **Pricing page view** | After 5s on `/products/*/pricing` | "Need volume pricing? We offer tiered discounts for bulk orders. Share your requirements and we'll prepare a quote within 2 hours." |
| **Compare feature use** | After adding 2+ products to compare | "Comparing products? Our team can help you choose the right solution for your needs. Need a recommendation?" |

### 4.3 INDIVIDUAL PRODUCT PAGE ( `/products/{brand}/{sku}` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **60s dwell on product** | After 60 seconds | "Looking at the {product_name}? We have it in stock! Need pricing for your business? Share your quantity and we'll send a quote right away." |
| **Scroll to specs section** | After reaching Specifications section | "Need more technical details on the {product_name}? Our product specialists can help with specs, compatibility, and deployment advice." |
| **Scroll to bottom, no CTA click** | After reaching page bottom | "Ready to order the {product_name}? Request a quote now or chat with us for volume pricing!" |

### 4.4 UniERP SECTION PAGES ( `/erp/` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **UniERP landing, 8s dwell** | After 8 seconds | "?? Discover UniERP — built on Odoo 19 Community Edition, tailored for Middle East businesses. Want to see how it fits your industry?" |
| **Module pages, 2+ modules** | After viewing 2 modules | "You're exploring multiple UniERP modules — great choice! We can arrange a personalized demo showing how these modules work together. Interested?" |
| **Pricing page** | After 5s on `/erp/pricing` | "UniERP pricing is flexible based on modules and users. Want a custom quote for your organization? Let's discuss your needs." |
| **Industry vertical page** | After 15s on `/erp/industries/*` | "UniERP is pre-configured for {industry_name}. Would you like to see a live demo tailored to the {industry_name} sector?" |

### 4.5 ABOUT / COMPANY PAGES ( `/about/` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **About page, 20s dwell** | After 20 seconds | "Learn more about Simal Technologies — 15+ brand partnerships, Dubai-headquartered, serving the Middle East and beyond. Have questions?" |
| **Contact page** | After 10 seconds | "?? Need to reach us? You can call +971 4 393 0507, email info@simalme.com, or chat with us right here. How can we help?" |

### 4.6 B2B PORTAL PAGES ( `/b2b/` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **B2B registration page** | After 30s on `/b2b/register` | "Becoming a Simal B2B partner gives you access to wholesale pricing, priority stock allocation, and dedicated account management. Need help with registration?" |
| **B2B login page** | After failed login attempt | "Having trouble logging into your B2B account? We can help reset your access or connect you with your account manager." |
| **B2B dashboard (logged in)** | On page load | "Welcome back, {company_name}! Your dedicated account manager is available. Need to place an order or check stock?" |

### 4.7 SUPPORT / HELP PAGES ( `/support/` )

| Trigger Condition | Timing | Greeting (EN) |
|------------------|--------|---------------|
| **Support landing page** | After 15 seconds | "Need technical support? Browse our knowledge base or chat with our support team directly. We're here to help!" |
| **Knowledge base article, 60s** | After 60 seconds on article | "Did this article answer your question? If not, our support team is just a message away." |
| **Ticket submission page** | After 20s on `/support/ticket` | "Filing a support ticket? For urgent issues, chat with us directly for faster resolution." |

---

## 5. Multi-Language Greeting Matrix

### 5.1 HOMEPAGE — FIRST VISIT GREETING (ALL 4 LANGUAGES)

| Lang | Greeting |
|------|----------|
| **EN** | "?? Welcome to Simal Technologies! We distribute 15+ leading IT hardware brands across the Middle East and offer UniERP — a complete business management platform. How can we help you today?" |
| **AR** | "?? ?????? ?? ?? ???? ????? ?????????! ???? ???? ?? 15 ????? ?????? ????? ?? ???? ????????? ????????? ?? ???? ????? ????? ?????? ????? UniERP — ???? ??????? ?????? ???????. ??? ?????? ??????? ??????" |
| **FR** | "?? Bienvenue chez Simal Technologies ! Nous distribuons plus de 15 grandes marques de matériel informatique au Moyen-Orient et proposons UniERP — une plateforme complète de gestion d'entreprise. Comment pouvons-nous vous aider aujourd'hui ?" |
| **RU** | "?? ????? ?????????? ? Simal Technologies! ?? ?????????? ????? 15 ??????? ??????? ??-???????????? ?? ??????? ??????? ? ?????????? UniERP — ??????????? ????????? ??? ?????????? ????????. ??? ?? ????? ??? ???????" |

### 5.2 PRODUCT PAGE GREETING (ALL 4 LANGUAGES)

| Lang | Greeting |
|------|----------|
| **EN** | "Looking at the {product_name}? We have it in stock! Need pricing for your business? Share your quantity and we'll send a quote right away." |
| **AR** | "?? ???? ?? {product_name}? ?????? ????? ?????! ?? ????? ??? ????? ?????? ???????? ?????? ?????? ???????? ?????? ?? ??? ??? ?????." |
| **FR** | "Vous regardez le {product_name} ? Nous l'avons en stock ! Besoin d'un prix pour votre entreprise ? Indiquez-nous la quantité et nous vous enverrons un devis immédiatement." |
| **RU** | "?????????????? {product_name}? ? ??? ???? ? ???????! ????? ???? ??? ?????? ???????? ??????? ??????????, ? ?? ????? ???????? ???????????." |

### 5.3 UniERP SECTION GREETING (ALL 4 LANGUAGES)

| Lang | Greeting |
|------|----------|
| **EN** | "?? Discover UniERP — built on Odoo 19 Community Edition, tailored for Middle East businesses. Want to see how it fits your industry?" |
| **AR** | "?? ????? UniERP — ???? ??? Odoo 19 Community Edition? ????? ??????? ?? ????? ??????. ?? ???? ?? ??? ??? ????? ??????" |
| **FR** | "?? Découvrez UniERP — basé sur Odoo 19 Community Edition, adapté aux entreprises du Moyen-Orient. Vous voulez voir comment il s'adapte à votre secteur ?" |
| **RU** | "?? ???????? ??? ???? UniERP — ?? ???? Odoo 19 Community Edition, ?????????????? ??? ??????? ?? ??????? ???????. ?????? ??????, ??? ?? ???????? ????? ????????" |

### 5.4 EXIT INTENT (ALL 4 LANGUAGES)

| Lang | Greeting |
|------|----------|
| **EN** | "Before you go — need help finding the right IT hardware or ERP solution? We're here to help!" |
| **AR** | "??? ?? ????? — ?? ????? ?????? ?? ?????? ??? ?? ????????? ????????? ?? ERP ???????? ??? ??? ????????!" |
| **FR** | "Avant de partir — besoin d'aide pour trouver le bon matériel informatique ou la bonne solution ERP ? Nous sommes là pour vous aider !" |
| **RU** | "?????? ??? ???? — ????? ?????? ? ?????? ??-???????????? ??? ERP-???????? ?? ?????, ????? ??????!" |

---

## 6. Chat Launcher (Messenger Button) Customization

### 6.1 DEFAULT LAUNCHER TEXT

The Intercom Messenger launcher button (the floating chat bubble) shows default text. Customize per page context:

| Page Context | Launcher Text (EN) | Launcher Text (AR) |
|-------------|-------------------|-------------------|
| **Default (all pages)** | "?? How can we help?" | "?? ??? ?????? ????????" |
| **Product pages** | "?? Ask about this product" | "?? ???? ?? ??? ??????" |
| **ERP pages** | "?? Chat about UniERP" | "?? ???? ?? UniERP" |
| **Support pages** | "?? Get support" | "?? ???? ??? ?????" |
| **B2B Portal** | "?? B2B Support" | "?? ??? B2B" |
| **Off-hours** | "?? Leave a message" | "?? ???? ?????" |

### 6.2 LAUNCHER STYLING

```css
/* Intercom Messenger Launcher Overrides */
.intercom-launcher {
  /* Simal brand blue */
  background-color: #005B9F !important;
}

.intercom-launcher:hover {
  background-color: #004A82 !important;
}

.intercom-launcher-icon {
  /* Ensure white icon on blue */
  filter: brightness(0) invert(1);
}

/* Active state */
.intercom-launcher-active {
  background-color: #004A82 !important;
}
```

---

## 7. Custom Attributes & Data Layer

### 7.1 PUSHING USER CONTEXT TO INTERCOM

```javascript
// Call on every page to update Intercom with current context
function updateIntercomContext() {
  const context = {
    // Page context
    page_category: getPageCategory(),
    page_title: document.title,
    page_path: window.location.pathname,

    // Product context (if on product page)
    product_name: getMetaContent('product:name') || '',
    product_sku: getMetaContent('product:sku') || '',
    product_brand: getMetaContent('product:brand') || '',
    product_category: getMetaContent('product:category') || '',

    // ERP context (if on ERP page)
    erp_module: getMetaContent('erp:module') || '',
    erp_industry: getMetaContent('erp:industry') || '',

    // Visitor context
    language: document.documentElement.lang?.substring(0, 2) || 'en',
    referrer: document.referrer,
    page_views_session: parseInt(sessionStorage.getItem('simal_page_views') || '0'),
  };

  if (typeof Intercom === 'function') {
    Intercom('update', context);
  }
}

function getPageCategory() {
  const path = window.location.pathname;
  if (path === '/' || path === '') return 'homepage';
  if (path.includes('/products/')) return 'product';
  if (path.includes('/products') && !path.includes('/products/')) return 'catalog';
  if (path.includes('/erp/')) return 'erp';
  if (path.includes('/about/')) return 'about';
  if (path.includes('/contact')) return 'contact';
  if (path.includes('/support/')) return 'support';
  if (path.includes('/b2b/')) return 'b2b';
  if (path.includes('/blog/')) return 'blog';
  return 'general';
}

function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
  return meta ? meta.getAttribute('content') : '';
}
```

---

## 8. Proactive Trigger Configuration

### 8.1 TRIGGER RULES (Intercom Operator / API)

```json
{
  "triggers": [
    {
      "id": "trg_homepage_first_visit",
      "name": "Homepage — First Visit Greeting",
      "audience": {
        "page_category": "homepage",
        "session_count": 1,
        "language": ["en", "ar", "fr", "ru"]
      },
      "conditions": {
        "dwell_time_seconds": 10,
        "scroll_percentage": 0,
        "max_display_count_per_session": 1,
        "max_display_count_per_user_30d": 1
      },
      "action": "send_chat_message",
      "message_template": "homepage_first_visit",
      "priority": "medium"
    },
    {
      "id": "trg_homepage_exit_intent",
      "name": "Homepage — Exit Intent",
      "audience": {
        "page_category": "homepage",
        "device_type": "desktop"
      },
      "conditions": {
        "exit_intent": true,
        "dwell_time_seconds": 15,
        "max_display_count_per_session": 1
      },
      "action": "send_chat_message",
      "message_template": "exit_intent",
      "priority": "low"
    },
    {
      "id": "trg_product_interest",
      "name": "Product Page — High Interest",
      "audience": {
        "page_category": "product",
        "dwell_time_seconds": 60
      },
      "conditions": {
        "max_display_count_per_session": 2,
        "max_display_count_per_user_30d": 3
      },
      "action": "send_chat_message",
      "message_template": "product_interest",
      "priority": "high"
    },
    {
      "id": "trg_product_bulk_pricing",
      "name": "Catalog — Bulk Pricing Inquiry",
      "audience": {
        "page_category": "catalog",
        "product_views_session": { "gte": 3 }
      },
      "conditions": {
        "dwell_time_seconds": 15,
        "max_display_count_per_session": 1
      },
      "action": "send_chat_message",
      "message_template": "catalog_bulk_pricing",
      "priority": "high"
    },
    {
      "id": "trg_erp_interest",
      "name": "ERP Pages — Module Interest",
      "audience": {
        "page_category": "erp",
        "dwell_time_seconds": 8
      },
      "conditions": {
        "max_display_count_per_session": 1,
        "max_display_count_per_user_30d": 2
      },
      "action": "send_chat_message",
      "message_template": "erp_general",
      "priority": "high"
    },
    {
      "id": "trg_erp_module_explorer",
      "name": "ERP — Multiple Modules Viewed",
      "audience": {
        "page_category": "erp",
        "erp_module_views_session": { "gte": 2 }
      },
      "conditions": {
        "dwell_time_seconds": 5,
        "max_display_count_per_session": 1
      },
      "action": "send_chat_message",
      "message_template": "erp_module_combo",
      "priority": "high"
    },
    {
      "id": "trg_contact_page",
      "name": "Contact Page — Chat Offer",
      "audience": {
        "page_category": "contact",
        "dwell_time_seconds": 10
      },
      "conditions": {
        "max_display_count_per_session": 1
      },
      "action": "send_chat_message",
      "message_template": "contact_page",
      "priority": "medium"
    },
    {
      "id": "trg_off_hours",
      "name": "Off-Hours Auto Reply",
      "audience": {
        "business_hours": false
      },
      "conditions": {},
      "action": "send_chat_message",
      "message_template": "off_hours",
      "priority": "low",
      "auto_reply_enabled": true
    }
  ]
}
```

### 8.2 TRIGGER COOLDOWN RULES

| Rule | Value | Rationale |
|------|-------|-----------|
| Max triggers per session (any) | 3 | Prevent chat fatigue |
| Min interval between triggers | 120 seconds | Respect user space |
| Max triggers per user per 30 days | 5 | Avoid over-messaging returning visitors |
| Do not trigger if chat is open | Always | Don't interrupt active conversation |
| Do not trigger if user dismissed chat in last 30 min | Always | Respect user preference |
| Suppress all triggers for bots | Always | Skip Intercom entirely for crawlers |

---

## 9. CSS Customization

```css
/* ===== INTERCOM MESSENGER CUSTOM STYLES ===== */

/* Main messenger panel */
.intercom-messenger {
  font-family: 'Inter', 'Tajawal', system-ui, -apple-system, sans-serif !important;
}

/* Header bar */
.intercom-messenger-header {
  background: linear-gradient(135deg, #005B9F 0%, #003D6B 100%) !important;
}

/* Team avatar / brand logo in header */
.intercom-team-avatar {
  background-image: url('/assets/images/logo/simal-icon-white.svg') !important;
  background-size: 60% !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

/* Send button */
.intercom-composer-send-button {
  background-color: #005B9F !important;
}

.intercom-composer-send-button:hover {
  background-color: #004A82 !important;
}

/* Links in chat */
.intercom-messenger-body a {
  color: #005B9F !important;
}

/* Home screen greeting card */
.intercom-home-screen-messenger-card {
  border-top: 3px solid #005B9F !important;
}

/* RTL support for Arabic */
[dir="rtl"] .intercom-messenger {
  direction: rtl !important;
  text-align: right !important;
}

[dir="rtl"] .intercom-messenger-body {
  text-align: right !important;
}

[dir="rtl"] .intercom-composer {
  direction: rtl !important;
}
```

---

## 10. Analytics & Event Tracking

### 10.1 GA4 CUSTOM EVENTS

| Event Name | Trigger | Parameters |
|-----------|---------|------------|
| `chat_shown` | Proactive greeting displayed | `page_category`, `trigger_id`, `language` |
| `chat_opened` | User clicks messenger launcher | `page_category`, `language`, `previous_interactions` |
| `chat_message_sent` | User sends a message | `page_category`, `language`, `message_length`, `is_off_hours` |
| `chat_message_received` | Agent/auto-reply received | `page_category`, `language`, `response_time_seconds` |
| `chat_closed` | User closes messenger | `page_category`, `duration_seconds`, `messages_count`, `resolution` |
| `chat_dismissed` | User dismisses proactive message | `page_category`, `trigger_id`, `language` |

### 10.2 DATALAYER PUSH

```javascript
// Push when a proactive chat greeting is shown
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'chat_shown',
  chat_trigger_id: 'trg_homepage_first_visit',
  chat_page_category: 'homepage',
  chat_language: 'en',
  chat_business_hours: true,
});
```

---

## 11. Testing & QA Checklist

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | First visit to homepage, English browser | Homepage welcome greeting after 10s in EN |
| 2 | First visit to homepage, Arabic browser (`lang=ar`) | Homepage welcome greeting after 10s in AR |
| 3 | French browser (`lang=fr`) on product page | French product greeting after 60s |
| 4 | Russian browser (`lang=ru`) on ERP page | Russian ERP greeting after 8s |
| 5 | Visit during business hours (Sun 10 AM GST) | Live chat available, no off-hours message |
| 6 | Visit outside business hours (Fri 3 PM GST) | Off-hours auto-reply, leave-a-message mode |
| 7 | View 3 product pages within one session | Bulk pricing trigger fires on 3rd product view |
| 8 | View 2+ ERP module pages | Module combo trigger fires |
| 9 | Exit intent on desktop (mouse leaves viewport up) | Exit intent greeting fires |
| 10 | Dismiss proactive message, visit another page | No trigger for 30 minutes after dismiss |
| 11 | Clear cookies, revisit | Treated as new visitor (session_count=1) |
| 12 | B2B logged-in cookie present | Route to B2B support team, customer greeting |
| 13 | User agent = Googlebot / crawler | Intercom entirely suppressed |
| 14 | Mobile device visit | Exit intent trigger does NOT fire |
| 15 | Rapid page switching (>10 pages in 2 min) | No proactive engagement triggers |

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| Intercom Bot Flows | [02_Intercom_Bot_Flows.md](./02_Intercom_Bot_Flows.md) |
| WhatsApp Messages | [03_WhatsApp_Pre_Filled_Messages.md](./03_WhatsApp_Pre_Filled_Messages.md) |
| GA4 Event Schema | [../20_Analytics_Tracking/01_GA4_Event_Schema.md](../20_Analytics_Tracking/01_GA4_Event_Schema.md) |
| GTM Container Config | [../20_Analytics_Tracking/02_GTM_Container_Configuration.md](../20_Analytics_Tracking/02_GTM_Container_Configuration.md) |

---

*Simal Technologies Middle East LLC — Intercom Chat Greeting Configuration — CONFIDENTIAL*