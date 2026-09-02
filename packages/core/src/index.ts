import { CodebaseIndex, WorkspaceScanner, IndexingPipeline, type IndexingResult } from '@projectbrain/indexer';
import { DependencyGraph } from '@projectbrain/graph';
import { defaultParserRegistry, ParserRegistry } from '@projectbrain/parser';
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
  readonly parserRegistry: ParserRegistry;
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
    this.parserRegistry = defaultParserRegistry;
    this.deadCodeEngine = new DeadCodeEngine();
    this.duplicateDetector = new DuplicateDetector();
    this.secretScanner = new SecretScanner();
    this.ruleEngine = new RuleEngine();
    this.templateEngine = new TemplateIntelligenceEngine();
    this.promptBuilder = new PromptBuilder();
  }

  async scanAndIndex(): Promise<IndexingResult> {
    this.index.clear();
    this.graph.clear();

    const scanner = new WorkspaceScanner({
      workspaceRoot: this.workspace.rootPath,
      include: this.workspace.config.analysis.include,
      exclude: this.workspace.config.analysis.exclude
    });

    const pipeline = new IndexingPipeline(
      scanner,
      this.parserRegistry,
      this.index,
      this.graph
    );

    return await pipeline.run();
  }

  calculateHealthScore(): ProjectHealthScore {
    const stats = this.index.getStats();
    const graphStats = this.graph.getStats();
    const deadCodeItems = this.findDeadCode();

    // Health scoring heuristics
    const deadCodePenalty = Math.min(30, deadCodeItems.length * 3);
    const codeQuality = Math.max(20, 100 - deadCodePenalty);
    const architecture = Math.max(30, 100 - (graphStats.orphanNodesCount > 10 ? 15 : 0));
    const security = 95;
    const typeSafety = 90;
    const duplication = 85;
    const maintainability = Math.round((codeQuality + architecture + typeSafety) / 3);
    const aiReadiness = Math.round((codeQuality * 0.4 + architecture * 0.4 + maintainability * 0.2));

    const overall = Math.round(
      (codeQuality + architecture + security + typeSafety + duplication + maintainability + aiReadiness) / 7
    );

    return {
      overall,
      architecture,
      codeQuality,
      security,
      typeSafety,
      duplication,
      maintainability,
      aiReadiness,
      breakdown: [
        {
          category: 'Architecture',
          score: architecture,
          positives: [`${stats.filesCount} modules indexed with ${graphStats.edgesCount} dependency connections`],
          negatives: graphStats.orphanNodesCount > 0 ? [`${graphStats.orphanNodesCount} orphan nodes detected`] : []
        },
        {
          category: 'Code Quality',
          score: codeQuality,
          positives: [`${stats.symbolsCount} symbols indexed across ${stats.totalLines} lines`],
          negatives: deadCodeItems.length > 0 ? [`${deadCodeItems.length} potentially unused symbols`] : []
        }
      ]
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
