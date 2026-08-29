import React from 'react';
import { useApp, ToastNotification } from '../../context/AppContext.js';
import { CheckCircle2, AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { activeToasts, dismissToast } = useApp();

  if (!activeToasts || activeToasts.length === 0) return null;

  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-slate-900/95 shadow-emerald-950/30';
      case 'alert':
        return 'border-rose-500/40 bg-slate-900/95 shadow-rose-950/30';
      case 'warning':
        return 'border-amber-500/40 bg-slate-900/95 shadow-amber-950/30';
      default:
        return 'border-sky-500/40 bg-slate-900/95 shadow-sky-950/30';
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none font-sans"
    >
      {activeToasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in ${getBorderColor(
            toast.type
          )}`}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-slate-100 font-sans leading-tight">
              {toast.title}
            </div>
            {toast.message && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed line-clamp-2 font-normal font-sans">
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
