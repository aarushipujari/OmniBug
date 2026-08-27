import React from 'react';
import { BugStatus, BugResolution } from '../../types/index.js';

interface StatusBadgeProps {
  status: BugStatus;
  resolution?: BugResolution;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, resolution, className = '', size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'UNCONFIRMED':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
          label: 'UNCONFIRMED',
        };
      case 'NEW':
        return {
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400',
          label: 'NEW',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/35',
          dot: 'bg-indigo-400',
          label: 'IN PROGRESS',
        };
      case 'IN_REVIEW':
        return {
          bg: 'bg-purple-500/15 text-purple-200 border-purple-500/35',
          dot: 'bg-purple-400',
          label: 'IN REVIEW',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: resolution ? `RESOLVED (${resolution})` : 'RESOLVED',
        };
      case 'VERIFIED':
        return {
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          dot: 'bg-teal-400',
          label: 'VERIFIED',
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
          dot: 'bg-slate-500',
          label: resolution ? `CLOSED (${resolution})` : 'CLOSED',
        };
      case 'REOPENED':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400 animate-pulse',
          label: 'REOPENED',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono rounded-full border shadow-xs transition-colors duration-150 ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
