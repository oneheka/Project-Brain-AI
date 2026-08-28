export class ParserRegistry {
    parsers = new Map();
    registerParser(parser) {
        for (const ext of parser.supportedExtensions) {
            this.parsers.set(ext.toLowerCase(), parser);
        }
    }
    getParserForFile(filePath) {
        const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
        return this.parsers.get(ext);
    }
}
export const defaultParserRegistry = new ParserRegistry();
//# sourceMappingURL=index.js.map