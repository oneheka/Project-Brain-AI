import type { DiagnosticItem, FileEntity } from '@projectbrain/shared';

export interface ProjectRule {
  id: string;
  scope: 'typescript' | 'javascript' | 'styles' | 'structure' | 'all';
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixable?: boolean;
  validate(file: FileEntity): Promise<DiagnosticItem[]>;
}

export class RuleEngine {
  private rules: ProjectRule[] = [];

  registerRule(rule: ProjectRule): void {
    this.rules.push(rule);
  }

  async runRules(file: FileEntity): Promise<DiagnosticItem[]> {
    const diagnostics: DiagnosticItem[] = [];
    for (const rule of this.rules) {
      const results = await rule.validate(file);
      diagnostics.push(...results);
    }
    return diagnostics;
  }
}
