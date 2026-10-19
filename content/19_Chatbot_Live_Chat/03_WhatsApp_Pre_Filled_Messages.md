# 03 — WhatsApp Pre-Filled Messages & Click-to-Chat Integration

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Complete WhatsApp Business click-to-chat message templates for all 15 product brands, UniERP software solutions, support scenarios, and general inquiries. Covers `wa.me` URL generation, dynamic product/SKU substitution, per-language templates (EN/AR/FR/RU), WhatsApp Business API integration, floating WhatsApp button design, and tracking analytics.  
> **Platform:** WhatsApp Business (Meta) — `wa.me` Click-to-Chat + WhatsApp Cloud API  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [WhatsApp Integration Strategy](#1-whatsapp-integration-strategy)
2. [Simal WhatsApp Business Number](#2-simal-whatsapp-business-number)
3. [wa.me URL Generator (JavaScript)](#3-wame-url-generator-javascript)
4. [Product Inquiry Templates — By Brand](#4-product-inquiry-templates--by-brand)
5. [UniERP Solution Inquiry Templates](#5-unierp-solution-inquiry-templates)
6. [Support & After-Sales Templates](#6-support--after-sales-templates)
7. [General Inquiry Templates](#7-general-inquiry-templates)
8. [Multi-Language Template Matrix](#8-multi-language-template-matrix)
9. [WhatsApp Floating Button UI](#9-whatsapp-floating-button-ui)
10. [WhatsApp Business API Integration](#10-whatsapp-business-api-integration)
11. [Analytics & Event Tracking](#11-analytics--event-tracking)

---

## 1. WhatsApp Integration Strategy

### 1.1 PLACEMENT LOCATIONS

```
┌─────────────────────────────────────────────────┐
│              WEBSITE PAGE LAYOUT                 │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  HEADER NAVIGATION                       │   │
│  │                              [📱 WhatsApp]│   │ ← Header icon
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────┐                          │
│  │  PRODUCT PAGE     │                          │
│  │                   │                          │
│  │  Product Image    │                          │
│  │  Product Name     │                          │
│  │  SKU: ABC-123     │                          │
│  │  [💰 Get Quote via│ ← Inline CTA button     │
│  │   WhatsApp]       │                          │
│  └───────────────────┘                          │
│                                                  │
│  ┌──────────────┐                               │
│  │  ERP PAGE    │                               │
│  │  UniERP      │                               │
│  │  [📱 Ask on  │ ← Inline CTA button          │
│  │   WhatsApp]  │                               │
│  └──────────────┘                               │
│                                                  │
│                           ┌──────────────────┐  │
│                           │  💬 WhatsApp     │  │ ← Floating button
│                           │  Chat with us!   │  │   (all pages)
│                           └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 1.2 USE CASES

| Use Case | WhatsApp Advantage | Template Type |
|----------|-------------------|---------------|
| **B2B bulk RFQ** | Send product list + quantities quickly | Product inquiry (per product or multi-product) |
| **Quick pricing check** | Instant price inquiry without form | Product inquiry |
| **ERP demo request** | Schedule demo conversationally | ERP / Demo |
| **Technical support** | Share photos/videos of issues | Support |
| **After-hours contact** | Leave message when office closed | General / Support |
| **B2B account inquiries** | Quick account management requests | B2B Support |
| **Partner / Reseller application** | Initiate partnership discussion | Partnership |

---

## 2. Simal WhatsApp Business Number

### 2.1 PRIMARY BUSINESS NUMBER

| Attribute | Value |
|-----------|-------|
| **WhatsApp Business Number** | `+97143930507` |
| **Display Format** | `+971 4 393 0507` |
| **WhatsApp Business Profile** | Simal Technologies Middle East LLC |
| **Business Category** | IT Hardware Distribution & ERP Solutions |
| **Business Hours** | Sunday–Thursday, 9 AM – 6 PM GST |
| **Auto-Away Message** | Enabled (outside business hours) |
| **Quick Replies (WhatsApp)** | Pre-configured in WhatsApp Business app |

### 2.2 SECONDARY NUMBERS (Departmental)

| Department | Number | Use |
|-----------|--------|-----|
| Sales — Hardware | `+971 4 393 0507` (primary) | Product inquiries, RFQs |
| Sales — UniERP | `+971 4 393 0507` (primary) | ERP demos, module inquiries |
| Technical Support | `+971 4 393 0507` (primary) | Existing customer support |
| Stellent (Retail) | `+971 4 393 0507` (primary) | Individual/retail purchases |

---

## 3. wa.me URL Generator (JavaScript)

### 3.1 CORE URL GENERATOR

```javascript
// WhatsApp Click-to-Chat URL Generator
// Reference: https://faq.whatsapp.com/5913398998672934

const WHATSAPP_CONFIG = {
  businessPhone: '97143930507',         // Without + or spaces
  defaultLanguage: 'en',
};

/**
 * Generate a WhatsApp wa.me click-to-chat URL with pre-filled message
 * @param {string} template - Template ID (e.g., 'product_inquiry')
 * @param {Object} params - Template parameters
 * @param {string} lang - Language code (en/ar/fr/ru)
 * @returns {string} Full wa.me URL
 */
function generateWhatsAppUrl(template, params = {}, lang = 'en') {
  const phone = WHATSAPP_CONFIG.businessPhone;
  const message = getPreFilledMessage(template, params, lang);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Template message store
 */
function getPreFilledMessage(template, params, lang) {
  const templates = {
    // ── PRODUCT INQUIRY ──
    product_inquiry: {
      en: `Hi, I am interested in ${params.product_name} - SKU: ${params.sku || 'N/A'}. Please share pricing and availability.${params.quantity ? ` Quantity: ${params.quantity} units.` : ''}`,
      ar: `مرحباً، أنا مهتم بـ ${params.product_name} - SKU: ${params.sku || 'N/A'}. يرجى مشاركة التسعير والتوفر.${params.quantity ? ` الكمية: ${params.quantity} وحدة.` : ''}`,
      fr: `Bonjour, je suis intéressé par ${params.product_name} - SKU: ${params.sku || 'N/A'}. Veuillez partager les prix et la disponibilité.${params.quantity ? ` Quantité: ${params.quantity} unités.` : ''}`,
      ru: `Здравствуйте, меня интересует ${params.product_name} - SKU: ${params.sku || 'N/A'}. Пожалуйста, сообщите цены и наличие.${params.quantity ? ` Количество: ${params.quantity} шт.` : ''}`,
    },

    // ── BULK / MULTI-PRODUCT RFQ ──
    bulk_rfq: {
      en: `Hi, I would like to request a quotation for the following products:\n${params.product_list}\nCompany: ${params.company_name || 'N/A'}\nPlease share bulk pricing and lead time.`,
      ar: `مرحباً، أود طلب عرض سعر للمنتجات التالية:\n${params.product_list}\nالشركة: ${params.company_name || 'N/A'}\nيرجى مشاركة تسعير الجملة ووقت التسليم.`,
      fr: `Bonjour, je souhaite demander un devis pour les produits suivants :\n${params.product_list}\nEntreprise : ${params.company_name || 'N/A'}\nVeuillez partager les prix de gros et les délais.`,
      ru: `Здравствуйте, я хотел бы запросить коммерческое предложение на следующие продукты:\n${params.product_list}\nКомпания: ${params.company_name || 'N/A'}\nПожалуйста, сообщите оптовые цены и сроки поставки.`,
    },

    // ── UniERP DEMO ──
    erp_demo: {
      en: `Hi, I would like to schedule a demo of UniERP. I'm interested in the following modules: ${params.modules || 'General overview'}. Industry: ${params.industry || 'N/A'}. Company: ${params.company_name || 'N/A'}.`,
      ar: `مرحباً، أود جدولة عرض توضيحي لـ UniERP. أنا مهتم بالوحدات التالية: ${params.modules || 'نظرة عامة'}. القطاع: ${params.industry || 'N/A'}. الشركة: ${params.company_name || 'N/A'}.`,
      fr: `Bonjour, je souhaite planifier une démo d'UniERP. Je suis intéressé par les modules suivants : ${params.modules || 'Aperçu général'}. Secteur : ${params.industry || 'N/A'}. Entreprise : ${params.company_name || 'N/A'}.`,
      ru: `Здравствуйте, я хотел бы запланировать демонстрацию UniERP. Меня интересуют следующие модули: ${params.modules || 'Общий обзор'}. Отрасль: ${params.industry || 'N/A'}. Компания: ${params.company_name || 'N/A'}.`,
    },

    // ── ERP MODULE INQUIRY ──
    erp_module: {
      en: `Hi, I would like to learn more about the UniERP ${params.module_name} module. Please share features, pricing, and implementation details.`,
      ar: `مرحباً، أود معرفة المزيد عن وحدة ${params.module_name} في UniERP. يرجى مشاركة الميزات والتسعير وتفاصيل التنفيذ.`,
      fr: `Bonjour, j'aimerais en savoir plus sur le module ${params.module_name} d'UniERP. Veuillez partager les fonctionnalités, les prix et les détails de mise en œuvre.`,
      ru: `Здравствуйте, я хотел бы узнать больше о модуле UniERP ${params.module_name}. Пожалуйста, поделитесь функциями, ценами и деталями внедрения.`,
    },

    // ── ERP INDUSTRY SOLUTION ──
    erp_industry: {
      en: `Hi, I would like to learn more about UniERP for the ${params.industry_name} sector. Please share how your solution fits our industry needs.`,
      ar: `مرحباً، أود معرفة المزيد عن UniERP لقطاع ${params.industry_name}. يرجى مشاركة كيف يناسب حلكم احتياجات قطاعنا.`,
      fr: `Bonjour, j'aimerais en savoir plus sur UniERP pour le secteur ${params.industry_name}. Veuillez partager comment votre solution répond aux besoins de notre secteur.`,
      ru: `Здравствуйте, я хотел бы узнать больше о UniERP для отрасли ${params.industry_name}. Пожалуйста, расскажите, как ваше решение соответствует потребностям нашей отрасли.`,
    },

    // ── TECHNICAL SUPPORT ──
    support: {
      en: `Hi, I need technical support. Product: ${params.product_name || 'N/A'} - SKU: ${params.sku || 'N/A'}. Issue: ${params.issue || 'Please describe...'}. My ticket reference (if any): ${params.ticket_id || 'N/A'}.`,
      ar: `مرحباً، أحتاج إلى دعم فني. المنتج: ${params.product_name || 'N/A'} - SKU: ${params.sku || 'N/A'}. المشكلة: ${params.issue || 'يرجى الوصف...'}. رقم التذكرة (إن وجد): ${params.ticket_id || 'N/A'}.`,
      fr: `Bonjour, j'ai besoin d'assistance technique. Produit : ${params.product_name || 'N/A'} - SKU : ${params.sku || 'N/A'}. Problème : ${params.issue || 'Veuillez décrire...'}. Référence du ticket (si disponible) : ${params.ticket_id || 'N/A'}.`,
      ru: `Здравствуйте, мне нужна техническая поддержка. Продукт: ${params.product_name || 'N/A'} - SKU: ${params.sku || 'N/A'}. Проблема: ${params.issue || 'Пожалуйста, опишите...'}. Номер заявки (если есть): ${params.ticket_id || 'N/A'}.`,
    },

    // ── WARRANTY CLAIM ──
    warranty: {
      en: `Hi, I would like to make a warranty claim. Product: ${params.product_name} - SKU: ${params.sku}. Purchase date: ${params.purchase_date || 'N/A'}. Serial number: ${params.serial || 'N/A'}. Issue description: ${params.issue || 'Please describe...'}`,
      ar: `مرحباً، أرغب في تقديم مطالبة ضمان. المنتج: ${params.product_name} - SKU: ${params.sku}. تاريخ الشراء: ${params.purchase_date || 'N/A'}. الرقم التسلسلي: ${params.serial || 'N/A'}. وصف المشكلة: ${params.issue || 'يرجى الوصف...'}`,
      fr: `Bonjour, je souhaite faire une demande de garantie. Produit : ${params.product_name} - SKU : ${params.sku}. Date d'achat : ${params.purchase_date || 'N/A'}. Numéro de série : ${params.serial || 'N/A'}. Description du problème : ${params.issue || 'Veuillez décrire...'}`,
      ru: `Здравствуйте, я хотел бы подать заявку по гарантии. Продукт: ${params.product_name} - SKU: ${params.sku}. Дата покупки: ${params.purchase_date || 'N/A'}. Серийный номер: ${params.serial || 'N/A'}. Описание проблемы: ${params.issue || 'Пожалуйста, опишите...'}`,
    },

    // ── PARTNERSHIP / RESELLER ──
    partnership: {
      en: `Hi, I'm interested in becoming a Simal Technologies reseller/partner. Company: ${params.company_name || 'N/A'}. Location: ${params.location || 'N/A'}. Brands of interest: ${params.brands || 'N/A'}. Please share partnership details and requirements.`,
      ar: `مرحباً، أنا مهتم بأن أصبح موزعاً/شريكاً لشركة سيمال تكنولوجيز. الشركة: ${params.company_name || 'N/A'}. الموقع: ${params.location || 'N/A'}. العلامات التجارية المطلوبة: ${params.brands || 'N/A'}. يرجى مشاركة تفاصيل ومتطلبات الشراكة.`,
      fr: `Bonjour, je suis intéressé à devenir revendeur/partenaire Simal Technologies. Entreprise : ${params.company_name || 'N/A'}. Lieu : ${params.location || 'N/A'}. Marques d'intérêt : ${params.brands || 'N/A'}. Veuillez partager les détails et les exigences du partenariat.`,
      ru: `Здравствуйте, я заинтересован в партнерстве с Simal Technologies. Компания: ${params.company_name || 'N/A'}. Местоположение: ${params.location || 'N/A'}. Интересующие бренды: ${params.brands || 'N/A'}. Пожалуйста, поделитесь деталями и требованиями партнерства.`,
    },

    // ── GENERAL INQUIRY ──
    general: {
      en: `Hi, I have a question about Simal Technologies. ${params.message || 'Please share more information about your products and services.'}`,
      ar: `مرحباً، لدي سؤال حول شركة سيمال تكنولوجيز. ${params.message || 'يرجى مشاركة المزيد من المعلومات حول منتجاتكم وخدماتكم.'}`,
      fr: `Bonjour, j'ai une question concernant Simal Technologies. ${params.message || 'Veuillez partager plus d\'informations sur vos produits et services.'}`,
      ru: `Здравствуйте, у меня вопрос о Simal Technologies. ${params.message || 'Пожалуйста, поделитесь дополнительной информацией о ваших продуктах и услугах.'}`,
    },

    // ── B2B ACCOUNT ──
    b2b_account: {
      en: `Hi, I have a question about my B2B account. Company: ${params.company_name || 'N/A'}. Account email: ${params.email || 'N/A'}. ${params.message || 'Please assist with my account inquiry.'}`,
      ar: `مرحباً، لدي سؤال حول حساب B2B الخاص بي. الشركة: ${params.company_name || 'N/A'}. البريد الإلكتروني للحساب: ${params.email || 'N/A'}. ${params.message || 'يرجى المساعدة في استفسار حسابي.'}`,
      fr: `Bonjour, j'ai une question concernant mon compte B2B. Entreprise : ${params.company_name || 'N/A'}. Email du compte : ${params.email || 'N/A'}. ${params.message || 'Veuillez m\'aider avec ma demande de compte.'}`,
      ru: `Здравствуйте, у меня вопрос по моему B2B аккаунту. Компания: ${params.company_name || 'N/A'}. Email аккаунта: ${params.email || 'N/A'}. ${params.message || 'Пожалуйста, помогите с запросом по моему аккаунту.'}`,
    },
  };

  const tpl = templates[template];
  if (!tpl) return `Hi, I'm contacting Simal Technologies. ${params.message || ''}`;
  return (tpl[lang] || tpl['en']).trim();
}
```

---

## 4. Product Inquiry Templates — By Brand

### 4.1 TEMPLATE: `product_inquiry`

Used on all individual product pages. Dynamically populated with product name, SKU, and optional quantity.

#### HTML Implementation (Product Page)

```html
<!-- WhatsApp CTA Button on Product Page -->
<a href=""
   class="btn btn-whatsapp"
   id="whatsapp-product-cta"
   target="_blank"
   rel="noopener noreferrer"
   data-template="product_inquiry"
   data-product-name=""
   data-product-sku=""
   data-language="en">
  <svg class="btn-whatsapp__icon" aria-hidden="true"><!-- WhatsApp icon --></svg>
  <span data-i18n="whatsapp_get_quote">Get Quote via WhatsApp</span>
</a>

<script>
  // Populate WhatsApp link dynamically
  document.addEventListener('DOMContentLoaded', function() {
    const cta = document.getElementById('whatsapp-product-cta');
    if (!cta) return;

    const productName = cta.getAttribute('data-product-name') ||
                        document.querySelector('meta[name="product:name"]')?.content ||
                        document.querySelector('h1')?.textContent?.trim() || '';
    const productSku = cta.getAttribute('data-product-sku') ||
                       document.querySelector('meta[name="product:sku"]')?.content || '';
    const lang = document.documentElement.lang?.substring(0, 2) || 'en';

    const url = generateWhatsAppUrl('product_inquiry', {
      product_name: productName,
      sku: productSku,
      quantity: '',
    }, lang);

    cta.setAttribute('href', url);

    // Track click
    cta.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'whatsapp_click', {
          template: 'product_inquiry',
          product_name: productName,
          product_sku: productSku,
          language: lang,
          page_path: window.location.pathname,
        });
      }
    });
  });
</script>
```

### 4.2 PER-BRAND PRODUCT MESSAGE EXAMPLES

| Brand | Example Product | Pre-Filled Message (EN) |
|-------|----------------|------------------------|
| **HIKVISION** | DS-2CD2143G2-I 4MP Dome Camera | "Hi, I am interested in HIKVISION DS-2CD2143G2-I 4MP Fixed Dome Network Camera - SKU: DS-2CD2143G2-I. Please share pricing and availability." |
| **Crucial** | CT1000T500SSD8 T500 1TB NVMe SSD | "Hi, I am interested in Crucial T500 1TB NVMe PCIe Gen4 SSD - SKU: CT1000T500SSD8. Please share pricing and availability." |
| **TEAMGROUP** | T-Force Delta RGB DDR5 32GB | "Hi, I am interested in TEAMGROUP T-Force Delta RGB DDR5 32GB (2×16GB) - SKU: FF3D532G6000HC30ADC01. Please share pricing and availability." |
| **Koorui** | 27E6QC 27" QHD Curved Monitor | "Hi, I am interested in Koorui 27E6QC 27" QHD Curved Gaming Monitor - SKU: 27E6QC. Please share pricing and availability." |
| **UGREEN** | CM682 9-in-1 USB-C Hub | "Hi, I am interested in UGREEN CM682 9-in-1 USB-C Hub with 4K HDMI - SKU: CM682. Please share pricing and availability." |
| **WD** | WDS100T3X0E SN850X 1TB NVMe SSD | "Hi, I am interested in WD_BLACK SN850X 1TB NVMe PCIe Gen4 SSD - SKU: WDS100T3X0E. Please share pricing and availability." |
| **Toshiba** | HDTP340EK3AA Canvio Basics 4TB | "Hi, I am interested in Toshiba Canvio Basics 4TB Portable External HDD - SKU: HDTP340EK3AA. Please share pricing and availability." |
| **Zotac** | ZT-D40700E-10M RTX 4070 Twin Edge | "Hi, I am interested in Zotac Gaming GeForce RTX 4070 Twin Edge OC 12GB - SKU: ZT-D40700E-10M. Please share pricing and availability." |
| **Inno3D** | N40703-126X-185252W RTX 4070 | "Hi, I am interested in Inno3D GeForce RTX 4070 TWIN X2 12GB - SKU: N40703-126X-185252W. Please share pricing and availability." |
| **Aiwa** | AIWA-PB-100 10000mAh Power Bank | "Hi, I am interested in Aiwa 10000mAh Power Bank with USB-C PD - SKU: AIWA-PB-100. Please share pricing and availability." |
| **Nearity** | A50 Ceiling Array Microphone | "Hi, I am interested in Nearity A50 Ceiling Array Microphone for Conference Rooms - SKU: A50. Please share pricing and availability." |
| **GSKILL** | F5-6000J3040G32GX2-RS5K 64GB DDR5 | "Hi, I am interested in G.SKILL Trident Z5 RGB DDR5 64GB (2×32GB) 6000MHz - SKU: F5-6000J3040G32GX2-RS5K. Please share pricing and availability." |
| **ARKTEK** | ARK-RTX4070-12G RTX 4070 | "Hi, I am interested in ARKTEK GeForce RTX 4070 12GB Graphics Card - SKU: ARK-RTX4070-12G. Please share pricing and availability." |
| **HIKSEMi** | HS-SSD-FUTURE-512GB NVMe SSD | "Hi, I am interested in HIKSEMi FUTURE 512GB NVMe PCIe Gen3 SSD - SKU: HS-SSD-FUTURE-512GB. Please share pricing and availability." |
| **Honeywell** | HPF24S6 Power Supply | "Hi, I am interested in Honeywell HPF24S6 6A Notification Appliance Power Supply - SKU: HPF24S6. Please share pricing and availability." |

---

## 5. UniERP Solution Inquiry Templates

### 5.1 TEMPLATE: `erp_demo`

Used on UniERP landing page, module pages, and industry solution pages.

```html
<!-- Example: UniERP landing page -->
<a href="https://wa.me/97143930507?text=Hi%2C%20I%20would%20like%20to%20schedule%20a%20demo%20of%20UniERP.%20I'm%20interested%20in%20Accounting%20and%20CRM%20modules."
   class="btn btn-whatsapp btn-lg"
   target="_blank"
   rel="noopener noreferrer">
  <span>📱 Schedule Demo via WhatsApp</span>
</a>
```

### 5.2 PER-MODULE MESSAGES

| UniERP Module | Pre-Filled Message (EN) |
|--------------|------------------------|
| Accounting | "Hi, I would like to learn more about the UniERP Accounting module. Please share features, pricing, and implementation details." |
| CRM | "Hi, I would like to learn more about the UniERP CRM module. Please share features, pricing, and how it handles lead management." |
| Sales | "Hi, I would like to learn more about the UniERP Sales module. Please share features, quotation management, and pricing details." |
| Inventory | "Hi, I would like to learn more about the UniERP Inventory & Warehouse module. Please share features including multi-warehouse and barcode support." |
| HR | "Hi, I would like to learn more about the UniERP HR & Payroll module. Please share features including WPS compliance and UAE labor law support." |
| Purchase | "Hi, I would like to learn more about the UniERP Purchase module. Please share features including vendor management and RFQ automation." |
| Manufacturing | "Hi, I would like to learn more about the UniERP Manufacturing module. Please share MRP, BOM, and work order features." |
| POS | "Hi, I would like to learn more about the UniERP Point of Sale module. Please share features, hardware integration, and pricing." |
| Project | "Hi, I would like to learn more about the UniERP Project Management module. Please share task tracking, timesheet, and billing features." |

### 5.3 PER-INDUSTRY VERTICAL MESSAGES

| Industry Vertical | Pre-Filled Message (EN) |
|-------------------|------------------------|
| IT / Electronics Distribution | "Hi, I would like to learn more about UniERP for IT and Electronics Distribution. We are a distributor looking for inventory and multi-currency ERP." |
| Retail | "Hi, I would like to learn more about UniERP for Retail businesses. Please share POS integration and inventory management features." |
| Healthcare | "Hi, I would like to learn more about UniERP for Healthcare. Please share hospital/clinic management features including patient records." |
| Manufacturing | "Hi, I would like to learn more about UniERP for Manufacturing. Please share MRP, production planning, and quality control features." |
| Education | "Hi, I would like to learn more about UniERP for Education. Please share student management, fee tracking, and timetable features." |
| Logistics | "Hi, I would like to learn more about UniERP for Logistics & Transportation. Please share fleet management and shipment tracking features." |
| Hospitality | "Hi, I would like to learn more about UniERP for Hospitality. Please share hotel/restaurant management features." |
| Construction / Real Estate | "Hi, I would like to learn more about UniERP for Construction & Real Estate. Please share project costing and subcontractor management features." |

---

## 6. Support & After-Sales Templates

### 6.1 TEMPLATE: `support`

```html
<!-- Support page WhatsApp CTA -->
<a href="" class="btn btn-whatsapp btn-support" id="whatsapp-support-cta"
   data-template="support">
  📱 Contact Support via WhatsApp
</a>
```

### 6.2 TEMPLATE: `warranty`

Used on support/warranty pages and product detail pages (after-sales section).

```html
<a href="" class="btn btn-outline-whatsapp" id="whatsapp-warranty-cta"
   data-template="warranty">
  📋 Submit Warranty Claim via WhatsApp
</a>
```

---

## 7. General Inquiry Templates

### 7.1 TEMPLATE: `general` (Global Floating Button)

```html
<!-- Floating WhatsApp Button — All Pages -->
<div class="whatsapp-float" id="whatsapp-float-btn">
  <a href=""
     target="_blank"
     rel="noopener noreferrer"
     aria-label="Chat on WhatsApp"
     id="whatsapp-float-link">
    <svg class="whatsapp-float__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#ffffff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  </a>
  <span class="whatsapp-float__tooltip">Chat with us!</span>
</div>

<script>
  (function() {
    const floatBtn = document.getElementById('whatsapp-float-link');
    const lang = document.documentElement.lang?.substring(0, 2) || 'en';
    const currentPage = window.location.pathname;

    const message = generateWhatsAppUrl('general', {
      message: `I'm on ${currentPage} and would like to know more.`
    }, lang);

    floatBtn.setAttribute('href', message);

    floatBtn.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'whatsapp_click', {
          template: 'general',
          page_path: currentPage,
          language: lang,
        });
      }
    });
  })();
</script>
```

---

## 8. Multi-Language Template Matrix

### 8.1 LANGUAGE DETECTION LOGIC

```javascript
function getWhatsAppLanguage() {
  // 1. Check URL path: /ar/..., /fr/..., /ru/...
  const pathLang = window.location.pathname.split('/')[1];
  if (['ar', 'fr', 'ru'].includes(pathLang)) return pathLang;

  // 2. Check HTML lang attribute
  const htmlLang = document.documentElement.lang?.substring(0, 2);
  if (['ar', 'fr', 'ru'].includes(htmlLang)) return htmlLang;

  // 3. Default to English
  return 'en';
}
```

### 8.2 LANGUAGE ↔ BUTTON LABEL MAP

| Language | "Get Quote via WhatsApp" | "Chat on WhatsApp" | "Schedule Demo via WhatsApp" |
|----------|--------------------------|-------------------|------------------------------|
| **EN** | "Get Quote via WhatsApp" | "Chat on WhatsApp" | "Schedule Demo via WhatsApp" |
| **AR** | "احصل على عرض سعر عبر واتساب" | "تحدث عبر واتساب" | "احجز عرضاً توضيحياً عبر واتساب" |
| **FR** | "Obtenir un devis via WhatsApp" | "Discuter sur WhatsApp" | "Planifier une démo via WhatsApp" |
| **RU** | "Получить предложение в WhatsApp" | "Чат в WhatsApp" | "Запланировать демо через WhatsApp" |

---

## 9. WhatsApp Floating Button UI

### 9.1 CSS IMPLEMENTATION

```css
/* ===== WHATSAPP FLOATING BUTTON ===== */
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.whatsapp-float a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #25D366;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
  transition: all 0.3s ease;
  text-decoration: none;
}

.whatsapp-float a:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.55);
  background-color: #20BD5A;
}

.whatsapp-float__icon {
  width: 32px;
  height: 32px;
}

.whatsapp-float__tooltip {
  background-color: #075E54;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  position: absolute;
  right: 72px;
  top: 50%;
  transform: translateY(-50%);
}

.whatsapp-float:hover .whatsapp-float__tooltip {
  opacity: 1;
  visibility: visible;
}

/* RTL support */
[dir="rtl"] .whatsapp-float {
  right: auto;
  left: 24px;
  align-items: flex-start;
}

[dir="rtl"] .whatsapp-float__tooltip {
  right: auto;
  left: 72px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .whatsapp-float {
    bottom: 16px;
    right: 16px;
  }

  .whatsapp-float a {
    width: 52px;
    height: 52px;
  }

  .whatsapp-float__icon {
    width: 28px;
    height: 28px;
  }

  .whatsapp-float__tooltip {
    display: none; /* Hide tooltip on mobile */
  }

  [dir="rtl"] .whatsapp-float {
    left: 16px;
  }
}
```

### 9.2 POSITIONING WITH INTERCOM

```css
/* When Intercom Messenger is active, stack above it */
.intercom-messenger-active ~ .whatsapp-float,
.whatsapp-float.intercom-active {
  bottom: 100px; /* Above Intercom launcher */
}
```

---

## 10. WhatsApp Business API Integration

### 10.1 CLOUD API CONFIGURATION

```javascript
// Server-side WhatsApp Cloud API integration (Node.js)
// For: Proactive notifications, order confirmations, ticket updates

const WHATSAPP_API = {
  baseUrl: 'https://graph.facebook.com/v19.0',
  phoneNumberId: 'SIM_PHONE_NUMBER_ID',
  accessToken: 'SIM_ACCESS_TOKEN',
  businessPhone: '97143930507',
};

async function sendWhatsAppMessage(toPhone, templateName, params, language = 'en') {
  const response = await fetch(
    `${WHATSAPP_API.baseUrl}/${WHATSAPP_API.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: [
            {
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: p })),
            },
          ],
        },
      }),
    }
  );
  return response.json();
}

// Usage examples:
// await sendWhatsAppMessage('971501234567', 'rfq_confirmation', ['RFQ-20260502-0001', '2 hours']);
// await sendWhatsAppMessage('971501234567', 'demo_reminder', ['May 10, 2026', '11:00 AM GST', 'UniERP']);
```

### 10.2 WHATSAPP BUSINESS API TEMPLATES (Meta-Approved)

| Template Name | Category | Language | Body |
|--------------|----------|----------|------|
| `rfq_confirmation` | UTILITY | EN | "Thank you for your RFQ ({{1}}). Our team will respond within {{2}}. For urgent inquiries, reply to this message." |
| `demo_reminder` | UTILITY | EN | "Reminder: Your UniERP demo is scheduled for {{1}} at {{2}}. Join link: https://meet.simalme.com/{{3}}" |
| `ticket_update` | UTILITY | EN | "Support Ticket {{1}} update: {{2}}. View details: https://simalme.com/support/ticket/{{1}}" |
| `order_status` | UTILITY | EN | "Order {{1}} status: {{2}}. Estimated delivery: {{3}}." |

---

## 11. Analytics & Event Tracking

### 11.1 GA4 EVENT: `whatsapp_click`

```javascript
// Fires on any WhatsApp click-to-chat link click
gtag('event', 'whatsapp_click', {
  template: 'product_inquiry',    // product_inquiry | bulk_rfq | erp_demo | support | warranty | partnership | general | b2b_account
  product_name: 'Crucial T500 1TB NVMe SSD',
  product_sku: 'CT1000T500SSD8',
  brand: 'Crucial',               // if product page
  page_category: 'product',       // homepage | product | catalog | erp | support | about | contact
  page_path: '/products/crucial/ct1000t500ssd8/',
  language: 'en',
  component: 'floating_button',   // floating_button | inline_cta | header_icon | footer_link
});
```

### 11.2 GA4 EVENT: `whatsapp_conversion`

```javascript
// Fires when WhatsApp interaction leads to a tracked conversion (server-side)
// via WhatsApp Business API webhook confirmation
gtag('event', 'whatsapp_conversion', {
  template: 'product_inquiry',
  brand: 'Crucial',
  product_sku: 'CT1000T500SSD8',
  conversion_value: 150.00,       // Estimated order value
  language: 'en',
});
```

### 11.3 CLICK-TO-CHAT TRACKING ATTRIBUTES

```html
<!-- All WhatsApp links must include tracking attributes -->
<a href="https://wa.me/97143930507?text=..."
   data-wa-template="product_inquiry"
   data-wa-product="Crucial T500"
   data-wa-sku="CT1000T500SSD8"
   data-wa-component="inline_cta"
   class="js-whatsapp-track"
   target="_blank"
   rel="noopener noreferrer">
  Get Quote via WhatsApp
</a>
```

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| Intercom Chat Greeting | [01_Intercom_Chat_Greeting.md](./01_Intercom_Chat_Greeting.md) |
| Intercom Bot Flows | [02_Intercom_Bot_Flows.md](./02_Intercom_Bot_Flows.md) |
| Product Photography | [../16_Media_Digital_Assets/01_Product_Photography_76_Products.md](../16_Media_Digital_Assets/01_Product_Photography_76_Products.md) |
| Contact Form Config | [../17_Forms_Data_Collection/01_Contact_Form_Configuration.md](../17_Forms_Data_Collection/01_Contact_Form_Configuration.md) |
| RFQ/Quote Form | [../17_Forms_Data_Collection/02_RFQ_Request_Quote_Form.md](../17_Forms_Data_Collection/02_RFQ_Request_Quote_Form.md) |
| GA4 Event Schema | [../20_Analytics_Tracking/01_GA4_Event_Schema.md](../20_Analytics_Tracking/01_GA4_Event_Schema.md) |
| Conversion Tracking | [../20_Analytics_Tracking/03_Conversion_Tracking_Setup.md](../20_Analytics_Tracking/03_Conversion_Tracking_Setup.md) |

---

*Simal Technologies Middle East LLC — WhatsApp Pre-Filled Messages Specification — CONFIDENTIAL*