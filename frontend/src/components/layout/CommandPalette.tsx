import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Search,
  Plus,
  Table2,
  Kanban,
  GitGraph,
  Inbox,
  Milestone,
  BarChart3,
  User,
  ArrowRight,
  Bug as BugIcon,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    bugs,
    setSelectedBugId,
    setActiveView,
    setIsCreateModalOpen,
    users,
    setCurrentUser,
    setSearchQuery,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Actions list
  const actions: { id: string; category: string; title: string; icon: React.ReactNode; run: () => void }[] = [
    {
      id: 'act-new-bug',
      category: 'Actions',
      title: 'Create New Bug Report (C)',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateModalOpen(true);
      },
    },
    {
      id: 'act-view-table',
      category: 'Navigation',
      title: 'Switch to Grid / Table View',
      icon: <Table2 className="w-4 h-4 text-blue-400" />,
      run: () => {
        setActiveView('table');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-view-kanban',
      category: 'Navigation',
      title: 'Switch to Kanban Lifecycle Board',
      icon: <Kanban className="w-4 h-4 text-indigo-400" />,
      run: () => {
        setActiveView('kanban');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-view-graph',
      category: 'Navigation',
      title: 'Switch to Blocker & Dependency Graph',
      icon: <GitGraph className="w-4 h-4 text-purple-400" />,
      run: () => {
        setActiveView('graph');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-view-triage',
      category: 'Navigation',
      title: 'Open Speed Triage Mode',
      icon: <Inbox className="w-4 h-4 text-amber-400" />,
      run: () => {
        setActiveView('triage');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-view-milestones',
      category: 'Navigation',
      title: 'View Release Milestones & Roadmaps',
      icon: <Milestone className="w-4 h-4 text-teal-400" />,
      run: () => {
        setActiveView('milestones');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-view-analytics',
      category: 'Navigation',
      title: 'View Analytics, MTTR & SLA Dashboard',
      icon: <BarChart3 className="w-4 h-4 text-rose-400" />,
      run: () => {
        setActiveView('analytics');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'act-filter-blockers',
      category: 'Filters',
      title: 'Filter: Release Blockers (severity:blocker)',
      icon: <Search className="w-4 h-4 text-red-400" />,
      run: () => {
        setSearchQuery('severity:blocker');
        setIsCommandPaletteOpen(false);
      },
    },
  ];

  // Match bugs
  const matchedBugs = bugs
    .filter(
      b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.bugNumber.toString().includes(query) ||
        b.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 5)
    .map(b => ({
      id: b.id,
      category: 'Issues',
      title: `#${b.bugNumber} - ${b.title}`,
      icon: <BugIcon className="w-4 h-4 text-slate-400" />,
      run: () => {
        setSelectedBugId(b.id);
        setIsCommandPaletteOpen(false);
      },
    }));

  // Match personas
  const matchedUsers = users
    .filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    .map(u => ({
      id: `usr-${u.id}`,
      category: 'Switch Persona',
      title: `Switch to ${u.name} (${u.role})`,
      icon: <User className="w-4 h-4 text-emerald-400" />,
      run: () => {
        setCurrentUser(u);
        setIsCommandPaletteOpen(false);
      },
    }));

  const filteredItems = [
    ...matchedBugs,
    ...actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase())),
    ...matchedUsers,
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-850">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, issue #, keyword or persona..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              No matching commands or issues found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {item.icon}
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-mono text-slate-500 mr-2">
                        [{item.category}]
                      </span>
                      <span>{item.title}</span>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-slate-800 px-1 rounded">↑↓</kbd> to navigate</span>
            <span><kbd className="bg-slate-800 px-1 rounded">↵</kbd> to select</span>
          </div>
          <span>OmniBug Quick Launcher</span>
        </div>
      </div>
    </div>
  );
};
