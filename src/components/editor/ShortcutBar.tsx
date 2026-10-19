import React from 'react';
import { Undo2, Redo2, Wand2, ArrowRightToLine } from 'lucide-react';

interface Props {
  onInsertText: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ShortcutBar: React.FC<Props> = ({
  onInsertText,
  onUndo,
  onRedo,
  onFormat,
  canUndo,
  canRedo,
}) => {
  const shortcuts = [
    { label: 'Tab', insert: '  ', icon: ArrowRightToLine },
    { label: 'SELECT', insert: 'SELECT ' },
    { label: 'FROM', insert: 'FROM ' },
    { label: 'WHERE', insert: 'WHERE ' },
    { label: 'JOIN', insert: 'JOIN ' },
    { label: 'AND', insert: 'AND ' },
    { label: 'OR', insert: 'OR ' },
    { label: ',', insert: ', ' },
    { label: ';', insert: ';\n' },
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '*', insert: '*' },
    { label: '=', insert: ' = ' },
    { label: "'", insert: "'" },
    { label: '"', insert: '"' },
    { label: '>', insert: ' > ' },
    { label: '<', insert: ' < ' },
    { label: 'LIMIT', insert: 'LIMIT ' },
    { label: 'ORDER BY', insert: 'ORDER BY ' },
    { label: 'GROUP BY', insert: 'GROUP BY ' },
  ];

  return (
    <div className="min-h-[44px] h-11 bg-[#252526] border-t border-[#333333] flex items-center px-2 gap-1 overflow-x-auto shrink-0 select-none no-scrollbar touch-manipulation">
      {/* Undo / Redo / Format controls */}
      <div className="flex items-center gap-1 border-r border-[#3d3d3d] pr-2 mr-1 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#cccccc] hover:bg-[#333333] active:bg-[#444444] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#cccccc] hover:bg-[#333333] active:bg-[#444444] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onFormat}
          aria-label="Format SQL"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-blue-400 hover:bg-[#333333] active:bg-[#444444] transition-colors"
          title="Auto-Format SQL (Prettify)"
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </div>

      {/* Touch SQL Shortcuts */}
      <div className="flex items-center gap-1.5 shrink-0">
        {shortcuts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onInsertText(item.insert)}
            className="min-h-[36px] px-3 rounded-lg bg-[#1e1e1e] hover:bg-[#333333] active:bg-blue-600 active:text-white border border-[#333333] text-xs font-mono font-medium text-[#cccccc] whitespace-nowrap flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            {item.icon ? (
              <span className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5 text-[#858585]" />
                {item.label}
              </span>
            ) : (
              item.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
