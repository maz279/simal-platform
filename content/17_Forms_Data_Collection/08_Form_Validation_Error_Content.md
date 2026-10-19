# 08 — Form Validation Error Content (Multi-Form / Multi-Language)

> **Source:** SIMAL-WEB-CONTENT-LIST-2026  
> **Description:** Standardized validation error messages for all 7 public-facing forms in all 4 supported languages (EN/AR/FR/RU), covering inline field errors, summary banner errors, server-side errors, throttling, and reCAPTCHA failures.  
> **Scope:** Contact Form, RFQ/Quote, Demo Request, Newsletter, Partner Application, Job Application, Support Ticket  
> **Languages:** English (EN), Arabic (AR — RTL), French (FR), Russian (RU)  
> **Last Updated:** 2026-05-02

---

## Table of Contents

1. [Validation Architecture](#1-validation-architecture)
2. [Common Validation Rules Across All Forms](#2-common-validation-rules)
3. [Error Message Library — English (EN)](#3-error-message-library--english-en)
4. [Error Message Library — Arabic (AR)](#4-error-message-library--arabic-ar)
5. [Error Message Library — French (FR)](#5-error-message-library--french-fr)
6. [Error Message Library — Russian (RU)](#6-error-message-library--russian-ru)
7. [Summary Banner Messages](#7-summary-banner-messages)
8. [Server-Side & API Error Messages](#8-server-side--api-error-messages)
9. [Form-Specific Validation Rules](#9-form-specific-validation-rules)
10. [JavaScript Validation Implementation](#10-javascript-validation-implementation)
11. [CSS Error Display Patterns](#11-css-error-display-patterns)
12. [Accessibility (a11y) Requirements](#12-accessibility-a11y-requirements)
13. [Analytics & Error Tracking](#13-analytics--error-tracking)

---

## 1. Validation Architecture

```
┌─────────────────────────────────────────────────┐
│               CLIENT-SIDE (Browser)              │
│  ┌───────────────────────────────────────────┐  │
│  │  1. Real-time inline validation (on blur) │  │
│  │  2. Full validation on submit attempt     │  │
│  │  3. reCAPTCHA v3 token generation         │  │
│  │  4. Honeypot field check (silent fail)    │  │
│  └───────────────┬───────────────────────────┘  │
│                  │ fetch('/api/...')             │
└──────────────────┼──────────────────────────────┘
                   │
┌──────────────────┼──────────────────────────────┐
│               SERVER-SIDE (Node.js / PHP)        │
│  ┌───────────────┴───────────────────────────┐  │
│  │  5. reCAPTCHA v3 score verification       │  │
│  │  6. Honeypot content check                │  │
│  │  7. Rate limiting check (IP + session)    │  │
│  │  8. Input sanitization & re-validation    │  │
│  │  9. File upload virus scan (if file)      │  │
│  │ 10. CRM/email submission                  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Error Display Strategy

| Validation Layer | When Triggered | Display Method | User Action |
|-----------------|----------------|----------------|-------------|
| **Inline (Real-time)** | On field `blur` after first interaction | Red border + icon + message below field | Correct field value |
| **Inline (On Submit)** | On form submit attempt, all invalid fields | Red border + icon + message below each invalid field | Correct all highlighted fields |
| **Summary Banner** | On form submit attempt (only if ≥2 errors) | Sticky banner at top of form listing all errors | Scroll to each field via anchor |
| **Toast Notification** | Server-side errors, network failures | Fixed position toast (top-right) | Dismiss or retry |
| **Modal Dialog** | Critical failures (reCAPTCHA blocked, session expired) | Centered modal with action button | Acknowledge & retry |

---

## 2. Common Validation Rules Across All Forms

### FIELD TYPES & CONSTRAINTS

| Field | Min | Max | Pattern / Constraint | Required On |
|-------|-----|-----|---------------------|-------------|
| `full_name` | 2 | 100 | `/^[\p{L}\s\-'\.]{2,100}$/u` (Latin + Arabic + Cyrillic + French accented) | ALL forms |
| `email` | 5 | 254 | RFC 5322 compliant; `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` | ALL forms |
| `phone` | 7 | 20 | `/^[\+\d][\d\s\-\(\)\.]{6,20}$/` | ALL forms |
| `company_name` | 2 | 200 | `/^[\p{L}0-9\s\-\'\.\&\,\(\)]{2,200}$/u` | RFQ, Partner, Support |
| `subject` | 3 | 200 | Any text (sanitized server-side) | Contact, Support |
| `message` | 10 | 5000 | Any text (sanitized server-side) | Contact, RFQ, Support |
| `trade_license` | — | 10 MB | `.pdf`, `.jpg`, `.jpeg`, `.png` | Partner |
| `cv_resume` | — | 5 MB | `.pdf`, `.doc`, `.docx` | Job |
| `attachment` | — | 20 MB | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.xlsx`, `.csv`, `.zip` | Support |
| `quantity` | 1 | 10000 | Integer | RFQ |

### REGEX PATTERNS (JavaScript-compatible)

```javascript
const VALIDATION_PATTERNS = {
  full_name: /^[\p{L}\s\-'\.]{2,100}$/u,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^[\+\d][\d\s\-\(\)\.]{6,20}$/,
  company_name: /^[\p{L}0-9\s\-\'\.\&\,\(\)]{2,200}$/u,
  subject: /^.{3,200}$/,
  message: /^[\s\S]{10,5000}$/,
  product_name: /^.{2,150}$/,
  website_url: /^https?:\/\/.{4,}$/,
  trade_license_number: /^[\w\-\/]{3,50}$/,
  uae_passport_number: /^[\w\-]{5,20}$/,
};
```

---

## 3. Error Message Library — English (EN)

### 3.1 REQUIRED FIELD (Empty / Whitespace Only)

| Field Name | Inline Error (EN) |
|-----------|-------------------|
| Full Name | "Please enter your full name." |
| Email Address | "Please enter your email address." |
| Phone Number | "Please enter your phone number." |
| Company Name | "Please enter your company name." |
| Subject | "Please enter a subject." |
| Message / Enquiry | "Please enter your message." |
| Product Name | "Please enter a product name." |
| Quantity | "Please enter a quantity." |
| Country | "Please select your country." |
| Industry | "Please select your industry." |
| Trade License | "Please upload your trade license." |
| CV / Resume | "Please upload your CV or resume." |
| Job Title | "Please enter the job title you are applying for." |
| Preferred Demo Date | "Please select a preferred date." |
| Preferred Demo Time | "Please select a preferred time." |
| ERP Module(s) of Interest | "Please select at least one module." |
| Brand(s) of Interest | "Please select at least one brand." |
| How Did You Hear About Us? | "Please select an option." |
| Agreement / Terms | "You must agree to the terms and conditions." |
| Privacy Policy | "You must agree to the privacy policy." |

### 3.2 FORMAT / PATTERN VALIDATION

| Error Code | Scenario | Inline Error (EN) |
|-----------|----------|-------------------|
| `E-FMT-EMAIL` | Invalid email format | "Please enter a valid email address (e.g., name@company.com)." |
| `E-FMT-PHONE` | Invalid phone format | "Please enter a valid phone number with country code (e.g., +971 4 123 4567)." |
| `E-FMT-PHONE-SHORT` | Phone too short (< 7 chars) | "Phone number is too short. Please include country code." |
| `E-FMT-URL` | Invalid URL | "Please enter a valid website URL starting with http:// or https://." |
| `E-FMT-NAME-SHORT` | Name too short (< 2 chars) | "Name must be at least 2 characters." |
| `E-FMT-NAME-INVALID` | Name contains special chars | "Name can only contain letters, spaces, hyphens, apostrophes, and periods." |
| `E-FMT-COMPANY` | Company name invalid | "Company name can only contain letters, numbers, spaces, hyphens, apostrophes, periods, ampersands, commas, and parentheses." |
| `E-FMT-MESSAGE-SHORT` | Message too short (< 10 chars) | "Your message must be at least 10 characters." |
| `E-FMT-QUANTITY` | Invalid quantity | "Please enter a valid quantity (whole number between 1 and 10,000)." |
| `E-FMT-TRADE-LICENSE` | Invalid license number | "Trade license number format is invalid." |

### 3.3 FILE UPLOAD VALIDATION

| Error Code | Scenario | Inline Error (EN) |
|-----------|----------|-------------------|
| `E-FILE-SIZE` | File exceeds max size | "File size exceeds the maximum limit of {SIZE}MB. Please upload a smaller file." |
| `E-FILE-TYPE` | Unsupported file type | "File type not supported. Accepted formats: {TYPES}." |
| `E-FILE-CORRUPT` | Corrupt or unreadable | "The file appears to be corrupted. Please upload a different file." |
| `E-FILE-COUNT` | Too many files | "You can upload a maximum of {COUNT} file(s)." |
| `E-FILE-EMPTY` | 0-byte file | "The uploaded file is empty. Please select a valid file." |
| `E-FILE-VIRUS` | Virus detected (server) | "The uploaded file could not be accepted for security reasons. Please try another file." |

### 3.4 reCAPTCHA & BOT DETECTION

| Error Code | Scenario | Error Message (EN) |
|-----------|----------|-------------------|
| `E-CAPTCHA-FAILED` | reCAPTCHA v3 score < 0.5 | "Security verification failed. Please try again." |
| `E-CAPTCHA-EXPIRED` | Token expired (> 2 min) | "Security verification expired. Please submit the form again." |
| `E-CAPTCHA-NOT-LOADED` | reCAPTCHA script blocked | "Security verification is not available. Please disable any ad blockers and refresh the page." |
| `E-HONEYPOT` | Honeypot field filled (bot) | Form appears to submit successfully (silent rejection — no visible error) |

### 3.5 RATE LIMITING

| Error Code | Scenario | Error Message (EN) |
|-----------|----------|-------------------|
| `E-RATE-IP` | IP throttled (> 3 submissions / 5 min) | "You have submitted too many forms. Please wait {MINUTES} minutes and try again." |
| `E-RATE-SESSION` | Session throttled | "Please wait before submitting another request." |
| `E-RATE-GLOBAL` | Global spike protection | "We are experiencing high traffic. Please try again in a few minutes." |

### 3.6 SUBMISSION FAILURES

| Error Code | Scenario | Error Message (EN) |
|-----------|----------|-------------------|
| `E-SUBMIT-NETWORK` | Network error / timeout | "A network error occurred. Please check your connection and try again." |
| `E-SUBMIT-SERVER` | Server error (5xx) | "Something went wrong on our end. Please try again later or contact us at info@simalme.com." |
| `E-SUBMIT-CRM` | CRM (HubSpot) API failure | "Your form was received, but we are experiencing a delay. Our team will follow up within 24 hours." |
| `E-SUBMIT-EMAIL` | Email delivery failure | "Your submission was received, but email confirmation may be delayed." |
| `E-SUBMIT-TIMEOUT` | Request timeout (> 30s) | "The request timed out. Please try again. If the problem persists, email us at info@simalme.com." |

---

## 4. Error Message Library — Arabic (AR)

> **RTL Note:** All Arabic error messages use right-to-left direction. Inline messages appear below the field with `dir="rtl"` attribute. The error icon appears on the right side of the message.

### 4.1 REQUIRED FIELD (AR)

| Field Name | Inline Error (AR) |
|-----------|-------------------|
| الاسم الكامل | "يرجى إدخال اسمك الكامل." |
| البريد الإلكتروني | "يرجى إدخال عنوان بريدك الإلكتروني." |
| رقم الهاتف | "يرجى إدخال رقم هاتفك." |
| اسم الشركة | "يرجى إدخال اسم شركتك." |
| الموضوع | "يرجى إدخال موضوع." |
| الرسالة / الاستفسار | "يرجى إدخال رسالتك." |
| اسم المنتج | "يرجى إدخال اسم المنتج." |
| الكمية | "يرجى إدخال الكمية." |
| الدولة | "يرجى اختيار دولتك." |
| القطاع | "يرجى اختيار قطاعك." |
| الرخصة التجارية | "يرجى رفع الرخصة التجارية." |
| السيرة الذاتية | "يرجى رفع سيرتك الذاتية." |
| المسمى الوظيفي | "يرجى إدخال المسمى الوظيفي الذي تتقدم له." |
| تاريخ العرض التوضيحي المفضل | "يرجى اختيار تاريخ مفضل." |
| وقت العرض التوضيحي المفضل | "يرجى اختيار وقت مفضل." |
| وحدات ERP المطلوبة | "يرجى اختيار وحدة واحدة على الأقل." |
| العلامات التجارية المطلوبة | "يرجى اختيار علامة تجارية واحدة على الأقل." |
| كيف سمعت عنا؟ | "يرجى اختيار خيار." |
| الموافقة على الشروط | "يجب الموافقة على الشروط والأحكام." |
| سياسة الخصوصية | "يجب الموافقة على سياسة الخصوصية." |

### 4.2 FORMAT VALIDATION (AR)

| Error Code | Inline Error (AR) |
|-----------|-------------------|
| `E-FMT-EMAIL` | "يرجى إدخال بريد إلكتروني صحيح (مثال: name@company.com)." |
| `E-FMT-PHONE` | "يرجى إدخال رقم هاتف صحيح مع رمز الدولة (مثال: 4567 123 4 971+)." |
| `E-FMT-PHONE-SHORT` | "رقم الهاتف قصير جداً. يرجى إضافة رمز الدولة." |
| `E-FMT-URL` | "يرجى إدخال رابط موقع إلكتروني صحيح يبدأ بـ http:// أو https://." |
| `E-FMT-NAME-SHORT` | "يجب أن يتكون الاسم من حرفين على الأقل." |
| `E-FMT-NAME-INVALID` | "يمكن أن يحتوي الاسم على أحرف ومسافات وشرطات وفواصل عليا ونقاط فقط." |
| `E-FMT-MESSAGE-SHORT` | "يجب أن تتكون رسالتك من 10 أحرف على الأقل." |
| `E-FMT-QUANTITY` | "يرجى إدخال كمية صحيحة (رقم صحيح بين 1 و 10,000)." |

### 4.3 FILE UPLOAD (AR)

| Error Code | Inline Error (AR) |
|-----------|-------------------|
| `E-FILE-SIZE` | "حجم الملف يتجاوز الحد الأقصى {SIZE} ميغابايت. يرجى رفع ملف أصغر." |
| `E-FILE-TYPE` | "نوع الملف غير مدعوم. الصيغ المقبولة: {TYPES}." |
| `E-FILE-CORRUPT` | "يبدو أن الملف تالف. يرجى رفع ملف آخر." |
| `E-FILE-COUNT` | "يمكنك رفع {COUNT} ملف/ملفات كحد أقصى." |
| `E-FILE-EMPTY` | "الملف المرفوع فارغ. يرجى اختيار ملف صالح." |
| `E-FILE-VIRUS` | "تعذر قبول الملف لأسباب أمنية. يرجى تجربة ملف آخر." |

### 4.4 CAPTCHA & BOT (AR)

| Error Code | Error Message (AR) |
|-----------|-------------------|
| `E-CAPTCHA-FAILED` | "فشل التحقق الأمني. يرجى المحاولة مرة أخرى." |
| `E-CAPTCHA-EXPIRED` | "انتهت صلاحية التحقق الأمني. يرجى إعادة إرسال النموذج." |
| `E-CAPTCHA-NOT-LOADED` | "التحقق الأمني غير متاح. يرجى تعطيل حاصرات الإعلانات وتحديث الصفحة." |

### 4.5 RATE LIMITING (AR)

| Error Code | Error Message (AR) |
|-----------|-------------------|
| `E-RATE-IP` | "لقد أرسلت عدداً كبيراً من النماذج. يرجى الانتظار {MINUTES} دقائق والمحاولة مرة أخرى." |
| `E-RATE-SESSION` | "يرجى الانتظار قبل إرسال طلب آخر." |
| `E-RATE-GLOBAL` | "نشهد حركة مرور عالية. يرجى المحاولة مرة أخرى خلال بضع دقائق." |

### 4.6 SUBMISSION FAILURES (AR)

| Error Code | Error Message (AR) |
|-----------|-------------------|
| `E-SUBMIT-NETWORK` | "حدث خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى." |
| `E-SUBMIT-SERVER` | "حدث خطأ من جانبنا. يرجى المحاولة مرة أخرى لاحقاً أو التواصل معنا على info@simalme.com." |
| `E-SUBMIT-CRM` | "تم استلام نموذجك، ولكننا نواجه تأخيراً. سيتواصل فريقنا خلال 24 ساعة." |
| `E-SUBMIT-TIMEOUT` | "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى. إذا استمرت المشكلة، راسلنا على info@simalme.com." |

---

## 5. Error Message Library — French (FR)

### 5.1 REQUIRED FIELD (FR)

| Field Name | Inline Error (FR) |
|-----------|-------------------|
| Nom complet | "Veuillez saisir votre nom complet." |
| Adresse e-mail | "Veuillez saisir votre adresse e-mail." |
| Numéro de téléphone | "Veuillez saisir votre numéro de téléphone." |
| Nom de l'entreprise | "Veuillez saisir le nom de votre entreprise." |
| Sujet | "Veuillez saisir un sujet." |
| Message | "Veuillez saisir votre message." |
| Nom du produit | "Veuillez saisir un nom de produit." |
| Quantité | "Veuillez saisir une quantité." |
| Pays | "Veuillez sélectionner votre pays." |
| Secteur d'activité | "Veuillez sélectionner votre secteur." |
| Licence commerciale | "Veuillez télécharger votre licence commerciale." |
| CV | "Veuillez télécharger votre CV." |
| Intitulé du poste | "Veuillez saisir l'intitulé du poste pour lequel vous postulez." |
| Date de démo préférée | "Veuillez sélectionner une date préférée." |
| Heure de démo préférée | "Veuillez sélectionner une heure préférée." |
| Module(s) ERP souhaité(s) | "Veuillez sélectionner au moins un module." |
| Marque(s) souhaitée(s) | "Veuillez sélectionner au moins une marque." |
| Comment nous avez-vous connu ? | "Veuillez sélectionner une option." |
| Conditions générales | "Vous devez accepter les conditions générales." |
| Politique de confidentialité | "Vous devez accepter la politique de confidentialité." |

### 5.2 FORMAT VALIDATION (FR)

| Error Code | Inline Error (FR) |
|-----------|-------------------|
| `E-FMT-EMAIL` | "Veuillez saisir une adresse e-mail valide (ex. : nom@entreprise.com)." |
| `E-FMT-PHONE` | "Veuillez saisir un numéro de téléphone valide avec l'indicatif du pays (ex. : +971 4 123 4567)." |
| `E-FMT-PHONE-SHORT` | "Le numéro de téléphone est trop court. Veuillez inclure l'indicatif du pays." |
| `E-FMT-URL` | "Veuillez saisir une URL valide commençant par http:// ou https://." |
| `E-FMT-NAME-SHORT` | "Le nom doit comporter au moins 2 caractères." |
| `E-FMT-NAME-INVALID` | "Le nom ne peut contenir que des lettres, espaces, tirets, apostrophes et points." |
| `E-FMT-MESSAGE-SHORT` | "Votre message doit comporter au moins 10 caractères." |
| `E-FMT-QUANTITY` | "Veuillez saisir une quantité valide (nombre entier entre 1 et 10 000)." |

### 5.3 FILE UPLOAD (FR)

| Error Code | Inline Error (FR) |
|-----------|-------------------|
| `E-FILE-SIZE` | "La taille du fichier dépasse la limite maximale de {SIZE} Mo. Veuillez télécharger un fichier plus petit." |
| `E-FILE-TYPE` | "Type de fichier non pris en charge. Formats acceptés : {TYPES}." |
| `E-FILE-CORRUPT` | "Le fichier semble corrompu. Veuillez télécharger un autre fichier." |
| `E-FILE-COUNT` | "Vous pouvez télécharger au maximum {COUNT} fichier(s)." |
| `E-FILE-EMPTY` | "Le fichier téléchargé est vide. Veuillez sélectionner un fichier valide." |

### 5.4 CAPTCHA & BOT (FR)

| Error Code | Error Message (FR) |
|-----------|-------------------|
| `E-CAPTCHA-FAILED` | "La vérification de sécurité a échoué. Veuillez réessayer." |
| `E-CAPTCHA-EXPIRED` | "La vérification de sécurité a expiré. Veuillez soumettre à nouveau le formulaire." |
| `E-CAPTCHA-NOT-LOADED` | "La vérification de sécurité n'est pas disponible. Veuillez désactiver les bloqueurs de publicité et actualiser la page." |

### 5.5 RATE LIMITING (FR)

| Error Code | Error Message (FR) |
|-----------|-------------------|
| `E-RATE-IP` | "Vous avez soumis trop de formulaires. Veuillez attendre {MINUTES} minutes et réessayer." |
| `E-RATE-SESSION` | "Veuillez patienter avant de soumettre une autre demande." |
| `E-RATE-GLOBAL` | "Nous connaissons un trafic élevé. Veuillez réessayer dans quelques minutes." |

### 5.6 SUBMISSION FAILURES (FR)

| Error Code | Error Message (FR) |
|-----------|-------------------|
| `E-SUBMIT-NETWORK` | "Une erreur réseau s'est produite. Veuillez vérifier votre connexion et réessayer." |
| `E-SUBMIT-SERVER` | "Une erreur est survenue de notre côté. Veuillez réessayer plus tard ou nous contacter à info@simalme.com." |
| `E-SUBMIT-CRM` | "Votre formulaire a été reçu, mais nous rencontrons un retard. Notre équipe vous contactera dans les 24 heures." |
| `E-SUBMIT-TIMEOUT` | "La demande a expiré. Veuillez réessayer. Si le problème persiste, écrivez-nous à info@simalme.com." |

---

## 6. Error Message Library — Russian (RU)

### 6.1 REQUIRED FIELD (RU)

| Field Name | Inline Error (RU) |
|-----------|-------------------|
| Полное имя | "Пожалуйста, введите ваше полное имя." |
| Адрес эл. почты | "Пожалуйста, введите ваш адрес электронной почты." |
| Номер телефона | "Пожалуйста, введите ваш номер телефона." |
| Название компании | "Пожалуйста, введите название вашей компании." |
| Тема | "Пожалуйста, введите тему." |
| Сообщение | "Пожалуйста, введите ваше сообщение." |
| Название продукта | "Пожалуйста, введите название продукта." |
| Количество | "Пожалуйста, введите количество." |
| Страна | "Пожалуйста, выберите вашу страну." |
| Отрасль | "Пожалуйста, выберите вашу отрасль." |
| Торговая лицензия | "Пожалуйста, загрузите вашу торговую лицензию." |
| Резюме | "Пожалуйста, загрузите ваше резюме." |
| Должность | "Пожалуйста, введите должность, на которую вы претендуете." |
| Предпочтительная дата демо | "Пожалуйста, выберите предпочтительную дату." |
| Предпочтительное время демо | "Пожалуйста, выберите предпочтительное время." |
| Модули ERP | "Пожалуйста, выберите хотя бы один модуль." |
| Бренды | "Пожалуйста, выберите хотя бы один бренд." |
| Как вы узнали о нас? | "Пожалуйста, выберите вариант." |
| Условия и положения | "Вы должны согласиться с условиями и положениями." |
| Политика конфиденциальности | "Вы должны согласиться с политикой конфиденциальности." |

### 6.2 FORMAT VALIDATION (RU)

| Error Code | Inline Error (RU) |
|-----------|-------------------|
| `E-FMT-EMAIL` | "Пожалуйста, введите действительный адрес эл. почты (например, name@company.com)." |
| `E-FMT-PHONE` | "Пожалуйста, введите действительный номер телефона с кодом страны (например, +971 4 123 4567)." |
| `E-FMT-PHONE-SHORT` | "Номер телефона слишком короткий. Пожалуйста, укажите код страны." |
| `E-FMT-URL` | "Пожалуйста, введите действительный URL, начинающийся с http:// или https://." |
| `E-FMT-NAME-SHORT` | "Имя должно содержать не менее 2 символов." |
| `E-FMT-NAME-INVALID` | "Имя может содержать только буквы, пробелы, дефисы, апострофы и точки." |
| `E-FMT-MESSAGE-SHORT` | "Ваше сообщение должно содержать не менее 10 символов." |
| `E-FMT-QUANTITY` | "Пожалуйста, введите действительное количество (целое число от 1 до 10 000)." |

### 6.3 FILE UPLOAD (RU)

| Error Code | Inline Error (RU) |
|-----------|-------------------|
| `E-FILE-SIZE` | "Размер файла превышает максимальный лимит {SIZE} МБ. Пожалуйста, загрузите файл меньшего размера." |
| `E-FILE-TYPE` | "Тип файла не поддерживается. Допустимые форматы: {TYPES}." |
| `E-FILE-CORRUPT` | "Файл повреждён. Пожалуйста, загрузите другой файл." |
| `E-FILE-COUNT` | "Вы можете загрузить не более {COUNT} файл(ов)." |
| `E-FILE-EMPTY` | "Загруженный файл пуст. Пожалуйста, выберите действительный файл." |

### 6.4 CAPTCHA & BOT (RU)

| Error Code | Error Message (RU) |
|-----------|-------------------|
| `E-CAPTCHA-FAILED` | "Проверка безопасности не пройдена. Пожалуйста, попробуйте снова." |
| `E-CAPTCHA-EXPIRED` | "Срок действия проверки безопасности истёк. Пожалуйста, отправьте форму снова." |
| `E-CAPTCHA-NOT-LOADED` | "Проверка безопасности недоступна. Пожалуйста, отключите блокировщики рекламы и обновите страницу." |

### 6.5 RATE LIMITING (RU)

| Error Code | Error Message (RU) |
|-----------|-------------------|
| `E-RATE-IP` | "Вы отправили слишком много форм. Пожалуйста, подождите {MINUTES} минут и попробуйте снова." |
| `E-RATE-SESSION` | "Пожалуйста, подождите перед отправкой другого запроса." |
| `E-RATE-GLOBAL` | "Высокая нагрузка. Пожалуйста, попробуйте снова через несколько минут." |

### 6.6 SUBMISSION FAILURES (RU)

| Error Code | Error Message (RU) |
|-----------|-------------------|
| `E-SUBMIT-NETWORK` | "Произошла сетевая ошибка. Пожалуйста, проверьте подключение и попробуйте снова." |
| `E-SUBMIT-SERVER` | "Что-то пошло не так на нашей стороне. Пожалуйста, попробуйте позже или свяжитесь с нами по info@simalme.com." |
| `E-SUBMIT-CRM` | "Ваша форма получена, но возникла задержка. Наша команда свяжется с вами в течение 24 часов." |
| `E-SUBMIT-TIMEOUT` | "Время ожидания истекло. Пожалуйста, попробуйте снова. Если проблема сохраняется, напишите нам на info@simalme.com." |

---

## 7. Summary Banner Messages

The summary banner appears at the top of the form when two or more fields fail validation on submit attempt. It provides a count of errors and a scrollable list.

### 7.1 BANNER COMPONENT STRUCTURE

```html
<div class="form-error-summary" role="alert" aria-live="assertive" id="form-error-summary">
  <div class="form-error-summary__header">
    <svg class="form-error-summary__icon" aria-hidden="true"><!-- alert-triangle icon --></svg>
    <span class="form-error-summary__title" data-i18n="error_summary_title"></span>
  </div>
  <ul class="form-error-summary__list" id="form-error-summary-list"></ul>
</div>
```

### 7.2 BANNER TITLES (Per Language)

| Language | Banner Title |
|----------|-------------|
| **EN** | "There {is/are} {COUNT} {error/errors} on this form. Please correct {it/them} before submitting." |
| **AR** | "يوجد {COUNT} {خطأ/أخطاء} في هذا النموذج. يرجى تصحيح {ه/ها} قبل الإرسال." |
| **FR** | "Il y a {COUNT} {erreur/erreurs} sur ce formulaire. Veuillez {la/les} corriger avant de soumettre." |
| **RU** | "В этой форме {COUNT} {ошибка/ошибки/ошибок}. Пожалуйста, исправьте {её/их} перед отправкой." |

### 7.3 PLURAL LOGIC (JavaScript)

```javascript
function getSummaryTitle(locale, errorCount) {
  const titles = {
    en: {
      singular: `There is 1 error on this form. Please correct it before submitting.`,
      plural:   `There are ${errorCount} errors on this form. Please correct them before submitting.`,
    },
    ar: {
      singular: `يوجد خطأ واحد في هذا النموذج. يرجى تصحيحه قبل الإرسال.`,
      dual:     `يوجد خطآن في هذا النموذج. يرجى تصحيحهما قبل الإرسال.`,
      plural:   `يوجد ${errorCount} أخطاء في هذا النموذج. يرجى تصحيحها قبل الإرسال.`,
    },
    fr: {
      singular: `Il y a 1 erreur sur ce formulaire. Veuillez la corriger avant de soumettre.`,
      plural:   `Il y a ${errorCount} erreurs sur ce formulaire. Veuillez les corriger avant de soumettre.`,
    },
    ru: {
      one:    `В этой форме 1 ошибка. Пожалуйста, исправьте её перед отправкой.`,
      few:    `В этой форме ${errorCount} ошибки. Пожалуйста, исправьте их перед отправкой.`,
      many:   `В этой форме ${errorCount} ошибок. Пожалуйста, исправьте их перед отправкой.`,
    },
  };
  // Russian plural rules: one (1), few (2-4), many (5+)
  // Arabic dual: 2
  if (locale === 'ru') {
    if (errorCount === 1) return titles.ru.one;
    if (errorCount >= 2 && errorCount <= 4) return titles.ru.few;
    return titles.ru.many;
  }
  if (locale === 'ar' && errorCount === 2) return titles.ar.dual;
  const key = errorCount === 1 ? 'singular' : 'plural';
  return titles[locale]?.[key] || titles.en[key];
}
```

---

## 8. Server-Side & API Error Messages

### 8.1 HTTP STATUS CODE MAPPING

| HTTP Status | Meaning | User-Facing Message Pattern |
|-------------|---------|---------------------------|
| `400` | Client validation failed | Return field-level errors array (re-render inline errors) |
| `429` | Rate limited | Show rate limit message with `Retry-After` header value |
| `500` | Internal server error | Generic "Something went wrong" + email fallback |
| `502` | Bad gateway (CRM down) | Soft fail message ("received but delayed") |
| `503` | Service unavailable | "We are performing maintenance. Please try again later." |
| `504` | Gateway timeout (CRM timeout) | Soft fail message + retry suggestion |

### 8.2 API ERROR RESPONSE FORMAT

```json
{
  "success": false,
  "error_code": "VALIDATION_FAILED",
  "message": "One or more fields contain errors.",
  "errors": [
    {
      "field": "email",
      "code": "E-FMT-EMAIL",
      "message_en": "Please enter a valid email address.",
      "message_ar": "يرجى إدخال بريد إلكتروني صحيح.",
      "message_fr": "Veuillez saisir une adresse e-mail valide.",
      "message_ru": "Пожалуйста, введите действительный адрес эл. почты."
    },
    {
      "field": "phone",
      "code": "E-FMT-PHONE",
      "message_en": "Please enter a valid phone number with country code.",
      "message_ar": "يرجى إدخال رقم هاتف صحيح مع رمز الدولة.",
      "message_fr": "Veuillez saisir un numéro de téléphone valide avec l'indicatif du pays.",
      "message_ru": "Пожалуйста, введите действительный номер телефона с кодом страны."
    }
  ],
  "retry_after_seconds": null,
  "submission_id": null
}
```

---

## 9. Form-Specific Validation Rules

### 9.1 CONTACT FORM — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| `category` dropdown | Must not be "-- Select --" default | "Please select a category for your enquiry." |
| `message` length | 10–5000 chars | EN: "Your message must be between 10 and 5,000 characters." |
| `phone` UAE format (optional strict) | If UAE country selected, optionally match `/^\+971[\s\-]?[45]\d[\s\-]?\d{7}$/` | "Please enter a valid UAE phone number (e.g., +971 4 123 4567)." |

### 9.2 RFQ / QUOTE FORM — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| At least 1 product row | `productRows.length >= 1` | "Please add at least one product to your quote request." |
| Product name autocomplete | Must match a valid SKU from catalog | "Please select a product from the suggestions." |
| `quantity` per row | Integer, 1–10000 | "Quantity must be between 1 and 10,000." |
| Max 20 product rows | `productRows.length <= 20` | "You can request a maximum of 20 products. For larger orders, please email info@simalme.com." |

### 9.3 DEMO REQUEST FORM — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| At least 1 module selected | `modules.length >= 1` | "Please select at least one ERP module you are interested in." |
| `preferred_date` | Must be ≥ tomorrow and ≤ 60 days from now | "Please select a date within the next 60 days (excluding today)." |
| `preferred_date` | Must not be Friday or Saturday | "Demonstrations are available Sunday–Thursday only. Please select a weekday." |
| `preferred_time` | Must be between 09:00–16:00 GST | "Demonstrations are available between 9:00 AM and 4:00 PM Gulf Standard Time." |
| `company_size` dropdown | Must not be default | "Please select your company size." |

### 9.4 NEWSLETTER FORM — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| `email` uniqueness | Server-side check against Mailchimp | "This email address is already subscribed. Thank you!" (non-blocking info) |
| Language preference | Must select at least 1 | "Please select at least one language preference." |

### 9.5 PARTNER APPLICATION — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| Trade license file type | `.pdf`, `.jpg`, `.jpeg`, `.png` | "Trade license must be a PDF, JPG, or PNG file." |
| Trade license file size | ≤ 10 MB | "Trade license file must be less than 10 MB." |
| At least 1 brand of interest | `brands.length >= 1` | "Please select at least one brand you wish to distribute." |
| `website_url` format | Must start with http:// or https:// | "Please enter a valid website URL." |
| Terms agreement | Checkbox checked | "You must agree to the Partner Program Terms & Conditions." |

### 9.6 JOB APPLICATION — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| CV file type | `.pdf`, `.doc`, `.docx` | "CV must be a PDF or Microsoft Word document." |
| CV file size | ≤ 5 MB | "CV file must be less than 5 MB." |
| `salary_expectation` | Numeric, optional | "Please enter a valid amount (numbers only)." |
| `years_experience` | Integer, 0–50 | "Please enter valid years of experience." |
| `notice_period_days` | Integer, 0–180 | "Please enter a valid notice period in days." |

### 9.7 SUPPORT TICKET — Additional Rules

| Rule | Constraint | Error Message (EN) |
|------|-----------|-------------------|
| At least 1 attachment (optional but validated) | File ≤ 20 MB, accepted types | "Attachment must be less than 20 MB. Accepted: PDF, JPG, PNG, XLSX, CSV, ZIP." |
| `severity` dropdown | Must not be default | "Please select the severity level." |
| `product_serial` format | Optional, alphanumeric 5–30 chars | "Please enter a valid serial number." |

---

## 10. JavaScript Validation Implementation

### 10.1 CORE VALIDATION MODULE

```javascript
// validation-engine.js — Simal Technologies Form Validation
// Supports: EN, AR, FR, RU | RTL-aware | reCAPTCHA v3 | Honeypot

const SimalValidation = (function() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    reCaptchaSiteKey: '6Lc...SIMAL_SITE_KEY',
    reCaptchaThreshold: 0.5,
    rateLimitMax: 3,          // submissions per window
    rateLimitWindowMs: 300000, // 5 minutes
    requestTimeoutMs: 30000,   // 30 seconds
    fileSizeLimits: {
      trade_license: 10 * 1024 * 1024,  // 10 MB
      cv_resume: 5 * 1024 * 1024,       // 5 MB
      attachment: 20 * 1024 * 1024,     // 20 MB
    },
    fileTypes: {
      trade_license: ['application/pdf', 'image/jpeg', 'image/png'],
      cv_resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      attachment: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/zip'],
    },
  };

  // ===== ERROR MESSAGE STORE =====
  const ERRORS = {
    en: { /* populated from Section 3 above */ },
    ar: { /* populated from Section 4 above */ },
    fr: { /* populated from Section 5 above */ },
    ru: { /* populated from Section 6 above */ },
  };

  function getCurrentLocale() {
    return document.documentElement.lang?.substring(0, 2) || 'en';
  }

  function getErrorMessage(code, locale, params = {}) {
    const msgs = ERRORS[locale] || ERRORS.en;
    let msg = msgs[code] || msgs[code] || 'Validation error.';
    // Replace template params: {SIZE}, {TYPES}, {COUNT}, {MINUTES}
    Object.keys(params).forEach(key => {
      msg = msg.replace(`{${key}}`, params[key]);
    });
    return msg;
  }

  // ===== FIELD VALIDATORS =====
  function validateRequired(value, fieldName, locale) {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        code: 'E-REQUIRED',
        message: getErrorMessage(`required.${fieldName}`, locale),
      };
    }
    return { valid: true };
  }

  function validateEmail(value, locale) {
    if (!value || value.trim() === '') {
      return { valid: false, code: 'E-REQUIRED', message: getErrorMessage('required.email', locale) };
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!pattern.test(value.trim())) {
      return { valid: false, code: 'E-FMT-EMAIL', message: getErrorMessage('fmt.email', locale) };
    }
    if (value.length > 254) {
      return { valid: false, code: 'E-FMT-EMAIL', message: getErrorMessage('fmt.email', locale) };
    }
    return { valid: true };
  }

  function validatePhone(value, locale, country = null) {
    if (!value || value.trim() === '') {
      return { valid: false, code: 'E-REQUIRED', message: getErrorMessage('required.phone', locale) };
    }
    const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.length < 7) {
      return { valid: false, code: 'E-FMT-PHONE-SHORT', message: getErrorMessage('fmt.phone_short', locale) };
    }
    const pattern = /^[\+\d][\d\s\-\(\)\.]{6,20}$/;
    if (!pattern.test(value.trim())) {
      return { valid: false, code: 'E-FMT-PHONE', message: getErrorMessage('fmt.phone', locale) };
    }
    return { valid: true };
  }

  function validateFile(file, fieldType, locale) {
    if (!file) {
      return {
        valid: false,
        code: 'E-FILE-EMPTY',
        message: getErrorMessage(`file.${fieldType}.empty`, locale) || getErrorMessage('file.empty', locale),
      };
    }

    // Size check
    const maxSize = CONFIG.fileSizeLimits[fieldType];
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        code: 'E-FILE-SIZE',
        message: getErrorMessage('file.size', locale, { SIZE: maxSize / (1024 * 1024) }),
      };
    }

    // Type check
    const allowedTypes = CONFIG.fileTypes[fieldType];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const typeLabels = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
      return {
        valid: false,
        code: 'E-FILE-TYPE',
        message: getErrorMessage('file.type', locale, { TYPES: typeLabels }),
      };
    }

    return { valid: true };
  }

  // ===== FORM VALIDATION ENGINE =====
  function validateForm(formElement, rules, locale) {
    const errors = [];
    const fields = formElement.querySelectorAll('[data-validate]');

    fields.forEach(field => {
      const fieldName = field.getAttribute('data-validate');
      const value = field.type === 'file' ? field.files[0] : field.value;
      const fieldRules = rules[fieldName] || {};

      // Required check
      if (fieldRules.required) {
        const result = validateRequired(value, fieldName, locale);
        if (!result.valid) {
          errors.push({ field: fieldName, ...result });
          return; // Skip further checks if required fails
        }
      }

      // Skip other checks if empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) return;

      // Email check
      if (fieldRules.email) {
        const result = validateEmail(value, locale);
        if (!result.valid) errors.push({ field: fieldName, ...result });
      }

      // Phone check
      if (fieldRules.phone) {
        const result = validatePhone(value, locale);
        if (!result.valid) errors.push({ field: fieldName, ...result });
      }

      // File check
      if (fieldRules.fileType) {
        const result = validateFile(value, fieldRules.fileType, locale);
        if (!result.valid) errors.push({ field: fieldName, ...result });
      }

      // Min/max length
      if (fieldRules.minlength && value.length < fieldRules.minlength) {
        errors.push({
          field: fieldName,
          code: 'E-FMT-MINLENGTH',
          message: getErrorMessage(`fmt.${fieldName}.short`, locale) || `Must be at least ${fieldRules.minlength} characters.`,
        });
      }

      // Pattern check
      if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
        errors.push({
          field: fieldName,
          code: 'E-FMT-INVALID',
          message: getErrorMessage(`fmt.${fieldName}.invalid`, locale) || 'Invalid format.',
        });
      }
    });

    return errors;
  }

  // ===== UI RENDERERS =====
  function showFieldError(fieldElement, message) {
    const formGroup = fieldElement.closest('.form-group');
    if (!formGroup) return;

    // Add error class
    formGroup.classList.add('has-error');
    fieldElement.setAttribute('aria-invalid', 'true');

    // Create/replace error message element
    let errorEl = formGroup.querySelector('.form-error-message');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error-message';
      errorEl.setAttribute('role', 'alert');
      formGroup.appendChild(errorEl);
    }
    errorEl.textContent = message;

    // Set aria-describedby
    const errorId = `${fieldElement.id}-error`;
    errorEl.id = errorId;
    fieldElement.setAttribute('aria-describedby', errorId);
  }

  function clearFieldError(fieldElement) {
    const formGroup = fieldElement.closest('.form-group');
    if (!formGroup) return;
    formGroup.classList.remove('has-error');
    fieldElement.removeAttribute('aria-invalid');
    fieldElement.removeAttribute('aria-describedby');
    const errorEl = formGroup.querySelector('.form-error-message');
    if (errorEl) errorEl.remove();
  }

  function clearAllErrors(formElement) {
    formElement.querySelectorAll('.has-error').forEach(group => {
      group.classList.remove('has-error');
    });
    formElement.querySelectorAll('.form-error-message').forEach(el => el.remove());
    formElement.querySelectorAll('[aria-invalid]').forEach(el => {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
    const summary = document.getElementById('form-error-summary');
    if (summary) summary.style.display = 'none';
  }

  function showSummaryBanner(formElement, errors, locale) {
    const summary = document.getElementById('form-error-summary');
    if (!summary) return;

    const count = errors.length;
    const title = getSummaryTitle(locale, count);
    summary.querySelector('.form-error-summary__title').textContent = title;

    const list = summary.querySelector('.form-error-summary__list');
    list.innerHTML = '';
    errors.forEach(error => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${error.field}`;
      a.textContent = error.message;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const field = document.getElementById(error.field) || document.querySelector(`[name="${error.field}"]`);
        if (field) field.focus();
      });
      li.appendChild(a);
      list.appendChild(li);
    });

    summary.style.display = 'block';
    summary.focus();
  }

  function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `form-toast form-toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('form-toast--fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 8000);
  }

  // ===== PUBLIC API =====
  return {
    validateForm,
    showFieldError,
    clearFieldError,
    clearAllErrors,
    showSummaryBanner,
    showToast,
    getCurrentLocale,
    CONFIG,
  };
})();
```

### 10.2 USAGE EXAMPLE — CONTACT FORM

```javascript
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const locale = SimalValidation.getCurrentLocale();
  SimalValidation.clearAllErrors(this);

  const rules = {
    full_name: { required: true, minlength: 2, maxlength: 100, pattern: /^[\p{L}\s\-'\.]{2,100}$/u },
    email: { required: true, email: true },
    phone: { required: true, phone: true },
    company_name: { required: false, maxlength: 200 },
    category: { required: true },
    subject: { required: true, minlength: 3, maxlength: 200 },
    message: { required: true, minlength: 10, maxlength: 5000 },
    privacy_policy: { required: true },
  };

  const errors = SimalValidation.validateForm(this, rules, locale);

  if (errors.length > 0) {
    errors.forEach(e => {
      const field = this.querySelector(`[data-validate="${e.field}"]`);
      if (field) SimalValidation.showFieldError(field, e.message);
    });

    if (errors.length >= 2) {
      SimalValidation.showSummaryBanner(this, errors, locale);
    }

    // Focus first error field
    const firstField = this.querySelector(`[data-validate="${errors[0].field}"]`);
    if (firstField) firstField.focus();

    // GA4 tracking
    if (typeof gtag === 'function') {
      gtag('event', 'form_validation_error', {
        form_id: 'contact',
        error_count: errors.length,
        error_codes: errors.map(e => e.code).join(','),
        language: locale,
      });
    }
    return;
  }

  // All clear — proceed with reCAPTCHA & submit...
});
```

---

## 11. CSS Error Display Patterns

```css
/* ===== INLINE FIELD ERROR ===== */
.form-group.has-error .form-control,
.form-group.has-error .form-select,
.form-group.has-error .form-textarea {
  border-color: #DC3545;
  border-width: 2px;
  background-color: #FFF5F5;
}

.form-group.has-error .form-control:focus,
.form-group.has-error .form-select:focus,
.form-group.has-error .form-textarea:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  border-color: #DC3545;
}

.form-group.has-error label {
  color: #DC3545;
}

.form-error-message {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.8125rem;
  color: #DC3545;
  line-height: 1.4;
}

.form-error-message::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23DC3545'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E");
  background-size: contain;
}

/* RTL support */
[dir="rtl"] .form-error-message {
  text-align: right;
}

/* ===== SUMMARY BANNER ===== */
.form-error-summary {
  display: none;
  background-color: #FFF5F5;
  border: 2px solid #DC3545;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.form-error-summary__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.form-error-summary__icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.form-error-summary__title {
  font-weight: 600;
  font-size: 1rem;
  color: #DC3545;
}

.form-error-summary__list {
  margin: 0;
  padding-left: 24px;
  list-style-type: disc;
  color: #DC3545;
}

.form-error-summary__list li {
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.form-error-summary__list a {
  color: #DC3545;
  text-decoration: underline;
  cursor: pointer;
}

.form-error-summary__list a:hover {
  color: #A71D2A;
  text-decoration: none;
}

[dir="rtl"] .form-error-summary__list {
  padding-left: 0;
  padding-right: 24px;
}

/* ===== SUCCESS STATE (for context) ===== */
.form-group.has-success .form-control {
  border-color: #28A745;
}

.form-group.has-success .form-success-message {
  color: #28A745;
  font-size: 0.8125rem;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===== TOAST NOTIFICATIONS ===== */
.form-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 420px;
  padding: 14px 20px;
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 99999;
  animation: form-toast-slide-in 0.3s ease;
}

.form-toast--error {
  background-color: #DC3545;
}

.form-toast--success {
  background-color: #28A745;
}

.form-toast--warning {
  background-color: #FFC107;
  color: #212529;
}

.form-toast--fade-out {
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes form-toast-slide-in {
  from { transform: translateY(-20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

[dir="rtl"] .form-toast {
  right: auto;
  left: 20px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 576px) {
  .form-toast {
    left: 16px;
    right: 16px;
    max-width: none;
  }

  .form-error-summary {
    padding: 12px 14px;
  }
}
```

---

## 12. Accessibility (a11y) Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Color not sole indicator** | Error states include icon + text message (not just red border) |
| **`aria-invalid`** | Set to `"true"` on invalid fields, removed on correction |
| **`aria-describedby`** | Links field to its error message element via ID reference |
| **`role="alert"`** | Applied to inline error messages for screen reader announcements |
| **`aria-live="assertive"`** | Applied to summary banner for immediate screen reader notification |
| **Focus management** | First invalid field receives focus after validation; summary banner receives focus when displayed |
| **Keyboard navigation** | Summary banner error links are keyboard-focusable and activate on Enter |
| **WCAG 2.1 AA compliance** | Contrast ratio ≥ 4.5:1 for error text (#DC3545 on #FFF5F5 = 4.64:1 ✓) |
| **RTL screen readers** | Arabic error messages tested with NVDA Arabic voice; `dir="rtl"` + `lang="ar"` set correctly |

---

## 13. Analytics & Error Tracking

### 13.1 GA4 EVENT: `form_validation_error`

```javascript
// Fires when client-side validation blocks form submission
gtag('event', 'form_validation_error', {
  form_id: 'rfq',           // contact | rfq | demo | newsletter | partner | job | support
  error_count: 4,           // Number of fields with errors
  error_codes: 'E-FMT-EMAIL,E-FMT-PHONE,E-REQUIRED,E-FILE-SIZE',
  language: 'en',           // en | ar | fr | ru
  page_path: '/products/hikvision-ds-2cd2143g2-i/',
});
```

### 13.2 GA4 EVENT: `form_server_error`

```javascript
// Fires when server returns a non-success response
gtag('event', 'form_server_error', {
  form_id: 'demo',
  http_status: 429,
  error_code: 'E-RATE-IP',
  language: 'en',
});
```

### 13.3 HubSpot CRM Error Fallback

When HubSpot API fails, the form data is stored in a local queue and retried 3 times with exponential backoff (1 min, 5 min, 15 min). If all retries fail, an admin email alert is sent to `webmaster@simalme.com`.

---

## Cross-Reference

| Related Document | File |
|-----------------|------|
| Contact Form Config | [01_Contact_Form_Configuration.md](./01_Contact_Form_Configuration.md) |
| RFQ/Quote Form | [02_RFQ_Request_Quote_Form.md](./02_RFQ_Request_Quote_Form.md) |
| Demo Request Form | [03_Demo_Request_Form.md](./03_Demo_Request_Form.md) |
| Newsletter Signup | [04_Newsletter_Signup_Form.md](./04_Newsletter_Signup_Form.md) |
| Partner Application | [05_Partner_Reseller_Application_Form.md](./05_Partner_Reseller_Application_Form.md) |
| Job Application | [06_Job_Application_Form.md](./06_Job_Application_Form.md) |
| Support Ticket | [07_Support_Ticket_Form_B2B.md](./07_Support_Ticket_Form_B2B.md) |
| GA4 Event Schema | [../20_Analytics_Tracking/01_GA4_Event_Schema.md](../20_Analytics_Tracking/01_GA4_Event_Schema.md) |
| GTM Container Config | [../20_Analytics_Tracking/02_GTM_Container_Configuration.md](../20_Analytics_Tracking/02_GTM_Container_Configuration.md) |

---

*Simal Technologies Middle East LLC — Form Validation Error Content — CONFIDENTIAL*