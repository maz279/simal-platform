# 03 Hero Banner Images

> **Source:** Simal Technologies Creative Brief — May 2026
> **Owner:** Creative Team / UI Designer
> **Version:** 1.0

---

## 1. Overview

This document specifies all hero banner images required for the Simal Technologies corporate website. Hero banners are the primary visual elements on each top-level page, setting the tone, communicating value propositions, and guiding users to key conversion actions.

### 1.1 Banner Inventory

| # | Page | Quantity | Dimensions | Priority |
|---|------|----------|------------|----------|
| 1 | **Homepage Slider** | 7 rotating banners | 1920 × 800 px | P0 — Critical |
| 2 | **About Us** | 1 static banner | 1920 × 600 px | P1 — High |
| 3 | **IT Distribution — Category Headers** | 5 banners | 1920 × 500 px | P0 — Critical |
| 4 | **UniERP Landing** | 1 static banner | 1920 × 600 px | P0 — Critical |
| 5 | **Careers** | 1 static banner | 1920 × 500 px | P1 — High |
| 6 | **Contact** | 1 static banner | 1920 × 500 px | P1 — High |
| 7 | **B2B Portal** | 1 static banner | 1920 × 500 px | P1 — High |
| 8 | **Partners & Resellers** | 1 static banner | 1920 × 500 px | P2 — Medium |

**Total:** 17 banner images

---

## 2. Global Banner Specifications

### 2.1 Technical Standards

| Parameter | Specification |
|-----------|--------------|
| **Master Resolution** | 1920 × {height} px at 72 DPI (web) |
| **Retina Variant** | 3840 × {height*2} px at 144 DPI (2×) |
| **Color Space** | sRGB IEC61966-2.1 |
| **File Format — Web** | WebP (primary) + JPEG (fallback) |
| **WebP Quality** | 80% |
| **JPEG Quality** | 82% |
| **Max File Size (1×)** | ≤ 300 KB per banner |
| **Max File Size (2×)** | ≤ 800 KB per banner |
| **Aspect Ratio** | 1920:{height} — see per-page specs |

### 2.2 Overlay Specifications

Every hero banner has a consistent overlay to ensure text readability:

