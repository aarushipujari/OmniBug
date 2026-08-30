import vm from 'vm';

/**
 * Executes a synthesized reproduction test and reports what actually happened.
 *
 * The button that ran this previously was a `setTimeout` that printed a fixed
 * string of Jest output — "2 passed", "0.015 s" — regardless of the test, the
 * bug, or whether anything ran at all. The test it displayed was not runnable
 * either: it called a `createTestEnvironment()` helper that exists nowhere.
 *
 * This runs the code. `node:vm` gives the snippet a fresh context containing
 * only the assertion shim below — no `require`, no `process`, no `fetch`, no
 * timers, and no reference to this module's scope — and `timeout` interrupts a
 * script that will not return. That stops a runaway snippet from blocking the
 * event loop or reaching the filesystem, but a VM context is not a hard
 * security boundary against a determined escape, so the endpoint is restricted
 * to authenticated callers and the only snippets it is asked to run are the
 * ones this server synthesized.
 */

const EXECUTION_TIMEOUT_MS = 1000;

export interface SandboxAssertion {
  name: string;
  passed: boolean;
  durationMs: number;
  failureMessage?: string;
}

export interface SandboxRunResult {
  passed: boolean;
  suiteName: string;
  assertions: SandboxAssertion[];
  totalDurationMs: number;
  error?: string;
  output: string;
}

class AssertionError extends Error {}

/** The assertion surface the synthesized tests are written against. */
function createExpect() {
  return (received: unknown) => ({
    toBe(expected: unknown) {
      if (!Object.is(received, expected)) {
        throw new AssertionError(`expected ${JSON.stringify(expected)}, received ${JSON.stringify(received)}`);
      }
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(received) !== JSON.stringify(expected)) {
        throw new AssertionError(`expected ${JSON.stringify(expected)}, received ${JSON.stringify(received)}`);
      }
    },
    toBeDefined() {
      if (received === undefined) throw new AssertionError('expected a value, received undefined');
    },
    toBeUndefined() {
      if (received !== undefined) throw new AssertionError(`expected undefined, received ${JSON.stringify(received)}`);
    },
    toBeTruthy() {
      if (!received) throw new AssertionError(`expected a truthy value, received ${JSON.stringify(received)}`);
    },
    toBeGreaterThan(expected: number) {
      if (typeof received !== 'number' || !(received > expected)) {
        throw new AssertionError(`expected ${JSON.stringify(received)} to be greater than ${expected}`);
      }
    },
    toContain(expected: unknown) {
      const ok =
        typeof received === 'string'
          ? received.includes(String(expected))
          : Array.isArray(received) && received.includes(expected);
      if (!ok) throw new AssertionError(`expected ${JSON.stringify(received)} to contain ${JSON.stringify(expected)}`);
    },
  });
}

function elapsed(from: bigint): number {
  return Number(process.hrtime.bigint() - from) / 1_000_000;
}

function formatOutput(suiteName: string, assertions: SandboxAssertion[], totalDurationMs: number): string {
  const failed = assertions.filter(a => !a.passed).length;
  const lines: string[] = [];
  lines.push(`${failed === 0 ? '✓ PASS' : '✗ FAIL'}  ${suiteName}`);
  for (const a of assertions) {
    lines.push(`  ${a.passed ? '✓' : '✗'} ${a.name} (${a.durationMs.toFixed(2)}ms)`);
    if (a.failureMessage) lines.push(`      ${a.failureMessage}`);
  }
  lines.push('');
  lines.push(`Tests:  ${assertions.length - failed} passed, ${failed} failed, ${assertions.length} total`);
  lines.push(`Time:   ${totalDurationMs.toFixed(2)} ms`);
  lines.push(`Executed in an isolated VM context with a ${EXECUTION_TIMEOUT_MS}ms interrupt.`);
  return lines.join('\n');
}

export function runReproductionTest(source: string, fixture: unknown = {}): SandboxRunResult {
  const assertions: SandboxAssertion[] = [];
  let suiteName = 'Reproduction test';

  const it = (name: string, fn: () => void) => {
    const started = process.hrtime.bigint();
    try {
      fn();
      assertions.push({ name, passed: true, durationMs: elapsed(started) });
    } catch (err) {
      assertions.push({
        name,
        passed: false,
        durationMs: elapsed(started),
        failureMessage: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const sandbox = {
    describe: (name: string, fn: () => void) => {
      suiteName = name;
      fn();
    },
    it,
    test: it,
    expect: createExpect(),
    // A frozen deep copy: the snippet cannot reach back into server state.
    fixture: JSON.parse(JSON.stringify(fixture ?? {})),
  };

  const startedAll = process.hrtime.bigint();
  try {
    vm.runInNewContext(source, vm.createContext(sandbox), {
      timeout: EXECUTION_TIMEOUT_MS,
      displayErrors: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      suiteName,
      assertions,
      totalDurationMs: Number(elapsed(startedAll).toFixed(3)),
      error: message,
      output: `✗ FAILED to execute\n  ${message}`,
    };
  }

  const totalDurationMs = Number(elapsed(startedAll).toFixed(3));
  const failed = assertions.filter(a => !a.passed);
  return {
    passed: assertions.length > 0 && failed.length === 0,
    suiteName,
    assertions,
    totalDurationMs,
    output: formatOutput(suiteName, assertions, totalDurationMs),
  };
}
