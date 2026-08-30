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
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: 'UNCONFIRMED',
        };
      case 'NEW':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'NEW',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'IN PROGRESS',
        };
      case 'IN_REVIEW':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'IN REVIEW',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: resolution ? `RESOLVED (${resolution})` : 'RESOLVED',
        };
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'VERIFIED',
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          label: resolution ? `CLOSED (${resolution})` : 'CLOSED',
        };
      case 'REOPENED':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          label: 'REOPENED',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
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
