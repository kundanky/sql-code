import { DatabaseSchema, ExplainPlanNode, QueryResult } from '../types/index.ts';
import { offlineStorage } from './indexedDBStorage.ts';

interface InFlightRequest {
  resolve: (val: any) => void;
  reject: (err: any) => void;
  timeoutId?: any;
}

export interface LocalDbMeta {
  name: string;
  sizeBytes: number;
  tableCount: number;
  isActive: boolean;
  updatedAt: string;
}

class SqliteManager {
  private worker: Worker | null = null;
  private inFlight = new Map<string, InFlightRequest>();
  private activeDbName: string = 'main';
  private lastKnownSnapshot: Uint8Array | null = null;
  private saveDebounceTimer: any = null;
  private isInitialized = false;
  private initPromise: Promise<DatabaseSchema> | null = null;

  constructor() {
    // Lazy initialized
  }

  public getActiveDbName(): string {
    return this.activeDbName;
  }

  private getWasmUrl(): string {
    try {
      if (typeof window !== 'undefined') {
        return new URL('/sql-wasm.wasm', window.location.href).href;
      }
    } catch {
      // Fallback
    }
    return '/sql-wasm.wasm';
  }

  /**
   * Initializes the SQLite worker and loads the active database from IndexedDB.
   */
  public async init(dbNameToLoad?: string): Promise<DatabaseSchema> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      // 1. Get database catalog
      const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
      let targetName = dbNameToLoad || (await offlineStorage.getItem<string>('sqlite_active_db_name', 'main'));
      
      if (!catalog.includes(targetName)) {
        targetName = catalog[0] || 'main';
      }
      this.activeDbName = targetName;

      // 2. Load stored binary data for active DB
      const binary = await offlineStorage.getItem<Uint8Array | null>(`sqlite_db_${targetName}`, null);
      this.lastKnownSnapshot = binary;

      // 3. Start worker
      await this.startWorker(targetName, binary);
      this.isInitialized = true;

