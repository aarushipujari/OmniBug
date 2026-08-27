import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { X, Download, Upload, FileCode, Check, AlertCircle } from 'lucide-react';

export const ImportExportModal: React.FC = () => {
  const { isImportExportOpen, setIsImportExportOpen, refreshData, toast } = useApp();
  const [xmlText, setXmlText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!isImportExportOpen) return null;

  const handleExportXml = async () => {
    try {
      const xml = await api.exportBugzillaXml();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omnibug-export-${Date.now()}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Export Successful', 'Downloaded Bugzilla XML export file', 'success');
    } catch (e: any) {
      toast('Export Error', e.message, 'alert');
    }
  };

  const handleImportXml = async () => {
    if (!xmlText.trim()) return;
    setIsImporting(true);
    try {
      const res = await api.importBugzillaXml(xmlText);
      toast('Import Successful', `Imported ${res.importedCount} issues from Bugzilla XML`, 'success');
      setXmlText('');
      setIsImportExportOpen(false);
      await refreshData();
    } catch (e: any) {
      toast('Import Error', e.message, 'alert');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Bugzilla XML Interoperability & Sync
            </h3>
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
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-200">Export to Standard Bugzilla XML</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Generates full `&lt;bugzilla&gt;` DTD-compatible XML with all bugs, flags, comments, and blocker trees.
                </p>
              </div>
              <button
                onClick={handleExportXml}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow transition-colors font-mono"
              >
                <Download className="w-4 h-4" /> Download XML
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div>
              <h4 className="font-bold text-sm text-slate-200">Import from Legacy Bugzilla XML</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Paste raw XML exported from any Bugzilla 4.x/5.x installation:
              </p>
            </div>

            <textarea
              rows={6}
              value={xmlText}
              onChange={e => setXmlText(e.target.value)}
              placeholder="Paste &lt;bugzilla&gt;&lt;bug&gt;...&lt;/bug&gt;&lt;/bugzilla&gt; XML here..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
            />

            <div className="flex justify-end">
              <button
                onClick={handleImportXml}
                disabled={!xmlText.trim() || isImporting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow transition-colors font-mono"
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
