import {
  AcademicGroupSummaryView,
  CollegeDashboardMetricsView,
  DriveConnection,
  SubjectSummaryView,
  SubmissionFile,
  SyncJob,
  AppUserRole,
} from '@/types/database.types';
import { calculateSubjectProgress, RawPracticalInput } from '@/lib/progress/progress-engine';
import { createAdminClient } from '@/lib/supabase/admin';

// Initial connection state
let currentDriveConnection: DriveConnection = {
  id: 'conn-01',
  connected_email: 'admin@superiorcollegemc.com',
  root_folder_id: '1n2aMw0nhEoesQUUKpwMErIAPOkyZJq1k',
  root_folder_name: 'Superior College Labs Root',
  encrypted_refresh_token: 'dummy-encrypted-token',
  connection_status: 'connected',
  sync_status: 'successful',
  last_attempted_sync: new Date().toISOString(),
  last_successful_sync: new Date().toISOString(),
  last_error_message: null,
  change_page_token: 'token-page-98214',
  webhook_channel_id: 'channel-superior-01',
  webhook_resource_id: 'resource-drive-01',
  webhook_expiration: new Date(Date.now() + 86400000 * 7).toISOString(),
  created_at: '2026-10-01T08:00:00Z',
  updated_at: new Date().toISOString(),
};

// Initialized academic groups
const academicGroups = [
  {
    id: 'grp-bsse',
    driveFolderId: 'f-bsse-root',
    name: 'BSSE — Software Engineering',
    parentGroupId: null,
    relativePath: 'BS Labs Practicals Data / BSSE',
  },
  {
    id: 'grp-se-3rd',
    driveFolderId: 'f-se-3rd',
    name: 'SE 3rd Semester',
    parentGroupId: 'grp-bsse',
    relativePath: 'BS Labs Practicals Data / BSSE / SE 3rd',
  },
  {
    id: 'grp-bscs',
    driveFolderId: 'f-bscs-root',
    name: 'BSCS — Computer Science',
    parentGroupId: null,
    relativePath: 'BS Labs Practicals Data / BSCS',
  },
  {
    id: 'grp-cs-5th',
    driveFolderId: 'f-cs-5th',
    name: 'CS 5th Semester',
    parentGroupId: 'grp-bscs',
    relativePath: 'BS Labs Practicals Data / BSCS / CS 5th',
  },
];

// Subjects list
const subjects = [
  {
    id: 'subj-ds',
    driveFolderId: 'f-subj-ds',
    name: 'Data Structure',
    academicGroupId: 'grp-se-3rd',
    academicGroupName: 'SE 3rd Semester',
    expectedPracticals: 10,
  },
  {
    id: 'subj-oop',
    driveFolderId: 'f-subj-oop',
    name: 'Object Oriented Programming',
    academicGroupId: 'grp-se-3rd',
    academicGroupName: 'SE 3rd Semester',
    expectedPracticals: 10,
  },
  {
    id: 'subj-db',
    driveFolderId: 'f-subj-db',
    name: 'Database Systems',
    academicGroupId: 'grp-cs-5th',
    academicGroupName: 'CS 5th Semester',
    expectedPracticals: 10,
  },
  {
    id: 'subj-cn',
    driveFolderId: 'f-subj-cn',
    name: 'Computer Networks',
    academicGroupId: 'grp-cs-5th',
    academicGroupName: 'CS 5th Semester',
    expectedPracticals: 10,
  },
];

