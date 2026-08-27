import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  Bug as BugIcon,
  Search,
  Plus,
  Bell,
  Command,
  ChevronDown,
  Layers,
  UserCheck,
  Check,
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    products,
    activeProductId,
    setActiveProductId,
    searchQuery,
    setSearchQuery,
    setIsCreateModalOpen,
    setIsCommandPaletteOpen,
    notifications,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeProduct = products.find(p => p.id === activeProductId);

  const filterTokens = [
    { label: 'Open', token: 'is:open' },
    { label: 'Blockers', token: 'severity:blocker' },
    { label: 'P1 Urgent', token: 'priority:P1' },
    { label: 'Needs Info', token: 'flag:needinfo' },
    { label: 'Security', token: 'security' },
  ];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Product Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner shadow-emerald-500/20 text-emerald-400">
            <BugIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-sans text-sm md:text-base">OmniBug</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Product selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all duration-150 active:scale-[0.98]"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="max-w-[140px] truncate font-medium">
              {activeProduct ? activeProduct.name : 'All Products'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isProductMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-100">
              <div className="text-[10px] font-semibold text-slate-500 px-2.5 py-1 uppercase tracking-wider font-mono">
                Product Workspace Scope
              </div>
              <button
                onClick={() => {
                  setActiveProductId(null);
                  setIsProductMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors duration-150 ${
                  activeProductId === null
                    ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span>All Products</span>
                {activeProductId === null && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProductId(p.id);
                    setIsProductMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors duration-150 ${
                    activeProductId === p.id
                      ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {activeProductId === p.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Tokenized Search Bar with Focus Ring */}
      <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center gap-2">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-150">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter issues (is:open, severity:blocker, assignee:alex)..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition-all duration-150 font-mono shadow-inner shadow-slate-950/40"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] border border-slate-700/80 transition-colors font-mono"
              title="Open Command Palette (Ctrl+K)"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </button>
          </div>
        </div>

        {/* Quick token pills with hover transitions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {filterTokens.map(ft => {
            const isFilterActive = searchQuery.includes(ft.token);
            return (
              <button
                key={ft.token}
                onClick={() => {
                  if (isFilterActive) {
                    setSearchQuery(searchQuery.replace(ft.token, '').trim());
                  } else {
                    setSearchQuery(`${searchQuery} ${ft.token}`.trim());
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all duration-150 active:scale-[0.97] ${
                  isFilterActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-850/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {ft.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Actions & User Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Create Bug Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm shadow-emerald-950/50 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bug</span>
          <kbd className="hidden lg:inline text-[10px] px-1 py-0.2 bg-emerald-700/60 rounded font-mono">C</kbd>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition-all duration-150 active:scale-[0.98]"
          title="Activity Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-150 text-left active:scale-[0.98]"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <div className="text-xs font-semibold text-slate-200 leading-tight max-w-[110px] truncate font-sans">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-400 font-mono capitalize">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Switch Active Persona
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                  Simulate permissions, reviewer roles & flags
                </div>
              </div>
              <div className="space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-3 transition-colors duration-150 ${
                      currentUser.id === u.id
                        ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 shrink-0">
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-semibold text-slate-200 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono capitalize">{u.role}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
