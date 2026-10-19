# 04 Structured Data — JSON-LD Implementation

> **Source:** Injected into `<head>` via CMS or build process; validated with Google Rich Results Test
> **Format:** JSON-LD (application/ld+json) — Google's recommended format
> **Validation:** Schema.org vocabulary; Google Rich Results Test; Bing Markup Validator
> **Last Updated:** May 2, 2026

---

## Structured Data Types Inventory

| Schema Type | Pages | Priority | Google Rich Result |
|---|---|---|---|
| **Organization** | All pages (global) | P0 — Critical | Knowledge Graph panel |
| **LocalBusiness** | Contact page | P0 — Critical | Local pack, Maps, Knowledge panel |
| **WebSite** | Homepage | P0 — Critical | Sitelinks searchbox |
| **BreadcrumbList** | All sub-pages | P0 — Critical | Breadcrumb in SERP |
| **Product** (x76) | Product detail pages | P0 — Critical | Product rich results (price, availability, reviews) |
| **Article** | Blog posts, news | P1 — High | Article rich results, Top Stories carousel |
| **FAQ** | FAQ page, product FAQs | P1 — High | FAQ rich results (accordion) |
| **HowTo** | Guides, tutorials | P2 — Medium | How-to rich results |
| **Event** | Events calendar | P2 — Medium | Event rich results |
| **JobPosting** | Career openings | P1 — High | Google Jobs |
| **VideoObject** | Pages with embedded videos | P2 — Medium | Video rich results |
| **SearchAction** | Homepage | P1 — High | Sitelinks searchbox |

---

## 1. Organization (Global — Every Page)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://simalme.com/#organization",
  "name": "Simal Technologies Middle East LLC",
  "alternateName": ["Simal Technologies", "SimalME"],
  "url": "https://simalme.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://simalme.com/images/logo/simal-logo-600x60.png",
    "width": 600,
    "height": 60
  },
  "image": "https://simalme.com/images/og/default-og-en.jpg",
  "description": "Simal Technologies Middle East LLC is a leading IT hardware distributor and UniERP solutions provider based in Dubai, UAE, serving 500+ B2B clients across 30+ countries with 22+ global technology brands.",
  "foundingDate": "2015",
  "founder": {
    "@type": "Person",
    "name": "Mohamed Aslam",
    "jobTitle": "Managing Director"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Office 201, Dar Al Riffa Building",
    "addressLocality": "Bur Dubai",
    "addressRegion": "Dubai",
    "postalCode": "P.O. Box 12345",
    "addressCountry": "AE"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+971-4-393-0507",
      "contactType": "sales",
      "email": "sales@simalme.com",
      "availableLanguage": ["en", "ar", "fr", "ru"],
      "areaServed": ["AE", "SA", "QA", "KW", "BH", "OM", "MA", "DZ", "TN", "SN", "CI", "CM", "RU", "KZ", "UZ", "BD"]
    },
    {
      "@type": "ContactPoint",
      "telephone": "+971-4-393-0507",
      "contactType": "customer support",
      "email": "support@simalme.com",
      "availableLanguage": ["en", "ar"]
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/simal-technologies",
    "https://twitter.com/SimalTech",
    "https://www.facebook.com/SimalTechnologiesME",
    "https://www.instagram.com/simaltechnologies",
    "https://www.youtube.com/@SimalTechnologies"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "minValue": 50,
    "maxValue": 100
  },
  "areaServed": [
    {
      "@type": "Continent",
      "name": "Asia"
    },
    {
      "@type": "Continent",
      "name": "Africa"
    },
    {
      "@type": "Continent",
      "name": "Europe"
    }
  ],
  "knowsAbout": [
    "IT Hardware Distribution",
    "Enterprise Resource Planning",
    "Surveillance Systems",
    "Data Center Infrastructure",
    "Odoo ERP",
    "Computer Hardware",
    "Networking Equipment"
  ],
  "award": [
    "HIKVISION Authorized Distributor of the Year",
    "Crucial Platinum Partner Middle East"
  ]
}
```

---

## 2. LocalBusiness (Contact Page)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://simalme.com/contact/#localbusiness",
  "name": "Simal Technologies Middle East LLC",
  "parentOrganization": {
    "@id": "https://simalme.com/#organization"
  },
  "image": "https://simalme.com/images/office/dubai-hq.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Office 201, Dar Al Riffa Building",
    "addressLocality": "Bur Dubai",
    "addressRegion": "Dubai",
    "addressCountry": "AE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 25.2582,
    "longitude": 55.3047
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Friday",
      "opens": "09:00",
      "closes": "12:30"
    }
  ],
  "telephone": "+971-4-393-0507",
  "email": "info@simalme.com",
  "priceRange": "$$$",
  "currenciesAccepted": "AED, USD, EUR",
  "paymentAccepted": "Bank Transfer, Wire Transfer, Letter of Credit",
  "areaServed": [
    {
      "@type": "Country",
      "name": "United Arab Emirates"
    },
    {
      "@type": "Country",
      "name": "Saudi Arabia"
    },
    {
      "@type": "Country",
      "name": "Qatar"
    }
  ],
  "hasMap": "https://goo.gl/maps/...",
  "sameAs": [
    "https://www.linkedin.com/company/simal-technologies",
    "https://twitter.com/SimalTech"
  ]
}
```