// Student submission files directly matching the real screenshot
const dataStructureLab1Files: SubmissionFile[] = [
  {
    id: 'file-ds-1-01',
    drive_file_id: 'df-ds-1-01',
    practical_folder_id: 'p-ds-lab-1',
    name: 'Untitled1.cpp',
    extension: '.cpp',
    mime_type: 'text/x-c',
    file_size: 1420,
    web_view_link: 'https://drive.google.com/file/d/df-ds-1-01/view',
    drive_modified_time: '2026-10-24T14:22:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T14:22:00Z',
    updated_at: '2026-10-24T14:22:00Z',
  },
  {
    id: 'file-ds-1-02',
    drive_file_id: 'df-ds-1-02',
    practical_folder_id: 'p-ds-lab-1',
    name: 'Untitled1.exe',
    extension: '.exe',
    mime_type: 'application/x-msdownload',
    file_size: 45200,
    web_view_link: 'https://drive.google.com/file/d/df-ds-1-02/view',
    drive_modified_time: '2026-10-24T14:23:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T14:23:00Z',
    updated_at: '2026-10-24T14:23:00Z',
  },
  {
    id: 'file-ds-1-03',
    drive_file_id: 'df-ds-1-03',
    practical_folder_id: 'p-ds-lab-1',
    name: 'waleed Bin nisar.32-SE-2024.cpp',
    extension: '.cpp',
    mime_type: 'text/x-c',
    file_size: 2150,
    web_view_link: 'https://drive.google.com/file/d/df-ds-1-03/view',
    drive_modified_time: '2026-10-24T14:25:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T14:25:00Z',
    updated_at: '2026-10-24T14:25:00Z',
  },
  {
    id: 'file-ds-1-04',
    drive_file_id: 'df-ds-1-04',
    practical_folder_id: 'p-ds-lab-1',
    name: 'sameed roll no 31 SE.cpp',
    extension: '.cpp',
    mime_type: 'text/x-c',
    file_size: 1980,
    web_view_link: 'https://drive.google.com/file/d/df-ds-1-04/view',
    drive_modified_time: '2026-10-24T14:27:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T14:27:00Z',
    updated_at: '2026-10-24T14:27:00Z',
  },
  {
    id: 'file-ds-1-05',
    drive_file_id: 'df-ds-1-05',
    practical_folder_id: 'p-ds-lab-1',
    name: 'saifulah s.e.cpp',
    extension: '.cpp',
    mime_type: 'text/x-c',
    file_size: 1840,
    web_view_link: 'https://drive.google.com/file/d/df-ds-1-05/view',
    drive_modified_time: '2026-10-24T14:28:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T14:28:00Z',
    updated_at: '2026-10-24T14:28:00Z',
  },
  // Additional 20 files in Lab 1 for total of 25 files
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `file-ds-1-${i + 6}`,
    drive_file_id: `df-ds-1-${i + 6}`,
    practical_folder_id: 'p-ds-lab-1',
    name: `Student_Submission_${i + 6}_SE3rd.cpp`,
    extension: '.cpp',
    mime_type: 'text/x-c',
    file_size: 1500 + i * 50,
    web_view_link: `https://drive.google.com/file/d/df-ds-1-${i + 6}/view`,
    drive_modified_time: '2026-10-24T15:00:00Z',
    is_trashed: false,
    last_seen_at: new Date().toISOString(),
    created_at: '2026-10-24T15:00:00Z',
    updated_at: '2026-10-24T15:00:00Z',
  })),
];

// Lab 2 in Data Structure: 22 files
const dataStructureLab2Files: SubmissionFile[] = Array.from({ length: 22 }, (_, i) => ({
  id: `file-ds-2-${i + 1}`,
  drive_file_id: `df-ds-2-${i + 1}`,
  practical_folder_id: 'p-ds-lab-2',
  name: `Lab2_Submission_${i + 1}_SE3rd.cpp`,
  extension: '.cpp',
  mime_type: 'text/x-c',
  file_size: 1600 + i * 40,
  web_view_link: `https://drive.google.com/file/d/df-ds-2-${i + 1}/view`,
  drive_modified_time: '2026-10-25T11:00:00Z',
  is_trashed: false,
  last_seen_at: new Date().toISOString(),
  created_at: '2026-10-25T11:00:00Z',
  updated_at: '2026-10-25T11:00:00Z',
}));

