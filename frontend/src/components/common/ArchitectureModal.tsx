import React, { useState } from 'react';
import { X, Database, GitGraph, Shield, BookOpen, Layers, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'statemachine' | 'graph' | 'viva'>('schema');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-sans">
                OmniBug Architecture & Engineering Specification
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                System design, relational data models, graph algorithms & viva defense guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900 text-xs font-sans">
          {[
            { id: 'schema', label: '1. Relational Entity Schema & ERD', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'statemachine', label: '2. Guarded State Machine', icon: <Shield className="w-3.5 h-3.5 text-indigo-400" /> },
            { id: 'graph', label: '3. Kahn\'s Graph Algorithm O(V+E)', icon: <GitGraph className="w-3.5 h-3.5 text-purple-400" /> },
            { id: 'viva', label: '4. Examiner Viva Q&A Cheatsheet', icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-300 bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {/* TAB 1: Relational Schema */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Domain Entity Relational Architecture
                </div>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">
                  OmniBug implements a strict hierarchical multi-tenant software schema modeled after Bugzilla enterprise standards:
                </p>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px] leading-loose border border-slate-850">
                  <span className="text-teal-400 font-bold">Product (1)</span> ➔ <span className="text-sky-400 font-bold">Component (N)</span> ➔ <span className="text-amber-400 font-bold">Bug (N)</span> ➔ <span className="text-purple-400 font-bold">Flags (N)</span> + <span className="text-rose-400 font-bold">AuditLogs (N)</span> + <span className="text-emerald-400 font-bold">WorkLogs (N)</span>
                </div>
              </div>

              {/* Entity Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-mono font-bold text-slate-200 text-xs flex items-center justify-between">
                    <span className="text-emerald-400">TABLE: Bug / Issue</span>
                    <span className="text-[10px] text-slate-500">Primary Domain Entity</span>
                  </div>
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-850">
                      <tr><th className="pb-1">Field</th><th className="pb-1">Type</th><th className="pb-1">Description</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-slate-300">
                      <tr><td className="py-1 text-emerald-300 font-bold">id (PK)</td><td>string</td><td>Unique UUID (e.g. bug-1001)</td></tr>
                      <tr><td className="py-1">bugNumber</td><td>integer</td><td>Incremental sequence # (1001)</td></tr>
                      <tr><td className="py-1">productId (FK)</td><td>string</td><td>Refers to Product.id</td></tr>
                      <tr><td className="py-1">componentId (FK)</td><td>string</td><td>Refers to Component.id</td></tr>
                      <tr><td className="py-1 text-amber-300">status</td><td>enum</td><td>UNCONFIRMED..CLOSED</td></tr>
                      <tr><td className="py-1 text-amber-300">resolution</td><td>enum?</td><td>FIXED, DUPLICATE, etc.</td></tr>
                      <tr><td className="py-1">severity / priority</td><td>enum</td><td>blocker..enhancement / P1..P5</td></tr>
                      <tr><td className="py-1">assigneeId (FK)</td><td>string</td><td>Refers to User.id (Owner)</td></tr>
                      <tr><td className="py-1">dependsOn / blocks</td><td>string[]</td><td>Numeric blocker graph adjacency IDs</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-mono font-bold text-slate-200 text-xs flex items-center justify-between">
                    <span className="text-purple-400">TABLE: BugFlag (Review System)</span>
                    <span className="text-[10px] text-slate-500">Peer Approval Engine</span>
                  </div>
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-850">
                      <tr><th className="pb-1">Field</th><th className="pb-1">Type</th><th className="pb-1">Description</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-slate-300">
                      <tr><td className="py-1 text-purple-300 font-bold">id (PK)</td><td>string</td><td>UUID (flg-1)</td></tr>
                      <tr><td className="py-1">name</td><td>enum</td><td>review, needinfo, qa-verify, sec-audit</td></tr>
                      <tr><td className="py-1 text-amber-300">status</td><td>char</td><td>? (req), + (grant), - (deny), X (clear)</td></tr>
                      <tr><td className="py-1">requesteeId (FK)</td><td>string</td><td>User target reviewer</td></tr>
                      <tr><td className="py-1">setterId (FK)</td><td>string</td><td>User actor who set/granted flag</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: State Machine */}
          {activeTab === 'statemachine' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-300 font-bold text-xs font-mono uppercase">
                  Guarded Lifecycle Validation Rules
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-sans">
                  Unlike unstructured Kanban apps where cards can move anywhere, OmniBug executes a mathematical finite state automaton that enforces Bugzilla validation invariants:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">Invariant 1: Resolution Requirement</span>
                    <span className="text-slate-400">
                      Transitioning to <code>RESOLVED</code> or <code>CLOSED</code> strictly requires a resolution code (<code>FIXED</code>, <code>INVALID</code>, <code>WONTFIX</code>, <code>DUPLICATE</code>).
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold block mb-1">Invariant 2: No Direct Verification</span>
                    <span className="text-slate-400">
                      A bug in <code>NEW</code> or <code>IN_PROGRESS</code> cannot jump directly to <code>VERIFIED</code> without going through developer resolution first.
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">Invariant 3: Duplicate Cross-Referencing</span>
                    <span className="text-slate-400">
                      Resolving as <code>DUPLICATE</code> requires entering an existing Bug ID; it automatically copies CC lists and posts a cross-reference comment.
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-bold block mb-1">Invariant 4: Reopened Clears Resolution</span>
                    <span className="text-slate-400">
                      Moving a bug to <code>REOPENED</code> clears previous resolution codes and clears the <code>closedAt</code> timestamp.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Graph Algorithm */}
          {activeTab === 'graph' && (
            <div className="space-y-4 font-mono">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="text-purple-400 font-bold text-xs uppercase flex items-center justify-between">
                  <span>Kahn's Algorithm for Topological Sorting & Cycle Detection</span>
                  <span className="text-emerald-400 font-bold">Complexity: O(V + E)</span>
                </div>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">
                  To prevent deadlock and visualize dependency chains, the backend graph engine executes Kahn’s algorithm on the blocker Directed Acyclic Graph (DAG):
                </p>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 text-[11px] space-y-1.5 border border-slate-850">
                  <div>1. Compute in-degree InDegree(v) for every bug vertex v in vertices V based on blocker edges.</div>
                  <div>2. Enqueue all vertices with InDegree(v) = 0 (Root bugs with no incoming blockers) at Level 0.</div>
                  <div>3. Dequeue vertex u, decrement InDegree(w) for all outgoing edges (u, w), and set Level(w) = Level(u) + 1.</div>
                  <div>4. If processed count is less than total vertices |V|, a <strong>Cyclic Blocker Deadlock</strong> exists; flag detected cycle nodes.</div>
                  <div>5. Compute the <strong>Critical Path</strong>: the longest chain of unresolved blocker bugs stopping release delivery.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Viva Q&A */}
          {activeTab === 'viva' && (
            <div className="space-y-3">
              {[
                {
                  q: 'What is Bugzilla and why did you reconstruct it in this project?',
                  a: 'Bugzilla is the industry-standard issue tracker used by Mozilla and Red Hat for 25+ years. It has unmatched engineering paradigms (strict state machine, reviewer flags, blocker trees), but legacy UI is slow and clunky. OmniBug modernizes it with instant client-side reactivity, SVG DAG visualizer, AI triage, and slash commands while preserving 100% domain integrity.',
                },
                {
                  q: 'How does your AI duplicate detection and triage work?',
                  a: 'It combines n-gram tokenization and Jaccard cosine similarity across bug summaries, tags, and descriptions. For crash logs, our multi-language stack trace parser extracts culprit file paths and line numbers across Python, JS, Go, Rust, and C/C++ ASAN logs to auto-predict component routing and severity.',
                },
                {
                  q: 'What is the purpose of the Flags system (? + - X)?',
                  a: 'Flags provide formal peer-review gates before code lands. For example, `review? @alex` requests code sign-off, `qa-verify?` requests QA validation, and `security-audit?` requests vulnerability clearance before public release.',
                },
                {
                  q: 'How do you prevent circular dependency deadlocks between bugs?',
                  a: 'We use Kahn’s topological sort algorithm in O(V+E) time complexity. If a cycle is formed (Bug A blocks B, and B blocks A), the algorithm detects that processed nodes are fewer than total vertices and raises a cyclic deadlock warning.',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5">
                  <div className="font-bold text-xs text-emerald-300 font-sans flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item.q}
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed pl-5 font-sans">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