```
┌─────────────────────────────────────────────────────────┐
│  Banner Image (1920 × {height} px)                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Gradient Overlay (Left to Right)                    │ │
│  │  ┌──────────┐                                       │ │
│  │  │ Solid    │  Linear Gradient                      │ │
│  │  │ Overlay  │  rgba(0,0,0,0.65) → rgba(0,0,0,0.15) │ │
│  │  │ 40% width│                                       │ │
│  │  │          │                                       │ │
│  │  │ HEADLINE │                                       │ │
│  │  │ Subtitle │                                       │ │
│  │  │ [CTA Btn]│                                       │ │
│  │  └──────────┘                                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Overlay CSS:**
```css
.hero-overlay {
  background: linear-gradient(
    90deg,
    rgba(0, 27, 48, 0.75) 0%,
    rgba(0, 27, 48, 0.45) 50%,
    rgba(0, 27, 48, 0.10) 100%
  );
}
```

### 2.3 Responsive Breakpoints

| Breakpoint | Width | Height | Crop Strategy |
|------------|-------|--------|---------------|
| **Desktop (≥1200px)** | 1920 px | Full native height | Full image |
| **Tablet (768–1199px)** | 1536 px | Proportional | Center-crop, preserve focal point |
| **Mobile (<768px)** | 750 px | 500 px | Center-crop, crop from right (text-safe zone on left) |

### 2.4 Text-Safe Zone

All banners must reserve a **text-safe zone** on the left side:

| Banner Type | Safe Zone (Left) | Safe Zone (Right) |
|-------------|-----------------|-------------------|
| Homepage Slider | 0–600 px (left 31%) | 600–1920 px (image area) |
| Category Headers | 0–550 px (left 28%) | 550–1920 px (image area) |
| Sub-pages (About, Careers, etc.) | 0–500 px (left 26%) | 500–1920 px (image area) |

---

## 3. Homepage Hero Slider — 7 Banners

### 3.1 Slider Behavior

| Parameter | Value |
|-----------|-------|
| **Autoplay** | Yes; 5-second interval |
| **Transition** | Cross-fade (1.2s ease-in-out) |
| **Pause on Hover** | Yes |
| **Navigation** | Dot indicators (bottom center) + left/right arrows |
| **Touch Swipe** | Enabled on mobile |
| **First Load** | Random or personalized (if returning visitor) |

### Banner 1: IT Hardware Distribution

| Element | Content |
|---------|---------|
| **Image Concept** | Wide warehouse/distribution center with IT hardware pallets, Simal-branded forklift, organized shelving |
| **Headline (EN)** | "Your Trusted IT Hardware Distributor in the Middle East" |
| **Headline (AR)** | "موزع أجهزة تكنولوجيا المعلومات الموثوق به في الشرق الأوسط" |
| **Subtitle** | "15 World-Class Brands · 76+ Products · Dubai-Based · Serving GCC, Africa & CIS" |
| **CTA Primary** | "Browse Products" → `/it-distribution/product-catalog/` |
| **CTA Secondary** | "Become a Reseller" → `/partners-resellers/` |
| **Focal Point** | Center-right: warehouse shelves with products |

### Banner 2: UniERP Software Solutions

| Element | Content |
|---------|---------|
| **Image Concept** | Modern office dashboard on large monitor showing UniERP interface, diverse team collaborating, sleek office environment |
| **Headline (EN)** | "UniERP — Enterprise Resource Planning, Simplified" |
| **Headline (AR)** | "يوني إي آر بي — تخطيط موارد المؤسسات، بكل بساطة" |
| **Subtitle** | "Powered by Odoo 19 CE · 40+ Modules · 60+ Industry Verticals · From AED 299/month" |
| **CTA Primary** | "Request a Demo" → `/contact/demo-request/` |
| **CTA Secondary** | "Explore Modules" → `/software-erp-solutions/` |
| **Focal Point** | Center-right: UniERP dashboard on monitor screen |

### Banner 3: HIKVISION Security Solutions

| Element | Content |
|---------|---------|
| **Image Concept** | City surveillance scenario: building exterior with HIKVISION cameras, control room with multi-screen NVR display, sharp nighttime ColorVu image |
| **Headline (EN)** | "HIKVISION — Official Distributor for the Middle East" |
| **Headline (AR)** | "هايك فيجن — الموزع الرسمي لمنطقة الشرق الأوسط" |
| **Subtitle** | "IP Cameras · NVRs · Access Control · Intercom · AI-Powered AcuSense & ColorVu Technology" |
| **CTA Primary** | "View HIKVISION Products" → `/it-distribution/brands/hikvision/` |
| **CTA Secondary** | "Request a Quote" → `/contact/request-quote/` |
| **Focal Point** | Right: Outdoor camera with ColorVu night scene |

### Banner 4: Crucial & Memory Solutions

| Element | Content |
|---------|---------|
| **Image Concept** | Close-up of SSD/RAM installation in high-performance PC, T500 SSD with speed callout (7,400 MB/s), gaming/workstation setup |
| **Headline (EN)** | "Performance Unleashed — Crucial DDR5 & Gen5 NVMe SSDs" |
| **Headline (AR)** | "أداء بلا حدود — كروشال DDR5 و أقراص NVMe من الجيل الخامس" |
| **Subtitle** | "Up to 7,400 MB/s Read · DDR5-5600 · PCIe Gen5 · Bulk Pricing for Resellers" |
| **CTA Primary** | "Shop Crucial Products" → `/it-distribution/brands/crucial/` |
| **Focal Point** | Right: SSD with speed overlay |

### Banner 5: Multi-Brand Ecosystem

| Element | Content |
|---------|---------|
| **Image Concept** | Collage of multiple brand products: Koorui monitor, UGREEN dock, WD drive, TEAMGROUP RAM, Zotac mini PC — all integrated in one desk setup |
| **Headline (EN)** | "15 Brands. One Distributor. Infinite Possibilities." |
| **Headline (AR)** | "15 علامة تجارية. موزع واحد. إمكانيات لا نهائية." |
| **Subtitle** | "From SSDs to Surveillance — Everything Your Business Needs Under One Roof" |
| **CTA Primary** | "Explore All Brands" → `/it-distribution/brands/` |
| **Focal Point** | Center: Integrated desk setup with multiple products |

### Banner 6: UAE Market Leadership

| Element | Content |
|---------|---------|
| **Image Concept** | Dubai skyline with Burj Khalifa, Simal office building (Dar Al Riffa), map of GCC/Africa/CIS coverage |
| **Headline (EN)** | "Based in Dubai, Serving the World" |
| **Headline (AR)** | "مقرنا دبي، نخدم العالم" |
| **Subtitle** | "23+ Years of Excellence · Bur Dubai HQ · JAFZA Warehouse · Dhaka Operations" |
| **CTA Primary** | "About Simal" → `/about-us/` |
| **CTA Secondary** | "Contact Us" → `/contact/` |
| **Focal Point** | Right: Dubai skyline with office building highlighted |

### Banner 7: B2B Partner Program

| Element | Content |
|---------|---------|
| **Image Concept** | Handshake between business professionals, Simal distribution network diagram, B2B portal on tablet screen |
| **Headline (EN)** | "Partner with Simal — Grow Your Business" |
| **Headline (AR)** | "شارك سيمال — طور أعمالك" |
| **Subtitle** | "Exclusive Reseller Pricing · Trade License Registration · Dedicated Account Manager · 24-Hour Approval" |
| **CTA Primary** | "Register as Partner" → `/b2b-customer-portal/register/` |
| **Focal Point** | Right: B2B portal interface on tablet |

---

## 4. Category Header Banners — IT Distribution (5 Banners)

### 4.1 Surveillance & Security

| Element | Content |
|---------|---------|
| **Image** | Control room with multi-screen HIKVISION NVR display, camera feeds visible |
| **Headline** | "Surveillance & Security Solutions" |
| **Subtitle** | "HIKVISION · AcuSense · ColorVu · AI-Powered Analytics" |
| **Overlay Side** | Left |

### 4.2 Computing & Memory

| Element | Content |
|---------|---------|
| **Image** | High-end PC build: Crucial SSD, TEAMGROUP RAM, GSKILL RAM installed on motherboard |
| **Headline** | "Computing & Memory" |
| **Subtitle** | "Crucial · TEAMGROUP · GSKILL · WD · Toshiba" |
| **Overlay Side** | Left |

### 4.3 Displays & Graphics

| Element | Content |
|---------|---------|
| **Image** | Triple Koorui monitor setup, Zotac/Inno3D GPU visible in PC case, vibrant gaming/content on screens |
| **Headline** | "Displays & Graphics" |
| **Subtitle** | "Koorui · Zotac · Inno3D" |
| **Overlay Side** | Left |

### 4.4 Connectivity & Accessories

| Element | Content |
|---------|---------|
| **Image** | Desk setup: UGREEN dock connected to laptop, multiple cables visible, power bank, charger |
| **Headline** | "Connectivity & Accessories" |
| **Subtitle** | "UGREEN · ARKTEK · Aiwa · Honeywell" |
| **Overlay Side** | Left |

### 4.5 Audio & Conferencing

| Element | Content |
|---------|---------|
| **Image** | Conference room: Nearity ceiling microphone, Aiwa speaker, meeting in progress |
| **Headline** | "Audio & Conferencing Solutions" |
| **Subtitle** | "Nearity · Aiwa" |
| **Overlay Side** | Left |

---

## 5. Sub-Page Hero Banners

### 5.1 About Us

| Element | Content |
|---------|---------|
| **Image** | Simal Technologies office building (Dar Al Riffa, Bur Dubai) exterior, professional team photo inset |
| **Headline** | "About Simal Technologies" |
| **Subtitle** | "23+ Years of IT Distribution Excellence in the Middle East" |
| **Dimensions** | 1920 × 600 px |

### 5.2 UniERP Landing

| Element | Content |
|---------|---------|
| **Image** | Modern office with UniERP dashboard visible on large screen, team collaborating with data visualizations, clean corporate aesthetic |
| **Headline** | "UniERP — Transform Your Business" |
| **Subtitle** | "Enterprise Resource Planning Powered by Odoo 19 Community Edition" |
| **Dimensions** | 1920 × 600 px |

### 5.3 Careers

| Element | Content |
|---------|---------|
| **Image** | Diverse Simal team in modern office, collaborative workspace, team meeting, casual professional atmosphere |
| **Headline** | "Join Our Team" |
| **Subtitle** | "Build Your Career with a Growing IT Distribution Leader in Dubai" |
| **Dimensions** | 1920 × 500 px |

### 5.4 Contact

| Element | Content |
|---------|---------|
| **Image** | Dubai skyline / Simal office reception area, professional greeting atmosphere, map hint of Bur Dubai |
| **Headline** | "Get in Touch" |
| **Subtitle** | "Office 201, Dar Al Riffa Building, Bur Dubai — +971 4 393 0507" |
| **Dimensions** | 1920 × 500 px |

### 5.5 B2B Portal

| Element | Content |
|---------|---------|
| **Image** | Professional B2B interaction: business handshake, tablet showing order dashboard, warehouse/distribution context |
| **Headline** | "Simal B2B Partner Portal" |
| **Subtitle** | "Exclusive Pricing · Real-Time Inventory · Order Tracking · Dedicated Support" |
| **Dimensions** | 1920 × 500 px |

### 5.6 Partners & Resellers

| Element | Content |
|---------|---------|
| **Image** | Distribution network map (GCC, Africa, CIS highlighted), partner logos collage, business handshake |
| **Headline** | "Become a Simal Partner" |
| **Subtitle** | "Join 500+ Active Resellers Across the Middle East, Africa & CIS" |
| **Dimensions** | 1920 × 500 px |

---

## 6. Design Constraints & Guidelines

### 6.1 Photography Style Guide

| Element | Guideline |
|---------|----------|
| **Tone** | Professional, trustworthy, technology-forward, warm Middle Eastern hospitality |
| **Lighting** | Natural + studio blend; bright, inviting, no harsh shadows |
| **Color Palette** | Dominant: Brand blue (#005B9F) accents; Neutral: Grays, whites; Complementary: Warm golds, teal |
| **People** | Diverse (South Asian, Arab, African, European), professional attire (business casual to formal) |
| **Technology** | Current-generation hardware, clean cables, screen content relevant to context |
| **Location** | UAE/Dubai recognizable (but not cliché); subtle architectural cues |

### 6.2 Typography Overlay

```css
.hero-headline {
  font-family: 'Inter', 'Tajawal', sans-serif;
  font-size: 3rem;        /* 48px */
  font-weight: 700;
  line-height: 1.15;
  color: #FFFFFF;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  max-width: 550px;
}

