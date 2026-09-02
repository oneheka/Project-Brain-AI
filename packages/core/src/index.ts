import { CodebaseIndex, WorkspaceScanner, IndexingPipeline, type IndexingResult } from '@projectbrain/indexer';
import { DependencyGraph } from '@projectbrain/graph';
import { defaultParserRegistry, ParserRegistry } from '@projectbrain/parser';
import { DeadCodeEngine, DuplicateDetector } from '@projectbrain/analyzer';
import { SecretScanner, type SecurityReport } from '@projectbrain/security';
import { RuleEngine } from '@projectbrain/rules';
import { TemplateIntelligenceEngine } from '@projectbrain/templates';
import { PromptBuilder } from '@projectbrain/ai';
import type {
  ProjectBrainConfig,
  ProjectHealthScore,
  DeadCodeItem,
  DuplicateCandidate,
  TaskSession
} from '@projectbrain/shared';

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

  findDeadCode(): DeadCodeItem[] {
    return this.deadCodeEngine.findDeadCode(this.index, this.graph);
  }

  async findDuplicates(): Promise<DuplicateCandidate[]> {
    return await this.duplicateDetector.findDuplicates(this.index);
  }

  async runSecurityScan(): Promise<SecurityReport> {
    return await this.secretScanner.fullScan(this.workspace.rootPath, this.index.getAllFiles());
  }

  async calculateHealthScore(): Promise<ProjectHealthScore> {
    const stats = this.index.getStats();
    const graphStats = this.graph.getStats();
    const deadCodeItems = this.findDeadCode();
    const duplicates = await this.findDuplicates();
    const securityReport = await this.runSecurityScan();

    // Health scoring heuristics
    const deadCodePenalty = Math.min(30, deadCodeItems.length * 2);
    const duplicationPenalty = Math.min(25, duplicates.length * 5);
    const securityPenalty = securityReport.summary.critical * 35 +
                            securityReport.summary.high * 20 +
                            securityReport.summary.medium * 5;

    const codeQuality = Math.max(10, 100 - deadCodePenalty);
    const architecture = Math.max(20, 100 - (graphStats.orphanNodesCount > 15 ? 10 : 0));
    const security = Math.max(0, 100 - securityPenalty);
    const duplication = Math.max(10, 100 - duplicationPenalty);
    const typeSafety = 90;
    const maintainability = Math.round((codeQuality + architecture + typeSafety + duplication) / 4);
    const aiReadiness = Math.round((codeQuality * 0.35 + architecture * 0.35 + security * 0.15 + maintainability * 0.15));

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
          negatives: deadCodeItems.length > 0 ? [`${deadCodeItems.length} potentially unused symbols / files`] : []
        },
        {
          category: 'Duplication',
          score: duplication,
          positives: duplicates.length === 0 ? ['No duplicate code blocks found'] : [],
          negatives: duplicates.length > 0 ? [`${duplicates.length} duplicate code clusters found`] : []
        },
        {
          category: 'Security',
          score: security,
          positives: securityReport.totalRisk === 'low' ? ['Clean security audit (0 exposed secrets)'] : [],
          negatives: securityReport.findings.length > 0 ? [`${securityReport.findings.length} secret/credential findings`] : []
        }
      ]
    };
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
