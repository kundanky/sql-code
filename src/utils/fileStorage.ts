import FS from '@isomorphic-git/lightning-fs';
import { FileItem, StorageInfo } from '../types/index.ts';

// Singleton lightning-fs instance for indexedDB virtual storage & isomorphic-git
let lfs: any = null;
export function getLightningFs() {
  if (!lfs) {
    lfs = new FS('sqlcode_vfs');
  }
  return lfs;
}

export type StorageListener = (event: { type: 'toast' | 'change'; message?: string; level?: 'info' | 'warn' | 'error' }) => void;
const listeners = new Set<StorageListener>();

export function subscribeStorageEvents(listener: StorageListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitStorageEvent(type: 'toast' | 'change', message?: string, level: 'info' | 'warn' | 'error' = 'info') {
  for (const listener of listeners) {
    try {
      listener({ type, message, level });
    } catch (e) {
      console.error(e);
    }
  }
}

// Storage State
let storageType: 'native' | 'fsa' | 'indexeddb' = 'indexeddb';
let storageLocation = 'IndexedDB (Offline VFS)';
let permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'granted';
let isPersisted = false;
let fsaHandle: any = null;

// Helper to check Capacitor native platform
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

// Initialize persistent storage and detect feature support
export async function initStorage(): Promise<StorageInfo> {
  const fs = getLightningFs();

  // 1. Request browser storage persistence
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      isPersisted = await navigator.storage.persist();
    } catch {
      isPersisted = false;
    }
  }

  // 2. Detect Native Capacitor Filesystem
  if (isCapacitorNative()) {
    storageType = 'native';
    storageLocation = 'Documents/SQLCODE';
    permissionStatus = 'granted';
  } else if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    // Check if we already have a stored handle from IndexedDB
    try {
      const storedHandle = await getStoredDirectoryHandle();
      if (storedHandle) {
        fsaHandle = storedHandle;
        const q = await storedHandle.queryPermission({ mode: 'readwrite' });
        if (q === 'granted') {
          storageType = 'fsa';
          storageLocation = `Local Folder: ${storedHandle.name}`;
          permissionStatus = 'granted';
        } else {
          storageType = 'fsa';
          storageLocation = `Local Folder: ${storedHandle.name}`;
          permissionStatus = 'prompt';
        }
      } else {
        storageType = 'indexeddb';
        storageLocation = 'IndexedDB (Virtual Filesystem)';
        permissionStatus = 'granted';
      }
    } catch {
      storageType = 'indexeddb';
      storageLocation = 'IndexedDB (Virtual Filesystem)';
      permissionStatus = 'granted';
    }
  } else {
    storageType = 'indexeddb';
    storageLocation = 'IndexedDB (Virtual Filesystem)';
    permissionStatus = 'granted';
  }

  // Ensure root project structure exists in LightningFS
  await ensureInitialDirectoryStructure();

  return getStorageInfo();
}

export function getStorageInfo(): StorageInfo {
  return {
    type: storageType,
    location: storageLocation,
    permission: permissionStatus,
    persisted: isPersisted,
  };
}

// IndexedDB Directory Handle Persistence for FSA API
const DB_NAME = 'sqlcode_fsa_db';
const STORE_NAME = 'handles';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredDirectoryHandle(): Promise<any> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('root_handle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveStoredDirectoryHandle(handle: any): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, 'root_handle');
  } catch (err) {
    console.warn('Could not persist directory handle:', err);
  }
}

// Request or Switch Directory via File System Access API
export async function requestDirectoryAccess(): Promise<StorageInfo> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    emitStorageEvent('toast', 'Native folder access is not supported in this browser.', 'warn');
    return getStorageInfo();
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      id: 'sqlcode_projects',
    });
    fsaHandle = handle;
    await saveStoredDirectoryHandle(handle);
    storageType = 'fsa';
    storageLocation = `Local Folder: ${handle.name}`;
    permissionStatus = 'granted';
    emitStorageEvent('toast', `Connected to local directory: ${handle.name}`, 'info');
    emitStorageEvent('change');
  } catch (err: any) {
    if (err.name === 'AbortError') {
      emitStorageEvent('toast', 'Folder selection was cancelled.', 'info');
    } else {
      permissionStatus = 'denied';
      emitStorageEvent('toast', 'Access to directory was denied or restricted.', 'error');
    }
  }

  return getStorageInfo();
}

// Initial directory structure for virtual storage
async function ensureInitialDirectoryStructure() {
  const fs = getLightningFs().promises;
  try {
    await fs.mkdir('/projects');
  } catch {}
  try {
    await fs.mkdir('/projects/Default');
  } catch {}
  try {
    await fs.mkdir('/projects/Default/queries');
  } catch {}

  // Check if Untitled.sql exists, if not create empty
  try {
    await fs.stat('/projects/Default/Untitled.sql');
  } catch {
    try {
      await fs.writeFile('/projects/Default/Untitled.sql', '-- Welcome to SQL CODE\n-- Write your SQL queries here\n');
    } catch {}
  }
}

