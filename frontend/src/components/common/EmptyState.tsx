import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 my-6 rounded-2xl border border-dashed border-slate-200 bg-white shadow-xs max-w-lg mx-auto transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-slate-500 transition-colors">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-1.5 font-sans">
        {title}
      </h3>

      <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-sm mb-6 font-sans">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition-all duration-150 active:scale-[0.98] shadow-xs"
            >
              {secondaryActionLabel}
            </button>
          )}

          {actionLabel && onAction && (
            <button
              onClick={onAction}
              type="button"
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs text-xs font-medium transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
