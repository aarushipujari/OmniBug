import { hashPassword } from '../middleware/auth.js';
import { User, Product, Bug, AuditLogEntry } from '../types/index.js';

/**
 * Shared demo credential. Every seeded account uses it, and the sign-in screen
 * shows it, so evaluating the product costs one click while the server still
 * performs a genuine password verification.
 */
export const DEMO_PASSWORD = 'omnibug-demo';

const DEMO_HASH = hashPassword(DEMO_PASSWORD);

export const SEED_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Alex Rivera (Lead Architect)',
    email: 'alex.rivera@omnibug.dev',
    role: 'maintainer',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Elena Rostova (Security Engineer)',
    email: 'elena.rostova@omnibug.dev',
    role: 'developer',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-3',
    name: 'Marcus Chen (Core Engine Dev)',
    email: 'marcus.chen@omnibug.dev',
    role: 'developer',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-4',
    name: 'Sarah Jenkins (QA Lead)',
    email: 'sarah.jenkins@omnibug.dev',
    role: 'qa',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-5',
    name: 'David Kim (Frontend Specialist)',
    email: 'david.kim@omnibug.dev',
    role: 'developer',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-6',
    name: 'Triage Admin',
    email: 'admin@omnibug.dev',
    role: 'admin',
    passwordHash: DEMO_HASH,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Quantum Web Platform',
    description: 'High-performance rendering engine, DOM parser, WebAssembly runtime, and networking stack.',
    versions: ['128.0', '129.0', '130.0-nightly'],
    milestones: [
      { id: 'm-1', name: 'v128.1-security-patch', targetDate: '2026-09-05', status: 'open', description: 'Urgent security and crash fixes for stable branch' },
      { id: 'm-2', name: 'v129.0-release', targetDate: '2026-09-25', status: 'open', description: 'Next major release with CSS Subgrid 2 & WebGPU updates' },
      { id: 'm-3', name: 'v130.0-next', targetDate: '2026-10-30', status: 'open', description: 'Experimental multi-threaded DOM pipeline' }
    ],
    components: [
      { id: 'comp-101', name: 'Layout & CSS Engine', description: 'Box model, flexbox, grid, subgrid, font metrics calculation', leadId: 'usr-3', leadName: 'Marcus Chen', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-102', name: 'JavaScript & WASM JIT', description: 'Optimizing compiler, bytecode interpreter, garbage collector', leadId: 'usr-1', leadName: 'Alex Rivera', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-103', name: 'Networking & HTTP/3', description: 'QUIC protocol implementation, TLS 1.3 handshakes, connection pooling', leadId: 'usr-2', leadName: 'Elena Rostova', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-104', name: 'Security Sandbox', description: 'Process isolation, IPC filters, memory protection guarantees', leadId: 'usr-2', leadName: 'Elena Rostova', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Aether Cloud Infrastructure',
    description: 'Distributed microservices, event streaming gateway, telemetry collector, and Kubernetes orchestrator.',
    versions: ['4.2.0', '4.3.0-rc1', '5.0.0-alpha'],
    milestones: [
      { id: 'm-4', name: 'Sprint-42-Reliability', targetDate: '2026-09-12', status: 'open', description: 'Zero-downtime cluster upgrades and Redis cluster failover' },
      { id: 'm-5', name: 'v5.0-Architecture-Overhaul', targetDate: '2026-11-15', status: 'open', description: 'gRPC streaming migration' }
    ],
    components: [
      { id: 'comp-201', name: 'API Gateway & Routing', description: 'Rate limiting, JWT validation, reverse proxying, CORS policy', leadId: 'usr-1', leadName: 'Alex Rivera', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-202', name: 'Database & Storage Layer', description: 'PostgreSQL connection pool, Redis cache invalidation, migrations', leadId: 'usr-3', leadName: 'Marcus Chen', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-203', name: 'Observability & Metrics', description: 'Prometheus scrapers, OpenTelemetry exporters, alert triggers', leadId: 'usr-5', leadName: 'David Kim', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Orion Developer Studio',
    description: 'Modern desktop and web IDE interface, extensions marketplace, debug adapters, and AI copilot.',
    versions: ['2026.3', '2026.4-beta'],
    milestones: [
      { id: 'm-6', name: '2026.3.2-Hotfix', targetDate: '2026-09-02', status: 'open', description: 'Fix language server crashes and syntax highlighter memory leak' }
    ],
    components: [
      { id: 'comp-301', name: 'Editor UI & Canvas', description: 'Monaco editor integration, minimap rendering, gutter decorations', leadId: 'usr-5', leadName: 'David Kim', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' },
      { id: 'comp-302', name: 'Extension Host & IPC', description: 'Isolated worker threads, VSCode protocol compatibility layer', leadId: 'usr-1', leadName: 'Alex Rivera', defaultQaId: 'usr-4', defaultQaName: 'Sarah Jenkins' }
    ]
  }
];

export const SAMPLE_DIFF_1 = `--- a/src/network/quic_session.cc
+++ b/src/network/quic_session.cc
@@ -142,8 +142,12 @@ void QuicSession::ProcessIncomingFrames(const uint8_t* buffer, size_t len) {
     if (frame_type == FRAME_CRYPTO) {
-        DecryptPayload(buffer + offset, payload_len);
-        state_ = SESSION_HANDSHAKE_READY;
+        if (state_ != SESSION_INITIAL && state_ != SESSION_HANDSHAKE_PENDING) {
+            LOG_SECURITY_ERROR("Unexpected CRYPTO frame received in invalid state: " << state_);
+            CloseConnection(QUIC_ERROR_PROTOCOL_VIOLATION);
+            return;
+        }
+        DecryptPayload(buffer + offset, payload_len);
+        state_ = SESSION_HANDSHAKE_READY;
     }
 }`;

export const SAMPLE_DIFF_2 = `--- a/src/layout/css_grid_solver.ts
+++ b/src/layout/css_grid_solver.ts
@@ -88,7 +88,9 @@ export class CSSGridSolver {
   computeTrackSizes(tracks: GridTrack[]): number[] {
-    return tracks.map(t => t.flexFr * this.remainingSpace);
+    const totalFr = tracks.reduce((sum, t) => sum + (t.isFr ? t.frValue : 0), 0);
+    if (totalFr <= 0) return tracks.map(t => t.baseSize);
+    return tracks.map(t => t.isFr ? (t.frValue / totalFr) * this.remainingSpace : t.baseSize);
   }
 }`;

export const SEED_BUGS: Bug[] = [
  {
    id: 'bug-1001',
    bugNumber: 1001,
    title: 'Heap buffer overflow in QUIC session crypto frame state machine',
    description: 'During TLS 1.3 0-RTT retransmission, an out-of-order CRYPTO frame triggers state transition corruption when the handshake is already acknowledged. Allows remote code execution in sandbox context.\n\nReproduction Steps:\n1. Send ClientHello with EarlyData\n2. Inject duplicate synthetic CRYPTO packet during ServerHello acknowledgement\n3. Observe heap memory corruption at 0x7ffd982a10',
    productId: 'prod-1',
    productName: 'Quantum Web Platform',
    componentId: 'comp-103',
    componentName: 'Networking & HTTP/3',
    version: '128.0',
    targetMilestone: 'v128.1-security-patch',
    status: 'IN_REVIEW',
    resolution: null,
    severity: 'blocker',
    priority: 'P1',
    reporterId: 'usr-2',
    reporterName: 'Elena Rostova (Security Engineer)',
    assigneeId: 'usr-2',
    assigneeName: 'Elena Rostova (Security Engineer)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-1', 'usr-3', 'usr-6'],
    watchers: ['usr-1', 'usr-2', 'usr-6'],
    votes: 14,
    votedUserIds: ['usr-1', 'usr-3', 'usr-4', 'usr-5'],
    dependsOn: [],
    blocks: ['bug-1004'], // Blocks v128.1 release blocker
    seeAlso: ['CVE-2026-44012'],
    flags: [
      {
        id: 'flg-1',
        name: 'security-audit',
        status: '+',
        requesteeId: 'usr-2',
        requesteeName: 'Elena Rostova',
        setterId: 'usr-1',
        setterName: 'Alex Rivera',
        updatedAt: '2026-08-26T14:20:00Z'
      },
      {
        id: 'flg-2',
        name: 'review',
        status: '?',
        requesteeId: 'usr-1',
        requesteeName: 'Alex Rivera',
        setterId: 'usr-2',
        setterName: 'Elena Rostova',
        updatedAt: '2026-08-27T08:15:00Z'
      }
    ],
    tags: ['cve-candidate', 'zero-day', 'quic', 'network-crash'],
    isSecuritySensitive: true,
    estimatedHours: 16,
    remainingHours: 4,
    workLogs: [
      {
        id: 'wl-1',
        userId: 'usr-2',
        userName: 'Elena Rostova',
        hoursSpent: 8,
        comment: 'Isolated minimal reproduction script and confirmed heap corruption trace.',
        loggedAt: '2026-08-26T18:00:00Z'
      },
      {
        id: 'wl-2',
        userId: 'usr-2',
        userName: 'Elena Rostova',
        hoursSpent: 4,
        comment: 'Drafted state validation patch in quic_session.cc. Uploaded patch diff for review.',
        loggedAt: '2026-08-27T08:10:00Z'
      }
    ],
    attachments: [
      {
        id: 'att-1',
        fileName: 'patch-quic-state-guard.diff',
        fileSize: 1420,
        contentType: 'text/x-diff',
        description: 'Guard against unexpected CRYPTO frames during invalid connection states',
        isPatch: true,
        patchContent: SAMPLE_DIFF_1,
        uploaderId: 'usr-2',
        uploaderName: 'Elena Rostova',
        uploadedAt: '2026-08-27T08:12:00Z'
      },
      {
        id: 'att-2',
        fileName: 'gdb_asan_crash_log.txt',
        fileSize: 45200,
        contentType: 'text/plain',
        description: 'AddressSanitizer stack trace on heap corruption',
        isPatch: false,
        uploaderId: 'usr-2',
        uploaderName: 'Elena Rostova',
        uploadedAt: '2026-08-26T14:30:00Z'
      }
    ],
    comments: [
      {
        id: 'c-1',
        authorId: 'usr-2',
        authorName: 'Elena Rostova',
        text: 'Discovered this during automated fuzzing on QUIC draft-34 regression suites. Marking as security sensitive immediately.',
        createdAt: '2026-08-26T14:22:00Z'
      },
      {
        id: 'c-2',
        authorId: 'usr-1',
        authorName: 'Alex Rivera',
        text: 'Great catch Elena. We must backport this to v128.1 before shipping. Requesting QA team verify under ASAN build.',
        createdAt: '2026-08-26T16:45:00Z'
      }
    ],
    gitLinkage: {
      branch: 'sec/fix-quic-handshake-overflow',
      pullRequestUrl: 'https://github.com/omnibug/quantum/pull/1892',
      ciStatus: 'running'
    },
    createdAt: '2026-08-26T14:15:00Z',
    updatedAt: '2026-08-27T08:15:00Z'
  },
  {
    id: 'bug-1002',
    bugNumber: 1002,
    title: 'CSS Grid Track auto-fit calculates 0 width with fractional units inside subgrid',
    description: 'When nesting a `grid-template-columns: subgrid` container with child tracks defined using `1fr`, the solver divides by zero when total fr weight is uncalculated during initial reflow. Leads to layout jitter and invisible element bounding boxes.',
    productId: 'prod-1',
    productName: 'Quantum Web Platform',
    componentId: 'comp-101',
    componentName: 'Layout & CSS Engine',
    version: '129.0',
    targetMilestone: 'v129.0-release',
    status: 'IN_PROGRESS',
    resolution: null,
    severity: 'major',
    priority: 'P2',
    reporterId: 'usr-5',
    reporterName: 'David Kim (Frontend Specialist)',
    assigneeId: 'usr-3',
    assigneeName: 'Marcus Chen (Core Engine Dev)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-1', 'usr-5'],
    watchers: ['usr-3', 'usr-5'],
    votes: 8,
    votedUserIds: ['usr-5', 'usr-4'],
    dependsOn: [],
    blocks: ['bug-1003'],
    seeAlso: [],
    flags: [
      {
        id: 'flg-3',
        name: 'needinfo',
        status: '+',
        requesteeId: 'usr-5',
        requesteeName: 'David Kim',
        setterId: 'usr-3',
        setterName: 'Marcus Chen',
        updatedAt: '2026-08-26T11:00:00Z'
      }
    ],
    tags: ['css-grid', 'subgrid', 'layout-engine', 'reflow'],
    isSecuritySensitive: false,
    estimatedHours: 8,
    remainingHours: 2,
    workLogs: [
      {
        id: 'wl-3',
        userId: 'usr-3',
        userName: 'Marcus Chen',
        hoursSpent: 6,
        comment: 'Added fallback guard for totalFr <= 0 and created unit tests.',
        loggedAt: '2026-08-26T17:30:00Z'
      }
    ],
    attachments: [
      {
        id: 'att-3',
        fileName: 'fix-subgrid-zero-fr.patch',
        fileSize: 850,
        contentType: 'text/x-diff',
        description: 'Prevent division by zero in CSSGridSolver track fraction calculation',
        isPatch: true,
        patchContent: SAMPLE_DIFF_2,
        uploaderId: 'usr-3',
        uploaderName: 'Marcus Chen',
        uploadedAt: '2026-08-26T17:20:00Z'
      }
    ],
    comments: [
      {
        id: 'c-3',
        authorId: 'usr-5',
        authorName: 'David Kim',
        text: 'Reproducible on CodePen example: https://codepen.io/dev/pen/grid-test-subgrid',
        createdAt: '2026-08-25T10:15:00Z'
      }
    ],
    gitLinkage: {
      commitHash: '8f7a12e9b04c',
      commitMessage: 'fix(layout): guard against zero fr weight in subgrid track resolution',
      branch: 'marcus/fix-subgrid-fr',
      ciStatus: 'success'
    },
    createdAt: '2026-08-25T09:40:00Z',
    updatedAt: '2026-08-26T17:30:00Z'
  },
  {
    id: 'bug-1003',
    bugNumber: 1003,
    title: 'Monaco Editor minimap flickering during rapid multi-cursor editing',
    description: 'Canvas redraw loop in Orion Studio gets desynchronized when more than 10 cursors are simultaneously typing, causing frame drops down to 14 FPS.',
    productId: 'prod-3',
    productName: 'Orion Developer Studio',
    componentId: 'comp-301',
    componentName: 'Editor UI & Canvas',
    version: '2026.3',
    targetMilestone: '2026.3.2-Hotfix',
    status: 'NEW',
    resolution: null,
    severity: 'normal',
    priority: 'P3',
    reporterId: 'usr-5',
    reporterName: 'David Kim (Frontend Specialist)',
    assigneeId: 'usr-5',
    assigneeName: 'David Kim (Frontend Specialist)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-1'],
    watchers: ['usr-5'],
    votes: 3,
    votedUserIds: ['usr-5'],
    dependsOn: ['bug-1002'],
    blocks: [],
    seeAlso: [],
    flags: [],
    tags: ['ui', 'canvas', 'performance', 'minimap'],
    isSecuritySensitive: false,
    estimatedHours: 6,
    remainingHours: 6,
    workLogs: [],
    attachments: [],
    comments: [],
    createdAt: '2026-08-26T16:00:00Z',
    updatedAt: '2026-08-26T16:00:00Z'
  },
  {
    id: 'bug-1004',
    bugNumber: 1004,
    title: 'Release Tracker: Quantum Platform v128.1 Security & Stability Point Release',
    description: 'Meta tracking bug for the upcoming v128.1 emergency point release. Blocks release deployment until all dependent security and blocker vulnerabilities are signed off by QA.',
    productId: 'prod-1',
    productName: 'Quantum Web Platform',
    componentId: 'comp-104',
    componentName: 'Security Sandbox',
    version: '128.0',
    targetMilestone: 'v128.1-security-patch',
    status: 'IN_PROGRESS',
    resolution: null,
    severity: 'blocker',
    priority: 'P1',
    reporterId: 'usr-1',
    reporterName: 'Alex Rivera (Lead Architect)',
    assigneeId: 'usr-1',
    assigneeName: 'Alex Rivera (Lead Architect)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-2', 'usr-3', 'usr-4', 'usr-6'],
    watchers: ['usr-1', 'usr-2', 'usr-4', 'usr-6'],
    votes: 21,
    votedUserIds: ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6'],
    dependsOn: ['bug-1001', 'bug-1005'],
    blocks: [],
    seeAlso: [],
    flags: [
      {
        id: 'flg-4',
        name: 'release-blocker',
        status: '+',
        requesteeId: 'usr-1',
        requesteeName: 'Alex Rivera',
        setterId: 'usr-6',
        setterName: 'Triage Admin',
        updatedAt: '2026-08-26T15:00:00Z'
      }
    ],
    tags: ['meta-tracker', 'release-blocker', 'point-release'],
    isSecuritySensitive: false,
    estimatedHours: 40,
    remainingHours: 12,
    workLogs: [
      {
        id: 'wl-4',
        userId: 'usr-1',
        userName: 'Alex Rivera',
        hoursSpent: 12,
        comment: 'Audited changelog and release branch cherry-picks.',
        loggedAt: '2026-08-26T19:00:00Z'
      }
    ],
    attachments: [],
    comments: [
      {
        id: 'c-4',
        authorId: 'usr-4',
        authorName: 'Sarah Jenkins',
        text: 'Automated test matrices running across Windows x64, Linux ARM64, and macOS Sonoma.',
        createdAt: '2026-08-26T18:30:00Z'
      }
    ],
    createdAt: '2026-08-26T14:00:00Z',
    updatedAt: '2026-08-27T09:00:00Z'
  },
  {
    id: 'bug-1005',
    bugNumber: 1005,
    title: 'WASM JIT invalid bytecode offset validation allows out-of-bounds array write',
    description: 'During optimizing compilation of SIMD i32x4 instructions in WebAssembly, index bounds check elimination mistakenly assumes positive signed integers for unsigned table offsets.',
    productId: 'prod-1',
    productName: 'Quantum Web Platform',
    componentId: 'comp-102',
    componentName: 'JavaScript & WASM JIT',
    version: '128.0',
    targetMilestone: 'v128.1-security-patch',
    status: 'RESOLVED',
    resolution: 'FIXED',
    severity: 'critical',
    priority: 'P1',
    reporterId: 'usr-2',
    reporterName: 'Elena Rostova (Security Engineer)',
    assigneeId: 'usr-1',
    assigneeName: 'Alex Rivera (Lead Architect)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-2', 'usr-3'],
    watchers: ['usr-1', 'usr-2'],
    votes: 18,
    votedUserIds: ['usr-1', 'usr-2', 'usr-3'],
    dependsOn: [],
    blocks: ['bug-1004'],
    seeAlso: ['CVE-2026-44015'],
    flags: [
      {
        id: 'flg-5',
        name: 'qa-verify',
        status: '+',
        requesteeId: 'usr-4',
        requesteeName: 'Sarah Jenkins',
        setterId: 'usr-1',
        setterName: 'Alex Rivera',
        updatedAt: '2026-08-26T22:00:00Z'
      }
    ],
    tags: ['security', 'wasm', 'jit', 'cve'],
    isSecuritySensitive: true,
    estimatedHours: 12,
    remainingHours: 0,
    workLogs: [
      {
        id: 'wl-5',
        userId: 'usr-1',
        userName: 'Alex Rivera',
        hoursSpent: 12,
        comment: 'Fixed SIMD offset bounds checks in JIT compiler. Verified fuzz test passes with 0 failures.',
        loggedAt: '2026-08-26T21:45:00Z'
      }
    ],
    attachments: [],
    comments: [
      {
        id: 'c-5',
        authorId: 'usr-1',
        authorName: 'Alex Rivera',
        text: 'Fix landed on release branch: commit 4d901a1c. Marking as RESOLVED FIXED.',
        createdAt: '2026-08-26T21:50:00Z'
      },
      {
        id: 'c-6',
        authorId: 'usr-4',
        authorName: 'Sarah Jenkins',
        text: 'Verified under WASM test suite version 2.4. Green test run.',
        createdAt: '2026-08-26T22:05:00Z'
      }
    ],
    gitLinkage: {
      commitHash: '4d901a1cf823',
      commitMessage: 'fix(wasm-jit): enforce unsigned bounds check on SIMD table offsets',
      branch: 'release/v128.1',
      ciStatus: 'success'
    },
    createdAt: '2026-08-25T11:00:00Z',
    updatedAt: '2026-08-26T22:05:00Z',
    closedAt: '2026-08-26T22:05:00Z'
  },
  {
    id: 'bug-1006',
    bugNumber: 1006,
    title: 'Redis connection timeout in API Gateway under heavy TLS renegotiation traffic',
    description: 'Under 10k req/s traffic spikes with persistent keep-alive connections, the Redis cache client thread pool starves socket descriptors due to unclosed TCP handles on upstream gateway disconnect.',
    productId: 'prod-2',
    productName: 'Aether Cloud Infrastructure',
    componentId: 'comp-201',
    componentName: 'API Gateway & Routing',
    version: '4.2.0',
    targetMilestone: 'Sprint-42-Reliability',
    status: 'UNCONFIRMED',
    resolution: null,
    severity: 'major',
    priority: 'P2',
    reporterId: 'usr-6',
    reporterName: 'Triage Admin',
    assigneeId: 'usr-1',
    assigneeName: 'Alex Rivera (Lead Architect)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-1', 'usr-3'],
    watchers: ['usr-6'],
    votes: 5,
    votedUserIds: ['usr-6', 'usr-2'],
    dependsOn: [],
    blocks: [],
    seeAlso: [],
    flags: [
      {
        id: 'flg-6',
        name: 'needinfo',
        status: '?',
        requesteeId: 'usr-1',
        requesteeName: 'Alex Rivera',
        setterId: 'usr-6',
        setterName: 'Triage Admin',
        updatedAt: '2026-08-27T07:30:00Z'
      }
    ],
    tags: ['api-gateway', 'redis', 'high-traffic', 'sockets'],
    isSecuritySensitive: false,
    estimatedHours: 10,
    remainingHours: 10,
    workLogs: [],
    attachments: [],
    comments: [
      {
        id: 'c-7',
        authorId: 'usr-6',
        authorName: 'Triage Admin',
        text: 'Reported by production telemetry alert #AETHER-PROD-998. Needs developer triage.',
        createdAt: '2026-08-27T07:30:00Z'
      }
    ],
    createdAt: '2026-08-27T07:25:00Z',
    updatedAt: '2026-08-27T07:30:00Z'
  },
  {
    id: 'bug-1007',
    bugNumber: 1007,
    title: 'Duplicate QUIC session crashes during 0-RTT handshakes on TLS 1.3',
    description: 'We saw random crashes in quic_session during rapid re-connections when using early data.',
    productId: 'prod-1',
    productName: 'Quantum Web Platform',
    componentId: 'comp-103',
    componentName: 'Networking & HTTP/3',
    version: '128.0',
    targetMilestone: 'v128.1-security-patch',
    status: 'RESOLVED',
    resolution: 'DUPLICATE',
    duplicateOfBugId: 'bug-1001',
    severity: 'major',
    priority: 'P2',
    reporterId: 'usr-3',
    reporterName: 'Marcus Chen (Core Engine Dev)',
    assigneeId: 'usr-2',
    assigneeName: 'Elena Rostova (Security Engineer)',
    qaContactId: 'usr-4',
    qaContactName: 'Sarah Jenkins (QA Lead)',
    ccList: ['usr-2', 'usr-3'],
    watchers: ['usr-3'],
    votes: 1,
    votedUserIds: ['usr-3'],
    dependsOn: [],
    blocks: [],
    seeAlso: [],
    flags: [],
    tags: ['quic', 'duplicate'],
    isSecuritySensitive: true,
    estimatedHours: 0,
    remainingHours: 0,
    workLogs: [],
    attachments: [],
    comments: [
      {
        id: 'c-8',
        authorId: 'usr-2',
        authorName: 'Elena Rostova',
        text: '*** This bug has been marked as a duplicate of bug 1001 ***',
        createdAt: '2026-08-26T15:10:00Z'
      }
    ],
    createdAt: '2026-08-26T14:50:00Z',
    updatedAt: '2026-08-26T15:10:00Z',
    closedAt: '2026-08-26T15:10:00Z'
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    bugId: 'bug-1001',
    actorId: 'usr-2',
    actorName: 'Elena Rostova',
    timestamp: '2026-08-26T14:15:00Z',
    changes: [
      { field: 'status', oldValue: null, newValue: 'NEW' },
      { field: 'severity', oldValue: null, newValue: 'blocker' },
      { field: 'priority', oldValue: null, newValue: 'P1' }
    ]
  },
  {
    id: 'aud-2',
    bugId: 'bug-1001',
    actorId: 'usr-1',
    actorName: 'Alex Rivera',
    timestamp: '2026-08-26T14:20:00Z',
    changes: [
      { field: 'flags', oldValue: [], newValue: ['security-audit?'] },
      { field: 'targetMilestone', oldValue: null, newValue: 'v128.1-security-patch' }
    ]
  },
  {
    id: 'aud-3',
    bugId: 'bug-1001',
    actorId: 'usr-2',
    actorName: 'Elena Rostova',
    timestamp: '2026-08-27T08:15:00Z',
    changes: [
      { field: 'status', oldValue: 'NEW', newValue: 'IN_REVIEW' },
      { field: 'attachments', oldValue: 1, newValue: 2 },
      { field: 'flags', oldValue: ['security-audit+'], newValue: ['security-audit+', 'review?'] }
    ]
  }
];
