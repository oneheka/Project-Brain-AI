import type { FileEntity, SymbolEntity, SymbolKind } from '@projectbrain/shared';

export interface IndexerOptions {
  workspaceRoot: string;
  include?: string[];
  exclude?: string[];
}

export interface CodebaseStats {
  filesCount: number;
  symbolsCount: number;
  totalLines: number;
  totalSizeBytes: number;
  symbolsByKind: Record<string, number>;
}

export class CodebaseIndex {
  private files = new Map<string, FileEntity>();
  private filesByRelativePath = new Map<string, FileEntity>();
  private symbols = new Map<string, SymbolEntity>();

  addFile(file: FileEntity): void {
    const cleanRelPath = file.relativeFilePath.replace(/\\/g, '/');
    this.files.set(file.filePath, file);
    this.filesByRelativePath.set(cleanRelPath, file);

    for (const sym of file.symbols) {
      this.symbols.set(sym.id, sym);
    }
  }

  getFile(filePath: string): FileEntity | undefined {
    return this.files.get(filePath);
  }

  getFileByRelativePath(relativePath: string): FileEntity | undefined {
    const clean = relativePath.replace(/\\/g, '/');
    return this.filesByRelativePath.get(clean);
  }

  getSymbol(symbolId: string): SymbolEntity | undefined {
    return this.symbols.get(symbolId);
  }

  getAllFiles(): FileEntity[] {
    return Array.from(this.files.values());
  }

  getAllSymbols(): SymbolEntity[] {
    return Array.from(this.symbols.values());
  }

  findSymbolsByName(name: string): SymbolEntity[] {
    return Array.from(this.symbols.values()).filter(s => s.name === name);
  }

  findSymbolsByKind(kind: SymbolKind): SymbolEntity[] {
    return Array.from(this.symbols.values()).filter(s => s.kind === kind);
  }

  getExportedSymbols(filePath?: string): SymbolEntity[] {
    if (filePath) {
      const file = this.getFile(filePath) || this.getFileByRelativePath(filePath);
      return file ? file.symbols.filter(s => s.isExported) : [];
    }
    return Array.from(this.symbols.values()).filter(s => s.isExported);
  }

  findFilesByPattern(pattern: RegExp): FileEntity[] {
    return Array.from(this.files.values()).filter(f =>
      pattern.test(f.relativeFilePath) || pattern.test(f.filePath)
    );
  }

  getStats(): CodebaseStats {
    let totalLines = 0;
    let totalSizeBytes = 0;
    const symbolsByKind: Record<string, number> = {};

    for (const file of this.files.values()) {
      totalLines += file.linesCount;
      totalSizeBytes += file.sizeBytes;
    }

    for (const sym of this.symbols.values()) {
      symbolsByKind[sym.kind] = (symbolsByKind[sym.kind] || 0) + 1;
    }

    return {
      filesCount: this.files.size,
      symbolsCount: this.symbols.size,
      totalLines,
      totalSizeBytes,
      symbolsByKind
    };
  }

  clear(): void {
    this.files.clear();
    this.filesByRelativePath.clear();
    this.symbols.clear();
  }
}

export * from './scanner';
export * from './indexing-pipeline';
