import type { ProjectConvention } from '@projectbrain/shared';
import type { CodebaseIndex } from '@projectbrain/indexer';

export class ConventionDetector {
  detect(index: CodebaseIndex): ProjectConvention[] {
    const files = index.getAllFiles();
    const symbols = index.getAllSymbols();
    const conventions: ProjectConvention[] = [];

    if (files.length === 0) return conventions;

    // 1. Export Pattern Detection (Named vs Default)
    let namedExportsCount = 0;
    let defaultExportsCount = 0;

    for (const f of files) {
      for (const exp of f.exports) {
        if (exp.isDefault) defaultExportsCount++;
        else namedExportsCount++;
      }
    }

    const totalExports = namedExportsCount + defaultExportsCount;
    if (totalExports > 0) {
      const namedRatio = namedExportsCount / totalExports;
      if (namedRatio >= 0.7) {
        conventions.push({
          id: 'conv:exports:named',
          category: 'exports',
          title: 'Prefer Named Exports',
          description: `The codebase consistently uses named exports (${Math.round(namedRatio * 100)}% of all exports). Avoid default exports except for entry points.`,
          status: 'detected',
          evidenceCount: namedExportsCount
        });
      } else if (namedRatio <= 0.3) {
        conventions.push({
          id: 'conv:exports:default',
          category: 'exports',
          title: 'Prefer Default Exports',
          description: `The codebase predominantly uses default exports (${Math.round((1 - namedRatio) * 100)}%).`,
          status: 'detected',
          evidenceCount: defaultExportsCount
        });
      }
    }

    // 2. Type-Only Imports
    let typeOnlyImports = 0;
    let regularImports = 0;

    for (const f of files) {
      for (const imp of f.imports) {
        for (const spec of imp.specifiers) {
          if (spec.isTypeOnly) typeOnlyImports++;
          else regularImports++;
        }
      }
    }

    if (typeOnlyImports > 5) {
      conventions.push({
        id: 'conv:imports:type-only',
        category: 'imports',
        title: 'Use Explicit Type Imports',
        description: `Use 'import type { ... }' when importing TypeScript types and interfaces to optimize bundle output.`,
        status: 'detected',
        evidenceCount: typeOnlyImports
      });
    }

    // 3. Naming Conventions: Functions & Constants
    let camelCaseFuncs = 0;
    let totalFuncs = 0;
    let upperSnakeConstants = 0;
    let totalConstants = 0;

    for (const sym of symbols) {
      if (sym.kind === 'function' || sym.kind === 'method') {
        totalFuncs++;
        if (/^[a-z][a-zA-Z0-9]*$/.test(sym.name) || sym.name.includes('.')) {
          camelCaseFuncs++;
        }
      } else if (sym.kind === 'constant') {
        totalConstants++;
        if (/^[A-Z][A-Z0-9_]*$/.test(sym.name)) {
          upperSnakeConstants++;
        }
      }
    }

    if (totalFuncs > 5 && camelCaseFuncs / totalFuncs >= 0.8) {
      conventions.push({
        id: 'conv:naming:functions-camelcase',
        category: 'naming',
        title: 'camelCase Function & Method Naming',
        description: 'All functions and methods must use camelCase naming (e.g. calculateHealthScore, parseFile).',
        status: 'detected',
        evidenceCount: camelCaseFuncs
      });
    }

    if (totalConstants > 5 && upperSnakeConstants / totalConstants >= 0.6) {
      conventions.push({
        id: 'conv:naming:constants-uppersnake',
        category: 'naming',
        title: 'UPPER_SNAKE_CASE for Global Constants',
        description: 'Global static constants and regex configurations use UPPER_SNAKE_CASE.',
        status: 'detected',
        evidenceCount: upperSnakeConstants
      });
    }

    // 4. File & Module Structure
    const hasMonorepoPackages = files.some(f => f.relativeFilePath.startsWith('packages/'));
    if (hasMonorepoPackages) {
      conventions.push({
        id: 'conv:structure:monorepo-packages',
        category: 'structure',
        title: 'Modular Monorepo Structure',
        description: 'Domain logic is organized into decoupled workspace packages under packages/* with explicit entry points in src/index.ts.',
        status: 'detected',
        evidenceCount: files.filter(f => f.relativeFilePath.startsWith('packages/')).length
      });
    }

    return conventions;
  }

  toPromptStrings(conventions: ProjectConvention[]): string[] {
    return conventions.map(c => `[${c.category.toUpperCase()}] ${c.title}: ${c.description}`);
  }
}
