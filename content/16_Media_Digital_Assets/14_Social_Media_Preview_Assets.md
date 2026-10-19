# 14 Social Media Preview Assets

> **Source:** Simal Technologies Marketing — May 2026
> **Owner:** Creative Team / Social Media Manager
> **Version:** 1.0

---

## 1. Overview

When Simal Technologies web pages are shared on social media, messaging apps, or search results, preview cards ("rich media") dramatically increase click-through rates. This document defines all Open Graph, Twitter Card, and other social preview image assets.

### 1.1 Asset Inventory

| # | Asset | Dimensions | Platform | Priority |
|---|-------|-----------|----------|----------|
| 1 | **Universal OG Image** | 1200×630 | All platforms (fallback) | P0 |
| 2 | **Homepage OG** | 1200×630 | Facebook, LinkedIn, WhatsApp | P0 |
| 3 | **About Us OG** | 1200×630 | All platforms | P1 |
| 4 | **IT Distribution OG** | 1200×630 | All platforms | P1 |
| 5 | **UniERP OG** | 1200×630 | All platforms | P0 |
| 6 | **Brand Pages OG (15)** | 1200×630 | All platforms | P2 |
| 7 | **Blog Post OG (dynamic)** | 1200×630 | All platforms | P1 |
| 8 | **Careers OG** | 1200×630 | LinkedIn, Facebook | P1 |
| 9 | **Contact OG** | 1200×630 | All platforms | P2 |
| 10 | **Twitter Card (Summary Large)** | 1200×628 (2:1) | X (Twitter) | P1 |
| 11 | **LinkedIn Article Image** | 1200×627 | LinkedIn | P1 |
| 12 | **WhatsApp Share Image** | 1200×630 | WhatsApp | P0 |

---

## 2. Open Graph Image Design System

### 2.1 Universal Template (1200×630 px)

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │  SIMAL TECHNOLOGIES  [Logo]          s i m a l m e .com│  │
│  │                                                        │  │
│  │                                                        │  │
│  │         PRIMARY HEADLINE                               │  │
│  │         (Max 2 lines, 48 characters)                    │  │
│  │                                                        │  │
│  │         Subtitle / Description                         │  │
│  │         (Max 2 lines, 80 characters)                    │  │
│  │                                                        │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  Background: Gradient #005B9F → #1A1A2E or relevant image   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Design Specifications

