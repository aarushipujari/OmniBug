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
          icon: <HelpCircle className="w-3 h-3 text-amber-400" />,
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          symbol: '?',
        };
      case '+':
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          symbol: '+',
        };
      case '-':
        return {
          icon: <XCircle className="w-3 h-3 text-rose-400" />,
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          symbol: '-',
        };
      case 'X':
        return {
          icon: null,
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          symbol: 'X',
        };
    }
  };

  const config = getStatusDisplay();

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded border transition-all hover:brightness-125 ${config.bg} ${className}`}
      title={`${flag.name}${flag.status} requested from ${flag.requesteeName} by ${flag.setterName}`}
    >
      {flag.name === 'security-audit' ? (
        <ShieldAlert className="w-3 h-3 text-amber-400" />
      ) : (
        config.icon
      )}
      <span className="font-semibold">{flag.name}</span>
      <span className="font-bold text-xs">{config.symbol}</span>
      <span className="text-[10px] text-slate-400 opacity-80 max-w-[80px] truncate">
        ({flag.requesteeName.split(' ')[0]})
      </span>
    </button>
  );
};
