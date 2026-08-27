import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="w-full divide-y divide-slate-850/60 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center px-4 py-3.5 gap-4">
          <div className="w-4 h-4 rounded bg-slate-800 shrink-0" />
          <div className="w-16 h-4 rounded bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 rounded bg-slate-800" />
            <div className="w-1/3 h-3 rounded bg-slate-850" />
          </div>
          <div className="w-28 h-4 rounded bg-slate-800 shrink-0 hidden md:block" />
          <div className="w-24 h-6 rounded-full bg-slate-800 shrink-0" />
          <div className="w-20 h-5 rounded bg-slate-800 shrink-0 hidden sm:block" />
          <div className="w-28 h-4 rounded bg-slate-800 shrink-0 hidden lg:block" />
          <div className="w-16 h-3 rounded bg-slate-800 shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-16 h-4 rounded bg-slate-800" />
            <div className="w-20 h-5 rounded-full bg-slate-800" />
          </div>
          <div className="w-full h-4 rounded bg-slate-800" />
          <div className="w-2/3 h-3 rounded bg-slate-850" />
          <div className="pt-2 border-t border-slate-850 flex justify-between items-center">
            <div className="w-20 h-3 rounded bg-slate-800" />
            <div className="w-12 h-3 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
