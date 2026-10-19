# 02 Logo & Brand Assets

> **Category:** Brand Identity
> **Storage:** `/images/brand/`
> **Formats:** SVG (primary), PNG (fallback)
> **Last Updated:** May 2, 2026

---

## Primary Logo Variants

| Variant | File | Format | Dimensions | Usage |
|---|---|---|---|---|
| **Full Color — Horizontal** | `simal-logo-horizontal-color.svg` | SVG | 600×60px viewBox | Website header, email signatures, light backgrounds |
| **Full Color — Vertical/Stacked** | `simal-logo-stacked-color.svg` | SVG | 200×120px viewBox | Footer, mobile header, partner pages |
| **White — Horizontal** | `simal-logo-horizontal-white.svg` | SVG | 600×60px viewBox | Dark backgrounds, hero overlays, footer dark sections |
| **White — Vertical** | `simal-logo-stacked-white.svg` | SVG | 200×120px viewBox | Dark hero banners, video overlays |
| **Monochrome — Black** | `simal-logo-horizontal-black.svg` | SVG | 600×60px viewBox | Print, invoices, letterheads |
| **Icon Only** | `simal-icon-color.svg` | SVG | 64×64px viewBox | Favicon, app icon, social media avatar |

---

## UniERP Logo Variants

| Variant | File | Format | Usage |
|---|---|---|---|
| **UniERP Full Color** | `unierp-logo-horizontal-color.svg` | SVG | UniERP section header, ERP pages, marketing |
| **UniERP White** | `unierp-logo-horizontal-white.svg` | SVG | Dark ERP hero sections |
| **UniERP Icon** | `unierp-icon-color.svg` | SVG | Module icons, favicon, tab icon |

---

## Sub-Brand Logos

| Brand | File | Usage |
|---|---|---|
| **StarSeed Technologies** | `starseed-logo-color.svg` | Warehouse/JAFZA references |
| **Stellent Technologies** | `stellent-logo-color.svg` | Retail references |
| **Smart Technologies BD** | `smart-tech-bd-logo-color.svg` | Dhaka development center references |

---

## Usage Guidelines

### Clear Space

```
┌─────────────────────────────────────────────┐
│                                             │
│   ← X →  ┌──────────────┐  ← X →           │
│   ↑      │              │   ↑               │
│   X      │  SIMAL LOGO  │   X               │
│   ↓      │              │   ↓               │
│   ← X →  └──────────────┘  ← X →           │
│                                             │
│   X = height of "S" in "SIMAL"              │
│                                             │
└─────────────────────────────────────────────┘
```

### Minimum Sizes

| Medium | Minimum Width |
|---|---|
| **Digital (Desktop)** | 200px |
| **Digital (Mobile)** | 140px |
| **Print** | 40mm |
| **Favicon** | 16×16px (icon variant only) |

### Color Palette

| Color | Hex | RGB | Usage |
|---|---|---|---|
| **Brand Blue** | `#005B9F` | 0, 91, 159 | Primary logo color, CTAs, links |
| **Brand Blue Dark** | `#003D6B` | 0, 61, 107 | Hover states, dark backgrounds |
| **Brand Blue Light** | `#E8F0F8` | 232, 240, 248 | Light backgrounds, info boxes |
| **Accent Orange** | `#F47920` | 244, 121, 32 | Highlights, sale badges, secondary CTAs |
| **Text Dark** | `#1A1D23` | 26, 29, 35 | Body text, headings |
| **Text Grey** | `#6B7280` | 107, 114, 128 | Secondary text, captions |

### Logo Don'ts

| ❌ Don't | ✅ Do |
|---|---|
| Stretch or distort proportions | Always maintain aspect ratio |
| Change logo colors | Use only approved color variants |
| Rotate the logo | Keep horizontal/vertical as designed |
| Add drop shadows or effects | Use flat, clean presentation |
| Place on busy backgrounds | Ensure sufficient contrast |
| Use low-resolution raster files | Use SVG for all digital applications |

---

## Favicon & App Icons

| Platform | File | Size | Format |
|---|---|---|---|
| **Favicon (Standard)** | `favicon.ico` | 16×16, 32×32, 48×48 | ICO |
| **Favicon (Modern)** | `favicon.svg` | Any (vector) | SVG |
| **Apple Touch Icon** | `apple-touch-icon.png` | 180×180 | PNG |
| **Android Chrome** | `android-chrome-192.png` | 192×192 | PNG |
| **Android Chrome** | `android-chrome-512.png` | 512×512 | PNG |
| **Microsoft Tile** | `mstile-150.png` | 150×150 | PNG |

---

## Logo HTML Implementation

```html
<!-- Header Logo -->
<a href="/" class="logo" aria-label="Simal Technologies Middle East — Home">
  <img 
    src="/images/brand/simal-logo-horizontal-color.svg" 
    alt="Simal Technologies Middle East" 
    width="200" 
    height="20"
  />
</a>

<!-- Responsive: Different logo on mobile -->
<picture>
  <source media="(max-width: 768px)" srcset="/images/brand/simal-icon-color.svg">
  <img src="/images/brand/simal-logo-horizontal-color.svg" alt="Simal Technologies Middle East">
</picture>
```

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Brand assets are registered trademarks. Unauthorized use prohibited.*
