import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { BugSeverity, BugPriority, DuplicateCandidate } from '../../types/index.js';
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
} from 'lucide-react';

export const CreateBugModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    products,
    activeProductId,
    currentUser,
    users,
    refreshData,
    toast,
    setSelectedBugId,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState<string>(activeProductId || products[0]?.id || 'prod-1');
  const [componentId, setComponentId] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [targetMilestone, setTargetMilestone] = useState<string>('');
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

  // Sync selected product components
  const selectedProduct = products.find(p => p.id === productId) || products[0];

  useEffect(() => {
    if (selectedProduct) {
      if (!componentId && selectedProduct.components.length > 0) {
        setComponentId(selectedProduct.components[0].id);
      }
      if (!version && selectedProduct.versions.length > 0) {
        setVersion(selectedProduct.versions[0]);
      }
      if (!targetMilestone && selectedProduct.milestones.length > 0) {
        setTargetMilestone(selectedProduct.milestones[0].name);
      }
    }
  }, [selectedProduct, componentId, version, targetMilestone]);

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

  if (!isCreateModalOpen) return null;

  const handleAutoAnalyze = async () => {
    if (!description.trim() && !title.trim()) {
      toast('Input Required', 'Paste an error log or description first to auto-analyze.', 'warning');
      return;
    }

    try {
      const prediction = await api.analyzeAndTriage(title, description, productId);
      if (prediction.suggestedSeverity) setSeverity(prediction.suggestedSeverity);
      if (prediction.suggestedPriority) setPriority(prediction.suggestedPriority);
      if (prediction.isSecuritySensitive) setIsSecuritySensitive(true);
      if (prediction.suggestedComponentId) setComponentId(prediction.suggestedComponentId);
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
    }
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
        },
        currentUser
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              Enter Bug / Defect Report
            </h3>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Live Duplicate Warning Drawer */}
          {duplicateCandidates.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Potential Duplicate Bugs Detected ({duplicateCandidates.length})</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Check to avoid submitting redundant tickets
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                {duplicateCandidates.slice(0, 3).map(dup => (
                  <div
                    key={dup.bugId}
                    onClick={() => setSelectedBugId(dup.bugId)}
                    className="p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-emerald-400">#{dup.bugNumber}</span>
                      <span className="text-slate-200 truncate">{dup.title}</span>
                    </div>
                    <span className="text-amber-400 font-mono text-[11px] font-bold shrink-0">
                      {(dup.similarityScore * 100).toFixed(0)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Summary / Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Memory leak in WebAssembly SIMD compiler on 0-RTT handshake..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Description & AI Auto-Triage Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Detailed Description & Reproduction Steps <span className="text-emerald-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoAnalyze}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-mono font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Analyze from Log / Stack Trace
              </button>
            </div>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe reproduction steps, expected vs actual behavior, and paste any GDB/ASAN/stack trace logs..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Product, Component, Version, Milestone */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Product</label>
              <select
                value={productId}
                onChange={e => {
                  setProductId(e.target.value);
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod && prod.components.length > 0) {
                    setComponentId(prod.components[0].id);
                  }
                }}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Component</label>
              <select
                value={componentId}
                onChange={e => setComponentId(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                {selectedProduct?.components.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Version</label>
              <select
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                {selectedProduct?.versions.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Milestone</label>
              <select
                value={targetMilestone}
                onChange={e => setTargetMilestone(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
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
              <label className="text-slate-400 block mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 capitalize"
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
              <label className="text-slate-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                <option value="P1">P1 (Immediate Fix)</option>
                <option value="P2">P2 (High)</option>
                <option value="P3">P3 (Normal)</option>
                <option value="P4">P4 (Low)</option>
                <option value="P5">P5 (Lowest)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Estimated Hours</label>
              <input
                type="number"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-purple-950/20 border border-purple-900/40 rounded cursor-pointer text-purple-300">
                <input
                  type="checkbox"
                  checked={isSecuritySensitive}
                  onChange={e => setIsSecuritySensitive(e.target.checked)}
                  className="rounded bg-slate-800 text-purple-500"
                />
                <span className="font-semibold text-[11px]">Security Sensitive</span>
              </label>
            </div>
          </div>

          {/* Initial Patch / Diff (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Initial Git Patch / Diff Attachment (Optional)
            </label>
            <textarea
              rows={3}
              value={patchContent}
              onChange={e => setPatchContent(e.target.value)}
              placeholder="Paste unified git diff (--- a/file +++ b/file) or leave empty..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Keyword Tags</label>
            <div className="flex flex-wrap gap-1.5 items-center p-2 bg-slate-950 border border-slate-800 rounded-lg">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(x => x !== t))}
                    className="text-slate-500 hover:text-white"
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
                className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono flex-1 min-w-[120px]"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/50 transition-colors font-mono"
            >
              {isSubmitting ? 'Creating...' : 'Submit Bug Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
