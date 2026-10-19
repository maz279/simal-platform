# 09 Icons Set

> **Source:** Simal Technologies Design System — May 2026
> **Owner:** Creative Team / UI Designer
> **Version:** 1.0

---

## 1. Overview

A comprehensive, consistent icon library is essential for visual communication across the Simal Technologies website. This document defines the complete icon set — over 100 custom/curated SVG icons organized by category — along with implementation standards, RTL mirroring rules, and accessibility requirements.

### 1.1 Icon Inventory Summary

| Category | Icons | Description |
|----------|-------|-------------|
| **Product Categories** | 5 | Surveillance, Computing, Displays, Connectivity, Audio |
| **IT Solutions** | 8 | Security Systems, Networking, Data Storage, Cloud, IoT, Power, POS, Infrastructure |
| **ERP Modules** | 12 | Dashboard, Finance, HR, Sales, Inventory, Purchase, Manufacturing, Projects, CRM, eCommerce, POS, Reporting |
| **Industry Verticals** | 8 | Retail, Distribution, Healthcare, Education, Hospitality, Logistics, Manufacturing, Government |
| **Navigation & UI** | 25 | Menu, Search, Close, Arrow (×4), Home, User, Cart, Heart, Share, Filter, Sort, Grid, List, Calendar, Clock, Location, Phone, Email, Download, Upload, External Link |
| **Features & Benefits** | 20 | Fast Delivery, Secure, 24/7 Support, Certified, Warranty, Cloud, API, Mobile, Dashboard, Analytics, Automation, Multi-Language, Customizable, Scalable, Integration, Training, Consulting, Migration, Backup, Compliance |
| **Actions** | 12 | Add, Edit, Delete, Save, Print, Export, Import, Send, Refresh, Lock, Unlock, Settings |
| **Commerce** | 10 | Shopping Cart, Order, Invoice, Quote, Payment, Credit Card, Delivery Truck, Package, Barcode, Warehouse |
| **Communication** | 8 | Chat, Support Ticket, FAQ, Document, Video, Presentation, Certificate, Badge |
| **Social Media** | 8 | LinkedIn, Facebook, Instagram, X/Twitter, YouTube, WhatsApp, Telegram, Email |

**Total:** ~116 icons

---

## 2. Technical Specifications

### 2.1 Icon Standards

| Parameter | Specification |
|-----------|--------------|
| **Format** | SVG (inline or sprite) — primary; PNG (1× + 2×) — fallback |
| **Canvas** | 24 × 24 px (standard); 16 × 16 px (small); 48 × 48 px (large/feature) |
| **Stroke Width** | 2 px (outline style); 1.5 px (small icons) |
| **Stroke Color** | `currentColor` (inherits from parent CSS `color`) |
| **Fill** | None (outline style, default); Solid fill available for filled variants |
| **Line Caps** | `round` |
| **Line Joins** | `round` |
| **ViewBox** | `0 0 24 24` |
| **Minification** | SVGO optimized |
| **Accessibility** | `aria-hidden="true"` + adjacent screen-reader text OR `<title>` in SVG |

### 2.2 SVG Template

```xml
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  width="24" 
  height="24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round"
  aria-hidden="true">
  <!-- Icon paths -->
</svg>
```

### 2.3 Icon Sizes

| Size | CSS Class | Use |
|------|-----------|-----|
| **16 px** | `.icon-sm` | Inline with text, badges, tags |
| **20 px** | `.icon-md-sm` | Compact UI elements, form labels |
| **24 px** | `.icon-md` (default) | Navigation, cards, buttons |
| **32 px** | `.icon-lg` | Feature sections, hero areas |
| **48 px** | `.icon-xl` | Empty states, feature highlights |
| **64 px** | `.icon-2xl` | Landing page feature icons |

---

## 3. Icon Categories — Complete List

### 3.1 Product Categories (5 Icons)

| Name | Description | Key Visual Elements |
|------|-------------|---------------------|
| `surveillance` | Security camera | Camera body, lens, IR LEDs |
| `computing` | Computer/memory | Monitor + chip/circuit |
| `displays` | Monitor/screen | Monitor frame, stand, screen |
| `connectivity` | USB/connection | Cable connector, plug |
| `audio` | Speaker/headphones | Speaker cone, sound waves |

### 3.2 IT Solutions (8 Icons)

| Name | Description |
|------|-------------|
| `security-systems` | Shield with camera — surveillance & security |
| `networking` | Connected nodes — network infrastructure |
| `data-storage` | Server/storage stack — data storage solutions |
| `cloud` | Cloud shape — cloud services |
| `iot` | Connected devices — IoT solutions |
| `power-protection` | Lightning bolt with shield — power & surge protection |
| `pos-systems` | Terminal with receipt — point of sale |
| `it-infrastructure` | Building with server — IT infrastructure |

