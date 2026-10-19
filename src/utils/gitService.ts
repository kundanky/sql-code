import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { getLightningFs, readFile, saveFile, deleteItem } from './fileStorage.ts';
import { GitCommit, GitFileStatus } from '../types/index.ts';
import { offlineStorage } from './indexedDBStorage.ts';

export interface RemoteConfig {
  enabled: boolean;
  url: string;
  username: string;
  token: string;
}

export interface MergeConflictInfo {
  filePath: string;
  ours: string;
  theirs: string;
  base?: string;
}

export interface GitAuthor {
  name: string;
  email: string;
}

const DEFAULT_PROJECT_DIR = '/projects/Default';

// Get or set stored author
export async function getGitAuthor(): Promise<GitAuthor> {
  const author = await offlineStorage.getItem<GitAuthor>('git_author', {
    name: 'SQL CODE Developer',
    email: 'developer@sqlcode.local',
  });
  return author || { name: 'SQL CODE Developer', email: 'developer@sqlcode.local' };
}

export async function setGitAuthor(author: GitAuthor): Promise<void> {
  await offlineStorage.setItem('git_author', author);
}

// Remote configuration
export async function getRemoteConfig(): Promise<RemoteConfig> {
  const remote = await offlineStorage.getItem<RemoteConfig>('git_remote', {
    enabled: false,
    url: '',
    username: '',
    token: '',
  });
  return remote || { enabled: false, url: '', username: '', token: '' };
}

export async function setRemoteConfig(config: RemoteConfig): Promise<void> {
  await offlineStorage.setItem('git_remote', config);
}

// Ensure repository is initialized
export async function ensureRepoInit(dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  try {
    // Check if .git exists
    await fs.promises.stat(`${dir}/.git`);
  } catch {
    try {
      await git.init({ fs, dir, defaultBranch: 'main' });
    } catch (e) {
      console.warn('git.init error:', e);
    }
  }
}

// Get current branch name
export async function getCurrentBranch(dir = DEFAULT_PROJECT_DIR): Promise<string> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  try {
    const branch = await git.currentBranch({ fs, dir, fullname: false });
    return branch || 'main';
  } catch {
    return 'main';
  }
}

// List all local branches
export async function listBranches(dir = DEFAULT_PROJECT_DIR): Promise<string[]> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  try {
    const branches = await git.listBranches({ fs, dir });
    if (!branches || branches.length === 0) return ['main'];
    return branches;
  } catch {
    return ['main'];
  }
}

// Create a new branch
export async function createBranch(branchName: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  await git.branch({ fs, dir, ref: branchName.trim() });
}

// Switch to a branch
export async function switchBranch(branchName: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  await git.checkout({ fs, dir, ref: branchName.trim() });
}

// Rename a branch
export async function renameBranch(oldName: string, newName: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  // Create new branch pointer at same commit
  await git.branch({ fs, dir, ref: newName.trim(), object: oldName });
  // If current branch is oldName, checkout newName
  const curr = await getCurrentBranch(dir);
  if (curr === oldName) {
    await git.checkout({ fs, dir, ref: newName.trim() });
  }
  await git.deleteBranch({ fs, dir, ref: oldName });
}

// Delete a branch
export async function deleteBranch(branchName: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  const current = await getCurrentBranch(dir);
  if (current === branchName) {
    throw new Error('Cannot delete currently checked out branch');
  }
  await git.deleteBranch({ fs, dir, ref: branchName });
}

// Read HEAD file content for diff calculation
export async function getHeadFileContent(filepath: string, dir = DEFAULT_PROJECT_DIR): Promise<string> {
  const fs = getLightningFs();
  try {
    const currentBranch = await getCurrentBranch(dir);
    const commitOid = await git.resolveRef({ fs, dir, ref: currentBranch });
    const { blob } = await git.readBlob({ fs, dir, oid: commitOid, filepath });
    return new TextDecoder().decode(blob);
  } catch {
    return '';
  }
}

// Get working status of all repository files
export async function getRepoStatus(dir = DEFAULT_PROJECT_DIR): Promise<GitFileStatus[]> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);

  try {
    const matrix = await git.statusMatrix({ fs, dir });
    const result: GitFileStatus[] = [];

    for (const [filepath, head, workdir, stage] of matrix) {
      // Ignore git internals or root
      if (filepath === '.git' || filepath.startsWith('.git/')) continue;

      // Status mapping:
      // head == 1, workdir == 1, stage == 1 => clean / unmodified
      if (head === 1 && workdir === 1 && stage === 1) continue;

      let status: 'modified' | 'untracked' | 'added' | 'deleted' = 'modified';
      let staged = false;

      if (head === 0 && workdir === 2 && stage === 0) {
        status = 'untracked';
        staged = false;
      } else if (head === 0 && workdir === 2 && stage === 2) {
        status = 'added';
        staged = true;
      } else if (head === 1 && workdir === 0) {
        status = 'deleted';
        staged = stage === 0;
      } else if (head === 1 && workdir === 2) {
        status = 'modified';
        staged = stage === 2;
      }

      // Read current content from working tree
      let currentContent = '';
      try {
        if (workdir !== 0) {
          currentContent = await readFile(`${dir}/${filepath}`);
        }
      } catch {}

      // Read original content from HEAD
      let originalContent = '';
      try {
        if (head === 1) {
          originalContent = await getHeadFileContent(filepath, dir);
        }
      } catch {}

      result.push({
        path: filepath,
        status,
        staged,
        originalContent,
        currentContent,
      });
    }

    return result;
  } catch (err) {
    console.warn('git.statusMatrix error:', err);
    return [];
  }
}

