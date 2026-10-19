# B2B Support Tickets

> **Source:** VENDOR | **Canonical URL:** /b2b/support | **OG Image:** /assets/images/og/b2b-support-og.jpg
> **Meta Title:** B2B Support Tickets — Create & Track Support Requests | Simal Technologies
> **Meta Description:** Create and track support tickets in the Simal Technologies B2B portal. Product issues, technical questions, order inquiries, RMA requests. View ticket history and communicate with our support team.
> **Schema:** WebApplication (SupportTicketManagement)

---

## Support Tickets

Create, view, and track your support tickets. Our team responds to tickets within 4 business hours during working days.

---

## Ticket List

| Ticket # | Subject | Category | Priority | Status | Created | Last Updated | Actions |
|----------|---------|----------|----------|--------|---------|-------------|---------|
| TKT-2026-01234 | Samsung 990 Pro not detected | Technical Support | High | Open | Apr 30 | Apr 30 | [View] |
| TKT-2026-01215 | Invoice correction — INV-2026-00892 | Billing | Medium | In Progress | Apr 28 | Apr 29 | [View] |
| TKT-2026-01198 | RMA request — Dead Crucial T500 | RMA | High | Resolved | Apr 25 | Apr 27 | [View] |
| TKT-2026-01145 | Product compatibility inquiry | General | Low | Closed | Apr 20 | Apr 22 | [View] |

---

## Ticket Status Definitions

| Status | Meaning |
|--------|--------|
| **Open** | Ticket created — awaiting support response |
| **In Progress** | Support team is actively working on the ticket |
| **Waiting on Customer** | Support needs more information from you |
| **Resolved** | Issue resolved — ticket can be reopened if needed |
| **Closed** | Ticket closed (automatically after 7 days of being resolved, or manually) |

---

## Ticket Priority

| Priority | Response Target | Examples |
|----------|----------------|---------|
| **Critical** | 1 hour | System down affecting business operations |
| **High** | 4 hours | Product malfunction, RMA request, incorrect order |
| **Medium** | 1 business day | Product question, invoice inquiry, account help |
| **Low** | 2 business days | General inquiry, product information request |

---

## Create New Ticket

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | **Subject** | Text | Yes | Brief summary of your issue (max 150 characters) |
| 2 | **Category** | Dropdown | Yes | • Technical Support • RMA / Warranty Claim • Order Issue • Billing / Invoice • Account Help • Product Information • General Inquiry • Other |
| 3 | **Priority** | Radio | Yes | • Critical • High • Medium • Low |
| 4 | **Related Order / Invoice #** | Text | No | Link this ticket to an existing order or invoice (if applicable) |
| 5 | **Product / Brand / Model** | Text | No | Which product does this relate to (if applicable) |
| 6 | **Description** | Textarea | Yes | Describe your issue in detail. Include error messages, troubleshooting steps tried, and any relevant context (max 5,000 characters) |
| 7 | **Attachment** | File Upload | No | Screenshots, photos, invoices, or other supporting files. PDF, JPG, PNG, MP4. Max 10MB per file, up to 3 files. |
| 8 | **Submit Ticket** | Button | — | Create ticket and notify support team |

---

## Ticket Detail View (Message Thread)

When a user clicks **[View]** on a ticket:

| Section | Content |
|---------|--------|
| **Ticket Header** | Ticket #, Subject, Status, Priority, Category, Created Date |
| **Message Thread** | Chronological messages (user + support responses) with timestamps and author names |
| **Add Reply** | Textarea for new message + file attachment option + "Send Reply" button |
| **Actions** | Close Ticket (if resolved) • Reopen Ticket (if resolved/closed) |

### Reply Behavior

- Customer replies appear immediately in the thread
- Support team receives notification
- If ticket status is "Resolved" and customer replies, ticket automatically reopens to "Open"
- All replies are permanent and cannot be edited after submission

---

## Auto-Response Email

**Subject:** Support Ticket Created — TKT-{YYYY-XXXXX} | Simal Technologies

**Body:**
```
Dear {Contact Name},

Your support ticket has been created.

Ticket Number: TKT-{YYYY-XXXXX}
Subject: {Subject}
Priority: {Priority}

What's next:
1. Our support team will review your ticket.
2. You will receive a response within the timeframe for your priority level.
3. You can view and reply to your ticket in the B2B Portal.

Track your ticket: {Ticket URL}

For urgent issues, call +971 4 393 0507 and quote your ticket number.

Best regards,
Simal Technologies Support Team
```

---

## Filters

| Filter | Options |
|--------|--------|
| **Status** | All • Open • In Progress • Waiting on Customer • Resolved • Closed |
| **Priority** | All • Critical • High • Medium • Low |
| **Category** | All • Technical Support • RMA • Order • Billing • Account • Other |
| **Date Range** | Last 30 days • Last 90 days • This Year • All Time |

---

## Empty State

> "You haven't created any support tickets yet. Need help? Create your first ticket!"  
> [Create New Ticket →](#)

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
