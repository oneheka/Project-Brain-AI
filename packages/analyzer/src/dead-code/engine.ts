import type { DeadCodeItem } from '@projectbrain/shared';
import type { DependencyGraph } from '@projectbrain/graph';
import type { CodebaseIndex } from '@projectbrain/indexer';
import {
  type DeadCodeStrategy,
  UnusedSymbolStrategy,
  UnusedFileStrategy,
  UnusedExportStrategy,
  UnusedImportStrategy,
  DeadRouteStrategy
} from './strategies';

export interface DeadCodeStats {
  total: number;
  byKind: Record<string, number>;
  byConfidence: {
    definitely: number;
    probably: number;
    possibly: number;
  };
}

export class DeadCodeEngine {
  private strategies: DeadCodeStrategy[] = [];

  constructor(customStrategies?: DeadCodeStrategy[]) {
    if (customStrategies && customStrategies.length > 0) {
      this.strategies = customStrategies;
    } else {
      this.strategies = [
        new UnusedSymbolStrategy(),
        new UnusedFileStrategy(),
        new UnusedExportStrategy(),
        new UnusedImportStrategy(),
        new DeadRouteStrategy()
      ];
    }
  }

  findDeadCode(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[] {
    const rawItems: DeadCodeItem[] = [];

    for (const strategy of this.strategies) {
      try {
        const results = strategy.analyze(index, graph);
        rawItems.push(...results);
      } catch (err) {
        console.error(`[DeadCodeEngine] Error in strategy '${strategy.name}':`, err);
      }
    }

    return this.deduplicateAndSort(rawItems);
  }

  findDeadCodeByKind(index: CodebaseIndex, graph: DependencyGraph, kind: DeadCodeItem['kind']): DeadCodeItem[] {
    return this.findDeadCode(index, graph).filter(item => item.kind === kind);
  }

  getStats(items: DeadCodeItem[]): DeadCodeStats {
    const byKind: Record<string, number> = {};
    const byConfidence = {
      definitely: 0,
      probably: 0,
      possibly: 0
    };

    for (const item of items) {
      byKind[item.kind] = (byKind[item.kind] || 0) + 1;
      if (item.confidence in byConfidence) {
        byConfidence[item.confidence as keyof typeof byConfidence]++;
      }
    }

    return {
      total: items.length,
      byKind,
      byConfidence
    };
  }

  private deduplicateAndSort(items: DeadCodeItem[]): DeadCodeItem[] {
    const map = new Map<string, DeadCodeItem>();

    for (const item of items) {
      const key = item.symbolId ? `sym:${item.symbolId}` : `file:${item.filePath}:${item.kind}`;
      const existing = map.get(key);

      if (!existing || item.confidenceScore > existing.confidenceScore) {
        map.set(key, item);
      }
    }

    const deduplicated = Array.from(map.values());

    // Sort by confidenceScore descending, then filePath
    return deduplicated.sort((a, b) => {
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }
      return a.filePath.localeCompare(b.filePath);
    });
  }
}
