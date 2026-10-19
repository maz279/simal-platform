# 13 Favicon & App Icons

> **Source:** Simal Technologies Design System — May 2026
> **Owner:** Creative Team / Web Developer
> **Version:** 1.0

---

## 1. Overview

Favicons and app icons are the smallest but most visible brand touchpoints. They appear in browser tabs, bookmarks, mobile home screens, and app stores. This document specifies every icon format required for complete cross-platform coverage.

### 1.1 Required Icon Inventory

| # | Icon Type | Dimensions | Format | Platform |
|---|-----------|-----------|--------|----------|
| 1 | **favicon.ico** (multi-size) | 16×16, 32×32, 48×48 | ICO | All browsers |
| 2 | **Favicon SVG** | Scalable | SVG | Modern browsers |
| 3 | **Favicon PNG** | 16×16, 32×32 | PNG | Legacy fallback |
| 4 | **Apple Touch Icon** | 180×180 | PNG | iOS Safari |
| 5 | **Apple Touch Icon (Precomposed)** | 120×120 | PNG | Older iOS |
| 6 | **Android Chrome Icons** | 192×192, 512×512 | PNG | Android / PWA |
| 7 | **Microsoft Tile Icon** | 150×150, 310×310 | PNG | Windows 10/11 |
| 8 | **PWA Maskable Icon** | 512×512 (with safe zone) | PNG | PWA install |
| 9 | **Web App Manifest Icons** | 72×72 through 512×512 | PNG | PWA |
| 10 | **Safari Pinned Tab** | Scalable (monochrome) | SVG | Safari macOS |
| 11 | **OpenGraph Image** | 1200×630 | PNG/WebP | Social sharing |

**Total files to deliver:** 15+

---

## 2. Favicon Specifications

### 2.1 favicon.ico (Multi-Res)

The classic ICO file contains multiple resolutions within a single file:

| Resolution | Use |
|-----------|-----|
| 16×16 | Browser tab, bookmarks bar |
| 32×32 | HiDPI browser tab |
| 48×48 | Windows taskbar, desktop shortcut |

**Design:** Simal Technologies icon-only logo (stylized "S" or geometric mark), brand blue (#005B9F) background with white mark.

**Generation:**
```bash
# Using ImageMagick
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico

# Or use online tool: realfavicongenerator.net
```

### 2.2 SVG Favicon (Modern)

```xml
<!-- /public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#005B9F"/>
  <!-- Simal icon mark in white -->
  <path d="M8 8h16v16H8z" fill="#FFFFFF" /> <!-- Simplified placeholder -->
</svg>
```

### 2.3 HTML Implementation

```html
<!-- In <head> -->
<!-- Classic favicon (legacy) -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="48x48">

<!-- SVG favicon (modern browsers) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">

<!-- PNG favicon (fallback) -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon (iOS) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">

<!-- Android Chrome -->
<link rel="manifest" href="/site.webmanifest">

<!-- Microsoft Tile -->
<meta name="msapplication-TileColor" content="#005B9F">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Safari Pinned Tab (macOS) -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#005B9F">

<!-- Theme Color -->
<meta name="theme-color" content="#005B9F">
```

---

## 3. Apple Touch Icons

### 3.1 Specifications

| Size | Device | Background |
|------|--------|------------|
| **180×180 px** | iPhone (iOS 7+) — Home Screen | #005B9F rounded rectangle |
| **120×120 px** | iPhone (older) / iPad mini | Same |
| **152×152 px** | iPad (Retina) | Same |
| **167×167 px** | iPad Pro | Same |

**Design:** Simal icon mark centered on brand blue background (#005B9F). No text — the app name is displayed by iOS below the icon. 20 px padding on all sides.

### 3.2 HTML

```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">
```

---

## 4. PWA (Progressive Web App) Icons

### 4.1 Web App Manifest

```json
// /public/site.webmanifest
{
  "name": "Simal Technologies — IT Distribution & ERP Solutions",
  "short_name": "Simal Technologies",
  "description": "Middle East IT hardware distributor — 15 brands, UniERP software",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#005B9F",
  "orientation": "any",
  "lang": "en",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 4.2 Maskable Icon Safe Zone

For PWA maskable icons, ensure the icon mark fits within a **safe zone** of 60% of the icon dimensions (centered):

```
┌─────────────────────────────┐
│  512×512 canvas              │
│  ┌───────────────────────┐  │
│  │  Safe Zone            │  │
│  │  307×307 (60%)         │  │
│  │  ┌─────────────┐      │  │
│  │  │  Simal Icon │      │  │
│  │  │    Mark     │      │  │
│  │  └─────────────┘      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 5. Microsoft Tile Icons

### 5.1 Specifications

| Size | Use |
|------|-----|
| **70×70 px** | Small tile |
| **150×150 px** | Medium tile |
| **310×150 px** | Wide tile |
| **310×310 px** | Large tile |

### 5.2 HTML & Config

```html
<meta name="msapplication-TileColor" content="#005B9F">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">
<meta name="msapplication-square70x70logo" content="/mstile-70x70.png">
<meta name="msapplication-square150x150logo" content="/mstile-150x150.png">
<meta name="msapplication-wide310x150logo" content="/mstile-310x150.png">
<meta name="msapplication-square310x310logo" content="/mstile-310x310.png">
```

```xml
<!-- /public/browserconfig.xml -->
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/mstile-70x70.png"/>
      <square150x150logo src="/mstile-150x150.png"/>
      <wide310x150logo src="/mstile-310x150.png"/>
      <square310x310logo src="/mstile-310x310.png"/>
      <TileColor>#005B9F</TileColor>
    </tile>
  </msapplication>
</browserconfig>
```

---

## 6. Safari Pinned Tab Icon

### 6.1 Specification

Safari pinned tab icons are monochrome SVG files. The `color` attribute in the `<link>` tag determines the fill color.

```xml
<!-- /public/safari-pinned-tab.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700">
  <!-- Must be single color; black paths will be filled by Safari's theme -->
  <path d="M350 100 C250 100 100 200 100 350 C100 500 250 600 350 600 C450 600 600 500 600 350 C600 200 450 100 350 100 Z" fill="black"/>
  <!-- Simal mark simplified for monochrome -->
</svg>
```

```html
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#005B9F">
```

---

## 7. Complete HTML Head Template

```html
<!-- Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">

<!-- Android / PWA -->
<link rel="manifest" href="/site.webmanifest">

<!-- Microsoft -->
<meta name="msapplication-TileColor" content="#005B9F">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Safari Pinned -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#005B9F">

<!-- Theme -->
<meta name="theme-color" content="#005B9F">
```

---

## 8. Generation Tools

| Tool | Use |
|------|-----|
| **RealFaviconGenerator.net** | Generate all favicon variants from a single source image |
| **Figma** | Design source icon at 512×512 px |
| **ImageMagick** | Batch resize/conversion |
| **maskable.app** | Test maskable icon safe zones |

### 8.1 Build Pipeline

```bash
# Generate all favicon sizes from a 512px source
npx realfavicon generate favicon-source.svg \
  --output /public/
```

---

> **Next File:** [14_Social_Media_Preview_Assets.md](./14_Social_Media_Preview_Assets.md) — Social media sharing image specifications.

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

---

*Simal Technologies Middle East LLC — Favicon & App Icon Specification — CONFIDENTIAL — Version 1.0 — May 2026*
