import React, { useState } from 'react';
import { 
  Clock, Play, Copy, Check, Search, Pin, PinOff, 
  Trash2, AlertCircle, CheckCircle2, RotateCcw, Filter 
} from 'lucide-react';
import { QueryHistoryItem, ThemeConfig } from '../../types/index.ts';

interface Props {
  history: QueryHistoryItem[];
  onRestoreQuery: (query: string) => void;
  onClearHistory: () => void;
  onTogglePin?: (id: string) => void;
  onDeleteHistoryItem?: (id: string) => void;
  theme?: ThemeConfig;
}

export const QueryHistoryView: React.FC<Props> = ({
  history,
  onRestoreQuery,
  onClearHistory,
  onTogglePin,
  onDeleteHistoryItem,
  theme,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned' | 'errors'>('all');

  const copyQuery = (item: QueryHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.query);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.errorMessage && item.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'pinned') return !!item.isPinned;
    if (filterMode === 'errors') return item.status === 'error';
    return true;
  });

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
            <Clock className="w-5 h-5 text-blue-400" />
            Query History
          </h2>
          <p className="text-[11px] text-[#858585]">
            Search, favorite, and restore past SQL executions into your editor.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#858585] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queries and error messages..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none"
            style={{
              backgroundColor: theme?.bgSecondary || '#252526',
              borderColor: theme?.border || '#333333',
              color: '#ffffff',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border shrink-0"
          style={{
            backgroundColor: theme?.bgSecondary || '#252526',
            borderColor: theme?.border || '#333333',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterMode === 'all' ? 'bg-white/15 text-white' : 'text-[#858585] hover:text-white'
            }`}
          >
            All ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pinned')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              filterMode === 'pinned' ? 'bg-amber-500/20 text-amber-300' : 'text-[#858585] hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Favorites</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('errors')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              filterMode === 'errors' ? 'bg-red-500/20 text-red-300' : 'text-[#858585] hover:text-white'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Errors</span>
          </button>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center text-[#858585] space-y-2">
          <Clock className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-xs">
            {history.length === 0
              ? 'No recorded queries yet. Run a query in the editor to populate your history.'
              : 'No queries match your search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 font-mono">
          {filteredHistory.map((item) => {
            const isSuccess = item.status === 'success';

            return (
              <div
                key={item.id}
                onClick={() => onRestoreQuery(item.query)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:border-[#555555] ${
                  item.isPinned ? 'border-amber-500/40 bg-amber-500/5' : ''
                }`}
                style={{
                  backgroundColor: theme?.bgSecondary || '#252526',
                  borderColor: item.isPinned ? undefined : theme?.border || '#333333',
                }}
                title="Tap to load query into editor"
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mb-2 font-sans">
                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Success</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error</span>
                      </span>
                    )}

                    <span className="text-[10px] text-[#858585]">
                      {item.executionTimeMs}ms
                    </span>

                    {isSuccess && (
                      <span className="text-[10px] text-[#858585]">
                        · {item.rowCount} {item.rowCount === 1 ? 'row' : 'rows'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[#858585] mr-1">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>

                    {/* Pin / Favorite */}
                    {onTogglePin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(item.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isPinned
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-[#858585] hover:text-white'
                        }`}
                        title={item.isPinned ? 'Unpin favorite' : 'Pin to favorites'}
                      >
                        {item.isPinned ? <Pin className="w-3.5 h-3.5 fill-amber-400" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Copy Query */}
                    <button
                      type="button"
                      onClick={(e) => copyQuery(item, e)}
                      className="p-1.5 rounded-lg text-[#858585] hover:text-white transition-colors"
                      title="Copy SQL text"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Restore Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreQuery(item.query);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-[11px] font-sans font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    {/* Delete Item */}
                    {onDeleteHistoryItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className="p-1.5 rounded-lg text-[#858585] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* SQL Body */}
                <pre
                  className="p-2.5 rounded-lg font-mono text-[11px] text-[#e5e7eb] overflow-x-auto whitespace-pre break-words border border-[#333333]/60"
                  style={{ backgroundColor: theme?.bgPrimary || '#181818' }}
                >
                  {item.query}
                </pre>

                {/* Error message detail if failed */}
                {item.errorMessage && (
                  <div className="mt-2 text-[11px] font-mono text-red-300 bg-red-950/30 p-2 rounded-lg border border-red-900/30">
                    {item.errorMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
