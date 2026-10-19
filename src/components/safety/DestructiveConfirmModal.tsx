import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { SqlSafetyCheck } from '../../utils/sqlSafety.ts';

interface Props {
  isOpen: boolean;
  safetyCheck: SqlSafetyCheck;
  onConfirm: () => void;
  onCancel: () => void;
  sqlSnippet: string;
}

export const DestructiveConfirmModal: React.FC<Props> = ({
  isOpen,
  safetyCheck,
  onConfirm,
  onCancel,
  sqlSnippet,
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  if (!isOpen) return null;

  const targetPhrase = safetyCheck.requiredConfirmationPhrase || 'CONFIRM';
  const isMatch = typedPhrase.trim().toUpperCase() === targetPhrase.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-100">
      <div className="bg-[#252526] border border-red-500/50 text-[#cccccc] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-red-950/60 border-b border-red-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-200 text-sm">Destructive Query Intercepted</h3>
              <p className="text-[11px] text-red-300/80">Risk Level: {safetyCheck.riskLevel.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-red-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-white">Security Guard Reasons:</p>
            <ul className="space-y-1 text-red-300 bg-[#181818] p-3 rounded-lg border border-red-900/30">
              {safetyCheck.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white mb-1">Target Statement:</p>
            <pre className="p-2.5 rounded-lg bg-[#181818] border border-[#333333] font-mono text-[11px] text-[#cccccc] overflow-x-auto max-h-24">
              {sqlSnippet.slice(0, 300)}
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-[#1e1e1e] border border-[#333333] space-y-2">
            <p className="text-[#858585]">
              To execute this statement against the active database, type{' '}
              <strong className="text-red-400 font-mono select-all font-bold">{targetPhrase}</strong> below:
            </p>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={`Type "${targetPhrase}"`}
              className="w-full bg-[#252526] border border-[#333333] rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-red-500 uppercase"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#333333] bg-[#1e1e1e] flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-[#333333] hover:bg-[#444444] text-white text-xs font-medium transition-colors"
          >
            Cancel Query
          </button>
          <button
            onClick={() => {
              if (isMatch) {
                onConfirm();
                setTypedPhrase('');
              }
            }}
            disabled={!isMatch}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs transition-colors shadow-lg"
          >
            Confirm & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
