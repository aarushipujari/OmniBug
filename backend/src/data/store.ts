import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Product, Bug, AuditLogEntry, BugFlag } from '../types/index.js';
import { SEED_USERS, SEED_PRODUCTS, SEED_BUGS, SEED_AUDIT_LOGS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data-storage');
const DB_FILE = process.env.OMNIBUG_DB_PATH || path.join(DATA_DIR, 'omnibug-db.json');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  bugs: Bug[];
  auditLogs: AuditLogEntry[];
  nextBugNumber: number;
}

class Store {
  private data: DatabaseSchema;
  private inMemoryOnly: boolean = process.env.NODE_ENV === 'test';
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingWrite = false;

  constructor() {
    this.data = {
      users: [...SEED_USERS],
      products: [...SEED_PRODUCTS],
      bugs: [...SEED_BUGS],
      auditLogs: [...SEED_AUDIT_LOGS],
      nextBugNumber: 1008,
    };
    if (!this.inMemoryOnly) {
      this.loadFromDisk();
    }
  }

  public setInMemoryMode(enabled: boolean) {
    this.inMemoryOnly = enabled;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        if (parsed.bugs && parsed.products) {
          this.data = { ...this.data, ...parsed } as DatabaseSchema;
          this.reconcileUsersWithSeed();
        }
      }
    } catch (e) {
      console.warn('Could not load database from disk, using seed data:', e);
    }
  }

  /**
   * Reconcile persisted users with the seed definitions.
   *
   * The snapshot on disk predates whatever the current build knows about, and
   * `loadFromDisk` replaces the whole dataset. When credentials were introduced
   * every persisted user came back without a `passwordHash`, so no one could
   * sign in until the file was deleted by hand. Server-owned fields are
   * therefore restored from the seed rather than trusted from the snapshot.
   */
  private reconcileUsersWithSeed() {
    const seedById = new Map(SEED_USERS.map(u => [u.id, u]));

    this.data.users = (this.data.users ?? []).map(persisted => {
      const seed = seedById.get(persisted.id);
      return seed ? { ...persisted, passwordHash: seed.passwordHash ?? persisted.passwordHash } : persisted;
    });

    // Accounts added to the seed after the snapshot was taken.
    for (const seed of SEED_USERS) {
      if (!this.data.users.some(u => u.id === seed.id)) this.data.users.push({ ...seed });
    }
  }

  /**
   * Requests a persist. Writes are coalesced rather than performed inline.
   *
   * Every mutating helper called this, and it serialised and wrote the whole
   * database synchronously each time. A bulk update over N issues therefore
   * performed 2N full-file writes — one per issue and one per audit entry —
   * with the event loop blocked for all of them, so the cost of a single
   * request grew with both the size of the selection and the size of the
   * accumulated history. They now collapse into one write on the next tick.
   *
   * The tradeoff is a window of a few milliseconds in which a crash loses the
   * most recent mutation. `flushToDisk` runs on exit and on the fatal signals
   * so an ordinary shutdown never hits it, and it stays available for a caller
   * that needs the write to have landed before it returns.
   */
  public saveToDisk() {
    if (this.inMemoryOnly || process.env.NODE_ENV === 'test') {
      return; // Never write to disk during automated test runs
    }
    this.pendingWrite = true;
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flushToDisk();
    }, 0);
    // Do not hold the process open purely for a queued write.
    this.writeTimer.unref?.();
  }

  /** Performs the write immediately, if one is outstanding. */
  public flushToDisk() {
    if (this.inMemoryOnly || process.env.NODE_ENV === 'test') return;
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    if (!this.pendingWrite) return;
    this.pendingWrite = false;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Write to a sibling file and rename. `writeFileSync` truncates the
      // target before writing, so a crash mid-write previously destroyed the
      // only copy of the database.
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
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
      lockVersion: 1,
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
    const currentVersion = oldBug.lockVersion || 1;

    const updatedBug: Bug = {
      ...oldBug,
      ...updates,
      lockVersion: currentVersion + 1,
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

// A queued write must not be lost to an ordinary shutdown.
if (process.env.NODE_ENV !== 'test') {
  const flush = () => store.flushToDisk();
  process.once('exit', flush);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      flush();
      process.exit(0);
    });
  }
}
