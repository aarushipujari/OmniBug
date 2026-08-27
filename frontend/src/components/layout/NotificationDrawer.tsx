import React from 'react';
import { useApp, NotificationItem } from '../../context/AppContext.js';
import { X, Bell, HelpCircle, ShieldAlert, CheckCircle2, CheckCheck } from 'lucide-react';
import { EmptyState } from '../common/EmptyState.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, setSelectedBugId } = useApp();

  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'warning':
        return <HelpCircle className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850 shadow-xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Live Activity & Notifications</h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {notifications.filter(n => !n.read).length} new
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={CheckCheck}
                title="All caught up!"
                description="You have no pending unread notifications, review requests, or SLA warnings."
              />
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.bugId) {
                    setSelectedBugId(notif.bugId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                  notif.read
                    ? 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-850'
                    : 'bg-slate-850 border-emerald-500/30 text-slate-200 shadow-sm hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-xs text-slate-200 truncate">{notif.title}</div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                      {notif.message}
                    </p>
                    {notif.bugId && (
                      <div className="mt-2 inline-flex items-center text-[10px] font-mono text-emerald-400 hover:underline">
                        Jump to issue →
                      </div>
                    )}
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
