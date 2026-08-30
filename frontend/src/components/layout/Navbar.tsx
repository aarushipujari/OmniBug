import React, { useState } from 'react';
import { useApp, useCurrentUser } from '../../context/AppContext.js';
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
    switchUser,
    users,
    products,
    activeProductId,
    setActiveProductId,
    searchQuery,
    setSearchQuery,
    setIsCreateModalOpen,
    setIsCommandPaletteOpen,
    notifications,
    toast,
  } = useApp();
  const currentUser = useCurrentUser();

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
    <header className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-30 select-none font-sans">
      {/* Left: Brand & Product Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <BugIcon className="w-4 h-4 text-slate-900" />
          <h1 className="font-bold tracking-tight text-slate-900 text-sm">OmniBug</h1>
        </div>

        <span className="text-slate-300">/</span>

        {/* Product selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
            aria-label="Select product workspace scope"
            aria-expanded={isProductMenuOpen}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span className="max-w-[130px] truncate font-medium">
              {activeProduct ? activeProduct.name : 'All Products'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isProductMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50 animate-in fade-in duration-100">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider font-mono">
                Scope
              </div>
              <button
                onClick={() => {
                  setActiveProductId(null);
                  setIsProductMenuOpen(false);
                }}
                aria-label="Scope to all products"
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                  activeProductId === null
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>All Products</span>
                {activeProductId === null && <Check className="w-3.5 h-3.5 text-slate-900" />}
              </button>
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProductId(p.id);
                    setIsProductMenuOpen(false);
                  }}
                  aria-label={`Scope to product ${p.name}`}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                    activeProductId === p.id
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {activeProductId === p.id && <Check className="w-3.5 h-3.5 text-slate-900" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Tokenized Search Bar with Focus Ring */}
      <div className="flex-1 max-w-lg mx-6 hidden md:flex items-center gap-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Filter and search issues"
            placeholder="Search issues or type ⌘K..."
            className="w-full pl-8 pr-12 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-mono transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="Open Command Palette (Ctrl+K)"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-slate-400 hover:text-slate-700 text-[10px] border border-slate-200 font-mono"
              title="Open Command Palette (Ctrl+K)"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </button>
          </div>
        </div>

        {/* Quick filter tokens */}
        <div className="flex items-center gap-1 shrink-0">
          {filterTokens.slice(0, 4).map(ft => {
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
                aria-label={`Filter token ${ft.label}`}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isFilterActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {ft.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Actions & User Switcher */}
      <div className="flex items-center gap-2">
        {/* Create Bug Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create new bug report (C)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bug</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          aria-label={`Activity Notifications, ${unreadCount} unread`}
          className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Activity Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-900" />
          )}
        </button>

        {/* Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label={`Switch persona, currently active: ${currentUser.name} (${currentUser.role})`}
            aria-expanded={isUserMenuOpen}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 bg-slate-100">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {currentUser.name[0]}
                </div>
              )}
            </div>
            <span className="hidden lg:inline text-xs font-medium text-slate-800 truncate max-w-[90px]">
              {currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50 animate-in fade-in duration-100">
              <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Switch Persona
                </div>
              </div>
              <div className="space-y-0.5">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2.5 transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-slate-900 truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono capitalize">{u.role}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
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
