import React, { useState } from 'react';
import { X, Database, GitGraph, Shield, BookOpen, Layers, Cpu, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'statemachine' | 'graph' | 'viva' | 'api'>('schema');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                OmniBug Architecture & Engineering Specification
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                System design, relational data models, graph algorithms, REST APIs & viva defense guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-slate-50 text-xs font-sans overflow-x-auto">
          {[
            { id: 'schema', label: '1. Relational Schema & ERD', icon: <Database className="w-3.5 h-3.5 text-slate-700" /> },
            { id: 'statemachine', label: '2. Guarded State Machine', icon: <Shield className="w-3.5 h-3.5 text-slate-700" /> },
            { id: 'graph', label: '3. Kahn\'s Graph Algorithm O(V+E)', icon: <GitGraph className="w-3.5 h-3.5 text-slate-700" /> },
            { id: 'api', label: '4. REST API & OpenAPI Spec', icon: <Terminal className="w-3.5 h-3.5 text-slate-700" /> },
            { id: 'viva', label: '5. Examiner Viva Q&A Cheatsheet', icon: <BookOpen className="w-3.5 h-3.5 text-slate-700" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
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
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono shadow-xs">
                <div className="text-slate-900 font-bold text-xs uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" /> Domain Entity Relational Architecture
                </div>
                <p className="text-slate-600 text-xs font-sans leading-relaxed">
                  OmniBug implements a strict hierarchical multi-tenant software schema modeled after Bugzilla enterprise standards:
                </p>
                <div className="p-3 bg-white rounded-lg text-slate-800 font-mono text-[11px] leading-loose border border-slate-200">
                  <span className="text-slate-900 font-bold">Product (1)</span> ➔ <span className="text-slate-900 font-bold">Component (N)</span> ➔ <span className="text-slate-900 font-bold">Bug (N)</span> ➔ <span className="text-slate-900 font-bold">Flags (N)</span> + <span className="text-slate-900 font-bold">AuditLogs (N)</span> + <span className="text-slate-900 font-bold">WorkLogs (N)</span>
                </div>
              </div>

              {/* Entity Tables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <div className="font-mono font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span className="text-slate-900">TABLE: Bug / Issue</span>
                    <span className="text-[10px] text-slate-500">Primary Domain Entity</span>
                  </div>
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-200">
                      <tr><th className="pb-1">Field</th><th className="pb-1">Type</th><th className="pb-1">Description</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr><td className="py-1 text-slate-900 font-bold">id (PK)</td><td>string</td><td>Unique UUID (e.g. bug-1001)</td></tr>
                      <tr><td className="py-1">bugNumber</td><td>integer</td><td>Incremental sequence # (1001)</td></tr>
                      <tr><td className="py-1">productId (FK)</td><td>string</td><td>Refers to Product.id</td></tr>
                      <tr><td className="py-1">componentId (FK)</td><td>string</td><td>Refers to Component.id</td></tr>
                      <tr><td className="py-1 text-slate-900 font-semibold">status</td><td>enum</td><td>UNCONFIRMED..CLOSED</td></tr>
                      <tr><td className="py-1 text-slate-900 font-semibold">resolution</td><td>enum?</td><td>FIXED, DUPLICATE, etc.</td></tr>
                      <tr><td className="py-1">severity / priority</td><td>enum</td><td>blocker..enhancement / P1..P5</td></tr>
                      <tr><td className="py-1">assigneeId (FK)</td><td>string</td><td>Refers to User.id (Owner)</td></tr>
                      <tr><td className="py-1">dependsOn / blocks</td><td>string[]</td><td>Numeric blocker graph adjacency IDs</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                  <div className="font-mono font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span className="text-slate-900">TABLE: BugFlag (Review System)</span>
                    <span className="text-[10px] text-slate-500">Peer Approval Engine</span>
                  </div>
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-200">
                      <tr><th className="pb-1">Field</th><th className="pb-1">Type</th><th className="pb-1">Description</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr><td className="py-1 text-slate-900 font-bold">id (PK)</td><td>string</td><td>UUID (flg-1)</td></tr>
                      <tr><td className="py-1">name</td><td>enum</td><td>review, needinfo, qa-verify, sec-audit</td></tr>
                      <tr><td className="py-1 text-slate-900 font-semibold">status</td><td>char</td><td>? (req), + (grant), - (deny), X (clear)</td></tr>
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                <div className="text-slate-900 font-bold text-xs font-mono uppercase">
                  Guarded Lifecycle Validation Rules
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                  Unlike unstructured Kanban apps where cards can move anywhere, OmniBug executes a mathematical finite state automaton that enforces Bugzilla validation invariants:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-900 font-bold block mb-1">Invariant 1: Resolution Requirement</span>
                    <span className="text-slate-600">
                      Transitioning to <code>RESOLVED</code> or <code>CLOSED</code> strictly requires a resolution code (<code>FIXED</code>, <code>INVALID</code>, <code>WONTFIX</code>, <code>DUPLICATE</code>).
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-900 font-bold block mb-1">Invariant 2: No Direct Verification</span>
                    <span className="text-slate-600">
                      A bug in <code>NEW</code> or <code>IN_PROGRESS</code> cannot jump directly to <code>VERIFIED</code> without going through developer resolution first.
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-900 font-bold block mb-1">Invariant 3: Duplicate Cross-Referencing</span>
                    <span className="text-slate-600">
                      Resolving as <code>DUPLICATE</code> requires entering an existing Bug ID; it automatically copies CC lists and posts a cross-reference comment.
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <span className="text-slate-900 font-bold block mb-1">Invariant 4: Reopened Clears Resolution</span>
                    <span className="text-slate-600">
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                <div className="text-slate-900 font-bold text-xs uppercase flex items-center justify-between">
                  <span>Kahn's Algorithm for Topological Sorting & Cycle Detection</span>
                  <span className="text-emerald-700 font-bold">Complexity: O(V + E)</span>
                </div>
                <p className="text-slate-600 text-xs font-sans leading-relaxed">
                  To prevent deadlock and visualize dependency chains, the backend graph engine executes Kahn’s algorithm on the blocker Directed Acyclic Graph (DAG):
                </p>
                <div className="p-3 bg-white rounded-lg text-slate-800 text-[11px] space-y-1.5 border border-slate-200 shadow-xs">
                  <div>1. Compute in-degree InDegree(v) for every bug vertex v in vertices V based on blocker edges.</div>
                  <div>2. Enqueue all vertices with InDegree(v) = 0 (Root bugs with no incoming blockers) at Level 0.</div>
                  <div>3. Dequeue vertex u, decrement InDegree(w) for all outgoing edges (u, w), and set Level(w) = Level(u) + 1.</div>
                  <div>4. If processed count is less than total vertices |V|, a <strong>Cyclic Blocker Deadlock</strong> exists; flag detected cycle nodes.</div>
                  <div>5. Compute the <strong>Critical Path</strong>: the longest chain of unresolved blocker bugs stopping release delivery.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REST API Specification */}
          {activeTab === 'api' && (
            <div className="space-y-4 font-mono">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans shadow-xs">
                <div className="text-slate-900 font-bold text-xs uppercase flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-slate-700" /> Enterprise REST API & OpenAPI 3.0 Endpoints
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  OmniBug exposes an asynchronous, fully typed Express REST API with guarded state transitions and transactional persistence:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    method: 'GET',
                    path: '/api/bugs',
                    color: 'text-slate-900 border-slate-300 bg-slate-100',
                    desc: 'Query, filter, and paginate bugs across products, severities, and full-text keyword searches.',
                    params: '?product=prod-1&severity=blocker&search=is:open&page=1&limit=25',
                    response: '{ total: 7, data: [ Bug... ] }',
                  },
                  {
                    method: 'POST',
                    path: '/api/bugs',
                    color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
                    desc: 'Create new defect report. Executes real-time duplicate similarity matching and records immutable audit log.',
                    params: 'Payload: { title, description, productId, componentId, severity, priority, isSecuritySensitive }',
                    response: '{ success: true, data: Bug }',
                  },
                  {
                    method: 'PUT',
                    path: '/api/bugs/:id',
                    color: 'text-slate-900 border-slate-300 bg-slate-100',
                    desc: 'Mutate issue status or fields. Validates guarded state machine transitions and auto-resolves component/assignee.',
                    params: 'Payload: { status: "NEW", componentId, severity, priority }',
                    response: '{ success: true, data: Bug, transitionValid: true }',
                  },
                  {
                    method: 'POST',
                    path: '/api/bugs/:id/comments',
                    color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
                    desc: 'Add comment with slash command execution (/resolve, /priority, /log, /flag) and burndown hour tracking.',
                    params: 'Payload: { text: "/priority P1\n/log 3.5h Audited QUIC session bounds." }',
                    response: '{ success: true, executedCommands: 2, comment: Comment }',
                  },
                  {
                    method: 'POST',
                    path: '/api/ai/triage',
                    color: 'text-slate-900 border-slate-300 bg-slate-100',
                    desc: 'Multi-language crash traceback parser (Python, V8, Go, Rust, ASAN) using per-language patterns, culprit line extractor, and Jest test synthesizer.',
                    params: 'Payload: { title, description, productId }',
                    response: '{ suggestedSeverity, suggestedComponentId, parsedStackTrace, suggestedTestCase }',
                  },
                  {
                    method: 'GET',
                    path: '/api/graph',
                    color: 'text-slate-900 border-slate-300 bg-slate-100',
                    desc: 'Computes Kahn’s topological sort levels, detects circular blocker deadlocks, and identifies the Critical Path.',
                    params: 'None (Global dependency graph)',
                    response: '{ nodes: [ ... ], edges: [ ... ], criticalPathBugIds: [ "bug-1002", "bug-1003" ], hasCycles: false }',
                  },
                  {
                    method: 'GET',
                    path: '/api/export/bugzilla-xml',
                    color: 'text-slate-900 border-slate-300 bg-slate-100',
                    desc: 'Serializes entire database into Mozilla Bugzilla DTD-compliant XML with flags, comments, and blocker trees.',
                    params: 'None (Returns Content-Type: application/xml)',
                    response: '<?xml version="1.0" ?><!DOCTYPE bugzilla ...><bugzilla version="5.0.4">...</bugzilla>',
                  },
                  {
                    method: 'POST',
                    path: '/api/import/bugzilla-xml',
                    color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
                    desc: 'Bidirectional XML parser and merger. Ingests legacy XML dumps with zero data loss.',
                    params: 'Payload: { xml: "<bugzilla><bug>...</bug></bugzilla>" }',
                    response: '{ success: true, importedCount: 1 }',
                  },
                ].map((ep, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${ep.color}`}>
                        {ep.method}
                      </span>
                      <span className="font-bold text-xs text-slate-900 font-mono">{ep.path}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans">{ep.desc}</p>
                    <div className="p-2.5 bg-white rounded-lg text-[10.5px] font-mono text-slate-800 space-y-1 border border-slate-200">
                      <div className="text-slate-500"><span className="text-slate-900 font-semibold">Request:</span> {ep.params}</div>
                      <div className="text-slate-500"><span className="text-slate-900 font-semibold">Response:</span> {ep.response}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Viva Q&A */}
          {activeTab === 'viva' && (
            <div className="space-y-3">
              {[
                {
                  q: 'What is Bugzilla and why did you reconstruct it in this project?',
                  a: 'Bugzilla is the industry-standard issue tracker used by Mozilla and Red Hat for 25+ years. It has unmatched engineering paradigms (strict state machine, reviewer flags, blocker trees), but legacy UI is slow and clunky. OmniBug modernizes it with instant client-side reactivity, SVG DAG visualizer, AI triage, and slash commands while preserving 100% domain integrity.',
                },
                {
                  q: 'How does your AI duplicate detection and triage work?',
                  a: 'Each issue is reduced to a set of lowercased word tokens (punctuation stripped, tokens of two characters or fewer dropped) and scored against the candidate with Jaccard similarity — the size of the overlap divided by the size of the union. Title and full-text scores are weighted equally, and anything at or above 0.18 is surfaced. For crash logs, the traceback parser extracts culprit file paths and line numbers across Python, JS, Go, Rust, and C/C++ ASAN output to predict component routing and severity.',
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
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                  <div className="font-bold text-xs text-slate-900 font-sans flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" /> {item.q}
                  </div>
                  <p className="text-xs text-slate-700 font-normal leading-relaxed pl-5 font-sans">
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
