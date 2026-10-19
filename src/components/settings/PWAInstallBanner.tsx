import React, { useState, useEffect } from 'react';
import { Download, Share2, CheckCircle2, X, Smartphone, HardDrive } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA.ts';
import { offlineStorage } from '../../utils/indexedDBStorage.ts';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isOnline, promptInstall } = usePWA();
  const [isPermanentlyDismissed, setIsPermanentlyDismissed] = useState<boolean>(true); // start hidden until checked
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);

  useEffect(() => {
    async function checkDismissed() {
      // Check mobile viewport (< 768px)
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        setIsMobileViewport(isMobile);
        if (isMobile) return;

        // Check if running in native WebView or standalone PWA
        const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean })?.standalone === true;

        if (isNative || isStandalone) {
          setIsPermanentlyDismissed(true);
          return;
        }

        const dismissed = await offlineStorage.getItem<boolean>('pwa_banner_dismissed_permanently', false);
        setIsPermanentlyDismissed(!!dismissed);
      }
    }
    checkDismissed();
  }, []);

  const handleDismiss = async () => {
    setIsPermanentlyDismissed(true);
    await offlineStorage.setItem('pwa_banner_dismissed_permanently', true);
  };

  // Never show if running standalone, native WebView, mobile viewport, or permanently dismissed
  if (isPermanentlyDismissed || isInstalled || isMobileViewport) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[#1e293b]/50 p-4 relative shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#858585] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
        aria-label="Dismiss installation prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">
              Install SQL CODE Desktop App
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PWA
            </span>
          </div>

          <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
            Install SQL CODE for a dedicated, offline-capable IDE experience with local file system support.
          </p>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Offline ready
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#94a3b8]">
              <HardDrive className="w-3.5 h-3.5" />
              Local Storage Active
            </span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
            {isInstallable && (
              <button
                onClick={async () => {
                  const accepted = await promptInstall();
                  if (accepted) handleDismiss();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Install SQL CODE
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
