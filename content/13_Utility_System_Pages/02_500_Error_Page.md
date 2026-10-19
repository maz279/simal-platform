# 500 — Internal Server Error

> **Source:** VENDOR | **HTTP Status:** 500 | **SEO:** Noindex, Nofollow
> **Meta Title:** Something Went Wrong — 500 Error | Simal Technologies
> **Meta Description:** We're experiencing a technical issue. Our team has been notified and is working to resolve it. Please try again shortly.

---

## Layout Spec

```
┌──────────────────────────────────────────────────┐
│  [Simal Technologies Logo — Link to Home]        │
├──────────────────────────────────────────────────┤
│                                                  │
│                 ⚠️                               │
│                                                  │
│      Something Went Wrong                        │
│                                                  │
│  We're experiencing a temporary technical        │
│  issue. Our team has been automatically          │
│  notified and is working to resolve it.          │
│                                                  │
│  Please try again in a few minutes.              │
│                                                  │
│  [Try Again]  [Go to Homepage]                  │
│                                                  │
│  ─────────────────────────────────────           │
│  Error Reference: {UUID}                         │
│  Time: {Timestamp} (GST)                         │
│                                                  │
│  If the problem persists:                        │
│  📧 info@simalme.com                             │
│  📞 +971 4 393 0507                              │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Content Elements

| Element | Content |
|---------|--------|
| **Error Code** | "500" or "⚠️" icon (no specific error code displayed to user for security) |
| **Title** | "Something Went Wrong" |
| **Message** | "We're experiencing a temporary technical issue. Our team has been automatically notified and is working to resolve it." |
| **Action Buttons** | "Try Again" (reloads the page), "Go to Homepage" |
| **Error Reference** | Auto-generated UUID for support reference (displayed but not revealing technical details) |
| **Timestamp** | Current GST time |
| **Contact Info** | Email and phone for persistent issues |

---

## Behavior

| Aspect | Implementation |
|--------|---------------|
| **HTTP Status** | Return true 500 status code |
| **Error Logging** | Automatically logged to Sentry/error tracking with stack trace |
| **Notification** | Slack/email alert to dev team (with error reference ID) |
| **No Sensitive Data** | Never display stack traces, DB errors, or server paths to users |
| **Retry** | "Try Again" button reloads the page with cache-busting query param |

---

## Multi-Language Versions

| Language | Title | Message |
|----------|-------|--------|
| **English (EN)** | Something Went Wrong | "We're experiencing a temporary technical issue." |
| **Arabic (AR)** | حدث خطأ ما | "نواجه مشكلة فنية مؤقتة. تم إخطار فريقنا تلقائيًا." |
| **French (FR)** | Une Erreur est Survenue | "Nous rencontrons un problème technique temporaire." |
| **Russian (RU)** | Что-то пошло не так | "У нас возникла временная техническая проблема." |

---

## Other Server Error Pages

| Error Code | Title | Description |
|-----------|-------|------------|
| **502 Bad Gateway** | "Service Temporarily Unavailable" | Upstream server issue |
| **503 Service Unavailable** | "Under Maintenance" (or this page if unexpected) | Server overload or maintenance |
| **504 Gateway Timeout** | "Request Timed Out" | Upstream server didn't respond in time |

All share the same branded layout with appropriate messaging.

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