.hero-subtitle {
  font-size: 1.125rem;    /* 18px */
  font-weight: 400;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  max-width: 500px;
  margin-top: 16px;
}

/* Mobile */
@media (max-width: 768px) {
  .hero-headline { font-size: 1.75rem; }
  .hero-subtitle { font-size: 0.95rem; }
}
```

### 6.3 CTA Button Styling

```css
.hero-cta-primary {
  background: #005B9F;
  color: #FFFFFF;
  padding: 14px 32px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.3s;
}

.hero-cta-primary:hover {
  background: #009CDE;
}

.hero-cta-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 12px 30px;
  border-radius: 6px;
  margin-left: 12px;
}
```

---

## 7. HTML Implementation Template

```html
<section class="hero-banner" data-page="homepage" data-slide="1">
  <picture>
    <!-- Desktop -->
    <source 
      media="(min-width: 1200px)"
      srcset="
        /assets/hero/homepage-slide-1_1920x800.webp 1x,
        /assets/hero/homepage-slide-1_3840x1600.webp 2x"
      type="image/webp">
    <!-- Tablet -->
    <source 
      media="(min-width: 768px)"
      srcset="
        /assets/hero/homepage-slide-1_1536x640.webp 1x,
        /assets/hero/homepage-slide-1_3072x1280.webp 2x"
      type="image/webp">
    <!-- Mobile -->
    <source 
      srcset="
        /assets/hero/homepage-slide-1_750x500.webp 1x,
        /assets/hero/homepage-slide-1_1500x1000.webp 2x"
      type="image/webp">
    <!-- JPEG Fallback -->
    <img 
      src="/assets/hero/homepage-slide-1_1920x800.jpg"
      alt="Simal Technologies — Your Trusted IT Hardware Distributor in the Middle East"
      width="1920"
      height="800"
      loading="eager"
      fetchpriority="high"
      decoding="async">
  </picture>
  
  <div class="hero-overlay">
    <div class="hero-content">
      <h1 class="hero-headline">Your Trusted IT Hardware Distributor in the Middle East</h1>
      <p class="hero-subtitle">15 World-Class Brands · 76+ Products · Dubai-Based · Serving GCC, Africa & CIS</p>
      <div class="hero-cta-group">
        <a href="/it-distribution/product-catalog/" class="hero-cta-primary">Browse Products</a>
        <a href="/partners-resellers/" class="hero-cta-secondary">Become a Reseller</a>
      </div>
    </div>
  </div>
