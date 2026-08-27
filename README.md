# 🐞 OmniBug — Modern Issue Lifecycle & Bug Tracking Platform

> **Track 2: Developer Tool Reconstruction — Bugzilla Reimagined**  
> *A high-performance, developer-obsessed issue lifecycle platform reconstructed from Bugzilla's core paradigms and supercharged with real-time multi-view workflows, interactive blocker topology, embedded patch diff inspection, and AI-assisted triage.*

---

## 🚀 Key Highlights & Legacy Deconstruction

| Bugzilla Core Paradigm | Legacy Pain Point | **OmniBug Modern Reconstruction** |
| :--- | :--- | :--- |
| **Product & Component Matrix** | Static form dropdowns, isolated component views | **Hierarchical Product Workspace** with component leads, default QA contacts, version matrices, and target milestone delivery roadmaps. |
| **Bug Lifecycle & State Machine** | Clunky page reloads, complex resolution forms | **Guarded State Machine** (`UNCONFIRMED` ➔ `NEW` ➔ `IN_PROGRESS` ➔ `IN_REVIEW` ➔ `RESOLVED` ➔ `VERIFIED` ➔ `CLOSED`) with resolution validation and drag-and-drop Kanban workflow. |
| **Flags & Review System** | Obscure `review?`, `needinfo?` dropdowns | **Interactive Flag & Approval Engine** with instant granting (`+`), denial (`-`), cancellation (`X`), and designated "Needs My Info" inbox filters. |
| **Dependencies & Blockers** | Numeric list of IDs with no spatial context | **Interactive SVG Blocker Topology Visualizer** with critical path detection, DAG cycle validation, and instant node preview drawer. |
| **Attachments & Patches** | Raw `.diff` downloads, zero inline inspection | **Embedded Syntax-Highlighted Git Diff Viewer** supporting unified and split views, line numbering, and hunk tracking. |
| **Micro-Audit Trail** | Fragmented HTML activity tables | **Immutable Micro-Audit Trail** logging field-by-field delta changes with actors, timestamps, and work session burndown. |
| **Search & Query Builder** | Complex boolean SQL forms | **Tokenized Global Search Bar** (`is:open`, `severity:blocker`, `priority:P1`, `assignee:alex`, `flag:needinfo`) + **Global Command Palette (`Ctrl+K` / `⌘K`)**. |
| **Triage Throughput** | Slow manual classification | **Speed Triage Workspace** with real-time AI duplicate candidate detection, error log/stack trace auto-classification, and automated reproduction test generation. |
| **Interoperability** | Vendor lock-in | **Bugzilla XML DTD Export & Import Sync** for full round-trip compatibility with existing Bugzilla servers. |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 / 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark/Developer Theme with Emerald Accents, Glassmorphism)
- **Icons**: Lucide React
- **Graphics**: Interactive SVG/Canvas for Blocker Dependency Graphs
- **Diff Parsing**: Custom high-performance unified Git patch parser

### Backend
- **Runtime**: Node.js + TypeScript + Express RESTful API
- **Data Layer**: In-memory transactional store with atomic JSON persistence and search indexer
- **State Machine**: Guarded lifecycle validator ensuring valid Bugzilla transition flows
- **Graph Engine**: Kahn's algorithm for topological sorting, cycle detection, and critical path analysis
- **AI Triage Engine**: TF-IDF/n-gram cosine similarity simulator for duplicate matching and log auto-classifier
- **XML Interoperability**: `xml2js` DTD-compatible Bugzilla serializer and importer

---

## 📦 Project Structure

```
scratch/omnibug/
├── backend/
│   ├── src/
│   │   ├── controllers/         # BugController, ProductController, FlagController, AnalyticsController, AIController
│   │   ├── data/                # Store layer & rich enterprise seed dataset
│   │   ├── routes/              # Express API route handlers (/api/bugs, /api/products, etc.)
│   │   ├── services/            # StateMachine, DependencyGraph, AITriage, BugzillaExportImport
│   │   ├── types/               # TypeScript domain schemas
│   │   ├── server.ts            # REST server entry point (Port 4000)
│   │   └── tests/               # Automated test runner (22/22 unit & integration tests)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── bug-create/      # CreateBugModal with live AI duplicate detection
│   │   │   ├── bug-detail/      # BugDetailModal (Diffs, Flags, Audit Trail, Worklogs, Comments)
│   │   │   ├── common/          # StatusBadge, SeverityBadge, FlagBadge, DiffViewer, ImportExportModal
│   │   │   ├── layout/          # Navbar, Sidebar, CommandPalette (Ctrl+K), NotificationDrawer
│   │   │   └── views/           # TableView, KanbanView, GraphView, TriageView, MilestoneView, AnalyticsView
│   │   ├── context/             # AppContext (Personas, Filters, Notifications, Store state)
│   │   ├── services/            # API client
│   │   ├── types/               # Frontend TypeScript interfaces
│   │   ├── App.tsx              # Main layout router
│   │   ├── index.css            # Tailwind & dark theme styling
│   │   └── main.tsx             # React DOM root
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 🚦 Quick Start & Running Locally

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
# Server will listen on http://localhost:4000/api
```

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
# App will open on http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm test
# Executes all 22 backend lifecycle, graph, AI triage, and XML sync tests
```

---

## 🎯 Verification & Feature Walkthrough

1. **Multi-View Workspace**:
   - **Grid / Table View**: Sortable columns, inline status transition triggers, batch multi-select for bulk assignment and status updates.
   - **Kanban Board**: Visual pipeline across all Bugzilla statuses (`UNCONFIRMED` to `CLOSED`) with drag-and-drop.
   - **Interactive Blocker Graph**: SVG node diagram rendering blocker chains, critical paths, and cycle-free DAG confirmation.
   - **Speed Triage Mode**: Maintainer workspace to review unconfirmed bugs, apply AI triage recommendations, and request `needinfo?`.
   - **Milestone & Release Tracker**: Burndown metrics, target delivery dates, and open blocker counters.
   - **Analytics & SLA Dashboard**: MTTR metrics, component defect density heatmaps, and top fixer leaderboards.

2. **Core Bugzilla Workflows**:
   - **Flags**: Test `review?`, `needinfo?`, `qa-verify?`, `security-audit?`, and `release-blocker!` with 1-click approvals (`+`), rejections (`-`), and clears (`X`).
   - **In-App Patch Diffs**: View unified and side-by-side git diffs with syntax highlighting.
   - **Micro-Audit Trail**: Track every field change, actor, and timestamp.
   - **Time Tracking**: Log developer work sessions with automatic remaining estimate updates.
   - **Bugzilla XML Interop**: Export to standard `<bugzilla>` XML format or import legacy XML dumps.
