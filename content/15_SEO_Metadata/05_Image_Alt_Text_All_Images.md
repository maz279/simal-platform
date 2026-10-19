# 05 Image Alt Text — All Images (EN/AR/FR/RU)

> **Source:** CMS image metadata field + global alt text conventions
> **Purpose:** WCAG 2.1 AA compliance, SEO image ranking, screen reader accessibility
> **Languages:** Unique alt text for EN, AR, FR, RU (not machine-translated)
> **Last Updated:** May 2, 2026

---

## Alt Text Principles

| Principle | Rule |
|---|---|
| **Be Descriptive** | Describe what's in the image as if explaining to someone who can't see it |
| **Be Concise** | 125 characters max (most screen readers cut off at ~125 chars) |
| **Front-Load Key Info** | Most important description first — screen reader users can skip to next image |
| **No "Image of..." or "Picture of..."** | Screen readers already announce "Graphic" or "Image" — don't repeat it |
| **Include Text in Images** | If the image contains text, that text MUST be in the alt attribute |
| **End with Period** | Makes screen readers pause before continuing — improves comprehension |
| **Decorative = Empty Alt** | Purely decorative images get `alt=""` (empty string, not missing attribute) |
| **Complex Images** | Use `alt` for short description + `aria-describedby` linking to longer description |
| **Per-Language** | Alt text must be translated for each language version |

---

## Alt Text Categories

### 1. Product Images (Informative)

| Image | EN Alt Text | AR Alt Text | FR Alt Text | RU Alt Text |
|---|---|---|---|---|
| Crucial P3 Plus 1TB — front | Crucial P3 Plus 1TB NVMe M.2 SSD, front view, showing model label and PCIe Gen4 marking. | قرص Crucial P3 Plus بسعة 1 تيرابايت NVMe M.2، منظر أمامي يظهر ملصق الموديل وعلامة PCIe Gen4. | SSD Crucial P3 Plus 1 To NVMe M.2, vue de face, montrant l'étiquette du modèle et le marquage PCIe Gen4. | Твердотельный накопитель Crucial P3 Plus 1 ТБ NVMe M.2, вид спереди, показана маркировка модели и PCIe Gen4. |
| HIKVISION DS-2CD2087G2-L camera | HIKVISION DS-2CD2087G2-L 8MP ColorVu fixed bullet network camera with white housing and built-in microphone. | كاميرا HIKVISION DS-2CD2087G2-L بدقة 8 ميجابكسل ColorVu الثابتة بتصميم رصاصي مع هيكل أبيض وميكروفون مدمج. | Caméra réseau bullet fixe HIKVISION DS-2CD2087G2-L 8MP ColorVu avec boîtier blanc et microphone intégré. | Сетевая пулевидная камера HIKVISION DS-2CD2087G2-L 8MP ColorVu в белом корпусе со встроенным микрофоном. |
| Koorui 27E6QC monitor | Koorui 27E6QC 27-inch curved gaming monitor, 165Hz, QHD resolution, on a stand with red accent trim. | شاشة Koorui 27E6QC المنحنية للألعاب مقاس 27 بوصة، 165 هرتز، دقة QHD، على حامل بحواف حمراء. | Moniteur gaming incurvé Koorui 27E6QC 27 pouces, 165 Hz, résolution QHD, sur support avec bordure rouge. | Изогнутый игровой монитор Koorui 27E6QC 27 дюймов, 165 Гц, разрешение QHD, на подставке с красной отделкой. |
| Zotac RTX 4070 GPU | Zotac Gaming GeForce RTX 4070 Twin Edge OC graphics card with dual fans and grey shroud, 12GB GDDR6X. | بطاقة رسوميات Zotac Gaming GeForce RTX 4070 Twin Edge OC بمروحتين وغطاء رمادي، 12 جيجابايت GDDR6X. | Carte graphique Zotac Gaming GeForce RTX 4070 Twin Edge OC avec deux ventilateurs et carénage gris, 12 Go GDDR6X. | Видеокарта Zotac Gaming GeForce RTX 4070 Twin Edge OC с двумя вентиляторами и серым кожухом, 12 ГБ GDDR6X. |

### 2. Brand Logo Images (Informative)