// Normalizes path ensuring leading slash and forward slashes
export function normalizePath(p: string): string {
  let clean = p.replace(/\\/g, '/');
  if (!clean.startsWith('/')) clean = '/' + clean;
  return clean.replace(/\/+/g, '/');
}

// List all files and directories recursively
export async function listFiles(baseDir = '/projects'): Promise<FileItem[]> {
  const fs = getLightningFs().promises;
  const normBase = normalizePath(baseDir);

  async function walk(dir: string): Promise<FileItem[]> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return [];
    }

    const items: FileItem[] = [];
    for (const name of entries) {
      if (name.startsWith('.git')) continue; // hide internal git metadata from explorer tree
      const fullPath = `${dir === '/' ? '' : dir}/${name}`;
      try {
        const stat = await fs.stat(fullPath);
        const isDirectory = stat.isDirectory();
        const item: FileItem = {
          id: fullPath,
          name,
          path: fullPath,
          isDirectory,
          updatedAt: stat.mtimeMs || Date.now(),
          size: stat.size || 0,
        };

        if (isDirectory) {
          item.children = await walk(fullPath);
        }

        items.push(item);
      } catch (e) {
        // Continue if stat fails
      }
    }

    // Sort: directories first, then alphabetically
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return walk(normBase);
}

// Create new file
export async function createFile(filePath: string, content = ''): Promise<string> {
  const fs = getLightningFs().promises;
  const norm = normalizePath(filePath);

  // Ensure parent directory exists
  const parent = norm.substring(0, norm.lastIndexOf('/'));
  if (parent) {
    await ensureDirectoryExists(parent);
  }

  await fs.writeFile(norm, content);
  emitStorageEvent('change');
  return norm;
}

// Create new folder
export async function createFolder(folderPath: string): Promise<string> {
  const norm = normalizePath(folderPath);
  await ensureDirectoryExists(norm);
  emitStorageEvent('change');
  return norm;
}

async function ensureDirectoryExists(dirPath: string) {
  const fs = getLightningFs().promises;
  const parts = dirPath.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    try {
      const stat = await fs.stat(current);
      if (!stat.isDirectory()) {
        throw new Error(`${current} exists and is not a directory`);
      }
    } catch {
      await fs.mkdir(current);
    }
  }
}

// Read file content as string
export async function readFile(filePath: string): Promise<string> {
  const fs = getLightningFs().promises;
  const norm = normalizePath(filePath);
  const data = await fs.readFile(norm, { encoding: 'utf8' });
  return typeof data === 'string' ? data : new TextDecoder().decode(data);
}

// Save file content
export async function saveFile(filePath: string, content: string): Promise<void> {
  const fs = getLightningFs().promises;
  const norm = normalizePath(filePath);
  const parent = norm.substring(0, norm.lastIndexOf('/'));
  if (parent) {
    await ensureDirectoryExists(parent);
  }
  await fs.writeFile(norm, content);
  emitStorageEvent('change');
}

// Rename file or folder
export async function renameItem(oldPath: string, newPath: string): Promise<void> {
  const fs = getLightningFs().promises;
  const normOld = normalizePath(oldPath);
  const normNew = normalizePath(newPath);

  const stat = await fs.stat(normOld);
  if (stat.isDirectory()) {
    // Copy tree then remove old
    await copyDirRecursive(normOld, normNew);
    await deleteItem(normOld);
  } else {
    const content = await readFile(normOld);
    await createFile(normNew, content);
    await fs.unlink(normOld);
  }
  emitStorageEvent('change');
}

// Duplicate a file
export async function duplicateFile(filePath: string): Promise<string> {
  const norm = normalizePath(filePath);
  const lastSlash = norm.lastIndexOf('/');
  const dir = lastSlash >= 0 ? norm.substring(0, lastSlash) : '';
  const fileName = lastSlash >= 0 ? norm.substring(lastSlash + 1) : norm;

  const dotIdx = fileName.lastIndexOf('.');
  const baseName = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;
  const ext = dotIdx >= 0 ? fileName.substring(dotIdx) : '';

  let newName = `${baseName}_copy${ext}`;
  let newPath = `${dir}/${newName}`;
  const fs = getLightningFs().promises;

  let counter = 1;
  while (true) {
    try {
      await fs.stat(newPath);
      counter++;
      newName = `${baseName}_copy${counter}${ext}`;
      newPath = `${dir}/${newName}`;
    } catch {
      break;
    }
  }

  const content = await readFile(norm);
  await createFile(newPath, content);
  return newPath;
}

