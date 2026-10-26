import React from 'react';
import Link from 'next/link';
import { StatusBadge, PracticalDisplayStatus } from '@/components/shared/StatusBadge';
import { Folder, FolderCheck, FolderX, FolderOpen, ChevronRight, FileText, Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface PracticalFolderCardProps {
  id: string;
  name: string;
  practicalNumber: number | null;
  status: PracticalDisplayStatus;
  fileCount: number;
  lastModified: string | null;
  subjectId: string;
  isVirtualPlaceholder?: boolean;
}

export const PracticalFolderCard: React.FC<PracticalFolderCardProps> = ({
  id,
  name,
  practicalNumber,
  status,
  fileCount,
  lastModified,
  subjectId,
  isVirtualPlaceholder = false,
}) => {
  const isMissing = status === 'folder_missing';
  const isPopulated = status === 'submissions_available';
  const isEmpty = status === 'no_submissions';

  const cardContent = (
    <div
      className={cn(
        'group relative p-4 rounded-xl border transition-all text-left flex flex-col justify-between h-full',
        isMissing
          ? 'border-dashed border-slate-300 bg-slate-50/60 opacity-80'
          : isPopulated
          ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
          : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-md'
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                isMissing
                  ? 'bg-slate-200 text-slate-500'
                  : isPopulated
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              )}
            >
              {isMissing ? (
                <FolderX className="w-5 h-5" />
              ) : isPopulated ? (
                <FolderCheck className="w-5 h-5" />
              ) : (
                <Folder className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                {name}
              </h3>
              {practicalNumber !== null && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Practical #{practicalNumber}
                </span>
              )}
            </div>
          </div>

          <StatusBadge status={status} showIcon={false} />
        </div>

        <div className="space-y-1.5 py-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <FileText className="w-3.5 h-3.5" />
              Submission Files
            </span>
            <span className="font-semibold text-slate-900">
              {isMissing ? 'Not Found' : `${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
            </span>
          </div>

          {!isMissing && lastModified && (
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Last Modified
              </span>
              <span className="text-slate-700">{formatDate(lastModified)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {isMissing ? (
          <span className="text-[11px] text-slate-400 italic">
            Create folder in Google Drive to track
          </span>
        ) : (
          <>
            <span className="font-medium text-blue-700 group-hover:underline flex items-center gap-1">
              View student submissions
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
          </>
        )}
      </div>
    </div>
  );

  if (isMissing || isVirtualPlaceholder) {
    return cardContent;
  }

  return (
    <Link href={`/practicals/${id}`} className="block h-full focus:outline-none">
      {cardContent}
    </Link>
  );
};
