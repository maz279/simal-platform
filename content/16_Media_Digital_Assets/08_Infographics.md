# 08 Infographics

> **Source:** Simal Technologies Marketing & Design — May 2026
> **Owner:** Creative Team / Graphic Designer
> **Version:** 1.0

---

## 1. Overview

Infographics distill complex information about Simal Technologies' operations, history, and value proposition into visually engaging, shareable content. They serve dual purposes: website content enrichment and social media marketing assets.

### 1.1 Infographic Inventory

| # | Infographic | Format | Use On | Priority |
|---|------------|--------|--------|----------|
| 1 | **Company Timeline (2002–2026)** | Horizontal scroll | About Us | P0 — Critical |
| 2 | **Business Model Diagram** | Vertical layout | About Us | P0 — Critical |
| 3 | **Distribution Process Flow** | Horizontal flowchart | IT Distribution | P0 — Critical |
| 4 | **ERP Implementation Process** | Step-by-step vertical | UniERP Landing | P0 — Critical |
| 5 | **Market Coverage Map** | Geographic map | About Us / Partners | P1 — High |
| 6 | **Brand Portfolio Ecosystem** | Network/relationship diagram | Brand Listing page | P1 — High |
| 7 | **UAE IT Market Statistics** | Data visualization | About Us / Resources | P2 — Medium |
| 8 | **UniERP Module Ecosystem** | Interconnected hub diagram | UniERP Landing | P1 — High |

**Total:** 8 infographics

---

## 2. Technical Specifications

### 2.1 Global Standards

| Parameter | Web | Print | Social Media |
|-----------|-----|-------|-------------|
| **Format** | SVG (responsive) + PNG fallback | PDF / EPS | PNG 1080×1080 or 1200×628 |
| **Max Width** | 1200 px | A4 (210×297mm) @ 300 DPI | 1080 px |
| **Color Space** | sRGB | CMYK | sRGB |
| **Fonts** | Inter, Tajawal (Arabic) — web-safe | Inter, Tajawal — embedded/outlined | Same as web |
| **Brand Colors** | #005B9F, #009CDE, #1A1A2E, #FFFFFF | Same (CMYK equivalents) | Same |

### 2.2 Design Principles

| Principle | Guideline |
|-----------|----------|
| **Simplicity** | One core message per infographic; avoid information overload |
| **Data Accuracy** | All figures verified by relevant department head before publication |
| **Consistency** | Uniform icon style, typography scale, and color palette across all infographics |
| **Accessibility** | Alt text descriptions; color combinations pass WCAG AA contrast (4.5:1) |
| **Mobile** | Key information remains legible at 375 px width |

---

## 3. Infographic #1: Company Timeline (2002–2026)

### 3.1 Content

| Year | Milestone | Visual |
|------|-----------|--------|
| **2002** | Simal Technologies founded in Dubai, UAE | Founding office icon |
| **2005** | First major brand partnership established | Handshake icon |
| **2008** | Expanded to Bur Dubai HQ — Dar Al Riffa Building | Building icon |
| **2010** | Reached 100+ active reseller partners | Network icon |
| **2012** | JAFZA warehouse — StarSeed Technologies established | Warehouse icon |
| **2014** | HIKVISION official distribution partnership | Camera icon (HIKVISION red) |
| **2015** | Retail division — Stellent Technologies launched | Store icon |
| **2016** | Dhaka office — Smart Technologies BD established | Globe icon |
| **2018** | Expanded to 10+ IT hardware brands | Brand grid icon |
| **2020** | UniERP division launched (Odoo CE) | Software/gear icon |
| **2022** | 20th Anniversary — 15 brands, 500+ resellers | Celebration icon |
| **2023** | Africa & CIS market expansion initiated | Map expansion icon |
| **2024** | HIKSEMi, Nearity, ARKTEK brands added | Plus/new brand icon |
| **2025** | HIKSEMi Best Distribution Partner — Middle East | Trophy icon |
| **2026** | New corporate website launch — Digital transformation | Rocket/launch icon |

