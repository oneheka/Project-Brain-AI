import type { DeadCodeItem, DuplicateCandidate, FileEntity } from '@projectbrain/shared';
import type { DependencyGraph } from '@projectbrain/graph';
import type { CodebaseIndex } from '@projectbrain/indexer';

export class DeadCodeEngine {
  findDeadCode(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[] {
    const results: DeadCodeItem[] = [];
    const allSymbols = index.getAllSymbols();

    for (const sym of allSymbols) {
      if (sym.isExported) continue; // Basic heuristic placeholder
      const inEdges = graph.getIncomingEdges(sym.id);
      if (inEdges.length === 0 && sym.referencesCount === 0) {
        results.push({
          id: `dead:${sym.id}`,
          symbolId: sym.id,
          filePath: sym.filePath,
          kind: 'unused_symbol',
          confidence: 'probably',
          confidenceScore: 0.85,
          reason: `Symbol '${sym.name}' has 0 incoming references and is not exported.`,
          span: sym.span
        });
      }
    }

    return results;
  }
}

export class DuplicateDetector {
  findDuplicates(_files: FileEntity[]): DuplicateCandidate[] {
    const duplicates: DuplicateCandidate[] = [];
    // Semantic / AST Duplicate detection placeholder
    return duplicates;
  }
}
