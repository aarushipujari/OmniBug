import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { DuplicateCandidate, TriagePrediction } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  Inbox,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  CheckCheck,
  Check,
  Tag,
  Layers,
  Shield,
  Clock,
  Play,
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { EmptyState } from '../common/EmptyState.js';

export const TriageView: React.FC = () => {
  const { allBugs, currentUser, refreshData, toast, setSelectedBugId, setIsCreateModalOpen } = useApp();
  
  // Speed triage queue: Unconfirmed bugs OR bugs with pending needinfo? flag
  const triageBugs = allBugs.filter(
    b => b.status === 'UNCONFIRMED' || b.flags.some(f => f.name === 'needinfo' && f.status === '?')
  );

  const [activeBugId, setActiveBugId] = useState<string | null>(triageBugs[0]?.id || null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [aiPrediction, setAiPrediction] = useState<TriagePrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appliedAiForBugId, setAppliedAiForBugId] = useState<string | null>(null);
  const [isApplyingAi, setIsApplyingAi] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync active bug
  const activeBug = allBugs.find(b => b.id === activeBugId) || triageBugs[0] || allBugs[0];

  useEffect(() => {
    if (activeBug) {
      setIsAnalyzing(true);
      Promise.all([
        api.findDuplicates(activeBug.title, activeBug.description),
        api.analyzeAndTriage(activeBug.title, activeBug.description, activeBug.productId),
      ])
        .then(([dups, pred]) => {
          setDuplicateCandidates(dups.filter(d => d.bugId !== activeBug.id));
          setAiPrediction(pred);
        })
        .catch(console.error)
        .finally(() => setIsAnalyzing(false));
    }
  }, [activeBug?.id, activeBug?.title, activeBug?.description, activeBug?.productId]);

  const handleConfirmBug = async () => {
    if (!activeBug || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      if (activeBug.status === 'UNCONFIRMED') {
        await api.updateBug(activeBug.id, { status: 'NEW' }, currentUser);
        toast('Bug Confirmed', `Marked #${activeBug.bugNumber} as CONFIRMED (NEW)`, 'success');
      } else if (activeBug.status === 'NEW') {
        await api.updateBug(
          activeBug.id,
          { status: 'IN_PROGRESS', assigneeId: currentUser.id, assigneeName: currentUser.name },
          currentUser
        );
        toast('Started Investigation', `Assigned #${activeBug.bugNumber} to ${currentUser.name.split(' ')[0]} in IN_PROGRESS`, 'success');
      }
      await refreshData();
    } catch (err: any) {
      toast('Lifecycle Error', err.message, 'alert');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleInvestigateBug = async () => {
    if (!activeBug || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateBug(
        activeBug.id,
        { status: 'IN_PROGRESS', assigneeId: currentUser.id, assigneeName: currentUser.name },
        currentUser
      );
      toast('Under Investigation', `Assigned #${activeBug.bugNumber} to you in IN_PROGRESS`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQuickResolve = async () => {
    if (!activeBug || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateBug(activeBug.id, { status: 'RESOLVED', resolution: 'FIXED' }, currentUser);
      toast('Resolved Fixed', `Resolved #${activeBug.bugNumber} as FIXED`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetPriority = async (pri: 'P1' | 'P2' | 'P3' | 'P4' | 'P5') => {
    if (!activeBug) return;
    try {
      await api.updateBug(activeBug.id, { priority: pri }, currentUser);
      toast('Priority Updated', `Set #${activeBug.bugNumber} to ${pri}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  // Keyboard navigation & triage hotkeys (J/K/C/I/E/1-5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const currentIndex = triageBugs.findIndex(b => b.id === (activeBug?.id || ''));
      if (e.key === 'j' || e.key === 'ArrowDown') {
        if (currentIndex < triageBugs.length - 1) {
          e.preventDefault();
          setActiveBugId(triageBugs[currentIndex + 1].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (currentIndex > 0) {
          e.preventDefault();
          setActiveBugId(triageBugs[currentIndex - 1].id);
        }
      } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleConfirmBug();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        handleInvestigateBug();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleQuickResolve();
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        handleSetPriority(`P${e.key}` as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triageBugs, activeBug, isUpdatingStatus]);

  const handleApplyAIPrediction = async () => {
    if (!activeBug || !aiPrediction || isApplyingAi) return;
    setIsApplyingAi(true);
    try {
      const mergedTags = Array.from(new Set([...activeBug.tags, ...aiPrediction.suggestedTags]));
      const updates: any = {
        severity: aiPrediction.suggestedSeverity,
        priority: aiPrediction.suggestedPriority,
        isSecuritySensitive: aiPrediction.isSecuritySensitive,
        tags: mergedTags,
      };

      if (aiPrediction.suggestedComponentId && aiPrediction.suggestedComponentName) {
        updates.componentId = aiPrediction.suggestedComponentId;
        updates.componentName = aiPrediction.suggestedComponentName;
      }

      await api.updateBug(activeBug.id, updates, currentUser);
      setAppliedAiForBugId(activeBug.id);
      toast(
        'AI Classification Applied',
        `Updated #${activeBug.bugNumber} to ${aiPrediction.suggestedSeverity.toUpperCase()} (${aiPrediction.suggestedPriority}) in ${aiPrediction.suggestedComponentName || activeBug.componentName}`,
        'success'
      );
      await refreshData();
    } catch (err: any) {
      toast('AI Classification Error', err.message, 'alert');
    } finally {
      setIsApplyingAi(false);
    }
  };

  const handleMarkDuplicate = async (targetBugId: string, targetBugNum: number) => {
    if (!activeBug) return;
    try {
      await api.updateBug(
        activeBug.id,
        {
          status: 'RESOLVED',
          resolution: 'DUPLICATE',
          duplicateOfBugId: targetBugId,
        },
        currentUser
      );
      toast('Marked Duplicate', `Resolved #${activeBug.bugNumber} as duplicate of #${targetBugNum}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleRequestNeedInfo = async () => {
    if (!activeBug) return;
    try {
      await api.setFlag(activeBug.id, 'needinfo', '?', activeBug.reporterId, currentUser);
      toast('NeedInfo Requested', `Sent needinfo? request to ${activeBug.reporterName}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const isAiApplied = appliedAiForBugId === activeBug?.id;

  return (
    <div className="flex-1 flex min-w-0 bg-slate-950 overflow-hidden font-sans animate-in fade-in duration-200">
      {/* Left List: Untriaged & NeedInfo Queue */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-800 bg-slate-850 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-xs text-slate-200">Triage & Verification Inbox</h3>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
            {triageBugs.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {triageBugs.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CheckCheck}
                title="All caught up!"
                description="Zero unconfirmed incoming bugs or pending needinfo requests."
                actionLabel="Create Test Bug"
                onAction={() => setIsCreateModalOpen(true)}
              />
            </div>
          ) : (
            triageBugs.map(bug => {
              const isSelected = activeBug?.id === bug.id;
              return (
                <button
                  key={bug.id}
                  onClick={() => setActiveBugId(bug.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-slate-100 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-emerald-400">#{bug.bugNumber}</span>
                    <StatusBadge status={bug.status} size="sm" />
                  </div>
                  <div className="font-semibold text-xs line-clamp-2 leading-relaxed mb-2 font-sans">
                    {bug.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-[120px]">{bug.componentName}</span>
                    <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard shortcut bar */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span><kbd className="bg-slate-850 px-1 py-0.5 rounded border border-slate-700 text-slate-300">J/K</kbd> Nav</span>
          <span><kbd className="bg-slate-850 px-1 py-0.5 rounded border border-slate-700 text-slate-300">C</kbd> Confirm</span>
          <span><kbd className="bg-slate-850 px-1 py-0.5 rounded border border-slate-700 text-slate-300">I</kbd> Investigate</span>
          <span><kbd className="bg-slate-850 px-1 py-0.5 rounded border border-slate-700 text-slate-300">1-5</kbd> Pri</span>
        </div>
      </div>

      {/* Right Pane: Bug Triage Workspace & AI Assistant */}
      {activeBug ? (
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Top Triage Action Bar */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-base font-bold text-emerald-400">
                #{activeBug.bugNumber}
              </span>
              <StatusBadge status={activeBug.status} resolution={activeBug.resolution} />
              <SeverityBadge severity={activeBug.severity} priority={activeBug.priority} />
              {activeBug.isSecuritySensitive && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Shield className="w-3 h-3 text-purple-400" /> Security
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeBug.status === 'UNCONFIRMED' ? (
                <button
                  onClick={handleConfirmBug}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98]"
                  title="Confirm reproduction and move to NEW (C)"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isUpdatingStatus ? 'Confirming...' : 'Confirm as Bug (C)'}</span>
                </button>
              ) : (
                <button
                  onClick={handleInvestigateBug}
                  disabled={isUpdatingStatus || activeBug.status === 'IN_PROGRESS'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98]"
                  title="Assign to self and start work (I)"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{activeBug.status === 'IN_PROGRESS' ? 'In Progress ✓' : 'Investigate (I)'}</span>
                </button>
              )}

              <button
                onClick={handleRequestNeedInfo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98]"
                title="Request info from reporter"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Request needinfo?
              </button>
              <button
                onClick={() => setSelectedBugId(activeBug.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] border border-slate-700"
              >
                Open Full Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Details & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bug Content & Metadata */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-sans leading-snug">{activeBug.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Layers className="w-3 h-3 text-emerald-400" /> {activeBug.productName} / {activeBug.componentName}
                    </span>
                    {activeBug.targetMilestone && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {activeBug.targetMilestone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags Pill List */}
                {activeBug.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {activeBug.tags.map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-[10px] font-mono flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" /> {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner">
                  {activeBug.description}
                </div>
              </div>

              {/* Duplicate Candidates Found by AI */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>AI Duplicate Candidate Detection</span>
                  </div>
                  {isAnalyzing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>

                {duplicateCandidates.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 font-normal">
                    No duplicate candidate matches found (Similarity &lt; 18%).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {duplicateCandidates.map(cand => (
                      <div
                        key={cand.bugId}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              #{cand.bugNumber}
                            </span>
                            <span className="font-semibold text-xs text-slate-200 truncate font-sans">
                              {cand.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                            Match: <span className="text-amber-300 font-mono font-bold">{(cand.similarityScore * 100).toFixed(0)}%</span> • {cand.reason}
                          </div>
                        </div>

                        <button
                          onClick={() => handleMarkDuplicate(cand.bugId, cand.bugNumber)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-semibold shrink-0 transition-all duration-150 active:scale-[0.98]"
                        >
                          Mark Dup of #{cand.bugNumber}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Triage Classifier & Root Cause Suggestions */}
            <div className="space-y-4">
              {aiPrediction && (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4 shadow-md">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>AI Triage Classifier & Subsystem Routing</span>
                    </div>
                    <button
                      onClick={handleApplyAIPrediction}
                      disabled={isApplyingAi}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98] ${
                        isAiApplied
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isAiApplied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isApplyingAi ? 'Applying...' : isAiApplied ? 'AI Classification Applied ✓' : 'Apply AI Classification'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block uppercase">Predicted Severity</span>
                      <span className="font-bold text-emerald-400 capitalize">
                        {aiPrediction.suggestedSeverity} ({aiPrediction.suggestedPriority})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block uppercase">Suggested Routing</span>
                      <span className="font-bold text-slate-200 truncate block">
                        {aiPrediction.suggestedComponentName || activeBug.componentName}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 col-span-2 md:col-span-1">
                      <span className="text-slate-500 text-[10px] block uppercase">Security Sensitivity</span>
                      <span className={aiPrediction.isSecuritySensitive ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                        {aiPrediction.isSecuritySensitive ? '⚠️ Security Sensitive' : 'Standard Issue'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Language Stack Trace Inspector */}
                  {aiPrediction.parsedStackTrace && (
                    <div className="p-3.5 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                          ⚡ Parsed {aiPrediction.parsedStackTrace.detectedLanguage} Traceback
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-mono border border-cyan-500/30">
                          {aiPrediction.parsedStackTrace.errorType}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-rose-400 font-bold mb-1">{aiPrediction.parsedStackTrace.errorMessage}</div>
                        {aiPrediction.parsedStackTrace.culpritFile && (
                          <div className="text-[11px] text-slate-400">
                            Culprit: <span className="text-emerald-400 font-bold">{aiPrediction.parsedStackTrace.culpritFile}</span>
                            {aiPrediction.parsedStackTrace.culpritLine ? ` (Line ${aiPrediction.parsedStackTrace.culpritLine})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-300 text-xs font-semibold block font-sans">Hypothesized Root Cause:</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {aiPrediction.rootCauseAnalysis}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-300 text-xs font-semibold block font-sans">Proposed Fix Strategy:</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {aiPrediction.suggestedFixSummary}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-xs font-medium block font-mono">
                      Generated Reproduction Test Template:
                    </span>
                    <pre className="p-3 bg-slate-950 text-slate-300 text-[11px] font-mono rounded-xl border border-slate-800 overflow-x-auto shadow-inner">
                      {aiPrediction.suggestedTestCase}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <EmptyState
            icon={CheckCheck}
            title="No issue selected"
            description="Select an incoming bug from the triage queue on the left to review details and run AI duplicate checks."
          />
        </div>
      )}
    </div>
  );
};