| Image | EN Alt Text |
|---|---|
| HIKVISION logo | HIKVISION — Official logo. |
| Crucial by Micron logo | Crucial by Micron — Official logo. |
| Simal Technologies logo | Simal Technologies Middle East — Company logo. |
| UniERP logo | UniERP — ERP platform by Simal Technologies. |

### 3. Office & Location Photos (Informative)

| Image | EN Alt Text |
|---|---|
| Dubai HQ — exterior | Dar Al Riffa Building in Bur Dubai, home to Simal Technologies headquarters — Office 201. |
| Dubai HQ — office interior | Open-plan office interior at Simal Technologies Bur Dubai headquarters showing workstations and meeting area. |
| JAFZA warehouse | Simal Technologies warehouse facility in Jebel Ali Free Zone (JAFZA), Dubai, with pallet racking and inventory. |
| Dhaka development center | Smart Technologies BD development center office in Dhaka, Bangladesh, with software engineering team. |

### 4. Team & People Photos (Informative)

| Image | EN Alt Text |
|---|---|
| Leadership team group photo | Simal Technologies executive leadership team posing together in Dubai office meeting room. |
| Managing Director portrait | Mohamed Aslam, Managing Director of Simal Technologies Middle East, professional headshot. |
| Sales team at trade show | Simal Technologies sales team at GITEX Global technology exhibition in Dubai World Trade Centre. |
| ERP consultants in meeting | UniERP implementation consultants conducting a client requirement analysis workshop. |

### 5. Hero Banner Images (Informative, with text overlay)

| Image | EN Alt Text |
|---|---|
| Homepage hero — IT hardware | Collage of computer hardware components — SSD, RAM, GPU, motherboard — on dark blue gradient background with Simal Technologies branding. |
| Homepage hero — ERP | UniERP dashboard interface displayed on laptop and tablet screens on blue gradient background. |
| About Us hero | Dubai skyline at dusk with Burj Khalifa visible, representing Simal Technologies' headquarters location. |

### 6. Icons & Illustrations (Decorative or Informative)

| Image | Alt Text | Notes |
|---|---|---|
| Feature icons (checkmark, shield, globe, etc.) | `alt=""` | Decorative — adjacent text already conveys meaning |
| Empty state illustrations | `alt=""` | Decorative — heading and subtext convey the message |
| Category icons (SSD, GPU, RAM, etc.) | `alt="{Category Name} category icon"` | Informative — helps identify category when browsing |
| Social media icons | `alt="{Platform} icon"` | Informative — e.g., "LinkedIn icon", "Twitter icon" |
| Payment method icons | `alt="{Method} accepted"` | Informative — e.g., "Bank transfer accepted" |
| Flag icons (language selector) | `alt=""` | Decorative — language name already displayed |

### 7. Charts, Graphs & Infographics (Complex Images)

For complex images like performance comparison charts, use the pattern:

```html
<img 
  src="/images/charts/ssd-performance-comparison.jpg"
  alt="Bar chart comparing NVMe vs SATA SSD read/write speeds — NVMe up to 5000 MB/s, SATA up to 560 MB/s."
  aria-describedby="chart-description-ssd-perf"
/>
<div id="chart-description-ssd-perf" class="sr-only">
  Detailed description: This bar chart compares sequential read and write speeds of NVMe PCIe Gen4 SSDs versus SATA III SSDs. 
  NVMe Gen4 achieves approximately 5000 MB/s read and 4200 MB/s write. SATA III achieves approximately 560 MB/s read and 530 MB/s write. 
  NVMe is approximately 9x faster than SATA for sequential reads and 8x faster for sequential writes.
</div>
```

---

## Alt Text Per-Language Management

### CMS Implementation

```yaml
# CMS Image Asset Schema
image:
  file: "/images/products/crucial-p3-plus-1tb-front.jpg"
  alt_text:
    en: "Crucial P3 Plus 1TB NVMe M.2 SSD, front view, showing model label and PCIe Gen4 marking."
    ar: "قرص Crucial P3 Plus بسعة 1 تيرابايت NVMe M.2، منظر أمامي يظهر ملصق الموديل وعلامة PCIe Gen4."
    fr: "SSD Crucial P3 Plus 1 To NVMe M.2, vue de face, montrant l'étiquette du modèle et le marquage PCIe Gen4."
    ru: "Твердотельный накопитель Crucial P3 Plus 1 ТБ NVMe M.2, вид спереди, показана маркировка модели и PCIe Gen4."
  long_description:
    en: "The Crucial P3 Plus is an NVMe M.2 2280 form factor SSD. The product label shows Crucial branding, capacity (1TB), model number (CT1000P3PSSD8), and PCIe Gen4 NVMe interface marking. The PCB is black with components on one side."
```

