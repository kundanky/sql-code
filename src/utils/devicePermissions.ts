/**
 * Device Permissions & Local Storage Utility for SQL CODE
 * Handles:
 * 1. Notification Permission & Local Push Notifications (Web Notifications API)
 * 2. Persistent Storage Permission & Quota Estimation (StorageManager API)
 * 3. Local Offline Database Export & Import (.json backup)
 * 4. Cross-platform Android / iOS device capabilities
 */

export interface StorageEstimateResult {
  supported: boolean;
  persisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

// ==========================================
// 1. Notification Permissions & Dispatch
// ==========================================

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('[Permissions] Failed to request notification permission:', err);
    return getNotificationPermission();
  }
}

export function sendLocalNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  }
): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const opts: NotificationOptions = {
      body: options?.body,
      icon: options?.icon || '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: options?.tag || 'sqlcode-notice',
      data: options?.data,
    };

    // If ServiceWorker registration is available, use showNotification (best for Android PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, opts).catch(() => {
          new Notification(title, opts);
        });
      });
      return true;
    }

    new Notification(title, opts);
    return true;
  } catch (err) {
    console.warn('[Permissions] Could not dispatch notification:', err);
    return false;
  }
}

// ==========================================
// 2. Storage Permissions & Quota Management
// ==========================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isStoragePermissionSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.persist === 'function';
}

export async function checkStoragePersistence(): Promise<boolean> {
  if (!isStoragePermissionSupported()) return false;
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (!isStoragePermissionSupported()) return false;
  try {
    const persisted = await navigator.storage.persist();
    return persisted;
  } catch (err) {
    console.warn('[Permissions] Failed to request storage persistence:', err);
    return false;
  }
}

export async function getStorageQuotaEstimate(): Promise<StorageEstimateResult> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return {
      supported: false,
      persisted: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: 'Unknown',
      quotaFormatted: 'Unknown',
      percentUsed: 0,
    };
  }

  try {
    const [estimate, isPersisted] = await Promise.all([
      navigator.storage.estimate(),
      checkStoragePersistence(),
    ]);

    const usage = estimate.usage || 0;
    const quota = estimate.quota || 1;
    const percent = Math.min(100, Math.round((usage / quota) * 1000) / 10);

    return {
      supported: true,
      persisted: isPersisted,
      usageBytes: usage,
      quotaBytes: quota,
      usageFormatted: formatBytes(usage),
      quotaFormatted: formatBytes(quota),
      percentUsed: percent,
    };
  } catch (err) {
    console.warn('[Permissions] Failed to estimate storage:', err);
    return {
      supported: true,
      persisted: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: 'Error',
      quotaFormatted: 'Error',
      percentUsed: 0,
    };
  }
}

// ==========================================
// 3. Local Database Export / Import (.json)
// ==========================================

export interface DatabaseBackupPayload {
  version: string;
  exportedAt: string;
  app: string;
  data: {
    tabs: any[];
    connections: any[];
    history: any[];
    schema?: any;
    settings?: any;
  };
}

export function exportLocalDatabaseToFile(payload: {
  tabs: any[];
  connections: any[];
  history: any[];
  schema?: any;
  settings?: any;
}) {
  const backup: DatabaseBackupPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'SQL CODE Mobile IDE',
    data: payload,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sqlcode_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseImportedDatabaseFile(file: File): Promise<DatabaseBackupPayload['data']> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Invalid SQL CODE backup file format.');
  }
  return parsed.data;
}
