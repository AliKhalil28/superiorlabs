import { recognizePracticalFolderName } from './practical-recognizer';
import { NodeClassification } from '@/types/database.types';

export interface DriveItemRaw {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  trashed?: boolean;
}

export interface ClassifiedNode {
  id: string;
  name: string;
  mimeType: string;
  parentDriveId: string | null;
  classification: NodeClassification;
  confidence: number;
  depth: number;
  relativePath: string;
  practicalNumber: number | null;
  modifiedTime?: string;
  size?: number;
  webViewLink?: string;
  isTrashed: boolean;
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Classifies a hierarchy of Google Drive items into:
 * - academic_group (Programs, classes, semesters)
 * - subject (Courses)
 * - practical_folder (Lab 1..10)
 * - submission_file (Student files)
 */
export function classifyDriveHierarchy(
  rootFolderId: string,
  items: DriveItemRaw[],
  customRules?: Array<{ pattern: string; targetType: string; depth?: number }>
): ClassifiedNode[] {
  // Build parent-child lookup
  const itemMap = new Map<string, DriveItemRaw>();
  const childrenMap = new Map<string, string[]>();

  for (const item of items) {
    itemMap.set(item.id, item);
    const parentId = item.parents?.[0] || rootFolderId;
    const existing = childrenMap.get(parentId) || [];
    existing.push(item.id);
    childrenMap.set(parentId, existing);
  }

  const classified: ClassifiedNode[] = [];

  // Recursive traversal to establish depths and paths
  function traverse(currentId: string, currentDepth: number, currentPath: string) {
    const childIds = childrenMap.get(currentId) || [];

    for (const childId of childIds) {
      const child = itemMap.get(childId);
      if (!child) continue;

      const isFolder = child.mimeType === FOLDER_MIME;
      const childPath = currentPath ? `${currentPath} / ${child.name}` : child.name;

      if (!isFolder) {
        // Non-folder item: submission file
        classified.push({
          id: child.id,
          name: child.name,
          mimeType: child.mimeType,
          parentDriveId: currentId,
          classification: 'submission_file',
          confidence: 1.0,
          depth: currentDepth,
          relativePath: childPath,
          practicalNumber: null,
          modifiedTime: child.modifiedTime,
          size: child.size ? parseInt(child.size, 10) : undefined,
          webViewLink: child.webViewLink,
          isTrashed: Boolean(child.trashed),
        });
        continue;
      }

      // Check if folder is recognized as a practical folder (e.g. Lab 1, Practical 01)
      const practicalRec = recognizePracticalFolderName(child.name);

      let classification: NodeClassification = 'unclassified';
      let confidence = 0.8;
      let practicalNumber: number | null = null;

      // 1. Check custom administrator rules first if provided
      let matchedRule = false;
      if (customRules) {
        for (const rule of customRules) {
          if (new RegExp(rule.pattern, 'i').test(child.name)) {
            if (rule.depth === undefined || rule.depth === currentDepth) {
              classification = rule.targetType as NodeClassification;
              confidence = 1.0;
              matchedRule = true;
              break;
            }
          }
        }
      }

      if (!matchedRule) {
        if (practicalRec.isPractical) {
          classification = 'practical_folder';
          confidence = practicalRec.confidence;
          practicalNumber = practicalRec.practicalNumber;
        } else {
          // If child contains practical folders or files directly, it's very likely a Subject
          const grandchildrenIds = childrenMap.get(child.id) || [];
          const hasPracticalChildren = grandchildrenIds.some((gcId) => {
            const gc = itemMap.get(gcId);
            return gc && gc.mimeType === FOLDER_MIME && recognizePracticalFolderName(gc.name).isPractical;
          });

          if (hasPracticalChildren) {
            classification = 'subject';
            confidence = 0.95;
          } else {
            // Check name patterns for semesters or academic groups
            const isSemesterOrProgram =
              /(?:semester|sem|bs|se|cs|it|bba|group|class|morning|evening|fall|spring)\b/i.test(child.name) ||
              /\d+(?:st|nd|rd|th)\b/i.test(child.name);

            if (isSemesterOrProgram) {
              classification = 'academic_group';
              confidence = 0.9;
            } else if (grandchildrenIds.length > 0) {
              // Intermediate grouping folder
              classification = 'academic_group';
              confidence = 0.7;
            } else {
              // Leaf folder that is not recognized as a practical -> subject or ambiguous
              classification = 'subject';
              confidence = 0.5;
            }
          }
        }
      }

      classified.push({
        id: child.id,
        name: child.name,
        mimeType: child.mimeType,
        parentDriveId: currentId,
        classification,
        confidence,
        depth: currentDepth,
        relativePath: childPath,
        practicalNumber,
        modifiedTime: child.modifiedTime,
        webViewLink: child.webViewLink,
        isTrashed: Boolean(child.trashed),
      });

      // Recurse down children
      traverse(child.id, currentDepth + 1, childPath);
    }
  }

  traverse(rootFolderId, 1, '');
  return classified;
}