// Raw practical definitions
const rawPracticalsStore: Record<string, RawPracticalInput[]> = {
  'subj-ds': [
    {
      id: 'p-ds-lab-1',
      name: 'Lab 1',
      driveFolderId: 'folder-ds-lab-1',
      practicalNumber: 1,
      driveModifiedTime: '2026-10-24T14:30:00Z',
      files: dataStructureLab1Files.map((f) => ({ id: f.id, driveFileId: f.drive_file_id })),
    },
    {
      id: 'p-ds-lab-2',
      name: 'Lab 2',
      driveFolderId: 'folder-ds-lab-2',
      practicalNumber: 2,
      driveModifiedTime: '2026-10-25T11:00:00Z',
      files: dataStructureLab2Files.map((f) => ({ id: f.id, driveFileId: f.drive_file_id })),
    },
    {
      id: 'p-ds-lab-3',
      name: 'Lab 3',
      driveFolderId: 'folder-ds-lab-3',
      practicalNumber: 3,
      driveModifiedTime: '2026-10-25T12:00:00Z',
      files: [], // Empty practical folder
    },
  ],
  'subj-oop': [
    {
      id: 'p-oop-lab-1',
      name: 'Lab 1',
      driveFolderId: 'folder-oop-lab-1',
      practicalNumber: 1,
      driveModifiedTime: '2026-10-20T10:00:00Z',
      files: Array.from({ length: 30 }, (_, i) => ({ id: `oop-1-${i}`, driveFileId: `df-oop-1-${i}` })),
    },
    {
      id: 'p-oop-lab-2',
      name: 'Lab 2',
      driveFolderId: 'folder-oop-lab-2',
      practicalNumber: 2,
      driveModifiedTime: '2026-10-21T10:00:00Z',
      files: Array.from({ length: 28 }, (_, i) => ({ id: `oop-2-${i}`, driveFileId: `df-oop-2-${i}` })),
    },
    {
      id: 'p-oop-lab-3',
      name: 'Lab 3',
      driveFolderId: 'folder-oop-lab-3',
      practicalNumber: 3,
      driveModifiedTime: '2026-10-22T10:00:00Z',
      files: Array.from({ length: 25 }, (_, i) => ({ id: `oop-3-${i}`, driveFileId: `df-oop-3-${i}` })),
    },
    {
      id: 'p-oop-lab-4',
      name: 'Lab 4',
      driveFolderId: 'folder-oop-lab-4',
      practicalNumber: 4,
      driveModifiedTime: '2026-10-23T10:00:00Z',
      files: Array.from({ length: 18 }, (_, i) => ({ id: `oop-4-${i}`, driveFileId: `df-oop-4-${i}` })),
    },
    {
      id: 'p-oop-lab-5',
      name: 'Lab 5',
      driveFolderId: 'folder-oop-lab-5',
      practicalNumber: 5,
      driveModifiedTime: '2026-10-24T10:00:00Z',
      files: [], // Empty
    },
  ],
  'subj-db': Array.from({ length: 10 }, (_, i) => ({
    id: `p-db-lab-${i + 1}`,
    name: `Lab ${i + 1}`,
    driveFolderId: `folder-db-lab-${i + 1}`,
    practicalNumber: i + 1,
    driveModifiedTime: '2026-10-22T10:00:00Z',
    files: Array.from({ length: 35 - i * 2 }, (_, f) => ({
      id: `db-${i}-${f}`,
      driveFileId: `df-db-${i}-${f}`,
    })),
  })),
  'subj-cn': [
    {
      id: 'p-cn-lab-1',
      name: 'Lab 1',
      driveFolderId: 'folder-cn-lab-1',
      practicalNumber: 1,
      driveModifiedTime: '2026-10-18T10:00:00Z',
      files: Array.from({ length: 15 }, (_, i) => ({ id: `cn-1-${i}`, driveFileId: `df-cn-1-${i}` })),
    },
    {
      id: 'p-cn-lab-2',
      name: 'Lab 2',
      driveFolderId: 'folder-cn-lab-2',
      practicalNumber: 2,
      driveModifiedTime: '2026-10-19T10:00:00Z',
      files: Array.from({ length: 12 }, (_, i) => ({ id: `cn-2-${i}`, driveFileId: `df-cn-2-${i}` })),
    },
  ],
};

// Users
export interface CollegeUser {
  id: string;
  email: string;
  full_name: string;
  role: AppUserRole;
  is_active: boolean;
  created_at: string;
}

