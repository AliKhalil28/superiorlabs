const { Client } = require('pg');

async function migrateTeacherColumn() {
  const client = new Client({
    connectionString: 'postgresql://postgres.tdrjyqnmwwycnhvblihw:SuperiorLabs3334@aws-0-eu-west-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to PostgreSQL database');

  // 1. Add teacher_name to subjects table if not exists
  await client.query(`
    ALTER TABLE public.subjects 
    ADD COLUMN IF NOT EXISTS teacher_name TEXT;
  `);
  console.log('Added teacher_name column to public.subjects');

  // 2. Drop dependent views and recreate with teacher_name
  await client.query(`
    DROP VIEW IF EXISTS public.college_dashboard_metrics_view CASCADE;
    DROP VIEW IF EXISTS public.academic_group_summary_view CASCADE;
    DROP VIEW IF EXISTS public.subject_summary_view CASCADE;
  `);

  await client.query(`
    CREATE OR REPLACE VIEW public.subject_summary_view AS
    SELECT 
        s.id AS subject_id,
        s.drive_folder_id,
        s.name AS subject_name,
        s.teacher_name,
        s.academic_group_id,
        ag.name AS academic_group_name,
        s.expected_practicals,
        COALESCE(COUNT(DISTINCT pf.id), 0) AS practical_folders_detected,
        LEAST(s.expected_practicals, COALESCE(COUNT(DISTINCT pf.id), 0)) AS practical_folders_capped,
        GREATEST(0, s.expected_practicals - COALESCE(COUNT(DISTINCT pf.id), 0)) AS missing_practical_folders,
        COALESCE(COUNT(DISTINCT pf.id) FILTER (WHERE pfs.submission_file_count > 0), 0) AS populated_practical_folders,
        COALESCE(COUNT(DISTINCT pf.id) FILTER (WHERE pfs.submission_file_count = 0 OR pfs.submission_file_count IS NULL), 0) AS empty_practical_folders,
        COALESCE(SUM(pfs.submission_file_count), 0)::BIGINT AS total_submission_files,
        ROUND((LEAST(s.expected_practicals, COALESCE(COUNT(DISTINCT pf.id), 0))::NUMERIC / s.expected_practicals::NUMERIC) * 100, 1) AS folder_coverage_percentage,
        ROUND((LEAST(s.expected_practicals, COALESCE(COUNT(DISTINCT pf.id) FILTER (WHERE pfs.submission_file_count > 0), 0))::NUMERIC / s.expected_practicals::NUMERIC) * 100, 1) AS submission_coverage_percentage
    FROM public.subjects s
    LEFT JOIN public.academic_groups ag ON ag.id = s.academic_group_id
    LEFT JOIN public.practical_folders pf ON pf.subject_id = s.id
    LEFT JOIN public.practical_folder_summary_view pfs ON pfs.practical_folder_id = pf.id
    GROUP BY s.id, s.drive_folder_id, s.name, s.teacher_name, s.academic_group_id, ag.name, s.expected_practicals;
  `);
  console.log('Recreated public.subject_summary_view with teacher_name');

  await client.query(`
    CREATE OR REPLACE VIEW public.academic_group_summary_view AS
    SELECT 
        ag.id AS academic_group_id,
        ag.drive_folder_id,
        ag.name AS academic_group_name,
        ag.parent_group_id,
        COUNT(DISTINCT s.id) AS total_subjects,
        COALESCE(SUM(s.expected_practicals), 0)::INTEGER AS total_expected_practicals,
        COALESCE(SUM(ssv.practical_folders_detected), 0)::INTEGER AS total_practical_folders_detected,
        COALESCE(SUM(ssv.populated_practical_folders), 0)::INTEGER AS total_populated_practical_folders,
        COALESCE(SUM(ssv.empty_practical_folders), 0)::INTEGER AS total_empty_practical_folders,
        COALESCE(SUM(ssv.missing_practical_folders), 0)::INTEGER AS total_missing_practical_folders,
        COALESCE(SUM(ssv.total_submission_files), 0)::BIGINT AS total_submission_files,
        CASE 
            WHEN SUM(s.expected_practicals) > 0 THEN 
                ROUND((SUM(ssv.practical_folders_capped)::NUMERIC / SUM(s.expected_practicals)::NUMERIC) * 100, 1)
            ELSE 0.0
        END AS overall_folder_coverage_percentage,
        CASE 
            WHEN SUM(s.expected_practicals) > 0 THEN 
                ROUND((SUM(ssv.populated_practical_folders)::NUMERIC / SUM(s.expected_practicals)::NUMERIC) * 100, 1)
            ELSE 0.0
        END AS overall_submission_coverage_percentage
    FROM public.academic_groups ag
    LEFT JOIN public.subjects s ON s.academic_group_id = ag.id
    LEFT JOIN public.subject_summary_view ssv ON ssv.subject_id = s.id
    GROUP BY ag.id, ag.drive_folder_id, ag.name, ag.parent_group_id;
  `);
  console.log('Recreated public.academic_group_summary_view');

  await client.query(`
    CREATE OR REPLACE VIEW public.college_dashboard_metrics_view AS
    SELECT 
        (SELECT COUNT(*) FROM public.academic_groups) AS total_academic_groups,
        (SELECT COUNT(*) FROM public.subjects) AS total_subjects,
        (SELECT COALESCE(SUM(expected_practicals), 0) FROM public.subjects) AS total_expected_practicals,
        (SELECT COALESCE(SUM(practical_folders_detected), 0) FROM public.subject_summary_view) AS total_practical_folders_detected,
        (SELECT COALESCE(SUM(populated_practical_folders), 0) FROM public.subject_summary_view) AS total_practical_folders_with_submissions,
        (SELECT COALESCE(SUM(empty_practical_folders), 0) FROM public.subject_summary_view) AS total_empty_practical_folders,
        (SELECT COALESCE(SUM(missing_practical_folders), 0) FROM public.subject_summary_view) AS total_missing_practical_folders,
        (SELECT COALESCE(SUM(total_submission_files), 0) FROM public.subject_summary_view) AS total_submission_files,
        (SELECT dc.last_successful_sync FROM public.drive_connections dc ORDER BY dc.updated_at DESC LIMIT 1) AS last_successful_sync,
        (SELECT dc.sync_status FROM public.drive_connections dc ORDER BY dc.updated_at DESC LIMIT 1) AS current_sync_status,
        (SELECT dc.connection_status FROM public.drive_connections dc ORDER BY dc.updated_at DESC LIMIT 1) AS connection_status;
  `);
  console.log('Recreated public.college_dashboard_metrics_view');

  // 3. Update labincharge user role to 'viewer'
  await client.query(`
    UPDATE public.profiles 
    SET role = 'viewer', updated_at = now() 
    WHERE email = 'labincharge@superiorcollegemc.com';
  `);
  console.log('Updated labincharge profile role to viewer');

  await client.end();
  console.log('Migration completed successfully');
}

migrateTeacherColumn().catch(console.error);
