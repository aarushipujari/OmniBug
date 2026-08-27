# 🐞 OmniBug

**Enterprise Bug & Defect Lifecycle Management Platform Reconstructed from Bugzilla.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Track](https://img.shields.io/badge/Track%202-Bugzilla%20Reconstructed-8b5cf6.svg)]()
[![Tests](https://img.shields.io/badge/tests-28%20passing-16a34a.svg)]()
[![Typecheck](https://img.shields.io/badge/tsc-0%20errors-16a34a.svg)]()
[![Architecture](https://img.shields.io/badge/Stack-React%2018%20%2B%20Express%20REST-0284c7.svg)]()

File a crash traceback, inspect unified patch diffs side-by-side, request peer review flags, and visualize blocker critical paths across multi-tiered software architectures. OmniBug preserves Bugzilla's battle-tested enterprise rigor—hierarchical domain models (*Products ➔ Components ➔ Milestones*), guarded state machines, and fine-grained reviewer flags—while reimagining the developer experience with instant sub-millisecond reactivity, AI triage intelligence, and terminal-grade command ergonomics.

Built for **Track 2: Developer Tool Reconstruction — Bugzilla**.

---

## Contents

- [Try it in two minutes](#try-it-in-two-minutes)
- [The core idea](#the-core-idea)
- [Five capabilities beyond legacy Bugzilla](#five-capabilities-beyond-legacy-bugzilla)
- [Comparison with Legacy Bugzilla](#comparison-with-legacy-bugzilla)
- [Architecture & Data Flow](#architecture--data-flow)
- [Guarded State Machine & Graph Invariants](#guarded-state-machine--graph-invariants)
- [Interface, Ergonomics & Personas](#interface-ergonomics--personas)
- [Quickstart & Local Setup](#quickstart--local-setup)
- [Verification & Automated Test Suite](#verification--automated-test-suite)
- [Project Layout](#project-layout)

---

## Try it in two minutes

Running locally across decoupled frontend and backend services:

1. **Filter blockers with tokenized search.** Type `severity:blocker` or `priority:P1` in the top search bar (or press <kbd>Ctrl+K</kbd> / <kbd>⌘K</kbd>) to instantly isolate release-critical defects without page reloads.
2. **Switch active developer personas.** Click the top-right avatar menu to toggle between **Alex Rivera** *(Lead Architect)*, **Elena Rostova** *(Security Lead)*, and **Sarah Jenkins** *(QA Lead)*. Notice how assigned queues and `needinfo?` review tallies dynamically re-scope.
3. **Execute discussion slash commands.** Open **Bug #1001**, scroll to comments, and type `/priority P1` or `/log 2.5h Verified memory bounds`. Submit to see the issue state mutate with a live audit trail.
4. **Inspect side-by-side patch diffs.** Inside **Bug #1001**, switch to the *Patch Diffs* tab and toggle *Split View* to review 2-column git deletions and additions.
5. **Auto-triage a raw crash traceback.** Click *+ New Bug* (<kbd>C</kbd>), enter title `IndexError in AST optimizer`, paste a Python traceback into the description, and click *✨ Auto-Analyze*. The engine parses the culprit file/line, detects duplicates, and auto-routes the ticket to the JIT/Compiler component.
6. **Trace the blocker critical path.** Open *Dependency Graph (DAG)* to inspect the topological sort and the red-highlighted critical path delaying release delivery.

---

## The core idea

Unstructured task boards (like Trello or generic kanban tools) fail in mission-critical systems engineering. When hundreds of developers write code simultaneously for operating systems, rendering engines, or distributed clusters:
- Defects block other defects across complex dependency hierarchies.
- Code cannot ship without formal peer-review approvals and QA verification gates.
- Security-sensitive memory vulnerabilities must be quarantined with explicit audit trails.

```
       ┌─────────────────────────────────────────────────────────────────────────┐
       │                       OMNIBUG DOMAIN HIERARCHY                          │
       │                                                                         │
       │   Product (e.g. Quantum Web Platform)                                   │
       │     ├── Milestones (v128.1-security-patch, v129.0-release)              │
       │     └── Components (Layout & CSS, JS/WASM JIT, Networking, Sandbox)     │
       │           └── Bug / Defect Entity                                       │
       │                 ├── Guarded Lifecycle (UNCONFIRMED ➔ CLOSED)           │
       │                 ├── Review Flags (? / + / - / X)                        │
       │                 ├── Blocker Adjacency Graph (blocks / dependsOn)        │
       │                 ├── Splinter Patch Diffs (Unified / Split)              │
       │                 └── Immutable Field Mutation Audit Logs                 │
       └─────────────────────────────────────────────────────────────────────────┘
```

OmniBug formalizes this structure: every bug belongs to a governed component hierarchy with strict state machine validation and full XML interoperability with legacy Bugzilla servers.

---

## Five capabilities beyond legacy Bugzilla

Five architectural innovations modernizing Bugzilla for high-velocity software teams:

### 1. Blocker Topology & Kahn's Critical Path DAG
Legacy Bugzilla lists blocker IDs as static comma-separated text numbers. OmniBug models dependencies as a Directed Acyclic Graph (DAG):
- Executes **Kahn's Topological Sorting Algorithm** in $\mathcal{O}(V + E)$ time complexity to determine spatial layout levels.
- Automatically calculates and renders the **Critical Path** (highlighted in red) to show engineering leads the exact chain of unresolved blockers preventing a release milestone.
- Employs real-time cycle detection to prevent circular blocker deadlocks.

### 2. Multi-Language AST/Regex Crash Traceback Parser
Engineers frequently copy-paste raw terminal logs into bug reports. OmniBug includes an intelligent traceback parser supporting:
- **Python** tracebacks (`File "...", line ..., in ...`)
- **JavaScript / TypeScript / V8** error traces (`at function (file:line:col)`)
- **Go** panics (`goroutine [running] / file.go:line`)
- **Rust** panics (`thread panicked at '...', file.rs:line`)
- **C/C++ AddressSanitizer (ASAN) & GDB** memory dumps

The parser extracts the deepest application culprit frame, extracts line numbers, matches file paths to system components, and synthesizes automated Jest/Mocha reproduction test templates.

### 3. Live NLP Token Similarity Duplicate Prevention
Duplicate bugs waste hundreds of developer triage hours. As a reporter types a title and description, OmniBug tokenizes the input, strips punctuation, and runs Jaccard n-gram cosine similarity matching against all open and closed tickets in the database. A live warning drawer alerts the reporter with match percentage scores and one-click side-by-side comparison before redundant tickets are submitted.

### 4. Discussion Slash Command Automation Engine
Developers can triage and update issues directly from comment boxes without clicking through forms:
- `/resolve FIXED` or `/resolve DUPLICATE #1001` &mdash; transitions status and records resolution.
- `/priority P1` &mdash; updates issue priority.
- `/severity blocker` &mdash; escalates defect severity.
- `/flag review? @Alex` &mdash; requests peer code review.
- `/log 2.5h Tested buffer bounds fix` &mdash; decrements remaining estimates and logs work sessions.

### 5. Splinter Patch Diff Viewer & Bugzilla XML DTD Sync
- **Splinter Split Diff**: Renders unified git patches with syntax highlighting and 2-column side-by-side diffing (base deletions on the left, proposed patch additions on the right).
- **Bugzilla XML Sync**: Exports the complete system state to standard `<bugzilla>` XML DTD or imports legacy Bugzilla XML dumps for zero-loss server migration.

---

## Comparison with Legacy Bugzilla

| Dimension | Legacy Bugzilla (Perl CGI) | OmniBug (Modern Reconstruction) |
| :--- | :--- | :--- |
| **Architecture** | Heavy Perl CGI scripts, full page reload on every comment, lock contention | Decoupled React 18 SPA + Express.js REST API with sub-millisecond client state |
| **Triage & Ergonomics** | Multi-screen form clicking, slow manual categorization | **Speed Triage Workspace** with keyboard hotkeys (<kbd>J</kbd>/<kbd>K</kbd>/<kbd>C</kbd>/<kbd>I</kbd>/<kbd>E</kbd>/<kbd>1-5</kbd>) |
| **Duplicate Prevention** | Reactive duplicate search *after* filing | **Live Proactive NLP Similarity** alerting reporters *as they type* |
| **Crash / Stack Traces** | Unformatted plain text blobs | **Multi-Language Parser** auto-extracting culprit file/line and component routing |
| **Blockers & Dependencies** | Flat text ID lists with zero spatial insight | **Interactive SVG Blocker DAG** with Kahn's topological levels and red Critical Path |
| **Review & Flags Workflow** | Cryptic dropdowns with `?`, `+`, `-` syntax | Modern **Flag Manager** for `review?`, `needinfo?`, `qa-verify?`, `security-audit?` |
| **Patch Inspection** | Raw `.diff` file downloads (Splinter add-on) | **Embedded Unified & Side-by-Side Split Diff Viewer** with syntax highlighting |
| **Discussion Automations** | Traditional web forms | **Slash Commands** (`/resolve`, `/priority`, `/assign`, `/flag`, `/log`) |
| **Data Interoperability** | Native XML export / import | Full round-trip **Bugzilla XML DTD Export & Import Sync** |

---

## Architecture & Data Flow

```
                                  OMNIBUG ARCHITECTURE
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                                   Frontend UI                                    │
 │  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────────────┐  │
 │  │ Grid / Table │ Kanban Board │  Dependency  │ Speed Triage │  Command Cent. │  │
 │  │    Matrix    │  & Workflow  │  Graph (DAG) │  (Hotkeys)   │   (Ctrl + K)   │  │
 │  └──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Modals: Bug Detail, Split Diff, Flag Manager, Create Bug, XML Sync, Guide  │  │
 │  └────────────────────────────────────────────────────────────────────────────┘  │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │  RESTful JSON API (Port 4000)
 ┌────────────────────────────────────────▼─────────────────────────────────────────┐
 │                               Express Backend API                                │
 │  ┌───────────────────────┬─────────────────────────┬───────────────────────────┐  │
 │  │ State Machine Engine  │ Kahn's DAG & Critical   │ Slash Command Engine &    │  │
 │  │ (Guarded Transitions) │ Path Topology Engine    │ Micro-Audit Trail Logger  │  │
 │  ├───────────────────────┼─────────────────────────┼───────────────────────────┤  │
 │  │ Multi-Language Stack  │ NLP Token Similarity &  │ Bugzilla XML DTD Serializer│ │
 │  │ Trace & Crash Parser  │ Duplicate Detector      │ and Import Parser         │  │
 │  └───────────────────────┴─────────────────────────┴───────────────────────────┘  │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
 ┌────────────────────────────────────────▼─────────────────────────────────────────┐
 │                                 Data Persistence                                 │
 │  ┌────────────────────────────────────────────────────────────────────────────┐  │
 │  │ In-Memory Transactional Store + Atomic JSON Disk Persistence (data-storage)│  │
 │  │ (Products, Components, Milestones, Bugs, Flags, WorkLogs, Attachments, CC) │  │
 │  └────────────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Guarded State Machine & Graph Invariants

### 1. State Machine Invariants
OmniBug enforces strict mathematical lifecycle transitions:
- **Invariant 1 (Resolution Requirement)**: Transitioning to `RESOLVED` or `CLOSED` strictly requires a resolution code (`FIXED`, `INVALID`, `WONTFIX`, `DUPLICATE`, `WORKSFORME`).
- **Invariant 2 (No Direct Verification)**: Bugs in `NEW` or `IN_PROGRESS` cannot bypass resolution directly to `VERIFIED`.
- **Invariant 3 (Duplicate Cross-Referencing)**: `DUPLICATE` resolution requires specifying a valid target Bug ID, automatically synchronizing CC lists.
- **Invariant 4 (Reopening Invariant)**: Transitioning to `REOPENED` clears previous resolution codes and timestamps.

### 2. Kahn's Topological Sort & Critical Path Formula
Given a directed graph $G = (V, E)$ where vertices $V$ represent bugs and directed edges $(u, v) \in E$ denote that bug $u$ blocks bug $v$:
1. Calculate in-degrees: $D_{in}(v) = |\{u \in V \mid (u, v) \in E\}|$.
2. Enqueue all root bugs with $D_{in}(v) = 0$ at level 0.
3. For each vertex $u$, decrement $D_{in}(w)$ for all outgoing edges $(u, w)$, setting $\text{Level}(w) = \text{Level}(u) + 1$.
4. If processed count $< |V|$, a cyclic blocker deadlock exists.
5. Compute the **Critical Path**: the maximal-weight directed path of unresolved blocker issues delaying milestone delivery.

---

## Interface, Ergonomics & Personas

- **Active Persona Switcher**: Simulate permissions and reviewer queues as **Alex Rivera** *(Lead Architect)*, **Elena Rostova** *(Security Lead)*, **Sarah Jenkins** *(QA Lead)*, **Marcus Chen** *(Core Engine)*, or **David Kim** *(Frontend)*.
- **Maintainer Triage Hotkeys**:
  - <kbd>J</kbd> / <kbd>K</kbd>: Navigate through the triage queue
  - <kbd>C</kbd>: Confirm bug into `NEW`
  - <kbd>I</kbd>: Move to `IN_PROGRESS`
  - <kbd>E</kbd>: Quick resolve as `FIXED`
  - <kbd>1</kbd> &ndash; <kbd>5</kbd>: Quick set Priority (`P1` &ndash; `P5`)
- **Global Command Palette**: Press <kbd>Ctrl+K</kbd> / <kbd>⌘K</kbd> to search issues, switch views, or trigger actions from anywhere.

---

## Quickstart & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/aarushipujari/OmniBug.git
cd OmniBug

# 2. Start Backend API Server (Port 4000)
cd backend
npm install
npm run dev

# 3. In a separate terminal, start Frontend Dev Server (Port 5173)
cd ../frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## Verification & Automated Test Suite

Run the built-in test suite to verify core engine integrity across state transitions, blocker graph topology, AI classification, slash commands, and XML serialization:

```bash
cd backend
npm test
```

```
========================================
🧪 RUNNING OMNIBUG BACKEND TEST SUITE
========================================

📦 1. Store & Seed Data Tests
  ✅ PASS: Seed bugs loaded successfully
  ✅ PASS: Seed products loaded successfully
  ✅ PASS: Seed users loaded successfully

🔄 2. Bugzilla Lifecycle & State Machine Tests
  ✅ PASS: NEW -> IN_PROGRESS is allowed
  ✅ PASS: NEW -> VERIFIED is correctly rejected
  ✅ PASS: RESOLVED requires a resolution status (e.g. FIXED, INVALID)
  ✅ PASS: RESOLVED with FIXED resolution is allowed
  ✅ PASS: DUPLICATE resolution requires duplicateOfBugId
  ✅ PASS: DUPLICATE resolution with target bug ID is valid

🕸️ 3. Dependency Graph & Blocker Engine Tests
  ✅ PASS: Graph generates all nodes
  ✅ PASS: Graph generates blocker edges
  ✅ PASS: Initial seed graph has no circular blocker dependencies
  ✅ PASS: Critical path correctly calculated

🤖 4. AI Triage & Smart Duplicate Detector Tests
  ✅ PASS: AI Duplicate detector identifies relevant bug candidates
  ✅ PASS: Top duplicate candidate is correctly bug-1001/1007
  ✅ PASS: AI detects heap overflow and marks severity as blocker
  ✅ PASS: AI detects security relevance
  ✅ PASS: AI generates automated test case template

⚡ 5. Multi-Language Stack Trace Parser & Slash Command Tests
  ✅ PASS: Parser detects Python language traceback
  ✅ PASS: Parser extracts culprit file path
  ✅ PASS: Parser extracts culprit line number
  ✅ PASS: Correctly routes optimizer/compiler bug to JIT/Compiler component
  ✅ PASS: Slash command engine executes multiple commands in single comment
  ✅ PASS: Slash command updated priority to P1

📄 6. Bugzilla XML Interoperability Tests
  ✅ PASS: Exports valid Bugzilla XML root container
  ✅ PASS: Exports bug ID and metadata in XML
  ✅ PASS: Imports matching count of bugs from XML
  ✅ PASS: Imported bug title matches original

========================================
📊 TEST RESULTS: 28 PASSED, 0 FAILED
========================================
```

---

## Project Layout

```
omnibug/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Bug, Product, Flag, Analytics, and AI REST controllers
│   │   ├── data/                # In-memory transactional store & enterprise seed dataset
│   │   ├── routes/              # Express API route handlers (/api/bugs, /api/products, etc.)
│   │   ├── services/
│   │   │   ├── aiTriage.ts      # Multi-language stack trace parser & NLP duplicate detector
│   │   │   ├── bugzillaExportImport.ts # DTD XML export & import sync service
│   │   │   ├── dependencyGraph.ts      # Kahn's algorithm & critical path DAG engine
│   │   │   ├── slashCommands.ts        # Comment slash command automation processor
│   │   │   └── stateMachine.ts         # Guarded Bugzilla lifecycle validator
│   │   ├── types/               # TypeScript domain models and schemas
│   │   ├── server.ts            # Express server initialization (Port 4000)
│   │   └── tests/               # Automated test runner (28/28 passing unit & integration tests)
│   ├── data-storage/            # Atomic JSON disk persistence store
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── bug-create/      # CreateBugModal with AI auto-analysis & duplicate warning
│   │   │   ├── bug-detail/      # BugDetailModal (Split Diffs, Flags, Slash Commands, Audit Trail)
│   │   │   ├── common/          # DiffViewer, ArchitectureModal, ImportExportModal, StatusBadge
│   │   │   ├── layout/          # Navbar (Persona Switcher), Sidebar, CommandPalette, Drawer
│   │   │   └── views/           # TableView, KanbanView, GraphView, TriageView, MilestoneView, AnalyticsView
│   │   ├── context/             # AppContext (Global state, active persona, notifications)
│   │   ├── services/            # Axios / Fetch API client
│   │   ├── types/               # Frontend TypeScript interfaces
│   │   ├── App.tsx              # Main application layout and modal router
│   │   └── main.tsx             # React 18 DOM mount point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 📄 License
MIT License. Built for Track 2: Developer Tool Reconstruction &mdash; Bugzilla.
