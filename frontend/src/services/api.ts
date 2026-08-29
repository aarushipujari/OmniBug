import { Bug, Product, User, GraphData, DuplicateCandidate, TriagePrediction, BugFlag, FlagStatus } from '../types/index.js';

const API_BASE = '/api';

export const api = {
  // Users & Store
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    const json = await res.json();
    return json.data;
  },

  async resetStore(): Promise<void> {
    await fetch(`${API_BASE}/store/reset`, { method: 'POST' });
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    const json = await res.json();
    return json.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  // Bugs
  async getBugs(params: Record<string, string> = {}): Promise<{ total: number; data: Bug[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/bugs${query ? `?${query}` : ''}`);
    return await res.json();
  },

  async getBugById(id: string): Promise<{ data: Bug; auditLogs: any[]; graph: GraphData }> {
    const res = await fetch(`${API_BASE}/bugs/${id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch bug');
    }
    return await res.json();
  },

  async createBug(bugData: any, currentUser: User): Promise<Bug> {
    const res = await fetch(`${API_BASE}/bugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bugData, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create bug');
    return json.data;
  },

  async updateBug(id: string, updates: Partial<Bug>, currentUser: User): Promise<Bug> {
    const res = await fetch(`${API_BASE}/bugs/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Persona-Id': currentUser.id,
      },
      body: JSON.stringify({ ...updates, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update bug');
    return json.data;
  },

  // Explicit Domain Commands
  async transitionBug(id: string, status: string, resolution?: string | null, duplicateOfBugId?: string, currentUser?: User): Promise<Bug> {
    const res = await fetch(`${API_BASE}/bugs/${id}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser ? { 'X-Demo-Persona-Id': currentUser.id } : {}),
      },
      body: JSON.stringify({ status, resolution, duplicateOfBugId, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to transition bug');
    return json.data;
  },

  async assignBug(id: string, assigneeId: string, currentUser?: User): Promise<Bug> {
    const res = await fetch(`${API_BASE}/bugs/${id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser ? { 'X-Demo-Persona-Id': currentUser.id } : {}),
      },
      body: JSON.stringify({ assigneeId, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to assign bug');
    return json.data;
  },

  async setSecurity(id: string, isSecuritySensitive: boolean, currentUser?: User): Promise<Bug> {
    const res = await fetch(`${API_BASE}/bugs/${id}/set-security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUser ? { 'X-Demo-Persona-Id': currentUser.id } : {}),
      },
      body: JSON.stringify({ isSecuritySensitive, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to set security sensitivity');
    return json.data;
  },

  async getAuthToken(userId: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  },

  async bulkUpdate(bugIds: string[], updates: Partial<Bug>, currentUser: User): Promise<number> {
    const res = await fetch(`${API_BASE}/bugs/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bugIds, updates, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed bulk update');
    return json.updatedCount;
  },

  async addComment(bugId: string, text: string, currentUser: User, isInternal = false): Promise<any> {
    const res = await fetch(`${API_BASE}/bugs/${bugId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, isInternal, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add comment');
    return json;
  },

  async addWorkLog(bugId: string, hoursSpent: number, comment: string, currentUser: User, newRemainingHours?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/bugs/${bugId}/worklogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursSpent, comment, newRemainingHours, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add worklog');
    return json;
  },

  async toggleVote(bugId: string, currentUser: User): Promise<{ votes: number; hasVoted: boolean }> {
    const res = await fetch(`${API_BASE}/bugs/${bugId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _currentUser: currentUser }),
    });
    return await res.json();
  },

  // Flags
  async setFlag(bugId: string, name: BugFlag['name'], status: FlagStatus, requesteeId?: string, currentUser?: User): Promise<any> {
    const res = await fetch(`${API_BASE}/bugs/${bugId}/flags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status, requesteeId, _currentUser: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to set flag');
    return json;
  },

  // Graph
  async getGraph(rootId?: string): Promise<GraphData> {
    const query = rootId ? `?rootId=${rootId}` : '';
    const res = await fetch(`${API_BASE}/graph${query}`);
    const json = await res.json();
    return json.data;
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics`);
    return await res.json();
  },

  // AI
  async findDuplicates(title: string, description: string): Promise<DuplicateCandidate[]> {
    const res = await fetch(`${API_BASE}/ai/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    const json = await res.json();
    return json.candidates || [];
  },

  async analyzeAndTriage(title: string, description: string, productId?: string): Promise<TriagePrediction> {
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, productId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Triage analysis failed');
    return json.prediction;
  },

  // Export / Import
  async exportBugzillaXml(): Promise<string> {
    const res = await fetch(`${API_BASE}/export/bugzilla-xml`);
    return await res.text();
  },

  async importBugzillaXml(xmlContent: string): Promise<any> {
    const res = await fetch(`${API_BASE}/import/bugzilla-xml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xmlContent }),
    });
    return await res.json();
  },
};
