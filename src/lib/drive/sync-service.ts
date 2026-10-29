import { getAuthenticatedDriveClient } from './oauth';
import { classifyDriveHierarchy, DriveItemRaw } from './hierarchy';
import { recognizePracticalFolderName } from './practical-recognizer';
import { createAdminClient } from '@/lib/supabase/admin';
import { SyncStatus } from '@/types/database.types';
import type { drive_v3 } from 'googleapis';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface SyncResult {
  success: boolean;
  jobType: 'initial' | 'incremental' | 'manual';
  status: SyncStatus;
  foldersDiscovered: number;
  filesDiscovered: number;
  warnings: string[];
  errors: string[];
  completedAt: string;
}

// In-memory sync lock to prevent concurrent sync executions
let isSyncInProgress = false;

/**
 * Executes a full or incremental metadata sync from Google Drive to Supabase PostgreSQL
 */
export async function runDriveSync(
  options: {
    jobType?: 'initial' | 'incremental' | 'manual';
    rootFolderId?: string;
    encryptedRefreshToken?: string;
    isMockFallbackAllowed?: boolean;
  } = {}
): Promise<SyncResult> {
  const {
    jobType = 'manual',
    rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    encryptedRefreshToken,
    isMockFallbackAllowed = true,
  } = options;

  if (isSyncInProgress) {
    return {
      success: false,
      jobType,
      status: 'in_progress',
      foldersDiscovered: 0,
      filesDiscovered: 0,
      warnings: ['A synchronization job is already running in the background.'],
      errors: [],
      completedAt: new Date().toISOString(),
    };
  }

  isSyncInProgress = true;
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const supabase = createAdminClient();

    // Check if real Google credentials exist
    if (encryptedRefreshToken && rootFolderId) {
      try {
        const drive = getAuthenticatedDriveClient(encryptedRefreshToken);

        // Fetch all items under root recursively using Drive API v3
        const allItems: DriveItemRaw[] = [];
        let currentToken: string | undefined = undefined;

        while (true) {
          const listResult: { data: drive_v3.Schema$FileList } = await drive.files.list({
            pageSize: 1000,
            fields: 'nextPageToken, files(id, name, mimeType, parents, modifiedTime, size, webViewLink, trashed)',
            q: 'trashed = false',
            pageToken: currentToken,
          });

          const files = listResult.data.files || [];
          for (const f of files) {
            if (f.id && f.name && f.mimeType) {
              allItems.push({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                parents: f.parents || undefined,
                modifiedTime: f.modifiedTime || undefined,
                size: f.size || undefined,
                webViewLink: f.webViewLink || undefined,
                trashed: f.trashed || false,
              });
            }
          }

          if (!listResult.data.nextPageToken) {
            break;
          }
          currentToken = listResult.data.nextPageToken;
        }

        // Build item lookup and parent-children index
        const itemMap = new Map<string, DriveItemRaw>();
        const childrenMap = new Map<string, string[]>();

        for (const item of allItems) {
          itemMap.set(item.id, item);
          const parentId = item.parents?.[0] || rootFolderId;
          const existing = childrenMap.get(parentId) || [];
          existing.push(item.id);
          childrenMap.set(parentId, existing);
        }

        // 1. Process Academic Programs & Semesters (e.g. BSSE -> SE 3rd, SE 5th)
        const rootChildren = childrenMap.get(rootFolderId) || [];
        const programFolders = rootChildren
          .map((id) => itemMap.get(id))
          .filter(
            (item): item is DriveItemRaw =>
              !!item &&
              item.mimeType === FOLDER_MIME &&
              ['BSSE', 'BSCS', 'BSIT', 'SE', 'CS', 'IT'].some((p) =>
                item.name.toUpperCase().includes(p)
              )
          );

        // Fallback: If no top-level named BSSE/BSCS/BSIT, treat all root folders with subfolders as academic programs
        const effectiveProgramFolders =
          programFolders.length > 0
            ? programFolders
            : rootChildren
                .map((id) => itemMap.get(id))
                .filter((item): item is DriveItemRaw => !!item && item.mimeType === FOLDER_MIME);

        const groupsToInsert: Array<{
          drive_folder_id: string;
          name: string;
          relative_path: string;
        }> = [];
        const semToSubjMap = new Map<string, string[]>();

        for (const prog of effectiveProgramFolders) {
          const progCleanName = prog.name.trim();
          const semFolderIds = childrenMap.get(prog.id) || [];

          for (const semId of semFolderIds) {
            const sem = itemMap.get(semId);
            if (!sem || sem.mimeType !== FOLDER_MIME) continue;

            const semCleanName = sem.name.trim();
            const groupName = `${progCleanName} - ${semCleanName}`;

            groupsToInsert.push({
              drive_folder_id: sem.id,
              name: groupName,
              relative_path: `${progCleanName} / ${semCleanName}`,
            });

            semToSubjMap.set(sem.id, childrenMap.get(sem.id) || []);
          }
        }

        let totalDiscoveredGroups = 0;
        let totalDiscoveredSubjects = 0;
        let totalDiscoveredPracticals = 0;
        let totalDiscoveredFiles = 0;

        if (supabase && groupsToInsert.length > 0) {
          // Upsert Academic Groups
          const { data: insertedGroups, error: groupErr } = await supabase
            .from('academic_groups')
            .upsert(groupsToInsert, { onConflict: 'drive_folder_id' })
            .select('id, drive_folder_id');

          if (groupErr) {
            warnings.push(`Groups persistence error: ${groupErr.message}`);
          }

          const groupIdMap = new Map<string, string>();
          (insertedGroups || []).forEach((g) => groupIdMap.set(g.drive_folder_id, g.id));
          totalDiscoveredGroups = (insertedGroups || []).length;

          // 2. Process Subjects
          const subjectsToInsert: Array<{
            drive_folder_id: string;
            name: string;
            academic_group_id: string;
            expected_practicals: number;
          }> = [];
          const subjToPracticalMap = new Map<string, string[]>();

          for (const [semId, subjIds] of semToSubjMap.entries()) {
            const academicGroupId = groupIdMap.get(semId);
            if (!academicGroupId) continue;

            for (const subjId of subjIds) {
              const subj = itemMap.get(subjId);
              if (!subj || subj.mimeType !== FOLDER_MIME) continue;

              subjectsToInsert.push({
                drive_folder_id: subj.id,
                name: subj.name.trim(),
                academic_group_id: academicGroupId,
                expected_practicals: 10,
              });

              subjToPracticalMap.set(subj.id, childrenMap.get(subj.id) || []);
            }
          }

          if (subjectsToInsert.length > 0) {
            const { data: insertedSubjects, error: subjErr } = await supabase
              .from('subjects')
              .upsert(subjectsToInsert, { onConflict: 'drive_folder_id' })
              .select('id, drive_folder_id');

            if (subjErr) {
              warnings.push(`Subjects persistence error: ${subjErr.message}`);
            }

            const subjIdMap = new Map<string, string>();
            (insertedSubjects || []).forEach((s) => subjIdMap.set(s.drive_folder_id, s.id));
            totalDiscoveredSubjects = (insertedSubjects || []).length;

            // 3. Process Practical Folders
            const practicalsToInsert: Array<{
              drive_folder_id: string;
              name: string;
              subject_id: string;
              practical_number: number;
              classification_status: 'identified' | 'unmatched';
              drive_modified_time: string;
            }> = [];
            const practicalToFileMap = new Map<string, string[]>();

            for (const [subjDriveId, pIds] of subjToPracticalMap.entries()) {
              const subjectId = subjIdMap.get(subjDriveId);
              if (!subjectId) continue;

              for (const pId of pIds) {
                const p = itemMap.get(pId);
                if (!p || p.mimeType !== FOLDER_MIME) continue;

                const labRec = recognizePracticalFolderName(p.name);
                practicalsToInsert.push({
                  drive_folder_id: p.id,
                  name: p.name.trim(),
                  subject_id: subjectId,
                  practical_number: labRec.practicalNumber || 1,
                  classification_status: labRec.isPractical ? 'identified' : 'unmatched',
                  drive_modified_time: p.modifiedTime || new Date().toISOString(),
                });

                practicalToFileMap.set(p.id, childrenMap.get(p.id) || []);
              }
            }

            if (practicalsToInsert.length > 0) {
              const { data: insertedPracticals, error: pErr } = await supabase
                .from('practical_folders')
                .upsert(practicalsToInsert, { onConflict: 'drive_folder_id' })
                .select('id, drive_folder_id');

              if (pErr) {
                warnings.push(`Practicals persistence error: ${pErr.message}`);
              }

              const practicalIdMap = new Map<string, string>();
              (insertedPracticals || []).forEach((p) =>
                practicalIdMap.set(p.drive_folder_id, p.id)
              );
              totalDiscoveredPracticals = (insertedPracticals || []).length;

              // 4. Process Submission Files
              const filesToInsert: Array<{
                drive_file_id: string;
                practical_folder_id: string;
                name: string;
                extension: string | null;
                mime_type: string | null;
                file_size: number | null;
                web_view_link: string | null;
                drive_modified_time: string;
              }> = [];

              for (const [pDriveId, fileIds] of practicalToFileMap.entries()) {
                const practicalFolderId = practicalIdMap.get(pDriveId);
                if (!practicalFolderId) continue;

                for (const fId of fileIds) {
                  const f = itemMap.get(fId);
                  if (!f || f.mimeType === FOLDER_MIME) continue;

                  const extMatch = f.name.match(/\.([0-9a-z]+)$/i);
                  filesToInsert.push({
                    drive_file_id: f.id,
                    practical_folder_id: practicalFolderId,
                    name: f.name.trim(),
                    extension: extMatch ? extMatch[1].toLowerCase() : null,
                    mime_type: f.mimeType || null,
                    file_size: f.size ? parseInt(f.size, 10) : null,
                    web_view_link: f.webViewLink || null,
                    drive_modified_time: f.modifiedTime || new Date().toISOString(),
                  });
                }
              }

              // Batch in chunks of 200
              const CHUNK_SIZE = 200;
              for (let i = 0; i < filesToInsert.length; i += CHUNK_SIZE) {
                const chunk = filesToInsert.slice(i, i + CHUNK_SIZE);
                const { error: fErr } = await supabase
                  .from('submission_files')
                  .upsert(chunk, { onConflict: 'drive_file_id' });
                if (fErr) {
                  warnings.push(`Files chunk persistence error: ${fErr.message}`);
                }
              }
              totalDiscoveredFiles = filesToInsert.length;
            }
          }
        }

        // If Supabase is connected, update connection metadata and record sync job
        if (supabase) {
          await supabase
            .from('drive_connections')
            .update({
              sync_status: 'successful',
              last_successful_sync: new Date().toISOString(),
              last_attempted_sync: new Date().toISOString(),
              last_error_message: null,
            })
            .eq('root_folder_id', rootFolderId);

          await supabase.from('sync_jobs').insert({
            job_type: jobType,
            status: 'completed',
            folders_discovered: totalDiscoveredGroups + totalDiscoveredSubjects + totalDiscoveredPracticals,
            files_discovered: totalDiscoveredFiles,
            errors,
            warnings,
            completed_at: new Date().toISOString(),
          });
        }

        return {
          success: true,
          jobType,
          status: 'successful',
          foldersDiscovered: totalDiscoveredGroups + totalDiscoveredSubjects + totalDiscoveredPracticals,
          filesDiscovered: totalDiscoveredFiles,
          warnings,
          errors,
          completedAt: new Date().toISOString(),
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Google Drive API error: ${errorMsg}`);

        if (supabase) {
          await supabase
            .from('drive_connections')
            .update({
              sync_status: 'failed',
              last_attempted_sync: new Date().toISOString(),
              last_error_message: errorMsg,
            })
            .eq('root_folder_id', rootFolderId || '');
        }

        return {
          success: false,
          jobType,
          status: 'failed',
          foldersDiscovered: 0,
          filesDiscovered: 0,
          warnings,
          errors,
          completedAt: new Date().toISOString(),
        };
      }
    }

    // Fallback: If external Google Cloud or Supabase credentials are not supplied
    if (!rootFolderId && !isMockFallbackAllowed) {
      return {
        success: false,
        jobType,
        status: 'awaiting_authorization',
        foldersDiscovered: 0,
        filesDiscovered: 0,
        warnings: ['Google Drive Root Folder ID is not configured.'],
        errors: [],
        completedAt: new Date().toISOString(),
      };
    }

    // Safe simulated result for local development demonstration
    return {
      success: true,
      jobType,
      status: 'successful',
      foldersDiscovered: 18,
      filesDiscovered: 85,
      warnings: ['Running with simulated college Drive data. Connect Google Drive in Settings to sync live data.'],
      errors: [],
      completedAt: new Date().toISOString(),
    };
  } finally {
    isSyncInProgress = false;
  }
}
