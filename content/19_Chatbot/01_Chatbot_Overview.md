# 01 Chatbot Overview

> **Platform:** Intercom / Custom-built chatbot
> **Deployment:** simalme.com (all pages) + B2B portal (logged-in pages)
> **Languages:** EN, AR, FR, RU (auto-detected from page language)
> **Last Updated:** May 2, 2026

---

## Chatbot Modes

| Mode | Trigger | Behavior |
|---|---|---|
| **Proactive Greeting** | First visit, 30s on page | "👋 Welcome to Simal Technologies! How can I help you today?" |
| **Reactive** | User clicks chat icon | Standard chat interface |
| **Out of Hours** | Outside Mon-Fri 9AM-8PM GST; Sat 9AM-3PM GST | "We're currently offline. Leave a message and we'll respond during business hours." |
| **B2B Logged In** | Authenticated B2B user | Personalized greeting with account info; priority routing |

---

## Conversation Flows

| Flow | Trigger Keywords |
|---|---|
| Product Inquiry | "price", "cost", "buy", "order", "product" |
| Quote Request | "quote", "RFQ", "bulk", "wholesale" |
| Technical Support | "help", "issue", "not working", "broken", "RMA" |
| ERP/UniERP | "ERP", "UniERP", "Odoo", "software", "demo" |
| B2B Registration | "register", "account", "sign up", "partner" |
| General | All other messages |

---

## Escalation Rules

| Rule | Action |
|---|---|
| Bot confidence < 70% | Transfer to human agent |
| Customer requests human | Immediate transfer |
| After 3 failed bot responses | Offer human transfer |
| Critical keywords ("urgent", "complaint") | Priority human routing |
| Out of hours | Collect email + message for follow-up |

---

*© 2026 Simal Technologies Middle East LLC. Chatbot Spec v1.0.*
