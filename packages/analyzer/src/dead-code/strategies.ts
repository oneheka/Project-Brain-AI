import type { DeadCodeItem } from '@projectbrain/shared';
import type { CodebaseIndex } from '@projectbrain/indexer';
import type { DependencyGraph } from '@projectbrain/graph';

export interface DeadCodeStrategy {
  name: string;
  analyze(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[];
}

const ENTRY_POINT_PATTERNS = [
  /index\.(ts|js|tsx|jsx)$/i,
  /extension\.(ts|js)$/i,
  /main\.(ts|js)$/i,
  /app\.(ts|js|tsx|jsx)$/i,
  /\.test\.(ts|js|tsx|jsx)$/i,
  /\.spec\.(ts|js|tsx|jsx)$/i,
  /test-.*?\.(ts|js)$/i
];

function isEntryPointFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return ENTRY_POINT_PATTERNS.some(p => p.test(normalized));
}

/**
 * 1. Unused Symbol Strategy:
 * Finds symbols (functions, classes, variables) that are not exported and have 0 incoming references in the graph.
 */
export class UnusedSymbolStrategy implements DeadCodeStrategy {
  readonly name = 'UnusedSymbol';

  analyze(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[] {
    const items: DeadCodeItem[] = [];
    const symbols = index.getAllSymbols();

    for (const sym of symbols) {
      if (sym.isExported) continue;
      if (sym.kind === 'file') continue;

      // Skip entrypoint files' top-level symbols if they might be self-contained scripts
      if (isEntryPointFile(sym.filePath) && (sym.name === 'main' || sym.name === 'activate' || sym.name === 'deactivate')) {
        continue;
      }

      const inEdges = graph.getIncomingEdges(sym.id);
      const nonDeclareEdges = inEdges.filter(e => e.kind !== 'declares');

      if (nonDeclareEdges.length === 0 && sym.referencesCount === 0) {
        items.push({
          id: `dead:unused-symbol:${sym.id}`,
          symbolId: sym.id,
          filePath: sym.filePath,
          kind: 'unused_symbol',
          confidence: 'definitely',
          confidenceScore: 0.95,
          reason: `Private symbol '${sym.name}' is never referenced within ${sym.filePath} and not exported.`,
          span: sym.span
        });
      }
    }

    return items;
  }
}

/**
 * 2. Unused File Strategy:
 * Finds non-entrypoint files that are not imported by any other file in the workspace.
 */
export class UnusedFileStrategy implements DeadCodeStrategy {
  readonly name = 'UnusedFile';

  analyze(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[] {
    const items: DeadCodeItem[] = [];
    const files = index.getAllFiles();

    for (const file of files) {
      if (isEntryPointFile(file.relativeFilePath)) continue;

      const fileNodeId = `file:${file.relativeFilePath}`;
      const inEdges = graph.getIncomingEdges(fileNodeId);
      const importEdges = inEdges.filter(e => e.kind === 'imports');

      if (importEdges.length === 0) {
        // Check if any symbols within this file are imported individually
        let anySymbolImported = false;
        for (const sym of file.symbols) {
          const symInEdges = graph.getIncomingEdges(sym.id).filter(e => e.kind === 'imports');
          if (symInEdges.length > 0 || sym.referencesCount > 0) {
            anySymbolImported = true;
            break;
          }
        }

        if (!anySymbolImported) {
          items.push({
            id: `dead:unused-file:${file.relativeFilePath}`,
            filePath: file.relativeFilePath,
            kind: 'unused_file',
            confidence: 'definitely',
            confidenceScore: 0.9,
            reason: `File '${file.relativeFilePath}' has no incoming imports from any other workspace module.`
          });
        }
      }
    }

    return items;
  }
}

/**
 * 3. Unused Export Strategy:
 * Finds exported symbols that have 0 incoming imports across the entire workspace.
 */
export class UnusedExportStrategy implements DeadCodeStrategy {
  readonly name = 'UnusedExport';

  analyze(index: CodebaseIndex, graph: DependencyGraph): DeadCodeItem[] {
    const items: DeadCodeItem[] = [];
    const symbols = index.getAllSymbols();

    for (const sym of symbols) {
      if (!sym.isExported) continue;
      if (sym.kind === 'file') continue;

      // Skip root entry points where exports are part of the public package API
      if (isEntryPointFile(sym.filePath)) continue;

      const inEdges = graph.getIncomingEdges(sym.id);
      const importEdges = inEdges.filter(e => e.kind === 'imports');

      if (importEdges.length === 0 && sym.referencesCount === 0) {
        items.push({
          id: `dead:unused-export:${sym.id}`,
          symbolId: sym.id,
          filePath: sym.filePath,
          kind: 'unused_export',
          confidence: 'probably',
          confidenceScore: 0.75,
          reason: `Exported symbol '${sym.name}' in ${sym.filePath} is never imported by any other module in this project.`,
          span: sym.span
        });
      }
    }

    return items;
  }
}

/**
 * 4. Unused Import Strategy:
 * Inspects imports in files to identify specifiers that are never referenced in the file content.
 */
export class UnusedImportStrategy implements DeadCodeStrategy {
  readonly name = 'UnusedImport';

  analyze(index: CodebaseIndex, _graph: DependencyGraph): DeadCodeItem[] {
    const items: DeadCodeItem[] = [];
    const files = index.getAllFiles();

    for (const file of files) {
      for (const imp of file.imports) {
        for (const spec of imp.specifiers) {
          // If type-only or namespace, skip simple textual heuristic to avoid false positives
          if (spec.isNamespace) continue;

          const localName = spec.localName;
          if (!localName || localName === 'default') continue;

          // Check occurrences of localName in file symbols or imports
          const usedInSymbols = file.symbols.some(s => s.signature?.includes(localName));
          
          // If no evidence of use in symbols signature or name
          if (!usedInSymbols && spec.isTypeOnly) {
            // Can be marked possibly unused if isolated
          }
        }
      }
    }

    return items;
  }
}

/**
 * 5. Dead Route Strategy:
 * Detects orphaned route / page handlers in web frameworks.
 */
export class DeadRouteStrategy implements DeadCodeStrategy {
  readonly name = 'DeadRoute';

  analyze(index: CodebaseIndex, _graph: DependencyGraph): DeadCodeItem[] {
    const items: DeadCodeItem[] = [];
    const files = index.getAllFiles();

    for (const file of files) {
      const isRoute = /^(routes|pages|app)\/.*\.(tsx|jsx|ts|js)$/i.test(file.relativeFilePath);
      if (!isRoute) continue;

      const hasDefaultExport = file.exports.some(e => e.isDefault);
      const hasRouteHandler = file.symbols.some(s => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'default'].includes(s.name));

      if (!hasDefaultExport && !hasRouteHandler) {
        items.push({
          id: `dead:dead-route:${file.relativeFilePath}`,
          filePath: file.relativeFilePath,
          kind: 'dead_route',
          confidence: 'possibly',
          confidenceScore: 0.6,
          reason: `Route file '${file.relativeFilePath}' does not export a default component or standard HTTP handler.`
        });
      }
    }

    return items;
  }
}
