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
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans" role="dialog" aria-modal="true" aria-label="Notifications Drawer">
      {/* Dismissal backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-slate-900/40 backdrop-blur-xs cursor-default"
      />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-slate-400 hover:text-slate-900 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications drawer"
              className="p-1 rounded text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={CheckCheck}
                title="All caught up"
                description="You have no pending notifications or review requests."
              />
            </div>
          ) : (
            notifications.map(notif => (
              <button
                type="button"
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.bugId) {
                    setSelectedBugId(notif.bugId);
                    onClose();
                  }
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  notif.read
                    ? 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-sans ${notif.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.bugId && (
                      <div className="mt-1.5 text-[10px] font-mono text-slate-700 hover:underline">
                        View issue →
                      </div>
                    )}
                  </div>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
