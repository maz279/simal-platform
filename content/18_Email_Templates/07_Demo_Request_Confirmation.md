# 07 Demo Request Confirmation

> **Source:** Mailchimp Transactional Email / SendGrid Dynamic Template
> **Template ID:** `demo-request-confirmation`
> **Trigger:** Form submission on UniERP Demo Request page
> **Last Updated:** May 2, 2026

---

## Email Metadata

| Field | Value |
|---|---|
| **Subject Line (EN)** | Your UniERP demo is scheduled — {Date} at {Time} GST | Simal Technologies |
| **Subject Line (AR)** | تم جدولة العرض التوضيحي لـ UniERP — {Date} الساعة {Time} بتوقيت دبي | سيمال تكنولوجيز |
| **Subject Line (FR)** | Votre démo UniERP est programmée — {Date} à {Time} | Simal Technologies |
| **Subject Line (RU)** | Демонстрация UniERP запланирована — {Date} в {Time} | Simal Technologies |
| **Preheader Text** | Meeting details, preparation checklist, and reschedule option. |
| **From Name** | Simal Technologies ERP Team |
| **From Email** | erp@simalme.com |
| **Reply-To** | erp@simalme.com |
| **Calendar Attachment** | Include .ics file for calendar integration |

---

## Email Body (English)

```
┌────────────────────────────────────────────────────────────┐
│  [SIMAL TECHNOLOGIES LOGO — Centered]                     │
│                                                            │
│  Your UniERP Demo is Confirmed!                            │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Thank you for scheduling a personalized UniERP demo,     │
│  {Contact Name}. We look forward to showing you how       │
│  UniERP can transform your business operations.           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  DEMO DETAILS                                        │ │
│  │                                                      │ │
│  │  📅 Date:     {Date}                                │ │
│  │  🕐 Time:     {Start Time} – {End Time} GST (UTC+4) │ │
│  │  ⏱️ Duration: 45–60 minutes                         │ │
│  │  💻 Platform: {Microsoft Teams / Zoom / Google Meet} │ │
│  │  🔗 Link:     {Meeting Link}                        │ │
│  │  🔢 Meeting ID: {ID}                                │ │
│  │  🔑 Passcode:  {Passcode}                           │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  YOUR DEMO CONSULTANT                                │ │
│  │                                                      │ │
│  │  {Consultant Name}                                   │ │
│  │  ERP Solutions Consultant                            │ │
│  │  📧 {Consultant Email}                               │ │
│  │  📞 {Consultant Phone}                               │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │  DEMO FOCUS AREAS (based on your request)            │ │
│  │                                                      │ │
│  │  {#each selected_modules}                            │ │
│  │  ✅ {Module Name}                                    │ │
│  │  {/each}                                             │ │
│  │                                                      │ │
│  │  Industry: {Selected Industry}                       │ │
│  │  Company Size: {Company Size Range}                   │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  To Make the Most of Your Demo:                           │
│                                                            │
│  Before the demo:                                         │
│  □ Have your list of key requirements ready              │
│  □ Identify your top 3-5 pain points with current system │
│  □ Invite relevant team members (IT, Finance, Ops)       │
│  □ Test your audio/video setup beforehand                │
│                                                            │
│  During the demo:                                         │
│  □ We'll walk through the modules you're interested in   │
│  □ Live Q&A — ask anything!                              │
│  □ We'll discuss your specific industry requirements     │
│  □ You'll receive pricing and implementation timeline    │
│                                                            │
│  [JOIN MEETING]    [ADD TO CALENDAR 📅]                    │
│                                                            │
│  Need to reschedule?                                      │
│  [Reschedule Demo →] or reply to this email.              │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  Can't make it? Please let us know at least 2 hours in    │
│  advance so we can offer the slot to another business.    │
│                                                            │
│  Simal Technologies Middle East LLC                        │
│  +971 4 393 0507 | erp@simalme.com | simalme.com          │
└────────────────────────────────────────────────────────────┘
```

---

## Plain Text Version

```
Your UniERP Demo is Confirmed!

Thank you for scheduling a personalized UniERP demo, {Contact Name}.

DEMO DETAILS:
📅 Date: {Date}
🕐 Time: {Start Time} – {End Time} GST (UTC+4)
⏱️ Duration: 45–60 minutes
💻 Platform: {Teams/Zoom/Meet}
🔗 Join: {Meeting Link}
🔢 Meeting ID: {ID}
🔑 Passcode: {Passcode}

YOUR CONSULTANT:
{Consultant Name}, ERP Solutions Consultant
📧 {Consultant Email} | 📞 {Consultant Phone}

Before the demo:
- Prepare your key requirements
- Identify top 3-5 pain points
- Invite relevant team members
- Test audio/video setup

Reschedule: Reply to this email or use the reschedule link.

Simal Technologies Middle East LLC
simalme.com
```

---

## Send Conditions

| Condition | Rule |
|---|---|
| **Trigger** | Demo request form submitted + time slot confirmed (manual or auto) |
| **Reminder 1** | 24 hours before demo |
| **Reminder 2** | 1 hour before demo (with meeting link prominent) |
| **Post-Demo** | Thank-you email within 2 hours of demo completion (with recording link, proposal, next steps) |

---

*Simal Technologies — Demo Request Confirmation Template v1.0. Includes .ics calendar attachment.*
