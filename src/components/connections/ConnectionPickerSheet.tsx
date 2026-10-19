import React, { useRef, useEffect, useState } from 'react';
import { Database, Check, X, Server, ExternalLink, HardDrive } from 'lucide-react';
import { ThemeConfig } from '../../types/index.ts';
import { sqliteManager, LocalDbMeta } from '../../utils/sqliteManager.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeDbName: string;
  onSelectDatabase: (name: string) => void;
  onNavigateToDatabases: () => void;
  theme?: ThemeConfig;
}

export const ConnectionPickerSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  activeDbName,
  onSelectDatabase,
  onNavigateToDatabases,
  theme,
}) => {
  const [databases, setDatabases] = useState<LocalDbMeta[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      sqliteManager.listDatabases().then(setDatabases).catch(console.warn);
    }
  }, [isOpen, activeDbName]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] animate-backdrop-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Active Database Switcher"
        className="relative z-10 w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl border shadow-2xl pb-[max(16px,env(safe-area-inset-bottom))] sm:pb-4 animate-sheet-slide-up select-none overflow-hidden"
        style={{
          backgroundColor: theme?.bgSecondary || '#1e1e1e',
          borderColor: theme?.border || '#333333',
          color: theme?.textPrimary || '#cccccc',
        }}
      >
        {/* Drag handle for mobile */}
        <div className="w-full flex items-center justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#444444]" />
        </div>

        {/* Sheet Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: theme?.border || '#2d2d2d' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Active Database</h2>
              <p className="text-[11px] text-[#858585]">
                Switch active SQLite database instance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#858585] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {databases.map((db) => {
            const isActive = db.name === activeDbName;

            return (
              <button
                key={db.name}
                type="button"
                onClick={() => {
                  onSelectDatabase(db.name);
                  onClose();
                }}
                className={`w-full min-h-[50px] p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-transparent hover:bg-white/5 text-[#cccccc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-xs text-white flex items-center gap-2">
                      <span>{db.name}</span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-sans">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#858585] mt-0.5">
                      SQLite 3 · {(db.sizeBytes / 1024).toFixed(1)} KB · On-device
                    </div>
                  </div>
                </div>

                {isActive && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Navigation to Database Manager */}
        <div
          className="p-3 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: theme?.border || '#2d2d2d' }}
        >
          <span className="text-[11px] text-[#858585]">Need to manage or create databases?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToDatabases();
            }}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Databases Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