// Move item (file or directory)
export async function moveItem(srcPath: string, destDir: string): Promise<string> {
  const normSrc = normalizePath(srcPath);
  const normDestDir = normalizePath(destDir);
  const itemName = normSrc.substring(normSrc.lastIndexOf('/') + 1);
  const newPath = `${normDestDir}/${itemName}`;

  await renameItem(normSrc, newPath);
  return newPath;
}

// Delete item
export async function deleteItem(path: string): Promise<void> {
  const fs = getLightningFs().promises;
  const norm = normalizePath(path);

  const stat = await fs.stat(norm);
  if (stat.isDirectory()) {
    await deleteDirRecursive(norm);
  } else {
    await fs.unlink(norm);
  }
  emitStorageEvent('change');
}

async function deleteDirRecursive(dir: string) {
  const fs = getLightningFs().promises;
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    const full = `${dir}/${entry}`;
    const s = await fs.stat(full);
    if (s.isDirectory()) {
      await deleteDirRecursive(full);
    } else {
      await fs.unlink(full);
    }
  }
  await fs.rmdir(dir);
}

async function copyDirRecursive(src: string, dest: string) {
  const fs = getLightningFs().promises;
  await ensureDirectoryExists(dest);
  const entries = await fs.readdir(src);
  for (const entry of entries) {
    const srcFull = `${src}/${entry}`;
    const destFull = `${dest}/${entry}`;
    const s = await fs.stat(srcFull);
    if (s.isDirectory()) {
      await copyDirRecursive(srcFull, destFull);
    } else {
      const data = await readFile(srcFull);
      await fs.writeFile(destFull, data);
    }
  }
}

// Search across files by name and/or content
export async function searchFiles(
  query: string,
  searchContent = false,
  baseDir = '/projects'
): Promise<FileItem[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const fs = getLightningFs().promises;
  const matches: FileItem[] = [];

  async function walk(dir: string) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }

    for (const name of entries) {
      if (name.startsWith('.git')) continue;
      const full = `${dir === '/' ? '' : dir}/${name}`;
      try {
        const stat = await fs.stat(full);
        if (stat.isDirectory()) {
          if (name.toLowerCase().includes(q)) {
            matches.push({
              id: full,
              name,
              path: full,
              isDirectory: true,
              updatedAt: stat.mtimeMs,
            });
          }
          await walk(full);
        } else {
          let matched = name.toLowerCase().includes(q);
          let content = '';
          if (!matched && searchContent) {
            try {
              content = await readFile(full);
              if (content.toLowerCase().includes(q)) {
                matched = true;
              }
            } catch {}
          }
          if (matched) {
            matches.push({
              id: full,
              name,
              path: full,
              isDirectory: false,
              content: searchContent ? content : undefined,
              updatedAt: stat.mtimeMs,
              size: stat.size,
            });
          }
        }
      } catch {}
    }
  }

  await walk(normalizePath(baseDir));
  return matches;
}

// Export / Share file
export async function exportFile(filePath: string): Promise<void> {
  const norm = normalizePath(filePath);
  const content = await readFile(norm);
  const fileName = norm.substring(norm.lastIndexOf('/') + 1);

  // 1. If running native Capacitor
  if (isCapacitorNative() && (window as any).Capacitor?.Plugins?.Share) {
    try {
      await (window as any).Capacitor.Plugins.Share.share({
        title: fileName,
        text: content,
        dialogTitle: `Export ${fileName}`,
      });
      return;
    } catch (e) {
      console.warn('Capacitor share skipped/failed:', e);
    }
  }

  // 2. Web Share API with File
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], fileName, { type: 'text/plain' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return;
      }
    } catch (e) {
      // fallback to download
    }
  }

  // 3. Fallback: Browser Blob Download
  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    emitStorageEvent('toast', `Downloaded ${fileName}`, 'info');
  }
}

// Import a file from device
export async function importFileFromDevice(file: File, targetDir = '/projects/Default'): Promise<string> {
  const normDir = normalizePath(targetDir);
  await ensureDirectoryExists(normDir);
  const content = await file.text();
  const filePath = `${normDir}/${file.name}`;
  await createFile(filePath, content);
  emitStorageEvent('toast', `Imported ${file.name}`, 'info');
  emitStorageEvent('change');
  return filePath;
}

// Device Notifications: Capacitor Local Notifications or Web Notification API
export async function notifyUser(title: string, body: string): Promise<void> {
  // 1. Native Capacitor
  if (isCapacitorNative() && (window as any).Capacitor?.Plugins?.LocalNotifications) {
    try {
      await (window as any).Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now() % 100000,
            schedule: { at: new Date(Date.now() + 100) },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Capacitor local notification failed:', err);
    }
  }

  // 2. Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.svg' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      }
    } catch {}
  }
}
