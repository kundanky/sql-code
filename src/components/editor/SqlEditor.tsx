import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  Search, WrapText, ZoomIn, ZoomOut, Save, Wand2, 
  Sparkles, Upload, Info, AlertTriangle, Code2 
} from 'lucide-react';
import { DatabaseSchema, DatabaseType, ThemeConfig, TypographySettings } from '../../types/index.ts';
import { ShortcutBar } from './ShortcutBar.tsx';
import { Picker } from '../common/Picker.tsx';
import { SQL_DIALECT_OPTIONS } from '../../data/dialects.ts';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard.ts';
import { format } from 'sql-formatter';
import { CsvImportModal } from '../tools/CsvImportModal.tsx';
import { SnippetPickerModal } from '../tools/SnippetPickerModal.tsx';

// CodeMirror 6 Modules
import { EditorState, Compartment, Prec } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  keymap,
  drawSelection,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo, indentWithTab } from '@codemirror/commands';
import { sql, PostgreSQL, MySQL, SQLite, StandardSQL, MSSQL } from '@codemirror/lang-sql';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { openSearchPanel, searchKeymap } from '@codemirror/search';
import { tags as t } from '@lezer/highlight';

export interface SqlEditorHandle {
  runSelectionOrFull: () => void;
  runCurrentStatement: () => void;
  formatSql: () => void;
}

interface Props {
  content: string;
  onChangeContent: (val: string) => void;
  dialect: DatabaseType;
  onChangeDialect: (dialect: DatabaseType) => void;
  schema?: DatabaseSchema;
  theme: ThemeConfig;
  typography: TypographySettings;
  onRunQuery: (sqlToRun?: string) => void;
  onSaveFile?: () => void;
  onRefreshSchema?: () => Promise<void>;
  isDirty?: boolean;
}

