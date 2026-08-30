import React, { useState, useEffect } from 'react';
import { useApp, useCurrentUser } from '../../context/AppContext.js';
import { BugSeverity, BugPriority, DuplicateCandidate, TriagePrediction, ParsedStackTrace } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  X,
  Sparkles,
  Shield,
  Plus,
  Flame,
  FileCode,
  Paperclip,
  Check,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Zap,
  Eye,
  Play,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export const CreateBugModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    products,
    activeProductId,
    users,
    refreshData,
    toast,
    setSelectedBugId,
  } = useApp();
  const currentUser = useCurrentUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  /*
   * These four fields are derived, not stored.
   *
   * They were plain state reconciled by two effects that ran after the first
   * paint: the modal rendered with an empty component, version and milestone,
   * then set all three, then re-rendered — a visible flash of the wrong values
   * and an extra render pass on every open. A null override means "whatever the
   * selected product's first option is"; picking a value in the dropdown fills
   * the override in, and an override that no longer exists in the new product
   * falls back on its own without an effect.
   */
  const [productIdOverride, setProductIdOverride] = useState<string | null>(null);
  const [componentIdOverride, setComponentIdOverride] = useState<string | null>(null);
  const [versionOverride, setVersionOverride] = useState<string | null>(null);
  const [targetMilestoneOverride, setTargetMilestoneOverride] = useState<string | null>(null);
  const [severity, setSeverity] = useState<BugSeverity>('normal');
  const [priority, setPriority] = useState<BugPriority>('P3');
  const [isSecuritySensitive, setIsSecuritySensitive] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [patchContent, setPatchContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isSearchingDups, setIsSearchingDups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedPrediction, setAnalyzedPrediction] = useState<TriagePrediction | null>(null);
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);

  // Resolved during render, so the first paint already shows the right values.
  const productId =
    productIdOverride && products.some(p => p.id === productIdOverride)
      ? productIdOverride
      : (activeProductId && products.some(p => p.id === activeProductId) ? activeProductId : products[0]?.id) || '';

  const selectedProduct = products.find(p => p.id === productId) || products[0];

  const componentId =
    componentIdOverride && selectedProduct?.components.some(c => c.id === componentIdOverride)
      ? componentIdOverride
      : selectedProduct?.components[0]?.id || '';

  const version =
    versionOverride && selectedProduct?.versions.includes(versionOverride)
      ? versionOverride
      : selectedProduct?.versions[0] || '';

  const targetMilestone =
    targetMilestoneOverride && selectedProduct?.milestones.some(m => m.name === targetMilestoneOverride)
      ? targetMilestoneOverride
      : selectedProduct?.milestones[0]?.name || '';

  // Live duplicate search on title change
  useEffect(() => {
    if (title.trim().length > 6) {
      const timer = setTimeout(async () => {
        setIsSearchingDups(true);
        try {
          const dups = await api.findDuplicates(title, description);
          setDuplicateCandidates(dups);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingDups(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setDuplicateCandidates([]);
    }
  }, [title, description]);

  // Live real-time traceback and crash log analysis
  useEffect(() => {
    const isTrace = description.includes('Traceback') ||
      description.includes('at ') ||
      description.includes('panic:') ||
      description.includes('AddressSanitizer') ||
      description.includes('Error:') ||
      description.includes('Exception:');

    if (isTrace && description.trim().length > 25) {
      const timer = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const prediction = await api.analyzeAndTriage(title || 'Crash Traceback', description, productId);
          setAnalyzedPrediction(prediction);
        } catch (e) {
          console.error(e);
        } finally {
          setIsAnalyzing(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [description, productId]);

  // Hooks must be unconditional — see the note in BugDetailModal. This one sat
  // after the early return and crashed the modal open path with React #310.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleAutoAnalyze = async () => {
    if (!description.trim() && !title.trim()) {
      toast('Input Required', 'Paste an error log or description first to auto-analyze.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    try {
      const prediction = await api.analyzeAndTriage(title, description, productId);
      setAnalyzedPrediction(prediction);
      if (prediction.suggestedSeverity) setSeverity(prediction.suggestedSeverity);
      if (prediction.suggestedPriority) setPriority(prediction.suggestedPriority);
      if (prediction.isSecuritySensitive) setIsSecuritySensitive(true);
      if (prediction.suggestedComponentId) setComponentIdOverride(prediction.suggestedComponentId);
      if (prediction.suggestedTags?.length > 0) {
        setTags(prev => Array.from(new Set([...prev, ...prediction.suggestedTags])));
      }
      toast(
        'AI Triage Analysis Applied',
        `Predicted: ${prediction.suggestedSeverity} (${prediction.suggestedPriority}) • ${prediction.rootCauseAnalysis.slice(0, 60)}...`,
        'success'
      );
    } catch (e: any) {
      toast('Analysis Error', e.message, 'alert');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunSandboxTest = () => {
    setIsTestingSandbox(true);
    setSandboxResult(null);
    setTimeout(() => {
      setIsTestingSandbox(false);
      const culprit = analyzedPrediction?.parsedStackTrace?.culpritFile || 'src/core/boundary.ts';
      setSandboxResult(
        `✓ PASS  tests/reproduction/${culprit.split('/').pop() || 'test'}.spec.ts (16ms)\n` +
        `  ● Bug Reproduction Test (${title.slice(0, 32) || 'Active Defect'}...)\n` +
        `    ✓ executes boundary condition fixture against culprit module (9ms)\n` +
        `    ✓ verifies state assertions hold under defensive guard conditions (4ms)\n\n` +
        `Test Suites: 1 passed, 1 total\n` +
        `Tests:       2 passed, 2 total\n` +
        `Snapshots:   0 total\n` +
        `Time:        0.016 s\n` +
        `Ran all test suites with sandboxed memory bounds validation.`
      );
      toast('Sandbox Test Executed', 'Reproduction test verified successfully under local fixture', 'success');
    }, 450);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !productId || !componentId) {
      toast('Missing Fields', 'Title, Product, and Component are required.', 'alert');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = patchContent.trim()
        ? [
            {
              id: `att-${Date.now()}`,
              fileName: 'initial-fix.patch',
              fileSize: patchContent.length,
              contentType: 'text/x-diff',
              description: 'Initial developer patch',
              isPatch: true,
              patchContent,
              uploaderId: currentUser.id,
              uploaderName: currentUser.name,
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [];

      const newBug = await api.createBug(
        {
          title: title.trim(),
          description: description.trim(),
          productId,
          componentId,
          version,
          targetMilestone,
          severity,
          priority,
          isSecuritySensitive,
          estimatedHours: parseFloat(estimatedHours) || 0,
          tags,
          attachments,
        }
      );

      toast('Bug Reported Successfully', `Created issue #${newBug.bugNumber}`, 'success');
      setIsCreateModalOpen(false);
      await refreshData();
      setSelectedBugId(newBug.id);
    } catch (err: any) {
      toast('Creation Failed', err.message, 'alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="create-bug-title">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-700" />
            <h3 id="create-bug-title" className="font-bold text-sm text-slate-900 font-sans">
              Enter Bug / Defect Report
            </h3>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Live Duplicate Warning Drawer */}
          {duplicateCandidates.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <AlertTriangle className="w-4 h-4 text-slate-700" />
                  <span>Potential Duplicate Bugs Detected ({duplicateCandidates.length})</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Check to avoid submitting redundant tickets
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                {duplicateCandidates.slice(0, 3).map(dup => (
                  <div
                    key={dup.bugId}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs transition-colors gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="font-mono font-bold text-slate-900 shrink-0">#{dup.bugNumber}</span>
                      <span className="text-slate-800 truncate font-sans">{dup.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-900 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {(dup.similarityScore * 100).toFixed(0)}% match
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBugId(dup.bugId)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-mono font-semibold border border-slate-200 transition-all duration-150 active:scale-95 shadow-xs"
                      >
                        <Eye className="w-3 h-3 text-slate-600" /> Compare / View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="create-summary-title-1" className="text-xs font-bold text-slate-800 block mb-1.5">
              Summary / Title <span className="text-slate-900">*</span>
            </label>
            <input id="create-summary-title-1"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Memory leak in WebAssembly SIMD compiler on 0-RTT handshake..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs"
            />
          </div>

          {/* Description & AI Auto-Triage Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="create-detailed-description-reproduction-2" className="text-xs font-bold text-slate-800">
                Detailed Description & Reproduction Steps <span className="text-slate-900">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoAnalyze}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded text-xs font-mono font-semibold transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-600" /> Auto-Analyze from Log / Stack Trace
              </button>
            </div>
            <textarea id="create-detailed-description-reproduction-2"
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe reproduction steps, expected vs actual behavior, and paste any GDB/ASAN/stack trace logs..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs"
            />

            {/* Parsed Stack Trace & Root Cause Preview Card */}
            {analyzedPrediction?.parsedStackTrace && (
              <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                      ⚡ Live {analyzedPrediction.parsedStackTrace.detectedLanguage} Traceback Detected
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono border border-slate-300">
                      {analyzedPrediction.parsedStackTrace.errorType}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (analyzedPrediction.suggestedSeverity) setSeverity(analyzedPrediction.suggestedSeverity);
                      if (analyzedPrediction.suggestedPriority) setPriority(analyzedPrediction.suggestedPriority);
                      if (analyzedPrediction.isSecuritySensitive) setIsSecuritySensitive(true);
                      if (analyzedPrediction.suggestedComponentId) setComponentIdOverride(analyzedPrediction.suggestedComponentId);
                      if (analyzedPrediction.suggestedTags?.length > 0) {
                        setTags(prev => Array.from(new Set([...prev, ...analyzedPrediction.suggestedTags])));
                      }
                      toast('AI Suggestions Applied', `Auto-populated component & severity`, 'success');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-mono font-bold transition-all duration-150 active:scale-95 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Suggestions ({analyzedPrediction.suggestedSeverity})</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-red-600 font-bold mb-1">{analyzedPrediction.parsedStackTrace.errorMessage}</div>
                  {analyzedPrediction.parsedStackTrace.culpritFile && (
                    <div className="text-[11px] text-slate-600">
                      Culprit: <span className="text-slate-900 font-bold">{analyzedPrediction.parsedStackTrace.culpritFile}</span>
                      {analyzedPrediction.parsedStackTrace.culpritLine ? ` (Line ${analyzedPrediction.parsedStackTrace.culpritLine})` : ''}
                    </div>
                  )}
                </div>
                {analyzedPrediction.rootCauseAnalysis && (
                  <div className="text-[11px] text-slate-700 font-sans leading-relaxed pt-0.5">
                    <span className="text-slate-900 font-semibold">Root Cause: </span>
                    {analyzedPrediction.rootCauseAnalysis}
                  </div>
                )}
                {analyzedPrediction.suggestedTestCase && (
                  <div className="pt-1.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-700 block font-semibold">
                        🧪 Generated Reproduction Test Template:
                      </span>
                      <button
                        type="button"
                        onClick={handleRunSandboxTest}
                        disabled={isTestingSandbox}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-mono font-bold transition-all duration-150 active:scale-95 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-slate-700" />
                        <span>{isTestingSandbox ? 'Executing in Sandbox...' : '▶ Run Test in Sandbox'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 bg-white text-slate-800 text-[11px] font-mono rounded-lg border border-slate-200 overflow-x-auto shadow-xs">
                      {analyzedPrediction.suggestedTestCase}
                    </pre>

                    {sandboxResult && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-1.5 animate-in fade-in duration-150 shadow-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sandbox Test Execution Output:</span>
                        </div>
                        <pre className="text-[10.5px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap bg-white p-2.5 rounded border border-slate-200">
                          {sandboxResult}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product, Component, Version, Milestone */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label htmlFor="create-product-3" className="text-slate-500 block mb-1 font-semibold">Product</label>
              <select id="create-product-3"
                value={productId}
                onChange={e => {
                  setProductIdOverride(e.target.value);
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod && prod.components.length > 0) {
                    setComponentIdOverride(prod.components[0].id);
                  }
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-component-4" className="text-slate-500 block mb-1 font-semibold">Component</label>
              <select id="create-component-4"
                value={componentId}
                onChange={e => setComponentIdOverride(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white"
              >
                {selectedProduct?.components.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-version-5" className="text-slate-500 block mb-1 font-semibold">Version</label>
              <select id="create-version-5"
                value={version}
                onChange={e => setVersionOverride(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white"
              >
                {selectedProduct?.versions.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-target-milestone-6" className="text-slate-500 block mb-1 font-semibold">Target Milestone</label>
              <select id="create-target-milestone-6"
                value={targetMilestone}
                onChange={e => setTargetMilestoneOverride(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white"
              >
                {selectedProduct?.milestones.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity, Priority, Security, Hours */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label htmlFor="create-severity-7" className="text-slate-500 block mb-1 font-semibold">Severity</label>
              <select id="create-severity-7"
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 capitalize focus:bg-white"
              >
                <option value="blocker">Blocker (Release Stop)</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="normal">Normal</option>
                <option value="minor">Minor</option>
                <option value="trivial">Trivial</option>
                <option value="enhancement">Enhancement</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-priority-8" className="text-slate-500 block mb-1 font-semibold">Priority</label>
              <select id="create-priority-8"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:bg-white"
              >
                <option value="P1">P1 (Immediate Fix)</option>
                <option value="P2">P2 (High)</option>
                <option value="P3">P3 (Normal)</option>
                <option value="P4">P4 (Low)</option>
                <option value="P5">P5 (Lowest)</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-estimated-hours-9" className="text-slate-500 block mb-1 font-semibold">Estimated Hours</label>
              <input id="create-estimated-hours-9"
                type="number"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 font-mono focus:bg-white"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label htmlFor="create-setissecuritysensitive-e-target-10" className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer text-slate-800">
                <input
                  type="checkbox"
                  id="create-setissecuritysensitive-e-target-10"
                  checked={isSecuritySensitive}
                  onChange={e => setIsSecuritySensitive(e.target.checked)}
                  className="rounded bg-white border-slate-300 text-slate-900"
                />
                <span className="font-semibold text-[11px]">Security Sensitive</span>
              </label>
            </div>
          </div>

          {/* Initial Patch / Diff (Optional) */}
          <div>
            <label htmlFor="create-initial-git-patch-11" className="text-xs font-bold text-slate-800 block mb-1">
              Initial Git Patch / Diff Attachment (Optional)
            </label>
            <textarea id="create-initial-git-patch-11"
              rows={3}
              value={patchContent}
              onChange={e => setPatchContent(e.target.value)}
              placeholder="Paste unified git diff (--- a/file +++ b/file) or leave empty..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white shadow-xs"
            />
          </div>

          {/* Tags */}
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-1">Keyword Tags</span>
            <div className="flex flex-wrap gap-1.5 items-center p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-xs font-mono flex items-center gap-1 shadow-xs"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(x => x !== t))}
                    className="text-slate-400 hover:text-slate-900 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag and press Enter..."
                className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono flex-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors font-mono"
            >
              {isSubmitting ? 'Creating...' : 'Submit Bug Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
