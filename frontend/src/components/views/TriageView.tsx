import React, { useState, useEffect } from 'react';
import { useApp, useCurrentUser } from '../../context/AppContext.js';
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
  Play,
  CheckCircle2,
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { EmptyState } from '../common/EmptyState.js';

export const TriageView: React.FC = () => {
  const { allBugs, refreshData, toast, setSelectedBugId, setIsCreateModalOpen } = useApp();
  const currentUser = useCurrentUser();
  
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
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);

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
    if (activeBug.status === 'NEW') {
      toast('Already Confirmed', `#${activeBug.bugNumber} is already confirmed (NEW). Press 'I' to start investigation.`, 'info');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await api.updateBug(activeBug.id, { status: 'NEW' });
      toast('Bug Confirmed', `Marked #${activeBug.bugNumber} as CONFIRMED (NEW)`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Lifecycle Error', err.message, 'alert');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleInvestigateBug = async () => {
    if (!activeBug || isUpdatingStatus) return;
    if (activeBug.status === 'IN_PROGRESS') {
      toast('Already In Progress', `#${activeBug.bugNumber} is already under active investigation.`, 'info');
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await api.updateBug(
        activeBug.id,
        { status: 'IN_PROGRESS', assigneeId: currentUser.id, assigneeName: currentUser.name }
      );
      toast('Under Investigation', `Assigned #${activeBug.bugNumber} to you in IN_PROGRESS`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Lifecycle Error', err.message, 'alert');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQuickResolve = async () => {
    if (!activeBug || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateBug(activeBug.id, { status: 'RESOLVED', resolution: 'FIXED' });
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
      await api.updateBug(activeBug.id, { priority: pri });
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
      if ((e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (currentIndex < triageBugs.length - 1) {
          e.preventDefault();
          e.stopPropagation();
          setActiveBugId(triageBugs[currentIndex + 1].id);
        }
      } else if ((e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (currentIndex > 0) {
          e.preventDefault();
          e.stopPropagation();
          setActiveBugId(triageBugs[currentIndex - 1].id);
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmBug();
      } else if ((e.key === 'i' || e.key === 'I') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        handleInvestigateBug();
      } else if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        handleQuickResolve();
      } else if (['1', '2', '3', '4', '5'].includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
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

      await api.updateBug(activeBug.id, updates);
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
        }
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
      await api.setFlag(activeBug.id, 'needinfo', '?', activeBug.reporterId);
      toast('NeedInfo Requested', `Sent needinfo? request to ${activeBug.reporterName}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  /*
   * Really runs the test.
   *
   * This was a 450ms `setTimeout` that printed a fixed block of Jest output —
   * "2 passed", "Time: 0.015 s" — whether or not anything had been analyzed,
   * and for a test that referenced a helper which does not exist. The server
   * now synthesizes the test, executes it in an isolated VM context, and
   * returns the real assertions and the real timings, pass or fail.
   */
  const handleRunSandboxTest = async () => {
    if (!activeBug) return;
    setIsTestingSandbox(true);
    setSandboxResult(null);
    try {
      const { result } = await api.runReproductionTest(
        activeBug.title,
        activeBug.description,
        activeBug.productId
      );
      setSandboxResult(result.output);
      if (result.passed) {
        toast(
          'Reproduction test passed',
          `${result.assertions.length} assertions in ${result.totalDurationMs.toFixed(2)}ms`,
          'success'
        );
      } else {
        const failed = result.assertions.filter(a => !a.passed).length;
        toast('Reproduction test failed', result.error || `${failed} assertion(s) failed`, 'alert');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not run the test.';
      setSandboxResult(`✗ ${message}`);
      toast('Sandbox unavailable', message, 'alert');
    } finally {
      setIsTestingSandbox(false);
    }
  };

  const isAiApplied = appliedAiForBugId === activeBug?.id;

  return (
    <div className="flex-1 flex min-w-0 bg-slate-50 overflow-hidden font-sans animate-in fade-in duration-200">
      {/* Left List: Untriaged & NeedInfo Queue */}
      <div className="w-80 border-r border-slate-200 bg-white/70 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-xs text-slate-900">Triage & Verification Inbox</h3>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold border border-slate-300">
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
                      ? 'bg-white border-slate-300 text-slate-900 shadow-xs ring-1 ring-slate-300'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-900">#{bug.bugNumber}</span>
                    <StatusBadge status={bug.status} size="sm" />
                  </div>
                  <div className="font-semibold text-xs line-clamp-2 leading-relaxed mb-2 font-sans text-slate-900">
                    {bug.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-[120px]">{bug.componentName}</span>
                    <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard shortcut bar */}
        <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">J/K</kbd> Nav</span>
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">C</kbd> Confirm</span>
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">I</kbd> Investigate</span>
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">1-5</kbd> Pri</span>
        </div>
      </div>

      {/* Right Pane: Bug Triage Workspace & AI Assistant */}
      {activeBug ? (
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Top Triage Action Bar */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-900">
                #{activeBug.bugNumber}
              </span>
              <StatusBadge status={activeBug.status} resolution={activeBug.resolution} />
              <SeverityBadge severity={activeBug.severity} priority={activeBug.priority} />
              {activeBug.isSecuritySensitive && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                  <Shield className="w-3 h-3 text-red-600" /> Security
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeBug.status === 'UNCONFIRMED' && (
                <button
                  onClick={handleConfirmBug}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors"
                  title="Confirm reproduction and move to NEW (C)"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isUpdatingStatus ? 'Confirming...' : 'Confirm as Bug (C)'}</span>
                </button>
              )}

              {activeBug.status !== 'IN_PROGRESS' && activeBug.status !== 'RESOLVED' && activeBug.status !== 'CLOSED' && (
                <button
                  onClick={handleInvestigateBug}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-md text-xs font-semibold transition-colors"
                  title="Assign to self and start work (I)"
                >
                  <Play className="w-3.5 h-3.5 text-slate-700" />
                  <span>{isUpdatingStatus ? 'Starting...' : 'Investigate (I)'}</span>
                </button>
              )}

              <button
                onClick={handleRequestNeedInfo}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                title="Request info from reporter"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> needinfo?
              </button>
              <button
                onClick={() => setSelectedBugId(activeBug.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200 transition-colors"
              >
                Full Details <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Details & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bug Content & Metadata */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 font-sans leading-snug">{activeBug.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Layers className="w-3 h-3 text-slate-400" /> {activeBug.productName} / {activeBug.componentName}
                    </span>
                    {activeBug.targetMilestone && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {activeBug.targetMilestone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {activeBug.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {activeBug.tags.map(t => (
                      <span
                        key={t}
                        className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" /> {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed p-3 bg-slate-50 rounded-md border border-slate-100">
                  {activeBug.description}
                </div>
              </div>

              {/* Duplicate Candidates */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 font-mono">
                    <span>Duplicate Candidates</span>
                  </div>
                  {isAnalyzing && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
                </div>

                {duplicateCandidates.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2 font-normal">
                    No duplicate matches found.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {duplicateCandidates.map(cand => (
                      <div
                        key={cand.bugId}
                        className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              #{cand.bugNumber}
                            </span>
                            <span className="font-medium text-xs text-slate-900 truncate font-sans">
                              {cand.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                            Match: <span className="text-slate-900 font-mono font-medium">{(cand.similarityScore * 100).toFixed(0)}%</span> • {cand.reason}
                          </div>
                        </div>

                        <button
                          onClick={() => handleMarkDuplicate(cand.bugId, cand.bugNumber)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-xs font-mono shrink-0 transition-colors"
                        >
                          Mark Duplicate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Triage & Traceback */}
            <div className="space-y-4">
              {aiPrediction && (
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 font-mono">
                      <span>Smart Triage Routing</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Offline
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleApplyAIPrediction}
                        disabled={isApplyingAi}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          isAiApplied
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isAiApplied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isApplyingAi ? 'Applying...' : isAiApplied ? 'Applied ✓' : 'Apply'}</span>
                      </button>
                      <button
                        onClick={() => {
                          toast('Dismissed', 'Suggestion dismissed', 'info');
                          setAppliedAiForBugId('dismissed');
                        }}
                        className="px-2 py-1 rounded text-xs font-mono text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-medium">Severity</span>
                      <span className="font-semibold text-slate-900 capitalize block">
                        {aiPrediction.suggestedSeverity} ({aiPrediction.suggestedPriority})
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-medium">Component</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {aiPrediction.suggestedComponentName || activeBug.componentName}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100 col-span-2 md:col-span-1">
                      <span className="text-slate-400 text-[10px] block uppercase font-medium">Security</span>
                      <span className={aiPrediction.isSecuritySensitive ? 'text-red-600 font-semibold block' : 'text-slate-600 block'}>
                        {aiPrediction.isSecuritySensitive ? 'Quarantine' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Language Stack Trace */}
                  {aiPrediction.parsedStackTrace && (
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900 font-mono">
                          Parsed {aiPrediction.parsedStackTrace.detectedLanguage} Traceback
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 font-mono border border-slate-200">
                          {aiPrediction.parsedStackTrace.errorType}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
                        <div className="text-red-600 font-medium mb-0.5">{aiPrediction.parsedStackTrace.errorMessage}</div>
                        {aiPrediction.parsedStackTrace.culpritFile && (
                          <div className="text-[11px] text-slate-500">
                            Culprit: <span className="text-slate-900 font-medium">{aiPrediction.parsedStackTrace.culpritFile}</span>
                            {aiPrediction.parsedStackTrace.culpritLine ? ` (Line ${aiPrediction.parsedStackTrace.culpritLine})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-1">
                    <span className="text-slate-900 text-xs font-medium block">Root Cause Analysis:</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {aiPrediction.rootCauseAnalysis}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-1">
                    <span className="text-slate-900 text-xs font-medium block">Fix Strategy:</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {aiPrediction.suggestedFixSummary}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono">
                        Reproduction Test Template:
                      </span>
                      <button
                        type="button"
                        onClick={handleRunSandboxTest}
                        disabled={isTestingSandbox || !activeBug}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-mono transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-slate-700" />
                        <span>{isTestingSandbox ? 'Executing...' : 'Run Test'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 bg-slate-50 text-slate-800 text-[11px] font-mono rounded-md border border-slate-200 overflow-x-auto">
                      {aiPrediction.suggestedTestCase}
                    </pre>

                    {sandboxResult && (
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sandbox output</span>
                        </div>
                        <pre className="text-[10.5px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap bg-white p-2 rounded border border-slate-200">
                          {sandboxResult}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
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