export const SqlEditor = forwardRef<SqlEditorHandle, Props>(function SqlEditor(
  {
    content,
    onChangeContent,
    dialect,
    onChangeDialect,
    schema,
    theme,
    typography,
    onRunQuery,
    onSaveFile,
    onRefreshSchema,
    isDirty = false,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Compartments for dynamic reconfiguration without full reload
  const themeCompartmentRef = useRef(new Compartment());
  const highlightCompartmentRef = useRef(new Compartment());
  const dialectCompartmentRef = useRef(new Compartment());
  const wrappingCompartmentRef = useRef(new Compartment());

  // Cursor & selection coordinates
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // Modals state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSnippetsModalOpen, setIsSnippetsModalOpen] = useState(false);

  // Word-wrap state: default ON for mobile
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  // Font size state
  const [fontSize, setFontSize] = useState<number>(typography.fontSize || 13);

  // Virtual keyboard tracking for mobile
  const { keyboardHeight, isKeyboardOpen } = useVirtualKeyboard();

  // Create highlight style mapped to active theme colors
  const createHighlightStyle = useCallback((th: ThemeConfig) => {
    return HighlightStyle.define([
      { tag: t.keyword, color: th.syntax.keyword, fontWeight: '600' },
      { tag: t.typeName, color: th.syntax.type },
      { tag: [t.function(t.variableName), t.standard(t.name)], color: th.syntax.function },
      { tag: [t.string, t.special(t.string)], color: th.syntax.string },
      { tag: [t.number, t.integer, t.float], color: th.syntax.number },
      { tag: [t.comment, t.lineComment, t.blockComment], color: th.syntax.comment, fontStyle: 'italic' },
      { tag: [t.operator, t.punctuation], color: th.syntax.operator },
      { tag: [t.variableName, t.name], color: th.syntax.variable },
    ]);
  }, []);

  // Create CodeMirror editor theme extension
  const createEditorTheme = useCallback((th: ThemeConfig, size: number, typo: TypographySettings) => {
    return EditorView.theme(
      {
        '&': {
          backgroundColor: th.bgPrimary,
          color: th.textPrimary,
          height: '100%',
          fontSize: `${size}px`,
          fontFamily: typo.fontFamily
            ? `'${typo.fontFamily}', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
            : `'JetBrains Mono', ui-monospace, monospace`,
          lineHeight: String(typo.lineHeight || 1.6),
          fontVariantLigatures: typo.ligatures ? 'normal' : 'none',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'inherit',
        },
        '.cm-content': {
          caretColor: th.accent,
          padding: '12px 4px',
        },
        '.cm-line': {
          padding: '0 8px',
        },
        '.cm-gutters': {
          backgroundColor: th.bgSecondary,
          color: th.textMuted,
          border: 'none',
          borderRight: `1px solid ${th.border}`,
          userSelect: 'none',
          paddingRight: '4px',
        },
        '.cm-activeLine': {
          backgroundColor: `${th.bgTertiary}40`,
        },
        '.cm-activeLineGutter': {
          backgroundColor: th.bgTertiary,
          color: th.textPrimary,
          fontWeight: 'bold',
        },
        '.cm-selectionBackground, ::selection': {
          backgroundColor: `${th.accent}40 !important`,
        },
        '.cm-cursor': {
          borderLeftColor: th.accent,
          borderLeftWidth: '2px',
        },
      },
      { dark: th.isDark }
    );
  }, []);

  // Get CodeMirror language dialect extension
  const getDialectExtension = useCallback((d: DatabaseType, sc?: DatabaseSchema) => {
    const tables: Record<string, string[]> = {};
    if (sc?.tables) {
      for (const t of sc.tables) {
        tables[t.name] = t.columns.map((c) => c.name);
      }
    }
    if (sc?.views) {
      for (const v of sc.views) {
        tables[v.name] = v.columns.map((c) => c.name);
      }
    }

    switch (d) {
      case 'postgres':
        return sql({ dialect: PostgreSQL, schema: tables });
      case 'mysql':
      case 'mariadb':
        return sql({ dialect: MySQL, schema: tables });
      case 'sqlserver':
        return sql({ dialect: MSSQL, schema: tables });
      case 'sqlite':
      default:
        return sql({ dialect: SQLite, schema: tables });
    }
  }, []);

  // Schema-aware autocompletion source
  const schemaCompletionSource = useCallback((sc?: DatabaseSchema) => {
    return (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/[\w.]+/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      const options: any[] = [];
      if (sc?.tables) {
        for (const tbl of sc.tables) {
          options.push({ label: tbl.name, type: 'class', detail: 'table' });
          for (const col of tbl.columns) {
            options.push({ label: col.name, type: 'property', detail: `${col.type} in ${tbl.name}` });
          }
        }
      }
      if (sc?.views) {
        for (const vw of sc.views) {
          options.push({ label: vw.name, type: 'class', detail: 'view' });
        }
      }

      return {
        from: word.from,
        options,
        validFor: /^[\w.]*$/,
      };
    };
  }, []);

  // Run selection or full query
  const handleRunSelectionOrFull = useCallback(() => {
    const view = editorViewRef.current;
    if (!view) {
      onRunQuery();
      return;
    }

    const { from, to } = view.state.selection.main;
    if (from !== to) {
      // Run selected text only
      const selected = view.state.sliceDoc(from, to).trim();
      if (selected) {
        onRunQuery(selected);
        return;
      }
    }

    // Otherwise run full content
    onRunQuery(view.state.doc.toString());
  }, [onRunQuery]);

  // Run current statement at cursor
  const handleRunCurrentStatement = useCallback(() => {
    const view = editorViewRef.current;
    if (!view) {
      onRunQuery();
      return;
    }

    const fullDoc = view.state.doc.toString();
    const head = view.state.selection.main.head;

    // Find preceding and succeeding semicolons
    const prevSemi = fullDoc.lastIndexOf(';', head - 1);
    const startPos = prevSemi >= 0 ? prevSemi + 1 : 0;
    const nextSemi = fullDoc.indexOf(';', head);
    const endPos = nextSemi >= 0 ? nextSemi + 1 : fullDoc.length;

    const statement = fullDoc.slice(startPos, endPos).trim();
    if (statement) {
      onRunQuery(statement);
    } else {
      onRunQuery(fullDoc);
    }
  }, [onRunQuery]);

  // Format SQL (uppercases keywords & indents)
  const handleFormat = useCallback(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    try {
      const formatted = format(currentDoc, {
        language: 'sqlite',
        tabWidth: 2,
        keywordCase: 'upper',
      });
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: formatted },
        scrollIntoView: true,
      });
    } catch {
      // Fallback
    }
  }, []);

  // Expose imperative methods to parent via ref
  useImperativeHandle(ref, () => ({
    runSelectionOrFull: handleRunSelectionOrFull,
    runCurrentStatement: handleRunCurrentStatement,
    formatSql: handleFormat,
  }), [handleRunSelectionOrFull, handleRunCurrentStatement, handleFormat]);

  // Update cursor position and selection state
  const updateCursorState = useCallback((view: EditorView) => {
    const sel = view.state.selection.main;
    const head = sel.head;
    const line = view.state.doc.lineAt(head);
    setCursorPos({
      line: line.number,
      col: head - line.from + 1,
    });
    setHasSelection(sel.from !== sel.to);
  }, []);

  // Mount CodeMirror editor view
  useEffect(() => {
    if (!containerRef.current) return;

    const customKeymap = Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            handleRunSelectionOrFull();
            return true;
          },
        },
        {
          key: 'Mod-s',
          run: () => {
            if (onSaveFile) onSaveFile();
            return true;
          },
        },
        {
          key: 'Mod-f',
          run: (view) => {
            openSearchPanel(view);
            return true;
          },
        },
      ])
    );

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        bracketMatching(),
        drawSelection(),
        history(),
        autocompletion({
          override: [schemaCompletionSource(schema)],
          icons: true,
        }),
        customKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        wrappingCompartmentRef.current.of(wordWrap ? [EditorView.lineWrapping] : []),
        dialectCompartmentRef.current.of(getDialectExtension(dialect, schema)),
        themeCompartmentRef.current.of(createEditorTheme(theme, fontSize, typography)),
        highlightCompartmentRef.current.of(syntaxHighlighting(createHighlightStyle(theme))),
        EditorView.updateListener.of((update) => {
          if (update.selectionSet || update.docChanged) {
            updateCursorState(update.view);
          }
          if (update.docChanged) {
            const newDoc = update.state.doc.toString();
            onChangeContent(newDoc);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []);

  // Sync external content changes (tab switch, snippet insertion, etc.)
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (content !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
    }
  }, [content]);

  // Dynamic theme update
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: [
        themeCompartmentRef.current.reconfigure(createEditorTheme(theme, fontSize, typography)),
        highlightCompartmentRef.current.reconfigure(syntaxHighlighting(createHighlightStyle(theme))),
      ],
    });
  }, [theme, fontSize, typography, createEditorTheme, createHighlightStyle]);

  // Dynamic dialect update
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: dialectCompartmentRef.current.reconfigure(getDialectExtension(dialect, schema)),
    });
  }, [dialect, schema, getDialectExtension]);

  // Dynamic word wrap update
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: wrappingCompartmentRef.current.reconfigure(wordWrap ? [EditorView.lineWrapping] : []),
    });
  }, [wordWrap]);

  // Undo / Redo
  const handleUndo = () => {
    if (editorViewRef.current) {
      undo(editorViewRef.current);
      editorViewRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorViewRef.current) {
      redo(editorViewRef.current);
      editorViewRef.current.focus();
    }
  };

  // Insert text at current cursor / selection
  const handleInsertText = (text: string) => {
    const view = editorViewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
      scrollIntoView: true,
    });
    view.focus();
  };

  const isNonSqliteDialect = dialect !== 'sqlite';

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative select-text"
      style={{
        backgroundColor: theme.bgPrimary,
        paddingBottom: isKeyboardOpen && keyboardHeight > 0 ? `${keyboardHeight}px` : undefined,
      }}
    >
      {/* Dialect Highlighting Only Notice Banner */}
      {isNonSqliteDialect && (
        <div className="px-3 py-1.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              This dialect is for syntax highlighting only. Queries run on the local SQLite engine.
            </span>
          </div>
          <button
            onClick={() => onChangeDialect('sqlite')}
            className="text-[10px] underline hover:text-white shrink-0 cursor-pointer"
          >
            Switch to SQLite
          </button>
        </div>
      )}

      {/* Top Editor Toolbar */}
      <div
        className="h-11 min-h-[44px] px-2 sm:px-3 border-b flex items-center justify-between text-xs select-none shrink-0"
        style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Picker<DatabaseType>
            value={dialect}
            onChange={onChangeDialect}
            options={SQL_DIALECT_OPTIONS}
            title="SQL Dialect"
            variant="toolbar"
          />

          <span className="text-[11px] text-[#858585] font-mono hidden md:inline">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Snippets library button */}
          <button
            type="button"
            onClick={() => setIsSnippetsModalOpen(true)}
            className="h-9 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border bg-[#1e1e1e] text-[#cccccc] border-[#333333] hover:text-white hover:border-[#555555] cursor-pointer"
            title="Open SQL Snippets Library"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] hidden xs:inline">Snippets</span>
          </button>

          {/* CSV Import button */}
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="h-9 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border bg-[#1e1e1e] text-[#cccccc] border-[#333333] hover:text-white hover:border-[#555555] cursor-pointer"
            title="Import CSV into SQLite table"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] hidden sm:inline">Import CSV</span>
          </button>

          {/* Format SQL Button */}
          <button
            type="button"
            onClick={handleFormat}
            className="h-9 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border bg-[#1e1e1e] text-blue-400 border-[#333333] hover:text-blue-300 hover:border-[#555555] cursor-pointer"
            title="Format SQL (Upper Keywords & Indent)"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden xs:inline">Format</span>
          </button>

          {/* Save File Button */}
          {onSaveFile && (
            <button
              type="button"
              onClick={onSaveFile}
              className={`h-9 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isDirty
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-600/30'
                  : 'bg-[#1e1e1e] text-[#858585] border-[#333333] hover:text-white'
              }`}
              title="Save File (Cmd+S / Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden xs:inline">{isDirty ? 'Save *' : 'Saved'}</span>
            </button>
          )}

          {/* Word-Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={`h-9 px-2 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors border cursor-pointer ${
              wordWrap
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                : 'bg-[#1e1e1e] text-[#858585] border-[#333333] hover:text-white'
            }`}
            title={`Word Wrap: ${wordWrap ? 'ON' : 'OFF'}`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CodeMirror Mounting Container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative cursor-text text-sm"
      />

      {/* Mobile Touch Quick Symbol Bar */}
      <ShortcutBar
        onInsertText={handleInsertText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFormat={handleFormat}
        canUndo={true}
        canRedo={true}
      />

      {/* CSV Import Modal */}
      {schema && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          schema={schema}
          onImportSuccess={async (freshSchema, tableName, count) => {
            if (onRefreshSchema) await onRefreshSchema();
            // Automatically insert SELECT query for newly imported table
            handleInsertText(`\nSELECT * FROM "${tableName}" LIMIT 50;\n`);
          }}
          theme={theme}
        />
      )}

      {/* Snippet Picker Modal */}
      <SnippetPickerModal
        isOpen={isSnippetsModalOpen}
        onClose={() => setIsSnippetsModalOpen(false)}
        onInsertSnippet={(sqlSnippet) => {
          handleInsertText(sqlSnippet);
        }}
        theme={theme}
      />
    </div>
  );
});
