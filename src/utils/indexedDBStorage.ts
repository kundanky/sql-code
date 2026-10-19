/**
 * SQL CODE Offline IndexedDB Storage Service
 * Provides persistent, resilient offline storage for tabs, queries, connections, and settings.
 * Includes graceful localStorage and memory fallback for private browsing or restricted WebViews.
 */

const DB_NAME = 'sqlcode_db';
const DB_VERSION = 1;
const STORE_NAME = 'sqlcode_state';

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryFallback: Map<string, any> = new Map();

  private isIDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private openDB(): Promise<IDBDatabase | null> {
    if (!this.isIDBAvailable()) {
      return Promise.resolve(null);
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (err) => {
          console.warn('[IndexedDB] Failed to open database, falling back:', err);
          resolve(null);
        };
      } catch (e) {
        console.warn('[IndexedDB] Initialization exception:', e);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        return new Promise((resolve, reject) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          } catch (err) {
            reject(err);
          }
        });
      }
    } catch {
      // Fallback
    }

    // LocalStorage fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`sqlcode_${key}`, JSON.stringify(value));
        return;
      }
    } catch {
      // Ignore
    }

    // Memory fallback
    this.memoryFallback.set(key, value);
  }

  public async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const db = await this.openDB();
      if (db) {
        const result = await new Promise<any>((resolve) => {
          try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(undefined);
          } catch {
            resolve(undefined);
          }
        });

        if (result !== undefined && result !== null) {
          return result as T;
        }
      }
    } catch {
      // Continue to fallback
    }

    // LocalStorage fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(`sqlcode_${key}`) || window.localStorage.getItem(`sqlforge_${key}`);
        if (stored) {
          return JSON.parse(stored) as T;
        }
      }
    } catch {
      // Ignore
    }

    // Memory fallback
    if (this.memoryFallback.has(key)) {
      return this.memoryFallback.get(key) as T;
    }

    return defaultValue;
  }

  public async removeItem(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }
    } catch {
      // Ignore
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(`sqlcode_${key}`);
        window.localStorage.removeItem(`sqlforge_${key}`);
      }
    } catch {
      // Ignore
    }

    this.memoryFallback.delete(key);
  }

  public async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      if (db) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }
    } catch {
      // Ignore
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage).filter((k) => k.startsWith('sqlcode_') || k.startsWith('sqlforge_'));
        keys.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch {
      // Ignore
    }

    this.memoryFallback.clear();
  }
}

export const offlineStorage = new IndexedDBStorage();