---

## 3. WebSite + SearchAction (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://simalme.com/#website",
  "url": "https://simalme.com",
  "name": "Simal Technologies Middle East",
  "description": "IT Hardware Distribution & UniERP Solutions in Dubai, UAE",
  "inLanguage": ["en", "ar", "fr", "ru"],
  "publisher": {
    "@id": "https://simalme.com/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://simalme.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

---

## 4. BreadcrumbList (All Sub-Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://simalme.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://simalme.com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SSD & Storage",
      "item": "https://simalme.com/products/ssd-storage"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Crucial P3 Plus 1TB NVMe SSD"
    }
  ]
}
```

---

## 5. Product (Product Detail Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://simalme.com/products/crucial-p3-plus-1tb/#product",
  "name": "Crucial P3 Plus 1TB NVMe M.2 SSD",
  "image": [
    "https://simalme.com/images/products/crucial-p3-plus-1tb-front.jpg",
    "https://simalme.com/images/products/crucial-p3-plus-1tb-angle.jpg"
  ],
  "description": "Crucial P3 Plus 1TB NVMe M.2 PCIe Gen4 x4 SSD — up to 5000MB/s read, 4200MB/s write. Ideal for gaming, content creation, and professional workloads.",
  "sku": "CT1000P3PSSD8",
  "mpn": "CT1000P3PSSD8",
  "brand": {
    "@type": "Brand",
    "name": "Crucial",
    "url": "https://simalme.com/brands/crucial"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "Micron Technology, Inc."
  },
  "category": "SSD Storage",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "AED",
    "lowPrice": "225",
    "highPrice": "265",
    "offerCount": "2",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@id": "https://simalme.com/#organization"
    },
    "eligibleRegion": [
      {
        "@type": "Country",
        "name": "AE"
      },
      {
        "@type": "Country",
        "name": "SA"
      }
    ],
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "25",
        "currency": "AED"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "AE"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3,
          "unitCode": "DAY"
        }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "AE",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 14,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "124",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Ahmed R."
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "Excellent NVMe SSD for the price. Fast read/write speeds as advertised. Using it for my gaming PC build.",
      "datePublished": "2026-03-15"
    }
  ],
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Capacity",
      "value": "1TB"
    },
    {
      "@type": "PropertyValue",
      "name": "Form Factor",
      "value": "M.2 2280"
    },
    {
      "@type": "PropertyValue",
      "name": "Interface",
      "value": "PCIe Gen4 x4 NVMe"
    },
    {
      "@type": "PropertyValue",
      "name": "Read Speed",
      "value": "5000 MB/s"
    },
    {
      "@type": "PropertyValue",
      "name": "Write Speed",
      "value": "4200 MB/s"
    }
  ],
  "isRelatedTo": [
    {
      "@type": "Product",
      "name": "Crucial P5 Plus 1TB NVMe SSD",
      "url": "https://simalme.com/products/crucial-p5-plus-1tb"
    }
  ]
}
```

