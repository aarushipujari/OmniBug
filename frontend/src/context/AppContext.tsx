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

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  
  products: Product[];
  activeProductId: string | null;
  setActiveProductId: (id: string | null) => void;
  
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
  
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
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
  
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoadingBugs, setIsLoadingBugs] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('is:open');
  
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);

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

  const toast = useCallback((title: string, message?: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message: message || '',
      type,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoadingBugs(true);
      const params: Record<string, string> = {};
      if (activeProductId) params.product = activeProductId;
      if (searchQuery) params.search = searchQuery;

      const [bugsRes, prodsRes, usersRes] = await Promise.all([
        api.getBugs(params),
        api.getProducts(),
        api.getUsers(),
      ]);

      setBugs(bugsRes.data || []);
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

  // Global hotkeys (Ctrl+K / Cmd+K, C for new bug, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'c' && !isCreateModalOpen && !isCommandPaletteOpen && !selectedBugId) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsCreateModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isCommandPaletteOpen, selectedBugId]);

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
        notifications,
        markNotificationRead,
        clearAllNotifications,
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
