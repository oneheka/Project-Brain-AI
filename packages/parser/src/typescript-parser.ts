import * as ts from 'typescript';
import type {
  FileEntity,
  SymbolEntity,
  SymbolKind,
  ImportDeclaration,
  ExportDeclaration,
  LocationSpan
} from '@projectbrain/shared';
import type { CodeParser } from './index';

export class TypeScriptParser implements CodeParser {
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

  async parseFile(filePath: string, content: string, relativePath?: string): Promise<FileEntity> {
    const relPath = relativePath || filePath.replace(/\\/g, '/');
    const ext = this.getFileExtension(filePath);
    const scriptKind = this.getScriptKind(ext);

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const symbols: SymbolEntity[] = [];
    const imports: ImportDeclaration[] = [];
    const exports: ExportDeclaration[] = [];

    const lines = content.split('\n');
    const linesCount = lines.length;
    const sizeBytes = Buffer.byteLength(content, 'utf8');

    const getSpan = (node: ts.Node): LocationSpan => {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      return {
        startLine: start.line + 1,
        startColumn: start.character + 1,
        endLine: end.line + 1,
        endColumn: end.character + 1
      };
    };

    const hasExportModifier = (node: ts.Node): boolean => {
      if (!ts.canHaveModifiers(node)) return false;
      const modifiers = ts.getModifiers(node);
      return modifiers ? modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) : false;
    };

