# B2B Customer Registration

> **Source:** VENDOR | **Canonical URL:** /b2b/register | **OG Image:** /assets/images/og/b2b-register-og.jpg
> **Meta Title:** Register for B2B Account — IT Hardware Wholesale Access | Simal Technologies
> **Meta Description:** Register for a B2B customer account with Simal Technologies Middle East LLC. Access wholesale pricing on IT hardware: SSDs, RAM, GPUs, monitors, networking. Trade license required.
> **Schema:** WebApplication (RegisterAction)

---

## Create Your B2B Account

Register for a business account to access wholesale pricing, submit purchase inquiries, track orders, manage invoices, and more. Registration is open to verified businesses only.

> **Important:** Your registration is subject to review and approval by our team. Accounts are typically approved within 1-2 business days if all required documentation is provided.

---

## Registration Form

### Section 1: Company Information

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | **Company Name** | Text | Yes | Registered legal name of your company |
| 2 | **Company Trade License Number** | Text | Yes | UAE trade license number or equivalent for international companies |
| 3 | **Trade License Upload** | File Upload | Yes* | PDF, JPG, or PNG. Max 5MB. Required for all companies. |
| 4 | **VAT / TAX Registration Number** | Text | Conditional | Required for UAE companies (5% VAT) and other VAT-registered entities |
| 5 | **VAT Certificate Upload** | File Upload | Conditional | Required if VAT registered. PDF or JPG, max 5MB. |
| 6 | **Company Type** | Dropdown | Yes | • IT Reseller/Retailer • System Integrator • Value-Added Reseller (VAR) • E-Commerce Seller • Corporate IT Department • Government Entity • Educational Institution • Managed Service Provider • Other |
| 7 | **Company Website** | URL | No | Your company's official website |
| 8 | **Year of Establishment** | Number | No | Year your company was founded |
| 9 | **Number of Employees** | Dropdown | No | • 1-10 • 11-50 • 51-200 • 201-500 • 500+ |

> *Trade license is required for UAE companies. International companies should provide equivalent business registration documentation.

---

### Section 2: Primary Contact Person

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 10 | **Full Name** | Text | Yes | Primary contact person at your company |
| 11 | **Job Title** | Text | Yes | Designation (e.g., Procurement Manager, IT Director, Owner) |
| 12 | **Email Address** | Email | Yes | Business email — will be used as your B2B portal login |
| 13 | **Phone Number** | Tel | Yes | Include country code |
| 14 | **WhatsApp Number** | Tel | No | If different from phone number above |

---

### Section 3: Company Address

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 15 | **Country** | Dropdown | Yes | Country of registration |
| 16 | **City** | Text | Yes | City |
| 17 | **Full Address** | Textarea | Yes | Complete street address (building, street, area) |
| 18 | **PO Box / Postal Code** | Text | No | If applicable |

---

### Section 4: Business Interest & Volume

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 19 | **Product Categories of Interest** | Checkbox (multi) | Yes | Select all that apply: □ SSDs (Internal NVMe/SATA) □ Portable SSDs □ RAM (DDR4/DDR5) □ VGA / Graphics Cards □ Monitors □ HDMI Cables & Adapters □ USB Hubs & Docking Stations □ Surge Protectors □ Networking Equipment □ Surveillance & Security □ Laptops □ Audio/AV Equipment □ All Categories |
| 20 | **Brands of Interest** | Checkbox (multi) | No | Select preferred brands: □ Crucial □ TEAMGROUP □ HIKVISION □ Koorui □ UGREEN □ WD □ Toshiba □ Zotac □ Inno3D □ Aiwa □ Nearity □ GSKILL □ ARKTEK □ HIKSEMi □ All Brands |
| 21 | **Estimated Monthly Purchase Volume (USD)** | Dropdown | Yes | • Under $5,000 • $5,000 — $25,000 • $25,000 — $100,000 • $100,000 — $500,000 • Over $500,000 • Not Sure Yet |
| 22 | **How Did You Hear About Simal?** | Dropdown | Yes | • Google Search • LinkedIn • Industry Event (GITEX/GISEC) • Trade Partner Referral • Existing Customer Referral • Social Media • Industry Publication • Other |

---

### Section 5: Account Credentials

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 23 | **Create Password** | Password | Yes | Minimum 8 characters. Must include uppercase, lowercase, number, and special character. |
| 24 | **Confirm Password** | Password | Yes | Re-enter your password |

---

### Section 6: Terms & Submission

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 25 | **Terms & Conditions** | Checkbox | Yes | "I have read and agree to the Simal Technologies [B2B Trade Terms](/legal/terms-conditions) and [Privacy Policy](/legal/privacy-policy)." |
| 26 | **Information Accuracy** | Checkbox | Yes | "I confirm that all information provided is true and accurate. I understand that providing false information may result in account rejection or termination." |
| 27 | **Marketing Opt-In** | Checkbox | No | "I would like to receive product updates, promotions, and pricing information from Simal Technologies." |
| 28 | **reCAPTCHA** | reCAPTCHA v3 | Yes | Anti-spam verification |
| 29 | **Create Account** | Button | — | Submit registration for review |

---

## Registration Flow

```
User completes registration form
    → Client-side validation
    → reCAPTCHA verification
    → Account created with status: "Pending Review"
    → Confirmation email sent: "Your B2B account is under review"
    → Simal admin notified (new registration pending)
    → Admin reviews: trade license, company details, business type
    → If Approved:
        → Account status: "Active"
        → Welcome email sent with login link + B2B portal guide
        → Customer record created in HubSpot CRM
    → If Rejected:
        → Account status: "Rejected"
        → Rejection email sent with reason
        → Customer may resubmit with corrected/enhanced information
    → If More Information Needed:
        → Status: "Pending Information"
        → Email requesting specific documents/details
```

---

## Auto-Response Emails

### Pending Review Email

**Subject:** B2B Account Registration Received — Under Review | Simal Technologies

**Body:**
```
Dear {Contact Name},

Thank you for registering for a B2B account with Simal Technologies Middle East LLC.

Your registration has been received and is now under review.

What's next:
1. Our team will review your company details and trade license.
2. The review process typically takes 1-2 business days.
3. You will receive an email once your account is approved.

In the meantime, if you have any urgent inquiries, please contact us at info@simalme.com or call +971 4 393 0507.

Best regards,
Simal Technologies
B2B Customer Support
```

### Approved Email

**Subject:** Welcome to Simal Technologies B2B Portal — Account Approved!

**Body:**
```
Dear {Contact Name},

Welcome to Simal Technologies B2B Portal!

Your business account for {Company Name} has been approved.

What you can do now:
- Browse products with wholesale pricing
- Submit and track purchase inquiries
- View order history and status
- Download invoices and quotations
- Manage your company profile and addresses

Login here: {Login URL}

Getting Started Guide: {Guide URL}

If you have any questions, our dedicated B2B support team is available at:
Email: info@simalme.com
Phone: +971 4 393 0507
WhatsApp: +971 54 308 8655

Best regards,
Simal Technologies B2B Portal
```

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|-------------|
| Company Name | Minimum 2 characters | "Please enter your registered company name." |
| Trade License | PDF, JPG, PNG; max 5MB | "Please upload a valid trade license (PDF, JPG, or PNG, max 5MB)." |
| Email | Business email (no Gmail/Yahoo/Hotmail) | "Please use a business email address (not a free email provider)." |
| Password | Min 8 chars, uppercase, lowercase, number, special | "Password must be at least 8 characters with uppercase, lowercase, number, and special character." |
| VAT Number | 15 digits (UAE), or international format | "Please enter a valid VAT registration number." |

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
