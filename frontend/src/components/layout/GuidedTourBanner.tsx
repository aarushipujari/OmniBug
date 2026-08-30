import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Sparkles,
  GitGraph,
  Inbox,
  FileCode,
  Terminal,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface TourStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ReactNode;
  onAction: (helpers: {
    setActiveView: (view: any) => void;
    setIsCreateModalOpen: (open: boolean) => void;
    setSelectedBugId: (id: string | null) => void;
  }) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-ast',
    badge: 'Step 1 of 5 • Traceback parser',
    title: 'Multi-Language Crash Stack Trace Auto-Triage & Test Synthesizer',
    description:
      'OmniBug parses Python, V8/JS, Go, Rust, and C/C++ ASAN tracebacks, isolates culprit files/lines, auto-routes components, and synthesizes Jest reproduction tests.',
    actionLabel: 'Try + New Bug (+ C)',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    onAction: ({ setIsCreateModalOpen }) => {
      setIsCreateModalOpen(true);
    },
  },
  {
    id: 'step-dag',
    badge: 'Step 2 of 5 • Graph Theory',
    title: "Blocker Topology, Kahn's Cycle Detection & Critical Path DAG",
    description:
      'Evaluates blocker relationships in O(V+E) time to eliminate circular dependency deadlocks and highlights the Critical Path holding up release milestones in red.',
    actionLabel: 'Inspect Blocker DAG',
    icon: <GitGraph className="w-4 h-4 text-purple-400" />,
    onAction: ({ setActiveView }) => {
      setActiveView('graph');
    },
  },
  {
    id: 'step-triage',
    badge: 'Step 3 of 5 • Speed Triage',
    title: 'Maintainer Rapid Triage & Keyboard Hotkey Accelerators',
    description:
      'Triage unconfirmed reports in seconds using J/K navigation, C to confirm (moves to NEW), I to start work (IN_PROGRESS), and 1-5 to update priorities.',
    actionLabel: 'Open Speed Triage',
    icon: <Inbox className="w-4 h-4 text-amber-400" />,
    onAction: ({ setActiveView }) => {
      setActiveView('triage');
    },
  },
  {
    id: 'step-diffs',
    badge: 'Step 4 of 5 • Code Review',
    title: 'Splinter Split Git Diffs & Multi-Party Review Flags (? / + / -)',
    description:
      'Inspect 2-column side-by-side patch diffs and manage Bugzilla review gates (review?, security-audit?, qa-verify?) across architect, security, and QA personas.',
    actionLabel: 'Open Bug #1001 Patch',
    icon: <FileCode className="w-4 h-4 text-cyan-400" />,
    onAction: ({ setSelectedBugId }) => {
      setSelectedBugId('bug-1001');
    },
  },
  {
    id: 'step-slash',
    badge: 'Step 5 of 5 • Terminal Ergonomics',
    title: 'Discussion Slash Command Automations & Micro-Audit Trail',
    description:
      'Execute commands like /priority P1, /resolve FIXED, and /log 3.5h directly in comments. Mutates state, updates burndown hours, and creates immutable audit logs.',
    actionLabel: 'View Kanban Board',
    icon: <Terminal className="w-4 h-4 text-blue-400" />,
    onAction: ({ setActiveView }) => {
      setActiveView('kanban');
    },
  },
];

export const GuidedTourBanner: React.FC = () => {
  const { setActiveView, setIsCreateModalOpen, setSelectedBugId } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs select-none font-sans">
      {/* Left: Step Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shrink-0">
          {currentStep.badge.split(' • ')[0]}
        </span>
        <span className="font-semibold text-slate-900 truncate">
          {currentStep.title}
        </span>
        <span className="text-slate-400 hidden lg:inline">—</span>
        <p className="text-slate-500 text-[11px] truncate max-w-xl hidden lg:block font-normal">
          {currentStep.description}
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() =>
            currentStep.onAction({
              setActiveView,
              setIsCreateModalOpen,
              setSelectedBugId,
            })
          }
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium transition-colors"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>{currentStep.actionLabel}</span>
        </button>

        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button
            onClick={() =>
              setCurrentStepIndex(
                prev => (prev - 1 + TOUR_STEPS.length) % TOUR_STEPS.length
              )
            }
            title="Previous Step"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setCurrentStepIndex(prev => (prev + 1) % TOUR_STEPS.length)
            }
            title="Next Step"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          title="Dismiss Banner"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
