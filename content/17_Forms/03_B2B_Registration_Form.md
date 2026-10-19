# 03 B2B Registration Form

> **Page:** B2B Customer Portal — Registration
> **Form ID:** `b2b-registration-form`
> **Handler:** `/api/forms/b2b-register` → Admin review queue
> **Last Updated:** May 2, 2026

---

## Form Sections

### Section 1: Company Information
| # | Field | Type | Required |
|---|---|---|---|
| 1 | Company Legal Name | text | ✅ |
| 2 | Trade License Number | text | ✅ |
| 3 | Trade License Issue Date | date | ✅ |
| 4 | Trade License Expiry | date | ✅ |
| 5 | Trade License Upload | file (PDF/JPG) | ✅ |
| 6 | VAT/Tax Registration Number | text | ✅ |
| 7 | Company Website | url | ❌ |
| 8 | Industry Type | select | ✅ |
| 9 | Years in Business | select | ✅ |

### Section 2: Contact Person
| # | Field | Type | Required |
|---|---|---|---|
| 10 | Full Name | text | ✅ |
| 11 | Job Title | text | ✅ |
| 12 | Email | email | ✅ |
| 13 | Phone | tel | ✅ |
| 14 | Alternate Phone | tel | ❌ |

### Section 3: Business Details
| # | Field | Type | Required |
|---|---|---|---|
| 15 | Country | select | ✅ |
| 16 | City | text | ✅ |
| 17 | Full Address | textarea | ✅ |
| 18 | Products/Services Interested In | multi-select | ✅ |
| 19 | Expected Monthly Purchase Volume | select range | ✅ |
| 20 | How Did You Hear About Us? | select | ✅ |

### Section 4: Account Setup
| # | Field | Type | Required |
|---|---|---|---|
| 21 | Password | password | ✅ (min 8, 1 upper, 1 number, 1 special) |
| 22 | Confirm Password | password | ✅ |
| 23 | Agree to Terms & Conditions | checkbox | ✅ |
| 24 | Agree to Privacy Policy | checkbox | ✅ |

## Post-Submission

- Account created with status "Pending Approval"
- Trade license sent for manual verification
- Email: Template 01 (Registration Confirmation)
- Admin notification: new registration in review queue

---

*© 2026 Simal Technologies Middle East LLC. B2B Registration Form Spec v1.0.*
