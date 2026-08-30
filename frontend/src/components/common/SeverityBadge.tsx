import React from 'react';
import { BugSeverity, BugPriority } from '../../types/index.js';
import { Flame, AlertTriangle, AlertCircle, Info, MinusCircle, Sparkles } from 'lucide-react';

interface SeverityBadgeProps {
  severity: BugSeverity;
  priority?: BugPriority;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  priority,
  showIcon = true,
  className = '',
  size = 'md',
}) => {
  const getConfig = () => {
    switch (severity) {
      case 'blocker':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: 'Blocker',
        };
      case 'critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: 'Critical',
        };
      case 'major':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: 'Major',
        };
      case 'normal':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
          label: 'Normal',
        };
      case 'minor':
      case 'trivial':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: severity === 'minor' ? 'Minor' : 'Trivial',
        };
      case 'enhancement':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          label: 'Enhancement',
        };
    }
  };

  const config = getConfig();
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center font-medium rounded-md border font-sans ${config.bg} ${sizeClasses} ${className}`}>
        {showIcon && config.icon}
        <span>{config.label}</span>
      </span>
      {priority && (
        <span
          className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            priority === 'P1'
              ? 'bg-red-50 text-red-700 border-red-200 font-bold'
              : priority === 'P2'
              ? 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {priority}
        </span>
      )}
    </div>
  );
};
