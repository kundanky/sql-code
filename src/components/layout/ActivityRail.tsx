import React from 'react';
import { 
  Folder, Database, Code2, GitBranch, Server, Clock, Palette, 
  Search, Info, Trophy 
} from 'lucide-react';
import { ActiveNavTab, ThemeConfig } from '../../types/index.ts';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  stagedFilesCount: number;
  onOpenCommandPalette: () => void;
  onOpenAbout: () => void;
  theme?: ThemeConfig;
}

export const ActivityRail: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  stagedFilesCount,
  onOpenCommandPalette,
  onOpenAbout,
  theme,
}) => {
  const navItems = [
    { id: 'files' as const, label: 'Local Files', icon: Folder },
    { id: 'editor' as const, label: 'SQL Editor', icon: Code2 },
    { id: 'explorer' as const, label: 'Schema Explorer', icon: Database },
    { id: 'practice' as const, label: 'SQL Practice', icon: Trophy },
    { id: 'git' as const, label: 'Source Control', icon: GitBranch, badge: stagedFilesCount },
    { id: 'connections' as const, label: 'Databases', icon: Server },
    { id: 'history' as const, label: 'Query History', icon: Clock },
    { id: 'settings' as const, label: 'Settings & Theme', icon: Palette },
  ];

  return (
    <aside
      aria-label="Activity Rail"
      className="w-12 border-r flex flex-col items-center justify-between py-2 shrink-0 select-none z-20 transition-colors"
      style={{
        backgroundColor: theme?.bgSidebar || 'var(--theme-bg-sidebar, #181818)',
        borderColor: theme?.border || 'var(--theme-border, #2d2d2d)',
      }}
    >
      {/* Top Primary Navigation */}
      <div className="flex flex-col items-center gap-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center relative transition-colors cursor-pointer ${
                isActive
                  ? 'font-semibold shadow-sm'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? (theme?.bgTertiary || '#252526') : 'transparent',
                color: isActive ? (theme?.accent || '#10b981') : (theme?.textSecondary || '#858585'),
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                  style={{ backgroundColor: theme?.accent || '#10b981' }}
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 px-1 text-[9px] font-bold bg-emerald-600 text-white rounded-full min-w-[15px] h-[15px] flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Secondary Actions (Command Palette & About) */}
      <div className="flex flex-col items-center gap-1 w-full pt-2 border-t border-[#2d2d2d]">
        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Cmd+K)"
          aria-label="Command Palette"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#858585] hover:text-white hover:bg-[#202020] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenAbout}
          title="About SQL CODE"
          aria-label="About SQL CODE"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-[#202020] transition-colors cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