const collegeUsers: CollegeUser[] = [
  {
    id: '5946468b-d360-49dc-9406-19bed2d8a3e9',
    email: 'admin@superiorcollegemc.com',
    full_name: 'IT Administrator',
    role: 'administrator',
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: '5a96be03-7637-429d-8937-874b9cbe6d5c',
    email: 'labincharge@superiorcollegemc.com',
    full_name: 'Lab Incharge',
    role: 'administrator',
    is_active: true,
    created_at: '2026-09-02T00:00:00Z',
  },
  {
    id: '0cf26239-f9ca-43c8-ba91-13b1a7925132',
    email: 'hod@superiorcollegemc.com',
    full_name: 'Head of Department',
    role: 'viewer',
    is_active: true,
    created_at: '2026-09-05T00:00:00Z',
  },
];

// Sync jobs history
const syncJobs: SyncJob[] = [
  {
    id: 'job-01',
    job_type: 'initial',
    status: 'completed',
    started_at: '2026-10-25T10:00:00Z',
    completed_at: '2026-10-25T10:01:14Z',
    folders_discovered: 18,
    files_discovered: 393,
    errors: [],
    warnings: [],
    triggered_by: 'admin@superiorcollegemc.com',
    created_at: '2026-10-25T10:00:00Z',
  },
  {
    id: 'job-02',
    job_type: 'incremental',
    status: 'completed',
    started_at: '2026-10-26T03:00:00Z',
    completed_at: '2026-10-26T03:00:12Z',
    folders_discovered: 18,
    files_discovered: 405,
    errors: [],
    warnings: [],
    triggered_by: 'webhook_changes_api',
    created_at: '2026-10-26T03:00:00Z',
  },
];

/**
 * Reads college dashboard metrics
 */
export async function getDashboardMetrics(): Promise<CollegeDashboardMetricsView> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('college_dashboard_metrics_view')
        .select('*')
        .maybeSingle();

      if (data && !error && Number(data.total_subjects) > 0) {
        return {
          total_academic_groups: Number(data.total_academic_groups),
          total_subjects: Number(data.total_subjects),
          total_expected_practicals: Number(data.total_expected_practicals),
          total_practical_folders_detected: Number(data.total_practical_folders_detected),
          total_practical_folders_with_submissions: Number(data.total_practical_folders_with_submissions),
          total_empty_practical_folders: Number(data.total_empty_practical_folders),
          total_missing_practical_folders: Number(data.total_missing_practical_folders),
          total_submission_files: Number(data.total_submission_files),
          last_successful_sync: data.last_successful_sync || currentDriveConnection.last_successful_sync,
          current_sync_status: data.current_sync_status || currentDriveConnection.sync_status,
          connection_status: data.connection_status || currentDriveConnection.connection_status,
        };
      }
    } catch {
      // Fallback to memory store if query fails
    }
  }

  const allSubjectSummaries = await getAllSubjectSummaries();

  let totalDetected = 0;
  let totalPopulated = 0;
  let totalEmpty = 0;
  let totalMissing = 0;
  let totalFiles = 0;
  let totalExpected = 0;

  for (const s of allSubjectSummaries) {
    totalExpected += s.expected_practicals;
    totalDetected += s.practical_folders_detected;
    totalPopulated += s.populated_practical_folders;
    totalEmpty += s.empty_practical_folders;
    totalMissing += s.missing_practical_folders;
    totalFiles += s.total_submission_files;
  }

  return {
    total_academic_groups: academicGroups.length,
    total_subjects: subjects.length,
    total_expected_practicals: totalExpected,
    total_practical_folders_detected: totalDetected,
    total_practical_folders_with_submissions: totalPopulated,
    total_empty_practical_folders: totalEmpty,
    total_missing_practical_folders: totalMissing,
    total_submission_files: totalFiles,
    last_successful_sync: currentDriveConnection.last_successful_sync,
    current_sync_status: currentDriveConnection.sync_status,
    connection_status: currentDriveConnection.connection_status,
  };
}

/**
 * Returns all academic groups with summary metrics
 */
