# 01 Media Assets Overview

> **Source:** Simal Technologies Design System — Digital Asset Management (DAM)
> **Purpose:** Central inventory and specifications for all media assets used across simalme.com and B2B portal
> **Storage:** AWS S3 / Cloudinary CDN + local CMS media library
> **Last Updated:** May 2, 2026

---

## Asset Categories Inventory

| Category | Count | Storage Path | Format |
|---|---|---|---|
| **Logo & Brand Assets** | 12+ variants | `/images/brand/` | SVG, PNG |
| **Icons & UI Elements** | 80+ icons | `/images/icons/` | SVG |
| **Product Images** | 76+ products × 3-5 angles | `/images/products/` | JPG, WebP |
| **Brand Logos (Partner)** | 22+ brand logos | `/images/brands/` | SVG, PNG |
| **Team & Office Photography** | 30+ photos | `/images/company/` | JPG, WebP |
| **Hero Banners** | 15+ banners | `/images/hero/` | JPG, WebP |
| **Empty State Illustrations** | 15 illustrations | `/images/empty-states/` | SVG |
| **OG Social Images** | 20+ OG images | `/images/og/` | JPG, WebP |
| **Background Textures** | 5 textures | `/images/bg/` | JPG, WebP |
| **Video Assets** | 5+ videos | `/videos/` | MP4, WebM |
| **Downloadable Documents** | 20+ PDFs | `/downloads/` | PDF |
| **Email Template Images** | 10+ images | `/images/email/` | PNG, JPG |

---

## Global Image Specifications

| Property | Standard | Notes |
|---|---|---|
| **Color Space** | sRGB | Ensure consistent color across devices |
| **Resolution** | 72 DPI (web) | Higher DPI has no benefit for screen display |
| **Compression** | JPG: Quality 80-85%, WebP: Quality 75% | Balance quality and file size |
| **Max File Size** | Hero: 300KB, Product: 150KB, Thumbnails: 30KB | Optimize all images pre-deployment |
| **Lazy Loading** | `loading="lazy"` on below-fold images | Native lazy loading + JS fallback |
| **Responsive Images** | `srcset` + `sizes` for all content images | 3-4 breakpoints: 400w, 800w, 1200w, 1800w |
| **Next-Gen Formats** | WebP with JPG/PNG fallback | `<picture>` element for format switching |
| **Alt Text** | Required for all non-decorative images | Per-language alt text (EN, AR, FR, RU) |

---

## CDN & Delivery

| Aspect | Configuration |
|---|---|
| **CDN Provider** | Cloudflare (primary) + Cloudinary (image optimization) |
| **Image Optimization** | Automatic format selection, compression, and resizing via Cloudinary `f_auto,q_auto` |
| **Cache Policy** | Static assets: 1 year (`Cache-Control: public, max-age=31536000, immutable`) |
| **Versioning** | Fingerprinted filenames: `hero-homepage.a1b2c3d4.jpg` |
| **CORS** | CORS headers enabled for CDN assets used across subdomains |

---

## Naming Convention

```
{category}/{asset-name}-{descriptor}-{dimensions}.{format}

Examples:
/images/products/crucial-p3-plus-1tb-front-800.jpg
/images/brands/hikvision-logo-color.svg
/images/hero/about-us-dubai-skyline-1920.webp
/images/team/leadership-group-2026-1200.jpg
/images/icons/icon-shipping-fast.svg
```

---

## Image Breakpoints (Responsive)

| Breakpoint Name | Width | Usage |
|---|---|---|
| **Thumbnail** | 150px | Product cards, related items |
| **Small** | 400px | Mobile product images, blog thumbnails |
| **Medium** | 800px | Tablet product images, content images |
| **Large** | 1200px | Desktop product images, hero backgrounds |
| **Full** | 1920px | Full-width hero banners, background images |
| **OG Image** | 1200×630px | Social sharing |

---

## Asset Management Workflow

```
1. DESIGN          2. REVIEW           3. EXPORT
   ┌──────┐          ┌──────┐            ┌──────┐
   │Create│ ──────→  │Review│ ────────→  │Export│
   │Asset │          │& QA  │            │Optimal│
   └──────┘          └──────┘            │Format│
                                         └──┬───┘
                                            │
4. OPTIMIZE         5. UPLOAD           6. PUBLISH
   ┌──────┐          ┌──────┐            ┌──────┐
   │Compre│ ←─────── │Upload│ ←──────── │Deploy│
   │ss    │          │to CDN│           │to CDN│
   └──────┘          └──────┘            └──────┘
```

---

## Cross-Linking

- [Logo & Brand Assets](/16_Media_Assets/02_Logo_Brand_Assets)
- [Icon Library](/16_Media_Assets/03_Icon_Library)
- [Product Image Specifications](/16_Media_Assets/04_Product_Image_Specifications)
- [Team & Office Photography](/16_Media_Assets/05_Team_Office_Photography)
- [Hero Banner Specifications](/16_Media_Assets/06_Hero_Banner_Specifications)
- [Image Alt Text Standards](/15_SEO_Metadata/05_Image_Alt_Text_All_Images)
- [Open Graph Images](/15_SEO_Metadata/03_Open_Graph_Images_Key_Pages)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Media Assets Overview v1.0. All assets are proprietary intellectual property of Simal Technologies.*
