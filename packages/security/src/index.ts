import * as fs from 'node:fs';
import type { FileEntity, SecretFinding, SecretRisk } from '@projectbrain/shared';
import { SECRET_PATTERNS } from './patterns';
import { EnvAuditor } from './env-auditor';
import { GitHistoryScanner } from './git-history-scanner';

export interface SecurityReport {
  findings: SecretFinding[];
  envAudit: SecretFinding[];
  gitHistoryFindings: SecretFinding[];
  totalRisk: SecretRisk;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class SecretScanner {
  private envAuditor = new EnvAuditor();
  private gitHistoryScanner = new GitHistoryScanner();

  scanContent(filePath: string, content: string): SecretFinding[] {
    const findings: SecretFinding[] = [];

    // Skip example / template files from strict content scanning
    if (filePath.includes('.example') || filePath.includes('template-pack')) {
      return findings;
    }

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      for (const pattern of SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(line);
        if (match) {
          const secretValue = match[1] || match[0];
          const masked = secretValue.length > 8
            ? secretValue.slice(0, 4) + '...' + secretValue.slice(-4)
            : '****';

          findings.push({
            id: `sec:${filePath}:${i + 1}:${pattern.id}`,
            type: 'api_key',
            filePath,
            line: i + 1,
            secretMasked: masked,
            risk: pattern.risk,
            description: `${pattern.name} found in ${filePath} at line ${i + 1}.`
          });
        }
      }
    }

    return findings;
  }

  async scanWorkspaceFiles(files: FileEntity[]): Promise<SecretFinding[]> {
    const allFindings: SecretFinding[] = [];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file.filePath, 'utf8');
        const findings = this.scanContent(file.relativeFilePath, content);
        allFindings.push(...findings);
      } catch {
        // Skip unreadable files
      }
    }

    return allFindings;
  }

  auditEnvFiles(workspaceRoot: string): SecretFinding[] {
    return this.envAuditor.audit(workspaceRoot);
  }

  scanGitHistory(workspaceRoot: string, maxCommits = 30): SecretFinding[] {
    return this.gitHistoryScanner.scan(workspaceRoot, maxCommits);
  }

  async fullScan(workspaceRoot: string, files: FileEntity[] = []): Promise<SecurityReport> {
    const contentFindings = await this.scanWorkspaceFiles(files);
    const envAudit = this.auditEnvFiles(workspaceRoot);
    const gitHistoryFindings = this.scanGitHistory(workspaceRoot);

    const allFindings = [...contentFindings, ...envAudit, ...gitHistoryFindings];

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const f of allFindings) {
      if (f.risk in summary) {
        summary[f.risk]++;
      }
    }

    let totalRisk: SecretRisk = 'low';
    if (summary.critical > 0) totalRisk = 'critical';
    else if (summary.high > 0) totalRisk = 'high';
    else if (summary.medium > 0) totalRisk = 'medium';

    return {
      findings: contentFindings,
      envAudit,
      gitHistoryFindings,
      totalRisk,
      summary
    };
  }
}

export * from './patterns';
export * from './env-auditor';
export * from './git-history-scanner';
