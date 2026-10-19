import React, { useState } from 'react';
import { X, Network, Key, ArrowRight, Table } from 'lucide-react';
import { DatabaseSchema, TableDefinition } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
}

export const ErDiagramModal: React.FC<Props> = ({ isOpen, onClose, schema }) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e1e1e] border border-[#333333] text-[#cccccc] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333333] bg-[#252526]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Interactive Entity-Relationship (ER) Diagram</h2>
              <p className="text-[11px] text-[#858585]">
                Schema: <span className="font-mono text-purple-300">{schema.name}</span> · Foreign Key Relationships & Data Cardinality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#858585] hover:text-white hover:bg-[#333333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto p-6 bg-[#141414] relative">
          {/* Legend */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs bg-[#1e1e1e] p-3 rounded-xl border border-[#333333] w-fit">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[#858585]">Primary Key (PK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-[#858585]">Foreign Key (FK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[#858585]">Indexed Column</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schema.tables.map((table) => {
              const isSelected = selectedTable === table.name;
              const fkColumns = table.columns.filter((c) => c.isForeignKey);

              return (
                <div
                  key={table.name}
                  onClick={() => setSelectedTable(isSelected ? null : table.name)}
                  className={`rounded-xl border transition-all cursor-pointer shadow-lg overflow-hidden ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/30 bg-[#252526]'
                      : 'border-[#333333] bg-[#1e1e1e] hover:border-[#555555]'
                  }`}
                >
                  {/* Table Header */}
                  <div className="px-4 py-2.5 bg-[#252526] border-b border-[#333333] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-purple-400" />
                      <span className="font-mono font-bold text-sm text-white">{table.name}</span>
                    </div>
                    <span className="text-[10px] text-[#858585] font-mono">
                      ~{table.rowCountEstimate.toLocaleString()} rows
                    </span>
                  </div>

                  {/* Columns List */}
                  <div className="p-2 space-y-1 text-xs font-mono max-h-64 overflow-y-auto">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#2c2c2c] transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {col.isPrimaryKey ? (
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : col.isForeignKey ? (
                            <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 inline-block shrink-0" />
                          )}
                          <span className={`truncate ${col.isPrimaryKey ? 'text-amber-300 font-semibold' : 'text-[#cccccc]'}`}>
                            {col.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] text-[#858585] lowercase">{col.type}</span>
                          {!col.nullable && (
                            <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded">NN</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Relationships indicator */}
                  {fkColumns.length > 0 && (
                    <div className="px-3 py-2 bg-[#181818] border-t border-[#2d2d2d] text-[11px] space-y-1">
                      <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider">
                        Outbound Relations:
                      </span>
                      {fkColumns.map((c) => (
                        <div key={c.name} className="flex items-center gap-1.5 text-blue-300 font-mono text-[10px]">
                          <span>{table.name}.{c.name}</span>
                          <ArrowRight className="w-3 h-3 text-[#858585]" />
                          <span className="text-purple-300 font-bold">{c.foreignKeyTarget?.table}.{c.foreignKeyTarget?.column}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#333333] bg-[#252526] flex items-center justify-between text-xs">
          <span className="text-[#858585]">
            {schema.tables.length} tables · {schema.views.length} views · Generated from Live Metadata
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#333333] hover:bg-[#444444] text-white font-medium transition-colors"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  );
};
