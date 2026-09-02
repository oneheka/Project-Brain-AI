import * as fs from 'node:fs';
import type { DuplicateCandidate, FileEntity, SymbolEntity } from '@projectbrain/shared';
import type { CodebaseIndex } from '@projectbrain/indexer';
import { CodeNormalizer } from './normalizer';

export interface DuplicateDetectorOptions {
  minLines?: number;
  structuralThreshold?: number; // default 0.75
}

interface SymbolWithBody {
  symbol: SymbolEntity;
  file: FileEntity;
  rawBody: string;
  normalizedHash: string;
  structuralTokens: string[];
  linesCount: number;
}

export class DuplicateDetector {
  private minLines: number;
  private structuralThreshold: number;

  constructor(options?: DuplicateDetectorOptions) {
    this.minLines = options?.minLines ?? 3;
    this.structuralThreshold = options?.structuralThreshold ?? 0.75;
  }

  async findDuplicates(indexOrFiles: CodebaseIndex | FileEntity[]): Promise<DuplicateCandidate[]> {
    const files = Array.isArray(indexOrFiles) ? indexOrFiles : indexOrFiles.getAllFiles();
    const candidateSymbols = await this.extractCandidateBodies(files);
    const duplicates: DuplicateCandidate[] = [];

    // Stage 1: Exact Hash Grouping
    const hashGroups = new Map<string, SymbolWithBody[]>();
    for (const item of candidateSymbols) {
      const list = hashGroups.get(item.normalizedHash) ?? [];
      list.push(item);
      hashGroups.set(item.normalizedHash, list);
    }

    const exactMatchedPairKeys = new Set<string>();

    for (const [, group] of hashGroups) {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i];
            const b = group[j];

            // Don't flag duplicates within the same file at the exact same location or parent/child (class vs method)
            if (this.isParentChildOrSame(a, b)) continue;

            const pairKey = this.getPairKey(a.symbol.id, b.symbol.id);
            exactMatchedPairKeys.add(pairKey);

            duplicates.push({
              id: `dup:exact:${a.symbol.id}:${b.symbol.id}`,
              symbolA: a.symbol,
              symbolB: b.symbol,
              exactSimilarity: 1.0,
              structuralSimilarity: 1.0,
              overallConfidence: 0.98,
              evidence: `Exact duplicate code structure detected between '${a.symbol.name}' (${a.file.relativeFilePath}) and '${b.symbol.name}' (${b.file.relativeFilePath}).`
            });
          }
        }
      }
    }

    // Stage 2: Structural Similarity Comparison
    for (let i = 0; i < candidateSymbols.length; i++) {
      for (let j = i + 1; j < candidateSymbols.length; j++) {
        const a = candidateSymbols[i];
        const b = candidateSymbols[j];

        if (this.isParentChildOrSame(a, b)) continue;

        const pairKey = this.getPairKey(a.symbol.id, b.symbol.id);
        if (exactMatchedPairKeys.has(pairKey)) continue;

        // Skip comparison if length delta is > 35%
        const lenDelta = Math.abs(a.linesCount - b.linesCount) / Math.max(a.linesCount, b.linesCount);
        if (lenDelta > 0.35) continue;

        const similarity = CodeNormalizer.calculateLcsSimilarity(a.structuralTokens, b.structuralTokens);

        if (similarity >= this.structuralThreshold) {
          duplicates.push({
            id: `dup:struct:${a.symbol.id}:${b.symbol.id}`,
            symbolA: a.symbol,
            symbolB: b.symbol,
            exactSimilarity: 0.0,
            structuralSimilarity: Number(similarity.toFixed(2)),
            overallConfidence: Number((similarity * 0.9).toFixed(2)),
            evidence: `High structural similarity (${Math.round(similarity * 100)}%) between '${a.symbol.name}' (${a.file.relativeFilePath}) and '${b.symbol.name}' (${b.file.relativeFilePath}).`
          });
        }
      }
    }

    // Sort by overallConfidence descending
    return duplicates.sort((a, b) => b.overallConfidence - a.overallConfidence);
  }

  private async extractCandidateBodies(files: FileEntity[]): Promise<SymbolWithBody[]> {
    const results: SymbolWithBody[] = [];

    for (const file of files) {
      let fileContent: string;
      try {
        fileContent = await fs.promises.readFile(file.filePath, 'utf8');
      } catch {
        continue;
      }

      const lines = fileContent.split('\n');

      for (const sym of file.symbols) {
        // We focus on functions, methods, components and classes with meaningful logic
        if (!['function', 'method', 'component', 'hook', 'class'].includes(sym.kind)) {
          continue;
        }

        const start = Math.max(0, sym.span.startLine - 1);
        const end = Math.min(lines.length, sym.span.endLine);
        const rawBody = lines.slice(start, end).join('\n');
        const linesCount = end - start;

        if (linesCount < this.minLines || rawBody.length < 40) {
          continue;
        }

        const normalizedForHash = CodeNormalizer.normalizeForHashing(rawBody);
        const normalizedHash = CodeNormalizer.hash(normalizedForHash);
        const structuralTokens = CodeNormalizer.normalizeForStructural(rawBody);

        results.push({
          symbol: sym,
          file,
          rawBody,
          normalizedHash,
          structuralTokens,
          linesCount
        });
      }
    }

    return results;
  }

  private isParentChildOrSame(a: SymbolWithBody, b: SymbolWithBody): boolean {
    if (a.symbol.id === b.symbol.id) return true;

    // Check if one is a method of the other class
    if (a.symbol.kind === 'class' && b.symbol.kind === 'method') {
      if (b.symbol.name.startsWith(a.symbol.name + '.')) return true;
    }
    if (b.symbol.kind === 'class' && a.symbol.kind === 'method') {
      if (a.symbol.name.startsWith(b.symbol.name + '.')) return true;
    }

    // Check if same file and one symbol encloses the other (e.g. outer function and inner helper)
    if (a.file.filePath === b.file.filePath) {
      if (a.symbol.span.startLine <= b.symbol.span.startLine &&
          a.symbol.span.endLine >= b.symbol.span.endLine) {
        return true;
      }
      if (b.symbol.span.startLine <= a.symbol.span.startLine &&
          b.symbol.span.endLine >= a.symbol.span.endLine) {
        return true;
      }
    }

    return false;
  }

  private getPairKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}:::${idB}` : `${idB}:::${idA}`;
  }
}
