import React, { useState } from 'react';
import { FileCode, Split, AlignJustify, Copy, Check } from 'lucide-react';

interface DiffViewerProps {
  patchContent: string;
  fileName?: string;
}

interface DiffLine {
  type: 'add' | 'delete' | 'context' | 'header' | 'meta';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patchContent, fileName = 'patch.diff' }) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const lines = patchContent.split('\n');
  const parsedLines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of lines) {
    if (raw.startsWith('---') || raw.startsWith('+++')) {
      parsedLines.push({ type: 'meta', content: raw });
    } else if (raw.startsWith('@@')) {
      // Hunk header e.g. @@ -142,8 +142,12 @@
      const match = raw.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      parsedLines.push({ type: 'header', content: raw });
    } else if (raw.startsWith('+')) {
      parsedLines.push({
        type: 'add',
        newLineNumber: newLine++,
        content: raw.substring(1),
      });
    } else if (raw.startsWith('-')) {
      parsedLines.push({
        type: 'delete',
        oldLineNumber: oldLine++,
        content: raw.substring(1),
      });
    } else {
      parsedLines.push({
        type: 'context',
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
        content: raw.startsWith(' ') ? raw.substring(1) : raw,
      });
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(patchContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden font-mono text-xs shadow-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 text-slate-800">
          <FileCode className="w-4 h-4 text-slate-700" />
          <span className="font-semibold">{fileName}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Git Patch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                viewMode === 'unified'
                  ? 'bg-white text-slate-900 font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlignJustify className="w-3 h-3" /> Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-slate-900 font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Split className="w-3 h-3" /> Split
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors font-sans text-[11px] shadow-xs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Raw Patch'}</span>
          </button>
        </div>
      </div>

      {/* Diff Code Container */}
      <div className="overflow-x-auto max-h-96">
        {viewMode === 'unified' ? (
          <div className="divide-y divide-slate-100">
            {parsedLines.map((line, idx) => {
              if (line.type === 'meta') {
                return (
                  <div key={idx} className="px-4 py-1 text-slate-500 bg-slate-50 italic text-[11px]">
                    {line.content}
                  </div>
                );
              }
              if (line.type === 'header') {
                return (
                  <div key={idx} className="px-4 py-1.5 text-slate-700 bg-slate-100 font-semibold border-y border-slate-200">
                    {line.content}
                  </div>
                );
              }

              const isAdd = line.type === 'add';
              const isDel = line.type === 'delete';

              return (
                <div
                  key={idx}
                  className={`flex items-start transition-colors ${
                    isAdd
                      ? 'bg-emerald-50 text-emerald-900'
                      : isDel
                      ? 'bg-red-50 text-red-900'
                      : 'text-slate-800 bg-white'
                  }`}
                >
                  {/* Line numbers */}
                  <div className="flex select-none text-[11px] text-slate-400 bg-slate-50/70 border-r border-slate-200 text-right shrink-0">
                    <span className="w-10 px-2 py-0.5">{line.oldLineNumber ?? ''}</span>
                    <span className="w-10 px-2 py-0.5 border-l border-slate-200">{line.newLineNumber ?? ''}</span>
                  </div>
                  {/* Diff marker */}
                  <div className="w-6 text-center select-none py-0.5 font-bold shrink-0">
                    {isAdd ? '+' : isDel ? '-' : ' '}
                  </div>
                  {/* Content */}
                  <div className="py-0.5 px-2 whitespace-pre font-mono flex-1 overflow-x-auto">
                    {line.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-200 text-[11px]">
            {/* Split View Left: Original / Deletions */}
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 font-bold text-slate-600 border-b border-slate-200 text-[10px] uppercase font-mono">
                Original (Base)
              </div>
              {parsedLines.map((line, idx) => {
                if (line.type === 'meta' || line.type === 'header') {
                  return (
                    <div key={`left-${idx}`} className="px-3 py-1 text-slate-500 bg-slate-50 truncate">
                      {line.content}
                    </div>
                  );
                }
                if (line.type === 'add') {
                  return (
                    <div key={`left-${idx}`} className="flex items-center bg-slate-50/50 text-slate-400 py-0.5">
                      <span className="w-9 px-2 text-right text-slate-300 select-none"> </span>
                      <span className="px-2 select-none"> </span>
                    </div>
                  );
                }
                const isDel = line.type === 'delete';
                return (
                  <div
                    key={`left-${idx}`}
                    className={`flex items-start ${isDel ? 'bg-red-50 text-red-900' : 'text-slate-800'}`}
                  >
                    <span className="w-9 px-2 py-0.5 text-right text-slate-400 select-none border-r border-slate-200 shrink-0">
                      {line.oldLineNumber ?? ''}
                    </span>
                    <span className="w-4 text-center py-0.5 select-none font-bold shrink-0">{isDel ? '-' : ' '}</span>
                    <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1">{line.content}</span>
                  </div>
                );
              })}
            </div>

            {/* Split View Right: Modified / Additions */}
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 font-bold text-slate-900 border-b border-slate-200 text-[10px] uppercase font-mono">
                Proposed Patch
              </div>
              {parsedLines.map((line, idx) => {
                if (line.type === 'meta' || line.type === 'header') {
                  return (
                    <div key={`right-${idx}`} className="px-3 py-1 text-slate-500 bg-slate-50 truncate">
                      {line.content}
                    </div>
                  );
                }
                if (line.type === 'delete') {
                  return (
                    <div key={`right-${idx}`} className="flex items-center bg-slate-50/50 text-slate-400 py-0.5">
                      <span className="w-9 px-2 text-right text-slate-300 select-none"> </span>
                      <span className="px-2 select-none"> </span>
                    </div>
                  );
                }
                const isAdd = line.type === 'add';
                return (
                  <div
                    key={`right-${idx}`}
                    className={`flex items-start ${isAdd ? 'bg-emerald-50 text-emerald-900' : 'text-slate-800'}`}
                  >
                    <span className="w-9 px-2 py-0.5 text-right text-slate-400 select-none border-r border-slate-200 shrink-0">
                      {line.newLineNumber ?? ''}
                    </span>
                    <span className="w-4 text-center py-0.5 select-none font-bold shrink-0">{isAdd ? '+' : ' '}</span>
                    <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1">{line.content}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
