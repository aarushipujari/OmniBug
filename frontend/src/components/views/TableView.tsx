import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { Bug, BugStatus } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { FlagBadge } from '../common/FlagBadge.js';
import { EmptyState } from '../common/EmptyState.js';
import { TableSkeleton } from '../common/SkeletonLoader.js';
import {
  CheckSquare,
  Square,
  Flame,
  Shield,
  MessageSquare,
  Paperclip,
  ArrowUpDown,
  User,
  ChevronDown,
  SearchX,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api.js';

export const TableView: React.FC = () => {
  const {
    bugs,
    isLoadingBugs,
    setSelectedBugId,
    currentUser,
    refreshData,
    toast,
    setSearchQuery,
    setIsCreateModalOpen,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Bug>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === bugs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bugs.map(b => b.id));
    }
  };

  const handleSort = (field: keyof Bug) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedBugs = [...bugs].sort((a: any, b: any) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleBulkStatusChange = async (targetStatus: BugStatus) => {
    try {
      const resolution = targetStatus === 'RESOLVED' ? 'FIXED' : undefined;
      const count = await api.bulkUpdate(selectedIds, { status: targetStatus, resolution }, currentUser);
      toast('Bulk Update Complete', `Updated ${count} issues to ${targetStatus}`, 'success');
      setSelectedIds([]);
      setBulkActionOpen(false);
      await refreshData();
    } catch (err: any) {
      toast('Bulk Update Error', err.message, 'alert');
    }
  };

  const handleBulkAssignToMe = async () => {
    try {
      const count = await api.bulkUpdate(
        selectedIds,
        { assigneeId: currentUser.id, assigneeName: currentUser.name },
        currentUser
      );
      toast('Assigned to You', `Assigned ${count} issues to ${currentUser.name}`, 'success');
      setSelectedIds([]);
      setBulkActionOpen(false);
      await refreshData();
    } catch (err: any) {
      toast('Bulk Update Error', err.message, 'alert');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden font-sans animate-in fade-in duration-200">
      {/* Top action / bulk bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            aria-label={selectedIds.length > 0 ? `Deselect all ${bugs.length} issues` : `Select all ${bugs.length} issues`}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors duration-150"
          >
            {selectedIds.length > 0 && selectedIds.length === bugs.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : selectedIds.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
            )}
            <span className="font-mono text-xs">
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : `Select all (${bugs.length})`}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <div className="relative animate-in fade-in duration-100">
              <button
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
                aria-label={`Bulk actions menu for ${selectedIds.length} selected issues`}
                aria-expanded={bulkActionOpen}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-800 text-xs text-slate-200 rounded-lg border border-slate-700/80 transition-all duration-150 shadow-xs"
              >
                <span>Bulk Actions ({selectedIds.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {bulkActionOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in duration-100">
                  <button
                    onClick={handleBulkAssignToMe}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Assign to Me
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <div className="text-[10px] font-bold text-slate-500 px-2.5 py-0.5 uppercase font-mono">Set Status</div>
                  <button
                    onClick={() => handleBulkStatusChange('IN_PROGRESS')}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Mark IN PROGRESS
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('IN_REVIEW')}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Mark IN REVIEW
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('RESOLVED')}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Mark RESOLVED (FIXED)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 font-normal">
          Showing <span className="text-slate-100 font-semibold font-mono">{bugs.length}</span> issues
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 overflow-auto">
        {isLoadingBugs ? (
          <TableSkeleton rows={8} />
        ) : sortedBugs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={SearchX}
              title="No issues found"
              description="No software bugs or issues matched your active search query or filter scope."
              actionLabel="Create New Bug"
              onAction={() => setIsCreateModalOpen(true)}
              secondaryActionLabel="Clear Filters"
              onSecondaryAction={() => setSearchQuery('')}
            />
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800 select-none backdrop-blur-md shadow-xs">
              <tr className="text-slate-400 font-mono text-[11px]">
                <th className="w-10 px-3 py-2.5 text-center"></th>
                <th
                  onClick={() => handleSort('bugNumber')}
                  className="w-20 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-40 group-hover/th:opacity-100 group-hover/th:text-emerald-400 transition-all" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="px-4 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Summary & Title</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-40 group-hover/th:opacity-100 group-hover/th:text-emerald-400 transition-all" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('componentName')}
                  className="w-48 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  Component
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="w-36 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  Status
                </th>
                <th
                  onClick={() => handleSort('severity')}
                  className="w-32 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  Severity / Pri
                </th>
                <th
                  onClick={() => handleSort('assigneeName')}
                  className="w-44 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 transition-colors"
                >
                  Assignee
                </th>
                <th className="w-40 px-3 py-2.5">Flags & Reviews</th>
                <th
                  onClick={() => handleSort('updatedAt')}
                  className="w-28 px-3 py-2.5 cursor-pointer group/th hover:text-slate-200 text-right transition-colors"
                >
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 font-sans">
              {sortedBugs.map((bug, idx) => {
                const isSelected = selectedIds.includes(bug.id);
                const hasBlockers = bug.dependsOn.length > 0;
                const isBlockerForOthers = bug.blocks.length > 0;

                return (
                  <tr
                    key={bug.id}
                    onClick={() => setSelectedBugId(bug.id)}
                    className={`cursor-pointer transition-colors duration-150 group ${
                      isSelected
                        ? 'bg-emerald-950/20'
                        : idx % 2 === 1
                        ? 'bg-slate-950/50 hover:bg-slate-850/80'
                        : 'bg-transparent hover:bg-slate-850/80'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center" onClick={e => toggleSelect(bug.id, e)}>
                      <button className="text-slate-600 hover:text-slate-300">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Bug ID */}
                    <td className="px-3 py-3 font-mono font-bold text-slate-300 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 hover:underline">#{bug.bugNumber}</span>
                        {bug.isSecuritySensitive && (
                          <span title="Security Sensitive Bug">
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Metadata badges */}
                    <td className="px-4 py-3 min-w-[280px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors line-clamp-1">
                            {bug.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          {bug.targetMilestone && (
                            <span className="text-slate-400 bg-slate-850 px-1.5 py-0.2 rounded border border-slate-800">
                              {bug.targetMilestone}
                            </span>
                          )}
                          {isBlockerForOthers && (
                            <span className="text-red-400 bg-red-950/30 px-1.5 py-0.2 rounded border border-red-900/40 flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Blocks {bug.blocks.length}
                            </span>
                          )}
                          {hasBlockers && (
                            <span className="text-amber-400 bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-900/40">
                              Blocked by {bug.dependsOn.length}
                            </span>
                          )}
                          {bug.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <MessageSquare className="w-3 h-3" /> {bug.comments.length}
                            </span>
                          )}
                          {bug.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Paperclip className="w-3 h-3" /> {bug.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Component */}
                    <td className="px-3 py-3">
                      <div className="text-slate-300 font-medium truncate">{bug.componentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{bug.productName}</div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={bug.status} resolution={bug.resolution} size="sm" />
                    </td>

                    {/* Severity & Priority */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <SeverityBadge severity={bug.severity} priority={bug.priority} size="sm" />
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                          {bug.assigneeName[0]}
                        </div>
                        <span className="text-slate-300 truncate max-w-[120px] font-normal">
                          {bug.assigneeName.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Flags */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {bug.flags.length > 0 ? (
                          bug.flags.map(f => (
                            <FlagBadge
                              key={f.id}
                              flag={f}
                              onClick={() => setSelectedBugId(bug.id)}
                            />
                          ))
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Updated */}
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500 text-right whitespace-nowrap">
                      {new Date(bug.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
