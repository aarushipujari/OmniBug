import React, { useState, useEffect } from 'react';
import { useApp, useCurrentUser } from '../../context/AppContext.js';
import { Bug, BugStatus, BugResolution, BugFlag, FlagStatus } from '../../types/index.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { FlagBadge } from '../common/FlagBadge.js';
import { DiffViewer } from '../common/DiffViewer.js';
import { EmptyState } from '../common/EmptyState.js';
import {
  X,
  Shield,
  Clock,
  MessageSquare,
  Paperclip,
  Activity,
  FileCode,
  Send,
  GitBranch,
  ThumbsUp,
  MessageSquareDashed,
  FileDiff,
  FileSearch,
} from 'lucide-react';

export const BugDetailModal: React.FC = () => {
  const { selectedBugId, setSelectedBugId, users, refreshData, toast } = useApp();
  const currentUser = useCurrentUser();

  const [bug, setBug] = useState<Bug | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'diffs' | 'audit' | 'worklogs' | 'attachments'>('details');
  const [isLoading, setIsLoading] = useState(true);

  // Inputs
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [workHours, setWorkHours] = useState('');
  const [workComment, setWorkComment] = useState('');

  // Flag request inputs
  const [selectedFlagName, setSelectedFlagName] = useState<BugFlag['name']>('review');
  /*
   * Derived from the user list rather than stored and reconciled by an effect.
   * The old version defaulted to a hardcoded 'usr-1' before the users had
   * loaded, then corrected itself in a second render pass.
   */
  const [flagRequesteeOverride, setFlagRequesteeOverride] = useState<string | null>(null);
  const selectedFlagRequestee =
    flagRequesteeOverride && users.some(u => u.id === flagRequesteeOverride)
      ? flagRequesteeOverride
      : users[0]?.id || '';
  const setSelectedFlagRequestee = setFlagRequesteeOverride;

  // Dependency add input
  const [depInputId, setDepInputId] = useState('');
  const [depType, setDepType] = useState<'dependsOn' | 'blocks'>('dependsOn');

  const loadBug = async () => {
    if (!selectedBugId) return;
    setIsLoading(true);
    try {
      const res = await api.getBugById(selectedBugId);
      setBug(res.data);
      setAuditLogs(res.auditLogs || []);
    } catch (e: any) {
      toast('Error loading issue', e.message, 'alert');
      setSelectedBugId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBug();
  }, [selectedBugId]);

  // Every hook must run on every render. This listener previously sat below the
  // early return, so opening the modal executed one more hook than closing it
  // and React aborted with "Rendered more hooks than during the previous
  // render" (#310) — the modal could never open.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBugId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedBugId]);

  if (!selectedBugId) return null;

  if (isLoading || !bug) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-slate-300 font-mono text-xs animate-pulse shadow-2xl">
          Loading issue #{selectedBugId}...
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: BugStatus) => {
    try {
      let resolution: BugResolution = bug.resolution;
      const dupId = bug.duplicateOfBugId;

      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        if (!resolution) resolution = 'FIXED';
      }

      const updated = await api.transitionBug(bug.id, newStatus, resolution, dupId);
      setBug(updated);
      toast('Status Changed', `Transitioned to ${newStatus}`, 'success');
      await refreshData();
      await loadBug();
    } catch (err: any) {
      toast('Lifecycle Transition Error', err.message, 'alert');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.addComment(bug.id, commentText, isInternalComment);
      // The comment endpoint returns the comment, not the bug — slash commands
      // may have mutated the issue, so the authoritative copy is reloaded below.
      setCommentText('');
      if (res.executedCommands && res.executedCommands.length > 0) {
        const summary = res.executedCommands.map(c => c.description).join(' • ');
        toast('Slash Commands Executed', summary, 'success');
        await refreshData();
      } else {
        toast('Comment Posted', 'Added discussion comment', 'success');
      }
      await loadBug();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(workHours);
    if (isNaN(hrs) || hrs <= 0) return;
    try {
      const res = await api.addWorkLog(bug.id, hrs, workComment);
      setBug(res.bug);
      setWorkHours('');
      setWorkComment('');
      toast('Work Hours Logged', `Logged +${hrs}h`, 'success');
      await loadBug();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleVote = async () => {
    try {
      const res = await api.toggleVote(bug.id);
      setBug(prev => (prev ? { ...prev, votes: res.votes } : prev));
      toast(res.hasVoted ? 'Upvoted Issue' : 'Removed Upvote', `Total votes: ${res.votes}`, 'info');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleSetFlag = async (name: BugFlag['name'], status: FlagStatus, requesteeId?: string) => {
    try {
      const res = await api.setFlag(bug.id, name, status, requesteeId);
      setBug(prev => (prev ? { ...prev, flags: res.flags } : prev));
      toast('Flag Updated', `${name}${status} updated`, 'success');
      await refreshData();
      await loadBug();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleAddDependency = async () => {
    if (!depInputId.trim()) return;
    try {
      const targetId = depInputId.startsWith('bug-') ? depInputId : `bug-${depInputId.replace('#', '')}`;
      const currentList = depType === 'dependsOn' ? [...bug.dependsOn] : [...bug.blocks];
      if (!currentList.includes(targetId)) {
        currentList.push(targetId);
      }
      const updates = { [depType]: currentList };
      const updated = await api.updateBug(bug.id, updates);
      setBug(updated);
      setDepInputId('');
      toast('Dependency Added', `Updated ${depType}`, 'success');
      await refreshData();
      await loadBug();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const patchAttachments = bug.attachments.filter(a => a.isPatch && a.patchContent);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="bug-modal-title">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-base font-bold text-emerald-400">
              #{bug.bugNumber}
            </span>
            <span className="text-slate-600 font-mono">/</span>
            <div className="flex items-center gap-2 truncate">
              <h2 id="bug-modal-title" className="font-semibold text-sm text-slate-100 truncate font-sans">{bug.title}</h2>
              {bug.isSecuritySensitive && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                  <Shield className="w-3 h-3 text-purple-400" /> Security Confidential
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleVote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 border border-slate-700 transition-all duration-150 active:scale-[0.98] font-mono"
              title="Upvote this issue"
              aria-label={`Upvote issue, current votes ${bug.votes}`}
            >
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{bug.votes}</span>
            </button>

            <button
              onClick={() => setSelectedBugId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Lifecycle Pipeline Header */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto select-none">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'UNCONFIRMED', label: '1. Reported', role: 'Reporter' },
              { id: 'NEW', label: '2. Triaged', role: 'Maintainer' },
              { id: 'IN_PROGRESS', label: '3. In Progress', role: 'Developer' },
              { id: 'IN_REVIEW', label: '4. Review', role: 'Reviewer' },
              { id: 'RESOLVED', label: '5. Resolved', role: 'Dev / QA' },
              { id: 'VERIFIED', label: '6. QA Verified', role: 'QA Lead' },
              { id: 'CLOSED', label: '7. Closed', role: 'Release' },
            ].map((stage, idx, arr) => {
              const isCurrent = bug.status === stage.id;
              const statusOrder = ['UNCONFIRMED', 'NEW', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'VERIFIED', 'CLOSED'];
              const isPast = statusOrder.indexOf(bug.status) >= statusOrder.indexOf(stage.id);

              return (
                <React.Fragment key={stage.id}>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                        : isPast
                        ? 'text-slate-400 bg-slate-900/80 border border-slate-800/80'
                        : 'text-slate-600 border border-transparent'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : isPast ? 'bg-slate-500' : 'bg-slate-800'}`} />
                    <span>{stage.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="text-slate-700 text-xs font-mono">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              Active Stage: <strong className="text-slate-200">{bug.status}</strong>
            </span>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="flex-1 flex min-h-0 divide-x divide-slate-800 overflow-hidden">
          {/* Left Column: Details, Diffs, Audit, Worklogs, Comments */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Tab navigation */}
            <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/90 text-xs sticky top-0 z-10 font-sans shadow-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-3 font-semibold border-b-2 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === 'details'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Discussion ({bug.comments.length})
              </button>
              <button
                onClick={() => setActiveTab('diffs')}
                className={`py-3 px-3 font-semibold border-b-2 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === 'diffs'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Patch Diffs ({patchAttachments.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-3 px-3 font-semibold border-b-2 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === 'audit'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Audit Trail ({auditLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('worklogs')}
                className={`py-3 px-3 font-semibold border-b-2 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === 'worklogs'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Time Tracking ({bug.workLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`py-3 px-3 font-semibold border-b-2 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === 'attachments'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" /> Files ({bug.attachments.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 space-y-6">
              {/* Tab 1: Details & Comments */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Initial Description */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200 font-sans">
                          {bug.reporterName}
                        </span>
                        <span>reported on {new Date(bug.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        Initial Report
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {bug.description}
                    </div>
                  </div>                  {/* Unified Activity Timeline (Linear / GitHub Style) */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unified Activity & Discussion Timeline</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {bug.comments.length} comments • {bug.workLogs.length} worklogs • {auditLogs.length} events
                      </span>
                    </div>

                    {(() => {
                      const timelineItems = [
                        ...bug.comments.map((c, i) => ({
                          id: c.id,
                          type: 'comment' as const,
                          timestamp: c.createdAt,
                          actor: c.authorName,
                          content: c.text,
                          isInternal: c.isInternal,
                          index: i + 1,
                        })),
                        ...bug.workLogs.map(w => ({
                          id: w.id,
                          type: 'worklog' as const,
                          timestamp: w.loggedAt,
                          actor: w.userName,
                          content: `Logged +${w.hoursSpent}h session: ${w.comment}`,
                          index: 0,
                        })),
                        ...auditLogs.filter(a => !a.commentId).map(a => ({
                          id: a.id,
                          type: 'audit' as const,
                          timestamp: a.timestamp,
                          actor: a.actorName,
                          content: a.changes.map((c: any) => `${c.field} → ${String(c.newValue)}`).join(', '),
                          index: 0,
                        })),
                      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                      if (timelineItems.length === 0) {
                        return (
                          <EmptyState
                            icon={MessageSquareDashed}
                            title="No activity recorded yet"
                            description="Start the technical discussion or share reproduction notes below."
                          />
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {timelineItems.map(item => {
                            if (item.type === 'comment') {
                              return (
                                <div
                                  key={item.id}
                                  className={`p-4 rounded-xl border shadow-xs transition-all ${
                                    item.isInternal
                                      ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 font-mono">
                                        {item.actor[0]}
                                      </div>
                                      <span className="font-semibold text-emerald-400 font-sans">
                                        {item.actor}
                                      </span>
                                      <span className="text-slate-400 font-mono text-[11px]">
                                        comment #{item.index} • {new Date(item.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    {item.isInternal && (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                        Internal Note
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed pl-7">
                                    {item.content}
                                  </div>
                                </div>
                              );
                            }

                            if (item.type === 'worklog') {
                              return (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs font-mono text-slate-300 gap-3"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span><strong className="text-slate-100">{item.actor}</strong> {item.content}</span>
                                  </div>
                                  <span className="text-slate-400 text-[10.5px] shrink-0">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-[11.5px] font-mono text-slate-400 gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span><strong className="text-slate-200">{item.actor}</strong> updated {item.content}</span>
                                </div>
                                <span className="text-slate-600 text-[10px] shrink-0">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Comment Editor */}
                  <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Add Comment or Reply</span>
                      <label htmlFor="detail-setisinternalcomment-e-target-1" className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalComment}
                          onChange={e => setIsInternalComment(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                        />
                        <span>Private / Internal Only</span>
                      </label>
                    </div>
                    <textarea id="detail-setisinternalcomment-e-target-1"
                      rows={3}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Leave a comment (supports Markdown, code blocks, @mentions)..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 shadow-inner"
                    />
                    {/* Slash Command Helper Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Slash Actions:</span>
                      {[
                        { label: '/resolve FIXED', cmd: '/resolve FIXED' },
                        { label: '/priority P1', cmd: '/priority P1' },
                        { label: '/severity blocker', cmd: '/severity blocker' },
                        { label: '/flag review?', cmd: '/flag review? @' },
                        { label: '/log 1h', cmd: '/log 1h ' },
                      ].map(sc => (
                        <button
                          key={sc.label}
                          type="button"
                          onClick={() => setCommentText(prev => prev ? `${prev}\n${sc.cmd}` : sc.cmd)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-colors"
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98]"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Comment & Execute Commands
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Patch Diffs */}
              {activeTab === 'diffs' && (
                <div className="space-y-4">
                  {patchAttachments.length === 0 ? (
                    <EmptyState
                      icon={FileDiff}
                      title="No patches attached"
                      description="Upload a unified git diff (.patch / .diff) file to review and test code changes directly in-app."
                    />
                  ) : (
                    patchAttachments.map(patch => (
                      <div key={patch.id} className="space-y-2">
                        <div className="text-xs text-slate-400 font-mono">
                          {patch.description} (uploaded by {patch.uploaderName})
                        </div>
                        <DiffViewer
                          patchContent={patch.patchContent || ''}
                          fileName={patch.fileName}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Micro-Audit Trail */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Full Historical Field Changelog
                  </h4>
                  <div className="space-y-2">
                    {auditLogs.map(log => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 text-xs font-mono space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="font-semibold text-emerald-400 font-sans">{log.actorName}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="space-y-1">
                          {log.changes.map((c: any, i: number) => (
                            <div key={i} className="text-slate-300">
                              <span className="text-slate-400 uppercase text-[10px] font-bold mr-2">
                                [{c.field}]
                              </span>
                              {c.oldValue !== null && c.oldValue !== undefined && (
                                <span className="text-rose-400 line-through mr-2">
                                  {JSON.stringify(c.oldValue)}
                                </span>
                              )}
                              <span className="text-emerald-300">
                                {JSON.stringify(c.newValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Worklogs */}
              {activeTab === 'worklogs' && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono shadow-inner">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Estimated Hours</span>
                      <span className="text-base font-bold text-slate-200">{bug.estimatedHours}h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Hours Logged</span>
                      <span className="text-base font-bold text-emerald-400">
                        {bug.workLogs.reduce((s, w) => s + w.hoursSpent, 0)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Remaining Estimate</span>
                      <span className="text-base font-bold text-amber-400">{bug.remainingHours}h</span>
                    </div>
                  </div>

                  {/* Log Work Form */}
                  <form onSubmit={handleLogWork} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-xs">
                    <h5 className="text-xs font-bold text-slate-200 font-sans">Log Developer Work Session</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="detail-hours-spent-2" className="text-[10px] text-slate-400 block font-mono">Hours Spent</label>
                        <input id="detail-hours-spent-2"
                          type="number"
                          step="0.5"
                          value={workHours}
                          onChange={e => setWorkHours(e.target.value)}
                          placeholder="e.g. 2.5"
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="detail-work-description-3" className="text-[10px] text-slate-400 block font-mono">Work Description</label>
                        <input id="detail-work-description-3"
                          type="text"
                          value={workComment}
                          onChange={e => setWorkComment(e.target.value)}
                          placeholder="What did you work on?"
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!workHours}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-all duration-150 active:scale-[0.98] font-mono"
                      >
                        Log Work
                      </button>
                    </div>
                  </form>

                  {/* Worklog history */}
                  <div className="space-y-2">
                    {bug.workLogs.map(w => (
                      <div key={w.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs font-mono flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-semibold text-slate-200 font-sans">{w.comment}</div>
                          <div className="text-[10px] text-slate-400">{w.userName} • {new Date(w.loggedAt).toLocaleString()}</div>
                        </div>
                        <span className="text-emerald-400 font-bold">+{w.hoursSpent}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Attachments */}
              {activeTab === 'attachments' && (
                <div className="space-y-3">
                  {bug.attachments.length === 0 ? (
                    <EmptyState
                      icon={FileSearch}
                      title="No files attached"
                      description="Attach logs, telemetry JSON, screenshots, or patch diffs to this issue."
                    />
                  ) : (
                    <div className="space-y-2">
                      {bug.attachments.map(att => (
                        <div
                          key={att.id}
                          className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-200">{att.fileName}</div>
                              <div className="text-[10px] text-slate-400">{att.description} ({(att.fileSize / 1024).toFixed(1)} KB)</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {att.contentType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bugzilla Triage, Lifecycle, Flags & Metadata */}
          <div className="w-96 bg-slate-900/90 p-6 space-y-6 overflow-y-auto shrink-0 font-sans text-xs">
            {/* Status & Resolution State Machine */}
            <div className="space-y-2.5 p-4 rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  Lifecycle State
                </span>
                <StatusBadge status={bug.status} resolution={bug.resolution} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(['NEW', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'VERIFIED', 'CLOSED'] as BugStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 active:scale-[0.98] border ${
                      bug.status === st
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Product & Component Matrix */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Product & Routing
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Product</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{bug.productName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Component</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{bug.componentName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Target Milestone</span>
                  <div className="text-emerald-400 font-mono font-semibold mt-0.5">
                    {bug.targetMilestone || 'None set'}
                  </div>
                </div>
              </div>
            </div>

            {/* People: Assignee & QA */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Ownership & QA
              </div>
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Assignee</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {bug.assigneeName[0]}
                    </div>
                    <span className="font-semibold text-slate-200">{bug.assigneeName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">QA Contact</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {bug.qaContactName ? bug.qaContactName[0] : 'Q'}
                    </div>
                    <span className="text-slate-300">{bug.qaContactName || 'Unassigned QA'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bugzilla Flag Engine */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Flags & Peer Reviews
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{bug.flags.length} active</span>
              </div>

              {/* Existing flags list */}
              <div className="space-y-2">
                {bug.flags.map(f => (
                  <div
                    key={f.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono shadow-xs"
                  >
                    <FlagBadge flag={f} />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetFlag(f.name, '+')}
                        className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition-colors"
                        title="Grant (+)"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleSetFlag(f.name, '-')}
                        className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold transition-colors"
                        title="Deny (-)"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleSetFlag(f.name, 'X')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] transition-colors"
                        title="Clear (X)"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Request new flag */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 shadow-inner">
                <div className="text-[11px] font-semibold text-slate-300">Request Flag</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedFlagName}
                    onChange={e => setSelectedFlagName(e.target.value as any)}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  >
                    <option value="review">review?</option>
                    <option value="needinfo">needinfo?</option>
                    <option value="qa-verify">qa-verify?</option>
                    <option value="security-audit">security-audit?</option>
                    <option value="release-blocker">release-blocker!</option>
                  </select>
                  <select
                    value={selectedFlagRequestee}
                    onChange={e => setSelectedFlagRequestee(e.target.value)}
                    className="p-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleSetFlag(selectedFlagName, '?', selectedFlagRequestee)}
                  className="w-full py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] font-mono border border-slate-705"
                >
                  Set Flag Request
                </button>
              </div>
            </div>

            {/* Blockers & Dependencies */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Blockers & Dependency Links
              </div>

              {/* Blocks list */}
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Blocks:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bug.blocks.length === 0 ? (
                    <span className="text-slate-600 font-mono text-[11px]">None</span>
                  ) : (
                    bug.blocks.map(b => (
                      <button
                        key={b}
                        onClick={() => setSelectedBugId(b)}
                        className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-900/50 font-mono text-[11px] hover:underline"
                      >
                        {b}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Depends On list */}
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Depends On (Blocked By):</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bug.dependsOn.length === 0 ? (
                    <span className="text-slate-600 font-mono text-[11px]">None</span>
                  ) : (
                    bug.dependsOn.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedBugId(d)}
                        className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/50 font-mono text-[11px] hover:underline"
                      >
                        {d}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Add dependency input */}
              <div className="flex gap-1.5">
                <select
                  value={depType}
                  onChange={e => setDepType(e.target.value as any)}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono"
                >
                  <option value="dependsOn">Blocked by</option>
                  <option value="blocks">Blocks</option>
                </select>
                <input
                  type="text"
                  value={depInputId}
                  onChange={e => setDepInputId(e.target.value)}
                  placeholder="Bug # (e.g. 1004)"
                  className="flex-1 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono"
                />
                <button
                  onClick={handleAddDependency}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Git Linkage */}
            {bug.gitLinkage && (
              <div className="space-y-2 pt-3 border-t border-slate-800 font-mono text-[11px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Git & CI/CD Linkage
                </div>
                {bug.gitLinkage.branch && (
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{bug.gitLinkage.branch}</span>
                  </div>
                )}
                {bug.gitLinkage.pullRequestUrl && (
                  <a
                    href={bug.gitLinkage.pullRequestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline block truncate"
                  >
                    {bug.gitLinkage.pullRequestUrl}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
