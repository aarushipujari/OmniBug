import React, { useState } from 'react';
import { useApp, useCurrentUser } from '../../context/AppContext.js';
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
  { status: 'UNCONFIRMED', label: 'Triage / Unconfirmed', dotColor: 'bg-slate-400', description: 'Incoming bugs needing maintainer verification' },
  { status: 'NEW', label: 'Confirmed / Backlog', dotColor: 'bg-indigo-500', description: 'Reproduced and ready for dev assignment' },
  { status: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-indigo-500', description: 'Active implementation in progress' },
  { status: 'IN_REVIEW', label: 'In Review & Testing', dotColor: 'bg-indigo-500', description: 'Patch uploaded and pending review? flags' },
  { status: 'RESOLVED', label: 'Resolved / Fixed', dotColor: 'bg-emerald-500', description: 'Patch landed, waiting on qa-verify' },
  { status: 'CLOSED', label: 'Closed / Verified', dotColor: 'bg-slate-400', description: 'Lifecycle complete and verified in release' },
];

export const KanbanView: React.FC = () => {
  const {
    bugs,
    setSelectedBugId,
    refreshData,
    toast,
    setIsCreateModalOpen,
    setSearchQuery,
  } = useApp();
  const currentUser = useCurrentUser();

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
      await api.updateBug(bug.id, { status: targetStatus, resolution });
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
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden select-none font-sans animate-in fade-in duration-200">
      {/* Board Header Info */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-900">Kanban Board</span>
          <span className="text-xs text-slate-400 font-normal">
            Drag cards between columns to transition lifecycle state
          </span>
        </div>
        <div className="text-xs text-slate-500 font-normal">
          <span className="text-slate-900 font-semibold font-mono">{bugs.length}</span> issues
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-3 items-start">
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
              className="w-72 shrink-0 bg-slate-50 border border-slate-200 rounded-lg flex flex-col max-h-full transition-colors"
            >
              {/* Column Header */}
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-xs text-slate-900">{col.label}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {colBugs.length}
                  </span>
                </div>
                {col.status === 'UNCONFIRMED' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    aria-label="Quick Add Bug"
                    className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors"
                    title="Quick Add Bug"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[140px]" role="region" aria-label={`${col.label} column, ${colBugs.length} issues`}>
                {colBugs.length === 0 ? (
                  <div className="h-24 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/50">
                    <span className="text-[11px] text-slate-400">Empty</span>
                  </div>
                ) : (
                  colBugs.map(bug => {
                    const isBlocker = bug.blocks.length > 0;

                    return (
                      <div
                        key={bug.id}
                        draggable
                        role="button"
                        tabIndex={0}
                        aria-label={`Open issue #${bug.bugNumber}: ${bug.title}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedBugId(bug.id);
                          }
                        }}
                        onDragStart={e => handleDragStart(e, bug.id)}
                        onClick={() => setSelectedBugId(bug.id)}
                        className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-grab transition-colors group"
                      >
                        {/* Top: ID + Severity */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              #{bug.bugNumber}
                            </span>
                            {bug.isSecuritySensitive && (
                              <Shield className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                          <SeverityBadge severity={bug.severity} priority={bug.priority} size="sm" />
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-medium text-slate-900 line-clamp-2 mb-2 leading-relaxed">
                          {bug.title}
                        </h4>

                        {/* Component & Milestone */}
                        <div className="flex items-center gap-1 flex-wrap mb-2 text-[10px] font-mono">
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {bug.componentName}
                          </span>
                          {bug.targetMilestone && (
                            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
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

                        {/* Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span className="truncate max-w-[90px] text-slate-600 font-sans text-xs">
                            {bug.assigneeName.split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-2">
                            {isBlocker && (
                              <span className="text-red-600 flex items-center gap-0.5" title={`Blocks ${bug.blocks.length} bugs`}>
                                <Flame className="w-3 h-3 text-red-600" /> {bug.blocks.length}
                              </span>
                            )}
                            {bug.comments.length > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <MessageSquare className="w-3 h-3" /> {bug.comments.length}
                              </span>
                            )}
                            {bug.remainingHours > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-500" title="Remaining work">
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
