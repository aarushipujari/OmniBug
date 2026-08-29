import React from 'react';
import { useApp, AppView } from '../../context/AppContext.js';
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
    currentUser,
    allBugs,
    refreshData,
    toast,
  } = useApp();

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
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-between p-3 select-none shrink-0 overflow-y-auto font-sans">
      <div className="space-y-5">
        {/* Section 1: Workspace Views Container */}
        <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-850/60 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1.5 flex items-center gap-1.5 font-mono">
            <Layers className="w-3 h-3 text-slate-400" /> Workspace Views
          </div>
          <nav className="space-y-0.5" aria-label="Workspace views">
            {navViews.map(view => {
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  aria-label={`Navigate to ${view.label}${view.badge ? ` (${view.badge} unconfirmed)` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {view.icon}
                    <span>{view.label}</span>
                  </div>
                  {view.badge !== undefined && view.badge > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {view.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Smart Filters Container */}
        <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-850/60 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1.5 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3 h-3 text-slate-400" /> Smart Filters
          </div>
          <div className="space-y-0.5" role="group" aria-label="Quick filters">
            {quickFilters.map(filter => {
              const isSelected = searchQuery === filter.query;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSearchQuery(filter.query)}
                  aria-label={`Filter by ${filter.label}, ${filter.count} matching issues`}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {filter.icon}
                    <span className="truncate">{filter.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-medium">{filter.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Utilities with Subtle Divider */}
      <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
        {onOpenArchitecture && (
          <button
            onClick={onOpenArchitecture}
            aria-label="Open architecture and viva examiner guide"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-300 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 transition-all duration-150 active:scale-[0.98] font-medium shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Architecture & Viva Guide</span>
          </button>
        )}

        <button
          onClick={onOpenImportExport}
          aria-label="Open Bugzilla XML import and export dialog"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition-all duration-150 active:scale-[0.98]"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Bugzilla XML Sync</span>
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset in-memory and disk database to initial seed data"
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-150 active:scale-[0.98]"
          title="Reset database to seed records"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset Sample Data</span>
        </button>

        <div className="px-2 pt-1 text-[10px] text-slate-600 font-mono">
          OmniBug Core v2.4 • In-Memory & Disk
        </div>
      </div>
    </aside>
  );
};
