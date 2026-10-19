# 03 Chatbot Integration Specifications

> **Integration Points:** Intercom REST API, Webhooks, HubSpot CRM
> **Last Updated:** May 2, 2026

---

## Technical Stack

| Component | Technology |
|---|---|
| **Chat Platform** | Intercom (primary) |
| **NLP Engine** | Intercom Resolution Bot + Custom intents |
| **CRM Sync** | HubSpot — create/update contacts, log conversations |
| **Knowledge Base** | Intercom Articles — bot pulls from KB for answers |
| **Analytics** | Intercom Reports + Google Analytics events |

---

## Integration Matrix

| System | Integration Type | Data Flow |
|---|---|---|
| **HubSpot CRM** | API + Webhook | Chat conversations logged as Activities on Contact record; new contacts created |
| **B2B Portal** | SSO + Identity verification | Logged-in users identified automatically; account context available to bot |
| **UniSoft ERP** | API (future) | Order status, invoice lookup (planned Phase 2) |
| **Google Analytics** | Event tracking | `chat_started`, `chat_ended`, `chat_escalated_to_human` |
| **WhatsApp Business** | API (Phase 2) | Omnichannel — WhatsApp conversations in same inbox |

---

## Chat Widget Configuration

| Setting | Value |
|---|---|
| **Position** | Bottom-right corner |
| **Launcher Text** | "💬 Help" |
| **Launcher Color** | Brand Blue #005B9F |
| **Auto-Open** | Proactive message after 30s on pricing/contact pages |
| **Mobile** | Full-screen chat on mobile devices |
| **Cookie Consent** | Chat loads only after cookie consent accepted |

---

*© 2026 Simal Technologies Middle East LLC. Chatbot Integration Spec v1.0.*
