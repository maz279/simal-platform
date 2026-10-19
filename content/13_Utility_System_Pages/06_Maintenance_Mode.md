# Maintenance Mode Page

> **Source:** VENDOR | **HTTP Status:** 503 | **Standalone:** Yes (no header/footer)
> **Meta Title:** Under Maintenance — We'll Be Back Soon | Simal Technologies
> **Meta Description:** Simal Technologies website is temporarily undergoing scheduled maintenance. We'll be back shortly. For urgent inquiries, contact us.

---

## Layout Spec

```
+--------------------------------------------------+
¦                                                  ¦
¦         [Simal Technologies Logo]                ¦
¦                                                  ¦
¦              ???                                  ¦
¦                                                  ¦
¦      We'll Be Back Soon!                        ¦
¦                                                  ¦
¦  Our website is undergoing scheduled             ¦
¦  maintenance to serve you better.                ¦
¦                                                  ¦
¦  Expected downtime:                              ¦
¦  Saturday, May 9, 2026                          ¦
¦  12:00 AM — 6:00 AM (GST)                        ¦
¦                                                  ¦
¦  -------------------------------------           ¦
¦                                                  ¦
¦  Need to reach us during this time?              ¦
¦                                                  ¦
¦  ?? info@simalme.com                             ¦
¦  ?? +971 4 393 0507                              ¦
¦  ?? WhatsApp: +971 54 308 8655                   ¦
¦                                                  ¦
¦  Our team is available during business hours:    ¦
¦  Sat-Thu: 9 AM — 8 PM GST                        ¦
¦                                                  ¦
+--------------------------------------------------+
```

---

## Behavior

| Aspect | Implementation |
|--------|---------------|
| **HTTP Status** | Return 503 Service Unavailable with `Retry-After` header |
| **SEO** | `<meta name="robots" content="noindex, nofollow">` |
| **Standalone** | No header navigation or footer — only logo + maintenance message + contact |
| **Activation** | Server-level configuration (Nginx/Apache) or CMS maintenance mode toggle |
| **Exclusions** | API endpoints, B2B portal (/b2b/*), and admin panel may remain accessible (configurable) |
| **Auto-Recovery** | Set `Retry-After` header; browsers and search engines respect this |

---

## Scheduled Maintenance Template

For planned maintenance, customize:

| Variable | Example |
|----------|--------|
| **Date** | Saturday, May 9, 2026 |
| **Time** | 12:00 AM — 6:00 AM GST |
| **Reason** | "System upgrade and performance improvements" (optional) |

---

*Last updated: May 2026 | © Simal Technologies Middle East LLC*
