import { execSync } from 'node:child_process';
import * as path from 'node:path';

export interface GitStatusSummary {
  branch: string;
  isClean: boolean;
  stagedFiles: string[];
  modifiedFiles: string[];
  untrackedFiles: string[];
}

export interface GitDiffEntry {
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  filePath: string;
  oldPath?: string;
}

export interface GitCommitInfo {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface GitBlameLine {
  commitHash: string;
  author: string;
  lineNumber: number;
  content: string;
}

export class GitAnalyzer {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  isGitRepository(): boolean {
    try {
      const out = this.execGit('rev-parse --is-inside-work-tree');
      return out.trim() === 'true';
    } catch {
      return false;
    }
  }

  getCurrentBranch(): string {
    try {
      const out = this.execGit('rev-parse --abbrev-ref HEAD');
      return out.trim() || 'HEAD';
    } catch {
      return 'unknown';
    }
  }

  getStatus(): GitStatusSummary {
    if (!this.isGitRepository()) {
      return {
        branch: 'unknown',
        isClean: true,
        stagedFiles: [],
        modifiedFiles: [],
        untrackedFiles: []
      };
    }

    const branch = this.getCurrentBranch();
    const stagedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    try {
      const output = this.execGit('status --porcelain');
      const lines = output.split('\n').filter(l => l.trim().length > 0);

      for (const line of lines) {
        const indexStatus = line[0];
        const worktreeStatus = line[1];
        const filePath = line.slice(3).trim().replace(/\\/g, '/');

        // Untracked
        if (indexStatus === '?' && worktreeStatus === '?') {
          untrackedFiles.push(filePath);
          continue;
        }

        // Staged
        if (indexStatus !== ' ' && indexStatus !== '?') {
          stagedFiles.push(filePath);
        }

        // Modified in worktree
        if (worktreeStatus !== ' ' && worktreeStatus !== '?') {
          modifiedFiles.push(filePath);
        }
      }
    } catch {
      // Ignore git status errors
    }

    const isClean = stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0;

    return {
      branch,
      isClean,
      stagedFiles,
      modifiedFiles,
      untrackedFiles
    };
  }

  getDiff(staged = false): GitDiffEntry[] {
    if (!this.isGitRepository()) return [];

    const entries: GitDiffEntry[] = [];
    try {
      const flag = staged ? '--staged' : '';
      const output = this.execGit(`diff ${flag} --name-status`);
      const lines = output.split('\n').filter(l => l.trim().length > 0);

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 2) continue;

        const code = parts[0].trim().toUpperCase();
        const filePath = parts[1].trim().replace(/\\/g, '/');

        let status: GitDiffEntry['status'] = 'modified';
        if (code.startsWith('A')) status = 'added';
        else if (code.startsWith('D')) status = 'deleted';
        else if (code.startsWith('R')) status = 'renamed';

        entries.push({
          status,
          filePath,
          oldPath: parts[2] ? parts[2].trim().replace(/\\/g, '/') : undefined
        });
      }
    } catch {
      // Ignore diff errors
    }

    return entries;
  }

  getRecentCommits(count = 10): GitCommitInfo[] {
    if (!this.isGitRepository()) return [];

    const commits: GitCommitInfo[] = [];
    try {
      const output = this.execGit(`log -n ${count} --format="%H|%s|%an|%at"`);
      const lines = output.split('\n').filter(l => l.trim().length > 0);

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 4) {
          commits.push({
            hash: parts[0].trim(),
            message: parts[1].trim(),
            author: parts[2].trim(),
            timestamp: parseInt(parts[3].trim(), 10) * 1000
          });
        }
      }
    } catch {
      // Ignore log errors
    }

    return commits;
  }

  getFileBlame(filePath: string): GitBlameLine[] {
    if (!this.isGitRepository()) return [];

    const lines: GitBlameLine[] = [];
    try {
      const output = this.execGit(`blame --porcelain "${filePath}"`);
      const rawLines = output.split('\n');

      let currentHash = '';
      let currentAuthor = '';
      let lineNum = 1;

      for (const line of rawLines) {
        if (/^[0-9a-f]{40}/.test(line)) {
          currentHash = line.slice(0, 8);
        } else if (line.startsWith('author ')) {
          currentAuthor = line.slice(7).trim();
        } else if (line.startsWith('\t')) {
          lines.push({
            commitHash: currentHash,
            author: currentAuthor || 'Unknown',
            lineNumber: lineNum++,
            content: line.slice(1)
          });
        }
      }
    } catch {
      // Ignore blame errors
    }

    return lines;
  }

  getChangedFilesSince(commitHash: string): string[] {
    if (!this.isGitRepository()) return [];

    try {
      const output = this.execGit(`diff --name-only ${commitHash}..HEAD`);
      return output
        .split('\n')
        .map(l => l.trim().replace(/\\/g, '/'))
        .filter(l => l.length > 0);
    } catch {
      return [];
    }
  }

  private execGit(command: string): string {
    return execSync(`git ${command}`, {
      cwd: this.workspaceRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
  }
}
