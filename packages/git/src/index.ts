export interface GitStatusSummary {
  branch: string;
  isClean: boolean;
  stagedFiles: string[];
  modifiedFiles: string[];
  untrackedFiles: string[];
}

export class GitAnalyzer {
  constructor(private workspaceRoot: string) {}

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }
}
