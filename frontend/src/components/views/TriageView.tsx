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
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { EmptyState } from '../common/EmptyState.js';

export const TriageView: React.FC = () => {
  const { bugs, currentUser, refreshData, toast, setSelectedBugId, setIsCreateModalOpen } = useApp();
  const triageBugs = bugs.filter(b => b.status === 'UNCONFIRMED' || b.flags.some(f => f.name === 'needinfo'));

  const [activeBugId, setActiveBugId] = useState<string | null>(triageBugs[0]?.id || null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [aiPrediction, setAiPrediction] = useState<TriagePrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeBug = bugs.find(b => b.id === activeBugId) || triageBugs[0];

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
  }, [activeBugId]);

  const handleConfirmBug = async () => {
    if (!activeBug) return;
    try {
      await api.updateBug(activeBug.id, { status: 'NEW' }, currentUser);
      toast('Bug Confirmed', `Marked #${activeBug.bugNumber} as CONFIRMED (NEW)`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleApplyAIPrediction = async () => {
    if (!activeBug || !aiPrediction) return;
    try {
      await api.updateBug(
        activeBug.id,
        {
          severity: aiPrediction.suggestedSeverity,
          priority: aiPrediction.suggestedPriority,
          isSecuritySensitive: aiPrediction.isSecuritySensitive,
          tags: Array.from(new Set([...activeBug.tags, ...aiPrediction.suggestedTags])),
        },
        currentUser
      );
      toast('AI Classification Applied', `Updated severity to ${aiPrediction.suggestedSeverity}`, 'success');
      await refreshData();
    } catch (err: any) {
      toast('Error', err.message, 'alert');
    }
  };

  const handleMarkDuplicate = async (targetBugId: string) => {
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
      toast('Marked Duplicate', `Resolved #${activeBug.bugNumber} as duplicate of ${targetBugId}`, 'success');
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
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-slate-100 shadow-md'
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
      </div>

      {/* Right Pane: Bug Triage Workspace & AI Assistant */}
      {activeBug ? (
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Top Triage Action Bar */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-emerald-400">
                Triage Issue #{activeBug.bugNumber}
              </span>
              <SeverityBadge severity={activeBug.severity} priority={activeBug.priority} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmBug}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98]"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm as Bug
              </button>
              <button
                onClick={handleRequestNeedInfo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98]"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Request needinfo?
              </button>
              <button
                onClick={() => setSelectedBugId(activeBug.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98]"
              >
                Open Full Editor <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Details & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bug Content */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
                <h2 className="text-sm font-bold text-slate-100 mb-2 font-sans">{activeBug.title}</h2>
                <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner">
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
                    No duplicate candidate matches found (Similarity &lt; 20%).
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
                          onClick={() => handleMarkDuplicate(cand.bugId)}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>AI Triage Classifier & Root Cause Analysis</span>
                    </div>
                    <button
                      onClick={handleApplyAIPrediction}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98]"
                    >
                      Apply AI Classification
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block uppercase">Predicted Severity</span>
                      <span className="font-bold text-emerald-400 capitalize">
                        {aiPrediction.suggestedSeverity} ({aiPrediction.suggestedPriority})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block uppercase">Security Sensitivity</span>
                      <span className={aiPrediction.isSecuritySensitive ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                        {aiPrediction.isSecuritySensitive ? '⚠️ Security Sensitive' : 'Standard Bug'}
                      </span>
                    </div>
                  </div>

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
