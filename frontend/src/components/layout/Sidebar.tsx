import React from 'react';
import { useApp, AppView, useCurrentUser } from '../../context/AppContext.js';
import {
  Table2,
  Kanban,
  GitGraph,
  Inbox,
  Milestone,
  BarChart3,
  Flame,
  ShieldCheck,
  User,
  HelpCircle,
  DownloadCloud,
  RotateCcw,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface SidebarProps {
  onOpenImportExport: () => void;
  onOpenArchitecture?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenImportExport, onOpenArchitecture }) => {
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    allBugs,
    refreshData,
    toast,
  } = useApp();
  const currentUser = useCurrentUser();

  const handleReset = async () => {
    if (window.confirm('Reset database to original Bugzilla sample dataset?')) {
      await api.resetStore();
      await refreshData();
      toast('Database Reset', 'Restored sample products, components, bugs, and audit logs.', 'success');
    }
  };

  const navViews: { id: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'table', label: 'All Issues (Grid)', icon: <Table2 className="w-4 h-4 shrink-0" /> },
    { id: 'kanban', label: 'Kanban Board', icon: <Kanban className="w-4 h-4 shrink-0" /> },
    { id: 'graph', label: 'Dependency Graph (DAG)', icon: <GitGraph className="w-4 h-4 shrink-0 text-purple-400" /> },
    {
      id: 'triage',
      label: 'Speed Triage',
      icon: <Inbox className="w-4 h-4 shrink-0" />,
      badge: allBugs.filter(b => b.status === 'UNCONFIRMED' || b.flags.some(f => f.name === 'needinfo' && f.status === '?')).length,
    },
    { id: 'milestones', label: 'Milestones & Releases', icon: <Milestone className="w-4 h-4 shrink-0" /> },
    { id: 'analytics', label: 'Analytics & SLA', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
  ];

  const quickFilters = [
    {
      id: 'my-assigned',
      label: 'Assigned to Me',
      query: `assignee:${currentUser.name.split(' ')[0].toLowerCase()}`,
      icon: <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
      count: allBugs.filter(b => b.assigneeId === currentUser.id).length,
    },
    {
      id: 'needs-info',
      label: 'Needs My Info / Review',
      query: 'flag:needinfo',
      icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      count: allBugs.filter(b => b.flags.some(f => f.requesteeId === currentUser.id && f.status === '?')).length,
    },
    {
      id: 'blockers',
      label: 'Release Blockers',
      query: 'severity:blocker',
      icon: <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />,
      count: allBugs.filter(b => b.severity === 'blocker').length,
    },
    {
      id: 'security',
      label: 'Security Sensitive',
      query: 'is:open security',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
      count: allBugs.filter(b => b.isSecuritySensitive).length,
    },
  ];

  return (
    <aside className="w-60 border-r border-slate-200 bg-white flex flex-col justify-between p-3 select-none shrink-0 overflow-y-auto font-sans">
      <div className="space-y-6">
        {/* Workspace Views */}
        <div>
          <h2
            id="sidebar-views-heading"
            className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-2 font-mono"
          >
            Views
          </h2>
          <nav className="space-y-0.5" aria-labelledby="sidebar-views-heading">
            {navViews.map(view => {
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  aria-label={`Navigate to ${view.label}${view.badge ? ` (${view.badge} unconfirmed)` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-100 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {view.icon}
                    <span>{view.label}</span>
                  </div>
                  {view.badge !== undefined && view.badge > 0 && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {view.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Filters */}
        <div>
          <h2
            id="sidebar-filters-heading"
            className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-2 font-mono"
          >
            Filters
          </h2>
          <div className="space-y-0.5" role="group" aria-label="Quick filters">
            {quickFilters.map(filter => {
              const isSelected = searchQuery === filter.query;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSearchQuery(filter.query)}
                  aria-label={`Filter by ${filter.label}, ${filter.count} matching issues`}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-100 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {filter.icon}
                    <span className="truncate">{filter.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{filter.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="pt-3 border-t border-slate-200 space-y-1">
        {onOpenArchitecture && (
          <button
            onClick={onOpenArchitecture}
            aria-label="Open architecture and viva examiner guide"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Architecture & Spec</span>
          </button>
        )}

        <button
          onClick={onOpenImportExport}
          aria-label="Open Bugzilla XML import and export dialog"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Bugzilla XML Sync</span>
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset database to sample data"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-colors"
          title="Reset database to seed records"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset Sample Data</span>
        </button>
      </div>
    </aside>
  );
};