| Element | Specification |
|---------|--------------|
| **Background** | Brand gradient (#005B9F → #1A1A2E, diagonal 135°) |
| **Logo** | Simal Technologies white, horizontal; top-right; 80 px height |
| **URL** | `simalme.com` in Inter Regular, 14px, white, 80% opacity; top-left |
| **Headline** | Inter Bold, 48px, white; centered vertically; max 2 lines |
| **Subtitle** | Inter Regular, 24px, white 80% opacity; below headline; max 2 lines |
| **Safe Zone** | 60 px padding on all sides |

### 2.3 Per-Page OG Images

| Page | Headline | Subtitle |
|------|----------|----------|
| **Homepage** | "Your Trusted IT Hardware Distributor in the Middle East" | "15 Brands · 76+ Products · Dubai, UAE" |
| **About Us** | "23+ Years of IT Distribution Excellence" | "Based in Dubai, Serving GCC, Africa & CIS" |
| **IT Distribution** | "World-Class IT Hardware Distribution" | "Surveillance · Computing · Displays · Connectivity · Audio" |
| **UniERP** | "UniERP — Enterprise Resource Planning, Simplified" | "Powered by Odoo 19 CE · 40+ Modules · From AED 299/month" |
| **HIKVISION** | "HIKVISION — Official Middle East Distributor" | "IP Cameras · NVRs · Access Control · AI Analytics" |
| **Crucial** | "Crucial — DDR5 & Gen5 NVMe SSDs" | "Performance Memory & Storage by Micron" |
| **Careers** | "Join Our Team — Simal Technologies" | "Build Your Career in IT Distribution — Dubai, UAE" |
| **Contact** | "Get in Touch — Simal Technologies" | "+971 4 393 0507 · info@simalme.com · Bur Dubai" |
| **Blog Post** | Dynamic: Article Title | Dynamic: "Simal Technologies Blog · {date}" |

---

## 3. Open Graph Meta Tags

### 3.1 Global Default (Homepage)

```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Simal Technologies Middle East">
<meta property="og:title" content="Simal Technologies — IT Hardware Distribution & ERP Solutions | Dubai, UAE">
<meta property="og:description" content="Your trusted IT hardware distributor in the Middle East. 15 world-class brands, 76+ products, and UniERP software — serving GCC, Africa & CIS from Dubai.">
<meta property="og:url" content="https://simalme.com/">
<meta property="og:image" content="https://simalme.com/assets/social/og-homepage_1200x630.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Simal Technologies — Your Trusted IT Hardware Distributor in the Middle East">
<meta property="og:locale" content="en_AE">
<meta property="og:locale:alternate" content="ar_AE">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@SimalTech">
<meta name="twitter:title" content="Simal Technologies — IT Hardware Distribution & ERP Solutions | Dubai, UAE">
<meta name="twitter:description" content="15 world-class brands, 76+ products, and UniERP software — serving GCC, Africa & CIS from Dubai.">
<meta name="twitter:image" content="https://simalme.com/assets/social/twitter-card_1200x628.jpg">
<meta name="twitter:image:alt" content="Simal Technologies — IT Hardware Distributor in the Middle East">
```

### 3.2 Arabic Locale (RTL Pages)

```html
<meta property="og:locale" content="ar_AE">
<meta property="og:title" content="سيمال تكنولوجيز — توزيع أجهزة تكنولوجيا المعلومات وحلول ERP | دبي، الإمارات">
<meta property="og:description" content="موزع أجهزة تكنولوجيا المعلومات الموثوق به في الشرق الأوسط. 15 علامة تجارية عالمية، أكثر من 76 منتجًا، وبرنامج UniERP — نخدم دول الخليج وأفريقيا ورابطة الدول المستقلة من دبي.">
<meta property="og:image" content="https://simalme.com/assets/social/og-homepage_ar_1200x630.jpg">
```

---

## 4. Dynamic OG Image Generation

### 4.1 Blog Posts (Auto-Generated)

For blog posts, OG images are auto-generated using a template with the article title and featured image:

```javascript
// Example: Node.js OG image generation using Puppeteer or edge function
function generateBlogOGImage(title, imageUrl, author, date) {
  return `https://simalme.com/api/og-image?title=${encodeURIComponent(title)}&image=${encodeURIComponent(imageUrl)}`;
}

// URL pattern:
// https://simalme.com/api/og-image?title=Crucial+T500+SSD+Review&type=blog
```

### 4.2 Dynamic Meta Tags

```html
<!-- Blog post template -->
<meta property="og:type" content="article">
<meta property="og:title" content="{{article.title}} | Simal Technologies Blog">
<meta property="og:description" content="{{article.excerpt | truncate(200)}}">
<meta property="og:image" content="{{article.og_image_url}}">
<meta property="og:url" content="{{article.canonical_url}}">
<meta property="article:published_time" content="{{article.publish_date_iso}}">
<meta property="article:author" content="{{article.author_name}}">
<meta property="article:tag" content="{{article.tags | join(',')}}">

<!-- Product pages -->
<meta property="og:type" content="product">
<meta property="og:title" content="{{product.name}} — {{product.brand}} | Simal Technologies">
<meta property="og:description" content="{{product.short_description}}">
<meta property="og:image" content="{{product.hero_image_1200}}">
<meta property="product:price:amount" content="{{product.price}}">
<meta property="product:price:currency" content="AED">
<meta property="product:brand" content="{{product.brand}}">
<meta property="product:availability" content="{{product.stock_status}}">
```

---

## 5. Per-Platform Specifications

### 5.1 Facebook / Meta

| Parameter | Value |
|-----------|-------|
| **Image Size** | 1200×630 px (1.91:1 ratio) |
| **Min Size** | 600×315 px |
| **Max File Size** | 8 MB |
| **Format** | JPEG (preferred), PNG, WebP |
| **Text in Image** | ≤ 20% of image area |

### 5.2 LinkedIn

| Parameter | Value |
|-----------|-------|
| **Image Size** | 1200×627 px (1.91:1) |
| **Max File Size** | 5 MB |
| **Format** | JPEG, PNG |

### 5.3 X / Twitter

| Parameter | Value |
|-----------|-------|
| **Card Type** | `summary_large_image` |
| **Image Size** | 1200×628 px (2:1 ratio) |
| **Max File Size** | 5 MB |
| **Format** | JPEG, PNG, WebP |

### 5.4 WhatsApp

| Parameter | Value |
|-----------|-------|
| **Image Size** | 1200×630 px (minimum 300×157) |
| **Max File Size** | 300 KB (recommended for fast loading) |
| **Format** | JPEG |

---

## 6. File Delivery

### 6.1 Directory Structure

```
/assets/social/
├── og-universal_1200x630.jpg
├── og-universal_ar_1200x630.jpg
├── og-homepage_1200x630.jpg
├── og-homepage_ar_1200x630.jpg
├── og-about_1200x630.jpg
├── og-distribution_1200x630.jpg
├── og-unierp_1200x630.jpg
├── og-unierp_ar_1200x630.jpg
├── og-careers_1200x630.jpg
├── og-contact_1200x630.jpg
├── og-blog-template_1200x630.psd
├── twitter-card_1200x628.jpg
├── linkedin-article_1200x627.jpg
├── brands/
│   ├── og-hikvision_1200x630.jpg
│   ├── og-crucial_1200x630.jpg
│   └── ... (13 more)
└── blog/
    └── (dynamically generated)