---

## 6. Article (Blog Posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://simalme.com/blog/choose-right-ssd-server/#article",
  "headline": "How to Choose the Right SSD for Your Server: NVMe vs SATA",
  "description": "A comprehensive guide comparing NVMe and SATA SSDs for server deployments. Learn about IOPS, endurance, form factors, and cost considerations for enterprise storage.",
  "image": "https://simalme.com/images/blog/ssd-server-comparison.jpg",
  "author": {
    "@type": "Person",
    "name": "M. Aslam",
    "url": "https://simalme.com/about/leadership"
  },
  "publisher": {
    "@id": "https://simalme.com/#organization"
  },
  "datePublished": "2026-04-15T10:00:00+04:00",
  "dateModified": "2026-04-20T14:30:00+04:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://simalme.com/blog/choose-right-ssd-server"
  },
  "articleSection": "IT Hardware",
  "keywords": ["SSD", "NVMe", "SATA", "server storage", "enterprise SSD", "data center"],
  "wordCount": 1850,
  "inLanguage": "en",
  "isAccessibleForFree": true
}
```

---

## 7. FAQ (FAQ Page & Product FAQ Sections)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What brands of SSD does Simal Technologies distribute?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We are an authorized distributor for Crucial (Micron), Western Digital (WD), TEAMGROUP, Toshiba, ARKTEK, and HIKSEMi SSDs. We offer NVMe M.2, SATA 2.5-inch, and external portable SSDs for consumer, gaming, and enterprise applications."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer bulk or wholesale pricing on SSDs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. B2B customers with a registered account receive wholesale pricing on bulk orders. Minimum order quantities and tiered pricing are available. Register a B2B account or contact sales@simalme.com for a customized quote."
      }
    }
  ]
}
```

---

## 8. JobPosting (Career Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Senior B2B Sales Executive — IT Hardware",
  "description": "Simal Technologies is seeking an experienced B2B Sales Executive to drive IT hardware sales across the MENA region. Responsible for managing key accounts, generating new business, and achieving revenue targets.",
  "datePosted": "2026-05-01",
  "validThrough": "2026-06-01",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@id": "https://simalme.com/#organization"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dubai",
      "addressRegion": "Dubai",
      "addressCountry": "AE"
    }
  },
  "jobLocationType": "TELECOMMUTE",
  "applicantLocationRequirements": {
    "@type": "Country",
    "name": "AE"
  },
  "baseSalary": {
    "@type": "MonetaryAmountDistribution",
    "currency": "AED",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 12000,
      "maxValue": 18000,
      "unitText": "MONTH"
    }
  },
  "qualifications": "5+ years B2B IT hardware sales experience; strong knowledge of PC components, storage, and networking products; existing relationships with system integrators and resellers in the MENA region; valid UAE driving license.",
  "skills": "B2B Sales, IT Hardware, Account Management, CRM (HubSpot), Negotiation, Arabic & English fluency"
}
```

---

## 9. Event (Events Calendar)

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "UniERP Live Demo & Implementation Workshop",
  "description": "Join Simal Technologies for a live demonstration of UniERP, our Odoo 19 CE-based ERP platform. Learn about implementation best practices, module configuration, and see real-world case studies.",
  "image": "https://simalme.com/images/events/unierp-workshop-may-2026.jpg",
  "startDate": "2026-05-20T10:00:00+04:00",
  "endDate": "2026-05-20T12:00:00+04:00",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://simalme.com/webinars/unierp-demo-may-2026"
  },
  "organizer": {
    "@id": "https://simalme.com/#organization"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "AED",
    "availability": "https://schema.org/InStock",
    "url": "https://simalme.com/webinars/unierp-demo-may-2026/register"
  },
  "inLanguage": ["en", "ar"],
  "performer": {
    "@type": "Person",
    "name": "ERP Solutions Team",
    "affiliation": {
      "@id": "https://simalme.com/#organization"
    }
  }
}
```

---

