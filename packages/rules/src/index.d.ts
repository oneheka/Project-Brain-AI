import type { DiagnosticItem, FileEntity } from '@projectbrain/shared';
export interface ProjectRule {
    id: string;
    scope: 'typescript' | 'javascript' | 'styles' | 'structure' | 'all';
    severity: 'error' | 'warning' | 'info';
    message: string;
    fixable?: boolean;
    validate(file: FileEntity): Promise<DiagnosticItem[]>;
}
export declare class RuleEngine {
    private rules;
    registerRule(rule: ProjectRule): void;
    runRules(file: FileEntity): Promise<DiagnosticItem[]>;
}
//# sourceMappingURL=index.d.ts.map