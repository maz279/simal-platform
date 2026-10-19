# 02 — Intercom Bot Flows (Automated Conversational Paths)

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Complete conversational flow definitions for Intercom's Custom Bots and Operator automation. Covers 4 primary automated paths: (1) Product Inquiry ? Lead Creation, (2) ERP Interest ? Qualification ? Demo Scheduling, (3) Support ? Categorization ? Ticket Creation, and (4) Off-Hours Auto-Reply & Capture. Includes NLP intent mapping, quick-reply buttons, HubSpot CRM integration, and handoff logic to live agents.  
> **Platform:** Intercom Custom Bots + Operator + HubSpot CRM  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Bot Architecture Overview](#1-bot-architecture-overview)
2. [NLP Intent Classification](#2-nlp-intent-classification)
3. [Flow A: Product Inquiry ? Lead Creation](#3-flow-a-product-inquiry--lead-creation)
4. [Flow B: ERP Interest ? Qualification ? Demo Scheduling](#4-flow-b-erp-interest--qualification--demo-scheduling)
5. [Flow C: Support ? Categorization ? Ticket Creation](#5-flow-c-support--categorization--ticket-creation)
6. [Flow D: Off-Hours Auto-Reply & Capture](#6-flow-d-off-hours-auto-reply--capture)
7. [Quick-Reply Button Library](#7-quick-reply-button-library)
8. [Handoff & Escalation Rules](#8-handoff--escalation-rules)
9. [HubSpot CRM Integration](#9-hubspot-crm-integration)
10. [Bot Analytics & Performance Metrics](#10-bot-analytics--performance-metrics)

---

## 1. Bot Architecture Overview

```
+--------------------------------------------------------+
¦                    USER ENTERS CHAT                     ¦
+--------------------------------------------------------+
                         ¦
                         ?
+--------------------------------------------------------+
¦                 NLP INTENT CLASSIFIER                   ¦
¦  Analyzes first message + page context + visitor data   ¦
+--------------------------------------------------------+
    ¦              ¦              ¦
    ?              ?              ?
+--------+  +----------+  +--------------+
¦FLOW A  ¦  ¦ FLOW B   ¦  ¦ FLOW C       ¦
¦Product ¦  ¦ ERP/Demo ¦  ¦ Support      ¦
¦Inquiry ¦  ¦ Interest ¦  ¦ Categorize   ¦
+--------+  +----------+  +--------------+
    ¦            ¦               ¦
    ?            ?               ?
+--------+  +----------+  +--------------+
¦ Create ¦  ¦Qualify ? ¦  ¦Create Ticket ¦
¦ Lead   ¦  ¦ Book Demo¦  ¦+ Route       ¦
+--------+  +----------+  +--------------+
    ¦            ¦               ¦
    +------------+---------------+
                 ¦
                 ?
    +-------------------------+
    ¦ HANDOFF TO LIVE AGENT   ¦
    ¦ (if needed / requested)  ¦
    +-------------------------+

           OFF-HOURS PATH
                 ¦
                 ?
    +-------------------------+
    ¦ FLOW D: Auto-Reply      ¦
    ¦ ? Capture Name/Email    ¦
    ¦ ? Save as Lead/Ticket   ¦
    ¦ ? Promise Follow-up     ¦
    +-------------------------+
```

### 1.1 BOT MODES

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Bot-First** | New conversation, off-hours, or simple intent | Bot handles entire flow, only hands off if user requests human or bot can't resolve |
| **Bot-Triage** | Business hours, complex/high-value intent | Bot qualifies quickly (2-3 questions), then hands off to live agent with context |
| **Bot-Supplement** | Live agent active | Bot monitors conversation, suggests articles/actions to agent |

---

## 2. NLP Intent Classification

### 2.1 PRIMARY INTENTS

| Intent ID | Intent Name | Trigger Keywords (EN) | Trigger Keywords (AR) | Route To |
|-----------|------------|----------------------|----------------------|----------|
| `INT-PROD` | Product Inquiry | "price", "buy", "cost", "order", "stock", "available", "specs of", "datasheet", "bulk" | "???", "????", "?????", "???", "?????", "???????" | Flow A |
| `INT-ERP` | ERP Interest | "ERP", "UniERP", "Odoo", "demo", "trial", "business management", "accounting software", "HR system" | "ERP", "????", "????", "?????", "??? ??????", "??????", "????? ?????" | Flow B |
| `INT-SUPP` | Support Request | "help", "not working", "broken", "error", "issue", "problem", "warranty", "return", "RMA" | "??????", "?? ????", "???", "?????", "????", "?????" | Flow C |
| `INT-GEN` | General Inquiry | "who are you", "location", "contact", "about", "office", "address", "careers" | "?? ????", "????", "?????", "?????", "?????" | Live Agent (or Flow D off-hours) |
| `INT-PART` | Partnership | "partner", "reseller", "distributor", "become a", "wholesale account" | "????", "????", "????", "???? ????" | Flow A (with partner qualifiers) |
| `INT-AGENT` | Request Human | "human", "agent", "real person", "talk to someone", "person" | "??? ?????", "????", "???? ?? ???", "????" | Immediate handoff |

### 2.2 INTENT CLASSIFICATION LOGIC

```javascript
// Simplified NLP intent classifier (production uses Intercom's native NLP + custom rules)
function classifyIntent(message, pageContext) {
  const msg = message.toLowerCase().trim();

  // Check for explicit human agent request first
  const agentPatterns = ['human', 'agent', 'real person', 'talk to someone', 'person',
                         '??? ?????', '????', '???? ?? ???'];
  if (agentPatterns.some(p => msg.includes(p))) return 'INT-AGENT';

  // ERP intent
  const erpPatterns = ['erp', 'unierp', 'odoo', 'demo', 'trial', 'business management',
                       'accounting software', 'hr system', 'inventory system',
                       '????', '????', '??? ??????', '?????', '??????', '????? ?????'];
  if (erpPatterns.some(p => msg.includes(p))) return 'INT-ERP';

  // Support intent
  const supportPatterns = ['not working', 'broken', 'error', 'issue', 'problem',
                           'warranty', 'return', 'rma', 'help', 'support', 'fix',
                           '?? ????', '???', '?????', '????', '?????', '??????'];
  if (supportPatterns.some(p => msg.includes(p))) return 'INT-SUPP';

  // Product intent
  const productPatterns = ['price', 'buy', 'cost', 'order', 'stock', 'available',
                           'specs', 'datasheet', 'bulk', 'quote', 'quotation',
                           '???', '????', '?????', '???', '?????', '???????', '??? ???'];
  if (productPatterns.some(p => msg.includes(p))) return 'INT-PROD';

  // Partnership intent
  const partnerPatterns = ['partner', 'reseller', 'distributor', 'become a',
                           'wholesale', '????', '????', '????', '????'];
  if (partnerPatterns.some(p => msg.includes(p))) return 'INT-PART';

  // Default: general
  return 'INT-GEN';
}
```

---

## 3. Flow A: Product Inquiry ? Lead Creation

### 3.1 FLOW DIAGRAM

```
USER: "I need pricing for HIKVISION cameras"
          ¦
          ?
+-----------------------------+
¦ BOT: Thanks for your        ¦
¦ interest! I can help with   ¦
¦ pricing. Let me ask a few   ¦
¦ quick questions.            ¦
¦                             ¦
¦ Which brand are you         ¦
¦ interested in?              ¦
¦ [HIKVISION] [Crucial]       ¦
¦ [TEAMGROUP] [Other]         ¦
+-----------------------------+
             ¦ user selects or types
             ?
+-----------------------------+
¦ BOT: Great choice! What     ¦
¦ product type?               ¦
¦ [Cameras] [Storage]         ¦
¦ [Memory] [Monitors] [Other] ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: What quantity are you  ¦
¦ looking for?                ¦
¦ [1-10] [11-50] [51-200]     ¦
¦ [200+] [Just researching]   ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Are you purchasing for:¦
¦ [A business/company]        ¦
¦ [Personal use]              ¦
+-----------------------------+
             ¦
             ?
       +-----------+
       ?           ?
  "Business"   "Personal"
       ¦           ¦
       ?           ?
+-----------+ +--------------+
¦BOT: What's¦ ¦BOT: Got it!  ¦
¦your       ¦ ¦Let me connect¦
¦company    ¦ ¦you with our  ¦
¦name?      ¦ ¦retail team.  ¦
¦[Text]     ¦ ¦              ¦
+-----------+ +--------------+
      ¦              ¦
      ?              ?
+-----------+ +--------------+
¦BOT: Your  ¦ ¦  HANDOFF TO  ¦
¦name &     ¦ ¦  LIVE AGENT  ¦
¦email?     ¦ ¦  or capture  ¦
¦[Text]     ¦ ¦  lead        ¦
+-----------+ +--------------+
      ¦
      ?
+-----------------------------+
¦  CREATE HUBSPOT LEAD        ¦
¦  • Lifecycle: Lead          ¦
¦  • Lead Source: Live Chat   ¦
¦  • Brand Interest: [brand]  ¦
¦  • Product Type: [type]     ¦
¦  • Quantity: [qty]          ¦
¦  • SLA: 2hr response        ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦  HANDOFF TO LIVE AGENT      ¦
¦  (if during business hours) ¦
¦  or confirmation message    ¦
¦  (off-hours)                ¦
+-----------------------------+
```

### 3.2 FULL BOT SCRIPT — FLOW A (ENGLISH)

```
STEP A.0 — INITIAL RESPONSE (after intent detection)
--------------------------------------------------------------------
BOT: "Thanks for reaching out! I'd love to help you find the right
      products and pricing. Let me ask a few quick questions to
      connect you with the right specialist."

STEP A.1 — BRAND SELECTION
--------------------------------------------------------------------
BOT: "Which brand are you interested in?"
Quick Replies: [HIKVISION] [Crucial] [TEAMGROUP] [Koorui] [UGREEN]
               [WD] [Toshiba] [Zotac] [Inno3D] [Aiwa] [Nearity]
               [GSKILL] [ARKTEK] [HIKSEMi] [Honeywell]
               [Not sure / Multiple brands]

STEP A.2 — PRODUCT CATEGORY
--------------------------------------------------------------------
BOT: "Great choice! What type of product are you looking for?"
Quick Replies: [Cameras & Surveillance] [Storage & SSDs]
               [Memory & RAM] [Monitors & Displays]
               [Cables & Adapters] [Power & Surge Protection]
               [Networking] [Accessories]
               [Not sure — need recommendation]

STEP A.3 — QUANTITY RANGE
--------------------------------------------------------------------
BOT: "What quantity are you looking for?"
Quick Replies: [1–10 units] [11–50 units] [51–200 units]
               [200+ units] [Just researching for now]

STEP A.4 — BUYER TYPE
--------------------------------------------------------------------
BOT: "Are you purchasing for a business or for personal use?"
Quick Replies: [For a business/company] [Personal use]

STEP A.5a — BUSINESS PATH
--------------------------------------------------------------------
BOT: "What's your company name?"
Input: [text]

BOT: "And your name?"
Input: [text]

BOT: "What's the best email to send pricing to?"
Input: [text]

BOT: "Thanks, {name}! Here's a summary:
      • Brand: {brand}
      • Category: {category}
      • Quantity: {quantity}
      • Company: {company_name}
      Is this correct?"
Quick Replies: [Yes, that's correct] [No, let me change something]

BOT (if correct): "Perfect! I'm creating your inquiry. One of our
                   product specialists will get back to you within
                   2 hours during business hours."
                   ? CREATE LEAD ? HANDOFF TO AGENT

STEP A.5b — PERSONAL USE PATH
--------------------------------------------------------------------
BOT: "Got it! Let me connect you with our team who can help with
      individual purchases. What's your name?"
Input: [text]

BOT: "And your email?"
Input: [text]

BOT: "Thanks, {name}! Let me connect you now."
      ? CREATE LEAD (lifecycle: Lead, type: Retail) ? HANDOFF TO AGENT
```

### 3.3 FLOW A — ARABIC VERSION

```
?????? ?.0 — ???? ??????
--------------------------------------------------------------------
BOT: "????? ???????! ?????? ??????? ?? ?????? ??? ????????
      ???????? ????????. ???? ???? ??? ??????? ??????? ??????
      ????????? ???????."

?????? ?.1 — ?????? ??????? ????????
--------------------------------------------------------------------
BOT: "?? ??????? ???????? ???? ???? ????"
Quick Replies: [HIKVISION] [Crucial] [TEAMGROUP] [Koorui] [UGREEN]
               [WD] [Toshiba] [Zotac] [Inno3D] [Aiwa] [Nearity]
               [GSKILL] [ARKTEK] [HIKSEMi] [Honeywell]
               [??? ????? / ??? ??????]

?????? ?.2 — ??? ??????
--------------------------------------------------------------------
BOT: "?????? ????! ?? ??? ?????? ???? ???? ????"
Quick Replies: [??????? ???????] [????? ?SSD] [????? ?RAM]
               [?????] [?????? ???????] [????? ??????]
               [?????] [?????????] [??? ??????? — ????? ?????]

?????? ?.3 — ???? ??????
--------------------------------------------------------------------
BOT: "?? ?????? ???? ???? ?????"
Quick Replies: [1–10 ?????] [11–50 ????] [51–200 ????]
               [200+ ????] [??? ???? ??????]

?????? ?.4 — ??? ???????
--------------------------------------------------------------------
BOT: "?? ????? ????? ?? ????????? ???????"
Quick Replies: [????? / ??? ?????] [??????? ????]

?????? ?.5? — ???? ???????
--------------------------------------------------------------------
BOT: "?? ??? ??????"
BOT: "??????"
BOT: "?? ?? ???? ???? ???????? ?????? ??????? ?????"
BOT: "????? {name}! ???? ????:
      • ??????? ????????: {brand}
      • ?????: {category}
      • ??????: {quantity}
      • ??????: {company_name}
      ?? ??? ?????"
BOT (??? ??? ??????): "?????! ????? ?????? ????????. ??????? ???
                       ??? ??????? ???????? ????? ???? ?????? ????
                       ????? ?????."
```

---

## 4. Flow B: ERP Interest ? Qualification ? Demo Scheduling

### 4.1 FLOW DIAGRAM

```
USER: "I want to see a demo of UniERP"
          ¦
          ?
+-----------------------------+
¦ BOT: Excellent! UniERP is   ¦
¦ our complete business       ¦
¦ management platform built   ¦
¦ on Odoo 19. I'll help you   ¦
¦ book a personalized demo.   ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Which modules are you  ¦
¦ interested in? (Select all) ¦
¦ [Accounting] [CRM] [Sales]  ¦
¦ [Inventory] [HR] [Purchase] ¦
¦ [Manufacturing] [POS]       ¦
¦ [Project] [All/Not sure]    ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: What industry?         ¦
¦ [IT/Electronics] [Retail]   ¦
¦ [Manufacturing] [Healthcare]¦
¦ [Education] [Hospitality]   ¦
¦ [Logistics] [Construction]  ¦
¦ [Agriculture] [Other]       ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: How many employees?    ¦
¦ [1-10] [11-50] [51-200]    ¦
¦ [201-500] [500+]           ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: What's your timeline?  ¦
¦ [Immediately/ASAP]          ¦
¦ [Within 1 month]            ¦
¦ [1-3 months] [Just browsing]¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Great! Let me check    ¦
¦ availability. What's your   ¦
¦ name and company?           ¦
¦ [Collect name, company,     ¦
¦  email, phone]              ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Your preferred demo    ¦
¦ date & time? (Mon-Fri)      ¦
¦ ? Integrates with Calendly  ¦
¦ ? Shows available slots     ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦  CREATE HUBSPOT DEAL        ¦
¦  • Pipeline: UniERP Sales   ¦
¦  • Stage: Demo Scheduled    ¦
¦  • Lead Source: Live Chat   ¦
¦  • Modules: [list]          ¦
¦  • Industry: [industry]     ¦
¦  • Deal Amount: (TBD)       ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Confirmed! Your demo   ¦
¦ is scheduled for {date} at  ¦
¦ {time} GST. Calendar invite ¦
¦ sent to {email}. A UniERP   ¦
¦ specialist will walk you    ¦
¦ through the platform.       ¦
¦                             ¦
¦ In the meantime, check out  ¦
¦ our brochure: [Link]        ¦
+-----------------------------+
```

### 4.2 ERP QUALIFICATION QUESTIONS — ALL 4 LANGUAGES

| # | Question (EN) | Question (AR) | Question (FR) | Question (RU) |
|---|--------------|--------------|--------------|--------------|
| 1 | "Which UniERP modules interest you?" | "?? ????? UniERP ???? ?????" | "Quels modules UniERP vous intéressent ?" | "????? ?????? UniERP ??? ???????????" |
| 2 | "What industry are you in?" | "?? ?? ???? ?????" | "Dans quel secteur d'activité êtes-vous ?" | "? ????? ??????? ?? ??????????" |
| 3 | "How many employees in your organization?" | "?? ??? ???????? ?? ???????" | "Combien d'employés dans votre organisation ?" | "??????? ??????????? ? ????? ????????????" |
| 4 | "What's your implementation timeline?" | "?? ?? ?????? ?????? ????????" | "Quel est votre calendrier de mise en œuvre ?" | "?????? ???? ????? ??????????" |
| 5 | "Your name and company name?" | "???? ???? ??????" | "Votre nom et le nom de votre entreprise ?" | "???? ??? ? ???????? ?????????" |
| 6 | "Best email and phone to reach you?" | "???? ???? ???????? ????? ????????" | "Meilleur e-mail et téléphone pour vous joindre ?" | "?????? email ? ??????? ??? ??????" |

### 4.3 DEMO SLOT AVAILABILITY (Calendly Integration)

```javascript
// Calendly API integration for checking available demo slots
async function getAvailableDemoSlots(days = 14) {
  const response = await fetch('/api/calendly/available-slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'unierp_demo_60min',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + days * 86400000).toISOString().split('T')[0],
      timezone: 'Asia/Dubai',
    }),
  });
  const data = await response.json();
  // Returns: [{ date: '2026-05-10', slots: ['09:00', '11:00', '14:00', '16:00'] }, ...]
  return data.slots;
}
```

### 4.4 DEMO CONFIRMATION MESSAGE TEMPLATE

```
EN: "? Confirmed! Your UniERP demo is scheduled:
     ?? {date} (Sunday-Thursday only)
     ?? {time} Gulf Standard Time (UTC+4)
     ?? Calendar invite sent to {email}
     
     Your demo specialist: [Assigned after review]
     Duration: 60 minutes
     
     Here's what we'll cover:
     • Overview of UniERP platform
     • Deep dive into {modules} module(s)
     • Q&A for your {industry} industry
     • Pricing & implementation timeline
     
     Need to reschedule? Reply here or email info@simalme.com"

AR: "? ?? ???????! ?? ????? ????? ???????? ?? UniERP:
     ?? {date}
     ?? {time} ?????? ?????? (UTC+4)
     ?? ?? ????? ???? ??????? ??? {email}"
```

---

## 5. Flow C: Support ? Categorization ? Ticket Creation

### 5.1 FLOW DIAGRAM

```
USER: "My HIKVISION camera is not working"
          ¦
          ?
+-----------------------------+
¦ BOT: I'm sorry to hear      ¦
¦ that! I'll help get this    ¦
¦ resolved. Let me collect    ¦
¦ some details.               ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Are you an existing    ¦
¦ Simal customer?             ¦
¦ [Yes, I have an account]    ¦
¦ [No, I purchased elsewhere] ¦
¦ [I'm not sure]              ¦
+-----------------------------+
             ¦
    +--------+--------+
    ?        ?        ?
  "Yes"   "No"    "Not sure"
    ¦        ¦        ¦
    ?        ?        ?
+------+ +------+ +----------+
¦Ask   ¦ ¦Ask   ¦ ¦Ask brand ¦
¦email ¦ ¦where ¦ ¦+ product ¦
¦for   ¦ ¦purch-¦ ¦info      ¦
¦lookup¦ ¦ased  ¦ ¦          ¦
+------+ +------+ +----------+
   ¦        ¦          ¦
   +--------+----------+
            ¦
            ?
+-----------------------------+
¦ BOT: What product/brand?    ¦
¦ Quick Replies: [Brand list] ¦
¦ + text input for model      ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: What's the issue type? ¦
¦ [Product defective]         ¦
¦ [Setup / Installation]      ¦
¦ [Compatibility question]    ¦
¦ [Warranty claim]            ¦
¦ [Missing parts/accessories] ¦
¦ [Software/firmware issue]   ¦
¦ [Other]                     ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: How would you rate     ¦
¦ the severity?               ¦
¦ [Critical - Business halted]¦
¦ [High - Major impact]       ¦
¦ [Medium - Partial impact]   ¦
¦ [Low - Minor/Question]      ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Please describe the    ¦
¦ issue briefly.              ¦
¦ [text input]                ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Attach photos/screens- ¦
¦ hots if helpful (optional). ¦
¦ [file upload] or [Skip]     ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦  CREATE SUPPORT TICKET      ¦
¦  • ID: TKT-{YYYYMMDD}-{seq} ¦
¦  • Severity: {severity}     ¦
¦  • Category: {issue_type}   ¦
¦  • Product: {brand} {model} ¦
¦  • SLA Target: {sla_hours}  ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Ticket #{ticket_id}    ¦
¦ created! Our support team   ¦
¦ will respond within         ¦
¦ {sla_timeframe}.            ¦
¦                             ¦
¦ Reference: {ticket_id}      ¦
¦ You'll receive email updates¦
¦ at {email}.                 ¦
+-----------------------------+
```

### 5.2 SUPPORT SLA MATRIX (Bot Responses)

| Severity | Bot Promise | SLA Target | Escalation After |
|----------|------------|------------|-----------------|
| **Critical** | "Our team will respond within 1 hour. You'll receive email updates at {email}." | = 1 hour | 45 min |
| **High** | "Our team will respond within 2 hours. You'll receive email updates at {email}." | = 2 hours | 1.5 hours |
| **Medium** | "Our team will respond within 4 hours. You'll receive email updates at {email}." | = 4 hours | 3 hours |
| **Low** | "Our team will respond within 8 hours. You'll receive email updates at {email}." | = 8 hours | 6 hours |

---

## 6. Flow D: Off-Hours Auto-Reply & Capture

### 6.1 FLOW DIAGRAM

```
USER MESSAGE (outside business hours)
          ¦
          ?
+-----------------------------+
¦ BOT: ?? Hello! Our team is  ¦
¦ currently offline. We're    ¦
¦ open Sunday–Thursday,       ¦
¦ 9 AM–6 PM Dubai time (GST). ¦
¦                             ¦
¦ I can still help! Leave     ¦
¦ your details and message,   ¦
¦ and we'll follow up first   ¦
¦ thing on the next business  ¦
¦ day.                        ¦
¦                             ¦
¦ For urgent matters:         ¦
¦ ?? +971 4 393 0507          ¦
¦ ?? WhatsApp: [link]         ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: What can we help with? ¦
¦ [Product Inquiry]           ¦
¦ [ERP/Demo Request]          ¦
¦ [Technical Support]         ¦
¦ [Partnership] [Other]       ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Your name?             ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Your email address?    ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Your phone (optional)? ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Tell us more about     ¦
¦ what you need:              ¦
¦ [text input — multiline]    ¦
+-----------------------------+
             ¦
             ?
+-----------------------------+
¦ BOT: Thanks, {name}! We've  ¦
¦ received your message. Our  ¦
¦ team will get back to you   ¦
¦ on {next_business_day}.     ¦
¦                             ¦
¦ Summary:                    ¦
¦ • Category: {category}      ¦
¦ • Reference: #{ref_id}      ¦
¦                             ¦
¦ Is there anything else?     ¦
¦ [No, that's all] [Yes, ...] ¦
+-----------------------------+
```

### 6.2 OFF-HOURS CAPTURE ? HUBSPOT

```javascript
// Off-hours lead/ticket creation payload
const offHoursPayload = {
  properties: {
    firstname: collected.name,
    email: collected.email,
    phone: collected.phone || '',
    message: collected.message,
    category__c: collected.category, // Custom HubSpot property
    lead_source: 'Live Chat (Off-Hours)',
    lifecyclestage: 'lead',
    hs_lead_status: 'NEW',
    follow_up_date: getNextBusinessDay().toISOString().split('T')[0],
    chat_reference_id: `CHAT-OFF-${Date.now()}`,
    chat_language: collected.language,
  },
};

// Send to HubSpot API
await fetch('/api/hubspot/create-contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(offHoursPayload),
});
```

---

## 7. Quick-Reply Button Library

### 7.1 STANDARD BUTTON SETS

```json
{
  "brand_selector": [
    {"text": "HIKVISION", "value": "hikvision"},
    {"text": "Crucial", "value": "crucial"},
    {"text": "TEAMGROUP", "value": "teamgroup"},
    {"text": "Koorui", "value": "koorui"},
    {"text": "UGREEN", "value": "ugreen"},
    {"text": "WD", "value": "wd"},
    {"text": "Toshiba", "value": "toshiba"},
    {"text": "Zotac", "value": "zotac"},
    {"text": "Inno3D", "value": "inno3d"},
    {"text": "Aiwa", "value": "aiwa"},
    {"text": "Nearity", "value": "nearity"},
    {"text": "GSKILL", "value": "gskill"},
    {"text": "ARKTEK", "value": "arktek"},
    {"text": "HIKSEMi", "value": "hiksemi"},
    {"text": "Honeywell", "value": "honeywell"},
    {"text": "Not sure / Multiple ??", "value": "multiple"}
  ],
  "product_category": [
    {"text": "Cameras & Surveillance ??", "value": "cameras"},
    {"text": "Storage & SSDs ??", "value": "storage"},
    {"text": "Memory & RAM ??", "value": "memory"},
    {"text": "Monitors & Displays ???", "value": "monitors"},
    {"text": "Cables & Adapters ??", "value": "cables"},
    {"text": "Power & Surge ?", "value": "power"},
    {"text": "Networking ??", "value": "networking"},
    {"text": "Accessories ??", "value": "accessories"},
    {"text": "Need recommendation ??", "value": "recommendation"}
  ],
  "quantity_range": [
    {"text": "1–10 units", "value": "1-10"},
    {"text": "11–50 units", "value": "11-50"},
    {"text": "51–200 units", "value": "51-200"},
    {"text": "200+ units", "value": "200+"},
    {"text": "Just researching ??", "value": "researching"}
  ],
  "erp_modules": [
    {"text": "Accounting", "value": "accounting"},
    {"text": "CRM", "value": "crm"},
    {"text": "Sales", "value": "sales"},
    {"text": "Inventory", "value": "inventory"},
    {"text": "HR", "value": "hr"},
    {"text": "Purchase", "value": "purchase"},
    {"text": "Manufacturing", "value": "manufacturing"},
    {"text": "POS", "value": "pos"},
    {"text": "Project", "value": "project"},
    {"text": "All / Not sure", "value": "all"}
  ],
  "confirmation_yes_no": [
    {"text": "? Yes, that's correct", "value": "yes"},
    {"text": "? No, let me change", "value": "no"}
  ]
}
```

---

## 8. Handoff & Escalation Rules

### 8.1 AUTOMATIC HANDOFF TRIGGERS

| Trigger | Action |
|---------|--------|
| User types "human" / "agent" / "real person" | Immediate handoff to available agent |
| User repeats same question 3 times | Escalate to agent — bot could not resolve |
| Bot receives 3 consecutive unrecognized inputs | Handoff to agent |
| User selects "Talk to a person" quick reply | Handoff to agent |
| Flow completes successfully (lead/ticket created) | Handoff to agent (business hours) or confirmation message (off-hours) |
| User sends angry/frustrated language (sentiment < 0.3) | Immediate handoff to agent |
| Conversation exceeds 5 minutes of bot-only interaction | Offer handoff: "Would you like to speak with a team member?" |

### 8.2 HANDOFF CONTEXT PACKET

```json
{
  "handoff_reason": "flow_complete",
  "bot_flow": "product_inquiry",
  "collected_data": {
    "brand": "hikvision",
    "product_category": "cameras",
    "quantity_range": "51-200",
    "buyer_type": "business",
    "company_name": "Tech Solutions LLC",
    "name": "Ahmed Al-Rashid",
    "email": "ahmed@techsolutions.ae"
  },
  "hubspot_lead_id": "12345678",
  "conversation_summary": "Customer seeking bulk pricing on HIKVISION cameras, 51-200 units, for business use. Lead created in HubSpot.",
  "language": "en",
  "page_context": {
    "page_category": "product",
    "product_name": "HIKVISION DS-2CD2143G2-I",
    "url": "/products/hikvision/ds-2cd2143g2-i"
  }
}
```

---

## 9. HubSpot CRM Integration

### 9.1 DATA MAPPING

| Chat Field | HubSpot Property | Notes |
|-----------|-----------------|-------|
| Visitor name | `firstname` + `lastname` | Split at last space |
| Email | `email` | Primary contact identifier |
| Phone | `phone` | |
| Company name | `company` | Creates/associates Company record |
| Brand interest (Flow A) | `brand_interest__c` | Custom multi-select |
| Product category (Flow A) | `product_category_interest__c` | Custom single-select |
| Quantity range (Flow A) | `quantity_range__c` | Custom single-select |
| ERP modules (Flow B) | `erp_modules_interest__c` | Custom multi-select |
| Industry (Flow B) | `industry` | Standard HubSpot property |
| Company size (Flow B) | `company_size` | Standard property |
| Demo date/time (Flow B) | `demo_scheduled_datetime__c` | Custom datetime |
| Support ticket ID (Flow C) | `associated_ticket_id__c` | Custom text |
| Chat language | `chat_language__c` | Custom: en/ar/fr/ru |
| Chat reference | `chat_reference_id__c` | Unique ID per conversation |
| Lead source | `hs_lead_source__c` | Set to "Live Chat" |

### 9.2 HUBSPOT ENGAGEMENT CREATION

```javascript
async function createHubSpotEngagement(contactId, conversationData) {
  const engagement = {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_engagement_type: 'CHAT',
    },
    associations: {
      contactIds: [contactId],
    },
    metadata: {
      body: conversationData.transcript,
      chat_reference_id: conversationData.referenceId,
      bot_flow: conversationData.flowType,
      language: conversationData.language,
      page_url: conversationData.pageUrl,
    },
  };

  return fetch(`https://api.hubapi.com/engagements/v1/engagements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(engagement),
  });
}
```

---

## 10. Bot Analytics & Performance Metrics

### 10.1 KEY METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bot resolution rate | = 40% | Conversations fully resolved by bot without agent handoff |
| Handoff appropriateness | = 90% | Handoffs where agent confirms bot routed correctly |
| Intent classification accuracy | = 85% | Correct intent identified on first message |
| Lead capture rate (Flow A) | = 70% | Users who complete entire product inquiry flow |
| Demo booking rate (Flow B) | = 50% | Qualified leads who schedule a demo |
| Ticket creation rate (Flow C) | = 80% | Support inquiries resulting in a ticket |
| Average flow completion time | = 2 min | Time from first message to flow completion |
| User satisfaction (CES) | = 4.0/5 | Post-chat survey |

### 10.2 GA4 BOT EVENTS

```javascript
// Track bot flow milestones
gtag('event', 'bot_flow_step', {
  flow_id: 'product_inquiry',
  step_name: 'brand_selection',
  step_number: 1,
  total_steps: 5,
  language: 'en',
  business_hours: true,
});

gtag('event', 'bot_flow_complete', {
  flow_id: 'product_inquiry',
  outcome: 'lead_created',
  hubspot_lead_id: '12345678',
  completion_time_seconds: 95,
  language: 'en',
});

gtag('event', 'bot_handoff', {
  flow_id: 'product_inquiry',
  handoff_reason: 'user_requested_agent',
  steps_completed: 3,
  language: 'en',
});
```

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| Chat Greeting Config | [01_Intercom_Chat_Greeting.md](./01_Intercom_Chat_Greeting.md) |
| WhatsApp Messages | [03_WhatsApp_Pre_Filled_Messages.md](./03_WhatsApp_Pre_Filled_Messages.md) |
| Contact Form Config | [../17_Forms_Data_Collection/01_Contact_Form_Configuration.md](../17_Forms_Data_Collection/01_Contact_Form_Configuration.md) |
| RFQ/Quote Form | [../17_Forms_Data_Collection/02_RFQ_Request_Quote_Form.md](../17_Forms_Data_Collection/02_RFQ_Request_Quote_Form.md) |
| Demo Request Form | [../17_Forms_Data_Collection/03_Demo_Request_Form.md](../17_Forms_Data_Collection/03_Demo_Request_Form.md) |
| Support Ticket Form | [../17_Forms_Data_Collection/07_Support_Ticket_Form_B2B.md](../17_Forms_Data_Collection/07_Support_Ticket_Form_B2B.md) |
| GA4 Event Schema | [../20_Analytics_Tracking/01_GA4_Event_Schema.md](../20_Analytics_Tracking/01_GA4_Event_Schema.md) |

---

*Simal Technologies Middle East LLC — Intercom Bot Flows Specification — CONFIDENTIAL*