# 03 Icon Library

> **Category:** UI Components
> **Storage:** `/images/icons/`
> **Format:** SVG (all icons)
> **Library:** Custom designed + Lucide Icons (extended)
> **Last Updated:** May 2, 2026

---

## Icon Specifications

| Property | Value |
|---|---|
| **Format** | SVG (inline or sprite sheet) |
| **Size** | 24×24px (standard), 20×20px (small), 32×32px (large) |
| **Stroke Width** | 2px |
| **Color** | `currentColor` (inherits from parent text color) |
| **ViewBox** | `0 0 24 24` |
| **Accessibility** | `aria-hidden="true"` for decorative; `aria-label` for semantic |

---

## Icon Categories Inventory

### Navigation Icons

| Icon | File | Usage |
|---|---|---|
| Menu (Hamburger) | `menu.svg` | Mobile nav toggle |
| Close (X) | `close.svg` | Close modals, mobile nav |
| Chevron Down | `chevron-down.svg` | Dropdown indicators |
| Chevron Right | `chevron-right.svg` | Carousel next, breadcrumbs |
| Chevron Left | `chevron-left.svg` | Carousel prev, breadcrumbs |
| Arrow Right | `arrow-right.svg` | CTA buttons, links |
| Arrow Left | `arrow-left.svg` | Back navigation |
| Home | `home.svg` | Breadcrumb home |
| External Link | `external-link.svg` | External links |

### Action Icons

| Icon | File | Usage |
|---|---|---|
| Search | `search.svg` | Search bar, search button |
| Cart | `cart.svg` | Shopping cart, add to cart |
| User/Account | `user.svg` | Login, account, profile |
| Heart/Wishlist | `heart.svg` | Wishlist, save |
| Share | `share.svg` | Social sharing |
| Download | `download.svg` | PDF downloads, file downloads |
| Print | `print.svg` | Print page |
| Filter | `filter.svg` | Product filters |
| Sort | `sort.svg` | Sort options |

### Communication Icons

| Icon | File | Usage |
|---|---|---|
| Phone | `phone.svg` | Contact phone numbers |
| Email | `email.svg` | Contact email |
| Chat | `chat.svg` | Live chat, support |
| WhatsApp | `whatsapp.svg` | WhatsApp contact |
| Location/Pin | `location.svg` | Office address, maps |

### E-Commerce Icons

| Icon | File | Usage |
|---|---|---|
| Shipping/Truck | `shipping.svg` | Shipping info, delivery |
| Package | `package.svg` | Order tracking |
| Credit Card | `credit-card.svg` | Payment methods |
| Shield/Verified | `shield.svg` | Warranty, authorized dealer |
| Return | `return.svg` | Return policy |
| Price Tag | `tag.svg` | Special offers, pricing |

### Business Icons

| Icon | File | Usage |
|---|---|---|
| Building | `building.svg` | Company, office, enterprise |
| Briefcase | `briefcase.svg` | Careers, B2B, business |
| Globe | `globe.svg` | Language selector, global reach |
| Chart/Bar | `chart.svg` | Statistics, analytics |
| Star | `star.svg` | Ratings, featured, awards |
| Check Circle | `check-circle.svg` | Feature lists, success |
| Info | `info.svg` | Information, tooltips |
| Warning | `warning.svg` | Alerts, warnings |
| Clock | `clock.svg` | Business hours, response time |
| Calendar | `calendar.svg` | Events, scheduling |
| Certificate | `certificate.svg` | Certifications, authorized partner |

### Social Media Icons

| Icon | File | Usage |
|---|---|---|
| LinkedIn | `social-linkedin.svg` | LinkedIn link |
| Twitter/X | `social-twitter.svg` | Twitter link |
| Facebook | `social-facebook.svg` | Facebook link |
| Instagram | `social-instagram.svg` | Instagram link |
| YouTube | `social-youtube.svg` | YouTube link |

---

## Icon Implementation

### Inline SVG (Preferred for styling)

```html
<svg class="icon icon-search" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"/>
  <path d="m21 21-4.3-4.3"/>
</svg>
```

### SVG Sprite (For performance)

```html
<!-- Reference from sprite -->
<svg class="icon" aria-hidden="true">
  <use href="/images/icons/sprite.svg#search"/>
</svg>
```

### CSS

```css
.icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: inherit;
}

.icon--small { width: 20px; height: 20px; }
.icon--large { width: 32px; height: 32px; }
.icon--brand-blue { color: #005B9F; }
```

---

## RTL Mirroring

Some icons must flip horizontally in Arabic (RTL) mode:

| Icon | RTL Behavior |
|---|---|
| Chevron Right ↔ Left | Flip (right arrow becomes left-pointing in RTL) |
| Arrow Right | Flip |
| External Link | No flip (universal) |
| Phone | No flip (universal) |

```css
html[dir="rtl"] .icon--rtl-flip {
  transform: scaleX(-1);
}
```

---

*© 2026 Simal Technologies Middle East LLC. Icon Library v1.0. All icons are proprietary or licensed for use on Simal Technologies digital properties.*
