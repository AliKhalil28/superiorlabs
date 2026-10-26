'use client';

import React, { useState } from 'react';
import { SyncStatus } from '@/types/database.types';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface SyncIndicatorProps {
  status: SyncStatus;
  lastSuccessfulSync: string | null;
  onRefresh?: () => Promise<void>;
  isAdmin?: boolean;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  lastSuccessfulSync,
  onRefresh,
  isAdmin = false,
  className,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const configs: Record<
    SyncStatus,
    { label: string; dot: string; icon: React.ElementType; textColor: string }
  > = {
    never_run: {
      label: 'Never Synchronized',
      dot: 'bg-slate-400',
      icon: Clock,
      textColor: 'text-slate-600',
    },
    in_progress: {
      label: 'Sync in Progress...',
      dot: 'bg-blue-500 animate-pulse',
      icon: RefreshCw,
      textColor: 'text-blue-600',
    },
    successful: {
      label: 'Synced with Google Drive',
      dot: 'bg-emerald-500',
      icon: CheckCircle,
      textColor: 'text-emerald-700',
    },
    successful_with_warnings: {
      label: 'Synced with Warnings',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      textColor: 'text-amber-700',
    },
    failed: {
      label: 'Sync Failed',
      dot: 'bg-rose-500',
      icon: XCircle,
      textColor: 'text-rose-700',
    },
    awaiting_authorization: {
      label: 'Awaiting Drive Authorization',
      dot: 'bg-purple-500',
      icon: AlertTriangle,
      textColor: 'text-purple-700',
    },
  };

  const current = configs[status] || configs.never_run;
  const Icon = current.icon;

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs text-xs',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', current.textColor)} />
        <span className={cn('font-medium', current.textColor)}>{current.label}</span>
      </div>

      <span className="text-slate-300">|</span>

      <span className="text-slate-500 text-[11px]">
        Last: {lastSuccessfulSync ? formatDate(lastSuccessfulSync) : 'Never'}
      </span>

      {isAdmin && onRefresh && (
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing || status === 'in_progress'}
          title="Trigger Drive metadata sync"
          className="ml-1 p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={cn('w-3.5 h-3.5', (isRefreshing || status === 'in_progress') && 'animate-spin')}
          />
        </button>
      )}
    </div>
  );
};
