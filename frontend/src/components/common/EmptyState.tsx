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
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 my-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 backdrop-blur-xs max-w-lg mx-auto transition-all ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-center mb-4 shadow-inner shadow-slate-950/50 text-slate-400 group-hover:text-emerald-400 transition-colors">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="text-sm font-semibold text-slate-100 tracking-tight mb-1.5 font-sans">
        {title}
      </h3>

      <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-sm mb-6 font-sans">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-all duration-150 active:scale-[0.98]"
            >
              {secondaryActionLabel}
            </button>
          )}

          {actionLabel && onAction && (
            <button
              onClick={onAction}
              type="button"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 text-xs font-medium transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
