import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Database, Edit2, AlertCircle, Copy, Layers } from 'lucide-react';
import { EditorTab, ThemeConfig } from '../../types/index.ts';

import { validateTabName } from '../../utils/tabRename.ts';

interface Props {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs?: (id: string) => void;
  onNewTab: () => void;
  onRenameTab?: (id: string, newTitle: string) => Promise<boolean | void> | boolean | void;
  theme: ThemeConfig;
}

export const TabsBar: React.FC<Props> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onNewTab,
  onRenameTab,
  theme,
}) => {
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [renameError, setRenameError] = useState<string | null>(null);

  // Tab Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<{ tabId: string; time: number }>({ tabId: '', time: 0 });
  const longPressTimerRef = useRef<any>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  // Focus and select text when entering rename mode
  useEffect(() => {
    if (renamingTabId && inputRef.current) {
      inputRef.current.focus();
      const val = inputRef.current.value;
      const dotIndex = val.toLowerCase().lastIndexOf('.sql');
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [renamingTabId]);

  // Start renaming a tab
  const startRenaming = (tab: EditorTab) => {
    setRenamingTabId(tab.id);
    setRenameValue(tab.title);
    setRenameError(null);
    setContextMenu(null);
  };

  // Cancel renaming
  const cancelRenaming = () => {
    setRenamingTabId(null);
    setRenameError(null);
  };

  // Validate and save renamed tab
  const validateAndSave = async (tabId: string, rawName: string): Promise<boolean> => {
    const currentTab = tabs.find((t) => t.id === tabId);
    const otherTabNames = tabs
      .filter((t) => t.id !== tabId)
      .map((t) => t.title);

    const validation = validateTabName(rawName, otherTabNames);
    if (!validation.valid) {
      setRenameError(validation.error || 'Invalid tab name');
      return false;
    }

    try {
      if (typeof onRenameTab === 'function') {
        await onRenameTab(tabId, validation.finalName);
      }
      setRenamingTabId(null);
      setRenameError(null);
      return true;
    } catch (err: any) {
      setRenameError(err?.message || 'Could not rename tab');
      return false;
    }
  };

  // Click handler on tab
  const handleTabClick = (tab: EditorTab) => {
    if (renamingTabId === tab.id) return;

    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.tabId === tab.id && now - lastTapRef.current.time < 350;
    lastTapRef.current = { tabId: tab.id, time: now };

    // Double tap triggers rename
    if (isDoubleTap) {
      startRenaming(tab);
      return;
    }

    // If tab is already active, clicking its title initiates rename
    if (tab.id === activeTabId) {
      startRenaming(tab);
      return;
    }

    // Otherwise activate tab
    onSelectTab(tab.id);
  };

  // Double click handler for desktop
  const handleDoubleClick = (tab: EditorTab) => {
    startRenaming(tab);
  };

  // Right click handler for desktop
  const handleContextMenu = (tab: EditorTab, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      tabId: tab.id,
      x: Math.min(e.clientX, window.innerWidth - 170),
      y: Math.min(e.clientY, window.innerHeight - 150),
    });
  };

  // Touch handlers for mobile long-press
  const handleTouchStart = (tab: EditorTab, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({
        tabId: tab.id,
        x: Math.min(clientX, window.innerWidth - 170),
        y: Math.min(clientY, window.innerHeight - 150),
      });
    }, 480);
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div
      className="h-12 min-h-[48px] border-b flex items-stretch justify-between select-none shrink-0 relative overflow-visible"
      style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}
    >
      {/* Scrollable Tabs List: Fixed height, overflow hidden vertically and scroll horizontally */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar flex items-end px-2 gap-1.5 min-w-0 h-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isRenaming = renamingTabId === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              onDoubleClick={() => handleDoubleClick(tab)}
              onContextMenu={(e) => handleContextMenu(tab, e)}
              onTouchStart={(e) => handleTouchStart(tab, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`h-9 min-h-[36px] max-h-[36px] px-2.5 rounded-t-md flex items-center gap-1.5 text-xs font-mono transition-colors shrink-0 border-t-2 select-none relative cursor-pointer active:scale-[0.99] ${
                isActive
                  ? 'border-emerald-500 font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2a2a]'
              }`}
              style={{
                backgroundColor: isActive ? theme.bgPrimary : 'transparent',
                color: isActive ? theme.textPrimary : theme.textSecondary,
              }}
              title={isRenaming ? undefined : `${tab.title} (Tap to rename / double-click / long-press)`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />

              {/* Inline Rename Input: exactly fits inside tab height without vertical overflow */}
              {isRenaming ? (
                <div
                  className="flex items-center h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="off"
                    onChange={(e) => {
                      setRenameValue(e.target.value);
                      if (renameError) setRenameError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        validateAndSave(tab.id, renameValue);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelRenaming();
                      }
                    }}
                    onBlur={() => {
                      // Save on tapping outside
                      validateAndSave(tab.id, renameValue);
                    }}
                    className={`h-7 px-2 py-0 text-xs font-mono bg-[#141414] text-white border rounded outline-none transition-colors w-36 sm:w-44 min-w-[140px] max-w-[200px] ${
                      renameError
                        ? 'border-red-500 ring-1 ring-red-500 text-red-100'
                        : 'border-emerald-500 ring-1 ring-emerald-500/50'
                    }`}
                    aria-label="Rename Tab"
                  />
                </div>
              ) : (
                <span className="truncate max-w-[120px] sm:max-w-[170px] text-xs">
                  {tab.title}
                </span>
              )}

              {/* Unsaved Changes Indicator Dot */}
              {tab.isDirty && !isRenaming && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                  title="Unsaved changes"
                />
              )}

              {/* Tab Close Button */}
              {tabs.length > 1 && !isRenaming && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="w-5 h-5 ml-1 flex items-center justify-center rounded hover:bg-[#383838] text-[#858585] hover:text-white shrink-0 transition-colors relative before:absolute before:-inset-1 before:content-['']"
                  title="Close tab"
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pinned "+" New Tab button strictly outside the scrollable tab list with 48px fixed width */}
      <div
        className="shrink-0 h-full w-12 min-w-[48px] flex items-center justify-center border-l"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onNewTab}
          aria-label="New Query Tab"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#858585] hover:text-white hover:bg-[#333333] transition-colors shrink-0 relative before:absolute before:-inset-1.5 before:content-['']"
          title="New Query Buffer (Cmd+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Error Tooltip: Rendered directly under the tab bar, outside the scroll container, never clipped */}
      {renameError && (
        <div
          role="alert"
          className="absolute top-full left-3 sm:left-4 z-50 mt-1.5 px-3 py-1.5 bg-red-950/95 border border-red-500 text-red-100 text-xs rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-none animate-in fade-in"
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="font-sans font-medium">{renameError}</span>
        </div>
      )}

      {/* Tab Context Menu (Right-Click / Long-Press Fallback) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          className="fixed z-50 w-44 bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl py-1 text-xs select-none animate-in fade-in duration-100"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {/* Rename option */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const target = tabs.find((t) => t.id === contextMenu.tabId);
              if (target) startRenaming(target);
            }}
            className="w-full h-9 px-3 flex items-center gap-2.5 text-left text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rename Tab</span>
          </button>

          {/* New Tab option */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setContextMenu(null);
              onNewTab();
            }}
            className="w-full h-9 px-3 flex items-center gap-2.5 text-left text-[#cccccc] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Tab</span>
          </button>

          {/* Close Tab option */}
          {tabs.length > 1 && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const id = contextMenu.tabId;
                setContextMenu(null);
                onCloseTab(id);
              }}
              className="w-full h-9 px-3 flex items-center gap-2.5 text-left text-[#cccccc] hover:bg-[#2a2a2a] transition-colors cursor-pointer border-t border-[#2d2d2d]"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              <span>Close Tab</span>
            </button>
          )}

          {/* Close Other Tabs option */}
          {tabs.length > 1 && onCloseOtherTabs && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const id = contextMenu.tabId;
                setContextMenu(null);
                onCloseOtherTabs(id);
              }}
              className="w-full h-9 px-3 flex items-center gap-2.5 text-left text-[#cccccc] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Close Other Tabs</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