export async function getAcademicGroups(): Promise<AcademicGroupSummaryView[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('academic_group_summary_view')
        .select('*')
        .order('academic_group_name', { ascending: true });

      if (data && !error && data.length > 0) {
        return data.map((d: any) => ({
          academic_group_id: d.academic_group_id,
          drive_folder_id: d.drive_folder_id,
          academic_group_name: d.academic_group_name,
          parent_group_id: d.parent_group_id,
          total_subjects: Number(d.total_subjects),
          total_expected_practicals: Number(d.total_expected_practicals),
          total_practical_folders_detected: Number(d.total_practical_folders_detected),
          total_populated_practical_folders: Number(d.total_populated_practical_folders),
          total_empty_practical_folders: Number(d.total_empty_practical_folders),
          total_missing_practical_folders: Number(d.total_missing_practical_folders),
          total_submission_files: Number(d.total_submission_files),
          overall_folder_coverage_percentage: Number(d.overall_folder_coverage_percentage),
          overall_submission_coverage_percentage: Number(d.overall_submission_coverage_percentage),
        }));
      }
    } catch {
      // Fallback
    }
  }

  const subjectSummaries = await getAllSubjectSummaries();

  return academicGroups.map((grp) => {
    const grpSubjects = subjectSummaries.filter((s) => s.academic_group_id === grp.id);

    const totalExpected = grpSubjects.reduce((acc, s) => acc + s.expected_practicals, 0);
    const totalDetected = grpSubjects.reduce((acc, s) => acc + s.practical_folders_detected, 0);
    const totalCapped = grpSubjects.reduce((acc, s) => acc + s.practical_folders_capped, 0);
    const totalPopulated = grpSubjects.reduce((acc, s) => acc + s.populated_practical_folders, 0);
    const totalEmpty = grpSubjects.reduce((acc, s) => acc + s.empty_practical_folders, 0);
    const totalMissing = grpSubjects.reduce((acc, s) => acc + s.missing_practical_folders, 0);
    const totalFiles = grpSubjects.reduce((acc, s) => acc + s.total_submission_files, 0);

    const folderCoverage = totalExpected > 0 ? Math.round((totalCapped / totalExpected) * 1000) / 10 : 0;
    const submissionCoverage = totalExpected > 0 ? Math.round((totalPopulated / totalExpected) * 1000) / 10 : 0;

    return {
      academic_group_id: grp.id,
      drive_folder_id: grp.driveFolderId,
      academic_group_name: grp.name,
      parent_group_id: grp.parentGroupId,
      total_subjects: grpSubjects.length,
      total_expected_practicals: totalExpected,
      total_practical_folders_detected: totalDetected,
      total_populated_practical_folders: totalPopulated,
      total_empty_practical_folders: totalEmpty,
      total_missing_practical_folders: totalMissing,
      total_submission_files: totalFiles,
      overall_folder_coverage_percentage: folderCoverage,
      overall_submission_coverage_percentage: submissionCoverage,
    };
  });
}

/**
 * Returns academic group by ID
 */
export async function getAcademicGroupById(groupId: string) {
  const grps = await getAcademicGroups();
  return (
    grps.find(
      (g) => g.academic_group_id === groupId || g.drive_folder_id === groupId
    ) || null
  );
}

/**
 * Returns all subject summaries with progress
 */
export async function getAllSubjectSummaries(): Promise<SubjectSummaryView[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('subject_summary_view')
        .select('*')
        .order('subject_name', { ascending: true });

      if (data && !error && data.length > 0) {
        return data.map((s: any) => ({
          subject_id: s.subject_id,
          drive_folder_id: s.drive_folder_id,
          subject_name: s.subject_name,
          academic_group_id: s.academic_group_id,
          academic_group_name: s.academic_group_name,
          expected_practicals: Number(s.expected_practicals),
          practical_folders_detected: Number(s.practical_folders_detected),
          practical_folders_capped: Number(s.practical_folders_capped),
          missing_practical_folders: Number(s.missing_practical_folders),
          populated_practical_folders: Number(s.populated_practical_folders),
          empty_practical_folders: Number(s.empty_practical_folders),
          total_submission_files: Number(s.total_submission_files),
          folder_coverage_percentage: Number(s.folder_coverage_percentage),
          submission_coverage_percentage: Number(s.submission_coverage_percentage),
        }));
      }
    } catch {
      // Fallback
    }
  }

  return subjects.map((subj) => {
    const rawPracticals = rawPracticalsStore[subj.id] || [];
    const progress = calculateSubjectProgress(subj.id, subj.name, rawPracticals, subj.expectedPracticals);

    return {
      subject_id: subj.id,
      drive_folder_id: subj.driveFolderId,
      subject_name: subj.name,
      academic_group_id: subj.academicGroupId,
      academic_group_name: subj.academicGroupName,
      expected_practicals: progress.expectedPracticals,
      practical_folders_detected: progress.practicalFoldersDetected,
      practical_folders_capped: progress.practicalFoldersCapped,
      missing_practical_folders: progress.missingPracticalFolders,
      populated_practical_folders: progress.populatedPracticalFolders,
      empty_practical_folders: progress.emptyPracticalFolders,
      total_submission_files: progress.totalSubmissionFiles,
      folder_coverage_percentage: progress.folderCoveragePercentage,
      submission_coverage_percentage: progress.submissionCoveragePercentage,
    };
  });
}

