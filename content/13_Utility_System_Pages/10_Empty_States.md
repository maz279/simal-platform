# 10 Empty States — Consistent Placeholder Content

> **Source:** Global component — reused across all pages and portals
> **Purpose:** Standardize empty state messaging, illustrations, and CTAs across the entire Simal Technologies digital ecosystem
> **Last Updated:** May 2, 2026

---

## Overview

Empty states occur when there is no data to display to the user. Rather than showing a blank white space (which confuses users and looks broken), every empty state across the Simal Technologies website and B2B portal must follow a consistent pattern: **Illustration + Friendly Message + Clear CTA**.

---

## Global Empty State Template

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                   ┌──────────────────┐                       │
│                   │                  │                       │
│                   │   [Illustration] │                       │
│                   │   200×200 px     │                       │
│                   │                  │                       │
│                   └──────────────────┘                       │
│                                                              │
│                   {Friendly Heading}                         │
│                                                              │
│         {Supportive subtext explaining the state}            │
│                                                              │
│                                                              │
│                   ┌──────────────────┐                       │
│                   │   {Primary CTA}  │                       │
│                   └──────────────────┘                       │
│                                                              │
│                     {Secondary link}                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Design Specifications

| Element | Specification |
|---|---|
| **Illustration** | SVG line-art illustration, 200×200px, brand blue (#005B9F) + light grey tones |
| **Heading** | 20px, font-weight 600, color #1A1D23, Inter |
| **Subtext** | 16px, font-weight 400, color #6B7280, max-width 480px, centered |
| **Primary CTA** | Brand Blue (#005B9F) button, 12px horizontal padding, 16px font |
| **Secondary Link** | 14px, color #005B9F, underlined on hover |
| **Container** | Padding 80px top/bottom, 24px left/right, centered content |
| **Background** | Page background (white #FFFFFF or light grey #F5F7FA depending on section) |
| **Animation** | Subtle fade-in animation (opacity 0→1 over 300ms) on mount |

---

## Empty State Inventory — All Pages

### 1. Search — No Results

**Location:** Global search overlay, /search results page

| Field | Content |
|---|---|
| **Illustration** | Magnifying glass over an empty document — `/images/empty-states/search-no-results.svg` |
| **Heading** | No results found |
| **Subtext** | We couldn't find anything matching "{search query}". Try adjusting your search terms, using fewer keywords, or browsing our product categories. |
| **Primary CTA** | Browse All Products → |
| **Secondary Link** | View search tips |
| **Additional Tips** | Bullet list: Check spelling • Try more general keywords • Use fewer filters • Browse by category instead |

---

### 2. Product Category — No Products

**Location:** /products/category/{slug} when category is empty or has no active products

| Field | Content |
|---|---|
| **Illustration** | Empty shelf/box icon — `/images/empty-states/no-products.svg` |
| **Heading** | No products in this category |
| **Subtext** | We don't currently have products listed in "{category name}". Our inventory changes frequently — check back soon or explore related categories. |
| **Primary CTA** | Browse All Categories → |
| **Secondary Link** | Request a product |
| **Alternative Content** | Show 3–4 products from related/sibling categories below the empty state |

---

### 3. Brand Page — No Products

**Location:** /brands/{brand-slug} when brand has no active products

| Field | Content |
|---|---|
| **Illustration** | Brand logo (greyed out) with empty card — `/images/empty-states/brand-no-products.svg` |
| **Heading** | No products currently available for {Brand Name} |
| **Subtext** | We're an authorized distributor for {Brand Name}, but we don't have products listed right now. Contact our sales team for availability, pricing, and lead times. |
| **Primary CTA** | Contact Sales → |
| **Secondary Link** | View all brands |

---

### 4. B2B Dashboard — No Orders

**Location:** B2B Portal > /dashboard, Orders widget when user has zero orders

| Field | Content |
|---|---|
| **Illustration** | Empty clipboard with order sheet — `/images/empty-states/b2b-no-orders.svg` |
| **Heading** | No orders yet |
| **Subtext** | You haven't placed any orders through the B2B portal yet. Start browsing our catalog — once you place your first order, it will appear here with tracking and status updates. |
| **Primary CTA** | Browse Products → |
| **Secondary Link** | Learn how to place an order |

---

### 5. B2B Dashboard — No Quotes

**Location:** B2B Portal > /dashboard, Quotes widget when user has zero quotes

| Field | Content |
|---|---|
| **Illustration** | Empty quotation document — `/images/empty-states/b2b-no-quotes.svg` |
| **Heading** | No quotes requested |
| **Subtext** | Request a quote for bulk orders, custom configurations, or project pricing. Our sales team typically responds within 2–4 business hours during working days. |
| **Primary CTA** | Request a Quote → |
| **Secondary Link** | View RFQ guide |

---

### 6. B2B Dashboard — No Invoices

**Location:** B2B Portal > /invoices when user has zero invoices

| Field | Content |
|---|---|
| **Illustration** | Empty invoice document — `/images/empty-states/b2b-no-invoices.svg` |
| **Heading** | No invoices yet |
| **Subtext** | Invoices are generated when your orders are confirmed and processed. All invoices will appear here with payment status, due dates, and download options. |
| **Primary CTA** | View Credit Account → |
| **Secondary Link** | Payment terms & methods |

---

### 7. B2B Dashboard — No Support Tickets

**Location:** B2B Portal > /tickets when user has zero tickets

| Field | Content |
|---|---|
| **Illustration** | Empty ticket/help icon — `/images/empty-states/b2b-no-tickets.svg` |
| **Heading** | No support tickets |
| **Subtext** | You don't have any open or past support tickets. If you need help with an order, product, or technical issue, our support team is ready to assist. |
| **Primary CTA** | Create a Ticket → |
| **Secondary Link** | Browse FAQ & knowledge base |

---

### 8. B2B Address Book — No Addresses

**Location:** B2B Portal > /addresses when user has zero saved addresses

| Field | Content |
|---|---|
| **Illustration** | Empty map pin/location — `/images/empty-states/b2b-no-addresses.svg` |
| **Heading** | No saved addresses |
| **Subtext** | Add your shipping and billing addresses to speed up checkout. You can save multiple addresses for different locations, warehouses, or branch offices. |
| **Primary CTA** | Add Address → |
| **Secondary Link** | (none) |

---

### 9. Blog / News — No Posts

**Location:** /resources/blog, /resources/news when no posts match filters or category is empty

| Field | Content |
|---|---|
| **Illustration** | Empty newspaper/page — `/images/empty-states/blog-no-posts.svg` |
| **Heading** | No articles found |
| **Subtext** | There are no articles in "{category}" yet. Check back soon for the latest updates, or explore other topics from our resource library. |
| **Primary CTA** | Browse All Articles → |
| **Secondary Link** | Subscribe to newsletter |

---

### 10. Careers — No Openings

**Location:** /careers/openings when no positions match filters

| Field | Content |
|---|---|
| **Illustration** | Empty briefcase/job board — `/images/empty-states/careers-no-jobs.svg` |
| **Heading** | No current openings in "{category/location}" |
| **Subtext** | We don't have any open positions matching your criteria right now. But we're always looking for talented people! Submit a general application and we'll contact you when a suitable role opens. |
| **Primary CTA** | Submit General Application → |
| **Secondary Link** | View all openings |

---

### 11. Event Calendar — No Upcoming Events

**Location:** /resources/events when no upcoming events exist

| Field | Content |
|---|---|
| **Illustration** | Empty calendar — `/images/empty-states/no-events.svg` |
| **Heading** | No upcoming events |
| **Subtext** | We don't have any events scheduled at the moment. We regularly host webinars, training sessions, and industry events. Subscribe to stay updated. |
| **Primary CTA** | Subscribe for Updates → |
| **Secondary Link** | View past events |

---

### 12. Case Studies — No Results

**Location:** /resources/case-studies when filter returns no results

| Field | Content |
|---|---|
| **Illustration** | Empty portfolio folder — `/images/empty-states/no-case-studies.svg` |
| **Heading** | No case studies match your criteria |
| **Subtext** | We don't have published case studies for "{filter}" yet. Explore our other success stories to see how businesses like yours benefit from our solutions. |
| **Primary CTA** | Browse All Case Studies → |
| **Secondary Link** | Request a reference call |

---

### 13. Knowledge Base — No Articles

**Location:** /resources/knowledge-base when search/filter returns no results

| Field | Content |
|---|---|
| **Illustration** | Empty book/knowledge icon — `/images/empty-states/kb-no-articles.svg` |
| **Heading** | No help articles found |
| **Subtext** | We couldn't find any articles matching "{query}". Try different keywords, browse by category, or contact our support team directly. |
| **Primary CTA** | Browse Categories → |
| **Secondary Link** | Contact Support |

---

### 14. ERP Solutions Filter — No Results

**Location:** /erp-solutions when industry/vertical filter returns no matching solutions

| Field | Content |
|---|---|
| **Illustration** | Empty gear/settings icon — `/images/empty-states/erp-no-results.svg` |
| **Heading** | No solutions match your industry selection |
| **Subtext** | We don't have a pre-packaged solution for "{industry}" yet, but UniERP is fully customizable for any industry. Contact our ERP consultants for a tailored solution. |
| **Primary CTA** | Request Custom Solution → |
| **Secondary Link** | View all ERP modules |

---

### 15. Wishlist / Saved Items — Empty

**Location:** B2B Portal > /wishlist when no saved items

| Field | Content |
|---|---|
| **Illustration** | Empty heart/bookmark — `/images/empty-states/wishlist-empty.svg` |
| **Heading** | Your wishlist is empty |
| **Subtext** | Save products you're interested in for quick access later. Browse our catalog and click the bookmark icon on any product to add it here. |
| **Primary CTA** | Browse Products → |
| **Secondary Link** | (none) |

---

## Empty State Illustration Library

| Illustration | File Name | Usage |
|---|---|---|
| Search No Results | `search-no-results.svg` | Search, filter no results |
| No Products | `no-products.svg` | Empty categories, empty brand pages |
| No Orders | `b2b-no-orders.svg` | B2B orders empty |
| No Quotes | `b2b-no-quotes.svg` | B2B quotes empty |
| No Invoices | `b2b-no-invoices.svg` | B2B invoices empty |
| No Tickets | `b2b-no-tickets.svg` | Support tickets empty |
| No Addresses | `b2b-no-addresses.svg` | Address book empty |
| No Blog Posts | `blog-no-posts.svg` | Blog/news empty |
| No Jobs | `careers-no-jobs.svg` | Career openings empty |
| No Events | `no-events.svg` | Events calendar empty |
| No Case Studies | `no-case-studies.svg` | Case studies empty |
| No KB Articles | `kb-no-articles.svg` | Knowledge base empty |
| No ERP Results | `erp-no-results.svg` | ERP filter no results |
| Wishlist Empty | `wishlist-empty.svg` | Wishlist empty |
| Generic No Data | `generic-empty.svg` | Fallback for any unlisted empty state |

*All illustrations: SVG format, 200×200px viewBox, brand blue (#005B9F) primary color, designed by Simal design team.*

---

## Component Implementation

### React Component Interface

```typescript
interface EmptyStateProps {
  illustration: string;        // Path to SVG (from library above)
  heading: string;              // Main heading text
  subtext: string;              // Supportive description
  primaryAction?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  tips?: string[];              // Optional bullet tips (for search empty states)
  className?: string;           // Additional CSS classes
}
```

### Usage Example

```jsx
<EmptyState
  illustration="/images/empty-states/search-no-results.svg"
  heading="No results found"
  subtext={`We couldn't find anything matching "${searchQuery}". Try adjusting your search terms.`}
  primaryAction={{ label: 'Browse All Products →', href: '/products' }}
  secondaryAction={{ label: 'View search tips', href: '/help/search-tips' }}
  tips={[
    'Check spelling and try again',
    'Use more general keywords',
    'Try fewer filters',
    'Browse by category instead'
  ]}
/>
```

---

## Accessibility Requirements

| Requirement | Standard |
|---|---|
| **Illustration Alt Text** | Decorative SVGs must have `aria-hidden="true"` and `role="img"` |
| **Color Contrast** | All text meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text) |
| **Heading Hierarchy** | Empty state heading uses appropriate heading level (H2 or H3, not skipping levels) |
| **Keyboard Navigation** | CTA buttons are focusable and activatable via Enter/Space |
| **Screen Reader** | Subtext is associated with heading via `aria-describedby` |
| **Focus Order** | Illustration → Heading → Subtext → Primary CTA → Secondary Link |

---

## Multi-Language Support

All empty state messages are available in four languages via the CMS translation system:

| State Key | English (EN) | Arabic (AR) | French (FR) | Russian (RU) |
|---|---|---|---|---|
| `search.no_results` | No results found | لا توجد نتائج | Aucun résultat trouvé | Ничего не найдено |
| `products.empty_category` | No products in this category | لا توجد منتجات في هذه الفئة | Aucun produit dans cette catégorie | Нет товаров в этой категории |
| `b2b.no_orders` | No orders yet | لا توجد طلبات بعد | Aucune commande pour le moment | Заказов пока нет |
| `b2b.no_quotes` | No quotes requested | لم يتم طلب أي عروض أسعار | Aucun devis demandé | Запросов предложений нет |
| `blog.no_posts` | No articles found | لا توجد مقالات | Aucun article trouvé | Статей не найдено |
| `careers.no_jobs` | No current openings | لا توجد وظائف شاغرة حالياً | Aucun poste disponible | Нет открытых вакансий |

---

## Loading States vs. Empty States

| Scenario | State | User Sees |
|---|---|---|
| Data is loading | **Loading State** | Skeleton placeholder / spinner |
| Data loaded but empty | **Empty State** | Illustration + Message + CTA |
| Data loaded and has content | **Content State** | Actual data |
| Data failed to load | **Error State** | Error message + Retry button |

**Rule:** Never show an empty state while data is still loading. Always show a loading indicator (skeleton screen or spinner) until the data fetch is complete. Only show empty state when the fetch completes with an empty result set.

---

## Anti-Patterns — What NOT to Do

| ❌ Don't | ✅ Do Instead |
|---|---|
| Show a blank white space | Show empty state with illustration and CTA |
| Display "No data" or "0 results" as plain text | Use friendly, human language |
| Leave user with no path forward | Always provide a primary CTA |
| Use different empty state styles on different pages | Use the global EmptyState component for consistency |
| Show empty state while data is still loading | Show skeleton loader until fetch completes |
| Use generic "No items" for everything | Use context-specific messages that name what's missing |

---

## Success Stories / UX Impact

> "After implementing consistent empty states across our B2B portal, we saw a 34% reduction in support tickets related to 'missing data' confusion. New customers now understand exactly what to do when they see an empty dashboard."
> — **Simal Technologies UX Team**

---

## Frequently Asked Questions

**Q: Can I customize the empty state for a specific page?**
A: The empty state component accepts custom illustration, heading, subtext, and actions via props. For unique cases, you can pass any content while maintaining the global layout structure.

**Q: What if I need an empty state not listed here?**
A: Use the `generic-empty.svg` illustration with custom heading/subtext. If the empty state proves to be recurring, request a custom illustration from the design team.

**Q: Should empty states include animations?**
A: Yes — a subtle fade-in animation (opacity 0→1 over 300ms) on mount. Illustrations should be static SVGs (no looping animations that could distract or cause accessibility issues).

**Q: How are empty states handled for screen readers?**
A: The heading is announced as the primary information. The subtext is linked via `aria-describedby`. Illustration SVGs have `aria-hidden="true"`. CTA buttons receive focus in logical order.

---

## Cross-Linking & Navigation

- [404 Error Page](/13_Utility_System_Pages/01_404_Error_Page)
- [500 Error Page](/13_Utility_System_Pages/02_500_Error_Page)
- [B2B Dashboard](/12_B2B_Customer_Portal/03_B2B_Dashboard)
- [Search Results](/13_Utility_System_Pages/03_Search_Results)
- [Careers Overview](/09_Careers/01_Careers_Overview)
- [Blog & News](/08_Resources/05_Blog_News)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Empty State Design System v1.0. All illustrations are proprietary assets of Simal Technologies.*