</section>
```

---

## 8. Multi-Language Banner Matrix

| Language | Headline Text | Subtitle Text | CTA Text |
|----------|--------------|---------------|----------|
| **English (EN)** | See per-banner specs above | See per-banner specs above | "Browse Products" / "Learn More" |
| **Arabic (AR)** | Full Arabic translation | Full Arabic translation | "تصفح المنتجات" / "اعرف المزيد" |
| **French (FR)** | Key pages only | Key pages only | "Voir les Produits" / "En Savoir Plus" |
| **Russian (RU)** | Key pages only | Key pages only | "Смотреть Товары" / "Узнать Больше" |

**Implementation:** Use CMS localization fields or a JSON translation file. Each language variant loads the same image but different text overlay.

---

## 9. Performance Optimization

### 9.1 Loading Strategy

| Priority | Images | Strategy |
|----------|--------|----------|
| **Critical** | Homepage slide 1 (first visible) | `fetchpriority="high"`, `loading="eager"`, preload in `<head>` |
| **High** | Homepage slides 2-3, category headers | `loading="eager"` for first viewport; `lazy` for below-fold |
| **Normal** | Remaining slides, sub-page headers | `loading="lazy"` |

### 9.2 Preload Directive

```html
<!-- In <head> for first homepage slide only -->
<link 
  rel="preload" 
  as="image" 
  href="/assets/hero/homepage-slide-1_1920x800.webp" 
  imagesrcset="
    /assets/hero/homepage-slide-1_1920x800.webp 1920w,
    /assets/hero/homepage-slide-1_1536x640.webp 1536w,
    /assets/hero/homepage-slide-1_750x500.webp 750w"
  imagesizes="100vw"
  type="image/webp">
