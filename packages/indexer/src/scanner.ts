import * as fs from 'node:fs';
import * as path from 'node:path';
import type { IndexerOptions } from './index';

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
}

export class WorkspaceScanner {
  private workspaceRoot: string;
  private includePatterns: string[];
  private excludePatterns: string[];
  private ignoredPatterns: string[] = [];

  private defaultExcludedDirs = new Set([
    'node_modules',
    '.git',
    '.vscode',
    '.vscode-test',
    'dist',
    'out',
    'build',
    '.projectbrain',
    '.agents',
    '.turbo',
    '.next',
    '.nuxt',
    'coverage',
    'temp',
    'tmp'
  ]);

  constructor(options: IndexerOptions) {
    this.workspaceRoot = path.resolve(options.workspaceRoot);
    this.includePatterns = options.include || [];
    this.excludePatterns = options.exclude || [];
    this.loadIgnoreFiles();
  }

  private loadIgnoreFiles(): void {
    const ignoreFiles = ['.gitignore', '.projectbrainignore'];
    for (const file of ignoreFiles) {
      const fullPath = path.join(this.workspaceRoot, file);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
          this.ignoredPatterns.push(...lines);
        } catch {
          // Ignore read errors
        }
      }
    }
  }

  async scan(): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];
    await this.walkDirectory(this.workspaceRoot, files);
    return files;
  }

  private async walkDirectory(currentDir: string, results: ScannedFile[]): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(this.workspaceRoot, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (this.shouldIgnoreDirectory(entry.name, relativePath)) {
          continue;
        }
        await this.walkDirectory(fullPath, results);
      } else if (entry.isFile()) {
        if (this.shouldIncludeFile(entry.name, relativePath, fullPath)) {
          try {
            const stat = await fs.promises.stat(fullPath);
            // Skip files larger than 1.5MB
            if (stat.size <= 1.5 * 1024 * 1024) {
              const ext = path.extname(entry.name).toLowerCase();
              results.push({
                absolutePath: fullPath,
                relativePath,
                extension: ext,
                sizeBytes: stat.size
              });
            }
          } catch {
            // Ignore stat errors
          }
        }
      }
    }
  }

  private shouldIgnoreDirectory(dirName: string, relativePath: string): boolean {
    if (this.defaultExcludedDirs.has(dirName)) {
      return true;
    }

    if (dirName.startsWith('.')) {
      return true;
    }

    for (const pattern of this.excludePatterns) {
      if (this.matchSimplePattern(relativePath, pattern)) {
        return true;
      }
    }

    for (const pattern of this.ignoredPatterns) {
      const cleanPattern = pattern.replace(/\/$/, '');
      if (cleanPattern === dirName || this.matchSimplePattern(relativePath, cleanPattern)) {
        return true;
      }
    }

    return false;
  }

  private shouldIncludeFile(fileName: string, relativePath: string, _fullPath: string): boolean {
    // Exclude common binary / lock / non-code extensions
    const ext = path.extname(fileName).toLowerCase();
    const binaryExts = new Set([
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot',
      '.zip', '.tar', '.gz', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.db', '.sqlite', '.sqlite3',
      '.pdf', '.mp4', '.mp3', '.wasm'
    ]);

    if (fileName.endsWith('.d.ts') || fileName.endsWith('.map') || fileName.endsWith('.tsbuildinfo')) {
      return false;
    }

    if (binaryExts.has(ext)) {
      return false;
    }

    // Skip compiled JS if corresponding TS/TSX source file exists
    if (ext === '.js' || ext === '.jsx') {
      const tsPath = _fullPath.replace(/\.jsx?$/, ext === '.jsx' ? '.tsx' : '.ts');
      if (fs.existsSync(tsPath)) {
        return false;
      }
    }

    // Check excludes
    for (const pattern of this.excludePatterns) {
      if (this.matchSimplePattern(relativePath, pattern)) {
        return false;
      }
    }

    for (const pattern of this.ignoredPatterns) {
      if (this.matchSimplePattern(relativePath, pattern)) {
        return false;
      }
    }

    // Check includes
    if (this.includePatterns.length > 0) {
      return this.includePatterns.some(p => this.matchSimplePattern(relativePath, p));
    }

    return true;
  }

  private matchSimplePattern(filePath: string, pattern: string): boolean {
    const cleanPattern = pattern.trim().replace(/^\//, '').replace(/\\/g, '/');
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!cleanPattern) return false;

    // Match all wildcards
    if (cleanPattern === '**/*' || cleanPattern === '**' || cleanPattern === '*' || cleanPattern === '*.*') {
      return true;
    }

    if (cleanPattern.endsWith('/**')) {
      const prefix = cleanPattern.slice(0, -3);
      return normalizedPath === prefix || normalizedPath.startsWith(prefix + '/');
    }

    if (cleanPattern.startsWith('**/')) {
      const suffix = cleanPattern.slice(3);
      if (suffix === '*' || suffix === '**' || suffix === '*.*') return true;
      if (suffix.startsWith('*.')) {
        return normalizedPath.endsWith(suffix.slice(1));
      }
      return normalizedPath.endsWith(suffix) || normalizedPath.includes('/' + suffix);
    }

    if (cleanPattern.startsWith('*.')) {
      const ext = cleanPattern.slice(1);
      return normalizedPath.endsWith(ext);
    }

    if (cleanPattern.endsWith('/*')) {
      const prefix = cleanPattern.slice(0, -2);
      return normalizedPath.startsWith(prefix + '/');
    }

    return normalizedPath === cleanPattern || normalizedPath.startsWith(cleanPattern + '/');
  }
}
