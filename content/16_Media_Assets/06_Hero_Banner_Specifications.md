# 06 Hero Banner Specifications

> **Category:** Hero Banners
> **Storage:** `/images/hero/`
> **Formats:** JPG (primary), WebP (optimized)
> **Last Updated:** May 2, 2026

---

## Hero Banner Inventory

| Page | File | Dimensions | Max Size |
|---|---|---|---|
| **Homepage — IT Hardware** | `hero-homepage-hardware-1920.jpg` | 1920×800px | 300KB |
| **Homepage — ERP** | `hero-homepage-erp-1920.jpg` | 1920×800px | 300KB |
| **About Us** | `hero-about-1920.jpg` | 1920×600px | 250KB |
| **IT Distribution** | `hero-it-distribution-1920.jpg` | 1920×600px | 250KB |
| **UniERP Overview** | `hero-unierp-1920.jpg` | 1920×700px | 280KB |
| **HIKVISION Brand** | `hero-hikvision-1920.jpg` | 1920×600px | 250KB |
| **Careers** | `hero-careers-1920.jpg` | 1920×600px | 250KB |
| **Contact** | `hero-contact-1920.jpg` | 1920×500px | 200KB |
| **B2B Portal** | `hero-b2b-1920.jpg` | 1920×650px | 250KB |
| **Resources** | `hero-resources-1920.jpg` | 1920×500px | 200KB |

---

## Hero Design Specifications

| Element | Specification |
|---|---|
| **Overlay** | Dark gradient overlay (60-70% opacity) for text readability: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))` |
| **Text Area** | Centered or left-aligned; max-width 650px for headline |
| **CTA Buttons** | 1-2 buttons: Primary (Brand Blue #005B9F) + Secondary (Outline White) |
| **Mobile Crop** | Center-weighted composition; critical elements in center 60% (edges crop on mobile) |
| **Responsive** | 1920px → 1200px → 800px → 400px variants |

---

## Hero HTML Implementation

```html
<section class="hero" style="background-image: url('/images/hero/hero-homepage-hardware-1920.webp')">
  <div class="hero__overlay">
    <div class="hero__content">
      <h1>IT Hardware Distribution & UniERP Solutions in Dubai</h1>
      <p>22+ global brands. 500+ B2B clients. 30+ countries.</p>
      <a href="/products" class="btn btn--primary">Browse Products</a>
      <a href="/contact" class="btn btn--outline">Contact Sales</a>
    </div>
  </div>
</section>
```

---

*© 2026 Simal Technologies Middle East LLC. Hero Banner Spec v1.0.*
