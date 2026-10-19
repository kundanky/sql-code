import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { 
  DEFAULT_CONNECTIONS, DEFAULT_TABS, DEFAULT_TYPOGRAPHY, THEMES 
} from './data/defaultData.ts';
import { 
  ActiveNavTab, DatabaseConnection, DatabaseSchema, 
  EditorTab, ExplainPlanNode, FileItem, QueryHistoryItem, 
  QueryResult, ThemeConfig, TypographySettings 
} from './types/index.ts';
import { sqliteManager, LocalDbMeta } from './utils/sqliteManager.ts';
import { isWriteStatement } from './utils/sqliteCore.ts';
import { analyzeSqlSafety, SqlSafetyCheck } from './utils/sqlSafety.ts';
import { offlineStorage } from './utils/indexedDBStorage.ts';
import { initStorage, readFile, saveFile, renameItem } from './utils/fileStorage.ts';
import { usePWA } from './hooks/usePWA.ts';
import { useResponsiveLayout } from './hooks/useResponsiveLayout.ts';
import { Header } from './components/layout/Header.tsx';
import { ActivityRail } from './components/layout/ActivityRail.tsx';
import { NavigationDrawer } from './components/layout/NavigationDrawer.tsx';
import { CommandPalette } from './components/layout/CommandPalette.tsx';
import { TabsBar } from './components/editor/TabsBar.tsx';
import { SqlEditor, SqlEditorHandle } from './components/editor/SqlEditor.tsx';
import { ResultsContainer } from './components/results/ResultsContainer.tsx';
import { SchemaExplorer } from './components/schema/SchemaExplorer.tsx';
import { FileExplorer } from './components/files/FileExplorer.tsx';
import { ConnectionManager } from './components/connections/ConnectionManager.tsx';
import { ConnectionPickerSheet } from './components/connections/ConnectionPickerSheet.tsx';
import { GitSourceControl } from './components/git/GitSourceControl.tsx';
import { ThemeStudio } from './components/theming/ThemeStudio.tsx';
import { QueryHistoryView } from './components/history/QueryHistoryView.tsx';
import { SqlPracticeView } from './components/practice/SqlPracticeView.tsx';
import { DestructiveConfirmModal } from './components/safety/DestructiveConfirmModal.tsx';
import { AboutModal } from './components/about/AboutModal.tsx';
import { DevicePermissionsModal } from './components/permissions/DevicePermissionsModal.tsx';
import { UpdateAvailableToast } from './components/layout/UpdateAvailableToast.tsx';
import { OfflineBanner } from './components/layout/OfflineBanner.tsx';
import { sendLocalNotification } from './utils/devicePermissions.ts';

const EMPTY_INITIAL_SCHEMA: DatabaseSchema = {
  name: 'main',
  tables: [],
  views: [],
  procedures: [],
};

