import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Product, Bug, AuditLogEntry, BugFlag } from '../types/index.js';
import { SEED_USERS, SEED_PRODUCTS, SEED_BUGS, SEED_AUDIT_LOGS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data-storage');
const DB_FILE = path.join(DATA_DIR, 'omnibug-db.json');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  bugs: Bug[];
  auditLogs: AuditLogEntry[];
  nextBugNumber: number;
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [...SEED_USERS],
      products: [...SEED_PRODUCTS],
      bugs: [...SEED_BUGS],
      auditLogs: [...SEED_AUDIT_LOGS],
      nextBugNumber: 1008,
    };
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.bugs && parsed.products) {
          this.data = parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load database from disk, using seed data:', e);
    }
  }

  public saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database to disk:', e);
    }
  }

  public resetToSeed() {
    this.data = {
      users: JSON.parse(JSON.stringify(SEED_USERS)),
      products: JSON.parse(JSON.stringify(SEED_PRODUCTS)),
      bugs: JSON.parse(JSON.stringify(SEED_BUGS)),
      auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
      nextBugNumber: 1008,
    };
    this.saveToDisk();
    return this.data;
  }

  // User queries
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id || u.email === id);
  }

  // Product queries
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Product): Product {
    this.data.products.push(product);
    this.saveToDisk();
    return product;
  }

  // Bug queries
  public getBugs(): Bug[] {
    return this.data.bugs;
  }

  public getBugById(idOrNumber: string | number): Bug | undefined {
    const num = Number(idOrNumber);
    if (!isNaN(num) && typeof idOrNumber !== 'string') {
      return this.data.bugs.find(b => b.bugNumber === num);
    }
    return this.data.bugs.find(b => b.id === idOrNumber || b.bugNumber === num);
  }

  public createBug(bugData: Omit<Bug, 'id' | 'bugNumber' | 'createdAt' | 'updatedAt'>): Bug {
    const now = new Date().toISOString();
    const bug: Bug = {
      ...bugData,
      id: `bug-${this.data.nextBugNumber}`,
      bugNumber: this.data.nextBugNumber,
      createdAt: now,
      updatedAt: now,
      ccList: bugData.ccList || [],
      watchers: bugData.watchers || [],
      votes: bugData.votes || 0,
      votedUserIds: bugData.votedUserIds || [],
      dependsOn: bugData.dependsOn || [],
      blocks: bugData.blocks || [],
      seeAlso: bugData.seeAlso || [],
      flags: bugData.flags || [],
      tags: bugData.tags || [],
      workLogs: bugData.workLogs || [],
      attachments: bugData.attachments || [],
      comments: bugData.comments || [],
    };

    this.data.nextBugNumber++;
    this.data.bugs.unshift(bug);

    // If this bug blocks others, update those bugs' dependsOn
    for (const blockedId of bug.blocks) {
      const blockedBug = this.getBugById(blockedId);
      if (blockedBug && !blockedBug.dependsOn.includes(bug.id)) {
        blockedBug.dependsOn.push(bug.id);
        blockedBug.updatedAt = now;
      }
    }

    // If this bug depends on others, update those bugs' blocks
    for (const depId of bug.dependsOn) {
      const depBug = this.getBugById(depId);
      if (depBug && !depBug.blocks.includes(bug.id)) {
        depBug.blocks.push(bug.id);
        depBug.updatedAt = now;
      }
    }

    this.saveToDisk();
    return bug;
  }

  public updateBug(id: string, updates: Partial<Bug>): Bug | undefined {
    const index = this.data.bugs.findIndex(b => b.id === id);
    if (index === -1) return undefined;

    const oldBug = this.data.bugs[index];
    const now = new Date().toISOString();

    const updatedBug: Bug = {
      ...oldBug,
      ...updates,
      updatedAt: now,
    };

    if (updates.status === 'RESOLVED' || updates.status === 'CLOSED' || updates.status === 'VERIFIED') {
      if (!oldBug.closedAt) {
        updatedBug.closedAt = now;
      }
    } else if (updates.status === 'REOPENED' || updates.status === 'IN_PROGRESS' || updates.status === 'NEW') {
      updatedBug.closedAt = undefined;
      updatedBug.resolution = null;
    }

    this.data.bugs[index] = updatedBug;
    this.saveToDisk();
    return updatedBug;
  }

  public deleteBug(id: string): boolean {
    const index = this.data.bugs.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.data.bugs.splice(index, 1);
    this.saveToDisk();
    return true;
  }

  // Audit Logs
  public getAuditLogs(bugId?: string): AuditLogEntry[] {
    if (bugId) {
      return this.data.auditLogs.filter(a => a.bugId === bugId);
    }
    return this.data.auditLogs;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.saveToDisk();
    return log;
  }
}

export const store = new Store();
