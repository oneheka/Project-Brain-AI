import * as vscode from 'vscode';
import * as path from 'node:path';
import { CoreBridge } from '../core-bridge';
import type { ArchitectureLayer, FileEntity, SymbolEntity } from '@projectbrain/shared';

export type ArchTreeItem = LayerTreeItem | FileTreeItem | SymbolTreeItem;

export class ArchitectureTreeProvider implements vscode.TreeDataProvider<ArchTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ArchTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ArchTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ArchTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    CoreBridge.onDidReindex(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ArchTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ArchTreeItem): Promise<ArchTreeItem[]> {
    const core = CoreBridge.getCore();
    if (!core) return [];

    await CoreBridge.ensureIndexed();

    if (!element) {
      // Root: Architecture Layers
      const archModel = core.detectArchitecture();
      if (archModel.layers.length === 0) {
        return [new LayerTreeItem({
          type: 'shared',
          name: 'No architecture layers detected yet',
          confidence: 0,
          files: [],
          entryPoints: [],
          evidence: []
        })];
      }

      return archModel.layers.map(layer => new LayerTreeItem(layer));
    }

    if (element instanceof LayerTreeItem) {
      // Level 1: Files in this layer
      const items: FileTreeItem[] = [];
      for (const relPath of element.layer.files) {
        const fileEntity = core.index.getFileByRelativePath(relPath);
        if (fileEntity) {
          const isEntryPoint = element.layer.entryPoints.includes(relPath);
          items.push(new FileTreeItem(fileEntity, core.workspace.rootPath, isEntryPoint));
        }
      }
      return items;
    }

    if (element instanceof FileTreeItem) {
      // Level 2: Symbols in this file
      return element.file.symbols
        .filter(s => s.isExported || s.kind === 'class' || s.kind === 'function')
        .map(s => new SymbolTreeItem(s, element.file, core.workspace.rootPath));
    }

    return [];
  }
}

class LayerTreeItem extends vscode.TreeItem {
  constructor(public readonly layer: ArchitectureLayer) {
    super(
      layer.name,
      layer.files.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    this.description = `${layer.files.length} files`;
    this.tooltip = layer.evidence.join('\n');

    let iconName = 'layers';
    switch (layer.type) {
      case 'frontend': iconName = 'browser'; break;
      case 'backend': iconName = 'server-process'; break;
      case 'auth': iconName = 'shield'; break;
      case 'database': iconName = 'database'; break;
      case 'api': iconName = 'symbol-interface'; break;
      case 'shared': iconName = 'package'; break;
    }
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly file: FileEntity,
    workspaceRoot: string,
    isEntryPoint: boolean
  ) {
    super(
      path.basename(file.relativeFilePath),
      file.symbols.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    this.description = `${path.dirname(file.relativeFilePath)} ${isEntryPoint ? '⭐ [entry]' : ''}`;
    this.iconPath = new vscode.ThemeIcon(isEntryPoint ? 'file-code' : 'file');
    this.tooltip = `${file.relativeFilePath}\n${file.linesCount} lines, ${file.symbols.length} symbols`;

    this.command = {
      command: 'projectbrain.openFile',
      title: 'Open File',
      arguments: [path.join(workspaceRoot, file.relativeFilePath), 1]
    };
  }
}

class SymbolTreeItem extends vscode.TreeItem {
  constructor(
    public readonly symbol: SymbolEntity,
    file: FileEntity,
    workspaceRoot: string
  ) {
    super(symbol.name, vscode.TreeItemCollapsibleState.None);

    this.description = `${symbol.kind} ${symbol.signature ? symbol.signature : ''}`;

    let iconName = 'symbol-property';
    if (symbol.kind === 'function' || symbol.kind === 'method') iconName = 'symbol-function';
    else if (symbol.kind === 'class') iconName = 'symbol-class';
    else if (symbol.kind === 'interface' || symbol.kind === 'type') iconName = 'symbol-interface';
    else if (symbol.kind === 'variable' || symbol.kind === 'constant') iconName = 'symbol-variable';

    this.iconPath = new vscode.ThemeIcon(iconName);

    this.command = {
      command: 'projectbrain.openFile',
      title: 'Open Symbol',
      arguments: [path.join(workspaceRoot, file.relativeFilePath), symbol.span.startLine]
    };
  }
}
