# 🐞 OmniBug

**Modern Bug & Defect Lifecycle Management Platform Reconstructed from Bugzilla.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-84%20passing-16a34a.svg)]()
[![Typecheck](https://img.shields.io/badge/tsc-0%20errors-16a34a.svg)]()
[![Architecture](https://img.shields.io/badge/Stack-React%2018%20%2B%20Express%20REST-0284c7.svg)]()

File a crash traceback, inspect unified patch diffs side-by-side, request peer review flags, and visualize blocker critical paths across multi-tiered software architectures. OmniBug preserves Bugzilla's battle-tested enterprise rigor—hierarchical domain models (*Products ➔ Components ➔ Milestones*), guarded state machines, and fine-grained reviewer flags—while modernizing the developer experience: client state is held in memory for responsive client-side state reactivity, triage is deterministic and runs offline, and terminal-grade keyboard shortcuts reach every core workflow.

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

1. **Filter blockers with tokenized search.** Type `severity:blocker` or `priority:P1` in the top search bar (or press <kbd>Ctrl+K</kbd> / <kbd>⌘K</kbd>) to isolate release-critical defects without a page reload.
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

### 2. Multi-Language Regex/Pattern Crash Traceback Parser
Engineers frequently copy-paste raw terminal logs into bug reports. OmniBug includes an intelligent traceback pattern parser supporting:
- **Python** tracebacks (`File "...", line ..., in ...`)
- **JavaScript / TypeScript / V8** error traces (`at function (file:line:col)`)
- **Go** panics (`goroutine [running] / file.go:line`)
- **Rust** panics (`thread panicked at '...', file.rs:line`)
- **C/C++ AddressSanitizer (ASAN) & GDB** memory dumps

The parser identifies application stack frames, extracts culprit file paths and line numbers, routes tickets to corresponding system components, and synthesizes automated BDD unit test reproduction templates (`describe`/`it`/`expect`).

The synthesized reproduction test is executable, not a static template. It asserts against the triage output itself — the culprit file and line the parser extracted, the classified error type, the presence of application frames, and the routed component and severity — so running it genuinely passes or fails. Execution happens on the server in a fresh `node:vm` context that contains only `describe`, `it`, `expect` and a frozen copy of the fixture: no `require`, no `process`, no filesystem, no network, and a 1000ms interrupt for a snippet that does not terminate. The client sends the bug text rather than the test source, so the sandbox only ever runs code this server generated.

### 3. Live Token Similarity Duplicate Prevention
Duplicate bugs waste hundreds of developer triage hours. As a reporter types a title and description, OmniBug lowercases the input, strips punctuation, drops tokens of two characters or fewer, and computes tokenized Jaccard set similarity (intersection divided by union) with equal title and full-text weighting against all open and closed tickets in the database. Anything with similarity $\ge 0.18$ is surfaced in a live warning drawer with match percentage scores and one-click candidate inspection before redundant tickets are submitted.

### 4. Discussion Slash Command Automation Engine
Developers can triage and update issues directly from comment boxes without clicking through forms:
- `/resolve FIXED` or `/resolve DUPLICATE #1001` &mdash; transitions status and records resolution.
- `/priority P1` &mdash; updates issue priority.
- `/severity blocker` &mdash; escalates defect severity.
- `/flag review? @Alex` &mdash; requests peer code review.
- `/log 2.5h Tested buffer bounds fix` &mdash; decrements remaining estimates and logs work sessions.

### 5. Splinter Patch Diff Viewer & Bugzilla XML Interoperability
- **Splinter Split Diff**: Renders unified git patches with syntax highlighting and 2-column side-by-side diffing (base deletions on the left, proposed patch additions on the right).
- **Bugzilla XML Sync**: Exports the complete system state to standard `<bugzilla>` XML DTD or imports legacy Bugzilla XML dumps for Bugzilla-compatible XML import/export and data interchange.

---

## Comparison with Legacy Bugzilla

| Dimension | Legacy Bugzilla (Perl CGI) | OmniBug (Modern Reconstruction) |
| :--- | :--- | :--- |
| **Architecture** | Heavy Perl CGI scripts, full page reload on every comment, lock contention | Decoupled React 18 SPA + Express REST API with responsive in-memory client-side state (no page reloads for filtering or navigation) |
| **Triage & Ergonomics** | Multi-screen form clicking, slow manual categorization | **Speed Triage Workspace** with keyboard hotkeys (<kbd>J</kbd>/<kbd>K</kbd>/<kbd>C</kbd>/<kbd>I</kbd>/<kbd>E</kbd>/<kbd>1-5</kbd>) |
| **Duplicate Prevention** | Reactive duplicate search *after* filing | **Live Proactive Token Similarity** alerting reporters *as they type* |
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
 │  │ Multi-Language Stack  │ Token Similarity &      │ Bugzilla XML DTD Serializer│ │
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
- **Global Shortcuts**:
  - <kbd>C</kbd> *(outside Speed Triage)*: Open **+ New Bug** modal
  - <kbd>Ctrl+K</kbd> / <kbd>⌘K</kbd>: Open **Command Palette**
  - <kbd>Escape</kbd>: Close any active modal
- **Speed Triage Keyboard Shortcuts**:
  - <kbd>J</kbd> / <kbd>K</kbd> *(or <kbd>↓</kbd>/<kbd>↑</kbd>)*: Navigate triage inbox list
  - <kbd>C</kbd>: **Confirm as Bug** (transitions `UNCONFIRMED` ➔ `NEW`)
  - <kbd>I</kbd>: **Investigate** (transitions to `IN_PROGRESS` and assigns to active persona)
  - <kbd>E</kbd>: Quick resolve as `FIXED`
  - <kbd>1</kbd> &ndash; <kbd>5</kbd>: Quick set Priority (`P1` &ndash; `P5`)

---

## Quickstart & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Option A: Local Multi-Process Dev Launcher
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
*(Backend runs on port 4000, Frontend runs on port 5173 with API proxying).*

### Option B: One-Command Containerized Launch (Docker)
```bash
# Build and run the entire unified stack in a single container
docker compose up --build
```
Open **`http://localhost:4000`** in your browser. (The Express backend serves the compiled frontend single-page app and REST API endpoints).

---

## Scripted 3-Minute Judging Demo Walkthrough

| Time | Action | What to Observe |
|---|---|---|
| **0:00 - 0:45** | **Deterministic Crash Traceback Triage** | Click `+ New Bug` (<kbd>C</kbd>), enter `IndexError in AST optimizer`, paste a Python traceback, and click `✨ Auto-Analyze`. Observe the extracted culprit file/line (`optimizer.py:184`), the inferred severity and component routing, and duplicate similarity alerts. Click `▶ Run Test in Sandbox`: the server synthesizes a test from the parsed traceback, executes it in an isolated `node:vm` context with a 1s interrupt, and returns the real per-assertion results and timings. |
| **0:45 - 1:30** | **Collaborative Workflow & Slash Commands** | Open **Bug #1001**. Observe the persistent top pipeline header (`1. Reported ➔ ... ➔ 4. Review`). Switch to *Patch Diffs* tab to inspect side-by-side 2-column unified git diffs. In comments, type `/priority P1` and `/log 2.5h Fixed buffer bounds` to witness instant atomic mutation with micro-audit logging. |
| **1:30 - 2:15** | **Blocker Topology & Critical Path DAG** | Navigate to **Dependency Graph (DAG)**. Observe Kahn's Topological Sorting algorithm spatial levels and the red-highlighted **Critical Path** showing which blocker chain delays release delivery. |
| **2:15 - 3:00** | **Decision-Support Telemetry & Drill-Downs** | Open **Analytics & SLA**. Observe the 4 operational decision-support cards (*Release Threats*, *Triage Velocity*, *Defect Aging*, *Security Quarantine*). Click `[Inspect 2 Blockers ➔]` to instantly drill down into the filtered issue table without manual searching. |

---

## Why Deterministic Smart Triage Beats Black-Box LLMs

Rather than delegating defect triage to opaque third-party cloud LLM APIs, OmniBug implements a dedicated **deterministic heuristic triage engine**:
- **Offline by construction**: triage makes no network call of any kind, so crash tracebacks and source paths never leave the deployment. There is no model and no API key.
- **Zero API Key / Cost Overhead**: Eliminates recurring token costs, rate limits, and latency spikes.
- **No model, no network**: frame extraction and Jaccard scoring are plain string operations over the in-process dataset, so triage resolves inside the same request with no external call.
- **Auditable & Deterministic**: Reproducible scoring rules with exact explanation cards rather than unpredictable hallucinated classifications.

---

## Technical Architecture & Evaluator Verification Matrix

| Architectural Dimension | Implementation Detail | Automated Verification Evidence |
|---|---|---|
| **Core Defect Lifecycle & Hierarchy** | Full Bugzilla domain model (*Products ➔ Components ➔ Milestones*), guarded state machine (`UNCONFIRMED` ➔ `CLOSED`), reviewer flags (`?`, `+`, `-`, `X`), time tracking, and full Bugzilla XML round-tripping. | 6 State machine tests + 4 XML round-trip tests (`npm test`) |
| **Traceback parser & blocker DAG** | Multi-language crash parser (Python, V8, Go, Rust, ASAN), live duplicate detection, Kahn's-algorithm critical-path DAG engine, and reproduction-test synthesis. | Traceback and DAG critical-path assertions |
| **Security, RBAC & Mutation Isolation** | scrypt password verification, expiring HMAC-SHA256 session tokens (`POST /api/auth/login`), field allowlisting on updates, capability gates (`security_override`, `verify_bug`), explicit domain commands (`/transition`, `/assign`, `/set-security`), and optimistic concurrency locks (`lockVersion`). | HTTP-level authentication, authorisation, validation and concurrency assertions |
| **Ergonomics & Studio UI** | Linear/shadcn-inspired interface with dark mode, persistent visual lifecycle stepper, unified chronological activity timeline, and comprehensive keyboard accessibility (<kbd>Ctrl+K</kbd>, <kbd>C</kbd>, <kbd>J</kbd>/<kbd>K</kbd>, <kbd>Esc</kbd>). | Verified across React 18 component hierarchy |
| **Single-Command Reliability** | 84/84 passing automated backend tests, single-command launcher (`npm run dev`), Docker deployment (`docker compose up`), and verification (`npm run check`). | `npm run check` compiles cleanly with 0 errors |

---

## Security Architecture, Session Tokens & Concurrency

- **Passwords**: stored as scrypt derivations with a per-user 16-byte salt and compared with `crypto.timingSafeEqual`. A hash is never serialised to a client.
- **Session tokens**: `POST /api/auth/login` verifies a password and returns `base64url(userId:issuedAt:expiresAt:hmac)`, signed with HMAC-SHA256. Every request re-verifies the signature and **enforces the expiry**. `SESSION_SECRET` is required in production — the server refuses to start without it rather than falling back to a constant an attacker could read in the source.
- **One source of identity**: identity is taken from the `Authorization: Bearer` token and nowhere else. Headers and request bodies naming a user are ignored, so the audit trail records who actually acted.
- **Field allowlisting**: `PATCH /bugs/:id` applies only fields on an explicit allowlist and validates each one. Identity fields (`id`, `bugNumber`) and unknown properties are rejected, so a client cannot rewrite a primary key or graft arbitrary state onto a record.
- **Capability checks**: authorisation derives from the role field alone. Transitions to `VERIFIED`/`CLOSED`, store resets, XML import, and the security flag each require a named capability.
- **Optimistic concurrency**: every mutation increments `lockVersion`; a write against a stale version is rejected with `409 Conflict` rather than silently overwriting.
- **Sandboxed execution**: synthesized reproduction tests run in a fresh `node:vm` context with no `require`, `process`, filesystem or network access and a 1000ms interrupt. The endpoint requires authentication and runs only source the server generated — it never executes a snippet supplied by a caller.

---

## Explicit Design Trade-offs & Production Migration Roadmap

To maintain absolute credibility and transparent engineering standards, OmniBug explicitly documents the following design trade-offs:
1. **Persistence Layer**: Implements a local-first in-memory transactional store with atomic JSON snapshots and optimistic locking for instant local evaluation. `Store` is a concrete class, not an abstraction over a driver, so moving to PostgreSQL means rewriting it rather than swapping an implementation. The entity mapping that migration would follow:
   | Entity | Local Store Model | Production PostgreSQL Table |
   |---|---|---|
   | Product / Component | `products[].components[]` | `products` 1-to-N `components` |
   | Bug / Defect | `bugs[]` with `lockVersion` | `bugs` table with `INTEGER lock_version` |
   | Audit Trail | `auditLogs[]` (immutable) | `audit_logs` append-only partitioned table |
2. **Authentication**: Passwords are hashed with scrypt and verified in constant time; a successful login returns an HMAC-SHA256 signed token carrying an expiry that is enforced on every request. The seeded accounts share a published password so the role boundaries can be exercised during evaluation — the credential is still checked server-side, so those boundaries are real rather than simulated. There is no registration, password reset, or refresh-token rotation; production would delegate to an OIDC provider.
3. **Traceback parsing**: per-language regular expressions extract the culprit frame. There is no syntax tree involved — calling it an AST parser would overstate what it does — but it is deterministic, runs in-process, and needs no cloud round-trip.

---

## Verification & Automated Test Suite

Run the full repository verification command to build both packages and execute all 84 automated tests:

```bash
npm run check
```

```
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
  ✅ PASS: HMAC session token verified and identity extracted
  ✅ PASS: Tampered HMAC session token strictly rejected
  ✅ PASS: Expired session token rejected despite a valid signature
  ✅ PASS: Correct password verifies against the stored digest
  ✅ PASS: Incorrect password is rejected
  ✅ PASS: Optimistic concurrency lockVersion auto-increments on mutation
🌐 9. HTTP API — Authentication
  ✅ PASS: Anonymous mutation is rejected
  ✅ PASS: X-User-Id header grants no identity
  ✅ PASS: _currentUser in the body grants no identity
[API] POST /api/auth/token 404 (2ms)
  ✅ PASS: Credential-free token endpoint no longer exists
  ✅ PASS: Wrong password is rejected
  ✅ PASS: Unknown account is rejected
  ✅ PASS: Correct password returns a session token
  ✅ PASS: Valid token authenticates
  ✅ PASS: Password hash is never serialised to a client
  ✅ PASS: Forged token is rejected
🔒 10. HTTP API — Authorisation
  ✅ PASS: Developer cannot reset the store
  ✅ PASS: Maintainer can reset the store
  ✅ PASS: Security override requires the capability, not a matching name
🛡️ 11. HTTP API — Request validation
  ✅ PASS: Update with no permitted fields is rejected
  ✅ PASS: Identity fields cannot be rewritten by a client
  ✅ PASS: Primary key and bug number are unchanged
  ✅ PASS: Arbitrary properties are not grafted onto a record
  ✅ PASS: Invalid severity is rejected on update, not just on create
  ✅ PASS: Too-short title is rejected on update
  ✅ PASS: A permitted field updates normally
🔁 12. HTTP API — Concurrency & graph integrity
  ✅ PASS: A write against a stale version is refused
  ✅ PASS: A write against the current version succeeds
  ✅ PASS: Dependency graph contains no dangling edges
📋 13. HTTP API — Audit attribution
  ✅ PASS: Issue is readable
  ✅ PASS: Comment is attributed to the authenticated user, not a client-supplied one
🧪 14. Reproduction test sandbox
  ✅ PASS: A passing test reports one passing assertion
  ✅ PASS: Timings are measured, not hardcoded
  ✅ PASS: A failing assertion is reported as a failure
  ✅ PASS: The failure message names the received value
  ✅ PASS: A snippet that will not parse fails cleanly rather than throwing
  ✅ PASS: The VM context exposes no process object to the snippet
  ✅ PASS: A non-terminating snippet is interrupted by the timeout
  ✅ PASS: Running a test requires authentication
  ✅ PASS: Authenticated caller can run the synthesized test
  ✅ PASS: The synthesized test passes against the traceback it was generated from
  ✅ PASS: The generated suite contains several real assertions
  ✅ PASS: Output is generated from the run, not a fixed string
========================================
📊 TEST RESULTS: 84 PASSED, 0 FAILED
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
│   │   └── tests/               # Automated test runner (84/84 passing unit & integration tests)
│   ├── data-storage/            # Atomic JSON disk persistence store
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── bug-create/      # CreateBugModal with AI auto-analysis & duplicate warning
│   │   │   ├── bug-detail/      # BugDetailModal (Split Diffs, Flags, Slash Commands, Audit Trail)
│   │   │   ├── common/          # DiffViewer, ArchitectureModal, ImportExportModal, StatusBadge, ToastContainer
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
MIT License. Built for Track 2: Developer Tool Reconstruction — Bugzilla.
