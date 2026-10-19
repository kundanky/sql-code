import React, { useState, useEffect } from 'react';
import { X, Code2, Plus, Trash2, Search, Check, Sparkles } from 'lucide-react';
import { SnippetItem, ThemeConfig } from '../../types/index.ts';
import { DEFAULT_SNIPPETS } from '../../data/defaultSnippets.ts';
import { offlineStorage } from '../../utils/indexedDBStorage.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (sql: string) => void;
  theme: ThemeConfig;
}

export const SnippetPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onInsertSnippet,
  theme,
}) => {
  const [snippets, setSnippets] = useState<SnippetItem[]>(DEFAULT_SNIPPETS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSnippet, setSelectedSnippet] = useState<SnippetItem>(DEFAULT_SNIPPETS[0]);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New snippet form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSql, setNewSql] = useState('');

  // Load custom snippets from IndexedDB
  useEffect(() => {
    async function loadSnippets() {
      const custom = await offlineStorage.getItem<SnippetItem[]>('custom_snippets', []);
      if (custom && custom.length > 0) {
        setSnippets([...DEFAULT_SNIPPETS, ...custom]);
      }
    }
    loadSnippets();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCustomSnippet = async () => {
    if (!newTitle.trim() || !newSql.trim()) return;

    const item: SnippetItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      prefix: newPrefix.trim() || newTitle.slice(0, 4).toLowerCase(),
      description: newDesc.trim() || 'User custom snippet',
      sql: newSql.trim(),
      isCustom: true,
    };

    const updated = [...snippets, item];
    setSnippets(updated);
    setSelectedSnippet(item);

    const customOnly = updated.filter((s) => s.isCustom);
    await offlineStorage.setItem('custom_snippets', customOnly);

    // Reset form
    setNewTitle('');
    setNewPrefix('');
    setNewDesc('');
    setNewSql('');
    setIsCreatingNew(false);
  };

  const handleDeleteCustomSnippet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = snippets.filter((s) => s.id !== id);
    setSnippets(updated);
    if (selectedSnippet.id === id) {
      setSelectedSnippet(updated[0] || DEFAULT_SNIPPETS[0]);
    }
    const customOnly = updated.filter((s) => s.isCustom);
    await offlineStorage.setItem('custom_snippets', customOnly);
  };

  const filteredSnippets = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.prefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden text-xs"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">SQL Snippets Library</h2>
              <p className="text-[11px] text-[#858585]">
                Insert parameterized queries, CTEs, window functions, and custom templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingNew ? 'Cancel' : 'New Snippet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#858585] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content area */}
        {isCreatingNew ? (
          <div className="p-4 space-y-3 overflow-y-auto">
            <h3 className="font-semibold text-white text-sm">Create Custom Snippet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#858585] mb-1">Snippet Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sales by Region"
                  className="w-full p-2 rounded-lg border font-mono text-xs focus:outline-none"
                  style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#858585] mb-1">Prefix / Shortcut</label>
                <input
                  type="text"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  placeholder="e.g. sreg"
                  className="w-full p-2 rounded-lg border font-mono text-xs focus:outline-none"
                  style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: theme.textPrimary }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#858585] mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary of what this query calculates"
                className="w-full p-2 rounded-lg border text-xs focus:outline-none"
                style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: theme.textPrimary }}
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#858585] mb-1">SQL Query Code</label>
              <textarea
                value={newSql}
                onChange={(e) => setNewSql(e.target.value)}
                placeholder="SELECT ... FROM ...;"
                rows={6}
                className="w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none"
                style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: theme.textPrimary }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 rounded-lg border text-xs hover:bg-white/5"
                style={{ borderColor: theme.border, color: theme.textSecondary }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomSnippet}
                disabled={!newTitle.trim() || !newSql.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs"
              >
                Save Snippet
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
            {/* Left Snippet List */}
            <div
              className="w-full sm:w-1/2 border-r flex flex-col min-h-0 overflow-hidden"
              style={{ borderColor: theme.border }}
            >
              {/* Search */}
              <div className="p-2.5 border-b" style={{ borderColor: theme.border }}>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search snippets..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none"
                    style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: theme.textPrimary }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredSnippets.map((snippet) => {
                  const isSelected = selectedSnippet?.id === snippet.id;
                  return (
                    <div
                      key={snippet.id}
                      onClick={() => setSelectedSnippet(snippet)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-blue-500/80 bg-blue-500/10'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">{snippet.title}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-black/30 text-[#858585]">
                            {snippet.prefix}
                          </span>
                          {snippet.isCustom && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#858585] truncate mt-0.5">
                          {snippet.description}
                        </p>
                      </div>

                      {snippet.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomSnippet(snippet.id, e)}
                          title="Delete snippet"
                          className="p-1 text-[#858585] hover:text-red-400 rounded hover:bg-white/10 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Preview & Action */}
            <div className="w-full sm:w-1/2 flex flex-col min-h-0 p-4">
              {selectedSnippet ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{selectedSnippet.title}</h4>
                      <p className="text-[11px] text-[#858585]">{selectedSnippet.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Prefix: {selectedSnippet.prefix}
                    </span>
                  </div>

                  <div
                    className="flex-1 overflow-auto p-3 rounded-xl border font-mono text-xs whitespace-pre select-text mb-4"
                    style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border, color: '#e5e7eb' }}
                  >
                    {selectedSnippet.sql}
                  </div>

                  <div className="flex justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onInsertSnippet(selectedSnippet.sql);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Insert into Editor</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#858585]">
                  Select a snippet to preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
