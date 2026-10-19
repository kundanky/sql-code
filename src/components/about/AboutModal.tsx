import React, { useState } from 'react';
import { 
  X, Sparkles, ShieldCheck, Scale, Mail, Copy, Share2, 
  ChevronRight, ArrowLeft, Check, Code, ExternalLink, Info 
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { APP_INFO } from '../../config/appInfo.ts';
import { APP_CHANGELOG } from '../../config/changelog.ts';
import { OPEN_SOURCE_LICENSES } from '../../config/licenses.ts';
import { ThemeConfig } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
}

export const AboutModal: React.FC<Props> = ({ isOpen, onClose, theme }) => {
  const [activeSubView, setActiveSubView] = useState<'main' | 'changelog' | 'privacy' | 'licenses'>('main');
  const [copiedInfo, setCopiedInfo] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyAppInfo = async () => {
    const info = [
      `App: ${APP_INFO.name} v${APP_INFO.version} (Build ${APP_INFO.buildNumber})`,
      `User Agent: ${navigator.userAgent}`,
      `Screen: ${window.innerWidth}x${window.innerHeight} (dpr: ${window.devicePixelRatio})`,
      `Platform: ${navigator.platform}`,
      `Language: ${navigator.language}`,
      `Online: ${navigator.onLine ? 'true' : 'false'}`,
    ].join('\n');

    await navigator.clipboard.writeText(info);
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2000);
  };

  const handleShareApp = async () => {
    try {
      if (typeof Share !== 'undefined' && Share.share) {
        await Share.share({
          title: APP_INFO.name,
          text: `${APP_INFO.name} - ${APP_INFO.tagline}`,
          url: window.location.href,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: APP_INFO.name,
          text: `${APP_INFO.name} - ${APP_INFO.tagline}`,
          url: window.location.href,
        });
      }
    } catch {
      // Ignored if cancelled
    }
  };

  const canShare = typeof navigator !== 'undefined' && (!!navigator.share || typeof Share !== 'undefined');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg flex flex-col sm:rounded-2xl border shadow-2xl overflow-hidden text-xs select-none"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textPrimary,
        }}
      >
        {/* Header (48px height) */}
        <div
          className="h-12 min-h-[48px] px-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            {activeSubView !== 'main' ? (
              <button
                onClick={() => setActiveSubView('main')}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white"
                aria-label="Back to About"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            <span className="font-semibold text-white text-sm">
              {activeSubView === 'main' && 'About SQL CODE'}
              {activeSubView === 'changelog' && "What's New"}
              {activeSubView === 'privacy' && 'Privacy Pledge'}
              {activeSubView === 'licenses' && 'Open Source Licenses'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#858585] hover:text-white transition-colors"
            aria-label="Close About"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeSubView === 'main' && (
            <div className="divide-y divide-white/5">
              {/* App Identity Banner */}
              <div className="p-6 flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-mono font-bold text-white text-2xl tracking-tighter shadow-xl shadow-emerald-950/60">
                  &gt;_
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">{APP_INFO.name}</h1>
                <p className="text-xs text-[#858585]">{APP_INFO.tagline}</p>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-black/40 text-emerald-400 border border-emerald-500/20">
                  Version {APP_INFO.version} (Build {APP_INFO.buildNumber})
                </span>
              </div>

              {/* 48px Navigation Rows */}
              <div className="py-1">
                {/* What's new */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('changelog')}
                  className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-white">What's New in v{APP_INFO.version}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#666666]" />
                </button>

                {/* Privacy */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('privacy')}
                  className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-white">Privacy Pledge</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#666666]" />
                </button>

                {/* Open-Source Licenses */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('licenses')}
                  className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-white">Open Source Licenses</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#666666]" />
                </button>

                {/* Support / Feedback */}
                <a
                  href={`mailto:${APP_INFO.feedbackEmail}?subject=SQL%20CODE%20Feedback%20v${APP_INFO.version}`}
                  className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Send Feedback</div>
                      <div className="text-[10px] text-[#858585]">{APP_INFO.feedbackEmail}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#666666]" />
                </a>

                {/* Copy App Info */}
                <button
                  type="button"
                  onClick={handleCopyAppInfo}
                  className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    {copiedInfo ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#858585]" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-white">
                        {copiedInfo ? 'Copied to Clipboard!' : 'Copy App & System Info'}
                      </div>
                      <div className="text-[10px] text-[#858585]">
                        Includes OS, WebView version and runtime specs for bug reports
                      </div>
                    </div>
                  </div>
                </button>

                {/* Share App (if supported) */}
                {canShare && (
                  <button
                    type="button"
                    onClick={handleShareApp}
                    className="w-full h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-white">Share this App</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#666666]" />
                  </button>
                )}
              </div>

              {/* Developer Credit Footer */}
              <div className="p-4 text-center text-[#858585] text-xs">
                <span>{APP_INFO.developerCredit}</span>
              </div>
            </div>
          )}

          {/* Subview: Changelog */}
          {activeSubView === 'changelog' && (
            <div className="p-4 space-y-5">
              {APP_CHANGELOG.map((entry) => (
                <div
                  key={entry.version}
                  className="p-4 rounded-xl border space-y-2.5"
                  style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Version {entry.version}</span>
                    <span className="text-[10px] text-[#858585]">{entry.releaseDate}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#cccccc]">
                    {entry.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Subview: Privacy Pledge */}
          {activeSubView === 'privacy' && (
            <div className="p-5 space-y-4 leading-relaxed">
              <div
                className="p-4 rounded-xl border space-y-2 bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>100% Offline & Zero Telemetry</span>
                </div>
                <p className="text-xs">{APP_INFO.privacyPledge}</p>
              </div>

              <div className="space-y-3 text-xs text-[#cccccc]">
                <h3 className="font-bold text-white text-sm">How your data is stored</h3>
                <p>
                  Every database, SQL query, snippet, and session draft is executed locally via WebAssembly and saved strictly into your device's private storage (IndexedDB / local storage).
                </p>
                <p>
                  This application makes <strong>no external analytics calls</strong>, connects to <strong>no remote database servers</strong>, and tracks <strong>zero personal identity</strong>. When you are offline or in airplane mode, all functionality remains fully operational.
                </p>
              </div>
            </div>
          )}

          {/* Subview: Open Source Licenses */}
          {activeSubView === 'licenses' && (
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-[#858585] mb-2">
                SQL CODE is built using these open-source libraries:
              </p>
              {OPEN_SOURCE_LICENSES.map((lic) => (
                <div
                  key={lic.name}
                  className="p-3 rounded-xl border space-y-1 text-xs"
                  style={{ backgroundColor: theme.bgPrimary, borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{lic.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] text-emerald-400 font-mono">
                      {lic.license}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585]">{lic.description}</p>
                  <div className="text-[10px] text-[#666666] flex items-center justify-between pt-1">
                    <span>{lic.author}</span>
                    <span>v{lic.version}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
