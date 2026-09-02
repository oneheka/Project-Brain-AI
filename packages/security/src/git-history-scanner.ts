import { execSync } from 'node:child_process';
import type { SecretFinding } from '@projectbrain/shared';
import { SECRET_PATTERNS } from './patterns';

export class GitHistoryScanner {
  scan(workspaceRoot: string, maxCommits = 30): SecretFinding[] {
    const findings: SecretFinding[] = [];

    try {
      // Check if git repository exists
      execSync('git rev-parse --is-inside-work-tree', {
        cwd: workspaceRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch {
      // Not a git repository
      return findings;
    }

    try {
      // Get commit log with diffs
      const logOutput = execSync(
        `git log -n ${maxCommits} -p --no-merges --diff-filter=A`,
        {
          cwd: workspaceRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024
        }
      );

      let currentCommit = '';
      let currentFile = '';

      const lines = logOutput.split('\n');

      for (const line of lines) {
        if (line.startsWith('commit ')) {
          currentCommit = line.slice(7, 15);
          continue;
        }

        if (line.startsWith('+++ b/')) {
          currentFile = line.slice(6);
          continue;
        }

        // Only inspect added lines in diff
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const addedContent = line.slice(1).trim();
          if (!addedContent || addedContent.startsWith('//') || addedContent.startsWith('#')) {
            continue;
          }

          // Ignore template examples
          if (currentFile.includes('.example') || currentFile.includes('template')) {
            continue;
          }

          for (const pattern of SECRET_PATTERNS) {
            pattern.regex.lastIndex = 0;
            const match = pattern.regex.exec(addedContent);
            if (match) {
              const secretValue = match[1] || match[0];
              const masked = secretValue.length > 8
                ? secretValue.slice(0, 4) + '...' + secretValue.slice(-4)
                : '****';

              findings.push({
                id: `sec:git:${currentCommit}:${currentFile}:${pattern.id}`,
                type: 'secret_in_git_history',
                filePath: currentFile,
                secretMasked: masked,
                risk: pattern.risk,
                commitHash: currentCommit,
                description: `${pattern.name} found in commit history (${currentCommit}) in file '${currentFile}'.`
              });
            }
          }
        }
      }
    } catch {
      // Ignore git exec errors
    }

    return findings;
  }
}
