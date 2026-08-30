import React, { useState } from 'react';
import { useApp } from './context/AppContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { CommandPalette } from './components/layout/CommandPalette.js';
import { NotificationDrawer } from './components/layout/NotificationDrawer.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { TableView } from './components/views/TableView.js';
import { KanbanView } from './components/views/KanbanView.js';
import { GraphView } from './components/views/GraphView.js';
import { TriageView } from './components/views/TriageView.js';
import { MilestoneView } from './components/views/MilestoneView.js';
import { AnalyticsView } from './components/views/AnalyticsView.js';
import { BugDetailModal } from './components/bug-detail/BugDetailModal.js';
import { CreateBugModal } from './components/bug-create/CreateBugModal.js';
import { ImportExportModal } from './components/common/ImportExportModal.js';
import { ArchitectureModal } from './components/common/ArchitectureModal.js';
import { GuidedTourBanner } from './components/layout/GuidedTourBanner.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { SignInScreen } from './components/auth/SignInScreen.js';

export const App: React.FC = () => {
  const {
    activeView,
    isLoadingBugs,
    setIsImportExportOpen,
    isArchitectureOpen,
    setIsArchitectureOpen,
    currentUser,
    setCurrentUser,
    isRestoringSession,
    isCommandPaletteOpen,
  } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // A stored token is verified before the workspace renders, so a revoked or
  // expired session lands on sign-in rather than on a shell that 401s.
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm" role="status">
        Restoring session…
      </div>
    );
  }

  if (!currentUser) {
    return <SignInScreen onSignedIn={setCurrentUser} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'table':
        return <TableView />;
      case 'kanban':
        return <KanbanView />;
      case 'graph':
        return <GraphView />;
      case 'triage':
        return <TriageView />;
      case 'milestones':
        return <MilestoneView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <TableView />;
    }
  };

  return (
    <ErrorBoundary>
      {/* Lets keyboard users bypass the sidebar and toolbar. */}
      <a href="#main-content" className="skip-link">
        Skip to issue workspace
      </a>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
        {/* Top Navigation */}
        <Navbar onOpenNotifications={() => setIsNotificationsOpen(true)} />

        {/* Evaluator Guided Tour Banner */}
        <GuidedTourBanner />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onOpenArchitecture={() => setIsArchitectureOpen(true)}
          />

          {/* Active View Container */}
          <main id="main-content" tabIndex={-1} aria-label="Issue workspace" className="flex-1 flex min-w-0 bg-slate-950 overflow-hidden relative">
            {isLoadingBugs ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-xs">
                <span className="animate-pulse">Loading issues & telemetry...</span>
              </div>
            ) : (
              renderActiveView()
            )}
          </main>
        </div>

        {/* Modals, Drawers & Toast Banner */}
        <BugDetailModal />
        <CreateBugModal />
        {/* Mounted only while open, so it opens with a clean query and
            selection instead of clearing stale state in an effect. */}
        {isCommandPaletteOpen && <CommandPalette />}
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        <ImportExportModal />
        <ArchitectureModal
          isOpen={isArchitectureOpen}
          onClose={() => setIsArchitectureOpen(false)}
        />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};
export default App;
