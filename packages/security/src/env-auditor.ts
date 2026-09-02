import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SecretFinding } from '@projectbrain/shared';
import { SECRET_PATTERNS } from './patterns';

export class EnvAuditor {
  audit(workspaceRoot: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const root = path.resolve(workspaceRoot);

    const gitignorePath = path.join(root, '.gitignore');
    const gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf8')
      : '';

    const gitignoreLines = gitignoreContent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    const isIgnored = (filename: string): boolean => {
      return gitignoreLines.some(rule => {
        const cleanRule = rule.replace(/^\//, '').replace(/\/$/, '');
        return cleanRule === filename ||
               cleanRule === '.env*' ||
               cleanRule === '*.env' ||
               (cleanRule.startsWith('.env') && filename.startsWith('.env'));
      });
    };

    // Find all .env files in the root and subdirectories
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(root);
    } catch {
      return findings;
    }

    const envFiles = entries.filter(f => f.startsWith('.env') && f !== '.env.example' && f !== '.env.template');

    for (const envFile of envFiles) {
      const fullPath = path.join(root, envFile);
      const relativePath = envFile;

      // 1. Check if untracked in .gitignore
      if (!isIgnored(envFile)) {
        findings.push({
          id: `sec:env-untracked:${envFile}`,
          type: 'env_untracked',
          filePath: relativePath,
          secretMasked: '****',
          risk: 'critical',
          description: `Sensitive environment file '${envFile}' is NOT covered by .gitignore and may be accidentally committed!`
        });
      }

      // 2. Scan file contents for exposed live secrets
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum].trim();
          if (!line || line.startsWith('#')) continue;

          for (const pattern of SECRET_PATTERNS) {
            pattern.regex.lastIndex = 0;
            const match = pattern.regex.exec(line);
            if (match) {
              const matchedStr = match[1] || match[0];
              const masked = matchedStr.length > 8
                ? matchedStr.slice(0, 4) + '...' + matchedStr.slice(-4)
                : '****';

              findings.push({
                id: `sec:env-secret:${envFile}:${lineNum + 1}:${pattern.id}`,
                type: 'api_key',
                filePath: relativePath,
                line: lineNum + 1,
                secretMasked: masked,
                risk: pattern.risk,
                description: `${pattern.name} found in ${envFile}: ${pattern.description}`
              });
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    }

    return findings;
  }
}
