import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Product, Bug } from '../types/index.js';
import { api } from '../services/api.js';

export type AppView = 'table' | 'kanban' | 'graph' | 'triage' | 'milestones' | 'analytics';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  bugId?: string;
  read: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  
  products: Product[];
  activeProductId: string | null;
  setActiveProductId: (id: string | null) => void;
  
  allBugs: Bug[];
  bugs: Bug[];
  isLoadingBugs: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  selectedBugId: string | null;
  setSelectedBugId: (id: string | null) => void;
  
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  
  isImportExportOpen: boolean;
  setIsImportExportOpen: (open: boolean) => void;
  
  isArchitectureOpen: boolean;
  setIsArchitectureOpen: (open: boolean) => void;
  
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  activeToasts: ToastNotification[];
  dismissToast: (id: string) => void;
  
  refreshData: () => Promise<void>;
  toast: (title: string, message?: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Alex Rivera (Lead Architect)',
    email: 'alex.rivera@omnibug.dev',
    role: 'maintainer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const [activeView, setActiveView] = useState<AppView>('table');
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  
  const [allBugs, setAllBugs] = useState<Bug[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoadingBugs, setIsLoadingBugs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('is:open');
  
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

  const [activeToasts, setActiveToasts] = useState<ToastNotification[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Flag Requested: review?',
      message: 'Elena Rostova requested code review on Bug #1001 (Heap buffer overflow)',
      type: 'warning',
      timestamp: '10m ago',
      bugId: 'bug-1001',
      read: false,
    },
    {
      id: 'n-2',
      title: 'Security Bug Classified',
      message: 'Bug #1001 marked as security-sensitive blocker.',
      type: 'alert',
      timestamp: '1h ago',
      bugId: 'bug-1001',
      read: false,
    },
    {
      id: 'n-3',
      title: 'QA Sign-off Completed',
      message: 'Sarah Jenkins verified fix for Bug #1005 (WASM JIT bounds check).',
      type: 'success',
      timestamp: '2h ago',
      bugId: 'bug-1005',
      read: true,
    }
  ]);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((title: string, message?: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Add to floating toasts
    const newToast: ToastNotification = {
      id: toastId,
      title,
      message,
      type,
    };
    setActiveToasts(prev => [newToast, ...prev.slice(0, 3)]);

    // Auto-dismiss floating toast after 3.5 seconds
    setTimeout(() => {
      dismissToast(toastId);
    }, 3500);

    // Also record in Notification Drawer history
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message: message || '',
      type,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [dismissToast]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoadingBugs(true);
      const params: Record<string, string> = {};
      if (activeProductId) params.product = activeProductId;
      if (searchQuery) params.search = searchQuery;

      const unfilteredParams: Record<string, string> = {};
      if (activeProductId) unfilteredParams.product = activeProductId;

      const [bugsRes, allBugsRes, prodsRes, usersRes] = await Promise.all([
        api.getBugs(params),
        api.getBugs(unfilteredParams),
        api.getProducts(),
        api.getUsers(),
      ]);

      setBugs(bugsRes.data || []);
      setAllBugs(allBugsRes.data || []);
      setProducts(prodsRes || []);
      if (usersRes && usersRes.length > 0) {
        setUsers(usersRes);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoadingBugs(false);
    }
  }, [activeProductId, searchQuery]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Global hotkeys (Ctrl+K / Cmd+K, C for new bug, Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'c' && !isCreateModalOpen && !isCommandPaletteOpen && !selectedBugId && !isImportExportOpen && !isArchitectureOpen) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsCreateModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (isImportExportOpen) setIsImportExportOpen(false);
        if (isArchitectureOpen) setIsArchitectureOpen(false);
        if (selectedBugId) setSelectedBugId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isCommandPaletteOpen, selectedBugId, isImportExportOpen, isArchitectureOpen]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        activeView,
        setActiveView,
        products,
        activeProductId,
        setActiveProductId,
        allBugs,
        bugs,
        isLoadingBugs,
        searchQuery,
        setSearchQuery,
        selectedBugId,
        setSelectedBugId,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isImportExportOpen,
        setIsImportExportOpen,
        isArchitectureOpen,
        setIsArchitectureOpen,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        activeToasts,
        dismissToast,
        refreshData,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
