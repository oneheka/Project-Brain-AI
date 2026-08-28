import type { FileEntity, SymbolEntity } from '@projectbrain/shared';

export interface IndexerOptions {
  workspaceRoot: string;
  include: string[];
  exclude: string[];
}

export class CodebaseIndex {
  private files = new Map<string, FileEntity>();
  private symbols = new Map<string, SymbolEntity>();

  addFile(file: FileEntity): void {
    this.files.set(file.filePath, file);
    for (const sym of file.symbols) {
      this.symbols.set(sym.id, sym);
    }
  }

  getFile(filePath: string): FileEntity | undefined {
    return this.files.get(filePath);
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
}