### 3.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  SIMAL TECHNOLOGIES — A Journey of Excellence                │
│                                                              │
│  2002 ─── 2005 ─── 2008 ─── 2010 ─── 2012 ─── 2014 ─── ... │
│   │        │        │        │        │        │             │
│   🏢      🤝       🏢       🌐       🏭       📷            │
│  Founded  First    Bur    100+     JAFZA   HIKVISION         │
│  Dubai   Partner  Dubai  Partners Warehouse Partner          │
│                                                              │
│  ... ─── 2018 ─── 2020 ─── 2022 ─── 2023 ─── 2025 ─── 2026  │
│          │        │        │        │        │        │      │
│          🏷️      ⚙️       🎂       🌍      🏆       🚀     │
│        10+      UniERP   20th    Africa    Best     New      │
│       Brands   Launched  Anniv.   +CIS   Partner   Website  │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Interactive Version (Web)

```html
<div class="timeline-interactive">
  <div class="timeline-track">
    <!-- Each milestone is a clickable node -->
    <div class="timeline-node" data-year="2002">
      <div class="node-marker"></div>
      <div class="node-content">
        <h4>2002</h4>
        <p>Simal Technologies founded in Dubai, UAE — beginning the journey as an IT hardware distributor.</p>
      </div>
    </div>
    <!-- ... -->
  </div>
</div>
```

```css
.timeline-interactive {
  overflow-x: auto;
  scroll-behavior: smooth;
}

.timeline-track {
  display: flex;
  gap: 0;
  position: relative;
  padding: 60px 0;
}

.timeline-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #009CDE, #005B9F);
}

.timeline-node {
  flex: 0 0 160px;
  text-align: center;
  position: relative;
}

.timeline-node:hover .node-content {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 4. Infographic #2: Business Model Diagram

### 4.1 Content — Two-Pillar Structure

```
┌─────────────────────────────────────────────────────────────┐
│                SIMAL TECHNOLOGIES                           │
│           Integrated IT Solutions Provider                   │
├─────────────────────────┬───────────────────────────────────┤
│   PILLAR 1               │   PILLAR 2                        │
│   IT HARDWARE             │   SOFTWARE SOLUTIONS              │
│   DISTRIBUTION            │   (UniERP)                        │
│                           │                                   │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐ │
│  │ 15 Partner Brands   │  │  │ Odoo 19 Community Edition   │ │
│  │ 76+ Products        │  │  │ 40+ Business Modules        │ │
│  │ B2B Wholesale       │  │  │ 60+ Industry Verticals      │ │
│  │ JAFZA Warehouse     │  │  │ Custom Development          │ │
│  │ GCC + Africa + CIS  │  │  │ Implementation & Support    │ │
│  └─────────────────────┘  │  └─────────────────────────────┘ │
│                           │                                   │
│  TARGET:                  │  TARGET:                          │
│  System Integrators       │  SMEs, Mid-Market, Enterprise    │
│  Resellers, Retailers     │  Government, Institutions         │
├─────────────────────────┴───────────────────────────────────┤
│              SHARED INFRASTRUCTURE                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Dubai HQ │ │ JAFZA    │ │ Dhaka    │ │ Retail Store │   │
│  │ Bur Dubai│ │ Warehouse│ │ Office   │ │ Bur Dubai    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Infographic #3: Distribution Process Flow

### 5.1 Flow Diagram

```
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  BRAND   │    │  SIMAL   │    │  SIMAL   │    │ B2B      │
  │ PARTNER  │───▶│PROCUREMENT│───▶│ WAREHOUSE│───▶│CUSTOMER  │
  │          │    │          │    │ (JAFZA)  │    │          │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘
       │              │                │                │
       │              │                │                │
  ① Purchase    ② Quality       ③ Inventory      ④ Last-Mile
    Order          Check           Management       Delivery
    from           at receipt      + Order          to reseller
    HIKVISION,                     Fulfillment      or end-user
    Crucial, etc.

  ┌──────────────────────────────────────────────────────────┐
  │ VALUE-ADDED SERVICES                                     │
  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐│
  │ │Technical │ │Marketing │ │Credit    │ │After-Sales   ││
  │ │Support   │ │Support   │ │Facility  │ │Warranty      ││
  │ └──────────┘ └──────────┘ └──────────┘ └──────────────┘│
  └──────────────────────────────────────────────────────────┘
```

