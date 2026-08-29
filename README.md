# 🐞 OmniBug

**Enterprise Bug & Defect Lifecycle Management Platform Reconstructed from Bugzilla.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-44%20passing-16a34a.svg)]()
[![Typecheck](https://img.shields.io/badge/tsc-0%20errors-16a34a.svg)]()
[![CI](https://img.shields.io/badge/CI-passing-16a34a.svg)]()
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

## Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/aarushipujari/OmniBug.git
cd OmniBug

# 2. One-Command Setup (Installs backend & frontend dependencies)
npm run setup

# 3. One-Command Dual Server Launch
npm run dev
```

Open **`http://localhost:5173`** in your browser.  
*(Or start independently: `npm run dev` inside `/backend` on port 4000 and `/frontend` on port 5173).*

---

---

## Scripted 3-Minute Judging Demo Walkthrough

| Time | Action | What to Observe |
|---|---|---|
| **0:00 - 0:45** | **Auto-Triage Crash Traceback** | Click `+ New Bug` (<kbd>C</kbd>), enter `IndexError in AST optimizer`, paste a Python traceback, and click `✨ Auto-Analyze`. Observe the extracted culprit file/line (`optimizer.py:184`), deterministic confidence score (`88% Confidence`), and duplicate similarity alerts. Click `▶ Run Test in Sandbox` to execute the synthesized test live. |
| **0:45 - 1:30** | **Collaborative Workflow & Slash Commands** | Open **Bug #1001**. Observe the persistent top pipeline header (`1. Reported ➔ ... ➔ 4. Review`). Switch to *Patch Diffs* tab to inspect side-by-side 2-column unified git diffs. In comments, type `/priority P1` and `/log 2.5h Fixed buffer bounds` to witness instant atomic mutation with micro-audit logging. |
| **1:30 - 2:15** | **Blocker Topology & Critical Path DAG** | Navigate to **Dependency Graph (DAG)**. Observe Kahn's Topological Sorting algorithm spatial levels and the red-highlighted **Critical Path** showing which blocker chain delays release delivery. |
| **2:15 - 3:00** | **Decision-Support Telemetry & Drill-Downs** | Open **Analytics & SLA**. Observe the 4 operational decision-support cards (*Release Threats*, *Triage Velocity*, *Defect Aging*, *Security Quarantine*). Click `[Inspect 2 Blockers ➔]` to instantly drill down into the filtered issue table without manual searching. |

---

## Technical Architecture & Evaluator Verification Matrix

| Architectural Dimension | Implementation Detail | Automated Verification Evidence |
|---|---|---|
| **Core Defect Lifecycle & Hierarchy** | Full Bugzilla domain model (*Products ➔ Components ➔ Milestones*), guarded state machine (`UNCONFIRMED` ➔ `CLOSED`), reviewer flags (`?`, `+`, `-`, `X`), time tracking, and full Bugzilla XML round-tripping. | 6 State machine tests + 4 XML round-trip tests (`npm test`) |
| **Traceback AST Parser & Blocker DAG** | Multi-language crash parser (Python, V8, Go, Rust, ASAN), live NLP duplicate detection, Kahn's algorithm critical path DAG engine, and sandboxed test execution. | 5 AST/Traceback tests + 4 DAG critical-path tests |
| **Security, RBAC & Mutation Isolation** | Cryptographically signed HMAC-SHA256 session tokens (`/api/auth/token`), capability gates (`security_override`, `verify_bug`), explicit domain commands (`/transition`, `/assign`, `/set-security`), and optimistic concurrency locks (`version`). | 8 RBAC, HMAC token & concurrency tests |
| **Ergonomics & Studio UI** | Linear/shadcn-inspired interface with dark mode, persistent visual lifecycle stepper, unified chronological activity timeline, live floating AI suggestion card, and keyboard navigation (<kbd>Ctrl+K</kbd>, <kbd>C</kbd>, <kbd>J</kbd>/<kbd>K</kbd>). | Verified across React 18 component hierarchy |
| **Single-Command Reliability** | 44/44 passing automated backend tests, single-command launcher (`npm run dev`), single-command verification (`npm run check`), and automated GitHub Actions CI workflow. | `npm run check` compiles cleanly with 0 errors |

---

## Security Architecture, Session Tokens & Concurrency

- **Cryptographic HMAC Session Tokens**: Client requests can authenticate via `Authorization: Bearer <signed-token>` generated with SHA-256 HMAC signatures (`POST /api/auth/token`), or use the `X-Demo-Persona-Id` header for transparent local judging simulation.
- **Guarded Domain Mutations**: Status transitions to `VERIFIED` and `CLOSED` strictly require QA Lead or Admin capability tokens. Generic `PATCH /bugs/:id` is guarded and enforces optimistic concurrency locks.
- **Optimistic Concurrency Control**: Every bug mutation increments a numeric `version` counter. Concurrent overwrites are rejected with `409 Conflict` errors to prevent race conditions.
- **Security Quarantine**: Issues flagged as `isSecuritySensitive` require explicit `security_override` capability to modify.

---

## Explicit Design Trade-offs & Known Scope Limitations

To maintain absolute credibility and transparent engineering standards, OmniBug explicitly documents the following design trade-offs:
1. **Authentication Mode**: Implements HMAC-SHA256 signed session tokens and persona switching optimized for local evaluation. Production deployment would integrate external OAuth2/OIDC providers.
2. **Persistence Adapter**: Employs an in-memory transactional store with atomic JSON disk snapshots and optimistic concurrency locks. Multi-node clusters would swap this for PostgreSQL/CockroachDB via the existing Repository abstraction.
3. **Traceback AST Parsing**: Uses deterministic regex AST tokenizers optimized for instant sub-millisecond client reactivity without requiring external cloud API round-trips.

---

## Verification & Automated Test Suite

Run the full repository verification command to build both packages and execute all 44 automated tests:

```bash
npm run check
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

📄 6. Bugzilla XML Interoperability Tests
  ✅ PASS: Exports valid Bugzilla XML root container
  ✅ PASS: Exports bug ID and metadata in XML
  ✅ PASS: Imports matching count of bugs from XML
  ✅ PASS: Imported bug title matches original

🎯 7. Speed Triage & Classification Tests (#1006)
  ✅ PASS: Bug #1006 starts in UNCONFIRMED status
  ✅ PASS: AI generates suggested component ID for bug #1006
  ✅ PASS: AI correctly predicts major severity for timeout/exhaustion
  ✅ PASS: Persisted AI severity to bug-1006
  ✅ PASS: Persisted AI tags to bug-1006
  ✅ PASS: Valid transition from UNCONFIRMED to NEW
  ✅ PASS: Bug #1006 confirmed to NEW status
  ✅ PASS: Confirmed status persists in store

🛡️ 8. RBAC, Domain Commands & Security Tests
  ✅ PASS: Developer persona identified
  ✅ PASS: QA persona identified
  ✅ PASS: Admin persona identified
  ✅ PASS: Explicit domain assignment succeeded
  ✅ PASS: Domain assignment produced immutable audit trail
  ✅ PASS: Cryptographic HMAC session token generated
  ✅ PASS: HMAC session token successfully verified and extracted identity
  ✅ PASS: Tampered HMAC session token strictly rejected
  ✅ PASS: Optimistic concurrency version auto-increments on mutation

========================================
📊 TEST RESULTS: 44 PASSED, 0 FAILED
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
│   │   └── tests/               # Automated test runner (35/35 passing unit & integration tests)
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
