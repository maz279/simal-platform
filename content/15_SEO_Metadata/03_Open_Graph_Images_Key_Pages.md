# 03 Open Graph Images — Key Pages

> **Source:** Custom-designed OG images per page + dynamic templates for blog posts and products
> **Dimensions:** 1200×630px (1.91:1 aspect ratio)
> **Format:** JPG (progressive) + WebP fallback; PNG only when transparency needed
> **Max File Size:** 300 KB (JPG), 150 KB (WebP)
> **Last Updated:** May 2, 2026

---

## Open Graph Specification Compliance

| Platform | Min Size | Recommended Size | Format | Notes |
|---|---|---|---|---|
| **Facebook** | 600×315px | 1200×630px | JPG, PNG, WebP | 1.91:1 ratio; 8MB max |
| **LinkedIn** | 400px wide | 1200×627px | JPG, PNG | Slightly different ratio (1.91:1); max 5MB |
| **Twitter (Large Card)** | 300×157px | 1200×675px | JPG, PNG, WebP | 2:1 ratio preferred; use `twitter:card = summary_large_image` |
| **WhatsApp** | 300px min width | 1200×630px | JPG | Same as Facebook OG image |
| **Telegram** | 300px min | 1200×630px | JPG | Same as Facebook OG image |

**Simal standard:** 1200×630px JPG (progressive) + WebP fallback. Twitter card uses same image (crops to 1200×600 center).

---

## OG Image HTML Implementation

```html
<!-- Primary Open Graph -->
<meta property="og:image" content="https://simalme.com/images/og/homepage.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:alt" content="Simal Technologies — IT Hardware Distribution & UniERP Solutions in Dubai" />

<!-- WebP Alternative (better compression) -->
<meta property="og:image" content="https://simalme.com/images/og/homepage.webp" />
<meta property="og:image:type" content="image/webp" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://simalme.com/images/og/homepage-twitter.jpg" />
<meta name="twitter:image:alt" content="Simal Technologies — IT Hardware Distribution & UniERP Solutions in Dubai" />
```

---

## OG Image Design System

### Template Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │     [SIMAL TECHNOLOGIES LOGO — White, top-left]            │  │
│  │                                                            │  │
│  │                                                            │  │
│  │     ┌──────────────────────────────────────────┐           │  │
│  │     │                                          │           │  │
│  │     │  {PRIMARY HEADLINE}                      │           │  │
│  │     │  32-40pt, Bold, White                    │           │  │
│  │     │  Max 2 lines                             │           │  │
│  │     │                                          │           │  │
│  │     │  {SUBTITLE / VALUE PROP}                 │           │  │
│  │     │  18-20pt, Regular, White (80% opacity)   │           │  │
│  │     │  Max 1 line                              │           │  │
│  │     │                                          │           │  │
│  │     └──────────────────────────────────────────┘           │  │
│  │                                                            │  │
│  │                                                            │  │
│  │   [Background: Brand gradient or relevant product/brand    │  │
│  │    imagery with dark overlay, 60-70% opacity]              │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Design Specifications

