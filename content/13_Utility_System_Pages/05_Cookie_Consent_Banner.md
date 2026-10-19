# Cookie Consent Banner

> **Source:** VENDOR | **Component:** Global — appears on first visit | **Compliance:** UAE PDPL, GDPR
> **Persistence:** 12 months (after consent given)

---

## Banner States

### Initial Banner (Short Version)

```
┌──────────────────────────────────────────────────────────────┐
│ 🍪 This website uses cookies to enhance your experience.     │
│ By continuing, you agree to our use of cookies.              │
│                                                              │
│ [Accept All]  [Reject Non-Essential]  [Customize →]         │
│                                                              │
│ Learn more: [Cookie Policy](/legal/cookie-policy)           │
└──────────────────────────────────────────────────────────────┘
```

### Customize Panel (Expanded)

```
┌──────────────────────────────────────────────────────────────┐
│ Cookie Preferences                                           │
│                                                              │
│ ☑ Essential Cookies (Always Active)                          │
│   Required for the website to function. Cannot be disabled.  │
│   • Session management, security, accessibility              │
│                                                              │
│ ☐ Functional Cookies                                         │
│   Remember your preferences: language, region, theme.        │
│   • Language preference, region selector                     │
│                                                              │
│ ☐ Analytics Cookies                                          │
│   Help us understand how visitors use our site (anonymized). │
│   • Google Analytics, Hotjar                                 │
│                                                              │
│ ☐ Marketing Cookies                                          │
│   Used to deliver relevant advertisements and content.       │
│   • LinkedIn Insight Tag, Meta Pixel, HubSpot                │
│                                                              │
│ [Save Preferences]  [Accept All]                            │
│                                                              │
│ For details, see our [Cookie Policy](/legal/cookie-policy)  │
└──────────────────────────────────────────────────────────────┘
```

---

## Cookie Category Descriptions

| Category | Always Active | Description |
|----------|-------------|------------|
| **Essential** | Yes | Required for core functionality: session management, security (CSRF), consent storage. The website cannot function without these. |
| **Functional** | No | Remember your preferences: language choice, region selection, B2B portal theme. Enhances your browsing experience. |
| **Analytics** | No | Anonymous usage data: pages visited, time on site, traffic sources. Helps us improve the website. Uses Google Analytics and optionally Hotjar. |
| **Marketing** | No | Track ad effectiveness and deliver relevant content. Uses LinkedIn Insight Tag, Meta Pixel, and HubSpot tracking. |

---

## Multi-Language Banner Text

| Language | Short Message | Accept All | Reject Non-Essential | Customize |
|----------|-------------|-----------|---------------------|-----------|
| **English (EN)** | "This website uses cookies to enhance your experience. By continuing, you agree to our use of cookies." | "Accept All" | "Reject Non-Essential" | "Customize" |
| **Arabic (AR)** | "يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربتك. من خلال الاستمرار، فإنك توافق على استخدامنا لملفات تعريف الارتباط." | "قبول الكل" | "رفض غير الضرورية" | "تخصيص" |
| **French (FR)** | "Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez notre utilisation des cookies." | "Tout Accepter" | "Refuser Non-Essentiels" | "Personnaliser" |
| **Russian (RU)** | "Этот сайт использует файлы cookie для улучшения вашего опыта. Продолжая, вы соглашаетесь с использованием cookie." | "Принять Все" | "Отклонить Необязательные" | "Настроить" |

---

## Behavior

| Aspect | Implementation |
|--------|---------------|
| **First Visit** | Banner appears at bottom of viewport (non-blocking, sticky) |
| **Cookie Set** | `cookie_consent` with value: `{essential:true, functional:bool, analytics:bool, marketing:bool, timestamp}` |
| **Expiry** | Consent cookie expires after 12 months |
| **Revisit** | If consent cookie exists, banner does not appear |
| **Change Preferences** | Accessible via "Cookie Settings" link in footer at any time |
| **No Tracking Before Consent** | Non-essential cookies/scripts only load after user consent |
| **Consent Logging** | Log consent timestamp and preferences for compliance audit |

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
