import React, { useState } from 'react';
import { 
  Database, Table, Eye, Key, ChevronRight, ChevronDown, 
  Search, Play, Copy, Network, Check, Sparkles, FolderPlus 
} from 'lucide-react';
import { DatabaseSchema, TableDefinition, ThemeConfig } from '../../types/index.ts';
import { ErDiagramModal } from './ErDiagramModal.tsx';

interface Props {
  schema: DatabaseSchema;
  onInsertQuery: (query: string) => void;
  onSeedSampleData?: () => void;
  theme?: ThemeConfig;
}

export const SchemaExplorer: React.FC<Props> = ({
  schema,
  onInsertQuery,
  onSeedSampleData,
  theme,
}) => {
  const [filterText, setFilterText] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState({ tables: true, views: true });
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [showErDiagram, setShowErDiagram] = useState(false);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 1500);
  };

  const handleSelectTable = (table: TableDefinition) => {
    const query = `SELECT * FROM "${table.name}" LIMIT 50;`;
    onInsertQuery(query);
  };

  const filteredTables = (schema.tables || []).filter(
    (t) =>
      t.name.toLowerCase().includes(filterText.toLowerCase()) ||
      t.columns.some((c) => c.name.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredViews = (schema.views || []).filter((v) =>
    v.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const hasNoObjects = (schema.tables || []).length === 0 && (schema.views || []).length === 0;

  return (
    <div
      className="flex-1 flex flex-col min-h-0 border-r select-none text-xs transition-colors"
      style={{
        backgroundColor: theme?.bgSidebar || 'var(--theme-bg-sidebar, #181818)',
        borderColor: theme?.border || 'var(--theme-border, #2d2d2d)',
        color: theme?.textPrimary || 'var(--theme-text-primary, #cccccc)',
      }}
    >
      {/* Header & Filter */}
      <div
        className="p-3 border-b space-y-2 shrink-0 transition-colors"
        style={{
          backgroundColor: theme?.bgSecondary || 'var(--theme-bg-secondary, #252526)',
          borderColor: theme?.border || 'var(--theme-border, #2d2d2d)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span style={{ color: theme?.textPrimary || '#ffffff' }}>Schema Explorer</span>
          </div>

          {(schema.tables || []).length > 0 && (
            <button
              onClick={() => setShowErDiagram(true)}
              className="px-2 py-1 rounded border flex items-center gap-1 text-[11px] transition-colors hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: theme?.bgPrimary || '#1e1e1e',
                borderColor: theme?.border || '#333333',
                color: theme?.accent || '#c084fc',
              }}
              title="Open Interactive ER Diagram"
            >
              <Network className="w-3.5 h-3.5" />
              <span>ER Diagram</span>
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 text-[#858585] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search tables, columns, views..."
            className="w-full border rounded px-2.5 py-1.5 pl-8 text-xs placeholder-[#858585] focus:outline-none"
            style={{
              backgroundColor: theme?.bgPrimary || '#1e1e1e',
              borderColor: theme?.border || '#333333',
              color: theme?.textPrimary || '#ffffff',
            }}
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 font-mono">
        {/* Active Database Node */}
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold px-1 py-1">
          <Database className="w-3.5 h-3.5" />
          <span>{schema.name || 'main'}</span>
          <span className="text-[10px] text-[#858585] font-normal">(sqlite)</span>
        </div>

        {/* Empty state when 0 tables */}
        {hasNoObjects ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#858585]">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">No tables yet</p>
              <p className="text-[11px] text-[#858585] mt-1">
                Run CREATE TABLE in the editor to start building your schema.
              </p>
            </div>

            {onSeedSampleData && (
              <button
                type="button"
                onClick={onSeedSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load sample data</span>
              </button>
            )}
          </div>
        ) : (
          <div className="ml-2 mt-1 space-y-1">
            {/* Tables Section */}
            {filteredTables.length > 0 && (
              <>
                <div
                  onClick={() => setExpandedSections((prev) => ({ ...prev, tables: !prev.tables }))}
                  className="flex items-center gap-1 text-[#cccccc] font-semibold py-1 px-1 rounded hover:bg-[#252526] cursor-pointer"
                >
                  {expandedSections.tables ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Tables ({filteredTables.length})</span>
                </div>

                {expandedSections.tables && (
                  <div className="ml-3 space-y-0.5 border-l border-[#2d2d2d] pl-1.5">
                    {filteredTables.map((table) => {
                      const isExp = expandedTables[table.name] ?? false;
                      return (
                        <div key={table.name} className="group">
                          <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2c2c2c] transition-colors">
                            <div
                              onClick={() => toggleTable(table.name)}
                              className="flex items-center gap-1.5 cursor-pointer truncate flex-1 min-w-0"
                            >
                              {isExp ? <ChevronDown className="w-3 h-3 text-[#858585]" /> : <ChevronRight className="w-3 h-3 text-[#858585]" />}
                              <Table className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="text-white truncate font-medium">{table.name}</span>
                              <span className="text-[10px] text-[#858585] shrink-0">
                                ({table.rowCountEstimate} rows)
                              </span>
                            </div>

                            {/* Quick action buttons on hover / touch */}
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                onClick={() => handleSelectTable(table)}
                                title="SELECT * LIMIT 50"
                                className="p-1 rounded hover:bg-[#333333] text-emerald-400"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => copyName(table.name)}
                                title="Copy table name"
                                className="p-1 rounded hover:bg-[#333333] text-[#858585] hover:text-white"
                              >
                                {copiedName === table.name ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Columns */}
                          {isExp && (
                            <div className="ml-5 my-1 space-y-0.5 border-l border-[#333333] pl-2 text-[11px]">
                              {table.columns.map((col) => (
                                <div
                                  key={col.name}
                                  onClick={() => onInsertQuery(`SELECT "${col.name}" FROM "${table.name}" LIMIT 50;`)}
                                  className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-[#252526] cursor-pointer text-[#cccccc]"
                                  title={`${col.type}${col.isPrimaryKey ? ' (PK)' : ''}${col.isForeignKey ? ` (FK -> ${col.foreignKeyTarget?.table})` : ''}`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    {col.isPrimaryKey ? (
                                      <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                    ) : col.isForeignKey ? (
                                      <span className="text-blue-400 text-[10px] font-bold">FK</span>
                                    ) : (
                                      <span className="w-3 h-3 inline-block" />
                                    )}
                                    <span className={col.isPrimaryKey ? 'text-amber-300 font-medium' : ''}>
                                      {col.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-[#858585] lowercase ml-1 shrink-0">
                                    {col.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Views Section */}
            {filteredViews.length > 0 && (
              <>
                <div
                  onClick={() => setExpandedSections((prev) => ({ ...prev, views: !prev.views }))}
                  className="flex items-center gap-1 text-[#cccccc] font-semibold py-1 px-1 rounded hover:bg-[#252526] cursor-pointer mt-2"
                >
                  {expandedSections.views ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Views ({filteredViews.length})</span>
                </div>

                {expandedSections.views && (
                  <div className="ml-3 space-y-0.5 border-l border-[#2d2d2d] pl-1.5">
                    {filteredViews.map((view) => (
                      <div
                        key={view.name}
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                        onClick={() => onInsertQuery(`SELECT * FROM "${view.name}" LIMIT 50;`)}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-white truncate">{view.name}</span>
                        </div>
                        <Play className="w-3 h-3 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ER Diagram Modal */}
      <ErDiagramModal
        isOpen={showErDiagram}
        onClose={() => setShowErDiagram(false)}
        schema={schema}
      />
    </div>
  );
};
