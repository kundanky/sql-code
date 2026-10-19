import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Table, Activity, Terminal, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { ExplainPlanNode, QueryResult, ThemeConfig } from '../../types/index.ts';
import { ResultsGrid } from './ResultsGrid.tsx';
import { ExplainPlanView } from './ExplainPlanView.tsx';

interface Props {
  result?: QueryResult;
  explainPlan?: ExplainPlanNode;
  error?: string;
  isExecuting: boolean;
  theme: ThemeConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ResultsContainer: React.FC<Props> = ({
  result,
  explainPlan,
  error,
  isExecuting,
  theme,
  isExpanded,
  onToggleExpand,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'plan' | 'messages'>(
    explainPlan ? 'plan' : 'grid'
  );

  // Height state when expanded (default 45% or ~300px)
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (explainPlan) {
      setActiveTab('plan');
    } else if (result) {
      setActiveTab('grid');
    }
  }, [explainPlan, result]);

  // Drag handle touch / mouse handlers
  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    dragStartYRef.current = clientY;
    const currentHeight = containerRef.current?.getBoundingClientRect().height || 300;
    dragStartHeightRef.current = currentHeight;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaY = dragStartYRef.current - clientY; // dragging up increases height
    const newHeight = dragStartHeightRef.current + deltaY;
    const maxHeight = window.innerHeight * 0.75;
    const minHeight = 110;

    if (newHeight < 60) {
      // Dragged down enough to collapse
      if (isExpanded) onToggleExpand();
      isDraggingRef.current = false;
      return;
    }

    if (!isExpanded && newHeight > 80) {
      onToggleExpand();
    }

    setCustomHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
  }, [isExpanded, onToggleExpand]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Global listeners while dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) {
        handleDragMove(e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const containerHeightStyle = isExpanded
    ? customHeight
      ? { height: `${customHeight}px` }
      : { height: '45%' }
    : { height: '44px' };

  return (
    <div
      ref={containerRef}
      className={`border-t flex flex-col relative shrink-0 transition-[height] ${
        isDraggingRef.current ? 'duration-0' : 'duration-200'
      }`}
      style={{
        ...containerHeightStyle,
        backgroundColor: theme.bgPrimary,
        borderColor: theme.border,
      }}
    >
      {/* Drag handle to resize panel */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          handleDragStart(e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) handleDragStart(e.touches[0].clientY);
        }}
        className="w-full h-2 -top-1 absolute inset-x-0 cursor-row-resize flex items-center justify-center group z-30 touch-none"
        title="Drag to resize results panel"
      >
        <div className="w-10 h-1 rounded-full bg-[#404040] group-hover:bg-blue-400 group-active:bg-blue-400 transition-colors" />
      </div>

      {/* Results Header Bar (44px) */}
      <div
        className="h-[44px] px-3 flex items-center justify-between border-b select-none shrink-0"
        style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('grid');
              if (!isExpanded) onToggleExpand();
            }}
            className={`h-8 px-2.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              activeTab === 'grid' && isExpanded
                ? 'bg-[#333333] text-white'
                : 'text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Results</span>
            {result && (
              <span className="text-[10px] text-[#858585] bg-[#1e1e1e] px-1.5 py-0.2 rounded font-mono">
                {result.rowCount}
              </span>
            )}
          </button>

          {explainPlan && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('plan');
                if (!isExpanded) onToggleExpand();
              }}
              className={`h-8 px-2.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTab === 'plan' && isExpanded
                  ? 'bg-[#333333] text-white'
                  : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>EXPLAIN</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('messages');
              if (!isExpanded) onToggleExpand();
            }}
            className={`h-8 px-2.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              activeTab === 'messages' && isExpanded
                ? 'bg-[#333333] text-white'
                : 'text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Messages</span>
            {error && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        </div>

        {/* Status Indicators & Collapse Chevron */}
        <div className="flex items-center gap-2.5 text-xs shrink-0">
          {isExecuting ? (
            <span className="text-blue-400 flex items-center gap-1 text-[11px] animate-pulse">
              <Clock className="w-3 h-3" /> Executing...
            </span>
          ) : result ? (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1 hidden xs:flex">
              <CheckCircle2 className="w-3 h-3" /> {result.rowCount} rows
            </span>
          ) : error ? (
            <span className="text-red-400 text-[11px] flex items-center gap-1 truncate max-w-[140px] xs:max-w-[200px]">
              <AlertCircle className="w-3 h-3 shrink-0" /> Error
            </span>
          ) : null}

          {/* Chevron Collapse / Expand button */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="h-8 w-8 flex items-center justify-center rounded text-[#858585] hover:text-white hover:bg-[#333333] transition-colors relative before:absolute before:-inset-1 before:content-['']"
            title={isExpanded ? 'Collapse results' : 'Expand results'}
            aria-label={isExpanded ? 'Collapse results' : 'Expand results'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Container Body (Only displayed when expanded) */}
      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isExecuting ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#858585]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Running query on gateway proxy...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-4 bg-[#1e1e1e] overflow-auto">
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  SQL Execution Error
                </div>
                <p className="mt-1 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          ) : activeTab === 'plan' && explainPlan ? (
            <ExplainPlanView plan={explainPlan} />
          ) : activeTab === 'messages' ? (
            <div className="flex-1 p-4 bg-[#1e1e1e] overflow-auto text-xs font-mono text-[#cccccc] space-y-2">
              <div className="text-[#858585]">-- Session Log Output --</div>
              {result && (
                <>
                  <div className="text-emerald-400">
                    Query completed successfully: {result.rowCount} rows returned.
                  </div>
                  <div>Execution duration: {result.executionTimeMs} ms</div>
                  <div>Command executed: {result.command || 'SELECT'}</div>
                  {result.affectedRows !== undefined && (
                    <div>Affected rows count: {result.affectedRows}</div>
                  )}
                </>
              )}
            </div>
          ) : result ? (
            <ResultsGrid result={result} theme={theme} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#858585]">
              No active query results. Press "Run" or Cmd+Enter to execute.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
