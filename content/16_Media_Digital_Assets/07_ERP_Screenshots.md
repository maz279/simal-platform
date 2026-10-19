# 07 ERP Screenshots — UniERP Platform

> **Source:** UniERP Product Team — May 2026
> **Owner:** UniERP Division / Creative Team
> **Version:** 1.0

---

## 1. Overview

UniERP screenshots are the primary visual sales tool for demonstrating the platform's capabilities. High-quality, annotated screenshots across all major modules give prospective clients confidence in the system before they request a demo. This document specifies all screenshot requirements for the UniERP landing page and module-specific solution pages.

### 1.1 Screenshot Inventory

| # | Module / Area | Screenshots Required | Priority |
|---|--------------|---------------------|----------|
| 1 | **Main Dashboard** | 3 screenshots | P0 — Critical |
| 2 | **Finance & Accounting** | 5 screenshots | P0 — Critical |
| 3 | **HR & Payroll** | 4 screenshots | P0 — Critical |
| 4 | **Sales & CRM** | 4 screenshots | P0 — Critical |
| 5 | **Inventory & Warehouse** | 4 screenshots | P1 — High |
| 6 | **Purchase & Procurement** | 3 screenshots | P1 — High |
| 7 | **Manufacturing** | 4 screenshots | P1 — High |
| 8 | **Project Management** | 3 screenshots | P1 — High |
| 9 | **eCommerce / Website** | 3 screenshots | P2 — Medium |
| 10 | **Point of Sale (POS)** | 2 screenshots | P2 — Medium |
| 11 | **Reporting & Analytics** | 3 screenshots | P1 — High |
| 12 | **Multi-Language (AR Interface)** | 2 screenshots | P1 — High |
| 13 | **Mobile App** | 3 screenshots | P2 — Medium |

**Total:** 43 screenshots

---

## 2. Global Screenshot Standards

### 2.1 Technical Specifications

| Parameter | Specification |
|-----------|--------------|
| **Capture Resolution** | 2880 × 1800 px (Retina MacBook) or 1920 × 1080 px (standard) |
| **Display Scaling** | Native @2× for Retina; @1× for standard |
| **Color Space** | sRGB |
| **File Format** | PNG-24 (lossless) — primary; WebP (lossy Q=85) — web |
| **Max File Size** | ≤ 400 KB (WebP); ≤ 1 MB (PNG master) |
| **Browser** | Chrome latest version (for capture) |
| **Demo Data** | Use realistic but fictional company data (not real client data) |
| **Company Name in Screenshots** | "Demo Company Ltd." or "Sample Trading LLC" |
| **Language** | English (default); Arabic for AR-specific screenshots |

### 2.2 Annotation Style

All screenshots on the website include numbered callout annotations explaining key features:

```
┌────────────────────────────────────────┐
│  UniERP Dashboard              [Admin] │
│  ┌──────────┐ ┌──────────┐             │
│  │ ①        │ │          │             │
│  │ Revenue  │ │  Orders  │             │
│  │ AED 2.4M │ │  1,247   │             │
│  └──────────┘ └──────────┘             │
│     ↑ ① Real-time KPIs                 │
│  ─────────────────────────────         │
│  [Chart Area]              ②           │
│     ↑ ② Interactive charts             │
└────────────────────────────────────────┘
```

**Annotation CSS:**
```css
.screenshot-annotation {
  position: absolute;
  background: #005B9F;
  color: #FFFFFF;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 91, 159, 0.3);
  pointer-events: none;
}

.screenshot-annotation::before {
  /* Connecting line from number to feature */
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  width: 2px;
  height: 20px;
  background: #005B9F;
}
```

### 2.3 Data Privacy in Screenshots

| Rule | Description |
|------|-------------|
| **No Real Client Data** | Screenshots must use fictional/sample data only |
| **No Personal Information** | No real names, emails, phone numbers, addresses |
| **No Financial Reality** | Revenue/expense figures must be clearly fictional (round numbers) |
| **Sample Watermark** | Optional: subtle "Sample Data — For Illustration Only" overlay |
| **Review Process** | UniERP Product Manager reviews all screenshots before publication |

---

## 3. Module-by-Module Screenshot Specifications

### 3.1 Main Dashboard (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Executive Dashboard** | KPI cards (Revenue, Expenses, Bank Balance, Outstanding Invoices), mini charts (Revenue Trend, Sales Pipeline), Quick Actions menu, Recent Activities feed |
| 2 | **Sales Dashboard** | Sales funnel, Quotations-to-Orders conversion, Top Products, Sales Team Leaderboard, Monthly Targets vs. Actual |
| 3 | **Operations Dashboard** | Inventory alerts, Purchase orders pending, Delivery schedule, Warehouse utilization, Quality control stats |

### 3.2 Finance & Accounting (5 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Chart of Accounts** | Tree structure of accounts, Arabic + English account names, account codes, types (Asset/Liability/Equity/Income/Expense) |
| 2 | **Customer Invoice** | Full invoice preview: Company header, line items with UAE VAT (5%), subtotal, VAT amount, total in AED, payment terms, due date |
| 3 | **General Ledger** | Journal entries list, debit/credit columns, running balance, period selector, export options |
| 4 | **Bank Reconciliation** | Bank statement upload, matching interface, reconciled vs. unreconciled indicators, closing balance comparison |
| 5 | **UAE VAT Report** | VAT Return form preview (UAE FTA format), Output VAT, Input VAT, Net Payable/Refundable, Period selection |

