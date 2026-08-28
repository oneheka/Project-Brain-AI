export interface GitStatusSummary {
    branch: string;
    isClean: boolean;
    stagedFiles: string[];
    modifiedFiles: string[];
    untrackedFiles: string[];
}
export declare class GitAnalyzer {
    private workspaceRoot;
    constructor(workspaceRoot: string);
    getWorkspaceRoot(): string;
}
//# sourceMappingURL=index.d.ts.map