| Element | Specification |
|---|---|
| **Dimensions** | 1200×630px |
| **Background** | Brand gradient (#005B9F to #003D6B) OR relevant product/brand imagery with 60% dark overlay |
| **Logo** | Simal Technologies white logo, 240px wide, positioned 40px from top-left |
| **Headline Font** | Inter Bold, 36pt, white (#FFFFFF), max 2 lines (≈25 characters/line) |
| **Subtitle Font** | Inter Regular, 20pt, white at 80% opacity, max 1 line (≈45 characters) |
| **Safe Zone** | 80px margin on all sides (text/graphics must not enter 80px from edges) |
| **Center of Interest** | Centered at 600×270px (Facebook/WhatsApp center-crops around this point) |
| **File Naming** | `{page-slug}-{lang}.jpg` — e.g., `hikvision-ar.jpg`, `unierp-overview-en.jpg` |

---

## OG Image Inventory — Custom-Designed Pages

### Tier 1: Custom OG Images (Highest Priority)

| Page | File Name | Headline | Subtitle | Background |
|---|---|---|---|---|
| **Homepage** | `homepage-{lang}.jpg` | IT Hardware Distribution & UniERP Solutions | 22+ Global Brands • Dubai, UAE | Brand gradient + Dubai skyline silhouette |
| **HIKVISION Brand** | `hikvision-{lang}.jpg` | HIKVISION — Official UAE Distributor | IP Cameras • NVR • Access Control • Security Solutions | HIKVISION brand red + camera product imagery |
| **Crucial Brand** | `crucial-{lang}.jpg` | Crucial by Micron — Authorized Distributor | SSDs • DRAM • Memory Modules | Crucial brand blue + SSD product shot |
| **UniERP Overview** | `unierp-overview-{lang}.jpg` | UniERP — Odoo 19 CE ERP Platform | Complete ERP for SMBs & Enterprises | Brand gradient + dashboard UI mockup |
| **About Us** | `about-{lang}.jpg` | About Simal Technologies Middle East | Dubai-Based IT Distributor Since Establishment | Dubai office photo + brand gradient overlay |
| **IT Distribution** | `it-distribution-{lang}.jpg` | IT Hardware Distribution | 22+ Brands • 76+ Products • 30+ Countries | Product collage montage with dark overlay |
| **Surveillance Solutions** | `surveillance-solutions-{lang}.jpg` | Commercial Surveillance & Security | HIKVISION Systems • SIRA Compliant | HIKVISION camera array photo |
| **Contact Us** | `contact-{lang}.jpg` | Contact Simal Technologies | Dubai Office • +971 4 393 0507 | Dubai Bur Dubai office exterior |
| **Careers Overview** | `careers-{lang}.jpg` | Careers at Simal Technologies | Join Our Team in Dubai & Dhaka | Team photo / office environment |

### Tier 2: Template-Based OG Images

| Page Type | Template | Headline Source | Background |
|---|---|---|---|
| **Product Detail** | `product-og-template` | `{Product Name} — {Brand}` | Product image (blurred + darkened) |
| **Brand Pages** (non-Tier-1) | `brand-og-template` | `{Brand Name} — Authorized Distributor Dubai` | Brand gradient color |
| **Blog Posts** | `blog-og-template` | Blog post title | Blog featured image (blurred + darkened) |
| **Case Studies** | `case-study-og-template` | `{Client Name} — {Industry} Success Story` | Case study hero image |
| **ERP Modules** | `erp-module-og-template` | `UniERP {Module Name}` | Module-specific icon + brand gradient |
| **Legal Pages** | `legal-og-template` | `{Page Title}` | Brand gradient (simple, no imagery) |

### Tier 3: Fallback (Default OG Image)

| Page | File | Headline |
|---|---|---|
| **Default (all pages without custom OG)** | `default-og-{lang}.jpg` | Simal Technologies Middle East — IT Distribution & ERP Solutions |

---

## Dynamic OG Image Generation Pipeline

For Tier-2 pages (product detail, blog posts, etc.), OG images are generated dynamically at build time or via serverless function:

```
Request: GET /api/og-image?type=product&slug=crucial-p3-plus-1tb&lang=en

Pipeline:
1. Validate slug + fetch page content from CMS
2. Select template (product/brand/blog/case-study)
3. Fetch product image / featured image from CDN
4. Resize & apply blur + dark overlay to background
5. Render headline text with Inter Bold font
6. Composite logo at top-left
7. Output: 1200×630px JPG (quality 85%) + WebP (quality 75%)
8. Cache at CDN edge for 30 days (purge on content update)
```

### Technology Stack (Recommendation)

| Option | Pros | Cons |
|---|---|---|
| **Vercel OG Image (Satori)** | JSX-based templates; fast; free tier generous | Vercel-specific |
| **Cloudinary Transformations** | No code needed; powerful image API | Monthly cost at scale |
| **Puppeteer/Sharp (Node.js)** | Full control; any design | Server maintenance overhead |
| **Canva Enterprise API** | Designer-friendly templates | API limitations |

*Recommended: Vercel OG Image (Satori) for build-time + Cloudinary for on-the-fly transformations.*

---

## OG Image Per-Language Variants

| Language | File Suffix | Headline Font | RTL Handling |
|---|---|---|---|
| **English (EN)** | `-en` | Inter Bold | LTR default |
| **Arabic (AR)** | `-ar` | Tajawal Bold | RTL headline alignment; logo moves to top-right |
| **French (FR)** | `-fr` | Inter Bold | LTR default |
| **Russian (RU)** | `-ru` | Inter Bold (Cyrillic) | LTR default |

### Arabic OG Image Adaptation

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │   [LOGO — top-right for Arabic]                            │  │
│  │                                                            │  │
│  │                              ┌─────────────────────────┐   │  │
│  │                              │  {ARABIC HEADLINE}      │   │  │
│  │                              │  Right-aligned          │   │  │
│  │                              └─────────────────────────┘   │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## OG Image Quality Assurance

| Check | Standard |
|---|---|
| **Facebook Sharing Debugger** | Test every OG image URL at https://developers.facebook.com/tools/debug/ |
| **LinkedIn Post Inspector** | Test at https://www.linkedin.com/post-inspector/ |
| **Twitter Card Validator** | Test at https://cards-dev.twitter.com/validator |
| **Text Legibility** | Headline must be readable at 50% scale (simulates mobile preview) |
| **Alt Text** | Every `og:image:alt` must be descriptive (used by screen readers and when image fails to load) |
| **File Size** | < 300 KB (JPG); < 150 KB (WebP). Large files slow social platform crawling |
| **No Text in Safe Zone** | Text must not appear in the bottom ~80px (overlaid by social platform UI elements) |
| **Brand Consistency** | Logo, colors, and typography must match Simal brand guidelines across all OG images |

---

## OG Meta Tags — Complete Reference

```html
<!-- Required OG Tags (every page) -->
<meta property="og:title" content="{Meta Title}" />
<meta property="og:description" content="{Meta Description}" />
<meta property="og:image" content="https://simalme.com/images/og/{page-slug}-en.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{Descriptive alt text}" />
<meta property="og:url" content="https://simalme.com/{page-path}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Simal Technologies Middle East" />
<meta property="og:locale" content="en_AE" />

<!-- Per-language OG locale -->
<meta property="og:locale:alternate" content="ar_AE" />
<meta property="og:locale:alternate" content="fr_FR" />
<meta property="og:locale:alternate" content="ru_RU" />

<!-- Twitter Card (every page) -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@SimalTech" />
<meta name="twitter:title" content="{Meta Title}" />
<meta name="twitter:description" content="{Meta Description}" />
<meta name="twitter:image" content="https://simalme.com/images/og/{page-slug}-en.jpg" />
<meta name="twitter:image:alt" content="{Descriptive alt text}" />

<!-- Article-specific (blog posts, case studies, news) -->
<meta property="og:type" content="article" />
<meta property="article:published_time" content="{ISO 8601 datetime}" />
<meta property="article:modified_time" content="{ISO 8601 datetime}" />
<meta property="article:author" content="{Author name}" />
<meta property="article:section" content="{Category}" />
```

---

## Frequently Asked Questions

**Q: Why 1200×630px and not other dimensions?**
A: 1200×630px (1.91:1 ratio) is the universally recommended OG image size. It works optimally across Facebook, LinkedIn, WhatsApp, Telegram, and most other social platforms.

**Q: Do all pages need a custom OG image?**
A: Tier-1 pages (homepage, key brands, ERP landing, about, contact) get custom-designed OG images. Tier-2 pages use dynamic templates. A default fallback image is used for all other pages.

**Q: How do I test if my OG image works?**
A: Use the Facebook Sharing Debugger (developers.facebook.com/tools/debug), LinkedIn Post Inspector, and Twitter Card Validator. Also test by pasting the URL into WhatsApp/Telegram to see the preview.

**Q: Should OG images include the page URL or domain?**
A: No. The domain is displayed by the social platform automatically. Including it in the image wastes space and looks cluttered.

**Q: How do I handle OG images for Arabic (RTL) pages?**
A: Arabic OG images mirror the layout — logo moves to top-right, text is right-aligned, and the Tajawal font is used instead of Inter.

---

## Cross-Linking & Navigation

- [Meta Titles — All Pages](/15_SEO_Metadata/01_Meta_Titles_All_Pages)
- [Meta Descriptions — All Pages](/15_SEO_Metadata/02_Meta_Descriptions_All_Pages)
- [Structured Data JSON-LD](/15_SEO_Metadata/04_Structured_Data_JSON_LD)
- [Image Alt Text](/15_SEO_Metadata/05_Image_Alt_Text_All_Images)
- [Media Assets Overview](/16_Media_Assets/01_Media_Assets_Overview)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. OG Image Spec v2.0. All OG images are proprietary marketing assets of Simal Technologies.*