### 3.3 HR & Payroll (4 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Employee Directory** | Card/list view of employees, search/filter, department grouping, status indicators (Active/On Leave/Terminated) |
| 2 | **Attendance Dashboard** | Check-in/out timeline, attendance calendar with color coding (Present/Absent/Late), overtime hours summary |
| 3 | **Payroll Run** | Payroll batch processing: Employee list with salary, allowances, deductions, net pay; WPS file generation button (UAE compliance) |
| 4 | **Leave Management** | Leave request form, balance display (Annual/Sick/Unpaid), approval workflow visualization, calendar overlay |

### 3.4 Sales & CRM (4 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Pipeline Kanban** | CRM Kanban board: columns (New/Qualified/Proposal/Negotiation/Won/Lost), deal cards with value + contact, drag-and-drop visual cue |
| 2 | **Quotation Builder** | Quotation form: customer selector, product line items with SKU/Description/Qty/Unit Price/Discount/Total, PDF preview button |
| 3 | **Sales Order** | Confirmed sales order view: delivery status, invoicing status, payment status, related purchase orders, timeline tracker |
| 4 | **Customer 360° View** | Customer profile: contact details, communication history, open opportunities, past orders, credit limit, outstanding balance |

### 3.5 Inventory & Warehouse (4 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Inventory Dashboard** | Stock by warehouse, stock value, low-stock alerts, incoming/outgoing movements graph, top-moving products |
| 2 | **Product Master** | Product form: name, SKU/barcode, category, cost price, sale price, VAT rate, supplier, reorder point, current stock, product image |
| 3 | **Warehouse Operations — Receipt** | Goods receipt note: supplier, expected vs. received quantities, lot/serial number entry, putaway location |
| 4 | **Stock Adjustment** | Inventory count sheet, system qty vs. counted qty, variance, adjustment reason, approval workflow |

### 3.6 Purchase & Procurement (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Purchase Order** | PO form: supplier, delivery date, product lines, unit prices, taxes, total, approval status, PDF export |
| 2 | **RFQ Comparison** | Vendor quotation comparison table: products across columns, prices, delivery terms, best-price highlight |
| 3 | **Supplier Portal** | Supplier dashboard: open POs, delivery schedule, invoice submission, quality rating, performance metrics |

### 3.7 Manufacturing (4 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Bill of Materials (BOM)** | Multi-level BOM tree: finished product → sub-assemblies → components → raw materials, quantities, routing operations |
| 2 | **Manufacturing Order** | MO details: product, quantity, BOM, work center, scheduled start/end, material availability (all/partial/none), progress bar |
| 3 | **Work Center Dashboard** | Shop floor view: pending operations by work center, operator assignment, machine utilization, efficiency metrics |
| 4 | **Quality Control** | QC inspection form: quality check template, pass/fail criteria, measurements entry, non-conformance report trigger |

### 3.8 Project Management (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Project Gantt Chart** | Tasks in timeline view, dependencies (arrows), milestones (diamonds), critical path highlighted, progress bars |
| 2 | **Task Kanban Board** | Task board: To Do/In Progress/Review/Done, assignee avatars, priority flags, due date indicators |
| 3 | **Timesheet Entry** | Weekly timesheet grid: projects × days, hours entry, billable/non-billable toggle, approval status |

### 3.9 eCommerce / Website (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Website Builder** | Drag-and-drop page builder: blocks palette, preview canvas, SEO settings panel for a product page |
| 2 | **Online Store — Product Page** | Live product page: images, description, price, variants (size/color), add-to-cart, stock indicator, related products |
| 3 | **Checkout Flow** | Shopping cart → Checkout form → Payment gateway → Order confirmation, with UX flow arrows |

### 3.10 Point of Sale — POS (2 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **POS Interface** | Touch-friendly POS screen: product grid, barcode scan field, customer selector, cart, payment buttons (Cash/Card/Wallet), total display |
| 2 | **POS Receipt** | Printed/on-screen receipt: store header, items, prices, VAT breakdown, payment method, QR code for digital receipt |

### 3.11 Reporting & Analytics (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Report Builder** | Pivot table view: fields (rows/columns/measures), filters, chart type selector (bar/line/pie/table), date range picker |
| 2 | **Financial Statements** | Profit & Loss statement preview: revenue, COGS, gross profit, operating expenses, net profit, period comparison |
| 3 | **Custom Dashboard** | User-built dashboard: drag-and-drop widgets, KPI tiles, multiple chart types, saved views, export button |

### 3.12 Multi-Language — Arabic Interface (2 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Arabic Dashboard** | Same executive dashboard as EN but in Arabic; RTL layout, Arabic numerals, Hijri/Gregorian date toggle, Arabic menu items |
| 2 | **Arabic Invoice** | Full Arabic invoice: right-aligned text, Arabic product descriptions, "ضريبة القيمة المضافة 5%" label, amounts in Arabic numeral format |

