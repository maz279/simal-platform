# 02 Chatbot Conversation Flows

> **Intent Recognition:** NLP-based keyword matching + decision tree
> **Fallback:** Unknown intents → "I'm not sure I understand. Would you like to speak with a team member?"
> **Last Updated:** May 2, 2026

---

## Flow 1: Product Inquiry

```
User: "What's the price of Crucial P3 Plus 1TB?"
Bot: "The Crucial P3 Plus 1TB NVMe SSD is available for B2B customers. 
     Would you like me to:
     [A] Show product details
     [B] Request a quote
     [C] Connect you with sales"
```

## Flow 2: Quote Request

```
User: "I need a quote for 50 HIKVISION cameras"
Bot: "I can help with that! To prepare your quote, I'll need:
     1. Your company name
     2. Contact email
     3. Shipping country
     Would you like to fill this in now, or shall I connect you with our sales team?"
```

## Flow 3: ERP Demo Request

```
User: "I want to see a demo of UniERP"
Bot: "Great choice! Our ERP consultants would love to show you UniERP in action.
     What industry is your business in?
     [Manufacturing] [Retail] [Distribution] [Healthcare] [Education] [Other]"
```

## Flow 4: B2B Registration Status

```
User: "I registered but haven't heard back"
Bot: "I can check that for you. What email address did you use to register?"
→ Bot queries CRM → Returns status: Pending/Approved/Rejected
```

---

## Quick Replies Menu

| Category | Quick Reply Options |
|---|---|
| Products | Browse Products, SSD & Storage, GPUs, Surveillance, All Brands |
| ERP | UniERP Overview, Modules, Pricing, Request Demo |
| Support | Order Status, RMA Request, Technical Help, Contact Support |
| Account | B2B Registration, Login Help, Reset Password |

---

*© 2026 Simal Technologies Middle East LLC. Chatbot Flows v1.0.*
