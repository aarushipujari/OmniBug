import { store } from '../data/store.js';
import { StateMachineService } from '../services/stateMachine.js';
import { DependencyGraphService } from '../services/dependencyGraph.js';
import { AITriageService } from '../services/aiTriage.js';
import { BugzillaExportImportService } from '../services/bugzillaExportImport.js';
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

async function runAllTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING OMNIBUG BACKEND TEST SUITE');
  console.log('========================================\n');

  // Test Group 1: Store & Seed Data
  console.log('📦 1. Store & Seed Data Tests');
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

  // Test Group 5: Bugzilla XML Export & Import
  console.log('\n📄 5. Bugzilla XML Interoperability Tests');
  const xml = BugzillaExportImportService.exportToBugzillaXml(bugs);
  assert(xml.includes('<bugzilla') && xml.includes('</bugzilla>'), 'Exports valid Bugzilla XML root container');
  assert(xml.includes('<bug_id>1001</bug_id>'), 'Exports bug ID and metadata in XML');

  const imported = await BugzillaExportImportService.importFromBugzillaXml(xml);
  assert(imported.length === bugs.length, 'Imports matching count of bugs from XML');
  assert(imported[0].title === bugs[0].title, 'Imported bug title matches original');

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