### Component-Level Implementation

```jsx
// React component example
<Image
  src={image.file}
  alt={image.alt_text[currentLanguage]}
  ariaDescribedby={image.long_description ? `desc-${image.id}` : undefined}
  loading="lazy"
  width={image.width}
  height={image.height}
/>
{image.long_description && (
  <div id={`desc-${image.id}`} className="sr-only">
    {image.long_description[currentLanguage]}
  </div>
)}
```

---

## Image Alt Text Validation Rules

| Rule | Check | Example Fail → Fix |
|---|---|---|
| **No "Image of" or "Picture of"** | Alt text starts with "Image of...", "Picture of...", "Photo of..." | ❌ "Image of Crucial SSD" → ✅ "Crucial P3 Plus 1TB NVMe M.2 SSD, front view." |
| **Not Filename** | Alt text is the file name (e.g., "crucial-p3-plus.jpg") | ❌ "crucial-p3-plus-1tb" → ✅ "Crucial P3 Plus 1TB NVMe M.2 SSD." |
| **Not Keyword Stuffed** | Alt text is a list of SEO keywords | ❌ "SSD NVMe storage Crucial cheap buy Dubai" → ✅ "Crucial P3 Plus 1TB NVMe M.2 SSD." |
| **Decorative = Empty** | Decorative images must have `alt=""` not missing alt | ❌ No alt attribute at all → ✅ `alt=""` |
| **Informative = Non-Empty** | Informative images must have descriptive alt text | ❌ `alt=""` on product photo → ✅ Descriptive product alt text |
| **Text in Image = Alt Includes Text** | Images containing text must replicate that text in alt | ❌ Banner with "50% Off" → ✅ "Promotional banner: 50% off on Crucial SSDs." |
| **Length ≤ 125 characters** | Alt text should not exceed 125 characters | ❌ 200-char alt → ✅ Truncate or use aria-describedby for long desc |
| **Linked Images Describe Destination** | Alt text for linked images should describe link purpose | ❌ Product image in `<a>` with alt="SSD" → ✅ "View Crucial P3 Plus 1TB SSD details and pricing." |
| **Per-Language Consistency** | Alt text exists in all 4 languages | ❌ Only EN alt text → ✅ All 4 languages populated |

---

## Alt Text Style Guide by Image Type

| Image Type | Alt Text Pattern | Examples |
|---|---|---|
| **Product — Front Shot** | `{Brand} {Model} {Type}, {view description}, {key visible features}.` | "Crucial P3 Plus 1TB NVMe M.2 SSD, front view, showing Crucial branding and capacity label." |
| **Product — Angle/Alternate** | `{Brand} {Model} {Type}, {angle} view showing {specific detail}.` | "Crucial P3 Plus 1TB NVMe M.2 SSD, angled view showing M.2 connector interface." |
| **Product — In-Use/Context** | `{Product description} installed in {context/device}, {relevant detail}.` | "Crucial P3 Plus SSD installed in desktop PC motherboard M.2 slot, showing compact form factor." |
| **Brand Logo** | `{Brand Name} — Official logo.` | "HIKVISION — Official logo." |
| **Office/Location** | `{Location description}, {city/area}, {company context}.` | "Dar Al Riffa Building exterior in Bur Dubai, houses Simal Technologies Office 201." |
| **Team Photo** | `{Team/group description}, {context/location}.` | "Simal Technologies leadership team in Dubai headquarters meeting room." |
| **Hero Banner** | `{Visual description of scene/design}, {key message if text present}.` | "Dubai skyline at sunset with Simal Technologies branding — IT Distribution & ERP Solutions." |
| **Chart/Graph** | `{Chart type} comparing {data points} — {key finding}.` | "Bar chart comparing SSD read speeds — NVMe 5000 MB/s vs SATA 560 MB/s." |
| **Icon** (informative) | `{Icon meaning} icon.` | "Free shipping icon." "24/7 support icon." |
| **Icon** (decorative) | `alt=""` | Bullet point icons, divider ornaments. |

---

