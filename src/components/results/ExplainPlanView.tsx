import React from 'react';
import { Activity, Layers, Database, ArrowRight, CornerDownRight } from 'lucide-react';
import { ExplainPlanNode } from '../../types/index.ts';

interface Props {
  plan: ExplainPlanNode;
}

const PlanStepComponent: React.FC<{ node: ExplainPlanNode; depth?: number }> = ({ node, depth = 0 }) => {
  const isScan = node.nodeType?.includes('SCAN');
  const isSearch = node.nodeType?.includes('SEARCH');
  const isSort = node.nodeType?.includes('SORT') || node.nodeType?.includes('B-TREE');
  const isSubquery = node.nodeType?.includes('SUBQUERY');

  return (
    <div className="flex flex-col gap-1.5 my-1">
      <div
        className="p-3 rounded-xl border border-[#333333] bg-[#252526] hover:border-emerald-500/50 transition-colors shadow-sm"
        style={{ marginLeft: `${Math.min(depth * 18, 90)}px` }}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-[#858585] shrink-0" />}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                isScan
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isSearch
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isSort
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : isSubquery
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {node.nodeType || 'STEP'}
            </span>

            {node.relationName && (
              <span className="font-mono text-xs font-semibold text-white">
                on <strong className="text-emerald-400">{node.relationName}</strong>
              </span>
            )}
          </div>

          {node.id !== undefined && (
            <span className="text-[10px] font-mono text-[#858585]">
              Step #{node.id} {node.parent ? `(parent: #${node.parent})` : ''}
            </span>
          )}
        </div>

        {/* Real SQLite detail string */}
        <div className="mt-2 text-xs font-mono text-[#e5e7eb] bg-[#1a1a1a] p-2 rounded-lg border border-[#333333]/60 break-words">
          {node.detail || 'Execute query step'}
        </div>
      </div>

      {node.children && node.children.map((child, idx) => (
        <PlanStepComponent key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

export const ExplainPlanView: React.FC<Props> = ({ plan }) => {
  return (
    <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-[#1e1e1e] text-xs">
      {/* Header */}
      <div className="mb-3 p-3 rounded-xl bg-[#252526] border border-[#333333] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">SQLite Query Execution Plan</span>
        </div>
        <div className="text-[11px] font-mono text-emerald-400">
          Source: EXPLAIN QUERY PLAN
        </div>
      </div>

      {/* Real Plan Steps */}
      <div className="space-y-1">
        <PlanStepComponent node={plan} />
      </div>
    </div>
  );
};