/**
 * Returns subject by ID with full 10-practical breakdown
 */
export async function getSubjectById(subjectId: string) {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      // Support querying either by UUID or by Drive folder ID
      const query = supabase
        .from('subjects')
        .select('id, name, drive_folder_id, academic_group_id, expected_practicals, academic_groups(id, name)');

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId);
      const { data: subj } = isUuid
        ? await query.eq('id', subjectId).maybeSingle()
        : await query.eq('drive_folder_id', subjectId).maybeSingle();

      if (subj) {
        const { data: practicals } = await supabase
          .from('practical_folders')
          .select('id, name, practical_number, drive_folder_id, drive_modified_time, classification_status, submission_files(id, drive_file_id, is_trashed)')
          .eq('subject_id', subj.id)
          .order('practical_number', { ascending: true });

        const rawPracticals: RawPracticalInput[] = (practicals || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          driveFolderId: p.drive_folder_id,
          practicalNumber: p.practical_number,
          classificationStatus: p.classification_status === 'identified' ? 'identified' : 'needs_review',
          driveModifiedTime: p.drive_modified_time,
          files: (p.submission_files || []).map((f: any) => ({
            id: f.id,
            driveFileId: f.drive_file_id,
            isTrashed: f.is_trashed,
          })),
        }));

        const progress = calculateSubjectProgress(
          subj.id,
          subj.name,
          rawPracticals,
          subj.expected_practicals || 10
        );

        const groupName = Array.isArray(subj.academic_groups)
          ? subj.academic_groups[0]?.name
          : (subj.academic_groups as any)?.name || 'Academic Group';

        return {
          id: subj.id,
          name: subj.name,
          driveFolderId: subj.drive_folder_id,
          academicGroupId: subj.academic_group_id,
          academicGroupName: groupName,
          expectedPracticals: subj.expected_practicals || 10,
          progress,
        };
      }
    } catch {
      // Fallback
    }
  }

  const subj = subjects.find((s) => s.id === subjectId || s.driveFolderId === subjectId);
  if (!subj) return null;

  const rawPracticals = rawPracticalsStore[subj.id] || [];
  const progress = calculateSubjectProgress(subj.id, subj.name, rawPracticals, subj.expectedPracticals);

  return {
    ...subj,
    progress,
  };
}

/**
 * Returns practical folder details and files
 */
