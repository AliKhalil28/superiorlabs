import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  subtext?: string;
  variant?: 'blue' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  showPercentageText?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  subtext,
  variant = 'blue',
  size = 'md',
  showPercentageText = true,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));

  const variantStyles = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentageText) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showPercentageText && (
            <span className="font-semibold text-slate-900">{clamped.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightStyles[size])}>
        <div
          className={cn('h-full transition-all duration-500 ease-out rounded-full', variantStyles[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {subtext && <p className="text-[11px] text-slate-500">{subtext}</p>}
    </div>
  );
};
