import type { FileEntity } from '@projectbrain/shared';
export interface CodeParser {
    supportedExtensions: string[];
    parseFile(filePath: string, content: string): Promise<FileEntity>;
}
export declare class ParserRegistry {
    private parsers;
    registerParser(parser: CodeParser): void;
    getParserForFile(filePath: string): CodeParser | undefined;
}
export declare const defaultParserRegistry: ParserRegistry;
//# sourceMappingURL=index.d.ts.map