      // 4. Extract schema
      const schema = await this.getSchema();
      return schema;
    })();

    return this.initPromise;
  }

  /**
   * Starts a new worker instance and sends INIT message.
   */
  private async startWorker(dbName: string, binaryData: Uint8Array | null): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    const workerInstance = new Worker(new URL('../workers/sqliteWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerInstance.onmessage = (e: MessageEvent) => {
      const { id, type, payload } = e.data;
      const req = this.inFlight.get(id);
      if (!req) return;

      this.inFlight.delete(id);
      if (req.timeoutId) clearTimeout(req.timeoutId);

      if (type === 'ERROR') {
        req.reject(new Error(payload?.error || 'Worker error'));
      } else {
        req.resolve(payload);
      }
    };

    workerInstance.onerror = (err) => {
      console.error('[SqliteWorker] Worker error event:', err);
      for (const [id, req] of this.inFlight.entries()) {
        if (req.timeoutId) clearTimeout(req.timeoutId);
        req.reject(new Error('SQLite Worker encountered an unhandled error'));
      }
      this.inFlight.clear();
    };

    this.worker = workerInstance;

    const wasmUrl = this.getWasmUrl();
    await this.postToWorker('INIT', {
      wasmUrl,
      binaryData,
      dbName,
    });
  }

  private postToWorker<T = any>(type: string, payload: any = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return reject(new Error('SQLite worker not started'));
      }

      const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      this.inFlight.set(id, { resolve, reject });

      this.worker.postMessage({ id, type, payload });
    });
  }

  /**
   * Executes a SQL script on the background worker.
   */
  public async execute(
    sql: string,
    options?: { isReadOnly?: boolean }
  ): Promise<{
    result?: QueryResult;
    explainPlan?: ExplainPlanNode;
    error?: string;
    affectedRows: number;
    isMutated: boolean;
    executionTimeMs: number;
    freshSchema?: DatabaseSchema;
  }> {
    if (!this.isInitialized) {
      await this.init();
    }

    const response = await this.postToWorker('EXECUTE', {
      sql,
      isReadOnly: options?.isReadOnly ?? false,
    });

    if (response.isMutated) {
      this.schedulePersist();
    }

    return response;
  }

  /**
   * Cancels any active query by terminating and restarting the worker.
   */
  public async cancelQuery(): Promise<void> {
    console.warn('[SqliteManager] Terminating worker to cancel query...');
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const [id, req] of this.inFlight.entries()) {
      if (req.timeoutId) clearTimeout(req.timeoutId);
      req.reject(new Error('Query execution was cancelled by user.'));
    }
    this.inFlight.clear();

    // Restart worker with last saved snapshot
    await this.startWorker(this.activeDbName, this.lastKnownSnapshot);
  }

  /**
   * Schedules a debounced save of the database binary to IndexedDB.
   */
  private schedulePersist() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const { binary } = await this.postToWorker('EXPORT');
        if (binary) {
          this.lastKnownSnapshot = binary;
          await offlineStorage.setItem(`sqlite_db_${this.activeDbName}`, binary);
        }
      } catch (err) {
        console.error('[SqliteManager] Failed to persist database to IndexedDB:', err);
      }
    }, 350);
  }

  /**
   * Retrieves the current schema.
   */
  public async getSchema(): Promise<DatabaseSchema> {
    if (!this.isInitialized) {
      return this.init();
    }
    const res = await this.postToWorker('GET_SCHEMA');
    return res.schema;
  }

  /**
   * Seeds demo data (categories, products, customers, orders).
   */
  public async seedSampleData(): Promise<DatabaseSchema> {
    if (!this.isInitialized) {
      await this.init();
    }
    const res = await this.postToWorker('SEED_SAMPLE');
    this.schedulePersist();
    return res.schema;
  }

  /**
   * Lists all local databases in the catalog.
   */
  public async listDatabases(): Promise<LocalDbMeta[]> {
    const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
    const list: LocalDbMeta[] = [];

    for (const name of catalog) {
      const binary = await offlineStorage.getItem<Uint8Array | null>(`sqlite_db_${name}`, null);
      const sizeBytes = binary ? binary.byteLength : 0;
      list.push({
        name,
        sizeBytes,
        tableCount: 0,
        isActive: name === this.activeDbName,
        updatedAt: 'Local on-device',
      });
    }

    return list;
  }

  /**
   * Creates a new empty database and adds it to the catalog.
   */
  public async createDatabase(name: string): Promise<DatabaseSchema> {
    const trimmed = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!trimmed) throw new Error('Database name cannot be empty');

    const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
    if (catalog.includes(trimmed)) {
      throw new Error(`Database "${trimmed}" already exists`);
    }

    catalog.push(trimmed);
    await offlineStorage.setItem('sqlite_db_catalog', catalog);

    // Switch to new database
    return this.switchDatabase(trimmed);
  }

  /**
   * Renames an existing database.
   */
  public async renameDatabase(oldName: string, newName: string): Promise<void> {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanNew) throw new Error('New database name cannot be empty');
    if (cleanOld === cleanNew) return;

    const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
    if (catalog.includes(cleanNew)) {
      throw new Error(`A database named "${cleanNew}" already exists`);
    }

    const idx = catalog.indexOf(cleanOld);
    if (idx < 0) throw new Error(`Database "${cleanOld}" not found`);

    catalog[idx] = cleanNew;
    await offlineStorage.setItem('sqlite_db_catalog', catalog);

    // Move binary data
    const binary = await offlineStorage.getItem<Uint8Array | null>(`sqlite_db_${cleanOld}`, null);
    if (binary) {
      await offlineStorage.setItem(`sqlite_db_${cleanNew}`, binary);
      await offlineStorage.removeItem(`sqlite_db_${cleanOld}`);
    }

    if (this.activeDbName === cleanOld) {
      this.activeDbName = cleanNew;
      await offlineStorage.setItem('sqlite_active_db_name', cleanNew);
    }
  }

  /**
   * Deletes a database from catalog and storage.
   */
  public async deleteDatabase(name: string): Promise<DatabaseSchema> {
    const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
    if (catalog.length <= 1) {
      throw new Error('Cannot delete the only database. At least one database must exist.');
    }

    const updatedCatalog = catalog.filter((n) => n !== name);
    await offlineStorage.setItem('sqlite_db_catalog', updatedCatalog);
    await offlineStorage.removeItem(`sqlite_db_${name}`);

    // If active was deleted, switch to the first remaining database
    if (this.activeDbName === name) {
      return this.switchDatabase(updatedCatalog[0]);
    }

    return this.getSchema();
  }

  /**
   * Switches active database.
   */
  public async switchDatabase(name: string): Promise<DatabaseSchema> {
    // 1. Immediately save current database before switching
    if (this.worker && this.activeDbName) {
      try {
        const { binary } = await this.postToWorker('EXPORT');
        if (binary) {
          await offlineStorage.setItem(`sqlite_db_${this.activeDbName}`, binary);
        }
      } catch {
        // Continue
      }
    }

    this.activeDbName = name;
    await offlineStorage.setItem('sqlite_active_db_name', name);

    // 2. Load target database binary
    const binary = await offlineStorage.getItem<Uint8Array | null>(`sqlite_db_${name}`, null);
    this.lastKnownSnapshot = binary;

    // 3. Restart worker with target DB
    await this.startWorker(name, binary);
    return this.getSchema();
  }

  /**
   * Imports an SQLite binary file (.db / .sqlite) as the active database.
   */
  public async importDatabase(name: string, binaryData: Uint8Array): Promise<DatabaseSchema> {
    const catalog = await offlineStorage.getItem<string[]>('sqlite_db_catalog', ['main']);
    if (!catalog.includes(name)) {
      catalog.push(name);
      await offlineStorage.setItem('sqlite_db_catalog', catalog);
    }

    this.activeDbName = name;
    await offlineStorage.setItem('sqlite_active_db_name', name);
    await offlineStorage.setItem(`sqlite_db_${name}`, binaryData);
    this.lastKnownSnapshot = binaryData;

    await this.startWorker(name, binaryData);
    return this.getSchema();
  }

  /**
   * Exports the active database as a binary Uint8Array.
   */
  public async exportCurrentDatabase(): Promise<{ name: string; data: Uint8Array }> {
    const { binary } = await this.postToWorker('EXPORT');
    return {
      name: `${this.activeDbName}.sqlite`,
      data: binary,
    };
  }

  /**
   * Runs an isolated challenge query test for Practice Mode.
   */
  public async checkPractice(
    seedSql: string,
    userSql: string,
    solutionSql: string
  ): Promise<{
    passed: boolean;
    userRows: any[];
    expectedRows: any[];
    userColumns: string[];
    expectedColumns: string[];
    error?: string;
    diffMessage?: string;
  }> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.postToWorker('CHECK_PRACTICE', {
      seedSql,
      userSql,
      solutionSql,
    });
  }
}

export const sqliteManager = new SqliteManager();