### 3.13 Mobile App (3 Screenshots)

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | **Mobile Dashboard** | Phone-frame dashboard: compact KPI cards, hamburger menu, notification badge, offline indicator |
| 2 | **Mobile Sales Order** | Phone-frame order form: simplified input, barcode scanner button, signature capture pad, submit button |
| 3 | **Mobile Attendance** | Phone-frame check-in screen: GPS location, photo capture (selfie), time stamp, check-in/check-out toggle |

---

## 4. Capture Process

### 4.1 Setup

1. **UniERP Instance:** Use a dedicated demo instance (not production), populated with sample data
2. **Demo Company:** Create "Demo Trading LLC" with realistic but fictional records
3. **User Accounts:** Create demo accounts for each role (Admin, Accountant, Sales Manager, etc.)
4. **Data Preparation:** Ensure sample data looks realistic:
   - Products: fictional but believable names
   - Customers/Suppliers: fictional company names
   - Financial figures: round numbers (AED 1,000 — AED 500,000 range)

### 4.2 Capture Workflow

```
1. Login as Demo User with appropriate role
2. Navigate to target module/screen
3. Set all filters to show representative data
4. Expand/collapse sections for optimal layout
5. Resize browser to 1920×1080 or 2880×1800 (Retina)
6. Open Chrome DevTools → Device Mode → Set to target resolution
7. Capture screenshot (Cmd+Shift+4 on Mac; Snipping Tool on Windows)
8. Review: check for accidental real data exposure
9. Name file per convention
10. Save to screenshot library
```

### 4.3 Tools

| Tool | Purpose |
|------|---------|
| **Chrome DevTools** | Capture at precise resolutions; device emulation |
| **Skitch / Snagit** | Annotations, arrows, callout numbers |
| **Photoshop / Figma** | Final compositing, annotation overlays, device frames |
| **ImageOptim** | PNG compression without quality loss |

---

## 5. Web Implementation

### 5.1 Screenshot Gallery Component

```html
<div class="erp-screenshot-gallery" data-module="finance">
  <!-- Main Screenshot -->
  <figure class="screenshot-main">
    <img 
      src="/assets/erp-screenshots/finance_invoice_2880x1800.webp"
      srcset="/assets/erp-screenshots/finance_invoice_5760x3600.webp 2x"
      alt="UniERP Customer Invoice — UAE VAT compliant with 5% tax breakdown in AED"
      width="960"
      height="600"
      loading="lazy">
    <figcaption>
      <h4>UAE VAT-Compliant Invoicing</h4>
      <p>Generate professional invoices with automatic 5% VAT calculation, Arabic and English templates, and FTA-compliant formats.</p>
    </figcaption>
  </figure>
  
  <!-- Thumbnail Strip -->
  <div class="screenshot-thumbnails" role="tablist" aria-label="Finance module screenshots">
    <button role="tab" aria-selected="true">
      <img src="/assets/erp-screenshots/finance_invoice_thumb.webp" alt="Customer Invoice">
    </button>
    <button role="tab" aria-selected="false">
      <img src="/assets/erp-screenshots/finance_ledger_thumb.webp" alt="General Ledger">
    </button>
    <!-- More thumbnails... -->
  </div>
</div>
```

### 5.2 Lightbox Integration

```javascript
// Click main screenshot or thumbnail to open lightbox
screenshot.addEventListener('click', () => {
  lightbox.open({
    src: fullResolutionImage,
    caption: screenshotCaption,
    gallery: 'erp-finance'
  });
});
```

---

## 6. Update & Maintenance

### 6.1 Update Triggers

Screenshots must be re-captured when:

| Trigger | Timeline |
|---------|----------|
| **Major UniERP version upgrade** (e.g., Odoo 19 → 20 CE) | Within 2 weeks of upgrade |
| **UI/UX redesign** of any module | Within 1 week of deployment |
| **New module launch** | Before module page goes live |
| **Arabic UI improvements** | Concurrent with EN updates |
| **Quarterly review** | Every 3 months — verify screenshots still match current UI |

### 6.2 Versioning

```
/erp-screenshots/
├── v1.0/  ← Current (Odoo 19 CE)
├── v1.1/  ← Future minor updates
└── v2.0/  ← Future major upgrade
```

---

## 7. File Naming Convention

```
{module}_{submodule}_{resolution}.{ext}

Examples:
  dashboard_executive_2880x1800.png
  finance_invoice-uae-vat_1920x1080.webp
  hr_payroll-wps_2880x1800.png
  crm_pipeline-kanban_1920x1080.webp
  mobile_dashboard_iphone15_390x844.webp
```

---

> **Next File:** [08_Infographics.md](./08_Infographics.md) — Infographics, diagrams, and data visualization specifications.

> **Parent Section:** [16_Media_Digital_Assets](../16_Media_Digital_Assets/) — Complete media and digital asset specifications.

---

*Simal Technologies Middle East LLC — UniERP Screenshot Specification — CONFIDENTIAL — Version 1.0 — May 2026*
