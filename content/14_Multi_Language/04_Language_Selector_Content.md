# 04 Language Selector — UI Component Content

> **Source:** Global header component — visible on all pages
> **Component:** `<LanguageSelector />` — persisted across all routes
> **Supported Languages:** English (EN), Arabic (AR), French (FR), Russian (RU)
> **Last Updated:** May 2, 2026

---

## Overview

The language selector is a global UI component in the site header (and footer on mobile) that allows users to switch between the four supported languages. It uses a globe icon and displays language names in their native script.

---

## Language Selector — Desktop Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]   Nav Items...            🌐 English ▾  [🔍] [B2B]  │
│                                        │                     │
│                                        ▼ (dropdown)          │
│                                   ┌──────────────────┐       │
│                                   │ 🌐 English   ✓   │       │
│                                   │ 🌐 العربية        │       │
│                                   │ 🌐 Français       │       │
│                                   │ 🌐 Русский        │       │
│                                   └──────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Language Selector — Mobile Layout

```
┌──────────────────────────┐
│  [Logo]        [☰] [🔍] │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │ 🌐 Language        │  │
│  ├────────────────────┤  │
│  │ ○ English      ✓   │  │
│  │ ○ العربية          │  │
│  │ ○ Français         │  │
│  │ ○ Русский          │  │
│  └────────────────────┘  │
│                          │
│  [Other mobile nav items]│
│                          │
└──────────────────────────┘
```

---

## Language Entry Definitions

### Complete Language Data

| Language Code | Native Name | English Name | Script | Direction | Locale Code | Flag/Icon |
|---|---|---|---|---|---|---|
| **en** | English | English | Latin | LTR | en_AE | 🇬🇧 / 🌐 Globe |
| **ar** | العربية | Arabic | Arabic | RTL | ar_AE | 🇦🇪 / 🌐 Globe |
| **fr** | Français | French | Latin | LTR | fr_FR | 🇫🇷 / 🌐 Globe |
| **ru** | Русский | Russian | Cyrillic | LTR | ru_RU | 🇷🇺 / 🌐 Globe |

### Design Decision: Globe Icon vs. Country Flags

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **Country Flags** | Visually recognizable, quick identification | Languages ≠ Countries (Arabic spoken in 22+ countries, French in 29+, Russian in 8+); flags are political | ❌ Not used |
| **Globe Icon** | Neutral, universally understood, apolitical | Less distinctive than flags | ✅ Primary approach |
| **Language Code** (EN/AR/FR/RU) | Compact, unambiguous | Less visually engaging | ✅ Used in compact mode |

**Final decision:** Use 🌐 globe icon with native language name as primary display. On mobile/compact header, show language code (EN/AR/FR/RU) to save space.

---

## Language Selector States

### Default State (Header)

```
🌐 {Current Language Name} ▾
```

| Current Language | Display |
|---|---|
| English | 🌐 English ▾ |
| Arabic | 🌐 العربية ▾ |
| French | 🌐 Français ▾ |
| Russian | 🌐 Русский ▾ |

### Dropdown Open State

```
┌───────────────────────────────┐
│ 🌐 English              ✓    │  ← Currently selected (checkmark + bold)
│ 🌐 العربية                    │
│ 🌐 Français                   │
│ 🌐 Русский                    │
└───────────────────────────────┘
```

### Compact Mode (Mobile / Narrow Header)

```
🌐 EN ▾
```

| Current Language | Compact Display |
|---|---|
| English | 🌐 EN ▾ |
| Arabic | 🌐 AR ▾ |
| French | 🌐 FR ▾ |
| Russian | 🌐 RU ▾ |

### Footer Mode

```
┌──────────────────────────────────────────────┐
│  [Footer sections...]                        │
│                                              │
│  🌐 Language: [English ▾]                    │
│                                              │
│  © 2026 Simal Technologies Middle East LLC   │
└──────────────────────────────────────────────┘
```

---

## Behavior Specifications