export default function App() {
  // PWA Lifecycle & Offline state
  const { isOnline, updateAvailable, applyUpdate, dismissUpdate } = usePWA();
  const [isStorageInitialized, setIsStorageInitialized] = useState<boolean>(false);

  // Responsive Layout detection (Mobile <768px, Tablet 768-1199px, Desktop >=1200px)
  const { isMobile, isTablet, isDesktop, tabletSidebarOpen, toggleTabletSidebar } = useResponsiveLayout();

  // Navigation Drawer & Connection Picker state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isConnectionPickerOpen, setIsConnectionPickerOpen] = useState<boolean>(false);

  // Active database state
  const [activeDbName, setActiveDbName] = useState<string>('main');
  const activeConnection: DatabaseConnection = {
    id: activeDbName,
    name: activeDbName,
    type: 'sqlite',
    host: 'localhost',
    port: 0,
    database: `${activeDbName}.sqlite`,
    username: 'sqlite_wasm',
    ssl: 'disable',
    sshTunnel: { enabled: false, host: '', port: 22, username: '', authType: 'password' },
    environment: 'dev',
    readOnly: false,
    color: '#10b981',
    createdAt: new Date().toISOString(),
  };

  // Editor ref for active execution
  const editorRef = useRef<SqlEditorHandle | null>(null);

  // Safety & Read-Only
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [pendingDestructiveCheck, setPendingDestructiveCheck] = useState<SqlSafetyCheck | null>(null);
  const [pendingQueryToExecute, setPendingQueryToExecute] = useState<string | null>(null);

  // Tabs & Editor state (Default: single empty Untitled-1.sql tab)
  const [tabs, setTabs] = useState<EditorTab[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('tab-untitled-1');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || DEFAULT_TABS[0];

  // Results & Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<QueryResult | undefined>();
  const [currentExplainPlan, setCurrentExplainPlan] = useState<ExplainPlanNode | undefined>();
  const [executionError, setExecutionError] = useState<string | undefined>();
  const [isResultsExpanded, setIsResultsExpanded] = useState<boolean>(false);

  // Navigation, Theme & Settings
  const [activeNavTab, setActiveNavTab] = useState<ActiveNavTab>('editor');
  const [theme, setTheme] = useState<ThemeConfig>(THEMES[0]);
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);

  // Real Git state
  const [currentBranch, setCurrentBranch] = useState<string>('main');

  // Query History
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);

  // Real Database Schema from SQLite WebAssembly
  const [schema, setSchema] = useState<DatabaseSchema>(EMPTY_INITIAL_SCHEMA);

  // Sync theme colors with CSS variables, body element and meta theme-color tag
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-primary', theme.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', theme.bgSecondary);
    root.style.setProperty('--theme-bg-tertiary', theme.bgTertiary);
    root.style.setProperty('--theme-bg-sidebar', theme.bgSidebar);
    root.style.setProperty('--theme-border', theme.border);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-accent', theme.accent);
    if (theme.syntax) {
      root.style.setProperty('--theme-syntax-keyword', theme.syntax.keyword);
      root.style.setProperty('--theme-syntax-string', theme.syntax.string);
      root.style.setProperty('--theme-syntax-function', theme.syntax.function);
      root.style.setProperty('--theme-syntax-number', theme.syntax.number);
      root.style.setProperty('--theme-syntax-comment', theme.syntax.comment);
      root.style.setProperty('--theme-syntax-operator', theme.syntax.operator);
      root.style.setProperty('--theme-syntax-variable', theme.syntax.variable);
      root.style.setProperty('--theme-syntax-type', theme.syntax.type);
    }
    document.body.style.backgroundColor = theme.bgSidebar;
    document.body.style.color = theme.textPrimary;

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.bgSidebar);
    }
  }, [theme]);

  // Global Keyboard Shortcuts (Cmd/Ctrl + K for Command Palette, Cmd/Ctrl + S for Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  // Restore state from IndexedDB on initial launch & initialize on-device storage & SQLite
  useEffect(() => {
    async function loadOfflineStorage() {
      try {
        await initStorage();
        const [
          savedTabs, savedActiveTabId, savedTheme, savedTypo, savedHist
        ] = await Promise.all([
          offlineStorage.getItem<EditorTab[]>('tabs', DEFAULT_TABS),
          offlineStorage.getItem<string>('activeTabId', 'tab-untitled-1'),
          offlineStorage.getItem<ThemeConfig>('theme', THEMES[0]),
          offlineStorage.getItem<TypographySettings>('typography', DEFAULT_TYPOGRAPHY),
          offlineStorage.getItem<QueryHistoryItem[]>('history', []),
        ]);

        if (savedTabs && savedTabs.length > 0) {
          setTabs(savedTabs);
          if (savedActiveTabId && savedTabs.some((t) => t.id === savedActiveTabId)) {
            setActiveTabId(savedActiveTabId);
          } else {
            setActiveTabId(savedTabs[0].id);
          }
        }
        if (savedTheme) setTheme(savedTheme);
        if (savedTypo) setTypography(savedTypo);
        if (savedHist && savedHist.length > 0) setHistory(savedHist);

        // Initialize Real SQLite WebAssembly engine and extract schema
        const realSchema = await sqliteManager.init();
        setActiveDbName(sqliteManager.getActiveDbName());
        setSchema(realSchema);
      } catch (err) {
        console.warn('[Storage] Could not restore state from IndexedDB:', err);
      } finally {
        setIsStorageInitialized(true);
      }
    }

    loadOfflineStorage();
  }, []);

  // Save changes to IndexedDB (drafts autosave)
  useEffect(() => {
    if (!isStorageInitialized) return;

    const timeout = setTimeout(() => {
      offlineStorage.setItem('tabs', tabs);
      offlineStorage.setItem('activeTabId', activeTabId);
      offlineStorage.setItem('theme', theme);
      offlineStorage.setItem('typography', typography);
      offlineStorage.setItem('history', history);
    }, 400);

    return () => clearTimeout(timeout);
  }, [tabs, activeTabId, theme, typography, history, isStorageInitialized]);

  // Mobile Edge-Swipe from left to open Drawer
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let isTrackingEdge = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch && touch.clientX <= 30) {
        startX = touch.clientX;
        startY = touch.clientY;
        isTrackingEdge = true;
      } else {
        isTrackingEdge = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTrackingEdge) return;
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      if (deltaX > 45 && deltaY < 60) {
        setIsDrawerOpen(true);
        isTrackingEdge = false;
      }
    };

    const onTouchEnd = () => {
      isTrackingEdge = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isMobile]);

  // Android Back-Button Handling via Capacitor App Plugin
  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const setupBackButton = async () => {
      try {
        const listener = await CapApp.addListener('backButton', () => {
          if (isDrawerOpen) {
            setIsDrawerOpen(false);
            return;
          }
          if (isConnectionPickerOpen) {
            setIsConnectionPickerOpen(false);
            return;
          }
          if (isCommandPaletteOpen) {
            setIsCommandPaletteOpen(false);
            return;
          }
          if (isAboutOpen) {
            setIsAboutOpen(false);
            return;
          }
          if (isPermissionsOpen) {
            setIsPermissionsOpen(false);
            return;
          }
          if (pendingDestructiveCheck) {
            setPendingDestructiveCheck(null);
            setPendingQueryToExecute(null);
            return;
          }
          if (activeNavTab !== 'editor') {
            setActiveNavTab('editor');
            return;
          }
          CapApp.exitApp();
        });
        removeListener = () => listener.remove();
      } catch {
        // Not running in native Capacitor shell
      }
    };

    setupBackButton();
    return () => {
      if (removeListener) removeListener();
    };
  }, [
    isDrawerOpen,
    isConnectionPickerOpen,
    isCommandPaletteOpen,
    isAboutOpen,
    isPermissionsOpen,
    pendingDestructiveCheck,
    activeNavTab,
  ]);

  // Tab operations
  const handleSelectTab = (id: string) => setActiveTabId(id);

  const handleCloseTab = (id: string) => {
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  const handleCloseOtherTabs = (id: string) => {
    const keep = tabs.filter((t) => t.id === id);
    setTabs(keep);
    setActiveTabId(id);
  };

  const handleNewTab = () => {
    const newId = `tab-untitled-${Date.now()}`;
    const newTab: EditorTab = {
      id: newId,
      title: `Untitled-${tabs.length + 1}.sql`,
      content: '',
      dialect: 'sqlite',
      connectionId: activeDbName,
      isDirty: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  // Tab Rename implementation
  const handleRenameTab = async (tabId: string, newTitle: string) => {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (!targetTab) return;

    let updatedFilePath = targetTab.filePath;
    if (targetTab.filePath) {
      const lastSlash = targetTab.filePath.lastIndexOf('/');
      const dir = lastSlash >= 0 ? targetTab.filePath.substring(0, lastSlash) : '/projects/Default';
      updatedFilePath = `${dir}/${newTitle}`;

      if (targetTab.filePath !== updatedFilePath) {
        try {
          await renameItem(targetTab.filePath, updatedFilePath);
        } catch (err) {
          console.warn('Could not rename physical file:', err);
          throw new Error('Failed to rename file in storage');
        }
      }
    }

    const updatedTabs = tabs.map((t) =>
      t.id === tabId ? { ...t, title: newTitle, filePath: updatedFilePath } : t
    );
    setTabs(updatedTabs);
    await offlineStorage.setItem('tabs', updatedTabs);
  };

  const handleUpdateContent = (newContent: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, content: newContent, isDirty: true } : t))
    );
  };

  // Open file from local Files explorer tree
  const handleOpenFile = async (file: FileItem) => {
    const existing = tabs.find((t) => t.filePath === file.path);
    if (existing) {
      setActiveTabId(existing.id);
      setActiveNavTab('editor');
      return;
    }

    try {
      const fileContent = await readFile(file.path);
      const newTab: EditorTab = {
        id: `tab-file-${Date.now()}`,
        title: file.name,
        content: fileContent,
        dialect: 'sqlite',
        connectionId: activeDbName,
        isDirty: false,
        filePath: file.path,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setActiveNavTab('editor');
    } catch (err) {
      console.warn('Could not read file:', err);
    }
  };

  // Save current active tab to file storage
  const handleSaveCurrentFile = async () => {
    if (!activeTab) return;
    try {
      let targetPath = activeTab.filePath;
      if (!targetPath) {
        targetPath = `/projects/Default/${activeTab.title}`;
      }
      await saveFile(targetPath, activeTab.content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab.id ? { ...t, filePath: targetPath, isDirty: false } : t
        )
      );
      sendLocalNotification('SQL CODE', {
        body: `Saved ${activeTab.title} to local storage`,
      });
    } catch (err) {
      console.warn('Could not save file:', err);
    }
  };

  // Schema click to insert SQL
  const handleInsertQueryFromSchema = (snippet: string) => {
    handleUpdateContent(activeTab.content ? `${activeTab.content}\n\n${snippet}` : snippet);
    setActiveNavTab('editor');
  };

  // Real SQLite Query Execution via Web Worker
  const executeQueryInternal = async (query: string) => {
    setIsExecuting(true);
    setExecutionError(undefined);
    setIsResultsExpanded(true);

    try {
      const outcome = await sqliteManager.execute(query, { isReadOnly });

      if (outcome.error) {
        setExecutionError(outcome.error);
        setCurrentResult(undefined);
        setCurrentExplainPlan(undefined);

        setHistory((prev) => [
          {
            id: `hist-${Date.now()}`,
            query,
            connectionName: activeDbName,
            databaseType: 'sqlite',
            executionTimeMs: outcome.executionTimeMs || 0,
            rowCount: 0,
            status: 'error',
            errorMessage: outcome.error,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setCurrentResult(outcome.result);
        setCurrentExplainPlan(outcome.explainPlan);

        // Update real schema if altered or mutated
        if (outcome.freshSchema) {
          setSchema(outcome.freshSchema);
        }

        setHistory((prev) => [
          {
            id: `hist-${Date.now()}`,
            query,
            connectionName: activeDbName,
            databaseType: 'sqlite',
            executionTimeMs: outcome.executionTimeMs || 0,
            rowCount: outcome.result?.rowCount || 0,
            status: 'success',
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setExecutionError(err?.message || 'Query execution failed');
      setCurrentResult(undefined);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunQuery = (optionalQueryToRun?: string) => {
    const query = (optionalQueryToRun || activeTab.content).trim();
    if (!query) return;

    // Check read-only mode
    if (isReadOnly && isWriteStatement(query)) {
      setExecutionError('Database is in Read-Only mode. Write operations are blocked.');
      setIsResultsExpanded(true);
      return;
    }

    // Check destructive query safety guard
    const safety = analyzeSqlSafety(query);
    if (safety.isDestructive) {
      setPendingDestructiveCheck(safety);
      setPendingQueryToExecute(query);
      return;
    }

    executeQueryInternal(query);
  };

  const handleCancelQuery = async () => {
    setIsExecuting(false);
    setExecutionError('Query execution cancelled by user.');
    await sqliteManager.cancelQuery();
  };

  // Switch database
  const handleSwitchDatabase = async (dbName: string) => {
    try {
      const freshSchema = await sqliteManager.switchDatabase(dbName);
      setActiveDbName(dbName);
      setSchema(freshSchema);
      setCurrentResult(undefined);
      setCurrentExplainPlan(undefined);
      setExecutionError(undefined);
    } catch (err: any) {
      console.error('Failed to switch database:', err);
    }
  };

  // Seed sample data
  const handleSeedSampleData = async () => {
    try {
      const freshSchema = await sqliteManager.seedSampleData();
      setSchema(freshSchema);
      // Run quick count query to show results immediately
      handleRunQuery('SELECT * FROM products LIMIT 10;');
    } catch (err: any) {
      console.error('Failed to seed sample data:', err);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: theme.bgSidebar,
        color: theme.textPrimary,
      }}
    >
      {/* Offline Alert Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* PWA Update Notice */}
      <UpdateAvailableToast
        isOpen={updateAvailable}
        onApplyUpdate={applyUpdate}
        onDismiss={dismissUpdate}
      />

      {/* Top Header with Hamburger on Mobile, Logo, Title, Env Dot, RW Toggle, and Run Button */}
      <Header
        activeConnection={activeConnection}
        isExecuting={isExecuting}
        onRunQuery={() => {
          if (editorRef.current) {
            editorRef.current.runSelectionOrFull();
          } else {
            handleRunQuery();
          }
        }}
        onCancelQuery={handleCancelQuery}
        isReadOnly={isReadOnly}
        onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenConnectionPicker={() => setIsConnectionPickerOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        currentBranch={currentBranch}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
        isSidebarOpen={tabletSidebarOpen}
        onToggleSidebar={toggleTabletSidebar}
        theme={theme}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Activity Rail on Tablet & Desktop */}
        {!isMobile && (
          <ActivityRail
            activeTab={activeNavTab}
            onChangeTab={setActiveNavTab}
            stagedFilesCount={0}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
            theme={theme}
          />
        )}

        {/* View Routing */}
        {activeNavTab === 'files' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="files">
            <FileExplorer
              onOpenFile={handleOpenFile}
              activeFilePath={activeTab?.filePath}
              theme={theme}
            />
          </div>
        ) : activeNavTab === 'editor' ? (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Desktop persistent sidebar: Schema Explorer alongside editor */}
            {isDesktop && (
              <div
                className="w-72 border-r flex flex-col min-h-0 shrink-0 transition-colors"
                style={{ borderColor: theme.border }}
              >
                <SchemaExplorer
                  schema={schema}
                  onInsertQuery={handleInsertQueryFromSchema}
                  onSeedSampleData={handleSeedSampleData}
                  theme={theme}
                />
              </div>
            )}

            {/* Tablet collapsible sidebar: shown when open */}
            {isTablet && tabletSidebarOpen && (
              <div
                className="w-72 border-r flex flex-col min-h-0 shrink-0 animate-tab-transition transition-colors"
                style={{ borderColor: theme.border }}
              >
                <SchemaExplorer
                  schema={schema}
                  onInsertQuery={handleInsertQueryFromSchema}
                  onSeedSampleData={handleSeedSampleData}
                  theme={theme}
                />
              </div>
            )}

            {/* Editor buffer, CodeMirror 6 with live syntax highlighting, touch shortcut bar and results panel */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition">
              <TabsBar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                onCloseOtherTabs={handleCloseOtherTabs}
                onNewTab={handleNewTab}
                onRenameTab={handleRenameTab}
                theme={theme}
              />
              <SqlEditor
                ref={editorRef}
                key={activeTab.id}
                content={activeTab.content}
                onChangeContent={handleUpdateContent}
                dialect={activeTab.dialect}
                onChangeDialect={(d) => {
                  setTabs((prev) => {
                    const active = prev.find((t) => t.id === activeTabId) || prev[0];
                    if (!active) return prev;
                    return prev.map((t) => (t.id === active.id ? { ...t, dialect: d } : t));
                  });
                }}
                schema={schema}
                theme={theme}
                typography={typography}
                onRunQuery={handleRunQuery}
                onSaveFile={handleSaveCurrentFile}
                onRefreshSchema={async () => {
                  const s = await sqliteManager.getSchema();
                  setSchema(s);
                }}
                isDirty={activeTab.isDirty}
              />
              <ResultsContainer
                result={currentResult}
                explainPlan={currentExplainPlan}
                error={executionError}
                isExecuting={isExecuting}
                theme={theme}
                isExpanded={isResultsExpanded}
                onToggleExpand={() => setIsResultsExpanded(!isResultsExpanded)}
              />
            </div>
          </div>
        ) : activeNavTab === 'explorer' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="explorer">
            <SchemaExplorer
              schema={schema}
              onInsertQuery={handleInsertQueryFromSchema}
              onSeedSampleData={handleSeedSampleData}
              theme={theme}
            />
          </div>
        ) : activeNavTab === 'practice' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="practice">
            <SqlPracticeView theme={theme} onClose={() => setActiveNavTab('editor')} />
          </div>
        ) : activeNavTab === 'git' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="git">
            <GitSourceControl
              currentBranch={currentBranch}
              onBranchChange={setCurrentBranch}
              theme={theme}
            />
          </div>
        ) : activeNavTab === 'connections' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="connections">
            <ConnectionManager
              activeDbName={activeDbName}
              onSwitchDatabase={handleSwitchDatabase}
              onRefreshSchema={async () => {
                const s = await sqliteManager.getSchema();
                setSchema(s);
              }}
              onSeedSampleData={handleSeedSampleData}
              theme={theme}
            />
          </div>
        ) : activeNavTab === 'history' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="history">
            <QueryHistoryView
              history={history}
              onRestoreQuery={(q) => {
                handleUpdateContent(q);
                setActiveNavTab('editor');
              }}
              onClearHistory={() => setHistory([])}
              onTogglePin={(id) => {
                setHistory((prev) =>
                  prev.map((h) => (h.id === id ? { ...h, isPinned: !h.isPinned } : h))
                );
              }}
              onDeleteHistoryItem={(id) => {
                setHistory((prev) => prev.filter((h) => h.id !== id));
              }}
              theme={theme}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-transition" key="settings">
            <ThemeStudio
              currentTheme={theme}
              onSelectTheme={setTheme}
              typography={typography}
              onChangeTypography={setTypography}
              onOpenAbout={() => setIsAboutOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Left Slide-out Navigation Drawer on Mobile (<768px) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeNavTab}
        onChangeTab={(tab) => {
          setActiveNavTab(tab);
          setIsDrawerOpen(false);
        }}
        activeConnection={activeConnection}
        onOpenConnectionPicker={() => setIsConnectionPickerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        stagedFilesCount={0}
        theme={theme}
      />

      {/* Database Connection Picker Bottom Sheet */}
      <ConnectionPickerSheet
        isOpen={isConnectionPickerOpen}
        onClose={() => setIsConnectionPickerOpen(false)}
        activeDbName={activeDbName}
        onSelectDatabase={handleSwitchDatabase}
        onNavigateToDatabases={() => {
          setActiveNavTab('connections');
        }}
        theme={theme}
      />

      {/* Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRunQuery={() => {
          if (editorRef.current) {
            editorRef.current.runSelectionOrFull();
          } else {
            handleRunQuery();
          }
        }}
        onRunCurrentStatement={() => {
          if (editorRef.current) {
            editorRef.current.runCurrentStatement();
          } else {
            handleRunQuery();
          }
        }}
        onRunExplain={() => {
          const query = activeTab.content.trim();
          const explainQuery = query.startsWith('EXPLAIN') ? query : `EXPLAIN QUERY PLAN ${query}`;
          handleRunQuery(explainQuery);
        }}
        onFormatSql={() => {
          if (editorRef.current) {
            editorRef.current.formatSql();
          }
        }}
        onNewTab={handleNewTab}
        onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onSelectTab={(tab) => setActiveNavTab(tab)}
        onSaveFile={handleSaveCurrentFile}
      />

      {/* Destructive Query Confirmation Safety Gate */}
      {pendingDestructiveCheck && pendingQueryToExecute && (
        <DestructiveConfirmModal
          isOpen={true}
          safetyCheck={pendingDestructiveCheck}
          sqlSnippet={pendingQueryToExecute}
          onConfirm={() => {
            const q = pendingQueryToExecute;
            setPendingDestructiveCheck(null);
            setPendingQueryToExecute(null);
            executeQueryInternal(q);
          }}
          onCancel={() => {
            setPendingDestructiveCheck(null);
            setPendingQueryToExecute(null);
          }}
        />
      )}

      {/* About Screen Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        theme={theme}
      />

      {/* Device Permissions & Native Specs Modal */}
      {isPermissionsOpen && (
        <DevicePermissionsModal
          isOpen={true}
          onClose={() => setIsPermissionsOpen(false)}
          theme={theme}
          tabs={tabs}
          connections={[activeConnection]}
          history={history}
          schema={schema}
          onRestoreBackup={(data) => {
            if (data.tabs) setTabs(data.tabs);
            if (data.history) setHistory(data.history);
          }}
        />
      )}
    </div>
  );
}