export async function getPracticalById(practicalId: string) {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const query = supabase
        .from('practical_folders')
        .select('id, name, practical_number, drive_folder_id, subject_id, drive_modified_time, subjects(id, name, academic_groups(id, name))');

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(practicalId);
      const { data: practical } = isUuid
        ? await query.eq('id', practicalId).maybeSingle()
        : await query.eq('drive_folder_id', practicalId).maybeSingle();

      if (practical) {
        const { data: files } = await supabase
          .from('submission_files')
          .select('*')
          .eq('practical_folder_id', practical.id)
          .eq('is_trashed', false)
          .order('name', { ascending: true });

        const subj = Array.isArray(practical.subjects) ? practical.subjects[0] : (practical.subjects as any);
        const group = subj?.academic_groups ? (Array.isArray(subj.academic_groups) ? subj.academic_groups[0] : subj.academic_groups) : null;

        return {
          id: practical.id,
          name: practical.name,
          practicalNumber: practical.practical_number,
          driveFolderId: practical.drive_folder_id,
          subjectId: practical.subject_id,
          subjectName: subj?.name || 'Subject',
          academicGroupName: group?.name || 'Academic Group',
          driveModifiedTime: practical.drive_modified_time,
          fileCount: (files || []).length,
          files: (files || []).map((f: any) => ({
            id: f.id,
            drive_file_id: f.drive_file_id,
            practical_folder_id: f.practical_folder_id,
            name: f.name,
            extension: f.extension,
            mime_type: f.mime_type,
            file_size: f.file_size,
            web_view_link: f.web_view_link,
            drive_modified_time: f.drive_modified_time,
            is_trashed: f.is_trashed,
            last_seen_at: f.last_seen_at,
            created_at: f.created_at,
            updated_at: f.updated_at,
          })),
        };
      }
    } catch {
      // Fallback
    }
  }

  for (const [subjId, practicals] of Object.entries(rawPracticalsStore)) {
    const found = practicals.find((p) => p.id === practicalId || p.driveFolderId === practicalId);
    if (found) {
      const subj = subjects.find((s) => s.id === subjId);
      let files: SubmissionFile[] = [];

      if (practicalId === 'p-ds-lab-1') {
        files = dataStructureLab1Files;
      } else if (practicalId === 'p-ds-lab-2') {
        files = dataStructureLab2Files;
      } else {
        files = found.files.map((f, i) => ({
          id: f.id,
          drive_file_id: f.driveFileId,
          practical_folder_id: practicalId,
          name: `Submission_${i + 1}_File.cpp`,
          extension: '.cpp',
          mime_type: 'text/x-c',
          file_size: 1800,
          web_view_link: `https://drive.google.com/file/d/${f.driveFileId}/view`,
          drive_modified_time: found.driveModifiedTime,
          is_trashed: false,
          last_seen_at: new Date().toISOString(),
          created_at: '2026-10-24T12:00:00Z',
          updated_at: '2026-10-24T12:00:00Z',
        }));
      }

      return {
        id: found.id,
        name: found.name,
        practicalNumber: found.practicalNumber,
        driveFolderId: found.driveFolderId,
        subjectId: subjId,
        subjectName: subj?.name || 'Subject',
        academicGroupName: subj?.academicGroupName || 'Academic Group',
        driveModifiedTime: found.driveModifiedTime,
        fileCount: files.length,
        files,
      };
    }
  }

  return null;
}

/**
 * Global search across academic groups, semesters, subjects, practicals, and file names
 */
