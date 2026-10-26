-- ==============================================================================
-- SUPERIOR LAB TRACKER — SUPABASE POSTGRESQL MIGRATION
-- Superior College, Mian Channu, Punjab, Pakistan
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE app_user_role AS ENUM ('administrator', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_status_enum AS ENUM ('disconnected', 'connected', 'error', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sync_status_enum AS ENUM ('never_run', 'in_progress', 'successful', 'successful_with_warnings', 'failed', 'awaiting_authorization');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_classification_enum AS ENUM ('academic_group', 'semester', 'subject', 'practical_folder', 'submission_file', 'ambiguous', 'unclassified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE practical_status_enum AS ENUM ('identified', 'needs_review', 'ambiguous');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role app_user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Google Drive Connection Table
CREATE TABLE IF NOT EXISTS public.drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connected_email TEXT,
    root_folder_id TEXT NOT NULL,
    root_folder_name TEXT NOT NULL DEFAULT 'Lab Root Folder',
    encrypted_refresh_token TEXT,
    connection_status connection_status_enum NOT NULL DEFAULT 'disconnected',
    sync_status sync_status_enum NOT NULL DEFAULT 'never_run',
    last_attempted_sync TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    last_error_message TEXT,
    change_page_token TEXT,
    webhook_channel_id TEXT,
    webhook_resource_id TEXT,
    webhook_expiration TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Drive Raw Nodes Table (Preserves raw Drive tree and metadata)
CREATE TABLE IF NOT EXISTS public.drive_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    parent_drive_id TEXT,
    classification node_classification_enum NOT NULL DEFAULT 'unclassified',
    classification_confidence NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    relative_path TEXT,
    is_trashed BOOLEAN NOT NULL DEFAULT false,
    modified_time TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Academic Groups & Semesters (e.g. BSSE, SE 3rd, BS Labs Practicals Data)
CREATE TABLE IF NOT EXISTS public.academic_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_folder_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    parent_group_id UUID REFERENCES public.academic_groups(id) ON DELETE SET NULL,
    relative_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Subjects Table (e.g. Data Structure, OOP, Database Systems)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_folder_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    academic_group_id UUID REFERENCES public.academic_groups(id) ON DELETE CASCADE,
    expected_practicals INTEGER NOT NULL DEFAULT 10 CHECK (expected_practicals > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Practical Folders Table (e.g. Lab 1, Lab 2, Practical 01)
CREATE TABLE IF NOT EXISTS public.practical_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_folder_id TEXT NOT NULL UNIQUE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    practical_number INTEGER CHECK (practical_number >= 1),
    classification_status practical_status_enum NOT NULL DEFAULT 'identified',
    drive_modified_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Student Submission Files Metadata Table (Filenames and metadata ONLY, strict no-content)
CREATE TABLE IF NOT EXISTS public.submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_file_id TEXT NOT NULL UNIQUE,
    practical_folder_id UUID NOT NULL REFERENCES public.practical_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    extension TEXT,
    mime_type TEXT,
    file_size BIGINT,
    web_view_link TEXT,
    drive_modified_time TIMESTAMPTZ,
    is_trashed BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Hierarchy Configuration Table (Custom rules for Drive hierarchy resolution)
CREATE TABLE IF NOT EXISTS public.hierarchy_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    pattern TEXT NOT NULL,
    target_type TEXT NOT NULL,
    depth_level INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Sync Jobs & Diagnostics Table
CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'initial', 'incremental', 'reconciliation', 'manual'
    status TEXT NOT NULL,   -- 'started', 'completed', 'completed_with_warnings', 'failed'
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    folders_discovered INTEGER NOT NULL DEFAULT 0,
    files_discovered INTEGER NOT NULL DEFAULT 0,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    triggered_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_drive_nodes_parent ON public.drive_nodes(parent_drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_nodes_classification ON public.drive_nodes(classification);
CREATE INDEX IF NOT EXISTS idx_subjects_academic_group ON public.subjects(academic_group_id);
CREATE INDEX IF NOT EXISTS idx_practical_folders_subject ON public.practical_folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_practical_folders_number ON public.practical_folders(practical_number);
CREATE INDEX IF NOT EXISTS idx_submission_files_practical ON public.submission_files(practical_folder_id);
CREATE INDEX IF NOT EXISTS idx_submission_files_name ON public.submission_files(name);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at DESC);

-- ==============================================================================
-- DERIVED CALCULATED VIEWS
-- (Separating practical folder counts from submission file counts)
-- ==============================================================================

-- Practical folder view with submission counts
CREATE OR REPLACE VIEW public.practical_folder_summary_view AS
SELECT 
    pf.id AS practical_folder_id,
    pf.drive_folder_id,
    pf.subject_id,
    pf.name AS practical_name,
    pf.practical_number,
    pf.classification_status,
    pf.drive_modified_time,
    COUNT(sf.id) FILTER (WHERE sf.is_trashed = false) AS submission_file_count,
    CASE 
        WHEN COUNT(sf.id) FILTER (WHERE sf.is_trashed = false) > 0 THEN 'submissions_available'
        ELSE 'no_submissions'
    END AS submission_status
FROM public.practical_folders pf
LEFT JOIN public.submission_files sf ON sf.practical_folder_id = pf.id
GROUP BY pf.id, pf.drive_folder_id, pf.subject_id, pf.name, pf.practical_number, pf.classification_status, pf.drive_modified_time;

-- Subject summary view with 10 expected practicals tracking
CREATE OR REPLACE VIEW public.subject_summary_view AS
SELECT 
    s.id AS subject_id,
    s.drive_folder_id,
    s.name AS subject_name,
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
GROUP BY s.id, s.drive_folder_id, s.name, s.academic_group_id, ag.name, s.expected_practicals;

-- Academic Group summary view
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

-- Overall College Dashboard summary view
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

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ==============================================================================

-- Security definer function to retrieve user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_user_role AS $$
DECLARE
    user_role app_user_role;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile or admins can view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.get_current_user_role() = 'administrator');

CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

-- 2. Drive Connections Policies
CREATE POLICY "Admins can manage drive connections"
    ON public.drive_connections FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

CREATE POLICY "Viewers can view drive connection status (non-sensitive)"
    ON public.drive_connections FOR SELECT
    TO authenticated
    USING (true);

-- 3. Academic Groups, Subjects, Practical Folders, Submission Files Policies
-- Viewers & Admins can read
CREATE POLICY "Authenticated users can view academic groups"
    ON public.academic_groups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage academic groups"
    ON public.academic_groups FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

CREATE POLICY "Authenticated users can view subjects"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage subjects"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

CREATE POLICY "Authenticated users can view practical folders"
    ON public.practical_folders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage practical folders"
    ON public.practical_folders FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

CREATE POLICY "Authenticated users can view submission files metadata"
    ON public.submission_files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage submission files"
    ON public.submission_files FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

CREATE POLICY "Authenticated users can view drive nodes"
    ON public.drive_nodes FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() = 'administrator');

CREATE POLICY "Admins can manage drive nodes"
    ON public.drive_nodes FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

-- 4. Hierarchy Configs Policies
CREATE POLICY "Authenticated users can read hierarchy configs"
    ON public.hierarchy_configs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage hierarchy configs"
    ON public.hierarchy_configs FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

-- 5. Sync Jobs Policies
CREATE POLICY "Authenticated users can view sync jobs"
    ON public.sync_jobs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage sync jobs"
    ON public.sync_jobs FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'administrator')
    WITH CHECK (public.get_current_user_role() = 'administrator');

-- 6. Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() = 'administrator');

CREATE POLICY "System and admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
