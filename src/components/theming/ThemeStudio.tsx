import React, { useState } from 'react';
import { Palette, Check, Upload, Type, Info, Smartphone } from 'lucide-react';
import { ThemeConfig, TypographySettings } from '../../types/index.ts';
import { THEMES } from '../../data/defaultData.ts';
import { Picker } from '../common/Picker.tsx';

interface Props {
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeConfig) => void;
  typography: TypographySettings;
  onChangeTypography: (typo: TypographySettings) => void;
  onOpenAbout?: () => void;
}

export const ThemeStudio: React.FC<Props> = ({
  currentTheme,
  onSelectTheme,
  typography,
  onChangeTypography,
  onOpenAbout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'themes' | 'custom' | 'typography'>('themes');
  const [customTheme, setCustomTheme] = useState<ThemeConfig>({ ...currentTheme });
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleImportJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      const imported: ThemeConfig = {
        id: `custom-imported-${Date.now()}`,
        name: parsed.name || 'Imported VS Code Theme',
        isDark: parsed.type !== 'light',
        bgPrimary: parsed.colors?.['editor.background'] || '#1e1e1e',
        bgSecondary: parsed.colors?.['sideBar.background'] || '#252526',
        bgTertiary: parsed.colors?.['activityBar.background'] || '#2d2d2d',
        bgSidebar: parsed.colors?.['sideBar.background'] || '#181818',
        border: parsed.colors?.['panel.border'] || '#333333',
        textPrimary: parsed.colors?.['editor.foreground'] || '#cccccc',
        textSecondary: '#858585',
        textMuted: '#6e7681',
        accent: parsed.colors?.['focusBorder'] || '#10b981',
        syntax: {
          keyword: '#10b981',
          string: '#34d399',
          function: '#6ee7b7',
          number: '#a7f3d0',
          comment: '#6b7280',
          operator: '#d1d5db',
          variable: '#93c5fd',
          type: '#38bdf8',
        },
      };

      onSelectTheme(imported);
      setJsonInput('');
      setActiveSubTab('themes');
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON format');
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 p-3 sm:p-5 overflow-y-auto text-xs transition-colors select-none"
      style={{
        backgroundColor: currentTheme.bgPrimary,
        color: currentTheme.textPrimary,
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b mb-4 transition-colors"
        style={{ borderColor: currentTheme.border }}
      >
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: currentTheme.textPrimary }}>
            <Palette className="w-5 h-5 text-emerald-400" />
            Settings & Customization
          </h2>
          <p className="text-[11px]" style={{ color: currentTheme.textSecondary }}>
            Choose color themes, customize typography, and inspect app info.
          </p>
        </div>

        {/* Subtabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border w-full sm:w-auto overflow-x-auto transition-colors"
          style={{
            backgroundColor: currentTheme.bgSecondary,
            borderColor: currentTheme.border,
          }}
        >
          <button
            onClick={() => setActiveSubTab('themes')}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
            style={{
              backgroundColor: activeSubTab === 'themes' ? currentTheme.bgTertiary : 'transparent',
              color: activeSubTab === 'themes' ? currentTheme.textPrimary : currentTheme.textSecondary,
            }}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveSubTab('custom')}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
            style={{
              backgroundColor: activeSubTab === 'custom' ? currentTheme.bgTertiary : 'transparent',
              color: activeSubTab === 'custom' ? currentTheme.textPrimary : currentTheme.textSecondary,
            }}
          >
            Customizer
          </button>
          <button
            onClick={() => setActiveSubTab('typography')}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer"
            style={{
              backgroundColor: activeSubTab === 'typography' ? currentTheme.bgTertiary : 'transparent',
              color: activeSubTab === 'typography' ? currentTheme.textPrimary : currentTheme.textSecondary,
            }}
          >
            Typography
          </button>
        </div>
      </div>

      {/* Subtab 1: Themes */}
      {activeSubTab === 'themes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {THEMES.map((th) => {
              const isSelected = currentTheme.id === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => onSelectTheme(th)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:border-[#555555]'
                  }`}
                  style={{
                    backgroundColor: th.bgSecondary,
                    borderColor: isSelected ? currentTheme.accent : th.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{th.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Palette preview swatches */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: th.bgPrimary }} />
                    <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: th.bgSidebar }} />
                    <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: th.accent }} />
                    <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: th.syntax.keyword }} />
                    <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: th.syntax.string }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* About Screen Trigger */}
          {onOpenAbout && (
            <div
              className="mt-6 p-4 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: currentTheme.bgSecondary,
                borderColor: currentTheme.border,
              }}
            >
              <div>
                <h4 className="font-semibold text-white text-xs">About SQL CODE</h4>
                <p className="text-[11px] text-[#858585]">
                  Changelog, privacy pledge, licenses, and developer credits.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAbout}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs transition-colors cursor-pointer"
              >
                Open About
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Custom Theme Builder */}
      {activeSubTab === 'custom' && (
        <div className="space-y-4 max-w-xl">
          <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: currentTheme.bgSecondary, borderColor: currentTheme.border }}>
            <h3 className="font-semibold text-white text-sm">Theme Colors</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#858585] mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.accent}
                    onChange={(e) => setCustomTheme({ ...customTheme, accent: e.target.value })}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                  <span className="font-mono text-[11px]">{customTheme.accent}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#858585] mb-1">Keyword Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.syntax.keyword}
                    onChange={(e) =>
                      setCustomTheme({
                        ...customTheme,
                        syntax: { ...customTheme.syntax, keyword: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                  <span className="font-mono text-[11px]">{customTheme.syntax.keyword}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTheme(customTheme)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Apply Custom Theme
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: currentTheme.bgSecondary, borderColor: currentTheme.border }}>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Import VS Code Theme JSON
            </h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "name": "Custom Dark",\n  "colors": {\n    "editor.background": "#121212"\n  }\n}`}
              rows={4}
              className="w-full bg-[#181818] border border-[#333333] rounded-lg p-3 font-mono text-xs text-white focus:outline-none"
            />
            {jsonError && <p className="text-red-400 text-xs font-mono">{jsonError}</p>}
            <button
              onClick={handleImportJson}
              disabled={!jsonInput.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Parse & Apply
            </button>
          </div>
        </div>
      )}

      {/* Subtab 3: Typography */}
      {activeSubTab === 'typography' && (
        <div className="p-4 rounded-xl border space-y-5 max-w-xl" style={{ backgroundColor: currentTheme.bgSecondary, borderColor: currentTheme.border }}>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Type className="w-4 h-4 text-emerald-400" />
            Editor Typography & Ligatures
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#858585] mb-1.5 font-medium">Font Family</label>
              <Picker<string>
                value={typography.fontFamily}
                onChange={(val) => onChangeTypography({ ...typography, fontFamily: val })}
                options={[
                  { value: 'JetBrains Mono', label: 'JetBrains Mono', secondaryLabel: 'Recommended for code', colorDot: '#10b981' },
                  { value: 'Fira Code', label: 'Fira Code', secondaryLabel: 'Clean monospace', colorDot: '#06b6d4' },
                  { value: 'Source Code Pro', label: 'Source Code Pro', secondaryLabel: 'Adobe professional', colorDot: '#3b82f6' },
                  { value: 'Courier New', label: 'Courier New', secondaryLabel: 'Standard monospace', colorDot: '#a855f7' },
                ]}
                title="Editor Font Family"
                variant="form"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#858585]">Font Size</span>
                <span className="font-mono text-white font-bold">{typography.fontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={24}
                value={typography.fontSize}
                onChange={(e) => onChangeTypography({ ...typography, fontSize: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#858585]">Line Height</span>
                <span className="font-mono text-white font-bold">{typography.lineHeight}</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={2.0}
                step={0.1}
                value={typography.lineHeight}
                onChange={(e) => onChangeTypography({ ...typography, lineHeight: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
              <div>
                <div className="font-semibold text-white">Programming Ligatures</div>
                <div className="text-[10px] text-[#858585]">Renders ==, !=, &gt;=, &lt;= as cohesive symbols</div>
              </div>
              <input
                type="checkbox"
                checked={typography.ligatures}
                onChange={(e) => onChangeTypography({ ...typography, ligatures: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
