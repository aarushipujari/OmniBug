import React from 'react';
import { BugFlag } from '../../types/index.js';
import { HelpCircle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface FlagBadgeProps {
  flag: BugFlag;
  onClick?: () => void;
  className?: string;
}

export const FlagBadge: React.FC<FlagBadgeProps> = ({ flag, onClick, className = '' }) => {
  const getStatusDisplay = () => {
    switch (flag.status) {
      case '?':
        return {
          icon: <HelpCircle className="w-3 h-3 text-slate-500" />,
          bg: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80',
          symbol: '?',
        };
      case '+':
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
          symbol: '+',
        };
      case '-':
        return {
          icon: <XCircle className="w-3 h-3 text-red-600" />,
          bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80',
          symbol: '-',
        };
      case 'X':
        return {
          icon: null,
          bg: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/80',
          symbol: 'X',
        };
    }
  };

  const config = getStatusDisplay();

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded border transition-all ${config.bg} ${className}`}
      title={`${flag.name}${flag.status} requested from ${flag.requesteeName} by ${flag.setterName}`}
    >
      {flag.name === 'security-audit' ? (
        <ShieldAlert className="w-3 h-3 text-red-600" />
      ) : (
        config.icon
      )}
      <span className="font-semibold">{flag.name}</span>
      <span className="font-bold text-xs">{config.symbol}</span>
      <span className="text-[10px] text-slate-500 opacity-80 max-w-[80px] truncate">
        ({flag.requesteeName.split(' ')[0]})
      </span>
    </button>
  );
};
