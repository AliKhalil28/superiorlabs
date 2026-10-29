export type AppUserRole = 'administrator' | 'viewer';

export type ConnectionStatus = 'disconnected' | 'connected' | 'error' | 'revoked';

export type SyncStatus = 
  | 'never_run' 
  | 'in_progress' 
  | 'successful' 
  | 'successful_with_warnings' 
  | 'failed' 
  | 'awaiting_authorization';

export type NodeClassification = 
  | 'academic_group' 
  | 'semester' 
  | 'subject' 
  | 'practical_folder' 
  | 'submission_file' 
  | 'ambiguous' 
  | 'unclassified';

export type PracticalStatus = 'identified' | 'needs_review' | 'ambiguous';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriveConnection {
  id: string;
  connected_email: string | null;
  root_folder_id: string;
  root_folder_name: string;
  encrypted_refresh_token: string | null;
  connection_status: ConnectionStatus;
  sync_status: SyncStatus;
  last_attempted_sync: string | null;
  last_successful_sync: string | null;
  last_error_message: string | null;
  change_page_token: string | null;
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expiration: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriveNode {
  id: string;
  drive_id: string;
  name: string;
  mime_type: string;
  parent_drive_id: string | null;
  classification: NodeClassification;
  classification_confidence: number;
  relative_path: string | null;
  is_trashed: boolean;
  modified_time: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicGroup {
  id: string;
  drive_folder_id: string;
  name: string;
  parent_group_id: string | null;
  relative_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  drive_folder_id: string;
  name: string;
  teacher_name?: string | null;
  academic_group_id: string | null;
  expected_practicals: number;
  created_at: string;
  updated_at: string;
}

export interface PracticalFolder {
  id: string;
  drive_folder_id: string;
  subject_id: string;
  name: string;
  practical_number: number | null;
  classification_status: PracticalStatus;
  drive_modified_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFile {
  id: string;
  drive_file_id: string;
  practical_folder_id: string;
  name: string;
  extension: string | null;
  mime_type: string | null;
  file_size: number | null;
  web_view_link: string | null;
  drive_modified_time: string | null;
  is_trashed: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface HierarchyConfig {
  id: string;
  rule_name: string;
  pattern: string;
  target_type: string;
  depth_level: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncJob {
  id: string;
  job_type: 'initial' | 'incremental' | 'reconciliation' | 'manual';
  status: 'started' | 'completed' | 'completed_with_warnings' | 'failed';
  started_at: string;
  completed_at: string | null;
  folders_discovered: number;
  files_discovered: number;
  errors: string[];
  warnings: string[];
  triggered_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PracticalFolderSummaryView {
  practical_folder_id: string;
  drive_folder_id: string;
  subject_id: string;
  practical_name: string;
  practical_number: number | null;
  classification_status: PracticalStatus;
  drive_modified_time: string | null;
  submission_file_count: number;
  submission_status: 'submissions_available' | 'no_submissions';
}

export interface SubjectSummaryView {
  subject_id: string;
  drive_folder_id: string;
  subject_name: string;
  teacher_name?: string | null;
  academic_group_id: string | null;
  academic_group_name: string | null;
  expected_practicals: number;
  practical_folders_detected: number;
  practical_folders_capped: number;
  missing_practical_folders: number;
  populated_practical_folders: number;
  empty_practical_folders: number;
  total_submission_files: number;
  folder_coverage_percentage: number;
  submission_coverage_percentage: number;
}

export interface AcademicGroupSummaryView {
  academic_group_id: string;
  drive_folder_id: string;
  academic_group_name: string;
  parent_group_id: string | null;
  total_subjects: number;
  total_expected_practicals: number;
  total_practical_folders_detected: number;
  total_populated_practical_folders: number;
  total_empty_practical_folders: number;
  total_missing_practical_folders: number;
  total_submission_files: number;
  overall_folder_coverage_percentage: number;
  overall_submission_coverage_percentage: number;
}

export interface TeacherSubjectInfo {
  subject_id: string;
  subject_name: string;
  academic_group_name: string | null;
  practical_folders_detected: number;
  populated_practical_folders: number;
  total_submission_files: number;
}

export interface TeacherSummaryView {
  teacher_id: string;
  teacher_name: string;
  is_unassigned: boolean;
  total_subjects: number;
  total_expected_practicals: number;
  total_practical_folders_detected: number;
  total_populated_practical_folders: number;
  total_empty_practical_folders: number;
  total_missing_practical_folders: number;
  total_submission_files: number;
  overall_folder_coverage_percentage: number;
  overall_submission_coverage_percentage: number;
  subjects: TeacherSubjectInfo[];
}

export interface CollegeDashboardMetricsView {
  total_academic_groups: number;
  total_subjects: number;
  total_expected_practicals: number;
  total_practical_folders_detected: number;
  total_practical_folders_with_submissions: number;
  total_empty_practical_folders: number;
  total_missing_practical_folders: number;
  total_submission_files: number;
  last_successful_sync: string | null;
  current_sync_status: SyncStatus;
  connection_status: ConnectionStatus;
}