### 5.2 Interactive Version

Each step is clickable to reveal more detail:

| Step | Click Reveals |
|------|--------------|
| **① Procurement** | Purchase order cycle time: 7–21 days; MOQ requirements; Payment terms: LC, TT, credit |
| **② Quality Check** | Inspection checklist: packaging integrity, quantity verification, serial no. scanning, functional testing |
| **③ Warehouse** | JAFZA capacity, WMS system, pick/pack/ship SLA: same-day for orders before 2 PM |
| **④ Delivery** | Delivery zones: UAE (24h), GCC (2–3 days), Africa (5–7 days), CIS (7–10 days) |

---

## 6. Infographic #4: ERP Implementation Process

### 6.1 6-Step Implementation

```
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │   ①     │   │   ②     │   │   ③     │   │   ④     │   │   ⑤     │   │   ⑥     │
  │DISCOVERY│──▶│  BLUEPRINT│──▶│CONFIGURE│──▶│ MIGRATE │──▶│  TRAIN  │──▶│ GO-LIVE │
  │          │   │          │   │          │   │          │   │          │   │          │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
    1 Week         2 Weeks        3–4 Weeks      1–2 Weeks      1 Week          Day 1+

  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │Business  │   │Gap       │   │Module    │   │Data      │   │User      │   │System    │
  │Process   │   │Analysis  │   │Setup &   │   │Import &  │   │Training  │   │Launch &  │
  │Analysis  │   │+ Solution│   │Customize │   │Cleansing │   │+ UAT     │   │Hypercare │
  │+ Scope   │   │Design    │   │          │   │          │   │          │   │Support   │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Total Implementation Timeline:** 8–12 weeks (typical SME)

---

## 7. Infographic #5: Market Coverage Map

### 7.1 Geographic Coverage

```
┌──────────────────────────────────────────────────────────────┐
│           SIMAL TECHNOLOGIES — MARKET COVERAGE                │
│                                                              │
│                    ┌──────────────────┐                      │
│                    │    CIS REGION     │                      │
│                    │  (Expanding)      │                      │
│                    │  🇷🇺 🇰🇿 🇺🇿 🇦🇿 │                      │
│                    └──────────────────┘                      │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────┐                │
│  │   GCC REGION     │    │  AFRICA REGION   │                │
│  │  (Core Market)   │    │  (Growing)       │                │
│  │  🇦🇪 🇸🇦 🇶🇦 🇰🇼 │    │  Francophone W&C │                │
│  │  🇧🇭 🇴🇲         │    │  🇸🇳 🇨🇮 🇲🇦     │                │
│  │                  │    │  East Africa     │                │
│  │  ★ DUBAI HQ      │    │  🇰🇪 🇹🇿 🇪🇹     │                │
│  └─────────────────┘    └──────────────────┘                │
│                                                              │
│  ┌─────────────────┐                                         │
│  │ SOUTH ASIA       │                                         │
│  │ 🇧🇩 Dhaka Office │                                         │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Interactive Map Implementation

```html
<div class="market-map" id="marketCoverageMap">
  <!-- SVG-based interactive map -->
  <svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
    <!-- GCC Region -->
    <g class="region gcc" data-region="gcc">
      <circle cx="300" cy="200" r="80" class="region-pulse"/>
      <text x="300" y="205">GCC</text>
      <text x="300" y="225" class="region-subtitle">Core Market</text>
    </g>
    <!-- Africa Region -->
    <g class="region africa" data-region="africa">
      <!-- ... -->
    </g>
    <!-- CIS Region -->
    <g class="region cis" data-region="cis">
      <!-- ... -->
    </g>
  </svg>
</div>
```

---

## 8. Infographic #6: Brand Portfolio Ecosystem

### 8.1 Brand Relationship Diagram

A hub-and-spoke diagram showing Simal Technologies as the central hub with 15 brand spokes, organized by category:

