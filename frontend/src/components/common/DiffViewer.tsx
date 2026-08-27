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
    <div className="rounded-lg border border-slate-800 bg-slate-900/90 overflow-hidden font-mono text-xs shadow-lg">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-850 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{fileName}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Git Patch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                viewMode === 'unified'
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify className="w-3 h-3" /> Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors ${
                viewMode === 'split'
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3 h-3" /> Split
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors font-sans text-[11px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Raw Patch'}</span>
          </button>
        </div>
      </div>

      {/* Diff Code Container */}
      <div className="overflow-x-auto max-h-96">
        {viewMode === 'unified' ? (
          <div className="divide-y divide-slate-850/50">
            {parsedLines.map((line, idx) => {
              if (line.type === 'meta') {
                return (
                  <div key={idx} className="px-4 py-1 text-slate-400 bg-slate-900/50 italic text-[11px]">
                    {line.content}
                  </div>
                );
              }
              if (line.type === 'header') {
                return (
                  <div key={idx} className="px-4 py-1.5 text-cyan-400 bg-cyan-950/20 font-semibold border-y border-cyan-900/30">
                    {line.content}
                  </div>
                );
              }

              const isAdd = line.type === 'add';
              const isDel = line.type === 'delete';

              return (
                <div
                  key={idx}
                  className={`flex items-start hover:brightness-110 transition-colors ${
                    isAdd
                      ? 'bg-emerald-950/25 text-emerald-300'
                      : isDel
                      ? 'bg-rose-950/25 text-rose-300'
                      : 'text-slate-300 bg-transparent'
                  }`}
                >
                  {/* Line numbers */}
                  <div className="flex select-none text-[11px] text-slate-500 bg-slate-950/40 border-r border-slate-800 text-right shrink-0">
                    <span className="w-10 px-2 py-0.5">{line.oldLineNumber ?? ''}</span>
                    <span className="w-10 px-2 py-0.5 border-l border-slate-850">{line.newLineNumber ?? ''}</span>
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
          <div className="grid grid-cols-2 divide-x divide-slate-800 text-[11px]">
            {/* Split View Left: Original / Deletions */}
            <div className="divide-y divide-slate-850/50">
              <div className="px-3 py-1.5 bg-slate-950/80 font-bold text-slate-400 border-b border-slate-800 text-[10px] uppercase font-mono">
                Original (Base)
              </div>
              {parsedLines.map((line, idx) => {
                if (line.type === 'meta' || line.type === 'header') {
                  return (
                    <div key={`left-${idx}`} className="px-3 py-1 text-slate-500 bg-slate-950/30 truncate">
                      {line.content}
                    </div>
                  );
                }
                if (line.type === 'add') {
                  return (
                    <div key={`left-${idx}`} className="flex items-center bg-slate-950/20 text-slate-600 py-0.5">
                      <span className="w-9 px-2 text-right text-slate-700 select-none"> </span>
                      <span className="px-2 select-none"> </span>
                    </div>
                  );
                }
                const isDel = line.type === 'delete';
                return (
                  <div
                    key={`left-${idx}`}
                    className={`flex items-start ${isDel ? 'bg-rose-950/30 text-rose-300' : 'text-slate-300'}`}
                  >
                    <span className="w-9 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-800 shrink-0">
                      {line.oldLineNumber ?? ''}
                    </span>
                    <span className="w-4 text-center py-0.5 select-none font-bold shrink-0">{isDel ? '-' : ' '}</span>
                    <span className="py-0.5 px-2 whitespace-pre overflow-x-auto flex-1">{line.content}</span>
                  </div>
                );
              })}
            </div>

            {/* Split View Right: Modified / Additions */}
            <div className="divide-y divide-slate-850/50">
              <div className="px-3 py-1.5 bg-slate-950/80 font-bold text-emerald-400 border-b border-slate-800 text-[10px] uppercase font-mono">
                Proposed Patch
              </div>
              {parsedLines.map((line, idx) => {
                if (line.type === 'meta' || line.type === 'header') {
                  return (
                    <div key={`right-${idx}`} className="px-3 py-1 text-slate-500 bg-slate-950/30 truncate">
                      {line.content}
                    </div>
                  );
                }
                if (line.type === 'delete') {
                  return (
                    <div key={`right-${idx}`} className="flex items-center bg-slate-950/20 text-slate-600 py-0.5">
                      <span className="w-9 px-2 text-right text-slate-700 select-none"> </span>
                      <span className="px-2 select-none"> </span>
                    </div>
                  );
                }
                const isAdd = line.type === 'add';
                return (
                  <div
                    key={`right-${idx}`}
                    className={`flex items-start ${isAdd ? 'bg-emerald-950/30 text-emerald-300' : 'text-slate-300'}`}
                  >
                    <span className="w-9 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-800 shrink-0">
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
