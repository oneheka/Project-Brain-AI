import type { FileEntity } from '@projectbrain/shared';

export interface CodeParser {
  supportedExtensions: string[];
  parseFile(filePath: string, content: string): Promise<FileEntity>;
}

export class ParserRegistry {
  private parsers = new Map<string, CodeParser>();

  registerParser(parser: CodeParser): void {
    for (const ext of parser.supportedExtensions) {
      this.parsers.set(ext.toLowerCase(), parser);
    }
  }

  getParserForFile(filePath: string): CodeParser | undefined {
    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
    return this.parsers.get(ext);
  }
}

export const defaultParserRegistry = new ParserRegistry();
