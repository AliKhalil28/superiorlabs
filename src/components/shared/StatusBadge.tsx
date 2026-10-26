import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

export type PracticalDisplayStatus =
  | 'submissions_available'
  | 'no_submissions'
  | 'folder_missing'
  | 'needs_review';

interface StatusBadgeProps {
  status: PracticalDisplayStatus;
  fileCount?: number;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  fileCount,
  className,
  showIcon = true,
}) => {
  const configs = {
    submissions_available: {
      label: fileCount !== undefined ? `Submissions Available (${fileCount})` : 'Submissions Available',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    no_submissions: {
      label: 'No Submissions (Empty)',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
    },
    folder_missing: {
      label: 'Folder Missing',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
    needs_review: {
      label: 'Needs Review',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: HelpCircle,
    },
  };

  const config = configs[status] || configs.needs_review;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        config.bg,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
