import type { SecretFinding } from '@projectbrain/shared';

export interface SecretPattern {
  id: string;
  name: string;
  regex: RegExp;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export const COMMON_SECRET_PATTERNS: SecretPattern[] = [
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9T3BlbkFJ]{20,}/g,
    risk: 'critical'
  },
  {
    id: 'generic-api-key',
    name: 'Generic API Key / Token',
    regex: /(?:api_key|apikey|secret_key|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
    risk: 'high'
  },
  {
    id: 'private-key',
    name: 'Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    risk: 'critical'
  }
];

export class SecretScanner {
  scanContent(filePath: string, content: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of COMMON_SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(line);
        if (match) {
          findings.push({
            id: `secret:${filePath}:${i + 1}:${pattern.id}`,
            type: 'api_key',
            filePath,
            line: i + 1,
            secretMasked: match[0].slice(0, 6) + '****',
            risk: pattern.risk,
            description: `Potential secret found: ${pattern.name}`
          });
        }
      }
    }

    return findings;
  }
}