// Stage a file
export async function stageFile(filepath: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  try {
    await fs.promises.stat(`${dir}/${filepath}`);
    await git.add({ fs, dir, filepath });
  } catch {
    // If file was deleted, remove from git index
    await git.remove({ fs, dir, filepath });
  }
}

// Unstage a file
export async function unstageFile(filepath: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);
  await git.resetIndex({ fs, dir, filepath });
}

// Discard changes to a working file
export async function discardFileChanges(filepath: string, dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);

  try {
    const headContent = await getHeadFileContent(filepath, dir);
    if (headContent) {
      // Revert to HEAD content
      await saveFile(`${dir}/${filepath}`, headContent);
      await git.add({ fs, dir, filepath });
    } else {
      // File was untracked, delete it
      await deleteItem(`${dir}/${filepath}`);
    }
  } catch (e) {
    console.warn('discardFileChanges error:', e);
  }
}

// Commit staged changes
export async function commitChanges(message: string, dir = DEFAULT_PROJECT_DIR): Promise<string> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);

  const author = await getGitAuthor();
  const commitOid = await git.commit({
    fs,
    dir,
    message: message.trim(),
    author: {
      name: author.name,
      email: author.email,
    },
  });

  return commitOid;
}

// Get commit history / log
export async function getCommitHistory(dir = DEFAULT_PROJECT_DIR, depth = 30): Promise<GitCommit[]> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);

  try {
    const commits = await git.log({ fs, dir, depth });
    return commits.map((c) => {
      const date = new Date(c.commit.author.timestamp * 1000);
      return {
        hash: c.oid.substring(0, 7),
        message: c.commit.message,
        author: `${c.commit.author.name} <${c.commit.author.email}>`,
        date: date.toLocaleString(),
        branch: 'HEAD',
      };
    });
  } catch {
    return [];
  }
}

// Merge another branch into current branch
export async function mergeBranch(
  theirsBranch: string,
  dir = DEFAULT_PROJECT_DIR
): Promise<{ success: boolean; conflict?: MergeConflictInfo; commitOid?: string }> {
  const fs = getLightningFs();
  await ensureRepoInit(dir);

  const oursBranch = await getCurrentBranch(dir);
  const author = await getGitAuthor();

  try {
    const mergeReport = await git.merge({
      fs,
      dir,
      ours: oursBranch,
      theirs: theirsBranch,
      author: {
        name: author.name,
        email: author.email,
      },
    });

    // Synchronize working tree files with the merged branch
    try {
      await git.checkout({ fs, dir, ref: oursBranch, force: true });
    } catch {}

    return {
      success: true,
      commitOid: mergeReport.oid,
    };
  } catch (err: any) {
    // If conflict occurs
    console.warn('Merge encountered conflict or error:', err);
    return {
      success: false,
      conflict: {
        filePath: theirsBranch,
        ours: oursBranch,
        theirs: theirsBranch,
        base: err.message || 'Merge conflict',
      },
    };
  }
}

// Optional remote push/pull
export async function pushToRemote(dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  const config = await getRemoteConfig();
  if (!config.enabled || !config.url) {
    throw new Error('Remote origin is not configured');
  }

  const currentBranch = await getCurrentBranch(dir);
  await git.push({
    fs,
    http,
    dir,
    url: config.url,
    ref: currentBranch,
    onAuth: () => ({
      username: config.token || config.username,
      password: '',
    }),
  });
}

export async function pullFromRemote(dir = DEFAULT_PROJECT_DIR): Promise<void> {
  const fs = getLightningFs();
  const config = await getRemoteConfig();
  if (!config.enabled || !config.url) {
    throw new Error('Remote origin is not configured');
  }

  const author = await getGitAuthor();
  const currentBranch = await getCurrentBranch(dir);

  await git.pull({
    fs,
    http,
    dir,
    url: config.url,
    ref: currentBranch,
    singleBranch: true,
    author: {
      name: author.name,
      email: author.email,
    },
    onAuth: () => ({
      username: config.token || config.username,
      password: '',
    }),
  });
}
