import React from 'react';
import { 
  Menu, Play, Square, Shield, ShieldAlert, Info, Search, 
  PanelLeft, PanelLeftClose, Smartphone, GitBranch 
} from 'lucide-react';
import { DatabaseConnection, ThemeConfig } from '../../types/index.ts';

interface Props {
  activeConnection: DatabaseConnection;
  isExecuting: boolean;
  onRunQuery: () => void;
  onCancelQuery: () => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  onOpenCommandPalette: () => void;
  onOpenAbout: () => void;
  onOpenPermissions?: () => void;
  onOpenConnectionPicker: () => void;
  onOpenDrawer?: () => void;
  currentBranch?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  theme?: ThemeConfig;
}

export const Header: React.FC<Props> = ({
  activeConnection,
  isExecuting,
  onRunQuery,
  onCancelQuery,
  isReadOnly,
  onToggleReadOnly,
  onOpenCommandPalette,
  onOpenAbout,
  onOpenPermissions,
  onOpenConnectionPicker,
  onOpenDrawer,
  currentBranch = 'main',
  isMobile = false,
  isTablet = false,
  isDesktop = false,
  isSidebarOpen = true,
  onToggleSidebar,
  theme,
}) => {
  const isProd = activeConnection.environment === 'prod';
  const isStaging = activeConnection.environment === 'staging';

  return (
    <header
      className="h-12 min-h-[48px] pt-[env(safe-area-inset-top,0px)] px-1.5 sm:px-3 flex items-center justify-between gap-1 select-none shrink-0 z-30 border-b transition-colors"
      style={{
        backgroundColor: theme?.bgSecondary || 'var(--theme-bg-secondary, #181818)',
        borderColor: theme?.border || 'var(--theme-border, #2d2d2d)',
        color: theme?.textPrimary || 'var(--theme-text-primary, #ffffff)',
      }}
    >
      {/* Zone 1: Hamburger (Mobile) / Sidebar Toggle (Tablet) + Logo + App Title + Env Dot */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {/* Mobile Hamburger Drawer Trigger (44px tap target) */}
        {isMobile && onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open Navigation Drawer"
            title="Open Navigation Menu"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#cccccc] hover:text-white hover:bg-[#252526] active:bg-[#333333] transition-colors shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Tablet Collapsible Sidebar Toggle */}
        {!isMobile && isTablet && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-lg text-[#9d9d9d] hover:text-white hover:bg-[#252526] transition-colors shrink-0 cursor-pointer"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-emerald-400" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-mono font-bold text-white text-xs tracking-tighter shadow-sm shrink-0">
            &gt;_
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap">
            SQL CODE
          </span>
        </div>

        {/* Connection Environment Dot (44px tap target, right beside title, never hidden) */}
        <button
          type="button"
          onClick={onOpenConnectionPicker}
          className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-lg hover:bg-[#252526] active:bg-[#333333] transition-colors shrink-0 cursor-pointer"
          title={`Connection: ${activeConnection.name} (${activeConnection.environment.toUpperCase()}). Tap to switch connection.`}
          aria-label={`Connection: ${activeConnection.name}. Tap to switch database.`}
        >
          <span
            className={`w-3 h-3 rounded-full shrink-0 transition-transform active:scale-90 ${
              isProd
                ? 'bg-red-500 shadow-sm shadow-red-500/80 ring-2 ring-red-500/40 animate-pulse'
                : isStaging
                ? 'bg-amber-400 ring-2 ring-amber-400/30'
                : 'bg-emerald-400 ring-2 ring-emerald-400/30'
            }`}
          />
        </button>

        {/* Active Branch Badge (Tablet / Desktop only) */}
        {!isMobile && (
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#222222] border border-[#333333] text-emerald-400 font-mono text-[11px] shrink-0"
            title={`Active Branch: ${currentBranch}`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-semibold truncate max-w-[90px]">{currentBranch}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation & Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* On Tablet / Desktop: Search, Permissions & Docs quick buttons */}
        {!isMobile && (
          <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
            {/* Command Palette Button */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="h-9 w-9 flex items-center justify-center rounded-lg border hover:opacity-90 transition-colors cursor-pointer"
              style={{
                backgroundColor: theme?.bgTertiary || '#252526',
                borderColor: theme?.border || '#333333',
                color: theme?.textSecondary || '#858585',
              }}
              title="Command Palette (Cmd+K / Ctrl+K)"
              aria-label="Command Palette"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Device Permissions Button */}
            {onOpenPermissions && (
              <button
                type="button"
                onClick={onOpenPermissions}
                className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-lg border hover:opacity-90 transition-colors cursor-pointer"
                style={{
                  backgroundColor: theme?.bgTertiary || '#252526',
                  borderColor: theme?.border || '#333333',
                  color: theme?.accent || '#60a5fa',
                }}
                title="Device Permissions & Offline Storage"
                aria-label="Device Permissions"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden md:inline">Device</span>
              </button>
            )}

            {/* About Button */}
            <button
              type="button"
              onClick={onOpenAbout}
              className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-lg border hover:opacity-90 transition-colors cursor-pointer"
              style={{
                backgroundColor: theme?.bgTertiary || '#252526',
                borderColor: theme?.border || '#333333',
                color: theme?.accent || '#10b981',
              }}
              title="About SQL CODE"
              aria-label="About SQL CODE"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden md:inline">About</span>
            </button>
          </div>
        )}

        {/* Read-Only Safety Toggle (Fits on 360px without crowding) */}
        <button
          type="button"
          onClick={onToggleReadOnly}
          title={isReadOnly ? 'Read-only mode active' : 'Writable mode active'}
          aria-label={isReadOnly ? 'Read-only mode active' : 'Writable mode active'}
          className={`h-9 px-2 sm:px-2.5 min-w-[46px] flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
            isReadOnly
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'hover:opacity-90'
          }`}
          style={
            !isReadOnly
              ? {
                  backgroundColor: theme?.bgTertiary || '#252526',
                  borderColor: theme?.border || '#333333',
                  color: theme?.textSecondary || '#858585',
                }
              : undefined
          }
        >
          {isReadOnly ? (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Shield className="w-3.5 h-3.5" />
          )}
          <span className="text-[11px] font-mono font-semibold">
            {isReadOnly ? 'RO' : 'RW'}
          </span>
        </button>

        {/* Primary Run / Cancel Query Action Button */}
        {isExecuting ? (
          <button
            type="button"
            onClick={onCancelQuery}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-transform active:scale-95 shadow-md shadow-red-950/40 cursor-pointer shrink-0"
            aria-label="Cancel Query Execution"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs">Cancel</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRunQuery}
            className="h-9 px-3.5 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-transform active:scale-95 shadow-md shadow-emerald-950/50 cursor-pointer shrink-0"
            aria-label="Run Query"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs font-semibold">Run</span>
          </button>
        )}
      </div>
    </header>
  );
};
