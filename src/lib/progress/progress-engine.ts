export interface PracticalFolderProgressItem {
  id: string;
  name: string;
  practicalNumber: number | null;
  status: 'submissions_available' | 'no_submissions' | 'folder_missing' | 'needs_review';
  fileCount: number;
  lastModified: string | null;
  driveFolderId: string | null;
  isVirtualPlaceholder?: boolean;
}

export interface SubjectProgressCalculation {
  subjectId: string;
  subjectName: string;
  expectedPracticals: number;
  practicalFoldersDetected: number;
  practicalFoldersCapped: number;
  missingPracticalFolders: number;
  populatedPracticalFolders: number;
  emptyPracticalFolders: number;
  totalSubmissionFiles: number;
  folderCoveragePercentage: number;
  submissionCoveragePercentage: number;
  practicals: PracticalFolderProgressItem[];
}

export interface RawPracticalInput {
  id: string;
  name: string;
  driveFolderId: string;
  practicalNumber: number | null;
  classificationStatus?: 'identified' | 'needs_review' | 'ambiguous';
  driveModifiedTime: string | null;
  files: Array<{
    id: string;
    driveFileId: string;
    isTrashed?: boolean;
  }>;
}

/**
 * Calculates subject practical folder coverage and submission coverage.
 * Ensures the 10 expected practicals invariant:
 * - Expected practicals: 10
 * - Populated practicals: practicals with >= 1 eligible submission files
 * - Empty practicals: practicals found in Drive but with 0 files
 * - Missing practicals: 10 - detected practicals (represented in UI as missing, not fake Drive rows)
 */
export function calculateSubjectProgress(
  subjectId: string,
  subjectName: string,
  rawPracticals: RawPracticalInput[],
  expectedPracticalsCount: number = 10
): SubjectProgressCalculation {
  const expectedPracticals = Math.max(1, expectedPracticalsCount);

  // Map practicals by their detected practicalNumber if available, or unique ID
  const practicalItems: PracticalFolderProgressItem[] = [];
  const coveredNumbers = new Set<number>();
  let populatedCount = 0;
  let emptyCount = 0;
  let totalFilesDiscovered = 0;

  // Track distinct Google Drive file IDs to prevent duplicate count inflation
  const seenDriveFileIds = new Set<string>();

  for (const practical of rawPracticals) {
    // Count distinct non-trashed files
    let validFilesForThisPractical = 0;
    for (const file of practical.files) {
      if (!file.isTrashed && !seenDriveFileIds.has(file.driveFileId)) {
        seenDriveFileIds.add(file.driveFileId);
        validFilesForThisPractical++;
      }
    }

    totalFilesDiscovered += validFilesForThisPractical;

    let itemStatus: PracticalFolderProgressItem['status'];
    if (practical.classificationStatus === 'needs_review' || practical.classificationStatus === 'ambiguous') {
      itemStatus = 'needs_review';
    } else if (validFilesForThisPractical > 0) {
      itemStatus = 'submissions_available';
      populatedCount++;
    } else {
      itemStatus = 'no_submissions';
      emptyCount++;
    }

    if (practical.practicalNumber !== null) {
      coveredNumbers.add(practical.practicalNumber);
    }

    practicalItems.push({
      id: practical.id,
      name: practical.name,
      practicalNumber: practical.practicalNumber,
      status: itemStatus,
      fileCount: validFilesForThisPractical,
      lastModified: practical.driveModifiedTime,
      driveFolderId: practical.driveFolderId,
      isVirtualPlaceholder: false,
    });
  }

  // Sort existing practicals by practicalNumber ascending, or by name
  practicalItems.sort((a, b) => {
    if (a.practicalNumber !== null && b.practicalNumber !== null) {
      return a.practicalNumber - b.practicalNumber;
    }
    if (a.practicalNumber !== null) return -1;
    if (b.practicalNumber !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  // Calculate high-level metrics
  const detectedCount = practicalItems.length;
  const cappedDetected = Math.min(expectedPracticals, detectedCount);
  const missingCount = Math.max(0, expectedPracticals - detectedCount);

  const folderCoverage = Math.min(100, Math.round((cappedDetected / expectedPracticals) * 1000) / 10);
  const submissionCoverage = Math.min(
    100,
    Math.round((Math.min(expectedPracticals, populatedCount) / expectedPracticals) * 1000) / 10
  );

  // Generate missing practical representation for UI (Lab 1 through 10)
  // If practical numbers 1..10 are partially present, fill in missing slots as virtual items
  const full10List: PracticalFolderProgressItem[] = [...practicalItems];
  for (let num = 1; num <= expectedPracticals; num++) {
    if (!coveredNumbers.has(num)) {
      full10List.push({
        id: `missing-slot-${num}`,
        name: `Lab ${num}`,
        practicalNumber: num,
        status: 'folder_missing',
        fileCount: 0,
        lastModified: null,
        driveFolderId: null,
        isVirtualPlaceholder: true,
      });
    }
  }

  // Sort full 10 list by practical number for consistent grid rendering
  full10List.sort((a, b) => {
    const numA = a.practicalNumber ?? 999;
    const numB = b.practicalNumber ?? 999;
    return numA - numB;
  });

  return {
    subjectId,
    subjectName,
    expectedPracticals,
    practicalFoldersDetected: detectedCount,
    practicalFoldersCapped: cappedDetected,
    missingPracticalFolders: missingCount,
    populatedPracticalFolders: populatedCount,
    emptyPracticalFolders: emptyCount,
    totalSubmissionFiles: totalFilesDiscovered,
    folderCoveragePercentage: folderCoverage,
    submissionCoveragePercentage: submissionCoverage,
    practicals: full10List,
  };
}
