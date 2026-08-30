import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Product, Bug } from '../types/index.js';
import { api, getSessionToken, UnauthenticatedError } from '../services/api.js';

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
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchUser: (user: User) => Promise<void>;
  isRestoringSession: boolean;
  signOut: () => void;
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
  // No identity until the server has verified a credential. The client used to
  // start life hardcoded as a maintainer, which is what made every permission
  // boundary in the product cosmetic.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Only a stored token makes this a restore; starting at true and
  // immediately setting it to false cost an extra render pass.
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(getSessionToken()));

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
      if (err instanceof UnauthenticatedError) {
        setCurrentUser(null);
      } else {
        console.error('Failed to load data:', err);
      }
    } finally {
      setIsLoadingBugs(false);
    }
  }, [activeProductId, searchQuery]);

  // Restore a stored session before rendering the workspace.
  useEffect(() => {
    let cancelled = false;
    if (!getSessionToken()) return;
    api
      .getMe()
      .then(res => {
        if (!cancelled) setCurrentUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsRestoringSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(() => {
    api.logout();
    setCurrentUser(null);
  }, []);

  const switchUser = useCallback(
    async (user: User) => {
      try {
        const authRes = await api.login(user.email, 'omnibug-demo');
        setCurrentUser(authRes.user);
        toast('Active Persona Switched', `Logged in as ${authRes.user.name} (${authRes.user.role})`, 'info');
      } catch (err: any) {
        console.error('Failed to switch persona session token:', err);
        setCurrentUser(user);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!currentUser) return;
    refreshData();
  }, [refreshData, currentUser]);

  // Global hotkeys (Ctrl+K / Cmd+K, C for new bug outside Speed Triage, Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (
        (e.key === 'c' || e.key === 'C') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        activeView !== 'triage' &&
        !isCreateModalOpen &&
        !isCommandPaletteOpen &&
        !selectedBugId &&
        !isImportExportOpen &&
        !isArchitectureOpen
      ) {
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
  }, [activeView, isCreateModalOpen, isCommandPaletteOpen, selectedBugId, isImportExportOpen, isArchitectureOpen]);

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
        switchUser,
        isRestoringSession,
        signOut,
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

/**
 * The signed-in user, guaranteed non-null.
 *
 * `App` renders the sign-in screen until a session exists, so anything inside
 * the workspace can rely on this. It throws rather than returning a placeholder
 * so a future refactor that renders a view outside the gate fails loudly.
 */
export function useCurrentUser() {
  const { currentUser } = useApp();
  if (!currentUser) {
    throw new Error('useCurrentUser was called outside an authenticated view.');
  }
  return currentUser;
}
