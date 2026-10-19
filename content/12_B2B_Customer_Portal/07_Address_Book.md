# Address Book

> **Source:** VENDOR | **Canonical URL:** /b2b/addresses | **OG Image:** /assets/images/og/b2b-addresses-og.jpg
> **Meta Title:** B2B Address Book — Manage Shipping & Billing Addresses | Simal Technologies
> **Meta Description:** Manage your company's saved addresses in the Simal Technologies B2B portal. Add, edit, or delete shipping and billing addresses. Set default addresses for faster checkout.
> **Schema:** WebApplication (AddressManagement)

---

## Your Addresses

Manage the shipping and billing addresses associated with your company account. Saved addresses are used during quote acceptance, order placement, and invoice generation.

---

## Address List

| # | Label | Address Type | Address | Default | Actions |
|---|-------|-------------|---------|---------|---------|
| 1 | **Head Office** | Billing & Shipping | Office No: 201, XYZ Building, Al Fahidi St, Bur Dubai, Dubai, UAE | Yes — Shipping | [Edit] [Delete] |
| 2 | **Warehouse — Al Quoz** | Shipping Only | Warehouse 12, Al Quoz Industrial Area 3, Dubai, UAE | — | [Edit] [Set Default] [Delete] |
| 3 | **Accounts Dept — JLT** | Billing Only | Office 505, Jumeirah Lakes Towers, Cluster D, Dubai, UAE | Yes — Billing | [Edit] [Delete] |

---

## Address Types

| Type | Used For |
|------|---------|
| **Shipping Only** | Product delivery destination |
| **Billing Only** | Invoice and payment correspondence |
| **Both (Billing & Shipping)** | Used for both delivery and invoicing |

---

## Add / Edit Address Form

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | **Address Label** | Text | Yes | Friendly name (e.g., "Head Office", "Dubai Warehouse", "Riyadh Branch") |
| 2 | **Address Type** | Radio | Yes | • Shipping Only • Billing Only • Both |
| 3 | **Company Name** | Text | Yes | Receiving company name (may differ from account company) |
| 4 | **Contact Person** | Text | Yes | Name of person receiving deliveries at this address |
| 5 | **Phone Number** | Tel | Yes | Contact number for delivery coordination (include country code) |
| 6 | **Country** | Dropdown | Yes | ISO 3166-1 country list |
| 7 | **City** | Text | Yes | City |
| 8 | **Area / District** | Text | No | Neighborhood or district |
| 9 | **Street Address** | Textarea | Yes | Building name/no, street, landmarks |
| 10 | **PO Box / Postal Code** | Text | No | If applicable |
| 11 | **Delivery Instructions** | Textarea | No | Special instructions for delivery (e.g., "Loading dock at rear", "Call 30 min before arrival", gate codes) |
| 12 | **Set as Default** | Checkbox | No | Make this the default shipping or billing address |
| 13 | **Save Address** | Button | — | Save address to address book |

---

## Default Addresses

| Default | Behavior |
|---------|---------|
| **Default Shipping** | Pre-selected when accepting quotes or placing orders for delivery |
| **Default Billing** | Pre-populated on invoice generation |

Only one address can be set as default for each type. Setting a new default replaces the previous one.

---

## Address Limits

| Limit | Value |
|-------|-------|
| **Maximum Saved Addresses** | 20 |
| **Addresses with at Least One Default Set** | 1 for shipping, 1 for billing |

---

## Delete Address

- Addresses currently used in active (unshipped) orders cannot be deleted
- The last remaining address cannot be deleted (at least one address must exist)
- Confirmation modal before deletion: "Are you sure you want to delete '{Address Label}'?"

---

## Empty State

> "No addresses saved yet. Add your first address to streamline your orders."  
> [Add New Address →](#)

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
