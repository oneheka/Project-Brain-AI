import type { SecretFinding } from '@projectbrain/shared';
export interface SecretPattern {
    id: string;
    name: string;
    regex: RegExp;
    risk: 'low' | 'medium' | 'high' | 'critical';
}
export declare const COMMON_SECRET_PATTERNS: SecretPattern[];
export declare class SecretScanner {
    scanContent(filePath: string, content: string): SecretFinding[];
}
//# sourceMappingURL=index.d.ts.map