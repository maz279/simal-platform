# Order Management

> **Source:** VENDOR | **Canonical URL:** /b2b/orders | **OG Image:** /assets/images/og/b2b-orders-og.jpg
> **Meta Title:** B2B Order Management — Track & Manage Your Orders | Simal Technologies
> **Meta Description:** Manage your IT hardware orders in the Simal Technologies B2B portal. Order history, status tracking, reorder, export to CSV/PDF. Filter by date, status, or order number.
> **Schema:** WebApplication (OrderManagement)

---

## Your Orders

View, track, and manage all orders placed with Simal Technologies.

---

## Filters & Search

| Filter | Options |
|--------|--------|
| **Search** | Order number, PO number, product name |
| **Status** | All • Pending • Confirmed • Processing • Shipped • Delivered • Canceled • On Hold |
| **Date Range** | Last 30 days • Last 90 days • This Year • Custom Range |
| **Sort By** | Date (Newest) • Date (Oldest) • Order Total (Highest) • Order Total (Lowest) |

---

## Order List Table

| Order # | Date | PO # | Status | Items | Total (AED) | Actions |
|---------|------|------|--------|-------|------------|---------|
| ORD-2026-04512 | May 1, 2026 | PO-8912 | Processing | 3 items | 12,450 | [View] [Track] [Invoice] |
| ORD-2026-04487 | Apr 28, 2026 | PO-8890 | Delivered | 5 items | 8,920 | [View] [Reorder] |
| ORD-2026-04423 | Apr 22, 2026 | — | Canceled | 2 items | 3,100 | [View] |

> **Note:** Up to 25 orders per page. Pagination controls at bottom.

---

## Order Status Definitions

| Status | Meaning |
|--------|--------|
| **Pending** | Order received but not yet confirmed by Simal |
| **Confirmed** | Order verified, stock allocated, payment confirmed |
| **Processing** | Order being picked, packed, and prepared at JAFZA warehouse |
| **Shipped** | Order dispatched; tracking number available |
| **Delivered** | Confirmed delivered to shipping address |
| **Canceled** | Order canceled (by customer or Simal) |
| **On Hold** | Order paused pending additional information or payment |

---

## Order Detail View

When a user clicks **[View]** on an order:

| Section | Content |
|---------|--------|
| **Order Summary** | Order #, Date, PO #, Status, Payment Status, Shipping Method |
| **Items Ordered** | Table: Product Image, Brand, Model, Qty, Unit Price, Line Total |
| **Shipping Details** | Address, Contact Person, Phone, Carrier, Tracking #, Estimated Delivery |
| **Payment Details** | Invoice #, Total, VAT, Grand Total, Payment Status, Payment Method |
| **Timeline** | Order placed → Confirmed → Processing → Shipped → Delivered (with timestamps) |

### Actions Available (by Status)

| Status | Available Actions |
|--------|------------------|
| Pending | Cancel Order • Contact Support |
| Confirmed | Contact Support |
| Processing | Track Shipment • Contact Support |
| Shipped | Track Shipment • Confirm Delivery • Report Issue |
| Delivered | Reorder • Download Invoice • Report Issue |
| Canceled | Reorder |

---

## Reorder

Clicking **Reorder** on a delivered/canceled order:
- Copies all items from the original order into a new sales inquiry form
- Original pricing may not apply (subject to current pricing)
- User can modify quantities or remove items before submitting

---

## Export

| Format | Content |
|--------|--------|
| **Export CSV** | Download filtered order list as CSV (Order #, Date, Status, Items, Total) |
| **Export PDF** | Download detailed order as PDF (includes item list, totals, shipping details) |

---

## Empty State

> "You haven't placed any orders yet. Submit a sales inquiry to get started!"  
> [New Sales Inquiry →](/contact/sales-inquiry)

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