| Aspect | Specification |
|---|---|
| **Persistence** | Language preference stored in: 1) `lang` cookie (1 year expiry), 2) `localStorage`, 3) B2B account settings (for logged-in users). Priority: Account > Cookie > localStorage > Browser `navigator.language` |
| **URL Change** | Switching language navigates to equivalent page in target language: `/products/ssd` → `/ar/products/ssd`. If no translated page exists, falls back to English with a notice banner |
| **Auto-Detection** | On first visit, detect `navigator.language`. If it matches a supported language, show a non-intrusive banner: "This page is available in {detected language}. [Switch] [Dismiss]" — NEVER force-redirect |
| **SEO Impact** | Language switch must update `<html lang="...">` attribute, canonical URL, and hreflang tags in `<head>`. Google must be able to crawl all language variants |
| **Google Translate Suppression** | When user has selected a language, suppress browser's built-in Google Translate prompt (via `<meta name="google" content="notranslate">` for that session) |
| **Loading State** | During language switch, show subtle progress bar at top of page (NProgress-style). Do NOT show full page reload spinner |
| **Accessibility** | Dropdown navigable via keyboard (Tab, Enter, Escape). `aria-label="Select language"`. Currently selected language has `aria-current="true"` |
| **Analytics** | Fire `language_switched` event: `{ from: 'en', to: 'ar', page: '/products', method: 'manual' | 'auto_suggest' }` |

---

## Language Auto-Detection Banner

When a user visits for the first time (no cookie set) and their browser language matches a supported language different from the current page:

```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐│
│  │  🌐 This page is available in العربية (Arabic).          ││
│  │  [عرض بالعربية (View in Arabic)]    [✕ Dismiss]         ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Auto-Detection Rules

| Browser Language | Matched Site Language | Banner Shown? |
|---|---|---|
| `ar` / `ar-AE` / `ar-SA` / `ar-EG`... | Arabic | ✅ Yes (if on EN page) |
| `fr` / `fr-FR` / `fr-MA` / `fr-DZ`... | French | ✅ Yes (if on EN page) |
| `ru` / `ru-RU` / `ru-KZ` / `ru-UA`... | Russian | ✅ Yes (if on EN page) |
| `en` / `en-US` / `en-GB` / `en-IN`... | English | ❌ No (already on English) |
| `de` / `es` / `zh` / `hi`... | (not supported) | ❌ No (no translation available) |

---

## Regional Variants Handling

### Arabic Regional Variants

| Variant | Script | Differences | Simal's Approach |
|---|---|---|---|
| **Arabic — UAE** | العربية (الإمارات) | Gulf dialect expressions, UAE-specific terms | ✅ Primary Arabic variant |
| **Arabic — Egypt** | العربية (مصر) | Different colloquialisms, some terminology | ❌ Not a separate variant |
| **Arabic — Saudi Arabia** | العربية (السعودية) | Slightly more formal, Hijri-first calendar preference | ❌ Not a separate variant |
| **Arabic — Levant** | العربية (الشام) | Levantine dialect | ❌ Not a separate variant |

**Simal's Arabic policy:** Single Arabic translation in Modern Standard Arabic (Fusha / الفصحى) for all formal content. Chatbot and dynamic content may incorporate Gulf-friendly tone. No separate regional variants maintained — one Arabic version serves all Arabic-speaking markets.

### French Regional Variants

| Variant | Differences | Simal's Approach |
|---|---|---|
| French — France | Metropolitan French | ✅ Reference standard |
| French — Morocco/Algeria/Tunisia | Slight vocabulary (numéro vs chiffre, etc.) | ✅ Compatible |
| French — West/Central Africa | Some local expressions; formal register | ✅ Compatible (formal register used) |
| French — Canada (Québec) | Significant differences (anglicismes, tutoiement) | ❌ Not targeted |

**Simal's French policy:** International/Standard French; formal register; no regional variants.

### Russian Regional Variants

| Variant | Differences | Simal's Approach |
|---|---|---|
| Russian — Russia | Standard Russian | ✅ Reference standard |
| Russian — Kazakhstan | Minor lexical differences; Kazakh loanwords | ✅ Compatible |
| Russian — Belarus | Virtually identical to standard Russian | ✅ Compatible |

**Simal's Russian policy:** Standard Russian (московский стандарт) serves all CIS markets.

---

## Design Specifications

| Element | Specification |
|---|---|
| **Icon** | Globe SVG: 20×20px, color #6B7280 (grey), brand blue (#005B9F) on hover |
| **Typography** | 14px Inter Regular; native script fonts for each language (Tajawal for Arabic) |
| **Dropdown** | White background (#FFFFFF), 1px border #E0E4E8, 8px border-radius, box-shadow 0 4px 12px rgba(0,0,0,0.1) |
| **Hover State** | Background #F0F4F8 on option hover |
| **Selected State** | Bold text + ✓ checkmark on right (RTL: left) |
| **Spacing** | 12px vertical padding per option; 16px horizontal |
| **Animation** | Dropdown: fade-in + slide-down 150ms ease-out |
| **Z-Index** | 1050 (above header, below modals) |
| **Dark Mode** | Background #252830; border #3A3D45; hover #333840; text #E4E6EA |
| **Mobile** | Full-width option buttons; 48px touch target minimum |

---

## CSS Implementation Reference

```css
.lang-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #6B7280;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 150ms ease, color 150ms ease;
}

