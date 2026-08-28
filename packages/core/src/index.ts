import { CodebaseIndex } from '@projectbrain/indexer';
import { DependencyGraph } from '@projectbrain/graph';
import { DeadCodeEngine, DuplicateDetector } from '@projectbrain/analyzer';
import { SecretScanner } from '@projectbrain/security';
import { RuleEngine } from '@projectbrain/rules';
import { TemplateIntelligenceEngine } from '@projectbrain/templates';
import { PromptBuilder } from '@projectbrain/ai';
import type { ProjectBrainConfig, ProjectHealthScore, DeadCodeItem, TaskSession } from '@projectbrain/shared';

export * from '@projectbrain/shared';
export * from '@projectbrain/parser';
export * from '@projectbrain/indexer';
export * from '@projectbrain/graph';
export * from '@projectbrain/rules';
export * from '@projectbrain/templates';
export * from '@projectbrain/security';
export * from '@projectbrain/git';
export * from '@projectbrain/ai';
export * from '@projectbrain/analyzer';

export interface ProjectBrainWorkspace {
  rootPath: string;
  config: ProjectBrainConfig;
}

export class ProjectBrainCore {
  readonly index: CodebaseIndex;
  readonly graph: DependencyGraph;
  readonly deadCodeEngine: DeadCodeEngine;
  readonly duplicateDetector: DuplicateDetector;
  readonly secretScanner: SecretScanner;
  readonly ruleEngine: RuleEngine;
  readonly templateEngine: TemplateIntelligenceEngine;
  readonly promptBuilder: PromptBuilder;
  private activeTaskSession?: TaskSession;

  constructor(public readonly workspace: ProjectBrainWorkspace) {
    this.index = new CodebaseIndex();
    this.graph = new DependencyGraph();
    this.deadCodeEngine = new DeadCodeEngine();
    this.duplicateDetector = new DuplicateDetector();
    this.secretScanner = new SecretScanner();
    this.ruleEngine = new RuleEngine();
    this.templateEngine = new TemplateIntelligenceEngine();
    this.promptBuilder = new PromptBuilder();
  }

  async scanAndIndex(): Promise<void> {
    // Core indexing workflow
  }

  calculateHealthScore(): ProjectHealthScore {
    return {
      overall: 80,
      architecture: 85,
      codeQuality: 80,
      security: 95,
      typeSafety: 85,
      duplication: 75,
      maintainability: 80,
      aiReadiness: 85,
      breakdown: []
    };
  }

  findDeadCode(): DeadCodeItem[] {
    return this.deadCodeEngine.findDeadCode(this.index, this.graph);
  }

  startTaskSession(taskId: string, title: string): TaskSession {
    this.activeTaskSession = {
      id: taskId,
      title,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      relevantModules: [],
      relevantFiles: [],
      decisions: [],
      changedFiles: [],
      constraints: []
    };
    return this.activeTaskSession;
  }

  getActiveTaskSession(): TaskSession | undefined {
    return this.activeTaskSession;
  }

  finishTaskSession(): void {
    if (this.activeTaskSession) {
      this.activeTaskSession.status = 'completed';
      this.activeTaskSession.updatedAt = Date.now();
    }
  }
}
