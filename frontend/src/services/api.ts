import {
  Bug,
  Product,
  User,
  GraphData,
  DuplicateCandidate,
  TriagePrediction,
  BugFlag,
  FlagStatus,
  AuditLogEntry,
  Comment,
  WorkLog,
} from '../types/index.js';

const API_BASE = '/api';
const TOKEN_KEY = 'omnibug.session.token';

/**
 * Every request goes through `request()` so the session token, JSON headers and
 * error handling exist in exactly one place.
 *
 * Previously each of the twenty-three call sites built its own `fetch`, and
 * identity was asserted by the client — an `X-Demo-Persona-Id` header and a
 * `_currentUser` object embedded in the request body. The server believed both,
 * so any caller could act as, and be recorded in the audit log as, anyone.
 * Identity now travels only as a bearer token the server issued.
 */

let inMemoryToken: string | null = null;

function readStoredToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    inMemoryToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the session
    // still works for as long as the tab lives.
    inMemoryToken = null;
  }
  return inMemoryToken;
}

export function setSessionToken(token: string | null) {
  inMemoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* non-fatal */
  }
}

export function getSessionToken(): string | null {
  return readStoredToken();
}

/** Raised when the server rejects the session, so the UI can return to sign-in. */
export class UnauthenticatedError extends Error {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

type Json = Record<string, unknown>;

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; raw?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, raw = false } = options;
  const token = readStoredToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    setSessionToken(null);
    throw new UnauthenticatedError();
  }

  if (raw) {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return (await res.text()) as unknown as T;
  }

  const json = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) {
    throw new Error((json.error as string) || `Request failed with status ${res.status}`);
  }
  return json as T;
}

export interface DemoAccount {
  email: string;
  name: string;
  role: User['role'];
}

/** Result of really executing the synthesized reproduction test on the server. */
export interface SandboxRunResult {
  passed: boolean;
  suiteName: string;
  assertions: Array<{ name: string; passed: boolean; durationMs: number; failureMessage?: string }>;
  totalDurationMs: number;
  error?: string;
  output: string;
}

export interface Capabilities {
  canResetStore: boolean;
  canImportXml: boolean;
  canVerifyBugs: boolean;
  canManageSecurity: boolean;
  canTriage: boolean;
}

