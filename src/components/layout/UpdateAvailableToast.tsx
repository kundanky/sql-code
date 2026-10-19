import React from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateAvailableToast: React.FC<Props> = ({ isOpen, onApplyUpdate, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Application Update Notice"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] sm:w-auto bg-[#1e293b] border border-blue-500/50 rounded-xl shadow-2xl p-3.5 flex items-center gap-3 text-xs text-white animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <span>Update Available</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        </div>
        <p className="text-[11px] text-[#94a3b8] truncate">
          A new version of SQL CODE is ready.
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onApplyUpdate}
          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Update
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss update notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
