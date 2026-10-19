import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, ArrowRight, Table } from 'lucide-react';
import { DatabaseSchema, ThemeConfig } from '../../types/index.ts';
import { 
  parseCsvRows, detectDelimiter, detectColumnTypes, generateCsvImportSql 
} from '../../utils/csvImport.ts';
import { sqliteManager } from '../../utils/sqliteManager.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  onImportSuccess: (freshSchema: DatabaseSchema, tableName: string, rowCount: number) => void;
  theme: ThemeConfig;
}

export const CsvImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  schema,
  onImportSuccess,
  theme,
}) => {
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>(',');
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [targetTableName, setTargetTableName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const suggestedName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setTargetTableName(suggestedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setCsvRawText(text);
      const autoDelim = detectDelimiter(text);
      setDelimiter(autoDelim);
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  // Parse preview
  const rawRows = csvRawText ? parseCsvRows(csvRawText, delimiter) : [];
  const headerRow = hasHeader && rawRows.length > 0 ? rawRows[0] : rawRows[0]?.map((_, i) => `col_${i + 1}`) || [];
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const inferredTypes = rawRows.length > 0 ? detectColumnTypes(headerRow, dataRows) : [];
  const previewRows = dataRows.slice(0, 5);

  const handleExecuteImport = async () => {
    if (!targetTableName.trim()) {
      setErrorMsg('Please specify a valid table name.');
      return;
    }
    if (dataRows.length === 0) {
      setErrorMsg('No data rows found to import.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    try {
      const importSql = generateCsvImportSql(targetTableName, inferredTypes, dataRows, {
        createNewTable: true,
      });

      const execResult = await sqliteManager.execute(importSql);
      if (execResult.error) {
        throw new Error(execResult.error);
      }

      const freshSchema = await sqliteManager.getSchema();
      onImportSuccess(freshSchema, targetTableName, dataRows.length);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to import CSV into SQLite');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden text-xs"
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
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Import CSV Data</h2>
              <p className="text-[11px] text-[#858585]">
                Load local CSV files directly into an SQLite database table
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#858585] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File Upload Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {!csvRawText ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/60 transition-colors flex flex-col items-center justify-center gap-2.5"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.bgPrimary,
              }}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Tap to choose a CSV file</p>
                <p className="text-[11px] text-[#858585] mt-0.5">
                  or paste CSV contents below
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{
                backgroundColor: theme.bgPrimary,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-white truncate">{fileName || 'pasted_data.csv'}</span>
                <span className="text-[10px] text-[#858585]">({dataRows.length} rows)</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-400 hover:underline shrink-0"
              >
                Change File
              </button>
            </div>
          )}

          {/* Paste CSV Text Area Option */}
          {!fileName && (
            <div>
              <label className="block text-[11px] text-[#858585] mb-1 font-medium">
                Or Paste Raw CSV Data:
              </label>
              <textarea
                value={csvRawText}
                onChange={(e) => {
                  setCsvRawText(e.target.value);
                  setDelimiter(detectDelimiter(e.target.value));
                  if (!targetTableName) setTargetTableName('imported_table');
                }}
                rows={3}
                placeholder="id,name,price&#10;1,Keyboard,89.99&#10;2,Mouse,49.50"
                className="w-full font-mono text-xs p-2.5 rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: theme.bgPrimary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                }}
              />
            </div>
          )}

          {/* Configuration Options */}
          {csvRawText && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Target Table Name */}
              <div>
                <label className="block text-[11px] text-[#858585] mb-1 font-medium">
                  Target Table Name
                </label>
                <input
                  type="text"
                  value={targetTableName}
                  onChange={(e) => setTargetTableName(e.target.value)}
                  placeholder="e.g. clients"
                  className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none"
                  style={{
                    backgroundColor: theme.bgPrimary,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  }}
                />
              </div>

              {/* Delimiter */}
              <div>
                <label className="block text-[11px] text-[#858585] mb-1 font-medium">
                  Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none"
                  style={{
                    backgroundColor: theme.bgPrimary,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  }}
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="&#9;">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              {/* Header Row Toggle */}
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="text-white text-xs font-medium">First row has headers</span>
                </label>
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#858585] font-medium">Detected Columns & First 5 Rows Preview:</span>
                <span className="text-emerald-400 font-mono">{inferredTypes.length} columns detected</span>
              </div>

              <div
                className="overflow-x-auto rounded-lg border max-h-48"
                style={{
                  backgroundColor: theme.bgPrimary,
                  borderColor: theme.border,
                }}
              >
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: theme.border }}>
                      {inferredTypes.map((col, idx) => (
                        <th key={idx} className="p-2 font-semibold text-white whitespace-nowrap bg-black/20">
                          <div>{col.name}</div>
                          <div className="text-[9px] text-emerald-400 font-normal">{col.type}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, rIdx) => (
                      <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5">
                        {inferredTypes.map((_, cIdx) => (
                          <td key={cIdx} className="p-2 whitespace-nowrap text-[#cccccc]">
                            {r[cIdx] !== undefined ? r[cIdx] : <span className="text-[#666666]">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3 border-t shrink-0"
          style={{ borderColor: theme.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-white/5 transition-colors"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isImporting || !csvRawText || dataRows.length === 0}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
          >
            {isImporting ? (
              <span>Importing {dataRows.length} rows...</span>
            ) : (
              <>
                <span>Import Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
