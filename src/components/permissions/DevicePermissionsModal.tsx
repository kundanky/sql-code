import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  HardDrive,
  Wifi,
  WifiOff,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Send
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  getStorageQuotaEstimate,
  requestStoragePersistence,
  exportLocalDatabaseToFile,
  parseImportedDatabaseFile,
  NotificationPermissionState,
  StorageEstimateResult
} from '../../utils/devicePermissions.ts';
import { ThemeConfig } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  tabs: any[];
  connections: any[];
  history: any[];
  schema: any;
  onRestoreBackup: (data: any) => void;
}

export const DevicePermissionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  theme,
  tabs,
  connections,
  history,
  schema,
  onRestoreBackup,
}) => {
  const [notifState, setNotifState] = useState<NotificationPermissionState>('default');
  const [storageState, setStorageState] = useState<StorageEstimateResult>({
    supported: false,
    persisted: false,
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: '...',
    quotaFormatted: '...',
    percentUsed: 0,
  });
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isRequestingNotif, setIsRequestingNotif] = useState<boolean>(false);
  const [isRequestingStorage, setIsRequestingStorage] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshStates = async () => {
    setNotifState(getNotificationPermission());
    const est = await getStorageQuotaEstimate();
    setStorageState(est);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStates();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    setIsRequestingNotif(true);
    const result = await requestNotificationPermission();
    setNotifState(result);
    setIsRequestingNotif(false);

    if (result === 'granted') {
      setFeedbackMsg('Notification permission granted! Sending confirmation test...');
      sendLocalNotification('SQL CODE Notification Active', {
        body: 'Local notifications enabled for query completions, table creation, and backups.',
      });
    } else if (result === 'denied') {
      setFeedbackMsg('Notifications blocked by browser. You can enable them in site settings.');
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleTestNotification = () => {
    const sent = sendLocalNotification('SQL CODE Query Engine', {
      body: 'Query test: Table "clients" created successfully (4 columns: id, name, email, age).',
    });
    if (sent) {
      setFeedbackMsg('Test notification dispatched!');
    } else {
      setFeedbackMsg('Please grant notification permission first.');
    }
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRequestStorage = async () => {
    setIsRequestingStorage(true);
    const persisted = await requestStoragePersistence();
    await refreshStates();
    setIsRequestingStorage(false);

    if (persisted) {
      setFeedbackMsg('Persistent storage granted! Browser will protect data from eviction.');
    } else {
      setFeedbackMsg('Persistent storage request submitted. Best-effort storage active.');
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleExport = () => {
    exportLocalDatabaseToFile({ tabs, connections, history, schema });
    setFeedbackMsg('Database backup downloaded successfully!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseImportedDatabaseFile(file);
      onRestoreBackup(data);
      setFeedbackMsg('Local database backup restored successfully!');
    } catch (err: any) {
      setFeedbackMsg(`Restore failed: ${err.message || 'Invalid format'}`);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        style={{
          backgroundColor: theme.bgSecondary || '#252526',
          borderColor: theme.border || '#333333',
          color: theme.textPrimary || '#ffffff',
        }}
      >
        {/* Modal Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: theme.border || '#333333' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base leading-tight">
                Device Permissions & Offline Storage
              </h2>
              <p className="text-[11px] opacity-70">
                Native Android & iOS device capabilities and offline mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-blue-500/15 border-b border-blue-500/30 text-blue-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Card 1: Offline Mode Status */}
          <div
            className="p-3.5 rounded-xl border space-y-2"
            style={{
              backgroundColor: theme.bgPrimary || '#1e1e1e',
              borderColor: theme.border || '#333333',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-400" />
                )}
                <span>Offline Engine Status</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isOnline ? 'Online (Cached Ready)' : 'Offline (Local Engine Active)'}
              </span>
            </div>
            <p className="opacity-75 leading-relaxed text-[11px]">
              SQL CODE operates entirely in offline mode via local Service Worker and IndexedDB. You can create tables, execute DDL/DML, inspect schemas, and view execution plans without internet connection.
            </p>
          </div>

          {/* Card 2: Notification Permission */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: theme.bgPrimary || '#1e1e1e',
              borderColor: theme.border || '#333333',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Bell className="w-4 h-4 text-purple-400" />
                <span>Notification Permission</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                  notifState === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : notifState === 'denied'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {notifState}
              </span>
            </div>

            <p className="opacity-75 leading-relaxed text-[11px]">
              Receive native device alerts when long-running SQL queries finish, schema alterations complete (such as CREATE TABLE), or destructive query checkpoints trigger.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {notifState !== 'granted' ? (
                <button
                  onClick={handleRequestNotification}
                  disabled={isRequestingNotif || notifState === 'denied'}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isRequestingNotif ? 'Requesting...' : 'Request Notification Permission'}
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Test Notification
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Storage Permission & Persistent Storage */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: theme.bgPrimary || '#1e1e1e',
              borderColor: theme.border || '#333333',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>Persistent Storage Permission</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  storageState.persisted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {storageState.persisted ? 'Persistent (Protected)' : 'Best-Effort'}
              </span>
            </div>

            <p className="opacity-75 leading-relaxed text-[11px]">
              Storage persistence prevents Android OS and iOS Safari from evicting your cached database tables, query tabs, and query history when device storage runs low.
            </p>

            {/* Storage Quota Progress Bar */}
            {storageState.supported && (
              <div className="space-y-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
                <div className="flex justify-between text-[11px] opacity-80 font-mono">
                  <span>Local Storage Used: {storageState.usageFormatted}</span>
                  <span>Quota: {storageState.quotaFormatted}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, storageState.percentUsed)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {!storageState.persisted && (
                <button
                  onClick={handleRequestStorage}
                  disabled={isRequestingStorage}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  {isRequestingStorage ? 'Requesting...' : 'Request Persistent Storage'}
                </button>
              )}
              <button
                onClick={refreshStates}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Quota
              </button>
            </div>
          </div>

          {/* Card 4: Local Database Backup & Restore */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: theme.bgPrimary || '#1e1e1e',
              borderColor: theme.border || '#333333',
            }}
          >
            <div className="flex items-center gap-2 font-medium">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Local Database Backup & Restore</span>
            </div>

            <p className="opacity-75 leading-relaxed text-[11px]">
              Export your schemas, query buffers, and history to a JSON file on your Android/iOS device storage for offline backups or migration.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Backup (.json)
              </button>

              <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Import Backup (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="px-4 py-3 border-t flex justify-end shrink-0"
          style={{ borderColor: theme.border || '#333333' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