### 3.3 ERP Modules (12 Icons)

| Name | Description |
|------|-------------|
| `erp-dashboard` | Grid/chart — main dashboard |
| `erp-finance` | Calculator + currency — finance & accounting |
| `erp-hr` | Users/people — HR & payroll |
| `erp-sales` | Trending-up chart — sales management |
| `erp-inventory` | Boxes/warehouse — inventory management |
| `erp-purchase` | Shopping cart + arrow — procurement |
| `erp-manufacturing` | Factory/gear — manufacturing |
| `erp-projects` | Gantt chart — project management |
| `erp-crm` | Heart/handshake — customer relationship |
| `erp-ecommerce` | Shopping bag + globe — eCommerce |
| `erp-pos` | Touch screen terminal — point of sale |
| `erp-reports` | Document + chart — reporting & analytics |

### 3.4 Industry Verticals (8 Icons)

| Name | Description |
|------|-------------|
| `industry-retail` | Storefront — retail |
| `industry-distribution` | Network/flow — distribution |
| `industry-healthcare` | Medical cross — healthcare |
| `industry-education` | Graduation cap — education |
| `industry-hospitality` | Hotel/building — hospitality |
| `industry-logistics` | Truck — logistics & transportation |
| `industry-manufacturing` | Factory — manufacturing |
| `industry-government` | Government building — public sector |

### 3.5 Navigation & UI (25 Icons)

`menu`, `close`, `search`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `home`, `user`, `shopping-cart`, `heart`, `share`, `filter`, `sort`, `grid-view`, `list-view`, `calendar`, `clock`, `map-pin` (location), `phone`, `email`

### 3.6 Features & Benefits (20 Icons)

`fast-delivery`, `secure-shield`, `support-24-7`, `certified`, `warranty`, `cloud-computing`, `api`, `mobile-app`, `dashboard`, `analytics`, `automation`, `multi-language`, `customizable`, `scalable`, `integration`, `training`, `consulting`, `data-migration`, `backup`, `compliance`

### 3.7 Actions (12 Icons)

`plus` (add), `pencil` (edit), `trash` (delete), `save`, `printer`, `download`, `upload`, `send`, `refresh`, `lock`, `unlock`, `settings`

### 3.8 Commerce (10 Icons)

`cart`, `order`, `invoice`, `quote`, `payment`, `credit-card`, `truck` (delivery), `package`, `barcode`, `warehouse`

### 3.9 Communication (8 Icons)

`chat`, `ticket` (support), `faq`, `document`, `video`, `presentation`, `certificate`, `badge`

### 3.10 Social Media (8 Icons)

`linkedin`, `facebook`, `instagram`, `twitter-x`, `youtube`, `whatsapp`, `telegram`, `email-social`

---

## 4. Icon Delivery Formats

### 4.1 SVG Sprite (Recommended)

```html
<!-- icons-sprite.svg -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
  <defs>
    <symbol id="icon-surveillance" viewBox="0 0 24 24">
      <path d="M..."/>
      <circle cx="12" cy="12" r="3"/>
    </symbol>
    <symbol id="icon-computing" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
    </symbol>
    <!-- ... more symbols ... -->
  </defs>
</svg>

<!-- Usage -->
<svg class="icon icon-md" aria-hidden="true">
  <use href="/assets/icons/icons-sprite.svg#icon-surveillance"/>
</svg>
```

### 4.2 Individual SVG Files

```
/assets/icons/
├── sprite/
│   └── icons-sprite.svg
├── individual/
│   ├── surveillance.svg
│   ├── computing.svg
│   ├── erp-dashboard.svg
│   └── ... (116 files)
└── png/
    ├── 1x/
    │   └── surveillance.png
    └── 2x/
        └── surveillance@2x.png
```

---

## 5. RTL Mirroring (Arabic & RTL Languages)

### 5.1 Icons That Mirror in RTL

Icons that imply direction or text flow must be mirrored in RTL (Arabic) layouts:

| Icon | EN (LTR) | AR (RTL) | Reason |
|------|----------|----------|--------|
| `chevron-left` | ← | → | Points to previous |
| `chevron-right` | → | ← | Points to next |
| `arrow-left` | ← | → | Back button |
| `arrow-right` | → | ← | Forward/next |
| `arrow-back` | ← | → | Return |
| `arrow-forward` | → | ← | Proceed |
| `list-view` (bullet left) | • Text | Text • | Text direction |
| `chat` (speech bubble tail) | Tail-left | Tail-right | Reading direction |
| `send` (paper plane angle) | ↗ | ↖ | Send direction |
| `document` (text lines) | Left-aligned | Right-aligned | Text alignment |

