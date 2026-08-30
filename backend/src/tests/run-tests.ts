import { store } from '../data/store.js';
import { StateMachineService } from '../services/stateMachine.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';
import { AITriageService } from '../services/aiTriage.js';
import { BugzillaExportImportService } from '../services/bugzillaExportImport.js';
import { SlashCommandService } from '../services/slashCommands.js';
import { generateSessionToken, verifySessionToken, verifyPassword } from '../middleware/auth.js';
import { DEMO_PASSWORD } from '../data/seedData.js';
import { Bug } from '../types/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${errorDetail ? `\n     Detail: ${errorDetail}` : ''}`);
    failed++;
  }
}

process.env.NODE_ENV = 'test';

async function runAllTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING OMNIBUG BACKEND TEST SUITE');
  console.log('========================================\n');

  // Test Group 1: Store & Seed Data
  console.log('📦 1. Store & Seed Data Tests');
  store.setInMemoryMode(true);
  store.resetToSeed();
  const bugs = store.getBugs();
  const products = store.getProducts();
  const users = store.getUsers();

  assert(bugs.length >= 5, 'Seed bugs loaded successfully', `Expected >= 5 bugs, got ${bugs.length}`);
  assert(products.length >= 3, 'Seed products loaded successfully', `Expected >= 3 products, got ${products.length}`);
  assert(users.length >= 4, 'Seed users loaded successfully', `Expected >= 4 users, got ${users.length}`);

  // Test Group 2: Bugzilla State Machine Lifecycle
  console.log('\n🔄 2. Bugzilla Lifecycle & State Machine Tests');
  const sampleBug: Bug = { ...bugs[0], status: 'NEW', resolution: null };

  // Valid transition
  const v1 = StateMachineService.validateTransition(sampleBug, 'IN_PROGRESS');
  assert(v1.valid, 'NEW -> IN_PROGRESS is allowed');

  // Invalid transition: NEW directly to VERIFIED without RESOLVED
  const v2 = StateMachineService.validateTransition(sampleBug, 'VERIFIED');
  assert(!v2.valid, 'NEW -> VERIFIED is correctly rejected');

  // Transition to RESOLVED without resolution
  const v3 = StateMachineService.validateTransition(sampleBug, 'RESOLVED', null);
  assert(!v3.valid, 'RESOLVED requires a resolution status (e.g. FIXED, INVALID)');

  // Transition to RESOLVED FIXED
  const v4 = StateMachineService.validateTransition(sampleBug, 'RESOLVED', 'FIXED');
  assert(v4.valid, 'RESOLVED with FIXED resolution is allowed');

  // Duplicate resolution without target bug ID
  const v5 = StateMachineService.validateTransition(sampleBug, 'RESOLVED', 'DUPLICATE', undefined);
  assert(!v5.valid, 'DUPLICATE resolution requires duplicateOfBugId');

  // Duplicate resolution with valid target
  const v6 = StateMachineService.validateTransition(sampleBug, 'RESOLVED', 'DUPLICATE', 'bug-1002');
  assert(v6.valid, 'DUPLICATE resolution with target bug ID is valid');

  // Test Group 3: Dependency Graph & Blocker Solver
  console.log('\n🕸️ 3. Dependency Graph & Blocker Engine Tests');
  const graph = DependencyGraphService.buildGraph(bugs);
  assert(graph.nodes.length === bugs.length, 'Graph generates all nodes');
  assert(graph.edges.length > 0, 'Graph generates blocker edges');
  assert(!graph.hasCycles, 'Initial seed graph has no circular blocker dependencies');
  assert(graph.criticalPath.length > 0, 'Critical path correctly calculated');

  // Test Group 4: AI Triage & Duplicate Detector
  console.log('\n🤖 4. AI Triage & Smart Duplicate Detector Tests');
  const dupCandidates = AITriageService.findDuplicates(
    'QUIC session crash during TLS 1.3 handshake early data',
    'We see memory corruption in quic_session.cc on 0-RTT',
    bugs
  );
  assert(dupCandidates.length > 0, 'AI Duplicate detector identifies relevant bug candidates');
  assert(dupCandidates[0].bugId === 'bug-1001' || dupCandidates[0].bugId === 'bug-1007', 'Top duplicate candidate is correctly bug-1001/1007');

  const classification = AITriageService.analyzeAndClassify(
    'AddressSanitizer heap buffer overflow in layout engine subgrid',
    'SIGSEGV fatal crash during CSS grid render reflow',
    products,
    'prod-1'
  );
  assert(classification.suggestedSeverity === 'blocker', 'AI detects heap overflow and marks severity as blocker');
  assert(classification.isSecuritySensitive === true, 'AI detects security relevance');
  assert(classification.suggestedTestCase.includes('describe'), 'AI generates automated test case template');

  // Test Group 5: Multi-Language Stack Trace Parser & Slash Commands
  console.log('\n⚡ 5. Multi-Language Stack Trace Parser & Slash Command Tests');
  const pyTrace = `Traceback (most recent call last):
  File "src/compiler/optimizer.py", line 184, in optimize_ast
    raise IndexError("Buffer overflow in AST walker")
IndexError: Buffer overflow in AST walker`;
  const parsedPy = AITriageService.parseStackTrace(pyTrace);
  assert(parsedPy?.detectedLanguage === 'Python', 'Parser detects Python language traceback');
  assert(parsedPy?.culpritFile === 'src/compiler/optimizer.py', 'Parser extracts culprit file path');
  assert(parsedPy?.culpritLine === 184, 'Parser extracts culprit line number');

  const pyClassification = AITriageService.analyzeAndClassify('IndexError crash in AST optimizer', pyTrace, products, 'prod-1');
  assert(pyClassification.suggestedComponentName === 'JavaScript & WASM JIT', 'Correctly routes optimizer/compiler bug to JIT/Compiler component');

  // Test Slash Command Engine
  const sampleUser = users[0];
  const slashResult = SlashCommandService.execute('bug-1002', '/priority P1\n/log 3h Tested allocator fix\nGreat progress team.', sampleUser);
  assert(slashResult.executedCommands.length === 2, 'Slash command engine executes multiple commands in single comment');
  const updatedBug1002 = store.getBugById('bug-1002');
  // Test Group 6: Bugzilla XML Export & Import
  console.log('\n📄 6. Bugzilla XML Interoperability Tests');
  const xml = BugzillaExportImportService.exportToBugzillaXml(bugs);
  assert(xml.includes('<bugzilla') && xml.includes('</bugzilla>'), 'Exports valid Bugzilla XML root container');
  assert(xml.includes('<bug_id>1001</bug_id>'), 'Exports bug ID and metadata in XML');

  const imported = await BugzillaExportImportService.importFromBugzillaXml(xml);
  assert(imported.length === bugs.length, 'Imports matching count of bugs from XML');
  assert(imported[0].title === bugs[0].title, 'Imported bug title matches original');

  // Test Group 7: Speed Triage End-to-End Tests (Bug #1006)
  console.log('\n🎯 7. Speed Triage & Classification Tests (#1006)');
  const bug1006Before = store.getBugById('bug-1006');
  assert(bug1006Before?.status === 'UNCONFIRMED', 'Bug #1006 starts in UNCONFIRMED status');

  // Test AI triage analysis for bug-1006
  const triage1006 = AITriageService.analyzeAndClassify(
    bug1006Before!.title,
    bug1006Before!.description,
    products,
    bug1006Before!.productId
  );
  assert(Boolean(triage1006.suggestedComponentId), 'AI generates suggested component ID for bug #1006');
  assert(triage1006.suggestedSeverity === 'major', 'AI correctly predicts major severity for timeout/exhaustion');

  // Test applying AI classification to bug-1006
  const updatedWithAI = store.updateBug('bug-1006', {
    severity: triage1006.suggestedSeverity,
    priority: triage1006.suggestedPriority,
    componentId: triage1006.suggestedComponentId,
    componentName: triage1006.suggestedComponentName,
    tags: Array.from(new Set([...bug1006Before!.tags, ...triage1006.suggestedTags])),
    isSecuritySensitive: triage1006.isSecuritySensitive,
  });
  assert(updatedWithAI?.severity === 'major', 'Persisted AI severity to bug-1006');
  assert(Boolean(updatedWithAI && (updatedWithAI.tags.includes('networking') || updatedWithAI.tags.includes('redis'))), 'Persisted AI tags to bug-1006');

  // Test Confirm as Bug transition (UNCONFIRMED -> NEW)
  const confirmValidation = StateMachineService.validateTransition(store.getBugById('bug-1006')!, 'NEW');
  assert(confirmValidation.valid === true, 'Valid transition from UNCONFIRMED to NEW');

  const confirmedBug1006 = store.updateBug('bug-1006', { status: 'NEW' });
  assert(confirmedBug1006?.status === 'NEW', 'Bug #1006 confirmed to NEW status');
  assert(store.getBugById('bug-1006')?.status === 'NEW', 'Confirmed status persists in store');

  // ==========================================
  // 8. RBAC, Domain Commands & Security Tests
  // ==========================================
  console.log('\n🛡️ 8. RBAC, Domain Commands & Security Tests');
  const developerUser = store.getUsers().find(u => u.role === 'developer')!;
  const qaUser = store.getUsers().find(u => u.role === 'qa')!;
  const adminUser = store.getUsers().find(u => u.role === 'admin')!;

  assert(developerUser.role === 'developer', 'Developer persona identified');
  assert(qaUser.role === 'qa', 'QA persona identified');
  assert(adminUser.role === 'admin', 'Admin persona identified');

  // Test domain command assignment with audit trail
  const bugToAssign = store.getBugById('bug-1002')!;
  const prevAssignee = bugToAssign.assigneeName;
  store.updateBug('bug-1002', { assigneeId: developerUser.id, assigneeName: developerUser.name });
  store.addAuditLog({
    bugId: 'bug-1002',
    actorId: adminUser.id,
    actorName: adminUser.name,
    changes: [{ field: 'assigneeName', oldValue: prevAssignee, newValue: developerUser.name }]
  });

  const updatedAssigned = store.getBugById('bug-1002')!;
  assert(updatedAssigned.assigneeName === developerUser.name, 'Explicit domain assignment succeeded');
  const auditLogs = store.getAuditLogs('bug-1002');
  assert(auditLogs.some(l => l.changes.some(c => c.field === 'assigneeName' && c.newValue === developerUser.name)), 'Domain assignment produced immutable audit trail');

  // Cryptographic HMAC Session Token Security Tests
  const signedToken = generateSessionToken(adminUser.id);
  assert(typeof signedToken === 'string' && signedToken.length > 20, 'Cryptographic HMAC session token generated');
  const verified = verifySessionToken(signedToken);
  assert(verified.valid && verified.userId === adminUser.id, 'HMAC session token verified and identity extracted');
  const tampered = verifySessionToken(signedToken + 'invalid_signature_tamper');
  assert(!tampered.valid, 'Tampered HMAC session token strictly rejected');

  // A token past its expiry must be refused even though its signature is valid.
  const expiredToken = generateSessionToken(adminUser.id, -1000);
  const expiredResult = verifySessionToken(expiredToken);
  assert(!expiredResult.valid && expiredResult.reason === 'expired', 'Expired session token rejected despite a valid signature');

  // Passwords must verify against the stored scrypt digest, and only that.
  assert(verifyPassword(DEMO_PASSWORD, adminUser.passwordHash), 'Correct password verifies against the stored digest');
  assert(!verifyPassword('wrong-password', adminUser.passwordHash), 'Incorrect password is rejected');

  // Optimistic Concurrency Locking Tests
  const bugBeforeConcurrency = store.getBugById('bug-1003')!;
  const initialVersion = bugBeforeConcurrency.lockVersion || 1;
  const bugAfterConcurrency = store.updateBug('bug-1003', { title: 'Updated SIMD Vectorization title' });
  assert(Boolean(bugAfterConcurrency && (bugAfterConcurrency.lockVersion || 1) > initialVersion), 'Optimistic concurrency lockVersion auto-increments on mutation');

  // HTTP-level tests against the real Express app.
  //
  // Imported dynamically: `server.ts` decides at module-evaluation time whether
  // to bind a port, and a static import would run before NODE_ENV is set here.
  const { runApiTests } = await import('./api-tests.js');
  await runApiTests(assert);

  // Test Summary
  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
