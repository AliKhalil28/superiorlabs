---
name: postgresql-dba-rls-specialist
description: Guides database schema design, PostgreSQL SQL migrations, constraints, indexing, triggers, functions, calculated views, and Row-Level Security (RLS) policies for Lawyers Nexus. Use whenever creating or modifying Supabase database tables, schema migrations, or RLS policies.
---

# PostgreSQL DBA & RLS Specialist

## Purpose

Act as a PostgreSQL DBA and Row-Level Security (RLS) Specialist for the Lawyers Nexus Academy Management and Content Operations system.

Treat SQL migrations in `supabase/migrations/` as the single source of truth for the database schema.

---

## Primary Responsibilities

1. Review entity specifications before changing schema.
2. Inspect migration history (`supabase/migrations/`).
3. **NEVER edit an already-applied production migration**. Create a new timestamped migration for schema changes.
4. Use explicit check constraints and foreign keys with appropriate `ON DELETE` rules.
5. Use proper PostgreSQL data types:
   - Primary Keys: `UUID` with `gen_random_uuid()`
   - Date-Time: `TIMESTAMPTZ` (UTC)
   - Date-Only: `DATE`
   - Currency/Money: `NUMERIC(12,2)`
   - File Bytes: `BIGINT`
   - Structured Config/Snapshots: `JSONB`
   - Enums: Controlled PostgreSQL ENUMs
6. Create only high-value, targeted indexes (avoid duplicate indexes covered by UNIQUE constraints).
7. Avoid storing duplicated totals; use derived PostgreSQL views (`CREATE VIEW`).
8. Implement concurrent-safe reference generators via PostgreSQL sequences.
9. Add reusable trigger functions (e.g. `updated_at`, status audit tracking, module fee history).
10. Store private structures outside browser-exposed public schemas (`CREATE SCHEMA private;`).
11. Enable and strictly test RLS policies for all exposed tables.
12. Avoid recursive RLS policies by using `SECURITY DEFINER` helper functions with an explicit `SET search_path = public`.
13. Generate updated database TypeScript types (`src/types/database.types.ts`) after schema changes.

---

## Data Type & Schema Rules

### Approved Data Types:
- `UUID`: Primary keys (`gen_random_uuid()`).
- `TIMESTAMPTZ`: All timestamps stored in UTC.
- `DATE`: Admission dates, issue dates, due dates, exit dates.
- `NUMERIC(12,2)`: All monetary values in `PKR`.
- `BIGINT`: File sizes in bytes.
- `JSONB`: Audit log values, report snapshot payloads, system setting values.
- `ENUM`: `app_user_role`, `voucher_status`, `payment_method`, `content_work_status`, etc.

### Prohibited Data Types:
- `FLOAT` or `REAL` for financial money values.
- Local timestamps without timezone (`TIMESTAMP`).
- Serial IDs when UUIDs are specified.
- Arbitrary untyped `VARCHAR` lengths.

---

## Domain Entity Design Rules

### Academy Management Domain:
- Levels and Modules are dynamic. Default module fee: `40000.00 PKR`.
- Changing a module fee creates a record in `academy_module_fee_history`.
- Enrollment module selections store immutable `fee_snapshot` values.
- Student `roll_number` is immutable (`LN26-001`).
- Promotion creates a new enrollment; a student has at most 1 active enrollment.
- Discounts are fixed PKR amounts (`discount_amount`).
- Fee payments are reversed (`status = 'reversed'`), never physically deleted.

### Content Operations Domain:
- University (`university_name`) and Module (`module_name`) are direct text fields.
- Writer name (`writer_name`) and email (`writer_email`) are stored on work assignments.
- No client email field.
- Work reference (`reference_number`) format: `CW-2026-001` (immutable, equal to `drive_folder_name`).
- Amount paid and payment status are derived from completed payment records.
- Google Drive metadata stored in `public.content_work_drive_folders` and `public.content_work_files`.

---

## Row-Level Security (RLS) Policy Architecture

- RLS must be enabled on every table in `public` and `private` schemas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- Anonymous access is DENIED by default on all application tables.
- Role resolution helper function:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_auth_user_role()
  RETURNS app_user_role AS $$
  DECLARE
    user_role app_user_role;
  BEGIN
    SELECT role INTO user_role
    FROM public.app_users
    WHERE auth_user_id = auth.uid() AND is_active = true;

    RETURN user_role;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  ```

### Role Access Policies:
- `super_admin`: Full access across both workspaces (`academy_*`, `content_*`, `app_users`, `audit_logs`, `system_settings`, `report_snapshots`).
- `academy_admin`: Full access to `academy_*` tables and Academy settings/reports. Zero access to Content Operations tables.
- `content_admin`: Full access to `content_*` tables and Content settings/reports. Zero access to Academy tables.
- `private` schema tables (`private.auth_verification_codes`, `private.google_drive_connections`) are restricted from direct browser Data API access (`FALSE` policy for authenticated users unless executed via server-side admin client).

---

## Migration Best Practices

- Generate timestamped migrations using Supabase CLI:
  ```bash
  npx supabase migration new <migration_name>
  ```
- Migrations must be deterministic, schema-qualified (`public.` or `private.`), and idempotent.
- Do NOT include secrets or environment keys inside SQL migrations.
- Test migrations locally with `npm run db:reset` or `npx supabase db reset`.

---

## Quality Gates

Before declaring any database task complete, run and report:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
