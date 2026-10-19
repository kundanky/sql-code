import React, { useEffect, useRef } from 'react';
import { 
  FolderTree, Code2, Database, GitBranch, Server, Clock, Palette, 
  Search, Smartphone, Info, X, ChevronRight, HardDrive, CheckCircle2, Trophy 
} from 'lucide-react';
import { ActiveNavTab, DatabaseConnection, ThemeConfig } from '../../types/index.ts';
import { getStorageInfo } from '../../utils/fileStorage.ts';
import { APP_INFO } from '../../config/appInfo.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  activeConnection: DatabaseConnection;
  onOpenConnectionPicker: () => void;
  onOpenCommandPalette: () => void;
  onOpenPermissions: () => void;
  onOpenAbout: () => void;
  stagedFilesCount?: number;
  theme?: ThemeConfig;
}

export const NavigationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  activeConnection,
  onOpenConnectionPicker,
  onOpenCommandPalette,
  onOpenPermissions,
  onOpenAbout,
  stagedFilesCount = 0,
  theme,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Close on Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle swipe left to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchCurrentXRef.current === null) return;
    const deltaX = touchCurrentXRef.current - touchStartXRef.current;
    if (deltaX < -45) {
      onClose();
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  const navItems = [
    { id: 'editor' as const, label: 'Editor', icon: Code2 },
    { id: 'files' as const, label: 'Files', icon: FolderTree },
    { id: 'explorer' as const, label: 'Schema', icon: Database },
    { id: 'git' as const, label: 'Source', icon: GitBranch, badge: stagedFilesCount },
    { id: 'connections' as const, label: 'Databases', icon: Server },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'settings' as const, label: 'Settings', icon: Palette },
    { id: 'practice' as const, label: 'Practice', icon: Trophy },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  const storageInfo = getStorageInfo();

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Slides from left, 80% width up to 320px) */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Drawer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative z-10 w-[80vw] max-w-[320px] h-full h-[100dvh] flex flex-col border-r shadow-2xl select-none transform transition-transform duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: theme?.bgSidebar || 'var(--theme-bg-sidebar, #121212)',
          borderColor: theme?.border || 'var(--theme-border, #2d2d2d)',
          color: theme?.textPrimary || 'var(--theme-text-primary, #ffffff)',
        }}
      >
        {/* Top Header Section */}
        <div
          className="pt-[max(12px,env(safe-area-inset-top))] px-4 pb-3 border-b shrink-0 flex flex-col gap-3"
          style={{ borderColor: theme?.border || '#2d2d2d' }}
        >
          {/* Logo, App Title, and Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-mono font-bold text-white text-sm shadow-sm shrink-0">
                &gt;_
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-none">
                  {APP_INFO.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Mobile SQL IDE
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#858585] hover:text-white hover:bg-[#252526] transition-colors relative"
              aria-label="Close navigation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Database Pill (Tap to switch databases) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenConnectionPicker();
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#262626] border border-[#333333] flex items-center justify-between transition-colors text-left group cursor-pointer"
            title="Active database. Tap to switch."
            aria-label={`Active database: ${activeConnection.name}. Tap to switch.`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-400 ring-2 ring-emerald-400/30" />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {activeConnection.name}
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#121212] text-emerald-400 shrink-0 border border-[#2d2d2d]">
                    SQLite
                  </span>
                </div>
                <span className="text-[10px] text-[#858585] font-mono truncate">
                  On-device WebAssembly instance
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-white transition-colors shrink-0 ml-1" />
          </button>
        </div>

        {/* Main Navigation Items (48px tall each) */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-[#666666] uppercase">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'about') {
                    onOpenAbout();
                  } else {
                    onChangeTab(item.id);
                  }
                  onClose();
                }}
                className={`w-full h-12 min-h-[48px] px-3.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer relative touch-manipulation ${
                  isActive
                    ? 'font-semibold text-emerald-400 shadow-sm'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'
                }`}
                style={{
                  backgroundColor: isActive
                    ? `${theme?.accent || '#10b981'}1f`
                    : 'transparent',
                  color: isActive
                    ? (theme?.accent || '#10b981')
                    : undefined,
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm tracking-tight">{item.label}</span>
                </div>

                {Boolean(item.badge && item.badge > 0) && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tools & Settings Section */}
          <div className="pt-3 pb-1 px-3 text-[10px] font-semibold tracking-wider text-[#666666] uppercase border-t border-[#252526] mt-2">
            Tools & Settings
          </div>

          {/* Search / Command Palette */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCommandPalette();
            }}
            className="w-full h-12 min-h-[48px] px-3.5 rounded-xl flex items-center gap-3 text-left text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e] transition-colors cursor-pointer touch-manipulation"
          >
            <Search className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm tracking-tight">Command Palette</span>
              <span className="text-[10px] text-[#666666]">Search & Actions (Cmd+K)</span>
            </div>
          </button>

          {/* Device Permissions & Offline Storage */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPermissions();
            }}
            className="w-full h-12 min-h-[48px] px-3.5 rounded-xl flex items-center gap-3 text-left text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e] transition-colors cursor-pointer touch-manipulation"
          >
            <Smartphone className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm tracking-tight">Permissions & Offline</span>
              <span className="text-[10px] text-[#666666]">Storage & Notifications</span>
            </div>
          </button>
        </div>

        {/* Drawer Footer Section (Single source of truth from APP_INFO) */}
        <div
          className="p-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t shrink-0 flex flex-col gap-1.5 bg-[#161616]"
          style={{ borderColor: theme?.border || '#2d2d2d' }}
        >
          <div className="flex items-center justify-between text-[11px] text-[#858585]">
            <span>{APP_INFO.name}</span>
            <span className="font-mono text-[10px] text-emerald-400">
              v{APP_INFO.version} (Build {APP_INFO.buildNumber})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#71717a]">
            <HardDrive className="w-3 h-3 text-[#52525b] shrink-0" />
            <span className="truncate">{storageInfo.location}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
