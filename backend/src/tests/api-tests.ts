import type { Server } from 'http';
import app from '../server.js';
import { store } from '../data/store.js';
import { DEMO_PASSWORD } from '../data/seedData.js';
import { runReproductionTest } from '../services/testSandbox.js';

/**
 * HTTP-level tests.
 *
 * The existing suite calls service functions directly, so the entire Express
 * layer — routing, authentication, role guards, request validation and the
 * controllers — was never executed by a test. That is precisely where the two
 * most serious defects lived: any caller could assume any identity by setting a
 * header, and `PATCH /bugs/:id` applied whatever fields the body contained,
 * including the primary key.
 *
 * These exercise the real server through real requests.
 */

export interface ApiTestResult {
  passed: number;
  failed: number;
}

export async function runApiTests(
  assert: (condition: boolean, name: string, detail?: string) => void
): Promise<void> {
  process.env.NODE_ENV = 'test';
  store.setInMemoryMode(true);
  store.resetToSeed();

  const server: Server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api`;

  const call = async (
    path: string,
    options: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {}
  ) => {
    const { method = 'GET', body, token, headers = {} } = options;
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      /* non-JSON response */
    }
    return { status: res.status, json };
  };

  const login = async (email: string) => {
    const res = await call('/auth/login', { method: 'POST', body: { email, password: DEMO_PASSWORD } });
    return res.json.token as string | undefined;
  };

  try {
    console.log('\n🌐 9. HTTP API — Authentication');

    // --- The bypasses that previously granted full access ------------------
    const anonPatch = await call('/bugs/bug-1004', { method: 'PATCH', body: { priority: 'P1' } });
    assert(anonPatch.status === 401, 'Anonymous mutation is rejected', `got ${anonPatch.status}`);

    const headerSpoof = await call('/store/reset', { method: 'POST', headers: { 'X-User-Id': 'usr-6' } });
    assert(headerSpoof.status === 401, 'X-User-Id header grants no identity', `got ${headerSpoof.status}`);

    const bodySpoof = await call('/bugs/bug-1004', {
      method: 'PATCH',
      body: { priority: 'P1', _currentUser: { id: 'usr-6', role: 'admin' } },
    });
    assert(bodySpoof.status === 401, '_currentUser in the body grants no identity', `got ${bodySpoof.status}`);

    const mintToken = await call('/auth/token', { method: 'POST', body: { userId: 'usr-6' } });
    assert(mintToken.status === 404, 'Credential-free token endpoint no longer exists', `got ${mintToken.status}`);

    // --- Real credentials ---------------------------------------------------
    const badPassword = await call('/auth/login', {
      method: 'POST',
      body: { email: 'alex.rivera@omnibug.dev', password: 'not-the-password' },
    });
    assert(badPassword.status === 401, 'Wrong password is rejected');

    const unknownUser = await call('/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.com', password: DEMO_PASSWORD },
    });
    assert(unknownUser.status === 401, 'Unknown account is rejected');

    const maintainerToken = await login('alex.rivera@omnibug.dev');
    assert(typeof maintainerToken === 'string' && maintainerToken.length > 20, 'Correct password returns a session token');

    const me = await call('/auth/me', { token: maintainerToken });
    assert(me.status === 200, 'Valid token authenticates');
    const meUser = me.json.data as Record<string, unknown>;
    assert(!('passwordHash' in meUser), 'Password hash is never serialised to a client');

    const badToken = await call('/auth/me', { token: 'not-a-real-token' });
    assert(badToken.status === 401, 'Forged token is rejected');

    console.log('\n🔒 10. HTTP API — Authorisation');

    const developerToken = await login('marcus.chen@omnibug.dev');
    const devReset = await call('/store/reset', { method: 'POST', token: developerToken });
    assert(devReset.status === 403, 'Developer cannot reset the store', `got ${devReset.status}`);

    const maintainerReset = await call('/store/reset', { method: 'POST', token: maintainerToken });
    assert(maintainerReset.status === 200, 'Maintainer can reset the store', `got ${maintainerReset.status}`);

    const devSecurity = await call('/bugs/bug-1004/set-security', {
      method: 'POST',
      token: developerToken,
      body: { isSecuritySensitive: true },
    });
    assert(devSecurity.status === 403, 'Security override requires the capability, not a matching name');

    console.log('\n🛡️ 11. HTTP API — Request validation');

    // --- Mass assignment ----------------------------------------------------
    const hijack = await call('/bugs/bug-1004', {
      method: 'PATCH',
      token: maintainerToken,
      body: { id: 'hijacked', bugNumber: 99999, isAdmin: true, votes: -500 },
    });
    assert(hijack.status === 400, 'Update with no permitted fields is rejected', `got ${hijack.status}`);

    const stillThere = await call('/bugs/bug-1004', { token: maintainerToken });
    assert(stillThere.status === 200, 'Identity fields cannot be rewritten by a client');
    const bug = stillThere.json.data as Record<string, unknown>;
    assert(bug.id === 'bug-1004' && bug.bugNumber === 1004, 'Primary key and bug number are unchanged');
    assert(!('isAdmin' in bug), 'Arbitrary properties are not grafted onto a record');

    // --- Field validation on the update path --------------------------------
    const badSeverity = await call('/bugs/bug-1004', {
      method: 'PATCH',
      token: maintainerToken,
      body: { severity: 'NOT_A_SEVERITY' },
    });
    assert(badSeverity.status === 400, 'Invalid severity is rejected on update, not just on create');

    const badTitle = await call('/bugs/bug-1004', { method: 'PATCH', token: maintainerToken, body: { title: 'ab' } });
    assert(badTitle.status === 400, 'Too-short title is rejected on update');

    const goodUpdate = await call('/bugs/bug-1004', {
      method: 'PATCH',
      token: maintainerToken,
      body: { priority: 'P1' },
    });
    assert(goodUpdate.status === 200, 'A permitted field updates normally', `got ${goodUpdate.status}`);

    console.log('\n🔁 12. HTTP API — Concurrency & graph integrity');

    const current = await call('/bugs/bug-1004', { token: maintainerToken });
    const version = (current.json.data as Record<string, unknown>).lockVersion as number;

    const stale = await call('/bugs/bug-1004', {
      method: 'PATCH',
      token: maintainerToken,
      body: { priority: 'P3', lockVersion: version - 1 },
    });
    assert(stale.status === 409, 'A write against a stale version is refused', `got ${stale.status}`);

    const fresh = await call('/bugs/bug-1004', {
      method: 'PATCH',
      token: maintainerToken,
      body: { priority: 'P3', lockVersion: version },
    });
    assert(fresh.status === 200, 'A write against the current version succeeds');

    const graph = await call('/graph');
    const graphData = graph.json.data as { nodes: Array<{ id: string }>; edges: Array<{ source: string; target: string }> };
    const ids = new Set(graphData.nodes.map(n => n.id));
    const dangling = graphData.edges.filter(e => !ids.has(e.source) || !ids.has(e.target));
    assert(dangling.length === 0, 'Dependency graph contains no dangling edges', `${dangling.length} dangling`);

    console.log('\n📋 13. HTTP API — Audit attribution');

    const beforeComment = await call('/bugs/bug-1002', { token: developerToken });
    assert(beforeComment.status === 200, 'Issue is readable');

    await call('/bugs/bug-1002/comments', {
      method: 'POST',
      token: developerToken,
      body: { text: 'Reproduced on the nightly build.' },
    });
    const after = await call('/bugs/bug-1002', { token: developerToken });
    const comments = (after.json.data as { comments: Array<{ authorName?: string; authorId?: string }> }).comments;
    const latest = comments[comments.length - 1];
    assert(
      Boolean(latest?.authorId === 'usr-3' || latest?.authorName?.includes('Marcus')),
      'Comment is attributed to the authenticated user, not a client-supplied one',
      `got ${latest?.authorName ?? latest?.authorId}`
    );

    console.log('\n🧪 14. Reproduction test sandbox');

    // The sandbox must actually execute — the previous implementation printed
    // fixed Jest output from a setTimeout without running anything.
    const passing = runReproductionTest(
      "describe('suite', () => { it('adds', () => { expect(1 + 1).toBe(2); }); });"
    );
    assert(passing.passed && passing.assertions.length === 1, 'A passing test reports one passing assertion');
    assert(passing.totalDurationMs > 0, 'Timings are measured, not hardcoded');

    const failing = runReproductionTest(
      "describe('suite', () => { it('is wrong', () => { expect(1).toBe(2); }); });"
    );
    assert(!failing.passed, 'A failing assertion is reported as a failure');
    assert(
      Boolean(failing.assertions[0]?.failureMessage?.includes('received 1')),
      'The failure message names the received value'
    );

    const broken = runReproductionTest('this is not valid javascript (');
    assert(!broken.passed && Boolean(broken.error), 'A snippet that will not parse fails cleanly rather than throwing');

    const escaped = runReproductionTest(
      "describe('s', () => { it('cannot reach the host', () => { expect(typeof process).toBe('undefined'); }); });"
    );
    assert(escaped.passed, 'The VM context exposes no process object to the snippet');

    const runaway = runReproductionTest('while (true) {}');
    assert(!runaway.passed && Boolean(runaway.error), 'A non-terminating snippet is interrupted by the timeout');

    // ...and end to end, through the endpoint, on a real traceback.
    const trace = [
      'Traceback (most recent call last):',
      '  File "src/compiler/optimizer.py", line 184, in fold_constants',
      '    node = stack.pop()',
      'IndexError: pop from empty list',
    ].join('\n');
    const anonRun = await call('/ai/run-test', { method: 'POST', body: { title: 'crash', description: trace } });
    assert(anonRun.status === 401, 'Running a test requires authentication', `got ${anonRun.status}`);

    const ran = await call('/ai/run-test', {
      method: 'POST',
      token: maintainerToken,
      body: { title: 'IndexError in constant folder', description: trace },
    });
    assert(ran.status === 200, 'Authenticated caller can run the synthesized test', `got ${ran.status}`);
    const runResult = (ran.json as { result: { passed: boolean; assertions: unknown[]; output: string } }).result;
    assert(runResult.passed, 'The synthesized test passes against the traceback it was generated from');
    assert(runResult.assertions.length >= 3, 'The generated suite contains several real assertions');
    assert(!runResult.output.includes('0.015 s'), 'Output is generated from the run, not a fixed string');

  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
