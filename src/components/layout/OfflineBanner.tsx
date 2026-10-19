import React from 'react';
import { WifiOff } from 'lucide-react';

interface Props {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<Props> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1 flex items-center justify-center gap-2 text-[11px] text-amber-300 font-medium shrink-0">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Working Offline — All queries, tabs, and settings are saved to IndexedDB</span>
    </div>
  );
};