### 5.2 Icons That Do NOT Mirror

| Icon | Reason |
|------|--------|
| `home` | Universal shape |
| `search` (magnifying glass) | Universal; handle may stay same side |
| `phone` | Universal |
| All social media icons | Brand logos — must not be altered |
| `clock` | Clockwise is universal |
| `calendar` | Universal layout |

### 5.3 RTL Implementation

```css
/* Auto-mirror directional icons in RTL */
[dir="rtl"] .icon-directional {
  transform: scaleX(-1);
}
```

```html
<!-- HTML approach -->
<svg class="icon icon-md icon-directional" aria-hidden="true">
  <use href="/assets/icons/icons-sprite.svg#icon-chevron-right"/>
</svg>
```

---

## 6. CSS Implementation

### 6.1 Icon Component Classes

```css
/* Base icon */
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

/* Sizes */
.icon-sm  { width: 16px; height: 16px; }
.icon-md-sm { width: 20px; height: 20px; }
.icon-md  { width: 24px; height: 24px; }
.icon-lg  { width: 32px; height: 32px; }
.icon-xl  { width: 48px; height: 48px; }
.icon-2xl { width: 64px; height: 64px; }

/* Color variants */
.icon-primary    { color: #005B9F; }
.icon-secondary  { color: #009CDE; }
.icon-white      { color: #FFFFFF; }
.icon-gray       { color: #6B7280; }
.icon-success    { color: #10B981; }
.icon-warning    { color: #F59E0B; }
.icon-danger     { color: #EF4444; }

/* Inline with text */
.icon-inline {
  margin-right: 0.375em;
}

[dir="rtl"] .icon-inline {
  margin-right: 0;
  margin-left: 0.375em;
}

/* Hover animation */
.icon-hover:hover {
  transform: scale(1.15);
  transition: transform 0.2s ease;
}
```

### 6.2 Usage Examples

```html
<!-- Button with icon -->
<button class="btn btn-primary">
  <svg class="icon icon-md icon-inline"><use href="#icon-send"/></svg>
  Submit Inquiry
</button>

<!-- Feature card with large icon -->
<div class="feature-card">
  <div class="feature-icon">
    <svg class="icon icon-xl icon-primary"><use href="#icon-fast-delivery"/></svg>
  </div>
  <h3>Fast Delivery</h3>
  <p>Same-day dispatch for UAE orders placed before 2 PM.</p>
</div>

<!-- Navigation item with icon -->
<a href="/products" class="nav-link">
  <svg class="icon icon-md"><use href="#icon-package"/></svg>
  Products
</a>
```

---

## 7. Accessibility

### 7.1 When Icons Convey Meaning

```html
<!-- Icon-only button: MUST have accessible label -->
<button class="btn-icon" aria-label="Search products">
  <svg class="icon icon-md" aria-hidden="true"><use href="#icon-search"/></svg>
</button>

<!-- Icon + visible text: icon is decorative -->
<a href="/contact">
  <svg class="icon icon-md" aria-hidden="true"><use href="#icon-phone"/></svg>
  +971 4 393 0507
</a>

<!-- Standalone informational icon -->
<svg class="icon icon-md" role="img" aria-label="Phone number">
  <title>Call Simal Technologies</title>
  <use href="#icon-phone"/>
</svg>
```

### 7.2 Color Contrast

- Icons used as UI controls must meet **3:1 contrast ratio** against background
- Icons used as content/information must meet **4.5:1 contrast ratio**
- Default `icon-gray` (#6B7280) on white passes 4.69:1

---

## 8. Icon Creation Guidelines

### 8.1 Design Principles

| Principle | Guideline |
|-----------|----------|
| **Consistency** | All icons share the same visual weight (2 px stroke) |
| **Simplicity** | Reduce to essential shapes; remove unnecessary detail |
| **Clarity** | Instantly recognizable at 24 px |
| **Pixel Grid** | Align to 24×24 grid; avoid fractional coordinates |
| **Padding** | Minimum 2 px internal padding from canvas edge |

### 8.2 Tools

| Tool | Use |
|------|-----|
| **Figma** (preferred) | Icon design, component library, team collaboration |
| **Lucide Icons** | Base set (MIT licensed); customize to brand style |
| **SVGO** | SVG optimization |
| **Icomoon / Fontello** | SVG sprite generation (if using icon font approach) |

---

> **Next File:** [10_Video_Company_Overview.md](./10_Video_Company_Overview.md) — Corporate overview video production specifications.

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

---

*Simal Technologies Middle East LLC — Icon Set Specification — CONFIDENTIAL — Version 1.0 — May 2026*
