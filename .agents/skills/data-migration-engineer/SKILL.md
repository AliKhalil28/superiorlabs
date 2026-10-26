---
name: data-migration-engineer
description: Guides the controlled, module-by-module transition from frontend mock data to live Supabase PostgreSQL tables. Use whenever planning, executing, or verifying mock data replacements and data cleaning scripts.
---

# Data Migration Engineer

## Purpose

Act as a Data Migration Engineer guiding the controlled transition from frontend mock data to live Supabase PostgreSQL tables for Lawyers Nexus.

Support:
- Mock data inventory & source-to-target mapping
- Data cleaning & normalization
- Referential integrity enforcement
- Idempotent import scripts
- Financial reconciliation & verification
- Controlled module-by-module cutover
- Safe removal of obsolete frontend mock files

---

## Approved Migration Order

Perform backend data transitions in strict incremental order:
1. System Settings & Default Config (`system_settings`)
2. Academic Levels (`academy_levels`)
3. Dynamic Modules (`academy_modules`) & Fee History (`academy_module_fee_history`)
4. Student Master Records (`academy_students`)
5. Enrollments (`academy_enrollments`) & Enrollment Modules (`academy_enrollment_modules`)
6. Level Promotions (`academy_promotions`)
7. Fee Vouchers (`academy_fee_vouchers`) & Voucher Items (`academy_fee_voucher_items`)
8. Fee Payments (`academy_fee_payments`)
9. Content Work Assignments (`content_work_assignments`) & Status History (`content_work_status_history`)
10. Content Vouchers (`content_vouchers`) & Items (`content_voucher_items`)
11. Content Payments (`content_payments`)
12. Content Work Files Metadata (`content_work_files`) & Drive Folders (`content_work_drive_folders`)
13. Replace UI page mock calls with live database queries / server actions
14. Safe removal of obsolete mock datasets

---

## Source-to-Target Mapping Rules

| Frontend Property | Target Database Column | Notes |
| :--- | :--- | :--- |
| `student.id` | `academy_students.id` | Remapped to valid UUID |
| `rollNumber` | `academy_students.roll_number` | Preserved (`LN26-001`) |
| `student.email` | `academy_students.email` | Trimmed & lowercased |
| `levelId` | `academy_enrollments.level_id` | Mapped to `academy_levels.id` |
| `amountPaid` | Derived View | Calculated from `academy_fee_payments` / `content_payments` |
| `paymentStatus` | Derived View | Calculated status (`Unpaid`, `Partially Paid`, `Paid`) |
| `work.referenceNumber` | `content_work_assignments.reference_number` | Preserved (`CW-2026-001`), equals `drive_folder_name` |

---

## Financial Reconciliation Requirements

For every imported module, reconcile:
- Subtotals, discounts, and final fees.
- Total payments collected vs. remaining balances.
- Compare:
  1. Source mock total
  2. Database transactional table sum
  3. Database calculated read view result
- Any discrepancy must be resolved before finalizing cutover.

---

## Quality Gates

Before declaring a data migration step complete:
- Run dry-run import scripts locally.
- Verify zero duplicate primary keys or reference collisions.
- Confirm RLS policies permit valid queries for authorized roles.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
