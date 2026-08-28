import type { FileEntity, SymbolEntity } from '@projectbrain/shared';
export interface IndexerOptions {
    workspaceRoot: string;
    include: string[];
    exclude: string[];
}
export declare class CodebaseIndex {
    private files;
    private symbols;
    addFile(file: FileEntity): void;
    getFile(filePath: string): FileEntity | undefined;
    getSymbol(symbolId: string): SymbolEntity | undefined;
    getAllFiles(): FileEntity[];
    getAllSymbols(): SymbolEntity[];
}
//# sourceMappingURL=index.d.ts.map