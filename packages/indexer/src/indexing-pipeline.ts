import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ParserRegistry } from '@projectbrain/parser';
import type { DependencyGraph } from '@projectbrain/graph';
import type { FileEntity, SymbolEntity } from '@projectbrain/shared';
import type { CodebaseIndex } from './index';
import type { WorkspaceScanner } from './scanner';

export interface IndexingResult {
  filesCount: number;
  symbolsCount: number;
  edgesCount: number;
  durationMs: number;
  errors: { filePath: string; message: string }[];
}

export class IndexingPipeline {
  constructor(
    private scanner: WorkspaceScanner,
    private parserRegistry: ParserRegistry,
    private index: CodebaseIndex,
    private graph: DependencyGraph
  ) {}

  async run(): Promise<IndexingResult> {
    const startTime = Date.now();
    const errors: IndexingResult['errors'] = [];

    // Step 1: Scan files
    const scannedFiles = await this.scanner.scan();

    // Step 2: Parse & Index files
    for (const scanned of scannedFiles) {
      const parser = this.parserRegistry.getParserForFile(scanned.absolutePath);
      if (!parser) continue;

      try {
        const content = await fs.promises.readFile(scanned.absolutePath, 'utf8');
        const fileEntity = await parser.parseFile(
          scanned.absolutePath,
          content,
          scanned.relativePath
        );

        this.index.addFile(fileEntity);

        // Add file node to graph
        this.graph.addNode({
          id: `file:${fileEntity.relativeFilePath}`,
          label: fileEntity.relativeFilePath,
          kind: 'file',
          filePath: fileEntity.relativeFilePath
        });

        // Add symbol nodes to graph
        for (const sym of fileEntity.symbols) {
          this.graph.addNode({
            id: sym.id,
            label: sym.name,
            kind: sym.kind,
            filePath: sym.filePath,
            metadata: {
              span: sym.span,
              isExported: sym.isExported
            }
          });

          // Edge: File declares Symbol
          this.graph.addEdge({
            id: `edge:declares:${fileEntity.relativeFilePath}:${sym.id}`,
            sourceId: `file:${fileEntity.relativeFilePath}`,
            targetId: sym.id,
            kind: 'declares',
            evidence: `Declared in ${fileEntity.relativeFilePath}`
          });
        }
      } catch (err) {
        errors.push({
          filePath: scanned.relativePath,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }

    // Step 3: Connect dependencies (Imports & Symbol References)
    this.buildDependencyEdges();

    const durationMs = Date.now() - startTime;

    return {
      filesCount: this.index.getAllFiles().length,
      symbolsCount: this.index.getAllSymbols().length,
      edgesCount: this.graph.getAllEdges().length,
      durationMs,
      errors
    };
  }

  private buildDependencyEdges(): void {
    const allFiles = this.index.getAllFiles();

    for (const sourceFile of allFiles) {
      for (const importDecl of sourceFile.imports) {
        const targetFilePath = this.resolveImport(sourceFile.relativeFilePath, importDecl.source);
        if (!targetFilePath) continue;

        const targetFile = this.index.getFileByRelativePath(targetFilePath);
        if (!targetFile) continue;

        // Edge: File imports File
        this.graph.addEdge({
          id: `edge:import:${sourceFile.relativeFilePath}->${targetFile.relativeFilePath}`,
          sourceId: `file:${sourceFile.relativeFilePath}`,
          targetId: `file:${targetFile.relativeFilePath}`,
          kind: 'imports',
          evidence: `Import statement: "${importDecl.source}"`
        });

        // Connect specific imported symbols
        for (const spec of importDecl.specifiers) {
          const targetSymbol = this.findTargetSymbol(targetFile, spec.importedName);
          if (targetSymbol) {
            targetSymbol.referencesCount++;

            this.graph.addEdge({
              id: `edge:symbol-import:${sourceFile.relativeFilePath}->${targetSymbol.id}`,
              sourceId: `file:${sourceFile.relativeFilePath}`,
              targetId: targetSymbol.id,
              kind: 'imports',
              evidence: `Imported "${spec.importedName}" from ${importDecl.source}`
            });
          }
        }
      }
    }
  }

  private findTargetSymbol(targetFile: FileEntity, importedName: string): SymbolEntity | undefined {
    if (importedName === 'default') {
      return targetFile.symbols.find(s => s.isDefaultExport) || targetFile.symbols.find(s => s.isExported);
    }
    return targetFile.symbols.find(s => s.name === importedName && s.isExported) ||
           targetFile.symbols.find(s => s.name === importedName);
  }

  private resolveImport(sourceRelativePath: string, importSpecifier: string): string | undefined {
    // 1. Handle relative imports: ./ or ../
    if (importSpecifier.startsWith('.')) {
      const sourceDir = path.dirname(sourceRelativePath);
      const combined = path.posix.normalize(path.posix.join(sourceDir.replace(/\\/g, '/'), importSpecifier));

      const candidates = [
        combined,
        `${combined}.ts`,
        `${combined}.tsx`,
        `${combined}.js`,
        `${combined}.jsx`,
        `${combined}/index.ts`,
        `${combined}/index.tsx`,
        `${combined}/index.js`
      ];

      for (const cand of candidates) {
        if (this.index.getFileByRelativePath(cand)) {
          return cand;
        }
      }
    }

    // 2. Handle workspace package aliases, e.g. @projectbrain/shared -> packages/shared/src/index.ts
    if (importSpecifier.startsWith('@projectbrain/')) {
      const pkgName = importSpecifier.replace('@projectbrain/', '');
      const candidates = [
        `packages/${pkgName}/src/index.ts`,
        `packages/${pkgName}/src/index.tsx`,
        `packages/${pkgName}/src/index.js`,
        `template-pack/src/index.ts`,
        `apps/${pkgName}/src/index.ts`,
        `apps/${pkgName}/src/extension.ts`
      ];

      for (const cand of candidates) {
        if (this.index.getFileByRelativePath(cand)) {
          return cand;
        }
      }
    }

    return undefined;
  }
}
