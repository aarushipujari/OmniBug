import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { X, Download, Upload, FileCode, Sparkles, Check, Eye, Copy } from 'lucide-react';

const SAMPLE_BUGZILLA_XML = `<?xml version="1.0" standalone="yes" ?>
<!DOCTYPE bugzilla SYSTEM "https://bugzilla.mozilla.org/bugzilla.dtd">
<bugzilla version="5.0.4" urlbase="https://bugzilla.mozilla.org/" maintainer="admin@mozilla.org">
  <bug>
    <bug_id>1849201</bug_id>
    <creation_ts>2026-08-28T10:00:00Z</creation_ts>
    <short_desc>Crash in WebRTC audio stream renegotiation during network handover</short_desc>
    <product>Quantum Web Platform</product>
    <component>Networking &amp; HTTP/3</component>
    <version>129.0</version>
    <bug_status>NEW</bug_status>
    <bug_severity>critical</bug_severity>
    <priority>P1</priority>
    <target_milestone>v129.0-release</target_milestone>
    <long_desc isprivate="0">
      <who>webrtc-dev@mozilla.org</who>
      <bug_when>2026-08-28T10:00:00Z</bug_when>
      <thetext>Under WiFi to Cellular handover, packet buffer ring underflow causes SIGSEGV crash in AudioStreamTrack::Renegotiate().</thetext>
    </long_desc>
  </bug>
</bugzilla>`;

export const ImportExportModal: React.FC = () => {
  const { isImportExportOpen, setIsImportExportOpen, refreshData, toast } = useApp();
  const [xmlText, setXmlText] = useState('');
  const [exportedXml, setExportedXml] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isImportExportOpen) return null;

  const handlePreviewExport = async () => {
    setIsExporting(true);
    try {
      const xml = await api.exportBugzillaXml();
      setExportedXml(xml);
      toast('XML Generated', 'Generated standard Mozilla Bugzilla DTD XML', 'info');
    } catch (e: any) {
      toast('Export Error', e.message, 'alert');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXml = async () => {
    try {
      const xml = exportedXml || (await api.exportBugzillaXml());
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnibug-export-${Date.now()}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export Successful', 'Downloaded Bugzilla DTD-compliant XML file', 'success');
    } catch (e: any) {
      toast('Export Error', e.message, 'alert');
    }
  };

  const handleLoadSample = () => {
    setXmlText(SAMPLE_BUGZILLA_XML);
    toast('Sample XML Loaded', 'Ready to parse and import sample Mozilla Bugzilla ticket', 'info');
  };

  const handleImportXml = async () => {
    if (!xmlText.trim()) {
      toast('Validation Error', 'Please paste Bugzilla XML content first', 'warning');
      return;
    }
    setIsImporting(true);
    try {
      const res = await api.importBugzillaXml(xmlText);
      toast('Import Successful', `Successfully imported ${res.importedCount} issues from Bugzilla XML`, 'success');
      setXmlText('');
      setIsImportExportOpen(false);
      await refreshData();
    } catch (e: any) {
      toast('XML Import Error', e.message || 'Invalid or malformed Bugzilla XML structure', 'alert');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-sans">
                Bugzilla XML Interoperability & Sync
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Two-way bidirectional XML import & export with Mozilla Bugzilla DTD schema
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImportExportOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs font-sans">
          {/* Export Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-200">Export to Standard Bugzilla XML</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-normal leading-relaxed">
                  Generates standard <code className="text-emerald-400">&lt;bugzilla&gt;</code> DTD-compatible XML with all bugs, flags, comments, milestones, and blocker graphs.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePreviewExport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-850 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98] font-mono"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> {isExporting ? 'Generating...' : 'Preview XML'}
                </button>
                <button
                  onClick={handleExportXml}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98] font-mono"
                >
                  <Download className="w-3.5 h-3.5" /> Download XML
                </button>
              </div>
            </div>

            {exportedXml && (
              <div className="mt-3 pt-3 border-t border-slate-850 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Generated &lt;bugzilla&gt; DTD Output Preview:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedXml);
                      toast('Copied', 'XML copied to clipboard', 'info');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700"
                  >
                    <Copy className="w-3 h-3" /> Copy XML
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px] font-mono max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {exportedXml}
                </pre>
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-200">Import from Legacy Bugzilla XML</h4>
                <p className="text-slate-400 text-xs mt-0.5 font-normal">
                  Paste raw XML exported from any Bugzilla 4.x/5.x or Mozilla bug repository:
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Load Sample XML
              </button>
            </div>

            <textarea
              rows={6}
              value={xmlText}
              onChange={e => setXmlText(e.target.value)}
              placeholder="Paste <bugzilla><bug>...</bug></bugzilla> XML here..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 shadow-inner leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleImportXml}
                disabled={!xmlText.trim() || isImporting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-all duration-150 active:scale-[0.98] font-mono"
              >
                <Upload className="w-4 h-4" /> {isImporting ? 'Importing...' : 'Parse & Import Bugs'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
