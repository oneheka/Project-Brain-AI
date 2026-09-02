import type {
  PromptContextPayload,
  FileEntity,
  DeadCodeItem,
  DuplicateCandidate
} from '@projectbrain/shared';
import type { CodebaseIndex } from '@projectbrain/indexer';
import type { DependencyGraph } from '@projectbrain/graph';
import type { RuleEngine } from '@projectbrain/rules';
import { ArchitectureDetector } from './architecture-detector';

export interface CollectorOptions {
  maxRelevantFiles?: number;
  includeDependencies?: boolean;
  deadCodeItems?: DeadCodeItem[];
  duplicates?: DuplicateCandidate[];
}

export class ContextCollector {
  private architectureDetector = new ArchitectureDetector();

  constructor(
    private index: CodebaseIndex,
    private graph: DependencyGraph,
    private ruleEngine?: RuleEngine
  ) {}

  collectForTask(task: string, options?: CollectorOptions): PromptContextPayload {
    const maxFiles = options?.maxRelevantFiles ?? 8;
    const keywords = this.extractKeywords(task);

    // 1. Identify relevant files matching task keywords
    const matchedFiles = this.findMatchingFiles(keywords);

    // 2. Expand with 1-hop dependency graph neighbors
    const relevantFileSet = new Set<FileEntity>(matchedFiles.slice(0, maxFiles));

    if (options?.includeDependencies !== false) {
      for (const file of matchedFiles.slice(0, 4)) {
        const outEdges = this.graph.getOutgoingEdges(`file:${file.relativeFilePath}`);
        for (const edge of outEdges) {
          if (edge.kind === 'imports') {
            const targetPath = edge.targetId.replace('file:', '');
            const targetFile = this.index.getFileByRelativePath(targetPath);
            if (targetFile) {
              relevantFileSet.add(targetFile);
            }
          }
        }
      }
    }

    const relevantFilesList = Array.from(relevantFileSet).slice(0, maxFiles);

    // 3. File Summaries
    const relevantFiles = relevantFilesList.map(f => {
      const topSymbols = f.symbols.slice(0, 4).map(s => s.name).join(', ');
      const summary = `Contains ${f.symbols.length} symbols (${topSymbols ? topSymbols + '...' : 'empty'}), ${f.linesCount} lines.`;
      return {
        filePath: f.relativeFilePath,
        summary
      };
    });

    // 4. Relevant Symbols with Signatures
    const relevantSymbols: string[] = [];
    for (const f of relevantFilesList) {
      for (const sym of f.symbols) {
        if (sym.isExported && sym.signature) {
          relevantSymbols.push(`${sym.kind} ${sym.name}${sym.signature} [in ${f.relativeFilePath}]`);
        }
      }
    }

    // 5. Existing Implementations & Do Not Duplicate items
    const existingImplementations: string[] = [];
    const doNotDuplicate: string[] = [];

    for (const f of relevantFilesList) {
      for (const sym of f.symbols) {
        if (sym.isExported) {
          existingImplementations.push(`${sym.name} (${sym.kind} in ${f.relativeFilePath})`);
          if (['function', 'class', 'hook'].includes(sym.kind)) {
            doNotDuplicate.push(`Do NOT re-implement '${sym.name}' — import it from '${f.relativeFilePath}'.`);
          }
        }
      }
    }

    // 6. Architecture Overview
    const archModel = this.architectureDetector.detect(this.index);
    const architectureOverview = this.architectureDetector.generateOverview(archModel);

    // 7. Project Conventions
    let projectConventions: string[] = [];
    if (this.ruleEngine) {
      const conventions = this.ruleEngine.detectConventions(this.index);
      projectConventions = conventions.map(c => `[${c.category.toUpperCase()}] ${c.title}: ${c.description}`);
    }

    // 8. Known Problems (Dead Code / Duplicates)
    const knownProblems: string[] = [];
    if (options?.deadCodeItems) {
      const relevantDead = options.deadCodeItems.filter(d =>
        relevantFilesList.some(f => f.relativeFilePath === d.filePath)
      );
      for (const d of relevantDead.slice(0, 3)) {
        knownProblems.push(`[DEAD CODE] ${d.filePath}: ${d.reason}`);
      }
    }

    // 9. Standard AI Instructions
    const instructionsForAi: string[] = [
      'Strictly maintain existing code patterns, file structure and naming conventions.',
      'Always reuse existing helper functions and types instead of creating duplicates.',
      'Ensure strict TypeScript type safety with no "any" casts unless strictly unavoidable.',
      'Do not commit real API keys, passwords, or credentials into source files.'
    ];

    return {
      task,
      projectOverview: `ProjectBrain Codebase Intelligence Workspace with ${this.index.getAllFiles().length} files and ${this.index.getAllSymbols().length} symbols.`,
      relevantFiles,
      relevantSymbols: relevantSymbols.slice(0, 15),
      architectureOverview,
      existingImplementations: existingImplementations.slice(0, 12),
      projectConventions,
      knownProblems,
      doNotDuplicate: doNotDuplicate.slice(0, 6),
      taskBoundaryNotice: 'Focus strictly on the requested task. Do not rewrite unrelated existing modules.',
      instructionsForAi
    };
  }

  private extractKeywords(task: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'and', 'or', 'is', 'are', 'was', 'were', 'be', 'add', 'create', 'make',
      'update', 'fix', 'implement', 'how', 'what', 'can', 'you', 'please'
    ]);

    const words = task
      .toLowerCase()
      .replace(/[^a-z0-9_\-\/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    return Array.from(new Set(words));
  }

  private findMatchingFiles(keywords: string[]): FileEntity[] {
    const allFiles = this.index.getAllFiles();
    const scoredFiles: { file: FileEntity; score: number }[] = [];

    for (const file of allFiles) {
      let score = 0;
      const lowerPath = file.relativeFilePath.toLowerCase();

      for (const kw of keywords) {
        if (lowerPath.includes(kw)) {
          score += 10;
        }

        for (const sym of file.symbols) {
          if (sym.name.toLowerCase().includes(kw)) {
            score += sym.isExported ? 5 : 2;
          }
        }
      }

      if (score > 0) {
        scoredFiles.push({ file, score });
      }
    }

    // Sort by score descending
    scoredFiles.sort((a, b) => b.score - a.score);

    // If no keyword matches, fallback to main/core files
    if (scoredFiles.length === 0) {
      return allFiles.slice(0, 5);
    }

    return scoredFiles.map(s => s.file);
  }
}