```
                    SURVEILLANCE
                   ┌──────────┐
                   │ HIKVISION│
                   │ HIKSEMi  │
                   └────┬─────┘
                        │
         MEMORY ────────┼──────── DISPLAYS
     ┌──────────┐       │       ┌──────────┐
     │ Crucial   │       │       │ Koorui   │
     │ TEAMGROUP │───────┼───────│ Zotac    │
     │ GSKILL    │       │       │ Inno3D   │
     │ WD        │       │       └──────────┘
     │ Toshiba   │       │
     └──────────┘   ┌───┴───┐   ┌──────────┐
                    │ SIMAL │   │ UGREEN   │
         AUDIO ─────┤  HUB  ├───┤ ARKTEK   │
     ┌──────────┐   └───┬───┘   │ Honeywell│
     │ Aiwa     │       │       └──────────┘
     │ Nearity  │       │        CONNECTIVITY
     └──────────┘       │
                        │
                    ERP SOFTWARE
                   ┌──────────┐
                   │ UniERP   │
                   └──────────┘
```

---

## 9. Infographic #7: UAE IT Market Statistics

### 9.1 Data Points

| Statistic | Value | Source | Visual |
|-----------|-------|--------|--------|
| UAE IT Market Size 2026 | $8.2 Billion | IDC / Gartner | Bar chart with YoY growth |
| UAE Surveillance Market | $420 Million | 6Wresearch | Pie chart (HIKVISION market share) |
| UAE Cloud/ERP Adoption | 67% of enterprises | PwC Middle East | Gauge visualization |
| GCC IT Spending Growth | 6.2% YoY | Gartner 2025 | Line chart (2020–2026) |
| Dubai GDP — Tech Sector Share | 4.3% | Dubai Statistics Center | Donut chart |

---

## 10. Infographic #8: UniERP Module Ecosystem

### 10.1 Interconnected Module Diagram

```
              ┌──────────────────────────────┐
              │        UniERP CORE           │
              │   ┌──────┐    ┌─────────┐   │
              │   │Sales │◄──►│Accounting│   │
              │   └──┬───┘    └────┬────┘   │
              │      │             │         │
              │   ┌──┴─────────────┴──┐     │
              │   │   INVENTORY &     │     │
              │   │   WAREHOUSE       │     │
              │   └──┬─────────────┬──┘     │
              │      │             │         │
              │   ┌──┴──┐     ┌────┴────┐  │
              │   │Purch.│     │Manufact.│  │
              │   └─────┘     └─────────┘  │
              └──────────────────────────────┘
                      │           │
              ┌───────┴───┐ ┌─────┴────────┐
              │  HR &     │ │  PROJECT     │
              │  PAYROLL  │ │  MANAGEMENT  │
              └───────────┘ └──────────────┘
                      │           │
              ┌───────┴───────────┴────────┐
              │     REPORTING & ANALYTICS   │
              └────────────────────────────┘
```

---

## 11. Production & Delivery

### 11.1 Design Tools

| Tool | Use |
|------|-----|
| **Figma** | Primary design tool; collaborative; component library |
| **Adobe Illustrator** | Complex vector illustrations, map work |
| **D3.js / Chart.js** | Interactive data visualizations (web) |
| **SVGO** | SVG optimization before web deployment |

### 11.2 Quality Checklist

- [ ] All numbers/statistics verified with source
- [ ] Brand colors used correctly (#005B9F, #009CDE, #1A1A2E)
- [ ] Typography follows brand guidelines (Inter for EN, Tajawal for AR)
- [ ] Mobile view: text legible at 375px width
- [ ] Alt text written for accessibility
- [ ] SVG version delivered for web; PNG for social media
- [ ] Print version in CMYK (if applicable)
- [ ] Reviewed and approved by Marketing Director

---

> **Next File:** [09_Icons_Set.md](./09_Icons_Set.md) — Custom icon set specifications for the website.

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

---

*Simal Technologies Middle East LLC — Infographics Specification — CONFIDENTIAL — Version 1.0 — May 2026*
