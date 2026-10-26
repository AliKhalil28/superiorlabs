import { PracticalStatus } from '@/types/database.types';

export interface PracticalRecognitionResult {
  isPractical: boolean;
  practicalNumber: number | null;
  normalizedName: string;
  status: PracticalStatus;
  confidence: number;
}

/**
 * Recognizes and normalizes practical folder names.
 * Handles variations such as:
 * - "Lab 1", "Lab 01", "Lab-1", "Lab_1", "Lab01", "Lab 10"
 * - "Practical 1", "Practical 01", "Practical-1"
 * - "Experiment 1", "Experiment 01", "Exp 1", "Exp-01"
 * - "Task 1", "Assignment 1" (flagged for review)
 */
export function recognizePracticalFolderName(name: string): PracticalRecognitionResult {
  const trimmed = name.trim();

  // Pattern 1: High confidence standard Lab / Practical / Experiment patterns
  // e.g. "Lab 1", "Lab 01", "Lab-1", "Practical 1", "Experiment 2", "Exp 3"
  const standardMatch = trimmed.match(
    /^(?:lab|practical|experiment|exp)[_\s\-#.]*0*([1-9]\d*)\b/i
  );

  if (standardMatch) {
    const num = parseInt(standardMatch[1], 10);
    return {
      isPractical: true,
      practicalNumber: num,
      normalizedName: `Lab ${num}`,
      status: 'identified',
      confidence: 1.0,
    };
  }

  // Pattern 2: Suffix format e.g. "01 Lab", "1 - Lab", "1. Lab"
  const suffixMatch = trimmed.match(
    /^0*([1-9]\d*)[_\s\-.]+(?:lab|practical|experiment|exp)\b/i
  );

  if (suffixMatch) {
    const num = parseInt(suffixMatch[1], 10);
    return {
      isPractical: true,
      practicalNumber: num,
      normalizedName: `Lab ${num}`,
      status: 'identified',
      confidence: 0.95,
    };
  }

  // Pattern 3: Ambiguous or generic numbers e.g. "Lab Final", "Lab Midterm", "Project", "Viva"
  if (/^(?:lab|practical|experiment)\b/i.test(trimmed)) {
    return {
      isPractical: true,
      practicalNumber: null,
      normalizedName: trimmed,
      status: 'needs_review',
      confidence: 0.6,
    };
  }

  // Pattern 4: Task or Activity numbers e.g. "Task 1", "Activity 2" -> Flag for review
  const taskMatch = trimmed.match(/^(?:task|activity|assignment)[_\s\-#.]*0*([1-9]\d*)\b/i);
  if (taskMatch) {
    const num = parseInt(taskMatch[1], 10);
    return {
      isPractical: true,
      practicalNumber: num,
      normalizedName: `Practical ${num} (${trimmed})`,
      status: 'needs_review',
      confidence: 0.5,
    };
  }

  // Not recognized as a practical folder
  return {
    isPractical: false,
    practicalNumber: null,
    normalizedName: trimmed,
    status: 'ambiguous',
    confidence: 0.0,
  };
}