```

### 9.3 LQIP (Low Quality Image Placeholder)

For banners loaded lazily, use a 20×10 px blurred placeholder:

```html
<img 
  src="data:image/webp;base64,...[20px blurred placeholder]..."
  data-src="/assets/hero/slide-4_1920x500.webp"
  class="lazy-hero"
  alt="...">
```

---

## 10. Shoot & Production Brief

### 10.1 Locations

| Image Type | Location | Props/Setup |
|------------|----------|------------|
| Warehouse/Distribution | StarSeed Technologies, JAFZA | Simal-branded pallets, forklift, shelving |
| Office/Corporate | Dar Al Riffa Building, Bur Dubai Office 201 | Meeting rooms, desks, team members |
| Control Room | Staged setup or real NVR installation site | Multi-screen HIKVISION NVR, camera feeds |
| Desk/Gaming Setup | In-studio or real office setup | Koorui monitors, PC builds, accessories |
| Dubai Skyline | Outdoor (Sheikh Zayed Road, Dubai Marina) | Golden hour / blue hour lighting |

### 10.2 Model Release & Permissions

- All identifiable people in photographs require signed **model release forms**
- Dubai skyline photography: no special permissions required for public vantage points
- Office interior photography: property owner permission (Dar Al Riffa management)
- Warehouse photography: StarSeed Technologies internal approval

---

> **Next File:** [04_Team_Photography.md](./04_Team_Photography.md) — Professional headshots and team photography specifications.

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

---

*Simal Technologies Middle East LLC — Hero Banner Specifications — CONFIDENTIAL — Version 1.0 — May 2026*
