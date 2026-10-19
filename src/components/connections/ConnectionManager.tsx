import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Plus, Trash2, Edit3, Download, Upload, 
  CheckCircle2, Sparkles, HardDrive, Info, AlertTriangle, X 
} from 'lucide-react';
import { DatabaseConnection, DatabaseSchema, ThemeConfig } from '../../types/index.ts';
import { sqliteManager, LocalDbMeta } from '../../utils/sqliteManager.ts';
import { SQL_DIALECT_OPTIONS } from '../../data/dialects.ts';

interface Props {
  activeDbName: string;
  onSwitchDatabase: (name: string) => Promise<void>;
  onRefreshSchema: () => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  theme?: ThemeConfig;
}

export const ConnectionManager: React.FC<Props> = ({
  activeDbName,
  onSwitchDatabase,
  onRefreshSchema,
  onSeedSampleData,
  theme,
}) => {
  const [databases, setDatabases] = useState<LocalDbMeta[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [editingDbName, setEditingDbName] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatabaseList = async () => {
    try {
      const list = await sqliteManager.listDatabases();
      setDatabases(list);
    } catch (err: any) {
      console.warn('[Databases] Could not list databases:', err);
    }
  };

  useEffect(() => {
    loadDatabaseList();
  }, [activeDbName]);

  const handleCreateDatabase = async () => {
    const clean = newDbName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean) {
      setErrorMsg('Please enter a valid database name.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sqliteManager.createDatabase(clean);
      setNewDbName('');
      setIsCreatingNew(false);
      await onSwitchDatabase(clean);
      await loadDatabaseList();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameDatabase = async (oldName: string) => {
    const clean = renamedName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean || clean === oldName) {
      setEditingDbName(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sqliteManager.renameDatabase(oldName, clean);
      setEditingDbName(null);
      if (activeDbName === oldName) {
        await onSwitchDatabase(clean);
      }
      await loadDatabaseList();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to rename database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDatabase = async (name: string) => {
    if (databases.length <= 1) {
      setErrorMsg('Cannot delete the only database. At least one must exist.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete database "${name}"?`)) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sqliteManager.deleteDatabase(name);
      await loadDatabaseList();
      await onRefreshSchema();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const { name, data } = await sqliteManager.exportCurrentDatabase();
      const blob = new Blob([data as any], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg('Failed to export SQLite database: ' + err.message);
    }
  };

  const handleImportDatabaseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;
        const uint8 = new Uint8Array(buffer);
        setIsLoading(true);
        await sqliteManager.importDatabase(baseName, uint8);
        await onSwitchDatabase(baseName);
        await loadDatabaseList();
      } catch (err: any) {
        setErrorMsg('Failed to load database file: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 p-3 sm:p-5 overflow-y-auto text-xs transition-colors select-none"
      style={{
        backgroundColor: theme?.bgPrimary || 'var(--theme-bg-primary, #1e1e1e)',
        color: theme?.textPrimary || 'var(--theme-text-primary, #cccccc)',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b mb-4"
        style={{ borderColor: theme?.border || '#2d2d2d' }}
      >
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 text-white">
            <Database className="w-5 h-5 text-emerald-400" />
            Local SQLite Databases
          </h2>
          <p className="text-[11px] text-[#858585]">
            Persistent WebAssembly database instances stored completely on-device in IndexedDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Load Sample Data Button */}
          <button
            type="button"
            onClick={onSeedSampleData}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>

          {/* New Database Button */}
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Database</span>
          </button>
        </div>
      </div>

      {/* Dialect Explanation Banner */}
      <div
        className="mb-4 p-3 rounded-xl border flex items-start gap-2.5 bg-blue-950/20 border-blue-500/30 text-blue-200"
      >
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-white">Dialect Engine Notice: </strong>
          The SQL dialect selector sets syntax highlighting and formatting for PostgreSQL, MySQL, SQLite, Oracle, etc.
          All queries execute natively in real-time on your local SQLite WebAssembly engine with zero network exposure.
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create New Database Form Modal / Card */}
      {isCreatingNew && (
        <div
          className="mb-4 p-4 rounded-xl border space-y-3"
          style={{
            backgroundColor: theme?.bgSecondary || '#252526',
            borderColor: theme?.border || '#333333',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-xs">Create New SQLite Database</h3>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-[#858585] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="e.g. analytics, test_sandbox"
              className="flex-1 font-mono text-xs px-3 py-1.5 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: theme?.bgPrimary || '#1e1e1e',
                borderColor: theme?.border || '#333333',
                color: '#ffffff',
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateDatabase}
              disabled={isLoading || !newDbName.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Databases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[#858585] text-[11px] px-1 font-medium">
          <span>Available Databases ({databases.length})</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportDatabase}
              className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              title="Download active database file (.sqlite)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Active .sqlite</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              title="Import SQLite database file (.db / .sqlite)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import .db</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleImportDatabaseFile}
              className="hidden"
            />
          </div>
        </div>

        {databases.map((db) => {
          const isActive = db.name === activeDbName;
          const isEditing = editingDbName === db.name;

          return (
            <div
              key={db.name}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isActive
                  ? 'border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'hover:border-[#555555]'
              }`}
              style={{
                backgroundColor: theme?.bgSecondary || '#252526',
                borderColor: isActive ? undefined : theme?.border || '#333333',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-[#858585]'
                  }`}
                >
                  <Database className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renamedName}
                        onChange={(e) => setRenamedName(e.target.value)}
                        className="font-mono text-xs px-2 py-1 rounded border focus:outline-none"
                        style={{
                          backgroundColor: theme?.bgPrimary || '#1e1e1e',
                          borderColor: theme?.border || '#333333',
                          color: '#ffffff',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameDatabase(db.name)}
                        className="text-xs px-2 py-1 rounded bg-emerald-600 text-white font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDbName(null)}
                        className="text-xs px-2 py-1 rounded bg-white/10 text-[#858585]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white truncate">
                        {db.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                          Active Database
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-[#858585] mt-0.5">
                    <span>Size: {(db.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>Engine: SQLite 3 (WASM)</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => onSwitchDatabase(db.name)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Switch to this DB
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setEditingDbName(db.name);
                    setRenamedName(db.name);
                  }}
                  title="Rename database"
                  className="p-1.5 rounded-lg text-[#858585] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {databases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDatabase(db.name)}
                    title="Delete database"
                    className="p-1.5 rounded-lg text-[#858585] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