```

### 6.2 Naming Convention

```
{platform}_{page-slug}_{dimensions}.{ext}

Examples:
  og-homepage_1200x630.jpg
  og-unierp_ar_1200x630.jpg
  twitter-card_about_1200x628.jpg
```

---

## 7. Testing & Validation

### 7.1 Testing Tools

| Tool | URL |
|------|-----|
| **Facebook Sharing Debugger** | `https://developers.facebook.com/tools/debug/` |
| **LinkedIn Post Inspector** | `https://www.linkedin.com/post-inspector/` |
| **Twitter Card Validator** | `https://cards-dev.twitter.com/validator` |
| **WhatsApp** | Send link to yourself in WhatsApp |
| **OG Preview Tool** | `https://www.opengraph.xyz/` |

### 7.2 Validation Checklist

- [ ] OG image loads within 2 seconds on all platforms
- [ ] Image displays correctly in Facebook Share Debugger
- [ ] Image displays correctly in LinkedIn Post Inspector
- [ ] Twitter Card renders as `summary_large_image`
- [ ] WhatsApp preview shows image (may require cache clear)
- [ ] Arabic OG images display correct Arabic text (not mojibake)
- [ ] No text truncation on headline or description
- [ ] Logo is clear and legible at preview size (approx 200×100 px on mobile)
- [ ] CDN serves image with correct CORS headers

---

## 8. Implementation in Head

```html
<!-- Complete OG + Twitter implementation for homepage -->

<!-- Primary Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Simal Technologies Middle East">
<meta property="og:title" content="Simal Technologies — IT Hardware Distribution & ERP Solutions | Dubai, UAE">
<meta property="og:description" content="Your trusted IT hardware distributor in the Middle East. 15 world-class brands, 76+ products, and UniERP software — serving GCC, Africa & CIS from Dubai.">
<meta property="og:url" content="https://simalme.com/">
<meta property="og:image" content="https://simalme.com/assets/social/og-homepage_1200x630.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Simal Technologies — Your Trusted IT Hardware Distributor in the Middle East">
<meta property="og:locale" content="en_AE">
<meta property="og:locale:alternate" content="ar_AE">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@SimalTechnologies">
<meta name="twitter:creator" content="@SimalTechnologies">
<meta name="twitter:title" content="Simal Technologies — IT Hardware Distribution & ERP Solutions | Dubai, UAE">
<meta name="twitter:description" content="15 world-class brands, 76+ products, and UniERP software — serving GCC, Africa & CIS from Dubai.">
<meta name="twitter:image" content="https://simalme.com/assets/social/twitter-card_1200x628.jpg">
<meta name="twitter:image:alt" content="Simal Technologies — IT Hardware Distributor in the Middle East">

<!-- Additional -->
<meta name="description" content="Simal Technologies Middle East LLC — Dubai-based IT hardware distributor. 15 global brands including HIKVISION, Crucial, TEAMGROUP, Koorui, UGREEN. UniERP software solutions on Odoo 19 CE.">
<link rel="canonical" href="https://simalme.com/">
```

---

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

> **Next Section:** [17_Forms_Data_Collection](../17_Forms_Data_Collection/) — Form configuration and data collection specifications.

---

*Simal Technologies Middle East LLC — Social Media Preview Asset Specification — CONFIDENTIAL — Version 1.0 — May 2026*
