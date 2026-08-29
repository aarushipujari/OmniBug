import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { BugStatus } from '../../types/index.js';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { FlagBadge } from '../common/FlagBadge.js';
import { EmptyState } from '../common/EmptyState.js';
import { Flame, MessageSquare, Clock, Shield, Plus, Kanban as KanbanIcon, Sparkles } from 'lucide-react';
import { api } from '../../services/api.js';

interface KanbanColumn {
  status: BugStatus;
  label: string;
  dotColor: string;
  description: string;
}

const COLUMNS: KanbanColumn[] = [
  { status: 'UNCONFIRMED', label: 'Triage / Unconfirmed', dotColor: 'bg-amber-400', description: 'Incoming bugs needing maintainer verification' },
  { status: 'NEW', label: 'Confirmed / Backlog', dotColor: 'bg-sky-400', description: 'Reproduced and ready for dev assignment' },
  { status: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-indigo-400', description: 'Active implementation in progress' },
  { status: 'IN_REVIEW', label: 'In Review & Testing', dotColor: 'bg-purple-400', description: 'Patch uploaded and pending review? flags' },
  { status: 'RESOLVED', label: 'Resolved / Fixed', dotColor: 'bg-emerald-400', description: 'Patch landed, waiting on qa-verify' },
  { status: 'CLOSED', label: 'Closed / Verified', dotColor: 'bg-slate-500', description: 'Lifecycle complete and verified in release' },
];

export const KanbanView: React.FC = () => {
  const {
    bugs,
    setSelectedBugId,
    currentUser,
    refreshData,
    toast,
    setIsCreateModalOpen,
    setSearchQuery,
  } = useApp();

  const [draggedBugId, setDraggedBugId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, bugId: string) => {
    e.dataTransfer.setData('text/plain', bugId);
    setDraggedBugId(bugId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault();
    const bugId = e.dataTransfer.getData('text/plain') || draggedBugId;
    if (!bugId) return;

    const bug = bugs.find(b => b.id === bugId);
    if (!bug || bug.status === targetStatus) {
      setDraggedBugId(null);
      return;
    }

    try {
      const resolution = targetStatus === 'RESOLVED' || targetStatus === 'CLOSED' ? 'FIXED' : undefined;
      await api.updateBug(bug.id, { status: targetStatus, resolution }, currentUser);
      toast('Lifecycle Updated', `Moved #${bug.bugNumber} to ${targetStatus}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Lifecycle Rule Violation', err.message, 'alert');
    } finally {
      setDraggedBugId(null);
    }
  };

  if (bugs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
        <EmptyState
          icon={KanbanIcon}
          title="No issues on the board"
          description="Your current filter has zero matching issues across the Bugzilla lifecycle columns."
          actionLabel="Create New Bug"
          onAction={() => setIsCreateModalOpen(true)}
          secondaryActionLabel="Clear Filters"
          onSecondaryAction={() => setSearchQuery('')}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden select-none font-sans animate-in fade-in duration-200">
      {/* Board Header Info */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-200">Lifecycle Kanban Workflow</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Drag cards between columns to advance Bugzilla states
          </span>
        </div>
        <div className="text-xs text-slate-400 font-normal">
          Total in pipeline: <span className="text-emerald-400 font-bold font-mono">{bugs.length}</span>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start">
        {COLUMNS.map(col => {
          const colBugs = bugs.filter(b => {
            if (col.status === 'RESOLVED') {
              return b.status === 'RESOLVED' || b.status === 'VERIFIED';
            }
            return b.status === col.status;
          });

          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.status)}
              className="w-80 shrink-0 bg-slate-900/70 border border-slate-800/80 rounded-xl flex flex-col max-h-full shadow-lg transition-all"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-850/60 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-xs text-slate-200">{col.label}</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {colBugs.length}
                  </span>
                </div>
                {col.status === 'UNCONFIRMED' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                    title="Quick Add Bug"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[140px]">
                {colBugs.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center p-3 text-center transition-colors">
                    <Sparkles className="w-4 h-4 text-slate-600 mb-1.5" />
                    <span className="text-[11px] font-medium text-slate-500">No issues in {col.label.split('/')[0].trim()}</span>
                    <span className="text-[10px] text-slate-600 font-normal mt-0.5">Drop issues here</span>
                  </div>
                ) : (
                  colBugs.map(bug => {
                    const isBlocker = bug.blocks.length > 0;
                    const getSeverityBorder = (sev: string) => {
                      switch (sev) {
                        case 'blocker': return 'border-l-[3px] border-l-red-500';
                        case 'critical': return 'border-l-[3px] border-l-orange-500';
                        case 'major': return 'border-l-[3px] border-l-amber-500';
                        case 'enhancement': return 'border-l-[3px] border-l-emerald-500';
                        default: return 'border-l-[3px] border-l-sky-500';
                      }
                    };

                    return (
                      <div
                        key={bug.id}
                        draggable
                        onDragStart={e => handleDragStart(e, bug.id)}
                        onClick={() => setSelectedBugId(bug.id)}
                        className={`p-3.5 bg-slate-900/90 hover:bg-slate-850/90 border border-slate-800/90 hover:border-slate-700/80 rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-all duration-200 group hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] ${getSeverityBorder(bug.severity)}`}
                      >
                        {/* Top: ID + Severity */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              #{bug.bugNumber}
                            </span>
                            {bug.isSecuritySensitive && (
                              <Shield className="w-3.5 h-3.5 text-purple-400" />
                            )}
                          </div>
                          <SeverityBadge severity={bug.severity} priority={bug.priority} size="sm" />
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-2 group-hover:text-emerald-300 transition-colors duration-150 leading-relaxed font-sans">
                          {bug.title}
                        </h4>

                        {/* Component & Milestone */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10px] font-mono">
                          <span className="text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                            {bug.componentName}
                          </span>
                          {bug.targetMilestone && (
                            <span className="text-teal-300 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/50">
                              {bug.targetMilestone}
                            </span>
                          )}
                        </div>

                        {/* Flags */}
                        {bug.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {bug.flags.map(f => (
                              <FlagBadge key={f.id} flag={f} />
                            ))}
                          </div>
                        )}

                        {/* Footer: Assignee & Indicators */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
                              {bug.assigneeName[0]}
                            </div>
                            <span className="truncate max-w-[80px] text-slate-400 font-sans text-xs">
                              {bug.assigneeName.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isBlocker && (
                              <span className="text-red-400 flex items-center gap-0.5" title={`Blocks ${bug.blocks.length} bugs`}>
                                <Flame className="w-3 h-3" /> {bug.blocks.length}
                              </span>
                            )}
                            {bug.comments.length > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <MessageSquare className="w-3 h-3" /> {bug.comments.length}
                              </span>
                            )}
                            {bug.remainingHours > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-400" title="Remaining work">
                                <Clock className="w-3 h-3" /> {bug.remainingHours}h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
