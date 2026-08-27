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
          bg: 'bg-red-500/10 text-red-300 border-red-500/30',
          icon: <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />,
          label: 'Blocker',
        };
      case 'critical':
        return {
          bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
          label: 'Critical',
        };
      case 'major':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          label: 'Major',
        };
      case 'normal':
        return {
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
          icon: <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          label: 'Normal',
        };
      case 'minor':
      case 'trivial':
        return {
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
          icon: <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          label: severity === 'minor' ? 'Minor' : 'Trivial',
        };
      case 'enhancement':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
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
              ? 'bg-red-500/15 text-red-300 border-red-500/40 font-bold'
              : priority === 'P2'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {priority}
        </span>
      )}
    </div>
  );
};