    const hasDefaultModifier = (node: ts.Node): boolean => {
      if (!ts.canHaveModifiers(node)) return false;
      const modifiers = ts.getModifiers(node);
      return modifiers ? modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) : false;
    };

    const containsJsx = (node: ts.Node): boolean => {
      let found = false;
      const visitJsx = (n: ts.Node) => {
        if (found) return;
        if (
          n.kind === ts.SyntaxKind.JsxElement ||
          n.kind === ts.SyntaxKind.JsxSelfClosingElement ||
          n.kind === ts.SyntaxKind.JsxFragment
        ) {
          found = true;
          return;
        }
        ts.forEachChild(n, visitJsx);
      };
      visitJsx(node);
      return found;
    };

    const visit = (node: ts.Node) => {
      // 1. Imports
      if (ts.isImportDeclaration(node)) {
        const span = getSpan(node);
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const specifiers: ImportDeclaration['specifiers'] = [];

        if (node.importClause) {
          if (node.importClause.name) {
            specifiers.push({
              importedName: 'default',
              localName: node.importClause.name.text,
              isDefault: true,
              isTypeOnly: node.importClause.isTypeOnly
            });
          }

          if (node.importClause.namedBindings) {
            if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              specifiers.push({
                importedName: '*',
                localName: node.importClause.namedBindings.name.text,
                isNamespace: true,
                isTypeOnly: node.importClause.isTypeOnly
              });
            } else if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const element of node.importClause.namedBindings.elements) {
                specifiers.push({
                  importedName: element.propertyName ? element.propertyName.text : element.name.text,
                  localName: element.name.text,
                  isTypeOnly: node.importClause.isTypeOnly || element.isTypeOnly
                });
              }
            }
          }
        }

        imports.push({
          source: moduleSpecifier,
          specifiers,
          span
        });
      }

      // 2. Export Declarations (e.g. export { a, b } from './module')
      else if (ts.isExportDeclaration(node)) {
        const span = getSpan(node);
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            exports.push({
              name: el.name.text,
              isDefault: false,
              isTypeOnly: node.isTypeOnly || el.isTypeOnly,
              span
            });
          }
        }
      }

      // 3. Export Assignment (e.g. export default myFunction)
      else if (ts.isExportAssignment(node)) {
        const span = getSpan(node);
        const exprName = ts.isIdentifier(node.expression) ? node.expression.text : 'default';
        exports.push({
          name: exprName,
          isDefault: true,
          span
        });
      }

      // 4. Function Declarations
      else if (ts.isFunctionDeclaration(node)) {
        const name = node.name ? node.name.text : 'anonymous';
        const span = getSpan(node);
        const isExported = hasExportModifier(node);
        const isDefault = hasDefaultModifier(node);

        let kind: SymbolKind = 'function';
        if (/^[A-Z]/.test(name) && containsJsx(node)) {
          kind = 'component';
        } else if (/^use[A-Z0-9]/.test(name)) {
          kind = 'hook';
        }

        const id = `symbol:${relPath}:${name}:${span.startLine}`;
        symbols.push({
          id,
          name,
          kind,
          filePath: relPath,
          span,
          isExported,
          isDefaultExport: isDefault,
          referencesCount: 0,
          signature: this.extractSignature(node, sourceFile)
        });

        if (isExported) {
          exports.push({
            name,
            isDefault,
            span
          });
        }
      }

      // 5. Class Declarations
      else if (ts.isClassDeclaration(node)) {
        const name = node.name ? node.name.text : 'anonymous';
        const span = getSpan(node);
        const isExported = hasExportModifier(node);
        const isDefault = hasDefaultModifier(node);

        const id = `symbol:${relPath}:${name}:${span.startLine}`;
        symbols.push({
          id,
          name,
          kind: 'class',
          filePath: relPath,
          span,
          isExported,
          isDefaultExport: isDefault,
          referencesCount: 0
        });

        if (isExported) {
          exports.push({
            name,
            isDefault,
            span
          });
        }

        // Methods inside class
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
            const methodName = member.name.text;
            const methodSpan = getSpan(member);
            symbols.push({
              id: `symbol:${relPath}:${name}.${methodName}:${methodSpan.startLine}`,
              name: `${name}.${methodName}`,
              kind: 'method',
              filePath: relPath,
              span: methodSpan,
              isExported: false,
              referencesCount: 0,
              signature: this.extractSignature(member, sourceFile)
            });
          }
        }
      }

      // 6. Interface Declarations
      else if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text;
        const span = getSpan(node);
        const isExported = hasExportModifier(node);
        const isDefault = hasDefaultModifier(node);

        const id = `symbol:${relPath}:${name}:${span.startLine}`;
        symbols.push({
          id,
          name,
          kind: 'interface',
          filePath: relPath,
          span,
          isExported,
          isDefaultExport: isDefault,
          referencesCount: 0
        });

        if (isExported) {
          exports.push({
            name,
            isDefault,
            isTypeOnly: true,
            span
          });
        }
      }

      // 7. Type Alias Declarations
      else if (ts.isTypeAliasDeclaration(node)) {
        const name = node.name.text;
        const span = getSpan(node);
        const isExported = hasExportModifier(node);
        const isDefault = hasDefaultModifier(node);

        const id = `symbol:${relPath}:${name}:${span.startLine}`;
        symbols.push({
          id,
          name,
          kind: 'type',
          filePath: relPath,
          span,
          isExported,
          isDefaultExport: isDefault,
          referencesCount: 0
        });

        if (isExported) {
          exports.push({
            name,
            isDefault,
            isTypeOnly: true,
            span
          });
        }
      }

      // 8. Variable Statements (const / let / var)
      else if (ts.isVariableStatement(node)) {
        const isExported = hasExportModifier(node);
        const isDefault = hasDefaultModifier(node);
        const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;

        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            const name = decl.name.text;
            const span = getSpan(decl);

            let kind: SymbolKind = isConst ? 'constant' : 'variable';

            if (decl.initializer) {
              if (
                ts.isArrowFunction(decl.initializer) ||
                ts.isFunctionExpression(decl.initializer)
              ) {
                if (/^[A-Z]/.test(name) && containsJsx(decl.initializer)) {
                  kind = 'component';
                } else if (/^use[A-Z0-9]/.test(name)) {
                  kind = 'hook';
                } else {
                  kind = 'function';
                }
              }
            }

            const id = `symbol:${relPath}:${name}:${span.startLine}`;
            symbols.push({
              id,
              name,
              kind,
              filePath: relPath,
              span,
              isExported,
              isDefaultExport: isDefault,
              referencesCount: 0,
              signature: decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
                ? this.extractSignature(decl.initializer, sourceFile)
                : undefined
            });

            if (isExported) {
              exports.push({
                name,
                isDefault,
                span
              });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      filePath,
      relativeFilePath: relPath,
      extension: ext,
      sizeBytes,
      linesCount,
      symbols,
      imports,
      exports,
      lastModifiedMs: Date.now()
    };
  }

  private extractSignature(
    node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression,
    sourceFile: ts.SourceFile
  ): string {
    try {
      const params = node.parameters
        .map(p => p.getText(sourceFile))
        .join(', ');
      const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
      return `(${params})${returnType}`;
    } catch {
      return '() => unknown';
    }
  }

  private getFileExtension(filePath: string): string {
    const idx = filePath.lastIndexOf('.');
    return idx >= 0 ? filePath.slice(idx).toLowerCase() : '';
  }

  private getScriptKind(ext: string): ts.ScriptKind {
    switch (ext) {
      case '.tsx':
        return ts.ScriptKind.TSX;
      case '.jsx':
        return ts.ScriptKind.JSX;
      case '.ts':
        return ts.ScriptKind.TS;
      case '.js':
      case '.mjs':
      case '.cjs':
        return ts.ScriptKind.JS;
      default:
        return ts.ScriptKind.Unknown;
    }
  }
}
