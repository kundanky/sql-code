import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle2, XCircle, HelpCircle, RotateCcw, 
  ArrowRight, Flame, ChevronRight, Play, BookOpen, AlertCircle 
} from 'lucide-react';
import { PracticeProgress, ThemeConfig } from '../../types/index.ts';
import { PRACTICE_CHALLENGES, PracticeChallenge } from '../../data/practiceChallenges.ts';
import { sqliteManager } from '../../utils/sqliteManager.ts';
import { offlineStorage } from '../../utils/indexedDBStorage.ts';

interface Props {
  theme: ThemeConfig;
  onClose?: () => void;
}

export const SqlPracticeView: React.FC<Props> = ({ theme, onClose }) => {
  const [activeLevel, setActiveLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('beg-1');
  const [userQuery, setUserQuery] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<{
    passed: boolean;
    userRows?: any[];
    expectedRows?: any[];
    userColumns?: string[];
    expectedColumns?: string[];
    error?: string;
    diffMessage?: string;
  } | null>(null);

  const [progress, setProgress] = useState<PracticeProgress>({
    completedIds: [],
    streak: 0,
  });

  // Load progress from IndexedDB
  useEffect(() => {
    async function loadProgress() {
      const saved = await offlineStorage.getItem<PracticeProgress>('practice_progress', {
        completedIds: [],
        streak: 0,
      });
      if (saved) setProgress(saved);
    }
    loadProgress();
  }, []);

  const activeChallenge: PracticeChallenge =
    PRACTICE_CHALLENGES.find((c) => c.id === selectedChallengeId) || PRACTICE_CHALLENGES[0];

  // Sync starter query when selecting challenge
  useEffect(() => {
    setUserQuery(activeChallenge.starterSql);
    setShowHint(false);
    setCheckResult(null);
  }, [selectedChallengeId]);

  const levelChallenges = PRACTICE_CHALLENGES.filter((c) => c.level === activeLevel);
  const totalCompleted = progress.completedIds.length;
  const isCurrentCompleted = progress.completedIds.includes(activeChallenge.id);

  const handleCheckAnswer = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await sqliteManager.checkPractice(
        activeChallenge.seedSql,
        userQuery,
        activeChallenge.solutionSql
      );

      setCheckResult(res);

      if (res.passed && !progress.completedIds.includes(activeChallenge.id)) {
        const nextCompleted = [...progress.completedIds, activeChallenge.id];
        const nextStreak = progress.streak + 1;
        const nextProgress: PracticeProgress = {
          completedIds: nextCompleted,
          streak: nextStreak,
          lastCompletedDate: new Date().toISOString(),
        };
        setProgress(nextProgress);
        await offlineStorage.setItem('practice_progress', nextProgress);
      }
    } catch (err: any) {
      setCheckResult({
        passed: false,
        error: err?.message || 'Failed to check query',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextChallenge = () => {
    const currentIndex = PRACTICE_CHALLENGES.findIndex((c) => c.id === selectedChallengeId);
    if (currentIndex >= 0 && currentIndex < PRACTICE_CHALLENGES.length - 1) {
      const next = PRACTICE_CHALLENGES[currentIndex + 1];
      setActiveLevel(next.level);
      setSelectedChallengeId(next.id);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-5 text-xs transition-colors select-none"
      style={{
        backgroundColor: theme.bgPrimary,
        color: theme.textPrimary,
      }}
    >
      {/* Header & Streak Banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b mb-4 shrink-0"
        style={{ borderColor: theme.border }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">SQL Offline Practice Arena</h1>
              <p className="text-[11px] text-[#858585]">
                Master SQL step-by-step in isolated sandboxes. Never touches your real databases.
              </p>
            </div>
          </div>
        </div>

        {/* Gamified Stats */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono"
            style={{
              backgroundColor: theme.bgSecondary,
              borderColor: theme.border,
            }}
          >
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-white font-bold">{progress.streak}</span>
            <span className="text-[10px] text-[#858585]">Streak</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono"
            style={{
              backgroundColor: theme.bgSecondary,
              borderColor: theme.border,
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold">{totalCompleted} / 30</span>
            <span className="text-[10px] text-[#858585]">Completed</span>
          </div>
        </div>
      </div>

      {/* Level Tabs (Beginner / Intermediate / Advanced) */}
      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1">
        {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
          const isActive = activeLevel === lvl;
          const countDone = PRACTICE_CHALLENGES.filter(
            (c) => c.level === lvl && progress.completedIds.includes(c.id)
          ).length;

          return (
            <button
              key={lvl}
              onClick={() => {
                setActiveLevel(lvl);
                const first = PRACTICE_CHALLENGES.find((c) => c.level === lvl);
                if (first) setSelectedChallengeId(first.id);
              }}
              className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl font-semibold capitalize transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-sm'
                  : 'hover:bg-white/5 border-transparent text-[#858585]'
              }`}
              style={
                !isActive
                  ? { backgroundColor: theme.bgSecondary, borderColor: theme.border }
                  : undefined
              }
            >
              <span>{lvl}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-emerald-300">
                {countDone}/10
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Challenge List / Right Challenge Detail & Playground */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4 overflow-hidden">
        {/* Left Challenges Sidebar */}
        <div
          className="w-full lg:w-72 flex lg:flex-col shrink-0 overflow-x-auto lg:overflow-y-auto rounded-xl border p-2 gap-1.5"
          style={{
            backgroundColor: theme.bgSecondary,
            borderColor: theme.border,
          }}
        >
          {levelChallenges.map((ch) => {
            const isSelected = ch.id === activeChallenge.id;
            const isDone = progress.completedIds.includes(ch.id);

            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChallengeId(ch.id)}
                className={`min-h-[44px] w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-2 shrink-0 lg:shrink cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                    : 'border-transparent hover:bg-white/5 text-[#cccccc]'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold truncate text-white">{ch.title}</div>
                  <div className="text-[10px] text-[#858585]">{ch.category}</div>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Challenge Detail & Playground */}
        <div
          className="flex-1 flex flex-col min-h-0 rounded-xl border p-4 overflow-y-auto space-y-4"
          style={{
            backgroundColor: theme.bgSecondary,
            borderColor: theme.border,
          }}
        >
          {/* Challenge Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeChallenge.level} · {activeChallenge.category}
                </span>
                {isCurrentCompleted && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Passed
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1.5">{activeChallenge.title}</h2>
              <p className="text-xs text-[#cccccc] mt-1 leading-relaxed">
                {activeChallenge.description}
              </p>
            </div>
          </div>

          {/* Hint Disclosure */}
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
            </button>
            {showHint && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono">
                💡 {activeChallenge.hint}
              </div>
            )}
          </div>

          {/* SQL Editor Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#858585]">
              <span className="font-mono font-medium">Your Solution SQL:</span>
              <button
                type="button"
                onClick={() => setUserQuery(activeChallenge.starterSql)}
                className="hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Starter</span>
              </button>
            </div>

            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={5}
              className="w-full font-mono text-xs p-3 rounded-xl border focus:outline-none select-text"
              style={{
                backgroundColor: theme.bgPrimary,
                borderColor: theme.border,
                color: '#f4f4f5',
              }}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={isChecking || !userQuery.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isChecking ? 'Verifying Results...' : 'Check My Answer'}</span>
            </button>

            {checkResult?.passed && (
              <button
                type="button"
                onClick={handleNextChallenge}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Next Challenge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Result / Diff View */}
          {checkResult && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                checkResult.passed
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/30 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {checkResult.passed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Correct! Challenge completed.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Incorrect result. Check output diff below.</span>
                  </>
                )}
              </div>

              {checkResult.diffMessage && (
                <p className="text-xs text-red-300 font-medium">
                  {checkResult.diffMessage}
                </p>
              )}

              {checkResult.error && (
                <p className="text-xs font-mono text-red-400 bg-black/40 p-2.5 rounded-lg">
                  {checkResult.error}
                </p>
              )}

              {/* Side-by-side or stacked diff of Actual vs Expected */}
              {!checkResult.passed && checkResult.expectedRows && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                  {/* Your Output */}
                  <div className="border border-red-500/30 rounded-lg p-2.5 bg-black/30">
                    <div className="font-bold text-red-300 mb-1">Your Output:</div>
                    {checkResult.userRows && checkResult.userRows.length > 0 ? (
                      <pre className="overflow-x-auto text-[#cccccc]">
                        {JSON.stringify(checkResult.userRows, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-[#858585] italic">No rows returned</div>
                    )}
                  </div>

                  {/* Expected Output */}
                  <div className="border border-emerald-500/30 rounded-lg p-2.5 bg-black/30">
                    <div className="font-bold text-emerald-300 mb-1">Expected Output:</div>
                    <pre className="overflow-x-auto text-[#cccccc]">
                      {JSON.stringify(checkResult.expectedRows, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
