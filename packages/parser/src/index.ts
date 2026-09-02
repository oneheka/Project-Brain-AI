import type { FileEntity } from '@projectbrain/shared';
import { TypeScriptParser } from './typescript-parser';

export interface CodeParser {
  supportedExtensions: string[];
  parseFile(filePath: string, content: string, relativePath?: string): Promise<FileEntity>;
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

  getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }
}

export const defaultParserRegistry = new ParserRegistry();
defaultParserRegistry.registerParser(new TypeScriptParser());

export { TypeScriptParser };
