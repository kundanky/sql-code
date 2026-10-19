import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, AlignLeft, Plus, Shield, Palette, Info, 
  Server, Smartphone, Folder, Save, GitBranch, Trophy 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunQuery: () => void;
  onRunCurrentStatement?: () => void;
  onRunExplain: () => void;
  onFormatSql: () => void;
  onNewTab: () => void;
  onToggleReadOnly: () => void;
  onOpenAbout: () => void;
  onOpenPermissions?: () => void;
  onSelectTab: (tab: any) => void;
  onSaveFile?: () => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onRunQuery,
  onRunCurrentStatement,
  onRunExplain,
  onFormatSql,
  onNewTab,
  onToggleReadOnly,
  onOpenAbout,
  onOpenPermissions,
  onSelectTab,
  onSaveFile,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    {
      id: 'save-file',
      title: 'Save File',
      subtitle: 'Save active SQL script to local storage',
      icon: Save,
      shortcut: '⌘S',
      action: () => { onSaveFile?.(); onClose(); }
    },
    {
      id: 'open-files',
      title: 'Local Files Explorer',
      subtitle: 'Browse on-device file tree, import and export',
      icon: Folder,
      action: () => { onSelectTab('files'); onClose(); }
    },
    {
      id: 'source-control',
      title: 'Open Source Control (Git)',
      subtitle: 'Commit, branch, merge, and diff tracking',
      icon: GitBranch,
      action: () => { onSelectTab('git'); onClose(); }
    },
    {
      id: 'sql-practice',
      title: 'SQL Practice Arena',
      subtitle: '30 offline challenges across 3 difficulty levels',
      icon: Trophy,
      action: () => { onSelectTab('practice'); onClose(); }
    },
    {
      id: 'run-query',
      title: 'Run Query',
      subtitle: 'Execute active editor tab or highlighted selection',
      icon: Play,
      shortcut: '⌘Enter',
      action: () => { onRunQuery(); onClose(); }
    },
    {
      id: 'run-current-statement',
      title: 'Run Current Statement',
      subtitle: 'Execute SQL statement at cursor delimited by semicolons',
      icon: Play,
      action: () => { onRunCurrentStatement?.(); onClose(); }
    },
    {
      id: 'run-explain',
      title: 'Run EXPLAIN Plan',
      subtitle: 'Analyze SQLite query planner execution steps',
      icon: Search,
      shortcut: '⌥E',
      action: () => { onRunExplain(); onClose(); }
    },
    {
      id: 'format-sql',
      title: 'Format SQL Document',
      subtitle: 'Prettify SQL keywords and indentation',
      icon: AlignLeft,
      shortcut: '⇧⌥F',
      action: () => { onFormatSql(); onClose(); }
    },
    {
      id: 'new-tab',
      title: 'New Query Tab',
      subtitle: 'Open an empty SQL query buffer',
      icon: Plus,
      shortcut: '⌘T',
      action: () => { onNewTab(); onClose(); }
    },
    {
      id: 'toggle-readonly',
      title: 'Toggle Read-Only Mode',
      subtitle: 'Protect against accidental UPDATE/DELETE/DROP mutations',
      icon: Shield,
      action: () => { onToggleReadOnly(); onClose(); }
    },
    {
      id: 'switch-connections',
      title: 'Manage SQLite Databases',
      subtitle: 'Switch, create, rename, or import local databases',
      icon: Server,
      action: () => { onSelectTab('connections'); onClose(); }
    },
    {
      id: 'device-permissions',
      title: 'Device Permissions & Offline Storage',
      subtitle: 'Persistent storage and native device capabilities',
      icon: Smartphone,
      action: () => { onOpenPermissions?.(); onClose(); }
    },
    {
      id: 'switch-themes',
      title: 'Theme Studio & Colors',
      subtitle: 'VS Code Dark, High Contrast, or Custom Themes',
      icon: Palette,
      action: () => { onSelectTab('settings'); onClose(); }
    },
    {
      id: 'open-about',
      title: 'About SQL CODE',
      subtitle: 'Version 1.2.0, changelog, privacy pledge, and licenses',
      icon: Info,
      action: () => { onOpenAbout(); onClose(); }
    }
  ];

  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-[#252526] border border-[#333333] text-[#cccccc] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#333333] bg-[#1e1e1e]">
          <Search className="w-4 h-4 text-[#858585] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-white placeholder-[#858585] text-xs focus:outline-none"
          />
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#858585]">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full p-2.5 rounded-lg flex items-center justify-between hover:bg-[#333333] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#858585] group-hover:text-white shrink-0" />
                    <div>
                      <div className="text-white text-xs font-medium">{cmd.title}</div>
                      <div className="text-[11px] text-[#858585]">{cmd.subtitle}</div>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333333] text-[#858585]">
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 border-t border-[#333333] bg-[#1e1e1e] flex items-center justify-between text-[11px] text-[#858585]">
          <span>Navigation Shortcuts</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