export const api = {
  /* ---- Authentication -------------------------------------------------- */

  async login(email: string, password: string): Promise<{ token: string; user: User; capabilities: Capabilities }> {
    const json = await request<{ token: string; user: User; capabilities: Capabilities }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setSessionToken(json.token);
    return json;
  },

  logout() {
    setSessionToken(null);
  },

  async getDemoAccounts(): Promise<{ password: string; accounts: DemoAccount[] }> {
    return request('/auth/demo-accounts');
  },

  async getMe(): Promise<{ data: User; capabilities: Capabilities }> {
    return request('/auth/me');
  },

  /* ---- Users & store --------------------------------------------------- */

  async getUsers(): Promise<User[]> {
    const json = await request<{ data: User[] }>('/users');
    return json.data;
  },

  async resetStore(): Promise<void> {
    await request('/store/reset', { method: 'POST' });
  },

  /* ---- Products -------------------------------------------------------- */

  async getProducts(): Promise<Product[]> {
    const json = await request<{ data: Product[] }>('/products');
    return json.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const json = await request<{ data: Product }>('/products', { method: 'POST', body: data });
    return json.data;
  },

  /* ---- Bugs ------------------------------------------------------------ */

  async getBugs(params: Record<string, string> = {}): Promise<{ total: number; data: Bug[] }> {
    const query = new URLSearchParams(params).toString();
    return request(`/bugs${query ? `?${query}` : ''}`);
  },

  async getBugById(id: string): Promise<{ data: Bug; auditLogs: AuditLogEntry[]; graph: GraphData }> {
    return request(`/bugs/${id}`);
  },

  async createBug(bugData: Partial<Bug>): Promise<Bug> {
    const json = await request<{ data: Bug }>('/bugs', { method: 'POST', body: bugData });
    return json.data;
  },

  /**
   * `lockVersion` is sent so the server can reject a write made against a stale
   * copy. Without it the optimistic-concurrency check on the server never ran,
   * and simultaneous edits silently resolved to last-write-wins.
   */
  async updateBug(id: string, updates: Partial<Bug>, lockVersion?: number): Promise<Bug> {
    const json = await request<{ data: Bug }>(`/bugs/${id}`, {
      method: 'PATCH',
      body: lockVersion === undefined ? updates : { ...updates, lockVersion },
    });
    return json.data;
  },

  async transitionBug(
    id: string,
    status: string,
    resolution?: string | null,
    duplicateOfBugId?: string
  ): Promise<Bug> {
    const json = await request<{ data: Bug }>(`/bugs/${id}/transition`, {
      method: 'POST',
      body: { status, resolution, duplicateOfBugId },
    });
    return json.data;
  },

  async assignBug(id: string, assigneeId: string): Promise<Bug> {
    const json = await request<{ data: Bug }>(`/bugs/${id}/assign`, { method: 'POST', body: { assigneeId } });
    return json.data;
  },

  async setSecurity(id: string, isSecuritySensitive: boolean): Promise<Bug> {
    const json = await request<{ data: Bug }>(`/bugs/${id}/set-security`, {
      method: 'POST',
      body: { isSecuritySensitive },
    });
    return json.data;
  },

  async bulkUpdate(bugIds: string[], updates: Partial<Bug>): Promise<number> {
    const json = await request<{ updatedCount: number }>('/bugs/bulk', {
      method: 'POST',
      body: { bugIds, updates },
    });
    return json.updatedCount;
  },

  async addComment(
    bugId: string,
    text: string,
    isInternal = false
  ): Promise<{ data: Comment; executedCommands?: Array<{ description: string }> }> {
    return request(`/bugs/${bugId}/comments`, { method: 'POST', body: { text, isInternal } });
  },

  async addWorkLog(
    bugId: string,
    hoursSpent: number,
    comment: string,
    newRemainingHours?: number
  ): Promise<{ data: WorkLog; bug: Bug }> {
    return request(`/bugs/${bugId}/worklogs`, {
      method: 'POST',
      body: { hoursSpent, comment, newRemainingHours },
    });
  },

  async toggleVote(bugId: string): Promise<{ votes: number; hasVoted: boolean }> {
    return request(`/bugs/${bugId}/vote`, { method: 'POST', body: {} });
  },

  /* ---- Flags ----------------------------------------------------------- */

  async setFlag(
    bugId: string,
    name: BugFlag['name'],
    status: FlagStatus,
    requesteeId?: string
  ): Promise<{ data: BugFlag; flags: BugFlag[] }> {
    return request(`/bugs/${bugId}/flags`, { method: 'POST', body: { name, status, requesteeId } });
  },

  /* ---- Graph & analytics ------------------------------------------------ */

  async getGraph(rootId?: string): Promise<GraphData> {
    const json = await request<{ data: GraphData }>(`/graph${rootId ? `?rootId=${rootId}` : ''}`);
    return json.data;
  },

  async getAnalytics(): Promise<Record<string, unknown>> {
    return request('/analytics');
  },

  /* ---- Triage ----------------------------------------------------------- */

  async findDuplicates(title: string, description: string): Promise<DuplicateCandidate[]> {
    const json = await request<{ candidates?: DuplicateCandidate[] }>('/ai/duplicates', {
      method: 'POST',
      body: { title, description },
    });
    return json.candidates || [];
  },

  async analyzeAndTriage(title: string, description: string, productId?: string): Promise<TriagePrediction> {
    const json = await request<{ prediction: TriagePrediction }>('/ai/triage', {
      method: 'POST',
      body: { title, description, productId },
    });
    return json.prediction;
  },

  async runReproductionTest(
    title: string,
    description: string,
    productId?: string
  ): Promise<{ result: SandboxRunResult; source: string }> {
    return request('/ai/run-test', { method: 'POST', body: { title, description, productId } });
  },

  /* ---- Bugzilla interchange --------------------------------------------- */

  async exportBugzillaXml(): Promise<string> {
    return request('/export/bugzilla-xml', { raw: true });
  },

  async importBugzillaXml(xmlContent: string): Promise<{ importedCount: number; data?: Bug[] }> {
    return request('/import/bugzilla-xml', { method: 'POST', body: { xmlContent } });
  },
};