.lang-selector:hover {
  background: #F0F4F8;
  color: #1A1D23;
}

.lang-selector__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.lang-selector__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;  /* RTL: left: 0; right: auto */
  min-width: 180px;
  background: #FFFFFF;
  border: 1px solid #E0E4E8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1050;
  overflow: hidden;
  animation: dropdownIn 150ms ease-out;
}

.lang-selector__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 14px;
  color: #1A1D23;
  cursor: pointer;
  transition: background 100ms ease;
}

.lang-selector__option:hover {
  background: #F0F4F8;
}

.lang-selector__option--selected {
  font-weight: 600;
  color: #005B9F;
}

.lang-selector__option .checkmark {
  color: #005B9F;
  font-size: 12px;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* RTL Overrides */
html[dir="rtl"] .lang-selector__dropdown {
  right: auto;
  left: 0;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .lang-selector__dropdown {
    background: #252830;
    border-color: #3A3D45;
  }
  .lang-selector__option {
    color: #E4E6EA;
  }
  .lang-selector__option:hover {
    background: #333840;
  }
}
```

---

## JS Behavior (Pseudocode)

```javascript
function switchLanguage(targetLang) {
  // 1. Get current page path
  const currentPath = window.location.pathname;
  
  // 2. Determine target URL
  const targetUrl = getLocalizedUrl(currentPath, targetLang);
  
  // 3. Set cookie
  document.cookie = `lang=${targetLang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  
  // 4. Store in localStorage
  localStorage.setItem('preferred_lang', targetLang);
  
  // 5. For logged-in B2B users, save to account
  if (isAuthenticated) {
    api.post('/account/settings', { language: targetLang });
  }
  
  // 6. Track event
  analytics.track('language_switched', {
    from: currentLang,
    to: targetLang,
    page: currentPath,
    method: 'manual'
  });
  
  // 7. Navigate
  window.location.href = targetUrl;
}

function getLocalizedUrl(path, lang) {
  // Strip any existing language prefix
  const pathWithoutLang = path.replace(/^\/(ar|fr|ru)\//, '/');
  
  if (lang === 'en') {
    return pathWithoutLang;  // English has no prefix
  }
  
  return `/${lang}${pathWithoutLang}`;
}
```

---

## Accessibility

| Requirement | Implementation |
|---|---|
| **ARIA Label** | `aria-label="Select language"` on trigger button |
| **ARIA Expanded** | `aria-expanded="true/false"` toggles with dropdown |
| **ARIA Current** | `aria-current="true"` on selected option |
| **Role** | `role="listbox"` on dropdown; `role="option"` on each item |
| **Keyboard** | Tab to focus trigger → Enter/Space to open → Arrow keys to navigate → Enter to select → Escape to close |
| **Focus Trap** | When dropdown open, Tab wraps within dropdown; Escape returns focus to trigger |
| **Screen Reader** | Announces: "Language selector, English selected, 1 of 4. Use arrow keys to change language." |
| **Reduced Motion** | `@media (prefers-reduced-motion: reduce)` disables dropdown animation |

---

## Untranslated Page Fallback

If a page doesn't have a translation in the target language:

```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐│
│  │  ⚠️ This page is not yet available in Русский.           ││
│  │  You're viewing the English version.                    ││
│  │  [Return to homepage in Russian]    [Continue in English]││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [English page content continues below...]                   │
└──────────────────────────────────────────────────────────────┘
```

---

## CMS Translation Key Reference

| Translation Key | EN | AR | FR | RU |
|---|---|---|---|---|
| `lang.name` | English | العربية | Français | Русский |
| `lang.code` | EN | AR | FR | RU |
| `lang.selector.label` | Select language | اختر اللغة | Choisir la langue | Выберите язык |
| `lang.selector.current` | Current language | اللغة الحالية | Langue actuelle | Текущий язык |
| `lang.not_available.title` | Page not available in {lang} | الصفحة غير متوفرة بـ{lang} | Page non disponible en {lang} | Страница недоступна на {lang} |
| `lang.not_available.cta_home` | Go to {lang} homepage | الذهاب إلى الصفحة الرئيسية بـ{lang} | Aller à la page d'accueil en {lang} | Перейти на главную на {lang} |
| `lang.not_available.cta_continue` | Continue in English | المتابعة بالإنجليزية | Continuer en anglais | Продолжить на английском |
| `lang.suggestion.banner` | This page is available in {lang} | هذه الصفحة متوفرة بـ{lang} | Cette page est disponible en {lang} | Эта страница доступна на {lang} |
| `lang.suggestion.switch` | View in {lang} | عرض بـ{lang} | Voir en {lang} | Смотреть на {lang} |
| `lang.suggestion.dismiss` | Dismiss | تجاهل | Ignorer | Закрыть |

---

## Frequently Asked Questions

**Q: Does the language selector use country flags?**
A: No. We use a neutral globe icon (🌐) + language name in its native script. Country flags are political symbols — Arabic is spoken in 22+ countries, French in 29+, and Russian in 8+. A single flag would inaccurately represent the entire language community.

**Q: What happens if I select a language for a page that hasn't been translated?**
A: You'll see the English version of the page with a banner at the top explaining that the translation isn't yet available, with options to go to the homepage in your selected language or continue reading in English.

**Q: Will the language selector remember my preference?**
A: Yes. Your preference is saved in a cookie (1 year) and localStorage. If you're logged into the B2B portal, it's also saved to your account settings for cross-device persistence.

**Q: Can I have different language preferences for the public site vs. B2B portal?**
A: By default, language selection applies site-wide. B2B portal logged-in users can set a different language preference in Account Settings that overrides the public site preference.

**Q: How does the language switch affect SEO?**
A: Each language version has its own URL (`/`, `/ar/`, `/fr/`, `/ru/`) with proper hreflang tags and canonical URLs. Google indexes each language version separately. Language switching is done via navigation (not JavaScript-only), ensuring all crawlers can access all language versions.

---

## Cross-Linking & Navigation

- [Arabic Translation Plan](/14_Multi_Language/01_Arabic_AR_All_Pages)
- [French Translation Plan](/14_Multi_Language/02_French_FR_Key_Pages)
- [Russian Translation Plan](/14_Multi_Language/03_Russian_RU_Key_Pages)
- [SEO Metadata — All Pages](/15_SEO_Metadata/01_Meta_Titles_All_Pages)
- [Homepage](/01_Homepage/01_Homepage)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Language Selector Component Spec v1.0. Designed for accessibility, SEO, and cross-cultural user experience.*
