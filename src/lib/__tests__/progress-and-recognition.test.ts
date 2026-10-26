import { describe, it, expect } from 'vitest';
import { recognizePracticalFolderName } from '../drive/practical-recognizer';
import { calculateSubjectProgress, RawPracticalInput } from '../progress/progress-engine';

describe('Practical Name Recognizer', () => {
  it('correctly recognizes standard Lab 1, Lab 01, Lab-1', () => {
    expect(recognizePracticalFolderName('Lab 1')).toEqual({
      isPractical: true,
      practicalNumber: 1,
      normalizedName: 'Lab 1',
      status: 'identified',
      confidence: 1.0,
    });

    expect(recognizePracticalFolderName('Lab 01')).toEqual({
      isPractical: true,
      practicalNumber: 1,
      normalizedName: 'Lab 1',
      status: 'identified',
      confidence: 1.0,
    });

    expect(recognizePracticalFolderName('Lab-10')).toEqual({
      isPractical: true,
      practicalNumber: 10,
      normalizedName: 'Lab 10',
      status: 'identified',
      confidence: 1.0,
    });
  });

  it('recognizes Practical and Experiment variations', () => {
    expect(recognizePracticalFolderName('Practical 3')).toEqual({
      isPractical: true,
      practicalNumber: 3,
      normalizedName: 'Lab 3',
      status: 'identified',
      confidence: 1.0,
    });

    expect(recognizePracticalFolderName('Experiment 05')).toEqual({
      isPractical: true,
      practicalNumber: 5,
      normalizedName: 'Lab 5',
      status: 'identified',
      confidence: 1.0,
    });

    expect(recognizePracticalFolderName('Exp 2')).toEqual({
      isPractical: true,
      practicalNumber: 2,
      normalizedName: 'Lab 2',
      status: 'identified',
      confidence: 1.0,
    });
  });

  it('flags ambiguous names like Lab Final or Task 1 for review', () => {
    const finalResult = recognizePracticalFolderName('Lab Final');
    expect(finalResult.isPractical).toBe(true);
    expect(finalResult.status).toBe('needs_review');
    expect(finalResult.practicalNumber).toBeNull();

    const taskResult = recognizePracticalFolderName('Task 4');
    expect(taskResult.isPractical).toBe(true);
    expect(taskResult.status).toBe('needs_review');
    expect(taskResult.practicalNumber).toBe(4);
  });

  it('rejects general non-practical folder names', () => {
    expect(recognizePracticalFolderName('BSSE').isPractical).toBe(false);
    expect(recognizePracticalFolderName('Data Structure').isPractical).toBe(false);
    expect(recognizePracticalFolderName('Syllabus').isPractical).toBe(false);
  });
});

describe('Subject Progress Calculation Engine', () => {
  it('enforces that 25 files in Lab 1 counts as 25 files in 1 practical, not 25 practicals', () => {
    const rawPracticals: RawPracticalInput[] = [
      {
        id: 'p-1',
        name: 'Lab 1',
        driveFolderId: 'drive-folder-1',
        practicalNumber: 1,
        driveModifiedTime: '2026-10-25T10:00:00Z',
        files: Array.from({ length: 25 }, (_, i) => ({
          id: `file-${i}`,
          driveFileId: `drive-file-${i}`,
        })),
      },
    ];

    const result = calculateSubjectProgress('subj-ds', 'Data Structure', rawPracticals, 10);

    // Practical counts
    expect(result.expectedPracticals).toBe(10);
    expect(result.practicalFoldersDetected).toBe(1);
    expect(result.populatedPracticalFolders).toBe(1);
    expect(result.emptyPracticalFolders).toBe(0);
    expect(result.missingPracticalFolders).toBe(9);

    // Total files
    expect(result.totalSubmissionFiles).toBe(25);

    // Coverage metrics
    expect(result.folderCoveragePercentage).toBe(10.0); // 1 / 10 * 100
    expect(result.submissionCoveragePercentage).toBe(10.0); // 1 / 10 * 100
  });

  it('correctly categorizes empty folders vs populated folders vs missing folders', () => {
    const rawPracticals: RawPracticalInput[] = [
      {
        id: 'p-1',
        name: 'Lab 1',
        driveFolderId: 'folder-1',
        practicalNumber: 1,
        driveModifiedTime: '2026-10-25T10:00:00Z',
        files: [
          { id: 'f-1', driveFileId: 'df-1' },
          { id: 'f-2', driveFileId: 'df-2' },
        ],
      },
      {
        id: 'p-2',
        name: 'Lab 2',
        driveFolderId: 'folder-2',
        practicalNumber: 2,
        driveModifiedTime: '2026-10-25T10:00:00Z',
        files: [{ id: 'f-3', driveFileId: 'df-3' }],
      },
      {
        id: 'p-3',
        name: 'Lab 3',
        driveFolderId: 'folder-3',
        practicalNumber: 3,
        driveModifiedTime: '2026-10-25T10:00:00Z',
        files: [], // Empty practical folder
      },
    ];

    const result = calculateSubjectProgress('subj-ds', 'Data Structure', rawPracticals, 10);

    expect(result.practicalFoldersDetected).toBe(3);
    expect(result.populatedPracticalFolders).toBe(2);
    expect(result.emptyPracticalFolders).toBe(1);
    expect(result.missingPracticalFolders).toBe(7);
    expect(result.totalSubmissionFiles).toBe(3);

    expect(result.folderCoveragePercentage).toBe(30.0); // 3 / 10
    expect(result.submissionCoveragePercentage).toBe(20.0); // 2 / 10

    // Missing Lab 4 through 10 are represented virtually for UI
    const lab4 = result.practicals.find((p) => p.practicalNumber === 4);
    expect(lab4).toBeDefined();
    expect(lab4?.status).toBe('folder_missing');
    expect(lab4?.isVirtualPlaceholder).toBe(true);
    expect(lab4?.driveFolderId).toBeNull();
  });

  it('deduplicates files by driveFileId to prevent inflated file counts', () => {
    const rawPracticals: RawPracticalInput[] = [
      {
        id: 'p-1',
        name: 'Lab 1',
        driveFolderId: 'folder-1',
        practicalNumber: 1,
        driveModifiedTime: '2026-10-25T10:00:00Z',
        files: [
          { id: 'f-1', driveFileId: 'same-file-id' },
          { id: 'f-2', driveFileId: 'same-file-id' }, // Duplicate entry of the same Drive file
        ],
      },
    ];

    const result = calculateSubjectProgress('subj-ds', 'Data Structure', rawPracticals, 10);
    expect(result.totalSubmissionFiles).toBe(1);
    expect(result.populatedPracticalFolders).toBe(1);
  });

  it('calculates 100% submission coverage when 10 practicals are populated', () => {
    const rawPracticals: RawPracticalInput[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Lab ${i + 1}`,
      driveFolderId: `folder-${i + 1}`,
      practicalNumber: i + 1,
      driveModifiedTime: '2026-10-25T10:00:00Z',
      files: [{ id: `f-${i + 1}`, driveFileId: `df-${i + 1}` }],
    }));

    const result = calculateSubjectProgress('subj-ds', 'Data Structure', rawPracticals, 10);
    expect(result.practicalFoldersDetected).toBe(10);
    expect(result.populatedPracticalFolders).toBe(10);
    expect(result.missingPracticalFolders).toBe(0);
    expect(result.folderCoveragePercentage).toBe(100.0);
    expect(result.submissionCoveragePercentage).toBe(100.0);
  });
});