export async function searchGlobalMetadata(query: string) {
  if (!query || query.trim().length === 0) {
    return {
      academicGroups: [],
      subjects: [],
      practicals: [],
      files: [],
    };
  }

  const clean = query.trim().toLowerCase();
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const [groupsRes, subjectsRes, practicalsRes, filesRes] = await Promise.all([
        supabase.from('academic_groups').select('id, name, drive_folder_id').ilike('name', `%${clean}%`).limit(15),
        supabase.from('subjects').select('id, name, drive_folder_id, academic_groups(name)').ilike('name', `%${clean}%`).limit(15),
        supabase.from('practical_folders').select('id, name, drive_folder_id, subjects(id, name, academic_groups(name))').ilike('name', `%${clean}%`).limit(20),
        supabase.from('submission_files').select('id, name, extension, drive_modified_time, web_view_link, practical_folders(id, name, subjects(name, academic_groups(name)))').ilike('name', `%${clean}%`).limit(30),
      ]);

      if (
        (groupsRes.data && groupsRes.data.length > 0) ||
        (subjectsRes.data && subjectsRes.data.length > 0) ||
        (practicalsRes.data && practicalsRes.data.length > 0) ||
        (filesRes.data && filesRes.data.length > 0)
      ) {
        return {
          academicGroups: (groupsRes.data || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            driveFolderId: g.drive_folder_id,
            parentGroupId: null,
          })),
          subjects: (subjectsRes.data || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            driveFolderId: s.drive_folder_id,
            academicGroupId: '',
            academicGroupName: (Array.isArray(s.academic_groups) ? s.academic_groups[0]?.name : s.academic_groups?.name) || '',
            expectedPracticals: 10,
          })),
          practicals: (practicalsRes.data || []).map((p: any) => {
            const subj = Array.isArray(p.subjects) ? p.subjects[0] : p.subjects;
            const group = subj?.academic_groups ? (Array.isArray(subj.academic_groups) ? subj.academic_groups[0] : subj.academic_groups) : null;
            return {
              id: p.id,
              name: p.name,
              subjectName: subj?.name || '',
              academicGroupName: group?.name || '',
              fileCount: 0,
            };
          }),
          files: (filesRes.data || []).map((f: any) => {
            const pf = Array.isArray(f.practical_folders) ? f.practical_folders[0] : f.practical_folders;
            const subj = pf?.subjects ? (Array.isArray(pf.subjects) ? pf.subjects[0] : pf.subjects) : null;
            const group = subj?.academic_groups ? (Array.isArray(subj.academic_groups) ? subj.academic_groups[0] : subj.academic_groups) : null;
            return {
              id: f.id,
              name: f.name,
              extension: f.extension,
              modifiedTime: f.drive_modified_time,
              practicalId: pf?.id || '',
              practicalName: pf?.name || '',
              subjectName: subj?.name || '',
              academicGroupName: group?.name || '',
              webViewLink: f.web_view_link,
            };
          }),
        };
      }
    } catch {
      // Fallback
    }
  }

  const matchedGroups = academicGroups.filter((g) => g.name.toLowerCase().includes(clean));
  const matchedSubjects = subjects.filter((s) => s.name.toLowerCase().includes(clean));

  const matchedPracticals: Array<{
    id: string;
    name: string;
    subjectName: string;
    academicGroupName: string;
    fileCount: number;
  }> = [];

  for (const [subjId, practicals] of Object.entries(rawPracticalsStore)) {
    const subj = subjects.find((s) => s.id === subjId);
    for (const p of practicals) {
      if (p.name.toLowerCase().includes(clean)) {
        matchedPracticals.push({
          id: p.id,
          name: p.name,
          subjectName: subj?.name || '',
          academicGroupName: subj?.academicGroupName || '',
          fileCount: p.files.length,
        });
      }
    }
  }

  // Search filenames in Data Structure and other subjects
  const allFiles = [...dataStructureLab1Files, ...dataStructureLab2Files];
  const matchedFiles = allFiles
    .filter((f) => f.name.toLowerCase().includes(clean))
    .slice(0, 30)
    .map((f) => ({
      id: f.id,
      name: f.name,
      extension: f.extension,
      modifiedTime: f.drive_modified_time,
      practicalId: f.practical_folder_id,
      practicalName: f.practical_folder_id === 'p-ds-lab-1' ? 'Lab 1' : 'Lab 2',
      subjectName: 'Data Structure',
      academicGroupName: 'SE 3rd Semester',
      webViewLink: f.web_view_link,
    }));

  return {
    academicGroups: matchedGroups,
    subjects: matchedSubjects,
    practicals: matchedPracticals,
    files: matchedFiles,
  };
}

/**
 * Returns Drive connection status
 */
export async function getDriveConnection(): Promise<DriveConnection> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('drive_connections')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (data && !error) {
        currentDriveConnection = {
          ...currentDriveConnection,
          ...data,
        };
      }
    } catch {
      // Fall back to memory store if query fails
    }
  }
  return currentDriveConnection;
}

/**
 * Updates Drive connection settings
 */
export async function updateDriveConnection(
  updates: Partial<DriveConnection>
): Promise<DriveConnection> {
  currentDriveConnection = {
    ...currentDriveConnection,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase
        .from('drive_connections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');
    } catch {
      // Ignore background persistence error
    }
  }

  return currentDriveConnection;
}

/**
 * Returns sync jobs
 */
export async function getSyncJobs(): Promise<SyncJob[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(25);

      if (data && !error && data.length > 0) {
        return data.map((j: any) => ({
          id: j.id,
          job_type: j.job_type,
          status: j.status,
          started_at: j.started_at,
          completed_at: j.completed_at,
          folders_discovered: Number(j.folders_discovered),
          files_discovered: Number(j.files_discovered),
          errors: Array.isArray(j.errors) ? j.errors : [],
          warnings: Array.isArray(j.warnings) ? j.warnings : [],
          triggered_by: j.triggered_by,
          created_at: j.created_at || j.started_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  return syncJobs;
}

/**
 * Returns authorized college users
 */
export async function getCollegeUsers(): Promise<CollegeUser[]> {
  return collegeUsers;
}
