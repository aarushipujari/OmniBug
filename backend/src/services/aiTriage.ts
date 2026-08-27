import { Bug, Product, BugSeverity } from '../types/index.js';

export interface DuplicateCandidate {
  bugId: string;
  bugNumber: number;
  title: string;
  status: string;
  componentName: string;
  similarityScore: number; // 0.0 to 1.0
  reason: string;
}

export interface TriagePrediction {
  suggestedComponentId?: string;
  suggestedComponentName?: string;
  suggestedSeverity: BugSeverity;
  suggestedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  isSecuritySensitive: boolean;
  suggestedTags: string[];
  rootCauseAnalysis: string;
  suggestedFixSummary: string;
  suggestedTestCase: string;
}

export class AITriageService {
  private static tokenize(text: string): Set<string> {
    const cleaned = text
      .toLowerCase()
      .replace(/[^a-z0-9_.\-\/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    return new Set(cleaned);
  }

  private static computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  public static findDuplicates(title: string, description: string, existingBugs: Bug[]): DuplicateCandidate[] {
    const queryText = `${title} ${description}`;
    const queryTokens = this.tokenize(queryText);
    const candidates: DuplicateCandidate[] = [];

    for (const bug of existingBugs) {
      const bugText = `${bug.title} ${bug.description} ${bug.tags.join(' ')}`;
      const bugTokens = this.tokenize(bugText);
      const similarity = this.computeJaccardSimilarity(queryTokens, bugTokens);

      // Check title specific token overlap for extra boost
      const titleTokens = this.tokenize(title);
      const bugTitleTokens = this.tokenize(bug.title);
      const titleSim = this.computeJaccardSimilarity(titleTokens, bugTitleTokens);

      const combinedScore = Math.min(1.0, similarity * 0.5 + titleSim * 0.5);

      if (combinedScore >= 0.18) {
        let reason = 'Semantic title and description keyword overlap';
        if (titleSim > 0.4) {
          reason = 'Strong title phrasing match';
        } else if (bug.tags.some(t => queryText.toLowerCase().includes(t))) {
          reason = 'Shared technical subsystems and crash signature';
        }

        candidates.push({
          bugId: bug.id,
          bugNumber: bug.bugNumber,
          title: bug.title,
          status: bug.status,
          componentName: bug.componentName,
          similarityScore: Math.round(combinedScore * 100) / 100,
          reason,
        });
      }
    }

    // Sort descending by score
    return candidates.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
  }

  public static analyzeAndClassify(
    title: string,
    description: string,
    products: Product[],
    productId?: string
  ): TriagePrediction {
    const fullText = `${title} \n ${description}`.toLowerCase();
    
    // Security detection
    const isSecuritySensitive =
      /overflow|buffer|vulnerability|rce|injection|xss|cve|zero-day|exploit|sandbox escape|privilege escalation|tls 1.3/i.test(fullText);

    // Severity & Priority prediction
    let suggestedSeverity: BugSeverity = 'normal';
    let suggestedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' = 'P3';

    if (isSecuritySensitive || /crash|panic|sigsegv|deadlock|data loss|heap corruption|fatal|zero-day/i.test(fullText)) {
      suggestedSeverity = 'blocker';
      suggestedPriority = 'P1';
    } else if (/timeout|memory leak|regression|broken|exception|nullpointer|desync|500 internal/i.test(fullText)) {
      suggestedSeverity = 'major';
      suggestedPriority = 'P2';
    } else if (/typo|cosmetic|color|alignment|documentation|enhancement|feature request/i.test(fullText)) {
      suggestedSeverity = /enhancement|feature/i.test(fullText) ? 'enhancement' : 'minor';
      suggestedPriority = 'P4';
    }

    // Component detection
    let suggestedComponentId: string | undefined;
    let suggestedComponentName: string | undefined;

    const activeProduct = products.find(p => p.id === productId) || products[0];
    if (activeProduct) {
      for (const comp of activeProduct.components) {
        const compKeywords = `${comp.name} ${comp.description}`.toLowerCase().split(/\s+/);
        const matchCount = compKeywords.filter(k => k.length > 3 && fullText.includes(k)).length;
        if (matchCount > 0) {
          suggestedComponentId = comp.id;
          suggestedComponentName = comp.name;
          break;
        }
      }
      if (!suggestedComponentId && activeProduct.components.length > 0) {
        suggestedComponentId = activeProduct.components[0].id;
        suggestedComponentName = activeProduct.components[0].name;
      }
    }

    // Tag inference
    const tags: string[] = [];
    if (isSecuritySensitive) tags.push('security', 'cve-candidate');
    if (/layout|css|grid|flex|canvas|ui|render/i.test(fullText)) tags.push('ui-rendering');
    if (/quic|http|network|socket|tls|tcp/i.test(fullText)) tags.push('networking');
    if (/memory|leak|heap|asan/i.test(fullText)) tags.push('memory-leak');
    if (/wasm|jit|v8|compiler/i.test(fullText)) tags.push('compiler');

    // Root cause and fix synthesis
    const rootCauseAnalysis = isSecuritySensitive
      ? 'Potential memory boundary violation or invalid state transition in cryptographic / protocol handler.'
      : fullText.includes('timeout')
      ? 'Resource exhaustion or unreleased socket/connection pool handles causing thread starvation.'
      : 'Boundary check deficiency or unhandled edge condition during input normalization.';

    const suggestedFixSummary = isSecuritySensitive
      ? 'Introduce state guard assertions before state transition and validate buffer payload boundaries against packet length.'
      : 'Apply defensive null/empty bounds checking and ensure connection handles are cleanly closed in finally block.';

    const suggestedTestCase = `describe('Bug Reproduction Test (${title.slice(0, 30)}...)', () => {
  it('should handle boundary conditions and not throw or crash', async () => {
    // 1. Arrange test fixture
    const fixture = createTestEnvironment();
    
    // 2. Act: Trigger condition described in bug report
    const result = await fixture.executeWithBoundaryInput({
      reproducePayload: '${title.replace(/'/g, "\\'")}'
    });

    // 3. Assert: Verify state remains consistent and no fatal violation occurred
    expect(result.isSuccessful).toBe(true);
    expect(result.errorState).toBeUndefined();
  });
});`;

    return {
      suggestedComponentId,
      suggestedComponentName,
      suggestedSeverity,
      suggestedPriority,
      isSecuritySensitive,
      suggestedTags: tags,
      rootCauseAnalysis,
      suggestedFixSummary,
      suggestedTestCase,
    };
  }
}
