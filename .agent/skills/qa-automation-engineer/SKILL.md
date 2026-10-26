---
name: qa-automation-engineer
description: Guides quality assurance, automated unit/integration testing, RLS policy verification, financial calculation checks, responsive UI checks, and regression protection for Lawyers Nexus. Use whenever adding tests, verifying features, or running QA audits.
---

# QA & Test Automation Engineer

## Purpose

Act as a QA & Test Automation Engineer guiding quality assurance, test coverage, and regression protection for the Lawyers Nexus Academy Management and Content Operations system.

Cover:
- Static code quality & TypeScript checks
- Unit and validation tests
- Database constraint & RLS policy verification
- Authentication and role-permission matrices
- Financial calculation accuracy
- Responsive UI & accessibility verification
- Regression protection

---

## Static Quality & Verification Standards

Always require:
1. `npx tsc --noEmit` (0 type errors).
2. `npm run lint` (0 lint warnings or errors).
3. `npm run build` (0 build errors across all static/dynamic routes & middleware).

Inspect for:
- Usage of `any`, `@ts-ignore`, or `@ts-nocheck`.
- Unhandled promise rejections or console errors.
- Exposed secrets or keys in client bundles.
- React hydration mismatches or redirect loops.

---

## Authentication & Role Test Matrix

| Role / Identity | Default Route | Academy Routes | Content Routes | Super Admin Accounts |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | Redirect to `/login` | Denied | Denied | Denied |
| **super_admin** | `/workspace-selection` | Allowed | Allowed | Allowed |
| **academy_admin** | `/dashboard` | Allowed | Denied | Denied |
| **content_admin** | `/content/dashboard` | Denied | Allowed | Denied |
| **Inactive Account** | Sign out -> `/login?error=account_disabled` | Denied | Denied | Denied |

Test both:
- User-interface navigation
- Direct URL access / Route Handler verification
- Row-Level Security (RLS) policies

---

## Test Coverage Specifications

### 1. Academy Management:
- Level creation & dynamic module additions.
- Module fee updates & fee history creation.
- Student enrollment with roll number generation (`LN26-001`).
- Module selection, fixed PKR discount calculation, final fee formula.
- Immutable roll numbers during level promotions.
- Fee voucher issuance, partial payment, full payment, payment reversal.
- Calculated views: `academy_current_enrollment_view`, `academy_past_students_view`, `academy_pending_fees_view`.

### 2. Content Operations:
- Assignment creation with reference number (`CW-2026-001`).
- Direct University and Module text inputs.
- Writer name & email fields.
- Client name (without client email).
- Target date & 12-hour time format.
- Status history logging.
- Voucher generation, partial/full payment, payment reversal.
- Derived payment status (`Unpaid`, `Partially Paid`, `Paid`).
- File metadata & drive folder name matching work reference.

---

## Financial Calculation Testing

Verify exact assertions for:
- Zero payment
- Partial payment
- Exact full payment
- Overpayment prevention
- Reversed payment (payment subtracted from total collected)
- Enrollment fixed discount subtraction
- Decimal currency formatting in `PKR` (`NUMERIC(12,2)`)
- Non-negative monetary check constraints

---

## Responsive & Accessibility Verification

Test UI viewports: `1440px`, `1280px`, `1024px`, `768px`, `430px`, `390px`, `360px`.

Verify:
- No page-level horizontal scrollbar.
- Responsive mobile navigation and sidebar toggle.
- Table internal horizontal scrolling on small screens.
- Form inputs expand to full container width (`w-full min-w-0`).
- Dialog positioning & focus trapping.
- Contrast compliance and keyboard navigation.

---

## Defect Reporting Format

When reporting bugs or defects, provide:
1. **Title & Severity** (`Critical`, `High`, `Medium`, `Low`).
2. **Affected Route & Role Used**.
3. **Steps to Reproduce**.
4. **Expected vs. Actual Result**.
5. **Console / Log Evidence**.
6. **Suggested Remediation**.