## WCAG 2.1 AA Compliance Checklist

| WCAG Criterion | Requirement | Compliance Method |
|---|---|---|
| **1.1.1 Non-text Content (Level A)** | All non-text content has a text alternative | Every `<img>` has appropriate `alt` attribute |
| **1.4.5 Images of Text (Level AA)** | Use text instead of images of text where possible | All UI text is real text; only logos/banners use image text |
| **1.4.9 Images of Text (No Exception) (Level AAA)** | No images of text except logos | We aim for AA; logos + marketing banners are exceptions |
| **2.4.4 Link Purpose (In Context) (Level A)** | Link purpose clear from text or context | Linked images have alt describing link destination |
| **4.1.2 Name, Role, Value (Level A)** | UI components have proper names | All interactive images have accessible names |

---

## Lazy Loading & Performance

```html
<!-- Standard image with lazy loading -->
<img 
  src="/images/products/crucial-p3-plus-1tb-front.jpg"
  alt="Crucial P3 Plus 1TB NVMe M.2 SSD, front view."
  loading="lazy"
  width="800"
  height="800"
  decoding="async"
/>

<!-- Responsive image with srcset and sizes -->
<img
  src="/images/products/crucial-p3-plus-1tb-front-400.jpg"
  srcset="
    /images/products/crucial-p3-plus-1tb-front-400.jpg 400w,
    /images/products/crucial-p3-plus-1tb-front-800.jpg 800w,
    /images/products/crucial-p3-plus-1tb-front-1200.jpg 1200w
  "
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Crucial P3 Plus 1TB NVMe M.2 SSD, front view."
  loading="lazy"
  decoding="async"
/>
```

---

## Image Alt Text Audit Process

| Step | Tool/Method | Frequency |
|---|---|---|
| **Automated Scan** | Axe DevTools, Lighthouse, WAVE | Every PR/build |
| **CMS Validation** | Alt text field required for non-decorative images | On image upload |
| **Manual Review** | Spot-check 10% of images per section | Monthly |
| **Screen Reader Test** | NVDA (Windows) + VoiceOver (Mac) | Quarterly |
| **Missing Alt Report** | Google Search Console → Accessibility | Weekly |
| **Per-Language Check** | Verify alt text exists in all 4 languages | On content publish |

---

## Frequently Asked Questions

**Q: What's the difference between `alt=""` and no alt attribute?**
A: `alt=""` (empty alt) tells screen readers the image is decorative and should be skipped. Missing alt attribute is an accessibility error — screen readers may read the file name aloud, which is a poor experience.

**Q: Should I put SEO keywords in alt text?**
A: Include keywords naturally if they accurately describe the image (e.g., "Crucial P3 Plus 1TB NVMe M.2 SSD" naturally contains product keywords). Do NOT stuff alt text with keywords like "cheap SSD buy Dubai NVMe storage best price" — this violates WCAG and can hurt SEO.

**Q: What if an image contains a lot of text (like an infographic)?**
A: Use `alt` for a short summary and `aria-describedby` linking to a full text description elsewhere on the page. The full description should convey all information the infographic contains.

**Q: Do background images (CSS `background-image`) need alt text?**
A: CSS background images cannot have alt attributes. If the background image conveys meaningful information, use an `<img>` tag instead. If decorative, CSS background is acceptable.

**Q: How do I handle alt text for images in different languages?**
A: The CMS stores alt text per language. When the page renders in Arabic, the Arabic alt text is used. When rendering in English, the English alt text is used. All four languages (EN, AR, FR, RU) must have alt text for every informative image.

---

## Cross-Linking & Navigation

- [Meta Titles — All Pages](/15_SEO_Metadata/01_Meta_Titles_All_Pages)
- [Meta Descriptions — All Pages](/15_SEO_Metadata/02_Meta_Descriptions_All_Pages)
- [Open Graph Images](/15_SEO_Metadata/03_Open_Graph_Images_Key_Pages)
- [Structured Data JSON-LD](/15_SEO_Metadata/04_Structured_Data_JSON_LD)
- [Media Assets Overview](/16_Media_Assets/01_Media_Assets_Overview)
- [Accessibility Statement](/11_Legal/07_Accessibility_Statement)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Image Alt Text Standards v2.0. WCAG 2.1 AA compliant. All alt text reviewed by accessibility specialists.*
