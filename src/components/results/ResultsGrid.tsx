import React, { useState, useMemo } from 'react';
import { Download, Copy, Check, ArrowUpDown, Search, Table, FileJson, FileSpreadsheet } from 'lucide-react';
import { QueryResult, ThemeConfig } from '../../types/index.ts';
import { Picker } from '../common/Picker.tsx';
import { exportToSqlInserts } from '../../utils/csvImport.ts';

interface Props {
  result: QueryResult;
  theme: ThemeConfig;
}

export const ResultsGrid: React.FC<Props> = ({ result, theme }) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  const columns = result.columns;

  // Sorting and filtering
  const processedRows = useMemo(() => {
    let rows = [...result.rows];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [result.rows, sortCol, sortAsc, filterText]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const currentPageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleCopyRowAsJson = (row: Record<string, any>) => {
    copyToClipboard(JSON.stringify(row, null, 2), 'Row copied as JSON');
  };

  const handleExportCSV = () => {
    const headers = columns.map((c) => c.name).join(',');
    const rows = processedRows.map((r) =>
      columns.map((c) => JSON.stringify(r[c.name] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(processedRows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSQL = () => {
    const colNames = columns.map((c) => c.name);
    const sqlContent = exportToSqlInserts('query_results', colNames, processedRows);
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_export_${Date.now()}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e] select-text">
      {/* Table Toolbar */}
      <div className="h-9 px-3 border-b border-[#2d2d2d] bg-[#252526] flex items-center justify-between text-xs gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#333333] rounded px-2 py-0.5 text-xs max-w-[180px] sm:max-w-xs w-full">
            <Search className="w-3 h-3 text-[#858585] shrink-0" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(1);
              }}
              placeholder="Filter result rows..."
              className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-[#858585]"
            />
          </div>
          <span className="text-[11px] text-[#858585] whitespace-nowrap hidden sm:inline">
            {processedRows.length} {processedRows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {copyStatus && (
            <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 bg-emerald-500/10 rounded flex items-center gap-1">
              <Check className="w-3 h-3" /> {copyStatus}
            </span>
          )}

          <button
            onClick={handleExportCSV}
            className="p-1 sm:px-2 sm:py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-[#cccccc] text-xs border border-[#333333] flex items-center gap-1 transition-colors"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] hidden md:inline">CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-1 sm:px-2 sm:py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-[#cccccc] text-xs border border-[#333333] flex items-center gap-1 transition-colors"
            title="Download JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] hidden md:inline">JSON</span>
          </button>

          <button
            onClick={handleExportSQL}
            className="p-1 sm:px-2 sm:py-1 rounded bg-[#1e1e1e] hover:bg-[#333333] text-[#cccccc] text-xs border border-[#333333] flex items-center gap-1 transition-colors"
            title="Download SQL INSERTs"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] hidden md:inline">SQL</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-[#252526] z-10 select-none shadow-sm border-b border-[#333333]">
            <tr>
              <th className="w-10 px-2 py-1.5 text-center text-[#858585] border-r border-[#333333] font-normal">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="px-3 py-1.5 text-[#cccccc] hover:bg-[#333333] cursor-pointer border-r border-[#333333] whitespace-nowrap transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{col.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#858585] font-normal lowercase">{col.type}</span>
                      <ArrowUpDown className="w-3 h-3 text-[#858585]" />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentPageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-[#858585]">
                  No matching records found.
                </td>
              </tr>
            ) : (
              currentPageRows.map((row, idx) => {
                const globalIdx = (page - 1) * pageSize + idx + 1;
                const isSelected = selectedRowIndex === globalIdx;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRowIndex(isSelected ? null : globalIdx)}
                    className={`border-b border-[#2a2a2a] transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-600/20' : 'hover:bg-[#252526]'
                    }`}
                  >
                    <td className="w-10 px-2 py-1.5 text-center text-[#858585] border-r border-[#2d2d2d] bg-[#1e1e1e] select-none text-[10px]">
                      {globalIdx}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined;
                      const isBoolean = typeof val === 'boolean';
                      const isNumber = typeof val === 'number';

                      return (
                        <td
                          key={col.name}
                          onDoubleClick={() => copyToClipboard(String(val), `Copied ${col.name}`)}
                          className={`px-3 py-1.5 border-r border-[#2d2d2d] max-w-xs truncate ${
                            isNull
                              ? 'text-[#6e7681] italic'
                              : isBoolean
                              ? val ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'
                              : isNumber
                              ? 'text-[#b5cea8] tabular-nums'
                              : 'text-[#cccccc]'
                          }`}
                          title={isNull ? 'NULL' : String(val)}
                        >
                          {isNull ? 'NULL' : isBoolean ? String(val) : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="h-8 px-3 border-t border-[#2d2d2d] bg-[#252526] flex items-center justify-between text-[11px] text-[#858585] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <Picker<number>
            value={pageSize}
            onChange={(val) => {
              setPageSize(val);
              setPage(1);
            }}
            options={[
              { value: 10, label: '10 rows', secondaryLabel: 'Fast mobile view' },
              { value: 25, label: '25 rows', secondaryLabel: 'Standard page' },
              { value: 50, label: '50 rows', secondaryLabel: 'Expanded batch' },
              { value: 100, label: '100 rows', secondaryLabel: 'Maximum batch' },
            ]}
            title="Rows Per Page"
            variant="compact"
          />
        </div>

        <div className="flex items-center gap-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333333] text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-[#333333]"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333333] text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-[#333333]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
