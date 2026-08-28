export class CodebaseIndex {
    files = new Map();
    symbols = new Map();
    addFile(file) {
        this.files.set(file.filePath, file);
        for (const sym of file.symbols) {
            this.symbols.set(sym.id, sym);
        }
    }
    getFile(filePath) {
        return this.files.get(filePath);
    }
    getSymbol(symbolId) {
        return this.symbols.get(symbolId);
    }
    getAllFiles() {
        return Array.from(this.files.values());
    }
    getAllSymbols() {
        return Array.from(this.symbols.values());
    }
}
//# sourceMappingURL=index.js.map