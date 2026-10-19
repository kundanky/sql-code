import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  Check,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  History,
  FileCode,
  RotateCcw,
  GitMerge,
  Globe,
  Settings,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { GitCommit, GitFileStatus, ThemeConfig } from '../../types/index.ts';
import {
  getRepoStatus,
  getCommitHistory,
  getCurrentBranch,
  listBranches,
  createBranch,
  switchBranch,
  renameBranch,
  deleteBranch,
  mergeBranch,
  stageFile,
  unstageFile,
  discardFileChanges,
  commitChanges,
  getRemoteConfig,
  setRemoteConfig,
  getGitAuthor,
  setGitAuthor,
  pushToRemote,
  pullFromRemote,
  RemoteConfig,
  GitAuthor,
  MergeConflictInfo,
} from '../../utils/gitService.ts';

interface Props {
  currentBranch: string;
  onBranchChange: (branch: string) => void;
  theme: ThemeConfig;
  onRefresh?: () => void;
}

export const GitSourceControl: React.FC<Props> = ({ currentBranch, onBranchChange, theme, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches' | 'remote'>('changes');
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitFileStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals & Sub-screens
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<MergeConflictInfo | null>(null);

  // Remote config & Author state
  const [remoteConfig, setRemoteConfigState] = useState<RemoteConfig>({
    enabled: false,
    url: '',
    username: '',
    token: '',
  });
  const [gitAuthor, setGitAuthorState] = useState<GitAuthor>({
    name: 'SQL CODE Developer',
    email: 'developer@sqlcode.local',
  });
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  // Load real git status
  const refreshGitState = async () => {
    setIsLoading(true);
    try {
      const [repoFiles, repoCommits, branchList, curr, remote, author] = await Promise.all([
        getRepoStatus(),
        getCommitHistory(),
        listBranches(),
        getCurrentBranch(),
        getRemoteConfig(),
        getGitAuthor(),
      ]);
      setFiles(repoFiles);
      setCommits(repoCommits);
      setBranches(branchList);
      setRemoteConfigState(remote);
      setGitAuthorState(author);
      onBranchChange(curr);

      if (repoFiles.length > 0 && (!selectedFile || !repoFiles.some((f) => f.path === selectedFile.path))) {
        setSelectedFile(repoFiles[0]);
      }
    } catch (err) {
      console.warn('Failed to refresh git state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGitState();
  }, []);

  const stagedFiles = files.filter((f) => f.staged);
  const unstagedFiles = files.filter((f) => !f.staged);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Stage / Unstage
  const handleStage = async (filepath: string, stage: boolean) => {
    if (stage) {
      await stageFile(filepath);
    } else {
      await unstageFile(filepath);
    }
    await refreshGitState();
  };

  const handleStageAll = async () => {
    for (const f of unstagedFiles) {
      await stageFile(f.path);
    }
    await refreshGitState();
  };

  const handleUnstageAll = async () => {
    for (const f of stagedFiles) {
      await unstageFile(f.path);
    }
    await refreshGitState();
  };

  // Discard changes
  const handleDiscard = async (filepath: string) => {
    if (confirm(`Are you sure you want to discard all local changes to ${filepath}?`)) {
      await discardFileChanges(filepath);
      await refreshGitState();
      notify(`Discarded changes to ${filepath}`);
    }
  };

  // Commit
  const handleCommitSubmit = async () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;
    try {
      const sha = await commitChanges(commitMessage);
      setCommitMessage('');
      await refreshGitState();
      notify(`Commit ${sha.substring(0, 7)} recorded to local repository`);
    } catch (err: any) {
      notify(`Commit failed: ${err.message}`);
    }
  };

  // Branch Operations
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await createBranch(newBranchName.trim());
      await switchBranch(newBranchName.trim());
      onBranchChange(newBranchName.trim());
      setNewBranchName('');
      setShowNewBranchModal(false);
      await refreshGitState();
      notify(`Created and checked out branch ${newBranchName.trim()}`);
    } catch (err: any) {
      notify(`Create branch failed: ${err.message}`);
    }
  };

  const handleSwitchBranch = async (b: string) => {
    try {
      await switchBranch(b);
      onBranchChange(b);
      await refreshGitState();
      notify(`Switched to branch ${b}`);
    } catch (err: any) {
      notify(`Switch branch failed: ${err.message}`);
    }
  };

  const handleRenameBranch = async () => {
    if (!renameTarget || !renameInput.trim()) return;
    try {
      await renameBranch(renameTarget, renameInput.trim());
      setRenameTarget(null);
      setRenameInput('');
      await refreshGitState();
      notify(`Renamed branch to ${renameInput.trim()}`);
    } catch (err: any) {
      notify(`Rename failed: ${err.message}`);
    }
  };

  const handleDeleteBranch = async (b: string) => {
    if (confirm(`Delete branch '${b}'?`)) {
      try {
        await deleteBranch(b);
        await refreshGitState();
        notify(`Deleted branch ${b}`);
      } catch (err: any) {
        notify(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleMergeBranch = async (targetBranch: string) => {
    try {
      const result = await mergeBranch(targetBranch);
      if (result.success) {
        setMergeTarget(null);
        await refreshGitState();
        notify(`Successfully merged ${targetBranch} into ${currentBranch}`);
      } else if (result.conflict) {
        setConflictInfo(result.conflict);
      }
    } catch (err: any) {
      notify(`Merge error: ${err.message}`);
    }
  };

  // Remote Push / Pull
  const handlePush = async () => {
    setIsLoading(true);
    try {
      await pushToRemote();
      notify('Pushed commits to remote GitHub origin');
    } catch (err: any) {
      notify(`Push failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      await pullFromRemote();
      await refreshGitState();
      notify('Pulled updates from remote GitHub origin');
    } catch (err: any) {
      notify(`Pull failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRemoteConfig = async () => {
    await setRemoteConfig(remoteConfig);
    notify('Remote origin settings saved');
  };

  const handleSaveAuthor = async () => {
    await setGitAuthor(gitAuthor);
    setShowAuthorModal(false);
    notify('Git committer profile updated');
  };

  const conventionalPrefixes = ['feat: ', 'fix: ', 'perf: ', 'refactor: ', 'chore: ', 'docs: '];

  return (
    <div
      className="flex-1 flex flex-col min-h-0 border-r select-none text-xs transition-colors"
      style={{
        backgroundColor: theme.bgSidebar,
        borderColor: theme.border,
        color: theme.textPrimary,
      }}
    >
      {/* Header */}
      <div
        className="p-3 border-b space-y-2.5 shrink-0 transition-colors"
        style={{
          backgroundColor: theme.bgSecondary,
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <span>Source Control</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'changes' ? 'bg-[#333333] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              Changes ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'history' ? 'bg-[#333333] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              History ({commits.length})
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'branches' ? 'bg-[#333333] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              Branches
            </button>
            <button
              onClick={() => setActiveTab('remote')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'remote' ? 'bg-[#333333] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              Remote
            </button>
          </div>
        </div>

        {/* Current Branch Bar */}
        <div className="flex items-center justify-between bg-[#181818] border border-[#2d2d2d] rounded-lg px-2.5 py-1.5 text-xs">
          <div
            className="flex items-center gap-1.5 font-mono text-emerald-400 cursor-pointer hover:underline"
            onClick={() => setActiveTab('branches')}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-semibold">{currentBranch}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAuthorModal(true)}
              title="Git Author Config"
              className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#252526]"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={refreshGitState}
              disabled={isLoading}
              title="Refresh Status"
              className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#252526]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNewBranchModal(true)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
            >
              + Branch
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Conflict Resolution Screen */}
      {conflictInfo && (
        <div className="p-4 bg-amber-950/40 border-b border-amber-600/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Merge Conflict Detected</span>
          </div>
          <p className="text-[11px] text-[#cccccc] leading-relaxed">
            Conflicts occurred while merging branch{' '}
            <strong className="text-white font-mono">{conflictInfo.theirs}</strong> into{' '}
            <strong className="text-white font-mono">{conflictInfo.ours}</strong>.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setConflictInfo(null);
                refreshGitState();
              }}
              className="px-3 py-1 rounded bg-[#252526] hover:bg-[#333333] text-white text-xs border border-[#3d3d3d]"
            >
              Dismiss & Inspect Working Tree
            </button>
          </div>
        </div>
      )}

      {/* Tab: CHANGES */}
      {activeTab === 'changes' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Commit Box */}
          <div className="p-3 border-b border-[#2d2d2d] bg-[#222222] space-y-2 shrink-0">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message (Cmd+Enter to commit)..."
              rows={2}
              className="w-full bg-[#181818] border border-[#333333] rounded-lg p-2 text-xs text-white placeholder-[#858585] focus:outline-none focus:border-emerald-500 font-sans resize-none"
            />

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {conventionalPrefixes.map((prefix) => (
                <button
                  key={prefix}
                  onClick={() => setCommitMessage((prev) => prefix + prev.replace(/^[a-z]+:\s*/, ''))}
                  className="px-1.5 py-0.5 rounded bg-[#1e1e1e] hover:bg-[#333333] text-[10px] text-[#858585] hover:text-[#cccccc] font-mono whitespace-nowrap border border-[#2d2d2d]"
                >
                  {prefix.trim()}
                </button>
              ))}
            </div>

            <button
              onClick={handleCommitSubmit}
              disabled={stagedFiles.length === 0 || !commitMessage.trim()}
              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Commit ({stagedFiles.length} staged)</span>
            </button>
          </div>

          {/* Staged & Unstaged File Lists + Diff Viewer */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* File List */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#2d2d2d] overflow-y-auto p-2 space-y-3 shrink-0 max-h-48 md:max-h-none">
              {/* Staged */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#858585] px-1 mb-1">
                  <span>STAGED CHANGES ({stagedFiles.length})</span>
                  {stagedFiles.length > 0 && (
                    <button onClick={handleUnstageAll} className="text-[10px] text-blue-400 hover:underline">
                      Unstage all
                    </button>
                  )}
                </div>
                {stagedFiles.length === 0 ? (
                  <div className="text-[11px] text-[#6e7681] italic px-1">No staged files</div>
                ) : (
                  stagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                        selectedFile?.path === file.path ? 'bg-[#333333] text-white' : 'hover:bg-[#252526]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate text-[11px] font-mono">{file.path}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStage(file.path, false);
                        }}
                        title="Unstage"
                        className="p-0.5 rounded text-[#858585] hover:text-amber-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Unstaged */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#858585] px-1 mb-1">
                  <span>CHANGES ({unstagedFiles.length})</span>
                  {unstagedFiles.length > 0 && (
                    <button onClick={handleStageAll} className="text-[10px] text-blue-400 hover:underline">
                      Stage all
                    </button>
                  )}
                </div>
                {unstagedFiles.length === 0 ? (
                  <div className="text-[11px] text-[#6e7681] italic px-1">Working tree clean</div>
                ) : (
                  unstagedFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
                        selectedFile?.path === file.path ? 'bg-[#333333] text-white' : 'hover:bg-[#252526]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode
                          className={`w-3.5 h-3.5 shrink-0 ${
                            file.status === 'untracked' ? 'text-blue-400' : 'text-amber-400'
                          }`}
                        />
                        <span className="truncate text-[11px] font-mono">{file.path}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiscard(file.path);
                          }}
                          title="Discard changes"
                          className="p-0.5 rounded text-[#858585] hover:text-red-400"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStage(file.path, true);
                          }}
                          title="Stage"
                          className="p-0.5 rounded text-[#858585] hover:text-emerald-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mobile Unified Diff Viewer */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#181818] overflow-hidden">
              {selectedFile ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="h-8 px-3 bg-[#222222] border-b border-[#2d2d2d] flex items-center justify-between text-[11px] font-mono shrink-0">
                    <span className="text-white truncate">{selectedFile.path}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        selectedFile.staged
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {selectedFile.staged ? 'Staged' : selectedFile.status}
                    </span>
                  </div>

                  <div className="flex-1 p-3 overflow-auto font-mono text-xs space-y-1 select-text">
                    <div className="text-[#858585] pb-1 border-b border-[#2d2d2d] text-[10px]">
                      @@ Working Diff vs Git HEAD @@
                    </div>

                    {selectedFile.originalContent &&
                      selectedFile.originalContent.split('\n').map((line, i) => (
                        <div
                          key={`orig-${i}`}
                          className="bg-red-950/20 text-red-300 px-2 py-0.5 rounded flex items-center gap-2"
                        >
                          <span className="text-red-500 font-bold select-none">-</span>
                          <span className="whitespace-pre-wrap break-all">{line}</span>
                        </div>
                      ))}

                    {selectedFile.currentContent ? (
                      selectedFile.currentContent.split('\n').map((line, i) => (
                        <div
                          key={`curr-${i}`}
                          className="bg-emerald-950/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-2"
                        >
                          <span className="text-emerald-500 font-bold select-none">+</span>
                          <span className="whitespace-pre-wrap break-all">{line}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#858585] italic">[File deleted]</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-[#858585]">
                  Select a modified file to inspect unified diff
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: HISTORY */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono">
          {commits.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#858585]">No commits recorded yet</div>
          ) : (
            commits.map((c) => (
              <div key={c.hash} className="p-3 rounded-lg border border-[#333333] bg-[#222222] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold text-xs">{c.hash}</span>
                  <span className="text-[10px] text-[#858585]">{c.date}</span>
                </div>
                <p className="text-xs text-white font-sans font-medium">{c.message}</p>
                <div className="text-[10px] text-[#858585] pt-1 border-t border-[#2d2d2d]">
                  Committed by: {c.author}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]">
            <span className="font-semibold text-white text-xs">Local Branches ({branches.length})</span>
            <button
              onClick={() => setShowNewBranchModal(true)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
            >
              + Create Branch
            </button>
          </div>

          <div className="space-y-1.5">
            {branches.map((b) => {
              const isCurrent = b === currentBranch;
              return (
                <div
                  key={b}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-[#222222] border-[#333333] text-[#cccccc] hover:border-[#555555]'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer min-w-0"
                    onClick={() => !isCurrent && handleSwitchBranch(b)}
                  >
                    <GitBranch className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-[#858585]'}`} />
                    <span className="font-mono text-xs font-medium truncate">{b}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isCurrent && (
                      <>
                        <button
                          onClick={() => handleSwitchBranch(b)}
                          className="px-2 py-0.5 rounded bg-[#1e1e1e] hover:bg-[#333333] text-xs text-white"
                          title="Switch to branch"
                        >
                          Checkout
                        </button>
                        <button
                          onClick={() => handleMergeBranch(b)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white flex items-center gap-1"
                          title={`Merge ${b} into ${currentBranch}`}
                        >
                          <GitMerge className="w-3 h-3" />
                          <span>Merge</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setRenameTarget(b);
                        setRenameInput(b);
                      }}
                      className="p-1 text-[#858585] hover:text-white"
                      title="Rename branch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => handleDeleteBranch(b)}
                        className="p-1 text-[#858585] hover:text-red-400"
                        title="Delete branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: REMOTE (GitHub Push/Pull) */}
      {activeTab === 'remote' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg">
          <div className="p-3.5 rounded-xl border border-[#333333] bg-[#222222] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white text-xs">GitHub Remote Synchronization</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#858585] cursor-pointer">
                <span>Enabled</span>
                <input
                  type="checkbox"
                  checked={remoteConfig.enabled}
                  onChange={(e) => setRemoteConfigState({ ...remoteConfig, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>
            </div>

            <p className="text-[11px] text-[#858585] leading-relaxed">
              Connect an optional remote Git repository. Tokens are stored locally encrypted in IndexedDB.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#858585] mb-1">Repository HTTPS URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository.git"
                  value={remoteConfig.url}
                  onChange={(e) => setRemoteConfigState({ ...remoteConfig, url: e.target.value })}
                  className="w-full bg-[#181818] border border-[#333333] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[#858585] mb-1">GitHub Username</label>
                <input
                  type="text"
                  placeholder="username"
                  value={remoteConfig.username}
                  onChange={(e) => setRemoteConfigState({ ...remoteConfig, username: e.target.value })}
                  className="w-full bg-[#181818] border border-[#333333] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[#858585] mb-1">Personal Access Token (PAT)</label>
                <input
                  type="password"
                  placeholder="ghp_••••••••••••••••••••"
                  value={remoteConfig.token}
                  onChange={(e) => setRemoteConfigState({ ...remoteConfig, token: e.target.value })}
                  className="w-full bg-[#181818] border border-[#333333] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveRemoteConfig}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
                >
                  Save Settings
                </button>
                <button
                  onClick={handlePush}
                  disabled={!remoteConfig.enabled || !remoteConfig.url || isLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Push to Origin</span>
                </button>
                <button
                  onClick={handlePull}
                  disabled={!remoteConfig.enabled || !remoteConfig.url || isLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-[#333333] hover:bg-[#444444] disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Pull from Origin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#252526] border border-[#333333] rounded-xl p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-white text-sm">Create New Branch</h3>
            <input
              type="text"
              placeholder="e.g. feature/explain-optimizer"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-xs text-white focus:outline-none font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowNewBranchModal(false)}
                className="px-3 py-1 rounded text-xs bg-[#333333] text-[#cccccc]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
                className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Branch Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#252526] border border-[#333333] rounded-xl p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-white text-sm">Rename Branch {renameTarget}</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-xs text-white focus:outline-none font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1 rounded text-xs bg-[#333333] text-[#cccccc]"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameBranch}
                disabled={!renameInput.trim()}
                className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Git Author Modal */}
      {showAuthorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#252526] border border-[#333333] rounded-xl p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-white text-sm">Git Committer Identity</h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[#858585] mb-1">Name</label>
                <input
                  type="text"
                  value={gitAuthor.name}
                  onChange={(e) => setGitAuthorState({ ...gitAuthor, name: e.target.value })}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#858585] mb-1">Email</label>
                <input
                  type="email"
                  value={gitAuthor.email}
                  onChange={(e) => setGitAuthorState({ ...gitAuthor, email: e.target.value })}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAuthorModal(false)}
                className="px-3 py-1 rounded text-xs bg-[#333333] text-[#cccccc]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAuthor}
                className="px-3 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Save Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