## 10. HowTo (Guides & Tutorials)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Install an NVMe M.2 SSD in Your Desktop PC",
  "description": "Step-by-step guide to installing an NVMe M.2 SSD in a desktop computer — from checking motherboard compatibility to cloning your existing drive.",
  "image": "https://simalme.com/images/guides/install-nvme-ssd.jpg",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "AED",
    "value": "0"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Phillips-head screwdriver"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Check motherboard compatibility",
      "text": "Verify your motherboard has an M.2 slot that supports NVMe PCIe (not just SATA). Check your motherboard manual or manufacturer website for specifications.",
      "image": "https://simalme.com/images/guides/step1-check-motherboard.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Power down and open the case",
      "text": "Shut down your PC, unplug the power cable, and press the power button to discharge residual power. Remove the side panel to access the motherboard."
    }
  ]
}
```

---

## Multi-Language Structured Data

For multilingual pages, include `inLanguage` and language-specific URLs:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://simalme.com/ar/products/ssd-storage/#webpage",
  "url": "https://simalme.com/ar/products/ssd-storage",
  "name": "حلول تخزين SSD — سيمال تكنولوجيز",
  "inLanguage": "ar",
  "isPartOf": {
    "@id": "https://simalme.com/ar/#website"
  },
  "about": {
    "@id": "https://simalme.com/#organization"
  }
}
```

---

## Validation & Testing

| Tool | URL | Purpose |
|---|---|---|
| **Google Rich Results Test** | https://search.google.com/test/rich-results | Test individual URLs for rich result eligibility |
| **Schema.org Validator** | https://validator.schema.org | Validate JSON-LD syntax and Schema.org compliance |
| **Google Search Console** | https://search.google.com/search-console | Monitor rich result performance and errors at scale |
| **Bing Markup Validator** | https://www.bing.com/webmasters/help/markup-validator | Validate for Bing search |

### Pre-Deployment Checklist

- [ ] All JSON-LD blocks are valid JSON (no trailing commas, no unescaped characters)
- [ ] `@id` values are unique and resolve to valid URLs
- [ ] Organization `@id` is consistent across all pages (use `#organization` reference)
- [ ] Product prices, availability, and offers are accurate and up-to-date
- [ ] Images referenced in JSON-LD exist and return HTTP 200
- [ ] `datePublished` and `dateModified` use ISO 8601 format with timezone (+04:00)
- [ ] Language-specific pages have correct `inLanguage` values
- [ ] All rich result types validate in Google Rich Results Test without errors

---

## Frequently Asked Questions

**Q: Should I put JSON-LD in the `<head>` or `<body>`?**
A: Google recommends placing JSON-LD in the `<head>` section, but it works in `<body>` too. For Simal's website, all JSON-LD is injected into `<head>` via the CMS SEO plugin.

**Q: Can I have multiple JSON-LD blocks on one page?**
A: Yes. For example, a product page may have Organization, BreadcrumbList, Product, and FAQ JSON-LD blocks. Each must be in its own `<script type="application/ld+json">` tag.

**Q: How do I handle structured data for out-of-stock products?**
A: Set `offers.availability` to `https://schema.org/OutOfStock`. Do NOT remove the Product schema — keeping it allows Google to re-index when stock returns.

**Q: Do I need separate JSON-LD for each language?**
A: Yes. Each language version should have its own URL in `@id` and `url` fields, with correct `inLanguage` values. Use `hreflang` references in `sameAs` for cross-language linking.

---

## Cross-Linking & Navigation

- [Meta Titles — All Pages](/15_SEO_Metadata/01_Meta_Titles_All_Pages)
- [Meta Descriptions — All Pages](/15_SEO_Metadata/02_Meta_Descriptions_All_Pages)
- [Open Graph Images](/15_SEO_Metadata/03_Open_Graph_Images_Key_Pages)
- [Image Alt Text](/15_SEO_Metadata/05_Image_Alt_Text_All_Images)
- [Homepage](/01_Homepage/01_Homepage)

---

*© 2026 Simal Technologies Middle East LLC. All rights reserved. Structured Data Spec v2.0. All JSON-LD validated against Schema.org and Google Rich Results Test.*
